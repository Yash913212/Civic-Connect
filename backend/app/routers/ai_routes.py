from fastapi import APIRouter, UploadFile, File, HTTPException, Form, Request, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.ai.translator import translate_to_english
from app.ai.priority_predictor import predict_priority
from app.ai.predict import predict_issue
from app.ai.captioning import generate_caption
from app.ai.transcriber import transcribe_audio
from app.ai.request_note import generate_request_note
from app.core.dependencies import limiter, compress_image
from slowapi.util import get_remote_address
import os
import json
import base64
import requests

router = APIRouter(prefix="")

SYSTEM_PROMPT = """You are CivicAI, the official AI assistant for Civic Connect — a smart city governance platform.

Your role:
- Help citizens file and track civic complaints (potholes, drainage, garbage, water, streetlights, electricity, safety, traffic)
- Explain how to use the platform's features
- Answer civic FAQ and municipal governance questions
- Guide officers and admins on platform workflows
- Be concise, helpful, and friendly

Platform features:
- Users can register as CITIZEN, OFFICER, or ADMIN
- Complaints can be filed via text, image (AI analyzes), or voice
- AI automatically classifies issue type, predicts department, assigns priority, and routes to the right officer
- Citizens get real-time WebSocket notifications on status changes
- Status flow: Pending → Assigned → In Progress → Resolved
- Officer dashboard shows assigned complaints with map view
- Admin dashboard has analytics, user management, department management

Guidelines:
- Keep responses under 3 sentences when possible
- If asked about specific complaint status, ask for complaint ID
- Do NOT make up specific data about users or complaints
- Sound professional but warm
- If you don't know something, suggest contacting support

Return ONLY the response text. No JSON formatting, no prefixes."""


class ChatMessage(BaseModel):
    message: str
    history: list[dict[str, str]] = []


@router.post("/ai/chat")
async def chat_with_ai(body: ChatMessage):
    from app.ai.llm_client import call_llm_with_fallback
    try:
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        for msg in body.history[-10:]:
            messages.append(msg)
        messages.append({"role": "user", "content": body.message})

        result = call_llm_with_fallback(messages, is_vision=False, max_tokens=300)
        if not result:
            return {"response": "I'm sorry, I'm having trouble connecting to my AI service right now. Please try again in a moment.", "error": True}
        return {"response": result, "error": False}
    except Exception as e:
        return {"response": "I encountered an error. Please try again.", "error": True}


UPLOAD_DIR = "uploads"
OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY", "")


class TextAnalysisRequest(BaseModel):
    text: str


class RequestNoteRequest(BaseModel):
    issue: str
    department: str
    priority: str
    location: str
    citizen_description: str = ""
    image_caption: str = ""


