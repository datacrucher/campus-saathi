import express from 'express';
import cookieParser from 'cookie-parser';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { DB_PATH, DEMO_PASSWORD } from './db';
import { authRouter, loadUser, pruneSessions } from './auth';
import { casesRouter } from './cases';
import { errorMiddleware } from './http';
import { aiConfigured } from '../ml/ai-triage';

const PORT = Number(process.env.PORT ?? 3001);
const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 'loopback');
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());
app.use((_req, res, next) => {
  res.set({ 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'same-origin', 'X-Frame-Options': 'DENY' });
  next();
});

app.use('/api', (req, res, next) => {
  if (req.method !== 'GET' && req.headers.origin) {
    const host = req.headers['x-forwarded-host'] ?? req.headers.host;
    let originHost = '';
    try { originHost = new URL(req.headers.origin).host; } catch { /* "null" or malformed origin */ }
    if (originHost !== host) {
      res.status(403).json({ error: 'Cross-site requests are not allowed.' });
      return;
    }
  }
  res.set('Cache-Control', 'no-store');
  next();
});

app.use('/api', loadUser);
app.get('/api/health', (_req, res) => { res.json({ ok: true }); });
app.use('/api/auth', authRouter);
app.use('/api', casesRouter);
app.use('/api', (_req, res) => { res.status(404).json({ error: 'Not found.' }); });
app.use(errorMiddleware);

const dist = path.resolve('dist');
if (existsSync(path.join(dist, 'index.html'))) {
  app.use(express.static(dist, { index: false, maxAge: '1h' }));
  app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

setInterval(pruneSessions, 60 * 60 * 1000).unref();

app.listen(PORT, () => {
  console.log(`Campus Saathi API listening on http://localhost:${PORT}`);
  console.log(`Database: ${DB_PATH}`);
  console.log(aiConfigured() ? 'AI triage: on (Claude)' : 'AI triage: off — set ANTHROPIC_API_KEY in .env to enable. Using keyword rules.');
  if (!process.env.DEMO_PASSWORD) console.log(`Demo accounts use the password "${DEMO_PASSWORD}"`);
});
