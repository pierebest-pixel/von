/* Comète — police pixel 3×5 dessinée à la main, avec accents. */
(function () {
  "use strict";
  const G = {
    A: [".#.", "#.#", "###", "#.#", "#.#"], B: ["##.", "#.#", "##.", "#.#", "##."],
    C: [".##", "#..", "#..", "#..", ".##"], D: ["##.", "#.#", "#.#", "#.#", "##."],
    E: ["###", "#..", "##.", "#..", "###"], F: ["###", "#..", "##.", "#..", "#.."],
    G: [".##", "#..", "#.#", "#.#", ".##"], H: ["#.#", "#.#", "###", "#.#", "#.#"],
    I: ["###", ".#.", ".#.", ".#.", "###"], J: ["..#", "..#", "..#", "#.#", ".#."],
    K: ["#.#", "#.#", "##.", "#.#", "#.#"], L: ["#..", "#..", "#..", "#..", "###"],
    M: ["#...#", "##.##", "#.#.#", "#...#", "#...#"], N: ["#..#", "##.#", "#.##", "#..#", "#..#"],
    O: [".#.", "#.#", "#.#", "#.#", ".#."], P: ["##.", "#.#", "##.", "#..", "#.."],
    Q: [".#.", "#.#", "#.#", "##.", ".##"], R: ["##.", "#.#", "##.", "#.#", "#.#"],
    S: [".##", "#..", ".#.", "..#", "##."], T: ["###", ".#.", ".#.", ".#.", ".#."],
    U: ["#.#", "#.#", "#.#", "#.#", "###"], V: ["#.#", "#.#", "#.#", "#.#", ".#."],
    W: ["#...#", "#...#", "#.#.#", "##.##", "#...#"], X: ["#.#", "#.#", ".#.", "#.#", "#.#"],
    Y: ["#.#", "#.#", ".#.", ".#.", ".#."], Z: ["###", "..#", ".#.", "#..", "###"],
    0: ["###", "#.#", "#.#", "#.#", "###"], 1: [".#.", "##.", ".#.", ".#.", "###"],
    2: ["##.", "..#", ".#.", "#..", "###"], 3: ["##.", "..#", ".#.", "..#", "##."],
    4: ["#.#", "#.#", "###", "..#", "..#"], 5: ["###", "#..", "##.", "..#", "##."],
    6: [".##", "#..", "###", "#.#", "###"], 7: ["###", "..#", ".#.", ".#.", ".#."],
    8: ["###", "#.#", "###", "#.#", "###"], 9: ["###", "#.#", "###", "..#", "##."],
    " ": ["..", "..", "..", "..", ".."], ".": [".", ".", ".", ".", "#"], ",": [".", ".", ".", "#", "#"],
    ":": [".", "#", ".", "#", "."], ";": [".", "#", ".", "#", "#"], "!": ["#", "#", "#", ".", "#"],
    "?": ["##.", "..#", ".#.", "...", ".#."], "-": ["...", "...", "###", "...", "..."],
    "+": ["...", ".#.", "###", ".#.", "..."], "/": ["..#", "..#", ".#.", "#..", "#.."],
    "%": ["#.#", "..#", ".#.", "#..", "#.#"], "'": ["#", "#", ".", ".", "."],
    "(": [".#", "#.", "#.", "#.", ".#"], ")": ["#.", ".#", ".#", ".#", "#."],
    "<": ["..#", ".#.", "#..", ".#.", "..#"], ">": ["#..", ".#.", "..#", ".#.", "#.."],
    "=": ["...", "###", "...", "###", "..."], "«": ["....", ".#.#", "#.#.", ".#.#", "...."],
    "»": ["....", "#.#.", ".#.#", "#.#.", "...."], "×": ["...", "#.#", ".#.", "#.#", "..."],
    "*": ["#.#", ".#.", "#.#", "...", "..."], "#": [".#.#.", "#####", ".#.#.", "#####", ".#.#."],
    "♥": [".#.#.", "#####", "#####", ".###.", "..#.."],
  };
  const ACC = { "́": "acute", "̀": "grave", "̂": "circ", "̈": "trema", "̧": "ced" };

  function glyphs(str) {
    const out = [];
    const s = String(str).replace(/Œ/g, "OE").replace(/œ/g, "oe").replace(/’/g, "'").toUpperCase().normalize("NFD");
    for (const ch of s) {
      if (ACC[ch]) { if (out.length) out[out.length - 1].acc = ACC[ch]; continue; }
      if (/[̀-ͯ]/.test(ch)) continue;
      const g = G[ch] || G["?"];
      out.push({ g, acc: null });
    }
    return out;
  }
  function measure(str) {
    let w = 0;
    for (const o of glyphs(str)) w += o.g[0].length + 1;
    return Math.max(0, w - 1);
  }
  const cache = new Map();
  function render(str, color) {
    const key = str + "\u0001" + color;
    let c = cache.get(key);
    if (c) return c;
    if (cache.size > 400) cache.clear();
    const list = glyphs(str);
    const w = Math.max(1, measure(str));
    c = document.createElement("canvas");
    c.width = w; c.height = 8;
    const x2 = c.getContext("2d");
    x2.fillStyle = color;
    let x = 0;
    for (const o of list) {
      const gw = o.g[0].length;
      for (let r = 0; r < 5; r++) for (let k = 0; k < gw; k++) if (o.g[r][k] === "#") x2.fillRect(x + k, r + 2, 1, 1);
      const mid = x + (gw >> 1);
      if (o.acc === "acute") { x2.fillRect(mid + 1, 0, 1, 1); x2.fillRect(mid, 1, 1, 1); }
      else if (o.acc === "grave") { x2.fillRect(mid - 1, 0, 1, 1); x2.fillRect(mid, 1, 1, 1); }
      else if (o.acc === "circ") { x2.fillRect(mid, 0, 1, 1); x2.fillRect(mid - 1, 1, 1, 1); x2.fillRect(mid + 1, 1, 1, 1); }
      else if (o.acc === "trema") { x2.fillRect(x, 0, 1, 1); x2.fillRect(x + gw - 1, 0, 1, 1); }
      else if (o.acc === "ced") { /* sous la lettre : on garde la lettre lisible */ }
      x += gw + 1;
    }
    c.baseline = 2;
    cache.set(key, c);
    return c;
  }
  // y = haut des majuscules ; align : "left" | "center" | "right"
  function text(ctx, str, x, y, color, opt) {
    opt = opt || {};
    const s = opt.scale || 1;
    str = String(str);
    const w = measure(str) * s;
    let ox = x;
    if (opt.align === "center") ox = x - Math.floor(w / 2);
    else if (opt.align === "right") ox = x - w;
    ox = Math.round(ox); const oy = Math.round(y - 2 * s);
    if (opt.shadow) {
      const sh = render(str, opt.shadow);
      ctx.drawImage(sh, ox + s, oy + s, sh.width * s, sh.height * s);
    }
    if (opt.outline) {
      const ol = render(str, opt.outline);
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) ctx.drawImage(ol, ox + dx * s, oy + dy * s, ol.width * s, ol.height * s);
    }
    const c = render(str, color);
    ctx.drawImage(c, ox, oy, c.width * s, c.height * s);
    return w;
  }
  // coupe un texte en lignes de largeur max (pixels, échelle 1)
  function wrap(str, maxW) {
    const lines = [];
    for (const para of String(str).split("\n")) {
      let line = "";
      for (const word of para.split(" ")) {
        const t = line ? line + " " + word : word;
        if (measure(t) > maxW && line) { lines.push(line); line = word; } else line = t;
      }
      lines.push(line);
    }
    return lines;
  }
  window.PixFont = { text, measure, wrap };
})();
