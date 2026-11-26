/* Les Échoués de Kalua — menu titre, menu en jeu, réglages, carte, sac et sauvegarde. */
"use strict";

// ================================================================ réglages
const SET_DEFAULT = { sound: true, music: true, vibe: true, btn: 1, lefty: false, names: true, zoom: 1 };
let SET = { ...SET_DEFAULT, ...(JSON.parse(localStorage.getItem("kalua:settings") || "null") || {}) };
const saveSettings = () => { try { localStorage.setItem("kalua:settings", JSON.stringify(SET)); } catch { /* ignore */ } };
function applySettings() {
  document.documentElement.style.setProperty("--btn", SET.btn);
  document.body.classList.toggle("lefty", Boolean(SET.lefty));
}
applySettings();
function startMusic() {
  if (!SET.music || (window.Von && Von.sound === false) || (typeof G !== "undefined" && G.on) || document.hidden) return;
  Music.setEnabled(true); Music.start();
}
// iPhone : le son ne peut démarrer qu'après un toucher. Safari ne compte pas « pointerdown » au doigt
// comme un vrai geste : il faut écouter la fin du toucher (touchend / pointerup / click).
function onGesture() {
  if (!SET.music || (window.Von && Von.sound === false)) return;
  Music.unlock();
  if (!(typeof G !== "undefined" && G.on)) startMusic();
}
// on garde l'écoute : après un appel ou un retour d'arrière-plan, iPhone peut de nouveau couper le son
["pointerdown", "pointerup", "touchend", "click", "keydown"].forEach((ev) => document.addEventListener(ev, onGesture, true));
document.addEventListener("visibilitychange", () => { if (document.hidden) Music.stop(.2); else startMusic(); });
const buzz = (ms = 15) => { if (SET.vibe) try { navigator.vibrate?.(ms); } catch { /* ignore */ } };

// ================================================================ titre « KALUA » dessiné
function drawLogo(c, x, y, size, o = {}) {
  const txt = "KALUA";
  c.save(); c.font = `900 ${size}px ui-rounded, "Arial Rounded MT Bold", system-ui`; c.textAlign = "center"; c.textBaseline = "alphabetic";
  const widths = [...txt].map((l) => c.measureText(l).width * .92), total = widths.reduce((a, b) => a + b, 0);
  let cx = x - total / 2; const arc = .0016 * size;
  const L = [...txt].map((l, i) => { const w = widths[i], lx = cx + w / 2; cx += w; const off = lx - x; return { l, lx, rot: off * arc / size * 1.2, dy: off * off * arc / size * .9 }; });
  for (const pass of ["shadow", "stroke", "fill", "shine"]) for (const T of L) {
    c.save(); c.translate(T.lx, y + T.dy); c.rotate(T.rot);
    if (pass === "shadow") { c.fillStyle = "rgba(60,25,10,.45)"; c.fillText(T.l, size * .03, size * .09); }
    if (pass === "stroke") { c.lineJoin = "round"; c.strokeStyle = o.stroke || "#3a2140"; c.lineWidth = size * .16; c.strokeText(T.l, 0, 0); }
    if (pass === "fill") { const g = c.createLinearGradient(0, -size * .75, 0, 0); ["#ffffff", "#ffe6a8", "#ffc06b"].forEach((col, i, a) => g.addColorStop(i / (a.length - 1), col)); c.fillStyle = g; c.fillText(T.l, 0, 0); }
    if (pass === "shine") { c.fillStyle = "rgba(255,255,255,.55)"; c.save(); c.beginPath(); c.rect(-size, -size * .72, size * 2, size * .22); c.clip(); c.fillText(T.l, 0, 0); c.restore(); }
    c.restore();
  }
  c.font = `800 ${size * .26}px ui-rounded, system-ui`; c.lineWidth = size * .07; c.strokeStyle = o.stroke || "#3a2140"; c.strokeText("LES ÉCHOUÉS DE", x, y - size * .86);
  c.fillStyle = "#fff7e6"; c.fillText("LES ÉCHOUÉS DE", x, y - size * .86);
  c.restore();
}

