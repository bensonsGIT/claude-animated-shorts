# Use an external narration (e.g. ElevenLabs) instead of Chatterbox: decode it, check it against the script with Whisper,
# force-align the script's words (MMS_FA) and write voice.wav / words.json / beats.json in cb_voice.py's format.
# usage: ~/tts/chatterbox/bin/python ext_voice.py <spec.json> <audio file> <out dir>
import json, os, re, subprocess, sys, difflib
import numpy as np, soundfile as sf, torch, torchaudio
from transformers import pipeline as hf_pipeline

spec, src, OUT = json.load(open(sys.argv[1])), sys.argv[2], sys.argv[3]
SR = 44100
tmp = os.path.join(OUT, "_ext.wav")
subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", src, "-ac", "1", "-ar", str(SR), tmp], check=True)
y, _ = sf.read(tmp); os.remove(tmp)
y = y.astype(np.float32)

# ---- Whisper check (30 s chunks) ----
asr = hf_pipeline("automatic-speech-recognition", model="openai/whisper-small.en", device="cpu", chunk_length_s=30)
y16 = torchaudio.functional.resample(torch.tensor(y)[None], SR, 16000)[0].numpy()
heard = asr({"raw": y16, "sampling_rate": 16000})["text"].strip()
canon = lambda s: re.sub(r"[^a-z0-9' ]", " ", s.lower().replace("-", " ")).split()
script = " ".join(t for t, _ in spec["beats"])
e, h = canon(script), canon(heard)
diffs = [(op, " ".join(e[a0:a1]), " ".join(h[b0:b1])) for op, a0, a1, b0, b1 in difflib.SequenceMatcher(None, e, h, autojunk=False).get_opcodes() if op != "equal"]
print("HEARD:", heard)
print("DIFFS (script -> heard):", diffs if diffs else "none")

# ---- forced alignment of the whole script ----
bundle = torchaudio.pipelines.MMS_FA; aligner = bundle.get_model(with_star=False); DICT = bundle.get_dict(star=None)
letters = lambda w: re.sub(r"[^a-z']", "", w.lower())
disp = [(bi, w) for bi, (t, _) in enumerate(spec["beats"]) for w in t.split()]
parts = [[x for x in (letters(p) for p in re.split(r"[\s\-]+", w)) if x] for _, w in disp]
flat = [p for ps in parts for p in ps]
wav = torchaudio.functional.resample(torch.tensor(y)[None], SR, bundle.sample_rate)
with torch.inference_mode():
    em, _ = aligner(wav)
toks = [DICT[c] for w in flat for c in w if c in DICT]
ali, sc = torchaudio.functional.forced_align(em, torch.tensor([toks], dtype=torch.int32), blank=0)
spans = torchaudio.functional.merge_tokens(ali[0], sc[0].exp())
r = wav.shape[1] / em.shape[1] / bundle.sample_rate
seg, i = [], 0
for w in flat:
    n = len([c for c in w if c in DICT]); sp = spans[i:i + n]; i += n
    seg.append((sp[0].start * r, sp[-1].end * r, float(np.mean([s.score for s in sp]))))
words, k, worst = [], 0, []
for (bi, w), ps in zip(disp, parts):
    s0, e0 = seg[k][0], seg[k + len(ps) - 1][1]; sc_ = min(seg[j][2] for j in range(k, k + len(ps))); k += len(ps)
    words.append({"w": w, "s": round(s0, 3), "e": round(e0, 3), "b": bi}); worst.append((sc_, w))
beats = []
for bi in range(len(spec["beats"])):
    ws = [x for x in words if x["b"] == bi]
    beats.append({"s": ws[0]["s"], "e": ws[-1]["e"], "text": spec["beats"][bi][0]})
for x in words: del x["b"]
dur = len(y) / SR
for a, b in (("voice.wav", "voice_chatterbox.wav"), ("words.json", "words_chatterbox.json"), ("beats.json", "beats_chatterbox.json")):
    pa, pb = os.path.join(OUT, a), os.path.join(OUT, b)
    if os.path.exists(pa) and not os.path.exists(pb): os.rename(pa, pb)
sf.write(os.path.join(OUT, "voice.wav"), y, SR)
json.dump(words, open(os.path.join(OUT, "words.json"), "w"))
json.dump({"duration": dur, "voice": "elevenlabs:" + os.path.basename(src), "beats": beats}, open(os.path.join(OUT, "beats.json"), "w"))
print(f"duration {dur:.2f} s, {len(words)} words, {len(beats)} beats; lowest aligner scores:", sorted(worst)[:5])
print("gaps between beats (s):", [round(beats[j + 1]["s"] - beats[j]["e"], 2) for j in range(len(beats) - 1)])
