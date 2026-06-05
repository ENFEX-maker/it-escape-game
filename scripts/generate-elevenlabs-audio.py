#!/usr/bin/env python3
"""Generate Escape Game narration MP3 files with ElevenLabs.

Reads src/data/audio.json and writes public/audio/*.mp3 with the same filenames
expected by the static app. The API key is read from /root/.hermes/.env or the
environment variable ELEVENLABS_API_KEY. The key is never printed.
"""

from __future__ import annotations

import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
AUDIO_META = ROOT / "src" / "data" / "audio.json"
OUT_DIR = ROOT / "public" / "audio"
ENV_PATH = Path.home() / ".hermes" / ".env"

MODEL_ID = "eleven_v3"  # High-quality multilingual model, not Flash/Turbo.
OUTPUT_FORMAT = "mp3_44100_128"
LANGUAGE_CODE = "de"

# Public ElevenLabs voice-library voice IDs selected for native/standard German.
# They can be used directly by the TTS endpoint.
VOICE_BY_SPEAKER = {
    "Erzähler*in": {
        "voice_id": "KrNV9pw6ljrCTQN7lHqm",
        "voice_name": "Hans - Warm Clear German Narrator",
        "settings": {"stability": 0.56, "similarity_boost": 0.82, "style": 0.24, "use_speaker_boost": True},
    },
    "Frau Knecht": {
        "voice_id": "Darinka",
        "actual_voice_id": "IPgFCimtGutbaeC6sKnf",
        "voice_name": "Darinka - Warm & natural German female voice",
        "settings": {"stability": 0.40, "similarity_boost": 0.78, "style": 0.42, "use_speaker_boost": True},
    },
    "Lina": {
        "voice_id": "Julia",
        "actual_voice_id": "qAVuy3NdMTW0CZ8uA7M9",
        "voice_name": "Julia - Cheerful and Fun",
        "settings": {"stability": 0.45, "similarity_boost": 0.80, "style": 0.38, "use_speaker_boost": True},
    },
    "Herr Weber": {
        "voice_id": "Philipp",
        "actual_voice_id": "aYjXhF7kZXskZc5G6PV2",
        "voice_name": "Philipp - Clear German Male",
        "settings": {"stability": 0.62, "similarity_boost": 0.84, "style": 0.20, "use_speaker_boost": True},
    },
    "Systemstimme": {
        "voice_id": "Rocco",
        "actual_voice_id": "ee2pDOfqzj2pBerZvUCH",
        "voice_name": "Rocco - Mechanical and Robotic",
        "settings": {"stability": 0.72, "similarity_boost": 0.78, "style": 0.18, "use_speaker_boost": True},
    },
}

# Resolve short labels above to actual IDs while keeping the map readable.
for voice in VOICE_BY_SPEAKER.values():
    voice["voice_id"] = voice.get("actual_voice_id", voice["voice_id"])

TEXT_FIXES = {
    "04_station_logbuch.mp3": "Logdaten geladen. Ereignisse zwischen acht Uhr einundvierzig und acht Uhr siebenundfünfzig erkannt. Mehrere Dateiänderungen, Prozessstart einer ausführbaren Datei, Netzwerkzugriffe und Verschlüsselungshinweise. Bitte rekonstruieren Sie den Ablauf.",
}

PREFIX_BY_SPEAKER = {
    # Eleven v3 responds well to bracketed delivery cues and does not usually read
    # them aloud; keep them short to avoid overacting.
    "Erzähler*in": "[ruhig, spannend, warm erzählend] ",
    "Frau Knecht": "[nervös, verständlich, leicht panisch] ",
    "Lina": "[motiviert, freundlich, klar] ",
    "Herr Weber": "[ruhig, sachlich, bestimmt] ",
    "Systemstimme": "[neutral, technisch, systemartig] ",
}


def load_key() -> str:
    key = os.environ.get("ELEVENLABS_API_KEY")
    if key:
        return key.strip()
    if ENV_PATH.exists():
        for line in ENV_PATH.read_text().splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            if k.strip() == "ELEVENLABS_API_KEY":
                return v.strip().strip('"').strip("'")
    raise RuntimeError("ELEVENLABS_API_KEY not found in environment or ~/.hermes/.env")


def generate_clip(key: str, filename: str, speaker: str, text: str) -> int:
    voice = VOICE_BY_SPEAKER[speaker]
    final_text = PREFIX_BY_SPEAKER.get(speaker, "") + TEXT_FIXES.get(filename, text)
    payload = {
        "text": final_text,
        "model_id": MODEL_ID,
        "language_code": LANGUAGE_CODE,
        "voice_settings": voice["settings"],
        "seed": 1984,
    }
    url = (
        "https://api.elevenlabs.io/v1/text-to-speech/"
        + urllib.parse.quote(voice["voice_id"])
        + "?"
        + urllib.parse.urlencode({"output_format": OUTPUT_FORMAT})
    )
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=body,
        method="POST",
        headers={
            "xi-api-key": key,
            "Content-Type": "application/json",
            "Accept": "audio/mpeg",
        },
    )
    last_error = None
    for attempt in range(1, 4):
        try:
            with urllib.request.urlopen(req, timeout=120) as response:
                audio = response.read()
            if len(audio) < 1024:
                raise RuntimeError(f"unexpectedly small audio response: {len(audio)} bytes")
            out = OUT_DIR / filename
            out.write_bytes(audio)
            print(f"generated {filename}: {len(audio)} bytes | {speaker} | {voice['voice_name']}")
            return len(audio)
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")[:600]
            last_error = f"HTTP {exc.code}: {detail}"
        except Exception as exc:  # noqa: BLE001 - CLI should report all failures compactly
            last_error = repr(exc)
        if attempt < 3:
            time.sleep(2 * attempt)
    raise RuntimeError(f"Failed to generate {filename}: {last_error}")


def main() -> int:
    key = load_key()
    audio_meta = json.loads(AUDIO_META.read_text())
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    total_chars = 0
    total_bytes = 0
    for filename, meta in audio_meta.items():
        speaker = meta["speaker"]
        if speaker not in VOICE_BY_SPEAKER:
            raise RuntimeError(f"No ElevenLabs voice configured for speaker: {speaker}")
        text = str(meta["text"])
        effective_text = TEXT_FIXES.get(filename) or text
        total_chars += len(effective_text)
        total_bytes += generate_clip(key, filename, speaker, text)
    print(f"done: {len(audio_meta)} clips, {total_chars} source chars, {total_bytes} audio bytes, model={MODEL_ID}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:  # noqa: BLE001
        print(f"ERROR: {exc}", file=sys.stderr)
        raise SystemExit(1)
