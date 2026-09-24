import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { EmergencyContacts } from '../../components/EmergencyContacts';
import { useTitle } from '../../lib/hooks';

export default function Emergency() {
  useTitle('Emergency Help');
  return (
    <div className="page">
      <div className="container narrow stack">
        <div>
          <h1>Emergency Help</h1>
          <p className="text-2" style={{ marginTop: 6 }}>Use these contacts if you need help urgently. Campus Saathi requests are not monitored outside office hours.</p>
        </div>
        <div className="alert danger" role="alert">
          <AlertTriangle size={16} />
          <span><strong>If you or someone else is in immediate danger, call 999.</strong> On campus, also call Security on 01632 960 444 so they can guide emergency services to you.</span>
        </div>
        <section className="panel">
          <div className="panel-head"><h2>24-hour contacts</h2></div>
          <EmergencyContacts />
        </section>
        <section className="panel">
          <div className="panel-body row" style={{ justifyContent: 'space-between' }}>
            <div>
              <h3>Not an emergency?</h3>
              <p className="small text-2">Tell us what’s going on and we’ll point you to the right service.</p>
            </div>
            <Link to="/student/support" className="btn btn-secondary">Find Support</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
