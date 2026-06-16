from openai import OpenAI
import os
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY", "not_set")
)


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
    try:
        response = client.chat.completions.create(
            model="meta-llama/llama-3.1-8b-instruct",
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )

        return response.choices[0].message.content

    except Exception as e:
        print("OpenRouter Error:", e)

        return (
            f"Detected civic issue related "
            f"to {issue}. Immediate action "
            f"may be required."
        )
