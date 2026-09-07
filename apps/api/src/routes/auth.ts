import { Router } from 'express';
import crypto from 'node:crypto';
import {
  loginRequestSchema,
  refreshRequestSchema,
  logoutRequestSchema,
  registerRequestSchema,
  type LoginRequest,
  type LogoutRequest,
  type RefreshRequest,
  type RegisterRequest,
} from '@sih/shared-types';
import { prisma } from '../lib/prisma.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { ApiError, ok } from '../utils/http.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { accessTokenTtlSeconds, signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { serializeUser } from '../services/serializers.js';

export const authRouter = Router();

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function issueTokens(userId: string, email: string, role: string, organizationId: string | null) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const accessToken = signAccessToken({ sub: userId, email, role: role as any, organizationId });
  const refreshToken = signRefreshToken({ sub: userId });

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return { accessToken, refreshToken, expiresIn: accessTokenTtlSeconds() };
}

authRouter.post('/auth/register', validate(registerRequestSchema), async (req, res, next) => {
  try {
    const body = req.body as RegisterRequest;

    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) throw new ApiError('CONFLICT', 'An account with this email already exists');

    if (body.organizationId) {
      const org = await prisma.organization.findUnique({ where: { id: body.organizationId } });
      if (!org) throw new ApiError('VALIDATION_ERROR', 'organizationId does not exist');
    }

    const passwordHash = await hashPassword(body.password);
    const user = await prisma.user.create({
      data: {
        email: body.email,
        passwordHash,
        name: body.name,
        phone: body.phone,
        role: body.role,
        organizationId: body.organizationId,
      },
      include: { organization: true },
    });

    const tokens = await issueTokens(user.id, user.email, user.role, user.organizationId);
    ok(res, { user: serializeUser(user), tokens }, 201);
  } catch (err) {
    next(err);
  }
});

authRouter.post('/auth/login', validate(loginRequestSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body as LoginRequest;
    const user = await prisma.user.findUnique({ where: { email }, include: { organization: true } });
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      throw new ApiError('UNAUTHORIZED', 'Invalid email or password');
    }

    const tokens = await issueTokens(user.id, user.email, user.role, user.organizationId);
    ok(res, { user: serializeUser(user), tokens });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/auth/refresh', validate(refreshRequestSchema), async (req, res, next) => {
  try {
    const { refreshToken } = req.body as RefreshRequest;
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) throw new ApiError('UNAUTHORIZED', 'Invalid refresh token');

    const stored = await prisma.refreshToken.findUnique({ where: { tokenHash: hashToken(refreshToken) } });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new ApiError('UNAUTHORIZED', 'Refresh token expired or revoked');
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.sub }, include: { organization: true } });
    if (!user) throw new ApiError('UNAUTHORIZED', 'User no longer exists');

    // Rotate: revoke the old token, issue a new pair.
    await prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
    const tokens = await issueTokens(user.id, user.email, user.role, user.organizationId);
    ok(res, { user: serializeUser(user), tokens });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/auth/logout', validate(logoutRequestSchema), async (req, res, next) => {
  try {
    const { refreshToken } = req.body as LogoutRequest;
    await prisma.refreshToken.updateMany({
      where: { tokenHash: hashToken(refreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

authRouter.get('/auth/me', requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.sub },
      include: { organization: true },
    });
    if (!user) throw new ApiError('NOT_FOUND', 'User not found');
    ok(res, serializeUser(user));
  } catch (err) {
    next(err);
  }
});
