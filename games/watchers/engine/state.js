/* Watchers — état de la partie, sauvegarde, entrées tactiles, sons. */
"use strict";
const SAVE_KEY = "watchers:save";

const G = {
  save: null, busy: false,
  newGame() {
    this.save = {
      v: 1, map: "brindille", x: 7, y: 12, party: [], box: [], bag: { soin: 3, lanterne: 0 }, money: 500,
      flags: {}, seenL: [], caughtL: [], visited: [], regions: [1], lit: {}, tideSteps: 0, cold: null, light: 100,
      lastHeal: ["brindille", 7, 12], lastFire: null, starter: null, playTime: 0, quests: {},
    };
  },
  load() { try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); if (s && s.v === 1) { this.save = s; return true; } } catch (e) { /* ignore */ } return false; },
  hasSave() { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } },
  write() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.save)); return true; } catch (e) { return false; } },

  flag(k) { return !!this.save.flags[k]; },
  setFlag(k, v = true) { this.save.flags[k] = v; },
  count(k) { return this.save.flags[k] || 0; },
  inc(k) { this.save.flags[k] = (this.save.flags[k] || 0) + 1; return this.save.flags[k]; },

  // Quêtes : id -> { step, done }
  quest(id) { return this.save.quests[id] || null; },
  setQuest(id, step, done = false) { const had = this.save.quests[id]; this.save.quests[id] = { step, done }; if (!had) UI.toast("Nouvelle quête : " + QUESTS[id].title); else if (done) UI.toast("Quête terminée : " + QUESTS[id].title); },

  seen(sp) { if (!this.save.seenL.includes(sp)) this.save.seenL.push(sp); },
  caught(sp) { this.seen(sp); if (!this.save.caughtL.includes(sp)) this.save.caughtL.push(sp); },

  has(item, n = 1) { return (this.save.bag[item] || 0) >= n; },
  give(item, n = 1, silent) { this.save.bag[item] = (this.save.bag[item] || 0) + n; if (!silent) { SFX.play("item"); UI.toast(`Obtenu : ${ITEMS[item].name}${n > 1 ? " ×" + n : ""}`); } },
  take(item, n = 1) { this.save.bag[item] = Math.max(0, (this.save.bag[item] || 0) - n); if (!this.save.bag[item]) delete this.save.bag[item]; },

  addMon(mon) {
    this.caught(mon.species);
    if (this.save.party.length < 6) { this.save.party.push(mon); return "party"; }
    this.save.box.push(mon); return "box";
  },
  firstAlive() { return this.save.party.find((m) => m.hp > 0); },
  healAll() { this.save.party.forEach(healMon); this.save.lastHeal = [this.save.map, World.px, World.py]; },
  canSurf() { return this.flag("surf") && this.save.party.some((m) => m.hp > 0 && SPECIES[m.species].types.includes("Onde")); },
  bossCount(region) { return (BOSSES[region] || []).filter((id) => this.flag("beat:" + id)).length; },

  // Raccourcis pour les scripts d'histoire
  say(...a) { return UI.say(...a); },
  ask(...a) { return UI.ask(...a); },
};

