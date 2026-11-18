"use strict";

var assert = require("assert");
var path = require("path");
var RunEngine = require(path.join(__dirname, "..", "run.js"));
var Combat = require(path.join(__dirname, "..", "combat.js"));

function playRun(seed) {
  var run = RunEngine.createRun({ seed: seed });
  var state = run.getState();
  run.chooseEnvironment(state.environmentOffer[0].id);
  var guard = 0;

  while (run.getState().phase !== "ended" && guard < 200) {
    guard++;
    state = run.getState();

    if (state.phase === "map") {
      run.enterNode();
    } else if (state.phase === "encounter") {
      run.chooseEncounterDifficulty("easy");
    } else if (state.phase === "battle") {
      var battle = Combat.createBattle(state.battleConfig);
      var battleState = battle.runAuto();
      run.finishBattle({
        victory: battleState.status === "victory",
        elapsedAV: battleState.elapsedAV,
        turnLimit: battleState.turnLimitAV
      });
    } else if (state.phase === "reward") {
      run.continueNode();
    } else if (state.phase === "supply") {
      run.chooseSupply(state.supplyOffer[0].id);
    } else if (state.phase === "strategy") {
      run.chooseStrategy(state.strategyOffer[0].id);
    } else {
      throw new Error("Run stalled in phase " + state.phase);
    }
  }

  assert(guard < 200, "run should not hit the guard limit");
  return run.getState();
}

(function testSeededRunsComplete() {
  [1, 2, 123].forEach(function (seed) {
    var state = playRun(seed);
    assert.strictEqual(state.phase, "ended", "seed " + seed + " should end");
    assert(["victory", "defeat"].indexOf(state.outcome) !== -1, "seed " + seed + " should have an outcome");
    assert(state.rating, "seed " + seed + " should have a rating");
    assert(state.units.length > 0, "seed " + seed + " should keep its units");
    assert(state.squadHp >= 0 && state.squadHp <= state.maxSquadHp, "Squad HP must stay in bounds");
  });
})();

(function testMerge() {
  var run = RunEngine.createRun({ seed: 5 });
  run.chooseEnvironment(run.getState().environmentOffer[0].id);
  run.units = [];
  run.deployment = {};
  var a = run.addUnit("herta", 1);
  run.addUnit("herta", 1);
  run.addUnit("herta", 1);
  run.tryMerge();
  var merged = run.units.filter(function (unit) {
    return unit.id === "herta" && unit.star === 2;
  });
  assert.strictEqual(merged.length, 1, "three 1-star copies should merge into one 2-star");
  assert.strictEqual(run.units.length, 1, "merge should consume the copies");
})();

(function testInterestCap() {
  var run = RunEngine.createRun({ seed: 6 });
  run.gold = 12;
  assert.strictEqual(run.interest(), 1, "12 Gold should give 1 interest");
  run.gold = 30;
  assert.strictEqual(run.interest(), 3, "30 Gold should give 3 interest");
  run.gold = 100;
  assert.strictEqual(run.interest(), 5, "interest should cap at 5");
})();

(function testDeploymentRules() {
  var run = RunEngine.createRun({ seed: 7 });
  run.chooseEnvironment(run.getState().environmentOffer[0].id);
  run.units = [];
  run.deployment = {};
  var onUnit = run.addUnit("aglaea", 1);
  var offUnit = run.addUnit("huohuo", 1);
  var benchUnit = run.addUnit("qingque", 1);
  var extraUnit = run.addUnit("asta", 1);

  assert.strictEqual(run.deployUnit(onUnit.uid, "off"), false, "On-Field-only units cannot go Off-Field");
  assert.strictEqual(run.deployUnit(offUnit.uid, "on"), false, "Off-Field-only units cannot go On-Field");
  assert.strictEqual(run.deployUnit(onUnit.uid, "on"), true, "On-Field unit should deploy");
  assert.strictEqual(run.deployUnit(offUnit.uid, "off"), true, "Off-Field unit should deploy");
  assert.strictEqual(run.deployUnit(benchUnit.uid, "on"), true, "third unit should fill team size 3");
  assert.strictEqual(run.deployUnit(extraUnit.uid, "off"), false, "team size 3 should be full");
  assert.strictEqual(run.benchUnit(onUnit.uid), true, "bench should work");
  assert.strictEqual(run.deployUnit(extraUnit.uid, "off"), true, "a free slot should deploy");
})();

