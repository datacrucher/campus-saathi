import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { useCases } from '../../data/CaseStore';
import { departmentById } from '../../data/directory';
import type { Case } from '../../data/types';
import { formatDate, relativeTime } from '../../lib/format';
import { useDataLoading, useTitle } from '../../lib/hooks';
import { EmptyState, SkeletonRows, StatusBadge } from '../../components/ui';

const FILTERS: { key: string; label: string; test: (c: Case) => boolean }[] = [
  { key: 'all', label: 'All', test: () => true },
  { key: 'open', label: 'Open', test: (c) => c.status !== 'Resolved' },
  { key: 'waiting', label: 'Waiting on you', test: (c) => c.status === 'Waiting' },
  { key: 'resolved', label: 'Resolved', test: (c) => c.status === 'Resolved' },
];

export default function MyRequests() {
  useTitle('My Requests');
  const { user } = useAuth();
  const { cases } = useCases();
  const navigate = useNavigate();
  const loading = useDataLoading();
  const [filter, setFilter] = useState('all');

  const mine = useMemo(
    () => cases.filter((c) => c.studentId === user!.id).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [cases, user],
  );
  const active = FILTERS.find((f) => f.key === filter)!;
  const rows = mine.filter(active.test);

  return (
    <div className="page">
      <div className="container">
        <div className="page-head">
          <div>
            <h1>My Requests</h1>
            <p className="sub">Track the support you’ve asked for and reply to staff.</p>
          </div>
          <Link to="/student/support" className="btn btn-primary"><Plus size={16} /> New request</Link>
        </div>

        <section className="panel">
          <div className="tabs" role="tablist" style={{ padding: '0 10px' }}>
            {FILTERS.map((f) => (
              <button key={f.key} role="tab" aria-selected={filter === f.key} className={`tab${filter === f.key ? ' active' : ''}`} onClick={() => setFilter(f.key)}>
                {f.label} <span className="count">{mine.filter(f.test).length}</span>
              </button>
            ))}
          </div>

          {loading ? <SkeletonRows rows={4} cols={5} /> : rows.length === 0 ? (
            <EmptyState
              title={filter === 'waiting' ? 'Nothing needs your reply' : filter === 'resolved' ? 'No resolved requests yet' : 'No requests here'}
              action={filter === 'all' ? <Link to="/student/support" className="btn btn-secondary">Ask for support</Link> : undefined}
            >
              {filter === 'waiting' ? 'When a team asks you for more information, the request will appear here.' : 'Requests you send through Campus Saathi will be listed here.'}
            </EmptyState>
          ) : (
            <div className="table-wrap">
              <table className="table responsive">
                <thead>
                  <tr>
                    <th>Request</th>
                    <th>Service</th>
                    <th>Submitted</th>
                    <th>Last update</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((c) => (
                    <tr key={c.id} className="clickable" onClick={() => navigate(`/student/requests/${c.id}`)}>
                      <td className="cell-title">
                        <Link to={`/student/requests/${c.id}`} className="primary-cell" onClick={(e) => e.stopPropagation()}>{c.title}</Link>
                        <div className="sub-cell mono">{c.id}</div>
                      </td>
                      <td data-label="Service">{departmentById(c.departmentId)?.name}</td>
                      <td data-label="Submitted" className="nowrap">{formatDate(c.createdAt)}</td>
                      <td data-label="Last update" className="nowrap">{relativeTime(c.updatedAt)}</td>
                      <td data-label="Status"><StatusBadge status={c.status} studentFacing /></td>
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
