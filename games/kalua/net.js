/* Les Échoués de Kalua — réseau (Firebase Realtime Database).
 *
 *   islands/{id}            { owner, name, seed, createdAt, members: { uid: { name } } }
 *   islands/{id}/players/{uid}  { name, avatar, online, seen }
 *   islands/{id}/pos/{uid}      { x, y, d, m, a, at }   position en direct (et dernière position connue)
 *   userIslands/{uid}/{id}      { with, withUid, createdAt }   liste des îles de chaque joueur
 *
 * Le joueur est celui de Von : même compte Firebase (connexion anonyme), même pseudo, mêmes amis. */
"use strict";

const Net = (() => {
  const SDK = "https://www.gstatic.com/firebasejs/13.2.0/";
  const config = window.VON_FIREBASE || null;
  let fb = null, db = null, me = null, offset = 0, shift = 0;

  const ls = (k, f) => { try { const v = localStorage.getItem(k); return v === null ? f : JSON.parse(v); } catch { return f; } };

  async function init() {
    if (!config || !config.apiKey || !config.databaseURL) throw Object.assign(new Error("noconfig"), { code: "noconfig" });
    let app, auth, rtdb;
    try {
      [app, auth, rtdb] = await Promise.all([import(SDK + "firebase-app.js"), import(SDK + "firebase-auth.js"), import(SDK + "firebase-database.js")]);
    } catch { throw Object.assign(new Error("offline"), { code: "offline" }); }
    fb = rtdb;
    const fbApp = app.initializeApp(config);
    const a = auth.getAuth(fbApp);
    db = rtdb.getDatabase(fbApp, config.databaseURL);
    if (config.emulator) { // tests en local uniquement
      auth.connectAuthEmulator(a, "http://" + config.emulator.auth, { disableWarnings: true });
      const [h, p] = config.emulator.database.split(":"); rtdb.connectDatabaseEmulator(db, h, Number(p));
    }
    await auth.setPersistence(a, auth.indexedDBLocalPersistence).catch(() => {});
    let user = await new Promise((r) => { const u = auth.onAuthStateChanged(a, (x) => { u(); r(x); }); });
    if (!user) { try { user = (await auth.signInAnonymously(a)).user; } catch { throw Object.assign(new Error("offline"), { code: "offline" }); } }
    rtdb.onValue(rtdb.ref(db, ".info/serverTimeOffset"), (snap) => { offset = Number(snap.val()) || 0; });
    const vonMe = ls("von:me", null);
    me = { uid: user.uid, name: vonMe && vonMe.uid === user.uid ? vonMe.name : ls("von:name", "") || "Joueur" };
    syncSoloList(); // les îles en solo sont aussi gardées en ligne (changement de téléphone)
    return me;
  }

  const friends = () => {
    const list = ls("von:friends", []);
    return Array.isArray(list) ? list.filter((f) => f && f.uid && f.uid !== me?.uid) : [];
  };

  const r = (path) => fb.ref(db, path);
  const on = (path, cb) => fb.onValue(r(path), (s) => cb(s.val()), () => cb(null));

  // les îles à deux (en ligne) et les îles en solo (dans le téléphone), les plus récentes d'abord
  function watchMyIslands(cb) {
    let duo = [];
    const emit = () => cb(duo.concat(soloList()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
    emit();
    const off = on(`userIslands/${me.uid}`, (v) => { duo = Object.entries(v || {}).map(([id, x]) => ({ id, ...x })); emit(); });
    const onSolo = () => emit(); addEventListener("kalua:solo", onSolo);
    return () => { off(); removeEventListener("kalua:solo", onSolo); };
  }

  const watchOnline = (id, uid, cb) => on(`islands/${id}/players/${uid}/online`, (v) => cb(v === true));

  // ---------------------------------------------------------------- îles en solo : gardées dans le téléphone, jouées avec un compagnon (bot)
  const soloKey = () => `kalua:solo:${me ? me.uid : "?"}`;
  const soloList = () => { const l = ls(soloKey(), []); return Array.isArray(l) ? l : []; };
  const soloSave = (l, fromRemote) => {
    try { localStorage.setItem(soloKey(), JSON.stringify(l)); if (!fromRemote) localStorage.setItem(soloKey() + ":at", String(Date.now())); } catch { /* ignore */ }
    if (!fromRemote && fb && me) fb.set(r(`soloSaves/${me.uid}/list`), { at: Date.now(), l: JSON.parse(JSON.stringify(l)) }).catch(() => {});
    dispatchEvent(new Event("kalua:solo"));
  };
  // ---- sauvegarde en ligne du mode solo : soloSaves/{uid}/list, /prog/{île}, /village/{île} (la version la plus récente gagne)
  async function syncSoloList() {
    if (!fb || !me) return;
    try {
      const v = (await fb.get(r(`soloSaves/${me.uid}/list`))).val(), localAt = Number(ls(soloKey() + ":at", 0)) || 0;
      if (v && Array.isArray(v.l) && (v.at || 0) > localAt) { soloSave(v.l, true); try { localStorage.setItem(soloKey() + ":at", String(v.at)); } catch { /* ignore */ } }
      else if (soloList().length) fb.set(r(`soloSaves/${me.uid}/list`), { at: localAt || Date.now(), l: soloList() }).catch(() => {});
    } catch { /* hors ligne ou règles pas encore collées : tant pis, le téléphone garde tout */ }
  }
  const soloRemote = async (kind, id) => { if (!fb || !me) return null; try { return (await fb.get(r(`soloSaves/${me.uid}/${kind}/${id}`))).val(); } catch { return null; } };
  const isSolo = (id) => String(id).startsWith("solo-");
  function createSolo(difficulty, bot) {
    const id = "solo-" + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);
    const x = { id, solo: true, with: bot.name, bot, difficulty, createdAt: Date.now(), seed: Math.floor(Math.random() * 2 ** 31) };
    soloSave([x].concat(soloList())); return id;
  }
  async function soloSession(id) {
    const x = soloList().find((i) => i.id === id);
    if (!x) throw Object.assign(new Error("gone"), { code: "gone" });
    const [remoteProg, remoteVil] = await Promise.all([soloRemote("prog", id), soloRemote("village", id)]);
    const island = { owner: me.uid, name: `L'île de ${me.name}`, seed: x.seed, createdAt: x.createdAt, members: { [me.uid]: { name: me.name } }, difficulty: x.difficulty || "normal", solo: true, bot: x.bot };
    const noop = () => {};
    const vk = `kalua:village:${id}`; let V = ls(vk, {}) || {}; let vcb = null;
    if (remoteVil && remoteVil.v && (remoteVil.at || 0) > (Number(ls(vk + ":at", 0)) || 0)) { V = remoteVil.v; try { localStorage.setItem(vk, JSON.stringify(V)); } catch { /* ignore */ } }
    let pt = null, pp = null, vt = null;
    const up = (kind, val) => { if (fb && me) fb.set(r(`soloSaves/${me.uid}/${kind}/${id}`), val).catch(() => {}); };
    return { id, island, others: [], me, savedPos: null, progress: remoteProg || null, solo: true,
      saveProgress(p) { pp = p; if (!pt) pt = setTimeout(() => { pt = null; up("prog", pp); }, 6000); },
      watchPlayer: noop, watchPos: noop, sendPos: noop, setOnline: noop, setAvatar: noop, async leave() {},
      watchVillage(cb) { vcb = cb; cb(JSON.parse(JSON.stringify(V))); return () => { vcb = null; }; },
      saveVillage(path, value) { const parts = path.split("/"); let o = V; for (let i = 0; i < parts.length - 1; i++) { if (!o[parts[i]] || typeof o[parts[i]] !== "object") o[parts[i]] = {}; o = o[parts[i]]; } if (value === null) delete o[parts[parts.length - 1]]; else o[parts[parts.length - 1]] = value; try { localStorage.setItem(vk, JSON.stringify(V)); localStorage.setItem(vk + ":at", String(Date.now())); } catch { /* ignore */ }
        if (!vt) vt = setTimeout(() => { vt = null; up("village", { at: Date.now(), v: JSON.parse(JSON.stringify(V)) }); }, 6000); } };
  }

  async function createIsland(friend, difficulty = "normal") {
    const id = fb.push(r("islands")).key;
    const now = Date.now();
    const seed = Math.floor(Math.random() * 2 ** 31);
    const name = `L'île de ${me.name} & ${friend.name}`;
    await fb.update(r("/"), {
      [`islands/${id}`]: { owner: me.uid, name, seed, createdAt: now, difficulty, members: { [me.uid]: { name: me.name }, [friend.uid]: { name: friend.name } } },
      [`userIslands/${me.uid}/${id}`]: { with: friend.name, withUid: friend.uid, createdAt: now, seed, difficulty },
      [`userIslands/${friend.uid}/${id}`]: { with: me.name, withUid: me.uid, createdAt: now, seed, difficulty },
    });
    return id;
  }

  const leaveIsland = async (id) => {
    if (isSolo(id)) { soloSave(soloList().filter((x) => x.id !== id)); try { localStorage.removeItem(`kalua:prog:${id}:${me.uid}`); localStorage.removeItem(`kalua:village:${id}`); } catch { /* ignore */ } return; }
    return fb.remove(r(`userIslands/${me.uid}/${id}`));
  };

  // Entrer sur une île : renvoie une session (positions en direct, présence)
  async function enter(id, avatar) {
    if (isSolo(id)) return soloSession(id);
    const snap = await fb.get(r(`islands/${id}`));
    const island = snap.val();
    if (!island) throw Object.assign(new Error("gone"), { code: "gone" });
    const others = Object.keys(island.members || {}).filter((u) => u !== me.uid);
    const playerRef = r(`islands/${id}/players/${me.uid}`);
    const onlineRef = r(`islands/${id}/players/${me.uid}/online`);
    const seenRef = r(`islands/${id}/players/${me.uid}/seen`);
    await fb.onDisconnect(onlineRef).set(false);
    await fb.onDisconnect(seenRef).set(fb.serverTimestamp());
    await fb.update(playerRef, { name: me.name, avatar, online: true, seen: fb.serverTimestamp() });
    const unsubs = [];
    let lastSent = 0, pending = null, timer = null;
    const posRef = r(`islands/${id}/pos/${me.uid}`);
    const flush = () => { timer = null; if (!pending) return; lastSent = Date.now(); fb.set(posRef, pending).catch(() => {}); pending = null; };
    const progRef = r(`islands/${id}/progress/${me.uid}`);
    let progTimer = null, progPending = null;
    return {
      id, island, others, me,
      savedPos: (island.pos || {})[me.uid] || null,
      progress: (island.progress || {})[me.uid] || null,
      // progression (sac, quêtes, grottes…) : au plus une écriture toutes les 4 secondes
      saveProgress(p) {
        progPending = p;
        if (!progTimer) progTimer = setTimeout(() => { progTimer = null; fb.set(progRef, progPending).catch(() => {}); }, 4000);
      },
      watchPlayer(uid, cb) { unsubs.push(on(`islands/${id}/players/${uid}`, cb)); },
      watchPos(uid, cb) { unsubs.push(on(`islands/${id}/pos/${uid}`, cb)); },
      // ~10 envois par seconde au maximum
      sendPos(p) {
        pending = p;
        const wait = 100 - (Date.now() - lastSent);
        if (wait <= 0) flush(); else if (!timer) timer = setTimeout(flush, wait);
      },
      setOnline(v) { fb.update(playerRef, { online: v, seen: fb.serverTimestamp() }).catch(() => {}); },
      setAvatar(av) { fb.update(playerRef, { avatar: av }).catch(() => {}); },
      // le village commun (bâtiments, déco, pièces, chantiers, horloge)
      watchVillage(cb) { const u = on(`islands/${id}/village`, cb); unsubs.push(u); return u; },
      saveVillage(path, value) { const ref = r(`islands/${id}/village/${path}`); (value === null ? fb.remove(ref) : fb.set(ref, value)).catch((e) => console.warn("village", e)); },
      async leave() {
        unsubs.forEach((u) => u()); flush();
        await fb.update(playerRef, { online: false, seen: fb.serverTimestamp() }).catch(() => {});
        fb.onDisconnect(onlineRef).cancel().catch(() => {});
      },
    };
  }

  return { setShift: (s) => { shift = Number(s) || 0; }, now: () => (Date.now() + offset) / 1000 + shift, init, friends, watchMyIslands, watchOnline, createIsland, leaveIsland, enter, createSolo, isSolo, get me() { return me; } };
})();
