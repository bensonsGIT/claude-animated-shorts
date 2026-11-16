# The Crime-and-Punishment-specific parts of crime_sound.py; assemble.py splices them between the shared helpers and
# the shared mix taken from the Gatsby short's sound script.
HEADER = '''# Sound for "He Killed to Prove He Was a Genius" (Crime and Punishment): synthesized SFX + an original minor-key
# waltz score (pizzicato bass, plucked chords, vibes tune), a dissonant sting on the axe, a creeping tick-tock for the
# fever and Porfiry, silence on "free", a warm choir pad for Sonya, church bells at the Haymarket, the waltz slowed and
# warm in the Siberian snow. Ducked under the voice. Events sit on the picture's word times (~/crime-short/timing.json).
# Usage: ~/tts/chatterbox/bin/python crime_sound.py  ->  ~/crime-short/audio/mix.wav, stems/*.wav, cues.md
'''
SETS = '''# sets on the timeline (s), from story.ts SHOTS
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
'''
SFX = '''
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
'''
MUSIC = '''
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
'''
