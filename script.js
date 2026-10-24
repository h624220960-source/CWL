(function () {
  "use strict";

  var STORAGE_KEY = "cwl.username";
  var MAX_USERNAME_LENGTH = 20;

  var yearEl = document.getElementById("year");
  var userBox = document.getElementById("userBox");
  var userGreeting = document.getElementById("userGreeting");
  var changeUserBtn = document.getElementById("changeUser");

  var usernameScreen = document.getElementById("screen-username");
  var modesScreen = document.getElementById("screen-modes");

  var usernameForm = document.getElementById("usernameForm");
  var usernameInput = document.getElementById("usernameInput");
  var usernameError = document.getElementById("usernameError");

  var codexBtn = document.getElementById("codexBtn");
  var codexOverlay = document.getElementById("codexOverlay");
  var codexClose = document.getElementById("codexClose");
  var codexTabs = document.getElementById("codexTabs");
  var codexBody = document.getElementById("codexBody");

  var username = "";
  var selectedMode = null;

  yearEl.textContent = new Date().getFullYear();

  /* ---------------------------------------------------------------------- */
  /* Username + screen flow                                                  */
  /* ---------------------------------------------------------------------- */

  function saveUsername(name) {
    try {
      localStorage.setItem(STORAGE_KEY, name);
    } catch (err) {
      /* storage unavailable (private mode) - session only */
    }
  }

  function loadUsername() {
    try {
      return localStorage.getItem(STORAGE_KEY) || "";
    } catch (err) {
      return "";
    }
  }

  function showScreen(target) {
    if (typeof target === "string") {
      target = document.getElementById(target);
    }
    var all = document.querySelectorAll(".screen");
    Array.prototype.forEach.call(all, function (screen) {
      screen.hidden = screen !== target;
    });
    closeCodex();
  }

  function setUser(name) {
    username = name;
    userGreeting.textContent = name;
    userBox.hidden = false;
  }

  function gotoModes() {
    setUser(username);
    showScreen(modesScreen);
  }

  function gotoUsername() {
    selectedMode = null;
    userBox.hidden = true;
    usernameInput.value = username;
    clearError();
    showScreen(usernameScreen);
    usernameInput.focus();
  }

  function clearError() {
    usernameError.hidden = true;
    usernameError.textContent = "";
    usernameInput.classList.remove("invalid");
  }

  function showError(message) {
    usernameError.textContent = message;
    usernameError.hidden = false;
    usernameInput.classList.add("invalid");
  }

  function handleUsernameSubmit(event) {
    event.preventDefault();
    var name = usernameInput.value.trim();

    if (name.length === 0) {
      showError("Please enter a username.");
      return;
    }
    if (name.length > MAX_USERNAME_LENGTH) {
      showError("Username must be " + MAX_USERNAME_LENGTH + " characters or fewer.");
      return;
    }

    clearError();
    username = name;
    saveUsername(name);
    gotoModes();
  }

  function handleModeSelect(event) {
    var card = event.currentTarget;
    selectedMode = card.getAttribute("data-mode");

    var cards = modesScreen.querySelectorAll(".mode-card:not(.locked)");
    Array.prototype.forEach.call(cards, function (c) {
      c.classList.remove("selected");
    });
    card.classList.add("selected");

    startMode(selectedMode);
  }

  function startMode(mode) {
    if (mode === "battle" && window.CWBattle) {
      window.CWBattle.open();
      return;
    }
    if (mode === "lab" && window.CWLab) {
      window.CWLab.open();
      return;
    }
    console.log("Starting mode: " + mode + " for user: " + username);
    window.alert("This mode is not implemented yet.");
  }

  /* ---------------------------------------------------------------------- */
  /* Itinerary (codex)                                                       */
  /* ---------------------------------------------------------------------- */
  /*
   * Everything in the codex is data-driven: each character, bond, piece of
   * equipment and investment is a collapsed "slot" that expands on click to
   * reveal its in-game description.
   */

  /* Cost / rarity colour key: 1 grey ... 5 gold */
  var COST_LABEL = { 1: "1-cost", 2: "2-cost", 3: "3-cost", 4: "4-cost", 5: "5-cost" };

  /* ---- Bonds ------------------------------------------------------------ */

  var FACTION_BONDS = [
    {
      name: "Xianzhou",
      members: ["Yao Guang", "Huohuo", "Dan Heng \u2022 Imbibitor Lunae", "Fugue", "Fu Xuan", "Yanqing", "Jing Yuan"],
      advisors: ["Qingque", "Tingyun"],
      effect: "Summons the LIGHTNING-LORD; when it acts it attacks ALL enemies (AoE). Bond level scales the Lightning-Lord's power. One of the strongest factions (largest member pool, strong early AoE; needs 10 for the top tier)."
    },
    {
      name: "Wolf Hunt",
      members: ["Jiaoqiu", "Feixiao", "Lingsha", "Jingliu", "Yanqing", "Yunli"],
      advisors: ["Moze"],
      effect: "Summons BORISIN to fight; it gains EXP in combat, evolves into different attack forms and buffs allies. Reaching the top 'Hoolay' / 'Crimson Moon: Lupine Prime Divine' evolution needs enough units / Emblems. RNG- and item-dependent."
    },
    {
      name: "Night Demigod",
      members: ["Mydei", "Cipher", "Dan Heng \u2022 Permansor Terrae", "Cerydra", "Castorice", "Evernight", "Cyrene"],
      advisors: [],
      effect: "Amphoreus demigod faction; provides team buffs tied to member count (bond level)."
    },
    {
      name: "Day Demigod",
      members: ["Aglaea", "Tribbie", "Hyacine", "Anaxa", "Hysilens", "Cyrene"],
      advisors: [],
      effect: "Grants SPD Amplification and access to the 'Day: Light Speed Propeller' (increases DMG based on SPD). Core to the Aglaea comp."
    },
    {
      name: "Belobog",
      members: ["Seele", "Natasha", "Gepard", "Bronya"],
      advisors: ["Sampo", "Pela"],
      effect: "Summons / empowers allies; considered strong (Seele carries). Tiers were adjusted in a later patch alongside Break."
    },
    {
      name: "Express Cohort",
      members: ["The Hunt March 7th", "Dan Heng \u2022 Imbibitor Lunae", "Sunday", "Himeko \u2022 Nova", "Destruction Trailblazer", "Preservation Trailblazer", "Harmony Trailblazer", "Remembrance Trailblazer", "Elation Trailblazer", "Welt"],
      advisors: ["Himeko"],
      effect: "Summons the 'Astral Express' / 'Light Rail' for additional damage / support; strength scales with member count. Himeko \u2022 Nova's 'Navigator' independent bond lets her copy another Express member's School Bond."
    },
    {
      name: "Cosmic Scholar",
      members: ["Asta", "Herta", "Ruan Mei", "Dr. Ratio", "The Herta"],
      advisors: [],
      effect: "Stacks 'CAKE CATS' based on the star level of Cosmic Scholar members; bonus rewards scale with stack count (economy / scaling bond)."
    },
    {
      name: "Galactic Voyager",
      members: ["Argenti", "Evanescia", "Dr. Ratio", "Luocha", "Sparxie", "Welt"],
      advisors: ["Sampo"],
      effect: "Faction buff that scales with member count."
    },
    {
      name: "The Planet of Festivities",
      members: ["The Dahlia", "Sparkle", "Sunday", "Robin", "Black Swan"],
      advisors: ["Gallagher"],
      effect: "Penacony faction buff; pairs well with Break (an achievement asks you to activate Break + Planet of Festivities together)."
    },
    {
      name: "Stellaron Hunters",
      members: ["Kafka", "Mortenax Blade", "Silver Wolf LV.999", "Firefly"],
      advisors: ["Blade", "Silver Wolf"],
      effect: "The most-equipped Hunter becomes the 'STAR HUNTER'; the other Hunters assist via coordinated attacks. When Firefly is Star Hunter, after enough Hunter attacks she immediately fires her Ultimate ('Supernova Overload')."
    },
    {
      name: "Holy Grail of Destiny",
      members: ["Rin Tohsaka", "Gilgamesh", "Saber", "Archer"],
      advisors: [],
      effect: "Fate collab. On bond level-up, perform a 'Holy Grail Wish': the Grail offers two random wish missions; completing one grants Destiny Components (e.g. 'Avalon', 'Enuma Elish'), Gold Coins or Emblems. The Jewel Sword, Enuma Elish and Avalon heavily buff Fate units."
    },
    {
      name: "Galaxy Ranger",
      members: ["Rappa", "Ashveil", "Acheron", "Boothill"],
      advisors: [],
      effect: "Faction buff; small member pool (good for an easy early bond-link)."
    },
    {
      name: "IPC",
      members: ["Jade", "Aventurine", "Topaz & Numby"],
      advisors: [],
      effect: "Faction buff; small member pool."
    }
  ];

  var SCHOOL_BONDS = [
    {
      name: "Break",
      members: ["Rappa", "The Dahlia", "Lingsha", "Ruan Mei", "Fugue", "Boothill", "Firefly"],
      advisors: ["Gallagher", "Himeko"],
      effect: "Increases Break members' On/Off-Field Strength; attacking a Weakness-Broken enemy deals SUPER BREAK DMG; lowers enemies' initial Toughness and Toughness regen. Strong but item-dependent (Firefly is the 5-cost capstone; Fugue enables double-bar Break)."
    },
    {
      name: "Follow-Up ATK",
      members: ["Feixiao", "Cipher", "Aventurine", "Ashveil", "Dr. Ratio", "Robin", "Topaz & Numby"],
      advisors: ["Moze"],
      effect: "Members can trigger 'UNIFIED ATTACK' after multiple consecutive actions, dealing True DMG based on accumulated Follow-Up DMG. High ceiling, low floor at high difficulty."
    },
    {
      name: "Energy",
      members: ["Huohuo", "Aglaea", "Gilgamesh", "Saber", "Sunday", "Yunli", "Destruction Trailblazer", "Preservation Trailblazer", "Harmony Trailblazer", "Remembrance Trailblazer", "Elation Trailblazer"],
      advisors: ["Tingyun"],
      effect: "Regenerates Energy; the bond itself deals damage based on Energy consumed at higher thresholds (5 / 7). Core to the Aglaea 'wheelchair' comp (Aglaea is the engine); a mid-game damage spike."
    },
    {
      name: "AoE ATK",
      members: ["Herta", "Jade", "Argenti", "Tribbie", "Anaxa", "The Herta", "Jing Yuan"],
      advisors: [],
      effect: "AoE-oriented buffs / amplification for multi-target damage."
    },
    {
      name: "Bloodflame",
      members: ["Mydei", "Hyacine", "Mortenax Blade", "Jingliu", "Castorice", "Evernight", "Bronya"],
      advisors: ["Blade"],
      effect: "Based on HP consumed by Bloodflame members, increases damage dealt and activates 'BLOODFLAME ARENA' to attack all enemies. Castorice is the main DPS; pairs with Heal."
    },
    {
      name: "Elation",
      members: ["Yao Guang", "Evanescia", "Silver Wolf LV.999", "Sparxie", "Elation Trailblazer"],
      advisors: [],
      effect: "Elation-based stacking (Aha Instant / Punchline engine); Silver Wolf LV.999 + Yao Guang are the core."
    },
    {
      name: "Debuff",
      members: ["Jiaoqiu", "Cipher", "Mortenax Blade", "Acheron", "Yanqing", "Welt"],
      advisors: ["Pela"],
      effect: "Applies layered debuffs; scales well all game. Acheron is the anchor; Mortenax Blade powers debuff / DoT. Often needs Emblems and is countered by cleanse environments."
    },
    {
      name: "Skill Points",
      members: ["Rin Tohsaka", "Dan Heng \u2022 Imbibitor Lunae", "Sparkle", "Cerydra", "Sparxie", "Archer"],
      advisors: ["Qingque"],
      effect: "Raises allies' max Skill Points; when SP-bond members spend SP they 'draw for a prize' (DMG Boost, SP restore, immediate action, etc.). Very strong (S-tier) with Sparkle / Imbibitor Lunae; SP-inducing gear (e.g. 'Momentum Edge') is key."
    },
    {
      name: "DoT",
      members: ["Asta", "Jiaoqiu", "Kafka", "Hysilens", "Black Swan"],
      advisors: ["Sampo"],
      effect: "Amplifies DoT; when an enemy acts it applies 'Super Excitation', dealing DoT and triggering more DoT on affected enemies. Strong early and a safe high-difficulty line; Kafka is the engine, Hysilens the near-mandatory anchor. Countered by cleanse / purification."
    },
    {
      name: "Quantum Resonance",
      members: ["Sparkle", "Tribbie", "Seele", "Fu Xuan"],
      advisors: ["Silver Wolf"],
      effect: "Quantum-focused buffs (e.g. 'Synchronized Frequency' ramps enemy DMG taken). Easy to set up; strong with SP synergy."
    },
    {
      name: "Heal",
      members: ["Huohuo", "Lingsha", "Hyacine", "Natasha", "Luocha", "Fu Xuan"],
      advisors: ["Gallagher"],
      effect: "Healing-based bond (utility / sustain; historically low damage value)."
    },
    {
      name: "Shield",
      members: ["The Hunt March 7th", "Aventurine", "Dan Heng \u2022 Permansor Terrae", "Gepard"],
      advisors: [],
      effect: "Shield synergy; pairs with counter / shield-based builds (e.g. a Phainon shield-counter line)."
    }
  ];

  var INDEPENDENT_BONDS = [
    { name: "Navigator", owner: "Himeko \u2022 Nova", effect: "Picks another Express Cohort character and GAINS that character's School Bond plus their first Equipment effect; the summoned 'Astral Express' / 'Light Rail' changes based on the chosen character. Key enabler for Express comps." },
    { name: "Deliverer / Savior", owner: "Phainon", effect: "Phainon's own scaling / buff kit (reflect / shield-counter carry)." },
    { name: "Destiny Diviner", owner: "Black Swan", effect: "Divination-card enhancements." },
    { name: "Beloved One / Supreme Guardian / Tutelar", owner: "Bronya (and others)", effect: "Additional solo bonds documented for specific characters (e.g. Bronya has two Bond forms). Names / availability vary by patch." }
  ];

  /* ---- Character empowerments (documented) ------------------------------ */

  var EMPOWER = {
    "Firefly": "Gains the SAM boss's 'Supernova Overload'-style move. The Break school's 5-cost capstone and a Stellaron Hunters Star Hunter candidate.",
    "Jing Yuan": "Anchors the Xianzhou LIGHTNING-LORD synergy (the summoned Lightning-Lord attacks all enemies when it acts).",
    "Himeko \u2022 Nova": "Solo 'Navigator' bond: picks another Express Cohort character, gains their School Bond and their first Equipment effect; the summoned Express / Light Rail changes based on the choice.",
    "Rin Tohsaka": "On-field builds 'Gem Energy', then performs a Joint Follow-Up with Archer; consumes Gem Energy to boost allies' CRIT DMG.",
    "Gilgamesh": "Increases all allies' Lucky Strike DMG based on squad equipment count; off-field enhanced state attacks all enemies.",
    "Evanescia": "Aha Instant / Punchline engine for the Elation school.",
    "Aglaea": "Converts SPD into ATK / Strength; the premier carry once stacked with Anti-Grav Boots + Light Speed Propeller.",
    "Mortenax Blade": "Forges temporary equipment pre-combat; deploys a Zone on entry; the whole team's attacks can trigger his extra Skill.",
    "Herta": "Off-field follow-up triggers when any enemy drops below 50% HP, and each use raises ALL allies' damage (scales over a run).",
    "Qingque": "Gets temporary SP and can keep using Skill past Hidden Hand (repeat-skill spam).",
    "Natasha": "Provides damage amplification to allies.",
    "Tribbie": "On-field she can Ult manually; off-field she Ults at the start of combat and follows up periodically.",
    "Jade": "Off-field unlocks 'Debt Collector' (synergizes with Herta on-field)."
  };

  /* ---- Full roster by cost ---------------------------------------------- */

  var COST_ROSTER = {
    5: ["Topaz & Numby", "Jing Yuan", "Yunli", "Firefly", "Cyrene", "Bronya", "Welt", "Archer", "Black Swan"],
    4: ["Gepard", "Luocha", "Fu Xuan", "Yanqing", "Robin", "Boothill", "The Herta", "Castorice", "Evernight", "Remembrance Trailblazer", "Hysilens", "Sparxie", "Silver Wolf"],
    3: ["Saber", "Seele", "Natasha", "Jingliu", "Fugue", "Dr. Ratio", "Acheron", "Sunday", "Anaxa", "Cerydra", "Phainon", "Himeko \u2022 Nova", "Silver Wolf LV.999", "Himeko"],
    2: ["Kafka", "Dan Heng \u2022 Imbibitor Lunae", "Lingsha", "Argenti", "Ruan Mei", "Aventurine", "Sparkle", "Tribbie", "Hyacine", "Dan Heng \u2022 Permansor Terrae", "Ashveil", "Mortenax Blade", "Evanescia", "Gilgamesh", "Pela"],
    1: ["Herta", "Huohuo", "Jiaoqiu", "Feixiao", "Jade", "Rappa", "The Dahlia", "Aglaea", "Mydei", "Cipher", "Yao Guang", "Rin Tohsaka", "The Hunt March 7th", "Asta", "Sampo", "Qingque", "Tingyun", "Blade", "Moze", "Gallagher"]
  };

  /* ---- Equipment -------------------------------------------------------- */

  var BASIC_EQUIPMENT = [
    { name: "Roller Skates", stat: "SPD Amplification", value: "+5%" },
    { name: "Folding Knife", stat: "On-Field Strength", value: "+10%" },
    { name: "Peace Pistol", stat: "Off-Field Strength", value: "+10%" },
    { name: "Lucky Star", stat: "Lucky Strike Rate", value: "+5%" },
    { name: "Flower of Life", stat: "HP Amplification", value: "+5%" },
    { name: "Batch Produced Armor", stat: "DMG Mitigation", value: "+5%" },
    { name: "Aether Drill", stat: "Break Efficiency", value: "+10%" },
    { name: "Photon Cell", stat: "Initial Energy", value: "+15" }
  ];

  var ADVANCED_EQUIPMENT = [
    { name: "High-frequency Chainsaw", recipe: "Folding Knife + Lucky Star", effect: "Big Lucky Strike boost for on-field units." },
    { name: "Analgesia Chip", recipe: "Flower of Life + Batch Produced Armor", effect: "The healed target takes reduced DMG." },
    { name: "Anti-Grav Boots", recipe: "Upgraded Roller Skates", effect: "Stacking SPD; the core Aglaea item." },
    { name: "Ring of Life", recipe: "Flower of Life + Flower of Life", effect: "HP / sustain." },
    { name: "Wormhole Drill", recipe: "Aether Drill + Aether Drill", effect: "Break Efficiency." },
    { name: "Perpetual Engine", recipe: "Photon Cell + Photon Cell", effect: "Energy generation." },
    { name: "Decapitation", recipe: "Advanced synthesis", effect: "Documented advanced equipment (used by Bloodflame Castorice)." },
    { name: "Confidence Injector", recipe: "Advanced synthesis", effect: "Documented advanced equipment." },
    { name: "Molecular Solvent", recipe: "Advanced synthesis", effect: "Documented advanced equipment." },
    { name: "Victory Banner", recipe: "Advanced synthesis", effect: "Documented advanced equipment." }
  ];

  var SPECIAL_EQUIPMENT = [
    { name: "Privileged Equipment", effect: "An enhanced version of an advanced item (same name, stronger stats + effect). Upgrade one with a 'Special Privilege Card'." },
    { name: "Bond Emblem", effect: "Equipping an Emblem on a NON-bond character adds them to that Bond (they gain its buff and count toward the count). Crafted from a Red/Blue Gem + basic equipment." },
    { name: "Red Gem / Blue Gem", effect: "Rare synthesis materials. Combine gems to make Bond Emblems, or combine 2 gems into a Wealth Gem." },
    { name: "Wealth Gem", effect: "Very rare. Increases the team-size limit by +1; while equipped it also grants Gold Coins over time." }
  ];

  var CONSUMABLES = [
    { name: "Disassembly Wrench", effect: "Removes all gear from a character (single use; a 'Precision' version is infinite)." },
    { name: "Smelting Furnace", effect: "Transforms a piece of gear into a random piece of the same type." },
    { name: "Staff Projector", effect: "Copies a 3-cost-or-lower character (1-star) into prep ('Perfect Projector' copies any character)." },
    { name: "Good Fortune Token", effect: "Choose 1 of the 4 recommended advanced equipment for a character." },
    { name: "Special Privilege Card", effect: "Upgrades an advanced equipment into its privileged version (or upgrades one already worn)." }
  ];

  /* ---- Investments ------------------------------------------------------ */

  var ENVIRONMENT_INDEX_FUNDS = [
    "Energy", "Day Demigod", "Xianzhou", "Wolf Hunt", "Follow-Up ATK",
    "Bloodflame", "Express Cohort", "Cosmic Scholar", "Belobog",
    "Galactic Voyager", "Night Demigod", "Break", "AoE ATK", "Debuff"
  ];

  var ENVIRONMENT_INVITATIONS = [
    "Express Cohort", "Break", "Energy", "DoT", "Quantum Resonance", "Skill Points"
  ];

  var ENVIRONMENTS = [
    { name: "Long-Term Gains", category: "Economy", effect: "Roughly halves the shop refresh cost; good in all scenarios." },
    { name: "Economic Overheat / Hyperheat", category: "Economy", effect: "A large amount of rewards over the run." },
    { name: "Destiny's Gift", category: "Economy", effect: "Unlockable before the first boss if you win all nodes; grants a Wealth Gem and more." },
    { name: "The Sunken Area", category: "Economy", effect: "Extra Gold." },
    { name: "Downward Mobility of Talent", category: "Talent / Shop", effect: "The shop can occasionally sell 2-star characters." },
    { name: "Job Rotation", category: "Talent / Shop", effect: "Shop / talent environment." },
    { name: "Secondhand Market", category: "Talent / Shop", effect: "Bargain shop environment (used in the Phainon path)." },
    { name: "Download Mobility of Talent", category: "Talent / Shop", effect: "Shop / talent environment that shifts shop odds." },
    { name: "DoT Contract", category: "Contract", effect: "Contract environment themed around the DoT bond." },
    { name: "Skill Point Contract", category: "Contract", effect: "Repeatedly grants Dan Heng \u2022 Imbibitor Lunae, Sparkle and Sparxie for free." },
    { name: "Stellaron Hunter Contract", category: "Contract", effect: "Contract environment themed around the Stellaron Hunters." },
    { name: "Special Guest Expert: Sampo", category: "Special Guest Expert", effect: "Adds Expert Advisor Sampo to the store; each new node Sampo brings a gift, and a higher Sampo star gives a better gift." },
    { name: "Invitation to Holy Grail of Destiny", category: "Holy Grail", effect: "Grants a Grail Emblem." },
    { name: "Contract of Holy Grail of Destiny", category: "Holy Grail", effect: "Grants Rin Tohsaka + Gilgamesh, then Archer after 2 Grail rewards." },
    { name: "Quantum Environment (SP / Quantum special)", category: "Special", effect: "Grants Fu Xuan / Seele when you level Sparkle / Tribbie; also acts as a Gold source." },
    { name: "The Rainbow Age", category: "Age", effect: "All your Investment Strategies this run become PRISMATIC quality (higher risk, enemies scale up); for high-roll / flexible play." },
    { name: "Gold Age", category: "Age", effect: "All your Investment Strategies this run become GOLD quality." },
    { name: "Silver Age", category: "Age", effect: "All strategies become SILVER and picking high-quality strategies no longer raises enemy difficulty; considered very strong for stable clears." }
  ];

  var STRATEGIES = [
    { name: "Investment Level Up", rarity: "", effect: "Raises the quality of your next Strategy by 1." },
    { name: "It's A Wrap", rarity: "Prismatic", effect: "Disables all protagonists' 'Plot Armor'; gain equal swaps." },
    { name: "Intern Development Plan", rarity: "", effect: "Gain Intern Projector; increases 1-cost characters' On/Off-Field Strength." },
    { name: "Gift of Twin Stars", rarity: "", effect: "Obtain 2 random Emblems." },
    { name: "Talent Bundle", rarity: "", effect: "Guarantees a 3-cost character among gold handouts." },
    { name: "Talent Bundle+", rarity: "", effect: "Guarantees a 4-cost character among gold handouts." },
    { name: "Gold Investment", rarity: "Gold", effect: "Immediately choose one of three GOLD strategies, with 3 refreshes (an extra refresh after 3 nodes)." },
    { name: "Silver Investment", rarity: "Silver", effect: "Choose one of three Silver strategies after several nodes." },
    { name: "Prismatic Futures", rarity: "Prismatic", effect: "A non-refreshable choose-one-of-three after several nodes." },
    { name: "Gold Futures", rarity: "Gold", effect: "A choose-one-of-three after several nodes." },
    { name: "Surplus Value", rarity: "", effect: "Gain +1 Gold per 30 remaining Action Value at finalization (up to 4)." },
    { name: "Special Ops Fund", rarity: "", effect: "Gain 7 Gold when entering a node." },
    { name: "Struggle Protocol", rarity: "", effect: "Buying EXP costs 6 Squad HP instead of Gold; restores 50 HP after boss fights." },
    { name: "Resolution: Planet of Entertainment", rarity: "", effect: "Take double damage; if you hold 180-200 Gold when entering combat, convert the remaining non-boss nodes into Reward nodes and gain 50 Gold." },
    { name: "Scale Management", rarity: "", effect: "Raises the max level cap and grants a Wealth Gem + 40 Gold." },
    { name: "Volley of Arrows", rarity: "", effect: "Fires Wind arrows equal to squad total stars + X, each dealing Wind DMG." },
    { name: "Massive Layoffs", rarity: "", effect: "Sell all on-field / prep characters for double Gold; gain free refreshes." },
    { name: "Empty Stock", rarity: "", effect: "Gain basic equipment + EXP under conditions." },
    { name: "Asta's Hellhound!", rarity: "Gold", effect: "Obtain a 'Peppy' with 'G\u00e1e Bolg'." },
    { name: "Mystery of Furbosin Village", rarity: "", effect: "Grants 'furbo' units / emblems (Wolf Hunt themed)." },
    { name: "Resignation Furbo-cedures", rarity: "", effect: "Grants 'furbo' units / emblems (Wolf Hunt themed)." },
    { name: "Celestial Jade Expert: Qingque", rarity: "Prismatic", effect: "Grants Expert Advisor Qingque with 3 random Emblems, and puts her in the store for the run." },
    { name: "Trading Expert: Tingyun", rarity: "", effect: "Grants Expert Advisor Tingyun." },
    { name: "Expert Drinksmith: Gallagher", rarity: "", effect: "Grants Expert Advisor Gallagher." },
    { name: "Advisor Gallagher", rarity: "", effect: "Grants Expert Advisor Gallagher." },
    { name: "Advisor Tingyun", rarity: "", effect: "Grants Expert Advisor Tingyun." },
    { name: "Call an Expert: Gold / Prismatic", rarity: "Gold / Prismatic", effect: "Grants an Expert Advisor." },
    { name: "Fusion Summon", rarity: "", effect: "Documented strategy (effect not fully detailed in the snapshot)." },
    { name: "Complete Disassembly", rarity: "", effect: "Documented strategy (effect not fully detailed in the snapshot)." },
    { name: "Perfect Evolution", rarity: "", effect: "Documented strategy (effect not fully detailed in the snapshot)." },
    { name: "Rise Above All", rarity: "", effect: "Documented strategy (effect not fully detailed in the snapshot)." },
    { name: "Dominating Stats", rarity: "", effect: "Documented strategy (effect not fully detailed in the snapshot)." },
    { name: "Endless Cycles", rarity: "", effect: "Documented strategy (effect not fully detailed in the snapshot)." },
    { name: "Precise Demolition", rarity: "", effect: "Documented strategy (effect not fully detailed in the snapshot)." },
    { name: "Taking It Easy I / II / III", rarity: "", effect: "Documented strategy (effect not fully detailed in the snapshot)." },
    { name: "Fortune's Favor", rarity: "", effect: "Documented strategy (effect not fully detailed in the snapshot)." },
    { name: "Divine Aid", rarity: "", effect: "Documented strategy (effect not fully detailed in the snapshot)." },
    { name: "Liquidate", rarity: "", effect: "Documented strategy (effect not fully detailed in the snapshot)." },
    { name: "Quid Pro Quo", rarity: "", effect: "Documented strategy (effect not fully detailed in the snapshot)." },
    { name: "I Want It ALL: Silver / Gold / Prismatic", rarity: "Silver / Gold / Prismatic", effect: "Documented strategy (effect not fully detailed in the snapshot)." },
    { name: "Lucky...", rarity: "", effect: "Documented strategy (effect not fully detailed in the snapshot)." }
  ];

  /* ---- Bond lookup ------------------------------------------------------ */

  function bondsFor(name) {
    var out = [];
    var groups = [FACTION_BONDS, SCHOOL_BONDS];
    groups.forEach(function (group) {
      group.forEach(function (bond) {
        if (bond.members.indexOf(name) !== -1 || bond.advisors.indexOf(name) !== -1) {
          out.push(bond.name);
        }
      });
    });
    INDEPENDENT_BONDS.forEach(function (bond) {
      if (bond.owner === name || bond.owner.indexOf(name) !== -1) {
        out.push(bond.name);
      }
    });
    return out;
  }

  /* ---- Slot rendering helpers ------------------------------------------- */

  function slot(title, meta, body) {
    return (
      "<div class='slot'>" +
      "<button type='button' class='slot-head'>" +
      "<span class='slot-title'>" + title + "</span>" +
      (meta ? "<span class='slot-meta'>" + meta + "</span>" : "") +
      "<span class='slot-chevron' aria-hidden='true'></span>" +
      "</button>" +
      "<div class='slot-body' hidden>" + body + "</div>" +
      "</div>"
    );
  }

  function slots(list) {
    return "<div class='slot-list'>" + list.join("") + "</div>";
  }

  function costBadge(cost) {
    return "<span class='cost-badge cost-" + cost + "'>" + COST_LABEL[cost] + "</span>";
  }

  function memberLine(bond) {
    var line = "<p><strong>Members:</strong> " + bond.members.join(", ") + "</p>";
    if (bond.advisors && bond.advisors.length) {
      line += "<p><strong>Expert Advisors:</strong> " + bond.advisors.join(", ") + "</p>";
    }
    return line;
  }

  function rarityTag(rarity) {
    return rarity ? " <span class='rarity-tag'>[" + rarity + "]</span>" : "";
  }

  /* ---- Tabs ------------------------------------------------------------- */

  var CODEX = [
    {
      id: "characters",
      label: "Characters",
      render: function () {
        var order = [5, 4, 3, 2, 1];
        var html = "<h3>Characters</h3>" +
          "<p>Grouped by cost. Click any slot to expand its in-game description. " +
          "Bonds are shown for each character. Cost is colour-coded: " +
          "1 grey &rarr; 5 gold (higher cost = stronger base kit, lower scaling; " +
          "lower cost = higher scaling when starred up).</p>";

        order.forEach(function (cost) {
          html += "<h4>" + COST_LABEL[cost] + " " + new Array(cost + 1).join("\u25c6") + "</h4>";
          var items = COST_ROSTER[cost].map(function (name) {
            var bonds = bondsFor(name);
            var bondStr = bonds.length ? bonds.join(", ") : "None documented";
            var empower = EMPOWER[name] ? "<p>" + EMPOWER[name] + "</p>"
              : "<p>No unique empowerment documented in the snapshot; plays through its base kit and Bond synergies.</p>";
            return slot(name, costBadge(cost),
              "<p><strong>Cost:</strong> " + cost + " (" + COST_LABEL[cost] + ")</p>" +
              "<p><strong>Bonds:</strong> " + bondStr + "</p>" +
              empower);
          });
          html += slots(items);
        });

        html += "<p class='codex-note'>Rosters and costs rotate between updates " +
          "(e.g. Feixiao was demoted to 1-cost; Gallagher, Tingyun and Qingque " +
          "became Expert Advisors). Verify against the in-game Data Bank.</p>";
        return html;
      }
    },
    {
      id: "bonds",
      label: "Bonds",
      render: function () {
        var html = "<h3>Bonds</h3>" +
          "<p>Every character carries Bond tags. Deploy enough characters that " +
          "share a Bond to activate its effect; more members raise the Bond " +
          "level. Click any slot to expand its members and effect.</p>";

        html += "<h4>Faction Bonds</h4>";
        html += slots(FACTION_BONDS.map(function (bond) {
          return slot(bond.name, "", memberLine(bond) + "<p><strong>Effect:</strong> " + bond.effect + "</p>");
        }));

        html += "<h4>School Bonds</h4>";
        html += slots(SCHOOL_BONDS.map(function (bond) {
          return slot(bond.name, "", memberLine(bond) + "<p><strong>Effect:</strong> " + bond.effect + "</p>");
        }));

        html += "<h4>Independent Bonds</h4>";
        html += slots(INDEPENDENT_BONDS.map(function (bond) {
          return slot(bond.name, "<span class='slot-sub'>" + bond.owner + "</span>",
            "<p><strong>Owner:</strong> " + bond.owner + "</p><p>" + bond.effect + "</p>");
        }));

        html += "<p class='codex-note'>Activation thresholds vary by Bond and " +
          "patch (commonly 4 / 6 / 7 / 8 / 9 / 10 members; the top 'Prism' tier " +
          "often needs 8-10). Bond Emblems add a non-bond unit to a Bond.</p>";
        return html;
      }
    },
    {
      id: "equipment",
      label: "Equipment",
      render: function () {
        var html = "<h3>Equipment</h3>" +
          "<p>Up to 3 pieces per character. Two basic pieces synthesize into an " +
          "advanced piece; advanced pieces upgrade into privileged pieces. " +
          "Click a slot to expand it.</p>";

        html += "<h4>Basic Equipment</h4>";
        html += slots(BASIC_EQUIPMENT.map(function (item) {
          return slot(item.name, "<span class='slot-sub'>" + item.value + "</span>",
            "<p><strong>Stat:</strong> " + item.stat + " (" + item.value + ")</p>");
        }));

        html += "<h4>Advanced Equipment</h4>";
        html += slots(ADVANCED_EQUIPMENT.map(function (item) {
          return slot(item.name, "<span class='slot-sub'>" + item.recipe + "</span>",
            "<p><strong>Recipe:</strong> " + item.recipe + "</p>" +
            "<p><strong>Effect:</strong> " + item.effect + "</p>");
        }));

        html += "<h4>Rare &amp; Special</h4>";
        html += slots(SPECIAL_EQUIPMENT.map(function (item) {
          return slot(item.name, "", "<p>" + item.effect + "</p>");
        }));

        html += "<h4>Consumables</h4>";
        html += slots(CONSUMABLES.map(function (item) {
          return slot(item.name, "", "<p>" + item.effect + "</p>");
        }));

        return html;
      }
    },
    {
      id: "investment",
      label: "Investment",
      render: function () {
        var html = "<h3>Investment</h3>" +
          "<p>An <strong>Environment</strong> is chosen once at the start of a " +
          "run (run-long effect). A <strong>Strategy</strong> is chosen mid-run " +
          "(1 of 3 offered, and more can be collected). Higher-rarity strategies " +
          "increase the run's difficulty. Click a slot to expand it.</p>";

        html += "<h4>Index Funds</h4>";
        html += slots(ENVIRONMENT_INDEX_FUNDS.map(function (bond) {
          var extra = bond === "Day Demigod"
            ? " Can also hand you Aglaea / Tribbie / Roller Skates at the start to force the comp." : "";
          return slot(bond + " Index Fund", "<span class='slot-sub'>Environment</span>",
            "<p>One fund exists per Bond. Raises that Bond's unit appearance rate in the shop." + extra + "</p>");
        }));

        html += "<h4>Invitations</h4>";
        html += slots(ENVIRONMENT_INVITATIONS.map(function (bond) {
          return slot(bond + " Invitation", "<span class='slot-sub'>Environment</span>",
            "<p>Grants the corresponding Bond EMBLEM immediately.</p>");
        }));

        html += "<h4>Other Environments</h4>";
        html += slots(ENVIRONMENTS.map(function (env) {
          return slot(env.name, "<span class='slot-sub'>" + env.category + "</span>",
            "<p>" + env.effect + "</p>");
        }));

        html += "<h4>Strategies</h4>";
        html += slots(STRATEGIES.map(function (strat) {
          return slot(strat.name + rarityTag(strat.rarity), "",
            "<p>" + strat.effect + "</p>");
        }));

        html += "<p class='codex-note'>Strategy rarities are Silver (Common), " +
          "Gold and Prismatic. Picking higher rarity adds difficulty (0 / 1/3 / " +
          "3-6 depending on rank). Many strategies are documented by name only.</p>";
        return html;
      }
    }
  ];

  var activeTab = CODEX[0].id;

  function renderTabs() {
    codexTabs.innerHTML = CODEX.map(function (tab) {
      var active = tab.id === activeTab ? " active" : "";
      return (
        '<button type="button" class="codex-tab' + active +
        '" data-tab="' + tab.id + '">' + tab.label + "</button>"
      );
    }).join("");
  }

  function renderBody() {
    for (var i = 0; i < CODEX.length; i++) {
      if (CODEX[i].id === activeTab) {
        codexBody.innerHTML = CODEX[i].render();
        break;
      }
    }
    codexBody.scrollTop = 0;
  }

  function openCodex() {
    codexOverlay.hidden = false;
    document.body.style.overflow = "hidden";
    renderTabs();
    renderBody();
  }

  function closeCodex() {
    codexOverlay.hidden = true;
    document.body.style.overflow = "";
  }

  function handleTabClick(event) {
    var tab = event.target.closest(".codex-tab");
    if (!tab) {
      return;
    }
    activeTab = tab.getAttribute("data-tab");
    renderTabs();
    renderBody();
  }

  function handleSlotToggle(event) {
    var head = event.target.closest(".slot-head");
    if (!head) {
      return;
    }
    var body = head.nextElementSibling;
    var isOpen = !body.hidden;
    body.hidden = isOpen;
    if (isOpen) {
      head.classList.remove("open");
    } else {
      head.classList.add("open");
    }
  }

  /* ---------------------------------------------------------------------- */
  /* Wiring                                                                  */
  /* ---------------------------------------------------------------------- */

  usernameForm.addEventListener("submit", handleUsernameSubmit);

  usernameInput.addEventListener("input", function () {
    if (!usernameError.hidden) {
      clearError();
    }
  });

  changeUserBtn.addEventListener("click", gotoUsername);

  var modeCards = modesScreen.querySelectorAll(".mode-card:not(.locked)");
  Array.prototype.forEach.call(modeCards, function (card) {
    card.addEventListener("click", handleModeSelect);
  });

  codexBtn.addEventListener("click", openCodex);
  codexClose.addEventListener("click", closeCodex);
  codexTabs.addEventListener("click", handleTabClick);
  codexBody.addEventListener("click", handleSlotToggle);
  codexOverlay.addEventListener("click", function (event) {
    if (event.target === codexOverlay) {
      closeCodex();
    }
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !codexOverlay.hidden) {
      closeCodex();
    }
  });

  // Expose shared data + navigation for the character modules.
  window.CW = {
    showScreen: showScreen,
    getUser: function () {
      return username;
    },
    data: {
      COST_ROSTER: COST_ROSTER,
      COST_LABEL: COST_LABEL,
      FACTION_BONDS: FACTION_BONDS,
      SCHOOL_BONDS: SCHOOL_BONDS,
      INDEPENDENT_BONDS: INDEPENDENT_BONDS,
      EMPOWER: EMPOWER
    }
  };

  // Boot: skip the gate if a username was already stored.
  var stored = loadUsername();
  if (stored) {
    username = stored;
    gotoModes();
  } else {
    showScreen(usernameScreen);
  }
})();
