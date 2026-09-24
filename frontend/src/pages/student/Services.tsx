import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Check, ChevronRight, Clock, Mail, MapPin, Phone, Search } from 'lucide-react';
import { departmentById, DEPARTMENTS } from '../../data/directory';
import { useTitle } from '../../lib/hooks';
import { EmptyState, ErrorState } from '../../components/ui';

export function Services() {
  useTitle('Services');
  const [q, setQ] = useState('');
  const term = q.trim().toLowerCase();
  const list = DEPARTMENTS.filter((d) =>
    !term || [d.name, d.description, ...d.helpsWith].some((s) => s.toLowerCase().includes(term)));

  return (
    <div className="page">
      <div className="container">
        <div className="page-head">
          <div>
            <h1>Services</h1>
            <p className="sub">Every student service you can reach through Campus Saathi.</p>
          </div>
        </div>
        <section className="panel">
          <div className="toolbar">
            <div className="input-icon">
              <Search size={16} />
              <input className="input sm" placeholder="Search services, e.g. visa, extension, Wi-Fi" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search services" />
            </div>
            <span className="small muted">{list.length} of {DEPARTMENTS.length} services</span>
          </div>
          {list.length === 0 ? (
            <EmptyState title="No services match your search" icon={<Search size={20} />}
              action={<Link to="/student/support" className="btn btn-secondary">Describe your situation instead</Link>}>
              Try a different word, or tell us what’s going on and we’ll point you to the right team.
            </EmptyState>
          ) : (
            <ul className="list two-col-list">
              {list.map((d) => (
                <li key={d.id}>
                  <Link to={`/student/services/${d.id}`} className="list-link">
                    <span className="ll-main">
                      <span className="ll-title" style={{ display: 'block' }}>{d.name}</span>
                      <span className="ll-sub" style={{ display: 'block' }}>{d.description}</span>
                    </span>
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

export function ServiceDetail() {
  const { id = '' } = useParams();
  const d = departmentById(id);
  useTitle(d?.name ?? 'Service not found');
  if (!d) {
    return (
      <div className="page"><div className="container narrow"><div className="panel">
        <ErrorState title="Service not found" action={<Link to="/student/services" className="btn btn-secondary">View all services</Link>}>
          This service may have moved or been renamed.
        </ErrorState>
      </div></div></div>
    );
  }
  return (
    <div className="page">
      <div className="container">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link to="/student/services">Services</Link><ChevronRight size={13} /><span>{d.name}</span>
        </nav>
        <div className="page-head">
          <div>
            <h1>{d.name}</h1>
            <p className="sub">{d.description}</p>
          </div>
          <Link to={`/student/support?service=${d.id}`} className="btn btn-primary">Request support</Link>
        </div>
        <div className="grid-2">
          <section className="panel">
            <div className="panel-head"><h2>We can help with</h2></div>
            <ul className="check-list panel-body">
              {d.helpsWith.map((h) => <li key={h}><Check size={16} /> {h}</li>)}
            </ul>
            <div className="panel-foot small text-2">
              Not sure this is the right service? <Link to="/student/support">Describe your situation</Link> and we’ll suggest one.
            </div>
          </section>
          <aside className="panel">
            <div className="panel-head"><h2>Contact</h2></div>
            <ul className="contact-list panel-body">
              <li><MapPin size={16} /><span>{d.location}</span></li>
              <li><Clock size={16} /><span>{d.hours}</span></li>
              <li><Phone size={16} /><a href={`tel:${d.phone.replace(/\s/g, '')}`}>{d.phone}</a></li>
              <li><Mail size={16} /><a href={`mailto:${d.email}`}>{d.email}</a></li>
            </ul>
            <div className="panel-foot small text-2">Typical response: <strong>{d.targetResponse}</strong></div>
          </aside>
        </div>
      </div>
    </div>
  );
}
