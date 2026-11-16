# Sound for "Peter the Great Shaved His Guests, Then Taxed Beards": synthesized SFX + an original score (a bouncy
# balalaika-style tremolo tune in A minor, a muted sneaky section for the carpenter, an angelic sting at heaven's gate,
# silence, then the tune again with a final tag on "razor"), ducked under the voice; every event sits on the picture's
# word times (~/peter-short/timing.json, the same table story.ts and the captions read).
# Usage: ~/tts/chatterbox/bin/python peter_sound.py  ->  ~/peter-short/audio/mix.wav (48 kHz stereo, exact picture
# length), stems/*.wav, cues.md
import os, sys, json, wave
import numpy as np
from scipy import signal

AUDIO_LIB = os.path.expanduser("~/claude-animated-shorts/shorts/audio")
sys.path.insert(0, AUDIO_LIB)
from dsp import (SR, ns, tt, rng, lp, hp, bp, peq, shelf, colored, smooth_noise, fades, pan, st, place, widen, make_ir, convolve_st,
                 integrated, true_peak, dbg, read_wav)
import instruments as I
import sfx_gen as G

ROOT = os.path.expanduser("~/peter-short")
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
HALL = [(0.0, cf(1)), (cf(3), cf(5)), (cf(6), cf(7)), (cf(15), DUR)]
CITY = [(cf(1), cf(3)), (cf(5), cf(6)), (cf(7), cf(9)), (cw("burden"), cf(11)), (cf(14), cf(15))]
MINT = [(cf(9), cw("burden"))]
WHARF = [(cf(11), cf(13))]
HEAVEN = [(cf(13), cf(14))]
INSIDE = HALL + MINT
MINT_HITS = [W["copper"] - 0.03, W["token"] - 0.03, W["stamped"] - 0.03]
CARP_HITS = [B[11] + 0.15, W["some"] + 0.05, W["shaved"] + 0.1, W["men2"] + 0.1, W["bigger"] - 0.1]
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


def thunk(r, f=70, dur=0.5):
    t = tt(dur)
    body = np.sin(2 * np.pi * np.cumsum(f * (1 + 1.5 * np.exp(-t / 0.02))) / SR) * np.exp(-t / 0.12)
    knock = bp(r.standard_normal(len(t)), 300, 2500) * np.exp(-t / 0.02)
    coins = sum(bp(r.standard_normal(len(t)), 3000, 9000) * np.exp(-np.clip(t - d, 0, None) / 0.03) * (t > d) * 0.25 for d in (0.0, 0.03, 0.07, 0.12))
    return fades(body + 0.6 * knock + coins, 0.001, 0.05)


def squeak(r, f0=1500, f1=2400, dur=0.12):
    t = tt(dur)
    y = np.sin(2 * np.pi * np.cumsum(f0 + (f1 - f0) * np.sin(np.pi * t / dur)) / SR) * np.sin(np.pi * t / dur) ** 2
    return fades(y, 0.002, 0.02)


def shing(r, dur=0.7):
    """a razor drawn / glinting: a bright metallic ring over a short rising scrape"""
    t = tt(dur)
    ring = sum(a * np.sin(2 * np.pi * f * t + r.uniform(0, 6)) * np.exp(-t / d) for f, a, d in ((3520, 0.5, 0.35), (5280, 0.35, 0.25), (7040, 0.25, 0.18), (8870, 0.15, 0.12)))
    scr = bp(r.standard_normal(len(t)), 2500, 9000) * np.clip(t / 0.08, 0, 1) * np.exp(-t / 0.09) * 0.6
    return fades(ring + scr, 0.003, 0.1)


def shave_scrape(r, dur=0.22):
    n = ns(dur); t = np.arange(n) / SR
    y = bp(r.standard_normal(n), 1800, 8000) * (0.5 + 0.5 * np.abs(np.sin(2 * np.pi * 45 * t))) * np.sin(np.pi * t / dur)
    return fades(y, 0.005, 0.03)


