# Sound for "The Day It Rained Meat" (the Kentucky Meat Shower, 1876): synthesized SFX + an original score (a jaunty
# plucked banjo-ish country tune, a fiddle-ish whistle line, a sneaky lab theme, stings), ducked under the voice; every
# event sits on the picture's word times (~/meat-short/timing.json, the same table story.ts and the captions read).
# Usage: python meat_sound.py  ->  mix.wav (48 kHz stereo, exact picture length), stems/*.wav, cues.md
import os, sys, json, wave
import numpy as np
from scipy import signal

AUDIO_LIB = os.path.expanduser("~/claude-animated-shorts/shorts/audio")
sys.path.insert(0, AUDIO_LIB)
from dsp import (SR, ns, tt, rng, lp, hp, bp, peq, shelf, colored, smooth_noise, fades, pan, st, place, widen, make_ir, convolve_st,
                 integrated, true_peak, dbg, read_wav)
import instruments as I
import sfx_gen as G

ROOT = os.path.expanduser("~/meat-short")
TM = json.load(open(os.path.join(ROOT, "timing.json")))
FPS, TOTAL = TM["fps"], TM["total"]
DUR = TOTAL / FPS
N = ns(DUR)
W = dict(TM["word"])
B = TM["beat"]
PRE = 3
cf = lambda b: (round(B[b] * FPS) - PRE) / FPS  # picture cut before narration beat b (story.ts cf)
cw = lambda k: (round(W[k] * FPS) - PRE) / FPS  # picture cut before word k (story.ts cw)
# sets on the timeline (s), from story.ts SHOTS
FARM = [(0.0, cf(7)), (cf(10), cf(14))]
OFFICE = [(cf(7), cf(10)), (cf(14), DUR)]
cues = []


def cue(t, what):
    cues.append((t, what))


def buf():
    return np.zeros((2, N))


def env_seg(a, b, fin=0.4, fout=0.6):
    t = np.arange(N) / SR
    return np.clip((t - a) / fin + 1, 0, 1) * np.clip((b - t) / fout + 1, 0, 1)


# ================================================================ SFX
def fire_bed(dur, r, roar=0.35):
    n = ns(dur)
    x = lp(colored(n, r, 1.2), 380, 2) * roar * (0.8 + 0.2 * smooth_noise(n, r, 1.5))
    pops = np.zeros(n)
    for _ in range(int(dur * 5)):
        i = r.integers(0, max(1, n - 2000)); L = r.integers(80, 900)
        pops[i:i + L] += hp(r.standard_normal(L), 1500) * np.exp(-np.arange(L) / (L / 4)) * r.uniform(0.2, 1.0)
    return widen(fades(x + 0.5 * pops, 0.5, 0.5), r, 9, 0.6)


def fly(dur, r, f0=210.0):
    """a buzzing fly: a nasal saw with fast wing AM and slow pitch/pan wander"""
    n = ns(dur); t = np.arange(n) / SR
    f = f0 * (1 + 0.06 * smooth_noise(n, r, 2.5) + 0.03 * np.sin(2 * np.pi * 3.1 * t))
    ph = np.cumsum(f) / SR
    saw = 2 * (ph % 1) - 1
    y = bp(saw, 300, 3200) * (0.75 + 0.25 * np.sin(2 * np.pi * 37 * t)) * (0.6 + 0.4 * smooth_noise(n, r, 1.8))
    y = fades(y, 0.08, 0.15)
    p = 0.6 * np.sin(2 * np.pi * 0.5 * t + r.uniform(0, 6))
    return np.stack([y * np.sqrt(0.5 * (1 - p)), y * np.sqrt(0.5 * (1 + p))])


def thunk(r, f=70, dur=0.5):
    t = tt(dur)
    body = np.sin(2 * np.pi * np.cumsum(f * (1 + 1.5 * np.exp(-t / 0.02))) / SR) * np.exp(-t / 0.12)
    knock = bp(r.standard_normal(len(t)), 300, 2500) * np.exp(-t / 0.02)
    return fades(body + 0.6 * knock, 0.001, 0.05)


def crack(r):
    t = tt(0.3)
    y = hp(r.standard_normal(len(t)), 1200) * np.exp(-t / 0.015)
    for k in range(4):
        d = ns(0.012 * (k + 1))
        y[d:] += 0.5 * hp(r.standard_normal(len(t) - d), 2000) * np.exp(-t[: len(t) - d] / 0.008)
    return fades(y, 0.0005, 0.05)


