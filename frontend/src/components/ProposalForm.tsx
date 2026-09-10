import { useState } from 'react';
import { submitProposalRequestSchema } from '../schemas/index.js';
import { apiClient, apiErrorMessage } from '../lib/apiClient.js';
import { Card } from './Card.js';
import { Button } from './Button.js';

export function ProposalForm({ projectId, onClose, onSubmitted }: { projectId: string; onClose: () => void; onSubmitted: () => void }) {
  const [proposalText, setProposalText] = useState('');
  const [budget, setBudget] = useState(100000);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = submitProposalRequestSchema.safeParse({ proposal_text: proposalText, budget });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid input');
      return;
    }
    setLoading(true);
    try {
      await apiClient.post(`/projects/${projectId}/proposal`, parsed.data);
      onSubmitted();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not submit proposal'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <h3 className="font-medium">Submit a proposal</h3>
      <form onSubmit={handleSubmit} className="mt-3 space-y-3">
        <textarea
          placeholder="Describe your proposed solution, team, and timeline"
          rows={4}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          value={proposalText}
          onChange={(e) => setProposalText(e.target.value)}
        />
        <input
          type="number"
          placeholder="Budget (INR)"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          value={budget}
          onChange={(e) => setBudget(Number(e.target.value))}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>
            {loading ? 'Submitting…' : 'Submit proposal'}
          </Button>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
