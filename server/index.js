import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import * as store from './db.js';
import { seed } from './seed.js';
import { ORGANIZER_NAMES, isMandatoryFor } from '../shared/organizers.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 4000;

if (!store.load()) { seed(); console.log('No database found — seeded demo data.'); }
const db = () => store.get();

const app = express();
app.use(express.json({ limit: '2mb' })); // profile photos arrive as resized data URLs

// ---------------- helpers ----------------
class HttpError extends Error { constructor(status, msg) { super(msg); this.status = status; } }
const fail = (status, msg) => { throw new HttpError(status, msg); };
const wrap = (fn) => (req, res, next) => { try { const out = fn(req, res); if (out !== undefined) res.json(out); } catch (e) { next(e); } };

const publicUser = (u) => u && ({ id: u.id, name: u.name, email: u.email, roll: u.roll, phone: u.phone, role: u.role, department: u.department, year: u.year, club: u.club || null, avatar: u.avatar || null });

function auth(...roles) {
  return (req, _res, next) => {
    const email = store.verifyToken((req.headers.authorization || '').replace('Bearer ', ''));
    const user = email && db().users.find((u) => u.email.toLowerCase() === email);
    if (!user) return next(new HttpError(401, 'Please sign in again.'));
    if (roles.length && !roles.includes(user.role)) return next(new HttpError(403, 'You do not have access to this.'));
    req.user = user;
    next();
  };
}

const activeRegs = (eventId) => db().registrations.filter((r) => r.eventId === eventId && ['confirmed', 'pending'].includes(r.status));

function eventView(e, user) {
  const regs = activeRegs(e.id);
  const confirmed = regs.filter((r) => r.status === 'confirmed').length;
  const attended = db().registrations.filter((r) => r.eventId === e.id && r.checkedInAt).length;
  const organizer = db().users.find((u) => u.id === e.organizerId);
  const mine = user && db().registrations.find((r) => r.eventId === e.id && r.userId === user.id && r.status !== 'cancelled');
  return {
    ...e,
    organizerName: organizer?.name,
    registered: regs.length,
    confirmed,
    attended,
    seatsLeft: Math.max(0, e.capacity - regs.length),
    mandatory: isMandatoryFor(e.club, user),
    myRegistration: mine ? { id: mine.id, status: mine.status, ticketCode: mine.ticketCode } : null,
  };
}

function canManage(user, event) {
  return user.role === 'admin' || (user.role === 'organizer' && event.organizerId === user.id);
}
function findEvent(id) { return db().events.find((e) => e.id === id) || fail(404, 'Event not found.'); }

function ticketView(r) {
  const e = db().events.find((x) => x.id === r.eventId);
  const u = db().users.find((x) => x.id === r.userId);
  return {
    id: r.id, status: r.status, ticketCode: r.ticketCode, createdAt: r.createdAt, checkedInAt: r.checkedInAt, payment: r.payment,
    qrPayload: r.status === 'confirmed' ? store.signTicket(r.id) : null,
    holder: { name: u?.name, roll: u?.roll },
    event: e && { id: e.id, title: e.title, start: e.start, end: e.end, venue: e.venue, category: e.category, status: e.status, club: e.club },
  };
}

// ---------------- auth ----------------
app.post('/api/auth/login', wrap((req) => {
  const { identifier, password } = req.body || {};
  const id = String(identifier || '').trim().toLowerCase();
  const user = db().users.find((u) => u.email.toLowerCase() === id || u.roll.toLowerCase() === id);
  if (!user || !store.checkPassword(String(password || ''), user.password)) fail(401, 'Email/roll number or password is incorrect.');
  store.save();
  return { token: store.signToken(user.email), user: publicUser(user) };
}));

