/* Watchers — graphismes en pixel art dessinés par code (tuiles 16×16). */
"use strict";
const ART = (() => {
  const T = 16;
  // Générateur pseudo-aléatoire déterministe
  function rnd(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
  function canvas(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; }
  function paint(w, h, fn) {
    const c = canvas(w, h), g = c.getContext("2d");
    const img = g.createImageData(w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const col = fn(x, y); if (!col) continue;
      const i = (y * w + x) * 4, n = parseInt(col.slice(1), 16);
      img.data[i] = n >> 16; img.data[i + 1] = (n >> 8) & 255; img.data[i + 2] = n & 255; img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0); return c;
  }
  // Sprite à partir d'une grille de caractères + palette
  function sprite(rows, pal) {
    return paint(rows[0].length, rows.length, (x, y) => pal[rows[y][x]] || null);
  }

  // ------------------------------------------------ Région 1 : Vallée des Brumes
  const P1 = { g1: "#34553c", g2: "#2d4a35", g3: "#436a48", tg1: "#1b3a2a", tg2: "#25503a", tg3: "#122a1e",
    p1: "#6e5f4c", p2: "#5c4f3f", p3: "#80705a", w1: "#1e3550", w2: "#284764", w3: "#5c7f9e",
    tr1: "#173022", tr2: "#21402d", tr3: "#2f573c", trk: "#3a281d", trk2: "#2a1c14", out: "#0d140f" };

  function grass(seed, pal = P1) {
    const r = rnd(seed);
    const tufts = Array.from({ length: 3 }, () => [Math.floor(r() * 14) + 1, Math.floor(r() * 13) + 2]);
    return paint(T, T, (x, y) => {
      for (const [a, b] of tufts) { if ((x === a && y === b) || (x === a + 1 && y === b - 1) || (x === a - 1 && y === b - 1)) return pal.g3; }
      return ((x * 7 + y * 13 + seed) % 11 === 0) ? pal.g2 : pal.g1;
    });
  }
  function tallGrass(pal = P1) {
    return paint(T, T, (x, y) => {
      const col = x % 4, row = (y + (x % 8 < 4 ? 0 : 2)) % 8;
      if (row < 1) return pal.g1;
      if (col === 0) return pal.tg3;
      if (row < 3) return col === 1 ? pal.tg2 : pal.tg1;
      return col === 2 ? pal.tg2 : pal.tg1;
    });
  }
  function path(seed, pal = P1) {
    const r = rnd(seed); const dots = Array.from({ length: 5 }, () => [Math.floor(r() * 16), Math.floor(r() * 16), r() > .5]);
    return paint(T, T, (x, y) => { for (const [a, b, l] of dots) if (x === a && y === b) return l ? pal.p3 : pal.p2; return pal.p1; });
  }
  function water(frame = 0, pal = P1) {
    return paint(T, T, (x, y) => {
      const wave = (y % 6 === 2) && ((x + frame * 2) % 8 < 3);
      const wave2 = (y % 6 === 5) && ((x + 4 - frame * 2 + 16) % 8 < 2);
      return wave ? pal.w3 : wave2 ? pal.w2 : pal.w1;
    });
  }
  // Arbre 2×2 tuiles (32×32)
  function tree(pal = P1) {
    return paint(32, 32, (x, y) => {
      const cx = 16, cy = 12, d = Math.hypot(x + .5 - cx, (y + .5 - cy) * 1.15);
      if (y >= 22 && y < 30 && x >= 13 && x < 19) return (x === 13 || x === 18 || y === 29) ? pal.out : (x < 16 ? pal.trk : pal.trk2);
      if (d < 12.5) {
        if (d > 11.3) return pal.out;
        const lx = x - cx + 4, ly = y - cy + 5; // lumière en haut à gauche
        const blob = Math.sin(x * .9) + Math.cos(y * 1.1);
        if (lx * lx + ly * ly < 30 && blob > -.2) return pal.tr3;
        if (y > 15 || blob < -1.2) return pal.tr1;
        return pal.tr2;
      }
      return null;
    });
  }
  function flowers(seed, pal = P1) {
    const base = grass(seed, pal); const g = base.getContext("2d"); const r = rnd(seed + 9);
    const cols = ["#8f8aa0", "#6e4a86", "#8c2a3c"];
    for (let i = 0; i < 3; i++) { const x = 2 + Math.floor(r() * 11), y = 2 + Math.floor(r() * 11), c = cols[i % 3];
      g.fillStyle = c; g.fillRect(x, y - 1, 1, 1); g.fillRect(x - 1, y, 3, 1); g.fillRect(x, y + 1, 1, 1); g.fillStyle = "#b39550"; g.fillRect(x, y, 1, 1); }
    return base;
  }
  function rock(pal = P1) {
    const base = grass(3, pal); const g = base.getContext("2d");
    const r = paint(T, T, (x, y) => { const d = Math.hypot((x + .5 - 8) / 6.5, (y + .5 - 9.5) / 5); if (d > 1) return null; if (d > .82) return "#2b2b33"; return (x < 8 && y < 9) ? "#6f6c7a" : (y > 11 ? "#3f3d48" : "#55525f"); });
    g.drawImage(r, 0, 0); return base;
  }
  // Champignon lumineux (mécanique de la brume)
  function mushroomSprite() {
    return sprite([
      "................", "................", "................", "................",
      "................", ".....aaaaaa.....", "....abbbcbba....", "...abcbbbbcba...",
      "...abbbbbbbba...", "....aaaaaaaa....", "......adda......", "......adda......",
      "......adda......", ".....aaaaaa.....", "................", "................"],
      { a: "#123236", b: "#5ee0c6", c: "#d9fff6", d: "#cfe9df" });
  }
  function mushroom(pal = P1) {
    const base = grass(5, pal); base.getContext("2d").drawImage(mushroomSprite(), 0, 0); return base;
  }
  function fence(pal = P1) {
    const base = grass(7, pal); const g = base.getContext("2d");
    const f = sprite([
      "................", "................", "................", "................",
      "..aaa......aaa..", "..aba......aba..", "aaabaaaaaaaabaaa", "bbbbbbbbbbbbbbbb",
      "aaabaaaaaaaabaaa", "..aba......aba..", "aaabaaaaaaaabaaa", "bbbbbbbbbbbbbbbb",
      "aaabaaaaaaaabaaa", "..aba......aba..", "..aaa......aaa..", "................"],
      { a: "#1e150e", b: "#5a4430" });
    g.drawImage(f, 0, 0); return base;
  }
  function sign(pal = P1) {
    const base = grass(11, pal); const g = base.getContext("2d");
    const s = sprite([
      "................", "................", "..aaaaaaaaaaaa..", "..abbbbbbbbbba..",
      "..abccccccccba..", "..abbbbbbbbbba..", "..abccccccbbba..", "..abbbbbbbbbba..",
      "..aaaaaaaaaaaa..", "......abba......", "......abba......", "......abba......",
      "......abba......", ".....aaaaaa.....", "................", "................"],
      { a: "#1a120c", b: "#5e4630", c: "#3a2a1c" });
    g.drawImage(s, 0, 0); return base;
  }
  // Maison 4×4 tuiles (64×64)
  function house(roof = "#4a2440", roof2 = "#351a2e") {
    return paint(64, 64, (x, y) => {
      const out = "#1e1820";
      // toit
      if (y >= 2 && y < 30) {
        const half = 30 - Math.abs(x + .5 - 32) * 0.0; // toit droit
        if (x < 2 || x > 61) return null;
        if (y === 2 || x === 2 || x === 61 || y === 29) return out;
        if (y % 5 === 0) return roof2;
        return (Math.floor(x / 6) + Math.floor(y / 5)) % 2 ? roof : "#56294a";
      }
      // murs
      if (y >= 30 && y < 62 && x >= 5 && x <= 58) {
        if (x === 5 || x === 58 || y === 61) return out;
        // porte
        if (x >= 26 && x <= 37 && y >= 42) { if (x === 26 || x === 37 || y === 42) return out; if (x === 35 && y === 52) return "#f2d16b"; return "#5b3d2a"; }
        // fenêtres
        for (const wx of [11, 43]) if (x >= wx && x <= wx + 10 && y >= 38 && y <= 48) {
          if (x === wx || x === wx + 10 || y === 38 || y === 48 || x === wx + 5 || y === 43) return "#3a2a1e"; return "#d9a441"; }
        if (y === 30 || y === 31) return "#4e463f";
        return (y % 6 === 0) ? "#6b6259" : "#7a7065";
      }
      return null;
    });
  }

  // ------------------------------------------------ Personnage
  // Joueur : capuche sombre, écharpe violette, lanterne turquoise à la main.
  const HERO_PAL = { o: "#07050a", h: "#1a1622", H: "#2a2433", s: "#c9a48c", S: "#a8846e", e: "#07050a", r: "#5b1f86", R: "#3e125e", b: "#141119", B: "#211c28", l: "#5ee0c6", L: "#d9fff6", k: "#120e0c" };
  const HERO = {
    down: [
      "................",
      ".....oooooo.....",
      "....oHHHHHHo....",
      "...oHhhhhhhHo...",
      "...ohhsssshho...",
      "...ohsessesho...",
      "...ohssssssho...",
      "....orrrrrro....",
      "...oRrrrrrrRo...",
      "...obBBrrBBbol..",
      "...obBBBBBBboLl.",
      "...obbBBBBbbol..",
      "....obbbbbbo....",
      "....oboooobo....",
      "....okk..kko....",
      "....ooo..ooo....",
    ],
    up: [
      "................",
      ".....oooooo.....",
      "....oHHHHHHo....",
      "...oHhhhhhhHo...",
      "...ohhhhhhhho...",
      "...ohhhhhhhho...",
      "...oHhhhhhhHo...",
      "....orrrrrro....",
      "...oRrrrrrrRo...",
      "..lobBBBBBBbo...",
      ".Llobbbrrbbbo...",
      "..lobbBBBBbbo...",
      "....obbbbbbo....",
      "....oboooobo....",
      "....okk..kko....",
      "....ooo..ooo....",
    ],
  };
  function hero(dir = "down") { return sprite(HERO[dir], HERO_PAL); }

  // PNJ simple (villageoise)
  function npc(hair = "#5e3420", dress = "#2c4f57") {
    return sprite([
      "................",
      ".....oooooo.....",
      "....ohhhhhho....",
      "...ohhhhhhhho...",
      "...ohssssssho...",
      "...ohsessesho...",
      "...ohssssssho...",
      "....osssssso....",
      "...oddddddddo...",
      "..osdddddddddso.",
      "...oddddddddo...",
      "...oddddddddo...",
      "....odddddddo...",
      "....oddoodddo...",
      "....okko.okko...",
      "....ooo..ooo....",
    ], { o: "#07050a", h: hair, s: "#c9a48c", e: "#07050a", d: dress, k: "#120e0c" });
  }

  return { T, paint, sprite, mushroomSprite, grass, tallGrass, path, water, tree, flowers, rock, mushroom, fence, sign, house, hero, npc, P1 };
})();
