# Sound for "Wombats Poop Cubes. Scientists Found Out How": synthesized SFX + an original, quirky "curious science"
# score (pizzicato bass, glockenspiel tune, brushed snare), ducked under the voice. Every event sits on the picture's
# word times (~/wombat-short/timing.json).
# Usage: ~/tts/chatterbox/bin/python wombat_sound.py  ->  ~/wombat-short/audio/mix.wav (48 kHz stereo, exact picture length),
# stems/*.wav, cues.md
import os, sys, json, wave
import numpy as np
from scipy import signal

AUDIO_LIB = os.path.expanduser("~/claude-animated-shorts/shorts/audio")
sys.path.insert(0, AUDIO_LIB)
from dsp import (SR, ns, tt, rng, lp, hp, bp, peq, shelf, smooth_noise, fades, pan, st, place, widen, make_ir, convolve_st,
                 integrated, true_peak, dbg, read_wav)
import instruments as I
import sfx_gen as G

ROOT = os.path.expanduser("~/wombat-short")
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
NIGHT = [(0.0, cf(1)), (cf(2), cf(3)), (cf(13), DUR)]
DAY = [(cf(1), cf(2)), (cf(4), cw("guts")), (cf(9), cf(10))]
LAB = [(cf(3), cf(4)), (cw("guts"), cf(9)), (cf(10), cf(11)), (cf(12), cf(13))]
STAGE = [(cf(11), cf(12))]
INSIDE = LAB + STAGE
cues = []


def cue(t, what):
    cues.append((t, what))


def buf():
    return np.zeros((2, N))


def env_seg(a, b, fin=0.4, fout=0.6):
    t = np.arange(N) / SR
    return np.clip((t - a) / fin + 1, 0, 1) * np.clip((b - t) / fout + 1, 0, 1)


# ================================================================ SFX
def bloop(r, f0=520, f1=170, dur=0.16):
    """the cartoon plop of a cube coming out"""
    t = tt(dur)
    f = f1 + (f0 - f1) * np.exp(-t / 0.035)
    return fades(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.06) + 0.15 * lp(r.standard_normal(len(t)), 900) * np.exp(-t / 0.01), 0.001, 0.03)


def tok(r, f=900, bright=1.0):
    """a firm little cube landing on rock / wood / a bench: a short woodblock knock"""
    t = tt(0.12)
    y = sum(a * np.sin(2 * np.pi * f * m * t + r.uniform(0, 6)) * np.exp(-t / d) for m, a, d in ((1.0, 1.0, 0.025), (2.7, 0.4 * bright, 0.012), (5.1, 0.2 * bright, 0.006)))
    return fades(y + 0.3 * hp(r.standard_normal(len(t)), 2500) * np.exp(-t / 0.003), 0.0005, 0.02)


def drop(S, t0, r, gain=0.6, fall=0.2, f=900):
    place(S, pan(bloop(r, r.uniform(480, 600)), r.uniform(-0.2, 0.2)), t0 - 0.03, gain * 0.7)
    place(S, pan(tok(r, f * r.uniform(0.9, 1.1)), r.uniform(-0.2, 0.2)), t0 + fall, gain)


def thump(r, f=60, dur=0.25):
    t = tt(dur)
    return fades(np.sin(2 * np.pi * np.cumsum(f * (1 + 1.2 * np.exp(-t / 0.015))) / SR) * np.exp(-t / 0.06) + 0.4 * lp(r.standard_normal(len(t)), 400) * np.exp(-t / 0.03), 0.001, 0.04)


def boing(r, f0=330, dur=0.6, wob=14):
    t = tt(dur)
    f = f0 * (1 + 0.35 * np.exp(-t / 0.12) * np.sin(2 * np.pi * wob * t))
    return fades(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.22), 0.002, 0.06)


def marker(r, dur=0.45):
    """a whiteboard marker squeaking: chirpy band-passed friction"""
    n = ns(dur); t = np.arange(n) / SR
    chirp = (0.5 + 0.5 * np.sin(2 * np.pi * (9 + 4 * smooth_noise(n, r, 3)) * t)) ** 3
    y = bp(r.standard_normal(n), 1800, 5200) * chirp + 0.3 * np.sin(2 * np.pi * np.cumsum(2400 + 500 * smooth_noise(n, r, 6)) / SR) * chirp
    return fades(y, 0.01, 0.05)


