/* 지구시스템과학 Ⅱ-1 해수의 운동 — 소단원별 이야기 네 편
   01 고무 오리 2만 8천 개 / 02 사흘 뒤의 파도 / 03 26분 / 04 바다가 갈라지는 날
   공용 부품: ../assets/theme.js (sthUnit·sthGate·sthWork·setupCanvas·cssVar·drawArrow),
              ../assets/story.js (sthStory·sthMission·sthSort·sthOrder·sthPick) */
(function () {
"use strict";

window.sthUnit("esys-2-1");

var FONT = "'Gothic A1','Segoe UI',sans-serif";
var G = 9.8;

function $(id) { return document.getElementById(id); }
function v(name) { return window.cssVar(name); }
function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
function lerp(a, b, t) { return a + (b - a) * t; }
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
/* 나침반 좌표: 각은 북쪽 0°, 시계 방향 */
function compass(cx, cy, ang, len) {
  var r = ang * Math.PI / 180;
  return [cx + len * Math.sin(r), cy - len * Math.cos(r)];
}
function dirName(a) {
  var names = ["북", "북동", "동", "남동", "남", "남서", "서", "북서"];
  return names[Math.round(((a % 360) + 360) % 360 / 45) % 8];
}
/* 마지막(결말) 장면을 열었을 때 마무리하기 */
function endScene(ep, idx, fn) {
  ep.onShow(function (i) { if (i === idx) { fn(); ep.clear(idx); } });
  if (ep.at() === idx) { fn(); ep.clear(idx); }
}

/* ---- 그림 도구(무대) — ../assets/kit.js ---- */
var K = window.sthKit, KC = K.C, REDUCE = K.REDUCE;
/* 바닷물 재질: 위는 밝은 청록, 깊을수록 짙은 남색 */
function waterGrad(ctx, y0, y1, a) {
  var g = ctx.createLinearGradient(0, y0, 0, y1), al = a == null ? .85 : a;
  g.addColorStop(0, "rgba(54,170,220," + al + ")"); g.addColorStop(.35, "rgba(22,104,170," + al + ")"); g.addColorStop(1, "rgba(6,30,78," + al + ")");
  return g;
}
/* 해저 퇴적물·암석 재질 */
function rockGrad(ctx, y0, y1) {
  var g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, "#a8875c"); g.addColorStop(.18, "#7a5e3f"); g.addColorStop(1, "#2e2117");
  return g;
}
/* 땅(대륙·섬) 재질 */
function landGrad(ctx, x0, y0, x1, y1) {
  var g = ctx.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0, "#4f7a46"); g.addColorStop(.5, "#3a5c34"); g.addColorStop(1, "#22381f");
  return g;
}
/* 모래 알갱이 무늬(닫힌 경로를 clip 한 뒤 부른다) */
function grains(ctx, x, y, w, h, seed, n) {
  var R = K.rng(seed || 3);
  for (var i = 0; i < (n || 120); i++) { ctx.fillStyle = R() > .5 ? "rgba(255,230,190,.16)" : "rgba(0,0,0,.18)"; ctx.fillRect(x + R() * w, y + R() * h, 1.6, 1.6); }
}
/* 계속 도는 움직임의 멈추기 단추 */
function playWire(id, st, onTxt, offTxt) {
  var b = $(id); if (!b) return;
  function paint() { b.textContent = st.on ? "⏸ " + onTxt : "▶ " + offTxt; }
  b.addEventListener("click", function () { st.on = !st.on; paint(); });
  paint();
}
/* 작은 오리(표류물) */
function duck(ctx, x, y, s, flip) {
  ctx.save(); ctx.translate(x, y); if (flip) ctx.scale(-1, 1);
  var g = ctx.createRadialGradient(-s * .3, -s * .4, s * .1, 0, 0, s * 1.2);
  g.addColorStop(0, "#fff6b0"); g.addColorStop(.5, "#ffd23f"); g.addColorStop(1, "#c98a00");
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, s, s * .62, 0, 0, 6.2832); ctx.fill();
  ctx.beginPath(); ctx.arc(s * .62, -s * .62, s * .45, 0, 6.2832); ctx.fill();
  ctx.fillStyle = "#ff8a2a"; ctx.beginPath(); ctx.moveTo(s * 1.0, -s * .66); ctx.lineTo(s * 1.38, -s * .52); ctx.lineTo(s * 1.0, -s * .44); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#1a1a1a"; ctx.beginPath(); ctx.arc(s * .7, -s * .72, s * .08 + .4, 0, 6.2832); ctx.fill();
  ctx.restore();
}

/* =========================================================================
   이야기 ① 고무 오리 2만 8천 개 — 에크만 수송과 지형류
   ========================================================================= */