def pop(r, f=700):
    t = tt(0.15)
    y = np.sin(2 * np.pi * np.cumsum(f * 2.0 ** np.clip(t / 0.03, 0, 1)) / SR) * np.exp(-t / 0.03)
    return fades(y, 0.001, 0.04)


def paper(r, dur=0.18):
    t = tt(dur)
    y = bp(r.standard_normal(len(t)), 600, 6000) * np.exp(-t / 0.04) + 0.5 * lp(r.standard_normal(len(t)), 300) * np.exp(-t / 0.02)
    return fades(y, 0.002, 0.04)


def rip(r, dur=0.45):
    """cloth / parchment tearing: dense crackle in a rising band"""
    n = ns(dur); t = np.arange(n) / SR
    y = np.zeros(n)
    for _ in range(int(dur * 260)):
        i = r.integers(0, n - 300); L = r.integers(40, 260)
        y[i:i + L] += r.standard_normal(L) * np.exp(-np.arange(L) / (L / 3)) * r.uniform(0.3, 1.0)
    y = bp(y, 900 + 1200 * 0, 7000) * (0.4 + 0.6 * t / dur)
    return fades(y, 0.01, 0.06)


def scrape(r, dur=0.6, lo=300, hi=2400):
    """stone on stone / a shovel in earth: rough band noise with a grinding judder"""
    n = ns(dur); t = np.arange(n) / SR
    y = bp(r.standard_normal(n), lo, hi) * (0.6 + 0.4 * np.abs(np.sin(2 * np.pi * 23 * t + 3 * smooth_noise(n, r, 6))))
    return fades(y, 0.03, 0.12)


def rumble(dur, r):
    n = ns(dur)
    y = lp(colored(n, r, 1.8), 120, 3) * (0.7 + 0.3 * smooth_noise(n, r, 3)) + 0.3 * lp(colored(n, r, 1.0), 400, 2) * smooth_noise(n, r, 8)
    return widen(fades(y, 0.25, 0.6), r, 13, 0.7)


def whisper(r, dur=0.35):
    t = tt(dur)
    y = bp(r.standard_normal(len(t)), 2500, 9000) * np.sin(np.pi * t / dur) ** 1.5 * (0.6 + 0.4 * np.sin(2 * np.pi * 9 * t) ** 2)
    return fades(y, 0.01, 0.05)


def gulp(r):
    t = tt(0.22)
    y = np.sin(2 * np.pi * np.cumsum(260 * 1.8 ** np.clip(t / 0.08, 0, 1)) / SR) * np.exp(-((t - 0.06) / 0.05) ** 2)
    return fades(y, 0.002, 0.04)


def sparkle(b, t0, r, notes=(86, 88, 91, 93, 95, 98), n=6, gain=0.5, step=0.07):
    for k in range(n):
        place(b, pan(I.glock(I.m2f(r.choice(notes)), r.uniform(0.3, 0.6), r, 1.0), r.uniform(-0.7, 0.7)), t0 + k * step, gain)


def murmur(dur, r, voices=6, lo=95, hi=140):
    n = ns(dur); out = np.zeros((2, n))
    for _ in range(voices):
        y = G.babble(dur, r, r.uniform(lo, hi), r.uniform(0.95, 1.05), r.uniform(3.4, 4.4), r.uniform(0.4, 0.7), fmax=3000)
        out += pan(lp(y, r.uniform(1800, 2800), 1) * r.uniform(0.3, 0.9), r.uniform(-0.85, 0.85))
    return fades(out, 0.5, 0.6)


def gasps(b, t0, r, n=6, gain=0.3):
    for k in range(n):
        place(b, pan(G.whoa(r, dur=r.uniform(0.35, 0.5)) * r.uniform(0.4, 0.9), r.uniform(-0.8, 0.8)), t0 + r.uniform(0, 0.2), gain)



def splat(r, size=1.0):
    t = tt(0.25)
    y = lp(r.standard_normal(len(t)), 900 * size + 400) * np.exp(-t / 0.05) + 0.5 * np.sin(2 * np.pi * 110 * t) * np.exp(-t / 0.04)
    return fades(y, 0.001, 0.05)


