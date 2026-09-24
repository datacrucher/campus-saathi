import type { Case, Priority } from '../data/types';
import { DEPARTMENTS } from '../data/directory';
import { DAY, HOUR } from './format';

export const PRIORITY_RANK: Record<Priority, number> = { High: 0, Medium: 1, Low: 2 };

/** Response targets in hours, matching each department's published target. */
export const TARGET_HOURS: Record<string, number> = {
  counselling: 24, advising: 48, registry: 72, finance: 48, aid: 48, accommodation: 24,
  it: 4, library: 48, disability: 72, international: 48, careers: 72, security: 1,
};

export const isOpen = (c: Case) => c.status !== 'Resolved';

export function firstResponseMs(c: Case) {
  const r = c.activity.find((a) => a.kind === 'response');
  return r ? new Date(r.at).getTime() - new Date(c.createdAt).getTime() : null;
}

export function resolutionMs(c: Case) {
  return c.resolution ? new Date(c.resolution.at).getTime() - new Date(c.createdAt).getTime() : null;
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);

export interface DeptStats {
  id: string;
  name: string;
  total: number;
  open: number;
  newCount: number;
  inProgress: number;
  waiting: number;
  resolved: number;
  high: number;
  avgResolutionMs: number;
  avgFirstResponseMs: number;
  withinTarget: number; // 0..1 of cases with a first response
}

export function departmentStats(cases: Case[]): DeptStats[] {
  return DEPARTMENTS.map((d) => {
    const list = cases.filter((c) => c.departmentId === d.id);
    const responded = list.map(firstResponseMs).filter((x): x is number => x !== null);
    const target = TARGET_HOURS[d.id] * HOUR;
    return {
      id: d.id,
      name: d.name,
      total: list.length,
      open: list.filter(isOpen).length,
      newCount: list.filter((c) => c.status === 'New').length,
      inProgress: list.filter((c) => c.status === 'In Progress').length,
      waiting: list.filter((c) => c.status === 'Waiting').length,
      resolved: list.filter((c) => c.status === 'Resolved').length,
      high: list.filter((c) => isOpen(c) && c.priority === 'High').length,
      avgResolutionMs: mean(list.map(resolutionMs).filter((x): x is number => x !== null)),
      avgFirstResponseMs: mean(responded),
      withinTarget: responded.length ? responded.filter((x) => x <= target).length / responded.length : NaN,
    };
  });
}

export interface AttentionItem { c: Case; reason: string }

/** Cases a service manager should look at: urgent, stalled or unassigned for too long. */
export function needsAttention(cases: Case[], limit = 6): AttentionItem[] {
  const now = Date.now();
  const items: (AttentionItem & { score: number })[] = [];
  for (const c of cases) {
    if (!isOpen(c)) continue;
    const age = now - new Date(c.createdAt).getTime();
    const idle = now - new Date(c.updatedAt).getTime();
    if (c.priority === 'High' && !c.assigneeId) items.push({ c, reason: 'High priority · unassigned', score: 0 });
    else if (c.priority === 'High' && c.status === 'New') items.push({ c, reason: 'High priority · not started', score: 1 });
    else if (!c.assigneeId && age > DAY) items.push({ c, reason: `Unassigned for ${Math.floor(age / DAY)} day${age >= 2 * DAY ? 's' : ''}`, score: 2 });
    else if (c.status === 'Waiting' && idle > 5 * DAY) items.push({ c, reason: `Waiting on student for ${Math.floor(idle / DAY)} days`, score: 4 });
    else if (c.priority === 'High' && idle > DAY) items.push({ c, reason: `High priority · no update for ${Math.floor(idle / DAY)} day${idle >= 2 * DAY ? 's' : ''}`, score: 3 });
  }
  return items.sort((a, b) => a.score - b.score || a.c.createdAt.localeCompare(b.c.createdAt)).slice(0, limit);
}

export function niceMax(v: number) {
  if (v <= 5) return 5;
  const pow = 10 ** Math.floor(Math.log10(v));
  const n = v / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  return step * pow;
}
