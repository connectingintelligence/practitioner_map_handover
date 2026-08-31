// ─────────────────────────────────────────────────────────────
//  PRACTITIONER MAP, entry point
//
//  A thin host: the Atlas globe engine plus the practitioner-networks
//  layer plus the Atlas chrome. It deliberately does not boot the intro
//  flow, the layer panel, the time scrubber, the weighting panel or any
//  entanglement layer, none of which belong on a community map embedded
//  in a content page.
//
//  The layer itself is a normal Atlas layer module, so adding practitioner
//  networks to the full Atlas later means listing its path there. Nothing
//  in this file has to move.
// ─────────────────────────────────────────────────────────────

import { createGlobe } from './core/projection.js';
import { applyTheme } from './core/theme.js';
import { loadJSON, loadCountryMeta } from './core/data-loader.js';
import { loadGroups } from './practitioner-sheet.js';
import layerModule from './layers/practitioner-networks/index.js';

const $ = (s) => document.querySelector(s);

// Bumped whenever this file changes in a way worth seeing. It is printed to the
// console and stamped under the title, because three separate debugging rounds
// on 27 August were spent on a browser quietly running an old copy of this file
// against new markup. If the stamp on screen is not the one below, the page is
// stale and nothing else you are looking at can be trusted.
const BUILD = '2026-08-31a · legend trimmed';

