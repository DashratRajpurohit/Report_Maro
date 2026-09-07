import { describe, expect, it } from 'vitest';
import { scorePriority } from '../pipeline/priorityScorer.js';

describe('scorePriority', () => {
  it('scores an urgent healthcare report as CRITICAL', () => {
    const { priority, score } = scorePriority(
      'Emergency: no functioning PHC nearby',
      'This is a severe, life-threatening situation — pregnant women cannot reach any doctor within an hour and need urgent, immediately available care.',
      'HEALTHCARE',
    );
    expect(priority).toBe('CRITICAL');
    expect(score).toBeGreaterThanOrEqual(80);
  });

  it('scores a short, low-urgency education report as LOW or MEDIUM', () => {
    const { priority } = scorePriority('Short on textbooks', 'We need more books.', 'EDUCATION');
    expect(['LOW', 'MEDIUM']).toContain(priority);
  });

  it('clamps the score into [0, 100]', () => {
    const { score } = scorePriority(
      'emergency urgent critical severe outbreak dying immediately',
      'emergency urgent critical severe outbreak dying immediately '.repeat(10),
      'HEALTHCARE',
    );
    expect(score).toBeLessThanOrEqual(100);
  });
});
