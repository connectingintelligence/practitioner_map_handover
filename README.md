# Practitioner Network Map

An interactive map of the Pocket Project's Practice Groups, Resilience Circles and Integration Labs, built to embed in pocketproject.org.

Connecting Intelligence &middot; 27 August 2026

---

## Start here

**If you are Noah**, you want `for-noah/`. Two documents: how to put the map on the site, and what the daily WordPress sync should write.

**If you are Kosha or on the team**, you want `for-the-team/`. The spreadsheet the map reads, and three short documents: two decisions we need from you, and a list of gaps in the source data.

**To just look at the map**, open a terminal in `app/` and run:

```
python3 serve.py
```

It opens in your browser. Nothing is installed, nothing is uploaded, it runs entirely on your own machine.

---

## What this is

One map, embedded on several pages. Each page differs only by its web address:

| address | shows |
|---|---|
| `practitioner.html` | all networks |
| `practitioner.html?layer=practice_groups` | Practice Groups only |
| `practitioner.html?layer=resilience_circles` | Resilience Circles only |
| `practitioner.html?layer=integration_labs` | Integration Labs only |
| `practitioner.html?country=de` | zoomed to Germany |
| `practitioner.html?layer=practice_groups&country=de` | both together |
| `practitioner.html?lang=de` | German labels |

So the Practice Groups page opens showing Practice Groups, and a country page can open showing that country. One file on the server, many views.

## What is in it today

**149 groups.** 56 Practice Groups, 18 Resilience Circles, 75 Integration Labs. No Witnessing Hubs yet; the map already knows about them and they will appear on their own once the posts exist.

**89 have a place on the map.** 68 in a city, 18 at a country, 3 across a whole region. The other 60 meet online and are about no particular place, and they are listed in a table you can open beside the map rather than being pinned somewhere they are not.

## How a group gets onto the map

Everything comes from one Google Sheet, which the Pocket Project owns. The map reads it live, so an edit in the Sheet appears on the map the next time somebody opens the page. No redeploy, no waiting.

Two columns decide where a group appears.

**`scope`** is how far it reaches: `local`, `national`, `continental` or `global`. Usually left empty and worked out automatically from the rest of the row.

**`location`** is where it is actually rooted: a two-letter country code, or the name of an area such as `africa` or `latin_america`.

They are separate on purpose. A group working across a whole continent is not the same as a group with no location, and pinning it to one country would be false precision. Holding both means the map can show reach when you are zoomed out and the actual place when you zoom in: the Africa Practice Group shades the continent, and zoomed in also shows Berlin, with its card reading "Across Africa, run from Berlin".

## What the markers mean

| | |
|---|---|
| filled circle | meets in this place, you could go |
| hollow circle | online, and this is only where it is run from |
| hollow diamond | a whole country, meeting online |
| shaded countries | a whole region |
| small ringed circle | where a region group is run from, appears as you zoom in |
| a number | several groups at one place, click to see them |

The hollow shapes matter. Half the placed groups meet online but are pinned to a facilitator's city, and a solid dot there would tell a visitor there is something to attend when there is not.

## Folders

```
app/                 the map itself. This whole folder goes on the server.
for-noah/            embedding, and the sync specification
for-the-team/        the spreadsheet, and what we need decided
```

`app/` contains only the files the map loads. The engine it is built on is 53 MB, most of it data for the CFCT Atlas that this map never touches; what is here is the 2 MB that matters, so nothing in the folder is unclear or safe to delete.

## Three things still open

**Two decisions from Kosha**, both in `for-the-team/`. Fifteen Integration Labs have a proposed country awaiting confirmation, and the Africa Practice Group needs a choice between three options.

**Two columns worth adding**, both described in `for-noah/COLUMN_SPEC.md`, and both worth settling before the sync is built rather than after.

`iso2` is the important one. Every group currently on the map was placed from its city by a step that ran once, offline, before delivery, and does not ship. A group added after that arrives with a city and no coordinates, and a city name alone is not something the map can turn into a position. Syncing a two-letter country code from the existing country dropdown gives every new group somewhere to sit. Without it the map quietly stops growing while continuing to look fine.

`meets` is the smaller one. Meeting times also come from that same one-off extraction, so a group added tomorrow would show no meeting time.

**Open Sans is not yet bundled.** The map falls back to a system typeface until it is. One command, and it is described in `for-noah/EMBED_GUIDE.md`.

## Questions

Max Roth, Connecting Intelligence, max@connectingintelligence.com