def chew(dur, r, rate=4.0):
    n = ns(dur); t = np.arange(n) / SR
    gate = np.clip(np.sin(2 * np.pi * rate * t), 0, 1) ** 3
    y = bp(r.standard_normal(n), 300, 2500) * gate * (0.6 + 0.4 * smooth_noise(n, r, 6))
    return fades(y, 0.02, 0.05)


def flap(r):
    t = tt(0.3)
    y = lp(r.standard_normal(len(t)), 700) * np.sin(np.pi * t / 0.3) ** 2
    return fades(y, 0.01, 0.05)


def retch(r):
    """a cartoon 'hurk': a falling vocal gurgle"""
    t = tt(0.55)
    f = 180 * (1 - 0.45 * t / 0.55)
    y = np.sin(2 * np.pi * np.cumsum(f * (1 + 0.08 * np.sin(2 * np.pi * 28 * t))) / SR) * np.sin(np.pi * t / 0.55)
    y += 0.4 * bp(r.standard_normal(len(t)), 200, 1400) * np.sin(np.pi * t / 0.55)
    return fades(y, 0.02, 0.06)


def build_sfx():
    r = rng(1876)
    S = buf()
    for a, b in FARM:
        place(S, G.bird_chirps(b - a, r, 0.5), a, 0.18); place(S, G.breeze(b - a, r, 0.4), a, 0.12)
    place(S, fire_bed(cf(4) - cf(1), r, 0.06), cf(1), 0.3)
    cue(0.0, "farm: birds, breeze; the soap fire crackles")
    # the rain of meat: a patter of splats from "rained" on, thinning out before the men arrive
    tk = W["rained"] - 0.1
    while tk < B[4] - 0.4:
        place(S, pan(splat(r, r.uniform(0.6, 1.4)), r.uniform(-0.8, 0.8)), tk, r.uniform(0.15, 0.4)); tk += r.uniform(0.08, 0.3)
    cue(W["rained"], "meat patter: splats everywhere")
    place(S, st(splat(r, 2.0)), W["chunks"] + 0.02, 1.0); place(S, G.splash_big(r) * 0.4, W["chunks"] + 0.04, 0.5)
    cue(W["chunks"], "a chunk plops into the soap kettle")
    place(S, pan(G.oof(r, "oh", 260, 1.1), -0.2), W["sky"] + 0.1, 0.4)
    place(S, st(splat(r, 2.4)), W["four"] - 0.03, 1.0); cue(W["four"], "the big one lands on the fence post")
    for k in range(int((W["investigate"] - cf(4)) / 0.32)):
        place(S, pan(G.stroll_step(r, 0.4), 0.3), cf(4) + 0.1 + k * 0.32, 0.4)
    cue(cf(4), "footsteps: the two men arrive")
    place(S, pan(chew(cf(6) - W["tasted"], r), -0.1), W["tasted"], 0.45)
    place(S, pan(chew(cf(7) - cf(6), r, 3.5), 0.1), cf(6), 0.35); cue(W["tasted"], "chewing")
    for w in ("mutton", "venison"):
        place(S, I.glock(I.m2f(84 if w == "mutton" else 88), 0.5, r, 1.4), W[w] - 0.03, 0.35)
    cue(W["mutton"], "bubble 'plinks'")
    # the study: a clock, the lamp; the microscope click; 'baby' gasp
    a, b = OFFICE[0]
    t0 = a + 0.3
    while t0 < b:
        place(S, pan(G.clink(r, 2400, 0.04, 0.6), 0.4), t0, 0.12); t0 += 1.0
    place(S, I.glock(I.m2f(91), 0.4, r, 1.2), W["algae"], 0.3)
    place(S, st(G.clink(r, 1800, 0.08, 1.0)), cw("lung"), 0.5); cue(cw("lung"), "microscope click")
    place(S, pan(G.whoa(r, dur=0.5), 0.0), W["baby"] + 0.15, 0.6); cue(W["baby"], "the doctor gasps")
    # vultures: flapping, distant calls (hiss), the retch, the drop, the takeoff
    a, b = FARM[1]
    tk = a + 0.2
    while tk < b:
        place(S, pan(flap(r), r.uniform(-0.6, 0.6)), tk, 0.3); tk += r.uniform(0.35, 0.6)
    place(S, pan(retch(r), 0.0), W["up"] - 0.05, 0.9); place(S, pan(splat(r, 1.2), 0.2), W["up"] + 0.9, 0.5)
    place(S, widen(G.whoosh(0.6, r, 0.3, 500, 4000), r), W["take"] - 0.05, 0.7); cue(W["up"], "vulture retch, splat, whoosh off")
    for k in range(5):
        place(S, pan(retch(r) * 0.6, r.uniform(-0.7, 0.7)), W["passing"] + k * 0.25, 0.4)
        place(S, pan(splat(r, 1.0), r.uniform(-0.7, 0.7)), W["passing"] + k * 0.25 + 1.0, 0.4)
    cue(W["passing"], "the flock: retches + splats")
    place(S, pan(G.oof(r, "oof", 140, 1.2), -0.3), W["vomit"] - 0.02, 0.7); place(S, pan(G.oof(r, "oof", 170, 1.2), 0.3), W["vomit"] + 0.06, 0.6)
    place(S, st(squish := splat(r, 0.6)), W["vomit"] + 0.4, 0.5); cue(W["vomit"], "both men spit it out")
    place(S, I.triangle(0.5, r, 1.8, 2640), W["jar"] - 0.02, 0.4); cue(W["jar"], "glass 'ting' on the jar")
    return S


