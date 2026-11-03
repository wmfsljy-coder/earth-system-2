/* 지구시스템과학 Ⅱ-2 강수 과정과 대기의 운동 — 소단원별 이야기 네 편
   01 달 기지 설계도 / 02 산을 넘은 바람 / 03 하늘에 멈춰 선 기구 / 04 제트 기류를 읽는 사람
   공용 부품: ../assets/theme.js (sthUnit·sthGate·sthWork·setupCanvas·cssVar·drawArrow),
              ../assets/story.js (sthStory·sthMission·sthSort·sthOrder·sthPick) */
(function () {
"use strict";

window.sthUnit("esys-2-2");

var FONT = "'Gothic A1','Segoe UI',sans-serif";
var G = 9.8;

function $(id) { return document.getElementById(id); }
function v(name) { return window.cssVar(name); }
function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
function done(id) { var e = $(id); if (e) e.classList.add("done"); }
function paper(ctx, W, H) { ctx.clearRect(0, 0, W, H); ctx.fillStyle = v("--panel"); ctx.fillRect(0, 0, W, H); }
function text(ctx, s, x, y, o) {
  o = o || {};
  ctx.font = (o.w || "500") + " " + (o.s || 12) + "px " + FONT;
  ctx.fillStyle = o.c || v("--ink"); ctx.textAlign = o.a || "left";
  ctx.fillText(s, x, y);
}
function arrow(ctx, x1, y1, x2, y2, col, wide, head) {
  ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = wide || 3;
  window.drawArrow(ctx, x1, y1, x2, y2, head || 11);
}
function box(ctx, x, y, w, h, fill, stroke, r) {
  window.roundRect(ctx, x, y, w, h, r || 12);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); }
}
function dash(ctx, x1, y1, x2, y2, col, w) {
  ctx.strokeStyle = col; ctx.lineWidth = w || 1.5; ctx.setLineDash([5, 4]);
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.setLineDash([]);
}
function seg(id, fn) {
  var bs = document.querySelectorAll("#" + id + " button");
  Array.prototype.forEach.call(bs, function (b) {
    b.addEventListener("click", function () {
      Array.prototype.forEach.call(bs, function (x) { x.classList.toggle("on", x === b); });
      fn(b);
    });
  });
}
/* 마지막(결말) 장면을 열었을 때 마무리하기 */
function endScene(ep, idx, fn) {
  ep.onShow(function (i) { if (i === idx) { fn(); ep.clear(idx); } });
  if (ep.at() === idx) { fn(); ep.clear(idx); }
}

/* ---- 그림 도구(무대) — ../assets/kit.js ---- */
var K = window.sthKit, KC = K.C, REDUCE = K.REDUCE;
/* 계속 도는 움직임의 멈추기 단추 */
function playWire(id, st, onTxt, offTxt) {
  var b = $(id); if (!b) return;
  function paint() { b.textContent = st.on ? "⏸ " + onTxt : "▶ " + offTxt; }
  b.addEventListener("click", function () { st.on = !st.on; paint(); });
  paint();
}
/* 뭉게구름: 둥근 덩이 여럿 */
function cloud(ctx, x, y, s, a, tint) {
  ctx.save(); ctx.globalAlpha = a == null ? .9 : a;
  [[0, 0, 1], [-.9, .25, .72], [.9, .25, .75], [-.4, -.45, .78], [.45, -.4, .7]].forEach(function (q) {
    var cx = x + q[0] * s, cy = y + q[1] * s, r = q[2] * s;
    var g = ctx.createRadialGradient(cx - r * .3, cy - r * .4, r * .1, cx, cy, r);
    g.addColorStop(0, "#ffffff"); g.addColorStop(.6, tint || "#dfe6f5"); g.addColorStop(1, "rgba(150,165,200,.9)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.2832); ctx.fill();
  });
  ctx.restore();
}
/* 산·땅 재질 */
function hillGrad(ctx, y0, y1) {
  var g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, "#6f8f5a"); g.addColorStop(.45, "#40603a"); g.addColorStop(1, "#1f3220");
  return g;
}
function soilGrad(ctx, y0, y1) {
  var g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, "#8a6a45"); g.addColorStop(1, "#3a2a1c");
  return g;
}
/* 값을 색으로: 차가움(파랑) ~ 따뜻함(빨강), u 는 0~1 */
function heatCol(u, a) {
  u = clamp(u, 0, 1);
  var r = Math.round(80 + 175 * u), gr = Math.round(150 - 60 * Math.abs(u - .5) * 2 + 40 * (1 - Math.abs(u - .5) * 2)), b = Math.round(255 - 170 * u);
  return "rgba(" + r + "," + gr + "," + b + "," + (a == null ? 1 : a) + ")";
}

/* =========================================================================
   이야기 ① 달 기지 설계도 — 선택적 흡수 · 복사 평형 온도 · 열수지
   ========================================================================= */
