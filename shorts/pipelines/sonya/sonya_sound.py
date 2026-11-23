# Sound for "The Murderer Who Could Only Tell One Person | Crime and Punishment": synthesized SFX + an original score
# (a low cello drone and a slow heartbeat that thin out shot by shot while his world empties; the bridge street noise cut
# to silence on "cut"; the clock that stops on "guess"; half a second of total silence, then one warm chord when Sonya
# kneels; a cold low sting on Svidrigailov; a soft cello line for Dostoyevsky's point), ducked under the voice.
# Every event sits on the picture's word times (timing.json).
# Usage: ~/tts/chatterbox/bin/python sonya_sound.py  ->  audio/mix.wav (48 kHz stereo, exact picture length), stems, cues.md
import os, sys, json, wave
import numpy as np
from scipy import signal

AUDIO_LIB = "/Users/benson/claude-animated-shorts/.claude/worktrees/sonya-short/shorts/audio"
if not os.path.isdir(AUDIO_LIB): AUDIO_LIB = os.path.expanduser("~/claude-animated-shorts/shorts/audio")
sys.path.insert(0, AUDIO_LIB)
from dsp import (SR, ns, tt, rng, lp, hp, bp, peq, shelf, colored, smooth_noise, fades, pan, st, place, widen, make_ir, convolve_st,
                 integrated, true_peak, dbg, read_wav)
import instruments as I
import sfx_gen as G

ROOT = "/Users/benson/couch.potato.history/sonya-confession-short"
TM = json.load(open(os.path.join(ROOT, "timing.json")))
FPS, TOTAL = TM["fps"], TM["total"]
DUR = TOTAL / FPS
N = ns(DUR)
W = dict(TM["word"])
B = TM["beat"]
PRE = 3
cf = lambda b: (round(B[b] * FPS) - PRE) / FPS
# sets on the timeline (s), from story.ts SHOTS
cw = lambda k: (round(W[k] * FPS) - PRE) / FPS
_ST = [0.0] + [cf(i) for i in range(1, 14)] + [cw("crossroads"), cf(14), cf(15)]
_SETS = ["sonya", "wall", "bridge", "bridge", "garret", "lodging", "canal", "sonya", "sonya", "sonya", "sonya", "sonya", "sonya", "sonya", "haymarket", "empty", "sonya"]
SET = {k: [] for k in set(_SETS)}
for i, k in enumerate(_SETS): SET[k].append((_ST[i], _ST[i + 1] if i + 1 < len(_ST) else DUR))
cues = []


def cue(t, what):
    cues.append((t, what))


def buf():
    return np.zeros((2, N))


def env_seg(a, b, fin=0.4, fout=0.6):
    t = np.arange(N) / SR
    return np.clip((t - a) / fin + 1, 0, 1) * np.clip((b - t) / fout + 1, 0, 1)


# ================================================================ SFX
def clock(b, a, e, r, gain=0.12):
    t, k = a + 0.2, 0
    while t < e:
        place(b, pan(G.clink(r, 2600 if k % 2 else 2300, 0.03, 0.5), -0.6), t, gain); t += 0.5; k += 1


def heartbeat(r):
    t = tt(0.7)
    beat = lambda d: np.sin(2 * np.pi * 50 * (t - d)) * np.exp(-np.clip(t - d, 0, None) / 0.06) * (t >= d)
    return fades(lp(beat(0) + 0.7 * beat(0.22), 200), 0.001, 0.1)


def thud(r, f=55):
    t = tt(0.6)
    return fades(np.sin(2 * np.pi * np.cumsum(f * (1 + np.exp(-t / 0.03))) / SR) * np.exp(-t / 0.14) + 0.3 * lp(r.standard_normal(len(t)), 400) * np.exp(-t / 0.05), 0.001, 0.1)


def plop(r):
    t = tt(0.5)
    y = np.sin(2 * np.pi * np.cumsum(500 * (1 + 2 * np.exp(-t / 0.02))) / SR) * np.exp(-t / 0.05) + 0.3 * bp(r.standard_normal(len(t)), 1500, 6000) * np.exp(-t / 0.08)
    return fades(y, 0.001, 0.1)


