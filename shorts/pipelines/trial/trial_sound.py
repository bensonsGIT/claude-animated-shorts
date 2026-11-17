# Sound for "Arrested, and Nobody Says Why | The Trial, Kafka": synthesized SFX + an original deadpan score
# (dry pizzicato in D minor for the arrest -> the painter, a low organ drone in the cathedral and at the door of the Law,
# hard silence after the door shuts, one low string note for the top hats and the quarry, silence after "dog", a quiet
# pad under Kafka's point, the pizzicato again for the loop), ducked under the voice; every event sits on the picture's
# word times (~/the-trial-short/timing.json). SFX helpers are shared with stranger_sound.py.
# Usage: ~/tts/chatterbox/bin/python trial_sound.py  ->  ~/the-trial-short/audio/mix.wav (48 kHz stereo, exact
# picture length), stems/*.wav, cues.md
import os, sys, json, wave
import numpy as np
from scipy import signal

AUDIO_LIB = os.path.expanduser("~/claude-animated-shorts/.claude/worktrees/trial-short/shorts/audio")
sys.path.insert(0, AUDIO_LIB)
from dsp import (SR, ns, tt, rng, lp, hp, bp, peq, shelf, colored, smooth_noise, fades, pan, st, place, widen, make_ir, convolve_st,
                 integrated, true_peak, dbg, read_wav)
import instruments as I
import sfx_gen as G

ROOT = os.path.expanduser("~/the-trial-short")
TM = json.load(open(os.path.join(ROOT, "timing.json")))
FPS, TOTAL = TM["fps"], TM["total"]
DUR = TOTAL / FPS
N = ns(DUR)
W = dict(TM["word"])
B = TM["beat"]
PRE = 3
cf = lambda b: (round(B[b] * FPS) - PRE) / FPS
cw = lambda k: (round(W[k] * FPS) - PRE) / FPS
# sets on the timeline (s), from story.ts SHOTS
BED = [(0.0, cf(3)), (cf(12), cw("quarry")), (cf(15), DUR)]
HEAR = [(cf(3), cf(5))]
JUNK = [(cf(5), cf(7))]
SICK = [(cf(7), cf(8))]
STUDIO = [(cf(8), cf(10))]
CHURCH = [(cf(10), cw("whole")), (cf(14), cf(15))]
LAW = [(cw("whole"), cf(12))]
QUARRY = [(cw("quarry"), cf(14))]
INSIDE = BED + HEAR + JUNK + SICK + STUDIO + CHURCH + LAW
cues = []


def cue(t, what):
    cues.append((t, what))


def buf():
    return np.zeros((2, N))


def env_seg(a, b, fin=0.4, fout=0.6):
    t = np.arange(N) / SR
    return np.clip((t - a) / fin + 1, 0, 1) * np.clip((b - t) / fout + 1, 0, 1)


# ================================================================ SFX
def surf(dur, r):
    n = ns(dur); t = np.arange(n) / SR
    wash = (0.5 + 0.5 * np.sin(2 * np.pi * t / 5.5 - 1.2)) ** 2
    y = lp(colored(n, r, 0.9), 2500, 2) * (0.25 + 0.75 * wash)
    return widen(fades(y, 0.6, 0.6), r, 11, 0.7)


def cicadas(dur, r, level=1.0):
    """a dry high buzz pulsing in waves (the midday heat)"""
    n = ns(dur); t = np.arange(n) / SR
    out = np.zeros((2, n))
    for k in range(3):
        f = r.uniform(4200, 5600)
        buzz = bp(r.standard_normal(n), f * 0.85, f * 1.15) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * r.uniform(60, 90) * t)))
        swell = 0.35 + 0.65 * (0.5 + 0.5 * np.sin(2 * np.pi * t / r.uniform(3.5, 6.0) + r.uniform(0, 6))) ** 2
        out += pan(buzz * swell * level, r.uniform(-0.8, 0.8))
    return fades(out, 0.5, 0.5)


def gunshot(r, muffled=False):
    """a dry crack: a sharp noise burst + low thump, a slap of room; muffled = low-passed and further away"""
    t = tt(0.9)
    crack = hp(r.standard_normal(len(t)), 900) * np.exp(-t / 0.012)
    thump = np.sin(2 * np.pi * np.cumsum(60 * (1 + 2.5 * np.exp(-t / 0.015))) / SR) * np.exp(-t / 0.09)
    tail = lp(r.standard_normal(len(t)), 1800) * np.exp(-t / 0.25) * 0.25
    y = 1.0 * crack + 0.8 * thump + tail
    if muffled: y = lp(y, 700, 2) * 1.6
    return fades(y, 0.0005, 0.1)


