# Audition TTS respellings of a name before the full voice run: which spelling does Chatterbox say as ONE continuous
# word, and does it sound like the name? For each candidate, a carrier sentence is generated a few times; the script
# prints the name's length, the silent gaps inside it (a stop closure is one gap of 40-90 ms; "bear . tee . ay" is
# three) and what Whisper heard. Takes are saved as <outdir>/<candidate>_<seed>.wav.
# Usage: ~/tts/chatterbox/bin/python cb_name_test.py spec.json outdir "So {} bought a thousand of them." Bairtyay Bertyay "Bear-tee-ay" [--seeds 3]
#   spec.json: any cb_spec.json (only ref / exaggeration / cfg are used). {} in the carrier is where the name goes.
import json, os, sys
argv = sys.argv[1:]
seeds = 3
if "--seeds" in argv:
    i = argv.index("--seeds"); seeds = int(argv[i + 1]); del argv[i:i + 2]
spec_path, OUT, CARRIER, CANDS = argv[0], argv[1], argv[2], argv[3:]
sys.argv = [sys.argv[0], spec_path]  # cb_voice_lib reads the spec path from argv at import
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np, soundfile as sf, torch
import cb_voice_lib as L

os.makedirs(OUT, exist_ok=True)
SR = L.SR
K0 = len(L.tw(CARRIER.split("{}")[0]))  # index of the name's first aligner word


def gaps(y, s, e):
    """(longest low-energy run in ms, number of runs) inside the span, ignoring its first and last 8 %"""
    seg = y[int(s * SR):int(e * SR)]
    hop, win = int(0.005 * SR), int(0.02 * SR)
    env = np.array([np.sqrt(np.mean(seg[i:i + win] ** 2)) for i in range(0, max(1, len(seg) - win), hop)])
    if len(env) < 4:
        return 0.0, 0
    low = env < 0.10 * env.max()
    best = run = n = 0
    for i, v in enumerate(low):
        if v and len(env) * 0.08 < i < len(env) * 0.92:
            run += 1; n += run == 1; best = max(best, run)
        else:
            run = 0
    return best * 5.0, n


rows = []
for c in CANDS:
    text = CARRIER.format(c)
    words, n = L.tw(text), len(L.tw(c))
    for seed in range(seeds):
        torch.manual_seed(4200 + seed)
        y = L.trim(L.tts.generate(text, audio_prompt_path=L.spec["ref"], exaggeration=L.EX, cfg_weight=L.CFG).squeeze().cpu().numpy())
        al = L.align(y, words)
        s, e = al[K0][0], al[K0 + n - 1][1]
        g, cnt = gaps(y, s, e)
        heard = L.transcribe(y)
        sf.write(os.path.join(OUT, f"{c}_{seed}.wav"), y, SR)
        row = {"cand": c, "seed": seed, "name_ms": round((e - s) * 1000), "longest_gap_ms": g, "gaps": cnt, "heard": heard}
        rows.append(row); print(json.dumps(row), flush=True)
json.dump(rows, open(os.path.join(OUT, "name_test.json"), "w"), indent=1)
print("== summary (fewer gaps + shorter = more continuous)")
for c in CANDS:
    r = [x for x in rows if x["cand"] == c]
    print(f"{c:16s} {np.mean([x['name_ms'] for x in r]):5.0f} ms  gaps {np.mean([x['gaps'] for x in r]):3.1f}  longest {np.mean([x['longest_gap_ms'] for x in r]):4.0f} ms")
