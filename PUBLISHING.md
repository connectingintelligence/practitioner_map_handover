# Putting this on GitHub

For Max &middot; 27 August 2026

Worth doing, and for a better reason than convenience: **GitHub Pages is the same kind of hosting as the Pocket Project's server.** Static files over HTTPS with relative paths. If the map works there, it works on Noah's server, and you find that out before he touches anything.

It also ends the cache confusion. Instead of sending a zip and hoping everyone is looking at the same version, there is one address that is always current, and a commit history showing what changed.

## Public or private

The code contains nothing secret. No keys, no tokens, no passwords.

The bundled group data is names, cities, facilitators and links, all of which are already public on pocketproject.org. Facilitator street addresses are **not** in it; they are stripped in the pipeline and `.gitignore` blocks the file that holds them, so it cannot be committed by accident.

The Sheet address in `app/js/practitioner-config.js` points at a published, read-only, single tab. Publishing it changes nothing: it is already reachable by anyone with the link, which is what makes the map work in a visitor's browser at all.

**So public is fine.** One thing to weigh, which is not technical: a Pocket Project map living at `yourname.github.io` could be mistaken for their official one. Two ways to handle that, and both are reasonable:

- Keep it public, and treat the Pages address as a staging link you share deliberately rather than advertise. The repository can be transferred to a Pocket Project account later, and the history comes with it.
- Make the repository private and skip Pages. You keep the version history and Noah can still clone it, but you lose the live preview, which is most of the point.

## Setting it up

From this folder:

```
git init
git add .
git commit -m "Practitioner Network Map, build 2026-08-27b"
git branch -M main
git remote add origin https://github.com/YOURNAME/pocket-project-practitioner-map.git
git push -u origin main
```

Then on GitHub: **Settings, Pages, Source: deploy from a branch, Branch: main, folder: / (root)**. Give it a minute.

Your map is then at:

```
https://YOURNAME.github.io/pocket-project-practitioner-map/
```

The redirect at the root sends visitors to `app/practitioner.html`, so the address stays short. That file exists only for Pages; on the Pocket Project's server the `app/` folder is uploaded on its own and the redirect is not needed.

## What this gets you

**A link instead of a zip.** Noah and Kosha open one address and always see the current build. No downloading, no unzipping, no wondering whether they have the latest.

**Proof it deploys.** Pages has the same constraints as their server: served over HTTPS, relative paths, no build step, no server-side code. If it runs on Pages it runs for Noah. That is a real test rather than an assurance.

**The separation made visible.** Code in the repository, data in the Sheet. Edit the Sheet and the Pages site updates on the next page load with no commit at all. That is the clearest possible demonstration of how the two halves fit together, and it is the thing most likely to reassure Noah that he is not signing up to maintain a moving target.

**A history.** Every change dated with a reason. When someone asks in November why Africa is shaded and Germany is not, the answer is in the log.

## Updating it

Rebuild the folder and push:

```
cd ../practitioner_map
python3 build_handover.py
cd ../practitioner_map_handover
git add -A
git commit -m "what changed"
git push
```

The Pages site updates in about a minute. `build_handover.py` refuses to produce a folder that fails its checks, so a broken build does not reach the repository in the first place.

## One thing to remember

The build stamp is in three files: `app/practitioner.html`, `app/js/practitioner-app.js` and `app/data/practitioner_groups.json`. They must agree, and the check enforces it. When you make a change worth noticing, bump all three. That stamp is what tells anyone looking at the map whether their browser is showing them the truth.