(function () {
  var ep = window.sthStory({ root: "epA", key: "epA", name: "사건 파일 ①", onDone: finish });

  /* 장면 1 — 첫 추리 */
  window.sthGate({
    gate: "gA", key: "pA1", title: "조사관의 첫 추리",
    question: "바다에 쏟아진 오리 28,800개는 어디로 갔을까요?",
    options: [
      "㉠ 바람이 부는 쪽으로 똑바로 밀려간다",
      "㉡ 바람 방향에서 옆으로 비껴 간 뒤, 큰 원을 그리는 해류를 탄다",
      "㉢ 무거워서 곧 가라앉아 거의 움직이지 않는다"
    ],
    onPick: function () { ep.clear(0); }
  });

  /* 장면 2 — 에크만 나선과 수송 */
  (function () {
    var canvas = $("a-ek"); if (!canvas) return;
    var ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var dir = 0, hemi = "N";
    var got = window.sthState("aEk") || { a: false, b: false };

    function sign() { return hemi === "N" ? 1 : -1; }
    function surf() { return ((dir + sign() * 45) % 360 + 360) % 360; }
    function trans() { return ((dir + sign() * 90) % 360 + 360) % 360; }

    var ekA = { on: !REDUCE }, ekT = 0;
    function paint() {
      var s = sign(), i;
      ctx.clearRect(0, 0, W, H);
      /* ── 왼쪽: 깊이별 흐름 ── */
      var LW = 444, cx = 222;
      K.stage(ctx, 0, 0, LW, H, "ocean", { seed: 21, title: "깊이에 따른 흐름 — 에크만 나선" });
      ctx.strokeStyle = "rgba(200,230,255,.35)"; ctx.lineWidth = 1.2; ctx.setLineDash([4, 5]);
      ctx.beginPath(); ctx.moveTo(cx, 78); ctx.lineTo(cx, 372); ctx.stroke(); ctx.setLineDash([]);
      /* 바람 */
      var wr = dir * Math.PI / 180, wl = 64;
      var wx = cx + wl * Math.sin(wr), wy = 66 - wl * Math.cos(wr) * .42;
      K.arrow(ctx, { x: cx, y: 66 }, { x: wx, y: wy }, KC.yellow, 4, 12);
      K.pill(ctx, "바람", Math.sin(wr) >= 0 ? cx - 14 : cx + 14, 70, { a: Math.sin(wr) >= 0 ? "right" : "left", s: 11, c: KC.yellow });
      for (i = 0; i < 6; i++) {
        var y = 108 + i * 50, al = 1 - i * .13;
        /* 물 층(원판) */
        var dg = ctx.createRadialGradient(cx, y, 4, cx, y, 150);
        dg.addColorStop(0, "rgba(120,210,255," + (.30 * al) + ")"); dg.addColorStop(1, "rgba(40,120,200," + (.06 * al) + ")");
        ctx.fillStyle = dg; ctx.beginPath(); ctx.ellipse(cx, y, 150, 20, 0, 0, 6.2832); ctx.fill();
        ctx.strokeStyle = "rgba(160,220,255," + (.35 * al) + ")"; ctx.lineWidth = 1; ctx.stroke();
        K.t(ctx, i === 0 ? "표층" : (i * 15) + " m", 18, y + 4, { s: 11, c: i === 0 ? KC.blue : KC.mute });
        var ang = dir + s * (45 + i * 25), len = 92 * Math.pow(0.78, i), r = ang * Math.PI / 180;
        var ex = cx + len * Math.sin(r), ey = y - len * Math.cos(r) * .42;
        ctx.save(); ctx.globalAlpha = al;
        K.arrow(ctx, { x: cx, y: y }, { x: ex, y: ey }, i === 0 ? KC.blue : "#6fb6ff", 3.2 - i * .3, 10);
        ctx.restore();
        /* 흐르는 물 입자 */
        for (var k = 0; k < 3; k++) {
          var u = ((ekT * (0.35 * Math.pow(0.78, i)) + k / 3) % 1);
          K.glow(ctx, cx + (ex - cx) * u, y + (ey - y) * u, 1.6, "rgba(220,245,255,.9)", 3.4);
        }
      }
      K.t(ctx, "깊어질수록 방향은 " + (s > 0 ? "오른쪽" : "왼쪽") + "으로 돌고 속력은 줄어듭니다", 18, 404, { s: 11, c: KC.mute });

      /* ── 오른쪽: 위에서 내려다본 방향 ── */
      var RX = LW + 8, RW = W - RX;
      K.stage(ctx, RX, 0, RW, H, "ocean", { seed: 37, title: "위에서 내려다본 방향" });
      K.pill(ctx, hemi === "N" ? "북반구 · 전향력은 오른쪽으로" : "남반구 · 전향력은 왼쪽으로", W - 16, 28, { a: "right", s: 11.5, c: hemi === "N" ? KC.green : KC.violet });
      var ox = RX + RW / 2, oy = 218, R = 118;
      var sea = ctx.createRadialGradient(ox, oy, 10, ox, oy, R);
      sea.addColorStop(0, "rgba(70,170,230,.35)"); sea.addColorStop(1, "rgba(10,50,110,.25)");
      ctx.fillStyle = sea; ctx.beginPath(); ctx.arc(ox, oy, R, 0, 6.2832); ctx.fill();
      ctx.strokeStyle = "rgba(190,225,255,.5)"; ctx.lineWidth = 1.5; ctx.stroke();
      for (i = 0; i < 36; i++) {
        var ta = i * 10 * Math.PI / 180, tl = i % 9 === 0 ? 12 : (i % 3 === 0 ? 7 : 4);
        ctx.strokeStyle = "rgba(190,225,255," + (i % 9 === 0 ? .8 : .4) + ")"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(ox + R * Math.sin(ta), oy - R * Math.cos(ta)); ctx.lineTo(ox + (R - tl) * Math.sin(ta), oy - (R - tl) * Math.cos(ta)); ctx.stroke();
      }
      K.t(ctx, "북", ox, oy - R - 10, { s: 12, w: "800", a: "center", c: KC.ink });
      K.t(ctx, "남", ox, oy + R + 21, { s: 12, w: "800", a: "center", c: KC.ink });
      K.t(ctx, "동", ox + R + 16, oy + 5, { s: 12, w: "800", a: "center", c: KC.ink });
      K.t(ctx, "서", ox - R - 16, oy + 5, { s: 12, w: "800", a: "center", c: KC.ink });
      var cw = function (a) { return (a - 90) * Math.PI / 180; };
      K.wedge(ctx, ox, oy, cw(dir), cw(dir + s * 90), 56, "rgba(255,179,92,.20)", "rgba(255,179,92,.85)");
      K.wedge(ctx, ox, oy, cw(dir), cw(dir + s * 45), 36, "rgba(127,211,255,.30)", KC.blue);
      var p1 = compass(ox, oy, dir, R - 8), p2 = compass(ox, oy, surf(), 92), p3 = compass(ox, oy, trans(), 104);
      K.arrow(ctx, { x: ox, y: oy }, { x: p1[0], y: p1[1] }, KC.yellow, 5, 14);
      K.arrow(ctx, { x: ox, y: oy }, { x: p2[0], y: p2[1] }, KC.blue, 4, 12);
      ctx.save(); ctx.shadowColor = KC.orange; ctx.shadowBlur = 10;
      K.arrow(ctx, { x: ox, y: oy }, { x: p3[0], y: p3[1] }, KC.orange, 6, 15); ctx.restore();
      /* 수송 방향으로 떠밀리는 오리 */
      var tr = trans() * Math.PI / 180, px = Math.cos(tr), py = Math.sin(tr);
      for (k = 0; k < 3; k++) {
        var uu = (ekT * .18 + k / 3) % 1, dd = 24 + uu * 70, side = (k - 1) * 16;
        ctx.save(); ctx.globalAlpha = Math.min(1, (1 - uu) * 3);
        duck(ctx, ox + dd * Math.sin(tr) + side * px, oy - dd * Math.cos(tr) + side * py, 7, Math.sin(tr) < 0);
        ctx.restore();
      }
      K.planet(ctx, ox, oy, 5, "#e8ecff", "#5a6aa0");
      if (trans() === 180) K.pill(ctx, "✓ 오리 떼가 환류 중심(남쪽)으로", ox, 62, { a: "center", s: 12, c: KC.green });
      var lx = RX + 14, lr;
      lr = K.pill(ctx, "바람", lx + 7, 396, { s: 11.5, c: KC.yellow }); lx = lr.x + lr.w + 8;
      lr = K.pill(ctx, "표층 해수 (" + (s > 0 ? "오른쪽" : "왼쪽") + " 45°)", lx + 7, 396, { s: 11.5, c: KC.blue }); lx = lr.x + lr.w + 8;
      K.pill(ctx, "에크만 수송 (90°)", lx + 7, 396, { s: 11.5, c: KC.orange, box: [RX, W] });
    }
    K.animate(canvas, function (dt) { if (ekA.on) { ekT += dt / 1000; paint(); } });
    playWire("a-ek-play", ekA, "흐름 멈추기", "흐름 보기");
    function draw() {
      var s = sign();
      paint();
      $("a-ek-info").innerHTML =
        "<b>" + (hemi === "N" ? "북반구" : "남반구") + "</b> · 바람은 <b>" + dir + "°(" + dirName(dir) + "쪽)</b>으로 붑니다.<br>" +
        "표층 해수는 바람에서 " + (s > 0 ? "오른쪽" : "왼쪽") + "으로 45° 비껴 <b>" + surf() + "°(" + dirName(surf()) + "쪽)</b>, " +
        "층 전체를 합한 <b>에크만 수송</b>은 바람의 " + (s > 0 ? "오른쪽" : "왼쪽") + " 직각인 <b>" + trans() + "°(" + dirName(trans()) + "쪽)</b>입니다. " +
        (trans() === 180 ? "오리 떼가 환류 중심 쪽(남쪽)으로 밀려갑니다!" : "수송이 정남쪽(180°)이 되도록 맞춰 보세요.");

      var ch = false;
      if (hemi === "N" && trans() === 180 && !got.a) { got.a = true; ch = true; }
      if (hemi === "S" && trans() === 180 && !got.b) { got.b = true; ch = true; }
      if (ch) { window.sthState("aEk", got); mission(); }
    }
    function mission() {
      if (got.a) done("mA2a");
      if (got.b) done("mA2b");
      if (got.a && got.b) {
        window.sthMission("mA2", true, "<span class='m-tag'>미션 완료</span>북반구에서는 <b>90°(동쪽으로 부는 바람)</b>, 남반구에서는 <b>270°(서쪽으로 부는 바람)</b>일 때 수송이 정남쪽이 됩니다. 전향력의 방향이 반대라서 같은 결과를 만드는 바람이 정반대입니다.");
        ep.clear(1);
      }
    }
    canvas._redraw = draw;
    $("a-ek-dir").addEventListener("input", function (e) {
      dir = +e.target.value; $("a-ek-dir-val").textContent = dir + "°"; draw();
    });
    var hb = document.querySelectorAll("#a-ek-hemi button");
    Array.prototype.forEach.call(hb, function (b) {
      b.addEventListener("click", function () {
        hemi = b.getAttribute("data-h");
        Array.prototype.forEach.call(hb, function (x) { x.classList.toggle("on", x === b); });
        draw();
      });
    });
    draw(); mission();
    if (ep.cleared(1)) window.sthMission("mA2", true);
  })();

  /* 장면 3 — 수압 경도력과 전향력의 평형 */
  (function () {
    var canvas = $("a-geo"); if (!canvas) return;
    var ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var d = 100, dh = 20;                       /* 수심 m, 해수면 높이차 cm */
    var got = window.sthState("aGeo") || { a: false, b: false };
    var F = 7.292e-5;                            /* 위도 30°N의 전향 인자 */
    var LEN = 2.0e6;                             /* 환류 중심 ~ 가장자리 2,000 km */

    function speed() { return G * (dh / 100 / LEN) / F * 100; }   /* cm/s */

    var geoA = { on: !REDUCE }, geoT = 0;
    function paint() {
      ctx.clearRect(0, 0, W, H);
      var y0 = 118, bump = dh * 0.25, LW = 470, x, t;
      /* ── 왼쪽: 해수면 단면 ── */
      K.stage(ctx, 0, 0, LW, H, "ocean", { seed: 23, title: "해수면 단면 — 환류 중심과 가장자리" });
      K.warn(ctx, LW - 14, 60, "⚠ 높이차는 크게 과장", "right");
      function surfY(xx) { var tt = (xx - 140) / 130; return y0 - bump * Math.exp(-tt * tt); }
      ctx.beginPath(); ctx.moveTo(14, 396);
      for (x = 14; x <= LW - 14; x += 4) ctx.lineTo(x, surfY(x));
      ctx.lineTo(LW - 14, 396); ctx.closePath();
      ctx.fillStyle = waterGrad(ctx, y0 - 50, 396, .9); ctx.fill();
      ctx.save(); ctx.shadowColor = KC.blue; ctx.shadowBlur = 8; ctx.strokeStyle = "#bfeaff"; ctx.lineWidth = 2.2;
      ctx.beginPath(); for (x = 14; x <= LW - 14; x += 4) { if (x === 14) ctx.moveTo(x, surfY(x)); else ctx.lineTo(x, surfY(x)); } ctx.stroke(); ctx.restore();
      /* 해저 */
      ctx.save(); ctx.beginPath(); ctx.rect(14, 396, LW - 28, 44); ctx.clip();
      ctx.fillStyle = rockGrad(ctx, 396, 440); ctx.fillRect(14, 396, LW - 28, 44); grains(ctx, 14, 396, LW - 28, 44, 5, 160); ctx.restore();
      K.t(ctx, "해저", 22, 432, { s: 10.5, c: "#e8d6bd" });
      K.pill(ctx, "환류 중심", 140, Math.max(48, y0 - bump - 14), { a: "center", s: 11.5, c: KC.blue });
      K.pill(ctx, "가장자리", 430, y0 - 14, { a: "center", s: 11.5, c: KC.mute, box: [0, LW] });
      /* 수심선과 수압 */
      var yd = y0 + d / 800 * 262;
      K.line(ctx, { x: 14, y: yd }, { x: LW - 14, y: yd }, KC.red, 2, [6, 5]);
      K.pill(ctx, "수심 " + d + " m", 22, yd - 9, { s: 10.5, c: KC.red });
      var pe = 1 + d / 10, pc = 1 + (d + dh / 100) / 10;
      K.glow(ctx, 140, yd, 4.5, "rgba(255,120,140,.95)", 3.6); K.glow(ctx, 430, yd, 4.5, "rgba(255,120,140,.95)", 3.6);
      K.pill(ctx, pc.toFixed(3) + " 기압", 140, yd + 26, { a: "center", s: 11.5, c: KC.ink });
      K.pill(ctx, pe.toFixed(3) + " 기압", 430, yd + 26, { a: "center", s: 11.5, c: KC.ink, box: [0, LW] });
      if (dh > 0) {
        ctx.save(); ctx.shadowColor = KC.red; ctx.shadowBlur = 8;
        K.arrow(ctx, { x: 196, y: yd }, { x: 372, y: yd }, KC.red, 3 + dh / 60, 12); ctx.restore();
        K.pill(ctx, "수압 차 " + (dh / 1000).toFixed(3) + " 기압 → 수압 경도력", 284, yd - 12, { a: "center", s: 11, c: "#ffb3c0", box: [0, LW] });
      }
      /* ── 오른쪽: 힘의 평형 ── */
      var RX = LW + 8, RW = W - RX, cx = RX + RW / 2, cy = 186;
      K.stage(ctx, RX, 0, RW, H, "ocean", { seed: 41, title: "힘의 평형 (북반구, 위도 30°N)" });
      var hi = ctx.createLinearGradient(0, 70, 0, 300);
      hi.addColorStop(0, "rgba(90,190,255,.22)"); hi.addColorStop(1, "rgba(20,60,130,.05)");
      ctx.fillStyle = hi; ctx.fillRect(RX + 14, 76, RW - 28, 216);
      K.pill(ctx, "해수면 높은 쪽 (환류 중심)", cx, 64, { a: "center", s: 11.5, c: KC.blue });
      for (var gy = 86; gy <= 286; gy += 40) K.line(ctx, { x: RX + 18, y: gy }, { x: W - 18, y: gy }, "rgba(190,225,255,.45)", 1, [5, 5]);
      K.t(ctx, "등수압선", W - 20, 120, { s: 10.5, a: "right", c: KC.mute });
      /* 흐르는 물 입자(지형류 방향) */
      var vv = speed(), sp = clamp(vv, 0, 12) * 9;
      for (var row = 0; row < 5; row++) {
        for (var k = 0; k < 6; k++) {
          var px = W - 22 - ((geoT * sp + k * (RW - 40) / 6 + row * 31) % (RW - 40));
          K.glow(ctx, px, 106 + row * 40, 1.5, "rgba(130,255,210,.85)", 3.2);
        }
      }
      ctx.save(); ctx.shadowColor = KC.red; ctx.shadowBlur = 10;
      K.arrow(ctx, { x: cx, y: cy }, { x: cx, y: cy + 82 }, KC.red, 5, 14); ctx.restore();
      ctx.save(); ctx.shadowColor = KC.blue; ctx.shadowBlur = 10;
      K.arrow(ctx, { x: cx, y: cy }, { x: cx, y: cy - 82 }, KC.blue, 5, 14); ctx.restore();
      ctx.save(); ctx.shadowColor = KC.green; ctx.shadowBlur = 12;
      K.arrow(ctx, { x: cx, y: cy }, { x: cx - 118, y: cy }, KC.green, 6, 16); ctx.restore();
      K.planet(ctx, cx, cy, 6, "#e8ecff", "#5a6aa0");
      K.pill(ctx, "수압 경도력", cx + 12, cy + 56, { s: 11.5, c: KC.red });
      K.pill(ctx, "전향력", cx + 12, cy - 46, { s: 11.5, c: KC.blue });
      K.pill(ctx, "지형류", cx - 62, cy - 14, { a: "center", s: 12.5, c: KC.green });
      K.pill(ctx, "해수면 낮은 쪽", cx, 314, { a: "center", s: 11.5, c: KC.mute });
      K.pill(ctx, "v = " + vv.toFixed(2) + " cm/s", cx, 360, { a: "center", s: 18, c: (vv >= 6.5 && vv <= 7.0) ? KC.green : KC.ink });
      K.t(ctx, "두 힘이 같아질 때의 속도", cx, 386, { s: 11, a: "center", c: KC.mute });
      K.t(ctx, "해수면 높이차 " + dh + " cm · 거리 2,000 km", RX + 16, 422, { s: 11, c: KC.mute });
    }
    K.animate(canvas, function (dt) { if (geoA.on) { geoT += dt / 1000; paint(); } });
    playWire("a-geo-play", geoA, "흐름 멈추기", "흐름 보기");
    function draw() {
      var pe = 1 + d / 10;
      paint();
      $("a-geo-info").innerHTML =
        "수심 <b>" + d + " m</b>에서 수압은 약 <b>" + pe.toFixed(1) + " 기압</b>입니다. 정지한 해수에서는 중력과 연직 방향 압력 경도력이 균형을 이루어(<b>정역학 평형</b>) 깊이만큼 위에 있는 물의 무게가 그대로 수압이 됩니다.<br>" +
        "환류 중심의 해수면이 <b>" + dh + " cm</b> 높으면 같은 높이에서 수압이 <b>" + (dh / 1000).toFixed(3) + " 기압</b>만큼 크고, 이 차이가 <b>수압 경도력</b>이 됩니다. 이 힘과 전향력이 평형을 이룰 때의 지형류 유속은 <b>" + speed().toFixed(2) + " cm/s</b>입니다.";

      var ch = false;
      if (Math.abs(pe - 21) <= 0.05 && !got.a) { got.a = true; ch = true; }
      var sp = speed();
      if (sp >= 6.5 && sp <= 7.0 && !got.b) { got.b = true; ch = true; }
      if (ch) { window.sthState("aGeo", got); mission(); }
    }
    function mission() {
      if (got.a) done("mA3a");
      if (got.b) done("mA3b");
      if (window.sthState("aPick")) done("mA3c");
      if (got.a && got.b && window.sthState("aPick")) {
        window.sthMission("mA3", true, "<span class='m-tag'>미션 완료</span>수심 <b>200 m</b>에서 21기압, 해수면 높이차 <b>100 cm</b>일 때 지형류 유속 약 6.7 cm/s. 해수면이 겨우 1 m 기울어도 바다 전체가 흐릅니다.");
        ep.clear(2);
      }
    }
    canvas._redraw = draw;
    $("a-geo-d").addEventListener("input", function (e) { d = +e.target.value; $("a-geo-d-val").textContent = d; draw(); });
    $("a-geo-h").addEventListener("input", function (e) { dh = +e.target.value; $("a-geo-h-val").textContent = dh; draw(); });

    window.sthPick({
      mount: "a-pick",
      q: "북반구 아열대에서 환류 중심의 해수면이 가장 높습니다. 이때 지형류(환류)는 어떻게 흐를까요?",
      options: ["중심을 오른쪽에 두고 시계 방향으로 돈다", "중심을 왼쪽에 두고 반시계 방향으로 돈다", "높은 중심에서 사방으로 곧장 퍼져 나간다", "낮은 가장자리에서 중심으로 곧장 모여든다"],
      answer: 0,
      why: [
        "맞습니다. 북반구의 지형류는 해수면이 높은 쪽을 오른쪽에 두고 흐릅니다. 그래서 북태평양 아열대 환류는 시계 방향입니다.",
        "그것은 남반구의 모습입니다. 전향력이 왼쪽으로 작용하기 때문입니다.",
        "수압 경도력만 있으면 그렇게 되겠지만, 전향력이 흐름을 휘게 합니다.",
        "수압 경도력은 높은 쪽에서 낮은 쪽으로 향합니다. 방향이 반대입니다."
      ],
      onDone: function () { window.sthState("aPick", 1); mission(); }
    });
    draw(); mission();
    if (ep.cleared(2)) window.sthMission("mA3", true);
  })();

  /* 장면 4 — 서안 경계류와 동안 경계류 */
  (function () {
    var canvas = $("a-bnd"); if (!canvas) return;
    var ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var wid = 400, side = "west";
    var WT = 100 * 1000 * 800 * 0.50 / 1e6;      /* 서안 수송량 = 40 Sv */

    function et() { return wid * 1000 * 500 * 0.05 / 1e6; }

    var bndA = { on: !REDUCE }, bndT = 0;
    function paint() {
      ctx.clearRect(0, 0, W, H);
      K.stage(ctx, 0, 0, W, H, "ocean", { seed: 29, title: "아열대 환류를 위에서 본 모습 (북반구)" });
      var top = 86, bot = 330, oL = 130, oR = 770, i;
      /* 바다: 위(고위도)는 차고, 아래(저위도)는 따뜻하다 */
      var og = ctx.createLinearGradient(0, top, 0, bot);
      og.addColorStop(0, "rgba(40,90,170,.55)"); og.addColorStop(1, "rgba(30,140,170,.55)");
      ctx.fillStyle = og; ctx.beginPath(); ctx.roundRect(oL, top, oR - oL, bot - top, 6); ctx.fill();
      /* 대륙 */
      [[18, oL - 4, "대륙 (서쪽)"], [oR + 4, W - 18, "대륙 (동쪽)"]].forEach(function (q, j) {
        ctx.save(); ctx.beginPath(); ctx.roundRect(q[0], top - 6, q[1] - q[0], bot - top + 12, 10); ctx.clip();
        ctx.fillStyle = landGrad(ctx, q[0], top, q[1], bot); ctx.fillRect(q[0], top - 6, q[1] - q[0], bot - top + 12);
        grains(ctx, q[0], top - 6, q[1] - q[0], bot - top + 12, 7 + j, 140); ctx.restore();
        K.pill(ctx, q[2], (q[0] + q[1]) / 2, top - 14, { a: "center", s: 11, c: "#cfe8c6" });
      });
      K.pill(ctx, "고위도 ↑", 450, top - 14, { a: "center", s: 11.5, c: KC.mute });
      K.pill(ctx, "↓ 적도", 450, bot + 24, { a: "center", s: 11.5, c: KC.mute });
      var px = (oR - oL) / 8000;
      var wpx = Math.max(12, 100 * px), epx = Math.max(12, wid * px);
      if (epx > oR - oL - wpx - 20) epx = oR - oL - wpx - 20;
      var wx0 = oL + 4, ex0 = oR - 4 - epx;
      /* 북쪽·남쪽으로 이어지는 흐름 */
      K.line(ctx, { x: wx0 + wpx + 6, y: top + 20 }, { x: ex0 - 6, y: top + 20 }, "rgba(220,235,255,.35)", 2, [8, 6]);
      K.arrow(ctx, { x: ex0 - 40, y: top + 20 }, { x: ex0 - 6, y: top + 20 }, "rgba(220,235,255,.6)", 2, 9);
      K.line(ctx, { x: ex0 - 6, y: bot - 20 }, { x: wx0 + wpx + 6, y: bot - 20 }, "rgba(220,235,255,.35)", 2, [8, 6]);
      K.arrow(ctx, { x: wx0 + wpx + 40, y: bot - 20 }, { x: wx0 + wpx + 6, y: bot - 20 }, "rgba(220,235,255,.6)", 2, 9);
      /* 서안 경계류(따뜻) */
      ctx.save(); ctx.globalAlpha = side === "west" ? 1 : .45;
      var wg = ctx.createLinearGradient(wx0, 0, wx0 + wpx, 0);
      wg.addColorStop(0, "rgba(255,107,129,.95)"); wg.addColorStop(1, "rgba(255,170,110,.75)");
      ctx.shadowColor = KC.red; ctx.shadowBlur = side === "west" ? 16 : 0;
      ctx.fillStyle = wg; ctx.beginPath(); ctx.roundRect(wx0, top + 12, wpx, bot - top - 24, 6); ctx.fill(); ctx.restore();
      /* 동안 경계류(차가움) */
      ctx.save(); ctx.globalAlpha = side === "east" ? 1 : .45;
      var eg = ctx.createLinearGradient(ex0, 0, ex0 + epx, 0);
      eg.addColorStop(0, "rgba(90,170,255,.30)"); eg.addColorStop(1, "rgba(127,211,255,.55)");
      ctx.shadowColor = KC.blue; ctx.shadowBlur = side === "east" ? 16 : 0;
      ctx.fillStyle = eg; ctx.beginPath(); ctx.roundRect(ex0, top + 12, epx, bot - top - 24, 6); ctx.fill(); ctx.restore();
      /* 물 입자: 서쪽은 빠르게 북으로, 동쪽은 느리게 남으로 */
      var R = K.rng(9), span = bot - top - 40;
      for (i = 0; i < 16; i++) {
        var yw = bot - 20 - ((R() * span + bndT * 110) % span);
        K.glow(ctx, wx0 + 3 + R() * (wpx - 6), yw, 1.7, "rgba(255,230,210,.95)", 3.2);
      }
      var ne = Math.round(10 + epx / 8);
      for (i = 0; i < ne; i++) {
        var ye = top + 20 + ((R() * span + bndT * 11) % span);
        K.glow(ctx, ex0 + 3 + R() * (epx - 6), ye, 1.5, "rgba(210,240,255,.9)", 3.2);
      }
      K.pill(ctx, "서안 경계류 ↑ 빠름", wx0 + wpx + 8, top + 48, { s: 11.5, c: "#ffb3c0" });
      K.pill(ctx, "동안 경계류 ↓ 느림", ex0 - 8, top + 48, { a: "right", s: 11.5, c: KC.blue });
      var t = et(), diff = Math.abs(t - WT);
      K.pill(ctx, diff <= 2 ? "✓ 두 해류가 같은 양을 나릅니다" : "수송량 차이 " + diff.toFixed(1) + " Sv", (wx0 + wpx + ex0) / 2, 214, { a: "center", s: 12.5, c: diff <= 2 ? KC.green : KC.yellow });
      /* 아래: 수송량 견주기 */
      K.t(ctx, "서안 — 폭 100 km, 깊이 800 m, 유속 50 cm/s → " + WT.toFixed(0) + " Sv", 18, 384, { s: 11.5, w: "800", c: "#ffb3c0" });
      K.t(ctx, "동안 — 폭 " + wid.toLocaleString() + " km, 깊이 500 m, 유속 5 cm/s → " + t.toFixed(1) + " Sv", 18, 410, { s: 11.5, w: "800", c: KC.blue });
      var bx = 600, bw = 230;
      [[WT, KC.red, 375], [t, KC.blue, 401]].forEach(function (q) {
        ctx.fillStyle = "rgba(255,255,255,.08)"; ctx.beginPath(); ctx.roundRect(bx, q[2] - 2, bw, 12, 6); ctx.fill();
        ctx.save(); ctx.shadowColor = q[1]; ctx.shadowBlur = 8; ctx.fillStyle = q[1];
        ctx.beginPath(); ctx.roundRect(bx, q[2] - 2, Math.max(6, clamp(q[0] / 80, 0, 1) * bw), 12, 6); ctx.fill(); ctx.restore();
      });
      K.line(ctx, { x: bx + WT / 80 * bw, y: 366 }, { x: bx + WT / 80 * bw, y: 416 }, "rgba(255,255,255,.6)", 1.2, [3, 3]);
      K.t(ctx, "1 Sv = 100만 m³/s", W - 16, 356, { s: 10.5, a: "right", c: KC.mute });
    }
    K.animate(canvas, function (dt) { if (bndA.on) { bndT += dt / 1000; paint(); } });
    playWire("a-bnd-play", bndA, "해류 멈추기", "해류 보기");
    function draw() {
      var t = et(), diff = Math.abs(t - WT);
      paint();
      $("a-bnd-info").innerHTML = (side === "west"
        ? "<b>서안 경계류</b>(쿠로시오 해류, 멕시코만류, 동오스트레일리아 해류) — 폭이 <b>좁고</b> 유속이 <b>빠르며</b> 깊이가 <b>깊습니다</b>. 저위도의 따뜻한 해수를 고위도로 나르고, 주변 바다와의 경계가 뚜렷합니다."
        : "<b>동안 경계류</b>(캘리포니아 해류, 카나리아 해류, 페루 해류) — 폭이 <b>넓고</b> 유속이 <b>느리며</b> 깊이가 <b>얕습니다</b>. 고위도의 찬 해수를 저위도로 나르고, 경계가 뚜렷하지 않습니다."
      ) + "<br>지금 동안 경계류의 수송량은 <b>" + t.toFixed(1) + " Sv</b>, 서안은 <b>" + WT.toFixed(0) + " Sv</b>. 차이 " + diff.toFixed(1) + " Sv. " +
        (diff <= 2 ? "두 해류가 같은 양의 물을 나릅니다!" : (t < WT ? "동안이 너무 적게 나릅니다. 폭을 넓혀 보세요." : "동안이 너무 많이 나릅니다. 폭을 좁혀 보세요."));

      if (diff <= 2 && !ep.cleared(3)) {
        window.sthState("aBnd", wid);
        window.sthMission("mA4", true, "<span class='m-tag'>미션 완료</span>동안 경계류는 폭 <b>" + wid.toLocaleString() + " km</b>가 되어야 서안 경계류와 같은 양을 나릅니다. 폭 100 km 짜리 쿠로시오 한 줄기가, 폭 1,600 km 짜리 느린 해류와 맞먹습니다. 이것이 <b>서안 강화</b>입니다.");
        ep.clear(3);
      }
    }
    canvas._redraw = draw;
    $("a-bnd-w").addEventListener("input", function (e) { wid = +e.target.value; $("a-bnd-w-val").textContent = wid.toLocaleString(); draw(); });
    var sb = document.querySelectorAll("#a-bnd-side button");
    Array.prototype.forEach.call(sb, function (b) {
      b.addEventListener("click", function () {
        side = b.getAttribute("data-s");
        Array.prototype.forEach.call(sb, function (x) { x.classList.toggle("on", x === b); });
        draw();
      });
    });
    draw();
    if (ep.cleared(3)) window.sthMission("mA4", true);
  })();

  /* 장면 5 — 결말 */
  function finish() {
    window.sthState("r1", "해결 · 동안 경계류 폭 " + (window.sthState("aBnd") || "-") + " km로 수송량 일치");
  }
  endScene(ep, 4, function () {
    var p = window.sthState("pA1") || "";
    $("a-vs").innerHTML = "<b>나의 첫 추리</b> " + (p || "기록 없음") + "<br>" +
      (p.indexOf("㉡") === 0 ? "처음부터 정확히 짚었습니다. 이제 그 ‘옆으로 비껴 가는’ 각도가 45°와 90°라는 것까지 알게 되었습니다."
        : "바람이 부는 쪽으로 똑바로 가지 않는다는 것, 그것이 이 사건의 열쇠였습니다.") +
      "<br><b>내가 맞춘 동안 경계류의 폭</b> " + (window.sthState("aBnd") || "-") + " km";
  });

  window.sthWork({
    mount: "wkA", unitLabel: "[지구시스템과학 Ⅱ-1] 이야기 ① 고무 오리 2만 8천 개",
    items: [
      { id: "w1", label: "바람과 해수의 방향이 어긋나는 까닭", hint: "에크만 수송에서 표층 해수와 전체 수송의 방향이 바람과 각각 몇 도씩 어긋나는지, 왜 그런지 쓰세요." },
      { id: "aw2", label: "오리가 알래스카에 닿기까지", hint: "바람 → 에크만 수송 → 해수면이 높아짐 → 수압 경도력 → 전향력 → 지형류 → 북태평양 해류·알래스카 해류 순서로, 각 단계에서 무엇이 무엇을 일으켰는지 이어서 쓰세요." }
    ]
  });
})();

