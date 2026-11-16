import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CaretDown } from '@phosphor-icons/react';
import { CalendarDays, MapPin, QrCode } from '../icons.jsx';
import { api } from '../api.js';
import { useAuth } from '../App.jsx';
import { LogoMark, Wordmark } from '../components/Logo.jsx';

const DEMO = [
  { label: 'Student', email: 'aishee@cems.demo' },
  { label: 'Organizer', email: 'bhaswati@cems.demo' },
  { label: 'Staff', email: 'ananya@cems.demo' },
  { label: 'Admin', email: 'admin@cems.demo' },
];

// Left-hand visual for the auth screens: one line of copy and a floating glass ticket.
export function AuthArt() {
  return (
    <div className="auth-art">
      <div className="blob b1" /><div className="blob b2" /><div className="blob b3" />
      <div className="auth-art-inner">
        <h2>Every campus event,<br /><span>one tap away.</span></h2>
        <div className="glass-ticket">
          <div className="row-between">
            <span className="badge badge-sun">Tech Fest</span>
            <QrCode size={22} />
          </div>
          <div className="gt-title">CodeSprint Hackathon</div>
          <div className="meta">
            <span><CalendarDays size={15} /> Fri, 10:00 AM</span>
            <span><MapPin size={15} /> Main Auditorium</span>
          </div>
          <div className="gt-cut" />
          <div className="row-between xs"><span>Admit one</span><b className="mono">No. 482913</b></div>
        </div>
      </div>
    </div>
  );
}

export function AuthBrand() {
  return (
    <div className="auth-brand">
      <LogoMark size={52} />
      <Wordmark size={26} />
    </div>
  );
}

export default function Login() {
  const { login } = useAuth();
  const [identifier, setId] = useState('');
  const [password, setPw] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  async function submit(e, creds) {
    e?.preventDefault();
    setBusy(true); setError('');
    try {
      const d = await api('/auth/login', { method: 'POST', body: creds || { identifier, password } });
      login(d.token, d.user);
    } catch (err) { setError(err.message); }
    setBusy(false);
  }

  return (
    <div className="auth">
      <AuthArt />
      <div className="auth-side">
        <form className="auth-form glass" onSubmit={submit}>
          <AuthBrand />
          <div className="auth-head">
            <h1>Welcome back</h1>
            <p className="sub">Sign in to continue</p>
          </div>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="field">
            <label htmlFor="id">Email or roll number</label>
            <input id="id" className="input" placeholder="you@college.edu" value={identifier} onChange={(e) => setId(e.target.value)} autoComplete="username" required />
          </div>
          <div className="field">
            <label htmlFor="pw">Password</label>
            <input id="pw" type="password" className="input" placeholder="••••••••" value={password} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" required />
          </div>
          <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
          <p className="small sub center">New here? <Link className="link" to="/signup">Create an account</Link></p>

          <div className="demo">
            <button type="button" className="demo-toggle" onClick={() => setShowDemo(!showDemo)} aria-expanded={showDemo}>
              Try a demo account <CaretDown size={14} weight="bold" style={{ transform: showDemo ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
            </button>
            {showDemo && (
              <div className="demo-chips">
                {DEMO.map((d) => (
                  <button type="button" key={d.email} className="chip" disabled={busy} onClick={() => submit(null, { identifier: d.email, password: 'demo123' })}>{d.label}</button>
                ))}
              </div>
            )}
          </div>
        </form>
        <Link className="xs muted verify-link" to="/verify">Verify a certificate</Link>
      </div>
    </div>
  );
}
