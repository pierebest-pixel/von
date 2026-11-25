/* Watchers — règles : créatures, statistiques, expérience, dégâts, capture. */
"use strict";
const MAX_LEVEL = 100;
const SHINY_CHANCE = 1 / 20;
const STAT_KEYS = ["hp", "atk", "def", "spa", "sdf", "spd"];
const STAT_NAMES = { hp: "PV", atk: "Attaque", def: "Défense", spa: "Att. Spé", sdf: "Déf. Spé", spd: "Vitesse" };

let _uid = Date.now() % 100000;
function xpForLevel(l) { return Math.round(Math.pow(l, 3) * .8); }

function calcStats(mon) {
  const sp = SPECIES[mon.species], L = mon.level, s = {};
  STAT_KEYS.forEach((k, i) => {
    const b = sp.base[i] + (mon.iv?.[i] || 0);
    s[k] = k === "hp" ? Math.floor((2 * b * L) / 100) + L + 10 : Math.floor((2 * b * L) / 100) + 5;
  });
  return s;
}

function createMon(species, level, opts = {}) {
  const sp = SPECIES[species];
  const mon = {
    uid: ++_uid, species, level, xp: xpForLevel(level),
    shiny: opts.shiny ?? (Math.random() < SHINY_CHANCE),
    iv: STAT_KEYS.map(() => Math.floor(Math.random() * 16)),
    status: null, moves: [], caughtIn: opts.caughtIn || "",
  };
  // Les 4 dernières attaques apprises à ce niveau
  const known = learnset(sp).filter(([l]) => l <= level).map(([, n]) => n);
  [...new Set(known)].slice(-4).forEach((n) => mon.moves.push({ name: n, pp: MOVES[n].pp }));
  mon.stats = calcStats(mon); mon.hp = mon.stats.hp;
  return mon;
}

function refreshStats(mon) {
  const old = mon.stats?.hp || 0; mon.stats = calcStats(mon);
  mon.hp = Math.min(mon.stats.hp, mon.hp + Math.max(0, mon.stats.hp - old));
}

function healMon(mon) { mon.hp = mon.stats.hp; mon.status = null; mon.moves.forEach((m) => (m.pp = MOVES[m.name].pp)); }

// Ajoute de l'XP ; renvoie la liste des événements (montées de niveau, attaques, évolution)
function gainXp(mon, amount) {
  const ev = [];
  if (mon.level >= MAX_LEVEL) return ev;
  mon.xp += amount;
  while (mon.level < MAX_LEVEL && mon.xp >= xpForLevel(mon.level + 1)) {
    mon.level++; refreshStats(mon); ev.push({ type: "level", level: mon.level });
    const sp = SPECIES[mon.species];
    for (const [l, n] of learnset(sp)) if (l === mon.level && !mon.moves.some((m) => m.name === n)) ev.push({ type: "learn", move: n });
    if (sp.evolveTo && mon.level >= sp.evolveAt && !ev.some((e) => e.type === "evolve")) ev.push({ type: "evolve", into: sp.evolveTo });
  }
  if (mon.level >= MAX_LEVEL) mon.xp = xpForLevel(MAX_LEVEL);
  return ev;
}

function evolve(mon, into) {
  mon.species = into; refreshStats(mon);
  const sp = SPECIES[into];
  for (const [l, n] of learnset(sp)) if (l <= mon.level && l > 1 && !mon.moves.some((m) => m.name === n) && mon.moves.length < 4) mon.moves.push({ name: n, pp: MOVES[n].pp });
}

function xpYield(foe, trainer) { return Math.max(1, Math.floor((SPECIES[foe.species].xp * foe.level) / 6 * (trainer ? 1.5 : 1))); }

// ------------------------------------------------------------------ Combat
const STAGE_MULT = (s) => (s >= 0 ? (2 + s) / 2 : 2 / (2 - s));
function moveType(move, mon) { return move.type || SPECIES[mon.species].types[0]; }

function effStat(b, key) {
  let v = b.mon.stats[key] * STAGE_MULT(b.stages[key] || 0);
  if (key === "spd" && b.mon.status === "par") v *= .5;
  if (key === "atk" && b.mon.status === "brn") v *= .5;
  return v;
}

function computeDamage(att, def, move) {
  const type = moveType(move, att.mon);
  const phys = move.cat === "p";
  const A = effStat(att, phys ? "atk" : "spa"), D = effStat(def, phys ? "def" : "sdf");
  const eff = effectiveness(type, SPECIES[def.mon.species].types);
  const stab = SPECIES[att.mon.species].types.includes(type) ? 1.5 : 1;
  const crit = Math.random() < 1 / 16 ? 1.5 : 1;
  const rand = .85 + Math.random() * .15;
  const base = Math.floor(Math.floor((2 * att.mon.level) / 5 + 2) * move.power * A / D / 50) + 2;
  return { dmg: Math.max(1, Math.floor(base * stab * eff * crit * rand)), eff, crit: crit > 1 };
}

// Chance de capture (0..1)
function catchChance(mon, lanternBonus) {
  if (lanternBonus >= 999) return 1;
  const sp = SPECIES[mon.species];
  const hpF = (3 * mon.stats.hp - 2 * mon.hp) / (3 * mon.stats.hp);
  const st = mon.status === "slp" || mon.status === "frz" ? 2 : mon.status ? 1.5 : 1;
  const a = Math.min(255, sp.catchRate * lanternBonus * hpF * st);
  return Math.min(1, a / 255 + (sp.legend ? .01 : .03));
}

// IA : choisit l'attaque qui fait le plus de dégâts attendus (avec un peu de hasard)
function chooseAiMove(att, def, smart = 1) {
  const usable = att.mon.moves.filter((m) => m.pp > 0);
  if (!usable.length) return { name: "Charge", pp: 1 };
  let best = usable[0], bestScore = -1;
  for (const m of usable) {
    const mv = MOVES[m.name];
    let score;
    if (mv.cat === "x") {
      score = mv.heal ? (att.mon.hp < att.mon.stats.hp * .4 ? 120 : 5) : mv.st ? (def.mon.status ? 0 : 45) : 30;
    } else {
      score = mv.power * effectiveness(moveType(mv, att.mon), SPECIES[def.mon.species].types) * (SPECIES[att.mon.species].types.includes(moveType(mv, att.mon)) ? 1.5 : 1) * (mv.acc / 100);
    }
    score *= .75 + Math.random() * .5 * (2 - smart);
    if (score > bestScore) { bestScore = score; best = m; }
  }
  return best;
}
