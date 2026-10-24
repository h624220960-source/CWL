# CurrencyWarsLegacy

A browser-based website. Plain HTML, CSS, and JavaScript — no build step, works in any modern browser.

## Status

The prototype combat sandbox has been retired and is being rebuilt. The current build ships a Character Lab for browsing implemented kits, elements and On/Off-Field statuses.

Combat v0.2 is playable in the **Combat Sandbox**: Aglaea, Firefly, Feixiao and Qingque vs three **infinite-HP** Debt Collectors in a **2000 AV** test run (about 20 turns at 100 SPD). Characters are circular element-coloured portraits with HP bars above and Energy/Toughness bars below. A left-side Turn Order panel forecasts the next 10 actions, damaged units flash red, floating numbers show CRIT and Lucky Strike damage, clicking an enemy targets it, clicking an ally opens stats, and 1-4 use ready Ultimates at any time. Ultimates trigger a spotlight cinematic that pauses the turn timers. Aglaea's Remembrance memosprite, Garmentmaker, is a full unit with its own HP, turn and a small HP-bar circle next to her. The four combat characters' archive kits now use their real HSR names/effects; full combat parity for Firefly, Feixiao and Qingque is still in progress. The rules are in `docs/combat-spec.md`.

## Files

- `index.html` — markup
- `style.css` — styles
- `script.js` — username, mode selection and Itinerary
- `characters.js` — character kit data
- `combat.js` — headless combat engine and generic enemies
- `battleScreen.js` — Combat Sandbox rendering and controls
- `characterLab.js` — Character Lab rendering
- `docs/character-research.md` — kit, element and positioning research
- `docs/combat-spec.md` — combat rules for the rebuild
- `tools/simulate.js` — prints a sample battle log
- `tools/combat-test.js` — engine smoke tests
- `CHANGELOG.md` — change log

## Run locally

Just open `index.html` in a browser, or serve it:

```sh
python -m http.server 8000
```

Then visit http://localhost:8000

## Combat tools

```sh
node tools/combat-test.js
node tools/simulate.js
```
