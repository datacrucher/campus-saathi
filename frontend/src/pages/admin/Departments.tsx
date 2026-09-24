import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useCases } from '../../data/CaseStore';
import { departmentById, staffForDepartment } from '../../data/directory';
import { durationLabel } from '../../lib/format';
import { departmentStats, isOpen } from '../../lib/stats';
import { useDataLoading, useTitle } from '../../lib/hooks';
import { CaseTable } from '../../components/CaseTable';
import { EmptyState, ErrorState, SkeletonRows } from '../../components/ui';

export function Departments() {
  useTitle('Departments');
  const { cases } = useCases();
  const navigate = useNavigate();
  const loading = useDataLoading();
  const stats = useMemo(() => departmentStats(cases), [cases]);
  const totals = stats.reduce((t, s) => ({ total: t.total + s.total, open: t.open + s.open, inProgress: t.inProgress + s.inProgress, resolved: t.resolved + s.resolved }),
    { total: 0, open: 0, inProgress: 0, resolved: 0 });

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 1400 }}>
        <div className="page-head">
          <div>
            <h1>Departments</h1>
            <p className="sub">Request volume and resolution time for each of the {stats.length} student services.</p>
          </div>
        </div>
        <section className="panel">
          {loading ? <SkeletonRows rows={12} cols={6} /> : (
            <div className="table-wrap">
              <table className="table responsive">
                <thead>
                  <tr>
                    <th>Department</th>
                    <th className="num">Requests</th>
                    <th className="num">Open</th>
                    <th className="num">In Progress</th>
                    <th className="num">Resolved</th>
                    <th className="num">Avg. Resolution</th>
                    <th aria-hidden="true" />
                  </tr>
                </thead>
                <tbody>
                  {stats.map((s) => {
                    const d = departmentById(s.id)!;
                    return (
                      <tr key={s.id} className="clickable" onClick={() => navigate(`/admin/departments/${s.id}`)}>
                        <td className="cell-title">
                          <Link to={`/admin/departments/${s.id}`} className="primary-cell" onClick={(e) => e.stopPropagation()}>{s.name}</Link>
                          <div className="sub-cell">{d.team} · {staffForDepartment(s.id).length} staff</div>
                        </td>
                        <td data-label="Requests" className="num">{s.total}</td>
                        <td data-label="Open" className="num">{s.open}{s.high > 0 && <span className="high-flag" title={`${s.high} high priority`}>{s.high} high</span>}</td>
                        <td data-label="In Progress" className="num">{s.inProgress}</td>
                        <td data-label="Resolved" className="num">{s.resolved}</td>
                        <td data-label="Avg. Resolution" className="num">{durationLabel(s.avgResolutionMs)}</td>
                        <td className="hide-sm" style={{ width: 32 }}><ChevronRight size={16} className="muted" /></td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="total-row">
                    <td>All departments</td>
                    <td data-label="Requests" className="num">{totals.total}</td>
                    <td data-label="Open" className="num">{totals.open}</td>
                    <td data-label="In Progress" className="num">{totals.inProgress}</td>
                    <td data-label="Resolved" className="num">{totals.resolved}</td>
                    <td className="num" data-label="Avg. Resolution">{durationLabel(avg(stats.map((s) => s.avgResolutionMs)))}</td>
                    <td className="hide-sm" />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

const avg = (xs: number[]) => {
  const v = xs.filter((x) => Number.isFinite(x));
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : NaN;
};

export function DepartmentDetail() {
  const { id = '' } = useParams();
  const d = departmentById(id);
  useTitle(d?.name ?? 'Department not found');
  const { cases } = useCases();
  const stats = useMemo(() => departmentStats(cases).find((s) => s.id === id), [cases, id]);
  const list = useMemo(() => cases.filter((c) => c.departmentId === id), [cases, id]);

  if (!d || !stats) {
    return (
      <div className="page"><div className="container"><div className="panel">
        <ErrorState title="Department not found" action={<Link to="/admin/departments" className="btn btn-secondary">All departments</Link>}>
          The link may be out of date.
        </ErrorState>
      </div></div></div>
    );
  }

  const staff = staffForDepartment(id);
  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 1400 }}>
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link to="/admin/departments">Departments</Link><ChevronRight size={13} /><span>{d.name}</span>
        </nav>
        <div className="page-head">
          <div>
            <h1>{d.name}</h1>
            <p className="sub">{d.team} · {d.location} · Target response {d.targetResponse.toLowerCase()}</p>
          </div>
          <Link to={`/admin/cases?department=${id}&status=all`} className="btn btn-secondary">Open in Cases</Link>
        </div>

        <div className="metrics">
          <div className="metric"><div className="m-label">Requests</div><div className="m-value">{stats.total}</div></div>
          <div className="metric"><div className="m-label">Open</div><div className="m-value">{stats.open}</div><div className="m-foot">{stats.newCount} new · {stats.waiting} waiting</div></div>
          <div className="metric"><div className="m-label">In Progress</div><div className="m-value">{stats.inProgress}</div></div>
          <div className="metric"><div className="m-label">Resolved</div><div className="m-value">{stats.resolved}</div></div>
          <div className="metric"><div className="m-label">Avg. Resolution</div><div className="m-value">{durationLabel(stats.avgResolutionMs)}</div></div>
        </div>

        <div className="grid-2" style={{ marginTop: 20 }}>
          <section className="panel">
            <div className="panel-head"><h2>Cases</h2><span className="hint">{list.filter(isOpen).length} open of {list.length}</span></div>
            <CaseTable
              cases={list}
              basePath="/admin/cases"
              initialSort="status"
              columns={['id', 'student', 'category', 'priority', 'status', 'assignee', 'updated']}
              empty={<EmptyState title="No cases yet">Requests routed to this department will appear here.</EmptyState>}
            />
          </section>
          <aside className="stack">
            <section className="panel">
              <div className="panel-head"><h2>Team</h2></div>
              <ul className="list">
                {staff.map((m) => {
                  const load = cases.filter((c) => c.assigneeId === m.id && isOpen(c)).length;
                  return (
                    <li key={m.id} style={{ padding: '12px 18px', display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                      <span><span style={{ fontWeight: 500, fontSize: 14, display: 'block' }}>{m.name}</span><span className="small muted">{m.title}</span></span>
                      <span className="small text-2 nowrap">{load} open</span>
                    </li>
                  );
                })}
              </ul>
            </section>
            <section className="panel">
              <div className="panel-head"><h2>Service details</h2></div>
              <div className="panel-body small" style={{ display: 'grid', gap: 6 }}>
                <span>{d.hours}</span>
                <span>{d.phone}</span>
                <a href={`mailto:${d.email}`}>{d.email}</a>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
