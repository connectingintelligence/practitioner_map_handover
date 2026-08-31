# Integration Labs: a proposed starting point for `field_country`

For The Pocket Project &middot; 26 August 2026 &middot; Connecting Intelligence

## Why this exists

The Integration Labs carry no location in WordPress. No city, no country, no coordinates, on any of the 75. That is not an oversight in the export or a gap in our pipeline, the fields simply are not there, and for good reason: a Lab is a cohort that meets online across timezones for the better part of a year. There is no address to record.

The consequence is that **75 of the 147 groups have no presence on the globe.** They appear in a panel beside the map, listed by name and fully clickable, but the largest network is the one you cannot see on the map itself.

`field_country` is the proposed way out. It is a column on the `map_data` tab, filled in by your team, holding the place a Lab is *about* rather than where it meets. A Lab on Lebanon then draws as a soft halo over Lebanon, the same treatment a regional group gets, rather than a marker somebody might mistake for a meeting they could attend.

Leaving it empty is always a valid answer. An empty cell means the Lab keeps its place in the panel, exactly as today. So this can be filled in a few rows at a time, or not at all.

## What this document is not

**These are not decisions I have taken.** I have read all 75 titles and opening paragraphs and sorted them, so that you are correcting a draft rather than facing a blank column. Where a Lab is genuinely arguable I have said so rather than picking quietly.

You know these Labs and their facilitators. I know what the text says. Where those two disagree, you are right.

## Proposed, and I think uncontroversial

Fifteen Labs name a country in the title or in the first line of their own description.

| id | Lab | Proposed | Why |
|---|---|---|---|
| `il-trennung-von-spiritualitat-korper-in-deutschland-heilen` | Trennung von Spiritualität & Körper in Deutschland heilen | `DE` | Germany named in the title, German history is the explicit subject |
| `il-was-bedeutet-es-deutsch-zu-sein` | Was bedeutet es, Deutsch zu sein | `DE` | German identity is the whole question |
| `il-german-colonial-shadows-perpetrator-lineages` | German Colonial Shadows, Perpetrator Lineages | `DE` | German colonial legacy and perpetrator lineages |
| `il-othering-the-u-s-political-divide` | Othering & the U.S. Political Divide | `US` | Named in the title |
| `il-an-inner-exploration-of-the-south` | An Inner Exploration of 'The South' | `US` | The Southern United States, stated in the first line |
| `il-the-money-lab` | The Money Lab | `US` | "The US economic system has a particular flavor arising from its unique backstory" |
| `il-das-dilemma-der-schweiz-wahrend-dem-zweiten-weltkrieg` | Das Dilemma der Schweiz während dem Zweiten Weltkrieg | `CH` | Switzerland in 1940, unambiguous |
| `il-schweiz-kollektive-trauma-pragungen-rund-ums-geld` | Schweiz: Kollektive Trauma-Prägungen rund ums Geld | `CH` | Switzerland's relationship to money |
| `il-lebanon-a-nexus-of-collective-trauma-integration` | Lebanon: A Nexus of Collective Trauma Integration | `LB` | Named in the title |
| `il-collective-intergenerational-trauma-in-lebanon` | Collective & Intergenerational Trauma in Lebanon | `LB` | Named in the title |
| `il-israel-grief-transgenerational-trauma` | Israel: Grief and Transgenerational Trauma | `IL` | Named in the title |
| `il-argentina-sintiendo-nuestras-raices-a-traves-de-capas-del-trauma-colectivo-escasez-inmigracion` | Argentina: Sintiendo nuestras raíces... | `AR` | Named in the title |
| `il-being-british-colonised-and-colonisers` | Being British: Colonised and Colonisers | `GB` | British identity is the subject |
| `il-collective-trauma-resilience-findhorn-community` | Collective Trauma & Resilience, Findhorn Community | `GB` | Findhorn is a specific community in Scotland |
| `il-the-global-legacy-of-the-great-famine-in-ireland` | The Global Legacy of the Great Famine in Ireland | `IE` | The Irish Famine, 1845 to 1852 |

