import axios from 'axios';
import type { ApplicationStatus } from '../types';

const BASE = '/api/applications';

export interface ImportedApplication {
  id: number;
  company: string;
  role: string;
  status: ApplicationStatus;
  appliedDate: string | null;
  notes: string | null;
}

export interface IngestionStats {
  totalProcessed: number;
  created: number;
  duplicate: number;
  skipped: number;
  error: number;
}

export interface PollSummary {
  fetched: number;
  filtered: number;
  new: number;
  created: number;
  duplicate: number;
  skipped: number;
  errors: number;
  timestamp: string;
}

export const getImportedApplications = async (): Promise<ImportedApplication[]> => {
  const res = await axios.get<ImportedApplication[]>(BASE);
  return res.data
    .filter(app => app.notes?.includes('Auto-imported via Gmail'))
    .sort((a, b) => {
      if (!a.appliedDate) return 1;
      if (!b.appliedDate) return -1;
      return new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime();
    });
};

// Triggers a Gmail poll cycle via Spring Boot → Python subprocess.
// Errors propagate to the caller so the real failure reason can be shown.
export const triggerPollNow = async (): Promise<PollSummary> => {
  const res = await axios.post<PollSummary>('/api/email-import/poll');
  return res.data;
};

// Pure function — computes stats from the in-memory list.
// Duplicates/skips never reach the DB, so they are always 0 here.
export const getIngestionStats = (applications: ImportedApplication[]): IngestionStats => ({
  totalProcessed: applications.length,
  created: applications.length,
  duplicate: 0,
  skipped: 0,
  error: 0,
});
