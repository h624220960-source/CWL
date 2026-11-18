(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(
      require("./data/cw-4.6.js"),
      require("./characters.js")
    );
  } else {
    root.CWRun = factory(root.CW_DATA, root.CW_CHARACTERS);
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function (DATA, CHARS) {
  "use strict";

  if (!DATA || !CHARS) {
    throw new Error("CWRun requires CW_DATA and CW_CHARACTERS.");
  }

  var CONFIG = DATA.run;

  function createRng(seed) {
    var state = seed | 0;
    if (state === 0) {
      state = 1;
    }
    return {
      next: function () {
        state ^= state << 13;
        state ^= state >>> 17;
        state ^= state << 5;
        return (state >>> 0) / 4294967296;
      },
      pick: function (list) {
        return list[Math.floor(this.next() * list.length)];
      },
      weighted: function (table) {
        var roll = this.next();
        var total = 0;
        var keys = Object.keys(table);
        for (var i = 0; i < keys.length; i++) {
          total += table[keys[i]];
          if (roll <= total) {
            return Number(keys[i]);
          }
        }
        return Number(keys[keys.length - 1]);
      }
    };
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function characterById(id) {
    return CHARS.byId(id);
  }

  function shuffle(list, rng) {
    var copy = list.slice();
    for (var i = copy.length - 1; i > 0; i--) {
      var j = Math.floor(rng.next() * (i + 1));
      var tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  function uniqueList(list) {
    var seen = {};
    return list.filter(function (item) {
      if (seen[item]) {
        return false;
      }
      seen[item] = true;
      return true;
    });
  }

  function implementedCharacters() {
    return CHARS.list.filter(function (character) {
      return character.slots && (character.slots.on || character.slots.off);
    });
  }

  function implementedStrategies() {
    return DATA.strategies.filter(function (strategy) {
      return strategy.implemented;
    });
  }

  function implementedEnvironments() {
    return DATA.environments.filter(function (environment) {
      return environment.implemented;
    });
  }

  function makeUnit(id, star, uid) {
    var character = characterById(id);
    return {
      uid: "u" + uid,
      id: id,
      name: character.name,
      cost: character.cost,
      star: star || 1
    };
  }

  function Run(options) {
    options = options || {};
    this.seed = options.seed || Math.floor(Math.random() * 1000000) + 1;
    this.rng = createRng(this.seed);
    this.difficulty = options.difficulty || 1;
    this.uidCounter = 0;

    this.gold = CONFIG.startGold;
    this.level = CONFIG.startLevel;
    this.xp = 0;
    this.squadHp = CONFIG.startSquadHp;
    this.maxSquadHp = CONFIG.startSquadHp;
    this.plane = 0;
    this.nodeIndex = 0;
    this.phase = "environment";
    this.outcome = null;
    this.rating = null;
    this.winStreak = 0;
    this.lossStreak = 0;

    this.environment = null;
    this.environmentOffer = shuffle(implementedEnvironments(), this.rng)
      .slice(0, CONFIG.environmentOfferCount)
      .map(function (environment) { return environment.id; });

    this.strategies = [];
    this.strategyOffer = null;
    this.supplyOffer = null;
    this.pendingReward = null;
    this.encounterDifficulty = null;
    this.activeNode = null;
    this.battleConfig = null;
    this.lastBattle = null;

    this.units = [];
    this.deployment = {};
    this.equipment = {};
    this.inventory = [];
    this.shop = [];
    this.shopLocked = false;
    this.log = [];
    this.maxLevelBonus = 0;
    this.sellMultiplier = 1;

    this.seedStartingRoster();
    this.rollShop();
    this.writeLog("Run created (seed " + this.seed + ").");
  }

  Run.prototype.writeLog = function (text) {
    this.log.push(text);
    if (this.log.length > 400) {
      this.log.shift();
    }
  };

  Run.prototype.seedStartingRoster = function () {
    var pool = implementedCharacters().filter(function (character) {
      return character.cost === 1;
    });
    var picks = shuffle(pool, this.rng).slice(0, Math.min(CONFIG.startLevel, pool.length));
    var hasOnField = picks.some(function (character) {
      return character.position !== "off";
    });
    if (!hasOnField) {
      var onFieldPool = pool.filter(function (character) {
        return character.position !== "off";
      });
      if (onFieldPool.length) {
        picks[picks.length - 1] = this.rng.pick(onFieldPool);
      }
    }
    var self = this;
    picks.forEach(function (character) {
      self.addUnit(character.id, 1);
    });
    this.autoDeploy();
    this.writeLog("Starting squad: " + picks.map(function (character) { return character.name; }).join(", ") + ".");
  };

  Run.prototype.addUnit = function (id, star) {
    var unit = makeUnit(id, star || 1, ++this.uidCounter);
    this.units.push(unit);
    return unit;
  };

  Run.prototype.unitByUid = function (uid) {
    return this.units.filter(function (unit) {
      return unit.uid === uid;
    })[0] || null;
  };

  Run.prototype.characterOf = function (unit) {
    return characterById(unit.id);
  };

  Run.prototype.deployedUnits = function () {
    var self = this;
    return this.units.filter(function (unit) {
      return !!self.deployment[unit.uid];
    });
  };

  Run.prototype.benchUnits = function () {
    var self = this;
    return this.units.filter(function (unit) {
      return !self.deployment[unit.uid];
    });
  };

  Run.prototype.teamSize = function () {
    return Math.min(CONFIG.maxLevel, this.level);
  };

  Run.prototype.maxLevel = function () {
    return CONFIG.maxLevel + this.maxLevelBonus;
  };

  Run.prototype.activeBonds = function () {
    var counts = {};
    var self = this;
    this.deployedUnits().forEach(function (unit) {
      var character = self.characterOf(unit);
      character.bonds.forEach(function (bondName) {
        counts[bondName] = (counts[bondName] || 0) + 1;
      });
    });

    return DATA.bonds.map(function (bond) {
      var count = counts[bond.name] || 0;
      var level = bond.thresholds.filter(function (threshold) {
        return count >= threshold;
      }).length;
      return {
        id: bond.id,
        name: bond.name,
        type: bond.type,
        count: count,
        level: level,
        thresholds: bond.thresholds,
        implemented: !!bond.implemented,
        effect: bond.effect
      };
    }).filter(function (bond) {
      return bond.count > 0;
    }).sort(function (a, b) {
      return b.level - a.level || b.count - a.count;
    });
  };

  Run.prototype.bondLevel = function (id) {
    var bond = this.activeBonds().filter(function (candidate) {
      return candidate.id === id;
    })[0];
    return bond ? bond.level : 0;
  };

  Run.prototype.implementedBonds = function () {
    return this.activeBonds().filter(function (bond) {
      return bond.implemented && bond.level > 0;
    }).map(function (bond) {
      return { id: bond.id, level: bond.level };
    });
  };

  Run.prototype.xpToNext = function () {
    return CONFIG.xpToNext[this.level] === null ? null : CONFIG.xpToNext[this.level];
  };

  Run.prototype.gainXp = function (amount) {
    this.xp += amount;
    var guard = 0;
    while (guard < 20) {
      var need = this.xpToNext();
      if (need === null || this.level >= this.maxLevel()) {
        this.xp = Math.min(this.xp, need || this.xp);
        break;
      }
      if (this.xp < need) {
        break;
      }
      this.xp -= need;
      this.level++;
      this.writeLog("Level up: now level " + this.level + " (team size " + this.teamSize() + ").");
      guard++;
    }
  };

  Run.prototype.interest = function () {
    return Math.min(CONFIG.interestMax, Math.floor(Math.max(0, this.gold) / CONFIG.interestPer));
  };

  Run.prototype.shopOdds = function () {
    return CONFIG.shopOdds[Math.min(CONFIG.maxLevel, this.level)] || CONFIG.shopOdds[CONFIG.maxLevel];
  };

  Run.prototype.rollShopSlot = function () {
    var cost = this.rng.weighted(this.shopOdds());
    var pool = implementedCharacters().filter(function (character) {
      return character.cost === cost;
    });
    if (!pool.length) {
      pool = implementedCharacters().slice().sort(function (a, b) {
        return Math.abs(a.cost - cost) - Math.abs(b.cost - cost);
      });
      var nearest = pool.length ? pool[0].cost : 1;
      pool = pool.filter(function (character) {
        return character.cost === nearest;
      });
    }
    var character = this.rng.pick(pool);
    var starChance = this.environment && this.environment.run && this.environment.run.twoStarChance;
    var star = starChance && this.rng.next() < starChance ? 2 : 1;
    var reduction = this.environment && this.environment.run && this.environment.run.shopCostReduction
      ? this.environment.run.shopCostReduction : 0;
    return {
      id: character.id,
      name: character.name,
      cost: character.cost,
      star: star,
      price: Math.max(1, character.cost * (star === 2 ? 3 : 1) - reduction)
    };
  };

  Run.prototype.rollShop = function (force) {
    if (this.shopLocked && !force) {
      return;
    }
    this.shop = [];
    for (var i = 0; i < CONFIG.shopSize; i++) {
      this.shop.push(this.rollShopSlot());
    }
  };

  Run.prototype.toggleShopLock = function () {
    this.shopLocked = !this.shopLocked;
    this.writeLog(this.shopLocked ? "Shop locked." : "Shop unlocked.");
    return this.shopLocked;
  };

  Run.prototype.refreshCost = function () {
    if (this.environment && this.environment.run && this.environment.run.refreshCostOverride !== undefined) {
      return this.environment.run.refreshCostOverride;
    }
    return CONFIG.refreshCost;
  };

  Run.prototype.chooseEnvironment = function (id) {
    if (this.phase !== "environment" || this.environmentOffer.indexOf(id) === -1) {
      return false;
    }
    this.environment = DATA.environmentById(id);
    if (this.environment.run && this.environment.run.startGoldBonus) {
      this.gold += this.environment.run.startGoldBonus;
    }
    this.phase = "map";
    this.writeLog("Environment chosen: " + this.environment.name + ".");
    this.rollShop();
    this.autoDeploy();
    return true;
  };

  Run.prototype.chooseShop = function (index) {
    if (this.phase !== "map") {
      return false;
    }
    var slot = this.shop[index];
    if (!slot || slot.taken) {
      return false;
    }
    if (this.gold < slot.price) {
      this.writeLog("Not enough Gold for " + slot.name + ".");
      return false;
    }
    this.gold -= slot.price;
    this.shop[index] = null;
    this.addUnit(slot.id, slot.star);
    this.writeLog("Bought " + slot.name + (slot.star > 1 ? " (" + slot.star + "-star)" : "") +
      " for " + slot.price + " Gold.");
    this.tryMerge();
    if (!this.deployedUnits().length) {
      this.autoDeploy();
    }
    return true;
  };

  Run.prototype.tryMerge = function () {
    var merged = true;
    var guard = 0;
    while (merged && guard < 50) {
      merged = false;
      guard++;
      var groups = {};
      var self = this;
      this.units.forEach(function (unit) {
        if (unit.star >= 3) {
          return;
        }
        var key = unit.id + ":" + unit.star;
        groups[key] = groups[key] || [];
        groups[key].push(unit);
      });
      var keys = Object.keys(groups);
      for (var i = 0; i < keys.length; i++) {
        var group = groups[keys[i]];
        if (group.length < 3) {
          continue;
        }
        var consumed = group.slice(0, 3);
        var position = null;
        consumed.forEach(function (unit) {
          if (self.deployment[unit.uid]) {
            position = self.deployment[unit.uid];
          }
        });
        var star = consumed[0].star + 1;
        var keptEquipment = [];
        consumed.forEach(function (unit) {
          var gear = self.equipment[unit.uid] || [];
          keptEquipment = keptEquipment.concat(gear);
          delete self.equipment[unit.uid];
          delete self.deployment[unit.uid];
        });
        this.units = this.units.filter(function (unit) {
          return consumed.indexOf(unit) === -1;
        });
        var mergedUnit = this.addUnit(consumed[0].id, star);
        this.equipment[mergedUnit.uid] = keptEquipment.slice(0, 3);
        if (position) {
          this.deployment[mergedUnit.uid] = position;
        }
        this.writeLog("Merged 3x " + consumed[0].name + " into a " + star + "-star " + consumed[0].name + ".");
        merged = true;
        break;
      }
    }
  };

  Run.prototype.sellUnit = function (uid) {
    if (this.phase !== "map") {
      return false;
    }
    var unit = this.unitByUid(uid);
    if (!unit) {
      return false;
    }
    var copies = Math.pow(3, unit.star - 1);
    var price = Math.max(1, Math.floor(unit.cost * copies * CONFIG.sellRate * this.sellMultiplier));
    this.gold += price;
    delete this.deployment[uid];
    var gear = this.equipment[uid] || [];
    var self = this;
    gear.forEach(function (equipmentId) {
      self.inventory.push(equipmentId);
    });
    delete this.equipment[uid];
    this.units = this.units.filter(function (candidate) {
      return candidate.uid !== uid;
    });
    this.writeLog("Sold " + unit.name + " for " + price + " Gold.");
    return true;
  };

  Run.prototype.canDeploy = function (uid, position) {
    var unit = this.unitByUid(uid);
    if (!unit) {
      return false;
    }
    var character = this.characterOf(unit);
    if (position === "on" && character.position === "off") {
      return false;
    }
    if (position === "off" && character.position === "on") {
      return false;
    }
    var current = this.deployment[uid];
    var deployedCount = this.deployedUnits().length - (current ? 1 : 0);
    if (deployedCount >= this.teamSize()) {
      return false;
    }
    var onCount = this.deployedUnits().filter(function (candidate) {
      return candidate.uid !== uid && this.deployment[candidate.uid] === "on";
    }, this).length;
    var offCount = this.deployedUnits().filter(function (candidate) {
      return candidate.uid !== uid && this.deployment[candidate.uid] === "off";
    }, this).length;
    if (position === "on" && onCount >= CONFIG.maxOnField) {
      return false;
    }
    if (position === "off" && offCount >= CONFIG.maxOffField) {
      return false;
    }
    return true;
  };

  Run.prototype.deployUnit = function (uid, position) {
    if (!this.canDeploy(uid, position)) {
      return false;
    }
    this.deployment[uid] = position;
    this.writeLog(this.unitByUid(uid).name + " moved to " + (position === "on" ? "On-Field" : "Off-Field") + ".");
    return true;
  };

  Run.prototype.benchUnit = function (uid) {
    if (this.deployment[uid]) {
      delete this.deployment[uid];
      return true;
    }
    return false;
  };

  Run.prototype.autoDeploy = function () {
    this.deployment = {};
    var onCapable = [];
    var offCapable = [];
    var self = this;
    this.units.slice().sort(function (a, b) {
      return b.star - a.star || b.cost - a.cost;
    }).forEach(function (unit) {
      var character = self.characterOf(unit);
      if (character.position === "on") {
        onCapable.push(unit);
      } else if (character.position === "off") {
        offCapable.push(unit);
      } else {
        onCapable.push(unit);
      }
    });

    var deployed = 0;
    onCapable.forEach(function (unit) {
      if (deployed >= self.teamSize()) {
        return;
      }
      var onCount = Object.keys(self.deployment).filter(function (uid) {
        return self.deployment[uid] === "on";
      }).length;
      if (onCount < CONFIG.maxOnField) {
        self.deployment[unit.uid] = "on";
        deployed++;
      }
    });
    offCapable.forEach(function (unit) {
      if (deployed >= self.teamSize()) {
        return;
      }
      if (self.deployment[unit.uid]) {
        return;
      }
      var offCount = Object.keys(self.deployment).filter(function (uid) {
        return self.deployment[uid] === "off";
      }).length;
      if (offCount < CONFIG.maxOffField) {
        self.deployment[unit.uid] = "off";
        deployed++;
      }
    });
  };

  Run.prototype.equip = function (uid, equipmentId) {
    if (this.inventory.indexOf(equipmentId) === -1) {
      return false;
    }
    if (!this.unitByUid(uid)) {
      return false;
    }
    var gear = this.equipment[uid] || (this.equipment[uid] = []);
    if (gear.length >= 3) {
      return false;
    }
    gear.push(equipmentId);
    this.inventory.splice(this.inventory.indexOf(equipmentId), 1);
    return true;
  };

  Run.prototype.unequip = function (uid, equipmentId) {
    var gear = this.equipment[uid] || [];
    var index = gear.indexOf(equipmentId);
    if (index === -1) {
      return false;
    }
    gear.splice(index, 1);
    this.inventory.push(equipmentId);
    return true;
  };

  Run.prototype.addEquipment = function (equipmentId) {
    this.inventory.push(equipmentId);
  };

  Run.prototype.randomBasicEquipment = function () {
    return this.rng.pick(DATA.equipment.basic).id;
  };

  Run.prototype.rollStrategyOffer = function () {
    var owned = this.strategies.map(function (strategy) { return strategy.id; });
    var pool = implementedStrategies().filter(function (strategy) {
      return owned.indexOf(strategy.id) === -1;
    });
    if (pool.length < CONFIG.strategyOfferCount) {
      pool = implementedStrategies();
    }
    var rarity = this.environment && this.environment.run && this.environment.run.strategyRarity;
    var offer = shuffle(pool, this.rng).slice(0, CONFIG.strategyOfferCount).map(function (strategy) {
      return {
        id: strategy.id,
        name: strategy.name,
        rarity: rarity || strategy.rarity,
        effect: strategy.effect
      };
    });
    this.strategyOffer = offer;
  };

  Run.prototype.chooseStrategy = function (id) {
    if (!this.strategyOffer) {
      return false;
    }
    var offer = this.strategyOffer.filter(function (candidate) {
      return candidate.id === id;
    })[0];
    if (!offer) {
      return false;
    }
    var strategy = DATA.strategyById(id);
    this.strategies.push({ id: id, name: strategy.name });
    if (strategy.run) {
      if (strategy.run.goldOnPick) {
        this.gold += strategy.run.goldOnPick;
      }
      if (strategy.run.maxLevelBonus) {
        this.maxLevelBonus += strategy.run.maxLevelBonus;
      }
      if (strategy.run.sellMultiplier) {
        this.sellMultiplier = Math.max(this.sellMultiplier, strategy.run.sellMultiplier);
      }
    }
    this.strategyOffer = null;
    this.phase = "map";
    this.writeLog("Strategy chosen: " + strategy.name + ".");
    this.rollShop();
    return true;
  };

  Run.prototype.skipStrategy = function () {
    this.strategyOffer = null;
    this.phase = "map";
    this.rollShop();
    return true;
  };

  Run.prototype.hasStrategy = function (id) {
    return this.strategies.some(function (strategy) {
      return strategy.id === id;
    });
  };

  Run.prototype.currentNode = function () {
    if (this.phase === "ended") {
      return null;
    }
    return {
      plane: this.plane,
      index: this.nodeIndex,
      type: CONFIG.nodeSequence[this.nodeIndex]
    };
  };

  Run.prototype.nodesView = function () {
    var self = this;
    return CONFIG.nodeSequence.map(function (type, index) {
      return {
        index: index,
        type: type,
        done: index < self.nodeIndex,
        current: index === self.nodeIndex && self.phase !== "ended"
      };
    }, this);
  };

  Run.prototype.nodeGold = function (type) {
    var base = CONFIG.nodeGold[type] || 0;
    if (this.environment && this.environment.run && this.environment.run.nodeGoldBonus) {
      base += this.environment.run.nodeGoldBonus;
    }
    if (this.hasStrategy("special_ops_fund")) {
      base += DATA.strategyById("special_ops_fund").run.goldPerNode;
    }
    return base;
  };

  Run.prototype.applyCosmicScholarGold = function () {
    var level = this.bondLevel("cosmic_scholar");
    if (level > 0) {
      var bonus = DATA.bondById("cosmic_scholar").economy.goldPerNodePerLevel * level;
      this.gold += bonus;
      this.writeLog("Cosmic Scholar grants " + bonus + " Gold.");
    }
  };

  Run.prototype.enterNode = function () {
    if (this.phase !== "map" || this.phase === "ended") {
      return null;
    }
    this.activeNode = this.currentNode();
    this.applyCosmicScholarGold();
    var type = this.activeNode.type;

    if (type === "reward") {
      var gold = this.nodeGold("reward");
      var equipmentId = this.randomBasicEquipment();
      this.gold += gold;
      this.addEquipment(equipmentId);
      this.pendingReward = {
        gold: gold,
        equipmentId: equipmentId,
        equipmentName: DATA.equipmentById(equipmentId).name
      };
      this.phase = "reward";
      this.writeLog("Reward node: +" + gold + " Gold and " + this.pendingReward.equipmentName + ".");
      return { type: type, reward: this.pendingReward };
    }

    if (type === "supply") {
      var self = this;
      this.supplyOffer = shuffle(DATA.equipment.basic, this.rng).slice(0, 3).map(function (item) {
        return { id: item.id, name: item.name, text: item.text };
      });
      this.phase = "supply";
      this.writeLog("Supply node: choose one piece of basic equipment.");
      return { type: type, offer: this.supplyOffer };
    }

    if (type === "encounter") {
      this.phase = "encounter";
      this.writeLog("Encounter node: choose a difficulty.");
      return { type: type };
    }

    return this.startBattle(null);
  };

  Run.prototype.chooseSupply = function (equipmentId) {
    if (this.phase !== "supply" || !this.supplyOffer) {
      return false;
    }
    var offer = this.supplyOffer.filter(function (item) {
      return item.id === equipmentId;
    })[0];
    if (!offer) {
      return false;
    }
    this.addEquipment(equipmentId);
    this.writeLog("Supply chosen: " + offer.name + ".");
    this.supplyOffer = null;
    this.finishNode();
    return true;
  };

  Run.prototype.finishNode = function () {
    this.pendingReward = null;
    this.advanceNode();
    if (this.phase !== "ended") {
      this.phase = "map";
      this.rollShop();
    }
  };

  Run.prototype.advanceNode = function () {
    this.nodeIndex++;
    if (this.nodeIndex >= CONFIG.nodesPerPlane) {
      this.nodeIndex = 0;
      this.plane++;
    }
    if (this.plane >= CONFIG.planes) {
      this.endRun(true);
    }
  };

  Run.prototype.encounterEnemies = function (difficulty) {
    if (difficulty === "hard") {
      return ["rivalBroker", "rivalBroker", "ipcEnforcer"];
    }
    return ["debtCollector", "ipcEnforcer", "debtCollector"];
  };

  Run.prototype.nodeEnemies = function (type, difficulty) {
    if (type === "boss") {
      var list = ["auctionOverseer"];
      if (this.plane >= 1) {
        list.push("ipcEnforcer");
      }
      if (this.plane >= 2) {
        list.push("rivalBroker");
      }
      return list;
    }
    if (type === "encounter") {
      return this.encounterEnemies(difficulty || "easy");
    }
    if (this.plane === 0) {
      return ["debtCollector", "debtCollector"];
    }
    if (this.plane === 1) {
      return ["debtCollector", "ipcEnforcer"];
    }
    return ["ipcEnforcer", "rivalBroker"];
  };

  Run.prototype.startBattle = function (difficulty) {
    this.encounterDifficulty = difficulty || null;
    var type = this.activeNode ? this.activeNode.type : "battle";
    var turnKey = type === "encounter"
      ? (difficulty === "hard" ? "encounterHard" : "encounterEasy")
      : type;
    var turnLimit = CONFIG.turnLimits[turnKey] || CONFIG.turnLimits.battle;
    var difficultyMult = 1 + this.plane * 0.15 + this.difficulty * 0.1;
    if (difficulty === "hard") {
      difficultyMult += 0.15;
    }
    if (this.environment && this.environment.run && this.environment.run.difficultyBonus) {
      difficultyMult += this.environment.run.difficultyBonus * 0.1;
    }

    if (!this.deployedUnits().length) {
      this.autoDeploy();
    }
    var roster = this.deployedUnits().map(function (unit) {
      return {
        id: unit.id,
        position: this.deployment[unit.uid],
        star: unit.star,
        equipment: (this.equipment[unit.uid] || []).slice()
      };
    }, this);

    this.battleConfig = {
      roster: roster,
      enemies: this.nodeEnemies(type, difficulty),
      bonds: this.implementedBonds(),
      turnLimitAV: turnLimit,
      difficulty: Math.round(difficultyMult * 100) / 100,
      seed: Math.floor(this.rng.next() * 1000000) + 1,
      label: (this.plane + 1) + "-" + ((this.activeNode ? this.activeNode.index : this.nodeIndex) + 1),
      nodeType: type,
      squadHp: this.squadHp,
      gold: this.gold,
      autoDeploy: true
    };
    this.phase = "battle";
    this.writeLog("Entering " + type + " battle" + (difficulty ? " (" + difficulty + ")" : "") + ".");
    return this.battleConfig;
  };

  Run.prototype.finishBattle = function (result) {
    if (this.phase !== "battle" || !this.activeNode) {
      return false;
    }
    var type = this.activeNode.type;
    var victory = !!result.victory;
    this.lastBattle = {
      type: type,
      victory: victory,
      elapsedAV: result.elapsedAV || 0,
      turnLimit: result.turnLimit || 0
    };

    if (victory) {
      this.winStreak++;
      this.lossStreak = 0;
      var gold = this.nodeGold(type) + this.plane + this.winStreak * CONFIG.winStreakGold;
      if (type === "encounter" && this.encounterDifficulty === "hard") {
        gold += CONFIG.encounterHardBonusGold;
      }
      this.gold += gold;
      var interest = this.interest();
      this.gold += interest;
      this.gainXp(type === "boss" ? CONFIG.battleWinXp * 2 : CONFIG.battleWinXp);
      this.writeLog("Victory reward: +" + gold + " Gold, +" + interest + " interest.");
      if (this.hasStrategy("surplus_value")) {
        var remaining = Math.max(0, (result.turnLimit || 0) - (result.elapsedAV || 0));
        var bonus = Math.min(4, Math.floor(remaining / 30));
        if (bonus > 0) {
          this.gold += bonus;
          this.writeLog("Surplus Value: +" + bonus + " Gold.");
        }
      }
      if (type === "boss" && this.hasStrategy("struggle_protocol")) {
        var heal = DATA.strategyById("struggle_protocol").run.bossHeal;
        this.squadHp = Math.min(this.maxSquadHp, this.squadHp + heal);
        this.writeLog("Struggle Protocol restores " + heal + " Squad HP.");
      }
      this.addEquipment(this.randomBasicEquipment());
    } else {
      this.winStreak = 0;
      this.lossStreak++;
      var lossKey = type === "encounter"
        ? (this.encounterDifficulty === "hard" ? "encounterHard" : "encounterEasy")
        : type;
      var loss = CONFIG.squadHpLoss[lossKey] || CONFIG.squadHpLoss.battle;
      this.squadHp = Math.max(0, this.squadHp - loss);
      this.writeLog("Defeat: -" + loss + " Squad HP (" + this.squadHp + "/" + this.maxSquadHp + ").");
    }

    this.encounterDifficulty = null;
    this.battleConfig = null;

    if (this.squadHp <= 0) {
      this.endRun(false);
      return true;
    }

    if (type === "boss" && this.plane >= CONFIG.planes - 1) {
      this.endRun(true);
      return true;
    }

    this.advanceNode();
    if (this.phase === "ended") {
      return true;
    }

    if (victory && (type === "battle" || type === "encounter" || type === "boss")) {
      this.rollStrategyOffer();
      this.phase = "strategy";
    } else {
      this.phase = "map";
      this.rollShop();
    }
    return true;
  };

  Run.prototype.endRun = function (victory) {
    this.phase = "ended";
    this.outcome = victory ? "victory" : "defeat";
    var pct = this.maxSquadHp ? this.squadHp / this.maxSquadHp : 0;
    var grade = CONFIG.rating[CONFIG.rating.length - 1].grade;
    for (var i = 0; i < CONFIG.rating.length; i++) {
      if (pct * 100 >= CONFIG.rating[i].min) {
        grade = CONFIG.rating[i].grade;
        break;
      }
    }
    this.rating = grade;
    this.writeLog((victory ? "Run complete" : "Run failed") + ": rating " + grade + ".");
  };

  Run.prototype.abandon = function () {
    if (this.phase === "ended") {
      return;
    }
    this.endRun(false);
    this.rating = "D";
    this.writeLog("Run abandoned.");
  };

  Run.prototype.buyXp = function () {
    if (this.phase !== "map") {
      return false;
    }
    if (this.level >= this.maxLevel()) {
      return false;
    }
    if (this.hasStrategy("struggle_protocol")) {
      if (this.squadHp <= DATA.strategyById("struggle_protocol").run.xpCostHp) {
        return false;
      }
      this.squadHp -= DATA.strategyById("struggle_protocol").run.xpCostHp;
      this.writeLog("Struggle Protocol: paid 6 Squad HP for 1 EXP.");
    } else {
      if (this.gold < CONFIG.buyXpCost) {
        return false;
      }
      this.gold -= CONFIG.buyXpCost;
    }
    this.gainXp(CONFIG.xpPerBuy);
    return true;
  };

  Run.prototype.rerollShop = function () {
    if (this.phase !== "map") {
      return false;
    }
    var cost = this.refreshCost();
    if (this.gold < cost) {
      return false;
    }
    this.gold -= cost;
    this.rollShop();
    return true;
  };

  Run.prototype.chooseEncounterDifficulty = function (difficulty) {
    if (this.phase !== "encounter") {
      return false;
    }
    if (difficulty !== "easy" && difficulty !== "hard") {
      return false;
    }
    return this.startBattle(difficulty);
  };

  Run.prototype.continueNode = function () {
    if (this.phase !== "reward") {
      return false;
    }
    this.finishNode();
    return true;
  };

  Run.prototype.getState = function () {
    var self = this;
    var nodes = this.nodesView();
    return {
      phase: this.phase,
      outcome: this.outcome,
      rating: this.rating,
      seed: this.seed,
      plane: this.plane,
      planeCount: CONFIG.planes,
      nodeIndex: this.nodeIndex,
      nodeCount: CONFIG.nodesPerPlane,
      nodes: nodes,
      activeNode: this.activeNode,
      gold: this.gold,
      level: this.level,
      xp: this.xp,
      xpToNext: this.xpToNext(),
      squadHp: this.squadHp,
      maxSquadHp: this.maxSquadHp,
      teamSize: this.teamSize(),
      maxOnField: CONFIG.maxOnField,
      maxOffField: CONFIG.maxOffField,
      environment: this.environment ? {
        id: this.environment.id,
        name: this.environment.name,
        effect: this.environment.effect
      } : null,
      environmentOffer: this.environmentOffer.map(function (id) {
        var environment = DATA.environmentById(id);
        return { id: id, name: environment.name, category: environment.category, effect: environment.effect };
      }),
      bonds: this.activeBonds(),
      strategies: this.strategies.slice(),
      strategyOffer: this.strategyOffer ? this.strategyOffer.slice() : null,
      supplyOffer: this.supplyOffer ? this.supplyOffer.slice() : null,
      pendingReward: this.pendingReward,
      encounterDifficulty: this.encounterDifficulty,
      battleConfig: this.battleConfig,
      lastBattle: this.lastBattle,
      shopLocked: this.shopLocked,
      shopOdds: [1, 2, 3, 4, 5].map(function (cost) {
        var table = CONFIG.shopOdds[Math.min(CONFIG.maxLevel, self.level)];
        return { cost: cost, chance: table[cost] || 0 };
      }),
      shop: this.shop.map(function (slot) {
        return slot ? { id: slot.id, name: slot.name, cost: slot.cost, star: slot.star, price: slot.price } : null;
      }),
      refreshCost: this.refreshCost(),
      buyXpCost: CONFIG.buyXpCost,
      units: this.units.map(function (unit) {
        var character = self.characterOf(unit);
        return {
          uid: unit.uid,
          id: unit.id,
          name: unit.name,
          cost: unit.cost,
          star: unit.star,
          element: character.element,
          path: character.path,
          bonds: character.bonds.slice(),
          position: self.deployment[unit.uid] || null,
          canOn: character.position !== "off",
          canOff: character.position !== "on",
          equipment: (self.equipment[unit.uid] || []).slice()
        };
      }),
      bench: this.benchUnits().map(function (unit) {
        return unit.uid;
      }),
      inventory: this.inventory.slice(),
      equipmentCatalog: DATA.equipment.basic.map(function (item) {
        return { id: item.id, name: item.name, text: item.text };
      }),
      log: this.log.slice()
    };
  };

  function createRun(options) {
    return new Run(options);
  }

  return {
    Run: Run,
    createRun: createRun,
    CONFIG: CONFIG
  };
});
