import os
from dotenv import load_dotenv
from app.ai.llm_client import call_llm_with_fallback

load_dotenv()


def translate_to_english(text: str) -> str:
    if not text.strip():
        return ""

    messages = [
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

    try:
        translated_text = call_llm_with_fallback(messages, is_vision=False, max_tokens=250)
        if translated_text:
            return translated_text
        return text

    except Exception as e:
        print("Translation Exception:", e)
        return text
