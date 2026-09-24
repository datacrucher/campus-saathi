import { useMemo } from 'react';
import { Download } from 'lucide-react';
import { useCases } from '../../data/CaseStore';
import { departmentById } from '../../data/directory';
import { DAY, durationLabel } from '../../lib/format';
import { departmentStats, firstResponseMs, isOpen, resolutionMs, TARGET_HOURS } from '../../lib/stats';
import { TRIAGE_ACTOR } from '../../data/seed';
import { downloadCsv } from '../../lib/csv';
import { useDataLoading, useTitle } from '../../lib/hooks';
import { VBarChart } from '../../components/Charts';
import { SkeletonRows } from '../../components/ui';

const pct = (n: number) => (Number.isFinite(n) ? `${Math.round(n * 100)}%` : '—');
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);

export default function Reports() {
  useTitle('Reports');
  const { cases } = useCases();
  const loading = useDataLoading();
  const stats = useMemo(() => departmentStats(cases), [cases]);

  const daily = useMemo(() => {
    const days: { key: string; label: string; tick?: string; value: number; muted?: boolean }[] = [];
    const start = new Date(); start.setHours(0, 0, 0, 0);
    for (let i = 20; i >= 0; i--) {
      const d = new Date(start.getTime() - i * DAY);
      const next = d.getTime() + DAY;
      const value = cases.filter((c) => { const t = new Date(c.createdAt).getTime(); return t >= d.getTime() && t < next; }).length;
      const dow = d.getDay();
      days.push({
        key: d.toISOString(),
        label: d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }),
        tick: i % 3 === 0 ? d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : undefined,
        value,
        muted: dow === 0 || dow === 6,
      });
    }
    return days;
  }, [cases]);

  const categories = useMemo(() => {
    const map = new Map<string, { category: string; dept: string; count: number }>();
    for (const c of cases) {
      const k = `${c.departmentId}|${c.category}`;
      const e = map.get(k) ?? { category: c.category, dept: c.departmentId, count: 0 };
      e.count++;
      map.set(k, e);
    }
    return [...map.values()].sort((a, b) => b.count - a.count).slice(0, 8);
  }, [cases]);

  const responded = cases.map(firstResponseMs).filter((x): x is number => x !== null);
  const resolvedTimes = cases.map(resolutionMs).filter((x): x is number => x !== null);
  const withinTarget = cases.filter((c) => { const f = firstResponseMs(c); return f !== null && f <= TARGET_HOURS[c.departmentId] * 3_600_000; }).length;
  const transferred = cases.filter((c) => c.activity.some((a) => a.text.startsWith('Transferred to') && a.actor !== TRIAGE_ACTOR)).length;
  const staleOpen = cases.filter((c) => isOpen(c) && Date.now() - new Date(c.createdAt).getTime() > 7 * DAY).length;
  const maxCat = Math.max(1, ...categories.map((c) => c.count));

  const exportReport = () => downloadCsv('campus-saathi-department-report.csv', [
    ['Department', 'Requests', 'Open', 'In Progress', 'Resolved', 'Avg first response (hrs)', 'Avg resolution (hrs)', 'First response within target'],
    ...stats.map((s) => [s.name, s.total, s.open, s.inProgress, s.resolved,
      Number.isFinite(s.avgFirstResponseMs) ? (s.avgFirstResponseMs / 3_600_000).toFixed(1) : '',
      Number.isFinite(s.avgResolutionMs) ? (s.avgResolutionMs / 3_600_000).toFixed(1) : '',
      pct(s.withinTarget)]),
  ]);

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 1400 }}>
        <div className="page-head">
          <div>
            <h1>Reports</h1>
            <p className="sub">Service performance for the last 30 days.</p>
          </div>
          <button className="btn btn-secondary" onClick={exportReport}><Download size={16} /> Export report</button>
        </div>

        <div className="metrics" style={{ gridTemplateColumns: 'repeat(5, minmax(0,1fr))' }}>
          <div className="metric"><div className="m-label">Avg. first response</div><div className="m-value">{durationLabel(mean(responded))}</div></div>
          <div className="metric"><div className="m-label">Avg. resolution</div><div className="m-value">{durationLabel(mean(resolvedTimes))}</div></div>
          <div className="metric"><div className="m-label">Responded within target</div><div className="m-value">{pct(withinTarget / Math.max(1, responded.length))}</div></div>
          <div className="metric"><div className="m-label">Triage routing kept</div><div className="m-value">{pct(1 - transferred / Math.max(1, cases.length))}</div><div className="m-foot">{transferred} transferred by staff</div></div>
          <div className="metric"><div className="m-label">Open over 7 days</div><div className="m-value">{staleOpen}</div></div>
        </div>

        <section className="panel" style={{ marginTop: 20 }}>
          <div className="panel-head">
            <div><h2>Requests received per day</h2><span className="hint">Last 21 days · weekends shown lighter</span></div>
          </div>
          <div className="panel-body" style={{ paddingLeft: 36 }}>
            {loading ? <span className="skeleton" style={{ height: 180 }} /> : <VBarChart data={daily} valueLabel="Requests" />}
          </div>
        </section>

        <div className="grid-2 even" style={{ marginTop: 20 }}>
          <section className="panel">
            <div className="panel-head"><h2>Response performance by department</h2></div>
            {loading ? <SkeletonRows rows={8} cols={4} /> : (
              <div className="table-wrap">
                <table className="table responsive">
                  <thead><tr><th>Department</th><th className="num">First response</th><th className="num">Resolution</th><th className="num">Within target</th></tr></thead>
                  <tbody>
                    {[...stats].sort((a, b) => b.total - a.total).map((s) => (
                      <tr key={s.id}>
                        <td className="cell-title"><span className="primary-cell">{s.name}</span></td>
                        <td data-label="First response" className="num">{durationLabel(s.avgFirstResponseMs)}</td>
                        <td data-label="Resolution" className="num">{durationLabel(s.avgResolutionMs)}</td>
                        <td data-label="Within target" className={`num${s.withinTarget < 0.7 ? ' late-text' : ''}`}>{pct(s.withinTarget)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
          <section className="panel">
            <div className="panel-head"><h2>Most common request types</h2></div>
            {loading ? <SkeletonRows rows={8} cols={3} /> : (
              <div className="table-wrap">
                <table className="table responsive">
                  <thead><tr><th>Category</th><th>Department</th><th className="num">Requests</th></tr></thead>
                  <tbody>
                    {categories.map((c) => (
                      <tr key={`${c.dept}-${c.category}`}>
                        <td className="cell-title"><span className="primary-cell">{c.category}</span></td>
                        <td data-label="Department">{departmentById(c.dept)?.team}</td>
                        <td data-label="Requests" className="num">
                          <span className="inline-bar"><span style={{ width: `${(c.count / maxCat) * 100}%` }} /></span>{c.count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
