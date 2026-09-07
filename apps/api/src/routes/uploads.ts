import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { presignUploadRequestSchema, type PresignUploadRequest } from '@sih/shared-types';
import { env } from '../config/env.js';
import { s3Client } from '../lib/s3.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { ok } from '../utils/http.js';

export const uploadsRouter = Router();

const PRESIGN_EXPIRES_SECONDS = 300;

uploadsRouter.post('/uploads/presign', requireAuth, validate(presignUploadRequestSchema), async (req, res, next) => {
  try {
    const body = req.body as PresignUploadRequest;
    const extension = body.fileName.split('.').pop() ?? 'bin';
    const key = `problems/${req.user!.sub}/${randomUUID()}.${extension}`;

    const uploadUrl = await getSignedUrl(
      s3Client,
      new PutObjectCommand({ Bucket: env.S3_BUCKET, Key: key, ContentType: body.contentType }),
      { expiresIn: PRESIGN_EXPIRES_SECONDS },
    );

    ok(
      res,
      {
        key,
        uploadUrl,
        publicUrl: `${env.S3_PUBLIC_BASE_URL}/${key}`,
        expiresIn: PRESIGN_EXPIRES_SECONDS,
      },
      201,
    );
  } catch (err) {
    next(err);
  }
});
