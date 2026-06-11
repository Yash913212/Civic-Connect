from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import shutil
import os
from dotenv import load_dotenv

load_dotenv()

from app.database.database import engine, Base, get_db
from app.database.models import Complaint as DBComplaint
from sqlalchemy.orm import Session
from fastapi import Depends
from app.auth.routes import router as auth_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="CivicConnect API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://civic-connect-self.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

class Complaint(BaseModel):
    title: str
    description: str
    location: str
    department: str = "General"
    priority: str = "Low"

@app.get("/")
@app.head("/")
def root():
    return {"message": "Welcome to CivicConnect API"}

import base64
import requests
import json

OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY", "")

@app.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    contents = await file.read()
    
    filepath = os.path.join(UPLOAD_DIR, file.filename)
    with open(filepath, "wb") as buffer:
        buffer.write(contents)
        
    try:
        base64_image = base64.b64encode(contents).decode('utf-8')
        mime_type = file.content_type or "image/jpeg"
        
        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json"
        }
        
        prompt = """
        Build a specialized CivicConnect Image Intelligence Engine.

        IMPORTANT:
        This AI is ONLY for IMAGE ANALYSIS.
        Do NOT analyze text input.
        Do NOT analyze voice input.
        Do NOT behave like a general-purpose AI assistant.
        The system must only process uploaded complaint images.

        ================================================
        ROLE
        You are CivicConnect Vision AI.
        Your job is to analyze civic infrastructure images and identify municipal issues.
        You must classify civic grievances visible in uploaded images.

        ================================================
        SUPPORTED IMAGE CATEGORIES
        Road Infrastructure (Potholes, Road Cracks, Damaged Roads, Broken Pavements, Road Erosion, Missing Road Signs)
        Drainage (Blocked Drainage, Open Drainage, Overflowing Drainage, Water Logging, Sewage Overflow, Drainage Damage)
        Street Lights (Broken Street Lights, Non-Working Lights, Damaged Poles, Missing Lights)
        Sanitation (Garbage Accumulation, Overflowing Bins, Public Waste, Illegal Dumping)
        Water Supply (Pipe Leakage, Water Overflow, Damaged Water Infrastructure)
        Electricity (Exposed Wires, Damaged Electric Poles, Transformer Issues)
        Public Safety (Fallen Trees, Dangerous Structures, Broken Railings, Open Manholes)
        Traffic Infrastructure (Broken Traffic Signals, Missing Sign Boards, Road Obstructions)

        ================================================
        IMAGE ANALYSIS WORKFLOW
        Step 1: Detect visible issue.
        Step 2: Determine category.
        Step 3: Determine department.
        Step 4: Determine severity.
        Step 5: Generate summary.
        Step 6: Generate confidence score.

        ================================================
        SEVERITY RULES
        Critical: Open manholes, Exposed electrical wires, Major road collapse, Dangerous public hazards
        High: Large potholes, Major drainage blockage, Flooding, Large garbage accumulation
        Medium: Broken street lights, Damaged pavements, Small drainage issues
        Low: Minor maintenance issues

        ================================================
        DEPARTMENT ROUTING
        Road Issues -> Roads Department
        Drainage Issues -> Drainage Department
        Street Lights -> Electrical Department
        Garbage Issues -> Sanitation Department
        Water Issues -> Water Supply Department
        Safety Hazards -> Public Safety Department
        Traffic Issues -> Traffic Department

        ================================================
        RESTRICTIONS
        Never identify people. Never identify faces.
        Ignore humans in the image. Ignore vehicles unless they indicate a civic issue.
        Focus only on public infrastructure problems.

        ================================================
        OUTPUT FORMAT
        Return JSON only.
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
        analysis = json.loads(ai_result)
    except Exception as e:
        print(f"AI Analysis failed: {e}")
        analysis = {
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
        "analysis": analysis
    }

class TextAnalysisRequest(BaseModel):
    text: str

@app.post("/analyze_text")
def analyze_text(request: TextAnalysisRequest):
    try:
        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json"
        }
        
        prompt = f"""
        Analyze this civic issue description: "{request.text}"
        Return a JSON response strictly in this format:
        {{
          "title": "Short title of the issue",
          "description": "Cleaned up and detailed description of the issue.",
          "department": "Suggested Department (e.g. Public Works, Sanitation, Water & Power, Traffic)",
          "priority": "High, Medium, or Low",
          "confidence": "AI confidence percentage as string like '98.2%'"
        }}
        """
        
        payload = {
            "model": "openai/gpt-4o-mini",
            "response_format": { "type": "json_object" },
            "messages": [
                {
                    "role": "user",
                    "content": [
                        { "type": "text", "text": prompt }
                    ]
                }
            ]
        }
        
        response = requests.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=payload)
        response_data = response.json()
        ai_result = response_data['choices'][0]['message']['content']
        analysis = json.loads(ai_result)
    except Exception as e:
        print(f"AI Text Analysis failed: {e}")
        analysis = {
            "title": "Unknown Issue",
            "description": request.text,
            "department": "General",
            "priority": "Low",
            "confidence": "0%"
        }
        
    return {"analysis": analysis}

@app.post("/complaint")
def create_complaint(complaint: Complaint, db: Session = Depends(get_db)):
    db_complaint = DBComplaint(
        title=complaint.title,
        description=complaint.description,
        location=complaint.location,
        department=complaint.department,
        priority=complaint.priority
    )
    db.add(db_complaint)
    db.commit()
    db.refresh(db_complaint)
    return {"message": "Complaint Submitted Successfully", "id": db_complaint.id}

@app.get("/complaints")
def get_complaints(db: Session = Depends(get_db)):
    complaints = db.query(DBComplaint).order_by(DBComplaint.created_at.desc()).all()
    # Format datetime objects for JSON serialization and return simple list
    return [
        {
            "id": str(c.id),
            "title": c.title,
            "description": c.description,
            "location": c.location,
            "dept": c.department,
            "priority": c.priority,
            "status": c.status.value if hasattr(c.status, 'value') else c.status,
            "time": c.created_at.isoformat() if c.created_at else "Just now"
        }
        for c in complaints
    ]
