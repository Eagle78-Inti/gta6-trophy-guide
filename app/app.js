// Leonida Trophy Tracker — vanilla JS, no libraries, no network beyond local files.
// Loads data/trophies.json, keeps progress in localStorage, exports/imports it.
(function () {
  "use strict";

  var DATA_URL = "data/trophies.json";
  var STORE_KEY = "gta6-trophy-progress-v1";
  var KIND_LABELS = { story: "Story", missable: "Missable", collectibles: "Collectibles", activities: "Activities", online: "Online", platinum: "Platinum", completion: "100%" };
  var GRADE_LABELS = { platinum: "Platinum", gold: "Gold", silver: "Silver", bronze: "Bronze" };

  var data = null;            // the parsed trophies.json
  var earned = new Set();     // trophy ids the user marked earned
  var spoilersHidden = false; // spoiler toggle state
  var kindFilter = "all";
  var searchText = "";
  var earnedOnly = false;
  var selectedId = null;

  var els = {};
  ["searchBox", "spoilerToggle", "earnedOnlyToggle", "kindChips", "exportBtn",
   "importFile", "resetBtn", "savedNote", "earnedCount", "progressFill",
   "gradeCounts", "roadmapList", "missableList", "trophyList", "listCount",
   "emptyNote", "detailEmpty", "detailBody"].forEach(function (id) {
    els[id] = document.getElementById(id);
  });

  function loadProgress() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return;
      var saved = JSON.parse(raw);
      if (Array.isArray(saved.earned)) saved.earned.forEach(function (id) { earned.add(id); });
      if (typeof saved.spoilersHidden === "boolean") spoilersHidden = saved.spoilersHidden;
    } catch (err) { /* a corrupt save is ignored; the list still works */ }
  }

  function saveProgress() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({
        game: "Grand Theft Auto VI",
        earned: Array.from(earned).sort(function (a, b) { return a - b; }),
        spoilersHidden: spoilersHidden
      }));
      els.savedNote.textContent = "Saved in this browser.";
    } catch (err) { els.savedNote.textContent = "Could not save in this browser."; }
  }

  function isSpoilerHidden(t) {
    return spoilersHidden && t.kind === "story" && !earned.has(t.id);
  }

  function gradeCountsText() {
    var totals = {}, got = {};
    data.trophies.forEach(function (t) {
      totals[t.grade] = (totals[t.grade] || 0) + 1;
      if (earned.has(t.id)) got[t.grade] = (got[t.grade] || 0) + 1;
    });
    return ["platinum", "gold", "silver", "bronze"].map(function (g) {
      return GRADE_LABELS[g] + " " + (got[g] || 0) + "/" + totals[g];
    }).join(" · ");
  }

  function renderProgress() {
    els.earnedCount.textContent = String(earned.size);
    els.progressFill.style.width = (earned.size / data.trophies.length * 100).toFixed(1) + "%";
    els.gradeCounts.textContent = gradeCountsText();
  }

  function renderRoadmap() {
    els.roadmapList.innerHTML = "";
    data.roadmap.forEach(function (stage) {
      var mine = data.trophies.filter(function (t) { return t.stage === stage.stage; });
      var done = mine.filter(function (t) { return earned.has(t.id); }).length;
      var li = document.createElement("li");
      var title = document.createElement("b");
      title.textContent = "Stage " + stage.stage + ": " + stage.title;
      var count = document.createElement("span");
      count.className = "stage-count";
      count.textContent = done + "/" + mine.length + " trophies in this stage";
      var text = document.createElement("div");
      text.textContent = stage.text;
      li.appendChild(title);
      li.appendChild(count);
      li.appendChild(text);
      els.roadmapList.appendChild(li);
    });
  }

  function renderMissable() {
    els.missableList.innerHTML = "";
    data.trophies.filter(function (t) { return t.missable; }).forEach(function (t) {
      var card = document.createElement("div");
      card.className = "miss-card";
      var flag = document.createElement("span");
      flag.className = "miss-flag";
      flag.textContent = "MISSABLE";
      var body = document.createElement("div");
      var name = document.createElement("b");
      name.textContent = t.name + " — " + t.description;
      var guide = document.createElement("div");
      guide.textContent = t.guide;
      body.appendChild(name);
      body.appendChild(guide);
      card.appendChild(flag);
      card.appendChild(body);
      els.missableList.appendChild(card);
    });
  }

  function matchesFilters(t) {
    if (kindFilter === "missable" && !t.missable) return false;
    if (kindFilter !== "all" && kindFilter !== "missable" && t.kind !== kindFilter) return false;
    if (earnedOnly && !earned.has(t.id)) return false;
    if (searchText) {
      var hay = (t.name + " " + t.description + " " + t.guide).toLowerCase();
      if (hay.indexOf(searchText) === -1) return false;
    }
    return true;
  }

  function tag(text, cls) {
    var s = document.createElement("span");
    s.className = "tag " + cls;
    s.textContent = text;
    return s;
  }

  function renderList() {
    els.trophyList.innerHTML = "";
    var shown = data.trophies.filter(matchesFilters);
    els.listCount.textContent = "(" + shown.length + " of 55)";
    els.emptyNote.hidden = shown.length > 0;
    if (kindFilter === "online" && shown.length === 0) {
      els.emptyNote.hidden = false;
      els.emptyNote.textContent = "There are no online trophies: all 55 are single-player and offline.";
    } else if (shown.length === 0) {
      els.emptyNote.textContent = "No trophies match these filters.";
    }
    shown.forEach(function (t) {
      var li = document.createElement("li");
      li.className = "trophy" + (earned.has(t.id) ? " earned" : "") + (selectedId === t.id ? " selected" : "");
      var box = document.createElement("input");
      box.type = "checkbox";
      box.checked = earned.has(t.id);
      box.setAttribute("aria-label", "Mark " + t.name + " earned");
      box.addEventListener("click", function (ev) {
        ev.stopPropagation();
        toggleEarned(t.id);
      });
      var body = document.createElement("div");
      body.className = "body";
      var name = document.createElement("div");
      name.className = "name";
      name.textContent = isSpoilerHidden(t) ? "Hidden story trophy" : t.name;
      var desc = document.createElement("div");
      desc.className = "desc";
      desc.textContent = isSpoilerHidden(t)
        ? "Hidden until earned — this trophy's name and description are a story spoiler."
        : t.description;
      var tags = document.createElement("div");
      tags.className = "tags";
      tags.appendChild(tag(GRADE_LABELS[t.grade], "grade-" + t.grade));
      if (t.kind !== "platinum") tags.appendChild(tag(KIND_LABELS[t.kind] || t.kind, ""));
      if (t.missable) tags.appendChild(tag("Missable", "missable"));
      if (t.hidden) tags.appendChild(tag("Hidden on PS5", "hidden"));
      if (typeof t.count === "number") tags.appendChild(tag("Count: " + t.count, "count"));
      body.appendChild(name);
      body.appendChild(desc);
      body.appendChild(tags);
      li.appendChild(box);
      li.appendChild(body);
      li.addEventListener("click", function () { selectTrophy(t.id); });
      els.trophyList.appendChild(li);
    });
  }

  function renderDetail() {
    var t = data.trophies.find(function (x) { return x.id === selectedId; });
    if (!t) { els.detailEmpty.hidden = false; els.detailBody.hidden = true; return; }
    els.detailEmpty.hidden = true;
    els.detailBody.hidden = false;
    els.detailBody.innerHTML = "";
    var h = document.createElement("h2");
    h.textContent = isSpoilerHidden(t) ? "Hidden story trophy" : t.name;
    var d = document.createElement("p");
    d.className = "desc";
    d.textContent = t.description;
    var tags = document.createElement("div");
    tags.className = "tags";
    tags.appendChild(tag(GRADE_LABELS[t.grade], "grade-" + t.grade));
    if (t.missable) tags.appendChild(tag("Missable", "missable"));
    if (t.hidden) tags.appendChild(tag("Hidden on PS5", "hidden"));
    els.detailBody.appendChild(h);
    els.detailBody.appendChild(d);
    els.detailBody.appendChild(tags);
    if (isSpoilerHidden(t)) {
      var note = document.createElement("p");
      note.className = "spoiler-note";
      note.textContent = "Spoilers are hidden. Earn this trophy, or turn the spoiler setting off, to read its guide.";
      els.detailBody.appendChild(note);
      return;
    }
    if (t.missable) {
      var when = document.createElement("p");
      when.className = "when";
      when.textContent = "Can be missed: do the Chapter 1 balcony meditation before Chapter 1 ends. See the Missable section above for the full warning.";
      els.detailBody.appendChild(when);
    }
    var gh = document.createElement("h3");
    gh.textContent = "Guide";
    var g = document.createElement("p");
    g.className = "guide";
    g.textContent = t.guide;
    els.detailBody.appendChild(gh);
    els.detailBody.appendChild(g);
    var sh = document.createElement("h3");
    sh.textContent = "Sources";
    var list = document.createElement("ul");
    list.className = "sources";
    (t.sources || []).forEach(function (s) {
      var li = document.createElement("li");
      if (s.url) {
        var a = document.createElement("a");
        a.href = s.url;
        a.target = "_blank";
        a.rel = "noopener";
        a.textContent = s.name;
        li.appendChild(a);
      } else {
        li.textContent = s.name;
      }
      list.appendChild(li);
    });
    els.detailBody.appendChild(sh);
    els.detailBody.appendChild(list);
  }

  function renderAll() {
    renderProgress();
    renderRoadmap();
    renderMissable();
    renderList();
    renderDetail();
  }

  function toggleEarned(id) {
    if (earned.has(id)) earned.delete(id); else earned.add(id);
    saveProgress();
    renderAll();
  }

  function selectTrophy(id) {
    selectedId = id;
    renderList();
    renderDetail();
  }

  function exportProgress() {
    var payload = {
      game: "Grand Theft Auto VI",
      exportedFrom: "Leonida Trophy Tracker",
      earned: Array.from(earned).sort(function (a, b) { return a - b; })
    };
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "gta6-trophy-progress.json";
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 100);
  }

  function importProgress(file) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var parsed = JSON.parse(String(reader.result));
        var ids = Array.isArray(parsed) ? parsed : parsed.earned;
        if (!Array.isArray(ids)) throw new Error("bad file");
        var valid = new Set(data.trophies.map(function (t) { return t.id; }));
        var next = new Set();
        ids.forEach(function (id) { if (valid.has(id)) next.add(id); });
        earned = next;
        saveProgress();
        renderAll();
        els.savedNote.textContent = "Imported " + earned.size + " earned trophies.";
      } catch (err) {
        els.savedNote.textContent = "That file is not a valid progress export.";
      }
    };
    reader.readAsText(file);
  }

  // Screenshot presets: ?shot=cover|roadmap|tracker|guide — deterministic demo
  // states so the screenshots show the guide at its best. Only active with ?shot=.
  function applyShotPreset() {
    var shot = new URLSearchParams(location.search).get("shot");
    if (!shot) return;
    var mark = function (ids) { ids.forEach(function (id) { earned.add(id); }); };
    if (shot === "cover") {
      mark([2, 3, 4, 5, 8, 14, 15, 16, 17, 21, 28, 30, 35, 42]);
      selectedId = 28;
      // Bring the checklist to the top of the left column for this shot, so
      // the cover shows the checklist with the guide open beside it. No
      // scrolling: headless screenshots paint scrolled content shifted down.
      document.getElementById("checklistPanel").style.order = "-2";
    } else if (shot === "roadmap") {
      mark([2, 3, 4, 8, 15, 16, 21, 28]);
    } else if (shot === "tracker") {
      spoilersHidden = true;
      els.spoilerToggle.checked = true;
      kindFilter = "story";
      els.kindChips.querySelectorAll(".chip").forEach(function (c) {
        c.classList.toggle("active", c.getAttribute("data-kind") === "story");
      });
      mark([2, 3, 8]);
    } else if (shot === "guide") {
      selectedId = 14;
    }
    saveProgress();
  }

  function init() {
    loadProgress();
    els.searchBox.addEventListener("input", function () {
      searchText = els.searchBox.value.trim().toLowerCase();
      renderList();
    });
    els.spoilerToggle.checked = spoilersHidden;
    els.spoilerToggle.addEventListener("change", function () {
      spoilersHidden = els.spoilerToggle.checked;
      saveProgress();
      renderAll();
    });
    els.earnedOnlyToggle.addEventListener("change", function () {
      earnedOnly = els.earnedOnlyToggle.checked;
      renderList();
    });
    els.kindChips.addEventListener("click", function (ev) {
      var btn = ev.target.closest("button[data-kind]");
      if (!btn) return;
      kindFilter = btn.getAttribute("data-kind");
      els.kindChips.querySelectorAll(".chip").forEach(function (c) {
        c.classList.toggle("active", c === btn);
      });
      renderList();
    });
    els.exportBtn.addEventListener("click", exportProgress);
    els.importFile.addEventListener("change", function () {
      if (els.importFile.files.length) importProgress(els.importFile.files[0]);
      els.importFile.value = "";
    });
    els.resetBtn.addEventListener("click", function () {
      if (window.confirm("Clear all earned trophies?")) {
        earned = new Set();
        selectedId = null;
        saveProgress();
        renderAll();
      }
    });
    fetch(DATA_URL).then(function (res) {
      if (!res.ok) throw new Error("trophies.json did not load");
      return res.json();
    }).then(function (json) {
      data = json;
      applyShotPreset();
      renderAll();
    }).catch(function (err) {
      els.trophyList.innerHTML = "<li class='empty'>Could not load data/trophies.json — " + err.message + "</li>";
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
