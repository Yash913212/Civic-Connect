import os
import requests
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")


def generate_request_note(issue,
    department,
    priority,
    location="",
    summary: str = "",
    citizen_description="",
    image_caption=""):

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
    }

    prompt = f"""

Write a formal request letter on behalf of a citizen to the concerned government department.

Information:
Issue: {issue}
Department: {department}
Priority: {priority}
Location: {location}

Citizen Description:
{citizen_description}

Summary:
{summary}

Additional Observations:
{image_caption}

Requirements:
- Write a natural, human-written government complaint letter.
- Start with a suitable Subject.
- Begin with "Dear Sir/Madam,".
- Mention the complaint location in the first paragraph.
- Use the citizen description as the primary source.
- Use the summary and observations only to support the explanation.
- Clearly explain the issue, its impact on the public, and why immediate action is required.
- Request the concerned department to inspect the location and resolve the issue.
- End with "Thank you for your time and consideration."
- Do not mention AI, uploaded images, or placeholders.

Return only the letter.
"""
    payload = {
        "model": "openai/gpt-4o-mini",
        "messages": [
            {
                "role": "user",
                "content": prompt
            }
        ],
        "max_tokens": 120,
        "temperature": 0.6
    }

    try:
        response = requests.post(
           "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=30
         ) 

        print("Status:", response.status_code)
        print("Response:", response.text)

        response.raise_for_status()

        data = response.json()

        return data["choices"][0]["message"]["content"].strip()

    except Exception as e:
        print("REQUEST NOTE ERROR:", e)
        return "Unable to generate request note."
