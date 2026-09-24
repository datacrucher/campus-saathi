import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { DEPARTMENTS } from '../data/directory';
import { EmergencyContacts } from '../components/EmergencyContacts';
import { Wordmark } from '../components/ui';

export default function GetHelp() {
  return (
    <>
      <header className="app-header">
        <div className="container">
          <Wordmark to="/login" />
          <div className="header-right">
            <Link to="/login" className="btn btn-primary btn-sm">Sign in</Link>
          </div>
        </div>
      </header>
      <main className="page">
        <div className="container narrow stack">
          <Link to="/login" className="row small text-2"><ArrowLeft size={14} /> Back to sign in</Link>
          <div>
            <h1>Getting support as a Northbridge student</h1>
            <p className="text-2" style={{ marginTop: 6 }}>
              Campus Saathi is where you ask for help from any of the university’s student services. You don’t need an account to set up — sign in with the university email and password you already use for Moodle.
            </p>
          </div>

          <section className="panel">
            <div className="panel-head"><h2>If you need help right now</h2></div>
            <EmergencyContacts />
          </section>

          <section className="panel">
            <div className="panel-head"><h2>How it works</h2></div>
            <div className="panel-body">
              <ol className="steps">
                <li><strong>Tell us what’s going on</strong><span>Describe it in your own words. You don’t need to know which team deals with it.</span></li>
                <li><strong>We suggest the right service</strong><span>You’ll see which service can help and why, before anything is sent.</span></li>
                <li><strong>Track your request</strong><span>Staff reply in Campus Saathi and you’ll get an email when something changes.</span></li>
              </ol>
            </div>
          </section>

          <section className="panel">
            <div className="panel-head"><h2>Services you can reach through Campus Saathi</h2></div>
            <ul className="list two-col-list">
              {DEPARTMENTS.map((d) => (
                <li key={d.id} style={{ padding: '12px 18px' }}>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{d.name}</div>
                  <div className="small muted">{d.description}</div>
                </li>
              ))}
            </ul>
          </section>

          <div className="row">
            <Link to="/login" className="btn btn-primary">Sign in to get help</Link>
          </div>
        </div>
      </main>
    </>
  );
}
