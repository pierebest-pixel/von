// Moteur de rendu "Drama House" : persos cubiques, décors low-poly, overlays TikTok.
// Rendu déterministe image par image : window.setup(story, timeline) puis window.frame(t) -> dataURL JPEG.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const W = 720, H = 1280;
const gl = document.createElement('canvas'); gl.width = W; gl.height = H;
const ov = document.createElement('canvas'); ov.width = W; ov.height = H;
const out = document.createElement('canvas'); out.width = W; out.height = H;
document.body.appendChild(out);
const octx = ov.getContext('2d'), fctx = out.getContext('2d');

const QS = new URLSearchParams(location.search);
const LAMBERT = QS.get('lam') === '1';
const renderer = new THREE.WebGLRenderer({ canvas: gl, antialias: QS.get('aa') !== '0', preserveDrawingBuffer: true });
renderer.setSize(W, H, false);
renderer.setPixelRatio(1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 600);

// ---------- utilitaires ----------
const C = (c) => new THREE.Color(c);
const matCache = new Map();
function M(color, o = {}) {
  const k = color + JSON.stringify(o);
  if (!matCache.has(k)) {
    const m = LAMBERT ? new THREE.MeshLambertMaterial({ color, emissive: o.e ?? 0x000000, emissiveIntensity: o.ei ?? 1, transparent: !!o.op, opacity: o.op ?? 1 }) : new THREE.MeshStandardMaterial({ color, roughness: o.r ?? 0.85, metalness: o.m ?? 0, emissive: o.e ?? 0x000000, emissiveIntensity: o.ei ?? 1, transparent: !!o.op, opacity: o.op ?? 1 });
    if (o.flat) m.flatShading = true;
    matCache.set(k, m);
  }
  return matCache.get(k);
}
function box(w, h, d, color, o = {}) {
  const g = o.round ? new RoundedBoxGeometry(w, h, d, 3, Math.min(o.round, w / 2.01, h / 2.01, d / 2.01)) : new THREE.BoxGeometry(w, h, d);
  const m = new THREE.Mesh(g, o.mat || M(color, o));
  m.castShadow = o.cast ?? true; m.receiveShadow = o.recv ?? true;
  return m;
}
function cyl(rt, rb, h, color, seg = 16, o = {}) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), o.mat || M(color, o));
  m.castShadow = o.cast ?? true; m.receiveShadow = true; return m;
}
function sph(r, color, o = {}) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, o.seg || 16, o.seg2 || 12), o.mat || M(color, o));
  m.castShadow = o.cast ?? true; m.receiveShadow = true; return m;
}
function at(obj, x, y, z, ry = 0) { obj.position.set(x, y, z); obj.rotation.y = ry; return obj; }
function grp(...ch) { const g = new THREE.Group(); ch.forEach(c => c && g.add(c)); return g; }
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ease = (t) => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
const easeOutBack = (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
function rng(seed) { let s = seed >>> 0 || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
const DEG = Math.PI / 180;

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d'); draw(x, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
function fitText(x, txt, maxW, size, weight = 800) {
  let s = size; x.font = `${weight} ${s}px P`;
  while (x.measureText(txt).width > maxW && s > 8) { s -= 2; x.font = `${weight} ${s}px P`; }
  return s;
}

// ---------- visages ----------
const faceCache = new Map();
function faceTexture(f) {
  const key = JSON.stringify(f);
  if (faceCache.has(key)) return faceCache.get(key);
  const t = canvasTex(256, 256, (x) => drawFace(x, f));
  faceCache.set(key, t); return t;
}
function drawFace(x, f) {
  const ex = f.expr || 'neutral';
  const ink = f.ink || '#1c1c1c';
  x.lineCap = 'round'; x.lineJoin = 'round';
  x.strokeStyle = ink; x.fillStyle = ink;
  const L = 88, R = 168, EY = 112, MY = 182;
  const dot = (cx, cy, rx = 11, ry = 15) => { x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, 7); x.fill(); };
  const arc = (cx, cy, r, a0, a1, w = 7) => { x.lineWidth = w; x.beginPath(); x.arc(cx, cy, r, a0, a1); x.stroke(); };
  const line = (pts, w = 7) => { x.lineWidth = w; x.beginPath(); x.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) x.lineTo(pts[i], pts[i + 1]); x.stroke(); };
  const brow = (dl, dr) => { // dl/dr: inclinaison (+ = intérieur bas = fâché)
    line([L - 24, EY - 34 - dl, L + 22, EY - 34 + dl], 7);
    line([R - 22, EY - 34 + dr, R + 24, EY - 34 - dr], 7);
  };
  const bigEye = (cx, cy, r = 20, p = 7, dx = 0, dy = 0) => {
    x.fillStyle = '#fff'; x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill();
    x.lineWidth = 5; x.strokeStyle = ink; x.stroke(); x.fillStyle = f.pupil || ink; x.beginPath(); x.arc(cx + dx, cy + dy, p, 0, 7); x.fill(); x.fillStyle = ink;
  };
  if (f.blush || ['love', 'happy', 'laugh'].includes(ex) && f.blush !== false) {
    x.fillStyle = 'rgba(255,120,130,0.35)';
    x.beginPath(); x.ellipse(L - 20, MY - 30, 20, 11, 0, 0, 7); x.fill();
    x.beginPath(); x.ellipse(R + 20, MY - 30, 20, 11, 0, 0, 7); x.fill();
    x.fillStyle = ink;
  }
  switch (ex) {
    case 'neutral': dot(L, EY); dot(R, EY); line([110, MY, 146, MY], 6); break;
    case 'happy': dot(L, EY); dot(R, EY); arc(128, MY - 22, 30, 0.25 * Math.PI, 0.75 * Math.PI, 7); break;
    case 'smile': dot(L, EY); dot(R, EY); arc(128, MY - 16, 22, 0.25 * Math.PI, 0.75 * Math.PI, 6); break;
    case 'laugh': case 'lol':
      arc(L, EY + 8, 16, Math.PI * 1.1, Math.PI * 1.9); arc(R, EY + 8, 16, Math.PI * 1.1, Math.PI * 1.9);
      x.beginPath(); x.moveTo(92, MY - 18); x.quadraticCurveTo(128, MY + 50, 164, MY - 18); x.closePath(); x.fill();
      x.fillStyle = '#e8606a'; x.beginPath(); x.ellipse(128, MY + 10, 16, 9, 0, 0, 7); x.fill(); break;
    case 'sad': dot(L, EY + 4); dot(R, EY + 4); brow(-8, -8); arc(128, MY + 18, 24, 1.2 * Math.PI, 1.8 * Math.PI, 6); break;
    case 'cry':
      arc(L, EY, 15, 0.1 * Math.PI, 0.9 * Math.PI); arc(R, EY, 15, 0.1 * Math.PI, 0.9 * Math.PI); brow(-9, -9);
      x.fillStyle = '#5ab8ff'; x.fillRect(L - 7, EY + 12, 14, 90); x.fillRect(R - 7, EY + 12, 14, 90); x.fillStyle = ink;
      x.beginPath(); x.ellipse(128, MY + 6, 20, 14, 0, 0, 7); x.fill(); break;
    case 'angry': dot(L, EY + 4, 10, 12); dot(R, EY + 4, 10, 12); brow(12, 12);
      x.fillStyle = '#fff'; x.fillRect(100, MY - 12, 56, 22); x.lineWidth = 5; x.strokeRect(100, MY - 12, 56, 22);
      line([100, MY - 1, 156, MY - 1], 3); for (let i = 1; i < 5; i++) line([100 + i * 11, MY - 12, 100 + i * 11, MY + 10], 3); x.fillStyle = ink; break;
    case 'grit':
      line([L - 18, EY - 12, L + 14, EY, L - 18, EY + 12], 7); line([R + 18, EY - 12, R - 14, EY, R + 18, EY + 12], 7);
      x.fillStyle = '#fff'; x.fillRect(102, MY - 14, 52, 24); x.lineWidth = 5; x.strokeRect(102, MY - 14, 52, 24);
      line([102, MY - 2, 154, MY - 2], 3); for (let i = 1; i < 4; i++) line([102 + i * 13, MY - 14, 102 + i * 13, MY + 10], 3); x.fillStyle = ink; break;
    case 'scared': bigEye(L, EY, 20, 6, 0, 2); bigEye(R, EY, 20, 6, 0, 2); brow(-10, -10);
      line([104, MY + 4, 114, MY - 4, 124, MY + 4, 134, MY - 4, 144, MY + 4, 152, MY - 2], 5); break;
    case 'shock': bigEye(L, EY, 22, 7); bigEye(R, EY, 22, 7); brow(-12, -12);
      x.beginPath(); x.ellipse(128, MY + 2, 15, 20, 0, 0, 7); x.fill(); break;
    case 'worried': dot(L, EY + 2); dot(R, EY + 2); brow(-7, -7);
      line([104, MY, 116, MY - 8, 128, MY, 140, MY - 8, 152, MY], 5); break;
    case 'sleep': line([L - 16, EY + 4, L + 16, EY + 4], 6); line([R - 16, EY + 4, R + 16, EY + 4], 6); x.beginPath(); x.ellipse(128, MY, 9, 7, 0, 0, 7); x.fill(); break;
    case 'dead': line([L - 14, EY - 14, L + 14, EY + 14], 7); line([L + 14, EY - 14, L - 14, EY + 14], 7);
      line([R - 14, EY - 14, R + 14, EY + 14], 7); line([R + 14, EY - 14, R - 14, EY + 14], 7);
      line([104, MY, 152, MY], 6); x.fillStyle = '#e8606a'; x.fillRect(132, MY, 16, 18); x.fillStyle = ink; break;
    case 'evil': dot(L, EY + 4, 10, 10); dot(R, EY + 4, 10, 10); brow(14, 14);
      x.beginPath(); x.moveTo(84, MY - 20); x.quadraticCurveTo(128, MY + 40, 172, MY - 20); x.quadraticCurveTo(128, MY + 6, 84, MY - 20); x.fill();
      x.fillStyle = '#fff'; for (let i = 0; i < 6; i++) { x.beginPath(); x.moveTo(98 + i * 11, MY - 6 + Math.abs(i - 2.5) * -2); x.lineTo(104 + i * 11, MY + 6); x.lineTo(110 + i * 11, MY - 6 + Math.abs(i - 2.5) * -2); x.fill(); } x.fillStyle = ink; break;
    case 'love': ['#e8344f'].forEach(col => { x.fillStyle = col; [L, R].forEach(cx => { x.beginPath(); x.moveTo(cx, EY + 16); x.bezierCurveTo(cx - 30, EY - 4, cx - 14, EY - 24, cx, EY - 8); x.bezierCurveTo(cx + 14, EY - 24, cx + 30, EY - 4, cx, EY + 16); x.fill(); }); });
      x.fillStyle = ink; arc(128, MY - 22, 28, 0.25 * Math.PI, 0.75 * Math.PI, 7); break;
    case 'smug': line([L - 16, EY, L + 16, EY], 7); dot(L, EY + 6, 9, 7); line([R - 16, EY, R + 16, EY], 7); dot(R, EY + 6, 9, 7);
      x.lineWidth = 6; x.beginPath(); x.moveTo(108, MY); x.quadraticCurveTo(140, MY + 10, 156, MY - 10); x.stroke(); break;
    case 'zombie': bigEye(L, EY, 22, 5, 3, 4); bigEye(R, EY - 4, 14, 4, -2, 2);
      x.beginPath(); x.moveTo(98, MY - 8); x.lineTo(160, MY - 12); x.lineTo(152, MY + 18); x.lineTo(104, MY + 16); x.closePath(); x.fill();
      x.fillStyle = '#fff'; x.fillRect(110, MY - 9, 9, 9); x.fillRect(136, MY - 10, 9, 9); x.fillStyle = ink; break;
    case 'determined': dot(L, EY + 2, 10, 13); dot(R, EY + 2, 10, 13); brow(9, 9); line([110, MY, 146, MY], 7); break;
    case 'talk': dot(L, EY); dot(R, EY); x.beginPath(); x.ellipse(128, MY, 16, 11, 0, 0, 7); x.fill(); break;
    case 'blank': break;
  }
  if (f.lashes) { line([L - 10, EY - 16, L - 18, EY - 24], 4); line([R + 10, EY - 16, R + 18, EY - 24], 4); }
  if (f.lips) { x.fillStyle = f.lips; x.beginPath(); x.ellipse(128, MY + 2, 13, 6, 0, 0, 7); x.globalAlpha = .55; x.fill(); x.globalAlpha = 1; x.fillStyle = ink; }
  if (f.glasses) { x.lineWidth = 7; x.strokeStyle = f.glassesColor || ink; x.beginPath(); x.arc(L, EY, 28, 0, 7); x.stroke(); x.beginPath(); x.arc(R, EY, 28, 0, 7); x.stroke(); line([L + 28, EY, R - 28, EY], 6); line([L - 28, EY - 4, 20, EY - 10], 6); line([R + 28, EY - 4, 236, EY - 10], 6); x.strokeStyle = ink; }
  if (f.sunglasses) { x.fillStyle = '#111'; x.beginPath(); x.roundRect(48, EY - 26, 72, 44, 12); x.fill(); x.beginPath(); x.roundRect(136, EY - 26, 72, 44, 12); x.fill(); x.fillRect(110, EY - 20, 36, 10); x.fillStyle = 'rgba(255,255,255,.35)'; x.fillRect(60, EY - 18, 18, 8); x.fillRect(148, EY - 18, 18, 8); x.fillStyle = ink; }
  if (f.mustache) { x.fillStyle = f.mustache === true ? '#5b3a24' : f.mustache; x.beginPath(); x.ellipse(110, MY - 22, 22, 9, 0.2, 0, 7); x.ellipse(146, MY - 22, 22, 9, -0.2, 0, 7); x.fill(); x.fillStyle = ink; }
  if (f.beard) { x.fillStyle = f.beard === true ? '#4a3020' : f.beard; x.globalAlpha = .9; x.beginPath(); x.moveTo(30, 150); x.quadraticCurveTo(128, 300, 226, 150); x.lineTo(226, 256); x.lineTo(30, 256); x.fill(); x.globalAlpha = 1; x.fillStyle = ink; if (['happy', 'smile', 'talk', 'neutral', 'sad'].includes(ex)) { x.fillStyle = '#2a1a10'; x.beginPath(); x.ellipse(128, MY + 6, 18, 6, 0, 0, 7); x.fill(); } }
  if (f.scar) { x.strokeStyle = '#9b3b3b'; line([R - 10, EY - 40, R + 20, EY + 40], 5); x.strokeStyle = ink; }
  if (f.blood) { x.fillStyle = '#b3121b'; x.beginPath(); x.ellipse(70, 40, 26, 18, .4, 0, 7); x.fill(); x.fillRect(62, 40, 10, 70); x.fillRect(80, 46, 8, 40); x.fillStyle = ink; }
  if (f.sweat) { x.fillStyle = '#5ab8ff'; x.beginPath(); x.moveTo(212, 20); x.quadraticCurveTo(232, 52, 212, 60); x.quadraticCurveTo(192, 52, 212, 20); x.fill(); x.fillStyle = '#fff'; x.fillRect(206, 44, 5, 8); x.fillStyle = ink; }
}