app.post('/api/auth/register', wrap((req) => {
  const { name, email, roll, phone, password, year } = req.body || {};
  if (!name?.trim() || !email?.trim() || !roll?.trim() || !password) fail(400, 'Name, email, roll number and password are required.');
  if (!/^\S+@\S+\.\S+$/.test(email)) fail(400, 'Enter a valid email address.');
  if (String(password).length < 6) fail(400, 'Password must be at least 6 characters.');
  // Duplicate-identity check (objective 01 in the deck)
  if (db().users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase())) fail(409, 'An account with this email already exists.');
  if (db().users.some((u) => u.roll.toLowerCase() === roll.trim().toLowerCase())) fail(409, 'This roll number is already registered.');
  const user = { id: store.newId('usr'), name: name.trim(), email: email.trim(), roll: roll.trim().toUpperCase(), phone: phone || '', role: 'student',
    department: 'B.Tech CSE', year: year || '', password: store.hashPassword(password), createdAt: new Date().toISOString() };
  db().users.push(user);
  store.save();
  return { token: store.signToken(user.email), user: publicUser(user) };
}));

app.get('/api/auth/me', auth(), wrap((req) => ({ user: publicUser(req.user) })));
app.post('/api/auth/logout', auth(), wrap((req) => {
  return { ok: true }; // tokens are stateless; the client discards it
}));
app.put('/api/auth/me', auth(), wrap((req) => {
  const { name, phone, year, avatar } = req.body || {};
  if (avatar !== undefined) {
    if (avatar === null || avatar === '') delete req.user.avatar;
    else if (typeof avatar !== 'string' || !/^data:image\/(png|jpe?g|webp);base64,/.test(avatar)) fail(400, 'Upload a PNG, JPG or WebP image.');
    else if (avatar.length > 700_000) fail(413, 'That photo is too large. Try a smaller image.');
    else req.user.avatar = avatar;
  }
  if (name?.trim()) req.user.name = name.trim();
  if (phone !== undefined) req.user.phone = phone;
  if (year !== undefined) req.user.year = year;
  store.save();
  return { user: publicUser(req.user) };
}));

// ---------------- events ----------------
app.get('/api/events', auth(), wrap((req) => {
  const { q = '', category = '', scope = 'upcoming' } = req.query;
  const now = Date.now();
  let list = db().events.filter((e) => e.status !== 'cancelled');
  if (scope === 'upcoming') list = list.filter((e) => e.status === 'published' && new Date(e.end).getTime() >= now);
  if (scope === 'past') list = list.filter((e) => e.status === 'completed' || new Date(e.end).getTime() < now);
  if (category && category !== 'All') list = list.filter((e) => e.category === category);
  const term = q.trim().toLowerCase();
  if (term) list = list.filter((e) => [e.title, e.venue, e.club, e.category].join(' ').toLowerCase().includes(term));
  list.sort((a, b) => new Date(a.start) - new Date(b.start));
  return { events: list.map((e) => eventView(e, req.user)) };
}));

app.get('/api/events/:id', auth(), wrap((req) => ({ event: eventView(findEvent(req.params.id), req.user) })));

const EVENT_FIELDS = ['title', 'category', 'club', 'description', 'venue', 'start', 'end', 'capacity', 'fee', 'requiresApproval'];
function cleanEvent(body, partial = false) {
  const out = {};
  for (const f of EVENT_FIELDS) if (body[f] !== undefined) out[f] = body[f];
  if (out.capacity !== undefined) out.capacity = Math.max(1, parseInt(out.capacity, 10) || 0);
  if (out.fee !== undefined) out.fee = Math.max(0, parseInt(out.fee, 10) || 0);
  if (out.requiresApproval !== undefined) out.requiresApproval = !!out.requiresApproval;
  if (!partial) for (const f of ['title', 'category', 'venue', 'start', 'end', 'capacity']) if (!out[f]) fail(400, `Missing field: ${f}`);
  if (out.club !== undefined && !ORGANIZER_NAMES.includes(out.club)) fail(400, 'Choose an organizer from the list.');
  if (out.start && out.end && new Date(out.end) <= new Date(out.start)) fail(400, 'End time must be after the start time.');
  return out;
}

