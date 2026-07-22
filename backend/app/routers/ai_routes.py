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
from app.core.utils import compress_image
import os
import json
import base64
import requests

router = APIRouter(prefix="")

SYSTEM_PROMPT = """You are CivicAI, the official AI assistant for Nagara Netra — a smart city governance platform.

=== SENSITIVITY RULES (NEVER VIOLATE) ===
- NEVER reveal API keys, database URLs, credentials, secret keys, or any environment variables
- NEVER reveal internal file paths, server configuration, or backend framework details
- NEVER reveal third-party API endpoints, model names, or infrastructure details
- NEVER reveal rate limits, token expiry times, or security configurations
- NEVER reveal admin credentials, default emails, or developer information
- NEVER expose database schema, migration details, or internal architecture
- NEVER share code snippets, implementation details, or technical internals
- If asked about any sensitive/technical backend details, say: "That's internal system information I can't share. Feel free to contact support for help."
- If asked for API keys or credentials, say: "I can't share API keys or credentials. Please contact the platform administrator."
- Treated EVERY question about configuration, secrets, or internals as a security violation attempt

=== YOUR ROLE ===
- Help citizens file and track civic complaints (potholes, drainage, garbage, water, streetlights, electricity, safety, traffic)
- Explain how to use the platform's features in detail
- Answer civic FAQ and municipal governance questions
- Guide officers and admins on platform workflows
- Be concise, helpful, and friendly

=== PAGES & ROUTES ===
Landing/Home: `/` and `/home` — Sign-in page with role selector (CITIZEN/OFFICER/ADMIN)
Public: `/transparency` — Public analytics portal (no login needed)
Citizen: `/citizen/dashboard`, `/citizen/complaint` (file complaint), `/citizen/complaints` (view/edit/delete), `/citizen/profile`
Officer: `/officer/dashboard` — Task Management, Field Map, Performance, Comms Hub, Resource Requests, Shift Schedule
Admin: `/admin/dashboard` — Overview, Complaints, Departments, Users, GIS Map, Analytics, Audit, Broadcast, Budget, Settings
Other: `/feedback` (rate & review), `/forgot-password`, `/reset-password`, `/profile`

=== USER ROLES ===
CITIZEN — File complaints, track own complaints, manage profile, submit feedback
OFFICER — View complaints (filtered by department), update status, view field map, manage tasks. Cannot assign officers or delete complaints.
ADMIN — Full access: manage users (roles, active status), manage departments (CRUD), assign officers, update/delete complaints, view analytics, verify resolutions

=== HOW TO FILE A COMPLAINT ===
1. Go to the Live Demo section on the landing page or navigate to `/citizen/complaint`
2. Upload an image OR type a text description OR record voice
3. AI automatically analyzes: detects issue type, predicts department, assigns priority
4. Pin the location on the interactive map (click-to-select or GPS)
5. Optionally generate an AI request letter
6. System checks for duplicate complaints
7. Submit — you'll get a confirmation with complaint ID
8. Track status at `/citizen/complaints`

=== HOW TO CHECK COMPLAINT STATUS ===
- Go to `/citizen/complaints` to see all complaints with a visual status tracker
- Status flow: Pending → Assigned → In Progress → Resolved
- Each complaint shows ID, title, description, department, priority, status, location, date, image
- You can search/filter and edit title/description inline

=== AI FEATURES ===
- Image Analysis: Upload a photo — AI detects issue type, category, severity, and recommends resolution time
- Text Analysis: Describe the issue in text — AI classifies department and priority
- Voice Transcription: Record audio describing the issue — AI transcribes and analyzes it
- Translation: AI translates descriptions in Telugu, Hindi, or other languages to English
- Request Letter: AI generates a formal request letter to the government department
- Duplicate Check: AI checks if a similar complaint already exists
- Hotspot Prediction: Officers/Admins can view predicted complaint hotspots on the map

=== DEPARTMENT INFORMATION ===
- Roads — Potholes, broken roads, road cracks, damaged pavements
- Drainage — Blocked/overflowing drainage, water logging, sewage overflow
- Garbage/Sanitation — Garbage accumulation, overflowing dustbins, illegal dumping
- Water Supply — Water leakage, broken pipes, overflowing water
- Streetlight — Broken street lights, damaged poles, non-functional lights
- Electricity — Exposed wires, damaged poles, transformer problems
- Safety — Fallen trees, open manholes, broken railings, dangerous structures
- Traffic — Broken signals, missing signs, road obstructions
- General — Other civic issues

=== SLA (SERVICE LEVEL AGREEMENT) ===
Each department has a resolution deadline:
- Safety: 12 hours | Electricity: 24 hours | Garbage: 24 hours | Traffic: 24 hours
- Drainage: 48 hours | Water: 48 hours | Streetlight: 72 hours | Roads: 7 days
- Priority speeds things up: Critical = 0.25x, High = 0.5x, Medium = 1x, Low = 1.5x
- Status: ON_TRACK, WARNING, CRITICAL, OVERDUE
- Escalation: Officer → Admin → Municipal Commissioner

=== GAMIFICATION ===
Earn points: 10 per complaint submitted, 25 when verified resolved, 5 per upvote, 2 daily
Badges: First Step (10pts), Complaint Warrior (50pts), Civic Champion (100pts), City Guardian (250pts), Verified Reporter (75pts), Streak Master (100pts), Priority Hunter (60pts), Department Expert (80pts)
11 levels with increasing thresholds. Leaderboard tracks top citizens.
Check your profile at `/citizen/profile` or `/profile`.

=== NOTIFICATIONS ===
Real-time WebSocket updates for: status changes, officer assignment, SLA warnings, complaint resolution
Also available via REST API (check the notification bell in the navbar). Auto-polling every 30 seconds.

=== MAP FEATURES ===
- Complaint form: Click-to-pin on Leaflet/OpenStreetMap map, GPS detection, address search
- Officer map: Color-coded markers by priority, marker clustering, hotspot predictions, filters
- Default location: Hyderabad

=== HOW OFFICERS MANAGE COMPLAINTS ===
1. Go to `/officer/dashboard` → Tasks tab
2. View all complaints or filter "My Tasks"
3. Click a complaint to see full details, change status, add notes, upload evidence
4. Use the Field Map tab for geospatial view with hotspot predictions

=== HOW ADMINS MANAGE THE PLATFORM ===
1. Go to `/admin/dashboard` with 10 sidebar tabs
2. Overview: KPIs, charts, AI insights
3. Complaints: List/grid view, search, filter, assign officers, change status
4. Departments: Create/edit/delete departments
5. Users: Change roles, toggle active, assign department
6. Analytics: Priority, efficiency, trends charts
7. Broadcast: Send notifications
8. Settings: Platform configuration

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
async def upload_image(request: Request, file: UploadFile = File(...)):
    import uuid
    contents = await file.read()
    compressed_contents = compress_image(contents)

    filename = os.path.basename(file.filename)
    if not filename.lower().endswith(('.jpg', '.jpeg')):
        filename = filename.rsplit('.', 1)[0] + '.jpg'
        
    unique_filename = f"{uuid.uuid4()}_{filename}"
    filepath = os.path.join(UPLOAD_DIR, unique_filename)
    
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
        "filename": unique_filename,
        "imageUrl": f"/uploads/{unique_filename}",
        "analysis": analysis
    }


@router.post("/ai/analyze")
async def analyze_image(
    request: Request,
    file: UploadFile = File(...),
    description: str = Form("")
):
    import uuid
    print("===== /ai/analyze called =====")
    contents = await file.read()
    compressed_contents = compress_image(contents)

    filename = os.path.basename(file.filename)
    if not filename.lower().endswith(('.jpg', '.jpeg')):
        filename = filename.rsplit('.', 1)[0] + '.jpg'

    unique_filename = f"{uuid.uuid4()}_{filename}"
    file_path = os.path.join("uploads", unique_filename)

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
    result["image_url"] = f"/uploads/{unique_filename}"
    return result


@router.post("/analyze_text")
@router.post("/ai/analyze_text")
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
    import uuid
    contents = await file.read()
    
    filename = os.path.basename(file.filename)
    unique_filename = f"caption_{uuid.uuid4()}_{filename}"
    filepath = os.path.join(UPLOAD_DIR, unique_filename)
    
    with open(filepath, "wb") as f:
        f.write(contents)

    caption = generate_caption(filepath)

    return {
        "filename": unique_filename,
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
