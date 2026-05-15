import type { GuardStatus } from '../types';

const config: Record<GuardStatus, { label: string; classes: string }> = {
  active:  { label: '🟢 Active',  classes: 'bg-green-500/10 text-green-400'  },
  delayed: { label: '🟡 Delayed', classes: 'bg-yellow-500/10 text-yellow-400'},
  offline: { label: '🔴 Offline', classes: 'bg-red-500/10 text-red-400'      },
};

export default function StatusBadge({ status }: { status: GuardStatus }) {
  const { label, classes } = config[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${classes}`}>
      {label}
    </span>
  );
}
