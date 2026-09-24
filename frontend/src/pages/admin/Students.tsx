import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronRight, Search } from 'lucide-react';
import { useCases } from '../../data/CaseStore';
import { STUDENTS, studentById } from '../../data/directory';
import { relativeTime } from '../../lib/format';
import { isOpen } from '../../lib/stats';
import { useTitle } from '../../lib/hooks';
import { CaseTable } from '../../components/CaseTable';
import { EmptyState, ErrorState } from '../../components/ui';

export function Students() {
  useTitle('Students');
  const { cases } = useCases();
  const navigate = useNavigate();
  const [q, setQ] = useState('');

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return STUDENTS
      .filter((s) => !term || [s.name, s.studentNumber, s.programme, s.email].some((v) => v.toLowerCase().includes(term)))
      .map((s) => {
        const mine = cases.filter((c) => c.studentId === s.id);
        const last = mine.reduce<string | null>((m, c) => (!m || c.createdAt > m ? c.createdAt : m), null);
        return { s, total: mine.length, open: mine.filter(isOpen).length, last };
      })
      .sort((a, b) => b.open - a.open || a.s.name.localeCompare(b.s.name));
  }, [cases, q]);

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 1400 }}>
        <div className="page-head">
          <div>
            <h1>Students</h1>
            <p className="sub">Students who have contacted a support service through Campus Saathi.</p>
          </div>
        </div>
        <section className="panel">
          <div className="toolbar">
            <div className="input-icon">
              <Search size={16} />
              <input className="input sm" placeholder="Search name, student ID or programme" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search students" />
            </div>
            <span className="spacer" />
            <span className="small muted">{rows.length} student{rows.length === 1 ? '' : 's'}</span>
          </div>
          {rows.length === 0 ? (
            <EmptyState title="No students found" icon={<Search size={20} />}>Check the spelling or search by 7-digit student ID.</EmptyState>
          ) : (
            <div className="table-wrap">
              <table className="table responsive">
                <thead>
                  <tr><th>Student</th><th>Programme</th><th>Year</th><th>Fee status</th><th className="num">Requests</th><th className="num">Open</th><th>Last request</th></tr>
                </thead>
                <tbody>
                  {rows.map(({ s, total, open, last }) => (
                    <tr key={s.id} className="clickable" onClick={() => navigate(`/admin/students/${s.id}`)}>
                      <td className="cell-title">
                        <Link to={`/admin/students/${s.id}`} className="primary-cell" onClick={(e) => e.stopPropagation()}>{s.name}</Link>
                        <div className="sub-cell mono">{s.studentNumber}</div>
                      </td>
                      <td data-label="Programme">{s.programme}</td>
                      <td data-label="Year" className="nowrap">{s.year}</td>
                      <td data-label="Fee status">{s.feeStatus}</td>
                      <td data-label="Requests" className="num">{total}</td>
                      <td data-label="Open" className="num">{open}</td>
                      <td data-label="Last request" className="nowrap muted">{last ? relativeTime(last) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export function StudentDetail() {
  const { id = '' } = useParams();
  const s = studentById(id);
  useTitle(s?.name ?? 'Student not found');
  const { cases } = useCases();
  const list = useMemo(() => cases.filter((c) => c.studentId === id), [cases, id]);

  if (!s) {
    return (
      <div className="page"><div className="container"><div className="panel">
        <ErrorState title="Student not found" action={<Link to="/admin/students" className="btn btn-secondary">All students</Link>}>
          This student record isn’t available in Campus Saathi.
        </ErrorState>
      </div></div></div>
    );
  }

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 1400 }}>
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link to="/admin/students">Students</Link><ChevronRight size={13} /><span>{s.name}</span>
        </nav>
        <div className="page-head">
          <div>
            <div className="eyebrow mono">{s.studentNumber}</div>
            <h1>{s.name}</h1>
            <p className="sub">{s.programme} · {s.year} · {s.faculty}</p>
          </div>
        </div>
        <div className="grid-2">
          <section className="panel">
            <div className="panel-head"><h2>Requests</h2><span className="hint">{list.filter(isOpen).length} open of {list.length}</span></div>
            <CaseTable
              cases={list}
              basePath="/admin/cases"
              columns={['id', 'title', 'department', 'priority', 'status', 'updated']}
              empty={<EmptyState title="No requests">This student hasn’t contacted any services yet.</EmptyState>}
            />
          </section>
          <aside className="panel">
            <div className="panel-head"><h2>Student record</h2></div>
            <div className="panel-body">
              <dl className="dl" style={{ gridTemplateColumns: '110px minmax(0,1fr)' }}>
                <dt>Email</dt><dd><a href={`mailto:${s.email}`}>{s.email}</a></dd>
                <dt>Phone</dt><dd>{s.phone}</dd>
                <dt>Mode</dt><dd>{s.mode}</dd>
                <dt>Fee status</dt><dd>{s.feeStatus}</dd>
                <dt>Tutor</dt><dd>{s.tutor}</dd>
              </dl>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
