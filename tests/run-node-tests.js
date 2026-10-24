/* memory-match-bd — Node unit tests for js/logic.js (no dependencies).
 * Run: node tests/run-node-tests.js
 */
'use strict';
const {
  mulberry32, shuffle, LEVELS, MODES, buildDeck, isMatch,
  starRating, formatTime, MemoryEngine,
} = require('../js/logic.js');

let pass = 0, fail = 0;
const failures = [];
function check(cond, label) {
  if (cond) pass++;
  else { fail++; failures.push(label); console.log('FAIL -', label); }
}
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const pool = [
  { en: 'Sun', bn: 'সূর্য' }, { en: 'Moon', bn: 'চাঁদ' },
  { en: 'Water', bn: 'পানি' }, { en: 'Rice', bn: 'ভাত' },
  { en: 'Fish', bn: 'মাছ' }, { en: 'Tree', bn: 'গাছ' },
  { en: 'Book', bn: 'বই' }, { en: 'House', bn: 'বাড়ি' },
  { en: 'Rain', bn: 'বৃষ্টি' }, { en: 'Road', bn: 'রাস্তা' },
  { en: 'Night', bn: 'রাত' }, { en: 'Love', bn: 'ভালোবাসা' },
];
const iconPool = ['🐯', '🐘', '🦚', '🐬', '🦋', '🌺', '🍉', '🥭', '🚲', '⛵', '🪁', '🏏'];

// --- mulberry32 determinism ---
check(eq(mulberry32(7)(), mulberry32(7)()), 'mulberry32 same seed same first value');
{
  const r1 = mulberry32(42), r2 = mulberry32(99);
  check(r1() !== r2(), 'mulberry32 different seeds differ');
}

// --- shuffle ---
{
  const a = [1, 2, 3, 4, 5, 6];
  const s1 = shuffle(a, mulberry32(1));
  const s2 = shuffle(a, mulberry32(1));
  check(eq(s1, s2), 'shuffle deterministic with seeded rng');
  check(eq([...s1].sort((x, y) => x - y), [1, 2, 3, 4, 5, 6]), 'shuffle preserves elements');
  check(eq(a, [1, 2, 3, 4, 5, 6]), 'shuffle does not mutate input');
  const s3 = shuffle(a, mulberry32(2));
  check(!eq(s1, s3), 'shuffle order varies with seed (smoke)');
}

// --- LEVELS / MODES ---
check(eq(LEVELS.easy.pairs, 6) && eq(LEVELS.medium.pairs, 8) && eq(LEVELS.hard.pairs, 12), 'LEVELS pair counts 6/8/12');
check(eq(MODES, ['words', 'icons']), 'MODES list');

// --- buildDeck (words) ---
{
  const deck = buildDeck('words', pool, 6, mulberry32(5));
  check(deck.length === 12, 'words deck has 2 cards per pair');
  const pairIds = new Set(deck.map(c => c.pairId));
  check(pairIds.size === 6, 'words deck has 6 distinct pairIds');
  for (const pid of pairIds) {
    const cards = deck.filter(c => c.pairId === pid);
    check(cards.length === 2, `pair ${pid} has exactly 2 cards`);
    const langs = cards.map(c => c.faceLang).sort();
    check(eq(langs, ['bn', 'en']), `pair ${pid} has one en + one bn card`);
  }
  const ids = new Set(deck.map(c => c.id));
  check(ids.size === 12, 'card ids unique');
  check(deck.every(c => typeof c.face === 'string' && c.face.length > 0), 'all faces non-empty strings');
  const bnCard = deck.find(c => c.faceLang === 'bn');
  check(/[\u0980-\u09FF]/.test(bnCard.face), 'bn card face contains Bengali script');
}

// --- buildDeck (icons) ---
{
  const deck = buildDeck('icons', iconPool, 8, mulberry32(9));
  check(deck.length === 16, 'icons deck 16 cards for 8 pairs');
  for (let i = 0; i < 8; i++) {
    const cards = deck.filter(c => c.pairId === i);
    check(cards.length === 2 && cards[0].face === cards[1].face && cards[0].faceLang === 'icon', `icon pair ${i} identical faces`);
  }
}

// --- buildDeck errors ---
{
  let threw = false;
  try { buildDeck('words', pool.slice(0, 3), 6); } catch { threw = true; }
  check(threw, 'buildDeck throws when pool too small');
  threw = false;
  try { buildDeck('bogus', pool, 2); } catch { threw = true; }
  check(threw, 'buildDeck throws on unknown mode');
}

