# Reference clips for Chatterbox voice cloning: ~10 s of neutral narration in synthetic Kokoro British voices
# (no real person's voice is cloned). Run with the Kokoro venv: shorts/.venv-tts/bin/python make_refs.py
import os
import numpy as np
import soundfile as sf
from kokoro import KPipeline

HERE = os.path.dirname(os.path.abspath(__file__))
TEXT = ("The old house stood at the end of a narrow lane, half hidden by ivy. Every morning the postman walked past it, "
        "tipped his hat to the empty windows, and wondered who, if anyone, still lived inside.")
pipe = KPipeline(lang_code="b")
for v in ["bm_lewis", "bm_george", "bm_fable", "bm_daniel"]:
    y = np.concatenate([r.audio.numpy() for r in pipe(TEXT, voice=v, speed=1.0)])
    sf.write(os.path.join(HERE, f"ref_{v}.wav"), y / max(1e-6, np.abs(y).max()) * 0.9, 24000)
    print(v, f"{len(y) / 24000:.1f} s")