// ---------- personnages ----------
const SKIN = { light: '#f2d2b0', pale: '#f7e0c8', tan: '#d9a27a', brown: '#8d5a3b', dark: '#5e3a26', zombie: '#9bbf8a', ghost: '#e8eef5', yellow: '#f2cf5b' };
function makeChar(def) {
  const d = Object.assign({ skin: 'light', shirt: '#4a8fe0', pants: '#2b2f3a', shoes: '#1d1d1d', hair: 'short', hairColor: '#5b3a24', scale: 1 }, def);
  const skin = SKIN[d.skin] || d.skin;
  const root = new THREE.Group();
  const body = new THREE.Group(); root.add(body); // body bouge (bob, lean)
  const hips = new THREE.Group(); hips.position.y = 0.92; body.add(hips);
  const torso = box(0.78, 0.8, 0.42, d.shirt, { round: 0.06 }); torso.position.y = 0.4; hips.add(torso);
  if (d.tie) { const t = box(0.1, 0.55, 0.04, d.tie, { round: 0.02 }); t.position.set(0, 0.47, 0.22); hips.add(t); const col = box(0.42, 0.08, 0.06, '#f4f4f4'); col.position.set(0, 0.78, 0.19); hips.add(col); }
  if (d.logo) { const l = new THREE.Mesh(new THREE.CircleGeometry(0.14, 24), M(d.logo)); l.position.set(0, 0.45, 0.215); hips.add(l); }
  if (d.stripe) { const s = box(0.8, 0.12, 0.44, d.stripe); s.position.y = 0.45; hips.add(s); }
  if (d.apron) { const a = box(0.6, 0.75, 0.03, d.apron); a.position.set(0, 0.18, 0.225); hips.add(a); }
  if (d.vest) { [-0.26, 0.26].forEach(xx => { const v = box(0.24, 0.8, 0.44, d.vest, { round: 0.04 }); v.position.set(xx, 0.4, 0.005); hips.add(v); }); }
  if (d.robe) { d.dress = d.robe; d.long = true; }
  if (d.dress) { const L = d.long ? 0.98 : 0.75; const sk = new THREE.Mesh(new THREE.CylinderGeometry(0.42, d.dressFlare || (d.long ? 0.56 : 0.62), L, 20), M(d.dress)); sk.castShadow = true; sk.position.y = d.long ? -0.44 : -0.3; hips.add(sk); }
  if (d.cape) { const cp = box(0.8, 1.3, 0.05, d.cape); cp.position.set(0, 0.05, -0.25); cp.rotation.x = 0.08; hips.add(cp); }
  const neck = new THREE.Group(); neck.position.y = 0.8; hips.add(neck);
  const head = new THREE.Group(); head.position.y = 0.33; neck.add(head);
  const headMesh = box(0.62, 0.62, 0.6, skin, { round: 0.1 }); head.add(headMesh);
  const facePlane = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.56), new THREE.MeshStandardMaterial({ transparent: true, roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -2 }));
  facePlane.position.z = 0.302; head.add(facePlane);
  addHair(head, d);
  if (d.headphones) { const hb = box(0.7, 0.08, 0.12, '#222'); hb.position.y = 0.36; head.add(hb); [-0.34, 0.34].forEach(xx => { const e = box(0.1, 0.24, 0.24, d.headphones, { round: 0.04 }); e.position.set(xx, 0.02, 0); head.add(e); }); }
  const arm = (side) => {
    const p = new THREE.Group(); p.position.set(side * 0.53, 0.72, 0); hips.add(p);
    const sleeve = box(0.27, d.shortSleeve ? 0.35 : 0.72, 0.3, d.sleeve || d.shirt, { round: 0.05 }); sleeve.position.y = d.shortSleeve ? -0.15 : -0.32; p.add(sleeve);
    if (d.shortSleeve) { const fa = box(0.24, 0.42, 0.26, skin, { round: 0.05 }); fa.position.y = -0.5; p.add(fa); }
    const hand = box(0.25, 0.2, 0.28, d.gloves || skin, { round: 0.06 }); hand.position.y = -0.76; p.add(hand);
    p.userData.hand = hand; return p;
  };
  const armL = arm(-1), armR = arm(1);
  const leg = (side) => {
    const p = new THREE.Group(); p.position.set(side * 0.2, 0.92, 0); body.add(p);
    const l = box(0.34, d.shorts ? 0.4 : 0.8, 0.36, d.pants, { round: 0.05 }); l.position.y = d.shorts ? -0.2 : -0.4; p.add(l);
    if (d.shorts) { const k = box(0.3, 0.38, 0.32, skin, { round: 0.04 }); k.position.y = -0.6; p.add(k); }
    const sh = box(0.36, 0.16, 0.46, d.shoes, { round: 0.05 }); sh.position.set(0, -0.86, 0.05); p.add(sh);
    return p;
  };
  const legL = leg(-1), legR = leg(1);
  if (d.dress) { legL.scale.set(0.8, 1, 0.8); legR.scale.set(0.8, 1, 0.8); }
  if (d.prop) { const pr = makeHeld(d.prop); armR.userData.hand.add(pr); }
  root.scale.setScalar(d.scale);
  root.userData = { d, body, hips, torso, neck, head, facePlane, armL, armR, legL, legR, faceKey: null };
  root.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return root;
}
function addHair(head, d) {
  const hc = d.hairColor; const h = d.hair;
  const add = (w, hh, dd, x, y, z, col = hc, r = 0.05) => { const b = box(w, hh, dd, col, { round: r }); b.position.set(x, y, z); head.add(b); return b; };
  switch (h) {
    case 'short': add(0.68, 0.2, 0.66, 0, 0.32, -0.01); add(0.68, 0.4, 0.14, 0, 0.12, -0.28); break;
    case 'side': add(0.66, 0.2, 0.66, 0, 0.33, -0.01); add(0.16, 0.36, 0.5, -0.33, 0.12, -0.05, hc, 0.08); add(0.16, 0.36, 0.5, 0.33, 0.12, -0.05, hc, 0.08); add(0.68, 0.4, 0.14, 0, 0.12, -0.28); add(0.5, 0.1, 0.2, -0.05, 0.27, 0.27); break;
    case 'long': add(0.7, 0.2, 0.68, 0, 0.32, -0.01); add(0.72, 0.9, 0.2, 0, -0.08, -0.27); add(0.14, 0.7, 0.4, -0.35, 0.02, -0.08); add(0.14, 0.7, 0.4, 0.35, 0.02, -0.08); break;
    case 'bun': add(0.68, 0.18, 0.66, 0, 0.32, -0.01); add(0.68, 0.36, 0.14, 0, 0.14, -0.28); { const b = sph(0.17, hc); b.position.set(0, 0.5, -0.1); head.add(b); } break;
    case 'granny': add(0.68, 0.18, 0.66, 0, 0.32, -0.01, hc, 0.08); add(0.68, 0.36, 0.14, 0, 0.14, -0.28); { const b = sph(0.2, hc); b.position.set(0, 0.5, -0.06); head.add(b); } break;
    case 'pigtails': add(0.68, 0.2, 0.66, 0, 0.32, -0.01); add(0.68, 0.4, 0.14, 0, 0.12, -0.28); [-1, 1].forEach(sd => { const b = sph(0.16, hc); b.position.set(sd * 0.4, 0.18, -0.12); head.add(b); const t = box(0.16, 0.4, 0.16, hc, { round: 0.07 }); t.position.set(sd * 0.44, -0.05, -0.14); head.add(t); }); add(0.5, 0.1, 0.18, 0, 0.27, 0.28); break;
    case 'pony': add(0.68, 0.2, 0.66, 0, 0.32, -0.01); add(0.68, 0.4, 0.14, 0, 0.12, -0.28); add(0.18, 0.55, 0.18, 0, -0.05, -0.42, hc, 0.08); break;
    case 'afro': { const b = new THREE.Mesh(new RoundedBoxGeometry(0.86, 0.5, 0.82, 3, 0.2), M(hc)); b.castShadow = true; b.position.set(0, 0.36, -0.06); head.add(b); } break;
    case 'curly': for (let i = 0; i < 9; i++) { const b = sph(0.15, hc); b.position.set(-0.24 + (i % 3) * 0.24, 0.34 + (i % 2) * 0.04, -0.2 + Math.floor(i / 3) * 0.2); head.add(b); } add(0.66, 0.36, 0.14, 0, 0.14, -0.28); break;
    case 'spiky': add(0.68, 0.16, 0.66, 0, 0.31, -0.01); for (let i = 0; i < 7; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.3, 5), M(hc)); c.position.set(-0.24 + (i % 4) * 0.16, 0.48, -0.15 + Math.floor(i / 4) * 0.25); c.rotation.x = 0.3; c.castShadow = true; head.add(c); } add(0.66, 0.4, 0.12, 0, 0.12, -0.28); break;
    case 'mohawk': add(0.14, 0.35, 0.6, 0, 0.42, -0.02); break;
    case 'cap': add(0.68, 0.22, 0.66, 0, 0.34, -0.01, d.capColor || '#d33'); add(0.6, 0.05, 0.3, 0, 0.25, 0.42, d.capColor || '#d33'); add(0.68, 0.3, 0.12, 0, 0.12, -0.28); break;
    case 'beanie': add(0.7, 0.3, 0.68, 0, 0.32, -0.01, d.capColor || '#c33', 0.12); add(0.72, 0.08, 0.7, 0, 0.18, -0.01, d.capColor2 || '#eee'); break;
    case 'chef': add(0.66, 0.16, 0.66, 0, 0.32, -0.01, '#f5f5f5'); { const c = cyl(0.3, 0.26, 0.4, '#f5f5f5'); c.position.y = 0.55; head.add(c); const s = sph(0.34, '#f5f5f5'); s.position.y = 0.82; s.scale.y = 0.6; head.add(s); } break;
    case 'bald': if (d.ring !== false) { add(0.64, 0.22, 0.14, 0, 0.05, -0.28); add(0.08, 0.2, 0.4, -0.33, 0.05, -0.08); add(0.08, 0.2, 0.4, 0.33, 0.05, -0.08); } break;
    case 'none': break;
    case 'hood': add(0.76, 0.78, 0.66, 0, 0.04, -0.1, hc, 0.14); add(0.1, 0.5, 0.12, -0.33, -0.02, 0.24, hc, 0.04); add(0.1, 0.5, 0.12, 0.33, -0.02, 0.24, hc, 0.04); add(0.6, 0.12, 0.12, 0, 0.32, 0.24, hc, 0.04); break;
  }
  if (d.hat === 'top') { const c = cyl(0.25, 0.25, 0.45, '#111'); c.position.y = 0.6; head.add(c); const b = cyl(0.42, 0.42, 0.04, '#111'); b.position.y = 0.38; head.add(b); }
  if (d.hat === 'party') { const c = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.45, 12), M('#ff4fa3')); c.position.y = 0.6; head.add(c); }
  if (d.hat === 'crown') { const c = cyl(0.26, 0.26, 0.2, '#f4c430', 6, { m: 0.6, r: 0.3 }); c.position.y = 0.42; head.add(c); }
  if (d.hat === 'nurse') { add(0.5, 0.14, 0.3, 0, 0.42, 0.05, '#fff'); }
  if (d.hat === 'police') { add(0.7, 0.18, 0.68, 0, 0.38, 0, '#1b2a4a'); add(0.6, 0.04, 0.24, 0, 0.3, 0.4, '#111'); }
}
// objets tenus en main
function makeHeld(type) {
  const g = new THREE.Group();
  switch (type) {
    case 'phone': { const p = box(0.1, 0.2, 0.03, '#111'); p.position.set(0, -0.12, 0.15); g.add(p); } break;
    case 'ticket': { const p = box(0.28, 0.02, 0.18, '#fff5c8'); p.position.set(0, -0.12, 0.2); g.add(p); } break;
    case 'croissant': { const p = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.05, 8, 12, Math.PI * 1.3), M('#d9952e')); p.position.set(0, -0.12, 0.18); g.add(p); } break;
    case 'plane': { const p = makeProp({ type: 'paperplane' }); p.scale.setScalar(0.6); p.position.set(0, -0.15, 0.2); g.add(p); } break;
    case 'pepper': { const p = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.28, 8), M('#e01b1b', { r: 0.4 })); p.rotation.x = Math.PI; p.position.set(0, -0.2, 0.15); g.add(p); } break;
    case 'flashlight': { const p = cyl(0.05, 0.06, 0.3, '#333'); p.rotation.x = Math.PI / 2; p.position.set(0, -0.12, 0.2); g.add(p); const l = new THREE.SpotLight(0xfff3c8, 18, 14, 0.45, 0.5, 1.2); l.position.set(0, -0.12, 0.3); const tg = new THREE.Object3D(); tg.position.set(0, -0.6, 5); g.add(tg); l.target = tg; g.add(l); } break;
    case 'knife': { const p = box(0.04, 0.4, 0.08, '#ddd', { m: 0.8, r: 0.2 }); p.position.set(0, -0.35, 0.1); g.add(p); const h = box(0.06, 0.16, 0.1, '#3a2a1a'); h.position.set(0, -0.12, 0.1); g.add(h); } break;
    case 'salad': { const p = cyl(0.16, 0.1, 0.1, '#fff'); p.position.set(0, -0.15, 0.2); g.add(p); const s = sph(0.14, '#4caf50'); s.scale.y = 0.5; s.position.set(0, -0.08, 0.2); g.add(s); } break;
    case 'brain': { const p = sph(0.13, '#f08fa6'); p.position.set(0, -0.12, 0.2); g.add(p); } break;
    case 'money': { const p = box(0.26, 0.04, 0.14, '#5fbf5f'); p.position.set(0, -0.12, 0.2); g.add(p); } break;
    case 'trophy': { const c = cyl(0.14, 0.06, 0.2, '#f4c430', 16, { m: 0.7, r: 0.3 }); c.position.set(0, -0.05, 0.2); g.add(c); } break;
    case 'flower': { const s = cyl(0.015, 0.015, 0.4, '#3c8d3c'); s.position.set(0, -0.0, 0.18); g.add(s); const f = sph(0.08, '#ff5c8a'); f.position.set(0, 0.2, 0.18); g.add(f); } break;
    case 'bottle': { const s = cyl(0.06, 0.06, 0.28, '#e9e9e9'); s.position.set(0, -0.12, 0.18); g.add(s); } break;
    case 'bag': { const s = box(0.4, 0.4, 0.15, '#7a4b2a'); s.position.set(0, -0.35, 0.0); g.add(s); } break;
    case 'medal': { const s = cyl(0.12, 0.12, 0.03, '#f4c430', 16, { m: .7 }); s.rotation.x = Math.PI / 2; s.position.set(0, -0.12, 0.2); g.add(s); } break;
  }
  return g;
}

// ---------- animations ----------
function pose(ch, anim, t, k = 1) {
  const u = ch.userData; const { body, hips, neck, head, armL, armR, legL, legR } = u;
  // reset
  body.position.set(0, 0, 0); body.rotation.set(0, 0, 0); hips.rotation.set(0, 0, 0); hips.position.y = 0.92;
  head.rotation.set(0, 0, 0); neck.rotation.set(0, 0, 0);
  for (const a of [armL, armR, legL, legR]) a.rotation.set(0, 0, 0);
  armL.rotation.z = 0.06; armR.rotation.z = -0.06;
  const s = Math.sin, c = Math.cos;
  const br = s(t * 2.2) * 0.012;
  hips.position.y += br;
  switch (anim) {
    case 'idle': head.rotation.y = s(t * 0.7) * 0.06; break;
    case 'talk': head.rotation.y = s(t * 1.3) * 0.1; head.rotation.x = s(t * 5) * 0.04; armR.rotation.x = -0.35 + s(t * 3) * 0.25; armR.rotation.z = -0.15; break;
    case 'walk': case 'run': {
      const sp = anim === 'run' ? 11 : 6.5, am = anim === 'run' ? 0.95 : 0.55;
      legL.rotation.x = s(t * sp) * am; legR.rotation.x = -s(t * sp) * am;
      armL.rotation.x = -s(t * sp) * am * 0.9; armR.rotation.x = s(t * sp) * am * 0.9;
      body.position.y = Math.abs(s(t * sp)) * (anim === 'run' ? 0.12 : 0.05);
      if (anim === 'run') hips.rotation.x = 0.18; break;
    }
    case 'dance': {
      const b = t * 8.4;
      body.position.y = Math.abs(s(b)) * 0.12 - 0.05; hips.rotation.z = s(b) * 0.18; hips.rotation.y = s(b / 2) * 0.3;
      armL.rotation.z = 1.2 + s(b) * 0.9; armR.rotation.z = -1.2 + s(b) * 0.9; armL.rotation.x = -0.5; armR.rotation.x = -0.5;
      legL.rotation.z = -0.25 - s(b) * 0.2; legR.rotation.z = 0.25 - s(b) * 0.2; head.rotation.z = s(b) * 0.15; break;
    }
    case 'squat': { // genoux pliés, se retient
      const b = t * 7; body.position.y = -0.18 + Math.abs(s(b)) * 0.06; legL.rotation.z = -0.35; legR.rotation.z = 0.35; hips.rotation.z = s(b) * 0.12;
      armL.rotation.z = 0.5; armR.rotation.z = -0.5; armL.rotation.x = -0.6; armR.rotation.x = -0.6; head.rotation.z = s(b) * 0.08; break;
    }
    case 'cheer': case 'armsup': armL.rotation.z = 2.6 + s(t * 9) * 0.25; armR.rotation.z = -2.6 - s(t * 9) * 0.25; body.position.y = Math.abs(s(t * 6)) * 0.25; head.rotation.x = -0.15; break;
    case 'jump': { const p = Math.abs(s(t * 4.5)); body.position.y = p * 0.7; armL.rotation.z = 2.4 * p + 0.2; armR.rotation.z = -2.4 * p - 0.2; legL.rotation.x = -0.3 * p; legR.rotation.x = 0.3 * p; break; }
    case 'wave': armR.rotation.z = -2.5; armR.rotation.x = s(t * 10) * 0.35; head.rotation.z = 0.08; break;
    case 'point': armR.rotation.x = -1.5; armR.rotation.z = -0.1; head.rotation.y = 0.05; break;
    case 'phone': armR.rotation.x = -2.2; armR.rotation.z = 0.55; armR.rotation.y = 0; head.rotation.z = -0.1; head.rotation.y = s(t) * 0.1; break;
    case 'hold': armR.rotation.x = -1.2; armL.rotation.x = -1.2; armL.rotation.z = -0.15; armR.rotation.z = 0.15; break;
    case 'give': armR.rotation.x = -1.35 + s(t * 2) * 0.05; break;
    case 'eat': armR.rotation.x = -2.2 + Math.max(0, s(t * 6)) * 0.4; armR.rotation.z = 0.6; head.rotation.x = s(t * 12) * 0.05; break;
    case 'cry': armL.rotation.x = -2.6; armR.rotation.x = -2.6; armL.rotation.z = -0.35; armR.rotation.z = 0.35; head.rotation.x = 0.25 + s(t * 9) * 0.04; hips.rotation.x = 0.15; body.position.y = s(t * 9) * 0.015; break;
    case 'sadidle': head.rotation.x = 0.3; hips.rotation.x = 0.08; armL.rotation.z = 0.02; armR.rotation.z = -0.02; break;
    case 'shake': case 'scared': body.position.x = s(t * 60) * 0.025; armL.rotation.x = -1.0; armR.rotation.x = -1.0; armL.rotation.z = -0.5; armR.rotation.z = 0.5; legL.rotation.z = 0.08; legR.rotation.z = -0.08; break;
    case 'panic': armL.rotation.z = 2.8 + s(t * 20) * 0.3; armR.rotation.z = -2.8 - s(t * 20) * 0.3; head.rotation.y = s(t * 8) * 0.3; body.position.x = s(t * 40) * 0.03; break;
    case 'sit': legL.rotation.x = -1.57; legR.rotation.x = -1.57; body.position.y = -0.45; body.position.z = 0.0; armL.rotation.x = -0.6; armR.rotation.x = -0.6; head.rotation.y = s(t * 0.6) * 0.06; break;
    case 'sitsad': legL.rotation.x = -1.57; legR.rotation.x = -1.57; body.position.y = -0.45; hips.rotation.x = 0.25; head.rotation.x = 0.3; armL.rotation.x = -0.9; armR.rotation.x = -0.9; break;
    case 'sittalk': legL.rotation.x = -1.57; legR.rotation.x = -1.57; body.position.y = -0.45; armR.rotation.x = -0.8 + s(t * 3) * 0.3; head.rotation.y = s(t * 1.3) * 0.1; break;
    case 'lie': body.rotation.x = -Math.PI / 2; body.position.set(0, 0.22, -0.9); head.rotation.y = 0; break;
    case 'liebed': body.rotation.x = -Math.PI / 2 + 0.25; body.position.set(0, 0.95, -0.7); armL.rotation.z = 0.15; armR.rotation.z = -0.15; break;
    case 'dead': body.rotation.z = Math.PI / 2; body.position.set(-0.25, 0.22, 0); armL.rotation.z = 0.8; legR.rotation.z = 0.3; break;
    case 'fall': { const p = clamp(t / 0.6); body.rotation.x = -p * Math.PI / 2; body.position.y = 0.22 * p; body.position.z = -0.9 * p; armL.rotation.z = 2.2 * p; armR.rotation.z = -2.2 * p; break; }
    case 'zombie': armL.rotation.x = -1.5; armR.rotation.x = -1.4 + s(t * 2) * 0.1; head.rotation.z = 0.3 + s(t * 1.5) * 0.08; head.rotation.x = 0.15; hips.rotation.z = s(t * 3) * 0.08; legL.rotation.x = s(t * 3) * 0.25; legR.rotation.x = -s(t * 3) * 0.25; break;
    case 'zombieidle': armL.rotation.x = -1.4; armR.rotation.x = -1.5; head.rotation.z = 0.3 + s(t * 1.5) * 0.08; hips.rotation.z = s(t * 1.2) * 0.05; break;
    case 'think': armR.rotation.x = -2.3; armR.rotation.z = 0.8; head.rotation.z = 0.12; head.rotation.x = -0.1; break;
    case 'facepalm': armR.rotation.x = -2.7; armR.rotation.z = 0.5; head.rotation.x = 0.3; break;
    case 'hug': armL.rotation.x = -1.4; armR.rotation.x = -1.4; armL.rotation.z = -0.5; armR.rotation.z = 0.5; break;
    case 'kneel': legL.rotation.x = -1.4; legR.rotation.x = 0.1; body.position.y = -0.5; armR.rotation.x = -1.2; head.rotation.x = 0.2; break;
    case 'pray': armL.rotation.x = -1.9; armR.rotation.x = -1.9; armL.rotation.z = -0.45; armR.rotation.z = 0.45; head.rotation.x = 0.3; break;
    case 'type': armL.rotation.x = -1.2 + s(t * 20) * 0.08; armR.rotation.x = -1.2 - s(t * 20) * 0.08; legL.rotation.x = -1.57; legR.rotation.x = -1.57; body.position.y = -0.45; break;
    case 'stomp': legR.rotation.x = -Math.max(0, s(t * 8)) * 0.7; armL.rotation.z = 0.5; armR.rotation.z = -0.5; armL.rotation.x = -0.3; armR.rotation.x = -0.3; break;
    case 'sneak': { const sp = 4; hips.rotation.x = 0.35; legL.rotation.x = s(t * sp) * 0.4; legR.rotation.x = -s(t * sp) * 0.4; armL.rotation.x = -0.9; armR.rotation.x = -0.9; body.position.y = -0.1; break; }
    case 'float': body.position.y = 0.3 + s(t * 2) * 0.12; armL.rotation.z = 0.5; armR.rotation.z = -0.5; break;
    case 'drive': legL.rotation.x = -1.57; legR.rotation.x = -1.57; body.position.y = -0.45; armL.rotation.x = -1.2; armR.rotation.x = -1.2; head.rotation.y = s(t * 0.8) * 0.08; break;
    case 'run_scared': { const sp = 12; legL.rotation.x = s(t * sp) * 1; legR.rotation.x = -s(t * sp) * 1; armL.rotation.z = 2.6 + s(t * sp) * .3; armR.rotation.z = -2.6 - s(t * sp) * .3; body.position.y = Math.abs(s(t * sp)) * .12; break; }
    case 'hot': body.position.x = s(t * 50) * 0.03; armL.rotation.z = 0.9 + s(t * 14) * 0.5; armR.rotation.z = -0.9 - s(t * 14) * 0.5; head.rotation.x = -0.25; break;
  }
}