app.post('/api/events', auth('organizer', 'admin'), wrap((req) => {
  const e = { id: store.newId('evt'), organizerId: req.user.id, status: 'published', fee: 0, requiresApproval: false, description: '',
    club: req.user.club || '', createdAt: new Date().toISOString(), ...cleanEvent(req.body) };
  db().events.push(e); store.save();
  return { event: eventView(e, req.user) };
}));

app.put('/api/events/:id', auth('organizer', 'admin'), wrap((req) => {
  const e = findEvent(req.params.id);
  if (!canManage(req.user, e)) fail(403, 'Only this event\'s organizer can edit it.');
  const patch = cleanEvent(req.body, true);
  if (patch.capacity !== undefined && patch.capacity < activeRegs(e.id).length) fail(400, 'Capacity cannot be lower than current registrations.');
  Object.assign(e, patch); store.save();
  return { event: eventView(e, req.user) };
}));

app.post('/api/events/:id/cancel', auth('organizer', 'admin'), wrap((req) => {
  const e = findEvent(req.params.id);
  if (!canManage(req.user, e)) fail(403, 'Not allowed.');
  e.status = 'cancelled'; store.save();
  return { ok: true };
}));

// Close event → certificates generated ONLY for verified attendees (objective 04)
app.post('/api/events/:id/complete', auth('organizer', 'admin'), wrap((req) => {
  const e = findEvent(req.params.id);
  if (!canManage(req.user, e)) fail(403, 'Not allowed.');
  e.status = 'completed';
  let issued = 0;
  for (const r of db().registrations.filter((x) => x.eventId === e.id && x.checkedInAt)) {
    if (db().certificates.some((c) => c.registrationId === r.id)) continue;
    db().certificates.push({ id: store.newCertId(), registrationId: r.id, eventId: e.id, userId: r.userId, issuedAt: new Date().toISOString() });
    issued++;
  }
  store.save();
  return { issued, event: eventView(e, req.user) };
}));

// ---------------- registration & tickets ----------------
app.post('/api/events/:id/register', auth('student'), wrap((req) => {
  const e = findEvent(req.params.id);
  if (e.status !== 'published' || new Date(e.end) < new Date()) fail(400, 'Registration for this event is closed.');
  const existing = db().registrations.find((r) => r.eventId === e.id && r.userId === req.user.id && r.status !== 'cancelled');
  if (existing) fail(409, 'You are already registered for this event.');
  if (activeRegs(e.id).length >= e.capacity) fail(409, 'Sorry, this event is full.');
  let payment = null;
  if (e.fee > 0) {
    const ref = String(req.body?.paymentRef || '').trim();
    if (!ref) fail(402, `This event has a ₹${e.fee} fee. Complete the payment first.`);
    payment = { status: 'paid', amount: e.fee, ref };
  }
  if (req.body?.phone) req.user.phone = req.body.phone;
  const r = { id: store.newId('reg'), eventId: e.id, userId: req.user.id, status: e.requiresApproval ? 'pending' : 'confirmed', payment,
    ticketCode: store.newTicketCode(), createdAt: new Date().toISOString(), checkedInAt: null, checkedInBy: null };
  db().registrations.push(r); store.save();
  return { ticket: ticketView(r) };
}));

app.get('/api/me/tickets', auth(), wrap((req) => ({
  tickets: db().registrations.filter((r) => r.userId === req.user.id && r.status !== 'cancelled')
    .map(ticketView).sort((a, b) => new Date(a.event?.start) - new Date(b.event?.start)),
})));

app.get('/api/tickets/:id', auth(), wrap((req) => {
  const r = db().registrations.find((x) => x.id === req.params.id) || fail(404, 'Ticket not found.');
  const e = db().events.find((x) => x.id === r.eventId);
  if (r.userId !== req.user.id && !canManage(req.user, e)) fail(403, 'Not your ticket.');
  return { ticket: ticketView(r) };
}));