def hiss(r, dur=0.8, lo=3000):
    n = ns(dur); t = np.arange(n) / SR
    return fades(hp(r.standard_normal(n), lo) * np.exp(-t / (dur * 0.45)), 0.005, 0.1)


def jingle(b, t0, r, dur=1.4, gain=0.35):
    """sleigh bells: bursts of tiny high clinks shaken in time"""
    t = t0
    while t < t0 + dur:
        for _ in range(7):
            place(b, pan(G.clink(r, r.uniform(4200, 7800), 0.09, 1.0), r.uniform(-0.6, 0.6)), t + r.uniform(0, 0.05), gain * r.uniform(0.4, 1.0))
        t += 0.21


def squeak_rise(r, dur):
    """a long balloon stretching: a rubbery squeak sliding up"""
    n = ns(dur); t = np.arange(n) / SR
    f = 300 + 700 * (t / dur) ** 1.4 + 25 * np.sin(2 * np.pi * 7 * t)
    ph = np.cumsum(f) / SR
    y = (2 * (ph % 1) - 1) * (0.5 + 0.5 * smooth_noise(n, r, 11) ** 2)
    return fades(lp(bp(y, 400, 3500), 2500), 0.05, 0.1)


def squelch(r, dur=0.5):
    n = ns(dur); t = np.arange(n) / SR
    f = 260 * (1 - 0.5 * t / dur)
    y = np.sin(2 * np.pi * np.cumsum(f * (1 + 0.3 * np.sin(2 * np.pi * 23 * t))) / SR) * smooth_noise(n, r, 18) + 0.6 * bp(r.standard_normal(n), 300, 1500) * smooth_noise(n, r, 25) ** 2
    return fades(y * np.sin(np.pi * t / dur), 0.01, 0.05)


def drip(r):
    t = tt(0.18)
    f = 900 + 1400 * (1 - np.exp(-t / 0.02))
    return fades(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.04), 0.001, 0.03)


def xray(r, dur=0.7):
    """an x-ray machine: mains buzz + a rising whine"""
    n = ns(dur); t = np.arange(n) / SR
    y = 0.6 * np.sign(np.sin(2 * np.pi * 120 * t)) * 0.5 + 0.5 * np.sin(2 * np.pi * np.cumsum(800 + 1600 * t / dur) / SR)
    return fades(lp(y, 3000) * np.sin(np.pi * t / dur) ** 0.5, 0.01, 0.1)


def hum(dur, r):
    """fluorescent lab hum + a little room tone"""
    n = ns(dur); t = np.arange(n) / SR
    y = 0.4 * np.sin(2 * np.pi * 120 * t) + 0.15 * np.sin(2 * np.pi * 240 * t) + 0.5 * lp(r.standard_normal(n), 500)
    return widen(fades(y, 0.3, 0.3), r, 7, 0.4)


def sparkle(b, t0, r, notes=(86, 88, 91, 93, 95, 98), n=6, gain=0.5, step=0.07):
    for k in range(n):
        place(b, pan(I.glock(I.m2f(r.choice(notes)), r.uniform(0.3, 0.6), r, 1.0), r.uniform(-0.7, 0.7)), t0 + k * step, gain)


def murmur(dur, r, voices=8, lo=95, hi=160):
    n = ns(dur); out = np.zeros((2, n))
    for _ in range(voices):
        y = G.babble(dur, r, r.uniform(lo, hi), r.uniform(0.95, 1.05), r.uniform(3.4, 4.4), r.uniform(0.4, 0.7), fmax=3000)
        out += pan(lp(y, r.uniform(1800, 2800), 1) * r.uniform(0.3, 0.9), r.uniform(-0.85, 0.85))
    return fades(out, 0.5, 0.6)


def steps(S, a, b, r, rate=4.0, gain=0.25):
    t = a
    while t < b:
        place(S, pan(thump(r, r.uniform(90, 120), 0.12), r.uniform(-0.2, 0.2)), t, gain); t += 1 / rate