(function testBattleConfigAndBonds() {
  var run = RunEngine.createRun({ seed: 8 });
  run.chooseEnvironment(run.getState().environmentOffer[0].id);
  run.units = [];
  run.deployment = {};
  var aglaea = run.addUnit("aglaea", 1);
  var tribbie = run.addUnit("tribbie", 1);
  var huohuo = run.addUnit("huohuo", 1);
  run.deployUnit(aglaea.uid, "on");
  run.deployUnit(tribbie.uid, "on");
  run.deployUnit(huohuo.uid, "off");

  var bonds = run.activeBonds();
  var dayDemigod = bonds.filter(function (bond) { return bond.id === "day_demigod"; })[0];
  var energy = bonds.filter(function (bond) { return bond.id === "energy"; })[0];
  var heal = bonds.filter(function (bond) { return bond.id === "heal"; })[0];
  assert(dayDemigod && dayDemigod.level > 0, "Day Demigod should activate");
  assert(energy && energy.level > 0, "Energy should activate");
  assert(heal && heal.count > 0, "Heal should track its member");

  run.phase = "map";
  run.activeNode = { plane: 0, index: 1, type: "battle" };
  var config = run.startBattle(null);
  assert.strictEqual(config.roster.length, 3, "battle roster should include deployed units");
  assert(config.bonds.length >= 1, "battle config should pass implemented bonds");
  assert(config.roster.some(function (unit) { return unit.position === "off"; }), "battle roster should include off-field units");
})();

(function testEquipmentApplication() {
  var run = RunEngine.createRun({ seed: 9 });
  run.chooseEnvironment(run.getState().environmentOffer[0].id);
  run.units = [];
  run.deployment = {};
  var aglaea = run.addUnit("aglaea", 1);
  run.deployment[aglaea.uid] = "on";
  run.inventory = ["photon_cell", "roller_skates"];
  assert.strictEqual(run.equip(aglaea.uid, "photon_cell"), true, "equip should succeed");
  assert.strictEqual(run.equip(aglaea.uid, "roller_skates"), true, "equip should succeed");

  run.activeNode = { plane: 0, index: 1, type: "battle" };
  var config = run.startBattle(null);
  var battle = Combat.createBattle(config);
  var player = battle.players[0];
  assert.strictEqual(player.energy, 175 + 15, "Photon Cell should add 15 starting Energy");
  assert(player.base.spd > 112, "Roller Skates should raise SPD");
})();

(function testStarScaling() {
  var run = RunEngine.createRun({ seed: 10 });
  run.chooseEnvironment(run.getState().environmentOffer[0].id);
  run.units = [];
  run.deployment = {};
  var one = run.addUnit("aglaea", 1);
  var two = run.addUnit("aglaea", 2);
  run.deployment[one.uid] = "on";
  run.deployment[two.uid] = "on";
  run.activeNode = { plane: 0, index: 1, type: "battle" };
  var config = run.startBattle(null);
  var battle = Combat.createBattle(config);
  var onePlayer = battle.players.filter(function (p) { return p.star === 1; })[0];
  var twoPlayer = battle.players.filter(function (p) { return p.star === 2; })[0];
  assert(twoPlayer.maxHp > onePlayer.maxHp, "2-star units should have higher HP");
})();


(function testShopLockAndOdds() {
  var run = RunEngine.createRun({ seed: 11 });
  run.chooseEnvironment(run.getState().environmentOffer[0].id);
  var before = run.getState().shop.map(function (slot) { return slot ? slot.id : null; });
  assert.strictEqual(run.getState().shopOdds.length, 5, "shop odds should expose five cost tiers");
  run.toggleShopLock();
  run.rollShop();
  var after = run.getState().shop.map(function (slot) { return slot ? slot.id : null; });
  assert.deepStrictEqual(after, before, "locked shop should not reroll");
  run.toggleShopLock();
})();

(function testBattleConfigMetadata() {
  var run = RunEngine.createRun({ seed: 12 });
  run.chooseEnvironment(run.getState().environmentOffer[0].id);
  run.activeNode = { plane: 0, index: 1, type: "battle" };
  var config = run.startBattle(null);
  assert.strictEqual(config.label, "1-2", "battle label should be plane-node");
  assert.strictEqual(config.nodeType, "battle", "battle config should record the node type");
  assert.strictEqual(typeof config.squadHp, "number", "battle config should expose Squad HP");
  assert.strictEqual(typeof config.gold, "number", "battle config should expose Gold");
})();

console.log("Run tests passed.");

