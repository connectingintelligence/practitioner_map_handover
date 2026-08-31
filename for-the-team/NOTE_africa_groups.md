# Two Africa groups, and what continental shading turned out to cost

For Kosha &middot; updated 31 August 2026 &middot; Connecting Intelligence

**Read the last section first if you only read one.** The first two are settled and are here as a record. The last one is a live question, and it is the one that matters most for how the map reads.

Two Practice Groups have Africa in their name and neither sat comfortably on the map. One is now resolved. The other needs a decision from you, because it turns on what the group actually is rather than on anything the data can settle.

## Southern Africa Practice Group, now placed in Cape Town

**It used to be drawn as a large translucent circle centred on Cape Town, spreading out over the Atlantic.** That was my doing and it was wrong. I had given it a "regional" treatment with a fixed radius, and a fixed radius is a guess: the circle was mostly ocean and it excluded Johannesburg, Durban and Pretoria while claiming to represent Southern Africa.

Looking again at what you had actually recorded, the answer was already there:

| field | value |
|---|---|
| country | South Africa |
| city | Cape Town, South Africa |
| format | online |
| meets | 6:00pm to 7:30pm **SAST** |
| facilitators | Megan Adderley, Delphine Oliver |

Only the title says Southern Africa. Every field you filled in says South Africa, and the meeting time is South Africa Standard Time.

So it is now a normal marker on Cape Town, drawn hollow, with the card reading **"Online, hosted from Cape Town, South Africa"**. That makes no claim about who the group is for. It only says where it is run from, which is the same thing the map says about every other online group.

**Nothing about the group's reach is lost.** Its own description, "for people who live in, previously lived in, have visited or are interested in Southern Africa", is about who is welcome, and that sits in the card where a visitor reads it. Who a group welcomes is not something a map can draw, and no other group has it drawn either.

If we have this wrong, and the group really is pan-regional in a way that makes a Cape Town marker misleading, say so and it goes back to the panel beside the map.

## Africa Practice Group, now shown across the continent

**Resolved since this note was first written.** You asked for this group to show across the whole of Africa, and it now does. The reasoning below is kept because it explains how we got there.

| field | value |
|---|---|
| country | **Germany** |
| city | Berlin |
| format | online |
| description | "a monthly gathering for people of African descent, living in Africa and the diaspora" |

By the rule we just applied to the Southern Africa group, this would become a marker on Berlin reading "Online, hosted from Berlin, Germany". That is literally what your data says. It also looks strange: a group for people of African descent across Africa and the diaspora, marked with a dot in Germany.

Worth knowing what came before: this group previously carried coordinates in the middle of the Congo basin. Those were not yours. I placed them there myself, because Berlin looked wrong to me, and I wrote a special case into the pipeline so the country would not override my guess. That has been removed. It is exactly the kind of quiet invention this map should not contain, and it is why I would rather ask than decide.

**What we built.** Reach and anchor are now two separate fields rather than one. `scope` says how far a group reaches, `location` says where it is rooted. The Africa Practice Group has scope `continental` and location `africa`, and is anchored in Berlin.

So the map shades the continent when you are zoomed out, and as you zoom in a small marker appears on Berlin, with the card reading **"Across Africa, run from Berlin"**. Both statements are true and neither has to be given up. The same treatment carries the two Latin American Labs.

## The wider pattern

Both of these are the same gap, and it is worth naming because it will come up again. **A group can relate to a place in ways a map cannot draw**: where it meets, where it is run from, what it is about, and who it is for. We now distinguish the first three. The fourth, who is welcome, lives in the words and always will.

## The question: three groups now colour 77 countries

This is the cost of continental shading, and we would rather show you the arithmetic than quietly design around it.

A country on the map is tinted for one of two reasons. Either groups are actually there, or it falls inside a region that some group claims. Those look identical on screen.

As of today, of the 93 countries with any colour on them:

| tinted because | countries | groups responsible |
|---|---|---|
| they are inside Africa | 55 | 1 |
| they are inside Latin America | 22 | 2 |
| a group is genuinely there | 16 | 147 |

**Three groups colour 77 countries. The other 147 groups colour 16.**

The shade itself is accurate: each African country shows the palest step, meaning one group, and Germany shows the darkest, meaning about twenty five. But almost nobody reads a map that way. Area is read as quantity long before shade is. Seen quickly, the map says the network is enormous across Africa and Latin America and thin in Europe, which is the reverse of what is true.

We do not think that is a small cosmetic matter in this particular field. A map about collective trauma that renders Africa as one undifferentiated block, and Europe as named cities, is making a familiar move, and it would be making it on our watch rather than the network's.

**To be clear about where this came from:** it is not a fault in your request. You asked for the Africa group to show across the continent, which is right, because that group genuinely has no single country. The shading is simply the most visible way to say so, and visibility is exactly the problem.

**Options, in the order we would suggest considering them:**

1. **Leave it as it is.** The reading is imperfect but the underlying claim is true, and the group is properly represented. This is what is deployed today.
2. **Make the region wash much fainter** than a country with real groups, so the two reasons stop looking the same. Keeps everything you asked for and costs us very little.
3. **Name the region without shading it.** The label "Africa" prints on the continent, the groups stay clickable, and tint then means one thing only: groups are actually here.

We have not changed anything. It is your call, and the map works either way.

## Also still open, from before

The Balkans, South Asia and Early Modern Europe each have an Integration Lab devoted to them and none is a country. The machinery now exists to shade any of them, and `the_balkans` is already defined in the data file and unused. Whether to switch them on is the same question as above, one level smaller.
