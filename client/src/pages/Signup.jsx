import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../App.jsx';
import { AuthArt, AuthBrand } from './Login.jsx';

export default function Signup() {
  const { login } = useAuth();
  const [f, setF] = useState({ name: '', roll: '', email: '', phone: '', year: '4th Year (2023–27)', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const d = await api('/auth/register', { method: 'POST', body: f });
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
          <h1>Create your account</h1>
          <p className="sub">One account for every campus event</p>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <div className="field"><label>Full name</label><input className="input" value={f.name} onChange={set('name')} required /></div>
        <div className="grid-2">
          <div className="field"><label>Roll number</label><input className="input" placeholder="A9100552…" value={f.roll} onChange={set('roll')} required /></div>
          <div className="field"><label>Year</label>
            <select className="select" value={f.year} onChange={set('year')}>
              {['1st Year (2026–30)', '2nd Year (2025–29)', '3rd Year (2024–28)', '4th Year (2023–27)'].map((y) => <option key={y}>{y}</option>)}
            </select>
          </div>
        </div>
        <div className="field"><label>College email</label><input type="email" className="input" value={f.email} onChange={set('email')} required /></div>
        <div className="field"><label>Phone</label><input className="input" placeholder="+91" value={f.phone} onChange={set('phone')} /></div>
        <div className="field"><label>Password</label><input type="password" className="input" minLength={6} value={f.password} onChange={set('password')} required /><span className="hint">At least 6 characters.</span></div>
        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button>
        <p className="small sub center">Already registered? <Link className="link" to="/login">Sign in</Link></p>
      </form>
      </div>
    </div>
  );
}
