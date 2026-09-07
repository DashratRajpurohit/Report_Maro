import { http, HttpResponse } from 'msw';
import { mockOrganizations, mockProblems, mockProjects, mockUsers } from './fixtures.js';

const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api/v1';

/**
 * Fixture handlers matching docs/openapi.yaml. Frontend development and tests
 * run entirely against these until apps/api is up — see docs/ARCHITECTURE.md
 * §4 (contract-first parallel work).
 */
export const handlers = [
  http.post(`${BASE}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string };
    const user = mockUsers.find((u) => u.email === body.email && u.password === body.password);
    if (!user) {
      return HttpResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid email or password' }, requestId: 'mock' },
        { status: 401 },
      );
    }
    const { password: _password, ...publicUser } = user;
    return HttpResponse.json({
      success: true,
      data: { user: publicUser, tokens: { accessToken: 'mock-access', refreshToken: 'mock-refresh', expiresIn: 900 } },
    });
  }),

  http.post(`${BASE}/auth/register`, async ({ request }) => {
    const body = (await request.json()) as { email: string; name: string; role: string };
    return HttpResponse.json(
      {
        success: true,
        data: {
          user: {
            id: `user_${Date.now()}`,
            email: body.email,
            name: body.name,
            role: body.role,
            phone: null,
            organization: null,
            createdAt: new Date().toISOString(),
          },
          tokens: { accessToken: 'mock-access', refreshToken: 'mock-refresh', expiresIn: 900 },
        },
      },
      { status: 201 },
    );
  }),

  http.get(`${BASE}/auth/me`, () => {
    const { password: _password, ...publicUser } = mockUsers[1]!;
    return HttpResponse.json({ success: true, data: publicUser });
  }),

  http.get(`${BASE}/problems`, () => {
    const summaries = mockProblems.map(({ description: _d, photos: _p, analysis: _a, ...rest }) => rest);
    return HttpResponse.json({
      success: true,
      data: summaries,
      meta: { pagination: { page: 1, pageSize: 20, total: summaries.length, totalPages: 1 } },
    });
  }),

  http.get(`${BASE}/problems/:id`, ({ params }) => {
    const problem = mockProblems.find((p) => p.id === params.id);
    if (!problem) return HttpResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Not found' }, requestId: 'mock' }, { status: 404 });
    return HttpResponse.json({ success: true, data: problem });
  }),

  http.post(`${BASE}/problems`, async ({ request }) => {
    const body = (await request.json()) as { title: string; description: string };
    return HttpResponse.json(
      {
        success: true,
        data: {
          id: `prob_${Date.now()}`,
          title: body.title,
          description: body.description,
          status: 'SUBMITTED',
          location: { latitude: 23.6, longitude: 85.3, district: 'Ranchi' },
          photos: [],
          reporter: { id: 'user_citizen', name: 'Asha Devi' },
          analysis: null,
          category: null,
          priority: null,
          duplicateCount: 0,
          assignmentId: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
      { status: 201 },
    );
  }),

  http.get(`${BASE}/organizations`, () =>
    HttpResponse.json({
      success: true,
      data: mockOrganizations,
      meta: { pagination: { page: 1, pageSize: 20, total: mockOrganizations.length, totalPages: 1 } },
    }),
  ),

  http.get(`${BASE}/projects`, () => {
    const summaries = mockProjects.map(({ summary: _s, fundings: _f, ...rest }) => rest);
    return HttpResponse.json({
      success: true,
      data: summaries,
      meta: { pagination: { page: 1, pageSize: 20, total: summaries.length, totalPages: 1 } },
    });
  }),

  http.get(`${BASE}/projects/:id`, ({ params }) => {
    const project = mockProjects.find((p) => p.id === params.id);
    if (!project) return HttpResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Not found' }, requestId: 'mock' }, { status: 404 });
    return HttpResponse.json({ success: true, data: project });
  }),

  http.get(`${BASE}/notifications`, () =>
    HttpResponse.json({ success: true, data: [], meta: { pagination: { page: 1, pageSize: 10, total: 0, totalPages: 1 } } }),
  ),

  http.get(`${BASE}/stats/overview`, () =>
    HttpResponse.json({
      success: true,
      data: {
        totals: { problems: 2, problemsToday: 1, pendingTriage: 1, assigned: 0, resolved: 0, duplicates: 0, activeProjects: 0, fundedInr: 40000 },
        byCategory: [{ category: 'WATER_SANITATION', count: 1 }],
        byStatus: [{ status: 'TRIAGED', count: 1 }, { status: 'SUBMITTED', count: 1 }],
        byPriority: [{ priority: 'HIGH', count: 1 }],
        byDistrict: [{ district: 'Ranchi', count: 1 }],
        trend: [],
      },
    }),
  ),
];
