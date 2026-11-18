"use strict";

var assert = require("assert");

global.window = global;
require("../characters.js");

var Combat = require("../combat.js");

function runAutoBattle(options) {
  var battle = Combat.createBattle(options);
  return battle.runAuto();
}

(function testVictoryAndCoreMechanics() {
  var state = runAutoBattle({ seed: 1 });
  assert.strictEqual(state.status, "victory", "default auto battle should end in victory");
  assert(state.log.some(function (entry) {
    return entry.text.indexOf("Weakness-Broken") !== -1;
  }), "battle should trigger Weakness Break");
  assert(state.log.some(function (entry) {
    return entry.text.indexOf("Garmentmaker uses Thorned Snare") !== -1;
  }), "Garmentmaker should attack with Thorned Snare");
  assert(state.sp >= 0 && state.sp <= state.maxSp, "Skill Points must stay in bounds");
  assert(state.units.filter(function (unit) {
    return unit.side === "player";
  }).every(function (unit) {
    return unit.energy >= 0 && unit.energy <= unit.maxEnergy;
  }), "Energy must stay in bounds");
})();

(function testTurnLimitDefeat() {
  var battle = Combat.createBattle({
    seed: 1,
    turnLimitAV: 1
  });
  assert.strictEqual(battle.getState().status, "defeat", "1 AV limit should end in defeat");
})();

(function testSkillPointGate() {
  var battle = Combat.createBattle({
    seed: 1,
    startSp: 0
  });
  var state = battle.getState();
  var skill = state.actions.filter(function (action) {
    return action.id === "skill";
  })[0];
  assert.strictEqual(skill.available, false, "Skill should be unavailable at 0 SP");
  var basic = state.actions.filter(function (action) {
    return action.id === "basic";
  })[0];
  assert.strictEqual(basic.available, true, "Basic ATK should always be available");
})();

(function testRevive() {
  var battle = Combat.createBattle({ seed: 1 });
  var player = battle.players[0];
  player.hp = 10;
  battle.damagePlayer(player, 999, battle.enemies[0]);
  assert(player.hp > 0, "player should revive instead of staying at 0 HP");
  assert.strictEqual(player.revives, 1, "revive count should increment");
  assert(battle.elapsedAV >= 200, "revive should add 200 AV");
})();

(function testFourPlayerPartyAndFreeUltimate() {
  var battle = Combat.createBattle({
    party: ["aglaea", "firefly", "feixiao", "qingque"],
    enemies: ["debtCollector", "debtCollector", "debtCollector"],
    seed: 2,
    turnLimitAV: 2500
  });
  var state = battle.getState();
  assert.strictEqual(state.units.filter(function (unit) {
    return unit.side === "player";
  }).length, 4, "four-player party should construct");

  var qingque = battle.players.filter(function (player) {
    return player.characterId === "qingque";
  })[0];
  qingque.energy = 100;
  var waitingBefore = battle.waitingForPlayer ? battle.waitingForPlayer.uid : null;
  var after = battle.useUltimateFree(qingque.uid, null);
  var qingqueState = after.units.filter(function (unit) {
    return unit.characterId === "qingque";
  })[0];

  assert.strictEqual(after.waitingForPlayer, waitingBefore, "free Ultimate should not consume the active turn");
  assert.strictEqual(qingqueState.energy, 0, "free Ultimate should spend Energy");
  assert(qingqueState.tiles >= 1, "Qingque Ultimate should grant a Tile");
})();

(function testQingqueTemporarySkillPoint() {
  var battle = Combat.createBattle({
    party: ["qingque"],
    enemies: ["debtCollector"],
    seed: 3,
    startSp: 0
  });
  var qingque = battle.players[0];
  var enemy = battle.enemies[0];
  var skill = battle.getAvailableActions().filter(function (action) {
    return action.id === "skill";
  })[0];
  assert.strictEqual(skill.available, true, "Qingque Skill should be available with temporary SP");

  battle.performAction("skill", enemy.uid, { autoStep: false });
  assert.strictEqual(battle.sp, 0, "temporary SP should not change team SP");
  assert.strictEqual(qingque.tempSp, 1, "Qingque should spend one temporary SP");
  assert.strictEqual(qingque.tiles, 1, "Qingque Skill should add a Tile");
})();

