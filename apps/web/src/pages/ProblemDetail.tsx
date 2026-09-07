import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { SOCKET_EVENTS, type Problem } from '@sih/shared-types';
import { apiClient } from '../lib/apiClient.js';
import { getSocket } from '../lib/socket.js';
import { Card } from '../components/Card.js';
import { PriorityBadge, StatusBadge } from '../components/Badge.js';

export default function ProblemDetail() {
  const { id } = useParams<{ id: string }>();
  const [problem, setProblem] = useState<Problem | null>(null);

  useEffect(() => {
    if (!id) return;
    apiClient.get(`/problems/${id}`).then((res) => setProblem(res.data.data));

    const socket = getSocket();
    socket?.emit('subscribe:problem', id);
    const onAnalyzed = (payload: { problemId: string }) => {
      if (payload.problemId === id) apiClient.get(`/problems/${id}`).then((res) => setProblem(res.data.data));
    };
    const onStatusChanged = onAnalyzed;
    socket?.on(SOCKET_EVENTS.PROBLEM_ANALYZED, onAnalyzed);
    socket?.on(SOCKET_EVENTS.PROBLEM_STATUS_CHANGED, onStatusChanged);

    return () => {
      socket?.emit('unsubscribe:problem', id);
      socket?.off(SOCKET_EVENTS.PROBLEM_ANALYZED, onAnalyzed);
      socket?.off(SOCKET_EVENTS.PROBLEM_STATUS_CHANGED, onStatusChanged);
    };
  }, [id]);

  if (!problem) return <p className="text-sm text-slate-500">Loading…</p>;

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-xl font-semibold">{problem.title}</h1>
          <div className="flex shrink-0 gap-2">
            <StatusBadge status={problem.status} />
            <PriorityBadge priority={problem.priority} />
          </div>
        </div>
        <p className="mt-3 text-sm text-slate-700">{problem.description}</p>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-slate-400">District</dt>
            <dd>{problem.location.district}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Category</dt>
            <dd>{problem.analysis?.category ?? 'Analysing…'}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Reported by</dt>
            <dd>{problem.reporter.name}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Reported on</dt>
            <dd>{new Date(problem.createdAt).toLocaleDateString('en-IN')}</dd>
          </div>
        </dl>
        {problem.analysis?.duplicateOfId && (
          <p className="mt-4 rounded-lg bg-purple-50 p-3 text-sm text-purple-800">
            This looks similar to an existing report (similarity{' '}
            {Math.round((problem.analysis.similarityScore ?? 0) * 100)}%).
          </p>
        )}
      </Card>
    </div>
  );
}
