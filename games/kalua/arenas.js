/* Les Échoués de Kalua — les trois boss des îles, chacun avec sa propre arène (mode "arena", plus grande qu'une salle) :
 *   · « Au Coin » (Grotte des Tortues) : un, deux, trois… SOLEIL ! Il faut le toucher 4 fois sans se faire voir bouger.
 *   · Dame Plumeau, la Fée du Ménage (Grotte du Phare) : nettoyer l'arène pour qu'elle s'évanouisse, puis la frapper.
 *   · Capitaine Stella et les Étoiles Filantes (Grotte des Étoiles) : un match de foot en 3 buts gagnants.
 * Arena.start(kind) → Promise "win" | "lose". Les boss ont été imaginés par Sixte. */
"use strict";

const Arena = (() => {
  const TAU = Math.PI * 2, TS = 48;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  let A = null; // l'arène en cours
  const av = (o) => Avatar.normalize(Object.assign({}, Avatar.DEFAULT, o));
  const level = () => (Prog.diff === "facile" ? 0 : Prog.diff === "challenge" ? 2 : 1);

  // ================================================================ outils communs
  function drawAv(c, x, y, a, o = {}) {
    c.save(); c.translate(x, y); if (o.alpha !== undefined) c.globalAlpha = o.alpha;
    c.fillStyle = "rgba(0,0,0,.18)"; c.beginPath(); c.ellipse(0, 2, 18 * (o.k || 1), 6 * (o.k || 1), 0, 0, TAU); c.fill();
    c.scale(3.4 * (o.k || 1), 3.4 * (o.k || 1)); c.translate(0, -14);
    Avatar.draw(c, a, { dir: o.dir || "down", walk: o.walk ?? null, swing: o.swing || 0, t: G.t });
    c.restore();
  }
  function label(c, x, y, txt, col = "#5a4040") { c.font = "800 11px ui-rounded, system-ui"; c.textAlign = "center"; const w = c.measureText(txt).width + 12; c.fillStyle = "rgba(255,255,255,.88)"; c.beginPath(); c.roundRect(x - w / 2, y - 10, w, 16, 8); c.fill(); c.fillStyle = col; c.fillText(txt, x, y + 2); }
  function bigText(c, vw, vh, txt, sub, col = "#fff", size = 64) {
    const y = Math.max(vh * .52, (A ? A.top : 100) + 60 + size * .8);
    c.save(); c.textAlign = "center"; c.font = `900 ${size}px ui-rounded, system-ui`; c.lineWidth = 8; c.strokeStyle = "rgba(30,20,30,.6)"; c.strokeText(txt, vw / 2, y); c.fillStyle = col; c.fillText(txt, vw / 2, y);
    if (sub) { c.font = "800 16px ui-rounded, system-ui"; c.lineWidth = 5; c.strokeText(sub, vw / 2, y + 30); c.fillStyle = "#fff"; c.fillText(sub, vw / 2, y + 30); }
    c.restore();
  }
  function topBanner(c, vw, y, txt, bg = "rgba(30,20,40,.72)") { c.font = "900 15px ui-rounded, system-ui"; c.textAlign = "center"; const w = c.measureText(txt).width + 28; c.fillStyle = bg; c.beginPath(); c.roundRect(vw / 2 - w / 2, y, w, 30, 15); c.fill(); c.fillStyle = "#fff"; c.fillText(txt, vw / 2, y + 20); }
  function hurt(n) { if (A.inv > 0) return false; A.inv = 1.4; Music.sfx("hurt"); Game.shake(6, .25); if (Prog.hurt(n)) { finish("lose"); return true; } return false; }
  function camera(vw, vh) {
    const p = Game.player, z = Math.min(1.05, Math.max(.62, Math.min(vw, vh) / 470)) * (A.zoom || 1);
    let cx = p.x, cy = A.K.camY ? A.K.camY(p) : p.y - 30; const hw = vw / z / 2, hh = vh / z / 2;
    cx = A.W <= hw * 2 ? A.W / 2 : clamp(cx, hw, A.W - hw); cy = A.H <= hh * 2 ? A.H / 2 : clamp(cy, hh, A.H - hh);
    A.cam = { x: cx, y: cy, z }; return A.cam;
  }
  function begin(c, vw, vh) { const cam = camera(vw, vh), sh = Game.shakeOffset(); c.setTransform(DPR, 0, 0, DPR, 0, 0); c.fillStyle = "#0c0a10"; c.fillRect(0, 0, vw, vh); c.save(); c.translate(vw / 2 + sh.x, vh / 2 + sh.y); c.scale(cam.z, cam.z); c.translate(-cam.x, -cam.y); }
  function wallsRect(c, col, top) { c.fillStyle = col; c.fillRect(0, 0, A.W, TS); c.fillRect(0, A.H - TS, A.W, TS); c.fillRect(0, 0, TS, A.H); c.fillRect(A.W - TS, 0, TS, A.H); c.fillStyle = top; c.fillRect(TS, TS - 8, A.W - TS * 2, 8); }
  function partnerDraw(items) { for (const o of G.others.values()) { if (o.bot) { items.push({ y: A.botY || A.H - 90, f: (c) => { const q = { x: A.botX || 120, y: A.botY || A.H - 90 }; drawAv(c, q.x, q.y, o.avatar, { dir: "up" }); label(c, q.x, q.y - 90, o.name + " t'encourage !", "#3a8fc0"); } }); continue; } if (o.has && o.zone === "a:" + A.kind) items.push({ y: o.y, f: (c) => Game.drawPartner(c, o) }); } }

  // ================================================================ BOSS 1 — « Au Coin » : un, deux, trois… SOLEIL !
  const COIN_AV = av({ skin: "#f4d0b8", face: "rond", eyes: "grands", eyeColor: "#5a8ad0", brows: "tristes", hair: "petard", hairColor: "#d8803a", top: "salopette", topColor: "#4a7ab0", topColor2: "#ffffff", bottom: "short", bottomColor: "#4a7ab0", shoes: "baskets", shoesColor: "#e05a5a", freckles: 1, mouth: "boude" });
  const COIN = {
    setup() {
      Object.assign(A, { W: 1440, H: 864, zoom: .78, name: "Au Coin", hits: 0, max: 4, phase: "intro", pt: 0, catches: 0, chant: "", look: 0, cnt: 3, items: [], balls: [], ice: [], candy: null, caught: 0, lastP: null, peek: false });
      A.start = { x: A.W / 2, y: A.H - 130 }; A.boss = { x: A.W / 2, y: 175 }; A.corner = { x: 120, y: A.H - 120 }; A.botX = A.W / 2 + 90; A.botY = A.H - 110;
      A.bar = { name: "Au Coin", hp: 4, max: 4, alive: true, bar: false };
    },
    async intro() {
      await Dialog.say({ name: "Au Coin", avatar: COIN_AV, color: "#4a7ab0" }, "Tu viens jouer avec moi ? Personne ne vient jamais… On m'a mis au coin il y a très, très longtemps.");
      await Dialog.say({ name: "Au Coin", avatar: COIN_AV, color: "#4a7ab0" }, "On joue à « un, deux, trois, soleil » ! Quand je compte, tu avances. Quand je me retourne, tu ne bouges PLUS. Si je te vois bouger… AU COIN !");
      await Dialog.say({ name: "Au Coin", avatar: COIN_AV, color: "#4a7ab0" }, "Touche-moi (TAPER) quatre fois, et tu as gagné. Mais je ne me laisse pas faire, hein !");
      Game.toast("Avance quand il compte. Fige-toi quand il se retourne ! Touche-le 4 fois avec TAPER.", 4200);
      this.toCount();
    },
    camY: (p) => p.y - 80,
    toCount() { A.phase = "count"; A.pt = 0; A.cnt = 3; A.chant = ""; A.peek = false; Music.sfx("switch", .5); },
    toGo() { A.phase = "go"; A.pt = 0; const k = 1 - A.hits * .12; A.goT = rnd(1.6, 4.4) * k; A.chantSpeed = rnd(.8, 1.25); A.fake = A.hits >= 2 && Math.random() < .35; A.fakeAt = A.goT * rnd(.3, .6);
      if (A.hits >= 1) for (let i = 0; i < A.hits; i++) if (Math.random() < .7) this.ball(); },
    toWatch(peek) { A.phase = "watch"; A.pt = 0; A.peek = peek; A.watchT = peek ? .9 : rnd(1.8, 2.8) + A.hits * .35; A.lastP = { x: Game.player.x, y: Game.player.y }; Music.sfx("trap", .6);
      if (!peek && Math.random() < .55 + A.hits * .1) this.tempt(); },
    ball() { const fromL = Math.random() < .5, y = rnd(A.boss.y + 160, A.start.y - 40); A.balls.push({ x: fromL ? 60 : A.W - 60, y, vx: (fromL ? 1 : -1) * rnd(260, 360) * (1 + A.hits * .15), r: 22, col: ["#ff7a7a", "#7ac0ff", "#ffd23a", "#9ae07a"][Math.floor(Math.random() * 4)] }); },
    tempt() { // un bonbon apparaît juste à côté… il faudrait bouger pour l'attraper
      const p = Game.player, a = rnd(0, TAU); A.candy = { x: clamp(p.x + Math.cos(a) * rnd(80, 130), 80, A.W - 80), y: clamp(p.y + Math.sin(a) * rnd(60, 100), A.boss.y + 120, A.H - 80), until: 0, kind: Math.random() < .5 ? "🍬" : "🍭" };
      Game.toast(["Oh ! Un bonbon… juste là, à côté de toi.", "Psst… il ne regarde pas vraiment, si ? (Si.)", "Une sucette ! Elle sent bon la fraise…"][Math.floor(Math.random() * 3)], 1800);
    },
    caught(who = Game.player) {
      A.catches++; const lose = A.catches; Music.sfx("boom", .6); Game.shake(8, .3);
      A.shout = { txt: "AU COIN !", t: 1.4 }; A.cornerT = 2.2;
      const p = Game.player; p.x = A.corner.x; p.y = A.corner.y; p.kx = p.ky = 0; p.dir = "up";
      Game.toast(`😖 Il t'a vu bouger ! Au coin… (−${lose} ❤)`, 2200);
      A.inv = 0; if (hurt(lose)) return;
      A.phase = "corner"; A.pt = 0;
    },
    update(dt) {
      const p = Game.player; A.pt += dt;
      // bonbon : il reste un peu après le « 3, 2, 1 » pour qui a été patient
      if (A.candy) { if (A.candy.until && A.time > A.candy.until) A.candy = null; else if (A.phase === "go" && Math.hypot(p.x - A.candy.x, p.y - A.candy.y) < 34) { Prog.heal(1); Music.sfx("pickup"); Game.toast("🍬 Patience récompensée : +1 ❤", 1500); A.candy = null; } }
      // balles qui roulent
      for (const b of A.balls) { b.x += b.vx * dt; if (Math.hypot(p.x - b.x, p.y - 12 - b.y) < b.r + 16 && !b.hitP) { b.hitP = true; p.kx = Math.sign(b.vx) * 420; p.ky = 0; Music.sfx("hit", .6); if (A.phase === "watch") { A.knocked = true; } else Game.toast("Bong ! Une balle t'a bousculé.", 1200); } }
      A.balls = A.balls.filter((b) => b.x > -60 && b.x < A.W + 60);
      if (A.phase === "count") { A.cnt = 3 - Math.floor(A.pt); if (A.pt >= 3) { this.toGo(); Music.sfx("light", .5); } }
      else if (A.phase === "go") {
        const k = clamp(A.pt / A.goT, 0, 1), words = ["Un…", "Un… deux…", "Un… deux… trois…"]; A.chant = A.pt / A.goT < .92 ? words[Math.min(2, Math.floor(k * 3.2))] : "SOLEIL !";
        if (A.fake && A.pt >= A.fakeAt) { A.fake = false; A.chant = "… sol… ŒIL !"; this.toWatch(true); return; }
        if (A.pt >= A.goT + .25) this.toWatch(false);
      } else if (A.phase === "watch") {
        // on bouge ? (après une petite grâce de 0,15 s)
        const moved = Math.hypot(p.x - A.lastP.x, p.y - A.lastP.y) > .6 || A.knocked;
        A.lastP = { x: p.x, y: p.y };
        if (A.pt > .15 && moved) { A.knocked = false; this.caught(); return; }
        A.knocked = false;
        if (A.pt >= A.watchT) { if (A.candy) A.candy.until = A.time + 3 + 2.4; if (A.peek) { A.phase = "go"; A.pt = A.goT * .5; A.peek = false; A.chant = "Hé hé…"; } else this.toCount(); }
      } else if (A.phase === "corner") {
        if (A.pt >= 2.2) { p.x = A.start.x; p.y = A.start.y; p.dir = "up"; this.toCount(); Game.toast("Tu recommences du début.", 1400); }
      } else if (A.phase === "hit") {
        if (A.pt >= 2) { p.x = A.start.x; p.y = A.start.y; p.dir = "up"; if (A.hits >= A.max) { finish("win"); return; } this.toCount(); }
      }
      if (A.shout) { A.shout.t -= dt; if (A.shout.t <= 0) A.shout = null; }
    },
    move(x, y, nx, ny) {
      if (A.phase === "count" || A.phase === "corner" || A.phase === "hit" || A.phase === "intro") return { x, y };
      return { x: clamp(nx, 70, A.W - 70), y: clamp(ny, A.boss.y + 70, A.H - 60) };
    },
    action(a) {
      const p = Game.player;
      if (a === "hit") {
        if (A.phase === "watch" && A.pt > .15) { this.caught(); return; }
        if (A.phase === "go" && Math.hypot(p.x - A.boss.x, p.y - A.boss.y) < 90) {
          A.hits++; A.bar.hp = A.max - A.hits; Music.sfx("hit"); Music.jingle("item"); Game.shake(6, .3);
          A.shout = { txt: ["Aïe ! Touché !", "Encore ?!", "Pas juste !", "…Tu m'as eu."][A.hits - 1], t: 1.6 }; A.phase = "hit"; A.pt = 0; A.balls = []; A.candy = null;
          if (A.hits === 1) Game.toast("Touché ! Il va compter plus vite… et des balles vont rouler.", 2600);
          if (A.hits === 2) Game.toast("Attention : il peut maintenant jeter un œil en douce !", 2600);
          if (A.hits === 3) Game.toast("Dernière touche ! Il ne va rien laisser passer.", 2400);
        }
      }
    },
    draw(c) {
      // sol : sable doré de la Grotte des Tortues, mosaïque de carapaces
      c.fillStyle = "#e8d8a8"; c.fillRect(0, 0, A.W, A.H);
      for (let y = TS; y < A.H - TS; y += TS) for (let x = TS; x < A.W - TS; x += TS) if ((x / TS + y / TS) % 2) { c.fillStyle = "#e0cf9c"; c.fillRect(x, y, TS, TS); }
      c.strokeStyle = "rgba(120,100,60,.18)"; c.lineWidth = 2; for (let i = 0; i < 18; i++) { const x = 140 + (i * 197) % (A.W - 280), y = 330 + (i * 131) % (A.H - 520); c.beginPath(); for (let k = 0; k < 6; k++) c.lineTo(x + Math.cos(k / 6 * TAU) * 26, y + Math.sin(k / 6 * TAU) * 18); c.closePath(); c.stroke(); }
      wallsRect(c, "#5a7a4a", "#a8d090");
      // la ligne de départ et le coin des punis
      c.strokeStyle = "rgba(255,255,255,.85)"; c.setLineDash([16, 12]); c.lineWidth = 5; c.beginPath(); c.moveTo(TS + 20, A.start.y + 30); c.lineTo(A.W - TS - 20, A.start.y + 30); c.stroke(); c.setLineDash([]);
      c.fillStyle = "rgba(120,60,60,.25)"; c.beginPath(); c.moveTo(TS, A.H - TS); c.lineTo(TS + 150, A.H - TS); c.lineTo(TS, A.H - TS - 150); c.fill(); label(c, A.corner.x + 10, A.H - TS - 160, "Le coin des punis", "#8a3a3a");
      // le coin du mur (là où il compte)
      const bx = A.boss.x, by = A.boss.y;
      c.fillStyle = "#4a6a3a"; c.fillRect(bx - 70, TS, 140, 70); c.fillStyle = "#6a8a5a"; c.beginPath(); c.moveTo(bx - 70, TS + 70); c.lineTo(bx, TS + 120); c.lineTo(bx + 70, TS + 70); c.lineTo(bx + 70, TS); c.lineTo(bx - 70, TS); c.fill();
      c.strokeStyle = "rgba(0,0,0,.25)"; c.beginPath(); c.moveTo(bx, TS); c.lineTo(bx, TS + 120); c.stroke();
      for (let i = 0; i < 4; i++) { c.fillStyle = "rgba(255,255,255,.5)"; c.font = "700 13px ui-rounded, system-ui"; c.fillText(["1", "2", "3", "☀"][i], bx - 50 + i * 30, TS + 30 + (i % 2) * 14); }
      // la glace qui fait glisser
      const items = [];
      // les balles
      for (const b of A.balls) items.push({ y: b.y, f: () => { c.fillStyle = "rgba(0,0,0,.2)"; c.beginPath(); c.ellipse(b.x, b.y + 16, b.r, 6, 0, 0, TAU); c.fill(); c.fillStyle = b.col; c.beginPath(); c.arc(b.x, b.y - 6, b.r, 0, TAU); c.fill(); c.strokeStyle = "#fff"; c.lineWidth = 3; c.beginPath(); c.arc(b.x, b.y - 6, b.r * .6, A.time * 8 * Math.sign(b.vx), A.time * 8 * Math.sign(b.vx) + 2); c.stroke(); } });
      if (A.candy) items.push({ y: A.candy.y, f: () => { c.font = "30px system-ui"; c.textAlign = "center"; c.fillText(A.candy.kind, A.candy.x, A.candy.y - 6 + Math.sin(A.time * 5) * 3); c.fillStyle = "rgba(255,240,160,.35)"; c.beginPath(); c.arc(A.candy.x, A.candy.y - 14, 22 + Math.sin(A.time * 6) * 4, 0, TAU); c.fill(); } });
      // le garçon
      const facing = A.phase === "watch" || A.phase === "hit" || A.phase === "intro";
      items.push({ y: by, f: () => {
        c.save(); c.globalAlpha = .92; const glow = c.createRadialGradient(bx, by - 50, 10, bx, by - 50, 110); glow.addColorStop(0, "rgba(200,230,255,.35)"); glow.addColorStop(1, "rgba(200,230,255,0)"); c.fillStyle = glow; c.fillRect(bx - 110, by - 160, 220, 220); c.restore();
        drawAv(c, bx, by, COIN_AV, { dir: facing ? (A.peek ? "left" : "down") : "up", k: 1.35, swing: A.phase === "hit" ? Math.abs(Math.sin(A.pt * 8)) : 0 });
        // bonnet d'âne
        c.save(); c.translate(bx, by - 128); c.rotate(Math.sin(A.time * 2) * .05); c.fillStyle = "#f4ecdc"; c.beginPath(); c.moveTo(-20, 8); c.lineTo(0, -48); c.lineTo(20, 8); c.closePath(); c.fill(); c.strokeStyle = "#8a6a4a"; c.lineWidth = 2; c.stroke(); c.fillStyle = "#e05a5a"; c.font = "900 10px ui-rounded, system-ui"; c.textAlign = "center"; c.fillText("ÂNE", 0, -6); c.restore();
        if (A.chant && A.phase === "go") { c.font = "900 18px ui-rounded, system-ui"; c.textAlign = "center"; c.fillStyle = "#fff"; c.strokeStyle = "rgba(40,40,60,.6)"; c.lineWidth = 5; c.strokeText(A.chant, bx, by - 190); c.fillText(A.chant, bx, by - 190); }
      } });
      items.push({ y: Game.player.y, f: () => Game.drawPlayer(c) });
      partnerDraw(items);
      items.sort((a, b) => a.y - b.y); for (const it of items) it.f(c);
    },
    hud(c, vw, vh) {
      const top = A.top;
      const st = { count: "🙈 Il compte… tu ne bouges pas encore", go: "🏃 AVANCE !", watch: A.peek ? "👀 IL JETTE UN ŒIL — NE BOUGE PAS !" : "☀️ IL REGARDE — NE BOUGE PLUS !", corner: "😖 Au coin…", hit: "⭐ Touché !", intro: "" }[A.phase];
      if (st) topBanner(c, vw, top, st, A.phase === "watch" ? "rgba(200,40,60,.85)" : A.phase === "go" ? "rgba(40,150,80,.8)" : "rgba(30,20,40,.72)");
      // médaillon : on voit toujours si Au Coin regarde le mur… ou toi
      if (A.phase !== "intro") { const facing = A.phase === "watch" || A.phase === "hit", mx = vw / 2, my = top - 34 + 2;
        c.save(); c.beginPath(); c.arc(mx, my, 27, 0, TAU); c.fillStyle = facing ? "#ffd0d6" : "#d8ecd0"; c.fill(); c.lineWidth = 3; c.strokeStyle = facing ? "#e0303a" : "#3a9a5a"; c.stroke(); c.clip();
        c.translate(mx, my + 34); c.scale(3.2, 3.2); c.translate(0, -14); Avatar.draw(c, COIN_AV, { dir: facing ? (A.peek ? "left" : "down") : "up", t: G.t }); c.restore(); }
      c.font = "800 12px ui-rounded, system-ui"; c.textAlign = "center"; c.fillStyle = "#fff"; c.fillText(`Au Coin · touché ${A.hits}/4 · fois au coin : ${A.catches} (la prochaine fois : −${A.catches + 1} ❤)`, vw / 2, top + 46);
      if (A.phase === "count") bigText(c, vw, vh, String(Math.max(1, A.cnt)), "Il se retourne vers le mur…", "#ffd23a", 90);
      if (A.shout) bigText(c, vw, vh, A.shout.txt, null, A.shout.txt === "AU COIN !" ? "#ff5a6a" : "#ffe08a", 58);
      if (A.phase === "watch") { c.fillStyle = `rgba(255,40,60,${.08 + .06 * Math.sin(A.time * 10)})`; c.fillRect(0, 0, vw, vh); }
    },
  };

  // ================================================================ BOSS 2 — Dame Plumeau, la Fée du Ménage
  const PLUMEAU_AV = av({ skin: "#fbe0d0", face: "coeur", eyes: "amande", lashes: "longs", brows: "arques", hair: "chignon", hairColor: "#e090c0", top: "robe", topColor: "#a8d8f0", topColor2: "#ffffff", pattern: "vichy", bottom: "jupe", bottomColor: "#ffffff", shoes: "ballerines", hat: "noeud", hatColor: "#ff8ab0", wings: "fee", lips: "#e05a8a", earrings: "perles" });
  const MEN = {
    setup() {
      const cw = 24, ch = 16;
      Object.assign(A, { W: cw * TS, H: ch * TS, name: "Dame Plumeau", hits: 0, max: 4, cw, ch, dirt: new Float32Array(cw * ch), bunnies: [], socks: [], clouds: [], soap: [], laundry: [], carry: false, phase: "fight", pt: 0, atkT: 4, spawnT: 5, stunT: 0 });
      A.basket = { x: TS * 2.2, y: A.H - TS * 2 }; A.boss = { x: A.W / 2, y: A.H / 2 - 60, tx: A.W / 2, ty: A.H / 2 - 60, z: 0 }; A.botX = A.W - 110; A.botY = A.H - 100;
      A.bar = { name: "Dame Plumeau", hp: 4, max: 4, alive: true, guard: true, bar: false };
      for (let i = 0; i < A.dirt.length; i++) A.dirt[i] = Math.random() < .35 ? rnd(.4, 1) : 0;
      this.newLaundry(3);
    },
    async intro() {
      const sp = { name: "Dame Plumeau", avatar: PLUMEAU_AV, color: "#c05a8a" };
      await Dialog.say(sp, "Qui ose entrer dans MON phare avec des chaussures pleines de sable ? Sept cents ans que je fais le ménage ici. Sept. Cents. Ans.");
      await Dialog.say(sp, "Et vous savez quoi ? J'ADORE le désordre. Le ménage, c'est pour les autres. Moi, je salis. Tchic-tchic, coup de plumeau !");
      await Dialog.say(sp, "Je ne crains qu'une chose… la propreté. Mais vous n'oserez jamais. Hihihi !");
      Game.toast("TAPER balaie la poussière. RAMASSER prend le linge : porte-le au panier. Quand tout est propre, elle s'évanouit : frappe-la !", 5200);
    },
    idx: (x, y) => y * A.cw + x,
    cleanliness() { let s = 0, n = 0; for (let y = 1; y < A.ch - 1; y++) for (let x = 1; x < A.cw - 1; x++) { s += A.dirt[y * A.cw + x]; n++; } return 1 - s / n; },
    dirtyAt(px, py, r, amt) { for (let y = 1; y < A.ch - 1; y++) for (let x = 1; x < A.cw - 1; x++) { const d = Math.hypot((x + .5) * TS - px, (y + .5) * TS - py); if (d < r) A.dirt[y * A.cw + x] = Math.min(1, A.dirt[y * A.cw + x] + amt * (1 - d / r * .5)); } },
    newLaundry(n) { for (let i = 0; i < n; i++) A.laundry.push({ x: rnd(TS * 2, A.W - TS * 2), y: rnd(TS * 3, A.H - TS * 2), kind: ["👕", "🧦", "👖", "👗"][Math.floor(Math.random() * 4)] }); },
    update(dt) {
      const p = Game.player, B = A.boss, lv = level(), angry = A.hits;
      A.pt += dt;
      if (A.stunT > 0) { A.stunT -= dt; B.z = Math.max(0, B.z - dt * 80); if (A.stunT <= 0) { A.bar.guard = true; this.wake(false); } }
      else {
        // elle vole partout
        if (Math.hypot(B.x - B.tx, B.y - B.ty) < 20) { B.tx = rnd(TS * 3, A.W - TS * 3); B.ty = rnd(TS * 3, A.H - TS * 4); }
        const sp = 90 + angry * 25; const a = Math.atan2(B.ty - B.y, B.tx - B.x); B.x += Math.cos(a) * sp * dt; B.y += Math.sin(a) * sp * dt; B.z = 30 + Math.sin(A.time * 2) * 8;
        A.atkT -= dt;
        if (A.atkT <= 0) { A.atkT = rnd(2.4, 3.4) - angry * .3 - lv * .2; const r = Math.random();
          if (r < .45) { A.clouds.push({ x: clamp(p.x + rnd(-60, 60), TS * 2, A.W - TS * 2), y: clamp(p.y + rnd(-40, 40), TS * 2, A.H - TS * 2), t: 0, tell: .9 - lv * .1 }); Music.sfx("wind", .5); }
          else if (r < .8 || angry < 2) { const n = 2 + angry; for (let i = 0; i < n; i++) { const aa = Math.atan2(p.y - B.y, p.x - B.x) + (i - (n - 1) / 2) * .22; A.socks.push({ x: B.x, y: B.y - 40, vx: Math.cos(aa) * 250, vy: Math.sin(aa) * 250, t: 0 }); } Music.sfx("swing", .6); }
          else { A.soap.push({ x: clamp(p.x, TS * 3, A.W - TS * 3), y: clamp(p.y, TS * 3, A.H - TS * 3), r: 110, t: 7 }); Game.toast("🫧 Une flaque de savon ! Ça glisse…", 1400); Music.sfx("water", .6); }
        }
        // elle salit en passant
        this.dirtyAt(B.x, B.y + 30, 70, dt * (.25 + angry * .1));
      }
      // nuages de poussière (zone annoncée au sol)
      for (const cl of A.clouds) { cl.t += dt; if (cl.t >= cl.tell && !cl.done) { cl.done = true; this.dirtyAt(cl.x, cl.y, 130, .8); Game.shake(4, .2); if (Math.hypot(p.x - cl.x, (p.y - cl.y) * 1.4) < 95 && p.roll <= 0) { hurt(1); const a = Math.atan2(p.y - cl.y, p.x - cl.x); p.kx = Math.cos(a) * 300; p.ky = Math.sin(a) * 300; } } }
      A.clouds = A.clouds.filter((c) => c.t < c.tell + .5);
      // chaussettes
      for (const s of A.socks) { s.t += dt; s.x += s.vx * dt; s.y += s.vy * dt; if (Math.hypot(p.x - s.x, p.y - 20 - s.y) < 22 && p.roll <= 0) { s.t = 99; hurt(1); } }
      A.socks = A.socks.filter((s) => s.t < 4 && s.x > 0 && s.x < A.W && s.y > 0 && s.y < A.H);
      // savon : ça glisse
      for (const s of A.soap) s.t -= dt; A.soap = A.soap.filter((s) => s.t > 0);
      if (A.soap.some((s) => Math.hypot(p.x - s.x, p.y - s.y) < s.r) && A.lastV) { p.kx = A.lastV.x * .9; p.ky = A.lastV.y * .9; }
      // moutons de poussière
      A.spawnT -= dt;
      if (A.spawnT <= 0 && A.stunT <= 0) { A.spawnT = 2.6 - angry * .3; if (A.bunnies.length < 2 + angry * 2) { let best = -1, bv = .85; for (let i = 0; i < A.dirt.length; i++) if (A.dirt[i] > bv && Math.random() < .2) { best = i; bv = A.dirt[i]; } if (best >= 0) A.bunnies.push({ x: (best % A.cw + .5) * TS, y: (Math.floor(best / A.cw) + .5) * TS, hp: 1, t: 0 }); } }
      for (const b of A.bunnies) { b.t += dt; const a = Math.atan2(p.y - b.y, p.x - b.x), sp = 55 + angry * 12; b.x += Math.cos(a) * sp * dt; b.y += Math.sin(a) * sp * dt; if (b.t > 1 && Math.hypot(p.x - b.x, p.y - b.y) < 24 && p.roll <= 0) { hurt(1); b.x -= Math.cos(a) * 60; b.y -= Math.sin(a) * 60; } }
      // le linge
      if (A.carry && Math.hypot(p.x - A.basket.x, p.y - A.basket.y) < 70) { A.carry = false; Music.sfx("pickup"); Game.toast(`🧺 Linge rangé ! (${A.laundry.length ? "encore " + A.laundry.length : "tout est rangé"})`, 1400); }
      // tout est propre ? elle s'évanouit
      A.clean = this.cleanliness();
      if (A.stunT <= 0 && A.clean >= .85 && !A.laundry.length && !A.carry) { A.stunT = 5.5 - lv * .5; A.bar.guard = false; A.bunnies = []; A.socks = []; Music.jingle("secret"); Game.toast("✨ Tout brille ! Dame Plumeau s'évanouit de dégoût… FRAPPE-LA !", 2600); }
      A.lastV = { x: (p.x - (A.prevX ?? p.x)) / Math.max(dt, .001), y: (p.y - (A.prevY ?? p.y)) / Math.max(dt, .001) }; A.prevX = p.x; A.prevY = p.y;
    },
    wake(hit) {
      const sp = { name: "Dame Plumeau", avatar: PLUMEAU_AV, color: "#c05a8a" };
      A.stunT = 0; A.bar.guard = true; A.boss.z = 30;
      for (let i = 0; i < A.dirt.length; i++) if (Math.random() < .45 + A.hits * .05) A.dirt[i] = Math.min(1, A.dirt[i] + rnd(.4, 1));
      this.newLaundry(3 + A.hits);
      if (hit) Game.toast(["« Mon beau désordre ! » Elle resalit tout, encore plus vite.", "« Des moutons ! Mes jolis moutons ! Attaquez ! »", "« Mes chaussettes ! Toutes mes chaussettes ! »"][Math.min(2, A.hits - 1)], 2600);
      else Game.toast("Elle se réveille et resalit tout ! Recommence le ménage.", 2200);
      void sp;
    },
    move(x, y, nx, ny) { const sp = A.carry ? .85 : 1; return { x: clamp(x + (nx - x) * sp, TS + 16, A.W - TS - 16), y: clamp(y + (ny - y) * sp, TS + 30, A.H - TS - 6) }; },
    action(a) {
      const p = Game.player, f = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[p.dir] || [0, 1];
      if (a === "hit") {
        const fx = p.x + f[0] * 44, fy = p.y - 10 + f[1] * 40;
        // frapper la fée évanouie
        if (A.stunT > 0 && Math.hypot(fx - A.boss.x, fy - A.boss.y) < 80) {
          A.hits++; A.bar.hp = A.max - A.hits; Music.sfx("hit"); Game.shake(8, .35); Music.jingle("item");
          if (A.hits >= A.max) { finish("win"); return; }
          this.wake(true); return;
        }
        // un mouton de poussière ?
        for (const b of A.bunnies) if (Math.hypot(fx - b.x, fy - b.y) < 46) { b.hp = 0; Music.sfx("kill", .5); }
        A.bunnies = A.bunnies.filter((b) => b.hp > 0);
        // balayer : 3 × 2 cases devant soi
        const cx = Math.floor(fx / TS), cy = Math.floor(fy / TS); let cleaned = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (Math.abs(f[0] ? dy : dx) > 1) continue; const x = cx + dx, y = cy + dy; if (x < 1 || y < 1 || x >= A.cw - 1 || y >= A.ch - 1) continue; const i = y * A.cw + x; if (A.dirt[i] > 0) { cleaned += A.dirt[i]; A.dirt[i] = Math.max(0, A.dirt[i] - .7); } }
        if (cleaned > .05) { Music.sfx("leaf", .4); A.puffs = (A.puffs || []).concat([{ x: fx, y: fy, t: 0 }]); }
      }
      if (a === "grab") {
        if (A.carry) { Game.toast("Porte le linge jusqu'au panier 🧺, en bas à gauche.", 1600); return; }
        const i = A.laundry.findIndex((l) => Math.hypot(p.x - l.x, p.y - l.y) < 60);
        if (i >= 0) { A.carry = A.laundry[i].kind; A.laundry.splice(i, 1); Music.sfx("pickup"); Game.toast("Tu portes le linge. Vite, au panier 🧺 !", 1400); }
      }
    },
    draw(c) {
      // parquet du phare
      c.fillStyle = "#c8a47a"; c.fillRect(0, 0, A.W, A.H);
      for (let y = TS; y < A.H - TS; y += 24) { c.fillStyle = (y / 24) % 2 ? "#c09a70" : "#caa67c"; c.fillRect(TS, y, A.W - TS * 2, 23); for (let x = TS + ((y / 24) % 3) * 60; x < A.W - TS; x += 180) { c.fillStyle = "rgba(90,60,30,.25)"; c.fillRect(x, y, 2, 23); } }
      // la poussière
      for (let y = 1; y < A.ch - 1; y++) for (let x = 1; x < A.cw - 1; x++) { const d = A.dirt[y * A.cw + x]; if (d <= .02) continue; c.fillStyle = `rgba(110,95,80,${d * .75})`; c.fillRect(x * TS, y * TS, TS, TS); if (d > .5) { c.fillStyle = `rgba(80,70,60,${d * .5})`; for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(x * TS + 10 + ((x * 7 + k * 13) % 28), y * TS + 12 + ((y * 5 + k * 11) % 24), 3 + k, 0, TAU); c.fill(); } } }
      // flaques de savon
      for (const s of A.soap) { c.fillStyle = `rgba(200,235,255,${Math.min(.55, s.t * .2)})`; c.beginPath(); c.ellipse(s.x, s.y, s.r, s.r * .6, 0, 0, TAU); c.fill(); c.fillStyle = "rgba(255,255,255,.6)"; for (let k = 0; k < 6; k++) { c.beginPath(); c.arc(s.x + Math.cos(k * 1.1 + A.time) * s.r * .6, s.y + Math.sin(k * 1.7 + A.time) * s.r * .35, 4 + k % 3, 0, TAU); c.fill(); } }
      wallsRect(c, "#5a5a66", "#c0c0cc");
      // fenêtres, étagères en désordre (décor)
      for (let i = 0; i < 5; i++) { const x = 140 + i * 220; c.fillStyle = "#8a6a4a"; c.fillRect(x, 6, 120, 34); c.fillStyle = "#9fd8f4"; c.fillRect(x + 8, 10, 46, 26); c.fillRect(x + 66, 10, 46, 26); }
      // panier à linge
      const bk = A.basket; c.fillStyle = "#b08a5a"; c.beginPath(); c.ellipse(bk.x, bk.y, 44, 16, 0, 0, TAU); c.fill(); c.fillStyle = "#c8a070"; c.fillRect(bk.x - 40, bk.y - 46, 80, 46); c.strokeStyle = "#8a6a3a"; c.lineWidth = 2; for (let k = 0; k < 6; k++) { c.beginPath(); c.moveTo(bk.x - 40 + k * 16, bk.y - 46); c.lineTo(bk.x - 40 + k * 16, bk.y); c.stroke(); } label(c, bk.x, bk.y - 60, "🧺 Panier à linge", "#8a5a3a");
      // nuages annoncés
      for (const cl of A.clouds) { if (cl.t < cl.tell) { c.strokeStyle = "rgba(120,90,60,.9)"; c.lineWidth = 3; c.setLineDash([10, 8]); c.beginPath(); c.ellipse(cl.x, cl.y, 110, 66, 0, 0, TAU); c.stroke(); c.setLineDash([]); c.fillStyle = `rgba(120,90,60,${cl.t / cl.tell * .3})`; c.fill(); } else { const k = (cl.t - cl.tell) / .5; c.fillStyle = `rgba(160,140,120,${.7 * (1 - k)})`; for (let i = 0; i < 8; i++) { c.beginPath(); c.arc(cl.x + Math.cos(i) * 80 * k, cl.y + Math.sin(i) * 50 * k, 30, 0, TAU); c.fill(); } } }
      const items = [];
      for (const l of A.laundry) items.push({ y: l.y, f: () => { c.font = "30px system-ui"; c.textAlign = "center"; c.fillText(l.kind, l.x, l.y); } });
      for (const b of A.bunnies) items.push({ y: b.y, f: () => { c.fillStyle = "#8a8078"; for (let k = 0; k < 7; k++) { c.beginPath(); c.arc(b.x + Math.cos(k * .9 + b.t * 3) * 12, b.y - 14 + Math.sin(k * .9 + b.t * 3) * 9, 10, 0, TAU); c.fill(); } c.fillStyle = "#fff"; c.beginPath(); c.arc(b.x - 6, b.y - 18, 4, 0, TAU); c.arc(b.x + 6, b.y - 18, 4, 0, TAU); c.fill(); c.fillStyle = "#222"; c.beginPath(); c.arc(b.x - 6, b.y - 17, 2, 0, TAU); c.arc(b.x + 6, b.y - 17, 2, 0, TAU); c.fill(); } });
      for (const s of A.socks) items.push({ y: s.y + 20, f: () => { c.save(); c.translate(s.x, s.y); c.rotate(s.t * 9); c.font = "22px system-ui"; c.textAlign = "center"; c.fillText("🧦", 0, 8); c.restore(); } });
      for (const pf of (A.puffs = (A.puffs || []).filter((q) => (q.t += 1 / 60) < .4))) items.push({ y: pf.y, f: () => { c.fillStyle = `rgba(230,220,200,${.6 - pf.t})`; c.beginPath(); c.arc(pf.x, pf.y - pf.t * 40, 18 + pf.t * 40, 0, TAU); c.fill(); } });
      const B = A.boss;
      items.push({ y: B.y, f: () => {
        if (A.stunT > 0) { c.save(); c.translate(B.x, B.y); for (let k = 0; k < 3; k++) { c.font = "16px system-ui"; c.textAlign = "center"; c.fillText("💫", Math.cos(A.time * 4 + k * 2) * 30, -150 + Math.sin(A.time * 4 + k * 2) * 8); } c.restore(); }
        else { c.fillStyle = "rgba(0,0,0,.15)"; c.beginPath(); c.ellipse(B.x, B.y + 2, 30, 9, 0, 0, TAU); c.fill(); }
        c.save(); c.translate(0, -B.z); drawAv(c, B.x, B.y, PLUMEAU_AV, { dir: A.stunT > 0 ? "down" : Game.player.x < B.x ? "left" : "right", k: 1.4, alpha: A.inv > .6 ? .7 : 1 });
        // le grand plumeau
        c.save(); c.translate(B.x + 34, B.y - 70); c.rotate(-.5 + Math.sin(A.time * 6) * (A.stunT > 0 ? 0 : .5)); c.fillStyle = "#8a5a3a"; c.fillRect(-3, 0, 6, 60); for (let k = 0; k < 9; k++) { c.fillStyle = ["#ff8ab0", "#ffd23a", "#8ad0ff"][k % 3]; c.beginPath(); c.ellipse(Math.cos(k) * 10, -10 + Math.sin(k) * 8, 12, 6, k, 0, TAU); c.fill(); } c.restore();
        c.restore();
      } });
      items.push({ y: Game.player.y, f: () => { Game.drawPlayer(c); if (A.carry) { c.font = "28px system-ui"; c.textAlign = "center"; c.fillText(A.carry, Game.player.x, Game.player.y - 110); } } });
      partnerDraw(items);
      items.sort((a, b) => a.y - b.y); for (const it of items) it.f(c);
    },
    hud(c, vw, vh) {
      const top = A.top, w = Math.min(260, vw * .5), x = vw / 2 - w / 2, k = clamp(((A.clean || 0) - .5) / .35, 0, 1);
      c.fillStyle = "rgba(30,20,40,.72)"; c.beginPath(); c.roundRect(x - 10, top, w + 20, 40, 14); c.fill();
      c.fillStyle = "#fff"; c.font = "800 12px ui-rounded, system-ui"; c.textAlign = "center"; c.fillText(`✨ Propreté ${Math.round((A.clean || 0) * 100)} % / 85 %   ·   🧺 Linge par terre : ${A.laundry.length + (A.carry ? 1 : 0)}`, vw / 2, top + 15);
      c.fillStyle = "#3a2a3a"; c.fillRect(x, top + 23, w, 9); c.fillStyle = k >= 1 ? "#7ae07a" : "#8ad0ff"; c.fillRect(x, top + 23, w * k, 9);
      c.fillStyle = "#fff"; c.font = "800 11px ui-rounded, system-ui"; c.fillText(`Dame Plumeau · frappée ${A.hits}/4`, vw / 2, top + 54);
      if (A.stunT > 0) topBanner(c, vw, top + 62, "💫 Elle est évanouie : FRAPPE-LA !", "rgba(200,60,120,.85)");
    },
  };

  // ================================================================ BOSS 3 — Capitaine Stella et les Étoiles Filantes : match de foot, 3 buts gagnants
  const JERSEY_US = { top: "maillot", topColor: "#3a7ad0", topColor2: "#ffffff", pattern: "uni", bottom: "short", bottomColor: "#ffffff", shoes: "baskets", shoesColor: "#ffd23a" };
  const JERSEY_THEM = { top: "maillot", topColor: "#ff6aa0", topColor2: "#ffd23a", pattern: "etoiles", bottom: "short", bottomColor: "#2a2a4a", shoes: "baskets", shoesColor: "#ffffff" };
  const STELLA_AV = av(Object.assign({ skin: "#c98d63", face: "ovale", eyes: "etoiles", eyeColor: "#ffd23a", brows: "fronces", hair: "queue", hairColor: "#1a1418", streak: "#ffd23a", earrings: "etoiles", glitter: "etoiles" }, JERSEY_THEM, { topColor: "#ffd23a", topColor2: "#ff6aa0" }));
  const FOOT = {
    setup() {
      Object.assign(A, { W: 32 * TS, H: 20 * TS, name: "Capitaine Stella", score: [0, 0], phase: "kick", pt: 0, ents: [], ball: { x: 0, y: 0, vx: 0, vy: 0, z: 0, vz: 0, owner: null, cool: 0, last: null }, zoom: .92 });
      A.goalY0 = A.H / 2 - 110; A.goalY1 = A.H / 2 + 110; A.bar = { name: "Capitaine Stella · Les Étoiles Filantes", hp: 3, max: 3, alive: true, bar: false };
      const partner = [...G.others.values()][0], mate = partner && partner.avatar ? partner.avatar : av({ hair: "carre", hairColor: "#5a3a2a" });
      const mk = (o) => Object.assign({ x: 0, y: 0, vx: 0, vy: 0, dir: "down", walk: 0, cool: 0, tackle: 0, stun: 0, spd: 150 }, o);
      A.me = mk({ team: 0, role: "me", name: me.name, player: true });
      A.ents = [A.me,
        mk({ team: 0, role: "att", name: partner ? partner.name : "Lou", av: av(Object.assign({}, mate, JERSEY_US)), spd: 140 }),
        mk({ team: 0, role: "def", name: "Pipa", av: av(Object.assign({}, NPC.get("pipa").avatar, JERSEY_US, { hat: "aucun" })), spd: 135 }),
        mk({ team: 0, role: "gk", name: "Brann", av: av(Object.assign({}, NPC.get("brann").avatar, JERSEY_US, { topColor: "#2a9a5a" })), spd: 130 }),
        mk({ team: 1, role: "cap", name: "Stella", av: STELLA_AV, spd: 150 + level() * 10, captain: true }),
        mk({ team: 1, role: "att", name: "Luna", av: av(Object.assign({ skin: "#f4d0b8", hair: "carre", hairColor: "#c0c0d8", eyes: "brillants" }, JERSEY_THEM)), spd: 135 + level() * 8 }),
        mk({ team: 1, role: "def", name: "Comète", av: av(Object.assign({ skin: "#8a5a3c", hair: "afro", hairColor: "#2a1a10", eyes: "joyeux" }, JERSEY_THEM)), spd: 130 + level() * 8 }),
        mk({ team: 1, role: "gk", name: "Véga", av: av(Object.assign({ skin: "#e8c4a0", hair: "macarons", hairColor: "#8a3a2a", eyes: "amande", glasses: "rondes" }, JERSEY_THEM, { topColor: "#7a5ad0" })), spd: 130 }),
      ];
      A.botX = -999; this.kickoff(1);
    },
    async intro() {
      const sp = { name: "Capitaine Stella", avatar: STELLA_AV, color: "#d0508a" };
      await Dialog.say(sp, "Bienvenue sur le Terrain des Étoiles ! Moi, c'est Stella, capitaine des Étoiles Filantes. Invaincues depuis… toujours.");
      await Dialog.say(sp, "Ici, on ne se bat pas : on JOUE. Un match, trois buts gagnants. Si vous gagnez, la grotte est à vous. Si on gagne… on rejoue, hein !");
      await Dialog.say(sp, "Les filles, en place ! Et faites attention à mon Tir des Étoiles…");
      Game.toast("Cours vers le ballon pour l'avoir. TAPER = tirer · RAMASSER = passer · ESQUIVE = tacler pour voler le ballon.", 5200);
    },
    kickoff(team) {
      const b = A.ball; Object.assign(b, { x: A.W / 2, y: A.H / 2, vx: 0, vy: 0, z: 0, vz: 0, owner: null, cool: .4 });
      const pos = { 0: { me: [A.W / 2 - 70, A.H / 2 + 60], att: [A.W / 2 - 160, A.H / 2 - 150], def: [A.W * .25, A.H / 2 + 120], gk: [110, A.H / 2] }, 1: { cap: [A.W / 2 + 70, A.H / 2], att: [A.W / 2 + 160, A.H / 2 + 150], def: [A.W * .75, A.H / 2 - 120], gk: [A.W - 110, A.H / 2] } };
      for (const e of A.ents) { const q = pos[e.team][e.role]; e.x = q[0]; e.y = q[1]; e.vx = e.vy = 0; e.stun = 0; }
      if (team === 1) { const st = A.ents.find((e) => e.captain); st.x = A.W / 2 + 26; st.y = A.H / 2; } else { A.me.x = A.W / 2 - 26; A.me.y = A.H / 2; }
      const p = Game.player; p.x = A.me.x; p.y = A.me.y; p.kx = p.ky = 0;
      A.phase = "kick"; A.pt = 0;
    },
    goalLine(team) { return team === 0 ? TS + 6 : A.W - TS - 6; }, // le but que défend l'équipe
    shoot(e, tx, ty, power, curve = 0) { const b = A.ball, a = Math.atan2(ty - b.y, tx - b.x); b.owner = null; b.cool = .25; b.last = e; b.vx = Math.cos(a) * power; b.vy = Math.sin(a) * power; b.vz = 120 + Math.random() * 120; b.curve = curve; e.cool = .5; Music.sfx("hit", .7); },
    pass(e) {
      const mates = A.ents.filter((m) => m.team === e.team && m !== e && m.role !== "gk"); if (!mates.length) return false;
      const fwd = e.team === 0 ? 1 : -1; mates.sort((a, b) => (b.x - a.x) * fwd - (a.x - b.x) * fwd * 0 - Math.hypot(b.x - e.x, b.y - e.y) * .2 + Math.hypot(a.x - e.x, a.y - e.y) * .2);
      const m = mates[0]; this.shoot(e, m.x + fwd * 30, m.y, Math.min(620, 260 + Math.hypot(m.x - e.x, m.y - e.y) * .9)); A.ball.vz = 60; return true;
    },
    update(dt) {
      const p = Game.player, b = A.ball, lv = level();
      A.pt += dt; A.me.x = p.x; A.me.y = p.y; A.me.dir = p.dir;
      if (A.phase === "goal") { if (A.pt > 2.4) { if (A.score[0] >= 3) { finish("win"); return; } if (A.score[1] >= 3) { finish("lose"); return; } this.kickoff(A.lastGoal === 0 ? 1 : 0); } return; }
      if (A.phase === "kick" && A.pt > 1.2) A.phase = "play";
      if (A.phase !== "play") return;
      // le ballon
      b.cool = Math.max(0, b.cool - dt);
      if (b.owner) { const o = b.owner, f = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[o.dir] || [o.team === 0 ? 1 : -1, 0]; b.x = o.x + f[0] * 20; b.y = o.y + f[1] * 12 + 4; b.vx = b.vy = 0; b.z = 0; }
      else {
        if (b.curve) { const a = Math.atan2(b.vy, b.vx) + b.curve * dt, s = Math.hypot(b.vx, b.vy); b.vx = Math.cos(a) * s; b.vy = Math.sin(a) * s; b.curve *= Math.pow(.5, dt); }
        b.x += b.vx * dt; b.y += b.vy * dt; const fr = Math.pow(.42, dt); b.vx *= fr; b.vy *= fr; b.vz -= 600 * dt; b.z = Math.max(0, b.z + b.vz * dt); if (b.z === 0) b.vz = 0;
        // rebonds (sauf dans la bouche des buts)
        if (b.y < TS + 10) { b.y = TS + 10; b.vy = Math.abs(b.vy) * .7; } if (b.y > A.H - TS - 10) { b.y = A.H - TS - 10; b.vy = -Math.abs(b.vy) * .7; }
        const inMouth = b.y > A.goalY0 && b.y < A.goalY1;
        if (b.x < TS + 10 && !inMouth) { b.x = TS + 10; b.vx = Math.abs(b.vx) * .7; } if (b.x > A.W - TS - 10 && !inMouth) { b.x = A.W - TS - 10; b.vx = -Math.abs(b.vx) * .7; }
        // gardiennes
        for (const e of A.ents) if (e.role === "gk" && !b.owner && b.cool <= 0 && Math.hypot(e.x - b.x, e.y - b.y) < 46) {
          const speed = Math.hypot(b.vx, b.vy), save = e.team === 0 ? .55 : [.3, .42, .55][lv];
          if (speed < 260 || Math.random() < save) { b.owner = e; e.hold = 1; Music.sfx("pickup", .6); Game.toast(e.team === 0 ? "🧤 Arrêt de Brann !" : "🧤 Arrêt de Véga !", 1100); } else b.cool = .3;
        }
        // un but ?
        if (inMouth && (b.x < TS - 4 || b.x > A.W - TS + 4)) { const scorer = b.x > A.W / 2 ? 0 : 1; A.score[scorer]++; A.lastGoal = scorer; A.phase = "goal"; A.pt = 0; A.bar.hp = 3 - A.score[0];
          Music.jingle(scorer === 0 ? "victory" : "secret"); Game.shake(6, .4); A.goalTxt = scorer === 0 ? (b.last === A.me ? "BUUUT !!!" : "BUT ! " + (b.last ? b.last.name : "")) : "But des Étoiles…"; return; }
        // prendre le ballon
        if (b.cool <= 0 && b.z < 14) for (const e of A.ents) { if (e.stun > 0 || e.cool > 0 || e.role === "gk") continue; if (Math.hypot(e.x - b.x, e.y - b.y) < 26) { b.owner = e; break; } }
      }
      // les autres joueuses (IA)
      for (const e of A.ents) {
        e.cool = Math.max(0, e.cool - dt); e.stun = Math.max(0, e.stun - dt); e.tackle = Math.max(0, e.tackle - dt);
        if (e.player) continue;
        const fwd = e.team === 0 ? 1 : -1, goalX = e.team === 0 ? A.W - TS : TS, ownX = e.team === 0 ? TS : A.W - TS;
        let tx = e.x, ty = e.y, run = 1;
        if (e.stun > 0) { e.vx = e.vy = 0; continue; }
        if (e.role === "gk") {
          tx = ownX + fwd * 62; ty = clamp(b.y, A.goalY0 + 20, A.goalY1 - 20);
          if (b.owner === e) { e.hold -= dt; if (e.hold <= 0) { if (!this.pass(e)) this.shoot(e, A.W / 2, rnd(TS * 3, A.H - TS * 3), 520); } }
        } else if (b.owner === e) {
          // dribbler vers le but, tirer près des buts, passer sous pression
          tx = goalX - fwd * 60; ty = clamp(A.H / 2 + Math.sin(A.time * .8 + e.x * .01) * 120, TS * 3, A.H - TS * 3); run = .92;
          const press = A.ents.some((o) => o.team !== e.team && o.role !== "gk" && Math.hypot(o.x - e.x, o.y - e.y) < 60);
          const dGoal = Math.abs(goalX - e.x);
          if (dGoal < 380 && e.cool <= 0) { const aimY = rnd(A.goalY0 + 18, A.goalY1 - 18); if (e.captain && (A.time - (A.lastStar || -99)) > 11 - lv * 2) { A.lastStar = A.time; this.shoot(e, goalX + fwd * 30, aimY, 820 + lv * 60, (Math.random() < .5 ? -1 : 1) * 1.6); A.starTxt = { t: 1.6 }; Music.sfx("magic"); } else this.shoot(e, goalX + fwd * 30, aimY, 600 + lv * 60 + (e.captain ? 80 : 0)); }
          else if (press && e.cool <= 0 && Math.random() < dt * (e.team === 0 ? 2.5 : 1.4)) this.pass(e);
        } else if (b.owner && b.owner.team === e.team) {
          // soutien : se démarquer devant
          tx = clamp(b.owner.x + fwd * (e.role === "def" ? -120 : 200), TS * 3, A.W - TS * 3); ty = clamp(e.role === "def" ? A.H / 2 + (b.owner.y < A.H / 2 ? 160 : -160) : b.owner.y + (b.owner.y < A.H / 2 ? 200 : -200), TS * 2, A.H - TS * 2);
          // mes coéquipières me font la passe quand je suis démarqué(e)
          if (b.owner.team === 0 && !b.owner.player && b.owner.cool <= 0 && Math.random() < dt * 1.2 && (p.x - b.owner.x) > -40) { this.shoot(b.owner, p.x + 20, p.y, Math.min(600, 260 + Math.hypot(p.x - b.owner.x, p.y - b.owner.y) * .9)); A.ball.vz = 60; }
        } else {
          // défendre : la plus proche va au ballon, les autres se replacent
          const mates = A.ents.filter((m) => m.team === e.team && m.role !== "gk" && !m.player); const closest = mates.sort((a, c) => Math.hypot(a.x - b.x, a.y - b.y) - Math.hypot(c.x - b.x, c.y - b.y))[0];
          if (closest === e || e.captain) { tx = b.x; ty = b.y; run = 1.05;
            if (b.owner && b.owner.team !== e.team && Math.hypot(e.x - b.owner.x, e.y - b.owner.y) < 30 && e.cool <= 0) { e.cool = 1.1; if (Math.random() < (e.team === 0 ? .4 : [.25, .38, .5][lv] + (e.captain ? .12 : 0))) { const o = b.owner; b.owner = e; o.stun = .5; if (o.player) Game.toast(`${e.name} te prend le ballon !`, 1000); Music.sfx("swing", .6); } } }
          else { tx = e.team === 0 ? Math.min(b.x - 140, A.W * .45) : Math.max(b.x + 140, A.W * .55); ty = A.H / 2 + (e.role === "def" ? (b.y - A.H / 2) * .5 : (e.y < A.H / 2 ? -140 : 140)); }
        }
        const dx = tx - e.x, dy = ty - e.y, d = Math.hypot(dx, dy), sp = e.spd * run;
        if (d > 6) { e.vx = dx / d * sp; e.vy = dy / d * sp; e.x += e.vx * dt; e.y += e.vy * dt; e.walk = (e.walk + dt * 2.4) % 1; e.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? "left" : "right") : (dy < 0 ? "up" : "down"); } else { e.vx = e.vy = 0; e.walk = null; }
        e.x = clamp(e.x, TS + 14, A.W - TS - 14); e.y = clamp(e.y, TS + 20, A.H - TS - 8);
      }
      if (A.starTxt) { A.starTxt.t -= dt; if (A.starTxt.t <= 0) A.starTxt = null; }
    },
    move(x, y, nx, ny) { if (A.phase !== "play" || A.me.stun > 0) return { x, y }; return { x: clamp(nx, TS + 14, A.W - TS - 14), y: clamp(ny, TS + 20, A.H - TS - 8) }; },
    action(a) {
      const p = Game.player, b = A.ball, e = A.me; if (A.phase !== "play") return;
      const v = Game.moveVec(), f = v.x || v.y ? [v.x, v.y] : ({ up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[p.dir] || [1, 0]);
      if (a === "hit") {
        if (b.owner !== e) { if (Math.hypot(b.x - p.x, b.y - p.y) < 40 && !b.owner) b.owner = e; else return; }
        // vers le but adverse si on regarde à peu près vers lui, sinon dans la direction donnée
        let tx = p.x + f[0] * 400, ty = p.y + f[1] * 400; if (f[0] > .3 && A.W - p.x < 700) { tx = A.W; ty = clamp(A.H / 2 + f[1] * 90 + (p.y - A.H / 2) * .3, A.goalY0 + 14, A.goalY1 - 14); }
        this.shoot(e, tx, ty, 760);
      } else if (a === "grab") { if (b.owner === e) this.pass(e); else Game.toast("Il faut avoir le ballon pour faire une passe.", 1000); }
      else if (a === "dodge") { e.tackle = .35; const o = b.owner; if (o && o.team === 1 && Math.hypot(o.x - p.x, o.y - p.y) < 64) { if (Math.random() < .72 - level() * .1 - (o.captain ? .12 : 0)) { b.owner = e; o.stun = .8; Music.sfx("swing"); Game.toast("Tacle réussi ! ⚽", 900); } else Game.toast("Raté ! Elle t'a dribblé.", 900); } }
    },
    draw(c) {
      // la pelouse sous les étoiles
      for (let i = 0; i < A.W / 96; i++) { c.fillStyle = i % 2 ? "#4aa04a" : "#52aa52"; c.fillRect(i * 96, 0, 96, A.H); }
      c.strokeStyle = "rgba(255,255,255,.85)"; c.lineWidth = 4; c.strokeRect(TS, TS, A.W - TS * 2, A.H - TS * 2);
      c.beginPath(); c.moveTo(A.W / 2, TS); c.lineTo(A.W / 2, A.H - TS); c.stroke(); c.beginPath(); c.arc(A.W / 2, A.H / 2, 110, 0, TAU); c.stroke();
      for (const s of [-1, 1]) { const x = s < 0 ? TS : A.W - TS; c.strokeRect(s < 0 ? x : x - 200, A.H / 2 - 220, 200, 440); c.strokeRect(s < 0 ? x : x - 80, A.H / 2 - 130, 80, 260); }
      // les buts (filets)
      for (const s of [-1, 1]) { const x = s < 0 ? TS - 40 : A.W - TS; c.fillStyle = "rgba(255,255,255,.25)"; c.fillRect(x, A.goalY0, 40, A.goalY1 - A.goalY0); c.strokeStyle = "rgba(255,255,255,.6)"; c.lineWidth = 1; for (let y = A.goalY0; y < A.goalY1; y += 12) { c.beginPath(); c.moveTo(x, y); c.lineTo(x + 40, y); c.stroke(); } c.lineWidth = 6; c.strokeStyle = "#fff"; c.beginPath(); c.moveTo(s < 0 ? TS : A.W - TS, A.goalY0); c.lineTo(s < 0 ? TS - 40 : A.W - TS + 40, A.goalY0); c.lineTo(s < 0 ? TS - 40 : A.W - TS + 40, A.goalY1); c.lineTo(s < 0 ? TS : A.W - TS, A.goalY1); c.stroke(); }
      // tribunes étoilées
      c.fillStyle = "#1a1a3a"; c.fillRect(0, 0, A.W, TS - 4); c.fillRect(0, A.H - TS + 4, A.W, TS); for (let i = 0; i < 60; i++) { c.fillStyle = `rgba(255,240,180,${.4 + .4 * Math.sin(A.time * 3 + i)})`; c.beginPath(); c.arc((i * 97) % A.W, (i * 13) % (TS - 10) + 4, 2, 0, TAU); c.fill(); }
      const items = [];
      for (const e of A.ents) { if (e.player) continue; items.push({ y: e.y, f: () => { drawAv(c, e.x, e.y, e.av, { dir: e.dir, walk: e.walk, k: e.captain ? 1.1 : 1, alpha: e.stun > 0 ? .6 : 1 }); label(c, e.x, e.y - (e.captain ? 100 : 92), (e.captain ? "⭐ " : "") + e.name, e.team === 0 ? "#3a7ad0" : "#d0508a"); } }); }
      items.push({ y: Game.player.y, f: () => { Game.drawPlayer(c); label(c, Game.player.x, Game.player.y - 92, "Toi", "#3a7ad0"); } });
      const b = A.ball; items.push({ y: b.y + 1, f: () => { c.fillStyle = "rgba(0,0,0,.25)"; c.beginPath(); c.ellipse(b.x, b.y + 4, 11, 4, 0, 0, TAU); c.fill(); c.save(); c.translate(b.x, b.y - 8 - b.z); c.fillStyle = "#fff"; c.beginPath(); c.arc(0, 0, 10, 0, TAU); c.fill(); c.strokeStyle = "#222"; c.lineWidth = 1.5; c.stroke(); c.fillStyle = "#222"; c.beginPath(); for (let k = 0; k < 5; k++) c.lineTo(Math.cos(k / 5 * TAU + b.x * .05) * 4, Math.sin(k / 5 * TAU + b.x * .05) * 4); c.fill(); if (b.curve && Math.abs(b.curve) > .3) { c.fillStyle = "rgba(255,220,90,.6)"; c.beginPath(); c.arc(0, 0, 16, 0, TAU); c.fill(); } c.restore(); } });
      items.sort((q, r) => q.y - r.y); for (const it of items) it.f(c);
    },
    hud(c, vw, vh) {
      const top = A.top - 6; c.fillStyle = "rgba(20,20,40,.78)"; c.beginPath(); c.roundRect(vw / 2 - 120, top, 240, 34, 17); c.fill();
      c.font = "900 16px ui-rounded, system-ui"; c.textAlign = "center"; c.fillStyle = "#8ac0ff"; c.fillText("Kalua", vw / 2 - 62, top + 23); c.fillStyle = "#fff"; c.fillText(`${A.score[0]} – ${A.score[1]}`, vw / 2, top + 23); c.fillStyle = "#ff9ac0"; c.fillText("Étoiles", vw / 2 + 64, top + 23);
      c.font = "700 11px ui-rounded, system-ui"; c.fillStyle = "#fff"; c.fillText("3 buts gagnants", vw / 2, top + 48);
      if (A.phase === "goal") bigText(c, vw, vh, A.goalTxt, `${A.score[0]} – ${A.score[1]}`, A.lastGoal === 0 ? "#7ae07a" : "#ff9ac0", 56);
      if (A.phase === "kick") bigText(c, vw, vh, "Coup d'envoi !", null, "#fff", 40);
      if (A.starTxt) bigText(c, vw, vh * .6, "✨ Tir des Étoiles ! ✨", null, "#ffd23a", 30);
    },
  };

  const KINDS = { aucoin: COIN, menage: MEN, foot: FOOT };
  const MUSIC = { aucoin: "B7", menage: "miniboss", foot: "fete" };

  // ================================================================ démarrer / terminer
  function start(kind) {
    return new Promise((resolve) => {
      const p = Game.player;
      A = { top: (parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--st")) || 0) + (kind === "aucoin" ? 140 : 100), kind, K: KINDS[kind], time: 0, inv: 0, resolve, back: { x: p.x, y: p.y, dir: p.dir }, done: false };
      A.K.setup(); p.x = A.start ? A.start.x : A.W / 2; p.y = A.start ? A.start.y : A.H - 120; p.dir = "up"; p.kx = p.ky = 0;
      if (kind === "foot") { p.x = A.me.x; p.y = A.me.y; p.dir = "right"; }
      Game.enterArena(A); Game.bossBar(A.bar); Music.play(MUSIC[kind] || "miniboss", .8);
      (async () => { Game.lockInput(true); try { await A.K.intro(); } finally { Game.lockInput(false); } })();
    });
  }
  function finish(res) {
    if (!A || A.done) return; A.done = true; const a = A;
    if (res === "win") { a.bar.alive = false; Music.jingle("victory"); }
    setTimeout(() => {
      const p = Game.player; p.x = a.back.x; p.y = a.back.y; p.dir = a.back.dir; p.kx = p.ky = 0;
      Game.bossBar(null); Game.leaveArena(); A = null; a.resolve(res);
    }, res === "win" ? 900 : 400);
  }
  function update(dt) { if (!A || A.done) return; A.time += dt; A.inv = Math.max(0, A.inv - dt); if (Game.busy() && A.kind !== "foot") return; if (Game.busy()) return; A.K.update(dt); }
  function move(x, y, nx, ny) { return A ? A.K.move(x, y, nx, ny) : { x: nx, y: ny }; }
  function action(a) { if (A && !A.done && !Game.busy()) A.K.action(a); }
  function render(c, vw, vh) { if (!A) return; begin(c, vw, vh); A.K.draw(c); c.restore(); c.setTransform(DPR, 0, 0, DPR, 0, 0); A.K.hud(c, vw, vh); }
  return { get state() { return A; }, start, update, move, action, render, get on() { return Boolean(A); }, get kind() { return A && A.kind; }, AVATARS: { aucoin: COIN_AV, menage: PLUMEAU_AV, foot: STELLA_AV } };
})();
