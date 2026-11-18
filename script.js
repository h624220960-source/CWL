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
    if (mode === "standard" && window.CWRunScreen) {
      window.CWRunScreen.open();
      return;
    }
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

  /* ---- Codex data (sourced from data/cw-4.6.js) ------------------------ */

  var CWCODE = window.CW_DATA;
  if (!CWCODE) {
    throw new Error("CW_DATA is not loaded. Load data/cw-4.6.js before script.js.");
  }

  function codexBonds(type) {
    return CWCODE.bonds.filter(function (bond) {
      return bond.type === type;
    }).map(function (bond) {
      return {
        name: bond.name,
        members: bond.members,
        advisors: bond.advisors,
        effect: bond.effect
      };
    });
  }

  var FACTION_BONDS = codexBonds("faction");
  var SCHOOL_BONDS = codexBonds("school");
  var INDEPENDENT_BONDS = CWCODE.independentBonds.map(function (bond) {
    return { name: bond.name, owner: bond.owner, effect: bond.effect };
  });

  var EMPOWER = CWCODE.empowerments;
  var COST_ROSTER = CWCODE.costRoster;

  var BASIC_EQUIPMENT = CWCODE.equipment.basic.map(function (item) {
    return { name: item.name, stat: item.stat, value: item.value };
  });
  var ADVANCED_EQUIPMENT = CWCODE.equipment.advanced.map(function (item) {
    return { name: item.name, recipe: item.recipe, effect: item.effect };
  });
  var SPECIAL_EQUIPMENT = CWCODE.equipment.special.map(function (item) {
    return { name: item.name, effect: item.effect };
  });
  var CONSUMABLES = CWCODE.equipment.consumables.map(function (item) {
    return { name: item.name, effect: item.effect };
  });

  var ENVIRONMENT_INDEX_FUNDS = CWCODE.environmentIndexFunds;
  var ENVIRONMENT_INVITATIONS = CWCODE.environmentInvitations;
  var ENVIRONMENTS = CWCODE.environments.map(function (environment) {
    return {
      name: environment.name,
      category: environment.category,
      effect: environment.effect
    };
  });
  var STRATEGIES = CWCODE.strategies.map(function (strategy) {
    return { name: strategy.name, rarity: strategy.rarity, effect: strategy.effect };
  });

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
            (item.recipe ? "<p><strong>Recipe:</strong> " + item.recipe + "</p>" : "") +
            (item.effect ? "<p><strong>Effect:</strong> " + item.effect + "</p>" : ""));
        }));

        html += "<h4>Rare &amp; Special</h4>";
        html += slots(SPECIAL_EQUIPMENT.map(function (item) {
          return slot(item.name, "", item.effect ? "<p>" + item.effect + "</p>" : "");
        }));

        html += "<h4>Consumables</h4>";
        html += slots(CONSUMABLES.map(function (item) {
          return slot(item.name, "", item.effect ? "<p>" + item.effect + "</p>" : "");
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
            ? " Faction-boost environments like \"Day Demigod Index Funds\" that hand you Aglaea/Tribbie/Roller Skates at the start - used to force-march the Aglaea comp." : "";
          return slot(bond + " Index Fund", "<span class='slot-sub'>Environment</span>",
            "<p>One per Bond; raise that Bond's unit appearance rate and/or grant the emblem." + extra + "</p>");
        }));

        html += "<h4>Invitations</h4>";
        html += slots(ENVIRONMENT_INVITATIONS.map(function (bond) {
          return slot(bond + " Invitation", "<span class='slot-sub'>Environment</span>",
            "<p>Grants the corresponding Bond EMBLEM immediately.</p>");
        }));

        html += "<h4>Other Environments</h4>";
        html += slots(ENVIRONMENTS.map(function (env) {
          return slot(env.name, "<span class='slot-sub'>" + env.category + "</span>",
            env.effect ? "<p>" + env.effect + "</p>" : "");
        }));

        html += "<h4>Strategies</h4>";
        html += slots(STRATEGIES.map(function (strat) {
          return slot(strat.name + rarityTag(strat.rarity), "",
            strat.effect ? "<p>" + strat.effect + "</p>" : "");
        }));

        html += "<p class='codex-note'>Strategy rarities are Silver (Common), " +
          "Gold and Prismatic. Picking higher rarity adds difficulty (0 / 1/3 / " +
          "3-6 depending on rank).</p>";
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
