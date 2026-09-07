/**
 * Prisma rows -> the exact shapes packages/shared-types promises the client.
 * Keeping this mapping in one place means a Prisma field rename never leaks
 * into the API response shape by accident.
 */
import type {
  Prisma,
  Problem as PrismaProblem,
  User as PrismaUser,
  Organization as PrismaOrganization,
  Assignment as PrismaAssignment,
  Proposal as PrismaProposal,
  Project as PrismaProject,
  Funding as PrismaFunding,
  Notification as PrismaNotification,
} from '@prisma/client';
import type {
  Problem,
  ProblemSummary,
  PublicUser,
  Organization,
  OrganizationSummary,
  Assignment,
  Proposal,
  Project,
  ProjectSummary,
  Funding,
  Notification,
  TeamMember,
  ProblemPhoto,
} from '@sih/shared-types';

export function serializeUser(
  user: PrismaUser & { organization: PrismaOrganization | null },
): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    phone: user.phone,
    organization: user.organization ? serializeOrganizationSummary(user.organization) : null,
    createdAt: user.createdAt.toISOString(),
  };
}

export function serializeOrganizationSummary(org: PrismaOrganization): OrganizationSummary {
  return { id: org.id, name: org.name, type: org.type, district: org.district };
}

export function serializeOrganization(
  org: PrismaOrganization & { activeAssignments?: number },
): Organization {
  return {
    ...serializeOrganizationSummary(org),
    contactEmail: org.contactEmail,
    website: org.website,
    activeAssignments: org.activeAssignments ?? 0,
    createdAt: org.createdAt.toISOString(),
  };
}

type ProblemWithReporter = PrismaProblem & { reporter: PrismaUser };

export function serializeProblemSummary(problem: ProblemWithReporter): ProblemSummary {
  return {
    id: problem.id,
    title: problem.title,
    status: problem.status,
    location: {
      latitude: problem.latitude,
      longitude: problem.longitude,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      district: problem.district as any,
      address: problem.address ?? undefined,
    },
    reporter: { id: problem.reporter.id, name: problem.reporter.name },
    category: problem.category,
    priority: problem.priority,
    duplicateCount: 0,
    assignmentId: null,
    createdAt: problem.createdAt.toISOString(),
    updatedAt: problem.updatedAt.toISOString(),
  };
}

export function serializeProblem(
  problem: ProblemWithReporter & { assignmentId?: string | null; duplicateCount?: number },
): Problem {
  const summary = serializeProblemSummary(problem);
  return {
    ...summary,
    assignmentId: problem.assignmentId ?? null,
    duplicateCount: problem.duplicateCount ?? 0,
    description: problem.description,
    photos: (problem.photos as unknown as ProblemPhoto[]) ?? [],
    analysis:
      problem.category && problem.priority && problem.analyzedAt
        ? {
            category: problem.category,
            categoryConfidence: problem.categoryConfidence ?? 0,
            priority: problem.priority,
            priorityScore: problem.priorityScore ?? 0,
            keywords: problem.keywords ?? [],
            duplicateOfId: problem.duplicateOfId,
            similarityScore: problem.similarityScore,
            model: problem.analysisModel ?? 'unknown',
            analyzedAt: problem.analyzedAt.toISOString(),
          }
        : null,
  };
}

type AssignmentFull = PrismaAssignment & {
  problem: ProblemWithReporter;
  university: PrismaOrganization;
  assignedBy: PrismaUser;
  proposal: PrismaProposal | null;
};

export function serializeAssignment(assignment: AssignmentFull): Assignment {
  return {
    id: assignment.id,
    problemId: assignment.problemId,
    problem: serializeProblemSummary(assignment.problem),
    university: serializeOrganizationSummary(assignment.university),
    status: assignment.status,
    note: assignment.note,
    dueDate: assignment.dueDate?.toISOString() ?? null,
    assignedBy: { id: assignment.assignedBy.id, name: assignment.assignedBy.name },
    respondedAt: assignment.respondedAt?.toISOString() ?? null,
    proposalId: assignment.proposal?.id ?? null,
    createdAt: assignment.createdAt.toISOString(),
    updatedAt: assignment.updatedAt.toISOString(),
  };
}

type ProposalFull = PrismaProposal & {
  assignment: PrismaAssignment & { problem: ProblemWithReporter; university: PrismaOrganization };
  submittedBy: PrismaUser;
  project: PrismaProject | null;
};

export function serializeProposal(proposal: ProposalFull): Proposal {
  return {
    id: proposal.id,
    assignmentId: proposal.assignmentId,
    problem: serializeProblemSummary(proposal.assignment.problem),
    university: serializeOrganizationSummary(proposal.assignment.university),
    title: proposal.title,
    summary: proposal.summary,
    approach: proposal.approach,
    teamMembers: proposal.teamMembers as unknown as TeamMember[],
    budgetInr: proposal.budgetInr,
    timelineWeeks: proposal.timelineWeeks,
    status: proposal.status,
    reviewNote: proposal.reviewNote,
    reviewedAt: proposal.reviewedAt?.toISOString() ?? null,
    projectId: proposal.project?.id ?? null,
    submittedBy: { id: proposal.submittedBy.id, name: proposal.submittedBy.name },
    createdAt: proposal.createdAt.toISOString(),
    updatedAt: proposal.updatedAt.toISOString(),
  };
}

type ProjectFull = PrismaProject & {
  proposal: PrismaProposal & {
    assignment: PrismaAssignment & { problem: ProblemWithReporter; university: PrismaOrganization };
  };
  fundings: (PrismaFunding & { industry: PrismaOrganization; fundedBy: PrismaUser })[];
};

function fundedInr(fundings: PrismaFunding[]): number {
  return fundings.reduce((sum, f) => sum + f.amountInr, 0);
}

export function serializeProjectSummary(project: ProjectFull): ProjectSummary {
  const funded = fundedInr(project.fundings);
  return {
    id: project.id,
    proposalId: project.proposalId,
    problem: serializeProblemSummary(project.proposal.assignment.problem),
    university: serializeOrganizationSummary(project.proposal.assignment.university),
    title: project.proposal.title,
    category: project.proposal.assignment.problem.category,
    status: project.status,
    budgetInr: project.budgetInr,
    fundedInr: funded,
    fundedPercent: project.budgetInr > 0 ? Math.min(100, (funded / project.budgetInr) * 100) : 0,
    timelineWeeks: project.timelineWeeks,
    startedAt: project.startedAt?.toISOString() ?? null,
    completedAt: project.completedAt?.toISOString() ?? null,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };
}

export function serializeProject(project: ProjectFull): Project {
  return {
    ...serializeProjectSummary(project),
    summary: project.proposal.summary,
    fundings: project.fundings.map((f) => serializeFunding(f, project.id)),
  };
}

export function serializeFunding(
  funding: PrismaFunding & { industry: PrismaOrganization; fundedBy: PrismaUser },
  projectId: string,
): Funding {
  return {
    id: funding.id,
    projectId,
    industry: serializeOrganizationSummary(funding.industry),
    amountInr: funding.amountInr,
    note: funding.note,
    fundedBy: { id: funding.fundedBy.id, name: funding.fundedBy.name },
    createdAt: funding.createdAt.toISOString(),
  };
}

export function serializeNotification(notification: PrismaNotification): Notification {
  return {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    link: notification.link,
    readAt: notification.readAt?.toISOString() ?? null,
    createdAt: notification.createdAt.toISOString(),
  };
}

export type { Prisma };
