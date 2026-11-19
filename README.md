# Leonida Ledger: GTA VI trophy guide & tracker

[![gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/Ankith-m1006/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/Ankith-m1006/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01)

An offline guide and tracker for all 55 Grand Theft Auto VI trophies on PS5, built for the make.fun bounty gta6-trophy-guide-01.

- **Tracker:** every trophy has its official name, description and grade. Progress and per-trophy counters (for example 0/42 range golds) are saved in localStorage, and you can export them to a `.json` file and import them back. You can filter by story, missable, collectibles, activities, crime and world (the online filter shows that the list has none), search, and filter by grade or status.
- **Spoiler shield:** the 28 trophies PlayStation lists as hidden, and every story trophy, keep their name, description and guide covered until you earn them or reveal them one at a time. Search never matches covered text.
- **Platinum roadmap:** seven stages in the order to play them, from Chapter 1 to 100%. Each stage has its trophies, a progress bar and tips. A missable watchlist is ordered by when each window closes.
- **Cited guides:** each trophy's guide is written in our own words and lists the pages it draws on (PowerPyx, GTABase, KeenGamer, games.gg, OutputLag, PSNProfiles and others). Links open only when you click them. Trophies that no guide covers yet say so plainly.

The app is plain static files under `app/` with no build step and no network requests at run time. It uses system fonts, no game artwork and no logos.

```sh
node serve.ts                                   # http://localhost:8080
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts   # hand-in: copies app/ + screenshots/, writes dossier.json
node tools/shoot.mjs                            # re-render screenshots/ with headless Chrome (shots.json)
```