def cloth(r, dur=0.6):
    return widen(G.whoosh(dur, r, 0.4, 800, 5000, 0.9, 0.2, 0.4), r)


def puff(r):
    t = tt(0.5)
    return fades(bp(r.standard_normal(len(t)), 300, 2500) * np.exp(-t / 0.12), 0.01, 0.1)


def water(dur, r):
    return st(lp(colored(ns(dur), r, 0.6), 900) * (0.6 + 0.4 * smooth_noise(ns(dur), r, 3)))


def build_sfx():
    r = rng(1866)
    S = buf()
    for a, b in SET["bridge"]:
        e = min(b, W["cut"] - 0.05)
        place(S, water(b - a, r), a, 0.05)
        place(S, st(G.breeze(e - a, r, 1.0, 0.3, 900)), a, 0.08)
        place(S, G.babble(e - a, r, 150, 1.0, 3.5, 0.4, fmax=2000) * 0.5, a, 0.05)
        t = a + 0.6
        while t < e - 0.3: place(S, pan(G.boot(r, 0.5), r.uniform(-0.6, 0.6)), t, 0.06); t += r.uniform(0.35, 0.7)
    place(S, st(G.breeze(DUR - W["cut"], r, 0.4, 0.15, 400))[:, :ns(SET["bridge"][-1][1] - W["cut"])], W["cut"], 0.03)
    cue(W["cut"], "the bridge: wind, wheels, people, all cut to near silence on 'cut'")
    for a, b in SET["garret"] + SET["lodging"]:
        place(S, st(lp(colored(ns(b - a), r, 0.8), 600) * 0.3), a, 0.03)
    for a, b in SET["canal"]:
        place(S, water(b - a, r), a, 0.04); place(S, st(G.breeze(b - a, r, 0.7, 0.2, 600)), a, 0.05)
    for a, b in SET["haymarket"]:
        place(S, st(G.breeze(b - a, r, 1.4, 0.3, 700)), a, 0.1)
    for a, b in SET["empty"]:
        place(S, st(G.breeze(b - a, r, 0.4, 0.1, 300)), a, 0.02)
    # Sonya's room: a slow wall clock, until it stops on "guess"; it comes back softly in the last shot
    for a, b in SET["sonya"]:
        if a < W["guess"]: clock(S, a, min(b, W["guess"]), r, 0.09)
    clock(S, SET["sonya"][-1][0] + 0.5, DUR - 0.2, r, 0.05)
    cue(W["guess"], "the clock stops on 'guess'")
    place(S, pan(G.whoosh(0.5, r, 0.4, 200, 2000), 0.0), W["killed"] - 0.35, 0.3); place(S, thud(r, 45), W["killed"], 0.7); cue(W["killed"], "whoosh + muffled thud, cut to black")
    place(S, pan(G.clink(r, 2900, 0.35, 0.6), 0.1), W["coin"] + 0.02, 0.35); cue(W["coin"], "coin chime")
    place(S, pan(plop(r), 0.1), W["river"] + 0.65, 0.3); cue(W["river"], "tiny plop far below")
    place(S, pan(G.creak(0.6, r, 90, 60), 0.3), B[4] + 0.05, 0.4); place(S, pan(G.push_thump(r), 0.3), B[4] + 0.45, 0.3)
    for k in range(4): place(S, pan(G.stroll_step(r, 0.6), 0.2), B[4] + 0.4 + 0.25 * k, 0.25)
    cue(B[4], "the garret door bursts open, quick steps")
    for k in range(4): place(S, pan(G.stroll_step(r, 0.5), -0.3), W["forget"] + 0.15 + 0.35 * k, 0.2)
    place(S, pan(G.push_thump(r), -0.4), W["forget"] + 1.95, 0.55); cue(W["forget"], "steps out, the door shuts")
    for k in range(8): place(S, pan(G.stroll_step(r, 0.4), 0.0), cf(6) + 0.3 + 0.55 * k, 0.12)
    place(S, pan(G.clink(r, 3400, 0.4, 0.5), -0.1), W["lizaveta"] + 0.05, 0.15)
    for k in range(6): place(S, heartbeat(r), W["stares"] - 0.1 + 0.75 * k, 0.5)
    cue(W["stares"], "heartbeat while she understands")
    place(S, cloth(r, 0.7), W["knees"] - 0.15, 0.3); place(S, thud(r, 70), W["knees"] + 0.05, 0.3); cue(W["knees"], "rustle + knees on the boards")
    place(S, puff(r), W["myself"] - 0.02, 0.3); cue(W["myself"], "candle-blow puff: Napoleon gone")
    place(S, pan(G.clink(r, 3000, 0.3, 0.4), 0.0), W["tells3"] + 0.1, 0.12)
    place(S, st(G.breeze(2.5, r, 2.0, 0.6, 1500)), W["siberia"] - 0.1, 0.22); cue(W["siberia"], "a cold gust")
    place(S, pan(G.creak(0.7, r, 120, 80), 0.2), cf(14) + 0.3, 0.3); cue(cf(14), "a chair creaks next door")
    for b in (2, 4, 6, 7, 14):
        place(S, widen(G.whoosh(0.45, r, 0.22, 400, 3000), r), cf(b) - 0.2, 0.08)
    return S


