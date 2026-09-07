import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import { Card } from '../components/Card.js';
import { Button } from '../components/Button.js';

export default function Home() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="mx-auto max-w-2xl text-center">
      <h1 className="text-3xl font-bold text-slate-900">Societal Innovation Portal</h1>
      <p className="mt-3 text-slate-600">
        Report a civic problem in Jharkhand — water, roads, schools, health, and more — and see it
        routed to a university team and funded by industry, in real time.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Link to="/problems">
          <Button variant="secondary">Browse problems</Button>
        </Link>
        {!user && (
          <Link to="/register">
            <Button>Get started</Button>
          </Link>
        )}
        {user?.role === 'CITIZEN' && (
          <Link to="/submit">
            <Button>Report a problem</Button>
          </Link>
        )}
      </div>
      <Card className="mt-10 text-left">
        <ol className="list-inside list-decimal space-y-2 text-sm text-slate-700">
          <li>Citizens report a problem with a photo and location.</li>
          <li>AI classifies it, scores priority, and flags duplicates.</li>
          <li>Admins route it to a capable university.</li>
          <li>Universities propose a scoped, budgeted solution.</li>
          <li>Industries fund the proposal — and the citizen sees it happen.</li>
        </ol>
      </Card>
    </div>
  );
}
