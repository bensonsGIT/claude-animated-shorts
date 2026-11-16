# Sound for "The Pope Who Put a Corpse on Trial" (the Cadaver Synod, 897): synthesized SFX + an original score
# (organ drones, a plucked macabre theme on the public-domain Dies Irae chant, a pompous trial march, brass + timpani
# stings), ducked under the voice; every event sits on the picture's word times (~/formosus-short/timing.json, the
# same table story.ts and the captions read).
# Usage: python formosus_sound.py  ->  mix.wav (48 kHz stereo, exact picture length), stems/*.wav, cues.md
import os, sys, json, wave
import numpy as np
from scipy import signal

AUDIO_LIB = os.path.expanduser("~/claude-animated-shorts/shorts/audio")
sys.path.insert(0, AUDIO_LIB)
from dsp import (SR, ns, tt, rng, lp, hp, bp, peq, shelf, colored, smooth_noise, fades, pan, st, place, widen, make_ir, convolve_st,
                 integrated, true_peak, dbg, read_wav)
import instruments as I
import sfx_gen as G

ROOT = os.path.expanduser("~/formosus-short")
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
BASILICA = [(0.0, cf(1)), (cw("propped"), cw("threw")), (cf(7), cf(8)), (cf(9), cw("prison")), (cf(10), DUR)]
CRYPT = [(cf(1), cw("propped"))]
PRISON = [(cw("prison"), cf(10))]
RIVER = [(cw("threw"), cf(7)), (cf(8), cf(9))]
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


