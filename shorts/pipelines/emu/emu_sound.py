# Sound for "Australia Sent Machine Guns After Emus. The Emus Won" (the Great Emu War, 1932): synthesized SFX + an
# original score (a jaunty military march, a comic stumble when the gun jams, sneaky plucks for the guerrillas, a chase
# gallop, a sad trombone for the retreat, the march again, more pompous, and a brass sting + wink at the end), ducked
# under the voice; every event sits on the picture's word times (~/emu-short/timing.json).
# Usage: ~/tts/chatterbox/bin/python emu_sound.py  ->  ~/emu-short/audio/mix.wav (48 kHz stereo, exact picture length),
# stems/*.wav, cues.md
import os, sys, json, wave
import numpy as np
from scipy import signal

AUDIO_LIB = os.path.expanduser("~/claude-animated-shorts/shorts/audio")
sys.path.insert(0, AUDIO_LIB)
from dsp import (SR, ns, tt, rng, lp, hp, bp, peq, shelf, colored, smooth_noise, fades, pan, st, place, widen, make_ir, convolve_st,
                 integrated, true_peak, dbg, read_wav)
import instruments as I
import sfx_gen as G

ROOT = os.path.expanduser("~/emu-short")
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
FIELD = [(0.0, cf(3)), (cf(5), cf(9)), (cf(10), cf(14))]
DAM = [(cf(3), cf(5))]
TRUCK = [(cf(6) + 0.2, cf(8)), (cf(8), cf(9))]
HOUSE = [(cf(9), cf(10)), (cf(14), DUR)]
INSIDE = HOUSE
cues = []


def cue(t, what):
    cues.append((t, what))


def buf():
    return np.zeros((2, N))


def env_seg(a, b, fin=0.4, fout=0.6):
    t = np.arange(N) / SR
    return np.clip((t - a) / fin + 1, 0, 1) * np.clip((b - t) / fout + 1, 0, 1)


# ================================================================ SFX
def thump(r, f=60, dur=0.25):
    t = tt(dur)
    return fades(np.sin(2 * np.pi * np.cumsum(f * (1 + 1.2 * np.exp(-t / 0.015))) / SR) * np.exp(-t / 0.06) + 0.4 * lp(r.standard_normal(len(t)), 400) * np.exp(-t / 0.03), 0.001, 0.04)


def stampede(dur, r, rate=40.0):
    """many big feet on dry ground"""
    n = ns(dur); out = np.zeros((2, n))
    for _ in range(int(dur * rate)):
        i = r.integers(0, max(1, n - ns(0.3)))
        x = thump(r, r.uniform(45, 85)) * r.uniform(0.3, 1.0)
        y = pan(x, r.uniform(-0.9, 0.9))
        out[:, i:i + y.shape[1]] += y[:, : n - i]
    return fades(out, 0.2, 0.3)


def lewis_burst(r, dur=0.6, rate=9.5):
    """the Lewis gun: a fast rattle of shots, each a crack + a low thump"""
    n = ns(dur); y = np.zeros(n)
    for k in range(int(dur * rate)):
        i = int(k / rate * SR)
        L = min(ns(0.09), n - i)
        tk = np.arange(L) / SR
        y[i:i + L] += hp(r.standard_normal(L), 900) * np.exp(-tk / 0.012) + 0.8 * np.sin(2 * np.pi * 70 * tk) * np.exp(-tk / 0.03)
    return fades(y, 0.002, 0.05)


def clank(r):
    t = tt(0.5)
    y = sum(a * np.sin(2 * np.pi * f * t + r.uniform(0, 6)) * np.exp(-t / d) for f, a, d in ((410, 1.0, 0.12), (1130, 0.6, 0.08), (2270, 0.4, 0.05)))
    return fades(y + 0.5 * bp(r.standard_normal(len(t)), 500, 4000) * np.exp(-t / 0.01), 0.001, 0.05)


def boing(r, f0=330, dur=0.6):
    t = tt(dur)
    f = f0 * (1 + 0.35 * np.exp(-t / 0.12) * np.sin(2 * np.pi * 14 * t))
    return fades(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.22), 0.002, 0.06)


def engine(dur, r, f=28.0):
    """a 1930s truck engine putter"""
    n = ns(dur); t = np.arange(n) / SR
    ph = np.cumsum(f * (1 + 0.04 * smooth_noise(n, r, 2))) / SR
    y = lp(2 * (ph % 1) - 1, 380, 2) * (0.6 + 0.4 * (np.sin(2 * np.pi * f * 0.5 * t) > 0)) + 0.25 * bp(r.standard_normal(n), 200, 1600) * smooth_noise(n, r, 9) ** 2
    return widen(fades(y, 0.3, 0.4), r, 7, 0.4)


