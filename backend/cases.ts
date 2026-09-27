import { randomUUID } from 'node:crypto';
import { Router, type Request } from 'express';
import { PRIORITIES, STATUSES, type ActivityEntry, type Case, type Priority, type Status } from '../frontend/src/data/types';
import { TRIAGE_ACTOR, caseId } from '../frontend/src/data/seed';
import { triage } from '../ml/triage';
import { analyse, cachedTriage } from '../ml/ai-triage';
import { db, insertActivity, insertCase, seedCases, tx } from './db';
import { requireRole } from './auth';
import { HttpError, handler, oneOf, str } from './http';

const CONTACT = ['Email', 'Phone', 'In person', 'Teams call'] as const;

interface CaseRow {
  id: string; title: string; description: string; student_id: string; department_id: string; category: string;
  priority: Priority; status: Status; created_at: string; updated_at: string; assignee_id: string | null;
  contact_preference: Case['contactPreference']; triage: string;
  resolution_at: string | null; resolution_by: string | null; resolution_text: string | null;
}
interface ActivityRow { id: string; case_id: string; at: string; kind: ActivityEntry['kind']; actor: string; text: string; body: string | null; internal: number }


function scope(req: Request): { where: string; params: string[] } {
  const u = req.user!;
  if (u.role === 'student') return { where: 'c.student_id = ?', params: [u.id] };
  if (u.role === 'staff') return { where: 'c.department_id = ?', params: [u.departmentId!] };
  return { where: '1 = 1', params: [] };
}

function toCase(row: CaseRow, activity: ActivityRow[], forStudent: boolean): Case {
  const t = JSON.parse(row.triage) as Case['triage'];
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    studentId: row.student_id,
    departmentId: row.department_id,
    category: row.category,
    priority: row.priority,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    assigneeId: row.assignee_id,
    contactPreference: row.contact_preference,
    triage: forStudent ? { ...t, confidence: 0, signals: [] } : t,
    activity: activity
      .filter((a) => !(forStudent && (a.internal || a.kind === 'note')))
      .map((a) => ({
        id: a.id, at: a.at, kind: a.kind, actor: a.actor, text: a.text,
        ...(a.body !== null ? { body: a.body } : {}),
        ...(a.internal ? { internal: true } : {}),
      })),
    ...(row.resolution_at ? { resolution: { at: row.resolution_at, by: row.resolution_by!, text: row.resolution_text! } } : {}),
  };
}

function listCases(req: Request): Case[] {
  const { where, params } = scope(req);
  const rows = db.prepare(`SELECT c.* FROM cases c WHERE ${where} ORDER BY c.seq`).all(...params) as unknown as CaseRow[];
  const acts = db.prepare(`SELECT a.* FROM activity a JOIN cases c ON c.id = a.case_id WHERE ${where} ORDER BY a.at, a.rowid`).all(...params) as unknown as ActivityRow[];
  const byCase = new Map<string, ActivityRow[]>();
  for (const a of acts) {
    const list = byCase.get(a.case_id) ?? [];
    list.push(a);
    byCase.set(a.case_id, list);
  }
  const forStudent = req.user!.role === 'student';
  return rows.map((r) => toCase(r, byCase.get(r.id) ?? [], forStudent));
}

function loadCase(req: Request, id: string): Case {
  const { where, params } = scope(req);
  const row = db.prepare(`SELECT c.* FROM cases c WHERE c.id = ? AND ${where}`).get(id.toUpperCase(), ...params) as CaseRow | undefined;
  if (!row) throw new HttpError(404, `Case ${id.toUpperCase()} was not found.`);
  const acts = db.prepare('SELECT * FROM activity WHERE case_id = ? ORDER BY at, rowid').all(row.id) as unknown as ActivityRow[];
  return toCase(row, acts, req.user!.role === 'student');
}


const now = () => new Date().toISOString();

function log(caseIdValue: string, e: Omit<ActivityEntry, 'id' | 'at'>, at = now()) {
  insertActivity(caseIdValue, { id: randomUUID(), at, ...e });
}

