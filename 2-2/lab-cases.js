/* 지구시스템과학 Ⅱ-2 강수 과정과 대기의 운동 — 응용 실험실
   이야기에서 찾은 개념을 처음 보는 상황에 써 본다. 공용 엔진: ../assets/lab.js (sthLab) */
(function () {
"use strict";

/* ---- 스튜디오 말투(밝은 바탕 + 밝은 그래프 + 흰 판정 카드) — window.sthKit ---- */
var K = window.sthKit, LT = K.LT;
function card(ctx, x, W, CH, title, rows, tip, good) {
  K.card(ctx, x, 8, W - x - 8, CH - 16, title);
  rows.forEach(function (r, i) { K.row(ctx, r[0], r[1], x + 16, W - 24, 62 + i * 28, r[2]); });
  if (tip) K.tip(ctx, tip, x + 12, CH - 56, W - x - 32, good);
}
/* 블록 위 평면에 지도처럼 그리기(글자는 넣지 않는다) */
function onPlane(ctx, I, z, fn) {
  var o = I.P(0, 0, z), px = I.P(1, 0, z), py = I.P(0, 1, z);
  ctx.save(); ctx.transform(px.x - o.x, px.y - o.y, py.x - o.x, py.y - o.y, o.x, o.y); fn(); ctx.restore();
}

window.sthLab({
  mount: "lab", key: "lab", result: "rLab",
  cases: [

  /* ------------------------------------------------------------------ 1. 선택적 흡수와 대기의 창 */
  {
    id: "c1", about: "01", tag: "선택적 흡수 · 대기의 창", title: "기상 위성의 두 눈", short: "위성 채널",
    who: "🛰️", name: "기상 위성 설계팀",
    say: "“새 기상 위성에 적외선 채널을 두 개 달아요. <b>① 해수면 온도</b>를 재는 채널은 대기를 통과해 바다 표면에서 오는 빛을, <b>② 수증기</b> 채널은 대기 중 수증기가 내는 빛을 봐야 합니다. 각 채널의 파장을 정해 주세요.”",
    predict: {
      q: "지구 대기는 지표가 내는 적외선을 모든 파장에서 똑같이 흡수할까요?",
      options: ["㉠ 그렇다 — 모든 파장을 같게 흡수한다", "㉡ 아니다 — 기체마다 흡수하는 파장이 정해져 있어, 거의 흡수하지 않는 ‘창’이 있다", "㉢ 적외선은 전혀 흡수하지 않는다"],
      answer: 1
    },
    task: "① 채널은 <b>대기를 80% 이상 통과</b>하는 파장에, ② 채널은 <b>수증기가 강하게 흡수</b>하는 파장에 두세요.",
    build: function (stage, api) {
      var H = api.h, cv = api.canvas(392), ctx = cv.ctx, W = cv.W;
      var c1 = 15, c2 = 11;
      function trans(l) {
        if (l >= 5.5 && l <= 7.5) return 0.08;           /* 수증기 */
        if (l > 7.5 && l < 8) return 0.45;
        if (l >= 9.4 && l <= 9.9) return 0.45;           /* 오존 */
        if (l >= 13.5 && l <= 16.5) return 0.05;         /* 이산화 탄소 */
        if (l > 18) return 0.1;                          /* 수증기 회전 띠 */
        if (l >= 8 && l <= 13) return 0.88;
        return 0.6;
      }
      function who(l) {
        if (l >= 5.5 && l <= 7.5) return "수증기";
        if (l >= 9.4 && l <= 9.9) return "오존";
        if (l >= 13.5 && l <= 16.5) return "이산화 탄소";
        if (l > 18) return "수증기";
        return "";
      }
      /* 바다 블록(0~AZG) 위 대기 판(AZG~AZT), 오존층은 AZO 부터 */
      var AI = K.iso({ ox: 170, oy: 155, s: 0.72, L: 470, D: 110 }), AZG = 10, AZT = 128, AZO = AZT - 34;
      var AMOL = (function () {
        var R = K.rng(23), out = [], i;
        for (i = 0; i < 12; i++) out.push(["오존", 20 + R() * 430, 10 + R() * 90, AZO + 5 + R() * 14]);
        for (i = 0; i < 22; i++) out.push(["수증기", 20 + R() * 430, 10 + R() * 90, AZG + 6 + Math.pow(R(), 1.5) * 50]);
        for (i = 0; i < 14; i++) out.push(["이산화 탄소", 20 + R() * 430, 10 + R() * 90, AZG + 10 + R() * (AZO - AZG - 16)]);
        out.sort(function (a, b) { return (a[1] + a[2]) - (b[1] + b[2]); });
        return out;
      })();
      /* 기체 분자(입체 공): 빨강 산소 · 검정 탄소 · 흰 수소. hot 이면 그 파장을 흡수 중(노란 빛) */
      function labMol(c, kind, p, hot) {
        var r = 3.2;
        if (hot) K.glow(c, p.x, p.y, 3.4, "rgba(255,230,120,.95)", 3.4);
        if (kind === "수증기") { K.planet(c, p.x - 3.6, p.y + 2.3, r * .62, "#f8f9fa", "#868e96"); K.planet(c, p.x + 3.6, p.y + 2.3, r * .62, "#f8f9fa", "#868e96"); K.planet(c, p.x, p.y, r, "#ff6b6b", "#8a1c1c"); }
        else if (kind === "이산화 탄소") { K.planet(c, p.x - 5.4, p.y, r * .9, "#ff6b6b", "#8a1c1c"); K.planet(c, p.x + 5.4, p.y, r * .9, "#ff6b6b", "#8a1c1c"); K.planet(c, p.x, p.y, r, "#495057", "#111111"); }
        else { K.planet(c, p.x - 4.2, p.y + 2.5, r * .85, "#ff8787", "#8a1c1c"); K.planet(c, p.x + 4.2, p.y + 2.5, r * .85, "#ff8787", "#8a1c1c"); K.planet(c, p.x, p.y - 1.5, r * .85, "#ff8787", "#8a1c1c"); }
      }
      function draw() {
        var CH = cv.H, ok1 = trans(c1) >= 0.8, ok2 = who(c2) === "수증기" && c2 < 8;
        ctx.clearRect(0, 0, W, CH);
        /* ── 왼쪽: 바다 블록 위 대기 판을 잘라 본 모형 — 두 채널의 빛이 어디서 출발해 위성에 닿는지 ── */
        var Lb = AI.L, Db = AI.D, BX = [0, 640], fc = AI.P(Lb, Db, 0);
        K.studio(ctx, 0, 0, 640, CH, { x: fc.x - 140, y: fc.y - 30, rx: 290, ry: 40 });
        ["front", "right"].forEach(function (side) {
          AI.face(ctx, side, function (Lw) { ctx.fillStyle = "#2f7fc4"; ctx.fillRect(0, 0, Lw, AZG); });   /* 얇은 단색 바다 받침 */
        });
        AI.shade(ctx, "front", function () { return AZG; }); AI.shade(ctx, "right", function () { return AZG; });
        AI.plane(ctx, AZG, "#4dabf7", "rgba(255,255,255,.7)");
        AI.quad(ctx, AI.P(0, 0, AZG), AI.P(0, Db, AZG), AI.P(0, Db, AZT), AI.P(0, 0, AZT), "rgba(150,190,240,.10)", "rgba(255,255,255,.55)");
        AI.quad(ctx, AI.P(0, 0, AZG), AI.P(Lb, 0, AZG), AI.P(Lb, 0, AZT), AI.P(0, 0, AZT), "rgba(150,190,240,.12)", "rgba(255,255,255,.55)");
        var hot = { "수증기": who(c1) === "수증기" || who(c2) === "수증기", "이산화 탄소": who(c1) === "이산화 탄소" || who(c2) === "이산화 탄소", "오존": who(c1) === "오존" || who(c2) === "오존" };
        AMOL.forEach(function (m) { labMol(ctx, m[0], AI.P(m[1], m[2], m[3]), hot[m[0]]); });
        /* 채널 빛줄기: 대기를 통과하면 바다 표면에서, 흡수되면 그 기체가 있는 높이에서 출발 */
        var sat = { x: 560, y: 84 }, src = [];
        [[c1, 150, LT.red, "①"], [c2, 330, LT.violet, "②"]].forEach(function (c) {
          var tr = trans(c[0]), g = who(c[0]), zE = tr >= 0.6 ? AZG : (g === "수증기" ? AZG + 30 : (g === "이산화 탄소" ? AZG + 62 : (g === "오존" ? AZT - 18 : AZG + 40)));
          var s0 = AI.P(c[1], 55, AZG), s1 = AI.P(c[1], 55, zE), top = AI.P(c[1], 55, AZT);
          if (zE > AZG) K.line(ctx, s0, s1, c[2], 2, [4, 4], .35);
          ctx.save(); ctx.shadowColor = c[2]; ctx.shadowBlur = 8; K.line(ctx, s1, top, c[2], 3 + 6 * tr, null, .9); ctx.restore();
          K.glow(ctx, s1.x, s1.y, 4.5, zE > AZG ? "rgba(255,236,150,.95)" : "rgba(255,255,255,.95)", 3.4);
          src.push([c, top, s1, zE]);
        });
        ["front", "right"].forEach(function (side) {
          AI.face(ctx, side, function (Lw) {
            ctx.fillStyle = "rgba(140,190,245,.18)"; ctx.fillRect(0, AZG, Lw, AZO - AZG);
            ctx.fillStyle = "rgba(255,170,80,.26)"; ctx.fillRect(0, AZO, Lw, 22);
            ctx.fillStyle = "rgba(170,150,235,.14)"; ctx.fillRect(0, AZO + 22, Lw, AZT - AZO - 22);
          });
        });
        AI.quad(ctx, AI.P(0, Db, AZG), AI.P(Lb, Db, AZG), AI.P(Lb, Db, AZT), AI.P(0, Db, AZT), "rgba(255,255,255,.03)", "rgba(255,255,255,.75)");
        AI.quad(ctx, AI.P(Lb, 0, AZG), AI.P(Lb, Db, AZG), AI.P(Lb, Db, AZT), AI.P(Lb, 0, AZT), "rgba(255,255,255,.05)", "rgba(255,255,255,.75)");
        AI.plane(ctx, AZT, "rgba(255,255,255,.08)", "rgba(255,255,255,.8)");
        /* 대기 밖: 위성으로 가는 빛과 위성(입체 미니어처) */
        src.forEach(function (q) { ctx.save(); ctx.shadowColor = q[0][2]; ctx.shadowBlur = 6; K.line(ctx, q[1], sat, q[0][2], 3 + 6 * trans(q[0][0]), null, .85); ctx.restore(); });
        ctx.fillStyle = "#adb5bd"; ctx.fillRect(sat.x - 52, sat.y - 6, 34, 12); ctx.fillRect(sat.x + 18, sat.y - 6, 34, 12);
        ctx.fillStyle = "#1c4f8a"; ctx.fillRect(sat.x - 50, sat.y - 4, 30, 8); ctx.fillRect(sat.x + 20, sat.y - 4, 30, 8);
        var bg = ctx.createLinearGradient(sat.x - 14, 0, sat.x + 14, 0); bg.addColorStop(0, "#f1f3f5"); bg.addColorStop(1, "#868e96");
        ctx.fillStyle = bg; ctx.beginPath(); ctx.roundRect(sat.x - 15, sat.y - 14, 30, 28, 5); ctx.fill();
        ctx.fillStyle = "#343a40"; ctx.beginPath(); ctx.arc(sat.x, sat.y + 14, 5, 0, 6.2832); ctx.fill();
        AI.label(ctx, 0, Db, AZO + 11, "오존층", -24, -4, "#ffd8a8", BX);
        AI.label(ctx, 0, Db, AZG + 30, "수증기", -24, 4, "#a5d8ff", BX);
        AI.label(ctx, 0, Db, AZG / 2, "바다", -24, 10, "#d0ebff", BX);
        src.forEach(function (q, i) {
          var p = q[2];
          K.pill(ctx, q[0][3] + " " + (q[3] > AZG ? (who(q[0][0]) || "대기") : "바다 표면"), p.x + (i ? 14 : -14), p.y + 22, { a: i ? "left" : "right", s: 12, c: "#ffffff", box: BX });
        });
        K.pill(ctx, "기상 위성", sat.x, sat.y - 24, { a: "center", s: 12, c: "#ffe066", box: BX });
        K.pill(ctx, "노란 빛 = 그 파장을 흡수하는 분자", 14, CH - 12, { s: 12, c: "#ffffff" });
        K.bigText(ctx, "① 통과 " + Math.round(trans(c1) * 100) + "% · ② 통과 " + Math.round(trans(c2) * 100) + "%", 14, 38, 21, ok1 && ok2 ? "#8ce99a" : "#ffffff");
        card(ctx, 650, W, CH, "기상 위성의 두 눈", [["① 해수면 온도 채널", c1.toFixed(1) + " µm", ok1 ? LT.green : LT.red], ["① 대기 통과", Math.round(trans(c1) * 100) + "%"], ["② 수증기 채널", c2.toFixed(1) + " µm", ok2 ? LT.green : LT.red], ["② 흡수하는 기체", who(c2) || "거의 없음"]], ok1 && ok2 ? "✓ 바다 표면과 수증기를 각각 봅니다" : "①은 창으로, ②는 수증기 띠로", ok1 && ok2 ? true : null);
        /* 카드 안 작은 투과율 그래프 */
        var g = K.chart(ctx, { x: 656, y: 166, w: 236, h: 156, pl: 40, pb: 30, pt: 16, x0: 4, x1: 20, y0: 0, y1: 1, xt: 4, yt: 2, light: true, xl: "파장 (µm)", yf: function (v0) { return Math.round(v0 * 100) + "%"; } });
        ctx.fillStyle = "rgba(15,159,118,.12)"; ctx.fillRect(g.X(8), g.T, g.X(13) - g.X(8), g.B - g.T);
        ctx.beginPath(); ctx.moveTo(g.X(4), g.B);
        for (var l = 4; l <= 20.001; l += 0.05) ctx.lineTo(g.X(l), g.Y(trans(l)));
        ctx.lineTo(g.X(20), g.B); ctx.closePath();
        ctx.fillStyle = "rgba(12,133,153,.25)"; ctx.fill(); ctx.strokeStyle = LT.teal; ctx.lineWidth = 1.8; ctx.stroke();
        [[c1, "①", LT.red], [c2, "②", LT.violet]].forEach(function (c) {
          K.line(ctx, { x: g.X(c[0]), y: g.T }, { x: g.X(c[0]), y: g.B }, c[2], 2);
          ctx.fillStyle = "#fff"; ctx.strokeStyle = c[2]; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(g.X(c[0]), g.Y(trans(c[0])), 4.5, 0, 6.2832); ctx.fill(); ctx.stroke();
        });
        K.t(ctx, "대기의 창", g.X(10.5), g.T - 4, { s: 11, w: "800", a: "center", c: LT.green });
      }
      cv.canvas._redraw = draw;
      api.slider({ label: "① 해수면 온도 채널", min: 4, max: 20, step: 0.5, value: 15, fmt: function (x) { return x.toFixed(1) + " µm"; }, onInput: function (x) { c1 = x; draw(); } });
      api.slider({ label: "② 수증기 채널", min: 4, max: 20, step: 0.5, value: 11, fmt: function (x) { return x.toFixed(1) + " µm"; }, onInput: function (x) { c2 = x; draw(); } });
      api.info("통과 비율이 높은 파장에서는 우주에서 지표가 보이고, 낮은 파장에서는 그 기체가 있는 높이의 대기가 보입니다.");
      draw();
      return {
        judge: function () {
          var ok1 = trans(c1) >= 0.8, ok2 = who(c2) === "수증기" && c2 < 8;
          if (ok1 && ok2) return { ok: true, msg: "① " + c1 + " µm는 대기의 창이라 바다 표면이, ② " + c2 + " µm는 수증기가 흡수하는 띠라 대기 속 수증기가 보입니다." };
          if (!ok1) return { ok: false, msg: "① " + c1 + " µm — 대기가 " + Math.round((1 - trans(c1)) * 100) + "%를 흡수해 바다 표면이 보이지 않습니다." };
          return { ok: false, msg: "② " + c2 + " µm — 수증기가 강하게 흡수하는 파장(6~7 µm 부근)이 아닙니다." };
        }
      };
    },
    hints: [
      "그래프에서 통과 비율이 높은 ‘창’은 어디인가요? 오존이 흡수하는 좁은 띠는 피하세요.",
      "수증기는 약 5.5~7.5 µm를 강하게 흡수합니다. 기상 위성의 ‘수증기 영상’도 이 파장으로 찍습니다."
    ],
    solution: "① <b>8~9 µm 또는 10~13 µm</b>(대기의 창), ② <b>5.5~7.5 µm</b>.",
    why: "대기를 이루는 기체는 저마다 정해진 파장만 흡수하는 <b>선택적 흡수체</b>입니다. 수증기·이산화 탄소가 지구 복사를 흡수해 온실 효과를 일으키지만, 8~13 µm의 <b>대기의 창</b>으로는 지표의 복사가 우주로 빠져나갑니다.<br>" +
      "기상 위성은 이 성질을 거꾸로 써서, 창 파장으로 지표·구름 꼭대기 온도를, 흡수 파장으로 대기 속 기체를 봅니다. 오존이 자외선을 흡수해 생명을 지키는 것도 같은 선택적 흡수입니다. ※ 통과 비율은 수업용으로 단순화했습니다."
  },

  /* ------------------------------------------------------------------ 2. 단열 변화와 구름 */
  {
    id: "c2", about: "02", tag: "단열 변화 · 상승 응결 고도", title: "비행기 날개의 얼음", short: "착빙 고도",
    who: "✈️", name: "경비행기 조종 교실",
    say: "“지상 기온 <b>20 ℃</b>, 이슬점 <b>12 ℃</b>인 공기가 산비탈을 따라 올라가 구름을 만들고 있어요. 구름 속에서 기온이 <b>0 ℃ 아래</b>로 내려가면 날개에 얼음이 붙어 위험합니다. 구름 밑면 높이와 구름 속 0 ℃ 고도를 알려 주세요.”",
    predict: {
      q: "공기 덩이가 상승하면 기온이 내려가는 까닭은?",
      options: ["㉠ 위로 갈수록 태양에서 멀어지기 때문이다", "㉡ 주변 기압이 낮아져 공기 덩이가 팽창하며 바깥에 일을 해 내부 에너지가 줄기 때문이다(단열 팽창)", "㉢ 주변 공기에 열을 빼앗기기 때문이다"],
      answer: 1
    },
    task: "<b>구름 밑면 높이</b>(상승 응결 고도)와 <b>구름 속 0 ℃ 고도</b>를 정하세요(각 ± 50 m).",
    build: function (stage, api) {
      var H = api.h, cv = api.canvas(452), ctx = cv.ctx, W = cv.W;
      var T0 = 20, TD = 12, base = 2000, frz = 2000;
      var LCL = 125 * (T0 - TD);
      function tp(z) { return z <= LCL ? T0 - 10 * z / 1000 : T0 - 10 * LCL / 1000 - 5 * (z - LCL) / 1000; }
      var FRZ = LCL + (T0 - 10 * LCL / 1000) / 5 * 1000;
      var gx0 = 90, gx1 = 480, gy0 = 40, gy1 = 310;
      /* 산비탈 위 공기 기둥 블록(유리): 높이 0~5,000 m. 앞면 색 = 올라가는 공기 덩이의 기온 */
      var CI = K.iso({ ox: 262, oy: 277, s: 0.85, L: 230, D: 120 }), CZG = 8;
      function zk(m) { return CZG + m / 5000 * 244; }
      function tCol(tt, a) { var u = Math.max(0, Math.min(1, (tt + 10) / 30)); return "rgba(" + Math.round(70 + 185 * u) + "," + Math.round(130 + 40 * (1 - Math.abs(u - .5) * 2)) + "," + Math.round(240 - 180 * u) + "," + a + ")"; }
      function puff(c, x, y, sc) {
        [[0, 0, 1], [-.9, .3, .72], [.9, .3, .75], [-.4, -.45, .78], [.45, -.4, .7]].forEach(function (q) {
          var cx = x + q[0] * sc, cy = y + q[1] * sc, r = q[2] * sc, g = c.createRadialGradient(cx - r * .3, cy - r * .4, r * .1, cx, cy, r);
          g.addColorStop(0, "#ffffff"); g.addColorStop(.6, "#e3e9f2"); g.addColorStop(1, "rgba(150,165,195,.95)");
          c.fillStyle = g; c.beginPath(); c.arc(cx, cy, r, 0, 6.2832); c.fill();
        });
      }
      function draw() {
        var CH = cv.H, ok1 = Math.abs(base - LCL) <= 50, ok2 = Math.abs(frz - FRZ) <= 50;
        ctx.clearRect(0, 0, W, CH);
        var I = CI, Lb = I.L, Db = I.D, BX = [0, 640], fc = I.P(Lb, Db, 0), z5 = zk(5000);
        K.studio(ctx, 0, 0, 640, CH, { x: fc.x - 70, y: fc.y - 28, rx: 230, ry: 40 });
        /* 땅 블록 */
        ["front", "right"].forEach(function (side) {
          I.face(ctx, side, function (Lw) { ctx.fillStyle = "#8a6a48"; ctx.fillRect(0, 0, Lw, CZG); });   /* 얇은 단색 받침 */
        });
        I.shade(ctx, "front", function () { return CZG; }); I.shade(ctx, "right", function () { return CZG; });
        I.plane(ctx, CZG, "#86b35e");
        /* 뒤쪽 유리 */
        I.quad(ctx, I.P(0, 0, CZG), I.P(0, Db, CZG), I.P(0, Db, z5), I.P(0, 0, z5), "rgba(150,190,240,.10)", "rgba(255,255,255,.55)");
        I.quad(ctx, I.P(0, 0, CZG), I.P(Lb, 0, CZG), I.P(Lb, 0, z5), I.P(0, 0, z5), "rgba(150,190,240,.12)", "rgba(255,255,255,.55)");
        /* 올라가는 공기 덩이의 길 */
        var a0 = I.P(Lb * .5, Db * .5, CZG + 4), a1 = I.P(Lb * .5, Db * .5, zk(LCL) - 6);
        K.arrow(ctx, a0, a1, "rgba(232,89,12,.8)", 3, 11);
        /* 구름: 응결이 시작되는 높이부터 위로 */
        for (var k = 0; k < 7; k++) { var cp = I.P(Lb * (.32 + (k % 3) * .18), Db * (.35 + (k % 2) * .3), zk(LCL + (5000 - LCL) * (k + .3) / 7.2)); puff(ctx, cp.x, cp.y, 15 + (k % 3) * 3); }
        /* 내 답: 구름 밑면(청록 면) · 0 ℃ 고도(보라 면) */
        I.plane(ctx, zk(base), "rgba(12,133,153,.20)", LT.teal);
        I.plane(ctx, zk(frz), "rgba(112,72,232,.18)", LT.violet);
        /* 앞면·오른쪽 면: 공기 덩이 기온 색 띠 */
        ["front", "right"].forEach(function (side) {
          I.face(ctx, side, function (Lw) { for (var m = 0; m < 5000; m += 250) { ctx.fillStyle = tCol(tp(m + 125), side === "front" ? .26 : .34); ctx.fillRect(0, zk(m), Lw, zk(m + 250) - zk(m) + .5); } });
        });
        I.quad(ctx, I.P(0, Db, CZG), I.P(Lb, Db, CZG), I.P(Lb, Db, z5), I.P(0, Db, z5), "rgba(255,255,255,.03)", "rgba(255,255,255,.75)");
        I.quad(ctx, I.P(Lb, 0, CZG), I.P(Lb, Db, CZG), I.P(Lb, Db, z5), I.P(Lb, 0, z5), "rgba(255,255,255,.05)", "rgba(255,255,255,.75)");
        I.plane(ctx, z5, "rgba(255,255,255,.08)", "rgba(255,255,255,.8)");
        /* 비행기(0 ℃ 고도 위를 날면 날개에 얼음) */
        var ap0 = I.P(Lb, Db * .5, zk(Math.min(4800, frz + 500))), ap = { x: ap0.x + 150, y: ap0.y }, ice = frz + 500 >= FRZ && frz + 500 >= LCL;
        ctx.fillStyle = "#495057"; ctx.beginPath(); ctx.moveTo(ap.x - 26, ap.y); ctx.lineTo(ap.x + 26, ap.y - 3); ctx.lineTo(ap.x + 30, ap.y + 3); ctx.lineTo(ap.x - 26, ap.y + 6); ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#868e96"; ctx.beginPath(); ctx.moveTo(ap.x - 4, ap.y - 14); ctx.lineTo(ap.x + 8, ap.y - 14); ctx.lineTo(ap.x + 4, ap.y + 16); ctx.lineTo(ap.x - 8, ap.y + 16); ctx.closePath(); ctx.fill();
        if (ice) { ctx.fillStyle = "#d0ebff"; ctx.fillRect(ap.x - 7, ap.y - 15, 14, 3); ctx.fillRect(ap.x - 9, ap.y + 14, 14, 3); }
        /* 높이 눈금과 이름표 */
        [0, 1000, 2000, 3000, 4000, 5000].forEach(function (m) { var q = I.P(0, Db, zk(m)); K.pill(ctx, (m / 1000) + " km", q.x - 10, q.y + 4, { a: "right", s: 12, c: "#e8ecff", box: BX }); });
        var pb = I.P(Lb, Db * .5, zk(base)), pf = I.P(Lb, Db * .5, zk(frz)), yb = pb.y - 12, yf = pf.y + 22;
        if (Math.abs(yb - yf) < 24) { var mid = (yb + yf) / 2; yb = mid - 12; yf = mid + 12; if (base >= frz) { var tmp = yb; yb = yf; yf = tmp; } }
        K.pill(ctx, "구름 밑면 " + base + " m", pb.x + 14, yb, { s: 12, c: "#99e9f2", box: BX });
        K.pill(ctx, "0 ℃ 고도 " + frz + " m", pf.x + 14, yf, { s: 12, c: "#d0bfff", box: BX });
        K.pill(ctx, "앞면 색 = 올라가는 공기의 기온 · 흰 덩이 = 구름", 14, CH - 12, { s: 12, c: "#ffffff" });
        K.bigText(ctx, "구름 밑면 " + base + " m · 0 ℃ " + frz + " m", 14, 36, 20, ok1 && ok2 ? "#8ce99a" : "#ffffff");
        card(ctx, 650, W, CH, "착빙 고도", [["지표 기온 · 이슬점", T0 + " ℃ · " + TD + " ℃"], ["구름 밑면 (내 답)", base + " m", ok1 ? LT.green : LT.teal], ["0 ℃ 고도 (내 답)", frz + " m", ok2 ? LT.green : LT.violet], ["포화 전 · 구름 속", "10 · 5 ℃/km"]], ok1 && ok2 ? "✓ 이 위로 날면 착빙 위험" : (ok1 ? "구름 속 감률로 0 ℃ 찾기" : "125 × (기온 − 이슬점)"), ok1 && ok2 ? true : null);
        /* 카드 안 작은 기온–높이 그래프 */
        var g = K.chart(ctx, { x: 656, y: 164, w: 236, h: 226, pl: 44, pb: 30, pt: 10, x0: -10, x1: 25, y0: 0, y1: 5000, xt: 7, yt: 5, light: true, xl: "기온 (℃)", yf: function (v0) { return (v0 / 1000) + " km"; } });
        ctx.fillStyle = "rgba(134,142,150,.14)"; ctx.fillRect(g.L, g.Y(5000), g.R - g.L, g.Y(LCL) - g.Y(5000));
        K.line(ctx, { x: g.X(0), y: g.T }, { x: g.X(0), y: g.B }, LT.blue, 1.2, [4, 3]);
        var pts = []; for (var z = 0; z <= 5000; z += 50) pts.push([tp(z), z]);
        K.plot(ctx, g, pts, LT.orange, { light: true, w: 2.6 });
        K.line(ctx, { x: g.L, y: g.Y(base) }, { x: g.R, y: g.Y(base) }, LT.teal, 2);
        K.line(ctx, { x: g.L, y: g.Y(frz) }, { x: g.R, y: g.Y(frz) }, LT.violet, 2, [5, 3]);
      }
      cv.canvas._redraw = draw;
      api.slider({ label: "구름 밑면 높이", min: 0, max: 5000, step: 100, value: 2000, fmt: function (x) { return x + " m"; }, onInput: function (x) { base = x; draw(); } });
      api.slider({ label: "구름 속 0 ℃ 고도", min: 0, max: 5000, step: 100, value: 2000, fmt: function (x) { return x + " m"; }, onInput: function (x) { frz = x; draw(); } });
      api.info("포화되기 전에는 1 km마다 10 ℃, 구름이 생긴 뒤에는 수증기가 응결하며 숨은열을 내놓아 1 km마다 약 5 ℃ 씩만 내려갑니다.");
      draw();
      return {
        judge: function () {
          if (Math.abs(base - LCL) > 50) return { ok: false, msg: "구름 밑면 " + base + " m — 공기 덩이가 포화되는 높이와 다릅니다." };
          if (Math.abs(frz - FRZ) > 50) return { ok: false, msg: "구름 밑면은 맞았습니다. 0 ℃ 고도 " + frz + " m는 구름 속 감률로 다시 계산해 보세요." };
          return { ok: true, msg: "구름 밑면 " + LCL + " m(기온 10 ℃), 그 위로 1 km마다 5 ℃씩 내려가 " + FRZ + " m에서 0 ℃ — 이보다 높이 날면 착빙 위험이 있습니다." };
        }
      };
    },
    hints: [
      "상승 응결 고도 = 125 × (20 − 12) m. 그 높이까지는 건조 단열 감률로 식어요.",
      "구름 밑면에서 기온은 20 − 10 = 10 ℃. 거기서 1 km마다 5 ℃씩 내려가면 0 ℃는 몇 km 위일까요?"
    ],
    solution: "구름 밑면 <b>1000 m</b>, 0 ℃ 고도 <b>3000 m</b>.",
    why: "상승하는 공기는 주변 기압이 낮아져 팽창하며 식습니다(단열 팽창). 포화 전에는 <b>건조 단열 감률(약 10 ℃/km)</b>로 식다가, 이슬점에 이르면 구름이 생기고 응결열 때문에 <b>습윤 단열 감률(약 5 ℃/km)</b>로 더 천천히 식어요.<br>" +
      "구름 속 0 ℃보다 높은 곳에는 얼지 않은 과냉각 물방울이 많아 날개에 닿자마자 얼어붙습니다. 이 물방울과 빙정이 함께 있는 층에서 빙정이 자라 비나 눈이 되는 것이 <b>빙정설</b>입니다. 산을 넘어 내려온 공기가 건조 단열로 데워져 뜨겁고 건조해지는 것이 높새바람입니다."
  },

  /* ------------------------------------------------------------------ 3. 남반구의 지균풍 */
  {
    id: "c3", about: "04", tag: "지균풍 · 전향력", title: "남반구 항로의 제트 기류", short: "남반구 지균풍",
    who: "🧭", name: "국제선 항로 계획팀",
    say: "“서울 – 시드니 노선 조종사가 남반구 중위도(<b>남위 45°</b>) 상공의 바람을 물어요. 일기도를 보니 그 높이에서 기압이 <b>극 쪽이 낮고 적도 쪽이 높아</b>, 300 km마다 4 hPa씩 차이 납니다. 같은 모양의 북반구 일기도(북위 45°)와 비교해 바람의 방향과 세기를 알려 주세요.”",
    predict: {
      q: "남반구에서 전향력은 운동 방향의 어느 쪽으로 작용할까요?",
      options: ["㉠ 오른쪽 직각", "㉡ 왼쪽 직각", "㉢ 운동 방향과 반대"],
      answer: 1
    },
    task: "북반구와 남반구 중위도 상공의 <b>지균풍 방향</b>을 고르고, <b>풍속</b>을 정하세요(± 1.5 m/s).",
    build: function (stage, api) {
      var H = api.h, cv = api.canvas(320), ctx = cv.ctx, W = cv.W;
      var dn = "N", ds = "N", v = 40;
      var RHO = 0.7, OM = 7.292e-5, DP = 400, DN = 3e5;
      var F = 2 * OM * Math.sin(45 * Math.PI / 180), VG = DP / (RHO * F * DN);
      var DIR = { W: "서풍 (서 → 동)", E: "동풍 (동 → 서)", N: "북풍 (북 → 남)", S: "남풍 (남 → 북)" };
      var VEC = { W: [1, 0], E: [-1, 0], N: [0, 1], S: [0, -1] };
      /* 두 반구의 상공 일기도를 판 모형으로: 뒤쪽 = 북쪽 */
      function plate(I, hiTop, d, x0) {
        var L = I.L, D = I.D;
        I.box(ctx, 0, 0, 0, L, D, 8, "#f4f6fa", "#c5d3e6", "#aab9cf");
        onPlane(ctx, I, 8.2, function () {
          var g = ctx.createLinearGradient(0, 0, 0, D); g.addColorStop(0, hiTop ? "rgba(224,49,49,.18)" : "rgba(28,126,214,.2)"); g.addColorStop(1, hiTop ? "rgba(28,126,214,.2)" : "rgba(224,49,49,.18)");
          ctx.fillStyle = g; ctx.fillRect(0, 0, L, D);
          for (var i = 0; i < 4; i++) { ctx.strokeStyle = "rgba(40,60,110,.7)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(12, 22 + i * (D - 44) / 3); ctx.lineTo(L - 12, 22 + i * (D - 44) / 3); ctx.stroke(); }
        });
        var e = VEC[d], c = { x: L / 2, y: D / 2 }, a = I.P(c.x - e[0] * 70, c.y - e[1] * 60, 12), b = I.P(c.x + e[0] * 70, c.y + e[1] * 60, 12);
        ctx.save(); ctx.shadowColor = "#9775fa"; ctx.shadowBlur = 8; K.arrow(ctx, a, b, LT.violet, 5, 14); ctx.restore();
        var n0 = I.P(L - 20, 40, 10), n1 = I.P(L - 20, 6, 10); K.arrow(ctx, n0, n1, "#12203a", 2, 8); K.t(ctx, "북", n1.x + 6, n1.y, { s: 10.5, w: "900", c: "#12203a" });
        var tq = I.P(L / 2, 0, 8), bq = I.P(L / 2, D, 8);
        K.pill(ctx, hiTop ? "고기압 쪽 (적도)" : "저기압 쪽 (극)", tq.x + 10, tq.y - 6, { s: 10.5, c: hiTop ? "#ffc9c9" : "#a5d8ff", box: [x0, x0 + 310] });
        K.pill(ctx, hiTop ? "저기압 쪽 (극)" : "고기압 쪽 (적도)", bq.x - 10, bq.y + 20, { a: "right", s: 10.5, c: hiTop ? "#a5d8ff" : "#ffc9c9", box: [x0, x0 + 310] });
      }
      function draw() {
        var CH = cv.H, okN = dn === "W", okS = ds === "W", okV = Math.abs(v - VG) <= 1.5;
        ctx.clearRect(0, 0, W, CH);
        K.studio(ctx, 0, 0, 640, CH);
        plate(K.iso({ ox: 150, oy: 92, s: 0.64, L: 230, D: 190 }), false, dn, 0);
        plate(K.iso({ ox: 468, oy: 92, s: 0.64, L: 230, D: 190 }), true, ds, 320);
        K.t(ctx, "북반구 45°N · " + DIR[dn], 160, CH - 14, { s: 12, w: "900", a: "center", c: okN ? LT.green : LT.ink });
        K.t(ctx, "남반구 45°S · " + DIR[ds], 480, CH - 14, { s: 12, w: "900", a: "center", c: okS ? LT.green : LT.ink });
        K.bigText(ctx, "상공 일기도 · 등압선 간격 4 hPa", 14, 34, 18, "#ffffff");
        card(ctx, 650, W, CH, "남반구 항로", [["북반구 바람", dn === "W" ? "서풍 ✓" : DIR[dn].split(" ")[0], okN ? LT.green : LT.orange], ["남반구 바람", ds === "W" ? "서풍 ✓" : DIR[ds].split(" ")[0], okS ? LT.green : LT.orange], ["내가 정한 풍속", v + " m/s", okV ? LT.green : LT.blue], ["f = 2Ω sin 45°", "공기 0.7 kg/m³"]], okN && okS && okV ? "✓ 두 반구 모두 같은 편서풍" : "남반구는 저기압을 오른쪽에", okN && okS && okV ? true : null);
      }
      cv.canvas._redraw = draw;
      var opts = [{ v: "W", t: "서풍" }, { v: "E", t: "동풍" }, { v: "N", t: "북풍" }, { v: "S", t: "남풍" }];
      api.seg({ label: "북반구 (북쪽이 저기압)", value: "N", options: opts, onPick: function (x) { dn = x; draw(); } });
      api.seg({ label: "남반구 (남쪽이 저기압)", value: "N", options: opts, onPick: function (x) { ds = x; draw(); } });
      api.slider({ label: "지균풍 풍속", min: 0, max: 60, step: 1, value: 40, fmt: function (x) { return x + " m/s"; }, onInput: function (x) { v = x; draw(); } });
      api.info("지균풍은 기압 경도력(고 → 저)과 전향력이 평형을 이뤄 등압선과 나란히 붑니다. V = (기압 차) ÷ (밀도 × f × 거리).");
      draw();
      return {
        judge: function () {
          if (dn !== "W") return { ok: false, msg: "북반구: 저기압을 왼쪽에 두고 부는 방향을 다시 생각해 보세요." };
          if (ds !== "W") return { ok: false, msg: "남반구: 전향력이 왼쪽이면, 저기압은 바람의 어느 쪽에 있어야 할까요?" };
          if (Math.abs(v - VG) > 1.5) return { ok: false, msg: "방향은 모두 맞았습니다. 풍속 " + v + " m/s를 식으로 다시 계산해 보세요." };
          return { ok: true, msg: "두 반구 모두 서풍, 약 " + VG.toFixed(1) + " m/s — 기압 배치도 전향력도 거꾸로라 결국 같은 편서풍이 됩니다." };
        }
      };
    },
    hints: [
      "북반구 지균풍은 저기압을 왼쪽에, 남반구 지균풍은 저기압을 <b>오른쪽</b>에 두고 붑니다.",
      "f = 2 × 7.29 × 10⁻⁵ × sin 45° ≈ 1.03 × 10⁻⁴. V = 400 ÷ (0.7 × 1.03 × 10⁻⁴ × 3 × 10⁵)."
    ],
    solution: "북반구·남반구 모두 <b>서풍</b>, 풍속 <b>약 17~19 m/s</b>(계산값 약 18.5).",
    why: "지균풍은 기압 경도력과 전향력이 평형을 이룬 바람이라 등압선과 나란히 붑니다. 남반구는 전향력의 방향이 반대(왼쪽)지만, 중위도에서는 극 쪽이 저기압이라는 기압 배치도 똑같이 극 쪽을 향하므로 <b>두 반구 모두 편서풍</b>이 붑니다.<br>" +
      "이 편서풍이 상층에서 가장 강한 곳이 제트 기류이고, 남북으로 굽이치는 물결(행성파)이 지상 고기압·저기압을 키웁니다. 비행기가 서쪽에서 동쪽으로 갈 때 더 빨리 가는 까닭입니다."
  }
  ]
});
})();
