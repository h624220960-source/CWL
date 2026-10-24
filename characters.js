(function () {
  "use strict";

  var ELEMENTS = {
    Physical: { color: "#c9c9c9", icon: "\u2694" },
    Fire: { color: "#ff6b4a", icon: "\uD83D\uDD25" },
    Ice: { color: "#7fd4ff", icon: "\u2744" },
    Lightning: { color: "#b98cff", icon: "\u26A1" },
    Wind: { color: "#5fd3a0", icon: "\uD83C\uDF43" },
    Quantum: { color: "#6a7cff", icon: "\u25C8" },
    Imaginary: { color: "#ffd75e", icon: "\u2726" }
  };

  var POSITIONS = {
    on: {
      label: "On-Field",
      short: "ON",
      desc: "Deployed in front. Targetable, can attack, and is controlled directly or by auto-play."
    },
    off: {
      label: "Off-Field",
      short: "OFF",
      desc: "Deployed in back. Untargetable, acts automatically, and supports allies unless its kit says otherwise."
    },
    both: {
      label: "On / Off-Field",
      short: "BOTH",
      desc: "Can be deployed in either area without losing its Currency Wars empowerment."
    }
  };

  var COST_LABEL = { 1: "1-cost", 2: "2-cost", 3: "3-cost", 4: "4-cost", 5: "5-cost" };

  var CHARACTERS = [
    {
      id: "herta",
      name: "Herta",
      cost: 1,
      element: "Ice",
      path: "Erudition",
      position: "off",
      bonds: ["AoE ATK", "Cosmic Scholar"],
      stats: { hp: 950, atk: 580, def: 360, spd: 100 },
      note: "Position-locked. Herta must be Off-Field to keep her Currency Wars empowerment.",
      slots: {
        off: {
          empowerment: "Genius's Plaything: when any enemy drops below 50% HP, Herta launches a follow-up attack dealing 60% ATK Ice DMG to all enemies. Every follow-up raises all allies' DMG by 6% for the rest of the run, stacking without limit.",
          abilities: [
            { slot: "Basic ATK", name: "What Are You Looking At?", text: "Deals 50% ATK Ice DMG to one enemy." },
            { slot: "Skill", name: "One-Time Offer", text: "Deals 90% ATK Ice DMG to all enemies. If any enemy is below 50% HP, trigger one follow-up." },
            { slot: "Ultimate", name: "Eureka!", text: "Deals 160% ATK Ice DMG to all enemies. All allies gain +12% DMG for 2 turns." },
            { slot: "Talent", name: "It's Not a Bug", text: "Herta's follow-up DMG is increased by 10% per active Cosmic Scholar or AoE ATK bond level. At 3-star, follow-ups trigger twice." }
          ]
        }
      }
    },
    {
      id: "firefly",
      name: "Firefly",
      cost: 5,
      element: "Fire",
      path: "Destruction",
      position: "on",
      bonds: ["Break", "Stellaron Hunters"],
      stats: { hp: 1250, atk: 620, def: 780, spd: 105 },
      combat: {
        initials: "FI",
        maxEnergy: 100,
        startEnergy: 50,
        basic: { name: "Order: Flare Propulsion", multiplier: 0.5, targets: 1, energyGain: 20, spGain: 1, toughnessDamage: 20 },
        skill: {
          name: "Order: Aerial Bombardment",
          multiplier: 1.3,
          targets: 1,
          energyGain: 30,
          spCost: 1,
          toughnessDamage: 20,
          hpCostPct: 0.4,
          lowHpThreshold: 0.5,
          lowHpMultiplier: 1.8,
          lowHpTargets: "all"
        },
        ultimate: {
          name: "Fyrefly Type-IV: Complete Combustion",
          multiplier: 2.2,
          targets: "all",
          energyCost: 100,
          toughnessDamage: 20,
          enhancedFirst: 1.5,
          burn: { type: "Burn", multiplier: 0.6, turns: 2, element: "Fire" }
        },
        talent: { breakEffect: 0.3, superBreakMaxHpPct: 0.05 },
        empowerment: { breaksToAutoUlt: 3 }
      },
      note: "Position-locked. Firefly is the Break school's 5-cost capstone and a Stellaron Hunters Star Hunter candidate.",
      slots: {
        on: {
          empowerment: "Supernova Overload (Currency Wars): after Break allies trigger 3 Weakness Breaks, Firefly immediately uses a Supernova Overload-style move outside her turn.",
          abilities: [
            { slot: "Basic ATK", name: "Order: Flare Propulsion", text: "Deals Fire DMG equal to 50% of SAM's ATK to a single target enemy." },
            { slot: "Enhanced Basic", name: "Fyrefly Type-IV: Pyrogenic Decimation", text: "Restores HP equal to 20% of SAM's max HP and deals Fire DMG equal to 100% of SAM's ATK to one enemy." },
            { slot: "Skill", name: "Order: Aerial Bombardment", text: "Consumes HP equal to 40% of SAM's max HP, regenerates 60% of max Energy, deals Fire DMG equal to 200% of SAM's ATK to one enemy, and advances SAM's next action by 25%. If HP is insufficient, reduces SAM to 1 HP." },
            { slot: "Enhanced Skill", name: "Fyrefly Type-IV: Deathstar Overload", text: "Restores 25% of max HP, implants Fire Weakness on the target and adjacent enemies for 2 turns, deals Fire DMG equal to (0.2 × Break Effect + 200% ATK) to the target, and (0.1 × Break Effect + 100% ATK) to adjacent enemies. Break Effect is capped at 360%." },
            { slot: "Ultimate", name: "Fyrefly Type-IV: Complete Combustion", text: "Costs 240 Energy. Enters Complete Combustion, advances SAM's action by 100%, and grants Enhanced Basic ATK and Enhanced Skill. During Complete Combustion, SPD increases by 60, attacks gain 50% Weakness Break Efficiency and 20% Break DMG, and a countdown with 70 SPD appears. SAM cannot use Ultimate while in Complete Combustion." },
            { slot: "Talent", name: "Chrysalid Pyronexus", text: "The lower SAM's HP, the less DMG received, up to 40% reduction at 20% HP. During Complete Combustion the reduction is always maxed and Effect RES increases by 30%. At battle start, if Energy is below 50%, regenerates to 50%. When Energy reaches max, dispels all debuffs." },
            { slot: "Technique", name: "Δ Order: Meteoric Incineration", text: "After use, plunges and attacks all enemies, applies Fire Weakness for 2 turns, and deals Fire DMG equal to 200% of SAM's ATK." }
          ]
        }
      }
    },
    {
      id: "aglaea",
      name: "Aglaea",
      cost: 1,
      element: "Lightning",
      path: "Remembrance",
      position: "on",
      bonds: ["Day Demigod", "Energy"],
      stats: { hp: 1100, atk: 660, def: 480, spd: 112 },
      combat: {
        maxEnergy: 350,
        startEnergy: 175,
        basic: {
          name: "Thorned Nectar",
          multiplier: 0.5,
          targets: 1,
          energyGain: 20,
          spGain: 1,
          toughnessDamage: 20,
          enhanced: {
            name: "Slash by a Thousandfold Kiss",
            multiplier: 2.0,
            adjacentMultiplier: 0.9,
            summonMultiplier: 2.0,
            summonAdjacentMultiplier: 0.9,
            energyGain: 20,
            spGain: 0,
            toughnessDamage: 20
          }
        },
        skill: {
          name: "Rise, Exalted Renown",
          type: "summon",
          energyGain: 20,
          spCost: 1,
          summonHealPct: 0.5
        },
        ultimate: {
          name: "Dance, Destined Weaveress",
          type: "supremeStance",
          energyCost: 350,
          countdownSpd: 100
        },
        talent: {
          spdToAtk: 0.2,
          conversionPerSpdBuff: 0.02,
          summonHpPct: 0.66,
          summonHpFlat: 720,
          summonSpdPct: 0.35
        },
        empowerment: { maxThreads: 5, atkPerThread: 0.06, spdPerThread: 2, extraTargetsAt: 5 },
        summon: {
          name: "Garmentmaker",
          initials: "GM",
          skillName: "Thorned Snare",
          multiplier: 1.1,
          adjacentMultiplier: 0.66,
          toughnessDamage: 10,
          energyGain: 10
        }
      },
      note: "Position-locked. Remembrance summoner: Rise, Exalted Renown summons Garmentmaker, and Dance, Destined Weaveress enters Supreme Stance to turn her Basic into a Joint ATK.",
      slots: {
        on: {
          empowerment: "Currency Wars empowerment: converts SPD into ATK/Strength, making Aglaea the premier 'wheelchair' carry when stacked with Anti-Grav Boots and Light Speed Propeller.",
          abilities: [
            { slot: "Basic ATK", name: "Thorned Nectar", text: "Deals Lightning DMG equal to 50% of Aglaea's ATK to one enemy. +20 Energy, +1 SP." },
            { slot: "Enhanced Basic", name: "Slash by a Thousandfold Kiss", text: "During Supreme Stance, Aglaea and Garmentmaker launch a Joint ATK, dealing 200% of Aglaea's ATK and 200% of Garmentmaker's ATK to the target, plus 90% / 90% to adjacent enemies. Cannot recover Skill Points." },
            { slot: "Skill", name: "Rise, Exalted Renown", text: "Restores 50% of Garmentmaker's max HP. If Garmentmaker is absent, summons it and immediately advances its action by 100%. Cannot be used during Supreme Stance." },
            { slot: "Ultimate", name: "Dance, Destined Weaveress", text: "Costs 350 Energy. Summons Garmentmaker or restores it to full HP, enters Supreme Stance, and immediately advances Aglaea's action. Supreme Stance enhances Basic ATK to Slash by a Thousandfold Kiss, locks Skill, and starts a 100 SPD countdown. When the countdown acts, Garmentmaker self-destructs and Supreme Stance ends." },
            { slot: "Talent", name: "Rosy-Fingered", text: "Garmentmaker has 35% of Aglaea's SPD and max HP equal to 66% of Aglaea's max HP plus 720. While Garmentmaker is on the field, Aglaea's attacks inflict Seam Stitch; attacking a Seam Stitch target deals additional Lightning DMG equal to 30% of Aglaea's ATK. Garmentmaker's Thorned Snare deals 110% ATK to one enemy and 66% to adjacent enemies, and increases Garmentmaker's SPD by 55 after attacking a Seam Stitch target, stacking up to 6 times." }
          ]
        }
      }
    },
    {
      id: "huohuo",
      name: "Huohuo",
      cost: 1,
      element: "Wind",
      path: "Abundance",
      position: "off",
      bonds: ["Xianzhou", "Energy", "Heal"],
      stats: { hp: 1350, atk: 560, def: 500, spd: 98 },
      note: "Position-locked. Huohuo is the Heal/Energy sustain piece, not a damage dealer.",
      slots: {
        off: {
          empowerment: "Tail: Blessing: off-field heals also restore 5 Energy and grant the healed ally +8% ATK for 2 turns.",
          abilities: [
            { slot: "Basic ATK", name: "Banner: Stormcaller", text: "Deals 50% ATK Wind DMG to one enemy." },
            { slot: "Skill", name: "Tail: Protection", text: "Heals the lowest-HP ally for 130% ATK and cleanses 1 debuff." },
            { slot: "Ultimate", name: "Tail: Invocation", text: "Heals all allies for 90% ATK and restores 20 Energy to all allies." },
            { slot: "Talent", name: "Possession", text: "When an ally uses their Ultimate, Huohuo heals them for 40% ATK." }
          ]
        }
      }
    },
    {
      id: "tribbie",
      name: "Tribbie",
      cost: 2,
      element: "Quantum",
      path: "Harmony",
      position: "both",
      bonds: ["Day Demigod", "AoE ATK", "Quantum Resonance"],
      stats: { hp: 1200, atk: 600, def: 520, spd: 102 },
      note: "The first On/Off-Field character built. On-Field gives manual Ultimate control; Off-Field automates it at combat start.",
      slots: {
        on: {
          empowerment: "Threefold Chorus: On-Field Tribbie can manually cast her Ultimate. Each ally Ultimate grants a Verse (max 3). At 3 Verses, the next Ultimate deals double DMG and refreshes the buff.",
          abilities: [
            { slot: "Basic ATK", name: "A Thousand Bells", text: "Deals 50% ATK Quantum DMG to one enemy." },
            { slot: "Skill", name: "Ode to the Ages", text: "All allies gain +15% DMG and +12% CRIT DMG for 2 turns." },
            { slot: "Ultimate", name: "Chorus of the Three", text: "Deals 130% ATK Quantum DMG to all enemies and makes them take +10% DMG for 2 turns." },
            { slot: "Talent", name: "Threefold Blessing", text: "Every 3 ally actions, Tribbie launches a follow-up attack dealing 45% ATK Quantum DMG to all enemies." }
          ]
        },
        off: {
          empowerment: "Ode at First Light: Off-Field Tribbie automatically uses her Ultimate at the start of combat, then follows up periodically. Her Ultimate cannot be manually controlled off-field.",
          abilities: [
            { slot: "Basic ATK", name: "A Thousand Bells", text: "Deals 40% ATK Quantum DMG to a random enemy." },
            { slot: "Skill", name: "Ode to the Ages", text: "Automatically buffs the 2 allies with the highest ATK: +15% DMG and +12% CRIT DMG for 2 turns." },
            { slot: "Ultimate", name: "Chorus of the Three", text: "At combat start, deals 100% ATK Quantum DMG to all enemies and makes them take +10% DMG for 2 turns." },
            { slot: "Talent", name: "Threefold Blessing", text: "Every 3 ally actions, follows up for 35% ATK Quantum DMG to all enemies. Each Verse grants all allies +4% DMG." }
          ]
        }
      }
    },
    {
      id: "jiaoqiu",
      name: "Jiaoqiu",
      cost: 1,
      element: "Fire",
      path: "Nihility",
      position: "off",
      bonds: ["Wolf Hunt", "Debuff", "DoT"],
      stats: { hp: 1050, atk: 590, def: 420, spd: 101 },
      note: "Position-locked. Off-Field Jiaoqiu is the Burn/DoT applier that feeds Debuff and DoT comps.",
      slots: {
        off: {
          empowerment: "Scalding Kitchen: Jiaoqiu's Burn also counts as Ashen Roast. Enemies with 3 or more debuffs take +12% DMG from all sources, and when they act they spread 1 debuff to an adjacent enemy.",
          abilities: [
            { slot: "Basic ATK", name: "Flaming Feast", text: "Deals 50% ATK Fire DMG to one enemy with a 50% base chance to apply Burn for 2 turns." },
            { slot: "Skill", name: "Seven-Layered Cloud", text: "Deals 80% ATK Fire DMG to all enemies and applies Ashen Roast, increasing DMG taken by 8% for 2 turns." },
            { slot: "Ultimate", name: "Grand Feast of the Flaming Moxa", text: "Deals 140% ATK Fire DMG to all enemies and detonates their Burn and DoT effects for 70% of their total DoT DMG." },
            { slot: "Talent", name: "Ashen Roast", text: "Jiaoqiu's DoT DMG is increased by 25%. Each new debuff applied to an enemy extends its Burn by 1 turn." }
          ]
        }
      }
    },
    {
      id: "feixiao",
      name: "Feixiao",
      cost: 1,
      element: "Wind",
      path: "Hunt",
      position: "on",
      bonds: ["Wolf Hunt", "Follow-Up ATK"],
      stats: { hp: 1000, atk: 650, def: 380, spd: 110 },
      combat: {
        initials: "FE",
        maxEnergy: 100,
        startEnergy: 50,
        basic: { name: "Boltsunder", multiplier: 0.5, targets: 1, energyGain: 20, spGain: 1, toughnessDamage: 20 },
        skill: {
          name: "Waraxe",
          multiplier: 1.1,
          targets: 1,
          energyGain: 30,
          spCost: 1,
          toughnessDamage: 20,
          mark: "prey"
        },
        ultimate: {
          name: "Terrasplit",
          multiplier: 2.0,
          allMultiplier: 1.0,
          targets: "single_or_all",
          energyCost: 100,
          toughnessDamage: 20
        },
        talent: {
          followUpsForEnhanced: 3,
          enhancedBasicMultiplier: 0.9
        },
        empowerment: { rayThreshold: 6, followUpMultiplier: 0.6 }
      },
      note: "Position-locked. On-Field Feixiao is the 1-cost Follow-Up ATK tempo carry and Wolf Hunt opener.",
      slots: {
        on: {
          empowerment: "No unique Currency Wars empowerment is documented for Feixiao in the 4.6 research snapshot.",
          abilities: [
            { slot: "Basic ATK", name: "Boltsunder", text: "Deals Wind DMG equal to 100% of Feixiao's ATK to a single target enemy." },
            { slot: "Skill", name: "Waraxe", text: "Deals Wind DMG equal to 200% of Feixiao's ATK to a target enemy, then immediately launches 1 instance of Thunderhunt's follow-up attack against the target." },
            { slot: "Ultimate", name: "Terrasplit", text: "Deals Wind DMG to one enemy, up to 700% of Feixiao's ATK across 6 Boltsunder Blitz / Waraxe Skyward hits and a final strike. Ignores Weakness Type for Toughness reduction. While the target is not Weakness Broken, Feixiao gains 100% Weakness Break Efficiency. Requires 6 Flying Aureus (max 12)." },
            { slot: "Talent", name: "Thunderhunt", text: "Feixiao gains 1 Flying Aureus for every 2 attacks by allies and can hold up to 12. After an ally attacks, Feixiao launches a follow-up attack for 110% ATK Wind DMG against the primary target, once per turn, and gains 60% DMG for 2 turns." },
            { slot: "Technique", name: "Stormborn", text: "After use, enters Onrush for 20 seconds, pulls in nearby enemies, and gains 1 Flying Aureus. After entering battle, deals 200% ATK Wind DMG to all enemies at the start of each wave; this DMG is guaranteed to CRIT and increases by 100% for each additional enemy pulled in, up to 1000%." }
          ]
        }
      }
    },
    {
      id: "jade",
      name: "Jade",
      cost: 1,
      element: "Quantum",
      path: "Erudition",
      position: "off",
      bonds: ["IPC", "AoE ATK"],
      stats: { hp: 1000, atk: 620, def: 400, spd: 103 },
      note: "Position-locked. Off-Field Jade unlocks Debt Collector, the documented partner for Herta's On-Field follow-up engine.",
      slots: {
        off: {
          empowerment: "Debt Collector: Jade designates the highest-ATK ally as Collector at combat start. When the Collector attacks, Jade deals 60% ATK Quantum DMG to all enemies, and the Collector gains +30% SPD for 2 turns.",
          abilities: [
            { slot: "Basic ATK", name: "Whiplash", text: "Deals 50% ATK Quantum DMG to one enemy." },
            { slot: "Skill", name: "Acquisition Surety", text: "Designates an ally as Collector and deals 90% ATK Quantum DMG to all enemies." },
            { slot: "Ultimate", name: "Contract Zero", text: "Deals 170% ATK Quantum DMG to all enemies. The Collector's target takes an additional 60% ATK Quantum DMG." },
            { slot: "Talent", name: "Collateral", text: "Ally attacks grant 1 Collateral (max 4). At 4, Jade consumes them to follow up for 50% ATK Quantum DMG to all enemies." }
          ]
        }
      }
    },
    {
      id: "rappa",
      name: "Rappa",
      cost: 1,
      element: "Imaginary",
      path: "Erudition",
      position: "on",
      bonds: ["Galaxy Ranger", "Break"],
      stats: { hp: 1080, atk: 630, def: 400, spd: 106 },
      note: "Position-locked. On-Field Rappa is the 1-cost Break AoE carry and Galaxy Ranger speed piece.",
      slots: {
        on: {
          empowerment: "Ninjutsu: Inkblot: Rappa's attacks apply Seal to all hit enemies. When a Sealed enemy is Weakness-Broken, Rappa gains 1 extra turn and her next Skill becomes Enhanced, dealing 50% more DMG and reducing Toughness on all enemies.",
          abilities: [
            { slot: "Basic ATK", name: "Ninjutsu: Rising Wind", text: "Deals 50% ATK Imaginary DMG to one enemy." },
            { slot: "Skill", name: "Ninjutsu: Fuma Shuriken", text: "Deals 100% ATK Imaginary DMG to all enemies and reduces their Toughness." },
            { slot: "Ultimate", name: "Ninjutsu: Extinction", text: "Deals 200% ATK Imaginary DMG to all enemies and delays Weakness-Broken enemies by 25%." },
            { slot: "Talent", name: "Ninjutsu: Break", text: "Break Effect +30%. Rappa's attacks deal Super Break DMG equal to 30% of the original Break DMG." }
          ]
        }
      }
    },
    {
      id: "dahlia",
      name: "The Dahlia",
      cost: 1,
      element: "Imaginary",
      path: "Harmony",
      position: "off",
      bonds: ["The Planet of Festivities", "Break"],
      stats: { hp: 1120, atk: 570, def: 460, spd: 104 },
      note: "Position-locked. Off-Field The Dahlia is the 1-cost Break enabler for Planet of Festivities and Break shells.",
      slots: {
        off: {
          empowerment: "Guest of Honor: The Dahlia marks the enemy with the highest Toughness. Break DMG against that enemy is increased by 20%, and each Weakness Break moves the mark to another enemy and grants all allies +6% Break Effect for 2 turns.",
          abilities: [
            { slot: "Basic ATK", name: "A Toast", text: "Deals 50% ATK Imaginary DMG to one enemy." },
            { slot: "Skill", name: "Grand Ball", text: "Grants an ally +20% Break Effect for 2 turns. Their attacks reduce 10 extra Toughness." },
            { slot: "Ultimate", name: "Nightfall Soiree", text: "Deals 100% ATK Imaginary DMG to all enemies, delays them by 15%, and grants all allies +15% Break Effect for 2 turns." },
            { slot: "Talent", name: "Last Dance", text: "When an enemy is Weakness-Broken, all allies restore 5 Energy and gain +8% DMG for 2 turns." }
          ]
        }
      }
    },
    {
      id: "mydei",
      name: "Mydei",
      cost: 1,
      element: "Imaginary",
      path: "Destruction",
      position: "on",
      bonds: ["Night Demigod", "Bloodflame"],
      stats: { hp: 1300, atk: 640, def: 440, spd: 99 },
      note: "Position-locked. On-Field Mydei is the 1-cost Bloodflame bruiser who trades HP for escalating damage.",
      slots: {
        on: {
          empowerment: "Godslayer: HP consumed by Mydei fills a Blood Pool. At 50% of his max HP consumed, he enters Vendetta: he taunts enemies, takes 30% less DMG, and his next Skill becomes Enhanced.",
          abilities: [
            { slot: "Basic ATK", name: "Blood for Blood", text: "Deals 50% ATK Imaginary DMG to one enemy." },
            { slot: "Skill", name: "Crimson Throne", text: "Consumes 20% of Mydei's current HP and deals 120% ATK Imaginary DMG to one enemy plus 60% to adjacent enemies." },
            { slot: "Ultimate", name: "Throne of Ash", text: "Consumes 30% of Mydei's current HP, deals 200% ATK Imaginary DMG to all enemies, and grants himself a Shield equal to 15% of his max HP." },
            { slot: "Talent", name: "Bloodflame", text: "Each 1% of max HP Mydei consumes grants +1% ATK (max 50%) for the rest of the battle. At 3-star, he survives one fatal hit per battle at 1 HP." }
          ]
        }
      }
    },
    {
      id: "cipher",
      name: "Cipher",
      cost: 1,
      element: "Quantum",
      path: "Nihility",
      position: "on",
      bonds: ["Night Demigod", "Follow-Up ATK", "Debuff"],
      stats: { hp: 1000, atk: 645, def: 380, spd: 109 },
      note: "Position-locked. On-Field Cipher is the 1-cost Follow-Up/Debuff hybrid that marks a single bounty.",
      slots: {
        on: {
          empowerment: "Bounty Hunter: Cipher marks one enemy as Bounty. When an ally attacks the Bounty, Cipher launches a follow-up for 60% ATK Quantum DMG and applies Exposed, increasing DMG taken by 10% for 2 turns.",
          abilities: [
            { slot: "Basic ATK", name: "Nightfall Shot", text: "Deals 50% ATK Quantum DMG to one enemy." },
            { slot: "Skill", name: "Marked Prey", text: "Deals 100% ATK Quantum DMG to one enemy and marks it as Bounty for 3 turns." },
            { slot: "Ultimate", name: "Nightfall Verdict", text: "Deals 180% ATK Quantum DMG to the Bounty and 100% ATK Quantum DMG to all other enemies, then detonates Exposed for 60% ATK." },
            { slot: "Talent", name: "Dead End", text: "Cipher's follow-up attacks gain +20% CRIT DMG. Each debuff on the Bounty grants Cipher +5% ATK." }
          ]
        }
      }
    },
    {
      id: "yaoguang",
      name: "Yao Guang",
      cost: 1,
      element: "Lightning",
      path: "Elation",
      position: "off",
      bonds: ["Xianzhou", "Elation"],
      stats: { hp: 1030, atk: 600, def: 430, spd: 105 },
      note: "Position-locked. Off-Field Yao Guang is the documented Elation core and a Xianzhou bridge piece.",
      slots: {
        off: {
          empowerment: "Aha's Favorite: Yao Guang banks Punchline whenever an ally attacks or uses an Ultimate. At 100 Punchline she triggers Aha Instant, dealing 150% ATK Lightning DMG to all enemies and restoring 1 Skill Point.",
          abilities: [
            { slot: "Basic ATK", name: "A Spark of Mirth", text: "Deals 50% ATK Lightning DMG to one enemy." },
            { slot: "Skill", name: "Joke's on You", text: "Deals 90% ATK Lightning DMG to all enemies and applies Grin, increasing DMG taken by 8% for 2 turns." },
            { slot: "Ultimate", name: "Cosmic Punchline", text: "Deals 160% ATK Lightning DMG to all enemies and restores 1 Skill Point to the team." },
            { slot: "Talent", name: "Laughing Stock", text: "Every 3 ally actions grants 20 Punchline. Elation allies' follow-up attacks deal +15% DMG." }
          ]
        }
      }
    },
    {
      id: "rin",
      name: "Rin Tohsaka",
      cost: 1,
      element: "Fire",
      path: "Harmony",
      position: "on",
      bonds: ["Holy Grail of Destiny", "Skill Points"],
      stats: { hp: 980, atk: 635, def: 370, spd: 111 },
      note: "Position-locked. On-Field Rin converts Skill Point spending into Gem Energy, then cashes it out as a Joint Follow-Up with Archer.",
      slots: {
        on: {
          empowerment: "Gem Energy: When an ally spends a Skill Point, Rin gains 1 Gem Energy (max 5). Her Skill can consume 3 Gem Energy to grant all allies +20% CRIT DMG, and at 5 Gem Energy she performs a Joint Follow-Up with Archer for 120% ATK Fire DMG.",
          abilities: [
            { slot: "Basic ATK", name: "Gandr Shot", text: "Deals 50% ATK Fire DMG to one enemy." },
            { slot: "Skill", name: "Jewel Magecraft", text: "Deals 90% ATK Fire DMG to one enemy. Can consume 3 Gem Energy to grant all allies +20% CRIT DMG for 2 turns." },
            { slot: "Ultimate", name: "Tohsaka's Finest", text: "Deals 180% ATK Fire DMG to all enemies. Consumes all Gem Energy, granting all allies +15% CRIT DMG per Gem Energy consumed for 2 turns." },
            { slot: "Talent", name: "Second Owner", text: "When an ally spends a Skill Point, Rin gains 1 Gem Energy. At 3 Gem Energy, her next Basic ATK becomes Enhanced and hits all enemies for 80% ATK." }
          ]
        }
      }
    },
    {
      id: "march7th",
      name: "The Hunt March 7th",
      cost: 1,
      element: "Imaginary",
      path: "Hunt",
      position: "on",
      bonds: ["Express Cohort", "Shield"],
      stats: { hp: 1050, atk: 620, def: 470, spd: 108 },
      note: "Position-locked. On-Field March 7th is the 1-cost Express Cohort follow-up attacker with a shield payoff.",
      slots: {
        on: {
          empowerment: "Master's Teachings: March 7th chooses the highest-ATK ally as Shifu at combat start. When Shifu attacks, March launches a follow-up for 60% ATK Imaginary DMG, and Shifu gains a Shield equal to 10% of March's DEF.",
          abilities: [
            { slot: "Basic ATK", name: "Frostbite Blade", text: "Deals 50% ATK Imaginary DMG to one enemy." },
            { slot: "Skill", name: "Winter's End", text: "Deals 110% ATK Imaginary DMG to one enemy and grants March a Shield equal to 15% of her DEF for 2 turns." },
            { slot: "Ultimate", name: "Glacial Cascade", text: "Deals 180% ATK Imaginary DMG to all enemies and delays them by 15%." },
            { slot: "Talent", name: "Shielded Heart", text: "March's follow-up DMG is increased by 25% while she has a Shield. At 3-star, Shifu also gains the same Shield." }
          ]
        }
      }
    },
    {
      id: "asta",
      name: "Asta",
      cost: 1,
      element: "Fire",
      path: "Harmony",
      position: "off",
      bonds: ["Cosmic Scholar", "DoT"],
      stats: { hp: 1080, atk: 575, def: 450, spd: 107 },
      note: "Position-locked. Off-Field Asta is the 1-cost team SPD/ATK buffer and the DoT bond's Fire bridge.",
      slots: {
        off: {
          empowerment: "Astral Ensemble: At combat start, all allies gain +10% ATK and +6 SPD for 3 turns. Each ally action grants 1 Spark; at 5 Sparks Asta follows up with a Burn on all enemies for 60% ATK Fire DMG.",
          abilities: [
            { slot: "Basic ATK", name: "Meteor Shower", text: "Deals 50% ATK Fire DMG to one enemy." },
            { slot: "Skill", name: "Meteor Storm", text: "Deals 80% ATK Fire DMG to all enemies and applies Burn for 2 turns." },
            { slot: "Ultimate", name: "Astral Illumination", text: "Grants all allies +20% ATK and +20 SPD for 2 turns." },
            { slot: "Talent", name: "Spark", text: "Each ally action grants 1 Spark (max 5). At 5 Sparks, Asta attacks all enemies for 60% ATK Fire DMG and applies Burn." }
          ]
        }
      }
    },
    {
      id: "sampo",
      name: "Sampo",
      cost: 1,
      element: "Wind",
      path: "Nihility",
      position: "off",
      bonds: ["Galactic Voyager", "DoT"],
      stats: { hp: 1000, atk: 610, def: 400, spd: 106 },
      note: "Position-locked. Off-Field Sampo is the 1-cost Wind Shear spreader and DoT economy piece.",
      slots: {
        off: {
          empowerment: "Business Partner: Sampo's Wind Shear can stack up to 5 times. When an enemy dies, its Wind Shear spreads to 2 other enemies and Sampo earns 1 Gold Coin, up to 3 Gold Coins per battle.",
          abilities: [
            { slot: "Basic ATK", name: "Cheap Shot", text: "Deals 50% ATK Wind DMG to one enemy with a 50% base chance to apply 1 stack of Wind Shear." },
            { slot: "Skill", name: "Windrider", text: "Deals 90% ATK Wind DMG to one enemy and applies 2 stacks of Wind Shear for 3 turns." },
            { slot: "Ultimate", name: "Aha's Gift", text: "Deals 140% ATK Wind DMG to all enemies, applies 3 stacks of Wind Shear, and detonates 1 stack on each enemy." },
            { slot: "Talent", name: "Wind Shear", text: "Sampo's DoT DMG is increased by 20%. Enemies with 3 or more Wind Shear stacks take +10% DoT DMG." }
          ]
        }
      }
    },
    {
      id: "qingque",
      name: "Qingque",
      cost: 1,
      element: "Quantum",
      path: "Erudition",
      position: "on",
      bonds: ["Xianzhou", "Skill Points"],
      stats: { hp: 1020, atk: 640, def: 390, spd: 104 },
      combat: {
        initials: "QQ",
        maxEnergy: 100,
        startEnergy: 50,
        basic: {
          name: "Flower Pick",
          multiplier: 0.5,
          targets: 1,
          energyGain: 20,
          spGain: 1,
          toughnessDamage: 20,
          enhanced: { multiplier: 3.0, adjacentMultiplier: 1.0, tilesCost: 4 }
        },
        skill: {
          name: "A Scoop of Moon",
          multiplier: 0.8,
          targets: 1,
          energyGain: 30,
          spCost: 1,
          toughnessDamage: 20,
          tilesGain: 1,
          maxTiles: 4
        },
        ultimate: {
          name: "A Quartet? Woo-hoo!",
          multiplier: 1.8,
          targets: "all",
          energyCost: 100,
          toughnessDamage: 20,
          tilesGain: 1
        },
        talent: { enhancedAtTiles: 4 },
        empowerment: { tempSp: 2 }
      },
      note: "Position-locked. On-Field Qingque is the 1-cost Skill Point gambler who can keep spending past Hidden Hand with temporary SP.",
      slots: {
        on: {
          empowerment: "Hidden Hand (Currency Wars): Qingque gains temporary Skill Points and can keep using her Skill past Hidden Hand.",
          abilities: [
            { slot: "Basic ATK", name: "Flower Pick", text: "Tosses 1 jade tile from the suit with the fewest tiles in hand and deals Quantum DMG equal to 50% of Qingque's ATK to one enemy." },
            { slot: "Enhanced Basic", name: "Cherry on Top!", text: "Deals Quantum DMG to one enemy and adjacent enemies. Cannot recover Skill Points. Used while in the Hidden Hand state." },
            { slot: "Skill", name: "A Scoop of Moon", text: "Immediately draws 2 jade tiles and increases Qingque's DMG until the end of the current turn, stacking up to 4 times. The turn does not end after this Skill is used." },
            { slot: "Ultimate", name: "A Quartet? Woo-hoo!", text: "Costs 140 Energy. Deals Quantum DMG to all enemies and obtains 4 jade tiles of the same suit." },
            { slot: "Talent", name: "Celestial Jade", text: "When an ally's turn starts, Qingque draws 1 tile from 3 suits and can hold up to 4 tiles. If she starts her turn with 4 tiles of the same suit, she consumes them to enter Hidden Hand: ATK increases and Flower Pick becomes Cherry on Top!. Hidden Hand ends after using Cherry on Top!." },
            { slot: "Technique", name: "Game Solitaire", text: "After using Technique, Qingque draws jade tiles when the battle starts." }
          ]
        }
      }
    },
    {
      id: "tingyun",
      name: "Tingyun",
      cost: 1,
      element: "Lightning",
      path: "Harmony",
      position: "off",
      bonds: ["Xianzhou", "Energy"],
      stats: { hp: 1050, atk: 580, def: 430, spd: 109 },
      note: "Position-locked. Off-Field Tingyun is the 1-cost Energy battery and the Xianzhou/Energy bridge unit.",
      slots: {
        off: {
          empowerment: "Benediction: Tingyun grants the highest-ATK ally Windflame, increasing ATK by 25% and restoring 20 Energy every 3 turns. When that ally uses their Ultimate, all allies restore 15 Energy.",
          abilities: [
            { slot: "Basic ATK", name: "Beneficent Plumage", text: "Deals 50% ATK Lightning DMG to one enemy." },
            { slot: "Skill", name: "Soothing Melody", text: "Grants an ally +25% ATK for 3 turns and restores 30 Energy." },
            { slot: "Ultimate", name: "Amidst the Rejoicing Clouds", text: "Grants an ally +30% DMG for 2 turns and restores 30 Energy." },
            { slot: "Talent", name: "Windflame", text: "When an ally uses their Ultimate, Tingyun restores 10 Energy to herself and the ally with the lowest Energy." }
          ]
        }
      }
    },
    {
      id: "blade",
      name: "Blade",
      cost: 1,
      element: "Wind",
      path: "Destruction",
      position: "on",
      bonds: ["Stellaron Hunters", "Bloodflame"],
      stats: { hp: 1320, atk: 630, def: 430, spd: 100 },
      note: "Position-locked. On-Field Blade is the 1-cost HP-consuming Bloodflame bruiser and Stellaron Hunters body.",
      slots: {
        on: {
          empowerment: "Death Wish: Blade consumes HP to build Charge (max 3). At 3 Charge his next attack becomes Enhanced, hitting all enemies and dealing damage based on the HP he has consumed. At 3-star, he survives one fatal hit per battle.",
          abilities: [
            { slot: "Basic ATK", name: "Shard Sword", text: "Deals 50% ATK Wind DMG to one enemy." },
            { slot: "Skill", name: "Hellscape", text: "Consumes 30% of Blade's current HP and deals 120% ATK Wind DMG to one enemy plus 60% to adjacent enemies." },
            { slot: "Ultimate", name: "Death Sentence", text: "Deals 200% ATK Wind DMG to one enemy and 100% ATK Wind DMG to adjacent enemies. Consumes 20% of current HP to increase DMG by 30%." },
            { slot: "Talent", name: "Bloodflame", text: "Each 1% of max HP Blade consumes grants +1% DMG (max 40%). When his HP drops below 50%, his next follow-up deals 80% ATK Wind DMG to all enemies." }
          ]
        }
      }
    },
    {
      id: "moze",
      name: "Moze",
      cost: 1,
      element: "Lightning",
      path: "Hunt",
      position: "on",
      bonds: ["Wolf Hunt", "Follow-Up ATK"],
      stats: { hp: 980, atk: 655, def: 380, spd: 110 },
      note: "Position-locked. On-Field Moze is the 1-cost Wolf Hunt executioner and Follow-Up ATK primer.",
      slots: {
        on: {
          empowerment: "Nightfall Prey: Moze marks one enemy as Prey. When an ally attacks Prey, Moze launches a follow-up for 70% ATK Lightning DMG. After 3 follow-ups, he immediately uses his Ultimate outside his turn.",
          abilities: [
            { slot: "Basic ATK", name: "Shadowless Blade", text: "Deals 50% ATK Lightning DMG to one enemy." },
            { slot: "Skill", name: "Dusk's Verdict", text: "Deals 110% ATK Lightning DMG to one enemy and marks it as Prey for 3 turns." },
            { slot: "Ultimate", name: "Death's Echo", text: "Deals 220% ATK Lightning DMG to Prey and grants Moze +30% CRIT DMG for 2 turns." },
            { slot: "Talent", name: "Hunter's Instinct", text: "Moze's follow-up DMG is increased by 20%. When Prey dies, the mark moves to the enemy with the highest HP." }
          ]
        }
      }
    },
    {
      id: "gallagher",
      name: "Gallagher",
      cost: 1,
      element: "Fire",
      path: "Abundance",
      position: "off",
      bonds: ["Break", "The Planet of Festivities", "Heal"],
      stats: { hp: 1250, atk: 565, def: 470, spd: 102 },
      note: "Position-locked. Off-Field Gallagher is the 1-cost Break/Heal sustain piece and Planet of Festivities enabler.",
      slots: {
        off: {
          empowerment: "Spirit Drinker: Gallagher's heals grant Besotted, increasing Break Effect by 10% for 2 turns. While an enemy is Weakness-Broken, his next heal is enhanced, hits all allies, and restores 5 Energy.",
          abilities: [
            { slot: "Basic ATK", name: "Firebrand", text: "Deals 50% ATK Fire DMG to one enemy." },
            { slot: "Skill", name: "Heartfelt Party", text: "Heals the lowest-HP ally for 130% ATK and cleanses 1 debuff." },
            { slot: "Ultimate", name: "Champagne Toast", text: "Deals 140% ATK Fire DMG to all enemies and applies Drunk, increasing Break DMG taken by 15% for 2 turns." },
            { slot: "Talent", name: "Tipsy", text: "When an ally attacks a Weakness-Broken enemy, Gallagher heals that ally for 30% ATK." }
          ]
        }
      }
    }
  ];

  function byId(id) {
    for (var i = 0; i < CHARACTERS.length; i++) {
      if (CHARACTERS[i].id === id) {
        return CHARACTERS[i];
      }
    }
    return null;
  }

  window.CW_CHARACTERS = {
    ELEMENTS: ELEMENTS,
    POSITIONS: POSITIONS,
    COST_LABEL: COST_LABEL,
    list: CHARACTERS,
    byId: byId
  };
})();
