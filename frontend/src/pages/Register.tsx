import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerRequestSchema, type UserRole } from '../schemas/index.js';
import { apiClient, apiErrorMessage } from '../lib/apiClient.js';
import { useAuthStore } from '../store/authStore.js';
import { Card } from '../components/Card.js';
import { Button } from '../components/Button.js';

export default function Register() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [role, setRole] = useState<UserRole>('citizen');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [organization, setOrganization] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = registerRequestSchema.safeParse({
      full_name: fullName,
      email,
      password,
      role,
      organization: organization || undefined,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid input');
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.post('/auth/register', parsed.data);
      setSession(res.data.user, res.data.token);
      navigate('/');
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not create account'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-sm">
      <Card>
        <h1 className="text-xl font-semibold">Create an account</h1>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <select className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
            <option value="citizen">Citizen</option>
            <option value="university">University</option>
            <option value="industry">Industry</option>
          </select>
          <input placeholder="Full name" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <input type="email" placeholder="Email" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="password" placeholder="Password (min 6 chars)" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={password} onChange={(e) => setPassword(e.target.value)} />
          {role !== 'citizen' && (
            <input
              placeholder="Organization name"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
            />
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Creating…' : 'Create account'}
          </Button>
        </form>
        <p className="mt-4 text-sm text-slate-500">
          Already have an account? <Link to="/login" className="text-brand-600 hover:underline">Sign in</Link>
        </p>
      </Card>
    </div>
  );
}
