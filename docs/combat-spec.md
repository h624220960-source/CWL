# Combat Spec v0.2

Combat model for the remake. This is a documented simplification of Currency Wars, not a reverse-engineered copy of the live game's formulas. All numbers are remake templates.

## 1. Scope

The current playable slice is:

- 4 On-Field characters: **Aglaea**, **Firefly**, **Feixiao** and **Qingque**.
- 3 generic enemies that only attack a single target.
- A playable Combat Sandbox with circular portraits, target selection, stats popovers, an auto-play toggle and 1-4 Ultimate hotkeys.
- No Off-Field units, Bonds, equipment, shop, stars or run layer yet.

The engine is structured so Off-Field units and more content can be added later.

## 2. Battle setup

A battle contains:

- **Player party**: up to 4 On-Field units. Only On-Field units are targetable. The active unit acts on player input; other On-Field units can still use ready Ultimates as free actions.
- **Enemies**: 1 or more units. Generic enemies use a single-target Basic ATK.
- **Turn limit**: an Action Value budget. If the budget runs out before all enemies die, the player loses the battle.

Position rules from the mode research still apply:

- On-Field units are targetable, can attack, and act on player input.
- Off-Field units are untargetable, act automatically, and default to support actions.
- A character in the wrong position loses its CW Empowerment.

Off-Field is out of scope for v0.2 but the engine exposes a `position` field.

## 3. Turn order

Combat uses Action Value (AV):

- A unit's base AV is `10000 / SPD`.
- The unit with the lowest current AV acts next.
- When a unit acts, its AV resets to `10000 / current SPD`.
- Speed buffs affect the next AV reset, not the unit's current AV.
- When several units reach 0 AV together, ties are broken by higher SPD, then player side first, then stable unit order.
- The battle tracks total elapsed AV. The current sandbox limit is **2000 AV**.
- `2000 AV` is about 20 turns for a 100 SPD unit. HSR's first cycle is 150 AV, which is why a 150 AV limit ends after only ~1.5 turns at 100 SPD.

This keeps the turn limit fair when more units and SPD buffs are added.

## 4. Player resources

### Skill Points

- Team starts with 3 SP; maximum is 5.
- Basic ATK: +1 SP.
- Skill: -1 SP. A Skill cannot be used at 0 SP unless the character has temporary SP.
- Qingque starts with 2 temporary SP. Her Skill spends team SP first, then temporary SP.
- Ultimate: no SP change.

### Energy

- Most test characters use 0-100 Energy and start at 50. Aglaea uses 0-350 and starts at 175.
- Basic ATK: +20 Energy.
- Skill: +30 Energy, except Aglaea's summon Skill gives +20.
- Taking damage: +10 Energy.
- Ultimate: requires the character's full Energy and resets the user to 0 Energy.
- Ultimates are **free actions**. They do not consume the active character's turn, do not change Action Value, and can be used at any time while the battle is active, including between enemy turns.
- Pressing 1-4 in the Combat Sandbox uses the corresponding party slot's Ultimate when it is ready. A ready character's circle glows.

## 5. Damage

```
raw       = ATK * multiplier
bonuses   = 1 + sum(DMG% bonuses)
defense   = 1000 / (1000 + target.DEF)
element   = 1.25 if target is weak to the attack element, otherwise 1.0
broken    = 1.10 if the target is currently Broken, otherwise 1.0
base      = raw * bonuses * defense * element * broken

CRIT roll:  if rng < CRIT Rate, multiply by (1 + CRIT DMG)
Lucky roll: if rng < Lucky Strike Rate, multiply by (1 + Lucky Strike DMG)

damage    = floor(base * CRIT multiplier * Lucky multiplier)
```

Rules:

- Player base stats are 5% CRIT Rate, 50% CRIT DMG, 5% Lucky Strike Rate and 50% Lucky Strike DMG.
- Enemies use 5% CRIT Rate / 50% CRIT DMG and cannot Lucky Strike.
- CRIT and Lucky Strike are independent rolls; both can trigger on the same hit.
- Memosprites roll using their owner's CRIT and Lucky Strike stats.
- Healing and shields use the same stat snapshot rules as damage.
- Damage is logged with its components so balance changes are explainable.
- HP cannot go below 0.

## 6. Weakness, Toughness and Break

Enemies have:

- `toughness` and `maxToughness`
- one or more weaknesses

Attacks reduce Toughness by the attack's `toughnessDamage`. When Toughness reaches 0:

1. The enemy becomes **Broken**.
2. It takes Break DMG equal to 10% of its max HP, increased by the attacker's Break Effect.
3. It skips its next turn.
4. After skipping, Toughness resets to maximum and Broken ends.

Broken enemies take 10% more DMG until they recover. Firefly has Break Effect +30% and a simplified Super Break: attacks against an already-Broken enemy deal extra DMG equal to 5% of the enemy's max HP.

## 7. Status effects and keywords

Durations are measured in the affected unit's own turns. A buff applied during that unit's own turn does not tick down at the end of the same turn.

### Golden Thread (Aglaea empowerment)

- Trigger: any ally gains SPD.
- Gain 1 stack, max 5.
- Each stack: +6% ATK and +2 SPD.
- At 5 stacks: Basic ATK and Skill hit one additional enemy.
- Stacks last for the rest of the battle.

### SPD buff

- Adds a flat amount of SPD for a number of turns.
- Multiple SPD buffs stack additively.
- Gaining a SPD buff triggers Golden Thread.

### Burn (Firefly)

- Applied by Supernova Overload to living enemies.
- Deals 60% of Firefly's ATK as Fire DMG at the start of the enemy's turn.
- Lasts 2 enemy turns.
- Burn can defeat an enemy before it acts.

### Prey, Follow-Ups and Flying Rays (Feixiao)

- Formlessness marks one enemy as Prey.
- When any other ally attacks Prey, Feixiao launches a follow-up for 60% ATK Wind DMG and gains 1 Flying Ray.
- Flying Rays cap at 6. In this slice, reaching 6 immediately fills Feixiao's Energy so her Ultimate is ready.
- Every third follow-up upgrades Feixiao's next Basic ATK to hit all enemies for 90% ATK.

### Tiles and Temporary SP (Qingque)

- Qingque starts with 2 temporary SP and gains 1 Tile per Skill use (max 4).
- At 4 Tiles, her next Basic ATK becomes Enhanced: 300% ATK to the target and 100% ATK to an adjacent enemy, then consumes all Tiles.
- Her Ultimate also grants 1 Tile.

### Revive

- Player characters cannot be permanently knocked out.
- At 0 HP, the character revives at 30% max HP.
- Each revive adds 200 AV to the elapsed total, representing the lost turn limit.
- Revives do not reset Energy, buffs or Golden Thread.

## 8. Characters v0.2

### Aglaea

Base stats from `characters.js`: HP 1100, ATK 660, DEF 480, SPD 112. Element: Lightning. Energy: 0-350, starts at 175.

| Slot | Name | v0.2 behavior |
| --- | --- | --- |
| Basic ATK | Thorned Nectar | 50% ATK Lightning to one enemy. +20 Energy, +1 SP. |
| Enhanced Basic ATK | Slash by a Thousandfold Kiss | Only in Supreme Stance. Joint ATK: Aglaea deals 200% ATK and Garmentmaker deals 200% of its ATK to the target, plus 90% / 90% to an adjacent enemy. No SP recovery. |
| Skill | Rise, Exalted Renown | Summons Garmentmaker if absent and advances its action by 100%. If Garmentmaker is present, restores 50% of its max HP. Cannot be used in Supreme Stance. |
| Ultimate | Dance, Destined Weaveress | Requires 350 Energy. Summons Garmentmaker or restores it to full HP, enters Supreme Stance, advances Aglaea's action by 100%, and starts the Supreme Stance countdown. |
| Talent | Rosy-Fingered | Garmentmaker has 35% of Aglaea's SPD and max HP equal to 66% of Aglaea's max HP plus 720. The memosprite acts with Thorned Snare. |
| CW Empowerment | Golden Thread | Whenever any ally gains SPD, gain 1 Golden Thread (max 5). Each stack gives +6% ATK and +2 SPD. At 5 stacks, Basic/Skill hit one additional enemy. |

Supreme Stance:

- Aglaea's Basic ATK becomes Slash by a Thousandfold Kiss.
- Her Skill is locked.
- A countdown unit with 100 SPD enters the action order.
- When the countdown acts, Aglaea leaves Supreme Stance and Garmentmaker self-destructs.
- Using the Ultimate again resets the countdown and restores Garmentmaker.

Garmentmaker:

- A full player-side unit with its own HP, SPD and turn in the action order.
- Enemies can target it. At 0 HP it disappears.
- Uses Thorned Snare: 110% ATK to one enemy and 66% ATK to an adjacent enemy, and restores 10 Energy to Aglaea.
- When Garmentmaker disappears, Aglaea gains 20 Energy.
- In the UI it appears as a small dashed circle with an HP bar next to Aglaea.