/* =========================================================================
   이야기 ② 사흘 뒤의 파도 — 해파의 발생과 전파
   ========================================================================= */
(function () {
  var ep = window.sthStory({ root: "epB", key: "epB", name: "사건 파일 ②", onDone: finish });
  var L0 = 280, T0 = Math.sqrt(2 * Math.PI * L0 / G);   /* 기준 너울: 파장 280 m, 주기 약 13.4 s */
  var C0 = Math.sqrt(G * L0 / (2 * Math.PI));

  window.sthGate({
    gate: "gB", key: "pB1", title: "예보관의 첫 판단",
    question: "대회장에는 바람 한 점 없습니다. 사흘 뒤 파도가 들어온다면 그 파도는 어디서 온 것일까요?",
    options: [
      "㉠ 그날 아침 대회장에 부는 바람이 만든다",
      "㉡ 며칠 전 아주 먼 바다에서 강풍이 만든 파도가 건너온다",
      "㉢ 밀물과 썰물이 파도를 만들어 준다"
    ],
    onPick: function () { ep.clear(0); }
  });

  /* 장면 2 — 파도 공장 */
  (function () {
    var canvas = $("b-gen"); if (!canvas) return;
    var ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var U = 6, Fk = 100, tt = 6;

    function feff() { return Math.min(Fk, 1.44 * U * tt); }
    function height() {
      var hf = 0.0016 * U * Math.sqrt(feff() * 1000 / G);
      var hp = 0.0246 * U * U;
      return Math.min(hf, hp);
    }
    function state() {
      var hf = 0.0016 * U * Math.sqrt(feff() * 1000 / G), hp = 0.0246 * U * U;
      if (hp <= hf) return "완전히 발달한 바다 — 이 풍속으로는 더 커질 수 없습니다";
      if (1.44 * U * tt < Fk) return "지속 시간이 모자랍니다 — 바람이 더 오래 불어야 합니다";
      return "취송 거리가 모자랍니다 — 바람이 더 먼 거리를 불어 가야 합니다";
    }

    var genA = { on: !REDUCE }, genT = 0;
    function paint() {
      ctx.clearRect(0, 0, W, H);
      var Hs = height(), ok = Hs >= 2 && Hs <= 2.5, k, x;
      K.stage(ctx, 0, 0, W, H, "night", { seed: 31, title: "바람이 부는 해역 — 파도가 자라는 모습" });
      /* 폭풍 구름 */
      var R = K.rng(12);
      for (k = 0; k < 9; k++) {
        var cx = 60 + R() * 760, cy = 100 + R() * 20, cr = 50 + R() * 50, cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, cr);
        cg.addColorStop(0, "rgba(150,165,210," + (.05 + U / 250) + ")"); cg.addColorStop(1, "rgba(150,165,210,0)");
        ctx.fillStyle = cg; ctx.fillRect(0, 40, W, 140);
      }
      K.t(ctx, "풍속 " + U + " m/s · 취송 거리 " + Fk.toLocaleString() + " km · 지속 시간 " + tt + " 시간", 18, 60, { s: 12, c: KC.mute });
      K.pill(ctx, "실제로 바람을 받은 거리 " + Math.round(feff()).toLocaleString() + " km — " + state(), 18, 88, { s: 11.5, c: KC.orange, box: [0, 830] });
      K.pill(ctx, "파고 " + Hs.toFixed(2) + " m", W - 16, 30, { a: "right", s: 18, c: ok ? KC.green : KC.ink });
      /* 바람 줄기 */
      var spd = 30 + U * 9;
      for (k = 0; k < 7; k++) {
        var wx = 30 + ((k * 118 + genT * spd) % 720), wy = 122 + (k % 3) * 12;
        ctx.save(); ctx.globalAlpha = .35 + U / 50;
        K.arrow(ctx, { x: wx, y: wy }, { x: wx + 40 + U * 1.6, y: wy }, KC.yellow, Math.max(1.6, U / 7), 8);
        ctx.restore();
      }
      K.pill(ctx, "바람 →", 18, 132, { s: 11, c: KC.yellow });
      /* 바다 */
      var sTop = 170, sBot = 350, mid = sTop + 56, x0 = 30, x1 = 820, crest = [];
      function sy(xx) {
        var g = Math.pow((xx - x0) / (x1 - x0), 0.6), amp = clamp(Hs, 0, 5) * 12 * g;
        return mid - amp * Math.sin((xx - x0) / (22 + 40 * g) - genT * 2.2);
      }
      ctx.beginPath(); ctx.moveTo(x0, sBot);
      for (x = x0; x <= x1; x += 3) ctx.lineTo(x, sy(x));
      ctx.lineTo(x1, sBot); ctx.closePath();
      ctx.fillStyle = waterGrad(ctx, mid - 60, sBot, .92); ctx.fill();
      ctx.save(); ctx.shadowColor = KC.blue; ctx.shadowBlur = 8; ctx.strokeStyle = "#bfeaff"; ctx.lineWidth = 2;
      ctx.beginPath(); for (x = x0; x <= x1; x += 3) { var yy = sy(x); if (x === x0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy); if (yy < sy(x - 3) && yy < sy(x + 3)) crest.push([x, yy]); } ctx.stroke(); ctx.restore();
      /* 물마루의 흰 거품: 파도가 클수록 */
      if (Hs > 1) crest.forEach(function (c) { if (c[0] > x0 + 200) K.glow(ctx, c[0], c[1] + 1, 1.4 + Math.min(Hs, 4) * .4, "rgba(255,255,255,.85)", 3); });
      K.t(ctx, "0 km", x0 + 2, 370, { s: 10.5, c: KC.mute });
      K.t(ctx, Math.round(feff()).toLocaleString() + " km (유효 취송 거리)", x1, 370, { s: 10.5, a: "right", c: KC.mute });
      K.t(ctx, "바람을 오래, 멀리 받을수록 파도가 자랍니다", x0, 392, { s: 11, c: KC.mute });
      /* 파고 게이지 */
      var gx = 850, gT = 124, gB = 350, gh = gB - gT;
      ctx.fillStyle = "rgba(255,255,255,.07)"; ctx.beginPath(); ctx.roundRect(gx, gT, 22, gh, 11); ctx.fill();
      ctx.fillStyle = "rgba(63,211,163,.22)"; ctx.fillRect(gx, gB - 2.5 / 5 * gh, 22, .5 / 5 * gh);
      var hpx = clamp(Hs / 5, 0, 1) * gh, fg = ctx.createLinearGradient(0, gB - hpx, 0, gB);
      fg.addColorStop(0, ok ? "#7ff0c4" : "#ff9aa8"); fg.addColorStop(1, ok ? "#1f9e78" : "#c23a52");
      ctx.save(); ctx.shadowColor = ok ? KC.green : KC.red; ctx.shadowBlur = 10; ctx.fillStyle = fg;
      ctx.beginPath(); ctx.roundRect(gx + 3, gB - hpx, 16, Math.max(2, hpx), 8); ctx.fill(); ctx.restore();
      ctx.strokeStyle = "rgba(255,255,255,.25)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.roundRect(gx, gT, 22, gh, 11); ctx.stroke();
      K.t(ctx, "5 m", gx + 11, gT - 6, { s: 10, a: "center", c: KC.mute });
      K.t(ctx, "2.5", gx - 4, gB - 2.5 / 5 * gh + 4, { s: 10, a: "right", c: KC.green });
      K.t(ctx, "2.0", gx - 4, gB - 2.0 / 5 * gh + 4, { s: 10, a: "right", c: KC.green });
      K.t(ctx, "0", gx - 4, gB + 4, { s: 10, a: "right", c: KC.mute });
    }
    K.animate(canvas, function (dt) { if (genA.on) { genT += dt / 1000; paint(); } });
    playWire("b-gen-play", genA, "파도 멈추기", "파도 보기");
    function draw() {
      var Hs = height();
      paint();
      $("b-gen-info").innerHTML =
        "풍속 <b>" + U + " m/s</b>, 취송 거리 <b>" + Fk.toLocaleString() + " km</b>, 지속 시간 <b>" + tt + "시간</b> → 파고 <b>" + Hs.toFixed(2) + " m</b>.<br>" +
        state() + ". " +
        (Hs < 2 ? "대회 규정(2.0~2.5 m)보다 낮습니다." : (Hs > 2.5 ? "대회 규정보다 높아 위험합니다. 조건을 조금 낮춰 보세요." : "✅ 대회에 딱 맞는 파도입니다!"));

      if (Hs >= 2 && Hs <= 2.5 && !ep.cleared(1)) {
        window.sthState("bGen", "풍속 " + U + " m/s · 취송 " + Fk + " km · " + tt + "시간 → " + Hs.toFixed(2) + " m");
        window.sthMission("mB2", true, "<span class='m-tag'>미션 완료</span>" + window.sthState("bGen") + ". 파고를 정하는 것은 <b>풍속·취송 거리·지속 시간</b> 셋입니다. 하나만 모자라도 파도는 더 자라지 못합니다.");
        ep.clear(1);
      }
    }
    canvas._redraw = draw;
    $("b-gen-u").addEventListener("input", function (e) { U = +e.target.value; $("b-gen-u-val").textContent = U; draw(); });
    $("b-gen-f").addEventListener("input", function (e) { Fk = +e.target.value; $("b-gen-f-val").textContent = Fk.toLocaleString(); draw(); });
    $("b-gen-t").addEventListener("input", function (e) { tt = +e.target.value; $("b-gen-t-val").textContent = tt; draw(); });
    draw();
    if (ep.cleared(1)) window.sthMission("mB2", true);
  })();

  /* 장면 3 — 심해파의 속도와 도달 시각 */
  (function () {
    var canvas = $("b-swell"); if (!canvas) return;
    var ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var L = 150, DIST = 3.6e6;

    function cc() { return Math.sqrt(G * L / (2 * Math.PI)); }
    function hours() { return DIST / cc() / 3600; }

    var swA = { on: !REDUCE }, swT = 0;
    function paint() {
      ctx.clearRect(0, 0, W, H);
      var c = cc(), hr = hours(), ok = hr >= 47 && hr <= 49, x, k;
      K.stage(ctx, 0, 0, W, H, "ocean", { seed: 33, title: "북태평양 저기압 → 대회장 3,600 km" });
      /* 저기압: 반시계로 도는 구름 띠(북반구) */
      var lx = 104, ly = 150;
      ctx.save(); ctx.translate(lx, ly); ctx.rotate(-swT * .5);
      for (k = 0; k < 4; k++) {
        ctx.rotate(Math.PI / 2);
        ctx.strokeStyle = "rgba(230,236,255,.55)"; ctx.lineWidth = 7 - k; ctx.lineCap = "round";
        ctx.beginPath();
        for (var a = 0; a < 3.2; a += .1) { var rr = 8 + a * 15; if (a === 0) ctx.moveTo(rr * Math.cos(a), rr * Math.sin(a)); else ctx.lineTo(rr * Math.cos(a), rr * Math.sin(a)); }
        ctx.stroke();
      }
      ctx.restore();
      var eye = ctx.createRadialGradient(lx, ly, 0, lx, ly, 26); eye.addColorStop(0, "rgba(182,156,255,.55)"); eye.addColorStop(1, "rgba(182,156,255,0)");
      ctx.fillStyle = eye; ctx.beginPath(); ctx.arc(lx, ly, 26, 0, 6.2832); ctx.fill();
      K.pill(ctx, "L 저기압", lx, ly + 4, { a: "center", s: 12, c: KC.violet });
      /* 해안과 대회장 */
      ctx.save(); ctx.beginPath(); ctx.roundRect(812, 98, 74, 124, 10); ctx.clip();
      ctx.fillStyle = landGrad(ctx, 812, 98, 886, 222); ctx.fillRect(812, 98, 74, 124); grains(ctx, 812, 98, 74, 124, 4, 60); ctx.restore();
      var sand = ctx.createLinearGradient(800, 0, 830, 0); sand.addColorStop(0, "rgba(232,205,150,0)"); sand.addColorStop(1, "#e3c48e");
      ctx.fillStyle = sand; ctx.fillRect(796, 140, 22, 82);
      K.pill(ctx, "🏄 대회장", 849, 86, { a: "center", s: 11.5, c: KC.ink });
      /* 너울: 파장이 길수록 빨리 달린다 */
      var sea = 150, x0 = 168, x1 = 800, pxL = L / 500 * 150, vis = c * 4;
      ctx.beginPath(); ctx.moveTo(x0, 230);
      for (x = x0; x <= x1; x += 2) ctx.lineTo(x, sea - 18 * Math.sin((x - x0 - swT * vis) / pxL * 2 * Math.PI));
      ctx.lineTo(x1, 230); ctx.closePath();
      ctx.fillStyle = waterGrad(ctx, sea - 20, 230, .9); ctx.fill();
      ctx.save(); ctx.shadowColor = KC.blue; ctx.shadowBlur = 8; ctx.strokeStyle = "#bfeaff"; ctx.lineWidth = 2.2; ctx.beginPath();
      for (x = x0; x <= x1; x += 2) { var yy = sea - 18 * Math.sin((x - x0 - swT * vis) / pxL * 2 * Math.PI); if (x === x0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy); }
      ctx.stroke(); ctx.restore();
      /* 파장 표시: 고정된 두 물마루 사이 */
      var cr0 = x0 + 40;
      K.bracket(ctx, cr0, cr0 + pxL, sea - 34, KC.blue, "파장 " + L + " m", true);
      K.arrow(ctx, { x: 640, y: 252 }, { x: 760, y: 252 }, "rgba(220,235,255,.7)", 2, 9);
      K.t(ctx, "너울이 달려가는 방향", 630, 256, { s: 10.5, a: "right", c: KC.mute });
      /* 시간 막대 */
      var bx0 = 168, bx1 = 800, by = 300;
      ctx.fillStyle = "rgba(255,255,255,.08)"; ctx.beginPath(); ctx.roundRect(bx0, by - 5, bx1 - bx0, 10, 5); ctx.fill();
      var mx = bx0 + clamp(hr, 0, 72) / 72 * (bx1 - bx0);
      var tg = ctx.createLinearGradient(bx0, 0, mx, 0); tg.addColorStop(0, "rgba(127,211,255,.2)"); tg.addColorStop(1, ok ? KC.green : KC.blue);
      ctx.fillStyle = tg; ctx.beginPath(); ctx.roundRect(bx0, by - 5, Math.max(10, mx - bx0), 10, 5); ctx.fill();
      [0, 24, 48, 72].forEach(function (t) {
        var gx = bx0 + t / 72 * (bx1 - bx0);
        K.line(ctx, { x: gx, y: by - 12 }, { x: gx, y: by + 12 }, t === 48 ? KC.yellow : "rgba(200,210,255,.45)", t === 48 ? 2.5 : 1.2);
        K.t(ctx, t + "시간", gx, by + 28, { s: 10.5, a: "center", c: t === 48 ? KC.yellow : KC.mute });
      });
      K.pill(ctx, "대회 시작", bx0 + 48 / 72 * (bx1 - bx0), by - 18, { a: "center", s: 11, c: KC.yellow });
      K.glow(ctx, mx, by, 5, ok ? "rgba(63,211,163,.95)" : "rgba(255,107,129,.95)", 3.4);
      K.pill(ctx, "도착 " + hr.toFixed(1) + "시간", mx, by + 50, { a: "center", s: 12, c: ok ? KC.green : KC.red });
      K.t(ctx, "깊은 바다에서는 수심이 파속에 아무 영향을 주지 않습니다 — 파장만이 정합니다", 18, 374, { s: 11, c: KC.mute });
    }
    function readout() {
      var c = cc(), hr = hours(), ok = hr >= 47 && hr <= 49;
      $("b-swell-read").innerHTML =
        "<span class='k'>파속</span><span class='v b'>c = √(gL/2π) = " + c.toFixed(2) + " m/s</span>" +
        "<span class='sub'>시속 " + (c * 3.6).toFixed(0) + " km · 주기 " + Math.sqrt(2 * Math.PI * L / G).toFixed(1) + "초</span>" +
        "<span class='k'>도달 시간</span><span class='v y'>" + hr.toFixed(1) + " 시간</span>" +
        "<span class='sub'>3,600,000 m ÷ " + c.toFixed(2) + " m/s</span>" +
        "<span class='ok " + (ok ? "g" : "r") + "'>" + (ok ? "대회 시작(48시간)에 딱 맞습니다" : (hr > 49 ? "너무 늦게 옵니다 · 파장을 늘려 보세요" : "너무 일찍 옵니다 · 파장을 줄여 보세요")) + "</span>";
    }
    K.animate(canvas, function (dt) { if (swA.on) { swT += dt / 1000; paint(); } });
    playWire("b-swell-play", swA, "너울 멈추기", "너울 보기");
    function draw() {
      var c = cc(), hr = hours();
      paint(); readout();
      $("b-swell-info").innerHTML =
        "파장 <b>" + L + " m</b>인 심해파의 파속은 <b>" + c.toFixed(2) + " m/s</b>(시속 " + (c * 3.6).toFixed(0) + " km), 3,600 km를 건너는 데 <b>" + hr.toFixed(1) + "시간</b> 걸립니다. " +
        (hr > 49 ? "너무 늦게 도착합니다. 파장을 늘려 보세요." : (hr < 47 ? "너무 일찍 도착합니다. 파장을 줄여 보세요." : "✅ 대회 시작에 딱 맞춰 도착합니다!")) +
        "<br>파장이 긴 너울일수록 빨라서 먼저 도착합니다. 그래서 폭풍이 지나간 뒤 해안에서는 <b>긴 파도부터 차례로</b> 들어옵니다.";

      if (hr >= 47 && hr <= 49 && !ep.cleared(2)) {
        window.sthState("bSwell", L);
        window.sthMission("mB3", true, "<span class='m-tag'>미션 완료</span>파장 <b>" + L + " m</b>(주기 약 " + Math.sqrt(2 * Math.PI * L / G).toFixed(1) + "초)인 너울이 " + hr.toFixed(1) + "시간 만에 도착합니다. 심해파의 속도는 <b>√(gL/2π)</b> — 오직 파장이 정합니다.");
        ep.clear(2);
      }
    }
    canvas._redraw = draw;
    $("b-swell-l").addEventListener("input", function (e) { L = +e.target.value; $("b-swell-l-val").textContent = L; draw(); });
    draw();
    if (ep.cleared(2)) window.sthMission("mB3", true);
  })();

  /* 장면 4 — 천수 효과와 천해파 */
  (function () {
    var canvas = $("b-shoal"); if (!canvas) return;
    var ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var h = 60, H0 = 2.2;
    var got = window.sthState("bSh") || { a: false, b: false };

    function localL() {
      var L = L0;
      for (var i = 0; i < 60; i++) L = L0 * Math.tanh(2 * Math.PI * h / L);
      return L;
    }
    function kind(L) { return h / L > 0.5 ? "deep" : (h / L < 0.05 ? "shallow" : "mid"); }
    function shoalH(L) {
      var k = 2 * Math.PI / L, c = L / T0, n = 0.5 * (1 + 2 * k * h / Math.sinh(2 * k * h));
      var cg = c * n, cg0 = C0 / 2;
      return H0 * Math.sqrt(cg0 / cg);
    }

    var shA = { on: !REDUCE }, shT = 0;
    function paint() {
      ctx.clearRect(0, 0, W, H);
      var L = localL(), kd = kind(L), hs = shoalH(L), k = 2 * Math.PI / L, x, i, j;
      K.stage(ctx, 0, 0, W, H, "ocean", { seed: 35, title: "파장 280 m 너울이 얕은 곳으로 들어올 때" });
      K.t(ctx, "깊은 바다: L₀ = 280 m · c₀ = " + C0.toFixed(1) + " m/s · 주기 " + T0.toFixed(1) + "초", W - 16, 30, { s: 11, a: "right", c: KC.mute });
      var sTop = 104, yFloor = sTop + 226 * Math.sqrt(Math.min(1, (h / L) / 0.6)), x0 = 20, x1 = W - 20;
      var A = clamp(hs, 0, 6) * 5, lpx = clamp(L, 40, 400), om = 2 * Math.PI / 2.4;
      function th(xx) { return (xx - x0) / lpx * 2 * Math.PI - shT * om; }
      /* 물 */
      ctx.beginPath(); ctx.moveTo(x0, yFloor);
      for (x = x0; x <= x1; x += 3) ctx.lineTo(x, sTop - A * Math.cos(th(x)));
      ctx.lineTo(x1, yFloor); ctx.closePath();
      ctx.fillStyle = waterGrad(ctx, sTop - 20, Math.max(yFloor, sTop + 120), .9); ctx.fill();
      ctx.save(); ctx.shadowColor = KC.blue; ctx.shadowBlur = 8; ctx.strokeStyle = "#bfeaff"; ctx.lineWidth = 2.2; ctx.beginPath();
      for (x = x0; x <= x1; x += 3) { var yy = sTop - A * Math.cos(th(x)); if (x === x0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy); }
      ctx.stroke(); ctx.restore();
      /* 해저 */
      var fb = Math.max(yFloor + 12, 352);
      ctx.save(); ctx.beginPath(); ctx.rect(x0, yFloor, x1 - x0, fb - yFloor); ctx.clip();
      ctx.fillStyle = rockGrad(ctx, yFloor, fb); ctx.fillRect(x0, yFloor, x1 - x0, fb - yFloor); grains(ctx, x0, yFloor, x1 - x0, fb - yFloor, 8, 220); ctx.restore();
      K.pill(ctx, "해수면", x0 + 6, sTop - 26, { s: 10.5, c: KC.blue });
      K.pill(ctx, "해저 (수심 " + h + " m)", x0 + 6, Math.min(fb - 6, yFloor + 24), { s: 10.5, c: "#e8d6bd" });
      /* 물 입자의 궤도: 수면에서 깊이에 따라 */
      var D = yFloor - sTop, R0 = 22, sh = Math.sinh(k * h);
      var rows = D > 70 ? [.1, .34, .64] : [.5];
      for (j = 0; j < rows.length; j++) {
        var yc = sTop + rows[j] * D, z = -rows[j] * h;
        var ax = Math.min(A * Math.cosh(k * (h + z)) / sh, 64), bz = Math.min(A * Math.sinh(k * (h + z)) / sh, D * .45);
        for (i = 0; i < 5; i++) {
          var px = 150 + i * 150;
          if (ax > 1.5) { ctx.strokeStyle = "rgba(63,211,163,.55)"; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(px, yc, ax, Math.max(1, bz), 0, 0, 6.2832); ctx.stroke(); }
          var tq = th(px);
          K.glow(ctx, px + ax * Math.sin(tq), yc - bz * Math.cos(tq), 3, "rgba(127,255,200,.95)", 3.2);
        }
      }
      K.pill(ctx, "물 입자의 궤도", x1 - 6, Math.max(sTop + 30, sTop + rows[0] * D - R0 - 10), { a: "right", s: 10.5, c: KC.green });
      var label = kd === "deep" ? "심해파 — 수심이 파장의 1/2보다 깊다 (h/L > 0.5)"
        : (kd === "shallow" ? "천해파 — 수심이 파장의 1/20보다 얕다 (h/L < 0.05)"
          : "전이대 — 심해파도 천해파도 아닌 중간 (0.05 < h/L < 0.5)");
      K.pill(ctx, label, 18, 382, { s: 13, c: kd === "mid" ? KC.mute : KC.green });
      K.t(ctx, hs / h > 0.78 ? "⚠ 파고가 수심의 0.8배를 넘었습니다 — 물마루가 무너집니다(쇄파)" : "물 입자의 궤도가 납작해질수록 해저가 파도를 붙잡고 있다는 뜻입니다", 18, 408, { s: 11, c: hs / h > 0.78 ? KC.orange : KC.mute });
    }
    function readout() {
      var L = localL(), kd = kind(L), hs = shoalH(L), c = L / T0;
      $("b-shoal-read").innerHTML =
        "<span class='k'>h / L</span><span class='v y'>" + h + " ÷ " + L.toFixed(0) + " = " + (h / L).toFixed(3) + "</span>" +
        "<span class='sub'>수심 " + h + " m · 그 자리의 파장 " + L.toFixed(0) + " m</span>" +
        "<span class='k'>파속</span><span class='v b'>" + c.toFixed(2) + " m/s</span>" +
        "<span class='k'>파고</span><span class='v g'>" + hs.toFixed(2) + " m</span>" +
        "<span class='ok " + (kd === "mid" ? "r" : "g") + "'>" + (kd === "deep" ? "심해파 · 속도는 파장이 정한다" : (kd === "shallow" ? "천해파 · 속도는 수심이 정한다 √(gh)" : "전이대 · 파장과 수심 모두 영향")) + "</span>";
    }
    K.animate(canvas, function (dt) { if (shA.on) { shT += dt / 1000; paint(); } });
    playWire("b-shoal-play", shA, "물결 멈추기", "물결 보기");
    function draw() {
      var L = localL(), kd = kind(L), c = L / T0, hs = shoalH(L);
      var label = kd === "deep" ? "심해파 — 수심이 파장의 1/2보다 깊다 (h/L > 0.5)"
        : (kd === "shallow" ? "천해파 — 수심이 파장의 1/20보다 얕다 (h/L < 0.05)"
          : "전이대 — 심해파도 천해파도 아닌 중간 (0.05 < h/L < 0.5)");
      paint(); readout();
      $("b-shoal-info").innerHTML =
        "<b>" + label + "</b><br>" +
        (kd === "deep" ? "물 입자는 거의 완전한 <b>원 궤도</b>를 그립니다. 파속은 √(gL/2π) = " + C0.toFixed(1) + " m/s로 <b>파장만</b>이 정합니다."
          : (kd === "shallow" ? "물 입자는 해저에 눌려 <b>납작한 타원 궤도</b>를 그립니다. 파속은 √(gh) = " + Math.sqrt(G * h).toFixed(2) + " m/s로 <b>수심만</b>이 정합니다."
            : "파속이 파장과 수심 모두의 영향을 받는 구간입니다. 수심을 더 깊게, 또는 더 얕게 해 보세요.")) +
        "<br>속도가 줄어든 만큼 파장이 <b>" + L.toFixed(0) + " m</b>로 짧아지고, 같은 에너지가 좁은 곳에 몰려 파고는 <b>" + hs.toFixed(2) + " m</b>가 되었습니다.";

      var ch = false;
      if (kd === "deep" && !got.a) { got.a = true; ch = true; }
      if (kd === "shallow" && !got.b) { got.b = true; ch = true; }
      if (ch) { window.sthState("bSh", got); mission(); }
    }
    function mission() {
      if (got.a) done("mB4a");
      if (got.b) done("mB4b");
      if (window.sthState("bPick")) done("mB4c");
      if (got.a && got.b && window.sthState("bPick")) {
        window.sthMission("mB4", true, "<span class='m-tag'>미션 완료</span>같은 파도가 수심에 따라 <b>심해파 → 전이대 → 천해파</b>로 바뀝니다. 심해파의 속도는 파장이, 천해파의 속도는 수심이 정합니다.");
        ep.clear(3);
      }
    }
    canvas._redraw = draw;
    $("b-shoal-h").addEventListener("input", function (e) { h = +e.target.value; $("b-shoal-h-val").textContent = h; draw(); });
    window.sthPick({
      mount: "b-pick",
      q: "천해파의 속도를 정하는 것은 무엇일까요?",
      options: ["파장", "수심", "파고", "바람의 세기"],
      answer: 1,
      why: [
        "파장이 정하는 것은 심해파의 속도입니다. 천해파는 다릅니다.",
        "맞습니다. 천해파의 속도는 √(gh)로 오직 수심이 정합니다. 그래서 해안으로 갈수록 느려집니다.",
        "파고는 속도를 정하지 않습니다. 오히려 속도가 줄어든 결과로 파고가 커집니다.",
        "바람은 파도를 만들 뿐, 만들어진 파도가 퍼지는 속도는 정하지 않습니다."
      ],
      onDone: function () { window.sthState("bPick", 1); mission(); }
    });
    draw(); mission();
    if (ep.cleared(3)) window.sthMission("mB4", true);
  })();

  function finish() {
    window.sthState("r2", "해결 · 파장 " + (window.sthState("bSwell") || "-") + " m 너울이 48시간 뒤 도착");
  }
  endScene(ep, 4, function () {
    var p = window.sthState("pB1") || "";
    $("b-vs").innerHTML = "<b>나의 첫 판단</b> " + (p || "기록 없음") +
      (p.indexOf("㉡") === 0 ? " — 정확했습니다." : " — 대회장의 파도는 3,600 km 떨어진 저기압이 만든 너울이었습니다.") +
      "<br><b>내가 만든 파도</b> " + (window.sthState("bGen") || "-") +
      "<br><b>내가 고른 너울의 파장</b> " + (window.sthState("bSwell") || "-") + " m";
  });

  window.sthWork({
    mount: "wkB", unitLabel: "[지구시스템과학 Ⅱ-1] 이야기 ② 사흘 뒤의 파도",
    items: [
      { id: "w2", label: "천해파와 심해파를 가르는 것", hint: "무엇을 기준으로 나누는지, 그리고 속도가 무엇에 따라 달라지는지 각각 쓰세요." },
      { id: "bw2", label: "대회 본부에 보내는 예보문", hint: "파도가 어디서 어떻게 만들어졌고, 언제 도착하며, 해안에서 왜 높아지는지를 세 문장으로 쓰세요. 풍속·취송 거리·지속 시간이라는 말을 넣으세요." }
    ]
  });
})();

