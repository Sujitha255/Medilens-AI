import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

export interface TestResult {
    test_name: string;
    value: string;
    unit?: string;
    reference_range?: string;
    status: string;
    flag: string;
    visual_value: number;
    interpretation: string;
}

export interface Explanation {
    patient_summary: string;
    doctor_summary: string;
    recommendations_patient: string[];
    correlations_doctor: string[];
    confidence_score: number;
}

export interface AnalysisResponse {
    results: TestResult[];
    explanation: Explanation;
    disclaimer: string;
    is_mock?: boolean;
}

export const analyzeReport = async (file: File): Promise<AnalysisResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post<AnalysisResponse>(`${API_URL}/analyze`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};
