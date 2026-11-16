const IN = 'en-IN';
export const fmtDate = (iso) => new Date(iso).toLocaleDateString(IN, { day: '2-digit', month: 'short', year: 'numeric' });
export const fmtDay = (iso) => new Date(iso).toLocaleDateString(IN, { weekday: 'long', day: 'numeric', month: 'short' });
export const fmtTime = (iso) => new Date(iso).toLocaleTimeString(IN, { hour: 'numeric', minute: '2-digit' }).toUpperCase();
export const fmtMonth = (iso) => new Date(iso).toLocaleDateString(IN, { month: 'short' });
export const fmtDayNum = (iso) => new Date(iso).getDate();
export const fmtDateTime = (iso) => `${fmtDate(iso)}, ${fmtTime(iso)}`;
export const fmtFee = (fee) => (fee > 0 ? `₹${fee}` : 'Free');

export const sameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();
export function fmtRange(start, end) {
  if (sameDay(start, end)) return `${fmtDay(start)} · ${fmtTime(start)} – ${fmtTime(end)}`;
  return `${fmtDay(start)}, ${fmtTime(start)} → ${fmtDay(end)}, ${fmtTime(end)}`;
}
export function isLive(e) { const n = Date.now(); return new Date(e.start) <= n && new Date(e.end) >= n; }
export function isToday(iso) { return sameDay(iso, new Date()); }

export function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}
export const initials = (name = '') => name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();

export const CATEGORY_COLORS = {
  Hackathon: '#7c8cff', Placement: '#3f6fe0', Workshop: '#5cc8b0', Seminar: '#7fb2ff', Fest: '#ffc93c', Competition: '#ff9f80',
};
export const CATEGORIES = Object.keys(CATEGORY_COLORS);

export { ORGANIZERS, ORGANIZER_NAMES, findOrganizer, attendanceBand, ATTENDANCE_GOOD, ATTENDANCE_OK } from '../../shared/organizers.js';
