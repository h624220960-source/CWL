# Character Research: Kits, Elements and Positioning

Snapshot source: `INIT.txt`, captured 2026-10-15 from the HSR 4.6 "Currency Wars: Zero-Sum Game" season. Re-check live numbers against the in-game Data Bank before shipping balance changes.

## 1. Element model

Currency Wars keeps the seven base HSR elements. In the remake, element is used for weakness matching, break pressure and visual identity.

| Element | Colour | Role in the prototype |
| --- | --- | --- |
| Physical | `#c9c9c9` | Neutral break damage |
| Fire | `#ff6b4a` | Burn / Break synergy |
| Ice | `#7fd4ff` | Follow-up and control shells |
| Lightning | `#b98cff` | Energy and SPD carries |
| Wind | `#5fd3a0` | DoT and sustain |
| Quantum | `#6a7cff` | Resonance / debuff shells |
| Imaginary | `#ffd75e` | Debuff and delay shells |

Element assignments for post-4.4 units are partially uncertain in `INIT.txt`; each implemented character records its element in `characters.js`.

## 2. On-Field / Off-Field status

`INIT.txt` section 3.3 defines three deployment roles:

- **On-Field**: front row. Targetable, can attack, and is played directly or by auto-play.
- **Off-Field**: back row. Untargetable, acts automatically, generally cannot attack, and uses support abilities unless its kit says otherwise.
- **On / Off-Field**: can be deployed in either area without a penalty.

Placing a character in the wrong area removes their unique Currency Wars abilities. The remake therefore treats position as a kit constraint, not merely a formation preference.

## 3. Kit anatomy

Each character uses the same four ability slots plus a Currency Wars-only empowerment:

1. **Basic ATK** - low-cost action, usually single-target.
2. **Skill** - the character's main active effect.
3. **Ultimate** - high-impact, often AoE or team-wide.
4. **Talent** - passive engine.
5. **Empowerment** - mode-exclusive passive/active added on top of the base kit. This is the part that must be removed when the character is deployed in the wrong area.

For On/Off-Field characters, both positions need separate text because the empowerment can change how the kit is controlled. Tribbie is the current test case: On-Field allows a manual Ultimate; Off-Field auto-casts it at combat start and follows up periodically.

## 4. Cost, stars and stats

- Costs run 1-5, colour-coded grey/green/blue/purple/gold.
- Higher cost means a stronger base kit but lower development ceiling; lower cost scales harder when starred up.
- Characters are recruited at 1-star; three identical copies merge into the next star (3x 1-star -> 2-star, 3x 2-star -> 3-star).
- The lab shows a 1-star remake template (`HP / ATK / DEF / SPD`). These are illustrative placeholders, not official stat curves.

Star scaling and exact per-level stats remain an open question in `INIT.txt` section 10.

## 5. Implementation schema

`characters.js` stores:

```js
{
  id, name, cost, element, path, position, bonds, stats, note,
  slots: {
    on:  { empowerment, abilities: [{ slot, name, text }] },
    off: { empowerment, abilities: [{ slot, name, text }] }
  },
  combat: {
    maxEnergy, startEnergy,
    basic, skill, ultimate, talent, empowerment
  }
}
```

The optional `combat` block supplies engine numbers for implemented battle slices. It is currently present on Aglaea, Firefly, Feixiao and Qingque; the Character Lab ignores it.

Rules used by the lab:

- `position` is `on`, `off` or `both`.
- Only positions present in `slots` can be inspected.
- `both` exposes both kits through tabs.
- Position filters treat `both` as valid for both On-Field and Off-Field searches.
- Values in ability text are remake values. Documented empowerment behaviour follows `INIT.txt` sections 3.4 and 3.8.

## 6. Build order and status

The full 1-cost roster from `INIT.txt` section 3.6 is implemented. Full Basic / Skill / Ultimate / Talent text and the CW empowerment live in `characters.js`; the table below records the identity and CW hook that drive each kit.

### 1-cost roster (complete)

