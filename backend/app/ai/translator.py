from app.core.bedrock import generate_text


def translate_to_english(text: str) -> str:
    if not text.strip():
        return ""

    prompt = f"""
You are a professional translator.

Translate the following civic complaint into natural English.
Return ONLY the translated text.
Do not explain anything.

Complaint:
{text}
"""

    try:
        result = generate_text(prompt)

        if result:
            return result.strip()

        return text

    except Exception as e:
        print("Bedrock Translation Exception:", e)
        return text