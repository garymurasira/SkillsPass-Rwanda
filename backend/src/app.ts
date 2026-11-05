import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { docsRouter } from './docs';
import { router } from './routes';
import { errorHandler, notFound } from './shared/errors';
import { UPLOAD_ROOT, UPLOAD_URL_PREFIX } from './shared/storage';

export function createApp() {
  const app = express();

  // Mounted before helmet: Swagger UI needs inline scripts that helmet's default CSP blocks.
  const docsEnabled = env.ENABLE_DOCS === undefined ? env.NODE_ENV !== 'production' : env.ENABLE_DOCS === 'true';
  if (docsEnabled) app.use('/api', docsRouter());

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  app.use(UPLOAD_URL_PREFIX, express.static(UPLOAD_ROOT, { maxAge: '7d', index: false }));
  app.use('/api', router);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
