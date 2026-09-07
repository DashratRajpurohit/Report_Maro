import type { Organization, Problem, ProblemSummary, Project, PublicUser } from '@sih/shared-types';

export const mockUsers: (PublicUser & { password: string })[] = [
  {
    id: 'user_admin',
    email: 'admin@sihportal.dev',
    name: 'Portal Admin',
    role: 'ADMIN',
    phone: null,
    organization: null,
    createdAt: new Date().toISOString(),
    password: 'Passw0rd!',
  },
  {
    id: 'user_citizen',
    email: 'asha.devi@example.com',
    name: 'Asha Devi',
    role: 'CITIZEN',
    phone: null,
    organization: null,
    createdAt: new Date().toISOString(),
    password: 'Passw0rd!',
  },
];

export const mockOrganizations: Organization[] = [
  { id: 'org_nit_jsr', name: 'NIT Jamshedpur', type: 'UNIVERSITY', district: 'East Singhbhum', contactEmail: null, website: null, activeAssignments: 1, createdAt: new Date().toISOString() },
  { id: 'org_tata_steel', name: 'Tata Steel Foundation', type: 'INDUSTRY', district: 'East Singhbhum', contactEmail: null, website: null, activeAssignments: 0, createdAt: new Date().toISOString() },
];

const reporter = { id: 'user_citizen', name: 'Asha Devi' };

export const mockProblems: Problem[] = [
  {
    id: 'prob_1',
    title: 'Contaminated pond water near Birsa Chowk, ward 12',
    description: 'The village pond has turned green and smells foul. Around 200 families draw water from it daily.',
    status: 'TRIAGED',
    location: { latitude: 23.3441, longitude: 85.3096, district: 'Ranchi', address: 'Near Birsa Chowk' },
    photos: [],
    reporter,
    analysis: {
      category: 'WATER_SANITATION',
      categoryConfidence: 0.92,
      priority: 'HIGH',
      priorityScore: 82,
      keywords: ['water', 'contaminat'],
      duplicateOfId: null,
      similarityScore: null,
      model: 'rules@1.0.0',
      analyzedAt: new Date().toISOString(),
    },
    category: 'WATER_SANITATION',
    priority: 'HIGH',
    duplicateCount: 0,
    assignmentId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prob_2',
    title: 'Large pothole on NH-33 causing daily accidents',
    description: 'A deep pothole has formed near the Sakchi flyover approach. Two-wheelers have skidded twice this week.',
    status: 'SUBMITTED',
    location: { latitude: 22.8046, longitude: 86.2029, district: 'East Singhbhum' },
    photos: [],
    reporter,
    analysis: null,
    category: null,
    priority: null,
    duplicateCount: 0,
    assignmentId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const mockProjects: Project[] = [
  {
    id: 'proj_1',
    proposalId: 'prop_1',
    problem: mockProblems[0] as unknown as ProblemSummary,
    university: { id: 'org_nit_jsr', name: 'NIT Jamshedpur', type: 'UNIVERSITY', district: 'East Singhbhum' },
    title: 'Low-cost water filtration for Birsa Chowk pond',
    summary: 'A modular sand-and-charcoal filtration unit designed with the local panchayat.',
    category: 'WATER_SANITATION',
    status: 'AWAITING_FUNDING',
    budgetInr: 150000,
    fundedInr: 40000,
    fundedPercent: 26.7,
    timelineWeeks: 10,
    fundings: [],
    startedAt: null,
    completedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