Seam Stitch and the memosprite SPD-stack talent are not implemented in v0.2.

Stat calculation order:

1. Base SPD + flat SPD buffs + Golden Thread SPD.
2. Convert `current SPD * conversion%` into flat ATK. Conversion starts at 20% and increases by 2% per SPD buff event.
3. Add base ATK and conversion ATK.
4. Apply ATK% bonuses, including Golden Thread's +6% per stack.

This means SPD buffs increase Aglaea's damage twice: directly through the SPD-to-ATK conversion and indirectly through Golden Thread stacks.

### Firefly

Base stats: HP 1250, ATK 620, DEF 780, SPD 105. Element: Fire.

| Slot | Name | HSR kit |
| --- | --- | --- |
| Basic ATK | Order: Flare Propulsion | 50% ATK Fire to one enemy. +20 Energy, +1 SP. |
| Enhanced Basic | Fyrefly Type-IV: Pyrogenic Decimation | Restores 20% max HP; 100% ATK Fire to one enemy. No SP recovery. |
| Skill | Order: Aerial Bombardment | Consumes 40% max HP, restores 60% max Energy, deals 200% ATK Fire to one enemy, advances next action by 25%. |
| Enhanced Skill | Fyrefly Type-IV: Deathstar Overload | Restores 25% max HP, implants Fire Weakness for 2 turns, deals (0.2 × Break Effect + 200% ATK) to the target and (0.1 × Break Effect + 100% ATK) to adjacent enemies. |
| Ultimate | Fyrefly Type-IV: Complete Combustion | Costs 240 Energy. Enters Complete Combustion, advances action by 100%, grants Enhanced Basic/Skill, +60 SPD, 50% Weakness Break Efficiency and 20% Break DMG, and starts a 70 SPD countdown. Cannot use Ultimate during the state. |
| Talent | Chrysalid Pyronexus | Damage reduction up to 40% based on missing HP; during Complete Combustion it is always maxed and Effect RES +30%. At battle start, Energy below 50% is set to 50%. At max Energy, dispels debuffs. |
| CW Empowerment | Supernova Overload | After Break allies trigger 3 Weakness Breaks, Firefly immediately uses a Supernova Overload-style move outside her turn. |
| Engine status | — | Simplified: Complete Combustion, enhanced actions, Fire Weakness, Break Efficiency and Super Break are not fully implemented yet. |

### Feixiao

Base stats: HP 1000, ATK 650, DEF 380, SPD 110. Element: Wind.

| Slot | Name | HSR kit |
| --- | --- | --- |
| Basic ATK | Boltsunder | 100% ATK Wind to one enemy. |
| Skill | Waraxe | 200% ATK Wind to one enemy, then immediately launches 1 Thunderhunt follow-up. |
| Ultimate | Terrasplit | 6 hits of Boltsunder Blitz / Waraxe Skyward plus a final strike, up to 700% ATK. Ignores Weakness Type for Toughness reduction and gains 100% Break Efficiency while the target is not Broken. Requires 6 Flying Aureus (max 12). |
| Talent | Thunderhunt | Gains 1 Flying Aureus per 2 ally attacks. After an ally attacks, launches a 110% ATK follow-up once per turn and gains 60% DMG for 2 turns. |
| Technique | Stormborn | Onrush; gains 1 Flying Aureus and deals 200% ATK Wind to all enemies at the start of each wave, scaling with additional pulled enemies. |
| CW Empowerment | Undocumented | No unique Currency Wars empowerment is documented for Feixiao in the 4.6 snapshot. |
| Engine status | — | Simplified: the sandbox still uses Energy and a Prey/follow-up approximation instead of Flying Aureus and Terrasplit. |

### Qingque

Base stats: HP 1020, ATK 640, DEF 390, SPD 104. Element: Quantum.

