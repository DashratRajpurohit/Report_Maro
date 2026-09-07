import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { ProjectSummary } from '@sih/shared-types';
import { apiClient } from '../lib/apiClient.js';
import { Card } from '../components/Card.js';
import { Badge } from '../components/Badge.js';

export default function IndustryPortal() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);

  useEffect(() => {
    apiClient.get('/projects', { params: { pageSize: 30 } }).then((res) => setProjects(res.data.data));
  }, []);

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Fundable projects</h1>
      <div className="grid gap-3 sm:grid-cols-2">
        {projects.length === 0 && <p className="text-sm text-slate-500">No projects yet.</p>}
        {projects.map((p) => (
          <Link key={p.id} to={`/projects/${p.id}`}>
            <Card className="h-full transition hover:border-brand-300">
              <p className="font-medium">{p.title}</p>
              <p className="mt-1 text-xs text-slate-500">{p.university.name} · {p.category ?? 'Uncategorised'}</p>
              <div className="mt-3">
                <div className="h-2 w-full rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-brand-600" style={{ width: `${p.fundedPercent}%` }} />
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  ₹{p.fundedInr.toLocaleString('en-IN')} of ₹{p.budgetInr.toLocaleString('en-IN')} funded
                </p>
              </div>
              <div className="mt-2">
                <Badge tone={p.status === 'ACTIVE' ? 'green' : 'blue'}>{p.status.replace(/_/g, ' ')}</Badge>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
