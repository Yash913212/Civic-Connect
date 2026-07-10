import os
import requests
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")


def generate_request_note(issue,
    department,
    priority,
    location="",
    summary: str = "",
    citizen_description="",
    image_caption=""):

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
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
- Write a concise, human-written complaint email. Keep it short and direct (maximum 2 short paragraphs).
- Start with a suitable Subject.
- Begin with "To the {department} Department," instead of "Dear Sir/Madam".
- Mention the complaint location in the first sentence.
- Use the citizen description to explain the issue and its impact.
- Clearly request the {department} department to inspect and resolve the issue.
- End exactly with "Thank you for your prompt attention to this matter."
- CRITICAL: DO NOT include any sign-offs like "Sincerely", "Regards", or "[Your Name]". Stop generating immediately after the thank you sentence.
- Do not mention AI, uploaded images, or placeholders.

Return only the letter.
"""
    payload = {
        "model": "llama-3.1-8b-instant",
        "messages": [
            {
                "role": "user",
                "content": prompt
            }
        ],
        "max_tokens": 512,
        "temperature": 0.6
    }

    try:
        response = requests.post(
           "https://api.groq.com/openai/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=30
         ) 

        print("Status:", response.status_code)
        
        response.raise_for_status()

        data = response.json()

        return data["choices"][0]["message"]["content"].strip()

    except Exception as e:
        print("REQUEST NOTE ERROR:", e)
        return "Unable to generate request note."
