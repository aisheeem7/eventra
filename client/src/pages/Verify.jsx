import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { BadgeCheck, ShieldX } from '../icons.jsx';
import { api } from '../api.js';
import { Brand } from '../components/Shell.jsx';
import { fmtDate } from '../fmt.js';

export default function Verify() {
  const { id } = useParams();
  const nav = useNavigate();
  const [code, setCode] = useState(id || '');
  const [state, setState] = useState(null);

  useEffect(() => {
    if (!id) { setState(null); return; }
    setState({ loading: true });
    api(`/certificates/${encodeURIComponent(id)}`).then((d) => setState({ cert: d.certificate })).catch((e) => setState({ error: e.message }));
  }, [id]);

  return (
    <div className="main narrow stack-lg" style={{ paddingTop: 36 }}>
      <Brand />
      <div>
        <div className="eyebrow">Public verification</div>
        <h1 style={{ fontSize: 26 }}>Verify a certificate</h1>
        <p className="sub small" style={{ marginTop: 6 }}>Enter the certificate ID printed at the bottom of any EvenTra certificate.</p>
      </div>
      <form className="row" onSubmit={(e) => { e.preventDefault(); if (code.trim()) nav(`/verify/${code.trim().toUpperCase()}`); }}>
        <input className="input mono" placeholder="AUK-CERT-XXXXXXXX" value={code} onChange={(e) => setCode(e.target.value)} />
        <button className="btn btn-primary">Verify</button>
      </form>
      {state?.loading && <div className="spinner" />}
      {state?.error && (
        <div className="result bad"><ShieldX size={34} /><div><div className="title">Not a valid certificate</div><div className="small">{state.error}</div></div></div>
      )}
      {state?.cert && (
        <div className="stack">
          <div className="result valid"><BadgeCheck size={34} /><div><div className="title">Genuine certificate</div><div className="small">Issued by EvenTra, Amity University Kolkata</div></div></div>
          <div className="card stack">
            {[['Awarded to', `${state.cert.holder.name} (${state.cert.holder.roll})`], ['Event', state.cert.event.title], ['Organised by', state.cert.event.club],
              ['Event date', fmtDate(state.cert.event.start)], ['Entry verified', state.cert.attendedAt ? fmtDate(state.cert.attendedAt) : '—'], ['Issued on', fmtDate(state.cert.issuedAt)]].map(([k, v]) => (
              <div key={k} className="row-between small"><span className="sub">{k}</span><b style={{ color: 'var(--navy)', textAlign: 'right' }}>{v}</b></div>
            ))}
          </div>
        </div>
      )}
      <Link className="link small" to="/login">← Back to EvenTra</Link>
    </div>
  );
}
