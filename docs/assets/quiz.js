// Quiz & mock exam. Questions come from window.QUESTIONS (built from question_bank/*.txt).
(function () {
  "use strict";
  var Q = window.QUESTIONS || [];
  var A = (window.SITE && window.SITE.areas) || {};
  var AREAS = ["D1", "D2", "D3", "D4", "D5"];
  var MOCK_SPLIT = { D1: 16, D2: 11, D3: 12, D4: 12, D5: 9 }; // 60, weighted like the exam
  var MOCK_MIN = 120;
  var $ = function (s) { return document.querySelector(s); };

  function load(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  var stats = load("cca-qstats", {});   // id -> {seen, right, last: true/false}
  var mocks = load("cca-mocks", []);    // [{date, pct, areas:{D1:pct..}}]

  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function pct(n, d) { return d ? Math.round(n / d * 100) : 0; }
  function areaOf(q) { return A[q.area] || { name: q.area, emoji: "", color: "#fb923c" }; }

  // ---------- home: stats per area ----------
  function renderStats() {
    var html = '<h2>Your accuracy</h2><p class="small">Target: 90% in every area (white line).</p><div class="sbars">';
    var totSeen = 0, totRight = 0;
    AREAS.forEach(function (a) {
      var qs = Q.filter(function (q) { return q.area === a; });
      var seen = 0, right = 0;
      qs.forEach(function (q) { var s = stats[q.id]; if (s) { seen++; if (s.last) right++; } });
      totSeen += seen; totRight += right;
      var p = pct(right, seen), ar = A[a] || {};
      html += '<div class="sbar" style="--a:' + ar.color + '"><div class="sl">' + ar.name +
        '<small>' + seen + "/" + qs.length + ' tried</small></div><div class="st"><i style="width:' + p +
        '%"></i><b class="goal"></b></div><div class="sp ' + (seen ? (p >= 90 ? "ok" : p >= 72 ? "mid" : "low") : "") + '">' +
        (seen ? p + "%" : "–") + "</div></div>";
    });
    html += "</div>";
    if (totSeen) html += '<p class="small">Overall (latest answer per question): <b>' + pct(totRight, totSeen) + "%</b> on " + totSeen + " questions.</p>";
    $("#stats").innerHTML = html;
    var best = mocks.reduce(function (b, m) { return Math.max(b, m.pct); }, 0);
    $("#mockBest").textContent = mocks.length ? "Mocks taken: " + mocks.length + " · best: " + best + "% · last: " + mocks[mocks.length - 1].pct + "%" : "";
    var miss = Q.filter(function (q) { return stats[q.id] && !stats[q.id].last; }).length;
    $("#startMistakes").textContent = miss ? "Review " + miss + " mistake" + (miss > 1 ? "s" : "") : "No mistakes yet";
    $("#startMistakes").disabled = !miss;
  }

  // ---------- session state ----------
  var S = null; // {mode, list, i, answers:{}, checked:{}, flags:{}, order:{}, end}
  var timerInt = null;

  function start(mode, list) {
    if (!list.length) { alertInline("No questions match. Try another filter."); return; }
    S = { mode: mode, list: list, i: 0, answers: {}, checked: {}, flags: {}, order: {} };
    list.forEach(function (q) { S.order[q.id] = shuffle(q.opts.map(function (_, k) { return k; })); });
    $("#q-home").hidden = true; $("#q-result").hidden = true; $("#q-run").hidden = false;
    $(".palette").hidden = mode !== "mock";
    $("#qFlag").style.display = mode === "mock" ? "" : "none";
    $(".qtimer").hidden = mode !== "mock";
    if (mode === "mock") {
      S.end = Date.now() + MOCK_MIN * 60000;
      clearInterval(timerInt); timerInt = setInterval(tick, 1000); tick();
    }
    show(); scrollTo(0, 0);
  }
  function alertInline(msg) { var h = $(".hint"); if (h) { h.textContent = msg; h.classList.add("warn"); } }

  function tick() {
    var left = Math.max(0, Math.round((S.end - Date.now()) / 1000));
    var el = $(".qtimer");
    el.textContent = "⏱ " + Math.floor(left / 60) + ":" + ("0" + left % 60).slice(-2);
    el.classList.toggle("low", left < 600);
    if (left <= 0) { clearInterval(timerInt); finish(); }
  }

  function show() {
    var q = S.list[S.i], ar = areaOf(q);
    var nOk = q.opts.filter(function (o) { return o.ok; }).length;
    var card = $(".qcard");
    card.style.setProperty("--a", ar.color);
    $(".qprog i").style.width = pct(S.i + 1, S.list.length) + "%";
    $(".qcount").textContent = (S.i + 1) + " / " + S.list.length;
    $(".qmeta").innerHTML = '<span class="qpill">' + ar.name + " · " + q.task + "</span>" +
      '<span class="qscen">' + q.scenario + "</span>";
    $(".qstem").innerHTML = q.stem.replace(/\s*\(Choose \d\)\s*$/i, "");
    $(".qhint").textContent = q.multi ? "Choose " + nOk : "Choose 1";
    var sel = S.answers[q.id] || [];
    var checked = !!S.checked[q.id];
    var box = $(".qopts"); box.innerHTML = "";
    S.order[q.id].forEach(function (k, pos) {
      var o = q.opts[k];
      var b = document.createElement("button");
      b.className = "qopt" + (sel.indexOf(k) >= 0 ? " sel" : "");
      b.innerHTML = '<span class="ql">' + "ABCDE"[pos] + "</span><span class=\"qt\">" + o.t + "</span>" +
        (checked ? '<span class="qwhy">' + o.why + "</span>" : "");
      if (checked) b.classList.add(o.ok ? "right" : (sel.indexOf(k) >= 0 ? "wrong" : "dim"));
      b.disabled = checked;
      b.onclick = function () { pick(q, k, nOk); };
      box.appendChild(b);
    });
    var fb = $(".qfeedback");
    if (checked) {
      var ok = isRight(q, sel);
      fb.hidden = false;
      fb.className = "qfeedback " + (ok ? "ok" : "bad");
      fb.innerHTML = (ok ? "Correct." : "Not quite. Read why each option is right or wrong.") +
        (q.href ? ' <a href="' + q.href + '">Review card ' + q.task + " →</a>" : "");
    } else fb.hidden = true;
    var main = $("#qMain");
    if (S.mode === "mock") main.textContent = S.i === S.list.length - 1 ? "Submit exam" : "Next →";
    else main.textContent = checked ? (S.i === S.list.length - 1 ? "See results" : "Next →") : "Check";
    main.disabled = S.mode !== "mock" && !checked && !sel.length;
    $("#qPrev").disabled = S.i === 0;
    $("#qFlag").classList.toggle("on", !!S.flags[q.id]);
    if (S.mode === "mock") renderPalette();
  }

  function pick(q, k, nOk) {
    if (S.checked[q.id]) return;
    var sel = (S.answers[q.id] || []).slice(), at = sel.indexOf(k);
    if (q.multi) { if (at >= 0) sel.splice(at, 1); else { sel.push(k); if (sel.length > nOk) sel.shift(); } }
    else sel = [k];
    S.answers[q.id] = sel; show();
  }

  function isRight(q, sel) {
    var want = q.opts.map(function (o, k) { return o.ok ? k : -1; }).filter(function (k) { return k >= 0; });
    return sel.length === want.length && want.every(function (k) { return sel.indexOf(k) >= 0; });
  }

  function record(q, ok) {
    var s = stats[q.id] || { seen: 0, right: 0 };
    s.seen++; if (ok) s.right++; s.last = ok; stats[q.id] = s; save("cca-qstats", stats);
    if (window.CCA_LOG) window.CCA_LOG("q");
  }

  function main() {
    var q = S.list[S.i];
    if (S.mode === "mock") {
      if (S.i === S.list.length - 1) {
        var open = S.list.filter(function (x) { return !(S.answers[x.id] || []).length; }).length;
        if (open && !confirmInline(open)) return;
        finish(); return;
      }
      S.i++; show(); return;
    }
    if (!S.checked[q.id]) {
      S.checked[q.id] = true; record(q, isRight(q, S.answers[q.id] || [])); show(); return;
    }
    if (S.i === S.list.length - 1) { finish(); return; }
    S.i++; show(); scrollTo(0, 0);
  }

  var confirmArmed = false;
  function confirmInline(open) {
    if (confirmArmed) { confirmArmed = false; return true; }
    confirmArmed = true;
    $("#qMain").textContent = open + " unanswered: tap again to submit";
    return false;
  }

  function renderPalette() {
    var p = $(".palette"); p.innerHTML = "";
    S.list.forEach(function (q, i) {
      var b = document.createElement("button");
      b.textContent = i + 1;
      b.className = ((S.answers[q.id] || []).length ? "ans" : "") + (S.flags[q.id] ? " flag" : "") + (i === S.i ? " here" : "");
      b.onclick = function () { S.i = i; show(); };
      p.appendChild(b);
    });
  }

  function finish() {
    clearInterval(timerInt);
    var per = {}, right = 0;
    AREAS.forEach(function (a) { per[a] = { n: 0, r: 0 }; });
    var wrong = [];
    S.list.forEach(function (q) {
      var sel = S.answers[q.id] || [], ok = isRight(q, sel);
      if (S.mode === "mock") record(q, ok);
      else if (!S.checked[q.id]) return; // unanswered practice questions don't count
      per[q.area].n++; if (ok) { per[q.area].r++; right++; } else wrong.push(q);
    });
    var total = AREAS.reduce(function (s, a) { return s + per[a].n; }, 0), p = pct(right, total);
    if (S.mode === "mock") {
      var ap = {}; AREAS.forEach(function (a) { ap[a] = pct(per[a].r, per[a].n); });
      mocks.push({ date: new Date().toISOString().slice(0, 10), pct: p, areas: ap }); save("cca-mocks", mocks);
    }
    var verdict = p >= 90 ? "Exam-ready level. Confirm it with another mock."
      : p >= 80 ? "Close. Review the mistakes, then the weakest area's cards."
      : p >= 72 ? "Around the pass line. Not safe yet. Aim for 90%."
      : "Keep going. Re-read the overview of your weakest area first.";
    var h = '<div class="res-top"><div class="res-pct ' + (p >= 90 ? "ok" : p >= 72 ? "mid" : "low") + '">' + p + "%</div>" +
      "<div><h1>" + (S.mode === "mock" ? "Mock exam result" : "Practice result") + "</h1><p>" + right + " of " + total +
      " correct</p><p>" + verdict + "</p></div></div>";
    h += '<h2>By area</h2><p class="small">The real score report shows this too. White line = 90% target.</p><div class="sbars">';
    AREAS.forEach(function (a) {
      if (!per[a].n) return;
      var ar = A[a] || {}, ap = pct(per[a].r, per[a].n);
      h += '<div class="sbar" style="--a:' + ar.color + '"><div class="sl">' + ar.name + "<small>" +
        per[a].r + "/" + per[a].n + '</small></div><div class="st"><i style="width:' + ap + '%"></i><b class="goal"></b></div>' +
        '<div class="sp ' + (ap >= 90 ? "ok" : ap >= 72 ? "mid" : "low") + '">' + ap + "%</div></div>";
    });
    h += "</div>";
    if (wrong.length) {
      h += "<h2>Review your mistakes</h2>";
      wrong.forEach(function (q) {
        var ar = areaOf(q), sel = S.answers[q.id] || [];
        h += '<details class="rev" style="--a:' + ar.color + '"><summary>' + q.task + " · " +
          q.stem.replace(/<[^>]+>/g, "").slice(0, 90) + "…</summary><div class=\"ans\"><p>" + q.stem + "</p><ul class=\"revopts\">";
        q.opts.forEach(function (o, k) {
          var mine = sel.indexOf(k) >= 0;
          h += '<li class="' + (o.ok ? "right" : mine ? "wrong" : "") + '">' + (o.ok ? "✓ " : mine ? "✗ " : "· ") +
            o.t + '<br><small>' + o.why + "</small></li>";
        });
        h += "</ul>" + (q.href ? '<a href="' + q.href + '">Review card ' + q.task + " →</a>" : "") + "</div></details>";
      });
    }
    h += '<div class="ctas"><button class="cta" id="again">Back to quiz menu</button>' +
      (wrong.length ? '<button class="cta ghost" id="redoWrong">Retry these ' + wrong.length + "</button>" : "") + "</div>";
    var r = $("#q-result"); r.innerHTML = h;
    $("#q-run").hidden = true; r.hidden = false; scrollTo(0, 0);
    $("#again").onclick = home;
    var rw = $("#redoWrong"); if (rw) rw.onclick = function () { start("practice", shuffle(wrong)); };
  }

  function home() {
    clearInterval(timerInt); S = null;
    $("#q-run").hidden = true; $("#q-result").hidden = true; $("#q-home").hidden = false;
    renderStats(); scrollTo(0, 0);
  }

  // ---------- wiring ----------
  var area = "all";
  document.querySelectorAll("#practice .fchip").forEach(function (b) {
    b.onclick = function () {
      document.querySelectorAll("#practice .fchip").forEach(function (x) { x.classList.remove("on"); });
      b.classList.add("on"); area = b.dataset.area;
    };
  });
  $("#startPractice").onclick = function () {
    var weak = $("#weakOnly").checked, n = +$("#qCount").value;
    var pool = Q.filter(function (q) {
      return (area === "all" || q.area === area) && (!weak || !stats[q.id] || !stats[q.id].last);
    });
    start("practice", shuffle(pool).slice(0, n));
  };
  $("#startMock").onclick = function () {
    var list = [];
    AREAS.forEach(function (a) {
      list = list.concat(shuffle(Q.filter(function (q) { return q.area === a; })).slice(0, MOCK_SPLIT[a]));
    });
    start("mock", shuffle(list));
  };
  $("#startMistakes").onclick = function () {
    start("practice", shuffle(Q.filter(function (q) { return stats[q.id] && !stats[q.id].last; })));
  };
  $("#qMain").onclick = main;
  $("#qPrev").onclick = function () { if (S.i > 0) { S.i--; show(); } };
  $("#qFlag").onclick = function () { var id = S.list[S.i].id; S.flags[id] = !S.flags[id]; show(); };
  $("#qQuit").onclick = function () {
    if (S && S.mode === "mock" && !this.dataset.armed) { this.dataset.armed = 1; this.textContent = "Tap again to quit (mock is lost)"; return; }
    delete this.dataset.armed; this.textContent = "Quit"; home();
  };
  addEventListener("keydown", function (e) {
    if (!S || $("#q-run").hidden || e.metaKey || e.ctrlKey) return;
    var q = S.list[S.i], n = parseInt(e.key, 10);
    if (n >= 1 && n <= q.opts.length) { pick(q, S.order[q.id][n - 1], q.opts.filter(function (o) { return o.ok; }).length); }
    else if (e.key === "Enter") { e.preventDefault(); if (!$("#qMain").disabled) main(); }
    else if (e.key === "ArrowLeft" && S.i > 0) { S.i--; show(); }
    else if (e.key === "ArrowRight" && S.mode === "mock" && S.i < S.list.length - 1) { S.i++; show(); }
  });

  renderStats();
  if (location.hash === "#mock") $("#mock").classList.add("hl");
  if (location.hash === "#practice") $("#practice").classList.add("hl");
})();