// ================================================================ menu titre
const PIERRE_DEMO = { ...Avatar.DEFAULT, hair: "petard", hairColor: "#3d2c24", top: "chemise", pattern: "fleurs", topColor: "#5b8fd9", eyes: "brillants", mouth: "grand", hat: "paille" };
const ZOE_DEMO = { ...Avatar.DEFAULT, hair: "couettes", hairColor: "#f3c768", top: "robe", topColor: "#ff9fc0", eyes: "grands", eyeColor: "#5fae6b", skin: "#ffe2cc", earFlower: "hibiscus" };
function titleScene(c, w, h, t) {
  const land = w > h, TAU = Math.PI * 2;
  const circle = (x, y, r) => { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); };
  const g = c.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#7a6ab8"); g.addColorStop(land ? .32 : .22, "#f08aa0"); g.addColorStop(land ? .5 : .36, "#ffc38a"); g.addColorStop(land ? .51 : .37, "#7fcbe9"); g.addColorStop(1, "#5fb8d8");
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  const hz = land ? h * .51 : h * .37;
  c.fillStyle = "#fff1b8"; circle(w * .72, hz - 4, land ? 40 : 44);
  c.fillStyle = "rgba(255,241,184,.4)"; for (let i = 0; i < 4; i++) c.fillRect(w * .72 - 40 + i * 8, hz + 6 + i * 7, 80 - i * 16, 3);
  // nuages qui glissent
  c.fillStyle = "rgba(255,255,255,.8)";
  [[.15, .12, 1], [.8, .2, .8], [.45, .28, .7]].forEach(([fx, fy, s], i) => { const x = ((fx * w + t * (6 + i * 3)) % (w + 120)) - 60, y = fy * hz; circle(x, y, 16 * s); circle(x + 18 * s, y - 6 * s, 20 * s); circle(x + 40 * s, y, 15 * s); c.beginPath(); c.ellipse(x + 20 * s, y + 6 * s, 34 * s, 10 * s, 0, 0, TAU); c.fill(); });
  // oiseaux
  c.strokeStyle = "#5a3a5a"; c.lineWidth = 2; c.lineCap = "round";
  for (let i = 0; i < 3; i++) { const x = ((w * (.2 + i * .15) + t * 22 + i * 40) % (w + 60)) - 30, y = hz * (.4 + i * .08) + Math.sin(t * 2 + i) * 6, f = Math.sin(t * 8 + i) * 3;
    c.beginPath(); c.moveTo(x - 7, y); c.quadraticCurveTo(x - 3, y - 5 - f, x, y); c.quadraticCurveTo(x + 3, y - 5 - f, x + 7, y); c.stroke(); }
  // volcan au loin
  c.fillStyle = "#6a5a8a"; c.beginPath(); c.moveTo(w * .06, hz); c.lineTo(w * .24, hz - (land ? h * .13 : h * .09)); c.lineTo(w * .29, hz - (land ? h * .11 : h * .08)); c.lineTo(w * .46, hz); c.fill();
  c.fillStyle = "rgba(255,255,255,.6)"; for (let i = 0; i < 3; i++) { const p = (t * .15 + i / 3) % 1; circle(w * .265 + Math.sin(p * 5) * 4, hz - (land ? h * .13 : h * .09) - p * 40, 4 + p * 8); }
  // vagues
  c.strokeStyle = "rgba(255,255,255,.6)"; c.lineWidth = 2.4;
  for (let i = 0; i < 10; i++) { const x = ((i * 97 + t * 10) % (w + 40)) - 20, y = hz + 8 + ((i * 53) % (land ? h * .14 : h * .09)); c.globalAlpha = .4 + .4 * Math.sin(t * 1.5 + i);
    c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 7, y - 5, x + 14, y); c.quadraticCurveTo(x + 21, y + 5, x + 28, y); c.stroke(); }
  c.globalAlpha = 1;
  // plage
  const by = land ? h * .7 : h * .5, sw = Math.sin(t * 1.2) * 3;
  c.fillStyle = "#fffaf0"; c.beginPath(); c.moveTo(0, by - 8 + sw); c.quadraticCurveTo(w * .5, by - 40 + sw, w, by - 4 + sw); c.lineTo(w, h); c.lineTo(0, h); c.fill();
  c.fillStyle = "#fbe5bd"; c.beginPath(); c.moveTo(0, by); c.quadraticCurveTo(w * .5, by - 32, w, by + 4); c.lineTo(w, h); c.lineTo(0, h); c.fill();
  // épave
  c.save(); c.translate(land ? w * .42 : w * .76, by + (land ? 22 : 20)); c.rotate(-.16); c.scale(land ? .55 : .6, land ? .55 : .6);
  c.fillStyle = "#8a5a3c"; c.beginPath(); c.moveTo(-90, 0); c.quadraticCurveTo(-60, 40, 40, 34); c.lineTo(80, -6); c.lineTo(-90, 0); c.fill();
  c.fillStyle = "#6f4628"; for (let i = 0; i < 4; i++) c.fillRect(-70 + i * 36, 4, 4, 26); c.strokeStyle = "#6b4a2a"; c.lineWidth = 7; c.beginPath(); c.moveTo(-10, 0); c.lineTo(10, -110); c.stroke();
  c.fillStyle = "#fff7e6"; c.beginPath(); c.moveTo(12, -104); c.quadraticCurveTo(60 + sw * 2, -80, 46, -40); c.lineTo(30, -52); c.lineTo(20, -30); c.lineTo(8, -40); c.fill(); c.restore();
  // palmier
  c.save(); c.translate(land ? w * .06 : w * .1, by + (land ? 40 : 50)); const ps = land ? 3.6 : 4.4; c.scale(ps, ps); c.rotate(-.12 + Math.sin(t) * .02);
  c.strokeStyle = "#c9956b"; c.lineWidth = 2.4; c.lineCap = "round"; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(3, -8, 0, -14); c.stroke(); c.translate(0, -14); c.rotate(Math.sin(t * 1.3) * .04);
  c.fillStyle = "#6fbf6a"; for (let k = 0; k < 6; k++) { const a = -Math.PI / 2 + (k - 2.5) * .72; c.beginPath(); c.ellipse(Math.cos(a) * 6.5, Math.sin(a) * 3 + 3.5, 7.5, 2.4, a, 0, TAU); c.fill(); }
  c.fillStyle = "#a8754f"; circle(-1, 2, 1.2); circle(1.5, 2.3, 1.2); c.restore();
  // les deux personnages
  const s = land ? 2.6 : 3.2, cx = land ? w * .24 : w * .45, cy = land ? by + 52 : by + 72;
  const me1 = (typeof avatar !== "undefined" && avatar) || PIERRE_DEMO;
  c.save(); c.translate(cx - 16, cy); c.scale(s, s); c.translate(0, -14); Avatar.draw(c, me1, { t, dir: "right" }); c.restore();
  c.save(); c.translate(cx + 18, cy + 2); c.scale(s, s); c.translate(0, -14); Avatar.draw(c, ZOE_DEMO, { t: t + 1, dir: "left" }); c.restore();
  c.fillStyle = "#ff7f9f"; Avatar.heart(c, cx + 1, cy - 58 + Math.sin(t * 2) * 3, 5);
  if (land) drawLogo(c, w * .3, h * .32, Math.min(64, w * .1)); else drawLogo(c, w / 2, h * .2, Math.min(64, w * .19));
}

