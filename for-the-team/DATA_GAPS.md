# What the map data still needs from you

Dear team,

all 147 currently published groups are in the `map_data` tab of the Google Sheet: 55 Practice Groups, 17 Resilience Circles, and 75 Integration Labs. Witnessing Hubs do not exist on the site yet, and the map is ready for them whenever they do.

Thanks to the WordPress export Noah sent, most of the location work is already done. 71 groups are placed on the map, 61 of them in their actual city rather than at the centre of their country, and every Practice Group and Resilience Circle now has a country. What follows is what the website genuinely does not know, so it needs your knowledge. Everything is edited directly in the `map_data` tab.

None of it blocks the preview. The more that is filled in before the review call, the fuller the map will look.

## 1. The 75 Integration Labs: how should they appear?

This is the one real decision, and it is Kosha's rather than a data-entry task.

The Labs carry no location field in WordPress at all, and as Noah points out, essentially all of them meet online. At the moment every Lab is marked `global`, which means it appears in the global panel beside the map, listed by name and clickable, rather than as a pin somewhere it does not really sit.

Three options:

- **Leave them global.** Nothing to do. The Labs stay visible and clickable, and the map stays honest about the fact that they are online spaces.
- **Give the place-based Labs a country.** Several clearly have a geographic focus even though they meet online, for instance the Ukraine, Israel, Lebanon and Switzerland labs. Enter a country for those in the Sheet and they will appear on the map at once. Leave the rest global.
- **Add a location field to Labs in WordPress.** The most thorough option, and the one that keeps working automatically for future cohorts. It means Noah adds the field and someone fills it in for 75 labs.

You can start with the first and move to the second at any time. Nothing needs rebuilding.

## 2. The 32 finished labs from the 2023 to 2024 cycle: show or hide?

Of the 75 published Labs, 43 are the live 2026 cohort. The other 32 are the completed 2023 to 2024 cycle, which the website still publishes as report pages. They are in the Sheet so nothing gets lost, but you decide whether they belong on the map.

- To show one, put `TRUE` in its `visible` column.
- To keep it off the map, leave `visible` empty or set it to `FALSE`.

A side effect worth knowing: the report pages do not publish a format or an application status, so `status` is empty for all 32 of these rows and `format` is empty for 31 of them. If you decide to show them, please fill those in as well, for example `online` and `closed`.

## 3. Please confirm the scale of each group

The `scale` column decides how a group is drawn: `local` gets a pin in its city, `national` a marker at the centre of the country, `regional` a soft halo across an area, and `global` an entry in the panel beside the map.

The website's own geographic reach field turned out to be unreliable, so we set the scale from the actual location data instead: a group with a real city became `local`, a group with only a country became `national`, and everything without a country became `global`. The result is 61 local, 8 national, 2 regional and 76 global.

That is a sensible starting point rather than the truth. A group that meets in Berlin but serves all of Germany should be `national`, and only you know which those are. Correcting a row is simply typing a different value in the column.

## 4. Africa Practice Group: the country tag needs a correction

On the website this group is tagged with the country Germany, but its own description says it is for people living in Africa and the diaspora. It is currently marked `regional` and placed provisionally at the centre of the African continent using the manual coordinate columns, so that it appears with its halo rather than sitting in Germany.

Two small things:

- Confirm or adjust the `lat` and `lng` so the halo sits where it feels right. These two columns always override the automatic placement, which is exactly what they are for.
- Correct the `country` column to whatever represents the group best. It stays `regional` either way.

Fixing the tag on the website itself would be even better, but the Sheet is what the map reads.

## 5. Six groups sit at the centre of their country

These have a country but no city we could place them in, so they appear at the geographic centre of the country rather than anywhere meaningful. If you know where they actually meet, adding the city to the `city` column is enough, and we will add it to the map's list of known places.

## 6. Smaller gaps

