"""Generate Kazakh mp3 narration for every animation stage.

Reads frontend/public/narration/<lab>.json and writes one mp3 per sentence to
frontend/public/audio/<lab>/<stage>-<index>.mp3, plus audio/manifest.json, which
the narrator uses to pick an mp3 only when its text matches the current sentence.

Requires the open-source edge-tts package (pip install edge-tts) and internet access:
the sentences are sent to Microsoft's text-to-speech service.

Run: python tools/generate_audio.py [--voice kk-KZ-DauletNeural] [--force]
"""
from __future__ import annotations

import argparse
import asyncio
import json
from pathlib import Path

PUBLIC = Path(__file__).resolve().parent.parent / "frontend" / "public"
NARRATION = PUBLIC / "narration"
AUDIO = PUBLIC / "audio"
MANIFEST = AUDIO / "manifest.json"


async def generate(voice, force):
    import edge_tts

    old = json.loads(MANIFEST.read_text(encoding="utf-8")) if MANIFEST.exists() else {}
    manifest = {}
    for script in sorted(NARRATION.glob("*.json")):
        lab = script.stem
        stages = json.loads(script.read_text(encoding="utf-8"))["stages"]
        for stage, data in stages.items():
            for index, text in enumerate(data["cues"]):
                key = f"{lab}/{stage}-{index}.mp3"
                target = AUDIO / key
                if not force and old.get(key) == text and target.exists():
                    manifest[key] = text
                    continue
                target.parent.mkdir(parents=True, exist_ok=True)
                await edge_tts.Communicate(text, voice, rate="-5%").save(str(target))
                manifest[key] = text
                print("✓", key, flush=True)
    # Remove mp3 files whose sentence no longer exists.
    for file in AUDIO.glob("*/*.mp3"):
        if file.relative_to(AUDIO).as_posix() not in manifest:
            file.unlink()
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"{len(manifest)} sentences in {MANIFEST}")


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--voice", default="kk-KZ-AigulNeural", help="kk-KZ-AigulNeural (female) or kk-KZ-DauletNeural (male)")
    parser.add_argument("--force", action="store_true", help="regenerate every file")
    args = parser.parse_args()
    asyncio.run(generate(args.voice, args.force))


if __name__ == "__main__":
    main()
