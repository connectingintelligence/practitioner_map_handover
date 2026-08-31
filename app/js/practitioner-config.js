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
  SHEET_CSV_URL: 'https://docs.google.com/spreadsheets/d/1cpGs2nmhxy4QMenG7nMEC1blwxkogS1yZ_dz7fHjlZE/gviz/tq?tqx=out:csv&sheet=map_data',

  // If the Sheet cannot be reached, fall back to the bundled snapshot rather
  // than showing an empty map. A visitor sees slightly older data instead of a
  // broken page, and the reason is logged to the console.
  FALL_BACK_TO_BUNDLE: true,

  // Seconds before a slow Sheet request is abandoned for the bundle. Google is
  // usually well under a second; this is protection against a hang, not a
  // performance tuning knob.
  SHEET_TIMEOUT_SECONDS: 8,
};
