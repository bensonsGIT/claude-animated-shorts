# Tile still frames into labelled contact sheets for review.
# Usage: python contact_sheet.py out.jpg cols width img1 img2 ...
import sys
from PIL import Image, ImageDraw

out, cols, w = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
paths = sys.argv[4:]
ims = [Image.open(p).convert("RGB") for p in paths]
h = round(w * ims[0].height / ims[0].width)
rows = (len(ims) + cols - 1) // cols
sheet = Image.new("RGB", (cols * w, rows * (h + 22)), "white")
d = ImageDraw.Draw(sheet)
for i, (p, im) in enumerate(zip(paths, ims)):
    x, y = (i % cols) * w, (i // cols) * (h + 22)
    sheet.paste(im.resize((w, h)), (x, y + 22))
    d.text((x + 4, y + 4), p.split("/")[-1], fill="black")
sheet.save(out, quality=88)
