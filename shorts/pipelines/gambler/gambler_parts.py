# The Gambler-specific parts of gambler_sound.py, spliced over the shared helpers + mix of the Dancing short's sound
# script (dancing_sound.py). Run: python3 gambler_parts.py  -> gambler_sound.py next to this file.
import os
HERE = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(HERE, "..", "dancing", "dancing_sound.py")).read()

HEADER = '''# Sound for "Granny Bet the Whole Fortune on Zero" (The Gambler, Dostoyevsky, 1866): synthesized SFX + an original score:
# a lilting spa-band waltz in 3/4 on the hotel verandah, a quicker casino waltz with roulette whirrs, ball clatter and coin
# avalanches, a deflating trombone when Granny loses, a snare roll into a cymbal crash on "bank", champagne in Paris, the
# waltz in a minor key for the deaths and the debtors' prison (with a silent beat before the stroke), a ticking pizzicato
# for the dictation, wedding bells, and the opening waltz again, softly, for the loop.
# Usage: ~/tts/chatterbox/bin/python gambler_sound.py  ->  ~/gambler-short/audio/mix.wav, stems/*.wav, cues.md
'''
SETS = '''# sets on the timeline (s), from story.ts SHOTS
SPA = [(0.0, cf(3)), (cf(15), DUR)]
CASINO = [(cf(3), cf(9))]
PARIS = [(cf(9), cf(12)), (cw("then5"), cf(13))]
CELL = [(cf(12), cw("then5"))]
STUDYT = [(cf(13), cf(15))]
COTTAGE = CELL + STUDYT   # small rooms (reverb)
PLAZA = CASINO            # the gaming salon (reverb)
INSIDE = COTTAGE + PLAZA + PARIS
'''

PARTS = r'''
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
'''

out = HEADER + src[src.index("import os, sys, json, wave"):]
out = out.replace('ROOT = os.path.expanduser("~/dancing-short")', 'ROOT = os.path.expanduser("~/gambler-short")')
a = out.index("# sets on the timeline (s), from story.ts SHOTS"); b = out.index("cues = []")
out = out[:a] + SETS + out[b:]
a = out.index("CROWD = None\n\n\ndef stamps"); b = out.index("# ================================================================ mix")
out = out[:a] + "CROWD = None\n" + PARTS.lstrip("\n") + "\n\n" + out[b:]
open(os.path.join(HERE, "gambler_sound.py"), "w").write(out)
print("wrote gambler_sound.py")
