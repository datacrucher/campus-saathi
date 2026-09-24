import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, ChevronRight } from 'lucide-react';
import { useCases } from '../../data/CaseStore';
import { DEPARTMENTS, departmentById, studentById } from '../../data/directory';
import { departmentStats, isOpen, needsAttention } from '../../lib/stats';
import { useDataLoading, useTitle } from '../../lib/hooks';
import { HBarChart } from '../../components/Charts';
import { CaseTable } from '../../components/CaseTable';
import { EmptyState, PriorityLabel, SkeletonRows } from '../../components/ui';

export default function Overview() {
  useTitle('Overview');
  const { cases } = useCases();
  const navigate = useNavigate();
  const loading = useDataLoading();
  const [chartView, setChartView] = useState<'chart' | 'table'>('chart');

  const stats = useMemo(() => departmentStats(cases), [cases]);
  const attention = useMemo(() => needsAttention(cases, 6), [cases]);
  const recent = useMemo(() => [...cases].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8), [cases]);

  const total = cases.length;
  const open = cases.filter(isOpen).length;
  const inProgress = cases.filter((c) => c.status === 'In Progress').length;
  const resolved = cases.filter((c) => c.status === 'Resolved').length;
  const high = cases.filter((c) => isOpen(c) && c.priority === 'High').length;
  const today = cases.filter((c) => new Date(c.createdAt).toDateString() === new Date().toDateString()).length;

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 1400 }}>
        <div className="page-head">
          <div>
            <div className="eyebrow">Overview</div>
            <h1>Student Support Operations</h1>
            <p className="sub">Monitor support activity across all {DEPARTMENTS.length} departments.</p>
          </div>
          <span className="small muted">Last 30 days · Updated just now</span>
        </div>

        <div className="metrics" aria-label="Key figures">
          <div className="metric"><div className="m-label">Total Requests</div><div className="m-value">{total}</div><div className="m-foot">{today} received today</div></div>
          <div className="metric"><div className="m-label">Open Cases</div><div className="m-value">{open}</div><div className="m-foot">Not yet resolved</div></div>
          <div className="metric"><div className="m-label">In Progress</div><div className="m-value">{inProgress}</div><div className="m-foot">Being worked on</div></div>
          <div className="metric"><div className="m-label">Resolved</div><div className="m-value">{resolved}</div><div className="m-foot">{Math.round((resolved / Math.max(1, total)) * 100)}% of all requests</div></div>
          <div className={`metric${high ? ' alert-metric' : ''}`}><div className="m-label">{high > 0 && <AlertTriangle size={13} color="var(--danger)" />} High Priority</div><div className="m-value">{high}</div><div className="m-foot">Open and marked high</div></div>
        </div>

        <div className="grid-2 overview-grid" style={{ marginTop: 20 }}>
          <section className="panel">
            <div className="panel-head">
              <div>
                <h2>Requests by Department</h2>
                <span className="hint">All requests in the period · select a department to see its cases</span>
              </div>
              <div className="chart-toggle" role="group" aria-label="Display as">
                <button className={chartView === 'chart' ? 'on' : ''} onClick={() => setChartView('chart')} aria-pressed={chartView === 'chart'}>Chart</button>
                <button className={chartView === 'table' ? 'on' : ''} onClick={() => setChartView('table')} aria-pressed={chartView === 'table'}>Table</button>
              </div>
            </div>
            <div className="panel-body">
              {loading ? (
                <div aria-busy="true">{Array.from({ length: 8 }).map((_, i) => <span key={i} className="skeleton" style={{ height: 14, width: `${90 - i * 9}%`, margin: '10px 0' }} />)}</div>
              ) : chartView === 'chart' ? (
                <HBarChart
                  valueLabel="Requests"
                  data={stats.map((s) => ({ id: s.id, label: s.name, value: s.total, detail: [['Open', s.open], ['Resolved', s.resolved]] }))}
                  onSelect={(id) => navigate(`/admin/departments/${id}`)}
                />
              ) : (
                <table className="table">
                  <thead><tr><th>Department</th><th className="num">Requests</th><th className="num">Open</th></tr></thead>
                  <tbody>
                    {[...stats].sort((a, b) => b.total - a.total).map((s) => (
                      <tr key={s.id}><td>{s.name}</td><td className="num">{s.total}</td><td className="num">{s.open}</td></tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          <section className="panel">
            <div className="panel-head">
              <h2>Needs Attention</h2>
              <span className="hint">{attention.length} case{attention.length === 1 ? '' : 's'}</span>
            </div>
            {loading ? <SkeletonRows rows={4} cols={1} /> : attention.length === 0 ? (
              <EmptyState title="Nothing needs attention">No urgent, stalled or unassigned cases right now.</EmptyState>
            ) : (
              <ul className="list">
                {attention.map(({ c, reason }) => (
                  <li key={c.id}>
                    <Link to={`/admin/cases/${c.id}`} className="list-link attention-item">
                      <span className="ll-main">
                        <span className="row" style={{ gap: 8 }}>
                          <span className="mono small" style={{ fontWeight: 600 }}>{c.id}</span>
                          <PriorityLabel priority={c.priority} />
                        </span>
                        <span className="ll-title truncate" style={{ display: 'block', marginTop: 2 }}>{c.title}</span>
                        <span className="ll-sub" style={{ display: 'block' }}>{studentById(c.studentId)?.name} · {departmentById(c.departmentId)?.team}</span>
                        <span className="attention-reason">{reason}</span>
                      </span>
                      <ChevronRight size={16} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <section className="panel" style={{ marginTop: 20 }}>
          <div className="panel-head">
            <h2>Recent Requests</h2>
            <Link to="/admin/cases" className="small">View all cases</Link>
          </div>
          {loading ? <SkeletonRows rows={6} cols={7} /> : (
            <CaseTable
              cases={recent}
              basePath="/admin/cases"
              initialSort="updated"
              pageSize={8}
              columns={['id', 'student', 'department', 'category', 'priority', 'status', 'updated']}
            />
          )}
        </section>
      </div>
    </div>
  );
}
