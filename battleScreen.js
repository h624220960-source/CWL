(function () {
  "use strict";

  var CW = window.CW;
  var DATA = window.CW_CHARACTERS;
  var Combat = window.CWCombat;

  if (!CW || !DATA || !Combat) {
    return;
  }

  var PARTY = ["aglaea", "firefly", "feixiao", "qingque"];
  var ENEMIES = ["debtCollector", "debtCollector", "debtCollector"];
  var TURN_LIMIT_AV = 2000;

  var screen = document.getElementById("screen-battle");
  var battleBack = document.getElementById("battleBack");
  var battleRestart = document.getElementById("battleRestart");
  var battleAV = document.getElementById("battleAV");
  var battleAVBar = document.getElementById("battleAVBar");
  var battleSP = document.getElementById("battleSP");
  var battleSPPips = document.getElementById("battleSPPips");
  var battleTurn = document.getElementById("battleTurn");
  var battleResult = document.getElementById("battleResult");
  var battleEnemies = document.getElementById("battleEnemies");
  var battlePlayers = document.getElementById("battlePlayers");
  var battleHint = document.getElementById("battleHint");
  var battleActions = document.getElementById("battleActions");
  var battleAuto = document.getElementById("battleAuto");
  var battleLog = document.getElementById("battleLog");
  var battleLogCount = document.getElementById("battleLogCount");
  var battleTurnOrder = document.getElementById("battleTurnOrder");
  var statsOverlay = document.getElementById("battleStatsOverlay");
  var statsBody = document.getElementById("battleStatsBody");
  var statsClose = document.getElementById("battleStatsClose");
  var damageLayer = document.getElementById("battleDamageLayer");
  var ultOverlay = document.getElementById("ultOverlay");
  var ultCaptionName = document.getElementById("ultCaptionName");
  var ultCaptionSkill = document.getElementById("ultCaptionSkill");

  var battle = null;
  var selectedTargetUid = null;
  var autoTimer = null;
  var enemyTimer = null;
  var hintOverride = "";
  var hintTimer = null;
  var lastDamageVersion = {};
  var lastDamageEventId = 0;
  var cinematicQueue = [];
  var cinematicActive = false;
  var cinematicUnitUid = null;
  var cinematicTimer = null;

  function esc(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function elementMeta(element) {
    return DATA.ELEMENTS[element] || { color: "#ffffff", icon: "?" };
  }

  function percent(value, max) {
    if (!max) {
      return 0;
    }
    if (value === Infinity || max === Infinity) {
      return 100;
    }
    return Math.max(0, Math.min(100, (value / max) * 100));
  }

  function formatNumber(value) {
    if (value === Infinity) {
      return "∞";
    }
    return Math.round(value * 10) / 10;
  }

  function playerUnits(state) {
    return state.units.filter(function (unit) {
      return unit.side === "player";
    });
  }

  function livingEnemies(state) {
    return state.units.filter(function (unit) {
      return unit.side === "enemy" && unit.alive;
    });
  }

  function unitByUid(state, uid) {
    return state.units.filter(function (unit) {
      return unit.uid === uid;
    })[0];
  }

  function selectedEnemy(state) {
    if (!selectedTargetUid) {
      return null;
    }
    var unit = unitByUid(state, selectedTargetUid);
    return unit && unit.alive && unit.side === "enemy" ? unit : null;
  }

  function activePlayer(state) {
    return state.waitingForPlayer ? unitByUid(state, state.waitingForPlayer) : null;
  }

  function barMarkup(label, value, max, className) {
    return (
      "<div class='unit-bar-meta'><span>" + esc(label) + "</span><span>" +
      formatNumber(value) + " / " + formatNumber(max) + "</span></div>" +
      "<div class='unit-bar " + className + "'><span style='width:" +
      percent(value, max) + "%'></span></div>"
    );
  }

  function elementBadge(element) {
    var meta = elementMeta(element);
    return (
      "<span class='battle-element' style='--el:" + meta.color + "'>" +
      meta.icon + " " + esc(element) + "</span>"
    );
  }

  function playerResourceText(unit) {
    if (unit.characterId === "aglaea") {
      return "Threads " + unit.threads + "/5";
    }
    if (unit.characterId === "firefly") {
      return "Break +30% · Super Break";
    }
    if (unit.characterId === "feixiao") {
      return "Rays " + unit.rays + "/6 · Follow-ups " + unit.followUps;
    }
    if (unit.characterId === "qingque") {
      return "Tiles " + unit.tiles + "/4 · Temp SP " + unit.tempSp;
    }
    return "On-Field";
  }

  function enemyResourceText(unit) {
    var parts = ["Weak: " + unit.weakness.join(", ")];
    if (unit.broken) {
      parts.push("Broken");
    }
    if (unit.dots && unit.dots.length) {
      parts.push(unit.dots.map(function (dot) {
        return dot.type + " " + dot.turns;
      }).join(", "));
    }
    return parts.join(" · ");
  }

  function unitCircle(unit, state) {
    var isPlayer = unit.side === "player";
    var meta = elementMeta(unit.element);
    var selected = !isPlayer && selectedTargetUid === unit.uid;
    var active = isPlayer && state.waitingForPlayer === unit.uid;
    var ready = isPlayer && unit.ultReady;
    var classes = "unit-circle-wrap " + (isPlayer ? "player" : "enemy");

    if (selected) {
      classes += " selected";
    }
    if (active) {
      classes += " active";
    }
    if (ready) {
      classes += " ult-ready";
    }
    if (!unit.alive) {
      classes += " defeated";
    }
    if (cinematicUnitUid === unit.uid) {
      classes += " ult-focus";
    }

    var above = barMarkup("HP", unit.hp, unit.maxHp, "unit-bar-hp");
    var below = isPlayer
      ? barMarkup("Energy", unit.energy, unit.maxEnergy, "unit-bar-energy")
      : barMarkup("Toughness", unit.toughness, unit.maxToughness, "unit-bar-toughness");
    var hotkey = isPlayer ? "<span class='unit-hotkey'>" + unit.slot + "</span>" : "";
    var status = isPlayer
      ? (unit.supremeStance ? "Supreme Stance" : (active ? "Acting" : (ready ? "Ult ready" : "On-Field")))
      : (unit.broken ? "Broken" : "Enemy");

    return (
      "<div class='" + classes + "' data-uid='" + esc(unit.uid) + "' data-side='" + unit.side + "'>" +
      "<div class='unit-bars above'>" + above + "</div>" +
      "<button type='button' class='unit-circle' style='--el:" + meta.color + "'" +
      (!isPlayer && !unit.alive ? " disabled" : "") + ">" +
      "<span class='unit-initials'>" + esc(unit.initials) + "</span>" +
      hotkey +
      "</button>" +
      "<div class='unit-bars below'>" + below + "</div>" +
      "<div class='unit-label'>" + esc(unit.name) + "</div>" +
      "<div class='unit-status" + (ready ? " ready" : "") + "'>" + esc(status) + "</div>" +
      "<div class='unit-resources'>" + esc(isPlayer ? playerResourceText(unit) : enemyResourceText(unit)) + "</div>" +
      "</div>"
    );
  }

  function renderHud(state) {
    battleAV.textContent = formatNumber(state.elapsedAV) + " / " + state.turnLimitAV;
    battleAVBar.style.width = percent(state.elapsedAV, state.turnLimitAV) + "%";
    battleAVBar.parentNode.classList.toggle("danger", percent(state.elapsedAV, state.turnLimitAV) >= 75);
    battleSP.textContent = state.sp + " / " + state.maxSp;

    var pips = "";
    for (var i = 0; i < state.maxSp; i++) {
      pips += "<span class='sp-pip" + (i < state.sp ? " filled" : "") + "'></span>";
    }
    battleSPPips.innerHTML = pips;

    if (state.status === "victory") {
      battleTurn.textContent = "Victory";
    } else if (state.status === "defeat") {
      battleTurn.textContent = "Defeat";
    } else if (state.waitingForPlayer) {
      var active = activePlayer(state);
      battleTurn.textContent = active ? active.name : "Player";
    } else if (state.turnOrder.length && state.turnOrder[0].side === "enemy") {
      battleTurn.textContent = "Enemy turn";
    } else {
      battleTurn.textContent = "Resolving...";
    }
  }

  function renderTurnOrder(state) {
    if (!state.turnOrder || !state.turnOrder.length) {
      battleTurnOrder.innerHTML = "<p class='turn-empty muted'>No turns remaining.</p>";
      return;
    }

    battleTurnOrder.innerHTML = state.turnOrder.map(function (entry, index) {
      var meta = elementMeta(entry.element);
      var color = entry.color || meta.color;
      var current = index === 0;
      var acting = state.waitingForPlayer === entry.uid;
      var sideLabel = entry.side === "player" ? "Player" :
        entry.side === "summon" ? "Summon" :
          entry.side === "countdown" ? "Countdown" : "Enemy";
      var label = current ? (acting ? "Acting" : "Next") : sideLabel;

      if (entry.broken) {
        label = "Broken";
      }

      return (
        "<div class='turn-entry " + entry.side + (current ? " current" : "") + "'>" +
        "<span class='turn-avatar' style='--el:" + color + "'>" +
        esc(entry.initials) +
        (entry.side === "player" ? "<span class='turn-slot'>" + entry.slot + "</span>" : "") +
        "</span>" +
        "<span class='turn-info'>" +
        "<span class='turn-name'>" + esc(entry.name) + "</span>" +
        "<span class='turn-meta'>" + esc(label) + "</span>" +
        "</span>" +
        "<span class='turn-av'>" + (current ? (acting ? "NOW" : "NEXT") : "+" + formatNumber(entry.av)) + "</span>" +
        "</div>"
      );
    }).join("");
  }

  function detectDamage(state) {
    var damaged = [];
    state.units.forEach(function (unit) {
      var version = unit.damageVersion || 0;
      var previous = lastDamageVersion[unit.uid];
      if (previous !== undefined && version > previous) {
        damaged.push(unit.uid);
      }
      lastDamageVersion[unit.uid] = version;
    });
    return damaged;
  }

  function flashDamage(uids) {
    uids.forEach(function (uid) {
      var element = battleEnemies.querySelector("[data-uid='" + uid + "']") ||
        battlePlayers.querySelector("[data-uid='" + uid + "']");
      if (!element) {
        return;
      }
      element.classList.remove("damage-flash");
      void element.offsetWidth;
      element.classList.add("damage-flash");
      setTimeout(function () {
        element.classList.remove("damage-flash");
      }, 520);
    });
  }

  function renderDamageNumbers(state) {
    var events = state.damageEvents || [];
    events.forEach(function (event) {
      if (event.id <= lastDamageEventId) {
        return;
      }
      lastDamageEventId = event.id;

      var target = battleEnemies.querySelector("[data-uid='" + event.uid + "']") ||
        battlePlayers.querySelector("[data-uid='" + event.uid + "']");
      if (!target) {
        return;
      }

      var rect = target.getBoundingClientRect();
      var number = document.createElement("span");
      var classes = "damage-number damage-" + (event.kind || "hit");
      if (event.crit) {
        classes += " damage-crit";
      }
      if (event.lucky) {
        classes += " damage-lucky";
      }
      number.className = classes;
      var text = "";
      if (event.crit) {
        text += "CRIT ";
      }
      if (event.lucky) {
        text += "LUCKY ";
      }
      text += formatNumber(event.amount);
      number.textContent = text;
      number.style.left = (rect.left + rect.width / 2 + (Math.random() * 34 - 17)) + "px";
      number.style.top = (rect.top + rect.height * 0.3) + "px";
      damageLayer.appendChild(number);
      setTimeout(function () {
        number.remove();
      }, 1100);
    });
  }

  function positionUltOverlay(unitUid, color) {
    var target = battlePlayers.querySelector("[data-uid='" + unitUid + "']") ||
      battleEnemies.querySelector("[data-uid='" + unitUid + "']");
    if (!target) {
      return;
    }
    var rect = target.getBoundingClientRect();
    ultOverlay.style.setProperty("--ult-x", (rect.left + rect.width / 2) + "px");
    ultOverlay.style.setProperty("--ult-y", (rect.top + rect.height / 2) + "px");
    if (color) {
      ultOverlay.style.setProperty("--ult-color", color);
    }
  }

  function playNextCinematic() {
    if (!cinematicQueue.length) {
      cinematicActive = false;
      cinematicUnitUid = null;
      ultOverlay.hidden = true;
      ultOverlay.classList.remove("active");
      screen.classList.remove("time-slow");
      render();
      return;
    }

    var next = cinematicQueue.shift();
    cinematicActive = true;
    cinematicUnitUid = next.unitUid;
    ultCaptionName.textContent = next.name;
    ultCaptionSkill.textContent = next.skill;
    ultOverlay.hidden = false;
    ultOverlay.classList.add("active");
    screen.classList.add("time-slow");
    render();
    positionUltOverlay(next.unitUid, next.color);

    if (cinematicTimer) {
      clearTimeout(cinematicTimer);
    }
    cinematicTimer = setTimeout(function () {
      cinematicTimer = null;
      ultOverlay.classList.remove("active");
      screen.classList.remove("time-slow");
      cinematicActive = false;
      cinematicUnitUid = null;
      render();
      setTimeout(playNextCinematic, 120);
    }, 900);
  }

  function startUltCinematic(unitUid, name, skill, color) {
    cinematicQueue.push({
      unitUid: unitUid,
      name: name,
      skill: skill,
      color: color
    });
    if (!cinematicActive) {
      playNextCinematic();
    }
  }

  function stopCinematics() {
    cinematicQueue = [];
    if (cinematicTimer) {
      clearTimeout(cinematicTimer);
      cinematicTimer = null;
    }
    cinematicActive = false;
    cinematicUnitUid = null;
    ultOverlay.hidden = true;
    ultOverlay.classList.remove("active");
    screen.classList.remove("time-slow");
  }

  function ultimateName(unit) {
    var character = unit.characterId ? DATA.byId(unit.characterId) : null;
    return character && character.combat
      ? character.combat.ultimate.name
      : (unit.name + "'s Ultimate");
  }

  function renderEnemies(state) {
    battleEnemies.innerHTML = state.units.filter(function (unit) {
      return unit.side === "enemy";
    }).map(function (unit) {
      return unitCircle(unit, state);
    }).join("");
  }

  function summonCircle(unit) {
    var meta = elementMeta(unit.element);
    return (
      "<div class='summon-circle-wrap' data-uid='" + esc(unit.uid) + "' data-side='summon'>" +
      "<div class='summon-hp-meta'><span>HP</span><span>" +
      formatNumber(unit.hp) + " / " + formatNumber(unit.maxHp) + "</span></div>" +
      "<div class='unit-bar unit-bar-hp summon-hp'><span style='width:" +
      percent(unit.hp, unit.maxHp) + "%'></span></div>" +
      "<span class='summon-circle' style='--el:" + meta.color + "'>" + esc(unit.initials) + "</span>" +
      "<span class='summon-label'>" + esc(unit.name) + "</span>" +
      "<span class='summon-status'>Summon</span>" +
      "</div>"
    );
  }

  function renderPlayers(state) {
    battlePlayers.innerHTML = playerUnits(state).map(function (unit) {
      var summons = state.units.filter(function (candidate) {
        return candidate.side === "summon" && candidate.ownerUid === unit.uid && candidate.alive;
      });
      return (
        "<div class='player-group'>" +
        unitCircle(unit, state) +
        summons.map(summonCircle).join("") +
        "</div>"
      );
    }).join("");
  }

  function actionMeta(characterId, actionId, action) {
    var kit = DATA.byId(characterId).combat;
    if (characterId === "aglaea") {
      if (actionId === "basic") {
        return action && action.name === kit.basic.enhanced.name
          ? "Joint ATK · 200% + 90% ATK · No SP"
          : "50% ATK · +1 SP";
      }
      if (actionId === "skill") {
        return "Summon / heal Garmentmaker · -1 SP";
      }
      return "Supreme Stance · " + kit.ultimate.energyCost + " Energy";
    }
    if (actionId === "basic") {
      return Math.round(kit.basic.multiplier * 100) + "% ATK · +" + kit.basic.spGain + " SP";
    }
    if (actionId === "skill") {
      return Math.round(kit.skill.multiplier * 100) + "% ATK · -" + kit.skill.spCost +
        " SP" + (kit.skill.selfSpdBuff ? " · +" + kit.skill.selfSpdBuff.amount + " SPD" : "");
    }
    return Math.round(kit.ultimate.multiplier * 100) + "% ATK · " +
      (kit.ultimate.targets === "all" ? "All enemies" : "Single target") +
      " · " + kit.ultimate.energyCost + " Energy";
  }

  function fallbackActionsFor(unit) {
    var characterId = unit ? unit.characterId : PARTY[0];
    var kit = DATA.byId(characterId).combat;
    return [
      { id: "basic", name: kit.basic.name, available: false, needsTarget: true },
      { id: "skill", name: kit.skill.name, available: false, needsTarget: kit.skill.type !== "summon" },
      { id: "ultimate", name: kit.ultimate.name, available: false, needsTarget: false }
    ];
  }

  function renderActions(state) {
    var isPlayerTurn = state.status === "active" && !!state.waitingForPlayer;
    var active = activePlayer(state);
    var target = selectedEnemy(state);
    var actions = state.actions.length ? state.actions : fallbackActionsFor(active);
    var characterId = active ? active.characterId : PARTY[0];

    battleActions.innerHTML = actions.map(function (action) {
      var needsTarget = action.needsTarget !== false && action.id !== "ultimate";
      var disabled = !isPlayerTurn || !action.available || (needsTarget && !target);
      var reason = "";
      if (!isPlayerTurn) {
        reason = state.status === "active" ? "Waiting" : "Battle over";
      } else if (!action.available) {
        reason = action.reason;
      } else if (needsTarget && !target) {
        reason = "Select a target";
      }

      return (
        "<button type='button' class='battle-action" +
        (action.id === "ultimate" ? " battle-action-ultimate" : "") +
        "' data-action='" + esc(action.id) + "'" + (disabled ? " disabled" : "") + ">" +
        "<span class='battle-action-name'>" + esc(action.name) + "</span>" +
        "<span class='battle-action-meta'>" + esc(actionMeta(characterId, action.id, action)) + "</span>" +
        (reason ? "<span class='battle-action-reason'>" + esc(reason) + "</span>" : "") +
        "</button>"
      );
    }).join("");

    if (hintOverride) {
      battleHint.textContent = hintOverride;
    } else if (state.status === "victory") {
      battleHint.textContent = "Victory. Restart to run the sandbox again.";
    } else if (state.status === "defeat") {
      battleHint.textContent = "Defeat. The Action Value limit was reached.";
    } else if (!isPlayerTurn) {
      battleHint.textContent = state.turnOrder.length && state.turnOrder[0].side === "enemy"
        ? "Enemy turn. You can still press 1-4 to use a ready Ultimate."
        : "Resolving the next turn. You can still press 1-4 to use a ready Ultimate.";
    } else if (!target) {
      var noTargetSkill = actions.filter(function (action) {
        return action.id === "skill" && action.available && action.needsTarget === false;
      })[0];
      battleHint.textContent = noTargetSkill
        ? "Select a target for attacks, or use " + noTargetSkill.name + " without a target. Press 1-4 for Ultimates."
        : "Select an enemy target, then use Basic ATK or Skill. Press 1-4 for Ultimates.";
    } else {
      battleHint.textContent = "Target: " + target.name + ". Choose an action or press 1-4 for an Ultimate.";
    }
  }

  function logClass(text) {
    if (text.indexOf("Victory") === 0) {
      return " battle-log-victory";
    }
    if (text.indexOf("Defeat") === 0) {
      return " battle-log-defeat";
    }
    if (text.indexOf("Weakness-Broken") !== -1 || text.indexOf("Super Break") !== -1) {
      return " battle-log-break";
    }
    if (text.indexOf("Golden Thread") !== -1 || text.indexOf("Flying Rays") !== -1) {
      return " battle-log-buff";
    }
    if (text.indexOf("summoned") !== -1) {
      return " battle-log-summon";
    }
    return "";
  }

  function renderLog(state) {
    var entries = state.log.slice(-60);
    battleLog.innerHTML = entries.map(function (entry) {
      return (
        "<div class='battle-log-entry" + logClass(entry.text) + "'>" +
        "<span class='battle-log-av'>[" + formatNumber(entry.av) + "]</span>" +
        "<span>" + esc(entry.text) + "</span>" +
        "</div>"
      );
    }).join("");
    battleLog.scrollTop = battleLog.scrollHeight;
    battleLogCount.textContent = entries.length + " shown / " + state.log.length + " total";
  }

  function renderResult(state) {
    if (state.status === "active") {
      battleResult.hidden = true;
      battleResult.className = "battle-result";
      battleResult.innerHTML = "";
      return;
    }

    battleResult.hidden = false;
    battleResult.className = "battle-result " + state.status;
    battleResult.innerHTML =
      "<strong>" + (state.status === "victory" ? "Victory" : "Defeat") + "</strong>" +
      "<span>" + (state.status === "victory"
        ? "All enemies defeated at " + formatNumber(state.elapsedAV) + " AV."
        : "The " + state.turnLimitAV + " AV limit expired.") + "</span>";
  }

  function flashHint(text) {
    hintOverride = text;
    if (hintTimer) {
      clearTimeout(hintTimer);
    }
    hintTimer = setTimeout(function () {
      hintOverride = "";
      hintTimer = null;
      render();
    }, 1800);
    render();
  }

  function render() {
    if (!battle) {
      return;
    }
    var state = battle.getState();
    var damaged = detectDamage(state);

    if (selectedTargetUid && !selectedEnemy(state)) {
      selectedTargetUid = null;
    }
    if (state.status !== "active") {
      stopAuto();
      stopEnemyTimer();
    }

    renderHud(state);
    renderTurnOrder(state);
    renderEnemies(state);
    renderPlayers(state);
    renderActions(state);
    renderResult(state);
    renderLog(state);
    flashDamage(damaged);
    renderDamageNumbers(state);

    if (cinematicActive && cinematicUnitUid) {
      var cinematicUnit = unitByUid(state, cinematicUnitUid);
      positionUltOverlay(cinematicUnitUid,
        cinematicUnit ? elementMeta(cinematicUnit.element).color : null);
    }

    if (!statsOverlay.hidden) {
      renderStats();
    }
  }

  function renderStats() {
    if (!battle || statsOverlay.hidden) {
      return;
    }
    var state = battle.getState();
    var unit = unitByUid(state, statsOverlay.getAttribute("data-uid"));
    if (!unit || unit.side !== "player") {
      closeStats();
      return;
    }

    var character = DATA.byId(unit.characterId);
    var meta = elementMeta(unit.element);
    var abilities = character.slots.on.abilities;
    var resources = [
      { label: "Energy", value: unit.energy + " / " + unit.maxEnergy }
    ];

    if (unit.characterId === "aglaea") {
      resources.push({ label: "Threads", value: unit.threads + " / 5" });
      resources.push({ label: "Supreme Stance", value: unit.supremeStance ? "Active" : "Inactive" });
      var garmentmaker = state.units.filter(function (candidate) {
        return candidate.side === "summon" && candidate.ownerUid === unit.uid && candidate.alive;
      })[0];
      resources.push({
        label: "Garmentmaker",
        value: garmentmaker ? formatNumber(garmentmaker.hp) + " / " + formatNumber(garmentmaker.maxHp) + " HP" : "None"
      });
    } else if (unit.characterId === "firefly") {
      resources.push({ label: "Break Effect", value: "+30%" });
      resources.push({ label: "Super Break", value: "5% max HP" });
    } else if (unit.characterId === "feixiao") {
      resources.push({ label: "Flying Rays", value: unit.rays + " / 6" });
      resources.push({ label: "Follow-Ups", value: unit.followUps + " / 3" });
      var prey = unit.preyUid ? unitByUid(state, unit.preyUid) : null;
      resources.push({ label: "Prey", value: prey ? prey.name : "None" });
    } else if (unit.characterId === "qingque") {
      resources.push({ label: "Tiles", value: unit.tiles + " / 4" });
      resources.push({ label: "Temporary SP", value: String(unit.tempSp) });
    }

    var buffMarkup = "";
    if (unit.buffs && unit.buffs.length) {
      buffMarkup = "<h4>Active Buffs</h4><ul>" + unit.buffs.map(function (buff) {
        return "<li>" + esc(buff.stat) + " +" + esc(buff.amount) + " (" + buff.turns + " turns)</li>";
      }).join("") + "</ul>";
    }

    statsBody.innerHTML =
      "<div class='char-detail-head'>" +
      "<span class='char-el char-el-lg' style='--el:" + meta.color + "'>" + meta.icon + "</span>" +
      "<div>" +
      "<h2 id='battleStatsName'>" + esc(character.name) + "</h2>" +
      "<div class='char-meta'>" +
      "<span class='cost-badge cost-" + character.cost + "'>" + esc(DATA.COST_LABEL[character.cost]) + "</span>" +
      elementBadge(character.element) +
      "<span class='path-tag'>" + esc(character.path) + "</span>" +
      "<span class='pos-badge pos-on'>" + esc(unit.position === "on" ? "On-Field" : "Off-Field") + "</span>" +
      "</div>" +
      "<div class='char-bonds'>" + character.bonds.map(function (bond) {
        return "<span class='bond-tag'>" + esc(bond) + "</span>";
      }).join("") + "</div>" +
      "</div>" +
      "</div>" +
      "<p class='char-note'>" + esc(character.note) + "</p>" +
      "<div class='stat-grid'>" +
      "<div><span>HP</span><strong>" + formatNumber(unit.hp) + " / " + unit.maxHp + "</strong></div>" +
      "<div><span>ATK</span><strong>" + formatNumber(unit.atk) + "</strong></div>" +
      "<div><span>DEF</span><strong>" + formatNumber(unit.def) + "</strong></div>" +
      "<div><span>SPD</span><strong>" + formatNumber(unit.spd) + "</strong></div>" +
      "</div>" +
      "<div class='stat-grid'>" +
      resources.map(function (resource) {
        return "<div><span>" + esc(resource.label) + "</span><strong>" + esc(resource.value) + "</strong></div>";
      }).join("") +
      "</div>" +
      "<div class='stat-grid'>" +
      "<div><span>CRIT Rate</span><strong>" + Math.round((unit.critRate || 0) * 100) + "%</strong></div>" +
      "<div><span>CRIT DMG</span><strong>" + Math.round((unit.critDmg || 0) * 100) + "%</strong></div>" +
      "<div><span>Lucky Rate</span><strong>" + Math.round((unit.luckyRate || 0) * 100) + "%</strong></div>" +
      "<div><span>Lucky DMG</span><strong>" + Math.round((unit.luckyDmg || 0) * 100) + "%</strong></div>" +
      "</div>" +
      buffMarkup +
      "<h4>Kit</h4>" +
      "<div class='ability-list'>" +
      abilities.map(function (ability) {
        return "<div class='ability'>" +
          "<div class='ability-head'>" +
          "<span class='ability-slot'>" + esc(ability.slot) + "</span>" +
          "<strong>" + esc(ability.name) + "</strong>" +
          "</div><p>" + esc(ability.text) + "</p></div>";
      }).join("") +
      "</div>" +
      "<div class='empower'><span class='empower-tag'>CW Empowerment</span><p>" +
      esc(character.slots.on.empowerment) + "</p></div>" +
      "<p class='lab-note'>Stats show the current battle values, including buffs and Golden Threads. Press 1-4 to use this character's Ultimate when it is ready.</p>";
  }

  function openStats(uid) {
    statsOverlay.setAttribute("data-uid", uid);
    statsOverlay.hidden = false;
    document.body.style.overflow = "hidden";
    renderStats();
  }

  function closeStats() {
    statsOverlay.hidden = true;
    statsOverlay.removeAttribute("data-uid");
    document.body.style.overflow = "";
  }

  function chooseAutoAction(state) {
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

  function stopEnemyTimer() {
    if (enemyTimer) {
      clearTimeout(enemyTimer);
      enemyTimer = null;
    }
  }

  function enemyStep() {
    enemyTimer = null;
    if (!battle) {
      return;
    }
    if (cinematicActive) {
      enemyTimer = setTimeout(enemyStep, 250);
      return;
    }
    var state = battle.getState();
    if (state.status !== "active" || state.waitingForPlayer) {
      render();
      return;
    }

    battle.stepOnce();
    render();
    state = battle.getState();
    if (state.status === "active" && !state.waitingForPlayer) {
      enemyTimer = setTimeout(enemyStep, 450);
    }
  }

  function startEnemyTurns() {
    if (!battle || enemyTimer) {
      return;
    }
    var state = battle.getState();
    if (state.status !== "active" || state.waitingForPlayer) {
      return;
    }
    enemyTimer = setTimeout(enemyStep, 350);
  }

  function autoStep() {
    if (!battle) {
      return;
    }
    var state = battle.getState();
    if (state.status !== "active") {
      stopAuto();
      render();
      return;
    }
    if (enemyTimer || cinematicActive) {
      return;
    }
    if (!state.waitingForPlayer) {
      startEnemyTurns();
      return;
    }

    var ready = state.units.filter(function (unit) {
      return unit.side === "player" && unit.alive && unit.ultReady;
    });
    if (ready.length) {
      var ultimateUser = ready[0];
      var target = livingEnemies(state)[0];
      startUltCinematic(ultimateUser.uid, ultimateUser.name, ultimateName(ultimateUser),
        elementMeta(ultimateUser.element).color);
      battle.useUltimateFree(ultimateUser.uid, target ? target.uid : null);
      render();
      return;
    }

    var enemy = livingEnemies(state)[0];
    if (!enemy) {
      render();
      return;
    }
    var action = chooseAutoAction(state);
    battle.performAction(action, enemy.uid, { autoStep: false });
    selectedTargetUid = null;
    render();
    startEnemyTurns();
  }

  function stopAuto() {
    if (autoTimer) {
      clearInterval(autoTimer);
      autoTimer = null;
    }
    battleAuto.checked = false;
  }

  function startAuto() {
    if (!battle || battle.getState().status !== "active") {
      battleAuto.checked = false;
      return;
    }
    if (autoTimer) {
      return;
    }
    autoTimer = setInterval(autoStep, 650);
    autoStep();
  }

  function fireUltimate(slot) {
    if (!battle) {
      return;
    }
    var state = battle.getState();
    if (state.status !== "active") {
      return;
    }
    var unit = state.units.filter(function (candidate) {
      return candidate.side === "player" && candidate.slot === slot;
    })[0];
    if (!unit) {
      return;
    }
    if (!unit.ultReady) {
      flashHint(unit.name + "'s Ultimate is not ready (" +
        Math.floor(unit.energy) + "/" + unit.maxEnergy + " Energy).");
      return;
    }
    if (autoTimer) {
      stopAuto();
    }
    var target = selectedEnemy(state) || livingEnemies(state)[0];
    startUltCinematic(unit.uid, unit.name, ultimateName(unit), elementMeta(unit.element).color);
    battle.useUltimateFree(unit.uid, target ? target.uid : null);
    render();
  }

  function performPlayerAction(actionId) {
    if (!battle) {
      return;
    }
    var state = battle.getState();
    if (state.status !== "active" || !state.waitingForPlayer) {
      return;
    }
    var action = state.actions.filter(function (candidate) {
      return candidate.id === actionId;
    })[0];
    if (action && action.needsTarget !== false && actionId !== "ultimate" && !selectedEnemy(state)) {
      flashHint("Select an enemy target first.");
      return;
    }
    if (autoTimer) {
      stopAuto();
    }

    if (actionId === "ultimate") {
      var active = activePlayer(state);
      if (active) {
        startUltCinematic(active.uid, active.name, ultimateName(active),
          elementMeta(active.element).color);
      }
    }

    battle.performAction(actionId, selectedTargetUid, { autoStep: false });
    if (actionId !== "ultimate") {
      selectedTargetUid = null;
      render();
      startEnemyTurns();
    } else {
      render();
    }
  }

  function startNewBattle() {
    stopAuto();
    stopEnemyTimer();
    stopCinematics();
    closeStats();
    selectedTargetUid = null;
    hintOverride = "";
    lastDamageVersion = {};
    lastDamageEventId = 0;
    battle = Combat.createBattle({
      party: PARTY,
      enemies: ENEMIES,
      seed: Math.floor(Math.random() * 100000) + 1,
      turnLimitAV: TURN_LIMIT_AV,
      infiniteEnemyHp: true
    });
    render();
  }

  function open() {
    startNewBattle();
    CW.showScreen(screen);
  }

  function back() {
    stopAuto();
    stopEnemyTimer();
    stopCinematics();
    closeStats();
    CW.showScreen("screen-modes");
  }

  battleEnemies.addEventListener("click", function (event) {
    var wrap = event.target.closest("[data-uid]");
    if (!wrap || !battle) {
      return;
    }
    var state = battle.getState();
    if (state.status !== "active" || !state.waitingForPlayer) {
      return;
    }
    var unit = unitByUid(state, wrap.getAttribute("data-uid"));
    if (!unit || !unit.alive) {
      return;
    }
    if (autoTimer) {
      stopAuto();
    }
    selectedTargetUid = unit.uid;
    render();
  });

  battlePlayers.addEventListener("click", function (event) {
    var wrap = event.target.closest("[data-uid]");
    if (!wrap || !battle) {
      return;
    }
    openStats(wrap.getAttribute("data-uid"));
  });

  battleActions.addEventListener("click", function (event) {
    var button = event.target.closest(".battle-action");
    if (!button || button.disabled) {
      return;
    }
    performPlayerAction(button.getAttribute("data-action"));
  });

  battleAuto.addEventListener("change", function () {
    if (battleAuto.checked) {
      startAuto();
    } else {
      stopAuto();
    }
  });

  battleRestart.addEventListener("click", startNewBattle);
  battleBack.addEventListener("click", back);
  statsClose.addEventListener("click", closeStats);
  statsOverlay.addEventListener("click", function (event) {
    if (event.target === statsOverlay) {
      closeStats();
    }
  });

  document.addEventListener("keydown", function (event) {
    if (screen.hidden) {
      return;
    }
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName)) {
      return;
    }
    if (!statsOverlay.hidden) {
      if (event.key === "Escape") {
        closeStats();
      }
      return;
    }
    if (event.repeat) {
      return;
    }
    var slot = Number(event.key);
    if (slot >= 1 && slot <= 4) {
      event.preventDefault();
      fireUltimate(slot);
    }
  });

  window.CWBattle = {
    open: open,
    restart: startNewBattle,
    getState: function () {
      return battle ? battle.getState() : null;
    }
  };
})();