// --- isMatch ---
check(isMatch({ id: 0, pairId: 3 }, { id: 1, pairId: 3 }) === true, 'isMatch true for same pairId diff ids');
check(isMatch({ id: 0, pairId: 3 }, { id: 0, pairId: 3 }) === false, 'isMatch false for same card');
check(isMatch({ id: 0, pairId: 3 }, { id: 1, pairId: 4 }) === false, 'isMatch false for different pairId');
check(isMatch(null, { id: 1 }) === false, 'isMatch false on null');

// --- starRating ---
check(starRating(6, 6) === 3, 'starRating perfect = 3');
check(starRating(8, 6) === 3, 'starRating ratio 1.33 = 3');
check(starRating(10, 6) === 2, 'starRating ratio 1.67 = 2');
check(starRating(30, 6) === 1, 'starRating ratio 5 = 1');
check(starRating(3, 6) === 1, 'starRating below pairs floor = 1');

// --- formatTime ---
check(formatTime(0) === '0:00', 'formatTime 0');
check(formatTime(65) === '1:05', 'formatTime 65');
check(formatTime(600) === '10:00', 'formatTime 600');
check(formatTime(-5) === '0:00', 'formatTime negative clamps');

// --- MemoryEngine happy path ---
{
  const deck = buildDeck('words', pool, 3, mulberry32(11));
  const eng = new MemoryEngine(deck);
  eng.start(1000);
  const byPair = {};
  for (const c of deck) (byPair[c.pairId] ??= []).push(c.id);
  const pid0 = Object.keys(byPair)[0];
  const [c0, c1] = byPair[pid0];
  const r1 = eng.flip(c0);
  check(r1.ok && r1.match === null && r1.second === null, 'first flip returns no match yet');
  const r2 = eng.flip(c1);
  check(r2.ok && r2.match === true && r2.moves === 1, 'matching second flip matches, moves=1');
  check(eng.matched.has(Number(pid0)), 'pair recorded matched');
  // flipping a matched card is rejected
  const r3 = eng.flip(c0);
  check(!r3.ok && r3.reason === 'already-matched', 'flip on matched card rejected');
  check(eng.elapsedSeconds(61_000) === 60, 'elapsedSeconds 60s after start');
}

// --- MemoryEngine mismatch path ---
{
  const deck = buildDeck('words', pool, 3, mulberry32(13));
  const eng = new MemoryEngine(deck);
  eng.start(0);
  const byPair = {};
  for (const c of deck) (byPair[c.pairId] ??= []).push(c.id);
  const pids = Object.keys(byPair);
  const r1 = eng.flip(byPair[pids[0]][0]);
  check(r1.ok, 'mismatch: first flip ok');
  const r2 = eng.flip(byPair[pids[1]][0]);
  check(r2.ok && r2.match === false && r2.moves === 1, 'mismatch: match=false, moves=1');
  check(eng.mismatches === 1, 'mismatches counter = 1');
  check(eng.open.length === 2, 'open pair stays open until closeOpen');
  eng.closeOpen();
  check(eng.open.length === 0, 'closeOpen clears');
  // same card twice rejected
  const r3 = eng.flip(byPair[pids[2]][0]);
  const r4 = eng.flip(byPair[pids[2]][0]);
  check(r3.ok && !r4.ok && r4.reason === 'already-open', 'double flip same card rejected');
  // unknown card rejected
  check(!eng.flip(999).ok, 'unknown card rejected');
}

// --- MemoryEngine full game done ---
{
  const deck = buildDeck('icons', iconPool, 2, mulberry32(17));
  const eng = new MemoryEngine(deck);
  eng.start(0);
  const byPair = {};
  for (const c of deck) (byPair[c.pairId] ??= []).push(c.id);
  let done = false;
  for (const pid of Object.keys(byPair)) {
    const [a, b] = byPair[pid];
    eng.flip(a);
    const r = eng.flip(b);
    done = r.done;
  }
  check(done && eng.isDone(), 'engine reports done when all pairs matched');
  check(eng.moves === 2, 'perfect game moves = pair count');
  check(starRating(eng.moves, 2) === 3, 'perfect game earns 3 stars');
}

// --- MemoryEngine ctor guard ---
{
  let threw = false;
  try { new MemoryEngine([{ id: 0, pairId: 0 }]); } catch { threw = true; }
  check(threw, 'engine ctor throws on odd-length deck');
}

console.log(`\n${pass}/${pass + fail} node unit tests passed`);
if (fail > 0) { console.log('Failures:', failures); process.exit(1); }
