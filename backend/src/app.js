import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './env.js';
import { router } from './routes.js';
import { setupSwagger } from './swagger.js';
import { compress } from './compress.js';
import { logger } from './logger.js';

const here = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();

  app.use(helmet({
    contentSecurityPolicy: env.NODE_ENV === 'production' ? {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        imgSrc: ["'self'", 'data:', 'blob:'],
        connectSrc: ["'self'", 'https:'],
        fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
      },
    } : false,
    crossOriginEmbedderPolicy: false,
    referrerPolicy: { policy: 'same-origin' },
  }));

  app.use(cookieParser());
  app.use(cors({
    origin: env.NODE_ENV === 'production' ? env.CORS_ORIGIN.split(',') : true,
    credentials: true,
  }));
  app.use(compress());

  const readLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: env.NODE_ENV === 'production' ? 600 : 4000,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path === '/health' || (req.method !== 'GET' && req.method !== 'HEAD'),
    message: { success: false, error: 'Слишком много запросов, попробуйте позже' },
  });
  app.use('/api', readLimiter);

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      if (req.path === '/health') return true;
      if (req.method === 'GET' || req.method === 'HEAD') return true;
      return req.method === 'OPTIONS';
    },
    message: { success: false, error: 'Слишком много запросов, попробуйте позже' },
  });
  app.use('/api', limiter);

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: env.NODE_ENV === 'production' ? 10 : 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Слишком много попыток входа' },
  });
  app.use('/api/auth/login', authLimiter);

  const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: env.NODE_ENV === 'production' ? 5 : 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Слишком много регистраций с этого адреса' },
  });
  app.use('/api/auth/register', registerLimiter);

  const refreshLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: env.NODE_ENV === 'production' ? 60 : 500,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Слишком много запросов на обновление токена' },
  });
  app.use('/api/auth/refresh', refreshLimiter);

  const forgotLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: env.NODE_ENV === 'production' ? 3 : 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Слишком много запросов на восстановление пароля' },
  });
  app.use('/api/auth/forgot-password', forgotLimiter);

  app.get('/favicon.ico', (_req, res) => {
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🎓</text></svg>');
  });

  app.use(express.json({ limit: '10mb' }));

  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      if (!req.path.includes('/health')) {
        const level = res.statusCode >= 400 ? 'warn' : 'info';
        logger.log(level, `${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
      }
    });
    next();
  });

  setupSwagger(app);
  app.use('/api', router);

  // Если рядом есть собранный frontend, backend может раздавать его сам.
  const distDir = path.resolve(here, '../../frontend/dist');
  if (fs.existsSync(path.join(distDir, 'index.html'))) {
    app.use(express.static(distDir));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.use((err, _req, res, _next) => {
    logger.error('Unhandled error:', err);
    res.status(500).json({ success: false, error: 'Внутренняя ошибка сервера' });
  });

  return app;
}

export const app = createApp();
export default app;
