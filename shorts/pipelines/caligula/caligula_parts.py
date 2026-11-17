# The Caligula-specific parts of caligula_sound.py, spliced over the shared helpers + mix of the Dancing short's sound
# script (dancing_sound.py). Run: python3 caligula_parts.py  -> caligula_sound.py next to this file.
import os
HERE = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(HERE, "..", "dancing", "dancing_sound.py")).read()

HEADER = '''# Sound for "Caligula Marched His Army to the Beach to Fight the Sea" (Gaul, AD 40): synthesized SFX + an original score:
# a pompous Roman brass-and-drum march that deflates with a trombone slide on the U-turn, dead silence for "Nobody knew",
# a snare roll into a cymbal crash on "seashells", a silly pizzicato march for the shell-collecting, fanfares for the
# "spoils" and the lighthouse, a low sting when the torches go out, a slow swell for the centuries, then the storm.
# Usage: ~/tts/chatterbox/bin/python caligula_sound.py  ->  ~/caligula-short/audio/mix.wav, stems/*.wav, cues.md
'''
SETS = '''# sets on the timeline (s), from story.ts SHOTS
STUDY = [(cf(1), cw("it"))]
CURIA = [(cf(3), cf(4))]
CORR = [(cf(12), cf(13))]
BEACHT = [(0.0, cf(1)), (cw("it"), cf(3)), (cf(4), cf(12)), (cf(13), cf(14)), (cf(15), DUR)]
STORMT = [(cf(14), cf(15))]
COTTAGE = STUDY + CORR   # small rooms (reverb)
PLAZA = CURIA            # the Senate house (reverb)
INSIDE = COTTAGE + PLAZA
'''

