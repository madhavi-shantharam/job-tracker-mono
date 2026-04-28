type IngestionStatus = 'created' | 'duplicate' | 'skipped' | 'error';

interface Props {
  status: IngestionStatus;
}

const statusConfig: Record<IngestionStatus, { label: string; classes: string }> = {
  created:   { label: 'Imported',   classes: 'bg-green-100 text-green-800' },
  duplicate: { label: 'Duplicate',  classes: 'bg-yellow-100 text-yellow-800' },
  skipped:   { label: 'Skipped',    classes: 'bg-gray-100 text-gray-600' },
  error:     { label: 'Error',      classes: 'bg-red-100 text-red-800' },
};

export default function IngestionStatusBadge({ status }: Props) {
  const { label, classes } = statusConfig[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${classes}`}>
      {label}
    </span>
  );
}
