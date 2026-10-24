/* memory-match-bd — pure game logic (no DOM). Plain script; also require()-able in Node. */
'use strict';

const MMBLogic = (() => {
  /**
   * Seeded PRNG (mulberry32) so tests are deterministic.
   */
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /**
   * Fisher–Yates shuffle. Returns a NEW array; never mutates input.
   */
  function shuffle(arr, rng) {
    rng = rng || Math.random;
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  const LEVELS = {
    easy:   { pairs: 6,  cols: 4 },
    medium: { pairs: 8,  cols: 4 },
    hard:   { pairs: 12, cols: 6 },
  };

  const MODES = ['words', 'icons'];

  /**
   * Build a deck of card objects.
   * words mode: one card shows English, its pair shows the Bangla meaning.
   * icons mode: two identical-emoji cards per pair.
   */
  function buildDeck(mode, pool, pairCount, rng) {
    rng = rng || Math.random;
    if (MODES.indexOf(mode) === -1) throw new Error('unknown mode: ' + mode);
    if (!Number.isInteger(pairCount) || pairCount < 1) throw new Error('bad pairCount');
    if (!Array.isArray(pool) || pool.length < pairCount) {
      throw new Error('pool too small: need ' + pairCount + ', have ' + (pool ? pool.length : 0));
    }
    const picks = shuffle(pool, rng).slice(0, pairCount);
    const cards = [];
    picks.forEach(function (item, idx) {
      if (mode === 'words') {
        cards.push({ id: cards.length, pairId: idx, face: item.en, faceLang: 'en' });
        cards.push({ id: cards.length, pairId: idx, face: item.bn, faceLang: 'bn' });
      } else {
        cards.push({ id: cards.length, pairId: idx, face: item, faceLang: 'icon' });
        cards.push({ id: cards.length, pairId: idx, face: item, faceLang: 'icon' });
      }
    });
    return shuffle(cards, rng);
  }

  /**
   * Two cards match iff they share a pairId but are different card ids.
   */
  function isMatch(a, b) {
    if (!a || !b || a.id === b.id) return false;
    return a.pairId === b.pairId;
  }

  /**
   * Star rating from move efficiency. Perfect game takes exactly `pairs` moves.
   * Returns 1, 2 or 3.
   */
  function starRating(moves, pairs) {
    if (!Number.isFinite(moves) || moves < pairs || pairs < 1) return 1;
    const ratio = moves / pairs;
    if (ratio <= 1.4) return 3;
    if (ratio <= 2.0) return 2;
    return 1;
  }

  /**
   * Format seconds as m:ss.
   */
  function formatTime(totalSeconds) {
    const s = Math.max(0, Math.floor(totalSeconds));
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  }

  /**
   * Minimal in-memory game engine: flip/match bookkeeping without any DOM.
   */
  class MemoryEngine {
    constructor(deck) {
      if (!Array.isArray(deck) || deck.length % 2 !== 0) throw new Error('deck must have even length');
      this.deck = deck;
      this.matched = new Set();   // pairIds
      this.open = [];             // card ids currently face-up (max 2)
      this.moves = 0;             // completed two-card attempts
      this.mismatches = 0;
      this.startedAt = null;
    }
    start(now) { this.startedAt = (now == null ? Date.now() : now); }
    /**
     * Flip a card. Returns:
     * {ok, first, second, match, moves, done} or {ok:false, reason}
     */
    flip(cardId) {
      const card = this.deck.find(c => c.id === cardId);
      if (!card) return { ok: false, reason: 'unknown-card' };
      if (this.matched.has(card.pairId)) return { ok: false, reason: 'already-matched' };
      if (this.open.indexOf(cardId) !== -1) return { ok: false, reason: 'already-open' };
      if (this.open.length >= 2) return { ok: false, reason: 'two-open' };

      this.open.push(cardId);
      if (this.open.length === 1) {
        return { ok: true, first: card, second: null, match: null, moves: this.moves, done: false };
      }
      const self = this;
      const pair = this.open.map(id => self.deck.find(c => c.id === id));
      const a = pair[0], b = pair[1];
      this.moves += 1;
      const match = isMatch(a, b);
      if (match) {
        this.matched.add(a.pairId);
        this.open = [];
      } else {
        this.mismatches += 1;
      }
      return { ok: true, first: a, second: b, match: match, moves: this.moves, done: this.isDone() };
    }
    /** Close the currently open (mismatched) pair after the flip-back delay. */
    closeOpen() { this.open = []; }
    isDone() { return this.matched.size === this.deck.length / 2; }
    elapsedSeconds(now) {
      if (this.startedAt == null) return 0;
      const t = (now == null ? Date.now() : now);
      return Math.max(0, Math.round((t - this.startedAt) / 1000));
    }
  }

  return { mulberry32, shuffle, LEVELS, MODES, buildDeck, isMatch, starRating, formatTime, MemoryEngine };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = MMBLogic;