@router.post("/upload")
@limiter.limit("5/minute")
async def upload_image(request: Request, file: UploadFile = File(...)):
    contents = await file.read()
    compressed_contents = compress_image(contents)

    filename = file.filename
    if not filename.lower().endswith(('.jpg', '.jpeg')):
        filename = filename.rsplit('.', 1)[0] + '.jpg'

    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as buffer:
        buffer.write(compressed_contents)

    try:
        base64_image = base64.b64encode(compressed_contents).decode('utf-8')
        mime_type = file.content_type or "image/jpeg"

        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json"
        }

        prompt = """
        You are CivicConnect Vision AI.

        Your ONLY purpose is to analyze uploaded complaint images for municipal and civic infrastructure issues.

        You are NOT a general chatbot.

        You are NOT allowed to answer unrelated questions.

        You ONLY analyze images uploaded by users.

        ==================================================

        MISSION

        Analyze civic infrastructure images and automatically identify public issues.

        The goal is to help citizens report complaints accurately.

        ==================================================

        SUPPORTED ISSUE TYPES

        ROAD INFRASTRUCTURE

        - Potholes
        - Broken Roads
        - Road Cracks
        - Road Erosion
        - Damaged Pavements
        - Missing Road Signs

        DRAINAGE

        - Blocked Drainage
        - Open Drainage
        - Overflowing Drainage
        - Water Logging
        - Sewage Overflow

        STREET LIGHTS

        - Broken Street Lights
        - Damaged Poles
        - Missing Street Lights
        - Non Functional Lights

        SANITATION

        - Garbage Accumulation
        - Overflowing Dustbins
        - Illegal Waste Dumping
        - Public Waste

        WATER SUPPLY

        - Water Leakage
        - Broken Water Pipes
        - Overflowing Water

        ELECTRICITY

        - Exposed Wires
        - Damaged Electric Poles
        - Transformer Problems

        PUBLIC SAFETY

        - Fallen Trees
        - Open Manholes
        - Broken Railings
        - Dangerous Structures

        TRAFFIC INFRASTRUCTURE

        - Broken Traffic Signals
        - Missing Traffic Signs
        - Road Obstructions

        ==================================================

        ANALYSIS PROCESS

        1. Detect visible issue.

        2. Classify issue category.

        3. Determine department.

        4. Determine severity.

        5. Determine priority.

        6. Generate summary.

        7. Estimate confidence score.

        ==================================================

        SEVERITY LEVELS

        Critical

        - Open Manholes
        - Exposed Electric Wires
        - Major Infrastructure Collapse

        High

        - Large Potholes
        - Flooded Roads
        - Major Drainage Failure

        Medium

        - Broken Street Lights
        - Damaged Pavements

        Low

        - Minor Maintenance Problems

        ==================================================

        DEPARTMENT ROUTING

        Road Issues
        → Roads Department

        Drainage Issues
        → Drainage Department

        Street Light Issues
        → Electrical Department

        Garbage Issues
        → Sanitation Department

        Water Supply Issues
        → Water Department

        Public Safety Issues
        → Safety Department

        Traffic Issues
        → Traffic Department

        ==================================================

        IGNORE

        - Human identities
        - Faces
        - Clothing
        - Personal details
        - Vehicles unless related to the issue

        Focus only on public infrastructure problems.

        ==================================================

        OUTPUT FORMAT

        Return ONLY valid JSON.

        {
          "issueDetected": "",
          "category": "",
          "department": "",
          "severity": "",
          "priority": "",
          "confidence": "",
          "summary": "",
          "recommendedResolutionTime": ""
        }

        ==================================================

        EXAMPLE

        {
          "issueDetected": "Pothole",
          "category": "Road Infrastructure",
          "department": "Roads Department",
          "severity": "High",
          "priority": "Urgent",
          "confidence": "96%",
          "summary": "Large pothole detected on roadway creating risk for vehicles and pedestrians.",
          "recommendedResolutionTime": "48 Hours"
        }
        """

        payload = {
            "model": "openai/gpt-4o-mini",
            "response_format": { "type": "json_object" },
            "messages": [
                {
                    "role": "user",
                    "content": [
                        { "type": "text", "text": prompt },
                        { "type": "image_url", "image_url": { "url": f"data:{mime_type};base64,{base64_image}" } }
                    ]
                }
            ]
        }

        response = requests.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=payload)
        response_data = response.json()
        ai_result = response_data['choices'][0]['message']['content']

        ai_result = ai_result.strip()
        if ai_result.startswith("```json"):
            ai_result = ai_result.split("```json")[1].split("```")[0].strip()
        elif ai_result.startswith("```"):
            ai_result = ai_result.split("```")[1].split("```")[0].strip()

        analysis = json.loads(ai_result)

        if str(analysis.get("isValid", "True")).lower() == "false":
            os.remove(filepath)
            raise HTTPException(status_code=400, detail=analysis.get("invalidReason", "Image does not contain a valid civic issue."))

        for k, v in analysis.items():
            if isinstance(v, (dict, list)):
                analysis[k] = json.dumps(v)
            else:
                analysis[k] = str(v)
    except HTTPException:
        raise
    except Exception as e:
        print(f"AI Analysis failed: {e}")
        analysis = {
            "isValid": "True",
            "issueDetected": "Unknown Issue",
            "category": "Unknown",
            "department": "General",
            "severity": "Low",
            "priority": "Low",
            "confidence": "0%",
            "summary": "Could not analyze the image.",
            "recommendedResolutionTime": "Unknown"
        }

    return {
        "message": "Image Uploaded",
        "filename": file.filename,
        "imageUrl": f"/uploads/{file.filename}",
        "analysis": analysis
    }


@router.post("/ai/analyze")
@limiter.limit("10/minute")
async def analyze_image(
    request: Request,
    file: UploadFile = File(...),
    description: str = Form("")
):
    print("===== /ai/analyze called =====")
    contents = await file.read()
    compressed_contents = compress_image(contents)

    filename = file.filename
    if not filename.lower().endswith(('.jpg', '.jpeg')):
        filename = filename.rsplit('.', 1)[0] + '.jpg'

    file_path = os.path.join("uploads", filename)

    with open(file_path, "wb") as f:
        f.write(compressed_contents)

    translated_description = (
        translate_to_english(description)
        if description.strip()
        else ""
    )
    result = predict_issue(
          file_path,
          description=translated_description
    )

    result["citizen_description"] = description
    result["translated_description"] = translated_description
    caption = generate_caption(file_path)
    result["ai_caption"] = caption
    priority = predict_priority(
         issue=result["issue"],
         description=translated_description,
         image_caption=caption
    )

    result["priority"] = priority
    return result


