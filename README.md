# CurrencyWarsLegacy

A browser remake of Honkai: Star Rail's **Currency Wars: Zero-Sum Game** (4.6 season snapshot). Plain HTML, CSS, and JavaScript — no build step, works in any modern browser.

## Status

**Standard Gambit is playable as a vertical slice.** Choose an Investment Environment, then clear three planes (Reward, Battle, Supply, Encounter, Boss). The run includes:

- 4 On-Field / 6 Off-Field deployment with position-locked kits.
- Gold, interest, win streaks, EXP/level, team size and shop odds.
- A 5-slot shop with rerolls, buy/sell, bench, and 3-copy merging through 3-star.
- Basic equipment drops, equip/unequip, and combat stat effects.
- Bond activation from deployed characters (combat effects wired for Energy, DoT, Break, Follow-Up, Day Demigod, Heal and Shield).
- Investment Strategies and Environments with documented effects.
- Squad HP, per-node battle limits, node rewards, and a C–SSS rating.

The board UI follows Prydwen's Currency Wars captures: preparation board, shop/odds/Bonds rail, Investment Environment cards, and a combat HUD with turn order, Bond DMG and party bars.

The **Combat Sandbox** (infinite-HP test run) and **Character Lab** remain available as dev tools. The Itinerary codex is data-driven from the 4.6 snapshot.

### Exactness

The 4.6 season has rotated out, so the remake uses archived 4.6 sources. Every entry in `data/cw-4.6.js` carries a provenance flag:

- `verified` — captured from the 4.6 game/Data Bank.
- `documented` — stated in the 4.6 research snapshot (`INIT.txt`).
- `placeholder` — remake value, not official. Replace when verified data is available.

Numeric effects that the snapshot does not contain are marked `placeholder`. Characters without an authored kit receive a generic slice profile (clearly not 4.6 parity) so the run stays playable while kits are ported.

## Files

- `index.html` — markup
- `style.css` — styles
- `data/cw-4.6.js` — canonical dataset: Bonds, equipment, enemies, run tables, Strategies, Environments
- `script.js` — username, mode selection and Itinerary codex
- `characters.js` — character kit data (27 implemented)
- `combat.js` — headless combat engine (On/Off-Field, Bonds, equipment, stars, enemies)
- `run.js` — headless run engine (economy, shop, merge, deployment, nodes, rating)
- `battleScreen.js` — combat rendering, sandbox and run battles
- `runScreen.js` — Standard Gambit map, shop, squad, overlays
- `characterLab.js` — Character Lab rendering
- `docs/character-research.md` — kit, element and positioning research
- `docs/combat-spec.md` — combat rules for the rebuild
- `docs/ui-reference.md` — Prydwen UI layout notes and remake mapping
- `tools/validate-data.js` — dataset integrity checks
- `tools/run-test.js` — seeded full-run tests
- `tools/combat-test.js` — engine smoke tests
- `tools/simulate.js` — prints a sample battle log
- `CHANGELOG.md` — change log

## Run locally

Just open `index.html` in a browser, or serve it:

```sh
python -m http.server 8000
```

Then visit http://localhost:8000

## Tools

```sh
node tools/validate-data.js
node tools/run-test.js
node tools/combat-test.js
node tools/simulate.js
```