# ================================================================ score (D minor, very slow)
def drone(M, t0, t1, r, notes, gain=0.5, warm=700, att=1.2):
    if t1 - t0 > 0.3: place(M, I.pad([I.m2f(m) for m in notes], t1 - t0, 0.5, r, att, 0.6, warm), t0, gain)


def cello(M, notes, r, gain=0.5):
    for t, m, d in notes: place(M, I.pad([I.m2f(m)], d, 0.6, r, 0.25, 0.5, 500), t, gain)


def build_music():
    r = rng(1865)
    M = buf()
    silence = B[10] - 0.55  # total silence before "Then she falls"
    # the drone thins out shot by shot: full, then fewer notes, quieter
    drone(M, 0.1, cf(2), r, (26, 38, 45, 50, 53), 0.5, 500); cue(0.0, "music: low cello drone")
    place(M, I.timpani(I.m2f(26), 0.8, r, 2.2), W["killed"] - 0.02, 0.5)
    drone(M, cf(2), cf(4), r, (26, 38, 45, 53), 0.42, 450)
    drone(M, cf(4), cf(6), r, (26, 38, 50), 0.36, 420)
    drone(M, cf(6), cf(9), r, (26, 38), 0.32, 400)
    drone(M, cf(9), silence, r, (26,), 0.3, 380)
    cue(cf(2), "music: the drone loses a note every shot or two, quieter (his world shrinking)")
    cue(silence, "music: silence before 'Then she falls'")
    drone(M, W["knees"] - 0.05, cf(12), r, (50, 57, 62, 65, 69), 0.5, 900, 0.8); cue(W["knees"], "music: one warm chord when she kneels")
    drone(M, cf(12), W["crossroads"], r, (38, 45, 50, 53), 0.4, 700)
    drone(M, W["crossroads"] - 0.1, cf(14) - 0.1, r, (38, 45, 50, 57), 0.38, 800)
    drone(M, cf(14), cf(15), r, (25, 37, 44), 0.42, 380); place(M, I.timpani(I.m2f(25), 0.9, r, 2.4), W["word"] - 0.02, 0.6); place(M, I.cymbal(0.4, r, 2.0, 0.6), W["word"], 0.2)
    cue(cf(14), "music: cold, a semitone low; sting on 'word'")
    cello(M, [(W["point"], 50, 1.6), (W["axe2"], 53, 1.4), (W["everyone2"], 57, 1.3), (W["truth"], 55, 1.4), (W["back"], 50, 2.0)], r, 0.55)
    drone(M, W["point"] - 0.2, DUR - 0.05, r, (38, 45, 50), 0.25, 500, 0.8)
    cue(W["point"], "music: solo cello for Dostoyevsky's point, resolving on D for the loop")
    return M


# ================================================================ mix
def voice_chain(x, thr_db=-24.0, ratio=3.5):
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
    room = make_ir(0.8, 3)
    S, M = S + 0.22 * convolve_st(S, room)[:, :N], M + 0.2 * convolve_st(M, room)[:, :N]
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
