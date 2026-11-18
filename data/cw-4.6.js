(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.CW_DATA = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  /*
   * Canonical Currency Wars 4.6 dataset for the remake.
   *
   * provenance values:
   *   verified    - captured from the 4.6 game/Data Bank
   *   documented  - stated in the 4.6 research snapshot (INIT.txt)
   *   placeholder - remake value, NOT official; safe to replace when verified data is found
   *
   * Exact numeric values for most combat/economy effects are not present in the
   * archived snapshot. Those numbers are placeholders and are flagged as such.
   */

  var bonds = [
    {
      id: "xianzhou",
      name: "Xianzhou",
      type: "faction",
      members: ["Yao Guang", "Huohuo", "Dan Heng \u2022 Imbibitor Lunae", "Fugue", "Fu Xuan", "Yanqing", "Jing Yuan"],
      advisors: ["Qingque", "Tingyun"],
      effect: "Summons the LIGHTNING-LORD; when it acts it attacks ALL enemies (AoE). Bond level scales the Lightning-Lord's power. Considered one of the strongest faction bonds (largest member pool, strong early AoE; needs 10 for the top tier).",
      thresholds: [4, 6, 8, 10],
      implemented: false,
      provenance: "documented"
    },
    {
      id: "wolf_hunt",
      name: "Wolf Hunt",
      type: "faction",
      members: ["Jiaoqiu", "Feixiao", "Lingsha", "Jingliu", "Yanqing", "Yunli"],
      advisors: ["Moze"],
      effect: "Summons \"BORISIN\" to fight; it gains EXP over combat, evolves into different attack forms, and buffs allies. Needs units/Emblems to reach the top \"Hoolay\"/\"Crimson Moon: Lupine Prime Divine\" evolution. RNG/item dependent.",
      thresholds: [4, 6, 8, 10],
      implemented: false,
      provenance: "documented"
    },
    {
      id: "night_demigod",
      name: "Night Demigod",
      type: "faction",
      members: ["Mydei", "Cipher", "Dan Heng \u2022 Permansor Terrae", "Cerydra", "Castorice", "Evernight", "Cyrene"],
      advisors: [],
      effect: "Demigod faction (Amphoreus); provides team buffs tied to member count (bond level).",
      thresholds: [4, 6, 8],
      implemented: false,
      provenance: "documented"
    },
    {
      id: "day_demigod",
      name: "Day Demigod",
      type: "faction",
      members: ["Aglaea", "Tribbie", "Hyacine", "Anaxa", "Hysilens", "Cyrene"],
      advisors: [],
      effect: "Grants SPD Amplification and access to \"Day: Light Speed Propeller\" (increases DMG based on SPD) - core to the Aglaea comp.",
      thresholds: [2, 4, 6],
      implemented: true,
      combat: { spdPctPerLevel: 0.03 },
      provenance: "placeholder"
    },
    {
      id: "belobog",
      name: "Belobog",
      type: "faction",
      members: ["Seele", "Natasha", "Gepard", "Bronya"],
      advisors: ["Sampo", "Pela"],
      effect: "Summons/empowers allies; considered strong (Seele carries). Tiers adjusted in a later patch alongside Break.",
      thresholds: [2, 4],
      implemented: false,
      provenance: "documented"
    },
    {
      id: "express_cohort",
      name: "Express Cohort",
      type: "faction",
      members: ["The Hunt March 7th", "Dan Heng \u2022 Imbibitor Lunae", "Sunday", "Himeko \u2022 Nova", "Destruction Trailblazer", "Preservation Trailblazer", "Harmony Trailblazer", "Remembrance Trailblazer", "Elation Trailblazer", "Welt"],
      advisors: ["Himeko"],
      effect: "Summons the \"Astral Express\"/\"Light Rail\" for additional damage/support; strength scales with member count. Himeko • Nova's \"Navigator\" independent bond lets her copy another Express member's School Bond.",
      thresholds: [4, 6, 8, 10],
      implemented: false,
      provenance: "documented"
    },
    {
      id: "cosmic_scholar",
      name: "Cosmic Scholar",
      type: "faction",
      members: ["Asta", "Herta", "Ruan Mei", "Dr. Ratio", "The Herta"],
      advisors: [],
      effect: "Stacks \"CAKE CATS\" based on the star level of Cosmic Scholar members; bonus rewards based on stack count (economy/scaling bond).",
      thresholds: [2, 4],
      implemented: true,
      economy: { goldPerNodePerLevel: 1 },
      provenance: "placeholder"
    },
    {
      id: "galactic_voyager",
      name: "Galactic Voyager",
      type: "faction",
      members: ["Argenti", "Evanescia", "Dr. Ratio", "Luocha", "Sparxie", "Welt"],
      advisors: ["Sampo"],
      effect: "faction buff (member-count scaling).",
      thresholds: [2, 4, 6],
      implemented: false,
      provenance: "documented"
    },
    {
      id: "planet_of_festivities",
      name: "The Planet of Festivities",
      type: "faction",
      members: ["The Dahlia", "Sparkle", "Sunday", "Robin", "Black Swan"],
      advisors: ["Gallagher"],
      effect: "Penacony faction buff; can be paired with Break (achievement asks to activate Break + Planet of Festivities together).",
      thresholds: [2, 4, 6],
      implemented: false,
      provenance: "documented"
    },
    {
      id: "stellaron_hunters",
      name: "Stellaron Hunters",
      type: "faction",
      members: ["Kafka", "Mortenax Blade", "Silver Wolf LV.999", "Firefly"],
      advisors: ["Blade", "Silver Wolf"],
      effect: "The most-equipped Hunter becomes the \"STAR HUNTER\"; the other Hunters assist via coordinated attacks. E.g. when Firefly is Star Hunter, after enough Hunter attacks she immediately fires her Ultimate (\"Supernova Overload\").",
      thresholds: [2, 4],
      implemented: false,
      provenance: "documented"
    },
    {
      id: "holy_grail",
      name: "Holy Grail of Destiny",
      type: "faction",
      members: ["Rin Tohsaka", "Gilgamesh", "Saber", "Archer"],
      advisors: [],
      effect: "On Bond-level-up, perform a \"Holy Grail Wish\" - the Grail offers two random wish missions; complete one for rewards: Destiny Components (e.g. \"Avalon\", \"Enuma Elish\"), Gold Coins, Emblems. Equipment such as the Jewel Sword, Enuma Elish, Avalon massively buff Fate units. (Before the collab went live, provided temporary team buffs only.)",
      thresholds: [2, 4],
      implemented: false,
      provenance: "documented"
    },
    {
      id: "galaxy_ranger",
      name: "Galaxy Ranger",
      type: "faction",
      members: ["Rappa", "Ashveil", "Acheron", "Boothill"],
      advisors: [],
      effect: "faction buff; small member pool (good for early/easy bond-link).",
      thresholds: [2, 4],
      implemented: false,
      provenance: "documented"
    },
    {
      id: "ipc",
      name: "IPC",
      type: "faction",
      members: ["Jade", "Aventurine", "Topaz & Numby"],
      advisors: [],
      effect: "faction buff; small member pool.",
      thresholds: [2, 3],
      implemented: false,
      provenance: "documented"
    },
    {
      id: "break",
      name: "Break",
      type: "school",
      members: ["Rappa", "The Dahlia", "Lingsha", "Ruan Mei", "Fugue", "Boothill", "Firefly"],
      advisors: ["Gallagher", "Himeko"],
      effect: "Increases Break members' On/Off-Field Strength; when attacking a Weakness-Broken enemy, deal SUPER BREAK DMG; lowers enemy initial Toughness and Toughness regen. Strong but heavily item-dependent (Firefly is the 5-cost capstone; Fugue is the \"double bar\" enabler).",
      thresholds: [2, 4, 6],
      implemented: true,
      combat: { breakEffectPerLevel: 0.10, superBreakMaxHpPctPerLevel: 0.01 },
      provenance: "placeholder"
    },
    {
      id: "follow_up",
      name: "Follow-Up ATK",
      type: "school",
      members: ["Feixiao", "Cipher", "Aventurine", "Ashveil", "Dr. Ratio", "Robin", "Topaz & Numby"],
      advisors: ["Moze"],
      effect: "Members can trigger \"UNIFIED ATTACK\" after multiple consecutive actions, dealing True DMG based on accumulated Follow-Up DMG. High ceiling, low floor at high difficulty.",
      thresholds: [2, 4, 6],
      implemented: true,
      combat: { followUpDmgPctPerLevel: 0.10 },
      provenance: "placeholder"
    },
    {
      id: "energy",
      name: "Energy",
      type: "school",
      members: ["Huohuo", "Aglaea", "Gilgamesh", "Saber", "Sunday", "Yunli", "Destruction Trailblazer", "Preservation Trailblazer", "Harmony Trailblazer", "Remembrance Trailblazer", "Elation Trailblazer"],
      advisors: ["Tingyun"],
      effect: "Regenerates Energy; the bond itself deals damage based on Energy consumed at higher thresholds (5/7). Core to the Aglaea \"wheelchair\" comp (Aglaea is the engine). Mid-game damage spike.",
      thresholds: [2, 4, 6],
      implemented: true,
      combat: { startEnergyPerLevel: 5, energyGainPctPerLevel: 0.05 },
      provenance: "placeholder"
    },
    {
      id: "aoe_atk",
      name: "AoE ATK",
      type: "school",
      members: ["Herta", "Jade", "Argenti", "Tribbie", "Anaxa", "The Herta", "Jing Yuan"],
      advisors: [],
      effect: "AoE-oriented buffs/amplification for multi-target damage.",
      thresholds: [2, 4],
      implemented: false,
      provenance: "documented"
    },
    {
      id: "bloodflame",
      name: "Bloodflame",
      type: "school",
      members: ["Mydei", "Hyacine", "Mortenax Blade", "Jingliu", "Castorice", "Evernight", "Bronya"],
      advisors: ["Blade"],
      effect: "Based on HP consumed by Bloodflame members, increases damage dealt and activates \"BLOODFLAME ARENA\" to attack all enemies. Castorice is the main DPS; pairs with Heal.",
      thresholds: [2, 4, 6],
      implemented: false,
      provenance: "documented"
    },
    {
      id: "elation",
      name: "Elation",
      type: "school",
      members: ["Yao Guang", "Evanescia", "Silver Wolf LV.999", "Sparxie", "Elation Trailblazer"],
      advisors: [],
      effect: "Elation-based stacking (Aha Instant / Punchline engine); Silver Wolf Lv.999 + Yao Guang core.",
      thresholds: [2, 4],
      implemented: false,
      provenance: "documented"
    },
    {
      id: "debuff",
      name: "Debuff",
      type: "school",
      members: ["Jiaoqiu", "Cipher", "Mortenax Blade", "Acheron", "Yanqing", "Welt"],
      advisors: ["Pela"],
      effect: "Applies layered debuffs; scales well all game. Acheron is the anchor; Mortenax Blade powers debuff/DoT. Often needs Emblems and is countered by cleanse environments.",
      thresholds: [2, 4, 6],
      implemented: false,
      provenance: "documented"
    },
    {
      id: "skill_points",
      name: "Skill Points",
      type: "school",
      members: ["Rin Tohsaka", "Dan Heng \u2022 Imbibitor Lunae", "Sparkle", "Cerydra", "Sparxie", "Archer"],
      advisors: ["Qingque"],
      effect: "Raises ally max Skill Points; when SP-bond members spend SP they \"draw for a prize\" - chance of DMG Boost, SP restore, immediate action, etc. Very strong (S-tier) with Sparkle/Imbibitor Lunae. Also SP-inducing equipment (e.g. \"Momentum Edge\") is key.",
      thresholds: [2, 4],
      implemented: false,
      provenance: "documented"
    },
    {
      id: "dot",
      name: "DoT",
      type: "school",
      members: ["Asta", "Jiaoqiu", "Kafka", "Hysilens", "Black Swan"],
      advisors: ["Sampo"],
      effect: "Amplifies DoT; when an enemy acts, applies \"Super Excitation\" that deals DoT and triggers more DoT on affected enemies. Strong early, KPIs into a safe high-difficulty line; Kafka is the engine, Hysilens is the near-mandatory anchor. Counters: cleanse/purification.",
      thresholds: [2, 4, 6],
      implemented: true,
      combat: { dotDmgPctPerLevel: 0.10 },
      provenance: "placeholder"
    },
    {
      id: "quantum_resonance",
      name: "Quantum Resonance",
      type: "school",
      members: ["Sparkle", "Tribbie", "Seele", "Fu Xuan"],
      advisors: ["Silver Wolf"],
      effect: "Quantum-focused buffs (e.g. \"Synchronized Frequency\" ramps enemy DMG taken). Easy to set up; strong with SP synergy.",
      thresholds: [2, 3],
      implemented: false,
      provenance: "documented"
    },
    {
      id: "heal",
      name: "Heal",
      type: "school",
      members: ["Huohuo", "Lingsha", "Hyacine", "Natasha", "Luocha", "Fu Xuan"],
      advisors: ["Gallagher"],
      effect: "Healing-based bond (utility/sustain; historically low damage value).",
      thresholds: [2, 4, 6],
      implemented: true,
      combat: { healPctPerLevel: 0.10 },
      provenance: "placeholder"
    },
    {
      id: "shield",
      name: "Shield",
      type: "school",
      members: ["The Hunt March 7th", "Aventurine", "Dan Heng \u2022 Permansor Terrae", "Gepard"],
      advisors: [],
      effect: "Shield synergy; pairs with counter/shield-based builds (e.g. a Phainon shield-counter line).",
      thresholds: [2, 4],
      implemented: true,
      combat: { shieldPctPerLevel: 0.10 },
      provenance: "placeholder"
    }
  ];

  var independentBonds = [
    { id: "navigator", name: "Navigator", owner: "Himeko \u2022 Nova", effect: "\"Navigator\" - Himeko • Nova (copies an Express member's School Bond)." },
    { id: "deliverer", name: "Deliverer / Savior", owner: "Phainon", effect: "\"Deliverer\" / \"Savior\" - Phainon (his own scaling/buff kit)." },
    { id: "destiny_diviner", name: "Destiny Diviner", owner: "Black Swan", effect: "\"Destiny Diviner\" - Black Swan (divination-card enhancements)." },
    { id: "beloved_one", name: "Beloved One / Supreme Guardian / Tutelar", owner: "Bronya (and others)", effect: "\"Beloved One\", \"Supreme Guardian\", \"Tutelar\" - additional solo bonds documented for specific characters (e.g. Bronya has two Bond forms). (Names/availability vary by patch; verify in-game.)" }
  ];

  var costRoster = {
    5: ["Topaz & Numby", "Jing Yuan", "Yunli", "Firefly", "Cyrene", "Bronya", "Welt", "Archer", "Black Swan"],
    4: ["Gepard", "Luocha", "Fu Xuan", "Yanqing", "Robin", "Boothill", "The Herta", "Castorice", "Evernight", "Remembrance Trailblazer", "Hysilens", "Sparxie", "Silver Wolf"],
    3: ["Saber", "Seele", "Natasha", "Jingliu", "Fugue", "Dr. Ratio", "Acheron", "Sunday", "Anaxa", "Cerydra", "Phainon", "Himeko \u2022 Nova", "Silver Wolf LV.999", "Himeko"],
    2: ["Kafka", "Dan Heng \u2022 Imbibitor Lunae", "Lingsha", "Argenti", "Ruan Mei", "Aventurine", "Sparkle", "Tribbie", "Hyacine", "Dan Heng \u2022 Permansor Terrae", "Ashveil", "Mortenax Blade", "Evanescia", "Gilgamesh", "Pela"],
    1: ["Herta", "Huohuo", "Jiaoqiu", "Feixiao", "Jade", "Rappa", "The Dahlia", "Aglaea", "Mydei", "Cipher", "Yao Guang", "Rin Tohsaka", "The Hunt March 7th", "Asta", "Sampo", "Qingque", "Tingyun", "Blade", "Moze", "Gallagher"]
  };

  var empowerments = {
    "Firefly": "gains a powerful boss move; the Break 5-cost anchor.",
    "Jing Yuan": "\"two characters in a trenchcoat\" - anchors the Xianzhou Lightning-Lord synergy.",
    "Himeko \u2022 Nova": "picks another Express Cohort character, GAINS that character's School Bond and their first Equipment effect; the summoned \"Astral Express\"/\"Light Rail\" changes based on the chosen character. Key enabler for Express comps.",
    "Rin Tohsaka": "on-field builds \"Gem Energy\" then Joint Follow-Up with Archer; consumes Gem Energy to boost allies' CRIT DMG.",
    "Gilgamesh": "increases all allies' Lucky Strike DMG based on squad equipment count; off-field enhanced state attacks all enemies.",
    "Evanescia": "Aha Instant / Punchline engine.",
    "Aglaea": "converts SPD into ATK/Strength; the premier \"wheelchair\" carry when stacked with Anti-Grav Boots + Light Speed Propeller.",
    "Mortenax Blade": "forges temporary equipment pre-combat; deploys a Zone on entry; whole team's attacks can trigger his extra Skill.",
    "Herta": "off-field follow-up scaling with kills (see 3.4).",
    "Qingque": "repeat-skill spam with temp SP.",
    "Natasha": "ally damage amplification.",
    "Tribbie": "on-field can Ult manually; off-field Ults at start of combat and follows up periodically.",
    "Jade": "off-field unlocks \"Debt Collector\" (synergizes with Herta on-field)."
  };

  var basicEquipment = [
    { id: "roller_skates", name: "Roller Skates", stat: "SPD Amplification", value: "+5%", text: "SPD Amplification: +5%", combat: { spdPct: 0.05 }, provenance: "documented" },
    { id: "folding_knife", name: "Folding Knife", stat: "On-Field Strength", value: "+10%", text: "On-Field Strength: +10%", combat: { onFieldDmgPct: 0.10 }, provenance: "documented" },
    { id: "peace_pistol", name: "Peace Pistol", stat: "Off-Field Strength", value: "+10%", text: "Off-Field Strength: +10%", combat: { offFieldDmgPct: 0.10 }, provenance: "documented" },
    { id: "lucky_star", name: "Lucky Star", stat: "Lucky Strike Rate", value: "+5%", text: "Lucky Strike Rate: +5%", combat: { luckyRate: 0.05 }, provenance: "documented" },
    { id: "flower_of_life", name: "Flower of Life", stat: "HP Amplification", value: "+5%", text: "HP Amplification: +5%", combat: { hpPct: 0.05 }, provenance: "documented" },
    { id: "batch_armor", name: "Batch Produced Armor", stat: "DMG Mitigation", value: "+5%", text: "DMG Mitigation: +5%", combat: { dmgReduction: 0.05 }, provenance: "documented" },
    { id: "aether_drill", name: "Aether Drill", stat: "Break Efficiency", value: "+10%", text: "Break Efficiency: +10%", combat: { breakEfficiency: 0.10 }, provenance: "documented" },
    { id: "photon_cell", name: "Photon Cell", stat: "Initial Energy", value: "+15", text: "Initial Energy: +15", combat: { initialEnergy: 15 }, provenance: "documented" }
  ];

  var advancedEquipment = [
    { id: "chainsaw", name: "High-frequency Chainsaw", recipe: "Folding Knife + Lucky Star", effect: "big Lucky Strike for on-field units" },
    { id: "analgesia_chip", name: "Analgesia Chip", recipe: "Flower of Life + Batch Produced Armor", effect: "heal target takes reduced DMG" },
    { id: "anti_grav_boots", name: "Anti-Grav Boots", recipe: "Upgraded Roller Skates", effect: "stacks SPD (core Aglaea item)" },
    { id: "ring_of_life", name: "Ring of Life", recipe: "Flower of Life + Flower of Life", effect: "" },
    { id: "wormhole_drill", name: "Wormhole Drill", recipe: "Aether Drill + Aether Drill", effect: "Break Efficiency" },
    { id: "perpetual_engine", name: "Perpetual Engine", recipe: "Photon Cell + Photon Cell", effect: "energy" },
    { id: "decapitation", name: "Decapitation", recipe: "", effect: "" },
    { id: "confidence_injector", name: "Confidence Injector", recipe: "", effect: "" },
    { id: "molecular_solvent", name: "Molecular Solvent", recipe: "", effect: "" },
    { id: "victory_banner", name: "Victory Banner", recipe: "", effect: "" }
  ];

  var specialEquipment = [
    { id: "privileged", name: "Privileged Equipment", effect: "enhanced version of advanced equipment (same name), stronger stats + effect. Upgrade via \"Special Privilege Card\"." },
    { id: "emblem", name: "Bond Emblem", effect: "Bond Emblem equipment; equipping on a non-bond unit adds them to that Bond (gains the buff + counts toward the Bond count). Crafted from Red/Blue Gems + basic equipment." },
    { id: "gems", name: "Red Gem / Blue Gem", effect: "RED GEM / BLUE GEM - rare synthesis mats. Combine gems to make Bond Emblems, or combine 2 gems -> a WEALTH GEM." },
    { id: "wealth_gem", name: "Wealth Gem", effect: "very rare; increases team size limit by +1; while equipped also grants Gold Coins over time." }
  ];

  var consumables = [
    { id: "disassembly_wrench", name: "Disassembly Wrench", effect: "remove all gear from a character (single use; a \"Precision\" version is infinite)." },
    { id: "smelting_furnace", name: "Smelting Furnace", effect: "transform a piece of gear into a random piece of the same type." },
    { id: "staff_projector", name: "Staff Projector", effect: "copy a 3-cost-or-lower character (1-star) into prep. (\"Perfect Projector\" copies any character.)" },
    { id: "good_fortune_token", name: "Good Fortune Token", effect: "choose 1 of the 4 recommended advanced equipment for a character." },
    { id: "privilege_card", name: "Special Privilege Card", effect: "upgrade an advanced equipment into its privileged version (or upgrade one already worn)." }
  ];

  var environmentIndexFunds = [
    "Energy", "Day Demigod", "Xianzhou", "Wolf Hunt", "Follow-Up ATK",
    "Bloodflame", "Express Cohort", "Cosmic Scholar", "Belobog",
    "Galactic Voyager", "Night Demigod", "Break", "AoE ATK", "Debuff"
  ];

  var environmentInvitations = [
    "Express Cohort", "Break", "Energy", "DoT", "Quantum Resonance", "Skill Points"
  ];

  var environments = [
    { id: "long_term_gains", name: "Long-Term Gains", category: "Economy", effect: "roughly halves shop refresh cost - good in all scenarios", run: { refreshCostOverride: 1 }, implemented: true, provenance: "documented" },
    { id: "economic_overheat", name: "Economic Overheat / Hyperheat", category: "Economy", effect: "ton of rewards", run: { nodeGoldBonus: 2 }, implemented: true, provenance: "placeholder" },
    { id: "the_sunken_area", name: "The Sunken Area", category: "Economy", effect: "extra gold", run: { startGoldBonus: 8 }, implemented: true, provenance: "placeholder" },
    { id: "downward_mobility", name: "Downward Mobility of Talent", category: "Talent / Shop", effect: "shop can sell 2-star units", run: { twoStarChance: 0.10 }, implemented: true, provenance: "documented" },
    { id: "job_rotation", name: "Job Rotation", category: "Talent / Shop", effect: "", implemented: false, provenance: "documented" },
    { id: "secondhand_market", name: "Secondhand Market", category: "Talent / Shop", effect: "", run: { shopCostReduction: 1 }, implemented: true, provenance: "placeholder" },
    { id: "download_mobility", name: "Download Mobility of Talent", category: "Talent / Shop", effect: "", implemented: false, provenance: "documented" },
    { id: "dot_contract", name: "DoT Contract", category: "Contract", effect: "", implemented: false, provenance: "documented" },
    { id: "skill_point_contract", name: "Skill Point Contract", category: "Contract", effect: "repeatedly grants Dan Heng • Imbibitor Lunae, Sparkle, Sparxie for free", implemented: false, provenance: "documented" },
    { id: "stellaron_contract", name: "Stellaron Hunter Contract", category: "Contract", effect: "", implemented: false, provenance: "documented" },
    { id: "special_guest_sampo", name: "Special Guest Expert: Sampo", category: "Special Guest Expert", effect: "adds Expert Advisor Sampo to the store; each new node Sampo brings a gift; higher Sampo star = better gift", implemented: false, provenance: "documented" },
    { id: "grail_invitation", name: "Invitation to Holy Grail of Destiny", category: "Holy Grail", effect: "grants a Grail Emblem", implemented: false, provenance: "documented" },
    { id: "grail_contract", name: "Contract of Holy Grail of Destiny", category: "Holy Grail", effect: "grants Rin Tohsaka + Gilgamesh, then Archer after 2 Grail rewards", implemented: false, provenance: "documented" },
    { id: "quantum_environment", name: "Quantum Environment (SP / Quantum special)", category: "Special", effect: "grants Fu Xuan/Seele when you level Sparkle/Tribbie (acts as a gold source too)", implemented: false, provenance: "documented" },
    { id: "rainbow_age", name: "The Rainbow Age", category: "Age", effect: "All your Investment Strategies this run become PRISMATIC quality - higher risk (enemies scale up), used for high-roll/flexible play.", run: { strategyRarity: "prismatic", difficultyBonus: 1 }, implemented: true, provenance: "documented" },
    { id: "gold_age", name: "Gold Age", category: "Age", effect: "All strategies become GOLD.", run: { strategyRarity: "gold" }, implemented: true, provenance: "documented" },
    { id: "silver_age", name: "Silver Age", category: "Age", effect: "All strategies become SILVER and (importantly) picking high-quality strategies no longer raises enemy difficulty - considered very strong for STABLE clears.", run: { strategyRarity: "silver", difficultyBonus: 0 }, implemented: true, provenance: "documented" }
  ];

  var strategies = [
    { id: "investment_level_up", name: "Investment Level Up", rarity: "", effect: "raises the quality of your next Strategy by 1.", implemented: false, provenance: "documented" },
    { id: "its_a_wrap", name: "It's A Wrap", rarity: "Prismatic", effect: "disables all protagonists' \"Plot Armor\", gain equal swaps.", implemented: false, provenance: "documented" },
    { id: "intern_development", name: "Intern Development Plan", rarity: "", effect: "gain Intern Projector; increases 1-cost characters' On/Off-Field Strength.", implemented: false, provenance: "documented" },
    { id: "twin_stars", name: "Gift of Twin Stars", rarity: "", effect: "obtain 2 random Emblems.", implemented: false, provenance: "documented" },
    { id: "talent_bundle", name: "Talent Bundle", rarity: "", effect: "guaranteed 3-cost / 4-cost character among gold handouts.", implemented: false, provenance: "documented" },
    { id: "talent_bundle_plus", name: "Talent Bundle+", rarity: "", effect: "guaranteed 3-cost / 4-cost character among gold handouts.", implemented: false, provenance: "documented" },
    { id: "gold_investment", name: "Gold Investment", rarity: "Gold", effect: "immediately choose one of three GOLD strategies, with 3 refreshes (extra refresh after 3 nodes).", implemented: false, provenance: "documented" },
    { id: "silver_investment", name: "Silver Investment", rarity: "Silver", effect: "choose one of three Silver/non-refreshable/... Strategies after several nodes.", implemented: false, provenance: "documented" },
    { id: "prismatic_futures", name: "Prismatic Futures", rarity: "Prismatic", effect: "choose one of three Silver/non-refreshable/... Strategies after several nodes.", implemented: false, provenance: "documented" },
    { id: "gold_futures", name: "Gold Futures", rarity: "Gold", effect: "choose one of three Silver/non-refreshable/... Strategies after several nodes.", implemented: false, provenance: "documented" },
    { id: "surplus_value", name: "Surplus Value", rarity: "", effect: "gain +1 Gold per 30 remaining Action Value at finalization (up to 4).", run: { surplusValue: true }, implemented: true, provenance: "documented" },
    { id: "special_ops_fund", name: "Special Ops Fund", rarity: "", effect: "gain 7 Gold when entering a node (economy).", run: { goldPerNode: 7 }, implemented: true, provenance: "documented" },
    { id: "struggle_protocol", name: "Struggle Protocol", rarity: "", effect: "buying EXP costs 6 Squad HP instead of Gold; restores 50 HP after boss fights (economy/sustain hybrid).", run: { xpCostHp: 6, bossHeal: 50 }, implemented: true, provenance: "documented" },
    { id: "scale_management", name: "Scale Management", rarity: "", effect: "raises max level cap and grants Wealth Gem + 40 Gold.", run: { goldOnPick: 40, maxLevelBonus: 1 }, implemented: true, provenance: "documented" },
    { id: "volley_of_arrows", name: "Volley of Arrows", rarity: "", effect: "fires Wind arrows = squad total stars + X, each dealing Wind DMG (damage scaling).", implemented: false, provenance: "documented" },
    { id: "massive_layoffs", name: "Massive Layoffs", rarity: "", effect: "sell all on-field/prep characters for double Gold; gain free refreshes.", implemented: false, provenance: "documented" },
    { id: "empty_stock", name: "Empty Stock", rarity: "", effect: "gain basic equipment + EXP under conditions.", implemented: false, provenance: "documented" },
    { id: "asta_hellhound", name: "Asta's Hellhound!", rarity: "Gold", effect: "obtain a \"Peppy\" with \"Gáe Bolg\".", implemented: false, provenance: "documented" },
    { id: "furbosin_village", name: "Mystery of Furbosin Village", rarity: "", effect: "grant \"furbo\" units/emblems (Wolf Hunt themed).", implemented: false, provenance: "documented" },
    { id: "furbo_cedures", name: "Resignation Furbo-cedures", rarity: "", effect: "grant \"furbo\" units/emblems (Wolf Hunt themed).", implemented: false, provenance: "documented" },
    { id: "qingque_expert", name: "Celestial Jade Expert: Qingque", rarity: "Prismatic", effect: "grants an Expert Advisor Qingque with 3 random Emblems and puts her in the store for the run.", implemented: false, provenance: "documented" },
    { id: "tingyun_expert", name: "Trading Expert: Tingyun", rarity: "", effect: "grant Expert Advisors.", implemented: false, provenance: "documented" },
    { id: "gallagher_expert", name: "Expert Drinksmith: Gallagher", rarity: "", effect: "grant Expert Advisors.", implemented: false, provenance: "documented" },
    { id: "advisor_gallagher", name: "Advisor Gallagher", rarity: "", effect: "grant Expert Advisors.", implemented: false, provenance: "documented" },
    { id: "advisor_tingyun", name: "Advisor Tingyun", rarity: "", effect: "grant Expert Advisors.", implemented: false, provenance: "documented" },
    { id: "call_an_expert", name: "Call an Expert: Gold / Prismatic", rarity: "Gold / Prismatic", effect: "grant Expert Advisors.", implemented: false, provenance: "documented" },
    { id: "fusion_summon", name: "Fusion Summon", rarity: "", effect: "", implemented: false, provenance: "documented" },
    { id: "complete_disassembly", name: "Complete Disassembly", rarity: "", effect: "", implemented: false, provenance: "documented" },
    { id: "perfect_evolution", name: "Perfect Evolution", rarity: "", effect: "", implemented: false, provenance: "documented" },
    { id: "rise_above_all", name: "Rise Above All", rarity: "", effect: "", implemented: false, provenance: "documented" },
    { id: "dominating_stats", name: "Dominating Stats", rarity: "", effect: "", implemented: false, provenance: "documented" },
    { id: "endless_cycles", name: "Endless Cycles", rarity: "", effect: "", implemented: false, provenance: "documented" },
    { id: "precise_demolition", name: "Precise Demolition", rarity: "", effect: "", implemented: false, provenance: "documented" },
    { id: "taking_it_easy", name: "Taking It Easy I / II / III", rarity: "", effect: "", implemented: false, provenance: "documented" },
    { id: "fortunes_favor", name: "Fortune's Favor", rarity: "", effect: "", implemented: false, provenance: "documented" },
    { id: "divine_aid", name: "Divine Aid", rarity: "", effect: "", implemented: false, provenance: "documented" },
    { id: "liquidate", name: "Liquidate", rarity: "", effect: "", implemented: false, provenance: "documented" },
    { id: "quid_pro_quo", name: "Quid Pro Quo", rarity: "", effect: "", implemented: false, provenance: "documented" },
    { id: "want_it_all", name: "I Want It ALL: Silver / Gold / Prismatic", rarity: "Silver / Gold / Prismatic", effect: "", implemented: false, provenance: "documented" },
    { id: "lucky", name: "Lucky...", rarity: "", effect: "", implemented: false, provenance: "documented" }
  ];

  var enemies = {
    debtCollector: {
      id: "debtCollector",
      name: "Debt Collector",
      initials: "DC",
      hp: 2400,
      atk: 200,
      def: 250,
      spd: 95,
      toughness: 40,
      weakness: ["Lightning"],
      basic: { name: "Foreclosure", multiplier: 1.0, targets: 1 },
      provenance: "placeholder"
    },
    ipcEnforcer: {
      id: "ipcEnforcer",
      name: "IPC Enforcer",
      initials: "IE",
      hp: 3600,
      atk: 230,
      def: 320,
      spd: 101,
      toughness: 60,
      weakness: ["Fire", "Imaginary"],
      basic: { name: "Asset Seizure", multiplier: 1.0, targets: 1 },
      skill: { name: "Margin Call", multiplier: 1.4, targets: "all", every: 3 },
      provenance: "placeholder"
    },
    rivalBroker: {
      id: "rivalBroker",
      name: "Rival Broker",
      initials: "RB",
      hp: 4200,
      atk: 245,
      def: 300,
      spd: 104,
      toughness: 70,
      weakness: ["Quantum", "Wind"],
      basic: { name: "Hostile Bid", multiplier: 1.05, targets: 1 },
      skill: { name: "Short Sell", multiplier: 1.2, targets: 1, every: 2, dot: { type: "Bleed", multiplier: 0.4, turns: 2 } },
      provenance: "placeholder"
    },
    auctionOverseer: {
      id: "auctionOverseer",
      name: "Auction Overseer",
      initials: "AO",
      hp: 12000,
      atk: 340,
      def: 420,
      spd: 108,
      toughness: 100,
      weakness: ["Lightning", "Fire", "Wind"],
      basic: { name: "Gavel Strike", multiplier: 1.15, targets: 1 },
      skill: { name: "Market Collapse", multiplier: 1.6, targets: "all", every: 2 },
      boss: true,
      provenance: "placeholder"
    }
  };

  var run = {
    startGold: 12,
    startSquadHp: 100,
    startLevel: 3,
    maxLevel: 10,
    teamSizePerLevel: true,
    maxOnField: 4,
    maxOffField: 6,
    shopSize: 5,
    refreshCost: 2,
    buyXpCost: 4,
    xpPerBuy: 1,
    interestPer: 10,
    interestMax: 5,
    battleWinXp: 2,
    battleWinGold: 5,
    winStreakGold: 1,
    sellRate: 0.5,
    planes: 3,
    nodesPerPlane: 5,
    nodeSequence: ["reward", "battle", "supply", "encounter", "boss"],
    nodeGold: { reward: 3, battle: 5, supply: 2, encounter: 8, boss: 12 },
    turnLimits: { reward: 1200, battle: 1500, supply: 1200, encounterEasy: 1500, encounterHard: 1200, boss: 1800 },
    encounterHardBonusGold: 6,
    xpToNext: { 3: 2, 4: 4, 5: 6, 6: 8, 7: 10, 8: 12, 9: 14, 10: null },
    shopOdds: {
      1: { 1: 1.00 }, 2: { 1: 1.00 }, 3: { 1: 1.00 },
      4: { 1: 0.65, 2: 0.25, 3: 0.10 },
      5: { 1: 0.45, 2: 0.33, 3: 0.20, 4: 0.02 },
      6: { 1: 0.30, 2: 0.40, 3: 0.25, 4: 0.05 },
      7: { 1: 0.19, 2: 0.30, 3: 0.40, 4: 0.10, 5: 0.01 },
      8: { 1: 0.18, 2: 0.25, 3: 0.32, 4: 0.22, 5: 0.03 },
      9: { 1: 0.15, 2: 0.20, 3: 0.25, 4: 0.30, 5: 0.10 },
      10: { 1: 0.05, 2: 0.10, 3: 0.20, 4: 0.40, 5: 0.25 }
    },
    starMultipliers: { 1: 1, 2: 1.8, 3: 3.2 },
    squadHpLoss: { battle: 12, encounterEasy: 10, encounterHard: 16, boss: 20, reward: 4, supply: 4 },
    rating: [
      { min: 90, grade: "SSS" },
      { min: 75, grade: "SS" },
      { min: 60, grade: "S" },
      { min: 50, grade: "A" },
      { min: 40, grade: "B" },
      { min: 25, grade: "C" },
      { min: 0, grade: "D" }
    ],
    strategyOfferCount: 3,
    environmentOfferCount: 3
  };

  var byId = function (list, id) {
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) {
        return list[i];
      }
    }
    return null;
  };

  return {
    meta: {
      game: "Currency Wars: Zero-Sum Game",
      version: "4.6",
      snapshot: "2026-10-15",
      archivedBy: "CurrencyWarsLegacy",
      provenanceLegend: {
        verified: "Captured from the 4.6 game/Data Bank.",
        documented: "Stated in the 4.6 research snapshot.",
        placeholder: "Remake value, not official. Replace when verified data is available."
      }
    },
    bonds: bonds,
    independentBonds: independentBonds,
    costRoster: costRoster,
    empowerments: empowerments,
    equipment: {
      basic: basicEquipment,
      advanced: advancedEquipment,
      special: specialEquipment,
      consumables: consumables
    },
    environments: environments,
    environmentIndexFunds: environmentIndexFunds,
    environmentInvitations: environmentInvitations,
    strategies: strategies,
    enemies: enemies,
    run: run,
    bondById: function (id) { return byId(bonds, id); },
    environmentById: function (id) { return byId(environments, id); },
    strategyById: function (id) { return byId(strategies, id); },
    equipmentById: function (id) { return byId(basicEquipment, id); }
  };
});
