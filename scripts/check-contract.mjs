#!/usr/bin/env node
/**
 * Cross-checks that every path in docs/openapi.yaml has a matching route
 * registered somewhere under apps/api/src/routes. This is a lightweight
 * regex-based sanity check, not a full OpenAPI conformance test — it exists
 * to catch the common failure mode (contract updated, route forgotten or
 * renamed) in CI, cheaply. See .github/workflows/ci.yml's contract-check job.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';

const ROOT = new URL('..', import.meta.url).pathname;
const OPENAPI_PATH = join(ROOT, 'docs/openapi.yaml');
const ROUTES_DIR = join(ROOT, 'apps/api/src/routes');

function loadOpenApiPaths() {
  const doc = parse(readFileSync(OPENAPI_PATH, 'utf8'));
  return Object.keys(doc.paths);
}

function loadRouteSource() {
  return readdirSync(ROUTES_DIR)
    .filter((f) => f.endsWith('.ts'))
    .map((f) => readFileSync(join(ROUTES_DIR, f), 'utf8'))
    .join('\n');
}

/** "/api/v1/problems/{id}/status" -> a regex tolerant of Express's ":id" param style. */
function pathToPattern(openApiPath) {
  const relative = openApiPath.replace(/^\/api\/v1/, '').replace(/^\/health$/, '/health');
  const escaped = relative.replace(/\{[^}]+\}/g, ':[A-Za-z]+').replace(/\//g, '\\/');
  return new RegExp(`['"\`]${escaped}['"\`]`);
}

const paths = loadOpenApiPaths();
const source = loadRouteSource();

const missing = paths.filter((p) => !pathToPattern(p).test(source) && !p.startsWith('/health'));

if (missing.length > 0) {
  console.error('Paths in docs/openapi.yaml with no matching route in apps/api/src/routes:');
  for (const p of missing) console.error(`  - ${p}`);
  process.exit(1);
}

console.log(`Contract check passed: all ${paths.length} openapi.yaml paths have a matching route.`);
