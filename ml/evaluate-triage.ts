/**
 * Scores the keyword triage against the labelled queries in ml/dataset/student_queries.csv.
 * Writes ml/dataset/evaluation_results.csv and prints a summary.
 *
 *   npm run dataset:evaluate
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { triage } from './triage';
import { departmentById } from '../frontend/src/data/directory';
import { parseCsv, toCsv } from './csv';

const rows = parseCsv(readFileSync('ml/dataset/student_queries.csv', 'utf8'));
const out: (string | number)[][] = [[
  'id', 'text', 'difficulty', 'expected_department', 'predicted_department', 'department_correct',
  'expected_category', 'predicted_category', 'category_correct', 'expected_urgency', 'predicted_urgency', 'urgency_correct', 'matched_terms',
]];

let dept = 0, cat = 0, urg = 0, noMatch = 0;
const byDifficulty: Record<string, { n: number; ok: number }> = {};
const byDept: Record<string, { n: number; ok: number }> = {};

for (const r of rows) {
  const { best } = triage(r.text);
  const pDept = best?.dept ?? 'none';
  const pCat = best?.category ?? 'none';
  const pUrg = best?.urgency ?? 'none';
  const dOk = pDept === r.department_id;
  const cOk = pCat === r.category;
  const uOk = pUrg === r.urgency;
  if (dOk) dept++;
  if (cOk) cat++;
  if (uOk) urg++;
  if (!best) noMatch++;
  (byDifficulty[r.difficulty] ??= { n: 0, ok: 0 }).n++;
  if (dOk) byDifficulty[r.difficulty].ok++;
  (byDept[r.department_id] ??= { n: 0, ok: 0 }).n++;
  if (dOk) byDept[r.department_id].ok++;
  out.push([r.id, r.text, r.difficulty, r.department_id, pDept, dOk ? 'yes' : 'no', r.category, pCat, cOk ? 'yes' : 'no',
    r.urgency, pUrg, uOk ? 'yes' : 'no', (best?.signals ?? []).join('; ')]);
}

writeFileSync('ml/dataset/evaluation_results.csv', toCsv(out));

const pct = (a: number, b: number) => `${((a / b) * 100).toFixed(1)}%`;
const n = rows.length;
console.log(`Keyword triage on ${n} labelled queries\n`);
console.log(`Department accuracy : ${dept}/${n} (${pct(dept, n)})`);
console.log(`Category accuracy   : ${cat}/${n} (${pct(cat, n)})`);
console.log(`Urgency accuracy    : ${urg}/${n} (${pct(urg, n)})`);
console.log(`No match            : ${noMatch}\n`);
for (const [k, v] of Object.entries(byDifficulty)) console.log(`  ${k.padEnd(9)} department accuracy ${v.ok}/${v.n} (${pct(v.ok, v.n)})`);
console.log('\nPer department:');
for (const [k, v] of Object.entries(byDept)) console.log(`  ${(departmentById(k)?.name ?? k).padEnd(36)} ${v.ok}/${v.n}`);
console.log('\nMisrouted:');
for (const row of out.slice(1)) if (row[5] === 'no') console.log(`  ${row[0]} [${row[2]}] expected ${row[3]}, got ${row[4]} — ${row[1]}`);
console.log('\nFull results: ml/dataset/evaluation_results.csv');
