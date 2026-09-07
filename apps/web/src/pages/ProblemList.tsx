import { useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import type { ProblemSummary } from '@sih/shared-types';
import { apiClient } from '../lib/apiClient.js';
import { Card } from '../components/Card.js';
import { PriorityBadge, StatusBadge } from '../components/Badge.js';

export default function ProblemList() {
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const [problems, setProblems] = useState<ProblemSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // /my-reports is a dedicated route (see App.tsx) that reuses this component
  // scoped to the signed-in citizen's own submissions.
  const mine = location.pathname === '/my-reports' || params.get('mine') === 'true';

  useEffect(() => {
    setLoading(true);
    apiClient
      .get('/problems', { params: { pageSize: 50, sort: 'newest', mine: mine || undefined } })
      .then((res) => setProblems(res.data.data))
      .finally(() => setLoading(false));
  }, [mine]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">{mine ? 'My reports' : 'Reported problems'}</h1>
        {!mine && (
          <button className="text-sm text-brand-600 hover:underline" onClick={() => setParams({ mine: 'true' })}>
            Show only mine
          </button>
        )}
      </div>
      {loading && <p className="text-sm text-slate-500">Loading…</p>}
      {!loading && problems.length === 0 && <p className="text-sm text-slate-500">No problems reported yet.</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        {problems.map((p) => (
          <Link key={p.id} to={`/problems/${p.id}`}>
            <Card className="h-full transition hover:border-brand-300">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-medium text-slate-900">{p.title}</h2>
              </div>
              <p className="mt-1 text-xs text-slate-500">{p.location.district}</p>
              <div className="mt-3 flex gap-2">
                <StatusBadge status={p.status} />
                <PriorityBadge priority={p.priority} />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
