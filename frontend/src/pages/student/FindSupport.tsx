import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, ArrowRight, Check, Clock, Info, MapPin, Pencil, Phone, SearchX, Sparkles } from 'lucide-react';
import { procedureById } from '../../data/procedures';
import { useCases } from '../../data/CaseStore';
import { departmentById, DEPARTMENTS } from '../../data/directory';
import type { Case } from '../../data/types';
import { titleFrom, type TriageMatch, type TriageResult } from '../../../../ml/triage';
import { api, errorMessage } from '../../lib/api';
import { useTitle } from '../../lib/hooks';
import { EmergencyContacts } from '../../components/EmergencyContacts';
import { PriorityLabel } from '../../components/ui';
import { useToast } from '../../components/Toast';

type Step = 'describe' | 'reviewing' | 'result' | 'confirm';

const CONTACT_OPTIONS: Case['contactPreference'][] = ['Email', 'Phone', 'In person', 'Teams call'];

function manualMatch(deptId: string): TriageMatch {
  const d = departmentById(deptId)!;
  return {
    dept: d.id, category: 'General enquiry', reason: 'You chose this service yourself.',
    urgency: 'Medium', confidence: 1, signals: [], crisis: false, safety: false,
    steps: [
      `Read what ${d.name} can help with on its service page.`,
      'Note down any dates, reference numbers or documents related to your problem.',
      'Send this request with as much detail as you can.',
      `${d.team} will reply ${d.targetResponse.toLowerCase()} — you can track it in My Requests.`,
    ],
  };
}

