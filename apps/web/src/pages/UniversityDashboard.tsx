import { useEffect, useState } from 'react';
import type { Assignment } from '@sih/shared-types';
import { apiClient, apiErrorMessage } from '../lib/apiClient.js';
import { Card } from '../components/Card.js';
import { Button } from '../components/Button.js';
import { StatusBadge } from '../components/Badge.js';
import { ProposalForm } from '../components/ProposalForm.js';

export default function UniversityDashboard() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [proposalFor, setProposalFor] = useState<Assignment | null>(null);

  const refresh = () => {
    apiClient.get('/assignments', { params: { mine: true, pageSize: 30 } }).then((res) => setAssignments(res.data.data));
  };

  useEffect(refresh, []);

  const respond = async (id: string, status: 'ACCEPTED' | 'DECLINED') => {
    const reason = status === 'DECLINED' ? window.prompt('Reason for declining?') ?? undefined : undefined;
    if (status === 'DECLINED' && !reason) return;
    try {
      await apiClient.patch(`/assignments/${id}`, { status, reason });
      refresh();
    } catch (err) {
      setMessage(apiErrorMessage(err, 'Could not update assignment'));
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">University dashboard</h1>
      {message && <p className="text-sm text-red-600">{message}</p>}
      <div className="space-y-3">
        {assignments.length === 0 && <p className="text-sm text-slate-500">No problems assigned yet.</p>}
        {assignments.map((a) => (
          <Card key={a.id}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium">{a.problem.title}</p>
                <div className="mt-1 flex gap-2">
                  <StatusBadge status={a.status} />
                  <span className="text-xs text-slate-400">{a.problem.location.district}</span>
                </div>
              </div>
              {a.status === 'PENDING' && (
                <div className="flex shrink-0 gap-2">
                  <Button onClick={() => respond(a.id, 'ACCEPTED')}>Accept</Button>
                  <Button variant="danger" onClick={() => respond(a.id, 'DECLINED')}>
                    Decline
                  </Button>
                </div>
              )}
              {a.status === 'ACCEPTED' && !a.proposalId && (
                <Button onClick={() => setProposalFor(a)}>Submit proposal</Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {proposalFor && (
        <ProposalForm
          assignment={proposalFor}
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
