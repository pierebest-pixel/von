/* Les Échoués de Kalua — Le Fil d'Or : le magasin de vêtements (3 000 modèles), la retouche, et l'armoire. */
"use strict";

const Shop = (() => {
  // un vêtement du catalogue → les réglages du personnage
  function toAvatar(it) {
    const f = CLOTHES.TYPES.find((t) => t.id === it.type).designs[it.design || 0].f, o = {};
    const top = (kind) => Object.assign(o, { top: kind, topColor: it.c1, topColor2: it.c2, topColor3: it.c3 || "#ffd27a", pattern: it.pattern || "uni", print: it.print || "aucun" });
    switch (it.type) {
      case "tshirt": top("tshirt"); break; case "debardeur": top("debardeur"); break; case "chemise": top("chemise"); break; case "pull": top("pull"); break;
      case "sweat": top("sweat"); break; case "blouson": top("blouson"); break; case "veste": top(f.style === "kimono" ? "kimono" : "veste"); break; case "manteau": top("manteau"); break;
      case "robe": top("robe"); break;
      case "maillot": if (f.style === "short") Object.assign(o, { bottom: "short", bottomColor: it.c1 }); else if (f.style === "robe") top("robe"); else top("maillot"); break;
      case "jupe": Object.assign(o, { bottom: "jupe", bottomColor: it.c1 }); break;
      case "short": Object.assign(o, { bottom: "short", bottomColor: it.c1 }); break;
      case "pantalon": Object.assign(o, { bottom: f.style === "jogging" || f.coupe === "slim" ? "legging" : "pantalon", bottomColor: it.c1 }); break;
      case "chaussures": Object.assign(o, { shoes: { baskets: "baskets", sandales: "sandales", bottes: "bottes", mocassins: "mocassins", ballerines: "ballerines", espadrilles: "espadrilles", tongs: "tongs" }[f.style] || "baskets", shoesColor: it.c1 }); break;
      case "chapeau": Object.assign(o, { hat: { paille: "paille", bob: "bob", casquette: "casquette", beret: "beret", bonnet: "bonnet", capeline: "capeline", melon: "melon", pirate: "pirate" }[f.style] || "bob", hatColor: it.c1 }); break;
    }
    return o;
  }
  function wear(it) {
    Object.assign(avatar, toAvatar(it)); store.set("avatar", avatar);
    if (G.session && G.session.setAvatar) G.session.setAvatar(avatar);
    keep(it, true); Music.jingle("item"); toast("👗 Tu portes : " + it.name.split(" · ")[0]);
  }
  // l'armoire : les pièces achetées / retouchées (gratuites), à remettre quand on veut
  function keep(it, quiet) { const W = Prog.P.wardrobe || (Prog.P.wardrobe = []); const k = JSON.stringify([it.type, it.design, it.c1, it.c2, it.c3, it.pattern, it.print]); if (!W.some((x) => JSON.stringify([x.type, x.design, x.c1, x.c2, x.c3, x.pattern, x.print]) === k)) { W.unshift(Object.assign({}, it)); W.length = Math.min(W.length, 120); Prog.changed(); } if (!quiet) toast("🧺 Rangé dans l'armoire."); }
  // ---------------------------------------------------------------- vignettes (dessinées au fur et à mesure qu'elles apparaissent)
  let io = null;
  function flatCanvas(it, size = 76) { const cv = document.createElement("canvas"), dpr = Math.min(2, window.devicePixelRatio || 1); cv.width = size * dpr; cv.height = size * dpr; cv.style.width = size + "px"; cv.style.height = size + "px"; cv._draw = () => { const g = cv.getContext("2d"); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, size, size); CLOTHES.drawFlat(g, it, size); }; return cv; }
  function lazy(cv) { if (!("IntersectionObserver" in window)) return cv._draw(); if (!io) io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target._draw(); io.unobserve(e.target); } }), { rootMargin: "120px" }); io.observe(cv); }
  function avatarPreview(cv, av) { const w = 150, h = 170, dpr = Math.min(2, window.devicePixelRatio || 1); cv.width = w * dpr; cv.height = h * dpr; cv.style.width = w + "px"; cv.style.height = h + "px"; const g = cv.getContext("2d"); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h); g.translate(w / 2, h * .58); g.scale(5.4, 5.4); Avatar.draw(g, av, { t: 1 }); }
  // ---------------------------------------------------------------- le magasin
  function open(from, type) {
    G.menuOpen = true; type = type || "tshirt"; const t = CLOTHES.TYPES.find((x) => x.id === type);
    const d = panel(`<h3>🧵 ${from === "couture" ? "Atelier de couture" : "Le Fil d'Or"}</h3><div class="psub">« Tout est gratuit, mon chou. Essaie, retouche, garde ce qui te plaît ! » — Rosalie</div>
      <div class="chips">${CLOTHES.TYPES.map((x) => `<button class="chip ${x.id === type ? "on" : ""}" data-type="${x.id}">${esc(x.plural)}</button>`).join("")}</div>
      <div class="psub">${esc(t.plural)} · 200 modèles</div><div class="cgrid" id="cgrid"></div>
      <button class="item" data-wr><i style="background:#fdf0dc">🧺</i>Mon armoire (${(Prog.P.wardrobe || []).length})<span class="chev">›</span></button>
      <button class="item main center" data-close>Fermer</button>`, "shop");
    const grid = d.querySelector("#cgrid"), cat = CLOTHES.catalog(type);
    cat.forEach((it, i) => { const b = document.createElement("button"); b.className = "ccard"; b.dataset.i = i; const cv = flatCanvas(it, 70); b.appendChild(cv); const n = document.createElement("div"); n.className = "cn"; n.textContent = it.name.split(" · ")[1]; b.appendChild(n); grid.appendChild(b); lazy(cv); });
    d.querySelector(".panel").addEventListener("click", (e) => {
      const el = e.target.closest("[data-type],[data-i],[data-wr],[data-close]"); if (!el) return; buzz();
      if (el.dataset.close !== undefined) { G.menuOpen = false; return; }
      if (el.dataset.type) return open(from, el.dataset.type);
      if (el.dataset.wr !== undefined) return wardrobe(() => open(from, type));
      if (el.dataset.i) return edit(Object.assign({}, cat[Number(el.dataset.i)]), () => open(from, type));
    });
    d.querySelector(".pdim").addEventListener("click", () => { G.menuOpen = false; });
  }
  // ---------------------------------------------------------------- la retouche d'une pièce
  function edit(it, back) {
    G.menuOpen = true; let slot = "c1";
    const d = panel(`<h3>✂️ Retouche</h3><div class="psub" id="ename"></div>
      <div class="erow"><canvas id="eav"></canvas><div id="eflat"></div></div>
      <div class="seg3"><button data-slot="c1" class="on">Couleur 1</button><button data-slot="c2">Couleur 2</button><button data-slot="c3">Couleur 3</button><label class="wheel">🎨<input type="color" id="ecol"></label></div>
      <div class="swatches">${CLOTHES.PALETTE.map((c) => `<button class="sw" data-col="${c}" style="background:${c}"></button>`).join("")}</div>
      <h4>Motif</h4><div class="pats">${CLOTHES.PATTERNS.map(([p, n]) => `<button class="pat" data-pat="${p}" title="${esc(n)}"><canvas data-pc="${p}"></canvas><span>${esc(n)}</span></button>`).join("")}</div>
      <h4>Imprimé</h4><div class="prints">${CLOTHES.PRINTS.map(([p, s]) => `<button class="pr" data-pr="${p}">${p === "aucun" ? "∅" : esc(s)}</button>`).join("")}</div>
      <button class="item main center" data-wear>👗 Porter</button><button class="item center" data-keep>🧺 Ranger dans l'armoire</button><button class="item center" data-back>‹ Retour au catalogue</button>`, "shop");
    const refresh = () => {
      d.querySelector("#ename").textContent = it.name.split(" · ")[0];
      avatarPreview(d.querySelector("#eav"), Object.assign({}, avatar, toAvatar(it)));
      const fb = d.querySelector("#eflat"); fb.innerHTML = ""; const cv = flatCanvas(it, 130); fb.appendChild(cv); cv._draw();
      d.querySelectorAll("[data-slot]").forEach((b) => b.classList.toggle("on", b.dataset.slot === slot)); d.querySelector("#ecol").value = it[slot] || "#ffffff";
      d.querySelectorAll("[data-col]").forEach((b) => b.classList.toggle("on", b.dataset.col === it[slot]));
      d.querySelectorAll("[data-pat]").forEach((b) => b.classList.toggle("on", b.dataset.pat === it.pattern));
      d.querySelectorAll("[data-pr]").forEach((b) => b.classList.toggle("on", b.dataset.pr === (it.print || "aucun")));
    };
    d.querySelectorAll("canvas[data-pc]").forEach((cv) => { cv.width = cv.height = 56; const g = cv.getContext("2d"); g.scale(.56, .56); CLOTHES.swatch(g, { c1: it.c1, c2: it.c2, c3: it.c3, pattern: cv.dataset.pc }); });
    d.querySelector("#ecol").addEventListener("input", (e) => { it[slot] = e.target.value; refresh(); });
    d.querySelector(".panel").addEventListener("click", (e) => {
      const el = e.target.closest("[data-slot],[data-col],[data-pat],[data-pr],[data-wear],[data-keep],[data-back]"); if (!el) return; buzz();
      if (el.dataset.slot) slot = el.dataset.slot;
      if (el.dataset.col) it[slot] = el.dataset.col;
      if (el.dataset.pat) it.pattern = el.dataset.pat;
      if (el.dataset.pr) it.print = el.dataset.pr;
      if (el.dataset.wear !== undefined) { wear(it); }
      if (el.dataset.keep !== undefined) keep(it);
      if (el.dataset.back !== undefined) return back();
      refresh();
    });
    d.querySelector(".pdim").addEventListener("click", () => { G.menuOpen = false; });
    refresh();
  }
  // ---------------------------------------------------------------- l'armoire
  function wardrobe(back) {
    G.menuOpen = true; const W = Prog.P.wardrobe || [];
    const d = panel(`<h3>🧺 Mon armoire</h3><div class="psub">${W.length} pièce${W.length > 1 ? "s" : ""} · touche pour porter</div><div class="cgrid" id="wgrid"></div>
      ${W.length ? "" : `<p class="pnote">Vide pour l'instant. Va au Fil d'Or, sur la place du village !</p>`}
      ${back ? `<button class="item center" data-back>‹ Retour</button>` : ""}<button class="item main center" data-close>Fermer</button>`, "shop");
    const grid = d.querySelector("#wgrid"); W.forEach((it, i) => { const b = document.createElement("button"); b.className = "ccard"; b.dataset.w = i; const cv = flatCanvas(it, 70); b.appendChild(cv); const n = document.createElement("div"); n.className = "cn"; n.textContent = it.name.split(" · ")[0]; b.appendChild(n); grid.appendChild(b); cv._draw(); });
    d.querySelector(".panel").addEventListener("click", (e) => { const el = e.target.closest("[data-w],[data-back],[data-close]"); if (!el) return; buzz(); if (el.dataset.close !== undefined) { G.menuOpen = false; return; } if (el.dataset.back !== undefined) return back(); wear(W[Number(el.dataset.w)]); });
    d.querySelector(".pdim").addEventListener("click", () => { G.menuOpen = false; });
  }
  return { open, edit, wardrobe, toAvatar, wear };
})();
