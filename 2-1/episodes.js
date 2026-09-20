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

    function draw() {
      paper(ctx, W, H);
      var s = sign();
      /* 왼쪽 — 깊이별 흐름 */
      text(ctx, "깊이에 따른 흐름 — 에크만 나선", 40, 28, { s: 13, w: "800" });
      ctx.strokeStyle = v("--line"); ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(185, 50); ctx.lineTo(185, 360); ctx.stroke(); ctx.setLineDash([]);
      for (var i = 0; i < 6; i++) {
        var y = 70 + i * 54;
        text(ctx, i === 0 ? "표층" : (i * 15) + " m", 40, y + 4, { s: 11, c: v("--mist") });
        var ang = dir + s * (45 + i * 25), len = 88 * Math.pow(0.78, i);
        var r = ang * Math.PI / 180;
        var ex = 185 + len * Math.sin(r), ey = y - len * Math.cos(r) * 0.6;
        ctx.globalAlpha = 1 - i * 0.11;
        arrow(ctx, 185, y, ex, ey, v(i === 0 ? "--teal" : "--brand"), 3, 9);
        ctx.globalAlpha = 1;
      }
      text(ctx, "깊어질수록 방향은 " + (s > 0 ? "오른쪽" : "왼쪽") + "으로 돌고 속력은 줄어듭니다", 40, 398, { s: 11, c: v("--mist") });

      /* 오른쪽 — 위에서 본 방향 */
      text(ctx, "위에서 내려다본 방향", 530, 28, { s: 13, w: "800" });
      var cx = 660, cy = 215, R = 125;
      ctx.strokeStyle = v("--line"); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
      text(ctx, "북", cx, cy - R - 12, { s: 11.5, w: "800", a: "center", c: v("--mist") });
      text(ctx, "남", cx, cy + R + 22, { s: 11.5, w: "800", a: "center", c: v("--mist") });
      text(ctx, "동", cx + R + 22, cy + 4, { s: 11.5, w: "800", a: "center", c: v("--mist") });
      text(ctx, "서", cx - R - 22, cy + 4, { s: 11.5, w: "800", a: "center", c: v("--mist") });
      var p1 = compass(cx, cy, dir, R);
      arrow(ctx, cx, cy, p1[0], p1[1], v("--amber"), 5, 13);
      var p2 = compass(cx, cy, surf(), 95);
      arrow(ctx, cx, cy, p2[0], p2[1], v("--teal"), 4, 11);
      var p3 = compass(cx, cy, trans(), 110);
      arrow(ctx, cx, cy, p3[0], p3[1], v("--coral"), 6, 14);
      ctx.fillStyle = v("--ink"); ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fill();
      text(ctx, "바람(노랑) · 표층 해수(청록)", 530, 372, { s: 11, c: v("--mist") });
      text(ctx, "에크만 수송 = 층 전체를 합한 순 이동(주황)", 530, 394, { s: 11.5, w: "800", c: v("--coral-700") });

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
    var F = 7.292e-5;                            /* 위도 30°N 의 전향 인자 */
    var LEN = 2.0e6;                             /* 환류 중심 ~ 가장자리 2,000 km */

    function speed() { return G * (dh / 100 / LEN) / F * 100; }   /* cm/s */

    function draw() {
      paper(ctx, W, H);
      var y0 = 120, bump = dh * 0.25;
      /* 왼쪽 — 해수면 단면 */
      text(ctx, "해수면 단면 — 환류 중심과 가장자리", 40, 28, { s: 13, w: "800" });
      ctx.beginPath(); ctx.moveTo(45, 400);
      for (var x = 45; x <= 465; x += 5) {
        var t = (x - 140) / 130;
        ctx.lineTo(x, y0 - bump * Math.exp(-t * t));
      }
      ctx.lineTo(465, 400); ctx.closePath();
      ctx.fillStyle = v("--brand"); ctx.globalAlpha = .3; ctx.fill(); ctx.globalAlpha = 1;
      ctx.strokeStyle = v("--brand-700"); ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (var x2 = 45; x2 <= 465; x2 += 5) {
        var t2 = (x2 - 140) / 130, yy = y0 - bump * Math.exp(-t2 * t2);
        if (x2 === 45) ctx.moveTo(x2, yy); else ctx.lineTo(x2, yy);
      }
      ctx.stroke();
      ctx.fillStyle = v("--line"); ctx.fillRect(45, 400, 420, 12);
      text(ctx, "해저", 48, 410, { s: 10, c: v("--mist") });
      text(ctx, "환류 중심", 140, Math.max(24, y0 - bump - 12), { s: 11, w: "800", a: "center", c: v("--brand-700") });
      text(ctx, "가장자리", 430, y0 - 12, { s: 11, w: "800", a: "center", c: v("--mist") });

      var yd = y0 + d / 800 * 275;
      ctx.strokeStyle = v("--coral"); ctx.lineWidth = 2; ctx.setLineDash([6, 5]);
      ctx.beginPath(); ctx.moveTo(45, yd); ctx.lineTo(465, yd); ctx.stroke(); ctx.setLineDash([]);
      text(ctx, "수심 " + d + " m", 48, yd - 7, { s: 10.5, w: "800", c: v("--coral-700") });
      var pe = 1 + d / 10, pc = 1 + (d + dh / 100) / 10;
      ctx.fillStyle = v("--coral");
      ctx.beginPath(); ctx.arc(140, yd, 5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(430, yd, 5, 0, Math.PI * 2); ctx.fill();
      text(ctx, pc.toFixed(3) + " 기압", 140, yd + 20, { s: 11, w: "800", a: "center" });
      text(ctx, pe.toFixed(3) + " 기압", 430, yd + 20, { s: 11, w: "800", a: "center" });
      text(ctx, "같은 높이의 수압 차 " + (dh / 1000).toFixed(3) + " 기압 → 높은 쪽에서 낮은 쪽으로 수압 경도력", 40, 428, { s: 11, c: v("--mist") });

      /* 오른쪽 — 힘의 평형 */
      text(ctx, "힘의 평형 (북반구, 위도 30°N)", 500, 28, { s: 13, w: "800" });
      text(ctx, "해수면 높은 쪽 (환류 중심)", 690, 58, { s: 11, w: "800", a: "center", c: v("--brand-700") });
      ctx.strokeStyle = v("--line"); ctx.lineWidth = 1; ctx.setLineDash([5, 5]);
      for (var gy = 80; gy <= 280; gy += 40) { ctx.beginPath(); ctx.moveTo(520, gy); ctx.lineTo(860, gy); ctx.stroke(); }
      ctx.setLineDash([]);
      text(ctx, "등수압선", 520, 74, { s: 10, c: v("--mist") });
      text(ctx, "해수면 낮은 쪽", 690, 302, { s: 11, w: "800", a: "center", c: v("--mist") });
      arrow(ctx, 690, 180, 690, 265, v("--coral"), 5, 12);
      text(ctx, "수압 경도력", 700, 234, { s: 11.5, w: "800", c: v("--coral-700") });
      arrow(ctx, 690, 180, 690, 95, v("--brand"), 5, 12);
      text(ctx, "전향력", 700, 132, { s: 11.5, w: "800", c: v("--brand-700") });
      arrow(ctx, 690, 180, 575, 180, v("--teal"), 6, 14);
      text(ctx, "지형류", 610, 166, { s: 12.5, w: "900", a: "center", c: v("--teal-700") });
      ctx.fillStyle = v("--ink"); ctx.beginPath(); ctx.arc(690, 180, 5, 0, Math.PI * 2); ctx.fill();
      text(ctx, "v = " + speed().toFixed(2) + " cm/s", 690, 336, { s: 17, w: "900", a: "center", c: v("--teal-700") });
      text(ctx, "두 힘이 같아질 때의 속도", 690, 360, { s: 11, a: "center", c: v("--mist") });
      text(ctx, "해수면 높이차 " + dh + " cm · 거리 2,000 km", 500, 400, { s: 11, c: v("--mist") });

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

    function draw() {
      paper(ctx, W, H);
      var top = 80, bot = 340, oL = 130, oR = 770;
      ctx.fillStyle = v("--panel-2"); ctx.fillRect(oL, top, oR - oL, bot - top);
      ctx.fillStyle = v("--line"); ctx.fillRect(40, top, oL - 40, bot - top); ctx.fillRect(oR, top, 90, bot - top);
      text(ctx, "대륙 (서쪽)", 85, 66, { s: 11, a: "center", c: v("--mist") });
      text(ctx, "대륙 (동쪽)", 815, 66, { s: 11, a: "center", c: v("--mist") });
      text(ctx, "고위도 ↑", 450, 48, { s: 11.5, w: "800", a: "center", c: v("--mist") });
      text(ctx, "↓ 적도", 450, 362, { s: 11.5, w: "800", a: "center", c: v("--mist") });

      var px = (oR - oL) / 8000;                  /* 대양 폭 8,000 km */
      var wpx = Math.max(12, 100 * px), epx = Math.max(12, wid * px);
      if (epx > oR - oL - wpx - 20) epx = oR - oL - wpx - 20;

      ctx.globalAlpha = side === "west" ? 1 : .35;
      ctx.fillStyle = v("--coral"); ctx.fillRect(oL + 4, top + 12, wpx, bot - top - 24);
      arrow(ctx, oL + 4 + wpx / 2, bot - 30, oL + 4 + wpx / 2, top + 34, v("--coral-700") || v("--coral"), 4, 12);
      ctx.globalAlpha = 1;
      ctx.globalAlpha = side === "east" ? 1 : .35;
      ctx.fillStyle = v("--brand"); ctx.fillRect(oR - 4 - epx, top + 12, epx, bot - top - 24);
      arrow(ctx, oR - 4 - epx / 2, top + 34, oR - 4 - epx / 2, bot - 30, v("--brand-700") || v("--brand"), 4, 12);
      ctx.globalAlpha = 1;

      text(ctx, "서안 경계류", oL + 4 + wpx / 2 + 44, top + 4, { s: 11.5, w: "800", a: "center", c: v("--coral-700") });
      text(ctx, "동안 경계류", oR - 4 - epx / 2, top + 4, { s: 11.5, w: "800", a: "center", c: v("--brand-700") });

      var t = et(), diff = Math.abs(t - WT);
      text(ctx, "서안 — 폭 100 km, 깊이 800 m, 유속 50 cm/s → 수송량 " + WT.toFixed(0) + " Sv", 40, 388, { s: 11.5, w: "800", c: v("--coral-700") });
      text(ctx, "동안 — 폭 " + wid.toLocaleString() + " km, 깊이 500 m, 유속 5 cm/s → 수송량 " + t.toFixed(1) + " Sv", 40, 410, { s: 11.5, w: "800", c: v("--brand-700") });
      text(ctx, "1 Sv = 100만 m³/s", 860, 410, { s: 10.5, a: "right", c: v("--mist") });

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
    window.sthState("r1", "해결 · 동안 경계류 폭 " + (window.sthState("aBnd") || "-") + " km 로 수송량 일치");
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
      { id: "aw2", label: "오리가 알래스카에 닿기까지", hint: "바람 → 에크만 수송 → 해수면이 높아짐 → 수압 경도력 → 전향력 → 지형류 → 서안 경계류 순서로, 각 단계에서 무엇이 무엇을 일으켰는지 이어서 쓰세요." }
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

    function draw() {
      paper(ctx, W, H);
      var Hs = height();
      text(ctx, "바람이 부는 해역 — 파도가 자라는 모습", 60, 28, { s: 13, w: "800" });
      text(ctx, "풍속 " + U + " m/s · 취송 거리 " + Fk.toLocaleString() + " km · 지속 시간 " + tt + " 시간", 60, 56, { s: 12, c: v("--mist") });
      text(ctx, "실제로 바람을 받은 거리 " + Math.round(feff()).toLocaleString() + " km — " + state(), 60, 78, { s: 11.5, w: "800", c: v("--amber-700") });
      text(ctx, "파고 " + Hs.toFixed(2) + " m", 820, 60, { s: 20, w: "900", a: "right", c: (Hs >= 2 && Hs <= 2.5) ? v("--green-700") : v("--ink") });

      /* 바람 화살표 */
      for (var k = 0; k < 6; k++) {
        var wx = 90 + k * 120;
        arrow(ctx, wx, 120, wx + 70, 120, v("--amber"), Math.max(2, U / 5), 9);
      }
      text(ctx, "바람 →", 60, 108, { s: 11, c: v("--mist") });

      /* 바다 */
      var sTop = 170, sBot = 340;
      ctx.fillStyle = v("--panel-2"); ctx.fillRect(60, sTop, 780, sBot - sTop);
      ctx.strokeStyle = v("--brand-700"); ctx.lineWidth = 2.5; ctx.beginPath();
      for (var x = 60; x <= 840; x += 3) {
        var g = Math.pow((x - 60) / 780, 0.6);
        var amp = clamp(Hs, 0, 5) * 13 * g;
        var yy = sTop + 60 - amp * Math.sin((x - 60) / (22 + 40 * g));
        if (x === 60) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
      }
      ctx.stroke();
      ctx.fillStyle = v("--brand"); ctx.globalAlpha = .18; ctx.fillRect(60, sTop + 60, 780, sBot - sTop - 60); ctx.globalAlpha = 1;
      text(ctx, "0 km", 62, 358, { s: 10.5, c: v("--mist") });
      text(ctx, Math.round(feff()).toLocaleString() + " km (유효 취송 거리)", 838, 358, { s: 10.5, a: "right", c: v("--mist") });
      text(ctx, "바람을 오래, 멀리 받을수록 파도가 자랍니다", 60, 382, { s: 11, c: v("--mist") });

      /* 파고 게이지 */
      var gx = 852, gT = 120, gB = 340;
      ctx.fillStyle = v("--card-2"); ctx.fillRect(gx, gT, 20, gB - gT);
      ctx.fillStyle = v("--green-100");
      ctx.fillRect(gx, gB - 2.5 / 5 * (gB - gT), 20, (2.5 - 2.0) / 5 * (gB - gT));
      var hpx = clamp(Hs / 5, 0, 1) * (gB - gT);
      ctx.fillStyle = (Hs >= 2 && Hs <= 2.5) ? v("--green") : v("--coral");
      ctx.fillRect(gx, gB - hpx, 20, hpx);
      text(ctx, "2.5", gx - 6, gB - 2.5 / 5 * (gB - gT) + 4, { s: 10, a: "right", c: v("--mist") });
      text(ctx, "2.0", gx - 6, gB - 2.0 / 5 * (gB - gT) + 4, { s: 10, a: "right", c: v("--mist") });
      text(ctx, "0", gx - 6, gB + 4, { s: 10, a: "right", c: v("--mist") });

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

    function draw() {
      paper(ctx, W, H);
      var c = cc(), hr = hours();
      text(ctx, "북태평양 저기압 → 대회장 3,600 km", 60, 28, { s: 13, w: "800" });
      /* 저기압 */
      ctx.strokeStyle = v("--violet"); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(110, 120, 38, 0, Math.PI * 2); ctx.stroke();
      text(ctx, "L", 110, 129, { s: 22, w: "900", a: "center", c: v("--violet") });
      text(ctx, "저기압", 110, 78, { s: 11, w: "800", a: "center", c: v("--violet-700") });
      /* 해안 */
      ctx.fillStyle = v("--line"); ctx.fillRect(800, 95, 70, 60);
      text(ctx, "대회장", 835, 86, { s: 11, w: "800", a: "center", c: v("--mist") });
      arrow(ctx, 160, 120, 780, 120, v("--mist"), 2, 10);

      /* 너울 */
      var px = L / 500 * 150;
      ctx.strokeStyle = v("--teal"); ctx.lineWidth = 2.5; ctx.beginPath();
      for (var x = 150; x <= 790; x += 2) {
        var yy = 205 - 22 * Math.sin((x - 150) / px * 2 * Math.PI);
        if (x === 150) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
      }
      ctx.stroke();
      ctx.strokeStyle = v("--mist"); ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(150, 183); ctx.lineTo(150 + px, 183); ctx.stroke(); ctx.setLineDash([]);
      text(ctx, "파장 " + L + " m", 150 + px / 2, 176, { s: 10.5, w: "800", a: "center", c: v("--teal-700") });

      /* 시간 막대 */
      var bx0 = 150, bx1 = 790;
      ctx.strokeStyle = v("--line"); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(bx0, 262); ctx.lineTo(bx1, 262); ctx.stroke();
      [0, 24, 48, 72].forEach(function (t) {
        var gx = bx0 + t / 72 * (bx1 - bx0);
        ctx.strokeStyle = t === 48 ? v("--amber") : v("--line"); ctx.lineWidth = t === 48 ? 2.5 : 1.5;
        ctx.beginPath(); ctx.moveTo(gx, 252); ctx.lineTo(gx, 272); ctx.stroke();
        text(ctx, t + "시간", gx, 288, { s: 10.5, a: "center", c: t === 48 ? v("--amber-700") : v("--mist") });
      });
      text(ctx, "대회 시작", bx0 + 48 / 72 * (bx1 - bx0), 244, { s: 10.5, w: "800", a: "center", c: v("--amber-700") });
      var mx = bx0 + clamp(hr, 0, 72) / 72 * (bx1 - bx0);
      ctx.fillStyle = (hr >= 47 && hr <= 49) ? v("--green") : v("--coral");
      ctx.beginPath(); ctx.moveTo(mx, 254); ctx.lineTo(mx - 8, 240); ctx.lineTo(mx + 8, 240); ctx.closePath(); ctx.fill();

      text(ctx, "파속 c = √(gL / 2π) = " + c.toFixed(2) + " m/s  (시속 " + (c * 3.6).toFixed(0) + " km)", 60, 322, { s: 12.5, w: "800" });
      text(ctx, "3,600 km 도달 시간 = 3,600,000 m ÷ " + c.toFixed(2) + " m/s = " + hr.toFixed(1) + " 시간", 60, 346, { s: 12.5, w: "800" });
      text(ctx, "깊은 바다에서는 수심이 파속에 아무 영향을 주지 않습니다 — 파장만이 정합니다", 60, 370, { s: 11, c: v("--mist") });

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

    function draw() {
      paper(ctx, W, H);
      var L = localL(), kd = kind(L), c = L / T0, hs = shoalH(L), k = 2 * Math.PI / L;
      var sTop = 110, yFloor = sTop + 230 * Math.sqrt(Math.min(1, (h / L) / 0.6));

      text(ctx, "파장 280 m 너울이 얕은 곳으로 들어올 때", 60, 28, { s: 13, w: "800" });
      text(ctx, "수심 h = " + h + " m · 그 자리의 파장 L = " + L.toFixed(0) + " m · h / L = " + (h / L).toFixed(3), 60, 56, { s: 12, w: "800" });
      text(ctx, "파속 v = " + c.toFixed(2) + " m/s · 파고 H = " + hs.toFixed(2) + " m", 60, 78, { s: 12, c: v("--mist") });
      text(ctx, "깊은 바다의 값: L₀ = 280 m, c₀ = " + C0.toFixed(1) + " m/s, 주기 " + T0.toFixed(1) + "초", 840, 56, { s: 11, a: "right", c: v("--mist") });

      /* 물과 해저 */
      ctx.fillStyle = v("--brand"); ctx.globalAlpha = .18; ctx.fillRect(60, sTop, 780, yFloor - sTop); ctx.globalAlpha = 1;
      ctx.fillStyle = v("--line"); ctx.fillRect(60, yFloor, 780, 350 - yFloor > 0 ? 350 - yFloor : 10);
      ctx.strokeStyle = v("--brand-700"); ctx.lineWidth = 2.5;
      var apx = clamp(hs, 0, 6) * 6;
      var lpx = clamp(L / 280 * 280, 40, 400);
      ctx.beginPath();
      for (var x = 60; x <= 840; x += 2) {
        var yy = sTop + 2 + apx / 2 - apx / 2 * Math.cos((x - 60) / lpx * 2 * Math.PI);
        if (x === 60) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
      }
      ctx.stroke();
      text(ctx, "해수면", 64, sTop - 8, { s: 10.5, c: v("--mist") });
      text(ctx, "해저 (수심 " + h + " m)", 64, Math.min(346, yFloor + 16), { s: 10.5, w: "800", c: v("--mist") });

      /* 물 입자 궤도 */
      var mid = (sTop + yFloor) / 2, rx = clamp((yFloor - sTop) * 0.3, 6, 40), ry = rx * Math.tanh(k * h);
      for (var i = 0; i < 5; i++) {
        var px2 = 150 + i * 150;
        ctx.strokeStyle = v("--teal"); ctx.lineWidth = 1.8;
        ctx.beginPath(); ctx.ellipse(px2, mid, rx, Math.max(1.2, ry), 0, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = v("--teal"); ctx.beginPath(); ctx.arc(px2, mid - Math.max(1.2, ry), 3.2, 0, Math.PI * 2); ctx.fill();
      }
      text(ctx, "물 입자의 궤도", 840, mid - rx - 10, { s: 10.5, a: "right", c: v("--teal-700") });

      var label = kd === "deep" ? "심해파 — 수심이 파장의 1/2보다 깊다 (h/L > 0.5)"
        : (kd === "shallow" ? "천해파 — 수심이 파장의 1/20보다 얕다 (h/L < 0.05)"
          : "전이대 — 심해파도 천해파도 아닌 중간 (0.05 < h/L < 0.5)");
      text(ctx, label, 60, 372, { s: 13, w: "900", c: kd === "mid" ? v("--mist") : v("--teal-700") });
      text(ctx, hs / h > 0.78 ? "⚠ 파고가 수심의 0.8배를 넘었습니다 — 물마루가 무너집니다(쇄파)" : "물 입자의 궤도가 납작해질수록 해저가 파도를 붙잡고 있다는 뜻입니다", 60, 398, { s: 11, c: v("--mist") });

      $("b-shoal-info").innerHTML =
        "<b>" + label + "</b><br>" +
        (kd === "deep" ? "물 입자는 거의 완전한 <b>원 궤도</b>를 그립니다. 파속은 √(gL/2π) = " + C0.toFixed(1) + " m/s 로 <b>파장만</b>이 정합니다."
          : (kd === "shallow" ? "물 입자는 해저에 눌려 <b>납작한 타원 궤도</b>를 그립니다. 파속은 √(gh) = " + Math.sqrt(G * h).toFixed(2) + " m/s 로 <b>수심만</b>이 정합니다."
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
        "맞습니다. 천해파의 속도는 √(gh) 로 오직 수심이 정합니다. 그래서 해안으로 갈수록 느려집니다.",
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

    function draw() {
      paper(ctx, W, H);
      var s = sp(), kmh = s * 3.6;
      text(ctx, "수심에 따른 지진 해일의 속도", 40, 28, { s: 13, w: "800" });
      /* 단면 */
      var sTop = 70, yF = sTop + 200 * Math.sqrt(h / 7000);
      ctx.fillStyle = v("--brand"); ctx.globalAlpha = .18; ctx.fillRect(40, sTop, 560, yF - sTop); ctx.globalAlpha = 1;
      ctx.fillStyle = v("--line"); ctx.fillRect(40, yF, 560, Math.max(8, 280 - yF));
      ctx.strokeStyle = v("--coral"); ctx.lineWidth = 3; ctx.beginPath();
      for (var x = 40; x <= 600; x += 4) {
        var yy = sTop + 4 - 10 * Math.exp(-Math.pow((x - 300) / 190, 2));
        if (x === 40) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
      }
      ctx.stroke();
      arrow(ctx, 360, sTop - 22, 470, sTop - 22, v("--coral"), 3, 10);
      text(ctx, "파장 100 km 이상 · 먼바다 파고 1 m 이하", 40, 52, { s: 11, c: v("--mist") });
      text(ctx, "수심 " + h.toLocaleString() + " m", 44, Math.min(276, yF + 18), { s: 11.5, w: "800", c: v("--mist") });

      /* 속도 */
      text(ctx, "v = √( g h )", 630, 110, { s: 14, w: "800", c: v("--mist") });
      text(ctx, s.toFixed(1) + " m/s", 630, 152, { s: 26, w: "900", c: v("--coral-700") });
      text(ctx, "= 시속 " + kmh.toFixed(0) + " km", 630, 186, { s: 15, w: "800" });

      /* 비교 막대 */
      var bx = 60, bw = 800;
      ctx.fillStyle = v("--card-2"); ctx.fillRect(bx, 306, bw, 16);
      ctx.fillStyle = v("--coral"); ctx.fillRect(bx, 306, clamp(kmh / 1000, 0, 1) * bw, 16);
      [[100, "자동차 100"], [300, "고속열차 300"], [900, "제트 여객기 900"]].forEach(function (m) {
        var gx = bx + m[0] / 1000 * bw;
        ctx.strokeStyle = v("--ink"); ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]);
        ctx.beginPath(); ctx.moveTo(gx, 298); ctx.lineTo(gx, 328); ctx.stroke(); ctx.setLineDash([]);
        text(ctx, m[1], gx, 346, { s: 10.5, w: "800", a: "center", c: v("--mist") });
      });
      text(ctx, "시속 (km)", 60, 296, { s: 10.5, c: v("--mist") });

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
      paper(ctx, W, H);
      text(ctx, "진원에서 해안까지 — 구간마다 수심이 다르다", 40, 28, { s: 13, w: "800" });
      var sea = 120;
      /* 해저 단면 */
      ctx.fillStyle = v("--brand"); ctx.globalAlpha = .18;
      ctx.beginPath(); ctx.moveTo(X0, sea);
      ctx.lineTo(xOfKm(150), sea); ctx.lineTo(xOfKm(150), 330); ctx.lineTo(X0, 330); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(xOfKm(150), sea); ctx.lineTo(xOfKm(200), sea); ctx.lineTo(xOfKm(200), 200); ctx.lineTo(xOfKm(150), 200); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(xOfKm(200), sea); ctx.lineTo(X1, sea); ctx.lineTo(X1, 150); ctx.lineTo(xOfKm(200), 150); ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = v("--line");
      ctx.beginPath();
      ctx.moveTo(X0, 330); ctx.lineTo(xOfKm(150), 330); ctx.lineTo(xOfKm(150), 200); ctx.lineTo(xOfKm(200), 200);
      ctx.lineTo(xOfKm(200), 150); ctx.lineTo(X1, 150); ctx.lineTo(X1, 345); ctx.lineTo(X0, 345); ctx.closePath(); ctx.fill();

      text(ctx, "A 심해 5,000 m", (X0 + xOfKm(150)) / 2, 318, { s: 11.5, w: "800", a: "center", c: v("--on-accent") });
      text(ctx, "B 1,000 m", (xOfKm(150) + xOfKm(200)) / 2, 190, { s: 11, w: "800", a: "center", c: v("--on-accent") });
      text(ctx, "C 100 m", (xOfKm(200) + X1) / 2, 142, { s: 10.5, w: "800", a: "center", c: v("--mist") });
      text(ctx, "진원", X0 + 4, 108, { s: 11, w: "800", c: v("--coral-700") });
      text(ctx, "해안", X1, 108, { s: 11, w: "800", a: "right", c: v("--mist") });

      /* 물결 */
      var sec = tot * frac, km = kmAt(sec), wx = xOfKm(km);
      var amp = 8 * Math.pow(5000 / depAt(km), 0.25);
      ctx.strokeStyle = v("--coral"); ctx.lineWidth = 3;
      ctx.beginPath();
      for (var x = X0; x <= X1; x += 4) {
        var t = (x - wx) / 90;
        ctx.lineTo(x, sea - amp * Math.exp(-t * t));
      }
      ctx.stroke();
      ctx.fillStyle = v("--coral");
      ctx.beginPath(); ctx.arc(wx, sea - amp - 6, 4, 0, Math.PI * 2); ctx.fill();

      var mm = Math.floor(sec / 60), ss = Math.round(sec % 60);
      text(ctx, "지진 발생 후 " + mm + "분 " + (ss < 10 ? "0" + ss : ss) + "초 · " + km.toFixed(0) + " km 이동", 450, 68, { s: 14, w: "900", a: "center", c: v("--coral-700") });
      text(ctx, "내가 계산한 도달 시각: " + guess + "분", 40, 370, { s: 12.5, w: "800" });
      text(ctx, "구간별로 v = √(gh) 를 구한 뒤 거리 ÷ 속도를 모두 더합니다", 40, 392, { s: 11, c: v("--mist") });
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
            window.sthMission("mC3", true, "<span class='m-tag'>미션 완료</span>해안 도달까지 약 <b>26분</b>. 거리의 94%를 차지하는 심해 구간은 11분 만에 지나지만, 마지막 12 km는 6분이 넘게 걸립니다. <b>느려진 만큼 파고가 솟아오릅니다.</b>");
            ep.clear(2);
          } else {
            $("c-arr-info").innerHTML = "❌ 내 계산 " + guess + "분은 실제보다 <b>" + (guess > real ? "늦습니다" : "이릅니다") + "</b>. 구간별 속도를 다시 구해 보세요. 수심이 얕아질수록 √(gh) 가 작아져 같은 거리라도 훨씬 오래 걸립니다.";
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

    function draw() {
      paper(ctx, W, H);
      var tp = pEff(), tw = wEff(), tot = total();
      text(ctx, "폭풍 해일 — 세 가지가 겹칠 때", 40, 28, { s: 13, w: "800" });

      /* 왼쪽 — 태풍 */
      ctx.strokeStyle = v("--violet"); ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(150, 120, 44, 0, Math.PI * 2); ctx.stroke();
      text(ctx, "L", 150, 131, { s: 26, w: "900", a: "center", c: v("--violet") });
      text(ctx, P + " hPa", 150, 188, { s: 13, w: "900", a: "center", c: v("--violet-700") });
      text(ctx, "기압 효과 " + tp.toFixed(2) + " m", 150, 210, { s: 11, a: "center", c: v("--mist") });
      arrow(ctx, 70, 250, 240, 250, v("--amber"), Math.max(2, U / 6), 12);
      text(ctx, U + " m/s 바람", 150, 282, { s: 13, w: "900", a: "center", c: v("--amber-700") });
      text(ctx, "바람 효과 " + tw.toFixed(2) + " m", 150, 304, { s: 11, a: "center", c: v("--mist") });
      text(ctx, "천문 조위 " + tide.toFixed(1) + " m", 150, 336, { s: 13, w: "900", a: "center", c: v("--brand-700") });

      /* 오른쪽 — 해안 단면 */
      var base = 350, pm = 54;
      for (var m = 0; m <= 5; m++) {
        var gy = base - m * pm;
        ctx.strokeStyle = v("--line"); ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.moveTo(330, gy); ctx.lineTo(880, gy); ctx.stroke(); ctx.setLineDash([]);
        text(ctx, m + " m", 324, gy + 4, { s: 10, a: "right", c: v("--mist") });
      }
      var top = base - clamp(tot, 0, 5) * pm;
      ctx.fillStyle = v("--brand"); ctx.globalAlpha = .45; ctx.fillRect(332, top, 368, base - top); ctx.globalAlpha = 1;
      ctx.strokeStyle = v("--brand-700"); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(332, top); ctx.lineTo(700, top); ctx.stroke();
      ctx.fillStyle = v("--line"); ctx.fillRect(700, base - 3 * pm, 40, 3 * pm + 20); ctx.fillRect(740, base, 140, 20);
      text(ctx, "방조제 3.0 m", 720, base - 3 * pm - 10, { s: 11, w: "800", a: "center", c: v("--mist") });
      text(ctx, "시가지", 810, base - 8, { s: 11, w: "800", a: "center", c: v("--mist") });
      text(ctx, "해수면 " + tot.toFixed(2) + " m", 516, Math.max(78, top - 12), { s: 15, w: "900", a: "center", c: tot > 3 ? v("--rose-700") : v("--brand-700") });

      text(ctx, "기압 " + tp.toFixed(2) + " m + 바람 " + tw.toFixed(2) + " m + 조위 " + tide.toFixed(1) + " m = " + tot.toFixed(2) + " m", 40, 386, { s: 13, w: "900" });
      text(ctx, tot > 3 ? "⚠ 방조제를 넘었습니다" : "방조제(3.0 m)를 넘지 못했습니다", 40, 410, { s: 11.5, w: "800", c: tot > 3 ? v("--rose-700") : v("--mist") });

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
      paper(ctx, W, H);
      var q = ratio();
      text(ctx, "기조력 = 질량 ÷ 거리³ — 거리가 훨씬 더 중요하다", 40, 28, { s: 13, w: "800" });

      /* 지구 · 달 · 태양 */
      ctx.fillStyle = v("--brand"); ctx.beginPath(); ctx.arc(360, 160, 34, 0, Math.PI * 2); ctx.fill();
      text(ctx, "지구", 360, 216, { s: 11, w: "800", a: "center", c: v("--mist") });
      ctx.strokeStyle = v("--teal"); ctx.lineWidth = 2; ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.ellipse(360, 160, 58, 34, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = v("--mist"); ctx.beginPath(); ctx.arc(170, 160, 13, 0, Math.PI * 2); ctx.fill();
      text(ctx, "달", 170, 130, { s: 11.5, w: "800", a: "center", c: v("--mist") });
      text(ctx, "거리 1배 (기준)", 170, 196, { s: 10.5, a: "center", c: v("--mist") });
      ctx.fillStyle = v("--amber"); ctx.beginPath(); ctx.arc(620, 160, 30, 0, Math.PI * 2); ctx.fill();
      text(ctx, "태양", 620, 114, { s: 11.5, w: "800", a: "center", c: v("--amber-700") });
      text(ctx, "질량 2,700만 배 · 거리 " + r + "배", 620, 214, { s: 10.5, a: "center", c: v("--mist") });

      /* 막대 */
      text(ctx, "달의 기조력", 60, 288, { s: 12, w: "800", c: v("--mist") });
      ctx.fillStyle = v("--card-2"); ctx.fillRect(190, 272, 612, 22);
      ctx.fillStyle = v("--mist"); ctx.fillRect(190, 272, 180, 22);
      text(ctx, "1.00 (기준)", 880, 288, { s: 12, w: "800", a: "right" });
      text(ctx, "태양의 기조력", 60, 324, { s: 12, w: "800", c: v("--amber-700") });
      ctx.fillStyle = v("--card-2"); ctx.fillRect(190, 308, 612, 22);
      ctx.fillStyle = v("--amber"); ctx.fillRect(190, 308, clamp(q / 3.4, 0, 1) * 612, 22);
      text(ctx, (q >= 100 ? q.toFixed(0) : q.toFixed(2)) + " 배", 880, 324, { s: 12, w: "900", a: "right", c: v("--amber-700") });

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
      paper(ctx, W, H);
      var R = range(), rad = a * Math.PI / 180;
      /* 왼쪽 — 배치 */
      text(ctx, "태양 · 지구 · 달의 배치", 40, 28, { s: 13, w: "800" });
      ctx.strokeStyle = v("--line"); ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.arc(250, 200, 120, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = v("--amber"); ctx.beginPath(); ctx.arc(452, 200, 20, 0, Math.PI * 2); ctx.fill();
      text(ctx, "태양 방향", 452, 166, { s: 10.5, w: "800", a: "center", c: v("--amber-700") });
      /* 조석 타원 */
      ctx.save(); ctx.translate(250, 200); ctx.rotate(-rad);
      ctx.strokeStyle = v("--teal"); ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.ellipse(0, 0, 34 + R * 4.2, 30, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
      ctx.fillStyle = v("--brand"); ctx.beginPath(); ctx.arc(250, 200, 28, 0, Math.PI * 2); ctx.fill();
      text(ctx, "지구", 250, 205, { s: 10.5, w: "800", a: "center", c: v("--on-accent") });
      var mx = 250 + 120 * Math.cos(rad), my = 200 - 120 * Math.sin(rad);
      ctx.fillStyle = v("--mist"); ctx.beginPath(); ctx.arc(mx, my, 12, 0, Math.PI * 2); ctx.fill();
      text(ctx, "달", mx, my - 20, { s: 11, w: "800", a: "center", c: v("--mist") });
      text(ctx, phase() + " · " + a + "°", 250, 360, { s: 13, w: "900", a: "center", c: v("--teal-700") });
      text(ctx, "청록 타원 = 바닷물이 부푼 모양(과장해 그림)", 250, 384, { s: 10.5, a: "center", c: v("--mist") });

      /* 오른쪽 — 조위 곡선 */
      text(ctx, "인천 관측소의 하루 조위 곡선", 520, 28, { s: 13, w: "800" });
      var gx0 = 545, gx1 = 870, gy0 = 100, gy1 = 320, mid = (gy0 + gy1) / 2, sc = (gy1 - gy0) / 2 / 5;
      ctx.strokeStyle = v("--line"); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(gx0, gy0); ctx.lineTo(gx0, gy1); ctx.lineTo(gx1, gy1); ctx.stroke();
      for (var mm = -4; mm <= 4; mm += 2) {
        var yy = mid - mm * sc;
        ctx.strokeStyle = v("--line"); ctx.globalAlpha = .5;
        ctx.beginPath(); ctx.moveTo(gx0, yy); ctx.lineTo(gx1, yy); ctx.stroke(); ctx.globalAlpha = 1;
        text(ctx, mm + " m", gx0 - 6, yy + 4, { s: 10, a: "right", c: v("--mist") });
      }
      ctx.strokeStyle = v("--brand-700"); ctx.lineWidth = 3; ctx.beginPath();
      for (var t = 0; t <= 24; t += 0.2) {
        var val = R / 2 * Math.cos(2 * Math.PI * (t - HIGH) / PERIOD);
        var px = gx0 + t / 24 * (gx1 - gx0), py = mid - val * sc;
        if (t === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
      [0, 6, 12, 18, 24].forEach(function (t) {
        text(ctx, t + "시", gx0 + t / 24 * (gx1 - gx0), gy1 + 18, { s: 10, a: "center", c: v("--mist") });
      });
      text(ctx, "조차 " + R.toFixed(2) + " m", 870, 62, { s: 15, w: "900", a: "right", c: R >= 7.9 ? v("--coral-700") : (R <= 3.6 ? v("--brand-700") : v("--ink")) });
      text(ctx, "하루에 만조·간조가 두 번씩 (주기 12시간 25분)", 545, 360, { s: 10.5, c: v("--mist") });
      text(ctx, "물때는 날마다 약 50분씩 늦어집니다", 545, 384, { s: 10.5, c: v("--mist") });

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
    var place = "mo", tm = 0, FLOOR = -2.5;
    var ST = { "in": { n: "인천", R: 8.1 }, "mo": { n: "목포", R: 4.0 }, "mu": { n: "묵호", R: 0.3 } };

    function level(t) { return ST[place].R / 2 * Math.cos(2 * Math.PI * (t - HIGH) / PERIOD); }

    function draw() {
      paper(ctx, W, H);
      var lv = level(tm), open = lv < FLOOR;
      text(ctx, ST[place].n + " 관측소 — 사리 때의 조위 곡선 (조차 " + ST[place].R.toFixed(1) + " m)", 60, 28, { s: 13, w: "800" });

      var gx0 = 90, gx1 = 600, gy0 = 70, gy1 = 300, mid = (gy0 + gy1) / 2, sc = (gy1 - gy0) / 2 / 5;
      ctx.strokeStyle = v("--line"); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(gx0, gy0); ctx.lineTo(gx0, gy1); ctx.lineTo(gx1, gy1); ctx.stroke();
      for (var mm = -4; mm <= 4; mm += 2) {
        var yy = mid - mm * sc;
        ctx.strokeStyle = v("--line"); ctx.globalAlpha = .5;
        ctx.beginPath(); ctx.moveTo(gx0, yy); ctx.lineTo(gx1, yy); ctx.stroke(); ctx.globalAlpha = 1;
        text(ctx, mm + " m", gx0 - 6, yy + 4, { s: 10, a: "right", c: v("--mist") });
      }
      var fy = mid - FLOOR * sc;
      ctx.strokeStyle = v("--coral"); ctx.lineWidth = 2.5; ctx.setLineDash([7, 5]);
      ctx.beginPath(); ctx.moveTo(gx0, fy); ctx.lineTo(gx1, fy); ctx.stroke(); ctx.setLineDash([]);
      text(ctx, "체험장 바닥 −2.5 m", gx0 + 6, fy - 8, { s: 10.5, w: "800", c: v("--coral-700") });

      /* 드러나는 구간 칠하기 */
      ctx.fillStyle = v("--green"); ctx.globalAlpha = .25;
      for (var t2 = 0; t2 <= 24; t2 += 0.1) {
        if (level(t2) < FLOOR) {
          var bx = gx0 + t2 / 24 * (gx1 - gx0);
          ctx.fillRect(bx, fy, (gx1 - gx0) / 240 + 1, gy1 - fy);
        }
      }
      ctx.globalAlpha = 1;
      ctx.strokeStyle = v("--brand-700"); ctx.lineWidth = 3; ctx.beginPath();
      for (var t = 0; t <= 24; t += 0.2) {
        var px = gx0 + t / 24 * (gx1 - gx0), py = mid - level(t) * sc;
        if (t === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
      [0, 6, 12, 18, 24].forEach(function (t) {
        text(ctx, t + "시", gx0 + t / 24 * (gx1 - gx0), gy1 + 18, { s: 10, a: "center", c: v("--mist") });
      });
      var mx = gx0 + tm / 24 * (gx1 - gx0);
      ctx.strokeStyle = v("--amber"); ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(mx, gy0); ctx.lineTo(mx, gy1); ctx.stroke();
      ctx.fillStyle = v("--amber"); ctx.beginPath(); ctx.arc(mx, mid - lv * sc, 6, 0, Math.PI * 2); ctx.fill();

      /* 오른쪽 — 체험장 단면 */
      text(ctx, "지금 체험장의 모습", 755, 60, { s: 12, w: "800", a: "center" });
      var base = 250;
      ctx.fillStyle = v("--line"); ctx.fillRect(640, base, 230, 26);
      text(ctx, "체험장 바닥", 755, base + 44, { s: 10.5, a: "center", c: v("--mist") });
      var wh = clamp((lv - FLOOR) * 22, 0, 150);
      if (wh > 0) {
        ctx.fillStyle = v("--brand"); ctx.globalAlpha = .5; ctx.fillRect(640, base - wh, 230, wh); ctx.globalAlpha = 1;
        ctx.strokeStyle = v("--brand-700"); ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(640, base - wh); ctx.lineTo(870, base - wh); ctx.stroke();
        text(ctx, "물 깊이 " + (lv - FLOOR).toFixed(2) + " m", 755, Math.max(90, base - wh - 12), { s: 11.5, w: "800", a: "center", c: v("--brand-700") });
      } else {
        text(ctx, "🚶 길이 드러났습니다", 755, base - 20, { s: 13, w: "900", a: "center", c: v("--green-700") });
      }

      text(ctx, tm.toFixed(2) + "시의 조위 = " + lv.toFixed(2) + " m", 60, 332, { s: 13, w: "900" });
      text(ctx, open ? "✅ 바닥이 물 밖으로 드러났습니다" : "아직 물에 잠겨 있습니다 (바닥보다 " + (lv - FLOOR).toFixed(2) + " m 높은 물)", 60, 358, { s: 12, w: "800", c: open ? v("--green-700") : v("--mist") });
      text(ctx, "연두색 구간 = 바닥이 드러나는 시간대", 60, 382, { s: 11, c: v("--mist") });

      $("d-road-info").innerHTML =
        "<b>" + ST[place].n + "</b> — 사리 때 조차 <b>" + ST[place].R.toFixed(1) + " m</b>. 지금은 <b>" + tm.toFixed(2) + "시</b>, 조위 <b>" + lv.toFixed(2) + " m</b>입니다.<br>" +
        (ST[place].R / 2 < -FLOOR
          ? "이 관측소는 사리 때라도 조위가 −" + (ST[place].R / 2).toFixed(2) + " m까지밖에 내려가지 않습니다. 바닥(−2.5 m)이 드러날 수 없습니다."
          : (open ? "✅ 바닥이 드러났습니다! 이 시간대에 축제를 열면 됩니다."
            : "이 관측소에서는 드러날 수 있습니다. 조위가 −2.5 m보다 낮아지는 시각(간조 무렵)을 찾아보세요."));

      if (place === "in" && open && !ep.cleared(3)) {
        window.sthState("dRoad", tm.toFixed(2) + "시");
        window.sthMission("mD4", true, "<span class='m-tag'>미션 완료</span><b>인천</b>에서 " + tm.toFixed(2) + "시. 같은 사리라도 조차가 큰 곳에서만 바닥이 드러납니다. 목포(4 m)와 묵호(0.3 m)에서는 아무리 기다려도 열리지 않습니다.");
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
    window.sthState("r4", "해결 · 인천 " + (window.sthState("dRoad") || "-") + " 사리 간조에 길이 열림");
  }
  endScene(ep, 4, function () {
    var p = window.sthState("pD1") || "";
    $("d-vs").innerHTML = "<b>나의 첫 추측</b> " + (p || "기록 없음") +
      (p.indexOf("㉡") === 0 ? " — 정확했습니다. 배치가 날짜를, 바다 모양이 장소를 정합니다." : " — 날씨가 아니라 태양·지구·달의 배치와 그 바다의 모양이 정합니다.") +
      "<br><b>내가 찾은 시각</b> " + (window.sthState("dRoad") || "-") + " (인천 관측소)";
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
    { key: "r4", label: "④ 바다가 갈라지는 날" }
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
    { key: "r4", label: "④ 바다가 갈라지는 날" }
  ],
  line: { id: "all", label: "네 사건을 꿰는 한 문장" }
});

})();
