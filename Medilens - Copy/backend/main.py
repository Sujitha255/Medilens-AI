from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from models import HealthCheck, AnalysisResponse
from services import analyze_medical_document
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI(title="Medilens AI Backend", version="1.0.0")

# Allow CORS for Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", response_model=HealthCheck)
async def root():
    return HealthCheck(status="Medilens Backend Running")

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.post("/api/analyze", response_model=AnalysisResponse)
async def analyze_report(file: UploadFile = File(...)):
    print(f"Received file: {file.filename}, type: {file.content_type}")
    content = await file.read()
    try:
        result = analyze_medical_document(content, file.content_type)
        return result
    except Exception as e:
        print(f"Error processing file: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
