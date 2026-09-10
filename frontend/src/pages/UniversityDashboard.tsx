import { useEffect, useState } from 'react';
import type { Project } from '../schemas/index.js';
import { apiClient } from '../lib/apiClient.js';
import { useAuthStore } from '../store/authStore.js';
import { Card } from '../components/Card.js';
import { Button } from '../components/Button.js';
import { ProposalForm } from '../components/ProposalForm.js';

const STATUS_LABEL: Record<Project['status'], string> = {
  proposed: 'Awaiting your proposal',
  under_review: 'Proposal under review',
  active: 'Funded — active',
  completed: 'Completed',
};

export default function UniversityDashboard() {
  const user = useAuthStore((s) => s.user);
  const [projects, setProjects] = useState<Project[]>([]);
  const [proposalFor, setProposalFor] = useState<Project | null>(null);

  const refresh = () => {
    if (!user) return;
    apiClient.get('/projects', { params: { university_id: user.id } }).then((res) => setProjects(res.data.data));
  };

  useEffect(refresh, [user]);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">University dashboard</h1>
      <div className="space-y-3">
        {projects.length === 0 && <p className="text-sm text-slate-500">No problems assigned to your organization yet.</p>}
        {projects.map((p) => (
          <Card key={p._id}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium">Problem #{p.problem_id}</p>
                <p className="text-xs text-slate-500">{STATUS_LABEL[p.status]}</p>
              </div>
              {p.status === 'proposed' && <Button onClick={() => setProposalFor(p)}>Submit proposal</Button>}
            </div>
          </Card>
        ))}
      </div>

      {proposalFor && (
        <ProposalForm
          projectId={proposalFor._id}
          onClose={() => setProposalFor(null)}
          onSubmitted={() => {
            setProposalFor(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}
