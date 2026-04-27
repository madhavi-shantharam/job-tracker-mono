import axios from 'axios';
import type { Resume } from '../types/resume';

const BASE = '/api/resumes';

export const getResumes = async (): Promise<Resume[]> => {
  const res = await axios.get<Resume[]>(BASE);
  return res.data;
};

export const uploadResume = async (file: File, name: string): Promise<Resume> => {
  const form = new FormData();
  form.append('file', file);
  form.append('name', name);
  const res = await axios.post<Resume>(BASE, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const deleteResume = async (id: string): Promise<void> => {
  await axios.delete(`${BASE}/${id}`);
};

export const getResumeContent = async (id: string): Promise<string> => {
  const res = await axios.get<string>(`${BASE}/${id}/content`);
  return res.data;
};
