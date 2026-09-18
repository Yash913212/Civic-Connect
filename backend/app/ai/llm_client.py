from app.core.bedrock import generate_text


def call_llm_with_fallback(
    messages,
    is_vision=False,
    max_tokens=150,
    is_json=False
):
    """
    Generates AI responses using Amazon Bedrock
    with Amazon Nova 2 Lite.
    """

    try:
        # Convert the existing message format into one prompt
        prompt_parts = []

        for message in messages:
            role = message.get("role", "user")
            content = message.get("content", "")

            if isinstance(content, list):
                text_parts = []

                for item in content:
                    if isinstance(item, dict) and "text" in item:
                        text_parts.append(item["text"])

                content = "\n".join(text_parts)

            prompt_parts.append(
                f"{role.upper()}:\n{content}"
            )

        prompt = "\n\n".join(prompt_parts)

        if is_json:
            prompt += "\n\nReturn ONLY valid JSON. Do not use markdown."

        return generate_text(prompt).strip()

    except Exception as e:
        print(f"Amazon Bedrock Error: {e}")
        return None