app.post('/api/tickets/:id/cancel', auth('student'), wrap((req) => {
  const r = db().registrations.find((x) => x.id === req.params.id && x.userId === req.user.id) || fail(404, 'Ticket not found.');
  if (r.checkedInAt) fail(400, 'You have already attended this event.');
  r.status = 'cancelled'; store.save();
  return { ok: true };
}));

// ---------------- attendance ----------------
// Attendance = share of *mandatory* events (already held) that the student was scanned into.
// Optional events never lower the score; they are reported separately.
const heldEvents = () => db().events.filter((e) => e.status !== 'cancelled' && (e.status === 'completed' || new Date(e.end).getTime() < Date.now()));
const pct = (a, t) => (t ? Math.round((a / t) * 100) : null);

function attendanceFor(user) {
  const attendedIds = new Set(db().registrations.filter((r) => r.userId === user.id && r.checkedInAt).map((r) => r.eventId));
  const held = heldEvents().sort((a, b) => new Date(b.start) - new Date(a.start));
  const mandatory = held.filter((e) => isMandatoryFor(e.club, user));
  const attended = mandatory.filter((e) => attendedIds.has(e.id)).length;
  const byOrg = {};
  for (const e of mandatory) {
    const o = (byOrg[e.club] ||= { club: e.club, attended: 0, total: 0 });
    o.total += 1; if (attendedIds.has(e.id)) o.attended += 1;
  }
  const optional = held.filter((e) => !isMandatoryFor(e.club, user) && attendedIds.has(e.id));
  return {
    required: mandatory.length > 0 || isMandatoryFor('ASETK', user),
    attended, total: mandatory.length, pct: pct(attended, mandatory.length),
    byOrganizer: Object.values(byOrg).map((o) => ({ ...o, pct: pct(o.attended, o.total) })),
    events: mandatory.map((e) => ({ id: e.id, title: e.title, start: e.start, club: e.club, category: e.category, attended: attendedIds.has(e.id) })),
    optional: optional.map((e) => ({ id: e.id, title: e.title, start: e.start, club: e.club, category: e.category })),
  };
}

app.get('/api/me/attendance', auth('student'), wrap((req) => ({ attendance: attendanceFor(req.user) })));

app.get('/api/attendance', auth('organizer', 'admin'), wrap(() => ({
  students: db().users.filter((u) => u.role === 'student').map((u) => {
    const a = attendanceFor(u);
    return { id: u.id, name: u.name, roll: u.roll, department: u.department, year: u.year, avatar: u.avatar || null,
      required: a.required, attended: a.attended, total: a.total, pct: a.pct, byOrganizer: a.byOrganizer, optionalCount: a.optional.length };
  }).sort((a, b) => (a.pct ?? 101) - (b.pct ?? 101)),
})));

// ---------------- organizer ----------------
app.get('/api/organizer/events', auth('organizer', 'admin'), wrap((req) => {
  const list = db().events.filter((e) => req.user.role === 'admin' || e.organizerId === req.user.id)
    .sort((a, b) => new Date(b.start) - new Date(a.start));
  return { events: list.map((e) => eventView(e, req.user)) };
}));

app.get('/api/events/:id/registrations', auth('organizer', 'admin', 'staff'), wrap((req) => {
  const e = findEvent(req.params.id);
  if (req.user.role === 'organizer' && !canManage(req.user, e)) fail(403, 'Not allowed.');
  const rows = db().registrations.filter((r) => r.eventId === e.id).map((r) => {
    const u = db().users.find((x) => x.id === r.userId);
    const cert = db().certificates.find((c) => c.registrationId === r.id);
    return { id: r.id, status: r.status, ticketCode: r.ticketCode, createdAt: r.createdAt, checkedInAt: r.checkedInAt, payment: r.payment,
      certificateId: cert?.id || null, student: { name: u?.name, roll: u?.roll, email: u?.email, phone: u?.phone } };
  });
  return { event: eventView(e, req.user), registrations: rows };
}));

