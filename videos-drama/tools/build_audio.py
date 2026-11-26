"""Voix off (Kokoro, voix française), minutage mot à mot, musique et bruitages générés, mixage.

Usage : python3 build_audio.py stories/01-xxx.mjs build/01
Produit build/01/timeline.json et build/01/audio.wav
"""
import json, os, re, subprocess, sys
import numpy as np
import soundfile as sf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 24000
TTS_DIR = os.environ.get("TTS_DIR", os.path.join(ROOT, "models"))

_k = None
def kokoro():
    global _k
    if _k is None:
        from kokoro_onnx import Kokoro
        _k = Kokoro(os.path.join(TTS_DIR, "kokoro-v1.0.onnx"), os.path.join(TTS_DIR, "voices-v1.0.bin"))
    return _k

def load_story(path):
    js = f"import('{os.path.abspath(path)}').then(m=>console.log(JSON.stringify(m.default)))"
    out = subprocess.check_output(["node", "--input-type=module", "-e", js])
    return json.loads(out)

def trim(a, thr=0.012):
    idx = np.where(np.abs(a) > thr)[0]
    if len(idx) == 0:
        return a[:0]
    return a[max(0, idx[0] - 240): idx[-1] + 480]

cache_dir = None
def synth(text, speed):
    import hashlib
    h = hashlib.md5(f"{text}|{speed}".encode()).hexdigest()
    p = os.path.join(cache_dir, h + ".npy")
    if os.path.exists(p):
        return np.load(p)
    s, sr = kokoro().create(text, voice="ff_siwis", speed=speed, lang="fr-fr")
    assert sr == SR
    s = trim(s.astype(np.float32))
    np.save(p, s)
    return s

def split_sentences(text):
    parts = re.findall(r"[^.!?…]+[.!?…]*", text)
    out = []
    for p in parts:
        p = p.strip()
        if not p:
            continue
        if not re.search(r"[\wÀ-ÿ]", p) and out:
            out[-1] += p  # ex. un '*' fermant isolé
        else:
            out.append(p)
    return out

def words_of(sentence):
    out = []
    for w in sentence.split():
        hl = "*" in w
        out.append({"w": w.replace("*", ""), "hl": hl})
    return out

def weight(w):
    core = re.sub(r"[^\wÀ-ÿ€%]", "", w)
    k = len(core) + 1.6
    if re.search(r"\d", core):
        k += len(core) * 2.2  # les nombres se disent longuement
    if w.endswith(","):
        k += 3.0
    return k

def chunk_words(words):
    chunks, cur = [], []
    for wd in words:
        cur.append(wd)
        txt = " ".join(x["w"] for x in cur)
        if len(cur) >= 2 or len(txt) >= 11 or re.search(r"[,.!?…:]$", wd["w"]):
            chunks.append(cur); cur = []
    if cur:
        chunks.append(cur)
    return chunks

