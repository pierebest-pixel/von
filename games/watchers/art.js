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


  // ------------------------------------------------ Région 2 : Archipel des Marées (nuit tropicale)
  const P2 = { g1: "#c9a070", g2: "#b88f62", g3: "#dcb684", tg1: "#2a7a5a", tg2: "#3a9a6e", tg3: "#1d5a42",
    p1: "#4f4436", p2: "#433a2e", p3: "#5f5242", w1: "#1f5a8a", w2: "#2a76a8", w3: "#8fd8f0",
    tr1: "#1f6a4a", tr2: "#2e8a5e", tr3: "#46a874", trk: "#6b4a30", trk2: "#4e3622", out: "#1a1020" };
  function sand(seed) { return grass(seed, P2); }
  function shallow(frame = 0) { return paint(T, T, (x, y) => ((y % 5 === 1 && (x + frame) % 7 < 3) ? "#bff2ff" : ((x * 3 + y * 5) % 9 === 0 ? "#4fc0d0" : "#3aa8c0"))); }
  function deep(frame = 0) { return water(frame, P2); }
  function planks() { return paint(T, T, (x, y) => (y % 4 === 3 ? "#3a2418" : (x === (y < 8 ? 5 : 11) ? "#3a2418" : (y % 4 === 0 ? "#a0744a" : "#86603c")))); }
  function palm() {
    return paint(32, 32, (x, y) => {
      const tx = 15 + Math.round(Math.sin(y / 6) * 1.5);
      if (y >= 12 && y < 31 && x >= tx && x < tx + 3) return x === tx ? "#1a1020" : (y % 3 === 0 ? "#5a3a24" : "#7a5234");
      const fronds = [[-13, 4], [13, 5], [-9, -4], [10, -3], [0, -8]];
      for (const [dx, dy] of fronds) for (let i = 0; i <= 12; i++) {
        const fx = 16 + dx * i / 12, fy = 11 + dy * i / 12 + (i * i) / 30;
        if (Math.abs(x + .5 - fx) < 1.6 && Math.abs(y + .5 - fy) < 1.3) return i > 9 ? "#1f6a4a" : (i % 2 ? "#2e8a5e" : "#46a874");
      }
      if (Math.hypot(x - 15, y - 12) < 2.2) return "#5a3a22";
      return null;
    });
  }
  function shell() { const b = sand(13), g = b.getContext("2d"); g.drawImage(sprite(["................","................","................","................","................","......aaaa......",".....abcbca.....","....abcbcbca....","....acbcbcba....",".....aaaaaa.....","................","................","................","................","................","................"], { a: "#2a1a22", b: "#c9849a", c: "#e8b8c4" }), 0, 0); return b; }

  // ------------------------------------------------ Région 3 : Pics de Givre (nuit glaciale)
  const P3 = { g1: "#8a9ab0", g2: "#7c8ca4", g3: "#a4b4c8", tg1: "#3a5a6a", tg2: "#4a6e80", tg3: "#2a4250",
    p1: "#5c6a80", p2: "#4f5c72", p3: "#6c7a90", w1: "#1a2e48", w2: "#24405e", w3: "#6a94b8",
    tr1: "#12303a", tr2: "#1a404c", tr3: "#d6e2ee", trk: "#3a2a20", trk2: "#2a1e16", out: "#0a1018" };
  function snow(seed) { return grass(seed, P3); }
  function ice() { return paint(T, T, (x, y) => ((x - y + 16) % 11 === 0 ? "#c9e2f2" : ((x + y) % 13 === 0 ? "#9cc4dc" : "#7fa8c4"))); }
  function snowPine() {
    return paint(32, 32, (x, y) => {
      if (y >= 27 && y < 31 && x >= 14 && x < 18) return x === 14 ? "#0a1018" : "#3a2a20";
      const hw = Math.floor((y - 2) * .5);
      if (y >= 2 && y < 27 && Math.abs(x + .5 - 16) <= hw + .5) {
        if (Math.abs(x + .5 - 16) > hw - .5) return "#0a1018";
        if ((y - 2) % 6 < 2 && Math.abs(x + .5 - 16) < hw - 1) return "#d6e2ee";
        return x < 16 ? "#1a404c" : "#12303a";
      }
      return null;
    });
  }
  function campfire(frame = 0) {
    const b = snow(17), g = b.getContext("2d");
    g.drawImage(sprite(["................","................","................","................",
      ".......a........","......aba.......",".....abcba......",".....bcdcb......","....abcddcba....","....bccddccb....",
      "...eeebccbeee...","..efffeeeefffe..","...eeffffffee...","....eeeeeeee....","................","................"],
      { a: frame ? "#ff9a4a" : "#ffb04a", b: "#ff6a2a", c: "#ffd36b", d: "#fff3c0", e: "#2a1a12", f: "#5a3a22" }), 0, 0);
    return b;
  }
  function iceRock() { const b = snow(19), g = b.getContext("2d"); g.drawImage(paint(T, T, (x, y) => { const d = Math.hypot((x + .5 - 8) / 6.5, (y + .5 - 9) / 5.5); if (d > 1) return null; if (d > .82) return "#0a1018"; return x - y > 2 ? "#4a6e80" : (x < 7 && y < 8 ? "#c9e2f2" : "#8fb4cc"); }), 0, 0); return b; }

  // ------------------------------------------------ Région 4 : Couronne Éteinte (ruines dans l'obscurité)
  const P4 = { g1: "#2a1a26", g2: "#24161f", g3: "#352230", tg1: "#3a1230", tg2: "#4a1a3e", tg3: "#260a20",
    p1: "#3a2e34", p2: "#30262b", p3: "#463a40", w1: "#3a0a14", w2: "#5a1220", w3: "#ff5a3a",
    tr1: "#1a0e16", tr2: "#24141e", tr3: "#2e1a26", trk: "#1a0e10", trk2: "#120a0c", out: "#060306" };
  function ash(seed) { const b = grass(seed, P4), g = b.getContext("2d"); const r = rnd(seed + 3); g.fillStyle = "#ff5a3a"; let x = Math.floor(r() * 12) + 2, y = Math.floor(r() * 12) + 2; if (r() > .6) for (let k = 0; k < 5; k++) { g.fillRect(x, y, 1, 1); x += r() > .5 ? 1 : -1; y += 1; } return b; }
  function flagstone(seed) { return paint(T, T, (x, y) => (x % 8 === 0 || y % 8 === (x < 8 ? 3 : 7)) ? "#1a1216" : (((x >> 3) + (y >> 3) + seed) % 3 === 0 ? "#3e3238" : "#463a40")); }
  function ruinWall() { return paint(T, T, (x, y) => (y % 5 === 4 || (x + (Math.floor(y / 5) % 2) * 4) % 8 === 0) ? "#120a0e" : (y < 2 ? "#4a3a44" : "#33262e")); }
  function lava(frame = 0) { return paint(T, T, (x, y) => { const v = Math.sin((x + frame * 2) * .6) + Math.cos((y - frame) * .5); return v > 1.1 ? "#ffd36b" : v > .3 ? "#ff7a3a" : v > -.6 ? "#d9342a" : "#8a1420"; }); }
  function deadTree() {
    return paint(32, 32, (x, y) => {
      const br = [[16, 30, 16, 10], [16, 18, 9, 9], [16, 15, 23, 7], [12, 13, 8, 5], [21, 10, 25, 4], [16, 11, 17, 4]];
      for (const [x1, y1, x2, y2] of br) { const t = Math.max(0, Math.min(1, ((x + .5 - x1) * (x2 - x1) + (y + .5 - y1) * (y2 - y1)) / ((x2 - x1) ** 2 + (y2 - y1) ** 2)));
        const d = Math.hypot(x + .5 - (x1 + t * (x2 - x1)), y + .5 - (y1 + t * (y2 - y1))); const wdt = y1 === 30 ? 1.8 - t : 1.1 - t * .5;
        if (d < wdt) return d > wdt - .7 ? "#060306" : "#2a1a20"; }
      return null;
    });
  }
  function brazier(frame = 0) {
    const b = flagstone(2), g = b.getContext("2d");
    g.drawImage(sprite(["................","................","......a.........",".....aba.a......","....abcbaba.....","....bcdcbcb.....",
      "...dddddddddd...","...effffffffe...","....effffffe....",".....eggggee.....".slice(0,16),"......egge......","......egge......",".....eggggе.....".replace("е","e"),"....eeeeeeee....","................","................"],
      { a: frame ? "#c46fb0" : "#a36bd6", b: "#7c3aed", c: "#d9b8ff", d: "#2a1a26", e: "#120a0e", f: "#3a2a32", g: "#4a3a42" }), 0, 0);
    return b;
  }
  function crystal() {
    const b = ash(23), g = b.getContext("2d");
    g.drawImage(sprite(["................","........a.......",".......aba......",".......abca.....","......abbca.....","......abbbca....","...a..abbbca....","..aba.abbbca.a..",
      "..abca.abbca.aba.".slice(0,16),"..abbca.abca.abca".slice(0,16),"...abca.abca.aba".slice(0,16),"...aaaaaaaaaaaa.","................","................","................","................"],
      { a: "#0b2a24", b: "#5ee0c6", c: "#d9fff6" }), 0, 0);
    return b;
  }

  return { P2, P3, P4, sand, shallow, deep, planks, palm, shell, snow, ice, snowPine, campfire, iceRock, ash, flagstone, ruinWall, lava, deadTree, brazier, crystal, rnd, T, paint, sprite, mushroomSprite, grass, tallGrass, path, water, tree, flowers, rock, mushroom, fence, sign, house, hero, npc, P1 };
})();
