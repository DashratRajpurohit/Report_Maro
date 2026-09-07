import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function hash(pw: string) {
  return bcrypt.hash(pw, 10);
}

async function main() {
  console.log('Seeding demo data...');

  const [ranchi, nitJsr, tataSteel, birlaEdu, govJhk] = await Promise.all([
    prisma.organization.upsert({
      where: { id: 'org_admin_gov' },
      update: {},
      create: { id: 'org_admin_gov', name: 'Jharkhand Urban Development Dept.', type: 'GOVERNMENT', district: 'Ranchi' },
    }),
    prisma.organization.upsert({
      where: { id: 'org_nit_jsr' },
      update: {},
      create: { id: 'org_nit_jsr', name: 'NIT Jamshedpur', type: 'UNIVERSITY', district: 'East Singhbhum', contactEmail: 'dean.research@nitjsr.ac.in' },
    }),
    prisma.organization.upsert({
      where: { id: 'org_tata_steel' },
      update: {},
      create: { id: 'org_tata_steel', name: 'Tata Steel Foundation', type: 'INDUSTRY', district: 'East Singhbhum', contactEmail: 'csr@tatasteel.com' },
    }),
    prisma.organization.upsert({
      where: { id: 'org_bit_mesra' },
      update: {},
      create: { id: 'org_bit_mesra', name: 'BIT Mesra', type: 'UNIVERSITY', district: 'Ranchi', contactEmail: 'research@bitmesra.ac.in' },
    }),
    prisma.organization.upsert({
      where: { id: 'org_cmpdi' },
      update: {},
      create: { id: 'org_cmpdi', name: 'CMPDI CSR Cell', type: 'INDUSTRY', district: 'Ranchi', contactEmail: 'csr@cmpdi.co.in' },
    }),
  ]);

  const passwordHash = await hash('Passw0rd!');

  const [admin, citizen1, citizen2, uniUser1, uniUser2, indUser1, indUser2] = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@sihportal.dev' },
      update: {},
      create: { email: 'admin@sihportal.dev', passwordHash, name: 'Portal Admin', role: 'ADMIN', organizationId: ranchi.id },
    }),
    prisma.user.upsert({
      where: { email: 'asha.devi@example.com' },
      update: {},
      create: { email: 'asha.devi@example.com', passwordHash, name: 'Asha Devi', role: 'CITIZEN' },
    }),
    prisma.user.upsert({
      where: { email: 'ravi.kumar@example.com' },
      update: {},
      create: { email: 'ravi.kumar@example.com', passwordHash, name: 'Ravi Kumar', role: 'CITIZEN' },
    }),
    prisma.user.upsert({
      where: { email: 'dean@nitjsr.ac.in' },
      update: {},
      create: { email: 'dean@nitjsr.ac.in', passwordHash, name: 'Dr. S. Mahato', role: 'UNIVERSITY', organizationId: nitJsr.id },
    }),
    prisma.user.upsert({
      where: { email: 'research@bitmesra.ac.in' },
      update: {},
      create: { email: 'research@bitmesra.ac.in', passwordHash, name: 'Dr. P. Oraon', role: 'UNIVERSITY', organizationId: birlaEdu.id },
    }),
    prisma.user.upsert({
      where: { email: 'csr@tatasteel.com' },
      update: {},
      create: { email: 'csr@tatasteel.com', passwordHash, name: 'Neha Singh', role: 'INDUSTRY', organizationId: tataSteel.id },
    }),
    prisma.user.upsert({
      where: { email: 'csr@cmpdi.co.in' },
      update: {},
      create: { email: 'csr@cmpdi.co.in', passwordHash, name: 'Amit Verma', role: 'INDUSTRY', organizationId: govJhk.id },
    }),
  ]);

  const problems = [
    {
      title: 'Contaminated pond water near Birsa Chowk, ward 12',
      description:
        'The village pond has turned green and smells foul. Around 200 families draw water from it daily. Several children have reported stomach illness this month.',
      district: 'Ranchi',
      latitude: 23.3441,
      longitude: 85.3096,
      reporterId: citizen1.id,
      category: 'WATER_SANITATION' as const,
      priority: 'HIGH' as const,
      priorityScore: 82,
    },
    {
      title: 'Large pothole on NH-33 causing daily accidents',
      description:
        'A deep pothole has formed near the Sakchi flyover approach. Two-wheelers have skidded twice this week during the rains. No barricade or warning sign is present.',
      district: 'East Singhbhum',
      latitude: 22.8046,
      longitude: 86.2029,
      reporterId: citizen2.id,
      category: 'ROADS_TRANSPORT' as const,
      priority: 'CRITICAL' as const,
      priorityScore: 91,
    },
    {
      title: 'Government primary school missing 3 of 5 teachers',
      description:
        'The primary school in our panchayat has had only 2 teachers for 40 students since the start of the term. Classes 3-5 are effectively unsupervised most days.',
      district: 'Gumla',
      latitude: 23.0435,
      longitude: 84.5406,
      reporterId: citizen1.id,
      category: 'EDUCATION' as const,
      priority: 'MEDIUM' as const,
      priorityScore: 58,
    },
    {
      title: 'No functioning primary health centre within 15km',
      description:
        'The nearest PHC has been shut for renovation for over 8 months with no update. Pregnant women and elderly residents must travel over an hour for basic care.',
      district: 'Simdega',
      latitude: 22.6154,
      longitude: 84.5111,
      reporterId: citizen2.id,
      category: 'HEALTHCARE' as const,
      priority: 'CRITICAL' as const,
      priorityScore: 95,
    },
    {
      title: 'Frequent power cuts damaging small workshop equipment',
      description:
        'Unscheduled power cuts of 4-6 hours daily have damaged two motors in our village\'s shared workshop this month, affecting a dozen artisan families\' income.',
      district: 'Dumka',
      latitude: 24.2676,
      longitude: 87.2497,
      reporterId: citizen1.id,
      category: 'ELECTRICITY' as const,
      priority: 'MEDIUM' as const,
      priorityScore: 55,
    },
    {
      title: 'Uncollected garbage piling up near the weekly market',
      description:
        'Waste has not been collected from the market area in over two weeks. It is attracting stray animals and the smell is affecting nearby shopkeepers and school children.',
      district: 'Dhanbad',
      latitude: 23.7957,
      longitude: 86.4304,
      reporterId: citizen2.id,
      category: 'WASTE_MANAGEMENT' as const,
      priority: 'MEDIUM' as const,
      priorityScore: 61,
    },
  ];

  // Seeded problems are pre-triaged (status TRIAGED, category/priority set) so the
  // admin/university/industry dashboards look populated immediately, without
  // needing apps/ai-worker running first. A citizen submitting a *new* problem
  // during the live demo still goes through the real SUBMITTED -> AI -> TRIAGED
  // flow end-to-end.
  for (const p of problems) {
    await prisma.problem.create({
      data: {
        title: p.title,
        description: p.description,
        district: p.district,
        latitude: p.latitude,
        longitude: p.longitude,
        reporterId: p.reporterId,
        status: 'TRIAGED',
        category: p.category,
        categoryConfidence: 0.9,
        priority: p.priority,
        priorityScore: p.priorityScore,
        keywords: [],
        analysisModel: 'seed-data',
        analyzedAt: new Date(),
        photos: [],
      },
    });
  }

  console.log('Seed complete:', {
    organizations: 5,
    users: [admin, citizen1, citizen2, uniUser1, uniUser2, indUser1, indUser2].length,
    problems: problems.length,
  });
  console.log('All seeded users share the password: Passw0rd!');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
