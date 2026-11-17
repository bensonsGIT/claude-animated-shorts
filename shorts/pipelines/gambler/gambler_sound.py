# Sound for "Granny Bet the Whole Fortune on Zero" (The Gambler, Dostoyevsky, 1866): synthesized SFX + an original score:
# a lilting spa-band waltz in 3/4 on the hotel verandah, a quicker casino waltz with roulette whirrs, ball clatter and coin
# avalanches, a deflating trombone when Granny loses, a snare roll into a cymbal crash on "bank", champagne in Paris, the
# waltz in a minor key for the deaths and the debtors' prison (with a silent beat before the stroke), a ticking pizzicato
# for the dictation, wedding bells, and the opening waltz again, softly, for the loop.
# Usage: ~/tts/chatterbox/bin/python gambler_sound.py  ->  ~/gambler-short/audio/mix.wav, stems/*.wav, cues.md
import os, sys, json, wave
import numpy as np
from scipy import signal

AUDIO_LIB = os.path.expanduser("~/claude-animated-shorts/shorts/audio")
sys.path.insert(0, AUDIO_LIB)
from dsp import (SR, ns, tt, rng, lp, hp, bp, peq, shelf, smooth_noise, fades, pan, st, place, widen, make_ir, convolve_st,
                 integrated, true_peak, dbg, read_wav)
import instruments as I
import sfx_gen as G

ROOT = os.path.expanduser("~/gambler-short")
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
SPA = [(0.0, cf(3)), (cf(15), DUR)]
CASINO = [(cf(3), cf(9))]
PARIS = [(cf(9), cf(12)), (cw("then5"), cf(13))]
CELL = [(cf(12), cw("then5"))]
STUDYT = [(cf(13), cf(15))]
COTTAGE = CELL + STUDYT   # small rooms (reverb)
PLAZA = CASINO            # the gaming salon (reverb)
INSIDE = COTTAGE + PLAZA + PARIS
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


def whirr(S, a, b, r, gain=0.1):
    """the roulette wheel spinning + the ivory ball rolling round the track"""
    if b - a < 0.1: return
    place(S, pan(fades(lp(G.rattle(b - a, r, 22.0), 2500), 0.15, 0.3), -0.1), a, gain)
    place(S, pan(fades(bp(r.standard_normal(ns(b - a)), 300, 1500) * 0.4, 0.2, 0.3), 0.0), a, gain * 0.5)


def ball_drop(S, t, r, gain=0.3):
    """the ball clattering over the frets into a pocket"""
    for k, dt in enumerate((0.0, 0.07, 0.13, 0.2, 0.24)):
        place(S, pan(G.clink(r, r.uniform(2400, 3600), 0.06, 1.0), 0.05), t - 0.24 + dt, gain * (0.5 + 0.12 * k))
    place(S, pan(tok(r, 1700, 1.0), 0.05), t, gain)


def avalanche(S, t, r, dur=1.2, gain=0.35):
    """a heap of gold coins raked across the felt"""
    tt0 = t
    while tt0 < t + dur:
        place(S, pan(G.clink(r, r.uniform(2500, 5200), 0.1, 1.0), r.uniform(-0.6, 0.6)), tt0, gain * r.uniform(0.3, 1.0)); tt0 += r.exponential(0.018)
    jingle(S, t, r, dur, gain)


def bell(r, f=196.0, dur=3.5):
    """a church bell toll: inharmonic partials, a slow decay"""
    t = tt(dur)
    y = sum(a * np.sin(2 * np.pi * f * m * t) * np.exp(-t / (dur * d)) for m, a, d in ((0.5, 0.5, 0.6), (1.0, 1.0, 0.45), (1.19, 0.6, 0.35), (1.5, 0.4, 0.3), (2.0, 0.5, 0.25), (2.74, 0.25, 0.15)))
    return fades(y, 0.002, 0.4)


def clang(r):
    """an iron cell door slammed"""
    t = tt(1.4)
    y = sum(np.sin(2 * np.pi * f * t) * np.exp(-t / d) for f, d in ((180, 0.5), (412, 0.3), (733, 0.2), (1190, 0.12)))
    y += 1.5 * lp(r.standard_normal(len(t)), 900) * np.exp(-t / 0.03)
    return fades(y, 0.001, 0.3)


