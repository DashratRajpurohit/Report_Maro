import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Problem } from '../schemas/index.js';
import { apiClient } from '../lib/apiClient.js';
import { Card } from '../components/Card.js';
import { PriorityBadge, StatusBadge } from '../components/Badge.js';

export default function ProblemList() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get('/problems', { params: { limit: 50 } })
      .then((res) => setProblems(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Reported problems</h1>
      {loading && <p className="text-sm text-slate-500">Loading…</p>}
      {!loading && problems.length === 0 && <p className="text-sm text-slate-500">No problems reported yet.</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        {problems.map((p) => (
          <Link key={p._id} to={`/problems/${p._id}`}>
            <Card className="h-full transition hover:border-brand-300">
              <h2 className="font-medium text-slate-900">{p.title}</h2>
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
