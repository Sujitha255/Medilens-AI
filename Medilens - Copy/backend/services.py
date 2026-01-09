import os
import json
from typing import List
import google.generativeai as genai
from models import AnalysisResponse, TestResult, Explanation

# Fallback mock data for testing/demo without API key
MOCK_RESPONSE = {
    "results": [
        {
            "test_name": "Hemoglobin",
            "value": "11.5",
            "unit": "g/dL",
            "reference_range": "13.5 - 17.5",
            "status": "Needs Medical Attention",
            "flag": "red",
            "visual_value": 30, 
            "interpretation": "Low hemoglobin indicates potential anemia."
        },
        {
            "test_name": "WBC Count",
            "value": "7.8",
            "unit": "x10^9/L",
            "reference_range": "4.5 - 11.0",
            "status": "Normal",
            "flag": "green",
            "visual_value": 50,
            "interpretation": "White blood cell count is within healthy range."
        }
    ],
    "explanation": {
        "patient_summary": "Your hemoglobin levels are lower than normal, which suggests you might have anemia. This can cause fatigue and weakness. Your white blood cells are normal, meaning no immediate sign of infection.",
        "doctor_summary": "Patient presents with mild anemia (Hb 11.5 g/dL). WBC count is normal. Suggest evaluating Iron studies and Ferritin to rule out Iron Deficiency Anemia.",
        "recommendations_patient": ["Eating iron-rich foods like spinach and red meat", "Consulting a doctor about iron supplements", "Resting if feeling fatigued"],
        "correlations_doctor": ["Low Hb isolated, consistent with IDA", "No leukocytosis"],
        "confidence_score": 85
    }
}

def analyze_medical_document(content: bytes, mime_type: str) -> AnalysisResponse:
    # Explicitly load environment variables
    from dotenv import load_dotenv
    env_path = r"d:\Medilens\backend\.env"
    load_dotenv(env_path)
    
    api_key = os.environ.get("GEMINI_API_KEY")
    
    print(f"DEBUG: Checking API Key... Found: {bool(api_key)}")

    if not api_key:
        print("Warning: GEMINI_API_KEY not found. Using Mock Data.")
        response = AnalysisResponse(**MOCK_RESPONSE)
        response.is_mock = True
        return response

    try:
        genai.configure(api_key=api_key)
        # Switching to gemini-flash-latest which has available quota
        model = genai.GenerativeModel('gemini-flash-latest')
        
        prompt = """
        ACT AS A MEDICAL AI EXPERT.
        Analyze the provided medical report image/document.
        
        TASK:
        1. OCR & Extract: Identify all test names, numerical values, units, and reference ranges.
        2. Analyze: Compare values to ranges. Determine status: "Normal", "Borderline", or "Needs Medical Attention".
        3. Explain (Patient Mode): Summarize findings in simple, non-medical language.
        4. Explain (Doctor Mode): Summarize with clinical terminology and correlations.
        
        CRITICAL RULES:
        - Output ONLY valid JSON.
        - "flag" MUST be "green", "yellow", or "red".
        - "visual_value": integer 0-100 (percentage).
        - "confidence_score": integer 0-100 (representing the overall health score/wellness index, where 100 is perfect health).
        
        SCHEMA:
        {
            "results": [
                {"test_name": "...", "value": "...", "unit": "...", "reference_range": "...", "status": "...", "flag": "...", "visual_value": 50, "interpretation": "..."}
            ],
            "explanation": {
                "patient_summary": "...",
                "doctor_summary": "...",
                "recommendations_patient": ["..."],
                "correlations_doctor": ["..."],
                "confidence_score": 85
            }
        }
        """
        
        image_part = {
            "mime_type": mime_type,
            "data": content
        }
        
        response = model.generate_content([prompt, image_part])
        
        text = response.text.strip()
        # More robust JSON extraction
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
        
        print(f"DEBUG: AI Response text: {text}")
        data = json.loads(text)
        
        # Ensure confidence_score is 0-100 (scaled for UI)
        if "explanation" in data and "confidence_score" in data["explanation"]:
            score = data["explanation"]["confidence_score"]
            if score <= 1.0:
                data["explanation"]["confidence_score"] = int(score * 100)
        
        return AnalysisResponse(**data)
        
    except Exception as e:
        print(f"AI Analysis Error: {e}")
        # Always return a valid response but mark it as mock/failed
        error_response = MOCK_RESPONSE.copy()
        error_response["explanation"]["patient_summary"] = f"Error processing report: {str(e)}. Please ensure the document is clear and try again."
        response = AnalysisResponse(**error_response)
        response.is_mock = True
        return response
