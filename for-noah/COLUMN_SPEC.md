# Sheet Column Spec

For the daily automation that syncs WordPress posts into the Google Sheet.

Version 1.5 &middot; 31 August 2026 &middot; Connecting Intelligence for The Pocket Project

The Sheet is **Pocket Project Practitioner Map Data**. The map reads from it. This document describes what the automation should write and how it should behave, so it can be built once and left alone.

## The approach, as agreed

Your design, and I think it is the right one:

> While we could have the Gravity Forms inputs feed the sheet directly, it is also possible to add these groups manually without going through the form. Thus I think it safer if the posts for each group type are checked by an automation e.g. once a day, and feed the information into a sheet that way.

Reading the posts rather than the form means a group added by hand in WordPress travels the same path as one that came through the form. One route into the data instead of two, and a correction made in WordPress reaches the map on the next run.

Timing: the map ships with the Sheet already populated. I seed all currently published groups as part of delivery, so nothing is waiting on the automation. It takes over from there, whenever suits you.

## The two tabs

**`sync`** is a full mirror of the WordPress posts, rewritten completely on every run. Nobody edits it by hand. It exists so the team can always see what the website currently says, and so a problem can be diagnosed by comparing the two tabs.

**`map_data`** is the tab the map reads. It holds the reviewed version, including the things WordPress does not know: how far a group reaches, where it is anchored, its coordinates where they had to be looked up, and whether it should be publicly visible.

## How rows move from `sync` to `map_data`

One rule:

**Match on `id`. If the id is new, append the row to `map_data`. If the id already exists, leave that row untouched.**

New groups therefore appear on the map by themselves, with no manual step, which is what Kosha asked for. Corrections the team has made are never overwritten by a later run, which is what makes the Sheet trustworthy to edit.

Changes to existing groups are updated by hand, which matches what Kosha wrote on 28 July: "We understand that changes to existing groups would need to be updated manually." The `sync` tab makes those changes easy to spot, since it always shows the current website state beside the reviewed one.

If you would rather the automation also refresh the WordPress-owned fields on existing rows, that works too, as long as it never touches `scope`, `location`, `visible`, `lat` or `lng`. Those five are the team's, and overwriting them would undo real work. Your call, both behaviours are fine for the map.

## Columns for the `sync` tab

In this order, with exactly these header names in row 1.

| # | Column | Source in WordPress | Notes |
|---|---|---|---|
| 1 | `id` | see below | Stable, unique, never reused |
| 2 | `network` | post type | `practice_groups`, `resilience_circles`, `integration_labs`, `witnessing_hubs` |
| 3 | `name` | post title | |
| 4 | `url` | permalink | Full URL |
| 5 | `status` | post status | `publish`, `pending`, `draft`, `private`, passed through as-is |
| 6 | `city` | `city` | Free text, may be empty |
| 7 | `country` | `country` | The dropdown value, including `International` |
| 8 | `lat` | the geo field's `_lat` | Empty if not set, see note below |
| 9 | `lng` | the geo field's `_lng` | Empty if not set |
| 10 | `scale` | `geographic-reach` | Passed through as-is, see the note on scale |
| 11 | `format` | `format` | `online`, `in_person`, `hybrid` |
| 12 | `language` | `language` | |
| 13 | `applications` | `applications` | e.g. `Open for new members` |
| 14 | `facilitator` | `group-leader-1` to `group-leader-5` | Non-empty ones joined with `; ` in one cell |
| 15 | `description` | see below | One short line, plain text, no HTML |
| 16 | `synced_at` | the automation | ISO timestamp of the run |
| 17 | `iso2` | derived from `country` | **New in 1.5.** Two-letter country code. See the section below, this is the one real addition |

**On `id`.** Network prefix plus the URL slug: `pg-` for Practice Groups, `rc-` for Resilience Circles, `il-` for Integration Labs, `wh-` for future Witnessing Hubs. So `https://pocketproject.org/pg/praxisgruppe-leipzig/` becomes `pg-praxisgruppe-leipzig`. This matches the ids already in `map_data`, which is what makes the match-on-id rule work from day one. The WordPress post ID would also be unique, but the slug version is readable for the team when they are correcting rows.

**On vocabulary.** Exactly the values above, lowercase with underscores. `in_person` rather than `In Person`, `practice_groups` rather than `Practice Groups`. The map normalises spaces and hyphens, but the team reads this Sheet too, and one spelling throughout keeps it clean.

**On `description`.** Use `focus-areas` for Practice Groups and Resilience Circles, and `subtitle` for Integration Labs. If neither exists, leave it empty rather than falling back to the post body. Plain text, HTML stripped, roughly 180 characters, since it appears in the map popup.

**On empty cells.** Empty is fine everywhere except `id`, `network`, `name` and `url`. Empty is much better than a placeholder like `N/A`, which currently appears in some address values.

