/* 칠판 강의 화면 엔진 (board.js) — 전자칠판에 띄우고 방향키로 한 단계씩 넘기며 설명하는 화면
   짝: board.css. 정본: integrated-science-2/assets (sync_assets.js 의 OPTIONAL — 이 파일이 있는 저장소에만 복사된다).

   쓰는 법 (<단원>/board-0N.html)
     <div class="deck"><div class="stage">
       <section class="slide" data-title="목록에 보일 제목" data-part="①">  … 내용 …
         <aside class="script"><p>처음 대본</p><p data-at="2">2단계에서 할 말</p></aside>
       </section> …
     </div></div>
     <script src="../assets/board.js"></script>
   단계 공개
     data-step="k"  : k단계부터 보인다(빈칸이면 k단계에 답이 열린다).   data-hide="k" : k단계부터 흐려진다.
     data-only="k"  : k단계에서만 보인다.
     <b class="blank" data-n="3" data-step="1">답</b> : 개념정리 학습지(sheet-0N.html)의 같은 번호 빈칸. 번호는 학습지와 반드시 같게.
   화면 종류: class="slide dark|soft|cover", data-part 가 같은 장면끼리 오른쪽 위 진행 표시 한 칸을 함께 쓴다(표지는 비워 둔다).
   단계마다 그림을 바꾸려면  Board.on("장면 id", function (step, slide, forward) { … })  — 앞으로 넘어갈 때만 forward = true.
   숫자 올라가기:  Board.count(요소, 끝값, { from, ms, fmt })  (움직임 줄이기면 바로 끝값).

   조작: → · Space · PageDown · Enter · 화면 누르기 = 다음 / ← · PageUp · Backspace = 이전 / Home · End
         F 전체 화면 · T 선생님 대본 · O 장면 목록 · B 화면 가리기 · P 펜 · Esc 닫기
   주소: ?s=1 → 학생 복습판(아래 조작 막대가 늘 보이고 대본은 숨김).  #7 → 7번째 장면부터.
   움직임은 단계가 바뀔 때 한 번만 진행되고 멈춘다(반복 없음). 움직임 줄이기 설정이면 바로 끝 상태로 보인다. */
