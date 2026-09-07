import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerRequestSchema, type Organization, type UserRole } from '@sih/shared-types';
import { apiClient, apiErrorMessage } from '../lib/apiClient.js';
import { useAuthStore } from '../store/authStore.js';
import { Card } from '../components/Card.js';
import { Button } from '../components/Button.js';

export default function Register() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [role, setRole] = useState<UserRole>('CITIZEN');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [organizationId, setOrganizationId] = useState('');
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (role === 'CITIZEN') return;
    apiClient.get('/organizations', { params: { type: role, pageSize: 50 } }).then((res) => setOrgs(res.data.data));
  }, [role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = registerRequestSchema.safeParse({
      name,
      email,
      password,
      role,
      organizationId: role === 'CITIZEN' ? undefined : organizationId,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid input');
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.post('/auth/register', parsed.data);
      setSession(res.data.data.user, res.data.data.tokens);
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
          <select
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
          >
            <option value="CITIZEN">Citizen</option>
            <option value="UNIVERSITY">University</option>
            <option value="INDUSTRY">Industry</option>
          </select>
          <input
            placeholder="Full name"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="email"
            placeholder="Email"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password (min 8 chars, mixed case + number)"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {role !== 'CITIZEN' && (
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={organizationId}
              onChange={(e) => setOrganizationId(e.target.value)}
            >
              <option value="">Select your organization…</option>
              {orgs.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
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