// ------------------------------------------------------------------ Entrées
const Input = {
  joy: null, keys: {}, a: false, b: false, _dir: null,
  dir() {
    const k = this.keys;
    if (k.ArrowUp || k.z || k.w) return "up"; if (k.ArrowDown || k.s) return "down";
    if (k.ArrowLeft || k.q || k.a) return "left"; if (k.ArrowRight || k.d) return "right";
    return this._dir;
  },
  run() { return this.b || this.keys.Shift; },
  init(root) {
    addEventListener("keydown", (e) => { this.keys[e.key] = true; if (e.key === " " || e.key === "Enter") Input.pressA(); if (e.key === "Escape") Input.pressB(); });
    addEventListener("keyup", (e) => { this.keys[e.key] = false; });
    const joy = root.querySelector(".joy"), knob = joy.querySelector("b");
    let id = null, cx = 0, cy = 0;
    const move = (t) => {
      const dx = t.clientX - cx, dy = t.clientY - cy, d = Math.hypot(dx, dy), max = 40;
      const k = d > max ? max / d : 1;
      knob.style.transform = `translate(${dx * k}px,${dy * k}px)`;
      this._dir = d < 14 ? null : Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up");
    };
    const end = () => { id = null; this._dir = null; knob.style.transform = ""; };
    joy.addEventListener("touchstart", (e) => { e.preventDefault(); const t = e.changedTouches[0]; id = t.identifier; const r = joy.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; move(t); }, { passive: false });
    joy.addEventListener("touchmove", (e) => { e.preventDefault(); for (const t of e.changedTouches) if (t.identifier === id) move(t); }, { passive: false });
    joy.addEventListener("touchend", end); joy.addEventListener("touchcancel", end);
    joy.addEventListener("mousedown", (e) => { const r = joy.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; move(e); const mm = (ev) => move(ev), mu = () => { end(); removeEventListener("mousemove", mm); removeEventListener("mouseup", mu); }; addEventListener("mousemove", mm); addEventListener("mouseup", mu); });
    const btn = (el, down, up) => {
      el.addEventListener("touchstart", (e) => { e.preventDefault(); el.classList.add("on"); down(); }, { passive: false });
      el.addEventListener("touchend", (e) => { e.preventDefault(); el.classList.remove("on"); up && up(); }, { passive: false });
      el.addEventListener("mousedown", () => { el.classList.add("on"); down(); }); el.addEventListener("mouseup", () => { el.classList.remove("on"); up && up(); });
    };
    btn(root.querySelector(".btnA"), () => Input.pressA());
    btn(root.querySelector(".btnB"), () => { this.b = true; Input.pressB(); }, () => { this.b = false; });
    btn(root.querySelector(".hud-menu"), () => { if (!G.busy && !World.moving) UI.menu(); });
  },
  // Les écouteurs ponctuels (dialogues) passent avant le monde
  aListeners: [], bListeners: [],
  pressA() { const l = this.aListeners.pop(); if (l) return l(); if (Game.mode === "world") interact(); },
  pressB() { const l = this.bListeners.pop(); if (l) return l(); },
};

// ------------------------------------------------------------------ Effets sonores (synthèse)
const SFX = {
  ctx: null,
  play(name) {
    try {
      this.ctx = this.ctx || MUSIC._ctx || new (window.AudioContext || window.webkitAudioContext)();
      const c = this.ctx, t = c.currentTime, out = c.destination;
      const T = (f, d, o) => MUSIC.tone(c, out, t + (o?.at || 0), f, d, o);
      switch (name) {
        case "item": T(784, .08, { vol: .12 }); T(1046, .14, { vol: .12, at: .08 }); break;
        case "heal": [523, 659, 784, 1046].forEach((f, i) => T(f, .12, { vol: .1, at: i * .09, type: "triangle" })); break;
        case "light": [880, 1174, 1568].forEach((f, i) => T(f, .2, { vol: .08, at: i * .07, duty: .125 })); break;
        case "alert": T(988, .07, { vol: .14 }); T(1318, .12, { vol: .14, at: .08 }); break;
        case "hit": MUSIC.noise(c, out, t, .12, .25, 600); T(180, .1, { vol: .15, slide: .5 }); break;
        case "super": MUSIC.noise(c, out, t, .2, .3, 400); T(220, .18, { vol: .2, slide: .4 }); break;
        case "faint": T(440, .5, { vol: .15, slide: .25 }); break;
        case "throw": T(600, .3, { vol: .1, slide: 2, type: "triangle" }); break;
        case "click": T(1400, .03, { vol: .12 }); T(900, .04, { vol: .1, at: .04 }); break;
        case "caught": [523, 659, 784, 659, 784, 1046].forEach((f, i) => T(f, .14, { vol: .12, at: i * .11 })); break;
        case "level": [659, 784, 988, 1318].forEach((f, i) => T(f, .1, { vol: .1, at: i * .07, duty: .25 })); break;
        case "tap": T(1200, .025, { vol: .05 }); break;
        case "shiny": [1568, 2093, 2637].forEach((f, i) => T(f, .12, { vol: .07, at: i * .1, duty: .125 })); break;
      }
    } catch (e) { /* son indisponible */ }
  },
};
