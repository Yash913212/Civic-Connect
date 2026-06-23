import os
import tempfile

_device = "cuda" if __import__("torch").cuda.is_available() else "cpu"
_model = None
_ready = False


def _load():
    global _model, _ready
    if _ready:
        return
    try:
        import whisper
        _model = whisper.load_model("tiny", device=_device)
        _ready = True
        print("Whisper loaded on demand")
    except Exception as e:
        print(f"Whisper load failed: {e}")
        _ready = False


def transcribe_audio(audio_bytes: bytes, language: str = "te") -> str:
    _load()
    if not _ready:
        return "Voice transcription not available"

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name
        try:
            result = _model.transcribe(tmp_path, language=language, task="transcribe", temperature=0.0)
            return result["text"].strip()
        finally:
            os.unlink(tmp_path)
    except Exception as e:
        return f"Transcription error: {e}"


def transcribe_audio_file(file_path: str, language: str = "te") -> str:
    _load()
    if not _ready:
        return "Voice transcription not available"
    try:
        result = _model.transcribe(file_path, language=language, task="transcribe", temperature=0.0)
        return result["text"].strip()
    except Exception as e:
        return f"Transcription error: {e}"
