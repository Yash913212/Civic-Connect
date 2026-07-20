from app.ai.llm_client import call_llm_with_fallback

def generate_request_note(issue,
    department,
    priority,
    location="",
    summary: str = "",
    citizen_description="",
    image_caption=""):

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
- End with "Thank you for your time and consideration,\n\nSincerely,\nA Concerned Citizen"
- Do NOT use placeholders like [Your Name], [Date], [Address], or any bracketed text. Keep the letter generic so it can be submitted as-is.
- Do not mention AI, uploaded images, or the fact that this is an AI-generated note.

Return only the letter.
"""
    messages = [
        {
            "role": "user",
            "content": prompt
        }
    ]

    try:
        content = call_llm_with_fallback(messages, is_vision=False, max_tokens=300, is_json=False)
        if content:
            return content
        return "Unable to generate request note."
    except Exception as e:
        print("REQUEST NOTE ERROR:", e)
        return "Unable to generate request note."