def build_sfx():
    r = rng(2019)
    S = buf()
    # ---- ambiences ----
    for a, b in NIGHT:
        place(S, G.crickets(b - a, r, 3), a, 0.12); place(S, G.breeze(b - a, r, 0.4, bright=900), a, 0.08)
    for a, b in DAY:
        place(S, G.breeze(b - a, r, 0.55, bright=1400), a, 0.14); place(S, G.bird_chirps(b - a, r, 0.3, "sparrow"), a, 0.08)
    for a, b in LAB:
        place(S, hum(b - a, r), a, 0.06)
    for a, b in STAGE:
        place(S, murmur(b - a, r, 10), a, 0.15)
    cue(0.0, "night crickets; day breeze + birds; lab hum; auditorium murmur")
    # ---- 1: the hook, three cubes ----
    for k, w in enumerate(("perfect", "little")): drop(S, W[w] - 0.1, r, 0.55, 0.2, 820 + 60 * k)
    drop(S, W["cubes"] - 0.12, r, 0.7, 0.16, 980); sparkle(S, W["cubes"] + 0.05, r, n=4, gain=0.3)
    cue(W["perfect"], "plop + tok x3 on 'perfect little cubes', sparkle")
    # ---- 2: out of the burrow ----
    place(S, pan(G.whoosh(0.5, r, 0.2, 200, 1200), 0.3), cf(1) + 0.1, 0.3)
    steps(S, cf(1) + 0.75, cf(2) - 0.2, r, 4.0, 0.2); place(S, pan(boing(r, 180, 0.4, 9), 0.0), W["short"] - 0.02, 0.35)
    cue(W["short"], "pitter-patter steps, a low boing on 'short'")
    # ---- 3: dozens of cubes, logs, turf ----
    for k in range(9): place(S, pan(tok(r, r.uniform(1100, 1500), 0.7), r.uniform(-0.6, 0.6)), W["dozens"] - 0.1 + 0.05 * k + 0.08, 0.35)
    drop(S, W["logs"], r, 0.5, 0.18, 650); drop(S, W["turf"], r, 0.5, 0.18, 650)
    cue(W["dozens"], "a rattle of pops for 'dozens'; plops on the log")
    # ---- 4: the mystery board ----
    place(S, pan(marker(r, 0.5), -0.2), W["round"] - 0.05, 0.4); place(S, pan(marker(r, 0.4), 0.2), W["square"] - 0.05, 0.4)
    place(S, pan(boing(r, 420, 0.5), 0.3), W["poo"] - 0.02, 0.4); cue(W["round"], "marker squeaks, boing on the '?'")
    # ---- 5-6: the esky ----
    place(S, st(thump(r, 85, 0.25)), W["sent"] + 0.1, 0.5); place(S, pan(G.clink(r, 1500, 0.1, 0.8), 0.1), W["sent"] + 0.11, 0.2)
    place(S, pan(G.whoosh(0.7, r, 0.25, 400, 4500), 0.5), W["atlanta"] - 0.1, 0.55); cue(W["atlanta"], "lid slam, the esky whooshes off")
    place(S, st(thump(r, 70, 0.3)), cw("guts") + 0.1, 0.4)
    place(S, pan(hiss(r, 1.0), 0.0), W["frozen"] - 0.05, 0.4); sparkle(S, W["frozen"], r, notes=(96, 98, 100, 103), n=5, gain=0.35, step=0.05)
    for k in range(6): place(S, pan(G.clink(r, r.uniform(2500, 4000), 0.06, 0.7), r.uniform(-0.4, 0.4)), W["frozen"] + 0.02 + 0.04 * k, 0.15)
    place(S, pan(G.oof(r, "oof", 150, 1.0), -0.2), W["roadkill"] + 0.05, 0.18)
    cue(W["frozen"], "icy hiss + frost tinkle")
    # ---- 7: like it was Christmas ----
    place(S, pan(G.creak(0.35, r, 140, 220), 0.0), W["opened"] - 0.05, 0.3); place(S, pan(hiss(r, 0.5, 1800), 0.0), W["opened"] + 0.15, 0.25)
    jingle(S, W["christmas"] - 0.05, r, 1.5, 0.35); sparkle(S, W["christmas"] - 0.02, r, n=6, gain=0.35)
    cue(W["christmas"], "sleigh bells + sparkle")
    # ---- 8: the balloon ----
    a, b = W["slid"], W["stretched"] + 0.3
    place(S, pan(squeak_rise(r, b - a), 0.1), a, 0.3)
    t = W["blew"] - 0.1
    while t < b:
        place(S, pan(squelch(r, 0.18), -0.3), t, 0.25); t += 0.36
    cue(W["slid"], "rubber balloon squeak rising, pump squeezes")
    # ---- 9: stiff / stretchy ----
    place(S, st(thump(r, 110, 0.18)), W["stiff"] - 0.03, 0.45); place(S, pan(boing(r, 300, 0.7, 7), 0.0), W["stretchy"] - 0.02, 0.4)
    cue(W["stiff"], "a hard thunk; a stretchy boing")
    # ---- 10: drying + squeeze + corners ----
    for k in range(6): place(S, pan(drip(r), r.uniform(-0.6, 0.6)), W["dries"] + 0.08 * k, 0.25)
    place(S, pan(squelch(r, 0.6), 0.0), W["squeeze"] - 0.05, 0.45)
    for k in range(4): place(S, pan(I.glock(I.m2f(88 + 3 * k), 0.6, r, 0.6), (-0.6, 0.6, 0.6, -0.6)[k]), W["corners"] - 0.02 + 0.06 * k, 0.3)
    cue(W["corners"], "drips, a squelch, four tinks for the corners")
    # ---- 11: x-ray ----
    place(S, pan(xray(r, 0.8), 0.0), W["inside2"] - 0.08, 0.22); drop(S, W["out2"] - 0.08, r, 0.6, 0.38, 700)
    cue(W["inside2"], "x-ray buzz; a plop out the back")
    # ---- 12: like dice ----
    t0 = W["roll"] - 0.3
    for k, d in enumerate((0.0, 0.18, 0.36, 0.5, 0.62, 0.72, 0.8, 0.88)):
        place(S, pan(tok(r, r.uniform(800, 1100), 0.8), -0.3 + 0.08 * k), t0 + d, 0.45 * (1 - 0.06 * k))
    place(S, pan(I.glock(I.m2f(91), 0.6, r, 0.8), 0.2), W["dice"] - 0.02, 0.3); cue(W["roll"], "the cube tumbles like a die")
    # ---- 13: the prize ----
    a, b = STAGE[0]
    place(S, G.applause(b - a, r, 40), a, 0.18)
    for k in range(4): place(S, pan(G.whoosh(0.4, r, 0.15, 1200, 5000), r.uniform(-0.7, 0.7)), a + 0.4 + 0.7 * k, 0.12)
    for k in range(10): place(S, pan(G.hurrah(r, r.uniform(110, 180), r.uniform(0.95, 1.1)) * r.uniform(0.4, 0.9), r.uniform(-0.8, 0.8)), W["physics"] + r.uniform(0, 0.4), 0.22)
    cue(W["physics"], "applause, paper planes, cheers")
    # ---- 14: factories ----
    place(S, pan(marker(r, 0.5), 0.1), W["factories"] - 0.1, 0.3)
    t = W["factories"] + 0.3
    while t < cf(13) - 0.2:
        place(S, pan(G.clink(r, 700, 0.08, 0.5), 0.3), t, 0.12); t += 0.45
    # ---- 15: the loop ----
    drop(S, W["machine"] - 0.1, r, 0.6, 0.2, 980)
    place(S, I.glock(I.m2f(98), 0.7, r, 1.0), W["wombat3"] - 0.02, 0.55); cue(W["wombat3"], "wink 'bink'")
    for tx in (cf(1), cf(2), cf(3), cf(4), cw("guts"), cf(9), cf(10), cf(11), cf(12), cf(13)):
        place(S, widen(G.whoosh(0.45, r, 0.25, 400, 3500), r), tx - 0.2, 0.22)
    return S


