import { chromium } from 'playwright';
import { spawn } from 'child_process';
import path from 'path';
const [,, mode='snap', ...rest] = process.argv;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args:['--allow-file-access-from-files'] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
page.on('console', m => console.log('page:', m.text())); page.on('pageerror', e => console.log('ERR', e.message));
await page.goto('file://' + path.resolve('index.html') + '?render=1');
await page.evaluate(() => window.ready);
const grab = async (t, samples) => {
  const d = await page.evaluate(([t, s]) => { drawFrame(t, s); return document.getElementById('c').toDataURL('image/png'); }, [t, samples]);
  return Buffer.from(d.split(',')[1], 'base64');
};
if (mode === 'snap') {
  const fs = await import('fs');
  for (const t of rest.map(Number)) fs.writeFileSync(`snap/${t.toFixed(2)}.png`, await grab(t, 1));
} else {
  const ff = spawn(process.env.FFMPEG, ['-y','-f','image2pipe','-framerate','30','-i','-','-c:v','libx264','-preset','slow','-crf','16','-pix_fmt','yuv420p','video.mp4'], { stdio: ['pipe','inherit','inherit'] });
  for (let f = 0; f < 450; f++) { const b = await grab(f / 30, 5); if (!ff.stdin.write(b)) await new Promise(r => ff.stdin.once('drain', r)); if (f % 50 === 0) console.log('frame', f); }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
}
await browser.close();