def ring(dur=2.2, f=4300.0):
    t = tt(dur)
    return fades(np.sin(2 * np.pi * f * t) * np.exp(-t / (dur * 0.35)) * 0.4, 0.01, 0.3)


def gull(r):
    t = tt(0.5)
    f = 1500 + 900 * np.sin(np.pi * t / 0.5) - 600 * t
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / 0.5) ** 2 * (0.7 + 0.3 * np.sin(2 * np.pi * 30 * t))
    return fades(bp(y, 800, 5000), 0.01, 0.05)


def wings(r, dur=0.5):
    n = ns(dur); t = np.arange(n) / SR
    y = bp(r.standard_normal(n), 300, 2500) * np.abs(np.sin(2 * np.pi * 7 * t)) ** 3 * np.exp(-t / 0.35)
    return fades(y, 0.005, 0.05)


def hum(dur, r, f=100.0):
    """an electric bulb's hum"""
    t = np.arange(ns(dur)) / SR
    y = (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * 2 * f * t) + 0.15 * np.sin(2 * np.pi * 3 * f * t)) * (0.85 + 0.15 * smooth_noise(len(t), r, 2))
    return fades(y, 0.3, 0.3)


def flies(dur, r):
    n = ns(dur); t = np.arange(n) / SR
    f = 190 + 40 * smooth_noise(n, r, 1.5) + 15 * np.sin(2 * np.pi * 0.7 * t)
    y = signal.sawtooth(2 * np.pi * np.cumsum(f) / SR) * (0.4 + 0.6 * smooth_noise(n, r, 0.6) ** 2)
    return pan(fades(lp(y, 1800), 0.4, 0.4), 0.4)


def sob(r, base=230):
    """a small muffled sob: two catching breaths"""
    out = np.zeros(ns(0.8))
    for k, d in enumerate((0.0, 0.28)):
        y = G.oof(r, "oh", base * r.uniform(0.95, 1.1), 1.1)
        y = y[: ns(0.4)]
        a = ns(d); out[a:a + len(y)] += y * (0.8 if k else 1.0)
    return fades(lp(out, 2200), 0.01, 0.1)


def typing(dur, r):
    n = ns(dur); out = np.zeros(n); t = 0.0
    while t < dur - 0.05:
        i = ns(t); L = 900
        if i + L < n: out[i:i + L] += bp(r.standard_normal(L), 1500, 6000) * np.exp(-np.arange(L) / 120) * r.uniform(0.4, 1.0)
        t += r.uniform(0.08, 0.2) + (0.6 if r.uniform() < 0.08 else 0)
    return pan(out, -0.5)


def stamp(r):
    t = tt(0.3)
    y = lp(r.standard_normal(len(t)), 900) * np.exp(-t / 0.03) + 0.6 * np.sin(2 * np.pi * 110 * t) * np.exp(-t / 0.05)
    return fades(y, 0.001, 0.05)


def paper(r, dur=0.4):
    n = ns(dur); t = np.arange(n) / SR
    y = bp(r.standard_normal(n), 2000, 9000) * (0.3 + 0.7 * smooth_noise(n, r, 25) ** 2) * np.sin(np.pi * t / dur)
    return fades(y, 0.01, 0.05)


def match(r):
    t = tt(0.6)
    y = bp(r.standard_normal(len(t)), 2000, 8000) * np.exp(-t / 0.05) + lp(r.standard_normal(len(t)), 1200) * np.clip(t / 0.05, 0, 1) * np.exp(-t / 0.25) * 0.4
    return fades(y, 0.002, 0.1)


def exhale(r):
    t = tt(0.9)
    y = bp(r.standard_normal(len(t)), 300, 3000) * np.sin(np.pi * np.clip(t / 0.9, 0, 1)) ** 1.5
    return fades(y, 0.02, 0.1)


