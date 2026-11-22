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

  // Photos are public and the web app is served from a different origin than the API, so browsers must be
  // allowed to show them there. Helmet's default ("same-origin") would block every <img> from the app.
  app.use(
    UPLOAD_URL_PREFIX,
    (_req, res, next) => {
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      next();
    },
    express.static(UPLOAD_ROOT, { maxAge: '7d', index: false }),
  );
  app.use('/api', router);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
