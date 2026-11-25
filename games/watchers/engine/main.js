/* Watchers — boucle principale, écran titre, HUD. */
"use strict";
const Game = {
  mode: "title", scale: 3, W: 130, H: 280, canvas: null, g: null,
  toScreen(tx, ty) {
    // position écran (CSS px) d'une tuile, d'après la caméra courante
    const m = World.map, mw = m.rows[0].length, mh = m.rows.length;
    let camX = World.px * T + 8 - this.W / 2, camY = World.py * T + 8 - this.H / 2;
    camX = Math.max(-8 * T, Math.min(mw * T - this.W + 8 * T, camX)); camY = Math.max(-8 * T, Math.min(mh * T - this.H + 8 * T, camY));
    return { x: (tx * T - Math.round(camX)) * this.scale, y: (ty * T - Math.round(camY)) * this.scale };
  },
  resize() {
    const w = innerWidth, h = innerHeight;
    this.scale = Math.max(2, Math.round(w / 130));
    this.W = Math.ceil(w / this.scale); this.H = Math.ceil(h / this.scale);
    this.canvas.width = this.W; this.canvas.height = this.H;
    this.canvas.style.width = this.W * this.scale + "px"; this.canvas.style.height = this.H * this.scale + "px";
    this.g.imageSmoothingEnabled = false;
  },
};

function hudHTML() {
  return `<div class="hud" hidden><button class="hud-menu" aria-label="Menu"><div><i></i><i></i><i></i></div></button>
    <div class="joy"><b></b></div><button class="btnA">A</button><button class="btnB">B</button>
    <div class="gauge" hidden><span class="gl"></span><div class="bar"><span></span></div><span class="gx"></span></div></div>`;
}
function updateHud() {
  const hud = UI.root.querySelector(".hud"); if (!hud) return;
  hud.hidden = Game.mode !== "world";
  const gauge = hud.querySelector(".gauge"), map = World.map;
  if (!map || !(map.tide || map.cold || map.dark)) { gauge.hidden = true; return; }
  gauge.hidden = false;
  const bar = gauge.querySelector(".bar span");
  if (map.tide) { const high = tideHigh(), ph = (G.save.tideSteps % 30) / 30; gauge.querySelector(".gl").textContent = "MARÉE"; bar.style.width = (high ? 100 - ph * 60 : 40 + ph * 60) + "%"; bar.style.background = "#4f86a8"; gauge.querySelector(".gx").textContent = high ? "↓ haute" : "↑ basse"; }
  if (map.cold) { gauge.querySelector(".gl").textContent = "FROID"; bar.style.width = (G.save.cold ?? 100) + "%"; bar.style.background = G.save.cold < 25 ? "#ff453a" : "#8fd0e8"; gauge.querySelector(".gx").textContent = ""; }
  if (map.dark) { gauge.querySelector(".gl").textContent = "LUMIÈRE"; bar.style.width = (G.save.light ?? 100) + "%"; bar.style.background = "#5ee0c6"; gauge.querySelector(".gx").textContent = ""; }
}

let last = performance.now();
function loop(now) {
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  if (Game.mode === "world") {
    updateWorld(dt);
    drawWorld(Game.g, Game.W, Game.H, dt);
    G.save.playTime += dt;
  }
  updateHud();
  requestAnimationFrame(loop);
}

// ------------------------------------------------------------------ Écran titre
function titleScreen() {
  Game.mode = "title";
  const t = UI.add(el(`<div class="title-screen"></div>`));
  const bg = BATTLE_BG.draw(4, 130, 282, { platforms: false });
  bg.style.cssText = "left:0;top:110px;width:100%;height:calc(100% - 110px);object-fit:cover;object-position:50% 30%"; t.append(bg);
  document.fonts.load("700 120px Silkscreen").then(() => {
    const lg = drawDripLogo("WATCHERS", "700 120px Silkscreen", { w: 820, h: 330, seed: 11 });
    lg.style.cssText = "left:3%;width:94%;top:calc(env(safe-area-inset-top) + 20px);image-rendering:auto;filter:drop-shadow(0 0 10px rgba(94,224,198,.55))"; t.append(lg);
  });
  const hero = ART.hero("down"); hero.style.cssText = "left:50%;bottom:calc(env(safe-area-inset-bottom) + 230px);width:80px;height:80px;margin-left:-40px"; t.append(hero);
  const has = G.hasSave();
  t.insertAdjacentHTML("beforeend", `<div class="tsub" style="top:calc(env(safe-area-inset-top) + 190px)">LE SOLEIL-CŒUR S'ÉTEINT</div>
    <div class="tmenu">${has ? '<button class="tbtn p" data-c>Continuer</button>' : ""}<button class="tbtn ${has ? "" : "p"}" data-n>Nouvelle partie</button></div><div class="tver">Toucher pour commencer · v1.0</div>`);
  const unlock = () => { MUSIC.unlock(); MUSIC.play("title"); removeEventListener("touchstart", unlock); removeEventListener("mousedown", unlock); };
  addEventListener("touchstart", unlock); addEventListener("mousedown", unlock);
  MUSIC.play("title");
  t.querySelector("[data-c]")?.addEventListener("click", () => { MUSIC.unlock(); G.load(); t.remove(); startWorld(); });
  t.querySelector("[data-n]").addEventListener("click", async () => {
    MUSIC.unlock();
    if (has) { const i = await UI.ask("Effacer la partie actuelle et recommencer ?", ["Non", "Oui, recommencer"]); if (i !== 1) return; }
    G.newGame(); t.remove(); await STORY.intro(); startWorld();
  });
}
function startWorld() {
  Game.mode = "world";
  loadMap(G.save.map, G.save.x, G.save.y, "down");
  G.busy = false;
}

// ------------------------------------------------------------------ Démarrage
addEventListener("load", () => {
  Game.canvas = document.getElementById("game"); Game.g = Game.canvas.getContext("2d");
  Game.resize(); addEventListener("resize", () => Game.resize());
  const root = document.getElementById("ui"); UI.init(root);
  root.insertAdjacentHTML("beforeend", hudHTML());
  Input.init(root);
  // Sauvegarde automatique
  setInterval(() => { if (Game.mode === "world" && G.save) G.write(); }, 20000);
  addEventListener("pagehide", () => { if (G.save && Game.mode !== "title") G.write(); });
  document.addEventListener("visibilitychange", () => { if (document.hidden) { MUSIC.stop(); if (G.save && Game.mode !== "title") G.write(); } else if (Game.mode === "world" && World.map) MUSIC.play(World.map.music || "region" + World.map.region); });
  if (window.Von) Von.onPause(() => MUSIC.stop());
  if (window.Von) Von.onResume(() => { if (World.map) MUSIC.play(World.map.music || "region" + World.map.region); });
  titleScreen();
  requestAnimationFrame(loop);
});
