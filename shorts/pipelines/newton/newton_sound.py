# Sound for "The Man Who Put a Needle in His Eye" (Isaac Newton): synthesized SFX + an original baroque-flavoured score
# (harpsichord-style plucks, pizzicato sneak theme, a pompous Mint march), ducked under the voice; every event sits on
# the picture's word times (the shared timing table ~/newton-short/timing.json, the same one story.ts and the captions read).
# Usage: python newton_sound.py  ->  mix.wav (48 kHz stereo, exact picture length), stems/*.wav, cues.md
import os, sys, json, wave
import numpy as np
from scipy import signal

AUDIO_LIB = os.path.expanduser("~/claude-animated-shorts/shorts/audio")
sys.path.insert(0, AUDIO_LIB)
from dsp import (SR, ns, tt, rng, lp, hp, bp, peq, shelf, colored, smooth_noise, fades, pan, st, place, widen, make_ir, convolve_st,
                 integrated, true_peak, dbg, read_wav)
import instruments as I
import sfx_gen as G

ROOT = os.path.expanduser("~/newton-short")
TM = json.load(open(os.path.join(ROOT, "timing.json")))
FPS, TOTAL = TM["fps"], TM["total"]
DUR = TOTAL / FPS
N = ns(DUR)
W = dict(TM["word"])
B = TM["beat"]
PRE = 3
cf = lambda b: (round(B[b] * FPS) - PRE) / FPS  # picture cut before narration beat b (story.ts cf)
CUT_HIDE = (round(W["hide"] * FPS) - PRE) / FPS
STRIKES = [W["decades"] + 0.05, W["job"] - 0.05, W["mint"] - 0.08]  # story.ts STRIKES
# sets on the timeline (s)
STUDY = [(0.0, cf(5))]
MINT = [(cf(5), cf(9)), (cf(11), DUR)]
CELL = [(cf(9), cf(11))]
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
    for _ in range(int(dur * 7)):
        i = r.integers(0, max(1, n - 2000)); L = r.integers(80, 900)
        pops[i:i + L] += hp(r.standard_normal(L), 1500) * np.exp(-np.arange(L) / (L / 4)) * r.uniform(0.2, 1.0)
    return widen(fades(x + 0.5 * pops, 0.5, 0.5), r, 9, 0.6)


def tick(r, f=2400, tock=False):
    t = tt(0.05)
    y = bp(r.standard_normal(len(t)), f * (0.7 if tock else 1), f * 2.2) * np.exp(-t / 0.006)
    y += 0.4 * np.sin(2 * np.pi * (1300 if tock else 1700) * t) * np.exp(-t / 0.012)
    return fades(y, 0.0005, 0.01)


def clock(b, a, e, r, rate=1.0, gain=0.22):
    t, k = a, 0
    while t < e:
        place(b, pan(tick(r, tock=k % 2 == 1), 0.35), t, gain); t += 1 / rate; k += 1


def squish(r, dur=0.25, f0=250, f1=1400):
    t = tt(dur)
    y = bp(r.standard_normal(len(t)), f0, f1) * np.exp(-t / 0.07) * (1 + np.sin(2 * np.pi * 30 * t))
    return fades(y, 0.005, 0.05)


def squeak(f0, f1, dur, r):
    """thin rising squeak (the bodkin sliding in): a whistly sine glide with a little scrape"""
    t = tt(dur)
    f = f0 * (f1 / f0) ** (t / dur)
    ph = 2 * np.pi * np.cumsum(f * (1 + 0.02 * np.sin(2 * np.pi * 11 * t))) / SR
    y = np.sin(ph) * (0.6 + 0.4 * np.sin(2 * np.pi * 7 * t) ** 2) + 0.15 * bp(r.standard_normal(len(t)), 3000, 8000)
    return fades(y, 0.04, 0.08)


def slide_whistle(f0, f1, f2, d1, d2, r):
    n1, n2 = ns(d1), ns(d2)
    f = np.concatenate([f0 * (f1 / f0) ** (np.arange(n1) / n1) ** 0.8, f1 * (f2 / f1) ** (np.arange(n2) / n2) ** 1.3])
    t = np.arange(len(f)) / SR
    ph = 2 * np.pi * np.cumsum(f * (1 + 0.012 * np.sin(2 * np.pi * 6.0 * t))) / SR
    return fades(np.sin(ph) + 0.12 * np.sin(2 * ph) + 0.04 * bp(r.standard_normal(len(t)), 1500, 6000), 0.03, 0.06)


