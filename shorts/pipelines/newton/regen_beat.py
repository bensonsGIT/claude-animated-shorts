# Regenerate single narration beats with Chatterbox, keep the take whose WORST word aligns best, splice it into
# voice.wav and shift the later words/beats. A beat is only replaced if the new take beats the current one.
# Usage: ~/tts/chatterbox/bin/python regen_beat.py <beat#> [<beat#> ...]
import json, os, re, sys, time
import numpy as np, soundfile as sf, torch, torchaudio

HERE = os.path.dirname(os.path.abspath(__file__))
REF, EX, CFG, TRIES = "am_michael", 0.5, 0.5, 8
# alternative spoken texts per beat (tried in turn); display text stays as in beats.json
SPOKEN = {
    8: ["The slipperiest was William Challoner, who accused the Mint itself of fraud!"],
    10: ["In March of sixteen ninety-nine, Challoner was condemned to hang.", "In March, sixteen ninety nine, Challoner was condemned to hang.",
         "In March sixteen ninety-nine, Challoner was condemned to hang."],
}
dev = "mps" if torch.backends.mps.is_available() else "cpu"
_load = torch.load
torch.load = lambda *a, **k: _load(*a, **{**k, "map_location": k.get("map_location", torch.device(dev))})
from chatterbox.tts import ChatterboxTTS
from transformers import pipeline as hf_pipeline

asr = hf_pipeline("automatic-speech-recognition", model="openai/whisper-small.en", device="cpu")
canon = lambda s: re.sub(r"[^a-z0-9 ]", "", s.lower().replace("challoner", "chaloner").replace("-", " ")).split()


def heard_ok(z, sr, display):
    """Whisper must hear exactly the script's words (no extra 'hm', no mispronounced words)"""
    seg = torchaudio.functional.resample(torch.tensor(z)[None], sr, 16000)[0].numpy()
    h = asr({"raw": seg, "sampling_rate": 16000})["text"]
    return canon(h) == canon(display), h.strip()

bundle = torchaudio.pipelines.MMS_FA; aligner = bundle.get_model(with_star=False); DICT = bundle.get_dict(star=None)
norm = lambda w: re.sub(r"[^a-z']", "", w.lower())
tw = lambda text: [x for x in (norm(p) for p in re.split(r"[\s\-]+", text)) if x]


def align(y, sr, words):
    wav = torchaudio.functional.resample(torch.tensor(y, dtype=torch.float32)[None], sr, bundle.sample_rate)
    with torch.inference_mode():
        em, _ = aligner(wav)
    toks = [DICT[c] for w in words for c in w if c in DICT]
    ali, sc = torchaudio.functional.forced_align(em, torch.tensor([toks], dtype=torch.int32), blank=0)
    spans = torchaudio.functional.merge_tokens(ali[0], sc[0].exp())
    r = wav.shape[1] / em.shape[1] / bundle.sample_rate
    out, i = [], 0
    for w in words:
        n = len([c for c in w if c in DICT]); sp = spans[i:i + n]; i += n
        out.append((sp[0].start * r, sp[-1].end * r, float(np.mean([s.score for s in sp]))))
    return out


def trim(y, sr, thr=0.012, pad=0.04):
    a = np.abs(y); k = np.convolve(a, np.ones(240) / 240, mode="same")
    idx = np.where(k > thr * a.max() / 0.5)[0]
    return y[max(0, idx[0] - int(pad * sr)):min(len(y), idx[-1] + int(pad * sr))] if len(idx) else y


def groups(disp, spoken):
    """display word -> [a, b) range of spoken words"""
    out, j = [], 0
    for d in disp.split():
        n = len(tw("sixteen ninety-nine")) if re.fullmatch(r"\d+,?", d) else len(tw(d))
        out.append((d, j, j + n)); j += n
    assert j == len(tw(spoken)), (disp, spoken, j, len(tw(spoken)))
    return out


y, sr = sf.read(os.path.join(HERE, "voice.wav")); y = y.astype(np.float32)
words = json.load(open(os.path.join(HERE, "words.json")))
meta = json.load(open(os.path.join(HERE, "beats.json"))); B = meta["beats"]
tts = ChatterboxTTS.from_pretrained(device=dev)
assert tts.sr == sr
ref = os.path.join(HERE, "chatterbox", f"ref_{REF}.wav")
for bi in [int(x) for x in sys.argv[1:]]:
    b = B[bi - 1]
    texts = SPOKEN.get(bi, [b["text"]])
    cur = y[int(b["s"] * sr):int(b["e"] * sr)]
    cur_worst = min(a[2] for a in align(cur, sr, tw(texts[0])))
    best = None
    for k in range(TRIES):
        text = texts[k % len(texts)]
        torch.manual_seed(500 + 37 * bi + k)
        t0 = time.time()
        z = trim(tts.generate(text, audio_prompt_path=ref, exaggeration=EX, cfg_weight=CFG).squeeze().cpu().numpy(), sr)
        al = align(z, sr, tw(text)); worst = min(a[2] for a in al)
        ok, h = heard_ok(z, sr, b["text"])
        print(f"beat {bi} take {k + 1}: heard {'OK ' if ok else 'BAD'} '{h}', worst word {worst:.2f}, {len(z) / sr:.2f} s ({time.time() - t0:.0f} s)", flush=True)
        if ok and (best is None or worst > best[0]):
            best = (worst, z, al, text)
        if ok and worst >= 0.6:
            break
    if best is None:
        print(f"beat {bi}: no clean take in {TRIES}, kept the current one"); continue
    worst, z, al, text = best
    # splice: replace [s, e) with z, shift everything after by the length change
    s0, e0 = int(b["s"] * sr), int(b["e"] * sr)
    d = (len(z) - (e0 - s0)) / sr
    y = np.concatenate([y[:s0], z, y[e0:]])
    first = sum(len(x["text"].split()) for x in B[:bi - 1])
    for g, (dw, a, c) in enumerate(groups(b["text"], text)):
        words[first + g] = {"w": dw, "s": round(b["s"] + al[a][0], 3), "e": round(b["s"] + al[c - 1][1], 3)}
    for w in words[first + len(b["text"].split()):]:
        w["s"] = round(w["s"] + d, 3); w["e"] = round(w["e"] + d, 3)
    b["e"] = round(b["s"] + len(z) / sr, 3); b["align"] = round(float(np.mean([a[2] for a in al])), 3)
    for x in B[bi:]:
        x["s"] = round(x["s"] + d, 3); x["e"] = round(x["e"] + d, 3)
    print(f"beat {bi}: replaced (worst word {cur_worst:.2f} -> {worst:.2f}, {d:+.2f} s)")
meta["duration"] = round(len(y) / sr, 3)
sf.write(os.path.join(HERE, "voice.wav"), y, sr, subtype="PCM_16")
json.dump(words, open(os.path.join(HERE, "words.json"), "w"), indent=1)
json.dump(meta, open(os.path.join(HERE, "beats.json"), "w"), indent=1)
print(f"voice: {len(y) / sr:.2f} s")
