import os
import requests
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")


def translate_to_english(text: str) -> str:
    if not text.strip():
        return ""

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": "llama-3.1-8b-instant",
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are a professional translator. "
                    "Translate the user's complaint into natural English. "
                    "Return ONLY the translated text. "
                    "Do not explain anything."
                )
            },
            {
                "role": "user",
                "content": text
            }
        ]
    }

    try:
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=30,
        )

        response_data = response.json()

        if "choices" in response_data and len(response_data["choices"]) > 0:
            return response_data["choices"][0]["message"]["content"].strip()

        print("Translation API Error:", response_data)
        return text

    except Exception as e:
        print("Translation Exception:", e)
        return text
