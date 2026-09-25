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
    t.o3 += 200 / (1 + Math.exp((L - 0.300) / 0.012));
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
      paper(ctx, W, H);
      var L = lamOf(sv), T = trans(L), t = tauOf(L);
      text(ctx, "대기의 투과율 — 파장에 따라 이렇게 다르다", 40, 28, { s: 13, w: "800" });
      text(ctx, "왼쪽은 주로 태양 복사(0.1~4 µm), 오른쪽은 주로 지구 복사(4~40 µm)", 40, 50, { s: 11, c: v("--mist") });

      /* 배경 구역 */
      ctx.fillStyle = v("--amber"); ctx.globalAlpha = .10;
      ctx.fillRect(X0, YT, xOf(4) - X0, YB - YT);
      ctx.fillStyle = v("--violet"); ctx.fillRect(xOf(4), YT, X1 - xOf(4), YB - YT);
      ctx.globalAlpha = 1;
      text(ctx, "태양 복사", (X0 + xOf(4)) / 2, YT + 16, { s: 11, w: "800", a: "center", c: v("--amber-700") });
      text(ctx, "지구 복사", (xOf(4) + X1) / 2, YT + 16, { s: 11, w: "800", a: "center", c: v("--violet-700") });

      /* 축 */
      ctx.strokeStyle = v("--line"); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(X0, YT); ctx.lineTo(X0, YB); ctx.lineTo(X1, YB); ctx.stroke();
      [0, 0.5, 1].forEach(function (p) {
        dash(ctx, X0, yOf(p), X1, yOf(p), v("--line"), 1);
        text(ctx, Math.round(p * 100) + "%", X0 - 6, yOf(p) + 4, { s: 10, a: "right", c: v("--mist") });
      });
      [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 40].forEach(function (tk) {
        text(ctx, String(tk), xOf(tk), YB + 20, { s: 10, a: "center", c: v("--mist") });
      });
      text(ctx, "파장 (µm, 로그 눈금)", (X0 + X1) / 2, YB + 42, { s: 11, a: "center", c: v("--mist") });

      /* 곡선 */
      ctx.strokeStyle = v("--teal"); ctx.lineWidth = 2.5; ctx.beginPath();
      for (var s = 0; s <= 260; s++) {
        var ll = lamOf(s), xx = xOf(ll), yy = yOf(trans(ll));
        if (s === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
      }
      ctx.stroke();

      /* 지금 파장 */
      var cx = xOf(L);
      dash(ctx, cx, YT, cx, YB, v("--coral"), 2);
      ctx.fillStyle = v("--coral");
      ctx.beginPath(); ctx.arc(cx, yOf(T), 5.5, 0, Math.PI * 2); ctx.fill();

      /* 큰 숫자 */
      text(ctx, "파장 " + L.toFixed(2) + " µm 의 투과율", 70, 324, { s: 11.5, w: "800", c: v("--mist") });
      text(ctx, (T * 100).toFixed(1) + " %", 70, 368, { s: 28, w: "900", c: T > 0.5 ? v("--teal-700") : v("--coral-700") });
      text(ctx, T > 0.5 ? "거의 그대로 지나갑니다" : (T > 0.1 ? "일부만 지나갑니다" : "대기가 거의 모두 붙잡습니다"), 70, 398, { s: 11.5, w: "800", c: v("--mist") });

      /* 기체별 막대 */
      var rows = [["오존·산소", t.o3, "--violet"], ["수증기", t.h2o, "--brand"], ["이산화 탄소", t.co2, "--coral"], ["그 밖의 기체·산란", t.etc, "--teal"]];
      for (var i = 0; i < rows.length; i++) {
        var yy2 = 334 + i * 22;
        text(ctx, rows[i][0], 460, yy2 + 4, { s: 10.5, a: "right", c: v("--mist") });
        ctx.fillStyle = v("--card-2"); ctx.fillRect(470, yy2 - 9, 300, 13);
        ctx.fillStyle = v(rows[i][2]);
        ctx.fillRect(470, yy2 - 9, clamp(rows[i][1] / 6, 0, 1) * 300, 13);
        text(ctx, rows[i][1] < 0.02 ? "거의 없음" : "흡수 " + rows[i][1].toFixed(2), 860, yy2 + 4, { s: 10.5, w: "800", a: "right", c: v("--mist") });
      }
      text(ctx, "막대 = 이 파장에서 각 기체가 빛을 붙잡는 정도", 470, 314, { s: 10.5, c: v("--mist") });

      $("a-sp-info").innerHTML =
        "파장 <b>" + L.toFixed(2) + " µm</b> — 투과율 <b>" + (T * 100).toFixed(1) + " %</b>. " +
        (L < 0.4 ? "자외선 영역입니다. 성층권의 <b>오존</b>이 파장 0.3 µm보다 짧은 빛을 거의 모두 흡수합니다."
          : L < 0.75 ? "가시광선 영역입니다. 대기를 이루는 기체들은 이 영역을 거의 흡수하지 않아 햇빛이 지표까지 들어옵니다."
          : L < 4 ? "근적외선 영역입니다. <b>수증기</b>가 군데군데 띠 모양으로 흡수합니다."
          : (L >= 8 && L <= 12 && T > 0.5) ? "지구 복사 영역인데도 잘 빠져나갑니다. 여기가 바로 <b>대기의 창</b>입니다."
          : "적외선 영역입니다. <b>수증기와 이산화 탄소</b>가 지구 복사를 대부분 흡수했다가 다시 내보냅니다 — 온실 효과의 정체입니다.");

      var ch = false;
      if (!got.a && L < 0.35 && T <= 0.01) { got.a = true; ch = true; }
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

    function draw() {
      paper(ctx, W, H);
      var tc = teC(), abs = S * (1 - A / 100) / 4;
      text(ctx, "대기가 없는 행성의 온도 — 받는 만큼 내보낼 때", 40, 28, { s: 13, w: "800" });

      /* 행성 */
      var cx = 205, cy = 190, R = 72;
      var col = tc >= 30 ? "--coral" : tc >= -20 ? "--amber" : "--brand";
      ctx.fillStyle = v(col); ctx.globalAlpha = .35;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
      ctx.strokeStyle = v(col); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
      text(ctx, tc.toFixed(1) + " ℃", cx, cy + 8, { s: 22, w: "900", a: "center", c: v(col === "--brand" ? "--brand-700" : col === "--amber" ? "--amber-700" : "--coral-700") });
      for (var i = 0; i < 4; i++) {
        var yy = 120 + i * 45;
        arrow(ctx, 48, yy, cx - R - 8, yy, v("--amber"), 3, 9);
      }
      text(ctx, "들어오는 태양 복사", 48, 104, { s: 11, w: "800", c: v("--amber-700") });
      for (var j = 0; j < 8; j++) {
        var ang = -Math.PI / 2 + j * Math.PI / 4;
        arrow(ctx, cx + (R + 6) * Math.cos(ang), cy + (R + 6) * Math.sin(ang),
          cx + (R + 34) * Math.cos(ang), cy + (R + 34) * Math.sin(ang), v("--violet"), 2.5, 8);
      }
      text(ctx, "행성이 내보내는 복사", cx, cy + R + 56, { s: 11, w: "800", a: "center", c: v("--violet-700") });
      text(ctx, "반사 " + A + " %", cx, 96, { s: 11.5, w: "800", a: "center", c: v("--mist") });

      /* 계산 */
      text(ctx, "T = [ S(1−A) / 4σ ]", 430, 86, { s: 15, w: "800" });
      text(ctx, "1/4", 590, 78, { s: 10, w: "800" });
      text(ctx, "S = " + S.toLocaleString() + " W/m²  ·  A = " + (A / 100).toFixed(2), 430, 116, { s: 12.5, w: "800", c: v("--mist") });
      text(ctx, "흡수하는 에너지 = S(1−A)/4 = " + abs.toFixed(1) + " W/m²", 430, 142, { s: 12, c: v("--mist") });
      text(ctx, tc.toFixed(1) + " ℃", 430, 196, { s: 32, w: "900", c: v("--teal-700") });
      text(ctx, "= " + teK().toFixed(1) + " K", 430, 224, { s: 14, w: "800", c: v("--mist") });

      /* 온도 눈금 */
      var bx = 430, bw = 410, by = 250;
      function xOfT(t) { return bx + clamp((t + 120) / 180, 0, 1) * bw; }
      ctx.fillStyle = v("--card-2"); ctx.fillRect(bx, by, bw, 16);
      [-120, -60, 0, 60].forEach(function (t) {
        dash(ctx, xOfT(t), by - 4, xOfT(t), by + 20, v("--line"), 1);
        text(ctx, t + "℃", xOfT(t), by + 34, { s: 10, a: "center", c: v("--mist") });
      });
      ctx.fillStyle = v("--teal"); ctx.fillRect(xOfT(tc) - 3, by - 6, 6, 28);
      text(ctx, "지금", xOfT(tc), by - 12, { s: 10, w: "800", a: "center", c: v("--teal-700") });
      ctx.fillStyle = v("--coral"); ctx.fillRect(xOfT(15) - 2, by, 4, 16);

      text(ctx, "실제 값과 비교하기", 40, 322, { s: 12, w: "800", c: v("--mist") });
      text(ctx, "달   S 1,361 · A 0.12  →  −3.6 ℃   (실제 낮 120 ℃ / 밤 −170 ℃ — 평균만 맞는다)", 40, 348, { s: 11.5, c: v("--mist") });
      text(ctx, "지구  S 1,361 · A 0.30  →  −18.6 ℃   (실제 평균 15 ℃ — 33 ℃가 더 높다)", 40, 370, { s: 11.5, c: v("--ink"), w: "800" });
      text(ctx, "금성  S 2,601 · A 0.77  →  −46.5 ℃   (실제 약 464 ℃ — 온실 효과가 극단적으로 강하다)", 40, 392, { s: 11.5, c: v("--mist") });

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

    function card(y, title, inc, out, diff) {
      var ok = Math.abs(diff) <= 1;
      box(ctx, 30, y, 510, 104, v("--card-2"), ok ? v("--green") : v("--line"), 14);
      text(ctx, title, 44, y + 24, { s: 12.5, w: "800", c: ok ? v("--green-700") : v("--ink") });
      text(ctx, "수입", 44, y + 50, { s: 10.5, w: "800", c: v("--mist") });
      text(ctx, inc, 84, y + 50, { s: 11.5 });
      text(ctx, "지출", 44, y + 72, { s: 10.5, w: "800", c: v("--mist") });
      text(ctx, out, 84, y + 72, { s: 11.5 });
      text(ctx, ok ? "✔ 수입과 지출이 같습니다" : (diff > 0 ? "✗ 지출이 " + diff.toFixed(0) + " 단위 모자랍니다" : "✗ 지출이 " + (-diff).toFixed(0) + " 단위 많습니다"),
        44, y + 94, { s: 11.5, w: "800", c: ok ? v("--green-700") : v("--coral-700") });
    }

    function draw() {
      paper(ctx, W, H);
      text(ctx, "전 지구 평균 열수지 — 태양 복사를 100 단위로", 30, 28, { s: 13, w: "800" });

      var dTop = 100 - (30 + 8 + E);
      var dSfc = (45 + Rr) - (104 + 20 + 9);
      var dAtm = (25 + 96 + 20 + 9) - (E + Rr);

      card(44, "대기권 밖에서 본 수지", "태양 복사 100",
        "반사 30 + 대기의 창 8 + 대기·구름 방출 ①" + E + " = " + (38 + E), dTop);
      card(160, "대기의 수지",
        "태양 25 + 지표 복사 96 + 숨은열 20 + 대류·전도 9 = 150",
        "우주로 ①" + E + " + 지표로 ②" + Rr + " = " + (E + Rr), dAtm);
      card(276, "지표의 수지", "태양 45 + 재복사 ②" + Rr + " = " + (45 + Rr),
        "지표 복사 104 + 숨은열 20 + 대류·전도 9 = 133", dSfc);

      var all = Math.abs(dTop) <= 1 && Math.abs(dSfc) <= 1 && Math.abs(dAtm) <= 1;
      text(ctx, all ? "🎉 세 장부가 모두 맞았습니다 — 지구는 복사 평형 상태입니다"
        : "세 장부가 모두 맞아야 지구의 평균 기온이 일정하게 유지됩니다",
        30, 404, { s: 12.5, w: "900", c: all ? v("--green-700") : v("--mist") });
      text(ctx, "지표가 받는 에너지 45 + " + Rr + " = " + (45 + Rr) + " 단위. 태양 복사만 받을 때(45)의 " + ((45 + Rr) / 45).toFixed(1) + "배입니다.",
        30, 428, { s: 11.5, c: v("--mist") });
      text(ctx, "이 남는 몫이 지표를 −18 ℃가 아니라 15 ℃로 데웁니다 — 온실 효과.", 30, 450, { s: 11.5, w: "800", c: v("--coral-700") });

      /* 오른쪽 — 위도별 에너지 수지 */
      text(ctx, "위도별 에너지 수지", 580, 44, { s: 12.5, w: "800" });
      var px0 = 612, px1 = 872, py0 = 84, py1 = 268;
      function xOfLat(l) { return px0 + l / 90 * (px1 - px0); }
      function yOfVal(q) { return py1 - (q - 30) / 130 * (py1 - py0); }
      function absorbed(l) { return 150 - 81 * Math.sin(l * Math.PI / 180); }
      ctx.strokeStyle = v("--line"); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(px0, py0); ctx.lineTo(px0, py1); ctx.lineTo(px1, py1); ctx.stroke();
      ctx.fillStyle = v("--coral"); ctx.globalAlpha = .18;
      ctx.beginPath(); ctx.moveTo(px0, yOfVal(100));
      for (var l1 = 0; l1 <= 38.1; l1 += 2) ctx.lineTo(xOfLat(l1), yOfVal(absorbed(l1)));
      ctx.lineTo(xOfLat(38.1), yOfVal(100)); ctx.closePath(); ctx.fill();
      ctx.fillStyle = v("--brand");
      ctx.beginPath(); ctx.moveTo(xOfLat(38.1), yOfVal(100));
      for (var l2 = 38.1; l2 <= 90; l2 += 2) ctx.lineTo(xOfLat(l2), yOfVal(absorbed(l2)));
      ctx.lineTo(px1, yOfVal(100)); ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = v("--coral"); ctx.lineWidth = 2.5; ctx.beginPath();
      for (var l3 = 0; l3 <= 90; l3 += 2) {
        var xx = xOfLat(l3), yy = yOfVal(absorbed(l3));
        if (l3 === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
      }
      ctx.stroke();
      ctx.strokeStyle = v("--violet"); ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(px0, yOfVal(100)); ctx.lineTo(px1, yOfVal(100)); ctx.stroke();
      dash(ctx, xOfLat(38.1), py0, xOfLat(38.1), py1, v("--ink"), 1.5);
      text(ctx, "38°", xOfLat(38.1), py0 - 6, { s: 10, w: "800", a: "center", c: v("--mist") });
      text(ctx, "흡수", px0 + 8, py0 + 14, { s: 10.5, w: "800", c: v("--coral-700") });
      text(ctx, "방출", px1 - 8, yOfVal(100) - 8, { s: 10.5, w: "800", a: "right", c: v("--violet-700") });
      text(ctx, "적도", px0, py1 + 18, { s: 10, a: "center", c: v("--mist") });
      text(ctx, "극", px1, py1 + 18, { s: 10, a: "center", c: v("--mist") });
      text(ctx, "저위도는 에너지 과잉,", 580, 300, { s: 11.5, w: "800", c: v("--coral-700") });
      text(ctx, "고위도는 에너지 부족.", 580, 322, { s: 11.5, w: "800", c: v("--brand-700") });
      text(ctx, "지구 전체로는 평형이지만", 580, 348, { s: 11, c: v("--mist") });
      text(ctx, "위도별로는 어긋나 있어서,", 580, 368, { s: 11, c: v("--mist") });
      text(ctx, "대기와 해수가 그 차이만큼", 580, 388, { s: 11, c: v("--mist") });
      text(ctx, "열을 고위도로 나릅니다.", 580, 408, { s: 11, c: v("--mist") });

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
    question: "같은 날 같은 바람인데, 산맥 동쪽은 비가 오고 서쪽은 12 ℃나 더 덥고 건조했습니다. 왜 그럴까요?",
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

    function draw() {
      paper(ctx, W, H);
      var m = model();
      var GY = 372, PX = 460, SC = 0.18;
      function yOf(h) { return GY - h * SC; }

      text(ctx, "공기 덩어리 한 덩이가 태백산맥을 넘는다", 40, 28, { s: 13, w: "800" });
      text(ctx, "건조 단열 1.0 ℃/100 m · 습윤 단열 0.5 ℃/100 m", 40, 50, { s: 11, c: v("--mist") });
      text(ctx, "이슬점은 오를 때 0.2 ℃/100 m 낮아짐", 860, 50, { s: 11, a: "right", c: v("--mist") });

      /* 산 */
      ctx.fillStyle = v("--card-2");
      ctx.beginPath(); ctx.moveTo(150, GY); ctx.lineTo(PX, yOf(MH)); ctx.lineTo(770, GY); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = v("--line"); ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = v("--line"); ctx.fillRect(40, GY, 820, 8);
      text(ctx, "동쪽 기슭 (영동)", 95, GY + 28, { s: 11.5, w: "800", a: "center", c: v("--mist") });
      text(ctx, "서쪽 기슭 (영서)", 815, GY + 28, { s: 11.5, w: "800", a: "center", c: v("--mist") });
      text(ctx, "산마루 1,500 m", PX, yOf(MH) - 30, { s: 11, w: "800", a: "center", c: v("--mist") });

      /* 높이 눈금 */
      [0, 500, 1000, 1500].forEach(function (h) {
        dash(ctx, 44, yOf(h), 150, yOf(h), v("--line"), 1);
        text(ctx, h.toLocaleString() + " m", 46, yOf(h) - 5, { s: 9.5, c: v("--mist") });
      });

      /* 구름 */
      if (m.cloud > 0) {
        var cy = yOf((m.lcl + MH) / 2);
        ctx.fillStyle = v("--brand"); ctx.globalAlpha = .28;
        for (var c = 0; c < 6; c++) {
          ctx.beginPath();
          ctx.arc(250 + c * 42, yOf(m.lcl) - 16 - (c % 3) * 10, 30 - (c % 2) * 6, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.strokeStyle = v("--brand"); ctx.lineWidth = 2;
        for (var r = 0; r < 9; r++) {
          var rx = 230 + r * 28;
          ctx.beginPath(); ctx.moveTo(rx, yOf(m.lcl) + 6); ctx.lineTo(rx - 5, yOf(m.lcl) + 26); ctx.stroke();
        }
        dash(ctx, 150, yOf(m.lcl), 770, yOf(m.lcl), v("--coral"), 2);
        text(ctx, "상승 응결 고도 " + Math.round(m.lcl).toLocaleString() + " m", 858, yOf(m.lcl) - 8, { s: 11, w: "800", a: "right", c: v("--coral-700") });
      } else {
        text(ctx, "구름이 생기지 않습니다 (응결 고도가 산마루보다 높음)", PX, yOf(MH) - 56, { s: 11.5, w: "800", a: "center", c: v("--mist") });
      }

      /* 경로 화살표 */
      arrow(ctx, 120, GY - 14, 240, yOf(600) - 6, v("--amber"), 3, 10);
      arrow(ctx, 680, yOf(600) - 6, 800, GY - 14, v("--coral"), 3, 10);

      /* 온도 표시 */
      function tag(x, y, s1, s2, col) {
        var w0 = 150;
        box(ctx, x - w0 / 2, y - 34, w0, 44, v("--card"), v(col), 10);
        text(ctx, s1, x, y - 16, { s: 11, w: "800", a: "center", c: v(col === "--line" ? "--mist" : col) });
        text(ctx, s2, x, y + 2, { s: 11, a: "center", c: v("--mist") });
      }
      tag(110, GY - 24, T0.toFixed(0) + " ℃", "이슬점 " + m.td.toFixed(0) + " ℃", "--brand-700");
      tag(PX, yOf(MH) - 58, m.top.toFixed(1) + " ℃", "산마루", "--teal-700");
      tag(800, GY - 24, m.lee.toFixed(1) + " ℃", (m.gain >= 0 ? "+" : "") + m.gain.toFixed(1) + " ℃", m.gain >= 5 ? "--coral-700" : "--mist");

      text(ctx, "오를 때 — 응결 고도까지 1.0 ℃/100 m, 그 위는 0.5 ℃/100 m", 40, 412, { s: 11.5, c: v("--mist") });
      text(ctx, "내려올 때 — 구름이 없으므로 줄곧 1.0 ℃/100 m", 500, 412, { s: 11.5, w: "800", c: v("--coral-700") });

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

    function draw() {
      paper(ctx, W, H);
      var K = kind(), up = rising();
      text(ctx, "단열선도 — 주변 대기와 공기 덩어리를 겹쳐 보기", 40, 28, { s: 13, w: "800" });

      /* 왼쪽 그림 */
      var gy = 352;
      ctx.fillStyle = v("--line"); ctx.fillRect(50, gy, 330, 8);
      text(ctx, "지표", 54, gy + 24, { s: 10.5, c: v("--mist") });
      var pcy = up ? 130 : 280;
      ctx.fillStyle = v(wet ? "--brand" : "--coral"); ctx.globalAlpha = .35;
      ctx.beginPath(); ctx.arc(215, pcy, 34, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
      ctx.strokeStyle = v(wet ? "--brand" : "--coral"); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(215, pcy, 34, 0, Math.PI * 2); ctx.stroke();
      text(ctx, wet ? "포화" : "불포화", 215, pcy + 5, { s: 12, w: "900", a: "center", c: v(wet ? "--brand-700" : "--coral-700") });
      if (up) arrow(ctx, 215, 240, 215, 86, v("--green"), 5, 14);
      else arrow(ctx, 215, 200, 215, 324, v("--violet"), 5, 14);
      text(ctx, up ? "계속 올라갑니다" : "다시 가라앉습니다", 215, 392, { s: 14, w: "900", a: "center", c: v(up ? "--green-700" : "--violet-700") });
      text(ctx, K === "unstable" ? "절대 불안정" : K === "inv" ? "기온 역전층 (매우 안정)" : K === "stable" ? "절대 안정" : "조건부 불안정",
        215, 416, { s: 12.5, w: "800", a: "center", c: v("--mist") });

      /* 오른쪽 단열선도 */
      var X0 = 460, X1 = 830, YB = 350, YT = 70;
      function xOfT(t) { return X0 + (t + 25) / 60 * 370; }
      function yOfZ(z) { return YB - z / 3000 * (YB - YT); }
      ctx.strokeStyle = v("--line"); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(X0, YT); ctx.lineTo(X0, YB); ctx.lineTo(X1 + 30, YB); ctx.stroke();
      [-20, -10, 0, 10, 20, 30].forEach(function (t) {
        text(ctx, String(t), xOfT(t), YB + 16, { s: 9.5, a: "center", c: v("--mist") });
      });
      [0, 1000, 2000, 3000].forEach(function (z) {
        dash(ctx, X0, yOfZ(z), X1 + 30, yOfZ(z), v("--line"), 1);
        text(ctx, z.toLocaleString(), X0 - 6, yOfZ(z) + 4, { s: 9.5, a: "right", c: v("--mist") });
      });
      text(ctx, "기온 (℃)", X1 + 30, YB + 16, { s: 11, a: "right", c: v("--mist") });
      text(ctx, "높이 (m)", X0 - 6, YT - 12, { s: 11, a: "right", c: v("--mist") });

      function line(rate, col, wide) {
        ctx.strokeStyle = col; ctx.lineWidth = wide;
        ctx.beginPath();
        ctx.moveTo(xOfT(TG), yOfZ(0));
        ctx.lineTo(xOfT(TG - rate * 30), yOfZ(3000));
        ctx.stroke();
      }
      line(gam, v("--mist"), 2.5);
      line(1.0, v("--coral"), wet ? 2 : 4);
      line(0.5, v("--brand"), wet ? 4 : 2);
      ctx.fillStyle = v("--ink");
      ctx.beginPath(); ctx.arc(xOfT(TG), yOfZ(0), 5, 0, Math.PI * 2); ctx.fill();

      /* 1,000 m 에서의 온도 차 */
      var envT = TG - gam * 10, parT = TG - parcelRate() * 10;
      dash(ctx, xOfT(Math.min(envT, parT)), yOfZ(1000), xOfT(Math.max(envT, parT)), yOfZ(1000), v("--green"), 2);
      text(ctx, "회색 = 주변 대기 · 주황 = 건조 단열 · 파랑 = 습윤 단열", X0, YB + 40, { s: 10.5, c: v("--mist") });
      text(ctx, "1,000 m 에서 덩어리가 주변보다 " + (parT - envT >= 0 ? "+" : "") + (parT - envT).toFixed(1) + " ℃",
        X0, YB + 62, { s: 11.5, w: "800", c: v(parT > envT ? "--green-700" : "--violet-700") });

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

    function draw() {
      paper(ctx, W, H);
      var ttop = tAt(htop);
      var GY = 382;
      function yOf(h) { return GY - h / 12 * 300; }

      text(ctx, "구름 속에서 빗방울이 자라는 두 가지 길", 40, 28, { s: 13, w: "800" });
      text(ctx, "지표 기온 20 ℃ · 기온 감률 0.65 ℃/100 m · 구름 밑면 1,000 m", 40, 50, { s: 11, c: v("--mist") });

      ctx.fillStyle = v("--line"); ctx.fillRect(40, GY, 820, 8);
      [0, 3, 6, 9, 12].forEach(function (h) {
        dash(ctx, 44, yOf(h), 100, yOf(h), v("--line"), 1);
        text(ctx, h + " km", 46, yOf(h) - 5, { s: 9.5, c: v("--mist") });
      });

      /* 등온선 */
      [[0, "0 ℃"], [-10, "−10 ℃"], [-40, "−40 ℃"]].forEach(function (p) {
        var z = zOfT(p[0]);
        if (z < 0 || z > 12) return;
        dash(ctx, 100, yOf(z), 600, yOf(z), v("--coral"), 1.5);
        text(ctx, p[1], 604, yOf(z) + 4, { s: 10, w: "800", c: v("--coral-700") });
      });

      /* 구름 */
      var yb = yOf(BASE), yt = yOf(Math.max(htop, BASE + 0.2));
      ctx.fillStyle = v("--brand"); ctx.globalAlpha = .22;
      window.roundRect(ctx, 130, yt, 420, yb - yt, 26); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = v("--brand"); ctx.lineWidth = 2;
      window.roundRect(ctx, 130, yt, 420, yb - yt, 26); ctx.stroke();

      /* 입자 */
      var seedX = [160, 205, 250, 300, 345, 395, 440, 490, 520];
      for (var i = 0; i < seedX.length; i++) {
        for (var k = 0; k < 4; k++) {
          var hh = BASE + (Math.max(htop, BASE + 0.2) - BASE) * ((k + 0.5) / 4);
          var yy = yOf(hh), xx = seedX[i] + (k % 2) * 16;
          if (yy < yt || yy > yb) continue;
          var tt = tAt(hh);
          if (tt > 0) { ctx.fillStyle = v("--brand-700"); ctx.beginPath(); ctx.arc(xx, yy, 3.2, 0, Math.PI * 2); ctx.fill(); }
          else if (tt > -10) { ctx.fillStyle = v("--violet"); ctx.beginPath(); ctx.arc(xx, yy, 2.8, 0, Math.PI * 2); ctx.fill(); }
          else {
            ctx.strokeStyle = v("--foam"); ctx.lineWidth = 1.6;
            ctx.beginPath(); ctx.moveTo(xx - 4, yy); ctx.lineTo(xx + 4, yy);
            ctx.moveTo(xx, yy - 4); ctx.lineTo(xx, yy + 4); ctx.stroke();
          }
        }
      }
      /* 강수 */
      var snow = ttop <= -10 && tAt(0) <= 0;
      for (var r = 0; r < 10; r++) {
        var rx = 150 + r * 42;
        if (snow) { text(ctx, "❄", rx, yb + 30, { s: 12, a: "center", c: v("--brand-700") }); }
        else { ctx.strokeStyle = v("--brand-700"); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(rx, yb + 8); ctx.lineTo(rx - 5, yb + 24); ctx.stroke(); }
      }

      /* 오른쪽 판정 */
      var way = ttop <= -10 ? "빙정설" : "병합설";
      text(ctx, "구름 꼭대기 " + htop.toFixed(1) + " km", 640, 96, { s: 12, w: "800", c: v("--mist") });
      text(ctx, ttop.toFixed(1) + " ℃", 640, 140, { s: 30, w: "900", c: v(ttop <= -10 ? "--brand-700" : "--coral-700") });
      text(ctx, "빗방울이 자라는 길", 640, 184, { s: 11.5, w: "800", c: v("--mist") });
      text(ctx, way, 640, 216, { s: 20, w: "900", c: v("--teal-700") });
      var lines = ttop <= -10
        ? ["얼음 알갱이(빙정)가 생깁니다.", "포화 수증기압이 물보다", "얼음에서 더 낮기 때문에,", "과냉각 물방울의 수증기가", "빙정으로 옮겨 붙어 자랍니다.", snow ? "→ 녹지 않고 떨어지면 눈" : "→ 떨어지며 녹으면 비"]
        : ["구름 전체가 0 ℃보다 따뜻합니다.", "크기가 다른 물방울이", "서로 다른 속도로 떨어지며", "부딪쳐 합쳐집니다.", "큰 물방울이 작은 것을 흡수해", "→ 빗방울이 됩니다"];
      for (var li = 0; li < lines.length; li++) text(ctx, lines[li], 640, 248 + li * 22, { s: 11, c: v("--mist") });

      text(ctx, "파랑 점 = 물방울 · 보라 점 = 과냉각 물방울 · 흰 십자 = 빙정", 130, 414, { s: 10.5, c: v("--mist") });

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

    function draw() {
      paper(ctx, W, H);
      var p = pres(z), dp = p - pres(Math.min(z + 1, 20));
      text(ctx, "높이에 따른 기압 — 직선이 아니라 지수 함수에 가깝다", 40, 28, { s: 13, w: "800" });

      /* 왼쪽 — 공기 기둥 */
      var CX0 = 60, CX1 = 300, GY = 344, TY = 70;
      function yOfZ(zz) { return GY - zz / 20 * (GY - TY); }
      ctx.fillStyle = v("--card-2"); ctx.fillRect(CX0, TY, CX1 - CX0, GY - TY);
      ctx.strokeStyle = v("--line"); ctx.lineWidth = 2; ctx.strokeRect(CX0, TY, CX1 - CX0, GY - TY);
      for (var i = 0; i < 520; i++) {
        var zz = -Math.log(1 - Math.random() * 0.98) * 8;
        if (zz > 20) continue;
        ctx.fillStyle = v("--brand"); ctx.globalAlpha = .55;
        ctx.beginPath(); ctx.arc(CX0 + 8 + Math.random() * (CX1 - CX0 - 16), yOfZ(zz), 1.9, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      dash(ctx, CX0, yOfZ(11), CX1, yOfZ(11), v("--coral"), 1.5);
      text(ctx, "대류권 계면 11 km", CX0 + 6, yOfZ(11) - 7, { s: 10, w: "800", c: v("--coral-700") });
      ctx.fillStyle = v("--line"); ctx.fillRect(CX0, GY, CX1 - CX0, 8);
      text(ctx, "공기 분자의 분포", CX0, 54, { s: 11.5, w: "800", c: v("--mist") });
      text(ctx, "아래로 갈수록 촘촘합니다", CX0, GY + 30, { s: 10.5, c: v("--mist") });

      /* 오른쪽 — 그래프 */
      var X0 = 400, X1 = 860;
      function xOfP(pp) { return X0 + pp / 1050 * (X1 - X0); }
      ctx.strokeStyle = v("--line"); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(X0, TY); ctx.lineTo(X0, GY); ctx.lineTo(X1, GY); ctx.stroke();
      [0, 250, 500, 750, 1000].forEach(function (pp) {
        dash(ctx, xOfP(pp), TY, xOfP(pp), GY, v("--line"), 1);
        text(ctx, String(pp), xOfP(pp), GY + 16, { s: 9.5, a: "center", c: v("--mist") });
      });
      [0, 5, 10, 15, 20].forEach(function (zz) {
        text(ctx, zz + " km", X0 - 6, yOfZ(zz) + 4, { s: 9.5, a: "right", c: v("--mist") });
      });
      text(ctx, "기압 (hPa)", X1, GY + 34, { s: 11, a: "right", c: v("--mist") });
      ctx.strokeStyle = v("--teal"); ctx.lineWidth = 3; ctx.beginPath();
      for (var s = 0; s <= 200; s++) {
        var zc = s / 10, xx = xOfP(pres(zc)), yy = yOfZ(zc);
        if (s === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
      }
      ctx.stroke();
      dash(ctx, X0, yOfZ(z), xOfP(p), yOfZ(z), v("--coral"), 2);
      dash(ctx, xOfP(p), yOfZ(z), xOfP(p), GY, v("--coral"), 2);
      ctx.fillStyle = v("--coral");
      ctx.beginPath(); ctx.arc(xOfP(p), yOfZ(z), 6, 0, Math.PI * 2); ctx.fill();
      var lx = xOfP(p), la = lx > 700 ? "right" : "left";
      text(ctx, p.toFixed(0) + " hPa", lx + (la === "right" ? -10 : 10), Math.max(yOfZ(z) - 10, TY + 16), { s: 13, w: "900", a: la, c: v("--coral-700") });
      /* 기준선 */
      [[P0 / 2, "지표의 1/2"], [P0 / 10, "지표의 1/10"]].forEach(function (m) {
        dash(ctx, xOfP(m[0]), TY, xOfP(m[0]), GY, v("--violet"), 1.5);
        text(ctx, m[1], xOfP(m[0]), TY - 8, { s: 9.5, w: "800", a: "center", c: v("--violet-700") });
      });

      text(ctx, "고도 " + z.toFixed(1) + " km · 기압 " + p.toFixed(1) + " hPa (지표의 " + (p / P0 * 100).toFixed(1) + " %)", 60, 400, { s: 12.5, w: "800" });
      text(ctx, "1 km 더 오르면 " + dp.toFixed(1) + " hPa 떨어집니다", 480, 400, { s: 12, c: v(dp >= 100 ? "--coral-700" : "--mist"), w: dp >= 100 ? "800" : "500" });

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
        window.sthMission("mC2", true, "<span class='m-tag'>미션 완료</span>기압이 절반이 되는 높이는 <b>약 5.5 km</b>, 1/10이 되는 높이는 <b>약 16 km</b>입니다. 절반이 되는 데 5.5 km가 걸리는데 1/10까지는 그 세 배밖에 안 걸립니다 — 기압은 일정한 비율로 줄어드는 <b>지수 함수 모양</b>으로 낮아집니다. 그래서 1 km당 100 hPa 넘게 떨어지는 곳은 지표 부근(약 1.3 km 아래)뿐입니다.");
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
      paper(ctx, W, H);
      var s = state();
      text(ctx, "공기 저울 — 두께 100 m, 밑면적 1 m² 인 공기 층 하나", 40, 28, { s: 13, w: "800" });

      /* 가운데 공기 층 */
      var BX = 320, BW = 260, BY = 182, BH = 100;
      box(ctx, BX, BY, BW, BH, v("--brand-100"), v("--brand"), 10);
      text(ctx, "공기 " + s.rho.toFixed(3) + " kg/m³", BX + BW / 2, BY + 42, { s: 12.5, w: "800", a: "center", c: v("--brand-700") });
      text(ctx, "무게 " + s.w.toFixed(0) + " N/m²", BX + BW / 2, BY + 66, { s: 12, a: "center", c: v("--mist") });
      text(ctx, "위 면 " + PTOP.toFixed(1) + " hPa", BX + BW / 2, 168, { s: 11.5, w: "800", a: "center", c: v("--mist") });
      text(ctx, "아래 면 " + pb.toFixed(1) + " hPa", BX + BW / 2, 310, { s: 11.5, w: "800", a: "center", c: v("--mist") });
      [0, 1, 2].forEach(function (i) {
        var xx = BX + 46 + i * 84;
        arrow(ctx, xx, 122, xx, BY - 6, v("--violet"), 2.5, 8);
        arrow(ctx, xx, 322, xx, BY + BH + 6, v("--coral"), 2.5, 8);
      });
      text(ctx, "위에서 누르는 기압", BX + BW / 2, 112, { s: 11, a: "center", c: v("--violet-700") });
      text(ctx, "아래에서 받치는 기압", BX + BW / 2, 342, { s: 11, a: "center", c: v("--coral-700") });

      /* 왼쪽 힘 막대 */
      text(ctx, "위로 미는 힘 (기압 차)", 50, 176, { s: 11, w: "800", c: v("--coral-700") });
      ctx.fillStyle = v("--card-2"); ctx.fillRect(50, 184, 230, 20);
      ctx.fillStyle = v("--coral"); ctx.fillRect(50, 184, clamp(s.up / 2100, 0, 1) * 230, 20);
      text(ctx, s.up.toFixed(0) + " N/m²", 50, 220, { s: 12, w: "800" });
      text(ctx, "아래로 당기는 힘 (무게)", 50, 250, { s: 11, w: "800", c: v("--violet-700") });
      ctx.fillStyle = v("--card-2"); ctx.fillRect(50, 258, 230, 20);
      ctx.fillStyle = v("--violet"); ctx.fillRect(50, 258, clamp(s.w / 2100, 0, 1) * 230, 20);
      text(ctx, s.w.toFixed(0) + " N/m²", 50, 294, { s: 12, w: "800" });

      /* 오른쪽 결과 */
      var bal = Math.abs(s.net) <= 10;
      var col = bal ? "--green-700" : (s.net > 0 ? "--coral-700" : "--violet-700");
      text(ctx, "남는 힘", 620, 178, { s: 11.5, w: "800", c: v("--mist") });
      text(ctx, (s.net >= 0 ? "+" : "") + s.net.toFixed(1) + " N/m²", 620, 216, { s: 24, w: "900", c: v(col) });
      text(ctx, "가속도 " + (s.acc >= 0 ? "+" : "") + s.acc.toFixed(2) + " m/s²", 620, 246, { s: 12.5, w: "800", c: v("--mist") });
      text(ctx, bal ? "정역학적 균형" : (s.net > 0 ? "위로 움직인다" : "아래로 움직인다"), 620, 282, { s: 16, w: "900", c: v(col) });
      if (!bal) arrow(ctx, 700, s.net > 0 ? 350 : 306, 700, s.net > 0 ? 306 : 350, v(col), 5, 13);
      else { ctx.strokeStyle = v("--green"); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(660, 328); ctx.lineTo(760, 328); ctx.stroke(); }

      /* 아래 띠 */
      box(ctx, 40, 372, 820, 44, bal ? v("--green-100") : v("--card-2"), bal ? v("--green") : v("--line"), 12);
      text(ctx, bal
        ? "✔ 위로 미는 힘과 무게가 같습니다 — 공기 층은 위아래로 움직이지 않습니다"
        : (s.net > 0 ? "기압 차가 무게보다 큽니다 → 남는 힘이 공기를 위로 밀어 올립니다 (상승 기류)"
          : "무게가 기압 차보다 큽니다 → 공기가 가라앉습니다 (하강 기류)"),
        450, 400, { s: 13, w: "800", a: "center", c: v(bal ? "--green-700" : "--ink") });

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
      if (id === "oro") return x.toFixed(1) + " m/s 의 바람";
      if (id === "front") return x.toFixed(1) + " m/s 로 이동";
      return (x * 1e5).toFixed(2) + " ×10⁻⁵ /s 로 수렴";
    }
    function cur() { for (var i = 0; i < KINDS.length; i++) if (KINDS[i].id === kind) return KINDS[i]; return KINDS[0]; }

    function drawHeat(ctx0) {
      var gy = 352;
      ctx0.fillStyle = v("--coral"); ctx0.globalAlpha = .35; ctx0.fillRect(60, gy - 10, 460, 18); ctx0.globalAlpha = 1;
      ctx0.fillStyle = v("--line"); ctx0.fillRect(60, gy, 460, 10);
      text(ctx, "뜨거워진 지표", 66, gy + 30, { s: 11, w: "800", c: v("--coral-700") });
      ctx.beginPath(); ctx.arc(140, 120, 26, 0, Math.PI * 2); ctx.fillStyle = v("--amber"); ctx.fill();
      text(ctx, "햇빛", 140, 162, { s: 11, a: "center", c: v("--amber-700") });
      var s = sv / 100;
      for (var i = 0; i < 3; i++) {
        var xx = 260 + i * 90, r = 14 + s * 16;
        ctx.fillStyle = v("--coral"); ctx.globalAlpha = .3;
        ctx.beginPath(); ctx.arc(xx, gy - 60 - i * 30 - s * 90, r, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
        arrow(ctx, xx, gy - 24, xx, gy - 70 - s * 150, v("--coral"), 3, 10);
      }
      text(ctx, "가열된 공기는 주변보다 가벼워져 떠오릅니다 (부력)", 60, 96, { s: 11.5, w: "800", c: v("--mist") });
    }
    function drawOro(ctx0) {
      var gy = 352;
      ctx0.fillStyle = v("--card-2");
      ctx0.beginPath(); ctx0.moveTo(250, gy); ctx0.lineTo(400, 150); ctx0.lineTo(520, gy); ctx0.closePath(); ctx0.fill();
      ctx0.strokeStyle = v("--line"); ctx0.lineWidth = 2; ctx0.stroke();
      ctx0.fillStyle = v("--line"); ctx0.fillRect(60, gy, 460, 10);
      var s = sv / 100;
      for (var i = 0; i < 3; i++) {
        var yy = 300 - i * 50;
        arrow(ctx, 70, yy, 180 + s * 60, yy, v("--amber"), 2 + s * 3, 10);
      }
      arrow(ctx, 270, gy - 16, 390, 168, v("--teal"), 4, 12);
      text(ctx, "바람이 산비탈을 타고 억지로 올라갑니다", 60, 96, { s: 11.5, w: "800", c: v("--mist") });
      text(ctx, "산 경사 1/20", 400, 138, { s: 11, a: "center", c: v("--mist") });
    }
    function drawFront(ctx0) {
      var gy = 352;
      ctx0.fillStyle = v("--line"); ctx0.fillRect(60, gy, 460, 10);
      ctx0.fillStyle = v("--brand"); ctx0.globalAlpha = .3;
      ctx0.beginPath(); ctx0.moveTo(60, gy); ctx0.lineTo(60, 170); ctx0.lineTo(420, gy); ctx0.closePath(); ctx0.fill();
      ctx0.globalAlpha = 1;
      ctx0.strokeStyle = v("--brand"); ctx0.lineWidth = 3;
      ctx0.beginPath(); ctx0.moveTo(60, 170); ctx0.lineTo(420, gy); ctx0.stroke();
      text(ctx, "찬 공기", 130, 300, { s: 12, w: "800", c: v("--brand-700") });
      text(ctx, "따뜻한 공기", 450, 250, { s: 12, w: "800", a: "center", c: v("--coral-700") });
      var s = sv / 100;
      arrow(ctx, 480, gy - 20, 300, 200, v("--coral"), 3 + s * 2, 12);
      arrow(ctx, 70, gy - 20, 130 + s * 80, gy - 20, v("--brand"), 3, 10);
      text(ctx, "찬 공기가 밀고 들어오며 따뜻한 공기를 들어 올립니다", 60, 96, { s: 11.5, w: "800", c: v("--mist") });
      text(ctx, "전선면 경사 1/50", 240, 150, { s: 11, c: v("--mist") });
    }
    function drawConv(ctx0) {
      var cx = 290, cy = 250;
      for (var i = 1; i <= 3; i++) {
        ctx0.strokeStyle = v("--line"); ctx0.lineWidth = 1.5;
        ctx0.beginPath(); ctx0.arc(cx, cy, i * 42, 0, Math.PI * 2); ctx0.stroke();
      }
      text(ctx, "L", cx, cy + 9, { s: 26, w: "900", a: "center", c: v("--brand-700") });
      var s = sv / 100;
      for (var k = 0; k < 8; k++) {
        var a = k * Math.PI / 4;
        var r1 = 140, r2 = 56;
        arrow(ctx, cx + r1 * Math.cos(a), cy + r1 * Math.sin(a), cx + r2 * Math.cos(a), cy + r2 * Math.sin(a), v("--teal"), 2 + s * 3, 10);
      }
      text(ctx, "지상 저기압 — 사방에서 바람이 모여듭니다", 60, 96, { s: 11.5, w: "800", c: v("--mist") });
      text(ctx, "갈 곳이 없어진 공기는 위로 올라갑니다", 60, 380, { s: 11.5, w: "800", c: v("--teal-700") });
    }

    function draw() {
      paper(ctx, W, H);
      var c = cur(), w = wOf(kind, sv);
      text(ctx, "정역학적 균형이 깨지는 네 가지 길", 40, 28, { s: 13, w: "800" });
      text(ctx, c.name + " · " + valText(kind, sv), 40, 52, { s: 12, w: "800", c: v("--teal-700") });

      if (kind === "heat") drawHeat(ctx);
      else if (kind === "oro") drawOro(ctx);
      else if (kind === "front") drawFront(ctx);
      else drawConv(ctx);

      /* 오른쪽 막대 */
      text(ctx, "상승 속도 비교 (로그 눈금)", 570, 76, { s: 12, w: "800" });
      for (var i = 0; i < KINDS.length; i++) {
        var K = KINDS[i], yy = 120 + i * 70;
        var ww = (K.id === kind) ? w : (got[K.id] ? K.target : 0);
        var on = K.id === kind;
        text(ctx, K.name, 570, yy - 14, { s: 11.5, w: on ? "900" : "700", c: v(on ? "--teal-700" : "--mist") });
        ctx.fillStyle = v("--card-2"); ctx.fillRect(570, yy, 290, 18);
        var len = clamp((Math.log(Math.max(ww, 0.01)) / Math.LN10 + 2) / 2.9, 0, 1) * 290;
        ctx.fillStyle = v(got[K.id] ? "--green" : (on ? "--teal" : "--line"));
        ctx.fillRect(570, yy, len, 18);
        var tlen = clamp((Math.log(K.target) / Math.LN10 + 2) / 2.9, 0, 1) * 290;
        ctx.strokeStyle = v("--coral"); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(570 + tlen, yy - 5); ctx.lineTo(570 + tlen, yy + 23); ctx.stroke();
        text(ctx, (on ? ww.toFixed(3) : (got[K.id] ? "✔ 넘김" : "–")) + (on ? " m/s" : ""), 570, yy + 38, { s: 11, w: "800", c: v(on ? "--ink" : "--mist") });
        text(ctx, "목표 " + K.target + " m/s", 860, yy + 38, { s: 10.5, a: "right", c: v("--coral-700") });
      }
      text(ctx, "빨간 선 = 이 미션의 목표 속도", 570, 420, { s: 10.5, c: v("--mist") });

      $("c-vert-info").innerHTML =
        "<b>" + c.name + "</b> · " + valText(kind, sv) + " → 상승 속도 <b>" + w.toFixed(3) + " m/s</b> (목표 " + c.target + " m/s)<br>" +
        (kind === "heat" ? "지표가 가열되면 그 위 공기의 밀도가 작아져 무게가 줄고, 남는 기압 경도력이 공기를 밀어 올립니다. 부력 가속도는 g·ΔT/T 입니다. 좁은 지역에서 가장 빠른 상승 기류를 만들어 적운·적란운을 키웁니다."
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
      (p.indexOf("㉡") === 0 ? "정확했습니다. 두께 100 m 공기 층의 무게가 꼭 12 hPa 이라는 것까지 확인했습니다."
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

    function draw() {
      paper(ctx, W, H);
      var f = fOf(lat), P = pgfOf(dkm), V = vg();
      text(ctx, "상공의 바람 — 기압 경도력과 전향력이 평형을 이룰 때", 40, 28, { s: 13, w: "800" });

      /* 등압선 */
      var yc = 222, sp = 20 + (dkm - 100) / 700 * 50;
      for (var i = -2; i <= 2; i++) {
        var yy = yc + i * sp;
        ctx.strokeStyle = v("--line"); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(60, yy); ctx.lineTo(560, yy); ctx.stroke();
        text(ctx, (1012 + i * 4) + " hPa", 564, yy + 4, { s: 9.5, c: v("--mist") });
      }
      text(ctx, "기압이 낮은 쪽 (북쪽)", 60, 62, { s: 11.5, w: "800", c: v("--brand-700") });
      text(ctx, "기압이 높은 쪽 (남쪽)", 60, 386, { s: 11.5, w: "800", c: v("--coral-700") });
      text(ctx, "등압선 간격 " + dkm.toLocaleString() + " km", 60, 84, { s: 10.5, c: v("--mist") });

      /* 움직이는 공기(애니메이션) */
      if (frac > 0) {
        var R = V / f;                                     /* m */
        var span = 9.42 * R;
        var sc = 480 / span;
        ctx.strokeStyle = v("--amber"); ctx.lineWidth = 2.5; ctx.beginPath();
        var N = Math.max(2, Math.round(240 * frac));
        for (var k = 0; k <= N; k++) {
          var th = (k / 240) * 1.5 * 2 * Math.PI;
          var xm = R * (th - Math.sin(th)), ym = R * (1 - Math.cos(th));
          var px = 70 + xm * sc, py = yc + 2 * sp - ym * sc;
          if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();
        var thn = (N / 240) * 1.5 * 2 * Math.PI;
        var xe = 70 + R * (thn - Math.sin(thn)) * sc, ye = yc + 2 * sp - R * (1 - Math.cos(thn)) * sc;
        ctx.fillStyle = v("--amber-700"); ctx.beginPath(); ctx.arc(xe, ye, 6, 0, Math.PI * 2); ctx.fill();
        text(ctx, "정지 상태에서 놓은 공기의 자취", 70, 106, { s: 11, w: "800", c: v("--amber-700") });
      }

      /* 힘 */
      var cx = 310, cy = yc;
      arrow(ctx, cx, cy, cx, cy - 72, v("--coral"), 5, 13);
      text(ctx, "기압 경도력", cx + 8, cy - 58, { s: 11.5, w: "800", c: v("--coral-700") });
      arrow(ctx, cx, cy, cx, cy + 72, v("--violet"), 5, 13);
      text(ctx, "전향력", cx + 8, cy + 62, { s: 11.5, w: "800", c: v("--violet-700") });
      arrow(ctx, cx - 120, cy, cx + 120, cy, v("--teal"), 6, 15);
      text(ctx, "지균풍", cx + 132, cy - 10, { s: 13, w: "900", c: v("--teal-700") });
      ctx.fillStyle = v("--ink"); ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fill();

      /* 오른쪽 수치 */
      text(ctx, "전향 인자 f = 2Ω sin φ", 620, 92, { s: 11.5, w: "800", c: v("--mist") });
      text(ctx, "= " + (f * 1e5).toFixed(2) + " ×10⁻⁵ /s", 620, 114, { s: 12.5, w: "800" });
      text(ctx, "기압 경도력 (단위 질량당)", 620, 146, { s: 11.5, w: "800", c: v("--mist") });
      text(ctx, "= " + (P * 1e4).toFixed(2) + " ×10⁻⁴ m/s²", 620, 168, { s: 12.5, w: "800" });
      text(ctx, "지균풍 속도 V = 기압 경도력 ÷ f", 620, 206, { s: 11.5, w: "800", c: v("--mist") });
      text(ctx, V.toFixed(1) + " m/s", 620, 250, { s: 30, w: "900", c: v("--teal-700") });
      text(ctx, "= 시속 " + (V * 3.6).toFixed(0) + " km", 620, 278, { s: 13, w: "800", c: v("--mist") });
      text(ctx, V > 50 ? "※ 저위도에서는 전향력이 너무 작아" : "등압선 간격이 좁을수록,", 620, 314, { s: 11, c: v("--mist") });
      text(ctx, V > 50 ? "   지균풍 근사가 성립하지 않습니다" : "위도가 낮을수록 바람이 빨라집니다", 620, 334, { s: 11, c: v("--mist") });

      text(ctx, "북반구에서 지균풍은 기압이 낮은 쪽을 ‘왼쪽’에 두고 붑니다", 60, 412, { s: 11.5, w: "800", c: v("--mist") });

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

    function draw() {
      paper(ctx, W, H);
      var V = grad(Rkm, kind);
      var low = kind === "low";
      text(ctx, "휘어진 등압선 위의 바람 — 원심력이 더해진다", 40, 28, { s: 13, w: "800" });

      /* 왼쪽 — 동심원 등압선 */
      var cx = 250, cy = 220;
      var rr = clamp(Rkm / 1500, 0.25, 1) * 110;
      for (var i = 1; i <= 3; i++) {
        ctx.strokeStyle = v("--line"); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, cy, rr * i * 0.55 + 18, 0, Math.PI * 2); ctx.stroke();
      }
      text(ctx, low ? "L" : "H", cx, cy + 10, { s: 30, w: "900", a: "center", c: v(low ? "--brand-700" : "--coral-700") });
      text(ctx, low ? "저기압 (중심 기압 낮음)" : "고기압 (중심 기압 높음)", cx, 76, { s: 12, w: "800", a: "center", c: v(low ? "--brand-700" : "--coral-700") });

      /* 힘 (오른쪽 지점) */
      var px = cx + rr * 1.65 + 18, py = cy;
      if (px > 430) px = 430;
      ctx.fillStyle = v("--ink"); ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2); ctx.fill();
      if (low) {
        arrow(ctx, px, py, px - 62, py, v("--coral"), 4, 11);
        text(ctx, "기압 경도력", px - 66, py - 22, { s: 10.5, w: "800", a: "right", c: v("--coral-700") });
        arrow(ctx, px, py, px + 44, py, v("--violet"), 4, 11);
        text(ctx, "전향력", px + 48, py - 22, { s: 10.5, w: "800", c: v("--violet-700") });
        arrow(ctx, px, py, px + 30, py + 28, v("--amber"), 3, 9);
        text(ctx, "원심력", px + 34, py + 42, { s: 10.5, w: "800", c: v("--amber-700") });
        arrow(ctx, px, py - 20, px, py - 80, v("--teal"), 5, 13);
        text(ctx, "바람", px + 8, py - 78, { s: 12, w: "900", c: v("--teal-700") });
      } else {
        arrow(ctx, px, py, px + 62, py, v("--coral"), 4, 11);
        text(ctx, "기압 경도력", px + 66, py - 22, { s: 10.5, w: "800", c: v("--coral-700") });
        arrow(ctx, px, py, px - 44, py, v("--violet"), 4, 11);
        text(ctx, "전향력", px - 48, py - 22, { s: 10.5, w: "800", a: "right", c: v("--violet-700") });
        arrow(ctx, px, py, px + 30, py + 28, v("--amber"), 3, 9);
        text(ctx, "원심력", px + 34, py + 42, { s: 10.5, w: "800", c: v("--amber-700") });
        arrow(ctx, px, py + 20, px, py + 80, v("--teal"), 5, 13);
        text(ctx, "바람", px + 8, py + 82, { s: 12, w: "900", c: v("--teal-700") });
      }
      text(ctx, "곡률 반지름 " + Rkm.toLocaleString() + " km", cx, 372, { s: 11.5, w: "800", a: "center", c: v("--mist") });

      /* 오른쪽 — 속도 비교 */
      text(ctx, "같은 기압 경도력에서의 풍속", 540, 86, { s: 12.5, w: "800" });
      function bar(y, label, val0, col) {
        text(ctx, label, 540, y - 8, { s: 11, w: "800", c: v("--mist") });
        ctx.fillStyle = v("--card-2"); ctx.fillRect(540, y, 250, 22);
        if (val0 !== null) { ctx.fillStyle = v(col); ctx.fillRect(540, y, clamp(val0 / 14, 0, 1) * 250, 22); }
        text(ctx, val0 === null ? "존재할 수 없음" : val0.toFixed(2) + " m/s", 860, y + 17, { s: 12, w: "800", a: "right", c: v(val0 === null ? "--rose-700" : "--ink") });
      }
      bar(112, "지균풍 (등압선이 곧을 때)", VG, "--mist");
      bar(180, "저기압 주위 경도풍", grad(Rkm, "low"), "--brand");
      bar(248, "고기압 주위 경도풍", grad(Rkm, "high"), "--coral");
      text(ctx, "고기압 주위는 곡률 반지름이 약 313 km 보다", 540, 306, { s: 10.5, c: v("--mist") });
      text(ctx, "작으면 힘의 평형 자체가 성립하지 않습니다.", 540, 326, { s: 10.5, c: v("--mist") });
      text(ctx, "→ 좁고 강한 고기압은 존재할 수 없습니다.", 540, 348, { s: 11, w: "800", c: v("--rose-700") });

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
        window.sthMission("mD3", true, "<span class='m-tag'>미션 완료</span>같은 기압 경도력이라도 <b>고기압 주위가 더 빠르고 저기압 주위가 더 느립니다</b>. 게다가 고기압 주위에서는 곡률 반지름이 약 313 km 보다 작으면 평형 자체가 없어서, 좁고 강한 고기압은 만들어질 수 없습니다.");
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

    function draw() {
      paper(ctx, W, H);
      var c = calc();
      text(ctx, "지표 가까이의 바람 — 마찰력이 더해지면", 40, 28, { s: 13, w: "800" });

      var yc = 216;
      for (var i = -2; i <= 2; i++) {
        var yy = yc + i * 62;
        ctx.strokeStyle = v("--line"); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(60, yy); ctx.lineTo(540, yy); ctx.stroke();
      }
      text(ctx, "기압이 낮은 쪽", 60, 62, { s: 11.5, w: "800", c: v("--brand-700") });
      text(ctx, "기압이 높은 쪽", 60, 372, { s: 11.5, w: "800", c: v("--coral-700") });

      var cx = 300, cy = yc;
      var ar = c.ang * Math.PI / 180;
      var dx = Math.cos(ar), dy = -Math.sin(ar);          /* 바람 방향 (저기압 쪽으로 기울어짐) */
      arrow(ctx, cx - 130 * dx, cy - 130 * dy, cx + 130 * dx, cy + 130 * dy, v("--teal"), 6, 15);
      text(ctx, "지상풍", cx + 140 * dx, cy + 140 * dy - 8, { s: 13, w: "900", a: "center", c: v("--teal-700") });
      arrow(ctx, cx, cy, cx, cy - 66, v("--coral"), 4, 12);
      text(ctx, "기압 경도력", cx + 8, cy - 56, { s: 10.5, w: "800", c: v("--coral-700") });
      arrow(ctx, cx, cy, cx + 66 * Math.sin(ar), cy + 66 * Math.cos(ar), v("--violet"), 4, 12);
      text(ctx, "전향력", cx + 74 * Math.sin(ar) + 6, cy + 74 * Math.cos(ar), { s: 10.5, w: "800", c: v("--violet-700") });
      arrow(ctx, cx, cy, cx - 70 * dx, cy - 70 * dy, v("--amber"), 4, 12);
      text(ctx, "마찰력", cx - 80 * dx, cy - 80 * dy, { s: 10.5, w: "800", a: "center", c: v("--amber-700") });
      ctx.fillStyle = v("--ink"); ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fill();

      /* 각도 표시 */
      ctx.strokeStyle = v("--ink"); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(cx, cy, 44, -c.ang * Math.PI / 180, 0); ctx.stroke();
      text(ctx, c.ang.toFixed(1) + "°", cx + 54, cy - 12, { s: 12, w: "900", c: v("--ink") });

      text(ctx, "등압선과 이루는 각", 600, 96, { s: 11.5, w: "800", c: v("--mist") });
      text(ctx, c.ang.toFixed(1) + "°", 600, 140, { s: 30, w: "900", c: v("--teal-700") });
      text(ctx, "풍속", 600, 184, { s: 11.5, w: "800", c: v("--mist") });
      text(ctx, c.V.toFixed(2) + " m/s", 600, 218, { s: 22, w: "900" });
      text(ctx, "(마찰이 없을 때 8.08 m/s)", 600, 244, { s: 11, c: v("--mist") });
      text(ctx, k6 === 0 ? "마찰 없음 — 상공의 지균풍" : k6 < 40 ? "바다 위처럼 매끄러운 지표" : k6 < 90 ? "평지·논밭 정도의 지표" : "도시·산지처럼 거친 지표",
        600, 282, { s: 12, w: "800", c: v("--amber-700") });
      text(ctx, "마찰이 커지면 바람이 느려지고,", 600, 314, { s: 11, c: v("--mist") });
      text(ctx, "느려지면 전향력도 작아져", 600, 334, { s: 11, c: v("--mist") });
      text(ctx, "기압 경도력 쪽으로 더 끌려갑니다.", 600, 354, { s: 11, c: v("--mist") });

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

    function draw() {
      paper(ctx, W, H);
      var X0 = 70, X1 = 870, YT = 86, YB = 380;
      function xOfLon(l) { return X0 + l / 360 * (X1 - X0); }
      function yOfLat(la) { return YB - (la - 15) / 60 * (YB - YT); }

      text(ctx, "상층 일기도 — 편서풍이 남북으로 굽이친다 (행성파)", 40, 28, { s: 13, w: "800" });
      text(ctx, "파수 " + kw + " · 진폭 " + amp + "° · 파장 약 " + Math.round(wl()).toLocaleString() + " km (위도 45° 기준)", 40, 52, { s: 11.5, w: "800", c: v("--teal-700") });
      text(ctx, "최남단 " + (45 - amp) + "°N · 최북단 " + (45 + amp) + "°N", 866, 52, { s: 11.5, w: "800", a: "right", c: v("--brand-700") });

      /* 격자 */
      ctx.strokeStyle = v("--line"); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(X0, YT); ctx.lineTo(X0, YB); ctx.lineTo(X1, YB); ctx.stroke();
      [30, 40, 50, 60, 70].forEach(function (la) {
        dash(ctx, X0, yOfLat(la), X1, yOfLat(la), v("--line"), 1);
        text(ctx, la + "°N", X0 - 6, yOfLat(la) + 4, { s: 9.5, a: "right", c: v("--mist") });
      });
      [0, 90, 180, 270, 360].forEach(function (lo) {
        text(ctx, lo + "°", xOfLon(lo), YB + 16, { s: 9.5, a: "center", c: v("--mist") });
      });
      text(ctx, "경도 →", X1, YB + 16, { s: 11, a: "right", c: v("--mist") });

      /* 찬 공기 음영 */
      ctx.fillStyle = v("--brand"); ctx.globalAlpha = .18;
      ctx.beginPath(); ctx.moveTo(X0, YT);
      for (var l = 0; l <= 360; l += 2) ctx.lineTo(xOfLon(l), yOfLat(latAt(l)));
      ctx.lineTo(X1, YT); ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 1;

      /* 흐름 */
      ctx.strokeStyle = v("--teal"); ctx.lineWidth = 3.5; ctx.beginPath();
      for (var l2 = 0; l2 <= 360; l2 += 2) {
        var xx = xOfLon(l2), yy = yOfLat(latAt(l2));
        if (l2 === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
      }
      ctx.stroke();

      /* 골·마루와 발산·저기압 */
      for (var n = 0; n < kw; n++) {
        var lonT = (270 / kw) + n * (360 / kw);            /* 골(최남단) */
        var lonR = (90 / kw) + n * (360 / kw);             /* 마루(최북단) */
        if (lonT <= 360) {
          var xt = xOfLon(lonT), yt = yOfLat(45 - amp);
          text(ctx, "기압골", xt, yt + 20, { s: 10.5, w: "800", a: "center", c: v("--brand-700") });
          var xd = xOfLon(Math.min(lonT + 45 / kw, 360));
          if (amp >= 4) {
            text(ctx, "D", xd, yOfLat(45) - 4, { s: 15, w: "900", a: "center", c: v("--coral-700") });
            text(ctx, "L", xd, YB - 14, { s: 17, w: "900", a: "center", c: v("--rose-700") });
          }
        }
        if (lonR <= 360) text(ctx, "기압 마루", xOfLon(lonR), yOfLat(45 + amp) - 12, { s: 10.5, w: "800", a: "center", c: v("--coral-700") });
      }
      text(ctx, "D = 상층 발산 · L = 그 아래 발달하는 지상 저기압", X0, YT - 12, { s: 10.5, w: "800", c: v("--rose-700") });
      text(ctx, "위쪽 파랑 = 북극의 찬 공기", X1, YT - 12, { s: 10.5, w: "800", a: "right", c: v("--brand-700") });

      /* 한반도 */
      var xk = xOfLon(127.5);
      dash(ctx, xk, YT, xk, YB, v("--violet"), 2);
      text(ctx, "우리나라 (동경 127.5°)", clamp(xk, 140, 760), YB + 40, { s: 11.5, w: "800", a: "center", c: v("--violet-700") });
      ctx.fillStyle = v("--violet");
      ctx.beginPath(); ctx.arc(xk, yOfLat(latAt(127.5)), 6, 0, Math.PI * 2); ctx.fill();



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
    { key: "r4", label: "④ 제트 기류를 읽는 사람" }
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
    { key: "r4", label: "④ 제트 기류를 읽는 사람" }
  ],
  line: { id: "all", label: "네 사건을 꿰는 한 문장" }
});

})();
