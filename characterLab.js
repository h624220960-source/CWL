(function () {
  "use strict";

  var DATA = window.CW_CHARACTERS;
  var CW = window.CW;
  if (!DATA || !CW) {
    return;
  }

  var labScreen = document.getElementById("screen-lab");
  var labBack = document.getElementById("labBack");
  var labSearch = document.getElementById("labSearch");
  var labPosition = document.getElementById("labPosition");
  var labElement = document.getElementById("labElement");
  var labCost = document.getElementById("labCost");
  var labCount = document.getElementById("labCount");
  var labGrid = document.getElementById("labGrid");

  var overlay = document.getElementById("charOverlay");
  var charBody = document.getElementById("charBody");
  var charClose = document.getElementById("charClose");

  var filters = {
    search: "",
    position: "all",
    element: "all",
    cost: "all"
  };

  var activeId = null;
  var activePos = null;

  function esc(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function elementStyle(element) {
    return DATA.ELEMENTS[element].color;
  }

  function elementIcon(element) {
    return DATA.ELEMENTS[element].icon;
  }

  function costBadge(cost) {
    return "<span class='cost-badge cost-" + cost + "'>" + DATA.COST_LABEL[cost] + "</span>";
  }

  function positionBadge(position) {
    return "<span class='pos-badge pos-" + position + "'>" + DATA.POSITIONS[position].label + "</span>";
  }

  function bondTags(bonds) {
    return bonds.map(function (bond) {
      return "<span class='bond-tag'>" + esc(bond) + "</span>";
    }).join("");
  }

  function matches(character) {
    if (filters.search && character.name.toLowerCase().indexOf(filters.search) === -1) {
      return false;
    }
    if (filters.position === "on" && character.position === "off") {
      return false;
    }
    if (filters.position === "off" && character.position === "on") {
      return false;
    }
    if (filters.position === "both" && character.position !== "both") {
      return false;
    }
    if (filters.element !== "all" && character.element !== filters.element) {
      return false;
    }
    if (filters.cost !== "all" && String(character.cost) !== filters.cost) {
      return false;
    }
    return true;
  }

  function card(character) {
    return (
      "<button type='button' class='char-card' data-char='" + character.id + "'>" +
      "<div class='char-card-top'>" +
      "<span class='char-el' style='--el:" + elementStyle(character.element) + "'>" +
      elementIcon(character.element) + "</span>" +
      "<div class='char-card-name'>" +
      "<strong>" + esc(character.name) + "</strong>" +
      "<span class='char-path'>" + esc(character.path) + "</span>" +
      "</div>" +
      costBadge(character.cost) +
      "</div>" +
      "<div class='char-card-tags'>" +
      positionBadge(character.position) +
      "<span class='element-tag'>" + esc(character.element) + "</span>" +
      "</div>" +
      "<div class='char-bonds'>" + bondTags(character.bonds) + "</div>" +
      "<p class='char-hook'>" + esc(character.note) + "</p>" +
      "</button>"
    );
  }

  function renderGrid() {
    var visible = DATA.list.filter(matches);
    labCount.textContent = visible.length + " of " + DATA.list.length + " implemented characters shown.";
    labGrid.innerHTML = visible.length
      ? visible.map(card).join("")
      : "<p class='muted lab-empty'>No characters match these filters.</p>";
  }

  function abilityBlock(ability) {
    return (
      "<div class='ability'>" +
      "<div class='ability-head'>" +
      "<span class='ability-slot'>" + esc(ability.slot) + "</span>" +
      "<strong>" + esc(ability.name) + "</strong>" +
      "</div>" +
      "<p>" + esc(ability.text) + "</p>" +
      "</div>"
    );
  }

  function kitBlock(character, position) {
    var kit = character.slots[position];
    var isBoth = character.position === "both";
    var tabs = "";

    if (isBoth) {
      tabs =
        "<div class='kit-tabs' role='tablist'>" +
        "<button type='button' class='kit-tab" + (position === "on" ? " active" : "") +
        "' data-pos='on'>On-Field kit</button>" +
        "<button type='button' class='kit-tab" + (position === "off" ? " active" : "") +
        "' data-pos='off'>Off-Field kit</button>" +
        "</div>";
    } else {
      tabs = "<h3 class='kit-static'>" + DATA.POSITIONS[position].label + " kit</h3>";
    }

    return (
      tabs +
      "<div class='empower'>" +
      "<span class='empower-tag'>CW Empowerment</span>" +
      "<p>" + esc(kit.empowerment) + "</p>" +
      "</div>" +
      "<div class='ability-list'>" +
      kit.abilities.map(abilityBlock).join("") +
      "</div>"
    );
  }

  function renderDetail() {
    var character = DATA.byId(activeId);
    if (!character) {
      return;
    }
    if (!character.slots[activePos]) {
      activePos = character.position === "both" ? "on" : character.position;
    }

    var stats = character.stats;
    charBody.innerHTML =
      "<div class='char-detail-head'>" +
      "<span class='char-el char-el-lg' style='--el:" + elementStyle(character.element) + "'>" +
      elementIcon(character.element) + "</span>" +
      "<div>" +
      "<h2 id='charName'>" + esc(character.name) + "</h2>" +
      "<div class='char-meta'>" +
      costBadge(character.cost) +
      "<span class='element-tag'>" + esc(character.element) + "</span>" +
      "<span class='path-tag'>" + esc(character.path) + "</span>" +
      positionBadge(character.position) +
      "</div>" +
      "<div class='char-bonds'>" + bondTags(character.bonds) + "</div>" +
      "</div>" +
      "</div>" +
      "<p class='char-note'>" + esc(character.note) + "</p>" +
      "<div class='stat-grid'>" +
      "<div><span>HP</span><strong>" + stats.hp + "</strong></div>" +
      "<div><span>ATK</span><strong>" + stats.atk + "</strong></div>" +
      "<div><span>DEF</span><strong>" + stats.def + "</strong></div>" +
      "<div><span>SPD</span><strong>" + stats.spd + "</strong></div>" +
      "</div>" +
      kitBlock(character, activePos) +
      "<p class='lab-note'>Values are remake templates, not official live numbers. " +
      "Position rules and the documented empowerment follow the 4.6 research snapshot.</p>";
  }

  function openCharacter(id) {
    activeId = id;
    var character = DATA.byId(id);
    activePos = character && character.position === "both" ? "on" : character && character.position;
    renderDetail();
    overlay.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeCharacter() {
    overlay.hidden = true;
    document.body.style.overflow = "";
  }

  function populateElements() {
    Object.keys(DATA.ELEMENTS).forEach(function (element) {
      var option = document.createElement("option");
      option.value = element;
      option.textContent = element;
      labElement.appendChild(option);
    });
  }

  function open() {
    renderGrid();
    CW.showScreen(labScreen);
  }

  function wire() {
    labSearch.addEventListener("input", function () {
      filters.search = labSearch.value.trim().toLowerCase();
      renderGrid();
    });

    labPosition.addEventListener("change", function () {
      filters.position = labPosition.value;
      renderGrid();
    });

    labElement.addEventListener("change", function () {
      filters.element = labElement.value;
      renderGrid();
    });

    labCost.addEventListener("change", function () {
      filters.cost = labCost.value;
      renderGrid();
    });

    labGrid.addEventListener("click", function (event) {
      var cardEl = event.target.closest(".char-card");
      if (cardEl) {
        openCharacter(cardEl.getAttribute("data-char"));
      }
    });

    charBody.addEventListener("click", function (event) {
      var tab = event.target.closest(".kit-tab");
      if (tab) {
        activePos = tab.getAttribute("data-pos");
        renderDetail();
      }
    });

    charClose.addEventListener("click", closeCharacter);
    overlay.addEventListener("click", function (event) {
      if (event.target === overlay) {
        closeCharacter();
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !overlay.hidden) {
        closeCharacter();
      }
    });

    labBack.addEventListener("click", function () {
      CW.showScreen("screen-modes");
    });
  }

  populateElements();
  wire();

  window.CWLab = {
    open: open,
    openCharacter: openCharacter,
    closeCharacter: closeCharacter
  };
})();
