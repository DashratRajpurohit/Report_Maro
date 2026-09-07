import jwt from 'jsonwebtoken';
import type { JwtPayload } from '@sih/shared-types';
import { jwtPayloadSchema } from '@sih/shared-types';
import { env } from '../config/env.js';

/** "15m" / "7d" -> seconds. jsonwebtoken's string-TTL overload has a narrower
 * branded type than a plain `string`, so TTLs are parsed once here and always
 * passed as numbers, which every jwt.sign overload accepts unambiguously. */
function parseTtlToSeconds(ttl: string): number {
  const match = /^(\d+)([smhd])$/.exec(ttl);
  if (!match) return 900;
  const [, amountStr, unit] = match as unknown as [string, string, string];
  const multiplier = { s: 1, m: 60, h: 3600, d: 86400 }[unit] ?? 1;
  return Number(amountStr) * multiplier;
}

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: parseTtlToSeconds(env.JWT_ACCESS_TTL) });
}

export function signRefreshToken(payload: Pick<JwtPayload, 'sub'>): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: parseTtlToSeconds(env.JWT_REFRESH_TTL) });
}

/** Returns null instead of throwing — callers decide how to respond. */
export function verifyAccessToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
    const result = jwtPayloadSchema.safeParse(decoded);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): { sub: string } | null {
  try {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as { sub: string };
    return { sub: decoded.sub };
  } catch {
    return null;
  }
}

/** Access tokens carry `expiresIn` seconds back to the client for its refresh timer. */
export function accessTokenTtlSeconds(): number {
  return parseTtlToSeconds(env.JWT_ACCESS_TTL);
}
