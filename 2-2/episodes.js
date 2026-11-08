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

/* ---- 스튜디오 + 블록 모형 공용 도구 (지침 _tools/STUDIO_GUIDE.md) ---- */
var LT = K.LT;
function studioOpen(ctx, LW, H, floor, x0) {
  x0 = x0 || 0;
  K.studio(ctx, x0, 0, LW, H, floor);
  ctx.save(); ctx.beginPath(); ctx.roundRect(x0, 0, LW, H, 14); ctx.clip();
}
function judgeCard(ctx, RX, W, H, head, col, side) {
  K.card(ctx, RX, 0, W - RX, H, "판정");
  K.t(ctx, head, RX + 18, 64, { s: 22, w: "900", c: col || LT.ink });
  if (side) K.t(ctx, side, W - 18, 28, { s: 11.5, w: "800", a: "right", c: LT.mute });
}
function note(ctx, s, x, y, o) { o = o || {}; K.t(ctx, s, x, y, { s: o.s || 11.5, w: o.w || "700", a: o.a, c: o.c || LT.mute }); }
/* 투명 아크릴 큐브(진열장) 속 우주 — 밝은 스튜디오 위 받침대에 놓고 큐브 안만 짙은 남색으로 칠한다.
   var cb = spaceCube(ctx, { x, y, w, h, d, seed });  앞면 사각형 (x, y, w, h), 깊이 d 만큼 오른쪽 위로 들어간다.
   cb.inside(function () { … 큐브 속 그림 … }); cb.glass();   // 유리 반사·모서리는 맨 나중에
   바닥 그림자: K.studio(ctx, 0, 0, LW, H, cubeFloor(같은 o)) */