(function testFireflyBurn() {
  var battle = Combat.createBattle({
    party: ["firefly"],
    enemies: ["debtCollector"],
    seed: 4
  });
  var firefly = battle.players[0];
  var enemy = battle.enemies[0];
  enemy.hp = 99999;
  enemy.maxHp = 99999;
  firefly.energy = 100;
  battle.useUltimateFree(firefly.uid, enemy.uid);
  assert.strictEqual(enemy.dots.length, 1, "Firefly Ultimate should apply Burn");

  battle.performAction("basic", enemy.uid, { autoStep: false });
  var hpBeforeTick = enemy.hp;
  battle.stepOnce();
  assert(enemy.hp < hpBeforeTick, "Burn should deal damage at the start of the enemy turn");
})();

(function testFeixiaoPreyFollowUp() {
  var battle = Combat.createBattle({
    party: ["aglaea", "feixiao"],
    enemies: ["debtCollector"],
    seed: 5
  });
  var aglaea = battle.players.filter(function (player) {
    return player.characterId === "aglaea";
  })[0];
  var feixiao = battle.players.filter(function (player) {
    return player.characterId === "feixiao";
  })[0];
  var enemy = battle.enemies[0];

  battle.useSkill(feixiao, enemy);
  assert.strictEqual(feixiao.preyUid, enemy.uid, "Feixiao Skill should mark Prey");
  battle.useBasic(aglaea, enemy);
  assert.strictEqual(feixiao.rays, 1, "Ally attack on Prey should grant a Flying Ray");
  assert.strictEqual(feixiao.followUps, 1, "Ally attack on Prey should trigger a follow-up");
})();

(function testTurnOrderForecast() {
  var battle = Combat.createBattle({
    party: ["aglaea", "firefly"],
    enemies: ["debtCollector", "debtCollector"],
    seed: 6
  });
  var state = battle.getState();
  assert(state.turnOrder.length > 0, "turn order should be populated");
  assert.strictEqual(state.turnOrder[0].uid, state.waitingForPlayer, "the waiting player should be first");
  assert(state.turnOrder.every(function (entry) {
    return entry.av >= 0 && entry.initials;
  }), "turn order entries should include AV and initials");
})();

(function testAglaeaMemospriteAndSupremeStance() {
  var battle = Combat.createBattle({
    party: ["aglaea"],
    enemies: ["debtCollector"],
    seed: 7,
    turnLimitAV: 5000
  });
  var aglaea = battle.players[0];
  var enemy = battle.enemies[0];

  battle.performAction("skill", enemy.uid, { autoStep: false });
  assert.strictEqual(battle.summons.length, 1, "Aglaea Skill should summon Garmentmaker");
  var garmentmaker = battle.summons[0];
  assert.strictEqual(garmentmaker.maxHp, 1446, "Garmentmaker max HP should use 66% + 720");
  assert(Math.abs(garmentmaker.base.spd - 39.2) < 0.1, "Garmentmaker SPD should be 35% of Aglaea's SPD");
  assert.strictEqual(garmentmaker.av, 0, "Garmentmaker should be action-advanced when summoned");

  battle.step();
  aglaea.energy = 350;
  battle.useUltimateFree(aglaea.uid, enemy.uid);
  var state = battle.getState();
  var basic = state.actions.filter(function (action) { return action.id === "basic"; })[0];
  var skill = state.actions.filter(function (action) { return action.id === "skill"; })[0];
  assert.strictEqual(aglaea.supremeStance, true, "Ultimate should enter Supreme Stance");
  assert.strictEqual(basic.name, "Slash by a Thousandfold Kiss", "Basic should be enhanced in Supreme Stance");
  assert.strictEqual(skill.available, false, "Skill should be locked in Supreme Stance");
  assert(state.units.some(function (unit) { return unit.isCountdown; }), "Supreme Stance should add a countdown");

  battle.useBasic(aglaea, enemy);
  state = battle.getState();
  assert(state.log.some(function (entry) {
    return entry.text.indexOf("Slash by a Thousandfold Kiss") !== -1;
  }), "Supreme Stance Basic should be a Joint ATK");
})();

