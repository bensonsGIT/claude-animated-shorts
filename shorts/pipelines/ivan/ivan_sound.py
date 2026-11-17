# Sound for "A Judge Was Killed by His Curtains" (The Death of Ivan Ilych, Tolstoy, 1886): synthesized SFX + an original
# score: a stiff, polite salon waltz that goes out of tune on "terrible" and "knob", a church bell for the funeral, ladder
# creaks and a bonk, a record-scratch freeze on "dying", party chatter and a forced laugh on "lie", a candle-lit cello drone,
# silence before the scream, a warm choir-like chord rising into "light", and the salon waltz back, cheerful, at the cards.
# Usage: ~/tts/chatterbox/bin/python ivan_sound.py  ->  ~/ivan-short/audio/mix.wav, stems/*.wav, cues.md
import os, sys, json, wave
import numpy as np
from scipy import signal

AUDIO_LIB = os.path.expanduser("~/claude-animated-shorts/shorts/audio")
sys.path.insert(0, AUDIO_LIB)
from dsp import (SR, ns, tt, rng, lp, hp, bp, peq, shelf, smooth_noise, fades, pan, st, place, widen, make_ir, convolve_st,
                 integrated, true_peak, dbg, read_wav)
import instruments as I
import sfx_gen as G

ROOT = os.path.expanduser("~/ivan-short")
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
COURT = [(cf(1), cf(2))]
DRAWING = [(0.0, cf(1)), (cf(2), cf(8))]
SICK = [(cf(8), cf(11)), (cf(12), cf(13))]
DARK = [(cf(11), cf(12)), (cf(13), cf(14))]
CARDROOM = [(cf(14), DUR)]
COTTAGE = SICK + CARDROOM   # small rooms (reverb)
PLAZA = DRAWING + COURT     # bigger rooms (reverb)
INSIDE = COTTAGE + PLAZA
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


def murmur(dur, r, voices=10):
    """party chatter, the Tycho short's recipe: half men, half women, lively, bright"""
    n = ns(dur)
    out = np.zeros((2, n))
    for _ in range(voices):
        kind = r.uniform()
        base, scale = ((r.uniform(95, 140), r.uniform(0.95, 1.05)) if kind < 0.5 else (r.uniform(180, 240), r.uniform(1.12, 1.2)))
        y = G.babble(dur, r, base, scale, r.uniform(4.2, 5.4), r.uniform(0.65, 0.9), fmax=3400)
        out += pan(lp(y, r.uniform(2200, 3400), 1) * r.uniform(0.3, 1.0), r.uniform(-0.85, 0.85))
    return fades(out, 0.4, 0.6)


def steps(S, a, b, r, rate=4.0, gain=0.25):
    t = a
    while t < b:
        place(S, pan(thump(r, r.uniform(90, 120), 0.12), r.uniform(-0.2, 0.2)), t, gain); t += 1 / rate



def crowd_wash(dur, r, layers=10):
    """a party crowd heard as a soft wash, no synthetic voices: band-limited noise layers, each swelling at its own
    slow chatter rate, warm (300-1800 Hz), widened"""
    n = ns(dur); t = np.arange(n) / SR
    out = np.zeros((2, n))
    for _ in range(layers):
        y = bp(r.standard_normal(n), r.uniform(280, 420), r.uniform(1300, 1900), 1)
        am = 0.55 + 0.45 * np.clip(smooth_noise(n, r, r.uniform(2.5, 4.5)), -1, 1)
        out += pan(y * am * r.uniform(0.5, 1.0), r.uniform(-0.8, 0.8))
    return fades(out * np.clip(t / 1.2, 0, 1)[None, :], 0.8, 0.8)

def rain_bed(dur, r, level=1.0, bright=5000):
    n = ns(dur)
    y = lp(hp(r.standard_normal(n), 900), bright) * 0.5
    y = widen(fades(y, 0.4, 0.5), r, 9, 0.6)
    for _ in range(int(dur * 14)):
        place(y, pan(drip(r) * 0.25, r.uniform(-0.8, 0.8)), r.uniform(0, dur - 0.2), r.uniform(0.2, 0.6))
    return y * level


def engine(dur, r, f0=38, f1=60):
    n = ns(dur); t = np.arange(n) / SR
    f = f0 + (f1 - f0) * t / max(dur, 1e-3) + 3 * smooth_noise(n, r, 4)
    ph = np.cumsum(f) / SR
    y = np.sign(np.sin(2 * np.pi * ph)) * 0.4 + 0.5 * np.sin(4 * np.pi * ph) + 0.4 * lp(r.standard_normal(n), 300)
    return fades(lp(y, 900), 0.15, 0.25)


