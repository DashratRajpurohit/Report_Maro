import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { Problem } from '../schemas/index.js';
import { apiClient } from '../lib/apiClient.js';
import { Card } from '../components/Card.js';
import { PriorityBadge, StatusBadge } from '../components/Badge.js';

function reporterName(submitted_by: Problem['submitted_by']): string {
  return typeof submitted_by === 'string' ? submitted_by : (submitted_by.full_name ?? 'Unknown');
}

export default function ProblemDetail() {
  const { id } = useParams<{ id: string }>();
  const [problem, setProblem] = useState<Problem | null>(null);

  useEffect(() => {
    if (!id) return;
    apiClient.get(`/problems/${id}`).then((res) => setProblem(res.data.data));
  }, [id]);

  if (!problem) return <p className="text-sm text-slate-500">Loading…</p>;

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-xl font-semibold">{problem.title}</h1>
          <div className="flex shrink-0 gap-2">
            <StatusBadge status={problem.status} />
            <PriorityBadge priority={problem.priority} />
          </div>
        </div>
        <p className="mt-3 text-sm text-slate-700">{problem.description}</p>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-slate-400">District</dt>
            <dd>{problem.location.district}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Category</dt>
            <dd>{problem.category ?? 'Analysing…'}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Reported by</dt>
            <dd>{reporterName(problem.submitted_by)}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Reported on</dt>
            <dd>{new Date(problem.created_at).toLocaleDateString('en-IN')}</dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}
