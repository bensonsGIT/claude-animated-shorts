# Chatterbox voice samples for the Newton short: the hook + the ending, one sentence per generation joined with pauses.
# Run: ~/tts/chatterbox/bin/python samples.py   -> samples/*.wav (+ a Kokoro baseline for comparison)
import os, sys, time
import numpy as np
import torch
import soundfile as sf

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "samples")
os.makedirs(OUT, exist_ok=True)
LINES = [
    ("A young man once slid a needle behind his own eyeball, on purpose!", 0.55),
    ("He wanted to know how we see color, so he pressed on the back of his eye.", 0.8),
    ("Newton was unmoved.", 0.7),
    ("Mercy was never his specialty.", 0.45),
    ("Neither was caution!", 0.6),
]
dev = "mps" if torch.backends.mps.is_available() else "cpu"
# checkpoints were saved on CUDA: map them onto this device
_load = torch.load
torch.load = lambda *a, **k: _load(*a, **{**k, "map_location": k.get("map_location", torch.device(dev))})

from chatterbox.tts import ChatterboxTTS
from chatterbox.tts_turbo import ChatterboxTurboTTS

ref = lambda v: os.path.join(HERE, f"ref_{v}.wav")
# name, model, reference (None = built-in voice), exaggeration, cfg_weight
VARIANTS = [
    ("A_builtin", "std", None, 0.5, 0.5),
    ("B_lewis", "std", "bm_lewis", 0.5, 0.5),
    ("C_lewis_dramatic", "std", "bm_lewis", 0.75, 0.3),
    ("D_george", "std", "bm_george", 0.5, 0.5),
    ("E_fable", "std", "bm_fable", 0.5, 0.5),
    ("F_daniel", "std", "bm_daniel", 0.5, 0.5),
    ("G_turbo_lewis", "turbo", "bm_lewis", 0, 0),
    ("H_turbo_george", "turbo", "bm_george", 0, 0),
    # American references
    ("I_us_michael", "std", "am_michael", 0.5, 0.5),
    ("J_us_fenrir", "std", "am_fenrir", 0.5, 0.5),
    ("K_us_adam", "std", "am_adam", 0.5, 0.5),
    ("L_us_heart", "std", "af_heart", 0.5, 0.5),
    ("M_us_fenrir_dramatic", "std", "am_fenrir", 0.75, 0.3),
]
only = set(sys.argv[1:])
models = {}
for name, kind, voice, ex, cfg in VARIANTS:
    if only and name not in only:
        continue
    if kind not in models:
        t0 = time.time()
        models[kind] = (ChatterboxTTS if kind == "std" else ChatterboxTurboTTS).from_pretrained(device=dev)
        print(f"loaded {kind} on {dev} in {time.time() - t0:.0f} s", flush=True)
    m = models[kind]
    torch.manual_seed(7)
    t0, parts = time.time(), []
    for text, pause in LINES:
        kw = {"audio_prompt_path": ref(voice)} if voice else {}
        if kind == "std":
            kw.update(exaggeration=ex, cfg_weight=cfg)
        wav = m.generate(text, **kw).squeeze().cpu().numpy()
        parts += [wav, np.zeros(int(pause * m.sr), np.float32)]
    y = np.concatenate(parts)
    y = y / max(1e-6, np.abs(y).max()) * 0.9
    sf.write(os.path.join(OUT, f"{name}.wav"), y, m.sr)
    print(f"{name}: {len(y) / m.sr:.1f} s audio in {time.time() - t0:.0f} s", flush=True)
