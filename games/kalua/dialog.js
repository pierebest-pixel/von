/* Les Échoués de Kalua — boîte de dialogue : texte qui s'écrit, choix, question libre (clavier).
 * Tout est asynchrone : `await Dialog.say(nalia, "Bonjour !")`, `const v = await Dialog.choose(…)`. */
"use strict";

const Dialog = (() => {
  let root = null, open = 0, abortFn = null;
  function ensure() {
    if (root) return root;
    root = document.createElement("div"); root.id = "dialog"; root.hidden = true;
    root.innerHTML = `<div class="dlg"><canvas class="dlg-face"></canvas><div class="dlg-main"><div class="dlg-name"></div><div class="dlg-text"></div><div class="dlg-opts"></div></div><div class="dlg-next">▼</div></div>`;
    document.body.appendChild(root);
    return root;
  }
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  function face(sp) {
    const cv = root.querySelector(".dlg-face");
    if (!sp || (!sp.avatar && !sp.draw && !sp.icon)) { cv.style.display = "none"; return; }
    cv.style.display = ""; const W = 64, H = 64; cv.width = W * DPR; cv.height = H * DPR;
    const c = cv.getContext("2d"); c.setTransform(DPR, 0, 0, DPR, 0, 0); c.clearRect(0, 0, W, H);
    c.fillStyle = sp.bg || "#fff4e6"; c.beginPath(); c.arc(32, 32, 32, 0, Math.PI * 2); c.fill();
    c.save(); c.beginPath(); c.arc(32, 32, 31, 0, Math.PI * 2); c.clip();
    if (sp.avatar) { c.translate(32, 46); c.scale(2.6, 2.6); Avatar.draw(c, sp.avatar, { t: 1, dir: "down" }); }
    else if (sp.icon) ITEMS.draw(c, sp.icon, 32, 32, 44);
    else sp.draw(c, 64, 64);
    c.restore();
  }
  function show(sp) {
    ensure(); root.hidden = false; open++;
    root.querySelector(".dlg-name").textContent = sp ? sp.name || "" : "";
    root.querySelector(".dlg-name").style.color = (sp && sp.color) || "";
    root.classList.toggle("narr", !sp || !sp.name);
    face(sp);
  }
  function hide() { open = Math.max(0, open - 1); if (!open && root) root.hidden = true; }

  // texte qui s'écrit lettre par lettre ; un toucher le termine, un second toucher continue
  function type(text, waitTap = true) {
    const el = root.querySelector(".dlg-text"), nx = root.querySelector(".dlg-next");
    const opts = root.querySelector(".dlg-opts"); opts.innerHTML = "";
    el.textContent = ""; nx.style.visibility = "hidden";
    const txt = String(text);
    return new Promise((res) => {
      let i = 0, done = false, iv;
      const finish = () => { clearInterval(iv); el.textContent = txt; done = true; nx.style.visibility = waitTap ? "visible" : "hidden"; if (!waitTap) { cleanup(); res(); } };
      iv = setInterval(() => { i += 2; el.textContent = txt.slice(0, i); if (i >= txt.length) finish(); }, 22);
      abortFn = () => { clearInterval(iv); cleanup(); res(); };
      const tap = (e) => { e.preventDefault(); e.stopPropagation(); if (!done) return finish(); cleanup(); res(); };
      const key = (e) => { if (e.key === "Enter" || e.key === " " || e.key === "e") tap(e); };
      const cleanup = () => { root.removeEventListener("pointerup", tap); removeEventListener("keydown", key); };
      setTimeout(() => { root.addEventListener("pointerup", tap); addEventListener("keydown", key); }, 120);
    });
  }

  async function say(sp, text) { show(sp); try { await type(text); } finally { hide(); } }
  async function lines(sp, list) { show(sp); try { for (const t of list) await type(t); } finally { hide(); } }
  // choix : options = [[valeur, libellé], …] ; renvoie la valeur
  async function choose(sp, text, options) {
    show(sp);
    try {
      await type(text, false);
      const box = root.querySelector(".dlg-opts");
      return await new Promise((res) => {
        box.innerHTML = options.map(([v, l], i) => `<button class="dlg-opt" data-i="${i}">${l}</button>`).join("");
        abortFn = () => { box.onclick = null; res(options[0][0]); };
        box.onclick = (e) => { const b = e.target.closest(".dlg-opt"); if (!b) return; e.stopPropagation(); box.onclick = null; if (navigator.vibrate) try { navigator.vibrate(10); } catch { /* ignore */ } res(options[Number(b.dataset.i)][0]); };
      });
    } finally { hide(); }
  }
  // question libre : un champ texte (le clavier du téléphone s'ouvre) ; renvoie le texte ou "" si annulé
  async function input(sp, text, placeholder = "Écris ta question…") {
    show(sp);
    try {
      await type(text, false);
      const box = root.querySelector(".dlg-opts");
      return await new Promise((res) => {
        box.innerHTML = `<form class="dlg-form"><input class="dlg-in" maxlength="160" autocomplete="off" enterkeyhint="send" placeholder="${placeholder}"><button class="dlg-opt send" type="submit">Envoyer</button><button class="dlg-opt ghost" type="button" data-cancel>Annuler</button></form>`;
        const inp = box.querySelector("input"); setTimeout(() => inp.focus(), 60);
        box.querySelector("form").onsubmit = (e) => { e.preventDefault(); inp.blur(); res(inp.value.trim()); };
        box.querySelector("[data-cancel]").onclick = (e) => { e.stopPropagation(); res(""); };
        box.onpointerup = (e) => e.stopPropagation();
      });
    } finally { hide(); }
  }
  // ferme tout de suite le dialogue en cours (bouton « Passer » d'une cinématique)
  function abort() { const f = abortFn; abortFn = null; if (f) f(); }
  return { say, lines, choose, input, abort, get open() { return open > 0; } };
})();