def poof(r, dur=0.4):
    """a soft fluffy 'poof' of hair: low breathy burst"""
    t = tt(dur)
    y = lp(r.standard_normal(len(t)), 900) * np.exp(-t / 0.08) * np.clip(t / 0.01, 0, 1) + 0.4 * np.sin(2 * np.pi * 140 * t) * np.exp(-t / 0.05)
    return fades(y, 0.002, 0.08)


def rustle(r, dur=0.6):
    n = ns(dur); t = np.arange(n) / SR
    y = bp(r.standard_normal(n), 500, 4500) * (0.4 + 0.6 * smooth_noise(n, r, 14) ** 2) * np.sin(np.pi * t / dur)
    return fades(y, 0.02, 0.06)


def bell(r, f=196.0, dur=3.0):
    t = tt(dur)
    y = sum(a * np.sin(2 * np.pi * f * k * t + r.uniform(0, 6)) * np.exp(-t / (dur * d)) for k, a, d in ((0.5, 0.5, 0.6), (1.0, 1.0, 0.45), (1.19, 0.5, 0.3), (1.5, 0.4, 0.25), (2.0, 0.35, 0.2), (2.6, 0.2, 0.12)))
    return fades(y, 0.003, 0.3)


def cart(dur, r):
    """cart wheels on a mud road: a slow wooden creak + knocks"""
    n = ns(dur); t = np.arange(n) / SR
    y = lp(colored(n, r, 1.4), 600, 2) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.9 * t) ** 2) * 0.6
    for k in range(int(dur * 1.8)):
        i = int((k / 1.8 + r.uniform(0, 0.2)) * SR)
        if i < n - 4000: y[i:i + 4000] += bp(r.standard_normal(4000), 200, 1500) * np.exp(-np.arange(4000) / 600) * 0.6
    return widen(fades(y, 0.4, 0.5), r, 7, 0.5)


def gull(r):
    t = tt(0.5)
    f = 1500 + 900 * np.sin(np.pi * t / 0.5) - 600 * t
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / 0.5) ** 2 * (0.7 + 0.3 * np.sin(2 * np.pi * 30 * t))
    return fades(bp(y, 800, 5000), 0.01, 0.05)


def saw(r, dur=1.2, rate=3.0):
    n = ns(dur); t = np.arange(n) / SR
    y = bp(r.standard_normal(n), 900, 5000) * np.abs(np.sin(np.pi * rate * t)) ** 2
    return fades(y, 0.05, 0.1)


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


def cheers(b, t0, t1, r, gain=0.35):
    t = t0
    while t < t1:
        place(b, pan(G.hurrah(r, r.uniform(100, 150), r.uniform(0.95, 1.08)), r.uniform(-0.8, 0.8)), t, gain * r.uniform(0.6, 1.0)); t += r.uniform(0.25, 0.6)


