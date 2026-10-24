/* memory-match-bd — UI wiring (DOM). Plain script; uses MMBLogic / MMBWords / MMBI18n. */
'use strict';

(function () {
  var LEVELS = MMBLogic.LEVELS;
  var buildDeck = MMBLogic.buildDeck;
  var starRating = MMBLogic.starRating;
  var formatTime = MMBLogic.formatTime;
  var MemoryEngine = MMBLogic.MemoryEngine;
  var WORD_PAIRS = MMBWords.WORD_PAIRS;
  var ICON_POOL = MMBWords.ICON_POOL;
  var t = MMBI18n.t;

  var FLIP_BACK_MS = 800;

  var state = {
    lang: 'en',
    level: 'easy',
    mode: 'words',
    engine: null,
    deck: [],
    lock: false,
    timerId: null,
    elapsed: 0,
  };
  try { state.lang = localStorage.getItem('mmb-lang') || 'en'; } catch (e) { /* storage unavailable */ }

  function $(id) { return document.getElementById(id); }
  var board = $('board');

  function bestKey() { return 'mmb-best-' + state.mode + '-' + state.level; }

  function loadBest() {
    try {
      var raw = localStorage.getItem(bestKey());
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function saveBest(rec) {
    try { localStorage.setItem(bestKey(), JSON.stringify(rec)); } catch (e) { /* ignore */ }
  }

  function bestLine() {
    var b = loadBest();
    return b ? (t(state.lang, 'moves') + ' ' + b.moves + ' · ' + b.time) : t(state.lang, 'noBest');
  }

  function applyLang() {
    document.documentElement.lang = state.lang === 'bn' ? 'bn' : 'en';
    $('tagline').textContent = t(state.lang, 'tagline');
    $('mode-label').textContent = t(state.lang, 'mode');
    $('mode-words').textContent = t(state.lang, 'modeWords');
    $('mode-icons').textContent = t(state.lang, 'modeIcons');
    $('level-label').textContent = t(state.lang, 'level');
    Object.keys(LEVELS).forEach(function (lv) {
      var btn = document.querySelector('[data-level="' + lv + '"]');
      btn.innerHTML = '';
      btn.appendChild(document.createTextNode(t(state.lang, lv) + ' '));
      var sub = document.createElement('span');
      sub.className = 'chip-sub';
      sub.textContent = t(state.lang, 'pairsNote', LEVELS[lv].pairs);
      btn.appendChild(sub);
    });
    $('new-game').textContent = t(state.lang, 'newGame');
    $('play-again').textContent = t(state.lang, 'playAgain');
    $('label-moves').textContent = t(state.lang, 'moves');
    $('label-time').textContent = t(state.lang, 'time');
    $('label-matched').textContent = t(state.lang, 'matched');
    $('label-best').textContent = t(state.lang, 'best');
    $('howto-title').textContent = t(state.lang, 'howTo');
    $('howto-text').textContent = t(state.lang, 'howToText');
    $('footer').textContent = t(state.lang, 'footer');
    $('lang-toggle').textContent = state.lang === 'bn' ? 'EN' : 'বাং';
    $('lang-toggle').setAttribute('aria-label', state.lang === 'bn' ? 'Switch to English' : 'বাংলায় দেখুন');
    renderStats();
  }

  function cardEl(card) {
    var btn = document.createElement('button');
    btn.className = 'card' + (card.faceLang === 'bn' ? ' card-bn' : '');
    btn.setAttribute('data-card-id', String(card.id));
    btn.setAttribute('aria-label', 'card');
    var inner = document.createElement('span');
    inner.className = 'card-inner';
    var front = document.createElement('span');
    front.className = 'face front';
    front.textContent = '◈';
    var back = document.createElement('span');
    back.className = 'face back';
    back.textContent = card.face;
    inner.appendChild(front);
    inner.appendChild(back);
    btn.appendChild(inner);
    btn.addEventListener('click', function () { onFlip(card.id); });
    return btn;
  }

  function renderBoard() {
    board.innerHTML = '';
    board.className = 'board cols-' + LEVELS[state.level].cols;
    state.deck.forEach(function (card) { board.appendChild(cardEl(card)); });
  }

  function renderStats() {
    var e = state.engine;
    $('stat-moves').textContent = e ? String(e.moves) : '0';
    $('stat-time').textContent = formatTime(state.elapsed);
    $('stat-matched').textContent = e ? (e.matched.size + '/' + (state.deck.length / 2)) : '0/0';
    $('stat-best').textContent = bestLine();
  }

  function startTimer() {
    stopTimer();
    state.elapsed = 0;
    state.timerId = setInterval(function () {
      state.elapsed += 1;
      $('stat-time').textContent = formatTime(state.elapsed);
    }, 1000);
  }

  function stopTimer() {
    if (state.timerId) { clearInterval(state.timerId); state.timerId = null; }
  }

  function newGame() {
    stopTimer();
    state.lock = false;
    var pool = state.mode === 'words' ? WORD_PAIRS : ICON_POOL;
    state.deck = buildDeck(state.mode, pool, LEVELS[state.level].pairs);
    state.engine = new MemoryEngine(state.deck);
    renderBoard();
    hideWin();
    renderStats();
    document.querySelectorAll('[data-level]').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-level') === state.level);
    });
    document.querySelectorAll('[data-mode]').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-mode') === state.mode);
    });
  }

  function elForCard(cardId) {
    return board.querySelector('[data-card-id="' + cardId + '"]');
  }

  function flipEl(cardId, matched) {
    var el = elForCard(cardId);
    if (!el) return;
    el.classList.add('flipped');
    el.setAttribute('aria-label', 'flipped card');
    if (matched) { el.classList.add('matched'); el.disabled = true; }
  }

  function unflipEl(cardId) {
    var el = elForCard(cardId);
    if (el) el.classList.remove('flipped');
  }

  function onFlip(cardId) {
    if (state.lock || !state.engine) return;
    if (state.engine.startedAt == null) { state.engine.start(Date.now()); startTimer(); }
    var r = state.engine.flip(cardId);
    if (!r.ok) return;
    flipEl(cardId, false);
    if (r.second == null) { renderStats(); return; } // first card of the pair
    renderStats();
    if (r.match) {
      flipEl(r.first.id, true);
      flipEl(r.second.id, true);
      renderStats();
      if (r.done) onWin();
    } else {
      state.lock = true;
      var ids = [r.first.id, r.second.id];
      setTimeout(function () {
        ids.forEach(unflipEl);
        state.engine.closeOpen();
        state.lock = false;
      }, FLIP_BACK_MS);
    }
  }

  function onWin() {
    stopTimer();
    var e = state.engine;
    var stars = starRating(e.moves, e.matched.size);
    var prev = loadBest();
    var rec = { moves: e.moves, secs: state.elapsed, time: formatTime(state.elapsed), stars: stars };
    var isBest = !prev || e.moves < prev.moves || (e.moves === prev.moves && state.elapsed < (prev.secs == null ? Infinity : prev.secs));
    if (isBest) saveBest(rec);
    var starText = '★'.repeat(stars) + '☆'.repeat(3 - stars);
    $('win-title').textContent = t(state.lang, 'winTitle');
    $('win-sub').textContent = t(state.lang, 'winSubtitle', e.moves, formatTime(state.elapsed), starText);
    $('win-note').textContent = (isBest ? t(state.lang, 'bestSaved') + ' ' : '') +
      t(state.lang, stars === 3 ? 'star3' : stars === 2 ? 'star2' : 'star1');
    $('win-modal').classList.add('show');
    $('win-modal').setAttribute('aria-hidden', 'false');
    renderStats();
  }

  function hideWin() {
    $('win-modal').classList.remove('show');
    $('win-modal').setAttribute('aria-hidden', 'true');
  }

  function wireControls() {
    document.querySelectorAll('[data-level]').forEach(function (b) {
      b.addEventListener('click', function () { state.level = b.getAttribute('data-level'); newGame(); });
    });
    document.querySelectorAll('[data-mode]').forEach(function (b) {
      b.addEventListener('click', function () { state.mode = b.getAttribute('data-mode'); newGame(); });
    });
    $('new-game').addEventListener('click', newGame);
    $('play-again').addEventListener('click', newGame);
    $('lang-toggle').addEventListener('click', function () {
      state.lang = state.lang === 'bn' ? 'en' : 'bn';
      try { localStorage.setItem('mmb-lang', state.lang); } catch (e) { /* ignore */ }
      applyLang();
    });
  }

  // Boot
  wireControls();
  applyLang();
  newGame();
})();
