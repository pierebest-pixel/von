/* Comète — les 100 boss intergalactiques : factions, noms, sprites générés, attaques. */
(function () {
  "use strict";
  const { canvas, silhouette, rng } = window.Sprites;

  // ------------------------------------------------------------------ factions
  const FACTIONS = [
    {
      name: "PIRATES DU VIDE", motto: "Ta cargaison ou ta carcasse !",
      pals: [["#3a2120", "#7a3f2c", "#c07a4a", "#1a1c2c", "#ffcd75"], ["#2a1c2c", "#5d275d", "#b13e53", "#1a1c2c", "#ffcd75"], ["#28241c", "#6a5a3a", "#b0985a", "#1a1c2c", "#ef7d57"]],
      pool: ["broadside", "aimed", "mines", "fan", "charge", "minions"], move: "sway", feat: "skull", minion: "dart",
      names: ["Capitaine Barbe-Nova", "Rackham l'Astéroïde", "Mère Corsaire Zéla", "Le Borgne de Sirius", "Grog-Xan le Pillard", "Amirale Vipère Noire", "Crochet-Quasar", "Les Jumeaux Sabord", "Morgane des Anneaux", "Roi-Pirate Kraal"],
    },
    {
      name: "RUCHE XYLIENNE", motto: "Zzzk… la Ruche a faim…",
      pals: [["#1d3a1a", "#38b764", "#a7f070", "#1a1c2c", "#ffcd75"], ["#3a3010", "#b08a20", "#ffcd75", "#1a1c2c", "#a7f070"], ["#1a2c2a", "#257179", "#38b764", "#1a1c2c", "#ef7d57"]],
      pool: ["minions", "wave", "rain", "fan", "spiral"], move: "drift", feat: "mandibles", minion: "larva",
      names: ["Larve-Mère Skrit", "Dard d'Argent", "Essaim Zzyrr", "Mante Orbitale", "Pondeuse Vrakk", "Scarabée-Forteresse", "Frelon Impérial", "Gardienne du Nid", "Arachnox", "Reine Xylia"],
    },
    {
      name: "EMPIRE OBSIDIEN", motto: "Agenouille-toi devant l'Empire.",
      pals: [["#120f1a", "#2c2440", "#5d4a80", "#b13e53", "#ff5a6e"], ["#0f0f14", "#333c57", "#566c86", "#5d275d", "#c070ff"], ["#160c14", "#3a1a2c", "#6a2a44", "#ffcd75", "#ff5a6e"]],
      pool: ["beam", "aimed", "cross", "fan", "shards"], move: "heavy", feat: "core", minion: "swoop",
      names: ["Centurion Vex", "Inquisitrice Noxa", "Préfet Malachor", "Lame d'Ombre", "Légat Draxus", "Exécuteur Kaal", "Général Obsidius", "Archonte Sévéra", "Grand Tribun Morr", "Empereur Noctis"],
    },
    {
      name: "SYNDICAT CHROME", motto: "Votre dette est arrivée à échéance.",
      pals: [["#333c57", "#566c86", "#94b0c2", "#29366f", "#73eff7"], ["#29366f", "#3b5dc9", "#94b0c2", "#1a1c2c", "#73eff7"], ["#2c2c34", "#6a6a78", "#c8c8d4", "#b13e53", "#ff5a6e"]],
      pool: ["missiles", "beam", "aimed", "ring", "minions"], move: "figure8", feat: "visor", minion: "turret",
      names: ["Unité K-7", "Collecteur 404", "Directeur Ferron", "Androïde Sigma", "Méca-Huissier", "Liquidateur X9", "Comptable Fatal", "Titan PDG-01", "Ultra-Robot Gamma", "Conseil Oméga"],
    },
    {
      name: "CÉPHALODES", motto: "Les abysses du cosmos t'appellent…",
      pals: [["#3a1430", "#8a2a6a", "#e070b0", "#1a1c2c", "#73eff7"], ["#14203a", "#2a4a8a", "#5a8ae0", "#1a1c2c", "#ffcd75"], ["#2a1414", "#8a3030", "#e06a5a", "#1a1c2c", "#a7f070"]],
      pool: ["spiral", "wave", "gravity", "ring", "charge"], move: "figure8", feat: "tentacles", minion: "jelly",
      names: ["Calmar Vagabond", "Pieuvre Stellaire", "Nautilus Ancien", "Abyssa", "Tentaclor", "Kraken des Comètes", "Méduse Royale", "Grand Squilla", "Cthalassa", "Léviathan Ombrelune"],
    },
    {
      name: "NOMADES SOLAIRES", motto: "Brûle avec nous, voyageur !",
      pals: [["#5a1e10", "#ef7d57", "#ffcd75", "#b13e53", "#ffffff"], ["#4a3010", "#c08a20", "#ffe9a0", "#ef7d57", "#ffffff"], ["#4a1020", "#b13e53", "#ef7d57", "#ffcd75", "#ffffff"]],
      pool: ["ring", "spiral", "rain", "beam", "shards"], move: "sway", feat: "sun", minion: "kamikaze",
      names: ["Éclaireur Pyros", "Caravane Ardente", "Sœur Solstice", "Brasier Errant", "Chef Hélion", "Prophète Corona", "Phénix Rouge", "Matriarche Aurore", "Supernova Kahn", "Soleil Vivant Râ"],
    },
    {
      name: "SPECTRES DU NÉANT", motto: "Tu nous rejoindras… bientôt…",
      pals: [["#29366f", "#94b0c2", "#e8f4ff", "#1a1c2c", "#73eff7"], ["#2a1c3a", "#8a7ab0", "#e0d8ff", "#1a1c2c", "#c070ff"], ["#1a3a3a", "#6ab0a0", "#d8fff4", "#1a1c2c", "#a7f070"]],
      pool: ["teleport", "ring", "wave", "aimed", "cross"], move: "teleport", feat: "ghost", minion: "jelly",
      names: ["Feu Follet", "Écho Perdu", "Dame Brume", "Spectre Silencieux", "Faucheur Pâle", "Fantôme du Cargo", "Banshee Orbitale", "Hantise Polaire", "Revenant Ashur", "Seigneur du Néant"],
    },
    {
      name: "CRISTALIENS", motto: "Nous sommes éternels. Toi, non.",
      pals: [["#257179", "#41a6f6", "#73eff7", "#f4f4f4", "#ffffff"], ["#5d275d", "#b070e0", "#f0c0ff", "#f4f4f4", "#ffffff"], ["#257179", "#38b764", "#a7f070", "#f4f4f4", "#ffffff"]],
      pool: ["shards", "fan", "ring", "beam", "cross"], move: "heavy", feat: "facets", minion: "swoop",
      names: ["Éclat Errant", "Quartzor", "Prisme Jumeau", "Géode Furieuse", "Saphira", "Obélisque Chantant", "Diamantis", "Tour de Givre", "Cœur de Cristal", "Monolithe Prime"],
    },
    {
      name: "FERRAILLEURS", motto: "Joli vaisseau… On va le démonter !",
      pals: [["#3a3020", "#7a6a40", "#c0a860", "#1a1c2c", "#ffcd75"], ["#30302a", "#6a6a50", "#a8a88a", "#b13e53", "#ffcd75"], ["#3a2a20", "#8a5a30", "#d09050", "#1a1c2c", "#a7f070"]],
      pool: ["rain", "mines", "charge", "broadside", "missiles"], move: "drift", feat: "hazard", minion: "dart",
      names: ["Rouille-Bob", "Grand Recycleur", "Mama Boulons", "Casse-Boîtes", "Scrap-Kong", "Le Broyeur", "Chiffonnier Zorg", "Tas-de-Ferraille Rex", "Benne Infernale", "Baron Débris"],
    },
    {
      name: "DÉVOREURS D'ÉTOILES", motto: "…J'AI… FAIM… D'ÉTOILES…",
      pals: [["#1a0c2a", "#3a1a5a", "#7a3aa0", "#b13e53", "#ff5a6e"], ["#0c1a1a", "#1a3a40", "#2a7a80", "#ffcd75", "#ffffff"], ["#200a10", "#4a1424", "#8a2a40", "#73eff7", "#ffffff"]],
      pool: ["gravity", "beam", "spiral", "cross", "shards"], move: "heavy", feat: "eye", minion: "jelly",
      names: ["Œil de Ploutos", "Gueule Affamée", "Rejeton du Vide", "Avaleur de Lunes", "Iris Ultime", "Nébuleuse Vivante", "Le Regard", "Mange-Galaxies", "Trou-Noir Azaroth", "L'Ancien Qui Rêve"],
    },
  ];
  const RANKS = ["ÉCLAIREUR", "SERGENT", "CORSAIRE", "CHAMPION", "LIEUTENANT", "CAPITAINE", "COMMANDANT", "GÉNÉRAL", "SEIGNEUR", "SUPRÊME"];
  const RANK_FOR = { 0: ["MOUSSE", "PILLARD", "CORSAIRE", "BOUCANIER", "QUARTIER-MAÎTRE", "CAPITAINE", "FLIBUSTIER", "AMIRAL", "TERREUR", "ROI DES PIRATES"] };

  // ------------------------------------------------------------------ formes
  const ell = (u, v, cx, cy, rx, ry) => 1 - ((u - cx) ** 2 / (rx * rx) + (v - cy) ** 2 / (ry * ry));
  const rect = (u, v, x0, x1, y0, y1) => (u >= x0 && u <= x1 && v >= y0 && v <= y1 ? 1 : -1);
  const SHAPES = {
    // u : 0 = centre, 1 = bord ; v : 0 = haut, 1 = bas (le boss regarde vers le bas)
    skull: (u, v, R) => Math.max(ell(u, v, 0, 0.5, 0.55, 0.5), rect(u, v, 0, 0.95, 0.35 + R.a * 0.1, 0.6), ell(u, v, 0, 0.95, 0.2, 0.15), rect(u, v, 0.7, 0.85, 0.15, 0.8)),
    mandibles: (u, v, R) => Math.max(ell(u, v, 0, 0.35, 0.6, 0.35), ell(u, v, 0, 0.72, 0.4, 0.26), ell(u, v, 0.75, 0.45 + R.a * 0.2, 0.3, 0.12), ell(u, v, 0.7, 0.2, 0.35, 0.1)),
    core: (u, v, R) => Math.max(1 - u / (0.25 + v * 0.8) - (v > 0.95 ? 1 : 0), rect(u, v, 0, 0.95, 0.1, 0.25 + R.a * 0.1) - (u > 0.9 ? 0 : 0), ell(u, v, 0, 0.35, 0.4, 0.35)),
    visor: (u, v, R) => Math.max(rect(u, v, 0, 0.7, 0.1, 0.85), rect(u, v, 0, 0.98, 0.3, 0.55 + R.a * 0.2), rect(u, v, 0, 0.35, 0, 1)),
    tentacles: (u, v) => Math.max(ell(u, v, 0, 0.35, 0.75, 0.4), ell(u, v, 0, 0.7, 0.45, 0.25)),
    sun: (u, v, R) => Math.max(ell(u, v, 0, 0.5, 0.62, 0.48), (Math.abs(Math.sin(Math.atan2(v - 0.5, u) * (3 + Math.floor(R.a * 3)))) > 0.85 && ell(u, v, 0, 0.5, 1, 0.75) > 0 ? 1 : -1)),
    ghost: (u, v) => Math.max(ell(u, v, 0, 0.38, 0.75, 0.42), rect(u, v, 0, 0.75 - v * 0.1, 0.38, 0.85 + Math.sin(u * 14) * 0.08)),
    facets: (u, v, R) => Math.max(1 - (u / 0.8 + Math.abs(v - 0.45) / 0.55), 1 - ((u - 0.65) / 0.35) ** 2 - ((v - 0.35 - R.a * 0.2) / 0.3) ** 2, rect(u, v, 0, 0.18, 0, 1)),
    hazard: (u, v, R) => Math.max(rect(u, v, 0, 0.8, 0.15, 0.8), rect(u, v, 0.5, 1, 0.3 + R.a * 0.2, 0.55 + R.a * 0.2), ell(u, v, 0, 0.9, 0.3, 0.12)),
    eye: (u, v) => Math.max(ell(u, v, 0, 0.5, 0.78, 0.5), ell(u, v, 0.8, 0.8, 0.25, 0.22) * 0.9, ell(u, v, 0.85, 0.2, 0.2, 0.18) * 0.9),
  };

  // appendices aléatoires (propres à chaque boss) : u = 0 centre → 1 bord, v = 0 haut → 1 bas
  const EXTRAS = {
    spike: (R) => { const v0 = 0.2 + R() * 0.55, sl = (R() - 0.3) * 0.9, th = 0.07 + R() * 0.07, u0 = 0.45 + R() * 0.2; return (u, v) => (u < u0 ? -1 : 1 - Math.abs(v - (v0 + (u - u0) * sl)) / (th * Math.max(0.05, 1 - (u - u0) / (1.02 - u0)))); },
    pod: (R) => { const cu = 0.72 + R() * 0.2, cv = 0.25 + R() * 0.5, ru = 0.1 + R() * 0.09, rv = 0.08 + R() * 0.12; return (u, v) => ell(u, v, cu, cv, ru, rv); },
    horn: (R) => { const u0 = 0.15 + R() * 0.35, lean = 0.4 + R() * 0.8, len = 0.25 + R() * 0.15, th = 0.07 + R() * 0.05; return (u, v) => (v > len + 0.15 ? -1 : 1 - Math.abs(u - (u0 + Math.max(0, len - v) * lean)) / (th * (0.5 + v / len))); },
    prong: (R) => { const u0 = 0.08 + R() * 0.4, th = 0.05 + R() * 0.05, v0 = 0.45 + R() * 0.2; return (u, v) => (v > v0 && Math.abs(u - u0) < th * (1.4 - v * 0.6) ? 1 : -1); },
    wing: (R) => { const v0 = 0.3 + R() * 0.3, th = 0.1 + R() * 0.1, sweep = (R() - 0.5) * 0.9; return (u, v) => (u < 0.3 ? -1 : 1 - Math.abs(v - (v0 + (u - 0.3) * sweep)) / (th * Math.max(0.15, 1.15 - u))); },
    crest: (R) => { const n = 2 + Math.floor(R() * 3), hgt = 0.12 + R() * 0.12; return (u, v) => (u < 0.7 && v < 0.3 && v > 0.3 - hgt * Math.abs(Math.cos(u * n * Math.PI)) - 0.02 ? 1 : -1); },
  };
  const EXTRA_KINDS = Object.keys(EXTRAS);
  function lighten(hex, k) {
    const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const f = (c) => Math.round(c + (255 - c) * k).toString(16).padStart(2, "0");
    return "#" + f(r) + f(g) + f(b);
  }

  function makeSprite(def) {
    const f = FACTIONS[def.faction];
    const R = rng(def.seed);
    R.a = R(); R.b = R();
    const w = def.w, h = def.h, hw = Math.ceil(w / 2);
    const shape = SHAPES[f.feat];
    const exs = [];
    const nEx = 1 + Math.floor(R() * 3) + (def.rank >= 5 ? 1 : 0);
    for (let k = 0; k < nEx; k++) exs.push(EXTRAS[EXTRA_KINDS[Math.floor(R() * EXTRA_KINDS.length)]](R));
    let m = [];
    for (let y = 0; y < h; y++) {
      m.push([]);
      for (let x = 0; x < hw; x++) {
        const u = (hw - 1 - x + 0.5) / hw, v = (y + 0.5) / h;
        let d = shape(u, v, R);
        for (const e of exs) d = Math.max(d, e(u, v));
        m[y].push(d + (R() - 0.5) * 0.25 > 0 ? 1 : 0);
      }
    }
    // lissage cellulaire
    for (let it = 0; it < 2; it++) {
      const n = m.map((r) => r.slice());
      for (let y = 0; y < h; y++) for (let x = 0; x < hw; x++) {
        let c = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          const yy = y + dy, xx = x + dx;
          if (xx >= hw) c += m[yy] && m[yy][hw - 1] ? 1 : 0; // miroir
          else if (yy >= 0 && yy < h && xx >= 0 && m[yy][xx]) c++;
        }
        if (m[y][x] && c < 2) n[y][x] = 0; else if (!m[y][x] && c > 4) n[y][x] = 1;
      }
      m = n;
    }
    const full = m.map((r) => r.concat(r.slice(0, w - hw).reverse()));
    const pal = f.pals[def.pal];
    const [dark, mid, light, accent, glow] = pal;
    const hl = lighten(light, 0.45), deep = lighten(dark, -0.0);
    const c = canvas(w + 2, h + 2), x = c.getContext("2d");
    const at = (i, j) => j >= 0 && j < h && i >= 0 && i < w && full[j][i];
    // profondeur (distance au bord)
    const depth = full.map((r) => r.map((v) => (v ? 99 : 0)));
    const dAt = (i, j) => (j >= 0 && j < h && i >= 0 && i < w ? depth[j][i] : 0);
    for (let pass = 1; pass <= 4; pass++) {
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
        if (depth[j][i] !== 99) continue;
        if (dAt(i - 1, j) === pass - 1 || dAt(i + 1, j) === pass - 1 || dAt(i, j - 1) === pass - 1 || dAt(i, j + 1) === pass - 1) depth[j][i] = pass;
      }
    }
    // contour
    x.fillStyle = "#0b0c14";
    for (let j = -1; j <= h; j++) for (let i = -1; i <= w; i++) if (!at(i, j) && (at(i - 1, j) || at(i + 1, j) || at(i, j - 1) || at(i, j + 1))) x.fillRect(i + 1, j + 1, 1, 1);
    const px = (i, j, col) => { x.fillStyle = col; x.fillRect(i + 1, j + 1, 1, 1); };
    const center = (w - 1) / 2;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      if (!at(i, j)) continue;
      const d = depth[j][i], v = j / h;
      let col = mid;
      if (d === 1) {
        if (!at(i, j - 1)) col = v < 0.5 ? hl : light;
        else if (!at(i, j + 1)) col = deep;
        else col = v < 0.45 ? light : dark;
      } else if (d === 2) {
        col = !at(i, j - 2) ? light : (v > 0.6 ? dark : mid);
        if (v > 0.6 && (i + j) % 2) col = mid;
      } else {
        col = mid;
        if (v < 0.3 && (i + j) % 2 === 0) col = light;
        if (v > 0.7 && (i + j) % 2 === 0) col = dark;
      }
      // arête centrale
      if (d >= 2 && Math.abs(i - center) < 0.6 && v < 0.85) col = v < 0.5 ? light : dark;
      px(i, j, col);
    }
    // panneaux symétriques
    const nP = 1 + Math.floor(R() * 3);
    for (let k = 0; k < nP * 4 && k < 20; k++) {
      const pw = 3 + Math.floor(R() * 4), ph = 3 + Math.floor(R() * 4);
      const i0 = Math.floor(R() * (hw - pw)), j0 = Math.floor(R() * (h - ph));
      let ok = true;
      for (let j = j0; j < j0 + ph && ok; j++) for (let i = i0; i < i0 + pw; i++) if (dAt(i, j) < 2) { ok = false; break; }
      if (!ok) continue;
      const fill = accent === "#1a1c2c" ? dark : accent;
      for (let j = j0; j < j0 + ph; j++) for (let i = i0; i < i0 + pw; i++) {
        const edge = j === j0 || j === j0 + ph - 1 || i === i0 || i === i0 + pw - 1;
        const col = edge ? (j === j0 ? light : "#0b0c14") : fill;
        px(i, j, col); px(w - 1 - i, j, col);
      }
      if (pw > 3 && ph > 3) { px(i0 + 1, j0 + 1, glow); px(w - 2 - i0, j0 + 1, glow); }
      if (--k < 0) break;
    }
    // fentes d'aération
    for (let k = 0; k < 2; k++) {
      const j0 = Math.floor(h * (0.45 + R() * 0.35)), i0 = Math.floor(R() * hw * 0.7);
      for (let t = 0; t < 3; t++) if (dAt(i0, j0 + t * 2) >= 2 && dAt(i0 + 2, j0 + t * 2) >= 2) for (let i = i0; i < i0 + 3; i++) { px(i, j0 + t * 2, "#0b0c14"); px(w - 1 - i, j0 + t * 2, "#0b0c14"); }
    }
    // lumières
    for (let k = 0; k < 4 + def.rank / 2; k++) {
      const i = Math.floor(R() * hw), j = Math.floor(R() * h);
      if (dAt(i, j) >= 2) { px(i, j, glow); px(w - 1 - i, j, glow); }
    }
    // éléments propres à la faction
    const cx = Math.floor(w / 2), even = w % 2 === 0;
    const sym = (i, j, col) => { px(cx + i, j, col); px(cx - 1 - i + (even ? 0 : 1) - (even ? 0 : 1) + (even ? 0 : 0), j, col); };
    const symC = (di, j, col) => { px(Math.round(center + di), j, col); px(Math.round(center - di), j, col); };
    void sym;
    if (f.feat === "skull") {
      const big = def.rank >= 5;
      const sk = big ? [".#####.", "#######", "#..#..#", "#######", ".##.##.", ".#.#.#."] : ["#####", "#.#.#", "#####", ".###.", ".#.#."];
      const sy = Math.floor(h * 0.28), sw = sk[0].length;
      sk.forEach((r, j) => { for (let i = 0; i < sw; i++) if (r[i] !== ".") px(Math.round(center - (sw - 1) / 2) + i, sy + j, "#f4f4f4"); else if (j > 0 && j < sk.length - 1) px(Math.round(center - (sw - 1) / 2) + i, sy + j, "#1a1c2c"); });
      for (let k = 0; k < 3; k++) { const yy = Math.floor(h * (0.45 + k * 0.1)); for (const di of [w * 0.32, w * 0.32 + 1]) if (dAt(Math.round(center + di), yy) >= 1) symC(di, yy, di === w * 0.32 ? "#0b0c14" : glow); }
    } else if (f.feat === "mandibles") {
      const my = Math.floor(h * 0.6);
      for (const di of [2, 3, 4]) { symC(di, my, glow); symC(di + 0.5, my + 1, "#0b0c14"); }
      for (let t = 0; t < 5; t++) symC(3 + (t >> 1), Math.min(h - 1, my + 3 + t), t % 2 ? light : "#0b0c14");
    } else if (f.feat === "core") {
      const cy = Math.floor(h * 0.38);
      for (let j = -2; j <= 2; j++) for (let di = -2; di <= 2; di++) { const dd = Math.abs(di) + Math.abs(j); if (dd <= 2) px(Math.round(center + di), cy + j, dd === 0 ? "#ffffff" : dd === 1 ? glow : accent === "#1a1c2c" ? "#0b0c14" : accent); }
    } else if (f.feat === "visor") {
      const vy = Math.floor(h * 0.35);
      for (let di = 0; di < w * 0.3; di++) { symC(di, vy, "#0b0c14"); symC(di, vy + 1, "#29366f"); symC(di, vy + 2, "#0b0c14"); }
    } else if (f.feat === "facets") {
      for (let k = 0; k < 5; k++) { const i0 = Math.floor(R() * hw), j0 = Math.floor(R() * h * 0.7); for (let t = 0; t < 5; t++) if (dAt(i0 + t, j0 + t) >= 2) { px(i0 + t, j0 + t, "#ffffff"); px(w - 1 - i0 - t, j0 + t, "#ffffff"); } }
    } else if (f.feat === "hazard") {
      const hy = Math.floor(h * (0.2 + R.b * 0.2));
      for (let i = 0; i < w; i++) for (let t = 0; t < 2; t++) if (dAt(i, hy + t) >= 1) px(i, hy + t, ((i + t) >> 1) % 2 ? "#ffcd75" : "#1a1c2c");
      for (let k = 0; k < 8; k++) { const i = Math.floor(R() * w), j = Math.floor(R() * h); if (dAt(i, j) >= 2) px(i, j, "#94b0c2"); }
    } else if (f.feat === "ghost") {
      const ey = Math.floor(h * 0.3);
      for (let j = 0; j < 4; j++) for (const di of [3, 4, 5]) symC(di + w * 0.06, ey + j, "#0b0c14");
      for (let di = -3; di <= 3; di++) px(Math.round(center + di), ey + 7 + Math.abs(di) % 2, "#0b0c14");
    } else if (f.feat === "sun") {
      for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; for (let r = w * 0.18; r < w * 0.3; r++) { const i = Math.round(center + Math.cos(a) * r), j = Math.round(h / 2 + Math.sin(a) * r * 0.8); if (dAt(i, j) >= 1) px(i, j, glow); } }
    }
    c.flash = silhouette(c, "#ffffff");
    c.dark = silhouette(c, "#0b0c14");
    return c;
  }

  // ------------------------------------------------------------------ les 100
  const LIST = [];
  FACTIONS.forEach((f, fi) => {
    f.names.forEach((n, rank) => {
      const id = fi * 10 + rank;
      const R = rng(9001 + id * 131);
      const w = 40 + rank * 3 + Math.floor(R() * 5) + (rank === 9 ? 6 : 0);
      const h = Math.floor(w * (0.7 + R() * 0.2));
      const pool = f.pool.slice();
      const sig = pool.shift();
      for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
      const attacks = [sig].concat(pool.slice(0, 2 + (rank >= 5 ? 1 : 0)));
      const extra = pool[3] || pool[2];
      LIST.push({
        id, faction: fi, rank, name: n.toUpperCase(), seed: 7 + id * 977,
        w, h, pal: (rank + fi) % 3, attacks, extra,
        title: ((RANK_FOR[fi] || RANKS)[rank]) + " · " + f.name,
        sprite: null,
      });
    });
  });
  function sprite(def) { if (!def.sprite) def.sprite = makeSprite(def); return def.sprite; }

  // ------------------------------------------------------------------ attaques
  // Chaque attaque reçoit le boss (b) et l'interface du jeu (G), renvoie sa durée (s).
  const TAU = Math.PI * 2;
  function angTo(b, G) { return Math.atan2(G.player.y - b.y, G.player.x - b.x); }
  const ATK = {
    aimed(b, G) {
      const n = 3 + b.tier;
      for (let k = 0; k < n; k++) b.after(k * 0.14 / b.speed, () => {
        const a = angTo(b, G), s = 95 * b.bspd;
        G.eb(b.x, b.y + b.h * 0.3, Math.cos(a) * s, Math.sin(a) * s, { kind: "needle", col: b.glow });
        G.sfx("eshot");
      });
      return n * 0.14 / b.speed + 0.4;
    },
    fan(b, G) {
      const waves = 2 + (b.tier > 1 ? 1 : 0);
      for (let w = 0; w < waves; w++) b.after(w * 0.45 / b.speed, () => {
        const n = 7 + b.tier * 2, a0 = angTo(b, G), spr = 1.1;
        for (let k = 0; k < n; k++) {
          const a = a0 - spr / 2 + spr * k / (n - 1) + (w % 2 ? spr / (n - 1) / 2 : 0), s = 70 * b.bspd;
          G.eb(b.x, b.y + b.h * 0.25, Math.cos(a) * s, Math.sin(a) * s, { col: b.glow });
        }
        G.sfx("eshot");
      });
      return waves * 0.45 / b.speed + 0.4;
    },
    ring(b, G) {
      const waves = 2 + b.tier;
      for (let w = 0; w < waves; w++) b.after(w * 0.5 / b.speed, () => {
        const n = 14 + b.tier * 3, off = w * 0.17;
        for (let k = 0; k < n; k++) { const a = off + TAU * k / n, s = 55 * b.bspd; G.eb(b.x, b.y, Math.cos(a) * s, Math.sin(a) * s, { col: w % 2 ? b.glow : b.light }); }
        G.sfx("eshot2");
      });
      return waves * 0.5 / b.speed + 0.5;
    },
    spiral(b, G) {
      const dur = 2.4, arms = 2 + (b.tier > 1 ? 1 : 0), step = 0.08 / b.speed;
      let t = 0, a = Math.random() * TAU;
      const dir = Math.random() < 0.5 ? 1 : -1;
      for (t = 0; t < dur; t += step) b.after(t, () => {
        a += 0.32 * dir;
        for (let k = 0; k < arms; k++) { const aa = a + TAU * k / arms, s = 60 * b.bspd; G.eb(b.x, b.y, Math.cos(aa) * s, Math.sin(aa) * s, { col: b.glow }); }
      });
      b.after(0, () => G.sfx("eshot2"));
      return dur + 0.4;
    },
    rain(b, G) {
      const dur = 2.2, n = Math.floor((14 + b.tier * 6) * b.speed);
      for (let k = 0; k < n; k++) b.after(dur * k / n, () => {
        G.eb(8 + Math.random() * (G.W - 16), -4, (Math.random() - 0.5) * 12, (60 + Math.random() * 40) * b.bspd, { kind: "big", col: b.glow });
      });
      b.after(0, () => G.sfx("eshot2"));
      return dur * 0.8;
    },
    beam(b, G) {
      const n = 1 + (b.tier > 0 ? 1 : 0) + (b.tier > 2 ? 1 : 0);
      for (let k = 0; k < n; k++) {
        const off = n === 1 ? 0 : (k - (n - 1) / 2) * 34;
        b.after(k * 0.15, () => G.beam({ x: Math.max(8, Math.min(G.W - 8, G.player.x + off)), y0: b.y + b.h * 0.3, warn: 0.85 / Math.sqrt(b.speed), dur: 0.7, w: 9 + b.tier * 2, col: b.glow }));
      }
      return 1.9;
    },
    missiles(b, G) {
      const n = 2 + b.tier;
      for (let k = 0; k < n; k++) b.after(k * 0.25, () => {
        const side = k % 2 ? 1 : -1;
        G.eb(b.x + side * b.w * 0.35, b.y, side * 60, -20, { kind: "missile", col: "#ef7d57", hp: 6, homing: 2.2 + b.tier * 0.4, spd: 70 * b.bspd, life: 5 });
        G.sfx("missile");
      });
      return n * 0.25 + 0.9;
    },
    mines(b, G) {
      const n = 3 + b.tier;
      for (let k = 0; k < n; k++) b.after(k * 0.2, () => {
        const tx = 15 + Math.random() * (G.W - 30);
        G.eb(b.x, b.y, (tx - b.x) * 0.9, 40 + Math.random() * 30, {
          kind: "mine", col: "#ff5a6e", hp: 5, life: 1.6 + Math.random() * 0.6, drag: 1.5,
          onEnd: (m) => { const c = 10 + b.tier * 2; for (let i = 0; i < c; i++) { const a = TAU * i / c; G.eb(m.x, m.y, Math.cos(a) * 55 * b.bspd, Math.sin(a) * 55 * b.bspd, { col: "#ffcd75" }); } G.sfx("pop"); },
        });
      });
      return n * 0.2 + 1.6;
    },
    minions(b, G) {
      const n = 3 + Math.min(3, b.tier);
      for (let k = 0; k < n; k++) b.after(k * 0.2, () => G.minion(b.minion, b.x + (k - (n - 1) / 2) * 14, b.y + b.h * 0.3));
      return n * 0.2 + 0.8;
    },
    charge(b, G) {
      const sx = b.x, sy = b.y, tx = G.player.x, ty = Math.min(G.H * 0.75, G.player.y - 10);
      b.busyMove = true;
      b.after(0, () => { b.shakeT = 0.5; G.sfx("charge"); });
      b.tween(0.5, sx, sy, sx, sy - 10);
      b.after(0.5, () => b.tween(0.45 / b.speed, b.x, b.y, tx, ty));
      b.after(0.5 + 0.45 / b.speed, () => {
        G.shake(4); G.sfx("boom");
        const c = 10 + b.tier * 2; for (let i = 0; i < c; i++) { const a = TAU * i / c; G.eb(b.x, b.y, Math.cos(a) * 50 * b.bspd, Math.sin(a) * 50 * b.bspd, { col: b.glow }); }
        b.tween(0.9, b.x, b.y, sx, sy);
      });
      b.after(1.85 + 0.45 / b.speed, () => { b.busyMove = false; });
      return 2.1 + 0.45 / b.speed;
    },
    wave(b, G) {
      const dur = 2, step = 0.12 / b.speed;
      for (let t = 0; t < dur; t += step) b.after(t, () => {
        for (const side of [-1, 1]) {
          const ox = b.x + side * b.w * 0.3, ph = Math.random() * TAU;
          G.eb(ox, b.y + 6, 0, 70 * b.bspd, { col: b.glow, upd: (e, dt) => { e.t2 = (e.t2 || 0) + dt; e.x = e.ox + Math.sin(e.t2 * 5 + ph) * 22; }, ox });
        }
      });
      b.after(0, () => G.sfx("eshot2"));
      return dur + 0.3;
    },
    broadside(b, G) {
      const vol = 3 + b.tier;
      for (let k = 0; k < vol; k++) b.after(k * 0.3 / b.speed, () => {
        for (const side of [-1, 1]) for (let i = 0; i < 3; i++) {
          const a = Math.PI / 2 - side * (0.5 + i * 0.35), s = 75 * b.bspd;
          G.eb(b.x + side * b.w * 0.45, b.y + (i - 1) * 4, Math.cos(a) * s * side * side, Math.sin(a) * s, { kind: "big", col: "#1a1c2c", rim: "#94b0c2" });
        }
        G.sfx("cannon"); G.shake(1);
      });
      return vol * 0.3 / b.speed + 0.5;
    },
    shards(b, G) {
      const n = 2 + b.tier;
      for (let k = 0; k < n; k++) b.after(k * 0.35 / b.speed, () => {
        const a = angTo(b, G) + (Math.random() - 0.5) * 0.8, s = 70 * b.bspd;
        G.eb(b.x, b.y + b.h * 0.2, Math.cos(a) * s, Math.sin(a) * s, {
          kind: "big", col: b.glow, life: 0.8,
          onEnd: (m) => { const c = 6 + b.tier; for (let i = 0; i < c; i++) { const aa = TAU * i / c + 0.3; G.eb(m.x, m.y, Math.cos(aa) * 60 * b.bspd, Math.sin(aa) * 60 * b.bspd, { kind: "needle", col: b.light }); } G.sfx("pop"); },
        });
        G.sfx("eshot");
      });
      return n * 0.35 / b.speed + 1;
    },
    gravity(b, G) {
      const dur = 2.2;
      b.after(0, () => { G.pull(b, dur, 55 + b.tier * 10); G.sfx("gravity"); });
      for (let t = 0; t < dur; t += 0.5 / b.speed) b.after(t, () => {
        const c = 10 + b.tier * 2, off = t; for (let i = 0; i < c; i++) { const a = off + TAU * i / c; G.eb(b.x + Math.cos(a) * 60, b.y + Math.sin(a) * 60, -Math.cos(a) * 25, -Math.sin(a) * 25 + 30, { col: b.glow, life: 3 }); }
      });
      return dur + 0.4;
    },
    teleport(b, G) {
      b.after(0, () => { b.fade = -1; G.sfx("blink"); });
      b.after(0.35, () => {
        b.x = 25 + Math.random() * (G.W - 50); b.y = 40 + Math.random() * G.H * 0.22; b.homeX = b.x; b.homeY = b.y; b.fade = 1;
        const c = 12 + b.tier * 3; for (let i = 0; i < c; i++) { const a = TAU * i / c; G.eb(b.x, b.y, Math.cos(a) * 60 * b.bspd, Math.sin(a) * 60 * b.bspd, { col: b.glow }); }
      });
      return 1;
    },
    cross(b, G) {
      const dur = 2, step = 0.1 / b.speed;
      let a = Math.random() * TAU;
      for (let t = 0; t < dur; t += step) b.after(t, () => {
        a += 0.09;
        for (let k = 0; k < 4; k++) { const aa = a + k * Math.PI / 2, s = 75 * b.bspd; G.eb(b.x, b.y, Math.cos(aa) * s, Math.sin(aa) * s, { kind: "needle", col: b.glow }); }
      });
      b.after(0, () => G.sfx("eshot2"));
      return dur + 0.3;
    },
  };

  function circle(ctx, x, y, r, col) {
    ctx.fillStyle = col;
    for (let j = -r; j <= r; j++) { const w = Math.round(Math.sqrt(r * r - j * j + r * 0.6)); ctx.fillRect(x - w, y + j, w * 2 + 1, 1); }
  }
  // ------------------------------------------------------------------ le boss en jeu
  function create(def, tier, G) {
    const f = FACTIONS[def.faction];
    const spr = sprite(def);
    const pal = f.pals[def.pal];
    // PV : grandit avec le rang et le nombre de boss déjà battus dans la partie
    const hp = Math.round((850 + def.rank * 110) * (1 + tier * 0.45));
    const b = {
      def, f, spr, tier: Math.min(4, Math.floor(tier / 2) + (def.rank >= 6 ? 1 : 0)),
      x: G.W / 2, y: -def.h, homeX: G.W / 2, homeY: Math.max(56, G.H * 0.2),
      w: def.w, h: def.h, hp, maxHp: hp, glow: pal[4], light: pal[2],
      speed: 1 + Math.min(0.6, tier * 0.08), bspd: 1 + Math.min(0.5, tier * 0.06),
      minion: f.minion, phase: 1, entering: 2.2, t: 0, cd: 1, flash: 0, flashCd: 0, fade: 1, shakeT: 0,
      timers: [], tw: null, busyMove: false, queue: [], attacks: def.attacks.slice(), dead: false,
    };
    b.after = (d, fn) => b.timers.push({ t: d, fn });
    b.tween = (d, x0, y0, x1, y1) => { b.tw = { t: 0, d, x0, y0, x1, y1 }; };
    b.nextAttack = () => {
      if (!b.queue.length) {
        b.queue = b.attacks.slice();
        for (let i = b.queue.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b.queue[i], b.queue[j]] = [b.queue[j], b.queue[i]]; }
      }
      return b.queue.shift();
    };
    b.update = (dt) => {
      b.t += dt;
      if (b.flash > 0) b.flash -= dt;
      if (b.flashCd > 0) b.flashCd -= dt;
      if (b.shakeT > 0) b.shakeT -= dt;
      if (b.fade < 0) b.fade = Math.max(-1, b.fade - dt); // disparition (téléport)
      if (b.entering > 0) {
        b.entering -= dt;
        const k = 1 - Math.max(0, b.entering) / 2.2;
        b.y = -def.h + (b.homeY + def.h) * (1 - (1 - k) * (1 - k));
        return;
      }
      // minuteries d'attaque
      for (const tm of b.timers) tm.t -= dt;
      const due = b.timers.filter((tm) => tm.t <= 0);
      b.timers = b.timers.filter((tm) => tm.t > 0);
      for (const tm of due) if (!b.dead) tm.fn();
      // déplacement
      if (b.tw) {
        b.tw.t += dt; const k = Math.min(1, b.tw.t / b.tw.d), e = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
        b.x = b.tw.x0 + (b.tw.x1 - b.tw.x0) * e; b.y = b.tw.y0 + (b.tw.y1 - b.tw.y0) * e;
        if (k >= 1) b.tw = null;
      } else if (!b.busyMove && b.fade > 0) {
        const m = f.move, t = b.t * b.speed, A = (G.W - def.w) / 2 - 6;
        let tx = b.homeX, ty = b.homeY;
        if (m === "sway") { tx = G.W / 2 + Math.sin(t * 0.7) * A; ty = b.homeY + Math.sin(t * 1.3) * 6; }
        else if (m === "figure8") { tx = G.W / 2 + Math.sin(t * 0.6) * A; ty = b.homeY + Math.sin(t * 1.2) * 16; }
        else if (m === "heavy") { tx = G.W / 2 + Math.sin(t * 0.35) * A * 0.6; ty = b.homeY + Math.sin(t * 0.9) * 4; }
        else if (m === "drift") {
          if (!b.wp || Math.hypot(b.x - b.wp[0], b.y - b.wp[1]) < 3) b.wp = [def.w / 2 + 6 + Math.random() * (G.W - def.w - 12), b.homeY - 10 + Math.random() * 30];
          tx = b.wp[0]; ty = b.wp[1];
        } else if (m === "teleport") { tx = b.homeX + Math.sin(t * 1.1) * 14; ty = b.homeY + Math.sin(t * 1.7) * 8; }
        const k = Math.min(1, dt * (m === "drift" ? 1.6 : 3));
        b.x += (tx - b.x) * k; b.y += (ty - b.y) * k;
      }
      // phases
      const r = b.hp / b.maxHp;
      if (b.phase === 1 && r < 0.5) {
        b.phase = 2; b.speed *= 1.2; b.bspd *= 1.08; if (def.extra && !b.attacks.includes(def.extra)) b.attacks.push(def.extra);
        G.bossPhase(b);
      } else if (b.phase === 2 && def.rank === 9 && r < 0.22) { b.phase = 3; b.speed *= 1.15; G.bossPhase(b); }
      // attaques
      b.cd -= dt;
      if (b.cd <= 0 && !b.busyMove) {
        const name = b.nextAttack();
        const d = ATK[name](b, G);
        b.cd = d + (0.9 - b.tier * 0.1) / b.speed;
      }
    };
    b.draw = (ctx, G) => {
      let ox = Math.round(b.x - spr.width / 2), oy = Math.round(b.y - spr.height / 2);
      if (b.shakeT > 0) ox += Math.round((Math.random() - 0.5) * 3);
      const feat = f.feat;
      let alpha = 1;
      if (b.fade < 0) alpha = Math.max(0, 1 + b.fade / 0.35);
      if (feat === "ghost") alpha *= 0.75 + Math.sin(b.t * 5) * 0.15;
      ctx.globalAlpha = alpha;
      // tentacules (dessinées derrière)
      if (feat === "tentacles") {
        const n = 4 + (def.rank >> 2);
        for (let k = 0; k < n; k++) {
          const bx = ox + 4 + (spr.width - 8) * (k / (n - 1)), by = oy + spr.height * 0.75;
          for (let s = 0; s < 10 + def.rank; s++) {
            const sx = bx + Math.sin(b.t * 3 + k * 1.7 + s * 0.45) * s * 0.35, sy = by + s * 1.6;
            const r = Math.max(1, 3 - s * 0.2);
            ctx.fillStyle = "#0b0c14"; ctx.fillRect(Math.round(sx - r / 2) - 1, Math.round(sy) - 1, Math.ceil(r) + 2, 3);
            ctx.fillStyle = s % 3 === 0 ? b.light : pal[1]; ctx.fillRect(Math.round(sx - r / 2), Math.round(sy), Math.ceil(r), 2);
          }
        }
      }
      // moteurs (haut) des factions mécaniques
      if (feat === "visor" || feat === "skull" || feat === "core" || feat === "hazard") {
        for (const s of [-1, 1]) {
          const fx = Math.round(b.x + s * def.w * 0.22), fy = oy;
          const len = 2 + ((b.t * 20) | 0) % 3;
          ctx.fillStyle = "#ffcd75"; ctx.fillRect(fx - 1, fy - len, 2, len);
          ctx.fillStyle = "#f4f4f4"; ctx.fillRect(fx - 1, fy - 1, 2, 1);
        }
      }
      ctx.drawImage(b.flash > 0 ? spr.flash : spr, ox, oy);
      // éléments animés
      const cx = Math.round(b.x), cy = oy + 1;
      if (feat === "eye" || feat === "tentacles") {
        const er = feat === "eye" ? Math.max(5, Math.floor(def.w * 0.15)) : 3;
        const eyes = feat === "eye" ? [[0, def.h * 0.48]] : [[-def.w * 0.18, def.h * 0.42], [def.w * 0.18, def.h * 0.42]];
        const blink = (b.t % 4) > 3.85;
        for (const [ex, ey] of eyes) {
          const X = Math.round(cx + ex), Y = Math.round(cy + ey);
          circle(ctx, X, Y, er + 1, "#0b0c14");
          if (blink) { ctx.fillStyle = pal[1]; ctx.fillRect(X - er, Y - 1, er * 2 + 1, 2); continue; }
          circle(ctx, X, Y, er, "#f4f4f4");
          circle(ctx, X, Y + 1, er, "#f4f4f4");
          ctx.fillStyle = "#c8c8d4"; ctx.fillRect(X - er + 2, Y + er - 1, er * 2 - 3, 1);
          const a = Math.atan2(G.player.y - Y, G.player.x - X), pr = Math.max(1, Math.round(er * 0.55));
          const PX = Math.round(X + Math.cos(a) * (er - pr)), PY = Math.round(Y + Math.sin(a) * (er - pr));
          circle(ctx, PX, PY, pr, pal[3] === "#1a1c2c" ? b.glow : pal[3]);
          circle(ctx, PX, PY, Math.max(0, pr - 2), "#0b0c14");
          ctx.fillStyle = "#ffffff"; ctx.fillRect(PX - Math.ceil(pr / 2), PY - Math.ceil(pr / 2), 1, 1);
        }
      } else if (feat === "sun") {
        const r = Math.floor(def.w * 0.14) + Math.round(Math.sin(b.t * 6));
        const Y = Math.round(oy + spr.height / 2);
        ctx.fillStyle = "#ffcd75"; ctx.fillRect(cx - r, Y - r + 1, r * 2, r * 2 - 2); ctx.fillRect(cx - r + 1, Y - r, r * 2 - 2, r * 2);
        ctx.fillStyle = "#ffffff"; ctx.fillRect(cx - r + 2, Y - r + 2, r * 2 - 4, r * 2 - 4);
      } else if (feat === "visor") {
        const vy = oy + 1 + Math.floor(def.h * 0.35) + 1;
        const vx = Math.round(cx + Math.sin(b.t * 3) * def.w * 0.22);
        ctx.fillStyle = "#ff5a6e"; ctx.fillRect(vx - 1, vy, 3, 1);
      } else if (feat === "core") {
        if ((b.t * 4 | 0) % 2) { ctx.fillStyle = "#ffffff"; ctx.fillRect(cx - 1, oy + 1 + Math.floor(def.h * 0.38), 1, 1); }
      } else if (feat === "ghost") {
        ctx.fillStyle = b.glow; const ey = oy + 1 + Math.floor(def.h * 0.3) + 1;
        ctx.fillRect(cx + 3, ey, 1, 1); ctx.fillRect(cx - 5, ey, 1, 1);
      }
      ctx.globalAlpha = 1;
    };
    return b;
  }

  window.Bosses = { FACTIONS, LIST, sprite, create, ATK };
})();