def scratch(r, dur=0.25):
    """a quill on paper"""
    n = ns(dur); t = np.arange(n) / SR
    return fades(bp(r.standard_normal(n), 2500, 8000) * (0.5 + 0.5 * np.sin(2 * np.pi * 18 * t)) ** 2, 0.01, 0.05)


def flutter(S, a, dur, r, gain=0.08):
    """banknotes fluttering"""
    t = a
    while t < a + dur:
        place(S, pan(fades(bp(r.standard_normal(ns(0.09)), 1500, 6000) * np.exp(-tt(0.09) / 0.03), 0.005, 0.03), r.uniform(-0.7, 0.7)), t, gain * r.uniform(0.4, 1.0)); t += r.exponential(0.05)


def build_sfx():
    global CROWD
    CROWD = buf()
    r = rng(1866)
    S = buf()
    # ---- ambiences ----
    for a, b in SPA:
        place(S, S2(G.bird_chirps(b - a, r, 0.4)), a, 0.05); place(S, S2(G.breeze(b - a, r, 0.3, bright=1200)), a, 0.03)
    for a, b in CASINO:
        place(CROWD, S2(murmur(b - a, r, 14)), a, 1.0)
        t = a + 0.3
        while t < b - 0.2: place(S, pan(G.clink(r, r.uniform(2600, 4200), 0.08, 0.8), r.uniform(-0.8, 0.8)), t, 0.04); t += r.uniform(0.4, 1.2)
    for a, b in PARIS: place(CROWD, S2(murmur(b - a, r, 4)), a, 0.25)
    for a, b in CELL:
        t = a + 0.2
        while t < b: place(S, pan(drip(r), 0.3), t, 0.12); t += 0.9
    place(S, S2(hum(cf(15) - cf(13), r)), cf(13), 0.015)
    cue(0.0, "spa: birds + breeze; casino: crowd murmur + chip clinks; Paris: a little chatter; cell: drips")
    # ---- 1: the General's pocket watch ticking; a sting on "die" ----
    t = 0.3
    while t < W["die"] - 0.1: place(S, pan(tok(r, 2400, 0.6), -0.3), t, 0.05); t += 0.5
    # ---- 2: pockets out, the money bubble ----
    place(S, pan(G.whoosh(0.25, r, 0.2, 800, 4000), -0.2), W["broke"] - 0.05, 0.15); place(S, pan(bloop(r, 400, 150, 0.2), -0.2), W["broke"] + 0.1, 0.15)
    jingle(S, W["fortune"] - 0.02, r, 0.8, 0.22)
    # ---- 3: Granny carried up the steps ----
    steps(S, cf(2) + 0.1, W["armchair"], r, 3.6, 0.12)
    place(S, pan(G.creak(0.6, r, 60, 90), 0.0), W["arrived"], 0.08)
    place(S, st(thump(r, 60, 0.3)), W["alive"] - 0.02, 0.4); place(S, pan(G.oof(r, "oh", 150, 1.0), -0.3), W["alive"] + 0.08, 0.2)
    place(S, pan(G.oof(r, "oh", 210, 1.15), 0.3), W["alive"] + 0.12, 0.16)
    cue(W["alive"], "a thump + gasps: Granny is alive")
    # ---- 4-6: the wheel ----
    whirr(S, cf(3), cf(4), r, 0.12); whirr(S, cf(4), cf(5), r, 0.06)
    place(S, pan(G.clink(r, 3000, 0.1, 1.0), 0.1), W["bet"] + 0.1, 0.2); place(S, pan(G.clink(r, 3400, 0.1, 1.0), 0.1), W["bet"] + 0.18, 0.15)
    whirr(S, cf(5), W["hit2"] + 0.1, r, 0.12)
    for k in ("hit", "hit2"): ball_drop(S, W[k], r, 0.35)
    place(S, S2(G.hurrah(r, 180, 1.0)), W["again"] - 0.05, 0.12)
    avalanche(S, W["again"], r, 1.0, 0.35)
    cue(W["hit"], "ball clatters into zero (twice); a coin avalanche on 'again'")
    # ---- 7: the last coins raked away, one rolls off ----
    place(S, pan(G.whoosh(0.5, r, 0.2, 300, 1500), 0.1), cf(6) + 0.6, 0.1)
    t0 = W["roubles"] + 0.05
    for k in range(5): place(S, pan(G.clink(r, 3200 - 200 * k, 0.07, 0.8), 0.0), t0 + 0.06 * k * (1 + 0.3 * k), 0.15 * (1 - 0.15 * k))
    cue(W["roubles"], "a single coin rolls off and spins down")
    # ---- 8-9: red, red, red; the bank breaks ----
    place(S, pan(G.clink(r, 3000, 0.1, 1.0), 0.2), W["and3"] + 0.15, 0.2)
    whirr(S, cw("red") - 0.2, W["again3"] + 0.1, r, 0.12)
    for k in ("again2", "again3"): ball_drop(S, W[k], r, 0.3)
    ball_drop(S, W["red"] + 0.35, r, 0.3)
    avalanche(S, W["bank"] - 0.02, r, 1.6, 0.45); flutter(S, W["bank"], 2.0, r, 0.1)
    place(S, S2(G.hurrah(r, 160, 1.0)), W["bank"] + 0.05, 0.25); place(S, S2(G.applause(2.0, r, 20)), W["francs"] - 0.1, 0.12)
    cue(W["bank"], "coin avalanche + fluttering notes + the crowd cheers")
    # ---- 10: Paris: champagne, hat boxes, the money runs out ----
    for tk in (cf(9) + 0.3, W["paris"] + 0.1): place(S, S2(cork(r)), tk, 0.25)
    flutter(S, cf(9) + 0.1, W["gone"] - cf(9) - 0.2, r, 0.06)
    for k in range(4): place(S, pan(thump(r, 120, 0.1), -0.4), cf(9) + 0.6 + k * (W["gone"] - cf(9) - 0.6) / 4, 0.15)
    place(S, pan(bloop(r, 300, 90, 0.4), 0.2), W["gone"] + 0.02, 0.25)
    cue(W["gone"], "champagne corks; hat boxes thump down; a deflating bloop on 'gone'")
    # ---- 11: a bell tolls; the inheritance jingles ----
    place(S, st(bell(r, 147.0)), W["died"] - 0.02, 0.2)
    jingle(S, W["inheritance"] - 0.02, r, 1.0, 0.3)
    # ---- 12: the stroke (thud + stars), Blanche keeps the sacks ----
    place(S, st(thump(r, 55, 0.4)), W["stroke"] + 0.35, 0.45); place(S, S2(boing(r, 260, 0.6, 10)), W["stroke"] + 0.05, 0.12)
    sparkle(S, W["stroke"] + 0.45, r, (91, 88, 84, 79), 4, 0.18, 0.09)
    jingle(S, W["kept"] - 0.02, r, 0.8, 0.25)
    cue(W["stroke"], "a cartoon thud + dizzy stars (no gore)")
    # ---- 13: the cell door; a glass on a tray ----
    place(S, st(clang(r)), W["prison"] - 0.03, 0.35)
    place(S, pan(G.clink(r, 4200, 0.15, 1.0), 0.3), W["footman"] + 0.05, 0.2); place(S, pan(G.clink(r, 5100, 0.12, 1.0), 0.3), W["footman"] + 0.12, 0.12)
    # ---- 14: the dictation: a clock racing through 26 days, the quill scratching ----
    t, step = cf(13) + 0.2, 0.45
    while t < W["deadline"] - 0.1: place(S, pan(tok(r, 1500, 0.9), -0.3), t, 0.08); t += step; step = max(0.1, step * 0.9)
    t = cf(13) + 0.4
    while t < W["deadline"] - 0.2: place(S, pan(scratch(r), 0.3), t, 0.08); t += 0.45
    place(S, st(thump(r, 80, 0.2)), W["deadline"] + 0.02, 0.3)
    cue(cf(13), "a clock ticking faster and faster; quill scratching; a page slapped down on 'deadline'")
    # ---- 15: wedding bells ----
    for k in range(4): place(S, st(bell(r, (392.0, 330.0, 294.0, 262.0)[k], 2.2)), W["stenographer"] - 0.02 + 0.32 * k, 0.1)
    # ---- 16: ten gold coins clink into his hand; the wheel's whirr comes back for the loop ----
    for k in range(6): place(S, pan(G.clink(r, r.uniform(3200, 4400), 0.1, 1.0), 0.1), W["coins"] - 0.25 + 0.07 * k, 0.15)
    whirr(S, W["waiting2"] - 0.3, DUR, r, 0.07)
    # ---- whooshes on the place cuts ----
    for tx in (cf(3), cf(9), cf(10), cf(12), cw("then5"), cf(13), cf(15)):
        place(S, widen(G.whoosh(0.45, r, 0.25, 400, 3500), r), tx - 0.2, 0.1)
    return S

