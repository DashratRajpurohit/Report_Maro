import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProblemRequestSchema, JHARKHAND_DISTRICTS, JHARKHAND_BBOX } from '@sih/shared-types';
import { apiClient, apiErrorMessage } from '../lib/apiClient.js';
import { Card } from '../components/Card.js';
import { Button } from '../components/Button.js';

export default function SubmitProblem() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [district, setDistrict] = useState('Ranchi');
  const [latitude, setLatitude] = useState<number>(JHARKHAND_BBOX.centerLat);
  const [longitude, setLongitude] = useState<number>(JHARKHAND_BBOX.centerLng);
  const [address, setAddress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = createProblemRequestSchema.safeParse({
      title,
      description,
      location: { latitude, longitude, district, address: address || undefined },
      photos: [],
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid input');
      return;
    }
    setLoading(true);
    try {
      await apiClient.post('/problems', parsed.data);
      setSubmitted(true);
      setTimeout(() => navigate('/my-reports'), 1200);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not submit the report'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <Card>
        <h1 className="text-xl font-semibold">Report a problem</h1>
        <p className="mt-1 text-sm text-slate-500">
          Our AI will read your report and route it to the right team within seconds.
        </p>
        {submitted ? (
          <p className="mt-6 rounded-lg bg-green-50 p-4 text-green-800">
            Thanks — your report has been submitted and is being analysed.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <input
              placeholder="Short, clear title (e.g. Contaminated pond water in ward 12)"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              placeholder="Describe the problem in detail — what, where, since when, who is affected"
              rows={5}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
              >
                {JHARKHAND_DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <input
                placeholder="Landmark (optional)"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                step="0.0001"
                placeholder="Latitude"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={latitude}
                onChange={(e) => setLatitude(Number(e.target.value))}
              />
              <input
                type="number"
                step="0.0001"
                placeholder="Longitude"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={longitude}
                onChange={(e) => setLongitude(Number(e.target.value))}
              />
            </div>
            <p className="text-xs text-slate-400">
              A full Mapbox pin-picker replaces these two fields once VITE_MAPBOX_TOKEN is configured
              (FE-1 ticket in docs/TASK_BREAKDOWN.md).
            </p>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Submitting…' : 'Submit report'}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