| Character | Element | Position | Bonds | CW empowerment hook |
| --- | --- | --- | --- | --- |
| Herta | Ice | Off-Field | AoE ATK, Cosmic Scholar | Follow-up when any enemy drops below 50% HP; each follow-up ramps all allies' DMG for the run. |
| Aglaea | Lightning | On-Field | Day Demigod, Energy | Gains Golden Thread from ally SPD buffs; stacks convert SPD into ATK and widen her attacks. |
| Huohuo | Wind | Off-Field | Xianzhou, Energy, Heal | Off-field heals also restore Energy and grant ATK. |
| Jiaoqiu | Fire | Off-Field | Wolf Hunt, Debuff, DoT | Burn counts as Ashen Roast; debuff-stacked enemies take more DMG and spread debuffs. |
| Feixiao | Wind | On-Field | Wolf Hunt, Follow-Up ATK | Flying Rays build from ally attacks; at 6 she fires her Ultimate outside her turn. |
| Jade | Quantum | Off-Field | IPC, AoE ATK | Debt Collector marks an ally; their attacks trigger Jade's AoE follow-up. |
| Rappa | Imaginary | On-Field | Galaxy Ranger, Break | Seal marks; breaking a Sealed enemy grants an extra turn and an Enhanced Skill. |
| The Dahlia | Imaginary | Off-Field | The Planet of Festivities, Break | Guest of Honor mark amplifies Break DMG and moves on each Weakness Break. |
| Mydei | Imaginary | On-Field | Night Demigod, Bloodflame | Consumed HP fills a Blood Pool; at 50% he enters Vendetta and empowers his Skill. |
| Cipher | Quantum | On-Field | Night Demigod, Follow-Up ATK, Debuff | Bounty mark triggers her follow-up and Exposed whenever allies attack the marked enemy. |
| Yao Guang | Lightning | Off-Field | Xianzhou, Elation | Banks Punchline from ally actions and cashes out with Aha Instant plus Skill Point restore. |
| Rin Tohsaka | Fire | On-Field | Holy Grail of Destiny, Skill Points | Ally Skill Point spending builds Gem Energy for CRIT DMG buffs and a Joint Follow-Up with Archer. |
| The Hunt March 7th | Imaginary | On-Field | Express Cohort, Shield | Shifu mark triggers her follow-up and grants the Shifu a shield. |
| Asta | Fire | Off-Field | Cosmic Scholar, DoT | Team ATK/SPD opener; ally actions build Sparks into an AoE Burn follow-up. |
| Sampo | Wind | Off-Field | Galactic Voyager, DoT | Wind Shear spreads on death and generates Gold Coins. |
| Qingque | Quantum | On-Field | Xianzhou, Skill Points | Temporary SP lets her spend past Hidden Hand; Tiles empower her Basic ATK. |
| Tingyun | Lightning | Off-Field | Xianzhou, Energy | Windflame battery grants ATK and Energy, refunding Energy when the buffed ally Ults. |
| Blade | Wind | On-Field | Stellaron Hunters, Bloodflame | HP consumption builds Charge into an Enhanced AoE attack. |
| Moze | Lightning | On-Field | Wolf Hunt, Follow-Up ATK | Prey mark triggers follow-ups; after 3, he Ults outside his turn. |
| Gallagher | Fire | Off-Field | Break, The Planet of Festivities, Heal | Heals apply Besotted; healing while an enemy is Broken becomes team-wide and restores Energy. |

Element assignments for late-4.x units (The Dahlia, Yao Guang, Cipher, Mydei, Rin Tohsaka) are remake placeholders and should be verified against the live Data Bank.

### Other implemented costs

| Character | Cost | Element | Position | Bonds |
| --- | --- | --- | --- | --- |
| Firefly | 5 | Fire | On-Field | Break, Stellaron Hunters |
| Tribbie | 2 | Quantum | Both | Day Demigod, AoE ATK, Quantum Resonance |

### Next candidates

Continue by cost tier, starting with 2-costs to fill the systems the 1-cost roster cannot anchor:

- **Kafka** - DoT engine.
- **Aventurine** - Follow-Up ATK and Shield.
- **Sparkle** - Skill Points and Quantum Resonance.
- **Ruan Mei** - Break enabler.
- **Pela** - Debuff and Belobog bridge.

## 7. Open questions

1. Exact 4.6 roster, cost tiers and element assignments.
2. Full Bond thresholds per level, especially for 8-10 member tiers.
3. Official star-level stat curves.
4. Exact empowerment wording for units without a documented entry.
5. Whether position-locked characters can still be deployed in the wrong area in the remake, and what penalty is shown.

## Sources

- `INIT.txt` sections 3.3 (positioning), 3.4/3.8 (empowerment examples), 4 (Bonds), 10 (gaps).
- HSR element set and standard ability-slot conventions.
- Original battle prototype element map, retained as the starting point for element assignments.
