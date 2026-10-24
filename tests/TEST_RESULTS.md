# TEST RESULTS — memory-match-bd (run #120, 2026-10-24)

## Node unit tests — `node tests/run-node-tests.js`
**65/65 passed.** Covers:
- `mulberry32` determinism (same seed → same stream, different seeds differ)
- `shuffle` deterministic under seeded RNG, element-preserving, non-mutating
- `LEVELS` (6/8/12 pairs), `MODES`
- `buildDeck` words mode: 2 cards/pair, one `en` + one `bn` face, unique ids, non-empty faces, Bengali script present
- `buildDeck` icons mode: identical emoji faces per pair
- `buildDeck` error paths: pool too small, unknown mode
- `isMatch` true/false edges (same card, different pair, null)
- `starRating` thresholds (perfect=3, 1.67x=2, 5x=1, below-floor=1)
- `formatTime` (0, 1:05, 10:00, negative clamp)
- `MemoryEngine`: first flip no-match, matching flip (moves=1), matched-card rejection, elapsed time
- mismatch path: match=false, mismatches=1, open-until-closeOpen, double-flip rejection, unknown card
- full game: done flag, moves == pair count, 3 stars
- ctor guard: odd-length deck throws

## Headless-Chrome smoke — `node tests/smoke.mjs` (raw CDP, file://)
**36/36 passed.** Covers:
- title, zero console errors on load, zero page errors on load, zero network requests
- easy board = 12 cards, stats start 0 / 0:00 / 0/6, no horizontal overflow (desktop)
- icons mode: found matching pair in DOM, click both → `.matched`, counter 1/6, moves=1
- mismatch: two different cards → both `.flipped` before delay, flip back after 800ms, moves=2
- hard level → 24 cards, new game resets stats
- full icons-medium game (8 pairs, all clicked via DOM) → win modal shows, 8/8 matched, 8 moves, subtitle contains 8, best score in localStorage (`mmb-best-icons-medium`, moves 8)
- play again → modal hides, board resets
- BN toggle → tagline in Bengali, toggle shows EN, `mmb-lang` persisted
- words mode → 16 faces, contains Bengali + English faces
- 390px viewport → no horizontal overflow
- zero console errors / zero page errors overall

## Repair cycles
1. ES-module scripts blocked by CORS over file:// in headless Chrome (CORS: origin 'null') — converted to the factory's plain-script + namespace pattern (`MMBLogic`/`MMBWords`/`MMBI18n` IIFEs with `module.exports` guard). No app-logic bugs found; test-side only.
