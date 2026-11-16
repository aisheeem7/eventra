// Tiny JSON-file data store. No native dependencies, so it runs anywhere Node runs.
// Swap for MongoDB/PostgreSQL later without touching the routes much.
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import os from 'os';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// On Vercel the project folder is read-only, so data lives in /tmp (per instance, wiped on cold start).
export const DATA_DIR = process.env.DATA_DIR || (process.env.VERCEL ? path.join(os.tmpdir(), 'eventra') : path.join(__dirname, 'data'));
export const DB_FILE = path.join(DATA_DIR, 'db.json');

const EMPTY = { users: [], events: [], registrations: [], certificates: [], sessions: {}, scans: [], meta: {} };

let db = null;

export function load() {
  if (db) return db;
  if (!fs.existsSync(DB_FILE)) return null;
  db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  for (const k of Object.keys(EMPTY)) if (db[k] === undefined) db[k] = structuredClone(EMPTY[k]);
  return db;
}

export function reset(data) {
  db = { ...structuredClone(EMPTY), ...data };
  save();
  return db;
}

export function save() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = DB_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, DB_FILE);
}

export const get = () => db;

// ---------- ids ----------
// Normally random. While seeding we switch to a deterministic stream so every server instance
// (e.g. separate Vercel functions) generates identical demo IDs, ticket codes and certificate IDs.
let prng = null;
function randomBytes(n) {
  if (!prng) return crypto.randomBytes(n);
  const out = crypto.createHash('sha256').update(`${prng.seed}:${prng.counter++}`).digest();
  return out.subarray(0, n);
}
const randomInt = (min, max) => min + (randomBytes(4).readUInt32BE(0) % (max - min));
export function withSeededIds(seed, fn) {
  prng = { seed, counter: 0 };
  try { return fn(); } finally { prng = null; }
}

export const newId = (prefix) => `${prefix}_${randomBytes(6).toString('hex')}`;

// ---------- password hashing (scrypt, built into Node) ----------
export function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(pw, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}
export function checkPassword(pw, stored) {
  const [salt, hash] = stored.split(':');
  const test = crypto.scryptSync(pw, salt, 64);
  return crypto.timingSafeEqual(test, Buffer.from(hash, 'hex'));
}

// ---------- signed QR ticket payloads ----------
// The QR encodes  CEMS1.<registrationId>.<signature>
// The signature is an HMAC with a server secret, so a ticket can't be forged or edited.
// Set APP_SECRET in production. Without it, Vercel instances share a fixed demo secret so tickets and
// sign-ins work across instances; locally a random secret is stored in the data file.
export function secret() {
  if (process.env.APP_SECRET) return process.env.APP_SECRET;
  if (process.env.VERCEL) return 'eventra-demo-secret-set-APP_SECRET-in-vercel';
  if (!db.meta.qrSecret) { db.meta.qrSecret = crypto.randomBytes(32).toString('hex'); save(); }
  return db.meta.qrSecret;
}

// ---------- sign-in tokens ----------
// Stateless: <email>.<expiry>.<hmac>. Any instance can verify them without a shared session store.
const TOKEN_DAYS = 7;
const b64 = (s) => Buffer.from(s).toString('base64url');
export function signToken(email) {
  const body = `${b64(email.toLowerCase())}.${Date.now() + TOKEN_DAYS * 864e5}`;
  return `${body}.${crypto.createHmac('sha256', secret()).update('auth:' + body).digest('base64url')}`;
}
export function verifyToken(token) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) return null;
  const body = `${parts[0]}.${parts[1]}`;
  const expected = Buffer.from(crypto.createHmac('sha256', secret()).update('auth:' + body).digest('base64url'));
  const got = Buffer.from(parts[2]);
  if (expected.length !== got.length || !crypto.timingSafeEqual(expected, got)) return null;
  if (Number(parts[1]) < Date.now()) return null;
  return Buffer.from(parts[0], 'base64url').toString();
}
export function signTicket(regId) {
  const sig = crypto.createHmac('sha256', secret()).update(regId).digest('hex').slice(0, 20);
  return `CEMS1.${regId}.${sig}`;
}
export function verifyTicket(payload) {
  const parts = String(payload || '').trim().split('.');
  if (parts.length !== 3 || parts[0] !== 'CEMS1') return null;
  const expected = signTicket(parts[1]);
  const a = Buffer.from(expected), b = Buffer.from(String(payload).trim());
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return parts[1];
}

// Human-readable ticket code shown under the QR (for manual entry at the gate)
export function newTicketCode() {
  let code;
  do { code = 'CEMS-' + randomInt(100000, 999999); }
  while (db.registrations.some((r) => r.ticketCode === code));
  return code;
}
export function newCertId() {
  let id;
  do { id = 'AUK-CERT-' + randomBytes(4).toString('hex').toUpperCase(); }
  while (db.certificates.some((c) => c.id === id));
  return id;
}
