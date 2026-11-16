# Sound for "Dead Since 1832, Still at University" (Jeremy Bentham): synthesized SFX + an original score (a light
# pizzicato theme, storm strings, a playful middle, a sneaky caper, a stately organ, silence on "He didn't vote"),
# ducked under the voice; every event sits on the picture's word times (~/bentham-short/timing.json, the same table
# story.ts and the captions read).
# Usage: python bentham_sound.py  ->  mix.wav (48 kHz stereo, exact picture length), stems/*.wav, cues.md
import os, sys, json, wave
import numpy as np
from scipy import signal

AUDIO_LIB = os.path.expanduser("~/claude-animated-shorts/shorts/audio")
sys.path.insert(0, AUDIO_LIB)
from dsp import (SR, ns, tt, rng, lp, hp, bp, peq, shelf, colored, smooth_noise, fades, pan, st, place, widen, make_ir, convolve_st,
                 integrated, true_peak, dbg, read_wav)
import instruments as I
import sfx_gen as G

ROOT = os.path.expanduser("~/bentham-short")
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
CENTRE = [(0.0, cf(1)), (cf(15), DUR)]
STUDY = [(cf(1), cf(3))]
THEATRE = (cf(3), cf(5))
SHOP = [(cf(5), cf(6)), (cf(7), cf(9))]
DINNER = (cf(6), cf(7))
CLOD = [(cf(9), cf(10)), (cf(11), cf(13))]
CLON = (cf(10), cf(11))
COUNCIL = (cf(13), cf(14))
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


def tick(r, f=2400):
    t = tt(0.05)
    return fades(bp(r.standard_normal(len(t)), f * 0.7, f * 1.4) * np.exp(-t / 0.006), 0.0005, 0.01)


def shutter(r):
    """phone camera shutter: two quick clicks"""
    y = np.zeros(ns(0.16))
    for k, f in enumerate((3200, 2200)):
        c = tick(r, f); i = ns(0.07 * k); y[i:i + len(c)] += c[: len(y) - i]
    return y


def rain(dur, r):
    n = ns(dur)
    y = hp(colored(n, r, 0.6), 1500) * 0.35 * (0.85 + 0.15 * smooth_noise(n, r, 0.7))
    drops = np.zeros(n)
    for _ in range(int(dur * 60)):
        i = r.integers(0, max(1, n - 800)); L = r.integers(60, 500)
        drops[i:i + L] += bp(r.standard_normal(L), 2000, 7000) * np.exp(-np.arange(L) / (L / 5)) * r.uniform(0.1, 0.6)
    return widen(fades(y + drops, 0.6, 0.6), r, 9, 0.8)


def thunder(r, dur=3.0):
    """a crack on the strike, then a long rolling rumble"""
    out = rumble(dur, r) * 1.2
    out[:, : ns(0.3)] += st(crack(r))[:, : ns(0.3)] * 0.9
    return out


def owl(r):
    out = np.zeros(ns(1.4))
    for k, (t0, d) in enumerate(((0.0, 0.32), (0.55, 0.6))):
        t = tt(d); f = 390 * (1 - 0.06 * t / d) * (1 + 0.01 * np.sin(2 * np.pi * 6 * t))
        y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / d) ** 1.5 + 0.08 * lp(r.standard_normal(len(t)), 900) * np.sin(np.pi * t / d)
        i = ns(t0); out[i:i + len(y)] += y
    return out


def poof(r, dur=0.6):
    """a dry, dusty poof: low noise burst with a soft top"""
    t = tt(dur)
    y = lp(r.standard_normal(len(t)), 700, 2) * np.exp(-t / 0.12) + 0.3 * bp(r.standard_normal(len(t)), 1500, 5000) * np.exp(-t / 0.05)
    return fades(y, 0.004, 0.2)


def footsteps(dur, r, rate=1.9, gain=1.0):
    n = ns(dur); out = np.zeros((2, n))
    tk = r.uniform(0, 0.3)
    while tk < dur - 0.3:
        s = pan(G.stroll_step(r, r.uniform(0.2, 0.7)), r.uniform(-0.8, 0.8)) * r.uniform(0.3, 1.0) * gain
        i = ns(tk); out[:, i:i + s.shape[1]] += s[:, : n - i]
        tk += r.uniform(0.6, 1.2) / rate
    return out


