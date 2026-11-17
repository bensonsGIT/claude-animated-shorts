# House delivery: voice sped up 8 % (ffmpeg atempo=1.08, run separately); scale words.json / beats.json to match.
# Reads *_unsped.json, writes words.json / beats.json.
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
K = 1.08
words = json.load(open(os.path.join(HERE, "words_unsped.json")))
for w in words:
    w["s"] = round(w["s"] / K, 3); w["e"] = round(w["e"] / K, 3)
json.dump(words, open(os.path.join(HERE, "words.json"), "w"), indent=1)
beats = json.load(open(os.path.join(HERE, "beats_unsped.json")))
beats["duration"] = round(beats["duration"] / K, 3)
for b in beats["beats"]:
    b["s"] = round(b["s"] / K, 3); b["e"] = round(b["e"] / K, 3)
json.dump(beats, open(os.path.join(HERE, "beats.json"), "w"), indent=1)
print("duration", beats["duration"])
