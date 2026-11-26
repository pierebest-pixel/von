/* Comète — palette, sprites pixel art (vaisseau, ennemis, bonus, décor). */
(function () {
  "use strict";
  // Palette « Sweetie 16 »
  const PAL = {
    K: "#1a1c2c", P: "#5d275d", R: "#b13e53", O: "#ef7d57", Y: "#ffcd75", L: "#a7f070",
    G: "#38b764", T: "#257179", N: "#29366f", B: "#3b5dc9", b: "#41a6f6", C: "#73eff7",
    W: "#f4f4f4", S: "#94b0c2", s: "#566c86", D: "#333c57",
  };

  function canvas(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; }

  // Construit un sprite à partir de lignes de caractères (clé de palette, « . » = vide).
  // outline : ajoute un contour sombre d'un pixel.
  function build(rows, opt) {
    opt = opt || {};
    const pal = opt.pal || PAL;
    const w0 = Math.max(...rows.map((r) => r.length)), h0 = rows.length;
    const o = opt.outline === false ? 0 : 1;
    const c = canvas(w0 + o * 2, h0 + o * 2);
    const x = c.getContext("2d");
    const filled = (i, j) => j >= 0 && j < h0 && i >= 0 && i < w0 && rows[j][i] && rows[j][i] !== ".";
    if (o) {
      x.fillStyle = opt.outlineColor || "#0b0c14";
      for (let j = -1; j <= h0; j++) for (let i = -1; i <= w0; i++) {
        if (filled(i, j)) continue;
        if (filled(i - 1, j) || filled(i + 1, j) || filled(i, j - 1) || filled(i, j + 1)) x.fillRect(i + o, j + o, 1, 1);
      }
    }
    for (let j = 0; j < h0; j++) for (let i = 0; i < w0; i++) {
      const k = rows[j][i];
      if (!k || k === ".") continue;
      x.fillStyle = pal[k] || k;
      x.fillRect(i + o, j + o, 1, 1);
    }
    c.flash = silhouette(c, "#ffffff");
    return c;
  }
  function silhouette(src, color) {
    const c = canvas(src.width, src.height), x = c.getContext("2d");
    x.drawImage(src, 0, 0);
    x.globalCompositeOperation = "source-in";
    x.fillStyle = color; x.fillRect(0, 0, c.width, c.height);
    return c;
  }

  const S = {};
  S.player = build([
    ".....W.....",
    "....WCW....",
    "....bCb....",
    "...sbCbs...",
    "...WbbbW...",
    "..sWbbbWs..",
    ".BsWbWbWsB.",
    "BBsbbbbbsBB",
    "BR.sbbbs.RB",
    "R...sss...R",
    "....s.s....",
  ]);
  S.drone = build([
    "...",
    "SbS",
    "bCb",
    "SbS",
  ]);
  S.dart = build([
    "R.......R",
    "RO.....OR",
    ".ROYYYOR.",
    "..RYKYR..",
    "..ROYOR..",
    "...ROR...",
    "...ROR...",
    "....R....",
  ]);
  S.jelly = [
    build([
      "...PPPPP...",
      "..PbbbbbP..",
      ".PbCbbbCbP.",
      ".PbKbbbKbP.",
      ".PPbbbbbPP.",
      "..P.P.P.P..",
      "..b.b.b.b..",
      ".b.b.b.b...",
    ]),
    build([
      "...PPPPP...",
      "..PbbbbbP..",
      ".PbCbbbCbP.",
      ".PbKbbbKbP.",
      ".PPbbbbbPP.",
      "..P.P.P.P..",
      "..b.b.b.b..",
      "...b.b.b.b.",
    ]),
  ];
  S.turret = build([
    "..sssssssss..",
    ".sSSSSSSSSSs.",
    "sSDDDDDDDDDSs",
    "sSDRRRRRRRDSs",
    "sSDROOYOORDSs",
    ".sDRRRRRRRDs.",
    "..sDDDDDDDs..",
    "....sDDDs....",
    ".....sKs.....",
    ".....sKs.....",
  ]);
  S.kamikaze = build([
    "....O....",
    "...ORO...",
    ".O.RYR.O.",
    ".ORYWYRO.",
    "OOYWWWYOO",
    ".ORYWYRO.",
    ".O.RYR.O.",
    "...ORO...",
    "....O....",
  ]);
  S.tank = build([
    ".....sSSSSSSSSSs.....",
    "...ssSSSSSSSSSSSss...",
    "..sSSDDDDDDDDDDDSSs..",
    ".sSDDNNNNNNNNNNNDDSs.",
    "sSDDNBBBBBBBBBBBNDDSs",
    "sSDNBBbbbbbbbbbBBNDSs",
    "sSDNBbRRRRRRRRRbBNDSs",
    "sSDNBbRYYYYYYYRbBNDSs",
    "sSDNBbRRRRRRRRRbBNDSs",
    "sSDNBBbbbbbbbbbBBNDSs",
    ".sDDNBBBBBBBBBBBNDDs.",
    "..sDDNNNNNNNNNNNDDs..",
    "...ssDDDsKKKsDDDss...",
    ".....sss.K.K.sss.....",
    ".......s..K..s.......",
  ]);
  S.splitter = build([
    "...GGGGG...",
    "..GLLLLLG..",
    ".GLLKLKLLG.",
    "GLLLLLLLLLG",
    "GLTLLLLLTLG",
    "GLLTTTTTLLG",
    ".GLLLLLLLG.",
    "..GGGGGGG..",
  ]);
  S.splitMini = build([
    ".GGG.",
    "GLKLG",
    "GLLLG",
    ".GTG.",
  ]);
  S.mine = build([
    "...R...",
    "..RKR..",
    ".RKYKR.",
    "RKYRYKR",
    ".RKYKR.",
    "..RKR..",
    "...R...",
  ]);
  S.swoop = build([
    "P.........P",
    "PP.......PP",
    ".PPbPPPbPP.",
    "..PPCCCPP..",
    "...PPKPP...",
    "....PPP....",
    ".....P.....",
  ]);
  S.larva = build([
    ".L.L.",
    "LGGGL",
    "GYGYG",
    ".GGG.",
    "..G..",
  ]);

  // Icônes 5×5 des bonus
  const ICONS = {
    laser: ["..#..", "..#..", "..#..", "..#..", "..#.."],
    canon: [".###.", "#####", "##.##", "#####", ".###."],
    spread: ["#.#.#", "#.#.#", ".###.", "..#..", "..#.."],
    foudre: ["..##.", ".##..", "####.", "..##.", ".##.."],
    missiles: ["..#..", ".###.", ".###.", ".#.#.", "#...#"],
    rayon: [".###.", ".###.", ".###.", ".###.", ".###."],
    onde: ["#...#", "#...#", ".###.", ".....", "....."],
    soin: [".#.#.", "#####", "#####", ".###.", "..#.."],
    grandsoin: [".#.#.", "#####", "#####", ".###.", "..#.."],
    bouclier: [".###.", "#...#", "#...#", ".#.#.", "..#.."],
    drones: ["#...#", ".....", "..#..", ".....", "#...#"],
    bombe: ["#.#.#", ".###.", "#####", ".###.", "#.#.#"],
    aimant: ["#...#", "#...#", "#...#", "#...#", ".###."],
    chrono: [".###.", "#.#.#", "#.###", "#...#", ".###."],
    surchauffe: ["..#..", ".###.", "##.##", "#####", ".###."],
    orbitales: [".#.#.", "#...#", ".....", "#...#", ".#.#."],
    puissance: ["..#..", ".###.", "#####", "..#..", "..#.."],
  };
  const PICK = {
    laser:      { col: "#73eff7", rim: "#3b5dc9", name: "LASER", weapon: true },
    canon:      { col: "#a7f070", rim: "#257179", name: "CANON ALIEN", weapon: true },
    spread:     { col: "#ffcd75", rim: "#ef7d57", name: "ÉVENTAIL", weapon: true },
    foudre:     { col: "#f4f4f4", rim: "#41a6f6", name: "FOUDRE", weapon: true },
    missiles:   { col: "#ef7d57", rim: "#b13e53", name: "MISSILES", weapon: true },
    rayon:      { col: "#f4f4f4", rim: "#5d275d", name: "RAYON", weapon: true },
    onde:       { col: "#73eff7", rim: "#257179", name: "ONDE", weapon: true },
    soin:       { col: "#ff5a6e", rim: "#5d275d", name: "SOIN +25" },
    grandsoin:  { col: "#ffcd75", rim: "#b13e53", name: "GRAND SOIN +60" },
    bouclier:   { col: "#73eff7", rim: "#29366f", name: "BOUCLIER" },
    drones:     { col: "#94b0c2", rim: "#333c57", name: "DRONES" },
    bombe:      { col: "#ffcd75", rim: "#b13e53", name: "BOMBE NOVA" },
    aimant:     { col: "#b13e53", rim: "#333c57", name: "AIMANT" },
    chrono:     { col: "#a7f070", rim: "#29366f", name: "RALENTI" },
    surchauffe: { col: "#ef7d57", rim: "#5d275d", name: "SURCHAUFFE" },
    orbitales:  { col: "#41a6f6", rim: "#1a1c2c", name: "ORBITALES" },
    puissance:  { col: "#f4f4f4", rim: "#38b764", name: "PUISSANCE +1" },
  };
  function icon(kind, color, scale) {
    scale = scale || 1;
    const rows = ICONS[kind];
    const c = canvas(5 * scale, 5 * scale), x = c.getContext("2d");
    x.fillStyle = color;
    rows.forEach((r, j) => { for (let i = 0; i < 5; i++) if (r[i] === "#") x.fillRect(i * scale, j * scale, scale, scale); });
    return c;
  }
  // capsule 13×13
  const capsules = {};
  for (const k of Object.keys(PICK)) {
    const p = PICK[k];
    const c = canvas(13, 13), x = c.getContext("2d");
    const heal = k === "soin" || k === "grandsoin";
    x.fillStyle = "#0b0c14";
    if (heal) { x.fillRect(3, 0, 7, 13); x.fillRect(0, 3, 13, 7); x.fillRect(1, 1, 11, 11); }
    else { x.fillRect(2, 0, 9, 13); x.fillRect(0, 2, 13, 9); x.fillRect(1, 1, 11, 11); }
    x.fillStyle = p.rim;
    if (heal) { x.fillRect(4, 1, 5, 11); x.fillRect(1, 4, 11, 5); x.fillRect(2, 2, 9, 9); }
    else { x.fillRect(2, 1, 9, 11); x.fillRect(1, 2, 11, 9); }
    x.fillStyle = "rgba(255,255,255,.25)"; x.fillRect(2, 2, 9, 1);
    x.drawImage(icon(k, p.col), 4, 4);
    capsules[k] = c;
  }
  // pictos HUD (avec contour)
  const hudIcons = {};
  for (const k of Object.keys(PICK)) {
    const c = canvas(7, 7), x = c.getContext("2d");
    const ic = icon(k, PICK[k].col);
    const dark = silhouette(ic, "#0b0c14");
    for (const [dx, dy] of [[0, 1], [2, 1], [1, 0], [1, 2]]) x.drawImage(dark, dx, dy);
    x.drawImage(ic, 1, 1);
    hudIcons[k] = c;
  }

  // Cristaux de score (3 tailles)
  S.gem = [
    build([".C.", "CWC", ".C."]),
    build([".b.", "bCb", "CWC", ".b."]),
    build(["..Y..", ".YOY.", "YOWOY", ".YOY.", "..Y.."]),
  ];

  // Astéroïdes procéduraux
  function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
  function asteroid(r, seed) {
    const R = rng(seed), size = r * 2 + 3;
    const rows = [];
    const bumps = [...Array(8)].map(() => 0.75 + R() * 0.35);
    for (let j = 0; j < size; j++) {
      let row = "";
      for (let i = 0; i < size; i++) {
        const dx = i - size / 2 + 0.5, dy = j - size / 2 + 0.5;
        const a = (Math.atan2(dy, dx) + Math.PI) / (Math.PI * 2) * 8;
        const k = Math.floor(a) % 8, f = a - Math.floor(a);
        const rr = r * (bumps[k] * (1 - f) + bumps[(k + 1) % 8] * f);
        const d = Math.hypot(dx, dy);
        if (d > rr) { row += "."; continue; }
        const light = (-dx - dy) / (r * 1.4);
        let ch = light > 0.35 ? "S" : light > -0.2 ? "s" : "D";
        if (R() < 0.08 && d < rr - 1.5) ch = "D";
        row += ch;
      }
      rows.push(row);
    }
    return build(rows);
  }
  S.asteroids = [];
  for (let i = 0; i < 9; i++) S.asteroids.push(asteroid(3 + (i % 3) * 3, 1000 + i * 77));

  // Planètes de décor (pixelisées, grandes, lointaines)
  function planet(r, seed, c1, c2, c3, ring) {
    const R = rng(seed), size = r * 2 + (ring ? r * 2 : 2);
    const c = canvas(size, size), x = c.getContext("2d");
    const cx = size / 2, cy = size / 2;
    const bands = [...Array(6)].map(() => R());
    for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) {
      const dx = i - cx + 0.5, dy = j - cy + 0.5, d = Math.hypot(dx, dy);
      if (d > r) continue;
      const band = bands[Math.floor(((dy / r + 1) / 2) * 6) % 6];
      const shade = (dx + dy * 0.6) / r;
      let col = band > 0.5 ? c1 : c2;
      if (shade > 0.35) col = c3;
      if (shade > 0.7 || d > r - 1) col = "#1a1c2c";
      if ((i + j) % 2 === 0 && shade > 0.55 && shade <= 0.7) col = "#1a1c2c";
      x.fillStyle = col; x.fillRect(i, j, 1, 1);
    }
    if (ring) {
      x.fillStyle = c1;
      for (let a = 0; a < Math.PI * 2; a += 0.01) {
        const px = cx + Math.cos(a) * r * 1.8, py = cy + Math.sin(a) * r * 0.45;
        if (Math.sin(a) < 0 && Math.hypot(px - cx, py - cy) < r) continue;
        x.fillRect(Math.floor(px), Math.floor(py), 1, 1);
      }
    }
    return c;
  }
  S.planets = [
    planet(22, 3, "#ef7d57", "#b13e53", "#5d275d", true),
    planet(16, 9, "#41a6f6", "#3b5dc9", "#29366f", false),
    planet(28, 21, "#38b764", "#257179", "#29366f", false),
    planet(12, 41, "#ffcd75", "#ef7d57", "#b13e53", true),
    planet(34, 55, "#94b0c2", "#566c86", "#333c57", false),
    planet(18, 71, "#a7f070", "#38b764", "#257179", true),
  ];
  // Nébuleuses : nuages tramés
  function nebula(w, h, seed, col) {
    const R = rng(seed), c = canvas(w, h), x = c.getContext("2d");
    const blobs = [...Array(7)].map(() => [R() * w, R() * h, 8 + R() * w * 0.3]);
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      let v = 0;
      for (const [bx, by, br] of blobs) v += Math.max(0, 1 - Math.hypot(i - bx, j - by) / br);
      const dither = ((i & 1) + (j & 1) * 2) / 4;
      if (v > 0.9 + dither * 0.3) { x.fillStyle = col; x.globalAlpha = v > 1.6 ? 0.35 : 0.18; x.fillRect(i, j, 1, 1); }
    }
    return c;
  }
  S.nebulas = [nebula(120, 90, 5, "#5d275d"), nebula(140, 100, 8, "#29366f"), nebula(110, 80, 13, "#257179"), nebula(120, 90, 17, "#b13e53")];

  window.Sprites = { PAL, S, build, silhouette, canvas, capsules, hudIcons, PICK, ICONS, icon, rng };
})();