def build_sfx():
    r = rng(1698)
    S = buf()
    # ---- ambiences ----
    for a, b in HALL:
        place(S, murmur(b - a, r, 7), a, 0.22)
        t0 = a + 0.4
        while t0 < b - 0.2:
            place(S, pan(G.clink(r, r.uniform(2400, 3400), 0.06, 0.8), r.uniform(-0.7, 0.7)), t0, 0.12); t0 += r.uniform(0.6, 1.5)
    for a, b in CITY:
        place(S, G.breeze(b - a, r, 0.4), a, 0.12); place(S, G.bird_chirps(b - a, r, 0.3), a, 0.1)
        place(S, cart(b - a, r), a, 0.1)
    for tb in (cf(1) + 0.4, cf(7) + 0.5, cf(14) + 0.3):
        place(S, pan(bell(r, 147.0), -0.3), tb, 0.18)
    for a, b in MINT:
        place(S, fire_bed(b - a, r, 0.25), a, 0.25)
        t0 = a + 0.3
        while t0 < b:
            place(S, pan(G.clink(r, r.uniform(1800, 2600), 0.08, 0.6), 0.6), t0, 0.09); t0 += 0.55
    for a, b in WHARF:
        place(S, G.water_bed(b - a, r, 0.6), a, 0.2)
        place(S, pan(gull(r), 0.5), a + 0.8, 0.15); place(S, pan(gull(r), -0.4), a + 3.6, 0.12)
        place(S, pan(saw(r, 2.0), 0.6), a + 1.4, 0.08)
    for a, b in HEAVEN:
        place(S, G.breeze(b - a, r, 0.3, bright=2500), a, 0.1)
    cue(0.0, "feast chatter + goblet clinks; street: breeze, birds, cart, church bell; Mint: furnace + distant hammers; wharf: water, gulls, saw")
    # ---- line 1: the hook ----
    cheers(S, 0.3, W["razor"] - 0.2, r, 0.32); cue(0.3, "guests cheering")
    place(S, st(shing(r)), W["razor"] - 0.02, 0.9); cue(W["razor"], "razor SHING + glint")
    gasps(S, W["shaving"] - 0.05, r, 7, 0.45); cue(W["shaving"], "crowd gasp")
    place(S, widen(G.whoosh(0.5, r, 0.3, 500, 5000), r), cf(1) - 0.15, 0.5)
    # ---- line 2-3: Peter strides home; nobody argues ----
    k, t0 = 0, cf(1) + 0.15
    while t0 < W["cleanshaven"] - 0.3:
        place(S, pan(G.boot(r, 0.9), 0.1), t0, 0.45); t0 += 0.42; k += 1
    cue(W["returned"], "Peter's boots")
    place(S, pan(squeak(r), -0.3), W["argued"] - 0.15, 0.35); cue(W["argued"], "tiny squeak from the boyar")
    # ---- shaving: scrape + poof on every beard ----
    for tp in (W["one2"], W["lost"], W["beards"] + 0.05, W["sight"]):
        place(S, pan(shave_scrape(r), 0.1), tp - 0.18, 0.5)
        place(S, st(poof(r)), tp - 0.04, 0.8)
    cue(W["one2"], "scrape + poof (x3 at the feast, x1 police)")
    place(S, widen(G.whoosh(0.35, r, 0.25, 800, 6000), r), W["sight"] - 0.3, 0.6)
    place(S, pan(squeak(r, 900, 1300, 0.2), -0.2), W["sin"] - 0.05, 0.2)
    # ---- the deal / merchant / peasant ----
    place(S, I.glock(I.m2f(91), 0.5, r, 1.2), W["deal"] - 0.05, 0.3)
    place(S, st(thunk(r)), W["hundred"] + 0.12, 1.0); cue(W["hundred"], "heavy purse THUD on the table")
    tf, tc = W["kopek"] - 0.1, W["kopek"] + 0.5
    place(S, pan(G.clink(r, 4200, 0.05, 1.0), 0.3), tf, 0.45); place(S, pan(G.clink(r, 3800, 0.04, 0.9), 0.4), tc, 0.4)
    cue(W["kopek"], "tiny kopek tink, flip, bite click")
    for k in range(int((W["gates"] + 0.6 - W["walked"]) / 0.4)):
        place(S, pan(G.stroll_step(r, 0.6), 0.2), W["walked"] + k * 0.4, 0.25)
    # ---- Mint: hammer clangs; token flips ----
    for th in MINT_HITS:
        place(S, st(G.hammer_hit(r, 1.0)), th, 0.6); place(S, pan(G.clink(r, 2900, 0.15, 1.2), 0.1), th + 0.005, 0.4)
    cue(MINT_HITS[0], "hammer clang x3 on copper / token / stamped")
    for tw in (W["nose"], W["mouth"], W["beard3"]):
        place(S, I.glock(I.m2f({W["nose"]: 84, W["mouth"]: 88, W["beard3"]: 91}[tw]), 0.4, r, 1.0), tw - 0.03, 0.22)
    place(S, widen(G.whoosh(0.3, r, 0.2, 1200, 7000), r), W["message"] - 0.12, 0.35); cue(W["message"], "token flip whoosh")
    place(S, pan(rustle(r, 0.4), 0.0), W["burden"] + 0.15, 0.4); place(S, pan(G.oof(r, "oh", 150, 1.0), 0.0), W["burden"] + 0.35, 0.3)
    # ---- wharf: carpenter hammering; the beard out of the coat ----
    for th in CARP_HITS:
        if th < W["worry"] - 0.1: place(S, pan(G.hammer_hit(r, 0.7), -0.3), th, 0.4)
    place(S, pan(rustle(r, 0.7), -0.2), W["coat"] - 0.35, 0.55); cue(W["coat"], "cloth rustle: the beard comes out")
    place(S, pan(G.whoa(r, dur=0.45), 0.3), W["coat"] + 0.15, 0.35)
    # ---- heaven: chime ----
    sparkle(S, W["nicholas"] - 0.02, r, n=7, gain=0.45)
    place(S, I.triangle(0.6, r, 2.2, 2640), W["nicholas"] - 0.02, 0.35); cue(W["nicholas"], "bright chime")
    # ---- coda ----
    place(S, I.triangle(0.4, r, 1.4, 3100), W["fifty"] - 0.03, 0.25)
    cheers(S, cf(15) + 0.2, W["razor2"] - 0.2, r, 0.25)
    place(S, st(shing(r)), W["razor2"] - 0.02, 0.9); cue(W["razor2"], "final razor SHING")
    # whooshes on the crossfades
    for tx in (cf(3), cf(5), cf(6), cf(7), cf(9), cf(13), cf(14), cf(15)):
        place(S, widen(G.whoosh(0.45, r, 0.25, 400, 3500), r), tx - 0.2, 0.25)
    return S


