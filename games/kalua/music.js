/* Les Échoués de Kalua — musique du menu titre, composée et jouée en direct (Web Audio).
 * Épique (cuivres, cordes, tambours) et mignonne (marimba, clochettes), 120 BPM, boucle de 16 mesures (32 s).
 * Partie A : intro mignonne · Partie B : thème héroïque · Partie C : refrain rythmé. */
"use strict";

const Music = (() => {
  const BPM = 120, STEP = 60 / BPM / 4; // une double-croche
  const BAR = STEP * 16;
  const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
  // accords : [basse, notes du nappage]
  const CH = { C: [48, [60, 64, 67]], G: [43, [55, 59, 62]], Am: [45, [57, 60, 64]], F: [41, [53, 57, 60]], E: [40, [56, 59, 64]], Em: [40, [55, 59, 64]] };
  // mélodies : [pas, note, durée en pas]
  const SONG = [
    // A — intro mignonne (clochettes + marimba)
    { part: "A", ch: "C", mel: [[0, 76, 2], [2, 79, 2], [4, 84, 4], [8, 79, 2], [10, 76, 2], [12, 79, 4]] },
    { part: "A", ch: "G", mel: [[0, 74, 2], [2, 79, 2], [4, 83, 4], [8, 81, 4], [12, 79, 4]] },
    { part: "A", ch: "Am", mel: [[0, 72, 2], [2, 76, 2], [4, 81, 4], [8, 79, 2], [10, 76, 2], [12, 72, 4]] },
    { part: "A", ch: "F", mel: [[0, 77, 4], [4, 76, 4], [8, 74, 4], [12, 79, 4]], fill: true },
    // B — thème héroïque (cuivres + cordes + tambours)
    { part: "B", ch: "Am", mel: [[0, 69, 4], [4, 76, 4], [8, 74, 2], [10, 72, 2], [12, 74, 4]] },
    { part: "B", ch: "F", mel: [[0, 72, 6], [6, 74, 2], [8, 76, 8]] },
    { part: "B", ch: "C", mel: [[0, 79, 4], [4, 76, 4], [8, 72, 4], [12, 76, 4]] },
    { part: "B", ch: "G", mel: [[0, 74, 8], [8, 71, 4], [12, 67, 4]], fill: true },
    { part: "B", ch: "Am", mel: [[0, 69, 4], [4, 76, 4], [8, 81, 6], [14, 79, 2]] },
    { part: "B", ch: "F", mel: [[0, 77, 6], [6, 76, 2], [8, 74, 4], [12, 72, 4]] },
    { part: "B", ch: "G", mel: [[0, 74, 4], [4, 76, 4], [8, 77, 4], [12, 74, 4]] },
    { part: "B", ch: "E", mel: [[0, 76, 12], [12, 68, 4]], fill: true },
    // C — refrain rythmé et mignon (clochettes syncopées)
    { part: "C", ch: "F", mel: [[0, 81, 2], [3, 84, 2], [6, 81, 2], [8, 79, 4], [12, 77, 4]] },
    { part: "C", ch: "G", mel: [[0, 79, 2], [3, 83, 2], [6, 79, 2], [8, 74, 4], [12, 79, 4]] },
    { part: "C", ch: "Em", mel: [[0, 76, 2], [3, 79, 2], [6, 83, 2], [8, 81, 2], [10, 79, 2], [12, 76, 4]] },
    { part: "C", ch: "Am", mel: [[0, 81, 4], [4, 76, 2], [6, 72, 2], [8, 69, 8]], fill: true },
  ];

  // ---------------------------------------------------------------- instruments
  function makeBus(ac, dest) {
    const comp = ac.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3; comp.attack.value = .01; comp.release.value = .2;
    const master = ac.createGain(); master.gain.value = .9; comp.connect(master); master.connect(dest);
    // réverbération (impulsion générée)
    const len = ac.sampleRate * 2.2, ir = ac.createBuffer(2, len, ac.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
    const rev = ac.createConvolver(); rev.buffer = ir; const revGain = ac.createGain(); revGain.gain.value = .28; rev.connect(revGain); revGain.connect(comp);
    const noise = ac.createBuffer(1, ac.sampleRate, ac.sampleRate); { const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    return { ac, dry: comp, rev, master, noise };
  }
  const env = (g, t, a, peak, d, sus, r, end) => { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.setTargetAtTime(sus, t + a, d); g.gain.setTargetAtTime(0, end, r); };
  function out(bus, node, wet = .3, vol = 1) { const g = bus.ac.createGain(); g.gain.value = vol; node.connect(g); g.connect(bus.dry); if (wet) { const w = bus.ac.createGain(); w.gain.value = wet; g.connect(w); w.connect(bus.rev); } return g; }

  function bell(bus, t, n, dur, vol = .16) { // clochette / glockenspiel
    const ac = bus.ac;
    for (const [mul, v] of [[1, 1], [2.76, .25], [5.4, .08]]) { const o = ac.createOscillator(); o.type = "sine"; o.frequency.value = midi(n) * mul; const g = ac.createGain();
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol * v, t + .005); g.gain.exponentialRampToValueAtTime(.0001, t + Math.max(.35, dur * 2.2)); o.connect(g); out(bus, g, .45); o.start(t); o.stop(t + Math.max(.4, dur * 2.3)); }
  }
  function marimba(bus, t, n, vol = .12) {
    const ac = bus.ac, o = ac.createOscillator(), o2 = ac.createOscillator(), g = ac.createGain(); o.type = "sine"; o2.type = "triangle"; o.frequency.value = midi(n); o2.frequency.value = midi(n) * 4;
    const g2 = ac.createGain(); g2.gain.value = .12; o2.connect(g2); g2.connect(g); o.connect(g);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .004); g.gain.exponentialRampToValueAtTime(.0001, t + .32); out(bus, g, .2); o.start(t); o2.start(t); o.stop(t + .35); o2.stop(t + .35);
  }
  function brass(bus, t, n, dur, vol = .11) { // cuivres héroïques
    const ac = bus.ac, f = ac.createBiquadFilter(); f.type = "lowpass"; f.Q.value = 2;
    f.frequency.setValueAtTime(500, t); f.frequency.linearRampToValueAtTime(2600, t + .07); f.frequency.setTargetAtTime(1400, t + .08, .2);
    const g = ac.createGain(); env(g, t, .04, vol, .3, vol * .75, .08, t + dur);
    for (const [type, det] of [["sawtooth", -7], ["sawtooth", 7], ["square", 0]]) { const o = ac.createOscillator(); o.type = type; o.frequency.value = midi(n); o.detune.value = det;
      const v = ac.createOscillator(); v.frequency.value = 5.2; const vg = ac.createGain(); vg.gain.setValueAtTime(0, t); vg.gain.linearRampToValueAtTime(7, t + .4); v.connect(vg); vg.connect(o.detune);
      o.connect(f); o.start(t); o.stop(t + dur + .5); v.start(t); v.stop(t + dur + .5); }
    f.connect(g); out(bus, g, .35);
  }
  function strings(bus, t, notes, dur, vol = .05) { // nappe de cordes
    const ac = bus.ac, f = ac.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 1800; const g = ac.createGain(); env(g, t, .35, vol, 1, vol, .4, t + dur);
    for (const n of notes) for (const det of [-9, 0, 9]) { const o = ac.createOscillator(); o.type = "sawtooth"; o.frequency.value = midi(n); o.detune.value = det; o.connect(f); o.start(t); o.stop(t + dur + 1.5); }
    f.connect(g); out(bus, g, .5);
  }
  function bass(bus, t, n, dur, vol = .2) {
    const ac = bus.ac, o = ac.createOscillator(), o2 = ac.createOscillator(), f = ac.createBiquadFilter(), g = ac.createGain();
    o.type = "triangle"; o2.type = "sawtooth"; o.frequency.value = midi(n); o2.frequency.value = midi(n); f.type = "lowpass"; f.frequency.setValueAtTime(900, t); f.frequency.setTargetAtTime(300, t, .08);
    const g2 = ac.createGain(); g2.gain.value = .35; o2.connect(g2); g2.connect(f); o.connect(f); f.connect(g);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .01); g.gain.setTargetAtTime(vol * .6, t + .02, .1); g.gain.setTargetAtTime(0, t + dur * .9, .03);
    out(bus, g, 0); o.start(t); o2.start(t); o.stop(t + dur + .2); o2.stop(t + dur + .2);
  }
  function kick(bus, t, vol = .55) { const ac = bus.ac, o = ac.createOscillator(), g = ac.createGain(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + .14);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + .35); o.connect(g); out(bus, g, 0); o.start(t); o.stop(t + .4); }
  function noiseHit(bus, t, type, freq, dur, vol, wet = .1) { const ac = bus.ac, s = ac.createBufferSource(); s.buffer = bus.noise; const f = ac.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = .8;
    const g = ac.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + dur); s.connect(f); f.connect(g); out(bus, g, wet); s.start(t, Math.random() * .5); s.stop(t + dur + .05); }
  function snare(bus, t, vol = .22) { noiseHit(bus, t, "bandpass", 1800, .18, vol, .25); const ac = bus.ac, o = ac.createOscillator(), g = ac.createGain(); o.frequency.setValueAtTime(220, t); o.frequency.exponentialRampToValueAtTime(140, t + .08);
    g.gain.setValueAtTime(vol * .7, t); g.gain.exponentialRampToValueAtTime(.001, t + .12); o.connect(g); out(bus, g, .2); o.start(t); o.stop(t + .15); }
  const hat = (bus, t, vol = .05) => noiseHit(bus, t, "highpass", 8000, .05, vol, .05);
  const shaker = (bus, t, vol = .035) => noiseHit(bus, t, "bandpass", 6000, .07, vol, .05);
  function tom(bus, t, f0, vol = .35) { const ac = bus.ac, o = ac.createOscillator(), g = ac.createGain(); o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f0 * .55, t + .25);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + .4); o.connect(g); out(bus, g, .3); o.start(t); o.stop(t + .45); }
  const cymbal = (bus, t, vol = .09) => noiseHit(bus, t, "highpass", 5000, 1.6, vol, .4);

  // ---------------------------------------------------------------- une mesure
  function playBar(bus, i, t) {
    const b = SONG[i % SONG.length], [root, notes] = CH[b.ch], S = (k) => t + k * STEP;
    const first = i % SONG.length;
    if (first === 0 || first === 4 || first === 12) cymbal(bus, t, first === 4 ? .12 : .07);
    // mélodie
    for (const [st, n, len] of b.mel) {
      if (b.part === "B") { brass(bus, S(st), n, len * STEP); if (len >= 4) bell(bus, S(st), n + 12, len * STEP, .035); }
      else bell(bus, S(st), n, len * STEP, b.part === "A" ? .15 : .17);
    }
    // accompagnement
    if (b.part === "A") {
      for (let k = 0; k < 16; k += 2) marimba(bus, S(k), notes[(k / 2) % 3] + 12 + (k % 8 === 6 ? 12 : 0), .09);
      for (const k of [0, 8]) bass(bus, S(k), root, 6 * STEP, .16);
      for (const k of [0, 8]) kick(bus, S(k), .35);
      for (let k = 2; k < 16; k += 4) shaker(bus, S(k));
      if (first === 1 || first === 3) strings(bus, t, notes, BAR, .02);
    } else if (b.part === "B") {
      strings(bus, t, notes.concat([notes[0] + 12]), BAR, .045);
      for (let k = 0; k < 16; k += 2) bass(bus, S(k), root + (k % 4 === 2 ? 12 : 0), STEP * 1.8, .17);
      for (const k of [0, 6, 8, 10]) kick(bus, S(k), k === 0 ? .6 : .45);
      for (const k of [4, 12]) snare(bus, S(k));
      for (let k = 0; k < 16; k++) hat(bus, S(k), k % 2 ? .03 : .05);
    } else {
      strings(bus, t, notes, BAR, .025);
      for (let k = 0; k < 16; k += 2) marimba(bus, S(k), notes[[0, 1, 2, 1][(k / 2) % 4]] + 12, .08);
      for (const k of [0, 3, 6, 8, 11, 14]) bass(bus, S(k), root + (k === 6 || k === 14 ? 12 : 0), STEP * 1.6, .17);
      for (const k of [0, 7, 8]) kick(bus, S(k), .5);
      for (const k of [4, 12]) snare(bus, S(k), .18);
      for (let k = 2; k < 16; k += 4) hat(bus, S(k), .06);
      for (let k = 1; k < 16; k += 2) shaker(bus, S(k), .025);
    }
    // roulement de toms en fin de phrase
    if (b.fill) { [[12, 196], [13, 165], [14, 131], [15, 110]].forEach(([k, f]) => tom(bus, S(k), f)); }
  }

  // ---------------------------------------------------------------- lecture en direct
  let ac = null, bus = null, timer = null, nextBar = 0, nextT = 0, playing = false, enabled = true, out0 = null;
  function ensure() {
    if (ac) return true;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    ac = new AC(); out0 = ac.createGain(); out0.gain.value = 0; out0.connect(ac.destination); bus = makeBus(ac, out0); return true;
  }
  function tick() {
    if (!playing) return;
    while (nextT < ac.currentTime + .25) { playBar(bus, nextBar, nextT); nextBar++; nextT += BAR; }
  }
  // À appeler pendant un toucher : réveille le son (iPhone le laisse « suspended » ou « interrupted » sinon)
  function unlock() {
    if (!ensure()) return;
    if (ac.state !== "running") ac.resume().catch(() => {});
    try { // un son vide d'un échantillon : nécessaire sur les anciens iPhone pour débloquer l'audio
      const s = ac.createBufferSource(); s.buffer = ac.createBuffer(1, 1, 22050); s.connect(ac.destination); s.start(0);
    } catch { /* ignore */ }
  }
  function start() {
    if (!enabled || !ensure()) return;
    if (ac.state !== "running") ac.resume().catch(() => {});
    if (playing) return;
    playing = true; nextBar = 0; nextT = ac.currentTime + .08;
    out0.gain.cancelScheduledValues(ac.currentTime); out0.gain.setValueAtTime(out0.gain.value, ac.currentTime); out0.gain.linearRampToValueAtTime(.8, ac.currentTime + .6);
    tick(); timer = setInterval(tick, 60);
  }
  function stop(fade = .8) {
    if (!playing) return; playing = false; clearInterval(timer);
    const t = ac.currentTime; out0.gain.cancelScheduledValues(t); out0.gain.setValueAtTime(out0.gain.value, t); out0.gain.linearRampToValueAtTime(0, t + fade);
    // on coupe les notes déjà programmées en recréant la sortie
    const old = out0; setTimeout(() => { try { old.disconnect(); } catch { /* ignore */ } }, fade * 1000 + 100);
    out0 = ac.createGain(); out0.gain.value = 0; out0.connect(ac.destination); bus = makeBus(ac, out0);
  }
  // Rendu hors-ligne (aperçu à écouter / tests)
  async function render(seconds = 32) {
    const oac = new OfflineAudioContext(2, 44100 * seconds, 44100), b = makeBus(oac, oac.destination);
    for (let i = 0, t = .05; t < seconds; i++, t += BAR) playBar(b, i, t);
    return oac.startRendering();
  }
  return { start, stop, render, unlock, get running() { return Boolean(ac) && ac.state === "running"; }, get playing() { return playing; }, setEnabled(v) { enabled = v; if (!v) stop(.3); } };
})();
