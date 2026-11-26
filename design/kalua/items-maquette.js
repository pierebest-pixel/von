/* Icônes d'objets de Kalua (repère -12..12), style doux. */
const Items = (() => {
  const TAU = Math.PI * 2; let c;
  const circle = (x, y, r) => { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); };
  const ell = (x, y, rx, ry, r = 0) => { c.beginPath(); c.ellipse(x, y, rx, ry, r, 0, TAU); c.fill(); };
  const line = (pts, w, col) => { c.strokeStyle = col; c.lineWidth = w; c.lineCap = "round"; c.lineJoin = "round"; c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke(); };
  const f = (col) => { c.fillStyle = col; };
  const shine = (x, y, rx, ry) => { f("rgba(255,255,255,.45)"); ell(x, y, rx, ry, -.5); };
  const D = {
    bois() { f("#a8703f"); c.save(); c.rotate(-.35); c.beginPath(); c.roundRect(-10, -4.5, 18, 9, 4.5); c.fill(); f("#e8c08a"); ell(8, 0, 3.2, 4.5); f("#c9955b"); ell(8, 0, 1.8, 2.6); f("#8a5a30"); c.fillRect(-6, -4.5, 1, 9); c.fillRect(0, -4.5, 1, 9); c.restore(); },
    boisflotte() { f("#c9bcae"); c.save(); c.rotate(.25); c.beginPath(); c.roundRect(-11, -3.5, 20, 7, 3.5); c.fill(); f("#e8dfd4"); ell(9, 0, 2.6, 3.5); line([[-6, -1], [2, 1]], .8, "#a89a8a"); c.restore(); },
    feuille() { f("#5fae5a"); c.save(); c.rotate(-.6); ell(0, 0, 11, 4.5); line([[-11, 0], [11, 0]], .8, "#3f8a40"); for (let i = -8; i < 10; i += 3) { line([[i, 0], [i + 2, -4]], .6, "#3f8a40"); line([[i, 0], [i + 2, 4]], .6, "#3f8a40"); } c.restore(); },
    coco() { f("#8a5a3c"); circle(0, 1, 9); f("#a8754f"); ell(-2, -2, 5, 4); f("#5a3a26"); circle(-2.5, -1, 1); circle(1, -2.5, 1); circle(2, 1, 1); },
    coquillage() { f("#ffc6d6"); c.beginPath(); c.arc(0, 2, 10, Math.PI, 0); c.lineTo(0, 9); c.closePath(); c.fill(); for (const a of [-1.2, -.6, 0, .6, 1.2]) line([[0, 8], [Math.sin(a) * 9, 2 - Math.cos(a) * 8]], .8, "#f0a0b8"); f("#ffd8e2"); ell(-1, 7.5, 3, 1.6); },
    sable() { f("#f3d9ad"); c.beginPath(); c.moveTo(-11, 7); c.quadraticCurveTo(0, -12, 11, 7); c.closePath(); c.fill(); f("#e8c890"); for (const [x, y] of [[-4, 3], [2, 0], [5, 4], [-1, 5]]) circle(x, y, .9); f("#fff"); circle(-2, -3, 1.2); },
    cordage() { c.strokeStyle = "#c9a46a"; c.lineWidth = 3; for (let r = 3; r < 10; r += 3) { c.beginPath(); c.ellipse(0, 1, r, r * .7, 0, 0, TAU); c.stroke(); } line([[9, 2], [12, 8]], 3, "#c9a46a"); },
    perle() { f("#f4e8f0"); c.beginPath(); c.arc(0, 3, 10, Math.PI, 0); c.lineTo(0, 9); c.fill(); f("#fff"); circle(0, 1, 5); f("#e8d8f0"); circle(1.5, 2.5, 3.5); shine(-1.5, -.5, 1.6, 1); },
    liane() { c.strokeStyle = "#5fae5a"; c.lineWidth = 2.6; c.beginPath(); for (let t = 0; t < 12; t += .2) c.lineTo(-10 + t * 1.7, Math.sin(t * 1.3) * 5); c.stroke(); f("#8fd18a"); ell(-4, -5, 3, 1.6, .6); ell(6, 5, 3, 1.6, -.4); },
    bambou() { for (const [x, col] of [[-4, "#9ad06a"], [3, "#8ac05a"]]) { f(col); c.fillRect(x - 2.5, -11, 5, 22); f("#6a9a4a"); for (const y of [-5, 2]) c.fillRect(x - 3, y, 6, 1.6); } f("#8fd18a"); ell(8, -9, 4, 1.6, -.5); },
    banane() { f("#ffd84a"); c.beginPath(); c.moveTo(-10, -6); c.quadraticCurveTo(-6, 10, 10, 6); c.quadraticCurveTo(-2, 4, -7, -7); c.fill(); f("#6b4a32"); circle(-9, -7, 1.6); f("#fff3a0"); ell(-2, 3, 4, 1.4, .6); },
    champignon() { f("#f4ead8"); c.beginPath(); c.roundRect(-3, -1, 6, 10, 2); c.fill(); f("#e0566b"); c.beginPath(); c.arc(0, -1, 10, Math.PI, 0); c.closePath(); c.fill(); f("#fff"); circle(-5, -4, 1.6); circle(2, -7, 1.4); circle(5, -3, 1.2); },
    plume() { c.save(); c.rotate(.6); const g = c.createLinearGradient(0, -11, 0, 11); g.addColorStop(0, "#e8403a"); g.addColorStop(.5, "#ffd23a"); g.addColorStop(1, "#3a7ad8"); c.fillStyle = g; ell(0, -1, 4.5, 11); line([[0, -11], [0, 12]], .9, "#6b5050"); c.restore(); },
    argile() { f("#c0704a"); c.beginPath(); c.moveTo(-10, 6); c.quadraticCurveTo(-11, -6, 0, -7); c.quadraticCurveTo(11, -7, 10, 5); c.quadraticCurveTo(0, 10, -10, 6); c.fill(); f("#d8906a"); ell(-3, -3, 4, 2); },
    roseau() { for (const [x, h] of [[-4, 11], [0, 9], [4, 12]]) { line([[x, 10], [x, -h + 4]], 1.6, "#6a8a4a"); f("#7a5a3a"); ell(x, -h + 2, 1.8, 3.6); } },
    gelee() { f("rgba(120,210,140,.9)"); c.beginPath(); c.moveTo(-10, 7); c.quadraticCurveTo(-11, -8, 0, -8); c.quadraticCurveTo(11, -8, 10, 7); c.closePath(); c.fill(); shine(-4, -3, 3, 1.6); f("#2b5a2a"); circle(-3, 1, 1); circle(3, 1, 1); },
    herbe() { f("#4f9a55"); for (const a of [-.5, 0, .5]) { c.save(); c.rotate(a); ell(0, -4, 3, 7); c.restore(); } f("#9be0a8"); circle(0, -9, 2); line([[0, 2], [0, 10]], 1.6, "#4f7a40"); },
    lotus() { f("#ffb0c8"); for (let k = 0; k < 6; k++) { c.save(); c.rotate(k * TAU / 6); ell(0, -5, 3, 6); c.restore(); } f("#ffe08a"); circle(0, 0, 3); },
    pierre() { f("#a8a2a0"); c.beginPath(); c.moveTo(-10, 6); c.lineTo(-8, -4); c.lineTo(0, -8); c.lineTo(9, -3); c.lineTo(10, 6); c.closePath(); c.fill(); f("#c8c2be"); c.beginPath(); c.moveTo(-8, -4); c.lineTo(0, -8); c.lineTo(2, 0); c.lineTo(-6, 1); c.fill(); },
    silex() { f("#4a4652"); c.beginPath(); c.moveTo(-2, -11); c.lineTo(8, 4); c.lineTo(0, 10); c.lineTo(-8, 2); c.closePath(); c.fill(); f("#6a6672"); c.beginPath(); c.moveTo(-2, -11); c.lineTo(1, 2); c.lineTo(-8, 2); c.fill(); },
    fer() { f("#8a8490"); c.beginPath(); c.moveTo(-10, 6); c.lineTo(-7, -6); c.lineTo(4, -8); c.lineTo(10, 2); c.lineTo(5, 8); c.closePath(); c.fill(); f("#e8a060"); for (const [x, y] of [[-4, -1], [3, -3], [2, 4], [-6, 4]]) circle(x, y, 1.6); },
    laine() { const P = [[-5, 0], [0, -4], [5, 0], [-2, 5], [4, 5]]; f("#d8cfe0"); for (const [x, y] of P) circle(x, y, 5.8); f("#fbf8ff"); for (const [x, y] of P) circle(x, y, 5); f("#ece4f4"); circle(2, 2, 3); circle(-4, 3, 2.4); },
    obsidienne() { f("#2b2233"); c.beginPath(); c.moveTo(0, -12); c.lineTo(7, -2); c.lineTo(4, 10); c.lineTo(-6, 6); c.lineTo(-7, -4); c.closePath(); c.fill(); f("#6a5a8a"); c.beginPath(); c.moveTo(0, -12); c.lineTo(2, 0); c.lineTo(-7, -4); c.fill(); shine(1, -6, 1.4, 3); },
    soufre() { f("#ffe04a"); for (const [x, y, r] of [[-4, 2, 5], [3, 0, 6], [0, 6, 4]]) { c.beginPath(); for (let k = 0; k < 6; k++) { const a = k * TAU / 6; c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } c.fill(); } f("#fff6a0"); circle(2, -2, 1.6); },
    cristalFeu() { const g = c.createRadialGradient(0, 0, 1, 0, 0, 13); g.addColorStop(0, "rgba(255,170,80,.6)"); g.addColorStop(1, "rgba(255,170,80,0)"); c.fillStyle = g; circle(0, 0, 13); f("#ff7a3a"); c.beginPath(); c.moveTo(0, -12); c.lineTo(5, 0); c.lineTo(0, 10); c.lineTo(-5, 0); c.closePath(); c.fill(); f("#ffd06a"); c.beginPath(); c.moveTo(0, -12); c.lineTo(2, 0); c.lineTo(0, 10); c.lineTo(-1, 0); c.fill(); },
    cendre() { f("#8a807c"); c.beginPath(); c.moveTo(-11, 7); c.quadraticCurveTo(0, -9, 11, 7); c.closePath(); c.fill(); f("#a8a09c"); circle(-3, 1, 2); f("#ff8a4a"); circle(3, 4, 1); },
    viande() { f("#f4ead8"); c.save(); c.rotate(-.6); c.fillRect(4, -1.5, 8, 3); circle(12, -2, 2); circle(12, 2, 2); c.restore(); f("#c0504a"); ell(-3, 2, 8, 6, -.6); f("#e07a6a"); ell(-5, 0, 4, 2.6, -.6); },
    cuir() { f("#a8734f"); c.beginPath(); c.moveTo(-10, -7); c.quadraticCurveTo(0, -10, 10, -7); c.quadraticCurveTo(12, 0, 9, 8); c.quadraticCurveTo(0, 6, -9, 8); c.quadraticCurveTo(-12, 0, -10, -7); c.fill(); c.setLineDash([1.5, 1.5]); c.strokeStyle = "#7a4a2a"; c.lineWidth = .7; c.strokeRect(-7, -5, 14, 10); c.setLineDash([]); },
    lait() { f("#e8f4ff"); c.beginPath(); c.roundRect(-6, -6, 12, 16, 3); c.fill(); f("#fff"); c.fillRect(-6, -1, 12, 11); f("#c9a46a"); c.fillRect(-3, -11, 6, 5); f("#9fd3ef"); c.fillRect(-6, 3, 12, 3); },
    oeuf() { f("#e8cfa8"); ell(0, 1, 8.3, 10.8); f("#fbead0"); ell(0, 1, 7.5, 10); shine(-2.5, -3, 2, 3.4); f("#f0d8b8"); circle(3, 4, 1); circle(-2, 6, .8); },
    poisson() { f("#7ab8e0"); ell(-1, 0, 9, 5); c.beginPath(); c.moveTo(7, 0); c.lineTo(12, -5); c.lineTo(12, 5); c.fill(); f("#2b2230"); circle(-6, -1, 1.2); f("#a8d8f0"); ell(0, 2, 5, 1.4); },
    // fabriqués
    fil() { f("#c9a46a"); c.fillRect(-7, -9, 14, 3); c.fillRect(-7, 6, 14, 3); f("#fff3e0"); c.fillRect(-5, -6, 10, 12); c.strokeStyle = "#e8d0b0"; c.lineWidth = .8; for (let y = -5; y < 6; y += 2) { c.beginPath(); c.moveTo(-5, y); c.lineTo(5, y + 1); c.stroke(); } },
    corde() { c.strokeStyle = "#b8864a"; c.lineWidth = 4; c.beginPath(); c.ellipse(0, 0, 9, 7, 0, 0, TAU); c.stroke(); c.strokeStyle = "#d8a86a"; c.lineWidth = 1.2; c.setLineDash([2, 2]); c.stroke(); c.setLineDash([]); },
    hache() { line([[-8, 10], [5, -6]], 3, "#a8703f"); f("#a8a2a0"); c.beginPath(); c.moveTo(2, -10); c.lineTo(12, -6); c.lineTo(8, 2); c.lineTo(2, -2); c.closePath(); c.fill(); f("#c8c2be"); c.beginPath(); c.moveTo(9, -7); c.lineTo(12, -6); c.lineTo(8, 2); c.fill(); line([[2, -5], [6, -3]], 2, "#c9a46a"); },
    pioche() { line([[-6, 11], [3, -3]], 3, "#a8703f"); f("#8a8490"); c.beginPath(); c.moveTo(-10, -4); c.quadraticCurveTo(2, -12, 12, -2); c.quadraticCurveTo(2, -8, -10, -4); c.fill(); line([[1, -6], [4, -3]], 2, "#c9a46a"); },
    canne() { line([[-10, 10], [8, -10]], 2, "#a8703f"); c.strokeStyle = "#fff"; c.lineWidth = .7; c.beginPath(); c.moveTo(8, -10); c.quadraticCurveTo(12, 0, 9, 6); c.stroke(); f("#e0566b"); circle(9, 7, 2); },
    torche() { line([[-4, 11], [2, -3]], 3.4, "#8a5a3c"); const g = c.createRadialGradient(3, -6, 1, 3, -6, 10); g.addColorStop(0, "rgba(255,200,90,.7)"); g.addColorStop(1, "rgba(255,200,90,0)"); c.fillStyle = g; circle(3, -6, 10); f("#ff9a3a"); ell(3, -6, 4, 6); f("#ffe08a"); ell(3, -5, 2, 3.4); },
    collier() { c.strokeStyle = "#fff"; c.lineWidth = 1; c.beginPath(); c.arc(0, -4, 9, .1 * Math.PI, .9 * Math.PI); c.stroke(); f("#ffc6d6"); for (const a of [.25, .4, .5, .6, .75]) { const x = Math.cos(a * Math.PI) * 9, y = -4 + Math.sin(a * Math.PI) * 9; c.beginPath(); c.arc(x, y, 2.6, Math.PI, 0); c.lineTo(x, y + 2.4); c.fill(); } },
    radeau() { f("#a8703f"); for (let i = -9; i <= 7; i += 4) { c.beginPath(); c.roundRect(i, -6, 3.6, 14, 1.8); c.fill(); } line([[-10, -2], [10, -2]], 1.4, "#c9a46a"); line([[-10, 4], [10, 4]], 1.4, "#c9a46a"); line([[0, -6], [0, -13]], 1.4, "#6b4428"); f("#fff7e6"); c.beginPath(); c.moveTo(1, -13); c.lineTo(8, -8); c.lineTo(1, -6); c.fill(); },
    potion() { f("#c9b3ff"); c.beginPath(); c.arc(0, 4, 7, 0, TAU); c.fill(); f("#e8e0ff"); c.fillRect(-2.5, -9, 5, 7); f("#a8703f"); c.fillRect(-3, -11, 6, 3); shine(-3, 2, 2, 3); f("#ff7f9f"); circle(2, 6, 1.4); },
    brochette() { line([[-11, 9], [11, -9]], 1.4, "#c9a46a"); for (const [t, col] of [[-.4, "#c0504a"], [0, "#7ab8e0"], [.4, "#c0504a"]]) { f(col); circle(t * 11, -t * 9, 3.6); } },
    // bâtiments (vignettes)
    hutte() { f("#f0d2a8"); c.fillRect(-8, -2, 16, 10); f("#7a4a2a"); c.fillRect(-2, 2, 4, 6); f("#e8936a"); c.beginPath(); c.moveTo(-11, -1); c.quadraticCurveTo(0, -16, 11, -1); c.fill(); },
    feu() { f("#9a9088"); for (let k = 0; k < 7; k++) { const a = k * TAU / 7; ell(Math.cos(a) * 7, 6 + Math.sin(a) * 3, 2, 1.4); } f("#ff9a3a"); ell(0, 1, 4, 7); f("#ffe08a"); ell(0, 3, 2, 3.6); },
    cloture() { f("#c99a63"); for (const x of [-9, -3, 3, 9]) { c.beginPath(); c.moveTo(x - 1.6, 9); c.lineTo(x - 1.6, -5); c.lineTo(x, -8); c.lineTo(x + 1.6, -5); c.lineTo(x + 1.6, 9); c.fill(); } c.fillRect(-11, -2, 22, 2); c.fillRect(-11, 4, 22, 2); },
    potager() { f("#8a5a3c"); c.beginPath(); c.roundRect(-11, -4, 22, 12, 2); c.fill(); for (const x of [-6, 0, 6]) { f("#5fae5a"); ell(x, -4, 2, 4, -.3); ell(x + 1.6, -4, 2, 4, .3); f("#ff8a4a"); circle(x, 2, 1.6); } },
    atelier() { f("#a8703f"); c.fillRect(-10, -1, 20, 3); c.fillRect(-9, 2, 2.4, 8); c.fillRect(6.6, 2, 2.4, 8); f("#a8a2a0"); c.fillRect(-5, -6, 6, 5); line([[3, -1], [8, -8]], 1.6, "#8a5a3c"); f("#8a8490"); c.fillRect(6, -10, 5, 3); },
    puits() { f("#bdb3a4"); c.beginPath(); c.roundRect(-8, 0, 16, 9, 2); c.fill(); f("#5a9ac8"); ell(0, 1, 7, 2); f("#8a5a3c"); c.fillRect(-8, -10, 2, 11); c.fillRect(6, -10, 2, 11); f("#c98d5a"); c.beginPath(); c.moveTo(-11, -9); c.lineTo(0, -15); c.lineTo(11, -9); c.fill(); },
    enclos() { c.strokeStyle = "#c99a63"; c.lineWidth = 1.8; c.strokeRect(-10, -6, 20, 14); f("#b9e3a0"); c.fillRect(-9, -5, 18, 12); f("#fff"); ell(0, 1, 4, 2.4); f("#5a4a4a"); ell(-1, 0, 1.4, 1); },
    coffre() { f("#a8703f"); c.beginPath(); c.roundRect(-10, -4, 20, 12, 2); c.fill(); f("#c98d5a"); c.beginPath(); c.roundRect(-10, -9, 20, 6, 3); c.fill(); f("#ffd23a"); c.fillRect(-2, -4, 4, 5); },
    lit() { f("#c98d5a"); c.fillRect(-10, 2, 20, 6); f("#fff"); c.fillRect(-10, -2, 20, 5); f("#ff9fc0"); c.fillRect(-2, -2, 12, 5); f("#fff"); ell(-6, -2, 4, 2.4); },
  };
  const INFO = {
    bois: "Bois", boisflotte: "Bois flotté", feuille: "Feuille de palmier", coco: "Noix de coco", coquillage: "Coquillage", sable: "Sable", cordage: "Vieux cordage", perle: "Perle",
    liane: "Liane", bambou: "Bambou", banane: "Banane", champignon: "Champignon", plume: "Plume colorée", argile: "Argile", roseau: "Roseau", gelee: "Gelée gluante", herbe: "Herbe médicinale", lotus: "Lotus",
    pierre: "Pierre", silex: "Silex", fer: "Minerai de fer", laine: "Laine", obsidienne: "Obsidienne", soufre: "Soufre", cristalFeu: "Cristal de feu", cendre: "Cendre",
    viande: "Viande", cuir: "Cuir", lait: "Lait", oeuf: "Œuf", poisson: "Poisson", fil: "Fil", corde: "Corde", hache: "Hache en pierre", pioche: "Pioche", canne: "Canne à pêche", torche: "Torche",
    collier: "Collier de coquillages", radeau: "Radeau", potion: "Potion de soin", brochette: "Brochette", hutte: "Hutte", feu: "Feu de camp", cloture: "Clôture", potager: "Potager", atelier: "Établi",
    puits: "Puits", enclos: "Enclos", coffre: "Coffre partagé", lit: "Lit",
  };
  function draw(ctx, id, x, y, s) { c = ctx; c.save(); c.translate(x, y); c.scale(s, s); D[id](); c.restore(); }
  return { draw, INFO, ids: Object.keys(D) };
})();
