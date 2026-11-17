# Provisional words.json / beats.json from the script (~2.85 w/s) so the composition builds before the voice exists.
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
spec = json.load(open(os.path.join(HERE, "cb_spec.json")))
os.makedirs(os.path.join(HERE, "prov"), exist_ok=True)
t, words, beats = 0.15, [], []
for text, pause in spec["beats"]:
    s = t
    for w in text.split():
        d = 0.12 + 0.05 * len(w.strip(".,!:;"))
        words.append({"w": w, "s": round(t, 3), "e": round(t + d, 3)}); t += d + 0.06
    beats.append({"text": text, "s": round(s, 3), "e": round(t, 3)}); t += pause
json.dump(words, open(os.path.join(HERE, "prov/words.json"), "w"))
json.dump({"voice": "provisional", "duration": round(t + 0.3, 3), "beats": beats}, open(os.path.join(HERE, "prov/beats.json"), "w"))
print(round(t, 1))