/* =========================================================================
   이야기 ③ 26분 — 해일
   ========================================================================= */
(function () {
  var ep = window.sthStory({ root: "epC", key: "epC", name: "사건 파일 ③", onDone: finish });

  window.sthGate({
    gate: "gC", key: "pC1", title: "당직자의 첫 판단",
    question: "지진 해일이 수심 5,000 m인 먼바다를 지날 때, 그 위에 떠 있는 배는 무엇을 느낄까요?",
    options: [
      "㉠ 수십 m 높이의 거대한 물벽이 지나간다",
      "㉡ 파고가 1 m도 안 되어 거의 알아채지 못한 채 지나간다",
      "㉢ 배가 갑자기 멈춰 선 것처럼 물이 사라진다"
    ],
    onPick: function () { ep.clear(0); }
  });

  /* 장면 2 — 천해파 속도 */
  (function () {
    var canvas = $("c-spd"); if (!canvas) return;
    var ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var h = 1000;
    var got = window.sthState("cSpd") || { a: false, b: false };

    function sp() { return Math.sqrt(G * h); }

    var spA = { on: !REDUCE }, spT = 0;
    function paint() {
      ctx.clearRect(0, 0, W, H);
      var s = sp(), kmh = s * 3.6, x;
      K.stage(ctx, 0, 0, W, H, "ocean", { seed: 43, title: "수심에 따른 지진 해일의 속도" });
      K.t(ctx, "파장 100 km 이상 · 먼바다 파고 1 m 이하", W - 16, 30, { s: 11, a: "right", c: KC.mute });
      var sTop = 86, yF = sTop + 160 * Math.sqrt(h / 7000), x0 = 18, x1 = W - 18, fb = 262;
      /* 해일 마루: 수심이 깊을수록 빨리 지나간다 */
      var span = x1 - x0 + 260, hx = x0 - 130 + ((spT * kmh * .35) % span);
      function sy(xx) { var t = (xx - hx) / 120; return sTop - 12 * Math.exp(-t * t); }
      ctx.beginPath(); ctx.moveTo(x0, yF);
      for (x = x0; x <= x1; x += 4) ctx.lineTo(x, sy(x));
      ctx.lineTo(x1, yF); ctx.closePath();
      ctx.fillStyle = waterGrad(ctx, sTop - 10, Math.max(yF, sTop + 100), .9); ctx.fill();
      ctx.save(); ctx.shadowColor = KC.red; ctx.shadowBlur = 10; ctx.strokeStyle = "#ffb3c0"; ctx.lineWidth = 2.6; ctx.beginPath();
      for (x = x0; x <= x1; x += 4) { if (x === x0) ctx.moveTo(x, sy(x)); else ctx.lineTo(x, sy(x)); }
      ctx.stroke(); ctx.restore();
      if (hx > x0 && hx < x1 - 60) K.arrow(ctx, { x: hx + 30, y: sTop - 26 }, { x: hx + 80, y: sTop - 26 }, KC.red, 2.5, 9);
      ctx.save(); ctx.beginPath(); ctx.rect(x0, yF, x1 - x0, fb - yF); ctx.clip();
      ctx.fillStyle = rockGrad(ctx, yF, fb); ctx.fillRect(x0, yF, x1 - x0, fb - yF); grains(ctx, x0, yF, x1 - x0, fb - yF, 6, 200); ctx.restore();
      K.pill(ctx, "수심 " + h.toLocaleString() + " m", x0 + 8, Math.min(fb - 6, yF + 24), { s: 11.5, c: "#e8d6bd" });
      K.warn(ctx, W - 18, fb - 8, "⚠ 수심을 크게 과장(실제 파장은 수심의 수십 배)", "right");
      /* 빠르기 견주기 막대 */
      var bx = 60, bw = 800, by = 300;
      K.t(ctx, "시속 (km)", bx, by - 10, { s: 10.5, c: KC.mute });
      ctx.fillStyle = "rgba(255,255,255,.08)"; ctx.beginPath(); ctx.roundRect(bx, by, bw, 14, 7); ctx.fill();
      var fw = clamp(kmh / 1000, 0, 1) * bw, bg = ctx.createLinearGradient(bx, 0, bx + bw, 0);
      bg.addColorStop(0, "#ffb35c"); bg.addColorStop(1, "#ff6b81");
      ctx.save(); ctx.shadowColor = KC.red; ctx.shadowBlur = 10; ctx.fillStyle = bg; ctx.beginPath(); ctx.roundRect(bx, by, Math.max(8, fw), 14, 7); ctx.fill(); ctx.restore();
      [[100, "🚗 자동차 100"], [300, "🚄 고속열차 300"], [900, "✈️ 여객기 900"]].forEach(function (m) {
        var gx = bx + m[0] / 1000 * bw;
        K.line(ctx, { x: gx, y: by - 6 }, { x: gx, y: by + 20 }, "rgba(232,236,255,.8)", 1.5, [4, 3]);
        K.pill(ctx, m[1], gx, by + 42, { s: 11, a: "center", c: KC.ink });
      });
    }
    function readout() {
      var s = sp(), kmh = s * 3.6;
      $("c-spd-read").innerHTML =
        "<span class='k'>속도</span><span class='v y'>v = √(gh) = " + s.toFixed(1) + " m/s</span>" +
        "<span class='sub'>√(9.8 × " + h.toLocaleString() + ")</span>" +
        "<span class='k'>시속</span><span class='v r'>" + kmh.toFixed(0) + " km</span>" +
        (kmh >= 700 ? "<span class='ok g'>제트 여객기만큼 빠릅니다</span>" : (kmh <= 100 ? "<span class='ok g'>자동차만큼 느려졌습니다</span>" : ""));
    }
    K.animate(canvas, function (dt) { if (spA.on) { spT += dt / 1000; paint(); } });
    playWire("c-spd-play", spA, "해일 멈추기", "해일 보기");
    function draw() {
      var s = sp(), kmh = s * 3.6;
      paint(); readout();
      $("c-spd-info").innerHTML =
        "수심 <b>" + h.toLocaleString() + " m</b>에서 지진 해일의 속도는 <b>" + s.toFixed(1) + " m/s = 시속 " + kmh.toFixed(0) + " km</b>입니다.<br>" +
        "지진 해일은 파장이 100 km가 넘어, 수심 4,000 m인 태평양 한복판도 <b>파장의 1/20보다 얕은 셈</b>입니다. 그래서 어디서나 <b>천해파</b>로 움직이고 속도는 오직 수심이 정합니다. 깊은 바다에서는 제트 여객기만큼 빠르지만, 얕은 해안에서는 크게 느려집니다. 그만큼 파고가 솟아오릅니다.";

      var ch = false;
      if (kmh >= 700 && !got.a) { got.a = true; ch = true; }
      if (kmh <= 100 && !got.b) { got.b = true; ch = true; }
      if (ch) { window.sthState("cSpd", got); mission(); }
    }
    function mission() {
      if (got.a) done("mC2a");
      if (got.b) done("mC2b");
      if (got.a && got.b) {
        window.sthMission("mC2", true, "<span class='m-tag'>미션 완료</span>수심 <b>3,900 m</b>쯤에서 시속 700 km를 넘고, 수심 <b>50 m</b>에서는 시속 80 km까지 느려집니다. 같은 파도인데 속도가 10배 가까이 달라집니다.");
        ep.clear(1);
      }
    }
    canvas._redraw = draw;
    $("c-spd-h").addEventListener("input", function (e) { h = +e.target.value; $("c-spd-h-val").textContent = h.toLocaleString(); draw(); });
    draw(); mission();
    if (ep.cleared(1)) window.sthMission("mC2", true);
  })();

  /* 장면 3 — 도달 시각 */
  (function () {
    var canvas = $("c-arr"); if (!canvas) return;
    var ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var guess = 15, frac = window.sthState("cArrSeen") ? 1 : 0, running = false;
    var SEG = [
      { km: 150, dep: 5000 }, { km: 50, dep: 1000 }, { km: 12, dep: 100 }
    ];
    var tot = 0, i;
    for (i = 0; i < SEG.length; i++) { SEG[i].sec = SEG[i].km * 1000 / Math.sqrt(G * SEG[i].dep); tot += SEG[i].sec; }
    var TOTKM = 212, X0 = 70, X1 = 860;

    function xOfKm(km) { return X0 + km / TOTKM * (X1 - X0); }
    function kmAt(sec) {
      var acc = 0, km = 0;
      for (var j = 0; j < SEG.length; j++) {
        if (sec <= acc + SEG[j].sec) return km + SEG[j].km * (sec - acc) / SEG[j].sec;
        acc += SEG[j].sec; km += SEG[j].km;
      }
      return TOTKM;
    }
    function depAt(km) {
      if (km < 150) return 5000; if (km < 200) return 1000; return 100;
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      K.stage(ctx, 0, 0, W, H, "ocean", { seed: 47, title: "진원에서 해안까지 — 구간마다 수심이 다르다" });
      var sea = 124, yA = 316, yB = 204, yC = 156, rb = 350, xa = xOfKm(150), xb = xOfKm(200);
      /* 물 */
      ctx.fillStyle = waterGrad(ctx, sea, yA, .85);
      ctx.beginPath(); ctx.moveTo(X0, sea); ctx.lineTo(X1, sea); ctx.lineTo(X1, yC); ctx.lineTo(xb, yC); ctx.lineTo(xb, yB); ctx.lineTo(xa, yB); ctx.lineTo(xa, yA); ctx.lineTo(X0, yA); ctx.closePath(); ctx.fill();
      /* 해저 계단 */
      ctx.save(); ctx.beginPath();
      ctx.moveTo(X0, yA); ctx.lineTo(xa, yA); ctx.lineTo(xa, yB); ctx.lineTo(xb, yB); ctx.lineTo(xb, yC); ctx.lineTo(X1, yC); ctx.lineTo(X1, rb); ctx.lineTo(X0, rb); ctx.closePath(); ctx.clip();
      ctx.fillStyle = rockGrad(ctx, yC, rb); ctx.fillRect(X0, yC, X1 - X0, rb - yC); grains(ctx, X0, yC, X1 - X0, rb - yC, 13, 300); ctx.restore();
      /* 해안의 땅 */
      ctx.save(); ctx.beginPath(); ctx.moveTo(X1, rb); ctx.lineTo(X1, sea + 6); ctx.quadraticCurveTo(X1 + 14, sea - 22, W - 14, sea - 30); ctx.lineTo(W - 14, rb); ctx.closePath(); ctx.clip();
      ctx.fillStyle = landGrad(ctx, X1, sea - 30, W, rb); ctx.fillRect(X1, sea - 32, W - X1, rb - sea + 32); ctx.restore();
      K.pill(ctx, "A 심해 5,000 m", (X0 + xa) / 2, yA - 12, { s: 11.5, a: "center", c: KC.ink });
      K.pill(ctx, "B 1,000 m", (xa + xb) / 2, yB - 12, { s: 11, a: "center", c: KC.ink });
      K.pill(ctx, "C 100 m", (xb + X1) / 2, yC + 26, { s: 10.5, a: "center", c: "#e8d6bd" });
      K.warn(ctx, xa - 8, rb - 10, "⚠ 수심은 크게 과장해 그림", "right");
      /* 진원 */
      K.glow(ctx, X0 + 26, yA + 10, 5, "rgba(255,120,120,.95)", 4);
      K.pill(ctx, "진원", X0 + 4, sea - 16, { s: 11, c: KC.red });
      K.pill(ctx, "해안", X1 + 6, sea - 40, { s: 11, a: "right", c: "#cfe8c6" });
      /* 물결 */
      var sec = tot * frac, km = kmAt(sec), wx = xOfKm(km), x;
      var amp = 8 * Math.pow(5000 / depAt(km), 0.25);
      ctx.save(); ctx.shadowColor = KC.red; ctx.shadowBlur = 12; ctx.strokeStyle = "#ff8a9c"; ctx.lineWidth = 3; ctx.beginPath();
      for (x = X0; x <= X1; x += 4) { var t = (x - wx) / 90, yy = sea - amp * Math.exp(-t * t); if (x === X0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy); }
      ctx.stroke(); ctx.restore();
      K.glow(ctx, wx, sea - amp - 6, 3.5, "rgba(255,150,160,.95)", 3.6);
      var mm = Math.floor(sec / 60), ss = Math.round(sec % 60);
      K.pill(ctx, "지진 발생 후 " + mm + "분 " + (ss < 10 ? "0" + ss : ss) + "초 · " + km.toFixed(0) + " km 이동", 450, 72, { s: 14, a: "center", c: KC.red });
      K.pill(ctx, "내가 계산한 도달 시각: " + guess + "분", 18, 370, { s: 12.5, c: KC.yellow });
      K.t(ctx, "구간별로 v = √(gh)를 구한 뒤 거리 ÷ 속도를 모두 더합니다", 18, 395, { s: 11, c: KC.mute });
    }
    canvas._redraw = draw;
    $("c-arr-t").addEventListener("input", function (e) {
      guess = +e.target.value; $("c-arr-t-val").textContent = guess + "분"; draw();
    });
    $("c-arr-run").addEventListener("click", function () {
      if (running) return;
      running = true;
      var btn = $("c-arr-run"); btn.disabled = true;
      var step = 0;
      (function tick() {
        step++; frac = step / 60; draw();
        if (step < 60) window.setTimeout(tick, 22);
        else {
          running = false; btn.disabled = false; btn.textContent = "▶ 한 번 더 보내기";
          window.sthState("cArrSeen", 1);
          var real = tot / 60, diff = Math.abs(guess - real);
          if (diff <= 2) {
            window.sthState("cArr", guess);
            $("c-arr-info").innerHTML = "✅ 실제 도달 시각은 <b>" + real.toFixed(1) + "분</b>. 내 계산 " + guess + "분 — 오차 " + diff.toFixed(1) + "분입니다.<br>A: 150 km ÷ 221 m/s = 678초, B: 50 km ÷ 99 m/s = 505초, C: 12 km ÷ 31 m/s = 383초 → 모두 더해 1,566초 ≈ 26분.";
            window.sthMission("mC3", true, "<span class='m-tag'>미션 완료</span>해안 도달까지 약 <b>26분</b>. 거리의 약 70%를 차지하는 심해 구간은 11분 만에 지나지만, 마지막 12 km는 6분이 넘게 걸립니다. <b>느려진 만큼 파고가 솟아오릅니다.</b>");
            ep.clear(2);
          } else {
            $("c-arr-info").innerHTML = "❌ 내 계산 " + guess + "분은 실제보다 <b>" + (guess > real ? "늦습니다" : "이릅니다") + "</b>. 구간별 속도를 다시 구해 보세요. 수심이 얕아질수록 √(gh)가 작아져 같은 거리라도 훨씬 오래 걸립니다.";
          }
        }
      })();
    });
    if (window.sthState("cArrSeen")) $("c-arr-run").textContent = "▶ 한 번 더 보내기";
    draw();
    if (ep.cleared(2)) window.sthMission("mC3", true);
  })();

  /* 장면 4 — 폭풍 해일 */
  (function () {
    var canvas = $("c-surge"); if (!canvas) return;
    var ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var P = 1000, U = 10, tide = 0.5;
    var got = window.sthState("cSurge") || { a: false, b: false };

    function pEff() { return (1013 - P) * 0.01; }
    function wEff() { return 0.0009 * U * U; }
    function total() { return pEff() + wEff() + tide; }

    var suA = { on: !REDUCE }, suT = 0;
    function paint() {
      ctx.clearRect(0, 0, W, H);
      var tp = pEff(), tw = wEff(), tot = total(), k, x;
      /* ── 왼쪽: 태풍 ── */
      var LW = 318;
      K.stage(ctx, 0, 0, LW, H, "night", { seed: 51, title: "해일을 밀어 올리는 세 가지" });
      var tx = 160, ty = 138, depth = (1013 - P) / 113;
      ctx.save(); ctx.translate(tx, ty); ctx.rotate(-suT * (.3 + depth));
      for (k = 0; k < 5; k++) {
        ctx.rotate(Math.PI * 2 / 5);
        ctx.strokeStyle = "rgba(235,240,255," + (.25 + depth * .45) + ")"; ctx.lineWidth = 9 - k; ctx.lineCap = "round"; ctx.beginPath();
        for (var a = 0; a < 3.4; a += .1) { var rr = 14 + a * (14 + depth * 6); if (a === 0) ctx.moveTo(rr * Math.cos(a), rr * Math.sin(a)); else ctx.lineTo(rr * Math.cos(a), rr * Math.sin(a)); }
        ctx.stroke();
      }
      ctx.restore();
      var eg = ctx.createRadialGradient(tx, ty, 0, tx, ty, 16); eg.addColorStop(0, "rgba(10,14,40,1)"); eg.addColorStop(1, "rgba(10,14,40,0)");
      ctx.fillStyle = eg; ctx.beginPath(); ctx.arc(tx, ty, 16, 0, 6.2832); ctx.fill();
      K.pill(ctx, "중심 기압 " + P + " hPa → +" + tp.toFixed(2) + " m", tx, 236, { a: "center", s: 12, c: KC.violet, box: [0, LW] });
      for (k = 0; k < 4; k++) {
        var wx = 26 + ((k * 70 + suT * (20 + U * 5)) % 220), wy = 262 + (k % 2) * 12;
        ctx.save(); ctx.globalAlpha = U > 0 ? .4 + U / 100 : .15;
        K.arrow(ctx, { x: wx, y: wy }, { x: wx + 22 + U * .6, y: wy }, KC.yellow, Math.max(1.5, U / 10), 8); ctx.restore();
      }
      K.pill(ctx, "해안으로 부는 바람 " + U + " m/s → +" + tw.toFixed(2) + " m", tx, 310, { a: "center", s: 12, c: KC.yellow, box: [0, LW] });
      K.glow(ctx, 40, 346, 6, "rgba(230,236,255,.95)", 2.6);
      K.pill(ctx, "천문 조위 +" + tide.toFixed(1) + " m", tx + 10, 352, { a: "center", s: 12, c: KC.blue, box: [0, LW] });
      K.t(ctx, "기압 1 hPa ↓ → 해수면 약 1 cm ↑", 16, 404, { s: 11, c: KC.mute });
      /* ── 오른쪽: 해안 단면 ── */
      var RX = LW + 8, base = 352, pm = 54, sx0 = RX + 50, wall = 700;
      K.stage(ctx, RX, 0, W - RX, H, "night", { seed: 53, title: "방조제 앞 해안 단면" });
      for (var m = 0; m <= 5; m++) {
        var gy = base - m * pm;
        K.line(ctx, { x: sx0, y: gy }, { x: W - 14, y: gy }, "rgba(200,210,255,.18)", 1, [4, 4]);
        K.t(ctx, m + " m", sx0 - 8, gy + 4, { s: 10, a: "right", c: KC.mute });
      }
      /* 시가지 */
      var R = K.rng(17);
      for (k = 0; k < 6; k++) {
        var bx = 748 + k * 24, bh = 36 + R() * 60;
        var bgd = ctx.createLinearGradient(0, base - bh, 0, base); bgd.addColorStop(0, "#3a4270"); bgd.addColorStop(1, "#1d2346");
        ctx.fillStyle = bgd; ctx.fillRect(bx, base - bh, 20, bh);
        for (var wy2 = base - bh + 6; wy2 < base - 6; wy2 += 10) for (var wx2 = bx + 4; wx2 < bx + 18; wx2 += 7) if (R() > .45) { ctx.fillStyle = "rgba(255,214,120,.8)"; ctx.fillRect(wx2, wy2, 3, 4); }
      }
      K.pill(ctx, "시가지", 816, base + 22, { a: "center", s: 11, c: KC.mute });
      /* 바다 */
      var top = base - clamp(tot, 0, 5) * pm;
      function sy(xx) { return top + 3 * Math.sin(xx / 22 - suT * 2.5); }
      ctx.beginPath(); ctx.moveTo(sx0, base + 30);
      for (x = sx0; x <= wall; x += 4) ctx.lineTo(x, sy(x));
      ctx.lineTo(wall, base + 30); ctx.closePath();
      ctx.fillStyle = waterGrad(ctx, top, base + 30, .8); ctx.fill();
      ctx.save(); ctx.shadowColor = KC.blue; ctx.shadowBlur = 8; ctx.strokeStyle = "#bfeaff"; ctx.lineWidth = 2.2; ctx.beginPath();
      for (x = sx0; x <= wall; x += 4) { if (x === sx0) ctx.moveTo(x, sy(x)); else ctx.lineTo(x, sy(x)); }
      ctx.stroke(); ctx.restore();
      /* 넘친 물 */
      if (tot > 3) {
        var over = (tot - 3) * pm;
        ctx.fillStyle = "rgba(60,150,220,.55)"; ctx.beginPath(); ctx.moveTo(wall, base - 3 * pm - over * .6); ctx.quadraticCurveTo(wall + 50, base - 3 * pm, wall + 56, base); ctx.lineTo(W - 14, base); ctx.lineTo(W - 14, base - Math.min(over, 40)); ctx.lineTo(wall + 40, base - Math.min(over, 40)); ctx.closePath(); ctx.fill();
      }
      /* 방조제(콘크리트) */
      var cg = ctx.createLinearGradient(wall, 0, wall + 40, 0); cg.addColorStop(0, "#9aa3b8"); cg.addColorStop(1, "#5c6478");
      ctx.fillStyle = cg; ctx.fillRect(wall, base - 3 * pm, 40, 3 * pm + 30);
      ctx.fillStyle = rockGrad(ctx, base, H); ctx.fillRect(sx0, base + 30, W - 14 - sx0, H - base - 44);
      ctx.fillStyle = "#4a3a2a"; ctx.fillRect(wall + 40, base, W - 14 - wall - 40, 30);
      K.pill(ctx, "방조제 3.0 m", wall + 20, base - 3 * pm - 12, { a: "center", s: 11, c: KC.ink });
      /* 쌓아 올린 몫 */
      var bx0 = sx0 + 16, segs = [[tide, KC.blue], [tp, KC.violet], [tw, KC.yellow]], acc = 0;
      segs.forEach(function (q) {
        var h0 = base - acc * pm, h1 = base - (acc + q[0]) * pm; acc += q[0];
        ctx.save(); ctx.shadowColor = q[1]; ctx.shadowBlur = 8; ctx.fillStyle = q[1]; ctx.globalAlpha = .9;
        ctx.fillRect(bx0, Math.max(60, h1), 16, Math.max(0, h0 - Math.max(60, h1))); ctx.restore();
      });
      K.pill(ctx, "해수면 " + tot.toFixed(2) + " m", 560, Math.max(78, top - 14), { a: "center", s: 15, c: tot > 3 ? KC.red : KC.blue });
      K.pill(ctx, tot > 3 ? "⚠ 방조제를 넘었습니다" : "방조제를 넘지 못했습니다", W - 16, 28, { a: "right", s: 11.5, c: tot > 3 ? KC.red : KC.mute });
    }
    function readout() {
      var tp = pEff(), tw = wEff(), tot = total(), ok = tot >= 3 && tot <= 3.5;
      $("c-surge-read").innerHTML =
        "<span class='k'>기압 효과</span><span class='v b'>+" + tp.toFixed(2) + " m</span>" +
        "<span class='k'>바람 효과</span><span class='v y'>+" + tw.toFixed(2) + " m</span>" +
        "<span class='k'>천문 조위</span><span class='v b'>+" + tide.toFixed(1) + " m</span>" +
        "<span class='k'>해수면</span><span class='v " + (tot > 3 ? "r" : "g") + "'>" + tot.toFixed(2) + " m</span>" +
        "<span class='ok " + (ok ? "g" : "r") + "'>" + (ok ? "방조제(3.0 m)를 갓 넘깁니다" : (tot > 3.5 ? "너무 높습니다 · 3.0~3.5 m를 찾으세요" : "방조제(3.0 m) 아래")) + "</span>";
    }
    K.animate(canvas, function (dt) { if (suA.on) { suT += dt / 1000; paint(); } });
    playWire("c-surge-play", suA, "태풍 멈추기", "태풍 보기");
    function draw() {
      var tp = pEff(), tw = wEff(), tot = total();
      paint(); readout();
      $("c-surge-info").innerHTML =
        "중심 기압이 1 hPa 낮아질 때마다 해수면이 약 <b>1 cm</b> 올라갑니다. 지금은 " + (1013 - P) + " hPa 낮아 <b>" + tp.toFixed(2) + " m</b>.<br>" +
        "해안으로 부는 바람이 물을 밀어붙여 <b>" + tw.toFixed(2) + " m</b>, 여기에 그때의 천문 조위 <b>" + tide.toFixed(1) + " m</b>가 더해져 해수면은 <b>" + tot.toFixed(2) + " m</b>입니다. " +
        (tot > 3.5 ? "너무 높습니다 — ‘갓 넘기는’ 조건(3.0~3.5 m)을 찾아보세요." : (tot >= 3 ? "✅ 방조제를 갓 넘겼습니다." : "아직 방조제를 넘지 못했습니다."));

      var ch = false;
      if (tp >= 1.0 && !got.a) { got.a = true; ch = true; }
      if (tot >= 3.0 && tot <= 3.5 && !got.b) { got.b = true; window.sthState("cSurgeSet", P + " hPa · " + U + " m/s · 조위 " + tide.toFixed(1) + " m"); ch = true; }
      if (ch) { window.sthState("cSurge", got); mission(); }
    }
    function mission() {
      if (got.a) done("mC4a");
      if (got.b) done("mC4b");
      if (got.a && got.b) {
        window.sthMission("mC4", true, "<span class='m-tag'>미션 완료</span>기압만으로는 아무리 낮춰도 1.13 m가 한계입니다. <b>기압 + 바람 + 만조</b>가 겹쳐야 방조제를 넘습니다. 2003년 태풍 매미 때 남해안에서 실제로 이런 일이 일어났습니다.");
        ep.clear(3);
      }
    }
    canvas._redraw = draw;
    $("c-surge-p").addEventListener("input", function (e) { P = +e.target.value; $("c-surge-p-val").textContent = P; draw(); });
    $("c-surge-u").addEventListener("input", function (e) { U = +e.target.value; $("c-surge-u-val").textContent = U; draw(); });
    $("c-surge-tide").addEventListener("input", function (e) { tide = +e.target.value; $("c-surge-tide-val").textContent = tide.toFixed(1); draw(); });
    draw(); mission();
    if (ep.cleared(3)) window.sthMission("mC4", true);
  })();

  /* 장면 5 — 대처 방안 분류 + 결말 */
  var SORT_ITEMS = [
    { t: "해저 지진의 규모와 위치를 재어 몇 분 안에 경보를 낸다", a: "q", why: "지진 해일은 예고 없이 시작되므로 지진 관측이 곧 경보입니다." },
    { t: "흔들림을 느끼면 방송을 기다리지 말고 곧장 높은 곳으로 간다", a: "q", why: "도달까지 수십 분밖에 없습니다. 스스로 움직이는 것이 가장 빠릅니다.", hint: "물이 오기까지 몇 분이나 있었나요?" },
    { t: "먼바다에 관측 부이를 띄워 해수면이 들리는 것을 바로 감지한다", a: "q", why: "먼바다에서는 파고가 낮아 눈으로는 알 수 없으므로 부이로 잽니다." },
    { t: "태풍의 진로와 중심 기압을 며칠 전부터 예보한다", a: "s", why: "폭풍 해일은 원인인 태풍을 미리 추적할 수 있습니다." },
    { t: "만조 시각과 겹치는지 확인해 저지대 주민을 미리 대피시킨다", a: "s", why: "만조와 겹치는지가 피해 규모를 가릅니다.", hint: "조위 슬라이더를 올렸을 때 무슨 일이 있었나요?" },
    { t: "항구의 어선과 양식 시설을 안전한 곳으로 옮겨 묶어 둔다", a: "s", why: "바람과 높은 물이 함께 오므로 미리 옮겨 둡니다." },
    { t: "해안 저지대에 대피 표지판과 대피 건물을 정해 둔다", a: "b", why: "두 해일 모두 결국 해안 저지대를 덮칩니다." },
    { t: "방조제를 높이고 해안림을 가꾸어 물의 힘을 줄인다", a: "b", why: "두 해일 모두에 쓰이는 구조적 대책입니다." }
  ];

  function reveal() {
    $("c-end").hidden = false;
    var p = window.sthState("pC1") || "";
    $("c-vs").innerHTML = "<b>나의 첫 판단</b> " + (p || "기록 없음") +
      (p.indexOf("㉡") === 0 ? " — 정확했습니다. 먼바다에서 알아채기 어렵다는 점이 지진 해일을 더 무섭게 만듭니다." : " — 먼바다에서는 파고가 1 m도 되지 않아 배 위에서는 알아채기 어렵습니다.") +
      "<br><b>내가 계산한 도달 시각</b> " + (window.sthState("cArr") || "-") + "분" +
      "<br><b>방조제를 넘긴 조건</b> " + (window.sthState("cSurgeSet") || "-");
  }
  function finish() {
    window.sthState("r3", "해결 · 도달 시각 " + (window.sthState("cArr") || "-") + "분으로 경보 발령");
  }
  if (ep.cleared(4)) {
    $("c-sort").innerHTML = "<div class='sort'><div class='buckets'>" +
      [["q", "지진 해일"], ["s", "폭풍 해일"], ["b", "둘 다"]].map(function (b) {
        return "<div class='bucket'><span class='b-name'>" + b[1] + "</span>" +
          SORT_ITEMS.filter(function (it) { return it.a === b[0]; }).map(function (it) { return "<span class='in'>" + it.t + "</span>"; }).join("") + "</div>";
      }).join("") + "</div></div>";
    reveal();
  } else {
    window.sthSort({
      mount: "c-sort",
      buckets: [
        { id: "q", label: "지진 해일", sub: "해저 지진·화산·산사태" },
        { id: "s", label: "폭풍 해일", sub: "태풍·발달한 저기압" },
        { id: "b", label: "둘 다", sub: "어느 쪽에나 필요한 대비" }
      ],
      items: SORT_ITEMS,
      doneText: "원인이 다르면 예보할 수 있는 시간도, 준비하는 방법도 달라집니다.",
      onDone: function () { reveal(); ep.clear(4); }
    });
  }

  window.sthWork({
    mount: "wkC", unitLabel: "[지구시스템과학 Ⅱ-1] 이야기 ③ 26분",
    items: [
      { id: "cw1", label: "대피 방송 원고 (세 문장)", hint: "무슨 일이 일어났고, 몇 분 남았고, 무엇을 해야 하는지 쓰세요. 왜 그 시간이 나오는지도 한 문장으로 넣으세요." },
      { id: "cw2", label: "우리 지역에 제안하는 해일 대비책", hint: "지진 해일과 폭풍 해일 중 하나를 고르고, 그 원인에 맞는 대책을 두 가지 제안하세요. 왜 그 대책이 그 해일에 맞는지 밝히세요." }
    ]
  });
})();

