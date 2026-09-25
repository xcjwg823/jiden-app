// Renders index.html frame-by-frame (with 4-sample motion blur) and pipes PNGs into ffmpeg.
// usage: node render.mjs [ffmpeg] [out.mp4] [audio.wav] [--from s --to s --step n --stills dir]
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { readFileSync } from 'node:fs';

const args = process.argv.slice(2);
const opt = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const dir = path.dirname(new URL(import.meta.url).pathname);
const stills = opt('--stills');
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--disable-gpu-vsync'] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
page.on('console', m => console.log('[page]', m.text()));
page.on('pageerror', e => { console.error('[pageerror]', e); process.exit(1); });
// serve over http so image pixels stay readable (file:// would taint the canvas)
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.ttf': 'font/ttf', '.m4a': 'audio/mp4' };
const server = http.createServer((req, res) => {
  try { const f = path.join(dir, decodeURIComponent(new URL(req.url, 'http://x').pathname)); const body = readFileSync(f); res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); res.end(body); }
  catch { res.writeHead(404); res.end(); }
}).listen(0);
await page.goto(`http://127.0.0.1:${server.address().port}/index.html?render`);
await page.evaluate(() => window.READY);

const FPS = 60, DUR = 15;
const from = +(opt('--from') ?? 0), to = +(opt('--to') ?? DUR), step = +(opt('--step') ?? 1);
const grab = f => page.evaluate(f => { REEL.renderFrame(f / REEL.FPS); return document.getElementById('c').toDataURL('image/png'); }, f);

if (stills) {
  mkdirSync(stills, { recursive: true });
  for (let f = Math.round(from * FPS); f < to * FPS; f += step) {
    const d = await grab(f);
    writeFileSync(path.join(stills, `f${String(f).padStart(4, '0')}.png`), Buffer.from(d.split(',')[1], 'base64'));
  }
} else {
  const [ffmpeg, out, audio] = args;
  const ff = spawn(ffmpeg, ['-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
    '-i', audio, '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p',
    '-profile:v', 'high', '-tune', 'animation', '-c:a', 'aac', '-b:a', '256k', '-shortest', '-movflags', '+faststart', out],
    { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let f = 0; f < DUR * FPS; f++) {
    const d = await grab(f);
    if (!ff.stdin.write(Buffer.from(d.split(',')[1], 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
    if (f % 60 === 0) console.log(`frame ${f}/${DUR * FPS}  ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
}
await browser.close();
server.close();
