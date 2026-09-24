import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { useCases } from '../../data/CaseStore';
import { departmentById, staffById, studentById } from '../../data/directory';
import type { Case } from '../../data/types';
import { useDataLoading, useTitle } from '../../lib/hooks';
import { CaseTable } from '../../components/CaseTable';
import { EmptyState, SkeletonRows } from '../../components/ui';
import { useToast } from '../../components/Toast';
import { errorMessage } from '../../lib/api';

const FILTERS: { key: string; label: string; test: (c: Case) => boolean }[] = [
  { key: 'all', label: 'All', test: (c) => c.status !== 'Resolved' },
  { key: 'high', label: 'High Priority', test: (c) => c.status !== 'Resolved' && c.priority === 'High' },
  { key: 'new', label: 'New', test: (c) => c.status === 'New' },
  { key: 'progress', label: 'In Progress', test: (c) => c.status === 'In Progress' },
  { key: 'waiting', label: 'Waiting', test: (c) => c.status === 'Waiting' },
  { key: 'resolved', label: 'Resolved', test: (c) => c.status === 'Resolved' },
];

function matches(c: Case, q: string) {
  if (!q) return true;
  const s = studentById(c.studentId);
  return [c.id, c.title, c.category, s?.name, s?.studentNumber].some((v) => v?.toLowerCase().includes(q));
}

export default function StaffCases({ scope }: { scope: 'mine' | 'queue' }) {
  useTitle(scope === 'mine' ? 'My Assigned Cases' : 'Team Queue');
  const { user } = useAuth();
  const { cases, updateCase } = useCases();
  const notify = useToast();
  const loading = useDataLoading();
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  const me = staffById(user!.id)!;
  const dept = departmentById(me.departmentId)!;

  const base = useMemo(
    () => cases.filter((c) => (scope === 'mine' ? c.assigneeId === me.id : c.departmentId === me.departmentId)),
    [cases, scope, me],
  );
  const active = FILTERS.find((f) => f.key === filter)!;
  const term = q.trim().toLowerCase();
  const rows = base.filter((c) => active.test(c) && matches(c, term));
  const unassigned = base.filter((c) => !c.assigneeId && c.status !== 'Resolved').length;
  const high = base.filter((c) => c.priority === 'High' && c.status !== 'Resolved').length;

  const takeCase = (c: Case) => {
    updateCase(c.id, { assigneeId: me.id, ...(c.status === 'New' ? { status: 'In Progress' as const } : {}) })
      .then(() => notify(`${c.id} assigned to you`, c.title))
      .catch((e) => notify('Couldn’t assign this case', errorMessage(e), 'error'));
  };

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 1400 }}>
        <div className="page-head">
          <div>
            <div className="eyebrow">{dept.team}</div>
            <h1>{scope === 'mine' ? 'My Assigned Cases' : 'Team Queue'}</h1>
            <p className="sub">
              {scope === 'mine'
                ? `${base.filter((c) => c.status !== 'Resolved').length} open cases assigned to you${high ? ` · ${high} high priority` : ''}`
                : `All cases for ${dept.name} · ${unassigned} waiting to be picked up`}
            </p>
          </div>
        </div>

        <section className="panel">
          <div className="tabs" role="tablist" style={{ padding: '0 10px' }}>
            {FILTERS.map((f) => (
              <button key={f.key} role="tab" aria-selected={filter === f.key} className={`tab${filter === f.key ? ' active' : ''}`} onClick={() => setFilter(f.key)}>
                {f.label} <span className="count">{base.filter(f.test).length}</span>
              </button>
            ))}
          </div>
          <div className="toolbar">
            <div className="input-icon">
              <Search size={16} />
              <input className="input sm" placeholder="Search by case, student or keyword" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search cases" />
            </div>
            <span className="small muted">{rows.length} case{rows.length === 1 ? '' : 's'}</span>
          </div>
          {loading ? <SkeletonRows rows={6} cols={6} /> : (
            <CaseTable
              cases={rows}
              basePath="/staff/cases"
              initialSort="priority"
              columns={scope === 'mine'
                ? ['id', 'student', 'title', 'category', 'priority', 'status', 'updated']
                : ['id', 'student', 'title', 'priority', 'status', 'assignee', 'updated']}
              rowAction={scope === 'queue' ? (c) => (!c.assigneeId && c.status !== 'Resolved'
                ? <button className="btn btn-secondary btn-sm" onClick={() => takeCase(c)}>Assign to me</button>
                : null) : undefined}
              empty={
                <EmptyState title={term ? 'No cases match your search' : filter === 'all' ? 'You’re all caught up' : `No ${active.label.toLowerCase()} cases`}>
                  {term ? 'Try a case number, student name or student ID.'
                    : scope === 'mine' && filter === 'all' ? 'There are no open cases assigned to you. New cases for your team appear in the Team Queue.'
                    : 'Cases will appear here when they match this filter.'}
                </EmptyState>
              }
            />
          )}
        </section>
      </div>
    </div>
  );
}
