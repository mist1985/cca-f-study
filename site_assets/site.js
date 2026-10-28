// CCA-F study site: progress, navigation, focus timer, flashcards. No dependencies.
(function () {
  "use strict";
  var S = window.SITE || { pages: [], areas: {} };
  var R = window.ROOT || ".";
  var body = document.body;
  var ID = body.dataset.id;
  var AREA = body.dataset.area;

  // ---------- storage (always wrapped: private mode can throw) ----------
  function load(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  var done = load("cca-done", {});
  var url = function (href) { return R + "/" + href; };
  var page = S.pages.filter(function (p) { return p.id === ID; })[0];
  var isContent = !!page;
  if (isContent) save("cca-last", ID);

  // ---------- toast ----------
  var toastEl = document.querySelector(".toast"), toastT;
  function toast(msg, ms) {
    if (!toastEl) return;
    toastEl.textContent = msg; toastEl.classList.add("show");
    clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove("show"); }, ms || 2600);
  }

  // ---------- reading progress bar ----------
  var bar = document.querySelector(".scrollbar i");
  function onScroll() {
    var h = document.documentElement.scrollHeight - innerHeight;
    if (bar) bar.style.width = (h > 0 ? Math.min(100, scrollY / h * 100) : 100) + "%";
  }
  addEventListener("scroll", onScroll, { passive: true }); onScroll();

  // ---------- area helpers ----------
  function pagesIn(area) { return S.pages.filter(function (p) { return p.area === area; }); }
  function countDone(list) { return list.filter(function (p) { return done[p.id]; }).length; }
  function nextUndone() {
    for (var i = 0; i < S.pages.length; i++) if (!done[S.pages[i].id]) return S.pages[i];
    return null;
  }

  // ---------- mini-map dots in the top bar ----------
  function renderDots() {
    var box = document.querySelector(".dots");
    if (!box || !isContent) return;
    box.innerHTML = "";
    pagesIn(AREA).forEach(function (p) {
      var a = document.createElement("a");
      a.className = "dot" + (done[p.id] ? " done" : "") + (p.id === ID ? " here" : "");
      a.href = url(p.href);
      a.title = (p.num ? p.num + " · " : "") + p.short + (done[p.id] ? " ✓" : "");
      a.setAttribute("aria-label", a.title);
      box.appendChild(a);
    });
  }

  // ---------- done button + confetti ----------
  var doneBtn = document.querySelector(".done-btn");
  function renderDone() {
    if (!doneBtn) return;
    var on = !!done[ID];
    doneBtn.classList.toggle("on", on);
    doneBtn.querySelector("b").textContent = on ? "✅" : "⬜";
    doneBtn.querySelector("small").textContent = on ? "Done!" : "Done?";
  }
  function toggleDone() {
    if (!isContent) return;
    if (done[ID]) { delete done[ID]; }
    else {
      done[ID] = Date.now();
      doneBtn && doneBtn.classList.add("pop");
      setTimeout(function () { doneBtn && doneBtn.classList.remove("pop"); }, 400);
      confetti();
      var list = pagesIn(AREA), n = countDone(list);
      var a = S.areas[AREA] || {};
      var total = countDone(S.pages);
      if (total === S.pages.length) toast("🏆 Everything done. Now go take the mock exams!", 4000);
      else if (n === list.length) toast("🎉 " + a.emoji + " " + a.name + " complete!", 3500);
      else toast(["Nice! 💪", "One more piece of the puzzle 🧩", "Locked in 🔒", "Keep the streak going 🔥"][total % 4] +
        "  " + n + "/" + list.length + " in this area");
    }
    save("cca-done", done);
    renderDone(); renderDots();
  }
  if (doneBtn) doneBtn.addEventListener("click", toggleDone);

  function confetti() {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var c = document.createElement("canvas"), x = c.getContext("2d");
    c.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:40";
    c.width = innerWidth; c.height = innerHeight; document.body.appendChild(c);
    var col = getComputedStyle(body).getPropertyValue("--a").trim() || "#fb923c";
    var cols = [col, "#4ade80", "#ecebe7", col];
    var ox = doneBtn ? doneBtn.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight - 60, width: 0 };
    var ps = [];
    for (var i = 0; i < 70; i++) ps.push({
      x: ox.left + ox.width / 2, y: ox.top, vx: (Math.random() - .5) * 9, vy: -Math.random() * 12 - 5,
      s: Math.random() * 6 + 4, r: Math.random() * 6, vr: (Math.random() - .5) * .3, c: cols[i % cols.length]
    });
    var t = 0;
    (function tick() {
      x.clearRect(0, 0, c.width, c.height);
      ps.forEach(function (p) {
        p.vy += .35; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.fillStyle = p.c;
        x.globalAlpha = Math.max(0, 1 - t / 70); x.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); x.restore();
      });
      if (++t < 70) requestAnimationFrame(tick); else c.remove();
    })();
  }

  // ---------- focus timer ----------
  var timerBtn = document.querySelector(".timer"), tLeft, tInt;
  function fmt(s) { return Math.floor(s / 60) + ":" + ("0" + s % 60).slice(-2); }
  function toggleTimer() {
    if (!timerBtn) return;
    var span = timerBtn.querySelector("span");
    if (timerBtn.classList.contains("end")) { // reset after it rang
      timerBtn.classList.remove("end"); tLeft = null; span.textContent = timerBtn.dataset.min + ":00"; return;
    }
    if (tInt) { clearInterval(tInt); tInt = null; timerBtn.classList.remove("run"); toast("⏸ Paused"); return; }
    if (!tLeft) tLeft = (+timerBtn.dataset.min || 3) * 60;
    timerBtn.classList.add("run"); toast("⏱ Focus: just this one page. You've got this.");
    tInt = setInterval(function () {
      tLeft--; span.textContent = fmt(tLeft);
      if (tLeft <= 0) {
        clearInterval(tInt); tInt = null; timerBtn.classList.remove("run"); timerBtn.classList.add("end");
        span.textContent = "0:00";
        if (navigator.vibrate) navigator.vibrate([150, 80, 150]);
        toast(done[ID] ? "⏰ Time! Card done. Stand up for 2 minutes 🚶" : "⏰ Time! Finish the 🧠 question, mark done, then a short break.", 5000);
      }
    }, 1000);
  }
  if (timerBtn) timerBtn.addEventListener("click", toggleTimer);

  // ---------- keyboard + swipe navigation ----------
  function go(dir) {
    var h = body.dataset[dir];
    if (h) location.href = h;
  }
  addEventListener("keydown", function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey || /input|textarea|select/i.test(e.target.tagName)) return;
    if (body.classList.contains("is-flash") || body.classList.contains("is-quiz")) return; // own keys
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
    skip = !!e.target.closest(".tw, pre, .stage");
  }, { passive: true });
  addEventListener("touchend", function (e) {
    if (skip || sx == null || !isContent) return;
    var t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy;
    if (Math.abs(dx) > 80 && Math.abs(dy) < 60 && Date.now() - st < 600) go(dx < 0 ? "next" : "prev");
    sx = null;
  }, { passive: true });
  if (isContent && "ontouchstart" in window && !load("cca-swipe-hint", false)) {
    var h = document.createElement("div"); h.className = "swipe-hint"; h.textContent = "👆 Swipe ← → to move between pages";
    document.body.appendChild(h); save("cca-swipe-hint", true);
    setTimeout(function () { h.remove(); }, 2600);
  }

  // ---------- home page ----------
  function setRing(el, frac) {
    var f = el && el.querySelector(".rf");
    if (f) f.setAttribute("stroke-dasharray", (Math.max(0, Math.min(1, frac)) * 100).toFixed(1) + " 100");
  }
  function renderHome() {
    if (!body.classList.contains("is-home")) return;
    var total = countDone(S.pages);
    document.getElementById("totalTxt").textContent = total;
    setTimeout(function () { setRing(document.querySelector(".ring.big"), total / S.pages.length); }, 60);
    document.querySelectorAll(".ring.small").forEach(function (r) {
      var list = pagesIn(r.dataset.area);
      setTimeout(function () { setRing(r, countDone(list) / list.length); }, 60);
    });
    var nu = nextUndone();
    document.querySelectorAll("[data-id]").forEach(function (el) {
      if (el === body) return;
      el.classList.toggle("is-done", !!done[el.dataset.id]);
      el.classList.toggle("next-up", !!nu && el.dataset.id === nu.id && el.classList.contains("chip") && !el.classList.contains("overview"));
      var ck = el.querySelector(".ck.big"); if (ck) ck.classList.toggle("on", !!done[el.dataset.id]);
    });
    var cta = document.getElementById("continue");
    var last = load("cca-last", null);
    if (cta && total > 0 && nu) {
      cta.href = nu.href;
      cta.textContent = "▶ Continue: " + (nu.num ? nu.num + " " : "") + nu.short;
    } else if (cta && !nu) {
      cta.href = "flashcards.html"; cta.textContent = "🏆 All done. Drill the flashcards";
    } else if (cta && last && total === 0) {
      var lp = S.pages.filter(function (p) { return p.id === last; })[0];
      if (lp) { cta.href = lp.href; cta.textContent = "▶ Back to: " + lp.short; }
    }
    var rs = document.querySelector(".reset");
    if (rs) rs.onclick = function () {
      if (!rs.dataset.armed) { rs.dataset.armed = 1; rs.textContent = "Tap again to really reset"; return; }
      done = {}; save("cca-done", done); delete rs.dataset.armed; rs.textContent = "Reset progress"; renderHome();
      toast("Progress reset");
    };
  }

  // ---------- flashcards ----------
  function initFlash() {
    if (!body.classList.contains("is-flash") || !window.CARDS) return;
    var all = window.CARDS, deck = [], start = 0, flipped = false, area = "all", type = "all";
    var card = document.querySelector(".fcard"), empty = document.querySelector(".empty");
    var btns = document.querySelector(".fbtns");
    function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
    function build() {
      deck = shuffle(all.filter(function (c) {
        return (area === "all" || c.area === area) && (type === "all" || c.type === type);
      }));
      start = deck.length; show();
    }
    function show() {
      var left = deck.length;
      document.querySelector(".left").textContent = left + " left of " + start;
      document.querySelector(".deckprog i").style.width = (start ? (start - left) / start * 100 : 0) + "%";
      empty.hidden = left > 0; card.hidden = !left; btns.style.visibility = left ? "visible" : "hidden";
      if (!left) { if (start) confettiCenter(); return; }
      var c = deck[0], a = S.areas[c.area] || {};
      card.style.setProperty("--ca", a.color || "#fb923c");
      card.classList.remove("flipped", "out-l", "out-r"); flipped = false;
      var label = (a.emoji || "") + " " + (a.name || "") + " · " + c.from;
      card.querySelectorAll(".from").forEach(function (f) { f.textContent = label; });
      card.querySelector(".q").innerHTML = c.q;
      card.querySelector(".a").innerHTML = c.a;
      card.querySelector(".src").href = c.href;
    }
    function confettiCenter() { if (typeof confetti === "function") { doneBtn = null; confetti(); } }
    function flip() { if (!deck.length) return; flipped = !flipped; card.classList.toggle("flipped", flipped); }
    function next(got) {
      if (!deck.length) return;
      if (!flipped) { flip(); return; } // look at the answer before judging yourself
      card.classList.add(got ? "out-r" : "out-l");
      setTimeout(function () {
        var c = deck.shift();
        if (!got) deck.splice(Math.min(deck.length, 3 + Math.floor(Math.random() * 3)), 0, c);
        show();
      }, 300);
    }
    card.addEventListener("click", function (e) { if (!e.target.closest("a")) flip(); });
    document.querySelector(".got").onclick = function () { next(true); };
    document.querySelector(".again").onclick = function () { next(false); };
    document.getElementById("restart").onclick = build;
    document.querySelectorAll(".fchip").forEach(function (b) {
      b.onclick = function () {
        document.querySelectorAll(".fchip").forEach(function (x) { x.classList.remove("on"); });
        b.classList.add("on"); area = b.dataset.area; build();
      };
    });
    document.querySelectorAll(".mchip").forEach(function (b) {
      b.onclick = function () {
        document.querySelectorAll(".mchip").forEach(function (x) { x.classList.remove("on"); });
        b.classList.add("on"); type = b.dataset.type; build();
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
