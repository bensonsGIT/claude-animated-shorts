# Sound for "He Killed to Prove He Was a Genius" (Crime and Punishment): synthesized SFX + an original minor-key
# waltz score (pizzicato bass, plucked chords, vibes tune), a dissonant sting on the axe, a creeping tick-tock for the
# fever and Porfiry, silence on "free", a warm choir pad for Sonya, church bells at the Haymarket, the waltz slowed and
# warm in the Siberian snow. Ducked under the voice. Events sit on the picture's word times (~/crime-short/timing.json).
# Usage: ~/tts/chatterbox/bin/python crime_sound.py  ->  ~/crime-short/audio/mix.wav, stems/*.wav, cues.md
import os, sys, json, wave
import numpy as np
from scipy import signal

AUDIO_LIB = os.path.expanduser("~/claude-animated-shorts/shorts/audio")
sys.path.insert(0, AUDIO_LIB)
from dsp import (SR, ns, tt, rng, lp, hp, bp, peq, shelf, smooth_noise, fades, pan, st, place, widen, make_ir, convolve_st,
                 integrated, true_peak, dbg, read_wav)
import instruments as I
import sfx_gen as G

ROOT = os.path.expanduser("~/crime-short")
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
YARD = [(0.0, cf(1)), (cf(4), cw("visits")), (cf(6), cf(7))]
STREET = [(cf(1), cw("cupboard")), (cf(10), cf(11))]
HAYM = [(cf(13), cw("gets"))]
GARRET = [(cw("cupboard"), cf(4)), (cf(7), cf(8))]
PAWNS = [(cw("visits"), cf(6))]
OFFICES = [(cf(8), cf(10)), (cw("gets"), cw("siberia"))]
SONYAS = [(cf(11), cf(13))]
SIB = [(cw("siberia"), DUR)]
COTTAGE = GARRET + PAWNS + SONYAS   # small rooms (reverb)
PLAZA = OFFICES                     # the bigger office (reverb)
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


def heartbeat(S, a, b, r, rate=1.6, gain=0.4):
    t = a
    while t < b:
        place(S, st(thump(r, 55, 0.18)), t, gain); place(S, st(thump(r, 50, 0.16)), t + 0.22, gain * 0.7); t += 1 / rate


