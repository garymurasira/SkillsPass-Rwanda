import fs from 'node:fs';
import path from 'node:path';
import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { parse } from 'yaml';

export const OPENAPI_PATH = path.resolve(__dirname, '../docs/openapi.yaml');

// Serves the hand-written OpenAPI spec as Swagger UI (/docs) and raw JSON (/openapi.json).
// tests/openapi.test.ts fails if the spec and the real routes drift apart.
export function docsRouter() {
  const spec = parse(fs.readFileSync(OPENAPI_PATH, 'utf8'));
  const router = Router();
  router.get('/openapi.json', (_req, res) => {
    res.json(spec);
  });
  router.use('/docs', swaggerUi.serve, swaggerUi.setup(spec, { customSiteTitle: 'SkillsPass Rwanda API' }));
  return router;
}
