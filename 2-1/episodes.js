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

/* ---- 스튜디오 + 블록 모형 공용 도구 (지침 _tools/STUDIO_GUIDE.md) ---- */
var LT = K.LT;
/* 왼쪽 모형 칸: 밝은 스튜디오를 깔고 그 칸 안으로 자른다. 끝나면 ctx.restore() */
function studioOpen(ctx, LW, H, floor) {
  K.studio(ctx, 0, 0, LW, H, floor);
  ctx.save(); ctx.beginPath(); ctx.roundRect(0, 0, LW, H, 14); ctx.clip();
}
/* 오른쪽 흰 판정 카드: 큰 판정 글자와 오른쪽 위 작은 글 */
function judgeCard(ctx, RX, W, H, head, col, side) {
  K.card(ctx, RX, 0, W - RX, H, "판정");
  K.t(ctx, head, RX + 18, 64, { s: 22, w: "900", c: col || LT.ink });
  if (side) K.t(ctx, side, W - 18, 28, { s: 11.5, w: "800", a: "right", c: LT.mute });
}
/* 카드 안 작은 설명 글 */
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
  var g = ctx.createLinearGradient(x, y - dy, x + w * .4, y + h); g.addColorStop(0, "#070b26"); g.addColorStop(1, "#141b4c");
  ctx.fillStyle = g; ctx.fill();
  ctx.save(); poly(hull); ctx.clip();
  var R = K.rng(o.seed || 7), n = Math.round(w * h / 1300), i;
  for (i = 0; i < 4; i++) { var nx = x + R() * w, ny = y + R() * h, nr = 80 + R() * 120, ng = ctx.createRadialGradient(nx, ny, 0, nx, ny, nr); ng.addColorStop(0, "rgba(140,130,230,.10)"); ng.addColorStop(1, "rgba(140,130,230,0)"); ctx.fillStyle = ng; ctx.fillRect(x, y - dy, w + dx, h + dy); }
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
  ctx.fillStyle = "rgba(255,255,255,.42)"; ctx.beginPath(); ctx.ellipse(x - .05 * r, y - .95 * r, .34 * r, .1 * r, 0, 0, 6.2832); ctx.fill();
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
/* 조작할 때만 바뀌는 그림은 숨은 캔버스에 한 번 그려 두고 쓴다(엘니뇨 본보기와 같은 방식) */
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
/* 바닷물 윗면 색: 얕을수록 밝은 청록, 깊을수록 짙은 파랑. lt 는 비탈 밝기, warm 은 따뜻한 물(0~1) */
function seaCol(depth, lt, warm) {
  var f = clamp(depth / 140, 0, 1), r = 120 - 80 * f, g = 205 - 85 * f, b = 238 - 20 * f;
  if (warm) { r += 70 * warm; g += 12 * warm; b -= 50 * warm; }
  return "rgb(" + Math.round(clamp(r * lt, 0, 255)) + "," + Math.round(clamp(g * lt, 0, 255)) + "," + Math.round(clamp(b * lt, 0, 255)) + ")";
}
/* 바다 블록 윗면: bed(x,y) 바닥 높이, surf(x,y) 수면 높이 (그림 단위) */
function seaTop(ctx, I, bed, surf, nx, ny, landCol, waterCol) {
  I.field(ctx, function (x, y) { return Math.max(bed(x, y), surf(x, y)); }, function (x, y, z, lt) {
    var b = bed(x, y), s = surf(x, y);
    if (b >= s - 0.3) return landCol ? landCol(x, y, b, lt) : K.tint("#d9c08a", lt);
    return waterCol ? waterCol(x, y, s - b, lt) : seaCol(s - b, lt);
  }, nx, ny);
}
/* 바다 블록 앞면·오른쪽 면: 바닥 퇴적층 + 물 단면. o.face(side, Lw, b, s) 로 물 속 무늬를 더 그린다(면 좌표: u 가로, z 위) */
function seaFaces(ctx, I, bed, surf, o) {
  o = o || {};
  var L = I.L, D = I.D, zt = o.zt || 200, bt = o.bedTop || 60;
  ["front", "right"].forEach(function (side) {
    function b(u) { return side === "front" ? bed(u, D) : bed(L, u); }
    function s(u) { return side === "front" ? surf(u, D) : surf(L, u); }
    I.face(ctx, side, function (Lw) {
      var st = Math.max(1.5, Lw / 180), u, R = K.rng(side === "front" ? 13 : 17);
      I.profile(ctx, side, b, 0);
      var g = ctx.createLinearGradient(0, 0, 0, bt); g.addColorStop(0, o.rockDeep || "#4f3d2b"); g.addColorStop(1, o.rockTop || "#c6a676");
      ctx.fillStyle = g; ctx.fill();
      ctx.save(); I.profile(ctx, side, b, 0); ctx.clip();
      for (u = 0; u < Lw * 1.4; u++) { ctx.fillStyle = R() > .5 ? "rgba(255,255,255,.16)" : "rgba(40,25,10,.22)"; ctx.fillRect(R() * Lw, R() * bt * 1.6, 1.6, 1.6); }
      ctx.strokeStyle = "rgba(60,40,20,.22)"; ctx.lineWidth = 1;
      for (var zz = 12; zz < bt * 1.8; zz += 14) { ctx.beginPath(); ctx.moveTo(0, zz); ctx.lineTo(Lw, zz + 2); ctx.stroke(); }
      ctx.restore();
      ctx.beginPath();
      for (u = 0; u <= Lw + .01; u += st) ctx.lineTo(Math.min(u, Lw), b(Math.min(u, Lw)));
      for (u = Lw; u >= -.01; u -= st) { var uu = Math.max(u, 0); ctx.lineTo(uu, Math.max(b(uu), s(uu))); }
      ctx.closePath();
      var wg = ctx.createLinearGradient(0, zt, 0, 0);
      wg.addColorStop(0, o.wTop || "rgba(70,172,230,.95)"); wg.addColorStop(.5, o.wMid || "rgba(26,100,176,.96)"); wg.addColorStop(1, o.wDeep || "rgba(9,38,92,.97)");
      ctx.fillStyle = wg; ctx.fill();
      if (o.face) { ctx.save(); ctx.clip(); o.face(side, Lw, b, s); ctx.restore(); }
      ctx.strokeStyle = "rgba(255,255,255,.85)"; ctx.lineWidth = 1.4; ctx.beginPath();
      var pen = false;
      for (u = 0; u <= Lw + .01; u += st) { var u2 = Math.min(u, Lw), sz = s(u2); if (sz > b(u2) + .3) { if (pen) ctx.lineTo(u2, sz); else { ctx.moveTo(u2, sz); pen = true; } } else pen = false; }
      ctx.stroke();
    });
  });
  I.shade(ctx, "front", function (u) { return Math.max(bed(u, D), surf(u, D)); });
  I.shade(ctx, "right", function (u) { return Math.max(bed(L, u), surf(L, u)); });
  I.edges(ctx, Math.max(bed(L, D), surf(L, D)), 0);
}
/* 블록 위 수평면 화살표(월드 좌표) */
function isoArrow(ctx, I, x0, y0, x1, y1, z, col, w, head, glow) {
  var a = I.P(x0, y0, z), b = I.P(x1, y1, z);
  ctx.save(); if (glow) { ctx.shadowColor = glow; ctx.shadowBlur = 8; }
  K.arrow(ctx, a, b, col, w, head); ctx.restore();
}
/* 뭉게구름 덩이(입체 공 여럿) — 폭풍 구름. dark 0~1 */
function puffCloud(ctx, x, y, sc, dark, seed) {
  var R = K.rng(seed || 3), pts = [], i;
  for (i = 0; i < 9; i++) pts.push([(R() - .5) * 70 * sc, (R() - .5) * 16 * sc - (i % 3) * 6 * sc, (12 + R() * 10) * sc]);
  pts.sort(function (p, q) { return p[1] - q[1]; });
  ctx.save(); ctx.shadowColor = "rgba(20,30,60,.22)"; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
  pts.forEach(function (p) {
    var cx = x + p[0], cy = y + p[1], r = p[2], d = dark || 0;
    var g = ctx.createRadialGradient(cx - r * .35, cy - r * .45, r * .1, cx, cy, r);
    g.addColorStop(0, mixc("#ffffff", "#c9cfda", d)); g.addColorStop(.55, mixc("#e6ebf3", "#7d8699", d)); g.addColorStop(1, mixc("#a9b4c6", "#454c5e", d));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.2832); ctx.fill();
  });
  ctx.restore();
}
/* 태풍·저기압 소용돌이 구름(비스듬히 내려다본 납작한 원판). 북반구는 시계 반대 방향(ccw) */
function swirl(ctx, x, y, r, rot, strength) {
  ctx.save(); ctx.translate(x, y); ctx.scale(1, .52);
  var sh = ctx.createRadialGradient(0, 30, r * .2, 0, 30, r * 1.2);
  sh.addColorStop(0, "rgba(20,30,60,.22)"); sh.addColorStop(1, "rgba(20,30,60,0)");
  ctx.fillStyle = sh; ctx.beginPath(); ctx.arc(0, 30, r * 1.2, 0, 6.2832); ctx.fill();
  var g = ctx.createRadialGradient(0, 0, r * .1, 0, 0, r * 1.15);
  g.addColorStop(0, "rgba(235,240,248,.2)"); g.addColorStop(.3, "rgba(236,241,248,.95)"); g.addColorStop(.75, "rgba(205,214,228,.75)"); g.addColorStop(1, "rgba(200,210,226,0)");
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r * 1.15, 0, 6.2832); ctx.fill();
  ctx.rotate(-rot);
  for (var k = 0; k < 4; k++) {
    ctx.rotate(Math.PI / 2);
    ctx.strokeStyle = "rgba(120,135,160," + (.35 + .3 * strength) + ")"; ctx.lineWidth = (6 - k) * (.6 + strength * .5); ctx.lineCap = "round";
    ctx.beginPath();
    for (var a = 0; a < 3.3; a += .12) { var rr = r * .12 + a * r * .26, px = rr * Math.cos(-a), py = rr * Math.sin(-a); if (a === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); }
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(60,72,98,.9)"; ctx.beginPath(); ctx.arc(0, 0, r * .11, 0, 6.2832); ctx.fill();
  ctx.restore();
}
/* 작은 배(관측선·어선) */
function boat(ctx, I, x, y, z, col) {
  I.box(ctx, x - 10, y - 4, z, x + 10, y + 4, z + 4, "#f3efe6", col || "#d9493a", "#a8352b");
  I.box(ctx, x - 2, y - 2.5, z + 4, x + 6, y + 2.5, z + 10, "#ffffff", "#e6e9ee", "#b9c0cc");
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
    /* ── 바다 기둥 블록(유리 수조처럼 속이 비친다): 동쪽 = +x, 북쪽 = −y. 깊이별 층마다 흐름 화살표 ── */
    var LW = 600, RX = 612, ZT = 214, CX = 130, CY = 130;
    var I = K.iso({ ox: 330, oy: 228, s: 0.72, L: 260, D: 260 });
    function dv(a, len) { var r = a * Math.PI / 180; return { x: len * Math.sin(r), y: -len * Math.cos(r) }; }
    function ring(z, rad, fill, stroke) {
      ctx.beginPath();
      for (var k = 0; k <= 48; k++) { var a = k / 48 * 6.2832, p = I.P(CX + rad * Math.cos(a), CY + rad * Math.sin(a), z); if (k) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); }
      ctx.closePath(); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.2; ctx.stroke(); }
    }
    function paint() {
      var s = sign(), i, k, L = I.L, D = I.D, tr = trans(), ok = tr === 180;
      ctx.clearRect(0, 0, W, H);
      var fc = I.P(L, D, 0);
      studioOpen(ctx, LW, H, { x: fc.x - 10, y: fc.y - 36, rx: 250, ry: 54 });
      /* 해저 바닥과 뒤쪽 유리벽 */
      I.plane(ctx, 0, "#d2bb90");
      I.quad(ctx, I.P(0, 0, 0), I.P(0, D, 0), I.P(0, D, ZT), I.P(0, 0, ZT), "rgba(60,140,210,.14)", "rgba(255,255,255,.5)");
      I.quad(ctx, I.P(0, 0, 0), I.P(L, 0, 0), I.P(L, 0, ZT), I.P(0, 0, ZT), "rgba(60,140,210,.2)", "rgba(255,255,255,.5)");
      K.line(ctx, I.P(CX, CY, 0), I.P(CX, CY, ZT + 30), "rgba(20,40,80,.4)", 1.2, [4, 4]);
      /* 깊이별 층과 흐름(깊은 층부터) */
      for (i = 5; i >= 0; i--) {
        var z = ZT - 10 - i * 36, al = 1 - i * .12;
        ring(z, 100, "rgba(110,190,245," + (.22 * al).toFixed(3) + ")", "rgba(30,100,180," + (.55 * al).toFixed(2) + ")");
        var v2 = dv(dir + s * (45 + i * 25), 96 * Math.pow(0.78, i));
        var a0 = I.P(CX, CY, z), a1 = I.P(CX + v2.x, CY + v2.y, z);
        ctx.save(); ctx.globalAlpha = .5 + .5 * al; if (!i) { ctx.shadowColor = "#1c7ed6"; ctx.shadowBlur = 8; }
        K.arrow(ctx, a0, a1, i === 0 ? "#1864ab" : "#1f6fc0", 5 - i * .5, 13 - i * .8); ctx.restore();
        for (k = 0; k < 3; k++) {
          var u = (ekT * (0.35 * Math.pow(0.78, i)) + k / 3) % 1;
          K.glow(ctx, a0.x + (a1.x - a0.x) * u, a0.y + (a1.y - a0.y) * u, 1.6, "rgba(225,245,255,.95)", 3);
        }
        var lp = I.P(0, D, z);
        K.pill(ctx, i === 0 ? "표층" : (i * 15) + " m", lp.x - 12, lp.y + 4, { a: "right", s: 11, c: i === 0 ? "#bfe6ff" : "#e8ecff", box: [0, LW] });
      }
      /* 앞면·오른쪽 면·수면(반투명 물) */
      I.face(ctx, "front", function (Lw) { var g = ctx.createLinearGradient(0, ZT, 0, 0); g.addColorStop(0, "rgba(90,180,240,.16)"); g.addColorStop(1, "rgba(10,50,120,.34)"); ctx.fillStyle = g; ctx.fillRect(0, 0, Lw, ZT); });
      I.face(ctx, "right", function (Lw) { var g = ctx.createLinearGradient(0, ZT, 0, 0); g.addColorStop(0, "rgba(60,140,210,.22)"); g.addColorStop(1, "rgba(8,36,96,.42)"); ctx.fillStyle = g; ctx.fillRect(0, 0, Lw, ZT); });
      I.plane(ctx, ZT, "rgba(150,215,250,.16)", "rgba(255,255,255,.85)");
      ctx.strokeStyle = "rgba(255,255,255,.55)"; ctx.lineWidth = 1;
      for (i = 0; i < 8; i++) {
        var gx = ((i * .37 + ekT * .03) % 1) * L, gy = ((i * .61) % 1) * D, r1 = I.P(gx - 12, gy, ZT), r2 = I.P(gx + 8, gy, ZT);
        ctx.beginPath(); ctx.moveTo(r1.x, r1.y); ctx.quadraticCurveTo((r1.x + r2.x) / 2, r1.y - 3, r2.x, r2.y); ctx.stroke();
      }
      I.edges(ctx, ZT, ZT);
      var e1 = I.P(0, D, ZT), e2 = I.P(L, D, ZT), e3 = I.P(L, 0, ZT);
      ctx.strokeStyle = "rgba(255,255,255,.75)"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(e1.x, e1.y); ctx.lineTo(e2.x, e2.y); ctx.lineTo(e3.x, e3.y); ctx.stroke();
      /* 수면의 방위 */
      [["북", 0], ["동", 90], ["남", 180], ["서", 270]].forEach(function (q) { var d2 = dv(q[1], 118), p = I.P(CX + d2.x, CY + d2.y, ZT); K.t(ctx, q[0], p.x, p.y + 4, { s: 11, w: "900", a: "center", c: "#0b3a6e" }); });
      /* 에크만 수송(층 전체) — 수면 위 굵은 화살표와 떠밀리는 오리 */
      var tv = dv(tr, 112);
      isoArrow(ctx, I, CX, CY, CX + tv.x, CY + tv.y, ZT + 2, "#e8590c", 7, 17, "#ff8a3c");
      for (k = 0; k < 3; k++) {
        var uu = (ekT * .16 + k / 3) % 1, dd = 18 + uu * 84, side = (k - 1) * 14, tvv = dv(tr, dd), nv = dv(tr + 90, side);
        var dp = I.P(CX + tvv.x + nv.x, CY + tvv.y + nv.y, ZT + 3);
        ctx.save(); ctx.globalAlpha = Math.min(1, (1 - uu) * 3); duck(ctx, dp.x, dp.y, 6.5, dp.x < I.P(CX, CY, ZT).x); ctx.restore();
      }
      /* 바람(수면 위) */
      var wv = dv(dir, 120), w0 = I.P(CX - wv.x * .2, CY - wv.y * .2, ZT + 52), w1 = I.P(CX + wv.x * .8, CY + wv.y * .8, ZT + 52);
      K.line(ctx, I.P(CX, CY, ZT), I.P(CX, CY, ZT + 52), "rgba(180,110,0,.6)", 1.4, [3, 3]);
      ctx.save(); ctx.shadowColor = "#ffb000"; ctx.shadowBlur = 10; K.arrow(ctx, w0, w1, "#f59f00", 6, 16); ctx.restore();
      ctx.restore();
      var bx = [0, LW];
      K.pill(ctx, "바람", w1.x + (w1.x > w0.x ? 8 : -8), w1.y - 8, { a: w1.x > w0.x ? "left" : "right", s: 12, c: "#ffd36b", box: bx });
      var tp = I.P(CX + tv.x, CY + tv.y, ZT + 2);
      K.pill(ctx, "에크만 수송", tp.x + (tp.x >= I.P(CX, CY, ZT).x ? 10 : -10), tp.y + 20, { a: tp.x >= I.P(CX, CY, ZT).x ? "left" : "right", s: 12, c: "#ffc078", box: bx });
      var sv = dv(surf(), 96), sp = I.P(CX + sv.x, CY + sv.y, ZT - 10);
      K.pill(ctx, "표층 해수", sp.x + (sp.x >= I.P(CX, CY, ZT).x ? 10 : -10), sp.y + 4, { a: sp.x >= I.P(CX, CY, ZT).x ? "left" : "right", s: 11, c: "#a5d8ff", box: bx });
      K.bigText(ctx, "수송 → " + dirName(tr) + "쪽", 18, 50, 28, ok ? "#8ce99a" : "#ffffff");
      K.bigText(ctx, (hemi === "N" ? "북반구" : "남반구") + " · 바람은 " + dirName(dir) + "쪽으로", 18, 82, 17, "#ffd35a");
      K.warn(ctx, LW - 14, H - 14, "⚠ 층 두께·흐름 세기는 보기 쉽게 그림", "right");

      /* ── 오른쪽 판정 카드 ── */
      judgeCard(ctx, RX, W, H, ok ? "정남쪽 ✓" : "수송 " + dirName(tr) + "쪽", ok ? LT.green : LT.ink, hemi === "N" ? "북반구 · 전향력 오른쪽" : "남반구 · 전향력 왼쪽");
      var px = RX + 18, px1 = W - 18;
      K.row(ctx, "바람이 부는 쪽", dir + "° " + dirName(dir), px, px1, 102, LT.yellow);
      K.row(ctx, "표층 해수 (" + (s > 0 ? "오른쪽" : "왼쪽") + " 45°)", surf() + "° " + dirName(surf()), px, px1, 130, LT.blue);
      K.row(ctx, "에크만 수송 (90°)", tr + "° " + dirName(tr), px, px1, 158, LT.orange);
      var mx = RX + (W - RX) / 2, my = 268, mr = 52;
      ctx.fillStyle = "#eef3f9"; ctx.beginPath(); ctx.arc(mx, my, mr, 0, 6.2832); ctx.fill();
      ctx.strokeStyle = "rgba(20,40,90,.25)"; ctx.lineWidth = 1.2; ctx.stroke();
      [["북", 0], ["동", 90], ["남", 180], ["서", 270]].forEach(function (q) { var p = compass(mx, my, q[1], mr + 12); K.t(ctx, q[0], p[0], p[1] + 4, { s: 11, w: "800", a: "center", c: LT.mute }); });
      function marr(a, len, col, w) { var p = compass(mx, my, a, len); K.arrow(ctx, { x: mx, y: my }, { x: p[0], y: p[1] }, col, w, 10); }
      K.wedge(ctx, mx, my, (dir - 90) * Math.PI / 180, (dir + s * 90 - 90) * Math.PI / 180, 30, "rgba(232,89,12,.14)", "rgba(232,89,12,.6)");
      marr(dir, mr - 6, LT.yellow, 3.5); marr(surf(), mr - 16, LT.blue, 3); marr(tr, mr - 4, LT.orange, 4.5);
      K.planet(ctx, mx, my, 4, "#ffffff", "#5c7086");
      note(ctx, "위에서 내려다본 방향", mx, 190, { a: "center", s: 10.5 });
      K.tip(ctx, ok ? "✓ 오리 떼가 환류 중심(남쪽)으로" : "수송을 정남쪽(180°)으로 맞추기", px - 4, 348, W - px - 14, ok);
      note(ctx, "깊어질수록 " + (s > 0 ? "오른쪽" : "왼쪽") + "으로 돌고 약해집니다", px, 410, { s: 11 });
      note(ctx, "층 전체를 합하면 바람의 직각 방향", px, 430, { s: 11 });
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
    /* ── 아열대 바다 블록: 앞면이 환류 중심을 지나도록 잘랐다. 동쪽 = +x, 북쪽 = −y ── */
    var LW = 600, RX = 612, ZS = 150, XC = 150, RR = 128;
    var I = K.iso({ ox: 330, oy: 206, s: 0.66, L: 420, D: 240 });
    var layer = cacheLayer(canvas, W, H);
    function bump() { return dh * 0.42; }
    function surfZ(x, y) { var r2 = ((x - XC) * (x - XC) + (y - I.D) * (y - I.D)) / (RR * RR); return ZS + bump() * Math.exp(-r2); }
    function bedZ() { return 0; }
    function zOfD(dd) { return ZS - dd / 800 * (ZS - 16); }
    var RINGS = [56, 96, 136];
    function ringPt(r, th) { return { x: XC + r * Math.cos(th), y: I.D - r * Math.sin(th) }; }
    function model(c) {
      var L = I.L, D = I.D, fc = I.P(L, D, 0), zd = zOfD(d);
      K.studio(c, 0, 0, LW, H, { x: fc.x - 70, y: fc.y - 36, rx: 290, ry: 56 });
      c.save(); c.beginPath(); c.roundRect(0, 0, LW, H, 14); c.clip();
      seaTop(c, I, bedZ, surfZ, 42, 24, null, function (x, y, dep, lt) { return seaCol(120, lt, (surfZ(x, y) - ZS) / Math.max(8, bump()) * .7); });
      seaFaces(c, I, bedZ, surfZ, { zt: ZS + 40, bedTop: 8, face: function (side, Lw) {
        c.save(); c.setLineDash([7, 5]); c.strokeStyle = "#ff4d6d"; c.lineWidth = 2;
        c.beginPath(); c.moveTo(0, zd); c.lineTo(Lw, zd); c.stroke(); c.restore();
        if (side === "front" && dh > 0) { c.save(); c.shadowColor = "#ff4d6d"; c.shadowBlur = 6; K.arrow(c, { x: XC + 26, y: zd }, { x: L - 56, y: zd }, "#ff6b81", 3 + dh / 60, 11); c.restore(); }
      } });
      /* 해수면 위 흐름 길(환류) */
      RINGS.forEach(function (r) {
        c.strokeStyle = "rgba(255,255,255,.75)"; c.lineWidth = 1.4; c.beginPath(); var pen = false;
        for (var a = 180; a >= 0; a -= 4) { var q = ringPt(r, a * Math.PI / 180); if (q.x < 2 || q.x > L - 2) { pen = false; continue; } var p = I.P(q.x, q.y, surfZ(q.x, q.y) + 1); if (pen) c.lineTo(p.x, p.y); else { c.moveTo(p.x, p.y); pen = true; } }
        c.stroke();
        var m0 = ringPt(r, 1.62), m1 = ringPt(r, 1.5);
        K.arrow(c, I.P(m0.x, m0.y, surfZ(m0.x, m0.y) + 1), I.P(m1.x, m1.y, surfZ(m1.x, m1.y) + 1), "rgba(255,255,255,.95)", 2, 9);
      });
      c.restore();
    }
    function paint() {
      ctx.clearRect(0, 0, W, H);
      var L = I.L, D = I.D, i, k, vv = speed(), ok = vv >= 6.5 && vv <= 7.0, zd = zOfD(d);
      var pe = 1 + d / 10, pc = 1 + (d + dh / 100) / 10;
      layer(ctx, dh + "|" + d, model);
      ctx.save(); ctx.beginPath(); ctx.roundRect(0, 0, LW, H, 14); ctx.clip();
      /* 흐르는 물 입자(시계 방향, 높은 중심을 오른쪽에 둔다) */
      var sp = clamp(vv, 0, 12) * .045;
      RINGS.forEach(function (r, j) {
        for (k = 0; k < 7; k++) {
          var th = Math.PI - ((geoT * sp * 136 / r + k / 7 + j * .13) % 1) * Math.PI, q = ringPt(r, th);
          if (q.x < 2 || q.x > L - 2) continue;
          var p = I.P(q.x, q.y, surfZ(q.x, q.y) + 1.5);
          K.glow(ctx, p.x, p.y, 1.7, "rgba(255,255,255,.95)", 3);
        }
      });
      /* 힘의 평형(한 지점) */
      var A = ringPt(96, Math.PI / 2), za = surfZ(A.x, A.y) + 4, f = dh > 0 ? 34 + 36 * Math.min(1, dh / 100) : 0;
      if (dh > 0) {
        isoArrow(ctx, I, A.x, A.y, A.x, A.y - f, za, "#e03131", 4, 12, "#ff6b81");
        isoArrow(ctx, I, A.x, A.y, A.x, A.y + f, za, "#1c7ed6", 4, 12, "#4dabf7");
        isoArrow(ctx, I, A.x - 10, A.y, A.x + 30 + 50 * Math.min(1, vv / 8), A.y, za, "#0f9f76", 6, 15, "#38d9a9");
      }
      var pA = I.P(A.x, A.y, za);
      K.planet(ctx, pA.x, pA.y, 4.5, "#ffffff", "#5c7086");
      /* 수압 점 */
      [[XC, pc], [L - 34, pe]].forEach(function (q) { var p = I.P(q[0], D, zd); K.glow(ctx, p.x, p.y, 4.5, "rgba(255,90,110,.98)", 3.2); });
      ctx.restore();
      var bx = [0, LW];
      if (dh > 0) {
        var t1 = I.P(A.x, A.y - f, za), t2 = I.P(A.x, A.y + f, za), t3 = I.P(A.x + 30 + 50 * Math.min(1, vv / 8), A.y, za);
        K.pill(ctx, "수압 경도력", t1.x + 8, t1.y - 6, { s: 11, c: "#ffb3c0", box: bx });
        K.pill(ctx, "전향력", t2.x - 8, t2.y + 18, { a: "right", s: 11, c: "#a5d8ff", box: bx });
        K.pill(ctx, "지형류", t3.x + 8, t3.y + 16, { s: 12, c: "#8ce99a", box: bx });
      }
      I.label(ctx, XC - 40, D - 20, surfZ(XC - 40, D - 20), "환류 중심 (해수면이 높다)", -10, -64, "#e8ecff", bx);
      I.label(ctx, XC, D, zd, pc.toFixed(3) + " 기압", -30, 44, "#ffb3c0", bx);
      I.label(ctx, L - 34, D, zd, "가장자리 " + pe.toFixed(3) + " 기압", 16, 46, "#ffb3c0", bx);
      var lz = I.P(0, D, zd); K.pill(ctx, "수심 " + d + " m", lz.x - 10, lz.y + 4, { a: "right", s: 11, c: "#ff9aac", box: bx });
      K.bigText(ctx, "지형류 " + vv.toFixed(2) + " cm/s", 18, 50, 27, ok ? "#8ce99a" : "#ffffff");
      K.bigText(ctx, "해수면 높이차 " + dh + " cm", 18, 82, 18, "#ffd35a");
      K.warn(ctx, LW - 14, 30, "⚠ 해수면 높이차는 크게 과장", "right");

      /* ── 판정 카드 ── */
      judgeCard(ctx, RX, W, H, vv.toFixed(2) + " cm/s", ok ? LT.green : LT.ink, "북반구 · 위도 30°N");
      var px = RX + 18, px1 = W - 18;
      K.row(ctx, "수심", d + " m", px, px1, 102);
      K.row(ctx, "가장자리 수압", pe.toFixed(3) + " 기압", px, px1, 128, Math.abs(pe - 21) <= 0.05 ? LT.green : LT.ink);
      K.row(ctx, "환류 중심 수압", pc.toFixed(3) + " 기압", px, px1, 154);
      K.row(ctx, "해수면 높이차", dh + " cm", px, px1, 180, LT.blue);
      note(ctx, "지형류 유속 (0 ~ 12 cm/s)", px, 210, { s: 11 });
      var bw = px1 - px;
      ctx.fillStyle = "rgba(15,159,118,.18)"; ctx.fillRect(px + bw * 6.5 / 12, 218, bw * .5 / 12, 10);
      K.bar(ctx, px, 218, bw, vv / 12, ok ? LT.green : LT.blue);
      ctx.fillStyle = "rgba(15,159,118,.25)"; ctx.fillRect(px + bw * 6.5 / 12, 218, bw * .5 / 12, 10);
      note(ctx, "목표 6.5~7.0", px + bw * 6.75 / 12, 246, { a: "center", s: 10.5, c: LT.green });
      K.tip(ctx, ok ? "✓ 두 힘이 맞서는 속도를 찾았습니다" : (vv < 6.5 ? "높이차를 더 키워 보세요" : "높이차를 조금 줄여 보세요"), px - 4, 258, W - px - 14, ok);
      note(ctx, "수압 경도력 ↔ 전향력이 같아질 때", px, 322, { s: 11 });
      note(ctx, "물은 등수압선을 따라 흐릅니다", px, 342, { s: 11 });
      note(ctx, "북반구: 높은 쪽을 오른쪽에 두고 흐름", px, 368, { s: 11, c: LT.ink });
      note(ctx, "→ 북태평양 아열대 환류는 시계 방향", px, 388, { s: 11, c: LT.ink });
      note(ctx, "중심~가장자리 2,000 km 로 계산", px, 424, { s: 10.5 });
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
    /* ── 바다 분지 블록: 동쪽 = +x, 북쪽 = −y(앞면 = 남쪽 끝 단면). 서쪽·동쪽에 대륙 ── */
    var LW = 600, RX = 612, ZS = 60, LAND = 34, KM = 0.14, ZW = 26, ZE = 16;
    var I = K.iso({ ox: 214, oy: 168, s: 0.6, L: 620, D: 300 });
    var WW = 100 * KM;
    var layer = cacheLayer(canvas, W, H);
    function wE() { return clamp(wid * KM, 14, I.L - 2 * LAND - 60); }
    function model(c) {
      var L = I.L, D = I.D, we = wE(), fc = I.P(L, D, 0), xe0 = L - LAND - we, i;
      K.studio(c, 0, 0, LW, H, { x: fc.x - 90, y: fc.y - 40, rx: 300, ry: 58 });
      c.save(); c.beginPath(); c.roundRect(0, 0, LW, H, 14); c.clip();
      /* 서쪽 대륙 */
      I.box(c, 0, 0, 0, LAND, D, ZS + 8, "#7fae5a", "#8a6a45", "#6d5236");
      /* 바다 윗면: 북쪽(차갑다) → 남쪽(따뜻하다) */
      var g0 = I.P(L / 2, 0, ZS), g1 = I.P(L / 2, D, ZS), sg = c.createLinearGradient(g0.x, g0.y, g1.x, g1.y), NX = LAND + 46;
      sg.addColorStop(0, "#3d78c6"); sg.addColorStop(1, "#45c1d6");
      I.plane(c, ZS, sg, null, LAND, L - LAND, 0, D);
      /* 경계류 띠(윗면) */
      c.save(); c.globalAlpha = side === "west" ? .95 : .6;
      I.plane(c, ZS + .3, "rgba(240,90,70,.85)", null, LAND, LAND + WW, 0, D); c.restore();
      c.save(); c.globalAlpha = side === "east" ? .9 : .55;
      I.plane(c, ZS + .3, "rgba(160,215,255,.85)", null, xe0, L - LAND, 0, D); c.restore();
      /* 앞면(남쪽 끝): 바다 단면과 두 해류의 단면 */
      I.face(c, "front", function (Lw) {
        var wg = c.createLinearGradient(0, ZS, 0, 0); wg.addColorStop(0, "#3fa3dc"); wg.addColorStop(.5, "#1c64ad"); wg.addColorStop(1, "#0b2a63");
        c.fillStyle = wg; c.fillRect(LAND, 0, L - 2 * LAND, ZS);
        var rg = c.createLinearGradient(0, ZS, 0, ZS - ZW); rg.addColorStop(0, "#ff7a5c"); rg.addColorStop(1, "#c92a2a");
        c.fillStyle = rg; c.beginPath(); c.moveTo(LAND, ZS); c.lineTo(LAND + WW, ZS); c.quadraticCurveTo(LAND + WW, ZS - ZW, LAND, ZS - ZW); c.closePath(); c.fill();
        var bg = c.createLinearGradient(0, ZS, 0, ZS - ZE); bg.addColorStop(0, "#c5e6ff"); bg.addColorStop(1, "#6fb2ea");
        c.fillStyle = bg; c.beginPath(); c.moveTo(xe0, ZS); c.lineTo(L - LAND, ZS); c.lineTo(L - LAND, ZS - ZE); c.quadraticCurveTo(xe0 + 4, ZS - ZE, xe0, ZS); c.closePath(); c.fill();
        c.strokeStyle = "rgba(255,255,255,.85)"; c.lineWidth = 1.4; c.beginPath(); c.moveTo(LAND, ZS); c.lineTo(L - LAND, ZS); c.stroke();
      });
      I.shade(c, "front", function () { return ZS; });
      /* 동쪽 대륙 */
      I.box(c, L - LAND, 0, 0, L, D, ZS + 8, "#7fae5a", "#8a6a45", "#6d5236");
      var R = K.rng(21);
      for (i = 0; i < 9; i++) I.tree(c, 6 + R() * (LAND - 12), 20 + R() * (D - 40), ZS + 8, .7);
      for (i = 0; i < 9; i++) I.tree(c, L - LAND + 6 + R() * (LAND - 12), 20 + R() * (D - 40), ZS + 8, .7);
      I.edges(c, ZS + 8, ZS + 8);
      /* 환류의 길 */
      var x0 = LAND + WW / 2, x1 = xe0 + we / 2, y0 = 44, y1 = D - 44;
      c.strokeStyle = "rgba(255,255,255,.55)"; c.lineWidth = 1.6; c.setLineDash([6, 5]);
      [[x0, y1, x0, y0], [x0, y0, x1, y0], [x1, y0, x1, y1], [x1, y1, x0, y1]].forEach(function (s4) { var a = I.P(s4[0], s4[1], ZS + .6), b = I.P(s4[2], s4[3], ZS + .6); c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke(); });
      c.setLineDash([]);
      isoArrow(c, I, (x0 + x1) / 2 - 40, y0, (x0 + x1) / 2 + 30, y0, ZS + .6, "rgba(255,255,255,.95)", 2.4, 10);
      isoArrow(c, I, (x0 + x1) / 2 + 40, y1, (x0 + x1) / 2 - 30, y1, ZS + .6, "rgba(255,255,255,.95)", 2.4, 10);
      /* 북쪽 표시 */
      isoArrow(c, I, NX, 80, NX, 22, ZS + 10, "#12203a", 2.2, 9);
      c.restore();
    }
    function paint() {
      ctx.clearRect(0, 0, W, H);
      var L = I.L, D = I.D, we = wE(), xe0 = L - LAND - we, i, t = et(), diff = Math.abs(t - WT), ok = diff <= 2;
      layer(ctx, wid + "|" + side, model);
      ctx.save(); ctx.beginPath(); ctx.roundRect(0, 0, LW, H, 14); ctx.clip();
      /* 물 입자: 서쪽은 빠르게 북으로, 동쪽은 느리게 남으로 */
      var R = K.rng(9);
      for (i = 0; i < 16; i++) {
        var yw = D - 10 - ((R() * (D - 20) + bndT * 120) % (D - 20)), p = I.P(LAND + 2 + R() * (WW - 4), yw, ZS + 1);
        K.glow(ctx, p.x, p.y, 1.7, "rgba(255,240,225,.98)", 3);
      }
      var ne = Math.round(10 + we / 8);
      for (i = 0; i < ne; i++) {
        var ye = 10 + ((R() * (D - 20) + bndT * 12) % (D - 20)), q = I.P(xe0 + 3 + R() * (we - 6), ye, ZS + 1);
        K.glow(ctx, q.x, q.y, 1.5, "rgba(255,255,255,.95)", 3);
      }
      ctx.restore();
      var bx = [0, LW], np = I.P(LAND + 46, 18, ZS + 10);
      K.pill(ctx, "북", np.x + 6, np.y - 2, { s: 11, c: "#ffffff", box: bx });
      I.label(ctx, LAND + WW / 2, D * .62, ZS + 1, "서안 경계류 ↑ 빠름", -16, 70, "#ffc9c9", bx);
      I.label(ctx, xe0 + we / 2, D * .35, ZS + 1, "동안 경계류 ↓ 느림", 34, -64, "#d0ebff", bx);
      var fp = I.P(L * .5, D, ZS * .3); K.pill(ctx, "앞면 = 적도 쪽 끝 단면 (빨강 서안 · 하늘 동안)", fp.x - 40, fp.y + 50, { a: "center", s: 10.5, c: "#e8ecff", box: bx });
      var wl = I.P(L * .45, 44, ZS + 1); K.pill(ctx, "편서풍 쪽 →", wl.x + 6, wl.y - 8, { s: 10.5, c: "#ffffff", box: bx });
      K.bigText(ctx, ok ? "같은 양을 나른다" : "서안 " + WT.toFixed(0) + " Sv · 동안 " + t.toFixed(1) + " Sv", 18, 50, ok ? 28 : 24, ok ? "#8ce99a" : "#ffffff");
      K.bigText(ctx, side === "west" ? "서안: 좁고 빠르고 깊다" : "동안: 넓고 느리고 얕다", 18, 82, 18, "#ffd35a");
      K.warn(ctx, LW - 14, 30, "⚠ 해류 폭·깊이는 과장", "right");

      /* ── 판정 카드 ── */
      judgeCard(ctx, RX, W, H, ok ? "수송량 같음 ✓" : (t < WT ? "동안이 적게 나름" : "동안이 많이 나름"), ok ? LT.green : LT.ink, "북반구 아열대 환류");
      var px = RX + 18, px1 = W - 18, bw = px1 - px;
      ctx.fillStyle = side === "west" ? "rgba(224,49,49,.07)" : "rgba(28,126,214,.07)";
      ctx.beginPath(); ctx.roundRect(RX + 8, side === "west" ? 82 : 156, W - RX - 16, 70, 10); ctx.fill();
      K.row(ctx, "서안 경계류 (쿠로시오)", WT.toFixed(0) + " Sv", px, px1, 104, LT.red);
      note(ctx, "폭 100 km · 깊이 800 m · 50 cm/s", px, 122, { s: 10.5 });
      K.bar(ctx, px, 132, bw, WT / 80, LT.red);
      K.row(ctx, "동안 경계류 (캘리포니아)", t.toFixed(1) + " Sv", px, px1, 178, LT.blue);
      note(ctx, "폭 " + wid.toLocaleString() + " km · 깊이 500 m · 5 cm/s", px, 196, { s: 10.5 });
      K.bar(ctx, px, 206, bw, t / 80, LT.blue);
      K.line(ctx, { x: px + bw * WT / 80, y: 128 }, { x: px + bw * WT / 80, y: 222 }, "rgba(20,40,90,.55)", 1.3, [3, 3]);
      K.tip(ctx, ok ? "✓ 두 해류가 같은 양을 나릅니다" : "수송량 차이 " + diff.toFixed(1) + " Sv", px - 4, 240, W - px - 14, ok);
      note(ctx, side === "west" ? "따뜻한 물을 고위도로 · 경계가 뚜렷" : "찬 물을 저위도로 · 경계가 흐릿", px, 304, { s: 11, c: LT.ink });
      note(ctx, "수송량 = 폭 × 깊이 × 유속", px, 336, { s: 11 });
      note(ctx, "1 Sv = 100만 m³/s", px, 356, { s: 11 });
      note(ctx, "좁은 서안 한 줄기가 넓은 동안과", px, 392, { s: 11 });
      note(ctx, "같은 양을 나르는 것 = 서안 강화", px, 412, { s: 11, c: LT.ink });
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
    /* ── 긴 바다 블록: 바람은 +x 쪽으로 분다. 0 ~ XF 가 바람이 부는 해역(취송 거리), 그 뒤는 너울이 빠져나가는 바다 ── */
    var LW = 600, RX = 612, ZB = 26, ZS = 92, XF = 500;
    var I = K.iso({ ox: 150, oy: 200, s: 0.62, L: 640, D: 160 });
    function stateShort() {
      var hf = 0.0016 * U * Math.sqrt(feff() * 1000 / G), hp = 0.0246 * U * U;
      if (hp <= hf) return "완전히 발달한 바다";
      if (1.44 * U * tt < Fk) return "지속 시간이 모자람";
      return "취송 거리가 모자람";
    }
    function paint() {
      ctx.clearRect(0, 0, W, H);
      var Hs = height(), ok = Hs >= 2 && Hs <= 2.5, L = I.L, D = I.D, k, i;
      var A = clamp(Hs * 3.4, 0.6, 44), xe = Math.max(30, XF * feff() / Fk);
      function g(x) { return Math.sqrt(clamp(Math.min(x, xe) / xe, 0, 1)); }
      function surf(x, y) {
        var gx = g(x), lam = 22 + 46 * gx, ph = x / lam * 6.2832 - genT * (2.6 - gx) + .5 * Math.sin(y / 23 + x / 90);
        return ZS + A * gx * .5 * Math.sin(ph) + (x < XF ? A * gx * .12 * Math.sin(x / 7 + y / 9 - genT * 4) : 0);
      }
      function bed() { return ZB; }
      var fc = I.P(L, D, 0);
      studioOpen(ctx, LW, H, { x: fc.x - 120, y: fc.y - 40, rx: 320, ry: 56 });
      seaTop(ctx, I, bed, surf, 80, 8, null, function (x, y, dep, lt) { var c0 = seaCol(90, lt); if (x < XF && dep > ZS - ZB + A * .3 && Hs > 1) return mixc("#3d8fd6", "#f2f8ff", .55); return c0; });
      seaFaces(ctx, I, bed, surf, { zt: ZS + 20, bedTop: ZB });
      /* 물마루 흰 거품 */
      if (Hs > 1) {
        for (i = 0; i < 70; i++) {
          var fx = (i * 37.3) % XF, fy = (i * 61.7) % D, zz = surf(fx, fy);
          if (zz > ZS + A * g(fx) * .38) { var fp = I.P(fx, fy, zz + .5); K.glow(ctx, fp.x, fp.y, 1.2 + Math.min(Hs, 5) * .25, "rgba(255,255,255,.9)", 2.4); }
        }
      }
      /* 관측 부이(끝) */
      var by = D * .55, bz = surf(L - 40, by);
      I.box(ctx, L - 46, by - 5, bz - 2, L - 34, by + 5, bz + 6, "#ffd43b", "#f59f00", "#d9480f");
      var m0 = I.P(L - 40, by, bz + 6), m1 = I.P(L - 40, by, bz + 26);
      ctx.strokeStyle = "#343a40"; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(m0.x, m0.y); ctx.lineTo(m1.x, m1.y); ctx.stroke();
      K.glow(ctx, m1.x, m1.y, 2.4, "rgba(255,80,80,.95)", 2.6);
      /* 폭풍 구름과 바람 줄기 */
      [[70, 1], [190, 2], [310, 3], [430, 4]].forEach(function (q) { var p = I.P(q[0], D * .35, ZS + 120); puffCloud(ctx, p.x, p.y, .62 + U / 60, clamp((U - 4) / 22, 0, .85), q[1] + 4); });
      var spd = 26 + U * 8;
      for (k = 0; k < 9; k++) {
        var wx = ((k * 61 + genT * spd) % XF), wy = 20 + (k * 47) % (D - 40), wz = ZS + 40 + (k % 3) * 14;
        var a = I.P(wx, wy, wz), b = I.P(Math.min(XF, wx + 34 + U * 1.8), wy, wz);
        ctx.save(); ctx.globalAlpha = .45 + U / 50; K.arrow(ctx, a, b, "#f08c00", Math.max(1.8, U / 6), 9); ctx.restore();
      }
      ctx.restore();
      /* 취송 거리 눈금(앞쪽 아래 모서리) */
      var bx = [0, LW], d0 = I.P(0, D, 0), d1 = I.P(XF, D, 0), de = I.P(Math.min(xe, XF), D, 0);
      function tick(p, col) { ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(p.x, p.y + 6); ctx.lineTo(p.x, p.y + 20); ctx.stroke(); }
      K.line(ctx, { x: d0.x, y: d0.y + 14 }, { x: d1.x, y: d1.y + 14 }, "#12203a", 2);
      tick(d0, "#12203a"); tick(d1, "#12203a");
      if (xe < XF - 4) { K.line(ctx, { x: d0.x, y: d0.y + 22 }, { x: de.x, y: de.y + 22 }, "#e8590c", 3); tick(de, "#e8590c"); }
      K.pill(ctx, "취송 거리 " + Fk.toLocaleString() + " km", d0.x + (d1.x - d0.x) * .78, d0.y + (d1.y - d0.y) * .78 + 46, { a: "center", s: 11.5, c: "#ffffff", box: bx });
      if (xe < XF - 4) K.pill(ctx, "바람을 실제로 받은 거리 " + Math.round(feff()).toLocaleString() + " km", Math.max(120, (d0.x + de.x) / 2 - 10), (d0.y + de.y) / 2 + 52, { a: "center", s: 11, c: "#ffc078", box: bx });
      I.label(ctx, L - 40, by, bz + 26, "파고계 " + Hs.toFixed(2) + " m", 26, -26, ok ? "#8ce99a" : "#ffffff", bx);
      var cp = I.P(250, D * .35, ZS + 140); K.pill(ctx, "바람이 부는 해역", cp.x, cp.y - 14, { a: "center", s: 11, c: "#ffd36b", box: bx });
      K.bigText(ctx, "파고 " + Hs.toFixed(2) + " m", 18, 50, 28, ok ? "#8ce99a" : "#ffffff");
      K.bigText(ctx, stateShort(), 18, 82, 18, "#ffd35a");
      K.warn(ctx, LW - 14, 30, "⚠ 파고는 보기 쉽게 과장", "right");

      /* ── 판정 카드 ── */
      judgeCard(ctx, RX, W, H, ok ? "대회 파도 ✓" : (Hs < 2 ? "아직 낮다" : "너무 높다"), ok ? LT.green : (Hs < 2 ? LT.ink : LT.orange), "규정 2.0~2.5 m");
      var px = RX + 18, px1 = W - 18, bw = px1 - px;
      K.row(ctx, "풍속", U + " m/s", px, px1, 102, LT.yellow);
      K.row(ctx, "취송 거리", Fk.toLocaleString() + " km", px, px1, 128);
      K.row(ctx, "지속 시간", tt + " 시간", px, px1, 154);
      K.row(ctx, "바람을 실제로 받은 거리", Math.round(feff()).toLocaleString() + " km", px, px1, 180, LT.orange);
      note(ctx, "파고 (0 ~ 5 m)", px, 214, { s: 11 });
      K.bar(ctx, px, 222, bw, Hs / 5, ok ? LT.green : (Hs > 2.5 ? LT.orange : LT.blue));
      ctx.fillStyle = "rgba(15,159,118,.3)"; ctx.fillRect(px + bw * .4, 219, bw * .1, 16);
      note(ctx, "2.0~2.5", px + bw * .45, 252, { a: "center", s: 10.5, c: LT.green });
      K.t(ctx, Hs.toFixed(2) + " m", px1, 214, { s: 14, w: "900", a: "right", c: ok ? LT.green : LT.ink });
      K.tip(ctx, stateShort(), px - 4, 264, W - px - 14, ok ? true : null);
      note(ctx, "파고를 정하는 세 가지", px, 326, { s: 11.5, c: LT.ink, w: "800" });
      note(ctx, "① 풍속  ② 취송 거리  ③ 지속 시간", px, 348, { s: 11 });
      note(ctx, "하나만 모자라도 더 자라지 못합니다", px, 368, { s: 11 });
      note(ctx, "바람이 짧게 불면 먼 곳까지", px, 400, { s: 10.5 });
      note(ctx, "바람을 받지 못합니다(주황 눈금)", px, 418, { s: 10.5 });
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
    /* ── 북태평양에서 대회장까지 길게 자른 바다 띠 블록. 너울은 +x 쪽으로 달린다 ── */
    var LW = 600, RX = 612, ZS = 40, XS = 96, XB = 700;
    var I = K.iso({ ox: 118, oy: 166, s: 0.6, L: 760, D: 150 });
    function paint() {
      ctx.clearRect(0, 0, W, H);
      var c = cc(), hr = hours(), ok = hr >= 47 && hr <= 49, L0 = I.L, D = I.D, x, k, i;
      var lam = 16 + (L - 100) / 400 * 74, vis = c * 2.6, A = 4.2;
      function bed(xx) { return xx > XB ? ZS + 4 + (xx - XB) * .12 : (xx > XB - 50 ? 8 + (xx - (XB - 50)) / 50 * (ZS - 4) : 8); }
      function surf(xx, yy) {
        if (xx < XS) return ZS + 2.6 * Math.sin(xx / 6 + yy / 8 - swT * 5) + 1.6 * Math.sin(xx / 4.3 - yy / 5 + swT * 3);
        return ZS + A * Math.sin((xx - XS - swT * vis) / lam * 6.2832);
      }
      var fc = I.P(L0, D, 0);
      studioOpen(ctx, LW, H, { x: fc.x - 140, y: fc.y - 40, rx: 330, ry: 56 });
      seaTop(ctx, I, function (xx) { return bed(xx); }, surf, 120, 5, function (xx, yy, z, lt) { return K.tint(xx > XB + 20 ? "#7fae5a" : "#e3c48e", lt); });
      seaFaces(ctx, I, function (xx) { return bed(xx); }, surf, { zt: ZS + 10, bedTop: 14 });
      /* 물마루 선 */
      ctx.strokeStyle = "rgba(255,255,255,.8)"; ctx.lineWidth = 1.3;
      var off = ((swT * vis) % lam + lam) % lam;
      for (x = XS + lam / 4 + off - lam; x < XB - 50; x += lam) {
        if (x < XS) continue;
        var a = I.P(x, 4, ZS + A + .4), b = I.P(x, D - 4, ZS + A + .4);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
      /* 해변 사람들과 깃발 */
      [[XB + 18, 40, "#ff6b81"], [XB + 26, 70, "#4fb6ff"], [XB + 16, 104, "#3fd3a3"], [XB + 30, 122, "#ffd35a"]].forEach(function (q) { I.person(ctx, q[0], q[1], bed(q[0]), q[2], .9); });
      var f0 = I.P(XB + 44, 30, bed(XB + 44)), f1 = I.P(XB + 44, 30, bed(XB + 44) + 40);
      ctx.strokeStyle = "#495057"; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(f0.x, f0.y); ctx.lineTo(f1.x, f1.y); ctx.stroke();
      ctx.fillStyle = "#e03131"; ctx.beginPath(); ctx.moveTo(f1.x, f1.y); ctx.lineTo(f1.x + 14, f1.y + 5); ctx.lineTo(f1.x, f1.y + 10); ctx.closePath(); ctx.fill();
      /* 저기압 소용돌이 */
      var lp = I.P(48, D * .5, ZS + 46);
      swirl(ctx, lp.x, lp.y, 58, swT * .6, 1);
      ctx.restore();
      var bx = [0, LW];
      K.pill(ctx, "L 저기압 (폭풍)", lp.x + 6, lp.y - 40, { a: "center", s: 12, c: "#d0bfff", box: bx });
      I.label(ctx, XB + 20, 70, bed(XB + 20) + 14, "🏄 대회장", 20, -40, "#ffffff", bx);
      var d0 = I.P(XS, D, 0), d1 = I.P(XB, D, 0);
      K.line(ctx, { x: d0.x, y: d0.y + 14 }, { x: d1.x, y: d1.y + 14 }, "#12203a", 2);
      [d0, d1].forEach(function (p) { ctx.strokeStyle = "#12203a"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(p.x, p.y + 6); ctx.lineTo(p.x, p.y + 22); ctx.stroke(); });
      K.pill(ctx, "3,600 km", (d0.x + d1.x) / 2 - 22, (d0.y + d1.y) / 2 + 44, { a: "center", s: 12, c: "#ffffff", box: bx });
      var c0 = XS + lam / 4 + off; if (c0 < XS + 20) c0 += lam;
      var k0 = I.P(c0, D, ZS + A + 6), k1 = I.P(c0 + lam, D, ZS + A + 6);
      ctx.strokeStyle = "#1864ab"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(k0.x, k0.y); ctx.lineTo(k1.x, k1.y); ctx.stroke();
      [k0, k1].forEach(function (p) { ctx.beginPath(); ctx.moveTo(p.x, p.y - 5); ctx.lineTo(p.x, p.y + 5); ctx.stroke(); });
      K.pill(ctx, "파장 " + L + " m", (k0.x + k1.x) / 2 + 8, (k0.y + k1.y) / 2 - 10, { s: 11, c: "#a5d8ff", box: bx });
      var ar0 = I.P(330, 6, ZS + 30), ar1 = I.P(420, 6, ZS + 30);
      K.arrow(ctx, ar0, ar1, "#1c7ed6", 3, 11);
      K.pill(ctx, "너울이 달려가는 방향", ar1.x + 8, ar1.y + 4, { s: 10.5, c: "#ffffff", box: bx });
      K.bigText(ctx, "도착까지 " + hr.toFixed(1) + "시간", 18, 50, 28, ok ? "#8ce99a" : "#ffffff");
      K.bigText(ctx, "파장 " + L + " m 너울 · 시속 " + (c * 3.6).toFixed(0) + " km", 18, 82, 18, "#ffd35a");
      K.warn(ctx, LW - 14, H - 14, "⚠ 물결 높이·간격은 보기 쉽게 그림", "right");

      /* ── 판정 카드 ── */
      judgeCard(ctx, RX, W, H, ok ? "48시간 도착 ✓" : (hr > 49 ? "너무 늦다" : "너무 이르다"), ok ? LT.green : LT.orange, "심해파");
      var px = RX + 18, px1 = W - 18, bw = px1 - px;
      K.row(ctx, "파장", L + " m", px, px1, 102, LT.blue);
      K.row(ctx, "주기", Math.sqrt(2 * Math.PI * L / G).toFixed(1) + " 초", px, px1, 128);
      K.row(ctx, "파속 √(gL/2π)", c.toFixed(2) + " m/s", px, px1, 154, LT.blue);
      K.row(ctx, "시속", (c * 3.6).toFixed(0) + " km", px, px1, 180);
      note(ctx, "도착 시각 (0 ~ 72시간)", px, 214, { s: 11 });
      ctx.fillStyle = "#e3e9f1"; ctx.beginPath(); ctx.roundRect(px, 222, bw, 12, 6); ctx.fill();
      ctx.fillStyle = ok ? LT.green : LT.blue; ctx.beginPath(); ctx.roundRect(px, 222, Math.max(6, bw * clamp(hr / 72, 0, 1)), 12, 6); ctx.fill();
      [0, 24, 48, 72].forEach(function (t) { var gx = px + bw * t / 72; K.line(ctx, { x: gx, y: 216 }, { x: gx, y: 240 }, t === 48 ? LT.orange : "rgba(20,40,90,.3)", t === 48 ? 2.4 : 1); note(ctx, t + "h", gx, 254, { a: t === 0 ? "left" : (t === 72 ? "right" : "center"), s: 10, c: t === 48 ? LT.orange : LT.mute }); });
      K.t(ctx, hr.toFixed(1) + " 시간", px1, 214, { s: 14, w: "900", a: "right", c: ok ? LT.green : LT.ink });
      K.tip(ctx, ok ? "✓ 대회 시작(48시간)에 딱 맞음" : (hr > 49 ? "파장을 늘려 보세요" : "파장을 줄여 보세요"), px - 4, 268, W - px - 14, ok);
      note(ctx, "깊은 바다에서는 수심과 관계없이", px, 334, { s: 11 });
      note(ctx, "파장이 길수록 빨리 달립니다", px, 354, { s: 11, c: LT.ink });
      note(ctx, "→ 폭풍 뒤에는 긴 너울부터 도착", px, 380, { s: 11 });
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
    /* ── 바다 블록: 가로 600 m, 수심은 제곱근 눈금으로 과장. 앞면에 물 입자의 궤도 ── */
    var LW = 600, RX = 612, ZB = 34;
    var I = K.iso({ ox: 150, oy: 214, s: 0.62, L: 600, D: 120 });
    function dz() { return 24 + Math.sqrt(h) * 7.3; }
    var KNAME = { deep: "심해파", mid: "전이대", shallow: "천해파" };
    function paint() {
      ctx.clearRect(0, 0, W, H);
      var L = localL(), kd = kind(L), hs = shoalH(L), k = 2 * Math.PI / L, c = L / T0, i, j;
      var top = ZB + dz(), A = clamp(hs, 0, 6) * 3.6, om = 2 * Math.PI / 2.4, brk = hs / h > 0.78;
      function th(x) { return x / L * 6.2832 - shT * om; }
      function surf(x) { return top + A * Math.cos(th(x)); }
      var fc = I.P(I.L, I.D, 0);
      studioOpen(ctx, LW, H, { x: fc.x - 110, y: fc.y - 36, rx: 310, ry: 54 });
      seaTop(ctx, I, function () { return ZB; }, function (x) { return surf(x); }, 120, 5, null, function (x, y, dep, lt) { return seaCol(60 + dz() * .5, lt); });
      seaFaces(ctx, I, function () { return ZB; }, function (x) { return surf(x); }, { zt: top + 10, bedTop: ZB, face: function (side, Lw) {
        if (side !== "front") return;
        var D2 = dz(), sh = Math.sinh(k * h), rows = D2 > 60 ? [.14, .42, .74] : [.5];
        for (j = 0; j < rows.length; j++) {
          var zc = top - rows[j] * D2, zr = -rows[j] * h;
          var AO = clamp(hs, 0, 6) * 11, ax = Math.min(AO * Math.cosh(k * (h + zr)) / sh, L / 2.4, 70), bz = Math.min(AO * Math.sinh(k * (h + zr)) / sh, D2 * .45);
          for (i = 0; i < 4; i++) {
            var u = 90 + i * 140;
            if (ax > 1.2) { ctx.strokeStyle = "rgba(190,255,225,.9)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(u, zc, ax, Math.max(.8, bz), 0, 0, 6.2832); ctx.stroke(); }
            var tq = th(u);
            ctx.fillStyle = "#ffffff"; ctx.strokeStyle = "#0b7285"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(u - ax * Math.sin(tq), zc + bz * Math.cos(tq), 4, 0, 6.2832); ctx.fill(); ctx.stroke();
          }
        }
      } });
      if (brk) {
        for (i = 0; i < 40; i++) { var fx = (i * 41.3) % I.L, fy = (i * 17.9) % I.D; if (Math.cos(th(fx)) > .75) { var fp = I.P(fx, fy, surf(fx) + .5); K.glow(ctx, fp.x, fp.y, 2, "rgba(255,255,255,.95)", 2.4); } }
      }
      ctx.restore();
      var bx = [0, LW];
      var cx0 = 140 - (((shT * om) / 6.2832 * L) % L);
      while (cx0 < 30) cx0 += L;
      if (cx0 + L < I.L - 10) {
        var k0 = I.P(cx0, 0, top + A + 6), k1 = I.P(cx0 + L, 0, top + A + 6);
        ctx.strokeStyle = "#1864ab"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(k0.x, k0.y); ctx.lineTo(k1.x, k1.y); ctx.stroke();
        [k0, k1].forEach(function (p) { ctx.beginPath(); ctx.moveTo(p.x, p.y - 5); ctx.lineTo(p.x, p.y + 5); ctx.stroke(); });
        K.pill(ctx, "파장 " + L.toFixed(0) + " m", (k0.x + k1.x) / 2, (k0.y + k1.y) / 2 - 12, { a: "center", s: 11, c: "#a5d8ff", box: bx });
      }
      I.label(ctx, 520, I.D, ZB, "해저 · 수심 " + h + " m", 24, 40, "#f4e6c4", bx);
      I.label(ctx, 90, I.D, top - (dz() > 60 ? .14 : .5) * dz(), "물 입자의 궤도", -24, 78, "#b2f2bb", bx);
      K.bigText(ctx, KNAME[kd] + " · h/L = " + (h / L).toFixed(3), 18, 50, 27, kd === "mid" ? "#ffffff" : "#8ce99a");
      K.bigText(ctx, kd === "deep" ? "속도는 파장이 정한다" : (kd === "shallow" ? "속도는 수심이 정한다 √(gh)" : "파장과 수심 모두 영향"), 18, 82, 18, "#ffd35a");
      K.warn(ctx, 14, H - 14, "⚠ 수심은 제곱근 눈금 · 파고·괤도는 과장");

      /* ── 판정 카드 ── */
      judgeCard(ctx, RX, W, H, KNAME[kd], kd === "mid" ? LT.ink : LT.green, "깊은 바다: L₀ 280 m · " + T0.toFixed(1) + "초");
      var px = RX + 18, px1 = W - 18, bw = px1 - px;
      K.row(ctx, "수심 h", h + " m", px, px1, 102);
      K.row(ctx, "그 자리의 파장 L", L.toFixed(0) + " m", px, px1, 128, LT.blue);
      K.row(ctx, "파속", c.toFixed(2) + " m/s", px, px1, 154, LT.blue);
      K.row(ctx, "파고", hs.toFixed(2) + " m", px, px1, 180, brk ? LT.orange : LT.green);
      /* h/L 눈금: 0.01 ~ 1 (로그) */
      function gx(r) { return px + bw * clamp((Math.log(r) / Math.LN10 + 2) / 2, 0, 1); }
      var y0 = 220;
      [[0.01, 0.05, "#d3f9d8", "천해파"], [0.05, 0.5, "#e9ecef", "전이대"], [0.5, 1, "#d0ebff", "심해파"]].forEach(function (z) {
        ctx.fillStyle = z[2]; ctx.fillRect(gx(z[0]), y0, gx(z[1]) - gx(z[0]), 16);
        note(ctx, z[3], (gx(z[0]) + gx(z[1])) / 2, y0 + 32, { a: "center", s: 10.5, c: LT.ink });
      });
      ["0.05", "0.5"].forEach(function (s0) { note(ctx, s0, gx(+s0), y0 - 4, { a: "center", s: 10, c: LT.mute }); });
      var mxp = gx(Math.max(0.01, h / L));
      K.planet(ctx, mxp, y0 + 8, 6.5, kd === "mid" ? "#adb5bd" : "#38d9a9", "#12203a");
      K.tip(ctx, brk ? "⚠ 파고가 수심의 0.8배 → 쇄파" : (kd === "deep" ? "원 궤도 · 파속 √(gL/2π)" : (kd === "shallow" ? "납작한 타원 궤도 · 파속 √(gh)" : "더 깊게, 또는 더 얕게 해 보세요")), px - 4, 270, W - px - 14, brk ? false : (kd !== "mid"));
      note(ctx, "느려진 만큼 파장이 짧아지고", px, 336, { s: 11 });
      note(ctx, "에너지가 몰려 파고가 커집니다", px, 356, { s: 11 });
      note(ctx, "심해파: h/L > 0.5", px, 392, { s: 11, c: LT.ink });
      note(ctx, "천해파: h/L < 0.05", px, 412, { s: 11, c: LT.ink });
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
    /* ── 바다 블록: 수심(제곱근 눈금)에 따라 물이 두꺼워지고, 해일 마루가 +x 쪽으로 지나간다 ── */
    var LW = 600, RX = 612, ZB = 30;
    var I = K.iso({ ox: 146, oy: 206, s: 0.6, L: 620, D: 140 });
    function dz() { return 20 + Math.sqrt(h) * 1.8; }
    function paint() {
      ctx.clearRect(0, 0, W, H);
      var s = sp(), kmh = s * 3.6, L = I.L, D = I.D, top = ZB + dz();
      var span = L + 120, hx = ((150 + spT * kmh * .32) % span) - 60;
      function surf(x) { var t = (x - hx) / 70; return top + 11 * Math.exp(-t * t); }
      var fc = I.P(L, D, 0);
      studioOpen(ctx, LW, H, { x: fc.x - 120, y: fc.y - 36, rx: 320, ry: 54 });
      seaTop(ctx, I, function () { return ZB; }, function (x) { return surf(x); }, 90, 4, null, function (x, y, dep, lt) { var hh = surf(x) - top; if (hh <= 1) return seaCol(70 + dz() * .4, lt); var f = clamp(hh / 9, 0, 1) * .8; return "rgb(" + Math.round(clamp((74 + 181 * f) * lt, 0, 255)) + "," + Math.round(clamp((163 - 56 * f) * lt, 0, 255)) + "," + Math.round(clamp((224 - 117 * f) * lt, 0, 255)) + ")"; });
      seaFaces(ctx, I, function () { return ZB; }, function (x) { return surf(x); }, { zt: top + 6, bedTop: ZB });
      /* 거의 흔들리지 않는 배 */
      var bxp = 420, bz = surf(bxp);
      boat(ctx, I, bxp, D * .45, bz, "#1c7ed6");
      if (hx > 0 && hx < L - 20) isoArrow(ctx, I, hx + 20, D * .2, hx + 80, D * .2, top + 24, "#e03131", 3, 11, "#ff8787");
      ctx.restore();
      var bx = [0, LW];
      I.label(ctx, 520, D, ZB, "해저 · 수심 " + h.toLocaleString() + " m", 20, 40, "#f4e6c4", bx);
      I.label(ctx, bxp, D * .45, bz + 10, "배 위에서는 거의 못 느낀다", 10, -54, "#ffffff", bx);
      if (hx > 20 && hx < L - 40) { var hp = I.P(hx, 0, top + 11); K.pill(ctx, "지진 해일 마루", hp.x + 6, hp.y - 12, { a: "center", s: 11, c: "#ffc9c9", box: bx }); }
      K.bigText(ctx, "시속 " + kmh.toFixed(0) + " km", 18, 50, 30, kmh >= 700 ? "#ffc9c9" : (kmh <= 100 ? "#8ce99a" : "#ffffff"));
      K.bigText(ctx, "수심 " + h.toLocaleString() + " m · v = √(gh)", 18, 84, 18, "#ffd35a");
      K.warn(ctx, 14, H - 14, "⚠ 수심은 제곱근 눈금 · 실제 파장은 100 km 이상");

      /* ── 판정 카드: 탈것과 견주기 ── */
      var head = kmh >= 700 ? "여객기만큼 빠르다" : (kmh <= 100 ? "자동차만큼 느리다" : "시속 " + kmh.toFixed(0) + " km");
      judgeCard(ctx, RX, W, H, head, kmh >= 700 || kmh <= 100 ? LT.green : LT.ink, "천해파 · 속도는 수심만이 정함");
      var px = RX + 18, px1 = W - 18, bw = px1 - px;
      K.row(ctx, "속도 √(9.8 × " + h.toLocaleString() + ")", s.toFixed(1) + " m/s", px, px1, 102, LT.red);
      K.row(ctx, "시속", kmh.toFixed(0) + " km", px, px1, 128, LT.red);
      [["🚗 자동차", 100, LT.mute], ["🚄 고속열차", 300, LT.mute], ["✈️ 여객기", 900, LT.mute], ["🌊 지진 해일", kmh, LT.red]].forEach(function (q, i) {
        var y = 166 + i * 40;
        note(ctx, q[0], px, y, { s: 11.5, c: i === 3 ? LT.red : LT.ink, w: "800" });
        note(ctx, Math.round(q[1]) + " km/h", px1, y, { a: "right", s: 11, c: i === 3 ? LT.red : LT.mute, w: "800" });
        K.bar(ctx, px, y + 8, bw, q[1] / 1000, i === 3 ? LT.red : "#a5b4c8");
      });
      K.tip(ctx, kmh >= 700 ? "✓ 깊은 바다에서는 여객기 속도" : (kmh <= 100 ? "✓ 얕은 해안에서는 자동차 속도" : "수심을 더 깊게, 또는 더 얕게"), px - 4, 330, W - px - 14, kmh >= 700 || kmh <= 100 ? true : null);
      note(ctx, "파장이 100 km 넘는 해일에게는", px, 390, { s: 11 });
      note(ctx, "4,000 m 바다도 '얕은 바다'입니다", px, 410, { s: 11, c: LT.ink });
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

    /* ── 계단처럼 얕아지는 바다 블록: 진원(왼쪽) → A 5,000 m → B 1,000 m → C 100 m → 해안 마을 ── */
    var LW = 600, RX = 612, ZB = 18, ZS = 176, XL = 620;
    var I = K.iso({ ox: 150, oy: 204, s: 0.54, L: 680, D: 130 });
    function xOfKm2(km) { return km / TOTKM * XL; }
    function thick(dep) { return 18 + Math.sqrt(dep) * 1.72; }
    function bedAt(x) {
      if (x > XL) return ZS + 10 + Math.min(14, (x - XL) * .25);
      var km = x / XL * TOTKM, t = thick(depAt(km)), xa = xOfKm2(150), xb = xOfKm2(200), w = 10;
      if (Math.abs(x - xa) < w) t = thick(5000) + (thick(1000) - thick(5000)) * (x - xa + w) / (2 * w);
      else if (Math.abs(x - xb) < w) t = thick(1000) + (thick(100) - thick(1000)) * (x - xb + w) / (2 * w);
      return ZS - t;
    }
    var layer = cacheLayer(canvas, W, H);
    function model(c) {
      var L = I.L, D = I.D, fc = I.P(L, D, 0);
      K.studio(c, 0, 0, LW, H, { x: fc.x - 130, y: fc.y - 36, rx: 330, ry: 54 });
      c.save(); c.beginPath(); c.roundRect(0, 0, LW, H, 14); c.clip();
      seaTop(c, I, function (x) { return bedAt(x); }, function () { return ZS; }, 85, 4, function (x, y, z, lt) { return K.tint(x > XL + 14 ? "#7fae5a" : "#e3c48e", lt); });
      seaFaces(c, I, function (x) { return bedAt(x); }, function () { return ZS; }, { zt: ZS, bedTop: 90 });
      [[XL + 22, 24], [XL + 40, 60], [XL + 24, 96], [XL + 44, 112]].forEach(function (q, i) { I.house(c, q[0], q[1], bedAt(q[0]), 12, 12, 10, ["#c0553f", "#3f6fb5", "#d08a2e", "#c0553f"][i]); });
      I.tree(c, XL + 52, 30, bedAt(XL + 52), .8); I.tree(c, XL + 14, 70, bedAt(XL + 14), .7);
      c.restore();
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      var L = I.L, D = I.D, sec = tot * frac, km = kmAt(sec), wx = xOfKm2(km), x;
      layer(ctx, "base", model);
      ctx.save(); ctx.beginPath(); ctx.roundRect(0, 0, LW, H, 14); ctx.clip();
      /* 진원 */
      var ep0 = I.P(16, D, bedAt(16) + 2); K.glow(ctx, ep0.x, ep0.y, 5, "rgba(255,90,90,.98)", 4);
      /* 해일 마루: 얕아질수록 높아진다 */
      if (frac > 0) {
        var amp = 7 * Math.pow(5000 / depAt(km), 0.25);
        ctx.save(); ctx.shadowColor = "#ff6b6b"; ctx.shadowBlur = 10;
        for (var row = 0; row < 2; row++) {
          var yy = row ? D : 0;
          ctx.strokeStyle = row ? "#ff8787" : "rgba(255,135,135,.65)"; ctx.lineWidth = row ? 3 : 2; ctx.beginPath();
          var xa0 = Math.max(0, wx - 110), xa1 = Math.min(XL, wx + 110);
          for (x = xa0; x <= xa1; x += 4) { var t = (x - wx) / 40, p = I.P(x, yy, ZS + amp * Math.exp(-t * t)); if (x > xa0) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); }
          ctx.stroke();
        }
        ctx.restore();
        var a0 = I.P(wx, 0, ZS + amp), a1 = I.P(wx, D, ZS + amp);
        ctx.strokeStyle = "rgba(255,120,120,.9)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(a0.x, a0.y); ctx.lineTo(a1.x, a1.y); ctx.stroke();
        K.glow(ctx, a1.x, a1.y, 3.5, "rgba(255,150,160,.98)", 3.4);
      }
      ctx.restore();
      var bx = [0, LW];
      I.label(ctx, 16, D, bedAt(16) + 2, "진원", -20, 30, "#ffc9c9", bx);
      I.label(ctx, xOfKm2(75), D, bedAt(xOfKm2(75)), "A 심해 5,000 m · 150 km", -10, 56, "#e8ecff", bx);
      I.label(ctx, xOfKm2(175), D, bedAt(xOfKm2(175)), "B 1,000 m · 50 km", 10, 70, "#e8ecff", bx);
      I.label(ctx, xOfKm2(206), D, bedAt(xOfKm2(206)), "C 100 m · 12 km", 30, 44, "#e8ecff", bx);
      I.label(ctx, XL + 40, 60, bedAt(XL + 40) + 12, "해안 마을", 20, -30, "#ffffff", bx);
      var mm = Math.floor(sec / 60), ss = Math.round(sec % 60);
      if (frac > 0) {
        K.bigText(ctx, "지진 후 " + mm + "분 " + (ss < 10 ? "0" + ss : ss) + "초", 18, 50, 28, frac >= 1 ? "#ffc9c9" : "#ffffff");
        K.bigText(ctx, km.toFixed(0) + " km 이동 · 지금 수심 " + depAt(km).toLocaleString() + " m", 18, 82, 18, "#ffd35a");
      } else {
        K.bigText(ctx, "해안까지 몇 분?", 18, 50, 28, "#ffffff");
        K.bigText(ctx, "내 계산 " + guess + "분 · 해일을 보내 확인", 18, 82, 18, "#ffd35a");
      }
      K.warn(ctx, LW - 14, H - 14, "⚠ 수심은 크게 과장해 그림", "right");

      /* ── 판정 카드 ── */
      var real = tot / 60, seen = frac >= 1, good = seen && Math.abs(guess - real) <= 2;
      judgeCard(ctx, RX, W, H, seen ? (good ? "계산이 맞았다 ✓" : "다시 계산") : "내 계산 " + guess + "분", seen ? (good ? LT.green : LT.orange) : LT.ink, "진원 → 해안 212 km");
      var px = RX + 18, px1 = W - 18, bw = px1 - px;
      K.row(ctx, "A 구간 (5,000 m)", "150 km", px, px1, 102);
      K.row(ctx, "B 구간 (1,000 m)", "50 km", px, px1, 128);
      K.row(ctx, "C 구간 (100 m)", "12 km", px, px1, 154);
      K.row(ctx, "내가 계산한 도달 시각", guess + " 분", px, px1, 190, LT.yellow);
      K.row(ctx, "해일이 걸린 시간", frac > 0 ? mm + "분 " + (ss < 10 ? "0" + ss : ss) + "초" : "–", px, px1, 216, LT.red);
      K.bar(ctx, px, 228, bw, frac, LT.red);
      K.tip(ctx, seen ? (good ? "✓ 실제 " + real.toFixed(1) + "분 · 오차 " + Math.abs(guess - real).toFixed(1) + "분" : "실제와 " + Math.abs(guess - real).toFixed(1) + "분 차이") : "구간마다 v = √(gh) 를 구하기", px - 4, 254, W - px - 14, seen ? good : null);
      note(ctx, "구간마다", px, 318, { s: 11 });
      note(ctx, "① v = √(gh) 로 속도", px, 340, { s: 11, c: LT.ink });
      note(ctx, "② 거리 ÷ 속도 = 걸린 시간", px, 360, { s: 11, c: LT.ink });
      note(ctx, "③ 세 구간을 모두 더하기", px, 380, { s: 11, c: LT.ink });
      note(ctx, "얕은 곳일수록 같은 거리도 오래 걸림", px, 414, { s: 10.5 });
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
    /* ── 해안 블록: 바다(왼쪽 위) → 방조제 → 시가지(오른쪽 아래). 1 m = 22 그림 단위 ── */
    var LW = 600, RX = 612, Z0 = 66, MZ = 22, XW = 330;
    var I = K.iso({ ox: 170, oy: 196, s: 0.62, L: 560, D: 190 });
    function bedS(x) { return x < XW ? 14 + (x / XW) * (Z0 - 30) : Z0 + 8; }
    function paint() {
      ctx.clearRect(0, 0, W, H);
      var tp = pEff(), tw = wEff(), tot = total(), L = I.L, D = I.D, k, i, ok = tot >= 3 && tot <= 3.5, over = tot > 3;
      var lvl = Z0 + clamp(tot, 0, 6.2) * MZ, wallTop = Z0 + 3 * MZ;
      function surf(x, y) { return x < XW ? lvl + 2.2 * Math.sin(x / 13 + y / 21 - suT * 2.6) * (x / XW) : -1; }
      var fc = I.P(L, D, 0);
      studioOpen(ctx, LW, H, { x: fc.x - 100, y: fc.y - 36, rx: 310, ry: 56 });
      seaTop(ctx, I, function (x) { return bedS(x); }, surf, 64, 10, function (x, y, z, lt) { return K.tint(x < XW ? "#d9c08a" : "#9aa3ad", lt); });
      seaFaces(ctx, I, function (x) { return bedS(x); }, surf, { zt: lvl, bedTop: Z0, face: function (side, Lw) {
        if (side !== "front") return;
        /* 앞면에 쌓이는 몫: 조위 → 기압 → 바람 */
        var u0 = 40, acc = 0;
        [[tide, "rgba(77,171,247,.95)"], [tp, "rgba(151,117,250,.95)"], [tw, "rgba(250,176,5,.95)"]].forEach(function (q) {
          var z0 = Z0 + acc * MZ, z1 = Z0 + (acc + q[0]) * MZ; acc += q[0];
          if (z1 - z0 > .3) { ctx.fillStyle = q[1]; ctx.fillRect(u0, z0, 18, z1 - z0); ctx.strokeStyle = "rgba(255,255,255,.8)"; ctx.lineWidth = .8; ctx.strokeRect(u0, z0, 18, z1 - z0); }
        });
        ctx.save(); ctx.setLineDash([6, 4]); ctx.strokeStyle = "rgba(255,255,255,.9)"; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(0, Z0); ctx.lineTo(XW, Z0); ctx.stroke(); ctx.restore();
      } });
      /* 방조제(콘크리트) */
      I.box(ctx, XW, 0, 0, XW + 14, D, wallTop, "#d5dae2", "#aab3c0", "#8792a2");
      /* 넘친 물이 시가지를 덮는다 */
      var fl = over ? Math.min(46, (tot - 3) * 26) : 0;
      if (fl > 0) I.plane(ctx, Z0 + 8 + fl * .5, "rgba(60,150,220,.55)", "rgba(255,255,255,.6)", XW + 14, L, 0, D);
      /* 시가지 */
      var R = K.rng(17);
      [[380, 30], [420, 80], [470, 30], [510, 90], [395, 140], [455, 150], [520, 150]].forEach(function (q, j) {
        var hgt = 18 + R() * 40;
        I.box(ctx, q[0], q[1], Z0 + 8, q[0] + 22, q[1] + 22, Z0 + 8 + hgt, "#eef1f5", j % 2 ? "#c9d1dc" : "#d8dee6", "#9aa6b6");
        for (var wy = Z0 + 14; wy < Z0 + 4 + hgt; wy += 8) { var wp = I.P(q[0] + 6, q[1] + 22, wy), wq = I.P(q[0] + 16, q[1] + 22, wy); ctx.strokeStyle = "rgba(60,90,140,.45)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(wp.x, wp.y); ctx.lineTo(wq.x, wq.y); ctx.stroke(); }
      });
      if (fl > 0) I.plane(ctx, Z0 + 8 + fl, "rgba(60,150,220,.35)", null, XW + 14, L, 0, D);
      /* 바람 줄기와 태풍 */
      for (k = 0; k < 7; k++) {
        var wx = (k * 47 + suT * (20 + U * 4)) % (XW - 30), wy2 = 20 + (k * 53) % (D - 40), wz = lvl + 18 + (k % 3) * 10;
        ctx.save(); ctx.globalAlpha = U > 0 ? .45 + U / 120 : .15;
        K.arrow(ctx, I.P(wx, wy2, wz), I.P(wx + 24 + U * .8, wy2, wz), "#f08c00", Math.max(1.6, U / 12), 9); ctx.restore();
      }
      var tpP = { x: 420, y: 118 }, depth = (1013 - P) / 113;
      swirl(ctx, tpP.x, tpP.y, 46 + depth * 30, suT * (.3 + depth), .3 + depth * .7);
      ctx.restore();
      var bx = [0, LW];
      K.pill(ctx, "태풍 " + P + " hPa", tpP.x, tpP.y - 34 - depth * 14, { a: "center", s: 12, c: "#d0bfff", box: bx });
      I.label(ctx, XW + 7, D, wallTop, "방조제 3.0 m", 30, -30, "#ffffff", bx);
      I.label(ctx, 49, D, Z0 + tot * MZ, "해수면 " + tot.toFixed(2) + " m", -20, -40, over ? "#ffc9c9" : "#a5d8ff", bx);
      I.label(ctx, 160, D, Z0, "평균 해면", -30, 66, "#ffffff", bx);
      if (over) I.label(ctx, 470, D - 10, Z0 + 8 + fl, "시가지 침수", 24, 30, "#ffc9c9", bx);
      K.bigText(ctx, "해수면 " + tot.toFixed(2) + " m", 18, 50, 28, over ? (ok ? "#8ce99a" : "#ffc9c9") : "#ffffff");
      K.bigText(ctx, over ? (ok ? "방조제를 갓 넘었다" : "너무 높다 — 3.0~3.5 m") : "방조제 3.0 m 아래", 18, 82, 18, "#ffd35a");
      K.warn(ctx, LW - 14, H - 14, "⚠ 높이는 보기 쉽게 과장", "right");

      /* ── 판정 카드: 쌓아 올린 몫 ── */
      judgeCard(ctx, RX, W, H, ok ? "갓 넘김 ✓" : (over ? "너무 높다" : "넘지 못함"), ok ? LT.green : (over ? LT.orange : LT.ink), "기압 + 바람 + 조위");
      var px = RX + 18, px1 = W - 18, bw = px1 - px;
      K.row(ctx, "기압 효과 (1 hPa ↓ → 1 cm ↑)", "+" + tp.toFixed(2) + " m", px, px1, 102, LT.violet);
      K.row(ctx, "바람 효과 (" + U + " m/s)", "+" + tw.toFixed(2) + " m", px, px1, 128, LT.yellow);
      K.row(ctx, "천문 조위", "+" + tide.toFixed(1) + " m", px, px1, 154, LT.blue);
      K.row(ctx, "해수면 합계", tot.toFixed(2) + " m", px, px1, 184, over ? LT.red : LT.ink);
      var y0 = 198, sc = bw / 6, acc = 0;
      ctx.fillStyle = "#e3e9f1"; ctx.beginPath(); ctx.roundRect(px, y0, bw, 16, 8); ctx.fill();
      [[tide, LT.blue], [tp, LT.violet], [tw, LT.yellow]].forEach(function (q) { var w0 = Math.min(bw - acc * sc, q[0] * sc); if (w0 > 0) { ctx.fillStyle = q[1]; ctx.fillRect(px + acc * sc, y0, w0, 16); } acc += q[0]; });
      K.line(ctx, { x: px + 3 * sc, y: y0 - 6 }, { x: px + 3 * sc, y: y0 + 22 }, LT.ink, 2);
      ctx.fillStyle = "rgba(15,159,118,.25)"; ctx.fillRect(px + 3 * sc, y0, .5 * sc, 16);
      note(ctx, "방조제 3.0", px + 3 * sc, y0 + 36, { a: "center", s: 10.5, c: LT.ink });
      note(ctx, "0", px, y0 + 36, { s: 10 }); note(ctx, "6 m", px1, y0 + 36, { a: "right", s: 10 });
      K.tip(ctx, ok ? "✓ 3.0~3.5 m — 갓 넘깁니다" : (over ? "조건을 조금 낮춰 3.0~3.5 m로" : "아직 방조제 아래입니다"), px - 4, 250, W - px - 14, ok ? true : (over ? false : null));
      note(ctx, "기압만으로는 아무리 낮춰도", px, 314, { s: 11 });
      note(ctx, "1.13 m가 한계입니다", px, 334, { s: 11, c: LT.ink });
      note(ctx, "앞면 막대 = 쌓아 올린 몫", px, 370, { s: 11 });
      note(ctx, "파랑 조위 · 보라 기압 · 노랑 바람", px, 390, { s: 10.5 });
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

    /* 지구 둘레 바닷물(반투명 타원체) — rx 는 늘어난 쪽 반지름 */
    function bulge(c, x, y, rx, ry, rot, col, dash) {
      c.save(); c.translate(x, y); c.rotate(rot || 0);
      if (dash) { c.setLineDash([5, 4]); c.strokeStyle = col; c.lineWidth = 1.6; c.beginPath(); c.ellipse(0, 0, rx, ry, 0, 0, 6.2832); c.stroke(); c.restore(); return; }
      var g = c.createRadialGradient(-rx * .3, -ry * .45, 2, 0, 0, rx);
      g.addColorStop(0, "rgba(220,245,255,.75)"); g.addColorStop(.55, "rgba(90,180,240,.45)"); g.addColorStop(1, "rgba(30,110,200,.18)");
      c.fillStyle = g; c.beginPath(); c.ellipse(0, 0, rx, ry, 0, 0, 6.2832); c.fill();
      c.strokeStyle = col || "rgba(160,220,255,.9)"; c.lineWidth = 1.6; c.stroke(); c.restore();
    }
    function draw() {
      var q = ratio(), LW = 600, RX = 612;
      ctx.clearRect(0, 0, W, H);
      /* ── 왼쪽: 밝은 스튜디오 위 아크릴 큐브 속 우주(달·지구·태양 입체 공) ── */
      var CB = { x: 22, y: 118, w: 540, h: 214, d: 30, seed: 61 };
      K.studio(ctx, 0, 0, LW, H, cubeFloor(CB));
      var cb = spaceCube(ctx, CB), BX = [CB.x, CB.x + CB.w];
      var ey = CB.y + CB.h / 2 + 4, ex = 250, sx = 392 + (r - 50) / 550 * 138;
      var bm = 16, bs = 16 * Math.min(q, 3);
      cb.inside(function () {
        /* 태양 빛 */
        var sl = ctx.createRadialGradient(sx, ey, 10, sx, ey, 420); sl.addColorStop(0, "rgba(255,211,107,.2)"); sl.addColorStop(1, "rgba(255,211,107,0)");
        ctx.fillStyle = sl; ctx.fillRect(CB.x, CB.y - 40, CB.w + 40, CB.h + 40);
        /* 달(태양 쪽이 밝은 입체 공) */
        K.line(ctx, { x: 92, y: ey }, { x: ex - 60, y: ey }, "rgba(200,210,255,.35)", 1.2, [3, 4]);
        moon3d(ctx, 92, ey, 18, 0);
        /* 지구와 부푼 바닷물(반투명 타원체): 달의 몫 + 태양의 몫(점선) */
        tideShell(ctx, ex, ey, 52 + bm + bs, 50, 0, 0);
        globe3d(ctx, ex, ey, 46, 0);
        bulge(ctx, ex, ey, 52 + bs, 50, 0, "rgba(255,211,107,.9)", true);
        /* 태양 */
        K.line(ctx, { x: ex + 70, y: ey }, { x: sx - 24, y: ey }, "rgba(255,211,107,.35)", 1.2, [3, 4]);
        sun3d(ctx, sx, ey, 20);
      });
      cb.glass();
      K.pill(ctx, "달 · 거리 1배", 92, ey + 46, { a: "center", s: 12, c: KC.ink, box: BX });
      K.pill(ctx, "지구 · 부푼 바닷물", ex, ey + 80, { a: "center", s: 12, c: KC.blue, box: BX });
      K.pill(ctx, "태양 · 거리 " + r + "배", Math.min(sx, 500), ey + 62, { a: "center", s: 12, c: KC.yellow, box: BX });
      K.pill(ctx, "질량 2,700만 배", Math.min(sx, 500), ey - 50, { a: "center", s: 12, c: KC.yellow, box: BX });
      K.pill(ctx, "노란 점선 = 태양이 만든 몫", 16, H - 12, { s: 12, c: KC.yellow });
      K.warn(ctx, LW - 14, H - 12, "⚠ 크기·거리·부풂은 과장", "right");
      K.bigText(ctx, "태양 = 달의 " + (q >= 100 ? q.toFixed(0) : q.toFixed(2)) + "배", 18, 50, 28, Math.abs(q - 1) <= .05 ? "#8ce99a" : (q <= .5 ? "#8ce99a" : "#ffffff"));
      K.bigText(ctx, "기조력 ∝ 질량 ÷ 거리³", 18, 82, 18, "#ffd35a");
      /* ── 판정 카드 ── */
      var good = Math.abs(q - 1) <= .05 || q <= .5;
      judgeCard(ctx, RX, W, H, Math.abs(q - 1) <= .05 ? "딱 같아졌다 ✓" : (q <= .5 ? "달이 이긴다 ✓" : (q > 1 ? "태양이 더 세다" : "아직 비슷하다")), good ? LT.green : LT.ink, "달의 기조력 = 1");
      var px = RX + 18, px1 = W - 18, bw = px1 - px;
      K.row(ctx, "질량 (태양 ÷ 달)", "2,700만 배", px, px1, 100);
      K.row(ctx, "거리 (태양 ÷ 달)", r + " 배", px, px1, 124, LT.orange);
      K.row(ctx, "거리³", (r * r * r).toLocaleString(), px, px1, 148);
      note(ctx, "달의 기조력", px, 180, { s: 11.5, c: LT.ink, w: "800" });
      K.bar(ctx, px, 188, bw, 1 / 3.4, "#868e96");
      note(ctx, "1.00", px1, 180, { a: "right", s: 11.5, c: LT.ink, w: "900" });
      note(ctx, "태양의 기조력", px, 220, { s: 11.5, c: LT.ink, w: "800" });
      K.bar(ctx, px, 228, bw, q / 3.4, LT.yellow);
      note(ctx, (q >= 100 ? q.toFixed(0) : q.toFixed(2)), px1, 220, { a: "right", s: 11.5, c: LT.orange, w: "900" });
      K.line(ctx, { x: px + bw / 3.4, y: 184 }, { x: px + bw / 3.4, y: 244 }, "rgba(20,40,90,.5)", 1.2, [3, 3]);
      K.tip(ctx, Math.abs(q - 1) <= .05 ? "✓ 약 300배에서 같아짐" : (q <= .5 ? "✓ 태양이 달의 절반 이하" : "태양을 더 멀리 보내 보세요"), px - 4, 258, W - px - 14, good ? true : null);
      note(ctx, "실제: 거리 약 390배", px, 318, { s: 11, c: LT.ink });
      note(ctx, "→ 태양은 달의 약 0.46배", px, 338, { s: 11, c: LT.ink });
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
      var R = range(), rad = a * Math.PI / 180, LW = 520;
      ctx.clearRect(0, 0, W, H);
      /* ── 왼쪽: 밝은 스튜디오 위 아크릴 큐브 속 우주 — 비스듬히 내려다본 태양·지구·달(입체 공) ── */
      var CB = { x: 16, y: 130, w: 470, h: 232, d: 30, seed: 63 }, BX = [CB.x, CB.x + CB.w];
      var cx = 214, cy = CB.y + CB.h / 2 + 4, orb = 150, TL = .4, SX = CB.x + CB.w - 26;
      K.studio(ctx, 0, 0, LW, H, cubeFloor(CB));
      var cb = spaceCube(ctx, CB);
      var mx = cx + orb * Math.cos(rad), my = cy - orb * TL * Math.sin(rad), back = Math.sin(rad) > 0;
      var ang = Math.atan2(-orb * TL * Math.sin(rad), orb * Math.cos(rad));
      var ex = 40 + R * 3.6;
      cb.inside(function () {
        var sl = ctx.createRadialGradient(SX, cy, 10, SX, cy, 420); sl.addColorStop(0, "rgba(255,211,107,.18)"); sl.addColorStop(1, "rgba(255,211,107,0)");
        ctx.fillStyle = sl; ctx.fillRect(CB.x, CB.y - 40, CB.w + 40, CB.h + 40);
        sun3d(ctx, SX, cy, 18);
        /* 달 궤도(기울여 본 원) */
        ctx.strokeStyle = "rgba(200,210,255,.4)"; ctx.lineWidth = 1.3; ctx.setLineDash([4, 5]);
        ctx.beginPath(); ctx.ellipse(cx, cy, orb, orb * TL, 0, 0, 6.2832); ctx.stroke(); ctx.setLineDash([]);
        function moon() { moon3d(ctx, mx, my, back ? 13 : 16, 0); }
        if (back) moon();
        /* 부푼 바닷물: 태양 몫(가로 점선) + 합쳐진 부풂(달 쪽으로) — 반투명 초록 타원체 */
        tideShell(ctx, cx, cy, ex, 36, ang, 0, true);
        ctx.save(); ctx.setLineDash([5, 4]); ctx.strokeStyle = "rgba(255,211,107,.85)"; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.ellipse(cx, cy, 48, 34, 0, 0, 6.2832); ctx.stroke(); ctx.restore();
        globe3d(ctx, cx, cy, 30, 0);
        if (!back) moon();
      });
      cb.glass();
      var ph = phase();
      K.pill(ctx, "달", mx, my - (back ? 22 : 26), { a: "center", s: 12, c: KC.ink, box: BX });
      K.pill(ctx, "태양 쪽 → 빛", CB.x + CB.w - 8, cy + 58, { a: "right", s: 12, c: KC.yellow, box: BX });
      K.pill(ctx, "초록 = 부푼 바닷물 · 노란 점선 = 태양의 몫", 14, H - 12, { s: 12, c: KC.ink });
      K.warn(ctx, LW - 14, H - 12, "⚠ 크기·거리·부풂은 과장", "right");
      var big = R >= 7.9 ? "사리" : (R <= 3.6 ? "조금" : "중간 물때");
      K.bigText(ctx, big, 18, 54, 32, R >= 7.9 ? "#ffc9c9" : (R <= 3.6 ? "#8ce99a" : "#ffffff"));
      K.bigText(ctx, ph + " · " + a + "°", 18, 88, 17, "#ffd35a");
      /* ── 오른쪽: 흰 카드 안 작은 조위 그래프 + 판정 ── */
      var RX = LW + 10, good = R >= 7.9 || R <= 3.6;
      judgeCard(ctx, RX, W, H, "조차 " + R.toFixed(2) + " m", R >= 7.9 ? LT.red : (R <= 3.6 ? LT.green : LT.ink), "인천 관측소 · 하루 조위");
      var gph = K.chart(ctx, { x: RX + 6, y: 84, w: W - RX - 18, h: 226, x0: 0, x1: 24, y0: -5, y1: 5, xt: 4, yt: 5, xl: "시각", yl: "조위(m)", light: true, xf: function (v0) { return v0 + "시"; } });
      var pts = [];
      for (var t = 0; t <= 24.01; t += 0.2) pts.push([t, R / 2 * Math.cos(2 * Math.PI * (t - HIGH) / PERIOD)]);
      K.line(ctx, { x: gph.L, y: gph.Y(0) }, { x: gph.R, y: gph.Y(0) }, "rgba(20,40,90,.3)", 1, [3, 3]);
      ctx.fillStyle = "rgba(28,126,214,.10)"; ctx.fillRect(gph.L, gph.Y(R / 2), gph.R - gph.L, gph.Y(-R / 2) - gph.Y(R / 2));
      K.plot(ctx, gph, pts, LT.blue, { light: true, w: 2.8 });
      var bxx = gph.X(HIGH + PERIOD / 2) + 22;
      ctx.strokeStyle = LT.orange; ctx.lineWidth = 2.2; ctx.beginPath();
      ctx.moveTo(bxx - 6, gph.Y(R / 2)); ctx.lineTo(bxx, gph.Y(R / 2)); ctx.lineTo(bxx, gph.Y(-R / 2)); ctx.lineTo(bxx - 6, gph.Y(-R / 2)); ctx.stroke();
      K.t(ctx, "조차", bxx + 6, gph.Y(0) + 4, { s: 11.5, w: "900", c: LT.orange });
      [HIGH, HIGH + PERIOD].forEach(function (th) { ctx.fillStyle = LT.blue; ctx.beginPath(); ctx.arc(gph.X(th), gph.Y(R / 2), 4, 0, 6.2832); ctx.fill(); });
      K.tip(ctx, R >= 7.9 ? "✓ 사리 — 삭·망, 힘이 한 줄로 더해짐" : (R <= 3.6 ? "✓ 조금 — 상현·하현, 직각으로 깎임" : "달을 더 돌려 사리·조금 찾기"), RX + 12, 330, W - RX - 24, good ? true : null);
      note(ctx, "만조·간조 하루 두 번씩", RX + 18, 388, { s: 12 });
      note(ctx, "(주기 12시간 25분)", RX + 18, 408, { s: 12 });
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

  /* 장면 4 — 지역별 조석 양상과 바닷길 시각 (아이소메트릭 블록 모형 + 조위 곡선) */
  (function () {
    var canvas = $("d-road"); if (!canvas) return;
    var ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var place = "mo", tm = 0, FLOOR = -1.7, ph = 0, playing = false;
    var ST = { "in": { n: "인천", R: 8.1 }, "mo": { n: "목포", R: 4.0 }, "mu": { n: "묵호", R: 0.3 } };
    function level(t) { return ST[place].R / 2 * Math.cos(2 * Math.PI * (t - HIGH) / PERIOD); }
    function hm(t) { var h = Math.floor(t + 1e-6), m = Math.round((t - h) * 60); if (m === 60) { h++; m = 0; } return h + "시 " + (m < 10 ? "0" : "") + m + "분"; }

    /* ── 모형: x = 회동리(왼쪽 위) → 모도(오른쪽 아래), y = 깊이 방향, 바닷길 등성이는 앞면(y = D)을 따라 놓인다 ── */
    var DH = 425;                                       /* 모형 칸 높이(아래는 조위 곡선) */
    var I = K.iso({ ox: 352, oy: 172, s: 0.62, L: 600, D: 200 });
    var L = I.L, D = I.D, ZM = 10;                      /* 1 m = 10 그림 단위(높이 과장) */
    function zm(m) { return (m + 9) * ZM; }             /* 해저 −9 m 가 블록 바닥(z = 0) */
    var XM = 330;                                       /* 등성이에서 가장 낮은 곳 */
    function crest(x) {                                 /* 등성이 마루 높이(m): 가운데가 가장 낮은 −1.7 m */
      var a = (x - XM) / 230;
      return -1.7 + 1.25 * a * a;
    }
    function island(x, y) {
      var h1 = 6.5 - Math.pow((x - 0) / 95, 2) * 6 - Math.pow((y - 95) / 150, 2) * 4;          /* 회동리 */
      var h2 = 5.2 - Math.pow((x - L) / 75, 2) * 6 - Math.pow((y - 120) / 105, 2) * 5;        /* 모도 */
      return Math.max(h1, h2);
    }
    function seabed(x, y) {                            /* 해저 높이(m) */
      var base = -6.2 + 0.8 * Math.sin(x / 70) * Math.cos(y / 50);
      var w = 58, t = (D - y) / w, bar = t < 1 ? crest(x) - (crest(x) + 6.2) * t * t : -99;
      return Math.max(base, bar, island(x, y));
    }
    function zOf(x, y) { return zm(seabed(x, y)); }
    function landCol(x, y, z, light) {
      var m = z / ZM - 9, c;
      if (m > 1.5) c = m > 4.2 ? "#5d8f43" : "#6e9e4c";            /* 풀밭 */
      else if (m > 0.2) c = "#cdb27a";                              /* 바닷가 */
      else if (m > -2.4) c = "#d9c08a";                             /* 모래 등성이 */
      else c = "#8e7b63";                                           /* 진흙 해저 */
      return K.tint(c, light);
    }
    function faceZ(side) { return function (u) { return side === "front" ? zOf(u, D) : zOf(L, u); }; }

    function drawModel(lv, open) {
      var wz = zm(lv);
      K.studio(ctx, 0, 0, W, DH, { x: I.P(L, D, 0).x - 140, y: I.P(L, D, 0).y - 30, rx: 330, ry: 58 });
      ctx.save(); ctx.beginPath(); ctx.roundRect(0, 0, W, DH, 14); ctx.clip();
      /* 지형 + 칸마다 물 덮기 */
      I.field(ctx, zOf, landCol, 60, 20, function (c, x0, y0, x1, y1, zMax, zMin) {
        if (wz > zMin + 0.2) {
          var a = I.P(x0, y0, wz), b = I.P(x1, y0, wz), cc = I.P(x1, y1, wz), d = I.P(x0, y1, wz);
          var depth = wz - zMin, al = Math.min(.78, .32 + depth / 90);
          c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.lineTo(cc.x, cc.y); c.lineTo(d.x, d.y); c.closePath();
          c.fillStyle = "rgba(" + Math.round(70 - depth * .4) + "," + Math.round(160 - depth * .5) + ",225," + al.toFixed(2) + ")"; c.fill();
        }
      });
      /* 앞면·오른쪽 면: 해저 단면 */
      ["front", "right"].forEach(function (side) {
        var zf = faceZ(side);
        I.face(ctx, side, function (Lw) {
          I.profile(ctx, side, zf, 0);
          var g = ctx.createLinearGradient(0, 0, 0, 160); g.addColorStop(0, "#6f5a43"); g.addColorStop(.55, "#a88a62"); g.addColorStop(1, "#d8bf8c");
          ctx.fillStyle = g; ctx.fill();
          ctx.save(); I.profile(ctx, side, zf, 0); ctx.clip();
          var R = K.rng(side === "front" ? 31 : 37);
          for (var i = 0; i < Lw * 1.6; i++) { ctx.fillStyle = R() > .5 ? "rgba(255,255,255,.18)" : "rgba(50,35,20,.25)"; ctx.fillRect(R() * Lw, R() * 160, 1.6, 1.6); }
          ctx.strokeStyle = "rgba(60,40,20,.25)"; ctx.lineWidth = 1;
          for (var y2 = 18; y2 < 160; y2 += 16) { ctx.beginPath(); ctx.moveTo(0, y2); ctx.lineTo(Lw, y2 + 3); ctx.stroke(); }
          ctx.restore();
        });
      });
      I.water(ctx, wz, function (u, side) { return faceZ(side)(u); }, { surface: false });
      I.shade(ctx, "front", function (u) { return Math.max(zOf(u, D), wz); });
      I.shade(ctx, "right", function (u) { return Math.max(zOf(L, u), wz); });
      /* 앞면 눈금: 평균 해면과 등성이 −1.7 m */
      I.face(ctx, "front", function (Lw) {
        ctx.save(); ctx.setLineDash([6, 5]); ctx.lineWidth = 1.6;
        ctx.strokeStyle = "rgba(255,255,255,.85)"; ctx.beginPath(); ctx.moveTo(0, zm(0)); ctx.lineTo(Lw, zm(0)); ctx.stroke();
        ctx.strokeStyle = "#ff4d6d"; ctx.beginPath(); ctx.moveTo(0, zm(FLOOR)); ctx.lineTo(Lw, zm(FLOOR)); ctx.stroke();
        ctx.restore();
      });
      I.edges(ctx, zOf(L, D), zOf(L, D));
      /* 회동리 마을 · 모도 */
      [[18, 40], [44, 70], [14, 110], [52, 128]].forEach(function (h, i) { I.house(ctx, h[0], h[1], zOf(h[0] + 8, h[1] + 8), 16, 14, 12, ["#c0553f", "#3f6fb5", "#c0553f", "#d08a2e"][i]); });
      [[70, 30], [30, 160], [80, 150], [560, 70], [585, 110], [548, 150], [575, 160]].forEach(function (t, i) { I.tree(ctx, t[0], t[1], zOf(t[0], t[1]), 0.8 + (i % 3) * .12); });
      /* 길이 열리면 사람들이 등성이를 따라 걷는다 */
      var walkers = 0;
      if (open) {
        for (var k = 0; k < 14; k++) {
          var px = ((k / 14 + ph * .02) % 1) * (L - 140) + 70, py = D - 14 - (k % 3) * 9;
          if (zm(seabed(px, py)) > wz + 1) { I.person(ctx, px, py, zOf(px, py), ["#ff6b81", "#ffd35a", "#4fb6ff", "#3fd3a3", "#b69cff", "#ff9a3c"][k % 6], .9); walkers++; }
        }
      }
      ctx.restore();
      /* 이름표 */
      var box = [0, W];
      I.label(ctx, 40, 60, zOf(40, 60) + 14, "회동리 (진도)", 70, -34, "#f4f0e6", box);
      I.label(ctx, L - 20, 120, zOf(L - 20, 120) + 6, "모도", 40, -24, "#f4f0e6", box);
      I.label(ctx, XM, D, zm(crest(XM)), "등성이에서 가장 낮은 곳 −1.7 m", 30, 52, "#ff9aac", box);
      if (!open) {
        var dep = lv - FLOOR;
        I.label(ctx, XM + 40, D - 20, wz, "등성이 위 물 깊이 " + dep.toFixed(2) + " m", 60, -40, "#bfe6ff", box);
      }
      var lp = I.P(150, D, zm(0)); K.pill(ctx, "평균 해면 0 m", lp.x + 6, lp.y - 6, { s: 11, c: "#ffffff", box: box });
      var lp2 = I.P(150, D, zm(FLOOR)); K.pill(ctx, "−1.7 m", lp2.x + 6, lp2.y + 18, { s: 11, c: "#ff9aac", box: box });
      /* 큰 글자 */
      if (ST[place].R / 2 < -FLOOR) { K.bigText(ctx, ST[place].n + "의 바다였다면", 22, 52, 27, "#ffffff"); K.bigText(ctx, "길은 끝내 열리지 않는다", 22, 88, 20, "#ffd35a"); }
      else if (open) { K.bigText(ctx, "바닷길이 열렸다", 22, 52, 30, "#ffd35a"); K.bigText(ctx, ST[place].n + " " + hm(tm) + " · 조위 " + lv.toFixed(2) + " m", 22, 88, 19, "#ffffff"); }
      else { K.bigText(ctx, "아직 바다 밑", 22, 52, 30, "#ffffff"); K.bigText(ctx, ST[place].n + " " + hm(tm) + " · 조위 " + lv.toFixed(2) + " m", 22, 88, 19, "#ffd35a"); }
      K.warn(ctx, W - 14, 30, "⚠ 높이는 보기 쉽게 과장 (1 m ≈ 실제보다 수백 배)", "right");
      return walkers;
    }
    function drawChart(lv, open) {
      var y0 = DH + 8, h = H - y0, t;
      /* 밝은 흰 카드 안의 조위 곡선 */
      K.card(ctx, 0, y0, W, h);
      K.t(ctx, ST[place].n + " 관측소 — 사리 때의 조위 곡선 (조차 " + ST[place].R.toFixed(1) + " m)", 18, y0 + 24, { s: 12.5, w: "800", c: LT.ink });
      var g = K.chart(ctx, { x: 4, y: y0 + 30, w: W - 220, h: h - 34, pb: 28, pt: 8, x0: 0, x1: 24, y0: -5, y1: 5, xt: 8, yt: 2, xl: "", yl: "", light: true, xf: function (v) { return v + "시"; } });
      var fy = g.Y(FLOOR);
      ctx.fillStyle = "rgba(15,159,118,.22)"; ctx.beginPath(); var on = false;
      for (t = 0; t <= 24.001; t += 0.05) {
        var lt = level(t), px = g.X(t);
        if (lt < FLOOR) { if (!on) { ctx.moveTo(px, fy); on = true; } ctx.lineTo(px, g.Y(lt)); }
        else if (on) { ctx.lineTo(px, fy); ctx.closePath(); on = false; }
      }
      if (on) { ctx.lineTo(g.X(24), fy); ctx.closePath(); }
      ctx.fill();
      K.line(ctx, { x: g.L, y: fy }, { x: g.R, y: fy }, LT.red, 2, [7, 5]);
      var pts = []; for (t = 0; t <= 24.001; t += 0.2) pts.push([t, level(t)]);
      K.plot(ctx, g, pts, LT.blue, { light: true, w: 2.6 });
      var mx = g.X(tm), my = g.Y(lv);
      K.line(ctx, { x: mx, y: g.T }, { x: mx, y: g.B }, LT.yellow, 2);
      ctx.fillStyle = "#fff"; ctx.strokeStyle = LT.orange; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(mx, my, 5.5, 0, 6.2832); ctx.fill(); ctx.stroke();
      /* 오른쪽 작은 판정 */
      var rx = W - 200;
      K.t(ctx, "바닷길 등성이 −1.7 m", rx, y0 + 52, { s: 12, w: "800", c: LT.red });
      K.t(ctx, "초록 = 바닥이 드러나는 시간", rx, y0 + 74, { s: 12, w: "700", c: LT.mute });
      K.t(ctx, open ? "지금: 길이 열림" : "지금: 잠겨 있음", rx, y0 + 112, { s: 15, w: "900", c: open ? LT.green : LT.ink });
      K.t(ctx, "조위 " + lv.toFixed(2) + " m", rx, y0 + 138, { s: 13, w: "800", c: LT.orange });
    }
    function draw() {
      var lv = level(tm), open = lv < FLOOR;
      ctx.clearRect(0, 0, W, H);
      drawModel(lv, open);
      drawChart(lv, open);
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
    function setT(t) { tm = t; $("d-road-t").value = tm; $("d-road-t-val").textContent = tm.toFixed(2) + "시"; draw(); }
    $("d-road-t").addEventListener("input", function (e) { playing = false; $("d-road-play").textContent = "▶ 하루 흘려 보기"; setT(+e.target.value); });
    $("d-road-play").addEventListener("click", function () {
      playing = !playing; this.textContent = playing ? "⏸ 멈추기" : "▶ 하루 흘려 보기";
      if (playing && tm >= 23.99) setT(0);
    });
    K.animate(canvas, function (dt) {
      if (playing) {
        var nt = Math.min(24, tm + dt / 1000 * 1.6);                 /* 1초에 1.6시간 */
        tm = nt; $("d-road-t").value = Math.round(tm * 4) / 4; $("d-road-t-val").textContent = (Math.round(tm * 4) / 4).toFixed(2) + "시";
        if (tm >= 24) { playing = false; $("d-road-play").textContent = "▶ 하루 흘려 보기"; }
        ph += dt / 60; draw();
      } else if (level(tm) < FLOOR) { ph += dt / 60; drawModelOnly(); }
    }, 24);
    function drawModelOnly() { var lv = level(tm); ctx.clearRect(0, 0, W, DH + 4); drawModel(lv, lv < FLOOR); }
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