def build_sfx():
    r = rng(897)
    S = buf()
    # ---- the synod: candles, hushed clergy murmur; the fly over the corpse ----
    for a, b in BASILICA:
        place(S, fire_bed(b - a, r, 0.08), a, 0.22)
    place(S, murmur(cf(1), r, 5), 0.0, 0.12)
    cue(0.0, "basilica: candles + clergy murmur")
    place(S, I.glock(I.m2f(84), 0.5, r, 1.6), W["died"] - 0.02, 0.35)
    place(S, fly(cf(1) - cw("died") + 0.1, r), cw("died"), 0.3); cue(W["died"], "deadpan ding; the fly buzzes round the corpse")
    # ---- the crypt: shovels, a thunk on "dug", grunts hauling, puff into robes ----
    place(S, widen(G.whoosh(0.5, r, 0.5, 300, 2500), r), cf(1) - 0.25, 0.4)
    tk = cf(1) + 0.1
    while tk < W["dug"] - 0.2:
        place(S, pan(scrape(r, 0.25, 200, 1800), r.uniform(-0.5, 0.5)), tk, 0.5); tk += 0.4
    place(S, st(thunk(r, 60, 0.5)), W["dug"] - 0.02, 0.8)
    for k in range(3):
        place(S, pan(G.oof(r, "oof", r.uniform(110, 140), 1.0), [-0.4, 0.4, 0][k]), W["dug"] + 0.1 + k * 0.38, 0.4)
    cue(W["dug"], "shovels, thunk, grunts hauling the body up")
    place(S, widen(G.whoosh(0.35, r, 0.15, 900, 6000), r), W["dressed"] - 0.1, 0.5)
    sparkle(S, W["dressed"], r, gain=0.35); cue(W["dressed"], "poof + sparkle: dressed in his robes")
    # ---- propped: a plop onto the throne + wood creak ----
    place(S, st(thunk(r, 85, 0.4)), W["propped"] - 0.03, 0.9)
    place(S, pan(G.creak(0.6, r, 90, 140), -0.2), W["propped"] + 0.12, 0.35); cue(W["propped"], "plop onto the throne, creak")
    # ---- defendant: the fly again; the deacon's gulp, a squeaky 'answer' ----
    place(S, fly(cf(3) - cw("defendant"), r, 230), cw("defendant"), 0.28); cue(cw("defendant"), "fly")
    place(S, pan(gulp(r), -0.2), W["deacon"] + 0.2, 0.5); cue(W["deacon"], "deacon gulps")
    place(S, pan(G.oof(r, "oh", 260, 0.6), -0.2), W["answer"] + 0.05, 0.25)
    # ---- Stephen hurls accusations: gibberish ranting + parchment flurry; then dead silence + fly ----
    rant = G.babble(cw("the5") - W["hurled"] + 0.1, r, 150, 1.0, 6.5, 0.9, fmax=4500)
    place(S, pan(hp(rant, 200) * 1.0, 0.25), W["hurled"], 0.6)
    for k in range(6):
        place(S, pan(paper(r), r.uniform(-0.6, 0.4)), W["hurled"] + k * 0.18, 0.4)
    cue(W["hurled"], "Stephen rants (gibberish) + parchment flurry")
    place(S, fly(cf(5) - cw("the5"), r, 200), cw("the5"), 0.45); cue(cw("the5"), "silence: only the fly")
    # ---- guilty: gavel-like slam, gasps ----
    place(S, st(thunk(r, 55, 0.7)), W["guilty"] - 0.02, 1.0)
    gasps(S, W["guilty"] + 0.1, r); cue(W["guilty"], "slam + gasps")
    # ---- ripped robes, snipped fingers (three pops) ----
    place(S, st(rip(r, 0.45)), W["ripped"] - 0.03, 0.7); cue(W["ripped"], "robe ripped off")
    place(S, st(crack(r)), W["cut"] - 0.02, 0.7)
    for k in range(3):
        place(S, pan(pop(r, 600 + 150 * k), (k - 1) * 0.5), W["cut"] + 0.04 + 0.07 * k, 0.5)
    cue(W["cut"], "snip + pop pop pop (fingers)")
    # ---- the Tiber at night: water lapping, breeze, a heave, a big splash ----
    a, b = RIVER[0]
    place(S, G.water_bed(b - a, r, 0.8), a, 0.35); place(S, G.breeze(b - a, r, 0.5), a, 0.15)
    for k in range(2):
        place(S, pan(G.oof(r, "oof", 120 + 20 * k, 1.0), [-0.4, 0.4][k]), W["threw"] + 0.05 + 0.1 * k, 0.35)
    place(S, widen(G.whoosh(0.6, r, 0.4, 300, 2500), r), W["into"] - 0.05, 0.5)
    place(S, G.splash_big(r), W["tiber"] + 0.03, 1.0); cue(W["tiber"], "river night; heave, whoosh, SPLASH")
    # ---- earthquake: rumble, the crack, rubble, gasps ----
    q0, q1 = W["earthquake"] - 0.1, cf(8) - 0.3
    place(S, rumble(q1 - q0, r), q0, 1.0)
    place(S, st(crack(r)), W["cracked"] - 0.02, 1.0); place(S, st(G.wood_crack(r)), W["cracked"] + 0.05, 0.5)
    for k in range(7):
        tl = W["earthquake"] + 0.25 + k * 0.33 + np.sqrt(9.45 / 4.9)
        if tl < q1: place(S, pan(thunk(r, 90 + 10 * k, 0.35), r.uniform(-0.6, 0.6)), tl, 0.45)
    gasps(S, W["earthquake"] + 0.2, r, 8, 0.25); cue(W["earthquake"], "earthquake rumble, crack, rubble thuds, gasps")
    # ---- Rome disgusted: river by day, crowd 'eww' murmur, whispers; miracles: choir + sparkle + a whoop ----
    a, b = RIVER[1]
    place(S, G.water_bed(b - a, r, 0.6), a, 0.25); place(S, G.bird_chirps(b - a, r, 0.4), a, 0.12)
    place(S, murmur(cw("washed") - W["disgusted"], r, 7, 110, 210), W["disgusted"] - 0.1, 0.25)
    tk = W["rumors"]
    while tk < cw("washed") - 0.1:
        place(S, pan(whisper(r), r.uniform(-0.7, 0.7)), tk, 0.4); tk += 0.35
    cue(W["rumors"], "crowd grumble + whisper chain")
    sparkle(S, W["working"] - 0.05, r, gain=0.4); sparkle(S, W["miracles"], r, (91, 95, 98, 100, 103), 8, 0.4, 0.06)
    place(S, pan(G.hurrah(r, 140, 1.0), 0.4), W["miracles"] + 0.25, 0.35); cue(W["miracles"], "miracle sparkles + a whoop")
    # ---- overthrown: grab, whoosh, crash; prison: door slam + chains; strangled: rope creak + gasp ----
    place(S, widen(G.whoosh(0.4, r, 0.2, 400, 3000), r), W["overthrown"] - 0.1, 0.6)
    place(S, pan(G.oof(r, "oof", 160, 1.1), 0.2), W["overthrown"] + 0.1, 0.5)
    place(S, st(thunk(r, 70, 0.5)), W["overthrown"] + 0.42, 0.9); cue(W["overthrown"], "Stephen flung off the throne: whoosh, oof, crash")
    place(S, st(thunk(r, 50, 0.7)), cw("prison"), 1.0); place(S, pan(G.rattle(0.9, r, 20, None, True), -0.5), cw("prison") + 0.15, 0.4)
    cue(cw("prison"), "cell door slam + chains")
    place(S, pan(G.creak(0.8, r, 60, 100), -0.4), W["and4"] + 0.1, 0.4)
    place(S, pan(G.oof(r, "oh", 200, 0.8), 0.1), W["strangled"] + 0.05, 0.45); cue(W["strangled"], "the shadow: creak + choked gasp")
    # ---- St Peter's: verdict torn up, procession candles, the icons bow, the lid ----
    place(S, widen(G.whoosh(0.6, r, 0.5, 300, 2500), r), cf(10) - 0.3, 0.35)
    place(S, st(rip(r, 0.5)), W["cancelled"] - 0.03, 0.8)
    for k in range(5):
        place(S, pan(paper(r, 0.12), r.uniform(-0.6, 0.6)), W["cancelled"] + 0.15 + k * 0.12, 0.25)
    cue(W["cancelled"], "verdict torn up")
    for k in range(8):
        place(S, pan(G.whoosh(0.25, r, 0.4, 600, 3000), (k % 2) * 1.2 - 0.6), W["bowed"] - 0.15 + 0.16 * (k // 2) + (0.08 if k % 2 else 0), 0.25)
        place(S, I.glock(I.m2f(91 - k), 0.4, r, 1.0), W["bowed"] - 0.1 + 0.16 * (k // 2) + (0.08 if k % 2 else 0), 0.2)
    cue(W["bowed"], "icons bow: little swooshes + descending glock")
    place(S, st(scrape(r, 0.5, 150, 1500)), W["closed"] - 0.45, 0.6)
    place(S, st(thunk(r, 45, 0.8)), W["closed"] - 0.05, 1.0); cue(W["closed"], "stone lid scrapes + slams shut")
    place(S, st(thunk(r, 55, 0.6)), W["again"] - 0.05, 1.0)
    place(S, fly(DUR - W["again"] - 0.05, r, 240), W["again"] + 0.05, 0.35); cue(W["again"], "lid jolts; the fly buzzes out")
    return S


# ================================================================ score (E minor-ish, 96 bpm, 4/4)
BEAT = 60 / 96
CH = {"Em": [40, 52, 55, 59, 64], "Am": [45, 52, 57, 60, 64], "B": [47, 54, 59, 63, 66], "C": [48, 55, 60, 64, 67],
      "D": [50, 57, 62, 66, 69], "G": [43, 55, 59, 62, 67], "E": [40, 52, 56, 59, 64]}
# the Dies Irae (13th-century chant, public domain), first phrase, in E minor: G F# G E F# D E E
DIES = [55, 54, 55, 52, 54, 50, 52, 52]


def organ(M, notes, t0, t1, gain=0.5, warm=1200):
    place(M, I.pad([I.m2f(m) for m in notes], t1 - t0, 0.45, None, 0.25, 0.5, warm, 3.0), t0, gain)


def macabre(M, t0, t1, r, gain=1.0, octave=0):
    """plucked Dies Irae, staccato, over a low off-beat pizzicato"""
    t, k = t0, 0
    while t < t1 - 0.1:
        m = DIES[k % 8] + octave
        place(M, pan(I.pluck(I.m2f(m), 0.75, r, 0.35, 0.45), 0.15), t, gain)
        if k % 2 == 0:
            place(M, pan(I.pluck(I.m2f(40 + (0 if (k // 8) % 2 == 0 else 5)), 0.7, r, 0.3, 0.3), -0.25), t, gain * 0.7)
        t += BEAT / 2 * (2 if k % 8 == 7 else 1); k += 1


def march(M, t0, t1, r, gain=1.0):
    prog = ["Em", "B", "Em", "Am", "C", "B", "Em", "B"]
    t, k = t0, 0
    while t < t1 - 0.1:
        ch = CH[prog[k % 8]]
        for j in range(4):
            tj = t + j * BEAT
            if tj >= t1: break
            place(M, I.brass(I.m2f(ch[0] - 12 + (12 if ch[0] < 40 else 0) if j % 2 == 0 else ch[1] - 12), BEAT * 0.8, 0.6, r, "tuba"), tj, 0.4 * gain)
            place(M, pan(I.snare(0.5 if j % 2 else 0.35, r, 0.2, 1.0, 0.8), -0.25), tj, 0.18 * gain)
        place(M, I.timpani(I.m2f(ch[0] - 12 + (12 if ch[0] < 45 else 0)), 0.6, r, 1.0), t, 0.3 * gain)
        t += 4 * BEAT; k += 1


def sting(M, t, r, root=40, gain=1.0):
    for m in (root, root + 1, root + 7):
        place(M, I.brass(I.m2f(m + 12), 0.9, 0.9, r, "stab"), t - 0.02, 0.4 * gain)
    place(M, I.timpani(I.m2f(root - 12 + 12), 0.9, r, 2.0), t - 0.02, 0.75 * gain); place(M, I.cymbal(0.5, r, 2.0), t, 0.35 * gain)


def build_music():
    r = rng(904)
    M = buf()
    # hook: organ drone + the plucked Dies Irae
    organ(M, (40, 47, 52), 0.1, cf(1), 0.45)
    macabre(M, 0.3, cf(3) - 0.1, r, 0.85); cue(0.3, "music: organ drone + plucked Dies Irae")
    # Stephen named: a pompous brass fanfare on "Pope Stephen the Sixth"; the sneaky pluck continues for the defendant
    for k, m in enumerate((52, 59, 64)):
        place(M, I.brass(I.m2f(m), 0.5, 0.75, r, "stab"), W["stephen"] - 0.05 + k * 0.12, 0.35)
    place(M, I.timpani(I.m2f(40), 0.7, r, 1.6), W["sixth"] - 0.02, 0.55)
    # the deacon: tiptoeing high plucks
    for k in range(int((cf(4) - cf(3)) / (BEAT / 2))):
        place(M, pan(I.pluck(I.m2f([71, 74, 71, 76][k % 4]), 0.45, r, 0.2, 0.6), 0.3), cf(3) + 0.1 + k * BEAT / 2, 0.5)
    # the rant: the trial march (pompous), dead stop on "The corpse"
    march(M, cf(4), cw("the5") - 0.05, r, 1.0); cue(cf(4), "music: trial march under the rant, cut dead for the silence")
    # guilty: sting
    sting(M, W["guilty"], r); cue(W["guilty"], "music: brass + timpani sting on 'guilty'")
    # ripped/cut + river: Dies Irae low and slow, then the splash
    macabre(M, cf(6) + 0.1, cf(7) - 0.2, r, 0.8, -12)
    organ(M, (40, 47), cw("threw"), cf(7), 0.4, 600)
    # the earthquake: low cluster swelling
    organ(M, (28, 35, 41), cf(7), cf(8), 0.6, 400)
    place(M, I.timpani(I.m2f(28 + 12), 0.9, r, 2.5), W["cracked"] - 0.02, 0.8); cue(W["cracked"], "music: low organ cluster, timpani on 'cracked'")
    # Rome disgusted / rumours: sneaky plucks; miracles: bright major choir pad
    macabre(M, cf(8) + 0.1, W["washed"] - 0.1, r, 0.7, 12)
    organ(M, (52, 56, 59, 64, 68, 71), cw("washed"), cf(9), 0.55, 2600); cue(cw("washed"), "music: E major 'choir' pad for the miracles")
    # Stephen's fall: march fragment, sting on "strangled"
    march(M, cf(9), cw("prison"), r, 0.9)
    organ(M, (40, 41, 47), cw("prison"), cf(10), 0.5, 500)
    sting(M, W["strangled"], r, 41, 0.9)
    # St Peter's: warm organ hymn chords (G - D - Em - C - G), glock on "bowed"
    t, prog = cf(10), ["G", "D", "Em", "C", "G", "D", "G"]
    k = 0
    while t < cw("until") - 0.1:
        ch = CH[prog[k % len(prog)]]
        organ(M, (ch[0], ch[2], ch[3], ch[4] + 12), t, min(cw("until"), t + 4 * BEAT + 0.3), 0.42, 1600)
        t += 4 * BEAT; k += 1
    cue(cf(10), "music: organ hymn for the reburial")
    sting(M, W["closed"], r, 43, 0.7)
    # Sergius: the Dies Irae returns, faster, sting on "guilty" again, and a last stab on "again"
    macabre(M, cw("until") + 0.05, W["guilty2"] - 0.1, r, 0.9)
    sting(M, W["guilty2"], r)
    sting(M, W["again"], r, 40, 1.0)
    for k, m in enumerate(CH["Em"]):
        place(M, I.pluck(I.m2f(m), 0.7, r, 2.2, 0.6), W["again"] + 0.02 + 0.03 * k, 0.7)
    cue(W["guilty2"], "music: Dies Irae reprise, stings on 'guilty' and 'again'")
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
    # rooms: a big stone basilica, a stone crypt/cell, open air by the river; voice stays dry
    bas = sum(env_seg(a, b, 0.2, 0.3) for a, b in BASILICA)
    cel = sum(env_seg(a, b, 0.2, 0.3) for a, b in CRYPT + PRISON)
    out = np.clip(1 - bas - cel, 0, 1)
    church, stone, air = make_ir(2.6, 7), make_ir(1.0, 11), make_ir(0.4, 3)

    def wet(x, k):
        return (x + k * (convolve_st(x * bas, church)[:, :N] + convolve_st(x * cel, stone)[:, :N] + 0.4 * convolve_st(x * out, air)[:, :N]))
    S, M = wet(S, 0.25), wet(M, 0.3)
    # "The corpse stayed silent": the music and beds drop out (only the fly)
    t = np.arange(N) / SR
    hush = 1 - env_seg(cw("the5") + 0.02, cf(5) - 0.05, 0.05, 0.1)
    M *= hush
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
