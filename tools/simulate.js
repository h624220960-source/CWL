"use strict";

global.window = global;
require("../characters.js");

var Combat = require("../combat.js");

function chooseAction(state) {
  var ultimate = state.actions.filter(function (action) {
    return action.id === "ultimate" && action.available;
  })[0];
  if (ultimate) {
    return "ultimate";
  }
  var skill = state.actions.filter(function (action) {
    return action.id === "skill" && action.available;
  })[0];
  if (skill) {
    return "skill";
  }
  return "basic";
}

function printState(state) {
  var players = state.units.filter(function (unit) { return unit.side === "player"; });
  var enemies = state.units.filter(function (unit) { return unit.side === "enemy" && unit.alive; });
  console.log(
    "AV " + state.elapsedAV + "/" + state.turnLimitAV +
    " | SP " + state.sp + "/" + state.maxSp +
    " | Players: " + players.map(function (player) {
      return player.name + " " + player.hp + "/" + player.maxHp + " HP, " +
        player.energy + "/" + player.maxEnergy + " Energy" +
        (player.ultReady ? " [ULT]" : "");
    }).join("; ") +
    " | Enemies: " + enemies.map(function (enemy) {
      return enemy.name + " " + enemy.hp + "/" + enemy.maxHp + " HP, " +
        enemy.toughness + "/" + enemy.maxToughness + " Toughness" +
        (enemy.broken ? " [BROKEN]" : "");
    }).join("; ")
  );
}

function run(seed) {
  console.log("=== Seed " + seed + " ===");
  var battle = Combat.createBattle({
    party: ["aglaea", "firefly", "feixiao", "qingque"],
    enemies: ["debtCollector", "debtCollector", "debtCollector"],
    seed: seed,
    turnLimitAV: 2500
  });

  var state = battle.getState();
  printState(state);

  var guard = 0;
  while (battle.status === "active" && guard < 100) {
    state = battle.getState();
    if (!state.waitingForPlayer) {
      battle.step();
      guard++;
      continue;
    }

    var before = battle.log.length;
    var action = chooseAction(state);
    battle.performAction(action);
    battle.log.slice(before).forEach(function (entry) {
      console.log("  [" + entry.av + "] " + entry.text);
    });
    guard++;
  }

  state = battle.getState();
  console.log("Result: " + state.status.toUpperCase() + " at " + state.elapsedAV + "/" + state.turnLimitAV + " AV.");
  console.log("");
  return state;
}

var outcomes = {};
[1, 2, 3, 7, 42].forEach(function (seed) {
  var state = run(seed);
  outcomes[state.status] = (outcomes[state.status] || 0) + 1;
});
console.log("Outcomes:", outcomes);
