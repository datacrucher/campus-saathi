import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff, GraduationCap, Info, ShieldCheck, Users } from 'lucide-react';
import { homeFor, useAuth } from '../auth/AuthContext';
import { FullPageSpinner } from '../auth/RequireRole';
import type { Role } from '../data/types';
import { Dialog, Wordmark } from '../components/ui';
import { errorMessage } from '../lib/api';

const DEMO_ROLES: { role: Role; label: string; icon: typeof Users; who: string }[] = [
  { role: 'student', label: 'Student', icon: GraduationCap, who: 'Abhilash Reddy' },
  { role: 'staff', label: 'Staff', icon: Users, who: 'Sarah Mitchell' },
  { role: 'admin', label: 'Admin', icon: ShieldCheck, who: 'James Okafor' },
];

export default function Login() {
  const { user, checking, signInAs, signInWithEmail } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? {}) as { from?: string; signedOut?: boolean };

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [busy, setBusy] = useState<Role | 'form' | null>(null);
  const [forgotOpen, setForgotOpen] = useState(false);

  if (checking) return <FullPageSpinner />;
  if (user && !busy) return <Navigate to={homeFor(user.role)} replace />;

  const goHome = (role: Role) => {
    const from = state.from && state.from.startsWith(`/${role}`) ? state.from : homeFor(role);
    navigate(from, { replace: true });
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    const em = email.trim();
    if (!em) next.email = 'Enter your university email address.';
    else if (!/^[^\s@]+@([a-z]+\.)?northbridge\.ac\.uk$/i.test(em)) next.email = 'Use your Northbridge University email address, for example a.reddy@student.northbridge.ac.uk.';
    if (!password) next.password = 'Enter your password.';
    setErrors(next);
    if (next.email || next.password) return;

    setBusy('form');
    signInWithEmail(em, password, remember)
      .then((u) => goHome(u.role))
      .catch((err) => {
        setBusy(null);
        setErrors({ form: errorMessage(err) });
      });
  };

  const demo = (role: Role) => {
    setBusy(role);
    setErrors({});
    signInAs(role, remember)
      .then(() => goHome(role))
      .catch((err) => {
        setBusy(null);
        setErrors({ form: errorMessage(err) });
      });
  };

  return (
    <div className="login">
      <aside className="login-brand">
        <div className="lb-inner">
          <Wordmark />
          <div className="lb-copy">
            <h1>One place to find the support you need.</h1>
            <p>Connect with the right university service without having to figure out which department to contact.</p>
          </div>
          <ul className="lb-points">
            <li><strong>12 student services</strong><span>Wellbeing, fees, housing, IT, visas and more</span></li>
            <li><strong>Routed to the right team</strong><span>Describe your situation in your own words</span></li>
            <li><strong>Track every request</strong><span>See updates and reply in one place</span></li>
          </ul>
          <div className="lb-foot">Northbridge University · Student Services</div>
        </div>
      </aside>

      <section className="login-main">
        <div className="login-card">
          <div className="login-mobile-mark"><Wordmark /></div>
          <h2 className="lc-title">Welcome back</h2>
          <p className="lc-sub">Sign in to continue to Campus Saathi</p>

          {state.signedOut && !errors.form && (
            <div className="alert info" style={{ marginBottom: 16 }}><Info size={16} /> You’ve been logged out.</div>
          )}
          {errors.form && (
            <div className="alert danger" role="alert" style={{ marginBottom: 16 }}><AlertCircle size={16} /> {errors.form}</div>
          )}

          <form onSubmit={onSubmit} noValidate>
            <div className="field">
              <label className="label" htmlFor="email">University Email</label>
              <input
                id="email" type="email" autoComplete="username" className={`input${errors.email ? ' invalid' : ''}`}
                placeholder="name@student.northbridge.ac.uk" value={email}
                onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors({ ...errors, email: undefined }); }}
                aria-invalid={!!errors.email} aria-describedby={errors.email ? 'email-err' : undefined}
              />
              {errors.email && <span className="error-text" id="email-err">{errors.email}</span>}
            </div>
            <div className="field">
              <label className="label" htmlFor="password">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password" type={showPw ? 'text' : 'password'} autoComplete="current-password"
                  className={`input${errors.password ? ' invalid' : ''}`} style={{ paddingRight: 42 }}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors({ ...errors, password: undefined }); }}
                  aria-invalid={!!errors.password} aria-describedby={errors.password ? 'pw-err' : undefined}
                />
                <button
                  type="button" className="btn btn-ghost btn-sm btn-icon" onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  style={{ position: 'absolute', right: 4, top: 5 }}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <span className="error-text" id="pw-err">{errors.password}</span>}
            </div>

            <div className="row" style={{ justifyContent: 'space-between', margin: '16px 0 20px' }}>
              <label className="checkbox">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Remember me
              </label>
              <button type="button" className="link-btn" onClick={() => setForgotOpen(true)}>Forgot password?</button>
            </div>

            <button className="btn btn-primary btn-lg btn-block" type="submit" disabled={!!busy}>
              {busy === 'form' ? <><span className="spinner" /> Signing in…</> : 'Sign In'}
            </button>
          </form>

          <p className="lc-new">
            New to Campus Saathi? <Link to="/get-help">Get help as a student</Link>
          </p>

          <div className="demo-access">
            <div className="da-head">
              <span>Demo access</span>
              <span className="da-tag">Prototype only</span>
            </div>
            <div className="da-buttons">
              {DEMO_ROLES.map(({ role, label, icon: Icon, who }) => (
                <button key={role} className="btn btn-secondary da-btn" onClick={() => demo(role)} disabled={!!busy}>
                  {busy === role ? <span className="spinner" /> : <Icon size={16} />}
                  <span className="da-label">{label}<span className="da-who">{who}</span></span>
                </button>
              ))}
            </div>
            <p className="help" style={{ marginTop: 10 }}>
              Signs in with sample data. Every sample account, such as <span className="mono">a.reddy@student.northbridge.ac.uk</span>, uses the password <span className="mono">CampusSaathi2026</span>.
            </p>
          </div>
        </div>
      </section>

      {forgotOpen && (
        <Dialog
          title="Reset your password"
          onClose={() => setForgotOpen(false)}
          footer={<button className="btn btn-primary" onClick={() => setForgotOpen(false)}>Got it</button>}
        >
          <p>Campus Saathi uses your Northbridge University account, so your password is the same one you use for Moodle and email.</p>
          <p style={{ marginTop: 10 }}>
            To reset it, go to <strong>account.northbridge.ac.uk</strong> or contact the IT Service Desk on <span className="mono">01632 960 270</span>.
          </p>
        </Dialog>
      )}
    </div>
  );
}
