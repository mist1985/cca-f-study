// CCAF guide: progress, daily goals, navigation, focus timer, spaced-repetition flashcards. No dependencies.
(function () {
  "use strict";
  var S = window.SITE || { pages: [], areas: {}, cardIds: [] };
  var R = window.ROOT || ".";
  var body = document.body;
  var ID = body.dataset.id;
  var AREA = body.dataset.area;

  // ---------- storage (wrapped: private mode can throw) ----------
  function load(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function day(offset) {
    var d = new Date(); d.setDate(d.getDate() + (offset || 0));
    return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2);
  }
  var done = load("cca-done", {});
  var url = function (href) { return R + "/" + href; };
  var page = S.pages.filter(function (p) { return p.id === ID; })[0];
  var isContent = !!page;
  if (isContent) save("cca-last", ID);

  // Activity log shared with quiz.js: {"2026-10-28": {c: cards, q: questions, f: flashcards, n: new flashcards}}
  window.CCA_LOG = function (kind) {
    var days = load("cca-days", {}), t = day();
    days[t] = days[t] || {}; days[t][kind] = (days[t][kind] || 0) + 1; save("cca-days", days);
  };
  function streak() {
    var days = load("cca-days", {}), n = 0, i = days[day()] ? 0 : -1;
    while (days[day(i)]) { n++; i--; }
    return n;
  }

  // ---------- toast ----------
  var toastEl = document.querySelector(".toast"), toastT;
  function toast(html, ms) {
    if (!toastEl) return;
    toastEl.innerHTML = html; toastEl.classList.add("show");
    clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove("show"); }, ms || 2800);
  }

  // ---------- reading progress ----------
  var bar = document.querySelector(".scrollbar i");
  function onScroll() {
    var h = document.documentElement.scrollHeight - innerHeight;
    if (bar) bar.style.width = (h > 0 ? Math.min(100, scrollY / h * 100) : 0) + "%";
  }
  addEventListener("scroll", onScroll, { passive: true }); onScroll();

  // ---------- helpers ----------
  function pagesIn(area) { return S.pages.filter(function (p) { return p.area === area; }); }
  function countDone(list) { return list.filter(function (p) { return done[p.id]; }).length; }
  function nextUndone() {
    for (var i = 0; i < S.pages.length; i++) if (!done[S.pages[i].id]) return S.pages[i];
    return null;
  }
  function label(p) { return (p.num ? p.num + " " : "") + p.short; }

  // ---------- mini-map dots ----------
  function renderDots() {
    var box = document.querySelector(".dots");
    if (!box || !isContent) return;
    box.innerHTML = "";
    pagesIn(AREA).forEach(function (p) {
      var a = document.createElement("a");
      a.className = "dot" + (done[p.id] ? " done" : "") + (p.id === ID ? " here" : "");
      a.href = url(p.href); a.title = label(p) + (done[p.id] ? " (done)" : "");
      a.setAttribute("aria-label", a.title);
      box.appendChild(a);
    });
  }

  // ---------- done ----------
  var doneBtn = document.querySelector(".done-btn");
  function renderDone() {
    if (!doneBtn) return;
    var on = !!done[ID];
    doneBtn.classList.toggle("on", on);
    doneBtn.querySelector(".lbl").textContent = on ? "Done" : "Mark done";
  }
  function toggleDone() {
    if (!isContent) return;
    if (done[ID]) delete done[ID];
    else {
      done[ID] = Date.now(); window.CCA_LOG("c");
      doneBtn.classList.add("pop"); setTimeout(function () { doneBtn.classList.remove("pop"); }, 450);
      var list = pagesIn(AREA), left = list.length - countDone(list), a = S.areas[AREA] || {};
      var total = countDone(S.pages);
      if (total === S.pages.length) toast("Every star is lit. Time for the mock exam.", 4000);
      else if (!left) toast("<b>" + a.name + "</b> complete. The whole area is lit on your map.", 3600);
      else toast("<b>" + label(page) + "</b> is lit on your map. " + left + " left in " + a.name + ".");
    }
    save("cca-done", done);
    renderDone(); renderDots();
  }
  if (doneBtn) doneBtn.addEventListener("click", toggleDone);

  // ---------- focus timer ----------
  var timerBtn = document.querySelector(".timer"), tLeft, tInt;
  function fmt(s) { return Math.floor(s / 60) + ":" + ("0" + s % 60).slice(-2); }
  function toggleTimer() {
    if (!timerBtn) return;
    var span = timerBtn.querySelector("span");
    if (timerBtn.classList.contains("end")) {
      timerBtn.classList.remove("end"); tLeft = null; span.textContent = timerBtn.dataset.min + ":00"; return;
    }
    if (tInt) { clearInterval(tInt); tInt = null; timerBtn.classList.remove("run"); toast("Timer paused"); return; }
    if (!tLeft) tLeft = (+timerBtn.dataset.min || 3) * 60;
    timerBtn.classList.add("run"); toast("Focus on just this page. Nothing else.");
    tInt = setInterval(function () {
      tLeft--; span.textContent = fmt(tLeft);
      if (tLeft <= 0) {
        clearInterval(tInt); tInt = null; timerBtn.classList.remove("run"); timerBtn.classList.add("end");
        if (navigator.vibrate) navigator.vibrate([120, 80, 120]);
        toast(done[ID] ? "Time. Stand up and stretch for two minutes." : "Time. Answer the question at the bottom, mark done, then take a short break.", 5000);
      }
    }, 1000);
  }
  if (timerBtn) timerBtn.addEventListener("click", toggleTimer);

  // ---------- keyboard + swipe ----------
  function go(dir) { var h = body.dataset[dir]; if (h) location.href = h; }
  addEventListener("keydown", function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey || /input|textarea|select/i.test(e.target.tagName)) return;
    if (body.classList.contains("is-flash") || body.classList.contains("is-quiz")) return;
    if (e.key === "ArrowRight") go("next");
    else if (e.key === "ArrowLeft") go("prev");
    else if (e.key === "d") toggleDone();
    else if (e.key === "m") location.href = url("index.html");
    else if (e.key === "t") toggleTimer();
    else if (e.key === "g") location.href = url("glossary.html");
  });
  var sx, sy, st, skip;
  addEventListener("touchstart", function (e) {
    var t = e.touches[0]; sx = t.clientX; sy = t.clientY; st = Date.now();
    skip = !!e.target.closest(".tw, pre, .stage, .sky-canvas");
  }, { passive: true });
  addEventListener("touchend", function (e) {
    if (skip || sx == null || !isContent) return;
    var t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy;
    if (Math.abs(dx) > 80 && Math.abs(dy) < 60 && Date.now() - st < 600) go(dx < 0 ? "next" : "prev");
    sx = null;
  }, { passive: true });
  if (isContent && "ontouchstart" in window && !load("cca-swipe-hint", false)) {
    var h = document.createElement("div"); h.className = "swipe-hint"; h.textContent = "Swipe left or right to change page";
    document.body.appendChild(h); save("cca-swipe-hint", true);
    setTimeout(function () { h.remove(); }, 2600);
  }

  // ---------- spaced repetition (Leitner boxes) ----------
  var INTERVALS = [0, 1, 3, 7, 14, 30]; // days until next review, by box
  var NEW_PER_DAY = 10;
  function srs() { return load("cca-srs", {}); }
  function dueList(ids) {
    var s = srs(), t = day(), today = load("cca-days", {})[t] || {};
    var reviews = ids.filter(function (id) { return s[id] && s[id].due <= t; });
    var fresh = ids.filter(function (id) { return !s[id]; }).slice(0, Math.max(0, NEW_PER_DAY - (today.n || 0)));
    return reviews.concat(fresh);
  }
  function grade(id, knew) {
    var s = srs(), c = s[id], t = day();
    if (!c) { window.CCA_LOG("n"); c = { box: 0 }; }
    c.box = knew ? Math.min(5, c.box + 1) : 1;
    var d = new Date(); d.setDate(d.getDate() + (knew ? INTERVALS[c.box] : 0));
    c.due = knew ? d.toISOString().slice(0, 10) : t;
    s[id] = c; save("cca-srs", s); window.CCA_LOG("f");
  }

  // ---------- home ----------
  function renderHome() {
    if (!body.classList.contains("is-home")) return;
    var total = countDone(S.pages), nu = nextUndone();
    var hr = new Date().getHours();
    document.getElementById("greet").textContent =
      (hr < 12 ? "Good morning" : hr < 18 ? "Good afternoon" : "Good evening") + " · Claude Certified Architect – Foundations";
    document.getElementById("headline").textContent = !total ? "Start with the whole picture." :
      nu ? "Pick up where you left off." : "Every star is lit. Now prove it.";
    var cta = document.getElementById("continue");
    if (nu) {
      var a = S.areas[nu.area] || {}, list = pagesIn(nu.area), left = list.length - countDone(list);
      cta.href = nu.href; cta.style.setProperty("--a", a.color);
      document.getElementById("rTag").innerHTML = "<i></i>" + a.name + (nu.num ? " · Card " + nu.num : "");
      document.getElementById("rTitle").textContent = nu.short;
      document.getElementById("rMeta").textContent = nu.min + " min · " +
        (left === 1 ? "last page in this area" : left + " pages left in " + a.name);
    } else {
      cta.href = "quiz.html#mock";
      document.getElementById("rTag").innerHTML = "<i></i>Practice";
      document.getElementById("rTitle").textContent = "Take a timed mock exam";
      document.getElementById("rMeta").textContent = "60 questions · 120 minutes · score per area";
    }
    var td = load("cca-days", {})[day()] || {};
    function goal(nid, bid, n, of) {
      document.getElementById(nid).textContent = n;
      var li = document.getElementById(nid).parentNode; li.classList.toggle("met", n >= of);
      if (bid) document.getElementById(bid).style.width = Math.min(100, n / of * 100) + "%";
    }
    goal("gCards", "gCardsBar", td.c || 0, 3);
    goal("gQs", "gQsBar", td.q || 0, 10);
    document.getElementById("gDue").textContent = dueList(S.cardIds || []).length;
    document.getElementById("gStreak").textContent = streak();
    document.getElementById("litN").textContent = total;

    document.querySelectorAll("[data-id]").forEach(function (el) {
      if (el === body) return;
      el.classList.toggle("is-done", !!done[el.dataset.id]);
      el.classList.toggle("next-up", !!nu && el.dataset.id === nu.id);
      if (nu && el.dataset.id === nu.id) { var rm = el.querySelector(".rm"); if (rm) rm.textContent = "next"; }
    });
    document.querySelectorAll("details.area").forEach(function (d) {
      var list = pagesIn(d.dataset.area), n = countDone(list);
      d.querySelector(".ap").textContent = n + "/" + list.length;
      d.querySelector(".abar i").style.width = (n / list.length * 100) + "%";
      if (nu && nu.area === d.dataset.area) d.open = true;
    });
    if (location.hash && location.hash.indexOf("#area-") === 0) {
      var t = document.querySelector(location.hash); if (t) t.open = true;
    }
    var rs = document.querySelector(".reset");
    if (rs) rs.onclick = function () {
      if (!rs.dataset.armed) { rs.dataset.armed = 1; rs.textContent = "Tap again to erase all progress"; return; }
      done = {}; save("cca-done", done); ["cca-days", "cca-srs", "cca-qstats", "cca-mocks"].forEach(function (k) { save(k, k === "cca-mocks" ? [] : {}); });
      delete rs.dataset.armed; rs.textContent = "Reset progress"; renderHome();
      window.dispatchEvent(new Event("cca-progress")); toast("Progress reset");
    };
  }

  // ---------- flashcards ----------
  function initFlash() {
    if (!body.classList.contains("is-flash") || !window.CARDS) return;
    var all = window.CARDS, deck = [], start = 0, flipped = false, area = "all", mode = "due";
    var card = document.querySelector(".fcard"), empty = document.querySelector(".empty"), btns = document.querySelector(".fbtns");
    function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
    function build() {
      var pool = all.filter(function (c) { return area === "all" || c.area === area; });
      if (mode === "due") {
        var due = dueList(pool.map(function (c) { return c.id; }));
        pool = pool.filter(function (c) { return due.indexOf(c.id) >= 0; });
      }
      deck = shuffle(pool); start = deck.length;
      document.getElementById("dueN").textContent = "(" + dueList(all.map(function (c) { return c.id; })).length + ")";
      show();
    }
    function show() {
      var left = deck.length;
      document.querySelector(".left").textContent = left + " left";
      document.querySelector(".deckprog i").style.width = (start ? (start - left) / start * 100 : 0) + "%";
      empty.hidden = left > 0; card.hidden = !left; btns.style.visibility = left ? "visible" : "hidden";
      if (!left) return;
      var c = deck[0], a = S.areas[c.area] || {};
      card.style.setProperty("--ca", a.color || "#ebe6dc");
      card.classList.remove("flipped", "out-l", "out-r"); flipped = false;
      var lab = (a.name || "") + " · " + c.from;
      card.querySelectorAll(".from").forEach(function (f) { f.textContent = lab; });
      card.querySelector(".q").innerHTML = c.q;
      card.querySelector(".a").innerHTML = c.a;
      card.querySelector(".src").href = c.href;
    }
    function flip() { if (!deck.length) return; flipped = !flipped; card.classList.toggle("flipped", flipped); }
    function next(knew) {
      if (!deck.length) return;
      if (!flipped) { flip(); return; } // see the answer before judging yourself
      grade(deck[0].id, knew);
      card.classList.add(knew ? "out-r" : "out-l");
      setTimeout(function () {
        var c = deck.shift();
        if (!knew) deck.splice(Math.min(deck.length, 3 + Math.floor(Math.random() * 3)), 0, c);
        if (!deck.length) toast("Session done. These cards come back when they're due.");
        show();
      }, 280);
    }
    card.addEventListener("click", function (e) { if (!e.target.closest("a")) flip(); });
    document.querySelector(".got").onclick = function () { next(true); };
    document.querySelector(".again").onclick = function () { next(false); };
    document.getElementById("restart").onclick = function () {
      mode = "all"; document.querySelectorAll(".mchip").forEach(function (x) { x.classList.toggle("on", x.dataset.mode === "all"); }); build();
    };
    document.querySelectorAll(".fchip").forEach(function (b) {
      b.onclick = function () {
        document.querySelectorAll(".fchip").forEach(function (x) { x.classList.remove("on"); });
        b.classList.add("on"); area = b.dataset.area; build();
      };
    });
    document.querySelectorAll(".mchip").forEach(function (b) {
      b.onclick = function () {
        document.querySelectorAll(".mchip").forEach(function (x) { x.classList.remove("on"); });
        b.classList.add("on"); mode = b.dataset.mode; build();
      };
    });
    addEventListener("keydown", function (e) {
      if (e.key === " ") { e.preventDefault(); flip(); }
      else if (e.key === "ArrowRight") next(true);
      else if (e.key === "ArrowLeft") next(false);
      else if (e.key === "m") location.href = url("index.html");
    });
    var fx;
    card.addEventListener("touchstart", function (e) { fx = e.touches[0].clientX; }, { passive: true });
    card.addEventListener("touchend", function (e) {
      var dx = e.changedTouches[0].clientX - fx;
      if (flipped && Math.abs(dx) > 70) next(dx > 0);
    }, { passive: true });
    build();
  }

  renderDots(); renderDone(); renderHome(); initFlash();
})();
