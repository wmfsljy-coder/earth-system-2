/* 형성평가 (formative.js) — 소단원 하나를 10분 안팎으로 확인하는 문항 화면
   정본: integrated-science-2/assets (sync_assets.js 의 OPTIONAL — 이 파일이 있는 저장소에만 복사된다).
   쓰는 법 (<단원>/form-0N.html)
     <script>window.FORMATIVE = { subject, unit, part, std: [코드], board: "board-0N.html", sheet: "sheet-0N.html", time: "10분",
       items: [
         { lv: "기본|발전|심화", type: "mc",    q: "물음", box: "보기 상자(선택)", fig: "<svg…>(선택)", opts: ["…"], a: 0, why: "해설", ref: 칠판 장면 번호 },
         { lv, type: "short", q, a: ["정답", "다르게 써도 맞는 답"], unit: "단위(선택)", why, ref },
         { lv, type: "essay", q, model: "예시 답안", rubric: ["채점 기준 1", "…"], ref } ] };</script>
     <script src="../assets/formative.js"></script>
   주소: (기본) 학생이 풀고 채점하기 → 바로 결과·해설·다시 볼 칠판 장면.  ?key=1 교사용 정답.  ?show=1 전자칠판에 한 문항씩(Space = 정답 보기).
   인쇄하면 종이 시험지(답 칸만 남음)로 나온다. 답은 이 기기의 브라우저에만 저장하고 어디에도 보내지 않는다. */
