import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import { Card } from '../components/Card.js';
import { Button } from '../components/Button.js';

export default function Home() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="mx-auto max-w-2xl text-center">
      <h1 className="text-2xl font-semibold">Societal Innovation Portal</h1>
      <p className="mt-2 text-slate-600">
        Report civic problems in Jharkhand — water, roads, schools, hospitals — and track them through
        AI triage, university-led solutions, and industry funding.
      </p>
      <Card className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        {user?.role === 'citizen' && (
          <Link to="/submit">
            <Button>Report a problem</Button>
          </Link>
        )}
        <Link to="/problems">
          <Button variant="secondary">Browse reported problems</Button>
        </Link>
        {!user && (
          <Link to="/register">
            <Button variant="ghost">Create an account</Button>
          </Link>
        )}
      </Card>
    </div>
  );
}
