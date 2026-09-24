import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download, Search, X } from 'lucide-react';
import { useCases } from '../../data/CaseStore';
import { DEPARTMENTS, departmentById, staffById, studentById } from '../../data/directory';
import { PRIORITIES, STATUSES, type Case } from '../../data/types';
import { useDataLoading, useTitle } from '../../lib/hooks';
import { downloadCsv } from '../../lib/csv';
import { CaseTable } from '../../components/CaseTable';
import { EmptyState, SkeletonRows } from '../../components/ui';

export default function Cases() {
  useTitle('Cases');
  const { cases } = useCases();
  const loading = useDataLoading();
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const department = params.get('department') ?? '';
  const status = params.get('status') ?? 'open';
  const priority = params.get('priority') ?? '';

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    setParams(next, { replace: true });
  };

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return cases.filter((c) => {
      if (department && c.departmentId !== department) return false;
      if (status === 'open' && c.status === 'Resolved') return false;
      if (status && status !== 'open' && status !== 'all' && c.status !== status) return false;
      if (priority && c.priority !== priority) return false;
      if (term) {
        const s = studentById(c.studentId);
        return [c.id, c.title, c.category, s?.name, s?.studentNumber].some((v) => v?.toLowerCase().includes(term));
      }
      return true;
    });
  }, [cases, q, department, status, priority]);

  const filtered = q || department || priority || status !== 'open';

  const exportRows = () => downloadCsv('campus-saathi-cases.csv', [
    ['Case ID', 'Title', 'Student', 'Student ID', 'Department', 'Category', 'Priority', 'Status', 'Assigned to', 'Created', 'Updated'],
    ...rows.map((c: Case) => {
      const s = studentById(c.studentId);
      return [c.id, c.title, s?.name ?? '', s?.studentNumber ?? '', departmentById(c.departmentId)?.name ?? '', c.category, c.priority, c.status,
        staffById(c.assigneeId)?.name ?? '', c.createdAt, c.updatedAt];
    }),
  ]);

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 1400 }}>
        <div className="page-head">
          <div>
            <h1>Cases</h1>
            <p className="sub">Every student support request across all departments.</p>
          </div>
          <button className="btn btn-secondary" onClick={exportRows} disabled={!rows.length}><Download size={16} /> Export CSV</button>
        </div>
        <section className="panel">
          <div className="toolbar">
            <div className="input-icon">
              <Search size={16} />
              <input className="input sm" placeholder="Search case, student or keyword" value={q} onChange={(e) => set('q', e.target.value)} aria-label="Search cases" />
            </div>
            <select className="select sm" style={{ width: 'auto' }} value={department} onChange={(e) => set('department', e.target.value)} aria-label="Department">
              <option value="">All departments</option>
              {DEPARTMENTS.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <select className="select sm" style={{ width: 'auto' }} value={status} onChange={(e) => set('status', e.target.value === 'open' ? '' : e.target.value)} aria-label="Status">
              <option value="open">All open</option>
              <option value="all">Any status</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select className="select sm" style={{ width: 'auto' }} value={priority} onChange={(e) => set('priority', e.target.value)} aria-label="Priority">
              <option value="">Any priority</option>
              {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            {filtered && <button className="btn btn-ghost btn-sm" onClick={() => setParams({}, { replace: true })}><X size={14} /> Clear</button>}
            <span className="spacer" />
            <span className="small muted">{rows.length} case{rows.length === 1 ? '' : 's'}</span>
          </div>
          {loading ? <SkeletonRows rows={8} cols={8} /> : (
            <CaseTable
              cases={rows}
              basePath="/admin/cases"
              columns={['id', 'student', 'department', 'category', 'priority', 'status', 'assignee', 'updated']}
              empty={<EmptyState title="No cases match these filters" icon={<Search size={20} />}
                action={<button className="btn btn-secondary" onClick={() => setParams({}, { replace: true })}>Clear filters</button>}>
                Try removing a filter or searching for a case number instead.
              </EmptyState>}
            />
          )}
        </section>
      </div>
    </div>
  );
}
