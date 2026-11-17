# Sound for "In 1518 the Cure for Dancing Was... More Dancing" (the Dancing Plague): synthesized SFX + an original
# Renaissance-style jig (fife tune, plucked drones, frame drum) that plays for the hook and the cure, falls silent under
# Frau Troffea's lonely first steps and in the council chamber, grinds to a halt on the ban, a solemn organ-like pad at
# the shrine, and bursts back for the loop line. Ducked under the voice; events on the picture's word times.
# Usage: ~/tts/chatterbox/bin/python dancing_sound.py  ->  ~/dancing-short/audio/mix.wav, stems/*.wav, cues.md
import os, sys, json, wave
import numpy as np
from scipy import signal

AUDIO_LIB = os.path.expanduser("~/claude-animated-shorts/shorts/audio")
sys.path.insert(0, AUDIO_LIB)
from dsp import (SR, ns, tt, rng, lp, hp, bp, peq, shelf, smooth_noise, fades, pan, st, place, widen, make_ir, convolve_st,
                 integrated, true_peak, dbg, read_wav)
import instruments as I
import sfx_gen as G

ROOT = os.path.expanduser("~/dancing-short")
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
STAGET = [(0.0, cf(1)), (cf(7), cf(8)), (cf(9), cf(10)), (cf(15), DUR)]
LANE = [(cf(1), cf(2)), (cw("days"), cf(5)), (cf(10), cf(11)), (cf(13), cf(15))]
NIGHT = [(cf(2), cw("days"))]
COUNCILT = [(cf(5), cf(7)), (cf(11), cf(12))]
HALLT = [(cf(8), cf(9))]
ROADT = [(cf(12), cw("shrine"))]
SHRINET = [(cw("shrine"), cf(13))]
COTTAGE = COUNCILT   # small room (reverb)
PLAZA = HALLT        # the big guild hall (reverb)
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


def stamps(S, a, b, r, rate=6.0, gain=0.1, spread=0.6):
    """many dancing feet: soft random stomps on wood / cobbles"""
    t = a
    while t < b:
        place(S, pan(thump(r, r.uniform(90, 140), 0.1), r.uniform(-spread, spread)), t + r.uniform(0, 0.05), gain * r.uniform(0.5, 1.0)); t += 1 / rate


def build_sfx():
    global CROWD
    CROWD = buf()
    r = rng(1518)
    S = buf()
    # ---- ambiences ----
    for a, b in LANE + ROADT + SHRINET:
        place(S, G.breeze(b - a, r, 0.4, bright=1300), a, 0.09); place(S, G.bird_chirps(b - a, r, 0.25, "sparrow"), a, 0.06)
    for a, b in NIGHT:
        place(S, G.crickets(b - a, r, 3), a, 0.12)
    for a, b in COUNCILT:
        place(S, hum(b - a, r), a, 0.02)
    for a, b in STAGET + HALLT + [(cf(4), cf(5)), (cf(10), cf(11))]:
        place(CROWD, murmur(b - a, r, 14), a, 0.3)
        stamps(S, a + 0.1, b - 0.1, r, 7.0, 0.12)
    for a, b in ROADT:
        place(S, pan(G.creak(b - a, r, 70, 110), 0.0), a, 0.12)
    cue(0.0, "crowd chatter + stamping feet on the stage, in the lane and the guild hall; crickets at night")
    # ---- 2-5: the first lonely footsteps, then more feet ----
    place(S, pan(G.creak(0.6, r, 120, 190), -0.5), W["steps"] - 0.3, 0.3)
    t = W["dance"]
    while t < cf(3) - 0.2:
        place(S, pan(tok(r, r.uniform(480, 560), 0.5), -0.3), t, 0.14); t += 0.33
    cue(W["dance"], "a lonely foot-tap rhythm, no music")
    place(S, pan(hiss(r, 0.4, 3000), 0.0), W["stop2"] - 0.05, 0.15)
    stamps(S, W["dozens"] - 0.2, cf(4), r, 8.0, 0.12)
    # ---- 7-8: the diagnosis ----
    place(S, pan(G.creak(0.4, r, 300, 420), -0.2), W["natural"] - 0.2, 0.15)
    t = W["hot"] - 0.05
    while t < cf(6) - 0.2:
        place(S, pan(bloop(r, 300, 160, 0.12), 0.3), t, 0.18); t += 0.16
    cue(W["hot"], "a bubbling pot")
    place(S, st(thump(r, 110, 0.15)), W["out"] - 0.03, 0.5)
    # ---- 9-11 ----
    for k in range(6): place(S, pan(tok(r, 700, 0.9), -0.2 + 0.08 * k), W["stage"] - 0.4 + 0.22 * k, 0.4)
    cue(W["stage"], "hammer blows")
    place(S, pan(G.clink(r, 2400, 0.25, 1.0), 0.3), W["work"] - 0.03, 0.45); place(S, pan(boing(r, 600, 0.4, 20), 0.3), W["work"], 0.25)
    cue(W["work"], "the fiddle string snaps")
    # ---- 13: the ban ----
    place(S, st(thump(r, 70, 0.3)), W["bans"] - 0.03, 0.7); place(S, st(thump(r, 60, 0.25)), W["music"] - 0.02, 0.5)
    # ---- 14-15: wagons, the chapel bell ----
    for k in range(3): place(S, pan(G.clink(r, 700, 1.4, 0.6), 0.2), W["pray"] - 0.2 + 1.1 * k, 0.25)
    cue(W["pray"], "the chapel bell")
    # ---- 16: the end of it ----
    place(S, G.water_bed(1.6, r, 0.4, 0.6), W["stops"] - 0.2, 0.2)
    place(S, pan(G.oof(r, "oh", 210, 1.15), -0.3), W["stops"] + 0.2, 0.15)
    for tx in (cf(1), cf(5), cf(7), cf(8), cf(12), cw("shrine"), cf(13), cf(15)):
        place(S, widen(G.whoosh(0.45, r, 0.25, 400, 3500), r), tx - 0.2, 0.15)
    return S

