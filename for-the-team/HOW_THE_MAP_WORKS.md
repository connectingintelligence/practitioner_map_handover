# How the map decides what to draw

For the Pocket Project team &middot; 27 August 2026 &middot; Connecting Intelligence

Not a technical document. It explains what the map is claiming when it puts a mark somewhere, so you can tell whether it is claiming the right thing.

---

## The one rule behind everything

**The map should never say something nobody told us.**

That sounds obvious and it is not. Most of the design decisions here came from noticing that an ordinary-looking choice was quietly asserting something the data did not support. Two examples are described further down, both of them mistakes we made and corrected.

## Where a group appears

Four possibilities, decided by two columns in the Sheet.

**A city.** The group meets somewhere, or is run from somewhere. 68 groups. A filled circle if people actually gather there, hollow if it is online and the city is only where the facilitator sits.

**A country.** No particular city, but a country: either open to the whole of it, or about it. 18 groups. A hollow diamond at the country's centre.

**A region.** Africa, Latin America. 3 groups. Every country in the region shaded, with a heavier outline around it.

**Nowhere.** The group meets online and is about no particular place. 60 groups, nearly all Integration Labs. These are listed in a table beside the map. Not being on the map is not a demotion; it is the honest answer, and the table shows more about each group than a dot ever could.

## Why solid and hollow

Half the groups with a place on the map meet online. They are pinned to the city their facilitator lives in, because that is what the data says.

A solid dot over Los Angeles tells a visitor there is something in Los Angeles they could attend. For an online group that is not true. So online groups are drawn hollow, and their card says "Hosted from Los Angeles" rather than just "Los Angeles".

It costs one word and it stops someone travelling across a city to a meeting that only exists on a video call.

## Why regions are shaded rather than circled

The first version drew a circle around region groups. It looked reasonable and it was wrong twice over.

Over Lebanon the circle was mostly sea. Over Europe several circles overlapped into a single bruise that hid the markers underneath. And the size of the circle was a number we picked, with no relationship to the region it claimed to represent.

A country's border is real and already on the map. Shading every country in a region invents nothing. So Africa is its 55 states, shaded, and Latin America its 23.

## Why "scope" and "location" are two columns

Kosha asked for the Africa Practice Group to show across the whole continent, which is right: that group genuinely has no single country.

But if European and American groups appear as cities while Africa and Latin America are single blocks, the map is saying something about those regions that the network does not say. That flattening is not a neutral accident in this field.

So reach and anchor are held separately. **`scope`** says how far a group reaches. **`location`** says where it is actually rooted. The map then shows reach when you are zoomed out and the actual place when you zoom in: Africa shades the continent, and zooming in reveals Berlin, with the card reading "Across Africa, run from Berlin".

Both statements are true, and neither has to be given up.

All seven continents are defined, not just the two currently used. If only Africa and Latin America were available as regions, a pan-European group would have no way to be described the same way, and the imbalance would be a property of our file rather than of the network.

## Two things the map deliberately does not do

**It does not translate group names.** Eighteen groups are published in Ukrainian and keep their own names, with an English or German line underneath. The name is the group's own; replacing it would mean a Ukrainian speaker arriving from a Ukrainian page and not finding their own circle. Their descriptions are also left untranslated, on the reasoning that machine-translating text about trauma support written by practitioners during a war is worse than leaving the original standing.

**It does not show street addresses.** The WordPress export carries an address for 158 groups, and 24 are full street addresses, several of them plainly private homes. Those are used once, offline, to work out which city a group belongs to, and go no further. They are not in the Sheet and not in anything the map downloads.

## Two mistakes worth knowing about

Both are fixed, and both are here because they explain why some things look the way they do.

**A circle in the Atlantic.** The Southern Africa Practice Group was drawn as a large circle centred on Cape Town, spreading out over the ocean and excluding Johannesburg, Durban and Pretoria. Looking again at the data, every field the Pocket Project had filled in said South Africa, and it meets at 6pm SAST. Only the title says Southern Africa. It is now a normal marker on Cape Town.

**A marker in the Congo.** The Africa Practice Group publishes Berlin, Germany. It had been given coordinates in the middle of the Congo basin, by us, because Berlin looked wrong. Nobody asked for that. It is now a continental group, shading Africa, with Berlin visible as you zoom in.

The lesson in both, and the reason for the rule at the top: a plausible guess presented with the same confidence as real data is worse than an empty field.

## What we need from you

Two decisions, both in this folder.

`LAB_PLACEMENT_PROPOSAL.md` has 15 proposed countries for Integration Labs whose titles name a place, plus 12 more that name a place but need a judgment we should not make on your behalf.

`NOTE_africa_groups.md` has three options for the Africa Practice Group.

Neither blocks anything. The map works today either way.