def screech(r, dur=0.7):
    n = ns(dur); t = np.arange(n) / SR
    f = 1900 - 500 * t / dur + 60 * np.sin(2 * np.pi * 31 * t)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * (0.6 + 0.4 * smooth_noise(n, r, 40)) + 0.5 * bp(r.standard_normal(n), 1500, 4500)
    return fades(y, 0.01, 0.15)


def record_scratch(r, dur=0.45):
    n = ns(dur); t = np.arange(n) / SR
    f = 900 * np.exp(-t / 0.12) + 120
    return fades(bp(r.standard_normal(n), 200, 3000) * 0.6 + np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.5, 0.005, 0.1)


def cork(r):
    """a champagne cork: a sharp pop + a little fizz"""
    t = tt(0.5)
    pop = np.sin(2 * np.pi * np.cumsum(900 * np.exp(-t / 0.01) + 300) / SR) * np.exp(-t / 0.012)
    fizz = hp(r.standard_normal(len(t)), 4000) * np.clip(t / 0.03, 0, 1) * np.exp(-t / 0.18) * 0.25
    return fades(pop + 0.6 * hp(r.standard_normal(len(t)), 1500) * np.exp(-t / 0.006) + fizz, 0.0005, 0.05)


def party_life(S, a, b, r):
    """a lively party over the chatter: scattered cheers and whoops (men and women), excited 'oh!'s, glasses, corks"""
    t = a + r.uniform(0.2, 0.6)
    while t < b - 0.4:
        k = r.uniform()
        if k < 0.45:
            woman = r.uniform() < 0.5
            y = G.hurrah(r, r.uniform(190, 250) if woman else r.uniform(110, 160), r.uniform(1.12, 1.2) if woman else r.uniform(0.95, 1.08))
        elif k < 0.75:
            y = G.whoa(r, r.uniform(120, 220))
        else:
            y = G.oof(r, "oh", r.uniform(150, 240), r.uniform(1.0, 1.18))
        place(S, pan(lp(y, 3200, 1), r.uniform(-0.85, 0.85)), t, r.uniform(0.07, 0.15))
        t += r.uniform(0.6, 1.6)
    t = a + 0.15
    while t < b - 0.2:
        place(S, pan(G.clink(r, r.uniform(2400, 4800), 0.09, 0.9), r.uniform(-0.8, 0.8)), t, r.uniform(0.08, 0.16)); t += r.uniform(0.18, 0.5)
    for k in range(max(1, int((b - a) / 3.5))):
        place(S, pan(cork(r), r.uniform(-0.6, 0.6)), a + r.uniform(0.3, max(0.4, b - a - 0.6)), 0.3)




CROWD = None
def S2(x):
    return x if np.ndim(x) == 2 else st(x)


def bell(r, f=196.0, dur=3.5):
    """a church bell toll: inharmonic partials, a slow decay"""
    t = tt(dur)
    y = sum(a * np.sin(2 * np.pi * f * m * t) * np.exp(-t / (dur * d)) for m, a, d in ((0.5, 0.5, 0.6), (1.0, 1.0, 0.45), (1.19, 0.6, 0.35), (1.5, 0.4, 0.3), (2.0, 0.5, 0.25), (2.74, 0.25, 0.15)))
    return fades(y, 0.002, 0.4)


def rustle(r, dur=0.4):
    """a newspaper page turned"""
    n = ns(dur); t = np.arange(n) / SR
    return fades(bp(r.standard_normal(n), 1200, 7000) * (0.4 + 0.6 * np.abs(np.sin(2 * np.pi * 7 * t))) * np.exp(-t / (dur * 0.6)), 0.01, 0.08)


def ding(r, f=1760.0):
    t = tt(0.8)
    return fades(np.sin(2 * np.pi * f * t) * np.exp(-t / 0.25) + 0.3 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t / 0.1), 0.001, 0.1)


def heartbeat(S, a, b, r, gain=0.3, bpm=62):
    t = a
    while t < b:
        place(S, st(thump(r, 50, 0.18)), t, gain); place(S, st(thump(r, 45, 0.15)), t + 0.22, gain * 0.7); t += 60 / bpm


