# The Ivan Ilych-specific parts of ivan_sound.py, spliced over the shared helpers + mix of the Dancing short's sound
# script (dancing_sound.py). Run: python3 ivan_parts.py  -> ivan_sound.py next to this file.
import os
HERE = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(HERE, "..", "dancing", "dancing_sound.py")).read()

HEADER = '''# Sound for "A Judge Was Killed by His Curtains" (The Death of Ivan Ilych, Tolstoy, 1886): synthesized SFX + an original
# score: a stiff, polite salon waltz that goes out of tune on "terrible" and "knob", a church bell for the funeral, ladder
# creaks and a bonk, a record-scratch freeze on "dying", party chatter and a forced laugh on "lie", a candle-lit cello drone,
# silence before the scream, a warm choir-like chord rising into "light", and the salon waltz back, cheerful, at the cards.
# Usage: ~/tts/chatterbox/bin/python ivan_sound.py  ->  ~/ivan-short/audio/mix.wav, stems/*.wav, cues.md
'''
SETS = '''# sets on the timeline (s), from story.ts SHOTS
COURT = [(cf(1), cf(2))]
DRAWING = [(0.0, cf(1)), (cf(2), cf(8)), (cf(14), cf(15))]
SICK = [(cf(8), cf(11)), (cf(12), cf(13))]
DARK = [(cf(11), cf(12)), (cf(13), cf(14))]
CARDROOM = [(cf(15), DUR)]
COTTAGE = SICK + CARDROOM   # small rooms (reverb)
PLAZA = DRAWING + COURT     # bigger rooms (reverb)
INSIDE = COTTAGE + PLAZA
'''

