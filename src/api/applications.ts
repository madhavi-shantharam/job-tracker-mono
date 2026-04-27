import axios from 'axios';
import type { Application, ApplicationRequest, AnalyzeRequest, AnalyzeResponse } from '../types';

// Always use relative paths — works both locally (Vite proxy)
// and in production (CloudFront proxy)
const BASE    = '/api/applications';
const ANALYZE = '/api/analyze';

export const getApplications = async (): Promise<Application[]> => {
  const res = await axios.get<Application[]>(BASE);
  return res.data;
};

export const getApplication = async (id: number): Promise<Application> => {
  const res = await axios.get<Application>(`${BASE}/${id}`);
  return res.data;
};

export const createApplication = async (data: ApplicationRequest): Promise<Application> => {
  const res = await axios.post<Application>(BASE, data);
  return res.data;
};

export const updateApplication = async (id: number, data: ApplicationRequest): Promise<Application> => {
  const res = await axios.put<Application>(`${BASE}/${id}`, data);
  return res.data;
};

export const deleteApplication = async (id: number): Promise<void> => {
  await axios.delete(`${BASE}/${id}`);
};

export const analyzeResume = async (data: AnalyzeRequest): Promise<AnalyzeResponse> => {
  const res = await axios.post<AnalyzeResponse>(ANALYZE, data);
  return res.data;
};