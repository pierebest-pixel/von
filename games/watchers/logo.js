/* Watchers — logo « WATCHERS » dont l'encre coule (même technique que l'icône de Von). */
"use strict";
function drawDripLogo(text, font, opts = {}) {
  const W = opts.w || 1200, H = opts.h || 420;
  let s = opts.seed || 5; const r = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  const m = document.createElement("canvas"); m.width = W; m.height = H;
  const mg = m.getContext("2d"); mg.font = font; mg.textAlign = "center"; mg.fillStyle = "#fff";
  const h = mg.measureText(text).actualBoundingBoxAscent, base = Math.round(H * .18 + h);
  mg.fillText(text, W / 2, base);
  const row = mg.getImageData(0, base - 4, W, 1).data, runs = []; let st = -1;
  for (let x = 0; x < W; x++) { const on = row[x * 4 + 3] > 128; if (on && st < 0) st = x; if (!on && st >= 0) { runs.push([st, x]); st = -1; } }
  for (const [a, b] of runs) {
    const w = b - a; if (w < 6 || r() < .2) continue;
    const cx = a + w / 2, dw = Math.min(w * .7, 22) * (.7 + r() * .5), len = h * (.45 + r() * 1.1);
    mg.fillRect(Math.round(cx - dw / 2), base - 6, Math.round(dw), Math.round(len));
    mg.beginPath(); mg.arc(cx, base - 6 + len, dw / 2 + 2, 0, 7); mg.fill();
    if (r() > .5) { mg.beginPath(); mg.arc(cx, base + len + dw + 6, dw * .35, 0, 7); mg.fill(); }
  }
  const out = document.createElement("canvas"); out.width = W; out.height = H;
  const g = out.getContext("2d"); g.drawImage(m, 0, 0); g.globalCompositeOperation = "source-in";
  const grad = g.createLinearGradient(0, base - h, 0, base + h * 1.4);
  (opts.colors || ["#e6fffa", "#5ee0c6", "#2f8a8a", "#a3123a", "#6e0a1c"]).forEach((c, i, a) => grad.addColorStop(i / (a.length - 1), c));
  g.fillStyle = grad; g.fillRect(0, 0, W, H);
  return out;
}
