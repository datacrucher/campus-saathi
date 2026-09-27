
import { writeFileSync } from 'node:fs';
import { db } from '../backend/db';
import { toCsv } from './csv';

function exportTable(file: string, sql: string) {
  const rows = db.prepare(sql).all() as Record<string, string | number | null>[];
  if (!rows.length) return console.log(`  ${file}: no rows`);
  const header = Object.keys(rows[0]);
  writeFileSync(`ml/dataset/${file}`, toCsv([header, ...rows.map((r) => header.map((h) => r[h]))]));
  console.log(`  ${file}: ${rows.length} rows`);
}

console.log('Exporting from the Campus Saathi database:');
exportTable('departments.csv', `SELECT id, name, team, description, helps_with, location, hours, phone, email, target_response FROM departments ORDER BY name`);
exportTable('students.csv', `SELECT id, name, preferred_name, student_number, email, programme, faculty, year, mode, fee_status, tutor FROM students ORDER BY name`);
exportTable('staff.csv', `SELECT s.id, s.name, s.title, s.department_id, d.name AS department, s.email FROM staff s JOIN departments d ON d.id = s.department_id ORDER BY d.name, s.name`);
exportTable('cases.csv', `
  SELECT c.id, c.title, c.description, c.student_id, st.name AS student, c.department_id, d.name AS department, c.category,
         c.priority, c.status, c.assignee_id, sf.name AS assignee, c.contact_preference, c.created_at, c.updated_at,
         json_extract(c.triage, '$.reason') AS triage_reason, json_extract(c.triage, '$.confidence') AS triage_confidence,
         c.resolution_at, c.resolution_by, c.resolution_text
  FROM cases c
  JOIN students st ON st.id = c.student_id
  JOIN departments d ON d.id = c.department_id
  LEFT JOIN staff sf ON sf.id = c.assignee_id
  ORDER BY c.seq`);
exportTable('case_activity.csv', `SELECT a.case_id, a.at, a.kind, a.actor, a.text, a.body, a.internal FROM activity a JOIN cases c ON c.id = a.case_id ORDER BY c.seq, a.at, a.rowid`);
console.log('Passwords and login sessions are never exported.');