(function testSupremeStanceCountdown() {
  var battle = Combat.createBattle({
    party: ["aglaea"],
    enemies: ["debtCollector", "debtCollector", "debtCollector"],
    seed: 8,
    turnLimitAV: 5000
  });
  var aglaea = battle.players[0];
  aglaea.energy = 350;
  battle.useUltimateFree(aglaea.uid, null);
  assert.strictEqual(aglaea.supremeStance, true, "Ultimate should start Supreme Stance");
  assert.strictEqual(battle.summons.length, 1, "Ultimate should summon Garmentmaker");

  battle.performAction("basic", battle.enemies[0].uid, { autoStep: false });
  var countdown = battle.units.filter(function (unit) { return unit.isCountdown; })[0];
  assert(countdown, "Supreme Stance countdown should exist");
  battle.units.forEach(function (unit) {
    if (unit !== countdown) {
      unit.av = 9999;
    }
  });
  countdown.av = 0;
  battle.stepOnce();

  assert.strictEqual(aglaea.supremeStance, false, "Countdown should end Supreme Stance");
  assert.strictEqual(battle.summons.length, 0, "Countdown should remove Garmentmaker");
})();

(function testInfiniteEnemyHp() {
  var battle = Combat.createBattle({
    party: ["aglaea"],
    enemies: ["debtCollector"],
    seed: 9,
    turnLimitAV: 150,
    infiniteEnemyHp: true
  });
  var enemy = battle.enemies[0];
  assert.strictEqual(enemy.hp, Infinity, "infinite enemy HP should be Infinity");
  battle.performAction("basic", enemy.uid, { autoStep: false });
  assert.strictEqual(enemy.hp, Infinity, "infinite enemy should remain at Infinity HP");
  assert(enemy.damageVersion > 0, "infinite enemy should still register damage for flash effects");

  var state = battle.runAuto();
  assert.strictEqual(state.status, "defeat", "infinite-HP run should end at the AV limit");
  assert.strictEqual(state.elapsedAV, 150, "elapsed AV should be capped at 150");
})();

(function testCritAndLuckyStrike() {
  var battle = Combat.createBattle({
    party: ["aglaea"],
    enemies: ["debtCollector"],
    seed: 10
  });
  var aglaea = battle.players[0];
  aglaea.critRate = 1;
  aglaea.critDmg = 0.5;
  aglaea.luckyRate = 1;
  aglaea.luckyDmg = 0.5;

  battle.useBasic(aglaea, battle.enemies[0]);
  var event = battle.damageEvents[battle.damageEvents.length - 1];
  assert(event, "damage event should be recorded");
  assert.strictEqual(event.crit, true, "guaranteed CRIT should roll true");
  assert.strictEqual(event.lucky, true, "guaranteed Lucky Strike should roll true");
  assert(event.amount > 0, "damage event should have an amount");
})();


