/* 지구시스템과학 Ⅱ-1 해수의 운동 — 응용 실험실
   이야기에서 찾은 개념을 처음 보는 상황에 써 본다. 공용 엔진: ../assets/lab.js (sthLab) */
(function () {
"use strict";

window.sthLab({
  mount: "lab", key: "lab", result: "rLab",
  cases: [

  /* ------------------------------------------------------------------ 1. 에크만 수렴과 쓰레기 섬 */
  {
    id: "c1", tag: "에크만 수송 · 수렴", title: "태평양 쓰레기 섬의 자리", short: "쓰레기 섬",
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
      function Y(lat) { return 300 - lat / 60 * 260; }
      function draw() {
        H.paper(ctx, W, cv.H);
        H.text(ctx, "북태평양을 남북으로 본 모습", 40, 26, { s: 13.5, w: "900" });
        H.box(ctx, 120, Y(60), 360, Y(0) - Y(60), H.v("--brand"), 0.15);
        [0, 15, 30, 45, 60].forEach(function (l) { H.text(ctx, l + "°N", 112, Y(l) + 4, { s: 10.5, a: "right", c: H.v("--mist") }); });
        [[45, w45], [15, w15]].forEach(function (b) {
          var y = Y(b[0]), e = b[1] === "W";
          H.arrow(ctx, e ? 200 : 400, y, e ? 400 : 200, y, H.v("--ink"), 3, 12);
          H.text(ctx, e ? "서풍 (편서풍 방향)" : "동풍 (무역풍 방향)", 300, y - 10, { s: 11.5, w: "800", a: "center" });
          var d = ek(b[1]);
          H.arrow(ctx, 440, y, 440, y - d * 40, H.v("--teal-700"), 3, 10);
          H.text(ctx, "에크만 수송", 450, y - d * 20 + 4, { s: 10.5, c: H.v("--teal-700") });
        });
        if (conv()) { H.box(ctx, 120, Y(38), 360, Y(22) - Y(38), H.v("--amber"), 0.25); H.text(ctx, "표층수가 모인다 (수렴)", 300, Y(30) + 4, { s: 12, w: "900", a: "center", c: H.v("--amber-700") }); }
        H.text(ctx, "🧴", 140, Y(mark) + 6, { s: 18, a: "center" });
        H.line(ctx, [[120, Y(mark)], [480, Y(mark)]], H.v("--rose"), 1.5);
        H.text(ctx, "쓰레기 섬 표지 " + mark + "°N", 520, Y(mark) + 4, { s: 12, w: "800", c: H.v("--rose-700") });
        H.text(ctx, conv() ? "두 바람이 표층수를 가운데로 모읍니다." : "지금 바람으로는 표층수가 모이지 않습니다.", 520, mark >= 30 ? 290 : 60, { s: 12, w: "800", c: conv() ? H.v("--green-700") : H.v("--mist") });
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
    id: "c2", tag: "천해파 · 천수 효과", title: "파도가 부서지는 자리", short: "쇄파 수심",
    who: "🏄", name: "서핑 대회 안전 본부",
    say: "“먼바다에서 온 너울이 수심 10 m에서 파고 <b>1.2 m</b>로 들어오고 있어요. 해안으로 다가오면 파고가 점점 높아지다가 <b>파고가 수심의 0.78배</b>를 넘는 곳에서 부서집니다. 안전 요원을 파도가 부서지는 수심에 배치하려 해요.”",
    predict: {
      q: "너울이 해안의 얕은 곳으로 들어오면 파도는 어떻게 변할까요?",
      options: ["㉠ 속도가 느려지고 파장이 짧아지며 파고가 높아진다", "㉡ 속도가 빨라지고 파고가 낮아진다", "㉢ 아무 변화 없이 해안에 닿는다"],
      answer: 0
    },
    task: "수심 표지를 옮겨 <b>파도가 처음 부서지는 수심</b>을 찾으세요(± 0.1 m).",
    build: function (stage, api) {
      var H = api.h, cv = api.canvas(320), ctx = cv.ctx, W = cv.W;
      var d = 6, H0 = 1.2, D0 = 10, G = 9.8;
      function hgt(x) { return H0 * Math.pow(D0 / x, 0.25); }
      var DB = Math.pow(H0 * Math.pow(D0, 0.25) / 0.78, 1 / 1.25);
      function draw() {
        H.paper(ctx, W, cv.H);
        H.text(ctx, "해안으로 다가오는 파도의 단면", 40, 26, { s: 13.5, w: "900" });
        var x0 = 60, x1 = 820, sy = 120;
        function X(dep) { return x1 - dep / 10 * (x1 - x0); }
        function Yb(dep) { return sy + dep * 16; }
        ctx.fillStyle = "#d9c79c"; ctx.beginPath(); ctx.moveTo(x0, Yb(10)); ctx.lineTo(x1, sy); ctx.lineTo(x1, 300); ctx.lineTo(x0, 300); ctx.closePath(); ctx.fill();
        var pts = [];
        for (var xx = x0; xx <= X(Math.max(DB, 0.3)); xx += 3) {
          var dep = (x1 - xx) / (x1 - x0) * 10, h = hgt(Math.max(dep, 0.3));
          var k = 2 * Math.PI / (20 + dep * 9);
          pts.push([xx, sy - h * 12 * Math.cos(k * (xx - x0))]);
        }
        H.line(ctx, pts, H.v("--brand"), 2.5);
        H.text(ctx, "💥", X(DB), sy - 26, { s: 18, a: "center" });
        H.line(ctx, [[X(d), sy - 60], [X(d), Yb(d)]], H.v("--rose"), 2);
        H.text(ctx, "안전 요원 🚩 수심 " + d.toFixed(2) + " m", H.clamp(X(d), 140, 760), sy - 66, { s: 11.5, w: "800", a: "center", c: H.v("--rose-700") });
        var h = hgt(d);
        H.rows(ctx, 60, 230, [
          ["이 수심의 파고", h.toFixed(2) + " m"],
          ["파고 ÷ 수심", (h / d).toFixed(2), h / d >= 0.78 ? "--rose-700" : "--green-700"]
        ], 50);
        H.rows(ctx, 330, 230, [
          ["천해파 속도 √(g × 수심)", Math.sqrt(G * d).toFixed(1) + " m/s"],
          ["상태", h / d >= 0.78 ? "이미 부서진 뒤" : "아직 부서지지 않음"]
        ], 50);
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
    why: "수심이 파장의 절반보다 얕아지면 파도는 바닥의 영향을 받는 <b>천해파</b>가 되어 속도가 √(gh)로 수심에 따라 느려집니다. 앞쪽 파가 먼저 느려지니 뒤쪽 파가 따라붙어 파장이 짧아지고 파고가 높아지지요(천수 효과).<br>" +
      "결국 파고가 수심에 비해 너무 커지면 마루가 앞으로 쏟아져 부서집니다(쇄파). 지진 해일이 해안에 닿으며 갑자기 높아지는 것도 같은 원리입니다. ※ 파고 변화 식은 수업용 모형입니다."
  },

  /* ------------------------------------------------------------------ 3. 기조력 — 거리의 세제곱 */
  {
    id: "c3", tag: "기조력 · 사리와 조금", title: "바닷길이 열리는 날", short: "슈퍼문 사리",
    who: "🌕", name: "바닷길 축제 위원회",
    say: "“섬까지 바닷길이 완전히 드러나려면 조차가 <b>7 m 이상</b>이어야 해요. 평균 거리의 달일 때 사리의 조차는 약 6.6 m로 조금 모자랍니다. 달이 지구에 가까워지는 <b>근지점</b>과 사리가 겹치는 날을 골라야겠어요. 달은 평균 거리의 <b>0.945배</b>보다 가까이 오지 않습니다.”",
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
        H.paper(ctx, W, cv.H);
        H.text(ctx, "태양 · 지구 · 달의 배치", 40, 26, { s: 13.5, w: "900" });
        H.text(ctx, "☀️", 60, 155, { s: 30 });
        var ex = 260, ey = 145;
        H.dot(ctx, ex, ey, 18, H.v("--brand")); H.text(ctx, "지구", ex, ey + 36, { s: 11, w: "800", a: "center" });
        var r = 90 * dn, mx = ph === "spring" ? ex + r : ex, my = ph === "spring" ? ey : ey - r;
        H.dot(ctx, mx, my, 9, H.v("--mist")); H.text(ctx, ph === "spring" ? "달 (망)" : "달 (상현)", mx + 14, my + 4, { s: 11, w: "800" });
        ctx.save(); ctx.strokeStyle = H.v("--line"); ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.arc(ex, ey, 90, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
        var R = range();
        H.rows(ctx, 470, 60, [
          ["위상", ph === "spring" ? "사리 (태양·달이 한 줄)" : "조금 (태양·달이 직각)"],
          ["달의 거리 (평균 = 1)", dn.toFixed(3) + (dn < 0.945 - 1e-9 ? " — 이렇게 가까이 오지 않음" : "")],
          ["달의 기조력 (평균 = 1)", Math.pow(1 / dn, 3).toFixed(2) + " 배"],
          ["조차", R.toFixed(2) + " m", R >= 7 ? "--green-700" : "--rose-700", true]
        ], 54);
      }
      cv.canvas._redraw = draw;
      api.seg({ label: "달의 위상", value: "neap", options: [{ v: "spring", t: "사리 (삭 · 망)" }, { v: "neap", t: "조금 (상현 · 하현)" }], onPick: function (x) { ph = x; draw(); } });
      api.slider({ label: "지구와 달의 거리 (평균 = 1)", min: 0.9, max: 1.1, step: 0.005, value: 1.0, fmt: function (x) { return x.toFixed(3); }, onInput: function (x) { dn = x; draw(); } });
      api.info("이 모형에서 조차 = 4.5 m × (달의 기조력 ± 태양의 기조력 0.46). 사리 때는 더하고 조금 때는 뺍니다.");
      draw();
      return {
        judge: function () {
          var R = range();
          if (dn < 0.945 - 1e-9) return { ok: false, msg: "달은 평균 거리의 0.945배보다 가까이 오지 않습니다." };
          if (R >= 7) return { ok: true, msg: "사리 · 거리 " + dn.toFixed(3) + " → 조차 " + R.toFixed(2) + " m. 근지점 무렵의 사리(슈퍼문)에 바닷길이 활짝 열립니다." };
          return { ok: false, msg: "조차 " + R.toFixed(2) + " m — 7 m에 모자랍니다." };
        }
      };
    },
    hints: [
      "태양과 달이 한 줄로 서는 사리 때 두 기조력이 더해집니다. 먼저 위상을 정하세요.",
      "기조력은 거리의 세제곱에 반비례합니다. 거리가 4% 줄면 기조력은 약 12% 커집니다."
    ],
    solution: "<b>사리</b>, 달의 거리 <b>0.945~0.970</b>.",
    why: "기조력은 천체의 질량에 비례하고 <b>거리의 세제곱에 반비례</b>합니다. 태양은 무겁지만 달보다 약 390배 멀어, 기조력은 달의 절반쯤입니다. 삭·망 때는 두 기조력이 한 방향으로 더해져 조차가 큰 <b>사리</b>, 상현·하현 때는 서로 직각이라 조차가 작은 <b>조금</b>이 됩니다.<br>" +
      "달의 궤도는 타원이라 근지점(평균 거리의 약 0.945배)에서 기조력이 약 18% 커집니다. 진도·무창포의 바닷길이 특히 크게 열리는 날은 근지점과 사리가 겹치는 날입니다. ※ 조차 식은 수업용 모형입니다."
  }
  ]
});
})();
