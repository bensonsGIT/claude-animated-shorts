# Look metrics vs the reference (East of Eden lighting pass): per-glob medians of luma p2/p50/p98, saturation,
# colourfulness, local contrast and shade/lit split, caption band removed.
# Usage: ~/tts/chatterbox/bin/python scripts/look_metrics.py "../references/frames/*.jpg" "out/<name>/x_*.jpg"
import sys, glob, numpy as np
from PIL import Image
from scipy import ndimage
def m(p):
    a = np.asarray(Image.open(p).convert("RGB").resize((540, 960)), float) / 255
    a = np.concatenate([a[:640], a[720:]])  # drop the caption band
    Y = 0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]
    mx, mn = a.max(-1), a.min(-1); S = np.where(mx > 0.15, (mx - mn) / np.maximum(mx, 1e-6), np.nan)
    rg, yb = a[..., 0] - a[..., 1], 0.5 * (a[..., 0] + a[..., 1]) - a[..., 2]
    cf = np.sqrt(rg.std() ** 2 + yb.std() ** 2) + 0.3 * np.sqrt(rg.mean() ** 2 + yb.mean() ** 2)
    lc = (Y - ndimage.uniform_filter(Y, 9)).std()
    # light/shade split: median of the brightest 30 % vs darkest 30 % of non-ink pixels
    ni = Y[Y > 0.12]; lo, hi = np.percentile(ni, 30), np.percentile(ni, 70)
    ratio = np.median(ni[ni <= lo]) / np.median(ni[ni >= hi])
    return [np.percentile(Y, 2), np.percentile(Y, 50), np.percentile(Y, 98), Y.std(), np.nanmean(S), cf, lc, ratio]
names = ["p2", "p50", "p98", "std", "satS", "colorful", "localC", "shade/lit"]
for g in sys.argv[1:]:
    fs = sorted(glob.glob(g)); v = np.array([m(f) for f in fs])
    print(f"{g.split('/')[-1]:>22} n={len(fs):2d} " + " ".join(f"{n} {x:.3f}" for n, x in zip(names, np.median(v, 0))))
