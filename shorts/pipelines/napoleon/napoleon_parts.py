# The Napoleon-specific parts of napoleon_sound.py, spliced over the shared helpers + mix of the Dancing short's sound
# script (dancing_sound.py). Run: python3 napoleon_parts.py  -> napoleon_sound.py next to this file.
import os, re
HERE = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(HERE, "..", "dancing", "dancing_sound.py")).read()

HEADER = '''# Sound for "Napoleon Was Ambushed by a Thousand Bunnies" (Berthier's rabbit shoot, 1806): synthesized SFX + an original
# score: a pompous fife-and-snare march for the Emperor's glory that cuts dead on "raised", silence for "didn't run", a
# frantic galop for the charge and the flank attack, a plonk sting before the reveal, a sneaky bassoon walk under the
# explanation, a sad-trombone wah-wah on "mortified", and the march again for the loop. Ducked under the voice.
# Usage: ~/tts/chatterbox/bin/python napoleon_sound.py  ->  ~/napoleon-short/audio/mix.wav, stems/*.wav, cues.md
'''
SETS = '''# sets on the timeline (s), from story.ts SHOTS
END16 = (round(W["field"] * FPS) + 14) / FPS
TENT = [(0.0, cw("bunnies")), (cw("because"), DUR)]
PARKT = [(cw("bunnies"), cw("because"))]
PAVT = [(cf(6), cf(7)), (cf(15), cw("because"))]
COTTAGE = TENT   # the tent: small room (reverb)
PLAZA = []
INSIDE = COTTAGE
'''

