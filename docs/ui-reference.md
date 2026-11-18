# UI Reference: Currency Wars (Prydwen capture)

Reference source: Prydwen's Currency Wars guide. Screenshots are hosted by Prydwen and are used only as layout references; no art assets are copied into the remake.

- Guide: https://www.prydwen.gg/star-rail/guides/currency-wars
- Preparation board: https://cdn.prydwen.gg/images/honkai-star-rail/generic/curr_2.webp
- Shop + Bonds: https://cdn.prydwen.gg/images/honkai-star-rail/generic/curr_10.webp
- Investment Environment: https://cdn.prydwen.gg/images/honkai-star-rail/generic/curr_17.webp
- Combat: https://cdn.prydwen.gg/images/honkai-star-rail/generic/curr_21.webp

These captures show the blue "preparation board" layout used across the 3.7-4.x seasons. Version-specific numbers still come from `data/cw-4.6.js`.

## Screen anatomy

### Preparation board

- Top bar: back, player avatar + level, `Preparation Phase P-N`, node track, Squad HP, utility buttons.
- Left rail: Environment chip, Bond list with counts and thresholds, Strategies.
- Shop: five tall character cards, cost-odds pills (1-5), search, lock, hide, refresh cost.
- Board: On-Field Area (4 slots) above a glowing divider, Off-Field Area (6 slots) below.
- Bottom: Purchase Experience card, waiting area, Gold, Store, Battle.
- Character cards show portrait, name, Bonds, cost, stars and Trial status.

### Investment Environment

- Full-screen dark starfield.
- Header line: `Icon Details | Investment Environment | Strategy`.
- Three large vertical cards with a circular icon, name, category and effect.
- Gold `i` info button on each card.
- `Confirm` button below.

### Combat

- Top bar: phase/wave, AV progress with a threshold marker, Squad HP, Gold, AUTO.
- Left rail: Action Value + vertical turn order.
- Center: enemies above, player party below with HP/Energy bars, slot numbers and Trial tags.
- Right rail: Bond DMG list with portrait/icon, name, damage and a bar.
- Bottom-right: action cluster (Basic / Skill / Ultimate), Skill Points, target hint.

## Remake mapping

- Preparation board: `runScreen.js`, `#screen-run`.
- Environment/Strategy/Supply/Encounter choices: `#runOverlay` with `.cw-setup-mode`.
- Combat: `battleScreen.js`, `#screen-battle`, `.run-battle`.
- Bond damage: `combat.js` records `bondDamage` and exposes it in `getState()`.
- Shop odds, lock and config metadata: `run.js` `getState()`.

## Deliberate differences

- No official character art. Portraits are element-coloured initials.
- Equipment uses compact chips/selects instead of drag-to-equip.
- Battle actions are rectangular buttons instead of HSR's circular command wheel.
- The run map is a linear node track, not the full branching map.
