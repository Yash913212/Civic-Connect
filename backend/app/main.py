from fastapi import FastAPI, UploadFile, File, HTTPException, Form, Header, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.ai.translator import translate_to_english
from app.ai.priority_predictor import predict_priority
import shutil
import os
import io
import json
from PIL import Image
from dotenv import load_dotenv
from app.ai.predict import predict_issue
from app.ai.captioning import generate_caption
from app.ai.transcriber import transcribe_audio, transcribe_audio_file
from app.ai.request_note import generate_request_note
load_dotenv()

from app.database.database import engine, Base, get_db
from app.database.models import Complaint as DBComplaint
from sqlalchemy.orm import Session
from fastapi import Depends
from fastapi.staticfiles import StaticFiles
from app.auth.routes import router as auth_router
from app.auth.dependencies import get_current_user
from app.database.models import User, RoleEnum, ComplaintStatus, Notification, NotificationType, Department
from jose import jwt, JWTError
from app.core.config import settings

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)

try:
    Base.metadata.create_all(bind=engine)
    print("Database connected successfully.")
except Exception as e:
    print("Database initialization failed:", e)

from sqlalchemy import text

# PostgreSQL-specific migrations (skip for SQLite)
if not settings.DATABASE_URL.startswith("sqlite"):
    try:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE complaints ADD COLUMN IF NOT EXISTS image_url VARCHAR"))
    except Exception as e:
        pass

    try:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE complaints ALTER COLUMN priority TYPE VARCHAR USING priority::VARCHAR"))
            conn.execute(text("ALTER TABLE complaints ALTER COLUMN status TYPE VARCHAR USING status::VARCHAR"))
    except Exception as e:
        pass

    try:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE complaints ADD COLUMN IF NOT EXISTS latitude VARCHAR"))
    except Exception: pass

    try:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE complaints ADD COLUMN IF NOT EXISTS longitude VARCHAR"))
    except Exception: pass

    try:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE complaints ADD COLUMN IF NOT EXISTS address VARCHAR"))
    except Exception: pass

    try:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE complaints ADD COLUMN IF NOT EXISTS user_id VARCHAR"))
    except Exception: pass

    try:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE complaints ADD COLUMN IF NOT EXISTS assigned_to VARCHAR"))
    except Exception: pass

    try:
        Base.metadata.tables["notifications"].create(bind=engine, checkfirst=True)
    except Exception as e:
        pass

    try:
        Base.metadata.tables["departments"].create(bind=engine, checkfirst=True)
    except Exception as e:
        pass

    try:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE complaints ADD COLUMN IF NOT EXISTS ai_summary VARCHAR"))
    except Exception: pass

    try:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE complaints ADD COLUMN IF NOT EXISTS ai_request_letter VARCHAR"))
    except Exception: pass

    try:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR"))
    except Exception: pass

app = FastAPI(title="CivicConnect API")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "https://civic-connect-self.vercel.app",
        "https://civic-connect-self.vercel.app/",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self.active_connections:
            self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_personal_message(self, message: str, user_id: str):
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_text(message)
                except:
                    pass

    async def broadcast_to_admins(self, message: str, db: Session):
        admins = db.query(User).filter(User.role == RoleEnum.ADMIN).all()
        for admin in admins:
            await self.send_personal_message(message, str(admin.id))

manager = ConnectionManager()

