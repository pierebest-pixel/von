/* Les Échoués de Kalua — géographie de l'archipel (la carte v5 validée).
 * Tout est en « unités carte » (1600 × 1000) ; dans le jeu, 1 unité = KALUA.K pixels du monde.
 * Le sol est dessiné en tuiles calculées à la demande (relief ombré, eau, plages), puis mis en cache. */
"use strict";

const KALUA = (() => {
  const MW = 1600, MH = 1000, K = 14, TAU = Math.PI * 2;
  // ---------------------------------------------------------------- bruit
  const hash = (x, y) => { let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const sm = (t) => t * t * (3 - 2 * t);
  const noise = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi; const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
    const u = sm(xf), v = sm(yf); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; };
  const fbm = (x, y) => noise(x, y) * .5 + noise(x * 2, y * 2) * .27 + noise(x * 4, y * 4) * .15 + noise(x * 8, y * 8) * .08;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

  // ---------------------------------------------------------------- formes
  const MC = { x: 760, y: 500, rx: 560, ry: 420 };
  const mainD = (x, y) => { const dx = (x - MC.x) / MC.rx, dy = (y - MC.y) / MC.ry, a = Math.atan2(dy, dx);
    const r = 1 + .07 * Math.sin(a * 3 + 1.2) + .05 * Math.sin(a * 5 + .4) + .03 * Math.sin(a * 9 + 2.1); return Math.hypot(dx, dy) / r + (fbm(x / 90, y / 90) - .5) * .16; };
  const ISLES = [
    { id: "tortues", x: 1440, y: 820, rx: 125, ry: 88, name: "Île aux Tortues", col: [168, 214, 140] },
    { id: "phare", x: 1450, y: 160, rx: 100, ry: 82, name: "Île du Phare", col: [196, 186, 176] },
    { id: "etoiles", x: 125, y: 860, rx: 85, ry: 64, name: "Îlot aux Étoiles", col: [206, 190, 236] },
  ];
  const isleD = (I, x, y) => Math.hypot((x - I.x) / I.rx, (y - I.y) / I.ry) + (fbm(x / 50 + 9, y / 50) - .5) * .3;
  const BIOMES = [
    { id: "cote", name: "Côte Dorée", x: 800, y: 820, col: [246, 226, 182] },
    { id: "jungle", name: "Jungle Émeraude", x: 380, y: 520, col: [98, 168, 96] },
    { id: "marais", name: "Marais des Brumes", x: 500, y: 210, col: [140, 160, 124] },
    { id: "falaises", name: "Falaises des Vents", x: 1160, y: 470, col: [200, 190, 182] },
    { id: "volcan", name: "Volcan de Kalua", x: 840, y: 230, col: [176, 148, 138] },
  ];
  function weights(x, y) {
    const wx = x + (fbm(x / 120, y / 120) - .5) * 220, wy = y + (fbm(x / 120 + 5, y / 120 + 5) - .5) * 220;
    const ds = BIOMES.map((b, i) => Math.hypot(wx - b.x, (wy - b.y) * 1.15) * (i === 0 ? 1.05 : 1));
    const m = Math.min(...ds); const w = ds.map((d) => Math.exp(-(d - m) / 26)); const s = w.reduce((a, b) => a + b, 0); return w.map((v) => v / s);
  }
  const VOL = { x: 840, y: 220 };
  const VILLAGE = { x: 765, y: 645 }; // votre village (à construire)
  function info(x, y) {
    let d = mainD(x, y), isl = -1;
    for (let i = 0; i < 3; i++) { const I = ISLES[i]; if (Math.abs(x - I.x) > I.rx * 1.6 || Math.abs(y - I.y) > I.ry * 1.6) continue; const e = isleD(I, x, y); if (e < d) { d = e; isl = i; } }
    if (d > 1) return { h: -(d - 1), d, isl, w: null };
    let h = sm(clamp((1 - d) / .35)) * .25, w = null;
    if (isl < 0) {
      w = weights(x, y);
      const vr = Math.hypot(x - VOL.x, (y - VOL.y) * 1.2);
      h += w[4] * (Math.exp(-(vr * vr) / (2 * 150 * 150)) * 1.1) - Math.exp(-(vr * vr) / (2 * 30 * 30)) * .45 + w[4] * (fbm(x / 40, y / 40) - .5) * .12;
      let p = w[3] * .5 * sm(clamp((1 - d) / .25)); p += w[3] * (fbm(x / 70 + 3, y / 70) - .5) * .4; const q = p * 7, fq = Math.floor(q); h += (fq + sm(clamp((q - fq - .65) / .35))) / 7 * .9 + p * .1;
      h += w[1] * (fbm(x / 55, y / 55) - .4) * .25 - w[2] * .03;
    } else h += (fbm(x / 30 + isl, y / 30) - .4) * .15 + (isl === 1 ? .12 : 0);
    return { h, d, isl, w };
  }
  const heightAt = (x, y) => info(x, y).h;

  // ---------------------------------------------------------------- tracés (rivières, sentiers, ponts)
  function sampleCurve(pts) {
    const out = [pts[0]]; let p0 = pts[0];
    for (let i = 1; i < pts.length - 1; i++) {
      const cp = pts[i], end = i < pts.length - 2 ? [(pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2] : pts[i + 1];
      for (let t = .05; t <= 1.001; t += .05) { const a = (1 - t) * (1 - t), b = 2 * (1 - t) * t, d = t * t; out.push([a * p0[0] + b * cp[0] + d * end[0], a * p0[1] + b * cp[1] + d * end[1]]); }
      p0 = end;
    }
    return out;
  }
  const RIVERS = [[[880, 300], [950, 420], [900, 520], [1000, 600], [1080, 660], [1150, 700], [1240, 790]], [[560, 330], [600, 450], [520, 560], [560, 680], [580, 760], [520, 860], [470, 905]]].map(sampleCurve);
  const TRAILS = [[[765, 640], [700, 560], [600, 520], [470, 560], [360, 590]], [[765, 640], [740, 520], [690, 420], [620, 300], [520, 230]], [[765, 640], [820, 520], [860, 400], [850, 300]],
    [[765, 640], [900, 600], [1040, 560], [1160, 520], [1250, 440]], [[765, 640], [790, 760], [800, 900]], [[600, 520], [560, 680], [470, 760], [380, 820]], [[1040, 560], [1000, 700], [985, 745]]].map(sampleCurve);
  const BRIDGES = [];
  for (const ts of TRAILS) for (const rs of RIVERS) {
    let best = null;
    for (let i = 1; i < ts.length; i++) for (let j = 1; j < rs.length; j++) { const d = Math.hypot(ts[i][0] - rs[j][0], ts[i][1] - rs[j][1]); if (d < 6 && (!best || d < best.d)) best = { d, j }; }
    if (best) { const j = best.j, p = rs[j], q = rs[Math.min(rs.length - 1, j + 1)], o = rs[Math.max(0, j - 1)]; BRIDGES.push({ x: p[0], y: p[1], ang: Math.atan2(q[1] - o[1], q[0] - o[0]) }); }
  }
  const RIVER_W = 90 / K, TRAIL_W = 34 / K; // largeurs en unités carte

  // ---------------------------------------------------------------- lieux (unités carte)
  const CAVES = [
    { n: 1, x: 330, y: 600, kind: "pix", name: "Grotte des Racines", mode: "temps réel" },
    { n: 2, x: 985, y: 768, kind: "doux", name: "Grotte Marine", mode: "tour par tour" },
    { n: 3, x: 392, y: 205, kind: "pix", name: "Grotte des Brumes", mode: "temps réel" },
    { n: 4, x: 1250, y: 382, kind: "doux", name: "Grotte du Vent", mode: "tour par tour" },
    { n: 5, x: 842, y: 262, kind: "pix", name: "Cœur du Volcan", mode: "boss final" },
    { n: 6, x: 1480, y: 800, kind: "doux", name: "Grotte des Tortues", mode: "temps réel" },
    { n: 7, x: 1420, y: 175, kind: "doux", name: "Grotte du Phare", mode: "temps réel" },
    { n: 8, x: 140, y: 855, kind: "doux", name: "Grotte des Étoiles", mode: "tour par tour" },
  ];
  const NPCS = [[860, 880], [640, 760], [260, 470], [420, 690], [560, 150], [330, 300], [1110, 560], [1260, 520], [960, 330], [720, 300]];
  const BOSSES = [[905, 936, "Roi Crabe Corail", 1], [1030, 905, "Petit Kraken", 1], [380, 500, "Grand Gorille Moussu"], [270, 690, "Serpent-Liane"], [512, 500, "Gardien du Temple"],
    [430, 172, "Reine Grenouille"], [560, 285, "Esprit des Brumes"], [1235, 420, "Bélier Tonnerre"], [1347, 330, "Aigle-Roi", 1], [1110, 676, "Gargouille des Ruines"], [690, 205, "Dragonnet de Lave"], [985, 165, "Phénix Cendré"]];
  // Décors habités : [type, x, y]
  const PLACES = [
    ["hut", 880, 850], ["hut", 905, 868], ["hut", 930, 852], ["fire", 905, 885], ["pier", 950, 870, .35],
    ["tent", 600, 850], ["tent", 615, 870], ["fire", 632, 880], ["field", 690, 705, 0], ["field", 842, 700, 1],
    ["treehouse", 400, 440], ["treehouse", 438, 460], ["treehouse", 420, 490], ["temple", 485, 525], ["torch", 455, 533], ["torch", 515, 533], ["ruin", 420, 640], ["totem", 360, 700], ["totem", 470, 560],
    ["stilt", 450, 235], ["stilt", 485, 250], ["stilt", 470, 275], ["pier", 440, 262, .2], ["lantern", 430, 225], ["lantern", 500, 240], ["lantern", 455, 290],
    ["stone", 1160, 530], ["stone", 1188, 545], ["stone", 1210, 522], ["stone", 1175, 505], ["mill", 1120, 430], ["mill", 1150, 410], ["mill", 1290, 470], ["tower", 1300, 330],
    ["field", 1110, 600, 0], ["field", 1150, 612, 1], ["ruin", 1100, 700], ["ruin", 1118, 690],
    ["temple", 720, 330], ["torch", 690, 340], ["torch", 750, 340], ["tent", 960, 300, "#8a6a6a"], ["fire", 980, 310], ["crystal", 980, 250, "#c9a3e8"], ["crystal", 995, 258, "#9fd3ef"],
    ["crystal", 700, 250, "#c9a3e8"], ["crystal", 760, 200, "#ff9a6a"], ["geyser", 640, 200], ["geyser", 1020, 210], ["geyser", 930, 160],
    ["wreck", 800, 936],
  ];
  const ANIMAL_ZONES = [ // où vivent les animaux : [espèce, x, y, nombre]
    ["vache", 705, 745, 4], ["vache", 860, 745, 3], ["mouton", 1260, 585, 6], ["mouton", 720, 560, 3], ["cheval", 700, 600, 3], ["poule", 770, 690, 5], ["cochon", 820, 600, 3],
    ["chevre", 1180, 600, 4], ["canard", 560, 700, 4], ["chien", 760, 650, 2], ["chat", 900, 860, 2], ["lapin", 650, 650, 4], ["lapin", 940, 700, 3],
    ["crabe", 700, 905, 5], ["crabe", 1050, 860, 4], ["mouette", 880, 910, 4], ["bernard", 600, 900, 4],
    ["singe", 420, 470, 4], ["perroquet", 300, 560, 4], ["papillon", 450, 620, 5],
    ["grenouille", 470, 260, 5], ["libellule", 420, 230, 4], ["heron", 540, 200, 3],
    ["bouquetin", 1230, 450, 4], ["lezard", 1150, 650, 4], ["aigle", 1280, 360, 2],
    ["salamandre", 760, 300, 4], ["scarabee", 960, 280, 4], ["chauvesouris", 900, 200, 3],
  ];

  // ---------------------------------------------------------------- couleurs
  function baseColor(x, y, r) {
    let col;
    if (r.d > 1) {
      const dep = clamp((r.d - 1) * 2.6), caus = fbm(x / 18 + fbm(x / 60, y / 60) * 2, y / 18);
      col = mix([150, 226, 238], [64, 150, 196], sm(dep)); col = mix(col, [255, 255, 255], clamp((caus - .62) * 1.8) * (1 - dep) * .5);
      if (r.d < 1.05) col = mix(col, [255, 252, 244], clamp(1 - (r.d - 1) / .05) * .95);
      else if (r.d < 1.12 && Math.sin(r.d * 90 - 1) * .5 + .5 > .88) col = mix(col, [235, 250, 255], .5);
      return col;
    }
    let base;
    if (r.isl >= 0) { base = r.d > .82 ? [246, 226, 182] : ISLES[r.isl].col; if (r.isl === 2 && r.d < .82) base = mix(base, [230, 215, 255], fbm(x / 20, y / 20)); }
    else {
      const w = r.w; base = [0, 0, 0];
      for (let i = 0; i < 5; i++) { base[0] += BIOMES[i].col[0] * w[i]; base[1] += BIOMES[i].col[1] * w[i]; base[2] += BIOMES[i].col[2] * w[i]; }
      const n = fbm(x / 25, y / 25);
      if (w[1] > .3) base = mix(base, mix([70, 140, 78], [120, 186, 104], n), w[1] * .8);
      if (w[2] > .3) base = mix(base, [118, 140, 108], w[2] * clamp((n - .55) * 4) * .8);
      if (w[4] > .3) { const vr = Math.hypot(x - VOL.x, (y - VOL.y) * 1.2);
        if (vr < 36) base = mix([255, 120, 60], [255, 214, 100], clamp(1 - vr / 20)); else if (vr < 60) base = [110, 74, 66];
        const lava = fbm(x / 9, y / 26); if (vr < 230 && vr > 60 && lava > .7 && lava < .74 && Math.abs(Math.atan2(y - VOL.y, x - VOL.x) - 1.9) < .5) base = mix(base, [230, 110, 60], .7); else if (vr < 230 && vr > 60 && lava >= .74 && Math.abs(Math.atan2(y - VOL.y, x - VOL.x) - 1.9) < .5) base = mix(base, [90, 60, 56], .6); }
      const gl = Math.hypot(x - VILLAGE.x, (y - VILLAGE.y) * 1.25); if (w[0] > .4 && gl < 130 + fbm(x / 40, y / 40) * 30) base = mix(base, [186, 226, 160], w[0]);
      const shore = clamp((r.d - .86) / .06); if (w[3] < .6 && w[4] < .6) base = mix(base, [246, 226, 182], shore); else base = mix(base, [168, 158, 150], shore * .7);
    }
    return base;
  }
  function shadeColor(base, sx, sy, x, y, r, grain) {
    const shade = clamp(.55 + (-sx - 1.3 * sy) * 49.5, 0, 1.2);
    const vt = (fbm(x / 8, y / 8) - .5) * 12 + grain;
    let col = [base[0] * (.78 + .38 * shade) + vt, base[1] * (.78 + .38 * shade) + vt, base[2] * (.78 + .38 * shade) + vt];
    if (r.d > .97 && r.isl < 0) col = mix(col, [222, 206, 170], .35);
    return col;
  }

  // Rendu d'une zone de la carte dans un canvas : x0,y0 en unités carte, step = unités carte par pixel.
  // Relief et biomes (qui varient lentement) sont calculés sur une grille grossière puis interpolés.
  function renderArea(canvas, x0, y0, step, worldGrain) {
    const w = canvas.width, h = canvas.height, g = canvas.getContext("2d");
    const img = g.createImageData(w, h), D = img.data;
    const cs = Math.max(step, 1.2), gx0 = x0 - cs, gy0 = y0 - cs;
    const gw = Math.ceil((w * step) / cs) + 4, gh = Math.ceil((h * step) / cs) + 4, N = gw * gh;
    const GH = new Float32Array(N), GD = new Float32Array(N), GI = new Int8Array(N), GW = [0, 1, 2, 3, 4].map(() => new Float32Array(N));
    for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) {
      const r = info(gx0 + i * cs, gy0 + j * cs), k = j * gw + i;
      GH[k] = r.h; GD[k] = r.d; GI[k] = r.isl; if (r.w) for (let b = 0; b < 5; b++) GW[b][k] = r.w[b];
    }
    const SX = new Float32Array(N), SY = new Float32Array(N);
    for (let j = 1; j < gh - 1; j++) for (let i = 1; i < gw - 1; i++) { const k = j * gw + i; SX[k] = (GH[k + 1] - GH[k - 1]) / (2 * cs) * .7 + (i > 1 && i < gw - 2 ? (GH[k + 2] - GH[k - 2]) / (4 * cs) * .3 : 0); SY[k] = (GH[k + gw] - GH[k - gw]) / (2 * cs) * .7 + (j > 1 && j < gh - 2 ? (GH[k + 2 * gw] - GH[k - 2 * gw]) / (4 * cs) * .3 : 0); }
    const r = { h: 0, d: 0, isl: -1, w: [0, 0, 0, 0, 0] };
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const x = x0 + i * step, y = y0 + j * step;
      const fx = (x - gx0) / cs, fy = (y - gy0) / cs, ix = fx | 0, iy = fy | 0, tx = fx - ix, ty = fy - iy;
      const k = iy * gw + ix, k1 = k + 1, k2 = k + gw, k3 = k2 + 1;
      const a = (1 - tx) * (1 - ty), b = tx * (1 - ty), c2 = (1 - tx) * ty, d2 = tx * ty;
      const L = (A) => A[k] * a + A[k1] * b + A[k2] * c2 + A[k3] * d2;
      r.h = L(GH); r.d = L(GD); r.isl = GI[(ty < .5 ? iy : iy + 1) * gw + (tx < .5 ? ix : ix + 1)];
      let sum = 0; for (let q = 0; q < 5; q++) { r.w[q] = L(GW[q]); sum += r.w[q]; }
      if (sum > 0.001) for (let q = 0; q < 5; q++) r.w[q] /= sum; else { r.w[0] = 1; r.w[1] = r.w[2] = r.w[3] = r.w[4] = 0; }
      if (r.d <= 1 && r.isl < 0) { const near = [GI[k], GI[k1], GI[k2], GI[k3]].find((v) => v >= 0); if (near !== undefined && sum < .5) r.isl = near; }
      const rr = r.d > 1 ? { h: r.h, d: r.d, isl: r.isl, w: null } : (r.isl >= 0 ? { h: r.h, d: r.d, isl: r.isl, w: null } : r);
      let col = baseColor(x, y, rr);
      if (r.d <= 1) {
        const grain = worldGrain ? (noise(x * K / 9, y * K / 9) - .5) * 10 : 0;
        col = shadeColor(col, L(SX), L(SY), x, y, rr, grain);
      }
      const p = (j * w + i) * 4; D[p] = col[0]; D[p + 1] = col[1]; D[p + 2] = col[2]; D[p + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    // rivières et sentiers par-dessus
    g.save(); g.scale(1 / step, 1 / step); g.translate(-x0, -y0);
    const path = (s) => { g.beginPath(); s.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); };
    const minW = step * 1.2;
    g.lineCap = "round"; g.lineJoin = "round";
    for (const s of TRAILS) { path(s); g.strokeStyle = "rgba(110,80,50,.28)"; g.lineWidth = Math.max(minW * 1.6, TRAIL_W * 1.3); g.stroke(); g.strokeStyle = "#e9d3a6"; g.lineWidth = Math.max(minW, TRAIL_W); g.stroke(); }
    for (const s of RIVERS) { path(s); g.strokeStyle = "rgba(70,100,60,.32)"; g.lineWidth = Math.max(minW * 2.2, RIVER_W * 1.5); g.stroke(); g.strokeStyle = "#5fb8da"; g.lineWidth = Math.max(minW * 1.6, RIVER_W); g.stroke(); g.strokeStyle = "#97dcf2"; g.lineWidth = Math.max(minW * .8, RIVER_W * .55); g.stroke(); }
    g.restore();
  }

  // ---------------------------------------------------------------- tuiles du monde
  const TILE = 512, TEX = 2; // une tuile = 512 px du monde, dessinée à 1 texel pour 2 px
  const tiles = new Map(); let queue = [];
  let overview = null;
  function getOverview() {
    if (overview) return overview;
    overview = document.createElement("canvas"); overview.width = 400; overview.height = 250;
    renderArea(overview, 0, 0, MW / 400, false); return overview;
  }
  function tile(tx, ty, urgent) {
    const key = tx + "," + ty; const t = tiles.get(key);
    if (t) { t.used = performance.now(); return t.canvas; }
    const i = queue.indexOf(key);
    if (urgent) { if (i > 0) queue.splice(i, 1); if (i !== 0) queue.unshift(key); } else if (i < 0) queue.push(key);
    return null;
  }
  function work(budgetMs = 10) { // calcule des tuiles en attente sans bloquer l'image
    const t0 = performance.now();
    while (queue.length && performance.now() - t0 < budgetMs) {
      const key = queue.shift(); const [tx, ty] = key.split(",").map(Number);
      const cv = document.createElement("canvas"); cv.width = TILE / TEX; cv.height = TILE / TEX;
      renderArea(cv, tx * TILE / K, ty * TILE / K, TEX / K, true);
      tiles.set(key, { canvas: cv, used: performance.now() });
      if (tiles.size > 70) { let old = null; for (const [k, v] of tiles) if (!old || v.used < old[1].used) old = [k, v]; tiles.delete(old[0]); }
    }
  }
  const clearQueue = (keep) => { queue = queue.filter((k) => keep.has(k)); };

  const isleAt = (x, y) => { for (let i = 0; i < 3; i++) { const I = ISLES[i]; if (Math.abs(x - I.x) > I.rx * 1.4 || Math.abs(y - I.y) > I.ry * 1.4) continue; if (isleD(I, x, y) < .985) return i; } return -1; };
  return { isleAt, MW, MH, K, TAU, ISLES, BIOMES, VOL, VILLAGE, RIVERS, TRAILS, BRIDGES, RIVER_W, TRAIL_W, CAVES, PLACES, ANIMAL_ZONES, NPCS, BOSSES,
    info, heightAt, weights, mainD, fbm, noise, hash, renderArea, getOverview, tile, work, clearQueue, TILE };
})();
