import { describe, expect, it } from 'vitest';
import { PROBLEM_CATEGORIES } from '@sih/shared-types';
import { CATEGORY_KEYWORDS } from '../pipeline/taxonomy.js';
import { classifyProblem } from '../pipeline/classifier.js';

describe('taxonomy coverage', () => {
  it('has a keyword entry for every ProblemCategory except OTHER', () => {
    for (const category of PROBLEM_CATEGORIES) {
      if (category === 'OTHER') continue;
      expect(CATEGORY_KEYWORDS[category].length).toBeGreaterThan(0);
    }
  });
});

describe('classifyProblem', () => {
  it('classifies a water contamination report correctly', () => {
    const result = classifyProblem(
      'Contaminated pond water in ward 12',
      'The village pond has turned green and smells foul, contaminating the water 200 families rely on.',
    );
    expect(result.category).toBe('WATER_SANITATION');
    expect(result.confidence).toBeGreaterThan(0.3);
  });

  it('classifies a pothole report as roads/transport', () => {
    const result = classifyProblem(
      'Deep pothole near the flyover',
      'A large pothole on the highway has caused two accidents this week near the bus stop.',
    );
    expect(result.category).toBe('ROADS_TRANSPORT');
  });

  it('falls back to OTHER with zero confidence when nothing matches', () => {
    const result = classifyProblem('Strange lights in the sky', 'Something unusual was seen last night.');
    expect(result.category).toBe('OTHER');
    expect(result.confidence).toBe(0);
  });
});
