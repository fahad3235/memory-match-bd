# Memory Match BD 🧠

A free, bilingual (English ⇄ বাংলা) memory card game that runs fully offline in your browser. Match English words with their Bangla meanings — or play the icon deck — across three difficulty levels.

## Problem

Memory games are great brain exercise, but few combine it with language learning for Bangla speakers. Memory Match BD turns vocabulary practice (28 hand-checked EN↔BN word pairs) into a game: every Words-mode match teaches a translation.

## Features

- **Two decks** — *Words*: English word ⇄ Bangla meaning pairs (learning mode); *Icons*: classic same-emoji pairs.
- **Three levels** — Easy (6 pairs), Medium (8 pairs), Hard (12 pairs).
- **Live stats** — moves, timer, matched count; flip animations with mismatch flip-back.
- **Star rating** — 1–3 stars based on move efficiency (perfect game = one move per pair).
- **Best scores** — best result per deck × level saved in `localStorage`; language choice persisted too.
- **Bilingual UI** — full EN/বাংলা interface toggle, persisted across sessions.
- **Offline-first** — zero network requests; no account, no tracking, nothing leaves the device.
- **Responsive** — mobile-first layout, verified at 390px width.

## Stack

- Vanilla HTML + CSS + JavaScript (plain scripts, no build step, no dependencies).
- Pure game logic in `js/logic.js` (testable in Node); DOM wiring in `js/app.js`.
- Strings in `js/i18n.js`; word list in `js/words.js` (UTF-8).

## Prerequisites

Any modern browser (Chrome, Firefox, Edge, Safari). No server needed — open `index.html` directly.

## Install / run

```bash
git clone https://github.com/fahad3235/memory-match-bd.git
cd memory-match-bd
# open index.html in a browser, or serve it:
python3 -m http.server 8000
# -> http://localhost:8000
```

No install step, no environment variables.

## Testing

```bash
node tests/run-node-tests.js   # 65 unit tests (game logic, seeded PRNG, engine paths)
node tests/smoke.mjs           # 36 headless-Chrome assertions (real UI: flips, match,
                               # mismatch flip-back, full game win, best-score save,
                               # BN toggle, 390px overflow check)
```

Both suites must be green; see `tests/TEST_RESULTS.md` for the recorded run.

## Deployment

Static site — deploy anywhere (GitHub Pages, Netlify, Vercel). Enable GitHub Pages on `main` / root for the live demo.

## Limitations

- Best scores live in the browser's `localStorage` only; clearing site data resets them.
- Words deck ships a fixed 28-pair vocabulary list (easy to extend in `js/words.js`).
- No multiplayer; no sound effects.

## Status

✅ Built, tested (65/65 unit + 36/36 smoke, zero console/page errors), published.