function showTitle() {
  clearScreen(); hud.hidden = true;
  ui.innerHTML = `<div class="screen title-screen"><canvas id="tcv"></canvas>
    <div class="title-btns">
      <button class="tbtn main" data-x="play">▶&nbsp; JOUER</button>
      <button class="tbtn" data-x="perso">👤&nbsp; Mon personnage</button>
      <button class="tbtn" data-x="settings">⚙️&nbsp; Réglages</button>
      <div class="ver">version 0.3.1 · Von</div>
    </div></div>`;
  const cvs = $("#tcv"); let alive = true; const t0 = performance.now();
  startMusic();
  (function anim() {
    if (!alive || !cvs.isConnected) return;
    const w = innerWidth, h = innerHeight;
    if (cvs.width !== Math.round(w * DPR)) { cvs.width = Math.round(w * DPR); cvs.height = Math.round(h * DPR); }
    const c = cvs.getContext("2d"); c.setTransform(DPR, 0, 0, DPR, 0, 0); titleScene(c, w, h, (performance.now() - t0) / 1000);
    requestAnimationFrame(anim);
  })();
  cleanups.push(() => { alive = false; });
  ui.querySelector(".title-screen").addEventListener("click", (e) => {
    const t = e.target.closest("[data-x]"); if (!t) return;
    buzz();
    if (t.dataset.x === "play") return avatar ? showIslands() : showCreator(true);
    if (t.dataset.x === "perso") return showCreator(!avatar, showTitle);
    if (t.dataset.x === "settings") return openSettings();
  });
}