# ================================================================ score (G major, 112 bpm)
BEAT = 60 / 112
CH = {"G": [43, 55, 59, 62, 67], "C": [48, 55, 60, 64, 67], "D": [50, 57, 62, 66, 69], "Em": [40, 52, 55, 59, 64], "Am": [45, 52, 57, 60, 64]}


def banjo(M, t0, t1, r, prog, gain=1.0):
    """bluegrass-ish roll: bass on 1 and 3, a forward roll of eighths on top"""
    t, k = t0, 0
    roll = (3, 2, 4, 3, 2, 4, 3, 2)
    while t < t1 - 0.05:
        ch = CH[prog[k % len(prog)]]
        for j in range(8):
            tj = t + j * BEAT / 2
            if tj >= t1: break
            if j in (0, 4): place(M, pan(I.pluck(I.m2f(ch[0] if j == 0 else ch[1]), 0.8, r, 0.5, 0.4), -0.2), tj, gain)
            place(M, pan(I.pluck(I.m2f(ch[roll[j]] + 12), 0.55, r, 0.3, 0.85, 0.08), 0.25), tj, gain * 0.5)
        t += 4 * BEAT; k += 1


def tune(M, t0, t1, r, gain=1.0):
    mel = [74, 76, 79, 76, 74, 71, 74, 79, 81, 79, 76, 74, 71, 69, 71, 74]
    t, k = t0, 0
    while t < t1 - 0.2:
        place(M, pan(I.fife(I.m2f(mel[k % 16]), BEAT * 0.9, 0.5, r), 0.1), t, gain)
        t += BEAT; k += 1


def sneak(M, t0, t1, r, gain=1.0):
    line = [55, 58, 60, 61, 62, 61, 60, 58]
    t, k = t0, 0
    while t < t1 - 0.1:
        place(M, pan(I.pluck(I.m2f(line[k % 8]), 0.7, r, 0.25, 0.35), -0.15), t, gain)
        t += BEAT / 2 * (1.0 if k % 4 != 3 else 1.5); k += 1


def sting(M, t, r, root=43, gain=1.0):
    for m in (root, root + 4, root + 7):
        place(M, I.brass(I.m2f(m + 12), 0.7, 0.85, r, "stab"), t - 0.02, 0.35 * gain)
    place(M, I.timpani(I.m2f(root), 0.8, r, 1.6), t - 0.02, 0.6 * gain); place(M, I.cymbal(0.4, r, 1.6), t, 0.3 * gain)


def build_music():
    r = rng(3)
    M = buf()
    banjo(M, 0.15, cf(7) - 0.1, r, ["G", "G", "C", "D"], 0.9)
    tune(M, cf(4), cf(7) - 0.2, r, 0.6); cue(0.15, "music: banjo roll; whistle tune when the men arrive")
    sting(M, W["meat"], r)
    sting(M, W["tasted"], r, 48, 0.8)
    sneak(M, cf(7), cf(9) - 0.1, r, 0.8); cue(cf(7), "music: sneaky lab plucks")
    place(M, I.pad([I.m2f(m) for m in (55, 58, 62)], cf(10) - cf(9), 0.3, r, 0.4, 0.5, 900), cf(9), 0.5)
    sting(M, W["baby"], r, 44, 1.0)
    banjo(M, cf(10), cf(14) - 0.1, r, ["Em", "C", "D", "G"], 0.85); cue(cf(10), "music: banjo returns, minor, for the vultures")
    sting(M, W["vomit"], r, 43, 1.1)
    for k, m in enumerate(CH["G"]):
        place(M, I.pluck(I.m2f(m + 12), 0.7, r, 2.2, 0.6), W["jar"] + 0.02 + 0.04 * k, 0.7)
    cue(W["vomit"], "music: sting on 'vomit', final strum on 'jar'")
    return M


