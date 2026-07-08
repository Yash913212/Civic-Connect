import os
import requests
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")


def predict_priority(issue, description="", image_caption=""):
    if not OPENROUTER_API_KEY:
        return "Low"

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }

    prompt = f"""
You are an experienced Municipal Corporation Officer.

Analyze the civic complaint carefully.

Issue Type:
{issue}

Citizen Description:
{description if description else "Not provided"}

Image Description:
{image_caption}

Classify the complaint priority using these rules.

HIGH:
- Immediate risk to public safety.
- Road completely blocked.
- Severe flooding or overflowing drainage.
- Huge garbage accumulation spreading across the road.
- Large water leakage affecting traffic or many people.
- Open manhole or dangerous electrical issue.
- Requires action within 24 hours.

MEDIUM:
- Issue affects public convenience.
- Moderate garbage accumulation.
- Moderate potholes.
- Drainage partially blocked.
- Water leakage but traffic is still moving.
- Needs action within 2-5 days.

LOW:
- Small localized issue.
- Small garbage pile.
- Minor pothole.
- Small drainage blockage.
- Minor water leakage.
- No immediate safety risk.

Important:
Do NOT always choose High.
Do NOT always choose Low.
Judge based on the severity visible in the image and the citizen description.

Return ONLY one word:
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
        "max_tokens": 50
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