// ---------- props & décors ----------
function signTex(spec) { // panneau texte style "RÉSISTE À ..."
  return canvasTex(512, 640, (x, w, h) => {
    x.fillStyle = spec.border || '#c8102e'; x.fillRect(0, 0, w, h);
    x.fillStyle = spec.bg || '#f6efe0'; x.fillRect(22, 22, w - 44, h - 44);
    x.textAlign = 'center'; x.textBaseline = 'middle';
    const lines = spec.lines; const n = lines.length; let y = 70; const step = (h - 140) / Math.max(1, n - 1);
    lines.forEach((ln, i) => {
      const o = typeof ln === 'string' ? { t: ln } : ln;
      const size = fitText(x, o.t, w - 70, o.s || 44, 900);
      x.fillStyle = o.c || '#1a1a1a'; x.font = `900 ${size}px P`;
      x.fillText(o.t, w / 2, n === 1 ? h / 2 : y + step * i);
    });
  });
}
function makeProp(p) {
  const g = new THREE.Group();
  switch (p.type) {
    case 'house': {
      const w = p.w || 5, fl = p.floors || 3, fh = 2.6, h = fl * fh, d = p.d || 6, col = p.color || '#c8303a';
      const b = box(w, h, d, col); b.position.y = h / 2; g.add(b);
      const roofCol = p.roof || '#2f2f35';
      const shape = new THREE.Shape(); shape.moveTo(-w / 2 - 0.2, 0); shape.lineTo(0, w * 0.45); shape.lineTo(w / 2 + 0.2, 0);
      const r = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: d + 0.4, bevelEnabled: false }), M(roofCol)); r.position.set(0, h, -d / 2 - 0.2); r.castShadow = true; g.add(r);
      const win = M('#9fc3dd', { r: 0.2, m: 0.1 }), fr = M('#f7f7f7');
      for (let f = 0; f < fl; f++) for (let i = 0; i < (p.cols || 2); i++) {
        const cols = p.cols || 2; const x = -w / 2 + w * (i + 0.5) / cols;
        if (f === 0 && i === 0 && p.door !== false) { const dr = box(1.0, 2.0, 0.12, p.doorColor || '#2e6b3a'); dr.position.set(x, 1.0, d / 2 + 0.02); g.add(dr); continue; }
        const fm = box(1.0, 1.4, 0.1, null, { mat: fr }); fm.position.set(x, f * fh + 1.4, d / 2 + 0.02); g.add(fm);
        const gl2 = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.2), p.lit ? M('#ffd98a', { e: '#ffb347', ei: 0.9 }) : win); gl2.position.set(x, f * fh + 1.4, d / 2 + 0.08); g.add(gl2);
        const bar = box(0.06, 1.2, 0.04, null, { mat: fr }); bar.position.set(x, f * fh + 1.4, d / 2 + 0.1); g.add(bar);
      }
    } break;
    case 'lamp': {
      const pole = cyl(0.08, 0.1, 4.2, '#151515', 8); pole.position.y = 2.1; g.add(pole);
      const arm = box(0.7, 0.1, 0.1, '#151515'); arm.position.set(0.3, 4.1, 0); g.add(arm);
      const bulb = sph(0.32, '#f4f1e6', { e: p.on ? '#ffe7a0' : '#000', ei: p.on ? 1.5 : 0 }); bulb.position.set(0.6, 4.0, 0); g.add(bulb);
      if (p.on && p.light) { const l = new THREE.PointLight(0xffd08a, 6, 9, 1.6); l.position.set(0.6, 3.6, 0); g.add(l); }
      if (p.on) { const pool = new THREE.Mesh(new THREE.CircleGeometry(2.2, 20), new THREE.MeshBasicMaterial({ color: 0xffc870, transparent: true, opacity: 0.22, depthWrite: false })); pool.rotation.x = -Math.PI / 2; pool.position.set(0.6, 0.04, 0); g.add(pool); }
    } break;
    case 'tree': {
      const tr = cyl(0.16, 0.22, 1.6, '#7a5230', 6); tr.position.y = 0.8; g.add(tr);
      const l = new THREE.Mesh(new THREE.IcosahedronGeometry(p.r || 1.3, 0), M(p.leaf || '#3f9b3f', { flat: true })); l.position.y = 2.4; l.castShadow = true; g.add(l);
    } break;
    case 'deadtree': {
      const tr = cyl(0.12, 0.24, 3.4, '#2a2420', 5); tr.position.y = 1.7; g.add(tr);
      for (let i = 0; i < 4; i++) { const b = cyl(0.04, 0.08, 1.4, '#2a2420', 4); b.position.set(Math.cos(i * 1.7) * 0.4, 2.6 + i * 0.2, Math.sin(i * 1.7) * 0.4); b.rotation.z = Math.cos(i * 1.7) * 0.9; b.rotation.x = Math.sin(i * 1.7) * 0.9; g.add(b); }
    } break;
    case 'pine': { const tr = cyl(0.14, 0.2, 1, '#5a3d22', 6); tr.position.y = 0.5; g.add(tr); for (let i = 0; i < 3; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry(1.3 - i * 0.3, 1.6, 7), M(p.leaf || '#2d6b3a', { flat: true })); c.position.y = 1.4 + i * 0.8; c.castShadow = true; g.add(c); } } break;
    case 'bush': { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.7, 0), M('#3c8d3c', { flat: true })); b.position.y = 0.5; b.castShadow = true; g.add(b); } break;
    case 'bench': { const s = box(2, 0.12, 0.6, '#8a5a32'); s.position.y = 0.55; g.add(s); const bk = box(2, 0.5, 0.1, '#8a5a32'); bk.position.set(0, 0.95, -0.28); g.add(bk); [-0.85, 0.85].forEach(x => { const l = box(0.1, 0.55, 0.55, '#222'); l.position.set(x, 0.27, 0); g.add(l); }); } break;
    case 'car': {
      const col = p.color || '#d33';
      const b = box(2.0, 0.7, 4.0, col, { round: 0.15, r: 0.4 }); b.position.y = 0.65; g.add(b);
      if (!p.open) { const t = box(1.7, 0.6, 2.0, col, { round: 0.12, r: 0.4 }); t.position.set(0, 1.25, -0.2); g.add(t);
      const gw = box(1.72, 0.45, 2.02, '#9fd0ee', { r: 0.1, m: 0.2 }); gw.position.set(0, 1.27, -0.2); gw.scale.set(1.001, 1, 0.9); g.add(gw); }
      else { const ws = box(1.7, 0.45, 0.06, '#bfe6ff', { op: 0.5, r: 0.1 }); ws.position.set(0, 1.2, 0.7); ws.rotation.x = -0.3; g.add(ws); const seat = box(1.6, 0.3, 1.6, '#3a2a1a'); seat.position.set(0, 0.95, -0.6); g.add(seat); }
      if (p.sign) { const tp = box(1.0, 0.4, 0.5, '#fff'); tp.position.set(0, 1.25, -1.3); g.add(tp); const tx = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.35), new THREE.MeshStandardMaterial({ map: canvasTex(256, 96, (x) => { x.fillStyle = '#c8102e'; x.fillRect(0, 0, 256, 96); x.fillStyle = '#fff'; x.font = '900 52px P'; x.textAlign = 'center'; x.fillText(p.sign, 128, 68); }) })); tx.position.set(0, 1.25, -1.04); g.add(tx); }
      [[-0.95, 1.3], [0.95, 1.3], [-0.95, -1.3], [0.95, -1.3]].forEach(([x, z]) => { const w = cyl(0.36, 0.36, 0.3, '#151515', 16); w.rotation.z = Math.PI / 2; w.position.set(x, 0.36, z); g.add(w); });
      const hl = box(0.4, 0.15, 0.05, '#fff', { e: '#fff8c0', ei: 0.6 }); hl.position.set(-0.6, 0.75, 2.0); g.add(hl); const hr = hl.clone(); hr.position.x = 0.6; g.add(hr);
    } break;
    case 'bus': { const b = box(2.6, 2.8, 9, p.color || '#3cb043', { round: 0.3 }); b.position.y = 1.7; g.add(b); for (let i = 0; i < 4; i++) { const wd = box(2.64, 1.0, 1.4, '#a8d8f0'); wd.position.set(0, 2.3, -3 + i * 2); g.add(wd); } [[-1.3, 3], [1.3, 3], [-1.3, -3], [1.3, -3]].forEach(([x, z]) => { const w = cyl(0.5, 0.5, 0.3, '#151515'); w.rotation.z = Math.PI / 2; w.position.set(x, 0.5, z); g.add(w); }); } break;
    case 'table': { const t = box(p.w || 2, 0.1, p.d || 1, p.color || '#8a5a32'); t.position.y = p.h || 1.0; g.add(t); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => { const l = box(0.1, p.h || 1, 0.1, p.legColor || p.color || '#6b4426'); l.position.set(a * ((p.w || 2) / 2 - 0.1), (p.h || 1) / 2, b * ((p.d || 1) / 2 - 0.1)); g.add(l); }); if (p.cloth) { const c = box((p.w || 2) + 0.1, 0.3, (p.d || 1) + 0.1, p.cloth); c.position.y = (p.h || 1) - 0.1; g.add(c); } } break;
    case 'chair': { const s = box(0.7, 0.1, 0.7, p.color || '#6b4426'); s.position.y = 0.5; g.add(s); const b = box(0.7, 0.8, 0.1, p.color || '#6b4426'); b.position.set(0, 0.9, -0.32); g.add(b); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, c]) => { const l = box(0.08, 0.5, 0.08, '#333'); l.position.set(a * 0.3, 0.25, c * 0.3); g.add(l); }); } break;
    case 'sofa': { const col = p.color || '#e8662e'; const s = box(3, 0.5, 1.1, col, { round: 0.1 }); s.position.y = 0.45; g.add(s); const b = box(3, 0.9, 0.35, col, { round: 0.12 }); b.position.set(0, 0.9, -0.45); g.add(b); [-1.45, 1.45].forEach(x => { const a = box(0.3, 0.75, 1.1, col, { round: 0.1 }); a.position.set(x, 0.65, 0); g.add(a); }); } break;
    case 'bed': { const f = box(2.0, 0.5, 3.2, p.color || '#ececec'); f.position.y = 0.45; g.add(f); const bl = box(2.02, 0.12, 2.2, p.blanket || '#6fa8dc'); bl.position.set(0, 0.74, 0.45); g.add(bl); const pi = box(1.4, 0.2, 0.6, '#fff', { round: 0.08 }); pi.position.set(0, 0.8, -1.2); g.add(pi); const hb = box(2.1, 1.3, 0.12, p.frame || '#8a5a32'); hb.position.set(0, 0.8, -1.62); g.add(hb); } break;
    case 'desk': { const t = box(2.4, 0.1, 1.1, p.color || '#f2f2f2'); t.position.y = 1.0; g.add(t); [-1.1, 1.1].forEach(x => { const l = box(0.08, 1.0, 1.0, '#999'); l.position.set(x, 0.5, 0); g.add(l); }); if (p.pc !== false) { const sc = box(1.0, 0.65, 0.06, '#111'); sc.position.set(0, 1.5, -0.3); g.add(sc); const sg = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.55), M('#5aa0e6', { e: '#3a80c6', ei: 0.5 })); sg.position.set(0, 1.5, -0.26); g.add(sg); const st = box(0.1, 0.3, 0.1, '#333'); st.position.set(0, 1.2, -0.3); g.add(st); } } break;
    case 'tv': { const sc = box(2.4, 1.4, 0.12, '#111'); sc.position.y = 1.8; g.add(sc); const sg = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.2), M(p.screen || '#2b6cb0', { e: p.screen || '#2b6cb0', ei: 0.8 })); sg.position.set(0, 1.8, 0.07); g.add(sg); const st = box(1.6, 0.8, 0.5, '#5a3d22'); st.position.y = 0.4; g.add(st); } break;
    case 'floorlamp': { const p1 = cyl(0.04, 0.04, 2.2, '#222', 8); p1.position.y = 1.1; g.add(p1); const sh = cyl(0.3, 0.45, 0.5, '#f4ead2', 12, { e: '#ffe3a0', ei: 0.35 }); sh.position.y = 2.3; g.add(sh); } break;
    case 'frame': { const f = box(p.w || 1.4, p.h || 1.0, 0.06, '#222'); g.add(f); const tex = p.text ? canvasTex(256, 200, (x, w, h) => { x.fillStyle = '#9fd3f0'; x.fillRect(0, 0, w, h); x.fillStyle = '#5fae4b'; x.fillRect(0, h * 0.6, w, h); x.fillStyle = '#ffd35a'; x.beginPath(); x.arc(w * 0.8, h * 0.3, 20, 0, 7); x.fill(); }) : null; const pic = new THREE.Mesh(new THREE.PlaneGeometry((p.w || 1.4) - 0.14, (p.h || 1.0) - 0.14), tex ? new THREE.MeshStandardMaterial({ map: tex }) : M(p.pic || '#8fc8e8')); pic.position.z = 0.04; g.add(pic); } break;
    case 'window': { const f = box(p.w || 2, p.h || 2, 0.1, '#fafafa'); g.add(f); const gl2 = new THREE.Mesh(new THREE.PlaneGeometry((p.w || 2) - 0.2, (p.h || 2) - 0.2), M(p.sky || '#bfe3ff', { e: p.sky || '#bfe3ff', ei: 0.6 })); gl2.position.z = 0.06; g.add(gl2); const b1 = box(0.08, p.h || 2, 0.12, '#fafafa'); g.add(b1); const b2 = box(p.w || 2, 0.08, 0.12, '#fafafa'); g.add(b2); } break;
    case 'door': { const d = box(1.1, 2.2, 0.12, p.color || '#6b4426'); d.position.y = 1.1; g.add(d); const k = sph(0.06, '#d4af37', { m: .8 }); k.position.set(0.4, 1.1, 0.1); g.add(k); } break;
    case 'board': { // panneau de liège "PLAN"
      const tex = canvasTex(512, 360, (x, w, h) => { x.fillStyle = '#7a4b2a'; x.fillRect(0, 0, w, h); x.fillStyle = '#d9a86c'; x.fillRect(14, 14, w - 28, h - 28); x.fillStyle = '#fff'; x.fillRect(50, 30, w - 100, 60); x.fillStyle = '#c8102e'; x.textAlign = 'center'; x.textBaseline = 'middle'; const s = fitText(x, p.title || 'PLAN', w - 120, 40, 900); x.font = `900 ${s}px P`; x.fillText(p.title || 'PLAN', w / 2, 62); (p.notes || []).forEach((n, i) => { const cx = 60 + i * ((w - 120) / Math.max(1, p.notes.length)) ; x.fillStyle = '#fff'; x.fillRect(cx, 120, (w - 140) / p.notes.length - 10, 180); x.fillStyle = '#111'; x.font = '900 60px P'; x.fillText(n[0], cx + ((w - 140) / p.notes.length - 10) / 2, 190); x.font = '800 24px P'; x.fillText(n[1], cx + ((w - 140) / p.notes.length - 10) / 2, 255); }); });
      const b = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.25, 0.08), [M('#7a4b2a'), M('#7a4b2a'), M('#7a4b2a'), M('#7a4b2a'), new THREE.MeshStandardMaterial({ map: tex }), M('#7a4b2a')]); g.add(b);
    } break;
    case 'sign': { // panneau sur pieds
      const tex = signTex(p); const w = p.w || 2.4, h = w * 1.25;
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.1), [M('#7a1010'), M('#7a1010'), M('#7a1010'), M('#7a1010'), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8 }), M('#5a3d22')]); b.position.y = (p.legs ?? 1.2) + h / 2; b.castShadow = true; g.add(b);
      if ((p.legs ?? 1.2) > 0)[-w / 3, w / 3].forEach(x => { const l = box(0.14, (p.legs ?? 1.2) + 0.3, 0.14, '#5a3d22'); l.position.set(x, ((p.legs ?? 1.2) + 0.3) / 2, -0.08); g.add(l); });
    } break;
    case 'banner': { // bandeau texte
      const w = p.w || 6, h = p.h || 1.2;
      const tex = canvasTex(1024, Math.round(1024 * h / w), (x, cw, ch) => { x.fillStyle = p.bg || '#c8102e'; x.fillRect(0, 0, cw, ch); x.fillStyle = p.fg || '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle'; const s = fitText(x, p.text, cw - 60, ch * 0.6, 900); x.font = `900 ${s}px P`; x.fillText(p.text, cw / 2, ch / 2 + 4); });
      const b = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide, emissive: p.glow ? '#fff' : '#000', emissiveMap: p.glow ? tex : null, emissiveIntensity: 0.6 })); b.position.y = p.y || 3.5; g.add(b);
      if (p.poles) [-w / 2, w / 2].forEach(x => { const l = cyl(0.07, 0.07, (p.y || 3.5) + h / 2, '#333', 8); l.position.set(x, ((p.y || 3.5) + h / 2) / 2, -0.02); g.add(l); });
    } break;
    case 'bunting': { const n = p.n || 14, len = p.len || 12; const cols = ['#e63946', '#f4c430', '#2a9d8f', '#457b9d', '#e76f51', '#8e44ad']; for (let i = 0; i < n; i++) { const tri = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.6, 3), M(cols[i % cols.length], { flat: true })); tri.rotation.x = Math.PI; tri.position.set(-len / 2 + len * i / (n - 1), (p.y || 5) - Math.sin(Math.PI * i / (n - 1)) * 0.6, 0); g.add(tri); } } break;
    case 'stage': { const s = box(p.w || 8, 0.6, p.d || 4, '#7a4b2a'); s.position.y = 0.3; g.add(s); } break;
    case 'speaker': { const s = p.s || 1; const b = box(3 * s, 5 * s, 2 * s, '#111', { round: 0.1 }); b.position.y = 2.5 * s; g.add(b); [1.4, 3.6].forEach(y => { const r = new THREE.Mesh(new THREE.TorusGeometry(1.0 * s, 0.14 * s, 10, 28), M('#333')); r.position.set(0, y * s, 1.02 * s); g.add(r); const cone = sph(0.45 * s, '#222'); cone.scale.z = 0.4; cone.position.set(0, y * s, 1.0 * s); g.add(cone); }); } break;
    case 'counter': { const c = box(p.w || 4, 1.1, 1, p.color || '#c98b4f'); c.position.y = 0.55; g.add(c); const top = box((p.w || 4) + 0.1, 0.08, 1.1, '#f1f1f1'); top.position.y = 1.12; g.add(top); if (p.glass) { const gl3 = box((p.w || 4) - 0.2, 0.6, 0.8, '#cfeefe', { op: 0.35, r: 0.1 }); gl3.position.y = 1.46; g.add(gl3); for (let i = 0; i < 6; i++) { const cr = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.08, 8, 12, Math.PI * 1.3), M('#d9952e')); cr.position.set(-(p.w || 4) / 2 + 0.5 + i * 0.55, 1.25, 0); cr.rotation.x = -Math.PI / 2; g.add(cr); } } } break;
    case 'shelf': { const s = box(p.w || 3, 2.6, 0.6, '#8a5a32'); s.position.y = 1.3; g.add(s); for (let r = 0; r < 4; r++) for (let i = 0; i < 6; i++) { const it = box(0.35, 0.35, 0.35, p.items ? p.items[(i + r) % p.items.length] : ['#d9952e', '#c87f2a', '#e0b060'][(i + r) % 3], { round: 0.1 }); it.position.set(-(p.w || 3) / 2 + 0.3 + i * ((p.w || 3) - 0.6) / 5, 0.35 + r * 0.62, 0.32); g.add(it); } } break;
    case 'grave': { const s = box(0.9, 1.2, 0.25, '#8d8f94', { round: 0.08 }); s.position.y = 0.6; g.add(s); const tx = canvasTex(128, 64, (x) => { x.fillStyle = '#8d8f94'; x.fillRect(0, 0, 128, 64); x.fillStyle = '#333'; x.font = '900 28px P'; x.textAlign = 'center'; x.fillText(p.text || 'R.I.P', 64, 42); }); const pl = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.35), new THREE.MeshStandardMaterial({ map: tx })); pl.position.set(0, 0.85, 0.13); g.add(pl); } break;
    case 'fence': { const n = p.n || 8; for (let i = 0; i < n; i++) { const pk = box(0.12, 1.1, 0.08, p.color || '#3a302a'); pk.position.set(i * 0.4, 0.55, 0); pk.rotation.z = (Math.sin(i * 7) * 0.12); g.add(pk); } const r = box(n * 0.4, 0.1, 0.06, p.color || '#3a302a'); r.position.set((n - 1) * 0.2, 0.8, -0.05); g.add(r); } break;
    case 'paperplane': { const geo = new THREE.BufferGeometry(); const v = new Float32Array([0, 0, 0.6, -0.4, 0, -0.4, 0, 0.05, -0.3, 0, 0, 0.6, 0.4, 0, -0.4, 0, 0.05, -0.3, 0, 0, 0.6, 0, 0.05, -0.3, 0, -0.15, -0.3]); geo.setAttribute('position', new THREE.BufferAttribute(v, 3)); geo.computeVertexNormals(); const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: p.color || '#ffffff', side: THREE.DoubleSide })); m.castShadow = true; g.add(m); } break;
    case 'peppers': { for (let i = 0; i < (p.n || 6); i++) { const pp = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.3, 8), M(i % 3 === 2 ? '#7a0a0a' : '#e01b1b', { r: 0.35 })); pp.rotation.z = Math.PI / 2; pp.position.set(-0.6 + i * 0.25, 0.05, (i % 2) * 0.15); g.add(pp); } } break;
    case 'plate': { const p1 = cyl(0.35, 0.3, 0.05, '#fff'); g.add(p1); } break;
    case 'blood': { const b = new THREE.Mesh(new THREE.CircleGeometry(p.r || 0.9, 18), M('#8a0c12', { r: 0.25 })); b.rotation.x = -Math.PI / 2; b.position.y = 0.065; b.scale.set(1, p.sy || 0.7, 1); g.add(b); for (let i = 0; i < 5; i++) { const d = new THREE.Mesh(new THREE.CircleGeometry(0.12 + (i % 3) * 0.05, 10), M('#8a0c12', { r: 0.25 })); d.rotation.x = -Math.PI / 2; d.position.set(Math.cos(i * 2.3) * (p.r || 0.9) * 1.3, 0.066, Math.sin(i * 2.3) * (p.r || 0.9)); g.add(d); } } break;
    case 'bloodwall': { const b = new THREE.Mesh(new THREE.PlaneGeometry(p.w || 2, p.h || 1.4), new THREE.MeshStandardMaterial({ map: canvasTex(256, 200, (x, w, h) => { x.fillStyle = '#8a0c12'; x.font = '900 46px P'; x.textAlign = 'center'; x.fillText(p.text || 'SORTEZ', w / 2, 80); for (let i = 0; i < 14; i++) x.fillRect(20 + i * 16, 86, 4, 20 + (i * 37) % 80); }), transparent: true })); g.add(b); } break;
    case 'elevator': { // cabine
      const wall = M('#b7bcc4', { m: 0.6, r: 0.35 });
      const bk = box(4, 4, 0.2, null, { mat: wall }); bk.position.set(0, 2, -2); g.add(bk);
      [-2, 2].forEach(x => { const s = box(0.2, 4, 4, null, { mat: wall }); s.position.set(x, 2, 0); g.add(s); });
      const fl = box(4, 0.1, 4, '#3a3a3a'); fl.position.y = 0; g.add(fl); const ce = box(4, 0.1, 4, '#d8d8d8'); ce.position.y = 4; g.add(ce);
      const panel = box(0.4, 1.0, 0.06, '#222'); panel.position.set(1.7, 1.6, -1.88); g.add(panel);
      const disp = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.4), new THREE.MeshStandardMaterial({ map: canvasTex(256, 80, (x) => { x.fillStyle = '#100'; x.fillRect(0, 0, 256, 80); x.fillStyle = '#ff2a2a'; x.font = '900 56px P'; x.textAlign = 'center'; x.fillText(p.floor ?? '7', 128, 62); }), emissive: '#fff', emissiveIntensity: 0.9 })); disp.material.emissiveMap = disp.material.map; disp.position.set(0, 3.5, -1.88); g.add(disp);
      const light = new THREE.PointLight(p.light || 0xfff1d0, p.li ?? 10, 8, 1.5); light.position.set(0, 3.7, 0); g.add(light);
    } break;
    case 'hospitalbed': { const f = box(1.8, 0.2, 3.2, '#d9d9d9', { m: 0.5 }); f.position.y = 0.9; g.add(f); const m = box(1.7, 0.18, 3.0, '#fff'); m.position.y = 1.05; g.add(m); const bl = box(1.72, 0.08, 1.9, '#a8d0f0'); bl.position.set(0, 1.16, 0.5); g.add(bl); [[-0.8, -1.5], [0.8, -1.5], [-0.8, 1.5], [0.8, 1.5]].forEach(([x, z]) => { const l = cyl(0.04, 0.04, 0.9, '#aaa', 6); l.position.set(x, 0.45, z); g.add(l); }); const hb = box(1.8, 0.8, 0.08, '#d9d9d9', { m: .5 }); hb.position.set(0, 1.3, -1.6); g.add(hb); } break;
    case 'monitor': { const p1 = cyl(0.04, 0.04, 1.6, '#aaa', 6); p1.position.y = 0.8; g.add(p1); const sc = box(0.8, 0.6, 0.15, '#222'); sc.position.y = 1.8; g.add(sc); const tx = canvasTex(160, 120, (x) => { x.fillStyle = '#021'; x.fillRect(0, 0, 160, 120); x.strokeStyle = '#2f2'; x.lineWidth = 4; x.beginPath(); x.moveTo(0, 70); if (p.flat) x.lineTo(160, 70); else { x.lineTo(50, 70); x.lineTo(62, 30); x.lineTo(74, 100); x.lineTo(84, 70); x.lineTo(160, 70); } x.stroke(); }); const s = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.5), new THREE.MeshStandardMaterial({ map: tx, emissive: '#fff', emissiveMap: tx, emissiveIntensity: 0.8 })); s.position.set(0, 1.8, 0.08); g.add(s); } break;
    case 'finish': { [-4, 4].forEach(x => { const pl = cyl(0.12, 0.12, 4, '#ddd', 8); pl.position.set(x, 2, 0); g.add(pl); }); const tx = canvasTex(512, 96, (x) => { x.fillStyle = '#111'; x.fillRect(0, 0, 512, 96); x.fillStyle = '#fff'; x.font = '900 60px P'; x.textAlign = 'center'; x.fillText(p.text || 'ARRIVÉE', 256, 72); }); const bn = new THREE.Mesh(new THREE.PlaneGeometry(8, 1.4), new THREE.MeshStandardMaterial({ map: tx, side: THREE.DoubleSide })); bn.position.y = 3.6; g.add(bn); const ln = new THREE.Mesh(new THREE.PlaneGeometry(8, 0.5), new THREE.MeshStandardMaterial({ map: canvasTex(128, 16, (x) => { for (let i = 0; i < 16; i++) for (let j = 0; j < 2; j++) { x.fillStyle = (i + j) % 2 ? '#111' : '#fff'; x.fillRect(i * 8, j * 8, 8, 8); } }) })); ln.rotation.x = -Math.PI / 2; ln.position.y = 0.02; g.add(ln); } break;
    case 'lake': { const l = new THREE.Mesh(new THREE.CircleGeometry(p.r || 8, 24), M('#3d8fd1', { r: 0.15, m: 0.1 })); l.rotation.x = -Math.PI / 2; l.position.y = 0.03; g.add(l); } break;
    case 'barrier': { const b = box(4, 0.3, 0.2, '#e63946'); b.position.y = 1; g.add(b); } break;
    case 'cow': { const b = box(1.0, 0.9, 2.0, '#fafafa', { round: .15 }); b.position.y = 1.1; g.add(b); const sp = box(1.02, 0.5, 0.6, '#222'); sp.position.set(0, 1.25, 0.3); g.add(sp); const h = box(0.6, 0.6, 0.6, '#fafafa', { round: .1 }); h.position.set(0, 1.5, 1.2); g.add(h); const mz = box(0.62, 0.3, 0.2, '#f2b8c6'); mz.position.set(0, 1.35, 1.52); g.add(mz); [-0.16, 0.16].forEach(ex => { const e = box(0.09, 0.12, 0.03, '#111'); e.position.set(ex, 1.62, 1.51); g.add(e); const lid = box(0.13, 0.04, 0.04, '#111'); lid.position.set(ex, 1.69, 1.52); lid.rotation.z = ex > 0 ? 0.25 : -0.25; g.add(lid); }); [-0.36, 0.36].forEach(ex => { const h = box(0.08, 0.2, 0.08, '#e8d8b0'); h.position.set(ex, 1.85, 1.15); g.add(h); }); for (const [x, z] of [[-.35, .7], [.35, .7], [-.35, -.7], [.35, -.7]]) { const l = box(0.22, 0.7, 0.22, '#fafafa'); l.position.set(x, 0.35, z); g.add(l); } } break;
    case 'dog': { const col = p.color || '#c8955e'; const b = box(0.55, 0.5, 1.0, col, { round: .12 }); b.position.y = 0.55; g.add(b); const h = box(0.5, 0.48, 0.5, col, { round: .12 }); h.position.set(0, 0.95, 0.55); g.add(h); const tx = faceTexture({ expr: p.expr || 'happy', blush: false }); const fp = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.42), new THREE.MeshStandardMaterial({ map: tx, transparent: true })); fp.position.set(0, 0.95, 0.81); g.add(fp); [-0.2, 0.2].forEach(x => { const e = box(0.12, 0.3, 0.12, p.ear || '#8a5a32'); e.position.set(x, 1.2, 0.5); g.add(e); }); for (const [x, z] of [[-.17, .35], [.17, .35], [-.17, -.35], [.17, -.35]]) { const l = box(0.15, 0.35, 0.15, col); l.position.set(x, 0.17, z); g.add(l); } const t = box(0.08, 0.35, 0.08, col); t.position.set(0, 0.85, -0.55); t.rotation.x = -0.6; g.add(t); g.userData.tail = t; } break;
    case 'flower': { for (let i = 0; i < 3; i++) { const f = makeHeld('flower'); f.position.set(i * 0.12 - 0.12, 0.2, 0); f.rotation.z = (i - 1) * 0.3; g.add(f); } } break;
    case 'pot': { const c = cyl(0.8, 0.7, 0.9, '#333', 16); c.position.y = 0.45; g.add(c); } break;
    case 'fire': { for (let i = 0; i < 5; i++) { const f = new THREE.Mesh(new THREE.ConeGeometry(0.3 - i * 0.03, 0.9, 6), M(i % 2 ? '#ff8c1a' : '#ffd23f', { e: i % 2 ? '#ff6a00' : '#ffb300', ei: 1.4 })); f.position.set(Math.cos(i * 1.3) * 0.25, 0.45, Math.sin(i * 1.3) * 0.25); g.add(f); } const l = new THREE.PointLight(0xff8a30, 8, 10, 1.4); l.position.y = 1; g.add(l); } break;
    case 'wardrobe': { const w = box(1.8, 2.8, 0.8, p.color || '#5a3d22'); w.position.y = 1.4; g.add(w); const ln = box(0.04, 2.6, 0.04, '#2a1d10'); ln.position.set(0, 1.4, 0.41); g.add(ln); } break;
    case 'fridge': { const f = box(1.1, 2.4, 0.9, '#eef2f5', { round: .06, m: .2, r: .4 }); f.position.y = 1.2; g.add(f); const h = box(0.06, 0.6, 0.06, '#999'); h.position.set(0.42, 1.5, 0.47); g.add(h); } break;
    case 'vent': { const v = box(1.0, 0.6, 0.06, '#9aa0a6'); g.add(v); for (let i = 0; i < 4; i++) { const s = box(0.9, 0.05, 0.08, '#555'); s.position.y = -0.2 + i * 0.13; g.add(s); } } break;
    case 'lighthouse': { const t = cyl(1.6, 2.2, 14, '#f4f4f4', 20); t.position.y = 7; g.add(t); [3, 7, 11].forEach(y => { const b = cyl(1.65 + (14 - y) * 0.04, 1.7 + (14 - y) * 0.04, 1.4, '#c8102e', 20); b.position.y = y; g.add(b); }); const top = cyl(1.3, 1.3, 1.6, '#fff8c0', 12, { e: '#ffe066', ei: p.on ? 1.6 : 0.2 }); top.position.y = 14.8; g.add(top); const roof = new THREE.Mesh(new THREE.ConeGeometry(1.6, 1.4, 12), M('#222')); roof.position.y = 16.3; g.add(roof); if (p.on) { const l = new THREE.PointLight(0xffe08a, 30, 40, 1.2); l.position.y = 14.8; g.add(l); } } break;
    case 'ship': { const hull = box(4, 2, 12, p.color || '#5a3a22'); hull.position.y = 1; g.add(hull); const bow = new THREE.Mesh(new THREE.ConeGeometry(2.0, 3, 4), M(p.color || '#5a3a22')); bow.rotation.x = Math.PI / 2; bow.rotation.y = Math.PI / 4; bow.position.set(0, 1, 7.4); bow.scale.set(1, 1, 0.7); g.add(bow); const deck = box(3.8, 0.2, 11.6, '#9a7a52'); deck.position.y = 2.05; g.add(deck); [-3, 2].forEach(z => { const m = cyl(0.15, 0.18, 10, '#4a3020', 8); m.position.set(0, 7, z); g.add(m); if (!p.nosail) { const sl = box(3, 4, 0.08, '#efe8d8'); sl.position.set(0, 6.5, z + 0.2); g.add(sl); } }); const cab = box(2.6, 1.6, 2.6, '#6a4a2a'); cab.position.set(0, 2.9, -4); g.add(cab); } break;
    case 'candles': { const n = p.n || 5; for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; const r = p.r || 0; const c = cyl(0.06, 0.07, 0.35 + (i % 3) * 0.12, '#f4ecd8', 8); const x = r ? Math.cos(a) * r : (i - (n - 1) / 2) * 0.22; const z = r ? Math.sin(a) * r : 0; c.position.set(x, 0.2, z); g.add(c); const f = sph(0.05, '#ffcc44', { e: '#ffaa00', ei: 3 }); f.scale.y = 1.6; f.position.set(x, 0.42 + (i % 3) * 0.12, z); f.castShadow = false; g.add(f); } const l = new THREE.PointLight(0xffaa44, p.li ?? 5, 7, 1.6); l.position.y = 0.9; g.add(l); } break;
    case 'altar': { const a = box(3, 1.1, 1.2, p.color || '#efe8d8'); a.position.y = 0.55; g.add(a); const c = box(3.1, 0.06, 1.3, p.cloth || '#8a0a1a'); c.position.y = 1.12; g.add(c); if (p.symbol) { const tx = canvasTex(256, 256, (x) => { x.strokeStyle = p.symColor || '#d4af37'; x.lineWidth = 14; x.beginPath(); x.arc(128, 128, 90, 0, 7); x.stroke(); x.beginPath(); for (let i = 0; i < 12; i++) { const an = i * Math.PI / 6; x.moveTo(128 + Math.cos(an) * 100, 128 + Math.sin(an) * 100); x.lineTo(128 + Math.cos(an) * 125, 128 + Math.sin(an) * 125); } x.stroke(); x.fillStyle = p.symColor || '#d4af37'; x.beginPath(); x.arc(128, 128, 40, 0, 7); x.fill(); }); const s = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6), new THREE.MeshStandardMaterial({ map: tx, transparent: true, emissive: '#fff', emissiveMap: tx, emissiveIntensity: 0.5 })); s.position.set(0, 3, -0.7); g.add(s); } } break;
    case 'xmastree': { const tr = cyl(0.2, 0.25, 0.8, '#5a3a22', 8); tr.position.y = 0.4; g.add(tr); for (let i = 0; i < 4; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry(1.6 - i * 0.35, 1.4, 9), M('#1f6b3a', { flat: true })); c.position.y = 1.2 + i * 0.75; c.castShadow = true; g.add(c); } const cols = ['#ff3b3b', '#ffd23f', '#5ad1ff', '#ff6fd8']; for (let i = 0; i < 26; i++) { const h = 1.0 + (i / 26) * 2.6; const r = (1.55 - (h - 1) * 0.42); const a = i * 2.4; const b = sph(0.08, cols[i % 4], { e: cols[i % 4], ei: p.off ? 0 : 1.5, seg: 8, seg2: 6 }); b.position.set(Math.cos(a) * r, h, Math.sin(a) * r); b.castShadow = false; g.add(b); } const st = new THREE.Mesh(new THREE.OctahedronGeometry(0.28), M('#ffd23f', { e: '#ffcc00', ei: p.off ? 0.2 : 2 })); st.position.y = 4.3; g.add(st); if (!p.off) { const l = new THREE.PointLight(0xffc870, 6, 8, 1.6); l.position.y = 2.5; g.add(l); } } break;
    case 'gift': { const c = p.color || '#c8102e'; const b = box(p.w || 0.6, p.h || 0.5, p.w || 0.6, c); b.position.y = (p.h || 0.5) / 2; g.add(b); const r1 = box((p.w || 0.6) + 0.02, (p.h || 0.5) + 0.02, 0.1, '#ffd23f'); r1.position.y = (p.h || 0.5) / 2; g.add(r1); const r2 = box(0.1, (p.h || 0.5) + 0.02, (p.w || 0.6) + 0.02, '#ffd23f'); r2.position.y = (p.h || 0.5) / 2; g.add(r2); } break;
    case 'snowman': { [0.6, 0.45, 0.32].forEach((r, i) => { const b = sph(r, '#fafcff'); b.position.y = [0.55, 1.35, 1.95][i]; g.add(b); }); const n = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.35, 8), M('#ff8c1a')); n.rotation.x = Math.PI / 2; n.position.set(0, 1.95, 0.4); g.add(n); [-0.1, 0.1].forEach(x => { const e = sph(0.04, '#111'); e.position.set(x, 2.05, 0.28); g.add(e); }); const h = cyl(0.22, 0.22, 0.35, '#111'); h.position.y = 2.38; g.add(h); const sc = cyl(0.36, 0.36, 0.12, '#c8102e'); sc.position.y = 1.68; g.add(sc); } break;
    case 'fireplace': { const b = box(2.6, 2.2, 0.8, '#8a4a32'); b.position.y = 1.1; g.add(b); const hole = box(1.4, 1.1, 0.3, '#1a0c06'); hole.position.set(0, 0.65, 0.3); g.add(hole); const top = box(2.9, 0.15, 1.0, '#5a3a22'); top.position.y = 2.25; g.add(top); if (!p.off) { const f = makeProp({ type: 'fire' }); f.scale.setScalar(0.6); f.position.set(0, 0.2, 0.3); g.add(f); } if (p.stockings) [-0.8, 0, 0.8].forEach((x, i) => { const st = box(0.25, 0.5, 0.1, ['#c8102e', '#2e7d32', '#c8102e'][i]); st.position.set(x, 1.85, 0.45); g.add(st); }); } break;
    case 'bars': { const w = p.w || 4, h = p.h || 3.5; for (let i = 0; i <= w / 0.35; i++) { const b = cyl(0.04, 0.04, h, '#555', 6, { m: 0.7, r: 0.4 }); b.position.set(-w / 2 + i * 0.35, h / 2, 0); g.add(b); } [0.1, h - 0.1, h / 2].forEach(y => { const r = box(w, 0.1, 0.1, '#444', { m: 0.6 }); r.position.y = y; g.add(r); }); } break;
    case 'tape': { const w = p.w || 6; const tx = canvasTex(512, 48, (x) => { x.fillStyle = '#ffd23f'; x.fillRect(0, 0, 512, 48); x.fillStyle = '#111'; x.font = '900 30px P'; for (let i = 0; i < 3; i++) x.fillText(p.text || 'SCÈNE DE CRIME', 10 + i * 260, 35); }); const t = new THREE.Mesh(new THREE.PlaneGeometry(w, 0.3), new THREE.MeshStandardMaterial({ map: tx, side: THREE.DoubleSide })); t.position.y = p.y || 1.1; t.rotation.z = p.tilt || 0.04; g.add(t); [-w / 2, w / 2].forEach(x => { const po = cyl(0.04, 0.04, 1.2, '#ff8c1a', 6); po.position.set(x, 0.6, 0); g.add(po); }); } break;
    case 'chalk': { const tx = canvasTex(256, 256, (x) => { x.strokeStyle = '#f4f4f4'; x.lineWidth = 6; x.beginPath(); x.arc(128, 50, 26, 0, 7); x.moveTo(128, 76); x.lineTo(128, 160); x.moveTo(128, 100); x.lineTo(70, 130); x.moveTo(128, 100); x.lineTo(196, 80); x.moveTo(128, 160); x.lineTo(90, 230); x.moveTo(128, 160); x.lineTo(170, 230); x.stroke(); }); const m = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.2), new THREE.MeshStandardMaterial({ map: tx, transparent: true })); m.rotation.x = -Math.PI / 2; m.position.y = 0.03; g.add(m); } break;
    case 'beams': { const n = p.n || 6; for (let i = 0; i < n; i++) { const z = -i * 3; [-1.8, 1.8].forEach(x => { const po = box(0.3, 3.2, 0.3, '#5a3a1a'); po.position.set(x, 1.6, z); g.add(po); }); const t = box(4, 0.3, 0.35, '#5a3a1a'); t.position.set(0, 3.25, z); g.add(t); if (i % 2 === 0) { const lp = sph(0.12, '#ffd27a', { e: '#ffb347', ei: p.dark ? 0.2 : 2 }); lp.position.set(0, 2.95, z); lp.castShadow = false; g.add(lp); if (!p.dark) { const l = new THREE.PointLight(0xffb060, 4, 6, 1.6); l.position.set(0, 2.8, z); g.add(l); } } } const rails = box(1.2, 0.06, n * 3, '#6a6a6a', { m: .6 }); rails.position.set(0, 0.03, -(n - 1) * 1.5); g.add(rails); } break;
    case 'rocks': { const r = rng(p.seed || 3); for (let i = 0; i < (p.n || 12); i++) { const k = new THREE.Mesh(new THREE.DodecahedronGeometry(0.4 + r() * 1.1, 0), M(p.color || '#6a625a', { flat: true })); k.position.set((r() - 0.5) * (p.w || 10), r() * 0.3, (r() - 0.5) * (p.d || 10)); k.rotation.set(r() * 3, r() * 3, 0); k.castShadow = true; g.add(k); } } break;
    case 'piano': { const b = box(2.2, 1.3, 0.8, p.color || '#111', { r: 0.25, m: 0.2 }); b.position.y = 0.95; g.add(b); const k = box(2.0, 0.06, 0.35, '#f4f4f4'); k.position.set(0, 0.95, 0.55); g.add(k); for (let i = 0; i < 14; i++) { const bk = box(0.06, 0.07, 0.2, '#111'); bk.position.set(-0.95 + i * 0.14, 0.99, 0.48); g.add(bk); } [-0.95, 0.95].forEach(x => { const l = box(0.12, 0.8, 0.12, p.color || '#111'); l.position.set(x, 0.4, 0.5); g.add(l); }); } break;
    case 'clock': { const c = cyl(p.r || 0.5, p.r || 0.5, 0.08, '#f4f0e6', 24); c.rotation.x = Math.PI / 2; g.add(c); const rim = new THREE.Mesh(new THREE.TorusGeometry(p.r || 0.5, 0.05, 8, 24), M('#3a2a1a')); g.add(rim); const h = p.h ?? 3, m = p.m ?? 0; const hh = box(0.04, (p.r || 0.5) * 0.5, 0.02, '#111'); hh.geometry.translate(0, (p.r || 0.5) * 0.25, 0); hh.position.z = 0.06; hh.rotation.z = -(h % 12) / 12 * Math.PI * 2; g.add(hh); const mh = box(0.03, (p.r || 0.5) * 0.8, 0.02, '#111'); mh.geometry.translate(0, (p.r || 0.5) * 0.4, 0); mh.position.z = 0.07; mh.rotation.z = -m / 60 * Math.PI * 2; g.add(mh); } break;
    case 'bridge': { const w = p.w || 14; const d = box(w, 0.3, 2.6, p.color || '#8a6a4a'); d.position.y = p.y || 1.5; g.add(d); [-1.25, 1.25].forEach(z => { const r = box(w, 0.1, 0.1, '#5a3a22'); r.position.set(0, (p.y || 1.5) + 0.9, z); g.add(r); for (let i = 0; i <= w / 1.5; i++) { const po = box(0.1, 0.9, 0.1, '#5a3a22'); po.position.set(-w / 2 + i * 1.5, (p.y || 1.5) + 0.45, z); g.add(po); } }); [-w / 2 + 0.5, w / 2 - 0.5].forEach(x => { const pi = box(0.8, p.y || 1.5, 2.6, '#8d8f94'); pi.position.set(x, (p.y || 1.5) / 2, 0); g.add(pi); }); } break;
    case 'river': { const r = new THREE.Mesh(new THREE.PlaneGeometry(p.w || 200, p.d || 8), M('#3d8fd1', { r: 0.15, m: 0.1 })); r.rotation.x = -Math.PI / 2; r.position.y = 0.04; g.add(r); } break;
    case 'flowers': { const r = rng(p.seed || 5); const cols = p.cols || ['#ff5c8a', '#ffd23f', '#b48be0', '#ff8c1a', '#fff']; for (let i = 0; i < (p.n || 30); i++) { const x = (r() - 0.5) * (p.w || 4), z = (r() - 0.5) * (p.d || 2); const st = cyl(0.015, 0.015, 0.4, '#3c8d3c', 4); st.position.set(x, 0.2, z); g.add(st); const f = sph(0.09, cols[i % cols.length], { seg: 6, seg2: 4 }); f.position.set(x, 0.42, z); f.castShadow = false; g.add(f); } } break;
    case 'radio': { const b = box(0.9, 0.55, 0.4, p.color || '#5a3a22', { round: 0.05 }); b.position.y = 0.28; g.add(b); const sp = cyl(0.17, 0.17, 0.02, '#222', 16); sp.rotation.x = Math.PI / 2; sp.position.set(-0.2, 0.3, 0.21); g.add(sp); const dial = box(0.3, 0.12, 0.02, '#ffd27a', { e: '#ffb347', ei: 0.8 }); dial.position.set(0.22, 0.38, 0.21); g.add(dial); const an = cyl(0.01, 0.01, 0.8, '#aaa', 4); an.position.set(0.35, 0.9, 0); an.rotation.z = -0.3; g.add(an); } break;
    case 'cabin': { const w = p.w || 6, d = p.d || 5; for (let i = 0; i < 8; i++) { const lg = cyl(0.18, 0.18, d, '#7a5230', 8); lg.rotation.x = Math.PI / 2; [-w / 2, w / 2].forEach(x => { const l2 = lg.clone(); l2.position.set(x, 0.18 + i * 0.36, 0); g.add(l2); }); const lf = cyl(0.18, 0.18, w, '#8a6240', 8); lf.rotation.z = Math.PI / 2; lf.position.set(0, 0.18 + i * 0.36, d / 2); g.add(lf); const lb = lf.clone(); lb.position.z = -d / 2; g.add(lb); } const shape = new THREE.Shape(); shape.moveTo(-w / 2 - 0.4, 0); shape.lineTo(0, w * 0.4); shape.lineTo(w / 2 + 0.4, 0); const r = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: d + 0.6, bevelEnabled: false }), M(p.roof || '#3a2a1a')); r.position.set(0, 2.9, -d / 2 - 0.3); r.castShadow = true; g.add(r); const dr = box(1.0, 1.9, 0.1, '#3a2010'); dr.position.set(0, 0.95, d / 2 + 0.2); g.add(dr); const wd = box(0.9, 0.8, 0.1, '#ffd98a', { e: '#ffb347', ei: p.lit ? 1 : 0 }); wd.position.set(1.8, 1.6, d / 2 + 0.2); g.add(wd); } break;
    case 'well': { const c = cyl(0.9, 0.9, 1.0, '#8d8f94', 14); c.position.y = 0.5; g.add(c); const in2 = cyl(0.7, 0.7, 1.02, '#111', 14); in2.position.y = 0.52; g.add(in2); [-0.85, 0.85].forEach(x => { const po = box(0.12, 2.2, 0.12, '#5a3a22'); po.position.set(x, 1.1, 0); g.add(po); }); const rf = box(2.2, 0.12, 1.2, '#3a2a1a'); rf.position.y = 2.25; g.add(rf); } break;
    case 'cross': { const v = box(0.15, 1.6, 0.15, p.color || '#5a3a22'); v.position.y = 0.8; g.add(v); const h = box(0.8, 0.15, 0.15, p.color || '#5a3a22'); h.position.y = 1.15; g.add(h); } break;
    case 'crate': { const b = box(p.w || 1, p.w || 1, p.w || 1, '#a07a4a'); b.position.y = (p.w || 1) / 2; g.add(b); } break;
    case 'lantern': { const b = box(0.25, 0.35, 0.25, '#222'); b.position.y = 0.18; g.add(b); const gl = box(0.2, 0.25, 0.2, '#ffd27a', { e: '#ffb347', ei: 2 }); gl.position.y = 0.18; g.add(gl); const l = new THREE.PointLight(0xffb060, p.li ?? 4, 6, 1.6); l.position.y = 0.4; g.add(l); } break;
    case 'sheet': { const b = box(0.8, 0.35, 2.0, p.color || '#e8e8e8', { round: 0.15 }); b.position.y = 0.18; g.add(b); } break;
    case 'bones': { for (let i = 0; i < (p.n || 6); i++) { const b = cyl(0.04, 0.04, 0.5, '#efe8d8', 6); b.rotation.z = Math.PI / 2; b.rotation.y = i * 1.1; b.position.set((i % 3) * 0.3 - 0.3, 0.05, Math.floor(i / 3) * 0.3); g.add(b); } const sk = sph(0.16, '#efe8d8'); sk.position.set(0.4, 0.15, 0.2); g.add(sk); } break;
    case 'doll': { const ch = makeChar({ skin: 'pale', hair: p.hair || 'pigtails', hairColor: p.hairColor || '#2a1a10', shirt: p.color || '#efe0e8', dress: p.color || '#efe0e8', scale: p.size || 0.32, lashes: true }); ch.userData.crowdAnim = 'idle'; ch.userData.phase = 0; ch.userData.faceE = p.expr || 'blank'; g.add(ch); g.userData.isCrowd = true; } break;
    case 'tent': { const t = new THREE.Mesh(new THREE.ConeGeometry(1.8, 2.4, 4), M(p.color || '#d96c2c', { flat: true })); t.position.y = 1.2; t.rotation.y = Math.PI / 4; t.castShadow = true; g.add(t); } break;
    case 'ice': { const r = rng(p.seed || 8); for (let i = 0; i < (p.n || 20); i++) { const k = new THREE.Mesh(new THREE.DodecahedronGeometry(0.6 + r() * 2.2, 0), M('#d6ecf7', { flat: true, r: 0.3 })); k.position.set((r() - 0.5) * (p.w || 40), r() * 0.4, (r() - 0.5) * (p.d || 40)); k.scale.y = 0.6; k.castShadow = true; g.add(k); } } break;
    case 'church': { const b = box(8, 7, 12, p.color || '#d8d2c4'); b.position.y = 3.5; g.add(b); const shape = new THREE.Shape(); shape.moveTo(-4.3, 0); shape.lineTo(0, 3.5); shape.lineTo(4.3, 0); const r = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 12.4, bevelEnabled: false }), M('#3a3a44')); r.position.set(0, 7, -6.2); g.add(r); const t = box(3, 10, 3, p.color || '#d8d2c4'); t.position.set(0, 5, 6.5); g.add(t); const sp = new THREE.Mesh(new THREE.ConeGeometry(2.2, 5, 4), M('#3a3a44')); sp.position.set(0, 12.5, 6.5); sp.rotation.y = Math.PI / 4; g.add(sp); const dr = box(1.6, 2.8, 0.1, '#4a2a1a'); dr.position.set(0, 1.4, 8.05); g.add(dr); const w = sph(0.8, '#9fc3dd', { e: p.lit ? '#ffd27a' : '#000', ei: 1 }); w.scale.z = 0.1; w.position.set(0, 6, 8.05); g.add(w); } break;
    case 'eyes': { [-0.15, 0.15].forEach(x => { const e = sph(0.07, '#fff', { e: p.color || '#ffef9a', ei: 2 }); e.position.x = x; g.add(e); }); } break;
    case 'box': { const b = box(p.w || 1, p.h || 1, p.d || 1, p.color || '#c49a6c', { round: p.round || 0 }); b.position.y = (p.h || 1) / 2; g.add(b); } break;
    case 'text3d': { const tx = canvasTex(512, 128, (x) => { x.fillStyle = p.bg || '#111'; x.fillRect(0, 0, 512, 128); x.fillStyle = p.fg || '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle'; const s = fitText(x, p.text, 480, 80, 900); x.font = `900 ${s}px P`; x.fillText(p.text, 256, 68); }); const b = new THREE.Mesh(new THREE.PlaneGeometry(p.w || 3, (p.w || 3) / 4), new THREE.MeshStandardMaterial({ map: tx, emissive: '#fff', emissiveMap: tx, emissiveIntensity: p.glow ? 0.8 : 0 })); g.add(b); } break;
    case 'crowd': { const r = rng(p.seed || 7); for (let i = 0; i < (p.n || 14); i++) { const cols = ['#e63946', '#2a9d8f', '#f4c430', '#457b9d', '#8e44ad', '#e76f51', '#3cb043', '#ff69b4']; const sk = ['light', 'tan', 'brown', 'dark', 'pale'][Math.floor(r() * 5)]; const ch = p.robe ? makeChar({ skin: sk, hair: 'hood', hairColor: p.robe, shirt: p.robe, robe: p.robe }) : makeChar({ shirt: cols[i % 8], pants: ['#2b2f3a', '#3a4a8a', '#5a3d22'][i % 3], skin: sk, hair: ['short', 'long', 'afro', 'curly', 'bun', 'spiky', 'cap'][Math.floor(r() * 7)], hairColor: ['#2a1a10', '#5b3a24', '#e8c35a', '#111', '#a0522d'][Math.floor(r() * 5)] }); ch.position.set((r() - 0.5) * (p.w || 8), 0, (r() - 0.5) * (p.d || 4)); ch.rotation.y = (r() - 0.5) * 0.6 + (p.face || 0); ch.userData.crowdAnim = p.anim || 'cheer'; ch.userData.phase = r() * 10; ch.userData.faceE = p.expr || 'happy'; g.add(ch); } g.userData.isCrowd = true; } break;
    case 'zombies': { const r = rng(p.seed || 3); for (let i = 0; i < (p.n || 10); i++) { const ch = makeChar({ skin: 'zombie', shirt: ['#5a5a4a', '#4a5a6a', '#6a4a4a', '#555'][i % 4], pants: '#333', hair: ['short', 'bald', 'long', 'none'][i % 4], hairColor: '#333', sleeve: null }); ch.position.set((r() - 0.5) * (p.w || 10), 0, (r() - 0.5) * (p.d || 6)); ch.rotation.y = (r() - 0.5) * 0.8 + (p.face || 0); ch.userData.crowdAnim = 'zombie'; ch.userData.phase = r() * 10; ch.userData.faceE = 'zombie'; g.add(ch); } g.userData.isCrowd = true; } break;
  }
  return g;
}

