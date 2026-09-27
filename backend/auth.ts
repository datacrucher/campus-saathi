import { createHash, randomBytes } from 'node:crypto';
import { Router, type NextFunction, type Request, type Response } from 'express';
import type { Role } from '../frontend/src/data/types';
import { db } from './db';
import { verifyPassword } from './passwords';
import { HttpError, handler } from './http';

export const COOKIE = 'cc_session';
const DAY = 24 * 60 * 60 * 1000;
const SHORT_SESSION = 12 * 60 * 60 * 1000;
const LONG_SESSION = 30 * DAY;
const DEMO_LOGIN = process.env.DEMO_LOGIN !== 'off';

interface UserRow { id: string; email: string; password_hash: string; role: Role; name: string; title: string }

export interface SessionUser {
  role: Role;
  id: string;
  name: string;
  firstName: string;
  email: string;
  title: string;
}

declare global {
  namespace Express {
    interface Request { user?: SessionUser & { departmentId?: string } }
  }
}

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

function toSessionUser(u: UserRow): SessionUser {
  let firstName = u.name.replace(/^(Dr|Prof\.)\s+/, '').split(' ')[0];
  if (u.role === 'student') {
    const s = db.prepare('SELECT preferred_name FROM students WHERE id = ?').get(u.id) as { preferred_name: string } | undefined;
    if (s) firstName = s.preferred_name;
  }
  return { role: u.role, id: u.id, name: u.name, firstName, email: u.email, title: u.title };
}

function startSession(res: Response, userId: string, remember: boolean) {
  const token = randomBytes(32).toString('base64url');
  const ttl = remember ? LONG_SESSION : SHORT_SESSION;
  db.prepare('INSERT INTO sessions VALUES (?,?,?)').run(hashToken(token), userId, Date.now() + ttl);
  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    ...(remember ? { maxAge: ttl } : {}),
  });
}

export function loadUser(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.[COOKIE];
  if (typeof token === 'string' && token) {
    const row = db.prepare(`
      SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = ? AND s.expires_at > ?`).get(hashToken(token), Date.now()) as UserRow | undefined;
    if (row) {
      req.user = toSessionUser(row);
      if (row.role === 'staff') {
        const s = db.prepare('SELECT department_id FROM staff WHERE id = ?').get(row.id) as { department_id: string };
        req.user.departmentId = s.department_id;
      }
    }
  }
  next();
}

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new HttpError(401, 'Please sign in to continue.'));
    if (roles.length && !roles.includes(req.user.role)) return next(new HttpError(403, 'You don’t have access to this.'));
    next();
  };
}

const failures = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(key: string) {
  const f = failures.get(key);
  if (f && f.resetAt > Date.now() && f.count >= 10) {
    throw new HttpError(429, 'Too many sign-in attempts. Wait a few minutes and try again.');
  }
}
function recordFailure(key: string) {
  const f = failures.get(key);
  if (!f || f.resetAt < Date.now()) failures.set(key, { count: 1, resetAt: Date.now() + 15 * 60 * 1000 });
  else f.count++;
}

export const authRouter = Router();

authRouter.get('/me', (req, res) => {
  if (!req.user) throw new HttpError(401, 'Not signed in.');
  const { departmentId: _omit, ...user } = req.user;
  res.json({ user });
});

authRouter.post('/login', handler((req, res) => {
  const email = String(req.body?.email ?? '').trim();
  const password = String(req.body?.password ?? '');
  const remember = req.body?.remember === true;
  if (!email || !password) throw new HttpError(400, 'Enter your email address and password.');
  const key = `${req.ip}|${email.toLowerCase()}`;
  checkRateLimit(key);

  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as UserRow | undefined;
  if (!row || !verifyPassword(password, row.password_hash)) {
    recordFailure(key);
    throw new HttpError(401, 'We couldn’t sign you in. Check your email address and password and try again.');
  }
  failures.delete(key);
  startSession(res, row.id, remember);
  res.json({ user: toSessionUser(row) });
}));

const DEMO_ACCOUNTS: Record<Role, string> = { student: 'st-2291047', staff: 'sf-mitchell', admin: 'ad-okafor' };
authRouter.post('/demo', handler((req, res) => {
  if (!DEMO_LOGIN) throw new HttpError(404, 'Demo sign-in is turned off.');
  const role = req.body?.role as Role;
  if (typeof role !== 'string' || !Object.hasOwn(DEMO_ACCOUNTS, role)) throw new HttpError(400, 'Unknown demo role.');
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(DEMO_ACCOUNTS[role]) as unknown as UserRow;
  startSession(res, row.id, req.body?.remember === true);
  res.json({ user: toSessionUser(row) });
}));

authRouter.post('/logout', (req, res) => {
  const token = req.cookies?.[COOKIE];
  if (typeof token === 'string') db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(hashToken(token));
  res.clearCookie(COOKIE, { path: '/' });
  res.json({ ok: true });
});

export function pruneSessions() {
  db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(Date.now());
}