def rattle(dur, r):
    n = ns(dur); y = np.zeros(n)
    for _ in range(int(dur * 14)):
        i = r.integers(0, n - 3000); y[i:i + 3000] += bp(r.standard_normal(3000), 600, 4000) * np.exp(-np.arange(3000) / 400) * r.uniform(0.3, 1)
    return fades(y, 0.05, 0.1)


def emu_boom(r, dur=1.0):
    """an emu's low drumming / booming call: a 70 Hz thrum pulsing ~4 times a second"""
    t = tt(dur)
    y = np.sin(2 * np.pi * 72 * t + 0.6 * np.sin(2 * np.pi * 144 * t)) * (0.5 + 0.5 * np.sin(2 * np.pi * 4.2 * t) ** 2) * np.sin(np.pi * t / dur)
    return fades(y, 0.02, 0.1)


def ping(r):
    t = tt(0.45)
    f = 3200 * np.exp(-t / 0.25) + 900
    return fades(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.12) + 0.3 * hp(r.standard_normal(len(t)), 3000) * np.exp(-t / 0.006), 0.001, 0.05)


def rustle(r, dur=0.6):
    n = ns(dur); t = np.arange(n) / SR
    y = bp(r.standard_normal(n), 500, 4500) * (0.4 + 0.6 * smooth_noise(n, r, 14) ** 2) * np.sin(np.pi * t / dur)
    return fades(y, 0.02, 0.06)


def sparkle(b, t0, r, notes=(86, 88, 91, 93, 95, 98), n=6, gain=0.5, step=0.07):
    for k in range(n):
        place(b, pan(I.glock(I.m2f(r.choice(notes)), r.uniform(0.3, 0.6), r, 1.0), r.uniform(-0.7, 0.7)), t0 + k * step, gain)


def murmur(dur, r, voices=6, lo=95, hi=140):
    n = ns(dur); out = np.zeros((2, n))
    for _ in range(voices):
        y = G.babble(dur, r, r.uniform(lo, hi), r.uniform(0.95, 1.05), r.uniform(3.4, 4.4), r.uniform(0.4, 0.7), fmax=3000)
        out += pan(lp(y, r.uniform(1800, 2800), 1) * r.uniform(0.3, 0.9), r.uniform(-0.85, 0.85))
    return fades(out, 0.5, 0.6)


def laughter(b, t0, r, n=8, gain=0.3):
    for k in range(n):
        place(b, pan(G.hurrah(r, r.uniform(110, 170), r.uniform(0.95, 1.1)) * r.uniform(0.4, 0.9), r.uniform(-0.8, 0.8)), t0 + r.uniform(0, 0.5), gain)