def chatter(dur, r, voices=7):
    return murmur(dur, r, voices, 120, 240)


def laugh(r, base=150):
    y = G.babble(0.9, r, base, 1.1, 7.5, 0.95, fmax=4200)
    return fades(y * np.abs(np.sin(np.pi * np.arange(len(y)) / SR * 7)), 0.02, 0.2)


def build_sfx():
    r = rng(1832)
    S = buf()
    # ---- the Student Centre today: footsteps + chatter; the double-take; the phone shutter ----
    for a, b in CENTRE:
        place(S, footsteps(b - a, r), a, 0.5); place(S, chatter(b - a, r), a, 0.18)
    cue(0.0, "Student Centre: footsteps + student chatter")
    place(S, pan(G.whoa(r, dur=0.45), -0.4), W["dead"] + 0.05, 0.45)
    place(S, I.glock(I.m2f(84), 0.5, r, 1.6), W["dead"] - 0.02, 0.3); cue(W["dead"], "double-take 'whoa' + deadpan ding")
    place(S, pan(shutter(r), 0.4), W["entire"] - 0.05, 0.9); cue(W["entire"], "phone camera shutter")
    place(S, widen(G.whoosh(0.5, r, 0.5, 300, 2500), r), cf(1) - 0.3, 0.45)
    # ---- the study 1832: clock tick, quill scratch, the scroll unrolling ----
    a, b = STUDY[0]
    tk = a
    while tk < b - 0.1:
        place(S, pan(tick(r, 1800), 0.5), tk, 0.25); tk += 1.0
    tk = a + 0.2
    while tk < W["instructions"] - 0.3:
        place(S, pan(scrape(r, 0.12, 2500, 7000), 0.1), tk, 0.18); tk += 0.22
    for k in range(9):
        place(S, pan(paper(r, 0.16), -0.2 + 0.05 * k), W["instructions"] - 0.05 + k * 0.12, 0.35)
    place(S, widen(G.whoosh(1.1, r, 0.6, 400, 3000), r), W["instructions"] - 0.05, 0.3); cue(W["instructions"], "scroll unrolls across the floor")
    sparkle(S, W["useful"], r, gain=0.3); cue(W["useful"], "sparkle on 'useful'")
    # ---- the anatomy theatre: rain on the skylight, murmur, heads turn, two thunder strikes ----
    a, b = THEATRE
    place(S, rain(b - a, r), a, 0.45); place(S, murmur(cf(4) - a, r, 7, 90, 150), a, 0.15)
    for k in range(6):
        place(S, pan(G.whoosh(0.18, r, 0.4, 700, 3500), (k - 2.5) * 0.3), W["public"] - 0.05 + 0.02 * k, 0.15)
    cue(W["public"], "rain, gents murmur; every head turns (whip swooshes)")
    place(S, thunder(r, 3.5), W["thunderstorm"] - 0.04, 1.0); cue(W["thunderstorm"], "THUNDER crack + roll")
    place(S, thunder(r, 3.0), W["shook"] - 0.04, 1.1); gasps(S, W["shook"] + 0.15, r, 6, 0.25)
    place(S, st(thunk(r, 120, 0.3)), W["shook"] + 0.55, 0.4); cue(W["shook"], "second THUNDER, gasps, the top hat lands")
    # ---- the workshop: fire crackle; padding puffs, coat flop, the chair creak ----
    for a, b in SHOP:
        place(S, fire_bed(b - a, r, 0.12), a, 0.3)
    for k in range(4):
        place(S, widen(G.whoosh(0.25, r, 0.3, 300, 1800), r), W["padded"] - 0.05 + 0.3 * k, 0.3)
    place(S, widen(G.whoosh(0.4, r, 0.2, 200, 1500), r), W["dressed"] - 0.1, 0.6)
    place(S, pan(G.creak(0.5, r, 90, 140), 0.1), W["seated"], 0.4)
    place(S, st(thunk(r, 90, 0.35)), W["chair"] - 0.02, 0.6); cue(W["padded"], "workshop: fire; padding puffs, coat flop, chair creak + thunk")
    # ---- the dinner: cutlery clinks + chatter; the glass eyes ----
    a, b = DINNER
    place(S, murmur(b - a, r, 6, 110, 220), a, 0.2)
    for k in range(int((b - a) * 1.5)):
        place(S, pan(G.clink(r), r.uniform(-0.7, 0.7)), a + r.uniform(0, b - a), 0.12)
    place(S, pan(G.clink(r, 2600, 0.2), 0.2), W["pocket"] - 0.02, 0.6); place(S, pan(G.clink(r, 3100, 0.2), 0.25), W["pocket"] + 0.07, 0.5)
    gasps(S, W["pocket"] + 0.2, r, 4, 0.25); cue(W["pocket"], "glass-eye clink clink, guests gasp")
    # ---- the head: cloth whipped off, dusty poof ----
    place(S, widen(G.whoosh(0.35, r, 0.2, 500, 4000), r), W["came"] - 0.1, 0.6)
    place(S, st(poof(r)), W["shrivelled"] - 0.02, 1.0); cue(W["shrivelled"], "cloth whoosh; dusty POOF")
    # ---- the wax head spinning ----
    tk = W["sculpted"] - 0.05
    while tk < W["wax"] - 0.15:
        place(S, widen(G.whoosh(0.22, r, 0.5, 600, 3000), r), tk, 0.22); tk += 0.28
    sparkle(S, W["wax"], r, gain=0.4); cue(W["wax"], "spin swooshes; sparkle on 'wax'")
    # ---- the cloister by day: birds in the quad; thunk on "feet" ----
    for a, b in CLOD:
        place(S, G.bird_chirps(b - a, r, 0.35), a, 0.14); place(S, footsteps(b - a, r, 0.6, 0.4), a, 0.25)
    place(S, st(thunk(r, 75, 0.45)), W["feet"] - 0.02, 0.8); cue(W["feet"], "cloister: birds; wooden thunk on 'feet'")
    # ---- the cloister by night: crickets, an owl, tiptoes; the theft; laughs ----
    a, b = CLON
    place(S, G.crickets(b - a, r, 3), a, 0.18); place(S, pan(owl(r), -0.6), a + 0.6, 0.3)
    tk = a + 0.3
    while tk < W["stole"] - 0.2:
        place(S, pan(G.stroll_step(r, 0.1), r.uniform(-0.4, 0.4)), tk, 0.25); tk += 0.3
    place(S, widen(G.whoosh(0.35, r, 0.2, 400, 3000), r), W["stole"] - 0.08, 0.6); place(S, pan(G.clink(r, 1800, 0.25), 0.3), W["stole"] + 0.05, 0.5)
    for k in range(3):
        place(S, pan(laugh(r, [150, 190, 120][k]), (k - 1) * 0.5), W["hundred2"] + 0.05 + 0.1 * k, 0.35)
    cue(W["stole"], "night: crickets, owl, tiptoes; snatch; giggles on 'hundred'")
    # ---- "ten": a cash-register ding; "deal": a thunk + sparkle ----
    place(S, I.glock(I.m2f(96), 0.8, r, 1.4), W["ten"] + 0.02, 0.6); place(S, I.triangle(0.6, r, 1.2, 2640), W["ten"] + 0.02, 0.3)
    place(S, pan(G.rattle(0.25, r, 40), 0.3), W["ten"] - 0.15, 0.3); cue(W["ten"], "cash-register DING")
    place(S, st(thunk(r, 100, 0.3)), W["deal"] - 0.02, 0.6); sparkle(S, W["deal"] + 0.05, r, gain=0.3)
    # ---- the council: paper shuffles; the trolley squeaks in; gasps ----
    a, b = COUNCIL
    for k in range(int((b - a) * 1.2)):
        place(S, pan(paper(r, 0.25), r.uniform(-0.6, 0.6)), a + r.uniform(0, W["wheeled"] - a), 0.12)
    tk = W["wheeled"] - 0.45
    while tk < W["wheeled"] + 1.2:
        place(S, pan(G.swing_squeak(r, 0.6, True), 0.2), tk, 0.3); tk += 0.36
    place(S, pan(lp(colored(ns(1.7), r, 1.5), 200), 0.1), W["wheeled"] - 0.5, 0.35)
    gasps(S, W["surprise"] + 0.02, r, 8, 0.32); cue(W["wheeled"], "trolley squeak + roll; gasps on 'surprise'")
    # "He didn't vote": nothing but a faint room tone (beds above end before it)
    return S


