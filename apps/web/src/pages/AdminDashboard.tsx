import { useEffect, useState } from 'react';
import type { Organization, ProblemSummary, Proposal, StatsOverview } from '@sih/shared-types';
import { apiClient, apiErrorMessage } from '../lib/apiClient.js';
import { Card } from '../components/Card.js';
import { StatTile } from '../components/StatTile.js';
import { Button } from '../components/Button.js';
import { PriorityBadge, StatusBadge } from '../components/Badge.js';

export default function AdminDashboard() {
  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [queue, setQueue] = useState<ProblemSummary[]>([]);
  const [universities, setUniversities] = useState<Organization[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [selectedUniByProblem, setSelectedUniByProblem] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);

  const refresh = () => {
    apiClient.get('/stats/overview').then((res) => setStats(res.data.data));
    apiClient
      .get('/problems', { params: { status: 'TRIAGED', sort: 'priority', pageSize: 20 } })
      .then((res) => setQueue(res.data.data));
    apiClient.get('/organizations', { params: { type: 'UNIVERSITY', pageSize: 50 } }).then((res) => setUniversities(res.data.data));
    apiClient.get('/proposals', { params: { status: 'SUBMITTED', pageSize: 20 } }).then((res) => setProposals(res.data.data));
  };

  useEffect(refresh, []);

  const assign = async (problemId: string) => {
    const universityId = selectedUniByProblem[problemId];
    if (!universityId) return;
    try {
      await apiClient.post('/assignments', { problemId, universityId });
      setMessage('Assigned.');
      refresh();
    } catch (err) {
      setMessage(apiErrorMessage(err, 'Could not assign'));
    }
  };

  const review = async (proposalId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await apiClient.patch(`/proposals/${proposalId}/review`, { status });
      refresh();
    } catch (err) {
      setMessage(apiErrorMessage(err, 'Could not review proposal'));
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold">Admin dashboard</h1>

      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="Total problems" value={stats.totals.problems} />
          <StatTile label="Pending triage" value={stats.totals.pendingTriage} />
          <StatTile label="Resolved" value={stats.totals.resolved} />
          <StatTile label="Funded (₹)" value={stats.totals.fundedInr.toLocaleString('en-IN')} />
        </div>
      )}

      {message && <p className="text-sm text-brand-700">{message}</p>}

      <section>
        <h2 className="mb-3 text-lg font-medium">Triage queue</h2>
        <div className="space-y-3">
          {queue.length === 0 && <p className="text-sm text-slate-500">Nothing waiting on triage.</p>}
          {queue.map((p) => (
            <Card key={p.id} className="flex items-center justify-between gap-4">
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
                  value={selectedUniByProblem[p.id] ?? ''}
                  onChange={(e) => setSelectedUniByProblem((s) => ({ ...s, [p.id]: e.target.value }))}
                >
                  <option value="">Assign to…</option>
                  {universities.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
                <Button onClick={() => assign(p.id)} disabled={!selectedUniByProblem[p.id]}>
                  Assign
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">Proposals to review</h2>
        <div className="space-y-3">
          {proposals.length === 0 && <p className="text-sm text-slate-500">No proposals waiting for review.</p>}
          {proposals.map((p) => (
            <Card key={p.id}>
              <p className="font-medium">{p.title}</p>
              <p className="text-xs text-slate-500">{p.university.name} · ₹{p.budgetInr.toLocaleString('en-IN')} · {p.timelineWeeks} weeks</p>
              <p className="mt-2 text-sm text-slate-700">{p.summary}</p>
              <div className="mt-3 flex gap-2">
                <Button onClick={() => review(p.id, 'APPROVED')}>Approve</Button>
                <Button variant="danger" onClick={() => review(p.id, 'REJECTED')}>
                  Reject
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