def build_sfx():
    global CROWD
    CROWD = buf()
    r = rng(1886)
    S = buf()
    # ---- ambiences ----
    for a, b in DRAWING:
        t = a + 0.2
        while t < b: place(S, pan(tok(r, 2200, 0.5), -0.4), t, 0.025); t += 1.0     # the drawing-room clock
    for a, b in COURT:
        place(CROWD, S2(murmur(b - a, r, 3)), a, 0.3)
        place(S, pan(rustle(r), -0.2), a + 0.2, 0.2); place(S, pan(rustle(r), 0.1), W["thought"], 0.15)
    for a, b in SICK: place(S, S2(G.breeze(b - a, r, 0.25, bright=500)), a, 0.03)
    for a, b in DARK: place(S, S2(hum(b - a, r)), a, 0.03)
    for a, b in CARDROOM: place(CROWD, S2(murmur(b - a, r, 4)), a, 0.4)
    place(CROWD, S2(murmur(cf(10) - cf(9), r, 3)), cf(9), 0.35)
    cue(0.0, "ambience: drawing-room clock; court murmur + newspaper rustles; sickroom wind; a low hum in the dark")
    # ---- 1: the funeral bell, softly; it lands on "curtains" ----
    place(S, st(bell(r, 147.0, 4.0)), 0.15, 0.12)
    place(S, st(bell(r, 147.0, 4.0)), W["curtains"] - 0.03, 0.22)
    cue(W["curtains"], "funeral bell")
    # ---- 2: three dings as each colleague dreams of the vacancy ----
    for k in range(3): place(S, pan(ding(r, (1568.0, 1760.0, 2093.0)[k]), (-0.4, 0.0, 0.4)[k]), W["job"] - 0.1 + 0.1 * k, 0.16)
    # ---- 4: stamp, chime, sofa thump ----
    place(S, st(thump(r, 90, 0.15)), W["career"], 0.3); place(S, pan(tok(r, 1300, 1.0), -0.2), W["career"] + 0.01, 0.15)
    place(S, pan(ding(r, 2349.0), 0.3), W["wife"] - 0.02, 0.12); place(S, pan(ding(r, 2793.0), 0.3), W["wife"] + 0.1, 0.1)
    place(S, st(thump(r, 65, 0.3)), W["furniture"] + 0.02, 0.4)
    # ---- 6: the envelope, the bolts of cloth thumping down, footsteps ----
    place(S, pan(G.whoosh(0.25, r, 0.2, 900, 4500), 0.2), W["promotion"] - 0.1, 0.15)
    for k in range(4): place(S, pan(thump(r, 110, 0.1), 0.3), W["decorate"] + k / 6, 0.15)
    steps(S, W["grand"], W["grand"] + 0.9, r, 3.4, 0.08)
    # ---- 7: the ladder: creaks up, a wobble, the bonk ----
    for k, w in enumerate(("climbed", "ladder")): place(S, pan(G.creak(0.35, r, 90, 140), 0.3), W[w], 0.12)
    place(S, pan(G.creak(0.5, r, 160, 60), 0.3), W["slipped"] - 0.05, 0.18)
    place(S, pan(G.whoosh(0.2, r, 0.3, 600, 3000), 0.3), W["slipped"], 0.12)
    place(S, pan(bloop(r, 900, 600, 0.12), 0.25), W["knob"] - 0.02, 0.3); place(S, st(thump(r, 120, 0.12)), W["knob"] - 0.02, 0.35)
    sparkle(S, W["knob"] + 0.1, r, (91, 88, 84, 79), 4, 0.15, 0.09)
    place(S, pan(G.oof(r, "oof", 140, 1.0), 0.3), W["knob"] + 0.08, 0.18)
    cue(W["knob"], "BONK on the brass knob + dizzy sparkle + an 'oof'")
    # ---- 8: a tiny boing on "bruise"; a sour wobble on "taste" ----
    place(S, S2(boing(r, 520, 0.35, 16)), W["bruise"], 0.07)
    place(S, pan(bloop(r, 220, 140, 0.35), 0.0), W["taste"], 0.15)
    # ---- 9: the doctors' murmur; the record scratch on "dying" ----
    place(CROWD, S2(G.babble(W["dying"] - cf(8), r, 120, 1.0)), cf(8) + 0.1, 0.25)
    place(S, S2(record_scratch(r)), W["dying"] - 0.08, 0.3)
    cue(W["dying"], "record scratch: everybody freezes")
    # ---- 10: party chatter + a forced laugh on "lie" ----
    steps(S, cf(9), cf(10) - 0.2, r, 4.0, 0.06)
    place(S, pan(G.oof(r, "oh", 260, 1.2), 0.3), W["lie"] - 0.05, 0.12); place(S, pan(G.oof(r, "oh", 300, 1.1), 0.35), W["lie"] + 0.12, 0.1)
    # ---- 11: the night candle crackling ----
    t = cf(10) + 0.2
    while t < cf(11) - 0.2: place(S, pan(G.clink(r, r.uniform(5000, 7000), 0.02, 0.4), 0.4), t, 0.03); t += r.uniform(0.3, 0.9)
    # ---- 12: the scream: no voice, a long distorted roar of wind down the sack, then silence ----
    place(S, S2(G.whoosh(2.2, r, 0.45, 150, 1800, tail=0.6)), W["screamed"] - 0.3, 0.3)
    place(S, st(lp(r.standard_normal(ns(1.6)), 400) * np.exp(-tt(1.6) / 0.6)), W["screamed"], 0.25)
    cue(W["screamed"], "a muffled roar down the dark tube (no scream sample)")
    # ---- 13: a slow heartbeat ----
    heartbeat(S, cf(12) + 0.2, cf(13) - 0.3, r, 0.18)
    # ---- 15: cards shuffled and dealt, a table tap, chatter ----
    t = W["back"] - 0.6
    for k in range(6): place(S, pan(bp(r.standard_normal(ns(0.07)), 2000, 8000) * np.exp(-tt(0.07) / 0.02), 0.2), t + k * 0.12, 0.12)
    place(S, st(thump(r, 140, 0.08)), W["cards"] - 0.02, 0.2)
    place(S, S2(G.hurrah(r, 140, 1.0)), W["cards"] + 0.05, 0.08)
    # ---- whooshes on the place cuts ----
    for tx in (cf(1), cf(2), cf(8), cf(11), cf(12), cf(13), cf(14)):
        place(S, widen(G.whoosh(0.45, r, 0.25, 400, 3500), r), tx - 0.2, 0.08)
    return S

