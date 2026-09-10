import { http, HttpResponse } from 'msw';
import { mockProblems, mockProjects, mockUsers } from './fixtures.js';

const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api';

/** Fixture handlers matching backend/'s actual response shapes exactly — see docs/API_CONTRACT.md. */
export const handlers = [
  http.post(`${BASE}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string };
    const user = mockUsers.find((u) => u.email === body.email && u.password === body.password);
    if (!user) {
      return HttpResponse.json({ success: false, message: 'Invalid email or password' }, { status: 401 });
    }
    const { password: _password, ...publicUser } = user;
    return HttpResponse.json({ success: true, message: 'Login successful!', token: 'mock-jwt', user: publicUser });
  }),

  http.post(`${BASE}/auth/register`, async ({ request }) => {
    const body = (await request.json()) as { email: string; full_name: string; role: string; organization?: string };
    return HttpResponse.json(
      {
        success: true,
        message: 'User registered successfully!',
        token: 'mock-jwt',
        user: { id: `user_${Date.now()}`, full_name: body.full_name, email: body.email, role: body.role, organization: body.organization ?? null },
      },
      { status: 201 },
    );
  }),

  http.get(`${BASE}/problems`, () =>
    HttpResponse.json({ success: true, data: mockProblems, pagination: { page: 1, limit: 10, total: mockProblems.length, pages: 1 } }),
  ),

  http.get(`${BASE}/problems/:id`, ({ params }) => {
    const problem = mockProblems.find((p) => p._id === params.id);
    if (!problem) return HttpResponse.json({ success: false, message: 'Problem not found' }, { status: 404 });
    return HttpResponse.json({ success: true, data: problem });
  }),

  http.post(`${BASE}/problems`, async ({ request }) => {
    const body = (await request.json()) as { title: string };
    return HttpResponse.json(
      { success: true, message: 'Problem submitted successfully. AI is processing it in the background.', data: { id: `prob_${Date.now()}`, title: body.title, status: 'submitted', created_at: new Date().toISOString() } },
      { status: 202 },
    );
  }),

  http.get(`${BASE}/problems/stats/dashboard`, () =>
    HttpResponse.json({
      success: true,
      source: 'database',
      data: {
        total: 2,
        byCategory: [{ _id: 'water', count: 1 }, { _id: 'road', count: 1 }],
        byStatus: [{ _id: 'verified', count: 1 }, { _id: 'submitted', count: 1 }],
        byDistrict: [{ _id: 'Ranchi', count: 1 }],
        lastUpdated: new Date().toISOString(),
      },
    }),
  ),

  http.get(`${BASE}/users`, ({ request }) => {
    const role = new URL(request.url).searchParams.get('role');
    const data = mockUsers.filter((u) => !role || u.role === role).map(({ password: _p, ...u }) => u);
    return HttpResponse.json({ success: true, data });
  }),

  http.get(`${BASE}/projects`, () => HttpResponse.json({ success: true, data: mockProjects })),
  http.get(`${BASE}/projects/:id`, ({ params }) => {
    const project = mockProjects.find((p) => p._id === params.id);
    if (!project) return HttpResponse.json({ success: false, message: 'Project not found' }, { status: 404 });
    return HttpResponse.json({ success: true, data: project });
  }),

  http.get(`${BASE}/notifications`, () => HttpResponse.json({ success: true, data: [], unreadCount: 0 })),
];
