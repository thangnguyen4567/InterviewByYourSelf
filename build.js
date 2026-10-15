// Build: đọc content/*.md -> assets/content.js (window.INTERVIEW_DATA)
// Chạy: node build.js   (hoặc: node build.js --watch)
const fs = require('fs');
const path = require('path');

const CONTENT_DIR = path.join(__dirname, 'content');
const OUT_FILE = path.join(__dirname, 'assets', 'content.js');
const LEVELS = ['junior', 'mid', 'senior'];

function hash(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

function parseFrontMatter(text) {
  const meta = {};
  const m = text.match(/^﻿?---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { meta, body: text };
  for (const line of m[1].split(/\r?\n/)) {
    const idx = line.indexOf(':');
    if (idx > 0) meta[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  return { meta, body: text.slice(m[0].length) };
}

function parseTopic(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const { meta, body } = parseFrontMatter(raw);
  const topic = {
    id: meta.id || path.basename(file, '.md'),
    title: meta.title || meta.id,
    icon: meta.icon || '📘',
    order: Number(meta.order) || 99,
    description: meta.description || '',
    sections: [],
  };

  let section = null;
  let question = null;
  let inFence = false;
  const warnings = [];

  const flush = () => {
    if (question) {
      question.answer = question.answer.join('\n').trim();
      question = null;
    }
  };

  for (const line of body.split(/\r?\n/)) {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;

    if (!inFence && /^# (?!#)/.test(line)) {
      flush();
      section = { title: line.slice(2).trim(), questions: [] };
      topic.sections.push(section);
      continue;
    }
    if (!inFence && /^## (?!#)/.test(line)) {
      flush();
      if (!section) {
        section = { title: 'Chung', questions: [] };
        topic.sections.push(section);
      }
      let q = line.slice(3).trim();
      let level = 'mid';
      const lm = q.match(/\s*\[(junior|mid|senior)\]\s*$/i);
      if (lm) {
        level = lm[1].toLowerCase();
        q = q.slice(0, lm.index).trim();
      } else {
        warnings.push(`thiếu level: "${q}"`);
      }
      question = { id: topic.id + '-' + hash(q), q, level, answer: [] };
      section.questions.push(question);
      continue;
    }
    if (question) question.answer.push(line);
  }
  flush();
  if (inFence) warnings.push('code fence chưa đóng');
  topic.sections = topic.sections.filter((s) => s.questions.length);
  return { topic, warnings };
}

// Quiz trắc nghiệm: content/quiz/<topic>.md
function parseQuiz(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const { meta, body } = parseFrontMatter(raw);
  const topicId = meta.topic || path.basename(file, '.md');
  const questions = [];
  const warnings = [];
  let cur = null;
  let inFence = false;

  const flush = () => {
    if (!cur) return;
    cur.stem = cur.stem.join('\n').trim();
    cur.explain = cur.explain.join('\n').trim();
    if (cur.options.length < 2) warnings.push(`ít hơn 2 đáp án: "${cur.q}"`);
    if (!cur.options.some((o) => o.correct)) warnings.push(`không có đáp án đúng: "${cur.q}"`);
    cur.multi = cur.options.filter((o) => o.correct).length > 1;
    questions.push(cur);
    cur = null;
  };

  for (const line of body.split(/\r?\n/)) {
    const fenceLine = /^\s*(```|~~~)/.test(line);
    if (!inFence && !fenceLine && /^## (?!#)/.test(line)) {
      flush();
      let q = line.slice(3).trim();
      let level = 'mid';
      const lm = q.match(/\s*\[(junior|mid|senior)\]\s*$/i);
      if (lm) { level = lm[1].toLowerCase(); q = q.slice(0, lm.index).trim(); }
      else warnings.push(`thiếu level: "${q}"`);
      cur = { id: 'mcq-' + topicId + '-' + hash(q), q, level, stem: [], options: [], explain: [] };
      continue;
    }
    if (fenceLine) inFence = !inFence;
    if (!cur) continue;
    const om = !inFence && !fenceLine && line.match(/^\s*[-*] \[( |x|X)\] (.*)$/);
    if (om) {
      cur.options.push({ text: om[2].trim(), correct: om[1].toLowerCase() === 'x' });
    } else if (!cur.options.length) {
      cur.stem.push(line);
    } else if (!inFence && /^\s*>/.test(line)) {
      cur.explain.push(line.replace(/^\s*> ?/, ''));
    } else if (cur.explain.length) {
      cur.explain.push(line);
    }
  }
  flush();
  if (inFence) warnings.push('code fence chưa đóng');
  return { topicId, questions, warnings };
}

function build() {
  const files = fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith('.md'))
    .map((f) => path.join(CONTENT_DIR, f));

  const topics = [];
  for (const file of files) {
    const { topic, warnings } = parseTopic(file);
    const count = topic.sections.reduce((n, s) => n + s.questions.length, 0);
    console.log(`✔ ${path.basename(file)}: ${topic.sections.length} sections, ${count} câu hỏi`);
    warnings.forEach((w) => console.warn(`   ⚠ ${w}`));
    topics.push(topic);
  }
  topics.sort((a, b) => a.order - b.order);

  const quiz = {};
  const QUIZ_DIR = path.join(CONTENT_DIR, 'quiz');
  if (fs.existsSync(QUIZ_DIR)) {
    for (const f of fs.readdirSync(QUIZ_DIR).filter((f) => f.endsWith('.md'))) {
      const { topicId, questions, warnings } = parseQuiz(path.join(QUIZ_DIR, f));
      const by = (l) => questions.filter((q) => q.level === l).length;
      console.log(`✔ quiz/${f}: ${questions.length} câu trắc nghiệm (J ${by('junior')} · M ${by('mid')} · S ${by('senior')})`);
      if (!topics.some((t) => t.id === topicId)) console.warn(`   ⚠ topic "${topicId}" không tồn tại`);
      warnings.forEach((w) => console.warn(`   ⚠ ${w}`));
      quiz[topicId] = (quiz[topicId] || []).concat(questions);
    }
  }
  const totalQuiz = Object.values(quiz).reduce((n, a) => n + a.length, 0);

  const js =
    '// File được sinh tự động bởi build.js — đừng sửa tay, hãy sửa content/*.md\n' +
    'window.INTERVIEW_DATA = ' + JSON.stringify(topics) + ';\n' +
    'window.INTERVIEW_QUIZ = ' + JSON.stringify(quiz) + ';\n' +
    'window.INTERVIEW_BUILT_AT = ' + JSON.stringify(new Date().toISOString()) + ';\n';
  fs.writeFileSync(OUT_FILE, js, 'utf8');
  const total = topics.reduce((n, t) => n + t.sections.reduce((m, s) => m + s.questions.length, 0), 0);
  console.log(`\n→ ${path.relative(__dirname, OUT_FILE)}: ${topics.length} chủ đề, ${total} câu hỏi, ${totalQuiz} câu trắc nghiệm`);
}

build();

if (process.argv.includes('--watch')) {
  console.log('Đang theo dõi thay đổi trong content/ ...');
  let timer;
  fs.watch(CONTENT_DIR, { recursive: true }, () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      try { build(); } catch (e) { console.error(e); }
    }, 200);
  });
}
