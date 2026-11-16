# per-word alignment scores of chosen beats in voice.wav (flags garbled words)
import json, os, re, sys
import numpy as np, soundfile as sf, torch, torchaudio
HERE = os.path.dirname(os.path.abspath(__file__))
y, sr = sf.read(os.path.join(HERE, "voice.wav"))
B = json.load(open(os.path.join(HERE, "beats.json")))["beats"]
SPOKEN = {10: "In March, sixteen ninety-nine, Challoner was condemned to hang.", 8: "The slipperiest was William Challoner, who accused the Mint itself of fraud!"}
bundle = torchaudio.pipelines.MMS_FA; model = bundle.get_model(with_star=False); D = bundle.get_dict(star=None)
for bi in [int(x) for x in sys.argv[1:]]:
    b = B[bi - 1]; text = SPOKEN.get(bi, b["text"])
    seg = y[int(b["s"] * sr):int(b["e"] * sr)]
    wav = torchaudio.functional.resample(torch.tensor(seg, dtype=torch.float32)[None], sr, bundle.sample_rate)
    words = [w for w in (re.sub(r"[^a-z']", "", p.lower()) for p in re.split(r"[\s\-]+", text)) if w]
    with torch.inference_mode(): em, _ = model(wav)
    toks = [D[c] for w in words for c in w if c in D]
    ali, sc = torchaudio.functional.forced_align(em, torch.tensor([toks], dtype=torch.int32), blank=0)
    spans = torchaudio.functional.merge_tokens(ali[0], sc[0].exp())
    i, out = 0, []
    for w in words:
        n = len(w); sp = spans[i:i + n]; i += n
        out.append(f"{w}:{np.mean([s.score for s in sp]):.2f}")
    print(bi, " ".join(out))