(function () {
  "use strict";
  var F = window.FORMATIVE; if (!F) return;
  var Q = new URLSearchParams(location.search), KEY = Q.get("key") === "1", SHOW = Q.get("show") === "1", PRINT = Q.get("print") === "1";
  var SKEY = "formative:" + location.pathname;
  var NUM = "①②③④⑤⑥⑦⑧";
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function norm(s) { return String(s).toLowerCase().replace(/[−–]/g, "-").replace(/[\s·.,()'"‘’“”~]/g, "").replace(/영하/g, "-"); }

  /* ---------- 모양 ---------- */
  var css = "@import url('https://fonts.googleapis.com/css2?family=Gothic+A1:wght@400;500;700;800;900&display=swap');" +
  "@page{size:A4;margin:12mm 13mm}*{box-sizing:border-box}" +
  "body{margin:0;background:#e9edf2;font-family:'Gothic A1','Malgun Gothic',sans-serif;color:#161b28}" +
  "body.print .fm-tools,body.print .fm-actions,body.print .fm-score{display:none}.fm-tools{max-width:210mm;margin:16px auto 0;display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;font-size:14px}" +
  ".fm-tools a,.fm-tools button{font:inherit;font-weight:800;padding:8px 14px;border-radius:10px;border:2px solid #c9d1dd;background:#fff;color:#161b28;text-decoration:none;cursor:pointer}" +
  ".fm-tools .main{background:#1462d8;border-color:#1462d8;color:#fff}" +
  ".fm-paper{max-width:210mm;margin:12px auto 30px;background:#fff;padding:12mm 13mm;box-shadow:0 4px 24px rgba(0,0,0,.12)}" +
  ".fm-head{display:flex;justify-content:space-between;align-items:flex-end;gap:12px;border-bottom:3px solid #161b28;padding-bottom:8px;margin-bottom:8px}" +
  ".fm-head .k{font-size:11.5px;font-weight:800;color:#5f6b80}.fm-head h1{font-size:22px;font-weight:900;margin:2px 0 0;letter-spacing:-.03em}" +
  ".fm-who{display:flex;gap:8px;font-size:12px;font-weight:800}.fm-who label{border:1.5px solid #9aa4b5;border-radius:6px;padding:5px 8px;display:flex;gap:6px;align-items:center}" +
  ".fm-who input{border:none;font:inherit;width:70px;outline:none}" +
  ".fm-meta{font-size:12px;color:#5f6b80;margin:0 0 10px;line-height:1.6}.fm-meta b{color:#161b28}" +
  ".fm-key{color:#d9302c;font-weight:900}" +
  ".fm-item{border-top:1px solid #dfe4ec;padding:12px 0 10px;break-inside:avoid}" +
  ".fm-q{font-size:15px;font-weight:700;line-height:1.65;margin:0 0 8px}.fm-q .n{font-weight:900;margin-right:4px}" +
  ".fm-lv{display:inline-block;font-size:10.5px;font-weight:900;padding:1px 7px;border-radius:999px;margin-left:6px;vertical-align:2px;color:#fff}" +
  ".lv-기본{background:#2f9e44}.lv-발전{background:#1462d8}.lv-심화{background:#c2255c}" +
  ".fm-box{border:1.5px solid #9aa4b5;border-radius:8px;padding:8px 12px;margin:0 0 8px;font-size:14px;line-height:1.75}" +
  ".fm-fig{margin:0 0 8px;text-align:center}.fm-fig svg{max-width:100%;height:auto}" +
  ".fm-opts{display:grid;gap:5px}.fm-opts.two{grid-template-columns:1fr 1fr}" +
  ".fm-opt{display:flex;gap:8px;align-items:flex-start;font-size:14px;line-height:1.55;padding:6px 10px;border-radius:9px;border:2px solid #e3e8ef;cursor:pointer}" +
  ".fm-opt input{margin-top:4px}.fm-opt:hover{border-color:#a5c4f3}" +
  ".fm-opt.right{border-color:#2f9e44;background:#e6f7ec}.fm-opt.wrong{border-color:#e03131;background:#fff0f0}" +
  ".fm-short{display:flex;gap:8px;align-items:center;font-size:14px}.fm-short input{font:inherit;font-weight:800;border:none;border-bottom:2px solid #161b28;padding:4px 6px;width:220px;outline:none;background:transparent}" +
  ".fm-essay textarea{width:100%;min-height:96px;font:inherit;font-size:14px;line-height:1.7;border:1.5px solid #9aa4b5;border-radius:8px;padding:8px 10px;resize:vertical}" +
  ".fm-res{display:none;margin-top:8px;font-size:13.5px;line-height:1.7;padding:8px 12px;border-radius:9px;background:#f4f6fa}" +
  ".graded .fm-res,.key .fm-res{display:block}" +
  ".fm-res .ok{color:#2f9e44;font-weight:900}.fm-res .no{color:#d9302c;font-weight:900}.fm-res a{color:#1462d8;font-weight:800}" +
  ".fm-rub label{display:block;margin:2px 0}.fm-model{border-left:4px solid #1462d8;padding-left:10px;margin:4px 0}" +
  ".fm-score{display:none;margin:14px 0 0;padding:14px 16px;border-radius:12px;background:#eef4ff;font-size:15px;line-height:1.7}" +
  ".graded .fm-score{display:block}.fm-score b{font-size:20px}" +
  ".fm-actions{display:flex;gap:10px;justify-content:center;margin:16px 0 4px}" +
  ".fm-actions button{font:inherit;font-weight:900;font-size:15px;padding:12px 26px;border-radius:12px;border:none;background:#1462d8;color:#fff;cursor:pointer}" +
  ".fm-actions button.sub{background:#e8edf4;color:#161b28}" +
  ".fm-foot{margin-top:12px;font-size:11px;color:#8a94a6;display:flex;justify-content:space-between;gap:10px}" +
  ".key .fm-opt.ans{border-color:#d9302c;background:#fff0f0;font-weight:800}.key .fm-opt.ans::after{content:' ← 정답';color:#d9302c;font-weight:900}" +
  ".key .fm-actions,.key .fm-score{display:none}" +
  "@media print{body{background:#fff}.fm-tools,.fm-actions,.fm-score{display:none!important}.fm-paper{box-shadow:none;margin:0;padding:0;max-width:none}" +
  "body:not(.key) .fm-res{display:none!important}.fm-item{padding:7px 0 5px}.fm-q{font-size:13.5px;margin-bottom:4px}.fm-box{font-size:12.5px;padding:4px 10px;line-height:1.6;margin-bottom:4px}.fm-fig svg{max-height:190px;width:auto}.fm-meta{margin-bottom:4px}.fm-opts{gap:0 10px}.fm-opt{border:none;padding:1px 4px;font-size:13px}.fm-opt.right,.fm-opt.wrong{background:none}" +
  ".fm-who input{width:60px}.fm-essay textarea{border:1.5px solid #9aa4b5;min-height:110px;color:transparent}body.key .fm-essay textarea{display:none}}" +
  "@media (max-width:640px){.fm-paper{padding:16px 14px}.fm-opts.two{grid-template-columns:1fr}.fm-head{flex-direction:column;align-items:flex-start}}" +
  /* 전자칠판 한 문항씩 */
  ".fm-show{position:fixed;inset:0;background:#fff;display:flex;flex-direction:column;padding:4vh 6vw}" +
  ".fm-show .top{display:flex;justify-content:space-between;align-items:center;font-size:2.2vh;font-weight:800;color:#5f6b80}" +
  ".fm-show .qq{font-size:4.2vh;font-weight:800;line-height:1.5;margin:3vh 0 2vh;letter-spacing:-.02em}" +
  ".fm-show .bx{font-size:3vh;line-height:1.7;border:2px solid #9aa4b5;border-radius:12px;padding:1.4vh 2vw;margin-bottom:2vh}" +
  ".fm-show .fg{text-align:center;margin-bottom:2vh}.fm-show .fg svg{height:30vh;width:auto;max-width:100%}.fm-show .in{transform-origin:0 0}.fm-show .ops{display:grid;gap:0 1.6vw}.fm-show .ops.two{grid-template-columns:1fr 1fr}" +
  ".fm-show .op{font-size:3.4vh;line-height:1.5;padding:1.2vh 1.6vw;border:3px solid #e3e8ef;border-radius:14px;margin-bottom:1.2vh;transition:all .3s}" +
  ".fm-show.rv .op.ans{border-color:#2f9e44;background:#e6f7ec;font-weight:900}.fm-show.rv .op:not(.ans){opacity:.35}" +
  ".fm-show .an{display:none;font-size:3vh;line-height:1.6;margin-top:1.5vh;padding:1.6vh 2vw;border-radius:14px;background:#fff6cc}" +
  ".fm-show.rv .an{display:block}.fm-show .hint{margin-top:auto;font-size:1.8vh;color:#8a94a6;text-align:center}";
  document.head.appendChild(el("style", "", css));

  /* ---------- 저장 ---------- */
  var saved = {}; if (!PRINT && !KEY) try { saved = JSON.parse(localStorage.getItem(SKEY) || "{}"); } catch (e) { saved = {}; }
  function save() { if (PRINT || KEY) return; try { localStorage.setItem(SKEY, JSON.stringify(saved)); } catch (e) {} }
  saved.ans = saved.ans || {}; saved.rub = saved.rub || {};

  function refLink(it) {
    if (!it.ref || !F.board) return "";
    return " · <a href='" + F.board + "?s=1#" + it.ref + "' target='_blank' rel='noopener'>칠판 " + it.ref + "번 장면 다시 보기 →</a>";
  }
  function ansText(it) {
    if (it.type === "mc") return (Array.isArray(it.a) ? it.a : [it.a]).map(function (k) { return NUM[k]; }).join(", ");
    if (it.type === "short") return it.a[0] + (it.unit ? " " + it.unit : "");
    return "";
  }

  if (SHOW) return showMode();

  /* ---------- 종이·학생 화면 ---------- */
  if (KEY) document.body.classList.add("key");
  var tools = el("div", "fm-tools");
  if (F.board) tools.appendChild(el("a", "", "📺 칠판 강의 화면")).href = F.board;
  if (F.sheet) tools.appendChild(el("a", "", "📝 개념정리 학습지")).href = F.sheet;
  var sh = tools.appendChild(el("a", "", "🖥 칠판에 한 문항씩")); sh.href = "?show=1";
  if (KEY) { var st = tools.appendChild(el("a", "", "학생용으로 보기")); st.href = "?"; }
  var pb = tools.appendChild(el("button", "main", KEY ? "정답지 인쇄" : "빈 시험지 인쇄")); pb.onclick = function () { if (KEY || PRINT) window.print(); else window.open("?print=1", "_blank"); };
  document.body.appendChild(tools);

  var paper = el("div", "fm-paper"); document.body.appendChild(paper);
  var head = el("div", "fm-head",
    "<div><div class='k'>" + esc(F.subject) + " · " + esc(F.unit) + (KEY ? " &nbsp;<span class='fm-key'>[교사용 정답]</span>" : "") + "</div><h1>형성평가 · " + esc(F.part) + "</h1></div>" +
    "<div class='fm-who'><label>학번<input id='fm-id' autocomplete='off'></label><label>이름<input id='fm-name' autocomplete='off'></label></div>");
  paper.appendChild(head);
  var nObj = F.items.filter(function (it) { return it.type !== "essay"; }).length, nEs = F.items.length - nObj;
  paper.appendChild(el("p", "fm-meta", "<b>" + F.items.length + "문항</b>(선택·단답 " + nObj + " · 서술 " + nEs + ") · 시간 " + esc(F.time || "10분") +
    " · <span class='fm-lv lv-기본'>기본</span> 용어·개념 <span class='fm-lv lv-발전'>발전</span> 자료 해석·계산 <span class='fm-lv lv-심화'>심화</span> 적용·서술" +
    (F.std && F.std.length ? "<br>성취기준 " + F.std.map(function (s) { return "[" + esc(s) + "]"; }).join(" ") : "")));
  ["fm-id", "fm-name"].forEach(function (id) { var i = document.getElementById(id); i.value = saved[id] || ""; i.oninput = function () { saved[id] = i.value; save(); }; });

  var nodes = [];
  F.items.forEach(function (it, i) {
    var box = el("div", "fm-item"); box.id = "q" + (i + 1);
    var h = "<p class='fm-q'><span class='n'>" + (i + 1) + ".</span>" + it.q + "<span class='fm-lv lv-" + it.lv + "'>" + it.lv + "</span></p>";
    if (it.box) h += "<div class='fm-box'>" + it.box + "</div>";
    if (it.fig) h += "<div class='fm-fig'>" + it.fig + "</div>";
    box.innerHTML = h;
    var multi = it.type === "mc" && Array.isArray(it.a);
    if (it.type === "mc") {
      var wrap = el("div", "fm-opts" + (it.opts.every(function (o) { return o.replace(/<[^>]+>/g, "").length < 26; }) ? " two" : ""));
      it.opts.forEach(function (o, k) {
        var right = multi ? it.a.indexOf(k) >= 0 : it.a === k;
        var lab = el("label", "fm-opt" + (right ? " ans" : ""), "<input type='" + (multi ? "checkbox" : "radio") + "' name='q" + i + "' value='" + k + "'><span>" + NUM[k] + " " + o + "</span>");
        wrap.appendChild(lab);
      });
      box.appendChild(wrap);
      var prev = saved.ans[i];
      Array.prototype.forEach.call(wrap.querySelectorAll("input"), function (inp) {
        if (prev != null && [].concat(prev).indexOf(+inp.value) >= 0) inp.checked = true;
        inp.onchange = function () {
          var v = Array.prototype.filter.call(wrap.querySelectorAll("input"), function (x) { return x.checked; }).map(function (x) { return +x.value; });
          saved.ans[i] = multi ? v : v[0]; save();
        };
      });
      if (multi) box.querySelector(".fm-q").insertAdjacentHTML("beforeend", " <span style='font-size:12px;color:#5f6b80;font-weight:800'>(답 " + it.a.length + "개 이상일 수 있음 · 모두 고르기)</span>");
    } else if (it.type === "short") {
      var sw = el("div", "fm-short", "답: <input type='text' autocomplete='off'>" + (it.unit ? " " + esc(it.unit) : ""));
      var inp = sw.querySelector("input"); inp.value = saved.ans[i] || ""; inp.oninput = function () { saved.ans[i] = inp.value; save(); };
      if (KEY) { inp.value = it.a[0]; inp.style.color = "#d9302c"; inp.readOnly = true; }
      box.appendChild(sw);
    } else {
      var ew = el("div", "fm-essay", "<textarea placeholder='여기에 쓰세요'></textarea>");
      var ta = ew.querySelector("textarea"); ta.value = saved.ans[i] || ""; ta.oninput = function () { saved.ans[i] = ta.value; save(); };
      box.appendChild(ew);
    }
    var res = el("div", "fm-res"); box.appendChild(res);
    paper.appendChild(box);
    nodes.push({ it: it, box: box, res: res });
    if (KEY) {
      if (it.type === "essay") res.innerHTML = "<b class='fm-key'>예시 답안</b><div class='fm-model'>" + it.model + "</div><b class='fm-key'>채점 기준</b> " + it.rubric.map(function (r, k) { return (k + 1) + ") " + r; }).join(" · ");
      else res.innerHTML = "<b class='fm-key'>정답 " + ansText(it) + "</b> · " + it.why + refLink(it);
    }
  });

  var score = el("div", "fm-score"); paper.appendChild(score);
  var act = el("div", "fm-actions");
  var bGrade = act.appendChild(el("button", "", "채점하기")), bReset = act.appendChild(el("button", "sub", "다시 풀기"));
  paper.appendChild(act);
  paper.appendChild(el("div", "fm-foot", "<span>답은 이 기기의 브라우저에만 저장되고 어디에도 보내지 않습니다.</span><span>" + (F.board ? "칠판 강의 화면: " + esc(F.board) : "") + "</span>"));

  function correct(it, v) {
    if (it.type === "mc") {
      if (Array.isArray(it.a)) { v = [].concat(v || []).slice().sort(); return v.length === it.a.length && it.a.slice().sort().every(function (x, k) { return x === v[k]; }); }
      return v === it.a;
    }
    if (it.type === "short") { var n = norm(v || ""); if (it.unit) n = n.replace(norm(it.unit), ""); return !!n && it.a.some(function (a) { return norm(a) === n; }); }
    return null;
  }
  function grade() {
    var ok = 0, miss = [];
    nodes.forEach(function (o, i) {
      var it = o.it, v = saved.ans[i], c = correct(it, v);
      if (it.type === "mc") Array.prototype.forEach.call(o.box.querySelectorAll(".fm-opt"), function (lab, k) {
        var right = Array.isArray(it.a) ? it.a.indexOf(k) >= 0 : it.a === k, picked = [].concat(v == null ? [] : v).indexOf(k) >= 0;
        lab.classList.toggle("right", right); lab.classList.toggle("wrong", picked && !right);
      });
      if (it.type === "essay") {
        var r = saved.rub[i] || [];
        o.res.innerHTML = "<b>예시 답안</b><div class='fm-model'>" + it.model + "</div><b>스스로 채점</b> · 내 답에 들어 있는 것에 표시하세요" + refLink(it) +
          "<div class='fm-rub'>" + it.rubric.map(function (t, k) { return "<label><input type='checkbox' data-k='" + k + "'" + (r[k] ? " checked" : "") + "> " + t + "</label>"; }).join("") + "</div>";
        Array.prototype.forEach.call(o.res.querySelectorAll("input"), function (cb) { cb.onchange = function () { (saved.rub[i] = saved.rub[i] || [])[+cb.dataset.k] = cb.checked; save(); summary(); }; });
      } else {
        if (c) ok++; else miss.push(i + 1);
        o.res.innerHTML = (c ? "<span class='ok'>✓ 맞았어요</span>" : "<span class='no'>✗ 다시 볼까요</span> · 정답 " + ansText(it)) + " · " + it.why + refLink(it);
      }
    });
    saved.graded = true; save();
    document.body.classList.add("graded");
    summary(ok, miss);
    score.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  var last = null;
  function summary(ok, miss) {
    if (ok != null) last = { ok: ok, miss: miss };
    if (!last) return;
    var es = nodes.map(function (o, i) { return o.it.type === "essay" ? i : -1; }).filter(function (i) { return i >= 0; });
    var esTxt = es.map(function (i) { var r = (saved.rub[i] || []).filter(Boolean).length; return (i + 1) + "번 " + r + " / " + nodes[i].it.rubric.length; }).join(", ");
    score.innerHTML = "선택·단답 <b>" + last.ok + " / " + nObj + "</b>" + (esTxt ? " · 서술(스스로 채점) " + esTxt : "") +
      (last.miss.length ? "<br>다시 볼 문항: " + last.miss.map(function (n) { return "<a href='#q" + n + "'>" + n + "번</a>"; }).join(", ") + " — 해설 옆의 칠판 장면을 다시 넘겨 보세요." : "<br>선택·단답을 모두 맞혔어요. 서술형 예시 답안과 내 답을 견주어 보세요.");
  }
  bGrade.onclick = grade;
  bReset.onclick = function () {
    if (!confirm("답을 모두 지우고 다시 풀까요?")) return;
    saved = { ans: {}, rub: {}, "fm-id": saved["fm-id"], "fm-name": saved["fm-name"] }; save(); location.reload();
  };
  if (saved.graded && !KEY && !PRINT) grade();

  /* ---------- 전자칠판: 한 문항씩 ---------- */
  function showMode() {
    var cur = 0, rv = false, wrap = el("div", "fm-show"); document.body.appendChild(wrap);
    function draw() {
      var it = F.items[cur], h = "<div class='top'><span>형성평가 · " + esc(F.part) + "</span><span>" + (cur + 1) + " / " + F.items.length + " · <span class='fm-lv lv-" + it.lv + "' style='font-size:1.8vh'>" + it.lv + "</span></span></div>";
      h += "<div class='qq'>" + (cur + 1) + ". " + it.q + "</div>";
      if (it.box) h += "<div class='bx'>" + it.box + "</div>";
      if (it.fig) h += "<div class='fg'>" + it.fig + "</div>";
      if (it.type === "mc") { h += "<div class='ops" + (it.opts.every(function (o) { return o.replace(/<[^>]+>/g, "").length < 24; }) ? " two" : "") + "'>"; it.opts.forEach(function (o, k) { var r = Array.isArray(it.a) ? it.a.indexOf(k) >= 0 : it.a === k; h += "<div class='op" + (r ? " ans" : "") + "'>" + NUM[k] + " " + o + "</div>"; }); h += "</div>"; }
      h += "<div class='an'>" + (it.type === "essay" ? "<b>예시 답안</b> " + it.model + "<br><b>채점 기준</b> " + it.rubric.join(" · ") : "<b>정답 " + ansText(it) + "</b> · " + it.why) + "</div>";
      wrap.innerHTML = "<div class='in'>" + h + "</div><div class='hint'>→ 다음 문항 · ← 이전 · Space 정답 보기/가리기 · Esc 시험지로</div>"; wrap.classList.toggle("rv", rv);
      /* 한 화면에 다 들어오게 줄인다(정답 칸이 열려도) */
      var inn = wrap.querySelector(".in"), room = wrap.clientHeight - wrap.querySelector(".hint").offsetHeight - 24, k = 1;
      inn.style.zoom = 1; k = Math.max(.45, Math.min(1, room / inn.scrollHeight)); inn.style.zoom = k;
    }
    document.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight" || e.key === "PageDown") { if (cur < F.items.length - 1) { cur++; rv = false; draw(); } }
      else if (e.key === "ArrowLeft" || e.key === "PageUp") { if (cur > 0) { cur--; rv = false; draw(); } }
      else if (e.key === " " || e.key === "Enter") { e.preventDefault(); rv = !rv; draw(); }
      else if (e.key === "Escape") location.href = "?";
    });
    wrap.addEventListener("click", function (e) { if (e.target.closest("a")) return; var x = e.clientX / innerWidth; if (x < .2) { if (cur > 0) { cur--; rv = false; } } else if (x > .8) { if (cur < F.items.length - 1) { cur++; rv = false; } } else rv = !rv; draw(); });
    draw();
  }
})();
