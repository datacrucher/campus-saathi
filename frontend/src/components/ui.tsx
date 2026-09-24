import { useEffect, useRef, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Check, Inbox, X } from 'lucide-react';
import type { Priority, Status } from '../data/types';

export function Wordmark({ scope, to }: { scope?: string; to?: string }) {
  const inner = (
    <>
      <span className="mark" aria-hidden="true"><Check size={16} strokeWidth={3} /></span>
      Campus Saathi
      {scope && <span className="scope">{scope}</span>}
    </>
  );
  return to ? <Link className="wordmark" to={to}>{inner}</Link> : <span className="wordmark">{inner}</span>;
}

const statusClass: Record<Status, string> = {
  New: 'new', 'In Progress': 'in-progress', Waiting: 'waiting', Resolved: 'resolved',
};

export function StatusBadge({ status, large, studentFacing }: { status: Status; large?: boolean; studentFacing?: boolean }) {
  const label = studentFacing && status === 'Waiting' ? 'Waiting on you' : studentFacing && status === 'New' ? 'Submitted' : status;
  return <span className={`badge ${statusClass[status]}${large ? ' lg' : ''}`}>{label}</span>;
}

export function PriorityLabel({ priority }: { priority: Priority }) {
  return <span className={`priority ${priority.toLowerCase()}`}>{priority}</span>;
}

export function EmptyState({ icon, title, children, action }: { icon?: ReactNode; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="state">
      <div className="state-icon">{icon ?? <Inbox size={20} />}</div>
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
  );
}

export function ErrorState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="state error" role="alert">
      <div className="state-icon"><AlertTriangle size={20} /></div>
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
  );
}

export function SkeletonRows({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div aria-busy="true" aria-label="Loading" style={{ padding: '6px 0' }}>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 20, padding: '14px 18px', borderBottom: r < rows - 1 ? '1px solid var(--border)' : 0 }}>
          {Array.from({ length: cols }).map((__, c) => (
            <span key={c} className="skeleton" style={{ width: `${55 + ((r * 7 + c * 13) % 40)}%` }} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function Dialog({ title, onClose, children, footer }: { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    ref.current?.querySelector<HTMLElement>('textarea, input, select, button.btn')?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="dialog-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title" ref={ref}>
        <div className="dialog-head">
          <h2 id="dialog-title" style={{ fontSize: 17 }}>{title}</h2>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={onClose} aria-label="Close"><X size={16} /></button>
        </div>
        <div className="dialog-body">{children}</div>
        {footer && <div className="dialog-foot">{footer}</div>}
      </div>
    </div>
  );
}