export default function FindSupport() {
  useTitle('Find Support');
  const { createCase } = useCases();
  const notify = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const initialQuery = ((location.state as { query?: string } | null)?.query ?? '').trim();
  const presetService = params.get('service');

  const [text, setText] = useState(initialQuery);
  const [step, setStep] = useState<Step>(presetService && departmentById(presetService) ? 'confirm' : 'describe');
  const [error, setError] = useState('');
  const [match, setMatch] = useState<TriageMatch | null>(presetService && departmentById(presetService) ? manualMatch(presetService) : null);
  const [alternatives, setAlternatives] = useState<TriageMatch[]>([]);
  const [noMatch, setNoMatch] = useState(false);
  const [source, setSource] = useState<'ai' | 'rules'>('rules');
  const [chosen, setChosen] = useState('');
  const headingRef = useRef<HTMLHeadingElement>(null);

  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [contact, setContact] = useState<Case['contactPreference']>('Email');
  const [consent, setConsent] = useState(false);
  const [confirmErrors, setConfirmErrors] = useState<{ title?: string; details?: string; consent?: string }>({});
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');

  useEffect(() => { headingRef.current?.focus(); }, [step]);

  const run = (value: string) => {
    const v = value.trim();
    if (v.split(/\s+/).length < 3) {
      setError('Tell us a little more — a sentence or two helps us find the right service.');
      return;
    }
    setError('');
    setStep('reviewing');
    api<TriageResult & { source?: 'ai' | 'rules' }>('/triage', { body: { text: v } })
      .then((result) => {
        setSource(result.source ?? 'rules');
        setMatch(result.best);
        setAlternatives(result.alternatives);
        setNoMatch(!result.best);
        setStep('result');
      })
      .catch((e) => {
        setError(errorMessage(e));
        setStep('describe');
      });
  };

  useEffect(() => {
    if (initialQuery && !presetService) run(initialQuery);
  }, []);

  const onDescribe = (e: FormEvent) => { e.preventDefault(); run(text); };

  const startConfirm = (m: TriageMatch) => {
    setMatch(m);
    setTitle(text.trim() ? titleFrom(text, m.category) : '');
    setDetails(text.trim());
    setConfirmErrors({});
    setStep('confirm');
  };

  const pickDepartment = (deptId: string) => {
    const alt = alternatives.find((a) => a.dept === deptId);
    startConfirm(alt ?? manualMatch(deptId));
  };

  const send = (e: FormEvent) => {
    e.preventDefault();
    const errs: typeof confirmErrors = {};
    if (!title.trim()) errs.title = 'Add a short summary of your request.';
    if (details.trim().length < 15) errs.details = 'Add a few more details so the team can help.';
    if (!consent) errs.consent = 'You need to agree before we can send your request.';
    setConfirmErrors(errs);
    if (Object.keys(errs).length) return;

    setSending(true);
    setSendError('');
    const d = departmentById(match!.dept)!;
    createCase({ title: title.trim(), description: details.trim(), departmentId: d.id, contactPreference: contact })
      .then((created) => {
        notify(`Request ${created.id} sent`, `${d.name} usually responds ${d.targetResponse.toLowerCase()}.`);
        navigate(`/student/requests/${created.id}`, { state: { justCreated: true } });
      })
      .catch((e) => {
        setSending(false);
        setSendError(errorMessage(e));
      });
  };

  const dept = match ? departmentById(match.dept) : undefined;
  const urgent = !!match && (match.crisis || match.safety);
  const procedure = match?.procedureId ? procedureById(match.procedureId) : undefined;

  const solvedIt = () => {
    notify('Glad that helped', 'If it happens again, you can come back here any time.');
    navigate('/student');
  };
  const stepIndex = step === 'describe' || step === 'reviewing' ? 0 : step === 'result' ? 1 : 2;

  return (
    <div className="page">
      <div className="container narrow">
        <ol className="flow-steps" aria-label="Progress">
          {['Describe', 'Suggested service', 'Send request'].map((label, i) => (
            <li key={label} className={i === stepIndex ? 'current' : i < stepIndex ? 'done' : ''} aria-current={i === stepIndex ? 'step' : undefined}>
              <span className="fs-num">{i + 1}</span>{label}
            </li>
          ))}
        </ol>

        {step === 'describe' && (
          <section>
            <h1 tabIndex={-1} ref={headingRef}>What do you need help with?</h1>
            <p className="text-2" style={{ marginTop: 6 }}>Describe it in your own words. We’ll suggest the service best placed to help before anything is sent.</p>
            <form onSubmit={onDescribe} className="panel" style={{ marginTop: 20 }}>
              <div className="panel-body">
                <label className="label" htmlFor="describe">Your situation</label>
                <textarea
                  id="describe" className={`textarea${error ? ' invalid' : ''}`} rows={6} style={{ marginTop: 6 }}
                  placeholder="For example: I’ve got exams coming up and I’m really struggling to cope…"
                  value={text} onChange={(e) => { setText(e.target.value); if (error) setError(''); }}
                  aria-invalid={!!error} aria-describedby={error ? 'describe-err' : 'describe-help'}
                />
                {error
                  ? <p className="error-text" id="describe-err" style={{ marginTop: 6 }}>{error}</p>
                  : <p className="help" id="describe-help" style={{ marginTop: 6 }}>Include anything you think is relevant, like dates, deadlines or what you’ve already tried.</p>}
              </div>
              <div className="panel-foot row" style={{ justifyContent: 'space-between' }}>
                <Link to="/student/services" className="small">Or browse all services</Link>
                <button className="btn btn-primary" type="submit">Find Support <ArrowRight size={16} /></button>
              </div>
            </form>
            <p className="small muted" style={{ marginTop: 16, display: 'flex', gap: 8 }}>
              <AlertTriangle size={15} style={{ marginTop: 2 }} />
              <span>If you or someone else is in immediate danger, call <strong className="text-2">999</strong> or Campus Security on <strong className="text-2">01632 960 444</strong>.</span>
            </p>
          </section>
        )}

        {step === 'reviewing' && (
          <section className="panel reviewing" aria-live="polite" aria-busy="true">
            <span className="spinner" style={{ width: 18, height: 18, color: 'var(--brand)' }} />
            <div>
              <h1 tabIndex={-1} ref={headingRef} style={{ fontSize: 17 }}>Reading your description…</h1>
              <p className="small muted">Working out what’s wrong and which of the {DEPARTMENTS.length} student services can help.</p>
            </div>
          </section>
        )}

        {step === 'result' && (
          <section>
            {match && dept ? (
              <>
                <h1 tabIndex={-1} ref={headingRef}>We found a possible support path.</h1>
                <p className="text-2" style={{ marginTop: 6 }}>Based on what you told us, this service is best placed to help.</p>

                {match.crisis && (
                  <div className="alert danger" style={{ marginTop: 20, display: 'block' }} role="alert">
                    <div className="row" style={{ marginBottom: 6 }}><AlertTriangle size={16} /><strong>You don’t have to wait for a reply.</strong></div>
                    If you’re thinking about harming yourself, please talk to someone now. These services are free and available any time.
                  </div>
                )}
                {match.crisis && <div className="panel" style={{ marginTop: 12 }}><EmergencyContacts compact /></div>}
                {match.safety && (
                  <div className="alert danger" style={{ marginTop: 20 }} role="alert">
                    <Phone size={16} />
                    <span>If you’re in danger now, call <strong>999</strong>. Campus Security is available 24 hours on <strong>01632 960 444</strong>.</span>
                  </div>
                )}

                <blockquote className="your-words">
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <span className="section-title" style={{ margin: 0 }}>What you told us</span>
                    <button className="link-btn small row" onClick={() => setStep('describe')}><Pencil size={13} /> Edit</button>
                  </div>
                  <p>{text}</p>
                </blockquote>

                <article className="recommendation">
                  <div className="rec-head">
                    <div className="row" style={{ justifyContent: 'space-between' }}>
                      <span className="rec-eyebrow">Recommended service</span>
                      {source === 'ai' && <span className="ai-tag"><Sparkles size={12} /> Analysed by Campus Saathi AI</span>}
                    </div>
                    <h2>{dept.name}</h2>
                    <p>{dept.description}</p>
                  </div>
                  <dl className="rec-facts">
                    <div className="rec-why">
                      <dt>Why this was recommended</dt>
                      <dd>{match.reason}</dd>
                    </div>
                    <div>
                      <dt>Urgency</dt>
                      <dd><PriorityLabel priority={match.urgency} /></dd>
                    </div>
                    <div>
                      <dt>Usually responds</dt>
                      <dd className="row" style={{ gap: 6 }}><Clock size={14} className="muted" /> {dept.targetResponse}</dd>
                    </div>
                  </dl>
                  {procedure ? (
                    <div className="options">
                      <section className="option">
                        <div className="option-head">
                          <span className="option-tag">Option 1</span>
                          <h3>Get it in person</h3>
                          <p className="small text-2">Visit these offices in order. You’ll receive your {procedure.title.replace(/ \(.*\)/, '')} {procedure.turnaround}.</p>
                        </div>
                        <ol className="route">
                          {procedure.steps.map((st, i) => (
                            <li key={i}>
                              <span className="route-num">{i + 1}</span>
                              <div>
                                <div className="route-who">{st.who}</div>
                                <div className="route-where"><MapPin size={13} /> {st.where}</div>
                                <div className="route-what">{st.what}</div>
                              </div>
                            </li>
                          ))}
                          <li className="route-done">
                            <span className="route-num"><Check size={13} /></span>
                            <div>
                              <div className="route-who">Collect your NOC</div>
                              <div className="route-what">Ready {procedure.turnaround} — the Placement Cell will email you.</div>
                            </div>
                          </li>
                        </ol>
                        <div className="option-docs">
                          <div className="small" style={{ fontWeight: 600, marginBottom: 6 }}>Bring with you</div>
                          <ul>{procedure.documents.map((d) => <li key={d}>{d}</li>)}</ul>
                        </div>
                      </section>
                      <section className="option">
                        <div className="option-head">
                          <span className="option-tag">Option 2</span>
                          <h3>Raise a request online</h3>
                          <p className="small text-2">Can’t visit in person, or stuck at a step? Send a request and {dept.team} will help you get it approved.</p>
                        </div>
                        <ul className="option-points">
                          <li><Check size={14} /> Tell them where you are in the process</li>
                          <li><Check size={14} /> Track progress and reply in My Requests</li>
                          <li><Check size={14} /> {dept.team} usually responds {dept.targetResponse.toLowerCase()}</li>
                        </ul>
                        <button className="btn btn-primary btn-block" onClick={() => startConfirm(match)}>Raise a request</button>
                      </section>
                    </div>
                  ) : (
                    <>
                  {match.steps.length > 0 && (
                      <div className="rec-workflow">
                        <h3>{urgent ? 'Do this now' : 'Try this yourself first'}</h3>
                        <p className="small text-2" style={{ marginBottom: 12 }}>
                          {urgent
                            ? 'You don’t need to wait for a reply to get help.'
                            : 'Many students sort this out on their own — no request needed.'}
                        </p>
                        <ol className="workflow">
                          {match.steps.map((step, i) => (
                            <li key={i}>
                              <span className="wf-num">{i + 1}</span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                    <div className="rec-actions">
                      <div className="rec-still">
                        <strong>{urgent ? 'Want follow-up support too?' : 'Still need help?'}</strong>
                        <span className="small text-2">{dept.team} usually responds {dept.targetResponse.toLowerCase()}.</span>
                      </div>
                      <div className="row">
                        {!urgent && match.steps.length > 0 && (
                          <button className="btn btn-secondary" onClick={solvedIt}><Check size={16} /> This solved it</button>
                        )}
                        <Link className="btn btn-secondary" to={`/student/services/${dept.id}`}>View Service</Link>
                        <button className="btn btn-primary" onClick={() => startConfirm(match)}>Request Support</button>
                      </div>
                    </div>
                    </>
                  )}
                </article>

                <div className="not-right">
                  <h3>Not quite right?</h3>
                  {alternatives.length > 0 && (
                    <ul className="list alt-list">
                      {alternatives.map((a) => {
                        const d = departmentById(a.dept)!;
                        return (
                          <li key={a.dept}>
                            <button className="list-link" onClick={() => startConfirm(a)}>
                              <span className="ll-main">
                                <span className="ll-title" style={{ display: 'block' }}>{d.name}</span>
                                <span className="ll-sub" style={{ display: 'block' }}>{d.description}</span>
                              </span>
                              <ArrowRight size={16} />
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  <div className="row" style={{ marginTop: 12 }}>
                    <label htmlFor="choose" className="small text-2">Choose a different service:</label>
                    <select id="choose" className="select sm" style={{ width: 'auto', minWidth: 240 }} value={chosen} onChange={(e) => setChosen(e.target.value)}>
                      <option value="">Select a service</option>
                      {DEPARTMENTS.filter((d) => d.id !== match.dept).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                    <button className="btn btn-secondary btn-sm" disabled={!chosen} onClick={() => pickDepartment(chosen)}>Continue</button>
                  </div>
                </div>
              </>
            ) : noMatch ? (
              <>
                <div className="panel">
                  <div className="state">
                    <div className="state-icon"><SearchX size={20} /></div>
                    <h1 tabIndex={-1} ref={headingRef} style={{ fontSize: 17 }}>We couldn’t find a clear match</h1>
                    <p>Try adding a bit more detail about what’s happening, or choose the service yourself.</p>
                    <div className="row" style={{ marginTop: 12, justifyContent: 'center' }}>
                      <button className="btn btn-secondary" onClick={() => setStep('describe')}><Pencil size={15} /> Add more detail</button>
                    </div>
                  </div>
                  <div className="panel-foot row">
                    <label htmlFor="choose2" className="small text-2">Choose a service:</label>
                    <select id="choose2" className="select sm" style={{ width: 'auto', minWidth: 240, flex: 1 }} value={chosen} onChange={(e) => setChosen(e.target.value)}>
                      <option value="">Select a service</option>
                      {DEPARTMENTS.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                    <button className="btn btn-primary btn-sm" disabled={!chosen} onClick={() => pickDepartment(chosen)}>Continue</button>
                  </div>
                </div>
              </>
            ) : null}
          </section>
        )}

        {step === 'confirm' && dept && (
          <section>
            <button className="link-btn small row" style={{ marginBottom: 12 }} onClick={() => setStep(text.trim() && !presetService ? 'result' : 'describe')}>
              <ArrowLeft size={14} /> Back
            </button>
            <h1 tabIndex={-1} ref={headingRef}>Request support from {dept.name}</h1>
            <p className="text-2" style={{ marginTop: 6 }}>Check the details below. This service usually responds {dept.targetResponse.toLowerCase()}.</p>

            <form className="panel" style={{ marginTop: 20 }} onSubmit={send} noValidate>
              <div className="panel-body">
                <div className="field">
                  <label className="label" htmlFor="title">Summary</label>
                  <input id="title" className={`input${confirmErrors.title ? ' invalid' : ''}`} value={title} maxLength={90}
                    placeholder="For example: Struggling with exam stress" onChange={(e) => setTitle(e.target.value)} />
                  {confirmErrors.title && <span className="error-text">{confirmErrors.title}</span>}
                </div>
                <div className="field">
                  <label className="label" htmlFor="details">Details</label>
                  <textarea id="details" className={`textarea${confirmErrors.details ? ' invalid' : ''}`} rows={5} value={details}
                    placeholder="What’s happening, and is there anything you need by a certain date?" onChange={(e) => setDetails(e.target.value)} />
                  {confirmErrors.details && <span className="error-text">{confirmErrors.details}</span>}
                </div>
                <fieldset className="field" style={{ border: 0, padding: 0, margin: '16px 0 0' }}>
                  <legend className="label" style={{ marginBottom: 8 }}>How would you like to be contacted?</legend>
                  <div className="radio-row">
                    {CONTACT_OPTIONS.map((o) => (
                      <label key={o} className={`radio-pill${contact === o ? ' on' : ''}`}>
                        <input type="radio" name="contact" value={o} checked={contact === o} onChange={() => setContact(o)} /> {o}
                      </label>
                    ))}
                  </div>
                </fieldset>
                {match && match.reason !== 'You chose this service yourself.' && (
                  <div className="alert info" style={{ marginTop: 20 }}>
                    <Info size={16} />
                    <span>Suggested urgency: <strong>{match.urgency}</strong>. Staff will review this when your request arrives.</span>
                  </div>
                )}
                <div style={{ marginTop: 20 }}>
                  <label className="checkbox" style={{ alignItems: 'flex-start' }}>
                    <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} style={{ marginTop: 3 }} />
                    <span>I agree to share this request and my student record details with {dept.name} so they can help me.</span>
                  </label>
                  {confirmErrors.consent && <span className="error-text" style={{ marginTop: 6 }}>{confirmErrors.consent}</span>}
                </div>
              </div>
              {sendError && <div className="alert danger" role="alert" style={{ margin: '0 18px 16px' }}><AlertTriangle size={16} /> {sendError}</div>}
              <div className="panel-foot row" style={{ justifyContent: 'flex-end' }}>
                <Link to="/student" className="btn btn-ghost">Cancel</Link>
                <button className="btn btn-primary" type="submit" disabled={sending}>
                  {sending ? <><span className="spinner" /> Sending…</> : 'Send request'}
                </button>
              </div>
            </form>
          </section>
        )}
      </div>
    </div>
  );
}
