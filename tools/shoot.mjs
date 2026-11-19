// Renders the screenshots listed in shots.json with headless Chrome over the DevTools protocol (Node 22+, no deps).
// For each shot it seeds localStorage with that shot's progress, opens its hash route, and saves a JPEG.
// It also records every request the page makes and fails if any goes anywhere but the local server.
//   node tools/shoot.mjs            (expects Chrome at the default Windows path, or CHROME=<path>)
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const chrome = process.env.CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const port = 8123;
const shots = JSON.parse(readFileSync(join(root, process.env.SHOTS ?? 'shots.json'), 'utf8'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const server = spawn(process.execPath, ['serve.ts', '--port', String(port)], { cwd: root, stdio: 'ignore' });
const profile = join(tmpdir(), `ll-shoot-${Date.now()}`);
const browser = spawn(chrome, ['--headless=new', '--remote-debugging-port=9333', `--user-data-dir=${profile}`, '--no-first-run', '--hide-scrollbars', '--force-color-profile=srgb', 'about:blank'], { stdio: 'ignore' });

async function connect() {
  for (let i = 0; i < 50; i++) {
    try {
      const targets = await (await fetch('http://127.0.0.1:9333/json/list')).json();
      const page = targets.find((t) => t.type === 'page');
      if (page) return page.webSocketDebuggerUrl;
    } catch {}
    await sleep(200);
  }
  throw new Error('Chrome did not start');
}

const ws = new WebSocket(await connect());
await new Promise((r) => ws.addEventListener('open', r, { once: true }));
let nextId = 1;
const pending = new Map();
const requests = [];
ws.addEventListener('message', (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
  }
  if (msg.method === 'Network.requestWillBeSent') requests.push(msg.params.request.url);
  if (msg.method === 'Runtime.exceptionThrown') console.error('page error:', msg.params.exceptionDetails.exception?.description);
});
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, (msg) => (msg.error ? reject(new Error(`${method}: ${msg.error.message}`)) : resolve(msg.result)));
    ws.send(JSON.stringify({ id, method, params }));
  });

await send('Page.enable');
await send('Runtime.enable');
await send('Network.enable');
const base = `http://localhost:${port}/`;
for (let i = 0; i < 30; i++) {
  try { await fetch(base); break; } catch { await sleep(200); }
}

mkdirSync(join(root, 'screenshots'), { recursive: true });
for (const shot of shots) {
  const { width, height, scale = 1 } = shot.viewport;
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: scale, mobile: false });
  await send('Page.navigate', { url: base });
  await sleep(500);
  const progress = JSON.stringify(shot.progress ?? {});
  await send('Runtime.evaluate', { expression: `localStorage.setItem('leonida-ledger:v1', ${JSON.stringify(progress)})` });
  await send('Page.navigate', { url: `${base}?shot=${encodeURIComponent(shot.file)}${shot.hash ?? ''}` });
  await sleep(900);
  for (const step of shot.actions ?? []) {
    await send('Runtime.evaluate', { expression: step, awaitPromise: true });
    await sleep(250);
  }
  for (const check of shot.checks ?? []) {
    const r = await send('Runtime.evaluate', { expression: check, awaitPromise: true, returnByValue: true });
    console.log(`  check ${check.slice(0, 70)} => ${JSON.stringify(r.result.value)}`);
  }
  if (shot.checkOnly) continue;
  const { data } = await send('Page.captureScreenshot', { format: 'jpeg', quality: shot.quality ?? 86 });
  const file = join(root, 'screenshots', shot.file);
  writeFileSync(file, Buffer.from(data, 'base64'));
  console.log(`${shot.file}: ${Math.round(Buffer.from(data, 'base64').length / 1024)} KiB`);
}

const external = requests.filter((u) => !u.startsWith(base) && !u.startsWith('data:') && !u.startsWith('blob:') && u !== 'about:blank');
console.log(`requests: ${requests.length}, external: ${external.length}`);
for (const u of external) console.log('  EXTERNAL', u);

ws.close();
browser.kill();
server.kill();
await sleep(500);
try { rmSync(profile, { recursive: true, force: true }); } catch {}
process.exit(external.length ? 1 : 0);