# ================================================================ score (A minor, 132 bpm)
BEAT = 60 / 132
CH = {"Am": [45, 57, 60, 64], "Dm": [50, 57, 62, 65], "E": [40, 56, 59, 64], "C": [48, 55, 60, 64], "G": [43, 55, 59, 62], "F": [41, 57, 60, 65]}
# an original bouncy melody (one note per beat, 0 = rest); 16 bars of 4
MEL = [69, 69, 72, 71, 69, 67, 69, 0, 65, 65, 69, 67, 65, 64, 62, 0,
       64, 65, 67, 69, 71, 72, 71, 69, 68, 69, 71, 68, 64, 0, 64, 0,
       69, 72, 76, 74, 72, 71, 72, 0, 74, 72, 71, 69, 71, 72, 71, 0,
       69, 67, 65, 64, 62, 64, 65, 67, 69, 68, 64, 68, 69, 0, 69, 0]
PROG = ["Am", "Am", "Dm", "Dm", "C", "C", "E", "E", "Am", "Am", "G", "G", "F", "Dm", "E", "Am"]


def balalaika(M, t0, t1, r, gain=1.0, tune=True, bar0=0):
    """bass + chord on the off-beat (oom-pah), and the tune as a fast tremolo of plucks (balalaika style)"""
    t, k = t0, bar0 * 4
    while t < t1 - 0.05:
        bar = (k // 4) % 16
        ch = CH[PROG[bar]]
        j = k % 4
        if j in (0, 2): place(M, pan(I.pluck(I.m2f(ch[0] if j == 0 else ch[0] + 7), 0.8, r, 0.5, 0.35), -0.25), t, gain * 0.9)
        else:
            for m in ch[1:]: place(M, pan(I.pluck(I.m2f(m), 0.45, r, 0.25, 0.7, 0.1), 0.15), t, gain * 0.35)
        m = MEL[k % 64]
        if tune and m:
            for q in range(4):
                place(M, pan(I.pluck(I.m2f(m + 12), 0.5 if q == 0 else 0.32, r, 0.22, 0.85, 0.1), 0.3), t + q * BEAT / 4, gain * 0.5)
        t += BEAT; k += 1
    return k


def sneak(M, t0, t1, r, gain=1.0):
    line = [57, 60, 62, 63, 64, 63, 62, 60]
    t, k = t0, 0
    while t < t1 - 0.1:
        place(M, pan(I.pluck(I.m2f(line[k % 8]), 0.6, r, 0.25, 0.3), -0.15), t, gain)
        t += BEAT * (1.0 if k % 4 != 3 else 1.5); k += 1


def sting(M, t, r, root=45, gain=1.0, minor=True):
    for m in (root, root + (3 if minor else 4), root + 7):
        place(M, I.brass(I.m2f(m + 12), 0.7, 0.85, r, "stab"), t - 0.02, 0.35 * gain)
    place(M, I.timpani(I.m2f(root), 0.8, r, 1.6), t - 0.02, 0.6 * gain); place(M, I.cymbal(0.4, r, 1.6), t, 0.3 * gain)


def build_music():
    r = rng(7)
    M = buf()
    # lines 1-11: the balalaika tune (a held breath under the hook's razor; it starts properly after the flash)
    place(M, I.pad([I.m2f(m) for m in (57, 64, 69)], W["razor"] - 0.2, 0.35, r, 0.6, 0.4, 1200), 0.1, 0.35)
    sting(M, W["shaving"], r, 45, 0.9); cue(W["shaving"], "music: sting on 'shaving'")
    balalaika(M, cf(1), cf(11) - 0.35, r, 0.9); cue(cf(1), "music: balalaika tremolo tune")
    sting(M, W["sight"], r, 40, 0.7, False)
    # half-beat of silence, then the sneaky muted plucks for the carpenter
    sneak(M, cf(11) + 0.3, cf(13) - 0.1, r, 0.75); cue(cf(11) + 0.3, "music: silence, then sneaky muted plucks")
    # heaven: an airy choir pad + an angelic sting on "Nicholas", then silence until the next line
    a, b = HEAVEN[0]
    place(M, I.pad([I.m2f(m) for m in (69, 73, 76, 81)], W["nicholas"] + 0.9 - a, 0.35, r, 0.8, 0.5, 2600), a, 0.6)
    for k, m in enumerate((81, 85, 88, 93)):
        place(M, I.glock(I.m2f(m), 0.6, r, 2.2), W["nicholas"] - 0.02 + 0.06 * k, 0.5)
    place(M, I.pad([I.m2f(m) for m in (69, 76, 81, 85, 88)], 0.6, 0.5, r, 0.05, 0.9, 3500), W["nicholas"] - 0.02, 0.6)
    cue(W["nicholas"], "music: angelic sting, then silence")
    # coda: the tune returns, a final strum + sting on "razor"
    balalaika(M, cf(14) + 0.1, W["razor2"] - 0.05, r, 0.85, True, 8)
    for k, m in enumerate(CH["Am"]):
        place(M, I.pluck(I.m2f(m + 12), 0.8, r, 2.2, 0.7), W["razor2"] - 0.02 + 0.03 * k, 0.8)
    sting(M, W["razor2"], r, 45, 1.0); cue(W["razor2"], "music: final strum + sting")
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
    # rooms: the feast hall and the Mint are big stone/wood rooms; outdoors a little air; voice stays dry
    ins = np.clip(sum(env_seg(a, b, 0.2, 0.3) for a, b in INSIDE), 0, 1)
    out = np.clip(1 - ins, 0, 1)
    room, air = make_ir(1.1, 3), make_ir(0.35, 5)

    def wet(x, k):
        return x + k * (convolve_st(x * ins, room)[:, :N] + 0.5 * convolve_st(x * out, air)[:, :N])
    S, M = wet(S, 0.22), wet(M, 0.2)
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
