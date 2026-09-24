import { Phone, ShieldAlert } from 'lucide-react';

export const EMERGENCY_CONTACTS = [
  { name: 'Emergency services', detail: 'Police, ambulance or fire — if someone is in immediate danger', phone: '999' },
  { name: 'Campus Security (24 hours)', detail: 'Incidents on campus or in university halls', phone: '01632 960 444' },
  { name: 'Samaritans (24 hours)', detail: 'Free, confidential support if you’re struggling to cope', phone: '116 123' },
  { name: 'NHS 111', detail: 'Urgent medical advice when it isn’t an emergency', phone: '111' },
  { name: 'Out-of-hours Wellbeing Line', detail: 'Evenings, weekends and bank holidays', phone: '0800 048 6214' },
];

export function EmergencyContacts({ compact }: { compact?: boolean }) {
  const list = compact ? EMERGENCY_CONTACTS.slice(0, 3) : EMERGENCY_CONTACTS;
  return (
    <ul className="list">
      {list.map((c) => (
        <li key={c.name}>
          <a className="list-link" href={`tel:${c.phone.replace(/\s/g, '')}`}>
            <span className={`icon-box${c.phone === '999' ? ' danger' : ''}`}>
              {c.phone === '999' ? <ShieldAlert size={18} /> : <Phone size={18} />}
            </span>
            <span className="ll-main">
              <span className="ll-title" style={{ display: 'block' }}>{c.name}</span>
              <span className="ll-sub" style={{ display: 'block' }}>{c.detail}</span>
            </span>
            <span className="mono" style={{ fontWeight: 600, color: 'var(--text)' }}>{c.phone}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