def build_sfx():
    r = rng(1932)
    S = buf()
    # ---- ambiences ----
    for a, b in FIELD + DAM:
        place(S, G.breeze(b - a, r, 0.55, bright=1400), a, 0.16); place(S, G.bird_chirps(b - a, r, 0.25, "sparrow"), a, 0.08)
    for a, b in DAM:
        place(S, G.water_bed(b - a, r, 0.4), a, 0.12)
    for a, b in TRUCK:
        place(S, engine(b - a, r), a, 0.32)
    for a, b in HOUSE:
        place(S, murmur(b - a, r, 7), a, 0.2)
    cue(0.0, "wind in the wheat, birds; dam water; truck engine; the chamber murmurs")
    # ---- the hook: a stampede rising on "birds" ----
    place(S, stampede(cf(1) - W["birds"] + 0.3, r, 55), W["birds"] - 0.25, 0.75)
    place(S, pan(emu_boom(r), -0.3), W["birds"] + 0.1, 0.5); cue(W["birds"], "stampede + emu booms")
    place(S, stampede(cw("wheat") - cf(1), r, 30), cf(1), 0.45)
    place(S, st(G.wood_crack(r)), W["stormed"] - 0.05, 0.5); place(S, st(thump(r, 50, 0.4)), W["stormed"] + 0.25, 0.6); cue(W["stormed"], "fence post cracks and falls")
    place(S, pan(G.oof(r, "oof", 140, 1.1), -0.3), W["western"] - 0.1, 0.4)
    # ---- the army arrives ----
    place(S, pan(G.boot(r, 1.0), 0.2), W["meredith"] - 0.05, 0.5)
    place(S, pan(G.clink(r, 1900, 0.12, 1.0), -0.2), W["lewis"] - 0.05, 0.4)
    for k in range(3): place(S, st(thump(r, 55, 0.35)), W["bullets"] - 0.25 + 0.12 * k + 0.56, 0.6)
    cue(W["bullets"], "ammo boxes thump down")
    # ---- the ambush: bursts, then the jam ----
    t0 = W["ambush"] - 0.1
    while t0 < W["jammed"] - 0.35:
        place(S, pan(lewis_burst(r, 0.55), -0.15), t0, 0.7); t0 += 0.75
    place(S, st(clank(r)), W["jammed"] - 0.03, 1.0); place(S, pan(boing(r), 0.1), W["jammed"] + 0.05, 0.6); cue(W["jammed"], "gun rattle, then CLANK + spring boing")
    place(S, stampede(cf(5) - cf(4), r, 35), cf(4), 0.55); cue(cf(4), "the flock scatters")
    # ---- guerrillas ----
    place(S, pan(rustle(r, 0.5), -0.4), W["guerrilla"] - 0.25, 0.5); place(S, pan(rustle(r, 0.5), 0.4), W["tactics"] + 0.1, 0.45)
    # ---- the chase ----
    place(S, pan(G.whoosh(0.5, r, 0.3, 300, 2500), 0.3), W["chase"] - 0.1, 0.5)
    place(S, rattle(cf(8) - W["rough"] + 0.4, r), W["rough"] - 0.3, 0.45); place(S, st(thump(r, 70, 0.3)), W["aim"] - 0.03, 0.6)
    place(S, stampede(cf(8) - cf(7), r, 22), cf(7), 0.35)
    place(S, pan(emu_boom(r, 1.2), 0.5), W["outran"] - 0.05, 0.6); cue(W["outran"], "emu boom as they pull away")
    # ---- Parliament: the joke lands ----
    laughter(S, W["medals"] + 0.05, r, 9, 0.35); place(S, I.glock(I.m2f(93), 0.5, r, 1.0), W["emus4"] - 0.02, 0.35); cue(W["medals"], "chamber laughter; bubble pop")
    # ---- 986, ten bullets for every bird ----
    for k in range(11): place(S, pan(thump(r, 90, 0.2), 0.3), cf(10) + 0.3 + k * (W["y986"] - cf(10) - 0.3) / 11, 0.35)
    place(S, pan(G.clink(r, 2600, 0.08, 0.9), 0.0), W["ten2"] - 0.02, 0.3)
    place(S, pan(G.whoosh(0.9, r, 0.12, 1500, 6000), 0.2), W["bird"] - 0.3, 0.25); cue(W["bird"], "a feather swish")
    # ---- invulnerability of tanks ----
    for tp in (W["machine2"], W["guns3"], W["invulnerability"], W["tanks"], W["tanks"] + 0.12): place(S, pan(ping(r), r.uniform(-0.5, 0.5)), tp, 0.55)
    cue(W["tanks"], "ricochet pings off the emu")
    # ---- bounty claims ----
    for k in range(10): place(S, pan(rustle(r, 0.3), r.uniform(-0.7, 0.7)), W["fiftyseven"] - 0.2 + k * 0.17, 0.3)
    place(S, st(thump(r, 110, 0.15)), W["claims"] - 0.03, 0.4); cue(W["claims"], "paper flurry + stamp")
    # ---- the coat of arms ----
    sparkle(S, W["arms"] - 0.05, r, n=4, gain=0.3)
    place(S, I.glock(I.m2f(98), 0.7, r, 1.0), W["arms2"] - 0.02, 0.6); cue(W["arms2"], "wink 'bink'")
    for tx in (cf(1), cf(3), cf(5), cf(9), cf(10), cf(13), cf(14)):
        place(S, widen(G.whoosh(0.45, r, 0.25, 400, 3500), r), tx - 0.2, 0.25)
    return S


# ================================================================ score (Bb major march, 116 bpm)
BEAT = 60 / 116
CH = {"Bb": [46, 58, 62, 65], "Eb": [51, 58, 63, 67], "F": [41, 57, 60, 65], "Gm": [43, 58, 62, 67], "Cm": [48, 60, 63, 67]}
# an original march tune, one note per beat (0 = rest), 8 bars of 4
MEL = [70, 70, 74, 77, 75, 74, 72, 0, 72, 72, 75, 79, 77, 75, 74, 0,
       74, 75, 77, 79, 77, 75, 74, 72, 70, 72, 74, 70, 77, 0, 70, 0]
PROG = ["Bb", "Bb", "F", "F", "Eb", "Bb", "F", "Bb"]