/* =========================================================================
   이야기 ④ 바다가 갈라지는 날 — 조석
   ========================================================================= */
(function () {
  var ep = window.sthStory({ root: "epD", key: "epD", name: "사건 파일 ④", onDone: finish });
  var MASS = 2.706e7;                 /* 태양 질량 ÷ 달 질량 */
  var PERIOD = 12.42;                 /* 반일주조 주기(시간) */
  var HIGH = 3.0;                     /* 만조 시각(시) */

  window.sthGate({
    gate: "gD", key: "pD1", title: "기획단의 첫 추측",
    question: "바다가 갈라지는 날을 정하는 것은 무엇일까요?",
    options: [
      "㉠ 그날의 바람과 날씨",
      "㉡ 태양·지구·달의 배치와 그 지역의 바다 모양",
      "㉢ 해마다 달라지는 해수면의 높이"
    ],
    onPick: function () { ep.clear(0); }
  });

  /* 장면 2 — 기조력과 거리의 세제곱 */
  (function () {
    var canvas = $("d-tf"); if (!canvas) return;
    var ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var r = 100;
    var got = window.sthState("dTf") || { a: false, b: false };

    function ratio() { return MASS / (r * r * r); }

    function draw() {
      var q = ratio();
      ctx.clearRect(0, 0, W, H);
      K.stage(ctx, 0, 0, W, H, "space", { seed: 61, title: "기조력 = 질량 ÷ 거리³ — 거리가 훨씬 더 중요하다" });
      K.warn(ctx, W - 16, 30, "⚠ 크기·거리는 실제 비율이 아님", "right");
      var ey = 148, ex = 320, sx = 470 + (r - 50) / 550 * 360;
      /* 지구와 부푼 바닷물 */
      var bg = ctx.createRadialGradient(ex, ey, 20, ex, ey, 60);
      bg.addColorStop(0, "rgba(127,211,255,.45)"); bg.addColorStop(1, "rgba(127,211,255,0)");
      ctx.fillStyle = bg; ctx.beginPath(); ctx.ellipse(ex, ey, 60, 38, 0, 0, 6.2832); ctx.fill();
      ctx.strokeStyle = "rgba(127,211,255,.7)"; ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.ellipse(ex, ey, 54, 34, 0, 0, 6.2832); ctx.stroke(); ctx.setLineDash([]);
      K.earth(ctx, ex, ey, 28);
      K.pill(ctx, "지구 · 부푼 바닷물", ex, ey + 64, { a: "center", s: 11.5, c: KC.blue });
      /* 달 */
      K.line(ctx, { x: 150, y: ey }, { x: ex - 34, y: ey }, "rgba(200,210,255,.35)", 1.2, [3, 4]);
      K.planet(ctx, 150, ey, 13, "#d8dbe6", "#4a4f63");
      K.pill(ctx, "달", 150, ey - 24, { a: "center", s: 11.5, c: KC.ink });
      K.pill(ctx, "거리 1배 (기준)", 150, ey + 40, { a: "center", s: 11, c: KC.mute });
      /* 태양 */
      K.line(ctx, { x: ex + 34, y: ey }, { x: sx - 30, y: ey }, "rgba(255,211,107,.35)", 1.2, [3, 4]);
      K.sun(ctx, sx, ey, 24);
      K.pill(ctx, "태양", sx, ey - 46, { a: "center", s: 11.5, c: KC.yellow });
      K.pill(ctx, "질량 2,700만 배 · 거리 " + r + "배", sx, ey + 64, { a: "center", s: 11, c: KC.yellow });
      /* 기조력 막대 */
      var bx = 190, bw = 560;
      [["달의 기조력", 1, "#e8ecff", "rgba(200,210,255,.6)", "1.00 (기준)", 258], ["태양의 기조력", q, "#ffd36b", "#ff9a3c", (q >= 100 ? q.toFixed(0) : q.toFixed(2)) + " 배", 300]].forEach(function (b) {
        K.t(ctx, b[0], 24, b[5] + 14, { s: 12, w: "800", c: b[2] });
        ctx.fillStyle = "rgba(255,255,255,.07)"; ctx.beginPath(); ctx.roundRect(bx, b[5], bw, 20, 10); ctx.fill();
        var g = ctx.createLinearGradient(bx, 0, bx + bw, 0); g.addColorStop(0, b[3]); g.addColorStop(1, b[2]);
        ctx.save(); ctx.shadowColor = b[2]; ctx.shadowBlur = 10; ctx.fillStyle = g;
        ctx.beginPath(); ctx.roundRect(bx, b[5], Math.max(8, clamp(b[1] / 3.4, 0, 1) * bw), 20, 10); ctx.fill(); ctx.restore();
        K.pill(ctx, b[4], W - 16, b[5] + 15, { a: "right", s: 12, c: b[2] });
      });
      K.line(ctx, { x: bx + bw / 3.4, y: 250 }, { x: bx + bw / 3.4, y: 328 }, "rgba(255,255,255,.55)", 1.2, [3, 3]);
      K.t(ctx, "달과 같음", bx + bw / 3.4, 344, { s: 10.5, a: "center", c: KC.mute });
      $("d-tf-info").innerHTML =
        "태양이 달보다 <b>" + r + "배</b> 멀다면, 태양의 기조력은 달의 <b>" + (q >= 100 ? q.toFixed(0) : q.toFixed(2)) + "배</b>입니다. " +
        "(2,700만 ÷ " + r + "³)<br>" +
        (Math.abs(q - 1) <= 0.05 ? "✅ 딱 같아졌습니다. 2,700만의 세제곱근이 약 300이기 때문입니다."
          : (q <= 0.5 ? "✅ 태양의 기조력이 달의 절반 이하가 되었습니다." : "거리를 더 멀리 해 보세요.")) +
        "<br>기조력은 <b>질량에 비례하고 거리의 세제곱에 반비례</b>합니다. 실제 태양은 달보다 약 390배 멀어서, 질량이 2,700만 배나 큰데도 기조력은 달의 <b>약 0.46배</b>에 그칩니다.";

      var ch = false;
      if (Math.abs(q - 1) <= 0.05 && !got.a) { got.a = true; ch = true; }
      if (q <= 0.5 && !got.b) { got.b = true; ch = true; }
      if (ch) { window.sthState("dTf", got); mission(); }
    }
    function mission() {
      if (got.a) done("mD2a");
      if (got.b) done("mD2b");
      if (got.a && got.b) {
        window.sthMission("mD2", true, "<span class='m-tag'>미션 완료</span><b>300배</b>에서 두 기조력이 같아지고, <b>380배</b>를 넘으면 태양이 달의 절반 이하가 됩니다. 실제 거리 390배에서 태양은 달의 약 0.46배 — 그래서 조석의 주인공은 달입니다.");
        ep.clear(1);
      }
    }
    canvas._redraw = draw;
    $("d-tf-r").addEventListener("input", function (e) { r = +e.target.value; $("d-tf-r-val").textContent = r + "배"; draw(); });
    draw(); mission();
    if (ep.cleared(1)) window.sthMission("mD2", true);
  })();

  /* 장면 3 — 사리와 조금 */
  (function () {
    var canvas = $("d-ph"); if (!canvas) return;
    var ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var a = 45;
    var got = window.sthState("dPh") || { a: false, b: false };

    function range() { return 5.75 + 2.35 * Math.cos(2 * a * Math.PI / 180); }
    function phase() {
      var n = ((a % 360) + 360) % 360;
      if (n <= 15 || n >= 345) return "삭 (달이 태양과 같은 방향)";
      if (Math.abs(n - 90) <= 15) return "상현";
      if (Math.abs(n - 180) <= 15) return "망 (보름달)";
      if (Math.abs(n - 270) <= 15) return "하현";
      return "중간";
    }

    function draw() {
      var R = range(), rad = a * Math.PI / 180;
      ctx.clearRect(0, 0, W, H);
      /* ── 왼쪽: 배치 ── */
      var LW = 470, cx = 214, cy = 206, orb = 120;
      K.stage(ctx, 0, 0, LW, H, "space", { seed: 63, title: "태양 · 지구 · 달의 배치" });
      K.warn(ctx, LW - 14, 30, "⚠ 크기·거리·부풂은 과장", "right");
      /* 햇빛 */
      var sl = ctx.createLinearGradient(LW - 30, 0, 0, 0); sl.addColorStop(0, "rgba(255,211,107,.13)"); sl.addColorStop(1, "rgba(255,211,107,0)"); ctx.fillStyle = sl; ctx.fillRect(0, 60, LW, 290);
      K.sun(ctx, LW - 30, cy, 18);
      K.pill(ctx, "태양 쪽 ←빛", LW - 14, cy + 66, { a: "right", s: 11, c: KC.yellow, box: [0, LW] });
      ctx.strokeStyle = "rgba(200,210,255,.35)"; ctx.lineWidth = 1.3; ctx.setLineDash([4, 5]);
      ctx.beginPath(); ctx.arc(cx, cy, orb, 0, 6.2832); ctx.stroke(); ctx.setLineDash([]);
      /* 태양이 만드는 몫(가로) + 합쳐진 부풂(달 쪽으로) */
      ctx.strokeStyle = "rgba(255,211,107,.6)"; ctx.lineWidth = 1.4; ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.ellipse(cx, cy, 44, 30, 0, 0, 6.2832); ctx.stroke(); ctx.setLineDash([]);
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(-rad);
      var bg = ctx.createRadialGradient(0, 0, 20, 0, 0, 34 + R * 4.2);
      bg.addColorStop(0, "rgba(63,211,163,.55)"); bg.addColorStop(1, "rgba(63,211,163,.12)");
      ctx.fillStyle = bg; ctx.beginPath(); ctx.ellipse(0, 0, 34 + R * 4.2, 30, 0, 0, 6.2832); ctx.fill();
      ctx.strokeStyle = KC.green; ctx.lineWidth = 2; ctx.stroke();
      ctx.restore();
      K.earth(ctx, cx, cy, 26);
      ctx.fillStyle = "rgba(4,6,20,.55)"; ctx.beginPath(); ctx.arc(cx, cy, 26, Math.PI / 2, Math.PI * 1.5); ctx.fill();
      /* 달: 태양 쪽 반이 밝다 */
      var mx = cx + orb * Math.cos(rad), my = cy - orb * Math.sin(rad);
      K.planet(ctx, mx, my, 12, "#e4e6ee", "#6b7088");
      ctx.fillStyle = "rgba(4,6,20,.72)"; ctx.beginPath(); ctx.arc(mx, my, 12.4, Math.PI / 2, Math.PI * 1.5); ctx.fill();
      K.pill(ctx, "달", mx, my - 20, { a: "center", s: 11, c: KC.ink, box: [0, LW] });
      var ph = phase();
      K.pill(ctx, ph + " · " + a + "°", cx, 372, { a: "center", s: 13, c: ph === "중간" ? KC.mute : KC.green, box: [0, LW] });
      K.t(ctx, "초록 = 바닷물이 부푼 모양 · 노란 점선 = 태양의 몫", cx, 398, { s: 10.5, a: "center", c: KC.mute });
      /* ── 오른쪽: 조위 곡선 ── */
      var RX = LW + 8;
      K.stage(ctx, RX, 0, W - RX, H, "lab", { seed: 65, title: "인천 관측소의 하루 조위 곡선" });
      var gph = K.chart(ctx, { x: RX + 4, y: 70, w: W - RX - 10, h: 280, x0: 0, x1: 24, y0: -5, y1: 5, xt: 4, yt: 5, xl: "시각", yl: "조위(m)", xf: function (v) { return v + "시"; } });
      var pts = [];
      for (var t = 0; t <= 24.01; t += 0.2) pts.push([t, R / 2 * Math.cos(2 * Math.PI * (t - HIGH) / PERIOD)]);
      K.line(ctx, { x: gph.L, y: gph.Y(0) }, { x: gph.R, y: gph.Y(0) }, "rgba(200,210,255,.4)", 1, [3, 3]);
      K.plot(ctx, gph, pts, KC.blue);
      var col = R >= 7.9 ? KC.red : (R <= 3.6 ? KC.green : KC.ink);
      K.line(ctx, { x: gph.L, y: gph.Y(R / 2) }, { x: gph.R, y: gph.Y(R / 2) }, "rgba(255,211,107,.6)", 1.2, [5, 4]);
      K.line(ctx, { x: gph.L, y: gph.Y(-R / 2) }, { x: gph.R, y: gph.Y(-R / 2) }, "rgba(255,211,107,.6)", 1.2, [5, 4]);
      var bxx = gph.X(HIGH + PERIOD / 2) + 26;
      ctx.strokeStyle = KC.yellow; ctx.lineWidth = 2; ctx.beginPath();
      ctx.moveTo(bxx - 5, gph.Y(R / 2)); ctx.lineTo(bxx, gph.Y(R / 2)); ctx.lineTo(bxx, gph.Y(-R / 2)); ctx.lineTo(bxx - 5, gph.Y(-R / 2)); ctx.stroke();
      K.pill(ctx, "조차 " + R.toFixed(2) + " m", W - 16, 58, { a: "right", s: 14, c: col });
      [HIGH, HIGH + PERIOD].forEach(function (th) { K.glow(ctx, gph.X(th), gph.Y(R / 2), 3, "rgba(127,211,255,.95)", 3); });
      K.t(ctx, "하루에 만조·간조가 두 번씩 (주기 12시간 25분)", RX + 16, 380, { s: 10.5, c: KC.mute });
      K.t(ctx, "물때는 날마다 약 50분씩 늦어집니다", RX + 16, 400, { s: 10.5, c: KC.mute });
      $("d-ph-info").innerHTML =
        "달의 위치 <b>" + a + "°</b> — " + phase() + " · 인천의 조차 <b>" + R.toFixed(2) + " m</b>.<br>" +
        "달의 기조력을 1.00이라 하면 태양은 0.46입니다. 두 힘이 <b>한 줄로 늘어서면(삭·망)</b> 더해져 조차가 가장 커지고(<b>사리</b>), <b>직각을 이루면(상현·하현)</b> 서로 깎아 조차가 가장 작아집니다(<b>조금</b>). " +
        (R >= 7.9 ? "✅ 지금이 사리입니다." : (R <= 3.6 ? "✅ 지금이 조금입니다." : "사리나 조금이 되도록 달을 더 돌려 보세요."));

      var ch = false;
      if (R >= 7.9 && !got.a) { got.a = true; ch = true; }
      if (R <= 3.6 && !got.b) { got.b = true; ch = true; }
      if (ch) { window.sthState("dPh", got); mission(); }
    }
    function mission() {
      if (got.a) done("mD3a");
      if (got.b) done("mD3b");
      if (got.a && got.b) {
        window.sthMission("mD3", true, "<span class='m-tag'>미션 완료</span><b>0°(삭)와 180°(망)</b>에서 사리, <b>90°(상현)와 270°(하현)</b>에서 조금입니다. 달의 위상만 보면 물때를 알 수 있습니다.");
        ep.clear(2);
      }
    }
    canvas._redraw = draw;
    $("d-ph-a").addEventListener("input", function (e) { a = +e.target.value; $("d-ph-a-val").textContent = a + "°"; draw(); });
    draw(); mission();
    if (ep.cleared(2)) window.sthMission("mD3", true);
  })();

  /* 장면 4 — 지역별 조석 양상과 바닷길 시각 */
  (function () {
    var canvas = $("d-road"); if (!canvas) return;
    var ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var place = "mo", tm = 0, FLOOR = -1.7;
    var ST = { "in": { n: "인천", R: 8.1 }, "mo": { n: "목포", R: 4.0 }, "mu": { n: "묵호", R: 0.3 } };

    function level(t) { return ST[place].R / 2 * Math.cos(2 * Math.PI * (t - HIGH) / PERIOD); }

    function draw() {
      var lv = level(tm), open = lv < FLOOR, t, k;
      ctx.clearRect(0, 0, W, H);
      /* ── 왼쪽: 조위 곡선 ── */
      var LW = 604;
      K.stage(ctx, 0, 0, LW, H, "lab", { seed: 67, title: ST[place].n + " 관측소 — 사리 때의 조위 곡선 (조차 " + ST[place].R.toFixed(1) + " m)" });
      var g = K.chart(ctx, { x: 4, y: 50, w: LW - 12, h: 270, x0: 0, x1: 24, y0: -5, y1: 5, xt: 4, yt: 5, xl: "시각", yl: "조위(m)", xf: function (v) { return v + "시"; } });
      var fy = g.Y(FLOOR);
      /* 바닥이 드러나는 구간: 곡선과 등성이 사이 */
      ctx.fillStyle = "rgba(63,211,163,.30)"; ctx.beginPath(); var on = false;
      for (t = 0; t <= 24.001; t += 0.05) {
        var lt = level(t), px = g.X(t);
        if (lt < FLOOR) { if (!on) { ctx.moveTo(px, fy); on = true; } ctx.lineTo(px, g.Y(lt)); }
        else if (on) { ctx.lineTo(px, fy); ctx.closePath(); on = false; }
      }
      if (on) { ctx.lineTo(g.X(24), fy); ctx.closePath(); }
      ctx.fill();
      K.line(ctx, { x: g.L, y: fy }, { x: g.R, y: fy }, KC.red, 2, [7, 5]);
      K.pill(ctx, "바닷길 등성이 −1.7 m", g.L + 8, fy - 8, { s: 10.5, c: KC.red });
      var pts = [];
      for (t = 0; t <= 24.001; t += 0.2) pts.push([t, level(t)]);
      K.plot(ctx, g, pts, KC.blue);
      var mx = g.X(tm), my = g.Y(lv);
      K.line(ctx, { x: mx, y: g.T }, { x: mx, y: g.B }, KC.yellow, 2);
      K.glow(ctx, mx, my, 5, "rgba(255,211,107,.98)", 3.4);
      K.pill(ctx, tm.toFixed(2) + "시 · " + lv.toFixed(2) + " m", mx + (tm > 16 ? -10 : 10), Math.max(g.T + 16, Math.min(g.B - 10, my - 12)), { s: 11, a: tm > 16 ? "right" : "left", c: KC.yellow, box: [0, LW] });
      K.pill(ctx, open ? "✅ 바닥이 물 밖으로 드러났습니다" : "아직 물에 잠겨 있습니다 (바닥보다 " + (lv - FLOOR).toFixed(2) + " m 높은 물)", 16, 356, { s: 12, c: open ? KC.green : KC.mute, box: [0, LW] });
      K.t(ctx, "초록 구간 = 바닥이 드러나는 시간대", 16, 384, { s: 11, c: KC.mute });
      /* ── 오른쪽: 바닷길 단면 ── */
      var RX = LW + 8, RW = W - RX, base = 262;
      K.stage(ctx, RX, 0, RW, H, "sky", { seed: 69 });
      K.pill(ctx, "지금 바닷길의 모습", RX + 14, 28, { s: 12.5, c: KC.ink });
      ctx.save(); ctx.beginPath(); ctx.roundRect(RX, 0, RW, H, 14); ctx.clip();
      /* 등성이(모래) */
      ctx.beginPath(); ctx.moveTo(RX, 330); ctx.quadraticCurveTo(RX + RW / 2, base - 36, W, 330); ctx.lineTo(W, H); ctx.lineTo(RX, H); ctx.closePath();
      var sd = ctx.createLinearGradient(0, base, 0, H); sd.addColorStop(0, "#e6c995"); sd.addColorStop(1, "#8f6b3e"); ctx.fillStyle = sd; ctx.fill();
      grains(ctx, RX, base - 20, RW, H - base + 20, 21, 120);
      /* 물 */
      var wl = clamp(278 - (lv - FLOOR) * 26, 120, 380);
      ctx.fillStyle = waterGrad(ctx, wl, H, .55); ctx.fillRect(RX, wl, RW, H - wl);
      ctx.strokeStyle = "#e9f7ff"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(RX, wl); ctx.lineTo(W, wl); ctx.stroke();
      /* 양쪽 섬 */
      [[RX - 10, RX + 58, 168, "회동리"], [W - 58, W + 10, 160, "모도"]].forEach(function (q) {
        ctx.beginPath(); ctx.moveTo(q[0], H); ctx.lineTo(q[0], q[2] + 20); ctx.quadraticCurveTo((q[0] + q[1]) / 2, q[2] - 30, q[1], q[2] + 30); ctx.lineTo(q[1] + 20, H); ctx.closePath();
        ctx.fillStyle = landGrad(ctx, q[0], q[2], q[1], H); ctx.fill();
      });
      if (open) {
        for (k = 0; k < 5; k++) {
          var hx = RX + 78 + k * 30, hy = 278 + Math.pow((hx - RX - RW / 2) / (RW / 2), 2) * 52;
          ctx.fillStyle = ["#ff6b81", "#ffd36b", "#7fd3ff", "#3fd3a3", "#b69cff"][k];
          ctx.beginPath(); ctx.arc(hx, hy - 14, 3.4, 0, 6.2832); ctx.fill(); ctx.fillRect(hx - 3, hy - 10, 6, 10);
        }
      }
      ctx.restore();
      K.pill(ctx, "회동리", RX + 24, 140, { a: "center", s: 10.5, c: KC.ink, box: [RX, W] });
      K.pill(ctx, "모도", W - 24, 132, { a: "center", s: 10.5, c: KC.ink, box: [RX, W] });
      if (!open) K.pill(ctx, "물 깊이 " + (lv - FLOOR).toFixed(2) + " m", RX + RW / 2, Math.max(64, wl - 12), { a: "center", s: 11.5, c: KC.blue });
      else K.pill(ctx, "🚶 길이 드러났습니다", RX + RW / 2, 92, { a: "center", s: 12.5, c: KC.green });
      K.pill(ctx, "바닷길 등성이 (평균 해면 −1.7 m)", RX + RW / 2, H - 14, { s: 10.5, a: "center", c: "#e8d6bd", box: [RX, W] });
      $("d-road-info").innerHTML =
        "<b>" + ST[place].n + "</b> — 사리 때 조차 <b>" + ST[place].R.toFixed(1) + " m</b>. 지금은 <b>" + tm.toFixed(2) + "시</b>, 조위 <b>" + lv.toFixed(2) + " m</b>입니다.<br>" +
        (ST[place].R / 2 < -FLOOR
          ? "이 관측소는 사리 때라도 조위가 −" + (ST[place].R / 2).toFixed(2) + " m까지밖에 내려가지 않습니다. 등성이(−1.7 m)가 드러날 수 없습니다."
          : (open ? (place === "mo" ? "✅ 바닷길이 드러났습니다! 이 시간대에 축제를 열면 됩니다." : "✅ 이 바다라면 드러납니다. 다만 진도의 물때는 가까운 <b>목포</b> 자료로 봐야 합니다.")
            : "이 관측소에서는 드러날 수 있습니다. 조위가 −1.7 m보다 낮아지는 시각(간조 무렵)을 찾아보세요."));

      if (place === "mo" && open && !ep.cleared(3)) {
        window.sthState("dRoad", tm.toFixed(2) + "시");
        window.sthMission("mD4", true, "<span class='m-tag'>미션 완료</span><b>목포</b> 자료로 " + tm.toFixed(2) + "시. 같은 사리라도 조차가 충분히 큰 곳에서만 바닷길이 드러납니다. 조차가 0.3 m인 묵호 같은 동해안에서는 아무리 기다려도 열리지 않고, 조차가 8 m인 인천에서는 훨씬 넓은 갯벌이 드러납니다.");
        ep.clear(3);
      }
    }
    canvas._redraw = draw;
    $("d-road-t").addEventListener("input", function (e) { tm = +e.target.value; $("d-road-t-val").textContent = tm.toFixed(2) + "시"; draw(); });
    var pb = document.querySelectorAll("#d-road-sp button");
    Array.prototype.forEach.call(pb, function (b) {
      b.addEventListener("click", function () {
        place = b.getAttribute("data-p");
        Array.prototype.forEach.call(pb, function (x) { x.classList.toggle("on", x === b); });
        draw();
      });
    });
    window.sthPick({
      mount: "d-pick",
      q: "인천의 조차는 약 8 m인데 묵호는 약 0.3 m입니다. 같은 달이 잡아당기는데 왜 이렇게 다를까요?",
      options: [
        "서해는 수심이 얕고 만이 좁아지면서 조석파가 증폭되기 때문",
        "서해가 동해보다 달에 더 가깝기 때문",
        "동해에는 달의 기조력이 거의 닿지 않기 때문",
        "서해의 바닷물이 더 무겁기 때문"
      ],
      answer: 0,
      why: [
        "맞습니다. 얕고 좁아지는 바다에서는 밀려든 조석파가 빠져나가지 못하고 겹쳐 높아집니다. 그래서 서해안의 조차가 큽니다.",
        "지구에서 본 달까지의 거리는 서해나 동해나 사실상 같습니다.",
        "기조력은 지구 전체에 작용합니다. 차이를 만드는 것은 바다의 모양과 깊이입니다.",
        "바닷물의 밀도 차이는 조차를 수 m씩 바꿀 만큼 크지 않습니다."
      ],
      onDone: function () { window.sthState("dPick", 1); }
    });
    draw();
    if (ep.cleared(3)) window.sthMission("mD4", true);
  })();

  function finish() {
    window.sthState("r4", "해결 · 목포(진도) " + (window.sthState("dRoad") || "-") + " 사리 간조에 길이 열림");
  }
  endScene(ep, 4, function () {
    var p = window.sthState("pD1") || "";
    $("d-vs").innerHTML = "<b>나의 첫 추측</b> " + (p || "기록 없음") +
      (p.indexOf("㉡") === 0 ? " — 정확했습니다. 배치가 날짜를, 바다 모양이 장소를 정합니다." : " — 날씨가 아니라 태양·지구·달의 배치와 그 바다의 모양이 정합니다.") +
      "<br><b>내가 찾은 시각</b> " + (window.sthState("dRoad") || "-") + " (목포 관측소 · 진도 바닷길)";
  });

  window.sthWork({
    mount: "wkD", unitLabel: "[지구시스템과학 Ⅱ-1] 이야기 ④ 바다가 갈라지는 날",
    items: [
      { id: "dw1", label: "축제 안내문에 넣을 설명", hint: "왜 그날 그 시각에만 길이 열리는지, 사리·조금·간조라는 말을 넣어 방문객이 이해할 수 있게 쓰세요." },
      { id: "dw2", label: "인천과 묵호는 왜 다른가", hint: "같은 날, 같은 달인데 조차가 8 m와 0.3 m로 다른 까닭을 조위 자료를 근거로 설명하세요." }
    ]
  });
})();