PARTS = r'''
def crack(r):
    """a whip crack: a supersonic snap (click + bright noise burst) and a short slap tail"""
    t = tt(0.25)
    y = 1.4 * hp(r.standard_normal(len(t)), 2500) * np.exp(-t / 0.004) + 0.5 * bp(r.standard_normal(len(t)), 800, 4000) * np.exp(-t / 0.03)
    return fades(y, 0.0003, 0.05)


def clop(r, f=520):
    """a hoof on gravel"""
    return fades(tok(r, f * r.uniform(0.9, 1.1), 0.6) + 0.4 * bp(r.standard_normal(ns(0.12)), 1500, 6000) * np.exp(-tt(0.12) / 0.02), 0.0005, 0.03)


def hooves(S, a, b, r, rate=6.5, gain=0.22, p=0.0):
    t = a
    while t < b:
        for k in range(2): place(S, pan(clop(r, r.uniform(420, 620)), p + r.uniform(-0.15, 0.15)), t + k * 0.07, gain * r.uniform(0.6, 1.0))
        t += 2 / rate


def wheels(S, a, b, r, gain=0.12, p=0.0):
    d = max(0.2, b - a)
    place(S, pan(fades(lp(G.rattle(d, r, 22.0), 2500), 0.2, 0.4), p), a, gain)


def paws(S, a, b, r, rate=30.0, gain=0.12, low=True):
    """a thousand little feet: dense soft thumps (low = a drumming rumble)"""
    t = a
    while t < b:
        f = r.uniform(70, 120) if low else r.uniform(160, 260)
        place(S, pan(thump(r, f, 0.09), r.uniform(-0.8, 0.8)), t, gain * r.uniform(0.4, 1.0)); t += r.exponential(1 / rate)


def eek(r, f=1800):
    t = tt(0.14)
    ff = f * (1 + 0.25 * np.sin(np.pi * t / 0.14))
    return fades(np.sin(2 * np.pi * np.cumsum(ff) / SR) * np.exp(-t / 0.06), 0.003, 0.03)


def munch(r):
    n = ns(0.18); t = np.arange(n) / SR
    return fades(bp(r.standard_normal(n), 900, 5000) * np.exp(-t / 0.04) * (0.6 + 0.4 * np.sign(np.sin(2 * np.pi * 40 * t))), 0.002, 0.04)


def growl(r, dur=0.9):
    """a hungry tummy rumble"""
    n = ns(dur); t = np.arange(n) / SR
    y = bp(r.standard_normal(n), 60, 260) * (0.5 + 0.5 * np.sin(2 * np.pi * np.cumsum(5 + 3 * t) / SR)) + 0.3 * np.sin(2 * np.pi * np.cumsum(90 - 30 * t / dur) / SR)
    return fades(y * np.sin(np.pi * t / dur), 0.02, 0.1)


def kettle(r, dur=1.4):
    n = ns(dur); t = np.arange(n) / SR
    f = 1700 + 500 * np.clip(t / 0.5, 0, 1) + 30 * np.sin(2 * np.pi * 6 * t)
    return fades(0.6 * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.clip(t / 0.3, 0, 1) + 0.3 * hp(r.standard_normal(n), 3000), 0.05, 0.2)


def laugh(r, base=None, dur=None, woman=False):
    """one person's 'ha-ha-ha': voiced 'A' pulses at ~5.5 Hz, pitch falling, breathy"""
    base = base or (r.uniform(200, 250) if woman else r.uniform(105, 150))
    dur = dur or r.uniform(1.4, 2.2)
    n = ns(dur); t = np.arange(n) / SR
    rate = r.uniform(4.8, 6.2)
    pulse = np.clip(np.sin(2 * np.pi * rate * t), 0, 1) ** 1.5
    f0 = base * (1.35 - 0.4 * t / dur) * (1 + 0.08 * pulse)
    forms = G.vowel_track(n, [(0, "A")])
    y = G.vox(f0, forms, pulse * np.clip(t / 0.05, 0, 1) * np.clip((dur - t) / 0.3, 0, 1), r, 1.15 if woman else 1.0, breath=0.3)
    return fades(lp(y, 3400), 0.01, 0.1)


def hunting_horn(S, t0, r, gain=0.2):
    for k, (m, d) in enumerate([(60, 0.3), (67, 0.3), (72, 0.6), (67, 0.3), (72, 0.9)]):
        place(S, pan(I.brass(I.m2f(m), d, 0.5, r, "horn"), -0.4), t0 + sum(x[1] for x in [(60, 0.3), (67, 0.3), (72, 0.6), (67, 0.3)][:k]), gain)


CROWD = None


def build_sfx():
    global CROWD
    CROWD = buf()
    r = rng(1806)
    S = buf()
    # ---- ambiences ----
    for a, b in PARKT:
        place(S, G.breeze(b - a, r, 0.35, bright=1200), a, 0.08); place(S, G.bird_chirps(b - a, r, 0.3, "sparrow"), a, 0.07)
    for a, b in TENT:
        place(S, G.breeze(b - a, r, 0.6, bright=500), a, 0.06)
        place(S, pan(G.creak(min(1.0, b - a), r, 60, 90), 0.3), a + 0.4, 0.06)
    cue(0.0, "tent: canvas breeze; park: birds + breeze")
    # ---- 1: flags planted on the map (tent.pose timing) ----
    span = max(0.5, W["europe"] + 0.5 - W["conquered"])
    for k in range(8): place(S, pan(tok(r, r.uniform(1300, 1600), 0.6), -0.4 + 0.1 * k), W["conquered"] - 0.1 + (k + 0.6) * span / 8, 0.22)
    cue(W["conquered"], "little pins tapped into the map, one per flag")
    # ---- 2: the hook: a stampede at the lens ----
    place(S, widen(G.whoosh(0.5, r, 0.3, 300, 3500), r), W["bunnies"] - 0.3, 0.3)
    paws(S, W["bunnies"] - 0.12, cf(1) + 0.1, r, 45, 0.2)
    for k in range(5): place(S, pan(eek(r, r.uniform(1600, 2400)), r.uniform(-0.6, 0.6)), W["bunnies"] + 0.05 * k, 0.12)
    cue(W["bunnies"], "a stampede of little feet + squeaks at the lens")
    # ---- 3: hunting horn, the coach up the drive ----
    hunting_horn(S, cf(1) + 0.3, r, 0.12)
    hooves(S, cf(1) + 0.1, cf(2) - 0.6, r, 6.5, 0.16, -0.3); wheels(S, cf(1) + 0.1, cf(2) - 0.6, r, 0.08, -0.3)
    cue(cf(1), "a distant hunting horn; hooves + wheels on the gravel")
    # ---- 4: the court pops in ----
    for k in range(3): place(S, pan(bloop(r, 560, 200), -0.4 + 0.4 * k), W["court"] + 0.15 * k, 0.25)
    place(S, pan(G.oof(r, "oh", 120, 0.95), 0.0), W["entertained"] + 0.1, 0.12)
    # ---- 6: the empty lawn: a tumbleweed and a cricket ----
    place(S, pan(fades(lp(G.rattle(2.4, r, 9.0), 1800), 0.2, 0.5), 0.0), W["except"] - 0.4, 0.12)
    place(S, G.crickets(1.8, r, 1), W["except"] - 0.1, 0.12)
    cue(W["except"], "tumbleweed rattle + one lonely cricket")
    # ---- 7: the hutch doors drop, the rabbits pour out ----
    for i in range(8):
        place(S, pan(tok(r, r.uniform(380, 460), 0.8), -0.6 + 0.17 * i), W["loose"] - 0.05 + 0.45 * (1 + 0.08 * i) / 1.6, 0.35)
    paws(S, W["loose"] + 0.1, cf(6) - 0.1, r, 26, 0.08, False)
    cue(W["loose"], "hutch doors clatter open, a patter of tiny feet")
    # ---- 8: breakfast, then the gun ----
    for k in range(6): place(S, pan(G.clink(r, r.uniform(2600, 4200), 0.1, 0.9), r.uniform(-0.5, 0.5)), cf(6) + 0.3 + 0.35 * k, 0.1)
    for k in range(3): place(S, pan(munch(r), 0.1), W["splendid"] + 0.4 * k + 0.1, 0.3)
    place(S, pan(tok(r, 1900, 1.2), 0.1), W["raised"] + 0.05, 0.4); place(S, pan(G.clink(r, 3000, 0.08, 1.0), 0.1), W["raised"] + 0.2, 0.3)
    cue(W["raised"], "the gun is cocked: click-clack")
    # ---- 9: they all turn to look ----
    place(S, pan(I.glock(I.m2f(96), 0.5, r, 0.6), 0.0), W["run"], 0.3)
    # ---- 10-11: bunch up, turn around, charge ----
    paws(S, W["bunched"] - 0.05, W["turned"], r, 14, 0.1, False)
    place(S, st(thump(r, 55, 0.4)), W["charged"] - 0.02, 0.6)
    paws(S, W["charged"], cf(9) - 0.2, r, 50, 0.16)
    place(S, pan(G.whoa(r, 140), 0.0), W["napoleon2"] + 0.05, 0.3)
    cue(W["charged"], "impact + a drumming stampede of paws")
    # ---- 12: whips ----
    for k in range(3): place(S, pan(crack(r), -0.4 + 0.4 * k), W["cracking"] + 0.12 * k, 0.55)
    for k in range(3): place(S, pan(crack(r), r.uniform(-0.7, 0.7)), W["whips"] + 0.25 + 0.3 * k, 0.3)
    for k in range(3): place(S, pan(G.hurrah(r, r.uniform(110, 150), r.uniform(0.95, 1.05)), -0.5 + 0.5 * k), cf(8) + 0.25 + 0.1 * k, 0.12)
    cue(W["cracking"], "whip cracks; the coachmen roar")
    # ---- 13: cheers, then the record scratch on "until" ----
    for k in range(3): place(S, pan(G.hurrah(r, r.uniform(110, 160), r.uniform(0.95, 1.08)), -0.5 + 0.5 * k), W["worked"] + 0.1 * k, 0.16)
    place(S, pan(record_scratch(r), 0.0), W["until"] - 0.03, 0.35)
    cue(W["until"], "record scratch")
    # ---- 14: the flank attack ----
    paws(S, W["split"], W["behind"], r, 55, 0.17)
    place(S, st(thump(r, 60, 0.4)), W["behind"] - 0.02, 0.7); place(S, pan(G.oof(r, "oof", 130, 1.0), 0.0), W["behind"] + 0.03, 0.4)
    cue(W["behind"], "the herd hits him from behind: thud + oof")
    # ---- 15: the pile ----
    for k in range(14): place(S, pan(eek(r, r.uniform(1500, 2600)), r.uniform(-0.5, 0.5)), W["piled"] + 0.13 * k, 0.1)
    place(S, pan(boing(r, 220, 0.9, 9), 0.0), W["staggered"] - 0.02, 0.35)
    # ---- 16: retreat, coach door, off they go; the stowaway misses ----
    t = cf(11) + 0.1
    while t < W["carriage"] + 0.25: place(S, pan(G.stroll_step(r, 0.4), -0.2), t, 0.25); t += 0.18
    place(S, st(thump(r, 90, 0.2)), W["carriage"] + 0.27, 0.5); place(S, pan(G.wood_crack(r), -0.3), W["carriage"] + 0.27, 0.15)
    hooves(S, W["field"], END16 + 0.6, r, 9.0, 0.25, -0.4); wheels(S, W["field"], END16 + 0.6, r, 0.12, -0.4)
    place(S, pan(G.whoa(r, 160), -0.3), W["field"] - 0.1, 0.15)
    place(S, pan(tok(r, 700, 1.0), -0.2), W["field"] + 0.7, 0.4); place(S, pan(boing(r, 420, 0.5, 18), -0.2), W["field"] + 0.72, 0.2)
    cue(W["carriage"], "coach door slam; hooves + wheels away on 'field'; a little bonk for the rabbit that misses")
    # ---- 17: the rabbits hold the field: birds only ----
    # ---- 18-19 ----
    for k in range(2): place(S, pan(eek(r, 2200 + 300 * k), -0.3 + 0.6 * k), W["another"] + 0.08 * k, 0.15)
    place(S, pan(boing(r, 300, 0.5, 6), 0.0), W["tame"] + 0.02, 0.2)
    place(S, pan(G.oof(r, "oh", 230, 1.15), 0.2), W["tame"] + 0.25, 0.12)
    # ---- 20: cabbage ----
    place(S, pan(munch(r), 0.3), W["cabbage"] + 0.05, 0.4); place(S, pan(munch(r), 0.3), W["cabbage"] + 0.25, 0.3)
    place(S, pan(growl(r, 1.0), 0.0), W["nobody"] - 0.05, 0.35)
    cue(W["cabbage"], "cabbage crunches; a hungry tummy growl on 'nobody'")
    # ---- 21: the party roars; Berthier steams ----
    for k in range(6):
        place(CROWD, pan(laugh(r, woman=False, dur=r.uniform(1.6, 2.6)), r.uniform(-0.8, 0.8)), cf(15) + r.uniform(-0.05, 0.4), r.uniform(0.6, 1.0))
    place(S, pan(hiss(r, 1.2, 2500), 0.2), W["mortified"] + 0.05, 0.22); place(S, pan(kettle(r, 1.3), 0.2), W["mortified"] + 0.15, 0.08)
    cue(cf(15), "the hunting party laughs; steam + a kettle whistle on 'mortified'")
    # ---- whooshes on the cuts ----
    for tx in (cf(1), cf(2), cf(3), cf(5), cf(6), cf(8), cw("split"), cf(11), cf(13), cf(14), cf(15), cw("because")):
        place(S, widen(G.whoosh(0.45, r, 0.25, 400, 3500), r), tx - 0.2, 0.12)
    return S

# ================================================================ score
E8M = 60 / 112 / 2   # march: one eighth at 112 bpm (2/4)
CH = {"C": [36, 60, 64, 67], "G": [43, 59, 62, 67], "F": [41, 60, 65, 69], "Am": [45, 60, 64, 69], "E": [40, 59, 64, 68], "Dm": [38, 62, 65, 69]}
MARCHP = ["C", "C", "G", "G", "C", "F", "G", "C"]
MARCH = [67, 0, 72, 72, 72, 74, 76, 72, 74, 0, 71, 71, 71, 72, 74, 71, 72, 0, 76, 76, 76, 77, 79, 76, 74, 72, 71, 74, 72, 0, 67, 0]
GALP = ["Am", "Am", "Dm", "E", "Am", "Am", "Dm", "E"]
GAL = [69, 72, 76, 72, 69, 72, 76, 79, 77, 76, 74, 72, 71, 72, 74, 76, 69, 72, 76, 72, 69, 72, 76, 81, 80, 77, 76, 74, 76, 0, 76, 0]
WALK = [48, 0, 52, 0, 55, 0, 52, 0, 53, 0, 57, 0, 55, 0, 50, 0]   # the sneaky bassoon walk (low "soft" brass, staccato)


def march(M, t0, t1, r, gain=1.0, tune=True):
    t, k = t0, 0
    while t < t1 - 0.05:
        bar = (k // 4) % 8; ch = CH[MARCHP[bar]]; j = k % 4
        if j == 0: place(M, pan(I.brass(I.m2f(ch[0]), E8M * 0.8, 0.6, r, "tuba"), -0.1), t, gain * 0.28)
        if j == 2: place(M, pan(I.brass(I.m2f(ch[0] + 7), E8M * 0.8, 0.5, r, "tuba"), -0.1), t, gain * 0.22)
        if j in (1, 3):
            for m in ch[1:]: place(M, pan(I.brass(I.m2f(m), E8M * 0.6, 0.4, r, "stab"), 0.25), t, gain * 0.05)
        place(M, pan(I.snare(0.55 if j in (0, 2) else 0.3, r, 0.2), 0.15), t, gain * (0.16 if j in (0, 2) else 0.08))
        if j == 0 and bar in (0, 4): place(M, pan(I.timpani(I.m2f(48), 0.5, r, 0.8), 0.0), t, gain * 0.3)
        m = MARCH[k % 32]
        if tune and m: place(M, pan(I.fife(I.m2f(m + 12), E8M * 0.9, 0.6, r), 0.2), t, gain * 0.24)
        t += E8M; k += 1


def galop(M, t0, t1, r, gain=1.0, tempo=168):
    e = 60 / tempo / 2
    t, k = t0, 0
    while t < t1 - 0.03:
        bar = (k // 4) % 8; ch = CH[GALP[bar]]; j = k % 4
        if j in (0, 2): place(M, pan(I.brass(I.m2f(ch[0]), e * 0.7, 0.7, r, "tuba"), -0.15), t, gain * 0.3)
        if j in (1, 3):
            for m in ch[1:]: place(M, pan(I.pluck(I.m2f(m), 0.5, r, 0.2, 0.6), 0.3), t, gain * 0.1)
        place(M, pan(I.snare(0.7 if j == 0 else 0.4, r, 0.15, 1.0, 1.0, j != 0), 0.1), t, gain * (0.2 if j == 0 else 0.1))
        if j == 0 and bar % 2 == 0: place(M, pan(I.brass(I.m2f(ch[2] + 12), e * 1.5, 0.8, r, "stab"), 0.3), t, gain * 0.12)
        m = GAL[k % 32]
        if m: place(M, pan(I.fife(I.m2f(m + 12), e * 0.9, 0.7, r), 0.2), t, gain * 0.22)
        t += e; k += 1


def walk(M, t0, t1, r, gain=1.0):
    e = 60 / 100 / 2
    t, k = t0, 0
    while t < t1 - 0.05:
        m = WALK[k % 16]
        if m: place(M, pan(I.brass(I.m2f(m), e * 0.55, 0.45, r, "soft"), -0.1), t, gain * 0.3)
        if k % 4 == 2: place(M, pan(I.pluck(I.m2f(72 if (k // 8) % 2 == 0 else 74), 0.4, r, 0.3, 0.5), 0.3), t, gain * 0.08)
        t += e; k += 1


def plonk(M, t, r, gain=1.0):
    place(M, pan(tok(r, 300, 0.6), 0.0), t, gain * 0.5)
    place(M, pan(I.brass(I.m2f(43), 0.25, 0.6, r, "tuba"), 0.0), t + 0.02, gain * 0.35)
    place(M, pan(I.brass(I.m2f(36), 0.55, 0.6, r, "tuba"), 0.0), t + 0.3, gain * 0.35)


def wahwah(M, t, r, gain=1.0):
    for k, m in enumerate([55, 54, 53]): place(M, pan(I.brass(I.m2f(m), 0.32, 0.6, r, "horn"), 0.1), t + 0.34 * k, gain * 0.32)
    place(M, pan(I.brass(I.m2f(52), 1.0, 0.6, r, "horn", fall=-80), 0.1), t + 1.02, gain * 0.32)


def build_music():
    r = rng(1806)
    M = buf()
    march(M, 0.05, cw("bunnies") - 0.05, r, 0.95); cue(0.05, "music: pompous fife-and-snare march (tent)")
    place(M, pan(I.cymbal(0.8, r, 1.6), 0.0), W["bunnies"] - 0.02, 0.25); place(M, pan(I.brass(I.m2f(48), 0.4, 0.9, r, "stab"), 0.0), W["bunnies"] - 0.02, 0.3)
    march(M, cf(1) + 0.1, W["raised"] - 0.05, r, 0.7); cue(cf(1), "music: the march again, lighter, through the set-up")
    place(M, pan(I.timpani(I.m2f(43), 0.6, r, 1.2), 0.0), W["raised"] - 0.05, 0.3); cue(W["raised"], "music: cuts dead on 'raised' (one timpani hit)")
    for ts, v in I.snare_roll(W["bunched"], W["charged"] - 0.05, 0.1, 0.7, r): place(M, pan(I.snare(v, r, 0.12, 1.0, 1.0, True), 0.1), ts, 0.12)
    galop(M, W["charged"] - 0.05, W["staggered"] + 0.1, r, 1.0); cue(W["charged"], "music: a frantic galop for the charge and the flank attack")
    place(M, pan(I.cymbal(0.7, r, 2.0), 0.0), W["staggered"] - 0.02, 0.2)
    galop(M, W["staggered"] + 0.3, W["field"] + 0.4, r, 0.55, 152)
    plonk(M, cf(12) - 0.4, r, 1.0); cue(cf(12) - 0.4, "music: plonk sting before the reveal")
    walk(M, cf(12) + 0.1, cw("because") - 0.1, r, 0.9); cue(cf(12), "music: sneaky bassoon walk under the explanation")
    sparkle(M, W["cabbage"] - 0.05, r, (84, 88, 91, 96), 5, 0.3, 0.06)
    wahwah(M, W["mortified"] - 0.05, r, 1.0); cue(W["mortified"], "music: sad-trombone wah-wah")
    march(M, cw("because") + 0.05, DUR - 0.1, r, 0.95); cue(cw("because"), "music: the march for the loop")
    return M
'''

out = HEADER + src[src.index("import os, sys, json, wave"):]
out = out.replace('ROOT = os.path.expanduser("~/dancing-short")', 'ROOT = os.path.expanduser("~/napoleon-short")')
a = out.index("# sets on the timeline (s), from story.ts SHOTS"); b = out.index("cues = []")
out = out[:a] + SETS + out[b:]
a = out.index("CROWD = None\n\n\ndef stamps"); b = out.index("# ================================================================ mix")
out = out[:a] + PARTS.lstrip("\n") + "\n\n" + out[b:]
open(os.path.join(HERE, "napoleon_sound.py"), "w").write(out)
print("wrote napoleon_sound.py")
