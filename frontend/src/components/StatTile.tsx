import { Card } from './Card.js';

export function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
    </Card>
  );
}