# ================================================================ score (F major, 104 bpm, pizzicato + glockenspiel)
BEAT = 60 / 104
CH = {"F": [41, 60, 65, 69], "Bb": [46, 62, 65, 70], "C": [48, 60, 64, 67], "Dm": [50, 62, 65, 69], "Gm": [43, 62, 67, 70]}
PROG = ["F", "F", "Bb", "C", "F", "Dm", "Gm", "C"]
# an original bouncy tune, one note per eighth (0 = rest), 8 bars of 8 eighths
MEL = [72, 0, 77, 0, 76, 74, 72, 0, 69, 0, 72, 0, 77, 0, 0, 0, 74, 0, 77, 0, 81, 79, 77, 0, 76, 0, 72, 0, 74, 76, 0, 0,
       72, 0, 77, 0, 76, 74, 72, 0, 74, 0, 77, 0, 81, 0, 0, 0, 79, 77, 76, 74, 72, 0, 70, 0, 72, 0, 76, 0, 77, 0, 0, 0]


def bounce(M, t0, t1, r, gain=1.0, tune=True, bright=1.0):
    """pizzicato bass on 1 and 3, off-beat plucked chords, a brushed snare backbeat, glockenspiel tune"""
    t, k = t0, 0
    e = BEAT / 2
    while t < t1 - 0.05:
        bar = (k // 8) % 8
        ch = CH[PROG[bar]]
        j = k % 8
        if j in (0, 4): place(M, pan(I.pluck(I.m2f(ch[0] if j == 0 else ch[0] + 7), 0.8, r, 0.5, 0.25), -0.2), t, gain * 0.9)
        if j in (2, 6):
            for m in ch[1:]: place(M, pan(I.pluck(I.m2f(m), 0.5, r, 0.35, 0.4), 0.25), t, gain * 0.22)
            place(M, pan(I.brush(0.5, r), 0.1), t, gain * 0.35)
        m = MEL[k % 64]
        if tune and m: place(M, pan(I.glock(I.m2f(m + 12), 0.5, r, 0.7), 0.3), t, gain * 0.42 * bright)
        t += e; k += 1


def tiptoe(M, t0, t1, r, gain=1.0):
    """the mystery: a minor tiptoe pluck line + a question vibes note"""
    line = [50, 53, 57, 56, 55, 53, 52, 53]
    t, k = t0, 0
    while t < t1 - 0.1:
        place(M, pan(I.pluck(I.m2f(line[k % 8]), 0.6, r, 0.3, 0.3), -0.15), t, gain)
        if k % 4 == 3: place(M, pan(I.vibes(I.m2f(line[k % 8] + 24), 0.4, r, 0.8), 0.3), t, gain * 0.5)
        t += BEAT * (0.5 if k % 2 else 1.0); k += 1


def sting(M, t, r, root=53, gain=1.0):
    for m in (root, root + 4, root + 7):
        place(M, I.brass(I.m2f(m + 12), 0.7, 0.85, r, "stab"), t - 0.02, 0.35 * gain)
    place(M, I.timpani(I.m2f(root - 12), 0.8, r, 1.6), t - 0.02, 0.6 * gain); place(M, I.cymbal(0.4, r, 1.6), t, 0.3 * gain)


def fanfare(M, t, r, gain=1.0):
    for k, m in enumerate((65, 69, 72)):
        place(M, I.brass(I.m2f(m), 0.18, 0.8, r, "stab"), t - 0.6 + 0.18 * k, 0.3 * gain)
    sting(M, t, r, 53, gain)


def build_music():
    r = rng(17)
    M = buf()
    bounce(M, 0.1, cf(3) - 0.1, r, 0.85); cue(0.1, "music: bouncy pizzicato + glockenspiel theme")
    tiptoe(M, cf(3), cf(4) - 0.05, r, 0.7); cue(cf(3), "music: tiptoe mystery")
    bounce(M, cf(4), cf(11) - 0.1, r, 0.8, True, 0.9); cue(cf(4), "music: theme again, through the lab")
    fanfare(M, W["physics"], r, 1.0); cue(W["physics"], "music: brass fanfare")
    place(M, I.pad([I.m2f(m) for m in (53, 57, 60, 65)], cf(12) - cf(11), 0.3, r, 0.5, 0.6, 1600), cf(11), 0.25)
    bounce(M, cf(12) + 0.1, DUR - 0.6, r, 0.7, True, 0.8)
    sting(M, W["wombat3"], r, 53, 0.9); cue(W["wombat3"], "music: final sting")
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
    # rooms: the lab is a small hard room, the auditorium bigger; outdoors a little air; voice stays dry
    lab = np.clip(sum(env_seg(a, b, 0.2, 0.3) for a, b in LAB), 0, 1)
    hall = np.clip(sum(env_seg(a, b, 0.2, 0.3) for a, b in STAGE), 0, 1)
    out = np.clip(1 - lab - hall, 0, 1)
    small, big, air = make_ir(0.5, 3), make_ir(1.4, 4), make_ir(0.35, 5)

    def wet(x, k):
        return x + k * (convolve_st(x * lab, small)[:, :N] + convolve_st(x * hall, big)[:, :N] + 0.5 * convolve_st(x * out, air)[:, :N])
    S, M = wet(S, 0.2), wet(M, 0.18)
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
