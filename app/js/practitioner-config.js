// ─────────────────────────────────────────────────────────────
//  PRACTITIONER MAP, configuration
//
//  This is the only file anyone should need to edit after delivery.
// ─────────────────────────────────────────────────────────────

export const CONFIG = {

  // The published-to-web CSV address of the `map_data` tab.
  //
  // To fill this in:
  //   1. open the Google Sheet
  //   2. File > Share > Publish to web
  //   3. choose the `map_data` tab, and "Comma-separated values (.csv)"
  //   4. press Publish, and copy the address it gives you
  //   5. paste it between the quotes below
  //
  // It should look like:
  //   https://docs.google.com/spreadsheets/d/e/2PACX-.../pub?gid=0&single=true&output=csv
  //
  // Leave it empty and the map runs from the snapshot bundled in
  // data/practitioner_groups.json, which is exactly what it does today. That
  // is a valid way to ship: the map works, it simply will not pick up new
  // groups on its own.
  //
  // Once it is set, the map fetches the Sheet on every page load. A group
  // added to the Sheet appears the next time somebody opens the page, with no
  // redeploy and no cache purge, because the data comes from a different
  // origin than the app shell that Cloudflare caches.
  // Note this selects the tab by NAME rather than by a numeric gid. A
  // published-to-web URL is pinned to the gid, which changes if the tab is
  // ever deleted and recreated; the name survives that and survives the tabs
  // being reordered. It needs the document to stay shared as "anyone with the
  // link can view". Nothing sensitive is in it: street addresses are stripped
  // before anything reaches the Sheet.
  //
  // ── &headers=1 is not optional. Do not remove it. ──
  //
  // Without it, gviz *guesses* how many rows at the top of the sheet are
  // header. The guess is made from the data: a column of text under a text
  // heading gives it nothing to go on. Every column in this sheet is text.
  //
  // On 31 August it guessed that all 150 rows were header, and returned each
  // column as one cell with the values joined by spaces: a single row reading
  // "id pg-praxisgruppe-hannover pg-southern-africa-practice-group ...". The
  // loader correctly reported that the CSV had no "id" column and fell back to
  // the bundled snapshot, so the map kept working and simply stopped seeing
  // anything added to the Sheet. Which is the worst shape a fault can take:
  // the page looks fine and is quietly months out of date.
  //
  // `headers=1` states the answer instead of inviting a guess. Same data, same
  // tab selection by name, no inference.
  SHEET_CSV_URL: 'https://docs.google.com/spreadsheets/d/1cpGs2nmhxy4QMenG7nMEC1blwxkogS1yZ_dz7fHjlZE/gviz/tq?tqx=out:csv&sheet=map_data&headers=1',

  // ── where each network's "find out more" arrow points ──
  //
  // The small arrow beside each network in the filter panel opens that
  // network's own page on pocketproject.org, which is where somebody actually
  // goes to join a group.
  //
  // These lived in practitioner-app.js until 31 August, which contradicted the
  // promise at the top of this file. Noah asked where the links are defined,
  // saying the exact addresses are likely to change, and the honest answer at
  // the time was "line 798 of a 1200 line file". Now it is here.
  //
  // Editing one is safe: change the address between the quotes. Setting one to
  // an empty string removes that arrow and leaves the row alone, which is the
  // right thing for Witnessing Hubs if that page does not exist yet.
  NETWORK_PAGES: {
    practice_groups:    'https://pocketproject.org/practice-groups/',
    resilience_circles: 'https://pocketproject.org/resilience-circles/',
    integration_labs:   'https://pocketproject.org/integration-labs/',
    witnessing_hubs:    'https://pocketproject.org/witnessing-hubs/',
  },

  // If the Sheet cannot be reached, fall back to the bundled snapshot rather
  // than showing an empty map. A visitor sees slightly older data instead of a
  // broken page, and the reason is logged to the console.
  FALL_BACK_TO_BUNDLE: true,

  // Seconds before a slow Sheet request is abandoned for the bundle. Google is
  // usually well under a second; this is protection against a hang, not a
  // performance tuning knob.
  SHEET_TIMEOUT_SECONDS: 8,
};