def main(story_path, outdir):
    global cache_dir
    os.makedirs(outdir, exist_ok=True)
    cache_dir = os.path.join(os.path.dirname(outdir.rstrip("/")), "_ttscache"); os.makedirs(cache_dir, exist_ok=True)
    st = load_story(story_path)
    speed = st.get("speed", 1.12)
    voice = []
    t = 0.0
    tl = {"shots": [], "sfx": []}
    for i, sh in enumerate(st["shots"]):
        start = t
        lead = sh.get("lead", 0.06)
        pos = lead
        segs = []
        allwords = []
        say = sh.get("say", "")
        for sent in split_sentences(say):
            clean = sent.replace("*", "")
            a = synth(clean, sh.get("speed", speed))
            segs.append((pos, a))
            ws = words_of(sent)
            tot = sum(weight(w["w"]) for w in ws) or 1
            dur = len(a) / SR
            acc = 0
            for w in ws:
                k = weight(w["w"])
                w["s"] = start + pos + dur * acc / tot
                acc += k
                w["e"] = start + pos + dur * acc / tot
                allwords.append(w)
            pos += dur + sh.get("gap", 0.16)
        vdur = pos + 0.12 if segs else 0
        dur = max(vdur, sh.get("min", 0.0)) + sh.get("pause", 0.0)
        if dur < 0.6:
            dur = 0.6
        # audio
        buf = np.zeros(int(round(dur * SR)) + 1, np.float32)
        for p0, a in segs:
            i0 = int(p0 * SR); buf[i0:i0 + len(a)] += a[: len(buf) - i0]
        voice.append(buf[: int(round(dur * SR))])
        # chunks
        chunks = []
        for ch in chunk_words(allwords):
            chunks.append({"s": ch[0]["s"], "e": ch[-1]["e"], "words": [{"w": w["w"], "hl": w["hl"]} for w in ch]})
        for j in range(len(chunks) - 1):
            chunks[j]["e"] = max(chunks[j]["e"], min(chunks[j + 1]["s"], chunks[j]["e"] + 0.35))
            chunks[j]["e"] = min(chunks[j]["e"], chunks[j + 1]["s"])
        if chunks:
            chunks[-1]["e"] = min(chunks[-1]["e"] + 0.3, start + dur)
        tl["shots"].append({"start": start, "dur": dur, "chunks": chunks})
        # bruitages
        for s in sh.get("sfx", []):
            name, at = s[0], s[1] if len(s) > 1 else 0
            vol = s[2] if len(s) > 2 else 1.0
            tl["sfx"].append({"t": start + at * dur, "n": name, "v": vol})
        for f in sh.get("fx", []):
            ft = start + f.get("from", 0) * dur
            auto = {"label": "pop", "nametag": "swoosh", "day": "pop", "cards": "pop", "title": "pop", "poster": "pop", "impact": "boom", "phone": "ding", "flash": "whoosh", "counter": "pop"}.get(f["type"])
            if f.get("sfx") is not None:
                auto = f["sfx"]
            if auto:
                tl["sfx"].append({"t": ft, "n": auto, "v": 1.0})
            if f["type"] == "rain" and f.get("kind", "money") == "money":
                tl["sfx"].append({"t": ft, "n": "cash", "v": 1.0})
        if sh.get("whoosh"):
            tl["sfx"].append({"t": start, "n": "whoosh", "v": 0.7})
        t += dur
    tl["total"] = t
    # persistants : temps en secondes absolues
    with open(os.path.join(outdir, "timeline.json"), "w") as f:
        json.dump(tl, f, ensure_ascii=False)
    v = np.concatenate(voice)
    mix = build_mix(st, tl, v)
    sf.write(os.path.join(outdir, "audio.wav"), mix, 44100, subtype="PCM_16")
    print(f"{story_path}: {t:.1f}s, {len(st['shots'])} plans")

# ---------------- synthèse sonore ----------------
SR2 = 44100
def env(n, a=0.005, r=0.2, sr=SR2):
    t = np.arange(n) / sr
    e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / max(r, 1e-4))
    return e
def noise(n, seed=0):
    return np.random.default_rng(seed).uniform(-1, 1, n)
def lp(x, a):
    y = np.empty_like(x); acc = 0.0
    for i in range(len(x)):
        acc += a * (x[i] - acc); y[i] = acc
    return y
def lp_fast(x, k):
    # moyenne glissante (approx passe-bas)
    k = max(1, int(k)); c = np.cumsum(np.concatenate([[0], x])); y = (c[k:] - c[:-k]) / k
    return np.concatenate([y, np.zeros(k - 1)])

