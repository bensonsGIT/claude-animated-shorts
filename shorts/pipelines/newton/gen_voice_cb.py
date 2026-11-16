# Newton short narration with Chatterbox (cloned from a synthetic Kokoro voice reference), one sentence per generation,
# silence-trimmed and joined with hand-set pauses. Chatterbox gives no word timings, so every sentence is force-aligned
# to its known words with torchaudio's MMS_FA aligner; a sentence whose alignment score is poor is regenerated.
# Captions show the script's spelling (DISPLAY); the TTS reads respellings (e.g. 1699 -> "sixteen ninety-nine").
# Usage: ~/tts/chatterbox/bin/python gen_voice_cb.py [ref_voice] [exaggeration] [cfg]  -> voice.wav, words.json, beats.json
import json, os, re, sys, time
import numpy as np
import torch, torchaudio
import soundfile as sf

HERE = os.path.dirname(os.path.abspath(__file__))
REF = sys.argv[1] if len(sys.argv) > 1 else "am_michael"
EX = float(sys.argv[2]) if len(sys.argv) > 2 else 0.5
CFG = float(sys.argv[3]) if len(sys.argv) > 3 else 0.5
# (display text for captions, text the TTS reads, pause after in s)
BEATS = [
    ("A young man once slid a needle behind his own eyeball, on purpose!", None, 0.55),
    ("He wanted to know how we see color, so he pressed on the back of his eye.", None, 0.4),
    ("He saw rings of white, dark and color, and sketched it all in his notebook.", None, 0.5),
    ("That man was Isaac Newton, one of the greatest scientists in history!", None, 0.5),
    ("Later, he stared at the sun's reflection until he had to hide in a dark room for days!", None, 0.6),
    ("Decades later, he took a job at England's Royal Mint.", None, 0.4),
    ("His mission: hunt counterfeiters, a crime punished as high treason.", None, 0.5),
    ("The slipperiest was William Chaloner, who accused the Mint itself of fraud!", "The slipperiest was William Challoner, who accused the Mint itself of fraud!", 0.5),
    ("Newton spent months building the case against him.", None, 0.5),
    ("In March 1699, Chaloner was condemned to hang.", "In March, sixteen ninety-nine, Challoner was condemned to hang.", 0.4),
    ("He wrote Newton a letter begging for mercy.", None, 0.6),
    ("Newton was unmoved.", None, 0.7),
    ("Mercy was never his specialty.", None, 0.45),
    ("Neither was caution!", None, 0.9),
]
LEAD = 0.15
MIN_SCORE = 0.55  # mean per-word alignment probability below this -> regenerate (up to 3 tries, keep the best)

dev = "mps" if torch.backends.mps.is_available() else "cpu"
_load = torch.load
torch.load = lambda *a, **k: _load(*a, **{**k, "map_location": k.get("map_location", torch.device(dev))})
from chatterbox.tts import ChatterboxTTS

tts = ChatterboxTTS.from_pretrained(device=dev)
SR = tts.sr
ref = os.path.join(HERE, "chatterbox", f"ref_{REF}.wav")
bundle = torchaudio.pipelines.MMS_FA
aligner = bundle.get_model(with_star=False)
DICT = bundle.get_dict(star=None)
norm = lambda w: re.sub(r"[^a-z']", "", w.lower().replace("-", " "))


def tts_words(text):
    """the words the TTS speaks, lower-case letters only (hyphens split)"""
    return [x for x in (norm(p) for p in re.split(r"[\s\-]+", text)) if x]


def trim(y, thr=0.012, pad=0.04):
    a = np.abs(y)
    k = np.convolve(a, np.ones(240) / 240, mode="same")
    idx = np.where(k > thr * a.max() / 0.5)[0] if a.max() > 0 else []
    if not len(idx):
        return y
    s, e = max(0, idx[0] - int(pad * SR)), min(len(y), idx[-1] + int(pad * SR))
    return y[s:e]


def align(y, words):
    """word spans (s, e in seconds) + mean score for the transcript words in mono audio y at SR"""
    wav = torchaudio.functional.resample(torch.tensor(y, dtype=torch.float32)[None], SR, bundle.sample_rate)
    with torch.inference_mode():
        em, _ = aligner(wav)
    tokens = [DICT[c] for w in words for c in w if c in DICT]
    ali, scores = torchaudio.functional.forced_align(em, torch.tensor([tokens], dtype=torch.int32), blank=0)
    ali, scores = ali[0], scores[0].exp()
    spans = torchaudio.functional.merge_tokens(ali, scores)
    ratio = wav.shape[1] / em.shape[1] / bundle.sample_rate
    out, i = [], 0
    for w in words:
        n = len([c for c in w if c in DICT])
        sp = spans[i:i + n]; i += n
        out.append((sp[0].start * ratio, sp[-1].end * ratio, float(np.mean([s.score for s in sp]))))
    return out


audio, words, beats, t = [np.zeros(int(LEAD * SR), np.float32)], [], [], LEAD
for bi, (disp, spoken, pause) in enumerate(BEATS):
    spoken = spoken or disp
    sw = tts_words(spoken)
    best = None
    for attempt in range(3):
        torch.manual_seed(11 + 100 * bi + attempt)
        t0 = time.time()
        y = trim(tts.generate(spoken, audio_prompt_path=ref, exaggeration=EX, cfg_weight=CFG).squeeze().cpu().numpy())
        al = align(y, sw)
        score = float(np.mean([a[2] for a in al]))
        print(f"beat {bi + 1} try {attempt + 1}: {len(y) / SR:.2f} s, align {score:.2f} ({time.time() - t0:.0f} s)", flush=True)
        if best is None or score > best[2]:
            best = (y, al, score)
        if score >= MIN_SCORE:
            break
    y, al, score = best
    # map display words onto spoken words (respelled numbers / names cover several spoken words)
    dw = disp.split()
    groups = []
    j = 0
    for d in dw:
        n = len(tts_words(d)) if norm(d) else 0
        if re.fullmatch(r"\d+,?", d):
            n = len(tts_words("sixteen ninety-nine"))  # the only number in this script
        groups.append((d, j, j + n)); j += n
    assert j == len(sw), (disp, j, len(sw))
    for d, a, b in groups:
        words.append({"w": d, "s": round(t + al[a][0], 3), "e": round(t + al[b - 1][1], 3)})
    beats.append({"text": disp, "s": round(t, 3), "e": round(t + len(y) / SR, 3), "align": round(score, 3)})
    audio += [y.astype(np.float32), np.zeros(int(pause * SR), np.float32)]
    t += len(y) / SR + pause

y = np.concatenate(audio)
y *= 0.89 / max(1e-6, np.abs(y).max())
sf.write(os.path.join(HERE, "voice.wav"), y, SR, subtype="PCM_16")
json.dump(words, open(os.path.join(HERE, "words.json"), "w"), indent=1)
json.dump({"voice": f"chatterbox:{REF}", "duration": round(len(y) / SR, 3), "beats": beats}, open(os.path.join(HERE, "beats.json"), "w"), indent=1)
print(f"chatterbox {REF}: {len(y) / SR:.2f} s, {len(words)} words, {len(beats)} beats, worst align {min(b['align'] for b in beats):.2f}")
