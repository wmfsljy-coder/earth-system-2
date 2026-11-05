/* 지구시스템과학 Ⅱ-1 해수의 운동 — 응용 실험실
   이야기에서 찾은 개념을 처음 보는 상황에 써 본다. 공용 엔진: ../assets/lab.js (sthLab) */
(function () {
"use strict";

/* ---- 스튜디오 말투(밝은 바탕 + 흰 판정 카드) — window.sthKit ---- */
var K = window.sthKit, LT = K.LT;
function card(ctx, x, W, CH, title, rows, tip, good) {
  K.card(ctx, x, 8, W - x - 8, CH - 16, title);
  rows.forEach(function (r, i) { K.row(ctx, r[0], r[1], x + 16, W - 24, 62 + i * 28, r[2]); });
  if (tip) K.tip(ctx, tip, x + 12, CH - 56, W - x - 32, good);
}
function waterFace(I, ctx, side, z0, z1) {
  I.face(ctx, side, function (Lw) { var g = ctx.createLinearGradient(0, z1, 0, z0); g.addColorStop(0, side === "front" ? "#3fa3dc" : "#2f86c8"); g.addColorStop(1, side === "front" ? "#0b2a63" : "#08204f"); ctx.fillStyle = g; ctx.fillRect(0, z0, Lw, z1 - z0); });
}
window.sthLab({
  mount: "lab", key: "lab", result: "rLab",
  cases: [

  /* ------------------------------------------------------------------ 1. 에크만 수렴과 쓰레기 섬 */
  {
    id: "c1", about: "01", tag: "에크만 수송 · 수렴", title: "태평양 쓰레기 섬의 자리", short: "쓰레기 섬",
    who: "🧴", name: "해양 쓰레기 조사단",
    say: "“북태평양 한가운데 플라스틱이 모여 ‘쓰레기 섬’을 이룬 곳이 있어요. 쓰레기는 표층 해수를 따라 움직이니, <b>표층수가 모여드는 곳</b>을 찾으면 됩니다. 북태평양에는 위도 15° 부근과 45° 부근에 서로 다른 바람이 불어요.”",
    predict: {
      q: "북반구에서 동쪽으로 부는 바람(서풍)이 불면 에크만 수송은 어느 쪽으로 일어날까요?",
      options: ["㉠ 북쪽", "㉡ 남쪽", "㉢ 동쪽"],
      answer: 1
    },
    task: "두 위도대의 바람을 알맞게 정하고, <b>쓰레기가 모이는 위도</b>에 표지를 놓으세요(± 5°).",
    build: function (stage, api) {
      var H = api.h, cv = api.canvas(330), ctx = cv.ctx, W = cv.W;
      var w45 = "E", w15 = "E", mark = 50;
      function ek(w) { return w === "W" ? -1 : 1; }      /* 서풍(W: 동쪽으로 부는) → 남(−), 동풍(E) → 북(+) */
      function conv() { return ek(w45) < 0 && ek(w15) > 0; }
      var I = K.iso({ ox: 222, oy: 74, s: 0.6, L: 400, D: 300 }), ZS = 30;
      function yL(lat) { return (60 - lat) / 60 * I.D; }
      function draw() {
        var L = I.L, D = I.D, CH = cv.H, ok = conv();
        ctx.clearRect(0, 0, W, CH);
        K.studio(ctx, 0, 0, 596, CH, { x: 300, y: CH - 28, rx: 260, ry: 30 });
        /* 북태평양 바다 판: 뒤 = 북(60°N), 앞 = 남(0°) */
        waterFace(I, ctx, "front", 0, ZS); waterFace(I, ctx, "right", 0, ZS);
        var a = I.P(L / 2, 0, ZS), b = I.P(L / 2, D, ZS), sg = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
        sg.addColorStop(0, "#3d78c6"); sg.addColorStop(1, "#45c1d6");
        I.plane(ctx, ZS, sg, "rgba(255,255,255,.85)");
        [0, 15, 30, 45, 60].forEach(function (l) { K.line(ctx, I.P(0, yL(l), ZS), I.P(L, yL(l), ZS), "rgba(255,255,255,.4)", 1, [4, 4]); });
        if (ok) {
          I.plane(ctx, ZS + .3, "rgba(255,212,59,.45)", "rgba(230,150,0,.9)", 0, L, yL(38), yL(22));
          var R = K.rng(5); for (var i = 0; i < 26; i++) { var q = I.P(30 + R() * (L - 60), yL(24 + R() * 12), ZS + 1); ctx.fillStyle = ["#ffffff", "#ff8787", "#74c0fc", "#ffd43b"][i % 4]; ctx.fillRect(q.x - 2, q.y - 3, 4, 6); }
        }
        [[45, w45], [15, w15]].forEach(function (q) {
          var y = yL(q[0]), e = q[1] === "W", d = ek(q[1]);
          var w0 = I.P(e ? 50 : 290, y, ZS + 36), w1 = I.P(e ? 290 : 50, y, ZS + 36);
          ctx.save(); ctx.shadowColor = "#ffb000"; ctx.shadowBlur = 8; K.arrow(ctx, w0, w1, "#f59f00", 5, 14); ctx.restore();
          var t0 = I.P(340, y, ZS + 2), t1 = I.P(340, y - d * 62, ZS + 2);
          ctx.save(); ctx.shadowColor = "#38d9a9"; ctx.shadowBlur = 8; K.arrow(ctx, t0, t1, "#0c8599", 5, 14); ctx.restore();
          K.pill(ctx, e ? "서풍 (편서풍)" : "동풍 (무역풍)", (w0.x + w1.x) / 2, (w0.y + w1.y) / 2 - 12, { a: "center", s: 11, c: "#ffd36b", box: [0, 596] });
          K.pill(ctx, "에크만 수송", t1.x + 8, t1.y + 4, { s: 11, c: "#99e9f2", box: [0, 596] });
        });
        var m0 = I.P(0, yL(mark), ZS + 1), m1 = I.P(L, yL(mark), ZS + 1);
        K.line(ctx, m0, m1, LT.red, 3);
        var fp = I.P(18, yL(mark), ZS); K.line(ctx, fp, { x: fp.x, y: fp.y - 30 }, "#495057", 2);
        ctx.fillStyle = LT.red; ctx.beginPath(); ctx.moveTo(fp.x, fp.y - 30); ctx.lineTo(fp.x + 14, fp.y - 25); ctx.lineTo(fp.x, fp.y - 20); ctx.closePath(); ctx.fill();
        [0, 15, 30, 45, 60].forEach(function (l) { var p = I.P(0, yL(l), ZS); K.pill(ctx, l + "°N", p.x - 8, p.y + 4, { a: "right", s: 10.5, c: "#e8ecff", box: [0, 596] }); });
        K.bigText(ctx, ok ? "표층수가 모인다" : "아직 모이지 않는다", 16, 36, 22, ok ? "#8ce99a" : "#ffffff");
        card(ctx, 606, W, CH, "판정", [["45°N 부근 바람", w45 === "W" ? "서풍" : "동풍", w45 === "W" ? LT.green : LT.orange], ["15°N 부근 바람", w15 === "W" ? "서풍" : "동풍", w15 === "E" ? LT.green : LT.orange], ["표층수 수렴", ok ? "있음 · 약 30°N" : "없음", ok ? LT.green : LT.mute], ["쓰레기 섬 표지", mark + "°N", LT.red]], ok ? "두 수송이 가운데로 모입니다" : "실제로 부는 바람을 고르세요", ok ? true : null);
      }
      cv.canvas._redraw = draw;
      api.seg({ label: "위도 45° 부근의 바람", value: "E", options: [{ v: "W", t: "서풍 (서→동)" }, { v: "E", t: "동풍 (동→서)" }], onPick: function (x) { w45 = x; draw(); } });
      api.seg({ label: "위도 15° 부근의 바람", value: "E", options: [{ v: "W", t: "서풍 (서→동)" }, { v: "E", t: "동풍 (동→서)" }], onPick: function (x) { w15 = x; draw(); } });
      api.slider({ label: "쓰레기 섬 표지의 위도", min: 0, max: 60, step: 5, value: 50, fmt: function (x) { return x + "°N"; }, onInput: function (x) { mark = x; draw(); } });
      api.info("북반구의 에크만 수송은 바람의 <b>오른쪽 90°</b>. 중위도에는 편서풍, 저위도에는 무역풍이 붑니다.");
      draw();
      return {
        judge: function () {
          if (!conv()) return { ok: false, msg: "두 바람이 만드는 에크만 수송이 한가운데로 모이지 않습니다. 실제로 부는 바람을 고르세요." };
          if (Math.abs(mark - 30) <= 5) return { ok: true, msg: "편서풍의 에크만 수송(남쪽)과 무역풍의 에크만 수송(북쪽)이 약 30°N에서 만납니다 — 쓰레기가 모이는 아열대 수렴대." };
          return { ok: false, msg: "바람은 맞았습니다. 두 수송이 만나는 위도에 표지를 옮기세요." };
        }
      };
    },
    hints: [
      "45° 에는 편서풍(서→동), 15° 에는 무역풍(동→서)이 붑니다. 각각 오른쪽 90°로 수송하면?",
      "편서풍 → 남쪽으로, 무역풍 → 북쪽으로 표층수가 갑니다. 두 흐름이 만나는 곳은 그 사이입니다."
    ],
    solution: "45° <b>서풍</b>, 15° <b>동풍</b>, 표지는 <b>약 30°N</b>(25~35°).",
    why: "편서풍과 무역풍의 에크만 수송이 아열대 해역으로 모여 표층수가 쌓이면(수렴), 해수면이 높아지고 그 둘레를 <b>지형류</b>가 돌며 거대한 아열대 순환을 이룹니다. 가운데는 바람도 해류도 약해 떠다니는 물건이 빠져나가지 못합니다.<br>" +
      "그래서 고무 오리도 플라스틱도 이 수렴대에 모입니다. 수렴대에서는 표층수가 아래로 가라앉아(침강) 영양염이 적어 ‘바다의 사막’이기도 합니다."
  },

  /* ------------------------------------------------------------------ 2. 천수 효과와 쇄파 */
  {
    id: "c2", about: "02", tag: "천해파 · 천수 효과", title: "파도가 부서지는 자리", short: "쇄파 수심",
    who: "🏄", name: "서핑 대회 안전 본부",
    say: "“먼바다에서 온 너울이 수심 10 m에서 파고 <b>1.2 m</b>로 들어오고 있어요. 해안으로 다가오면 파고가 점점 높아지다가 <b>파고가 수심의 0.78배</b>를 넘는 곳에서 부서집니다. 안전 요원을 파도가 부서지는 수심에 배치하려 해요.”",
    predict: {
      q: "너울이 해안의 얕은 곳으로 들어오면 파도는 어떻게 변할까요?",
      options: ["㉠ 속도가 느려지고 파장이 짧아지며 파고가 높아진다", "㉡ 속도가 빨라지고 파고가 낮아진다", "㉢ 아무 변화 없이 해안에 닿는다"],
      answer: 0
    },
    task: "수심 표지를 옮겨 <b>파도가 처음 부서지는 수심</b>을 찾으세요(± 0.1 m).",
    build: function (stage, api) {
      var H = api.h, cv = api.canvas(360), ctx = cv.ctx, W = cv.W;
      var d = 6, H0 = 1.2, D0 = 10, G = 9.8;
      function hgt(x) { return H0 * Math.pow(D0 / x, 0.25); }
      var DB = Math.pow(H0 * Math.pow(D0, 0.25) / 0.78, 1 / 1.25);
      /* 해안으로 갈수록 얕아지는 바다 블록: 왼쪽 위 = 수심 10 m, 오른쪽 아래 = 해변. 1 m = 11 그림 단위 */
      var I = K.iso({ ox: 96, oy: 118, s: 0.6, L: 640, D: 110 }), MZ = 11, ZB = 14, ZW = ZB + 10 * MZ, XS = 600;
      function depX(x) { return 10 * (1 - x / XS); }
      function xDep(dep) { return XS * (1 - dep / 10); }
      function bedZ(x) { return ZW - depX(x) * MZ; }
      function draw() {
        var L = I.L, D = I.D, CH = cv.H, xb = xDep(DB), h = hgt(d), brk = h / d >= 0.78;
        ctx.clearRect(0, 0, W, CH);
        K.studio(ctx, 0, 0, 596, CH, { x: 330, y: CH - 26, rx: 260, ry: 30 });
        function surf(x) { if (x >= XS) return -1; var dep = Math.max(depX(x), .3), a = x < xb ? hgt(dep) * 4.2 : 1.2, lam = 26 + dep * 7; return ZW + a * .5 * Math.cos(x / lam * 6.2832); }
        I.face(ctx, "front", function (Lw) {
          ctx.beginPath(); ctx.moveTo(0, 0); for (var u = 0; u <= Lw; u += 4) ctx.lineTo(u, Math.max(0, bedZ(u))); ctx.lineTo(Lw, 0); ctx.closePath();
          var g = ctx.createLinearGradient(0, 0, 0, ZW); g.addColorStop(0, "#5a4430"); g.addColorStop(1, "#d9c08a"); ctx.fillStyle = g; ctx.fill();
          ctx.beginPath(); for (u = 0; u <= Math.min(Lw, XS); u += 3) ctx.lineTo(u, Math.max(bedZ(u), surf(u))); for (u = Math.min(Lw, XS); u >= 0; u -= 3) ctx.lineTo(u, bedZ(u)); ctx.closePath();
          var w = ctx.createLinearGradient(0, ZW, 0, ZB); w.addColorStop(0, "rgba(70,172,230,.95)"); w.addColorStop(1, "rgba(12,60,130,.97)"); ctx.fillStyle = w; ctx.fill();
        });
        I.face(ctx, "right", function (Lw) { var g = ctx.createLinearGradient(0, 0, 0, ZW); g.addColorStop(0, "#4f3b29"); g.addColorStop(1, "#c9a978"); ctx.fillStyle = g; ctx.fillRect(0, 0, Lw, bedZ(L)); });
        I.field(ctx, function (x) { return Math.max(bedZ(x), surf(x)); }, function (x, y, z, lt) {
          if (x >= XS || bedZ(x) >= surf(x)) return K.tint("#e3c48e", lt);
          if (x > xb - 8 && x < xb + 60) return K.tint("#e9f5ff", lt);
          return K.tint(depX(x) < 3 ? "#5cc3e6" : "#3d8fd6", lt);
        }, 120, 4);
        /* 부서지는 자리 거품, 안전 요원 깃발 */
        var R = K.rng(3); for (var i = 0; i < 18; i++) { var fq = I.P(xb + R() * 50, 6 + R() * (D - 12), ZW + 2); K.glow(ctx, fq.x, fq.y, 2, "rgba(255,255,255,.95)", 2.4); }
        var xd = xDep(d), f0 = I.P(xd, D, Math.max(bedZ(xd), ZW)), f1 = { x: f0.x, y: f0.y - 46 };
        K.line(ctx, f0, f1, "#495057", 2.4);
        ctx.fillStyle = LT.red; ctx.beginPath(); ctx.moveTo(f1.x, f1.y); ctx.lineTo(f1.x + 16, f1.y + 6); ctx.lineTo(f1.x, f1.y + 12); ctx.closePath(); ctx.fill();
        K.line(ctx, I.P(xd, D, bedZ(xd)), f0, LT.red, 2, [4, 3]);
        I.edges(ctx, bedZ(L), 0);
        K.pill(ctx, "안전 요원 · 수심 " + d.toFixed(2) + " m", f1.x, f1.y - 8, { a: "center", s: 11, c: "#ffc9c9", box: [0, 596] });
        var bq = I.P(xb, 0, ZW + 6); K.pill(ctx, "💥 부서지는 곳", bq.x, bq.y - 8, { a: "center", s: 11, c: "#ffffff", box: [0, 596] });
        var lq = I.P(0, D, ZB); K.pill(ctx, "수심 10 m · 파고 1.2 m", lq.x + 4, lq.y + 26, { s: 10.5, c: "#e8ecff", box: [0, 596] });
        K.bigText(ctx, "파고 ÷ 수심 = " + (h / d).toFixed(2), 16, 36, 22, Math.abs(d - DB) <= 0.1 ? "#8ce99a" : "#ffffff");
        card(ctx, 606, W, CH, "판정", [["이 수심의 파고", h.toFixed(2) + " m", LT.blue], ["파고 ÷ 수심", (h / d).toFixed(2), brk ? LT.red : LT.green], ["천해파 속도 √(gh)", Math.sqrt(G * d).toFixed(1) + " m/s"], ["상태", brk ? "이미 부서진 뒤" : "아직 안 부서짐", brk ? LT.orange : LT.ink]], Math.abs(d - DB) <= 0.1 ? "✓ 0.78 — 처음 부서지는 수심" : "0.78 이 되는 수심을 찾으세요", Math.abs(d - DB) <= 0.1 ? true : null);
      }
      cv.canvas._redraw = draw;
      api.slider({ label: "안전 요원을 둘 수심", min: 0.5, max: 10, step: 0.05, value: 6, fmt: function (x) { return x.toFixed(2) + " m"; }, onInput: function (x) { d = x; draw(); } });
      api.info("얕아질수록 파도가 느려지면서 에너지가 좁은 곳에 몰려 파고가 커집니다(천수 효과). 이 모형에서 파고는 수심의 1/4 제곱에 반비례해요.");
      draw();
      return {
        judge: function () {
          if (Math.abs(d - DB) <= 0.1) return { ok: true, msg: "수심 약 " + DB.toFixed(2) + " m — 파고 " + hgt(DB).toFixed(2) + " m가 수심의 0.78배에 이르러 부서집니다. 이때 파도 속도는 약 " + Math.sqrt(G * DB).toFixed(1) + " m/s." };
          return { ok: false, msg: "수심 " + d.toFixed(2) + " m에서 파고 ÷ 수심 = " + (hgt(d) / d).toFixed(2) + " — " + (hgt(d) / d < 0.78 ? "아직 부서지지 않습니다. 더 얕은 곳으로." : "이미 부서진 뒤입니다. 조금 더 깊은 곳으로.") };
        }
      };
    },
    hints: [
      "‘파고 ÷ 수심’이 0.78이 되는 곳을 찾으세요. 수심이 얕아질수록 이 값이 커집니다.",
      "2 m와 3 m 사이에서 0.05 m씩 움직여 보세요."
    ],
    solution: "약 <b>2.24 m</b>(2.15~2.30 m).",
    why: "수심이 파장의 절반보다 얕아지면 파도가 바닥의 영향을 받기 시작하고, 1/20보다 얕아지면 <b>천해파</b>가 되어 속도가 √(gh)로 수심에 따라 느려집니다. 앞쪽 파가 먼저 느려지니 뒤쪽 파가 따라붙어 파장이 짧아지고 파고가 높아지지요(천수 효과).<br>" +
      "결국 파고가 수심에 비해 너무 커지면 마루가 앞으로 쏟아져 부서집니다(쇄파). 지진 해일이 해안에 닿으며 갑자기 높아지는 것도 같은 원리입니다. ※ 파고 변화 식은 수업용 모형입니다."
  },

  /* ------------------------------------------------------------------ 3. 기조력 — 거리의 세제곱 */
  {
    id: "c3", about: "04", tag: "기조력 · 사리와 조금", title: "바닷길이 열리는 날", short: "슈퍼문 사리",
    who: "🌕", name: "바닷길 축제 위원회",
    say: "“섬까지 바닷길이 완전히 드러나려면 조차가 <b>7 m 이상</b>이어야 해요. 평균 거리의 달일 때 사리의 조차는 약 6.6 m로 조금 모자랍니다. 달이 지구에 가까워지는 <b>근지점</b>과 사리가 겹치는 날을 골라야겠어요. 보통 근지점에서 달은 평균 거리의 약 <b>0.945배</b>까지 다가옵니다(이 모형에서는 그보다 가까이 둘 수 없어요).”",
    predict: {
      q: "태양은 달보다 질량이 약 2700만 배 크지만, 기조력은 달이 약 2배 큽니다. 그 까닭은?",
      options: ["㉠ 기조력은 거리의 세제곱에 반비례하는데 태양이 훨씬 멀기 때문이다", "㉡ 달이 더 밝기 때문이다", "㉢ 태양의 인력은 바다에 작용하지 않기 때문이다"],
      answer: 0
    },
    task: "달의 위상과 거리를 정해 <b>조차 7 m 이상</b>인 날을 찾으세요.",
    build: function (stage, api) {
      var H = api.h, cv = api.canvas(300), ctx = cv.ctx, W = cv.W;
      var ph = "neap", dn = 1.0, R0 = 4.5;
      function range() { return R0 * (Math.pow(1 / dn, 3) + (ph === "spring" ? 0.46 : -0.46)); }
      function draw() {
        var CH = cv.H, R = range(), ok = R >= 7 && dn >= 0.945 - 1e-9;
        ctx.clearRect(0, 0, W, CH);
        K.stage(ctx, 0, 0, 596, CH, "space", { seed: 9 });
        var ex = 300, ey = 160;
        var sg = ctx.createRadialGradient(40, ey, 10, 40, ey, 380); sg.addColorStop(0, "rgba(255,211,107,.2)"); sg.addColorStop(1, "rgba(255,211,107,0)"); ctx.fillStyle = sg; ctx.fillRect(0, 0, 596, CH);
        K.sun(ctx, 40, ey, 20); K.planet(ctx, 40, ey, 18, "#fff3bf", "#f08c00");
        ctx.strokeStyle = "rgba(200,210,255,.4)"; ctx.lineWidth = 1.2; ctx.setLineDash([4, 5]); ctx.beginPath(); ctx.ellipse(ex, ey, 120, 120 * .42, 0, 0, 6.2832); ctx.stroke(); ctx.setLineDash([]);
        /* 부푼 바닷물: 사리면 태양·달 방향(가로)으로 크게, 조금이면 둘이 엇갈려 작게 */
        var bx = 46 + R * 4, erx = ph === "spring" ? bx : 40, ery = ph === "spring" ? 40 : 40 + R * 2.2;
        ctx.save(); ctx.translate(ex, ey);
        var g = ctx.createRadialGradient(-erx * .3, -10, 2, 0, 0, Math.max(erx, ery)); g.addColorStop(0, "rgba(220,245,255,.75)"); g.addColorStop(.6, "rgba(63,211,163,.45)"); g.addColorStop(1, "rgba(30,160,130,.18)");
        ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, erx, ery, 0, 0, 6.2832); ctx.fill(); ctx.strokeStyle = "#3fd3a3"; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
        K.earth(ctx, ex, ey, 32);
        ctx.fillStyle = "rgba(4,6,20,.45)"; ctx.beginPath(); ctx.arc(ex, ey, 32, -Math.PI / 2, Math.PI / 2); ctx.fill();
        var r = 120 * dn, mx = ph === "spring" ? ex + r : ex + 4, my = ph === "spring" ? ey : ey - r * .42 - 10;
        K.planet(ctx, mx, my, 13 / dn, "#e4e6ee", "#6b7088");
        K.pill(ctx, ph === "spring" ? "달 (망)" : "달 (상현)", mx, my - 22, { a: "center", s: 11, c: "#ffffff", box: [0, 596] });
        K.pill(ctx, "지구 · 부푼 바닷물", ex, ey + 70, { a: "center", s: 11, c: "#a5d8ff", box: [0, 596] });
        K.pill(ctx, "태양", 40, ey + 46, { a: "center", s: 11, c: "#ffd36b", box: [0, 596] });
        K.warn(ctx, 584, CH - 14, "⚠ 크기·거리·부풂은 과장", "right");
        K.bigText(ctx, "조차 " + R.toFixed(2) + " m", 16, 40, 26, ok ? "#8ce99a" : "#ffffff");
        card(ctx, 606, W, CH, "판정", [["위상", ph === "spring" ? "사리 (한 줄)" : "조금 (직각)", ph === "spring" ? LT.green : LT.ink], ["달의 거리 (평균 = 1)", dn.toFixed(3), dn < 0.945 - 1e-9 ? LT.red : LT.ink], ["달의 기조력", Math.pow(1 / dn, 3).toFixed(2) + " 배"], ["조차", R.toFixed(2) + " m", R >= 7 ? LT.green : LT.red]], dn < 0.945 - 1e-9 ? "근지점(0.945)보다 가까울 수 없음" : (R >= 7 ? "✓ 바닷길이 활짝 열린다" : "조차 7 m 이상을 찾으세요"), dn < 0.945 - 1e-9 ? false : (R >= 7 ? true : null));
      }
      cv.canvas._redraw = draw;
      api.seg({ label: "달의 위상", value: "neap", options: [{ v: "spring", t: "사리 (삭 · 망)" }, { v: "neap", t: "조금 (상현 · 하현)" }], onPick: function (x) { ph = x; draw(); } });
      api.slider({ label: "지구와 달의 거리 (평균 = 1)", min: 0.9, max: 1.1, step: 0.005, value: 1.0, fmt: function (x) { return x.toFixed(3); }, onInput: function (x) { dn = x; draw(); } });
      api.info("이 모형에서 조차 = 4.5 m × (달의 기조력 ± 태양의 기조력 0.46). 사리 때는 더하고 조금 때는 뺍니다.");
      draw();
      return {
        judge: function () {
          var R = range();
          if (dn < 0.945 - 1e-9) return { ok: false, msg: "이 모형에서는 달을 평균 거리의 0.945배(보통의 근지점)보다 가까이 둘 수 없습니다." };
          if (R >= 7) return { ok: true, msg: "사리 · 거리 " + dn.toFixed(3) + " → 조차 " + R.toFixed(2) + " m. 근지점 무렵의 사리(슈퍼문)에 바닷길이 활짝 열립니다." };
          return { ok: false, msg: "조차 " + R.toFixed(2) + " m — 7 m에 모자랍니다." };
        }
      };
    },
    hints: [
      "태양과 달이 한 줄로 서는 사리 때 두 기조력이 더해집니다. 먼저 위상을 정하세요.",
      "기조력은 거리의 세제곱에 반비례합니다. 거리가 4% 줄면 기조력은 약 13% 커집니다."
    ],
    solution: "<b>사리</b>, 달의 거리 <b>0.945~0.970</b>.",
    why: "기조력은 천체의 질량에 비례하고 <b>거리의 세제곱에 반비례</b>합니다. 태양은 무겁지만 달보다 약 390배 멀어, 기조력은 달의 절반쯤입니다. 삭·망 때는 두 기조력이 한 방향으로 더해져 조차가 큰 <b>사리</b>, 상현·하현 때는 서로 직각이라 조차가 작은 <b>조금</b>이 됩니다.<br>" +
      "달의 궤도는 타원이라 근지점(평균 거리의 약 0.945배)에서 기조력이 약 18% 커집니다. 진도·무창포의 바닷길이 특히 크게 열리는 날은 근지점과 사리가 겹치는 날입니다. ※ 조차 식은 수업용 모형입니다."
  }
  ]
});
})();
