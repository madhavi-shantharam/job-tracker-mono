import type { AnalyzeResponse } from '../types';
import ProgressBar from './ProgressBar';

interface Props {
  results: AnalyzeResponse;
  company?: string;
}

export default function AnalysisResults({ results, company }: Props) {
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          AI Analysis Results
          {company && (
            <span className="text-gray-400 font-normal ml-2">— {company}</span>
          )}
        </h2>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
          Powered by Claude
        </span>
      </div>

      {/* Match score */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <ProgressBar percentage={results.matchPercentage} />
        <p className="mt-4 text-sm text-gray-600 italic border-t border-gray-100 pt-4">
          "{results.summary}"
        </p>
      </div>

      {/* Missing keywords */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <span className="text-red-500">⚠</span>
          Missing Keywords
          <span className="ml-auto text-xs font-normal text-gray-400">
            {results.missingKeywords.length} gaps found
          </span>
        </h3>
        {results.missingKeywords.length === 0 ? (
          <p className="text-sm text-green-600">
            No missing keywords — great alignment!
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {results.missingKeywords.map((keyword, i) => (
              <span
                key={i}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100"
              >
                {keyword}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Suggested edits */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <span className="text-indigo-500">✏</span>
          Suggested Resume Edits
          <span className="ml-auto text-xs font-normal text-gray-400">
            {results.suggestedEdits.length} suggestions
          </span>
        </h3>
        {results.suggestedEdits.length === 0 ? (
          <p className="text-sm text-green-600">No edits needed — resume looks great!</p>
        ) : (
          <ol className="space-y-3">
            {results.suggestedEdits.map((edit, i) => (
              <li key={i} className="flex gap-3 text-sm text-gray-700">
                <span className="flex-shrink-0 w-5 h-5 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-bold">
                  {i + 1}
                </span>
                <span>{edit}</span>
              </li>
            ))}
          </ol>
        )}
      </div>

    </div>
  );
}