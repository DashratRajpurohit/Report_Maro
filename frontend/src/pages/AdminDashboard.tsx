import { useEffect, useState } from 'react';
import type { Problem, StatsOverview, User } from '../schemas/index.js';
import { apiClient, apiErrorMessage } from '../lib/apiClient.js';
import { Card } from '../components/Card.js';
import { StatTile } from '../components/StatTile.js';
import { Button } from '../components/Button.js';
import { PriorityBadge, StatusBadge } from '../components/Badge.js';

export default function AdminDashboard() {
  const [stats, setStats] = useState<StatsOverview['data'] | null>(null);
  const [queue, setQueue] = useState<Problem[]>([]);
  const [universities, setUniversities] = useState<User[]>([]);
  const [selectedUniByProblem, setSelectedUniByProblem] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);

  const refresh = () => {
    apiClient.get('/problems/stats/dashboard').then((res) => setStats(res.data.data));
    apiClient.get('/problems', { params: { status: 'verified', limit: 20 } }).then((res) => setQueue(res.data.data));
    apiClient.get('/users', { params: { role: 'university' } }).then((res) => setUniversities(res.data.data));
  };

  useEffect(refresh, []);

  const assign = async (problemId: string) => {
    const universityId = selectedUniByProblem[problemId];
    if (!universityId) return;
    try {
      await apiClient.put(`/problems/${problemId}/assign`, { universityId });
      setMessage('Assigned.');
      refresh();
    } catch (err) {
      setMessage(apiErrorMessage(err, 'Could not assign'));
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold">Admin dashboard</h1>

      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="Total problems" value={stats.total} />
          <StatTile
            label="Pending verification"
            value={stats.byStatus.find((s) => s._id === 'submitted')?.count ?? 0}
          />
          <StatTile label="Assigned" value={stats.byStatus.find((s) => s._id === 'assigned')?.count ?? 0} />
          <StatTile label="Resolved" value={stats.byStatus.find((s) => s._id === 'resolved')?.count ?? 0} />
        </div>
      )}

      {message && <p className="text-sm text-brand-700">{message}</p>}

      <section>
        <h2 className="mb-3 text-lg font-medium">Verified problems awaiting assignment</h2>
        <div className="space-y-3">
          {queue.length === 0 && <p className="text-sm text-slate-500">Nothing waiting on assignment.</p>}
          {queue.map((p) => (
            <Card key={p._id} className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium">{p.title}</p>
                <div className="mt-1 flex gap-2">
                  <StatusBadge status={p.status} />
                  <PriorityBadge priority={p.priority} />
                  <span className="text-xs text-slate-400">{p.location.district}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                  value={selectedUniByProblem[p._id] ?? ''}
                  onChange={(e) => setSelectedUniByProblem((s) => ({ ...s, [p._id]: e.target.value }))}
                >
                  <option value="">Assign to…</option>
                  {universities.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name} {u.organization ? `(${u.organization})` : ''}
                    </option>
                  ))}
                </select>
                <Button onClick={() => assign(p._id)} disabled={!selectedUniByProblem[p._id]}>
                  Assign
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
