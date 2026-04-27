interface Props {
  percentage: number;
}

function getColor(pct: number): string {
  if (pct >= 75) return 'bg-green-500';
  if (pct >= 50) return 'bg-yellow-500';
  return 'bg-red-500';
}

export default function ProgressBar({ percentage }: Props) {
  const color = getColor(percentage);
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-gray-700">Match Score</span>
        <span className={`text-2xl font-bold ${
          percentage >= 75 ? 'text-green-600' :
          percentage >= 50 ? 'text-yellow-600' : 'text-red-600'
        }`}>
          {percentage}%
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className={`h-3 rounded-full transition-all duration-700 ease-out ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-gray-500 mt-1">
        {percentage >= 75
          ? '✅ Strong match — apply with confidence'
          : percentage >= 50
          ? '⚠️ Moderate match — consider tailoring your resume'
          : '❌ Weak match — significant gaps to address'}
      </p>
    </div>
  );
}