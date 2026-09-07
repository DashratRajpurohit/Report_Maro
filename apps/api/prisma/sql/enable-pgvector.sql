-- Run once after the first `prisma migrate dev`/`migrate deploy`, via
-- `pnpm --filter api db:vector-setup`. Prisma's schema.prisma has no native
-- `vector` type, so the embedding column and its ANN index are managed here
-- instead of inside a generated migration.
CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE "Problem" ADD COLUMN IF NOT EXISTS "embedding" vector(384);

CREATE INDEX IF NOT EXISTS "Problem_embedding_idx"
  ON "Problem" USING ivfflat ("embedding" vector_cosine_ops) WITH (lists = 100);
