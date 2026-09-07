import { readFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';

/**
 * Runs a raw .sql file against DATABASE_URL. Used for the pgvector column and
 * index, which Prisma's schema language cannot express — see sql/enable-pgvector.sql.
 */
const [, , sqlFilePath] = process.argv;
if (!sqlFilePath) {
  console.error('Usage: tsx prisma/run-sql.ts <path-to-sql-file>');
  process.exit(1);
}

const prisma = new PrismaClient();
const sql = readFileSync(sqlFilePath, 'utf8');

const statements = sql
  .split(';')
  .map((s) => s.trim())
  .filter((s) => s.length > 0 && !s.startsWith('--'));

for (const statement of statements) {
  await prisma.$executeRawUnsafe(statement);
}

console.log(`Applied ${statements.length} statement(s) from ${sqlFilePath}`);
await prisma.$disconnect();
