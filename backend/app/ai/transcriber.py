import os
import requests
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")

def transcribe_audio(audio_bytes: bytes, language: str = "te") -> str:
    if not GROQ_API_KEY:
        return "Groq API key not configured."

    try:
        files = {
            "file": ("audio.webm", audio_bytes, "audio/webm")
        }
        data = {
            "model": "whisper-large-v3",
        }
        if language:
            data["language"] = language

        headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}"
        }

        response = requests.post(
            "https://api.groq.com/openai/v1/audio/transcriptions",
            headers=headers,
            files=files,
            data=data,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            return result.get("text", "").strip()
        else:
            return f"Transcription error: {response.text}"
    except Exception as e:
        return f"Transcription error: {str(e)}"


def transcribe_audio_file(file_path: str, language: str = "te") -> str:
    if not GROQ_API_KEY:
        return "Groq API key not configured."
    try:
        with open(file_path, "rb") as f:
            audio_bytes = f.read()
        return transcribe_audio(audio_bytes, language)
    except Exception as e:
        return f"Transcription error: {str(e)}"