**On addresses.** The export carries an `address` field, and it is very often a facilitator's home: apartment numbers, residential streets. **Please do not sync it.** I use it once, offline, to work out which city a group belongs to, and it goes no further. Anything that reaches the Sheet can reach the map, and the map is public.

## What changed in 1.5

One new column to sync: **`iso2`**. It is the only thing in this document that adds work, and the section below explains why it is needed. Everything else in 1.5 is a correction to our own code, not to yours.

## What a new group needs before it can be drawn

**This is the most important paragraph in this document, and it was missing until 31 August.**

A city name on its own is not enough to put a group on the map. Nothing in the map turns "Shanghai" into a position. The gazetteer that does that runs offline, on my machine, when I prepare the seed data. It is not part of what ships, and it never runs again after delivery.

So a row that arrives with `city` filled in and `lat`, `lng` and `iso2` all empty **has no position at all**. The map cannot draw it.

This is not a rare edge case. It is what will happen to **every single group added after delivery**, because the sync writes `city` and `country` from WordPress while `lat` and `lng` are only present on the 22 Practice Groups that happen to have the geo field filled. Left alone, the map would quietly stop growing while continuing to look perfectly healthy.

A group can be positioned in any one of these ways, and it needs at least one:

| What is filled | Where it is drawn |
|---|---|
| `lat` and `lng` | Exactly there. Best result, and it is what the geo field in WordPress already gives us |
| `iso2`, e.g. `DE` | At the centre of that country |
| `location`, e.g. `africa` | Shaded across that whole area |
| `field_country` | At the centre of the country the group is *about* |
| none of the above | Nowhere. It falls to the table beside the map |

**What I am asking for: sync `iso2`, derived from the `country` dropdown.**

The dropdown is a fixed list, so this is a lookup table written once, not a judgment call per group. `Germany` becomes `DE`, `Switzerland` becomes `CH`, `Ukraine` becomes `UA`. `International` has no code and should be left empty, which is correct: that group genuinely has no country.

With `iso2` filled, a new group always has somewhere to sit. If the geo field is also filled, the map uses the coordinates instead and the group sits in its actual city rather than the middle of the country. The two work together, and `iso2` is the floor rather than the target.

If you would rather not add it, the alternative is that someone on the team fills `lat` and `lng` by hand for each new group. That is a real ongoing task rather than a one-off, which is why I am suggesting the column.

**How you will know if this goes wrong.** A group with no position now says so. It appears in the table beside the map rather than vanishing, and the browser console names it:

```
[practitioner map] 1 group(s) name a place but have no coordinates,
so they cannot be drawn. Add lat and lng, or an iso2 country code,
in the Sheet. Listed in the overlay table meanwhile: pg-example (Shanghai)
```

Before 31 August such a row was counted in the "on the map" total, given no marker, and left out of that table too: present in the number, absent from everywhere a person could look. That was our bug and it is fixed.

## What changed in 1.4

Two columns replace `scale` and `field_country`. **Neither is synced, so this changes nothing you have to build**, but the tab you write into now has them and they should not be overwritten.

`scale` and `field_country` still work and are still read. They are marked superseded in the workbook rather than removed, so nothing written before this change breaks.

## Columns the `map_data` tab adds

Three columns exist only on `map_data`. They hold judgments WordPress cannot make, they are the team's to edit, and the automation must never write to them.

| # | Column | Filled by | Notes |
|---|---|---|---|
| 17 | `visible` | the team | Empty means shown. `FALSE` hides the row without deleting it |
| 18 | `scope` | derived, or the team | `local`, `national`, `continental`, `global`. Usually empty and worked out from placement |
| 19 | `location` | the team | An ISO2 code, or the name of an area. Several codes separated by spaces are allowed |
| 20 | `field_country` | superseded | Kept and still read. Use `location` instead |

**Five columns are the team's and the automation must never write to them: `scope`, `location`, `visible`, `lat`, `lng`.** They hold decisions, and a sync run overwriting one would undo real work.

## On `scope` and `location`

This is the only conceptual change since 1.3, and it came out of a real disagreement worth recording.

Kosha asked for the Africa Practice Group to show across the whole continent, and the two Latin American Labs across Latin America. Reasonable: those groups genuinely have no single country. But if European and US groups resolve to cities while those two are one continental block, the map says something about Africa and Latin America that the network does not say. In this field that particular flattening is not a neutral accident.

The resolution is two columns instead of one, because reach and anchor are different questions:

**`scope`** is how far a group reaches. `local`, `national`, `continental`, `global`. Leave it empty and it is derived from where the row lands, the same way `scale` always was. Write it only when the reach is a decision placement cannot infer, which in practice means `continental`.

