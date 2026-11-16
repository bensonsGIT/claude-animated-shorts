# Newton short. Narration with Kokoro (local, open-source TTS), one utterance per beat with hand-set pauses, plus exact word timings
# from Kokoro's own token timestamps (the script's real words, punctuation attached, for captions).
# Usage: .venv-tts/bin/python gen_voice.py [voice] [speed] [pause_scale]   (SAMPLE=1: just the hook, into samples/)   -> voice.wav (24 kHz), words.json [{w, s, e}], beats.json
import json, os, sys
import numpy as np
import soundfile as sf
from kokoro import KPipeline

VOICE = sys.argv[1] if len(sys.argv) > 1 else "af_heart"
SPEED = float(sys.argv[2]) if len(sys.argv) > 2 else 1.0
PAUSE_K = float(sys.argv[3]) if len(sys.argv) > 3 else 1.0  # < 1 tightens the pauses; the comic beats (>= 0.55 s) keep theirs
SAMPLE = os.environ.get("SAMPLE") == "1"
SR = 24000
HERE = os.path.dirname(os.path.abspath(__file__))
# (text, pause after in s): the picture cuts on these beats
BEATS = [
    ("A young man once slid a needle behind his own eyeball, on purpose!", 0.55),
    ("He wanted to know how we see color, so he pressed on the back of his eye.", 0.4),
    ("He saw rings of white, dark and color, and sketched it all in his notebook.", 0.5),
    ("That man was Isaac Newton, one of the greatest scientists in history!", 0.5),
    ("Later, he stared at the sun's reflection until he had to hide in a dark room for days!", 0.6),
    ("Decades later, he took a job at England's Royal Mint.", 0.4),
    ("His mission: hunt counterfeiters, a crime punished as high treason.", 0.5),
    ("The slipperiest was William [Chaloner](/ʧˈalənə/), who accused the Mint itself of fraud!", 0.5),
    ("Newton spent months building the case against him.", 0.5),
    ("In March 1699, [Chaloner](/ʧˈalənə/) was condemned to hang.", 0.4),
    ("He wrote Newton a letter begging for mercy.", 0.6),
    ("Newton was unmoved.", 0.7),
    ("Mercy was never his specialty.", 0.45),
    ("Neither was caution!", 0.9),
]
LEAD = 0.15  # silence before the first word

pipe = KPipeline(lang_code=VOICE[0])


audio, words, beats, t = [np.zeros(int(LEAD * SR), np.float32)], [], [], LEAD
for text, pause in (BEATS[:1] if SAMPLE else BEATS):
    pause = pause if pause >= 0.55 else pause * PAUSE_K
    chunks = list(pipe(text, voice=VOICE, speed=SPEED))
    seg_start = t
    for r in chunks:
        a = r.audio.numpy() if hasattr(r.audio, "numpy") else np.asarray(r.audio)
        for tok in r.tokens or []:
            if tok.start_ts is None or tok.end_ts is None or not tok.text.strip():
                continue
            if all(not c.isalnum() for c in tok.text):  # punctuation joins the previous word
                if words: words[-1]["w"] += tok.text
                continue
            words.append({"w": tok.text + (tok.whitespace and "" or ""), "s": round(t + tok.start_ts, 3), "e": round(t + tok.end_ts, 3)})
        audio.append(a.astype(np.float32)); t += len(a) / SR
    beats.append({"text": text, "s": round(seg_start, 3), "e": round(t, 3)})
    audio.append(np.zeros(int(pause * SR), np.float32)); t += pause

y = np.concatenate(audio)
y *= 0.89 / max(1e-6, np.abs(y).max())
if SAMPLE:
    os.makedirs(os.path.join(HERE, "samples"), exist_ok=True)
    sf.write(os.path.join(HERE, "samples", f"hook_{VOICE}_{SPEED}.wav"), y, SR, subtype="PCM_16")
    print(f"sample {VOICE} @ {SPEED}: {len(y) / SR:.2f} s"); sys.exit(0)
sf.write(os.path.join(HERE, "voice.wav"), y, SR, subtype="PCM_16")
json.dump(words, open(os.path.join(HERE, "words.json"), "w"), indent=1)
json.dump({"voice": VOICE, "duration": round(len(y) / SR, 3), "beats": beats}, open(os.path.join(HERE, "beats.json"), "w"), indent=1)
print(f"{VOICE}: {len(y) / SR:.2f} s, {len(words)} words, {len(beats)} beats")
print(" ".join(w["w"] for w in words))
