# Putting the map on the site

For Noah &middot; 27 August 2026 &middot; Connecting Intelligence

You have done this once already with the CFCT Atlas, and this is the same shape of job. About ten minutes.

---

## What it is

A static web app. HTML, JavaScript, JSON. No PHP, no database, no WordPress plugin, no build step, and nothing to install on the server. It is the same arrangement as map.pocketproject.org, which is the proof it works on your setup.

Everything is bundled locally: d3, topojson, the basemap and the fonts. The map needs no outside connection to draw itself. The only thing it fetches from elsewhere is the group data, from the published Google Sheet.

## Two requirements

**It must be served over HTTP or HTTPS.** Your server does this, so there is nothing to do. Worth knowing only because opening the file directly from disk shows a blank page: browsers refuse to load JavaScript modules from a `file://` address. That is expected and is not a fault.

**Relative paths only.** So it works from any subfolder or a subdomain without editing anything.

## Upload

Put the contents of `app/` somewhere on the server. A folder like `/practitioner-map/` is fine, so is a subdomain, whichever fits your setup better.

Check it loads at, for example:

```
https://pocketproject.org/practitioner-map/practitioner.html
```

## Embed

One HTML widget per Elementor page, containing an iframe. The pages differ only in the query string.

```html
<iframe
  src="https://pocketproject.org/practitioner-map/practitioner.html?layer=practice_groups"
  style="width:100%; height:720px; border:0;"
  loading="lazy"
  title="Practitioner Networks map">
</iframe>
```

**You control the size entirely from Elementor.** Change `height` to whatever suits the page; the map fills whatever box it is given and rearranges itself for narrow screens. 600 to 800 pixels works well on a content page. A percentage height needs a parent with a fixed height, so a pixel value is usually simpler.

Per page:

| page | query string |
|---|---|
| Practice Groups | `?layer=practice_groups` |
| Resilience Circles | `?layer=resilience_circles` |
| Integration Labs | `?layer=integration_labs` |
| Witnessing Hubs | `?layer=witnessing_hubs` |
| any overview page | no query string |

Unrecognised values fail softly: a typo shows the whole map rather than an error.

## Cloudflare

Cloudflare sits in front of the site and will cache the app shell, which is what you want. **It will not cache the group data**, because that is fetched from Google on a different origin. So content edits appear without a purge; only a new version of the map itself needs one.

## Fonts, nothing to do

The Pocket Project brand asks for Georgia and Open Sans. Georgia is websafe and needs no file. Open Sans is already in the folder: nine woff2 files, 282 KB, weights 400, 600 and 700, including the Cyrillic range because eighteen groups are published in Ukrainian.

Upload `app/vendor/fonts/` along with everything else and the typeface is correct. Nothing to fetch and nothing to run.

`vendor/vendor_open_sans.py` is in the folder too. It is what produced those files, kept so they can be regenerated if a weight is ever needed, and it is not part of deploying.

## Checking it worked

Open the page and then the browser console. You should see:

```
[practitioner map] 149 groups from the live Sheet
[practitioner map] build 2026-08-27b · scope and location
```

If it says **bundled snapshot** instead of live Sheet, the Sheet address in `js/practitioner-config.js` is wrong or the Sheet is no longer shared. The map keeps working from the copy bundled with it, so a visitor sees slightly older data rather than a broken page.

If a red bar appears across the top saying the script is stale, the browser is holding an old copy. Reload; the bar exists precisely so this is never mistaken for a bug in the map.

## If the Sheet ever moves

The map reads it through one line in `js/practitioner-config.js`:

```js
SHEET_CSV_URL: 'https://docs.google.com/spreadsheets/d/…/gviz/tq?tqx=out:csv&sheet=map_data&headers=1',
```

If the Sheet is ever copied or recreated, replace that address. Two things to know about it: it selects the tab **by name**, so reordering tabs will not break it, and it requires the document to stay shared as "anyone with the link can view". Nothing sensitive is in it; facilitator street addresses are stripped before anything reaches the Sheet.

**Keep `&headers=1` on the end.** Without it, Google guesses how many rows at the top of the sheet are the header, working it out from the data. Every column in this sheet is text, so there is nothing to work it out from. On 31 August it guessed that all 150 rows were header and returned each column as a single cell with the values run together. The map correctly decided the file was unusable and fell back to its bundled copy, which is the right behaviour but means it stops seeing anything new in the Sheet. `headers=1` states the answer so nothing is inferred.

That failure is worth recognising if it ever recurs, because it does not look like a failure. The map keeps working. The only sign is one line in the browser console:

```
[practitioner map] the Sheet could not be read, showing the bundled snapshot instead
```

If you see that, the data on screen is frozen at the last release, however current it looks.

## The other half of your job

The daily WordPress sync is specified in `COLUMN_SPEC.md` in this folder. Two things worth reading there even if you skim the rest:

**Do not sync the `address` field.** It is very often a facilitator's home address, and the map is public.

**Five columns are the team's**: `scope`, `location`, `visible`, `lat`, `lng`. A sync run overwriting one of those would undo real work.
