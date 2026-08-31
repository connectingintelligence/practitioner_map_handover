// ─────────────────────────────────────────────────────────────
//  PRACTITIONER MAP, live Sheet loader
//
//  The map's source of truth is a Google Sheet the Pocket Project owns,
//  published to the web as CSV. This fetches and parses it, and falls back to
//  the snapshot bundled with the app when it cannot.
//
//  Deliberately not reading WordPress: their site is being restructured and a
//  pipeline pointed at it would break. See docs/COLUMN_SPEC.md.
// ─────────────────────────────────────────────────────────────

import { CONFIG } from './practitioner-config.js';

// The columns the map understands. Anything else in the Sheet is ignored, so
// the team can keep working notes in extra columns without breaking anything.
const FIELDS = [
  'id', 'network', 'name', 'scale', 'format', 'language', 'city', 'country',
  'iso2', 'lat', 'lng', 'status', 'visible', 'facilitator', 'url',
  'description', 'field_country',
];

// RFC 4180 style. Handles quoted fields containing commas, doubled quotes and
// newlines, which matter because descriptions are free text written by people.
export function parseCsv(text) {
  const rows = [];
  let row = [], field = '', inQuotes = false, i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQuotes = false; i++; continue;
      }
      field += ch; i++; continue;
    }
    if (ch === '"') { inQuotes = true; i++; continue; }
    if (ch === ',') { row.push(field); field = ''; i++; continue; }
    if (ch === '\r') { i++; continue; }
    if (ch === '\n') { row.push(field); field = ''; rows.push(row); row = []; i++; continue; }
    field += ch; i++;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((c) => String(c).trim() !== ''));
}

const token = (v) => String(v == null ? '' : v).trim().toLowerCase().replace(/[\s-]+/g, '_');

function num(v) {
  if (v == null || String(v).trim() === '') return null;
  const n = Number(String(v).trim().replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

// Empty means shown. Only an explicit negative hides a row, so a typo in that
// column can never make a group silently disappear.
function visibility(v) {
  const t = token(v);
  if (['false', 'no', 'n', '0', 'hidden'].includes(t)) return false;
  if (['true', 'yes', 'y', '1', 'x'].includes(t)) return true;
  return null;
}

export function csvToGroups(text) {
  const rows = parseCsv(text);
  if (rows.length < 2) throw new Error('the CSV has no data rows');
  const header = rows[0].map((h) => String(h).trim().toLowerCase());
  const idx = Object.fromEntries(FIELDS.map((f) => [f, header.indexOf(f)]));
  for (const required of ['id', 'network', 'name']) {
    if (idx[required] === -1) throw new Error(`the CSV has no "${required}" column`);
  }

  const groups = [];
  for (let r = 1; r < rows.length; r++) {
    const raw = rows[r];
    const g = {};
    for (const f of FIELDS) {
      g[f] = idx[f] >= 0 && raw[idx[f]] != null ? String(raw[idx[f]]).trim() : '';
    }
    if (!g.id && !g.name) continue;

    // Normalise the vocabulary the same way the pipeline does, so a human
    // typing "In Person" into the Sheet behaves like "in_person".
    g.network = token(g.network);
    g.format = token(g.format);
    g.status = token(g.status);
    g.scale = token(g.scale) || 'global';
    g.iso2 = g.iso2.toUpperCase();
    g.field_country = g.field_country.toUpperCase();
    g.lat = num(g.lat);
    g.lng = num(g.lng);
    g.visible = visibility(g.visible);
    groups.push(g);
  }
  if (!groups.length) throw new Error('the CSV parsed to zero groups');
  return groups;
}

async function fetchWithTimeout(url, seconds) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), seconds * 1000);
  try {
    const res = await fetch(url, { cache: 'no-cache', signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Returns { groups, source, error }.
 *   source 'sheet'  the live Google Sheet
 *   source 'bundle' the snapshot shipped with the app
 * `error` is set when the Sheet was configured but could not be used, so the
 * caller can say so in the console without alarming a visitor.
 */
export async function loadGroups(bundlePath = 'data/practitioner_groups.json') {
  const url = String(CONFIG.SHEET_CSV_URL || '').trim();

  const bundle = async (error) => {
    // 'no-cache' means revalidate, not "do not cache": the browser still keeps
    // the file and a 304 costs nothing, but it can never serve a stale copy.
    //
    // This was 'force-cache', which tells the browser to use whatever it has
    // regardless of age and never ask the server. The snapshot was therefore
    // pinned to whichever version happened to be cached first, and a rebuild
    // of the data had no effect on the running map. Even a hard reload did not
    // reliably clear it, because the instruction is in the fetch call rather
    // than in the page load. Group data changes; it must not be pinned.
    const res = await fetch(bundlePath, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`the bundled data could not be read (HTTP ${res.status})`);
    const data = await res.json();
    const groups = (data && data.groups) || [];
    return { groups, source: 'bundle', error };
  };

  if (!url) return bundle(null);

  try {
    const text = await fetchWithTimeout(url, CONFIG.SHEET_TIMEOUT_SECONDS);
    return { groups: csvToGroups(text), source: 'sheet', error: null };
  } catch (err) {
    if (!CONFIG.FALL_BACK_TO_BUNDLE) throw err;
    return bundle(err);
  }
}
