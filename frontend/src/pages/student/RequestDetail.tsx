import { useState, type FormEvent } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { CheckCircle2, ChevronRight, Clock, MessageSquare } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { useCases } from '../../data/CaseStore';
import { departmentById, staffById } from '../../data/directory';
import { formatDateTime, initials, updatedPhrase } from '../../lib/format';
import { useTitle } from '../../lib/hooks';
import { ErrorState, SkeletonRows, StatusBadge } from '../../components/ui';
import { errorMessage } from '../../lib/api';
import { useToast } from '../../components/Toast';

export default function RequestDetail() {
  const { id = '' } = useParams();
  useTitle(id.toUpperCase());
  const { user } = useAuth();
  const { getCase, postMessage, loading } = useCases();
  const [sending, setSending] = useState(false);
  const notify = useToast();
  const location = useLocation();
  const justCreated = (location.state as { justCreated?: boolean } | null)?.justCreated;
  const [reply, setReply] = useState('');
  const [replyError, setReplyError] = useState('');

  const c = getCase(id);
  if (!c && loading) return <div className="page"><div className="container"><div className="panel"><SkeletonRows rows={5} cols={2} /></div></div></div>;
  if (!c || c.studentId !== user!.id) {
    return (
      <div className="page"><div className="container narrow">
        <div className="panel">
          <ErrorState title="We couldn’t find that request" action={<Link to="/student/requests" className="btn btn-secondary">Back to My Requests</Link>}>
            It may have been mistyped, or it belongs to a different account.
          </ErrorState>
        </div>
      </div></div>
    );
  }

  const dept = departmentById(c.departmentId)!;
  const assignee = staffById(c.assigneeId);
  const messages = c.activity.filter((a) => a.kind === 'response' || a.kind === 'student');
  const stages = ['Submitted', 'With the team', 'In progress', 'Resolved'];
  const stage = c.status === 'Resolved' ? 3 : c.status === 'New' ? (c.assigneeId ? 1 : 0) : 2;

  const send = (e: FormEvent) => {
    e.preventDefault();
    if (reply.trim().length < 2) { setReplyError('Write a message before sending.'); return; }
    setSending(true);
    postMessage(c.id, reply.trim())
      .then(() => { setReply(''); notify('Reply sent', `${dept.team} has been notified.`); })
      .catch((err) => setReplyError(errorMessage(err)))
      .finally(() => setSending(false));
  };

  return (
    <div className="page">
      <div className="container">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link to="/student/requests">My Requests</Link><ChevronRight size={13} /><span className="mono">{c.id}</span>
        </nav>

        {justCreated && (
          <div className="alert info" style={{ marginBottom: 16 }}>
            <CheckCircle2 size={16} />
            <span><strong>Your request has been sent.</strong> We’ve emailed a copy to {user!.email}. You’ll get an email when {dept.team} replies.</span>
          </div>
        )}

        <div className="page-head" style={{ alignItems: 'flex-start' }}>
          <div>
            <div className="eyebrow mono">{c.id}</div>
            <h1>{c.title}</h1>
            <p className="sub">{dept.name}</p>
          </div>
          <StatusBadge status={c.status} large studentFacing />
        </div>

        <ol className="progress-track" aria-label="Request progress">
          {stages.map((s, i) => (
            <li key={s} className={i < stage ? 'done' : i === stage ? 'current' : ''}>
              <span className="pt-dot" />{s}
            </li>
          ))}
        </ol>

        {c.status === 'Waiting' && (
          <div className="alert warn" style={{ marginTop: 16 }}>
            <MessageSquare size={16} /><span><strong>{dept.team} is waiting for your reply.</strong> Read their latest message below and reply when you can.</span>
          </div>
        )}

        <div className="grid-2" style={{ marginTop: 20 }}>
          <div className="stack">
            <section className="panel">
              <div className="panel-head"><h2>Messages</h2><span className="hint">{messages.length + 1} message{messages.length ? "s" : ""}</span></div>
              <div className="panel-body">
                <ul className="thread">
                  <li className="msg mine">
                    <div className="msg-meta"><span className="avatar">{initials(user!.name)}</span><strong>You</strong><span>{formatDateTime(c.createdAt)}</span></div>
                    <div className="msg-body">{c.description}</div>
                  </li>
                  {messages.map((m) => (
                    <li key={m.id} className={`msg${m.kind === 'student' ? ' mine' : ''}`}>
                      <div className="msg-meta">
                        <span className="avatar">{initials(m.actor)}</span>
                        <strong>{m.kind === 'student' ? 'You' : m.actor}</strong>
                        {m.kind !== 'student' && <span>{dept.team}</span>}
                        <span>{formatDateTime(m.at)}</span>
                      </div>
                      <div className="msg-body">{m.body}</div>
                    </li>
                  ))}
                </ul>
                {messages.length === 0 && c.status !== 'Resolved' && (
                  <p className="small muted row" style={{ marginTop: 12 }}><Clock size={14} /> {dept.team} usually responds {dept.targetResponse.toLowerCase()}.</p>
                )}
              </div>
              {c.status !== 'Resolved' ? (
                <form className="panel-foot" onSubmit={send}>
                  <label className="label" htmlFor="reply">Reply to {dept.team}</label>
                  <textarea id="reply" className={`textarea${replyError ? ' invalid' : ''}`} rows={3} style={{ marginTop: 6, background: '#fff' }}
                    value={reply} onChange={(e) => { setReply(e.target.value); setReplyError(''); }} placeholder="Write your reply…" />
                  {replyError && <span className="error-text">{replyError}</span>}
                  <div className="row" style={{ justifyContent: 'flex-end', marginTop: 8 }}>
                    <button className="btn btn-primary" type="submit" disabled={sending}>{sending ? <><span className="spinner" /> Sending…</> : 'Send reply'}</button>
                  </div>
                </form>
              ) : (
                <div className="panel-foot small text-2">
                  This request is closed. If you still need help, <Link to="/student/support">send a new request</Link>.
                </div>
              )}
            </section>

            {c.resolution && (
              <section className="panel">
                <div className="panel-head"><h2>Outcome</h2><span className="hint">Resolved {updatedPhrase(c.resolution.at)}</span></div>
                <div className="panel-body"><p style={{ fontSize: 14 }}>{c.resolution.text}</p></div>
              </section>
            )}
          </div>

          <aside className="stack">
            <section className="panel">
              <div className="panel-head"><h2>Details</h2></div>
              <div className="panel-body">
                <dl className="dl" style={{ gridTemplateColumns: '110px minmax(0,1fr)' }}>
                  <dt>Reference</dt><dd className="mono">{c.id}</dd>
                  <dt>Service</dt><dd>{dept.name}</dd>
                  <dt>Topic</dt><dd>{c.category}</dd>
                  <dt>Handled by</dt><dd>{assignee ? assignee.name : <span className="muted">Not yet assigned</span>}</dd>
                  <dt>Submitted</dt><dd>{formatDateTime(c.createdAt)}</dd>
                  <dt>Contact by</dt><dd>{c.contactPreference}</dd>
                </dl>
              </div>
            </section>
            <section className="panel">
              <div className="panel-head"><h2>Contact {dept.team}</h2></div>
              <div className="panel-body small" style={{ display: 'grid', gap: 6 }}>
                <span>{dept.location}</span>
                <span className="muted">{dept.hours}</span>
                <a href={`tel:${dept.phone.replace(/\s/g, '')}`}>{dept.phone}</a>
                <a href={`mailto:${dept.email}`}>{dept.email}</a>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