def projector(dur, r):
    n = ns(dur); t = np.arange(n) / SR
    y = bp(r.standard_normal(n), 800, 4000) * (0.5 + 0.5 * np.abs(np.sin(2 * np.pi * 12 * t))) * 0.5 + 0.3 * np.sin(2 * np.pi * 60 * t)
    return pan(fades(y, 0.3, 0.3), 0.6)


def laughter(dur, r, gain=1.0):
    out = np.zeros((2, ns(dur))); t = 0.1
    while t < dur - 0.4:
        y = G.babble(0.35, r, r.uniform(120, 220), 1.0, 7.0, 0.9, fmax=3000)
        a = ns(t); out[:, a:a + len(y)] += pan(y * r.uniform(0.3, 0.8) * gain, r.uniform(-0.8, 0.8))[:, : max(0, ns(dur) - a)]
        t += r.uniform(0.12, 0.3)
    return fades(out, 0.2, 0.3)


def pop(r):
    t = tt(0.12)
    y = np.sin(2 * np.pi * np.cumsum(900 + 1400 * t / 0.12) / SR) * np.exp(-t / 0.03)
    return fades(y, 0.001, 0.02)


def slide_whistle(r, f0=1100, f1=400, dur=0.6):
    t = tt(dur)
    f = f0 + (f1 - f0) * (t / dur) ** 1.2
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / dur) ** 0.5 * (1 + 0.05 * np.sin(2 * np.pi * 6 * t))
    return fades(y, 0.01, 0.05)


def knock(r, n=3):
    out = np.zeros(ns(0.8))
    for k in range(n):
        y = G.hammer_hit(r, 0.35)[: ns(0.2)]
        a = ns(k * 0.17); out[a:a + len(y)] += lp(y, 1600)
    return out


def shing(r, dur=0.8):
    t = tt(dur)
    ringk = sum(a * np.sin(2 * np.pi * f * t + r.uniform(0, 6)) * np.exp(-t / d) for f, a, d in ((3520, 0.5, 0.35), (5280, 0.35, 0.25), (7040, 0.25, 0.18), (8870, 0.15, 0.12)))
    scr = bp(r.standard_normal(len(t)), 2500, 9000) * np.clip(t / 0.08, 0, 1) * np.exp(-t / 0.09) * 0.6
    return fades(ringk + scr, 0.003, 0.1)


def fans(dur, r):
    n = ns(dur); t = np.arange(n) / SR
    y = bp(r.standard_normal(n), 400, 3000) * (0.3 + 0.7 * np.abs(np.sin(2 * np.pi * 1.6 * t)) ** 4)
    return widen(fades(y, 0.4, 0.4), r, 9, 0.6)


def clock(b, a, e, r, gain=0.12):
    t, k = a + 0.2, 0
    while t < e:
        place(b, pan(G.clink(r, 2600 if k % 2 else 2300, 0.03, 0.5), -0.6), t, gain); t += 0.5; k += 1


def murmur(dur, r, voices=6, lo=95, hi=160):
    n = ns(dur); out = np.zeros((2, n))
    for _ in range(voices):
        y = G.babble(dur, r, r.uniform(lo, hi), r.uniform(0.95, 1.05), r.uniform(3.4, 4.4), r.uniform(0.4, 0.7), fmax=3000)
        out += pan(lp(y, r.uniform(1800, 2800), 1) * r.uniform(0.3, 0.9), r.uniform(-0.85, 0.85))
    return fades(out, 0.5, 0.6)


def gasps(b, t0, r, n=6, gain=0.3):
    for k in range(n):
        place(b, pan(G.whoa(r, dur=r.uniform(0.35, 0.5)) * r.uniform(0.4, 0.9), r.uniform(-0.8, 0.8)), t0 + r.uniform(0, 0.2), gain)


def jeers(b, t0, t1, r, gain=0.35):
    t = t0
    while t < t1:
        place(b, pan(G.hurrah(r, r.uniform(90, 140), r.uniform(0.9, 1.0)) * 0.8, r.uniform(-0.9, 0.9)), t, gain * r.uniform(0.6, 1.0)); t += r.uniform(0.15, 0.4)


