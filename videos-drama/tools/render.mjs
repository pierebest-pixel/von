// Rendu image par image dans Chromium headless + encodage ffmpeg.
// Usage : node tools/render.mjs stories/01-xxx.mjs build/01 out/01-xxx.mp4 [--from s --to s --fps 30 --still t]
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const [storyPath, buildDir, outPath, ...rest] = process.argv.slice(2);
const opt = {}; for (let i = 0; i < rest.length; i += 2) opt[rest[i].replace(/^--/, '')] = rest[i + 1];
const FPS = +(opt.fps || 30);

const story = (await import(pathToFileURL(path.resolve(storyPath)).href)).default;
const tl = JSON.parse(fs.readFileSync(path.join(buildDir, 'timeline.json'), 'utf8'));

const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.woff2': 'font/woff2', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, r));
const port = server.address().port;

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 720, height: 1280 } });
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.error('[page]', m.text()); });
page.on('pageerror', e => console.error('[pageerror]', e.message));
await page.goto(`http://localhost:${port}/render/index.html`);
await page.waitForFunction(() => window.ready === true, null, { timeout: 60000 });
await page.evaluate(([s, t]) => window.setup(s, t), [story, tl]);

const t0 = +(opt.from || 0), t1 = Math.min(+(opt.to || tl.total), tl.total);
if (opt.still) {
  const stills = opt.still.split(',').map(Number);
  for (const s of stills) {
    // "préchauffer" le plan : rendre quelques images avant
    const url = await page.evaluate(t => window.frame(t), s);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    const f = outPath.replace(/\.(jpg|png)$/, '') + `_${s.toFixed(1)}.jpg`;
    fs.writeFileSync(f, Buffer.from(url.split(',')[1], 'base64'));
    console.log('still', f);
  }
  await browser.close(); server.close(); process.exit(0);
}

const audio = path.join(buildDir, 'audio.wav');
const args = ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-'];
if (!opt.noaudio && fs.existsSync(audio)) args.push('-ss', String(t0), '-t', String(t1 - t0), '-i', audio);
args.push('-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', '-vf', 'scale=1080:1920:flags=lanczos', '-r', String(FPS));
if (!opt.noaudio && fs.existsSync(audio)) args.push('-c:a', 'aac', '-b:a', '192k', '-shortest');
args.push('-movflags', '+faststart', outPath);
const ff = spawn('ffmpeg', args, { stdio: ['pipe', 'inherit', 'inherit'] });

const n = Math.floor((t1 - t0) * FPS);
const start = Date.now();
for (let i = 0; i < n; i++) {
  const t = t0 + i / FPS;
  const url = await page.evaluate(t => window.frame(t), t);
  const buf = Buffer.from(url.slice(url.indexOf(',') + 1), 'base64');
  if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  if (i % 150 === 0) { const el = (Date.now() - start) / 1000; console.log(`${path.basename(outPath)} ${i}/${n} (${(i / Math.max(el, 0.01)).toFixed(1)} img/s)`); }
}
ff.stdin.end();
await new Promise(r => ff.on('close', r));
await browser.close(); server.close();
console.log('OK', outPath, ((Date.now() - start) / 1000).toFixed(0) + 's');
