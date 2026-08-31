# Practitioner Map: Upload and Embed Guide

Prepared for The Pocket Project by Connecting Intelligence LLC.

This guide is for the webmaster: how to put the map folder on the server and how to embed it on the website pages. It also explains the two URL parameters, so any page can be pointed at any network or any country later without help from us.

---

## The short version

- The map is **one folder of static files**: HTML, JavaScript, CSS, and data. No build step, no database, no PHP, no server requirements. A LiteSpeed host serves it as-is.
- Upload the folder anywhere under the site. Any subfolder works; all paths inside are relative.
- Each website page embeds the same map with a small iframe snippet. The only difference between the pages is the address in the snippet.

---

## 1. Upload the folder

1. You receive the map as a folder (or a zip of it) named `map`. Feel free to rename it to something friendlier, for example `practitioner-map`. The name becomes part of the address, nothing else changes.
2. Log in to cPanel and open the **File Manager** (or connect with FTP if you prefer).
3. Navigate to where the site's files live, usually `public_html`, and go to the subfolder where you want the map. Any location works.
4. Upload the zip and use **Extract** in the File Manager, or upload the folder as it is. Make sure the folder keeps its internal structure: `index.html` at the top, with `css`, `js`, and `data` folders next to it.
5. Open the map directly in your browser to check it, for example:

   `https://pocketproject.org/practitioner-map/`

   You should see the world map with the four network filters across the top. That address, wherever you chose to put the folder, is the base address used in every snippet below.

Notes:

- Nothing needs to be installed or configured on the server. No cron jobs, no rewrites, no special headers.
- The map's data comes from the team's Google Sheet. The link to the Sheet is set inside the folder (`js/config.js`) as part of the final handover and needs no changes from you. Until that link is in place, and any time the Sheet is unreachable, the map simply uses the bundled data snapshot in its `data` folder.
- The map must be **opened through a web address**, not by double clicking the file. Double clicking `index.html` gives a blank page, because browsers block this kind of page from loading its own parts over a `file://` address. On the server it works normally, and that is the only place it needs to work.
- The page loads **nothing from the internet**. The map libraries, the fonts and the world outlines all sit inside the folder, so the map keeps working even if an outside service is unavailable.

### What is in the folder

| Path | What it is |
|---|---|
| `index.html` | The map page, the entry point. |
| `css/` | Styles. |
| `js/` | The application code and bundled libraries. |
| `data/` | World outlines, country positions, and the bundled fallback data. |

---

## 2. Embed the map on the pages

Each page gets a small iframe snippet: a frame that shows the map page inside the WordPress page. The snippets below are ready to paste.

**Before pasting, replace `PATH-TO-MAP` in every snippet with the folder's actual location from step 1.** For example, if the map lives at `https://pocketproject.org/practitioner-map/`, then `PATH-TO-MAP` becomes `practitioner-map`.

In Elementor: edit the page, drag in an **HTML widget** where the map should appear, and paste the snippet into it. Full width sections work best; the map fills whatever width it is given.

### a. Practice Groups page

```html
<iframe src="https://pocketproject.org/PATH-TO-MAP/?layer=practice_groups"
        width="100%" height="650" style="border: none; max-width: 100%;"
        loading="lazy" title="Practice Groups world map"></iframe>
```

### b. Resilience Circles page

```html
<iframe src="https://pocketproject.org/PATH-TO-MAP/?layer=resilience_circles"
        width="100%" height="650" style="border: none; max-width: 100%;"
        loading="lazy" title="Resilience Circles world map"></iframe>
```

### c. Witnessing Hubs page

```html
<iframe src="https://pocketproject.org/PATH-TO-MAP/?layer=witnessing_hubs"
        width="100%" height="650" style="border: none; max-width: 100%;"
        loading="lazy" title="Witnessing Hubs world map"></iframe>
```

(There are no Witnessing Hubs in the data yet, so this view starts empty. Hubs appear automatically once the team adds them to the Sheet; the snippet needs no change.)

### d. Integration Labs page

```html
<iframe src="https://pocketproject.org/PATH-TO-MAP/?layer=integration_labs"
        width="100%" height="650" style="border: none; max-width: 100%;"
        loading="lazy" title="Integration Labs world map"></iframe>
```

### e. Ukraine Trauma Relief page

```html
<iframe src="https://pocketproject.org/PATH-TO-MAP/?country=ua"
        width="100%" height="650" style="border: none; max-width: 100%;"
        loading="lazy" title="Practitioner groups in Ukraine"></iframe>
```

### f. All networks, no filter

```html
<iframe src="https://pocketproject.org/PATH-TO-MAP/"
        width="100%" height="650" style="border: none; max-width: 100%;"
        loading="lazy" title="Practitioner Network world map"></iframe>
```