app.post('/api/registrations/:id/:action(approve|reject)', auth('organizer', 'admin'), wrap((req) => {
  const r = db().registrations.find((x) => x.id === req.params.id) || fail(404, 'Registration not found.');
  if (!canManage(req.user, findEvent(r.eventId))) fail(403, 'Not allowed.');
  r.status = req.params.action === 'approve' ? 'confirmed' : 'rejected'; store.save();
  return { ok: true, status: r.status };
}));

app.get('/api/events/:id/export.csv', auth('organizer', 'admin'), (req, res, next) => {
  try {
    const e = findEvent(req.params.id);
    if (!canManage(req.user, e)) fail(403, 'Not allowed.');
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = [['Name', 'Roll Number', 'Email', 'Phone', 'Status', 'Ticket', 'Checked In At', 'Payment Ref'].map(esc).join(',')];
    for (const r of db().registrations.filter((x) => x.eventId === e.id)) {
      const u = db().users.find((x) => x.id === r.userId) || {};
      lines.push([u.name, u.roll, u.email, u.phone, r.status, r.ticketCode, r.checkedInAt || '', r.payment?.ref || ''].map(esc).join(','));
    }
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${e.title.replace(/[^a-z0-9]+/gi, '-')}-attendance.csv"`);
    res.send(lines.join('\n'));
  } catch (err) { next(err); }
});

// ---------------- entry verification ----------------
app.post('/api/checkin', auth('staff', 'organizer', 'admin'), wrap((req) => {
  const { eventId, code } = req.body || {};
  const e = findEvent(eventId);
  const raw = String(code || '').trim();
  let reg = null;
  const regId = store.verifyTicket(raw);
  if (regId) reg = db().registrations.find((r) => r.id === regId);
  else if (/^CEMS-\d{6}$/i.test(raw)) reg = db().registrations.find((r) => r.ticketCode === raw.toUpperCase());

  const log = (result, r) => { db().scans.push({ id: store.newId('scn'), eventId: e.id, registrationId: r?.id || null, result, at: new Date().toISOString(), by: req.user.id }); store.save(); };
  const holder = (r) => { const u = db().users.find((x) => x.id === r.userId); return { name: u?.name, roll: u?.roll }; };

  if (!reg) { log('invalid'); return { result: 'invalid', message: raw.startsWith('CEMS1.') ? 'Signature check failed — this QR was not issued by CEMS.' : 'No ticket matches this code.' }; }
  if (reg.eventId !== e.id) { log('wrong_event', reg); const other = db().events.find((x) => x.id === reg.eventId); return { result: 'wrong_event', message: `This ticket is for “${other?.title}”.`, holder: holder(reg) }; }
  if (reg.status !== 'confirmed') { log('not_confirmed', reg); return { result: 'not_confirmed', message: `Registration is ${reg.status}. Entry not allowed.`, holder: holder(reg) }; }
  if (reg.checkedInAt) { log('duplicate', reg); return { result: 'duplicate', message: `Already checked in at ${new Date(reg.checkedInAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}. Possible reused ticket.`, holder: holder(reg) }; }
  reg.checkedInAt = new Date().toISOString(); reg.checkedInBy = req.user.id;
  log('valid', reg);
  return { result: 'valid', message: 'Entry verified. Attendance logged.', holder: holder(reg), ticketCode: reg.ticketCode };
}));

app.get('/api/events/:id/live', auth('staff', 'organizer', 'admin'), wrap((req) => {
  const e = findEvent(req.params.id);
  const scans = db().scans.filter((s) => s.eventId === e.id).slice(-12).reverse().map((s) => {
    const r = s.registrationId && db().registrations.find((x) => x.id === s.registrationId);
    const u = r && db().users.find((x) => x.id === r.userId);
    return { ...s, name: u?.name || 'Unknown ticket', roll: u?.roll || '' };
  });
  return { event: eventView(e, req.user), scans };
}));