function touch(id: string, fields: Record<string, string | null> = {}) {
  const sets = Object.keys(fields).map((k) => `${k} = ?`);
  db.prepare(`UPDATE cases SET ${[...sets, 'updated_at = ?'].join(', ')} WHERE id = ?`).run(...Object.values(fields), now(), id);
}

function staffInDepartment(staffId: string, departmentId: string) {
  return !!db.prepare('SELECT 1 FROM staff WHERE id = ? AND department_id = ?').get(staffId, departmentId);
}
const staffName = (id: string) => (db.prepare('SELECT name FROM staff WHERE id = ?').get(id) as { name: string }).name;
const teamName = (deptId: string) => (db.prepare('SELECT team FROM departments WHERE id = ?').get(deptId) as { team: string } | undefined)?.team;

export const casesRouter = Router();

casesRouter.get('/cases', requireRole(), handler((req, res) => {
  res.json({ cases: listCases(req) });
}));

casesRouter.get('/cases/:id', requireRole(), handler((req, res) => {
  res.json({ case: loadCase(req, req.params.id) });
}));

casesRouter.post('/triage', requireRole('student'), handler(async (req, res) => {
  const text = str(req.body?.text, 'Description', { min: 3, max: 5000 });
  res.json(await analyse(text));
}));

casesRouter.post('/cases', requireRole('student'), handler((req, res) => {
  const title = str(req.body?.title, 'Summary', { max: 90 });
  const description = str(req.body?.description, 'Details', { min: 15, max: 5000 });
  const departmentId = str(req.body?.departmentId, 'Service', { max: 40 });
  const contactPreference = oneOf(req.body?.contactPreference ?? 'Email', CONTACT, 'Contact preference');
  const team = teamName(departmentId);
  if (!team) throw new HttpError(400, 'Choose a valid service.');

  const result = cachedTriage(description) ?? triage(`${title}. ${description}`);
  const match = [result.best, ...result.alternatives].find((m) => m?.dept === departmentId);
  const t = match
    ? { category: match.category, urgency: match.urgency, reason: match.reason, confidence: match.confidence, signals: match.signals }
    : { category: 'General enquiry', urgency: 'Medium' as Priority, reason: 'The student chose this service themselves.', confidence: 1, signals: [] };
  const priority: Priority = result.best?.crisis || result.best?.safety ? 'High' : t.urgency;

  const id = tx(() => {
    const { next } = db.prepare('SELECT COALESCE(MAX(seq), 0) + 1 AS next FROM cases').get() as { next: number };
    const at = now();
    const c: Case = {
      id: caseId(next), title, description, studentId: req.user!.id, departmentId, category: t.category, priority,
      status: 'New', createdAt: at, updatedAt: at, assigneeId: null, contactPreference,
      triage: { ...t, urgency: priority },
      activity: [
        { id: randomUUID(), at, kind: 'created', actor: req.user!.name, text: 'Request created' },
        { id: randomUUID(), at, kind: 'triage', actor: TRIAGE_ACTOR, text: 'AI classified request', body: `${t.category} · ${priority} urgency` },
        { id: randomUUID(), at, kind: 'assigned', actor: TRIAGE_ACTOR, text: `Assigned to ${team}` },
      ],
    };
    insertCase(c);
    return c.id;
  });
  res.status(201).json({ case: loadCase(req, id) });
}));

