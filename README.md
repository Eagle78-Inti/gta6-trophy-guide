# Leonida Trophy Tracker — GTA VI (PS5)

[![make.fun](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![Rank](https://make.fun/badge/gta6-trophy-guide-01/Eagle78-Inti/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![Reward](https://make.fun/badge/gta6-trophy-guide-01/Eagle78-Inti/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01)

An offline guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI. Open `app/index.html` in a desktop browser — it works with the network off.

## What it does

- **Every trophy, exactly as PlayStation lists it** — all 55 official names, descriptions and grades (1 platinum, 2 gold, 6 silver, 46 bronze; 28 hidden; 0 online), from the list Exophase and PSNProfiles published on 18 November 2026.
- **A cited guide for each trophy** — what to do, where and how, and when it can be missed, written in our own words. Every guide names its sources beside it (PowerPyx, Push Square, GTA Vibes, OutputLag, KeenGamer, CryptoGames and others). Where a method was not yet pinned down at launch, the guide says so instead of guessing.
- **A tracker** — tick trophies off as you earn them; progress saves in the browser (localStorage), and you can export it to a JSON file and import it back.
- **Filters** — by kind (story, missable, collectibles, activities, online), by earned/unearned, and by text search.
- **Spoiler setting** — hides the names and descriptions of story trophies until they are earned.
- **Roadmap to the platinum** — six stages in order, from the story (Chapters 1–5, about 60–80 hours) through collectibles, activities, robberies and the 100% clean-up, with the counts each stage needs.
- **Missable flags** — the one potentially missable trophy (Positive Mental Attitude: the Chapter 1 balcony meditation) is called out up front, with the chapter it disappears in. Everything else can be finished in free roam after the story.

## Run it

```sh
node serve.ts        # serves app/ at http://localhost:8080
```

Or serve `app/` with any static file server. No build step, no libraries, no network requests at run time — the only fetch is the local `data/trophies.json`.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` (Node 22, stdlib only) copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with `buildDossier` from `vendor/makefun-frontend.ts`. Two runs write identical bytes.

## License

MIT — see `LICENSE`. This is an unofficial fan guide; it uses no Rockstar logo or official artwork.