// ---------- décors ----------
function skyTex(top, bottom, stars) {
  return canvasTex(16, 512, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, top); g.addColorStop(1, bottom); x.fillStyle = g; x.fillRect(0, 0, w, h); if (stars) { x.fillStyle = '#fff'; for (let i = 0; i < 40; i++) x.fillRect((i * 7) % 16, (i * 53) % 300, 1, 1); } });
}
const LIGHTS = {
  day: { sky: ['#4f8fd6', '#cfe6fb'], hemi: ['#dfefff', '#8a8a70', 1.6], sun: ['#fff3e0', 2.4, [20, 30, 15]], fog: ['#cfe3f5', 60, 220], exp: 1.05 },
  sunset: { sky: ['#3b2a6b', '#ff9a5a'], hemi: ['#ffc9a0', '#5a4060', 1.3], sun: ['#ffb070', 2.2, [-25, 12, 10]], fog: ['#f0a070', 50, 200], exp: 1.0 },
  night: { sky: ['#050a1e', '#24305a'], hemi: ['#7090d0', '#202030', 1.05], sun: ['#a8bcff', 1.0, [-15, 30, 10]], fog: ['#0f1530', 25, 110], exp: 1.2, stars: true },
  horror: { sky: ['#0a0408', '#3a1018'], hemi: ['#b06070', '#200a10', 0.95], sun: ['#ff8080', 0.9, [-10, 25, 5]], fog: ['#1c0810', 14, 75], exp: 1.25 },
  interior: { sky: ['#444', '#666'], hemi: ['#fff6e8', '#7a6a5a', 1.5], sun: ['#fff1dd', 1.6, [6, 12, 10]], fog: null, exp: 1.0 },
  dim: { sky: ['#111', '#222'], hemi: ['#8a9ad0', '#252030', 1.0], sun: ['#b0c0ff', 0.7, [6, 12, 10]], fog: ['#0a0c14', 10, 45], exp: 1.25 },
  red: { sky: ['#200', '#400'], hemi: ['#ff6060', '#300', 1.3], sun: ['#ff4040', 1.2, [6, 12, 10]], fog: ['#2a0000', 8, 45], exp: 1.2 },
  snow: { sky: ['#6f8fb8', '#dfe9f4'], hemi: ['#e8f0ff', '#b0b8c8', 1.6], sun: ['#fff4e8', 1.6, [20, 30, 15]], fog: ['#dfe7f0', 30, 140], exp: 1.0 },
  xmas: { sky: ['#0a1430', '#2a3a6a'], hemi: ['#8fa8e0', '#403040', 1.1], sun: ['#ffd8a8', 0.9, [-15, 25, 10]], fog: ['#1a2448', 25, 110], exp: 1.2, stars: true },
  warm: { sky: ['#3a2a20', '#5a4030'], hemi: ['#ffd8b0', '#5a3a2a', 1.3], sun: ['#ffc890', 1.3, [6, 12, 10]], fog: null, exp: 1.05 },
  cave: { sky: ['#050403', '#120e0a'], hemi: ['#a08870', '#151008', 0.7], sun: ['#ffb070', 0.4, [5, 10, 5]], fog: ['#0a0806', 6, 40], exp: 1.3 },
  arctic: { sky: ['#7a98b8', '#e6eef6'], hemi: ['#eef4ff', '#9aa8b8', 1.5], sun: ['#fff8f0', 1.4, [-30, 15, 10]], fog: ['#dfe8f0', 20, 120], exp: 1.0 },
  grey: { sky: ['#7d8794', '#c5ccd4'], hemi: ['#d0d6de', '#606060', 1.4], sun: ['#e8ecf0', 1.2, [20, 30, 15]], fog: ['#b8c0ca', 40, 160], exp: 1.0 },
};
const hemi = new THREE.HemisphereLight(0xffffff, 0x888888, 1.5); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 2.2); sun.castShadow = true; sun.shadow.mapSize.set(1536, 1536);
sun.shadow.camera.left = -18; sun.shadow.camera.right = 18; sun.shadow.camera.top = 18; sun.shadow.camera.bottom = -18; sun.shadow.camera.far = 120; sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.02;
scene.add(sun); scene.add(sun.target);
const bgCache = {};
function applyLight(name, focus) {
  const L = LIGHTS[name] || LIGHTS.day;
  const key = name; if (!bgCache[key]) bgCache[key] = skyTex(L.sky[0], L.sky[1], L.stars);
  scene.background = bgCache[key];
  hemi.color.set(L.hemi[0]); hemi.groundColor.set(L.hemi[1]); hemi.intensity = L.hemi[2];
  sun.color.set(L.sun[0]); sun.intensity = L.sun[1];
  const f = focus || new THREE.Vector3();
  sun.position.set(f.x + L.sun[2][0], f.y + L.sun[2][1], f.z + L.sun[2][2]); sun.target.position.copy(f);
  scene.fog = L.fog ? new THREE.Fog(L.fog[0], L.fog[1], L.fog[2]) : null;
  renderer.toneMappingExposure = L.exp;
}

