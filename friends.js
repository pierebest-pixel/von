/* Von — amis (profil, tag, demandes d'ami) via Firebase.
 * Sans configuration dans firebase-config.js, la fonction reste désactivée.
 *
 * Données en ligne (Firestore) :
 *   profiles/{uid}            { tag, name, createdAt }
 *   tags/{TAG}                { uid }                 -> retrouver un joueur par son tag
 *   requests/{from}_{to}      { from, to, createdAt } -> demande d'ami en attente
 *   friends/{uid}/list/{ami}  { since }               -> liste d'amis de chaque joueur
 */
"use strict";

const VonFriends = (() => {
  const SDK = "https://www.gstatic.com/firebasejs/13.2.0/";
  const TAG_CHARS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // sans 0/O ni 1/I pour éviter les confusions
  const TAG_LEN = 6;
  const NAME_MAX = 20;

  const ls = {
    get(k, f) { try { const v = localStorage.getItem("von:" + k); return v === null ? f : JSON.parse(v); } catch { return f; } },
    set(k, v) { try { localStorage.setItem("von:" + k, JSON.stringify(v)); } catch { /* ignore */ } },
  };

  const config = window.VON_FIREBASE || null;
  const enabled = Boolean(config && config.apiKey && config.projectId);

  // status : off (pas configuré) | loading | ready | offline | error
  const state = {
    status: enabled ? "loading" : "off",
    me: ls.get("me", null), // { uid, tag, name }
    friends: ls.get("friends", []), // [{ uid, tag, name, since }]
    incoming: [], // [{ uid, tag, name, createdAt }]
    outgoing: [],
  };

  let fb = null; // modules Firebase
  let db = null;
  let notify = () => {};
  const profiles = new Map(); // uid -> { tag, name }
  let raw = { friends: [], incoming: [], outgoing: [] };

  const changed = () => {
    ls.set("me", state.me);
    ls.set("friends", state.friends);
    notify();
  };

  const cleanName = (n) => String(n ?? "").replace(/\s+/g, " ").trim().slice(0, NAME_MAX);
  const normalizeTag = (t) => String(t ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const randomTag = () => {
    const bytes = crypto.getRandomValues(new Uint8Array(TAG_LEN));
    return Array.from(bytes, (b) => TAG_CHARS[b % TAG_CHARS.length]).join("");
  };

  async function profile(uid, fresh = false) {
    if (!fresh && profiles.has(uid)) return profiles.get(uid);
    try {
      const snap = await fb.getDoc(fb.doc(db, "profiles", uid));
      const p = snap.exists() ? { tag: snap.data().tag, name: snap.data().name } : { tag: "", name: "Joueur supprimé" };
      profiles.set(uid, p);
      return p;
    } catch {
      return profiles.get(uid) || { tag: "", name: "…" };
    }
  }

  async function rebuild() {
    const withProfile = async (list) => Promise.all(list.map(async (x) => ({ ...x, ...(await profile(x.uid)) })));
    const [friends, incoming, outgoing] = await Promise.all([
      withProfile(raw.friends), withProfile(raw.incoming), withProfile(raw.outgoing),
    ]);
    state.friends = friends.sort((a, b) => a.name.localeCompare(b.name, "fr"));
    state.incoming = incoming.sort((a, b) => b.createdAt - a.createdAt);
    state.outgoing = outgoing.sort((a, b) => b.createdAt - a.createdAt);
    changed();
  }

  const millis = (t) => (t && typeof t.toMillis === "function" ? t.toMillis() : Number(t) || 0);

  async function ensureProfile(uid) {
    const ref = fb.doc(db, "profiles", uid);
    const snap = await fb.getDoc(ref);
    if (snap.exists()) {
      state.me = { uid, tag: snap.data().tag, name: snap.data().name };
      // Pseudo changé hors connexion : on le renvoie
      const local = cleanName(ls.get("name", ""));
      if (local && local !== state.me.name) await setName(local);
      return;
    }
    const name = cleanName(ls.get("name", "")) || "Joueur";
    for (let attempt = 0; attempt < 8; attempt++) {
      const tag = randomTag();
      const batch = fb.writeBatch(db);
      batch.set(fb.doc(db, "tags", tag), { uid });
      batch.set(ref, { tag, name, createdAt: fb.serverTimestamp() });
      try {
        await batch.commit();
        state.me = { uid, tag, name };
        return;
      } catch (err) {
        if (err.code !== "permission-denied") throw err; // tag déjà pris -> on en tire un autre
      }
    }
    throw new Error("Impossible de créer un tag");
  }

  function listen(uid) {
    const { onSnapshot, collection, query, where } = fb;
    onSnapshot(collection(db, "friends", uid, "list"), (s) => {
      raw.friends = s.docs.map((d) => ({ uid: d.id, since: millis(d.data().since) }));
      rebuild();
    }, () => {});
    onSnapshot(query(collection(db, "requests"), where("to", "==", uid)), (s) => {
      raw.incoming = s.docs.map((d) => ({ uid: d.data().from, createdAt: millis(d.data().createdAt) }));
      rebuild();
    }, () => {});
    onSnapshot(query(collection(db, "requests"), where("from", "==", uid)), (s) => {
      raw.outgoing = s.docs.map((d) => ({ uid: d.data().to, createdAt: millis(d.data().createdAt) }));
      rebuild();
    }, () => {});
  }

  async function init(onChange) {
    notify = onChange || notify;
    if (!enabled) return;
    try {
      const [app, auth, fs] = await Promise.all([
        import(SDK + "firebase-app.js"),
        import(SDK + "firebase-auth.js"),
        import(SDK + "firebase-firestore.js"),
      ]);
      fb = { ...fs };
      const fbApp = app.initializeApp(config);
      const a = auth.getAuth(fbApp);
      db = fs.getFirestore(fbApp);
      if (config.emulator) { // tests en local uniquement
        auth.connectAuthEmulator(a, "http://" + config.emulator.auth, { disableWarnings: true });
        fs.connectFirestoreEmulator(db, ...config.emulator.firestore.split(":").map((x, i) => (i ? Number(x) : x)));
      }
      await auth.setPersistence(a, auth.indexedDBLocalPersistence).catch(() => {});
      const user = a.currentUser || (await new Promise((r) => { const u = auth.onAuthStateChanged(a, (x) => { u(); r(x); }); }))
        || (await auth.signInAnonymously(a)).user;
      await ensureProfile(user.uid);
      state.status = "ready";
      changed();
      listen(user.uid);
    } catch (err) {
      console.warn("Amis indisponibles :", err);
      state.status = navigator.onLine === false || /network|Failed to fetch|import/i.test(String(err)) ? "offline" : "error";
      changed();
    }
  }

  const ready = () => {
    if (state.status !== "ready") throw Object.assign(new Error("not ready"), { code: "not-ready" });
  };

  async function setName(name) {
    name = cleanName(name);
    if (!name) return false;
    ls.set("name", name);
    if (state.me) state.me.name = name;
    changed();
    if (!fb || !state.me) return true; // hors connexion : envoyé au prochain lancement
    await fb.updateDoc(fb.doc(db, "profiles", state.me.uid), { name });
    return true;
  }

  async function acceptRequest(fromUid) {
    ready();
    const me = state.me.uid;
    const batch = fb.writeBatch(db);
    batch.set(fb.doc(db, "friends", me, "list", fromUid), { since: fb.serverTimestamp() });
    batch.set(fb.doc(db, "friends", fromUid, "list", me), { since: fb.serverTimestamp() });
    batch.delete(fb.doc(db, "requests", `${fromUid}_${me}`));
    if (state.outgoing.some((r) => r.uid === fromUid)) batch.delete(fb.doc(db, "requests", `${me}_${fromUid}`));
    await batch.commit();
  }

  // Renvoie : sent | accepted | self | notfound | already | pending | invalid
  async function sendRequest(input) {
    ready();
    const tag = normalizeTag(input);
    if (tag.length !== TAG_LEN) return { result: "invalid" };
    if (tag === state.me.tag) return { result: "self" };
    const snap = await fb.getDoc(fb.doc(db, "tags", tag));
    if (!snap.exists()) return { result: "notfound" };
    const uid = snap.data().uid;
    const who = await profile(uid, true);
    if (state.friends.some((f) => f.uid === uid)) return { result: "already", ...who };
    if (state.incoming.some((r) => r.uid === uid)) { await acceptRequest(uid); return { result: "accepted", ...who }; }
    if (state.outgoing.some((r) => r.uid === uid)) return { result: "pending", ...who };
    const me = state.me.uid;
    await fb.setDoc(fb.doc(db, "requests", `${me}_${uid}`), { from: me, to: uid, createdAt: fb.serverTimestamp() });
    return { result: "sent", ...who };
  }

  async function declineRequest(fromUid) {
    ready();
    await fb.deleteDoc(fb.doc(db, "requests", `${fromUid}_${state.me.uid}`));
  }

  async function cancelRequest(toUid) {
    ready();
    await fb.deleteDoc(fb.doc(db, "requests", `${state.me.uid}_${toUid}`));
  }

  async function removeFriend(uid) {
    ready();
    const me = state.me.uid;
    const batch = fb.writeBatch(db);
    batch.delete(fb.doc(db, "friends", me, "list", uid));
    batch.delete(fb.doc(db, "friends", uid, "list", me));
    await batch.commit();
  }

  return {
    enabled, state, init, setName, sendRequest, acceptRequest, declineRequest, cancelRequest, removeFriend,
    normalizeTag, NAME_MAX,
    get localName() { return state.me?.name || cleanName(ls.get("name", "")) || "Joueur"; },
  };
})();
