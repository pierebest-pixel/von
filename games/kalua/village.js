/* Les Échoués de Kalua — le village : bâtiments (village de base + constructions des joueurs), déco d'extérieur,
 * mode construction (pose libre partout), village commun (en ligne : islands/{id}/village ; en solo : dans le téléphone).
 *
 * État partagé (village) :
 *   b     : { bid: { id, x, y, lvl, flip, by, at } }          bâtiments construits (x, y en pixels du monde)
 *   o     : { oid: { id, x, y, flip, by } }                    décorations d'extérieur
 *   rooms : { bid: { r0: { iid: { id, x, y, flip } } } }        déco des pièces des maisons
 *   site  : { bid: { need: {…}, have: { uid: {…} } } }         chantiers d'amélioration (ressources déposées)
 *   clock : décalage d'horloge (secondes) — dormir fait passer la nuit pour tout le monde
 *   bed   : { uid: heure } joueurs couchés (pour dormir à deux)
 *   name  : nom de l'île (mairie)  · fete : fête en cours sur la place */
"use strict";

const Village = (() => {
  const BS = 24;                         // pixels du monde par unité de bâtiment (une porte ≈ la taille d'un personnage)
  const K = KALUA.K, CX = KALUA.VILLAGE.x * K, CY = KALUA.VILLAGE.y * K;
  let S = { b: {}, o: {}, rooms: {}, site: {}, clock: 0, bed: {} }, session = null, unwatch = null, onChange = [];
  // ================================================================ le village de base (déjà construit, ne se démonte pas)
  const BASE = [
    ["place", 0, 90], ["mairie", 0, -380], ["restaurant", -820, -60], ["vetements", 820, -60],
    ["auberge", -880, -560], ["bibliotheque", 880, -560], ["cafe", -560, 470], ["boulangerie", -180, 520],
    ["glacier", 250, 520], ["marche", 640, 480], ["epicerie", 1120, 470], ["poste", -1120, 470],
  ];
  const BASE_DECO = [
    ["lampadaire_0", -330, -60], ["lampadaire_0", 330, -60], ["lampadaire_0", -330, 260], ["lampadaire_0", 330, 260], ["lampadaire_0", -40, -170], ["lampadaire_0", 40, -170],
    ["cerisier", -480, -300], ["cerisier", 480, -300], ["palmier", -1300, -120], ["cocotier", 1300, -120], ["oranger", -1250, 160], ["citronnier", 1250, 160],
    ["massif_0", -420, -150], ["massif_2", 420, -150], ["massif_4", -470, 330], ["massif_5", 470, 330], ["massif_7", -1000, 130], ["massif_1", 1000, 130],
    ["banc_0", -230, 260], ["banc_1", 230, 260], ["guinguette", -820, 120], ["boiteLettres_0", 160, -200], ["panneauDirection", 120, 300],
    ["haieFleurie", -480, -200], ["haieFleurie", 480, -200], ["etalFruits", 420, 640], ["tonneauExt_0", 1060, 120], ["caisses_1", 1110, 130],
    ["pommier", -1500, -420], ["pommier", 1500, -420], ["sapin", -600, -620], ["sapin", 600, -620], ["lavande", -260, -210], ["lavande", 260, -210],
  ];
  const isBase = (bid) => String(bid).startsWith("base");
  const all = () => {
    const out = BASE.map(([id, x, y], i) => ({ bid: "base" + i, id, x: CX + x, y: CY + y, lvl: 1, base: true }));
    for (const [bid, b] of Object.entries(S.b || {})) if (b && BUILD.CATALOG.some((c) => c.id === b.id)) out.push(Object.assign({ bid }, b));
    return out;
  };
  const allDeco = () => {
    const out = BASE_DECO.map(([id, x, y], i) => ({ oid: "based" + i, id, x: CX + x, y: CY + y, base: true }));
    for (const [oid, o] of Object.entries(S.o || {})) if (o && OUTDOOR.get(o.id)) out.push(Object.assign({ oid }, o));
    return out;
  };
  const infoOf = (id) => BUILD.CATALOG.find((c) => c.id === id) || BUILD.VILLAGE.find((c) => c.id === id);
  const sizeOf = (b) => (b.id === "maison" ? BUILD.LEVELS[Math.max(0, (b.lvl || 1) - 1)].size : (infoOf(b.id) || { size: [8, 6] }).size);
  // emprise au sol (rectangle bloquant) : derrière la façade, sur la profondeur du bâtiment
  const NONSOLID_B = ["place", "dalles", "pont", "ponton", "terrain", "piscine", "potager", "enclos", "jeux", "feu", "fleurs"];
  function rectOf(b, pad = 0) { const [w, d] = sizeOf(b); const W = w * BS, D = d * BS * .62; return { x0: b.x - W / 2 - pad, x1: b.x + W / 2 + pad, y0: b.y - D - pad, y1: b.y - BS * .35 + pad }; }
  const OUT_FLAT = ["dallesExt_0", "dallesExt_1", "dallesExt_2", "paves", "gravier", "planches", "pasJaponais", "marelle", "bordureFleurie", "ruisseau", "patinoire"];
  function rectDeco(o, pad = 0) { const it = OUTDOOR.get(o.id); const [w, d] = it ? it.size : [1, 1]; const W = w * BS, D = Math.max(1, d) * BS * .5; return { x0: o.x - W / 2 - pad, x1: o.x + W / 2 + pad, y0: o.y - D - pad, y1: o.y + pad }; }
  const decoSolid = (o) => { const it = OUTDOOR.get(o.id); return it && !OUT_FLAT.includes(o.id) && it.size[0] * it.size[1] >= 4 && it.cat !== "Clôtures et chemins" ? true : it && ["clotureBlanche", "clotureRustique", "clotureBambou", "murPierre", "clotureFer", "haie", "haieFleurie"].includes(o.id); };
  const inR = (r, x, y) => x > r.x0 && x < r.x1 && y > r.y0 && y < r.y1;

  // ================================================================ dessins en cache (un bâtiment est dessiné une seule fois)
  const cache = new Map();
  const CS = Math.min(2, window.devicePixelRatio || 1) * .75 * BS; // pixels de l'image par unité
  function sprite(kind, id, lvl = 1, flip = false) {
    const key = kind + id + "|" + lvl + "|" + (flip ? 1 : 0); let sp = cache.get(key); if (sp) return sp;
    const size = kind === "b" ? (id === "maison" ? BUILD.LEVELS[lvl - 1].size : (infoOf(id) || { size: [8, 6] }).size) : (OUTDOOR.get(id) || { size: [2, 2] }).size;
    const wU = size[0] + (kind === "b" ? 14 : 8), hU = (kind === "b" ? Math.max(size[0] * 1.15, size[1] * 2.6) + 12 : Math.max(size[0], 4) * 2.4 + 8), below = kind === "b" ? 6 : 2;
    const cv = document.createElement("canvas"); cv.width = Math.ceil(wU * CS); cv.height = Math.ceil((hU + below) * CS); const g = cv.getContext("2d");
    g.translate(cv.width / 2, hU * CS); if (flip) g.scale(-1, 1);
    BUILD.rec(true); try { if (kind === "b") BUILD.draw(id, g, CS, 1.2, lvl); else OUTDOOR.draw(id, g, CS, 1.2); } catch (e) { console.warn(e); }
    const anims = BUILD.rec(false);
    sp = { cv, w: cv.width / CS * BS, h: cv.height / CS * BS, ox: wU / 2 * BS, oy: hU * BS, anims }; cache.set(key, sp); return sp;
  }
  function drawSprite(c, sp, x, y, alpha = 1) {
    if (alpha !== 1) c.globalAlpha = alpha; c.drawImage(sp.cv, x - sp.ox, y - sp.oy, sp.w, sp.h);
    // les parties animées par-dessus (fumée des cheminées, drapeaux, ailes du moulin, jets d'eau)
    if (sp.anims && sp.anims.length) { const k = sp.w / sp.cv.width, t = typeof G !== "undefined" ? G.t : performance.now() / 1000; for (const a of sp.anims) { const u = a.k * k; c.save(); c.translate(x - sp.ox + a.px * k, y - sp.oy + a.py * k); c.scale(a.flip ? -u : u, u); BUILD.AN[a.kind](c, a.o, t); c.restore(); } }
    if (alpha !== 1) c.globalAlpha = 1;
  }

  // ================================================================ intégration au monde
  // les arbres et rochers recouverts par un bâtiment disparaissent
  function covers(x, y) { for (const b of all()) { if (NONSOLID_B.includes(b.id) && b.id !== "place") continue; const r = rectOf(b, 30); if (inR(r, x, y + 10)) return true; } return false; }
  function collect(items, view) {
    for (const b of all()) {
      if (b.id === "place") continue; const [w] = sizeOf(b); if (b.x + w * BS < view.x0 - 200 || b.x - w * BS > view.x1 + 200 || b.y < view.y0 - 60 || b.y - w * BS * 1.6 > view.y1 + 200) continue;
      const sp = sprite("b", b.id, b.lvl || 1, b.flip); items.push({ y: b.y - (NONSOLID_B.includes(b.id) ? sizeOf(b)[1] * BS * .5 : 0), draw: (c) => drawSprite(c, sp, b.x, b.y) });
    }
    for (const o of allDeco()) { if (o.x < view.x0 - 400 || o.x > view.x1 + 400 || o.y < view.y0 - 60 || o.y > view.y1 + 500) continue; if (OUT_FLAT.includes(o.id)) continue; const sp = sprite("o", o.id, 1, o.flip); items.push({ y: o.y, draw: (c) => drawSprite(c, sp, o.x, o.y) }); }
    if (G_BUILD.on && G_BUILD.sel) items.push({ y: 1e9, draw: (c) => drawGhost(c) });
  }
  // au sol : la place, les dalles, les chemins (sous les personnages)
  function drawGround(c, view) {
    for (const b of all()) if (b.id === "place" || b.id === "piscine" || b.id === "terrain" || b.id === "dalles") { if (b.x < view.x0 - 1200 || b.x > view.x1 + 1200 || b.y < view.y0 - 600 || b.y > view.y1 + 900) continue; drawSprite(c, sprite("b", b.id, 1, b.flip), b.x, b.y); }
    for (const o of allDeco()) if (OUT_FLAT.includes(o.id)) { if (o.x < view.x0 - 300 || o.x > view.x1 + 300 || o.y < view.y0 - 200 || o.y > view.y1 + 300) continue; drawSprite(c, sprite("o", o.id, 1, o.flip), o.x, o.y); }
    // chemins pavés du village de base
    if (Math.abs(view.x0 - CX) < 4000 && Math.abs(view.y0 - CY) < 3000) {
      c.save(); c.lineCap = "round"; c.lineJoin = "round";
      const pave = (pts, w) => { c.strokeStyle = "#cfc3ad"; c.lineWidth = w + 14; c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(CX + x, CY + y) : c.moveTo(CX + x, CY + y))); c.stroke(); c.strokeStyle = "#e8dcc4"; c.lineWidth = w; c.stroke(); };
      pave([[-1500, 160], [1500, 160]], 90); pave([[0, -360], [0, 900]], 90); pave([[-820, -60], [-820, 160]], 60); pave([[820, -60], [820, 160]], 60); pave([[-880, -560], [-880, -380], [-820, -300]], 50); pave([[880, -560], [880, -380], [820, -300]], 50);
      c.restore();
    }
  }
  // collisions : appelée par le déplacement du joueur
  function blocked(x, y) {
    for (const b of all()) { if (NONSOLID_B.includes(b.id)) { if (b.id === "place") { const fx = CX, fy = CY + 90 - 3.4 * BS; if (Math.hypot((x - fx) / 1.6, y - fy) < 70) return true; } continue; } if (inR(rectOf(b), x, y)) return true; }
    for (const o of allDeco()) if (decoSolid(o) && inR(rectDeco(o, -6), x, y)) return true;
    return false;
  }
  function move(x, y, nx, ny) { if (!blocked(nx, ny)) return { x: nx, y: ny }; if (!blocked(nx, y)) return { x: nx, y }; if (!blocked(x, ny)) return { x, y: ny }; return { x, y }; }

  // ================================================================ interactions (portes, comptoirs, objets utilisables)
  function doorOf(b) { return { x: b.x, y: b.y - BS * .2 }; }
  function nearestBuilding(p, reach = 90) { let best = null, bd = reach; for (const b of all()) { const d = doorOf(b), dist = Math.hypot(p.x - d.x, (p.y - d.y) * 1.3); if (dist < bd) { bd = dist; best = b; } } return best; }
  function nearestDeco(p, reach = 70) { let best = null, bd = reach; for (const o of allDeco()) { const it = OUTDOOR.get(o.id); if (!it || !it.use) continue; const d = Math.hypot(p.x - o.x, (p.y - o.y) * 1.3); if (d < bd) { bd = d; best = o; } } return best; }
  const USE_TXT = { maison: "🚪 Entrer", auberge: "🚪 Entrer", mairie: "🏛️ Entrer à la mairie", vetements: "🧵 Entrer au Fil d'Or" };
  function hintAt(p) {
    if (G_BUILD.on) return null;
    const b = nearestBuilding(p); if (b) { const info = infoOf(b.id); const txt = USE_TXT[b.id] || (info && info.use && info.use !== "—" ? "✨ " + info.use : null); if (txt) return { x: b.x, y: b.y - BS * 5.5, text: txt }; }
    const o = nearestDeco(p); if (o) return { x: o.x, y: o.y - BS * 3, text: "⚡ " + OUTDOOR.get(o.id).use };
    return null;
  }
  function interact(p) {
    if (G_BUILD.on) return false;
    const b = nearestBuilding(p); if (b) { Services.use(b); return true; }
    const o = nearestDeco(p); if (o) { Services.useDeco(o); return true; }
    return false;
  }

  // ================================================================ règles d'emplacement
  function placeCheck(kind, id, x, y, lvl = 1, ignore = null) {
    const W = Game.world, probe = kind === "b" ? rectOf({ id, x, y, lvl }, 0) : rectDeco({ id, x, y }, 0);
    const why = [];
    // le sol : franchissable (sauf le pont, qui doit enjamber une rivière)
    let wet = 0, n = 0; for (let gx = probe.x0; gx <= probe.x1; gx += Math.max(16, (probe.x1 - probe.x0) / 6)) for (let gy = probe.y0; gy <= probe.y1 + BS * .4; gy += Math.max(16, (probe.y1 - probe.y0) / 4)) { n++; if (!W.walkable(gx, gy)) wet++; }
    if (id === "pont") { if (wet === 0) why.push("Un pont se pose sur une rivière"); } else if (wet > 0) why.push("Il y a de l'eau ou de la lave");
    // autres bâtiments et décorations
    for (const b of all()) if (b.bid !== ignore && !(b.id === "place" && kind === "o") && overlap(probe, rectOf(b, b.id === "place" ? -40 : 12))) { why.push("Trop près de : " + (infoOf(b.id) || {}).name); break; }
    if (kind === "b") for (const o of allDeco()) if (o.oid !== ignore && overlap(probe, rectDeco(o, 4))) { why.push("Une décoration gêne"); break; }
    if (kind === "o") for (const o of allDeco()) if (o.oid !== ignore && decoSolid(o) && overlap(probe, rectDeco(o, 0))) { why.push("Une décoration gêne"); break; }
    // grottes, lieux des habitants, quêtes, repaires
    const pts = [];
    for (const cv of KALUA.CAVES) pts.push([cv.x * K, cv.y * K, 160, "L'entrée d'une grotte"]);
    for (const k of Object.keys(NPC.SPOT)) { const q = NPC.W(k); pts.push([q.x, q.y, 50, "Le lieu d'un habitant"]); }
    try { for (const o of Quests.objects()) pts.push([o.x, o.y, 70, "Un objet de quête"]); } catch (e) { /* ignore */ }
    for (const [px, py, r, txt] of pts) if (px > probe.x0 - r && px < probe.x1 + r && py > probe.y0 - r && py < probe.y1 + r) { why.push(txt); break; }
    if (Math.hypot(x - CX, y - CY) < 300 && kind === "b") why.push("La place du village");
    return why;
  }
  const overlap = (a, b) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;

  // ================================================================ mode construction
  const G_BUILD = { on: false, sel: null, kind: "b", flip: false, x: 0, y: 0, why: [], moving: null, t: 0 };
  function ghostPos() { const p = Game.player, f = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[p.dir] || [0, 1]; const size = G_BUILD.kind === "b" ? sizeOf({ id: G_BUILD.sel, lvl: G_BUILD.lvl || 1 }) : (OUTDOOR.get(G_BUILD.sel) || { size: [2, 2] }).size; const dist = (f[1] < 0 ? size[1] * BS * .7 + 60 : f[1] > 0 ? 90 : size[0] * BS * .5 + 50); const gx = p.x + f[0] * dist, gy = p.y + f[1] * dist + (f[1] < 0 ? 0 : f[1] > 0 ? size[1] * BS * .62 : BS); const g = BS / 2; return { x: Math.round(gx / g) * g, y: Math.round(gy / g) * g }; }
  function updateBuild(dt) {
    if (!G_BUILD.on || !G_BUILD.sel) return; G_BUILD.t -= dt; const q = ghostPos();
    if (q.x !== G_BUILD.x || q.y !== G_BUILD.y || G_BUILD.t <= 0) { G_BUILD.x = q.x; G_BUILD.y = q.y; G_BUILD.t = .4; G_BUILD.why = placeCheck(G_BUILD.kind, G_BUILD.sel, q.x, q.y, G_BUILD.lvl || 1, G_BUILD.moving && G_BUILD.moving.key); }
    BuildUI.status(G_BUILD.why);
  }
  function drawGhost(c) {
    const ok = !G_BUILD.why.length, x = G_BUILD.x, y = G_BUILD.y, r = G_BUILD.kind === "b" ? rectOf({ id: G_BUILD.sel, x, y, lvl: G_BUILD.lvl || 1 }) : rectDeco({ id: G_BUILD.sel, x, y });
    c.fillStyle = ok ? "rgba(90,220,120,.28)" : "rgba(240,80,90,.3)"; c.fillRect(r.x0, r.y0, r.x1 - r.x0, r.y1 - r.y0 + BS * .4); c.strokeStyle = ok ? "#3aa05a" : "#e0566b"; c.lineWidth = 3; c.setLineDash([10, 8]); c.strokeRect(r.x0, r.y0, r.x1 - r.x0, r.y1 - r.y0 + BS * .4); c.setLineDash([]);
    drawSprite(c, sprite(G_BUILD.kind, G_BUILD.sel, G_BUILD.lvl || 1, G_BUILD.flip), x, y, .72);
  }
  function startBuild(kind, id, moving = null, lvl = 1) { Object.assign(G_BUILD, { on: true, sel: id, kind, flip: moving ? !!moving.flip : false, moving, lvl, t: 0, why: [] }); BuildUI.show(); }
  function stopBuild() { G_BUILD.on = false; G_BUILD.sel = null; G_BUILD.moving = null; BuildUI.hide(); }
  function confirmBuild() {
    if (!G_BUILD.sel) return; if (G_BUILD.why.length) { Game.toast("❌ " + G_BUILD.why[0]); return; }
    const { kind, sel: id, x, y, flip, moving } = G_BUILD;
    if (moving) { const path = (kind === "b" ? "b/" : "o/") + moving.key; const cur = (kind === "b" ? S.b : S.o)[moving.key]; if (cur) { save(path, Object.assign({}, cur, { x, y, flip })); Game.toast("📦 Déplacé !"); } stopBuild(); return; }
    const cost = kind === "b" ? (infoOf(id) || {}).cost || {} : {};
    if (!Prog.hasAll(cost)) { Game.toast("Il te manque : " + missing(cost)); return; }
    Prog.pay(cost);
    // les arbres et rochers sous le bâtiment donnent leurs ressources
    if (kind === "b") { const r = rectOf({ id, x, y }, 20); let wood = 0, stone = 0; Game.world.around(r.x0, r.y0, r.x1, r.y1, (ch) => { for (const s of ch.solids) if (!s.gone && inR(r, s.x, s.y)) { if (["palm", "jtree", "mangrove", "deadtree", "bush"].includes(s.kind)) wood++; else stone++; } }); if (wood) Prog.give("bois", wood); if (stone) Prog.give("pierre", stone); }
    const key = (kind === "b" ? "b" : "o") + Date.now().toString(36) + Math.floor(Math.random() * 1e4);
    save((kind === "b" ? "b/" : "o/") + key, kind === "b" ? { id, x, y, lvl: 1, flip, by: me.uid, at: Date.now() } : { id, x, y, flip, by: me.uid });
    Music.sfx("craft"); Game.shake(4, .25); Game.toast(kind === "b" ? `🏗️ ${(infoOf(id) || {}).name} construit !` : "🌸 Posé !");
    if (kind === "b") stopBuild();
  }
  const missing = (cost) => Object.entries(cost).filter(([k, v]) => !Prog.has(k, v)).map(([k, v]) => `${v - Prog.count(k)} ${ITEMS.name(k)}`).join(", ");
  function remove(kind, key) {
    const src = kind === "b" ? S.b[key] : S.o[key]; if (!src) return;
    if (kind === "b") { const info = infoOf(src.id), lvl = src.lvl || 1; const back = {}; const add = (c) => { for (const [k, v] of Object.entries(c || {})) back[k] = (back[k] || 0) + v; }; if (src.id === "maison") for (let l = 0; l < lvl; l++) add(BUILD.LEVELS[l].cost); else add(info && info.cost); for (const [k, v] of Object.entries(back)) Prog.give(k, v, true); Game.toast("🔨 Démonté : toutes les ressources sont rendues."); save("rooms/" + key, null); save("site/" + key, null); }
    save((kind === "b" ? "b/" : "o/") + key, null);
  }
  // le bâtiment ou la déco le plus proche, pour le modifier
  function nearestOwned(p) { let best = null, bd = 140; for (const [key, b] of Object.entries(S.b || {})) { if (!b) continue; const d = Math.hypot(p.x - b.x, (p.y - b.y) * 1.2); if (d < bd) { bd = d; best = { kind: "b", key, v: b }; } } for (const [key, o] of Object.entries(S.o || {})) { if (!o) continue; const d = Math.hypot(p.x - o.x, (p.y - o.y) * 1.2); if (d < bd * .7) { bd = d / .7; best = { kind: "o", key, v: o }; } } return best; }

  // ================================================================ chantier partagé (amélioration de la maison)
  function siteOf(key) { const b = S.b[key]; if (!b || b.id !== "maison" || (b.lvl || 1) >= 5) return null; const need = BUILD.LEVELS[b.lvl].cost; const st = (S.site || {})[key] || {}; const have = {}; for (const per of Object.values(st.have || {})) for (const [k, v] of Object.entries(per || {})) have[k] = (have[k] || 0) + v; return { need, have, by: st.have || {}, next: b.lvl + 1 }; }
  function deposit(key) {
    const s = siteOf(key); if (!s) return; const mine = Object.assign({}, ((S.site || {})[key] || {}).have?.[me.uid] || {}); let any = false;
    for (const [k, v] of Object.entries(s.need)) { const left = v - (s.have[k] || 0), give = Math.min(left, Prog.count(k)); if (give > 0) { Prog.take(k, give); mine[k] = (mine[k] || 0) + give; any = true; } }
    if (!any) { Game.toast("Tu n'as rien de ce qui manque."); return; }
    save(`site/${key}/have/${me.uid}`, mine); Music.sfx("pickup");
    setTimeout(() => { const s2 = siteOf(key); if (s2 && Object.entries(s2.need).every(([k, v]) => (s2.have[k] || 0) >= v)) upgrade(key); }, 300);
  }
  function upgrade(key) {
    const b = S.b[key]; if (!b) return; const lvl = (b.lvl || 1) + 1;
    const why = placeCheck("b", "maison", b.x, b.y, lvl, key); if (why.length) { Game.toast("Pas assez de place pour agrandir : " + why[0]); return; }
    save("b/" + key, Object.assign({}, b, { lvl })); save("site/" + key, null); Music.jingle && Music.jingle("secret"); Game.shake(6, .4);
    Game.toast(`🏰 La maison devient : ${BUILD.LEVELS[lvl - 1].name} ! (${BUILD.ROOMS[lvl - 1]} pièces)`, 3200);
  }

  // ================================================================ synchronisation (en ligne ou dans le téléphone)
  function save(path, value) {
    // on applique tout de suite localement, puis on envoie
    const parts = path.split("/"); let o = S; for (let i = 0; i < parts.length - 1; i++) { o[parts[i]] = o[parts[i]] || {}; o = o[parts[i]]; } if (value === null) delete o[parts[parts.length - 1]]; else o[parts[parts.length - 1]] = value;
    if (session && session.saveVillage) session.saveVillage(path, value);
    changed();
  }
  function changed() { if (typeof Net !== "undefined" && Net.setShift) Net.setShift(S.clock || 0); onChange.forEach((f) => { try { f(S); } catch (e) { console.warn(e); } }); }
  function init(sess) {
    session = sess; S = { b: {}, o: {}, rooms: {}, site: {}, clock: 0, bed: {} };
    if (unwatch) { unwatch(); unwatch = null; }
    if (sess && sess.watchVillage) unwatch = sess.watchVillage((v) => { S = Object.assign({ b: {}, o: {}, rooms: {}, site: {}, clock: 0, bed: {} }, v || {}); changed(); });
    changed();
  }
  return {
    BS, BASE, CX, CY, get S() { return S; }, all, allDeco, infoOf, sizeOf, sprite, drawSprite, init, save, onChange: (f) => onChange.push(f),
    collect, drawGround, covers, blocked, move, hintAt, interact, nearestBuilding,
    build: G_BUILD, startBuild, stopBuild, confirmBuild, updateBuild, placeCheck, remove, nearestOwned, siteOf, deposit, upgrade, missing, isBase,
    flip() { G_BUILD.flip = !G_BUILD.flip; },
  };
})();
