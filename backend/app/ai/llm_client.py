import os
import requests

def call_llm_with_fallback(messages, is_vision=False, max_tokens=150, is_json=False):
    """
    Calls the LLM with dynamic fallback.
    Tries Groq first. If it fails (exhausted credits or rate limit), falls back to OpenRouter.
    """
    groq_key = os.environ.get("GROQ_API_KEY")
    openrouter_key = os.environ.get("OPENROUTER_API_KEY")

    # 1. Try Groq
    if groq_key:
        try:
            headers = {
                "Authorization": f"Bearer {groq_key}",
                "Content-Type": "application/json"
            }
            model = "llama-3.2-11b-vision-preview" if is_vision else "llama-3.1-8b-instant"
            
            payload = {
                "model": model,
                "messages": messages,
                "max_tokens": max_tokens
            }
            if is_json:
                payload["response_format"] = { "type": "json_object" }

            response = requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=15
            )
            
            if response.status_code == 200:
                return response.json()['choices'][0]['message']['content'].strip()
            else:
                print(f"Groq API failed with status {response.status_code}: {response.text}")
        except Exception as e:
            print(f"Groq API Exception: {e}")

    # 2. Fallback to OpenRouter
    if openrouter_key:
        try:
            print("Falling back to OpenRouter API...")
            headers = {
                "Authorization": f"Bearer {openrouter_key}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "model": "openai/gpt-4o-mini",
                "messages": messages,
                "max_tokens": max_tokens
            }
            if is_json:
                payload["response_format"] = { "type": "json_object" }

            response = requests.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=15
            )
            
            if response.status_code == 200:
                return response.json()['choices'][0]['message']['content'].strip()
            else:
                print(f"OpenRouter API failed with status {response.status_code}: {response.text}")
        except Exception as e:
            print(f"OpenRouter API Exception: {e}")

    return None