def build_sfx():
    global CROWD
    CROWD = buf()
    r = rng(1866)
    S = buf()
    # ---- ambiences ----
    for a, b in YARD + STREET:
        place(S, G.breeze(b - a, r, 0.4, bright=1200), a, 0.1); place(S, G.bird_chirps(b - a, r, 0.15, "sparrow"), a, 0.05)
    for a, b in STREET:
        place(S, G.water_bed(b - a, r, 0.4, 0.4), a, 0.1)
        place(CROWD, murmur(b - a, r, 10), a, 0.25)
        t = a + 0.2
        while t < b:  # a cart on the cobbles somewhere
            place(S, pan(tok(r, r.uniform(500, 700), 0.4), 0.5), t, 0.06); t += 0.27
    for a, b in GARRET:
        t = a
        while t < b:
            place(S, pan(tok(r, 2300, 0.5), -0.4), t, 0.06); t += 1.0
    for a, b in OFFICES:
        place(S, hum(b - a, r), a, 0.03)
    for a, b in SONYAS:
        place(S, rain_bed(b - a, r, 0.6, 2500), a, 0.08)
    for a, b in HAYM:
        place(CROWD, murmur(b - a, r, 16), a, 0.34)
    for a, b in SIB:
        place(S, G.breeze(b - a, r, 1.0, bright=700), a, 0.2)
        steps(S, a + 0.3, b - 0.3, r, 1.6, 0.06)
    cue(0.0, "breeze + sparrows in the yard; canal water + street chatter; clock tick in the garret; Siberian wind")
    # ---- 1: the stone, the purse, the coin ----
    place(S, pan(G.creak(0.5, r, 50, 80), 0.1), 0.25, 0.3)
    place(S, st(thump(r, 60, 0.3)), W["genius"] - 0.03, 0.6)
    for k in range(6): place(S, pan(G.clink(r, 2600 - 120 * k, 0.07, 0.9), 0.1 + 0.08 * k), W["kopek"] - 0.35 + 0.08 * k, 0.25 * (1 - 0.1 * k))
    place(S, pan(G.whoosh(0.25, r, 0.1, 800, 4000), 0.3), W["kopek"] + 0.2, 0.3); cue(W["kopek"], "a coin rolls out; snatched back")
    # ---- 3-4: the garret: a bonk, the Napoleon bubble ----
    place(S, st(thump(r, 140, 0.15)), W["dostoevsky"] - 0.03, 0.6); place(S, pan(boing(r, 260, 0.5, 11), 0.0), W["dostoevsky"] + 0.02, 0.35)
    place(S, pan(bloop(r, 640, 300, 0.14), 0.3), W["theory"] - 0.05, 0.35)
    place(S, pan(boing(r, 420, 0.4, 9), 0.3), W["step"] + 0.1, 0.3)
    # ---- 5-7: the lodge, the door, the chain; the cut ----
    place(S, pan(G.creak(0.6, r, 100, 170), -0.4), cf(4) + 0.3, 0.3)
    place(S, pan(hiss(r, 0.5, 1800), -0.3), W["axe"] - 0.05, 0.3); cue(W["axe"], "a soft scrape: the axe")
    jingle(S, W["old"] - 0.1, r, 0.35, 0.18); place(S, pan(G.creak(0.4, r, 160, 220), 0.0), W["old"] - 0.2, 0.25)
    place(S, pan(G.creak(0.45, r, 140, 200), 0.4), W["walks"] - 0.3, 0.25)
    place(S, st(lp(thump(r, 45, 0.4), 400)), W["too"] - 0.02, 0.5); place(S, pan(hiss(r, 0.35, 2500), -0.5), W["too"] + 0.15, 0.2)
    cue(W["too"], "a dull off-screen thud, the icon lamp snuffs out")
    # ---- 8: the stone again ----
    place(S, pan(G.creak(0.6, r, 45, 75), 0.1), W["stone"] - 0.6, 0.3); place(S, st(thump(r, 60, 0.3)), W["checks"] + 0.15, 0.45)
    # ---- 9: fever ----
    heartbeat(S, cf(7) + 0.1, cf(8) - 0.2, r, 1.7, 0.35); cue(cf(7), "heartbeat through the fever")
    # ---- 10-11: Porfiry, the cat and mouse, Mikolka ----
    place(S, pan(squeak_rise(r, 0.25), 0.3), W["mouse"] - 0.02, 0.25)
    place(S, pan(I.glock(I.m2f(91), 0.6, r, 0.8), 0.2), W["arrests"] - 0.02, 0.3)
    place(S, st(thump(r, 80, 0.25)), W["painter"] - 0.25, 0.5); place(S, pan(G.whoosh(0.4, r, 0.2, 400, 3000), 0.5), W["painter"] - 0.3, 0.3)
    place(S, st(thump(r, 100, 0.15)), W["confesses"] - 0.03, 0.45); cue(W["painter"], "door bangs, Mikolka drops to his knees")
    # ---- 12: free: one bird ----
    place(S, G.bird_chirps(1.6, r, 0.9, "sparrow"), W["free"] - 0.1, 0.25)
    # ---- 15: the Haymarket laughs ----
    t = W["does"] + 0.2
    while t < cw("gets") - 0.2:
        place(CROWD, pan(lp(G.whoa(r, r.uniform(120, 220)), 3200, 1), r.uniform(-0.8, 0.8)), t, 0.12); t += r.uniform(0.25, 0.6)
    # ---- 16: the stamp ----
    place(S, st(thump(r, 90, 0.3)), W["years"] - 0.03, 0.8); place(S, pan(G.clink(r, 1400, 0.15, 0.8), 0.0), W["years"], 0.3)
    # ---- 17-19: Siberia: chains, the louse pop ----
    jingle(S, cw("siberia") + 0.2, r, 0.9, 0.12)
    place(S, pan(bloop(r, 900, 400, 0.12), 0.2), W["louse"] - 0.03, 0.4)
    for tx in (cf(1), cf(4), cf(6), cf(8), cf(10), cf(11), cf(13)):
        place(S, widen(G.whoosh(0.45, r, 0.25, 400, 3500), r), tx - 0.2, 0.15)
    return S

