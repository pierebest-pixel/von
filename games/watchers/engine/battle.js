/* Watchers — combats au tour par tour (sauvages, dresseurs, boss, légendaires). */
"use strict";
const Battle = {
  /*
   * opts = { wild: mon } ou { trainer: { id, name, title, look, team: [mons], intro, lose, reward, boss } }, legend?
   * Renvoie : "win" | "lose" | "run" | "caught"
   */
  async start(opts) {
    G.busy = true; Game.mode = "battle";
    const region = Math.min(4, MAPS[G.save.map].region);
    MUSIC.play(opts.trainer?.boss || opts.legend ? "boss" : "battle");
    const B = this.b = {
      opts, wild: !!opts.wild, foeTeam: opts.wild ? [opts.wild] : opts.trainer.team, foeIdx: 0,
      ally: null, foe: null, participants: new Set(), result: null, turns: 0,
    };
    const root = (B.root = UI.add(el(`<div class="battle"><div class="scene"></div><div class="panel"><div class="txt"></div><div class="cmds"></div></div></div>`)));
    const scene = root.querySelector(".scene");
    const bg = BATTLE_BG.draw(region, 130, 167); bg.className = "bg"; scene.append(bg);
    B.txt = root.querySelector(".txt"); B.cmds = root.querySelector(".cmds"); B.scene = scene;
    B.foeBox = UI.add(el('<div class="box foe"></div>')); scene.append(B.foeBox);
    B.allyBox = UI.add(el('<div class="box ally"></div>')); scene.append(B.allyBox);
    B.foeBox.style.visibility = "hidden"; B.allyBox.style.visibility = "hidden";

    if (opts.trainer) {
      const pic = TRAINER_ART.draw(opts.trainer.look.spec || opts.trainer.look); pic.className = "trainer-pic"; scene.append(pic); B.pic = pic;
      await this.msg(`${opts.trainer.title ? opts.trainer.title + " " : ""}${opts.trainer.name} veut se battre !`);
      if (opts.trainer.intro) await this.msg(`« ${opts.trainer.intro} »`);
      pic.classList.add("out");
    }
    await this.sendFoe(0, true);
    await this.sendAlly(G.save.party.indexOf(G.firstAlive()), true);

    while (!B.result) await this.turn();
    // Fin du combat
    await this.finish();
    return B.result;
  },

  // ------------------------------------------------ affichage
  side(mon, foe) { return { mon, stages: {}, foe, sleep: 0 }; },
  drawBox(b) {
    const box = b.foe ? this.b.foeBox : this.b.allyBox, m = b.mon;
    const xpPct = m.level >= MAX_LEVEL ? 100 : ((m.xp - xpForLevel(m.level)) / (xpForLevel(m.level + 1) - xpForLevel(m.level))) * 100;
    box.innerHTML = `<div class="n"><span>${esc(m.species)}${m.shiny ? ' <span style="color:#f7d77a">★</span>' : ""}${m.status ? `<span class="st" style="background:${STATUS[m.status].color}">${STATUS[m.status].short}</span>` : ""}</span><small>Nv ${m.level}</small></div>
      <div class="hp">PV<div class="bar"><span style="width:${(m.hp / m.stats.hp) * 100}%;background:${hpColor(m.hp, m.stats.hp)}"></span></div></div>
      ${b.foe ? "" : `<div class="num">${m.hp} / ${m.stats.hp}</div><div class="xp"><span style="width:${xpPct}%"></span></div>`}`;
    box.style.visibility = "visible";
  },
  async sendFoe(i, first) {
    const B = this.b; B.foeIdx = i;
    const m = B.foeTeam[i]; G.seen(m.species);
    B.foe = this.side(m, true);
    B.foeCv?.remove();
    const c = monCanvas(m); c.className = "mon foe"; c.style.opacity = 0; B.scene.append(c); B.foeCv = c;
    requestAnimationFrame(() => (c.style.opacity = 1));
    this.drawBox(B.foe);
    if (m.shiny) { SFX.play("shiny"); this.sparkle(c); }
    if (B.wild) await this.msg(B.opts.legend ? `${m.species} apparaît !` : `Un ${m.species}${m.shiny ? " chromatique" : ""} sauvage surgit !`);
    else await this.msg(`${B.opts.trainer.name} envoie ${m.species} !`);
  },
  async sendAlly(i, first) {
    const B = this.b; const m = G.save.party[i];
    B.allyIdx = i; B.ally = this.side(m, false); B.participants.add(m.uid);
    B.allyCv?.remove();
    const c = monCanvas(m, true); c.className = "mon ally"; c.style.opacity = 0; B.scene.append(c); B.allyCv = c;
    requestAnimationFrame(() => (c.style.opacity = 1));
    this.drawBox(B.ally);
    await this.msg(`${first ? "À toi" : "Vas-y"}, ${m.species} !`);
  },
  sparkle(target) {
    const r = target.getBoundingClientRect(), s = this.b.scene.getBoundingClientRect();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2, d = el(`<div class="spark" style="left:${r.left - s.left + r.width / 2}px;top:${r.top - s.top + r.height / 2}px;background:${i % 2 ? "#ffd36b" : "#5ee0c6"};--dx:${Math.cos(a) * 60}px;--dy:${Math.sin(a) * 50}px"></div>`);
      this.b.scene.append(d); setTimeout(() => d.remove(), 900);
    }
  },
  // Message : avance seul après un délai, ou au toucher
  msg(text, wait = 1100) {
    return new Promise((res) => {
      const B = this.b; B.txt.textContent = text; B.cmds.innerHTML = "";
      let done = false;
      const go = () => { if (done) return; done = true; clearTimeout(t); Input.aListeners = Input.aListeners.filter((f) => f !== go); B.txt.onclick = null; res(); };
      const t = setTimeout(go, wait); Input.aListeners.push(go); B.txt.onclick = go;
    });
  },

  // ------------------------------------------------ tour du joueur
  async turn() {
    const B = this.b;
    const action = await this.chooseAction();
    if (!action) return;
    if (action.type === "run") {
      if (!B.wild) { await this.msg("Impossible de fuir un combat de dresseur !"); return; }
      if (B.opts.legend && Math.random() < .5) { await this.msg("Impossible de fuir !"); }
      else if (Math.random() < .25 + effStat(B.ally, "spd") / (effStat(B.foe, "spd") * 2)) { await this.msg("Tu prends la fuite…"); B.result = "run"; return; }
      else await this.msg("Impossible de fuir !");
      await this.foeAct(); await this.endTurn(); return;
    }
    if (action.type === "item") {
      const it = ITEMS[action.item];
      if (it.kind === "lantern") { const caught = await this.throwLantern(action.item); if (caught) return; await this.foeAct(); await this.endTurn(); return; }
      const m = G.save.party[action.target]; await useItem(action.item, m);
      if (m === B.ally.mon) this.drawBox(B.ally);
      await this.foeAct(); await this.endTurn(); return;
    }
    if (action.type === "switch") {
      await this.msg(`Reviens, ${B.ally.mon.species} !`, 700);
      await this.sendAlly(action.index);
      await this.foeAct(); await this.endTurn(); return;
    }
    // Attaque : ordre selon priorité puis vitesse
    const foeMove = chooseAiMove(B.foe, B.ally, B.opts.trainer?.boss ? 0 : 1);
    const pm = MOVES[action.move.name], fm = MOVES[foeMove.name];
    const allyFirst = (pm.prio || 0) !== (fm.prio || 0) ? (pm.prio || 0) > (fm.prio || 0) : effStat(B.ally, "spd") >= effStat(B.foe, "spd") * (Math.random() < .1 ? .8 : 1);
    const order = allyFirst ? [[B.ally, B.foe, action.move], [B.foe, B.ally, foeMove]] : [[B.foe, B.ally, foeMove], [B.ally, B.foe, action.move]];
    for (const [a, d, mv] of order) {
      if (a.mon.hp <= 0 || d.mon.hp <= 0) continue;
      await this.useMove(a, d, mv);
      if (await this.checkFaints()) return;
    }
    await this.endTurn();
  },
  async foeAct() {
    const B = this.b; if (B.result || B.foe.mon.hp <= 0) return;
    await this.useMove(B.foe, B.ally, chooseAiMove(B.foe, B.ally));
    await this.checkFaints();
  },
  chooseAction() {
    const B = this.b, m = B.ally.mon;
    return new Promise((res) => {
      B.txt.textContent = `Que doit faire ${m.species} ?`;
      const btn = (k, c, l, dis) => `<button class="ib" data-k="${k}" ${dis ? "disabled" : ""}><span class="ic" style="background:${c}">${ICONS_SVG[k === "flee" ? "run" : k]}</span>${l}</button>`;
      const main = () => {
        B.cmds.style.gridTemplateColumns = "1fr 1fr";
        B.cmds.innerHTML = btn("att", "#ff453a", "Attaque") + btn("bag", "#ff9f0a", "Sac") + btn("team", "#30d158", "Équipe") + btn("flee", "#8e8e93", "Fuite", !B.wild);
        B.cmds.onclick = async (e) => {
          const b = e.target.closest("[data-k]"); if (!b) return; SFX.play("tap");
          const k = b.dataset.k;
          if (k === "att") return moves();
          if (k === "flee") return done({ type: "run" });
          if (k === "bag") { const r = await UI.bag("battle"); if (r) { if (ITEMS[r.item].kind === "lantern" && !B.wild) { await UI.say(null, "On ne capture pas le Watcher d'un dresseur !"); return; } return done({ type: "item", ...r }); } return; }
          if (k === "team") { const i = await UI.team("pick", { title: "Changer de Watcher", back: "Combat", hint: "Choisis qui envoyer", filter: (x) => x.hp > 0 && x !== m }); if (i != null) return done({ type: "switch", index: i }); }
        };
      };
      const moves = () => {
        B.txt.innerHTML = 'Choisis une attaque <span style="float:right;color:#8a8496">‹ Retour</span>';
        B.txt.onclick = () => { B.txt.onclick = null; main(); B.txt.textContent = `Que doit faire ${m.species} ?`; };
        B.cmds.innerHTML = m.moves.map((mv, i) => { const M = MOVES[mv.name], t = moveType(M, m), c = TYPE_UI[t]; return `<button class="mv" data-i="${i}" style="border-color:${c};background:${c}33" ${mv.pp <= 0 ? "disabled" : ""}>${esc(mv.name)}<small><span>${t}${M.power ? " · " + M.power : ""}</span><span>PP ${mv.pp}/${M.pp}</span></small></button>`; }).join("");
        B.cmds.onclick = (e) => { const b = e.target.closest("[data-i]"); if (!b || b.disabled) return; SFX.play("tap"); const mv = m.moves[+b.dataset.i]; done({ type: "move", move: mv }); };
        const back = () => { main(); B.txt.textContent = `Que doit faire ${m.species} ?`; };
        Input.bListeners.push(back); B._back = back;
      };
      const done = (a) => { B.cmds.onclick = null; B.txt.onclick = null; Input.bListeners = Input.bListeners.filter((f) => f !== B._back); res(a); };
      main();
    });
  },

  // ------------------------------------------------ résolution d'une attaque
  async useMove(a, d, mv) {
    const B = this.b, M = MOVES[mv.name];
    // États qui empêchent d'agir
    if (a.mon.status === "slp") { if (--a.sleep > 0) { await this.msg(`${a.mon.species} dort profondément.`); return; } a.mon.status = null; this.drawBox(a); await this.msg(`${a.mon.species} se réveille !`); }
    if (a.mon.status === "frz") { if (Math.random() < .2) { a.mon.status = null; this.drawBox(a); await this.msg(`${a.mon.species} dégèle !`); } else { await this.msg(`${a.mon.species} est gelé !`); return; } }
    if (a.mon.status === "par" && Math.random() < .25) { await this.msg(`${a.mon.species} est paralysé ! Il ne peut pas bouger.`); return; }
    if (mv.pp !== undefined && !a.foe) mv.pp = Math.max(0, mv.pp - 1); else if (a.foe) { const own = a.mon.moves.find((x) => x.name === mv.name); if (own) own.pp = Math.max(0, own.pp - 1); }
    await this.msg(`${a.foe ? (B.wild ? "" : "") + a.mon.species + " ennemi" : a.mon.species} utilise ${M.name} !`, 800);
    const cv = a.foe ? B.foeCv : B.allyCv; cv.classList.add(a.foe ? "lunge-f" : "lunge-a"); setTimeout(() => cv.classList.remove("lunge-f", "lunge-a"), 250);
    if (Math.random() * 100 >= M.acc) { await this.msg("Mais l'attaque échoue !"); return; }
    if (M.cat !== "x") {
      const { dmg, eff, crit } = computeDamage(a, d, M);
      if (eff === 0) { await this.msg("Ça n'a aucun effet…"); return; }
      d.mon.hp = Math.max(0, d.mon.hp - dmg);
      SFX.play(eff > 1 ? "super" : "hit");
      const tcv = d.foe ? B.foeCv : B.allyCv; tcv.classList.remove("hit"); void tcv.offsetWidth; tcv.classList.add("hit");
      this.drawBox(d);
      await new Promise((r) => setTimeout(r, 450));
      if (crit) await this.msg("Coup critique !", 800);
      if (eff > 1) await this.msg("C'est très efficace !", 900); else if (eff < 1) await this.msg("Ce n'est pas très efficace…", 900);
      if (M.drain) { a.mon.hp = Math.min(a.mon.stats.hp, a.mon.hp + Math.floor(dmg * M.drain / 100)); this.drawBox(a); await this.msg(`${a.mon.species} absorbe de l'énergie.`, 800); }
      if (M.recoil) { a.mon.hp = Math.max(0, a.mon.hp - Math.floor(dmg * M.recoil / 100)); this.drawBox(a); await this.msg(`${a.mon.species} subit le contrecoup.`, 800); }
    }
    // Effets secondaires
    if (M.heal) { const h = Math.floor(a.mon.stats.hp * M.heal / 100); a.mon.hp = Math.min(a.mon.stats.hp, a.mon.hp + h); this.drawBox(a); await this.msg(`${a.mon.species} récupère des PV.`); }
    const chance = M.ch ?? 100;
    if (M.st && d.mon.hp > 0 && !d.mon.status && Math.random() * 100 < chance) {
      const immune = (M.st === "brn" && SPECIES[d.mon.species].types.includes("Flamme")) || (M.st === "frz" && SPECIES[d.mon.species].types.includes("Givre")) || (M.st === "par" && SPECIES[d.mon.species].types.includes("Foudre"));
      if (!immune) { d.mon.status = M.st; if (M.st === "slp") d.sleep = 1 + Math.floor(Math.random() * 3); this.drawBox(d); await this.msg(`${d.mon.species} est ${STATUS[M.st].name.toLowerCase()} !`); }
      else if (M.cat === "x") await this.msg("Ça n'a aucun effet…");
    }
    if (M.buff && (M.cat === "x" || Math.random() * 100 < chance)) { const [k, n] = M.buff; a.stages[k] = Math.min(6, (a.stages[k] || 0) + n); await this.msg(`${STAT_NAMES[k]} de ${a.mon.species} augmente${n > 1 ? " beaucoup" : ""} !`, 900); }
    if (M.debuff && d.mon.hp > 0 && (M.cat === "x" || Math.random() * 100 < chance)) { const [k, n] = M.debuff; d.stages[k] = Math.max(-6, (d.stages[k] || 0) - n); await this.msg(`${STAT_NAMES[k]} de ${d.mon.species} baisse${n > 1 ? " beaucoup" : ""} !`, 900); }
  },
  async endTurn() {
    const B = this.b; if (B.result) return;
    for (const s of [B.ally, B.foe]) {
      if (s.mon.hp <= 0) continue;
      if (s.mon.status === "psn" || s.mon.status === "brn") {
        s.mon.hp = Math.max(0, s.mon.hp - Math.max(1, Math.floor(s.mon.stats.hp / 8))); this.drawBox(s);
        await this.msg(`${s.mon.species} souffre ${s.mon.status === "psn" ? "du poison" : "de sa brûlure"}.`, 900);
      }
    }
    await this.checkFaints();
  },
  async checkFaints() {
    const B = this.b;
    if (B.foe.mon.hp <= 0) {
      SFX.play("faint"); B.foeCv.classList.add("faint");
      await this.msg(`${B.foe.mon.species}${B.wild ? "" : " ennemi"} est K.O. !`);
      await this.giveXp(B.foe.mon);
      const next = B.foeTeam.findIndex((m, i) => i > B.foeIdx && m.hp > 0);
      if (next >= 0 && !B.wild) { await this.sendFoe(next); return false; }
      B.result = "win"; return true;
    }
    if (B.ally.mon.hp <= 0) {
      SFX.play("faint"); B.allyCv.classList.add("faint");
      await this.msg(`${B.ally.mon.species} est K.O. !`);
      if (!G.firstAlive()) { B.result = "lose"; return true; }
      let i = null;
      while (i == null) i = await UI.team("pick", { title: "Qui envoyer ?", back: "Combat", hint: "Choisis ton prochain Watcher", filter: (x) => x.hp > 0 });
      await this.sendAlly(i);
      return false;
    }
    return false;
  },
  async giveXp(foeMon) {
    const B = this.b;
    const base = xpYield(foeMon, !B.wild);
    for (const m of G.save.party) {
      if (m.hp <= 0 || m.level >= MAX_LEVEL) continue;
      const amount = B.participants.has(m.uid) ? base : Math.floor(base / 2);
      const ev = gainXp(m, amount);
      if (m === B.ally.mon) { this.drawBox(B.ally); await this.msg(`${m.species} gagne ${amount} points d'expérience.`, 900); }
      for (const e of ev) {
        if (e.type === "level") { SFX.play("level"); if (m === B.ally.mon) this.drawBox(B.ally); await this.msg(`${m.species} passe au niveau ${e.level} !`, 900); }
        if (e.type === "learn") await UI.learnMove(m, e.move);
        if (e.type === "evolve") (B.evolutions = B.evolutions || []).push([m, e.into]);
      }
    }
  },

  // ------------------------------------------------ capture
  async throwLantern(id) {
    const B = this.b, it = ITEMS[id];
    G.take(id);
    if (B.opts.legend && SPECIES[B.foe.mon.species].secret) { await this.msg("L'Éclipse dévore la lumière de la Lanterne. Impossible de la capturer !"); return false; }
    await this.msg(`Tu lances une ${it.name} !`, 500);
    SFX.play("throw");
    const pal = { lanterne: "lanterne", grande: "grande", aube: "aube", eternelle: "eternelle" }[id];
    const L = ITEM_ART.lantern(ITEM_ART.LANTERNS[pal]); const lc = document.createElement("canvas"); lc.width = lc.height = 16; lc.getContext("2d").drawImage(L, 0, 0); lc.className = "lantern-fly";
    const sc = B.scene.getBoundingClientRect(), fr = B.foeCv.getBoundingClientRect();
    lc.style.left = "10%"; lc.style.top = "80%"; B.scene.append(lc);
    await new Promise((r) => setTimeout(r, 30));
    const tx = fr.left - sc.left + fr.width / 2 - 17, ty = fr.top - sc.top + fr.height * .55;
    lc.style.left = tx + "px"; lc.style.top = ty + "px";
    await new Promise((r) => setTimeout(r, 600));
    B.foeCv.classList.add("absorb"); SFX.play("light");
    await new Promise((r) => setTimeout(r, 750));
    lc.style.transition = "top .3s ease-in"; lc.style.top = ty + fr.height * .3 + "px";
    await new Promise((r) => setTimeout(r, 350));
    const p = catchChance(B.foe.mon, it.bonus);
    const shakes = p >= 1 ? 3 : [0, 1, 2, 3].reduce((n, i) => (n === i && Math.random() < Math.pow(p, 1 / 3) ? n + 1 : n), 0);
    for (let i = 0; i < Math.min(3, shakes); i++) { lc.classList.remove("shake"); void lc.offsetWidth; lc.classList.add("shake"); SFX.play("click"); await new Promise((r) => setTimeout(r, 800)); }
    if (shakes >= 3) {
      SFX.play("caught"); this.sparkle(lc);
      const m = B.foe.mon; m.caughtIn = m.caughtIn || MAPS[G.save.map].name;
      await this.msg(`${m.species} est capturé !`, 1600);
      const where = G.addMon(m);
      if (where === "box") await this.msg(`${m.species} est envoyé dans la réserve.`);
      await this.giveXp(m);
      B.result = "caught"; lc.remove(); return true;
    }
    lc.remove(); B.foeCv.classList.remove("absorb");
    await this.msg(["Oh non ! Il s'est libéré !", "Presque ! Il s'échappe…", "Si près du but !"][Math.min(2, shakes)]);
    return false;
  },

  // ------------------------------------------------ fin
  async finish() {
    const B = this.b, T = B.opts.trainer;
    if (B.result === "win" && T) {
      if (B.pic) { B.pic.classList.remove("out"); B.foeCv?.remove(); }
      if (T.lose) await this.msg(`« ${T.lose} »`, 2200);
      const reward = T.reward ?? Math.round(T.team.reduce((a, m) => Math.max(a, m.level), 0) * (T.boss ? 60 : 25));
      G.save.money += reward; await this.msg(`Tu gagnes ${reward} Éclats.`);
      G.setFlag("beat:" + T.id);
    }
    if (B.result === "lose") {
      await this.msg("Tous tes Watchers sont K.O. …", 1400);
      const lost = Math.floor(G.save.money * .1); G.save.money -= lost;
      await this.msg(`Tu perds ${lost} Éclats et tu te réveilles au dernier autel…`, 1600);
    }
    // Évolutions
    for (const [m, into] of B.evolutions || []) {
      if (m.hp <= 0 && B.result !== "lose") continue;
      const old = m.species;
      B.cmds.innerHTML = ""; B.foeBox.style.visibility = "hidden"; B.allyBox.style.visibility = "hidden";
      B.foeCv?.remove(); B.allyCv?.remove();
      const c = monCanvas(m); c.className = "mon foe"; c.style.cssText = "left:25%;right:auto;top:15%;width:50%"; B.scene.append(c);
      await this.msg(`Quoi ? ${old} évolue !`, 1500);
      c.style.filter = "brightness(5)"; SFX.play("light"); await new Promise((r) => setTimeout(r, 900));
      evolve(m, into); G.caught(into);
      c.replaceWith(Object.assign(monCanvas(m), { className: "mon foe", style: "left:25%;right:auto;top:15%;width:50%" }));
      SFX.play("caught"); await this.msg(`${old} est devenu ${into} !`, 1800);
    }
    // Nettoyage
    G.save.party.forEach((m) => { if (m.hp > 0 && m.status === "slp") m.status = null; });
    B.root.remove(); B.foeBox.remove(); B.allyBox.remove();
    Game.mode = "world"; G.busy = false;
    MUSIC.play(MAPS[G.save.map].music || "region" + MAPS[G.save.map].region);
    if (B.result === "lose") {
      G.save.party.forEach(healMon);
      const [mid, x, y] = G.save.lastHeal; UI.fade(() => loadMap(mid, x, y + 1, "down"));
    }
    G.write();
  },
};