| Slot | Name | HSR kit |
| --- | --- | --- |
| Basic ATK | Flower Pick | 50% ATK Quantum to one enemy; discards 1 tile from the least-held suit. |
| Enhanced Basic | Cherry on Top! | Blast Quantum DMG; cannot recover Skill Points. |
| Skill | A Scoop of Moon | Draws 2 jade tiles and increases DMG until the end of the turn, stacking up to 4 times. The turn does not end. |
| Ultimate | A Quartet? Woo-hoo! | Costs 140 Energy. AoE Quantum DMG; obtains 4 jade tiles of the same suit. |
| Talent | Celestial Jade | Draws 1 tile from 3 suits at ally turn start, max 4. Starting a turn with 4 matching tiles enters Hidden Hand: ATK increases and Flower Pick becomes Cherry on Top!. |
| Technique | Game Solitaire | Draws jade tiles when battle starts. |
| CW Empowerment | Hidden Hand | Gains temporary Skill Points and can keep using Skill past Hidden Hand. |
| Engine status | — | Simplified: the sandbox uses a single tile counter instead of suits, draw-2, non-ending turns and Hidden Hand's ATK boost. |

## 9. Generic enemies

Generic enemies use the same stat and damage model as player units.

### Debt Collector

- HP 2400, ATK 200, DEF 250, SPD 95.
- Toughness 40, weakness Lightning.
- Basic ATK **Foreclosure**: 100% ATK Physical DMG to one random living On-Field player unit.
- Enemies do not use SP or Energy in v0.2.
- Enemies do not have Ultimates or follow-up attacks in v0.2.

The sandbox encounter uses 3 Debt Collectors with **infinite HP** so turn order, resources, memosprites and Ultimates can be tested without ending the fight early. Infinite HP is opt-in via the `infiniteEnemyHp` battle option; normal tests still use the 2400 HP template.

Enemy AI:

1. If Broken, skip the turn and recover.
2. Otherwise attack a random living On-Field player unit.
3. If no On-Field unit is alive, attack a random living unit (future-proofing for all-off-field teams; not reachable in v0.2).

## 10. Win and loss

- **Victory**: all enemies are dead.
- **Defeat**: elapsed AV reaches the turn limit while enemies remain alive. Elapsed AV is capped at the limit.
- The current sandbox has infinite-HP enemies, so it always ends in defeat at exactly 2000 AV.
- A single character reviving repeatedly cannot stall forever because each revive costs 200 AV.

## 11. Out of scope for v0.2

- Off-Field automation
- Bonds and Emblems
- Equipment
- Star levels and merging
- Shop, Gold and EXP
- Multiple Planes and nodes
- Effect Hit Rate and Effect RES
- Shields, cleanses and non-Burn DoTs
- The exact live-game Ultimate timing rules
- Firefly's automatic Ultimate after 3 Weakness Breaks
- Feixiao's automatic Ultimate at 6 Flying Rays (the remake fills Energy instead)
- Aglaea's Seam Stitch and Garmentmaker SPD-stack talent

## 12. Combat Sandbox UI

- Enemies are circles above the party; players are circles below.
- Circles use character initials and element colour.
- HP bars sit above each circle. Energy bars (players) or Toughness bars (enemies) sit below.
- The active player has a white ring. A player with a ready Ultimate pulses in its element colour.
- A left-side Turn Order panel shows the Action Value budget and the next 10 forecast turns, including each unit's AV from now.
- Sandbox enemies have infinite HP, shown as `∞ / ∞`, and the run ends at 2000 AV (~20 turns at 100 SPD).
- Remembrance memosprites appear as a small dashed circle with an HP bar next to their owner.
- Damaged units flash with a red ring and a red HP bar, including infinite-HP enemies.
- Floating damage numbers show every hit. CRITs are larger and yellow, Lucky Strikes are purple, and CRIT + Lucky is orange. DoT, Break and Super Break use their own colours.
- Clicking an enemy selects it as the target. Basic ATK and Skill require a selected target.
- Clicking a player opens a stats popover with current HP/ATK/DEF/SPD, Energy, CRIT/Lucky stats, character resources, buffs and the full kit.
- Pressing 1-4 uses the corresponding party slot's Ultimate if ready. Ultimates are free actions, so they can be used during enemy turns.
- Using an Ultimate triggers a cinematic: the stage darkens around the caster, the caster glows, a spotlight and name/Ultimate caption appear, and turn timers pause for the effect.
- Auto-play uses ready Ultimates, then selects Basic/Skill, and animates enemy turns one at a time.

## 13. Open questions

1. Should the final game add Effect Hit Rate and Effect RES, and how should Lucky Strike scale with equipment?
2. Should turn limits be measured in AV or in rounds per Plane?
3. How should Off-Field units generate actions without becoming weaker than On-Field units?
4. What is the official behavior when every deployed unit is Off-Field?
5. How much of the live game's hidden damage formula should be approximated?
6. Do we want automatic Ultimate triggers for Firefly and Feixiao, or should the player always spend the ready Ultimate manually?
