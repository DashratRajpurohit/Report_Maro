import OpenAI from 'openai';
import { PROBLEM_CATEGORIES, type ProblemCategory } from '@sih/shared-types';
import { env, openAiEnabled } from '../config/env.js';
import { logger } from '../lib/logger.js';

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  return client;
}

export interface FallbackClassification {
  category: ProblemCategory;
  confidence: number;
}

/**
 * Optional low-confidence fallback. Only called when the rule-based
 * classifier (classifier.ts) scores below CLASSIFIER_CONFIDENCE_FALLBACK_THRESHOLD
 * and an OpenAI key is configured — never a hard dependency of the pipeline.
 * See docs/PRD.md §7 (must degrade gracefully with zero external calls).
 */
export async function classifyWithOpenAiFallback(
  title: string,
  description: string,
): Promise<FallbackClassification | null> {
  if (!openAiEnabled) return null;

  try {
    const response = await getClient().chat.completions.create({
      model: env.OPENAI_MODEL,
      temperature: 0,
      messages: [
        {
          role: 'system',
          content: `Classify the civic problem report into exactly one category from this list: ${PROBLEM_CATEGORIES.join(', ')}. Respond with only the category name.`,
        },
        { role: 'user', content: `Title: ${title}\nDescription: ${description}` },
      ],
    });

    const raw = response.choices[0]?.message.content?.trim().toUpperCase();
    const category = PROBLEM_CATEGORIES.find((c) => c === raw);
    if (!category) return null;

    return { category, confidence: 0.75 };
  } catch (err) {
    logger.warn({ err }, 'OpenAI fallback failed; keeping the rule-based classification');
    return null;
  }
}
