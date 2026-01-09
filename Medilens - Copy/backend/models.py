from pydantic import BaseModel
from typing import List, Optional

class HealthCheck(BaseModel):
    status: str = "OK"

class TestResult(BaseModel):
    test_name: str
    value: str
    unit: Optional[str] = None
    reference_range: Optional[str] = None
    status: str  # Normal, Borderline, Needs Medical Attention
    flag: str    # "green", "yellow", "red"
    visual_value: int # 0-100 scale for UI slider
    interpretation: str # Short blurb for this specific test

class Explanation(BaseModel):
    patient_summary: str
    doctor_summary: str
    recommendations_patient: List[str]
    correlations_doctor: List[str]
    confidence_score: float

class AnalysisResponse(BaseModel):
    results: List[TestResult]
    explanation: Explanation
    disclaimer: str = "This is an AI-generated explanation, not a medical diagnosis."
    is_mock: bool = False