(function () {
  "use strict";
  var W = 1600, H = 900;
  var Q = new URLSearchParams(location.search);
  var STUDENT = Q.get("s") === "1";
  var REDUCE = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var deck = document.querySelector(".deck"), stage = document.querySelector(".stage");
  var slides = Array.prototype.slice.call(stage.querySelectorAll(".slide"));
  var N = slides.length, cur = 0, step = 0, hooks = {}, maxes = [];
  function $all(root, sel) { return Array.prototype.slice.call(root.querySelectorAll(sel)); }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

  /* ---- 준비: 빈칸 번호표, 장면마다 마지막 단계 (그림을 스크립트로 만드는 장면이 있어 첫 그리기 직전에) ---- */
  var prepared = false;
  function prep() {
  if (prepared) return; prepared = true;
  slides.forEach(function (s, i) {
    var m = 0;
    $all(s, "[data-step],[data-hide],[data-only]").forEach(function (e) {
      m = Math.max(m, +(e.getAttribute("data-step") || 0), +(e.getAttribute("data-hide") || 0), +(e.getAttribute("data-only") || 0));
    });
    maxes[i] = m;
    $all(s, ".blank[data-n]").forEach(function (b) {
      if (!b.querySelector(".bn")) b.insertBefore(el("i", "bn", b.getAttribute("data-n")), b.firstChild);
      b.setAttribute("aria-label", "빈칸 " + b.getAttribute("data-n"));
    });
  });
  }

  /* ---- 진행 표시 ---- */
  var parts = [];
  slides.forEach(function (s) { var p = s.getAttribute("data-part"); if (p && parts.indexOf(p) < 0) parts.push(p); });
  var pills = el("div", "pills"); stage.appendChild(pills);
  var prog = el("div", "progress"); stage.appendChild(prog);

  /* ---- 판서 층 ---- */
  var ink = el("canvas", "ink-layer"); ink.width = W * 2; ink.height = H * 2; stage.appendChild(ink);
  var ictx = ink.getContext("2d"); ictx.scale(2, 2); ictx.lineCap = "round"; ictx.lineJoin = "round";
  var strokes = {}, tool = null, drawing = null, laserPts = [], laserTimer = null;

  /* ---- 화면 맞추기 ---- */
  function fit() {
    var k = Math.min(window.innerWidth / W, window.innerHeight / H);
    stage.style.transform = "translate(-50%,-50%) scale(" + k + ")";
  }
  window.addEventListener("resize", fit); fit();

  /* ---- 그리기(장면 + 단계) ---- */
  function render(forward) {
    prep();
    var s = slides[cur];
    slides.forEach(function (x, i) { x.classList.toggle("current", i === cur); });
    $all(s, "[data-step]").forEach(function (e) { e.classList.toggle("on", step >= +e.getAttribute("data-step")); });
    $all(s, "[data-hide]").forEach(function (e) { e.classList.toggle("off", step >= +e.getAttribute("data-hide")); });
    $all(s, "[data-only]").forEach(function (e) { e.classList.toggle("on", step === +e.getAttribute("data-only")); });
    s.setAttribute("data-s", step);
    var p = s.getAttribute("data-part"), pi = parts.indexOf(p);
    pills.innerHTML = "";
    pills.style.display = p ? "flex" : "none";
    pills.classList.toggle("on-dark", s.classList.contains("dark"));
    parts.forEach(function (name, i) {
      var sp = el("span", i === pi ? "now" : (i < pi ? "past" : ""), i === pi ? name : String(i + 1));
      pills.appendChild(sp);
    });
    prog.style.width = ((cur + (maxes[cur] ? step / (maxes[cur] + 1) : 0) + 1) / N * 100) + "%";
    if (hooks[s.id]) { try { hooks[s.id](step, s, !!forward); } catch (e) { console.error(e); } }
    redrawInk();
    updateBar(); updateScript(); updateOverview();
    if (history.replaceState) history.replaceState(null, "", location.pathname + location.search + "#" + (cur + 1));
  }
  function go(i, st, forward) {
    i = Math.max(0, Math.min(N - 1, i));
    cur = i; step = st === "end" ? maxes[i] : (st || 0);
    render(forward);
  }
  function next() { if (step < maxes[cur]) { step++; render(true); } else if (cur < N - 1) go(cur + 1, 0, true); }
  function prev() { if (step > 0) { step--; render(false); } else if (cur > 0) go(cur - 1, "end", false); }
  function revealAll() { step = maxes[cur]; render(true); }

  /* ---- 조작 막대 ---- */
  var bar = el("div", "bar" + (STUDENT ? "" : " hidden"));
  function btn(label, title, fn) { var b = el("button", "", label); b.title = title; b.setAttribute("aria-label", title); b.addEventListener("click", function (ev) { ev.stopPropagation(); fn(); }); bar.appendChild(b); return b; }
  btn("↺", "처음으로", function () { go(0, 0); });
  btn("☰", "장면 목록 (O)", function () { toggleOverview(); });
  btn("◀", "이전 (←)", prev);
  var count = el("span", "count"); bar.appendChild(count);
  btn("▶", "다음 (→)", next);
  var bAll = btn("한 번에", "이 장면 빈칸 모두 열기", revealAll);
  var bScript = STUDENT ? null : btn("대본", "선생님 대본 (T)", function () { toggleScript(); });
  btn("⛶", "전체 화면 (F)", toggleFull);
  document.body.appendChild(bar);
  function updateBar() { count.textContent = (cur + 1) + " / " + N; bAll.disabled = step >= maxes[cur]; bAll.style.opacity = bAll.disabled ? .4 : 1; if (bScript) bScript.classList.toggle("on", scriptOpen); }
  var hideT = null;
  function pokeBar() {
    if (STUDENT) return;
    bar.classList.remove("hidden"); clearTimeout(hideT);
    hideT = setTimeout(function () { if (!bar.matches(":hover")) bar.classList.add("hidden"); }, 2600);
  }
  document.addEventListener("mousemove", pokeBar);

  /* ---- 선생님 대본 ---- */
  var scriptPanel = el("div", "script-panel"), scriptOpen = false;
  document.body.appendChild(scriptPanel);
  function toggleScript(v) { if (STUDENT) return; scriptOpen = v == null ? !scriptOpen : v; scriptPanel.classList.toggle("open", scriptOpen); document.body.classList.toggle("script-open", scriptOpen); updateScript(); updateBar(); }
  function updateScript() {
    if (!scriptOpen) return;
    var s = slides[cur], sc = s.querySelector(".script"), nx = slides[cur + 1];
    var html = "<div class='head'><b>" + (cur + 1) + ". " + (s.getAttribute("data-title") || "") + "</b><span>단계 " + step + " / " + maxes[cur] + "</span>" +
      "<span class='nx'>" + (nx ? "다음 → " + (nx.getAttribute("data-title") || "") : "마지막 장면") + "</span></div>";
    if (sc) {
      var ps = $all(sc, "p"), nowIdx = -1;
      ps.forEach(function (p, i) { if (+(p.getAttribute("data-at") || 0) <= step) nowIdx = i; });
      ps.forEach(function (p, i) {
        var at = +(p.getAttribute("data-at") || 0);
        html += "<p class='" + (i === nowIdx ? "now" : "") + "'><span class='st'>" + (at ? at + "단계" : "처음") + "</span>" + p.innerHTML + "</p>";
      });
    } else html += "<p>대본이 없는 장면입니다.</p>";
    scriptPanel.innerHTML = html;
  }

  /* ---- 장면 목록 ---- */
  var ov = el("div", "overview"), ovOpen = false;
  ov.appendChild(el("h4", "", "전체 보기 · " + N + "장"));
  var grid = el("div", "grid"); ov.appendChild(grid);
  slides.forEach(function (s, i) {
    var b = el("button", s.classList.contains("dark") ? "dk" : "",
      "<i>" + String(i + 1).padStart(2, "0") + "</i><b>" + (s.getAttribute("data-title") || "") + "</b><em>" + (s.getAttribute("data-part") || "") + "</em>");
    b.addEventListener("click", function () { go(i, 0); toggleOverview(false); });
    grid.appendChild(b);
  });
  ov.addEventListener("click", function (ev) { if (ev.target === ov) toggleOverview(false); });
  document.body.appendChild(ov);
  function toggleOverview(v) { ovOpen = v == null ? !ovOpen : v; ov.classList.toggle("open", ovOpen); updateOverview(); }
  function updateOverview() { $all(grid, "button").forEach(function (b, i) { b.classList.toggle("now", i === cur); }); }

  /* ---- 전체 화면·가리기 ---- */
  function toggleFull() {
    if (!document.fullscreenElement) { (document.documentElement.requestFullscreen || function () {}).call(document.documentElement); }
    else if (document.exitFullscreen) document.exitFullscreen();
  }
  var black = el("div", "blackout"); document.body.appendChild(black);
  black.addEventListener("click", function () { black.classList.remove("on"); });

  /* ---- 판서 ---- */
  var fab = el("button", "pen-fab", "<svg viewBox='0 0 24 24' width='26' height='26' fill='none' stroke='currentColor' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'><path d='M4 20l4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20z'/><path d='M13.5 7.5l3 3'/></svg>"); fab.title = "판서 도구 (P)"; fab.setAttribute("aria-label", "판서 도구 열기/닫기");
  var tools = el("div", "pen-tools");
  var TOOLS = [
    { id: "laser", html: "레이저", title: "레이저 포인터" },
    { id: "red", html: "<span class='dot' style='background:#e03131'></span>", title: "빨간 펜", c: "#e03131", w: 6 },
    { id: "blue", html: "<span class='dot' style='background:#1c7ed6'></span>", title: "파란 펜", c: "#1c7ed6", w: 6 },
    { id: "hl", html: "<span class='dot' style='background:#ffd43b'></span>", title: "형광펜", c: "rgba(255,212,59,.45)", w: 26 },
    { id: "clear", html: "지우기", title: "이 장면 판서 지우기" }
  ];
  TOOLS.forEach(function (t) {
    var b = el("button", "", t.html); b.title = t.title; b.setAttribute("aria-label", t.title); b.dataset.id = t.id;
    b.addEventListener("click", function (ev) {
      ev.stopPropagation();
      if (t.id === "clear") { strokes[cur] = []; redrawInk(); return; }
      setTool(tool && tool.id === t.id ? null : t);
    });
    tools.appendChild(b);
  });
  fab.addEventListener("click", function (ev) { ev.stopPropagation(); var open = !tools.classList.contains("open"); tools.classList.toggle("open", open); if (!open) setTool(null); else if (!tool) setTool(TOOLS[1]); });
  document.body.appendChild(tools); document.body.appendChild(fab);
  function setTool(t) {
    tool = t;
    ink.classList.toggle("active", !!t); ink.classList.toggle("laser", !!t && t.id === "laser");
    fab.classList.toggle("on", !!t);
    $all(tools, "button").forEach(function (b) { b.classList.toggle("sel", !!t && b.dataset.id === t.id); });
    laserPts = []; redrawInk();
  }
  function stagePt(ev) { var r = stage.getBoundingClientRect(); return { x: (ev.clientX - r.left) / r.width * W, y: (ev.clientY - r.top) / r.height * H }; }
  function redrawInk() {
    ictx.clearRect(0, 0, W, H);
    (strokes[cur] || []).forEach(function (s) { line(s); });
    if (laserPts.length) {
      var now = Date.now();
      laserPts = laserPts.filter(function (p) { return now - p.t < 450; });
      for (var i = 1; i < laserPts.length; i++) {
        var a = 1 - (now - laserPts[i].t) / 450;
        ictx.strokeStyle = "rgba(255,40,40," + (a * .55).toFixed(2) + ")"; ictx.lineWidth = 8 * a + 2;
        ictx.beginPath(); ictx.moveTo(laserPts[i - 1].x, laserPts[i - 1].y); ictx.lineTo(laserPts[i].x, laserPts[i].y); ictx.stroke();
      }
      var L = laserPts[laserPts.length - 1];
      if (L) { var g = ictx.createRadialGradient(L.x, L.y, 1, L.x, L.y, 22); g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(.25, "rgba(255,40,40,.95)"); g.addColorStop(1, "rgba(255,40,40,0)"); ictx.fillStyle = g; ictx.beginPath(); ictx.arc(L.x, L.y, 22, 0, 6.2832); ictx.fill(); }
    }
  }
  function line(s) {
    if (s.pts.length < 2) return;
    ictx.strokeStyle = s.c; ictx.lineWidth = s.w; ictx.beginPath(); ictx.moveTo(s.pts[0].x, s.pts[0].y);
    for (var i = 1; i < s.pts.length; i++) ictx.lineTo(s.pts[i].x, s.pts[i].y);
    ictx.stroke();
  }
  function laserTick() { redrawInk(); if (laserPts.length) laserTimer = setTimeout(laserTick, 33); else laserTimer = null; }
  ink.addEventListener("pointerdown", function (ev) {
    if (!tool) return; ev.preventDefault(); ev.stopPropagation(); ink.setPointerCapture(ev.pointerId);
    if (tool.id === "laser") return;
    drawing = { c: tool.c, w: tool.w, pts: [stagePt(ev)] }; (strokes[cur] = strokes[cur] || []).push(drawing);
  });
  ink.addEventListener("pointermove", function (ev) {
    if (!tool) return;
    var p = stagePt(ev);
    if (tool.id === "laser") { p.t = Date.now(); laserPts.push(p); if (!laserTimer) laserTick(); return; }
    if (drawing) { drawing.pts.push(p); redrawInk(); }
  });
  ink.addEventListener("pointerup", function () { drawing = null; });
  ink.addEventListener("click", function (ev) { if (tool) ev.stopPropagation(); });

  /* ---- 누르기·밀기 ---- */
  var downX = null;
  deck.addEventListener("pointerdown", function (ev) { downX = ev.clientX; });
  deck.addEventListener("pointerup", function (ev) {
    if (tool || downX == null) return;
    var dx = ev.clientX - downX; downX = null;
    if (ev.target.closest && ev.target.closest("a,button,input,select,textarea,label,.no-advance")) return;
    if (dx > 60) prev(); else if (dx < -60) next(); else next();
  });

  /* ---- 건반 ---- */
  document.addEventListener("keydown", function (ev) {
    if (ev.target && /INPUT|TEXTAREA|SELECT/.test(ev.target.tagName)) return;
    if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
    var k = ev.key;
    if (black.classList.contains("on") && k !== "b" && k !== "B" && k !== "Escape") { black.classList.remove("on"); }
    if (k === "ArrowRight" || k === " " || k === "PageDown" || k === "Enter" || k === "ArrowDown") { ev.preventDefault(); next(); }
    else if (k === "ArrowLeft" || k === "PageUp" || k === "Backspace" || k === "ArrowUp") { ev.preventDefault(); prev(); }
    else if (k === "Home") go(0, 0);
    else if (k === "End") go(N - 1, 0);
    else if (k === "f" || k === "F") toggleFull();
    else if (k === "t" || k === "T") toggleScript();
    else if (k === "o" || k === "O") toggleOverview();
    else if (k === "b" || k === "B" || k === ".") black.classList.toggle("on");
    else if (k === "p" || k === "P") fab.click();
    else if (k === "Escape") { toggleOverview(false); toggleScript(false); black.classList.remove("on"); tools.classList.remove("open"); setTool(null); }
  });

  /* ---- 처음 안내 ---- */
  if (!STUDENT) {
    var help = el("div", "help", "<kbd>→</kbd><kbd>Space</kbd> 다음 · <kbd>←</kbd> 이전 · <kbd>T</kbd> 대본 · <kbd>O</kbd> 목록 · <kbd>F</kbd> 전체 화면 · 오른쪽 아래 펜 단추로 판서");
    document.body.appendChild(help);
    setTimeout(function () { help.classList.add("gone"); }, 5000);
  }

  /* ---- 바깥에 내주는 것 ---- */
  window.Board = {
    on: function (id, fn) { hooks[id] = fn; },
    go: go, next: next, prev: prev, REDUCE: REDUCE, STUDENT: STUDENT,
    count: function (node, to, o) {
      o = o || {}; var from = o.from || 0, ms = o.ms || 900, fmt = o.fmt || function (v) { return Math.round(v).toLocaleString(); };
      clearTimeout(node._ct);
      if (REDUCE || o.instant) { node.textContent = fmt(to); return; }
      var t0 = Date.now();
      (function tick() {
        var u = Math.min(1, (Date.now() - t0) / ms), e = 1 - Math.pow(1 - u, 3);
        node.textContent = fmt(from + (to - from) * e);
        if (u < 1) node._ct = setTimeout(tick, 33);
      })();
    }
  };

  var h = parseInt((location.hash || "").slice(1), 10);
  document.addEventListener("DOMContentLoaded", function () { render(false); });
  if (h >= 1 && h <= N) { cur = h - 1; }
  if (document.readyState !== "loading") setTimeout(function () { render(false); }, 0);
})();
