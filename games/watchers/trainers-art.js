/* Watchers — dresseurs et boss en pied (pixel art 32×48, de face). */
"use strict";
const TRAINER_ART = (() => {
  const W = 32, H = 48;
  const SKIN = ["#f1c9a5", "#d9a988", "#b07a56", "#7a4e34", "#cfd6e0", "#9a8aa0"];
  const shade = (h, f) => { const n = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); return "#" + n.map((v) => Math.max(0, Math.min(255, Math.round(f > 0 ? v + (255 - v) * f : v * (1 + f)))).toString(16).padStart(2, "0")).join(""); };

  /* spec = { skin, hair, hairStyle: short|long|bun|spiky|hood|bald|braid, outfit: coat|robe|armor|captain|cloak,
              main, accent, hat?: crown|tricorne|horns|circlet|none, mask?, eyes?, aura?, prop?: staff|lantern|sword|none } */
  function draw(spec) {
    const grid = Array.from({ length: H }, () => Array(W).fill(null));
    const set = (x, y, c) => { if (x >= 0 && y >= 0 && x < W && y < H) grid[y][x] = c; };
    const rect = (x, y, w, h, c) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) set(x + i, y + j, c); };
    const sym = (x, y, w, h, c) => { rect(x, y, w, h, c); rect(W - x - w, y, w, h, c); };
    const skin = spec.skin || SKIN[0], hair = spec.hair || "#3a2a20", main = spec.main || "#3a4a6a", acc = spec.accent || "#c9a84a";
    const dk = shade(main, -.3), lt = shade(main, .18);

    // Aura (derrière)
    if (spec.aura) for (let y = 4; y < H - 2; y++) for (let x = 2; x < W - 2; x++) {
      const d = Math.hypot((x - 15.5) / 14, (y - 24) / 22); if (d < 1 && d > .78 && (x + y) % 2 === 0) set(x, y, spec.aura);
    }
    // Cape
    if (spec.outfit === "cloak" || spec.cape) { for (let y = 15; y < 45; y++) { const hw = 7 + Math.floor((y - 15) / 4); rect(16 - hw, y, hw * 2, 1, y > 42 ? shade(spec.cape || main, -.45) : shade(spec.cape || main, -.25)); } }
    // Jambes
    if (spec.outfit === "robe" || spec.outfit === "cloak") { for (let y = 28; y < 45; y++) { const hw = 6 + Math.floor((y - 28) / 3); rect(16 - hw, y, hw * 2, 1, y % 6 === 0 ? dk : main); } rect(10, 43, 12, 1, acc); }
    else { sym(11, 30, 4, 12, shade(main, -.45)); sym(10, 42, 5, 3, "#1a1418"); }
    // Torse
    for (let y = 15; y < 31; y++) { const hw = y < 18 ? 6 + (y - 15) : 8 - Math.floor((y - 18) / 6); rect(16 - hw, y, hw * 2, 1, main); }
    rect(15, 16, 2, 14, lt);
    if (spec.outfit === "armor") { sym(7, 15, 4, 3, acc); rect(10, 20, 12, 1, acc); rect(12, 24, 8, 1, dk); }
    if (spec.outfit === "captain") { for (let y = 17; y < 29; y += 3) { set(13, y, acc); set(18, y, acc); } sym(7, 15, 3, 2, acc); }
    if (spec.outfit === "coat") { rect(15, 16, 2, 14, dk); sym(12, 25, 2, 2, acc); }
    rect(10, 28, 12, 2, acc); // ceinture
    // Bras
    sym(6, 17, 3, 11, dk); sym(6, 28, 3, 2, skin);
    // Cou + tête
    rect(14, 13, 4, 3, shade(skin, -.12));
    for (let y = 3; y < 14; y++) { const hw = y < 5 ? 4 : y > 11 ? 4 : 5; rect(16 - hw, y, hw * 2, 1, skin); }
    // Yeux / masque
    if (spec.mask) { rect(11, 6, 10, 4, spec.mask); sym(12, 7, 2, 2, spec.eyes || "#ff5a3a"); }
    else { sym(12, 7, 2, 2, "#ffffff"); sym(13, 7, 1, 2, spec.eyes || "#1a1418"); rect(14, 11, 4, 1, shade(skin, -.25)); }
    // Cheveux
    const hs = spec.hairStyle || "short";
    if (hs === "hood") {
      for (let y = 1; y < 15; y++) { const hw = y < 3 ? 4 + y : 7; rect(16 - hw, y, hw * 2, 1, y < 4 ? dk : main); }
      // ouverture du visage, dans l'ombre de la capuche
      for (let y = 5; y < 13; y++) { const hw = y < 6 || y > 11 ? 3 : 4; rect(16 - hw, y, hw * 2, 1, spec.mask || shade(skin, -.35)); }
      sym(12, 7, 2, 2, spec.mask ? (spec.eyes || "#ff5a3a") : "#ffffff");
      if (!spec.mask) sym(13, 7, 1, 2, spec.eyes || "#1a1418");
      rect(12, 5, 8, 1, shade(main, -.5));
    }
    else if (hs !== "bald") {
      rect(10, 1, 12, 4, hair); rect(9, 3, 2, 6, hair); rect(21, 3, 2, 6, hair);
      if (hs === "long") { rect(8, 5, 3, 16, hair); rect(21, 5, 3, 16, hair); }
      if (hs === "bun") { rect(13, -1 + 1, 6, 2, hair); rect(14, 0, 4, 1, shade(hair, .2)); }
      if (hs === "spiky") for (let i = 0; i < 5; i++) { set(10 + i * 3, 0, hair); set(11 + i * 3, 0, hair); }
      if (hs === "braid") { for (let y = 8; y < 26; y++) set(22 + (y % 4 < 2 ? 0 : 1), y, hair); set(22, 26, acc); }
      rect(11, 2, 10, 1, shade(hair, .2));
    }
    // Couvre-chef
    if (spec.hat === "crown") { rect(10, 0, 12, 2, acc); for (let i = 0; i < 4; i++) set(11 + i * 3, -1 + 0, acc); set(16, 1, "#ff5a7a"); }
    if (spec.hat === "tricorne") { rect(7, 1, 18, 2, "#1a1418"); rect(10, -1 + 0, 12, 2, "#1a1418"); rect(8, 2, 16, 1, acc); }
    if (spec.hat === "horns") { for (let i = 0; i < 5; i++) { set(9 - Math.floor(i / 2), 3 - i, acc); set(22 + Math.floor(i / 2), 3 - i, acc); } }
    if (spec.hat === "circlet") { rect(10, 3, 12, 1, acc); set(16, 3, "#5ee0c6"); }
    // Accessoire tenu
    if (spec.prop === "staff") { for (let y = 8; y < 46; y++) set(27, y, "#5a3a22"); rect(26, 5, 3, 3, spec.aura || acc); }
    if (spec.prop === "lantern") { set(27, 27, "#1a1418"); rect(26, 28, 3, 4, "#5ee0c6"); set(27, 29, "#ffffff"); }
    if (spec.prop === "sword") { for (let y = 12; y < 30; y++) set(27, y, "#c9d6e8"); rect(25, 29, 5, 1, acc); rect(27, 30, 1, 3, "#5a3a22"); }

    // Contour
    const c = document.createElement("canvas"); c.width = W; c.height = H; const g = c.getContext("2d");
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let col = grid[y][x];
      if (!col && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => grid[y + dy]?.[x + dx] && grid[y + dy][x + dx] !== spec.aura)) col = "#0a070c";
      if (col) { g.fillStyle = col; g.fillRect(x, y, 1, 1); }
    }
    return c;
  }
  return { draw, SKIN, W, H };
})();
