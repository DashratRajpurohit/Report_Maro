import { describe, expect, it } from 'vitest';
import {
  EMBEDDING_DIMENSIONS,
  analysisCallbackRequestSchema,
  bboxQuerySchema,
  createProblemRequestSchema,
  listProblemsQuerySchema,
  registerRequestSchema,
} from '../index.js';

const validEmbedding = Array.from({ length: EMBEDDING_DIMENSIONS }, () => 0.01);

describe('createProblemRequestSchema', () => {
  const valid = {
    title: 'Contaminated pond water in ward 12',
    description:
      'The village pond near the primary school has turned green and smells foul. Around 200 families draw water from it every day.',
    location: {
      latitude: 23.3441,
      longitude: 85.3096,
      district: 'Ranchi',
      address: 'Near Birsa Chowk',
    },
    photos: [],
  };

  it('accepts a well-formed submission and defaults photos', () => {
    const parsed = createProblemRequestSchema.parse({ ...valid, photos: undefined });
    expect(parsed.photos).toEqual([]);
    expect(parsed.location.district).toBe('Ranchi');
  });

  it('rejects a description that is too short to classify', () => {
    const result = createProblemRequestSchema.safeParse({ ...valid, description: 'dirty water' });
    expect(result.success).toBe(false);
  });

  it('rejects coordinates outside Jharkhand', () => {
    const result = createProblemRequestSchema.safeParse({
      ...valid,
      location: { ...valid.location, latitude: 19.076, longitude: 72.877 },
    });
    expect(result.success).toBe(false);
  });
});

describe('listProblemsQuerySchema', () => {
  it('coerces query-string values and applies defaults', () => {
    const parsed = listProblemsQuerySchema.parse({ page: '2', pageSize: '50', mine: 'true' });
    expect(parsed).toMatchObject({ page: 2, pageSize: 50, mine: true, sort: 'newest' });
  });

  it('caps pageSize at 100', () => {
    expect(listProblemsQuerySchema.safeParse({ pageSize: '500' }).success).toBe(false);
  });
});

describe('bboxQuerySchema', () => {
  it('parses "minLng,minLat,maxLng,maxLat"', () => {
    expect(bboxQuerySchema.parse('85.1,23.2,85.5,23.6')).toEqual({
      minLng: 85.1,
      minLat: 23.2,
      maxLng: 85.5,
      maxLat: 23.6,
    });
  });

  it('rejects a three-value bbox', () => {
    expect(bboxQuerySchema.safeParse('85.1,23.2,85.5').success).toBe(false);
  });
});

describe('registerRequestSchema', () => {
  it('requires organizationId for non-citizen roles', () => {
    const result = registerRequestSchema.safeParse({
      email: 'dean@nitrkl.ac.in',
      password: 'Passw0rdd',
      name: 'Dean Research',
      role: 'UNIVERSITY',
    });
    expect(result.success).toBe(false);
  });

  it('lowercases the email and defaults the role to CITIZEN', () => {
    const parsed = registerRequestSchema.parse({
      email: 'Asha@Example.COM',
      password: 'Passw0rdd',
      name: 'Asha Devi',
    });
    expect(parsed.email).toBe('asha@example.com');
    expect(parsed.role).toBe('CITIZEN');
  });
});

describe('analysisCallbackRequestSchema', () => {
  it('enforces the embedding width', () => {
    const result = analysisCallbackRequestSchema.safeParse({
      category: 'WATER_SANITATION',
      categoryConfidence: 0.9,
      priority: 'HIGH',
      priorityScore: 72,
      embedding: [0.1, 0.2],
      model: 'rules@1.0.0',
      processingMs: 12,
    });
    expect(result.success).toBe(false);
  });

  it('defaults duplicate fields to null', () => {
    const parsed = analysisCallbackRequestSchema.parse({
      category: 'WATER_SANITATION',
      categoryConfidence: 0.9,
      priority: 'HIGH',
      priorityScore: 72,
      embedding: validEmbedding,
      model: 'rules@1.0.0',
      processingMs: 12,
    });
    expect(parsed.duplicateOfId).toBeNull();
    expect(parsed.similarityScore).toBeNull();
    expect(parsed.keywords).toEqual([]);
  });
});