# ================================================================ score
CH = {"C": [36, 60, 64, 67], "G": [43, 59, 62, 67], "F": [41, 60, 65, 69], "Dm": [38, 62, 65, 69], "G7": [43, 59, 65, 67], "Am": [45, 60, 64, 69], "E": [40, 59, 64, 68]}
PROG = ["C", "C", "G", "G", "F", "F", "C", "C", "Dm", "Dm", "C", "C", "G7", "G7", "G7", "C"]
MEL = [67, 0, 0, 72, 71, 72, 76, 0, 74, 72, 0, 0, 69, 0, 0, 72, 71, 69, 67, 0, 65, 64, 0, 0,
       65, 0, 0, 69, 67, 65, 64, 0, 67, 72, 0, 0, 74, 0, 72, 71, 0, 69, 67, 0, 71, 72, 0, 0]
MINOR = {4: -1, 9: -1, 11: -1}   # C major -> C minor (E, A, B flattened)


def waltz(M, t0, t1, r, gain=1.0, bpm=160, minor=False, tune=True, lead="vibes"):
    """a spa-band waltz: a plucked bass on 1, string chords on 2 and 3, a lead tune"""
    q = 60 / bpm
    t, k = t0, 0
    while t < t1 - 0.05:
        bar = (k // 3) % 16; j = k % 3
        ch = CH[PROG[bar]]
        fix = (lambda m: m + MINOR.get(m % 12, 0)) if minor else (lambda m: m)
        if j == 0: place(M, pan(I.pluck(I.m2f(fix(ch[0])), 0.8, r, 0.9, 0.35), -0.15), t, gain * 0.3)
        else:
            for m in ch[1:]: place(M, pan(I.pluck(I.m2f(fix(m)), 0.5, r, 0.35, 0.6), 0.2), t, gain * 0.07)
        m = MEL[k % 48]
        if tune and m:
            f = I.m2f(fix(m))
            x = I.vibes(f, 0.6, r, 1.2) if lead == "vibes" else I.musicbox(f, 0.6, r, 1.0) if lead == "box" else I.brass(f, q * 1.6, 0.6, r, "horn")
            place(M, pan(x, 0.1), t, gain * (0.16 if lead != "horn" else 0.1))
        t += q; k += 1


def slide(M, t, r, gain=1.0):
    """a deflating trombone slide down"""
    place(M, pan(I.brass(I.m2f(55), 1.1, 0.6, r, "horn", fall=-700), 0.1), t, gain * 0.35)


def fanfare(M, t, r, gain=1.0, root=60):
    for k, m in enumerate((root, root + 4, root + 7, root + 12)): place(M, pan(I.brass(I.m2f(m), 0.16 if k < 3 else 0.7, 0.8, r, "horn"), 0.1), t + 0.1 * k, gain * 0.25)
    place(M, pan(I.cymbal(0.5, r, 1.4), 0.0), t + 0.3, gain * 0.15)


def pizz(M, t0, t1, r, gain=1.0):
    """a ticking pizzicato for the dictation"""
    e = 60 / 150 / 2
    t, k = t0, 0
    notes = [60, 0, 64, 0, 67, 64, 0, 62, 65, 0, 69, 0, 67, 0, 0, 0]
    while t < t1 - 0.05:
        if k % 2 == 0: place(M, pan(I.pluck(I.m2f(48 if (k // 8) % 2 == 0 else 43), 0.6, r, 0.7, 0.4), -0.2), t, gain * 0.22)
        m = notes[k % 16]
        if m: place(M, pan(I.pluck(I.m2f(m + 12), 0.5, r, 0.5, 0.7), 0.25), t, gain * 0.14)
        t += e; k += 1


def build_music():
    r = rng(1866)
    M = buf()
    waltz(M, 0.05, W["die"] - 0.05, r, 0.85); cue(0.05, "music: a lilting spa-band waltz")
    place(M, pan(I.glock(I.m2f(79), 0.7, r, 1.0), 0.0), W["die"] - 0.02, 0.2); place(M, pan(I.glock(I.m2f(74), 0.7, r, 1.0), 0.0), W["die"] + 0.15, 0.2)
    waltz(M, W["die"] + 0.4, W["alive"] - 0.05, r, 0.7)
    place(M, pan(I.cymbal(0.8, r, 1.8), 0.0), W["alive"] - 0.02, 0.25); place(M, pan(I.timpani(I.m2f(36), 0.9, r, 1.4), 0.0), W["alive"] - 0.02, 0.4)
    for m in (48, 55, 60, 64): place(M, pan(I.brass(I.m2f(m), 0.5, 0.9, r, "stab"), 0.0), W["alive"] - 0.02, 0.08)
    cue(W["alive"], "music: an orchestra hit on 'alive'")
    waltz(M, W["alive"] + 0.5, cf(6) - 0.05, r, 0.75, bpm=180, lead="horn"); cue(cf(3), "music: the casino waltz, quicker")
    for k in ("hit", "hit2"): place(M, pan(I.glock(I.m2f(84), 0.8, r, 1.2), 0.0), W[k], 0.25)
    fanfare(M, W["again"] - 0.04, r, 0.9); cue(W["again"], "music: fanfare on 'again!'")
    place(M, I.pad([I.m2f(m) for m in (48, 55, 63)], cf(7) - cf(6), 0.4, r, 0.4, 0.5, 600), cf(6), 0.08)
    slide(M, W["roubles"] - 0.05, r, 1.0); cue(W["roubles"], "music: deflating trombone slide")
    waltz(M, cf(7) + 0.1, W["bank"] - 0.6, r, 0.8, bpm=190, lead="horn")
    for ts, v in I.snare_roll(W["bank"] - 0.9, W["bank"] - 0.03, 0.15, 0.85, r): place(M, pan(I.snare(v, r, 0.12, 1.0, 1.0, True), 0.1), ts, 0.12)
    place(M, pan(I.cymbal(1.0, r, 2.4), 0.0), W["bank"] - 0.02, 0.3); place(M, pan(I.timpani(I.m2f(36), 1.0, r, 1.6), 0.0), W["bank"] - 0.02, 0.4)
    fanfare(M, W["bank"] + 0.1, r, 1.0, 62); cue(W["bank"], "music: snare roll into a cymbal crash + fanfare")
    waltz(M, cf(9) + 0.1, W["gone"] - 0.1, r, 0.7, bpm=176, lead="box"); cue(cf(9), "music: a music-box waltz in Paris")
    slide(M, W["gone"] - 0.05, r, 0.8)
    waltz(M, cf(10) + 0.1, cf(11) - 0.3, r, 0.6, bpm=140, minor=True); cue(cf(10), "music: the waltz in a minor key")
    cue(cf(11) - 0.3, "music: a silent beat before 'Then he died of a stroke'")
    place(M, pan(I.timpani(I.m2f(31), 0.9, r, 1.8), 0.0), W["stroke"] + 0.35, 0.35)
    waltz(M, W["kept"] - 0.05, cf(13) - 0.05, r, 0.55, bpm=140, minor=True, lead="box")
    pizz(M, cf(13) + 0.1, W["deadline"] - 0.05, r, 0.9); cue(cf(13), "music: ticking pizzicato for the dictation")
    place(M, pan(I.brass(I.m2f(60), 0.4, 0.8, r, "stab"), 0.0), W["deadline"] - 0.02, 0.15)
    place(M, I.pad([I.m2f(m) for m in (60, 64, 67, 72)], cf(15) - W["stenographer"] + 0.3, 0.5, r, 0.2, 0.6), W["stenographer"] - 0.05, 0.12)
    for k, m in enumerate((84, 88, 91, 96)): place(M, pan(I.glock(I.m2f(m), 0.7, r, 1.4), 0.0), W["stenographer"] + 0.1 * k, 0.15)
    waltz(M, cf(15) + 0.05, DUR - 0.05, r, 0.6); cue(cf(15), "music: the opening waltz returns softly (loop)")
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
