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

  // ---------------------------------------------------------------- nouveaux instruments
  function flute(bus, t, n, dur, vol = .09) { // flûte douce avec souffle et vibrato
    const ac = bus.ac, o = ac.createOscillator(), g = ac.createGain(); o.type = "sine"; o.frequency.value = midi(n);
    const v = ac.createOscillator(), vg = ac.createGain(); v.frequency.value = 5; vg.gain.setValueAtTime(0, t); vg.gain.linearRampToValueAtTime(9, t + .3); v.connect(vg); vg.connect(o.detune);
    const o2 = ac.createOscillator(); o2.type = "triangle"; o2.frequency.value = midi(n) * 2; const g2 = ac.createGain(); g2.gain.value = .15; o2.connect(g2); g2.connect(g);
    env(g, t, .06, vol, .2, vol * .8, .08, t + dur); o.connect(g); out(bus, g, .45);
    o.start(t); o2.start(t); v.start(t); o.stop(t + dur + .5); o2.stop(t + dur + .5); v.stop(t + dur + .5);
    noiseHit(bus, t, "bandpass", midi(n) * 2, .08, vol * .25, .2);
  }
  function pluck(bus, t, n, vol = .12) { // harpe / guitare pincée
    const ac = bus.ac, o = ac.createOscillator(), f = ac.createBiquadFilter(), g = ac.createGain(); o.type = "sawtooth"; o.frequency.value = midi(n);
    f.type = "lowpass"; f.frequency.setValueAtTime(4000, t); f.frequency.exponentialRampToValueAtTime(300, t + .5);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .003); g.gain.exponentialRampToValueAtTime(.0001, t + 1.1); o.connect(f); f.connect(g); out(bus, g, .35); o.start(t); o.stop(t + 1.2);
  }
  function choir(bus, t, notes, dur, vol = .05, vowel = "a") { // chœur (formants)
    const ac = bus.ac, F = { a: [800, 1150], o: [450, 800], u: [325, 700], e: [400, 1600] }[vowel] || [800, 1150];
    const g = ac.createGain(); env(g, t, .5, vol, 1, vol, .6, t + dur);
    for (const fr of F) { const bp = ac.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = fr; bp.Q.value = 6; bp.connect(g);
      for (const n of notes) for (const det of [-12, 6]) { const o = ac.createOscillator(); o.type = "sawtooth"; o.frequency.value = midi(n); o.detune.value = det; o.connect(bp); o.start(t); o.stop(t + dur + 2); } }
    out(bus, g, .7, 2.2);
  }
  function chip(bus, t, n, dur, vol = .06, type = "square") { // son 8 bits
    const ac = bus.ac, o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.value = midi(n);
    g.gain.setValueAtTime(vol, t); g.gain.setValueAtTime(vol * .7, t + .05); g.gain.setValueAtTime(0, t + Math.max(.06, dur * .9)); o.connect(g); out(bus, g, .08); o.start(t); o.stop(t + dur + .05);
  }
  function drone(bus, t, n, dur, vol = .06) { // bourdon grave inquiétant
    const ac = bus.ac, f = ac.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 420; const g = ac.createGain(); env(g, t, 1.2, vol, 1, vol, 1, t + dur);
    for (const [m, det] of [[1, -6], [1, 6], [1.5, 0]]) { const o = ac.createOscillator(); o.type = "sawtooth"; o.frequency.value = midi(n) * m; o.detune.value = det; o.connect(f); o.start(t); o.stop(t + dur + 3); }
    const l = ac.createOscillator(), lg = ac.createGain(); l.frequency.value = .15; lg.gain.value = 180; l.connect(lg); lg.connect(f.frequency); l.start(t); l.stop(t + dur + 3);
    f.connect(g); out(bus, g, .6);
  }
  const taiko = (bus, t, vol = .5) => { tom(bus, t, 90, vol); noiseHit(bus, t, "lowpass", 300, .25, vol * .4, .3); };

  // ---------------------------------------------------------------- générateur de thèmes
  // Chaque thème est décrit par quelques réglages ; la mélodie est composée une fois (graine fixe) puis jouée en boucle.
  const SCALES = { maj: [0, 2, 4, 5, 7, 9, 11], min: [0, 2, 3, 5, 7, 8, 10], dor: [0, 2, 3, 5, 7, 9, 10], phr: [0, 1, 3, 5, 7, 8, 10], harm: [0, 2, 3, 5, 7, 8, 11], lyd: [0, 2, 4, 6, 7, 9, 11], pent: [0, 2, 4, 7, 9] };
  const T = (o) => Object.assign({ bpm: 96, key: 57, sc: "min", prog: [0, 5, 3, 4], lead: "flute", pad: .03, drums: "soft", bass: "root", dens: .5, seed: 1, oct: 12, vol: .8 }, o);
  const THEMES = {
    title: { song: true, vol: .8 },
    intro: T({ bpm: 76, key: 50, sc: "harm", prog: [0, 5, 6, 4, 0, 5, 3, 4], lead: "brass", pad: .05, drums: "epic", bass: "drone", dens: .35, seed: 7, choir: "a" }),
    storm: T({ bpm: 132, key: 50, sc: "harm", prog: [0, 0, 5, 4], lead: "strings", pad: .05, drums: "war", bass: "eighth", dens: .7, seed: 3, choir: "o" }),
    beach: T({ bpm: 100, key: 62, sc: "maj", prog: [0, 4, 5, 3], lead: "marimba", pad: .02, drums: "island", bass: "bounce", dens: .55, seed: 11 }),
    village: T({ bpm: 92, key: 60, sc: "maj", prog: [0, 3, 4, 0, 5, 3, 1, 4], lead: "pluck", pad: .025, drums: "soft", bass: "root", dens: .55, seed: 21 }),
    jungle: T({ bpm: 104, key: 57, sc: "dor", prog: [0, 6, 3, 4], lead: "flute", pad: .025, drums: "tribal", bass: "bounce", dens: .5, seed: 31 }),
    marais: T({ bpm: 70, key: 52, sc: "phr", prog: [0, 1, 0, 6], lead: "bell", pad: .03, drums: "none", bass: "drone", dens: .25, seed: 41, choir: "u" }),
    falaises: T({ bpm: 88, key: 62, sc: "lyd", prog: [0, 1, 4, 0], lead: "flute", pad: .03, drums: "soft", bass: "root", dens: .4, seed: 51 }),
    volcan: T({ bpm: 96, key: 50, sc: "harm", prog: [0, 1, 0, 4], lead: "brass", pad: .03, drums: "tribal", bass: "eighth", dens: .45, seed: 61 }),
    night: T({ bpm: 66, key: 60, sc: "maj", prog: [0, 5, 3, 4], lead: "bell", pad: .025, drums: "none", bass: "root", dens: .3, seed: 71 }),
    iles: T({ bpm: 98, key: 64, sc: "pent", prog: [0, 3, 4, 0], lead: "marimba", pad: .02, drums: "island", bass: "bounce", dens: .5, seed: 81 }),
    sea: T({ bpm: 84, key: 55, sc: "dor", prog: [0, 3, 6, 4], lead: "strings", pad: .04, drums: "soft", bass: "root", dens: .4, seed: 91, choir: "o" }),
    caveDoux: T({ bpm: 72, key: 55, sc: "min", prog: [0, 5, 6, 4], lead: "bell", pad: .025, drums: "none", bass: "drone", dens: .3, seed: 101 }),
    cavePix: T({ bpm: 120, key: 57, sc: "min", prog: [0, 5, 3, 4], lead: "chip", pad: 0, drums: "chip", bass: "chip", dens: .6, seed: 111 }),
    caveVolcan: T({ bpm: 112, key: 50, sc: "phr", prog: [0, 1, 0, 6], lead: "chip", pad: .02, drums: "chip", bass: "chip", dens: .55, seed: 121, choir: "u" }),
    danger: T({ bpm: 140, key: 52, sc: "harm", prog: [0, 1, 0, 1], lead: "strings", pad: .03, drums: "war", bass: "eighth", dens: .6, seed: 131 }),
    battle: T({ bpm: 138, key: 57, sc: "harm", prog: [0, 5, 6, 4], lead: "brass", pad: .03, drums: "war", bass: "eighth", dens: .65, seed: 141 }),
    miniboss: T({ bpm: 146, key: 55, sc: "phr", prog: [0, 1, 6, 4], lead: "brass", pad: .03, drums: "war", bass: "eighth", dens: .7, seed: 151 }),
    sad: T({ bpm: 62, key: 57, sc: "min", prog: [0, 5, 3, 4, 0, 5, 6, 4], lead: "strings", pad: .04, drums: "none", bass: "root", dens: .3, seed: 161 }),
    reveal: T({ bpm: 70, key: 50, sc: "harm", prog: [0, 6, 5, 4], lead: "bell", pad: .04, drums: "epic", bass: "drone", dens: .3, seed: 171, choir: "a" }),
    hope: T({ bpm: 84, key: 62, sc: "maj", prog: [0, 4, 5, 3, 0, 4, 3, 4], lead: "strings", pad: .04, drums: "soft", bass: "root", dens: .45, seed: 181, choir: "a" }),
    quest: T({ bpm: 90, key: 59, sc: "dor", prog: [0, 3, 4, 6], lead: "pluck", pad: .03, drums: "soft", bass: "bounce", dens: .5, seed: 191 }),
    final: T({ bpm: 150, key: 50, sc: "harm", prog: [0, 5, 1, 4, 0, 5, 6, 4], lead: "brass", pad: .05, drums: "war", bass: "eighth", dens: .75, seed: 201, choir: "a" }),
    finalChant: T({ bpm: 80, key: 50, sc: "min", prog: [0, 5, 3, 4], lead: "choirlead", pad: .05, drums: "epic", bass: "drone", dens: .35, seed: 211, choir: "a" }),
    credits: T({ bpm: 88, key: 60, sc: "maj", prog: [0, 4, 5, 3, 0, 4, 3, 4], lead: "bell", pad: .035, drums: "soft", bass: "root", dens: .5, seed: 221, choir: "o" }),
  };
  // un thème de boss par gardien et par grotte (même ossature épique et sombre, couleur différente)
  const BOSS_COLORS = { B1: [52, "harm", "brass"], B2: [50, "phr", "strings"], B3: [45, "dor", "brass"], B4: [47, "phr", "flute"], B5: [48, "harm", "choirlead"], B6: [53, "min", "bell"],
    B7: [52, "phr", "choirlead"], B8: [55, "harm", "brass"], B9: [57, "dor", "strings"], B10: [46, "min", "brass"], B11: [50, "phr", "brass"], B12: [51, "harm", "strings"],
    c1: [45, "harm", "chip"], c2: [52, "min", "brass"], c3: [47, "phr", "chip"], c4: [55, "dor", "strings"] };
  Object.entries(BOSS_COLORS).forEach(([id, [key, sc, lead]], i) => {
    THEMES["boss" + id] = T({ bpm: 132 + (i % 4) * 6, key, sc, prog: [0, 5, 1, 4, 0, 6, 5, 4], lead, pad: .04, drums: lead === "chip" ? "chip" : "war", bass: lead === "chip" ? "chip" : "eighth", dens: .7, seed: 300 + i * 13, choir: i % 2 ? "a" : "o" });
  });

  const rngOf = (seed) => { let s = seed >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; };
  function compose(th) { // mélodie : un motif de 2 mesures, varié ensuite
    if (th.mel) return th.mel;
    const r = rngOf(th.seed), bars = th.prog.length, mel = [];
    const rhythms = th.dens > .6 ? [[0, 2, 4, 6, 8, 10, 12, 14], [0, 3, 6, 8, 10, 12], [0, 2, 3, 4, 8, 11, 12]] : th.dens > .4 ? [[0, 4, 6, 8, 12], [0, 3, 6, 8, 12, 14], [0, 4, 8, 10, 12]] : [[0, 8], [0, 6, 8], [0, 4, 8, 12], [0, 12]];
    let deg = 4;
    const motif = [];
    for (let b = 0; b < 2; b++) { const rh = rhythms[Math.floor(r() * rhythms.length)], notes = []; for (let k = 0; k < rh.length; k++) { deg += Math.floor(r() * 5) - 2; deg = Math.max(0, Math.min(11, deg)); notes.push([rh[k], deg, (rh[k + 1] ?? 16) - rh[k]]); } motif.push(notes); }
    for (let b = 0; b < bars; b++) {
      const chordDeg = th.prog[b];
      const shift = b >= 2 ? (b % 4 === 3 ? -1 : 1) * Math.floor(r() * 2) : 0;
      mel.push(motif[b % 2].map(([st, d, len], k) => { let dd = d + shift; if (k === 0) dd = chordDeg + (r() < .5 ? 2 : 4); return [st, dd, len]; }));
    }
    th.mel = mel; return mel;
  }
  const degNote = (th, d) => { const sc = SCALES[th.sc], o = Math.floor(d / sc.length), i = ((d % sc.length) + sc.length) % sc.length; return th.key + sc[i] + 12 * o; };
  const chordOf = (th, deg) => [0, 2, 4].map((k) => degNote(th, deg + k));

  function genBar(bus, th, i, t) {
    const step = 60 / th.bpm / 4, S = (k) => t + k * step, bars = th.prog.length, bi = i % bars, deg = th.prog[bi];
    const chord = chordOf(th, deg), root = degNote(th, deg) - 12, BARL = step * 16;
    const mel = compose(th)[bi], lead = th.lead, oct = th.oct, part = Math.floor(i / bars) % 2; // un tour sur deux : variante plus calme
    if (th.pad) { if (th.choir && (part === 1 || th.lead === "choirlead")) choir(bus, t, chord.map((n) => n + 12), BARL, th.pad * .9, th.choir); else strings(bus, t, chord.map((n) => n + 12), BARL, th.pad); }
    for (const [st, d, len] of mel) {
      if (part === 1 && th.dens < .6 && st % 4) continue;
      const n = degNote(th, d) + oct, dur = len * step;
      if (lead === "flute") flute(bus, S(st), n, dur);
      else if (lead === "bell") bell(bus, S(st), n + 12, dur, .12);
      else if (lead === "marimba") marimba(bus, S(st), n + 12, .12);
      else if (lead === "pluck") pluck(bus, S(st), n, .11);
      else if (lead === "brass") brass(bus, S(st), n, dur, .09);
      else if (lead === "strings") { strings(bus, S(st), [n, n + 12], dur, .03); if (part === 0) pluck(bus, S(st), n + 12, .05); }
      else if (lead === "chip") chip(bus, S(st), n + 12, Math.min(dur, step * 3), .045);
      else if (lead === "choirlead") choir(bus, S(st), [n], dur, .05, th.choir || "a");
    }
    const B = th.bass;
    if (B === "drone") { if (bi % 2 === 0) drone(bus, t, root - 12, BARL * 2, .05); }
    else if (B === "root") { bass(bus, S(0), root, step * 7, .15); bass(bus, S(8), root + (bi % 2 ? 7 : 0), step * 7, .13); }
    else if (B === "bounce") for (const k of [0, 3, 6, 8, 11, 14]) bass(bus, S(k), root + (k === 6 || k === 14 ? 12 : 0), step * 1.8, .14);
    else if (B === "eighth") for (let k = 0; k < 16; k += 2) bass(bus, S(k), root + (k % 8 === 6 ? 12 : 0), step * 1.8, .16);
    else if (B === "chip") for (let k = 0; k < 16; k += 2) chip(bus, S(k), root + (k % 4 === 2 ? 12 : 0), step * 1.6, .05, "triangle");
    const D = th.drums;
    if (D === "soft") { kick(bus, S(0), .3); if (bi % 2) kick(bus, S(10), .2); for (let k = 4; k < 16; k += 8) shaker(bus, S(k), .03); }
    else if (D === "island") { for (const k of [0, 6, 8]) kick(bus, S(k), .35); for (let k = 2; k < 16; k += 4) shaker(bus, S(k), .04); for (const k of [4, 12]) noiseHit(bus, S(k), "bandpass", 3000, .08, .05); }
    else if (D === "tribal") { for (const k of [0, 3, 6, 10]) tom(bus, S(k), k ? 140 : 100, .25); for (let k = 0; k < 16; k += 2) shaker(bus, S(k), .03); }
    else if (D === "epic") { taiko(bus, S(0), .5); if (bi % 2) { taiko(bus, S(10), .35); taiko(bus, S(12), .4); } if (bi === 0) cymbal(bus, t, .06); }
    else if (D === "war") { for (const k of [0, 6, 8, 10]) kick(bus, S(k), .5); for (const k of [4, 12]) snare(bus, S(k), .2); for (let k = 0; k < 16; k++) hat(bus, S(k), k % 2 ? .025 : .045); if (bi % 4 === 3) [[12, 196], [13, 165], [14, 131], [15, 110]].forEach(([k, f]) => tom(bus, S(k), f, .3)); if (bi === 0) cymbal(bus, t, .08); }
    else if (D === "chip") { for (const k of [0, 8]) chip(bus, S(k), 36, step, .09, "square"); for (const k of [4, 12]) noiseHit(bus, S(k), "highpass", 2000, .06, .08, 0); for (let k = 2; k < 16; k += 4) noiseHit(bus, S(k), "highpass", 7000, .03, .04, 0); }
    return BARL;
  }

  // ---------------------------------------------------------------- lecture en direct (avec fondus entre les thèmes)
  let ac = null, bus = null, timer = null, enabled = true, cur = null, want = null, duck = 1;
  function ensure() {
    if (ac) return true;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    ac = new AC(); bus = makeBus(ac, ac.destination); return true;
  }
  function tick() {
    if (!cur || !ac) return;
    // si le son était suspendu longtemps, on repart de maintenant (pas de rattrapage en rafale)
    if (cur.nextT < ac.currentTime - 1) cur.nextT = ac.currentTime + .05;
    while (cur.nextT < ac.currentTime + .3) {
      const th = THEMES[cur.id];
      if (th.song) { playBar(cur.bus, cur.bar, cur.nextT); cur.nextT += BAR; } else cur.nextT += genBar(cur.bus, th, cur.bar, cur.nextT);
      cur.bar++;
    }
  }
  function makeVoice(id) { // un « bus » par thème, branché sur une sortie dont on règle le volume pour les fondus
    const g = ac.createGain(); g.gain.value = 0; g.connect(bus.dry);
    return { id, gain: g, bus: { ac, dry: g, rev: bus.rev, master: bus.master, noise: bus.noise }, bar: 0, nextT: ac.currentTime + .1 };
  }
  function fadeOut(v, sec) { const t = ac.currentTime; v.gain.gain.cancelScheduledValues(t); v.gain.gain.setValueAtTime(v.gain.gain.value, t); v.gain.gain.linearRampToValueAtTime(0, t + sec); setTimeout(() => { try { v.gain.disconnect(); } catch { /* ignore */ } }, sec * 1000 + 3000); }
  function play(id, fade = 1.6) {
    want = id;
    if (!enabled || !THEMES[id] || !ensure()) return;
    if (ac.state !== "running") ac.resume().catch(() => {});
    if (cur && cur.id === id) return;
    if (cur) fadeOut(cur, fade);
    cur = makeVoice(id);
    const t = ac.currentTime, vol = (THEMES[id].vol || .8) * duck;
    cur.gain.gain.setValueAtTime(0, t); cur.gain.gain.linearRampToValueAtTime(vol, t + Math.max(.3, fade));
    tick(); if (!timer) timer = setInterval(tick, 80);
  }
  function stop(fade = .8) { want = null; if (!ac || !cur) return; fadeOut(cur, fade); cur = null; }
  function setDuck(v) { duck = v; if (cur && ac) { const t = ac.currentTime; cur.gain.gain.cancelScheduledValues(t); cur.gain.gain.setValueAtTime(cur.gain.gain.value, t); cur.gain.gain.linearRampToValueAtTime((THEMES[cur.id].vol || .8) * v, t + .4); } }
  function start() { play("title"); }
  // À appeler pendant un toucher : réveille le son (iPhone le laisse « suspended » ou « interrupted » sinon)
  function unlock() {
    if (!ensure()) return;
    if (ac.state !== "running") ac.resume().catch(() => {});
    try { const s = ac.createBufferSource(); s.buffer = ac.createBuffer(1, 1, 22050); s.connect(ac.destination); s.start(0); } catch { /* ignore */ }
  }

  // ---------------------------------------------------------------- petites fanfares
  function jingle(kind) {
    if (!enabled || !ensure() || ac.state !== "running") return;
    const t = ac.currentTime + .05, b = bus;
    const seq = { victory: [[0, 72], [.12, 76], [.24, 79], [.36, 84, .8]], item: [[0, 79], [.1, 83], [.2, 86, .5]], secret: [[0, 74], [.12, 78], [.24, 81], [.36, 86], [.5, 90, .7]],
      learn: [[0, 67], [.15, 72], [.3, 76], [.45, 79], [.6, 84, 1.2]], fail: [[0, 67], [.2, 63], [.4, 60, .8]], quest: [[0, 72], [.15, 79], [.3, 84, .9]], heart: [[0, 76], [.1, 80], [.2, 83], [.3, 88, .9]] }[kind] || [[0, 79]];
    if (cur) { setDuck(.35); setTimeout(() => setDuck(1), 1800); }
    for (const [dt, n, d = .25] of seq) { bell(b, t + dt, n, d, .18); if (kind === "victory" || kind === "learn") brass(b, t + dt, n - 12, d, .07); }
  }

  // ---------------------------------------------------------------- bruitages
  function sfx(name, vol = 1) {
    if (typeof SET !== "undefined" && SET.sound === false) return;
    if (!ensure() || ac.state !== "running") return;
    const t = ac.currentTime + .01, b = bus;
    const o = (type, f0, f1, dur, v) => { const x = ac.createOscillator(), g = ac.createGain(); x.type = type; x.frequency.setValueAtTime(f0, t); x.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur); g.gain.setValueAtTime(v * vol, t); g.gain.exponentialRampToValueAtTime(.001, t + dur); x.connect(g); out(b, g, .15); x.start(t); x.stop(t + dur + .05); };
    const n = (type, f, dur, v, wet = .1) => noiseHit(b, t, type, f, dur, v * vol, wet);
    switch (name) {
      case "swing": n("bandpass", 1200, .12, .08); break;
      case "hit": o("square", 220, 80, .12, .12); n("lowpass", 900, .1, .2); break;
      case "hurt": o("sawtooth", 300, 90, .25, .14); break;
      case "kill": o("triangle", 600, 60, .4, .18); n("lowpass", 600, .3, .2); break;
      case "pickup": bell(b, t, 84, .1, .12); bell(b, t + .07, 91, .1, .1); break;
      case "wood": o("triangle", 180, 120, .1, .2); n("bandpass", 700, .08, .12); break;
      case "rock": o("square", 120, 60, .1, .1); n("highpass", 2000, .06, .1); break;
      case "door": o("sawtooth", 90, 60, .5, .1); n("lowpass", 400, .5, .15, .3); break;
      case "switch": o("square", 900, 900, .05, .06); o("square", 1300, 1300, .05, .04); break;
      case "chest": bell(b, t, 72, .2, .12); bell(b, t + .1, 79, .2, .12); bell(b, t + .2, 84, .3, .14); break;
      case "fire": n("bandpass", 600, .5, .3, .3); o("sawtooth", 200, 60, .4, .06); break;
      case "water": n("bandpass", 900, .6, .25, .4); o("sine", 500, 1200, .3, .06); break;
      case "wind": n("bandpass", 500, 1, .3, .5); break;
      case "root": o("triangle", 90, 180, .5, .2); n("lowpass", 300, .4, .2); break;
      case "light": bell(b, t, 88, .5, .1); bell(b, t + .05, 95, .5, .08); break;
      case "wave": o("sine", 80, 30, .6, .4); n("lowpass", 500, .5, .3, .3); break;
      case "thunder": n("lowpass", 200, 2.4, .9, .6); o("sawtooth", 60, 30, 1.2, .2); break;
      case "boom": n("lowpass", 300, 1.2, .8, .4); o("sine", 90, 25, 1, .5); break;
      case "crash": n("lowpass", 1200, 1.4, .7, .5); o("sawtooth", 120, 40, 1, .25); for (let k = 0; k < 5; k++) noiseHit(b, t + .15 * k, "bandpass", 800 + k * 200, .2, .2 * vol, .3); break;
      case "splash": n("highpass", 1500, .5, .25, .3); break;
      case "bell": bell(b, t, 48, 2, .25); bell(b, t, 60, 2, .1); break;
      case "magic": bell(b, t, 84, .3, .08); o("sine", 400, 1600, .3, .06); break;
      case "trap": o("square", 1000, 200, .15, .08); break;
      case "fall": o("sine", 800, 80, .7, .14); break;
      case "step": n("lowpass", 300, .05, .06, 0); break;
      case "talk": o("sine", 600 + Math.random() * 300, 500, .05, .03); break;
      case "heart": o("sine", 80, 60, .15, .5); setTimeout(() => sfx("hurtbeat"), 220); break;
      case "hurtbeat": o("sine", 70, 50, .2, .4); break;
      case "roar": o("sawtooth", 160, 50, 1.2, .25); n("bandpass", 300, 1.2, .3, .4); break;
      case "puzzle": bell(b, t, 76, .2, .1); bell(b, t + .12, 83, .3, .12); break;
      default: o("sine", 600, 400, .1, .05);
    }
  }

  // Rendu hors-ligne (aperçu à écouter / tests)
  async function render(seconds = 32, id = "title") {
    const oac = new OfflineAudioContext(2, 44100 * seconds, 44100), b = makeBus(oac, oac.destination), th = THEMES[id];
    for (let i = 0, t = .05; t < seconds; i++) t += th.song ? (playBar(b, i, t), BAR) : genBar(b, th, i, t);
    return oac.startRendering();
  }
  return { start, stop, play, jingle, sfx, render, unlock, setDuck, THEMES,
    get current() { return cur ? cur.id : null; }, get wanted() { return want; },
    get running() { return Boolean(ac) && ac.state === "running"; }, get playing() { return Boolean(cur); },
    setEnabled(v) { enabled = v; if (!v) stop(.3); } };
})();
