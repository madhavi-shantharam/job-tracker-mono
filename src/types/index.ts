export type ApplicationStatus =
  | 'APPLIED'
  | 'PHONE_SCREEN'
  | 'INTERVIEW'
  | 'OFFER'
  | 'REJECTED';

export interface Application {
  id: number;
  company: string;
  role: string;
  status: ApplicationStatus;
  jobDescriptionText?: string;
  notes?: string;
  appliedDate?: string;       // ISO date string: "2026-04-08"
  createdAt: string;          // ISO datetime string
  updatedAt: string;
}

export interface ApplicationRequest {
  company: string;
  role: string;
  status: ApplicationStatus;
  jobDescriptionText?: string;
  notes?: string;
  appliedDate?: string;
}

export interface AnalyzeRequest {
  jobDescription: string;
  resumeText: string;
}

export interface AnalyzeResponse {
  matchPercentage: number;
  missingKeywords: string[];
  suggestedEdits: string[];
  summary: string;
}