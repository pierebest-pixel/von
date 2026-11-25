const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  p.on('pageerror', e => console.log(e.message));
  await p.goto('file://' + path.resolve(__dirname, '../../games/watchers/index-blank.html').replace('index-blank.html','') );
  await p.addScriptTag({ path: path.resolve(__dirname, '../../games/watchers/music.js') });
  const b64 = await p.evaluate(async () => {
    const sr = 32000, dur = 60 / 104 * 64 + 2;
    const ctx = new OfflineAudioContext(1, Math.ceil(sr * dur), sr);
    MUSIC.schedule(ctx, ctx.destination, 'title', 0.05, 1);
    const buf = await ctx.startRendering(); const d = buf.getChannelData(0);
    const out = new DataView(new ArrayBuffer(44 + d.length * 2)); const w = (o, s) => [...s].forEach((c, i) => out.setUint8(o + i, c.charCodeAt(0)));
    w(0, 'RIFF'); out.setUint32(4, 36 + d.length * 2, true); w(8, 'WAVEfmt '); out.setUint32(16, 16, true); out.setUint16(20, 1, true); out.setUint16(22, 1, true);
    out.setUint32(24, sr, true); out.setUint32(28, sr * 2, true); out.setUint16(32, 2, true); out.setUint16(34, 16, true); w(36, 'data'); out.setUint32(40, d.length * 2, true);
    let peak = 0; for (const v of d) peak = Math.max(peak, Math.abs(v));
    for (let i = 0; i < d.length; i++) out.setInt16(44 + i * 2, Math.max(-1, Math.min(1, d[i] / peak * .9)) * 32767, true);
    let s = ''; const u = new Uint8Array(out.buffer); for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000));
    return [btoa(s), peak];
  });
  fs.writeFileSync(__dirname + '/watchers-theme.wav', Buffer.from(b64[0], 'base64')); console.log('peak', b64[1]);
  await b.close();
})();
