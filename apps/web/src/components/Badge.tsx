import { clsx } from 'clsx';

const TONE_CLASSES: Record<string, string> = {
  neutral: 'bg-slate-100 text-slate-700',
  blue: 'bg-blue-100 text-blue-800',
  green: 'bg-green-100 text-green-800',
  amber: 'bg-amber-100 text-amber-800',
  red: 'bg-red-100 text-red-800',
  purple: 'bg-purple-100 text-purple-800',
};

export function Badge({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: keyof typeof TONE_CLASSES }) {
  return (
    <span className={clsx('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', TONE_CLASSES[tone])}>
      {children}
    </span>
  );
}

const PRIORITY_TONE: Record<string, keyof typeof TONE_CLASSES> = {
  LOW: 'neutral',
  MEDIUM: 'blue',
  HIGH: 'amber',
  CRITICAL: 'red',
};

export function PriorityBadge({ priority }: { priority: string | null }) {
  if (!priority) return <Badge tone="neutral">Analysing…</Badge>;
  return <Badge tone={PRIORITY_TONE[priority] ?? 'neutral'}>{priority}</Badge>;
}

const STATUS_TONE: Record<string, keyof typeof TONE_CLASSES> = {
  SUBMITTED: 'neutral',
  PROCESSING: 'neutral',
  TRIAGED: 'blue',
  DUPLICATE: 'purple',
  ASSIGNED: 'amber',
  IN_PROGRESS: 'amber',
  RESOLVED: 'green',
  REJECTED: 'red',
};

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={STATUS_TONE[status] ?? 'neutral'}>{status.replace(/_/g, ' ')}</Badge>;
}
