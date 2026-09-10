import { clsx } from 'clsx';
import type { Priority, ProblemStatus } from '../schemas/index.js';

const TONE_CLASSES = {
  neutral: 'bg-slate-100 text-slate-700',
  blue: 'bg-blue-100 text-blue-800',
  green: 'bg-green-100 text-green-800',
  amber: 'bg-amber-100 text-amber-800',
  red: 'bg-red-100 text-red-800',
  purple: 'bg-purple-100 text-purple-800',
} as const;

export function Badge({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: keyof typeof TONE_CLASSES }) {
  return <span className={clsx('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', TONE_CLASSES[tone])}>{children}</span>;
}

const PRIORITY_TONE: Record<Priority, keyof typeof TONE_CLASSES> = { low: 'neutral', medium: 'blue', high: 'red' };
export function PriorityBadge({ priority }: { priority: Priority }) {
  return <Badge tone={PRIORITY_TONE[priority]}>{priority.toUpperCase()}</Badge>;
}

const STATUS_TONE: Record<ProblemStatus, keyof typeof TONE_CLASSES> = {
  submitted: 'neutral',
  verified: 'blue',
  assigned: 'amber',
  in_progress: 'amber',
  resolved: 'green',
};
export function StatusBadge({ status }: { status: ProblemStatus }) {
  return <Badge tone={STATUS_TONE[status]}>{status.replace(/_/g, ' ')}</Badge>;
}
