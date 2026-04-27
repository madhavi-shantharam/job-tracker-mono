/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getApplications, deleteApplication } from '../api/applications';
import type { Application } from '../types';
import { useToastContext } from '../context/ToastContext';
import StatusBadge from '../components/StatusBadge';

export default function Dashboard() {
  const { addToast } = useToastContext();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [deletingId, setDeletingId]     = useState<number | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const data = await getApplications();
      setApplications(data);
    } catch (err) {
      setError('Failed to load applications. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, company: string) => {
    if (!window.confirm(`Delete application for ${company}?`)) return;
    setDeletingId(id);
    try {
      await deleteApplication(id);
      setApplications(prev => prev.filter(app => app.id !== id));
      addToast(`Application deleted.`, 'success');
    } catch {
      setError('Failed to delete. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  // --- Stats summary ---
  const stats = {
    total:     applications.length,
    active:    applications.filter(a => !['OFFER', 'REJECTED'].includes(a.status)).length,
    offers:    applications.filter(a => a.status === 'OFFER').length,
    rejected:  applications.filter(a => a.status === 'REJECTED').length,
  };

  if (loading) return <LoadingState />;
  if (error)   return <ErrorState message={error} onRetry={fetchApplications} />;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Applications</h1>
          <p className="text-sm text-gray-500 mt-1">Track your job search progress</p>
        </div>
        <Link
          to="/add"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          + Add Application
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total',    value: stats.total,    color: 'text-gray-900' },
          { label: 'Active',   value: stats.active,   color: 'text-indigo-600' },
          { label: 'Offers',   value: stats.offers,   color: 'text-green-600' },
          { label: 'Rejected', value: stats.rejected, color: 'text-red-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">{label}</p>
            <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      {applications.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Company', 'Role', 'Status', 'Applied Date', 'Notes', 'Actions'].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {applications.map(app => (
                <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{app.company}</td>
                  <td className="px-6 py-4 text-gray-600">{app.role}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={app.status} />
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {app.appliedDate
                      ? new Date(app.appliedDate).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric'
                        })
                      : '—'}
                  </td>
                  <td className="px-6 py-4 text-gray-500 max-w-xs truncate">
                    {app.notes || '—'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-3">
                      <Link
                        to={`/edit/${app.id}`}
                        className="text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(app.id, app.company)}
                        disabled={deletingId === app.id}
                        className="text-red-500 hover:text-red-700 font-medium disabled:opacity-40"
                      >
                        {deletingId === app.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// --- Sub-components ---

function LoadingState() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-xl" />
          ))}
        </div>
        <div className="h-64 bg-gray-200 rounded-xl" />
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
    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
      <p className="text-4xl mb-3">📋</p>
      <p className="text-gray-900 font-medium">No applications yet</p>
      <p className="text-gray-500 text-sm mt-1">Add your first job application to get started</p>
      <Link
        to="/add"
        className="inline-block mt-4 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
      >
        + Add Application
      </Link>
    </div>
  );
}