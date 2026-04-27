import { useCallback, useEffect, useRef, useState } from 'react';
import { getResumes, uploadResume, deleteResume } from '../api/resumes';
import type { Resume } from '../types/resume';
import { useToastContext } from '../context/ToastContext';

const MAX_RESUMES = 3;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const ALLOWED_EXTS  = ['.pdf', '.docx'];

export default function ResumesPage() {
  const { addToast } = useToastContext();
  const [resumes, setResumes]       = useState<Resume[]>([]);
  const [loading, setLoading]       = useState(true);
  const [uploading, setUploading]   = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [dragOver, setDragOver]     = useState(false);
  const [file, setFile]             = useState<File | null>(null);
  const [label, setLabel]           = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchResumes(); }, []);

  const fetchResumes = async () => {
    try {
      setLoading(true);
      setResumes(await getResumes());
    } catch {
      addToast('Failed to load resumes.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const validateFile = (f: File): string | null => {
    if (!ALLOWED_TYPES.includes(f.type) && !ALLOWED_EXTS.some(ext => f.name.toLowerCase().endsWith(ext))) {
      return 'Only PDF and DOCX files are accepted.';
    }
    if (f.size > MAX_FILE_SIZE) return 'File must be 5 MB or smaller.';
    return null;
  };

  const handleFileSelect = (f: File) => {
    const err = validateFile(f);
    if (err) { addToast(err, 'error'); return; }
    setFile(f);
    if (!label) setLabel(f.name.replace(/\.[^.]+$/, ''));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (limitReached) return;
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFileSelect(dropped);
  }, [resumes.length]);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const created = await uploadResume(file, label || file.name);
      setResumes(prev => [...prev, created]);
      setFile(null);
      setLabel('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      addToast('Resume uploaded successfully.', 'success');
    } catch (err: any) {
      addToast(err.userMessage ?? 'Upload failed. Please try again.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (resume: Resume) => {
    if (!window.confirm(`Delete "${resume.name}"?`)) return;
    setDeletingId(resume.id);
    try {
      await deleteResume(resume.id);
      setResumes(prev => prev.filter(r => r.id !== resume.id));
      addToast('Resume deleted.', 'success');
    } catch (err: any) {
      addToast(err.userMessage ?? 'Delete failed. Please try again.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const limitReached = resumes.length >= MAX_RESUMES;

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Resumes</h1>
        <p className="text-sm text-gray-500 mt-1">Upload and manage your resume files</p>
      </div>

      {/* Upload Zone */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Upload a Resume</h2>

        {limitReached ? (
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800 font-medium text-center">
            Resume limit reached ({resumes.length}/{MAX_RESUMES}) — delete one to upload another.
          </div>
        ) : (
          <>
            {/* Drop area */}
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                ${dragOver
                  ? 'border-indigo-400 bg-indigo-50'
                  : file
                    ? 'border-green-400 bg-green-50'
                    : 'border-gray-300 bg-gray-50 hover:border-indigo-300 hover:bg-indigo-50'
                }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden"
                onChange={handleInputChange}
              />
              {file ? (
                <>
                  <p className="text-2xl mb-2">📄</p>
                  <p className="text-sm font-medium text-green-700">{file.name}</p>
                  <p className="text-xs text-gray-400 mt-1">{(file.size / 1024).toFixed(0)} KB · Click to change</p>
                </>
              ) : (
                <>
                  <p className="text-3xl mb-2">📂</p>
                  <p className="text-sm font-medium text-gray-700">
                    Drag & drop a file, or <span className="text-indigo-600 underline">browse</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">PDF or DOCX · Max 5 MB</p>
                </>
              )}
            </div>

            {/* Label input */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Label <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={label}
                onChange={e => setLabel(e.target.value)}
                placeholder="e.g. Software Engineer Resume 2026"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Upload button */}
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="mt-4 bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium
                hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed
                flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  Uploading…
                </>
              ) : (
                'Upload Resume'
              )}
            </button>
          </>
        )}
      </div>

      {/* Resume list */}
      <div>
        <h2 className="text-base font-semibold text-gray-800 mb-4">
          Saved Resumes{' '}
          <span className="text-gray-400 font-normal text-sm">({resumes.length}/{MAX_RESUMES})</span>
        </h2>

        {loading ? (
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="animate-pulse h-20 bg-gray-200 rounded-xl" />
            ))}
          </div>
        ) : resumes.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
            <p className="text-3xl mb-3">📄</p>
            <p className="font-medium text-gray-900">No resumes yet</p>
            <p className="text-sm text-gray-500 mt-1">Upload your first resume above to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {resumes.map(resume => (
              <div
                key={resume.id}
                className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-center justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">{resume.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{resume.originalFileName}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Uploaded{' '}
                    {new Date(resume.uploadedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(resume)}
                  disabled={deletingId === resume.id}
                  className="ml-4 text-sm text-red-500 hover:text-red-700 font-medium
                    disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                >
                  {deletingId === resume.id ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
