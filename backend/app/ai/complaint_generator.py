import os
import requests
from app.core.config import settings

def generate_complaint(issue):
    prompt = f"""
    Generate a short professional civic
    complaint for a {issue} issue.
  
    Rules:
    - Maximum 2 to 3 sentences
    - No headings
    - No markdown
    - No bullet points 
    - No placeholders like [Address]
    - Make it realistic and professional
    """

    api_key = settings.OPENROUTER_API_KEY or os.getenv("OPENROUTER_API_KEY")
    if not api_key or api_key == "not_set":
        return (
            f"Detected civic issue related "
            f"to {issue}. Immediate action "
            f"may be required."
        )

    try:
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "openai/gpt-4o-mini",
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        }

        response = requests.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=payload)
        response.raise_for_status()
        response_data = response.json()
        
        return response_data['choices'][0]['message']['content']

    except Exception as e:
        print("OpenRouter Error:", e)
        return (
            f"Detected civic issue related "
            f"to {issue}. Immediate action "
            f"may be required."
        )