casesRouter.patch('/cases/:id', requireRole('staff', 'admin'), handler((req, res) => {
  const c = loadCase(req, req.params.id);
  const actor = req.user!.name;
  const body = req.body ?? {};

  tx(() => {
    let departmentId = c.departmentId;
    let assigneeId = c.assigneeId;

    if (body.departmentId !== undefined && body.departmentId !== c.departmentId) {
      if (req.user!.role !== 'admin') throw new HttpError(403, 'Only administrators can transfer a case to another department.');
      const team = teamName(String(body.departmentId));
      if (!team) throw new HttpError(400, 'Choose a valid department.');
      departmentId = String(body.departmentId);
      assigneeId = null;
      touch(c.id, { department_id: departmentId, assignee_id: null });
      log(c.id, { kind: 'assigned', actor, text: `Transferred to ${team}` });
    }

    if (body.assigneeId !== undefined && body.assigneeId !== assigneeId && departmentId === c.departmentId) {
      const next = body.assigneeId === null || body.assigneeId === '' ? null : String(body.assigneeId);
      if (next && !staffInDepartment(next, departmentId)) throw new HttpError(400, 'That person isn’t part of this department’s team.');
      touch(c.id, { assignee_id: next });
      log(c.id, { kind: 'assigned', actor, text: next ? `Assigned to ${staffName(next)}` : 'Returned to team queue' });
    }

    if (body.priority !== undefined && body.priority !== c.priority) {
      const p = oneOf(body.priority, PRIORITIES, 'Priority');
      touch(c.id, { priority: p });
      log(c.id, { kind: 'priority', actor, text: `Priority changed from ${c.priority} to ${p}` });
    }

    if (body.status !== undefined && body.status !== c.status) {
      const s = oneOf(body.status, STATUSES, 'Status');
      if (s === 'Resolved') throw new HttpError(400, 'Use “Resolve” and add a resolution summary to close a case.');
      touch(c.id, { status: s, resolution_at: null, resolution_by: null, resolution_text: null });
      log(c.id, { kind: 'status', actor, text: `Status changed from ${c.status} to ${s}` });
    }
  });
  res.json({ case: loadCase(req, c.id) });
}));

casesRouter.post('/cases/:id/messages', requireRole(), handler((req, res) => {
  const c = loadCase(req, req.params.id);
  const body = str(req.body?.body, 'Message', { min: 2, max: 5000 });
  const u = req.user!;

  tx(() => {
    if (u.role === 'student') {
      if (c.status === 'Resolved') throw new HttpError(409, 'This request is closed. Send a new request if you still need help.');
      log(c.id, { kind: 'student', actor: u.name, text: 'Student replied', body });
      if (c.status === 'Waiting') {
        touch(c.id, { status: 'In Progress' });
        log(c.id, { kind: 'status', actor: 'Campus Saathi', text: 'Status changed from Waiting to In Progress' });
      } else touch(c.id);
      return;
    }
    if (req.body?.internal === true) {
      log(c.id, { kind: 'note', actor: u.name, text: 'Internal note added', body, internal: true });
      touch(c.id);
      return;
    }
    log(c.id, { kind: 'response', actor: u.name, text: 'Response sent to student', body });
    const next: Status | null = req.body?.setWaiting === true ? 'Waiting' : c.status === 'New' ? 'In Progress' : null;
    if (next && next !== c.status) {
      touch(c.id, { status: next });
      log(c.id, { kind: 'status', actor: u.name, text: `Status changed from ${c.status} to ${next}` });
    } else touch(c.id);
  });
  res.status(201).json({ case: loadCase(req, c.id) });
}));

casesRouter.post('/cases/:id/resolve', requireRole('staff', 'admin'), handler((req, res) => {
  const c = loadCase(req, req.params.id);
  if (c.status === 'Resolved') throw new HttpError(409, 'This case is already resolved.');
  const text = str(req.body?.text, 'Resolution summary', { min: 10, max: 2000 });
  const at = now();
  tx(() => {
    touch(c.id, { status: 'Resolved', resolution_at: at, resolution_by: req.user!.name, resolution_text: text });
    log(c.id, { kind: 'resolved', actor: req.user!.name, text: 'Case resolved', body: text }, at);
  });
  res.json({ case: loadCase(req, c.id) });
}));

casesRouter.post('/cases/:id/reopen', requireRole('staff', 'admin'), handler((req, res) => {
  const c = loadCase(req, req.params.id);
  if (c.status !== 'Resolved') throw new HttpError(409, 'Only resolved cases can be reopened.');
  tx(() => {
    touch(c.id, { status: 'In Progress', resolution_at: null, resolution_by: null, resolution_text: null });
    log(c.id, { kind: 'status', actor: req.user!.name, text: 'Case reopened' });
  });
  res.json({ case: loadCase(req, c.id) });
}));

casesRouter.post('/admin/reset-demo', requireRole('admin'), handler((_req, res) => {
  seedCases();
  res.json({ ok: true });
}));