PARTS = r'''
def S2(x):
    return x if np.ndim(x) == 2 else st(x)


def bell(r, f=196.0, dur=3.5):
    """a church bell toll: inharmonic partials, a slow decay"""
    t = tt(dur)
    y = sum(a * np.sin(2 * np.pi * f * m * t) * np.exp(-t / (dur * d)) for m, a, d in ((0.5, 0.5, 0.6), (1.0, 1.0, 0.45), (1.19, 0.6, 0.35), (1.5, 0.4, 0.3), (2.0, 0.5, 0.25), (2.74, 0.25, 0.15)))
    return fades(y, 0.002, 0.4)


def rustle(r, dur=0.4):
    """a newspaper page turned"""
    n = ns(dur); t = np.arange(n) / SR
    return fades(bp(r.standard_normal(n), 1200, 7000) * (0.4 + 0.6 * np.abs(np.sin(2 * np.pi * 7 * t))) * np.exp(-t / (dur * 0.6)), 0.01, 0.08)


def ding(r, f=1760.0):
    t = tt(0.8)
    return fades(np.sin(2 * np.pi * f * t) * np.exp(-t / 0.25) + 0.3 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t / 0.1), 0.001, 0.1)


def heartbeat(S, a, b, r, gain=0.3, bpm=62):
    t = a
    while t < b:
        place(S, st(thump(r, 50, 0.18)), t, gain); place(S, st(thump(r, 45, 0.15)), t + 0.22, gain * 0.7); t += 60 / bpm


def build_sfx():
    global CROWD
    CROWD = buf()
    r = rng(1886)
    S = buf()
    # ---- ambiences ----
    for a, b in DRAWING:
        t = a + 0.2
        while t < b: place(S, pan(tok(r, 2200, 0.5), -0.4), t, 0.025); t += 1.0     # the drawing-room clock
    for a, b in COURT:
        place(CROWD, S2(murmur(b - a, r, 3)), a, 0.3)
        place(S, pan(rustle(r), -0.2), a + 0.2, 0.2); place(S, pan(rustle(r), 0.1), W["thought"], 0.15)
    for a, b in SICK: place(S, S2(G.breeze(b - a, r, 0.25, bright=500)), a, 0.03)
    for a, b in DARK: place(S, S2(hum(b - a, r)), a, 0.03)
    for a, b in CARDROOM: place(CROWD, S2(murmur(b - a, r, 4)), a, 0.4)
    place(CROWD, S2(murmur(cf(10) - cf(9), r, 3)), cf(9), 0.35)
    cue(0.0, "ambience: drawing-room clock; court murmur + newspaper rustles; sickroom wind; a low hum in the dark")
    # ---- 1: the funeral bell, softly; it lands on "curtains" ----
    place(S, st(bell(r, 147.0, 4.0)), 0.15, 0.12)
    place(S, st(bell(r, 147.0, 4.0)), W["curtains"] - 0.03, 0.22)
    cue(W["curtains"], "funeral bell")
    # ---- 2: three dings as each colleague dreams of the vacancy ----
    for k in range(3): place(S, pan(ding(r, (1568.0, 1760.0, 2093.0)[k]), (-0.4, 0.0, 0.4)[k]), W["job"] - 0.1 + 0.1 * k, 0.16)
    # ---- 4: stamp, chime, sofa thump ----
    place(S, st(thump(r, 90, 0.15)), W["career"], 0.3); place(S, pan(tok(r, 1300, 1.0), -0.2), W["career"] + 0.01, 0.15)
    place(S, pan(ding(r, 2349.0), 0.3), W["wife"] - 0.02, 0.12); place(S, pan(ding(r, 2793.0), 0.3), W["wife"] + 0.1, 0.1)
    place(S, st(thump(r, 65, 0.3)), W["furniture"] + 0.02, 0.4)
    # ---- 6: the envelope, the bolts of cloth thumping down, footsteps ----
    place(S, pan(G.whoosh(0.25, r, 0.2, 900, 4500), 0.2), W["promotion"] - 0.1, 0.15)
    for k in range(4): place(S, pan(thump(r, 110, 0.1), 0.3), W["decorate"] + k / 6, 0.15)
    steps(S, W["grand"], W["grand"] + 0.9, r, 3.4, 0.08)
    # ---- 7: the ladder: creaks up, a wobble, the bonk ----
    for k, w in enumerate(("climbed", "ladder")): place(S, pan(G.creak(0.35, r, 90, 140), 0.3), W[w], 0.12)
    place(S, pan(G.creak(0.5, r, 160, 60), 0.3), W["slipped"] - 0.05, 0.18)
    place(S, pan(G.whoosh(0.2, r, 0.3, 600, 3000), 0.3), W["slipped"], 0.12)
    place(S, pan(bloop(r, 900, 600, 0.12), 0.25), W["knob"] - 0.02, 0.3); place(S, st(thump(r, 120, 0.12)), W["knob"] - 0.02, 0.35)
    sparkle(S, W["knob"] + 0.1, r, (91, 88, 84, 79), 4, 0.15, 0.09)
    place(S, pan(G.oof(r, "oof", 140, 1.0), 0.3), W["knob"] + 0.08, 0.18)
    cue(W["knob"], "BONK on the brass knob + dizzy sparkle + an 'oof'")
    # ---- 8: a tiny boing on "bruise"; a sour wobble on "taste" ----
    place(S, S2(boing(r, 520, 0.35, 16)), W["bruise"], 0.07)
    place(S, pan(bloop(r, 220, 140, 0.35), 0.0), W["taste"], 0.15)
    # ---- 9: the doctors' murmur; the record scratch on "dying" ----
    place(CROWD, S2(G.babble(W["dying"] - cf(8), r, 120, 1.0)), cf(8) + 0.1, 0.25)
    place(S, S2(record_scratch(r)), W["dying"] - 0.08, 0.3)
    cue(W["dying"], "record scratch: everybody freezes")
    # ---- 10: party chatter + a forced laugh on "lie" ----
    steps(S, cf(9), cf(10) - 0.2, r, 4.0, 0.06)
    place(S, pan(G.oof(r, "oh", 260, 1.2), 0.3), W["lie"] - 0.05, 0.12); place(S, pan(G.oof(r, "oh", 300, 1.1), 0.35), W["lie"] + 0.12, 0.1)
    # ---- 11: the night candle crackling ----
    t = cf(10) + 0.2
    while t < cf(11) - 0.2: place(S, pan(G.clink(r, r.uniform(5000, 7000), 0.02, 0.4), 0.4), t, 0.03); t += r.uniform(0.3, 0.9)
    # ---- 12: the scream: no voice, a long distorted roar of wind down the sack, then silence ----
    place(S, S2(G.whoosh(2.2, r, 0.45, 150, 1800, tail=0.6)), W["screamed"] - 0.3, 0.3)
    place(S, st(lp(r.standard_normal(ns(1.6)), 400) * np.exp(-tt(1.6) / 0.6)), W["screamed"], 0.25)
    cue(W["screamed"], "a muffled roar down the dark tube (no scream sample)")
    # ---- 13: a slow heartbeat ----
    heartbeat(S, cf(12) + 0.2, cf(13) - 0.3, r, 0.18)
    # ---- 15: cards shuffled and dealt, a table tap, chatter ----
    t = W["back"] - 0.6
    for k in range(6): place(S, pan(bp(r.standard_normal(ns(0.07)), 2000, 8000) * np.exp(-tt(0.07) / 0.02), 0.2), t + k * 0.12, 0.12)
    place(S, st(thump(r, 140, 0.08)), W["cards"] - 0.02, 0.2)
    place(S, S2(G.hurrah(r, 140, 1.0)), W["cards"] + 0.05, 0.08)
    # ---- whooshes on the place cuts ----
    for tx in (cf(1), cf(2), cf(8), cf(11), cf(12), cf(13), cf(14), cf(15)):
        place(S, widen(G.whoosh(0.45, r, 0.25, 400, 3500), r), tx - 0.2, 0.08)
    return S

# ================================================================ score
CH = {"C": [36, 60, 64, 67], "G": [43, 59, 62, 67], "F": [41, 60, 65, 69], "Dm": [38, 62, 65, 69], "G7": [43, 59, 65, 67]}
PROG = ["C", "C", "G", "G", "F", "F", "C", "C", "Dm", "Dm", "C", "C", "G7", "G7", "G7", "C"]
MEL = [67, 0, 0, 72, 71, 72, 76, 0, 74, 72, 0, 0, 69, 0, 0, 72, 71, 69, 67, 0, 65, 64, 0, 0,
       65, 0, 0, 69, 67, 65, 64, 0, 67, 72, 0, 0, 74, 0, 72, 71, 0, 69, 67, 0, 71, 72, 0, 0]


def waltz(M, t0, t1, r, gain=1.0, bpm=138, sour=0.0, lead="box"):
    """a polite salon waltz: plucked bass on 1, chords on 2 and 3, a music-box tune; sour > 0 detunes it (semitones)"""
    q = 60 / bpm
    t, k = t0, 0
    while t < t1 - 0.05:
        bar = (k // 3) % 16; j = k % 3
        ch = CH[PROG[bar]]
        u = (t - t0) / max(0.1, t1 - t0)
        dt = lambda: sour * u * r.uniform(-1, 1)
        if j == 0: place(M, pan(I.pluck(I.m2f(ch[0] + dt()), 0.8, r, 0.9, 0.35), -0.15), t, gain * 0.3)
        else:
            for m in ch[1:]: place(M, pan(I.pluck(I.m2f(m + dt()), 0.5, r, 0.35, 0.6), 0.2), t, gain * 0.07)
        m = MEL[k % 48]
        if m:
            f = I.m2f(m + dt())
            x = I.musicbox(f, 0.6, r, 1.0) if lead == "box" else I.vibes(f, 0.6, r, 1.2)
            place(M, pan(x, 0.1), t, gain * 0.16)
        t += q; k += 1


def build_music():
    r = rng(1886)
    M = buf()
    place(M, I.pad([I.m2f(m) for m in (38, 45, 50, 53)], cf(1) - 0.1, 0.4, r, 0.5, 0.6, 500), 0.05, 0.12)
    cue(0.05, "music: a low D-minor pad under the funeral")
    waltz(M, cf(1) + 0.05, cf(4) - 0.05, r, 0.85); cue(cf(1), "music: a stiff, polite salon waltz")
    waltz(M, cf(4) + 0.05, W["terrible"] + 0.6, r, 0.7, bpm=120, sour=0.7); cue(W["terrible"], "music: the waltz drifts out of tune")
    waltz(M, cf(5) + 0.05, W["knob"] - 0.05, r, 0.8, bpm=150)
    place(M, pan(I.brass(I.m2f(55), 1.0, 0.6, r, "horn", fall=-600), 0.1), W["knob"] + 0.05, 0.3)
    cue(W["knob"], "music: a sour trombone droop after the bonk")
    place(M, I.pad([I.m2f(m) for m in (36, 43, 48)], cf(11) - cf(7) + 0.2, 0.4, r, 1.0, 1.0, 400), cf(7), 0.14)
    for m, a, b in ((48, cf(7), cf(9)), (46, cf(9), cf(10)), (43, cf(10), cf(11))):
        place(M, pan(I.brass(I.m2f(m - 12), b - a, 0.4, r, "tuba"), -0.1), a + 0.1, 0.06)
    cue(cf(7), "music: a low cello-like drone under the illness")
    cue(cf(11) - 0.3, "music: silence through the dark")
    place(M, I.pad([I.m2f(m) for m in (48, 55, 60, 64)], cf(13) - cf(12), 0.4, r, 1.2, 0.8, 900), cf(12) + 0.2, 0.12)
    place(M, I.pad([I.m2f(m) for m in (48, 55, 60, 64, 67, 72)], cf(14) - W["fear"] + 0.4, 0.5, r, 1.6, 0.6, 1600), W["fear"], 0.16)
    for k, m in enumerate((72, 76, 79, 84)): place(M, pan(I.glock(I.m2f(m), 0.6, r, 2.0), 0.0), W["light"] + 0.12 * k, 0.12)
    cue(W["light"], "music: a warm major chord swells into 'light'")
    # the philosophical line: the opening waltz tune alone on a slow music box, one note at a time, over a hollow pad
    place(M, I.pad([I.m2f(m) for m in (45, 52, 57, 60)], cf(15) - cf(14) + 0.3, 0.4, r, 0.8, 0.8, 700), cf(14) + 0.1, 0.1)
    for k, m in enumerate((67, 72, 71, 72, 76, 74, 72)): place(M, pan(I.musicbox(I.m2f(m), 0.5, r, 1.4), 0.1), cf(14) + 0.3 + 0.55 * k, 0.12)
    cue(cf(14), "music: the waltz tune alone on a slow music box (the philosophical line)")
    waltz(M, cf(15) + 0.3, DUR - 0.05, r, 0.75, bpm=150, lead="vibes"); cue(cf(15), "music: the salon waltz, cheerful and oblivious (loop)")
    return M
'''

out = HEADER + src[src.index("import os, sys, json, wave"):]
out = out.replace('ROOT = os.path.expanduser("~/dancing-short")', 'ROOT = os.path.expanduser("~/ivan-short")')
a = out.index("# sets on the timeline (s), from story.ts SHOTS"); b = out.index("cues = []")
out = out[:a] + SETS + out[b:]
a = out.index("CROWD = None\n\n\ndef stamps"); b = out.index("# ================================================================ mix")
out = out[:a] + "CROWD = None\n" + PARTS.lstrip("\n") + "\n\n" + out[b:]
open(os.path.join(HERE, "ivan_sound.py"), "w").write(out)
print("wrote ivan_sound.py")
