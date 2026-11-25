/* Watchers — carte du monde d'Aube, façon vieille carte au trésor (pixel art 160×200). */
"use strict";
const WORLD_MAP = (() => {
  const W = 160, H = 200;
  function rnd(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
  // Lieux (coordonnées en pixels de carte)
  const PLACES = [
    { id: "brindille", name: "Brindille", region: 1, x: 40, y: 168 },
    { id: "boismurmure", name: "Bois-Murmure", region: 1, x: 58, y: 140 },
    { id: "lacpale", name: "Lac Pâle", region: 1, x: 30, y: 128 },
    { id: "portsel", name: "Port-Sel", region: 2, x: 112, y: 150 },
    { id: "phare", name: "Le Phare", region: 2, x: 140, y: 176 },
    { id: "cimeblanche", name: "Cime-Blanche", region: 3, x: 34, y: 70 },
    { id: "grotte", name: "Grotte Bleue", region: 3, x: 52, y: 92 },
    { id: "couronne", name: "La Couronne", region: 4, x: 92, y: 40 },
  ];
  const ROADS = [["brindille", "boismurmure"], ["boismurmure", "lacpale"], ["boismurmure", "portsel"], ["portsel", "phare"], ["boismurmure", "grotte"], ["grotte", "cimeblanche"], ["cimeblanche", "couronne"]];

  // Forme du continent : distance bruitée
  function landValue(x, y) {
    const n = Math.sin(x * .09 + 1) * Math.cos(y * .07) * .09 + Math.sin((x - y) * .05) * .06 + Math.sin(x * .3 + y * .25) * .02;
    const main = Math.hypot((x - 70) / 58, (y - 110) / 86);
    return 1 - main + n;
  }
  function regionAt(x, y) {
    const n = Math.sin(x * .31) * 3 + Math.cos(y * .27) * 3 + Math.sin((x + y) * .13) * 4;
    if (y + n < 62 && x - n * .5 > 60 && x < 126) return 4;
    if (y + n < 106 && x + n < 80) return 3;
    if (x + n > 94) return 2;
    return 1;
  }

  // Palette « parchemin sombre » (encre claire sur papier brûlé)
  const C = {
    paperA: "#2a2119", paperB: "#231b14", paperC: "#1d1611", speck: "#30261c", frame0: "#0d0a07", frame1: "#4a3828",
    sea: "#3e5a5a", seaEdge: "#4f6e6a", coast: "#d9c49a",
    tint: { 1: "#33402a", 2: "#4a3c26", 3: "#3e4650", 4: "#4a1e26" },
    ink: "#d9c49a", tree: "#7fa060", tree2: "#a6c27a", trunk: "#d9c49a", palm: "#7fa060", palmT: "#b08a5a",
    snow: "#ffffff", ruin: "#c9485a", lake: "#4f7a80", sunRing: "#ff7a3a", sunCore: "#050203", road: "#e0703a",
    town: "#d9c49a", townIn: "#2a2119", rose: "#e0703a", fog: "rgba(5,3,2,.5)",
  };
  function draw(unlocked = [1], here = null) {
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const g = c.getContext("2d"); const r = rnd(11);
    const px = (x, y, col) => { g.fillStyle = col; g.fillRect(x, y, 1, 1); };
    // Parchemin
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const edge = Math.min(x, y, W - 1 - x, H - 1 - y);
      const stain = Math.sin(x * .2) * Math.cos(y * .17) + Math.sin(x * .05 + y * .08);
      let col = stain > 1.2 ? C.paperC : stain > .4 ? C.paperB : C.paperA;
      if ((x * 7 + y * 13) % 23 === 0) col = C.speck;
      if (edge < 3) col = edge === 0 ? C.frame0 : C.frame1;
      px(x, y, col);
    }
    // Mer (hachures)
    for (let y = 4; y < H - 4; y++) for (let x = 4; x < W - 4; x++) {
      const v = landValue(x, y);
      const isle = x > 108 && y > 120 && (Math.hypot(x - 122, y - 132) < 7 || Math.hypot(x - 142, y - 150) < 6 || Math.hypot(x - 128, y - 168) < 5 || Math.hypot(x - 146, y - 178) < 6);
      if (v <= 0 && !isle) {
        if ((x + y) % 6 === 0 && y % 3 === 0) px(x, y, C.sea);
        if (v > -.05 && (x + y) % 2 === 0) px(x, y, C.seaEdge);
      }
    }
    // Terres : contour + teinte légère par région
    const tint = C.tint;
    const isLand = (x, y) => landValue(x, y) > 0 || (x > 108 && y > 120 && (Math.hypot(x - 122, y - 132) < 7 || Math.hypot(x - 142, y - 150) < 6 || Math.hypot(x - 128, y - 168) < 5 || Math.hypot(x - 146, y - 178) < 6));
    for (let y = 4; y < H - 4; y++) for (let x = 4; x < W - 4; x++) {
      if (!isLand(x, y)) continue;
      const border = !isLand(x + 1, y) || !isLand(x - 1, y) || !isLand(x, y + 1) || !isLand(x, y - 1);
      px(x, y, border ? C.coast : tint[regionAt(x, y)]);
    }
    // Relief et décor dessinés à l'encre
    const ink = C.ink;
    const mountain = (x, y, snow) => { for (let i = 0; i < 5; i++) { px(x - i, y + i, ink); px(x + i, y + i, ink); } if (snow) { px(x, y + 1, C.snow); px(x - 1, y + 2, C.snow); px(x + 1, y + 2, C.snow); } };
    const tree = (x, y) => { px(x, y, C.tree); px(x - 1, y + 1, C.tree); px(x + 1, y + 1, C.tree); px(x, y + 1, C.tree2); px(x, y + 2, C.trunk); };
    const palm = (x, y) => { px(x, y, C.palm); px(x - 1, y, C.palm); px(x + 1, y - 1, C.palm); px(x, y + 1, C.palmT); px(x, y + 2, C.palmT); };
    for (let i = 0; i < 520; i++) {
      const x = 6 + Math.floor(r() * (W - 12)), y = 6 + Math.floor(r() * (H - 12));
      if (!isLand(x, y) || landValue(x, y) < .08 && !(x > 108 && y > 120)) continue;
      const reg = regionAt(x, y);
      if (reg === 3 && r() < .5) mountain(x, y, true);
      else if (reg === 1 && r() < .6) tree(x, y);
      else if (reg === 2 && r() < .25) palm(x, y);
      else if (reg === 4 && r() < .3) { px(x, y, C.ruin); px(x, y - 1, C.ruin); }
    }
    // Lac Pâle
    for (let y = -4; y <= 4; y++) for (let x = -6; x <= 6; x++) if ((x * x) / 36 + (y * y) / 16 < 1) px(30 + x, 122 + y, (x * x) / 36 + (y * y) / 16 > .7 ? C.coast : C.lake);
    // La Couronne : soleil noir
    for (let y = -9; y <= 9; y++) for (let x = -9; x <= 9; x++) { const d = Math.hypot(x, y); if (d < 9.5 && d > 7.5) px(92 + x, 26 + y, C.sunRing); else if (d <= 7.5) px(92 + x, 26 + y, C.sunCore); }
    // Routes en pointillés
    const P = Object.fromEntries(PLACES.map((p) => [p.id, p]));
    for (const [a, b] of ROADS) {
      const A = P[a], B = P[b], n = Math.round(Math.hypot(B.x - A.x, B.y - A.y));
      for (let i = 0; i < n; i += 3) px(Math.round(A.x + (B.x - A.x) * i / n), Math.round(A.y + (B.y - A.y) * i / n + Math.sin(i / 6) * 2), C.road);
    }
    // Villes et lieux
    for (const p of PLACES) {
      const x = p.x, y = p.y;
      g.fillStyle = C.town; g.fillRect(x - 2, y - 2, 5, 4); g.fillStyle = C.townIn; g.fillRect(x - 1, y - 1, 3, 2);
      px(x, y - 3, ink); px(x - 1, y - 2, ink); px(x + 1, y - 2, ink);
    }
    // Rose des vents
    const cx = 140, cy = 22;
    for (let i = -8; i <= 8; i++) { px(cx + i, cy, ink); px(cx, cy + i, ink); }
    for (let i = 1; i < 4; i++) { px(cx - i, cy - 5 + i, C.rose); px(cx + i, cy - 5 + i, C.rose); }
    px(cx, cy - 9, C.rose);
    // Brouillard sur les régions verrouillées
    for (let y = 3; y < H - 3; y++) for (let x = 3; x < W - 3; x++) {
      if (!isLand(x, y) && landValue(x, y) < -.1) continue;
      if (!unlocked.includes(regionAt(x, y))) px(x, y, C.fog);
    }
    return c;
  }
  return { draw, PLACES, W, H };
})();
