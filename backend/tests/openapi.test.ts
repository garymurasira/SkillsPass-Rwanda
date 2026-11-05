import { describe, expect, it } from 'vitest';
import request from 'supertest';
import fs from 'node:fs';
import SwaggerParser from '@apidevtools/swagger-parser';
import { parse } from 'yaml';
import { app } from './helpers';
import { OPENAPI_PATH } from '../src/docs';

type Layer = {
  route?: { path: string; methods: Record<string, boolean> };
  name: string;
  regexp: RegExp;
  handle: { stack?: Layer[] };
};

// Express 4 keeps no list of mounted paths, so recover each router's prefix from its compiled regexp.
function mountPath(layer: Layer): string {
  const src = layer.regexp.source;
  if (src === '^\\/?(?=\\/|$)') return '';
  const m = /^\^((?:\\\/[^\\()?]+)+)\\\/\?\(\?=\\\/\|\$\)$/.exec(src);
  if (!m) throw new Error(`Cannot read mount path from ${src}`);
  return m[1].replace(/\\\//g, '/');
}

function collect(stack: Layer[], prefix = ''): string[] {
  const out: string[] = [];
  for (const layer of stack) {
    if (layer.route) {
      for (const method of Object.keys(layer.route.methods)) {
        out.push(`${method.toUpperCase()} ${prefix}${layer.route.path}`);
      }
    } else if (layer.name === 'router' && layer.handle.stack) {
      out.push(...collect(layer.handle.stack, prefix + mountPath(layer)));
    }
  }
  return out;
}

const toOpenApiPath = (p: string) => p.replace(/:([A-Za-z]+)/g, '{$1}');

const spec = parse(fs.readFileSync(OPENAPI_PATH, 'utf8'));
const HTTP_METHODS = ['get', 'put', 'post', 'delete', 'patch'];

describe('OpenAPI spec', () => {
  it('is valid OpenAPI 3', async () => {
    await expect(SwaggerParser.validate(OPENAPI_PATH)).resolves.toBeTruthy();
  });

  it('documents exactly the routes the server implements', () => {
    // the docs routes themselves are not part of the API surface
    const implemented = collect((app as unknown as { _router: { stack: Layer[] } })._router.stack)
      .filter((r) => !/ \/api\/(docs|openapi\.json)/.test(r))
      .map((r) => {
        const [method, path] = r.split(' ');
        // '/messages/' (router root) and '/messages' are the same route
        return `${method} ${toOpenApiPath(path).replace(/^\/api/, '').replace(/(.)\/$/, '$1')}`;
      })
      .sort();

    const documented: string[] = [];
    for (const [path, item] of Object.entries<Record<string, unknown>>(spec.paths)) {
      for (const method of HTTP_METHODS) {
        if (item[method]) documented.push(`${method.toUpperCase()} ${path}`);
      }
    }

    expect(documented.sort()).toEqual(implemented);
    expect(implemented.length).toBeGreaterThan(35);
  });

  it('lists a security requirement or explicit opt-out on every operation, and a 401 for protected ones', () => {
    for (const [path, item] of Object.entries<Record<string, { security?: unknown[]; responses: Record<string, unknown> }>>(spec.paths)) {
      for (const method of HTTP_METHODS) {
        const op = item[method];
        if (!op) continue;
        const isPublic = Array.isArray(op.security) && op.security.length === 0;
        if (!isPublic) expect(op.responses['401'], `${method.toUpperCase()} ${path} needs a 401 response`).toBeTruthy();
      }
    }
  });

  it('is served as Swagger UI and as JSON', async () => {
    const json = await request(app).get('/api/openapi.json').expect(200);
    expect(json.body.info.title).toBe('SkillsPass Rwanda API');
    const ui = await request(app).get('/api/docs/').expect(200);
    expect(ui.text).toContain('swagger-ui');
  });

  it('covers every error code the code base can return', () => {
    const description: string = spec.info.description;
    const src = ['auth', 'profile', 'verification', 'search', 'jobs-ratings', 'messaging']
      .flatMap((m) => fs.readdirSync(`src/modules/${m}`).map((f) => `src/modules/${m}/${f}`))
      .concat(['src/shared/errors.ts', 'src/shared/image.ts'])
      .map((f) => fs.readFileSync(f, 'utf8'))
      .join('\n');
    const codes = new Set([...src.matchAll(/AppError\(\s*\d+,\s*'([A-Z0-9_]+)'/g)].map((m) => m[1]));
    codes.add('VALIDATION_ERROR').add('UPLOAD_ERROR').add('FILE_TOO_LARGE').add('INTERNAL_ERROR').add('RATE_LIMITED');
    const missing = [...codes].filter((c) => !description.includes(`\`${c}\``));
    expect(missing).toEqual([]);
  });
});