PARTS = r'''
def gull(r, f=1500):
    """a herring gull's 'kee-ow': a falling squeal with a rough edge"""
    d = r.uniform(0.35, 0.55); t = tt(d)
    f0 = f * (1.25 - 0.45 * t / d)
    y = np.sin(2 * np.pi * np.cumsum(f0) / SR) + 0.35 * np.sin(4 * np.pi * np.cumsum(f0) / SR)
    y *= (0.6 + 0.4 * np.sign(np.sin(2 * np.pi * 34 * t))) * np.sin(np.pi * t / d) ** 0.6
    return fades(bp(y, 600, 5000), 0.01, 0.06)


def ratchet(S, t0, n, r, gain=0.2, p=0.0, step=0.07):
    for k in range(n): place(S, pan(tok(r, r.uniform(1500, 1900), 1.1), p), t0 + k * step, gain)


def shing(r):
    """a sword drawn: a bright metallic scrape ringing off"""
    t = tt(0.8)
    y = 0.6 * hp(r.standard_normal(len(t)), 4000) * np.exp(-t / 0.08)
    for f in (2950, 4410, 6230): y += 0.25 * np.sin(2 * np.pi * f * t) * np.exp(-t / 0.35)
    return fades(y, 0.002, 0.2)


def thunder(r, dur=3.0):
    n = ns(dur); t = np.arange(n) / SR
    y = lp(r.standard_normal(n), 220) * (np.exp(-t / 1.1) + 0.6 * np.exp(-((t - 0.25) / 0.15) ** 2)) + 0.4 * bp(r.standard_normal(n), 300, 2500) * np.exp(-t / 0.08)
    return fades(y, 0.005, 0.6)


def rumble(r, dur=2.5, f=90):
    n = ns(dur); t = np.arange(n) / SR
    y = lp(r.standard_normal(n), f) * np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 0.5 + 0.3 * lp(r.standard_normal(n), 900) * np.exp(-t / 0.4)
    return fades(y, 0.02, 0.4)


def scratch(r, dur=0.25):
    """a quill on parchment"""
    n = ns(dur); t = np.arange(n) / SR
    return fades(bp(r.standard_normal(n), 2500, 8000) * (0.5 + 0.5 * np.sin(2 * np.pi * 18 * t)) ** 2, 0.01, 0.05)


def oars(S, a, b, r, rate=0.75, gain=0.12, p=0.0):
    t = a
    while t < b:
        place(S, pan(fades(bp(r.standard_normal(ns(0.35)), 500, 3500) * np.exp(-tt(0.35) / 0.12), 0.02, 0.1), p), t, gain)
        place(S, pan(G.creak(0.3, r, 70, 110), p), t + 0.15, gain * 0.5)
        t += 1 / rate


def tramp(S, a, b, r, rate=2.2, gain=0.3):
    """a legion marching in step on sand: one heavy massed footfall per step"""
    t = a
    while t < b:
        x, pre = G.column_stomp(r, 0.6, 0, 40, 0.012, 0.8, 0.5)
        place(S, x, t - pre, gain); t += 1 / rate


def clatter(S, a, b, r, rate=14, gain=0.1):
    """shells dropped into bronze helmets"""
    t = a
    while t < b:
        place(S, pan(G.clink(r, r.uniform(1800, 3800), 0.08, 0.8), r.uniform(-0.7, 0.7)), t, gain * r.uniform(0.5, 1.0)); t += r.exponential(1 / rate)


def build_sfx():
    global CROWD
    CROWD = buf()
    r = rng(40)
    S = buf()
    # ---- ambiences ----
    for a, b in BEACHT:
        place(S, G.water_bed(b - a, r, 0.7, 0.35), a, 0.12); place(S, G.breeze(b - a, r, 0.4, bright=1400), a, 0.05)
        t = a + 0.6
        while t < b - 0.6: place(S, pan(gull(r, r.uniform(1300, 1800)), r.uniform(-0.8, 0.8)), t, 0.035); t += r.uniform(2.5, 4.5)
    for a, b in STORMT:
        place(S, rain_bed(b - a, r, 1.0), a, 0.3); place(S, G.water_bed(b - a, r, 1.0, 0.8), a, 0.15)
    for a, b in CORR:
        place(S, pan(hiss(r, b - a, 1200), -0.3), a, 0.03)  # torch crackle bed
    place(S, hum(cw("it") - cf(1), r), cf(1), 0.02)
    cue(0.0, "beach: surf + gulls + breeze; storm: rain; corridor: torch hiss")
    # ---- 1: the wave slaps the emperor ----
    place(S, st(G.splash_big(r)), W["ocean"] - 0.12, 0.5); place(S, pan(G.oof(r, "ugh", 150, 1.0), 0.1), W["ocean"] + 0.25, 0.25)
    cue(W["ocean"], "a wave slaps him: splash + splutter")
    # ---- 2: the historian's quill ----
    for k in range(3): place(S, pan(scratch(r), 0.2), cf(1) + 0.2 + 0.32 * k, 0.15)
    place(S, pan(tok(r, 1200, 0.7), 0.2), W["suetonius"] + 0.05, 0.12)
    # ---- 3: the legion marches down ----
    tramp(S, cw("it"), cf(2) - 0.3, r, 2.2, 0.35)
    cue(cw("it"), "the legion tramps down to the shore")
    # ---- 4: little boots, the fist ----
    for k in range(3): place(S, pan(squeak_rise(r, 0.12), 0.4), W["little"] + 0.12 * k, 0.12)
    place(S, pan(G.whoosh(0.3, r, 0.3, 500, 3500), 0.0), W["war"] - 0.15, 0.2); place(S, st(thump(r, 70, 0.2)), W["war"] + 0.05, 0.35)
    # ---- 5-6: the Senate: the white cloth, the endless letter, polite applause ----
    place(S, pan(G.oof(r, "oh", 140, 1.0), 0.1), W["surrendered"] + 0.1, 0.12)
    place(S, pan(fades(lp(G.rattle(W["submitted"] - cw("so"), r, 18.0), 3000), 0.1, 0.3), 0.0), cw("so") + 0.1, 0.12)
    place(S, G.applause(2.0, r, 12), W["submitted"] + 0.05, 0.18)
    for a, b in CURIA:
        mm = murmur(b - a, r, 8)
        place(CROWD, mm if np.ndim(mm) == 2 else st(mm), a, 1.0)
    cue(W["submitted"], "scroll unrolling; polite senatorial applause")
    # ---- 7: ballistas wound up ----
    for k, x in enumerate((-0.6, -0.2, 0.2, 0.6)): ratchet(S, W["catapults"] - 0.05 + 0.12 * k, 5, r, 0.12, x)
    place(S, pan(gull(r, 1700), 0.5), W["waves"], 0.08)
    cue(W["catapults"], "ballista ratchets clicking")
    # ---- 8: out and straight back ----
    oars(S, cf(5) + 0.1, W["back"], r, 0.9, 0.12, 0.2)
    place(S, st(thump(r, 65, 0.4)), W["back"] + 0.02, 0.45); place(S, pan(G.wood_crack(r), 0.0), W["back"] + 0.04, 0.12)
    cue(W["back"], "oars; the hull bumps the beach")
    # ---- 10-11: the sword at the sand, the shell ----
    place(S, pan(shing(r), 0.2), W["order"] - 0.05, 0.3); place(S, st(thump(r, 90, 0.15)), W["order"] + 0.25, 0.25)
    place(S, pan(I.glock(I.m2f(96), 0.7, r, 1.4), 0.0), W["seashells"], 0.35)
    cue(W["order"], "sword 'shing' + stab into the sand; a 'ding' on the shell")
    # ---- 12: shells clattering into helmets; the crab ----
    clatter(S, cf(8) + 0.05, W["tunics"] + 0.4, r, 16, 0.12)
    place(S, pan(tok(r, 3200, 1.3), 0.3), W["tunics"] - 0.02, 0.4); place(S, pan(G.oof(r, "oof", 160, 1.15), 0.1), W["tunics"] + 0.08, 0.35)
    cue(W["tunics"], "the crab's snip + 'ow'")
    # ---- 13: spoils ----
    place(S, I.pad([I.m2f(m) for m in (60, 64, 67, 72)], 1.6, 0.5, r, 0.15, 0.6), W["spoils"] - 0.05, 0.12)
    for k in ("jupiters", "palace"): sparkle(S, W[k] - 0.05, r, (84, 88, 91, 96), 4, 0.25, 0.06)
    # ---- 14: the lighthouse, block by block; the fire ----
    span = max(0.5, W["victory"] - W["lighthouse"])
    for k in range(12): place(S, pan(thump(r, 110 + 6 * k, 0.12), -0.3), W["lighthouse"] - 0.1 + (k + 0.6) * span / 12, 0.22)
    place(S, pan(G.whoosh(0.8, r, 0.4, 150, 1200), -0.2), W["victory"] - 0.1, 0.3); place(S, pan(hiss(r, 1.2, 1500), -0.2), W["victory"] + 0.1, 0.1)
    cue(W["lighthouse"], "stone blocks thunk into place; fire whoomph on 'victory'")
    # ---- 15: the purse ----
    place(S, pan(G.whoosh(0.4, r, 0.25, 600, 3000), -0.3), W["paid"] + 0.1, 0.15)
    jingle(S, W["coins"] - 0.02, r, 1.0, 0.3)
    # ---- 16: the legion trudges off, shells rattling ----
    tramp(S, cf(11) + 0.1, cf(12) - 0.2, r, 1.8, 0.2); clatter(S, cf(11) + 0.1, cf(12) - 0.2, r, 8, 0.06)
    jingle(S, W["rich"] - 0.02, r, 0.6, 0.18)
    # ---- 17: corridor footsteps; the torches go out ----
    t = cf(12) + 0.1
    while t < W["killed"]: place(S, pan(G.boot(r, 0.5), 0.0), t, 0.18); t += 0.62
    place(S, pan(G.whoosh(0.6, r, 0.5, 120, 900), 0.0), W["killed"] - 0.03, 0.5)
    cue(W["killed"], "the torches gutter out (no violence heard)")
    # ---- 18-19: sand trickle; the centuries tick by ----
    place(S, pan(hiss(r, 1.2, 4000), 0.0), W["gone"] - 0.1, 0.1)
    t, step = W["but"] + 0.3, 0.5
    while t < cf(14) - 0.3: place(S, pan(tok(r, 1400, 0.9), 0.2), t, 0.08); t += step; step = max(0.08, step * 0.85)
    place(S, G.crickets(cf(14) - cw("but"), r, 1), cw("but"), 0.05)
    cue(W["but"], "a clock tick accelerating through the centuries")
    # ---- 20: the storm of 1644 ----
    for tl in LIGHTNING_T: place(S, st(thunder(r, 3.0)), tl + 0.05, 0.45)
    place(S, st(G.timber_tear(r, 1.2)), W["collapsed"] - 0.05, 0.25); place(S, st(rumble(r, 3.0, 80)), W["collapsed"], 0.6)
    place(S, st(G.splash_big(r)), W["collapsed"] + 0.9, 0.5)
    cue(W["collapsed"], "rock crack, a long collapse rumble, a big splash")
    # ---- 21: the wave crash into the loop ----
    place(S, st(G.splash_big(r)), W["beat"] - 0.1, 0.45)
    # ---- whooshes on the cuts ----
    for tx in (cf(1), cw("it"), cf(2), cf(3), cf(4), cf(7), cw("seashells"), cf(9), cf(10), cf(11), cf(13), cf(15)):
        place(S, widen(G.whoosh(0.45, r, 0.25, 400, 3500), r), tx - 0.2, 0.12)
    return S

# ================================================================ score
E8M = 60 / 108 / 2   # march: one eighth at 108 bpm (2/4)
CH = {"C": [36, 60, 64, 67], "G": [43, 59, 62, 67], "F": [41, 60, 65, 69], "Am": [45, 60, 64, 69], "Dm": [38, 62, 65, 69], "E": [40, 59, 64, 68]}
MARCHP = ["C", "C", "F", "G", "C", "Am", "G", "C"]
MARCH = [60, 0, 67, 67, 67, 0, 72, 0, 71, 69, 67, 0, 65, 64, 62, 0, 60, 0, 64, 67, 72, 0, 76, 0, 74, 72, 71, 74, 72, 0, 67, 0]
PIZZ = [72, 0, 74, 0, 76, 72, 0, 67, 69, 0, 71, 0, 72, 0, 0, 0]


def march(M, t0, t1, r, gain=1.0, tune=True):
    """a Roman triumph: tuba bass, horn stabs, snare, timpani on the downbeats, a horn tune (cornu-like)"""
    t, k = t0, 0
    while t < t1 - 0.05:
        bar = (k // 4) % 8; ch = CH[MARCHP[bar]]; j = k % 4
        if j == 0: place(M, pan(I.brass(I.m2f(ch[0]), E8M * 0.8, 0.7, r, "tuba"), -0.1), t, gain * 0.3)
        if j == 2: place(M, pan(I.brass(I.m2f(ch[0] + 7), E8M * 0.8, 0.5, r, "tuba"), -0.1), t, gain * 0.22)
        if j in (1, 3):
            for m in ch[1:]: place(M, pan(I.brass(I.m2f(m), E8M * 0.6, 0.4, r, "stab"), 0.25), t, gain * 0.05)
        place(M, pan(I.snare(0.6 if j in (0, 2) else 0.3, r, 0.2), 0.15), t, gain * (0.16 if j in (0, 2) else 0.08))
        if j == 0 and bar in (0, 4): place(M, pan(I.timpani(I.m2f(36), 0.6, r, 0.9), 0.0), t, gain * 0.32)
        m = MARCH[k % 32]
        if tune and m: place(M, pan(I.brass(I.m2f(m), E8M * 1.6, 0.6, r, "horn"), 0.2), t, gain * 0.13)
        t += E8M; k += 1


def pizz(M, t0, t1, r, gain=1.0):
    """the silly tiptoe march for the shell-collecting: plucked strings + a woodblock"""
    e = 60 / 132 / 2
    t, k = t0, 0
    while t < t1 - 0.05:
        if k % 2 == 0: place(M, pan(I.pluck(I.m2f(48 if (k // 4) % 2 == 0 else 43), 0.6, r, 0.7, 0.4), -0.2), t, gain * 0.25)
        m = PIZZ[k % 16]
        if m: place(M, pan(I.pluck(I.m2f(m), 0.6, r, 0.5, 0.7), 0.25), t, gain * 0.18)
        if k % 4 == 1: place(M, pan(tok(r, 800, 0.8), 0.1), t, gain * 0.1)
        t += e; k += 1


def fanfare(M, t, r, gain=1.0, root=60):
    for k, m in enumerate((root, root + 4, root + 7, root + 12)): place(M, pan(I.brass(I.m2f(m), 0.18 if k < 3 else 0.7, 0.8, r, "horn"), 0.1), t + 0.12 * k, gain * 0.25)
    place(M, pan(I.cymbal(0.5, r, 1.4), 0.0), t + 0.36, gain * 0.15)


def slide(M, t, r, gain=1.0):
    """a deflating trombone slide down"""
    place(M, pan(I.brass(I.m2f(55), 1.0, 0.6, r, "horn", fall=-700), 0.1), t, gain * 0.35)


def build_music():
    r = rng(40)
    M = buf()
    march(M, 0.05, cf(1) - 0.05, r, 0.95); cue(0.05, "music: pompous Roman brass march")
    place(M, pan(I.cymbal(0.8, r, 1.6), 0.0), W["ocean"] - 0.02, 0.22); place(M, pan(I.brass(I.m2f(48), 0.4, 0.9, r, "stab"), 0.0), W["ocean"] - 0.02, 0.3)
    place(M, I.pad([I.m2f(m) for m in (48, 55, 60, 64)], cw("it") - cf(1), 0.4, r, 0.3, 0.5), cf(1), 0.08)  # the study: a held chord
    march(M, cw("it"), W["back"] - 0.1, r, 0.75); cue(cw("it"), "music: the march through the set-up")
    slide(M, W["back"] - 0.12, r, 1.0); cue(W["back"], "music: trombone slide down on the U-turn")
    cue(cf(6), "music: dead silence for 'Nobody knew'")
    for ts, v in I.snare_roll(W["order"] - 0.1, W["seashells"] - 0.03, 0.15, 0.8, r): place(M, pan(I.snare(v, r, 0.12, 1.0, 1.0, True), 0.1), ts, 0.12)
    place(M, pan(I.cymbal(0.9, r, 2.2), 0.0), W["seashells"] - 0.02, 0.3); place(M, pan(I.timpani(I.m2f(36), 0.9, r, 1.5), 0.0), W["seashells"] - 0.02, 0.35)
    cue(W["seashells"], "music: snare roll into a cymbal crash")
    pizz(M, cf(8), cf(9) - 0.05, r, 1.0); cue(cf(8), "music: silly pizzicato tiptoe march")
    fanfare(M, W["spoils"] - 0.05, r, 0.9); cue(W["spoils"], "music: a triumphal fanfare")
    march(M, cf(9) + 0.9, cf(12) - 0.25, r, 0.6, tune=True)
    fanfare(M, W["victory"] - 0.05, r, 0.8, 62); fanfare(M, W["rich"] - 0.05, r, 0.8, 64)
    place(M, pan(I.timpani(I.m2f(31), 1.0, r, 2.5), 0.0), W["killed"] - 0.02, 0.4)
    place(M, pan(I.brass(I.m2f(37), 1.6, 0.8, r, "soft"), 0.0), W["killed"] - 0.02, 0.3)
    place(M, I.pad([I.m2f(m) for m in (37, 44, 49)], cf(13) - cf(12), 0.4, r, 0.5, 0.3, 500), cf(12), 0.06)
    cue(W["killed"], "music: march out; a low sting on 'killed'")
    t = cf(13) + 0.2
    for ch in ((48, 55, 64, 72), (45, 52, 60, 69), (41, 48, 57, 65), (43, 50, 59, 67)):
        d = (cf(14) - cf(13)) / 4
        place(M, I.pad([I.m2f(m) for m in ch], d + 0.5, 0.5, r, 0.4, 0.6), t, 0.16); t += d
    cue(cf(13), "music: a slow, grand swell for the centuries")
    place(M, I.pad([I.m2f(m) for m in (38, 45, 50, 53)], cf(15) - cf(14), 0.5, r, 0.4, 0.8, 600), cf(14), 0.12)
    for ts, v in I.snare_roll(W["collapsed"] - 1.0, W["collapsed"] - 0.02, 0.1, 0.6, r, 18.0): place(M, pan(I.timpani(I.m2f(38), v, r, 0.6), 0.0), ts, 0.12)
    place(M, pan(I.cymbal(1.0, r, 2.6), 0.0), W["collapsed"] - 0.02, 0.3)
    place(M, I.pad([I.m2f(m) for m in (48, 55, 60, 64)], DUR - cf(15), 0.4, r, 0.6, 0.6), cf(15), 0.07)
    place(M, pan(I.cymbal(0.6, r, 1.4), 0.0), W["beat"] - 0.02, 0.18); place(M, pan(I.brass(I.m2f(48), 0.4, 0.9, r, "stab"), 0.0), W["beat"] - 0.02, 0.25)
    cue(cf(15), "music: soft chord over the surf; a stab on 'beat' into the loop")
    return M
'''

out = HEADER + src[src.index("import os, sys, json, wave"):]
out = out.replace('ROOT = os.path.expanduser("~/dancing-short")', 'ROOT = os.path.expanduser("~/caligula-short")')
a = out.index("# sets on the timeline (s), from story.ts SHOTS"); b = out.index("cues = []")
out = out[:a] + SETS + "LIGHTNING_T = [(cf(14) * FPS + 4 + 3) / FPS, W[\"collapsed\"] - 2 / FPS, W[\"tower\"] + 6 / FPS]\n" + out[b:]
a = out.index("CROWD = None\n\n\ndef stamps"); b = out.index("# ================================================================ mix")
out = out[:a] + "CROWD = None\n" + PARTS.lstrip("\n") + "\n\n" + out[b:]
open(os.path.join(HERE, "caligula_sound.py"), "w").write(out)
print("wrote caligula_sound.py")
