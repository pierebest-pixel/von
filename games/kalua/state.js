/* Les Échoués de Kalua — progression du joueur (vie, sac, magie, quêtes, grottes, histoire).
 * Sauvegardée dans le téléphone (localStorage) et en ligne dans l'île (islands/{id}/progress/{uid}).
 * Chaque joueur a sa propre progression ; le monde (PNJ, animaux, heure) est commun aux deux. */
"use strict";

const Prog = (() => {
  const DEF = () => ({
    v: 1,
    hp: 5, maxHp: 5, fils: 0,             // vie (en cœurs) ; fils = Fils de vie tissés (+1 cœur chacun)
    inv: {},                              // objets : { id: quantité }
    spells: [], spell: null,              // chants appris ; chant sélectionné
    flags: {},                            // drapeaux d'histoire
    quests: {},                           // { id: { st: étape, d: {données} , done: bool } }
    bosses: {},                           // boss vaincus { B1: true, c1: true … }
    caves: {},                            // { n: { room, seen:{}, open:{}, keys, chests:{} } }
    dead: {},                             // PNJ morts { bastien: true }
    hunted: {},                           // animaux chassés { id: heure de retour }
    adopted: {},                          // animaux adoptés { id: nom }
    lore: {},                             // fragments de lore trouvés
    talked: {},                           // PNJ déjà rencontrés
    journal: [],                          // dernières entrées du journal
    pos: null,                            // dernière position sur l'île
    t: 0,                                 // temps de jeu (s)
    saved: 0,
  });
  let P = DEF(), key = "", session = null, saveTimer = 0, listeners = [];

  function load(islandId, uid, sess) {
    session = sess || null;
    key = `kalua:prog:${islandId}:${uid}`;
    try { P = Object.assign(DEF(), JSON.parse(localStorage.getItem(key) || "null") || {}); } catch { P = DEF(); }
    return P;
  }
  // la version en ligne gagne si elle est plus récente (changement de téléphone)
  function merge(remote) {
    if (remote && typeof remote === "object" && (remote.saved || 0) > (P.saved || 0)) { P = Object.assign(DEF(), remote); emit(); }
  }
  function save(now) {
    clearTimeout(saveTimer);
    const run = () => {
      P.saved = Date.now();
      try { localStorage.setItem(key, JSON.stringify(P)); } catch { /* ignore */ }
      if (session && session.saveProgress) session.saveProgress(JSON.parse(JSON.stringify(P)));
    };
    if (now) run(); else saveTimer = setTimeout(run, 800);
  }
  const emit = () => listeners.forEach((f) => { try { f(P); } catch (e) { console.warn(e); } });
  const onChange = (f) => { listeners.push(f); return () => { listeners = listeners.filter((x) => x !== f); }; };
  const changed = () => { emit(); save(); };

  // ---------------------------------------------------------------- objets
  const count = (id) => P.inv[id] || 0;
  const has = (id, n = 1) => count(id) >= n;
  function give(id, n = 1, quiet) {
    P.inv[id] = count(id) + n;
    if (!quiet && typeof Game !== "undefined") Game.pickup(id, n);
    changed();
  }
  function take(id, n = 1) { if (!has(id, n)) return false; P.inv[id] -= n; if (P.inv[id] <= 0) delete P.inv[id]; changed(); return true; }
  const hasAll = (cost) => Object.entries(cost).every(([k, v]) => has(k, v));
  function pay(cost) { if (!hasAll(cost)) return false; for (const [k, v] of Object.entries(cost)) take(k, v); return true; }

  // ---------------------------------------------------------------- vie
  function heal(n) { P.hp = Math.min(P.maxHp, P.hp + n); changed(); }
  // ---------------------------------------------------------------- niveau de difficulté (choisi à la création de l'île, le même pour les deux joueurs)
  //  facile : on encaisse moitié moins, les ennemis ont 25 % de vie en moins
  //  normal : le jeu tel qu'il a été réglé
  //  challenge : on encaisse 50 % de plus, les ennemis ont 30 % de vie en plus
  const DIFF = { facile: { name: "Facile", dmg: .5, hp: .75 }, normal: { name: "Normal", dmg: 1, hp: 1 }, challenge: { name: "Challenge", dmg: 1.5, hp: 1.3 } };
  let diff = "normal";
  const setDiff = (d) => { diff = DIFF[d] ? d : "normal"; };
  const diffInfo = () => DIFF[diff];
  // vie d'un ennemi selon le niveau (jamais moins de 1)
  const foeHp = (hp) => (diff === "normal" || hp <= 1 ? hp : Math.max(1, Math.round(hp * DIFF[diff].hp)));
  function hurt(n) {
    // les dégâts sont mis de côté au dixième près : en Facile, deux coups d'un cœur retirent un cœur ; en Challenge, un coup sur deux en retire deux
    let d = n;
    if (diff !== "normal" && n > 0) { P.dmgAcc = (P.dmgAcc || 0) + n * DIFF[diff].dmg; d = Math.floor(P.dmgAcc + 1e-6); P.dmgAcc -= d; if (diff === "challenge") d = Math.max(d, n); }
    P.hp = Math.max(0, P.hp - d); changed(); return P.hp <= 0;
  }
  function addMaxHp(n = 1) { P.maxHp += n; P.hp = P.maxHp; changed(); }

  // ---------------------------------------------------------------- histoire
  const flag = (k) => Boolean(P.flags[k]);
  function set(k, v = true) { P.flags[k] = v; changed(); }
  function learn(spell) { if (!P.spells.includes(spell)) P.spells.push(spell); if (!P.spell) P.spell = spell; changed(); }
  const knows = (spell) => P.spells.includes(spell);
  function quest(id) { return P.quests[id] || null; }
  function setQuest(id, st, d) { const q = P.quests[id] || { st: 0, d: {} }; q.st = st; if (d) Object.assign(q.d, d); P.quests[id] = q; changed(); return q; }
  function finishQuest(id) { const q = P.quests[id] || { st: 0, d: {} }; q.done = true; P.quests[id] = q; changed(); }
  function kill(npc) { P.dead[npc] = true; changed(); }
  const isDead = (npc) => Boolean(P.dead[npc]);
  function note(text) { P.journal.unshift({ t: Date.now(), text }); P.journal = P.journal.slice(0, 40); changed(); }
  function cave(n) { if (!P.caves[n]) P.caves[n] = { room: null, seen: {}, open: {}, keys: 0, chests: {}, done: {}, best: 0 }; return P.caves[n]; }

  return {
    get P() { return P; }, load, merge, save, onChange, changed,
    count, has, give, take, hasAll, pay, heal, hurt, addMaxHp, DIFF, setDiff, diffInfo, foeHp, get diff() { return diff; },
    flag, set, learn, knows, quest, setQuest, finishQuest, kill, isDead, note, cave,
    reset() { P = DEF(); changed(); },
  };
})();
