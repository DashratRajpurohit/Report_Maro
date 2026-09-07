import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { SOCKET_EVENTS, createFundingRequestSchema, type Project } from '@sih/shared-types';
import { apiClient, apiErrorMessage } from '../lib/apiClient.js';
import { getSocket } from '../lib/socket.js';
import { useAuthStore } from '../store/authStore.js';
import { Card } from '../components/Card.js';
import { Button } from '../components/Button.js';
import { Badge } from '../components/Badge.js';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const [project, setProject] = useState<Project | null>(null);
  const [amount, setAmount] = useState(50000);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    if (!id) return;
    apiClient.get(`/projects/${id}`).then((res) => setProject(res.data.data));
  };

  useEffect(() => {
    load();
    const socket = getSocket();
    const onFunded = (payload: { projectId: string }) => {
      if (payload.projectId === id) load();
    };
    socket?.on(SOCKET_EVENTS.PROJECT_FUNDED, onFunded);
    return () => {
      socket?.off(SOCKET_EVENTS.PROJECT_FUNDED, onFunded);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fund = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = createFundingRequestSchema.safeParse({ amountInr: amount });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid amount');
      return;
    }
    try {
      await apiClient.post(`/projects/${id}/fundings`, parsed.data);
      load();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not submit pledge'));
    }
  };

  if (!project) return <p className="text-sm text-slate-500">Loading…</p>;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Card>
        <div className="flex items-start justify-between">
          <h1 className="text-xl font-semibold">{project.title}</h1>
          <Badge tone={project.status === 'ACTIVE' ? 'green' : 'blue'}>{project.status.replace(/_/g, ' ')}</Badge>
        </div>
        <p className="mt-2 text-sm text-slate-700">{project.summary}</p>
        <p className="mt-2 text-xs text-slate-500">
          {project.university.name} · {project.timelineWeeks} weeks
        </p>
        <div className="mt-4">
          <div className="h-2 w-full rounded-full bg-slate-100">
            <div className="h-2 rounded-full bg-brand-600" style={{ width: `${project.fundedPercent}%` }} />
          </div>
          <p className="mt-1 text-sm text-slate-600">
            ₹{project.fundedInr.toLocaleString('en-IN')} of ₹{project.budgetInr.toLocaleString('en-IN')} funded
          </p>
        </div>

        {user?.role === 'INDUSTRY' && project.status !== 'COMPLETED' && project.status !== 'CANCELLED' && (
          <form onSubmit={fund} className="mt-4 flex gap-2">
            <input
              type="number"
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
            <Button type="submit">Pledge funding</Button>
          </form>
        )}
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </Card>

      <Card>
        <h2 className="text-sm font-medium text-slate-700">Funding ledger</h2>
        <div className="mt-2 space-y-2">
          {project.fundings.length === 0 && <p className="text-sm text-slate-500">No pledges yet.</p>}
          {project.fundings.map((f) => (
            <div key={f.id} className="flex justify-between text-sm">
              <span>{f.industry.name}</span>
              <span>₹{f.amountInr.toLocaleString('en-IN')}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