/* ========================================================================= 05 정리하기 */
window.sthWork({
  mount: "wk", unitLabel: "[지구시스템과학 Ⅱ-1] 해수의 운동 — 정리",
  recap: [
    { key: "r1", label: "① 고무 오리 2만 8천 개" },
    { key: "r2", label: "② 사흘 뒤의 파도" },
    { key: "r3", label: "③ 26분" },
    { key: "r4", label: "④ 바다가 갈라지는 날" },
    { key: "rQuiz", label: "수준별 문제" },
    { key: "rLab", label: "응용 실험실" },
    { key: "rInq", label: "교과서 실험" },
    { key: "rReal", label: "실제 자료" }
  ],
  items: [
    { id: "all", label: "네 사건을 꿰는 한 문장", hint: "오리를 나른 지형류, 대회장에 닿은 너울, 26분 만에 온 지진 해일, 갈라진 바다. 네 이야기에 공통으로 들어 있는 생각을 ‘힘’과 ‘움직임’이라는 말을 넣어 쓰세요." },
    { id: "w3", label: "아직 헷갈리는 것", hint: "다음 시간에 여기서부터 시작합니다." }
  ]
});

/* ========================================================================= 06 우리 반 */
window.sthShare({
  mount: "share", unit: "esys-2-1", unitLabel: "[지구시스템과학 Ⅱ-1] 해수의 운동",
  rows: [
    { key: "r1", label: "① 고무 오리 2만 8천 개" },
    { key: "r2", label: "② 사흘 뒤의 파도" },
    { key: "r3", label: "③ 26분" },
    { key: "r4", label: "④ 바다가 갈라지는 날" },
    { key: "rQuiz", label: "수준별 문제" },
    { key: "rLab", label: "응용 실험실" },
    { key: "rInq", label: "교과서 실험" },
    { key: "rReal", label: "실제 자료" }
  ],
  line: { id: "all", label: "네 사건을 꿰는 한 문장" }
});

})();