function ground(w, d, color, tex) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), tex ? new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 }) : M(color, { r: 0.95 })); m.rotation.x = -Math.PI / 2; m.receiveShadow = true; return m; }
let tileTex = null, woodTex = null, roadTex = null, checkTex = null;
function tiles(color = '#d7d4cf') { if (!tileTex) { tileTex = canvasTex(256, 256, (x) => { x.fillStyle = color; x.fillRect(0, 0, 256, 256); x.strokeStyle = 'rgba(0,0,0,.12)'; x.lineWidth = 3; for (let i = 0; i <= 4; i++) { x.beginPath(); x.moveTo(i * 64, 0); x.lineTo(i * 64, 256); x.stroke(); x.beginPath(); x.moveTo(0, i * 64); x.lineTo(256, i * 64); x.stroke(); } }); tileTex.wrapS = tileTex.wrapT = THREE.RepeatWrapping; tileTex.repeat.set(20, 20); } return tileTex; }
function wood() { if (!woodTex) { woodTex = canvasTex(256, 256, (x) => { for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#a86b3c' : '#b5784a'; x.fillRect(0, i * 32, 256, 32); x.fillStyle = 'rgba(0,0,0,.15)'; x.fillRect(0, i * 32, 256, 2); x.fillRect((i * 97) % 256, i * 32, 2, 32); } }); woodTex.wrapS = woodTex.wrapT = THREE.RepeatWrapping; woodTex.repeat.set(4, 4); } return woodTex; }
function road() { if (!roadTex) { roadTex = canvasTex(64, 256, (x) => { x.fillStyle = '#4b4f57'; x.fillRect(0, 0, 64, 256); x.fillStyle = '#f2f2f2'; x.fillRect(29, 0, 6, 120); }); roadTex.wrapS = roadTex.wrapT = THREE.RepeatWrapping; roadTex.repeat.set(1, 30); } return roadTex; }
function checker(a = '#e9e9e9', b = '#cfd3d8') { if (!checkTex) { checkTex = canvasTex(128, 128, (x) => { for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { x.fillStyle = (i + j) % 2 ? a : b; x.fillRect(i * 32, j * 32, 32, 32); } }); checkTex.wrapS = checkTex.wrapT = THREE.RepeatWrapping; checkTex.repeat.set(4, 4); } return checkTex; }

function mountains(g, opt = {}) {
  const r = rng(11);
  for (let i = 0; i < 14; i++) {
    const a = -1.2 + i * 0.19; const dist = 150 + r() * 40; const h = 40 + r() * 40;
    const m = new THREE.Mesh(new THREE.ConeGeometry(28 + r() * 15, h, 5), M(opt.color || '#a9b9cc', { flat: true })); m.position.set(Math.sin(a) * dist, h / 2 - 4, -Math.cos(a) * dist); m.rotation.y = r() * 3; m.castShadow = false; g.add(m);
    if (!opt.nosnow) { const s = new THREE.Mesh(new THREE.ConeGeometry((28 + 15) * 0.3, h * 0.3, 5), M('#f4f7fb', { flat: true })); s.position.set(m.position.x, h - 4 - h * 0.15 + 0.5, m.position.z); s.rotation.y = m.rotation.y; s.castShadow = false; g.add(s); }
  }
}
const HOUSE_COLS = ['#c8303a', '#e2b33c', '#2e7d4a', '#e07b39', '#3a6fb0', '#d9d0b8', '#b0413e', '#e8c547'];
function streetRow(g, side, n, z0, opt = {}) {
  for (let i = 0; i < n; i++) {
    const col = opt.cols ? opt.cols[i % opt.cols.length] : HOUSE_COLS[(i * 3 + (side > 0 ? 1 : 0)) % HOUSE_COLS.length];
    const h = makeProp({ type: 'house', color: col, floors: 2 + ((i + (side > 0 ? 1 : 0)) % 2), w: 5, lit: opt.lit, roof: opt.roof });
    h.position.set(side * 10, 0, z0 - i * 5.2); h.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2; g.add(h);
  }
}
const SETS = {
  street(o) {
    const g = new THREE.Group();
    if (o.snow) { o.grass = '#f2f6fb'; o.roof = '#f4f8fc'; }
    g.add(ground(400, 400, o.grass || '#5fb35a'));
    const rd = ground(8, 200, null, road()); rd.position.y = 0.01; g.add(rd);
    [-5.6, 5.6].forEach(x => { const s = ground(3.2, 200, o.snow ? '#e8eef5' : '#cfcfcf'); s.position.set(x, 0.02, 0); g.add(s); });
    streetRow(g, -1, 18, 20, o); streetRow(g, 1, 18, 20, o);
    for (let i = 0; i < 16; i++) [-4.5, 4.5].forEach(x => { const l = makeProp({ type: 'lamp', on: o.lamps }); l.position.set(x, 0, 18 - i * 8); l.rotation.y = x > 0 ? Math.PI : 0; g.add(l); });
    if (!o.nomount) mountains(g, o);
    return g;
  },
  square(o) {
    const g = new THREE.Group();
    g.add(ground(400, 400, o.snow ? '#f2f6fb' : '#5fb35a'));
    const pz = o.snow ? ground(40, 40, '#eef3f8') : ground(40, 40, null, tiles()); pz.position.y = 0.01; g.add(pz);
    const cols = HOUSE_COLS; const rf = o.snow ? '#f4f8fc' : undefined;
    for (let i = 0; i < 8; i++) { const h = makeProp({ type: 'house', color: cols[i % 8], floors: 2 + (i % 2), lit: o.lit, roof: rf }); h.position.set(-18 + i * 5.2, 0, -22); g.add(h); }
    for (let i = 0; i < 6; i++) { const h = makeProp({ type: 'house', color: cols[(i + 3) % 8], floors: 2 + (i % 2), lit: o.lit, roof: rf }); h.position.set(-22, 0, -14 + i * 5.2); h.rotation.y = Math.PI / 2; g.add(h); const h2 = makeProp({ type: 'house', color: cols[(i + 5) % 8], floors: 2 + ((i + 1) % 2), lit: o.lit, roof: rf }); h2.position.set(22, 0, -14 + i * 5.2); h2.rotation.y = -Math.PI / 2; g.add(h2); }
    if (o.stage) { const s = makeProp({ type: 'stage', w: 10, d: 5 }); s.position.set(0, 0, -10); g.add(s); }
    if (o.bunting !== false) for (let i = 0; i < 3; i++) { const b = makeProp({ type: 'bunting', len: 30, n: 26, y: 6 }); b.position.set(0, 0, -12 + i * 8); g.add(b); }
    for (let i = 0; i < 6; i++) { const l = makeProp({ type: 'lamp', on: o.lamps }); l.position.set(-15 + i * 6, 0, 8); g.add(l); }
    if (!o.nomount) mountains(g, o);
    return g;
  },
  room(o) { // intérieur générique
    const g = new THREE.Group(); const w = o.w || 12, d = o.d || 10, h = o.h || 4.5;
    const fl = o.floor === 'stone' ? ground(w, d, '#5a5650') : o.floor === 'carpet' ? ground(w, d, o.carpet || '#7a1f2b') : ground(w, d, null, o.floor === 'tile' ? checker() : wood()); g.add(fl);
    const wallM = M(o.wall || '#f0dcc0');
    const back = box(w, h, 0.2, null, { mat: wallM }); back.position.set(0, h / 2, -d / 2); g.add(back);
    const l = box(0.2, h, d, null, { mat: wallM }); l.position.set(-w / 2, h / 2, 0); g.add(l);
    const r = box(0.2, h, d, null, { mat: wallM }); r.position.set(w / 2, h / 2, 0); g.add(r);
    const ceil = box(w, 0.2, d, '#fafafa'); ceil.position.y = h; ceil.castShadow = false; g.add(ceil);
    const base = box(w, 0.2, 0.25, o.trim || '#7a4b2a'); base.position.set(0, 0.1, -d / 2 + 0.1); g.add(base);
    if (o.rug) { const rg = new THREE.Mesh(new THREE.CircleGeometry(2.6, 32), M(o.rug)); rg.rotation.x = -Math.PI / 2; rg.position.set(0, 0.02, 0.5); rg.scale.x = 1.4; g.add(rg); }
    const lt = new THREE.PointLight(o.lightColor || 0xfff0d8, o.li ?? 14, 18, 1.4); lt.position.set(0, h - 0.6, 1); lt.castShadow = false; g.add(lt);
    return g;
  },
  park(o) {
    const g = new THREE.Group(); g.add(ground(400, 400, o.grass || '#5fb35a'));
    const path = ground(3, 200, '#d8c9a3'); path.position.y = 0.01; g.add(path);
    const r = rng(5); for (let i = 0; i < 40; i++) { const t = makeProp({ type: r() > 0.4 ? 'tree' : 'pine', leaf: o.leaf }); const side = r() > 0.5 ? 1 : -1; t.position.set(side * (4 + r() * 25), 0, 10 - r() * 80); g.add(t); }
    if (!o.nomount) mountains(g, o); return g;
  },
  country(o) {
    const g = new THREE.Group(); g.add(ground(500, 500, o.grass || '#7cc35a'));
    const rd = ground(7, 300, null, road()); rd.position.y = 0.01; g.add(rd);
    const r = rng(9); for (let i = 0; i < 30; i++) { const t = makeProp({ type: r() > 0.5 ? 'tree' : 'pine' }); t.position.set((r() > 0.5 ? 1 : -1) * (8 + r() * 40), 0, 20 - r() * 150); g.add(t); }
    mountains(g, o); return g;
  },
  forest(o) {
    const g = new THREE.Group(); g.add(ground(400, 400, o.grass || '#2c3a26'));
    const r = rng(21); for (let i = 0; i < 90; i++) { const t = makeProp({ type: o.dead ? 'deadtree' : 'pine', leaf: '#1d3a24' }); const x = (r() - 0.5) * 60, z = 10 - r() * 70; if (Math.abs(x) < 2.5 && z > -40) continue; t.position.set(x, 0, z); t.scale.setScalar(1 + r() * 0.8); g.add(t); }
    return g;
  },
  haunted(o) {
    const g = new THREE.Group(); g.add(ground(400, 400, '#2a2f22'));
    const path = ground(2.4, 30, '#4a4038'); path.position.set(0, 0.01, -4); g.add(path);
    const h = makeProp({ type: 'house', color: '#3d3540', roof: '#1a161c', floors: 3, w: 9, cols: 3, d: 8, lit: false, doorColor: '#1a1010' }); h.position.set(0, 0, -20); g.add(h);
    const win = sph(0.3, '#ffef9a', { e: '#ffcc44', ei: 2 }); win.position.set(3, 7.2, -15.9); g.add(win);
    for (let i = 0; i < 8; i++) { const t = makeProp({ type: 'deadtree' }); t.position.set((i % 2 ? 1 : -1) * (7 + (i * 3) % 9), 0, -4 - i * 3); g.add(t); }
    const f1 = makeProp({ type: 'fence', n: 14 }); f1.position.set(-9, 0, -10); g.add(f1); const f2 = makeProp({ type: 'fence', n: 14 }); f2.position.set(3.4, 0, -10); g.add(f2);
    for (let i = 0; i < 5; i++) { const gr = makeProp({ type: 'grave', text: 'R.I.P' }); gr.position.set(-8 + i * 1.6, 0, -14 - (i % 2)); gr.rotation.z = (i % 3 - 1) * 0.08; g.add(gr); }
    const moon = sph(6, '#f4f1d0', { e: '#f4f1d0', ei: 1 }); moon.position.set(-40, 60, -150); moon.castShadow = false; g.add(moon);
    return g;
  },
  hospital(o) { const g = SETS.room({ wall: '#dfeef0', floor: 'tile', trim: '#9ab', li: 16, lightColor: 0xeef6ff, ...o }); return g; },
  stadium(o) {
    const g = new THREE.Group(); g.add(ground(400, 400, '#5fb35a'));
    const tr = ground(10, 300, '#c8553d'); tr.position.y = 0.01; g.add(tr);
    for (let i = 0; i < 6; i++) { const ln = ground(0.08, 300, '#fff'); ln.position.set(-5 + i * 2, 0.02, 0); g.add(ln); }
    [-1, 1].forEach(sd => { for (let i = 0; i < 4; i++) { const st = box(6, 1, 200, '#9aa3ad'); st.position.set(sd * (8 + i * 2.5), 0.5 + i * 1, -50); g.add(st); } });
    mountains(g, o); return g;
  },
  lakeside(o) { const g = SETS.country(o); const l = makeProp({ type: 'lake', r: 18 }); l.position.set(0, 0, -40); g.add(l); return g; },
  mine(o) { const g = new THREE.Group(); g.add(ground(60, 200, '#3a322a')); const L = box(1, 5, 200, '#4a4036'); L.position.set(-2.6, 2.5, -60); g.add(L); const R = L.clone(); R.position.x = 2.6; g.add(R); const C = box(6, 1, 200, '#3a3228'); C.position.set(0, 4.0, -60); g.add(C); const b = makeProp({ type: 'beams', n: 14, dark: o.dark }); b.position.z = 4; g.add(b); const r = makeProp({ type: 'rocks', n: 30, w: 4, d: 40, color: '#5a5048' }); r.position.set(0, 0, -20); r.scale.set(0.8, 0.5, 1); g.add(r); return g; },
  coast(o) { const g = new THREE.Group(); const sea = ground(600, 600, o.sea || '#2f6f9f'); sea.position.y = -0.3; g.add(sea); const land = ground(40, 30, o.sand || '#8a9a6a'); land.position.set(0, 0, 8); g.add(land); const cliff = box(40, 6, 30, '#6a625a'); cliff.position.set(0, -3.1, 8); g.add(cliff); const rk = makeProp({ type: 'rocks', n: 18, w: 30, d: 6, color: '#5a5550' }); rk.position.set(0, -0.6, -8); g.add(rk); if (o.lighthouse !== false) { const lh = makeProp({ type: 'lighthouse', on: o.on }); lh.position.set(o.lhx ?? 6, 0, o.lhz ?? 2); g.add(lh); } return g; },
  ice(o) { const g = new THREE.Group(); g.add(ground(600, 600, '#e9f3fa')); const ic = makeProp({ type: 'ice', n: 40, w: 80, d: 80 }); g.add(ic); mountains(g, { color: '#dfe9f2', nosnow: true }); return g; },
  hall(o) { const g = SETS.room({ wall: o.wall || '#2a2530', floor: 'stone', li: o.li ?? 6, lightColor: o.lightColor ?? 0xffb060, w: 14, d: 14, h: 6, trim: '#1a1418' }); [-5, 5].forEach(x => { for (let i = 0; i < 3; i++) { const p = cyl(0.4, 0.45, 6, '#3a3440', 10); p.position.set(x, 3, -5 + i * 4.5); g.add(p); } }); if (o.altar !== false) { const a = makeProp({ type: 'altar', symbol: true, color: o.altarColor || '#efe8d8', cloth: o.cloth || '#efe8d8', symColor: o.symColor }); a.position.set(0, 0, -5.4); g.add(a); const c = makeProp({ type: 'candles', n: 9, li: 6 }); c.position.set(0, 1.15, -5.4); g.add(c); } return g; },
  court(o) { const g = SETS.room({ wall: '#6a4a32', floor: 'carpet', carpet: '#5a1a22', li: 14, w: 14, d: 12, h: 6 }); const bench = box(5, 1.6, 1.4, '#4a2e1a'); bench.position.set(0, 0.8, -4.6); g.add(bench); const top = box(5.2, 0.12, 1.6, '#3a2010'); top.position.set(0, 1.66, -4.6); g.add(top); const em = canvasTex(256, 256, (x) => { x.fillStyle = '#d4af37'; x.beginPath(); x.moveTo(128, 20); x.lineTo(128, 230); x.moveTo(40, 80); x.lineTo(216, 80); x.lineWidth = 10; x.strokeStyle = '#d4af37'; x.stroke(); x.beginPath(); x.arc(60, 140, 40, 0, Math.PI); x.fill(); x.beginPath(); x.arc(196, 140, 40, 0, Math.PI); x.fill(); }); const e = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), new THREE.MeshStandardMaterial({ map: em, transparent: true })); e.position.set(0, 4, -5.85); g.add(e); for (let i = 0; i < 2; i++) { const jb = box(0.8 * 6, 0.5, 0.9, '#4a2e1a'); jb.position.set(-4.6 + 0.0, 0.25 + i * 0.4, -1 + i * 1.1); jb.rotation.y = Math.PI / 2; g.add(jb); } return g; },
  clearing(o) { const g = SETS.forest(o); const c = makeProp({ type: 'cabin', lit: o.lit }); c.position.set(0, 0, -10); g.add(c); return g; },
  void(o) { const g = new THREE.Group(); g.add(ground(200, 200, o.floor || '#222')); return g; },
  cemetery(o) { const g = new THREE.Group(); g.add(ground(400, 400, '#3e5a34')); const r = rng(4); for (let i = 0; i < 30; i++) { const gr = makeProp({ type: 'grave', text: o.texts ? o.texts[i % o.texts.length] : 'R.I.P' }); gr.position.set(-12 + (i % 8) * 3.4, 0, -4 - Math.floor(i / 8) * 4); g.add(gr); } for (let i = 0; i < 8; i++) { const t = makeProp({ type: 'pine' }); t.position.set((i % 2 ? 1 : -1) * (16 + r() * 8), 0, -i * 6); g.add(t); } mountains(g, o); return g; },
};

// ---------- overlay 2D ----------
function rr(x, X, Y, w, h, r) { x.beginPath(); x.roundRect(X, Y, w, h, r); }
function outlinedText(x, txt, X, Y, size, fill = '#fff', stroke = '#111', sw = 0.16, weight = 800, shadow = true) {
  x.font = `${weight} ${size}px P`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineJoin = 'round';
  if (shadow) { x.fillStyle = 'rgba(0,0,0,.55)'; x.fillText(txt, X + size * 0.04, Y + size * 0.07); }
  x.lineWidth = size * sw; x.strokeStyle = stroke; x.strokeText(txt, X, Y);
  x.fillStyle = fill; x.fillText(txt, X, Y);
}
function popScale(t, dur = 0.18) { return t < dur ? easeOutBack(clamp(t / dur)) : 1; }
const FX = {
  label(x, f, lt) { // étiquette chapitre en haut à gauche
    const s = popScale(lt, 0.2); x.save(); x.translate(26, 70); x.scale(s, s);
    x.font = '800 27px P'; const w = x.measureText(f.text).width + 30;
    x.fillStyle = 'rgba(20,20,20,.88)'; rr(x, 0, 0, w, 46, 10); x.fill();
    x.fillStyle = f.color || '#ffd23f'; x.textAlign = 'left'; x.textBaseline = 'middle'; x.fillText(f.text, 15, 25); x.restore();
  },
  nametag(x, f, lt) {
    const s = clamp(lt / 0.25); const dx = (1 - easeOutBack(s)) * -400;
    x.save(); x.translate(36 + dx, f.y || 980);
    x.font = '900 46px P'; const w = Math.max(x.measureText(f.name).width + 44, 200);
    x.fillStyle = f.color || '#ffd23f'; rr(x, 0, 0, w, 72, 10); x.fill();
    x.fillStyle = '#151515'; x.textAlign = 'left'; x.textBaseline = 'middle'; x.fillText(f.name, 22, 40);
    x.font = '700 28px P'; const w2 = x.measureText(f.role).width + 40;
    x.fillStyle = 'rgba(20,20,20,.92)'; rr(x, 10, 80, w2, 46, 8); x.fill(); x.fillStyle = '#fff'; x.fillText(f.role, 30, 104); x.restore();
  },
  title(x, f, lt, T) { // gros titre jaune en haut
    const s = popScale(lt, 0.25); x.save(); x.translate(W / 2, f.y || 170); x.rotate(Math.sin(T * 3) * 0.03 - 0.02); x.scale(s, s);
    const size = fitText(x, f.text, W - 80, f.size || 56, 900);
    outlinedText(x, f.text, 0, 0, size, f.color || '#ffd23f', '#111', 0.2, 900); x.restore();
  },
  impact(x, f, lt) { // texte d'impact au centre (BOUM, PERDU...)
    const s = popScale(lt, 0.22) * (f.stamp ? lerp(1.6, 1, clamp(lt / 0.15)) : 1);
    x.save(); x.translate(W / 2 + (f.dx || 0), f.y || 560); x.rotate((f.rot ?? -6) * DEG); x.scale(s, s);
    const size = fitText(x, f.text, W - 80, f.size || 110, 900);
    if (f.stamp) { x.font = `900 ${size}px P`; const w = x.measureText(f.text).width; x.lineWidth = 10; x.strokeStyle = f.color || '#e3242b'; rr(x, -w / 2 - 26, -size * 0.62, w + 52, size * 1.24, 14); x.stroke(); x.fillStyle = f.color || '#e3242b'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(f.text, 0, size * 0.04); }
    else outlinedText(x, f.text, 0, 0, size, f.color || '#ff8c1a', '#111', 0.18, 900);
    x.restore();
  },
  timer(x, f, lt, T, sd) { // chronomètre
    const p = clamp((lt - (f.delay || 0)) / ((f.dur ?? (sd - (f.delay || 0))) || 1));
    const v = lerp(f.a ?? 0, f.b ?? 30, f.ease ? ease(p) : p);
    const txt = fmtTime(v, f.fmt);
    const col = typeof f.color === 'function' ? f.color(v) : (f.color || '#fff');
    const big = f.big ? 1.35 : 1;
    x.save(); x.translate(W / 2, f.y || 150); x.scale(big, big);
    x.font = '800 54px P'; const w = x.measureText('00:00.00').width + 50;
    x.fillStyle = 'rgba(15,15,15,.9)'; rr(x, -w / 2, -42, w, 84, 16); x.fill(); x.lineWidth = 5; x.strokeStyle = col; x.stroke();
    x.shadowColor = col; x.shadowBlur = 14; x.fillStyle = col; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(txt, 0, 4); x.shadowBlur = 0; x.restore();
  },
  day(x, f, lt) { // calendrier JOUR N
    const s = popScale(lt, 0.2); x.save(); x.translate(f.x || 40, f.y || 60); x.rotate(-0.04); x.scale(s, s);
    x.fillStyle = 'rgba(0,0,0,.25)'; rr(x, 6, 8, 170, 170, 18); x.fill();
    x.fillStyle = '#fff'; rr(x, 0, 0, 170, 170, 18); x.fill();
    x.fillStyle = '#e3242b'; rr(x, 0, 0, 170, 52, [18, 18, 0, 0]); x.fill();
    x.fillStyle = '#fff'; x.font = '800 28px P'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(f.word || 'JOUR', 85, 28);
    x.fillStyle = '#151515'; const size = fitText(x, String(f.n), 150, 86, 900); x.font = `900 ${size}px P`; x.fillText(String(f.n), 85, 112);
    x.fillStyle = '#e3242b'; [40, 130].forEach(cx => { x.beginPath(); x.arc(cx, 0, 8, 0, 7); x.fill(); }); x.restore();
  },
  cards(x, f, lt) { // cartes stats (30 JOURS / 0 DANSE)
    const n = f.items.length; const cw = 220, gap = 26; const total = n * cw + (n - 1) * gap;
    f.items.forEach((it, i) => {
      const s = popScale(lt - i * 0.2, 0.22); if (lt - i * 0.2 < 0) return;
      x.save(); x.translate(W / 2 - total / 2 + i * (cw + gap) + cw / 2, f.y || 330); x.rotate((i % 2 ? 3 : -3) * DEG); x.scale(s, s);
      x.fillStyle = 'rgba(0,0,0,.3)'; rr(x, -cw / 2 + 6, -96, cw, 200, 16); x.fill();
      x.fillStyle = '#fff'; rr(x, -cw / 2, -102, cw, 200, 16); x.fill();
      x.fillStyle = it.c || '#151515'; x.textAlign = 'center'; x.textBaseline = 'middle';
      const sz = fitText(x, it.v, cw - 30, 80, 900); x.font = `900 ${sz}px P`; x.fillText(it.v, 0, -20);
      x.font = '800 26px P'; x.fillStyle = '#333'; x.fillText(it.l, 0, 60);
      if (it.circle) { x.strokeStyle = '#e3242b'; x.lineWidth = 7; x.beginPath(); x.arc(0, -10, 88, 0, 7); x.stroke(); }
      x.restore();
    });
  },
  poster(x, f, lt) { // grande affiche plein écran
    const s = popScale(lt, 0.25); x.save(); x.translate(W / 2, f.y || 600); x.rotate((f.rot ?? 2) * DEG); x.scale(s, s);
    const w = 600, h = f.h || 640; x.fillStyle = 'rgba(0,0,0,.35)'; rr(x, -w / 2 + 10, -h / 2 + 12, w, h, 12); x.fill();
    x.fillStyle = f.border || '#c8102e'; rr(x, -w / 2, -h / 2, w, h, 12); x.fill(); x.fillStyle = f.bg || '#f6efe0'; rr(x, -w / 2 + 18, -h / 2 + 18, w - 36, h - 36, 8); x.fill();
    const n = f.lines.length; const step = (h - 120) / Math.max(1, n - 1);
    f.lines.forEach((ln, i) => { const o = typeof ln === 'string' ? { t: ln } : ln; x.textAlign = 'center'; x.textBaseline = 'middle'; const sz = fitText(x, o.t, w - 80, o.s || 44, 900); x.font = `900 ${sz}px P`; x.fillStyle = o.c || '#1a1a1a'; x.fillText(o.t, 0, -h / 2 + 60 + step * i); });
    x.restore();
  },
  emoji(x, f, lt) { const s = popScale(lt, 0.2); x.save(); x.translate(f.x || W / 2, (f.y || 400) - lt * (f.rise ?? 30)); x.scale(s, s); x.font = `${f.size || 90}px "Noto Color Emoji", sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(f.text, 0, 0); x.restore(); },
  notes(x, f, lt) { const r = rng(5); for (let i = 0; i < (f.n || 8); i++) { const ph = (lt * 0.6 + r()) % 1; const xx = r() * W, yy = 900 - ph * 600 + r() * 200; x.globalAlpha = Math.sin(ph * Math.PI); outlinedText(x, r() > 0.5 ? '♪' : '♫', xx + Math.sin(lt * 3 + i) * 20, yy, 46 + r() * 20, ['#ffd23f', '#5ad1ff', '#ff6fa3', '#7dff7a'][i % 4], '#111', 0.1, 900, false); x.globalAlpha = 1; } },
  rain(x, f, lt) { const r = rng(f.seed || 9); const n = f.n || 50; for (let i = 0; i < n; i++) { const sp = 300 + r() * 400; const xx = r() * W + Math.sin(lt * 2 + i) * 30; const yy = ((r() * H + lt * sp) % (H + 100)) - 50; x.save(); x.translate(xx, yy); x.rotate(lt * (r() * 6 - 3) + i); const k = f.kind || 'money'; if (k === 'money') { x.fillStyle = '#4caf50'; x.fillRect(-26, -14, 52, 28); x.fillStyle = '#2e7d32'; x.fillRect(-20, -9, 40, 18); x.fillStyle = '#a5d6a7'; x.font = '900 16px P'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('€', 0, 1); } else if (k === 'confetti') { x.fillStyle = ['#e63946', '#f4c430', '#2a9d8f', '#457b9d', '#ff69b4'][i % 5]; x.fillRect(-8, -4, 16, 8); } else if (k === 'blood') { x.fillStyle = '#9a0a12'; x.beginPath(); x.ellipse(0, 0, 6, 12, 0, 0, 7); x.fill(); } else if (k === 'rain') { x.rotate(-(lt * (r() * 6 - 3) + i)); x.fillStyle = 'rgba(180,200,255,.5)'; x.fillRect(0, 0, 2, 30); } else if (k === 'fire') { x.fillStyle = ['#ff6a00', '#ffb300', '#e3242b'][i % 3]; x.beginPath(); x.arc(0, 0, 8, 0, 7); x.fill(); } else if (k === 'snow') { x.fillStyle = '#fff'; x.beginPath(); x.arc(0, 0, 5, 0, 7); x.fill(); } else if (k === 'heart') { x.font = '40px "Noto Color Emoji"'; x.fillText('❤️', 0, 0); } x.restore(); } },
  flash(x, f, lt) { const a = clamp(1 - lt / (f.dur || 0.35)); if (a <= 0) return; x.fillStyle = f.color || '#fff'; x.globalAlpha = a * (f.a ?? 0.9); x.fillRect(0, 0, W, H); x.globalAlpha = 1; },
  vignette(x, f) { const g = x.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.75); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, f.color || 'rgba(0,0,0,.75)'); x.fillStyle = g; x.fillRect(0, 0, W, H); },
  tint(x, f) { x.fillStyle = f.color || 'rgba(255,0,0,.2)'; x.fillRect(0, 0, W, H); },
  fade(x, f, lt, T, sd) { const st = f.start ?? (sd - (f.dur || 0.6)); const a = f.in ? clamp(1 - lt / (f.dur || 0.6)) : clamp((lt - st) / (f.dur || 0.6)); x.fillStyle = f.color || '#000'; x.globalAlpha = a; x.fillRect(0, 0, W, H); x.globalAlpha = 1; },
  bars(x, f, lt) { const p = ease(clamp(lt / 0.4)); const hh = (f.h || 110) * p; x.fillStyle = '#000'; x.fillRect(0, 0, W, hh); x.fillRect(0, H - hh, W, hh); },
  meter(x, f, lt, T, sd) { // jauge (ex: PIMENT 🌶)
    const p = clamp((lt - (f.delay || 0)) / ((f.dur || sd) || 1)); const v = lerp(f.a ?? 0, f.b ?? 1, p);
    x.save(); x.translate(W / 2, f.y || 1060); x.font = '900 30px P'; x.textAlign = 'center'; outlinedText(x, f.text || '', 0, -40, 32, '#fff', '#111', 0.18, 900);
    const w = 460; x.fillStyle = 'rgba(15,15,15,.85)'; rr(x, -w / 2, -18, w, 36, 18); x.fill(); const col = v > 0.8 ? '#e3242b' : v > 0.5 ? '#ff8c1a' : '#4cd964'; x.fillStyle = col; rr(x, -w / 2 + 5, -13, (w - 10) * v, 26, 13); x.fill(); x.restore();
  },
  counter(x, f, lt, T, sd) { // compteur numérique libre (ex: 3 247 €)
    const p = clamp((lt - (f.delay || 0)) / ((f.dur || sd) || 1)); const v = Math.round(lerp(f.a ?? 0, f.b ?? 100, f.ease ? ease(p) : p));
    const txt = (f.pre || '') + v.toLocaleString('fr-FR').replace(/ /g, ' ') + (f.post || '');
    const s = popScale(lt, 0.2); x.save(); x.translate(W / 2, f.y || 200); x.scale(s, s); const size = fitText(x, txt, W - 100, f.size || 64, 900); outlinedText(x, txt, 0, 0, size, f.color || '#ffd23f', '#111', 0.18, 900); x.restore();
  },
  text(x, f, lt) { const s = popScale(lt, 0.2); x.save(); x.translate(f.x || W / 2, f.y || 300); x.rotate((f.rot || 0) * DEG); x.scale(s, s); const size = fitText(x, f.text, W - 80, f.size || 52, 900); outlinedText(x, f.text, 0, 0, size, f.color || '#fff', '#111', 0.18, 900); x.restore(); },
  phone(x, f, lt) { // écran de téléphone avec messages (hauteur auto)
    const s = popScale(lt, 0.25); x.save(); x.translate(W / 2, f.y || 330); x.scale(s, s); x.rotate(-2 * DEG);
    const w = 520; x.font = '700 33px P';
    const msgs = (f.msgs || []).map((m, i) => ({ ...m, lines: wrap(x, m.t, 380), at: m.at ?? i * 0.6 }));
    let hh = 96; msgs.forEach(m => hh += m.lines.length * 42 + 30 + 14); hh += 16;
    x.fillStyle = 'rgba(0,0,0,.35)'; rr(x, -w / 2 - 6, -hh / 2 - 2, w + 28, hh + 28, 40); x.fill();
    x.fillStyle = '#111'; rr(x, -w / 2 - 14, -hh / 2 - 14, w + 28, hh + 28, 40); x.fill(); x.fillStyle = '#f2f2f7'; rr(x, -w / 2, -hh / 2, w, hh, 28); x.fill();
    x.fillStyle = '#fff'; rr(x, -w / 2, -hh / 2, w, 76, [28, 28, 0, 0]); x.fill(); x.fillStyle = '#111'; x.font = '800 32px P'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(f.who || 'Inconnu', 0, -hh / 2 + 40);
    let y = -hh / 2 + 96; x.font = '700 33px P';
    msgs.forEach((m) => { const bh = m.lines.length * 42 + 30; if (lt < m.at) { y += bh + 14; return; } const me = m.me; const bw = Math.min(460, Math.max(...m.lines.map(l => x.measureText(l).width)) + 40); const bx = me ? w / 2 - 20 - bw : -w / 2 + 20; const k = popScale(lt - m.at, 0.2); x.save(); x.translate(bx + bw / 2, y + bh / 2); x.scale(k, k); x.translate(-(bx + bw / 2), -(y + bh / 2)); x.fillStyle = me ? '#0a84ff' : (m.c || '#e5e5ea'); rr(x, bx, y, bw, bh, 22); x.fill(); x.fillStyle = me ? '#fff' : '#111'; x.textAlign = 'left'; m.lines.forEach((l, j) => x.fillText(l, bx + 20, y + 36 + j * 42)); x.restore(); y += bh + 14; });
    x.restore();
  },
  shake() { },
};
function wrap(x, t, mw) { const words = t.split(' '); const lines = []; let cur = ''; for (const w of words) { const tt = cur ? cur + ' ' + w : w; if (x.measureText(tt).width > mw && cur) { lines.push(cur); cur = w; } else cur = tt; } if (cur) lines.push(cur); return lines; }
function fmtTime(v, fmt) {
  if (fmt === 'clock') { const h = Math.floor(v) % 24, m = Math.floor((v % 1) * 60); return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0'); }
  if (fmt === 'int') return String(Math.round(v));
  if (fmt === 'hms') { const h = Math.floor(v / 3600), m = Math.floor((v % 3600) / 60), sec = Math.floor(v % 60); return h + ':' + String(m).padStart(2, '0') + ':' + String(sec).padStart(2, '0'); }
  const m = Math.floor(v / 60), s = Math.floor(v % 60), cs = Math.floor((v * 100) % 100);
  return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0') + '.' + String(cs).padStart(2, '0');
}

// sous-titres mot à mot
function drawCaption(x, words, T) {
  // words : [{w, s, e, hl}] groupés en chunks ; trouver le chunk courant
  let cur = null;
  for (const c of CHUNKS) if (T >= c.s && T < c.e) { cur = c; break; }
  if (!cur) return;
  const lt = T - cur.s; const s = lt < 0.12 ? lerp(0.82, 1, easeOutBack(lt / 0.12)) : 1;
  x.save(); x.translate(W / 2, CAPY); x.scale(s, s);
  const size = 54; x.font = `800 ${size}px P`;
  const parts = cur.words; const space = x.measureText(' ').width;
  const widths = parts.map(p => x.measureText(p.w).width); let total = widths.reduce((a, b) => a + b, 0) + space * (parts.length - 1);
  let k = 1; if (total > W - 70) { k = (W - 70) / total; x.scale(k, k); }
  let xx = -total / 2;
  parts.forEach((p, i) => { x.textAlign = 'left'; x.textBaseline = 'middle'; x.lineJoin = 'round';
    x.fillStyle = 'rgba(0,0,0,.6)'; x.fillText(p.w, xx + 2, 5); x.lineWidth = 9; x.strokeStyle = '#111'; x.strokeText(p.w, xx, 0); x.fillStyle = p.hl ? '#ffd23f' : '#fff'; x.fillText(p.w, xx, 0); xx += widths[i] + space; });
  x.restore();
}
let CHUNKS = [], CAPY = 760;

// ---------- caméra ----------
const tmpV = new THREE.Vector3();
function actorPos(id) { const a = ACTORS[id]; if (!a) return new THREE.Vector3(); return a.root.position.clone(); }
function actorFwd(id) { const a = ACTORS[id]; const r = a ? a.root.rotation.y : 0; return new THREE.Vector3(Math.sin(r), 0, Math.cos(r)); }
const CAMS = { close: [3.0, 2.05, 1.8, 40], face: [2.2, 2.08, 1.98, 38], medium: [4.6, 1.95, 1.55, 40], full: [7.0, 1.8, 1.15, 42], wide: [12, 3.8, 1.2, 45], low: [3.4, 0.6, 1.8, 44], high: [5.5, 6.5, 0.6, 45] };
function placeCamera(cam, lt, sd, T) {
  const p = sd > 0 ? clamp(lt / sd) : 0;
  let pos, look, fov = 42;
  if (cam.from) {
    const pf = cam.ease === false ? p : ease(p);
    pos = new THREE.Vector3(...cam.from); if (cam.to) pos.lerp(new THREE.Vector3(...cam.to), pf);
    look = new THREE.Vector3(...(cam.look || [0, 1.5, 0])); if (cam.look2) look.lerp(new THREE.Vector3(...cam.look2), pf);
    if (cam.follow) look.add(actorPos(cam.follow));
    if (cam.rel) pos.add(actorPos(cam.rel));
    fov = cam.fov || 42;
  } else {
    if (AUTOCUT && !cam.noCut && sd > 4.2 && p > 0.52) { const multi = Array.isArray(cam.on) && cam.on.length > 1; const tighter = { full: 'medium', medium: 'close', close: 'face', face: 'close', wide: 'full' }; cam = { ...cam, type: multi ? (cam.type || 'medium') : (tighter[cam.type || 'medium'] || cam.type), side: (cam.side || 0) + (cam.side > 0 ? -25 : 25), dist: cam.dist ? cam.dist * (multi ? 0.9 : 0.75) : undefined, push: 0.08 }; if (cam.h !== undefined && !multi) { cam.h -= 0.05; } }
    const type = cam.type || 'medium'; const [dist, hy, ly, f] = CAMS[type] || CAMS.medium;
    const ids = Array.isArray(cam.on) ? cam.on : [cam.on];
    const c = new THREE.Vector3(); ids.forEach(id => c.add(actorPos(id))); c.multiplyScalar(1 / ids.length);
    let fwd = cam.dir !== undefined ? new THREE.Vector3(Math.sin(cam.dir * DEG), 0, Math.cos(cam.dir * DEG)) : actorFwd(ids[0]);
    const ang = (cam.side || 0) * DEG; fwd.applyAxisAngle(new THREE.Vector3(0, 1, 0), ang);
    const scale = ids.length > 1 ? 1 : (ACTORS[ids[0]] ? ACTORS[ids[0]].root.scale.y : 1);
    let d = (cam.dist || dist) * (ids.length > 1 ? 1 + 0.35 * c.distanceTo(actorPos(ids[1])) / 2 : 1) * scale;
    const push = cam.push ?? 0.12; d *= 1 - push * ease(p);
    pos = c.clone().addScaledVector(fwd, d); pos.y = (cam.h ?? hy) * scale + (c.y);
    look = c.clone(); look.y = (cam.ly ?? ly) * scale + c.y;
    if (cam.pan) { const right = new THREE.Vector3(fwd.z, 0, -fwd.x); pos.addScaledVector(right, lerp(-cam.pan, cam.pan, ease(p))); }
    if (cam.ox) { const right = new THREE.Vector3(fwd.z, 0, -fwd.x); pos.addScaledVector(right, cam.ox); look.addScaledVector(right, cam.ox * 0.6); }
    fov = cam.fov || f;
  }
  // léger mouvement "caméra à l'épaule"
  const hh = cam.still ? 0 : 1;
  pos.x += Math.sin(T * 0.9) * 0.03 * hh; pos.y += Math.sin(T * 1.3) * 0.02 * hh;
  if (SHAKE > 0) { pos.x += (Math.random() - 0.5) * SHAKE; pos.y += (Math.random() - 0.5) * SHAKE; }
  camera.position.copy(pos); camera.fov = fov; camera.updateProjectionMatrix(); camera.lookAt(look);
  if (cam.roll) camera.rotateZ(cam.roll * DEG);
  return look;
}
let SHAKE = 0; let AUTOCUT = false; let MERGE = true;

// fusion des meshes statiques d'un décor (beaucoup moins d'appels de dessin)
function mergeStatic(root) {
  root.updateMatrixWorld(true);
  const buckets = new Map(); const keep = [];
  root.traverse(o => {
    if (!o.isMesh) return;
    if (Array.isArray(o.material) || o.material.transparent || o.geometry.groups.length > 1) { keep.push(o); return; }
    const k = o.material.uuid + (o.castShadow ? 'c' : 'n');
    if (!buckets.has(k)) buckets.set(k, []); buckets.get(k).push(o);
  });
  const out = new THREE.Group();
  for (const [k, list] of buckets) {
    const geos = list.map(o => { let g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone(); g.applyMatrix4(o.matrixWorld); for (const a of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(a)) g.deleteAttribute(a); if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2)); return g; });
    let merged = null; try { merged = mergeGeometries(geos, false); } catch (e) { merged = null; }
    if (!merged) { list.forEach(o => keep.push(o)); continue; }
    const m = new THREE.Mesh(merged, list[0].material); m.castShadow = list[0].castShadow; m.receiveShadow = true; out.add(m);
  }
  for (const o of keep) { const c = o.clone(); o.matrixWorld.decompose(c.position, c.quaternion, c.scale); out.add(c); }
  root.traverse(o => { if (o.isLight) { const c = o.clone(); o.getWorldPosition(c.position); if (o.target) { const t = new THREE.Object3D(); o.target.getWorldPosition(t.position); out.add(t); c.target = t; } out.add(c); } });
  return out;
}

// ---------- orchestration ----------
let STORY = null, TL = null; const ACTORS = {}; let curShot = -1; let setGroup = null; const setCache = new Map(); let shotProps = null;
function getActor(id) {
  if (!ACTORS[id]) { const def = STORY.cast[id]; if (!def) throw new Error('acteur inconnu ' + id); const root = makeChar(def); ACTORS[id] = { root, def }; }
  return ACTORS[id];
}
function enterShot(i) {
  const sh = STORY.shots[i];
  // décor
  const key = JSON.stringify([sh.set || 'street', sh.setOpt || {}]);
  if (setGroup) scene.remove(setGroup);
  if (!setCache.has(key)) { const raw = SETS[sh.set || 'street'](sh.setOpt || {}); setCache.set(key, MERGE ? mergeStatic(raw) : raw); }
  setGroup = setCache.get(key); scene.add(setGroup);
  // props
  if (shotProps) scene.remove(shotProps);
  shotProps = new THREE.Group();
  (sh.props || []).forEach(p => { const o = makeProp(p); o.position.set(p.at[0], p.at[1] ?? 0, p.at[2] ?? p.at[1] ?? 0); if (p.at.length === 2) o.position.set(p.at[0], 0, p.at[1]); o.rotation.y = (p.rot || 0) * DEG; if (p.s) o.scale.setScalar(p.s); o.userData.spec = p; shotProps.add(o); });
  scene.add(shotProps);
  // acteurs
  Object.values(ACTORS).forEach(a => { if (a.root.parent) a.root.parent.remove(a.root); });
  (sh.actors || []).forEach(a => {
    const A = getActor(a.id); scene.add(A.root);
    A.root.position.set(a.at[0], a.y || 0, a.at[1]); A.root.rotation.y = (a.rot || 0) * DEG; A.spec = a;
    // objet tenu spécifique au plan
    const hand = A.root.userData.armR.userData.hand; if (hand.userData.held) { hand.remove(hand.userData.held); hand.userData.held = null; }
    if (a.hold) { const h = makeHeld(a.hold); hand.add(h); hand.userData.held = h; }
    const handL = A.root.userData.armL.userData.hand; if (handL.userData.held) { handL.remove(handL.userData.held); handL.userData.held = null; }
    if (a.holdL) { const h = makeHeld(a.holdL); handL.add(h); handL.userData.held = h; }
    A.root.visible = true;
  });
  applyLight(sh.light || 'day', new THREE.Vector3(...(sh.focus || [0, 0, 0])));
}
function setFace(A, expr) {
  const d = A.def; const f = { expr, glasses: d.glasses, sunglasses: d.sunglasses, mustache: d.mustache, beard: d.beard, lashes: d.lashes, lips: d.lips, blush: d.blush, scar: d.scar, blood: d.blood, pupil: d.pupil, sweat: d.sweat };
  if (typeof expr === 'object') Object.assign(f, expr);
  const key = JSON.stringify(f); const fp = A.root.userData.facePlane;
  if (A.root.userData.faceKey !== key) { fp.material.map = faceTexture(f); fp.material.needsUpdate = true; A.root.userData.faceKey = key; }
}
function updateActors(sh, lt, sd, T) {
  const p = sd > 0 ? clamp(lt / sd) : 0;
  (sh.actors || []).forEach(a => {
    const A = ACTORS[a.id]; let anim = a.anim || 'idle', face = a.face || 'neutral';
    let pos = [a.at[0], a.at[1]]; let rot = a.rot || 0; let y = a.y || 0;
    (a.ev || []).forEach(e => { if (p >= e.t) { if (e.anim) anim = e.anim; if (e.face) face = e.face; if (e.rot !== undefined) rot = e.rot; if (e.hide) A.root.visible = false; if (e.show) A.root.visible = true; } });
    if (a.to) { const t0 = a.t0 ?? 0, t1 = a.t1 ?? 1; const q = clamp((p - t0) / (t1 - t0)); const qq = a.linear ? q : ease(q); pos = [lerp(a.at[0], a.to[0], qq), lerp(a.at[1], a.to[1], qq)]; if (a.y2 !== undefined) y = lerp(a.y || 0, a.y2, qq); }
    A.root.position.set(pos[0], y, pos[1]); A.root.rotation.y = rot * DEG;
    if (a.spin) A.root.rotation.y += lt * a.spin;
    if (a.scaleTo) A.root.scale.setScalar(lerp(A.def.scale || 1, a.scaleTo, ease(p)));
    pose(A.root, anim, T + (a.phase || 0));
    if (a.talk && anim === 'idle') pose(A.root, 'talk', T);
    setFace(A, face);
  });
  // foules
  if (shotProps) shotProps.children.forEach(o => {
    if (o.userData.isCrowd) o.children.forEach(ch => { pose(ch, ch.userData.crowdAnim, T + ch.userData.phase); if (!ch.userData.faced) { const fp = ch.userData.facePlane; fp.material.map = faceTexture({ expr: ch.userData.faceE }); fp.material.needsUpdate = true; ch.userData.faced = true; } });
    const sp = o.userData.spec; if (sp && sp.to) { const t0 = sp.t0 ?? 0, t1 = sp.t1 ?? 1; const q = ease(clamp((p - t0) / (t1 - t0))); o.position.set(lerp(sp.at[0], sp.to[0], q), lerp(sp.at.length === 2 ? 0 : sp.at[1], sp.to.length === 2 ? 0 : sp.to[1], q), lerp(sp.at.length === 2 ? sp.at[1] : sp.at[2], sp.to.length === 2 ? sp.to[1] : sp.to[2], q)); }
    if (sp && sp.spin) o.rotation.y = lt * sp.spin;
    if (sp && sp.bob) o.position.y = (sp.at.length === 3 ? sp.at[1] : 0) + Math.sin(T * 3) * sp.bob;
    if (sp && sp.pulse) o.scale.setScalar((sp.s || 1) * (1 + Math.abs(Math.sin(T * 9)) * sp.pulse));
    if (o.userData.tail) o.userData.tail.rotation.z = Math.sin(T * 14) * 0.6;
    if (sp && sp.hideAt !== undefined) o.visible = p < sp.hideAt;
    if (sp && sp.showAt !== undefined) o.visible = p >= sp.showAt;
  });
}

window.setup = async (story, tl) => {
  await document.fonts.load('800 40px P'); await document.fonts.load('900 40px P'); await document.fonts.load('700 40px P');
  STORY = story; TL = tl; AUTOCUT = !!story.autocut;
  CHUNKS = [];
  tl.shots.forEach((s) => s.chunks.forEach(c => CHUNKS.push(c)));
  return true;
};
window.frame = (T) => {
  // trouver le plan
  let i = TL.shots.findIndex(s => T >= s.start && T < s.start + s.dur); if (i < 0) i = TL.shots.length - 1;
  if (i !== curShot) { enterShot(i); curShot = i; }
  const sh = STORY.shots[i]; const ts = TL.shots[i]; const lt = T - ts.start; const sd = ts.dur;
  updateActors(sh, lt, sd, T);
  SHAKE = 0; (sh.fx || []).forEach(f => { if (f.type === 'shake') { const a = (f.from ?? 0) * sd, b = (f.to ?? 1) * sd; if (lt >= a && lt <= b) SHAKE = f.amt || 0.15; } });
  const look = placeCamera(sh.cam || { type: 'medium', on: sh.actors?.[0]?.id }, lt, sd, T);
  sun.position.set(look.x + (LIGHTS[sh.light || 'day'].sun[2][0]), LIGHTS[sh.light || 'day'].sun[2][1], look.z + LIGHTS[sh.light || 'day'].sun[2][2]); sun.target.position.set(look.x, 0, look.z);
  renderer.render(scene, camera);
  // overlay
  octx.clearRect(0, 0, W, H);
  const fxList = [...(STORY.persist || []).filter(f => T >= f.t0 && T < f.t1).map(f => ({ ...f, _persist: true })), ...(sh.fx || [])];
  fxList.forEach(f => {
    if (f.type === 'shake') return;
    let a, b, flt;
    if (f._persist) { a = f.t0; b = f.t1; flt = T - f.t0; }
    else { a = (f.from ?? 0) * sd; b = (f.to ?? 1) * sd; flt = lt - a; }
    if (f._persist ? true : (lt >= a && lt <= b)) { const fn = FX[f.type]; if (fn) fn(octx, f, flt, T, b - a); }
  });
  CAPY = sh.capY || 760;
  if (!sh.nocap) drawCaption(octx, null, T);
  fctx.drawImage(gl, 0, 0); fctx.drawImage(ov, 0, 0);
  return out.toDataURL('image/jpeg', 0.9);
};
window.ready = true;