def scratch(dur, r, rate=7.0):
    """quill on paper: bursts of bright noise in a writing rhythm"""
    n = ns(dur); t = np.arange(n) / SR
    gate = np.clip(np.sin(2 * np.pi * rate * t + 2 * np.sin(2 * np.pi * 1.3 * t)), 0, 1) ** 2
    y = bp(r.standard_normal(n), 2500, 7500) * gate * (0.7 + 0.3 * smooth_noise(n, r, 4))
    return fades(y, 0.02, 0.05)


def chalk(r, dur=0.22):
    t = tt(dur)
    y = bp(r.standard_normal(len(t)), 1800, 5200) * (0.6 + 0.4 * np.sin(2 * np.pi * 38 * t))
    y += 0.25 * np.sin(2 * np.pi * np.cumsum(2600 + 300 * t / dur) / SR)
    return fades(y, 0.01, 0.04)


def thunk(r, f=70, dur=0.5):
    """heavy press strike / shutter slam body: low sine drop + wood knock"""
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


def drip(r, f=900):
    t = tt(0.2)
    y = np.sin(2 * np.pi * np.cumsum(f * 2.2 ** np.clip(t / 0.03, 0, 1)) / SR) * np.exp(-t / 0.035)
    return fades(y, 0.001, 0.04)


def paper(r, dur=0.18):
    t = tt(dur)
    y = bp(r.standard_normal(len(t)), 600, 6000) * np.exp(-t / 0.04) + 0.5 * lp(r.standard_normal(len(t)), 300) * np.exp(-t / 0.02)
    return fades(y, 0.002, 0.04)


def sizzle(dur, r):
    """the sun's glare building: bright airy noise + a rising high sine cluster"""
    t = tt(dur)
    k = (t / dur) ** 1.6
    y = hp(colored(len(t), r, 0.2), 4000) * k * 0.6
    for f in (2900, 3700, 4400):
        y += 0.12 * k * np.sin(2 * np.pi * np.cumsum(f * (1 + 0.3 * t / dur)) / SR)
    return fades(y, 0.2, 0.01)


def sparkle(b, t0, r, notes=(86, 88, 91, 93, 95, 98), n=6, gain=0.5, step=0.07):
    for k in range(n):
        place(b, pan(I.glock(I.m2f(r.choice(notes)), r.uniform(0.3, 0.6), r, 1.0), r.uniform(-0.7, 0.7)), t0 + k * step, gain)


def murmur(dur, r, voices=6):
    n = ns(dur); out = np.zeros((2, n))
    for _ in range(voices):
        y = G.babble(dur, r, r.uniform(95, 140), r.uniform(0.95, 1.05), r.uniform(3.4, 4.4), r.uniform(0.4, 0.7), fmax=3000)
        out += pan(lp(y, r.uniform(1800, 2800), 1) * r.uniform(0.3, 0.9), r.uniform(-0.85, 0.85))
    return fades(out, 0.5, 0.6)