(function testOffFieldAutomation() {
  var battle = Combat.createBattle({
    roster: [
      { id: "aglaea", position: "on" },
      { id: "kafka", position: "off" }
    ],
    enemies: ["debtCollector", "debtCollector"],
    bonds: [{ id: "dot", level: 2 }],
    seed: 11,
    turnLimitAV: 1500
  });
  var kafka = battle.players.filter(function (player) { return player.characterId === "kafka"; })[0];
  var aglaea = battle.players.filter(function (player) { return player.characterId === "aglaea"; })[0];
  assert(kafka, "off-field Kafka should construct");
  assert.strictEqual(kafka.position, "off", "Kafka should be Off-Field");
  assert(battle.getTargetableAllies().every(function (unit) {
    return unit.uid !== kafka.uid;
  }), "Off-Field units should not be targetable");

  battle.waitingForPlayer = null;
  battle.units.forEach(function (unit) {
    unit.av = unit.uid === kafka.uid ? 0 : 9999;
  });
  battle.stepOnce();
  assert(battle.log.some(function (entry) {
    return entry.text.indexOf("hexes") !== -1 || entry.text.indexOf("support") !== -1;
  }), "off-field unit should act automatically");
})();

(function testBondAndEquipmentModifiers() {
  var plain = Combat.createBattle({
    roster: [{ id: "aglaea", position: "on" }],
    enemies: ["debtCollector"],
    seed: 12
  });
  var bonded = Combat.createBattle({
    roster: [{ id: "aglaea", position: "on" }],
    enemies: ["debtCollector"],
    bonds: [{ id: "energy", level: 2 }, { id: "day_demigod", level: 2 }],
    seed: 12
  });
  assert(bonded.players[0].energy > plain.players[0].energy, "Energy bond should raise starting Energy");
  assert(bonded.getSpd(bonded.players[0]) > plain.getSpd(plain.players[0]), "Day Demigod should raise SPD");

  var equipped = Combat.createBattle({
    roster: [{ id: "aglaea", position: "on", equipment: ["photon_cell", "roller_skates"] }],
    enemies: ["debtCollector"],
    seed: 12
  });
  assert.strictEqual(equipped.players[0].energy, plain.players[0].energy + 15, "Photon Cell should add 15 starting Energy");
  assert(equipped.getSpd(equipped.players[0]) > plain.getSpd(plain.players[0]), "Roller Skates should raise SPD");
})();

(function testStarScalingAndEnemySkill() {
  var battle = Combat.createBattle({
    roster: [{ id: "aglaea", position: "on", star: 2 }],
    enemies: ["rivalBroker"],
    seed: 13,
    turnLimitAV: 1500
  });
  var aglaea = battle.players[0];
  var plain = Combat.createBattle({
    roster: [{ id: "aglaea", position: "on" }],
    enemies: ["debtCollector"],
    seed: 13
  });
  assert(aglaea.maxHp > plain.players[0].maxHp, "2-star units should have higher HP");

  var enemy = battle.enemies[0];
  enemy.turnCount = 1;
  battle.enemyTurn(enemy);
  assert(battle.log.some(function (entry) {
    return entry.text.indexOf("Short Sell") !== -1;
  }), "rivalBroker should use its every-2-turns skill");
})();


(function testBondDamagePanelData() {
  var battle = Combat.createBattle({
    roster: [{ id: "aglaea", position: "on" }],
    enemies: ["debtCollector"],
    bonds: [{ id: "energy", level: 2 }],
    seed: 14
  });
  var initial = battle.getState().bondDamage;
  assert(initial.some(function (entry) { return entry.id === "energy" && entry.amount === 0; }),
    "active bonds should appear with zero damage before combat");
  battle.useBasic(battle.players[0], battle.enemies[0]);
  var after = battle.getState().bondDamage.filter(function (entry) {
    return entry.id === "energy";
  })[0];
  assert(after && after.amount > 0, "Bond DMG should accumulate from player damage");
})();

(function testEnemyNumbering() {
  var battle = Combat.createBattle({
    party: ["aglaea"],
    enemies: ["debtCollector", "debtCollector", "ipcEnforcer"],
    seed: 15
  });
  assert.strictEqual(battle.enemies[0].name, "Debt Collector", "first enemy should have no suffix");
  assert.strictEqual(battle.enemies[1].name, "Debt Collector 2", "duplicate enemies should be numbered");
  assert.strictEqual(battle.enemies[2].name, "IPC Enforcer", "unique enemies should not be numbered");
})();

console.log("Combat tests passed.");