Note that placing a Lab does not shrink it. "The Global Legacy of the Great Famine" is about a diaspora, and a halo over Ireland says where the wound originates, not where the conversation is confined.

## Names a place, but needs your judgment

Twelve more clearly relate to somewhere. I have not filled these in, because each one involves a decision I am not the right person to make.

| id | Lab | Candidates | The question |
|---|---|---|---|
| `il-deutschland-russland-kollektive-wunden` | Deutschland, Russland: Kollektive Wunden | `DE` / `RU` | Two countries, one field. Which anchors it? |
| `il-the-living-legacy-of-dictatorship` | The Living Legacy of Dictatorship | `RU` / empty | Takes the Soviet legacy as a starting point but reaches into 20th century authoritarianism generally |
| `il-indian-and-residential-boarding-schools` | Indian and Residential Boarding Schools | `US` / `CA` | "Across North America", and the two systems are genuinely both |
| `il-remembering-european-indigeneity-in-north-america-lab` | Remembering European Indigeneity in North America | `US` / `CA` / empty | Spans pre-Christian Europe and North America at once |
| `il-south-asians-decolonizing-a-history-of-subjugation` | South Asians: Decolonizing a History of Subjugation | `IN` / empty | South Asia is a region. India is the largest part of it, not the whole |
| `il-collective-transgenerational-trauma-in-the-balkans-lab-ii` | Collective & Transgenerational Trauma in the Balkans II | empty | The Lab's own text calls the Balkans "a mosaic of nations". No single code is honest |
| `il-witch-hunts` | Witch Hunts | empty | Early Modern Europe, a continent rather than a country |
| `il-habitando-el-cuerpo-latinoamericano` | Habitando el Cuerpo Latinoamericano | empty | Latin America, again a region |
| `il-el-dolor-de-la-emigracion-latinoamericana` | El Dolor de la Emigración Latinoamericana | empty | A region, and a movement between places rather than a place |
| `il-aufarbeitung-der-corona-zeit` | Aufarbeitung der Corona-Zeit | `DE` / empty | Held in German and rooted in the German experience, but the pandemic was everywhere |
| `il-healing-german-jewish-wounds-global` | Healing German & Jewish Wounds, Global | empty | You marked it Global. It also names Germany. I read the Global as deliberate, but that is your word, not mine |
| `il-invisibility-in-the-jewish-non-jewish-field-global` | (In)Visibility in the Jewish, Non-Jewish Field, Global | empty | Same. Marked Global, and about a people rather than a place |

## The remaining 48

They stay empty and stay in the panel. Their subjects are real but not geographic: patriarchy, grief, loneliness, breast cancer, family estrangement, the healthcare system, journalism, education, the loss of a child. Nothing is gained by pinning any of them anywhere, and something is lost.

Six carry "Global" in their own title. I read that as your team already having made this exact distinction, in the other direction, before anyone asked for a column.

## Two things worth deciding out loud

**Regions have no code.** The Balkans, Latin America, South Asia and Early Modern Europe are four Labs whose subject is real, geographic, and larger than any country. `field_country` cannot hold them. If those four matter, the answer is a second column for a region, which is more work for us and more work for you. If they can sit in the panel, nothing more is needed. My instinct is that four Labs is not worth a second column, but you may feel differently about which four they are.

**A place can be the wound rather than the location.** Placing "German Colonial Shadows" over Germany is a statement, not just a coordinate. I think it is the right one and it is what makes this map more than a directory, but it is worth saying plainly rather than letting it arrive as a design detail. If any of the fifteen above would land badly with the people holding that Lab, take it out. The panel is not a demotion.

## What happens next

Nothing is blocked on this. The map ships either way and works either way. Fill in as many or as few as you like, whenever you like, and they appear on the next page load.
