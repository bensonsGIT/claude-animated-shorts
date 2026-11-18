# Audition TTS respellings of hard names before the full narration run.
# Usage: ~/tts/chatterbox/bin/python cb_name_test.py spec.json outdir "In Algiers, a clerk named {} loses his mother." Mersoh Murrsoh Meursault
#   -> outdir/<cand>_<seed>.wav (two seeds each) + name_test.json with what Whisper heard. Listen to the wavs; Whisper's
#   spelling only tells you the name came out as one clean word (e.g. "Mersoh" was heard "Merso" every time = mehr-SOH).
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cb_voice_lib import *  # noqa: F401,F403  (spec = argv[1], OUT = argv[2], tts, trim, transcribe)
import soundfile as sf

tpl, cands = sys.argv[3], sys.argv[4:]
res = []
for c in cands:
    for seed in (0, 1):
        torch.manual_seed(seed)
        y = trim(tts.generate(tpl.format(c), audio_prompt_path=spec["ref"], exaggeration=EX, cfg_weight=CFG).squeeze().cpu().numpy())
        sf.write(os.path.join(OUT, f"{c}_{seed}.wav"), y, SR)
        res.append({"cand": c, "seed": seed, "dur": round(len(y) / SR, 2), "heard": transcribe(y)})
        print(f"{c} {seed} {res[-1]['dur']}s heard '{res[-1]['heard']}'", flush=True)
json.dump(res, open(os.path.join(OUT, "name_test.json"), "w"), indent=1)
