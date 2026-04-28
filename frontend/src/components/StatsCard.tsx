type CardColor = 'indigo' | 'green' | 'yellow' | 'red' | 'gray';

interface Props {
  label: string;
  value: number;
  color: CardColor;
}

const colorClasses: Record<CardColor, string> = {
  indigo: 'text-indigo-600',
  green:  'text-green-600',
  yellow: 'text-yellow-600',
  red:    'text-red-600',
  gray:   'text-gray-600',
};

export default function StatsCard({ label, value, color }: Props) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <p className={`text-3xl font-bold ${colorClasses[color]}`}>{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  );
}
