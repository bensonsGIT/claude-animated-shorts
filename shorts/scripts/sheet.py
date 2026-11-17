# Contact sheet of stills for a quick look check (6 per row, 360x640 tiles).
# Usage: python3 scripts/sheet.py out.jpg <still prefix> f1,f2,...   e.g. sheet.py out/x/sheet.jpg out/x/s_ 100,400,900
import subprocess, sys
out, prefix, frames = sys.argv[1], sys.argv[2], sys.argv[3].split(",")
n = len(frames)
args = ["ffmpeg", "-y", "-loglevel", "error"]
for f in frames:
    args += ["-i", f"{prefix}{f}.jpg"]
fc = "".join(f"[{i}:v]scale=360:640[v{i}];" for i in range(n))
lay = "|".join(f"{(i % 6) * 360}_{(i // 6) * 640}" for i in range(n))
fc += "".join(f"[v{i}]" for i in range(n)) + f"xstack=inputs={n}:layout={lay}:fill=black"
subprocess.run(args + ["-filter_complex", fc, out], check=True)
print(out)