- **One group has no facilitator listed** and **four have no description.** Both appear in the popup, so a short line each would help.
- **31 rows have no format.** These are almost entirely the finished 2023 to 2024 labs from point 2.
- **The `visible` column is empty everywhere.** That is deliberate: nothing is hidden by default and every published group is shown. Set a row to `FALSE` only when you want it off the map.

## How to check your work

After editing, the map picks up changes the next time it loads, within a few minutes. If something does not appear, the usual causes are a `visible` set to `FALSE`, a country name spelled differently from the list, or a `scale` value outside the four allowed words.

Thank you, this is the part only you can do.

---

## Facilitator photographs, for Noah (added 27 August)

**Nothing is broken.** Every image URL we hold is valid. I tested a sample of 80
against the live site, and then again from a different origin to rule out
hotlink or referrer protection. All returned 200 and rendered. So this is not a
missing-image problem, it is a weight problem.

**Every photograph is the full-size original.** Seven of them measured 2,271 KB
between them, and they are displayed as circles 28 pixels across in the card and
46 in the drawer. Across the 287 photographs on the map that is roughly 90 MB if
every card were opened. A card with three facilitators can be waiting on the
better part of a megabyte, which is why a face sometimes arrives late or looks
like it is not arriving at all.

**WordPress's smaller variants mostly do not exist.** Of seven tested, only two
had a `-150x150` version and none had `-300x300`. That is expected for the 104
photographs uploaded through **Gravity Forms**, which writes to
`/wp-content/uploads/gravity_forms/...` and bypasses the media library
entirely, so WordPress never generates thumbnails for them.

**What we have done on our side.** The map now shows the person's initial in the
circle from the first frame, fades the photograph in over it once decoded, and
leaves the initial in place if the image never arrives. So it degrades quietly
rather than showing a hole or a torn-image icon. Images are lazy-loaded and
decoded off the main thread. None of that makes the files smaller.

**What would actually fix it, in order of effort:**

1. **Cloudflare Image Resizing or Polish.** You already run Cloudflare in front
   of the site. Polish alone would strip metadata and re-encode; Resizing would
   let a URL ask for a 150px version. Nothing changes in WordPress and nothing
   changes in the map. This is the smallest change with the largest effect.
2. **Regenerate thumbnails** for the media library, then have the automation
   write the `-150x150` URL rather than the original. Does not help the 104
   Gravity Forms photographs.
3. **Have Gravity Forms write into the media library** rather than its own
   directory, so new uploads get thumbnails like everything else. Worth doing
   for the future regardless of the other two.

If none of this is convenient, the map still works. Faces simply arrive a beat
late on a slow connection.

---

## Missing facilitator photographs, resolved (27 August)

**Eight were our fault and are fixed.** The extraction built its attachment
index one export file at a time, but WordPress does not put an image in the
same export as the post that uses it. Patrick Dougherty's photograph, for
instance, sits in `Integration Labs.xml` while his Practice Group sits in
`Practice Groups.xml`, so the id in the post meta could not be resolved and the
map showed an initial instead of a face. Indexing all three exports together
recovered eight photographs across three groups.

Leader photographs now: **295 of 313**.

**Of the 18 still without one, 14 are simply empty in WordPress.** Nobody
uploaded a photograph for those people. Nothing to fix at our end, and the map
shows their initial in a neutral circle rather than a gap.

**Four reference an image that is not in any export.** These are ids recorded
against a group whose file WordPress did not include:

| attachment id | group |
|---|---|
| 40449 | Praxisgruppe München |
| 39878 | Being Jewish: Persecution and Perpetration |
| 32183 | 'Climate Crisis' Lab |
| 27707 | Central U.S. Practice Group |

Most likely the image was deleted from the media library while the reference
stayed behind, which WordPress allows. If they still exist on the site, a fresh
export would pick them up. Not worth chasing four images unless they matter.

**For Noah:** if the automation ever writes photograph URLs into the Sheet,
resolve attachment ids against the whole media library rather than a single
export. The REST endpoint `/wp-json/wp/v2/media/<id>` returns the URL directly
and avoids this class of problem entirely.
