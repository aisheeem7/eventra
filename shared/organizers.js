// Organising bodies on campus. Used by the server (attendance rules) and the client (forms, badges).
// `mandatoryFor` lists programme prefixes (matched against a student's department) that must attend
// every event this organizer runs. Everything else is optional.
export const ORGANIZERS = [
  { name: 'ASETK', full: 'Amity School of Engineering & Technology, Kolkata', focus: 'Engineering & tech events', mandatoryFor: ['B.Tech'], color: '#3f6fe0' },
  { name: 'Placement Cell', full: 'Training & Placement Cell', focus: 'Placement drives & career prep', mandatoryFor: ['B.Tech'], color: '#7c8cff' },
  { name: 'Business Club', full: 'Amity Business Club', focus: 'Startups & business events', mandatoryFor: [], color: '#f5b400' },
  { name: 'Coding Club', full: 'Amity Coding Club', focus: 'Competitive programming & dev workshops', mandatoryFor: [], color: '#5cc8b0' },
  { name: 'Cultural Committee', full: 'Cultural Committee', focus: 'Music, dance, drama & arts', mandatoryFor: [], color: '#ff9f80' },
  { name: 'Student Council', full: 'Student Council', focus: 'Campus-wide fests', mandatoryFor: [], color: '#b28cff' },
];

export const ORGANIZER_NAMES = ORGANIZERS.map((o) => o.name);
export const findOrganizer = (name) => ORGANIZERS.find((o) => o.name === name) || null;

export function isMandatoryFor(club, user) {
  if (!user || user.role !== 'student') return false;
  const o = findOrganizer(club);
  return !!o && o.mandatoryFor.some((p) => String(user.department || '').startsWith(p));
}

// Attendance health bands for the tracker ring.
export const ATTENDANCE_GOOD = 85;
export const ATTENDANCE_OK = 75;
export const attendanceBand = (pct) => (pct == null ? 'none' : pct >= ATTENDANCE_GOOD ? 'good' : pct >= ATTENDANCE_OK ? 'ok' : 'low');