# ================================================================ score (D mixolydian jig, 6/8, dotted-quarter = 120)
BEAT = 60 / 120 / 3   # one eighth note
CH = {"D": [38, 62, 66, 69], "C": [36, 60, 64, 67], "G": [43, 62, 67, 71], "A": [45, 61, 64, 69]}
PROG = ["D", "D", "C", "C", "D", "G", "A", "D"]
# an original jig tune, one note per eighth (0 = rest): 8 bars of 6
MEL = [74, 76, 78, 79, 78, 76, 74, 0, 72, 74, 72, 69, 72, 74, 76, 72, 0, 67, 69, 72, 74, 76, 74, 72,
       74, 78, 81, 79, 78, 76, 74, 76, 78, 79, 0, 76, 76, 73, 69, 73, 76, 79, 78, 76, 74, 74, 0, 0]


def jig(M, t0, t1, r, gain=1.0, tune=True, tempo=1.0):
    b = BEAT / tempo
    t, k = t0, 0
    while t < t1 - 0.05:
        bar = (k // 6) % 8
        ch = CH[PROG[bar]]
        j = k % 6
        if j in (0, 3): place(M, pan(I.pluck(I.m2f(ch[0]), 0.8, r, 0.5, 0.3), -0.2), t, gain * 0.7)
        if j in (1, 2, 4, 5):
            for m in ch[1:]: place(M, pan(I.pluck(I.m2f(m), 0.45, r, 0.2, 0.55), 0.3), t, gain * 0.13)
        if j == 0: place(M, pan(I.timpani(I.m2f(50), 0.5, r, 0.5), 0.0), t, gain * 0.25)
        if j in (0, 3): place(M, pan(I.brush(0.6, r), 0.1), t, gain * 0.25)
        m = MEL[k % 48]
        if tune and m: place(M, pan(I.fife(I.m2f(m), b * 0.95, 0.6, r), 0.2), t, gain * 0.32)
        t += b; k += 1


def organ(M, t0, t1, r, gain=1.0):
    chords = [[50, 57, 62, 66], [48, 55, 60, 64], [43, 50, 55, 59], [45, 52, 57, 61]]
    d = (t1 - t0) / 4
    for n, c in enumerate(chords):
        place(M, I.pad([I.m2f(m) for m in c], d + 0.5, 0.5, r, 0.6, 0.8, 1100, detune=5), t0 + n * d, gain * 0.32)


def halt(M, t, r, gain=1.0):
    """the band grinds to a stop: a falling pluck smear"""
    for k in range(6): place(M, pan(I.pluck(I.m2f(74 - 3 * k), 0.6, r, 0.2, 0.5), 0.1), t + 0.06 * k, gain * 0.25 * (1 - k / 7))


def build_music():
    r = rng(24)
    M = buf()
    jig(M, 0.05, cf(1) - 0.1, r, 0.9); cue(0.05, "music: Renaissance jig (fife, plucks, frame drum)")
    # silence under Frau Troffea's lonely steps (cf 1 -> cf 3), then the jig creeps in as people join
    jig(M, cf(3), cf(5) - 0.1, r, 0.5, True, 0.9); cue(cf(3), "music: the jig creeps in as people join")
    # silence in the council chamber; the jig at full blast for the cure
    jig(M, cf(7), cf(10) - 0.05, r, 0.95); cue(cf(7), "music: the jig at full blast (stage, guild hall)")
    jig(M, cf(10), W["music"] - 0.05, r, 0.8)
    halt(M, W["music"] - 0.05, r, 1.0); cue(W["music"], "music: the band grinds to a halt on the ban")
    organ(M, cf(12), cf(14) - 0.2, r, 0.9); cue(cf(12), "music: solemn organ-like pad, wagons + shrine")
    jig(M, W["cure2"] - 0.1, DUR - 0.2, r, 1.0); cue(W["cure2"], "music: the jig bursts back for the loop")
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