function cubeFloor(o) { var d = o.d == null ? 28 : o.d; return { x: o.x + o.w / 2 + d / 2, y: o.y + o.h + 18, rx: o.w * .62, ry: 24 }; }
function spaceCube(ctx, o) {
  var x = o.x, y = o.y, w = o.w, h = o.h, dx = o.d == null ? 28 : o.d, dy = dx * .62, PZ = 14, M = 8;
  var hull = [[x, y + h], [x, y], [x + dx, y - dy], [x + w + dx, y - dy], [x + w + dx, y + h - dy], [x + w, y + h]];
  function poly(pts) { ctx.beginPath(); pts.forEach(function (p, i) { if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); }); ctx.closePath(); }
  var bx0 = x - M, bx1 = x + w + M, by = y + h + 2;
  poly([[bx0, by], [bx1, by], [bx1 + dx, by - dy], [bx0 + dx, by - dy]]); ctx.fillStyle = "#f4f6f9"; ctx.fill();
  var pg = ctx.createLinearGradient(0, by, 0, by + PZ); pg.addColorStop(0, "#dde2ea"); pg.addColorStop(1, "#aab3c1");
  poly([[bx0, by], [bx1, by], [bx1, by + PZ], [bx0, by + PZ]]); ctx.fillStyle = pg; ctx.fill();
  poly([[bx1, by], [bx1 + dx, by - dy], [bx1 + dx, by - dy + PZ], [bx1, by + PZ]]); ctx.fillStyle = "#8f99a8"; ctx.fill();
  poly(hull);
  var g = ctx.createLinearGradient(x, y - dy, x + w * .4, y + h); g.addColorStop(0, "#0a0f2e"); g.addColorStop(1, "#1c2459");
  ctx.fillStyle = g; ctx.fill();
  ctx.save(); poly(hull); ctx.clip();
  var R = K.rng(o.seed || 7), n = Math.round(w * h / 1300), i;
  for (i = 0; i < 4; i++) { var nx = x + R() * w, ny = y + R() * h, nr = 80 + R() * 120, ng = ctx.createRadialGradient(nx, ny, 0, nx, ny, nr); ng.addColorStop(0, "rgba(140,130,230,.14)"); ng.addColorStop(1, "rgba(140,130,230,0)"); ctx.fillStyle = ng; ctx.fillRect(x, y - dy, w + dx, h + dy); }
  for (i = 0; i < n; i++) { var m = R(); ctx.globalAlpha = .3 + R() * .6; ctx.fillStyle = m > .95 ? "#ffe2b8" : "#ffffff"; ctx.beginPath(); ctx.arc(x + R() * (w + dx), y - dy + R() * (h + dy), m > .98 ? 1.6 : m > .9 ? 1.1 : .65, 0, 6.2832); ctx.fill(); }
  ctx.globalAlpha = 1;
  ctx.strokeStyle = "rgba(190,210,255,.24)"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x + dx, y - dy); ctx.lineTo(x + dx, y + h - dy); ctx.lineTo(x + w + dx, y + h - dy); ctx.moveTo(x + dx, y + h - dy); ctx.lineTo(x, y + h); ctx.stroke();
  ctx.restore();
  return {
    box: [x, x + w], x: x, y: y, w: w, h: h, dx: dx, dy: dy,
    inside: function (fn) { ctx.save(); poly(hull); ctx.clip(); fn(); ctx.restore(); },
    glass: function () {
      poly([[x, y], [x + dx, y - dy], [x + w + dx, y - dy], [x + w, y]]); ctx.fillStyle = "rgba(255,255,255,.16)"; ctx.fill();
      poly([[x + w, y], [x + w + dx, y - dy], [x + w + dx, y + h - dy], [x + w, y + h]]); ctx.fillStyle = "rgba(210,225,255,.10)"; ctx.fill();
      ctx.save(); poly([[x, y], [x + w, y], [x + w, y + h], [x, y + h]]); ctx.clip();
      var rg = ctx.createLinearGradient(x, y, x + w * .5, y + h * .9);
      rg.addColorStop(0, "rgba(255,255,255,.13)"); rg.addColorStop(.28, "rgba(255,255,255,.03)"); rg.addColorStop(.31, "rgba(255,255,255,.10)"); rg.addColorStop(.36, "rgba(255,255,255,0)"); rg.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = rg; ctx.fillRect(x, y, w, h); ctx.restore();
      ctx.lineJoin = "round"; ctx.strokeStyle = "rgba(255,255,255,.92)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.rect(x, y, w, h); ctx.moveTo(x, y); ctx.lineTo(x + dx, y - dy); ctx.lineTo(x + w + dx, y - dy); ctx.lineTo(x + w, y); ctx.moveTo(x + w + dx, y - dy); ctx.lineTo(x + w + dx, y + h - dy); ctx.lineTo(x + w, y + h); ctx.stroke();
      ctx.strokeStyle = "rgba(40,60,100,.38)"; ctx.lineWidth = 1; poly(hull); ctx.stroke(); ctx.lineJoin = "miter";
    }
  };
}
/* 입체 공의 밤 쪽: sa = 빛(태양)이 오는 쪽 각(라디안, 0 = 오른쪽) */
function nightSide(ctx, x, y, r, sa, a) {
  var c = Math.cos(sa), s = Math.sin(sa), ng = ctx.createLinearGradient(x + c * r, y + s * r, x - c * r, y - s * r);
  ng.addColorStop(0, "rgba(3,6,24,0)"); ng.addColorStop(.44, "rgba(3,6,24,0)"); ng.addColorStop(.58, "rgba(3,6,24," + (a * .85).toFixed(2) + ")"); ng.addColorStop(1, "rgba(3,6,24," + a + ")");
  ctx.fillStyle = ng; ctx.beginPath(); ctx.arc(x, y, r + .5, 0, 6.2832); ctx.fill();
}
/* 입체 공(달·행성): 빛 받는 쪽이 밝고 반대쪽은 밤 */
function litBall(ctx, x, y, r, base, dark, sa, night) {
  var g = ctx.createRadialGradient(x + Math.cos(sa) * r * .42, y + Math.sin(sa) * r * .42 - r * .18, r * .06, x, y, r * 1.05);
  g.addColorStop(0, "rgba(255,255,255,.95)"); g.addColorStop(.24, base); g.addColorStop(1, dark);
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill();
  if (night !== 0) nightSide(ctx, x, y, r, sa, night == null ? .66 : night);
}
/* 입체 달: 공 + 운석 구덩이 + 밤 쪽 */
function moon3d(ctx, x, y, r, sa) {
  litBall(ctx, x, y, r, "#e4e6ee", "#5d6276", sa, 0);
  var cr = K.rng(5); for (var i = 0; i < 6; i++) { ctx.fillStyle = "rgba(60,64,80,.3)"; ctx.beginPath(); ctx.arc(x + (cr() - .5) * r * 1.1, y + (cr() - .5) * r * 1.1, r * (.08 + cr() * .12), 0, 6.2832); ctx.fill(); }
  nightSide(ctx, x, y, r, sa, .74);
}
/* 입체 지구: 바다·대륙·극지 얼음·밤 쪽·대기 테두리 */
function globe3d(ctx, x, y, r, sa) {
  var g = ctx.createRadialGradient(x + Math.cos(sa) * r * .4, y + Math.sin(sa) * r * .4 - r * .2, r * .08, x, y, r);
  g.addColorStop(0, "#d5f0ff"); g.addColorStop(.35, "#3b95e6"); g.addColorStop(1, "#0f327a");
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.clip();
  ctx.fillStyle = "rgba(96,178,96,.92)";
  [[.15, -.12, .42, .24, .6], [-.38, .3, .22, .3, -.3], [.42, .45, .2, .12, .2]].forEach(function (q) { ctx.beginPath(); ctx.ellipse(x + q[0] * r, y + q[1] * r, q[2] * r, q[3] * r, q[4], 0, 6.2832); ctx.fill(); });
  ctx.fillStyle = "rgba(255,255,255,.6)"; ctx.beginPath(); ctx.ellipse(x - .1 * r, y - .9 * r, .5 * r, .16 * r, 0, 0, 6.2832); ctx.fill();
  ctx.restore();
  nightSide(ctx, x, y, r, sa, .68);
  ctx.strokeStyle = "rgba(150,210,255,.8)"; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(x, y, r + 1.5, 0, 6.2832); ctx.stroke();
}
/* 부푼 바닷물(반투명 타원체): rx 늘어난 쪽 반지름, rot 회전, sa 빛 방향, green 이면 초록 */
function tideShell(ctx, x, y, rx, ry, rot, sa, green) {
  rot = rot || 0;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  var la = sa - rot, g = ctx.createRadialGradient(Math.cos(la) * rx * .35, Math.sin(la) * ry * .35 - ry * .3, 2, 0, 0, rx);
  if (green) { g.addColorStop(0, "rgba(230,255,245,.9)"); g.addColorStop(.5, "rgba(63,211,163,.6)"); g.addColorStop(1, "rgba(10,110,90,.8)"); }
  else { g.addColorStop(0, "rgba(230,248,255,.9)"); g.addColorStop(.5, "rgba(90,180,240,.6)"); g.addColorStop(1, "rgba(16,78,168,.8)"); }
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, 6.2832); ctx.fill();
  ctx.strokeStyle = green ? "rgba(150,245,210,.95)" : "rgba(175,228,255,.95)"; ctx.lineWidth = 1.8; ctx.stroke();
  ctx.restore();
}
/* 빛나는 입체 태양 */
function sun3d(ctx, x, y, r) { K.sun(ctx, x, y, r * 1.1); K.planet(ctx, x, y, r, "#fff3bf", "#f08c00"); }
function cacheLayer(canvas, W, H) {
  var off = null, key = null;
  return function (ctx, k, fn) {
    if (!off || key !== k || off.width !== canvas.width || off.height !== canvas.height) {
      off = off || document.createElement("canvas"); off.width = canvas.width; off.height = canvas.height;
      var c2 = off.getContext("2d"), dpr = canvas.width / W;
      c2.setTransform(dpr, 0, 0, dpr, 0, 0); c2.clearRect(0, 0, W, H);
      fn(c2); key = k;
    }
    ctx.drawImage(off, 0, 0, W, H);
  };
}
function mixc(a, b, f) {
  var A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16);
  var r = [16, 8, 0].map(function (s) { var p = (A >> s) & 255, q = (B >> s) & 255; return Math.round(p + (q - p) * clamp(f, 0, 1)); });
  return "rgb(" + r[0] + "," + r[1] + "," + r[2] + ")";
}
/* 블록 위 수평면(높이 z)에 지도처럼 그리기: fn 안에서는 월드 좌표 (x, y) 로 그린다. 글자는 넣지 않는다 */
function onPlane(ctx, I, z, fn) {
  var o = I.P(0, 0, z), px = I.P(1, 0, z), py = I.P(0, 1, z);
  ctx.save(); ctx.transform(px.x - o.x, px.y - o.y, py.x - o.x, py.y - o.y, o.x, o.y); fn(); ctx.restore();
}
/* 땅 받침: 대기 장면의 바닥이라 지층 단면 없이 얇은 단색 옆면, 윗면은 top 색 */
function soilBlock(ctx, I, zt, top, seed) {
  ["front", "right"].forEach(function (side) {
    I.face(ctx, side, function (Lw) {
      ctx.fillStyle = "#8a6a48"; ctx.fillRect(0, 0, Lw, zt);
    });
  });
  I.shade(ctx, "front", function () { return zt; }); I.shade(ctx, "right", function () { return zt; });
  I.plane(ctx, zt, top || "#86b35e");
}
/* 유리처럼 비치는 공기 기둥: 뒤쪽 벽(먼저)과 앞쪽 벽(나중) */
function glassBack(ctx, I, x0, y0, z0, x1, y1, z1, col) {
  I.quad(ctx, I.P(x0, y0, z0), I.P(x0, y1, z0), I.P(x0, y1, z1), I.P(x0, y0, z1), col || "rgba(120,180,240,.12)", "rgba(255,255,255,.55)");
  I.quad(ctx, I.P(x0, y0, z0), I.P(x1, y0, z0), I.P(x1, y0, z1), I.P(x0, y0, z1), col || "rgba(120,180,240,.16)", "rgba(255,255,255,.55)");
}
function glassFront(ctx, I, x0, y0, z0, x1, y1, z1, col) {
  I.quad(ctx, I.P(x0, y1, z0), I.P(x1, y1, z0), I.P(x1, y1, z1), I.P(x0, y1, z1), col || "rgba(150,200,250,.14)", "rgba(255,255,255,.7)");
  I.quad(ctx, I.P(x1, y0, z0), I.P(x1, y1, z0), I.P(x1, y1, z1), I.P(x1, y0, z1), col || "rgba(110,160,220,.2)", "rgba(255,255,255,.7)");
  I.quad(ctx, I.P(x0, y0, z1), I.P(x1, y0, z1), I.P(x1, y1, z1), I.P(x0, y1, z1), "rgba(255,255,255,.08)", "rgba(255,255,255,.75)");
}
/* 뭉게구름(입체 공 여럿). dark 0~1 */
function puffCloud(ctx, x, y, sc, dark, seed) {
  var R = K.rng(seed || 3), pts = [], i;
  for (i = 0; i < 9; i++) pts.push([(R() - .5) * 70 * sc, (R() - .5) * 16 * sc - (i % 3) * 6 * sc, (12 + R() * 10) * sc]);
  pts.sort(function (p, q) { return p[1] - q[1]; });
  ctx.save(); ctx.shadowColor = "rgba(20,30,60,.2)"; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
  pts.forEach(function (p) {
    var cx = x + p[0], cy = y + p[1], r = p[2], d = dark || 0;
    var g = ctx.createRadialGradient(cx - r * .35, cy - r * .45, r * .1, cx, cy, r);
    g.addColorStop(0, "#ffffff"); g.addColorStop(.55, mixc("#e6ebf3", "#7d8699", d)); g.addColorStop(1, mixc("#a9b4c6", "#454c5e", d));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.2832); ctx.fill();
  });
  ctx.restore();
}
/* 굵기가 값에 비례하는 에너지 화살표(값 이름표 포함) */
function flow(ctx, a, b, val, col, lab, side, box) {
  var w = 2 + val * .085;
  ctx.save(); ctx.shadowColor = col; ctx.shadowBlur = 6; K.arrow(ctx, a, b, col, w, 8 + w * .9); ctx.restore();
  if (lab) K.pill(ctx, lab, (a.x + b.x) / 2 + (side < 0 ? -w / 2 - 8 : w / 2 + 8), (a.y + b.y) / 2 + 4, { a: side < 0 ? "right" : "left", s: 11, c: "#ffffff", box: box });
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
    /* ── 대기 판 모형: 땅 블록(0~SZG) 위 대기(SZG~SZT), 오존층(SZO0~SZO1) ── */
    var SI = K.iso({ ox: 196, oy: 221, s: 0.8, L: 480, D: 110 }), SZG = 10, SZT = 156, SZO0 = SZT - 40, SZO1 = SZT - 12, SZW = SZG + 70;
    var SMOL = (function () {
      var R = K.rng(41), out = [], i;
      for (i = 0; i < 16; i++) out.push(["o3", 20 + R() * 440, 10 + R() * 90, SZO0 + 5 + R() * 18]);
      for (i = 0; i < 26; i++) out.push(["h2o", 20 + R() * 440, 10 + R() * 90, SZG + 8 + Math.pow(R(), 1.6) * 62]);
      for (i = 0; i < 18; i++) out.push(["co2", 20 + R() * 440, 10 + R() * 90, SZG + 10 + R() * (SZO0 - SZG - 20)]);
      out.sort(function (a, b) { return (a[1] + a[2]) - (b[1] + b[2]); });
      return out;
    })();
    /* 기체 분자(입체 공): 빨강 산소 · 검정 탄소 · 흰 수소. hot 이면 흡수 중(노란 빛) */
    function spMol(c, kind, p, sc, hot) {
      var r = 3.4 * sc;
      if (hot) K.glow(c, p.x, p.y, 3.6 * sc, "rgba(255,230,120,.95)", 3.4);
      if (kind === "h2o") { K.planet(c, p.x - 3.8 * sc, p.y + 2.4 * sc, r * .62, "#f8f9fa", "#868e96"); K.planet(c, p.x + 3.8 * sc, p.y + 2.4 * sc, r * .62, "#f8f9fa", "#868e96"); K.planet(c, p.x, p.y, r, "#ff6b6b", "#8a1c1c"); }
      else if (kind === "co2") { K.planet(c, p.x - 5.8 * sc, p.y, r * .9, "#ff6b6b", "#8a1c1c"); K.planet(c, p.x + 5.8 * sc, p.y, r * .9, "#ff6b6b", "#8a1c1c"); K.planet(c, p.x, p.y, r, "#495057", "#111111"); }
      else { K.planet(c, p.x - 4.4 * sc, p.y + 2.6 * sc, r * .85, "#ff8787", "#8a1c1c"); K.planet(c, p.x + 4.4 * sc, p.y + 2.6 * sc, r * .85, "#ff8787", "#8a1c1c"); K.planet(c, p.x, p.y - 1.6 * sc, r * .85, "#ff8787", "#8a1c1c"); }
    }
    /* 파장의 색: 자외선 보라 · 가시광선 무지개 · 근적외선 주황 · 적외선 자주 */
    function spCol(l) { return l < 0.4 ? "#9b5de5" : (l < 0.75 ? "hsl(" + Math.round(270 - (l - 0.4) / 0.35 * 270) + ",90%,52%)" : (l < 4 ? "#f76707" : "#d6336c")); }
    /* 빛줄기 세기: 위에서(태양 복사) 또는 아래에서(지구 복사) 출발해 층마다 흡수. [높이, 남은 비율] */
    function spProf(tt, up) {
      var N = 60, out = [], cum = 0, i, dz = (SZT - SZG) / N;
      for (i = 0; i <= N; i++) {
        var zz = up ? SZG + i * dz : SZT - i * dz;
        out.push([zz, Math.exp(-cum)]);
        var zm = up ? zz + dz / 2 : zz - dz / 2, d = 0;
        if (zm >= SZO0 && zm <= SZO1) d += tt.o3 / (SZO1 - SZO0);
        if (zm <= SZW) d += tt.h2o / (SZW - SZG);
        if (zm <= SZO0) d += (tt.co2 + tt.etc) / (SZO0 - SZG);
        cum += d * dz;
      }
      return out;
    }

    function draw() {
      var L = lamOf(sv), T = trans(L), t = tauOf(L), LW = 600, RX = 612;
      ctx.clearRect(0, 0, W, H);
      /* ── 왼쪽: 땅 블록 위 대기 판을 잘라 본 모형 — 고른 파장의 빛이 기체 분자를 지나며 얼마나 남는지 ── */
      var Lb = SI.L, Db = SI.D, BX = [0, LW], solar = L < 4;
      var fc = SI.P(Lb, Db, 0);
      studioOpen(ctx, LW, H, { x: fc.x - 150, y: fc.y - 40, rx: 300, ry: 46 });
      soilBlock(ctx, SI, SZG, "#86b35e", 11);
      glassBack(ctx, SI, 0, 0, SZG, Lb, Db, SZT, "rgba(150,190,240,.10)");
      var hot = { o3: t.o3 > 0.3, h2o: t.h2o > 0.3, co2: t.co2 > 0.3 };
      SMOL.forEach(function (m) { spMol(ctx, m[0], SI.P(m[1], m[2], m[3]), 1, hot[m[0]]); });
      /* 빛줄기: 위(태양 복사) 또는 아래(지구 복사)에서 출발해 층을 지날 때마다 약해진다 */
      var col = spCol(L), pr = spProf(t, !solar), xz = solar ? function (z) { return 270 + (z - SZG) / (SZT - SZG) * 60; } : function () { return 150; };
      var endI = pr[pr.length - 1][1], stopAt = null;
      if (!solar) { var gp = SI.P(150, 55, SZG); var gg = ctx.createRadialGradient(gp.x, gp.y, 2, gp.x, gp.y, 34); gg.addColorStop(0, "rgba(255,90,60,.6)"); gg.addColorStop(1, "rgba(255,90,60,0)"); ctx.fillStyle = gg; ctx.beginPath(); ctx.ellipse(gp.x, gp.y, 34, 15, 0, 0, 6.2832); ctx.fill(); }
      ctx.save(); ctx.lineCap = "round"; ctx.shadowColor = col; ctx.shadowBlur = 8;
      for (var i = 0; i < pr.length - 1; i++) {
        var I0 = pr[i][1]; if (I0 < 0.006) { stopAt = pr[i][0]; break; }
        var p0 = SI.P(xz(pr[i][0]), 55, pr[i][0]), p1 = SI.P(xz(pr[i + 1][0]), 55, pr[i + 1][0]);
        ctx.globalAlpha = .25 + .75 * I0; ctx.strokeStyle = col; ctx.lineWidth = 2.5 + 9 * I0;
        ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.stroke();
      }
      ctx.restore();
      if (stopAt != null) { var sp = SI.P(xz(stopAt), 55, stopAt); K.glow(ctx, sp.x, sp.y, 5, "rgba(255,236,150,.95)", 3.6); }
      if (solar && endI > 0.01) { var bp = SI.P(xz(SZG), 55, SZG); ctx.fillStyle = "rgba(255,244,190," + (.35 + .5 * endI).toFixed(2) + ")"; ctx.beginPath(); ctx.ellipse(bp.x, bp.y, 8 + 22 * endI, 3 + 8 * endI, 0, 0, 6.2832); ctx.fill(); }
      /* 앞쪽 유리: 층마다 옅은 색(대류권 하늘색 · 오존층 주황 · 성층권 보라) */
      ["front", "right"].forEach(function (side) {
        SI.face(ctx, side, function (Lw) {
          ctx.fillStyle = "rgba(140,190,245,.20)"; ctx.fillRect(0, SZG, Lw, SZO0 - SZG);
          ctx.fillStyle = "rgba(255,170,80,.28)"; ctx.fillRect(0, SZO0, Lw, SZO1 - SZO0);
          ctx.fillStyle = "rgba(170,150,235,.16)"; ctx.fillRect(0, SZO1, Lw, SZT - SZO1);
        });
      });
      glassFront(ctx, SI, 0, 0, SZG, Lb, Db, SZT, "rgba(255,255,255,.03)");
      /* 대기 밖: 태양에서 오는 빛 / 우주로 빠져나가는 빛 */
      var top = SI.P(xz(SZT), 55, SZT), sunP = SI.P(408, 55, SZT + 190);
      sun3d(ctx, sunP.x, sunP.y, 20);
      if (solar) { ctx.save(); ctx.shadowColor = col; ctx.shadowBlur = 10; K.line(ctx, sunP, top, col, 11.5, null, 1); ctx.restore(); }
      else if (endI > 0.01) { var out = SI.P(150, 55, SZT + 96); ctx.save(); ctx.globalAlpha = .3 + .7 * endI; ctx.shadowColor = col; ctx.shadowBlur = 8; K.arrow(ctx, top, out, col, 2.5 + 9 * endI, 12 + 8 * endI); ctx.restore(); }
      ctx.restore();
      SI.label(ctx, 0, Db, (SZO0 + SZO1) / 2, "오존층", -26, -4, "#ffd8a8", BX);
      SI.label(ctx, 0, Db, SZG + 34, "수증기·CO₂", -26, 4, "#a5d8ff", BX);
      SI.label(ctx, 0, Db, SZG / 2, "지표", -26, 8, "#d8f5a2", BX);
      var tagP = solar ? SI.P(xz(SZT - 10), 55, SZT - 10) : SI.P(150, 55, SZT + 50);
      K.pill(ctx, (solar ? "☀ " : "🌍 ") + L.toFixed(2) + " µm", tagP.x + 16, tagP.y + 4, { s: 12, c: "#ffe066", box: BX });
      var rp = solar ? SI.P(xz(SZG), 55, SZG) : SI.P(150, 55, SZT);
      K.pill(ctx, (solar ? "땅에 닿음 " : "우주로 ") + (T * 100).toFixed(1) + " %", rp.x + 22, rp.y + (solar ? 22 : -10), { s: 12, c: T > .5 ? "#b2f2bb" : "#ffc9c9", box: BX });
      var region = L < 0.4 ? "자외선" : (L < 0.75 ? "가시광선" : (L < 4 ? "근적외선" : ((L >= 8 && L <= 12) ? "적외선 · 대기의 창" : "적외선(지구 복사)")));
      K.bigText(ctx, "투과율 " + (T * 100).toFixed(1) + " %", 18, 50, 28, T > 0.5 ? "#8ce99a" : "#ffc9c9");
      K.bigText(ctx, "파장 " + L.toFixed(2) + " µm · " + region, 18, 82, 18, "#ffd35a");
      K.warn(ctx, LW - 14, 30, "⚠ 분자는 크게 그림", "right");
      K.pill(ctx, "빨강 = 산소 · 검정 = 탄소 · 흰색 = 수소 · 노란 빛 = 흡수 중", 14, H - 12, { s: 12, c: "#ffffff" });

      /* ── 판정 카드: 작은 투과율 그래프 + 기체별로 붙잡는 정도 ── */
      judgeCard(ctx, RX, W, H, T > 0.5 ? "거의 통과" : (T > 0.1 ? "일부만 통과" : "대기가 붙잡음"), T > 0.5 ? LT.green : (T > 0.1 ? LT.orange : LT.red), region);
      var px = RX + 18, px1 = W - 18, bw = px1 - px;
      var GX0 = RX + 50, GX1 = W - 20, GT = 100, GB = 196;
      function gx(l) { return GX0 + (Math.log(l) / Math.LN10 + 1) / 2.602 * (GX1 - GX0); }
      function gy(tt) { return GB - tt * (GB - GT); }
      ctx.fillStyle = "#ffffff"; ctx.fillRect(GX0, GT, GX1 - GX0, GB - GT);
      var x4 = gx(4);
      ctx.fillStyle = "rgba(245,159,0,.12)"; ctx.fillRect(GX0, GT, x4 - GX0, GB - GT);
      ctx.fillStyle = "rgba(112,72,232,.09)"; ctx.fillRect(x4, GT, GX1 - x4, GB - GT);
      ctx.fillStyle = "rgba(15,159,118,.16)"; ctx.fillRect(gx(8), GT, gx(12) - gx(8), GB - GT);
      [0, .5, 1].forEach(function (p) { K.line(ctx, { x: GX0, y: gy(p) }, { x: GX1, y: gy(p) }, LT.grid, 1); K.t(ctx, Math.round(p * 100) + "%", GX0 - 5, gy(p) + 4, { s: 10.5, a: "right", c: LT.mute, w: "600" }); });
      [0.1, 1, 10, 40].forEach(function (tk) { K.t(ctx, String(tk), gx(tk), GB + 22, { s: 10.5, a: "center", c: LT.mute, w: "600" }); });
      for (var qq = 0; qq <= 40; qq++) { var lq = 0.40 + qq / 40 * 0.35; ctx.fillStyle = "hsl(" + (270 - qq / 40 * 270) + ",90%,55%)"; ctx.fillRect(gx(lq), GB + 3, gx(lq + 0.009) - gx(lq) + 1, 6); }
      ctx.beginPath(); ctx.moveTo(gx(lamOf(0)), GB);
      for (var s = 0; s <= 260; s += 2) { var ll = lamOf(s); ctx.lineTo(gx(ll), gy(trans(ll))); }
      ctx.lineTo(gx(lamOf(260)), GB); ctx.closePath();
      ctx.fillStyle = "rgba(15,159,118,.22)"; ctx.fill(); ctx.strokeStyle = LT.green; ctx.lineWidth = 1.8; ctx.stroke();
      K.line(ctx, { x: GX0, y: GT }, { x: GX0, y: GB }, LT.line, 1.2); K.line(ctx, { x: GX0, y: GB }, { x: GX1, y: GB }, LT.line, 1.2);
      var cxm = gx(L);
      K.line(ctx, { x: cxm, y: GT }, { x: cxm, y: GB }, LT.red, 1.8, [4, 3]);
      ctx.fillStyle = "#ffffff"; ctx.strokeStyle = LT.red; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(cxm, gy(T), 5, 0, 6.2832); ctx.fill(); ctx.stroke();
      note(ctx, "☀ 태양 복사", (GX0 + x4) / 2, GT - 7, { a: "center", s: 11, c: LT.orange, w: "800" });
      note(ctx, "🌍 지구 복사", (x4 + GX1) / 2, GT - 7, { a: "center", s: 11, c: LT.violet, w: "800" });
      note(ctx, "파장 (µm, 로그 눈금) · 초록 띠 = 대기의 창", px, GB + 42, { s: 11 });
      note(ctx, "이 파장에서 각 기체가 붙잡는 정도", px, 266, { s: 11.5, c: LT.ink, w: "800" });
      [["오존·산소", t.o3, LT.violet], ["수증기", t.h2o, LT.blue], ["이산화 탄소", t.co2, LT.red], ["그 밖의 기체·산란", t.etc, LT.green]].forEach(function (r, i) {
        var y = 292 + i * 34;
        note(ctx, r[0], px, y, { s: 12, c: LT.ink, w: "800" });
        note(ctx, r[1] < 0.02 ? "거의 없음" : "흡수 " + r[1].toFixed(2), px1, y, { a: "right", s: 12, c: r[1] < 0.02 ? LT.dim : r[2], w: "900" });
        K.bar(ctx, px, y + 6, bw, r[1] < 0.02 ? 0 : clamp(r[1] / 6, 0.02, 1), r[2]);
      });
      K.tip(ctx, L < 0.30 ? "자외선은 오존이 막습니다" : (L <= 0.75 && L >= 0.4 ? "가시광선은 거의 그대로" : (L >= 8 && L <= 12 && T > .5 ? "지구 복사가 빠져나가는 창" : (L >= 5 ? "수증기·CO₂가 붙잡음 → 온실 효과" : "수증기가 띠 모양으로 흡수"))), px - 4, 428, W - px - 14, T > 0.5 ? true : null);
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
      var tc = teC(), abs = S * (1 - A / 100) / 4, i, k, LW = 520, RX = 532;
      ctx.clearRect(0, 0, W, H);
      /* ── 왼쪽: 밝은 스튜디오 위 아크릴 큐브 속 우주 — 대기 없는 행성(입체 공)과 들어오고 나가는 복사 ── */
      var CB = { x: 16, y: 118, w: 470, h: 234, d: 28, seed: 73 }, BX = [CB.x, CB.x + CB.w];
      K.studio(ctx, 0, 0, LW, H, cubeFloor(CB));
      var cb = spaceCube(ctx, CB);
      var cx = 316, cy = CB.y + CB.h / 2 + 2, R = 70, u = (tc + 120) / 180;
      var nr = Math.max(0, Math.round(A / 20)), pulse = .55 + .45 * Math.sin(eqT * 3);
      cb.inside(function () {
        for (i = 0; i < 5; i++) {
          var yy = cy - 76 + i * 38, xEnd = cx - Math.sqrt(Math.max(0, R * R - (yy - cy) * (yy - cy))) - 6;
          ctx.save(); ctx.shadowColor = KC.yellow; ctx.shadowBlur = 8; K.arrow(ctx, { x: CB.x + 12, y: yy }, { x: xEnd, y: yy }, KC.yellow, 2.8, 10); ctx.restore();
          var ph = ((eqT * .6 + i * .27) % 1); K.glow(ctx, CB.x + 12 + ph * (xEnd - CB.x - 22), yy, 2, "rgba(255,236,170,.95)", 3.4);
        }
        for (i = 0; i < nr; i++) {
          var ra = Math.PI + .55 + i * .28, sx = cx + R * Math.cos(ra), sy = cy + R * Math.sin(ra);
          K.arrow(ctx, { x: sx, y: sy }, { x: sx - 40, y: sy + 34 * Math.sin(ra) }, "rgba(232,236,255,.85)", 2.2, 8);
        }
        for (k = 0; k < 10; k++) {
          var ang = -Math.PI / 2 + k * Math.PI / 5;
          if (Math.cos(ang) < -.7) continue;
          ctx.save(); ctx.globalAlpha = .45 + .5 * pulse;
          K.arrow(ctx, { x: cx + (R + 8) * Math.cos(ang), y: cy + (R + 8) * Math.sin(ang) }, { x: cx + (R + 36) * Math.cos(ang), y: cy + (R + 36) * Math.sin(ang) }, KC.red, 2.6, 9);
          ctx.restore();
        }
        var halo = ctx.createRadialGradient(cx, cy, R * .8, cx, cy, R * 1.6);
        halo.addColorStop(0, heatCol(u, .35)); halo.addColorStop(1, heatCol(u, 0));
        ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(cx, cy, R * 1.6, 0, 6.2832); ctx.fill();
        K.planet(ctx, cx, cy, R, heatCol(u), "#1b1e33");
        var cr = K.rng(9); for (i = 0; i < 9; i++) { var qa = cr() * 6.28, qr = cr() * R * .75; ctx.fillStyle = "rgba(20,20,40,.18)"; ctx.beginPath(); ctx.arc(cx + qr * Math.cos(qa), cy + qr * Math.sin(qa), 3 + cr() * 7, 0, 6.2832); ctx.fill(); }
        nightSide(ctx, cx, cy, R, Math.PI, .42);
      });
      cb.glass();
      K.pill(ctx, "들어오는 태양 복사 " + S.toLocaleString() + " W/m²", CB.x + 10, CB.y + 22, { s: 12, c: KC.yellow, box: BX });
      K.pill(ctx, "반사 " + A + " %", cx - R - 40, cy + R + 24, { a: "right", s: 12, c: KC.ink, box: BX });
      K.pill(ctx, "내보내는 복사(적외선)", CB.x + CB.w - 8, CB.y + CB.h - 12, { a: "right", s: 12, c: "#ffb3c0", box: BX });
      K.bigText(ctx, "평형 온도 " + tc.toFixed(1) + " ℃", 18, 50, 28, tc >= -19.5 && tc <= -17.5 ? "#8ce99a" : "#ffffff");
      K.bigText(ctx, "받는 에너지 = 내보내는 에너지", 18, 82, 17, "#ffd35a");
      K.warn(ctx, LW - 14, H - 12, "⚠ 대기가 없다고 본 계산", "right");
      /* ── 오른쪽 판정 카드 ── */
      var hit = tc >= -19.5 && tc <= -17.5 ? "지구 조건 ✓" : (tc <= -50 ? "아주 춥다" : (tc >= 40 ? "아주 덥다" : tc.toFixed(1) + " ℃"));
      judgeCard(ctx, RX, W, H, hit, tc >= -19.5 && tc <= -17.5 ? LT.green : LT.ink, "T = [S(1−A)/4σ]^¼");
      var px = RX + 18, px1 = W - 18, bw = px1 - px;
      K.row(ctx, "태양 상수 S", S.toLocaleString() + " W/m²", px, px1, 100, LT.orange);
      K.row(ctx, "반사율 A", (A / 100).toFixed(2), px, px1, 124);
      K.row(ctx, "흡수 S(1−A)/4", abs.toFixed(1) + " W/m²", px, px1, 148);
      K.row(ctx, "복사 평형 온도", tc.toFixed(1) + " ℃ (" + teK().toFixed(0) + " K)", px, px1, 172, LT.blue);
      function xT(tt) { return px + clamp((tt + 120) / 180, 0, 1) * bw; }
      var tg = ctx.createLinearGradient(px, 0, px1, 0); tg.addColorStop(0, "#4c6ef5"); tg.addColorStop(.6, "#fcc419"); tg.addColorStop(1, "#fa5252");
      ctx.fillStyle = tg; ctx.beginPath(); ctx.roundRect(px, 192, bw, 12, 6); ctx.fill();
      [-120, -60, 0, 60].forEach(function (tt) { note(ctx, tt + "℃", xT(tt), 222, { a: tt === -120 ? "left" : "center", s: 10 }); });
      K.line(ctx, { x: xT(15), y: 186 }, { x: xT(15), y: 210 }, LT.red, 2);
      ctx.fillStyle = "#fff"; ctx.strokeStyle = LT.ink; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(xT(tc), 198, 7, 0, 6.2832); ctx.fill(); ctx.stroke();
      note(ctx, "빨간 선 = 실제 지구 평균 15 ℃", px, 242, { s: 10.5, c: LT.red });
      K.tip(ctx, tc >= -19.5 && tc <= -17.5 ? "✓ −18 ℃ — 실제보다 33 ℃ 낮다" : "지구(1,361 · 0.30)를 맞춰 보세요", px - 4, 254, W - px - 14, tc >= -19.5 && tc <= -17.5 ? true : null);
      note(ctx, "실제 값과 견주기", px, 314, { s: 11.5, c: LT.ink, w: "800" });
      note(ctx, "달 → −3.6 ℃ (실제 낮 120 · 밤 −170)", px, 336, { s: 10.5 });
      note(ctx, "지구 → −18.6 ℃ (실제 평균 15 ℃)", px, 356, { s: 10.5, c: LT.ink });
      note(ctx, "금성 → −46.5 ℃ (실제 약 464 ℃)", px, 376, { s: 10.5 });
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

    /* 장부 한 칸(카드 안) */
    function ledger(x, y, w, title, inc, out, diff) {
      var ok = Math.abs(diff) <= 1;
      ctx.fillStyle = ok ? "#e7f7f0" : "#f1f4f8"; ctx.beginPath(); ctx.roundRect(x, y, w, 70, 10); ctx.fill();
      ctx.fillStyle = ok ? LT.green : "#adb5bd"; ctx.beginPath(); ctx.roundRect(x, y, 5, 70, 3); ctx.fill();
      K.t(ctx, title, x + 14, y + 20, { s: 12, w: "900", c: LT.ink });
      K.t(ctx, ok ? "✓ 맞음" : (diff > 0 ? "지출 " + diff.toFixed(0) + " 모자람" : "지출 " + (-diff).toFixed(0) + " 많음"), x + w - 10, y + 20, { s: 11.5, w: "900", a: "right", c: ok ? LT.green : LT.orange });
      K.t(ctx, "수입 " + inc, x + 14, y + 42, { s: 10.5, w: "700", c: LT.mute });
      K.t(ctx, "지출 " + out, x + 14, y + 60, { s: 10.5, w: "700", c: LT.mute });
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      var LW = 600, RX = 612;
      var dTop = 100 - (30 + 8 + E);
      var dSfc = (45 + Rr) - (104 + 20 + 9);
      var dAtm = (25 + 96 + 20 + 9) - (E + Rr);
      var okTop = Math.abs(dTop) <= 1, okSfc = Math.abs(dSfc) <= 1, okAtm = Math.abs(dAtm) <= 1, all = okTop && okSfc && okAtm;
      /* ── 왼쪽: 우주 · 대기 · 지표 미니어처 단면 ── */
      studioOpen(ctx, LW, H);
      var YS = 122, AT = 206, AB = 342, GT = 408, GB = 454, X0 = 26, X1 = 584, DX = 26, DY = 16;
      /* 우주 띠 */
      var sp = ctx.createLinearGradient(0, 0, 0, AT); sp.addColorStop(0, "#1b2148"); sp.addColorStop(1, "#3a4a86");
      ctx.fillStyle = sp; ctx.beginPath(); ctx.roundRect(X0, 106, X1 - X0, AT - 106, 10); ctx.fill();
      var R0 = K.rng(4); for (var si = 0; si < 60; si++) { ctx.fillStyle = "rgba(255,255,255," + (.3 + R0() * .6).toFixed(2) + ")"; ctx.fillRect(X0 + R0() * (X1 - X0), 108 + R0() * (AT - 114), 1.4, 1.4); }
      /* 지표 블록(윗면 + 흙 단면) */
      ctx.fillStyle = "#86b35e"; ctx.beginPath(); ctx.moveTo(X0, GT); ctx.lineTo(X0 + DX, GT - DY); ctx.lineTo(X1 + DX - 10, GT - DY); ctx.lineTo(X1 - 10, GT); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#4a90c8"; ctx.beginPath(); ctx.moveTo(X0 + 300, GT); ctx.lineTo(X0 + 300 + DX, GT - DY); ctx.lineTo(X1 + DX - 10, GT - DY); ctx.lineTo(X1 - 10, GT); ctx.closePath(); ctx.fill();
      var sg = ctx.createLinearGradient(0, GT, 0, GB); sg.addColorStop(0, "#9b7a4f"); sg.addColorStop(1, "#4f3b29");
      ctx.fillStyle = sg; ctx.fillRect(X0, GT, X1 - 10 - X0, GB - GT);
      ctx.fillStyle = "#6d5236"; ctx.beginPath(); ctx.moveTo(X1 - 10, GT); ctx.lineTo(X1 + DX - 10, GT - DY); ctx.lineTo(X1 + DX - 10, GB - DY); ctx.lineTo(X1 - 10, GB); ctx.closePath(); ctx.fill();
      /* 대기층(유리 띠) + 구름 */
      var ag = ctx.createLinearGradient(0, AT, 0, AB); ag.addColorStop(0, "rgba(120,180,240,.28)"); ag.addColorStop(1, "rgba(160,210,250,.42)");
      ctx.fillStyle = ag; ctx.beginPath(); ctx.roundRect(X0, AT, X1 - X0, AB - AT, 10); ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,.8)"; ctx.lineWidth = 1.4; ctx.stroke();
      puffCloud(ctx, 150, 246, .55, .1, 3); puffCloud(ctx, 430, 236, .5, .15, 7);
      K.sun(ctx, X1 - 30, 140, 10); K.planet(ctx, X1 - 30, 140, 11, "#fff3bf", "#f08c00");
      ctx.restore();
      var BX = [0, LW];
      /* 에너지 흐름(굵기 = 양) */
      function up(x, y0, y1, v, col) { flow(ctx, { x: x, y: y0 }, { x: x, y: y1 }, v, col); }
      up(80, 110, AT - 4, 100, "#f59f00");                 /* 태양 100 */
      up(124, AT - 4, 110, 30, "#e9ecef");                 /* 반사 30 */
      up(168, 110, 262, 25, "#fab005");                    /* 대기 흡수 25 */
      up(214, 110, GT - 18, 45, "#fab005");                /* 지표 흡수 45 */
      up(268, GT - 18, AB - 30, 104, "#fa5252");           /* 지표 복사 104 */
      up(318, GT - 18, 110, 8, "#ff8787");                 /* 대기의 창 8 */
      up(360, GT - 18, AB - 26, 20, "#4dabf7");            /* 숨은열 20 */
      up(400, GT - 18, AB - 20, 9, "#ff922b");             /* 대류·전도 9 */
      up(462, AB - 30, GT - 18, Rr, okSfc ? "#12b886" : "#e8590c");  /* ② 재복사 */
      up(530, AT + 26, 110, E, okTop ? "#12b886" : "#e64980");       /* ① 방출 */
      [[80, "100", 96], [124, "30", 96], [168, "25", 96], [214, "45", 96], [318, "8", 96], [530, "①" + E, 96]].forEach(function (q) { K.pill(ctx, q[1], q[0], q[2], { a: "center", s: 11.5, c: "#ffffff", box: BX }); });
      [[268, "104"], [360, "20"], [400, "9"], [462, "②" + Rr]].forEach(function (q) { K.pill(ctx, q[1], q[0], GT + 30, { a: "center", s: 11.5, c: "#ffffff", box: BX }); });
      var names = [[80, "태양", 0], [124, "반사", 1], [168, "대기 흡수", 0], [214, "지표 흡수", 1], [268, "지표 복사", 0], [318, "대기의 창", 1], [360, "숨은열", 0], [400, "대류·전도", 1], [462, "재복사", 0], [530, "대기 방출", 1]];
      names.forEach(function (q) { K.t(ctx, q[1], q[0], H - 30 + q[2] * 16, { s: 10.5, w: "800", a: "center", c: LT.ink }); });
      K.pill(ctx, "우주", X0 + 10, 136, { s: 11, c: "#ffffff", box: BX });
      K.pill(ctx, "대기", X1 - 8, AT + 22, { a: "right", s: 11, c: "#ffffff", box: BX });
      K.pill(ctx, "지표", X1 - 8, GT - 24, { a: "right", s: 11, c: "#ffffff", box: BX });
      K.bigText(ctx, all ? "세 장부가 모두 맞았다" : "열수지 장부 맞추기", 18, 44, 26, all ? "#8ce99a" : "#ffffff");
      K.bigText(ctx, "지표가 받는 에너지 45 + " + Rr + " = " + (45 + Rr), 18, 72, 16, "#ffd35a");
      /* ── 오른쪽 카드: 세 장부 + 위도별 수지 ── */
      judgeCard(ctx, RX, W, H, all ? "복사 평형 ✓" : "장부 " + [okTop, okAtm, okSfc].filter(Boolean).length + " / 3 맞음", all ? LT.green : LT.ink, "태양 복사 = 100 단위");
      var px = RX + 12, cw = W - 12 - px;
      ledger(px, 80, cw, "🛰 대기권 밖", "태양 100", "30 + 8 + ①" + E + " = " + (38 + E), dTop);
      ledger(px, 156, cw, "☁ 대기", "25 + 96 + 20 + 9 = 150", "①" + E + " + ②" + Rr + " = " + (E + Rr), dAtm);
      ledger(px, 232, cw, "🌍 지표", "45 + ②" + Rr + " = " + (45 + Rr), "104 + 20 + 9 = 133", dSfc);
      function absorbed(l) { return 150 - 81 * Math.sin(l * Math.PI / 180); }
      K.t(ctx, "위도별 에너지 수지", px + 6, 330, { s: 12, w: "900", c: LT.ink });
      var g = K.chart(ctx, { x: px - 8, y: 338, w: cw + 10, h: 150, pl: 30, pb: 26, x0: 0, x1: 90, y0: 30, y1: 160, xt: 3, yt: 1, light: true, yf: function () { return ""; }, xf: function (v0) { return v0 === 0 ? "적도" : (v0 === 90 ? "극" : v0 + "°"); } });
      ctx.fillStyle = "rgba(224,49,49,.22)"; ctx.beginPath(); ctx.moveTo(g.X(0), g.Y(100));
      for (var l1 = 0; l1 <= 38.1; l1 += 2) ctx.lineTo(g.X(l1), g.Y(absorbed(l1)));
      ctx.lineTo(g.X(38.1), g.Y(100)); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "rgba(28,126,214,.2)"; ctx.beginPath(); ctx.moveTo(g.X(38.1), g.Y(100));
      for (var l2 = 38.1; l2 <= 90; l2 += 2) ctx.lineTo(g.X(l2), g.Y(absorbed(l2)));
      ctx.lineTo(g.X(90), g.Y(100)); ctx.closePath(); ctx.fill();
      var pa = []; for (var l3 = 0; l3 <= 90; l3 += 2) pa.push([l3, absorbed(l3)]);
      K.plot(ctx, g, pa, LT.orange, { light: true });
      K.plot(ctx, g, [[0, 100], [90, 100]], LT.violet, { light: true });
      K.t(ctx, "흡수", g.L + 6, g.Y(150) + 14, { s: 10.5, w: "800", c: LT.orange });
      K.t(ctx, "방출", g.R - 4, g.Y(100) - 6, { s: 10.5, w: "800", a: "right", c: LT.violet });
      K.t(ctx, "과잉", g.X(16), g.Y(112), { s: 10.5, w: "900", a: "center", c: LT.red });
      K.t(ctx, "부족", g.X(70), g.Y(84), { s: 10.5, w: "900", a: "center", c: LT.blue });
      K.arrow(ctx, { x: g.X(20), y: g.B - 10 }, { x: g.X(74), y: g.B - 10 }, LT.orange, 2.4, 9);
      K.t(ctx, "열 수송", g.X(47), g.B - 15, { s: 10, w: "800", a: "center", c: LT.orange });
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
    /* ── 아이소메트릭 블록 모형: x = 동해·영동(왼쪽 위) → 영서(오른쪽 아래), y = 산맥이 뻗은 방향.
          공기 덩어리는 앞면 가까이(y = YP)를 따라 산을 넘는다. 높이는 크게 과장(1,500 m ≈ 165 그림 단위). ── */
    var I = K.iso({ ox: 290, oy: 182, s: 0.8, L: 640, D: 180 });
    var BL = I.L, BD = I.D, ZB = 32, ZM = 0.11, XM = 330, YP = BD - 30;
    function zm(mm) { return ZB + mm * ZM; }
    function prof(x) {                       /* 공기가 지나는 길의 땅 높이(m): 동쪽은 가파르고 서쪽은 완만한 산맥 */
      if (x < 48) return -260 * Math.pow(1 - x / 48, 1.4);
      if (x < 110) return 0;
      if (x <= XM) return MH * Math.pow(Math.sin((x - 110) / (XM - 110) * Math.PI / 2), 1.6);
      if (x < 590) return MH * Math.pow(Math.cos((x - XM) / (590 - XM) * Math.PI / 2), 1.3);
      return 0;
    }
    function ridgeX(x, y) { return x - 16 * Math.sin((y - YP) / 40); }
    function hgt(x, y) {
      var dy = y - YP, h = prof(ridgeX(x, y));
      if (h > 0) h = Math.max(0, h * (0.93 + 0.07 * Math.cos(dy / 26)) + 45 * Math.sin(x / 19) * Math.cos(y / 15) * Math.min(1, h / 400));
      return h;
    }
    function zOf(x, y) { return zm(hgt(x, y)); }
    function faceZ(side) { return function (u) { return side === "front" ? zOf(u, BD) : zOf(BL, u); }; }
    function mixHex(a, b, f) {
      var A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16);
      var r = [16, 8, 0].map(function (s) { var p = (A >> s) & 255, q = (B >> s) & 255; return Math.round(p + (q - p) * f); });
      return "#" + ((1 << 24) + (r[0] << 16) + (r[1] << 8) + r[2]).toString(16).slice(1);
    }
    function landCol(dry) {
      return function (x, y, z, light) {
        var mm = (z - ZB) / ZM, c;
        if (mm < -5) c = "#5f6b72";                                         /* 바닷바닥 */
        else if (x < 110 && mm < 25) c = "#d8c48f";                         /* 바닷가 모래 */
        else if (ridgeX(x, y) <= XM + 4) c = mm > 1100 ? "#2f5e33" : mm > 500 ? "#3c7a3b" : "#58984a";   /* 바람받이: 젖은 숲 */
        else {                                                               /* 바람그늘: 산 너머가 더울수록 누렇게 마른다 */
          c = mm > 900 ? "#4f7a3a" : mm > 300 ? "#6f9446" : "#8fae55";
          c = mixHex(c, mm > 300 ? "#a8915a" : "#d1b066", dry * (mm > 300 ? .7 : 1));
        }
        return K.tint(c, light);
      };
    }
    function tpAt(x, m) {                    /* 공기 덩어리가 x 에 있을 때의 기온(기존 모형 그대로) */
      var h = Math.max(0, prof(x));
      if (x <= XM) return h <= m.lcl ? T0 - h / 100 : T0 - m.lcl / 100 - 0.5 * (h - m.lcl) / 100;
      return m.top + (MH - h) / 100;
    }
    function hsh(i) { var s = Math.sin(i * 12.9898 + 4.1) * 43758.5453; return s - Math.floor(s); }
    var RAIN = [], RR = K.rng(91);
    for (var ri = 0; ri < 60; ri++) RAIN.push([RR(), RR(), RR()]);
    /* 앞면(y = BD) 위, 땅보다 높은 곳에만 수평선 긋기 */
    function airLine(zz, u0, u1, col, w, dsh) {
      ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.setLineDash(dsh || []);
      var on = false; ctx.beginPath();
      for (var u = u0; u <= u1 + .01; u += 4) {
        var p = I.P(u, BD, zz);
        if (zOf(u, BD) < zz - 1) { if (on) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); on = true; } else on = false;
      }
      ctx.stroke(); ctx.restore();
    }

    function paint() {
      var m = model(), k, dry = clamp(m.gain / 7.5, 0, 1), wz = zm(0), box = [0, W];
      ctx.clearRect(0, 0, W, H);
      var fl = I.P(BL, BD, 0);
      K.studio(ctx, 0, 0, W, H, { x: fl.x - 150, y: fl.y - 24, rx: 340, ry: 42 });
      ctx.save(); ctx.beginPath(); ctx.roundRect(0, 0, W, H, 14); ctx.clip();
      /* 지형 + 바다 */
      I.field(ctx, zOf, landCol(dry), 64, 18, function (c, x0, y0, x1, y1, zMax, zMin) {
        if (wz > zMin + 0.2) {
          var a = I.P(x0, y0, wz), b = I.P(x1, y0, wz), cc = I.P(x1, y1, wz), d = I.P(x0, y1, wz), dep = wz - zMin;
          c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.lineTo(cc.x, cc.y); c.lineTo(d.x, d.y); c.closePath();
          c.fillStyle = "rgba(" + Math.round(50 - dep) + "," + Math.round(130 - dep * 1.5) + ",210," + Math.min(.9, .45 + dep / 40).toFixed(2) + ")"; c.fill();
        }
      });
      /* 앞면·오른쪽 면: 지층 없이 한 가지 색으로 채운 산 (땅속은 이 장면의 주제가 아님) */
      ["front", "right"].forEach(function (side) {
        var zf = faceZ(side);
        I.face(ctx, side, function (Lw) {
          I.profile(ctx, side, zf, 0);
          ctx.fillStyle = "#9a8566"; ctx.fill();
          ctx.strokeStyle = "rgba(70,55,35,.55)"; ctx.lineWidth = 1.5; ctx.beginPath();
          for (var u = 0; u <= Lw; u += 4) ctx.lineTo(u, zf(u));
          ctx.stroke();
          if (side === "front") {                                            /* 동해 단면 */
            ctx.beginPath(); ctx.moveTo(0, wz);
            for (var u2 = 0; u2 <= 50; u2 += 2) ctx.lineTo(u2, Math.min(wz, zf(u2)));
            ctx.lineTo(50, wz); ctx.closePath();
            var wg = ctx.createLinearGradient(0, wz, 0, 0); wg.addColorStop(0, "rgba(70,150,225,.7)"); wg.addColorStop(1, "rgba(15,60,130,.85)");
            ctx.fillStyle = wg; ctx.fill();
          }
        });
      });
      I.shade(ctx, "front", faceZ("front"));
      I.shade(ctx, "right", faceZ("right"));
      I.edges(ctx, zOf(BL, BD), zOf(BL, BD));
      /* 마을과 숲 */
      [[64, 34], [86, 70], [70, 112], [92, 140]].forEach(function (h, i) { I.house(ctx, h[0], h[1], zOf(h[0] + 7, h[1] + 7), 15, 13, 11, ["#c0553f", "#3f6fb5", "#d08a2e", "#c0553f"][i]); });
      [[606, 40], [612, 96]].forEach(function (h, i) { I.house(ctx, h[0], h[1], zOf(h[0] + 7, h[1] + 7), 15, 13, 11, ["#5a6b7c", "#c0553f"][i]); });
      [[150, 30], [175, 120], [205, 60], [235, 150], [260, 20], [290, 100], [380, 40], [420, 130], [470, 70], [520, 150], [555, 30]].forEach(function (t, i) {
        I.tree(ctx, t[0], t[1], zOf(t[0], t[1]), 0.8 + (i % 3) * .12);
      });
      /* 고도 눈금(앞면 위의 공기) */
      [0, 500, 1000, 1500].forEach(function (hh) {
        if (hh > 0) airLine(zm(hh), 0, BL, "rgba(30,50,90,.32)", 1.2, [5, 5]);
        if (m.cloud > 0 && Math.abs(hh - m.lcl) < 220) return;           /* 응결 고도 이름표 자리 */
        var p = I.P(0, BD, zm(hh));
        K.pill(ctx, hh === 0 ? "해수면 0 m" : hh.toLocaleString() + " m", p.x - 8, p.y + 4, { a: "right", s: 10.5, c: "#e8ecff", box: box });
      });
      /* 비와 구름 (바람받이) */
      var x0c = 0;
      if (m.cloud > 0) {
        for (x0c = 110; x0c < XM && prof(x0c) < m.lcl; x0c += 2) {}
        var xa = Math.max(14, x0c - 70), zl = zm(m.lcl);
        var puffs = [], idx = 0;
        for (var cx = xa; cx <= XM + 26; cx += 32) {
          [22, 82, 142].forEach(function (cy) {
            idx++;
            var jx = cx + (hsh(idx) - .5) * 14 + 3 * Math.sin(foT * .6 + idx), jy = cy + (hsh(idx + 50) - .5) * 20;
            var zb = Math.max(zl, zOf(jx, jy) + 3), zt = zm(MH) + (jx > XM ? 6 : 20);
            if (zt - zb < 6) return;
            var n = 1 + Math.floor((zt - zb) / 70);
            for (var j = 0; j < n; j++) puffs.push({ x: jx, y: jy, z: zb + (j + .5) * (zt - zb) / n, s: 13 + Math.min(12, (zt - zb) / n * .25) + hsh(idx + j * 7) * 5 });
          });
        }
        puffs.sort(function (a, b) { return (a.x + a.y) - (b.x + b.y) || a.z - b.z; });
        puffs.forEach(function (q) { var p = I.P(q.x, q.y, q.z); cloud(ctx, p.x, p.y, q.s, .8); });
        ctx.strokeStyle = "rgba(45,95,200,.85)"; ctx.lineWidth = 1.6;          /* 구름 밑에서 떨어지는 비 */
        RAIN.forEach(function (r) {
          var rx = xa + r[0] * (x0c + 20 - xa), ry = 10 + r[1] * (BD - 20), zg = zOf(rx, ry);
          if (zl - zg < 10) return;
          var f = (foT * 1.3 + r[2]) % 1, zz = zl - 4 - f * (zl - 4 - zg);
          var p1 = I.P(rx, ry, zz), p2 = I.P(rx, ry, Math.max(zg, zz - 10));
          ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x - 1.5, p2.y); ctx.stroke();
        });
        airLine(zl, 0, XM, "#e8394f", 2.2, [7, 5]);
      }
      /* 바람그늘의 아지랑이 */
      if (dry > .3) {
        ctx.strokeStyle = "rgba(255,140,40," + (.25 + dry * .35).toFixed(2) + ")"; ctx.lineWidth = 1.6;
        for (k = 0; k < 7; k++) {
          var hx = 520 + (k % 4) * 30, hy = 20 + k * 22, hz = zOf(hx, hy) + 8 + ((foT * 10 + k * 5) % 18);
          var hp = I.P(hx, hy, hz);
          ctx.beginPath(); ctx.moveTo(hp.x - 10, hp.y);
          ctx.quadraticCurveTo(hp.x - 5, hp.y - 4, hp.x, hp.y); ctx.quadraticCurveTo(hp.x + 5, hp.y + 4, hp.x + 10, hp.y); ctx.stroke();
        }
      }
      /* 동풍 */
      [40, 120].forEach(function (yy) { K.arrow(ctx, I.P(-30, yy, wz + 22), I.P(36, yy, wz + 22), "#2a6fd6", 3.2, 12); });
      /* 공기 덩어리가 지나는 길: 기온을 색으로 */
      ctx.lineCap = "round";
      [0, 1].forEach(function (pass) {
        ctx.lineWidth = pass ? 4.5 : 8;
        for (var tx = 8; tx < BL - 8; tx += 6) {
          var pa = I.P(tx, YP, zm(Math.max(0, prof(tx))) + 14), pb = I.P(tx + 6, YP, zm(Math.max(0, prof(tx + 6))) + 14);
          ctx.strokeStyle = pass ? heatCol((tpAt(tx + 3, m) + 10) / 45) : "rgba(20,25,45,.45)"; ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke();
        }
      });
      ctx.lineCap = "butt";
      var ux = 10 + ((foT * .12) % 1) * (BL - 20), tp = tpAt(ux, m), pp = I.P(ux, YP, zm(Math.max(0, prof(ux))) + 24);
      K.planet(ctx, pp.x, pp.y, 13, heatCol((tp + 10) / 45), "#3a2a4a");
      ctx.restore();
      /* 이름표 */
      K.pill(ctx, tp.toFixed(1) + " ℃", pp.x, pp.y - 18, { a: "center", s: 11, c: KC.yellow, box: box });
      var wp = I.P(-30, 40, wz + 22); K.pill(ctx, "동해의 축축한 동풍", wp.x, wp.y - 12, { a: "center", s: 11.5, c: "#bfe6ff", box: box });
      I.label(ctx, 80, BD - 4, zOf(80, BD - 4), "영동 기슭 " + T0 + " ℃ · 이슬점 " + m.td + " ℃", -30, 44, "#bfe6ff", box);
      I.label(ctx, XM, 4, zOf(XM, 4) + 14, "태백산맥 산마루 1,500 m · " + m.top.toFixed(1) + " ℃", 70, -64, "#c9f5c0", box);
      I.label(ctx, 620, BD - 10, zOf(620, BD - 10), "영서 기슭 " + m.lee.toFixed(1) + " ℃ (" + (m.gain >= 0 ? "+" : "") + m.gain.toFixed(1) + " ℃)", 40, -60, m.gain >= 5 ? "#ff9aac" : "#e8ecff", box);
      if (m.cloud > 0) { var lp = I.P(0, BD, zm(m.lcl)); K.pill(ctx, "응결 고도 " + Math.round(m.lcl).toLocaleString() + " m", lp.x - 8, lp.y + 4, { a: "right", s: 11, c: "#ff9aac", box: box }); }
      else { var np = I.P(XM, 60, zm(MH) + 40); K.pill(ctx, "구름 없음 — 응결 고도가 산마루보다 높음", np.x, np.y, { a: "center", s: 11.5, c: KC.ink, box: box }); }
      /* 읽음판 */
      K.t(ctx, "오를 때 — 응결 고도까지 1.0 ℃/100 m, 구름 속은 0.5 ℃/100 m", W - 18, 26, { s: 11.5, w: "800", a: "right", c: "#1d4f8f" });
      K.t(ctx, "내려올 때 — 구름이 없어 줄곧 1.0 ℃/100 m", W - 18, 46, { s: 11.5, w: "800", a: "right", c: "#b2402a" });
      K.t(ctx, "이슬점은 오를 때 0.2 ℃/100 m씩 낮아짐", W - 18, 66, { s: 11, a: "right", c: "#4a5872" });
      /* 큰 글자 */
      if (m.cloud <= 0) { K.bigText(ctx, "구름 없이 넘은 바람", 20, 46, 26, "#ffffff"); K.bigText(ctx, "산 너머도 그대로 " + m.lee.toFixed(1) + " ℃", 20, 80, 18, "#ffd35a"); }
      else if (m.gain >= 7) { K.bigText(ctx, "산을 넘자 " + m.gain.toFixed(1) + " ℃ 더 뜨겁다", 20, 46, 26, "#ffd35a"); K.bigText(ctx, "영서를 말리는 높새바람", 20, 80, 18, "#ffffff"); }
      else { K.bigText(ctx, "산 너머가 " + m.gain.toFixed(1) + " ℃ 더 덥다", 20, 46, 26, "#ffffff"); K.bigText(ctx, "구름 속 구간이 길수록 더 더워진다", 20, 80, 18, "#ffd35a"); }
      K.warn(ctx, W - 14, H - 12, "⚠ 높이는 보기 쉽게 과장 (실제 산맥 폭은 수십 km)", "right");
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
    /* ── 공기 기둥 블록(유리): 앞면 색 = 주변 기온(높이 0~3,000 m), 속에서 공기 덩어리(공)가 움직인다 ── */
    var LW = 520, RX = 532, ZG = 10, ZT = 266;
    var I = K.iso({ ox: 296, oy: 349, s: 0.95, L: 200, D: 130 });
    function zOfM(m) { return ZG + m / 3000 * (ZT - ZG); }
    function paint() {
      var KD = kind(), up = rising(), L = I.L, D = I.D, i;
      ctx.clearRect(0, 0, W, H);
      var fc = I.P(L, D, 0);
      studioOpen(ctx, LW, H, { x: fc.x - 60, y: fc.y - 30, rx: 240, ry: 46 });
      soilBlock(ctx, I, ZG, "#86b35e", 5);
      glassBack(ctx, I, 0, 0, ZG, L, D, ZT);
      /* 공기 덩어리 */
      var m0 = 1000, mp;
      if (up) { var s = (stT * .4) % 1; mp = m0 + s * s * 1900; }
      else { mp = m0 + 420 * Math.cos(stT * (KD === "inv" ? 3.2 : 2)) * Math.exp(-((stT * .5) % 3)); }
      var pp = I.P(L / 2, D / 2, zOfM(mp)), sh = I.P(L / 2, D / 2, ZG);
      ctx.fillStyle = "rgba(20,30,50,.18)"; ctx.beginPath(); ctx.ellipse(sh.x, sh.y, 30, 12, 0, 0, 6.2832); ctx.fill();
      ctx.save(); ctx.globalAlpha = up ? Math.min(1, (2900 - mp) / 300) : 1;
      K.planet(ctx, pp.x, pp.y, 31, wet ? "#74c0fc" : "#ffa94d", wet ? "#1c4f8a" : "#8a3a0e");
      ctx.restore();
      var l0 = I.P(0, D / 2, zOfM(m0)), l1 = I.P(L, D / 2, zOfM(m0));
      K.line(ctx, l0, l1, "rgba(20,40,80,.55)", 1.4, [5, 4]);
      /* 앞면·오른쪽 면: 주변 기온 색 띠 */
      ["front", "right"].forEach(function (side) {
        I.face(ctx, side, function (Lw) {
          for (var zz = 0; zz < 3000; zz += 150) {
            var tt = TG - gam * (zz + 75) / 100;
            ctx.fillStyle = heatCol((tt + 5) / 35, side === "front" ? .3 : .4);
            ctx.fillRect(0, zOfM(zz), Lw, zOfM(zz + 150) - zOfM(zz) + .5);
          }
        });
      });
      glassFront(ctx, I, 0, 0, ZG, L, D, ZT, "rgba(255,255,255,.04)");
      ctx.restore();
      var BX = [0, LW];
      [0, 1000, 2000, 3000].forEach(function (m) { var p = I.P(0, D, zOfM(m)); K.pill(ctx, (m / 1000).toFixed(0) + " km · " + (TG - gam * m / 100).toFixed(1) + "℃", p.x - 10, p.y + 4, { a: "right", s: 12, c: "#e8ecff", box: BX }); });
      K.pill(ctx, wet ? "포화" : "불포화", pp.x + 38, pp.y + 4, { s: 12, c: wet ? "#a5d8ff" : "#ffd8a8", box: BX });
      var ax = I.P(L, 0, 0).x + 16, ay0 = I.P(L, 0, zOfM(800)).y, ay1 = I.P(L, 0, zOfM(2400)).y;
      ctx.save(); ctx.shadowColor = up ? "#38d9a9" : "#9775fa"; ctx.shadowBlur = 10;
      if (up) K.arrow(ctx, { x: ax, y: ay0 }, { x: ax, y: ay1 }, LT.green, 6, 16); else K.arrow(ctx, { x: ax, y: ay1 }, { x: ax, y: ay0 }, LT.violet, 6, 16);
      ctx.restore();
      K.bigText(ctx, up ? "계속 올라간다" : "되돌아온다", 18, 48, 26, up ? "#8ce99a" : "#d0bfff");
      K.bigText(ctx, KD === "unstable" ? "절대 불안정" : KD === "inv" ? "기온 역전층" : KD === "stable" ? "절대 안정" : "조건부 불안정", 18, 78, 17, "#ffd35a");
      K.warn(ctx, 14, H - 14, "⚠ 앞면 색 = 주변 대기의 기온");
      /* ── 오른쪽: 단열선도 카드 ── */
      var envT = TG - gam * 10, parT = TG - parcelRate() * 10;
      judgeCard(ctx, RX, W, H, KD === "unstable" ? "절대 불안정" : KD === "inv" ? "역전층 (매우 안정)" : KD === "stable" ? "절대 안정" : "조건부 불안정", up ? LT.green : LT.violet, "주변 감률 " + gam.toFixed(2) + " ℃/100 m");
      var g = K.chart(ctx, { x: RX + 6, y: 84, w: W - RX - 16, h: 280, x0: -25, x1: 35, y0: 0, y1: 3000, xt: 6, yt: 3, xl: "기온 (℃)", yl: "높이 (m)", light: true });
      ctx.save(); ctx.beginPath(); ctx.rect(g.L, g.T - 2, g.R - g.L, g.B - g.T + 2); ctx.clip();
      K.plot(ctx, g, [[TG, 0], [TG - 30, 3000]], LT.orange, { light: true, w: wet ? 1.6 : 4 });
      K.plot(ctx, g, [[TG, 0], [TG - 15, 3000]], LT.blue, { light: true, w: wet ? 4 : 1.6 });
      K.plot(ctx, g, [[TG, 0], [TG - gam * 30, 3000]], LT.ink, { light: true, w: 2.8 });
      K.line(ctx, { x: g.X(Math.min(envT, parT)), y: g.Y(1000) }, { x: g.X(Math.max(envT, parT)), y: g.Y(1000) }, up ? LT.green : LT.violet, 3, [4, 3]);
      ctx.restore();
      var px = RX + 18, px1 = W - 18;
      K.row(ctx, "1,000 m에서 덩어리 − 주변", (parT - envT >= 0 ? "+" : "") + (parT - envT).toFixed(1) + " ℃", px, px1, 398, parT > envT ? LT.green : LT.violet);
      K.tip(ctx, parT > envT ? "덩어리가 더 따뜻하다 → 가벼워 계속 상승" : "덩어리가 더 차갑다 → 무거워 되돌아옴", px - 4, 410, px1 - px + 8, parT > envT);
      var lx = px, ly = 472; [["주변 대기", LT.ink], ["건조 단열 1.0", LT.orange], ["습윤 단열 0.5 ℃/100 m", LT.blue]].forEach(function (q) { ctx.font = "800 12px " + K.FONT; var qw = 22 + ctx.measureText(q[0]).width; if (lx + qw > px1) { lx = px; ly += 24; } ctx.fillStyle = q[1]; ctx.fillRect(lx, ly - 6, 16, 4); K.t(ctx, q[0], lx + 22, ly, { s: 12, w: "800", c: q[1] }); lx += qw + 16; });
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
    /* ── 하늘 기둥 블록: 땅 위 0~12 km, 구름은 밑면 1 km 부터 꼭대기까지. 빨간 판 = 등온면 ── */
    var LW = 600, RX = 612, ZG = 8, KMZ = 25;
    var I = K.iso({ ox: 230, oy: 296, s: 0.62, L: 300, D: 130 });
    var layer = cacheLayer(canvas, W, H);
    function zK(km) { return ZG + km * KMZ; }
    function star6(x, y, r, col) {
      ctx.strokeStyle = col || "#1c64c4"; ctx.lineWidth = 1.5; ctx.beginPath();
      for (var k = 0; k < 3; k++) { var a = k * Math.PI / 3; ctx.moveTo(x - r * Math.cos(a), y - r * Math.sin(a)); ctx.lineTo(x + r * Math.cos(a), y + r * Math.sin(a)); }
      ctx.stroke();
    }
    function model(c) {
      var L = I.L, D = I.D, top = Math.max(htop, BASE + 0.2), fc = I.P(L, D, 0), i, k;
      K.studio(c, 0, 0, LW, H, { x: fc.x - 60, y: fc.y - 30, rx: 260, ry: 48 });
      c.save(); c.beginPath(); c.roundRect(0, 0, LW, H, 14); c.clip();
      soilBlock(c, I, ZG, "#86b35e", 7);
      [[40, 30], [90, 100], [250, 40], [200, 110]].forEach(function (q) { I.tree(c, q[0], q[1], ZG, .9); });
      I.house(c, 140, 50, ZG, 18, 16, 12, "#c0553f");
      glassBack(c, I, 0, 0, ZG, L, D, zK(12), "rgba(120,170,230,.10)");
      /* 등온면 */
      [[0, "0 ℃"], [-10, "−10 ℃"], [-40, "−40 ℃"]].forEach(function (p) {
        var z = zOfT(p[0]); if (z < 0 || z > 12) return;
        I.plane(c, zK(z), "rgba(255,90,110,.10)", "rgba(220,40,70,.7)");
      });
      /* 구름 덩이: 밑면 1 km → 꼭대기 */
      var R = K.rng(5), nLev = Math.max(1, Math.round((top - BASE) / 0.8));
      for (k = 0; k < nLev; k++) {
        var hz = BASE + (top - BASE) * (k + .5) / nLev, wide = k === nLev - 1 && top > 8 ? 1.3 : 1;
        for (i = 0; i < 3; i++) {
          var p = I.P(70 + i * 80 + R() * 20, 40 + R() * 50, zK(hz));
          puffCloud(c, p.x, p.y, (.42 + R() * .12) * wide, clamp((top - hz) / 12, 0, .2) + (hz < 2 ? .25 : 0), 11 + k * 3 + i);
        }
      }
      glassFront(c, I, 0, 0, ZG, L, D, zK(12), "rgba(255,255,255,.03)");
      c.restore();
    }
    function paint() {
      var ttop = tAt(htop), L = I.L, D = I.D, i, k, top = Math.max(htop, BASE + 0.2);
      ctx.clearRect(0, 0, W, H);
      layer(ctx, String(htop), model);
      ctx.save(); ctx.beginPath(); ctx.roundRect(0, 0, LW, H, 14); ctx.clip();
      /* 구름 알갱이(앞쪽) */
      for (i = 0; i < 9; i++) {
        for (k = 0; k < 5; k++) {
          var hz = BASE + (top - BASE) * ((k + .5) / 5), xx = 40 + i * 28, p = I.P(xx, 70, zK(hz));
          var jx = Math.cos(rnT * 1.6 + i * 2) * 2, jy = Math.sin(rnT * 2 + i + k) * 2, tt = tAt(hz);
          if (tt > 0) K.glow(ctx, p.x + jx, p.y + jy, 2.4, "rgba(30,110,220,.95)", 2);
          else if (tt > -10) K.glow(ctx, p.x + jx, p.y + jy, 2.4, "rgba(130,70,220,.95)", 2);
          else star6(p.x + jx, p.y + jy, 5);
        }
      }
      /* 강수 */
      var snow = ttop <= -10 && tAt(0) <= 0, zb = zK(BASE);
      for (var r = 0; r < 18; r++) {
        var rx = 30 + (r * 53) % 240, ry = 20 + (r * 37) % 100, fall = (rnT * (snow ? .25 : 1.1) + r * .137) % 1, zr = zb - 4 - fall * (zb - ZG - 6);
        var a = I.P(rx, ry, zr);
        if (snow) star6(a.x, a.y, 4, "#ffffff");
        else { ctx.strokeStyle = "rgba(30,100,210,.85)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(a.x - 2, a.y + 10); ctx.stroke(); }
      }
      ctx.restore();
      var BX = [0, LW];
      [0, 3, 6, 9, 12].forEach(function (km) { var p = I.P(0, D, zK(km)); K.pill(ctx, km + " km", p.x - 10, p.y + 4, { a: "right", s: 10.5, c: "#e8ecff", box: BX }); });
      [[0, "0 ℃"], [-10, "−10 ℃"], [-40, "−40 ℃"]].forEach(function (p) { var z = zOfT(p[0]); if (z < 0 || z > 12) return; var q = I.P(L, 0, zK(z)); K.pill(ctx, p[1], q.x + 10, q.y + 4, { s: 10.5, c: "#ffc9c9", box: BX }); });
      I.label(ctx, L * .45, 20, zK(top), "구름 꼭대기 " + htop.toFixed(1) + " km", 120, -36, "#ffffff", BX);
      var way = ttop <= -10 ? "빙정설" : "병합설";
      K.bigText(ctx, way, 18, 50, 30, ttop <= -10 ? "#a5d8ff" : "#ffd8a8");
      K.bigText(ctx, "꼭대기 " + ttop.toFixed(1) + " ℃", 18, 84, 18, "#ffd35a");
      var lx = 18, lr;
      lr = K.pill(ctx, "● 물방울", lx + 7, H - 14, { s: 10.5, c: "#74c0fc" }); lx = lr.x + lr.w + 6;
      lr = K.pill(ctx, "● 과냉각 물방울", lx + 7, H - 14, { s: 10.5, c: "#b197fc" }); lx = lr.x + lr.w + 6;
      K.pill(ctx, "✳ 빙정", lx + 7, H - 14, { s: 10.5, c: "#ffffff" });
      /* ── 판정 카드 ── */
      judgeCard(ctx, RX, W, H, way + (ttop <= -15 || ttop > 0 ? " ✓" : ""), ttop <= -10 ? LT.blue : LT.orange, "지표 20 ℃ · 0.65 ℃/100 m");
      var px = RX + 18, px1 = W - 18;
      K.row(ctx, "구름 꼭대기", htop.toFixed(1) + " km", px, px1, 100);
      K.row(ctx, "꼭대기 온도", ttop.toFixed(1) + " ℃", px, px1, 126, ttop <= -10 ? LT.blue : LT.orange);
      K.row(ctx, "구름 밑면", "1.0 km", px, px1, 152);
      K.row(ctx, "0 ℃ 높이", zOfT(0).toFixed(1) + " km", px, px1, 178, LT.red);
      var lines = ttop <= -10
        ? ["얼음 알갱이(빙정)가 생깁니다.", "포화 수증기압이 물보다 얼음에서", "더 낮아, 과냉각 물방울의 수증기가", "빙정으로 옮겨 붙어 자랍니다.", snow ? "→ 녹지 않고 떨어지면 눈" : "→ 떨어지며 녹으면 비"]
        : ["구름 전체가 0 ℃보다 따뜻합니다.", "크기가 다른 물방울이 서로 다른", "속도로 떨어지며 부딪쳐 합쳐집니다.", "큰 물방울이 작은 것을 흡수해", "→ 빗방울이 됩니다"];
      lines.forEach(function (s0, j) { note(ctx, s0, px, 222 + j * 22, { s: 11, c: j === lines.length - 1 ? LT.ink : LT.mute, w: j === lines.length - 1 ? "900" : "700" }); });
      K.tip(ctx, ttop > 0 ? "✓ 따뜻한 구름 — 병합설" : (ttop <= -15 ? "✓ 찬 구름 — 빙정설" : "−15 ℃ 아래 또는 0 ℃ 위로"), px - 4, 344, W - px - 14, ttop > 0 || ttop <= -15 ? true : null);
      note(ctx, "구름 알갱이 0.02 mm → 빗방울 2 mm", px, 406, { s: 10.5 });
      note(ctx, "지름 100배 · 부피 100만 배", px, 426, { s: 10.5, c: LT.ink });
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
    /* ── 공기 기둥 블록(유리): 땅 위 0~20 km, 분자 점은 아래로 갈수록 촘촘 ── */
    var LW = 520, RX = 532, ZG = 8, KZ = 12.5;
    var I = K.iso({ ox: 280, oy: 356, s: 1.0, L: 180, D: 120 });
    var MOL = (function () { var R = K.rng(37), out = [], i; for (i = 0; i < 900; i++) { var zz = -Math.log(1 - R() * 0.98) * 8; if (zz <= 20) out.push([6 + R() * 168, 6 + R() * 108, zz, R() * 6.28]); } return out; })();
    function zK(km) { return ZG + km * KZ; }
    function paint() {
      var p = pres(z), dp = p - pres(Math.min(z + 1, 20)), L = I.L, D = I.D, i;
      ctx.clearRect(0, 0, W, H);
      var fc = I.P(L, D, 0);
      studioOpen(ctx, LW, H, { x: fc.x - 50, y: fc.y - 28, rx: 220, ry: 44 });
      soilBlock(ctx, I, ZG, "#86b35e", 9);
      glassBack(ctx, I, 0, 0, ZG, L, D, zK(20), "rgba(120,170,230,.10)");
      I.plane(ctx, zK(11), "rgba(255,90,110,.10)", "rgba(220,40,70,.65)");
      MOL.forEach(function (m) {
        var q = I.P(m[0], m[1], zK(m[2]));
        ctx.fillStyle = "rgba(28,100,190,.8)"; ctx.beginPath(); ctx.arc(q.x + Math.sin(prT * 7 + m[3]) * 1.6, q.y + Math.cos(prT * 6 + m[3] * 1.3) * 1.6, 2, 0, 6.2832); ctx.fill();
      });
      I.plane(ctx, zK(z), "rgba(255,212,59,.28)", "rgba(230,150,0,.95)");
      glassFront(ctx, I, 0, 0, ZG, L, D, zK(20), "rgba(255,255,255,.03)");
      ctx.restore();
      var BX = [0, LW];
      [0, 5, 10, 15, 20].forEach(function (k) { var q = I.P(0, D, zK(k)); K.pill(ctx, k + " km", q.x - 10, q.y + 4, { a: "right", s: 12, c: "#e8ecff", box: BX }); });
      var tq = I.P(L, 0, zK(11)); K.pill(ctx, "계면 11 km", tq.x + 8, tq.y + 4, { s: 12, c: "#ffc9c9", box: BX });
      var zq = I.P(L, D * .5, zK(z)); K.pill(ctx, "지금 " + z.toFixed(1) + " km", zq.x + 10, zq.y + 4, { s: 12, c: "#ffe066", box: BX });
      K.bigText(ctx, p.toFixed(0) + " hPa", 18, 50, 30, "#ffffff");
      K.bigText(ctx, "고도 " + z.toFixed(1) + " km · 지표의 " + (p / P0 * 100).toFixed(1) + "%", 18, 82, 16, "#ffd35a");
      K.warn(ctx, 14, H - 14, "⚠ 점 = 공기 분자 (아래가 촘촘)");
      /* ── 오른쪽: 밝은 그래프 카드 ── */
      var hit = Math.abs(p - P0 / 2) <= 15 ? "지표의 1/2 ✓" : (Math.abs(p - P0 / 10) <= 5 ? "지표의 1/10 ✓" : (dp >= 100 ? "1 km에 100 hPa ✓" : p.toFixed(1) + " hPa"));
      judgeCard(ctx, RX, W, H, hit, hit.indexOf("✓") >= 0 ? LT.green : LT.ink, "위에 쌓인 공기의 무게 = 기압");
      var g = K.chart(ctx, { x: RX + 6, y: 84, w: W - RX - 16, h: 280, x0: 0, x1: 1050, y0: 0, y1: 20, xt: 7, yt: 4, xl: "기압 (hPa)", yl: "높이 (km)", light: true });
      [[P0 / 2, "1/2"], [P0 / 10, "1/10"]].forEach(function (m) { K.line(ctx, { x: g.X(m[0]), y: g.T }, { x: g.X(m[0]), y: g.B }, "rgba(112,72,232,.6)", 1.4, [5, 4]); K.t(ctx, m[1], g.X(m[0]) + 4, g.T + 12, { s: 10.5, w: "800", c: LT.violet }); });
      var pts = []; for (var s = 0; s <= 200; s++) pts.push([pres(s / 10), s / 10]);
      K.plot(ctx, g, pts, LT.green, { light: true, w: 3 });
      K.line(ctx, { x: g.L, y: g.Y(z) }, { x: g.X(p), y: g.Y(z) }, LT.orange, 1.6, [5, 4]);
      K.line(ctx, { x: g.X(p), y: g.Y(z) }, { x: g.X(p), y: g.B }, LT.orange, 1.6, [5, 4]);
      ctx.fillStyle = "#fff"; ctx.strokeStyle = LT.orange; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(g.X(p), g.Y(z), 6, 0, 6.2832); ctx.fill(); ctx.stroke();
      var px = RX + 18, px1 = W - 18;
      K.row(ctx, "고도 " + z.toFixed(1) + " km의 기압", p.toFixed(1) + " hPa", px, px1, 398, LT.orange);
      K.row(ctx, "1 km 더 오르면", "−" + dp.toFixed(1) + " hPa", px, px1, 424, dp >= 100 ? LT.red : LT.ink);
      K.tip(ctx, z < 1.5 ? "지표 부근: 100 m마다 약 12 hPa" : "위로 갈수록 덜 줄어듭니다(지수 함수 모양)", px - 4, 440, px1 - px + 8, null);
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

    var I = K.iso({ ox: 160, oy: 262, s: 0.88, L: 130, D: 130 });
    function draw() {
      var s = state();
      ctx.clearRect(0, 0, W, H);
      var LW = 600, RX = 612, bal = Math.abs(s.net) <= 10, col = bal ? LT.green : (s.net > 0 ? LT.red : LT.violet), i;
      var off = bal ? 0 : clamp(s.net / 30, -14, 14), z0 = 40 + off, z1 = z0 + 100, L = I.L, D = I.D, u = (tc + 10) / 50;
      studioOpen(ctx, LW, H, { x: 160, y: 418, rx: 140, ry: 26 });
      /* ── 왼쪽: 두께 100 m 공기 층(유리 상자) ── */
      glassBack(ctx, I, 0, 0, z0, L, D, z1, heatCol(u, .14));
      var R = K.rng(11), nm = Math.round(40 + (s.rho - 1.1) * 260);
      for (i = 0; i < nm; i++) { var q = I.P(6 + R() * (L - 12), 6 + R() * (D - 12), z0 + 4 + R() * 92); K.glow(ctx, q.x, q.y, 1.5, "rgba(30,90,180,.9)", 2.2); }
      glassFront(ctx, I, 0, 0, z0, L, D, z1, heatCol(u, .22));
      /* 위에서 누르는 기압, 아래에서 받치는 기압, 무게 */
      [[30, 30], [100, 100], [30, 100], [100, 30]].forEach(function (q) {
        var t0 = I.P(q[0], q[1], z1 + 60), t1 = I.P(q[0], q[1], z1 + 4);
        ctx.save(); ctx.shadowColor = "#9775fa"; ctx.shadowBlur = 6; K.arrow(ctx, t0, t1, LT.violet, 3, 10); ctx.restore();
        var b0 = I.P(q[0], q[1], z0 - 60), b1 = I.P(q[0], q[1], z0 - 4);
        ctx.save(); ctx.shadowColor = "#ff6b6b"; ctx.shadowBlur = 6; K.arrow(ctx, b0, b1, LT.red, 3, 10); ctx.restore();
      });
      var c0 = I.P(L / 2, D / 2, (z0 + z1) / 2), c1 = I.P(L / 2, D / 2, (z0 + z1) / 2 - 48);
      ctx.save(); ctx.shadowColor = "#495057"; ctx.shadowBlur = 6; K.arrow(ctx, c0, c1, "#343a40", 4, 12); ctx.restore();
      ctx.restore();
      var BX = [0, LW], tp = I.P(L, 0, z1 + 50), bp = I.P(L, 0, z0 - 50);
      K.pill(ctx, "위 면 1,000.0 hPa", tp.x + 10, tp.y, { s: 11, c: "#d0bfff", box: BX });
      var bq = I.P(L / 2, D / 2, z0 - 64); K.pill(ctx, "아래 면 " + pb.toFixed(1) + " hPa", bq.x, bq.y + 22, { a: "center", s: 11, c: "#ffc9c9", box: [0, 330] });
      K.pill(ctx, "무게", c1.x + 10, c1.y + 4, { s: 11, c: "#ffffff", box: BX });
      K.pill(ctx, "공기 " + s.rho.toFixed(3) + " kg/m³ · " + tc + " ℃", I.P(0, D, z0).x - 6, I.P(0, D, z0).y + 30, { s: 11, c: "#a5d8ff", box: BX });
      /* ── 가운데: 저울(왼쪽 접시 = 위로 미는 힘, 오른쪽 접시 = 무게) ── */
      var px0 = 460, py0 = 250, th = clamp(s.net / 500, -1, 1) * .22, arm = 104;
      ctx.fillStyle = "rgba(20,30,50,.18)"; ctx.beginPath(); ctx.ellipse(px0, 404, 90, 14, 0, 0, 6.2832); ctx.fill();
      var bg = ctx.createLinearGradient(px0 - 40, 0, px0 + 40, 0); bg.addColorStop(0, "#ced4da"); bg.addColorStop(.5, "#f8f9fa"); bg.addColorStop(1, "#868e96");
      ctx.fillStyle = bg; ctx.beginPath(); ctx.ellipse(px0, 398, 48, 10, 0, 0, 6.2832); ctx.fill();
      ctx.fillStyle = bg; ctx.fillRect(px0 - 6, py0, 12, 148);
      var lx = px0 - arm * Math.cos(th), ly = py0 + arm * Math.sin(th), rx = px0 + arm * Math.cos(th), ry = py0 - arm * Math.sin(th);
      ctx.strokeStyle = "#495057"; ctx.lineWidth = 6; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(rx, ry); ctx.stroke();
      K.planet(ctx, px0, py0, 9, "#f1f3f5", "#495057");
      function pan(x, y, c2, lab, val) {
        ctx.strokeStyle = "#868e96"; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 30, y + 60); ctx.moveTo(x, y); ctx.lineTo(x + 30, y + 60); ctx.stroke();
        var pg = ctx.createLinearGradient(x - 40, 0, x + 40, 0); pg.addColorStop(0, "#dee2e6"); pg.addColorStop(1, "#adb5bd");
        ctx.fillStyle = pg; ctx.beginPath(); ctx.ellipse(x, y + 62, 40, 9, 0, 0, 6.2832); ctx.fill();
        var hh = 10 + clamp(val / 1300, 0, 1.6) * 26;
        ctx.fillStyle = c2; ctx.beginPath(); ctx.roundRect(x - 22, y + 58 - hh, 44, hh, 6); ctx.fill();
        K.pill(ctx, lab, x, y + 96, { a: "center", s: 11, c: "#ffffff", box: BX });
      }
      pan(lx, ly, "rgba(224,49,49,.85)", "위로 미는 힘", s.up);
      pan(rx, ry, "rgba(112,72,232,.85)", "무게", s.w);
      K.bigText(ctx, bal ? "정역학적 균형" : (s.net > 0 ? "위로 움직인다" : "아래로 움직인다"), 18, 50, 28, bal ? "#8ce99a" : (s.net > 0 ? "#ffc9c9" : "#d0bfff"));
      K.bigText(ctx, "남는 힘 " + (s.net >= 0 ? "+" : "") + s.net.toFixed(1) + " N/m²", 18, 82, 18, "#ffd35a");
      K.warn(ctx, LW - 14, H - 14, "⚠ 두께 100 m · 밑면적 1 m² 공기 층", "right");
      /* ── 판정 카드 ── */
      judgeCard(ctx, RX, W, H, bal ? "균형 ✓" : (s.net > 0 ? "상승 기류" : "하강 기류"), col, "기압 차 ↔ 무게");
      var px = RX + 18, px1 = W - 18, bw = px1 - px;
      K.row(ctx, "기압 차 " + (pb - PTOP).toFixed(1) + " hPa", s.up.toFixed(0) + " N/m²", px, px1, 102, LT.red);
      K.bar(ctx, px, 112, bw, s.up / 2100, LT.red);
      K.row(ctx, "무게 ρ·g·Δz", s.w.toFixed(0) + " N/m²", px, px1, 152, LT.violet);
      K.bar(ctx, px, 162, bw, s.w / 2100, LT.violet);
      K.row(ctx, "밀도 ρ = p / RT", s.rho.toFixed(3) + " kg/m³", px, px1, 204);
      K.row(ctx, "남는 힘", (s.net >= 0 ? "+" : "") + s.net.toFixed(1) + " N/m²", px, px1, 230, col);
      K.row(ctx, "가속도", (s.acc >= 0 ? "+" : "") + s.acc.toFixed(2) + " m/s²", px, px1, 256, col);
      K.tip(ctx, bal ? "✓ 미는 힘 = 무게 — 움직이지 않음" : (s.net > 0 ? "기압 차가 더 크다 → 위로" : "무게가 더 크다 → 아래로"), px - 4, 274, W - px - 14, bal ? true : null);
      note(ctx, "공기를 데우면 밀도↓ → 무게↓", px, 340, { s: 11 });
      note(ctx, "공기를 식히면 밀도↑ → 무게↑", px, 360, { s: 11 });
      note(ctx, "100 m 공기 층의 무게 ≈ 12 hPa", px, 392, { s: 11, c: LT.ink });
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
    /* ── 땅 블록 위에서 네 가지 원인을 각각 보여 준다(같은 블록, 다른 지형) ── */
    var LW = 600, RX = 612, ZG = 24;
    var I = K.iso({ ox: 262, oy: 272, s: 0.56, L: 420, D: 240 });
    function block(top) { soilBlock(ctx, I, ZG, top || "#86b35e", 13); }
    function bubble(x, y, z, r, a) {
      var p = I.P(x, y, z), g = ctx.createRadialGradient(p.x - r * .3, p.y - r * .35, 1, p.x, p.y, r);
      g.addColorStop(0, "rgba(255,240,225," + a + ")"); g.addColorStop(1, "rgba(255,120,80," + (a * .35) + ")");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 6.2832); ctx.fill();
    }
    function upArrow(x, y, z0, z1, col, w) { var a = I.P(x, y, z0), b = I.P(x, y, z1); ctx.save(); ctx.shadowColor = col; ctx.shadowBlur = 8; K.arrow(ctx, a, b, col, w, 12); ctx.restore(); }
    function drawHeat() {
      var s = sv / 100, i, L = I.L, D = I.D;
      block("#86b35e");
      /* 뜨거워진 땅(가운데 밭·아스팔트) */
      I.plane(ctx, ZG + .3, mixc("#c9a36a", "#e8590c", s * .6), null, 120, 300, 60, 190);
      var hp = I.P(210, 125, ZG), hg = ctx.createRadialGradient(hp.x, hp.y, 4, hp.x, hp.y, 120);
      hg.addColorStop(0, "rgba(255,110,60," + (.15 + s * .35) + ")"); hg.addColorStop(1, "rgba(255,110,60,0)");
      ctx.fillStyle = hg; ctx.beginPath(); ctx.ellipse(hp.x, hp.y - 20, 130, 70, 0, 0, 6.2832); ctx.fill();
      for (i = 0; i < 4; i++) {
        var rise = (veT * (0.12 + s * .45) + i * .25) % 1, x = 150 + (i % 2) * 90, y = 90 + (i * 37) % 80;
        bubble(x, y, ZG + 10 + rise * 200, 10 + s * 14, (1 - rise) * .9);
      }
      upArrow(300, 120, ZG + 20, ZG + 80 + s * 120, LT.red, 4);
      var cp = I.P(210, 110, ZG + 230); puffCloud(ctx, cp.x, cp.y, .5 + s * .6, .05, 21);
      K.sun(ctx, 520, 70, 14); K.planet(ctx, 520, 70, 13, "#fff3bf", "#f08c00");
      return [["뜨거워진 땅", 210, 125, ZG, 50, 60], ["가벼워진 공기가 떠오름 (부력)", 300, 120, ZG + 80 + s * 120, 30, -30], ["적운", 210, 110, ZG + 250, -40, -30]];
    }
    function mtn(x, y) { var t = (x - 250) / 110, r = (y - 120) / 260; return ZG + Math.max(0, 150 * Math.exp(-t * t * 1.6) * (1 - r * r * .6) - (x > 250 ? 0 : 0)); }
    function drawOro() {
      var s = sv / 100, i, L = I.L, D = I.D;
      ["front", "right"].forEach(function (side) {
        I.face(ctx, side, function (Lw) {
          I.profile(ctx, side, side === "front" ? function (u) { return mtn(u, D); } : function (u) { return mtn(L, u); }, 0);
          var g = ctx.createLinearGradient(0, 0, 0, 170); g.addColorStop(0, "#4f3b29"); g.addColorStop(1, "#b48d5c"); ctx.fillStyle = g; ctx.fill();
        });
      });
      I.shade(ctx, "front", function (u) { return mtn(u, D); }); I.shade(ctx, "right", function (u) { return mtn(L, u); });
      I.field(ctx, mtn, function (x, y, z, lt) { return K.tint(z > ZG + 110 ? "#9aa58a" : (z > ZG + 40 ? "#5f8f45" : "#86b35e"), lt); }, 42, 16);
      /* 바람이 비탈을 타고 오른다 */
      for (i = 0; i < 8; i++) {
        var u = (veT * (0.1 + s * .35) + i / 8) % 1, x = 30 + u * 220, y = 60 + (i * 41) % 130, p = I.P(x, y, mtn(x, y) + 10);
        K.glow(ctx, p.x, p.y, 2.2, "rgba(255,255,255,.95)", 3);
      }
      for (i = 0; i < 3; i++) { var y2 = 80 + i * 50, a = I.P(10, y2, ZG + 14), b = I.P(60 + s * 50, y2, mtn(60 + s * 50, y2) + 14); ctx.save(); ctx.shadowColor = "#ffb000"; ctx.shadowBlur = 6; K.arrow(ctx, a, b, "#f59f00", 2 + s * 3, 10); ctx.restore(); }
      upArrow(170, 120, mtn(170, 120) + 10, mtn(170, 120) + 50 + s * 70, LT.green, 4);
      var cp = I.P(215, 120, ZG + 175); puffCloud(ctx, cp.x, cp.y, .45 + s * .4, .15, 5);
      return [["산으로 부는 바람", 40, 80, ZG + 14, -30, 40], ["비탈을 타고 억지로 상승", 170, 120, mtn(170, 120) + 50 + s * 70, -40, -34], ["산 경사 1/20", 250, 200, mtn(250, 200), 40, 50]];
    }
    function drawFront() {
      var s = sv / 100, i, L = I.L, D = I.D, XF = 300, HZ = 150;
      block("#86b35e");
      function fz(x) { return ZG + Math.max(0, (XF - x) / XF) * HZ; }
      /* 따뜻한 공기(오른쪽) */
      I.quad(ctx, I.P(XF, D, ZG), I.P(L, D, ZG), I.P(L, D, ZG + HZ), I.P(0, D, ZG + HZ), "rgba(255,146,43,.16)");
      /* 찬 공기 쐐기(왼쪽, 전선면 아래) */
      I.quad(ctx, I.P(0, 0, ZG + HZ), I.P(XF, 0, ZG), I.P(XF, D, ZG), I.P(0, D, ZG + HZ), "rgba(77,171,247,.42)", "rgba(28,126,214,.9)");
      I.quad(ctx, I.P(0, D, ZG), I.P(XF, D, ZG), I.P(0, D, ZG + HZ), I.P(0, D, ZG + HZ), "rgba(28,126,214,.38)", "rgba(28,126,214,.9)");
      for (i = 0; i < 6; i++) {
        var u = (veT * (0.08 + s * .3) + i / 6) % 1, x = XF + 60 - u * 300, y = 40 + (i * 37) % 160, z = Math.max(fz(x), ZG) + 8 + (x > XF ? 0 : 0), p = I.P(x, y, z);
        K.glow(ctx, p.x, p.y, 2.2, "rgba(255,230,210,.98)", 3);
      }
      var a1 = I.P(XF + 70, 120, ZG + 12), a2 = I.P(XF - 120, 120, fz(XF - 120) + 14);
      ctx.save(); ctx.shadowColor = "#ff6b6b"; ctx.shadowBlur = 8; K.arrow(ctx, a1, a2, LT.red, 3 + s * 2, 12); ctx.restore();
      var c1 = I.P(20, 120, ZG + 12), c2 = I.P(80 + s * 70, 120, ZG + 12);
      ctx.save(); ctx.shadowColor = "#4dabf7"; ctx.shadowBlur = 8; K.arrow(ctx, c1, c2, LT.blue, 3.5, 12); ctx.restore();
      for (i = 0; i < 3; i++) { var cp = I.P(XF - 70 - i * 70, 110, fz(XF - 70 - i * 70) + 46); puffCloud(ctx, cp.x, cp.y, .32 + s * .18, .2, 30 + i); }
      return [["찬 공기", 40, 200, ZG + 30, -30, 40], ["따뜻한 공기가 올라탄다", XF - 120, 120, fz(XF - 120) + 14, 40, -50], ["전선면 경사 1/50", XF - 40, D, fz(XF - 40), 30, 40]];
    }
    function drawConv() {
      var s = sv / 100, i, k, L = I.L, D = I.D, CX = 210, CY = 120;
      block("#86b35e");
      onPlane(ctx, I, ZG + .4, function () {
        for (i = 1; i <= 3; i++) { ctx.strokeStyle = "rgba(255,255,255,.75)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(CX, CY, i * 34, i * 30, 0, 0, 6.2832); ctx.stroke(); }
        var lg = ctx.createRadialGradient(CX, CY, 4, CX, CY, 40); lg.addColorStop(0, "rgba(28,126,214,.45)"); lg.addColorStop(1, "rgba(28,126,214,0)");
        ctx.fillStyle = lg; ctx.beginPath(); ctx.arc(CX, CY, 40, 0, 6.2832); ctx.fill();
      });
      for (k = 0; k < 8; k++) {
        var a = k * Math.PI / 4 + .25, r0 = 118, r1 = 46;
        var p0 = I.P(CX + r0 * Math.cos(a), CY + r0 * .88 * Math.sin(a), ZG + 4), p1 = I.P(CX + r1 * Math.cos(a + .35), CY + r1 * .88 * Math.sin(a + .35), ZG + 4);
        ctx.save(); ctx.shadowColor = "#38d9a9"; ctx.shadowBlur = 6; K.arrow(ctx, p0, p1, LT.green, 2 + s * 3, 10); ctx.restore();
        var u = (veT * (0.12 + s * .35) + k * .13) % 1, rr = r0 - u * (r0 - r1), aa = a + u * .35, pp = I.P(CX + rr * Math.cos(aa), CY + rr * .88 * Math.sin(aa), ZG + 6);
        K.glow(ctx, pp.x, pp.y, 2, "rgba(255,255,255,.95)", 3);
      }
      for (i = 0; i < 4; i++) { var rise = (veT * (0.1 + s * .3) + i / 4) % 1; var q = I.P(CX, CY, ZG + 20 + rise * 160); K.glow(ctx, q.x + Math.sin(i * 2 + veT) * 6, q.y, 2.4, "rgba(255,255,255,.95)", 3); }
      upArrow(CX, CY, ZG + 20, ZG + 110 + s * 60, LT.blue, 5);
      var cp = I.P(CX, CY, ZG + 210); puffCloud(ctx, cp.x, cp.y, .55 + s * .4, .2, 41);
      return [["지상 저기압 L", CX, CY, ZG, -60, 70], ["사방에서 모여드는 바람(수렴)", CX + 118, CY, ZG + 4, 30, 40], ["갈 곳 없는 공기가 위로", CX, CY, ZG + 110 + s * 60, 40, -20]];
    }
    function paint() {
      var c = cur(), w = wOf(kind, sv), i;
      ctx.clearRect(0, 0, W, H);
      var fc = I.P(I.L, I.D, 0);
      studioOpen(ctx, LW, H, { x: fc.x - 70, y: fc.y - 30, rx: 280, ry: 50 });
      var labs = kind === "heat" ? drawHeat() : (kind === "oro" ? drawOro() : (kind === "front" ? drawFront() : drawConv()));
      I.edges(ctx, ZG, ZG);
      ctx.restore();
      var BX = [0, LW];
      labs.forEach(function (q) { I.label(ctx, q[1], q[2], q[3], q[0], q[4], q[5], "#ffffff", BX); });
      if (kind === "conv") { var lp = I.P(210, 120, ZG + 1); K.t(ctx, "L", lp.x, lp.y + 6, { s: 20, w: "900", a: "center", c: "#1864ab" }); }
      K.bigText(ctx, c.name, 18, 48, 28, w >= c.target ? "#8ce99a" : "#ffffff");
      K.bigText(ctx, "상승 속도 " + (w < 0.1 ? w.toFixed(3) : w.toFixed(2)) + " m/s · " + valText(kind, sv), 18, 80, 16, "#ffd35a");
      K.warn(ctx, 14, H - 14, "⚠ 높이·크기는 보기 쉽게 과장");
      /* ── 판정 카드: 상승 속도 비교(로그 눈금) ── */
      judgeCard(ctx, RX, W, H, w >= c.target ? "목표 넘김 ✓" : "목표 " + c.target + " m/s", w >= c.target ? LT.green : LT.ink, "상승 속도 (로그 눈금)");
      var bx = RX + 18, bw = W - RX - 36;
      for (i = 0; i < KINDS.length; i++) {
        var KN = KINDS[i], yy = 110 + i * 70, on = KN.id === kind, ww = on ? w : (got[KN.id] ? KN.target : 0);
        if (on) { ctx.fillStyle = "rgba(28,126,214,.07)"; ctx.beginPath(); ctx.roundRect(RX + 8, yy - 26, W - RX - 16, 66, 10); ctx.fill(); }
        K.t(ctx, KN.name, bx, yy - 8, { s: 12, w: on ? "900" : "700", c: on ? LT.ink : LT.mute });
        var len = clamp((Math.log(Math.max(ww, 0.01)) / Math.LN10 + 2) / 2.9, 0, 1);
        K.bar(ctx, bx, yy, bw, ww > 0 ? len : 0, got[KN.id] ? LT.green : (on ? LT.blue : "#adb5bd"));
        var tl = clamp((Math.log(KN.target) / Math.LN10 + 2) / 2.9, 0, 1) * bw;
        K.line(ctx, { x: bx + tl, y: yy - 5 }, { x: bx + tl, y: yy + 15 }, LT.red, 2);
        K.t(ctx, on ? (ww < 0.1 ? ww.toFixed(3) : ww.toFixed(2)) + " m/s" : (got[KN.id] ? "✓ 넘김" : "–"), bx, yy + 30, { s: 11, w: "800", c: on ? LT.ink : LT.mute });
        K.t(ctx, "목표 " + KN.target + " m/s", bx + bw, yy + 30, { s: 10.5, w: "700", a: "right", c: LT.red });
      }
      note(ctx, "빨간 선 = 목표 속도 · 0.01 ~ 8 m/s", bx, 410, { s: 10.5 });
      note(ctx, "네 가지 모두 정역학적 균형이 깨진 것", bx, 432, { s: 10.5, c: LT.ink });
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
    /* ── 상공(약 5 km) 일기도 판: 동쪽 = +x, 북쪽 = −y(뒤쪽). 북쪽이 저기압 ── */
    var LW = 600, RX = 612, ZP = 12;
    var I = K.iso({ ox: 236, oy: 168, s: 0.6, L: 560, D: 300 });
    function plate() {
      var L = I.L, D = I.D;
      ["front", "right"].forEach(function (side) { I.face(ctx, side, function (Lw) { var g = ctx.createLinearGradient(0, 0, 0, ZP); g.addColorStop(0, "#c5d3e6"); g.addColorStop(1, "#eef3fa"); ctx.fillStyle = g; ctx.fillRect(0, 0, Lw, ZP); }); });
      I.shade(ctx, "front", function () { return ZP; }); I.shade(ctx, "right", function () { return ZP; });
      var a = I.P(L / 2, 0, ZP), b = I.P(L / 2, D, ZP), g2 = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
      g2.addColorStop(0, "#cfe5fb"); g2.addColorStop(.5, "#f4f6fa"); g2.addColorStop(1, "#fbe0e3");
      I.plane(ctx, ZP, g2, "rgba(255,255,255,.9)");
    }
    function paint() {
      var f = fOf(lat), P = pgfOf(dkm), V = vg(), i, k, L = I.L, D = I.D;
      ctx.clearRect(0, 0, W, H);
      var fc = I.P(L, D, 0);
      studioOpen(ctx, LW, H, { x: fc.x - 120, y: fc.y + 4, rx: 300, ry: 44 });
      plate();
      var yc = D / 2, sp = 26 + (dkm - 100) / 700 * 34;
      onPlane(ctx, I, ZP + .2, function () {
        for (i = -2; i <= 2; i++) { ctx.strokeStyle = "rgba(40,60,110,.75)"; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(20, yc + i * sp); ctx.lineTo(L - 20, yc + i * sp); ctx.stroke(); }
        /* 정지 상태에서 놓은 공기의 자취(사이클로이드) */
        if (frac > 0) {
          var R0 = V / f, span = 9.42 * R0, sc = 470 / span, N = Math.max(2, Math.round(240 * frac));
          ctx.strokeStyle = "#f08c00"; ctx.lineWidth = 3.4; ctx.beginPath();
          for (k = 0; k <= N; k++) { var th = (k / 240) * 3 * Math.PI, xm = R0 * (th - Math.sin(th)), ym = R0 * (1 - Math.cos(th)); var px = 40 + xm * sc, py = yc + 2 * sp - ym * sc; if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); }
          ctx.stroke();
        }
      });
      /* 바람을 따라 흐르는 공기 */
      var vs = clamp(V, 0, 60) * 4;
      for (i = -2; i <= 1; i++) for (k = 0; k < 6; k++) {
        var xx = 24 + ((geT * vs + k * 90 + (i + 2) * 37) % (L - 48)), q = I.P(xx, yc + (i + .5) * sp, ZP + 2);
        K.glow(ctx, q.x, q.y, 1.8, "rgba(15,159,118,.95)", 2.6);
      }
      if (frac > 0) {
        var R1 = V / f, sc1 = 470 / (9.42 * R1), thn = (Math.max(2, Math.round(240 * frac)) / 240) * 3 * Math.PI;
        var tp = I.P(40 + R1 * (thn - Math.sin(thn)) * sc1, yc + 2 * sp - R1 * (1 - Math.cos(thn)) * sc1, ZP + 3);
        K.planet(ctx, tp.x, tp.y, 6, "#ffe066", "#e67700");
      }
      /* 힘(가운데 한 점) */
      var CX = L * .55, ca = 70;
      [[CX, yc, CX, yc - ca, LT.red, "#ff6b6b"], [CX, yc, CX, yc + ca, LT.violet, "#9775fa"], [CX - 110, yc, CX + 120, yc, LT.green, "#38d9a9"]].forEach(function (q) {
        var a = I.P(q[0], q[1], ZP + 4), b = I.P(q[2], q[3], ZP + 4);
        ctx.save(); ctx.shadowColor = q[5]; ctx.shadowBlur = 8; K.arrow(ctx, a, b, q[4], q === 0 ? 6 : 5, 15); ctx.restore();
      });
      var cc = I.P(CX, yc, ZP + 4); K.planet(ctx, cc.x, cc.y, 6, "#ffffff", "#5c7086");
      ctx.restore();
      var BX = [0, LW];
      for (i = -2; i <= 2; i += 2) { var lp = I.P(L - 20, yc + i * sp, ZP); K.pill(ctx, (1012 + i * 4) + " hPa", lp.x + 8, lp.y + 4, { s: 10.5, c: "#e8ecff", box: BX }); }
      var t1 = I.P(CX, yc - ca, ZP + 4), t2 = I.P(CX, yc + ca, ZP + 4), t3 = I.P(CX + 120, yc, ZP + 4);
      K.pill(ctx, "기압 경도력", t1.x + 10, t1.y - 2, { s: 11.5, c: "#ffc9c9", box: BX });
      K.pill(ctx, "전향력", t2.x - 10, t2.y + 16, { a: "right", s: 11.5, c: "#d0bfff", box: BX });
      K.pill(ctx, "지균풍", t3.x + 8, t3.y + 18, { s: 12.5, c: "#b2f2bb", box: BX });
      var nb = I.P(20, 0, ZP), sb = I.P(20, D, ZP);
      K.pill(ctx, "북쪽 · 기압 낮음", nb.x + 4, nb.y - 10, { s: 11, c: "#a5d8ff", box: BX });
      K.pill(ctx, "남쪽 · 기압 높음", sb.x - 4, sb.y + 22, { a: "center", s: 11, c: "#ffc9c9", box: BX });
      if (frac > 0) K.pill(ctx, "정지 상태에서 놓은 공기의 자취", 18, H - 16, { s: 11, c: "#ffd8a8", box: BX });
      K.bigText(ctx, "지균풍 " + V.toFixed(1) + " m/s", 18, 48, 28, V >= 30 || V <= 5 ? "#8ce99a" : "#ffffff");
      K.bigText(ctx, "위도 " + lat + "° · 등압선 간격 " + dkm.toLocaleString() + " km", 18, 80, 17, "#ffd35a");
      /* ── 판정 카드 ── */
      judgeCard(ctx, RX, W, H, V >= 30 ? "센 바람 ✓" : (V <= 5 ? "약한 바람 ✓" : V.toFixed(1) + " m/s"), V >= 30 || V <= 5 ? LT.green : LT.ink, "V = 기압 경도력 ÷ f");
      var px = RX + 18, px1 = W - 18;
      K.row(ctx, "전향 인자 f = 2Ω sin φ", (f * 1e5).toFixed(2) + "×10⁻⁵", px, px1, 102, LT.violet);
      K.row(ctx, "기압 경도력 (단위 질량)", (P * 1e4).toFixed(2) + "×10⁻⁴", px, px1, 128, LT.red);
      K.row(ctx, "지균풍 속도", V.toFixed(1) + " m/s", px, px1, 154, LT.green);
      K.row(ctx, "시속", (V * 3.6).toFixed(0) + " km", px, px1, 180);
      K.bar(ctx, px, 194, px1 - px, V / 60, V >= 30 || V <= 5 ? LT.green : LT.blue);
      note(ctx, "0", px, 222, { s: 10 }); note(ctx, "60 m/s", px1, 222, { a: "right", s: 10 });
      K.tip(ctx, V > 50 ? "⚠ 저위도에서는 지균풍 근사가 맞지 않음" : (V >= 30 ? "✓ 등압선이 촘촘 → 센 바람" : (V <= 5 ? "✓ 간격 넓고 고위도 → 약한 바람" : "30 m/s 이상, 5 m/s 이하 찾기")), px - 4, 236, W - px - 14, V > 50 ? false : (V >= 30 || V <= 5 ? true : null));
      note(ctx, "북반구 지균풍은", px, 300, { s: 11 });
      note(ctx, "기압이 낮은 쪽을 왼쪽에 두고 붑니다", px, 320, { s: 11, c: LT.ink });
      note(ctx, "등압선 간격이 좁을수록,", px, 352, { s: 11 });
      note(ctx, "위도가 낮을수록 빨라집니다", px, 372, { s: 11 });
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
    /* ── 일기도 판 위의 둥근 등압선. 동쪽 = +x, 북쪽 = −y ── */
    var LW = 600, RX = 612, ZP = 12;
    var I = K.iso({ ox: 258, oy: 150, s: 0.62, L: 460, D: 400 });
    function paint() {
      var V = grad(Rkm, kind), low = kind === "low", i, L = I.L, D = I.D;
      ctx.clearRect(0, 0, W, H);
      var fc = I.P(L, D, 0);
      studioOpen(ctx, LW, H, { x: fc.x - 80, y: fc.y + 4, rx: 280, ry: 44 });
      ["front", "right"].forEach(function (side) { I.face(ctx, side, function (Lw) { var g = ctx.createLinearGradient(0, 0, 0, ZP); g.addColorStop(0, "#c5d3e6"); g.addColorStop(1, "#eef3fa"); ctx.fillStyle = g; ctx.fillRect(0, 0, Lw, ZP); }); });
      I.shade(ctx, "front", function () { return ZP; }); I.shade(ctx, "right", function () { return ZP; });
      I.plane(ctx, ZP, "#f4f6fa", "rgba(255,255,255,.9)");
      var CX = 200, CY = 210, rr = clamp(Rkm / 1500, 0.25, 1) * 100, rings = [rr * .55 + 22, rr * 1.1 + 22, rr * 1.65 + 22];
      onPlane(ctx, I, ZP + .2, function () {
        var cg = ctx.createRadialGradient(CX, CY, 4, CX, CY, rings[2] + 20);
        cg.addColorStop(0, low ? "rgba(28,126,214,.35)" : "rgba(224,49,49,.3)"); cg.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(CX, CY, rings[2] + 20, 0, 6.2832); ctx.fill();
        rings.forEach(function (r) { ctx.strokeStyle = "rgba(40,60,110,.75)"; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(CX, CY, r, 0, 6.2832); ctx.stroke(); });
      });
      /* 등압선을 따라 도는 공기(북반구: 저기압은 시계 반대, 고기압은 시계 방향 — 위에서 볼 때) */
      if (V !== null) rings.forEach(function (r, j) {
        for (var k = 0; k < 7; k++) {
          var ph = (low ? 1 : -1) * grT * V * 6 / r + k * 6.2832 / 7 + j, q = I.P(CX + r * Math.cos(ph), CY - r * Math.sin(ph), ZP + 2);
          K.glow(ctx, q.x, q.y, 1.8, "rgba(15,159,118,.95)", 2.6);
        }
      });
      /* 힘(동쪽 한 점) */
      var PX = CX + rings[1], PY = CY, z = ZP + 4;
      function fa(dx, dy, col, gl, w, oy) { var a = I.P(PX, PY + (oy || 0), z), b = I.P(PX + dx, PY + dy + (oy || 0), z); ctx.save(); ctx.shadowColor = gl; ctx.shadowBlur = 8; K.arrow(ctx, a, b, col, w || 4, 12); ctx.restore(); return b; }
      var pg = fa(low ? -70 : 70, 0, LT.red, "#ff6b6b"), co = fa(low ? 52 : -52, 0, LT.violet, "#9775fa"), ce = fa(38, 0, LT.orange, "#ffa94d", 3, low ? 22 : -22);
      var wv = fa(0, low ? -90 : 90, LT.green, "#38d9a9", 6);
      var pp = I.P(PX, PY, z); K.planet(ctx, pp.x, pp.y, 5, "#ffffff", "#5c7086");
      ctx.restore();
      var BX = [0, LW], cp = I.P(CX, CY, ZP);
      K.t(ctx, low ? "L" : "H", cp.x, cp.y + 9, { s: 26, w: "900", a: "center", c: low ? "#1864ab" : "#c92a2a" });
      K.pill(ctx, "기압 경도력", pg.x + (low ? 6 : 8), pg.y + (low ? -18 : 20), { a: "left", s: 11, c: "#ffc9c9", box: BX });
      K.pill(ctx, "전향력", co.x + (low ? 8 : -8), co.y + (low ? -8 : 22), { a: low ? "left" : "right", s: 11, c: "#d0bfff", box: BX });
      K.pill(ctx, "원심력", ce.x + 8, ce.y + (low ? 16 : -10), { s: 11, c: "#ffd8a8", box: BX });
      K.pill(ctx, "바람", wv.x + 10, wv.y + 4, { s: 12, c: "#b2f2bb", box: BX });
      var nb = I.P(L - 30, 20, ZP); K.pill(ctx, "북 ↗", nb.x - 6, nb.y - 4, { a: "right", s: 10.5, c: "#ffffff", box: BX });
      K.bigText(ctx, V === null ? "평형이 없다" : (low ? "저기압 " : "고기압 ") + V.toFixed(2) + " m/s", 18, 48, 27, V === null ? "#ffc9c9" : "#ffffff");
      K.bigText(ctx, "곡률 반지름 " + Rkm.toLocaleString() + " km · 지균풍 " + VG.toFixed(2) + " m/s", 18, 80, 16, "#ffd35a");
      /* ── 판정 카드 ── */
      var vh = grad(Rkm, "high"), vl = grad(Rkm, "low");
      judgeCard(ctx, RX, W, H, V === null ? "존재할 수 없음" : (low ? (V <= VG - .8 ? "지균풍보다 느림 ✓" : "저기압 주위") : (V >= VG + .8 ? "지균풍보다 빠름 ✓" : "고기압 주위")), V === null ? LT.red : ((low && V <= VG - .8) || (!low && V >= VG + .8) ? LT.green : LT.ink), "같은 기압 경도력");
      var px = RX + 18, px1 = W - 18, bw = px1 - px;
      [["지균풍 (등압선이 곧을 때)", VG, "#868e96", 100], ["저기압 주위 경도풍", vl, LT.blue, 160], ["고기압 주위 경도풍", vh, LT.red, 220]].forEach(function (q) {
        K.row(ctx, q[0], q[1] === null ? "없음" : q[1].toFixed(2) + " m/s", px, px1, q[3], q[1] === null ? LT.red : q[2]);
        K.bar(ctx, px, q[3] + 10, bw, q[1] === null ? 0 : q[1] / 14, q[2]);
      });
      K.tip(ctx, V === null ? "✓ 좁고 강한 고기압은 생길 수 없다" : (low ? "원심력이 바깥 → 전향력이 덜 필요 → 느림" : "원심력도 바깥 → 전향력이 더 필요 → 빠름"), px - 4, 270, W - px - 14, V === null ? true : null);
      note(ctx, "고기압 주위는 곡률 반지름이", px, 334, { s: 11 });
      note(ctx, "약 313 km보다 작으면 평형이 없습니다", px, 354, { s: 11, c: LT.ink });
      note(ctx, "→ 고기압의 등압선은 늘 완만합니다", px, 378, { s: 11 });
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
    /* ── 땅 블록: 마찰이 클수록 바다 → 논밭 → 도시·숲으로 거칠어진다. 동쪽 = +x, 북쪽 = −y(저기압) ── */
    var LW = 600, RX = 612, ZG = 22;
    var I = K.iso({ ox: 236, oy: 172, s: 0.6, L: 540, D: 330 });
    var layer = cacheLayer(canvas, W, H);
    function terr() { return k6 === 0 ? 0 : (k6 < 40 ? 1 : (k6 < 90 ? 2 : 3)); }
    function model(c) {
      var L = I.L, D = I.D, tr = terr(), fc = I.P(L, D, 0), i;
      K.studio(c, 0, 0, LW, H, { x: fc.x - 110, y: fc.y - 20, rx: 300, ry: 48 });
      c.save(); c.beginPath(); c.roundRect(0, 0, LW, H, 14); c.clip();
      var top = tr <= 1 ? "#3d8fd6" : (tr === 2 ? "#8fbf5a" : "#9aa3ad");
      soilBlock(c, I, ZG, top, 15);
      if (tr <= 1) {
        c.strokeStyle = "rgba(255,255,255,.5)"; c.lineWidth = 1;
        for (i = 0; i < 26; i++) { var gx = (i * 97) % L, gy = (i * 53) % D, a = I.P(gx, gy, ZG), b = I.P(gx + 14, gy, ZG); c.beginPath(); c.moveTo(a.x, a.y); c.quadraticCurveTo((a.x + b.x) / 2, a.y - 3, b.x, b.y); c.stroke(); }
        if (tr === 1) { [[120, 90], [380, 230]].forEach(function (q) { I.box(c, q[0] - 10, q[1] - 4, ZG, q[0] + 10, q[1] + 4, ZG + 4, "#f3efe6", "#d9493a", "#a8352b"); }); }
      } else if (tr === 2) {
        onPlane(c, I, ZG + .2, function () { for (i = 0; i < 12; i++) { c.fillStyle = i % 2 ? "rgba(214,190,110,.45)" : "rgba(90,150,60,.35)"; c.fillRect(0, i * D / 12, L, D / 24); } });
        var R = K.rng(8); for (i = 0; i < 14; i++) I.tree(c, R() * L, R() * D, ZG, .8);
        I.house(c, 90, 240, ZG, 16, 14, 12, "#c0553f"); I.house(c, 420, 70, ZG, 16, 14, 12, "#3f6fb5");
      } else {
        var R2 = K.rng(12);
        for (i = 0; i < 26; i++) { var bx = 20 + (i % 7) * 74 + R2() * 10, by = 20 + Math.floor(i / 7) * 80 + R2() * 10, hh = 14 + R2() * 46; I.box(c, bx, by, ZG, bx + 26, by + 26, ZG + hh, "#eef1f5", "#cfd6df", "#9aa6b6"); }
      }
      I.edges(c, ZG, ZG);
      c.restore();
    }
    function paint() {
      var c = calc(), i, L = I.L, D = I.D, ar = c.ang * Math.PI / 180;
      ctx.clearRect(0, 0, W, H);
      layer(ctx, String(terr()), model);
      ctx.save(); ctx.beginPath(); ctx.roundRect(0, 0, LW, H, 14); ctx.clip();
      var z = ZG + (terr() === 3 ? 66 : 4), yc = D / 2, CX = L * .5;
      onPlane(ctx, I, z, function () {
        for (i = -2; i <= 2; i++) { ctx.strokeStyle = "rgba(20,40,90,.8)"; ctx.lineWidth = 2.2; ctx.setLineDash(terr() === 3 ? [10, 6] : []); ctx.beginPath(); ctx.moveTo(14, yc + i * 62); ctx.lineTo(L - 14, yc + i * 62); ctx.stroke(); }
        ctx.setLineDash([]);
        ctx.fillStyle = "rgba(28,126,214,.25)"; ctx.strokeStyle = "rgba(28,126,214,.9)"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(CX, yc); ctx.arc(CX, yc, 58, -ar, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
      });
      /* 등압선을 비스듬히 가로질러 저기압 쪽으로 흐르는 공기 */
      var dx = Math.cos(ar), dy = -Math.sin(ar), vs = c.V * 9;
      for (i = 0; i < 16; i++) {
        var base = -240 + ((sfT * vs + i * 40) % 480), off = ((i * 53) % 220) - 110, qx = CX + base * dx + off * Math.sin(ar), qy = yc + base * dy + off * Math.cos(ar);
        if (qx > 10 && qx < L - 10 && qy > 10 && qy < D - 10) { var q = I.P(qx, qy, z + 2); K.glow(ctx, q.x, q.y, 1.9, "rgba(255,255,255,.98)", 2.6); }
      }
      function fa(ex, ey, col, gl, w) { var a = I.P(CX, yc, z + 3), b = I.P(ex, ey, z + 3); ctx.save(); ctx.shadowColor = gl; ctx.shadowBlur = 8; K.arrow(ctx, a, b, col, w || 4, 13); ctx.restore(); return b; }
      var wv = fa(CX + 150 * dx, yc + 150 * dy, LT.green, "#38d9a9", 6);
      var pg = fa(CX, yc - 80, LT.red, "#ff6b6b");
      var co = fa(CX + 76 * Math.sin(ar), yc + 76 * Math.cos(ar), LT.violet, "#9775fa");
      var fr = fa(CX - 80 * dx, yc - 80 * dy, LT.orange, "#ffa94d");
      var cp = I.P(CX, yc, z + 3); K.planet(ctx, cp.x, cp.y, 5, "#ffffff", "#5c7086");
      ctx.restore();
      var BX = [0, LW];
      K.pill(ctx, "지상풍", wv.x + 8, wv.y + 16, { s: 12.5, c: "#b2f2bb", box: BX });
      K.pill(ctx, "기압 경도력", pg.x + 10, pg.y, { s: 11, c: "#ffc9c9", box: BX });
      K.pill(ctx, "전향력", co.x - 8, co.y + 18, { a: "right", s: 11, c: "#d0bfff", box: BX });
      K.pill(ctx, "마찰력", fr.x - 8, fr.y - 6, { a: "right", s: 11, c: "#ffd8a8", box: BX });
      var nb = I.P(20, 0, ZG), sb = I.P(20, D, ZG);
      K.pill(ctx, "북쪽 · 저기압", nb.x + 4, nb.y - 10, { s: 11, c: "#a5d8ff", box: BX });
      K.pill(ctx, "남쪽 · 고기압", sb.x, sb.y + 24, { a: "center", s: 11, c: "#ffc9c9", box: BX });
      var tname = ["마찰 없음 — 상공의 지균풍", "바다 위처럼 매끄러운 지표", "평지·논밭 정도의 지표", "도시·산지처럼 거친 지표"][terr()];
      K.bigText(ctx, "등압선과 " + c.ang.toFixed(1) + "°", 18, 48, 28, c.ang <= 6 || c.ang >= 30 ? "#8ce99a" : "#ffffff");
      K.bigText(ctx, tname, 18, 80, 17, "#ffd35a");
      /* ── 판정 카드 ── */
      judgeCard(ctx, RX, W, H, c.ang <= 6 ? "거의 나란 ✓" : (c.ang >= 30 ? "크게 가로지름 ✓" : c.ang.toFixed(1) + "°"), c.ang <= 6 || c.ang >= 30 ? LT.green : LT.ink, "세 힘의 평형");
      var px = RX + 18, px1 = W - 18;
      K.row(ctx, "마찰 세기", k6 + " ×10⁻⁶/s", px, px1, 102, LT.orange);
      K.row(ctx, "등압선과 이루는 각", c.ang.toFixed(1) + "°", px, px1, 128, LT.blue);
      K.row(ctx, "풍속", c.V.toFixed(2) + " m/s", px, px1, 154, LT.green);
      note(ctx, "마찰 없을 때 8.08 m/s", px1, 174, { a: "right", s: 10.5 });
      var gx = px + 60, gy = 250, gr = 56;
      ctx.fillStyle = "#eef3f9"; ctx.beginPath(); ctx.moveTo(gx, gy); ctx.arc(gx, gy, gr, -Math.PI / 2, 0); ctx.closePath(); ctx.fill();
      K.wedge(ctx, gx, gy, -ar, 0, gr - 6, "rgba(28,126,214,.22)", LT.blue);
      K.arrow(ctx, { x: gx, y: gy }, { x: gx + gr * Math.cos(ar), y: gy - gr * Math.sin(ar) }, LT.green, 3.5, 10);
      K.line(ctx, { x: gx, y: gy }, { x: gx + gr + 6, y: gy }, "rgba(20,40,90,.6)", 2);
      note(ctx, "등압선", gx + gr + 10, gy + 4, { s: 10.5 });
      note(ctx, "저기압 쪽 ↑", gx - 6, gy - gr - 6, { s: 10.5, c: LT.blue });
      K.tip(ctx, c.ang <= 6 ? "✓ 마찰이 없으면 등압선과 나란" : (c.ang >= 30 ? "✓ 거친 땅 — 30° 넘게 가로지름" : "6° 이하, 30° 이상을 찾아보세요"), px - 4, 290, W - px - 14, c.ang <= 6 || c.ang >= 30 ? true : null);
      note(ctx, "마찰 → 느려짐 → 전향력도 작아짐", px, 352, { s: 11 });
      note(ctx, "→ 기압 경도력 쪽(저기압)으로 기운다", px, 372, { s: 11, c: LT.ink });
      note(ctx, "바다 15~20° · 육지 30~45°", px, 398, { s: 10.5 });
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
    /* ── 북위 60° 위에서 내려다본 입체 지구(정사 투영). 가운데 아래가 우리나라(동경 127.5°) ── */
    var LW = 600, RX = 612, GX = 300, GY = 268, GR = 158, LAT0 = 58 * Math.PI / 180, LON0 = 127.5;
    function proj(la, lo) {
      var p = la * Math.PI / 180, d = (lo - LON0) * Math.PI / 180;
      return { x: GX + GR * Math.cos(p) * Math.sin(d), y: GY - GR * (Math.cos(LAT0) * Math.sin(p) - Math.sin(LAT0) * Math.cos(p) * Math.cos(d)), v: Math.sin(LAT0) * Math.sin(p) + Math.cos(LAT0) * Math.cos(p) * Math.cos(d) };
    }
    function pathLat(fnLat, front) {
      ctx.beginPath(); var pen = false;
      for (var lo = 0; lo <= 360.01; lo += 2) { var q = proj(fnLat(lo), lo); if ((q.v > 0) === front) { if (pen) ctx.lineTo(q.x, q.y); else { ctx.moveTo(q.x, q.y); pen = true; } } else pen = false; }
    }
    function paint() {
      var l, n, i;
      ctx.clearRect(0, 0, W, H);
      /* 밝은 스튜디오 위 탁상 지구본(받침대·반원 고리) */
      K.studio(ctx, 0, 0, LW, H, { x: GX + 10, y: GY + GR + 36, rx: 170, ry: 22 });
      var bg0 = ctx.createLinearGradient(GX - 110, 0, GX + 110, 0); bg0.addColorStop(0, "#8d6e4a"); bg0.addColorStop(.5, "#c79b6a"); bg0.addColorStop(1, "#6f5235");
      ctx.fillStyle = "#5b432b"; ctx.beginPath(); ctx.ellipse(GX, GY + GR + 34, 104, 15, 0, 0, 6.2832); ctx.fill();
      ctx.fillStyle = bg0; ctx.beginPath(); ctx.ellipse(GX, GY + GR + 28, 104, 15, 0, 0, 6.2832); ctx.fill();
      ctx.fillStyle = "#7a5a3a"; ctx.fillRect(GX - 7, GY + GR + 6, 14, 22);
      /* 지구 공 */
      var og = ctx.createRadialGradient(GX - GR * .35, GY - GR * .4, GR * .1, GX, GY, GR);
      og.addColorStop(0, "#9ed4ff"); og.addColorStop(.5, "#2f7fd0"); og.addColorStop(1, "#0d2d6b");
      ctx.fillStyle = og; ctx.beginPath(); ctx.arc(GX, GY, GR, 0, 6.2832); ctx.fill();
      /* 따뜻한 공기(제트 기류 바깥, 적도 쪽) · 찬 공기(제트 기류 안쪽, 북극 쪽) */
      ctx.save(); ctx.beginPath(); ctx.arc(GX, GY, GR, 0, 6.2832); ctx.clip();
      ctx.beginPath();
      for (l = 0; l <= 360; l += 2) {
        var q0 = proj(Math.max(latAt(l), 0), l);
        if (q0.v < 0) { var dd = Math.hypot(q0.x - GX, q0.y - GY) || 1; q0 = { x: GX + (q0.x - GX) / dd * GR, y: GY + (q0.y - GY) / dd * GR }; }
        if (l) ctx.lineTo(q0.x, q0.y); else ctx.moveTo(q0.x, q0.y);
      }
      ctx.closePath();
      ctx.save(); ctx.moveTo(GX + GR + 2, GY); ctx.arc(GX, GY, GR + 2, 0, 6.2832); ctx.fillStyle = "rgba(255,176,96,.62)"; ctx.fill("evenodd"); ctx.restore();
      ctx.beginPath();
      for (l = 0; l <= 360; l += 2) {
        var q1 = proj(Math.max(latAt(l), 0), l);
        if (q1.v < 0) { var d1 = Math.hypot(q1.x - GX, q1.y - GY) || 1; q1 = { x: GX + (q1.x - GX) / d1 * GR, y: GY + (q1.y - GY) / d1 * GR }; }
        if (l) ctx.lineTo(q1.x, q1.y); else ctx.moveTo(q1.x, q1.y);
      }
      ctx.closePath(); ctx.fillStyle = "rgba(205,238,255,.55)"; ctx.fill();
      /* 위도선·경도선 */
      ctx.strokeStyle = "rgba(255,255,255,.3)"; ctx.lineWidth = 1;
      [30, 45, 60, 75].forEach(function (la) { pathLat(function () { return la; }, true); ctx.stroke(); });
      for (l = 0; l < 360; l += 30) { ctx.beginPath(); var pen = false; for (var la = 10; la <= 90; la += 3) { var qq = proj(la, l); if (qq.v > 0) { if (pen) ctx.lineTo(qq.x, qq.y); else { ctx.moveTo(qq.x, qq.y); pen = true; } } else pen = false; } ctx.stroke(); }
      /* 공 음영(오른쪽 아래가 어둡게) + 반짝임 */
      var sh = ctx.createRadialGradient(GX - GR * .4, GY - GR * .45, GR * .2, GX, GY, GR * 1.05);
      sh.addColorStop(0, "rgba(255,255,255,.18)"); sh.addColorStop(.6, "rgba(0,0,0,0)"); sh.addColorStop(1, "rgba(5,15,45,.24)");
      ctx.fillStyle = sh; ctx.fillRect(GX - GR, GY - GR, GR * 2, GR * 2);
      ctx.restore();
      ctx.strokeStyle = "rgba(20,50,110,.45)"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(GX, GY, GR, 0, 6.2832); ctx.stroke();
      /* 반원 고리(자오선 고리)와 축 */
      ctx.save(); ctx.lineCap = "round";
      ctx.strokeStyle = "#6f5235"; ctx.lineWidth = 9; ctx.beginPath(); ctx.arc(GX, GY, GR + 13, Math.PI * .5, Math.PI * 1.5); ctx.stroke();
      var rg2 = ctx.createLinearGradient(GX - GR - 20, 0, GX - GR, 0); rg2.addColorStop(0, "#e2c08d"); rg2.addColorStop(1, "#a07a4c");
      ctx.strokeStyle = rg2; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(GX, GY, GR + 13, Math.PI * .5, Math.PI * 1.5); ctx.stroke();
      ctx.restore();
      K.planet(ctx, GX, GY - GR - 13, 6, "#e2c08d", "#6f5235"); K.planet(ctx, GX, GY + GR + 13, 6, "#e2c08d", "#6f5235");
      /* 제트 기류(앞면 = 진하게, 뒷면 = 점선) */
      ctx.save(); ctx.setLineDash([4, 5]); ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.lineWidth = 2; pathLat(latAt, false); ctx.stroke(); ctx.restore();
      ctx.save(); ctx.shadowColor = "#bff6ff"; ctx.shadowBlur = 12; ctx.strokeStyle = "#e3fbff"; ctx.lineWidth = 4; pathLat(latAt, true); ctx.stroke(); ctx.restore();
      for (n = 0; n < 30; n++) { var lo2 = (wvT * 14 + n * 12) % 360, qp = proj(latAt(lo2), lo2); if (qp.v > 0) K.glow(ctx, qp.x, qp.y, 1.8, "rgba(255,255,255,.95)", 3); }
      /* 골·마루·발산 */
      for (n = 0; n < kw; n++) {
        var lonT = (270 / kw) + n * (360 / kw), lonR = (90 / kw) + n * (360 / kw), qt = proj(45 - amp, lonT), qr = proj(45 + amp, lonR);
        if (qt.v > .15) K.pill(ctx, "골", qt.x, qt.y + 20, { a: "center", s: 10.5, c: "#a5d8ff" });
        if (qr.v > .15) K.pill(ctx, "마루", qr.x, qr.y - 10, { a: "center", s: 10.5, c: "#ffd8a8" });
        if (amp >= 4) { var qd = proj(45, lonT + 45 / kw); if (qd.v > .2) { K.t(ctx, "D", qd.x, qd.y + 5, { s: 15, w: "900", a: "center", c: "#ffa94d" }); } }
      }
      var kp = proj(37.5, 127.5);
      K.glow(ctx, kp.x, kp.y, 5, "rgba(182,156,255,.98)", 3.4);
      K.pill(ctx, "우리나라", kp.x + 10, kp.y + 22, { s: 11, c: "#d0bfff", box: [0, LW] });
      var np = proj(90, 0); K.t(ctx, "북극", np.x, np.y - 6, { s: 10.5, w: "800", a: "center", c: "#ffffff" });
      K.bigText(ctx, "파수 " + kw + " · 진폭 " + amp + "°", 18, 48, 27, "#ffffff");
      K.bigText(ctx, "찬 공기가 " + (45 - amp) + "°N까지 내려온다", 18, 80, 17, 45 - amp <= 30 ? "#ffc9c9" : "#ffd35a");
      K.warn(ctx, LW - 14, 30, "⚠ 제트 기류는 굵게 그림", "right");
      /* ── 판정 카드 ── */
      var hit = amp <= 3 ? "찬 공기가 갇힘 ✓" : (45 - amp <= 30 ? "한파가 30°N까지 ✓" : (wl() >= 10000 ? "아주 긴 물결 ✓" : "중간 사행"));
      judgeCard(ctx, RX, W, H, hit, hit.indexOf("✓") >= 0 ? LT.green : LT.ink, "행성파(로스비파)");
      var px = RX + 18, px1 = W - 18;
      K.row(ctx, "파수", kw + " 개", px, px1, 102);
      K.row(ctx, "진폭", amp + "°", px, px1, 128, LT.orange);
      K.row(ctx, "파장 (위도 45°)", Math.round(wl()).toLocaleString() + " km", px, px1, 154, wl() >= 10000 ? LT.green : LT.ink);
      K.row(ctx, "최남단 (찬 공기)", (45 - amp) + "°N", px, px1, 180, 45 - amp <= 30 ? LT.red : LT.blue);
      K.row(ctx, "최북단 (따뜻한 공기)", (45 + amp) + "°N", px, px1, 206, LT.orange);
      K.tip(ctx, amp <= 3 ? "거의 동서로 흐름 · 중위도 포근" : (amp >= 15 ? "골 아래는 한파, 마루 아래는 포근" : "진폭이 클수록 남북 교환 활발"), px - 4, 226, W - px - 14, amp <= 3 || amp >= 15 ? true : null);
      note(ctx, "기압골 동쪽(D)에서 상층 바람이", px, 290, { s: 11 });
      note(ctx, "퍼져 나가 그 아래 지상 저기압 발달", px, 310, { s: 11, c: LT.ink });
      note(ctx, "전향력이 위도마다 달라서 생기는", px, 342, { s: 11 });
      note(ctx, "지구 규모의 물결", px, 362, { s: 11 });
      ctx.fillStyle = "rgba(205,238,255,1)"; ctx.fillRect(px, 398, 14, 12); ctx.fillStyle = "rgba(255,170,110,1)"; ctx.fillRect(px, 422, 14, 12);
      note(ctx, "하늘색 = 북극 쪽 찬 공기", px + 22, 409, { s: 12, c: LT.ink });
      note(ctx, "주황 = 적도 쪽 따뜻한 공기", px + 22, 433, { s: 12, c: LT.ink });
      note(ctx, "D = 상층 발산", px + 22, 457, { s: 12, c: LT.orange });
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