def blade(r):
    t = tt(1.0)
    swish = bp(r.standard_normal(len(t)), 1500, 7000) * np.clip(t / 0.18, 0, 1) * (t < 0.2) * 0.7
    thunk = np.sin(2 * np.pi * np.cumsum(55 * (1 + 2 * np.exp(-np.clip(t - 0.2, 0, None) / 0.02))) / SR) * np.exp(-np.clip(t - 0.2, 0, None) / 0.12) * (t >= 0.2)
    wood = bp(r.standard_normal(len(t)), 200, 2000) * np.exp(-np.clip(t - 0.2, 0, None) / 0.03) * (t >= 0.2)
    return fades(swish + 1.2 * thunk + 0.7 * wood, 0.002, 0.1)


def crash(r):
    t = tt(1.4)
    y = sum(bp(r.standard_normal(len(t)), f * 0.7, f * 1.4) * np.exp(-np.clip(t - d, 0, None) / 0.12) * (t > d) * a
            for f, d, a in ((1800, 0.0, 1.0), (3000, 0.06, 0.7), (2400, 0.15, 0.6), (3800, 0.3, 0.4), (2000, 0.45, 0.3)))
    scrape = bp(r.standard_normal(len(t)), 300, 1800) * (t > 0.05) * (t < 0.5) * 0.4
    return fades(y + scrape, 0.001, 0.2)


def door_bang(r):
    a, b = st(G.push_thump(r)), st(G.wood_crack(r))
    x = np.zeros((2, max(a.shape[1], b.shape[1])))
    x[:, : a.shape[1]] += a; x[:, : b.shape[1]] += 0.5 * b
    return x


def whip_crack(r):
    x = np.zeros((2, ns(0.6)))
    place(x, widen(G.whoosh(0.25, r, 0.5, 900, 6000), r), 0.0, 0.7)
    place(x, st(G.wood_crack(r)), 0.2, 0.7)
    return x


