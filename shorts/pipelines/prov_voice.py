# Provisional words.json / beats.json from the script, so the picture can be built and checked before Ben's narration
# arrives. Paced like his ElevenLabs reads (~2.4 words/s with pauses, measured on Dorian Gray: 216 words -> 89.7 s).
# usage: python3 prov_voice.py <spec.json> <out dir>   then make_timing.py on that dir
import json, os, sys
spec, out = json.load(open(sys.argv[1])), sys.argv[2]
os.makedirs(out, exist_ok=True)
t, words, beats = 0.25, [], []
for text, _pause in spec["beats"]:
    s0 = t
    for w in text.split():
        d = 0.14 + 0.048 * len(w.strip(".,!?;:\"'"))
        words.append({"w": w, "s": round(t, 3), "e": round(t + d * 0.9, 3)}); t += d
        if w[-1] in ",;:": t += 0.15
    beats.append({"s": round(s0, 3), "e": round(t, 3), "text": text}); t += 0.6
json.dump(words, open(os.path.join(out, "words.json"), "w"))
json.dump({"duration": t + 0.3, "voice": "provisional", "beats": beats}, open(os.path.join(out, "beats.json"), "w"))
print(f"provisional: {len(words)} words, {t + 0.3:.1f} s")
