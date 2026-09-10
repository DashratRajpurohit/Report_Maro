import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Project } from '../schemas/index.js';
import { apiClient } from '../lib/apiClient.js';
import { Card } from '../components/Card.js';
import { Badge } from '../components/Badge.js';

export default function IndustryPortal() {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    apiClient.get('/projects', { params: { status: 'under_review' } }).then((res) => setProjects(res.data.data));
  }, []);

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Projects seeking funding</h1>
      {projects.length === 0 && <p className="text-sm text-slate-500">No projects currently under review.</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        {projects.map((p) => (
          <Link key={p._id} to={`/projects/${p._id}`}>
            <Card className="h-full transition hover:border-brand-300">
              <p className="text-xs text-slate-400">Problem #{p.problem_id}</p>
              <p className="mt-1 text-sm text-slate-700">{p.proposal_text.slice(0, 140)}…</p>
              <div className="mt-3 flex items-center justify-between">
                <Badge tone="blue">₹{(p.budget ?? 0).toLocaleString('en-IN')} requested</Badge>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
