# shots.json for short_qa.py + the still-frame list, with story.ts's cut rules (cf = beat onset - 3 f, cw = word onset - 3 f).
import json, os, re, sys, math
R = os.path.dirname(os.path.abspath(__file__))
D = os.path.join(R, sys.argv[1] if len(sys.argv) > 1 else "voice")
words = json.load(open(os.path.join(D, "words.json"))); beats = json.load(open(os.path.join(D, "beats.json")))
norm = lambda s: re.sub(r"[^a-z0-9]", "", s.lower())
W, seen = {}, {}
for w in words:
    k = norm(w["w"]) or "x"; k = "y" + k if k[0].isdigit() else k
    seen[k] = seen.get(k, 0) + 1; W[k if seen[k] == 1 else f"{k}{seen[k]}"] = w["s"]
B = [next(w["s"] for w in words if w["s"] >= b["s"] - 1e-3) for b in beats["beats"]]
TOT = math.ceil(beats["duration"] * 30)
cf = lambda b: round(B[b] * 30) - 3
cw = lambda k: round(W[k] * 30) - 3
st = [0] + [cf(i) for i in range(1, 14)] + [cw("crossroads"), cf(14), cf(15)]
en = st[1:] + [TOT]
XF = {3: 14, 5: 16, 7: 16, 15: 18, 17: 18}
shots = [{"id": i + 1, "a": a, "b": b} for i, (a, b) in enumerate(zip(st, en))]
kill = round(W["killed"] * 30)
out = {"shots": shots, "planned": [[kill, kill + 5]], "xfade": [[st[k - 1] - XF[k] // 2, st[k - 1] + XF[k] // 2] for k in XF]}
if D.endswith("voice"): json.dump(out, open(os.path.join(R, "shots.json"), "w"))
gag = ["dostoyevsky", "killed", "loneliest", "coin", "river", "cut", "hug", "lift", "forget", "sonya", "lizaveta", "guess", "stares", "backs",
       "knees", "unhappy", "theory", "myself", "kiss", "siberia", "empty", "word", "truth"]
fr = sorted(set([b - 2 for b in en] + [round(W[g] * 30) + 6 for g in gag]))
print(",".join(map(str, fr)))