def march(M, t0, t1, r, gain=1.0, tune=True, pomp=1.0):
    """oom-pah tuba on 1 and 3, snare on every beat with a flam on 4, fife tune on top"""
    t, k = t0, 0
    while t < t1 - 0.05:
        bar = (k // 4) % 8
        ch = CH[PROG[bar]]
        j = k % 4
        if j in (0, 2): place(M, pan(I.brass(I.m2f(ch[0] if j == 0 else ch[0] + 7), BEAT * 0.55, 0.75, r, "tuba"), -0.2), t, gain * 0.8)
        else:
            for m in ch[1:]: place(M, pan(I.brass(I.m2f(m), BEAT * 0.3, 0.45 * pomp, r, "horn"), 0.2), t, gain * 0.18)
        place(M, pan(I.snare(0.55 if j else 0.8, r), 0.05), t, gain * 0.45)
        if j == 3: place(M, pan(I.snare(0.4, r), 0.05), t + BEAT / 2, gain * 0.3)
        m = MEL[k % 32]
        if tune and m: place(M, pan(I.fife(I.m2f(m + 12), BEAT * 0.85, 0.55, r), 0.25), t, gain * 0.5)
        t += BEAT; k += 1


def sneak(M, t0, t1, r, gain=1.0):
    line = [58, 61, 62, 63, 65, 63, 62, 61]
    t, k = t0, 0
    while t < t1 - 0.1:
        place(M, pan(I.pluck(I.m2f(line[k % 8]), 0.6, r, 0.25, 0.3), -0.15), t, gain)
        t += BEAT * (1.0 if k % 4 != 3 else 1.5); k += 1


def gallop(M, t0, t1, r, gain=1.0):
    """chase: a galloping snare (da-da-DUM) + low plucked ostinato"""
    t, k = t0, 0
    q = BEAT / 2
    while t < t1 - 0.05:
        for d, v in ((0, 0.4), (q / 2, 0.4), (q, 0.8)):
            place(M, pan(I.snare(v, r), 0.0), t + d, gain * 0.45)
        place(M, pan(I.pluck(I.m2f([46, 46, 53, 51][k % 4]), 0.8, r, 0.35, 0.4), -0.2), t, gain * 0.8)
        t += 2 * q; k += 1


def sad_trombone(M, t, r, gain=1.0):
    for k, m in enumerate((53, 52, 51)):
        place(M, I.brass(I.m2f(m), 0.42, 0.7, r, "soft"), t + 0.45 * k, gain * 0.6)
    place(M, I.brass(I.m2f(50), 1.1, 0.75, r, "soft", fall=-1.5), t + 1.35, gain * 0.7)


def sting(M, t, r, root=46, gain=1.0):
    for m in (root, root + 4, root + 7):
        place(M, I.brass(I.m2f(m + 12), 0.7, 0.85, r, "stab"), t - 0.02, 0.35 * gain)
    place(M, I.timpani(I.m2f(root), 0.8, r, 1.6), t - 0.02, 0.6 * gain); place(M, I.cymbal(0.4, r, 1.6), t, 0.3 * gain)


def build_music():
    r = rng(11)
    M = buf()
    march(M, 0.1, W["jammed"] - 0.1, r, 0.9); cue(0.1, "music: jaunty military march")
    sting(M, W["birds"], r, 46, 0.8)
    # the stumble: the band trips over itself on "jammed", a beat of silence
    for k, m in enumerate((70, 66, 61)): place(M, I.brass(I.m2f(m), 0.18, 0.7, r, "stab"), W["jammed"] + 0.05 + 0.13 * k, 0.4)
    cue(W["jammed"], "music: the band stumbles")
    sneak(M, cf(5) + 0.1, cf(6) - 0.05, r, 0.8); cue(cf(5), "music: sneaky plucks for the guerrillas")
    gallop(M, cf(6), cf(8) - 0.1, r, 0.9); cue(cf(6), "music: chase gallop")
    sad_trombone(M, W["pulled"] - 0.5, r, 1.0); cue(W["pulled"], "music: sad trombone")
    march(M, cf(10), W["tanks"] + 0.1, r, 0.85, True, 1.4); cue(cf(10), "music: the march again, more pompous")
    # silence after "tanks"; a light pluck walk under the bounty line; hush for the coat of arms; sting on "arms!"
    sneak(M, cf(13) + 0.1, cf(14) - 0.1, r, 0.5)
    place(M, I.pad([I.m2f(m) for m in (58, 62, 65, 70)], DUR - cf(14), 0.3, r, 0.8, 0.6, 1600), cf(14), 0.35)
    sting(M, W["arms2"], r, 46, 1.0); cue(W["arms2"], "music: brass sting")
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
    # rooms: the chamber is a big panelled room; outdoors a little air; voice stays dry
    ins = np.clip(sum(env_seg(a, b, 0.2, 0.3) for a, b in INSIDE), 0, 1)
    out = np.clip(1 - ins, 0, 1)
    room, air = make_ir(1.1, 3), make_ir(0.35, 5)

    def wet(x, k):
        return x + k * (convolve_st(x * ins, room)[:, :N] + 0.5 * convolve_st(x * out, air)[:, :N])
    S, M = wet(S, 0.22), wet(M, 0.2)
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