@app.websocket("/ws/notifications/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(websocket, user_id)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

class Complaint(BaseModel):
    title: str
    description: str
    location: str
    latitude: str | None = None
    longitude: str | None = None
    address: str | None = None
    department: str = "General"
    priority: str = "Low"
    image_url: str | None = None
    ai_summary: str | None = None
    ai_request_letter: str | None = None

class StatusUpdateRequest(BaseModel):
    status: str

class AssignRequest(BaseModel):
    officer_id: str | None = None

class RoleUpdateRequest(BaseModel):
    role: str

class DepartmentUpdateRequest(BaseModel):
    department: str | None = None

class ComplaintUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    location: str | None = None
    latitude: str | None = None
    longitude: str | None = None
    address: str | None = None
    department: str | None = None
    priority: str | None = None
    image_url: str | None = None
    ai_summary: str | None = None
    ai_request_letter: str | None = None

def get_optional_user(
    authorization: str | None = None,
    db: Session = Depends(get_db)
):
    if not authorization:
        return None
    try:
        token = authorization.replace("Bearer ", "")
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id:
            return db.query(User).filter(User.id == user_id).first()
    except JWTError:
        pass
    return None

@app.get("/")
@app.head("/")
def root():
    return {"message": "Welcome to CivicConnect API"}

def compress_image(contents: bytes, max_size=(1024, 1024), quality=80) -> bytes:
    try:
        img = Image.open(io.BytesIO(contents))
        if img.mode != 'RGB':
            img = img.convert('RGB')
        img.thumbnail(max_size, Image.Resampling.LANCZOS)
        output = io.BytesIO()
        img.save(output, format="JPEG", quality=quality, optimize=True)
        return output.getvalue()
    except Exception as e:
        print(f"Image compression failed: {e}")
        return contents

import base64
import requests
import json

OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY", "")

@app.post("/upload")
@limiter.limit("5/minute")
async def upload_image(request: Request, file: UploadFile = File(...)):
    contents = await file.read()
    compressed_contents = compress_image(contents)
    
    # Ensure it gets saved as .jpg if it was compressed to jpeg
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

class TextAnalysisRequest(BaseModel):
    text: str
@app.post("/ai/analyze")
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

    # Translate user's description into English

    translated_description = (
        translate_to_english(description)
        if description.strip()
        else ""
    )
    result = predict_issue(
          file_path,
          description=translated_description
    )

# Return both original and translated text
    result["citizen_description"] = description
    result["translated_description"] = translated_description
    caption = generate_caption(file_path)
    result["ai_caption"] = caption
    priority = predict_priority(
         issue=result["issue"],
         description=translated_description,
         image_caption=caption
    )

# Override the old priority
    result["priority"] = priority
    return result

from app.ai.llm_client import call_llm_with_fallback

@app.post("/analyze_text")
@limiter.limit("15/minute")
def analyze_text(request: Request, body: TextAnalysisRequest):
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
        
        ai_result = call_llm_with_fallback(messages, is_vision=False, max_tokens=150)
        
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

@app.post("/ai/caption")
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


@app.post("/ai/transcribe")
async def transcribe_audio_endpoint(file: UploadFile = File(...), language: str = Form("")):
    contents = await file.read()
    text = transcribe_audio(contents, language=language, filename=file.filename, content_type=file.content_type)

    return {
        "transcription": text,
        "language": language,
    }


@app.post("/complaints")
@app.post("/complaint")
def create_complaint(
    complaint: Complaint,
    db: Session = Depends(get_db),
    authorization: str | None = Header(None),
):
    try:
        user = get_optional_user(authorization, db)

        db_complaint = DBComplaint(
            title=complaint.title,
            description=complaint.description,
            location=complaint.location,
            latitude=complaint.latitude,
            longitude=complaint.longitude,
            address=complaint.address,
            department=complaint.department,
            priority=complaint.priority,
            image_url=complaint.image_url,
            ai_summary=complaint.ai_summary,
            ai_request_letter=complaint.ai_request_letter,
            user_id=user.id if user else None,
            status=ComplaintStatus.PENDING
        )
        db.add(db_complaint)
        db.flush()

        if user:
            _create_notification(db, user.id,
                "Complaint Submitted",
                f"Your complaint '{db_complaint.title}' has been submitted successfully.",
                NotificationType.COMPLAINT_SUBMITTED, db_complaint.id)

        db.commit()
        db.refresh(db_complaint)

        return {"message": "Complaint Submitted Successfully", "id": str(db_complaint.id)}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

def _complaint_to_dict(c: DBComplaint, db: Session) -> dict:
    assigned_name = None
    if c.assigned_to:
        officer = db.query(User).filter(User.id == c.assigned_to).first()
        assigned_name = officer.full_name if officer else None
    return {
        "id": str(c.id),
        "title": c.title,
        "description": c.description,
        "location": c.location,
        "latitude": c.latitude,
        "longitude": c.longitude,
        "address": c.address,
        "dept": c.department,
        "priority": c.priority,
        "status": c.status.value if hasattr(c.status, 'value') else c.status,
        "image_url": c.image_url,
        "ai_summary": c.ai_summary,
        "ai_request_letter": c.ai_request_letter,
        "user_id": str(c.user_id) if c.user_id else None,
        "assigned_to": str(c.assigned_to) if c.assigned_to else None,
        "assigned_name": assigned_name,
        "time": c.created_at.isoformat() if c.created_at else "Just now"
    }

@app.get("/complaints")
def get_complaints(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(DBComplaint)
    if current_user.role == RoleEnum.OFFICER and current_user.department:
        query = query.filter(DBComplaint.department == current_user.department)
    complaints = query.order_by(DBComplaint.created_at.desc()).all()
    return [_complaint_to_dict(c, db) for c in complaints]

@app.get("/complaints/my")
def get_my_complaints(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    complaints = db.query(DBComplaint).filter(
        DBComplaint.user_id == current_user.id
    ).order_by(DBComplaint.created_at.desc()).all()
    return [_complaint_to_dict(c, db) for c in complaints]

@app.get("/officers")
def list_officers(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != RoleEnum.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can list officers")

    officers = db.query(User).filter(User.role == RoleEnum.OFFICER, User.is_active == True).all()
    return [
        {
            "id": str(o.id),
            "full_name": o.full_name,
            "email": o.email,
            "department": o.department,
        }
        for o in officers
    ]

def _create_notification(db: Session, user_id, title: str, message: str, ntype: NotificationType, complaint_id=None):
    notif = Notification(
        user_id=user_id,
        title=title,
        message=message,
        type=ntype,
        complaint_id=complaint_id,
    )
    db.add(notif)
    db.flush()

@app.get("/notifications")
def get_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notifs = db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(Notification.created_at.desc()).limit(50).all()
    return [
        {
            "id": str(n.id),
            "title": n.title,
            "message": n.message,
            "type": n.type.value if hasattr(n.type, 'value') else n.type,
            "complaint_id": str(n.complaint_id) if n.complaint_id else None,
            "is_read": n.is_read,
            "time": n.created_at.isoformat() if n.created_at else "Just now"
        }
        for n in notifs
    ]

@app.get("/notifications/unread-count")
def unread_notification_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    count = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).count()
    return {"count": count}

@app.patch("/notifications/{notification_id}/read")
def mark_notification_read(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    db.commit()
    return {"message": "Marked as read"}

@app.patch("/notifications/read-all")
def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"message": "All notifications marked as read"}

# ── Admin: User Management ──────────────────────────────────

@app.get("/users")
def list_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != RoleEnum.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can list users")
    users = db.query(User).order_by(User.created_at.desc()).all()
    return [
        {
            "id": str(u.id),
            "full_name": u.full_name,
            "email": u.email,
            "phone_number": u.phone_number,
            "role": u.role.value if hasattr(u.role, 'value') else u.role,
            "is_active": u.is_active,
            "created_at": u.created_at.isoformat() if u.created_at else None,
        }
        for u in users
    ]

@app.patch("/users/{user_id}/role")
def update_user_role(
    user_id: str,
    request: RoleUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != RoleEnum.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can change roles")
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="Cannot change your own role")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    try:
        user.role = RoleEnum(request.role)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {', '.join(r.value for r in RoleEnum)}")
    db.commit()
    return {"message": f"User role updated to {request.role}"}

@app.patch("/users/{user_id}/toggle-active")
def toggle_user_active(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != RoleEnum.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can toggle user status")
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="Cannot disable your own account")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = not user.is_active
    db.commit()
    return {"message": f"User {'activated' if user.is_active else 'deactivated'}", "is_active": user.is_active}

@app.patch("/users/{user_id}/department")
def update_user_department(
    user_id: str,
    request: DepartmentUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != RoleEnum.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can update department")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.department = request.department
    db.commit()
    return {"message": f"Department updated to '{request.department}'", "department": user.department}

# ── Admin: Department CRUD ─────────────────────────────────

class DepartmentCreate(BaseModel):
    name: str
    description: str = ""

class DepartmentUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    is_active: bool | None = None

@app.get("/departments")
def list_departments(db: Session = Depends(get_db)):
    depts = db.query(Department).order_by(Department.name).all()
    return [
        {
            "id": str(d.id),
            "name": d.name,
            "description": d.description,
            "is_active": d.is_active,
            "created_at": d.created_at.isoformat() if d.created_at else None,
        }
        for d in depts
    ]

@app.post("/departments")
def create_department(
    request: DepartmentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != RoleEnum.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can create departments")
    existing = db.query(Department).filter(Department.name == request.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Department already exists")
    dept = Department(name=request.name, description=request.description)
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return {"id": str(dept.id), "name": dept.name, "description": dept.description, "is_active": dept.is_active}

@app.patch("/departments/{department_id}")
def update_department(
    department_id: str,
    request: DepartmentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != RoleEnum.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can update departments")
    dept = db.query(Department).filter(Department.id == department_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    if request.name is not None:
        dept.name = request.name
    if request.description is not None:
        dept.description = request.description
    if request.is_active is not None:
        dept.is_active = request.is_active
    db.commit()
    db.refresh(dept)
    return {"id": str(dept.id), "name": dept.name, "description": dept.description, "is_active": dept.is_active}

@app.delete("/departments/{department_id}")
def delete_department(
    department_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != RoleEnum.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can delete departments")
    dept = db.query(Department).filter(Department.id == department_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    db.delete(dept)
    db.commit()
    return {"message": "Department deleted"}

# ── Assignment / Status ────────────────────────────────────

@app.patch("/complaints/{complaint_id}/assign")
def assign_officer(
    complaint_id: str,
    request: AssignRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != RoleEnum.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can assign officers")

    complaint = db.query(DBComplaint).filter(DBComplaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

        if request.officer_id:
            officer = db.query(User).filter(
                User.id == request.officer_id,
                User.role == RoleEnum.OFFICER,
                User.is_active == True
            ).first()
            if not officer:
                raise HTTPException(status_code=404, detail="Officer not found")
            complaint.assigned_to = officer.id
            if complaint.status == ComplaintStatus.PENDING:
                complaint.status = ComplaintStatus.ASSIGNED

        _create_notification(db, officer.id,
            "New Assignment",
            f"Complaint '{complaint.title}' has been assigned to you.",
            NotificationType.ASSIGNMENT, complaint.id)

        if complaint.user_id:
            _create_notification(db, complaint.user_id,
                "Officer Assigned",
                f"Officer {officer.full_name} has been assigned to your complaint '{complaint.title}'.",
                NotificationType.ASSIGNMENT, complaint.id)
    else:
        complaint.assigned_to = None

    db.commit()
    db.refresh(complaint)

    officer_name = None
    if complaint.assigned_to:
        officer = db.query(User).filter(User.id == complaint.assigned_to).first()
        officer_name = officer.full_name if officer else None

    return {
        "id": str(complaint.id),
        "assigned_to": str(complaint.assigned_to) if complaint.assigned_to else None,
        "assigned_name": officer_name,
        "status": complaint.status.value if hasattr(complaint.status, 'value') else complaint.status,
        "message": f"Assigned to {officer_name}" if officer_name else "Officer unassigned"
    }

@app.patch("/complaints/{complaint_id}/status")
def update_complaint_status(
    complaint_id: str,
    request: StatusUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in [RoleEnum.OFFICER, RoleEnum.ADMIN]:
        raise HTTPException(status_code=403, detail="Only officers and admins can change complaint status")

    complaint = db.query(DBComplaint).filter(DBComplaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    valid_statuses = [s.value for s in ComplaintStatus]
    if request.status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
        )

    old_status = complaint.status
    complaint.status = ComplaintStatus(request.status)
    db.flush()

    new_status = complaint.status.value if hasattr(complaint.status, 'value') else complaint.status

    if complaint.user_id and complaint.user_id != current_user.id:
        _create_notification(db, complaint.user_id,
            "Status Update",
            f"Your complaint '{complaint.title}' is now '{new_status}'.",
            NotificationType.STATUS_UPDATE, complaint.id)

    if new_status == "Resolved" and complaint.user_id:
        _create_notification(db, complaint.user_id,
            "Complaint Resolved",
            f"Your complaint '{complaint.title}' has been resolved!",
            NotificationType.COMPLAINT_RESOLVED, complaint.id)

    if complaint.assigned_to and complaint.assigned_to != current_user.id:
        _create_notification(db, complaint.assigned_to,
            "Status Update",
            f"Complaint '{complaint.title}' updated to '{new_status}'.",
            NotificationType.STATUS_UPDATE, complaint.id)

    db.commit()
    db.refresh(complaint)

    return {
        "id": str(complaint.id),
        "title": complaint.title,
        "status": new_status,
        "message": f"Complaint status updated to '{new_status}'"
    }

@app.put("/complaints/{complaint_id}")
def update_complaint(
    complaint_id: str,
    request: ComplaintUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    complaint = db.query(DBComplaint).filter(DBComplaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    is_owner = complaint.user_id and str(complaint.user_id) == str(current_user.id)
    is_admin = current_user.role == RoleEnum.ADMIN
    is_assigned = complaint.assigned_to and str(complaint.assigned_to) == str(current_user.id)

    if not (is_owner or is_admin or is_assigned):
        raise HTTPException(status_code=403, detail="Not authorized to update this complaint")

    if request.title is not None: complaint.title = request.title
    if request.description is not None: complaint.description = request.description
    if request.location is not None: complaint.location = request.location
    if request.latitude is not None: complaint.latitude = request.latitude
    if request.longitude is not None: complaint.longitude = request.longitude
    if request.address is not None: complaint.address = request.address
    if request.department is not None: complaint.department = request.department
    if request.priority is not None: complaint.priority = request.priority
    if request.image_url is not None: complaint.image_url = request.image_url
    if request.ai_summary is not None: complaint.ai_summary = request.ai_summary
    if request.ai_request_letter is not None: complaint.ai_request_letter = request.ai_request_letter

    db.commit()
    db.refresh(complaint)
    
    # Notify complaint creator via WebSocket
    try:
        import asyncio
        asyncio.create_task(manager.send_personal_message(
            json.dumps({
                "type": "STATUS_UPDATE",
                "complaint_id": str(complaint.id),
                "status": complaint.status.value,
                "title": complaint.title
            }),
            str(complaint.user_id)
        ))
    except:
        pass

    return _complaint_to_dict(complaint, db)

@app.delete("/complaints/{complaint_id}")
def delete_complaint(
    complaint_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    complaint = db.query(DBComplaint).filter(DBComplaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    is_owner = complaint.user_id and str(complaint.user_id) == str(current_user.id)
    is_admin = current_user.role == RoleEnum.ADMIN

    if not (is_owner or is_admin):
        raise HTTPException(status_code=403, detail="Not authorized to delete this complaint")

    db.delete(complaint)
    db.commit()

    return {"message": "Complaint deleted", "id": str(complaint_id)}

@app.get("/analytics")
def get_analytics(db: Session = Depends(get_db)):
    from datetime import datetime, timedelta
    from sqlalchemy import func, case
    
    total = db.query(DBComplaint).count()
    closed = db.query(DBComplaint).filter(DBComplaint.status == ComplaintStatus.RESOLVED).count()
    open_cases = total - closed
    resolution_rate = int((closed / total * 100)) if total > 0 else 0
    
    # Priority Data
    priority_counts = db.query(DBComplaint.priority, func.count(DBComplaint.id)).group_by(DBComplaint.priority).all()
    priority_map = {p: c for p, c in priority_counts}
    priority_data = [
        {"name": "Critical", "value": priority_map.get("Critical", 0), "color": "#ef4444"},
        {"name": "High", "value": priority_map.get("High", 0), "color": "#f97316"},
        {"name": "Medium", "value": priority_map.get("Medium", 0), "color": "#eab308"},
        {"name": "Low", "value": priority_map.get("Low", 0), "color": "#10b981"},
    ]
    
    # Department Performance
    dept_stats = db.query(
        DBComplaint.department,
        func.count(DBComplaint.id).label('total'),
        func.sum(case((DBComplaint.status == ComplaintStatus.RESOLVED, 1), else_=0)).label('resolved')
    ).group_by(DBComplaint.department).all()
    
    dept_performance = []
    colors = ['#f59e0b', '#06b6d4', '#10b981', '#3b82f6', '#eab308', '#f97316', '#ef4444', '#a855f7']
    for i, (dept, d_total, d_resolved) in enumerate(dept_stats):
        eff = int((d_resolved / d_total * 100)) if d_total > 0 else 0
        dept_performance.append({
            "name": dept or "General",
            "efficiency": eff,
            "fill": colors[i % len(colors)]
        })
        
    # Daily Trends (Last 7 Days)
    today = datetime.utcnow().date()
    trends = []
    for i in range(6, -1, -1):
        target_date = today - timedelta(days=i)
        
        # New complaints on that day
        new_count = db.query(DBComplaint).filter(
            func.date(DBComplaint.created_at) == target_date
        ).count()
        
        # Resolved complaints on that day
        res_count = db.query(DBComplaint).filter(
            func.date(DBComplaint.updated_at) == target_date,
            DBComplaint.status == ComplaintStatus.RESOLVED
        ).count()
        
        trends.append({
            "name": target_date.strftime("%a"),
            "new": new_count,
            "resolved": res_count
        })

    return {
        "kpis": {
            "total": total,
            "open": open_cases,
            "closed": closed,
            "resolutionRate": resolution_rate
        },
        "priorityData": priority_data,
        "deptPerformance": dept_performance,
        "trends": trends
    }

class RequestNoteRequest(BaseModel):
    issue: str
    department: str
    priority: str
    location: str
    citizen_description: str = ""
    image_caption: str = ""


@app.post("/ai/request-note")
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
