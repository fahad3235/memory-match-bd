/* Headless-Chrome smoke test (raw CDP) for memory-match-bd.
 * Run: node tests/smoke.mjs
 * Loads file://index.html, drives the real UI, counts real assertions. */
import { spawn } from 'node:child_process';

const CHROME = '/opt/meta-chromium/chrome';
const PAGE = 'file:///home/hatch/workspace/muse-project-factory/builds/memory-match-bd/index.html';

let pass = 0, fail = 0;
const failures = [];
function check(cond, label) {
  if (cond) { pass++; }
  else { fail++; failures.push(label); console.log('FAIL - ' + label); }
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  const chrome = spawn(CHROME, [
    '--headless=new', '--no-sandbox', '--disable-gpu',
    '--remote-debugging-port=0', '--user-data-dir=/tmp/mmb-chrome-profile',
    'about:blank'
  ], { stdio: ['ignore', 'ignore', 'pipe'] });

  let wsUrl = null, httpPort = null;
  await new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('no DevTools URL in stderr')), 15000);
    chrome.stderr.on('data', d => {
      const m = String(d).match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (m) {
        wsUrl = m[1];
        httpPort = new URL(wsUrl.replace(/^ws:\/\//, 'http://')).port;
        clearTimeout(t); resolve();
      }
    });
    chrome.on('error', reject);
  });

  const res = await fetch(`http://127.0.0.1:${httpPort}/json/new?${encodeURIComponent(PAGE)}`, { method: 'PUT' });
  const target = await res.json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res2, rej) => { ws.onopen = res2; ws.onerror = rej; });

  let id = 0;
  const pending = new Map();
  const consoleErrors = [], pageErrors = [];
  ws.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
    else if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') {
      consoleErrors.push((m.params.args || []).map(a => a.value ?? a.description ?? '').join(' '));
    }
    else if (m.method === 'Runtime.exceptionThrown') pageErrors.push(m.params.exceptionDetails.text || 'exception');
    else if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') pageErrors.push(m.params.entry.text);
    else if (m.method === 'Page.loadEventFired' && loadResolve) { loadResolve(); loadResolve = null; }
  };
  function send(method, params = {}) {
    return new Promise(resolve => {
      const myId = ++id;
      pending.set(myId, resolve);
      ws.send(JSON.stringify({ id: myId, method, params }));
    });
  }
  let loadResolve = null;
  const waitLoad = () => new Promise(r => { loadResolve = r; setTimeout(r, 8000); });

  async function ev(expr) {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: false });
    if (r.result && r.result.result) return r.result.result.value;
    return undefined;
  }
  const text = sel => ev(`(document.querySelector(${JSON.stringify(sel)})||{}).textContent`);

  await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable');
  const loaded = waitLoad();
  await send('Page.navigate', { url: PAGE });
  await loaded; await sleep(500);

  // 1. clean load
  check((await ev('document.title')).includes('Memory Match'), 'title contains Memory Match');
  check(consoleErrors.length === 0, 'zero console errors on load (got ' + consoleErrors.length + ')');
  check(pageErrors.length === 0, 'zero page errors on load (got ' + pageErrors.length + ')');
  check(await ev("performance.getEntriesByType('resource').length") === 0, 'zero network requests (offline app)');
  check(await ev("document.querySelectorAll('#board .card').length") === 12, 'easy board = 12 cards');
  check(await text('#stat-moves') === '0', 'moves starts at 0');
  check(await text('#stat-matched') === '0/6', 'matched starts 0/6');
  check(await ev('document.documentElement.scrollWidth') <= await ev('window.innerWidth'), 'no horizontal overflow on desktop');

  // 2. switch to icons mode -> matching pair
  await ev(`document.querySelector('[data-mode="icons"]').click()`);
  await sleep(200);
  check(await ev("document.querySelectorAll('#board .card').length") === 12, 'icons easy board = 12 cards');
  const pairIdx = await ev(`(function(){
    const cards=[...document.querySelectorAll('#board .card')];
    const seen={};
    for(let i=0;i<cards.length;i++){
      const f=cards[i].querySelector('.face.back').textContent;
      if(seen[f]!=null) return [seen[f],i];
      seen[f]=i;
    }
    return null;
  })()`);
  check(Array.isArray(pairIdx) && pairIdx.length === 2, 'found a matching icon pair in DOM');
  if (pairIdx) {
    await ev(`document.querySelectorAll('#board .card')[${pairIdx[0]}].click()`);
    await sleep(120);
    await ev(`document.querySelectorAll('#board .card')[${pairIdx[1]}].click()`);
    await sleep(300);
    check(await ev(`document.querySelectorAll('#board .card')[${pairIdx[0]}].classList.contains('matched')`) === true, 'matching pair gets .matched');
    check(await text('#stat-matched') === '1/6', 'matched counter 1/6 after one pair');
    check(await text('#stat-moves') === '1', 'moves = 1 after one pair');
  }

  // 3. mismatch -> flips back after delay
  const misIdx = await ev(`(function(){
    const cards=[...document.querySelectorAll('#board .card')];
    const open=cards.map((c,i)=>({c,i})).filter(x=>!x.c.classList.contains('matched'));
    for(let a=0;a<open.length;a++)for(let b=a+1;b<open.length;b++){
      if(open[a].c.querySelector('.face.back').textContent!==open[b].c.querySelector('.face.back').textContent)
        return [open[a].i,open[b].i];
    }
    return null;
  })()`);
  check(Array.isArray(misIdx), 'found two different unmatched cards');
  if (misIdx) {
    await ev(`document.querySelectorAll('#board .card')[${misIdx[0]}].click()`);
    await sleep(120);
    await ev(`document.querySelectorAll('#board .card')[${misIdx[1]}].click()`);
    await sleep(200);
    check(await ev(`document.querySelectorAll('#board .card')[${misIdx[0]}].classList.contains('flipped')`) === true, 'both cards flipped before flip-back delay');
    await sleep(900);
    check(await ev(`document.querySelectorAll('#board .card')[${misIdx[0]}].classList.contains('flipped')`) === false, 'mismatch flips back after delay');
    check(await text('#stat-moves') === '2', 'moves = 2 after mismatch');
  }

  // 4. hard level -> 24 cards; new game resets
  await ev(`document.querySelector('[data-level="hard"]').click()`);
  await sleep(200);
  check(await ev("document.querySelectorAll('#board .card').length") === 24, 'hard board = 24 cards');
  check(await text('#stat-moves') === '0', 'new game resets moves');
  check(await text('#stat-matched') === '0/12', 'new game resets matched 0/12');

  // 5. full icons-medium game -> win modal + best score saved
  await ev(`document.querySelector('[data-level="medium"]').click()`);
  await sleep(200);
  for (let k = 0; k < 8; k++) {
    const p = await ev(`(function(){
      const cards=[...document.querySelectorAll('#board .card')];
      const open=cards.map((c,i)=>({c,i})).filter(x=>!x.c.classList.contains('matched')&&!x.c.classList.contains('flipped'));
      const seen={};
      for(const x of open){
        const f=x.c.querySelector('.face.back').textContent;
        if(seen[f]!=null) return [seen[f],x.i];
        seen[f]=x.i;
      }
      return null;
    })()`);
    if (!p) break;
    await ev(`document.querySelectorAll('#board .card')[${p[0]}].click()`);
    await sleep(60);
    await ev(`document.querySelectorAll('#board .card')[${p[1]}].click()`);
    await sleep(160);
  }
  await sleep(600);
  check(await ev(`document.getElementById('win-modal').classList.contains('show')`) === true, 'win modal shows after all pairs matched');
  check(await text('#stat-matched') === '8/8', 'matched 8/8 at win');
  check(await text('#stat-moves') === '8', 'perfect medium game = 8 moves');
  check((await text('#win-sub')).includes('8'), 'win subtitle shows 8 moves');
  const best = await ev(`localStorage.getItem('mmb-best-icons-medium')`);
  check(best !== null && best.includes('"moves":8'), 'best score saved to localStorage (moves 8)');
  await ev(`document.getElementById('play-again').click()`);
  await sleep(200);
  check(await ev(`document.getElementById('win-modal').classList.contains('show')`) === false, 'play again hides modal');
  check(await text('#stat-moves') === '0', 'play again resets board');

  // 6. BN toggle
  await ev(`document.getElementById('lang-toggle').click()`);
  await sleep(200);
  check(/[\u0980-\u09FF]/.test(await text('#tagline') || ''), 'BN toggle: tagline in Bengali');
  check(await text('#lang-toggle') === 'EN', 'BN toggle button shows EN');
  const langStored = await ev(`localStorage.getItem('mmb-lang')`);
  check(langStored === '"bn"' || langStored === 'bn', 'lang persisted in localStorage (got ' + langStored + ')');
  await ev(`document.getElementById('lang-toggle').click()`); // back to EN
  await sleep(150);

  // 7. words mode shows EN and BN faces
  await ev(`document.querySelector('[data-mode="words"]').click()`);
  await sleep(200);
  const faces = await ev(`[...document.querySelectorAll('#board .face.back')].map(e=>e.textContent)`);
  check(Array.isArray(faces) && faces.length === 16, 'words medium board = 16 faces');
  check(faces.some(f => /[\u0980-\u09FF]/.test(f)), 'words deck has Bengali faces');
  check(faces.some(f => /^[A-Za-z]+$/.test(f)), 'words deck has English faces');

  // 8. mobile viewport 390px: no overflow
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await sleep(400);
  check(await ev('document.documentElement.scrollWidth') <= 391, 'no horizontal overflow at 390px');

  // 9. final error tally
  check(consoleErrors.length === 0, 'zero console errors overall (got ' + consoleErrors.length + (consoleErrors[0] ? ': ' + consoleErrors[0] : '') + ')');
  check(pageErrors.length === 0, 'zero page errors overall (got ' + pageErrors.length + ')');

  console.log(`\n${pass}/${pass + fail} smoke assertions passed`);
  chrome.kill();
  if (fail > 0) { console.log('Failures:', failures); process.exit(1); }
}

main().catch(e => { console.error('SMOKE HARNESS ERROR:', e.message); process.exit(2); });