// ================================================================ panneaux (par-dessus le jeu ou le titre)
function panel(html, cls = "") {
  closePanel();
  const d = document.createElement("div"); d.id = "panel";
  d.innerHTML = `<div class="pdim" data-close></div><div class="panel ${cls}">${html}</div>`;
  document.body.appendChild(d);
  d.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) { buzz(); closePanel(); if (G.on && !G.menuOpen) { /* rien */ } } });
  return d;
}
function closePanel() { $("#panel")?.remove(); }
function closeMenu() { closePanel(); G.menuOpen = false; }

function openMenu() {
  buzz(); G.menuOpen = true; resetInput();
  const o = [...G.others.values()][0];
  const d = panel(`<h3>Menu</h3><div class="psub"><span class="dot ${o?.online ? "on" : ""}"></span>${o ? `${esc(o.name)} ${o.online ? "est sur l'île" : "n'est pas là"} · ` : ""}le jeu continue</div>
    <button class="item main" data-m="resume"><i>▶</i>Reprendre</button>
    <button class="item" data-m="map"><i style="background:#e0f2fb">🗺️</i>Carte de l'île<span class="chev">›</span></button>
    <button class="item" data-m="bag"><i style="background:#fdf0dc">🎒</i>Sac<span class="chev">›</span></button>
    <button class="item" data-m="save"><i style="background:#e6f6ea">💾</i>Sauvegarde<span class="chev">›</span></button>
    <button class="item" data-m="perso"><i style="background:#fde3ea">👤</i>Mon personnage<span class="chev">›</span></button>
    <button class="item" data-m="settings"><i style="background:#f1ecfb">⚙️</i>Réglages<span class="chev">›</span></button>
    <button class="item" data-m="islands"><i style="background:#e8f6e6">🏝️</i>Mes îles<span class="chev">›</span></button>
    <button class="item" data-m="title"><i style="background:#fff1d9">🏠</i>Menu titre<span class="chev">›</span></button>`, "menu");
  d.querySelector(".pdim").addEventListener("click", () => { G.menuOpen = false; });
  d.querySelector(".panel").addEventListener("click", (e) => {
    const b = e.target.closest("[data-m]"); if (!b) return; buzz();
    const m = b.dataset.m;
    if (m === "resume") return closeMenu();
    if (m === "map") return openMap();
    if (m === "bag") return openBag();
    if (m === "save") return openSave();
    if (m === "settings") return openSettings(openMenu);
    if (m === "islands") return leaveGame(showIslands);
    if (m === "title") return leaveGame(showTitle);
    if (m === "perso") { closeMenu(); const id = G.session?.id; return leaveGame(() => showCreator(false, () => play(id))); }
  });
}

