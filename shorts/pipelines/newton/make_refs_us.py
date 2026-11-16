# American reference clips for Chatterbox cloning (synthetic Kokoro voices, no real person cloned).
# Run with the Kokoro venv: shorts/.venv-tts/bin/python make_refs_us.py
import os
import numpy as np
import soundfile as sf
from kokoro import KPipeline

HERE = os.path.dirname(os.path.abspath(__file__))
TEXT = ("The old house stood at the end of a narrow lane, half hidden by ivy. Every morning the mailman walked past it, "
        "nodded to the empty windows, and wondered who, if anyone, still lived inside.")
pipe = KPipeline(lang_code="a")
for v in ["am_michael", "am_fenrir", "am_adam", "af_heart"]:
    y = np.concatenate([r.audio.numpy() for r in pipe(TEXT, voice=v, speed=1.0)])
    sf.write(os.path.join(HERE, f"ref_{v}.wav"), y / max(1e-6, np.abs(y).max()) * 0.9, 24000)
    print(v, f"{len(y) / 24000:.1f} s")