@router.post("/analyze_text")
@router.post("/ai/analyze_text")
@limiter.limit("15/minute")
def analyze_text(request: Request, body: TextAnalysisRequest):
    from app.ai.llm_client import call_llm_with_fallback
    try:
        prompt = f"""
        Analyze this civic issue description: "{body.text}"
        Return a JSON response strictly in this format:
        {{
          "title": "Short title of the issue",
          "description": "Cleaned up and detailed description of the issue.",
          "department": "Suggested Department (e.g. Public Works, Sanitation, Water & Power, Traffic)",
          "priority": "High, Medium, or Low",
          "confidence": "AI confidence percentage as string like '98.2%'"
        }}
        """

        messages = [
            {
                "role": "user",
                "content": prompt
            }
        ]

        ai_result = call_llm_with_fallback(messages, is_vision=False, max_tokens=150, is_json=True)

        if not ai_result:
            raise Exception("All API fallbacks failed")

        ai_result = ai_result.strip()
        if ai_result.startswith("```json"):
            ai_result = ai_result.split("```json")[1].split("```")[0].strip()
        elif ai_result.startswith("```"):
            ai_result = ai_result.split("```")[1].split("```")[0].strip()

        analysis = json.loads(ai_result)

        for k, v in analysis.items():
            if isinstance(v, (dict, list)):
                analysis[k] = json.dumps(v)
            else:
                analysis[k] = str(v)
    except Exception as e:
        print(f"AI Text Analysis failed: {e}")
        analysis = {
            "title": "Unknown Issue",
            "description": body.text,
            "department": "General",
            "priority": "Low",
            "confidence": "0%"
        }

    return {"analysis": analysis}


@router.post("/ai/caption")
async def caption_image(file: UploadFile = File(...)):
    contents = await file.read()
    filepath = os.path.join(UPLOAD_DIR, f"caption_{file.filename}")
    with open(filepath, "wb") as f:
        f.write(contents)

    caption = generate_caption(filepath)

    return {
        "filename": file.filename,
        "caption": caption,
    }


@router.post("/ai/transcribe")
async def transcribe_audio_endpoint(file: UploadFile = File(...), language: str = Form("")):
    from app.ai.transcriber import transcribe_audio as ta
    contents = await file.read()
    text = ta(contents, language=language, filename=file.filename, content_type=file.content_type)
    return {
        "transcription": text,
        "language": language,
    }


@router.post("/request-note")
@router.post("/ai/request-note")
async def create_request_note(request: RequestNoteRequest):
    note = generate_request_note(
        issue=request.issue,
        department=request.department,
        priority=request.priority,
        location=request.location,
        citizen_description=request.citizen_description,
        image_caption=request.image_caption,
    )
    return {
        "request_note": note
    }


class DuplicateCheckRequest(BaseModel):
    description: str
    department: str | None = None
    location: str | None = None


@router.post("/check-duplicate")
@router.post("/ai/check-duplicate")
def check_duplicate_complaint(
    body: DuplicateCheckRequest,
    db: Session = Depends(get_db),
):
    from app.database.models import Complaint as DBComplaint
    from sqlalchemy import or_
    import difflib

    description = body.description.lower()
    keywords = set(description.split())

    complaints = db.query(DBComplaint).filter(
        DBComplaint.status != "Resolved"
    ).order_by(DBComplaint.created_at.desc()).limit(100).all()

    matches = []
    for c in complaints:
        c_desc = (c.description or "").lower()
        c_title = (c.title or "").lower()

        ratio = max(
            difflib.SequenceMatcher(None, description, c_desc).ratio(),
            difflib.SequenceMatcher(None, description, c_title).ratio(),
        )
        if ratio > 0.45:
            c_keywords = set(c_desc.split()) | set(c_title.split())
            overlap = len(keywords & c_keywords) / max(1, len(keywords | c_keywords))
            score = max(ratio, overlap)

            if score > 0.45:
                matches.append({
                    "id": str(c.id),
                    "title": c.title,
                    "description": c.description[:150],
                    "status": c.status.value if hasattr(c.status, 'value') else c.status,
                    "department": c.department,
                    "location": c.location,
                    "time": c.created_at.isoformat() if c.created_at else None,
                    "similarity": round(score, 2),
                })

    matches.sort(key=lambda m: m["similarity"], reverse=True)
    return {"duplicates": matches[:5], "total_found": len(matches)}
