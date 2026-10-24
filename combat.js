(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.CWCombat = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var DATA = typeof window !== "undefined" && window.CW_CHARACTERS ? window.CW_CHARACTERS : null;

  var GENERIC_ENEMIES = {
    debtCollector: {
      id: "debt_collector",
      name: "Debt Collector",
      initials: "DC",
      hp: 2400,
      atk: 200,
      def: 250,
      spd: 95,
      toughness: 40,
      weakness: ["Lightning"],
      basic: { name: "Foreclosure", multiplier: 1.0, targets: 1 }
    }
  };

  var EPSILON = 0.0001;

  function initialsFor(name) {
    var parts = String(name).trim().split(/\s+/);
    if (parts.length > 1) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return String(name).slice(0, 2).toUpperCase();
  }

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
      }
    };
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function sumBuff(unit, stat) {
    var total = 0;
    unit.buffs.forEach(function (buff) {
      if (buff.stat === stat) {
        total += buff.amount;
      }
    });
    return total;
  }

  function getCharacter(id) {
    if (!DATA) {
      throw new Error("CW_CHARACTERS is not loaded. Load characters.js before combat.js.");
    }
    var character = DATA.byId(id);
    if (!character) {
      throw new Error("Unknown character: " + id);
    }
    if (!character.combat) {
      throw new Error("Character has no combat data: " + id);
    }
    return character;
  }

  function getEnemyTemplate(id) {
    var template = GENERIC_ENEMIES[id];
    if (!template) {
      throw new Error("Unknown generic enemy: " + id);
    }
    return template;
  }

  function Battle(options) {
    options = options || {};
    this.turnLimitAV = options.turnLimitAV || 1500;
    this.infiniteEnemyHp = !!options.infiniteEnemyHp;
    this.sp = options.startSp === undefined ? 3 : options.startSp;
    this.maxSp = options.maxSp || 5;
    this.elapsedAV = 0;
    this.actionCount = 0;
    this.uidCounter = 0;
    this.status = "active";
    this.waitingForPlayer = null;
    this.log = [];
    this.damageEvents = [];
    this.damageEventId = 0;
    this.rng = createRng(options.seed || 1);
    this.players = [];
    this.enemies = [];
    this.summons = [];
    this.units = [];

    var party = options.party || ["aglaea"];
    if (party.length < 1 || party.length > 4) {
      throw new Error("Combat supports 1 to 4 On-Field characters.");
    }
    for (var i = 0; i < party.length; i++) {
      this.players.push(this.makePlayer(party[i], "on", i));
    }

    var enemyIds = options.enemies || ["debtCollector", "debtCollector"];
    for (var j = 0; j < enemyIds.length; j++) {
      this.enemies.push(this.makeEnemy(enemyIds[j], j));
    }

    this.units = this.players.concat(this.enemies);
    this.resetAV();
    this.writeLog("Battle start: " + this.players.map(function (u) { return u.name; }).join(", ") +
      " vs " + this.enemies.map(function (u) { return u.name; }).join(", ") + ".");
    this.step();
  }

  Battle.prototype.makePlayer = function (id, position, index) {
    var character = getCharacter(id);
    var kit = character.combat;
    return {
      uid: "p" + (++this.uidCounter),
      side: "player",
      position: position,
      slot: index + 1,
      characterId: character.id,
      name: character.name,
      initials: kit.initials || initialsFor(character.name),
      element: character.element,
      base: {
        hp: character.stats.hp,
        atk: character.stats.atk,
        def: character.stats.def,
        spd: character.stats.spd
      },
      maxHp: character.stats.hp,
      hp: character.stats.hp,
      energy: kit.startEnergy,
      maxEnergy: kit.maxEnergy,
      critRate: 0.05,
      critDmg: 0.5,
      luckyRate: 0.05,
      luckyDmg: 0.5,
      kit: kit,
      buffs: [],
      threads: 0,
      spdBuffEvents: 0,
      tiles: 0,
      tempSp: kit.empowerment && kit.empowerment.tempSp ? kit.empowerment.tempSp : 0,
      followUps: 0,
      rays: 0,
      raysPrimed: false,
      preyUid: null,
      ultimateUsed: false,
      supremeStance: false,
      summonTurns: 0,
      summonFreshAction: -1,
      revives: 0,
      damageVersion: 0,
      av: 10000 / character.stats.spd,
      alive: true
    };
  };

  Battle.prototype.makeEnemy = function (id, index) {
    var template = getEnemyTemplate(id);
    var infiniteHp = this.infiniteEnemyHp;
    return {
      uid: "e" + (++this.uidCounter),
      side: "enemy",
      position: "enemy",
      name: template.name + (index > 0 ? " " + (index + 1) : ""),
      initials: template.initials || initialsFor(template.name),
      element: "Physical",
      base: {
        hp: infiniteHp ? Infinity : template.hp,
        atk: template.atk,
        def: template.def,
        spd: template.spd
      },
      maxHp: infiniteHp ? Infinity : template.hp,
      hp: infiniteHp ? Infinity : template.hp,
      infiniteHp: infiniteHp || undefined,
      toughness: template.toughness,
      maxToughness: template.toughness,
      weakness: template.weakness.slice(),
      broken: false,
      basic: template.basic,
      critRate: 0.05,
      critDmg: 0.5,
      luckyRate: 0,
      luckyDmg: 0.5,
      buffs: [],
      dots: [],
      damageVersion: 0,
      av: 10000 / template.spd,
      alive: true
    };
  };

  Battle.prototype.resetAV = function () {
    var self = this;
    this.units.forEach(function (unit) {
      unit.av = 10000 / self.getSpd(unit);
    });
  };

  Battle.prototype.writeLog = function (text) {
    this.log.push({
      av: Math.round(this.elapsedAV * 10) / 10,
      text: text
    });
  };

  Battle.prototype.getLiving = function (side) {
    var list = side === "player" ? this.players : this.enemies;
    return list.filter(function (unit) {
      return unit.alive;
    });
  };

  Battle.prototype.getOnFieldTargets = function () {
    var onField = this.players.filter(function (unit) {
      return unit.alive && unit.position === "on";
    });
    return onField.length ? onField : this.getLiving("player");
  };

  Battle.prototype.getTargetableAllies = function () {
    var targets = this.getOnFieldTargets().concat(this.summons.filter(function (summon) {
      return summon.alive;
    }));
    return targets;
  };

  Battle.prototype.getDefaultEnemy = function () {
    var living = this.getLiving("enemy");
    return living.length ? living[0] : null;
  };

  Battle.prototype.checkEnd = function () {
    if (this.status !== "active") {
      return this.status;
    }
    if (!this.getLiving("enemy").length) {
      this.status = "victory";
      this.waitingForPlayer = null;
      this.writeLog("Victory: all enemies defeated.");
    } else if (!this.getLiving("player").length) {
      this.status = "defeat";
      this.waitingForPlayer = null;
      this.writeLog("Defeat: the party has fallen.");
    } else if (this.elapsedAV >= this.turnLimitAV) {
      this.elapsedAV = this.turnLimitAV;
      this.status = "defeat";
      this.waitingForPlayer = null;
      this.writeLog("Defeat: the " + this.turnLimitAV + " AV turn limit expired.");
    }
    return this.status;
  };

  Battle.prototype.stepOnce = function () {
    if (this.status !== "active" || this.waitingForPlayer) {
      return this.getState();
    }
    if (this.checkEnd() !== "active") {
      return this.getState();
    }

    var living = this.units.filter(function (unit) {
      return unit.alive;
    });
    if (!living.length) {
      this.checkEnd();
      return this.getState();
    }

    var minAV = Math.min.apply(null, living.map(function (unit) {
      return unit.av;
    }));

    if (minAV > 0) {
      living.forEach(function (unit) {
        unit.av -= minAV;
      });
      this.elapsedAV += minAV;
      if (this.checkEnd() !== "active") {
        return this.getState();
      }
    }

    var self = this;
    var ready = living.filter(function (unit) {
      return unit.av <= EPSILON;
    }).sort(function (a, b) {
      var speedDiff = self.getSpd(b) - self.getSpd(a);
      if (Math.abs(speedDiff) > EPSILON) {
        return speedDiff;
      }
      if (a.side !== b.side) {
        return a.side === "player" ? -1 : 1;
      }
      return a.uid < b.uid ? -1 : 1;
    });

    var unit = ready[0];
    if (unit.side === "player") {
      unit.av = 0;
      this.waitingForPlayer = unit;
      return this.getState();
    }

    if (unit.side === "summon") {
      this.summonTurn(unit);
      this.tickBuffs(unit);
      if (unit.alive) {
        unit.av = 10000 / this.getSpd(unit);
      }
      this.actionCount++;
      this.checkEnd();
      return this.getState();
    }

    if (unit.side === "countdown") {
      this.countdownTurn(unit);
      this.actionCount++;
      this.checkEnd();
      return this.getState();
    }

    this.enemyTurn(unit);
    this.tickBuffs(unit);
    if (unit.alive) {
      unit.av = 10000 / this.getSpd(unit);
    }
    this.actionCount++;
    this.checkEnd();
    return this.getState();
  };

  Battle.prototype.step = function () {
    var guard = 0;
    while (this.status === "active" && !this.waitingForPlayer && guard < 1000) {
      this.stepOnce();
      guard++;
    }
    return this.getState();
  };

  Battle.prototype.enemyTurn = function (unit) {
    if (!this.tickDots(unit)) {
      return;
    }

    if (unit.broken) {
      this.writeLog(unit.name + " is Broken and loses its turn.");
      unit.broken = false;
      unit.toughness = unit.maxToughness;
      this.writeLog(unit.name + " recovers its Toughness.");
      return;
    }

    var targets = this.getTargetableAllies();
    if (!targets.length) {
      return;
    }
    var target = this.rng.pick(targets);
    var hit = this.calculateDamage(unit, target, unit.basic.multiplier, unit.element);
    var tags = (hit.crit ? " [CRIT]" : "") + (hit.lucky ? " [LUCKY]" : "");
    this.writeLog(unit.name + " uses " + unit.basic.name + " on " + target.name +
      " for " + hit.amount + " DMG." + tags);
    if (target.side === "summon") {
      this.damageSummon(target, hit.amount, hit);
    } else {
      this.damagePlayer(target, hit.amount, unit, hit);
    }
  };

  Battle.prototype.calculateDamage = function (attacker, target, multiplier, element) {
    var roller = attacker;
    if (attacker.side === "summon") {
      roller = this.players.filter(function (player) {
        return player.uid === attacker.ownerUid;
      })[0] || attacker;
    }

    var raw = this.getAtk(attacker) * multiplier;
    var bonuses = 1 + sumBuff(attacker, "dmgPct");
    var defense = 1000 / (1000 + this.getDef(target));
    var elemental = target.weakness && target.weakness.indexOf(element) !== -1 ? 1.25 : 1.0;
    var broken = target.broken ? 1.1 : 1.0;
    var amount = raw * bonuses * defense * elemental * broken;

    var crit = this.rng.next() < (roller.critRate || 0);
    if (crit) {
      amount *= 1 + (roller.critDmg || 0);
    }
    var lucky = this.rng.next() < (roller.luckyRate || 0);
    if (lucky) {
      amount *= 1 + (roller.luckyDmg || 0);
    }

    return {
      amount: Math.max(1, Math.floor(amount)),
      crit: crit,
      lucky: lucky
    };
  };

  Battle.prototype.recordDamage = function (uid, amount, element, meta, kind) {
    this.damageEventId++;
    this.damageEvents.push({
      id: this.damageEventId,
      uid: uid,
      amount: amount,
      element: element,
      crit: !!(meta && meta.crit),
      lucky: !!(meta && meta.lucky),
      kind: kind || "hit"
    });
    if (this.damageEvents.length > 100) {
      this.damageEvents.shift();
    }
  };

  Battle.prototype.getAtk = function (unit) {
    if (unit.side === "enemy") {
      return unit.base.atk;
    }
    if (unit.side === "summon") {
      var owner = this.players.filter(function (player) {
        return player.uid === unit.ownerUid;
      })[0];
      return owner ? this.getAtk(owner) : unit.base.atk;
    }
    var atk = unit.base.atk;
    if (unit.kit.talent && unit.kit.talent.spdToAtk) {
      var conversion = unit.kit.talent.spdToAtk +
        unit.spdBuffEvents * (unit.kit.talent.conversionPerSpdBuff || 0);
      atk += this.getSpd(unit) * conversion;
    }
    var atkPct = sumBuff(unit, "atkPct");
    if (unit.kit.empowerment && unit.kit.empowerment.atkPerThread) {
      atkPct += unit.threads * unit.kit.empowerment.atkPerThread;
    }
    return atk * (1 + atkPct);
  };

  Battle.prototype.getSpd = function (unit) {
    if (unit.side === "enemy") {
      return unit.base.spd;
    }
    var flat = sumBuff(unit, "spd");
    if (unit.kit.empowerment && unit.kit.empowerment.spdPerThread) {
      flat += unit.threads * unit.kit.empowerment.spdPerThread;
    }
    return unit.base.spd + flat;
  };

  Battle.prototype.getDef = function (unit) {
    return unit.base.def + sumBuff(unit, "def");
  };

  Battle.prototype.applyToughnessDamage = function (target, amount, attacker) {
    if (target.side !== "enemy" || target.broken || target.toughness <= 0) {
      return;
    }
    target.toughness = Math.max(0, target.toughness - amount);
    if (target.toughness === 0) {
      target.broken = true;
      var breakEffect = attacker && attacker.kit && attacker.kit.talent &&
        attacker.kit.talent.breakEffect ? attacker.kit.talent.breakEffect : 0;
      var breakDamage = isFinite(target.maxHp)
        ? Math.floor(target.maxHp * 0.10 * (1 + breakEffect))
        : 0;
      if (breakDamage > 0) {
        target.damageVersion = (target.damageVersion || 0) + 1;
        target.hp = Math.max(0, target.hp - breakDamage);
        this.recordDamage(target.uid, breakDamage, "Break", null, "break");
      }
      this.writeLog(target.name + " is Weakness-Broken" +
        (breakDamage > 0 ? " for " + breakDamage + " Break DMG." : " (infinite HP)."));
      if (!target.infiniteHp && target.hp === 0) {
        target.alive = false;
        this.writeLog(target.name + " is defeated.");
        return;
      }
      this.writeLog(target.name + " will skip its next turn.");
    }
  };

  Battle.prototype.damageEnemy = function (target, amount, element, toughnessDamage, attacker, meta) {
    if (!target.alive) {
      return;
    }
    target.damageVersion = (target.damageVersion || 0) + 1;
    var tags = (meta && meta.crit ? " [CRIT]" : "") + (meta && meta.lucky ? " [LUCKY]" : "");
    if (target.infiniteHp) {
      this.writeLog(target.name + " takes " + amount + " " + element + " DMG" + tags + " (∞ HP).");
    } else {
      target.hp = Math.max(0, target.hp - amount);
      this.writeLog(target.name + " takes " + amount + " " + element + " DMG" + tags + " (" +
        target.hp + "/" + target.maxHp + " HP).");
    }
    this.recordDamage(target.uid, amount, element, meta, "hit");
    if (!target.infiniteHp && target.hp === 0) {
      target.alive = false;
      this.writeLog(target.name + " is defeated.");
      return;
    }
    this.applyToughnessDamage(target, toughnessDamage || 0, attacker);
  };

  Battle.prototype.damagePlayer = function (target, amount, attacker, meta) {
    target.damageVersion = (target.damageVersion || 0) + 1;
    target.hp = Math.max(0, target.hp - amount);
    target.energy = clamp(target.energy + 10, 0, target.maxEnergy);
    var tags = (meta && meta.crit ? " [CRIT]" : "") + (meta && meta.lucky ? " [LUCKY]" : "");
    this.writeLog(target.name + " takes " + amount + " DMG" + tags + " (" + target.hp + "/" +
      target.maxHp + " HP, " + Math.floor(target.energy) + " Energy).");
    this.recordDamage(target.uid, amount, attacker ? attacker.element : "Physical", meta, "hit");

    if (target.hp === 0) {
      target.revives++;
      target.hp = Math.max(1, Math.floor(target.maxHp * 0.30));
      this.elapsedAV += 200;
      this.writeLog(target.name + " revives at 30% HP. +200 AV elapsed (" +
        Math.round(this.elapsedAV) + "/" + this.turnLimitAV + ").");
    }
  };

  Battle.prototype.damageSummon = function (summon, amount, meta) {
    summon.damageVersion = (summon.damageVersion || 0) + 1;
    summon.hp = Math.max(0, summon.hp - amount);
    var tags = (meta && meta.crit ? " [CRIT]" : "") + (meta && meta.lucky ? " [LUCKY]" : "");
    this.writeLog(summon.name + " takes " + amount + " DMG" + tags + " (" + summon.hp + "/" +
      summon.maxHp + " HP).");
    this.recordDamage(summon.uid, amount, summon.element, meta, "hit");
    if (summon.hp === 0) {
      this.writeLog(summon.name + " is destroyed.");
      this.removeSummon(summon);
    }
  };

  Battle.prototype.removeSummon = function (summon) {
    if (!summon || !summon.alive) {
      return;
    }
    summon.alive = false;
    this.summons = this.summons.filter(function (candidate) {
      return candidate.uid !== summon.uid;
    });
    this.units = this.units.filter(function (candidate) {
      return candidate.uid !== summon.uid;
    });

    var owner = this.players.filter(function (player) {
      return player.uid === summon.ownerUid;
    })[0];
    if (owner) {
      owner.energy = clamp(owner.energy + 20, 0, owner.maxEnergy);
      this.writeLog(summon.name + " disappears. " + owner.name + " gains 20 Energy.");
      if (owner.supremeStance) {
        this.endSupremeStance(false);
      }
    }
  };

  Battle.prototype.endSupremeStance = function (removeSummonToo) {
    var owner = this.players.filter(function (player) {
      return player.characterId === "aglaea";
    })[0];
    if (!owner || !owner.supremeStance) {
      return;
    }
    owner.supremeStance = false;
    this.units = this.units.filter(function (unit) {
      return !unit.isCountdown;
    });
    this.writeLog("Aglaea's Supreme Stance ends.");

    if (removeSummonToo !== false) {
      var summon = this.summons.filter(function (candidate) {
        return candidate.ownerUid === owner.uid && candidate.alive;
      })[0];
      if (summon) {
        this.writeLog(summon.name + " self-destructs.");
        this.removeSummon(summon);
      }
    }
  };

  Battle.prototype.startSupremeStance = function (owner) {
    owner.supremeStance = true;
    var countdown = this.units.filter(function (unit) {
      return unit.isCountdown;
    })[0];

    if (!countdown) {
      countdown = {
        uid: "c" + (++this.uidCounter),
        side: "countdown",
        name: "Supreme Stance",
        initials: "SS",
        element: "Imaginary",
        color: "#ffd75e",
        base: { hp: 1, atk: 0, def: 0, spd: 100 },
        maxHp: 1,
        hp: 1,
        spd: 100,
        av: 10000 / 100,
        alive: true,
        isCountdown: true,
        kit: { talent: {}, empowerment: null },
        buffs: []
      };
      this.units.push(countdown);
    } else {
      countdown.alive = true;
      countdown.av = 10000 / 100;
    }
    this.writeLog(owner.name + " enters Supreme Stance.");
  };

  Battle.prototype.summonGarmentmaker = function (owner, healPct) {
    var existing = this.summons.filter(function (summon) {
      return summon.ownerUid === owner.uid && summon.alive;
    })[0];
    if (existing) {
      if (healPct === undefined) {
        existing.hp = existing.maxHp;
        this.writeLog(existing.name + "'s HP is restored to full.");
      } else {
        var heal = Math.floor(existing.maxHp * healPct);
        existing.hp = Math.min(existing.maxHp, existing.hp + heal);
        this.writeLog(existing.name + " restores " + heal + " HP.");
      }
      return existing;
    }

    var talent = owner.kit.talent;
    var summonData = owner.kit.summon;
    var maxHp = Math.floor(owner.maxHp * talent.summonHpPct + talent.summonHpFlat);
    var spd = Math.max(1, this.getSpd(owner) * talent.summonSpdPct);
    var summon = {
      uid: "s" + (++this.uidCounter),
      side: "summon",
      ownerUid: owner.uid,
      characterId: "garmentmaker",
      name: summonData.name,
      initials: summonData.initials,
      element: owner.element,
      base: { hp: maxHp, atk: 0, def: 0, spd: spd },
      maxHp: maxHp,
      hp: maxHp,
      av: 0,
      alive: true,
      kit: { talent: {}, empowerment: null },
      critRate: owner.critRate,
      critDmg: owner.critDmg,
      luckyRate: owner.luckyRate,
      luckyDmg: owner.luckyDmg,
      buffs: [],
      damageVersion: 0
    };

    this.summons.push(summon);
    this.units.push(summon);
    this.writeLog(summon.name + " is summoned and its action is advanced by 100%.");
    return summon;
  };

  Battle.prototype.summonTurn = function (summon) {
    var owner = this.players.filter(function (player) {
      return player.uid === summon.ownerUid;
    })[0];
    if (!owner || !owner.kit.summon) {
      return;
    }

    var summonData = owner.kit.summon;
    var target = this.resolveTarget(null);
    if (!target) {
      return;
    }

    this.writeLog(summon.name + " uses " + summonData.skillName + ".");
    this.hitEnemy(summon, target, summonData.multiplier, summonData.toughnessDamage, false);
    var adjacent = this.getLiving("enemy").filter(function (enemy) {
      return enemy.uid !== target.uid;
    })[0];
    if (adjacent) {
      this.hitEnemy(summon, adjacent, summonData.adjacentMultiplier, summonData.toughnessDamage, false);
    }
    owner.energy = clamp(owner.energy + summonData.energyGain, 0, owner.maxEnergy);
  };

  Battle.prototype.countdownTurn = function (countdown) {
    this.writeLog("The Supreme Stance countdown reaches zero.");
    countdown.alive = false;
    this.units = this.units.filter(function (unit) {
      return unit.uid !== countdown.uid;
    });
    this.endSupremeStance(true);
  };

  Battle.prototype.getAvailableActions = function () {
    var unit = this.waitingForPlayer;
    if (!unit) {
      return [];
    }
    var skill = unit.kit.skill;
    var ultimate = unit.kit.ultimate;
    var spCost = skill.spCost || 0;
    var canPaySkill = this.sp >= spCost || (spCost > 0 && unit.tempSp > 0);
    var basicName = unit.kit.basic.name || "Basic ATK";
    var skillName = skill.name || "Skill";
    var skillReason = canPaySkill ? "" : "Not enough Skill Points.";

    if (unit.characterId === "aglaea" && unit.supremeStance) {
      basicName = unit.kit.basic.enhanced.name;
      canPaySkill = false;
      skillReason = "Locked during Supreme Stance.";
    }

    return [
      {
        id: "basic",
        name: basicName,
        available: true,
        needsTarget: true
      },
      {
        id: "skill",
        name: skillName,
        available: canPaySkill,
        needsTarget: skill.type !== "summon",
        reason: skillReason
      },
      {
        id: "ultimate",
        name: unit.kit.ultimate.name || "Ultimate",
        available: unit.energy >= (ultimate.energyCost || 0),
        needsTarget: false,
        reason: unit.energy >= (ultimate.energyCost || 0) ? "" : "Not enough Energy."
      }
    ];
  };

  Battle.prototype.performAction = function (actionId, targetUid, options) {
    options = options || {};
    if (this.status !== "active" || !this.waitingForPlayer) {
      return this.getState();
    }
    var unit = this.waitingForPlayer;
    var action = this.getAvailableActions().filter(function (candidate) {
      return candidate.id === actionId;
    })[0];

    if (!action || !action.available) {
      return this.getState();
    }

    if (actionId === "ultimate") {
      return this.useUltimateFree(unit.uid, targetUid);
    }

    var target = this.resolveTarget(targetUid);

    if (actionId === "basic") {
      this.useBasic(unit, target);
    } else if (actionId === "skill") {
      this.useSkill(unit, target);
    }

    if (unit.summonTurns > 0 && unit.summonFreshAction !== this.actionCount) {
      this.garmentmakerAttack(unit, target);
      unit.summonTurns--;
      if (unit.summonTurns === 0) {
        this.writeLog("Garmentmaker returns to the thread.");
      }
    }

    this.tickBuffs(unit);
    this.actionCount++;
    unit.av = 10000 / this.getSpd(unit);
    this.waitingForPlayer = null;
    this.checkEnd();
    if (options.autoStep === false) {
      return this.getState();
    }
    return this.step();
  };

  Battle.prototype.resolveTarget = function (targetUid) {
    var living = this.getLiving("enemy");
    if (!living.length) {
      return null;
    }
    if (targetUid) {
      for (var i = 0; i < living.length; i++) {
        if (living[i].uid === targetUid) {
          return living[i];
        }
      }
    }
    return living[0];
  };

  Battle.prototype.useBasic = function (unit, target) {
    if (!target) {
      return;
    }
    var basic = unit.kit.basic;

    if (unit.characterId === "aglaea" && unit.supremeStance) {
      var enhanced = basic.enhanced;
      this.sp = clamp(this.sp + (enhanced.spGain || 0), 0, this.maxSp);
      unit.energy = clamp(unit.energy + (enhanced.energyGain || 0), 0, unit.maxEnergy);
      this.writeLog(unit.name + " uses " + enhanced.name + " (Joint ATK).");

      this.hitEnemy(unit, target, enhanced.multiplier, enhanced.toughnessDamage, false);
      var adjacentTarget = this.getLiving("enemy").filter(function (enemy) {
        return enemy.uid !== target.uid;
      })[0];
      if (adjacentTarget) {
        this.hitEnemy(unit, adjacentTarget, enhanced.adjacentMultiplier, enhanced.toughnessDamage, false);
      }

      var garmentmaker = this.summons.filter(function (summon) {
        return summon.ownerUid === unit.uid && summon.alive;
      })[0];
      if (garmentmaker) {
        this.hitEnemy(garmentmaker, target, enhanced.summonMultiplier, enhanced.toughnessDamage, false);
        if (adjacentTarget) {
          this.hitEnemy(garmentmaker, adjacentTarget, enhanced.summonAdjacentMultiplier, enhanced.toughnessDamage, false);
        }
      }
      return;
    }

    this.sp = clamp(this.sp + (basic.spGain || 0), 0, this.maxSp);
    unit.energy = clamp(unit.energy + (basic.energyGain || 0), 0, unit.maxEnergy);

    if (basic.enhanced && unit.tiles >= basic.enhanced.tilesCost) {
      unit.tiles = Math.max(0, unit.tiles - basic.enhanced.tilesCost);
      this.writeLog(unit.name + " uses an Enhanced Basic ATK.");
      this.hitEnemy(unit, target, basic.enhanced.multiplier, basic.toughnessDamage, false);
      var adjacent = this.getLiving("enemy").filter(function (enemy) {
        return enemy.uid !== target.uid;
      })[0];
      if (adjacent) {
        this.hitEnemy(unit, adjacent, basic.enhanced.adjacentMultiplier, basic.toughnessDamage, false);
      }
      return;
    }

    if (unit.kit.talent && unit.kit.talent.followUpsForEnhanced &&
        unit.followUps >= unit.kit.talent.followUpsForEnhanced) {
      unit.followUps = 0;
      this.writeLog(unit.name + " uses an Enhanced Basic ATK.");
      var living = this.getLiving("enemy");
      for (var i = 0; i < living.length; i++) {
        this.hitEnemy(unit, living[i], unit.kit.talent.enhancedBasicMultiplier, basic.toughnessDamage, false);
      }
      return;
    }

    this.writeLog(unit.name + " uses " + basic.name + ".");
    this.hitEnemy(unit, target, basic.multiplier, basic.toughnessDamage);
  };

  Battle.prototype.useSkill = function (unit, target) {
    var skill = unit.kit.skill;
    var spCost = skill.spCost || 0;

    if (unit.characterId === "aglaea") {
      if (unit.supremeStance) {
        return;
      }
      if (spCost > 0) {
        this.sp = clamp(this.sp - spCost, 0, this.maxSp);
      }
      unit.energy = clamp(unit.energy + (skill.energyGain || 0), 0, unit.maxEnergy);
      this.writeLog(unit.name + " uses " + skill.name + ".");
      this.summonGarmentmaker(unit, skill.summonHealPct);
      return;
    }

    if (!target) {
      return;
    }

    if (spCost > 0) {
      if (this.sp > 0) {
        this.sp = clamp(this.sp - spCost, 0, this.maxSp);
      } else if (unit.tempSp > 0) {
        unit.tempSp--;
        this.writeLog(unit.name + " spends 1 temporary Skill Point.");
      }
    }

    unit.energy = clamp(unit.energy + (skill.energyGain || 0), 0, unit.maxEnergy);

    if (skill.hpCostPct) {
      var hpCost = Math.max(1, Math.floor(unit.hp * skill.hpCostPct));
      unit.hp = Math.max(1, unit.hp - hpCost);
      this.writeLog(unit.name + " consumes " + hpCost + " HP.");
    }

    var multiplier = skill.multiplier;
    var targets = skill.targets;

    if (skill.lowHpThreshold && unit.hp / unit.maxHp <= skill.lowHpThreshold) {
      multiplier = skill.lowHpMultiplier;
      targets = skill.lowHpTargets || "all";
      this.writeLog(unit.name + " is below 50% HP: Combustion is enhanced.");
    }

    this.writeLog(unit.name + " uses " + skill.name + ".");
    if (targets === "all") {
      var living = this.getLiving("enemy");
      for (var i = 0; i < living.length; i++) {
        this.hitEnemy(unit, living[i], multiplier, skill.toughnessDamage);
      }
    } else {
      this.hitEnemy(unit, target, multiplier, skill.toughnessDamage);
    }

    if (skill.tilesGain) {
      unit.tiles = clamp(unit.tiles + skill.tilesGain, 0, skill.maxTiles || 4);
      this.writeLog(unit.name + " gains " + skill.tilesGain + " Tile(s) (" + unit.tiles + "/4).");
    }

    if (skill.mark === "prey") {
      unit.preyUid = target.alive ? target.uid : null;
      if (unit.preyUid) {
        this.writeLog(unit.name + " marks " + target.name + " as Prey.");
      }
    }

    if (skill.selfSpdBuff) {
      this.grantSpdBuff(unit, skill.selfSpdBuff.amount, skill.selfSpdBuff.turns);
    }
  };

  Battle.prototype.useUltimate = function (unit, target) {
    var ultimate = unit.kit.ultimate;
    unit.energy = clamp(unit.energy - (ultimate.energyCost || 0), 0, unit.maxEnergy);

    if (unit.characterId === "aglaea" && ultimate.type === "supremeStance") {
      this.writeLog(unit.name + " uses " + ultimate.name + ".");
      this.summonGarmentmaker(unit);
      this.startSupremeStance(unit);
      unit.av = 0;
      this.writeLog(unit.name + "'s action is advanced by 100%.");
      return;
    }

    var multiplier = ultimate.multiplier;
    if (ultimate.enhancedFirst && !unit.ultimateUsed) {
      multiplier *= ultimate.enhancedFirst;
      unit.ultimateUsed = true;
      this.writeLog(unit.name + "'s first Ultimate is enhanced.");
    }

    this.writeLog(unit.name + " uses " + ultimate.name + ".");
    var living = this.getLiving("enemy");

    if (ultimate.targets === "all") {
      for (var i = 0; i < living.length; i++) {
        this.hitEnemy(unit, living[i], multiplier, ultimate.toughnessDamage, false);
        if (ultimate.burn && living[i].alive) {
          this.applyDot(living[i], ultimate.burn, unit);
        }
      }
    } else if (ultimate.targets === "single_or_all") {
      var focus = target && target.alive ? target : living[0];
      if (focus) {
        var focusMultiplier = living.length === 1
          ? multiplier + (ultimate.allMultiplier || 0)
          : multiplier;
        this.hitEnemy(unit, focus, focusMultiplier, ultimate.toughnessDamage, false);
      }
    } else if (target) {
      this.hitEnemy(unit, target, multiplier, ultimate.toughnessDamage, false);
    }

    if (ultimate.tilesGain) {
      unit.tiles = clamp(unit.tiles + ultimate.tilesGain, 0, 4);
      this.writeLog(unit.name + " gains " + ultimate.tilesGain + " Tile(s) (" + unit.tiles + "/4).");
    }

    if (ultimate.summon) {
      unit.summonTurns = ultimate.summon.turns;
      unit.summonFreshAction = this.actionCount;
      this.writeLog(ultimate.summon.name + " is summoned.");
      var summonTarget = target && target.alive ? target : this.getLiving("enemy")[0];
      if (summonTarget) {
        this.garmentmakerAttack(unit, summonTarget);
      }
    }
  };

  Battle.prototype.useUltimateFree = function (unitUid, targetUid) {
    if (this.status !== "active") {
      return this.getState();
    }
    var unit = this.players.filter(function (player) {
      return player.uid === unitUid && player.alive;
    })[0];
    if (!unit || unit.energy < (unit.kit.ultimate.energyCost || 0)) {
      return this.getState();
    }
    var target = this.resolveTarget(targetUid);
    this.useUltimate(unit, target);
    this.checkEnd();
    return this.getState();
  };

  Battle.prototype.applyDot = function (target, dot, source) {
    if (!target.alive) {
      return;
    }
    var damage = Math.max(1, Math.floor(this.getAtk(source) * dot.multiplier));
    target.dots = target.dots || [];
    target.dots.push({
      type: dot.type || "DoT",
      damage: damage,
      turns: dot.turns || 2,
      element: dot.element || source.element
    });
    this.writeLog(target.name + " gains " + (dot.type || "DoT") + " (" + damage +
      " DMG per turn for " + (dot.turns || 2) + " turns).");
  };

  Battle.prototype.tickDots = function (unit) {
    if (!unit.dots || !unit.dots.length) {
      return true;
    }
    var self = this;
    unit.dots.forEach(function (dot) {
      if (!unit.alive) {
        return;
      }
      unit.damageVersion = (unit.damageVersion || 0) + 1;
      if (unit.infiniteHp) {
        self.writeLog(unit.name + " takes " + dot.damage + " " + dot.element + " DoT (∞ HP).");
      } else {
        unit.hp = Math.max(0, unit.hp - dot.damage);
        self.writeLog(unit.name + " takes " + dot.damage + " " + dot.element +
          " DoT (" + unit.hp + "/" + unit.maxHp + " HP).");
        if (unit.hp === 0) {
          unit.alive = false;
          self.writeLog(unit.name + " is defeated.");
        }
      }
      self.recordDamage(unit.uid, dot.damage, dot.element, null, "dot");
      dot.turns--;
    });
    unit.dots = unit.dots.filter(function (dot) {
      return dot.turns > 0;
    });
    return unit.alive;
  };

  Battle.prototype.hitEnemy = function (unit, target, multiplier, toughnessDamage, allowExtra) {
    if (!target || !target.alive) {
      return;
    }
    var wasBroken = target.broken;
    var hit = this.calculateDamage(unit, target, multiplier, unit.element);
    this.damageEnemy(target, hit.amount, unit.element, toughnessDamage, unit, hit);

    if (!target.alive) {
      this.clearPreyIfDead(target);
      return;
    }

    if (wasBroken && unit.kit.talent && unit.kit.talent.superBreakMaxHpPct &&
        isFinite(target.maxHp)) {
      var superBreak = Math.floor(target.maxHp * unit.kit.talent.superBreakMaxHpPct);
      target.damageVersion = (target.damageVersion || 0) + 1;
      target.hp = Math.max(0, target.hp - superBreak);
      this.writeLog("Super Break deals " + superBreak + " DMG to " + target.name + ".");
      this.recordDamage(target.uid, superBreak, unit.element, null, "superbreak");
      if (target.hp === 0) {
        target.alive = false;
        this.writeLog(target.name + " is defeated.");
        this.clearPreyIfDead(target);
        return;
      }
    }

    if (allowExtra !== false && unit.kit.empowerment &&
        unit.kit.empowerment.extraTargetsAt &&
        unit.threads >= unit.kit.empowerment.extraTargetsAt) {
      var extra = this.getLiving("enemy").filter(function (enemy) {
        return enemy.uid !== target.uid;
      })[0];
      if (extra) {
        var extraHit = this.calculateDamage(unit, extra, multiplier, unit.element);
        this.writeLog("Golden Thread: " + unit.name + " strikes an additional target.");
        this.damageEnemy(extra, extraHit.amount, unit.element, toughnessDamage, unit, extraHit);
        this.triggerPreyFollowUp(unit, extra);
      }
    }

    this.triggerPreyFollowUp(unit, target);
  };

  Battle.prototype.clearPreyIfDead = function (target) {
    var feixiao = this.players.filter(function (player) {
      return player.characterId === "feixiao" && player.preyUid === target.uid;
    })[0];
    if (feixiao) {
      feixiao.preyUid = null;
    }
  };

  Battle.prototype.triggerPreyFollowUp = function (attacker, target) {
    if (!target || !target.alive) {
      return;
    }
    var feixiao = this.players.filter(function (player) {
      return player.characterId === "feixiao" && player.alive;
    })[0];
    if (!feixiao || !feixiao.kit.empowerment ||
        feixiao.preyUid !== target.uid || attacker.uid === feixiao.uid) {
      return;
    }

    var threshold = feixiao.kit.empowerment.rayThreshold || 6;
    feixiao.rays = Math.min(threshold, feixiao.rays + 1);
    feixiao.followUps++;
    this.writeLog(feixiao.name + " follows up on Prey (" + feixiao.rays + "/" + threshold + " Flying Rays).");
    this.hitEnemy(feixiao, target, feixiao.kit.empowerment.followUpMultiplier || 0.6, 10, false);

    if (feixiao.rays >= threshold && !feixiao.raysPrimed) {
      feixiao.raysPrimed = true;
      feixiao.energy = feixiao.maxEnergy;
      this.writeLog(feixiao.name + " reaches " + threshold + " Flying Rays: Ultimate ready.");
    }
  };

  Battle.prototype.garmentmakerAttack = function (unit, target) {
    var summon = unit.kit.ultimate.summon;
    if (!summon) {
      return;
    }
    var living = this.getLiving("enemy");
    if (!living.length) {
      return;
    }
    if (!target || !target.alive) {
      target = living[0];
    }
    var hit = this.calculateDamage(unit, target, summon.multiplier, unit.element);
    this.writeLog("Garmentmaker attacks " + target.name + ".");
    this.damageEnemy(target, hit.amount, unit.element, summon.toughnessDamage, unit, hit);
  };

  Battle.prototype.grantSpdBuff = function (unit, amount, turns) {
    unit.buffs.push({
      stat: "spd",
      amount: amount,
      turns: turns,
      appliedOnAction: this.actionCount
    });
    unit.spdBuffEvents++;
    this.writeLog(unit.name + " gains +" + amount + " SPD for " + turns + " turns.");

    if (unit.kit.empowerment && unit.kit.empowerment.maxThreads) {
      var maxThreads = unit.kit.empowerment.maxThreads;
      unit.threads = Math.min(maxThreads, unit.threads + 1);
      this.writeLog("Golden Thread " + unit.threads + "/" + maxThreads + ".");
    }
  };

  Battle.prototype.tickBuffs = function (unit) {
    var self = this;
    unit.buffs = unit.buffs.filter(function (buff) {
      if (buff.appliedOnAction === self.actionCount) {
        return true;
      }
      buff.turns--;
      return buff.turns > 0;
    });
  };

  Battle.prototype.getTurnOrder = function (limit) {
    if (this.status !== "active") {
      return [];
    }
    limit = limit || 10;
    var self = this;
    var sim = this.units.filter(function (unit) {
      return unit.alive;
    }).map(function (unit) {
      return { unit: unit, av: unit.av };
    });
    var order = [];
    var elapsed = 0;

    for (var i = 0; i < limit && sim.length; i++) {
      var minAV = Math.min.apply(null, sim.map(function (entry) {
        return entry.av;
      }));

      if (minAV > 0) {
        sim.forEach(function (entry) {
          entry.av -= minAV;
        });
        elapsed += minAV;
      }

      var ready = sim.filter(function (entry) {
        return entry.av <= EPSILON;
      }).sort(function (a, b) {
        var speedDiff = self.getSpd(b.unit) - self.getSpd(a.unit);
        if (Math.abs(speedDiff) > EPSILON) {
          return speedDiff;
        }
        if (a.unit.side !== b.unit.side) {
          return a.unit.side === "player" ? -1 : 1;
        }
        return a.unit.uid < b.unit.uid ? -1 : 1;
      });

      var picked = ready[0];
      if (!picked) {
        break;
      }

      order.push({
        uid: picked.unit.uid,
        side: picked.unit.side,
        slot: picked.unit.slot,
        name: picked.unit.name,
        initials: picked.unit.initials,
        element: picked.unit.element,
        av: Math.round(elapsed * 10) / 10,
        broken: picked.unit.side === "enemy" ? picked.unit.broken : undefined
      });

      picked.av = 10000 / self.getSpd(picked.unit);
    }

    return order;
  };

  Battle.prototype.getState = function () {
    var self = this;
    return {
      status: this.status,
      elapsedAV: Math.round(this.elapsedAV * 10) / 10,
      turnLimitAV: this.turnLimitAV,
      sp: this.sp,
      maxSp: this.maxSp,
      actionCount: this.actionCount,
      waitingForPlayer: this.waitingForPlayer ? this.waitingForPlayer.uid : null,
      actions: this.getAvailableActions(),
      turnOrder: this.getTurnOrder(10),
      units: this.units.map(function (unit) {
        var isPlayer = unit.side === "player";
        var isEnemy = unit.side === "enemy";
        var isSummon = unit.side === "summon";
        var isCountdown = unit.side === "countdown";
        return {
          uid: unit.uid,
          side: unit.side,
          position: unit.position,
          slot: isPlayer ? unit.slot : undefined,
          characterId: isPlayer || isSummon ? unit.characterId : undefined,
          ownerUid: isSummon ? unit.ownerUid : undefined,
          isSummon: isSummon || undefined,
          isCountdown: isCountdown || undefined,
          color: unit.color,
          name: unit.name,
          initials: unit.initials,
          element: unit.element,
          hp: Math.max(0, Math.round(unit.hp * 10) / 10),
          maxHp: unit.maxHp,
          infiniteHp: unit.infiniteHp || undefined,
          damageVersion: unit.damageVersion || 0,
          atk: Math.round(self.getAtk(unit) * 10) / 10,
          def: Math.round(self.getDef(unit) * 10) / 10,
          spd: Math.round(self.getSpd(unit) * 10) / 10,
          av: Math.round(unit.av * 10) / 10,
          energy: isPlayer ? Math.round(unit.energy * 10) / 10 : undefined,
          maxEnergy: isPlayer ? unit.maxEnergy : undefined,
          critRate: unit.critRate,
          critDmg: unit.critDmg,
          luckyRate: unit.luckyRate,
          luckyDmg: unit.luckyDmg,
          ultReady: isPlayer ? unit.energy >= unit.maxEnergy : undefined,
          supremeStance: isPlayer ? unit.supremeStance : undefined,
          toughness: isEnemy ? unit.toughness : undefined,
          maxToughness: isEnemy ? unit.maxToughness : undefined,
          weakness: isEnemy ? unit.weakness.slice() : undefined,
          broken: isEnemy ? unit.broken : undefined,
          dots: isEnemy ? (unit.dots || []).map(function (dot) {
            return { type: dot.type, damage: dot.damage, turns: dot.turns, element: dot.element };
          }) : undefined,
          threads: isPlayer ? unit.threads : undefined,
          tiles: isPlayer ? unit.tiles : undefined,
          tempSp: isPlayer ? unit.tempSp : undefined,
          followUps: isPlayer ? unit.followUps : undefined,
          rays: isPlayer ? unit.rays : undefined,
          preyUid: isPlayer ? unit.preyUid : undefined,
          summonTurns: isPlayer ? unit.summonTurns : undefined,
          revives: isPlayer ? unit.revives : undefined,
          buffs: isPlayer || isSummon ? unit.buffs.map(function (buff) {
            return { stat: buff.stat, amount: buff.amount, turns: buff.turns };
          }) : undefined,
          alive: unit.alive
        };
      }),
      damageEvents: this.damageEvents.slice(-50),
      log: this.log.slice()
    };
  };

  Battle.prototype.runAuto = function (policy) {
    policy = policy || function (state, actions) {
      var ultimate = actions.filter(function (a) { return a.id === "ultimate" && a.available; })[0];
      if (ultimate) {
        return "ultimate";
      }
      var skill = actions.filter(function (a) { return a.id === "skill" && a.available; })[0];
      if (skill) {
        return "skill";
      }
      return "basic";
    };

    var guard = 0;
    while (this.status === "active" && guard < 100) {
      var state = this.getState();
      if (!state.waitingForPlayer) {
        this.step();
        guard++;
        continue;
      }
      var action = policy(state, state.actions);
      this.performAction(action);
      guard++;
    }
    return this.getState();
  };

  function createBattle(options) {
    return new Battle(options);
  }

  return {
    Battle: Battle,
    createBattle: createBattle,
    GENERIC_ENEMIES: GENERIC_ENEMIES
  };
});