def build_sfx():
    r = rng(1925)
    S = buf()
    # ---- ambiences ----
    for a, b in BED:
        clock(S, a, b, r, 0.1)
        t0 = a + 0.4
        while t0 < b - 0.3:
            place(S, pan(G.stroll_step(r, 0.3), r.uniform(-0.6, 0.6)), t0, 0.04); t0 += r.uniform(0.5, 1.2)
    for a, b in HEAR:
        place(S, murmur(b - a, r, 8), a, 0.14)
        for k in range(3): place(S, pan(G.oof(r, "oh", 120 + 20 * k, 0.6), -0.5 + 0.5 * k), a + 0.7 + 1.1 * k, 0.08)
    for a, b in JUNK:
        place(S, lp(typing(b - a, r), 1500), a, 0.1); place(S, lp(murmur(b - a, r, 3), 1200), a, 0.06)
    for a, b in SICK:
        place(S, st(hum(b - a, r, 70)), a, 0.03)
    for a, b in STUDIO:
        place(S, G.bird_chirps(b - a, r, 0.3), a, 0.04)
    for a, b in LAW:
        place(S, st(hum(b - a, r, 55)), a, 0.08)
    for a, b in QUARRY:
        place(S, G.breeze(b - a, r, 0.9), a, 0.25)
    cue(0.0, "K.'s room: clock + street steps; hearing: murmur, coughs; junk room: muffled bank typing; law: deep hum; quarry: wind")
    # ---- the arrest ----
    place(S, door_bang(r), W["arrested"] - 0.08, 0.8); cue(W["arrested"], "door BANG")
    for k in range(6): place(S, pan(G.boot(r, 0.8), -0.5 + 0.1 * k), W["arrested"] + 0.15 + 0.17 * k, 0.35)
    place(S, widen(G.whoosh(0.5, r, 0.3, 500, 5000), r), cf(1) - 0.15, 0.5)
    for k in range(2): place(S, pan(G.creak(0.4, r, 160, 260), 0.2), W["kafka"] - 0.1 + 0.4 * k, 0.3)
    cue(W["kafka"], "window creaks: the neighbours")
    place(S, pan(G.clink(r, 2900, 0.1, 0.8), 0.4), W["breakfast"] - 0.05, 0.5)
    for k in range(3): place(S, pan(G.oof(r, "oh", 150 + 30 * k, 0.5), 0.3), W["breakfast"] + 0.1 + 0.18 * k, 0.25)
    cue(W["breakfast"], "cup clink + munching")
    # ---- the hearing ----
    place(S, pan(paper(r), 0.3), W["sunday"], 0.5); cue(W["sunday"], "notebook page flip")
    place(S, G.applause(1.6, r, 14), W["fiery"] + 0.1, 0.35); cue(W["fiery"], "half the room claps")
    for k in range(6): place(S, pan(I.glock(I.m2f(96 + (k % 3) * 2), 0.4, r, 0.8), -0.6 + 0.24 * k), W["badges"] - 0.08 + 0.03 * k, 0.2)
    cue(W["badges"], "a run of tings: the badges")
    # ---- the junk room: the same whipping twice ----
    for tw, t_open, t_end in ((W["whipped"], W["bank2"], cf(6)), (W["whip"], W["opens"], cf(7))):
        place(S, pan(G.creak(0.6, r, 90, 140), -0.2), t_open - 0.05, 0.4)
        place(S, whip_crack(r), tw - 0.2, 0.8)
        for k in range(2): place(S, pan(G.oof(r, "oof", 260 + 60 * k, 0.8), -0.3 + 0.6 * k), tw + 0.12 + 0.08 * k, 0.4)
        place(S, door_bang(r), t_end - 0.3, 0.9)
    cue(W["whipped"], "door creak, whip crack + yelps, door SLAM (identical the next day)")
    # ---- Huld ----
    place(S, pan(paper(r), -0.3), W["petition"] - 0.05, 0.5)
    for k in range(3): place(S, pan(G.oof(r, "oh", 85, 0.7), -0.3), W["petition"] + 0.7 + 0.9 * k, 0.12)
    cue(W["petition"], "paper rustle, then snores")
    # ---- Titorelli ----
    for k in range(3): place(S, pan(G.push_thump(r), 0.3), W["acquittal"] + 0.28 * k, 0.35)
    cue(W["acquittal"], "three canvas thumps")
    place(S, pan(G.creak(0.5, r, 140, 220), -0.4), W["behind"] - 0.05, 0.4); place(S, murmur(1.5, r, 4), W["behind"] + 0.2, 0.12)
    cue(W["behind"], "small door creak, murmur from the court offices")
    # ---- the parable ----
    for k in range(3): place(S, st(clock_tick(r)), W["life"] + 0.15 * k, 0.4)
    place(S, door_bang(r), W["shutting"] + 0.3, 1.0); place(S, st(I.timpani(I.m2f(26), 1.0, r, 2.5)), W["shutting"] + 0.3, 0.8)
    cue(W["shutting"], "huge door BOOM, then silence")
    # ---- the top hats, the quarry ----
    for k in range(2): place(S, pan(G.clink(r, 700, 0.08, 0.3), -0.4), W["hats"] + 0.2 * k, 0.25)
    place(S, pan(G.creak(0.6, r, 90, 140), -0.4), W["hats"] - 0.2, 0.3)
    t0 = cw("quarry") + 0.1
    while t0 < cf(13) - 0.2:
        place(S, st(G.stroll_step(r, 0.8)), t0, 0.3); t0 += 0.42
    cue(cw("quarry"), "gravel steps in step")
    place(S, pan(shing(r, 0.5), -0.2), W["butchers"] - 0.03, 0.25); place(S, pan(shing(r, 0.5), 0.2), W["knife"] + 0.32, 0.2)
    place(S, pan(G.clink(r, 1400, 0.06, 0.4), 0.3), W["dog"] - 0.02, 0.4); cue(W["dog"], "the window light clicks off")
    for tx in (cf(3), cf(5), cf(7), cf(8), cf(10), cw("whole"), cf(12), cw("quarry"), cf(14), cf(15)):
        place(S, widen(G.whoosh(0.45, r, 0.25, 400, 3500), r), tx - 0.2, 0.2)
    return S


def clock_tick(r):
    return G.clink(r, 2400, 0.04, 0.5)


# ================================================================ score (D minor, 96 bpm, dry and deadpan)
BEAT = 60 / 96
CH = {"Dm": [38, 57, 62, 65], "Gm": [43, 58, 62, 67], "A": [45, 57, 61, 64], "Bb": [46, 58, 62, 65], "C": [48, 55, 60, 64], "F": [41, 57, 60, 65]}
PROG = ["Dm", "Dm", "Gm", "A", "Dm", "Bb", "Gm", "A"]
MEL = [74, 0, 72, 0, 70, 0, 69, 0, 70, 0, 72, 0, 69, 0, 0, 0, 67, 0, 69, 0, 70, 0, 72, 0, 69, 0, 0, 0, 0, 0, 0, 0,
       74, 0, 77, 0, 76, 0, 74, 0, 72, 0, 70, 0, 69, 0, 0, 0, 70, 0, 69, 0, 67, 0, 65, 0, 64, 0, 0, 0, 0, 0, 0, 0]