def sfx(name):
    sr = SR2
    def T(d): return np.arange(int(d * sr)) / sr
    if name == "pop":
        t = T(0.12); f = 900 * np.exp(-t * 25) + 300; return 0.5 * np.sin(2 * np.pi * np.cumsum(f) / sr) * env(len(t), 0.002, 0.04)
    if name == "swoosh" or name == "whoosh":
        t = T(0.45); n = noise(len(t), 3); n = lp_fast(n, 6) - lp_fast(n, 60); e = np.sin(np.pi * t / t[-1]) ** 2; return 0.9 * n * e
    if name == "boom":
        t = T(1.4); f = 120 * np.exp(-t * 4) + 38; s = np.sin(2 * np.pi * np.cumsum(f) / sr) * env(len(t), 0.003, 0.45)
        n = lp_fast(noise(len(t), 5), 20) * env(len(t), 0.002, 0.25) * 1.5; return 0.95 * np.tanh(1.6 * (s + n))
    if name == "thud":
        t = T(0.5); f = 90 * np.exp(-t * 10) + 45; return 0.9 * np.sin(2 * np.pi * np.cumsum(f) / sr) * env(len(t), 0.002, 0.12)
    if name == "ding":
        t = T(1.0); return 0.35 * (np.sin(2 * np.pi * 1318 * t) + 0.5 * np.sin(2 * np.pi * 2637 * t)) * env(len(t), 0.002, 0.3)
    if name == "cash":
        t = T(0.9); s = 0.3 * (np.sin(2 * np.pi * 2093 * t) + np.sin(2 * np.pi * 2637 * t)) * env(len(t), 0.002, 0.25)
        n = (noise(len(t), 8) - lp_fast(noise(len(t), 8), 4)) * env(len(t), 0.001, 0.05) * 0.5; return s + n
    if name == "tick":
        t = T(0.05); return 0.4 * (noise(len(t), 2) - lp_fast(noise(len(t), 2), 3)) * env(len(t), 0.0005, 0.008)
    if name == "heartbeat":
        t = T(1.0); out = np.zeros(len(t))
        for o in (0, 0.28):
            i0 = int(o * sr); seg = T(0.25); s = np.sin(2 * np.pi * 55 * seg) * env(len(seg), 0.004, 0.06)
            out[i0:i0 + len(seg)] += s
        return 0.9 * out
    if name == "sting":  # accord dissonant d'horreur
        t = T(2.2); s = sum(np.sin(2 * np.pi * f * t + np.sin(2 * np.pi * 6 * t) * 0.8) for f in (311, 330, 466, 622)) / 4
        n = (noise(len(t), 9) - lp_fast(noise(len(t), 9), 3)) * 0.25; return 0.7 * (s + n) * env(len(t), 0.01, 0.8)
    if name == "scream":
        t = T(1.2); f = 900 + 300 * np.sin(2 * np.pi * 7 * t) + 400 * t; s = np.sign(np.sin(2 * np.pi * np.cumsum(f) / sr)) * 0.3
        return lp_fast(s, 4) * env(len(t), 0.02, 0.6) * 0.6
    if name == "splat":
        t = T(0.4); n = lp_fast(noise(len(t), 11), 8) * env(len(t), 0.001, 0.08) * 2.5; f = 200 * np.exp(-t * 20) + 60
        return np.tanh(n + 0.6 * np.sin(2 * np.pi * np.cumsum(f) / sr) * env(len(t), 0.001, 0.06))
    if name == "fart":
        t = T(0.9); f = 70 + 25 * np.sin(2 * np.pi * 9 * t) + noise(len(t), 4) * 15; s = np.sign(np.sin(2 * np.pi * np.cumsum(f) / sr))
        return 0.45 * lp_fast(s, 10) * env(len(t), 0.02, 0.45)
    if name == "scratch":
        t = T(0.6); f = 400 + 1500 * np.abs(np.sin(2 * np.pi * 2.5 * t)); n = noise(len(t), 12) * np.sin(2 * np.pi * np.cumsum(f) / sr)
        return 0.7 * n * env(len(t), 0.005, 0.3)
    if name == "cheer":
        t = T(2.6); n = lp_fast(noise(len(t), 13), 3) - lp_fast(noise(len(t), 13), 40); e = np.minimum(1, t / 0.3) * np.exp(-np.maximum(0, t - 1.2) / 0.6)
        return 0.9 * n * e * (1 + 0.3 * np.sin(2 * np.pi * 3 * t))
    if name == "gasp":  # foule "ohh"
        t = T(1.4); s = sum(np.sin(2 * np.pi * f * t) for f in (180, 220, 260, 300)) / 4 * (1 + 0.2 * noise(len(t), 3))
        return 0.35 * lp_fast(s, 6) * env(len(t), 0.15, 0.6)
    if name == "rise":
        t = T(2.0); f = 200 + 900 * (t / t[-1]) ** 2; return 0.25 * np.sin(2 * np.pi * np.cumsum(f) / sr) * (t / t[-1])
    if name == "crash":
        t = T(1.2); n = noise(len(t), 14) * env(len(t), 0.001, 0.3); m = sum(np.sin(2 * np.pi * f * t) for f in (530, 870, 1290, 2100)) / 4 * env(len(t), 0.001, 0.5)
        return 0.8 * np.tanh(1.2 * n + 0.6 * m)
    if name == "splash":
        t = T(1.3); n = (noise(len(t), 15) - lp_fast(noise(len(t), 15), 5)) * env(len(t), 0.01, 0.4); return 0.8 * n
    if name == "beep":
        t = T(0.18); return 0.25 * np.sign(np.sin(2 * np.pi * 1000 * t)) * env(len(t), 0.002, 0.15)
    if name == "flatline":
        t = T(3.0); return 0.18 * np.sin(2 * np.pi * 1000 * t) * np.minimum(1, (t[-1] - t) / 0.3)
    if name == "creak":
        t = T(1.5); f = 90 + 40 * np.sin(2 * np.pi * 0.7 * t); s = np.sign(np.sin(2 * np.pi * np.cumsum(f) / sr)) * (noise(len(t), 16) * 0.5 + 0.5)
        return 0.25 * lp_fast(s, 3) * np.sin(np.pi * t / t[-1])
    if name == "knock":
        out = np.zeros(int(1.0 * sr))
        for o in (0, 0.25, 0.5):
            s = sfx("thud")[: int(0.2 * sr)]; i0 = int(o * sr); out[i0:i0 + len(s)] += s
        return out
    if name == "engine":
        t = T(2.0); f = 60 + 20 * t; s = np.sign(np.sin(2 * np.pi * np.cumsum(f) / sr)); return 0.2 * lp_fast(s, 12) * np.minimum(1, t / 0.2)
    if name == "honk":
        t = T(0.6); return 0.25 * np.sign(np.sin(2 * np.pi * 415 * t) + np.sin(2 * np.pi * 523 * t)) * env(len(t), 0.01, 0.4)
    if name == "bell":
        t = T(2.5); return 0.3 * sum(np.sin(2 * np.pi * f * t) * a for f, a in ((523, 1), (1046, .5), (1567, .3), (2093, .2))) * env(len(t), 0.002, 0.9)
    if name == "sad":
        t = T(2.5); out = np.zeros(len(t))
        for k, fr in enumerate((392, 370, 349, 330)):
            i0 = int(k * 0.45 * sr); seg = T(0.6); s = np.sin(2 * np.pi * fr * seg) * env(len(seg), 0.01, 0.25)
            out[i0:i0 + len(seg)] += s[: len(out) - i0]
        return 0.3 * out
    if name == "slurp":
        t = T(0.5); f = 300 + 600 * t; return 0.3 * np.sin(2 * np.pi * np.cumsum(f) / sr) * (noise(len(t), 3) * 0.5 + 0.5) * env(len(t), 0.02, 0.2)
    if name == "glitch":
        t = T(0.4); s = np.sign(np.sin(2 * np.pi * 60 * t)) * (noise(len(t), 17) > 0.3); return 0.25 * s
    return np.zeros(10)

