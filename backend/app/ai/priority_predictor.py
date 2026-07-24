import os
import requests
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")



def predict_priority(issue, description="", image_caption=""):
    if not OPENROUTER_API_KEY:
        return "Low"
    if not image_caption:
        image_caption = issue

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }


    prompt = f"""

You are a senior Municipal Emergency Officer.

Issue Type:
{issue}

Citizen Description:
{description if description else "Not provided"}

Image Caption:
{image_caption}

Evaluate the REAL severity.

HIGH
- Garbage occupies a large area
- Garbage overflowing onto roads
- Garbage attracting animals/insects
- Public health hazard
- Flooding
- Large potholes
- Road blockage
- Dangerous electrical problems
- Open manholes

MEDIUM
- Moderate garbage pile
- Moderate potholes
- Partial drainage blockage
- Water leakage affecting nearby residents

LOW
- Small isolated garbage
- Minor maintenance issue
- Small pothole
- No public safety risk

Important:
If the image description contains words like:
large, huge, overflowing, multiple, widespread, road blocked, dangerous, hazard

then NEVER return Low.

Return ONLY:
High
Medium
Low
"""
    payload = {
        "model": "openai/gpt-4o-mini",
        "messages": [
            {
                "role": "user",
                "content": prompt
            }
        ],
        "max_tokens": 20
    }

    try:
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=30
        )

        data = response.json()
        print("Issue:", issue)
        print("Description:", description)
        print("Image Caption:", image_caption)
        print("GPT Response:", data)

        if "choices" in data:
            priority = data["choices"][0]["message"]["content"].strip()

            if priority.lower() in ["high", "medium", "low"]:
                return priority.capitalize()

        return "Low"

    except Exception as e:
        print("Priority Prediction Error:", e)
        return "Low"