def build_sfx():
    r = rng(1699)
    S = buf()
    # ---- study night: candle, a ticking clock (no crickets: removed at the user's request) ----
    place(S, fire_bed(cf(3), r, 0.08), 0.0, 0.25)
    clock(S, 0.3, cf(3) - 0.1, r)
    cue(0.0, "study at night: candle, slow clock")
    # the bodkin slides in, a squish on "eyeball", a deadpan ding on "purpose"
    place(S, pan(squeak(380, 980, W["eyeball"] + 0.3 - W["slid"], r), 0.25), W["slid"] - 0.05, 0.22); cue(W["slid"], "needle squeak (slides in)")
    place(S, st(squish(r, 0.3, 200, 1100)), W["eyeball"] + 0.05, 0.55); cue(W["eyeball"], "squish")
    place(S, I.glock(I.m2f(84), 0.5, r, 1.6), W["purpose"] - 0.02, 0.35); cue(W["purpose"], "deadpan ding")
    # "pressed": squish + his 'oh'
    place(S, st(squish(r, 0.35, 180, 900)), W["pressed"] - 0.03, 0.75)
    place(S, pan(G.oof(r, "oh", 150, 1.1), -0.2), W["pressed"] + 0.06, 0.55); cue(W["pressed"], "press: squish + 'oh!'")
    # what he saw: shimmering rings
    sparkle(S, W["rings"] - 0.05, r, gain=0.4); cue(W["rings"], "ring shimmer")
    place(S, I.glock(I.m2f(91), 0.5, r, 1.4), W["white"], 0.4)
    place(S, I.glock(I.m2f(67), 0.5, r, 1.4), W["dark"], 0.45)
    sparkle(S, W["color2"] - 0.03, r, (88, 91, 95, 98, 100), 5, 0.4); cue(W["white"], "white / dark / colour plinks")
    place(S, pan(scratch(W["notebook"] + 0.7 - W["sketched"], r), 0.15), W["sketched"], 0.35); cue(W["sketched"], "quill scratching")
    # ---- flash into the prism room ----
    place(S, widen(G.whoosh(0.5, r, 0.15, 900, 6000), r), cf(3) - 0.05, 0.6); cue(cf(3), "flash whoosh")
    sparkle(S, cf(3) + 0.1, r, (86, 90, 93, 98), 8, 0.35, 0.06); cue(cf(3), "prism shimmer")
    # ---- the sun's reflection: sizzle builds, the shutters SLAM, silence ----
    place(S, st(sizzle(CUT_HIDE - W["stared"], r)), W["stared"], 0.35); cue(W["stared"], "glare sizzle builds")
    place(S, st(thunk(r, 90, 0.4)), CUT_HIDE, 0.9)
    place(S, pan(thunk(r, 110, 0.3), 0.3), CUT_HIDE + 0.09, 0.6); cue(CUT_HIDE, "shutters slam (cut to the dark room)")
    # dark room: tally marks scratched on the wall
    for k, d in enumerate([-0.05, 0.35, 0.7]):
        place(S, pan(chalk(r), 0.45), W["days"] + d - 0.02, 0.4)
    cue(W["days"], "three chalk tallies")
    # ---- the Mint ----
    place(S, widen(G.whoosh(0.6, r, 0.5, 400, 3000), r), cf(5) - 0.3, 0.45); cue(cf(5), "crossfade whoosh into the Mint")
    for a, b in MINT:
        place(S, fire_bed(b - a, r, 0.3), a, 0.3)
    place(S, murmur(cf(8) - cf(5), r), cf(5), 0.18); cue(cf(5), "Mint: furnace roar + workmen murmur")
    for s in STRIKES:
        place(S, st(thunk(r, 55, 0.6)), s, 1.0)
        place(S, st(G.hammer_hit(r, 1.0)), s, 0.6)
        for k in range(5):
            place(S, pan(G.clink(r, None, 0.12, 1.0), r.uniform(-0.6, 0.6)), s + 0.06 + k * 0.05, 0.25)
    cue(STRIKES[0], "coin press strikes x3 (clang + coin clinks)")
    # the coin: fake on "counterfeiters" (a dull bonk), cracks on "treason"
    t = tt(0.25)
    bonk = np.sin(2 * np.pi * np.cumsum(240 * 0.7 ** np.clip(t / 0.15, 0, 1)) / SR) * np.exp(-t / 0.08)
    place(S, st(fades(bonk, 0.002, 0.05)), W["counterfeiters"] - 0.05, 0.6); cue(W["counterfeiters"], "fake coin: dull bonk")
    place(S, st(crack(r)), W["treason"] - 0.02, 0.9); cue(W["treason"], "coin cracks in two")
    # Chaloner: a sly slide whistle on "slipperiest", workmen gasp on "fraud"
    place(S, pan(slide_whistle(500, 1100, 700, 0.35, 0.35, r), -0.2), W["slipperiest"], 0.22); cue(W["slipperiest"], "sly slide whistle")
    for k in range(6):
        place(S, pan(G.whoa(r, dur=r.uniform(0.35, 0.5)) * r.uniform(0.4, 0.9), r.uniform(-0.8, 0.8)), W["fraud"] + 0.12 + r.uniform(0, 0.2), 0.3)
    cue(W["fraud"], "gasps")
    # months: quill + page flips + piles thumping down, a fast clock
    place(S, pan(scratch(cf(9) - cf(8) - 0.2, r, 9), 0.2), cf(8) + 0.1, 0.3)
    clock(S, W["months"], cf(9) - 0.1, r, 4.0, 0.16)
    for k in range(6):
        place(S, pan(paper(r), r.uniform(-0.5, 0.5)), W["months"] + k * 0.42, 0.45)
    cue(W["months"], "months: quill, page flips, fast clock")
    # ---- Newgate: drips, a distant chain, the bell, the rope ----
    place(S, widen(G.whoosh(0.6, r, 0.5, 300, 2500), r), cf(9) - 0.3, 0.4)
    for a, b in CELL:
        tk = a + 0.3
        while tk < b:
            place(S, pan(drip(r, r.uniform(800, 1300)), r.uniform(-0.6, 0.6)), tk, 0.25); tk += r.uniform(0.9, 1.6)
        place(S, pan(G.rattle(0.8, r, 18, None, False), -0.6), a + 0.6, 0.18)
    cue(cf(9), "cell: drips + a distant chain")
    place(S, pan(G.creak(1.0, r, 70, 110), -0.3), W["hang"] - 0.02, 0.45); cue(W["hang"], "rope creak with the noose shadow")
    place(S, pan(scratch(W["begging"] - W["wrote"] + 0.4, r, 8), 0.1), W["wrote"], 0.3); cue(W["wrote"], "Chaloner's quill")
    # ---- the ending ----
    place(S, widen(G.whoosh(0.5, r, 0.5, 300, 2500), r), cf(11) - 0.25, 0.35)
    place(S, st(paper(r, 0.3)), W["never"] + 0.25, 0.8); cue(W["never"], "the letter slapped onto the pile")
    place(S, I.triangle(0.6, r, 1.8, 2640), W["neither"] + 0.05, 0.5)
    for m, d in [(93, 0.0), (98, 0.05)]:
        place(S, I.glock(I.m2f(m), 0.6, r, 1.6), W["neither"] + 0.05 + d, 0.6)
    cue(W["neither"], "steel glint 'ting' on the bodkin")
    return S


