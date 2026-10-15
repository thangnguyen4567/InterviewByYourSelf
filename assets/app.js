(function () {
  'use strict';

  const DATA = (window.INTERVIEW_DATA || []).slice().sort((a, b) => a.order - b.order);
  const $ = (sel, el = document) => el.querySelector(sel);
  const main = $('#main');
  const sidebar = $('#sidebar');

  // ---------- Index ----------
  const ALL = [];      // flat list of questions
  const BY_ID = {};
  DATA.forEach((t) => {
    t.count = 0;
    t.sections.forEach((s, si) => {
      s.questions.forEach((q) => {
        q.topic = t;
        q.sectionIndex = si;
        q.section = s.title;
        q.norm = norm(q.q + ' ' + q.answer);
        q.qnorm = norm(q.q);
        ALL.push(q);
        BY_ID[q.id] = q;
        t.count++;
      });
    });
  });
  const TOPIC = Object.fromEntries(DATA.map((t) => [t.id, t]));

  // ---------- Storage ----------
  const KEY = 'interview-prep-v1';
  // learned/starred/tests/wrong được đồng bộ lên server; theme chỉ lưu trên máy.
  // dirty = có thay đổi chưa đẩy lên server; syncedAt = phiên bản server lần đồng bộ cuối.
  let store = { learned: {}, starred: {}, tests: {}, wrong: {}, theme: null, dirty: false, syncedAt: undefined };
  try { store = Object.assign(store, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { /* ignore */ }
  const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { /* ignore */ } };
  // save({ local: true }) = chỉ lưu trên máy, không đánh dấu cần đồng bộ (vd: đổi theme)
  const save = (opts) => {
    if (!(opts && opts.local)) store.dirty = true;
    persist();
    if (!(opts && opts.local)) scheduleSync();
  };
  const isLearned = (id) => !!store.learned[id];
  const isStarred = (id) => !!store.starred[id];
  function toggle(kind, id, val) {
    const on = val === undefined ? !store[kind][id] : val;
    if (on) store[kind][id] = 1; else delete store[kind][id];
    save();
    return on;
  }
  const learnedCount = (t) => ALL.filter((q) => q.topic === t && isLearned(q.id)).length;

  // ---------- Utils ----------
  function norm(s) {
    return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  // Inline markdown nhẹ cho tiêu đề câu hỏi (chỉ `code`)
  function inlineQ(s, term) {
    let html = esc(s).replace(/`([^`]+)`/g, '<code>$1</code>');
    if (term) {
      const re = new RegExp('(' + term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
      html = html.replace(/(<[^>]+>)|([^<]+)/g, (m, tag, text) => tag || text.replace(re, '<mark>$1</mark>'));
    }
    return html;
  }
  function renderMd(md) {
    const html = window.marked ? marked.parse(md, { gfm: true, breaks: false }) : '<pre>' + esc(md) + '</pre>';
    const div = document.createElement('div');
    div.className = 'answer';
    div.innerHTML = html;
    div.querySelectorAll('pre code').forEach((code) => {
      if (window.hljs) {
        const lang = (code.className.match(/language-(\S+)/) || [])[1];
        if (lang && !hljs.getLanguage(lang)) code.className = '';
        try { hljs.highlightElement(code); } catch (e) { /* ignore */ }
      }
      const btn = document.createElement('button');
      btn.className = 'copy';
      btn.textContent = 'Copy';
      btn.onclick = (ev) => {
        ev.stopPropagation();
        navigator.clipboard && navigator.clipboard.writeText(code.innerText).then(() => {
          btn.textContent = 'Đã copy';
          setTimeout(() => (btn.textContent = 'Copy'), 1200);
        });
      };
      code.parentElement.appendChild(btn);
    });
    return div;
  }
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  const levelLabel = { junior: 'Junior', mid: 'Mid', senior: 'Senior' };
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);

  // ---------- Theme ----------
  function applyTheme() {
    const dark = store.theme ? store.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    $('#hl-dark').disabled = !dark;
    $('#hl-light').disabled = dark;
  }
  $('#themeBtn').onclick = () => {
    store.theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    save({ local: true });
    applyTheme();
  };
  applyTheme();

  // ---------- Sidebar ----------
  function renderSidebar(route) {
    const cur = route.topic;
    let html = `<a class="side-link ${route.name === 'home' ? 'active' : ''}" href="#/">🏠 Trang chủ</a>`;
    html += `<a class="side-link ${route.name === 'testhub' ? 'active' : ''}" href="#/test">📝 Trắc nghiệm <span class="count">${MCQ_TOTAL}</span></a>`;
    html += `<a class="side-link ${route.name === 'bookmarks' ? 'active' : ''}" href="#/bookmarks">⭐ Đã đánh dấu <span class="count">${Object.keys(store.starred).filter((id) => BY_ID[id]).length}</span></a>`;
    html += `<div class="side-title">Chủ đề</div>`;
    DATA.forEach((t) => {
      const active = cur === t.id;
      html += `<a class="side-link ${active ? 'active' : ''}" href="#/t/${t.id}">${t.icon} ${esc(t.title)} <span class="count">${learnedCount(t)}/${t.count}</span></a>`;
      html += `<div class="mini-bar"><i style="width:${pct(learnedCount(t), t.count)}%"></i></div>`;
      if (active && route.name === 'topic') {
        t.sections.forEach((s, i) => {
          html += `<a class="side-link side-sub" href="#/t/${t.id}/${i}">${esc(s.title)}</a>`;
        });
      }
    });
    sidebar.innerHTML = html;
  }

  // ---------- Views ----------
  function viewHome() {
    const total = ALL.length;
    const learned = ALL.filter((q) => isLearned(q.id)).length;
    const starred = Object.keys(store.starred).filter((id) => BY_ID[id]).length;
    const lv = (l) => ALL.filter((q) => q.level === l).length;
    main.innerHTML = `
      <section class="hero">
        <h1>Ôn luyện phỏng vấn 🎯</h1>
        <p>Tổng hợp câu hỏi và câu trả lời mẫu theo chủ đề. Bấm vào câu hỏi để xem đáp án, đánh dấu ✅ khi đã thuộc, ⭐ để ôn lại sau.</p>
      </section>
      <div class="stats">
        <div class="stat"><b>${total}</b><span>câu hỏi / ${DATA.length} chủ đề</span></div>
        <div class="stat"><b style="color:var(--ok)">${learned} <small style="font-size:14px">(${pct(learned, total)}%)</small></b><span>đã thuộc</span></div>
        <div class="stat"><b>${starred}</b><span>đã đánh dấu ⭐</span></div>
        <div class="stat"><b><span style="color:var(--junior)">${lv('junior')}</span> · <span style="color:var(--mid)">${lv('mid')}</span> · <span style="color:var(--senior)">${lv('senior')}</span></b><span>Junior · Mid · Senior</span></div>
      </div>
      <div class="grid">
        ${DATA.map((t) => {
          const l = learnedCount(t);
          return `<a class="card" href="#/t/${t.id}">
            <div class="ico">${t.icon}</div>
            <h3>${esc(t.title)}</h3>
            <p>${esc(t.description)}</p>
            <div class="progress"><i style="width:${pct(l, t.count)}%"></i></div>
            <div class="meta"><span>${t.count} câu hỏi · ${mcqOf(t.id).length} trắc nghiệm</span><span>${l}/${t.count} đã thuộc</span></div>
          </a>`;
        }).join('')}
      </div>
      ${DATA.length ? '' : '<div class="empty">Chưa có nội dung. Chạy <code>node build.js</code> để sinh <code>assets/content.js</code>.</div>'}
      <p style="margin-top:28px;color:var(--text-muted);font-size:13px">
        Phím tắt: <span class="kbd">/</span> tìm kiếm · trong Flashcard: <span class="kbd">Space</span> xem đáp án,
        <span class="kbd">1</span> chưa nhớ, <span class="kbd">2</span> đã nhớ.
        ${window.INTERVIEW_BUILT_AT ? ' · Dữ liệu build lúc ' + new Date(window.INTERVIEW_BUILT_AT).toLocaleString('vi-VN') : ''}
      </p>`;
  }

  // Bộ lọc của trang chủ đề (nhớ theo phiên)
  const filterState = { text: '', level: 'all', status: 'all' };

  function qaItem(q, num, opts = {}) {
    const el = document.createElement('div');
    el.className = 'qa' + (isLearned(q.id) ? ' learned' : '');
    el.id = 'q-' + q.id;
    el.innerHTML = `
      <div class="qa-head">
        <span class="chev">▶</span>
        <span class="qa-num">${num}.</span>
        <span class="qa-q">${inlineQ(q.q, opts.term)}
          ${opts.showTopic ? `<span class="badge topic">${q.topic.icon} ${esc(q.topic.title)} › ${esc(q.section)}</span>` : ''}
        </span>
        <span class="qa-tools">
          <span class="badge ${q.level}">${levelLabel[q.level]}</span>
          <button class="star ${isStarred(q.id) ? 'on' : ''}" title="Đánh dấu ôn lại">⭐</button>
          <button class="learn ${isLearned(q.id) ? 'on' : ''}" title="Đã thuộc">✅</button>
        </span>
      </div>
      <div class="qa-body"></div>`;
    const body = $('.qa-body', el);
    const open = () => {
      if (!body.firstChild) body.appendChild(renderMd(q.answer));
      el.classList.add('open');
    };
    el._open = open;
    el._close = () => el.classList.remove('open');
    $('.qa-head', el).addEventListener('click', (ev) => {
      if (ev.target.closest('.qa-tools button')) return;
      el.classList.contains('open') ? el._close() : open();
    });
    $('.star', el).onclick = (ev) => {
      ev.currentTarget.classList.toggle('on', toggle('starred', q.id));
      renderSidebar(currentRoute);
    };
    $('.learn', el).onclick = (ev) => {
      const on = toggle('learned', q.id);
      ev.currentTarget.classList.toggle('on', on);
      el.classList.toggle('learned', on);
      renderSidebar(currentRoute);
      updateTopicProgress();
    };
    return el;
  }

  function matchFilters(q) {
    if (filterState.level !== 'all' && q.level !== filterState.level) return false;
    if (filterState.status === 'unlearned' && isLearned(q.id)) return false;
    if (filterState.status === 'learned' && !isLearned(q.id)) return false;
    if (filterState.status === 'starred' && !isStarred(q.id)) return false;
    if (filterState.text && !q.norm.includes(norm(filterState.text))) return false;
    return true;
  }

  function chips(name, options) {
    return `<div class="chip-group" data-name="${name}">${options
      .map(([v, label]) => `<button data-v="${v}" class="${filterState[name] === v ? 'on' : ''}">${label}</button>`)
      .join('')}</div>`;
  }

  function updateTopicProgress() {
    const t = TOPIC[currentRoute.topic];
    const el = $('#topicProgress');
    if (!t || !el) return;
    const l = learnedCount(t);
    el.innerHTML = `<div class="progress" style="width:200px"><i style="width:${pct(l, t.count)}%"></i></div>
      <small style="color:var(--text-muted)">${l}/${t.count} đã thuộc (${pct(l, t.count)}%)</small>`;
  }

  function viewTopic(t, sectionIndex) {
    main.innerHTML = `
      <div class="page-head">
        <div class="ico">${t.icon}</div>
        <div class="grow">
          <h1>${esc(t.title)}</h1>
          <p>${esc(t.description)}</p>
          <div id="topicProgress" style="margin-top:8px"></div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <a class="btn primary" href="#/test/${t.id}">📝 Trắc nghiệm (${mcqOf(t.id).length})</a>
          <a class="btn" href="#/quiz/${t.id}">🃏 Flashcard</a>
          <button class="btn" id="resetBtn" title="Xóa trạng thái đã thuộc của chủ đề này">↺ Reset</button>
        </div>
      </div>
      <div class="filters">
        <input type="search" id="filterText" placeholder="Lọc trong ${esc(t.title)}…" value="${esc(filterState.text)}">
        ${chips('level', [['all', 'Tất cả'], ['junior', 'Junior'], ['mid', 'Mid'], ['senior', 'Senior']])}
        ${chips('status', [['all', 'Mọi'], ['unlearned', 'Chưa thuộc'], ['learned', 'Đã thuộc'], ['starred', '⭐']])}
        <button class="btn" id="expandBtn">Mở hết</button>
      </div>
      <div id="list"></div>`;
    updateTopicProgress();

    const list = $('#list');
    let expanded = false;
    const draw = () => {
      list.innerHTML = '';
      let shown = 0;
      t.sections.forEach((s, si) => {
        const qs = s.questions.filter(matchFilters);
        if (!qs.length) return;
        const h = document.createElement('h2');
        h.className = 'section-title';
        h.id = 'sec-' + si;
        h.innerHTML = `${esc(s.title)} <small>${qs.length} câu</small>`;
        list.appendChild(h);
        qs.forEach((q) => {
          const idx = s.questions.indexOf(q);
          const n = t.sections.slice(0, si).reduce((a, x) => a + x.questions.length, 0) + idx + 1;
          const item = qaItem(q, n, { term: filterState.text });
          if (expanded) item._open();
          list.appendChild(item);
          shown++;
        });
      });
      if (!shown) list.innerHTML = '<div class="empty">Không có câu hỏi nào khớp bộ lọc.</div>';
    };
    draw();

    $('#filterText').addEventListener('input', (e) => { filterState.text = e.target.value.trim(); draw(); });
    main.querySelectorAll('.chip-group').forEach((g) => {
      g.addEventListener('click', (e) => {
        const b = e.target.closest('button');
        if (!b) return;
        filterState[g.dataset.name] = b.dataset.v;
        g.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
        draw();
      });
    });
    $('#expandBtn').onclick = (e) => {
      expanded = !expanded;
      e.target.textContent = expanded ? 'Thu gọn' : 'Mở hết';
      list.querySelectorAll('.qa').forEach((el) => (expanded ? el._open() : el._close()));
    };
    $('#resetBtn').onclick = () => {
      if (!confirm(`Xóa trạng thái "đã thuộc" của toàn bộ câu hỏi ${t.title}?`)) return;
      ALL.filter((q) => q.topic === t).forEach((q) => delete store.learned[q.id]);
      save();
      renderSidebar(currentRoute);
      updateTopicProgress();
      draw();
    };

    if (sectionIndex != null) {
      const el = $('#sec-' + sectionIndex);
      if (el) requestAnimationFrame(() => el.scrollIntoView({ block: 'start' }));
    } else {
      window.scrollTo(0, 0);
    }
  }

  function viewList(title, subtitle, questions, term) {
    main.innerHTML = `
      <div class="page-head"><div class="grow"><h1>${title}</h1><p>${subtitle}</p></div>
      ${questions.length ? `<a class="btn primary" href="#/quiz/${currentRoute.name === 'bookmarks' ? 'starred' : 'all'}">🃏 Flashcard</a>` : ''}</div>
      <div id="list"></div>`;
    const list = $('#list');
    if (!questions.length) {
      list.innerHTML = '<div class="empty">Không có kết quả.</div>';
      return;
    }
    questions.slice(0, 300).forEach((q, i) => list.appendChild(qaItem(q, i + 1, { term, showTopic: true })));
    window.scrollTo(0, 0);
  }

  function viewSearch(term) {
    const n = norm(term);
    const words = n.split(/\s+/).filter(Boolean);
    const res = ALL
      .filter((q) => words.every((w) => q.norm.includes(w)))
      .map((q) => ({ q, score: words.reduce((s, w) => s + (q.qnorm.includes(w) ? 2 : 0), 0) }))
      .sort((a, b) => b.score - a.score)
      .map((x) => x.q);
    viewList(`Kết quả: “${esc(term)}”`, `${res.length} câu hỏi`, res, term);
  }

  // ---------- Quiz / Flashcard ----------
  function viewQuiz(scope) {
    const pool = scope === 'all' ? ALL
      : scope === 'starred' ? ALL.filter((q) => isStarred(q.id))
      : ALL.filter((q) => q.topic.id === scope);
    const title = scope === 'all' ? 'Tất cả chủ đề' : scope === 'starred' ? 'Câu đã đánh dấu ⭐' : TOPIC[scope].icon + ' ' + TOPIC[scope].title;
    const qz = { level: 'all', only: 'unlearned', deck: [], i: 0, revealed: false, ok: 0, miss: [] };

    const start = (custom) => {
      let d = custom || pool.filter((q) => (qz.level === 'all' || q.level === qz.level) && (qz.only === 'all' || !isLearned(q.id)));
      qz.deck = shuffle(d);
      qz.i = 0; qz.ok = 0; qz.miss = []; qz.revealed = false;
      draw();
    };

    const draw = () => {
      const q = qz.deck[qz.i];
      let card;
      if (!qz.deck.length) {
        card = `<div class="flash done"><div class="big">🎉</div><h2>Không còn câu nào</h2>
          <p style="color:var(--text-muted)">Bạn đã thuộc hết các câu theo bộ lọc này. Thử chọn "Cả câu đã thuộc" để ôn lại.</p></div>`;
      } else if (!q) {
        card = `<div class="flash done"><div class="big">🏁</div><h2>Hoàn thành ${qz.deck.length} câu</h2>
          <p>Đã nhớ: <b style="color:var(--ok)">${qz.ok}</b> · Chưa nhớ: <b style="color:var(--senior)">${qz.miss.length}</b></p>
          <div class="quiz-actions">
            ${qz.miss.length ? '<button class="btn primary" id="retryMiss">Ôn lại câu chưa nhớ</button>' : ''}
            <button class="btn" id="restart">Xáo bài mới</button>
          </div></div>`;
      } else {
        card = `<div class="flash">
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <span class="badge ${q.level}">${levelLabel[q.level]}</span>
            <span class="badge topic">${q.topic.icon} ${esc(q.topic.title)} › ${esc(q.section)}</span>
          </div>
          <div class="q">${inlineQ(q.q)}</div>
          <div id="ans">${qz.revealed ? '' : '<div class="reveal"><button class="btn primary" id="reveal">Xem đáp án <span class="kbd" style="color:#fff">Space</span></button><p style="color:var(--text-muted);font-size:13px">Hãy tự trả lời thành tiếng trước khi xem 😉</p></div>'}</div>
          ${qz.revealed ? `<div class="quiz-actions">
            <button class="btn" id="miss">😕 Chưa nhớ <span class="kbd">1</span></button>
            <button class="btn primary" id="ok">👍 Đã nhớ <span class="kbd">2</span></button>
          </div>` : ''}
        </div>`;
      }
      main.innerHTML = `<div class="quiz-wrap">
        <div class="quiz-top">
          <div class="grow"><h2 style="margin:0">🃏 Flashcard · ${title}</h2>
            <small style="color:var(--text-muted)">${qz.deck.length ? `Câu ${Math.min(qz.i + 1, qz.deck.length)} / ${qz.deck.length}` : ''}</small></div>
          ${chips2('level', [['all', 'Mọi level'], ['junior', 'Junior'], ['mid', 'Mid'], ['senior', 'Senior']])}
          ${chips2('only', [['unlearned', 'Chưa thuộc'], ['all', 'Cả câu đã thuộc']])}
        </div>
        <div class="progress" style="margin-bottom:14px"><i style="width:${pct(qz.i, qz.deck.length)}%"></i></div>
        ${card}
      </div>`;
      if (q && qz.revealed) $('#ans').appendChild(renderMd(q.answer));
      bind();
    };

    const chips2 = (name, options) => `<div class="chip-group" data-name="${name}">${options
      .map(([v, label]) => `<button data-v="${v}" class="${qz[name] === v ? 'on' : ''}">${label}</button>`).join('')}</div>`;

    const reveal = () => { if (qz.deck[qz.i] && !qz.revealed) { qz.revealed = true; draw(); } };
    const answer = (remembered) => {
      const q = qz.deck[qz.i];
      if (!q || !qz.revealed) return;
      if (remembered) { qz.ok++; toggle('learned', q.id, true); } else { qz.miss.push(q); toggle('learned', q.id, false); }
      qz.i++; qz.revealed = false;
      renderSidebar(currentRoute);
      draw();
      window.scrollTo(0, 0);
    };

    const bind = () => {
      main.querySelectorAll('.chip-group').forEach((g) => g.addEventListener('click', (e) => {
        const b = e.target.closest('button');
        if (!b) return;
        qz[g.dataset.name] = b.dataset.v;
        start();
      }));
      const on = (id, fn) => { const el = $('#' + id); if (el) el.onclick = fn; };
      on('reveal', reveal);
      on('ok', () => answer(true));
      on('miss', () => answer(false));
      on('restart', () => start());
      on('retryMiss', () => start(qz.miss));
    };

    quizKeys = (e) => {
      if (e.target.matches('input, textarea')) return;
      if (e.code === 'Space' || e.key === 'Enter') { e.preventDefault(); reveal(); }
      else if (e.key === '1') answer(false);
      else if (e.key === '2') answer(true);
    };

    start();
  }
  let quizKeys = null;
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && !e.target.matches('input, textarea')) {
      e.preventDefault();
      const s = $('#globalSearch');
      if (getComputedStyle(s.parentElement).display === 'none') location.hash = '#/search/';
      else s.focus();
      return;
    }
    if (currentRoute.name === 'quiz' && quizKeys) quizKeys(e);
    if (currentRoute.name === 'test' && testKeys) testKeys(e);
  });

  // ---------- Trắc nghiệm (MCQ) ----------
  const MCQ = window.INTERVIEW_QUIZ || {};
  const mcqOf = (topicId) => MCQ[topicId] || [];
  const MCQ_TOTAL = Object.values(MCQ).reduce((n, a) => n + a.length, 0);
  // store.tests: { topic: { level: { best, last, attempts, at } } } · store.wrong: { mcqId: 1 } câu từng làm sai
  const testLevels = [['junior', 'Junior'], ['mid', 'Mid'], ['senior', 'Senior'], ['mixed', 'Trộn'], ['wrong', 'Câu từng sai']];
  const testSetup = { level: 'junior', count: '10' };
  let testKeys = null;

  function inlineMd(s) {
    return window.marked && marked.parseInline ? marked.parseInline(s) : esc(s);
  }
  function scoreOf(topicId, level) {
    return (store.tests[topicId] || {})[level];
  }
  function scoreChip(sc) {
    if (!sc) return '<span style="color:var(--text-muted)">—</span>';
    const color = sc.best >= 80 ? 'var(--ok)' : sc.best >= 50 ? 'var(--mid)' : 'var(--senior)';
    return `<b style="color:${color}">${sc.best}%</b>`;
  }

  function viewTestHub() {
    main.innerHTML = `
      <div class="page-head"><div class="grow">
        <h1>📝 Trắc nghiệm</h1>
        <p>${MCQ_TOTAL} câu trắc nghiệm, chia theo độ khó. Chọn chủ đề để bắt đầu làm bài; điểm cao nhất của mỗi mức được lưu lại.</p>
      </div></div>
      <div class="grid">
        ${DATA.map((t) => {
          const qs = mcqOf(t.id);
          const n = (l) => qs.filter((q) => q.level === l).length;
          return `<a class="card" href="#/test/${t.id}">
            <div class="ico">${t.icon}</div>
            <h3>${esc(t.title)}</h3>
            <p>${qs.length ? `${qs.length} câu · <span style="color:var(--junior)">J ${n('junior')}</span> · <span style="color:var(--mid)">M ${n('mid')}</span> · <span style="color:var(--senior)">S ${n('senior')}</span>` : 'Chưa có câu trắc nghiệm'}</p>
            <div class="score-row">
              <span>Junior ${scoreChip(scoreOf(t.id, 'junior'))}</span>
              <span>Mid ${scoreChip(scoreOf(t.id, 'mid'))}</span>
              <span>Senior ${scoreChip(scoreOf(t.id, 'senior'))}</span>
            </div>
          </a>`;
        }).join('')}
      </div>`;
    window.scrollTo(0, 0);
  }

  function viewTest(t) {
    const pool = mcqOf(t.id);
    let run = null; // { list, i, picked:Set, submitted, answers:[], level }
    testKeys = null;

    const setupScreen = () => {
      const levelCount = (l) => l === 'mixed' ? pool.length
        : l === 'wrong' ? pool.filter((q) => store.wrong[q.id]).length
        : pool.filter((q) => q.level === l).length;
      main.innerHTML = `
        <div class="quiz-wrap">
          <div class="page-head">
            <div class="ico">${t.icon}</div>
            <div class="grow"><h1>Trắc nghiệm · ${esc(t.title)}</h1><p>${pool.length} câu hỏi trắc nghiệm</p></div>
            <a class="btn" href="#/t/${t.id}">← Về chủ đề</a>
          </div>
          ${pool.length ? `
          <div class="flash">
            <h3 style="margin-top:0">1. Chọn độ khó</h3>
            <div class="level-pick">
              ${testLevels.map(([v, label]) => {
                const sc = scoreOf(t.id, v);
                const cnt = levelCount(v);
                return `<button class="level-card ${v} ${testSetup.level === v ? 'on' : ''}" data-v="${v}" ${cnt ? '' : 'disabled'}>
                  <b>${label}</b><small>${cnt} câu</small>
                  <small>${sc ? `Cao nhất ${sc.best}% · ${sc.attempts} lần` : v === 'wrong' ? 'Ôn lại câu sai' : 'Chưa làm'}</small>
                </button>`;
              }).join('')}
            </div>
            <h3>2. Số câu</h3>
            <div class="chip-group" id="countPick">
              ${[['10', '10 câu'], ['20', '20 câu'], ['all', 'Tất cả']].map(([v, l]) =>
                `<button data-v="${v}" class="${testSetup.count === v ? 'on' : ''}">${l}</button>`).join('')}
            </div>
            <div class="quiz-actions" style="justify-content:flex-start;margin-top:24px">
              <button class="btn primary" id="startTest">Bắt đầu làm bài ▶</button>
            </div>
            <p style="color:var(--text-muted);font-size:13px;margin-bottom:0">
              Phím tắt: <span class="kbd">1</span>–<span class="kbd">4</span> chọn đáp án · <span class="kbd">Enter</span> trả lời / câu tiếp.
            </p>
          </div>` : '<div class="empty">Chủ đề này chưa có câu trắc nghiệm. Thêm file <code>content/quiz/' + t.id + '.md</code> rồi chạy <code>node build.js</code>.</div>'}
        </div>`;
      main.querySelectorAll('.level-card').forEach((b) => b.onclick = () => { testSetup.level = b.dataset.v; setupScreen(); });
      main.querySelectorAll('#countPick button').forEach((b) => b.onclick = () => { testSetup.count = b.dataset.v; setupScreen(); });
      const sb = $('#startTest');
      if (sb) sb.onclick = () => start();
      testKeys = (e) => { if (e.key === 'Enter' && sb && !e.target.matches('input, textarea, button')) start(); };
      window.scrollTo(0, 0);
    };

    const start = (customList) => {
      const lv = testSetup.level;
      let list = customList || (lv === 'mixed' ? pool
        : lv === 'wrong' ? pool.filter((q) => store.wrong[q.id])
        : pool.filter((q) => q.level === lv));
      list = shuffle(list);
      if (!customList && testSetup.count !== 'all') list = list.slice(0, Number(testSetup.count));
      if (!list.length) return;
      run = {
        level: customList ? 'retry' : lv,
        list: list.map((q) => ({ q, order: shuffle(q.options.map((_, i) => i)) })),
        i: 0, picked: new Set(), submitted: false, answers: [],
      };
      drawQuestion();
    };

    const drawQuestion = () => {
      const item = run.list[run.i];
      const q = item.q;
      const done = run.answers.filter(Boolean).length;
      const right = run.answers.filter((a) => a && a.ok).length;
      main.innerHTML = `
        <div class="quiz-wrap">
          <div class="quiz-top">
            <div class="grow"><h2 style="margin:0">📝 ${t.icon} ${esc(t.title)}</h2>
              <small style="color:var(--text-muted)">Câu ${run.i + 1} / ${run.list.length} · Đúng ${right}/${done}</small></div>
            <button class="btn" id="quitTest">✕ Thoát</button>
          </div>
          <div class="progress" style="margin-bottom:14px"><i style="width:${pct(run.i, run.list.length)}%"></i></div>
          <div class="flash">
            <span class="badge ${q.level}">${levelLabel[q.level]}</span>
            ${q.multi ? '<span class="badge topic">Chọn nhiều đáp án</span>' : ''}
            <div class="q">${inlineMd(q.q)}</div>
            <div id="stem"></div>
            <div class="options">
              ${item.order.map((oi, k) => `<button class="option" data-i="${oi}">
                <span class="opt-key">${'ABCD'[k] || k + 1}</span><span class="opt-text">${inlineMd(q.options[oi].text)}</span></button>`).join('')}
            </div>
            <div id="explain"></div>
            <div class="quiz-actions">
              <button class="btn primary" id="submitBtn" disabled>Trả lời <span class="kbd">Enter</span></button>
            </div>
          </div>
        </div>`;
      if (q.stem) $('#stem').appendChild(renderMd(q.stem));

      const btns = [...main.querySelectorAll('.option')];
      const submitBtn = $('#submitBtn');
      const pick = (b) => {
        if (run.submitted) return;
        const i = Number(b.dataset.i);
        if (q.multi) { run.picked.has(i) ? run.picked.delete(i) : run.picked.add(i); }
        else { run.picked = new Set([i]); }
        btns.forEach((x) => x.classList.toggle('picked', run.picked.has(Number(x.dataset.i))));
        submitBtn.disabled = !run.picked.size;
      };
      btns.forEach((b) => b.onclick = () => pick(b));

      const submit = () => {
        if (!run.submitted) {
          if (!run.picked.size) return;
          run.submitted = true;
          const correctSet = q.options.map((o, i) => (o.correct ? i : -1)).filter((i) => i >= 0);
          const ok = correctSet.length === run.picked.size && correctSet.every((i) => run.picked.has(i));
          run.answers[run.i] = { ok, picked: [...run.picked] };
          if (ok) delete store.wrong[q.id]; else store.wrong[q.id] = 1;
          save();
          btns.forEach((b) => {
            const i = Number(b.dataset.i);
            b.disabled = true;
            if (q.options[i].correct) b.classList.add('correct');
            else if (run.picked.has(i)) b.classList.add('wrong');
          });
          const ex = document.createElement('div');
          ex.className = 'explain ' + (ok ? 'ok' : 'bad');
          ex.innerHTML = `<b>${ok ? '✔ Chính xác!' : '✘ Chưa đúng.'}</b>`;
          if (q.explain) ex.appendChild(renderMd(q.explain));
          $('#explain').appendChild(ex);
          submitBtn.disabled = false;
          submitBtn.innerHTML = (run.i + 1 < run.list.length ? 'Câu tiếp →' : 'Xem kết quả 🏁') + ' <span class="kbd">Enter</span>';
        } else {
          run.i++; run.picked = new Set(); run.submitted = false;
          run.i < run.list.length ? drawQuestion() : result();
        }
      };
      submitBtn.onclick = submit;
      $('#quitTest').onclick = () => { if (!run.answers.length || confirm('Thoát bài đang làm?')) setupScreen(); };
      testKeys = (e) => {
        if (e.target.matches('input, textarea')) return;
        const n = Number(e.key);
        if (n >= 1 && n <= btns.length) { e.preventDefault(); pick(btns[n - 1]); }
        else if (e.key === 'Enter') { e.preventDefault(); submit(); }
      };
      window.scrollTo(0, 0);
    };

    const result = () => {
      testKeys = null;
      const total = run.list.length;
      const right = run.answers.filter((a) => a.ok).length;
      const score = pct(right, total);
      if (testLevels.some(([v]) => v === run.level)) {
        const tt = (store.tests[t.id] = store.tests[t.id] || {});
        const prev = tt[run.level] || { best: 0, attempts: 0 };
        tt[run.level] = { best: Math.max(prev.best, score), last: score, attempts: prev.attempts + 1, at: Date.now() };
        save();
      }
      const byLevel = ['junior', 'mid', 'senior'].map((l) => {
        const idx = run.list.map((x, i) => (x.q.level === l ? i : -1)).filter((i) => i >= 0);
        return idx.length ? `<div class="stat"><b style="color:var(--${l})">${idx.filter((i) => run.answers[i].ok).length}/${idx.length}</b><span>${levelLabel[l]}</span></div>` : '';
      }).join('');
      const msg = score >= 90 ? 'Xuất sắc! Sẵn sàng phỏng vấn 💪' : score >= 70 ? 'Khá tốt, ôn thêm vài chỗ là ổn 👍' : score >= 50 ? 'Tạm được, nên ôn lại lý thuyết 📖' : 'Cần ôn lại kỹ phần này 🔁';
      const wrongItems = run.list.map((x, i) => ({ ...x, a: run.answers[i] })).filter((x) => !x.a.ok);

      main.innerHTML = `
        <div class="quiz-wrap">
          <div class="flash done">
            <div class="big">${score >= 70 ? '🏆' : score >= 50 ? '🙂' : '📚'}</div>
            <h2 style="margin:6px 0">${right}/${total} câu đúng · ${score}%</h2>
            <p>${msg}</p>
            <div class="stats" style="justify-content:center;margin:16px 0">${byLevel}</div>
            <div class="quiz-actions">
              ${wrongItems.length ? '<button class="btn primary" id="retryWrong">Làm lại câu sai</button>' : ''}
              <button class="btn" id="again">Làm bài mới</button>
              <button class="btn" id="toSetup">Chọn độ khó khác</button>
              <a class="btn" href="#/t/${t.id}">Ôn lý thuyết</a>
            </div>
          </div>
          ${wrongItems.length ? `<h2 class="section-title">Các câu làm sai <small>${wrongItems.length} câu</small></h2><div id="wrongList"></div>` : ''}
        </div>`;
      const wl = $('#wrongList');
      wrongItems.forEach((x, k) => {
        const q = x.q;
        const el = document.createElement('div');
        el.className = 'qa open';
        el.innerHTML = `<div class="qa-head" style="cursor:default"><span class="qa-num">${k + 1}.</span>
          <span class="qa-q">${inlineMd(q.q)}</span><span class="qa-tools"><span class="badge ${q.level}">${levelLabel[q.level]}</span></span></div>
          <div class="qa-body"></div>`;
        const body = $('.qa-body', el);
        if (q.stem) body.appendChild(renderMd(q.stem));
        const ul = document.createElement('div');
        ul.className = 'options review';
        ul.innerHTML = q.options.map((o, i) => `<div class="option ${o.correct ? 'correct' : x.a.picked.includes(i) ? 'wrong' : ''}">
          <span class="opt-key">${o.correct ? '✔' : x.a.picked.includes(i) ? '✘' : '·'}</span><span class="opt-text">${inlineMd(o.text)}</span></div>`).join('');
        body.appendChild(ul);
        if (q.explain) { const ex = document.createElement('div'); ex.className = 'explain'; ex.appendChild(renderMd(q.explain)); body.appendChild(ex); }
        wl.appendChild(el);
      });
      const on = (id, fn) => { const el = $('#' + id); if (el) el.onclick = fn; };
      on('retryWrong', () => start(wrongItems.map((x) => x.q)));
      on('again', () => start());
      on('toSetup', setupScreen);
      renderSidebar(currentRoute);
      window.scrollTo(0, 0);
    };

    setupScreen();
  }

  // ---------- Router ----------
  let currentRoute = { name: 'home' };
  function parse() {
    const parts = decodeURIComponent(location.hash.replace(/^#\/?/, '')).split('/');
    const [a, b, c] = parts;
    if (a === 't' && TOPIC[b]) return { name: 'topic', topic: b, section: c != null && c !== '' ? Number(c) : null };
    if (a === 'quiz' && (b === 'all' || b === 'starred' || TOPIC[b])) return { name: 'quiz', topic: TOPIC[b] ? b : null, scope: b };
    if (a === 'search') return { name: 'search', q: parts.slice(1).join('/') };
    if (a === 'bookmarks') return { name: 'bookmarks' };
    if (a === 'test') return TOPIC[b] ? { name: 'test', topic: b } : { name: 'testhub' };
    return { name: 'home' };
  }
  let lastTopic = null;
  function route() {
    const r = parse();
    currentRoute = r;
    testKeys = null;
    document.body.classList.remove('menu-open');
    renderSidebar(r);
    if (r.name === 'topic') {
      if (lastTopic !== r.topic) { filterState.text = ''; filterState.level = 'all'; filterState.status = 'all'; }
      lastTopic = r.topic;
      viewTopic(TOPIC[r.topic], r.section);
      document.title = TOPIC[r.topic].title + ' · Ôn Phỏng Vấn';
    } else if (r.name === 'quiz') {
      viewQuiz(r.scope);
      document.title = 'Flashcard · Ôn Phỏng Vấn';
    } else if (r.name === 'search') {
      $('#globalSearch').value = r.q;
      if (r.q.trim()) viewSearch(r.q.trim());
      else viewList('Tìm kiếm', 'Nhập từ khóa vào ô tìm kiếm phía trên.', []);
      document.title = 'Tìm kiếm · Ôn Phỏng Vấn';
    } else if (r.name === 'testhub') {
      viewTestHub();
      document.title = 'Trắc nghiệm · Ôn Phỏng Vấn';
    } else if (r.name === 'test') {
      viewTest(TOPIC[r.topic]);
      document.title = 'Trắc nghiệm ' + TOPIC[r.topic].title + ' · Ôn Phỏng Vấn';
    } else if (r.name === 'bookmarks') {
      viewList('⭐ Câu hỏi đã đánh dấu', 'Những câu bạn muốn ôn lại.', ALL.filter((q) => isStarred(q.id)));
      document.title = 'Đánh dấu · Ôn Phỏng Vấn';
    } else {
      viewHome();
      document.title = 'Ôn Phỏng Vấn';
      window.scrollTo(0, 0);
    }
  }
  window.addEventListener('hashchange', route);

  // Global search (debounce)
  let st;
  $('#globalSearch').addEventListener('input', (e) => {
    clearTimeout(st);
    const v = e.target.value;
    st = setTimeout(() => {
      if (v.trim()) history.replaceState(null, '', '#/search/' + encodeURIComponent(v));
      else history.replaceState(null, '', '#/');
      route();
      $('#globalSearch').focus();
    }, 250);
  });
  $('#globalSearch').addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.target.value = ''; e.target.blur(); } });

  // Mobile menu & back-to-top
  $('#menuBtn').onclick = () => document.body.classList.toggle('menu-open');
  $('#backdrop').onclick = () => document.body.classList.remove('menu-open');
  const toTop = $('#toTop');
  window.addEventListener('scroll', () => toTop.classList.toggle('show', scrollY > 600), { passive: true });
  toTop.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });


  // ---------- Đồng bộ MongoDB (qua API) ----------
  // Nguyên tắc: localStorage luôn là nơi lưu chính → API/DB sập vẫn dùng bình thường,
  // thay đổi được đánh dấu "dirty" và tự đẩy lên khi kết nối lại.
  const SYNC_FIELDS = ['learned', 'starred', 'tests', 'wrong'];
  const SYNC_KEY_LS = 'interview-sync-key';
  const SYNC_PROFILE_LS = 'interview-sync-profile';
  const isLocalServer = /^https?:$/.test(location.protocol) && !/github\.io$/.test(location.hostname);
  const API = (window.SYNC_API || (isLocalServer ? '/api' : '')).replace(/\/$/, '');
  const lsGet = (k) => { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } };
  const lsSet = (k, v) => { try { v ? localStorage.setItem(k, v) : localStorage.removeItem(k); } catch (e) { /* ignore */ } };
  let syncKey = lsGet(SYNC_KEY_LS);
  let profile = lsGet(SYNC_PROFILE_LS) || 'default';
  let syncStatus = API ? 'idle' : 'local';
  let syncTimer = null, retryTimer = null, syncing = false, syncAgain = false;
  if (store.syncedAt === undefined && SYNC_FIELDS.some((f) => Object.keys(store[f] || {}).length)) store.dirty = true;

  const syncBtn = $('#syncBtn');
  const STATUS = {
    local:   ['💾', 'Chỉ lưu trên máy', 'Chưa cấu hình API đồng bộ (assets/config.js)'],
    idle:    ['☁️', 'Đã đồng bộ', 'Tiến độ đã lưu lên MongoDB'],
    syncing: ['⏳', 'Đang đồng bộ…', 'Đang đồng bộ với server'],
    pending: ['⏳', 'Chờ đồng bộ', 'Có thay đổi chưa đẩy lên server'],
    offline: ['⚠️', 'Offline', 'Không kết nối được server/DB — đang lưu trên máy, sẽ tự đồng bộ lại'],
    auth:    ['🔑', 'Sai sync key', 'Sync key không đúng — bấm để nhập lại'],
  };
  function setStatus(st) {
    syncStatus = st;
    if (!syncBtn) return;
    const [ico, label, title] = STATUS[st === 'idle' && store.dirty ? 'pending' : st];
    syncBtn.innerHTML = ico + ' <span class="hide-sm">' + label + '</span>';
    syncBtn.title = title + (API ? ' · bấm để đồng bộ ngay' : '');
    syncBtn.dataset.status = st;
  }
  function scheduleSync(delay = 1500) {
    if (!API) return;
    clearTimeout(syncTimer);
    syncTimer = setTimeout(sync, delay);
    if (syncStatus === 'idle') setStatus('idle');
  }
  function scheduleRetry() {
    clearTimeout(retryTimer);
    retryTimer = setTimeout(sync, 60000);
  }
  async function callApi(method, body) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 25000); // đủ cho cold start của serverless
    try {
      const res = await fetch(API + '/progress?profile=' + encodeURIComponent(profile), {
        method,
        headers: Object.assign(syncKey ? { 'X-Sync-Key': syncKey } : {}, body ? { 'Content-Type': 'application/json' } : {}),
        body: body ? JSON.stringify(body) : undefined,
        signal: ctrl.signal,
        cache: 'no-store',
      });
      const json = await res.json().catch(() => ({}));
      return { status: res.status, json };
    } finally {
      clearTimeout(t);
    }
  }
  const pickData = (src) => Object.fromEntries(SYNC_FIELDS.map((f) => [f, (src && src[f]) || {}]));
  // Gộp khi cả máy này và server đều có thay đổi: hợp các đánh dấu, điểm lấy cao nhất.
  function mergeData(a, b) {
    const out = pickData({});
    ['learned', 'starred', 'wrong'].forEach((f) => (out[f] = Object.assign({}, b[f], a[f])));
    out.tests = JSON.parse(JSON.stringify(b.tests || {}));
    Object.entries(a.tests || {}).forEach(([topic, levels]) => {
      out.tests[topic] = out.tests[topic] || {};
      Object.entries(levels).forEach(([lv, x]) => {
        const y = out.tests[topic][lv];
        if (!y) { out.tests[topic][lv] = x; return; }
        const later = (x.at || 0) >= (y.at || 0) ? x : y;
        out.tests[topic][lv] = { best: Math.max(x.best, y.best), attempts: Math.max(x.attempts, y.attempts), last: later.last, at: later.at };
      });
    });
    return out;
  }
  function adopt(data) {
    SYNC_FIELDS.forEach((f) => (store[f] = data[f] || {}));
  }
  async function sync() {
    if (!API) return setStatus('local');
    if (syncing) { syncAgain = true; return; }
    syncing = true;
    clearTimeout(retryTimer);
    setStatus('syncing');
    let changedView = false;
    try {
      for (let attempt = 0; attempt < 3; attempt++) {
        const g = await callApi('GET');
        if (g.status === 401) { setStatus('auth'); return; }
        if (g.status !== 200) throw new Error('HTTP ' + g.status);
        const server = g.json;
        const serverChanged = server.updatedAt !== (store.syncedAt || 0);
        let data;
        if (serverChanged && server.data) {
          if (store.dirty) data = mergeData(pickData(store), pickData(server.data));
          else { adopt(server.data); store.syncedAt = server.updatedAt; persist(); changedView = true; break; }
        } else if (store.dirty) {
          data = pickData(store);
        } else {
          store.syncedAt = server.updatedAt;
          persist();
          break;
        }
        const p = await callApi('PUT', { data, base: server.updatedAt });
        if (p.status === 401) { setStatus('auth'); return; }
        if (p.status === 409) continue; // máy khác vừa ghi → đọc lại và gộp
        if (p.status !== 200) throw new Error('HTTP ' + p.status);
        if (serverChanged) { adopt(data); changedView = true; }
        store.syncedAt = p.json.updatedAt;
        store.dirty = false;
        persist();
        break;
      }
      setStatus('idle');
      // Không vẽ lại khi đang làm flashcard/trắc nghiệm để khỏi cắt ngang bài
      if (changedView && !['quiz', 'test'].includes(currentRoute.name)) route();
      else renderSidebar(currentRoute);
    } catch (err) {
      setStatus('offline');
      scheduleRetry();
    } finally {
      syncing = false;
      if (syncAgain) { syncAgain = false; scheduleSync(300); }
    }
  }
  function askKey() {
    const k = prompt('Server yêu cầu sync key (SYNC_KEY cấu hình trên server):', syncKey);
    if (k === null) return;
    syncKey = k.trim();
    lsSet(SYNC_KEY_LS, syncKey);
    if (!syncKey) return;
    const p = prompt('Tên profile (dùng cùng tên trên các máy để chung tiến độ):', profile);
    if (p && /^[a-zA-Z0-9_-]{1,40}$/.test(p.trim()) && p.trim() !== profile) {
      profile = p.trim();
      lsSet(SYNC_PROFILE_LS, profile);
      store.syncedAt = undefined;
      store.dirty = true;
      persist();
    }
    sync();
  }
  if (syncBtn) {
    if (!API) syncBtn.style.display = 'none';
    syncBtn.onclick = (e) => {
      if (syncStatus === 'auth' || e.shiftKey) askKey();
      else sync();
    };
  }
  window.addEventListener('online', () => sync());
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') sync(); });
  setStatus(syncStatus);

  route();
  sync();
})();