// ---------------- certificates ----------------
function certView(c) {
  const e = db().events.find((x) => x.id === c.eventId);
  const u = db().users.find((x) => x.id === c.userId);
  const r = db().registrations.find((x) => x.id === c.registrationId);
  return { id: c.id, issuedAt: c.issuedAt, attendedAt: r?.checkedInAt,
    holder: { name: u?.name, roll: u?.roll, department: u?.department },
    event: e && { id: e.id, title: e.title, start: e.start, end: e.end, venue: e.venue, category: e.category, club: e.club } };
}
app.get('/api/me/certificates', auth(), wrap((req) => ({
  certificates: db().certificates.filter((c) => c.userId === req.user.id).map(certView).sort((a, b) => new Date(b.issuedAt) - new Date(a.issuedAt)),
})));
// Public verification — anyone can check a certificate ID is genuine
app.get('/api/certificates/:id', wrap((req) => {
  const c = db().certificates.find((x) => x.id === req.params.id.toUpperCase()) || fail(404, 'No certificate with this ID exists. It may be forged.');
  return { certificate: certView(c) };
}));

// ---------------- admin ----------------
app.get('/api/admin/stats', auth('admin'), wrap(() => {
  const D = db();
  const live = D.registrations.filter((r) => r.status !== 'cancelled');
  const byEvent = D.events.filter((e) => e.status !== 'cancelled').map((e) => ({
    id: e.id, title: e.title, category: e.category, start: e.start, status: e.status, capacity: e.capacity,
    registered: live.filter((r) => r.eventId === e.id).length,
    attended: live.filter((r) => r.eventId === e.id && r.checkedInAt).length,
  })).sort((a, b) => new Date(a.start) - new Date(b.start));
  const byCategory = {};
  for (const e of byEvent) byCategory[e.category] = (byCategory[e.category] || 0) + e.registered;
  const revenue = live.reduce((s, r) => s + (r.payment?.amount || 0), 0);
  const blocked = D.scans.filter((s) => s.result !== 'valid').length;
  return {
    totals: {
      events: byEvent.length, upcoming: byEvent.filter((e) => e.status === 'published').length,
      users: D.users.length, students: D.users.filter((u) => u.role === 'student').length,
      registrations: live.length, attended: live.filter((r) => r.checkedInAt).length,
      certificates: D.certificates.length, revenue, blockedScans: blocked,
    },
    byEvent, byCategory,
  };
}));
app.get('/api/admin/users', auth('admin'), wrap(() => ({
  users: db().users.map((u) => ({ ...publicUser(u), registrations: db().registrations.filter((r) => r.userId === u.id && r.status !== 'cancelled').length })),
})));
app.put('/api/admin/users/:id/role', auth('admin'), wrap((req) => {
  const u = db().users.find((x) => x.id === req.params.id) || fail(404, 'User not found.');
  if (!['student', 'organizer', 'staff', 'admin'].includes(req.body?.role)) fail(400, 'Unknown role.');
  if (u.id === req.user.id) fail(400, 'You cannot change your own role.');
  u.role = req.body.role; store.save();
  return { user: publicUser(u) };
}));
app.post('/api/admin/reset-demo', auth('admin'), wrap(() => { seed(); return { ok: true }; }));

// ---------------- errors + static ----------------
app.use('/api', (_req, _res, next) => next(new HttpError(404, 'Not found')));
app.use((err, _req, res, _next) => {
  if (!(err instanceof HttpError)) console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Something went wrong' });
});

const dist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

export default app;

// Vercel imports the app as a serverless function (api/index.js); everywhere else we run a normal server.
if (!process.env.VERCEL) app.listen(PORT, () => {
  console.log(`\n  EvenTra API running → http://localhost:${PORT}`);
  if (fs.existsSync(dist)) console.log(`  App:             → http://localhost:${PORT}\n`);
  else console.log('  (Front end not built — use "npm run dev" and open http://localhost:5173)\n');
});