function openSettings(back) {
  const row = (lbl, ctl) => `<div class="item">${lbl}${ctl}</div>`;
  const tg = (k) => `<button class="tg ${SET[k] ? "on" : ""}" data-t="${k}" aria-label="${k}"></button>`;
  const seg = (k, opts) => `<span class="seg">${opts.map(([v, l]) => `<button class="${SET[k] === v ? "on" : ""}" data-s="${k}" data-v="${v}">${l}</button>`).join("")}</span>`;
  const d = panel(`<h3>Réglages</h3>
    ${row("🔊 Sons", tg("sound"))}${row("🎵 Musique", tg("music"))}${row("📳 Vibrations", tg("vibe"))}
    ${row("🔘 Taille des boutons", `<input class="sl" type="range" min="80" max="130" value="${Math.round(SET.btn * 100)}" data-r="btn">`)}
    ${row("✋ Boutons d'action", seg("lefty", [[true, "Gauche"], [false, "Droite"]]))}
    ${row("🏷️ Pseudos au-dessus", tg("names"))}
    ${row("🔍 Zoom", seg("zoom", [[.8, "−"], [1, "Normal"], [1.25, "+"]]))}
    <p class="pnote">La musique joue dans les menus. Les bruitages arriveront avec une prochaine étape.</p>
    <button class="item main center" data-done>Fermer</button>`, "settings");
  d.querySelector(".panel").addEventListener("click", (e) => {
    const t = e.target.closest("[data-t],[data-s],[data-done]"); if (!t) return; buzz();
    if (t.dataset.done !== undefined) { closePanel(); if (back) back(); else if (G.on) G.menuOpen = false; return; }
    if (t.dataset.t) { SET[t.dataset.t] = !SET[t.dataset.t]; t.classList.toggle("on", SET[t.dataset.t]); if (t.dataset.t === "music") { if (SET.music) { saveSettings(); startMusic(); } else Music.setEnabled(false); } }
    if (t.dataset.s) { const v = JSON.parse(t.dataset.v); SET[t.dataset.s] = v; t.parentNode.querySelectorAll("button").forEach((b) => b.classList.toggle("on", b === t)); }
    saveSettings(); applySettings();
  });
  d.querySelector("[data-r]").addEventListener("input", (e) => { SET.btn = Number(e.target.value) / 100; saveSettings(); applySettings(); });
  d.querySelector(".pdim").addEventListener("click", () => { if (back) back(); else if (G.on) G.menuOpen = false; });
}