(function () {
  var ep = window.sthStory({ root: "epA", key: "epA", name: "사건 파일 ①", onDone: finish });

  window.sthGate({
    gate: "gA", key: "pA1", title: "자문관의 첫 추리",
    question: "달과 지구는 태양에서 거의 같은 거리에 있습니다. 그런데 왜 달의 하루 기온 차는 300 ℃에 이를까요?",
    options: [
      "㉠ 달이 지구보다 태양에서 조금 더 멀기 때문이다",
      "㉡ 달에는 에너지를 붙잡아 두었다가 되돌려 주는 대기가 없기 때문이다",
      "㉢ 달의 땅이 지구의 땅보다 열을 훨씬 잘 흡수하기 때문이다"
    ],
    onPick: function () { ep.clear(0); }
  });

  /* ---------------- 장면 2 — 선택적 흡수 스펙트럼 ---------------- */
  var BANDS = [
    [0.72, 0.5, 0.02, "h2o"], [0.82, 0.8, 0.03, "h2o"], [0.94, 1.5, 0.04, "h2o"],
    [1.13, 2.5, 0.05, "h2o"], [1.38, 30, 0.08, "h2o"], [1.87, 40, 0.10, "h2o"],
    [2.70, 60, 0.15, "h2o"], [5.50, 10, 0.40, "h2o"], [6.25, 50, 0.60, "h2o"],
    [10.0, 0.35, 2.20, "h2o"],
    [1.60, 0.3, 0.03, "co2"], [2.00, 1.0, 0.04, "co2"], [4.26, 80, 0.12, "co2"],
    [10.4, 0.3, 0.30, "co2"], [15.0, 90, 1.30, "co2"],
    [9.60, 3.0, 0.25, "o3"],
    [3.30, 8, 0.10, "etc"], [7.70, 6, 0.25, "etc"], [7.90, 3, 0.15, "etc"]
  ];
  function tauOf(L) {
    var t = { o3: 0, h2o: 0, co2: 0, etc: 0 };
    t.o3 += 200 / (1 + Math.exp((L - 0.290) / 0.006));
    t.etc += 0.0088 * Math.pow(L, -4.15);
    for (var i = 0; i < BANDS.length; i++) {
      var b = BANDS[i], z = (L - b[0]) / b[2];
      if (Math.abs(z) < 6) t[b[3]] += b[1] * Math.exp(-z * z);
    }
    if (L > 16) t.h2o += 1.5 * (L - 16);
    return t;
  }
  function trans(L) { var t = tauOf(L); return Math.exp(-(t.o3 + t.h2o + t.co2 + t.etc)); }

  (function () {
    var canvas = $("a-sp"); if (!canvas) return;
    var ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var sv = 130;
    var got = window.sthState("aSp") || { a: false, b: false, c: false, d: false };
    var X0 = 70, X1 = 860, YT = 78, YB = 262, LOG = Math.log(10) / Math.LN10;

    function lamOf(s) { return Math.pow(10, -1 + s / 100); }
    function xOf(L) { return X0 + (Math.log(L) / Math.LN10 + 1) / 2.602 * (X1 - X0); }
    function yOf(t) { return YB - t * (YB - YT); }

    function draw() {
      var L = lamOf(sv), T = trans(L), t = tauOf(L);
      ctx.clearRect(0, 0, W, H);
      K.stage(ctx, 0, 0, W, H, "lab", { seed: 71, title: "대기의 투과율 — 파장에 따라 이렇게 다르다" });
      K.t(ctx, "왼쪽은 주로 태양 복사(0.1~4 µm), 오른쪽은 주로 지구 복사(4~40 µm)", W - 16, 30, { s: 11, a: "right", c: KC.mute });
      /* 배경 구역 */
      var x4 = xOf(4);
      var sg = ctx.createLinearGradient(X0, 0, x4, 0); sg.addColorStop(0, "rgba(255,211,107,.04)"); sg.addColorStop(1, "rgba(255,211,107,.16)");
      ctx.fillStyle = sg; ctx.fillRect(X0, YT, x4 - X0, YB - YT);
      var eg = ctx.createLinearGradient(x4, 0, X1, 0); eg.addColorStop(0, "rgba(182,156,255,.16)"); eg.addColorStop(1, "rgba(182,156,255,.04)");
      ctx.fillStyle = eg; ctx.fillRect(x4, YT, X1 - x4, YB - YT);
      K.pill(ctx, "☀ 태양 복사", (X0 + x4) / 2, YT - 8, { a: "center", s: 11, c: KC.yellow });
      K.pill(ctx, "🌍 지구 복사", (x4 + X1) / 2, YT - 8, { a: "center", s: 11, c: KC.violet });
      /* 대기의 창 */
      ctx.fillStyle = "rgba(63,211,163,.10)"; ctx.fillRect(xOf(8), YT, xOf(12) - xOf(8), YB - YT);
      K.t(ctx, "대기의 창", (xOf(8) + xOf(12)) / 2, YT + 16, { s: 10.5, a: "center", c: KC.green });
      /* 축 */
      [0, 0.5, 1].forEach(function (p) {
        K.line(ctx, { x: X0, y: yOf(p) }, { x: X1, y: yOf(p) }, KC.grid, 1, [4, 4]);
        K.t(ctx, Math.round(p * 100) + "%", X0 - 6, yOf(p) + 4, { s: 10, a: "right", c: KC.mute });
      });
      K.line(ctx, { x: X0, y: YT }, { x: X0, y: YB }, KC.line, 1.5); K.line(ctx, { x: X0, y: YB }, { x: X1, y: YB }, KC.line, 1.5);
      /* 가시광선 띠 */
      for (var q = 0; q <= 60; q++) {
        var lq = 0.40 + q / 60 * 0.35, hue = 270 - q / 60 * 270;
        ctx.fillStyle = "hsl(" + hue + ",90%,60%)"; ctx.fillRect(xOf(lq), YB + 3, xOf(lq + 0.006) - xOf(lq) + 1, 5);
      }
      [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 40].forEach(function (tk) { K.t(ctx, String(tk), xOf(tk), YB + 22, { s: 10, a: "center", c: KC.mute }); });
      K.t(ctx, "파장 (µm, 로그 눈금) · 무지개 띠 = 가시광선", (X0 + X1) / 2, YB + 40, { s: 11, a: "center", c: KC.mute });
      /* 투과율 곡선 */
      ctx.beginPath(); ctx.moveTo(xOf(lamOf(0)), YB);
      for (var s = 0; s <= 260; s++) { var ll = lamOf(s); ctx.lineTo(xOf(ll), yOf(trans(ll))); }
      ctx.lineTo(xOf(lamOf(260)), YB); ctx.closePath();
      var fg = ctx.createLinearGradient(0, YT, 0, YB); fg.addColorStop(0, "rgba(63,211,163,.40)"); fg.addColorStop(1, "rgba(63,211,163,.04)");
      ctx.fillStyle = fg; ctx.fill();
      ctx.save(); ctx.shadowColor = KC.green; ctx.shadowBlur = 8; ctx.strokeStyle = KC.green; ctx.lineWidth = 2.4; ctx.beginPath();
      for (s = 0; s <= 260; s++) { ll = lamOf(s); if (s === 0) ctx.moveTo(xOf(ll), yOf(trans(ll))); else ctx.lineTo(xOf(ll), yOf(trans(ll))); }
      ctx.stroke(); ctx.restore();
      /* 지금 파장 */
      var cx = xOf(L);
      K.line(ctx, { x: cx, y: YT }, { x: cx, y: YB }, KC.red, 2, [5, 4]);
      K.glow(ctx, cx, yOf(T), 5, "rgba(255,120,140,.98)", 3.4);
      K.pill(ctx, L.toFixed(2) + " µm", cx + (cx > 700 ? -8 : 8), Math.max(YT + 34, Math.min(YB - 8, yOf(T) - 10)), { s: 11, a: cx > 700 ? "right" : "left", c: KC.red });
      /* 큰 숫자 */
      K.t(ctx, "파장 " + L.toFixed(2) + " µm의 투과율", 30, 330, { s: 11.5, w: "800", c: KC.mute });
      K.pill(ctx, (T * 100).toFixed(1) + " %", 36, 374, { s: 28, c: T > 0.5 ? KC.green : KC.red });
      K.t(ctx, T > 0.5 ? "거의 그대로 지나갑니다" : (T > 0.1 ? "일부만 지나갑니다" : "대기가 거의 모두 붙잡습니다"), 30, 404, { s: 11.5, w: "800", c: KC.mute });
      /* 기체별 막대 */
      var rows = [["오존·산소", t.o3, KC.violet], ["수증기", t.h2o, KC.blue], ["이산화 탄소", t.co2, KC.red], ["그 밖의 기체·산란", t.etc, KC.green]];
      K.t(ctx, "막대 = 이 파장에서 각 기체가 빛을 붙잡는 정도", 470, 318, { s: 10.5, c: KC.mute });
      for (var i = 0; i < rows.length; i++) {
        var yy2 = 338 + i * 22;
        K.t(ctx, rows[i][0], 460, yy2 + 4, { s: 10.5, a: "right", c: KC.mute });
        ctx.fillStyle = "rgba(255,255,255,.07)"; ctx.beginPath(); ctx.roundRect(470, yy2 - 8, 300, 12, 6); ctx.fill();
        ctx.save(); ctx.shadowColor = rows[i][2]; ctx.shadowBlur = 8; ctx.fillStyle = rows[i][2];
        ctx.beginPath(); ctx.roundRect(470, yy2 - 8, Math.max(rows[i][1] < 0.02 ? 0 : 6, clamp(rows[i][1] / 6, 0, 1) * 300), 12, 6); ctx.fill(); ctx.restore();
        K.t(ctx, rows[i][1] < 0.02 ? "거의 없음" : "흡수 " + rows[i][1].toFixed(2), W - 16, yy2 + 4, { s: 10.5, w: "800", a: "right", c: rows[i][1] < 0.02 ? KC.dim : KC.ink });
      }
      $("a-sp-info").innerHTML =
        "파장 <b>" + L.toFixed(2) + " µm</b> — 투과율 <b>" + (T * 100).toFixed(1) + " %</b>. " +
        (L < 0.4 ? "자외선 영역입니다. 성층권의 <b>오존</b>이 파장 0.3 µm보다 짧은 빛을 거의 모두 흡수합니다."
          : L < 0.75 ? "가시광선 영역입니다. 대기를 이루는 기체들은 이 영역을 거의 흡수하지 않아 햇빛이 지표까지 들어옵니다."
          : L < 4 ? "근적외선 영역입니다. <b>수증기</b>가 군데군데 띠 모양으로 흡수합니다."
          : (L >= 8 && L <= 12 && T > 0.5) ? "지구 복사 영역인데도 잘 빠져나갑니다. 여기가 바로 <b>대기의 창</b>입니다."
          : "적외선 영역입니다. <b>수증기와 이산화 탄소</b>가 지구 복사를 대부분 흡수했다가 다시 내보냅니다 — 온실 효과의 정체입니다.");

      var ch = false;
      if (!got.a && L < 0.30 && T <= 0.01) { got.a = true; ch = true; }
      if (!got.b && L >= 0.40 && L <= 0.75 && T >= 0.70) { got.b = true; ch = true; }
      if (!got.c && L >= 5 && T <= 0.10) { got.c = true; ch = true; }
      if (!got.d && L >= 8 && L <= 12 && T >= 0.60) { got.d = true; ch = true; }
      if (ch) { window.sthState("aSp", got); mission(); }
    }
    function mission() {
      if (got.a) done("mA2a");
      if (got.b) done("mA2b");
      if (got.c) done("mA2c");
      if (got.d) done("mA2d");
      if (got.a && got.b && got.c && got.d) {
        window.sthMission("mA2", true, "<span class='m-tag'>미션 완료</span>대기는 <b>골라서 흡수합니다</b>. 자외선은 오존이 막고, 가시광선은 그대로 통과시키며, 지구가 내보내는 적외선은 수증기·이산화 탄소가 붙잡습니다. 다만 <b>8~12 µm의 ‘대기의 창’</b>으로는 지구 복사가 우주로 빠져나갑니다.");
        ep.clear(1);
      }
    }
    canvas._redraw = draw;
    $("a-sp-w").addEventListener("input", function (e) {
      sv = +e.target.value; $("a-sp-w-val").textContent = lamOf(sv).toFixed(2) + " µm"; draw();
    });
    draw(); mission();
    if (ep.cleared(1)) window.sthMission("mA2", true);
  })();

  /* ---------------- 장면 3 — 복사 평형 온도 ---------------- */
  (function () {
    var canvas = $("a-eq"); if (!canvas) return;
    var ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var S = 1200, A = 35, SIG = 5.67e-8;
    var got = window.sthState("aEq") || { a: false, b: false, c: false };

    function teK() { return Math.pow(S * (1 - A / 100) / (4 * SIG), 0.25); }
    function teC() { return teK() - 273.15; }

    var eqA = { on: !REDUCE }, eqT = 0;
    function paint() {
      var tc = teC(), abs = S * (1 - A / 100) / 4, i, k;
      ctx.clearRect(0, 0, W, H);
      /* ── 왼쪽: 행성 ── */
      var LW = 392, TH = 300;
      K.stage(ctx, 0, 0, LW, TH, "space", { seed: 73, title: "대기가 없는 행성 — 받는 만큼 내보낸다" });
      var cx = 236, cy = 160, R = 58, u = (tc + 120) / 180;
      /* 들어오는 햇빛과 빛 알갱이 */
      for (i = 0; i < 4; i++) {
        var yy = 112 + i * 32;
        ctx.save(); ctx.shadowColor = KC.yellow; ctx.shadowBlur = 8;
        K.arrow(ctx, { x: 20, y: yy }, { x: cx - Math.sqrt(Math.max(0, R * R - (yy - cy) * (yy - cy))) - 6, y: yy }, KC.yellow, 2.6, 9); ctx.restore();
        var ph = ((eqT * .6 + i * .27) % 1);
        K.glow(ctx, 20 + ph * (cx - R - 30), yy, 2, "rgba(255,236,170,.95)", 3.4);
      }
      K.pill(ctx, "들어오는 태양 복사", 16, 92, { s: 11, c: KC.yellow });
      /* 반사 */
      var nr = Math.round(A / 25);
      for (i = 0; i < nr; i++) {
        var ra = Math.PI + .5 + i * .32, sx = cx + R * Math.cos(ra), sy = cy + R * Math.sin(ra);
        K.arrow(ctx, { x: sx, y: sy }, { x: sx - 34, y: sy + 26 * Math.sin(ra) }, "rgba(232,236,255,.75)", 2, 8);
      }
      K.pill(ctx, "반사 " + A + " %", cx - R - 20, cy + R + 30, { a: "right", s: 11, c: KC.ink });
      /* 내보내는 복사(적외선) */
      var pulse = .55 + .45 * Math.sin(eqT * 3);
      for (k = 0; k < 8; k++) {
        var ang = -Math.PI / 2 + k * Math.PI / 4;
        if (Math.cos(ang) < -.8) continue;
        ctx.save(); ctx.globalAlpha = .45 + .5 * pulse;
        K.arrow(ctx, { x: cx + (R + 6) * Math.cos(ang), y: cy + (R + 6) * Math.sin(ang) }, { x: cx + (R + 32) * Math.cos(ang), y: cy + (R + 32) * Math.sin(ang) }, KC.red, 2.4, 8);
        ctx.restore();
      }
      var halo = ctx.createRadialGradient(cx, cy, R * .8, cx, cy, R * 1.5);
      halo.addColorStop(0, heatCol(u, .35)); halo.addColorStop(1, heatCol(u, 0));
      ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(cx, cy, R * 1.5, 0, 6.2832); ctx.fill();
      K.planet(ctx, cx, cy, R, heatCol(u), "#1b1e33");
      K.pill(ctx, tc.toFixed(1) + " ℃", cx, cy + 8, { a: "center", s: 18, c: KC.ink });
      K.pill(ctx, "내보내는 복사(적외선)", cx + 10, TH - 14, { a: "center", s: 11, c: KC.red, box: [0, LW] });
      /* ── 오른쪽: 계산 ── */
      var RX = LW + 8;
      K.stage(ctx, RX, 0, W - RX, TH, "lab", { seed: 75, title: "복사 평형 온도 계산" });
      K.t(ctx, "T = [ S(1−A) / 4σ ]", RX + 20, 74, { s: 16, w: "800", c: KC.ink });
      K.t(ctx, "1/4", RX + 182, 64, { s: 10, w: "800", c: KC.ink });
      K.t(ctx, "S = " + S.toLocaleString() + " W/m²  ·  A = " + (A / 100).toFixed(2), RX + 20, 102, { s: 12.5, w: "800", c: KC.blue });
      K.t(ctx, "흡수하는 에너지 = S(1−A)/4 = " + abs.toFixed(1) + " W/m²", RX + 20, 126, { s: 12, c: KC.mute });
      K.pill(ctx, tc.toFixed(1) + " ℃", RX + 26, 182, { s: 30, c: KC.green });
      K.t(ctx, "= " + teK().toFixed(1) + " K", RX + 190, 176, { s: 14, w: "800", c: KC.mute });
      var bx = RX + 30, bw = W - RX - 60, by = 236;
      function xOfT(t) { return bx + clamp((t + 120) / 180, 0, 1) * bw; }
      var tg = ctx.createLinearGradient(bx, 0, bx + bw, 0); tg.addColorStop(0, "#3a6fd8"); tg.addColorStop(.6, "#d9c45a"); tg.addColorStop(1, "#ff5a6e");
      ctx.globalAlpha = .75; ctx.fillStyle = tg; ctx.beginPath(); ctx.roundRect(bx, by, bw, 14, 7); ctx.fill(); ctx.globalAlpha = 1;
      [-120, -60, 0, 60].forEach(function (t) { K.t(ctx, t + "℃", xOfT(t), by + 32, { s: 10, a: "center", c: KC.mute }); });
      K.line(ctx, { x: xOfT(15), y: by - 6 }, { x: xOfT(15), y: by + 20 }, KC.red, 2);
      K.t(ctx, "실제 지구 15℃", xOfT(15) + 4, by + 50, { s: 10, a: "center", c: KC.red });
      K.glow(ctx, xOfT(tc), by + 7, 6, "rgba(255,255,255,.98)", 2.6);
      K.pill(ctx, "지금", xOfT(tc), by - 12, { a: "center", s: 10.5, c: KC.ink, box: [RX, W] });
      /* ── 아래: 실제 값 ── */
      K.stage(ctx, 0, TH + 8, W, H - TH - 8, "night", { seed: 77 });
      K.t(ctx, "실제 값과 비교하기", 16, TH + 30, { s: 12, w: "800", c: KC.blue });
      K.t(ctx, "달   S 1,361 · A 0.12  →  −3.6 ℃   (실제 낮 120 ℃ / 밤 −170 ℃ — 평균만 맞는다)", 16, TH + 52, { s: 11.5, c: KC.mute });
      K.t(ctx, "지구  S 1,361 · A 0.30  →  −18.6 ℃   (실제 평균 15 ℃ — 33 ℃가 더 높다)", 16, TH + 72, { s: 11.5, w: "800", c: KC.ink });
      K.t(ctx, "금성  S 2,601 · A 0.77  →  −46.5 ℃   (실제 약 464 ℃ — 온실 효과가 극단적으로 강하다)", 16, TH + 92, { s: 11.5, c: KC.mute });
    }
    K.animate(canvas, function (dt) { if (eqA.on) { eqT += dt / 1000; paint(); } });
    playWire("a-eq-play", eqA, "빛 멈추기", "빛 보기");
    function draw() {
      var tc = teC();
      paint();
      $("a-eq-info").innerHTML =
        "태양 상수 <b>" + S.toLocaleString() + " W/m²</b>, 반사율 <b>" + (A / 100).toFixed(2) + "</b> → 복사 평형 온도 <b>" + tc.toFixed(1) + " ℃</b>.<br>" +
        "행성이 받는 에너지는 단면적(πr²)에, 내보내는 에너지는 겉넓이(4πr²)에 비례하므로 식에 <b>4</b>가 들어갑니다. " +
        "반사율이 클수록, 태양 상수가 작을수록 온도가 낮아집니다. 이 값은 <b>대기가 없다고 보았을 때</b>의 온도입니다.";

      var ch = false;
      if (!got.a && tc >= -19.5 && tc <= -17.5) { got.a = true; ch = true; }
      if (!got.b && tc <= -50) { got.b = true; ch = true; }
      if (!got.c && tc >= 40) { got.c = true; ch = true; }
      if (ch) { window.sthState("aEq", got); mission(); }
    }
    function mission() {
      if (got.a) done("mA3a");
      if (got.b) done("mA3b");
      if (got.c) done("mA3c");
      if (got.a && got.b && got.c) {
        window.sthMission("mA3", true, "<span class='m-tag'>미션 완료</span>지구의 조건(S 1,361 · A 0.30)에서 복사 평형 온도는 <b>약 −18 ℃</b>입니다. 그런데 실제 지구의 평균 기온은 <b>15 ℃</b> — 33 ℃가 남습니다. 이 차이를 만든 것이 무엇인지 다음 장면에서 장부로 확인합니다.");
        ep.clear(2);
      }
    }
    canvas._redraw = draw;
    $("a-eq-s").addEventListener("input", function (e) { S = +e.target.value; $("a-eq-s-val").textContent = S.toLocaleString(); draw(); });
    $("a-eq-a").addEventListener("input", function (e) { A = +e.target.value; $("a-eq-a-val").textContent = (A / 100).toFixed(2); draw(); });
    draw(); mission();
    if (ep.cleared(2)) window.sthMission("mA3", true);
  })();

  /* ---------------- 장면 4 — 열수지 장부 ---------------- */
  (function () {
    var canvas = $("a-bal"); if (!canvas) return;
    var ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var E = 50, Rr = 70;
    var got = window.sthState("aBal") || { a: false, b: false };

    function card(y, title, inc, out, diff, icon) {
      var ok = Math.abs(diff) <= 1, x = 16, w = 532, h = 102;
      var g = ctx.createLinearGradient(x, y, x + w, y + h);
      g.addColorStop(0, ok ? "rgba(63,211,163,.20)" : "rgba(127,140,220,.14)"); g.addColorStop(1, ok ? "rgba(63,211,163,.06)" : "rgba(127,140,220,.04)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(x, y, w, h, 14); ctx.fill();
      ctx.strokeStyle = ok ? "rgba(63,211,163,.85)" : "rgba(200,210,255,.25)"; ctx.lineWidth = ok ? 2 : 1; ctx.stroke();
      K.pill(ctx, icon + " " + title, x + 14, y + 26, { s: 12.5, c: ok ? KC.green : KC.blue });
      K.t(ctx, "수입", x + 16, y + 52, { s: 10.5, w: "800", c: KC.green });
      K.t(ctx, inc, x + 56, y + 52, { s: 11.5, c: KC.ink });
      K.t(ctx, "지출", x + 16, y + 74, { s: 10.5, w: "800", c: KC.orange });
      K.t(ctx, out, x + 56, y + 74, { s: 11.5, c: KC.ink });
      K.t(ctx, ok ? "✔ 수입과 지출이 같습니다" : (diff > 0 ? "✗ 지출이 " + diff.toFixed(0) + " 단위 모자랍니다" : "✗ 지출이 " + (-diff).toFixed(0) + " 단위 많습니다"),
        x + 16, y + 95, { s: 11.5, w: "800", c: ok ? KC.green : KC.red });
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      var LW = 556;
      K.stage(ctx, 0, 0, LW, H, "lab", { seed: 79, title: "전 지구 평균 열수지 — 태양 복사를 100 단위로" });
      var dTop = 100 - (30 + 8 + E);
      var dSfc = (45 + Rr) - (104 + 20 + 9);
      var dAtm = (25 + 96 + 20 + 9) - (E + Rr);
      card(46, "대기권 밖에서 본 수지", "태양 복사 100",
        "반사 30 + 대기의 창 8 + 대기·구름 방출 ①" + E + " = " + (38 + E), dTop, "🛰");
      card(158, "대기의 수지",
        "태양 25 + 지표 복사 96 + 숨은열 20 + 대류·전도 9 = 150",
        "우주로 ①" + E + " + 지표로 ②" + Rr + " = " + (E + Rr), dAtm, "☁");
      card(270, "지표의 수지", "태양 45 + 재복사 ②" + Rr + " = " + (45 + Rr),
        "지표 복사 104 + 숨은열 20 + 대류·전도 9 = 133", dSfc, "🌍");
      var all = Math.abs(dTop) <= 1 && Math.abs(dSfc) <= 1 && Math.abs(dAtm) <= 1;
      K.pill(ctx, all ? "🎉 세 장부가 모두 맞았습니다 — 지구는 복사 평형 상태입니다"
        : "세 장부가 모두 맞아야 지구의 평균 기온이 일정하게 유지됩니다", 22, 404, { s: 12.5, c: all ? KC.green : KC.mute, box: [0, LW] });
      K.t(ctx, "지표가 받는 에너지 45 + " + Rr + " = " + (45 + Rr) + " 단위. 태양 복사만 받을 때(45)의 " + ((45 + Rr) / 45).toFixed(1) + "배입니다.",
        16, 432, { s: 11.5, c: KC.mute });
      K.t(ctx, "이 남는 몫이 지표를 −18 ℃가 아니라 15 ℃로 데웁니다 — 온실 효과.", 16, 454, { s: 11.5, w: "800", c: KC.orange });
      /* ── 오른쪽: 위도별 에너지 수지 ── */
      var RX = LW + 8;
      K.stage(ctx, RX, 0, W - RX, H, "lab", { seed: 81, title: "위도별 에너지 수지" });
      function absorbed(l) { return 150 - 81 * Math.sin(l * Math.PI / 180); }
      var g = K.chart(ctx, { x: RX + 2, y: 58, w: W - RX - 8, h: 236, x0: 0, x1: 90, y0: 30, y1: 160, xt: 3, yt: 2, xl: "위도", yf: function () { return ""; }, xf: function (v0) { return v0 === 0 ? "적도" : (v0 === 90 ? "극" : v0 + "°"); } });
      ctx.fillStyle = "rgba(255,107,129,.28)"; ctx.beginPath(); ctx.moveTo(g.X(0), g.Y(100));
      for (var l1 = 0; l1 <= 38.1; l1 += 2) ctx.lineTo(g.X(l1), g.Y(absorbed(l1)));
      ctx.lineTo(g.X(38.1), g.Y(100)); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "rgba(127,211,255,.26)"; ctx.beginPath(); ctx.moveTo(g.X(38.1), g.Y(100));
      for (var l2 = 38.1; l2 <= 90; l2 += 2) ctx.lineTo(g.X(l2), g.Y(absorbed(l2)));
      ctx.lineTo(g.X(90), g.Y(100)); ctx.closePath(); ctx.fill();
      var pa = []; for (var l3 = 0; l3 <= 90; l3 += 2) pa.push([l3, absorbed(l3)]);
      K.plot(ctx, g, pa, KC.orange);
      K.plot(ctx, g, [[0, 100], [90, 100]], KC.violet);
      K.line(ctx, { x: g.X(38.1), y: g.T }, { x: g.X(38.1), y: g.B }, "rgba(232,236,255,.7)", 1.4, [4, 4]);
      K.pill(ctx, "38°", g.X(38.1), g.T + 14, { a: "center", s: 10.5, c: KC.ink });
      K.pill(ctx, "흡수", g.L + 8, g.Y(150) + 22, { s: 10.5, c: KC.orange });
      K.pill(ctx, "방출", g.R - 6, g.Y(100) - 10, { a: "right", s: 10.5, c: KC.violet });
      K.pill(ctx, "과잉", g.X(15), g.Y(118), { a: "center", s: 10.5, c: KC.red });
      K.pill(ctx, "부족", g.X(72), g.Y(86), { a: "center", s: 10.5, c: KC.blue });
      ctx.save(); ctx.shadowColor = KC.orange; ctx.shadowBlur = 8;
      K.arrow(ctx, { x: g.X(18), y: g.B - 14 }, { x: g.X(76), y: g.B - 14 }, KC.orange, 3, 11); ctx.restore();
      K.t(ctx, "열 수송(대기·해수)", g.X(47), g.B - 22, { s: 10.5, a: "center", c: KC.orange });
      K.t(ctx, "저위도는 에너지 과잉,", RX + 16, 336, { s: 11.5, w: "800", c: KC.red });
      K.t(ctx, "고위도는 에너지 부족.", RX + 16, 358, { s: 11.5, w: "800", c: KC.blue });
      K.t(ctx, "지구 전체로는 평형이지만", RX + 16, 384, { s: 11, c: KC.mute });
      K.t(ctx, "위도별로는 어긋나 있어서,", RX + 16, 404, { s: 11, c: KC.mute });
      K.t(ctx, "대기와 해수가 그 차이만큼", RX + 16, 424, { s: 11, c: KC.mute });
      K.t(ctx, "열을 고위도로 나릅니다.", RX + 16, 444, { s: 11, c: KC.mute });
      $("a-bal-info").innerHTML =
        "① 대기·구름이 우주로 내보내는 복사 <b>" + E + "</b> · ② 대기가 지표로 돌려보내는 재복사 <b>" + Rr + "</b><br>" +
        "대기권 밖 수지 : 100 − (30 + 8 + " + E + ") = <b>" + dTop.toFixed(0) + "</b> &nbsp;|&nbsp; " +
        "지표 수지 : (45 + " + Rr + ") − 133 = <b>" + dSfc.toFixed(0) + "</b> &nbsp;|&nbsp; " +
        "대기 수지 : 150 − (" + E + " + " + Rr + ") = <b>" + dAtm.toFixed(0) + "</b><br>" +
        (Math.abs(dTop) <= 1 && Math.abs(dSfc) <= 1 ? "✅ 지표가 대기에서 돌려받는 <b>88</b> 단위가 태양에게서 직접 받는 45 단위의 두 배입니다. 이것이 온실 효과의 크기입니다."
          : "숫자 두 개만 맞추면 세 장부가 한꺼번에 맞습니다.");

      var ch = false;
      if (!got.a && Math.abs(dTop) <= 1) { got.a = true; ch = true; }
      if (!got.b && Math.abs(dSfc) <= 1) { got.b = true; ch = true; }
      if (ch) { window.sthState("aBal", got); mission(); }
    }
    function mission() {
      if (got.a) done("mA4a");
      if (got.b) done("mA4b");
      if (window.sthState("aPick")) done("mA4c");
      if (got.a && got.b && window.sthState("aPick")) {
        window.sthMission("mA4", true, "<span class='m-tag'>미션 완료</span>① <b>62</b>, ② <b>88</b>. 지표·대기·대기권 밖의 세 장부가 모두 맞습니다. 지표는 태양에게서 45를 받지만 대기에게서 <b>88</b>을 더 받습니다. 그래서 −18 ℃가 아니라 15 ℃입니다.");
        ep.clear(3);
      }
    }
    canvas._redraw = draw;
    $("a-bal-e").addEventListener("input", function (e) { E = +e.target.value; $("a-bal-e-val").textContent = E; draw(); });
    $("a-bal-r").addEventListener("input", function (e) { Rr = +e.target.value; $("a-bal-r-val").textContent = Rr; draw(); });

    window.sthPick({
      mount: "a-pick",
      q: "지표가 받는 에너지는 태양 복사 45 단위와 대기의 재복사 88 단위를 합쳐 133 단위입니다. 들어온 태양 복사가 100인데 지표가 133을 받는 것은 에너지 보존 법칙을 어기는 것일까요?",
      options: [
        "어기지 않는다 — 대기가 흡수한 에너지를 지표와 여러 번 주고받을 뿐, 우주로 나가는 총량은 100이다",
        "어긴다 — 어딘가에서 에너지가 새로 만들어지고 있다",
        "어기지 않는다 — 지구 내부에서 나오는 열이 33 단위를 보태 주기 때문이다",
        "어기지 않는다 — 태양 복사가 실제로는 133 단위이기 때문이다"
      ],
      answer: 0,
      why: [
        "맞습니다. 같은 에너지가 지표 → 대기 → 지표로 되돌아오며 여러 번 세어질 뿐입니다. 대기권 밖에서 보면 들어온 100과 나간 100(반사 30 + 대기의 창 8 + 대기·구름 방출 62)이 정확히 같습니다.",
        "장부를 맞춰 보면 세 곳 모두 수입과 지출이 같습니다. 새로 만들어지는 에너지는 없습니다.",
        "지구 내부에서 지표로 올라오는 열은 태양 복사의 1만분의 1도 되지 않습니다. 열수지에서는 무시합니다.",
        "태양 복사를 100 단위로 놓고 시작한 장부입니다. 133은 지표가 ‘받는’ 양이지 새로 들어온 양이 아닙니다."
      ],
      onDone: function () { window.sthState("aPick", 1); mission(); }
    });
    draw(); mission();
    if (ep.cleared(3)) window.sthMission("mA4", true);
  })();

  /* ---------------- 장면 5 — 대기의 역할 분류 + 결말 ---------------- */
  var A_SORT = [
    { t: "달 표면에는 작은 운석 구덩이가 그대로 남아 있다", a: "shield", why: "유성체는 대기와의 마찰열로 중간권에서 대부분 타 없어집니다." },
    { t: "지구에서는 밤하늘에 ‘별똥별’이 잠깐 빛나고 사라진다", a: "shield", why: "유성체가 대기에 들어와 타면서 내는 빛이 유성입니다.", hint: "이 일은 대기가 있어야만 일어납니다." },
    { t: "성층권 20~30 km에 오존이 모여 있다", a: "uv", why: "오존층이 파장 0.3 µm보다 짧은 자외선을 흡수합니다." },
    { t: "파장 0.30 µm 아래의 빛은 지표에 거의 도달하지 않는다", a: "uv", why: "투과율 곡선에서 직접 확인한 내용입니다." },
    { t: "지구의 복사 평형 온도는 −18 ℃인데 실제 평균 기온은 15 ℃다", a: "warm", why: "대기가 지구 복사를 흡수했다가 지표로 되돌려 보내기 때문입니다." },
    { t: "지표는 태양에게서 45, 대기에게서 88 단위를 받는다", a: "warm", why: "재복사가 태양 복사보다 많습니다. 온실 효과의 크기입니다.", hint: "장부에서 지표의 수입을 다시 보세요." },
    { t: "달의 하루 기온 차는 약 300 ℃, 지구는 수십 ℃다", a: "warm", why: "대기가 열을 붙잡아 두어 기온이 급격히 오르내리지 않습니다." },
    { t: "저위도의 남는 에너지가 고위도로 옮겨 간다", a: "move", why: "대기와 해수의 운동이 위도별 에너지 불균형을 줄입니다." },
    { t: "물이 액체 상태로 바다를 이루고, 증발해 구름이 된다", a: "move", why: "적당한 기온과 기압이 유지되어야 물이 액체로 존재합니다. 증발과 응결은 열도 함께 나릅니다." },
    { t: "숨은열 20 단위가 지표에서 대기로 올라간다", a: "move", why: "물이 증발할 때 가져간 열을 응결하며 대기에 내놓습니다." }
  ];

  function revealA() {
    $("a-end").hidden = false;
    var p = window.sthState("pA1") || "";
    $("a-vs").innerHTML = "<b>나의 첫 추리</b> " + (p || "기록 없음") + "<br>" +
      (p.indexOf("㉡") === 0 ? "처음부터 정확히 짚었습니다. 이제 그 대기가 ‘어떤 빛을 얼마나’ 붙잡는지까지 숫자로 말할 수 있습니다."
        : "답은 거리도 땅의 성질도 아닌 <b>대기</b>였습니다. 대기는 지구 복사를 흡수했다가 지표로 되돌려 보냅니다.") +
      "<br><b>내가 맞춘 열수지</b> 대기·구름 방출 " + (window.sthState("aBalE") || "62") + " · 재복사 " + (window.sthState("aBalR") || "88");
  }
  function finish() {
    window.sthState("aBalE", 62); window.sthState("aBalR", 88);
    window.sthState("r1", "해결 · 복사 평형 −18 ℃ + 재복사 88 단위 = 실제 15 ℃, 온실 효과 33 ℃");
  }
  if (ep.cleared(4)) {
    $("a-sort").innerHTML = "<div class='sort'><div class='buckets'>" +
      [["uv", "자외선 차단"], ["warm", "기온을 알맞게 유지"], ["shield", "유성체로부터 보호"], ["move", "물과 열을 나른다"]].map(function (b) {
        return "<div class='bucket'><span class='b-name'>" + b[1] + "</span>" +
          A_SORT.filter(function (it) { return it.a === b[0]; }).map(function (it) { return "<span class='in'>" + it.t + "</span>"; }).join("") + "</div>";
      }).join("") + "</div></div>";
    revealA();
  } else {
    window.sthSort({
      mount: "a-sort",
      buckets: [
        { id: "uv", label: "자외선 차단", sub: "오존층" },
        { id: "warm", label: "기온을 알맞게 유지", sub: "온실 효과" },
        { id: "shield", label: "유성체로부터 보호", sub: "중간권" },
        { id: "move", label: "물과 열을 나른다", sub: "대기의 운동" }
      ],
      items: A_SORT,
      doneText: "달 기지에서는 이 네 가지를 모두 사람이 만들어 내야 합니다.",
      onDone: function () { revealA(); ep.clear(4); }
    });
  }

  window.sthWork({
    mount: "wkA", unitLabel: "[지구시스템과학 Ⅱ-2] 이야기 ① 달 기지 설계도",
    items: [
      { id: "aw1", label: "대기가 ‘선택적 흡수체’라는 말의 뜻", hint: "자외선·가시광선·적외선 각각에 대해 대기가 어떻게 행동하는지, 어느 기체가 무엇을 흡수하는지 넣어 쓰세요." },
      { id: "aw2", label: "달 기지 설계서에 들어갈 한 문단", hint: "지구가 살 만한 까닭을 복사 평형 온도(−18 ℃), 실제 평균 기온(15 ℃), 재복사 88 단위라는 숫자를 써서 설명하세요." }
    ]
  });
})();

/* =========================================================================
   이야기 ② 산을 넘은 바람 — 단열 변화 · 대기 안정도 · 강수 과정
   ========================================================================= */
(function () {
  var ep = window.sthStory({ root: "epB", key: "epB", name: "사건 파일 ②", onDone: finish });
  var MH = 1500;                       /* 산 높이 (m) */

  window.sthGate({
    gate: "gB", key: "pB1", title: "조사관의 첫 추리",
    question: "같은 날 같은 바람인데, 산맥 동쪽은 비가 오고 서쪽은 7 ℃나 더 덥고 건조했습니다. 왜 그럴까요?",
    options: [
      "㉠ 서쪽이 더 남쪽이라 원래 기온이 높다",
      "㉡ 산을 오르며 구름과 비로 수증기를 잃은 공기가, 내려올 때는 더 빠르게 데워지기 때문이다",
      "㉢ 산맥이 햇빛을 서쪽으로 반사해 주기 때문이다"
    ],
    onPick: function () { ep.clear(0); }
  });

  /* ---------------- 장면 2 — 푄(단열 변화) ---------------- */
  (function () {
    var canvas = $("b-foehn"); if (!canvas) return;
    var ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var T0 = 20, D0 = 12;
    var got = window.sthState("bFo") || { a: false, b: false, c: false };

    function model() {
      var td = Math.min(D0, T0);
      var lcl = Math.min(125 * (T0 - td), 4000);
      var cloud = Math.max(0, MH - lcl);
      var top = lcl >= MH ? T0 - MH / 100 : T0 - lcl / 100 - 0.5 * (MH - lcl) / 100;
      var lee = top + MH / 100;
      return { td: td, lcl: lcl, cloud: cloud, top: top, lee: lee, gain: lee - T0 };
    }

    var foA = { on: !REDUCE }, foT = 0;
    function paint() {
      var m = model(), GY = 372, PX = 460, SC = 0.18, k;
      function yOf(h) { return GY - h * SC; }
      ctx.clearRect(0, 0, W, H);
      K.stage(ctx, 0, 0, W, H, "sky", { seed: 83 });
      K.pill(ctx, "공기 덩어리 한 덩이가 태백산맥을 넘는다", 16, 28, { s: 13, c: KC.blue });
      K.pill(ctx, "건조 단열 1.0 ℃/100 m · 습윤 단열 0.5 ℃/100 m · 이슬점은 오를 때 0.2 ℃/100 m 낮아짐", W - 16, 28, { a: "right", s: 10.5, c: KC.ink });
      /* 높이 눈금 */
      [0, 500, 1000, 1500].forEach(function (h) {
        K.line(ctx, { x: 18, y: yOf(h) }, { x: 150, y: yOf(h) }, "rgba(255,255,255,.35)", 1, [4, 4]);
        K.t(ctx, h.toLocaleString() + " m", 22, yOf(h) - 5, { s: 10, c: "#10335a" });
      });
      /* 땅과 산 */
      ctx.save(); ctx.beginPath(); ctx.moveTo(0, GY); ctx.lineTo(150, GY); ctx.lineTo(PX - 14, yOf(MH) + 6); ctx.quadraticCurveTo(PX, yOf(MH) - 4, PX + 14, yOf(MH) + 6); ctx.lineTo(770, GY); ctx.lineTo(W, GY); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
      ctx.fillStyle = hillGrad(ctx, yOf(MH), H); ctx.fill(); ctx.restore();
      K.pill(ctx, "동쪽 기슭 (영동)", 95, GY + 30, { a: "center", s: 11.5, c: KC.ink });
      K.pill(ctx, "서쪽 기슭 (영서)", 805, GY + 30, { a: "center", s: 11.5, c: KC.ink });
      /* 구름과 비 */
      if (m.cloud > 0) {
        var yl = yOf(m.lcl);
        for (k = 0; k < 9; k++) {
          var rx = 210 + k * 26, ry = yl + 10 + ((foT * 140 + k * 37) % 46);
          if (ry < GY - 6) { ctx.strokeStyle = "rgba(60,120,220,.7)"; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx - 3, ry + 9); ctx.stroke(); }
        }
        var ch = clamp((MH - m.lcl) * SC, 10, 200);
        for (k = 0; k < 5; k++) cloud(ctx, 230 + k * 48, yl - ch * (.25 + (k % 2) * .2), 18 + ch * .12, .92);
        K.line(ctx, { x: 150, y: yl }, { x: 770, y: yl }, KC.red, 2, [6, 5]);
        K.pill(ctx, "상승 응결 고도 " + Math.round(m.lcl).toLocaleString() + " m", W - 16, yl - 8, { a: "right", s: 11, c: KC.red });
      } else {
        K.pill(ctx, "구름이 생기지 않습니다 (응결 고도가 산마루보다 높음)", PX, yOf(MH) + 64, { a: "center", s: 11.5, c: KC.ink });
      }
      /* 공기 덩어리: 산을 따라 오르고 내린다 */
      var u = (foT * .12) % 1, px, h, tp;
      if (u < .5) { var a = u / .5; px = 120 + a * (PX - 120); h = clamp((px - 150) / (PX - 150), 0, 1) * MH; tp = h <= m.lcl ? T0 - h / 100 : T0 - m.lcl / 100 - 0.5 * (h - m.lcl) / 100; }
      else { var b2 = (u - .5) / .5; px = PX + b2 * (800 - PX); h = clamp((770 - px) / (770 - PX), 0, 1) * MH; tp = m.top + (MH - h) / 100; }
      var py = yOf(h) - 26, tu = (tp + 10) / 45;
      K.planet(ctx, px, py, 13, heatCol(tu), "#3a2a4a");
      K.pill(ctx, tp.toFixed(1) + " ℃", px, py - 20, { a: "center", s: 11, c: KC.ink });
      /* 세 자리의 기온 */
      function tag(x, y, s1, s2, col) {
        K.pill(ctx, s1, x, y - 14, { a: "center", s: 13, c: col });
        K.t(ctx, s2, x, y + 4, { s: 10.5, a: "center", c: "#0e2c4f", w: "800" });
      }
      tag(80, GY - 44, T0.toFixed(0) + " ℃", "이슬점 " + m.td.toFixed(0) + " ℃", KC.blue);
      tag(PX, yOf(MH) - 40, m.top.toFixed(1) + " ℃", "산마루 1,500 m", KC.green);
      tag(840, GY - 44, m.lee.toFixed(1) + " ℃", (m.gain >= 0 ? "+" : "") + m.gain.toFixed(1) + " ℃", m.gain >= 5 ? KC.red : KC.ink);
      K.t(ctx, "오를 때 — 응결 고도까지 1.0 ℃/100 m, 그 위는 0.5 ℃/100 m", 16, 422, { s: 11.5, w: "800", c: "#cfe6ff" });
      K.t(ctx, "내려올 때 — 구름이 없으므로 줄곧 1.0 ℃/100 m", W - 16, 422, { s: 11.5, w: "800", a: "right", c: "#ffc1a8" });
    }
    K.animate(canvas, function (dt) { if (foA.on) { foT += dt / 1000; paint(); } });
    playWire("b-foehn-play", foA, "공기 멈추기", "공기 보내기");
    function draw() {
      var m = model();
      paint();
      $("b-foehn-info").innerHTML =
        "산기슭 기온 <b>" + T0 + " ℃</b>, 이슬점 <b>" + m.td + " ℃</b> → 상승 응결 고도 <b>" + Math.round(m.lcl).toLocaleString() + " m</b> " +
        "(기온과 이슬점의 차 " + (T0 - m.td) + " ℃ × 125 m).<br>" +
        (m.cloud > 0
          ? "구름 두께 <b>" + Math.round(m.cloud).toLocaleString() + " m</b> 구간을 습윤 단열로 천천히 식으며 올라 산마루에서 <b>" + m.top.toFixed(1) + " ℃</b>. 내려올 때는 건조 단열로 데워져 <b>" + m.lee.toFixed(1) + " ℃</b> — 산기슭보다 <b>" + m.gain.toFixed(1) + " ℃</b> 높습니다."
          : "응결 고도가 산마루보다 높아 구름이 생기지 않습니다. 올라갈 때와 내려올 때의 감률이 같으므로 산 너머 기온은 산기슭과 <b>같습니다</b>.") +
        (D0 > T0 ? "<br><span style='color:var(--coral-700)'>이슬점은 기온보다 높을 수 없어 " + T0 + " ℃로 맞추어 계산했습니다.</span>" : "");

      var ch = false;
      if (!got.a && Math.abs(m.lcl - 500) <= 25) { got.a = true; ch = true; }
      if (!got.b && m.gain >= 7.0) { got.b = true; ch = true; }
      if (!got.c && m.lcl >= MH) { got.c = true; ch = true; }
      if (ch) { window.sthState("bFo", got); mission(); }
    }
    function mission() {
      if (got.a) done("mB2a");
      if (got.b) done("mB2b");
      if (got.c) done("mB2c");
      if (got.a && got.b && got.c) {
        window.sthMission("mB2", true, "<span class='m-tag'>미션 완료</span>기온과 이슬점의 차가 <b>4 ℃</b>면 응결 고도 500 m, 차가 <b>0 ℃</b>면 지면부터 구름이 생겨 산 너머가 7.5 ℃나 더워집니다. 반대로 차가 <b>12 ℃</b> 이상이면 구름이 아예 생기지 않아 기온이 그대로입니다. <b>구름이 생긴 구간의 길이</b>가 산 너머의 더위를 정합니다.");
        ep.clear(1);
      }
    }
    canvas._redraw = draw;
    $("b-foehn-t").addEventListener("input", function (e) { T0 = +e.target.value; $("b-foehn-t-val").textContent = T0 + " ℃"; draw(); });
    $("b-foehn-d").addEventListener("input", function (e) { D0 = +e.target.value; $("b-foehn-d-val").textContent = D0 + " ℃"; draw(); });
    draw(); mission();
    if (ep.cleared(1)) window.sthMission("mB2", true);
  })();

  /* ---------------- 장면 3 — 대기 안정도 ---------------- */
  (function () {
    var canvas = $("b-stab"); if (!canvas) return;
    var ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var gam = 0.6, wet = false;
    var got = window.sthState("bSt") || { a: false, b: false, c: false };
    var TG = 20;

    function kind() {
      if (gam > 1.0) return "unstable";
      if (gam < 0.5) return (gam < 0 ? "inv" : "stable");
      return "cond";
    }
    function parcelRate() { return wet ? 0.5 : 1.0; }
    function rising() { return gam > parcelRate(); }

    var stA = { on: !REDUCE }, stT = 0;
    function paint() {
      var KD = kind(), up = rising();
      ctx.clearRect(0, 0, W, H);
      /* ── 왼쪽: 공기 덩어리 ── */
      var LW = 392, gy = 352, px = 196;
      K.stage(ctx, 0, 0, LW, H, "night", { seed: 85, title: "살짝 들어 올린 공기 덩어리" });
      var air = ctx.createLinearGradient(0, 40, 0, gy); air.addColorStop(0, "rgba(90,120,220,.10)"); air.addColorStop(1, "rgba(120,170,255,.22)");
      ctx.fillStyle = air; ctx.fillRect(14, 44, LW - 28, gy - 44);
      if (KD === "inv") { var iv = ctx.createLinearGradient(0, 150, 0, 260); iv.addColorStop(0, "rgba(255,179,92,0)"); iv.addColorStop(.5, "rgba(255,179,92,.18)"); iv.addColorStop(1, "rgba(255,179,92,0)"); ctx.fillStyle = iv; ctx.fillRect(14, 150, LW - 28, 110); }
      ctx.fillStyle = hillGrad(ctx, gy, H); ctx.beginPath(); ctx.roundRect(14, gy, LW - 28, 12, 4); ctx.fill();
      K.t(ctx, "지표", 22, gy + 26, { s: 10.5, c: KC.mute });
      var y0 = 268, py;
      if (up) { var s = (stT * .45) % 1; py = y0 - s * s * 200; }
      else { py = y0 - 46 * Math.abs(Math.cos(stT * (KD === "inv" ? 3.2 : 2))) * Math.exp(-((stT * .5) % 3)); }
      K.line(ctx, { x: px - 60, y: y0 }, { x: px + 60, y: y0 }, "rgba(232,236,255,.4)", 1.2, [4, 4]);
      K.t(ctx, "처음 높이", px + 64, y0 + 4, { s: 10, c: KC.mute });
      var col = wet ? "#7fd3ff" : "#ffb35c";
      ctx.save(); ctx.globalAlpha = up ? Math.min(1, (py - 70) / 40) : 1;
      K.planet(ctx, px, py, 30, col, wet ? "#1d4d8a" : "#7a3a12");
      K.pill(ctx, wet ? "포화" : "불포화", px, py + 5, { a: "center", s: 12, c: KC.ink });
      ctx.restore();
      ctx.save(); ctx.shadowColor = up ? KC.green : KC.violet; ctx.shadowBlur = 10;
      if (up) K.arrow(ctx, { x: px + 52, y: 240 }, { x: px + 52, y: 100 }, KC.green, 4, 13);
      else K.arrow(ctx, { x: px + 52, y: 150 }, { x: px + 52, y: 250 }, KC.violet, 4, 13);
      ctx.restore();
      K.pill(ctx, up ? "계속 올라갑니다" : "다시 가라앉습니다", px, 394, { a: "center", s: 14, c: up ? KC.green : KC.violet });
      K.t(ctx, KD === "unstable" ? "절대 불안정" : KD === "inv" ? "기온 역전층 (매우 안정)" : KD === "stable" ? "절대 안정" : "조건부 불안정", px, 420, { s: 12.5, w: "800", a: "center", c: KC.ink });
      /* ── 오른쪽: 단열선도 ── */
      var RX = LW + 8;
      K.stage(ctx, RX, 0, W - RX, H, "lab", { seed: 87, title: "단열선도 — 주변 대기와 공기 덩어리 겹쳐 보기" });
      var g = K.chart(ctx, { x: RX + 4, y: 52, w: W - RX - 10, h: 300, x0: -25, x1: 35, y0: 0, y1: 3000, xt: 6, yt: 3, xl: "기온 (℃)", yl: "높이 (m)" });
      ctx.save(); ctx.beginPath(); ctx.rect(g.L, g.T - 2, g.R - g.L, g.B - g.T + 2); ctx.clip();
      K.plot(ctx, g, [[TG, 0], [TG - gam * 30, 3000]], KC.ink, { w: 2.6 });
      K.plot(ctx, g, [[TG, 0], [TG - 30, 3000]], KC.orange, { w: wet ? 1.6 : 4 });
      K.plot(ctx, g, [[TG, 0], [TG - 15, 3000]], KC.blue, { w: wet ? 4 : 1.6 });
      var envT = TG - gam * 10, parT = TG - parcelRate() * 10;
      K.line(ctx, { x: g.X(Math.min(envT, parT)), y: g.Y(1000) }, { x: g.X(Math.max(envT, parT)), y: g.Y(1000) }, KC.green, 2.5, [4, 3]);
      ctx.restore();
      K.glow(ctx, g.X(TG), g.Y(0), 4, "rgba(255,255,255,.95)", 3);
      K.pill(ctx, "1,000 m에서 덩어리가 주변보다 " + (parT - envT >= 0 ? "+" : "") + (parT - envT).toFixed(1) + " ℃", RX + 16, 392, { s: 11.5, c: parT > envT ? KC.green : KC.violet });
      var lx = RX + 16, lr;
      lr = K.pill(ctx, "주변 대기", lx + 7, 420, { s: 10.5, c: KC.ink }); lx = lr.x + lr.w + 6;
      lr = K.pill(ctx, "건조 단열 1.0", lx + 7, 420, { s: 10.5, c: KC.orange }); lx = lr.x + lr.w + 6;
      K.pill(ctx, "습윤 단열 0.5 ℃/100 m", lx + 7, 420, { s: 10.5, c: KC.blue });
    }
    K.animate(canvas, function (dt) { if (stA.on) { stT += dt / 1000; paint(); } });
    playWire("b-stab-play", stA, "덩어리 멈추기", "덩어리 놓기");
    function draw() {
      var K = kind(), up = rising();
      paint();
      $("b-stab-info").innerHTML =
        "주변 대기의 기온 감률 <b>" + gam.toFixed(2) + " ℃/100 m</b> · 공기 덩어리는 <b>" + (wet ? "포화" : "불포화") + "</b>라서 <b>" + parcelRate().toFixed(1) + " ℃/100 m</b>로 식습니다.<br>" +
        (K === "unstable" ? "감률이 건조 단열 감률(1.0)보다 큽니다 — <b>절대 불안정</b>. 포화든 불포화든 한 번 올라간 공기는 계속 올라갑니다. 적운형 구름과 소나기성 강수가 잘 나타납니다."
          : K === "inv" ? "높이 올라갈수록 기온이 오히려 <b>높아집니다</b> — <b>기온 역전층</b>. 공기가 전혀 오르지 못해 안개와 오염 물질이 지표 부근에 갇힙니다. 맑고 바람 없는 밤에 지표가 식으면서 잘 생깁니다."
          : K === "stable" ? "감률이 습윤 단열 감률(0.5)보다 작습니다 — <b>절대 안정</b>. 올라간 공기는 곧 주변보다 차가워져 되돌아옵니다. 층운형 구름이 나타나기 쉽습니다."
          : "감률이 0.5와 1.0 사이입니다 — <b>조건부 불안정</b>. 같은 대기인데도 공기 덩어리가 <b>불포화이면 안정, 포화이면 불안정</b>합니다. 우리나라 대기가 대개 이 상태입니다.") +
        "<br>지금 이 공기 덩어리는 <b>" + (up ? "계속 올라갑니다" : "다시 가라앉습니다") + "</b>.";

      var ch = false;
      if (!got.a && gam >= 1.05) { got.a = true; ch = true; }
      if (!got.b && gam <= -0.05) { got.b = true; ch = true; }
      if (!got.c && gam > 0.5 && gam < 1.0 && wet) { got.c = true; ch = true; }
      if (ch) { window.sthState("bSt", got); mission(); }
    }
    function mission() {
      if (got.a) done("mB3a");
      if (got.b) done("mB3b");
      if (got.c) done("mB3c");
      if (got.a && got.b && got.c) {
        window.sthMission("mB3", true, "<span class='m-tag'>미션 완료</span>기준은 <b>두 개</b>입니다. 주변 감률이 1.0보다 크면 절대 불안정, 0.5보다 작으면 절대 안정, 그 사이면 <b>조건부 불안정</b> — 구름 속(포화)에 들어가야 비로소 불안정해집니다. 감률이 음수인 <b>역전층</b>에서는 안개가 갇힙니다.");
        ep.clear(2);
      }
    }
    canvas._redraw = draw;
    $("b-stab-g").addEventListener("input", function (e) {
      gam = Math.round(+e.target.value * 100) / 100;
      $("b-stab-g-val").textContent = gam.toFixed(2); draw();
    });
    seg("b-stab-w", function (b) { wet = b.getAttribute("data-w") === "wet"; draw(); });
    draw(); mission();
    if (ep.cleared(2)) window.sthMission("mB3", true);
  })();

  /* ---------------- 장면 4 — 강수 과정 ---------------- */
  (function () {
    var canvas = $("b-rain"); if (!canvas) return;
    var ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var htop = 4, TS = 20, LAP = 0.65;
    var got = window.sthState("bRn") || { a: false, b: false };
    var BASE = 1.0;

    function tAt(h) { return TS - LAP * h * 10; }
    function zOfT(t) { return (TS - t) / (LAP * 10); }

    var rnA = { on: !REDUCE }, rnT = 0;
    function star6(x, y, r) {
      ctx.strokeStyle = "rgba(240,250,255,.95)"; ctx.lineWidth = 1.4; ctx.beginPath();
      for (var k = 0; k < 3; k++) { var a = k * Math.PI / 3; ctx.moveTo(x - r * Math.cos(a), y - r * Math.sin(a)); ctx.lineTo(x + r * Math.cos(a), y + r * Math.sin(a)); }
      ctx.stroke();
    }
    function paint() {
      var ttop = tAt(htop), GY = 382, i, k;
      function yOf(h) { return GY - h / 12 * 300; }
      ctx.clearRect(0, 0, W, H);
      var LW = 612;
      K.stage(ctx, 0, 0, LW, H, "sky", { seed: 89 });
      K.pill(ctx, "구름 속에서 빗방울이 자라는 두 가지 길", 16, 28, { s: 13, c: KC.blue });
      K.t(ctx, "지표 기온 20 ℃ · 기온 감률 0.65 ℃/100 m · 구름 밑면 1,000 m", 16, 56, { s: 11, w: "800", c: "#0e2c4f" });
      ctx.fillStyle = hillGrad(ctx, GY, H); ctx.fillRect(0, GY, LW, H - GY);
      [0, 3, 6, 9, 12].forEach(function (h) { K.t(ctx, h + " km", 16, yOf(h) - 4, { s: 10, w: "800", c: h ? "#0e2c4f" : KC.ink }); });

      /* 구름 */
      var top = Math.max(htop, BASE + 0.2), yb = yOf(BASE), yt = yOf(top), hh = yb - yt;
      var cg = ctx.createLinearGradient(0, yt, 0, yb); cg.addColorStop(0, "rgba(255,255,255,.95)"); cg.addColorStop(1, "rgba(170,182,210,.95)");
      ctx.fillStyle = cg; ctx.beginPath(); ctx.roundRect(130, yt + 14, 420, hh - 14, 22); ctx.fill();
      var R = K.rng(5);
      for (k = 0; k < 7; k++) cloud(ctx, 150 + k * 64, yt + 16 + R() * 10, 18 + R() * 10, 1, "#eef2fb");
      /* 구름 알갱이 */
      var seedX = [160, 205, 250, 300, 345, 395, 440, 490, 520];
      for (i = 0; i < seedX.length; i++) {
        for (k = 0; k < 4; k++) {
          var hz = BASE + (top - BASE) * ((k + 0.5) / 4), yy = yOf(hz) + Math.sin(rnT * 2 + i + k) * 3, xx = seedX[i] + (k % 2) * 16 + Math.cos(rnT * 1.6 + i * 2) * 2;
          if (yy < yt + 8 || yy > yb - 4) continue;
          var tt = tAt(hz);
          if (tt > 0) K.glow(ctx, xx, yy, 2.6, "rgba(40,120,230,.95)", 2.2);
          else if (tt > -10) K.glow(ctx, xx, yy, 2.4, "rgba(150,90,230,.95)", 2.2);
          else { ctx.save(); ctx.shadowColor = "#3a6fd8"; ctx.shadowBlur = 3; ctx.strokeStyle = "#2a5fc0"; ctx.lineWidth = 1.6; ctx.beginPath(); for (var q = 0; q < 3; q++) { var a3 = q * Math.PI / 3; ctx.moveTo(xx - 5 * Math.cos(a3), yy - 5 * Math.sin(a3)); ctx.lineTo(xx + 5 * Math.cos(a3), yy + 5 * Math.sin(a3)); } ctx.stroke(); ctx.restore(); }
        }
      }
      /* 등온선 */
      [[0, "0 ℃"], [-10, "−10 ℃"], [-40, "−40 ℃"]].forEach(function (p) {
        var z = zOfT(p[0]); if (z < 0 || z > 12) return;
        K.line(ctx, { x: 60, y: yOf(z) }, { x: 540, y: yOf(z) }, "rgba(220,40,70,.85)", 1.8, [6, 4]);
        K.pill(ctx, p[1], 548, yOf(z) + 5, { s: 10.5, c: KC.red, box: [0, LW] });
      });      /* 강수 */
      var snow = ttop <= -10 && tAt(0) <= 0;
      for (var r = 0; r < 14; r++) {
        var rx = 150 + r * 28, fall = (rnT * (snow ? 30 : 120) + r * 23) % (GY - yb - 6), ry = yb + 6 + fall;
        if (snow) star6(rx + Math.sin(rnT + r) * 4, ry, 4);
        else { ctx.strokeStyle = "rgba(40,110,220,.85)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx - 3, ry + 10); ctx.stroke(); }
      }
      var lx = 16, lr;
      lr = K.pill(ctx, "● 물방울", lx + 7, 416, { s: 10.5, c: KC.blue }); lx = lr.x + lr.w + 6;
      lr = K.pill(ctx, "● 과냉각 물방울", lx + 7, 416, { s: 10.5, c: KC.violet }); lx = lr.x + lr.w + 6;
      K.pill(ctx, "✳ 빙정(얼음 알갱이)", lx + 7, 416, { s: 10.5, c: KC.ink });
      /* ── 오른쪽: 판정 ── */
      var RX = LW + 8, way = ttop <= -10 ? "빙정설" : "병합설";
      K.stage(ctx, RX, 0, W - RX, H, "night", { seed: 91, title: "빗방울이 자라는 길" });
      K.t(ctx, "구름 꼭대기 " + htop.toFixed(1) + " km", RX + 18, 74, { s: 12, w: "800", c: KC.mute });
      K.pill(ctx, ttop.toFixed(1) + " ℃", RX + 24, 120, { s: 28, c: ttop <= -10 ? KC.blue : KC.orange });
      K.pill(ctx, way, RX + 24, 168, { s: 20, c: KC.green });
      var lines = ttop <= -10
        ? ["얼음 알갱이(빙정)가 생깁니다.", "포화 수증기압이 물보다", "얼음에서 더 낮기 때문에,", "과냉각 물방울의 수증기가", "빙정으로 옮겨 붙어 자랍니다.", snow ? "→ 녹지 않고 떨어지면 눈" : "→ 떨어지며 녹으면 비"]
        : ["구름 전체가 0 ℃보다 따뜻합니다.", "크기가 다른 물방울이", "서로 다른 속도로 떨어지며", "부딪쳐 합쳐집니다.", "큰 물방울이 작은 것을 흡수해", "→ 빗방울이 됩니다"];
      for (var li = 0; li < lines.length; li++) K.t(ctx, lines[li], RX + 18, 210 + li * 24, { s: 11.5, c: li === lines.length - 1 ? KC.yellow : KC.ink, w: li === lines.length - 1 ? "800" : "600" });
    }
    K.animate(canvas, function (dt) { if (rnA.on) { rnT += dt / 1000; paint(); } });
    playWire("b-rain-play", rnA, "구름 멈추기", "구름 보기");
    function draw() {
      var ttop = tAt(htop);
      paint();
      $("b-rain-info").innerHTML =
        "구름 꼭대기 <b>" + htop.toFixed(1) + " km</b> → 꼭대기 온도 <b>" + ttop.toFixed(1) + " ℃</b>. " +
        (ttop <= -10
          ? "빙정이 생길 수 있는 찬 구름입니다. <b>빙정설</b>: 같은 온도에서 물에 대한 포화 수증기압이 얼음에 대한 포화 수증기압보다 커서, 과냉각 물방울은 증발하고 그 수증기가 빙정에 달라붙어 빙정만 빠르게 자랍니다. 중위도·고위도의 비는 대부분 이렇게 만들어집니다."
          : "구름 전체가 0 ℃보다 따뜻한 <b>따뜻한 구름</b>입니다. <b>병합설</b>: 크기가 서로 다른 물방울이 낙하 속도 차이 때문에 부딪쳐 합쳐지며 자랍니다. 열대 지방의 비가 이렇게 만들어집니다.") +
        "<br>구름 알갱이의 지름은 약 0.02 mm, 빗방울은 약 2 mm — 지름이 <b>100배</b>, 부피로는 <b>100만 배</b>가 되어야 떨어질 수 있습니다.";

      var ch = false;
      if (!got.a && ttop > 0) { got.a = true; ch = true; }
      if (!got.b && ttop <= -15) { got.b = true; ch = true; }
      if (ch) { window.sthState("bRn", got); mission(); }
    }
    function mission() {
      if (got.a) done("mB4a");
      if (got.b) done("mB4b");
      if (window.sthState("bPick")) done("mB4c");
      if (got.a && got.b && window.sthState("bPick")) {
        window.sthMission("mB4", true, "<span class='m-tag'>미션 완료</span>꼭대기가 <b>3 km 아래</b>면 구름 전체가 0 ℃보다 따뜻해 <b>병합설</b>, <b>5.5 km 위</b>면 −15 ℃ 아래로 내려가 빙정이 생겨 <b>빙정설</b>입니다. 우리나라의 비는 대부분 빙정이 떨어지다 녹은 것입니다.");
        ep.clear(3);
      }
    }
    canvas._redraw = draw;
    $("b-rain-h").addEventListener("input", function (e) {
      htop = +e.target.value; $("b-rain-h-val").textContent = htop.toFixed(1); draw();
    });
    window.sthPick({
      mount: "b-pick",
      q: "빙정설에서, 구름 속의 과냉각 물방울은 줄어들고 얼음 알갱이만 빠르게 커집니다. 그 까닭으로 가장 알맞은 것은?",
      options: [
        "같은 온도에서 포화 수증기압이 물에 대해서보다 얼음에 대해 더 낮아, 수증기가 물방울에서 얼음으로 옮겨 가기 때문",
        "얼음이 물보다 무거워서 떨어지며 물방울을 밀어내기 때문",
        "얼음 알갱이가 물방울보다 온도가 높아 주변을 녹이기 때문",
        "물방울이 얼음에 부딪치면 반드시 튕겨 나가기 때문"
      ],
      answer: 0,
      why: [
        "맞습니다. 얼음 주변은 이미 과포화 상태가 되어 수증기가 빠르게 달라붙고, 물방울 주변은 불포화가 되어 계속 증발합니다. 결과적으로 물방울의 수증기가 얼음으로 옮겨 갑니다.",
        "무게가 아니라 <b>포화 수증기압의 차이</b>가 원인입니다. 실제로 빙정은 매우 가볍습니다.",
        "과냉각 물방울과 빙정은 같은 온도에 있습니다. 차이는 온도가 아니라 포화 수증기압입니다.",
        "부딪쳐 얼어붙는 일(부착 성장)도 있지만, 빙정설의 핵심은 수증기가 옮겨 가는 것입니다."
      ],
      onDone: function () { window.sthState("bPick", 1); mission(); }
    });
    draw(); mission();
    if (ep.cleared(3)) window.sthMission("mB4", true);
  })();

  function finish() {
    window.sthState("r2", "해결 · 구름 구간만큼 데워진다 — 높새바람의 정체는 단열 변화");
  }
  endScene(ep, 4, function () {
    var p = window.sthState("pB1") || "";
    var g = window.sthState("bFo") || {};
    $("b-vs").innerHTML = "<b>나의 첫 추리</b> " + (p || "기록 없음") + "<br>" +
      (p.indexOf("㉡") === 0 ? "정확했습니다. 게다가 그 ‘더워지는 몫’이 <b>구름이 생긴 구간의 길이 × 0.5 ℃/100 m</b>라는 것까지 확인했습니다."
        : "위도도 반사도 아니었습니다. 구름을 만들며 올라오고 구름 없이 내려가는 <b>단열 변화</b>가 답이었습니다.") +
      "<br><b>내가 만든 상태</b> 응결 고도 500 m " + (g.a ? "✔" : "–") + " · 7 ℃ 이상 상승 " + (g.b ? "✔" : "–") + " · 구름 없는 경우 " + (g.c ? "✔" : "–");
  });

  window.sthWork({
    mount: "wkB", unitLabel: "[지구시스템과학 Ⅱ-2] 이야기 ② 산을 넘은 바람",
    items: [
      { id: "w1", label: "안정한 대기와 불안정한 대기", hint: "기온 감률과 단열 감률을 비교해, 어느 쪽일 때 공기 덩어리가 계속 올라가는지 쓰세요." },
      { id: "bw2", label: "높새바람을 농민에게 설명하는 글", hint: "산을 오를 때와 내려올 때 무엇이 달랐는지, 왜 산 너머가 더 덥고 건조한지를 상승 응결 고도·건조 단열 감률·습윤 단열 감률이라는 말을 넣어 세 문장으로 쓰세요." }
    ]
  });
})();

/* =========================================================================
   이야기 ③ 하늘에 멈춰 선 기구 — 기압의 연직 분포 · 정역학적 균형 · 연직 운동
   ========================================================================= */
(function () {
  var ep = window.sthStory({ root: "epC", key: "epC", name: "사건 파일 ③", onDone: finish });

  function pres(zkm) {                       /* 표준 대기 (hPa) */
    var z = zkm * 1000;
    if (z <= 11000) return 1013.25 * Math.pow(1 - 0.0065 * z / 288.15, 5.2559);
    return 226.32 * Math.exp(-(z - 11000) / 6341.6);
  }

  window.sthGate({
    gate: "gC", key: "pC1", title: "조사관의 첫 추리",
    question: "공기에도 무게가 있습니다. 그런데 대기는 왜 지표로 쏟아져 얇게 깔리지 않고, 수십 km 높이까지 퍼져 있을까요?",
    options: [
      "㉠ 공기가 너무 가벼워 중력이 거의 작용하지 않기 때문이다",
      "㉡ 아래쪽 공기가 더 눌려 기압이 커지고, 그 차이가 위로 미는 힘이 되어 무게와 균형을 이루기 때문이다",
      "㉢ 지구 자전의 원심력이 공기를 붙잡아 두기 때문이다"
    ],
    onPick: function () { ep.clear(0); }
  });

  /* ---------------- 장면 2 — 기압의 연직 분포 ---------------- */
  (function () {
    var canvas = $("c-prof"); if (!canvas) return;
    var ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var z = 5;
    var got = window.sthState("cPr") || { a: false, b: false, c: false };
    var P0 = pres(0);

    var prA = { on: !REDUCE }, prT = 0;
    function paint() {
      var p = pres(z), dp = p - pres(Math.min(z + 1, 20)), i;
      var GY = 344, TY = 66;
      function yOfZ(zz) { return GY - zz / 20 * (GY - TY); }
      ctx.clearRect(0, 0, W, H);
      /* ── 왼쪽: 공기 기둥 ── */
      var LW = 340, CX0 = 70, CX1 = 300;
      K.stage(ctx, 0, 0, LW, H, "space", { seed: 93, title: "공기 분자의 분포" });
      var sky = ctx.createLinearGradient(0, TY, 0, GY); sky.addColorStop(0, "rgba(40,60,160,.05)"); sky.addColorStop(1, "rgba(90,170,255,.45)");
      ctx.fillStyle = sky; ctx.fillRect(CX0, TY, CX1 - CX0, GY - TY);
      ctx.strokeStyle = "rgba(200,220,255,.35)"; ctx.lineWidth = 1.2; ctx.strokeRect(CX0, TY, CX1 - CX0, GY - TY);
      var R = K.rng(37);
      for (i = 0; i < 520; i++) {
        var zz = -Math.log(1 - R() * 0.98) * 8, xx = CX0 + 6 + R() * (CX1 - CX0 - 12), ph = R() * 6.28;
        if (zz > 20) continue;
        var jx = Math.sin(prT * 7 + ph) * 2.2, jy = Math.cos(prT * 6 + ph * 1.3) * 2.2;
        ctx.fillStyle = "rgba(190,230,255,.85)"; ctx.beginPath(); ctx.arc(xx + jx, yOfZ(zz) + jy, 1.7, 0, 6.2832); ctx.fill();
      }
      K.line(ctx, { x: CX0, y: yOfZ(11) }, { x: CX1, y: yOfZ(11) }, KC.red, 1.5, [5, 4]);
      K.pill(ctx, "대류권 계면 11 km", CX0 + 6, yOfZ(11) - 8, { s: 10, c: KC.red });
      [0, 5, 10, 15, 20].forEach(function (k) { K.t(ctx, k + " km", CX0 - 6, yOfZ(k) + 4, { s: 10, a: "right", c: KC.mute }); });
      K.line(ctx, { x: CX0 + 4, y: yOfZ(z) }, { x: CX1 - 4, y: yOfZ(z) }, KC.yellow, 2);
      K.pill(ctx, "지금 고도", CX1 - 8, yOfZ(z) - 8, { a: "right", s: 10, c: KC.yellow, box: [0, LW] });
      ctx.fillStyle = hillGrad(ctx, GY, GY + 10); ctx.fillRect(CX0, GY, CX1 - CX0, 10);
      K.t(ctx, "아래로 갈수록 촘촘합니다", CX0, GY + 32, { s: 10.5, c: KC.mute });
      /* ── 오른쪽: 그래프 ── */
      var RX = LW + 8;
      K.stage(ctx, RX, 0, W - RX, H, "lab", { seed: 95, title: "높이에 따른 기압 — 지수 함수에 가깝다" });
      var X0 = 400, X1 = 870;
      function xOfP(pp) { return X0 + pp / 1050 * (X1 - X0); }
      [0, 250, 500, 750, 1000].forEach(function (pp) {
        K.line(ctx, { x: xOfP(pp), y: TY }, { x: xOfP(pp), y: GY }, KC.grid, 1);
        K.t(ctx, String(pp), xOfP(pp), GY + 16, { s: 10, a: "center", c: KC.mute });
      });
      [0, 5, 10, 15, 20].forEach(function (k) { K.line(ctx, { x: X0, y: yOfZ(k) }, { x: X1, y: yOfZ(k) }, KC.grid, 1); K.t(ctx, k + " km", X0 - 6, yOfZ(k) + 4, { s: 10, a: "right", c: KC.mute }); });
      K.line(ctx, { x: X0, y: TY }, { x: X0, y: GY }, KC.line, 1.5); K.line(ctx, { x: X0, y: GY }, { x: X1, y: GY }, KC.line, 1.5);
      K.t(ctx, "기압 (hPa)", X1, GY + 34, { s: 11, a: "right", c: KC.mute });
      [[P0 / 2, "지표의 1/2"], [P0 / 10, "지표의 1/10"]].forEach(function (m) {
        K.line(ctx, { x: xOfP(m[0]), y: TY }, { x: xOfP(m[0]), y: GY }, KC.violet, 1.5, [5, 4]);
        K.pill(ctx, m[1], xOfP(m[0]), TY - 4, { a: "center", s: 10, c: KC.violet });
      });
      ctx.save(); ctx.shadowColor = KC.green; ctx.shadowBlur = 8; ctx.strokeStyle = KC.green; ctx.lineWidth = 3; ctx.beginPath();
      for (var s = 0; s <= 200; s++) { var zc = s / 10; if (s === 0) ctx.moveTo(xOfP(pres(zc)), yOfZ(zc)); else ctx.lineTo(xOfP(pres(zc)), yOfZ(zc)); }
      ctx.stroke(); ctx.restore();
      K.line(ctx, { x: X0, y: yOfZ(z) }, { x: xOfP(p), y: yOfZ(z) }, KC.yellow, 1.6, [5, 4]);
      K.line(ctx, { x: xOfP(p), y: yOfZ(z) }, { x: xOfP(p), y: GY }, KC.yellow, 1.6, [5, 4]);
      K.glow(ctx, xOfP(p), yOfZ(z), 5, "rgba(255,211,107,.98)", 3.4);
      var lx = xOfP(p), la = lx > 700 ? "right" : "left";
      K.pill(ctx, p.toFixed(0) + " hPa", lx + (la === "right" ? -12 : 12), Math.max(yOfZ(z) - 10, TY + 26), { s: 13, a: la, c: KC.yellow, box: [RX, W] });
      K.pill(ctx, "고도 " + z.toFixed(1) + " km · 기압 " + p.toFixed(1) + " hPa (지표의 " + (p / P0 * 100).toFixed(1) + " %)", RX + 14, 386, { s: 12, c: KC.ink });
      K.t(ctx, "1 km 더 오르면 " + dp.toFixed(1) + " hPa 떨어집니다", W - 16, 406, { s: 11.5, a: "right", w: dp >= 100 ? "900" : "700", c: dp >= 100 ? KC.red : KC.mute });
    }
    K.animate(canvas, function (dt) { if (prA.on) { prT += dt / 1000; paint(); } });
    playWire("c-prof-play", prA, "분자 멈추기", "분자 움직이기");
    function draw() {
      var p = pres(z), dp = p - pres(Math.min(z + 1, 20));
      paint();
      $("c-prof-info").innerHTML =
        "고도 <b>" + z.toFixed(1) + " km</b>의 기압은 <b>" + p.toFixed(1) + " hPa</b> — 지표(1,013 hPa)의 <b>" + (p / P0 * 100).toFixed(1) + " %</b>입니다.<br>" +
        "어떤 높이의 기압은 <b>그 위에 쌓인 공기 기둥의 무게</b>와 같습니다. 아래쪽일수록 공기가 촘촘하므로 같은 1 km를 올라가도 기압이 더 많이 떨어집니다. " +
        "지금 이 높이에서 1 km를 더 오르면 <b>" + dp.toFixed(1) + " hPa</b>가 줄어듭니다. " +
        (z < 1.5 ? "지표 부근에서는 100 m마다 약 12 hPa씩 떨어집니다." : "위로 갈수록 같은 높이 변화에 대한 기압 변화가 작아집니다.");

      var ch = false;
      if (!got.a && Math.abs(p - P0 / 2) <= 15) { got.a = true; ch = true; }
      if (!got.b && Math.abs(p - P0 / 10) <= 5) { got.b = true; ch = true; }
      if (!got.c && dp >= 100) { got.c = true; ch = true; }
      if (ch) { window.sthState("cPr", got); mission(); }
    }
    function mission() {
      if (got.a) done("mC2a");
      if (got.b) done("mC2b");
      if (got.c) done("mC2c");
      if (got.a && got.b && got.c) {
        window.sthMission("mC2", true, "<span class='m-tag'>미션 완료</span>기압이 절반이 되는 높이는 <b>약 5.5 km</b>, 1/10이 되는 높이는 <b>약 16 km</b>입니다. 5.5 km 오를 때마다 대략 절반씩 줄어(5.5 km에서 1/2, 11 km에서 약 1/4, 16 km에서 약 1/10) 기압은 일정한 배율로 줄어드는 <b>지수 함수 모양</b>으로 낮아집니다. 그래서 1 km당 100 hPa 넘게 떨어지는 곳은 지표 부근(약 1.3 km 아래)뿐입니다.");
        ep.clear(1);
      }
    }
    canvas._redraw = draw;
    $("c-prof-z").addEventListener("input", function (e) {
      z = Math.round(+e.target.value * 10) / 10; $("c-prof-z-val").textContent = z.toFixed(1); draw();
    });
    draw(); mission();
    if (ep.cleared(1)) window.sthMission("mC2", true);
  })();

  /* ---------------- 장면 3 — 정역학적 균형 저울 ---------------- */
  (function () {
    var canvas = $("c-hydro"); if (!canvas) return;
    var ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var pb = 1011.3, tc = 15;
    var got = window.sthState("cHy") || { a: false, b: false, c: false };
    var PTOP = 1000, DZ = 100, RD = 287;

    function state() {
      var pmid = (pb + PTOP) / 2 * 100;
      var rho = pmid / (RD * (tc + 273.15));
      var wgt = rho * G * DZ;
      var dp = (pb - PTOP) * 100;
      return { rho: rho, w: wgt, up: dp, net: dp - wgt, acc: (dp - wgt) / (rho * DZ) };
    }

    function draw() {
      var s = state();
      ctx.clearRect(0, 0, W, H);
      K.stage(ctx, 0, 0, W, H, "night", { seed: 97, title: "공기 저울 — 두께 100 m, 밑면적 1 m² 인 공기 층 하나" });
      var bal = Math.abs(s.net) <= 10, col = bal ? KC.green : (s.net > 0 ? KC.red : KC.violet);
      /* 가운데 공기 층(유리 상자) */
      var BX = 320, BW = 260, BY = 182, BH = 100, off = bal ? 0 : (s.net > 0 ? -8 : 8), u = (tc + 10) / 50;
      BY += off;
      var gg = ctx.createLinearGradient(BX, BY, BX + BW, BY + BH);
      gg.addColorStop(0, heatCol(u, .40)); gg.addColorStop(1, heatCol(u, .16));
      ctx.fillStyle = gg; ctx.beginPath(); ctx.roundRect(BX, BY, BW, BH, 12); ctx.fill();
      ctx.strokeStyle = "rgba(220,235,255,.6)"; ctx.lineWidth = 1.5; ctx.stroke();
      var R = K.rng(11), nm = Math.round(30 + (s.rho - 1.1) * 220);
      for (var i = 0; i < nm; i++) K.glow(ctx, BX + 8 + R() * (BW - 16), BY + 8 + R() * (BH - 16), 1.4, "rgba(220,240,255,.9)", 2.6);
      K.pill(ctx, "공기 " + s.rho.toFixed(3) + " kg/m³", BX + BW / 2, BY + 44, { a: "center", s: 12.5, c: KC.blue });
      K.pill(ctx, "무게 " + s.w.toFixed(0) + " N/m²", BX + BW / 2, BY + 72, { a: "center", s: 12, c: KC.violet });
      K.t(ctx, "위 면 " + PTOP.toFixed(1) + " hPa", BX + BW / 2, 166, { s: 11.5, w: "800", a: "center", c: KC.mute });
      K.t(ctx, "아래 면 " + pb.toFixed(1) + " hPa", BX + BW / 2, 316, { s: 11.5, w: "800", a: "center", c: KC.mute });
      [0, 1].forEach(function (k) {
        var xx = BX + 36 + k * (BW - 72);
        ctx.save(); ctx.shadowColor = KC.violet; ctx.shadowBlur = 6; K.arrow(ctx, { x: xx, y: 122 }, { x: xx, y: BY - 6 }, KC.violet, 2.6, 9); ctx.restore();
        ctx.save(); ctx.shadowColor = KC.red; ctx.shadowBlur = 6; K.arrow(ctx, { x: xx, y: 330 }, { x: xx, y: BY + BH + 6 }, KC.red, 2.6, 9); ctx.restore();
      });
      K.pill(ctx, "위에서 누르는 기압", BX + BW / 2, 110, { a: "center", s: 11, c: KC.violet });
      K.pill(ctx, "아래에서 받치는 기압", BX + BW / 2, 352, { a: "center", s: 11, c: KC.red });
      /* 왼쪽 힘 막대 */
      function fbar(y, label, val, c0) {
        K.t(ctx, label, 30, y - 8, { s: 11, w: "800", c: c0 });
        ctx.fillStyle = "rgba(255,255,255,.07)"; ctx.beginPath(); ctx.roundRect(30, y, 250, 18, 9); ctx.fill();
        ctx.save(); ctx.shadowColor = c0; ctx.shadowBlur = 8; ctx.fillStyle = c0; ctx.beginPath(); ctx.roundRect(30, y, Math.max(8, clamp(val / 2100, 0, 1) * 250), 18, 9); ctx.fill(); ctx.restore();
        K.t(ctx, val.toFixed(0) + " N/m²", 30, y + 36, { s: 12, w: "800", c: KC.ink });
      }
      fbar(176, "위로 미는 힘 (기압 차)", s.up, KC.red);
      fbar(252, "아래로 당기는 힘 (무게)", s.w, KC.violet);
      /* 오른쪽 결과 */
      K.t(ctx, "남는 힘", 620, 168, { s: 11.5, w: "800", c: KC.mute });
      K.pill(ctx, (s.net >= 0 ? "+" : "") + s.net.toFixed(1) + " N/m²", 626, 212, { s: 22, c: col });
      K.t(ctx, "가속도 " + (s.acc >= 0 ? "+" : "") + s.acc.toFixed(2) + " m/s²", 620, 246, { s: 12.5, w: "800", c: KC.mute });
      K.t(ctx, bal ? "정역학적 균형" : (s.net > 0 ? "위로 움직인다" : "아래로 움직인다"), 620, 280, { s: 16, w: "900", c: col });
      ctx.save(); ctx.shadowColor = col; ctx.shadowBlur = 10;
      if (!bal) K.arrow(ctx, { x: 820, y: s.net > 0 ? 300 : 186 }, { x: 820, y: s.net > 0 ? 186 : 300 }, col, 5, 14);
      else K.line(ctx, { x: 780, y: 244 }, { x: 860, y: 244 }, KC.green, 4);
      ctx.restore();
      /* 아래 띠 */
      K.pill(ctx, bal
        ? "✔ 위로 미는 힘과 무게가 같습니다 — 공기 층은 위아래로 움직이지 않습니다"
        : (s.net > 0 ? "기압 차가 무게보다 큽니다 → 남는 힘이 공기를 위로 밀어 올립니다 (상승 기류)"
          : "무게가 기압 차보다 큽니다 → 공기가 가라앉습니다 (하강 기류)"), 450, 404, { a: "center", s: 13, c: bal ? KC.green : KC.ink, line: bal ? "rgba(63,211,163,.6)" : null });
      $("c-hydro-info").innerHTML =
        "아래 면 <b>" + pb.toFixed(1) + " hPa</b> − 위 면 <b>1,000.0 hPa</b> = " + (pb - PTOP).toFixed(1) + " hPa → 위로 미는 힘 <b>" + s.up.toFixed(0) + " N/m²</b>.<br>" +
        "공기 밀도는 ρ = p / (R·T) = <b>" + s.rho.toFixed(3) + " kg/m³</b>, 무게는 ρ·g·Δz = <b>" + s.w.toFixed(0) + " N/m²</b>. 남는 힘 <b>" + s.net.toFixed(1) + " N/m²</b>.<br>" +
        (Math.abs(s.net) <= 10
          ? "✅ 두 힘이 균형을 이룹니다 — <b>정역학적 균형</b>입니다. 대기가 중력에 끌리면서도 지표로 쏟아지지 않는 까닭입니다."
          : "공기를 <b>데우면</b> 밀도가 작아져 무게가 줄고, <b>식히면</b> 무게가 늘어납니다. 기압을 바꾸지 않고 기온만 바꿔도 저울이 기웁니다.");

      var ch = false;
      if (!got.a && Math.abs(s.net) <= 10) { got.a = true; ch = true; }
      if (!got.b && s.net >= 100) { got.b = true; ch = true; }
      if (!got.c && s.net <= -100) { got.c = true; ch = true; }
      if (ch) { window.sthState("cHy", got); mission(); }
    }
    function mission() {
      if (got.a) done("mC3a");
      if (got.b) done("mC3b");
      if (got.c) done("mC3c");
      if (got.a && got.b && got.c) {
        window.sthMission("mC3", true, "<span class='m-tag'>미션 완료</span>두께 100 m 공기 층의 무게는 약 <b>1,190 N/m²</b> — 기압으로 치면 <b>약 12 hPa</b>입니다. 그래서 지표 부근에서 100 m 올라갈 때 기압이 12 hPa씩 떨어지는 것입니다. 기압 차와 무게가 같으면 <b>정역학적 균형</b>, 어느 한쪽이 크면 공기가 위나 아래로 움직입니다.");
        ep.clear(2);
      }
    }
    canvas._redraw = draw;
    $("c-hydro-p").addEventListener("input", function (e) {
      pb = Math.round(+e.target.value * 10) / 10; $("c-hydro-p-val").textContent = pb.toFixed(1); draw();
    });
    $("c-hydro-t").addEventListener("input", function (e) { tc = +e.target.value; $("c-hydro-t-val").textContent = tc; draw(); });
    draw(); mission();
    if (ep.cleared(2)) window.sthMission("mC3", true);
  })();

  /* ---------------- 장면 4 — 연직 운동의 네 가지 원인 ---------------- */
  (function () {
    var canvas = $("c-vert"); if (!canvas) return;
    var ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var kind = "heat", sv = 20;
    var got = window.sthState("cVe") || { heat: false, oro: false, front: false, conv: false };
    var KINDS = [
      { id: "heat", name: "① 지표 가열", unit: "주변보다 높은 기온 차", target: 5.0 },
      { id: "oro", name: "② 지형", unit: "산으로 부는 바람", target: 0.5 },
      { id: "front", name: "③ 전선", unit: "전선의 이동 속도", target: 0.3 },
      { id: "conv", name: "④ 수렴", unit: "바람이 모여드는 정도", target: 0.05 }
    ];
    function val(id, s) {
      if (id === "heat") return s / 100 * 3;
      if (id === "oro") return s / 100 * 25;
      if (id === "front") return s / 100 * 25;
      return s / 100 * 5e-5;
    }
    function wOf(id, s) {
      var x = val(id, s);
      if (id === "heat") return Math.sqrt(G * x / 288 * 500);
      if (id === "oro") return x * 0.05;
      if (id === "front") return x * 0.02;
      return x * 1500;
    }
    function valText(id, s) {
      var x = val(id, s);
      if (id === "heat") return x.toFixed(2) + " ℃ 더 따뜻함";
      if (id === "oro") return x.toFixed(1) + " m/s의 바람";
      if (id === "front") return x.toFixed(1) + " m/s로 이동";
      return (x * 1e5).toFixed(2) + " ×10⁻⁵ /s로 수렴";
    }
    function cur() { for (var i = 0; i < KINDS.length; i++) if (KINDS[i].id === kind) return KINDS[i]; return KINDS[0]; }

    var veA = { on: !REDUCE }, veT = 0;
    function ground(gy) { ctx.fillStyle = hillGrad(ctx, gy, H); ctx.fillRect(14, gy, 520, H - gy - 14); }
    function drawHeat() {
      var gy = 352, s = sv / 100, i;
      var hg = ctx.createLinearGradient(0, gy - 30, 0, gy); hg.addColorStop(0, "rgba(255,120,80,0)"); hg.addColorStop(1, "rgba(255,120,80," + (.2 + s * .4) + ")");
      ctx.fillStyle = hg; ctx.fillRect(14, gy - 30, 520, 30);
      ground(gy);
      K.pill(ctx, "뜨거워진 지표", 30, gy + 30, { s: 11, c: KC.orange });
      K.sun(ctx, 470, 110, 18);
      K.pill(ctx, "햇빛", 470, 168, { a: "center", s: 11, c: KC.yellow });
      for (i = 0; i < 3; i++) {
        var xx = 140 + i * 110, rise = ((veT * (0.15 + s * .5) + i * .33) % 1), yy = gy - 30 - rise * 230, r = 14 + s * 14;
        ctx.save(); ctx.globalAlpha = 1 - rise * .8;
        var bg = ctx.createRadialGradient(xx - r * .3, yy - r * .3, 2, xx, yy, r); bg.addColorStop(0, "rgba(255,200,170,.9)"); bg.addColorStop(1, "rgba(255,107,80,.25)");
        ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(xx, yy, r, 0, 6.2832); ctx.fill(); ctx.restore();
        K.arrow(ctx, { x: xx + r + 10, y: gy - 30 }, { x: xx + r + 10, y: gy - 90 - s * 120 }, KC.red, 2.5, 9);
      }
      K.pill(ctx, "가열된 공기는 주변보다 가벼워져 떠오릅니다 (부력)", 30, 92, { s: 11.5, c: KC.ink, box: [0, 540] });
    }
    function drawOro() {
      var gy = 352, s = sv / 100, i;
      ctx.beginPath(); ctx.moveTo(14, gy); ctx.lineTo(250, gy); ctx.lineTo(400, 150); ctx.lineTo(534, gy - 40); ctx.lineTo(534, H - 14); ctx.lineTo(14, H - 14); ctx.closePath();
      ctx.fillStyle = hillGrad(ctx, 150, H); ctx.fill();
      for (i = 0; i < 3; i++) {
        var yy = 300 - i * 50;
        K.arrow(ctx, { x: 40, y: yy }, { x: 150 + s * 60, y: yy }, KC.yellow, 2 + s * 3, 10);
      }
      for (i = 0; i < 5; i++) {
        var u = (veT * (0.12 + s * .4) + i / 5) % 1, x = 250 + u * 150, y = 352 - u * 202 - 14;
        K.glow(ctx, x, y, 2.2, "rgba(220,255,240,.95)", 3);
      }
      ctx.save(); ctx.shadowColor = KC.green; ctx.shadowBlur = 8; K.arrow(ctx, { x: 262, y: 322 }, { x: 384, y: 160 }, KC.green, 3.5, 12); ctx.restore();
      K.pill(ctx, "바람이 산비탈을 타고 억지로 올라갑니다", 30, 92, { s: 11.5, c: KC.ink });
      K.pill(ctx, "산 경사 1/20", 400, 136, { a: "center", s: 11, c: KC.ink });
    }
    function drawFront() {
      var gy = 352, s = sv / 100, i;
      ground(gy);
      var cg = ctx.createLinearGradient(14, 0, 420, 0); cg.addColorStop(0, "rgba(90,160,255,.55)"); cg.addColorStop(1, "rgba(90,160,255,.15)");
      ctx.fillStyle = cg; ctx.beginPath(); ctx.moveTo(14, gy); ctx.lineTo(14, 170); ctx.lineTo(420, gy); ctx.closePath(); ctx.fill();
      ctx.save(); ctx.shadowColor = KC.blue; ctx.shadowBlur = 8; K.line(ctx, { x: 14, y: 170 }, { x: 420, y: gy }, KC.blue, 3); ctx.restore();
      var wg = ctx.createLinearGradient(300, 0, 534, 0); wg.addColorStop(0, "rgba(255,140,100,.10)"); wg.addColorStop(1, "rgba(255,140,100,.30)");
      ctx.fillStyle = wg; ctx.beginPath(); ctx.moveTo(420, gy); ctx.lineTo(534, gy); ctx.lineTo(534, 120); ctx.lineTo(14, 120); ctx.lineTo(14, 170); ctx.closePath(); ctx.fill();
      K.pill(ctx, "찬 공기", 60, 300, { s: 12, c: KC.blue });
      K.pill(ctx, "따뜻한 공기", 470, 250, { a: "center", s: 12, c: KC.orange });
      for (i = 0; i < 5; i++) {
        var u = (veT * (0.1 + s * .35) + i / 5) % 1, x = 480 - u * 300, y = gy - 24 - u * 140;
        K.glow(ctx, x, y, 2.2, "rgba(255,220,200,.95)", 3);
      }
      K.arrow(ctx, { x: 480, y: gy - 20 }, { x: 300, y: 200 }, KC.red, 3 + s * 2, 12);
      K.arrow(ctx, { x: 30, y: gy - 20 }, { x: 100 + s * 80, y: gy - 20 }, KC.blue, 3, 10);
      K.pill(ctx, "찬 공기가 밀고 들어오며 따뜻한 공기를 들어 올립니다", 30, 92, { s: 11.5, c: KC.ink });
      K.pill(ctx, "전선면 경사 1/50", 200, 150, { s: 11, c: KC.ink });
    }
    function drawConv() {
      var cx = 274, cy = 250, s = sv / 100, i, k;
      for (i = 1; i <= 3; i++) { ctx.strokeStyle = "rgba(255,255,255,.45)"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy, i * 42, 0, 6.2832); ctx.stroke(); }
      var lg = ctx.createRadialGradient(cx, cy, 4, cx, cy, 40); lg.addColorStop(0, "rgba(127,211,255,.6)"); lg.addColorStop(1, "rgba(127,211,255,0)");
      ctx.fillStyle = lg; ctx.beginPath(); ctx.arc(cx, cy, 40, 0, 6.2832); ctx.fill();
      K.pill(ctx, "L", cx, cy + 9, { a: "center", s: 24, c: KC.blue });
      for (k = 0; k < 8; k++) {
        var a = k * Math.PI / 4;
        K.arrow(ctx, { x: cx + 140 * Math.cos(a), y: cy + 140 * Math.sin(a) }, { x: cx + 60 * Math.cos(a), y: cy + 60 * Math.sin(a) }, KC.green, 2 + s * 3, 10);
        var u = (veT * (0.15 + s * .4) + k * .13) % 1, rr = 150 - u * 90;
        K.glow(ctx, cx + rr * Math.cos(a + .2), cy + rr * Math.sin(a + .2), 2, "rgba(220,255,240,.95)", 3);
      }
      K.pill(ctx, "지상 저기압 — 사방에서 바람이 모여듭니다", 30, 92, { s: 11.5, c: KC.ink });
      K.pill(ctx, "갈 곳이 없어진 공기는 위로 올라갑니다", 30, 420, { s: 11.5, c: KC.green });
    }
    function paint() {
      var c = cur(), w = wOf(kind, sv), i;
      ctx.clearRect(0, 0, W, H);
      var LW = 548;
      K.stage(ctx, 0, 0, LW, H, "sky", { seed: 99 });
      K.pill(ctx, "정역학적 균형이 깨지는 네 가지 길", 16, 28, { s: 13, c: KC.blue });
      K.pill(ctx, c.name + " · " + valText(kind, sv), 16, 58, { s: 12, c: KC.green });
      if (kind === "heat") drawHeat(); else if (kind === "oro") drawOro(); else if (kind === "front") drawFront(); else drawConv();
      /* ── 오른쪽: 상승 속도 비교 ── */
      var RX = LW + 8, bx = RX + 16, bw = W - RX - 32;
      K.stage(ctx, RX, 0, W - RX, H, "lab", { seed: 101, title: "상승 속도 비교 (로그 눈금)" });
      for (i = 0; i < KINDS.length; i++) {
        var KN = KINDS[i], yy = 104 + i * 74, on = KN.id === kind;
        var ww = on ? w : (got[KN.id] ? KN.target : 0);
        K.t(ctx, KN.name, bx, yy - 12, { s: 11.5, w: on ? "900" : "700", c: on ? KC.green : KC.mute });
        ctx.fillStyle = "rgba(255,255,255,.07)"; ctx.beginPath(); ctx.roundRect(bx, yy, bw, 16, 8); ctx.fill();
        var len = clamp((Math.log(Math.max(ww, 0.01)) / Math.LN10 + 2) / 2.9, 0, 1) * bw;
        var bc = got[KN.id] ? KC.green : (on ? KC.blue : "rgba(200,210,255,.3)");
        if (len > 0) { ctx.save(); ctx.shadowColor = bc; ctx.shadowBlur = on ? 10 : 0; ctx.fillStyle = bc; ctx.beginPath(); ctx.roundRect(bx, yy, Math.max(8, len), 16, 8); ctx.fill(); ctx.restore(); }
        var tlen = clamp((Math.log(KN.target) / Math.LN10 + 2) / 2.9, 0, 1) * bw;
        K.line(ctx, { x: bx + tlen, y: yy - 5 }, { x: bx + tlen, y: yy + 21 }, KC.red, 2);
        K.t(ctx, (on ? ww.toFixed(3) + " m/s" : (got[KN.id] ? "✔ 넘김" : "–")), bx, yy + 36, { s: 11, w: "800", c: on ? KC.ink : KC.mute });
        K.t(ctx, "목표 " + KN.target + " m/s", bx + bw, yy + 36, { s: 10.5, a: "right", c: KC.red });
      }
      K.t(ctx, "빨간 선 = 이 미션의 목표 속도", bx, 420, { s: 10.5, c: KC.mute });
    }
    K.animate(canvas, function (dt) { if (veA.on) { veT += dt / 1000; paint(); } });
    playWire("c-vert-play", veA, "공기 멈추기", "공기 보기");
    function draw() {
      var c = cur(), w = wOf(kind, sv);
      paint();
      $("c-vert-info").innerHTML =
        "<b>" + c.name + "</b> · " + valText(kind, sv) + " → 상승 속도 <b>" + w.toFixed(3) + " m/s</b> (목표 " + c.target + " m/s)<br>" +
        (kind === "heat" ? "지표가 가열되면 그 위 공기의 밀도가 작아져 무게가 줄고, 남는 기압 경도력이 공기를 밀어 올립니다. 부력 가속도는 g·ΔT/T입니다. 좁은 지역에서 가장 빠른 상승 기류를 만들어 적운·적란운을 키웁니다."
          : kind === "oro" ? "산맥을 만난 바람은 옆으로 돌아가지 못하면 비탈을 타고 올라갑니다. 상승 속도는 풍속 × 경사입니다. 산맥의 바람받이 쪽에 늘 비가 많은 까닭입니다."
          : kind === "front" ? "성질이 다른 두 공기가 만나면 따뜻하고 가벼운 공기가 찬 공기 위로 올라탑니다. 전선면의 경사가 완만해 상승 속도는 느리지만, 전선을 따라 수백 km에 걸쳐 넓게 일어납니다."
          : "지상 저기압에서는 사방의 바람이 중심으로 모여듭니다(수렴). 아래는 지표라 빠져나갈 수 없으니 공기는 위로 올라갑니다. 속도는 가장 느리지만 저기압 전체에서 오래 이어져 큰 구름대를 만듭니다.") +
        "<br>네 가지 모두 결국 <b>정역학적 균형이 깨져</b> 공기가 움직이는 것입니다.";

      if (!got[kind] && w >= c.target) { got[kind] = true; window.sthState("cVe", got); mission(); }
    }
    function mission() {
      if (got.heat) done("mC4a");
      if (got.oro) done("mC4b");
      if (got.front) done("mC4c");
      if (got.conv) done("mC4d");
      if (got.heat && got.oro && got.front && got.conv) {
        window.sthMission("mC4", true, "<span class='m-tag'>미션 완료</span>네 가지 원인의 상승 속도는 <b>100배 넘게</b> 차이가 납니다. 지표 가열은 좁은 곳에서 초속 몇 m로 빠르게, 수렴은 넓은 곳에서 초속 몇 cm로 느리게 — 그래서 소나기구름과 저기압의 구름대는 모습이 전혀 다릅니다.");
        ep.clear(3);
      }
    }
    canvas._redraw = draw;
    $("c-vert-s").addEventListener("input", function (e) { sv = +e.target.value; $("c-vert-s-val").textContent = sv + " %"; draw(); });
    seg("c-vert-k", function (b) { kind = b.getAttribute("data-k"); draw(); });
    draw(); mission();
    if (ep.cleared(3)) window.sthMission("mC4", true);
  })();

  function finish() {
    window.sthState("r3", "해결 · 기압 경도력 = 무게일 때 정역학적 균형, 깨지면 상승·하강 기류");
  }
  endScene(ep, 4, function () {
    var p = window.sthState("pC1") || "";
    var g = window.sthState("cVe") || {};
    var n = 0;
    ["heat", "oro", "front", "conv"].forEach(function (k) { if (g[k]) n++; });
    $("c-vs").innerHTML = "<b>나의 첫 추리</b> " + (p || "기록 없음") + "<br>" +
      (p.indexOf("㉡") === 0 ? "정확했습니다. 두께 100 m 공기 층의 무게가 약 12 hPa이라는 것까지 확인했습니다."
        : "중력은 분명히 작용합니다. 다만 아래쪽 기압이 위쪽보다 커서 생기는 <b>연직 기압 경도력</b>이 그 무게를 정확히 받치고 있었습니다.") +
      "<br><b>내가 작동시킨 연직 운동의 원인</b> " + n + " / 4 가지";
  });

  window.sthWork({
    mount: "wkC", unitLabel: "[지구시스템과학 Ⅱ-2] 이야기 ③ 하늘에 멈춰 선 기구",
    items: [
      { id: "cw1", label: "정역학적 균형이란 무엇인가", hint: "어떤 두 힘이 어떻게 균형을 이루는지, 그리고 그 결과 기압이 높이에 따라 어떤 모양으로 변하는지 함께 쓰세요." },
      { id: "cw2", label: "우리 동네에 소나기가 쏟아진 날", hint: "연직 운동의 네 가지 원인 가운데 하나를 골라, 그날 어떤 일이 일어나 공기가 올라갔고 왜 구름이 생겼는지 이어서 설명하세요." }
    ]
  });
})();

