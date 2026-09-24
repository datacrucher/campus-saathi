import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, ChevronRight, Lock, RotateCcw, Send, Sparkles } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { useCases, type CasePatch } from '../../data/CaseStore';
import { errorMessage } from '../../lib/api';
import { departmentById, DEPARTMENTS, staffById, staffForDepartment, studentById } from '../../data/directory';
import { PRIORITIES, STATUSES, type ActivityEntry, type Priority, type Role, type Status } from '../../data/types';
import { dayLabel, durationLabel, formatDateTime, formatTime, relativeTime } from '../../lib/format';
import { TARGET_HOURS, firstResponseMs } from '../../lib/stats';
import { TRIAGE_ACTOR } from '../../data/seed';
import { useTitle } from '../../lib/hooks';
import { Dialog, ErrorState, PriorityLabel, SkeletonRows, StatusBadge } from '../../components/ui';
import { useToast } from '../../components/Toast';

export default function CaseDetail({ role }: { role: Extract<Role, 'staff' | 'admin'> }) {
  const { id = '' } = useParams();
  useTitle(id.toUpperCase());
  const { user } = useAuth();
  const store = useCases();
  const notify = useToast();
  const c = store.getCase(id);
  const listPath = role === 'admin' ? '/admin/cases' : '/staff';
  const listLabel = role === 'admin' ? 'Cases' : 'My Assigned Cases';

  const [status, setStatus] = useState<Status>('New');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [assignee, setAssignee] = useState('');
  const [dept, setDept] = useState('');
  const [composer, setComposer] = useState<'response' | 'note'>('response');
  const [message, setMessage] = useState('');
  const [setWaiting, setSetWaiting] = useState(false);
  const [composerError, setComposerError] = useState('');
  const [resolveOpen, setResolveOpen] = useState(false);
  const [resolution, setResolution] = useState('');
  const [resolutionError, setResolutionError] = useState('');
  const [notifyStudent, setNotifyStudent] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  // Keep the edit panel in sync with the saved case.
  useEffect(() => {
    if (!c) return;
    setStatus(c.status);
    setPriority(c.priority);
    setAssignee(c.assigneeId ?? '');
    setDept(c.departmentId);
  }, [c?.status, c?.priority, c?.assigneeId, c?.departmentId]); // eslint-disable-line react-hooks/exhaustive-deps

  const otherCases = useMemo(
    () => (c ? store.cases.filter((x) => x.studentId === c.studentId && x.id !== c.id) : []),
    [store.cases, c],
  );

  if (!c) {
    if (store.loading) return <div className="page"><div className="container"><div className="panel"><SkeletonRows rows={6} cols={2} /></div></div></div>;
    return (
      <div className="page"><div className="container"><div className="panel">
        <ErrorState title={`Case ${id.toUpperCase()} not found`} action={<Link to={listPath} className="btn btn-secondary">Back to {listLabel}</Link>}>
          Check the case number and try again. It may belong to another department.
        </ErrorState>
      </div></div></div>
    );
  }

  const student = studentById(c.studentId)!;
  const department = departmentById(c.departmentId)!;
  const staff = staffById(c.assigneeId);
  const team = staffForDepartment(dept || c.departmentId);
  const resolved = c.status === 'Resolved';
  const assignedEntry = [...c.activity].reverse().find((a) => a.kind === 'assigned' && a.text.startsWith('Assigned to') && a.actor !== TRIAGE_ACTOR);
  const frMs = firstResponseMs(c);
  const target = TARGET_HOURS[c.departmentId];

  const dirty = status !== c.status || priority !== c.priority || (assignee || null) !== c.assigneeId || dept !== c.departmentId;

  /** Runs a server action, showing a toast on success or failure. Returns true if it succeeded. */
  const run = async (action: string, fn: () => Promise<unknown>, success: string, detail?: string) => {
    setBusy(action);
    try {
      await fn();
      notify(success, detail);
      return true;
    } catch (e) {
      notify('Couldn’t save your change', errorMessage(e), 'error');
      return false;
    } finally {
      setBusy(null);
    }
  };

  const save = () => {
    if (status === 'Resolved' && c.status !== 'Resolved') { setResolveOpen(true); return; }
    const patch: CasePatch = {};
    const changes: string[] = [];
    if (dept !== c.departmentId) { patch.departmentId = dept; changes.push(`transferred to ${departmentById(dept)!.team}`); }
    else if ((assignee || null) !== c.assigneeId) { patch.assigneeId = assignee || null; changes.push(assignee ? `assigned to ${staffById(assignee)!.name}` : 'returned to queue'); }
    if (priority !== c.priority) { patch.priority = priority; changes.push(`priority ${priority.toLowerCase()}`); }
    if (status !== c.status) { patch.status = status; changes.push(`status ${status.toLowerCase()}`); }
    run('save', () => store.updateCase(c.id, patch), `${c.id} updated`, changes.length ? capitalise(changes.join(', ')) + '.' : undefined);
  };

  const assignToMe = () => run('assign', () => store.updateCase(c.id, {
    assigneeId: user!.id,
    ...(c.status === 'New' ? { status: 'In Progress' as const } : {}),
  }), `${c.id} assigned to you`);

  const post = async (e: FormEvent) => {
    e.preventDefault();
    if (message.trim().length < 3) { setComposerError(composer === 'response' ? 'Write a response before sending.' : 'Write a note before saving.'); return; }
    const ok = composer === 'response'
      ? await run('post', () => store.postMessage(c.id, message.trim(), { setWaiting }), 'Response sent', `${student.preferredName} will get an email notification.`)
      : await run('post', () => store.postMessage(c.id, message.trim(), { internal: true }), 'Internal note added', 'Only staff can see this note.');
    if (ok) { setMessage(''); setSetWaiting(false); }
  };

  const confirmResolve = async () => {
    if (resolution.trim().length < 10) { setResolutionError('Summarise the outcome in a sentence or two.'); return; }
    const ok = await run('resolve', async () => {
      if (priority !== c.priority) await store.updateCase(c.id, { priority });
      await store.resolve(c.id, resolution.trim());
    }, `${c.id} resolved`, notifyStudent ? `${student.preferredName} has been emailed the outcome.` : undefined);
    if (ok) { setResolveOpen(false); setResolution(''); }
  };

  const reopen = () => run('reopen', () => store.reopen(c.id), `${c.id} reopened`);

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 1400 }}>
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link to={listPath}>{listLabel}</Link><ChevronRight size={13} /><span className="mono">{c.id}</span>
        </nav>

        <header className="case-header">
          <div className="ch-main">
            <div className="ch-id mono">{c.id}</div>
            <h1>{c.title}</h1>
            <div className="ch-meta">
              <StatusBadge status={c.status} large />
              <span className="ch-sep" />
              <span className="ch-field"><span>Priority</span><PriorityLabel priority={c.priority} /></span>
              <span className="ch-sep" />
              <span className="ch-field"><span>Department</span><strong>{department.name}</strong></span>
              <span className="ch-sep" />
              <span className="ch-field"><span>Opened</span><strong>{relativeTime(c.createdAt)}</strong></span>
            </div>
          </div>
          <div className="row">
            {!resolved && c.assigneeId !== user!.id && role === 'staff' && (
              <button className="btn btn-secondary" onClick={assignToMe} disabled={!!busy}>Assign to me</button>
            )}
            {resolved
              ? <button className="btn btn-secondary" onClick={reopen} disabled={!!busy}><RotateCcw size={15} /> Reopen</button>
              : <button className="btn btn-primary" onClick={() => setResolveOpen(true)}><CheckCircle2 size={16} /> Resolve</button>}
          </div>
        </header>

        <div className="case-layout">
          <div className="stack">
            <section className="panel">
              <div className="panel-head">
                <h2>Student Information</h2>
                {role === 'admin' && <Link to={`/admin/students/${student.id}`} className="small">View student</Link>}
              </div>
              <div className="panel-body">
                <dl className="dl cols-2">
                  <dt>Name</dt><dd>{student.name}</dd>
                  <dt>Student ID</dt><dd className="mono">{student.studentNumber}</dd>
                  <dt>Programme</dt><dd>{student.programme}</dd>
                  <dt>Year of study</dt><dd>{student.year} · {student.mode}</dd>
                  <dt>Faculty</dt><dd>{student.faculty}</dd>
                  <dt>Fee status</dt><dd>{student.feeStatus}</dd>
                  <dt>Email</dt><dd><a href={`mailto:${student.email}`}>{student.email}</a></dd>
                  <dt>Phone</dt><dd>{student.phone}</dd>
                  <dt>Personal tutor</dt><dd>{student.tutor}</dd>
                  <dt>Prefers</dt><dd>{c.contactPreference}</dd>
                </dl>
                {otherCases.length > 0 && (
                  <p className="small muted" style={{ marginTop: 14 }}>
                    {otherCases.length} other request{otherCases.length > 1 ? 's' : ''} from this student:{' '}
                    {otherCases.slice(0, 4).map((o, i) => (
                      <span key={o.id}>{i > 0 && ', '}<Link to={`${role === 'admin' ? '/admin/cases' : '/staff/cases'}/${o.id}`} className="mono">{o.id}</Link></span>
                    ))}
                  </p>
                )}
              </div>
            </section>

            <section className="panel">
              <div className="panel-head"><h2>Request</h2><span className="hint">Submitted {formatDateTime(c.createdAt)} via Campus Saathi</span></div>
              <div className="panel-body">
                <p className="request-text">{c.description}</p>
              </div>
            </section>

            <section className="panel">
              <div className="panel-head">
                <h2 className="row" style={{ gap: 8 }}><Sparkles size={15} className="muted" /> AI Triage</h2>
                <span className="hint">Suggestion only — staff decide the final routing</span>
              </div>
              <div className="panel-body">
                <dl className="dl cols-2">
                  <dt>Suggested service</dt><dd>{departmentById(triageDept(c.activity) ?? c.departmentId)?.name}</dd>
                  <dt>Category</dt><dd>{c.triage.category}</dd>
                  <dt>Suggested urgency</dt><dd><PriorityLabel priority={c.triage.urgency} /></dd>
                  <dt>Match confidence</dt>
                  <dd>
                    <div className="row" style={{ gap: 10, flexWrap: 'nowrap' }}>
                      <div className="meter" style={{ width: 100 }}><span style={{ width: `${Math.round(c.triage.confidence * 100)}%` }} /></div>
                      <span className="small">{Math.round(c.triage.confidence * 100)}%</span>
                    </div>
                  </dd>
                </dl>
                <div className="triage-reason">
                  <span className="muted small">Reasoning</span>
                  <p>{c.triage.reason}</p>
                  {c.triage.signals.length > 0 && (
                    <div className="row" style={{ marginTop: 8, gap: 6 }}>
                      <span className="small muted">Key phrases:</span>
                      {c.triage.signals.map((s) => <span key={s} className="chip">{s}</span>)}
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="panel">
              <div className="panel-head"><h2>Assignment</h2></div>
              <div className="panel-body">
                <dl className="dl cols-2">
                  <dt>Assignment group</dt><dd>{department.team}</dd>
                  <dt>Assigned to</dt><dd>{staff ? `${staff.name}, ${staff.title}` : <span className="muted">Unassigned</span>}</dd>
                  <dt>Assigned</dt><dd>{assignedEntry && staff ? formatDateTime(assignedEntry.at) : '—'}</dd>
                  <dt>First response</dt>
                  <dd>
                    {frMs === null ? <span className="muted">Not yet responded</span> : (
                      <>{durationLabel(frMs)} <span className={frMs <= target * 3_600_000 ? 'ok-text' : 'late-text'}>
                        ({frMs <= target * 3_600_000 ? 'within' : 'outside'} {target}-hr target)</span></>
                    )}
                  </dd>
                </dl>
              </div>
            </section>

            <section className="panel">
              <div className="panel-head"><h2>Activity</h2><span className="hint">{c.activity.length} entries</span></div>
              <div className="panel-body">
                <Timeline entries={c.activity} />
              </div>
              {!resolved && (
                <form className="composer" onSubmit={post}>
                  <div className="tabs" role="tablist">
                    <button type="button" role="tab" aria-selected={composer === 'response'} className={`tab${composer === 'response' ? ' active' : ''}`} onClick={() => { setComposer('response'); setComposerError(''); }}>
                      <Send size={14} /> Response to student
                    </button>
                    <button type="button" role="tab" aria-selected={composer === 'note'} className={`tab${composer === 'note' ? ' active' : ''}`} onClick={() => { setComposer('note'); setComposerError(''); }}>
                      <Lock size={14} /> Internal note
                    </button>
                  </div>
                  <label htmlFor="composer" className="sr-only">{composer === 'response' ? 'Response to student' : 'Internal note'}</label>
                  <textarea
                    id="composer" rows={4} className={`textarea${composerError ? ' invalid' : ''}${composer === 'note' ? ' note-input' : ''}`}
                    placeholder={composer === 'response' ? `Write to ${student.preferredName}. They’ll receive this by email and in Campus Saathi.` : 'Visible to staff only. Not shared with the student.'}
                    value={message} onChange={(e) => { setMessage(e.target.value); setComposerError(''); }}
                  />
                  {composerError && <span className="error-text" style={{ marginTop: 6 }}>{composerError}</span>}
                  <div className="row" style={{ justifyContent: 'space-between', marginTop: 10 }}>
                    {composer === 'response'
                      ? <label className="checkbox small"><input type="checkbox" checked={setWaiting} onChange={(e) => setSetWaiting(e.target.checked)} /> Set status to Waiting on student</label>
                      : <span className="small muted row" style={{ gap: 6 }}><Lock size={13} /> Staff only</span>}
                    <button className="btn btn-primary" type="submit" disabled={busy === 'post'}>{busy === 'post' ? <><span className="spinner" /> Saving…</> : composer === 'response' ? 'Send response' : 'Add note'}</button>
                  </div>
                </form>
              )}
            </section>

            <section className="panel">
              <div className="panel-head"><h2>Resolution</h2></div>
              <div className="panel-body">
                {c.resolution ? (
                  <>
                    <p style={{ fontSize: 14 }}>{c.resolution.text}</p>
                    <p className="small muted" style={{ marginTop: 8 }}>
                      Resolved by {c.resolution.by} on {formatDateTime(c.resolution.at)} · {durationLabel(new Date(c.resolution.at).getTime() - new Date(c.createdAt).getTime())} after the request was made
                    </p>
                  </>
                ) : (
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <span className="small muted">This case hasn’t been resolved yet.</span>
                    <button className="btn btn-secondary btn-sm" onClick={() => setResolveOpen(true)}>Resolve case</button>
                  </div>
                )}
              </div>
            </section>
          </div>

          <aside className="case-side">
            <section className="panel">
              <div className="panel-head"><h2>Update case</h2></div>
              <div className="panel-body">
                <div className="field">
                  <label className="label" htmlFor="f-status">Status</label>
                  <select id="f-status" className="select" value={status} onChange={(e) => setStatus(e.target.value as Status)}>
                    {STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label className="label" htmlFor="f-priority">Priority</label>
                  <select id="f-priority" className="select" value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
                    {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
                  </select>
                </div>
                {role === 'admin' && (
                  <div className="field">
                    <label className="label" htmlFor="f-dept">Department</label>
                    <select id="f-dept" className="select" value={dept} onChange={(e) => { setDept(e.target.value); setAssignee(''); }}>
                      {DEPARTMENTS.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                )}
                <div className="field">
                  <label className="label" htmlFor="f-assignee">Assigned to</label>
                  <select id="f-assignee" className="select" value={assignee} onChange={(e) => setAssignee(e.target.value)} disabled={dept !== c.departmentId}>
                    <option value="">Unassigned ({departmentById(dept || c.departmentId)?.team})</option>
                    {team.map((m) => <option key={m.id} value={m.id}>{m.name}{m.id === user!.id ? ' (you)' : ''}</option>)}
                  </select>
                  {dept !== c.departmentId && <span className="help">Transferred cases go to the new team’s queue.</span>}
                </div>
              </div>
              <div className="panel-foot row" style={{ justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost btn-sm" disabled={!dirty} onClick={() => { setStatus(c.status); setPriority(c.priority); setAssignee(c.assigneeId ?? ''); setDept(c.departmentId); }}>Discard</button>
                <button className="btn btn-primary btn-sm" disabled={!dirty || busy === 'save'} onClick={save}>{busy === 'save' ? <><span className="spinner" /> Saving…</> : 'Save changes'}</button>
              </div>
            </section>

            <section className="panel">
              <div className="panel-head"><h2>Service level</h2></div>
              <div className="panel-body">
                <dl className="dl" style={{ gridTemplateColumns: '120px minmax(0,1fr)' }}>
                  <dt>Response target</dt><dd>{department.targetResponse}</dd>
                  <dt>Case age</dt><dd>{durationLabel(Date.now() - new Date(c.createdAt).getTime())}</dd>
                  <dt>Last updated</dt><dd>{relativeTime(c.updatedAt)}</dd>
                </dl>
              </div>
            </section>
          </aside>
        </div>
      </div>

      {resolveOpen && (
        <Dialog
          title={`Resolve ${c.id}`}
          onClose={() => { setResolveOpen(false); setStatus(c.status); }}
          footer={<>
            <button className="btn btn-ghost" onClick={() => { setResolveOpen(false); setStatus(c.status); }}>Cancel</button>
            <button className="btn btn-primary" onClick={confirmResolve} disabled={busy === 'resolve'}>{busy === 'resolve' ? <><span className="spinner" /> Resolving…</> : 'Resolve case'}</button>
          </>}
        >
          <div className="field">
            <label className="label" htmlFor="resolution">Resolution summary</label>
            <textarea id="resolution" rows={4} className={`textarea${resolutionError ? ' invalid' : ''}`} value={resolution}
              placeholder="What was done, and is anything else needed from the student?"
              onChange={(e) => { setResolution(e.target.value); setResolutionError(''); }} />
            {resolutionError ? <span className="error-text">{resolutionError}</span> : <span className="help">This is shared with the student.</span>}
          </div>
          <label className="checkbox" style={{ marginTop: 14 }}>
            <input type="checkbox" checked={notifyStudent} onChange={(e) => setNotifyStudent(e.target.checked)} /> Email the outcome to {student.preferredName}
          </label>
        </Dialog>
      )}
    </div>
  );
}

function capitalise(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }

/** The department the triage originally routed to (before any transfer). */
function triageDept(activity: ActivityEntry[]) {
  const first = activity.find((a) => a.actor === TRIAGE_ACTOR && a.kind === 'assigned');
  if (!first) return undefined;
  const teamName = first.text.replace('Assigned to ', '');
  return DEPARTMENTS.find((d) => d.team === teamName)?.id;
}

function Timeline({ entries }: { entries: ActivityEntry[] }) {
  return (
    <ol className="timeline">
      {entries.map((e, i) => {
        const showDate = i === 0 || dayLabel(entries[i - 1].at) !== dayLabel(e.at);
        const dot = e.kind === 'resolved' ? 'good' : e.kind === 'created' ? 'brand' : '';
        return (
          <li key={e.id}>
            <div className="t-time">
              {formatTime(e.at)}
              {showDate && <span className="t-date">{dayLabel(e.at)}</span>}
            </div>
            <div className="t-rail"><span className={`t-dot ${dot}`} /></div>
            <div className="t-content">
              <div className="t-title">{e.text}</div>
              <div className="t-meta">{e.actor}{e.kind === 'triage' && e.body ? ` · ${e.body}` : ''}{e.kind === 'status' && e.body ? ` · ${e.body}` : ''}</div>
              {e.body && !['triage', 'status'].includes(e.kind) && (
                <div className={`t-note${e.internal ? ' internal' : ''}`}>
                  {e.internal && <span className="tag">Internal note</span>}
                  {e.internal && <br />}
                  {e.body}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