# ------- musique -------
def note(f, d, kind="pluck", vol=0.3):
    t = np.arange(int(d * SR2)) / SR2
    if kind == "pluck":
        s = (np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t) + 0.12 * np.sin(6 * np.pi * f * t)) * np.exp(-t * 6)
    elif kind == "piano":
        s = (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(4 * np.pi * f * t) + 0.15 * np.sin(6 * np.pi * f * t)) * np.exp(-t * 2.2)
    elif kind == "pad":
        s = (np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 1.005 * t) + 0.3 * np.sin(2 * np.pi * f * 2.01 * t)) * np.minimum(1, t / 0.4) * np.minimum(1, (t[-1] - t) / 0.4 + 0.001)
    elif kind == "bass":
        s = np.tanh(2 * np.sin(2 * np.pi * f * t)) * np.exp(-t * 3)
    elif kind == "square":
        s = np.sign(np.sin(2 * np.pi * f * t)) * 0.4 * np.exp(-t * 8)
    else:
        s = np.sin(2 * np.pi * f * t)
    s[: 40] *= np.linspace(0, 1, 40)
    return vol * s
def hz(n):
    return 440 * 2 ** ((n - 69) / 12)
def kick(): t = np.arange(int(0.3 * SR2)) / SR2; f = 120 * np.exp(-t * 30) + 45; return 0.8 * np.sin(2 * np.pi * np.cumsum(f) / SR2) * np.exp(-t * 9)
def hat(): n = noise(int(0.06 * SR2), 21); return 0.18 * (n - lp_fast(n, 3)) * np.exp(-np.arange(len(n)) / SR2 * 60)
def snare(): n = noise(int(0.2 * SR2), 22); return 0.35 * (n - lp_fast(n, 4)) * np.exp(-np.arange(len(n)) / SR2 * 18)

