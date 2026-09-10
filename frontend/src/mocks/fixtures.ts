import type { Problem, Project, User } from '../schemas/index.js';

export const mockUsers: (User & { password: string })[] = [
  { id: '000000000000000000000001', full_name: 'Portal Admin', email: 'admin@sihportal.dev', role: 'admin', organization: null, password: 'mock-login-not-a-secret' },
  { id: '000000000000000000000002', full_name: 'Asha Devi', email: 'asha.devi@example.com', role: 'citizen', organization: null, password: 'mock-login-not-a-secret' },
  { id: '000000000000000000000003', full_name: 'Dr. S. Mahato', email: 'dean@nitjsr.ac.in', role: 'university', organization: 'NIT Jamshedpur', password: 'mock-login-not-a-secret' },
];

export const mockProblems: Problem[] = [
  {
    _id: '000000000000000000000101',
    title: 'Contaminated pond water near Birsa Chowk, ward 12',
    description: 'The village pond has turned green and smells foul. Around 200 families draw water from it daily.',
    category: 'water',
    priority: 'high',
    status: 'verified',
    location: { lat: 23.3441, lng: 85.3096, district: 'Ranchi', address: 'Near Birsa Chowk' },
    image_urls: [],
    submitted_by: { full_name: 'Asha Devi' },
    assigned_university: null,
    ai_confidence: 0.85,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    _id: '000000000000000000000102',
    title: 'Large pothole on NH-33 causing daily accidents',
    description: 'A deep pothole has formed near the Sakchi flyover approach. Two-wheelers have skidded twice this week.',
    category: 'road',
    priority: 'high',
    status: 'submitted',
    location: { lat: 22.8046, lng: 86.2029, district: 'East Singhbhum', address: '' },
    image_urls: [],
    submitted_by: { full_name: 'Ravi Kumar' },
    assigned_university: null,
    ai_confidence: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const mockProjects: Project[] = [
  {
    _id: '000000000000000000000201',
    problem_id: '000000000000000000000101',
    university_id: '000000000000000000000003',
    industry_partner_id: null,
    proposal_text: 'A modular sand-and-charcoal filtration unit designed with the local panchayat.',
    status: 'under_review',
    budget: 150000,
    milestones: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];
