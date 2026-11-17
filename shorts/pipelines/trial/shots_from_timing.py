# Shot ranges for The Trial short from ~/the-trial-short/timing.json, with the same cut rules as story.ts (cf / cw).
# Writes ~/the-trial-short/shots.json for scripts/short_qa.py and prints useful still frames (shot ends + gag words).
import json, os
R = os.path.expanduser("~/the-trial-short")
T = json.load(open(os.path.join(R, "timing.json")))
F = lambda s: round(s * 30)
cf = lambda b: F(T["beat"][b]) - 3
W = lambda k: F(T["word"][k])
cw = lambda k: W(k) - 3
cuts = [0, cf(1), cf(2), cf(3), cf(4), cw("everyone"), cf(5), cf(6), cf(7), cf(8), cf(9), cf(10), cw("whole"), cf(11), cf(12), cw("quarry"),
        cf(13), cf(14), cf(15), T["total"]]
shots = [{"id": i + 1, "a": cuts[i], "b": cuts[i + 1]} for i in range(len(cuts) - 1)]
XF = {4: 12, 7: 12, 9: 12, 10: 12, 12: 14, 13: 12, 15: 14, 16: 10, 18: 18, 19: 14}
meta = {"shots": shots, "flash": [cf(1), cf(1) + 4], "xfade": [[cuts[i - 1] - x // 2, cuts[i - 1] + x // 2] for i, x in XF.items()]}
json.dump(meta, open(os.path.join(R, "shots.json"), "w"))
ends = [s["b"] - 2 for s in shots]
gags = [W(k) + 6 for k in ["arrested", "kafka", "breakfast", "badges", "whipped", "whip", "petition", "acquittal", "behind", "life", "shutting", "hats", "butchers", "words"]]
print("ends", ",".join(map(str, ends)))
print("gags", ",".join(map(str, gags)))
