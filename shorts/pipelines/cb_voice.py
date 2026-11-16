# Chatterbox narration for a short, from a JSON spec. One sentence per generation (silence-trimmed, joined with the
# spec's pauses); every take is force-aligned to its words (torchaudio MMS_FA) and transcribed with Whisper; a take is
# accepted only if Whisper hears the script's words (names / numbers listed as fuzzy may differ in spelling).
# Captions get the script's spelling; the TTS reads per-word respellings from spec["subs"].
# Usage: ~/tts/chatterbox/bin/python cb_voice.py spec.json outdir      -> outdir/voice.wav, words.json, beats.json, cb_report.txt
# spec: {"ref": "path/to/ref.wav", "exaggeration": 0.5, "cfg": 0.5, "lead": 0.15, "pause_k": 1.0,
#        "beats": [["display text", pause_s], ...], "subs": {"1566,": "fifteen sixty-six,"}, "fuzzy": ["tycho", "brahe"]}
import json, os, sys
import numpy as np, soundfile as sf, torch
from cb_voice_lib import *  # noqa: F401,F403  (spec, models, helpers)

audio, words, beats, report = [np.zeros(int(spec.get("lead", 0.15) * SR), np.float32)], [], [], []
t = spec.get("lead", 0.15)
for bi, (disp, pause) in enumerate(spec["beats"]):
    pause = pause if pause >= 0.55 else pause * spec.get("pause_k", 1.0)
    dws = disp.split()
    spoken_ws = [SUBS.get(d, d) for d in dws]
    spoken = " ".join(spoken_ws)
    sw = tw(spoken)
    groups, j = [], 0
    for d, s in zip(dws, spoken_ws):
        n = len(tw(s)); groups.append((d, j, j + n)); j += n
    sub_idx = {k for d, a, b in groups if d in SUBS for k in range(a, b)}
    best = None
    for k in range(TRIES):
        torch.manual_seed(11 + 100 * bi + k)
        t0 = time.time()
        y = trim(tts.generate(spoken, audio_prompt_path=spec["ref"], exaggeration=EX, cfg_weight=CFG).squeeze().cpu().numpy())
        al = align(y, sw)
        worst = min([a[2] for i, a in enumerate(al) if i not in sub_idx] or [1.0])
        heard = transcribe(y); ok = heard_ok(heard, disp)
        line = f"beat {bi + 1} take {k + 1}: {'OK ' if ok else 'BAD'} worst {worst:.2f} {len(y) / SR:.2f}s heard '{heard}' ({time.time() - t0:.0f}s)"
        print(line, flush=True); report.append(line)
        key = (ok, worst)
        if best is None or key > best[0]:
            best = (key, y, al, heard)
        if ok and worst >= 0.5:
            break
    (ok, worst), y, al, heard = best
    if not ok:
        report.append(f"!! beat {bi + 1}: no take Whisper heard cleanly; kept '{heard}'")
        print(report[-1], flush=True)
    for d, a, b in groups:
        words.append({"w": d, "s": round(t + al[a][0], 3), "e": round(t + al[b - 1][1], 3)})
    beats.append({"text": disp, "s": round(t, 3), "e": round(t + len(y) / SR, 3), "heard": heard, "ok": ok})
    audio += [y.astype(np.float32), np.zeros(int(pause * SR), np.float32)]
    t += len(y) / SR + pause

y = np.concatenate(audio); y *= 0.89 / max(1e-6, np.abs(y).max())
sf.write(os.path.join(OUT, "voice.wav"), y, SR, subtype="PCM_16")
json.dump(words, open(os.path.join(OUT, "words.json"), "w"), indent=1)
json.dump({"voice": "chatterbox:" + os.path.basename(spec["ref"]), "duration": round(len(y) / SR, 3), "beats": beats},
          open(os.path.join(OUT, "beats.json"), "w"), indent=1)
open(os.path.join(OUT, "cb_report.txt"), "w").write("\n".join(report) + "\n")
bad = [i + 1 for i, b in enumerate(beats) if not b["ok"]]
print(f"done: {len(y) / SR:.2f} s, {len(words)} words, {len(beats)} beats, unclean beats: {bad or 'none'}")
