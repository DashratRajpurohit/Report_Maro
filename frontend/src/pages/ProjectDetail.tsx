import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fundProjectRequestSchema, type Project } from '../schemas/index.js';
import { apiClient, apiErrorMessage } from '../lib/apiClient.js';
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
  const [loading, setLoading] = useState(false);

  const refresh = () => {
    if (!id) return;
    apiClient.get(`/projects/${id}`).then((res) => setProject(res.data.data));
  };

  useEffect(refresh, [id]);

  const fund = async () => {
    if (!id) return;
    setError(null);
    const parsed = fundProjectRequestSchema.safeParse({ amount });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid amount');
      return;
    }
    setLoading(true);
    try {
      await apiClient.put(`/projects/${id}/fund`, parsed.data);
      refresh();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not fund project'));
    } finally {
      setLoading(false);
    }
  };

  if (!project) return <p className="text-sm text-slate-500">Loading…</p>;

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-xl font-semibold">Problem #{project.problem_id}</h1>
          <Badge tone="blue">{project.status.replace(/_/g, ' ')}</Badge>
        </div>
        <p className="mt-3 text-sm text-slate-700">{project.proposal_text}</p>
        <p className="mt-3 text-sm">
          <span className="text-slate-400">Budget:</span> ₹{(project.budget ?? 0).toLocaleString('en-IN')}
        </p>

        {user?.role === 'industry' && (project.status === 'under_review' || project.status === 'proposed') && (
          <div className="mt-4 flex items-end gap-2">
            <input
              type="number"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
            <Button onClick={fund} disabled={loading}>
              {loading ? 'Funding…' : 'Fund this project'}
            </Button>
          </div>
        )}
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </Card>
    </div>
  );
}
