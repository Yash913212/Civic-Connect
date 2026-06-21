from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import shutil
import os
from dotenv import load_dotenv
from app.ai.predict import predict_issue
load_dotenv()

from app.database.database import engine, Base, get_db
from app.database.models import Complaint as DBComplaint
from sqlalchemy.orm import Session
from fastapi import Depends
from fastapi.staticfiles import StaticFiles
from app.auth.routes import router as auth_router

Base.metadata.create_all(bind=engine)

from sqlalchemy import text
try:
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE complaints ADD COLUMN image_url VARCHAR"))
except Exception as e:
    pass

try:
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE complaints ALTER COLUMN priority TYPE VARCHAR USING priority::VARCHAR"))
        conn.execute(text("ALTER TABLE complaints ALTER COLUMN status TYPE VARCHAR USING status::VARCHAR"))
except Exception as e:
    pass
app = FastAPI(title="CivicConnect API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "https://civic-connect-self.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

class Complaint(BaseModel):
    title: str
    description: str
    location: str
    department: str = "General"
    priority: str = "Low"
    image_url: str | None = None

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
async def analyze_image(
    file: UploadFile = File(...),
    description: str = Form("")
):

    file_path = (
        f"uploads/{file.filename}"
    )

    with open(
        file_path,
        "wb"
    ) as f:

        f.write(
            await file.read()
        )

    result = predict_issue(
        file_path
    )
    result["citizen_description"] = description

    return {
    **result,
    "citizen_description": description
}

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
            "description": request.text,
            "department": "General",
            "priority": "Low",
            "confidence": "0%"
        }
        
    return {"analysis": analysis}

@app.post("/complaint")
def create_complaint(complaint: Complaint, db: Session = Depends(get_db)):
    try:
        db_complaint = DBComplaint(
            title=complaint.title,
            description=complaint.description,
            location=complaint.location,
            department=complaint.department,
            priority=complaint.priority,
            image_url=complaint.image_url
        )
        db.add(db_complaint)
        db.commit()
        db.refresh(db_complaint)
        return {"message": "Complaint Submitted Successfully", "id": db_complaint.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

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
            "image_url": c.image_url,
            "time": c.created_at.isoformat() if c.created_at else "Just now"
        }
        for c in complaints
    ]
