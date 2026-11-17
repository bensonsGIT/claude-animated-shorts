# Regenerate one narration beat made by cb_voice.py, trying alternative spoken texts, and splice the best take into
# outdir/voice.wav (later words / beats shift by the length change). A take must pass the Whisper check and, if given,
# Whisper must also hear something matching --must (a regex, e.g. "t[iy]e?[ck]h?o" for Tycho).
# Usage: ~/tts/chatterbox/bin/python cb_regen.py spec.json outdir BEAT --alt "spoken text" [--alt ...] [--must REGEX] [--tries N]
import argparse, json, os, re, sys
import numpy as np, soundfile as sf, torch

ap = argparse.ArgumentParser()
ap.add_argument("spec"); ap.add_argument("outdir"); ap.add_argument("beat", type=int)
ap.add_argument("--alt", action="append", default=[]); ap.add_argument("--must", default=None); ap.add_argument("--tries", type=int, default=8)
A = ap.parse_args()
sys.argv = [sys.argv[0], A.spec]  # cb_voice_lib reads the spec path from argv at import
import importlib.util
spec_ = importlib.util.spec_from_file_location("cbv", os.path.join(os.path.dirname(os.path.abspath(__file__)), "cb_voice_lib.py"))
L = importlib.util.module_from_spec(spec_); spec_.loader.exec_module(L)

spec = json.load(open(A.spec))
y, sr = sf.read(os.path.join(A.outdir, "voice.wav")); y = y.astype(np.float32)
words = json.load(open(os.path.join(A.outdir, "words.json")))
meta = json.load(open(os.path.join(A.outdir, "beats.json"))); B = meta["beats"]
assert sr == L.SR
b = B[A.beat - 1]; disp = b["text"]; dws = disp.split()
default_spoken = " ".join(L.SUBS.get(d, d) for d in dws)
alts = A.alt or [default_spoken]
best = None
for k in range(A.tries):
    spoken = alts[k % len(alts)]
    sws = spoken.split()
    assert len(sws) == len(dws), f"alt must keep one spoken token per display word: {spoken}"
    torch.manual_seed(900 + 31 * A.beat + k)
    z = L.trim(L.tts.generate(spoken, audio_prompt_path=spec["ref"], exaggeration=L.EX, cfg_weight=L.CFG).squeeze().cpu().numpy())
    al = L.align(z, L.tw(spoken)); heard = L.transcribe(z)
    ok = L.heard_ok(heard, disp) and (not A.must or re.search(A.must, heard.lower()) is not None)
    worst = min(a[2] for a in al)
    print(f"beat {A.beat} take {k + 1}: {'OK ' if ok else 'BAD'} worst {worst:.2f} '{spoken}' -> heard '{heard}'", flush=True)
    if ok and (best is None or worst > best[0]):
        best = (worst, z, al, spoken, heard)
    if ok and worst >= 0.6:
        break
if best is None:
    print(f"beat {A.beat}: no acceptable take; voice unchanged"); sys.exit(1)
worst, z, al, spoken, heard = best
s0, e0 = int(b["s"] * sr), int(b["e"] * sr)
d = (len(z) - (e0 - s0)) / sr
y = np.concatenate([y[:s0], z, y[e0:]])
first = sum(len(x["text"].split()) for x in B[:A.beat - 1])
# the beat's old words (its word count may differ when the line's wording changed): words.json up to the next beat's start
old_n = sum(1 for w in words[first:] if w["s"] < b["e"] + 0.01)
new, j = [], 0
for dw, sw in zip(dws, spoken.split()):
    n = len(L.tw(sw))
    new.append({"w": dw, "s": round(b["s"] + al[j][0], 3), "e": round(b["s"] + al[j + n - 1][1], 3)}); j += n
rest = words[first + old_n:]
for w in rest:
    w["s"] = round(w["s"] + d, 3); w["e"] = round(w["e"] + d, 3)
words = words[:first] + new + rest
b["e"] = round(b["s"] + len(z) / sr, 3); b["heard"] = heard; b["ok"] = True
for x in B[A.beat:]:
    x["s"] = round(x["s"] + d, 3); x["e"] = round(x["e"] + d, 3)
meta["duration"] = round(len(y) / sr, 3)
sf.write(os.path.join(A.outdir, "voice.wav"), y, sr, subtype="PCM_16")
json.dump(words, open(os.path.join(A.outdir, "words.json"), "w"), indent=1)
json.dump(meta, open(os.path.join(A.outdir, "beats.json"), "w"), indent=1)
print(f"beat {A.beat}: replaced with '{spoken}' (heard '{heard}', {d:+.2f} s); voice now {len(y) / sr:.2f} s")
