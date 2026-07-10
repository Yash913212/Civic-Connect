import os
import base64
import requests
import mimetypes

def generate_caption(image_path):
    api_key = os.environ.get("GROQ_API_KEY", "")
    if not api_key:
        return "Image analysis not available (No API Key)"
        
    try:
        with open(image_path, "rb") as f:
            contents = f.read()
        
        base64_image = base64.b64encode(contents).decode('utf-8')
        mime_type, _ = mimetypes.guess_type(image_path)
        if not mime_type:
            mime_type = "image/jpeg"
            
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        prompt = "Write a short, single-sentence description of the main civic or public infrastructure issue (like pothole, garbage, broken street light, etc) visible in this image. Keep it concise."
        
        payload = {
            "model": "llama-3.2-11b-vision-preview",
            "messages": [
                {
                    "role": "user",
                    "content": [
                        { "type": "text", "text": prompt },
                        { "type": "image_url", "image_url": { "url": f"data:{mime_type};base64,{base64_image}" } }
                    ]
                }
            ],
            "max_tokens": 50
        }
        
        response = requests.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload, timeout=30)
        response_data = response.json()
        
        if 'choices' in response_data and len(response_data['choices']) > 0:
            caption = response_data['choices'][0]['message']['content'].strip()
            return caption
        else:
            return "Could not generate description from API."
            
    except Exception as e:
        return f"Could not analyze image: {e}"
