import { useState } from 'react';
import { createProposalRequestSchema, type Assignment } from '@sih/shared-types';
import { apiClient, apiErrorMessage } from '../lib/apiClient.js';
import { Card } from './Card.js';
import { Button } from './Button.js';

export function ProposalForm({
  assignment,
  onClose,
  onSubmitted,
}: {
  assignment: Assignment;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [title, setTitle] = useState(`Solution for: ${assignment.problem.title}`);
  const [summary, setSummary] = useState('');
  const [approach, setApproach] = useState('');
  const [teamMemberName, setTeamMemberName] = useState('');
  const [teamMemberRole, setTeamMemberRole] = useState('');
  const [budgetInr, setBudgetInr] = useState(100000);
  const [timelineWeeks, setTimelineWeeks] = useState(8);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = createProposalRequestSchema.safeParse({
      assignmentId: assignment.id,
      title,
      summary,
      approach,
      teamMembers: teamMemberName ? [{ name: teamMemberName, role: teamMemberRole || 'Team member' }] : [],
      budgetInr,
      timelineWeeks,
      status: 'SUBMITTED',
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid input');
      return;
    }
    setLoading(true);
    try {
      await apiClient.post('/proposals', parsed.data);
      onSubmitted();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not submit proposal'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Proposal for: {assignment.problem.title}</h2>
        <button onClick={onClose} className="text-sm text-slate-400 hover:text-slate-700">
          Close
        </button>
      </div>
      <form onSubmit={handleSubmit} className="mt-3 space-y-3">
        <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Proposal title" />
        <textarea className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" rows={3} value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Summary (min 50 chars)" />
        <textarea className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" rows={4} value={approach} onChange={(e) => setApproach(e.target.value)} placeholder="Technical approach (min 50 chars)" />
        <div className="grid grid-cols-2 gap-3">
          <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" value={teamMemberName} onChange={(e) => setTeamMemberName(e.target.value)} placeholder="Team member name" />
          <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" value={teamMemberRole} onChange={(e) => setTeamMemberRole(e.target.value)} placeholder="Role (e.g. B.Tech CSE, 3rd year)" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input type="number" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" value={budgetInr} onChange={(e) => setBudgetInr(Number(e.target.value))} placeholder="Budget (INR)" />
          <input type="number" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" value={timelineWeeks} onChange={(e) => setTimelineWeeks(Number(e.target.value))} placeholder="Timeline (weeks)" />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Submitting…' : 'Submit proposal'}
        </Button>
      </form>
    </Card>
  );
}
