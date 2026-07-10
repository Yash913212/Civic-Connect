import os
import base64
import mimetypes
from app.ai.llm_client import call_llm_with_fallback

def generate_caption(image_path):
    try:
        with open(image_path, "rb") as f:
            contents = f.read()
        
        base64_image = base64.b64encode(contents).decode('utf-8')
        mime_type, _ = mimetypes.guess_type(image_path)
        if not mime_type:
            mime_type = "image/jpeg"
            
        prompt = "Write a short, single-sentence description of the main civic or public infrastructure issue (like pothole, garbage, broken street light, etc) visible in this image. Keep it concise."
        
        messages = [
            {
                "role": "user",
                "content": [
                    { "type": "text", "text": prompt },
                    { "type": "image_url", "image_url": { "url": f"data:{mime_type};base64,{base64_image}" } }
                ]
            }
        ]
        
        caption = call_llm_with_fallback(messages, is_vision=True, max_tokens=50)
        
        if caption:
            return caption
        else:
            return "Could not generate description from API (all endpoints failed)."
            
    except Exception as e:
        return f"Could not analyze image: {e}"