# ================================================================ score (C major, 104 bpm)
BEAT = 60 / 104
CH = {"C": [48, 55, 60, 64, 67], "G": [43, 55, 59, 62, 67], "Am": [45, 52, 57, 60, 64], "F": [41, 53, 57, 60, 65], "Dm": [50, 57, 62, 65, 69],
      "E": [40, 52, 56, 59, 64], "Em": [40, 52, 55, 59, 64]}
THEME = [72, 76, 79, 76, 77, 74, 71, 74, 72, 76, 79, 84, 83, 79, 77, 74]


def organ(M, notes, t0, t1, gain=0.5, warm=1200):
    place(M, I.pad([I.m2f(m) for m in notes], t1 - t0, 0.45, None, 0.25, 0.5, warm, 3.0), t0, gain)


def pizz_theme(M, t0, t1, r, gain=1.0, prog=("C", "G", "Am", "F"), octave=0):
    """the light theme: plucked melody in eighths over a bouncing pizzicato bass"""
    t, k = t0, 0
    while t < t1 - 0.1:
        place(M, pan(I.pluck(I.m2f(THEME[k % 16] + octave), 0.7, r, 0.35, 0.55), 0.2), t, gain)
        if k % 2 == 0:
            ch = CH[prog[(k // 8) % len(prog)]]
            place(M, pan(I.pluck(I.m2f(ch[0]), 0.75, r, 0.4, 0.3), -0.25), t, gain * 0.75)
        if k % 8 == 0: place(M, pan(I.glock(I.m2f(THEME[k % 16] + 12), 0.25, r, 1.0), 0.4), t, gain * 0.25)
        t += BEAT / 2; k += 1


def caper(M, t0, t1, r, gain=1.0):
    """sneaky tiptoe pizzicato: chromatic staccato steps in A minor"""
    seq = [45, 48, 47, 46, 45, 52, 51, 52]
    t, k = t0, 0
    while t < t1 - 0.1:
        place(M, pan(I.pluck(I.m2f(seq[k % 8]), 0.7, r, 0.22, 0.4), -0.2), t, gain)
        if k % 4 == 2: place(M, pan(I.pluck(I.m2f(seq[k % 8] + 24), 0.4, r, 0.18, 0.7), 0.4), t, gain * 0.6)
        t += BEAT / 2; k += 1


def sting(M, t, r, root=45, gain=1.0, minor=True):
    for m in (root, root + (3 if minor else 4), root + 7):
        place(M, I.brass(I.m2f(m + 12), 0.9, 0.9, r, "stab"), t - 0.02, 0.4 * gain)
    place(M, I.timpani(I.m2f(root), 0.9, r, 2.0), t - 0.02, 0.75 * gain); place(M, I.cymbal(0.5, r, 2.0), t, 0.3 * gain)


def build_music():
    r = rng(1850)
    M = buf()
    # 1-4: the light pizzicato theme
    pizz_theme(M, 0.2, cf(3) - 0.15, r, 0.9); cue(0.2, "music: light pizzicato theme")
    # 5-8: low strings (dark pad) under the storm, timpani on the strikes
    organ(M, (33, 40, 45, 48), cf(3), cf(5) + 0.2, 0.5, 600)
    place(M, I.timpani(I.m2f(33 + 12), 0.9, r, 2.5), W["thunderstorm"] - 0.03, 0.8); place(M, I.timpani(I.m2f(33 + 12), 1.0, r, 2.5), W["shook"] - 0.03, 0.9)
    organ(M, (38, 45, 50, 53), cf(5), cf(6) + 0.2, 0.45, 700)
    pizz_theme(M, cf(5) + 0.1, cf(6) - 0.2, r, 0.55, ("Dm", "Am", "E", "Am"), -12); cue(cf(3), "music: dark strings + timpani for the storm")
    # 9-11: playful vibes waltz-ish line for the legend and the workshop
    t, k = cf(6) + 0.05, 0
    while t < cf(7) - 0.2:
        place(M, pan(I.vibes(I.m2f([67, 71, 74, 79, 76, 72][k % 6]), 0.5, r, 0.9), 0.2), t, 0.6); t += BEAT; k += 1
    organ(M, (40, 47, 52), cf(7), cf(8), 0.4, 500)
    sting(M, W["shrivelled"], r, 40, 0.9); cue(W["shrivelled"], "music: minor brass sting on 'shrivelled'")
    pizz_theme(M, cf(8) + 0.1, cf(9) - 0.2, r, 0.7, ("F", "C", "G", "C"))
    # 12: a music box over the reveal of the head between his feet
    t, k = cf(9) + 0.1, 0
    while t < cf(10) - 0.2:
        place(M, pan(I.musicbox(I.m2f([84, 79, 76, 72, 74, 79][k % 6]), 0.4, r, 1.4), 0.3), t, 0.5); t += BEAT; k += 1
    # 13-14: caper music for the theft
    caper(M, cf(10) + 0.05, cf(11) - 0.6, r, 0.9); cue(cf(10), "music: sneaky caper pizzicato")
    # 15: half a second of silence before "The university offered ten" (nothing scored), a dry pluck on "ten"
    place(M, I.pluck(I.m2f(48), 0.8, r, 0.6, 0.4), W["ten"] + 0.02, 0.6)
    # 16: a tiny triumphant fanfare on "deal"
    for k2, m in enumerate((60, 64, 67, 72)):
        place(M, I.brass(I.m2f(m), 0.35 if k2 < 3 else 0.8, 0.8, r, "stab"), W["deal"] - 0.05 + k2 * 0.1, 0.3)
    # 17-18: stately organ for the council; brass hit on "surprise"
    t, prog, k = cf(13), ["C", "F", "C", "G"], 0
    while t < cf(14) - 0.1:
        ch = CH[prog[k % 4]]
        organ(M, (ch[0], ch[2], ch[3], ch[4]), t, min(cf(14) - 0.2, t + 4 * BEAT + 0.3), 0.45, 1500); t += 4 * BEAT; k += 1
    sting(M, W["surprise"], r, 48, 0.7, minor=False); cue(cf(13), "music: stately organ; brass hit on 'surprise'")
    # 19: "He didn't vote." - full silence (nothing scored between cf(14) and cf(15))
    cue(cf(14), "music: SILENCE for 'He didn't vote.'")
    # 20: the light theme returns, a last button on "by"
    pizz_theme(M, cf(15) + 0.1, W["by"] - 0.1, r, 0.9)
    for k2, m in enumerate(CH["C"]):
        place(M, I.pluck(I.m2f(m), 0.7, r, 2.2, 0.6), W["by"] + 0.02 + 0.03 * k2, 0.7)
    place(M, I.glock(I.m2f(84), 0.6, r, 2.0), W["by"] + 0.05, 0.4); cue(W["by"], "music: theme returns, button on 'by'")
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
    # rooms: big halls (atrium, theatre, council) and stone cloister vs. small wooden rooms; voice stays dry
    bas = sum(env_seg(a, b, 0.2, 0.3) for a, b in CENTRE + [THEATRE, (cf(13), DUR)])
    cel = sum(env_seg(a, b, 0.2, 0.3) for a, b in CLOD + [CLON])
    out = np.clip(1 - bas - cel, 0, 1)
    church, stone, air = make_ir(2.6, 7), make_ir(1.0, 11), make_ir(0.4, 3)

    def wet(x, k):
        return (x + k * (convolve_st(x * bas, church)[:, :N] + convolve_st(x * cel, stone)[:, :N] + 0.4 * convolve_st(x * out, air)[:, :N]))
    S, M = wet(S, 0.25), wet(M, 0.3)
    # "He didn't vote.": music AND effects drop out; half a second of hush before "The university offered ten."
    hush = 1 - env_seg(cf(14) - 0.05, cf(15) - 0.1, 0.08, 0.1)
    M *= hush; S *= hush
    M *= 1 - env_seg(cf(11) - 0.55, W["ten"] - 0.05, 0.08, 0.05)
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
