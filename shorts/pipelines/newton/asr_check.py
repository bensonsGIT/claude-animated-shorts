# transcribe narration beats with Whisper (transformers) to hear what was actually said
# Usage: ~/tts/chatterbox/bin/python asr_check.py <wav> <beats.json> <beat#> [...]   (beat# 0 = all)
import json, sys
import numpy as np, soundfile as sf, torch, torchaudio
from transformers import pipeline

wav, bj = sys.argv[1], sys.argv[2]
y, sr = sf.read(wav); y = y.astype(np.float32)
B = json.load(open(bj))["beats"]
asr = pipeline("automatic-speech-recognition", model="openai/whisper-small.en", device="cpu")
sel = [int(x) for x in sys.argv[3:]]
for i, b in enumerate(B, 1):
    if sel != [0] and i not in sel:
        continue
    seg = torch.tensor(y[int(b["s"] * sr):int(b["e"] * sr)])[None]
    seg = torchaudio.functional.resample(seg, sr, 16000)[0].numpy()
    print(f"{i:2d} heard: {asr({'raw': seg, 'sampling_rate': 16000})['text'].strip()}")
    print(f"   script: {b['text']}")
