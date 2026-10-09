/* 지구시스템과학2 Ⅱ-2 강수 과정과 대기의 운동 — 실제 자료
   r1 우리 동네 구름 밑면의 높이 — 기온과 이슬점으로 상승 응결 고도 구하기(2024년 하루 단위)
   r2 기압은 높이 올라가면 얼마나 줄까 — 부산과 티베트 고원(라싸)의 실제 지표 기압
   자료: data/power-ungcheon-daily.js, data/power-pressure.js (NASA POWER) */
(function () {
"use strict";
var D = (window.REAL_POWER_DAILY || { rows: [] }).rows;          /* [YYYYMMDD, 기온, 이슬점] */
var PS = (window.REAL_POWER_PS || { points: [] }).points;
function mon(m) { var t = 0, d = 0, n = 0; D.forEach(function (r) { if (+r[0].slice(4, 6) === m) { t += r[1]; d += r[2]; n++; } }); return n ? { t: t / n, d: d / n, n: n } : { t: 0, d: 0, n: 0 }; }
var M = []; for (var m = 1; m <= 12; m++) M[m] = mon(m);
function lcl(x) { return 125 * (x.t - x.d); }
var LOW = 1; for (m = 2; m <= 12; m++) if (lcl(M[m]) < lcl(M[LOW])) LOW = m;
var A = PS[0] || { name: "부산", elev: 70, ps: 100.76 }, B = PS[1] || { name: "라싸", elev: 4317, ps: 60.12 };
var HSC = (B.elev - A.elev) / Math.log(A.ps / B.ps), HALF = HSC * Math.LN2 / 1000;          /* 척도 높이, 기압 절반 높이(km) */
var SRC1 = "<small>출처: NASA 랭글리 연구소 POWER 프로젝트 일별 자료(2024년), 창원 웅천 부근(북위 35.13°, 동경 128.70°)의 지상 2 m 기온(T2M)과 이슬점(T2MDEW). 사본은 data/power-ungcheon-daily.js.</small>";
var SRC2 = "<small>출처: NASA POWER 기후값(2001~2020, MERRA-2 재분석)의 지표 기압(PS) — 부산 격자(해발 " + A.elev + " m) " + A.ps + " kPa, 라싸 격자(해발 " + B.elev + " m) " + B.ps + " kPa. 라싸 격자는 고원 평균 높이라 실제 라싸 시내(약 3,650 m, 약 65 kPa)보다 약 670 m 높습니다. 사본은 data/power-pressure.js.</small>";

window.sthLab({
  mount: "real", key: "real", result: "rReal", label: "실제 자료",
  doneNote: "정리하기 탭에서 실제 자료로 구름이 생기는 높이와 기압의 연직 분포를 설명해 보세요.",
  cases: [
  {
    id: "r1", tag: "실제 자료 · 상승 응결 고도", title: "우리 동네 구름 밑면은 얼마나 높을까", short: "구름 밑면",
    who: "☁️", name: "학교 기상 관측반",
    say: "“구름이 생기기 전의(불포화) 공기가 올라가면 100 m에 약 1 °C씩 식고, 이슬점은 100 m에 약 0.2 °C씩 내려가요. 그래서 기온과 이슬점의 차이가 1 °C 일 때마다 약 <b>125 m</b> 올라가면 둘이 만나 구름이 생깁니다(상승 응결 고도 ≈ 125 × (기온 − 이슬점) m). 아래는 우리 학교 근처의 2024년 <b>하루하루 실제 기온과 이슬점</b>이에요. 구름 밑면이 <b>가장 낮은 달</b>을 찾고, 그 달의 평균 높이를 구해 주세요.”",
    predict: {
      q: "구름 밑면이 가장 낮아지는(구름이 낮게 깔리는) 때는 언제일까요?",
      options: ["㉠ 공기가 건조한 한겨울", "㉡ 공기가 습한 한여름 장마철", "㉢ 계절과 관계없이 늘 같다"],
      answer: 1
    },
    task: "달을 골라 그 달 평균 기온과 이슬점을 읽고, <b>구름 밑면이 가장 낮은 달</b>과 <b>그 달의 평균 상승 응결 고도</b>(± 30 m)를 맞추세요.",
    build: function (stage, api) {
      var H = api.h, cv = api.canvas(280), ctx = cv.ctx, W = cv.W, k = 1, est = 500;
      var x0 = 60, x1 = 640, y0 = 24, y1 = 244;
      function X(i) { return x0 + i / (D.length - 1) * (x1 - x0); }
      function Y(t) { return y1 - (t + 15) / 50 * (y1 - y0); }
      function draw() {
        H.paper(ctx, W, cv.H); H.axes(ctx, x0, y0, x1, y1);
        [-10, 0, 10, 20, 30].forEach(function (t) { H.text(ctx, t + "°C", x0 - 6, Y(t) + 4, { s: 10, a: "right", c: H.v("--mist") }); });
        var a = -1, b = -1;
        D.forEach(function (r, i) { if (+r[0].slice(4, 6) === k) { if (a < 0) a = i; b = i; } });
        if (a >= 0) { ctx.fillStyle = "rgba(255,190,60,.18)"; ctx.fillRect(X(a), y0, X(b) - X(a), y1 - y0); }
        H.line(ctx, D.map(function (r, i) { return [X(i), Y(r[1])]; }), H.v("--coral-700"), 1.4);
        H.line(ctx, D.map(function (r, i) { return [X(i), Y(r[2])]; }), H.v("--brand"), 1.4);
        for (var mm = 1; mm <= 12; mm += 1) { var first = -1; D.forEach(function (r, i) { if (first < 0 && +r[0].slice(4, 6) === mm) first = i; }); if (first >= 0) H.text(ctx, mm + "월", X(first) + 12, y1 + 15, { s: 9.5, a: "center", c: mm === k ? H.v("--amber-700") : H.v("--mist") }); }
        H.text(ctx, "빨강 = 기온, 파랑 = 이슬점", x0 + 8, y0 + 4, { s: 11, w: "800", c: H.v("--mist") });
        H.rows(ctx, 680, 40, [["고른 달", k + "월 (" + M[k].n + "일)", "--amber-700"], ["평균 기온", M[k].t.toFixed(2) + " °C"], ["평균 이슬점", M[k].d.toFixed(2) + " °C"], ["기온 − 이슬점", (M[k].t - M[k].d).toFixed(2) + " °C"], ["내 답 (평균 구름 밑면)", est + " m", null, true]], 52);
      }
      cv.canvas._redraw = draw;
      api.slider({ label: "달", min: 1, max: 12, step: 1, value: 1, fmt: function (x) { return x + "월"; }, onInput: function (x) { k = x; api.changed(); draw(); } });
      api.slider({ label: "그 달의 평균 상승 응결 고도", min: 0, max: 1200, step: 5, value: 500, fmt: function (x) { return x + " m"; }, onInput: function (x) { est = x; api.changed(); draw(); } });
      api.info("기온과 이슬점의 간격이 좁을수록 공기가 습하고, 조금만 올라가도 구름이 됩니다. " + SRC1);
      draw();
      return {
        judge: function () {
          var t = lcl(M[k]);
          if (k !== LOW) return { ok: false, msg: k + "월의 평균 구름 밑면은 약 " + Math.round(t) + " m입니다. 기온과 이슬점이 더 가까운 달이 있습니다." };
          if (Math.abs(est - t) > 30) return { ok: false, msg: "달은 맞았습니다. 125 × (" + M[k].t.toFixed(2) + " − " + M[k].d.toFixed(2) + ")을 계산해 보세요." };
          return { ok: true, msg: LOW + "월: 125 × (" + M[LOW].t.toFixed(2) + " − " + M[LOW].d.toFixed(2) + ") ≈ " + Math.round(t) + " m. 장마철에는 구름이 산허리에 걸릴 만큼 낮게 생깁니다." };
        }
      };
    },
    hints: ["빨강과 파랑 선이 가장 붙어 있는 때를 찾으세요.", "오른쪽 판의 ‘기온 − 이슬점’에 125를 곱하세요."],
    solution: "<b>" + LOW + "월</b>, 125 × (" + M[LOW].t.toFixed(2) + " − " + M[LOW].d.toFixed(2) + ") ≈ <b>" + Math.round(lcl(M[LOW])) + " m</b>.",
    why: "공기 덩어리가 올라가면 건조 단열 감률(약 10 °C/km)로 식고, 이슬점은 약 2 °C/km로 천천히 내려가 둘의 차이가 1 km에 8 °C씩 줄어듭니다. 그래서 상승 응결 고도는 약 125 × (기온 − 이슬점) m입니다. 습한 장마철(7월)에는 기온과 이슬점이 거의 붙어 구름 밑면이 200 m 아래로 내려가고, 다른 달은 대체로 350~550 m입니다.<br>"
      + "구름이 생긴 뒤에는 수증기가 응결하며 숨은열을 내놓아, 공기는 습윤 단열 감률(약 5 °C/km)로 더 천천히 식으며 계속 올라갈 수 있습니다. ※ 이 식은 지표 공기가 그대로 올라간다고 단순화한 값이고, 바다가 섞인 넓은 격자(약 50 km)의 하루 평균값이라 한낮의 실제 구름 밑면보다 낮게 나옵니다."
  },
  {
    id: "r2", tag: "실제 자료 · 기압의 연직 분포", title: "기압이 절반이 되는 높이", short: "기압 절반",
    who: "🎈", name: "고산 원정대",
    say: "“해발 " + A.elev + " m 부산의 평균 지표 기압은 <b>" + A.ps + " kPa</b>, 라싸 부근 티베트 고원 격자(평균 해발 " + B.elev + " m)는 <b>" + B.ps + " kPa</b> 입니다(NASA 기후값). 기압이 높이에 따라 어떤 모양으로 줄어드는지 두 값으로 알아봅시다. 두 값으로 <b>기압이 해수면의 절반이 되는 높이</b>를 구해 주세요.”",
    predict: {
      q: "높이 올라갈수록 기압은 어떻게 줄어들까요?",
      options: ["㉠ 1 km마다 같은 양(kPa)씩 줄어 언젠가 0이 된다", "㉡ 같은 높이를 오를 때마다 같은 비율로 줄어, 높은 곳일수록 1 km마다 줄어드는 양(kPa)이 작다", "㉢ 10 km 까지는 거의 그대로다"],
      answer: 1
    },
    task: "기압이 절반이 되는 높이를 슬라이더로 맞추세요(± 0.4 km). 그래프의 곡선이 두 점을 지나게 하면 됩니다.",
    build: function (stage, api) {
      var H = api.h, cv = api.canvas(290), ctx = cv.ctx, W = cv.W, hk = 3;
      var x0 = 70, x1 = 620, y0 = 24, y1 = 250;
      function X(p) { return x0 + p / 110 * (x1 - x0); }
      function Y(z) { return y1 - z / 12 * (y1 - y0); }
      function draw() {
        H.paper(ctx, W, cv.H); H.axes(ctx, x0, y0, x1, y1);
        [0, 3, 6, 9, 12].forEach(function (z) { H.text(ctx, z + " km", x0 - 8, Y(z) + 4, { s: 10, a: "right", c: H.v("--mist") }); });
        [0, 25, 50, 75, 100].forEach(function (p) { H.text(ctx, p + " kPa", X(p), y1 + 15, { s: 10, a: "center", c: H.v("--mist") }); });
        var p0 = A.ps * Math.exp(A.elev / 1000 * Math.LN2 / hk), pts = [];
        for (var z = 0; z <= 12; z += 0.1) pts.push([X(p0 * Math.pow(0.5, z / hk)), Y(z)]);
        H.line(ctx, pts, H.v("--amber-700"), 2.5);
        H.dash(ctx, X(p0 / 2), y0, X(p0 / 2), y1, H.v("--line"), 1);
        [A, B].forEach(function (s) { H.dot(ctx, X(s.ps), Y(s.elev / 1000), 7, H.v("--brand")); H.text(ctx, s.name + " " + s.ps + " kPa", X(s.ps) + 10, Y(s.elev / 1000) + 4, { s: 11, w: "800", c: H.v("--brand-700") }); });
        H.rows(ctx, 660, 50, [["내 답 (절반 높이)", hk.toFixed(1) + " km", null, true], ["이 곡선의 해수면 기압", p0.toFixed(1) + " kPa"]], 62);
      }
      cv.canvas._redraw = draw;
      api.slider({ label: "기압이 절반이 되는 높이", min: 2, max: 10, step: 0.1, value: 3, fmt: function (x) { return x.toFixed(1) + " km"; }, onInput: function (x) { hk = x; api.changed(); draw(); } });
      api.info("곡선은 ‘절반 높이’마다 기압이 반으로 주는 모양입니다. 파란 두 점을 모두 지나게 해 보세요. " + SRC2
        + "<div data-map='{\"id\":\"lhasa\",\"name\":\"티베트 고원 라싸 일대\",\"lat\":29.65,\"lng\":91.13,\"zoom\":9,\"ask\":\"이 높은 고원에 무엇이 보이나요? 기압이 해수면의 3분의 2 쯤(라싸 시내 약 65 kPa)인 곳에서 사람들의 생활은 어떻게 다를지 한 가지 적어 보세요.\"}'></div>");
      draw();
      return {
        judge: function () {
          if (Math.abs(hk - HALF) <= 0.4) return { ok: true, msg: "두 점에 맞는 절반 높이는 약 " + HALF.toFixed(1) + " km — 에베레스트(8.8 km) 꼭대기는 해수면 기압의 3분의 1 쯤입니다." };
          return { ok: false, msg: hk.toFixed(1) + " km 로는 곡선이 라싸 점보다 " + (hk < HALF ? "왼쪽(기압이 너무 낮은 쪽)" : "오른쪽(기압이 너무 높은 쪽)") + "을 지납니다." };
        }
      };
    },
    hints: ["라싸 점이 곡선 위에 오도록 슬라이더를 움직이세요.", "60.12 ÷ 100.76 ≈ 0.6. 0.6은 절반(0.5)보다 조금 큽니다 — 약 4.2 km를 오르는 동안 절반까지는 다 못 줄었어요."],
    solution: "약 <b>" + HALF.toFixed(1) + " km</b> (" + (Math.ceil((HALF - 0.4) * 10) / 10).toFixed(1) + " ~ " + (Math.floor((HALF + 0.4) * 10) / 10).toFixed(1) + ").",
    why: "공기는 위의 공기 무게에 눌려 아래로 갈수록 빽빽하고, 그 무게를 받치는 것이 기압입니다(정역학적 균형). 높이 올라갈수록 위에 남은 공기가 적어지면서 공기 자체도 묽어지므로, 기압은 같은 높이마다 같은 비율로 줄어듭니다. 약 5.5~6 km 오를 때마다 절반이 되어, 대기 질량의 절반은 지상 약 5.5 km 아래에 있습니다.<br>"
      + "공기가 따뜻하면 덜 빽빽해 기압이 천천히 줄고, 차가우면 빨리 줄어듭니다. 그래서 같은 높이라도 기온에 따라 기압이 달라지고, 이 차이가 상층의 바람(지균풍)을 만듭니다."
  }
  ]
});
})();