# ================================================================ score
CH = {"C": [36, 60, 64, 67], "G": [43, 59, 62, 67], "F": [41, 60, 65, 69], "Dm": [38, 62, 65, 69], "G7": [43, 59, 65, 67]}
PROG = ["C", "C", "G", "G", "F", "F", "C", "C", "Dm", "Dm", "C", "C", "G7", "G7", "G7", "C"]
MEL = [67, 0, 0, 72, 71, 72, 76, 0, 74, 72, 0, 0, 69, 0, 0, 72, 71, 69, 67, 0, 65, 64, 0, 0,
       65, 0, 0, 69, 67, 65, 64, 0, 67, 72, 0, 0, 74, 0, 72, 71, 0, 69, 67, 0, 71, 72, 0, 0]


def waltz(M, t0, t1, r, gain=1.0, bpm=138, sour=0.0, lead="box"):
    """a polite salon waltz: plucked bass on 1, chords on 2 and 3, a music-box tune; sour > 0 detunes it (semitones)"""
    q = 60 / bpm
    t, k = t0, 0
    while t < t1 - 0.05:
        bar = (k // 3) % 16; j = k % 3
        ch = CH[PROG[bar]]
        u = (t - t0) / max(0.1, t1 - t0)
        dt = lambda: sour * u * r.uniform(-1, 1)
        if j == 0: place(M, pan(I.pluck(I.m2f(ch[0] + dt()), 0.8, r, 0.9, 0.35), -0.15), t, gain * 0.3)
        else:
            for m in ch[1:]: place(M, pan(I.pluck(I.m2f(m + dt()), 0.5, r, 0.35, 0.6), 0.2), t, gain * 0.07)
        m = MEL[k % 48]
        if m:
            f = I.m2f(m + dt())
            x = I.musicbox(f, 0.6, r, 1.0) if lead == "box" else I.vibes(f, 0.6, r, 1.2)
            place(M, pan(x, 0.1), t, gain * 0.16)
        t += q; k += 1


def build_music():
    r = rng(1886)
    M = buf()
    place(M, I.pad([I.m2f(m) for m in (38, 45, 50, 53)], cf(1) - 0.1, 0.4, r, 0.5, 0.6, 500), 0.05, 0.12)
    cue(0.05, "music: a low D-minor pad under the funeral")
    waltz(M, cf(1) + 0.05, cf(4) - 0.05, r, 0.85); cue(cf(1), "music: a stiff, polite salon waltz")
    waltz(M, cf(4) + 0.05, W["terrible"] + 0.6, r, 0.7, bpm=120, sour=0.7); cue(W["terrible"], "music: the waltz drifts out of tune")
    waltz(M, cf(5) + 0.05, W["knob"] - 0.05, r, 0.8, bpm=150)
    place(M, pan(I.brass(I.m2f(55), 1.0, 0.6, r, "horn", fall=-600), 0.1), W["knob"] + 0.05, 0.3)
    cue(W["knob"], "music: a sour trombone droop after the bonk")
    place(M, I.pad([I.m2f(m) for m in (36, 43, 48)], cf(11) - cf(7) + 0.2, 0.4, r, 1.0, 1.0, 400), cf(7), 0.14)
    for m, a, b in ((48, cf(7), cf(9)), (46, cf(9), cf(10)), (43, cf(10), cf(11))):
        place(M, pan(I.brass(I.m2f(m - 12), b - a, 0.4, r, "tuba"), -0.1), a + 0.1, 0.06)
    cue(cf(7), "music: a low cello-like drone under the illness")
    cue(cf(11) - 0.3, "music: silence through the dark")
    place(M, I.pad([I.m2f(m) for m in (48, 55, 60, 64)], cf(13) - cf(12), 0.4, r, 1.2, 0.8, 900), cf(12) + 0.2, 0.12)
    place(M, I.pad([I.m2f(m) for m in (48, 55, 60, 64, 67, 72)], cf(14) - W["fear"] + 0.4, 0.5, r, 1.6, 0.6, 1600), W["fear"], 0.16)
    for k, m in enumerate((72, 76, 79, 84)): place(M, pan(I.glock(I.m2f(m), 0.6, r, 2.0), 0.0), W["light"] + 0.12 * k, 0.12)
    cue(W["light"], "music: a warm major chord swells into 'light'")
    waltz(M, cf(14) + 0.3, DUR - 0.05, r, 0.75, bpm=150, lead="vibes"); cue(cf(14), "music: the salon waltz, cheerful and oblivious (loop)")
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
    lab = np.clip(sum(env_seg(a, b, 0.2, 0.3) for a, b in COTTAGE), 0, 1)
    hall = np.clip(sum(env_seg(a, b, 0.2, 0.3) for a, b in PLAZA), 0, 1)
    out = np.clip(1 - lab - hall, 0, 1)
    small, big, air = make_ir(0.5, 3), make_ir(1.4, 4), make_ir(0.35, 5)

    def wet(x, k):
        return x + k * (convolve_st(x * lab, small)[:, :N] + convolve_st(x * hall, big)[:, :N] + 0.5 * convolve_st(x * out, air)[:, :N])
    S, M = wet(S, 0.2), wet(M, 0.18)
    # levels: voice at -16 LUFS; music bed ~ -27 under it (ducked a further 11 dB on words); SFX events ~ -24
    V = V * dbg(-16 - integrated(V))
    M = M * dbg(-27 - integrated(M)) * duck_curve(words)
    S = S * dbg(-24 - integrated(S)) * duck_curve(words, -7.0, pre=-0.05, post=0.03, smooth=0.05)
    # the party crowd: a low bed ~17 dB under the voice while it plays, dipped a further 8 dB under every word
    C = wet(CROWD, 0.18)
    C = C * dbg(-33 - integrated(C)) * duck_curve(words, -8.0)
    mix = V + M + S + C
    for _ in range(3):
        mix *= dbg(-14.0 - integrated(mix))
        mix = 0.84 * np.tanh(mix / 0.84)
    tp = true_peak(mix)
    if tp > -1.0:
        mix *= dbg(-1.0 - tp)
    for name, x in [("voice", V), ("music", M), ("sfx", S), ("crowd", C), ("mix", mix)]:
        write_wav(os.path.join(ROOT, "audio", "stems" if name != "mix" else "", f"{name}.wav"), x)
    with open(os.path.join(ROOT, "audio", "cues.md"), "w") as f:
        f.write("# Sound cues (s)\n\n" + "\n".join(f"- {t:6.2f}  {w}" for t, w in sorted(cues)) + "\n")
    print(f"mix: {DUR:.3f} s, integrated {integrated(mix):.1f} LUFS, true peak {true_peak(mix):.1f} dBTP, {len(cues)} cues")


if __name__ == "__main__":
    main()
