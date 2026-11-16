// Seeds demo data. Dates are relative to "today" so the demo always has
// a live event happening today, upcoming events, and a completed one with certificates.
import { pathToFileURL } from 'url';
import * as store from './db.js';

const PASSWORD = 'demo123';

function day(offset, time = '10:00') {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const [h, m] = time.split(':').map(Number);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

export function seed() {
  // Same IDs on every instance, so links and tickets keep working across serverless instances.
  return store.withSeededIds('eventra-demo-v1', seedData);
}

function seedData() {
  const db = store.reset({});
  const now = new Date().toISOString();

  const people = [
    { name: 'Aishee Mukherjee', roll: 'A910055223131', role: 'student', email: 'aishee@cems.demo', phone: '+91 98300 11131' },
    { name: 'Adrija Tarafder', roll: 'A910055223102', role: 'student', email: 'adrija@cems.demo', phone: '+91 98300 11102' },
    { name: 'Debopriya Das', roll: 'A910055223003', role: 'student', email: 'debopriya@cems.demo', phone: '+91 98300 11003' },
    { name: 'Bhawya Mishra', roll: 'A910055223217', role: 'student', email: 'bhawya@cems.demo', phone: '+91 98300 11217' },
    { name: 'Bhaswati Medhi', roll: 'A910055223191', role: 'organizer', email: 'bhaswati@cems.demo', phone: '+91 98300 11191', club: 'ASETK' },
    { name: 'Ananya Rout', roll: 'A910055223188', role: 'staff', email: 'ananya@cems.demo', phone: '+91 98300 11188' },
    { name: 'EvenTra Admin', roll: 'ADMIN-001', role: 'admin', email: 'admin@cems.demo', phone: '' },
  ];
  const users = people.map((p) => ({
    id: store.newId('usr'),
    ...p,
    department: p.role === 'admin' ? 'Office of Student Affairs' : 'B.Tech CSE',
    year: p.role === 'admin' ? null : '4th Year (2023–27)',
    password: store.hashPassword(PASSWORD),
    createdAt: now,
  }));
  db.users = users;
  const U = Object.fromEntries(users.map((u) => [u.name.split(' ')[0].toLowerCase(), u]));
  const org = U.bhaswati.id;

  const ev = (o) => ({
    id: store.newId('evt'),
    organizerId: org,
    status: 'published',
    requiresApproval: false,
    fee: 0,
    createdAt: now,
    ...o,
  });

  db.events = [
    ev({ title: 'Cloud & DevOps Hands-on Workshop', category: 'Workshop', club: 'ASETK', start: day(0, '14:00'), end: day(0, '17:00'),
      venue: 'Computer Lab 3, Block B', capacity: 60,
      description: 'Deploy your first containerised app. We cover Docker basics, CI with GitHub Actions and a live deploy to a free cloud tier. Bring a laptop with Docker Desktop installed.' }),
    ev({ title: 'Pre-Placement Talk — Quantiva Technologies', category: 'Placement', club: 'Placement Cell', start: day(4, '11:00'), end: day(4, '13:00'),
      venue: 'Main Auditorium', capacity: 250,
      description: 'The recruitment team walks through the SDE and Data Analyst roles for the 2027 batch, the selection process, CTC structure and an open Q&A. Mandatory for students opting into this drive.' }),
    ev({ title: 'Git & GitHub for Beginners', category: 'Workshop', club: 'Coding Club', start: day(6, '15:00'), end: day(6, '17:00'),
      venue: 'Seminar Hall 2', capacity: 80,
      description: 'Branches, pull requests, resolving merge conflicts and contributing to open source — everything you need before your first hackathon.' }),
    ev({ title: 'Resume Review & Mock Interviews', category: 'Placement', club: 'Placement Cell', start: day(9, '10:00'), end: day(9, '16:00'),
      venue: 'T&P Interview Rooms', capacity: 40, requiresApproval: true,
      description: 'One-on-one resume review and a 20-minute technical mock interview with alumni. Limited slots — the T&P cell approves registrations in order of submission.' }),
    ev({ title: 'Guest Lecture: Careers in AI/ML', category: 'Seminar', club: 'ASETK', start: day(11, '12:00'), end: day(11, '13:30'),
      venue: 'Seminar Hall 1', capacity: 150,
      description: 'An industry ML engineer on what entry-level AI roles really look like, which skills matter, and how to build a portfolio that stands out.' }),
    ev({ title: 'CodeSprint — Competitive Programming Contest', category: 'Competition', club: 'Coding Club', start: day(13, '10:00'), end: day(13, '13:00'),
      venue: 'Computer Lab 1 & 2', capacity: 120, fee: 50,
      description: 'Three hours, six problems, ICPC-style scoring. Top three win cash prizes and every participant who shows up gets a participation certificate.' }),
    ev({ title: 'HackAmity 2026 — 24-Hour Hackathon', category: 'Hackathon', club: 'ASETK', start: day(19, '09:00'), end: day(20, '09:00'),
      venue: 'Innovation Lab & Library Atrium', capacity: 200, fee: 200,
      description: 'Build anything around the themes Smart Campus, FinTech for Bharat and Sustainable Cities. Teams of 2–4, mentors through the night, meals included. Register individually and form teams on the day.' }),
    ev({ title: 'TechNova Annual Tech Fest', category: 'Fest', club: 'Student Council', start: day(26, '10:00'), end: day(27, '18:00'),
      venue: 'Campus Grounds', capacity: 1000,
      description: 'Two days of robotics, project expo, gaming and a startup pitch arena. Entry pass covers all non-competitive events.' }),
    // completed events (for certificates + analytics)
    ev({ title: 'Full-Stack Web Development Bootcamp', category: 'Workshop', club: 'ASETK', start: day(-23, '10:00'), end: day(-23, '17:00'),
      venue: 'Computer Lab 3, Block B', capacity: 60, status: 'completed',
      description: 'A one-day MERN bootcamp: REST APIs with Express, MongoDB modelling and a React front end, ending with a deployed mini-project.' }),
    ev({ title: 'Pre-Placement Talk — Nimbus Analytics', category: 'Placement', club: 'Placement Cell', start: day(-6, '11:00'), end: day(-6, '12:30'),
      venue: 'Main Auditorium', capacity: 250, status: 'completed',
      description: 'Company overview, the Associate Data Engineer role and the online assessment pattern.' }),
    ev({ title: "E-Summit: Founders' Fireside Chat", category: 'Seminar', club: 'Business Club', start: day(8, '16:00'), end: day(8, '18:00'),
      venue: 'Seminar Hall 1', capacity: 120,
      description: 'Three alumni founders on raising a first cheque, finding co-founders in college and what they would do differently. Stay back for open networking.' }),
  ];
  const E = db.events;

  const reg = (event, user, extra = {}) => {
    const r = {
      id: store.newId('reg'),
      eventId: event.id,
      userId: user.id,
      status: 'confirmed',
      payment: event.fee > 0 ? { status: 'paid', amount: event.fee, ref: 'UPI' + Math.floor(Math.random() * 1e10) } : null,
      ticketCode: store.newTicketCode(),
      createdAt: now,
      checkedInAt: null,
      checkedInBy: null,
      ...extra,
    };
    db.registrations.push(r);
    return r;
  };

  const staff = U.ananya.id;
  // Today's workshop: some already checked in so the live dashboard isn't empty
  reg(E[0], U.aishee);
  reg(E[0], U.adrija, { checkedInAt: day(0, '13:52'), checkedInBy: staff });
  reg(E[0], U.debopriya, { checkedInAt: day(0, '13:58'), checkedInBy: staff });
  reg(E[0], U.bhawya);
  // Upcoming
  reg(E[1], U.aishee); reg(E[1], U.adrija); reg(E[1], U.debopriya); reg(E[1], U.bhawya);
  reg(E[2], U.debopriya); reg(E[2], U.bhawya);
  reg(E[3], U.adrija, { status: 'pending' });
  reg(E[3], U.bhawya, { status: 'pending' });
  reg(E[5], U.adrija);
  reg(E[6], U.aishee); reg(E[6], U.adrija); reg(E[6], U.debopriya);
  // Completed: attendance + certificates
  const past1 = [U.aishee, U.adrija, U.debopriya, U.bhawya].map((u, i) =>
    reg(E[8], u, i === 3 ? {} : { checkedInAt: day(-23, '09:5' + i), checkedInBy: staff }));
  const past2 = [U.aishee, U.debopriya, U.bhawya].map((u) =>
    reg(E[9], u, { checkedInAt: day(-6, '10:55'), checkedInBy: staff }));
  // A semester of mandatory ASETK + Placement Cell events, so the attendance tracker has history.
  // Each student misses a different number, giving one green, two yellow and one red ring.
  const history = [
    ['Intro to IoT with ESP32', 'Workshop', 'ASETK', -70, 'Electronics Lab'],
    ['Aptitude Test Bootcamp', 'Placement', 'Placement Cell', -66, 'Main Auditorium'],
    ['Technical Paper Writing Workshop', 'Workshop', 'ASETK', -62, 'Seminar Hall 2'],
    ['Industrial Visit Briefing — Tata Steel', 'Seminar', 'ASETK', -55, 'Seminar Hall 1'],
    ['Pre-Placement Talk — Lumen Systems', 'Placement', 'Placement Cell', -48, 'Main Auditorium'],
    ['Robotics Lab Orientation', 'Workshop', 'ASETK', -41, 'Robotics Lab'],
    ['Guest Talk: Cybersecurity Careers', 'Seminar', 'ASETK', -33, 'Seminar Hall 1'],
    ['Group Discussion Practice', 'Placement', 'Placement Cell', -27, 'T&P Interview Rooms'],
    ['Project Expo Mentoring Session', 'Workshop', 'ASETK', -15, 'Innovation Lab'],
    ['LinkedIn & Personal Branding', 'Placement', 'Placement Cell', -12, 'Seminar Hall 2'],
  ].map(([title, category, club, d, venue]) => {
    const e = ev({ title, category, club, venue, capacity: 250, status: 'completed', start: day(d, '11:00'), end: day(d, '13:00'),
      description: `${club} session for the B.Tech cohort.` });
    db.events.push(e);
    return e;
  });
  const missed = { aishee: [3], adrija: [6], debopriya: [1, 5, 8], bhawya: [0, 2, 4, 7] };
  const pastAttended = [];
  history.forEach((e, i) => {
    for (const [k, skip] of Object.entries(missed)) {
      if (!skip.includes(i)) pastAttended.push(reg(e, U[k], { checkedInAt: e.start, checkedInBy: staff }));
    }
  });
  // Optional (non-mandatory) events some students chose to attend
  const optional = [
    ev({ title: 'Startup Pitch Night', category: 'Competition', club: 'Business Club', start: day(-38, '17:00'), end: day(-38, '20:00'),
      venue: 'Library Atrium', capacity: 100, status: 'completed', description: 'Student teams pitched to a panel of angel investors.' }),
    ev({ title: 'Weekend Codeathon', category: 'Competition', club: 'Coding Club', start: day(-20, '10:00'), end: day(-20, '16:00'),
      venue: 'Computer Lab 1 & 2', capacity: 80, status: 'completed', description: 'Six hours of team problem solving.' }),
  ];
  db.events.push(...optional);
  pastAttended.push(reg(optional[0], U.aishee, { checkedInAt: optional[0].start, checkedInBy: staff }));
  pastAttended.push(reg(optional[0], U.adrija, { checkedInAt: optional[0].start, checkedInBy: staff }));
  pastAttended.push(reg(optional[1], U.aishee, { checkedInAt: optional[1].start, checkedInBy: staff }));

  for (const r of [...past1, ...past2, ...pastAttended]) {
    if (!r.checkedInAt) continue;
    db.certificates.push({ id: store.newCertId(), registrationId: r.id, eventId: r.eventId, userId: r.userId, issuedAt: day(-2, '18:00') });
  }
  for (const r of db.registrations.filter((x) => x.checkedInAt)) {
    db.scans.push({ id: store.newId('scn'), eventId: r.eventId, registrationId: r.id, result: 'valid', at: r.checkedInAt, by: staff });
  }

  store.save();
  return db;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  seed();
  console.log(`Seeded demo data → ${store.DB_FILE}\nAll demo accounts use password: ${PASSWORD}`);
}
