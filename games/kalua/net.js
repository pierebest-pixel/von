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
  let fb = null, db = null, me = null;

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
    const vonMe = ls("von:me", null);
    me = { uid: user.uid, name: vonMe && vonMe.uid === user.uid ? vonMe.name : ls("von:name", "") || "Joueur" };
    return me;
  }

  const friends = () => {
    const list = ls("von:friends", []);
    return Array.isArray(list) ? list.filter((f) => f && f.uid && f.uid !== me?.uid) : [];
  };

  const r = (path) => fb.ref(db, path);
  const on = (path, cb) => fb.onValue(r(path), (s) => cb(s.val()), () => cb(null));

  function watchMyIslands(cb) {
    return on(`userIslands/${me.uid}`, (v) => {
      const list = Object.entries(v || {}).map(([id, x]) => ({ id, ...x })).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      cb(list);
    });
  }

  const watchOnline = (id, uid, cb) => on(`islands/${id}/players/${uid}/online`, (v) => cb(v === true));

  async function createIsland(friend) {
    const id = fb.push(r("islands")).key;
    const now = Date.now();
    const seed = Math.floor(Math.random() * 2 ** 31);
    const name = `L'île de ${me.name} & ${friend.name}`;
    await fb.update(r("/"), {
      [`islands/${id}`]: { owner: me.uid, name, seed, createdAt: now, members: { [me.uid]: { name: me.name }, [friend.uid]: { name: friend.name } } },
      [`userIslands/${me.uid}/${id}`]: { with: friend.name, withUid: friend.uid, createdAt: now, seed },
      [`userIslands/${friend.uid}/${id}`]: { with: me.name, withUid: me.uid, createdAt: now, seed },
    });
    return id;
  }

  const leaveIsland = (id) => fb.remove(r(`userIslands/${me.uid}/${id}`));

  // Entrer sur une île : renvoie une session (positions en direct, présence)
  async function enter(id, avatar) {
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
    return {
      id, island, others, me,
      savedPos: (island.pos || {})[me.uid] || null,
      watchPlayer(uid, cb) { unsubs.push(on(`islands/${id}/players/${uid}`, cb)); },
      watchPos(uid, cb) { unsubs.push(on(`islands/${id}/pos/${uid}`, cb)); },
      // ~10 envois par seconde au maximum
      sendPos(p) {
        pending = p;
        const wait = 100 - (Date.now() - lastSent);
        if (wait <= 0) flush(); else if (!timer) timer = setTimeout(flush, wait);
      },
      setOnline(v) { fb.update(playerRef, { online: v, seen: fb.serverTimestamp() }).catch(() => {}); },
      async leave() {
        unsubs.forEach((u) => u()); flush();
        await fb.update(playerRef, { online: false, seen: fb.serverTimestamp() }).catch(() => {});
        fb.onDisconnect(onlineRef).cancel().catch(() => {});
      },
    };
  }

  return { init, friends, watchMyIslands, watchOnline, createIsland, leaveIsland, enter, get me() { return me; } };
})();
