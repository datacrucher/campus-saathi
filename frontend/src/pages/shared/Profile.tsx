import { useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { departmentById, staffById, studentById } from '../../data/directory';
import { initials } from '../../lib/format';
import { useTitle } from '../../lib/hooks';
import { useToast } from '../../components/Toast';

export default function Profile() {
  useTitle('Profile');
  const { user } = useAuth();
  const notify = useToast();
  const [prefs, setPrefs] = useState({ email: true, sms: false, digest: user!.role !== 'student' });
  const [saving, setSaving] = useState(false);

  const student = user!.role === 'student' ? studentById(user!.id) : undefined;
  const staff = user!.role === 'staff' ? staffById(user!.id) : undefined;

  const save = () => {
    setSaving(true);
    window.setTimeout(() => { setSaving(false); notify('Preferences saved'); }, 500);
  };

  return (
    <div className="page">
      <div className="container narrow stack">
        <div className="row" style={{ gap: 14 }}>
          <span className="avatar lg">{initials(user!.name)}</span>
          <div>
            <h1>{user!.name}</h1>
            <p className="text-2 small">{user!.title}</p>
          </div>
        </div>

        <section className="panel">
          <div className="panel-head">
            <h2>Account details</h2>
            <span className="hint">Managed by {student ? 'Registry' : 'Human Resources'} — contact them to make changes</span>
          </div>
          <div className="panel-body">
            <dl className="dl">
              <dt>Email</dt><dd>{user!.email}</dd>
              {student && <>
                <dt>Student ID</dt><dd className="mono">{student.studentNumber}</dd>
                <dt>Programme</dt><dd>{student.programme}</dd>
                <dt>Year of study</dt><dd>{student.year} · {student.mode}</dd>
                <dt>Faculty</dt><dd>{student.faculty}</dd>
                <dt>Personal tutor</dt><dd>{student.tutor}</dd>
                <dt>Mobile</dt><dd>{student.phone}</dd>
              </>}
              {staff && <>
                <dt>Job title</dt><dd>{staff.title}</dd>
                <dt>Team</dt><dd>{departmentById(staff.departmentId)?.team}</dd>
                <dt>Department</dt><dd>{departmentById(staff.departmentId)?.name}</dd>
              </>}
              {user!.role === 'admin' && <>
                <dt>Access</dt><dd>All departments · Operations reporting</dd>
              </>}
            </dl>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head"><h2>Notifications</h2></div>
          <div className="panel-body" style={{ display: 'grid', gap: 12 }}>
            <label className="checkbox"><input type="checkbox" checked={prefs.email} onChange={(e) => setPrefs({ ...prefs, email: e.target.checked })} />
              {user!.role === 'student' ? 'Email me when a service replies to my request' : 'Email me when a case is assigned to me'}</label>
            <label className="checkbox"><input type="checkbox" checked={prefs.sms} onChange={(e) => setPrefs({ ...prefs, sms: e.target.checked })} />
              Text me about urgent updates</label>
            <label className="checkbox"><input type="checkbox" checked={prefs.digest} onChange={(e) => setPrefs({ ...prefs, digest: e.target.checked })} />
              {user!.role === 'student' ? 'Send me a weekly summary of open requests' : 'Send me a daily summary of open cases'}</label>
          </div>
          <div className="panel-foot row" style={{ justifyContent: 'flex-end' }}>
            <button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>{saving ? <><span className="spinner" /> Saving…</> : 'Save preferences'}</button>
          </div>
        </section>
      </div>
    </div>
  );
}
