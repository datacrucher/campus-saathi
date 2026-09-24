import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut, Menu, RotateCcw, User, X } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useCases } from '../data/CaseStore';
import type { Role } from '../data/types';
import { initials } from '../lib/format';
import { useToast } from './Toast';
import { ErrorState, Wordmark } from './ui';
import { errorMessage } from '../lib/api';

interface NavItem { to: string; label: string; end?: boolean }

const NAV: Record<Role, NavItem[]> = {
  student: [
    { to: '/student', label: 'Home', end: true },
    { to: '/student/support', label: 'Find Support' },
    { to: '/student/requests', label: 'My Requests' },
    { to: '/student/services', label: 'Services' },
  ],
  staff: [
    { to: '/staff', label: 'My Cases', end: true },
    { to: '/staff/queue', label: 'Team Queue' },
  ],
  admin: [
    { to: '/admin', label: 'Overview', end: true },
    { to: '/admin/cases', label: 'Cases' },
    { to: '/admin/students', label: 'Students' },
    { to: '/admin/departments', label: 'Departments' },
    { to: '/admin/reports', label: 'Reports' },
  ],
};

const SCOPE: Record<Role, string | undefined> = { student: undefined, staff: 'Staff', admin: 'Operations' };

export function AppShell({ role }: { role: Role }) {
  const { user, signOut } = useAuth();
  const { resetDemo, error, cases, reload } = useCases();
  const notify = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const dark = role !== 'student';

  useEffect(() => { setMobileOpen(false); setMenuOpen(false); window.scrollTo(0, 0); }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => { if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [menuOpen]);

  if (!user) return null;

  const logout = () => {
    signOut().finally(() => navigate('/login', { replace: true, state: { signedOut: true } }));
  };
  const reset = () => {
    setMenuOpen(false);
    resetDemo()
      .then(() => notify('Demo data reset', 'All cases have been restored to their original state.'))
      .catch((e) => notify('Couldn’t reset demo data', errorMessage(e), 'error'));
  };

  return (
    <>
      <a href="#main" className="sr-only">Skip to content</a>
      <header className={`app-header${dark ? ' dark wide' : ''}`}>
        <div className="container">
          <button
            className="btn btn-ghost btn-icon nav-toggle"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((o) => !o)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <Wordmark to={`/${role}`} scope={SCOPE[role]} />
          <nav className="main-nav" aria-label="Main">
            {NAV[role].map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => (isActive ? 'active' : '')}>{n.label}</NavLink>
            ))}
          </nav>
          <div className="header-right">
            <div style={{ position: 'relative' }} ref={menuRef}>
              <button className="user-btn" onClick={() => setMenuOpen((o) => !o)} aria-haspopup="menu" aria-expanded={menuOpen}>
                <span className="avatar">{initials(user.name)}</span>
                <span className="who">
                  <span className="name">{user.name}</span>
                  <span className="role">{role === 'student' ? 'Student' : user.title}</span>
                </span>
                <ChevronDown size={14} className="who" />
              </button>
              {menuOpen && (
                <div className="menu" role="menu">
                  <div className="menu-head">
                    <div className="name">{user.name}</div>
                    <div className="email">{user.email}</div>
                  </div>
                  <Link to={`/${role}/profile`} role="menuitem"><User size={16} /> Profile</Link>
                  {role === 'admin' && <button role="menuitem" onClick={reset}><RotateCcw size={16} /> Reset demo data</button>}
                  <div className="sep" />
                  <button role="menuitem" onClick={logout}><LogOut size={16} /> Log out</button>
                </div>
              )}
            </div>
            <button className={`btn btn-ghost btn-sm header-logout`} onClick={logout} style={dark ? { color: 'var(--nav-dark-text)' } : undefined}>
              <LogOut size={15} /> Log out
            </button>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div className="mobile-nav" onClick={(e) => { if (e.target === e.currentTarget) setMobileOpen(false); }}>
          <nav aria-label="Mobile">
            {NAV[role].map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => (isActive ? 'active' : '')}>{n.label}</NavLink>
            ))}
            <NavLink to={`/${role}/profile`}><User size={18} /> Profile</NavLink>
            <button className="m-link" onClick={logout}><LogOut size={18} /> Log out</button>
          </nav>
        </div>
      )}

      <main id="main" key={location.pathname}>
        {error && cases.length === 0 ? (
          <div className="page"><div className="container narrow"><div className="panel">
            <ErrorState title="We couldn’t load your cases" action={<button className="btn btn-secondary" onClick={() => reload()}>Try again</button>}>
              {error}
            </ErrorState>
          </div></div></div>
        ) : <Outlet />}
      </main>

      <footer className="app-footer">
        <div className={`container`} style={dark ? { maxWidth: 1400 } : undefined}>
          <span>© {new Date().getFullYear()} Northbridge University · Campus Saathi prototype with demo data</span>
          <nav aria-label="Footer">
            <a href="#accessibility" onClick={(e) => e.preventDefault()}>Accessibility</a>
            <a href="#privacy" onClick={(e) => e.preventDefault()}>Privacy notice</a>
            <a href="mailto:servicedesk@northbridge.ac.uk">IT Service Desk</a>
          </nav>
        </div>
      </footer>
    </>
  );
}
