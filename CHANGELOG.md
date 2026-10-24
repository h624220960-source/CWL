# Changelog

All notable changes to CurrencyWarsLegacy are recorded here. Dates use ISO format.

## 2026-10-19

### Added

- Combat Sandbox screen, reachable from the mode select.
- Enemies display above the party; Aglaea displays below.
- Manual Basic/Skill/Ultimate controls with click-to-target selection.
- Auto-play toggle that resolves turns with the existing engine policy.
- HP, Energy, Toughness, Skill Point and Action Value bars, Golden Thread pips, battle log and victory/defeat result.
- Restart and Back controls for the sandbox.

### Changed

- Combat Sandbox rebuilt with circular character and enemy portraits using initials and element colours.
- HP bars now sit above circles; Energy (players) and Toughness (enemies) bars sit below.
- Added a left-side Turn Order panel with the Action Value budget and a 10-turn forecast.
- Added red ring/shake/HP-bar flash effects when a unit takes damage.
- Corrected Aglaea's kit: Rise, Exalted Renown summons/heals Garmentmaker; Dance, Destined Weaveress enters Supreme Stance, enhances Basic ATK, locks Skill and starts a countdown.
- Garmentmaker is now a full memosprite unit with HP, SPD, its own turn, Thorned Snare, enemy targetability and a small HP-bar circle next to Aglaea.
- Sandbox enemies now use infinite HP for testing; the run ends at exactly 2000 AV (about 20 turns at 100 SPD).
- Damage flashes now track a per-unit damage counter, so infinite-HP enemies still flash when hit.
- Corrected the archive kit text for Aglaea, Firefly, Feixiao and Qingque to their real HSR ability names/effects and documented Currency Wars empowerments.
- Added CRIT Rate / CRIT DMG and Lucky Strike Rate / Lucky Strike DMG rolls to damage.
- Added floating damage numbers with CRIT, Lucky Strike, DoT, Break and Super Break styling.
- Added an Ultimate cinematic that darkens the stage around the caster, highlights them, shows a name/Ultimate caption, and pauses turn timers for the effect.

### Notes

- Aglaea's core Supreme Stance is implemented. Seam Stitch and Garmentmaker's SPD-stack talent are still pending.
- Firefly, Feixiao and Qingque still use simplified combat behavior in the sandbox; their engine mechanics need a full HSR parity pass.
- Party expanded to four On-Field characters: Aglaea, Firefly, Feixiao and Qingque.
- Sandbox encounter expanded to three Debt Collectors and a 2500 AV limit.
- Ready Ultimates glow, and 1-4 use the corresponding party slot's Ultimate as a free action, including during enemy turns.
- Clicking a player circle opens a stats popover with current stats, resources, buffs and kit text.
- Enemy turns animate one at a time; auto-play can be toggled at any time.

### Notes

- Firefly's automatic Ultimate after 3 Breaks and Feixiao's automatic Ultimate at 6 Flying Rays are simplified or not yet implemented; see `docs/combat-spec.md`.
- Off-Field, Bonds, equipment, stars and run structure remain out of scope.

## 2026-10-18

### Added

- `docs/combat-spec.md` with the v0.1 combat model: Action Value turn order, Skill Points, Energy, damage, Break, revive, and turn-limit rules.
- `combat.js`, a headless combat engine with generic Debt Collector enemies that use single-target attacks.
- Aglaea combat data (Basic / Skill / Ultimate / Talent / Golden Thread) for the first On-Field slice.
- `tools/simulate.js` for a printable sample battle log.
- `tools/combat-test.js` for engine smoke tests.

### Notes

- The engine is not wired to a battle screen yet.
- Off-Field automation, Bonds, equipment, stars, shop and run structure are out of scope for this slice.
- Default sandbox encounter: Aglaea vs 2 Debt Collectors, 1500 AV limit.

## 2026-10-17

### Removed

- Deleted the prototype combat system: `battle.js`, the deployment screen, the battle screen, and the battle/setup styles.
- Removed battle-mode wiring from `script.js`; Standard Gambit and Overclock Gambit are marked locked until the new combat layer exists.

### Added

- Character Lab screen with search, position, element and cost filters.
- Character detail overlay with element, cost, path, bonds, stats and separate On-Field / Off-Field kit tabs.
- `characters.js` as the single source of truth for implemented character kits.
- `characterLab.js` for rendering and wiring the lab.
- `docs/character-research.md` covering elements, positioning, kit anatomy, cost/star rules, schema and build order.
- This changelog.

### Characters

Implemented one by one, in this order:

1. Herta - 1-cost, Ice, Off-Field; follow-up engine and team damage ramp.
2. Firefly - 5-cost, Fire, On-Field; Break capstone and Supernova Overload.
3. Aglaea - 1-cost, Lightning, On-Field; SPD-to-ATK Energy carry.
4. Huohuo - 1-cost, Wind, Off-Field; heal, cleanse and Energy support.
5. Tribbie - 2-cost, Quantum, Both; first dual-position kit with distinct On/Off-Field empowerments.

The 1-cost roster is now complete:

- Jiaoqiu - Fire, Off-Field; Burn/Ashen Roast applier and debuff spreader (Wolf Hunt, Debuff, DoT).
- Feixiao - Wind, On-Field; Flying Ray follow-up tempo carry (Wolf Hunt, Follow-Up ATK).
- Jade - Quantum, Off-Field; Debt Collector enabler for Herta (IPC, AoE ATK).
- Rappa - Imaginary, On-Field; Seal-mark Break carry (Galaxy Ranger, Break).
- The Dahlia - Imaginary, Off-Field; Guest of Honor Break enabler (Planet of Festivities, Break).
- Mydei - Imaginary, On-Field; HP-consuming Bloodflame bruiser (Night Demigod, Bloodflame).
- Cipher - Quantum, On-Field; Bounty-mark follow-up/debuff hybrid (Night Demigod, Follow-Up ATK, Debuff).
- Yao Guang - Lightning, Off-Field; Punchline/Aha Instant Elation core (Xianzhou, Elation).
- Rin Tohsaka - Fire, On-Field; Gem Energy into CRIT DMG and a Joint Follow-Up with Archer (Holy Grail of Destiny, Skill Points).
- The Hunt March 7th - Imaginary, On-Field; Shifu follow-up and shield support (Express Cohort, Shield).
- Asta - Fire, Off-Field; team ATK/SPD buffer and Spark Burn follow-up (Cosmic Scholar, DoT).
- Sampo - Wind, Off-Field; Wind Shear spreader and Gold Coin economy (Galactic Voyager, DoT).
- Qingque - Quantum, On-Field; temporary-SP Hidden Hand spam (Xianzhou, Skill Points).
- Tingyun - Lightning, Off-Field; Windflame Energy battery (Xianzhou, Energy).
- Blade - Wind, On-Field; HP-consuming Charge bruiser (Stellaron Hunters, Bloodflame).
- Moze - Lightning, On-Field; Prey follow-up executioner (Wolf Hunt, Follow-Up ATK).
- Gallagher - Fire, Off-Field; Break/Heal sustain and Planet of Festivities enabler (Break, Planet of Festivities, Heal).

### Notes

- Ability numbers are remake templates, not official live values.
- Position rules and documented empowerments follow the 4.6 research snapshot in `INIT.txt`.
- Element assignments for late-4.x units are remake placeholders pending live Data Bank verification.
- Next characters queued in the research doc: Kafka, Aventurine, Sparkle, Ruan Mei, Pela.