# ================================================================ score (D minor waltz, 3/4, 150 bpm)
BEAT = 60 / 150
CH = {"Dm": [38, 62, 65, 69], "A7": [33, 61, 64, 67], "Gm": [43, 62, 67, 70], "Bb": [46, 62, 65, 70], "D": [38, 62, 66, 69], "G": [43, 62, 67, 71], "A": [45, 61, 64, 69]}
PROG = ["Dm", "Dm", "A7", "A7", "Gm", "Dm", "A7", "Dm"]
PROG_MAJ = ["D", "D", "A", "A", "G", "D", "A", "D"]
# an original waltz tune, one note per beat (0 = rest), 8 bars of 3
MEL = [69, 74, 77, 76, 0, 73, 69, 73, 76, 74, 0, 0, 70, 74, 79, 77, 74, 70, 69, 73, 76, 74, 0, 0]


def waltz(M, t0, t1, r, gain=1.0, major=False, tempo=1.0, tune=True):
    b = BEAT / tempo
    t, k = t0, 0
    while t < t1 - 0.05:
        bar = (k // 3) % 8
        ch = CH[(PROG_MAJ if major else PROG)[bar]]
        j = k % 3
        if j == 0: place(M, pan(I.pluck(I.m2f(ch[0]), 0.8, r, 0.6, 0.25), -0.2), t, gain * 0.85)
        else:
            for m in ch[1:]: place(M, pan(I.pluck(I.m2f(m), 0.5, r, 0.3, 0.45), 0.3), t, gain * 0.2)
        m = MEL[k % 24] + (1 if major and MEL[k % 24] % 12 == 5 else 0)
        if tune and m: place(M, pan(I.vibes(I.m2f(m), 0.5, r, 1.0), 0.2), t, gain * 0.42)
        t += b; k += 1


def ticktock(M, t0, t1, r, gain=1.0):
    t, k = t0, 0
    place(M, I.pad([I.m2f(m) for m in (38, 45, 50, 53)], t1 - t0, 0.4, r, 0.6, 0.4, 700, detune=12), t0, gain * 0.25)
    while t < t1 - 0.1:
        place(M, pan(I.pluck(I.m2f(74 if k % 2 else 69), 0.6, r, 0.25, 0.6), (-0.3, 0.3)[k % 2]), t, gain * 0.35); t += BEAT * 1.5; k += 1


def cluster(M, t, r, gain=1.0):
    for m in (50, 51, 56, 57):
        place(M, I.brass(I.m2f(m), 0.6, 0.9, r, "stab"), t - 0.02, 0.3 * gain)
    place(M, I.timpani(I.m2f(38), 0.9, r, 1.4), t - 0.02, 0.55 * gain)


def choir(M, t0, t1, r, gain=1.0):
    chords = [[50, 57, 62, 65], [46, 53, 58, 62], [43, 50, 55, 58], [45, 52, 57, 61]]
    n, d = 0, (t1 - t0) / 4
    for c in chords:
        place(M, I.pad([I.m2f(m) for m in c], d + 0.4, 0.5, r, 0.7, 0.8, 1300, detune=9), t0 + n * d, gain * 0.32); n += 1


def bells(M, t0, r, gain=1.0, n=6):
    for k in range(n):
        place(M, pan(I.glock(I.m2f([62, 57, 62, 65, 62, 57][k % 6] - 12), 0.8, r, 3.0), (-0.4, 0.4)[k % 2]), t0 + 0.45 * k, gain * 0.35)


def build_music():
    r = rng(23)
    M = buf()
    waltz(M, 0.05, cf(4) - 0.1, r, 0.85); cue(0.05, "music: minor waltz (pizzicato + vibes)")
    waltz(M, cf(4), cf(6) - 0.1, r, 0.6, False, 0.85, False)
    cluster(M, W["axe"], r, 0.8); cluster(M, W["too"], r, 1.0); cue(W["too"], "music: dissonant sting, then nothing")
    ticktock(M, cf(7), cf(10) - 0.1, r, 0.9); cue(cf(7), "music: creeping tick-tock (fever, Porfiry, the painter)")
    # silence on "Raskolnikov could have walked free"
    choir(M, cf(11), cf(13) - 0.1, r, 0.9); cue(cf(11), "music: warm choir pad for Sonya")
    bells(M, cf(13) + 0.1, r, 0.9); cue(cf(13), "music: Haymarket church bells")
    place(M, I.pad([I.m2f(m) for m in (38, 45, 50, 53)], cw("siberia") - cw("gets"), 0.4, r, 0.3, 0.3, 800), cw("gets"), 0.25)
    waltz(M, cw("siberia") + 0.05, DUR - 0.3, r, 0.75, True, 0.7); cue(cw("siberia"), "music: the waltz slowed, in D major, in the snow")
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
