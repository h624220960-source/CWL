(function () {
  "use strict";

  var CW = window.CW;
  var RunEngine = window.CWRun;
  var Battle = window.CWBattle;
  var DATA = window.CW_DATA;
  var CHARS = window.CW_CHARACTERS;

  if (!CW || !RunEngine || !Battle || !DATA || !CHARS) {
    return;
  }

  var screen = document.getElementById("screen-run");
  var avatarEl = document.getElementById("runAvatar");
  var levelBadge = document.getElementById("runLevelBadge");
  var phaseLabel = document.getElementById("runPhaseLabel");
  var nodeTrack = document.getElementById("runNodeTrack");
  var squadHpTop = document.getElementById("runSquadHpTop");
  var bondsEl = document.getElementById("runBonds");
  var strategiesEl = document.getElementById("runStrategies");
  var environmentEl = document.getElementById("runEnvironment");
  var boardArea = document.getElementById("runBoardArea");
  var shopPanel = document.getElementById("runShopPanel");
  var shopEl = document.getElementById("runShop");
  var oddsEl = document.getElementById("runOdds");
  var shopSearch = document.getElementById("runShopSearch");
  var lockBtn = document.getElementById("runLock");
  var hideShopBtn = document.getElementById("runHideShop");
  var onSlots = document.getElementById("runOnSlots");
  var offSlots = document.getElementById("runOffSlots");
  var onCount = document.getElementById("runOnCount");
  var offCount = document.getElementById("runOffCount");
  var rerollBtn = document.getElementById("runReroll");
  var refreshCostEl = document.getElementById("runRefreshCost");
  var expLevelEl = document.getElementById("runLevel");
  var xpEl = document.getElementById("runXp");
  var buyXpBtn = document.getElementById("runBuyXp");
  var buyXpCostEl = document.getElementById("runBuyXpCost");
  var benchEl = document.getElementById("runBench");
  var goldEl = document.getElementById("runGold");
  var storeBtn = document.getElementById("runStoreToggle");
  var battleBtn = document.getElementById("runBattle");
  var nodeHint = document.getElementById("runNodeHint");
  var miniLog = document.getElementById("runMiniLog");
  var abandonBtn = document.getElementById("runAbandon");
  var backBtn = document.getElementById("runBack");
  var codexBtn = document.getElementById("runCodexBtn");
  var gearBtn = document.getElementById("runGearBtn");
  var overlay = document.getElementById("runOverlay");
  var overlayTitle = document.getElementById("runOverlayTitle");
  var overlayBody = document.getElementById("runOverlayBody");
  var overlayClose = document.getElementById("runOverlayClose");

  var run = null;
  var shopHidden = false;
  var shopFilter = "";
  var pendingEnvironmentId = null;
  var gearOpen = false;
  var dragUid = null;

  var NODE_LABEL = {
    reward: "Reward",
    battle: "Battle",
    supply: "Supply",
    encounter: "Encounter",
    boss: "Boss"
  };

  var NODE_GLYPH = {
    reward: "\u25c6",
    battle: "\u2694",
    supply: "\u25a3",
    encounter: "?",
    boss: "\u2620"
  };

  var NODE_HINT = {
    reward: "Low-risk node: gain Gold and a piece of basic equipment.",
    battle: "Combat node against a competitor squad.",
    supply: "Choose one piece of basic equipment for free.",
    encounter: "Choose a difficulty; higher difficulty pays more Gold.",
    boss: "Plane boss. Clearing it advances the run."
  };

  function esc(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function initials(name) {
    var parts = String(name).replace(/[^A-Za-z0-9 ]/g, "").trim().split(/\s+/);
    if (parts.length > 1) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return String(name).slice(0, 2).toUpperCase();
  }

  function elementColor(element) {
    return (CHARS.ELEMENTS[element] || {}).color || "#ffffff";
  }

  function starPips(star) {
    var out = "";
    for (var i = 0; i < star; i++) {
      out += "\u2605";
    }
    return out;
  }

  function equipmentName(id) {
    var item = DATA.equipmentById(id);
    return item ? item.name : id;
  }

  function currentRunState() {
    return run ? run.getState() : null;
  }

  function findUnit(state, uid) {
    return state.units.filter(function (unit) {
      return unit.uid === uid;
    })[0] || null;
  }

  function open() {
    if (!run || run.getState().phase === "ended") {
      newRunState();
    }
    CW.showScreen(screen);
    render();
  }

  function newRunState() {
    run = RunEngine.createRun({ seed: Math.floor(Math.random() * 1000000) + 1 });
    shopHidden = false;
    shopFilter = "";
    pendingEnvironmentId = null;
    gearOpen = false;
    if (shopSearch) {
      shopSearch.value = "";
    }
    hideOverlay();
  }

  function newRun() {
    newRunState();
    CW.showScreen(screen);
    render();
  }

  function renderTop(state) {
    var user = (CW.getUser && CW.getUser()) || "S";
    avatarEl.textContent = user.charAt(0).toUpperCase();
    levelBadge.textContent = state.level;
    phaseLabel.textContent = (state.plane + 1) + "-" + Math.min(state.nodeIndex + 1, state.nodeCount);
    squadHpTop.textContent = state.squadHp;

    nodeTrack.innerHTML = state.nodes.map(function (node) {
      var classes = "cw-node";
      if (node.done) {
        classes += " done";
      }
      if (node.current) {
        classes += " current";
      }
      return "<button type='button' class='" + classes + "' data-run-action='" +
        (node.current ? "enter" : "none") + "' title='" + esc(NODE_LABEL[node.type]) + "'>" +
        "<span>" + NODE_GLYPH[node.type] + "</span>" +
        "</button>";
    }).join("");
  }

  function renderBonds(state) {
    environmentEl.innerHTML = state.environment
      ? "<span class='cw-env-label'>Environment</span><strong>" + esc(state.environment.name) + "</strong>"
      : "<span class='cw-env-label'>Environment</span><strong>None</strong>";

    if (!state.bonds.length) {
      bondsEl.innerHTML = "<p class='cw-rail-empty'>No Bonds active</p>";
    } else {
      bondsEl.innerHTML = state.bonds.map(function (bond) {
        var next = bond.thresholds.filter(function (threshold) {
          return bond.count < threshold;
        })[0];
        var suffix = bond.level > 0 ? "Lv " + bond.level : "needs " + next;
        return "<div class='cw-bond" + (bond.level > 0 ? " active" : "") + "' title='" +
          esc(bond.effect) + "'>" +
          "<span class='cw-bond-icon'>" + esc(initials(bond.name)) + "</span>" +
          "<span class='cw-bond-text'><strong>" + esc(bond.name) + "</strong>" +
          "<small>" + esc(suffix) + " \u00b7 " + esc(bond.thresholds.join("/")) + "</small></span>" +
          "</div>";
      }).join("");
    }

    strategiesEl.innerHTML = state.strategies.length
      ? state.strategies.map(function (strategy) {
        return "<span class='cw-strategy'>" + esc(strategy.name) + "</span>";
      }).join("")
      : "<p class='cw-rail-empty'>None</p>";
  }

  function costLabel(cost) {
    return (CHARS.COST_LABEL || {})[cost] || (cost + "-cost");
  }

  function renderShop(state) {
    var canShop = state.phase === "map";
    var reduce = state.environment && state.environment.implemented === false ? 0 : 0;
    oddsEl.innerHTML = [1, 2, 3, 4, 5].map(function (cost) {
      var entry = state.shopOdds.filter(function (odd) {
        return odd.cost === cost;
      })[0];
      var chance = entry ? Math.round(entry.chance * 100) : 0;
      return "<span class='cw-odd cost-" + cost + "'>" + chance + "%</span>";
    }).join("");

    var visible = state.shop.filter(function (slot) {
      return slot && (!shopFilter || slot.name.toLowerCase().indexOf(shopFilter.toLowerCase()) !== -1);
    });

    if (!visible.length) {
      shopEl.innerHTML = "<p class='cw-shop-empty'>No characters match.</p>";
    } else {
      shopEl.innerHTML = visible.map(function (slot) {
        var character = CHARS.byId(slot.id);
        var index = state.shop.indexOf(slot);
        return "<div class='cw-shop-card cost-" + slot.cost +
          (canShop && state.gold >= slot.price ? "" : " disabled") + "'" +
          " draggable='false' data-run-action='buy' data-index='" + index + "'>" +
          "<div class='cw-card-top'><span class='cw-trial'>Trial</span>" +
          "<span class='cw-cost-pill'>" + slot.cost + "</span></div>" +
          "<div class='cw-portrait' style='--el:" + elementColor(character.element) + "'>" +
          esc(initials(slot.name)) + "</div>" +
          "<div class='cw-card-name'>" + esc(slot.name) + "</div>" +
          "<div class='cw-card-bonds'>" + esc(character.bonds.slice(0, 2).join(" \u00b7 ")) + "</div>" +
          "<div class='cw-card-price'><span class='cw-card-stars'>" + starPips(slot.star) + "</span>" +
          "<span class='cw-coin'></span>" + slot.price + "</div>" +
          "</div>";
      }).join("");
    }

    shopPanel.hidden = shopHidden;
    boardArea.classList.toggle("shop-hidden", shopHidden);
    hideShopBtn.textContent = shopHidden ? "Show" : "Hide";
    lockBtn.textContent = state.shopLocked ? "Locked" : "Lock";
    lockBtn.classList.toggle("active", state.shopLocked);
    lockBtn.disabled = !canShop;
    rerollBtn.disabled = !canShop || state.gold < state.refreshCost;
    refreshCostEl.textContent = state.refreshCost;
  }

  function gearMarkup(state, unit) {
    var chips = unit.equipment.map(function (equipmentId) {
      return "<span class='cw-gear' title='" + esc(equipmentName(equipmentId)) + "'>" +
        "<span>" + esc(equipmentName(equipmentId).slice(0, 2)) + "</span>" +
        "<button type='button' data-run-action='unequip' data-uid='" + unit.uid +
        "' data-equipment='" + esc(equipmentId) + "'>x</button></span>";
    }).join("");
    var select = "";
    if (state.inventory.length && unit.equipment.length < 3) {
      select = "<select class='cw-equip-select' data-run-action='equip-select' data-uid='" +
        unit.uid + "'>" +
        "<option value=''>+ Gear</option>" +
        state.inventory.map(function (equipmentId) {
          return "<option value='" + esc(equipmentId) + "'>" + esc(equipmentName(equipmentId)) + "</option>";
        }).join("") + "</select>";
    }
    return chips + select;
  }

  function unitCard(state, unit, compact) {
    var character = CHARS.byId(unit.id);
    var positionLabel = unit.position === "on" ? "On-Field"
      : unit.position === "off" ? "Off-Field" : "Bench";
    return "<div class='cw-unit-card" + (compact ? " compact" : "") +
      (unit.position ? " deployed" : " benched") + "' draggable='true' data-uid='" + unit.uid +
      "' data-run-action='unit' data-position='" + (unit.position || "") + "' style='--el:" +
      elementColor(unit.element) + "'>" +
      "<div class='cw-unit-top'><span class='cw-cost-pill cost-" + unit.cost + "'>" + unit.cost +
      "</span><span class='cw-stars'>" + starPips(unit.star) + "</span></div>" +
      "<div class='cw-unit-portrait'>" + esc(initials(unit.name)) + "</div>" +
      "<div class='cw-unit-name'>" + esc(unit.name) + "</div>" +
      "<div class='cw-unit-bonds'>" + esc(character.bonds.join(" \u00b7 ")) + "</div>" +
      "<div class='cw-unit-pos'>" + esc(positionLabel) + "</div>" +
      "<div class='cw-unit-gear'>" + gearMarkup(state, unit) + "</div>" +
      "</div>";
  }

  function slotPlaceholder() {
    return "<div class='cw-slot'><span></span></div>";
  }

  function renderBoard(state) {
    var onUnits = state.units.filter(function (unit) { return unit.position === "on"; });
    var offUnits = state.units.filter(function (unit) { return unit.position === "off"; });
    var bench = state.units.filter(function (unit) { return !unit.position; });

    onCount.textContent = onUnits.length + " / " + state.maxOnField;
    offCount.textContent = offUnits.length + " / " + state.maxOffField;

    var onHtml = onUnits.map(function (unit) {
      return unitCard(state, unit, false);
    }).join("");
    for (var i = onUnits.length; i < state.maxOnField; i++) {
      onHtml += slotPlaceholder();
    }
    onSlots.innerHTML = onHtml;

    var offHtml = offUnits.map(function (unit) {
      return unitCard(state, unit, false);
    }).join("");
    for (var j = offUnits.length; j < state.maxOffField; j++) {
      offHtml += slotPlaceholder();
    }
    offSlots.innerHTML = offHtml;

    benchEl.innerHTML = bench.length
      ? bench.map(function (unit) {
        return unitCard(state, unit, true);
      }).join("")
      : "<span class='cw-bench-empty'>Waiting area empty</span>";

    expLevelEl.textContent = state.level;
    xpEl.textContent = state.xpToNext === null ? "MAX" : state.xp + " / " + state.xpToNext;
    expLevelEl.parentNode.parentNode.classList.toggle("maxed", state.xpToNext === null);
    buyXpCostEl.textContent = state.buyXpCost;
    buyXpBtn.disabled = state.phase !== "map" || state.level >= 10 || state.gold < state.buyXpCost;
    goldEl.textContent = state.gold;

    var current = state.nodes.filter(function (node) { return node.current; })[0];
    var type = current ? current.type : null;
    battleBtn.textContent = current ? (type === "reward" ? "Claim" : type === "supply" ? "Open" : "Battle") : "Done";
    battleBtn.disabled = state.phase !== "map" || !current;
    storeBtn.textContent = "Store";
    nodeHint.textContent = type
      ? NODE_HINT[type] + " Team " + onUnits.length + " On / " + offUnits.length + " Off (max " + state.teamSize + ")."
      : "This run has ended.";
    miniLog.innerHTML = state.log.slice(-4).map(function (entry) {
      return "<div>" + esc(entry) + "</div>";
    }).join("");
  }

  function hideOverlay() {
    overlay.hidden = true;
    overlay.classList.remove("cw-setup-mode");
    overlayBody.innerHTML = "";
  }

  function showOverlay(title, body, closable, setup) {
    overlayTitle.textContent = title;
    overlayTitle.hidden = !title;
    overlayBody.innerHTML = body;
    overlay.hidden = false;
    overlay.classList.toggle("cw-setup-mode", !!setup);
    overlayClose.hidden = !closable;
  }

  function choiceCard(action, id, name, meta, description, selected) {
    return "<button class='cw-choice-card" + (selected ? " selected" : "") + "' type='button' data-run-action='" +
      action + "' data-id='" + esc(id) + "'>" +
      "<span class='cw-choice-icon'>" + esc(initials(name)) + "</span>" +
      "<strong>" + esc(name) + "</strong>" +
      (meta ? "<small>" + esc(meta) + "</small>" : "") +
      (description ? "<p>" + esc(description) + "</p>" : "") +
      "</button>";
  }

  function setupHead(left, center, right) {
    return "<div class='cw-setup-head'><span>" + esc(left) + "</span><strong>" +
      esc(center) + "</strong><span>" + esc(right) + "</span></div>";
  }

  function renderOverlay(state) {
    if (state.phase === "battle") {
      hideOverlay();
      return;
    }

    if (gearOpen && state.phase === "map") {
      showOverlay("Equipment Bag",
        state.inventory.length
          ? "<div class='cw-gear-list'>" + state.inventory.map(function (equipmentId) {
            var item = DATA.equipmentById(equipmentId);
            return "<div class='cw-gear-item'><strong>" + esc(item.name) + "</strong><span>" +
              esc(item.text || "") + "</span></div>";
          }).join("") + "</div><p class='muted'>Use the + Gear control on a deployed character to equip.</p>"
          : "<p class='muted'>No spare equipment.</p>", true);
      return;
    }

    if (state.phase === "environment") {
      var selected = pendingEnvironmentId;
      showOverlay("", setupHead("Icon Details", "Investment Environment", "Strategy") +
        "<div class='cw-setup-cards'>" + state.environmentOffer.map(function (environment) {
          return choiceCard("select-environment", environment.id, environment.name,
            environment.category, environment.effect, selected === environment.id);
        }).join("") + "</div>" +
        "<div class='cw-setup-confirm'><button class='cw-confirm' type='button' data-run-action='confirm-environment'" +
        (selected ? "" : " disabled") + ">Confirm</button></div>", false, true);
      return;
    }

    if (state.phase === "reward") {
      showOverlay("Reward Node",
        "<div class='cw-reward-box'><p>Gain <strong>" + state.pendingReward.gold +
        " Gold</strong> and <strong>" + esc(state.pendingReward.equipmentName) + "</strong>.</p>" +
        "<button class='cw-confirm' type='button' data-run-action='continue-node'>Continue</button></div>",
        false);
      return;
    }

    if (state.phase === "supply") {
      showOverlay("", setupHead("Icon Details", "Supply Node", "Equipment") +
        "<div class='cw-setup-cards small'>" + state.supplyOffer.map(function (item) {
          return choiceCard("pick-supply", item.id, item.name, "Basic Equipment", item.text, false);
        }).join("") + "</div>", false, true);
      return;
    }

    if (state.phase === "encounter") {
      showOverlay("", setupHead("Icon Details", "Encounter", "Difficulty") +
        "<div class='cw-setup-cards small'>" +
        choiceCard("encounter", "easy", "Easy Encounter", "Standard squad", "Lower Squad HP risk.", false) +
        choiceCard("encounter", "hard", "Hard Encounter", "Elite squad", "Extra Gold on victory.", false) +
        "</div>", false, true);
      return;
    }

    if (state.phase === "strategy") {
      showOverlay("", setupHead("Icon Details", "Investment Strategy", "Rarity") +
        "<div class='cw-setup-cards'>" + (state.strategyOffer || []).map(function (strategy) {
          return choiceCard("pick-strategy", strategy.id, strategy.name,
            strategy.rarity || "Strategy", strategy.effect, false);
        }).join("") + "</div>" +
        "<div class='cw-setup-confirm'><button class='cw-skip' type='button' data-run-action='skip-strategy'>Skip</button></div>",
        false, true);
      return;
    }

    if (state.phase === "ended") {
      showOverlay(state.outcome === "victory" ? "Run Complete" : "Run Failed",
        "<div class='run-result-grade'>" + esc(state.rating) + "</div>" +
        "<p class='muted' style='text-align:center'>" +
        (state.outcome === "victory" ? "All three planes cleared." : "Squad HP reached zero.") + "</p>" +
        "<div class='run-result-stats'>" +
        "<div class='run-stat'><span>Squad HP</span><strong>" + state.squadHp + " / " + state.maxSquadHp + "</strong></div>" +
        "<div class='run-stat'><span>Level</span><strong>" + state.level + "</strong></div>" +
        "<div class='run-stat'><span>Gold</span><strong>" + state.gold + "</strong></div>" +
        "<div class='run-stat'><span>Plane</span><strong>" + (state.plane + 1) + " / " + state.planeCount + "</strong></div>" +
        "</div>" +
        "<div class='cw-setup-confirm'>" +
        "<button class='cw-skip' type='button' data-run-action='modes'>Back to Modes</button>" +
        "<button class='cw-confirm' type='button' data-run-action='new-run'>New Run</button>" +
        "</div>", false);
      return;
    }

    hideOverlay();
  }

  function render() {
    if (!run) {
      return;
    }
    var state = run.getState();
    renderTop(state);
    renderBonds(state);
    renderShop(state);
    renderBoard(state);
    renderOverlay(state);
    abandonBtn.textContent = state.phase === "ended" ? "New Run" : "Abandon";
  }

  function launchBattle(state) {
    if (!state.battleConfig) {
      return;
    }
    Battle.openRun(state.battleConfig, function (battleState) {
      run.finishBattle({
        victory: battleState.status === "victory",
        elapsedAV: battleState.elapsedAV,
        turnLimit: battleState.turnLimitAV
      });
      CW.showScreen(screen);
      render();
    });
  }

  function enterCurrentNode() {
    var state = run.getState();
    if (state.phase !== "map") {
      return;
    }
    run.enterNode();
    state = run.getState();
    if (state.phase === "battle") {
      launchBattle(state);
    } else {
      render();
    }
  }

  function deployFirstAvailable(uid) {
    var state = run.getState();
    var unit = findUnit(state, uid);
    if (!unit) {
      return false;
    }
    var character = CHARS.byId(unit.id);
    var positions = character.position === "off" ? ["off"]
      : character.position === "on" ? ["on"]
        : ["on", "off"];
    for (var i = 0; i < positions.length; i++) {
      if (run.deployUnit(uid, positions[i])) {
        return true;
      }
    }
    return false;
  }

  function handleAction(action, target) {
    var state = run.getState();
    if (action === "none") {
      return;
    }
    if (action === "select-environment") {
      pendingEnvironmentId = target.getAttribute("data-id");
      render();
      return;
    }
    if (action === "confirm-environment") {
      if (pendingEnvironmentId && run.chooseEnvironment(pendingEnvironmentId)) {
        pendingEnvironmentId = null;
        render();
      }
      return;
    }
    if (action === "buy") {
      if (run.chooseShop(Number(target.getAttribute("data-index")))) {
        render();
      }
      return;
    }
    if (action === "reroll") {
      if (run.rerollShop()) {
        render();
      }
      return;
    }
    if (action === "buy-xp") {
      if (run.buyXp()) {
        render();
      }
      return;
    }
    if (action === "unit") {
      if (target.tagName === "SELECT" || target.tagName === "BUTTON" || target.closest("select,button")) {
        return;
      }
      var uid = target.getAttribute("data-uid");
      if (target.getAttribute("data-position")) {
        run.benchUnit(uid);
      } else {
        deployFirstAvailable(uid);
      }
      render();
      return;
    }
    if (action === "unequip") {
      if (run.unequip(target.getAttribute("data-uid"), target.getAttribute("data-equipment"))) {
        render();
      }
      return;
    }
    if (action === "enter") {
      enterCurrentNode();
      return;
    }
    if (action === "continue-node") {
      if (run.continueNode()) {
        render();
      }
      return;
    }
    if (action === "pick-supply") {
      if (run.chooseSupply(target.getAttribute("data-id"))) {
        render();
      }
      return;
    }
    if (action === "encounter") {
      if (run.chooseEncounterDifficulty(target.getAttribute("data-id"))) {
        launchBattle(run.getState());
      }
      return;
    }
    if (action === "pick-strategy") {
      if (run.chooseStrategy(target.getAttribute("data-id"))) {
        render();
      }
      return;
    }
    if (action === "skip-strategy") {
      if (run.skipStrategy()) {
        render();
      }
      return;
    }
    if (action === "lock") {
      run.toggleShopLock();
      render();
      return;
    }
    if (action === "hide-shop") {
      shopHidden = true;
      render();
      return;
    }
    if (action === "store") {
      shopHidden = false;
      render();
      return;
    }
    if (action === "gear") {
      gearOpen = true;
      render();
      return;
    }
    if (action === "back") {
      CW.showScreen("screen-modes");
      return;
    }
    if (action === "abandon") {
      if (window.confirm("Abandon this run?")) {
        run.abandon();
        render();
      }
      return;
    }
    if (action === "new-run") {
      newRun();
      return;
    }
    if (action === "modes") {
      hideOverlay();
      CW.showScreen("screen-modes");
    }
  }

  screen.addEventListener("click", function (event) {
    var target = event.target.closest("[data-run-action]");
    if (!target || target.tagName === "SELECT") {
      return;
    }
    handleAction(target.getAttribute("data-run-action"), target);
  });

  screen.addEventListener("change", function (event) {
    var target = event.target;
    if (target.getAttribute("data-run-action") !== "equip-select") {
      return;
    }
    if (target.value && run.equip(target.getAttribute("data-uid"), target.value)) {
      render();
    }
  });

  screen.addEventListener("input", function (event) {
    if (event.target === shopSearch) {
      shopFilter = event.target.value;
      renderShop(run.getState());
    }
  });

  screen.addEventListener("dragstart", function (event) {
    var card = event.target.closest(".cw-unit-card[data-uid]");
    if (!card) {
      return;
    }
    dragUid = card.getAttribute("data-uid");
    card.classList.add("dragging");
    try {
      event.dataTransfer.setData("text/plain", dragUid);
      event.dataTransfer.effectAllowed = "move";
    } catch (err) {
      /* ignore */
    }
  });

  screen.addEventListener("dragend", function (event) {
    var card = event.target.closest(".cw-unit-card");
    if (card) {
      card.classList.remove("dragging");
    }
    dragUid = null;
    screen.querySelectorAll(".cw-drop-active").forEach(function (node) {
      node.classList.remove("cw-drop-active");
    });
  });

  function dropTarget(event) {
    var zone = event.target.closest(".cw-slots, .cw-bench");
    if (!zone) {
      return null;
    }
    return zone;
  }

  screen.addEventListener("dragover", function (event) {
    var zone = dropTarget(event);
    if (!zone) {
      return;
    }
    event.preventDefault();
    zone.classList.add("cw-drop-active");
  });

  screen.addEventListener("dragleave", function (event) {
    var zone = dropTarget(event);
    if (zone) {
      zone.classList.remove("cw-drop-active");
    }
  });

  screen.addEventListener("drop", function (event) {
    var zone = dropTarget(event);
    if (!zone) {
      return;
    }
    event.preventDefault();
    zone.classList.remove("cw-drop-active");
    var uid = dragUid;
    try {
      uid = event.dataTransfer.getData("text/plain") || uid;
    } catch (err) {
      /* ignore */
    }
    if (!uid) {
      return;
    }
    if (zone.classList.contains("cw-bench")) {
      run.benchUnit(uid);
    } else {
      var position = zone.getAttribute("data-position");
      if (!run.deployUnit(uid, position)) {
        deployFirstAvailable(uid);
      }
    }
    render();
  });

  overlay.addEventListener("click", function (event) {
    var target = event.target.closest("[data-run-action]");
    if (target) {
      handleAction(target.getAttribute("data-run-action"), target);
    }
  });

  overlayClose.addEventListener("click", function () {
    gearOpen = false;
    hideOverlay();
    render();
  });

  battleBtn.addEventListener("click", enterCurrentNode);
  rerollBtn.addEventListener("click", function () {
    handleAction("reroll", rerollBtn);
  });
  buyXpBtn.addEventListener("click", function () {
    handleAction("buy-xp", buyXpBtn);
  });
  lockBtn.addEventListener("click", function () {
    handleAction("lock", lockBtn);
  });
  hideShopBtn.addEventListener("click", function () {
    handleAction("hide-shop", hideShopBtn);
  });
  storeBtn.addEventListener("click", function () {
    handleAction("store", storeBtn);
  });
  gearBtn.addEventListener("click", function () {
    handleAction("gear", gearBtn);
  });
  backBtn.addEventListener("click", function () {
    handleAction("back", backBtn);
  });
  codexBtn.addEventListener("click", function () {
    var trigger = document.getElementById("codexBtn");
    if (trigger) {
      trigger.click();
    }
  });
  abandonBtn.addEventListener("click", function () {
    if (run.getState().phase === "ended") {
      newRun();
    } else {
      handleAction("abandon", abandonBtn);
    }
  });

  window.CWRunScreen = {
    open: open,
    newRun: newRun,
    getState: function () {
      return run ? run.getState() : null;
    }
  };
})();