def add(buf, s, t):
    i0 = int(t * SR2)
    if i0 >= len(buf): return
    e = min(len(buf), i0 + len(s)); buf[i0:e] += s[: e - i0]

def music(mood, dur):
    buf = np.zeros(int(dur * SR2) + SR2)
    if mood == "funny":
        bpm = 118; b = 60 / bpm
        prog = [(60, [60, 64, 67]), (65, [65, 69, 72]), (67, [67, 71, 74]), (60, [60, 64, 67])]
        mel = [72, 76, 79, 76, 74, 77, 81, 77, 74, 79, 83, 79, 72, 76, 79, 84]
        t = 0; i = 0
        while t < dur:
            root, ch = prog[(i // 8) % 4]
            add(buf, note(hz(root - 24), b * 0.9, "bass", 0.32), t)
            if i % 2 == 0: add(buf, kick(), t)
            else: add(buf, snare() * 0.6, t)
            add(buf, hat(), t + b / 2)
            add(buf, note(hz(mel[i % 16]), b * 0.8, "pluck", 0.13), t + b / 2)
            if i % 4 == 0:
                for n in ch: add(buf, note(hz(n), b * 3.5, "pad", 0.05), t)
            t += b; i += 1
    elif mood == "sad":
        bpm = 66; b = 60 / bpm
        prog = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]
        t = 0; i = 0
        while t < dur:
            ch = prog[(i // 4) % 4]
            arp = [ch[0], ch[1], ch[2], ch[1] + 12 if False else ch[2] + 5]
            add(buf, note(hz(ch[0] - 12), b * 4, "piano", 0.2), t) if i % 4 == 0 else None
            add(buf, note(hz(arp[i % 4] + 12), b * 1.6, "piano", 0.12), t)
            if i % 4 == 0:
                for n in ch: add(buf, note(hz(n), b * 4, "pad", 0.04), t)
            t += b; i += 1
    elif mood == "horror":
        t = np.arange(len(buf)) / SR2
        buf += 0.08 * np.sin(2 * np.pi * 55 * t) * (1 + 0.3 * np.sin(2 * np.pi * 0.1 * t))
        buf += 0.05 * np.sin(2 * np.pi * 58.3 * t)
        buf += 0.03 * np.sin(2 * np.pi * 233 * t + 2 * np.sin(2 * np.pi * 0.3 * t)) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.07 * t))
        n = noise(len(buf), 31); buf += 0.02 * lp_fast(n, 40)
        for k in np.arange(3.0, dur, 7.3):
            add(buf, note(hz(84 + int(k) % 3), 2.5, "piano", 0.05), k)
        for k in np.arange(0, dur, 1.4):
            add(buf, kick() * 0.25, k)
    elif mood == "epic":
        bpm = 128; b = 60 / bpm
        prog = [57, 53, 48, 55]
        t = 0; i = 0
        while t < dur:
            root = prog[(i // 8) % 4]
            add(buf, kick(), t)
            add(buf, hat(), t + b / 2)
            if i % 2: add(buf, snare() * 0.5, t)
            add(buf, note(hz(root - 12), b / 2, "bass", 0.28), t); add(buf, note(hz(root - 12), b / 2, "bass", 0.2), t + b / 2)
            if i % 8 == 0:
                for n in (root, root + 3 if root in (57,) else root + 4, root + 7): add(buf, note(hz(n), b * 8, "pad", 0.05), t)
            t += b; i += 1
    elif mood == "tense":
        bpm = 100; b = 60 / bpm; t = 0; i = 0
        while t < dur:
            add(buf, note(hz(45 if (i // 16) % 2 == 0 else 46), b * 0.5, "bass", 0.25), t)
            add(buf, note(hz(69 + (i % 2) * 1), b * 0.4, "pluck", 0.06), t + b / 2)
            if i % 4 == 0: add(buf, kick() * 0.6, t)
            t += b / 1; i += 1
    return buf[: int(dur * SR2)]

def build_mix(st, tl, voice24):
    dur = tl["total"] + 0.5
    n = int(dur * SR2)
    # voix -> 44.1k
    x = np.arange(int(len(voice24) * SR2 / SR)) * SR / SR2
    v = np.interp(x, np.arange(len(voice24)), voice24)
    vbuf = np.zeros(n); vbuf[: min(n, len(v))] = v[:n]
    vbuf = vbuf / (np.max(np.abs(vbuf)) + 1e-9) * 0.9
    # musique, changements d'ambiance par plan
    mbuf = np.zeros(n)
    segs = []
    cur = st.get("mood", "funny"); s0 = 0.0
    for sh, ts in zip(st["shots"], tl["shots"]):
        m = sh.get("mood", None)
        if m and m != cur:
            segs.append((s0, ts["start"], cur)); cur = m; s0 = ts["start"]
    segs.append((s0, dur, cur))
    for a, b, m in segs:
        if m == "none": continue
        mm = music(m, b - a + 0.5)
        i0 = int(a * SR2); L = min(len(mm), n - i0)
        fade = np.ones(L); fl = min(L, int(0.4 * SR2)); fade[:fl] = np.linspace(0, 1, fl); fade[-fl:] = np.minimum(fade[-fl:], np.linspace(1, 0, fl))
        mbuf[i0:i0 + L] += mm[:L] * fade
    mbuf = mbuf / (np.max(np.abs(mbuf)) + 1e-9) * st.get("musicVol", 0.16)
    # ducking léger sous la voix
    envv = lp_fast(np.abs(vbuf), 2000) ; duck = 1 - 0.45 * np.clip(envv / 0.08, 0, 1)
    mbuf *= duck
    fbuf = np.zeros(n)
    for s in tl["sfx"]:
        sig = sfx(s["n"]) * s.get("v", 1.0) * 0.55
        add(fbuf, sig, s["t"])
    mix = vbuf + mbuf + fbuf
    mix = np.tanh(mix * 1.1) * 0.95
    return mix.astype(np.float32)

if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
