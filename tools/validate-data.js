"use strict";

var path = require("path");
var chars = require(path.join(__dirname, "..", "characters.js"));
var data = require(path.join(__dirname, "..", "data", "cw-4.6.js"));

var errors = [];
var warnings = [];

function fail(message) {
  errors.push(message);
}

function warn(message) {
  warnings.push(message);
}

function unique(list, label, key) {
  var seen = {};
  list.forEach(function (entry) {
    var id = entry[key || "id"];
    if (!id) {
      fail(label + " entry is missing an id: " + JSON.stringify(entry));
      return;
    }
    if (seen[id]) {
      fail(label + " has duplicate id '" + id + "'.");
    }
    seen[id] = true;
  });
}

function isPos(value) {
  return value === "on" || value === "off" || value === "both";
}

/* Characters */

unique(chars.list, "Character");

var names = {};
chars.list.forEach(function (character) {
  if (names[character.name]) {
    fail("Duplicate character name: " + character.name);
  }
  names[character.name] = true;

  if ([1, 2, 3, 4, 5].indexOf(character.cost) === -1) {
    fail(character.id + ": cost must be 1-5.");
  }
  if (!isPos(character.position)) {
    fail(character.id + ": invalid position '" + character.position + "'.");
  }
  if (!character.stats || !(character.stats.hp > 0) || !(character.stats.atk > 0) ||
      !(character.stats.def >= 0) || !(character.stats.spd > 0)) {
    fail(character.id + ": invalid stats.");
  }
  if (!character.slots || !character.slots[character.position === "both" ? "on" : character.position]) {
    fail(character.id + ": missing kit for position '" + character.position + "'.");
  }
  if (character.position === "both" && (!character.slots.on || !character.slots.off)) {
    fail(character.id + ": 'both' characters need on and off kits.");
  }

  character.bonds.forEach(function (bondName) {
    var found = data.bonds.filter(function (bond) { return bond.name === bondName; })[0];
    var independent = data.independentBonds.filter(function (bond) { return bond.name === bondName; })[0];
    if (!found && !independent) {
      fail(character.id + ": unknown bond '" + bondName + "'.");
    }
  });

  if (character.combat) {
    var kit = character.combat;
    if (!kit.basic || !(kit.basic.multiplier > 0)) {
      fail(character.id + ": combat.basic.multiplier must be > 0.");
    }
    if (!kit.ultimate || !(kit.ultimate.energyCost > 0)) {
      fail(character.id + ": combat.ultimate.energyCost must be > 0.");
    }
    if (kit.maxEnergy !== undefined && !(kit.maxEnergy > 0)) {
      fail(character.id + ": combat.maxEnergy must be > 0.");
    }
  }
});

/* Data bonds */

unique(data.bonds, "Bond");

data.bonds.forEach(function (bond) {
  if (["faction", "school"].indexOf(bond.type) === -1) {
    fail("Bond " + bond.id + ": invalid type '" + bond.type + "'.");
  }
  if (!bond.thresholds.length) {
    fail("Bond " + bond.id + ": missing thresholds.");
  }
  for (var i = 1; i < bond.thresholds.length; i++) {
    if (!(bond.thresholds[i] > bond.thresholds[i - 1])) {
      fail("Bond " + bond.id + ": thresholds must be ascending.");
      break;
    }
  }
  if (bond.implemented && !bond.combat && !bond.economy && !bond.run) {
    fail("Bond " + bond.id + ": marked implemented but has no effect block.");
  }
  bond.members.forEach(function (member) {
    if (!names[member]) {
      warn("Bond " + bond.id + ": member '" + member + "' has no character implementation yet.");
    }
  });
});

unique(data.independentBonds, "Independent bond");

/* Equipment */

unique(data.equipment.basic, "Basic equipment");
data.equipment.basic.forEach(function (item) {
  if (!item.combat || Object.keys(item.combat).length === 0) {
    fail("Basic equipment " + item.id + ": missing combat block.");
  }
});

/* Enemies */

var enemyIds = Object.keys(data.enemies);
enemyIds.forEach(function (key) {
  var enemy = data.enemies[key];
  if (enemy.id !== key) {
    fail("Enemy key '" + key + "' does not match id '" + enemy.id + "'.");
  }
  if (!(enemy.hp > 0) || !(enemy.atk > 0) || !(enemy.def >= 0) || !(enemy.spd > 0)) {
    fail("Enemy " + key + ": invalid stats.");
  }
  if (!(enemy.toughness >= 0)) {
    fail("Enemy " + key + ": invalid toughness.");
  }
  if (!enemy.weakness || !enemy.weakness.length) {
    fail("Enemy " + key + ": missing weakness list.");
  }
  if (!enemy.basic) {
    fail("Enemy " + key + ": missing basic attack.");
  }
});

/* Run tables */

var run = data.run;

if (run.nodeSequence.length !== run.nodesPerPlane) {
  fail("run.nodeSequence must have nodesPerPlane entries.");
}
if (!run.nodeSequence.length || run.nodeSequence[run.nodeSequence.length - 1] !== "boss") {
  fail("run.nodeSequence must end with a boss node.");
}
Object.keys(run.shopOdds).forEach(function (level) {
  var table = run.shopOdds[level];
  var total = 0;
  Object.keys(table).forEach(function (cost) {
    total += table[cost];
  });
  if (Math.abs(total - 1) > 0.001) {
    fail("run.shopOdds[" + level + "] sums to " + total + ", expected 1.");
  }
});
Object.keys(run.xpToNext).forEach(function (level) {
  if (run.xpToNext[level] !== null && !(run.xpToNext[level] > 0)) {
    fail("run.xpToNext[" + level + "] must be positive or null.");
  }
});
if (run.rating.length < 2) {
  fail("run.rating needs at least two grades.");
}
if (run.planes * run.nodesPerPlane <= 0) {
  fail("run.planes and run.nodesPerPlane must be positive.");
}

/* Strategies / environments */

unique(data.strategies, "Strategy");
unique(data.environments, "Environment");

data.strategies.forEach(function (strategy) {
  if (strategy.implemented && !strategy.run) {
    fail("Strategy " + strategy.id + ": marked implemented but has no run effect.");
  }
});

data.environments.forEach(function (environment) {
  if (environment.implemented && !environment.run) {
    fail("Environment " + environment.id + ": marked implemented but has no run effect.");
  }
});

/* Report */

console.log("Currency Wars data validation");
console.log("  characters:   " + chars.list.length + " (" + chars.list.filter(function (c) { return c.combat; }).length + " with combat)");
console.log("  bonds:        " + data.bonds.length + " (" + data.bonds.filter(function (b) { return b.implemented; }).length + " implemented)");
console.log("  equipment:    " + data.equipment.basic.length + " basic");
console.log("  enemies:      " + enemyIds.length);
console.log("  strategies:   " + data.strategies.length + " (" + data.strategies.filter(function (s) { return s.implemented; }).length + " implemented)");
console.log("  environments: " + data.environments.length + " (" + data.environments.filter(function (e) { return e.implemented; }).length + " implemented)");

warnings.forEach(function (message) {
  console.warn("WARN  " + message);
});
errors.forEach(function (message) {
  console.error("ERROR " + message);
});

if (errors.length) {
  console.error("\n" + errors.length + " error(s).");
  process.exit(1);
}

console.log("\nOK");
