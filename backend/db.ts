import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { ADMIN, DEPARTMENTS, STAFF, STUDENTS } from '../frontend/src/data/directory';
import { buildSeed } from '../frontend/src/data/seed';
import type { ActivityEntry, Case } from '../frontend/src/data/types';
import { hashPassword, verifyPassword } from './passwords';

export const DB_PATH = process.env.DB_PATH ?? path.resolve('data', 'campuscare.db');
mkdirSync(path.dirname(DB_PATH), { recursive: true });

export const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

db.exec(`
  CREATE TABLE IF NOT EXISTS departments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    team TEXT NOT NULL,
    description TEXT NOT NULL,
    helps_with TEXT NOT NULL,           -- JSON array
    location TEXT NOT NULL,
    hours TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    target_response TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    preferred_name TEXT NOT NULL,
    student_number TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    programme TEXT NOT NULL,
    faculty TEXT NOT NULL,
    year TEXT NOT NULL,
    mode TEXT NOT NULL,
    fee_status TEXT NOT NULL,
    tutor TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS staff (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    title TEXT NOT NULL,
    department_id TEXT NOT NULL REFERENCES departments(id),
    email TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,                -- same id as the student / staff / admin record
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('student', 'staff', 'admin')),
    name TEXT NOT NULL,
    title TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS cases (
    id TEXT PRIMARY KEY,
    seq INTEGER NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    student_id TEXT NOT NULL REFERENCES students(id),
    department_id TEXT NOT NULL REFERENCES departments(id),
    category TEXT NOT NULL,
    priority TEXT NOT NULL CHECK (priority IN ('High', 'Medium', 'Low')),
    status TEXT NOT NULL CHECK (status IN ('New', 'In Progress', 'Waiting', 'Resolved')),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    assignee_id TEXT REFERENCES staff(id),
    contact_preference TEXT NOT NULL,
    triage TEXT NOT NULL,               -- JSON
    resolution_at TEXT,
    resolution_by TEXT,
    resolution_text TEXT
  );
  CREATE INDEX IF NOT EXISTS cases_student ON cases(student_id);
  CREATE INDEX IF NOT EXISTS cases_department ON cases(department_id);

  CREATE TABLE IF NOT EXISTS activity (
    id TEXT PRIMARY KEY,
    case_id TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    at TEXT NOT NULL,
    kind TEXT NOT NULL,
    actor TEXT NOT NULL,
    text TEXT NOT NULL,
    body TEXT,
    internal INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS activity_case ON activity(case_id, at);
`);

/** Runs fn inside a transaction, rolling back if it throws. */
export function tx<T>(fn: () => T): T {
  db.exec('BEGIN IMMEDIATE');
  try {
    const out = fn();
    db.exec('COMMIT');
    return out;
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}

/** Password every seeded account uses in this prototype. */
export const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? 'CampusSaathi2026';

function seedDirectory() {
  const insDept = db.prepare(`INSERT INTO departments VALUES (?,?,?,?,?,?,?,?,?,?)`);
  for (const d of DEPARTMENTS) {
    insDept.run(d.id, d.name, d.team, d.description, JSON.stringify(d.helpsWith), d.location, d.hours, d.phone, d.email, d.targetResponse);
  }
  const insStudent = db.prepare(`INSERT INTO students VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`);
  const insStaff = db.prepare(`INSERT INTO staff VALUES (?,?,?,?,?)`);
  const insUser = db.prepare(`INSERT INTO users VALUES (?,?,?,?,?,?)`);
  const hash = hashPassword(DEMO_PASSWORD); // one hash is enough for demo accounts
  for (const s of STUDENTS) {
    insStudent.run(s.id, s.name, s.preferredName, s.studentNumber, s.email, s.phone, s.programme, s.faculty, s.year, s.mode, s.feeStatus, s.tutor);
    insUser.run(s.id, s.email, hash, 'student', s.name, `${s.programme} · ${s.year}`);
  }
  for (const m of STAFF) {
    insStaff.run(m.id, m.name, m.title, m.departmentId, m.email);
    insUser.run(m.id, m.email, hash, 'staff', m.name, m.title);
  }
  insUser.run(ADMIN.id, ADMIN.email, hash, 'admin', ADMIN.name, ADMIN.title);
}

export function insertCase(c: Case) {
  db.prepare(`INSERT INTO cases VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    c.id, parseInt(c.id.slice(2), 10), c.title, c.description, c.studentId, c.departmentId, c.category, c.priority, c.status,
    c.createdAt, c.updatedAt, c.assigneeId, c.contactPreference, JSON.stringify(c.triage),
    c.resolution?.at ?? null, c.resolution?.by ?? null, c.resolution?.text ?? null,
  );
  for (const a of c.activity) insertActivity(c.id, a);
}

export function insertActivity(caseId: string, a: ActivityEntry) {
  db.prepare(`INSERT INTO activity VALUES (?,?,?,?,?,?,?,?)`).run(
    a.id, caseId, a.at, a.kind, a.actor, a.text, a.body ?? null, a.internal ? 1 : 0,
  );
}

export function seedCases() {
  tx(() => {
    db.exec('DELETE FROM activity; DELETE FROM cases;');
    for (const c of buildSeed()) insertCase(c);
  });
}

// Keep department details in step with src/data/directory.ts on every start.
const syncDept = db.prepare('UPDATE departments SET name = ?, team = ?, description = ?, helps_with = ? WHERE id = ?');
for (const d of DEPARTMENTS) syncDept.run(d.name, d.team, d.description, JSON.stringify(d.helpsWith), d.id);

// Rename carried over from the old product name in saved history.
db.prepare("UPDATE activity SET actor = REPLACE(actor, 'CampusCare', 'Campus Saathi') WHERE actor LIKE 'CampusCare%'").run();

// Databases created before the rename used the old demo password: move them to the current one.
const LEGACY_DEMO_PASSWORD = 'CampusCare2026';
const sample = db.prepare('SELECT password_hash FROM users LIMIT 1').get() as { password_hash: string } | undefined;
if (sample && !verifyPassword(DEMO_PASSWORD, sample.password_hash) && verifyPassword(LEGACY_DEMO_PASSWORD, sample.password_hash)) {
  db.prepare('UPDATE users SET password_hash = ?').run(hashPassword(DEMO_PASSWORD));
  console.log('Updated demo accounts to the current demo password.');
}

// First start: create the directory, accounts and sample cases.
const hasDirectory = db.prepare('SELECT COUNT(*) AS n FROM departments').get() as { n: number };
if (hasDirectory.n === 0) {
  tx(seedDirectory);
  seedCases();
  console.log(`Seeded new database at ${DB_PATH}`);
}
