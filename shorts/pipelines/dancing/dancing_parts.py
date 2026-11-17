# The Dancing-Plague-specific parts of dancing_sound.py, spliced between the shared helpers and the shared mix taken
# from the Crime short's sound script.
HEADER = '''# Sound for "In 1518 the Cure for Dancing Was... More Dancing" (the Dancing Plague): synthesized SFX + an original
# Renaissance-style jig (fife tune, plucked drones, frame drum) that plays for the hook and the cure, falls silent under
# Frau Troffea's lonely first steps and in the council chamber, grinds to a halt on the ban, a solemn organ-like pad at
# the shrine, and bursts back for the loop line. Ducked under the voice; events on the picture's word times.
# Usage: ~/tts/chatterbox/bin/python dancing_sound.py  ->  ~/dancing-short/audio/mix.wav, stems/*.wav, cues.md
'''
SETS = '''# sets on the timeline (s), from story.ts SHOTS
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
'''
SFX = '''
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
'''
MUSIC = '''
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
'''
