/* 지구시스템과학 Ⅱ-2 강수 과정과 대기의 운동 — 응용 실험실
   이야기에서 찾은 개념을 처음 보는 상황에 써 본다. 공용 엔진: ../assets/lab.js (sthLab) */
(function () {
"use strict";

window.sthLab({
  mount: "lab", key: "lab", result: "rLab",
  cases: [

  /* ------------------------------------------------------------------ 1. 선택적 흡수와 대기의 창 */
  {
    id: "c1", tag: "선택적 흡수 · 대기의 창", title: "기상 위성의 두 눈", short: "위성 채널",
    who: "🛰️", name: "기상 위성 설계팀",
    say: "“새 기상 위성에 적외선 채널을 두 개 달아요. <b>① 해수면 온도</b>를 재는 채널은 대기를 통과해 바다 표면에서 오는 빛을, <b>② 수증기</b> 채널은 대기 중 수증기가 내는 빛을 봐야 합니다. 각 채널의 파장을 정해 주세요.”",
    predict: {
      q: "지구 대기는 지표가 내는 적외선을 모든 파장에서 똑같이 흡수할까요?",
      options: ["㉠ 그렇다 — 모든 파장을 같게 흡수한다", "㉡ 아니다 — 기체마다 흡수하는 파장이 정해져 있어, 거의 흡수하지 않는 ‘창’이 있다", "㉢ 적외선은 전혀 흡수하지 않는다"],
      answer: 1
    },
    task: "① 채널은 <b>대기를 80% 이상 통과</b>하는 파장에, ② 채널은 <b>수증기가 강하게 흡수</b>하는 파장에 두세요.",
    build: function (stage, api) {
      var H = api.h, cv = api.canvas(320), ctx = cv.ctx, W = cv.W;
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
      var gx0 = 70, gx1 = 830, gy0 = 50, gy1 = 230;
      function GX(l) { return gx0 + (l - 4) / 16 * (gx1 - gx0); }
      function GY(t) { return gy1 - t * (gy1 - gy0); }
      function draw() {
        H.paper(ctx, W, cv.H);
        H.text(ctx, "적외선이 대기를 통과하는 비율 (파장 µm)", 40, 26, { s: 13.5, w: "900" });
        H.axes(ctx, gx0, gy0, gx1, gy1);
        for (var l = 4; l < 20; l += 0.1) H.box(ctx, GX(l), GY(trans(l)), GX(l + 0.1) - GX(l) + 0.4, gy1 - GY(trans(l)), H.v("--teal"), 0.55);
        [4, 6, 8, 10, 12, 14, 16, 18, 20].forEach(function (l) { H.text(ctx, l + "", GX(l), gy1 + 16, { s: 10, a: "center", c: H.v("--mist") }); });
        [["수증기", 6.5], ["오존", 9.65], ["이산화 탄소", 15], ["대기의 창", 11.2]].forEach(function (b) { H.text(ctx, b[0], GX(b[1]), gy0 - 6, { s: 10.5, w: "800", a: "center", c: H.v("--mist") }); });
        [[c1, "①", "--coral"], [c2, "②", "--violet"]].forEach(function (c) {
          H.line(ctx, [[GX(c[0]), gy0], [GX(c[0]), gy1]], H.v(c[2]), 3);
          H.text(ctx, c[1], GX(c[0]), gy1 + 34, { s: 14, w: "900", a: "center", c: H.v(c[2] + "-700") });
        });
        H.text(ctx, "① 해수면 온도: " + c1.toFixed(1) + " µm · 통과 " + Math.round(trans(c1) * 100) + "%" + (who(c1) ? " (" + who(c1) + " 흡수)" : ""), 60, 290, { s: 12.5, w: "800", c: trans(c1) >= 0.8 ? H.v("--green-700") : H.v("--rose-700") });
        H.text(ctx, "② 수증기: " + c2.toFixed(1) + " µm · 통과 " + Math.round(trans(c2) * 100) + "%" + (who(c2) ? " (" + who(c2) + " 흡수)" : ""), 480, 290, { s: 12.5, w: "800", c: who(c2) === "수증기" ? H.v("--green-700") : H.v("--rose-700") });
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
    id: "c2", tag: "단열 변화 · 상승 응결 고도", title: "비행기 날개의 얼음", short: "착빙 고도",
    who: "✈️", name: "경비행기 조종 교실",
    say: "“지상 기온 <b>20 ℃</b>, 이슬점 <b>12 ℃</b>인 공기가 산비탈을 따라 올라가 구름을 만들고 있어요. 구름 속에서 기온이 <b>0 ℃ 아래</b>로 내려가면 날개에 얼음이 붙어 위험합니다. 구름 밑면 높이와 구름 속 0 ℃ 고도를 알려 주세요.”",
    predict: {
      q: "공기 덩이가 상승하면 기온이 내려가는 까닭은?",
      options: ["㉠ 위로 갈수록 태양에서 멀어지기 때문이다", "㉡ 주변 기압이 낮아져 공기 덩이가 팽창하며 바깥에 일을 해 내부 에너지가 줄기 때문이다(단열 팽창)", "㉢ 주변 공기에 열을 빼앗기기 때문이다"],
      answer: 1
    },
    task: "<b>구름 밑면 높이</b>(상승 응결 고도)와 <b>구름 속 0 ℃ 고도</b>를 정하세요(각 ± 50 m).",
    build: function (stage, api) {
      var H = api.h, cv = api.canvas(340), ctx = cv.ctx, W = cv.W;
      var T0 = 20, TD = 12, base = 2000, frz = 2000;
      var LCL = 125 * (T0 - TD);
      function tp(z) { return z <= LCL ? T0 - 10 * z / 1000 : T0 - 10 * LCL / 1000 - 5 * (z - LCL) / 1000; }
      var FRZ = LCL + (T0 - 10 * LCL / 1000) / 5 * 1000;
      var gx0 = 90, gx1 = 480, gy0 = 40, gy1 = 310;
      function GX(t) { return gx0 + (t + 10) / 35 * (gx1 - gx0); }
      function GY(z) { return gy1 - z / 5000 * (gy1 - gy0); }
      function draw() {
        H.paper(ctx, W, cv.H);
        H.text(ctx, "상승하는 공기 덩이의 기온", 40, 26, { s: 13.5, w: "900" });
        H.axes(ctx, gx0, gy0, gx1, gy1);
        [-10, 0, 10, 20].forEach(function (t) { H.text(ctx, t + " ℃", GX(t), gy1 + 16, { s: 10, a: "center", c: H.v("--mist") }); });
        [0, 1000, 2000, 3000, 4000, 5000].forEach(function (z) { H.text(ctx, z + " m", gx0 - 6, GY(z) + 4, { s: 10, a: "right", c: H.v("--mist") }); });
        H.dash(ctx, GX(0), gy0, GX(0), gy1, H.v("--brand"));
        var pts = []; for (var z = 0; z <= 5000; z += 50) pts.push([GX(tp(z)), GY(z)]);
        H.line(ctx, pts, H.v("--coral"), 3);
        H.box(ctx, gx0, GY(5000), gx1 - gx0, GY(LCL) - GY(5000), H.v("--mist"), 0.12);
        [[base, "구름 밑면 (내 답)", "--teal-700"], [frz, "0 ℃ 고도 (내 답)", "--violet-700"]].forEach(function (m) {
          H.line(ctx, [[gx0, GY(m[0])], [gx1, GY(m[0])]], H.v(m[2]), 2);
          H.text(ctx, m[1] + " " + m[0] + " m", gx1 + 8, GY(m[0]) + 4, { s: 11.5, w: "800", c: H.v(m[2]) });
        });
        H.text(ctx, "건조 단열 감률 10 ℃/km (포화 전)", 560, 250, { s: 11.5, c: H.v("--mist") });
        H.text(ctx, "습윤 단열 감률 5 ℃/km (구름 속)", 560, 272, { s: 11.5, c: H.v("--mist") });
        H.text(ctx, "상승 응결 고도 ≈ 125 × (기온 − 이슬점) m", 560, 294, { s: 11.5, c: H.v("--mist") });
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
    id: "c3", tag: "지균풍 · 전향력", title: "남반구 항로의 제트 기류", short: "남반구 지균풍",
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
      function panel(x, title, hiTop, d) {
        H.text(ctx, title, x + 150, 50, { s: 12.5, w: "900", a: "center" });
        H.box(ctx, x, 60, 300, 200, H.v("--card-2"), 1);
        for (var i = 0; i < 4; i++) H.line(ctx, [[x + 10, 80 + i * 55], [x + 290, 80 + i * 55]], H.v("--line"), 1.5);
        H.text(ctx, hiTop ? "고기압 쪽 (적도)" : "저기압 쪽 (극)", x + 150, 74, { s: 11, w: "800", a: "center", c: hiTop ? H.v("--coral-700") : H.v("--brand-700") });
        H.text(ctx, hiTop ? "저기압 쪽 (극)" : "고기압 쪽 (적도)", x + 150, 254, { s: 11, w: "800", a: "center", c: hiTop ? H.v("--brand-700") : H.v("--coral-700") });
        H.text(ctx, "↑ 북", x + 280, 100, { s: 10.5, a: "right", c: H.v("--mist") });
        var c = [x + 150, 160], e = VEC[d];
        H.arrow(ctx, c[0] - e[0] * 60, c[1] - e[1] * 40, c[0] + e[0] * 60, c[1] + e[1] * 40, H.v("--violet"), 4, 12);
        H.text(ctx, DIR[d], x + 150, 290, { s: 12, w: "800", a: "center", c: H.v("--violet-700") });
      }
      function draw() {
        H.paper(ctx, W, cv.H);
        H.text(ctx, "상공 일기도 (등압선 간격 4 hPa)", 40, 26, { s: 13.5, w: "900" });
        panel(40, "북반구 45°N", false, dn);
        panel(380, "남반구 45°S", true, ds);
        H.rows(ctx, 720, 80, [["내가 정한 풍속", v + " m/s", Math.abs(v - VG) <= 1.5 ? "--green-700" : null, true]], 60);
        H.text(ctx, "f = 2Ω sin 45°", 720, 170, { s: 11, c: H.v("--mist") });
        H.text(ctx, "공기 밀도 0.7 kg/m³", 720, 190, { s: 11, c: H.v("--mist") });
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
