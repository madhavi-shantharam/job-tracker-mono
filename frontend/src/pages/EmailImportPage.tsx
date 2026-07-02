import { useEffect, useState } from 'react';
import axios from 'axios';
import { getImportedApplications, triggerPollNow, getIngestionStats } from '../api/emailImport';
import type { ImportedApplication } from '../api/emailImport';
import StatusBadge from '../components/StatusBadge';
import StatsCard from '../components/StatsCard';

// ── Helpers ────────────────────────────────────────────────────────────────

function extractAts(notes: string | null): string {
  return notes?.match(/ATS: ([^.]+)/)?.[1]?.trim() ?? 'Unknown';
}

function extractConfidence(notes: string | null): number {
  const match = notes?.match(/Confidence: ([\d.]+)/);
  return match ? parseFloat(match[1]) : 0;
}

function confidenceColor(c: number): string {
  if (c >= 0.9)  return 'text-green-600';
  if (c >= 0.75) return 'text-yellow-600';
  return 'text-red-600';
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function EmailImportPage() {
  const [applications, setApplications] = useState<ImportedApplication[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [polling,      setPolling]      = useState(false);
  const [pollMessage,  setPollMessage]  = useState<string | null>(null);

  useEffect(() => { fetchApplications(); }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getImportedApplications();
      setApplications(data);
    } catch {
      setError('Failed to load imported applications. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const handlePollNow = async () => {
    setPolling(true);
    setPollMessage(null);
    try {
      const summary = await triggerPollNow();
      setPollMessage(
        `Poll complete: ${summary.created} created, ${summary.duplicate} duplicate, ${summary.skipped} skipped.`
      );
      await fetchApplications();
    } catch (err) {
      const backendMessage = axios.isAxiosError(err) ? err.response?.data?.message : undefined;
      setPollMessage(backendMessage ?? 'Failed to trigger poll.');
    } finally {
      setPolling(false);
    }
  };

  const stats = getIngestionStats(applications);

  if (loading) return <LoadingState />;
  if (error)   return <ErrorState message={error} onRetry={fetchApplications} />;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📧 Email Import</h1>
          <p className="text-sm text-gray-500 mt-1">
            Applications automatically imported from Gmail confirmation emails
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <button
            onClick={handlePollNow}
            disabled={polling}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            {polling ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Polling…
              </>
            ) : (
              'Poll Now'
            )}
          </button>
          {pollMessage && (
            <p className="text-sm text-gray-500 text-right max-w-xs">{pollMessage}</p>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatsCard label="Total Imported" value={stats.totalProcessed} color="indigo" />
        <StatsCard label="Created"        value={stats.created}        color="green"  />
        <StatsCard label="Duplicates"     value={stats.duplicate}      color="yellow" />
        <StatsCard label="Errors"         value={stats.error}          color="red"    />
      </div>

      {/* Table or Empty State */}
      {applications.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Company', 'Role', 'Status', 'ATS Source', 'Date Imported', 'Confidence'].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {applications.map(app => {
                const confidence = extractConfidence(app.notes);
                return (
                  <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{app.company}</td>
                    <td className="px-6 py-4 text-gray-600">{app.role}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="px-6 py-4 text-gray-500">{extractAts(app.notes)}</td>
                    <td className="px-6 py-4 text-gray-500">{formatDate(app.appliedDate)}</td>
                    <td className={`px-6 py-4 font-medium ${confidenceColor(confidence)}`}>
                      {confidence > 0 ? `${Math.round(confidence * 100)}%` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-64" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded-lg" />)}
        </div>
        <div className="h-64 bg-gray-200 rounded-lg" />
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-700 font-medium">{message}</p>
        <button
          onClick={onRetry}
          className="mt-3 text-sm text-red-600 underline hover:text-red-800"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-12 text-center">
      <p className="text-4xl mb-3">📭</p>
      <p className="text-gray-500 font-medium">No imported applications yet</p>
      <p className="text-sm text-gray-400 mt-1">
        Run the Gmail poller to auto-import confirmation emails
      </p>
    </div>
  );
}
