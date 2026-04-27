import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createApplication, getApplication, updateApplication } from '../api/applications';
import type { ApplicationRequest, ApplicationStatus } from '../types';
import { useApplicationForm } from '../hooks/useApplicationForm';
import { useToastContext } from '../context/ToastContext';
import FormField from '../components/FormField';

const STATUS_OPTIONS: { value: ApplicationStatus; label: string }[] = [
  { value: 'APPLIED',       label: 'Applied' },
  { value: 'PHONE_SCREEN',  label: 'Phone Screen' },
  { value: 'INTERVIEW',     label: 'Interview' },
  { value: 'OFFER',         label: 'Offer' },
  { value: 'REJECTED',      label: 'Rejected' },
];

export default function ApplicationForm() {
  // useParams reads the :id from the URL — undefined if we're on /add
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const isEditMode = Boolean(id);

  const { form, errors, handleChange, validate, populateForm } = useApplicationForm();

  const { addToast } = useToastContext();

  const [submitting, setSubmitting] = useState(false);
  const [loadingData, setLoadingData] = useState(isEditMode);
  const [serverError, setServerError] = useState<string | null>(null);

  // If we're in edit mode, fetch the existing application and pre-populate the form
  useEffect(() => {
    if (!isEditMode || !id) return;

    const fetchExisting = async () => {
      try {
        const app = await getApplication(Number(id));
        // Map the Application response back to an ApplicationRequest shape
        populateForm({
          company:            app.company,
          role:               app.role,
          status:             app.status,
          jobDescriptionText: app.jobDescriptionText ?? '',
          notes:              app.notes ?? '',
          appliedDate:        app.appliedDate ?? '',
        });
      } catch {
        setServerError('Could not load application. It may have been deleted.');
      } finally {
        setLoadingData(false);
      }
    };

    fetchExisting();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    // Prevent the browser's default form submission behavior (page reload)
    e.preventDefault();

    // Run frontend validation first — don't hit the backend if the form is invalid
    if (!validate()) return;

    setSubmitting(true);
    setServerError(null);

    try {
      const payload: ApplicationRequest = {
        ...form,
        // Send undefined instead of empty string for optional fields
        // so the backend receives null rather than ""
        appliedDate:        form.appliedDate        || undefined,
        jobDescriptionText: form.jobDescriptionText || undefined,
        notes:              form.notes              || undefined,
      };

      if (isEditMode && id) {
        await updateApplication(Number(id), payload);
      } else {
        await createApplication(payload);
      }

      // On success, navigate back to the dashboard
      const verb = isEditMode ? 'updated' : 'added';
      addToast(`Application ${verb} successfully!`, 'success');
      navigate('/');

    } catch (err: any) {
      // Show backend validation errors if present (400 response)
      const message = err?.response?.data?.message
        ?? 'Something went wrong. Please try again.';
      setServerError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingData) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">

      {/* Page header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/')}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-3"
        >
          ← Back to Dashboard
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditMode ? 'Edit Application' : 'Add Application'}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {isEditMode
            ? 'Update the details for this application'
            : 'Track a new job application'}
        </p>
      </div>

      {/* Server error banner */}
      {serverError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{serverError}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate>
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">

          {/* Company */}
          <FormField label="Company" required error={errors.company}>
            <input
              type="text"
              name="company"
              value={form.company}
              onChange={handleChange}
              placeholder="e.g. Expedia, Amazon, Microsoft"
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.company ? 'border-red-400' : 'border-gray-300'
              }`}
            />
          </FormField>

          {/* Role */}
          <FormField label="Role" required error={errors.role}>
            <input
              type="text"
              name="role"
              value={form.role}
              onChange={handleChange}
              placeholder="e.g. SDE II, Software Engineer"
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.role ? 'border-red-400' : 'border-gray-300'
              }`}
            />
          </FormField>

          {/* Status */}
          <FormField label="Status" required error={errors.status}>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </FormField>

          {/* Applied Date */}
          <FormField label="Applied Date">
            <input
              type="date"
              name="appliedDate"
              value={form.appliedDate ?? ''}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </FormField>

          {/* Notes */}
          <FormField label="Notes">
            <textarea
              name="notes"
              value={form.notes ?? ''}
              onChange={handleChange}
              rows={3}
              placeholder="Recruiter name, referral contact, interview details..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </FormField>

          {/* Job Description */}
          <FormField label="Job Description" >
            <textarea
              name="jobDescriptionText"
              value={form.jobDescriptionText ?? ''}
              onChange={handleChange}
              rows={6}
              placeholder="Paste the full job description here — used for AI resume analysis"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">
              💡 Paste the JD here to enable AI analysis on the Analyze page
            </p>
          </FormField>

        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting
              ? (isEditMode ? 'Saving...' : 'Adding...')
              : (isEditMode ? 'Save Changes' : 'Add Application')}
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-6 py-2.5 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}