# ================================================================ score (D minor, 100 bpm, 4/4)
BEAT = 0.6
CH = {"Dm": [50, 57, 62, 65, 69], "Gm": [43, 55, 58, 62, 67], "A": [45, 52, 57, 61, 64], "F": [41, 53, 57, 60, 65], "C": [48, 55, 60, 64, 67],
      "D": [50, 57, 62, 66, 69], "Bb": [46, 53, 58, 62, 65], "G": [43, 55, 59, 62, 67]}


def harpsi(M, t0, t1, r, prog, gain=1.0, bright=0.75, pattern=(1, 2, 3, 4, 3, 2, 3, 2), bar=4):
    """harpsichord-ish broken chords: bass on the bar, eighth-note figure"""
    t, k = t0, 0
    while t < t1 - 0.05:
        ch = CH[prog[k % len(prog)]]
        place(M, pan(I.pluck(I.m2f(ch[0]), 0.8, r, 1.2, bright * 0.7, 0.12), -0.2), t, gain)
        for j, s in enumerate(pattern):
            tj = t + j * (bar * BEAT / len(pattern))
            if tj < t1:
                place(M, pan(I.pluck(I.m2f(ch[s] + 12), 0.5, r, 0.5, bright, 0.1), 0.25), tj, gain * 0.55)
        t += bar * BEAT; k += 1


def sneak(M, t0, t1, r, gain=1.0):
    """pizzicato sneak theme: staccato low plucks on the off-beats + a creeping line"""
    line = [50, 53, 55, 56, 57, 56, 55, 53]
    t, k = t0, 0
    while t < t1 - 0.1:
        place(M, pan(I.pluck(I.m2f(line[k % 8]), 0.75, r, 0.25, 0.35), -0.15), t, gain)
        if k % 2 == 1:
            place(M, pan(I.pluck(I.m2f(line[k % 8] + 19), 0.4, r, 0.2, 0.6), 0.3), t + BEAT / 4, gain * 0.5)
        t += BEAT / 2 * (1.0 if k % 4 != 3 else 1.5); k += 1


