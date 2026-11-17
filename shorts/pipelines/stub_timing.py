# A stand-in timing.ts made from the voice spec alone (0.33 s per word + the spec's pauses), so story.ts / cast.ts can be
# written, type-checked and rendered as stills WHILE Chatterbox is still generating (~1-2 min per line).
# Every word key the real make_timing.py will produce exists here, so the shots retime themselves when the real file lands.
# Usage: python3 pipelines/stub_timing.py ~/<name>-short/voice/cb_spec.json src/videos/<name>/timing.ts
import json, re, sys
s = json.load(open(sys.argv[1]))
norm = lambda x: re.sub(r"[^a-z0-9]", "", x.lower())
W, seen, words, beat, t = {}, {}, [], [], 0.15
for d, p in s['beats']:
    beat.append(t)
    for w in d.split():
        k = norm(w) or "x"
        if k[0].isdigit():
            k = "y" + k
        seen[k] = seen.get(k, 0) + 1
        W[k if seen[k] == 1 else f"{k}{seen[k]}"] = round(t, 3)
        words.append({"w": w, "s": round(t, 3), "e": round(t + 0.3, 3)})
        t += 0.33
    t += p
W["end"] = t
out = sys.argv[2]
open(out, 'w').write(f"// STUB from pipelines/stub_timing.py - replace with make_timing.py output once the voice exists\nexport const TOTAL = {int(t*30)+30};\nexport const WORD = {json.dumps(W)};\nexport const BEAT = {json.dumps(beat)};\nexport const WORDS: {{ w: string; s: number; e: number }}[] = {json.dumps(words)};\n")
print(" ".join(W))
