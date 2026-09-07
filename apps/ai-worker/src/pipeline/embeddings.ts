import { pipeline, type FeatureExtractionPipeline } from '@xenova/transformers';
import { EMBEDDING_DIMENSIONS } from '@sih/shared-types';

let extractor: FeatureExtractionPipeline | null = null;

/**
 * Lazily loads a local 384-dim sentence embedding model (Xenova's ONNX port
 * of all-MiniLM-L6-v2) on first use, then reuses it. Runs fully offline after
 * the one-time model download — no per-request network call, no API key.
 */
async function getExtractor(): Promise<FeatureExtractionPipeline> {
  if (!extractor) {
    extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return extractor;
}

export async function embedText(text: string): Promise<number[]> {
  const model = await getExtractor();
  const output = await model(text, { pooling: 'mean', normalize: true });
  const embedding = Array.from(output.data as Float32Array);

  if (embedding.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(
      `Embedding model produced ${embedding.length} dimensions, expected ${EMBEDDING_DIMENSIONS}`,
    );
  }
  return embedding;
}
