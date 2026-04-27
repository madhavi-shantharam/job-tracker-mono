import type { ApplicationStatus } from '../types';

interface Props {
  status: ApplicationStatus;
}

const statusConfig: Record<ApplicationStatus, { label: string; classes: string }> = {
  APPLIED:      { label: 'Applied',       classes: 'bg-blue-100 text-blue-800' },
  PHONE_SCREEN: { label: 'Phone Screen',  classes: 'bg-yellow-100 text-yellow-800' },
  INTERVIEW:    { label: 'Interview',     classes: 'bg-purple-100 text-purple-800' },
  OFFER:        { label: 'Offer',         classes: 'bg-green-100 text-green-800' },
  REJECTED:     { label: 'Rejected',      classes: 'bg-red-100 text-red-800' },
};

export default function StatusBadge({ status }: Props) {
  const { label, classes } = statusConfig[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${classes}`}>
      {label}
    </span>
  );
}