// ── read the embed parameters ──
// ?layer= opens showing one network, ?country= narrows and zooms to one
// country. Both are optional, both fail softly, and both are what lets a
// page be pointed anywhere without touching these files.
function readParams(networks) {
  const q = new URLSearchParams(location.search);
  const rawL = String(q.get('layer') || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
  const layer = networks.some((n) => n.key === rawL) ? rawL : null;
  const rawC = String(q.get('country') || '').trim().toUpperCase();
  return { layer, country: /^[A-Z]{2}$/.test(rawC) ? rawC : null };
}

// Which language to offer a translation in. A group published only in
// Ukrainian keeps its own name as the title; this is what goes underneath it.
const LANG = (() => {
  const q = new URLSearchParams(location.search).get('lang');
  if (q && /^(en|de)$/i.test(q)) return q.toLowerCase();
  return (navigator.language || 'en').toLowerCase().startsWith('de') ? 'de' : 'en';
})();

// The translated name, when the original is not already in the reader's script.
function translationOf(g) {
  const t = i18n[g.id];
  if (!t) return '';
  const alt = t[LANG];
  if (!alt) return '';
  // If the published name already contains the translation, adding it twice
  // would just be noise (a few groups publish both, separated by a slash).
  return g.name.toLowerCase().includes(alt.toLowerCase()) ? '' : alt;
}

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g,
  (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const LABEL = {
  online: 'Online', in_person: 'In person', hybrid: 'Hybrid',
  open: 'Open for new members', closed: 'Currently closed',
  applications_closed: 'Applications closed',
};

// An online group is pinned to the city it is run from, which is usually where
// a facilitator lives rather than anywhere you could turn up. Saying plainly
// which of the two a place is costs one word and avoids sending someone across
// a city to a meeting that only exists on a video call.
// A city keeps its local spelling only when the rest of the line is in the same
// script. "Житомир, Ukraine" mixes two alphabets in five words and reads as a
// bug, not as respect for the original.
function cityName(city) {
  const p = (i18n._places || {})[city];
  return (p && p[LANG]) || city;
}

function placeLine(g) {
  const where = [cityName(g.city), g.country].filter(Boolean).join(', ');
  const region = g.field_region && regions[g.field_region]
    && regions[g.field_region].label;
  if (region) return where ? `Across ${region}, run from ${where}` : `Across ${region}`;
  if (!where) return '';
  return g.format === 'online' ? `Hosted from ${where}` : where;
}

let globe, layerApi, details = {}, iso2to3 = {}, i18n = {}, countryNames = {}, regions = {};
let activeNets = null;
let current = null;          // group whose popup is open

let placeless = [];      // the groups the overlay lists, kept for the button

function setStats(scoped) {
  // A group counts as on the map if it has a marker or tints a region. A Lab
  // with a field_country has a marker at its country's centre; one with a
  // field_region shades every country in that region.
  const onMap = (g) => (g.scope || g.scale) !== 'global';
  const placed = scoped.filter(onMap).length;

  // A region counts every country it covers, which is why Africa alone adds 55.
  const countries = new Set();
  for (const g of scoped.filter(onMap)) {
    if (g.field_region && regions[g.field_region]) {
      for (const c of regions[g.field_region].countries) countries.add(c);
    } else if (g.iso3 || g.field_iso3) countries.add(g.iso3 || g.field_iso3);
  }

  placeless = scoped.filter((g) => !onMap(g));

  // Written defensively. These four used to be four unguarded writes, so a
  // single renamed id threw here and took the network list and the filters
  // down with it, several steps later and with no obvious connection.
  const put = (sel, v) => { const el = $(sel); if (el) el.textContent = v; };
  put('#pn-total', scoped.length);
  put('#pn-placed', placed);
  put('#pn-countries', countries.size);
  put('#pn-global', placeless.length);
  renderGlobalsButton();
}

function renderGlobalsButton() {
  const wrap = $('#pn-globals-wrap');
  if (!wrap) return;
  wrap.hidden = placeless.length === 0;
  const n = $('#pn-globals-count');
  if (n) n.textContent = placeless.length;
  const label = wrap.querySelector('#pn-globals-btn span:last-child');
  if (label) label.textContent = placeless.length === 1
    ? 'group not tied to one place' : 'groups not tied to one place';
}

// ── the overlay ────────────────────────────────────────────────
//
// 63 groups have no place on the map. They used to be a scrolling list of
// names in a 286px panel, which was unreadable and pushed the legend off
// screen. Kosha asked for a proper table over the map instead, with enough of
// each group to decide whether to open it.
function openSheet() {
  const el = $('#pn-sheet');
  const body = $('#pn-sheet-body');

  $('#pn-sheet-sub').textContent = placeless.length
    ? `${placeless.length} groups that meet online and are not about one country, `
      + 'so they have nowhere to sit on the map. Everything else about them is here.'
    : '';

  body.innerHTML = placeless.length ? placeless.map((g) => {
    const d = details[g.id] || {};
    const alt = translationOf(g);
    const about = d.about || g.description || '';
    const short = about.length > 260
      ? about.slice(0, 260).replace(/\s+\S*$/, '') + '…' : about;

    let people = (d.leaders || []).filter((l) => l.name);
    if (!people.length && g.facilitator) {
      people = String(g.facilitator).split(';')
        .map((x) => ({ name: x.trim() })).filter((x) => x.name);
    }

    return `<div class="pn-row">
      <div>
        <div class="pn-row-net">
          <span class="pn-sw" style="background:${netColor(g.network)}"></span>
          ${esc(netLabel(g.network))}
        </div>
        <div class="pn-row-t">${esc(g.name)}</div>
        ${alt ? `<div class="pn-row-alt">${esc(alt)}</div>` : ''}
        ${short ? `<div class="pn-row-d">${esc(short)}</div>` : ''}
        ${g.url ? `<a class="pn-row-go" href="${esc(g.url)}" target="_blank" rel="noopener">Open group page &rarr;</a>` : ''}
      </div>
      <div class="pn-row-people">
        ${people.map((l) => `
          <div class="pn-row-p">
            <span class="pn-row-av">
              <span class="pop-host-i" aria-hidden="true">${esc((l.name.trim()[0] || '').toUpperCase())}</span>
              ${l.photo ? avatarImg(l.photo) : ''}
            </span>
            <span class="pn-row-n">${esc(l.name)}</span>
          </div>`).join('')}
      </div>
    </div>`;
  }).join('') : '<div class="pn-sheet-empty">Nothing here with the current filters.</div>';

  el.hidden = false;
  $('#pn-sheet-x').focus();
}

function closeSheet() { $('#pn-sheet').hidden = true; }

// One place that knows what the button should look like, so the icon can never
// disagree with whether the globe is actually turning.
function setPlayIcon(on) {
  const b = document.getElementById('gc-play');
  if (!b) return;
  b.innerHTML = on ? '&#10074;&#10074;' : '&#9654;';
  b.title = on ? 'Pause rotation' : 'Play rotation';
  b.setAttribute('aria-label', b.title);
  b.classList.toggle('active', on);
}

function netColor(key) {
  const n = (layerApi?.networks || []).find((x) => x.key === key);
  return n ? n.color : 'var(--accent)';
}


// When a group is opened out of a cluster list, the card replaces that list in
// the same spot. Without a way back the visitor has lost the other three and
// has to hunt for the marker again, so the card carries a return link.
// Set immediately before layerApi.select and consumed by the next showPopup.
let pendingOrigin = null;
let cardOrigin = null;
let lastAnchor = null;   // where the open card is pinned, refreshed every frame

// Facilitator photographs come straight from pocketproject.org, and every one
// of them is a full-size original: seven measured came to 2.3 MB between them,
// for circles rendered at 28 pixels. WordPress's own smaller variants mostly do
// not exist, and never do for the 104 photographs uploaded through Gravity
// Forms, which bypasses the media library. So a card can be waiting on several
// hundred kilobytes per face, which is why they arrive late or look like they
// are not arriving at all.
//
// Nothing here can shrink the file. What it can do is refuse to look broken
// while waiting: the initial sits underneath from the first frame, the image
// fades in over it once decoded, and a failure leaves the initial in place
// rather than a torn-image icon. The real fix is on their server and is in
// GAPS_FOR_TEAM.md for Noah.
function avatarImg(src) {
  return `<img src="${esc(src)}" alt="" loading="lazy" decoding="async"
    onload="this.classList.add('is-in')" onerror="this.remove()">`;
}

// Everyone who holds the group, named. 107 of the 147 groups have two or more
// facilitators, so "and 1 other" was hiding a real person on most cards, and
// people choose a group partly by who is running it. Five is the most anyone
// has, which fits without the card getting unwieldy.
function hostsHtml(g, d) {
  let people = (d.leaders || []).filter((l) => l.name);
  // Fall back to the Sheet column, which packs names into one cell with "; ".
  if (!people.length && g.facilitator) {
    people = String(g.facilitator).split(';').map((n) => ({ name: n.trim() })).filter((p) => p.name);
  }
  if (!people.length) return '';

  const rows = people.map((l) => `
    <div class="pop-host-p">
      <span class="pop-avatar">
        <span class="pop-host-i" aria-hidden="true">${esc((l.name.trim()[0] || '').toUpperCase())}</span>
        ${l.photo ? avatarImg(l.photo) : ''}
      </span>
      <span class="pop-host-n">${esc(l.name)}</span>
    </div>`).join('');

  return `<div class="pop-host">
      <div class="pop-host-r">${people.length > 1 ? 'Facilitators' : 'Facilitator'}</div>
      ${rows}
    </div>`;
}

// ── popup, anchored to the marker and following it as the globe turns ──
function popupHtml(g) {
  const d = details[g.id] || {};
  const where = placeLine(g);
  const about = d.about || g.description || '';
  const short = about.length > 220 ? about.slice(0, 220).replace(/\s+\S*$/, '') + '…' : about;
  const hasMore = !!(d.about && d.about.length > 220) || (d.leaders || []).some((l) => l.bio)
    || !!d.invitation || !!d.methods;

  const back = cardOrigin && cardOrigin.members.length > 1
    ? `<button class="pop-back" id="pn-back">&larr; All ${cardOrigin.members.length} here</button>`
    : '';

  return `
    ${back}
    <div class="pop-eyebrow"><span class="pn-sw" style="background:${netColor(g.network)}"></span>${esc(netLabel(g.network))}</div>
    <div class="pop-title">${esc(g.name)}</div>
    ${translationOf(g) ? `<div class="pop-trans">${esc(translationOf(g))}</div>` : ''}
    ${where ? `<div class="pop-where">${esc(where)}</div>` : ''}
    ${d.meets ? `<div class="pop-when"><b>When</b>${esc(d.meets)}</div>` : ''}
    ${short ? `<div class="pop-about">${esc(short)}</div>` : ''}
    ${hostsHtml(g, d)}
    <div class="pop-acts">
      ${g.url ? `<a class="pop-go" href="${esc(g.url)}" target="_blank" rel="noopener">Open group page</a>` : ''}
      ${hasMore ? `<button class="pop-more" id="pn-more">More</button>` : ''}
    </div>`;
}

// Several groups at one address: list them in the card itself, so the first
// click already shows what is there and the second opens one of them.
function showClusterPopup(cluster, at) {
  current = { id: '__cluster__' + cluster.key };   // keeps placePopup anchored
  cardOrigin = null;                                // the list is the top level
  const place = cluster.members[0];
  // An "about" cluster names the country it enquires into, and says so, rather
  // than borrowing a city name from a group that does not meet anywhere.
  const where = cluster.about
    ? (countryNames[place.field_iso3] || place.country || 'this country')
    : (cityName(place.city) || place.country || 'this place');
  const eyebrow = cluster.about
    ? `${cluster.members.length} groups about`
    : `${cluster.members.length} groups`;
  const rows = cluster.members.map((g, i) => {
    const alt = translationOf(g);
    return `<button class="pop-row" data-i="${i}">
        <span class="pn-sw" style="background:${netColor(g.network)}"></span>
        <span class="pop-row-t">${esc(g.name)}${alt ? `<span class="pop-row-a">${esc(alt)}</span>` : ''}</span>
      </button>`;
  }).join('');

  $('#pn-pop-body').innerHTML = `
    <div class="pop-eyebrow">${esc(eyebrow)}</div>
    <div class="pop-title">${esc(where)}</div>
    <div class="pop-rows">${rows}</div>`;

  $('#pn-pop-body').querySelectorAll('.pop-row').forEach((b) => {
    b.addEventListener('click', () => {
      pendingOrigin = cluster;               // so the card can offer a way back
      layerApi.select(cluster.members[+b.dataset.i]);
    });
  });
  placePopup(at);
}

// A group with nowhere to sit on the map. All 75 Integration Labs are in this
// state until field_country is filled in, plus any other global group.
const unplaceable = (g) => g.scale === 'global' && !g.field_iso3;

function showPopup(g) {
  current = g;
  // Consume the origin once. A marker clicked directly leaves it null, so the
  // return link only appears when there is genuinely something to return to.
  cardOrigin = pendingOrigin;
  pendingOrigin = null;

  const el = $('#pn-pop');
  if (!g) { cardOrigin = null; el.classList.remove('show'); return; }

  // The anchored card is pinned to a marker, and these have none, so it would
  // be built and then immediately hidden when draw() reported no anchor. Send
  // them to the drawer instead, which is the right home anyway: a Lab has no
  // place but it has the richest text of any network, and the drawer has room
  // for the focus, the invitation, the schedule and every leader.
  if (unplaceable(g)) {
    current = null;
    el.classList.remove('show');
    openDrawer(g);
    return;
  }
  $('#pn-pop-body').innerHTML = popupHtml(g);
  // Stays hidden until placePopup gives it coordinates on the next draw.
  const more = document.getElementById('pn-more');
  if (more) more.addEventListener('click', () => openDrawer(g));
  const back = document.getElementById('pn-back');
  if (back) {
    const origin = cardOrigin;
    back.addEventListener('click', (ev) => {
      ev.stopPropagation();
      layerApi.selectCluster(origin, lastAnchor);
    });
  }
}

// ── hover tooltip ──
//
// A legend in a side panel only helps someone who already noticed there is
// something to look up. Hovering a marker is the moment the question actually
// occurs, so the answer belongs there: the name, and one line saying whether
// this is a place you could go or only where an online group is run from.
function showTip(g, ev) {
  const el = $('#tooltip');
  if (!g) { el.style.display = 'none'; return; }
  // "meets online" rather than "meets nowhere": a Lab does meet, it just does
  // not meet anywhere you could travel to. Only claimed where the format says
  // so, because four Labs have no format recorded and guessing is how the
  // ocean-disc and Congo-marker bugs started.
  const regionLabel = g.field_region && regions[g.field_region]
    && regions[g.field_region].label;
  const about = g.field_iso3 && (countryNames[g.field_iso3] || 'this country');
  const online = g.format === 'online' || g.format === 'hybrid';
  // A continental group names its reach and, where the data says, the place it
  // is actually run from. "Across Africa" and "run from Berlin" are both true,
  // and saying only the first is what made the old version feel like a claim
  // about a continent.
  const rootedIn = [cityName(g.city), g.country].filter(Boolean).join(', ');
  const line = regionLabel
      ? (rootedIn ? `Across ${regionLabel}, run from ${rootedIn}` : `Across ${regionLabel}`)
    : about ? (online ? `About ${about}, meets online` : `About ${about}`)
    : g.scale === 'global' ? 'No fixed place'
    : g.format === 'online' ? `Online, hosted from ${cityName(g.city) || g.country}`
    : `Meets in ${cityName(g.city) || g.country}`;
  el.innerHTML = `<div class="tt-name">${esc(g.name)}</div>
                  <div class="tt-hint">${esc(line)}</div>`;
  el.style.display = 'block';
  moveTip(ev);
}

function showClusterTip(cluster, ev) {
  const el = $('#tooltip');
  const first = cluster.members[0];
  let place, bits;
  if (cluster.about) {
    place = countryNames[first.field_iso3] || first.country || '';
    const n = cluster.members.length;
    bits = [`${n} ${n === 1 ? 'group' : 'groups'} about this country, meeting online`];
  } else {
    const meets = cluster.members.filter((g) => g.format !== 'online').length;
    const online = cluster.members.length - meets;
    bits = [];
    if (meets) bits.push(`${meets} meeting here`);
    if (online) bits.push(`${online} online`);
    place = cityName(first.city) || first.country || '';
  }
  el.innerHTML = `<div class="tt-name">${esc(place)}</div>
                  <div class="tt-hint">${esc(bits.join(', '))}</div>`;
  el.style.display = 'block';
  moveTip(ev);
}

function moveTip(ev) {
  const el = $('#tooltip');
  if (el.style.display === 'none') return;
  const pad = 14;
  let x = ev.clientX + pad;
  let y = ev.clientY + pad;
  if (x + el.offsetWidth > window.innerWidth - 8) x = ev.clientX - el.offsetWidth - pad;
  if (y + el.offsetHeight > window.innerHeight - 8) y = ev.clientY - el.offsetHeight - pad;
  el.style.left = `${Math.max(8, x)}px`;
  el.style.top = `${Math.max(8, y)}px`;
}

// Called by the layer on every frame with the marker's screen position.
function placePopup(anchor) {
  const el = $('#pn-pop');
  if (!current) return;
  if (anchor) lastAnchor = anchor;
  if (!anchor) { el.classList.remove('show'); return; }   // rotated out of view
  el.classList.add('show');

  const stage = $('#stage').getBoundingClientRect();
  const w = el.offsetWidth || 290;
  const h = el.offsetHeight || 200;
  const gap = 16;

  // prefer above the marker, flip below when there is no room
  let top = anchor.y - h - gap;
  let below = false;
  if (top < 8) { top = anchor.y + gap; below = true; }

  // keep it on screen horizontally, and point the tail back at the marker
  let left = anchor.x - w / 2;
  left = Math.max(8, Math.min(left, stage.width - w - 8));
  const tail = Math.max(14, Math.min(anchor.x - left, w - 14));

  el.style.left = `${left}px`;
  el.style.top = `${top}px`;
  el.style.setProperty('--tail', `${tail}px`);
  el.classList.toggle('below', below);
  el.classList.toggle('above', !below);
}

// ── drawer, for the long form ──
function openDrawer(g) {
  const el = $('#pn-drawer');
  if (!g) { el.classList.remove('open'); return; }

  const d = details[g.id] || {};
  const tags = [];
  if (g.format) tags.push(LABEL[g.format] || g.format);
  if (g.language) tags.push(g.language);
  if (g.status) tags.push(LABEL[g.status] || g.status);
  const where = placeLine(g);

  const leaders = (d.leaders || []).map((l) => `
    <div class="pn-lead">
      <span class="pn-lead-av">
        <span class="pop-host-i" aria-hidden="true">${esc((l.name.trim()[0] || '').toUpperCase())}</span>
        ${l.photo ? avatarImg(l.photo) : ''}
      </span>
      <div>
        <div class="pn-lead-n">${esc(l.name)}</div>
        ${l.bio ? `<div class="pn-lead-b">${esc(l.bio)}</div>` : ''}
      </div>
    </div>`).join('');

  // d.photo is deliberately not used. It is usually a facilitator portrait
  // rather than a scene, and cropping a portrait to a wide banner looks wrong.
  // The same photograph already appears, correctly framed, under "Held by".
  $('#pn-drawer-body').innerHTML = `
    <div class="pn-eyebrow"><span class="pn-sw" style="background:${netColor(g.network)}"></span>${esc(netLabel(g.network))}</div>
    <h2 class="pn-title">${esc(g.name)}</h2>
    ${translationOf(g) ? `<div class="pn-trans">${esc(translationOf(g))}</div>` : ''}
    ${where ? `<div class="pn-where">${esc(where)}</div>` : ''}
    ${tags.length ? `<div class="pn-tags">${tags.map((t) => `<span class="pn-tag">${esc(t)}</span>`).join('')}</div>` : ''}
    ${(d.meets || d.availability) ? `<div class="pn-sec"><h4>When it meets</h4><div class="pn-body">${esc(d.meets || d.availability)}</div></div>` : ''}
    ${d.about ? `<div class="pn-sec"><h4>What happens here</h4><div class="pn-body">${esc(d.about)}</div></div>` : (g.description ? `<div class="pn-sec"><h4>What happens here</h4><div class="pn-body">${esc(g.description)}</div></div>` : '')}
    ${d.invitation ? `<div class="pn-sec"><h4>Who is invited</h4><div class="pn-body">${esc(d.invitation)}</div></div>` : ''}
    ${d.methods ? `<div class="pn-sec"><h4>How it works</h4><div class="pn-body">${esc(d.methods)}</div></div>` : ''}
    ${leaders ? `<div class="pn-sec"><h4>Held by</h4>${leaders}</div>` : (g.facilitator ? `<div class="pn-sec"><h4>Held by</h4><div class="pn-body">${esc(g.facilitator)}</div></div>` : '')}
    ${g.url ? `<a class="pn-go" href="${esc(g.url)}" target="_blank" rel="noopener">Open the group page</a>` : ''}
  `;
  el.classList.add('open');
  el.scrollTop = 0;
}

function netLabel(key) {
  const n = (layerApi?.networks || []).find((x) => x.key === key);
  return n ? n.label : key;
}

// ── clicking a country ──
//
// Two things happen at once, because on their own neither is enough. The map
// filters down to that country, so the eye is not competing with the rest of
// the world, and the panel lists what is actually there.
//
// The list is split three ways on purpose. "Groups in Germany" now means three
// different things: some meet there, some are online and merely hosted from
// there, and some Labs are about Germany while meeting online. Lumping
// them together would undo the honesty the marker shapes are carrying.
//
// A country with nothing in it is pinned and named but NOT filtered. Filtering
// to an empty country blanks the map, and a blank map reads as broken rather
// than as empty.

let countryIso3 = null;   // the country we are filtered to, ISO3, or null

const REL = [
  { key: 'meets',  head: 'Meets here',       test: (g) => g.scale !== 'global' && g.format !== 'online' },
  { key: 'hosted', head: 'Hosted from here', test: (g) => g.scale !== 'global' && g.format === 'online' },
  { key: 'about',  head: 'About this place', test: (g) => g.scale === 'global' && !!g.field_iso3 },
];

function relatedTo(iso3) {
  if (!iso3 || !layerApi) return [];
  return layerApi.groups().filter((g) => {
    if (g.visible === false) return false;
    if (!activeNets.has(g.network)) return false;
    return g.iso3 === iso3 || g.field_iso3 === iso3;
  });
}

// Prefer the name the Pocket Project themselves use for a country, falling
// back to the basemap's. Countries with no groups only have the latter, which
// is exactly the case where a bare ISO3 code would look broken.
function countryNameOf(iso3, groups) {
  const named = groups.find((g) => g.iso3 === iso3 && g.country);
  if (named) return named.country;
  return countryNames[iso3] || iso3;
}

function renderCountryPanel(iso3) {
  const wrap = $('#pn-list-wrap');
  if (!iso3) { wrap.hidden = true; $('#pn-list').innerHTML = ''; return; }

  const groups = relatedTo(iso3);
  wrap.hidden = false;
  $('#pn-list-head').innerHTML =
    `<span>${esc(countryNameOf(iso3, groups))}</span>
     <button class="pn-clear" id="pn-country-clear" aria-label="Show the whole map">Show all</button>`;
  $('#pn-country-clear').addEventListener('click', (ev) => {
    ev.stopPropagation();
    selectCountry(null);
  });

  if (!groups.length) {
    $('#pn-list').innerHTML =
      `<div class="pn-empty">No groups here yet. The networks are still growing.</div>`;
    return;
  }

  let html = '';
  for (const r of REL) {
    const members = groups.filter(r.test);
    if (!members.length) continue;
    html += `<div class="pn-relhead">${r.head}<span class="pn-n">${members.length}</span></div>`;
    html += members.map((g) => {
      const alt = translationOf(g);
      return `<button class="pn-listitem" data-id="${esc(g.id)}">
          <span class="pn-sw" style="background:${netColor(g.network)}"></span>
          <span class="pn-listitem-t">${esc(g.name)}${alt ? `<span class="pn-listitem-a">${esc(alt)}</span>` : ''}</span>
        </button>`;
    }).join('');
  }
  $('#pn-list').innerHTML = html;

  const byId = Object.fromEntries(groups.map((g) => [g.id, g]));
  $('#pn-list').querySelectorAll('.pn-listitem').forEach((b) => {
    b.addEventListener('click', () => layerApi.select(byId[b.dataset.id]));
  });
}

function selectCountry(iso3, { fromGlobe = false } = {}) {
  // The engine toggles its own pin on click and hands us the result, so when
  // the call comes from the globe iso3 is already the country we should end
  // on, null included. Called from anywhere else we do the toggle ourselves.
  const next = fromGlobe ? (iso3 || null)
    : ((iso3 && iso3 === countryIso3) ? null : iso3);
  countryIso3 = next;

  showPopup(null);
  layerApi?.clear();
  if (!fromGlobe) globe.setPinned(next);

  // Only narrow the map when there is something to narrow to. Filtering to an
  // empty country leaves a blank globe, and blank reads as broken.
  const hasGroups = next ? relatedTo(next).length > 0 : false;
  layerApi?.setCountryFilter(hasGroups ? next : null);

  renderCountryPanel(next);
  if (next) globe.focusOn(next); else globe.zoomReset();
}

// ── network filters, in the Atlas panel language ──

// ── status and language filters ─────────────────────────────
//
// Both requested by Kosha on 27 August. Neither narrows the map by default:
// they are there for someone who already knows what they are looking for.
//
// Language needs normalising first. The data holds 12 distinct values, but
// "German, English" is one cell meaning two languages, and Spanish appears
// as both "Spanish" and "Español". Splitting and folding those gives a list a
// visitor can actually use, and puts a bilingual group under both languages
// rather than in a category of its own.
const LANG_ALIASES = {
  'español': 'Spanish', 'espanol': 'Spanish',
  'deutsch': 'German', 'français': 'French', 'francais': 'French',
  'nederlands': 'Dutch', 'українська': 'Ukrainian',
};

function languagesOf(g) {
  const raw = String(g.language || '').trim();
  if (!raw) return [];
  // "Hebrew (English witnessing circle)" describes one language with a note,
  // so the parenthetical is dropped rather than read as a second language.
  const base = raw.replace(/\([^)]*\)/g, ' ');
  return [...new Set(base.split(/\s*(?:,|\/| and )\s*/i)
    .map((x) => x.trim())
    .filter(Boolean)
    .map((x) => LANG_ALIASES[x.toLowerCase()] || x)
    .map((x) => x.charAt(0).toUpperCase() + x.slice(1)))];
}

const STATUS_ORDER = ['open', 'applications_closed', 'closed'];

let activeStatus = new Set();     // empty means no filter, which is the default
let activeLangs = new Set();

function passesFilters(g) {
  if (activeStatus.size && !activeStatus.has(g.status)) return false;
  if (activeLangs.size && !languagesOf(g).some((l) => activeLangs.has(l))) return false;
  return true;
}

function buildFilters(groups) {
  const wrap = $('#pn-filters');
  const visible = groups.filter((g) => g.visible !== false);

  const statusCounts = {};
  const langCounts = {};
  for (const g of visible) {
    if (g.status) statusCounts[g.status] = (statusCounts[g.status] || 0) + 1;
    for (const l of languagesOf(g)) langCounts[l] = (langCounts[l] || 0) + 1;
  }

  const langs = Object.keys(langCounts).sort(
    (a, b) => langCounts[b] - langCounts[a] || a.localeCompare(b));
  const statuses = STATUS_ORDER.filter((k) => statusCounts[k]);

  wrap.innerHTML = `
    <div class="pn-filter">
      <div class="pn-filter-head"><span>Status</span>
        <button class="pn-filter-clear" data-clear="status" hidden>Clear</button></div>
      <div class="pn-chips" id="pn-status-chips">
        ${statuses.map((k) => `<button class="pn-chip" data-status="${esc(k)}">${esc(LABEL[k] || k)}<span class="n">${statusCounts[k]}</span></button>`).join('')}
      </div>
    </div>
    <div class="pn-filter">
      <div class="pn-filter-head"><span>Language</span>
        <button class="pn-filter-clear" data-clear="lang" hidden>Clear</button></div>
      <div class="pn-chips" id="pn-lang-chips">
        ${langs.map((l) => `<button class="pn-chip" data-lang="${esc(l)}">${esc(l)}<span class="n">${langCounts[l]}</span></button>`).join('')}
      </div>
    </div>`;

  const refresh = () => {
    $('[data-clear="status"]').hidden = activeStatus.size === 0;
    $('[data-clear="lang"]').hidden = activeLangs.size === 0;
    layerApi.setExtraFilter(activeStatus.size || activeLangs.size ? passesFilters : null);
    if (countryIso3) renderCountryPanel(countryIso3);
    renderGlobalsButton();
  };

  wrap.querySelectorAll('[data-status]').forEach((b) => {
    b.addEventListener('click', () => {
      const k = b.dataset.status;
      activeStatus.has(k) ? activeStatus.delete(k) : activeStatus.add(k);
      b.classList.toggle('on', activeStatus.has(k));
      refresh();
    });
  });
  wrap.querySelectorAll('[data-lang]').forEach((b) => {
    b.addEventListener('click', () => {
      const l = b.dataset.lang;
      activeLangs.has(l) ? activeLangs.delete(l) : activeLangs.add(l);
      b.classList.toggle('on', activeLangs.has(l));
      refresh();
    });
  });
  wrap.querySelectorAll('.pn-filter-clear').forEach((b) => {
    b.addEventListener('click', () => {
      if (b.dataset.clear === 'status') activeStatus.clear(); else activeLangs.clear();
      wrap.querySelectorAll(b.dataset.clear === 'status' ? '[data-status]' : '[data-lang]')
        .forEach((c) => c.classList.remove('on'));
      refresh();
    });
  });
}

// The page on pocketproject.org where each network is actually explained and
// where someone goes to join. Kosha asked for these on 27 August.
const NETWORK_PAGES = {
  practice_groups:    'https://pocketproject.org/practice-groups/',
  resilience_circles: 'https://pocketproject.org/resilience-circles/',
  integration_labs:   'https://pocketproject.org/integration-labs/',
  witnessing_hubs:    'https://pocketproject.org/witnessing-hubs/',
};

function buildNetworkList(networks, counts) {
  const wrap = $('#pn-nets');
  wrap.innerHTML = '';
  for (const n of networks) {
    const on = activeNets.has(n.key);
    const row = document.createElement('div');
    row.className = 'pn-net-row';

    const b = document.createElement('button');
    b.className = 'pn-net' + (on ? ' on' : '');
    b.setAttribute('aria-pressed', String(on));
    b.innerHTML = `<span class="pn-sw" style="background:${n.color}"></span>
                   <span>${n.label}</span><span class="pn-n">${counts[n.key] || 0}</span>`;
    b.addEventListener('click', () => {
      if (activeNets.has(n.key) && activeNets.size === 1) return;  // never blank the map
      activeNets.has(n.key) ? activeNets.delete(n.key) : activeNets.add(n.key);
      layerApi.setActiveNetworks(activeNets);
      b.classList.toggle('on', activeNets.has(n.key));
      b.setAttribute('aria-pressed', String(activeNets.has(n.key)));
      // The country panel is filtered by network too, so it has to follow.
      if (countryIso3) renderCountryPanel(countryIso3);
    });
    row.appendChild(b);

    // The link is separate from the toggle on purpose: clicking the row name
    // should filter the map, not navigate away from it.
    const href = NETWORK_PAGES[n.key];
    if (href) {
      const a = document.createElement('a');
      a.className = 'pn-net-go';
      a.href = href;
      a.target = '_blank';
      a.rel = 'noopener';
      a.title = `Open the ${n.label} page`;
      a.setAttribute('aria-label', `Open the ${n.label} page on pocketproject.org`);
      a.textContent = '\u2197';
      row.appendChild(a);
    }
    wrap.appendChild(row);
  }
}

async function main() {
  applyTheme('bone');

  // The Atlas keeps #chrome at opacity 0 until its intro flow reveals it.
  // This map has no intro, so nothing would ever bring the controls back.
  document.getElementById('chrome')?.classList.add('visible');

  // Groups come from the published Google Sheet when one is configured, and
  // from the snapshot shipped with the app when it is not, or when the Sheet
  // cannot be reached. Everything else is static reference data.
  const [meta, loaded, detailData, isoMap, i18nMap, regionData] = await Promise.all([
    loadCountryMeta(),
    loadGroups(),
    loadJSON('data/practitioner_details.json').catch(() => ({})),
    loadJSON('data/practitioner_iso.json').catch(() => ({})),
    loadJSON('data/practitioner_i18n.json').catch(() => ({})),
    loadJSON('data/practitioner_regions.json').catch(() => ({})),
  ]);
  const groupData = { groups: loaded.groups };

  // One line so anyone opening the console can tell where the data came from.
  // A visitor is shown nothing: a slightly older map is not their problem.
  if (loaded.source === 'sheet') {
    console.info(`[practitioner map] ${loaded.groups.length} groups from the live Sheet`);
  } else if (loaded.error) {
    console.warn('[practitioner map] the Sheet could not be read, showing the bundled '
      + `snapshot instead (${loaded.error.message})`);
  } else {
    console.info(`[practitioner map] ${loaded.groups.length} groups from the bundled `
      + 'snapshot; set SHEET_CSV_URL in js/practitioner-config.js to read the Sheet live');
  }
  console.info(`[practitioner map] build ${BUILD}`);

  // Safari in particular caches ES modules hard, and a hard reload does not
  // reliably re-fetch a module reached through an import rather than a script
  // tag. The markup and the script then disagree, which looks exactly like a
  // bug in the code: panels that do not fill, counts that do not match the
  // data. The markup carries the expected build, so the page can notice.
  // Two independent signals, because one was not enough. The markup stamp
  // catches new page with old script. It cannot catch a browser that cached
  // page AND script together from the same older build, which is what Safari
  // did on 27 August: the pair agreed with each other and disagreed with the
  // data. So the data file states the build it belongs to as well, and the
  // data is fetched with no-store and cannot be stale.
  const dataBuild = groupData && groupData.meta && groupData.meta.build;
  const want = document.body.dataset.build;
  const stale = (want && want !== BUILD) || (dataBuild && dataBuild !== BUILD);
  if (stale) {
    const bar = document.createElement('div');
    bar.style.cssText = 'position:fixed;left:0;right:0;top:0;z-index:999;padding:9px 16px;'
      + 'background:#7a2d16;color:#fff;font:12px/1.5 system-ui;text-align:center;';
    bar.textContent = 'This page is running an old cached copy. Script says '
      + `"${BUILD}", page says "${want || 'nothing'}", data says `
      + `"${dataBuild || 'nothing'}". In Safari: Develop menu, Empty Caches, `
      + 'then reload. Or open it in a private window.';
    document.body.appendChild(bar);
    console.warn(`[practitioner map] STALE: script "${BUILD}", page "${want}", data "${dataBuild}"`);
  }
  const stamp = document.querySelector('#topbar .brand-sub');
  if (stamp) stamp.title = `build ${BUILD}`;

  details = detailData || {};
  iso2to3 = isoMap || {};
  i18n = i18nMap || {};
  countryNames = (meta && meta.country_names) || {};
  regions = Object.fromEntries(Object.entries(regionData || {})
    .filter(([k]) => !k.startsWith('_')));

  // The rows carry ISO2, because that is what a human types into the Sheet.
  // The globe keys everything by ISO3: setPaint, focusOn and getCentroids all
  // speak it. Translate once here rather than at every call site.
  //
  // This was previously missing, which meant g.iso3 was undefined on every row
  // and the country tint quietly did nothing at all.
  const iso3of = (code) => {
    const k = String(code || '').trim().toUpperCase();
    return k && iso2to3[k] ? iso2to3[k] : null;
  };
  // field_country holds either a two-letter country code or the key of a
  // named region. A region tints every country in it, which is the only
  // honest way to draw one: the borders are real and already on the map.
  // scope says how far a group reaches; location says where it is anchored.
  // Kept apart on purpose: a pan-African group is not a group without a place,
  // and pinning it to one country would be false precision, but shading a
  // continent while European groups resolve to cities would say something
  // about Africa that the network does not say. Holding both lets the map show
  // reach when zoomed out and precision when zoomed in.
  //
  // Older rows carry only scale and field_country, so those are the fallback.
  for (const g of (groupData && groupData.groups) || []) {
    g.iso3 = iso3of(g.iso2);

    const loc = String(g.location || g.field_country || '').trim();
    const asRegion = loc && regions[loc.toLowerCase()] ? loc.toLowerCase() : null;

    g.scope = String(g.scope || '').trim().toLowerCase()
      || (asRegion ? 'continental'
        : g.scale === 'global' ? (loc ? 'national' : 'global')
        : g.scale || 'global');

    g.field_region = g.scope === 'continental' ? asRegion : null;
    g.field_iso3 = g.field_region ? null
      : (g.scope === 'national' && g.scale === 'global' ? iso3of(loc) : null);

    // Where it is actually rooted, used for the zoomed-in detail. A continental
    // group usually still has a city or a country behind it, and saying so is
    // the difference between "Africa" and "Africa, run from Berlin".
    g.anchor_iso3 = g.iso3;
  }

  const networks = [
    { key: 'practice_groups', label: 'Practice Groups', color: '#E8772C' },
    { key: 'resilience_circles', label: 'Resilience Circles', color: '#3F9991' },
    { key: 'integration_labs', label: 'Integration Labs', color: '#7a3b5d' },
    { key: 'witnessing_hubs', label: 'Witnessing Hubs', color: '#84AFAA' },
  ];
  const params = readParams(networks);
  activeNets = new Set(params.layer ? [params.layer] : networks.map((n) => n.key));

  globe = createGlobe($('#globe-wrap'), {
    autoRotate: !params.country,
    // The engine stops rotating by itself: on any drag, and whenever the
    // projection leaves the globe. Without this the button's icon went stale,
    // so it claimed to be rotating when it was not and the next click toggled
    // the wrong way. Kosha reported it as "the movement button does not work".
    onAutoRotateChange: (on) => setPlayIcon(on),
    onProjectionChange: () => setPlayIcon(globe.state.autoRotate),
    rotateSpeed: 0.10,
    showGraticule: false,
    // Clicking a country filters the map to it and lists what is there.
    // The engine has already toggled its own pin by the time this fires, so
    // selectCountry is told the result rather than deciding it again.
    onPinChange: (iso3) => selectCountry(iso3, { fromGlobe: true }),
  });
  await globe._loadWorld(meta);

  // Mount the layer by hand. The registry does the same thing in the Atlas;
  // here there is only one layer, so the ceremony is not worth it.
  const ctx = {
    globe,
    svg: globe.svg,
    group: globe.overlay.append('g').attr('class', 'layer-practitioner'),
    projection: globe.projection,
    path: globe.path,
    getCentroids: () => globe.getCentroids(),
    setPaint: (fn) => globe.setPaint(fn),
    data: groupData,
    getControl: () => null,          // controls live in this page's own chrome
    onRender: (fn) => globe.onRender(fn),
    requestRender: () => globe.requestRender(),
    options: {
      activeNetworks: activeNets,
      regions,
      // Countries inside a highlighted region get a heavier outline, so the
      // region reads as one area rather than a scatter of tinted states.
      // The ISO code lives on the bound datum rather than the element, so this
      // has to go through d3. The class survives re-renders because the engine
      // updates the existing paths rather than rebuilding them.
      onRegionCountries: (set) => {
        d3.selectAll('#globe-wrap .country')
          .classed('in-region', (d) => !!(d && d.__iso3 && set.has(d.__iso3)));
      },
      countryFilter: params.country ? (iso2to3[params.country] || null) : null,
      onSelect: showPopup,
      onAnchor: placePopup,
      onCluster: showClusterPopup,
      onHover: (g, cluster, ev) => {
        if (cluster) showClusterTip(cluster, ev);
        else if (g) showTip(g, ev);
        else showTip(null);
      },
      onHoverMove: moveTip,
      onScopeChange: (scoped) => {
        setStats(scoped);
        const counts = {};
        for (const g of layerApi ? layerApi.groups() : []) {
          if (g.visible === false) continue;
          counts[g.network] = (counts[g.network] || 0) + 1;
        }
        if (!$('#pn-nets').children.length) buildNetworkList(networks, counts);
      },
      onReady: (api) => { layerApi = api; },
    },
  };
  layerModule.render(ctx);

  // ?country= lands on exactly the state a click would produce, so an embedded
  // page and a visitor exploring end up in the same place.
  if (params.country && iso2to3[params.country]) {
    selectCountry(iso2to3[params.country]);
  }

  // ── chrome ──
  $('#gc-proj').addEventListener('click', () => {
    const toFlat = globe.getProjection() < 0.5;
    globe.setProjection(toFlat, true);
    $('#gc-proj').textContent = toFlat ? '2D' : '3D';
  });
  $('#gc-play').addEventListener('click', () => {
    // Rotation only runs on the globe, so asking to play from the flat map
    // means "go back to the globe and start turning" rather than nothing at all.
    const wantOn = !globe.state.autoRotate;
    if (wantOn && globe.getProjection() >= 0.04) {
      globe.setProjection(false, true);
      $('#gc-proj').textContent = '3D';
    }
    globe.setAutoRotate(wantOn);
    setPlayIcon(wantOn);
  });
  $('#gc-zin').addEventListener('click', () => globe.zoomIn());
  $('#gc-zout').addEventListener('click', () => globe.zoomOut());
  buildFilters(layerApi.groups());
  console.info('[practitioner map] '
    + `${$('#pn-total').textContent} groups, ${$('#pn-placed').textContent} on the map, `
    + `${$('#pn-countries').textContent} countries, ${$('#pn-global').textContent} global, `
    + `${$('#pn-nets').children.length} network rows, `
    + `${document.querySelectorAll('#pn-filters .pn-chip').length} filter chips`);

  $('#pn-globals-btn')?.addEventListener('click', openSheet);
  $('#pn-sheet-x')?.addEventListener('click', closeSheet);
  $('#pn-sheet')?.addEventListener('click', (ev) => {
    if (ev.target.id === 'pn-sheet') closeSheet();   // click the backdrop to dismiss
  });

  $('#pn-close').addEventListener('click', () => openDrawer(null));
  $('#pn-pop-x').addEventListener('click', () => { showPopup(null); layerApi?.clear(); });
  $('#globe-wrap').addEventListener('click', (ev) => {
    // Markers handle themselves and countries arrive via onPinChange. What is
    // left is the ocean, which means "I am done looking at this".
    if (ev.target.closest('.pn-marker, .pn-clusternode, .country')) return;
    showPopup(null); layerApi?.clear();
    if (countryIso3) selectCountry(null);
  });
  // Escape unwinds one layer at a time: drawer, then card, then country.
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!$('#pn-sheet').hidden) { closeSheet(); return; }
    if ($('#pn-drawer').classList.contains('open')) { openDrawer(null); return; }
    if (current) { showPopup(null); layerApi?.clear(); return; }
    if (countryIso3) selectCountry(null);
  });
}

main().catch((err) => {
  // A throw during boot used to leave a half-built page: the globe and markers
  // drawn, the side panel empty, and no clue why. Say so loudly instead.
  console.error('[practitioner map] failed to start', err);
  const bar = document.createElement('div');
  bar.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:999;'
    + 'padding:10px 16px;background:#7a2d16;color:#fff;font:12px/1.5 system-ui;';
  bar.textContent = 'The map did not finish loading: ' + (err && err.message || err)
    + '  (details in the browser console)';
  document.body.appendChild(bar);
});