# ================================================================ mix
def voice_chain(x, thr_db=-24.0, ratio=3.5):
    """broadcast narrator chain: high-pass, less mud, presence + air, then an RMS compressor (10 ms detector)"""
    x = hp(x, 85)
    x = peq(x, 260, -2.5, 1.0)
    x = peq(x, 3800, 4.0, 0.9)
    x = shelf(x, 10000, 2.5, "high")
    a = np.exp(-1 / (0.010 * SR))
    env = np.sqrt(np.maximum(signal.lfilter([1 - a], [1, -a], x * x), 1e-12))
    thr = dbg(thr_db) * np.abs(x).max()
    g = np.where(env > thr, (env / thr) ** (1 / ratio - 1), 1.0)
    g = signal.lfilter([1 - np.exp(-1 / (0.004 * SR))], [1, -np.exp(-1 / (0.004 * SR))], g)
    return x * g


def load_voice():
    v, sr = read_wav(os.path.join(ROOT, "voice", "voice.wav"))
    v = v.mean(axis=0)
    if sr != SR:
        g = np.gcd(SR, sr)
        v = signal.resample_poly(v, SR // g, sr // g)
    out = np.zeros(N); out[: min(N, len(v))] = v[:N]
    return st(voice_chain(out))


def duck_curve(words, depth_db=-11.0, pre=0.08, post=0.18, smooth=0.25):
    g = np.zeros(N)
    for w in words:
        a, b = ns(max(0, w["s"] - pre)), ns(min(DUR, w["e"] + post))
        g[a:b] = 1
    k = signal.windows.hann(ns(smooth)); k /= k.sum()
    g = np.convolve(g, k, mode="same")
    return dbg(depth_db * np.clip(g, 0, 1))


def write_wav(path, x):
    x = np.clip(st(x), -1, 1)
    pcm = (x.T * 32767).astype("<i2")
    with wave.open(path, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())


def main():
    os.makedirs(os.path.join(ROOT, "audio", "stems"), exist_ok=True)
    V = load_voice()
    words = json.load(open(os.path.join(ROOT, "voice", "words.json")))
    S = build_sfx()
    M = build_music()
    # rooms: open air on the farm, a small study; voice stays dry
    off = sum(env_seg(a, b, 0.2, 0.3) for a, b in OFFICE)
    out = np.clip(1 - off, 0, 1)
    room, air = make_ir(0.6, 3), make_ir(0.35, 5)

    def wet(x, k):
        return x + k * (convolve_st(x * off, room)[:, :N] + 0.5 * convolve_st(x * out, air)[:, :N])
    S, M = wet(S, 0.22), wet(M, 0.25)
    # levels: voice at -16 LUFS; music bed ~ -27 under it (ducked a further 11 dB on words); SFX events ~ -24
    V = V * dbg(-16 - integrated(V))
    M = M * dbg(-27 - integrated(M)) * duck_curve(words)
    S = S * dbg(-24 - integrated(S)) * duck_curve(words, -7.0, pre=-0.05, post=0.03, smooth=0.05)
    mix = V + M + S
    for _ in range(3):
        mix *= dbg(-14.0 - integrated(mix))
        mix = 0.84 * np.tanh(mix / 0.84)
    tp = true_peak(mix)
    if tp > -1.0:
        mix *= dbg(-1.0 - tp)
    for name, x in [("voice", V), ("music", M), ("sfx", S), ("mix", mix)]:
        write_wav(os.path.join(ROOT, "audio", "stems" if name != "mix" else "", f"{name}.wav"), x)
    with open(os.path.join(ROOT, "audio", "cues.md"), "w") as f:
        f.write("# Sound cues (s)\n\n" + "\n".join(f"- {t:6.2f}  {w}" for t, w in sorted(cues)) + "\n")
    print(f"mix: {DUR:.3f} s, integrated {integrated(mix):.1f} LUFS, true peak {true_peak(mix):.1f} dBTP, {len(cues)} cues")


if __name__ == "__main__":
    main()