### Changing the size

The map has no fixed size of its own. It fills whatever frame you give it and redraws itself when that frame changes, so sizing is entirely yours to set in the snippet, with no changes needed inside the folder.

`width="100%"` lets the map fill the page column and adapt to phones by itself. Leave it as it is unless you want the map narrower than the column, in which case give it a fixed width such as `width="800"`.

`height="650"` is the value to play with. Anything from 500 upwards works well. Taller gives the globe more room and makes the group list easier to read; shorter keeps more of the page above the fold. Just change the number and reload the page.

If you would rather the height scale with the width instead of being fixed, use this version, which keeps the map in a 4:3 shape at every screen size:

```html
<iframe src="https://pocketproject.org/PATH-TO-MAP/"
        style="border:none; width:100%; aspect-ratio:4/3; max-width:100%;"
        loading="lazy" title="Practitioner Network world map"></iframe>
```

`aspect-ratio:16/9` gives a wider, shallower map, `1/1` a square one. On narrow phone screens a squarer shape usually reads better than a wide one.

`loading="lazy"` means the browser only loads the map once the visitor scrolls near it, which keeps the rest of the page fast. Worth keeping.

Everything else about how the map looks, the colours, the fonts, the marker styles, is set inside the folder and is not something you need to touch.

---

## 3. Point any page at any country (no help needed)

The map understands two parameters in its address. This is how the team can create new country pages, or refocus existing ones, at any time without involving us.

**`?layer=`** shows one network only. The four values:

`practice_groups`, `resilience_circles`, `witnessing_hubs`, `integration_labs`

**`?country=`** filters the map to one country and zooms in on it. The value is the country's standard two letter code (called ISO 3166-1 alpha-2; upper or lower case both work). Five worked examples:

| Country | Code | Map address |
|---|---|---|
| Ukraine | `ua` | `https://pocketproject.org/PATH-TO-MAP/?country=ua` |
| Germany | `de` | `https://pocketproject.org/PATH-TO-MAP/?country=de` |
| Poland | `pl` | `https://pocketproject.org/PATH-TO-MAP/?country=pl` |
| Austria | `at` | `https://pocketproject.org/PATH-TO-MAP/?country=at` |
| United States | `us` | `https://pocketproject.org/PATH-TO-MAP/?country=us` |

Any other country works the same way; searching the web for "ISO code" plus the country name gives you its two letters in seconds.

**Combining both:** join them with `&`. The first parameter follows a `?`, each further one follows an `&`. For example, Integration Labs in Germany only:

```
https://pocketproject.org/PATH-TO-MAP/?layer=integration_labs&country=de
```

To make a new embed, take any snippet from section 2 and change only the address inside `src="..."`. Everything else stays the same.

---

## 4. Troubleshooting

**The map loads but shows no groups.**
The map only shows groups the team has approved: rows in the Google Sheet whose `visible` column is set to `TRUE`. If nothing appears, the rows most likely have not been approved yet. Ask the team to check the `visible` column in the Sheet. (On the Witnessing Hubs view this is expected for now, since no hubs exist yet.)

**A change in the Sheet does not show up.**
Google refreshes the published copy of the Sheet on its own schedule, usually within a few minutes. Wait five minutes and reload the page, ideally with a hard reload (Ctrl+Shift+R, or Cmd+Shift+R on Mac). The map fetches fresh data on every page load, so no caching needs clearing on the server.

**The map is cut off or has a scrollbar inside the frame.**
The iframe's `height` attribute is too small for that page. Raise it, for example from `650` to `750`. The width takes care of itself.

**The map does not load at all (blank space or a 404 page).**
The address in the snippet does not match where the folder actually is. Open the `src` address from the snippet directly in a browser tab; if it does not show the map, adjust the path until it does, then update the snippet.

**The Sheet moved or was copied.**
The map reads the Google Sheet through one link inside `js/config.js`, on the line that starts with `SHEET_CSV_URL`. If the team ever moves or copies the Sheet (Google sometimes forces a copy when ownership changes) and republishes the map data from the new Sheet, that link changes and the map needs the new one. The fix is one line:

1. Ask the team for the new published CSV link of the `map_data` tab (in Google Sheets: File, then Share, then Publish to web, tab `map_data`, format CSV).
2. Open `js/config.js` in a text editor (or the cPanel File Manager's editor) and replace the address between the quotes on the `SHEET_CSV_URL` line with the new link.
3. Re-upload just that one file to `js/config.js` inside the map folder, the same way as the original upload. Nothing else changes.

Anything the upload surfaces beyond this, send it our way during the go live window and we will resolve it together.
