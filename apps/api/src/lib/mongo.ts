import mongoose from 'mongoose';
import { env } from '../config/env.js';

let connected = false;

/** Lazily connects on first use; safe to call from multiple modules. */
export async function connectMongo(): Promise<typeof mongoose> {
  if (!connected) {
    await mongoose.connect(env.MONGO_URL);
    connected = true;
  }
  return mongoose;
}

export function isMongoConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

/**
 * Raw, loosely-structured AI worker output — full classifier scores and
 * keyword hits per analysis run. Never the system of record for anything the
 * API contract guarantees; kept for debugging and threshold tuning.
 */
const aiDebugPayloadSchema = new mongoose.Schema(
  {
    problemId: { type: String, required: true, index: true },
    payload: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { timestamps: true },
);

export const AiDebugPayload =
  mongoose.models.AiDebugPayload ?? mongoose.model('AiDebugPayload', aiDebugPayloadSchema);
