import { TypingTest } from './typing-engine.js';
import { createPassage, randomWords, lessons, quotes } from './passages.js';

const storageKey = 'typingstreak-v2';
const blank = { history: [], bestWpm: 0, xp: 0, streak: 0, lastDay: '', lessons: [], errorsByKey: {}, goalMinutes: 10, displayName: 'Your practice desk' };
let state = loadState();
let page = 'home';
let mode = 'normal';
let testKind = 'time';
let duration = 30;
let wordCount = 25;
let passage = '';
let test;
let selectedLesson = null;
let deferredInstall = null;
let gameName = 'Word sprint';
const view = document.querySelector('#view');
const toast = document.querySelector('#toast');

function loadState() {
  try { return { ...blank, ...JSON.parse(localStorage.getItem(storageKey) || '{}') }; }
  catch { return { ...blank }; }
}
function save() { localStorage.setItem(storageKey, JSON.stringify(state)); }
function esc(value) { return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]); }
function todayKey(date = new Date()) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
function toastMessage(message) { toast.textContent = message; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 2300); }
function navigate(next) { page = next; location.hash = next; render(); }
function averageWpm() { return state.history.length ? Math.round(state.history.reduce((sum, run) => sum + run.wpm, 0) / state.history.length) : 0; }
function testsToday() { return state.history.filter((run) => run.day === todayKey()).length; }
function minutesToday() { return Math.floor(state.history.filter((run) => run.day === todayKey()).reduce((sum, run) => sum + (run.seconds || run.minutes * 60), 0) / 60); }
function header(title, eyebrow, description = '') { return `<section class="welcome-row"><div><div class="eyebrow"><span class="eyebrow-line"></span>${eyebrow}</div><h1>${title}</h1>${description ? `<p class="welcome-copy">${description}</p>` : ''}</div><div class="date-pill">☼ &nbsp;${new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date()).toUpperCase()}</div></section>`; }
function statCard(label, value, suffix, note, primary = false) { return `<article class="summary-card ${primary ? 'primary-summary' : ''}"><div class="summary-top"><span class="summary-label">${label}</span><span class="summary-icon">${primary ? '↗' : '✳'}</span></div><div class="summary-value"><span>${value}</span><small>${suffix}</small></div><div class="summary-footer">${note}</div></article>`; }

function homePage() {
  return `${header('Find your <em>rhythm.</em>', 'YOUR PRACTICE SPACE', 'A little practice goes a long way. Settle in and make today count.')}
    <section class="dashboard-grid">${statCard('BEST SPEED', state.bestWpm || '—', 'WPM', state.bestWpm ? 'Your personal best so far' : 'Your best is still ahead', true)}${statCard('TYPED TODAY', minutesToday(), 'min', 'Your daily goal: ' + state.goalMinutes + ' min')}${statCard('CURRENT STREAK', state.streak, 'days', `${state.xp} XP earned`)}</section>
    <section class="home-feature"><div class="feature-intro"><div class="eyebrow"><span class="eyebrow-line"></span> START PRACTICING</div><h2>Pick up where you are.</h2><p>Choose a focused test, build fundamentals, or make practice a game.</p><button class="button-primary" data-go="practice">Start a typing test <span>→</span></button></div><div class="feature-tiles"><button class="feature-tile" data-go="courses"><span>▤</span><strong>Learn</strong><small>Lessons for every level</small></button><button class="feature-tile" data-go="games"><span>◈</span><strong>Play</strong><small>Quick typing games</small></button><button class="feature-tile" data-go="adaptive"><span>⌁</span><strong>Improve</strong><small>Train tricky keys</small></button></div></section>
    <section class="home-lower"><article class="panel"><div class="panel-heading"><div><div class="eyebrow">YOUR RECENT PRACTICE</div><h2>Small wins add up.</h2></div><button class="text-button" data-go="stats">See progress →</button></div>${recentRuns(4)}</article><article class="panel daily-panel"><div class="eyebrow">DAILY GOAL</div><h2>${minutesToday()} <small>/ ${state.goalMinutes} min</small></h2><div class="progress-track"><span style="width:${Math.min(100, minutesToday() / Math.max(1, state.goalMinutes) * 100)}%"></span></div><p>Practice a little today to keep your streak growing.</p><button class="text-button" data-go="achievements">View achievements →</button></article></section>`;
}

