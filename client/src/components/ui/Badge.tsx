import clsx from 'clsx';
import { BookingStatus } from '../../types';

interface BadgeProps {
  status: BookingStatus;
}

const styles: Record<BookingStatus, string> = {
  CONFIRMED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  COMPLETED: 'bg-blue-100 text-blue-700',
  NO_SHOW: 'bg-gray-100 text-gray-600',
};

export default function Badge({ status }: BadgeProps) {
  return (
    <span className={clsx('inline-block rounded-full px-2.5 py-0.5 text-xs font-medium', styles[status])}>
      {status.replace('_', ' ')}
    </span>
  );
}