**`location`** is where the group is actually rooted. A two-letter country code, or the name of an area from the list below. Several codes separated by spaces for a group rooted in more than one country.

The map then shows **reach when zoomed out and precision when zoomed in**. Africa shades at a distance; zoom in and a small ringed marker appears on Berlin, with the card reading "Across Africa, run from Berlin". Both statements are true.

**Areas currently defined:** `africa`, `europe`, `asia`, `north_america`, `south_america`, `oceania`, `antarctica`, `latin_america`, `southern_africa`, `balkans`.

All seven continents exist deliberately, not just the two in use. If only Africa and Latin America were available, a pan-European group would have no way to be described the same way, and the asymmetry would be a property of our data file rather than of the network.

Membership follows the UN M49 geoscheme. Adding an area is one entry in `data/practitioner_regions.json`.

**On `field_country`.** This is the one new thing I am asking for, and it exists because of the Labs.

A Practice Group has a place: people gather there. A Lab has a subject, and the subject often has a place. "Collective & Intergenerational Trauma in Lebanon" meets on a video call across several timezones, so it has no meeting place, but it is unmistakably about Lebanon. `field_country` is where that goes: `LB`.

It is deliberately separate from `country`. `country` means the group meets there, and the map draws a marker you could travel to. `field_country` means the group enquires into that place, and the map draws a soft halo instead, the same treatment regional groups already get. The two say different things and are never mixed.

Empty means the group has no single geographic subject, and it stays in the panel beside the map exactly as now. That includes the six Labs whose titles already end in "Global", which read as a deliberate signal that the rest are not.

One code per row. A Lab spanning two countries, "Deutschland, Russland: Kollektive Wunden" for instance, either picks the one it is most anchored in or stays empty. Splitting a marker across two places is not something this map can do honestly, and a list entry is better than a misleading dot.

## Notes on specific fields

**Coordinates.** In the export the geo fields carry a hashed key prefix, for example `884d9804999fc47a3c2694e49ad2536a_lat`. Please output them as plain `lat` and `lng`. 22 published Practice Groups already have them, which is genuinely useful.

Everything currently in the Sheet, I placed from city and country before delivery. That was a one-off. It does not happen again for groups added later, which is what the section on positioning above is about.

**Status and visibility.** The map shows a group when the team has not hidden it. Pending, draft and private rows still come through the sync so they are visible in the Sheet, but they are not drawn on the map. This matches the note on the site that only fully approved groups appear.

## The scale field

The map draws four kinds of group differently: `local` gets a pin in its city, `national` a marker at the centre of the country, `regional` a soft halo across an area, and `global` an entry in the panel beside the map.

`geographic-reach` is the natural source for this, but as it stands it is free text and unreliable in both directions. It is filled on 19 of 56 published Practice Groups, with values ranging from `Global` to `Stadt` to `Rhein-Main-Gebiet`, it is empty on every Resilience Circle, and in at least one case it reads `Global` for what is plainly a city group.

So for now I derive the scale from the location data and the team confirms it in `map_data`.

**My suggestion, if you have the appetite:** turn `geographic-reach` into a dropdown with exactly `local`, `national`, `regional`, `global`. The existing values map easily, `City`, `Stadt` and `Bern` become `local`, `Rhein-Main-Gebiet` becomes `regional`, `Country` becomes `national`, `Global` stays `global`. New groups then arrive correctly classified and nobody maintains it by hand afterwards. If it is more than it is worth right now, leaving the field alone costs nothing, the derivation handles it.

## Integration Labs

The Labs carry no location fields at all, and as you say nearly all of them meet online. There is nothing for the pipeline to find: no city, no country, no coordinates on any of the 75.

That matters more than it first sounds, because **the Labs are 75 of the 147 groups**. More than half the data has no presence on the globe. They appear in a dedicated panel beside the map, visible, clickable and listed by name, rather than pinned somewhere they do not sit. That is honest, and it is where we start.

`field_country` is the way out, and it needs nothing from the automation. It is a `map_data` column the team fills in when a Lab is clearly about a place, and the map then draws a soft halo over that country rather than a marker. Empty leaves the Lab in the panel, so filling it in is optional and can happen a few rows at a time.

To make it concrete rather than a blank column, I have gone through all 75 titles and proposed a code for the 27 that name a place or a people. That list is `docs/LAB_PLACEMENT_PROPOSAL.md`. It is a starting point to correct, not a decision I have taken. Several are genuinely arguable and I have flagged which.

Worth knowing either way: the Labs are the **best** documented network, not the worst. Focus, invitation, methodology, meeting schedule, leaders and photographs are populated on all 75. It is only place they lack.

## The fourth network

Witnessing Hubs. They came up in Kosha's original brief as still to be created, so there is nothing to export. The map already carries the network value, so hubs appear on their own once posts exist, with no changes needed from either of us.
