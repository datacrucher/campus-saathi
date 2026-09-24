import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Case } from '../data/types';
import { departmentById, staffById, studentById } from '../data/directory';
import { relativeTime } from '../lib/format';
import { PRIORITY_RANK } from '../lib/stats';
import { PriorityLabel, StatusBadge } from './ui';

export type Column = 'id' | 'student' | 'title' | 'department' | 'category' | 'priority' | 'status' | 'assignee' | 'updated';

const LABELS: Record<Column, string> = {
  id: 'Case ID', student: 'Student', title: 'Request', department: 'Department', category: 'Category',
  priority: 'Priority', status: 'Status', assignee: 'Assigned to', updated: 'Updated',
};

const STATUS_RANK = { New: 0, 'In Progress': 1, Waiting: 2, Resolved: 3 } as const;

function sortValue(c: Case, col: Column): string | number {
  switch (col) {
    case 'id': return c.id;
    case 'student': return studentById(c.studentId)?.name ?? '';
    case 'title': return c.title;
    case 'department': return departmentById(c.departmentId)?.name ?? '';
    case 'category': return c.category;
    case 'priority': return PRIORITY_RANK[c.priority];
    case 'status': return STATUS_RANK[c.status];
    case 'assignee': return staffById(c.assigneeId)?.name ?? '~';
    case 'updated': return -new Date(c.updatedAt).getTime();
  }
}

interface Props {
  cases: Case[];
  columns: Column[];
  basePath: string; // e.g. /admin/cases
  pageSize?: number;
  initialSort?: Column;
  empty?: ReactNode;
  rowAction?: (c: Case) => ReactNode;
}

export function CaseTable({ cases, columns, basePath, pageSize = 15, initialSort = 'updated', empty, rowAction }: Props) {
  const navigate = useNavigate();
  const [sort, setSort] = useState<{ col: Column; dir: 1 | -1 }>({ col: initialSort, dir: 1 });
  const [page, setPage] = useState(0);

  const sorted = useMemo(() => {
    const list = [...cases];
    list.sort((a, b) => {
      const va = sortValue(a, sort.col);
      const vb = sortValue(b, sort.col);
      const r = va < vb ? -1 : va > vb ? 1 : 0;
      return r * sort.dir || (new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    });
    return list;
  }, [cases, sort]);

  const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
  useEffect(() => { if (page >= pages) setPage(0); }, [page, pages]);
  const rows = sorted.slice(page * pageSize, page * pageSize + pageSize);

  if (cases.length === 0) return <>{empty}</>;

  const toggle = (col: Column) => setSort((s) => (s.col === col ? { col, dir: (s.dir * -1) as 1 | -1 } : { col, dir: 1 }));

  return (
    <>
      <div className="table-wrap">
        <table className="table responsive">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col} aria-sort={sort.col === col ? (sort.dir === 1 ? 'ascending' : 'descending') : undefined}>
                  <button className="sort" onClick={() => toggle(col)}>
                    {LABELS[col]}
                    {sort.col === col && (sort.dir === 1 ? <ArrowDown size={12} /> : <ArrowUp size={12} />)}
                  </button>
                </th>
              ))}
              {rowAction && <th><span className="sr-only">Actions</span></th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="clickable" onClick={() => navigate(`${basePath}/${c.id}`)}>
                {columns.map((col) => <Cell key={col} c={c} col={col} basePath={basePath} />)}
                {rowAction && <td onClick={(e) => e.stopPropagation()} style={{ textAlign: 'right' }}>{rowAction(c)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div className="pager">
          <span className="small muted">
            Showing {page * pageSize + 1}–{Math.min(sorted.length, (page + 1) * pageSize)} of {sorted.length}
          </span>
          <div className="row">
            <button className="btn btn-secondary btn-sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}><ChevronLeft size={14} /> Previous</button>
            <button className="btn btn-secondary btn-sm" disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)}>Next <ChevronRight size={14} /></button>
          </div>
        </div>
      )}
    </>
  );
}

function Cell({ c, col, basePath }: { c: Case; col: Column; basePath: string }) {
  switch (col) {
    case 'id':
      return (
        <td className="cell-title nowrap">
          <Link to={`${basePath}/${c.id}`} className="mono" style={{ fontWeight: 500 }} onClick={(e) => e.stopPropagation()}>{c.id}</Link>
          <span className="show-sm"> · {c.title}</span>
        </td>
      );
    case 'student': {
      const s = studentById(c.studentId);
      return <td data-label="Student"><span className="primary-cell">{s?.name}</span><div className="sub-cell hide-sm-inline">{s?.studentNumber}</div></td>;
    }
    case 'title':
      return <td data-label="Request" className="hide-sm" style={{ maxWidth: 280 }}><span className="truncate">{c.title}</span></td>;
    case 'department':
      return <td data-label="Department">{departmentById(c.departmentId)?.name}</td>;
    case 'category':
      return <td data-label="Category">{c.category}</td>;
    case 'priority':
      return <td data-label="Priority"><PriorityLabel priority={c.priority} /></td>;
    case 'status':
      return <td data-label="Status"><StatusBadge status={c.status} /></td>;
    case 'assignee': {
      const a = staffById(c.assigneeId);
      return <td data-label="Assigned to">{a ? a.name : <span className="muted">Unassigned</span>}</td>;
    }
    case 'updated':
      return <td data-label="Updated" className="nowrap muted">{relativeTime(c.updatedAt)}</td>;
  }
}
