/* 지구시스템과학2 Ⅱ-1 해수의 운동 — 실제 자료
   r1 보스턴의 조석: 만조에서 다음 만조까지 몇 시간?
   r2 펜서콜라(멕시코만)는 왜 다를까: 하루 만조 횟수와 조차
   자료: data/tides.js (NOAA 조석·해류 자료 CO-OPS, 2024-01-15~17 매시 해수면, 공공 영역) */
(function () {
"use strict";
var T = (window.REAL_TIDES || { stations: {} }).stations;
var BOS = T["보스턴"] || [], PEN = T["펜서콜라"] || [];
function highs(a) { var h = []; for (var i = 1; i < a.length - 1; i++) if (a[i] > a[i - 1] && a[i] >= a[i + 1]) h.push(i); return h; }
var HB = highs(BOS), HP = highs(PEN);
var PER = HB.length > 1 ? (HB[HB.length - 1] - HB[0]) / (HB.length - 1) : 12.4;
function range(a) { return Math.max.apply(null, a) - Math.min.apply(null, a); }
var SRC = "<small>출처: 미국 해양대기청(NOAA) 조석·해류 자료(CO-OPS), 보스턴 8443970·펜서콜라 8729840 관측소의 매시 해수면 높이(평균 저저조면 기준 — 하루 두 간조 중 낮은 쪽의 평균 높이를 0으로 둔 것), 2024년 1월 15~17일(세계시). 사본은 data/tides.js.</small>";

function plot(H, ctx, W, CH, a, col, lo, hi, marks) {
  H.paper(ctx, W, CH);
  var x0 = 60, x1 = W - 30, y0 = 24, y1 = CH - 36;
  function X(h) { return x0 + h / (a.length - 1) * (x1 - x0); }
  function Y(v) { return y1 - (v - lo) / (hi - lo) * (y1 - y0); }
  H.axes(ctx, x0, y0, x1, y1);
  for (var d = 0; d <= 3; d++) { var xx = X(d * 24); if (d * 24 <= a.length - 1) { H.dash(ctx, xx, y0, xx, y1, H.v("--line"), 1); H.text(ctx, (15 + d) + "일 0시", xx, y1 + 15, { s: 10, a: "center", c: H.v("--mist") }); } }
  var step = (hi - lo) > 2 ? 1 : 0.2;
  for (var v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) H.text(ctx, v.toFixed(step < 1 ? 1 : 0) + " m", x0 - 8, Y(v) + 4, { s: 10, a: "right", c: H.v("--mist") });
  H.line(ctx, a.map(function (y, i) { return [X(i), Y(y)]; }), H.v(col), 2.5);
  (marks || []).forEach(function (i) { H.dot(ctx, X(i), Y(a[i]), 5, H.v("--coral-700")); });
  return { X: X, Y: Y };
}

window.sthLab({
  mount: "real", key: "real", result: "rReal", label: "실제 자료",
  doneNote: "정리하기 탭에서 실제 조석 자료로 밀물과 썰물을 설명해 보세요.",
  cases: [
  {
    id: "r1", sec: "04", tag: "실제 자료 · 조석 관측", title: "보스턴 항구의 만조 간격", short: "만조 간격",
    who: "⚓", name: "항만 관제소",
    say: "“미국 보스턴 항구의 조위계가 2024년 1월 15일부터 사흘 동안 <b>한 시간마다 잰 해수면 높이</b>입니다. 해수면이 가장 높아지는 <b>만조</b>를 찾아, 만조에서 다음 만조까지 <b>평균 몇 시간</b>인지 구해 주세요.”",
    predict: {
      q: "만조와 다음 만조 사이는 대략 얼마일까요?",
      options: ["㉠ 정확히 12 시간", "㉡ 약 12 시간 25 분", "㉢ 약 24 시간"],
      answer: 1
    },
    task: "첫 만조와 마지막 만조 사이 시간을 만조 간격 수로 나누어, <b>평균 만조 간격</b>을 슬라이더로 맞추세요(± 0.2 시간).",
    build: function (stage, api) {
      var H = api.h, cv = api.canvas(270), ctx = cv.ctx, W = cv.W, p = 11, mark = 0;
      function draw() {
        var g = plot(H, ctx, W, cv.H, BOS, "--brand", -0.5, 4, mark ? HB : []);
        if (mark) HB.forEach(function (i) { H.text(ctx, i + "시간째", g.X(i), g.Y(BOS[i]) - 9, { s: 10, w: "800", a: "center", c: H.v("--coral-700") }); });
        H.text(ctx, "내 답: 만조 간격 " + p.toFixed(1) + " 시간", 70, 40, { s: 13, w: "900", c: H.v("--ink") });
      }
      cv.canvas._redraw = draw;
      api.slider({ label: "평균 만조 간격", min: 10, max: 26, step: 0.1, value: 11, fmt: function (x) { return x.toFixed(1) + " 시간"; }, onInput: function (x) { p = x; api.changed(); draw(); } });
      api.button("만조 위치 표시", function () { mark = 1 - mark; draw(); });
      api.info("가로축 눈금은 하루(24 시간)마다입니다. " + SRC
        + "<div data-map='{\"id\":\"boston-tide\",\"name\":\"보스턴 조위 관측소\",\"lat\":42.355,\"lng\":-71.053,\"zoom\":16,\"ask\":\"부두가 바다와 어떻게 맞닿아 있나요? 하루에 두 번, 해수면이 평균 약 2.9 m(사리 때는 3 m 넘게) 오르내리는 곳입니다. 배를 대는 데 어떤 어려움이 있을지 적어 보세요.\"}'></div>"
        + "<div data-link='{\"id\":\"khoa-tide\",\"title\":\"국립해양조사원 스마트 조석예보 (교과서 연결 자료)\",\"src\":\"국립해양조사원 · 비상교육 지구시스템과학 78쪽\",\"url\":\"https://www.khoa.go.kr/\",\"ask\":\"첫 화면의 ‘스마트 조석예보’에서 우리 학교와 가까운 항구(예: 진해·부산)의 오늘 만조 시각 두 개를 찾아, 그 간격이 몇 시간 몇 분인지 적고 보스턴과 비교해 오세요.\"}'></div>");
      draw();
      return {
        judge: function () {
          if (Math.abs(p - PER) <= 0.2 + 1e-9) return { ok: true, msg: "만조 " + HB.length + "번: " + HB.join(", ") + " 시 → (" + HB[HB.length - 1] + " − " + HB[0] + ") ÷ " + (HB.length - 1) + " ≈ " + PER.toFixed(1) + " 시간." };
          return { ok: false, msg: p.toFixed(1) + " 시간은 " + (p < PER ? "짧습니다" : "깁니다") + ". 만조 위치를 표시해 첫 만조와 마지막 만조 사이를 세어 보세요." };
        }
      };
    },
    hints: ["‘만조 위치 표시’를 누르면 만조 시각이 나옵니다.", "(마지막 만조 시각 − 첫 만조 시각) ÷ (만조 수 − 1)"],
    solution: "약 <b>" + PER.toFixed(1) + " 시간</b> (약 12 시간 25 분).",
    why: "조석은 주로 달의 인력이 만드는 두 개의 해수면 부풀음 때문에 생깁니다. 지구가 한 바퀴 도는 동안 달도 공전 방향으로 조금 움직이므로, 같은 자리가 다시 달 쪽을 향하기까지 약 24 시간 50 분이 걸리고, 그동안 만조가 두 번 와서 간격이 약 12 시간 25 분이 됩니다. 그래서 만조 시각은 날마다 약 50 분씩 늦어집니다.<br>"
      + "실제 자료에서는 두 만조의 높이도 조금씩 다릅니다(일조 부등). 달의 궤도가 적도면과 기울어져 있기 때문이에요."
  },
  {
    id: "r2", sec: "04", tag: "실제 자료 · 조석의 종류", title: "멕시코만 펜서콜라는 왜 다를까", short: "일주조",
    who: "🏖️", name: "해양 연구원",
    say: "“같은 날, 멕시코만의 펜서콜라 관측소 자료예요. 보스턴과 모양이 전혀 다르죠? <b>하루에 만조가 몇 번</b> 오는지, 사흘 동안 가장 높은 때와 가장 낮은 때의 차이(<b>조차</b>)가 몇 m 인지 읽어 주세요.”",
    predict: {
      q: "조석의 모양은 어디서나 같을까요?",
      options: ["㉠ 달이 하나이니 어디서나 같다", "㉡ 바다의 모양과 크기에 따라 하루 한 번, 두 번, 섞인 모양이 나타난다", "㉢ 큰 바다에만 조석이 있고 만에는 없다"],
      answer: 1
    },
    task: "하루 만조 횟수를 고르고, <b>조차</b>를 슬라이더로 맞추세요(± 0.08 m).",
    build: function (stage, api) {
      var H = api.h, cv = api.canvas(270), ctx = cv.ctx, W = cv.W, n = "2", r = 1.5;
      function draw() {
        plot(H, ctx, W, cv.H, PEN, "--teal", -0.1, 0.7, []);
        H.text(ctx, "내 답: 하루 " + n + "번, 조차 " + r.toFixed(2) + " m   (보스턴의 조차 " + range(BOS).toFixed(1) + " m)", 70, 40, { s: 12.5, w: "900", c: H.v("--ink") });
      }
      cv.canvas._redraw = draw;
      api.seg({ label: "하루 만조 횟수", value: "2", options: [{ v: "1", t: "하루 1번" }, { v: "2", t: "하루 2번" }, { v: "4", t: "하루 4번" }], onPick: function (x) { n = x; api.changed(); draw(); } });
      api.slider({ label: "조차 (가장 높을 때 − 가장 낮을 때)", min: 0.1, max: 4, step: 0.02, value: 1.5, fmt: function (x) { return x.toFixed(2) + " m"; }, onInput: function (x) { r = x; api.changed(); draw(); } });
      api.info("세로축 눈금이 보스턴보다 훨씬 촘촘합니다. 눈금 숫자를 잘 읽으세요. 17일에는 달이 적도 위를 지나 오르내림이 거의 사라지니 15·16일을 보세요. " + SRC
        + "<div data-map='{\"id\":\"pensacola\",\"name\":\"펜서콜라 조위 관측소\",\"lat\":30.404,\"lng\":-87.211,\"zoom\":12,\"ask\":\"관측소가 큰 바다와 어떻게 이어져 있나요? 좁은 입구로 이어진 만인지, 탁 트인 바닷가인지 적어 보세요.\"}'></div>");
      draw();
      return {
        judge: function () {
          var R = range(PEN), big = HP.filter(function (i) { return PEN[i] > 0.3; }), per = big.length > 1 ? (big[big.length - 1] - big[0]) / (big.length - 1) : 24;
          if (n === "1" && Math.abs(r - R) <= 0.08) return { ok: true, msg: "만조 간격 약 " + per.toFixed(0) + " 시간 — 하루 한 번(일주조), 조차 " + R.toFixed(2) + " m입니다. 보스턴의 10분의 1 정도입니다." };
          if (n !== "1") return { ok: false, msg: "봉우리를 다시 세어 보세요. 하루(눈금 한 칸)에 몇 번 솟나요?" };
          return { ok: false, msg: "횟수는 맞았습니다. 조차 " + r.toFixed(2) + " m는 " + (r < R ? "작습니다" : "큽니다") + ". 세로 눈금을 다시 읽으세요." };
        }
      };
    },
    hints: ["눈금 한 칸이 하루입니다. 한 칸 안에 봉우리가 몇 개인가요?", "가장 높은 곳은 0.45 m 근처, 가장 낮은 곳은 0 m 근처입니다."],
    solution: "<b>하루 1번</b>(일주조), 조차 <b>약 " + range(PEN).toFixed(2) + " m</b>.",
    why: "달이 만드는 힘은 같아도, 실제 조석은 바다의 모양·크기·깊이에 따라 크게 달라집니다. 바닷물은 분지 안에서 저마다의 고유 주기로 출렁이는데, 멕시코만은 하루 두 번 오르내림에는 잘 반응하지 않고 하루 한 번 성분이 남아 <b>일주조</b>가 나타나고 조차도 작습니다. 보스턴처럼 대서양에 열린 곳은 하루 두 번의 <b>반일주조</b>가 크게 나타납니다.<br>"
      + "우리나라도 서해는 조차가 크고(인천 최대 9 m 안팎) 동해는 매우 작습니다(수십 cm). 같은 나라 안에서도 바다의 모양에 따라 조석이 이렇게 다릅니다."
  }
  ]
});
})();
