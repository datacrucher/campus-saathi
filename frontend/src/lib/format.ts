const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true }).replace(' ', ' ').toUpperCase();
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateTime(iso: string) {
  return `${formatDate(iso)}, ${formatTime(iso)}`;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function dayLabel(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  if (isSameDay(d, now)) return 'Today';
  const y = new Date(now); y.setDate(now.getDate() - 1);
  if (isSameDay(d, y)) return 'Yesterday';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < MIN) return 'Just now';
  if (diff < HOUR) return `${Math.floor(diff / MIN)} min ago`;
  if (diff < DAY) {
    const h = Math.floor(diff / HOUR);
    return `${h} hr${h === 1 ? '' : 's'} ago`;
  }
  if (diff < 2 * DAY) return 'Yesterday';
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)} days ago`;
  return formatDate(iso);
}

export function durationLabel(ms: number) {
  if (!Number.isFinite(ms) || ms <= 0) return '—';
  if (ms < DAY) { const h = Math.max(1, Math.round(ms / HOUR)); return `${h} hr${h === 1 ? '' : 's'}`; }
  const d = ms / DAY;
  return `${d.toFixed(1)} days`;
}

export function initials(name: string) {
  const parts = name.replace(/^(Dr|Prof\.|Mr|Mrs|Ms)\s+/, '').split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase();
}

export function greeting(date = new Date()) {
  const h = date.getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export const ageMs = (iso: string) => Date.now() - new Date(iso).getTime();
export { HOUR, DAY };

export function updatedPhrase(iso: string) {
  const r = relativeTime(iso);
  return /\d{4}$/.test(r) ? `on ${r}` : r.toLowerCase();
}
