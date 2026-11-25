/* Watchers — icônes des objets (pixel art 16×16). */
"use strict";
const ITEM_ART = (() => {
  const N = 16;
  function paint(fn, outline = "#0c0a12") {
    const px = [];
    for (let y = 0; y < N; y++) { px[y] = []; for (let x = 0; x < N; x++) px[y][x] = fn(x + .5, y + .5); }
    const c = document.createElement("canvas"); c.width = c.height = N; const g = c.getContext("2d");
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      let col = px[y][x];
      if (!col && outline && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => px[y + dy]?.[x + dx])) col = outline;
      if (col) { g.fillStyle = col; g.fillRect(x, y, 1, 1); }
    }
    return c;
  }
  const d = (x, y, a, b) => Math.hypot(x - a, y - b);

  // Lanterne « Fleur de métal » — pal = [anneau, pétale clair, pétale sombre, lumière, cœur]
  function lantern(pal) {
    const [ring, p1, p2, glow, core] = pal;
    return paint((x, y) => {
      if (Math.abs(d(x, y, 8, 2.6) - 1.3) < .55) return ring;
      if (y >= 3.5 && y <= 4.6 && Math.abs(x - 8) <= 1.4) return p2;
      const r = d(x, y, 8, 9.5); if (r > 5.6) return null;
      const a = Math.atan2(y - 9.5, x - 8);
      if (r < 2.2) return r < 1.2 ? core : glow;
      if (Math.abs(Math.sin(a * 2)) < .3 && r < 4.8) return glow;
      return Math.cos(a * 2) > 0 ? (r < 4.2 ? p1 : p2) : (r < 4.2 ? p2 : p1);
    });
  }
  const LANTERNS = {
    lanterne: ["#7fd3c3", "#3c8c7c", "#2a675b", "#5ee0c6", "#ffffff"],
    grande: ["#b8c8e8", "#5a78b8", "#3a548a", "#8fb4ff", "#ffffff"],
    aube: ["#f7d77a", "#c99a3a", "#8a6420", "#ffd36b", "#fffbe0"],
    eternelle: ["#e0c8ff", "#7c3aed", "#4c1d95", "#c46fb0", "#ffffff"],
  };

  // Fiole de soin — liq = couleur du liquide
  function vial(liq, liq2) {
    return paint((x, y) => {
      if (y < 3 && Math.abs(x - 8) < 1.6) return "#8a5a3a";
      if (y >= 3 && y < 5 && Math.abs(x - 8) < 1.6) return "#c9d6e8";
      const r = d(x, y, 8, 10); if (r > 5) return null;
      if (y < 7.5) return r < 3.5 && x < 7 ? "#ffffff" : "#c9d6e8";
      return x < 6.5 && y < 11 ? liq2 : liq;
    });
  }
  // Plume de revitalisation
  function feather(c1, c2) {
    return paint((x, y) => {
      const t = (x + y) / 2; if (t < 3 || t > 14) return null;
      const off = Math.abs(x - y) / 1.414, w = Math.sin((t - 3) / 11 * Math.PI) * 3.2;
      if (off < .6) return "#f5f0ff";
      if (off < w) return (x > y) ? c1 : c2;
      return null;
    });
  }
  // Herbe de soin d'état
  function herb(c1, c2) {
    return paint((x, y) => {
      if (Math.abs(x - 8) < .6 && y > 9 && y < 15) return "#3a6a2a";
      for (const [cx, cy, rx, ry] of [[5, 8, 3, 1.6], [11, 7, 3, 1.6], [8, 4, 1.6, 3]]) { const v = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2; if (v < 1) return v < .3 ? c2 : c1; }
      return null;
    });
  }
  // Baie (bonus / à échanger)
  function berry(c1, c2) {
    return paint((x, y) => {
      if (y < 5 && Math.abs(x - 8 - (5 - y) * .4) < .8) return "#3a6a2a";
      if (y >= 3 && y < 5 && x > 8 && x < 12) return "#4e9a4a";
      const r = d(x, y, 8, 10); if (r > 4.6) return null;
      return d(x, y, 6.5, 8.5) < 1.4 ? "#ffffff" : (r > 3.4 ? c2 : c1);
    });
  }
  // Pièce d'Éclat (monnaie)
  function coin() {
    return paint((x, y) => { const r = d(x, y, 8, 8); if (r > 6) return null; if (r > 4.8) return "#c99a3a"; return (x - y > 1) ? "#f2b134" : (Math.abs(x - 8) < 1 && Math.abs(y - 8) < 3 ? "#fff3a0" : "#f7d77a"); });
  }
  // Lettre (objet de quête)
  function letter() {
    return paint((x, y) => { if (x < 2 || x > 14 || y < 4 || y > 12) return null; if (Math.abs((y - 4) - Math.abs(x - 8) * .6) < .6 && y < 9) return "#a08a6a"; if (Math.abs(x - 8) < 1.3 && Math.abs(y - 9) < 1.2) return "#a3123a"; return "#e8dcc0"; });
  }
  function crystal() {
    return paint((x, y) => { const hw = y < 8 ? (y - 1) * .7 : (15 - y) * .5; if (y < 1 || y > 15 || Math.abs(x - 8) > hw) return null; return x < 8 ? "#9ff5e2" : (x < 10 ? "#5ee0c6" : "#2fae95"); });
  }

  const ICONS = {
    lanterne: () => lantern(LANTERNS.lanterne), grande: () => lantern(LANTERNS.grande),
    aube: () => lantern(LANTERNS.aube), eternelle: () => lantern(LANTERNS.eternelle),
    soin: () => vial("#ff5a7a", "#ffb0c0"), supersoin: () => vial("#c46fb0", "#f3c1e6"), soinmax: () => vial("#5ee0c6", "#d9fff6"),
    revive: () => feather("#f2b134", "#ffd36b"), revivemax: () => feather("#c46fb0", "#f3c1e6"),
    antidote: () => herb("#7c3aed", "#c4b5fd"), antibrule: () => herb("#3b7dd8", "#9fd3f5"), antigel: () => herb("#d9572b", "#f2b134"), totalsoin: () => herb("#4e9a4a", "#c4e06a"),
    baie: () => berry("#c9304a", "#8a1428"), baiebleue: () => berry("#3b7dd8", "#1c3f7a"),
    eclat: coin, lettre: letter, cristal: crystal,
  };
  const cache = {};
  const icon = (id) => (cache[id] = cache[id] || (ICONS[id] || ICONS.cristal)());
  return { icon, lantern, LANTERNS };
})();