def pizz(M, t0, t1, r, gain=1.0, tune=True):
    """walking pizzicato bass on the beat, a dry off-beat chord tick, a sparse plucked tune"""
    t, k = t0, 0
    while t < t1 - 0.05:
        bar = (k // 4) % 8
        ch = CH[PROG[bar]]
        j = k % 4
        if j in (0, 2): place(M, pan(I.pluck(I.m2f(ch[0] + (7 if j == 2 else 0)), 0.75, r, 0.4, 0.3), -0.25), t, gain * 0.9)
        else:
            for m in ch[1:]: place(M, pan(I.pluck(I.m2f(m), 0.35, r, 0.15, 0.6, 0.1), 0.15), t, gain * 0.3)
        m = MEL[(k * 2) % 64]
        if tune and m: place(M, pan(I.pluck(I.m2f(m), 0.55, r, 0.6, 0.8, 0.12), 0.3), t, gain * 0.55)
        if k % 2 == 1: place(M, I.brush(0.25, r, 0.3), t + BEAT * 0.5, gain * 0.25)
        t += BEAT; k += 1


def drone(M, t0, t1, r, notes, gain=0.5, warm=700, att=1.2):
    place(M, I.pad([I.m2f(m) for m in notes], t1 - t0, 0.5, r, att, 0.6, warm), t0, gain)


def build_music():
    r = rng(7)
    M = buf()
    # hook: a held low tone, then the "why" sting (two plucks, the second one flat)
    drone(M, 0.1, cf(1), r, (38, 45, 50), 0.3, 600)
    place(M, pan(I.pluck(I.m2f(62), 0.8, r, 0.8, 0.5), 0.1), W["why"] - 0.02, 0.8)
    place(M, pan(I.pluck(I.m2f(61), 0.8, r, 1.2, 0.5), 0.1), W["why"] + 0.22, 0.8); cue(W["why"], "music: two-pluck sting, the second flat")
    # the arrest -> the painter: the deadpan pizzicato
    pizz(M, cf(1), cf(10) - 0.1, r, 0.85); cue(cf(1), "music: dry pizzicato + brushes")
    place(M, I.timpani(I.m2f(38), 0.6, r, 1.6), W["whip"] - 0.02, 0.45)
    # cathedral + parable: low organ-like drone, a lift on "life", cut dead after the door
    drone(M, cf(10), W["shutting"] + 0.3, r, (26, 38, 45, 50), 0.5, 900, 1.5)
    drone(M, W["life"], W["shutting"] + 0.3, r, (57, 62, 65), 0.25, 1500, 1.0)
    cue(cf(10), "music: organ drone; hard silence after the door shuts")
    # the top hats + the quarry: one sustained low string note, stopped on "dog"
    drone(M, cf(12) + 0.1, W["dog"] + 0.05, r, (31, 38), 0.45, 500, 1.5)
    cue(cf(12), "music: one low held note to 'dog', then silence")
    # Kafka's point: a quiet open pad in the cathedral
    drone(M, cf(14) + 0.2, cf(15), r, (50, 57, 62, 69), 0.35, 1600, 1.0)
    place(M, I.glock(I.m2f(81), 0.4, r, 2.4), W["necessary"] - 0.03, 0.25); cue(cf(14), "music: quiet pad under Kafka's point")
    # the loop line: the pizzicato's first bar again, softly
    pizz(M, cf(15) + 0.1, DUR - 0.2, r, 0.6, True)
    return M


# ================================================================ mix
def voice_chain(x, thr_db=-24.0, ratio=3.5):
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
    ins = np.clip(sum(env_seg(a, b, 0.2, 0.3) for a, b in INSIDE), 0, 1)
    out = np.clip(1 - ins, 0, 1)
    room, air = make_ir(0.8, 3), make_ir(0.35, 5)

    def wet(x, k):
        return x + k * (convolve_st(x * ins, room)[:, :N] + 0.5 * convolve_st(x * out, air)[:, :N])
    S, M = wet(S, 0.2), wet(M, 0.18)
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
