import { describe, expect, it } from 'vitest';
import { createProblemRequestSchema, registerRequestSchema, listProblemsQuerySchema } from '../index.js';

describe('registerRequestSchema', () => {
  it('defaults role to citizen and lowercases email', () => {
    const parsed = registerRequestSchema.parse({
      full_name: 'Asha Devi',
      email: 'Asha@Example.COM',
      password: 'secret1',
    });
    expect(parsed.role).toBe('citizen');
    expect(parsed.email).toBe('asha@example.com');
  });

  it('rejects a short password (backend/src/models/user.model.js has no min length, but the form should still guard)', () => {
    expect(registerRequestSchema.safeParse({ full_name: 'A', email: 'a@b.com', password: '123' }).success).toBe(false);
  });
});

describe('createProblemRequestSchema', () => {
  const valid = {
    title: 'Contaminated pond water',
    description: 'The village pond has turned green and smells foul, affecting many families.',
    location: { lat: 23.34, lng: 85.3, district: 'Ranchi' },
  };

  it('accepts a well-formed submission and defaults image_urls/address', () => {
    const parsed = createProblemRequestSchema.parse(valid);
    expect(parsed.image_urls).toEqual([]);
    expect(parsed.location.address).toBe('');
  });

  it('rejects a title under 5 characters (matches the Mongoose minlength)', () => {
    expect(createProblemRequestSchema.safeParse({ ...valid, title: 'Bad' }).success).toBe(false);
  });
});

describe('listProblemsQuerySchema', () => {
  it('coerces page/limit from query-string values', () => {
    const parsed = listProblemsQuerySchema.parse({ page: '2', limit: '5' });
    expect(parsed).toMatchObject({ page: 2, limit: 5 });
  });
});
