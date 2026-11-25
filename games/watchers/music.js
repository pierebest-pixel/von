/* Watchers — musique chiptune générée en direct (Web Audio). */
"use strict";
const MUSIC = (() => {
  const NOTE = { C: 0, "C#": 1, Db: 1, D: 2, "D#": 3, Eb: 3, E: 4, F: 5, "F#": 6, Gb: 6, G: 7, "G#": 8, Ab: 8, A: 9, "A#": 10, Bb: 10, B: 11 };
  const freq = (n) => { const m = /^([A-G][#b]?)(\d)$/.exec(n); return 440 * Math.pow(2, (NOTE[m[1]] + (+m[2] + 1) * 12 - 69) / 12); };
  // "D5:1 F5:.5 -:1" -> [[note|null, beats]]
  const seq = (s) => s.trim().split(/\s+/).map((t) => { const [n, d] = t.split(":"); return [n === "-" ? null : n, +d]; });

  let pulseWaves = {};
  function pulse(ctx, duty) {
    const k = ctx.sampleRate + ":" + duty;
    if (pulseWaves[k]) return pulseWaves[k];
    const n = 32, re = new Float32Array(n), im = new Float32Array(n);
    for (let i = 1; i < n; i++) im[i] = (2 / (i * Math.PI)) * Math.sin(i * Math.PI * duty);
    return (pulseWaves[k] = ctx.createPeriodicWave(re, im));
  }
  function tone(ctx, out, t, f, dur, { type = "square", duty = .5, vol = .2, attack = .005, release = .06, vibrato = 0, slide = 0 } = {}) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    if (type === "square") o.setPeriodicWave(pulse(ctx, duty)); else o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(f * slide, t + dur);
    if (vibrato) { const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = 5.5; lg.gain.value = f * vibrato; l.connect(lg).connect(o.frequency); l.start(t + .12); l.stop(t + dur + release); }
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + attack);
    g.gain.setValueAtTime(vol, t + Math.max(attack, dur - release)); g.gain.linearRampToValueAtTime(0, t + dur);
    o.connect(g).connect(out); o.start(t); o.stop(t + dur + .02);
  }
  let noiseBuf = null;
  function noise(ctx, out, t, dur, vol, hp = 1000) {
    if (!noiseBuf || noiseBuf.sampleRate !== ctx.sampleRate) { noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf; f.type = "highpass"; f.frequency.value = hp;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + dur);
    s.connect(f).connect(g).connect(out); s.start(t); s.stop(t + dur);
  }
  const kick = (ctx, out, t, v = .55) => tone(ctx, out, t, 140, .16, { type: "sine", vol: v, slide: .3, release: .12 });
  const snare = (ctx, out, t, v = .25) => { noise(ctx, out, t, .14, v, 1800); tone(ctx, out, t, 220, .06, { type: "triangle", vol: v * .6 }); };
  const hat = (ctx, out, t, v = .07) => noise(ctx, out, t, .04, v, 7000);

  // ---------------------------------------------------------------- morceaux
  const SONGS = {

    // Vallée des Brumes : la mineur, lent et mélancolique
    region1: { bpm: 84, dark: true, octave: 0,
      chords: ["A2 C3 E3", "F2 A2 C3", "C3 E3 G3", "G2 B2 D3", "A2 C3 E3", "F2 A2 C3", "D3 F3 A3", "E2 G#2 B2"],
      lead: ["E5:2 C5:1 D5:1  E5:1.5 F5:.5 E5:1 C5:1  G4:2 C5:1 E5:1  D5:3 -:1", "E5:2 A5:1 G5:1  F5:1.5 E5:.5 D5:1 C5:1  D5:1 F5:1 A5:1 G5:1  E5:4"],
      harmony: [null, null] },
    // Archipel des Marées : ré dorien, plus léger
    region2: { bpm: 100, dark: true, energy: true, octave: 0,
      chords: ["D3 F3 A3", "G2 B2 D3", "D3 F3 A3", "C3 E3 G3", "Bb2 D3 F3", "C3 E3 G3", "D3 F3 A3", "A2 C#3 E3"],
      lead: ["A4:1 D5:1 F5:1 E5:1  D5:1.5 B4:.5 D5:2  A4:1 D5:1 F5:1 G5:1  E5:3 -:1", "F5:1 G5:1 A5:2  G5:1 F5:1 D5:2  E5:1 F5:1 G5:1 E5:1  D5:4"],
      harmony: [null, null] },
    // Pics de Givre : mi mineur, très espacé
    region3: { bpm: 72, dark: true, octave: 0,
      chords: ["E2 G2 B2", "C3 E3 G3", "G2 B2 D3", "D3 F#3 A3", "E2 G2 B2", "C3 E3 G3", "A2 C3 E3", "B2 D#3 F#3"],
      lead: ["B4:3 G4:1  E5:2 D5:2  B4:3 A4:1  F#4:4", "G4:2 B4:2  E5:3 F#5:1  G5:2 F#5:1 E5:1  D#5:4"],
      harmony: [null, null] },
    // Couronne Éteinte : do mineur, oppressant
    region4: { bpm: 66, dark: true, octave: -1,
      chords: ["C3 Eb3 G3", "Ab2 C3 Eb3", "F2 Ab2 C3", "G2 B2 D3", "C3 Eb3 G3", "Db3 F3 Ab3", "F2 Ab2 C3", "G2 B2 D3"],
      lead: ["G5:2 Eb5:2  C5:3 D5:1  Eb5:2 F5:1 Eb5:1  D5:4", "G5:2 Ab5:2  F5:3 Eb5:1  D5:2 Eb5:1 C5:1  B4:4"],
      harmony: [null, null] },
    // Combat : rapide
    battle: { bpm: 148, octave: 0,
      chords: ["E3 G3 B3", "C3 E3 G3", "D3 F#3 A3", "B2 D#3 F#3", "E3 G3 B3", "C3 E3 G3", "A2 C3 E3", "B2 D#3 F#3"],
      lead: ["E5:.5 G5:.5 B5:1 A5:.5 G5:.5 F#5:1  E5:.5 G5:.5 C6:1 B5:1 G5:1  A5:.5 F#5:.5 D5:1 E5:.5 F#5:.5 A5:1  F#5:2 D#5:2",
             "E5:.5 G5:.5 B5:1 E6:1 D6:1  C6:1.5 B5:.5 G5:1 E5:1  A5:1 C6:1 B5:1 A5:1  B5:4"],
      harmony: [null, "B4:1 B4:1 G5:1 G5:1  E5:1.5 E5:.5 E5:1 C5:1  E5:1 E5:1 D5:1 C5:1  D#5:4"] },
    // Boss : intense
    boss: { bpm: 158, octave: 0,
      chords: ["D3 F3 A3", "Bb2 D3 F3", "C3 E3 G3", "A2 C#3 E3", "D3 F3 A3", "Bb2 D3 F3", "G2 Bb2 D3", "A2 C#3 E3"],
      lead: ["D5:.5 D5:.5 A5:1 G5:.5 F5:.5 E5:1  F5:.5 G5:.5 A5:1 Bb5:1 A5:1  G5:.5 F5:.5 E5:1 C5:1 E5:1  C#5:2 E5:2",
             "D6:1 C6:.5 Bb5:.5 A5:1 F5:1  Bb5:1.5 A5:.5 G5:1 F5:1  G5:1 A5:1 Bb5:1 C6:1  C#6:2 A5:2",
             "F5:1 A5:1 D6:2  D6:1 F6:1 E6:1 D6:1  C6:1 Bb5:1 A5:1 G5:1  A5:4",
             "D6:.5 C6:.5 Bb5:.5 A5:.5 G5:.5 F5:.5 E5:.5 D5:.5  Bb4:1 D5:1 F5:1 Bb5:1  C6:1 E5:1 G5:1 C6:1  C#6:2 E6:2"],
      harmony: [null, null, "A4:1 D5:1 F5:2  F5:1 A5:1 G5:1 F5:1  E5:1 D5:1 C5:1 Bb4:1  C#5:4", null] },
    // Fin : berceuse triste, sans batterie
    ending: { bpm: 60, dark: true, calm: true, octave: 0,
      chords: ["D3 F3 A3", "Bb2 D3 F3", "F2 A2 C3", "C3 E3 G3", "D3 F3 A3", "Bb2 D3 F3", "G2 Bb2 D3", "A2 C#3 E3"],
      lead: ["A4:2 D5:1 E5:1  F5:3 E5:1  C5:2 A4:2  G4:4", "A4:2 F5:1 E5:1  D5:3 C5:1  Bb4:1 D5:1 G5:2  E5:2 C#5:2"],
      harmony: [null, null] },
    // Thème de l'écran titre : épique, ré mineur, i–VI–III–VII
    title: {
      bpm: 104, dark: true, energy: true, octave: -1,
      chords: ["D3 F3 A3", "Bb2 D3 F3", "F2 A2 C3", "C3 E3 G3", "D3 F3 A3", "Bb2 D3 F3", "G2 Bb2 D3", "A2 C#3 E3"],
      lead: [
        "A4:1 D5:1 E5:1 F5:1  G5:1.5 F5:.5 E5:1 D5:1  C5:1 F5:1 A5:1.5 G5:.5  G5:2 E5:1 C5:1",
        "D5:1 F5:1 A5:1 D6:1  C6:1.5 Bb5:.5 A5:1 G5:1  A5:1 F5:1 C6:1.5 Bb5:.5  A5:3 C#6:1",
        "D6:2 A5:1 F5:1  Bb5:1.5 A5:.5 G5:1 F5:1  A5:1 C6:1 F6:1.5 E6:.5  E6:2 G5:1 C6:1",
        "D6:1 E6:.5 F6:.5 E6:1 D6:1  F6:1.5 E6:.5 D6:1 Bb5:1  C6:1 A5:1 F6:1 E6:1  D6:4",
      ],
      harmony: [null, null,
        "F5:2 F5:1 D5:1  D5:1.5 F5:.5 E5:1 D5:1  F5:1 A5:1 C6:1.5 C6:.5  C6:2 E5:1 G5:1",
        "A5:1 C6:.5 D6:.5 C6:1 A5:1  D6:1.5 C6:.5 Bb5:1 F5:1  A5:1 F5:1 C6:1 C#6:1  A5:4"],
    },
  };

  // Programme un morceau sur un contexte audio ; renvoie sa durée (s)
  function schedule(ctx, out, name, start = ctx.currentTime + .05, loops = 1) {
    const S = SONGS[name], beat = 60 / S.bpm, bars = S.lead.length * 4; // 4 mesures par phrase
    const master = ctx.createGain(); master.gain.value = .55; master.connect(out);
    const phraseLen = 16 * beat;
    for (let L = 0; L < loops; L++) {
      S.lead.forEach((phrase, p) => {
        const t0 = start + (L * S.lead.length + p) * phraseLen;
        const intense = p >= 2;
        // mélodie
        const oct = Math.pow(2, S.octave || 0);
        let t = t0; for (const [n, d] of seq(phrase)) { if (n) tone(ctx, master, t, freq(n) * oct, d * beat * .97, S.dark ? { duty: .5, vol: .15, attack: .04, release: .25, vibrato: d >= 1 ? .01 : 0 } : { duty: .25, vol: .16, vibrato: d >= 1.5 ? .012 : 0 }); t += d * beat; }
        if (S.harmony[p]) { t = t0; for (const [n, d] of seq(S.harmony[p])) { if (n) tone(ctx, master, t, freq(n) * oct, d * beat * .95, { duty: .125, vol: S.dark ? .05 : .07, attack: S.dark ? .05 : .005, release: S.dark ? .2 : .06 }); t += d * beat; } }
        // accords : basse + arpège
        for (let b = 0; b < 4; b++) {
          const ch = S.chords[(p % 2) * 4 + b].split(" "), bt = t0 + b * 4 * beat;
          if (S.dark) {
            // basse longue + nappe grave + arpège lent
            tone(ctx, master, bt, freq(ch[0]) / 2, 4 * beat * .98, { type: "triangle", vol: .36, attack: .02, release: .4 });
            for (const n of ch) tone(ctx, master, bt, freq(n), 4 * beat * .98, { type: "sawtooth", vol: .018, attack: .6, release: .8 });
            const steps = S.energy ? 16 : 8, sl = 4 * beat / steps;
            for (let i = 0; i < steps; i++) { const n = ch[[0, 2, 1, 2][i % 4]]; tone(ctx, master, bt + i * sl, freq(n) * 2, sl * .85, { duty: .25, vol: intense ? .035 : .025, release: Math.min(.15, sl * .5) }); }
            if (S.energy) {
              // basse pulsée en croches sous la nappe
              for (let i = 0; i < 8; i++) tone(ctx, master, bt + i * beat / 2, freq(ch[0]) / (i % 2 ? 1 : 2), beat / 2 * .8, { type: "triangle", vol: .14 });
              for (let i = 0; i < 4; i++) { const tt = bt + i * beat; if (i % 2 === 0) kick(ctx, master, tt, .5); else snare(ctx, master, tt, intense ? .17 : .12); hat(ctx, master, tt + beat / 2, .035); }
              if (intense) kick(ctx, master, bt + 2.5 * beat, .35);
            } else if (!S.calm) {
              if (!S.calm) { kick(ctx, master, bt, .5); snare(ctx, master, bt + 2 * beat, intense ? .16 : .1); }
              if (intense) { kick(ctx, master, bt + 2.5 * beat, .35); hat(ctx, master, bt + 1 * beat, .03); hat(ctx, master, bt + 3 * beat, .03); }
            }
            continue;
          }
          for (let i = 0; i < 8; i++) tone(ctx, master, bt + i * beat / 2, freq(ch[0]) / (i % 2 ? 1 : 2), beat / 2 * .9, { type: "triangle", vol: .32 });
          for (let i = 0; i < 16; i++) { const n = ch[[0, 1, 2, 1][i % 4]]; tone(ctx, master, bt + i * beat / 4, freq(n) * 2, beat / 4 * .8, { duty: .5, vol: intense ? .05 : .035 }); }
          // batterie
          for (let i = 0; i < 4; i++) {
            const tt = bt + i * beat;
            if (i % 2 === 0) kick(ctx, master, tt); else snare(ctx, master, tt);
            if (intense && i === 3) kick(ctx, master, tt + beat / 2, .4);
            hat(ctx, master, tt + beat / 2);
            if (intense) hat(ctx, master, tt + beat / 4, .04);
          }
        }
        if (!S.dark && (p === 1 || p === 3)) for (let i = 0; i < 4; i++) snare(ctx, master, t0 + 15 * beat + i * beat / 4, .12 + i * .05);
      });
    }
    return loops * S.lead.length * phraseLen;
  }

  // Lecture en boucle dans le jeu
  let ctx = null, timer = null, current = null;
  function play(name) {
    if (window.Von && Von.sound === false) return;
    if (current === name) return;
    stop();
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    current = name;
    const out = ctx.createGain(); out.connect(ctx.destination); play.out = out;
    let next = ctx.currentTime + .1;
    const loop = () => { const d = schedule(ctx, out, name, next, 1); next += d; timer = setTimeout(loop, (next - ctx.currentTime - 2) * 1000); };
    loop();
  }
  function stop() {
    clearTimeout(timer); timer = null; current = null;
    if (play.out) { const o = play.out; o.gain.setTargetAtTime(0, ctx.currentTime, .2); setTimeout(() => o.disconnect(), 800); play.out = null; }
  }
  return { schedule, play, stop, SONGS, freq, tone, noise, get _ctx() { return ctx; }, unlock() { ctx = ctx || new (window.AudioContext || window.webkitAudioContext)(); if (ctx.state === "suspended") ctx.resume(); } };
})();