def march(M, t0, t1, r, gain=1.0):
    """pompous Mint march: tuba roots, timpani on 1, snare, harpsichord chords"""
    prog = ["Dm", "A", "Dm", "Gm", "F", "C", "Dm", "A"]
    t, k = t0, 0
    while t < t1 - 0.1:
        ch = CH[prog[k % 8]]
        for j in range(4):
            tj = t + j * BEAT
            if tj >= t1: break
            place(M, I.brass(I.m2f(ch[0] - 12 if j % 2 == 0 else ch[1] - 12), BEAT * 0.8, 0.6, r, "tuba"), tj, 0.4 * gain)
            place(M, pan(I.snare(0.5 if j % 2 else 0.35, r, 0.2, 1.0, 0.8), -0.25), tj + (BEAT / 2 if j == 3 else 0), 0.22 * gain)
        place(M, I.timpani(I.m2f(ch[0] - 12 + (12 if ch[0] < 45 else 0)), 0.6, r, 1.0), t, 0.35 * gain)
        harpsi(M, t, min(t1, t + 4 * BEAT), r, [prog[k % 8]], gain * 0.7, 0.8, (1, 2, 3, 2))
        t += 4 * BEAT; k += 1


def build_music():
    r = rng(1665)
    M = buf()
    # hook + bodkin: pizzicato sneak, curious
    sneak(M, 0.2, cf(3) - 0.1, r, 0.8); cue(0.2, "music: pizzicato sneak theme")
    place(M, I.pad([I.m2f(m) for m in (50, 57, 62)], cf(3) - 0.3, 0.25, r, 1.0, 0.4, 700), 0.2, 0.35)
    # the prism: wonder, D major, warm pad + broken chords + glock arpeggio on "history"
    place(M, I.pad([I.m2f(m) for m in (50, 57, 62, 66, 69)], cf(4) - cf(3), 0.35, r, 0.4, 0.6, 1400), cf(3), 0.5)
    harpsi(M, cf(3), cf(4) - 0.1, r, ["D", "G", "D", "A"], 0.65, 0.6, (2, 3, 4, 3))
    for k, m in enumerate([74, 78, 81, 86, 90]):
        place(M, I.glock(I.m2f(m), 0.5, r, 1.8), W["history"] + k * 0.1, 0.35)
    cue(cf(3), "music: wonder (D major pad + harpsichord, glock run on 'history')")
    # the sun: a rising cluster that cuts dead at the shutter slam
    rise = lambda t: np.clip(t / (CUT_HIDE - cf(4)), 0, 1) ** 1.5
    place(M, I.pad([I.m2f(m) for m in (62, 63, 69)], CUT_HIDE - cf(4), 0.4, r, 0.5, 0.02, 2600, 9.0, trem=rise), cf(4), 0.7)
    # the dark room: a low trembling drone
    shiver = lambda t: 0.8 + 0.2 * np.sin(2 * np.pi * 5.0 * t)
    place(M, I.pad([I.m2f(38), I.m2f(45)], cf(5) - CUT_HIDE + 0.3, 0.3, r, 0.15, 0.4, 500, trem=shiver), CUT_HIDE + 0.05, 0.55)
    cue(cf(4), "music: rising glare cluster, cut dead at the slam; dark-room drone")
    # the Mint: pompous march through the counterfeiters; stinger on "treason"
    march(M, cf(5) + 0.05, W["treason"] - 0.05, r)
    place(M, I.brass(I.m2f(50), 0.9, 0.9, r, "stab"), W["treason"] - 0.02, 0.5)
    place(M, I.brass(I.m2f(51), 0.9, 0.9, r, "stab"), W["treason"] - 0.02, 0.45)
    place(M, I.timpani(I.m2f(38), 0.9, r, 2.0), W["treason"] - 0.02, 0.7); place(M, I.cymbal(0.5, r, 2.0), W["treason"], 0.35)
    cue(cf(5), "music: Mint march -> brass + timpani sting on 'treason'")
    # Chaloner: the sneak theme returns, sly, with a brass stab on "accused" and "fraud"
    sneak(M, cf(7), cf(8) - 0.1, r, 0.85)
    for w in ("accused", "fraud"):
        place(M, I.brass(I.m2f(57), 0.35, 0.8, r, "stab"), W[w] - 0.03, 0.4)
        place(M, I.brass(I.m2f(63), 0.35, 0.8, r, "stab"), W[w] - 0.03, 0.3)
    cue(cf(7), "music: Chaloner's sly sneak theme, brass stabs")
    # months: a busy minor harpsichord ostinato that speeds the clock
    harpsi(M, cf(8), cf(9) - 0.1, r, ["Dm", "Bb", "Gm", "A"], 0.75, 0.75, (1, 2, 3, 4, 3, 2, 3, 4), 2)
    # Newgate: a slow bell toll, low pad; trembling high strings on "begging"
    place(M, I.pad([I.m2f(m) for m in (38, 45, 50)], cf(11) - cf(9), 0.3, r, 0.6, 0.6, 600), cf(9), 0.5)
    for tb in (cf(9) + 0.1, W["condemned"] - 0.02, W["hang"] - 0.02):
        place(M, I.timpani(I.m2f(33), 0.7, r, 2.4), tb, 0.5); place(M, I.glock(I.m2f(57), 0.5, r, 2.4), tb, 0.6)
    tremh = lambda t: 0.75 + 0.25 * np.sin(2 * np.pi * 7.0 * t)
    place(M, I.pad([I.m2f(74), I.m2f(77)], cf(11) - W["wrote"], 0.25, r, 0.5, 0.3, 2600, 6.0, trem=tremh), W["wrote"], 0.4)
    cue(cf(9), "music: Newgate bell tolls; trembling strings for the plea")
    # "unmoved": nothing but one low cold note
    place(M, I.pad([I.m2f(45), I.m2f(52)], cf(12) - cf(11), 0.2, r, 0.3, 0.6, 400), cf(11), 0.45)
    place(M, I.timpani(I.m2f(33), 0.6, r, 2.0), W["unmoved"] - 0.02, 0.5)
    # coda: the sneak theme, a final stab on "caution"
    sneak(M, cf(12) + 0.1, W["neither"] - 0.1, r, 0.8)
    for m in (50, 57, 62, 65):
        place(M, I.brass(I.m2f(m), 0.8, 0.85, r, "stab"), W["caution"] - 0.02, 0.3)
    place(M, I.timpani(I.m2f(38), 0.9, r, 2.2), W["caution"] - 0.02, 0.7); place(M, I.cymbal(0.6, r, 2.2), W["caution"], 0.35)
    for k, m in enumerate(CH["Dm"]):
        place(M, I.pluck(I.m2f(m), 0.7, r, 2.2, 0.6), W["caution"] + 0.02 + 0.03 * k, 0.7)
    cue(W["caution"], "music: final stab + Dm strum on 'caution'")
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
    # rooms: small plastered study, a stone hall (the Mint), a stone cell; voice stays dry
    t = np.arange(N) / SR
    mint_m = sum(env_seg(a, b, 0.2, 0.3) for a, b in MINT)
    cell_m = sum(env_seg(a, b, 0.2, 0.3) for a, b in CELL)
    small, hall, stone = make_ir(0.6, 3), make_ir(1.6, 7), make_ir(1.1, 11)

    def wet(x, k):
        return (x + k * (0.6 * convolve_st(x * (1 - mint_m - cell_m), small)[:, :N] + convolve_st(x * mint_m, hall)[:, :N]
                         + convolve_st(x * cell_m, stone)[:, :N]))
    S, M = wet(S, 0.22), wet(M, 0.28)
    # the shutter slam and "unmoved" are dead air for the beds
    gap = 1 - env_seg(W["unmoved"] - 0.05, cf(12) - 0.1, 0.1, 0.2)
    S *= np.clip(gap + (t < W["unmoved"] - 0.2), 0, 1)
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