/* =========================================================================
   이야기 ④ 제트 기류를 읽는 사람 — 지균풍 · 경도풍 · 지상풍 · 행성파
   ========================================================================= */
(function () {
  var ep = window.sthStory({ root: "epD", key: "epD", name: "사건 파일 ④", onDone: finish });
  var OM = 7.292e-5, RHO = 1.2, DPA = 400;      /* 등압선 사이 기압 차 4 hPa = 400 Pa */

  function fOf(lat) { return 2 * OM * Math.sin(lat * Math.PI / 180); }
  function pgfOf(dkm) { return DPA / (RHO * dkm * 1000); }

  window.sthGate({
    gate: "gD", key: "pD1", title: "예보관의 첫 판단",
    question: "같은 날, 우리나라는 한파인데 비슷한 위도의 유럽 서부는 포근했습니다. 무엇이 이런 차이를 만들었을까요?",
    options: [
      "㉠ 그날 태양의 활동이 약해져 북반구가 고르게 추워졌다",
      "㉡ 상층 편서풍이 남북으로 크게 굽이쳐, 찬 공기가 어느 한쪽으로만 흘러내렸다",
      "㉢ 지구 온난화로 추위가 사라지는 중이라 이례적인 일이 일어났다"
    ],
    onPick: function () { ep.clear(0); }
  });

  /* ---------------- 장면 2 — 지균풍 ---------------- */
  (function () {
    var canvas = $("d-geo"); if (!canvas) return;
    var ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var dkm = 500, lat = 45, frac = 0, running = false;
    var got = window.sthState("dGe") || { a: false, b: false };

    function vg() { return pgfOf(dkm) / fOf(lat); }

    var geA = { on: !REDUCE }, geT = 0;
    function paint() {
      var f = fOf(lat), P = pgfOf(dkm), V = vg(), i;
      ctx.clearRect(0, 0, W, H);
      var LW = 600;
      K.stage(ctx, 0, 0, LW, H, "night", { seed: 103, title: "상공의 바람 — 두 힘이 평형을 이룰 때" });
      var yc = 222, sp = 20 + (dkm - 100) / 700 * 50;
      var lo = ctx.createLinearGradient(0, 70, 0, 380); lo.addColorStop(0, "rgba(127,211,255,.18)"); lo.addColorStop(.5, "rgba(127,211,255,0)"); lo.addColorStop(.5, "rgba(255,107,129,0)"); lo.addColorStop(1, "rgba(255,107,129,.16)");
      ctx.fillStyle = lo; ctx.fillRect(14, 70, LW - 28, 310);
      for (i = -2; i <= 2; i++) {
        var yy = yc + i * sp;
        ctx.save(); ctx.shadowColor = "rgba(200,210,255,.6)"; ctx.shadowBlur = 4; K.line(ctx, { x: 40, y: yy }, { x: 540, y: yy }, "rgba(220,228,255,.75)", 1.6); ctx.restore();
        K.t(ctx, (1012 + i * 4) + " hPa", 546, yy + 4, { s: 10, c: KC.mute });
      }
      /* 바람을 따라 흐르는 공기 */
      var vs = clamp(V, 0, 60) * 4;
      for (i = -2; i <= 1; i++) for (var k = 0; k < 5; k++) {
        var xx = 40 + ((geT * vs + k * 100 + (i + 2) * 37) % 500);
        K.glow(ctx, xx, yc + (i + .5) * sp, 1.6, "rgba(130,255,210,.85)", 3);
      }
      K.pill(ctx, "기압이 낮은 쪽 (북쪽)", 16, 62, { s: 11.5, c: KC.blue });
      K.pill(ctx, "기압이 높은 쪽 (남쪽)", 16, 400, { s: 11.5, c: KC.red });
      K.t(ctx, "등압선 간격 " + dkm.toLocaleString() + " km", LW - 16, 62, { s: 10.5, a: "right", c: KC.mute });
      /* 정지 상태에서 놓은 공기의 자취 */
      if (frac > 0) {
        var R = V / f, span = 9.42 * R, sc = 480 / span, N = Math.max(2, Math.round(240 * frac));
        ctx.save(); ctx.shadowColor = KC.yellow; ctx.shadowBlur = 8; ctx.strokeStyle = KC.yellow; ctx.lineWidth = 2.5; ctx.beginPath();
        for (k = 0; k <= N; k++) {
          var th = (k / 240) * 1.5 * 2 * Math.PI, xm = R * (th - Math.sin(th)), ym = R * (1 - Math.cos(th));
          var px = 50 + xm * sc, py = yc + 2 * sp - ym * sc;
          if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke(); ctx.restore();
        var thn = (N / 240) * 1.5 * 2 * Math.PI;
        K.glow(ctx, 50 + R * (thn - Math.sin(thn)) * sc, yc + 2 * sp - R * (1 - Math.cos(thn)) * sc, 5, "rgba(255,211,107,.98)", 3.4);
        K.pill(ctx, "정지 상태에서 놓은 공기의 자취", 16, 92, { s: 11, c: KC.yellow });
      }
      /* 힘 */
      var cx = 300, cy = yc;
      ctx.save(); ctx.shadowColor = KC.red; ctx.shadowBlur = 10; K.arrow(ctx, { x: cx, y: cy }, { x: cx, y: cy - 72 }, KC.red, 5, 14); ctx.restore();
      ctx.save(); ctx.shadowColor = KC.violet; ctx.shadowBlur = 10; K.arrow(ctx, { x: cx, y: cy }, { x: cx, y: cy + 72 }, KC.violet, 5, 14); ctx.restore();
      ctx.save(); ctx.shadowColor = KC.green; ctx.shadowBlur = 12; K.arrow(ctx, { x: cx - 120, y: cy }, { x: cx + 120, y: cy }, KC.green, 6, 16); ctx.restore();
      K.planet(ctx, cx, cy, 6, "#e8ecff", "#5a6aa0");
      K.pill(ctx, "기압 경도력", cx + 10, cy - 52, { s: 11.5, c: KC.red });
      K.pill(ctx, "전향력", cx + 10, cy + 62, { s: 11.5, c: KC.violet });
      K.pill(ctx, "지균풍", cx + 128, cy + 5, { s: 13, c: KC.green });
      K.t(ctx, "북반구에서 지균풍은 기압이 낮은 쪽을 ‘왼쪽’에 두고 붑니다", LW - 16, 428 - 4, { s: 11, a: "right", c: KC.mute });
      /* ── 오른쪽: 수치 ── */
      var RX = LW + 8;
      K.stage(ctx, RX, 0, W - RX, H, "lab", { seed: 105, title: "지균풍 계산" });
      K.t(ctx, "전향 인자 f = 2Ω sin φ", RX + 16, 76, { s: 11.5, w: "800", c: KC.mute });
      K.t(ctx, "= " + (f * 1e5).toFixed(2) + " ×10⁻⁵ /s", RX + 16, 98, { s: 13, w: "800", c: KC.violet });
      K.t(ctx, "기압 경도력 (단위 질량당)", RX + 16, 132, { s: 11.5, w: "800", c: KC.mute });
      K.t(ctx, "= " + (P * 1e4).toFixed(2) + " ×10⁻⁴ m/s²", RX + 16, 154, { s: 13, w: "800", c: KC.red });
      K.t(ctx, "지균풍 속도 V = 기압 경도력 ÷ f", RX + 16, 192, { s: 11.5, w: "800", c: KC.mute });
      K.pill(ctx, V.toFixed(1) + " m/s", RX + 22, 240, { s: 28, c: KC.green });
      K.t(ctx, "= 시속 " + (V * 3.6).toFixed(0) + " km", RX + 16, 280, { s: 13, w: "800", c: KC.ink });
      K.t(ctx, V > 50 ? "※ 저위도에서는 전향력이 너무 작아" : "등압선 간격이 좁을수록,", RX + 16, 318, { s: 11, c: V > 50 ? KC.orange : KC.mute });
      K.t(ctx, V > 50 ? "   지균풍 근사가 성립하지 않습니다" : "위도가 낮을수록 바람이 빨라집니다", RX + 16, 338, { s: 11, c: V > 50 ? KC.orange : KC.mute });
    }
    K.animate(canvas, function (dt) { if (geA.on && !running) { geT += dt / 1000; paint(); } });
    playWire("d-geo-play", geA, "바람 멈추기", "바람 보기");
    function draw() {
      var f = fOf(lat), P = pgfOf(dkm), V = vg();
      paint();
      $("d-geo-info").innerHTML =
        "위도 <b>" + lat + "°</b> · 등압선 간격 <b>" + dkm.toLocaleString() + " km</b> (기압 차 4 hPa) → 지균풍 <b>" + V.toFixed(1) + " m/s</b> (시속 " + (V * 3.6).toFixed(0) + " km).<br>" +
        "정지해 있던 공기는 먼저 기압 경도력을 받아 저기압 쪽으로 움직이기 시작합니다. 움직이는 순간 전향력이 오른쪽(북반구)으로 휘게 하고, 빨라질수록 전향력도 커집니다. " +
        "결국 두 힘의 크기가 같아지고 방향이 정반대가 되어 <b>등압선과 나란한</b> 바람이 남습니다." +
        (V > 50 ? "<br><b>주의</b> — 지금 값처럼 위도가 낮고 등압선이 매우 촘촘하면 전향력이 너무 작아 실제 대기에서는 지균풍 근사가 성립하지 않습니다." : "");

      var ch = false;
      if (!got.a && V >= 30) { got.a = true; ch = true; }
      if (!got.b && V <= 5) { got.b = true; ch = true; }
      if (ch) { window.sthState("dGe", got); mission(); }
    }
    function mission() {
      if (got.a) done("mD2a");
      if (got.b) done("mD2b");
      if (window.sthState("dPick1")) done("mD2c");
      if (got.a && got.b && window.sthState("dPick1")) {
        window.sthMission("mD2", true, "<span class='m-tag'>미션 완료</span>같은 기압 차 4 hPa 라도 등압선 간격이 <b>100 km</b>면 30 m/s가 넘고, <b>700 km</b>에 고위도면 4 m/s도 되지 않습니다. 일기도에서 등압선이 촘촘한 곳이 바람이 센 곳입니다.");
        ep.clear(1);
      }
    }
    canvas._redraw = draw;
    $("d-geo-d").addEventListener("input", function (e) { dkm = +e.target.value; $("d-geo-d-val").textContent = dkm.toLocaleString(); draw(); });
    $("d-geo-lat").addEventListener("input", function (e) { lat = +e.target.value; $("d-geo-lat-val").textContent = lat + "°"; draw(); });
    $("d-geo-run").addEventListener("click", function () {
      if (running) return;
      running = true;
      var btn = $("d-geo-run"); btn.disabled = true;
      var step = 0;
      (function tick() {
        step++; frac = step / 48; draw();
        if (step < 48) window.setTimeout(tick, 30);
        else { running = false; btn.disabled = false; btn.textContent = "▶ 한 번 더 놓아 보기"; window.sthState("dGeRun", 1); }
      })();
    });
    window.sthPick({
      mount: "d-pick1",
      q: "북반구를 나타낸 회전원판(위에서 볼 때 시계 반대 방향으로 회전) 중심에서 가장자리를 향해 공을 굴렸습니다. 원판 위에서 볼 때 공은 어떻게 보일까요?",
      options: [
        "진행 방향의 오른쪽으로 휘어 보인다",
        "진행 방향의 왼쪽으로 휘어 보인다",
        "휘지 않고 똑바로 나아간다",
        "중심 쪽으로 되돌아온다"
      ],
      answer: 0,
      why: [
        "맞습니다. 원판 밖에서 보면 공은 직선으로 가지만, 함께 도는 원판 위에서 보면 오른쪽으로 휜 것처럼 보입니다. 북반구의 전향력이 바로 이것이고, 남반구(시계 방향 회전)에서는 왼쪽입니다.",
        "그것은 남반구를 나타낸 원판(시계 방향 회전)에서 보이는 모습입니다.",
        "회전하지 않는 원판 위에서라면 맞습니다. 원판이 돌기 때문에 관찰자의 기준이 함께 돌아갑니다.",
        "전향력은 운동 방향에 수직으로만 작용해 방향만 바꿉니다. 속력을 줄이거나 되돌리지는 않습니다."
      ],
      onDone: function () { window.sthState("dPick1", 1); mission(); }
    });
    draw(); mission();
    if (window.sthState("dGeRun")) $("d-geo-run").textContent = "▶ 한 번 더 놓아 보기";
    if (ep.cleared(1)) window.sthMission("mD2", true);
  })();

  /* ---------------- 장면 3 — 경도풍 ---------------- */
  (function () {
    var canvas = $("d-grad"); if (!canvas) return;
    var ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var Rkm = 1000, kind = "low";
    var got = window.sthState("dGr") || { a: false, b: false, c: false };
    var F = fOf(45), PG = pgfOf(400), VG = PG / F;

    function grad(rkm, kd) {
      var R = rkm * 1000;
      if (kd === "low") return (-F * R + Math.sqrt(F * F * R * R + 4 * R * PG)) / 2;
      var disc = F * F * R * R - 4 * R * PG;
      if (disc < 0) return null;
      return (F * R - Math.sqrt(disc)) / 2;
    }

    var grA = { on: !REDUCE }, grT = 0;
    function paint() {
      var V = grad(Rkm, kind), low = kind === "low", i;
      ctx.clearRect(0, 0, W, H);
      var LW = 516;
      K.stage(ctx, 0, 0, LW, H, "night", { seed: 107, title: "휘어진 등압선 위의 바람 — 원심력이 더해진다" });
      var cx = 230, cy = 222, rr = clamp(Rkm / 1500, 0.25, 1) * 110, mc = low ? KC.blue : KC.red;
      var cg = ctx.createRadialGradient(cx, cy, 4, cx, cy, rr * 1.9 + 18);
      cg.addColorStop(0, low ? "rgba(127,211,255,.35)" : "rgba(255,107,129,.35)"); cg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(cx, cy, rr * 1.9 + 18, 0, 6.2832); ctx.fill();
      for (i = 1; i <= 3; i++) { ctx.strokeStyle = "rgba(220,228,255,.6)"; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(cx, cy, rr * i * 0.55 + 18, 0, 6.2832); ctx.stroke(); }
      K.pill(ctx, low ? "L" : "H", cx, cy + 11, { a: "center", s: 26, c: mc });
      K.pill(ctx, low ? "저기압 (중심 기압 낮음)" : "고기압 (중심 기압 높음)", cx, 66, { a: "center", s: 12, c: mc });
      /* 등압선을 따라 도는 공기: 북반구 저기압은 반시계, 고기압은 시계 방향 */
      var spd = V === null ? 0 : V * .09, dirn = low ? -1 : 1;
      if (V !== null) for (var ring = 1; ring <= 3; ring++) for (var k = 0; k < 6; k++) {
        var ra = rr * ring * 0.55 + 18, ang = dirn * grT * spd * 60 / ra + k * Math.PI / 3 + ring;
        K.glow(ctx, cx + ra * Math.cos(ang), cy + ra * Math.sin(ang), 1.6, "rgba(130,255,210,.9)", 3);
      }
      /* 힘 (오른쪽 지점) */
      var px = Math.min(cx + rr * 1.65 + 18, 420), py = cy;
      function fa(dx, dy, col, w) { ctx.save(); ctx.shadowColor = col; ctx.shadowBlur = 8; K.arrow(ctx, { x: px, y: py }, { x: px + dx, y: py + dy }, col, w, 11); ctx.restore(); }
      if (low) {
        fa(-62, 0, KC.red, 4); K.pill(ctx, "기압 경도력", px - 66, py - 14, { a: "right", s: 10.5, c: KC.red });
        fa(44, 0, KC.violet, 4); K.pill(ctx, "전향력", px + 48, py - 14, { s: 10.5, c: KC.violet, box: [0, LW] });
        fa(30, 28, KC.yellow, 3); K.pill(ctx, "원심력", px + 34, py + 44, { s: 10.5, c: KC.yellow, box: [0, LW] });
        ctx.save(); ctx.shadowColor = KC.green; ctx.shadowBlur = 10; K.arrow(ctx, { x: px, y: py - 20 }, { x: px, y: py - 80 }, KC.green, 5, 13); ctx.restore();
        K.pill(ctx, "바람", px + 10, py - 70, { s: 12, c: KC.green, box: [0, LW] });
      } else {
        fa(62, 0, KC.red, 4); K.pill(ctx, "기압 경도력", px + 66, py - 14, { s: 10.5, c: KC.red, box: [0, LW] });
        fa(-44, 0, KC.violet, 4); K.pill(ctx, "전향력", px - 48, py - 14, { a: "right", s: 10.5, c: KC.violet });
        fa(30, 28, KC.yellow, 3); K.pill(ctx, "원심력", px + 34, py + 44, { s: 10.5, c: KC.yellow, box: [0, LW] });
        ctx.save(); ctx.shadowColor = KC.green; ctx.shadowBlur = 10; K.arrow(ctx, { x: px, y: py + 20 }, { x: px, y: py + 80 }, KC.green, 5, 13); ctx.restore();
        K.pill(ctx, "바람", px + 10, py + 84, { s: 12, c: KC.green, box: [0, LW] });
      }
      K.planet(ctx, px, py, 5, "#e8ecff", "#5a6aa0");
      K.pill(ctx, "곡률 반지름 " + Rkm.toLocaleString() + " km", cx, 384, { a: "center", s: 11.5, c: KC.ink });
      /* ── 오른쪽: 풍속 비교 ── */
      var RX = LW + 8, bx = RX + 16, bw = 250;
      K.stage(ctx, RX, 0, W - RX, H, "lab", { seed: 109, title: "같은 기압 경도력에서의 풍속" });
      function bar(y, label, val0, col) {
        K.t(ctx, label, bx, y - 8, { s: 11, w: "800", c: KC.mute });
        ctx.fillStyle = "rgba(255,255,255,.07)"; ctx.beginPath(); ctx.roundRect(bx, y, bw, 18, 9); ctx.fill();
        if (val0 !== null) { ctx.save(); ctx.shadowColor = col; ctx.shadowBlur = 8; ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(bx, y, Math.max(8, clamp(val0 / 14, 0, 1) * bw), 18, 9); ctx.fill(); ctx.restore(); }
        K.t(ctx, val0 === null ? "존재할 수 없음" : val0.toFixed(2) + " m/s", bx, y + 36, { s: 12, w: "800", c: val0 === null ? KC.red : KC.ink });
      }
      bar(84, "지균풍 (등압선이 곧을 때)", VG, "#c6cff5");
      bar(160, "저기압 주위 경도풍", grad(Rkm, "low"), KC.blue);
      bar(236, "고기압 주위 경도풍", grad(Rkm, "high"), KC.red);
      K.t(ctx, "고기압 주위는 곡률 반지름이 약 313 km보다", bx, 316, { s: 10.5, c: KC.mute });
      K.t(ctx, "작으면 힘의 평형 자체가 성립하지 않습니다.", bx, 336, { s: 10.5, c: KC.mute });
      K.t(ctx, "→ 좁고 강한 고기압은 존재할 수 없습니다.", bx, 360, { s: 11, w: "800", c: KC.red });
    }
    K.animate(canvas, function (dt) { if (grA.on) { grT += dt / 1000; paint(); } });
    playWire("d-grad-play", grA, "바람 멈추기", "바람 보기");
    function draw() {
      var V = grad(Rkm, kind);
      var low = kind === "low";
      paint();
      $("d-grad-info").innerHTML =
        "곡률 반지름 <b>" + Rkm.toLocaleString() + " km</b> · " + (low ? "저기압" : "고기압") + " 주위 → " +
        (V === null ? "<b>경도풍이 존재할 수 없습니다.</b>" : "풍속 <b>" + V.toFixed(2) + " m/s</b> (지균풍 " + VG.toFixed(2) + " m/s)") + "<br>" +
        "원을 도는 공기에는 바깥쪽으로 <b>원심력</b>이 작용합니다. <b>저기압</b> 주위에서는 기압 경도력이 안쪽, 전향력과 원심력이 바깥쪽이므로 전향력이 지균풍 때보다 작아도 되고, 따라서 풍속이 <b>지균풍보다 느립니다</b>. " +
        "<b>고기압</b> 주위에서는 기압 경도력과 원심력이 함께 바깥쪽이라 전향력이 더 커야 하고, 따라서 풍속이 <b>지균풍보다 빠릅니다</b>." +
        (V === null ? "<br>고기압 주위에서 곡률 반지름이 너무 작으면 전향력이 아무리 커져도 두 힘을 감당할 수 없습니다. 실제 일기도에서 고기압의 등압선이 저기압보다 늘 완만한 까닭입니다." : "");

      var ch = false;
      var vh = grad(Rkm, "high"), vl = grad(Rkm, "low");
      if (!got.a && kind === "high" && vh !== null && vh >= VG + 0.8) { got.a = true; ch = true; }
      if (!got.b && kind === "low" && vl !== null && vl <= VG - 0.8) { got.b = true; ch = true; }
      if (!got.c && kind === "high" && vh === null) { got.c = true; ch = true; }
      if (ch) { window.sthState("dGr", got); mission(); }
    }
    function mission() {
      if (got.a) done("mD3a");
      if (got.b) done("mD3b");
      if (got.c) done("mD3c");
      if (got.a && got.b && got.c) {
        window.sthMission("mD3", true, "<span class='m-tag'>미션 완료</span>같은 기압 경도력이라도 <b>고기압 주위가 더 빠르고 저기압 주위가 더 느립니다</b>. 게다가 고기압 주위에서는 곡률 반지름이 약 313 km보다 작으면 평형 자체가 없어서, 좁고 강한 고기압은 만들어질 수 없습니다.");
        ep.clear(2);
      }
    }
    canvas._redraw = draw;
    $("d-grad-r").addEventListener("input", function (e) { Rkm = +e.target.value; $("d-grad-r-val").textContent = Rkm.toLocaleString(); draw(); });
    seg("d-grad-k", function (b) { kind = b.getAttribute("data-k"); draw(); });
    draw(); mission();
    if (ep.cleared(2)) window.sthMission("mD3", true);
  })();

  /* ---------------- 장면 4 — 지상풍 ---------------- */
  (function () {
    var canvas = $("d-sfc"); if (!canvas) return;
    var ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var k6 = 30;
    var got = window.sthState("dSf") || { a: false, b: false };
    var F = fOf(45), PG = pgfOf(400);

    function calc() {
      var k = k6 * 1e-6;
      return { ang: Math.atan2(k, F) * 180 / Math.PI, V: PG / Math.sqrt(F * F + k * k) };
    }

    var sfA = { on: !REDUCE }, sfT = 0;
    function paint() {
      var c = calc(), i;
      ctx.clearRect(0, 0, W, H);
      var LW = 572;
      K.stage(ctx, 0, 0, LW, H, "night", { seed: 111, title: "지표 가까이의 바람 — 마찰력이 더해지면" });
      var yc = 216;
      var lo = ctx.createLinearGradient(0, 60, 0, 380); lo.addColorStop(0, "rgba(127,211,255,.18)"); lo.addColorStop(.5, "rgba(0,0,0,0)"); lo.addColorStop(1, "rgba(255,107,129,.16)");
      ctx.fillStyle = lo; ctx.fillRect(14, 60, LW - 28, 320);
      for (i = -2; i <= 2; i++) { var yy = yc + i * 62; K.line(ctx, { x: 30, y: yy }, { x: LW - 30, y: yy }, "rgba(220,228,255,.7)", 1.6); }
      K.pill(ctx, "기압이 낮은 쪽", 16, 62, { s: 11.5, c: KC.blue });
      K.pill(ctx, "기압이 높은 쪽", 16, 392, { s: 11.5, c: KC.red });
      var cx = 300, cy = yc, ar = c.ang * Math.PI / 180, dx = Math.cos(ar), dy = -Math.sin(ar);
      /* 바람을 따라 흐르는 공기(등압선을 비스듬히 가로질러 저기압 쪽으로) */
      var vs = c.V * 9;
      for (i = 0; i < 14; i++) {
        var base = -260 + ((sfT * vs + i * 40) % 520), off = ((i * 53) % 220) - 110;
        var qx = cx + base * dx + off * Math.sin(ar), qy = cy + base * dy + off * Math.cos(ar);
        if (qx > 24 && qx < LW - 24 && qy > 76 && qy < 360) K.glow(ctx, qx, qy, 1.6, "rgba(130,255,210,.85)", 3);
      }
      ctx.save(); ctx.shadowColor = KC.green; ctx.shadowBlur = 12;
      K.arrow(ctx, { x: cx - 130 * dx, y: cy - 130 * dy }, { x: cx + 130 * dx, y: cy + 130 * dy }, KC.green, 6, 16); ctx.restore();
      K.pill(ctx, "지상풍", cx + 140 * dx, cy + 140 * dy - 10, { a: "center", s: 13, c: KC.green, box: [0, LW] });
      function fa(ex, ey, col) { ctx.save(); ctx.shadowColor = col; ctx.shadowBlur = 8; K.arrow(ctx, { x: cx, y: cy }, { x: ex, y: ey }, col, 4, 12); ctx.restore(); }
      fa(cx, cy - 66, KC.red); K.pill(ctx, "기압 경도력", cx + 10, cy - 50, { s: 10.5, c: KC.red });
      fa(cx + 66 * Math.sin(ar), cy + 66 * Math.cos(ar), KC.violet); K.pill(ctx, "전향력", cx + 74 * Math.sin(ar) + 8, cy + 74 * Math.cos(ar) + 4, { s: 10.5, c: KC.violet });
      fa(cx - 70 * dx, cy - 70 * dy, KC.yellow); K.pill(ctx, "마찰력", cx - 84 * dx, cy - 84 * dy + 20, { a: "center", s: 10.5, c: KC.yellow });
      K.wedge(ctx, cx, cy, -ar, 0, 44, "rgba(127,211,255,.25)", KC.blue);
      K.pill(ctx, c.ang.toFixed(1) + "°", cx + 56, cy + 22, { s: 12, c: KC.blue });
      K.planet(ctx, cx, cy, 5, "#e8ecff", "#5a6aa0");
      /* ── 오른쪽: 값 ── */
      var RX = LW + 8;
      K.stage(ctx, RX, 0, W - RX, H, "lab", { seed: 113, title: "바람의 각과 빠르기" });
      K.t(ctx, "등압선과 이루는 각", RX + 16, 78, { s: 11.5, w: "800", c: KC.mute });
      K.pill(ctx, c.ang.toFixed(1) + "°", RX + 22, 124, { s: 28, c: KC.blue });
      K.t(ctx, "풍속", RX + 16, 166, { s: 11.5, w: "800", c: KC.mute });
      K.pill(ctx, c.V.toFixed(2) + " m/s", RX + 22, 204, { s: 20, c: KC.green });
      K.t(ctx, "(마찰이 없을 때 8.08 m/s)", RX + 16, 234, { s: 11, c: KC.mute });
      K.pill(ctx, k6 === 0 ? "마찰 없음 — 상공의 지균풍" : k6 < 40 ? "바다 위처럼 매끄러운 지표" : k6 < 90 ? "평지·논밭 정도의 지표" : "도시·산지처럼 거친 지표", RX + 22, 272, { s: 12, c: KC.yellow });
      K.t(ctx, "마찰이 커지면 바람이 느려지고,", RX + 16, 312, { s: 11, c: KC.mute });
      K.t(ctx, "느려지면 전향력도 작아져", RX + 16, 332, { s: 11, c: KC.mute });
      K.t(ctx, "기압 경도력 쪽으로 더 끌려갑니다.", RX + 16, 352, { s: 11, c: KC.mute });
    }
    K.animate(canvas, function (dt) { if (sfA.on) { sfT += dt / 1000; paint(); } });
    playWire("d-sfc-play", sfA, "바람 멈추기", "바람 보기");
    function draw() {
      var c = calc();
      paint();
      $("d-sfc-info").innerHTML =
        "마찰 세기 <b>" + k6 + " ×10⁻⁶/s</b> → 풍속 <b>" + c.V.toFixed(2) + " m/s</b>, 등압선과 이루는 각 <b>" + c.ang.toFixed(1) + "°</b>.<br>" +
        "마찰력은 늘 <b>바람의 반대 방향</b>으로 작용합니다. 바람이 느려지면 전향력(속력에 비례)도 함께 작아져, 기압 경도력·전향력·마찰력 세 힘이 평형을 이루는 방향은 <b>등압선을 비스듬히 가로질러 저기압 쪽</b>이 됩니다. " +
        "실제로 바다 위에서는 약 15~20°, 육지에서는 약 30~45°로 관측됩니다.<br>" +
        "그래서 북반구 지상 저기압에서는 바람이 반시계 방향으로 <b>모여들고(수렴)</b>, 고기압에서는 시계 방향으로 <b>불어 나갑니다(발산)</b>.";

      var ch = false;
      if (!got.a && c.ang <= 6) { got.a = true; ch = true; }
      if (!got.b && c.ang >= 30) { got.b = true; ch = true; }
      if (ch) { window.sthState("dSf", got); mission(); }
    }
    function mission() {
      if (got.a) done("mD4a");
      if (got.b) done("mD4b");
      if (window.sthState("dPick2")) done("mD4c");
      if (got.a && got.b && window.sthState("dPick2")) {
        window.sthMission("mD4", true, "<span class='m-tag'>미션 완료</span>마찰이 없으면 바람은 등압선과 나란(<b>지균풍</b>), 마찰이 커질수록 등압선을 <b>비스듬히 가로질러</b> 저기압 쪽으로 붑니다(<b>지상풍</b>). 그 결과 저기압에는 바람이 모여들어 상승 기류가, 고기압에서는 불어 나가 하강 기류가 생깁니다.");
        ep.clear(3);
      }
    }
    canvas._redraw = draw;
    $("d-sfc-k").addEventListener("input", function (e) { k6 = +e.target.value; $("d-sfc-k-val").textContent = k6; draw(); });
    window.sthPick({
      mount: "d-pick2",
      q: "북반구 지상의 저기압과 고기압에서, 바람의 모습과 그 결과로 생기는 연직 운동을 옳게 짝지은 것은?",
      options: [
        "저기압 — 반시계 방향으로 모여들어 상승 기류 / 고기압 — 시계 방향으로 불어 나가며 하강 기류",
        "저기압 — 시계 방향으로 모여들어 상승 기류 / 고기압 — 반시계 방향으로 불어 나가며 하강 기류",
        "저기압 — 반시계 방향으로 불어 나가며 하강 기류 / 고기압 — 시계 방향으로 모여들어 상승 기류",
        "저기압과 고기압 모두 바람이 등압선과 나란히 불어 연직 운동이 생기지 않는다"
      ],
      answer: 0,
      why: [
        "맞습니다. 마찰 때문에 바람이 등압선을 가로질러 저기압 쪽으로 불어, 저기압에서는 수렴 → 상승 → 구름과 강수, 고기압에서는 발산 → 하강 → 맑은 날씨가 됩니다.",
        "회전 방향이 반대입니다. 북반구에서 전향력은 오른쪽으로 작용하므로 저기압 주위는 반시계 방향입니다.",
        "바람은 기압이 높은 쪽에서 낮은 쪽으로 향합니다. 모이고 흩어지는 방향이 반대입니다.",
        "마찰이 없는 상공에서는 그렇지만, 지표 부근에서는 마찰 때문에 반드시 각이 생깁니다."
      ],
      onDone: function () { window.sthState("dPick2", 1); mission(); }
    });
    draw(); mission();
    if (ep.cleared(3)) window.sthMission("mD4", true);
  })();

  /* ---------------- 장면 5 — 행성파 ---------------- */
  (function () {
    var canvas = $("d-wave"); if (!canvas) return;
    var ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var kw = 4, amp = 8;
    var got = window.sthState("dWv") || { a: false, b: false, c: false };

    function latAt(lon) { return 45 + amp * Math.sin(kw * lon * Math.PI / 180); }
    function wl() { return 40000 * Math.cos(45 * Math.PI / 180) / kw; }

    var wvA = { on: !REDUCE }, wvT = 0;
    function paint() {
      var X0 = 70, X1 = 870, YT = 86, YB = 380, l, n;
      function xOfLon(lo) { return X0 + lo / 360 * (X1 - X0); }
      function yOfLat(la) { return YB - (la - 15) / 60 * (YB - YT); }
      ctx.clearRect(0, 0, W, H);
      K.stage(ctx, 0, 0, W, H, "night", { seed: 115, title: "상층 일기도 — 편서풍이 남북으로 굽이친다 (행성파)" });
      K.pill(ctx, "파수 " + kw + " · 진폭 " + amp + "° · 파장 약 " + Math.round(wl()).toLocaleString() + " km (위도 45° 기준)", 16, 60, { s: 11.5, c: KC.green });
      K.pill(ctx, "최남단 " + (45 - amp) + "°N · 최북단 " + (45 + amp) + "°N", W - 16, 60, { a: "right", s: 11.5, c: KC.blue });
      /* 따뜻한 남쪽과 찬 북쪽 */
      var wg = ctx.createLinearGradient(0, YT, 0, YB); wg.addColorStop(0, "rgba(255,150,90,.10)"); wg.addColorStop(1, "rgba(255,150,90,.28)");
      ctx.fillStyle = wg; ctx.fillRect(X0, YT, X1 - X0, YB - YT);
      ctx.beginPath(); ctx.moveTo(X0, YT);
      for (l = 0; l <= 360; l += 2) ctx.lineTo(xOfLon(l), yOfLat(latAt(l)));
      ctx.lineTo(X1, YT); ctx.closePath();
      var cg = ctx.createLinearGradient(0, YT, 0, yOfLat(45 - amp)); cg.addColorStop(0, "rgba(120,190,255,.55)"); cg.addColorStop(1, "rgba(120,190,255,.25)");
      ctx.fillStyle = cg; ctx.fill();
      /* 격자 */
      [30, 40, 50, 60, 70].forEach(function (la) {
        K.line(ctx, { x: X0, y: yOfLat(la) }, { x: X1, y: yOfLat(la) }, "rgba(220,228,255,.18)", 1, [4, 4]);
        K.t(ctx, la + "°N", X0 - 6, yOfLat(la) + 4, { s: 10, a: "right", c: KC.mute });
      });
      [0, 90, 180, 270, 360].forEach(function (lo) { K.t(ctx, lo + "°", xOfLon(lo), YB + 16, { s: 10, a: "center", c: KC.mute }); });
      K.t(ctx, "경도 →", X1, YB + 30, { s: 11, a: "right", c: KC.mute });
      /* 제트 기류 */
      ctx.save(); ctx.shadowColor = "#bff6ff"; ctx.shadowBlur = 14; ctx.strokeStyle = "#dffbff"; ctx.lineWidth = 3.5; ctx.beginPath();
      for (l = 0; l <= 360; l += 2) { if (l === 0) ctx.moveTo(xOfLon(l), yOfLat(latAt(l))); else ctx.lineTo(xOfLon(l), yOfLat(latAt(l))); }
      ctx.stroke(); ctx.restore();
      for (n = 0; n < 24; n++) {
        var lo2 = (wvT * 14 + n * 15) % 360;
        K.glow(ctx, xOfLon(lo2), yOfLat(latAt(lo2)), 1.8, "rgba(255,255,255,.95)", 3);
      }
      /* 골·마루와 발산·저기압 */
      for (n = 0; n < kw; n++) {
        var lonT = (270 / kw) + n * (360 / kw), lonR = (90 / kw) + n * (360 / kw);
        if (lonT <= 360) {
          K.pill(ctx, "기압골", xOfLon(lonT), yOfLat(45 - amp) + 24, { a: "center", s: 10.5, c: KC.blue });
          var xd = xOfLon(Math.min(lonT + 45 / kw, 360));
          if (amp >= 4) {
            K.t(ctx, "D", xd, yOfLat(45) - 4, { s: 15, w: "900", a: "center", c: KC.orange });
            K.glow(ctx, xd, YB - 20, 5, "rgba(255,107,129,.9)", 3);
            K.t(ctx, "L", xd, YB - 30, { s: 15, w: "900", a: "center", c: KC.red });
          }
        }
        if (lonR <= 360) K.pill(ctx, "기압 마루", xOfLon(lonR), yOfLat(45 + amp) - 12, { a: "center", s: 10.5, c: KC.orange });
      }
      /* 한반도 */
      var xk = xOfLon(127.5);
      K.line(ctx, { x: xk, y: YT }, { x: xk, y: YB }, KC.violet, 2, [5, 4]);
      K.glow(ctx, xk, yOfLat(latAt(127.5)), 5, "rgba(182,156,255,.98)", 3.4);
      K.pill(ctx, "우리나라 (동경 127.5°)", clamp(xk, 140, 760), YB + 32, { a: "center", s: 11.5, c: KC.violet });
      K.t(ctx, "D = 상층 발산 · L = 그 아래 발달하는 지상 저기압", 16, H - 6, { s: 10.5, w: "800", c: KC.red });
      K.t(ctx, "파란 쪽 = 북극의 찬 공기", W - 16, H - 6, { s: 10.5, w: "800", a: "right", c: KC.blue });
    }
    K.animate(canvas, function (dt) { if (wvA.on) { wvT += dt / 1000; paint(); } });
    playWire("d-wave-play", wvA, "제트 기류 멈추기", "제트 기류 보기");
    function draw() {
      paint();
      $("d-wave-info").innerHTML =
        "파수 <b>" + kw + "</b> · 진폭 <b>" + amp + "°</b> → 파장 약 <b>" + Math.round(wl()).toLocaleString() + " km</b>, 찬 공기가 내려오는 최남단 위도 <b>" + (45 - amp) + "°N</b>.<br>" +
        "행성파(로스비파)는 <b>전향력이 위도에 따라 달라지기 때문에</b> 생기는 지구 규모의 파동입니다. 북쪽으로 밀린 공기는 전향력이 커져 남쪽으로 되돌아오고, 남쪽으로 내려간 공기는 전향력이 작아져 다시 북쪽으로 향하면서 물결이 이어집니다.<br>" +
        (amp <= 3 ? "진폭이 작아 흐름이 거의 동서 방향입니다. 찬 공기가 북극 쪽에 갇혀 있어 중위도는 비교적 포근합니다."
          : amp >= 15 ? "진폭이 매우 큽니다. 기압골을 따라 북극의 찬 공기가 중위도 깊숙이 흘러내려 <b>한파</b>가 되고, 같은 위도의 다른 경도에서는 기압 마루를 따라 남쪽의 따뜻한 공기가 올라가 오히려 포근해집니다."
          : "진폭이 커질수록 남북 방향의 공기 교환이 활발해집니다. 파수가 적을수록 파장이 길고 사행의 규모가 큽니다.") +
        "<br>기압골 <b>동쪽</b>에서는 상층 바람이 퍼져 나가(<b>발산</b>) 그 아래 지상에 저기압이 발달합니다.";

      var ch = false;
      if (!got.a && amp <= 3) { got.a = true; ch = true; }
      if (!got.b && 45 - amp <= 30) { got.b = true; ch = true; }
      if (!got.c && wl() >= 10000) { got.c = true; ch = true; }
      if (ch) { window.sthState("dWv", got); mission(); }
    }
    function mission() {
      if (got.a) done("mD5a");
      if (got.b) done("mD5b");
      if (got.c) done("mD5c");
      if (got.a && got.b && got.c) {
        window.sthState("dWvSet", "파수 " + kw + " · 진폭 " + amp + "°");
        window.sthMission("mD5", true, "<span class='m-tag'>미션 완료</span>진폭이 <b>15° 이상</b>이면 북극의 찬 공기가 북위 30°까지 내려옵니다. 파수가 <b>1~2</b>면 파장이 1만 km를 넘어 사행이 매우 커지고, 파수가 크면 물결이 잘게 나뉘어 남북 교환이 적습니다. 진폭이 작을 때 찬 공기는 북극에 갇힙니다.");
        ep.clear(4);
      }
    }
    canvas._redraw = draw;
    $("d-wave-k").addEventListener("input", function (e) { kw = +e.target.value; $("d-wave-k-val").textContent = kw; draw(); });
    $("d-wave-a").addEventListener("input", function (e) { amp = +e.target.value; $("d-wave-a-val").textContent = amp + "°"; draw(); });
    draw(); mission();
    if (ep.cleared(4)) window.sthMission("mD5", true);
  })();

  /* ---------------- 장면 6 — 순서 맞추기 + 결말 ---------------- */
  var D_STEPS = [
    "상층 편서풍의 사행이 커져 남북으로 깊은 물결이 생긴다",
    "물결의 남쪽으로 처진 부분에 기압골이 만들어진다",
    "기압골 동쪽에서 상층 바람이 퍼져 나가 발산한다",
    "그 아래 공기 기둥에서 공기가 빠져나가 지상 기압이 낮아진다",
    "지상에 저기압이 발달한다",
    "마찰 때문에 지상풍이 등압선을 가로질러 저기압으로 모여든다(수렴)",
    "모여든 공기가 갈 곳이 없어 위로 올라간다(상승 기류)",
    "올라간 공기가 단열 팽창해 식으면서 구름이 생기고 비가 내린다"
  ];

  function revealD() {
    $("d-end").hidden = false;
    var p = window.sthState("pD1") || "";
    $("d-vs").innerHTML = "<b>나의 첫 판단</b> " + (p || "기록 없음") + "<br>" +
      (p.indexOf("㉡") === 0 ? "정확했습니다. 그 ‘굽이침’이 바로 행성파이고, 진폭이 커질수록 한파가 깊어진다는 것까지 확인했습니다."
        : "태양도 온난화도 아니었습니다. 상층 편서풍이 남북으로 크게 굽이치면, 같은 위도라도 기압골 아래는 한파가 되고 기압 마루 아래는 포근해집니다.") +
      "<br><b>내가 만든 한파 조건</b> " + (window.sthState("dWvSet") || "-");
  }
  function finish() {
    window.sthState("r4", "해결 · 편서풍 사행 → 기압골 동쪽 발산 → 지상 저기압 발달까지 추적");
  }
  if (ep.cleared(5)) {
    $("d-order").innerHTML = "<div class='sort order'><div class='slots'>" +
      D_STEPS.map(function (s) { return "<div class='slot filled'>" + s + "</div>"; }).join("") + "</div></div>";
    revealD();
  } else {
    window.sthOrder({
      mount: "d-order",
      steps: D_STEPS,
      onDone: function () { revealD(); ep.clear(5); }
    });
  }

  window.sthWork({
    mount: "wkD", unitLabel: "[지구시스템과학 Ⅱ-2] 이야기 ④ 제트 기류를 읽는 사람",
    items: [
      { id: "w2", label: "바람이 등압선과 나란해지는 과정", hint: "기압 경도력과 전향력이 균형을 이루기까지를 순서대로 쓰세요." },
      { id: "dw2", label: "한파 브리핑 원고", hint: "편서풍 파동의 진폭이 커지면 왜 어떤 지역만 한파가 되는지, 그리고 기압골 동쪽에서 지상 저기압이 발달하는 과정을 ‘발산’이라는 말을 넣어 설명하세요." }
    ]
  });
})();

/* ========================================================================= 05 정리하기 */
window.sthWork({
  mount: "wk", unitLabel: "[지구시스템과학 Ⅱ-2] 강수 과정과 대기의 운동 — 정리",
  recap: [
    { key: "r1", label: "① 달 기지 설계도" },
    { key: "r2", label: "② 산을 넘은 바람" },
    { key: "r3", label: "③ 하늘에 멈춰 선 기구" },
    { key: "r4", label: "④ 제트 기류를 읽는 사람" },
    { key: "rQuiz", label: "수준별 문제" },
    { key: "rLab", label: "응용 실험실" },
    { key: "rInq", label: "교과서 실험" },
    { key: "rReal", label: "실제 자료" }
  ],
  items: [
    { id: "all", label: "네 사건을 꿰는 한 문장", hint: "대기가 골라서 흡수한 에너지, 산을 넘으며 데워진 공기, 저울처럼 균형을 이룬 기압, 지구를 감아 도는 물결. 네 이야기에 공통으로 들어 있는 생각을 ‘에너지’와 ‘균형’이라는 말을 넣어 쓰세요." },
    { id: "w3", label: "아직 헷갈리는 것", hint: "다음 시간에 여기서부터 시작합니다." }
  ]
});

/* ========================================================================= 06 우리 반 */
window.sthShare({
  mount: "share", unit: "esys-2-2", unitLabel: "[지구시스템과학 Ⅱ-2] 강수 과정과 대기의 운동",
  rows: [
    { key: "r1", label: "① 달 기지 설계도" },
    { key: "r2", label: "② 산을 넘은 바람" },
    { key: "r3", label: "③ 하늘에 멈춰 선 기구" },
    { key: "r4", label: "④ 제트 기류를 읽는 사람" },
    { key: "rQuiz", label: "수준별 문제" },
    { key: "rLab", label: "응용 실험실" },
    { key: "rInq", label: "교과서 실험" },
    { key: "rReal", label: "실제 자료" }
  ],
  line: { id: "all", label: "네 사건을 꿰는 한 문장" }
});

})();
