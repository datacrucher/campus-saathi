import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronRight, ClipboardList, LayoutGrid, LifeBuoy } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { useCases } from '../../data/CaseStore';
import { departmentById, DEPARTMENTS } from '../../data/directory';
import { greeting, updatedPhrase } from '../../lib/format';
import { useTitle } from '../../lib/hooks';
import { EmptyState, StatusBadge } from '../../components/ui';

const EXAMPLES = [
  'I’ve been feeling overwhelmed with exams and can’t sleep properly…',
  'My student loan payment hasn’t arrived and my rent is due…',
  'I can’t log in to Moodle since I reset my password…',
  'There’s damp and mould on the wall in my room in halls…',
  'I need extra time in exams because of my dyslexia…',
  'My visa runs out before my course finishes…',
];

export default function StudentHome() {
  useTitle('Home');
  const { user } = useAuth();
  const { cases } = useCases();
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [exampleIdx, setExampleIdx] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (text) return;
    const id = window.setInterval(() => {
      setFading(true);
      window.setTimeout(() => { setExampleIdx((i) => (i + 1) % EXAMPLES.length); setFading(false); }, 250);
    }, 4500);
    return () => window.clearInterval(id);
  }, [text]);

  const mine = useMemo(
    () => cases.filter((c) => c.studentId === user!.id).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [cases, user],
  );
  const openCount = mine.filter((c) => c.status !== 'Resolved').length;
  const waiting = mine.filter((c) => c.status === 'Waiting');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    navigate('/student/support', { state: { query: text.trim() } });
  };

  return (
    <div className="page">
      <div className="container narrow">
        <p className="muted" style={{ fontWeight: 500 }}>{greeting()}, {user!.firstName}</p>
        <h1 className="home-title">How can we help you today?</h1>
        <p className="text-2" style={{ marginTop: 6 }}>You don’t need to know which department to contact. Tell us what’s going on.</p>

        <form className="ask-box" onSubmit={submit}>
          <label htmlFor="ask" className="sr-only">Describe what you need help with</label>
          <div className="ask-field">
            <textarea
              id="ask" className="textarea" rows={4} value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && text.trim()) submit(e); }}
            />
            {!text && (
              <div className="ask-placeholder" aria-hidden="true">
                <span>Describe what you need help with…</span>
                <span className={`ask-example${fading ? ' fading' : ''}`}>For example: “{EXAMPLES[exampleIdx]}”</span>
              </div>
            )}
          </div>
          <div className="ask-foot">
            <span className="help">Only you and the service that picks up your request can see what you write.</span>
            <button className="btn btn-primary" type="submit">Find Support <ArrowRight size={16} /></button>
          </div>
        </form>

        {waiting.length > 0 && (
          <div className="alert warn" style={{ marginTop: 20 }}>
            <ClipboardList size={16} />
            <span>
              <strong>{waiting.length === 1 ? 'A team is waiting for your reply' : `${waiting.length} teams are waiting for your reply`}.</strong>{' '}
              <Link to={`/student/requests/${waiting[0].id}`}>View {waiting[0].id}</Link>
            </span>
          </div>
        )}

        <h2 className="section-title" style={{ marginTop: 32 }}>Quick access</h2>
        <div className="quick-links">
          <Link to="/student/requests" className="quick-link">
            <span className="icon-box"><ClipboardList size={18} /></span>
            <span className="ql-text"><strong>My Requests</strong><span>{openCount} open</span></span>
            <ChevronRight size={16} />
          </Link>
          <Link to="/student/services" className="quick-link">
            <span className="icon-box"><LayoutGrid size={18} /></span>
            <span className="ql-text"><strong>Browse Services</strong><span>{DEPARTMENTS.length} student services</span></span>
            <ChevronRight size={16} />
          </Link>
          <Link to="/student/emergency" className="quick-link">
            <span className="icon-box danger"><LifeBuoy size={18} /></span>
            <span className="ql-text"><strong>Emergency Help</strong><span>24-hour contacts</span></span>
            <ChevronRight size={16} />
          </Link>
        </div>

        <section className="panel" style={{ marginTop: 32 }}>
          <div className="panel-head">
            <h2>Your recent requests</h2>
            {mine.length > 0 && <Link to="/student/requests" className="small">View all</Link>}
          </div>
          {mine.length === 0 ? (
            <EmptyState title="No requests yet">When you ask for support, you’ll be able to follow its progress here.</EmptyState>
          ) : (
            <ul className="list">
              {mine.slice(0, 4).map((c) => (
                <li key={c.id}>
                  <Link to={`/student/requests/${c.id}`} className="list-link">
                    <span className="ll-main">
                      <span className="ll-title" style={{ display: 'block' }}>{c.title}</span>
                      <span className="ll-sub" style={{ display: 'block' }}>
                        <span className="mono">{c.id}</span> · {departmentById(c.departmentId)?.name} · Updated {updatedPhrase(c.updatedAt)}
                      </span>
                    </span>
                    <StatusBadge status={c.status} studentFacing />
                    <ChevronRight size={16} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
