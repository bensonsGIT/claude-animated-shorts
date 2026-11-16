# The Gatsby-specific part of gatsby_sound.py (build_sfx + build_music); assemble_sound.py splices it between the shared
# helpers and the shared mix of the wombat short's sound script.
HEADER = '''# Sound for "He Threw Giant Parties for One Woman" (The Great Gatsby): synthesized SFX + an original 1920s-flavoured
# score (swing banjo + walking bass + brushes + vibes tune for the parties, a wistful vibes/pad flashback, tense low
# strings at the Plaza, a driving pulse in the valley of ashes, silence before the pool, the party tune slowed down on a
# soft horn for the funeral), ducked under the voice. Every event sits on the picture's word times (~/gatsby-short/timing.json).
# Usage: ~/tts/chatterbox/bin/python gatsby_sound.py  ->  ~/gatsby-short/audio/mix.wav (48 kHz stereo, exact picture length),
# stems/*.wav, cues.md
'''
SETS = '''# sets on the timeline (s), from story.ts SHOTS
PARTY = [(0.0, cf(2)), (cf(14), cw("funeral"))]
BAY = [(cf(2), cf(3)), (cf(5), cf(6))]
PAST = [(cf(3), cf(5))]
COTTAGE = [(cf(6), cw("parties2"))]
LAWN_EMPTY = [(cw("parties2"), cf(8))]
PLAZA = [(cf(8), cf(10))]
VALLEY = [(cf(10), cf(13))]
POOLSIDE = [(cf(13), cf(14))]
RAINY = [(cw("funeral"), DUR)]
INSIDE = COTTAGE + PLAZA
'''
SFX = '''

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


def build_sfx():
    r = rng(1925)
    S = buf()
    # ---- ambiences ----
    for a, b in PARTY:
        place(S, murmur(b - a, r, 16), a, 0.34)
        party_life(S, a, b, r)
        t = a + 0.3
        while t < b - 0.2:
            place(S, pan(G.clink(r, r.uniform(2400, 4200), 0.08, 0.8), r.uniform(-0.7, 0.7)), t, 0.12); t += r.uniform(0.35, 0.9)
    for a, b in BAY:
        place(S, G.water_bed(b - a, r, 0.5, 0.5), a, 0.18); place(S, G.crickets(b - a, r, 3), a, 0.1)
    for a, b in PAST:
        place(S, G.breeze(b - a, r, 0.5, bright=1400), a, 0.12); place(S, G.bird_chirps(b - a, r, 0.35, "sparrow"), a, 0.08)
    for a, b in COTTAGE:
        place(S, rain_bed(b - a, r, 0.8, 3000), a, 0.14)
        t = a
        while t < b:
            place(S, pan(tok(r, 2400, 0.5), 0.4), t, 0.05); t += 1.0
    for a, b in LAWN_EMPTY:
        place(S, G.crickets(b - a, r, 4), a, 0.14)
    for a, b in PLAZA:
        place(S, hum(b - a, r), a, 0.05); place(S, G.breeze(b - a, r, 0.3, bright=700), a, 0.06)
    for a, b in VALLEY:
        place(S, G.breeze(b - a, r, 0.8, bright=600), a, 0.14)
    for a, b in POOLSIDE:
        place(S, G.water_bed(b - a, r, 0.3, 0.3), a, 0.14); place(S, G.bird_chirps(b - a, r, 0.25, "sparrow"), a, 0.06)
    for a, b in RAINY:
        place(S, rain_bed(b - a, r, 1.0), a, 0.22)
    cue(0.0, "party chatter (Tycho recipe) + glass clinks; bay water + crickets; rain in the cottage and at the grave")
    # ---- 1-2: the gate swings open, a stray dog trots in ----
    place(S, pan(G.creak(0.55, r, 90, 160), 0.5), W["wander"] - 0.02, 0.45)
    for k in range(8): place(S, pan(tok(r, r.uniform(1700, 2100), 0.4), 0.4 - 0.08 * k), W["wander"] + 0.25 + 0.13 * k, 0.12)
    jingle(S, W["in"] - 0.05, r, 0.6, 0.25); cue(W["wander"], "gate creak, the dog's tag jingle + patter")
    # ---- 3: the rumours pop ----
    for w in ("no", "idea", "really"): place(S, pan(bloop(r, 640, 300, 0.14), r.uniform(-0.4, 0.4)), W[w] - 0.05, 0.35)
    # ---- 4/8: the green light ----
    place(S, pan(I.vibes(I.m2f(91), 0.4, r, 2.0), 0.3), cf(2) + 0.2, 0.12)
    place(S, pan(I.vibes(I.m2f(96), 0.5, r, 1.5), 0.2), W["green"] - 0.05, 0.2)
    sparkle(S, W["dock"] - 0.03, r, notes=(84, 88, 91, 96), n=4, gain=0.25)
    cue(W["green"], "a soft shimmer on the green light")
    # ---- 5: hearts; marching off to war ----
    sparkle(S, W["fell"], r, notes=(84, 88, 91, 93), n=3, gain=0.25, step=0.12)
    for k in range(6): place(S, pan(G.boot(r, 0.7), -0.3 - 0.08 * k), W["war"] + 0.05 + 0.32 * k, 0.18 * (1 - 0.12 * k))
    # ---- 6: wedding bells, coins ----
    for k in range(6): place(S, pan(I.glock(I.m2f([79, 76, 72, 79, 76, 72][k]), 0.6, r, 1.6), (-0.5, 0.5)[k % 2]), W["married"] - 0.05 + 0.22 * k, 0.28)
    jingle(S, W["rich"] - 0.03, r, 0.5, 0.3); cue(W["married"], "wedding bells; a coin jingle on 'rich'")
    # ---- 7: the mansion lights pop on ----
    for k in range(6): place(S, st(thump(r, 150 + 20 * k, 0.12)), W["mansion"] - 0.1 + 0.17 * k, 0.25)
    # ---- 9-10: the cottage ----
    place(S, pan(G.whoosh(0.4, r, 0.2, 600, 3000), 0.3), W["tea"] - 0.15, 0.3); place(S, pan(bloop(r, 520, 200, 0.2), 0.3), W["tea"] - 0.03, 0.4)
    sparkle(S, W["seeing"], r, notes=(84, 88, 91, 96), n=5, gain=0.3, step=0.1)
    # ---- 11: lanterns pop out ----
    a, b = W["parties2"] - 0.1, W["stopped"] + 0.25
    for k in range(10): place(S, pan(bloop(r, 900 - 50 * k, 200, 0.08), r.uniform(-0.7, 0.7)), a + (b - a) * k / 10, 0.18)
    place(S, pan(record_scratch(r), 0.0), W["parties2"] - 0.08, 0.35); cue(W["parties2"], "record scratch; lanterns pop out")
    # ---- 12-13: the Plaza ----
    place(S, st(thump(r, 70, 0.3)), W["him"] - 0.02, 0.7); place(S, pan(G.clink(r, 1700, 0.15, 1.0), 0.2), W["him"] + 0.02, 0.3)
    for k in range(3): place(S, pan(G.clink(r, r.uniform(3000, 4500), 0.1, 0.8), 0.1), W["both"] - 0.02 + 0.06 * k, 0.25)
    cue(W["him"], "table slam; ice clinks on 'both'")
    # ---- 14-17: the car ----
    a = cf(10)
    place(S, pan(engine(W["hit"] - a, r, 36, 58), -0.3), a, 0.35)
    place(S, pan(screech(r, 0.6), 0.0), W["hit"] - 0.1, 0.4)
    place(S, st(lp(thump(r, 50, 0.35), 500)), W["hit"] + 0.25, 0.5)  # dull, off-screen
    away = engine(cf(11) - W["didnt"] + 0.6, r, 58, 44)
    away = away * np.linspace(1.0, 0.05, away.shape[-1]) ** 1.5
    place(S, pan(away, 0.4), W["didnt"] - 0.1, 0.3)
    cue(W["hit"], "engine roar, tyre screech, cut on the impact")
    # ---- 18-19 ----
    place(S, pan(hiss(r, 0.6, 2500), 0.2), W["whose"] - 0.05, 0.25); cue(W["whose"], "a whisper")
    # ---- 21-22: the shot, muffled and far ----
    place(S, st(lp(thump(r, 90, 0.5), 600)), W["shot"] - 0.02, 0.6); place(S, st(lp(hiss(r, 0.8, 300), 1500)), W["shot"], 0.25)
    cue(W["shot"], "a distant muffled crack")
    # ---- 25: one drop on the empty flower stand ----
    place(S, pan(drip(r), 0.2), W["flower"] - 0.02, 0.5); place(S, pan(G.clink(r, 2600, 0.2, 0.6), 0.2), W["flower"], 0.25)
    for tx in (cf(2), cf(3), cf(5), cf(6), cf(8), cf(10), cf(13), cf(14)):
        place(S, widen(G.whoosh(0.45, r, 0.25, 400, 3500), r), tx - 0.2, 0.18)
    return S
'''
MUSIC = '''
# ================================================================ score (Bb major swing, 132 bpm)
BEAT = 60 / 132
CH = {"Bb": [46, 62, 65, 70], "G7": [43, 62, 65, 71], "Cm": [48, 63, 67, 72], "F7": [41, 63, 69, 72], "Eb": [51, 63, 67, 70], "Ebm": [51, 63, 66, 70]}
PROG = ["Bb", "G7", "Cm", "F7", "Bb", "G7", "Cm", "F7", "Eb", "Ebm", "Bb", "G7", "Cm", "F7", "Bb", "F7"]
# an original swing tune, one note per eighth (0 = rest)
MEL = [70, 0, 74, 77, 0, 75, 74, 0, 74, 0, 71, 74, 0, 79, 77, 0, 75, 0, 72, 75, 0, 79, 75, 0, 77, 0, 0, 0, 72, 74, 75, 0,
       70, 0, 74, 77, 0, 75, 74, 0, 79, 0, 77, 74, 0, 71, 74, 0, 75, 0, 79, 82, 0, 79, 75, 0, 77, 0, 0, 0, 0, 0, 0, 0]


def swing(M, t0, t1, r, gain=1.0, tune=True, bright=1.0, tempo=1.0):
    """walking bass on every beat, Charleston banjo chops, brushed snare on 2 and 4, vibes tune (swung eighths)"""
    b = BEAT / tempo
    t, k = t0, 0
    while t < t1 - 0.05:
        bar = (k // 8) % len(PROG)
        ch = CH[PROG[bar]]
        j = k % 8
        if j % 2 == 0: place(M, pan(I.pluck(I.m2f(ch[0] + [0, 4, 7, 4][(j // 2) % 4]), 0.8, r, 0.45, 0.25), -0.2), t, gain * 0.8)
        if j in (0, 3):
            for m in ch[1:]: place(M, pan(I.pluck(I.m2f(m), 0.55, r, 0.22, 0.6), 0.3), t, gain * 0.2)
        if j in (2, 6): place(M, pan(I.brush(0.5, r), 0.1), t, gain * 0.35)
        m = MEL[k % 64]
        if tune and m: place(M, pan(I.vibes(I.m2f(m), 0.5, r, 0.7), 0.25), t, gain * 0.4 * bright)
        t += b * (0.62 if k % 2 == 0 else 0.38); k += 1


def wistful(M, t0, t1, r, gain=1.0):
    """the flashback: slow vibes arpeggios over a warm pad"""
    chords = [[58, 62, 65, 70], [55, 62, 65, 71], [51, 58, 63, 67], [53, 57, 63, 65]]
    t, k = t0, 0
    while t < t1 - 0.2:
        c = chords[(k // 4) % 4]
        if k % 4 == 0: place(M, I.pad([I.m2f(m) for m in c], BEAT * 7.5, 0.3, r, 0.5, 0.8, 1400), t, gain * 0.25)
        place(M, pan(I.vibes(I.m2f(c[k % 4] + 12), 0.45, r, 1.6), (-0.4, 0.4)[k % 2]), t, gain * 0.4)
        t += BEAT * 2; k += 1


def tense(M, t0, t1, r, gain=1.0):
    place(M, I.pad([I.m2f(m) for m in (38, 45, 50, 51)], t1 - t0, 0.45, r, 0.8, 0.4, 700, detune=14), t0, gain * 0.3)
    t = t0
    while t < t1 - 0.1:
        place(M, pan(I.pluck(I.m2f(38), 0.7, r, 0.5, 0.2), 0.0), t, gain * 0.5); t += BEAT * 2


def pulse(M, t0, t1, r, gain=1.0):
    t, k = t0, 0
    while t < t1 - 0.1:
        place(M, I.timpani(I.m2f(38 if k % 4 else 33), 0.6 + 0.2 * (k % 2), r, 0.9), t, gain * 0.5)
        if k % 2: place(M, pan(I.pluck(I.m2f(50 + (k % 8 == 7) * 3), 0.6, r, 0.3, 0.3), 0.3), t, gain * 0.3)
        t += BEAT; k += 1


def lament(M, t0, t1, r, gain=1.0):
    """the party tune again, slow, on a soft horn over a pad"""
    t, k = t0, 0
    while t < t1 - 0.3:
        m = MEL[k % 64]
        if m: place(M, pan(I.brass(I.m2f(m - 12), BEAT * 1.6, 0.5, r, "soft"), 0.1), t, gain * 0.45)
        if k % 8 == 0: place(M, I.pad([I.m2f(x - 12) for x in CH[PROG[(k // 8) % len(PROG)]][1:]], BEAT * 7.5, 0.3, r, 0.8, 1.0, 900), t, gain * 0.2)
        t += BEAT * 1.0; k += 1


def build_music():
    r = rng(22)
    M = buf()
    swing(M, 0.05, cf(2) - 0.1, r, 0.9); cue(0.05, "music: hot swing (banjo, walking bass, brushes, vibes tune)")
    place(M, I.pad([I.m2f(m) for m in (58, 65, 70, 74)], cf(3) - cf(2), 0.3, r, 0.6, 0.6, 1200), cf(2), 0.22)
    wistful(M, cf(3), cf(5) - 0.1, r, 0.9); cue(cf(3), "music: wistful vibes flashback")
    swing(M, cf(5), cf(6) - 0.1, r, 0.6, True, 0.7, 0.85)
    swing(M, cf(6), cw("parties2") - 0.05, r, 0.55, True, 0.8, 0.9); cue(cf(6), "music: the swing returns, gently")
    tense(M, cf(8), cf(10) - 0.05, r, 0.9); cue(cf(8), "music: tense low drone at the Plaza")
    pulse(M, cf(10), cf(12) - 0.1, r, 0.9); cue(cf(10), "music: driving low pulse in the valley")
    # silence through "Tom told Myrtle's husband whose car it was"
    place(M, pan(I.vibes(I.m2f(70), 0.4, r, 2.5), 0.2), cf(13) + 0.3, 0.3)
    place(M, pan(I.vibes(I.m2f(65), 0.35, r, 2.5), -0.2), cf(13) + 1.4, 0.25); cue(cf(13), "music: lone vibes at the pool")
    swing(M, cf(14), cw("funeral") - 0.05, r, 0.75); cue(cf(14), "music: the party swing, cut dead on 'funeral'")
    lament(M, cw("funeral") + 0.1, DUR - 0.4, r, 0.9); cue(cw("funeral"), "music: the tune slowed on a soft horn")
    place(M, pan(I.vibes(I.m2f(82), 0.5, r, 2.4), 0.0), W["flower"] - 0.02, 0.35); cue(W["flower"], "music: single bell note")
    return M
'''
