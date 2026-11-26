/* Comète — sons et musique chiptune générés (Web Audio). */
(function () {
  "use strict";
  let ctx = null, master = null, sfxBus = null, musBus = null, noiseBuf = null;
  const enabled = () => !(window.Von && Von.sound === false);

  function init() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.8; master.connect(ctx.destination);
    sfxBus = ctx.createGain(); sfxBus.gain.value = 0.55; sfxBus.connect(master);
    musBus = ctx.createGain(); musBus.gain.value = 0.32; musBus.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  function unlock() {
    try { if (navigator.audioSession) navigator.audioSession.type = "playback"; } catch (e) { /* ignore */ }
    init();
    if (!ctx) return;
    if (ctx.state !== "running") ctx.resume();
    try { const b = ctx.createBuffer(1, 1, 22050), s = ctx.createBufferSource(); s.buffer = b; s.connect(ctx.destination); s.start(0); } catch (e) { /* ignore */ }
    if (wanted && !playing) startMusic(wanted);
  }
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

  function tone(out, t, f0, f1, dur, type, vol) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    o.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(out, t, dur, vol, freq, type) {
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf; f.type = type || "lowpass"; f.frequency.value = freq || 2000;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    s.connect(f); f.connect(g); g.connect(out); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  }

  const last = {};
  function sfx(name) {
    if (!enabled() || !ctx || ctx.state !== "running") return;
    const t = ctx.currentTime, now = performance.now();
    const gap = { shot: 70, eshot: 60, eshot2: 90, hit: 40, pop: 50, gem: 35, explode: 45 }[name] || 0;
    if (gap && last[name] && now - last[name] < gap) return;
    last[name] = now;
    const o = sfxBus;
    switch (name) {
      case "shot": tone(o, t, 1400, 700, 0.05, "square", 0.035); break;
      case "canon": tone(o, t, 300, 80, 0.18, "square", 0.12); noise(o, t, 0.12, 0.08, 900); break;
      case "zap": tone(o, t, 1800, 300, 0.09, "sawtooth", 0.06); noise(o, t, 0.06, 0.05, 6000, "highpass"); break;
      case "missile": noise(o, t, 0.2, 0.08, 1500, "bandpass"); tone(o, t, 200, 500, 0.15, "triangle", 0.06); break;
      case "wave": tone(o, t, 500, 900, 0.12, "triangle", 0.08); break;
      case "eshot": tone(o, t, 900, 500, 0.08, "square", 0.04); break;
      case "eshot2": tone(o, t, 600, 200, 0.14, "triangle", 0.09); break;
      case "hit": tone(o, t, 220, 120, 0.05, "square", 0.05); break;
      case "explode": noise(o, t, 0.25, 0.25, 1400); tone(o, t, 160, 40, 0.25, "square", 0.08); break;
      case "boom": noise(o, t, 0.6, 0.45, 900); tone(o, t, 110, 30, 0.6, "square", 0.15); break;
      case "bigboom":
        for (let k = 0; k < 5; k++) { noise(o, t + k * 0.12, 0.6, 0.4, 700 + k * 200); tone(o, t + k * 0.12, 140 - k * 15, 30, 0.5, "square", 0.12); }
        break;
      case "pickup": [0, 4, 7, 12].forEach((n, i) => tone(o, t + i * 0.05, mtof(76 + n), mtof(76 + n), 0.08, "square", 0.08)); break;
      case "heal": [0, 4, 7, 11, 14].forEach((n, i) => tone(o, t + i * 0.06, mtof(72 + n), mtof(72 + n), 0.12, "triangle", 0.12)); break;
      case "power": [0, 7, 12, 19, 24].forEach((n, i) => tone(o, t + i * 0.05, mtof(67 + n), mtof(67 + n), 0.1, "square", 0.08)); break;
      case "gem": tone(o, t, mtof(88 + (Math.random() * 5 | 0)), mtof(96), 0.06, "square", 0.04); break;
      case "hurt": noise(o, t, 0.2, 0.3, 3000); tone(o, t, 400, 90, 0.25, "sawtooth", 0.12); break;
      case "shield": tone(o, t, 300, 1200, 0.3, "sine", 0.15); break;
      case "alarm": for (let k = 0; k < 3; k++) { tone(o, t + k * 0.5, 880, 440, 0.4, "square", 0.08); } break;
      case "warp": tone(o, t, 80, 1600, 1.2, "sawtooth", 0.08); noise(o, t, 1.2, 0.12, 3000, "bandpass"); break;
      case "charge": tone(o, t, 120, 600, 0.5, "sawtooth", 0.08); break;
      case "cannon": noise(o, t, 0.25, 0.25, 600); tone(o, t, 120, 50, 0.2, "square", 0.1); break;
      case "pop": tone(o, t, 800, 200, 0.08, "square", 0.06); break;
      case "beamwarn": tone(o, t, 1200, 1200, 0.5, "sine", 0.05); break;
      case "beam": noise(o, t, 0.7, 0.2, 2500, "bandpass"); tone(o, t, 90, 70, 0.7, "sawtooth", 0.12); break;
      case "gravity": tone(o, t, 60, 30, 2, "sine", 0.25); break;
      case "blink": tone(o, t, 1500, 200, 0.3, "sine", 0.1); break;
      case "phase": tone(o, t, 200, 60, 0.8, "sawtooth", 0.15); noise(o, t, 0.8, 0.2, 500); break;
      case "victory": [0, 4, 7, 12, 7, 12, 16, 19, 24].forEach((n, i) => tone(o, t + i * 0.09, mtof(60 + n), mtof(60 + n), 0.2, "square", 0.08)); break;
      case "nova": noise(o, t, 1.2, 0.4, 1200); tone(o, t, 900, 40, 1.2, "sawtooth", 0.15); break;
      case "select": tone(o, t, 660, 990, 0.06, "square", 0.06); break;
      case "gameover": [12, 7, 3, 0, -5].forEach((n, i) => tone(o, t + i * 0.22, mtof(64 + n), mtof(64 + n), 0.3, "triangle", 0.14)); break;
    }
  }

  // ------------------------------------------------------------------ musique
  // notes : nombres MIDI ; null = silence. 16 pas par mesure.
  const N = { A2: 45, C3: 48, D3: 50, E3: 52, F3: 53, G3: 55, A3: 57, Bb2: 46, B2: 47, G2: 43, F2: 41, E2: 40, D2: 38, C2: 36, Bb3: 58 };
  const SONGS = {
    title: {
      bpm: 96, chords: [[57, 60, 64], [53, 57, 60], [48, 52, 55], [52, 56, 59]], bass: [N.A2, N.F2, N.C3, N.E2],
      lead: [76, null, null, 72, null, null, 69, null, 71, null, 72, null, 74, null, 72, null, 77, null, null, 76, null, null, 72, null, 74, null, null, null, null, null, null, null,
        79, null, null, 76, null, null, 72, null, 74, null, 76, null, 79, null, 76, null, 80, null, null, 76, null, null, 71, null, 68, null, null, null, null, null, null, null],
      drums: "k.......s.......", arp: 8,
    },
    ascent: {
      bpm: 138, chords: [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]], bass: [N.A2, N.F2, N.C3, N.G2],
      lead: [69, null, 72, null, 76, null, 74, 72, null, null, 69, null, 71, 72, 74, null, 72, null, 69, null, 65, null, 69, 72, null, null, 77, null, 76, null, 74, null,
        72, null, 76, null, 79, null, 76, 74, null, null, 72, null, 74, 76, 79, null, 81, null, 79, null, 77, null, 76, 74, null, null, 71, null, 74, null, 79, null],
      drums: "k...s..kk.k.s..h", arp: 16,
    },
    boss: {
      bpm: 168, chords: [[62, 65, 69], [58, 62, 65], [60, 64, 67], [57, 61, 64]], bass: [N.D2, N.Bb2 - 12, N.C2, N.A2 - 12],
      lead: [74, null, 74, 77, null, 74, 81, null, 79, 77, null, 76, 77, null, 74, null, 70, null, 70, 74, null, 70, 77, null, 76, 74, null, 72, 74, null, 70, null,
        72, null, 72, 76, null, 72, 79, null, 77, 76, null, 74, 76, null, 72, null, 73, null, 76, 79, null, 81, 79, null, 76, 73, null, 69, 73, null, 76, null],
      drums: "k.hsk.hsk.hsk.ss", arp: 16,
    },
  };
  let wanted = null, playing = null, timer = null, nextT = 0, step = 0, mOut = null;
  function startMusic(name) {
    wanted = name;
    if (!enabled()) return;
    init();
    if (!ctx || ctx.state !== "running") return;
    if (playing === name) return;
    stopNow();
    playing = name; step = 0; nextT = ctx.currentTime + 0.08;
    mOut = ctx.createGain(); mOut.gain.value = 1; mOut.connect(musBus);
    const song = SONGS[name];
    const stepDur = 60 / song.bpm / 4;
    const out = mOut;
    const tick = () => {
      if (playing !== name || mOut !== out) return;
      while (nextT < ctx.currentTime + 0.25) {
        const bar = Math.floor(step / 16) % song.chords.length, s = step % 16, t = nextT;
        const ch = song.chords[bar];
        // basse
        if (s % 2 === 0) tone(out, t, mtof(song.bass[bar] - (s % 8 === 4 ? -12 : 0)), mtof(song.bass[bar]), stepDur * 1.6, "triangle", 0.32);
        // arpège
        if (s % (16 / song.arp) === 0) { const n = ch[(s / (16 / song.arp)) % 3] + 12; tone(out, t, mtof(n), mtof(n), stepDur * 0.8, "square", 0.045); }
        // mélodie
        const ln = song.lead[step % song.lead.length];
        if (ln) tone(out, t, mtof(ln), mtof(ln), stepDur * 2.2, "square", 0.07);
        // batterie
        const d = song.drums[s];
        if (d === "k") tone(out, t, 150, 40, 0.12, "sine", 0.5);
        else if (d === "s") noise(out, t, 0.1, 0.22, 3500, "highpass");
        else if (d === "h") noise(out, t, 0.03, 0.08, 8000, "highpass");
        nextT += stepDur; step++;
      }
    };
    tick();
    timer = setInterval(tick, 60);
  }
  function stopNow() {
    clearInterval(timer); timer = null;
    if (mOut) { const o = mOut; try { o.gain.setTargetAtTime(0, ctx.currentTime, 0.08); } catch (e) { /* ignore */ } setTimeout(() => o.disconnect(), 500); mOut = null; }
    playing = null;
  }
  function music(name) { if (name === null) { wanted = null; stopNow(); return; } startMusic(name); }
  function suspend() { if (ctx && ctx.state === "running") ctx.suspend(); }
  function resume() { if (ctx && ctx.state !== "running" && enabled()) ctx.resume().then(() => { if (wanted && !playing) startMusic(wanted); }); }

  window.Sfx = { unlock, sfx, music, suspend, resume };
})();