function recentRuns(count = 8) {
  if (!state.history.length) return '<div class="empty-state">Your first completed practice will appear here.</div>';
  return `<div class="run-list">${state.history.slice(0, count).map((run) => `<div class="run-row"><span class="run-mode">${esc(run.label)}</span><span>${run.wpm} WPM</span><span>${run.accuracy}% acc</span><span>${new Date(`${run.day}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span></div>`).join('')}</div>`;
}

function testPage() {
  const labels = { normal: 'Thoughtful sentences, everyday punctuation.', informal: 'Casual messages with a little personality.', coding: 'Code inspired lines with symbols and syntax.', punctuation: 'A focused run of punctuation, numbers, and symbols.' };
  const kinds = [['time', 'Time'], ['words', 'Words'], ['quote', 'Quote'], ['custom', 'Custom']];
  return `${header('Ready when you are.', 'THE DAILY REP', 'Pick a practice style and settle into a steady pace.')}
    <div class="practice-layout"><div class="practice-main"><div class="test-card">
      <div class="test-toolbar"><div class="mode-tabs">${['normal', 'informal', 'coding', 'punctuation'].map((item) => `<button class="mode-tab ${mode === item ? 'selected' : ''}" data-mode="${item}">${item[0].toUpperCase() + item.slice(1)}</button>`).join('')}</div></div>
      <div class="test-kind-row">${kinds.map(([key, label]) => `<button class="kind-pill ${testKind === key ? 'selected' : ''}" data-kind="${key}">${label}</button>`).join('')}</div>
      ${testKind === 'time' ? `<div class="duration-control">${[15, 30, 60, 120, 300].map((seconds) => `<button class="duration-option ${duration === seconds ? 'selected' : ''}" data-duration="${seconds}">${seconds < 60 ? seconds + 's' : seconds / 60 + 'm'}</button>`).join('')}<button class="duration-option" data-action="custom-time">Custom</button></div>` : ''}
      ${testKind === 'words' ? `<div class="duration-control">${[10, 25, 50, 100].map((words) => `<button class="duration-option ${wordCount === words ? 'selected' : ''}" data-words="${words}">${words} words</button>`).join('')}</div>` : ''}
      ${testKind === 'custom' ? `<label class="custom-label">Your passage<textarea id="custom-text" rows="3" placeholder="Paste or write text to practice…">${esc(passage && !['normal', 'informal', 'coding', 'punctuation'].includes(testKind) ? passage : '')}</textarea></label><button class="button-secondary" data-action="load-custom">Use this passage</button>` : ''}
      ${testKind === 'quote' ? `<div class="quote-credit">Original quote practice · Choose another from below</div><button class="text-button" data-action="new-quote">↻ New quote</button>` : ''}
      <div class="metrics-row"><div class="metric"><span class="metric-name">TIME</span><strong id="timer">${testKind === 'time' ? duration : '∞'}<span>${testKind === 'time' ? 's' : ''}</span></strong></div><div class="metric"><span class="metric-name">WPM</span><strong id="wpm">0</strong></div><div class="metric"><span class="metric-name">ACCURACY</span><strong id="accuracy">100<span>%</span></strong></div><div class="metric"><span class="metric-name">ERRORS</span><strong id="errors">0</strong></div><button class="reset-button" data-action="reset" title="Restart test (Escape)">↺</button></div>
      <button class="typing-area" id="typing-area"><div class="passage" id="passage"></div><div class="typing-prompt" id="typing-prompt"><span class="prompt-key">↵</span><span>Click here or press <kbd>Enter</kbd> to begin typing</span></div></button><textarea id="typing-input" class="typing-input" aria-label="Type the passage here" autocomplete="off" autocapitalize="off" spellcheck="false"></textarea>
      <div class="test-footer"><span class="mode-description">${labels[mode]}</span><span class="shortcut-hint"><kbd>esc</kbd> restart</span></div>
    </div></div><aside class="side-column"><article class="focus-card"><div class="focus-spark">✳</div><div class="eyebrow">A SMALL REMINDER</div><h3>Accuracy first.<br><em>Speed will follow.</em></h3><p>Relax your hands, look ahead, and let each keystroke land.</p></article><article class="next-card"><div class="eyebrow">PRACTICE TIPS</div><p>Backspace is allowed. Your accuracy updates as you correct mistakes.</p><p>WPM counts five characters as one standard word.</p></article></aside></div>`;
}

function coursesPage() {
  const groups = ['Beginner', 'Intermediate', 'Advanced'];
  return `${header('Build skill <em>step by step.</em>', 'LEARNING PATHS', 'Original lessons take you from the home row to confident, accurate typing.')}
    <div class="course-levels">${groups.map((level) => `<section class="panel course-level"><div class="panel-heading"><div><div class="eyebrow">${level === 'Beginner' ? 'START HERE' : 'NEXT CHAPTER'}</div><h2>${level}</h2></div><span class="level-count">${lessons[level].filter((lesson) => state.lessons.includes(lesson.id)).length} / ${lessons[level].length} complete</span></div><div class="lesson-grid">${lessons[level].map((lesson, index) => `<button class="lesson-card ${state.lessons.includes(lesson.id) ? 'done' : ''}" data-lesson="${lesson.id}"><span class="lesson-number">${String(index + 1).padStart(2, '0')}</span><span><strong>${lesson.title}</strong><small>${lesson.description}</small></span><span class="lesson-status">${state.lessons.includes(lesson.id) ? '✓' : '→'}</span></button>`).join('')}</div></section>`).join('')}</div>`;
}

function gamesPage() {
  return `${header('Practice can be <em>play.</em>', 'TYPING GAMES', 'Short challenges give your fingers a different kind of workout.')}
    <div class="game-grid">${[['Word sprint', 'Type as many words as you can before the clock runs out.', '⌁', '60 second round'], ['Symbol shuffle', 'Practice brackets, operators, and punctuation in a quick code-like sequence.', '{}', 'Coding mode'], ['Accuracy streak', 'Build a run of correct words. Mistakes reset your current streak.', '✳', 'Focus on precision']].map(([name, description, icon, badge]) => `<article class="game-card"><div class="game-art">${icon}</div><span class="game-badge">${badge}</span><h2>${name}</h2><p>${description}</p><button class="button-primary" data-game="${name}">Play now <span>→</span></button></article>`).join('')}</div><article class="panel game-score"><div class="eyebrow">YOUR PLAY HISTORY</div><h2>Personal game records</h2>${recentRuns(5)}</article>`;
}

function adaptivePage() {
  const sorted = Object.entries(state.errorsByKey).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const focusText = sorted.length ? sorted.map(([key]) => key).join('') : 'asdfjkl;';
  return `${header('Give tricky keys <em>some love.</em>', 'ADAPTIVE PRACTICE', 'TypingStreak tracks missed characters and builds a focused drill from your own practice.')}
    <section class="adaptive-layout"><article class="panel focus-keys"><div class="eyebrow">YOUR FOCUS KEYS</div><h2>${sorted.length ? 'Keys to revisit' : 'Your first drill is ready'}</h2><div class="key-cloud">${(sorted.length ? sorted : [...focusText].map((key) => [key, 0])).map(([key, count]) => `<div class="key-stat"><kbd>${esc(key === ' ' ? 'space' : key)}</kbd><small>${count} misses</small></div>`).join('')}</div><p>${sorted.length ? 'These characters were missed most often in completed practice.' : 'Complete a few tests to get a drill tailored to the keys you find hardest.'}</p><button class="button-primary" data-action="start-adaptive">Start my focused drill <span>→</span></button></article><article class="panel"><div class="eyebrow">HOW IT WORKS</div><h2>Practice shaped around you.</h2><p>Each test records which characters were mistyped. Focus drills reuse those characters in short original combinations so you can practice them deliberately.</p><div class="adaptive-note">Your typing data stays in this browser. Resetting browser storage clears it.</div></article></section>`;
}

function statsPage() {
  const recent = state.history.slice(0, 7).reverse();
  const max = Math.max(1, ...recent.map((run) => run.wpm));
  const week = Array.from({ length: 7 }, (_, index) => { const date = new Date(); date.setDate(date.getDate() - 6 + index); const key = todayKey(date); return { key, label: new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(date), count: state.history.filter((run) => run.day === key).length }; });
  return `${header('Progress you can <em>feel.</em>', 'YOUR STATISTICS', 'A personal view of how your speed, accuracy, and consistency are growing.')}
    <section class="dashboard-grid">${statCard('PERSONAL BEST', state.bestWpm || '—', 'WPM', 'Fastest completed practice', true)}${statCard('AVERAGE SPEED', averageWpm(), 'WPM', `Across ${state.history.length} completed runs`)}${statCard('TOTAL XP', state.xp, 'XP', `${state.streak} day current streak`)}</section>
    <section class="stats-grid"><article class="panel"><div class="eyebrow">RECENT SPEED</div><h2>WPM by practice</h2>${recent.length ? `<div class="bar-chart">${recent.map((run) => `<div class="bar-column"><span>${run.wpm}</span><i style="height:${Math.max(5, run.wpm / max * 100)}%"></i><small>${esc(run.day.slice(5))}</small></div>`).join('')}</div>` : '<div class="empty-state">Complete a test to start your chart.</div>'}</article><article class="panel"><div class="eyebrow">CONSISTENCY</div><h2>Practice this week</h2><div class="week-grid">${week.map((day) => `<div class="week-day"><span>${day.label}</span><i class="${day.count ? 'practiced' : ''}">${day.count || ''}</i></div>`).join('')}</div><p class="muted-copy">${testsToday()} tests finished today · ${minutesToday()} practice minutes</p></article></section>
    <article class="panel history-panel"><div class="panel-heading"><div><div class="eyebrow">ALL COMPLETED RUNS</div><h2>Practice history</h2></div><button class="text-button" data-action="export">Export my data ↓</button></div>${recentRuns(30)}</article>`;
}

function achievementsPage() {
  const achievements = [
    ['first-test', 'First steps', 'Finish your first typing test.', state.history.length >= 1, '⌨'],
    ['five-tests', 'Finding a rhythm', 'Complete five practice runs.', state.history.length >= 5, '↗'],
    ['accurate', 'Steady hands', 'Finish a test with at least 98% accuracy.', state.history.some((run) => run.accuracy >= 98), '◎'],
    ['speed-40', 'Quick fingers', 'Reach 40 WPM in a completed test.', state.bestWpm >= 40, '⚡'],
    ['lessons-3', 'Curious learner', 'Complete three lessons.', state.lessons.length >= 3, '▤'],
    ['streak-3', 'Three day spark', 'Practice on three days in a row.', state.streak >= 3, '✳'],
  ];
  return `${header('Every milestone <em>counts.</em>', 'ACHIEVEMENTS', 'Earn XP and collect milestones as you build a lasting practice habit.')}
    <section class="achievement-summary panel"><span class="achievement-mark">✳</span><div><div class="eyebrow">YOUR EXPERIENCE</div><h2>${state.xp} XP <small>· Level ${Math.floor(state.xp / 100) + 1}</small></h2><div class="progress-track"><span style="width:${state.xp % 100}%"></span></div></div><div class="leaderboard-note"><strong>Personal leaderboard</strong><small>Your best: ${state.bestWpm || 0} WPM · Personal data only</small></div></section>
    <div class="achievement-grid">${achievements.map(([id, name, description, unlocked, icon]) => `<article class="achievement-card ${unlocked ? 'unlocked' : ''}"><span class="achievement-icon">${icon}</span><div><strong>${name}</strong><p>${description}</p><small>${unlocked ? 'UNLOCKED' : 'LOCKED'}</small></div></article>`).join('')}</div>`;
}

function settingsPage() {
  return `${header('Make this desk <em>yours.</em>', 'SETTINGS', 'Choose a daily practice target and manage your saved progress.')}
    <section class="panel settings-panel"><div class="eyebrow">DAILY PRACTICE GOAL</div><h2>How many minutes would you like to practice?</h2><form id="goal-form" class="goal-form"><label for="goal-minutes">Minutes per day</label><input id="goal-minutes" type="number" min="1" max="180" value="${state.goalMinutes}" /><button class="button-primary" type="submit">Save goal <span>→</span></button></form></section>
    <section class="panel settings-panel"><div class="eyebrow">YOUR LOCAL PROFILE</div><h2>Progress lives in this browser.</h2><p>Runs, lesson completions, XP, and your focus-key counts are stored on this device. There are no accounts or cloud sync in this version.</p><button class="button-secondary" data-action="export">Download a backup</button></section>
    <section class="panel settings-panel"><div class="eyebrow">HOME SCREEN</div><h2>Use TypingStreak like an app.</h2><p>Install this website from your browser menu to keep it close at hand. A live operating-system widget requires a separate native app integration, which browsers cannot provide from a local website alone.</p><button class="button-secondary" data-action="install">Install / add to home screen</button></section>`;
}

function render() {
  const pages = { home: ['Home', homePage], practice: ['Practice', testPage], courses: ['Learning paths', coursesPage], games: ['Typing games', gamesPage], adaptive: ['Focus keys', adaptivePage], stats: ['Progress', statsPage], achievements: ['Achievements', achievementsPage], settings: ['Settings', settingsPage] };
  if (!pages[page]) page = 'home';
  if (page !== 'practice' && test) test.reset();
  if (page !== 'practice' && selectedLesson) { selectedLesson = null; testKind = 'time'; passage = ''; }
  document.querySelector('#page-name').textContent = pages[page][0];
  document.querySelectorAll('.nav-item').forEach((item) => item.classList.toggle('active', item.dataset.page === page));
  document.querySelector('#sidebar-streak').textContent = `${state.streak} day${state.streak === 1 ? '' : 's'} streak`;
  view.innerHTML = pages[page][1]();
  if (page === 'practice') setupTest();
  if (page === 'games' && gameName) { /* game starts only after the player chooses one */ }
}

function setPassage(nextPassage, nextDuration = 60, kind = 'time', label = mode) {
  test?.reset();
  passage = nextPassage;
  testKind = kind;
  duration = nextDuration;
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setupTest() {
  const area = document.querySelector('#typing-area');
  if (!area) return;
  test?.reset();
  const input = document.querySelector('#typing-input');
  const text = testKind === 'quote' ? (passage || quotes[0]) : testKind === 'words' ? randomWords(mode, wordCount) : testKind === 'custom' ? (passage || createPassage(mode)) : testKind === 'adaptive' ? (passage || createAdaptiveText()) : passage || createPassage(mode);
  passage = text;
  const maxTime = testKind === 'time' ? duration : testKind === 'game' ? duration : 0;
  const timer = document.querySelector('#timer');
  if (timer && !maxTime) timer.innerHTML = '∞';
  const renderText = (typed = '') => {
    const holder = document.querySelector('#passage');
    if (!holder) return;
    holder.replaceChildren();
    [...passage].forEach((character, index) => {
      const span = document.createElement('span'); span.className = 'char'; span.textContent = character;
      if (index < typed.length) span.classList.add(typed[index] === character ? 'correct' : 'incorrect');
      else if (index === typed.length && test?.status === 'running') span.classList.add('current');
      holder.append(span);
    });
  };
  const update = (metrics) => {
    const timerEl = document.querySelector('#timer');
    if (timerEl && maxTime) timerEl.innerHTML = `${metrics.remaining}<span>s</span>`;
    document.querySelector('#wpm').textContent = metrics.wpm;
    document.querySelector('#accuracy').innerHTML = `${metrics.accuracy}<span>%</span>`;
    document.querySelector('#errors').textContent = metrics.errors;
    renderText(test.typed);
  };
  const complete = (metrics) => saveRun(metrics);
  test = new TypingTest({ duration: maxTime || 3600, passage, onUpdate: update, onComplete: complete, timed: Boolean(maxTime) });
  renderText(); update(test.metrics);
  const begin = () => { if (test.status === 'idle') { test.start(); document.querySelector('#typing-prompt').classList.add('hidden'); } if (test.status !== 'finished') input.focus({ preventScroll: true }); };
  area.addEventListener('click', begin);
  input.addEventListener('input', () => { if (test.status === 'idle') begin(); test.type(input.value); if (test.status === 'finished') input.blur(); });
  document.querySelector('[data-action="reset"]')?.addEventListener('click', () => { input.value = ''; setupTest(); });
  document.querySelectorAll('[data-mode]').forEach((button) => button.addEventListener('click', () => { mode = button.dataset.mode; testKind = 'time'; passage = ''; render(); }));
  document.querySelectorAll('[data-kind]').forEach((button) => button.addEventListener('click', () => { testKind = button.dataset.kind; passage = ''; render(); }));
  document.querySelectorAll('[data-duration]').forEach((button) => button.addEventListener('click', () => { duration = Number(button.dataset.duration); passage = ''; render(); }));
  document.querySelectorAll('[data-words]').forEach((button) => button.addEventListener('click', () => { wordCount = Number(button.dataset.words); passage = ''; render(); }));
  document.querySelector('[data-action="load-custom"]')?.addEventListener('click', () => { const custom = document.querySelector('#custom-text').value.trim(); if (custom.length < 10) return toastMessage('Add at least 10 characters for a custom passage.'); passage = custom; setupTest(); });
  document.querySelector('[data-action="new-quote"]')?.addEventListener('click', () => { passage = quotes[Math.floor(Math.random() * quotes.length)]; setupTest(); });
}

function saveRun(metrics) {
  const elapsed = test.duration - metrics.remaining;
  const day = todayKey();
  const label = testKind === 'game' ? gameName : `${mode[0].toUpperCase() + mode.slice(1)} · ${testKind}`;
  if (selectedLesson && !state.lessons.includes(selectedLesson.id)) {
    state.lessons.push(selectedLesson.id);
    state.xp += 20;
  }
  state.history.unshift({ day, wpm: metrics.wpm, accuracy: metrics.accuracy, errors: metrics.errors, seconds: Math.max(1, elapsed), minutes: Math.max(1, Math.round(elapsed / 60)), label, characters: metrics.typed });
  state.bestWpm = Math.max(state.bestWpm, metrics.wpm);
  state.xp += Math.max(5, Math.round(metrics.wpm / 2) + (metrics.accuracy >= 95 ? 5 : 0));
  if (state.lastDay !== day) {
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    state.streak = state.lastDay === todayKey(yesterday) ? state.streak + 1 : 1;
    state.lastDay = day;
  }
  [...passage].forEach((character, index) => { if (test.typed[index] !== character) state.errorsByKey[character] = (state.errorsByKey[character] || 0) + 1; });
  save();
  selectedLesson = null;
  toastMessage(`Practice complete · +${Math.max(5, Math.round(metrics.wpm / 2) + (metrics.accuracy >= 95 ? 5 : 0))} XP`);
  const prompt = document.querySelector('#typing-prompt');
  if (prompt) { prompt.innerHTML = '<span class="prompt-key">✓</span><span>Nice work. Reset to go again.</span>'; prompt.classList.remove('hidden'); }
}

function createAdaptiveText() {
  const keys = Object.entries(state.errorsByKey).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([key]) => key);
  const sample = keys.length ? keys.join('') : 'asdfjkl;';
  return Array.from({ length: 28 }, (_, index) => Array.from({ length: 3 + index % 3 }, () => sample[Math.floor(Math.random() * sample.length)]).join('')).join(' ');
}

function startLesson(id) {
  const lesson = Object.values(lessons).flat().find((item) => item.id === id);
  if (!lesson) return;
  selectedLesson = lesson;
  mode = lesson.mode;
  testKind = 'lesson';
  page = 'practice';
  location.hash = 'practice';
  setPassage(lesson.text, 3600, 'lesson', `Lesson · ${lesson.title}`);
  document.querySelector('.mode-description').textContent = `Lesson: ${lesson.title}. Type the full exercise to complete it.`;
}

function beginGame(name) {
  gameName = name;
  let gameMode = name === 'Symbol shuffle' ? 'coding' : 'normal';
  if (name === 'Accuracy streak') gameMode = 'punctuation';
  mode = gameMode;
  page = 'practice';
  location.hash = 'practice';
  const text = name === 'Symbol shuffle' ? randomWords('coding', 70) : name === 'Accuracy streak' ? createPassage('punctuation') : randomWords('normal', 70);
  testKind = 'game';
  setPassage(text, 60, 'game');
  const description = document.querySelector('.mode-description');
  if (description) description.textContent = `${name}: finish as much as you can in 60 seconds.`;
}

document.addEventListener('click', (event) => {
  const link = event.target.closest('[data-go]'); if (link) navigate(link.dataset.go);
  const lesson = event.target.closest('[data-lesson]'); if (lesson) startLesson(lesson.dataset.lesson);
  const game = event.target.closest('[data-game]'); if (game) beginGame(game.dataset.game);
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (action === 'start-adaptive') { mode = 'normal'; testKind = 'adaptive'; navigate('practice'); passage = createAdaptiveText(); render(); }
  if (action === 'export') { const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'typingstreak-progress.json'; link.click(); URL.revokeObjectURL(link.href); }
  if (action === 'install') document.querySelector('#install-button').click();
  if (action === 'custom-time') {
    const value = Number(window.prompt('Choose a test length in seconds (15–3600):', '90'));
    if (Number.isInteger(value) && value >= 15 && value <= 3600) { duration = value; testKind = 'time'; passage = ''; render(); }
    else if (!Number.isNaN(value)) toastMessage('Choose a whole number from 15 to 3600 seconds.');
  }
});
document.addEventListener('submit', (event) => {
  if (event.target.id !== 'goal-form') return;
  event.preventDefault();
  state.goalMinutes = Math.max(1, Math.min(180, Number(document.querySelector('#goal-minutes').value) || 10));
  save(); render(); toastMessage('Daily goal saved.');
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && page === 'practice') { document.querySelector('#typing-input')?.blur(); test?.reset(); setupTest(); }
  if (event.key === 'Enter' && page === 'practice' && test?.status === 'idle' && !['TEXTAREA', 'INPUT', 'BUTTON'].includes(document.activeElement.tagName)) document.querySelector('#typing-area')?.click();
});
window.addEventListener('hashchange', () => { page = location.hash.slice(1) || 'home'; render(); });
window.addEventListener('beforeinstallprompt', (event) => { event.preventDefault(); deferredInstall = event; document.querySelector('#install-button').hidden = false; });
document.querySelector('#install-button').addEventListener('click', async () => { if (deferredInstall) { deferredInstall.prompt(); deferredInstall = null; } else toastMessage('Use your browser menu to add this site to your home screen.'); });
page = location.hash.slice(1) || 'home';
render();