// ---------------------------------------------------------------- carte de l'île
let BIGMAP = null;
// image de toute l'île (calculée une seule fois, partagée par la carte et la mini-carte)
function bigMap() {
  if (!BIGMAP) { BIGMAP = document.createElement("canvas"); BIGMAP.width = 800; BIGMAP.height = 500; KALUA.renderArea(BIGMAP, 0, 0, 2, false); }
  return BIGMAP;
}
function openMap() {
  const d = panel(`<h3>Carte de Kalua</h3><div class="mapbox"><canvas id="mapcv"></canvas><div class="spinner" id="mapspin"></div></div>
    <div class="maplegend"><span>🧭 toi</span><span>💗 ${esc([...G.others.values()][0]?.name || "ton ami")}</span><span><b class="lg c1"></b>grottes</span><span><b class="lg c2"></b>boss</span></div>
    <button class="item main center" data-back>Retour</button>`, "map");
  d.querySelector("[data-back]").addEventListener("click", () => { buzz(); openMenu(); });
  d.querySelector(".pdim").addEventListener("click", () => { G.menuOpen = false; });
  setTimeout(() => {
    $("#mapspin")?.remove();
    const cvs = $("#mapcv"); if (!cvs) return;
    const W = cvs.clientWidth, H = W * 500 / 800; cvs.style.height = H + "px"; cvs.width = W * DPR; cvs.height = H * DPR;
    const c = cvs.getContext("2d"); c.scale(DPR, DPR); c.drawImage(bigMap(), 0, 0, W, H);
    const k = W / KALUA.MW, TAU = Math.PI * 2;
    const dot = (x, y, r, col, txt, tc = "#fff") => { c.fillStyle = "#fff"; c.beginPath(); c.arc(x * k, y * k, r + 1.5, 0, TAU); c.fill(); c.fillStyle = col; c.beginPath(); c.arc(x * k, y * k, r, 0, TAU); c.fill();
      if (txt) { c.fillStyle = tc; c.font = `900 ${r * 1.2}px ui-rounded, system-ui`; c.textAlign = "center"; c.fillText(txt, x * k, y * k + r * .42); } };
    // village
    c.strokeStyle = "rgba(255,170,90,.95)"; c.setLineDash([3, 2]); c.lineWidth = 1.5; c.beginPath(); c.ellipse(KALUA.VILLAGE.x * k, KALUA.VILLAGE.y * k, 100 * k, 64 * k, 0, 0, TAU); c.stroke(); c.setLineDash([]);
    for (const b of KALUA.BOSSES) dot(b[0], b[1], 5, "#e07a2a");
    for (const cv of KALUA.CAVES) dot(cv.x, cv.y, 7, cv.kind === "pix" ? "#2f6f86" : "#f49ab0", String(cv.n));
    c.font = "800 10px ui-rounded, system-ui"; c.textAlign = "center";
    const label = (x, y, t) => { c.lineWidth = 3; c.strokeStyle = "rgba(255,250,240,.95)"; c.strokeText(t, x * k, y * k); c.fillStyle = "#5a4040"; c.fillText(t, x * k, y * k); };
    label(800, 985, "Côte Dorée"); label(300, 760, "Jungle Émeraude"); label(500, 95, "Marais des Brumes"); label(1225, 645, "Falaises des Vents"); label(985, 66, "Volcan de Kalua");
    KALUA.ISLES.forEach((I) => label(I.x, I.y + I.ry + 22, I.name + " 🔒"));
    // joueurs
    const head = (o, av, col) => { const x = o.x / KALUA.K * k, y = o.y / KALUA.K * k; c.fillStyle = col; c.beginPath(); c.arc(x, y, 11, 0, TAU); c.fill(); c.fillStyle = "#fff"; c.beginPath(); c.arc(x, y, 9.5, 0, TAU); c.fill();
      c.save(); c.beginPath(); c.arc(x, y, 9.5, 0, TAU); c.clip(); c.translate(x, y + 2); c.scale(1.35, 1.35); Avatar.draw(c, av, { t: 1 }); c.restore(); };
    for (const o of G.others.values()) if (o.has && o.avatar) head(o, o.avatar, "#ff7f9f");
    head(G.p, avatar, "#5aa8d0");
  }, 30);
}

// ---------------------------------------------------------------- sac
function openBag() {
  const d = panel(`<h3>Sac</h3><div class="bag">${Array.from({ length: 24 }, () => `<div class="slot"></div>`).join("")}</div>
    <p class="pnote">Ton sac est vide pour l'instant.<br>La récolte (bois, pierres, coquillages…) arrive à l'étape 2.</p>
    <button class="item main center" data-back>Retour</button>`, "bag-p");
  d.querySelector("[data-back]").addEventListener("click", () => { buzz(); openMenu(); });
  d.querySelector(".pdim").addEventListener("click", () => { G.menuOpen = false; });
}

// ---------------------------------------------------------------- sauvegarde
function openSave() {
  const ago = () => { const s = Math.round((Date.now() - (G.lastSave || Date.now())) / 1000); return s < 5 ? "à l'instant" : `il y a ${s} s`; };
  const d = panel(`<h3>Sauvegarde</h3>
    <div class="item">✅ Sauvegarde automatique<span class="pval">activée</span></div>
    <div class="item">🕑 Dernière sauvegarde<span class="pval" id="lastsave">${ago()}</span></div>
    <p class="pnote">Ta position, ton personnage et (bientôt) ton sac et votre village sont enregistrés en ligne, pour vous deux. Tu peux quitter quand tu veux.</p>
    <button class="item main center" data-save>💾 Sauvegarder maintenant</button>
    <button class="item center" data-back>Retour</button>`, "save-p");
  d.querySelector("[data-save]").addEventListener("click", (e) => { buzz(30); sendPos(true); G.lastSave = Date.now(); $("#lastsave").textContent = "à l'instant"; e.currentTarget.textContent = "✓ Partie sauvegardée"; });
  d.querySelector("[data-back]").addEventListener("click", () => { buzz(); openMenu(); });
  d.querySelector(".pdim").addEventListener("click", () => { G.menuOpen = false; });
}
