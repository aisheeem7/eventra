import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, Smartphone } from '../icons.jsx';
import { api } from '../api.js';
import { useAuth } from '../App.jsx';
import { BackBar, ErrorBox, Spinner, useFetch } from '../components/ui.jsx';
import { fmtFee, fmtRange } from '../fmt.js';

function Stepper({ steps, current }) {
  return (
    <div className="stepper">
      {steps.map((s, i) => (
        <span key={s} style={{ display: 'contents' }}>
          {i > 0 && <span className="step-line" />}
          <span className={'step' + (i === current ? ' active' : i < current ? ' done' : '')}>
            <span className="n">{i < current ? '✓' : i + 1}</span>{s}
          </span>
        </span>
      ))}
    </div>
  );
}

export default function Register() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const { data, error } = useFetch(`/events/${id}`);
  const [phone, setPhone] = useState(user.phone || '');
  const [agree, setAgree] = useState(false);
  const [step, setStep] = useState(0);
  const [paymentRef, setPaymentRef] = useState('');
  const [paying, setPaying] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const e = data?.event;
  if (error) return <><BackBar /><ErrorBox error={error} /></>;
  if (!e) return <Spinner />;
  const paid = e.fee > 0;
  const steps = paid ? ['Details', 'Payment', 'Confirm'] : ['Details', 'Confirm'];
  const confirmStep = steps.length - 1;

  function pay() {
    setPaying(true);
    // Simulated UPI gateway — replace with Razorpay/PhonePe test mode in the next increment
    setTimeout(() => { setPaymentRef('UPI' + Date.now().toString().slice(-10)); setPaying(false); }, 1400);
  }

  async function confirm() {
    setBusy(true); setErr('');
    try {
      const d = await api(`/events/${id}/register`, { method: 'POST', body: { phone, paymentRef } });
      nav(`/tickets/${d.ticket.id}?new=1`, { replace: true });
    } catch (x) { setErr(x.message); setBusy(false); }
  }

  return (
    <div className="stack-lg" style={{ maxWidth: 560 }}>
      <BackBar title="Register" />
      <Stepper steps={steps} current={step} />
      <div className="card flat" style={{ background: 'var(--brand-50)', borderColor: 'var(--brand-100)' }}>
        <div className="eyebrow">Event registration</div>
        <h3 style={{ marginTop: 4 }}>{e.title}</h3>
        <div className="small sub" style={{ marginTop: 2 }}>{fmtRange(e.start, e.end)} · {e.venue}</div>
      </div>
      {err && <div className="alert alert-error">{err}</div>}

      {step === 0 && (
        <div className="stack-lg">
          <h2>Your details</h2>
          <div className="alert alert-info small">Details come from your verified student profile, so the same person can't register twice.</div>
          <div className="field"><label>Full name</label><input className="input" value={user.name} readOnly /></div>
          <div className="grid-2">
            <div className="field"><label>Roll number</label><input className="input" value={user.roll} readOnly /></div>
            <div className="field"><label>Phone</label><input className="input" value={phone} onChange={(x) => setPhone(x.target.value)} placeholder="+91" /></div>
          </div>
          <div className="field"><label>Email</label><input className="input" value={user.email} readOnly /></div>
          <div className="row-between card flat" style={{ padding: 14, background: 'var(--bg)' }}>
            <span className="small sub">Registration amount</span>
            <b style={{ color: paid ? 'var(--navy)' : 'var(--teal)' }}>{fmtFee(e.fee)}</b>
          </div>
          {e.requiresApproval && <div className="alert alert-warn small">The organiser reviews registrations for this event. Your ticket activates once approved.</div>}
          <label className="check"><input type="checkbox" checked={agree} onChange={(x) => setAgree(x.target.checked)} />I'll carry my Amity ID card and follow the event code of conduct.</label>
          <button className="btn btn-primary btn-block" disabled={!agree} onClick={() => setStep(1)}>Continue</button>
        </div>
      )}

      {paid && step === 1 && (
        <div className="stack-lg">
          <h2>Payment</h2>
          <div className="card stack" style={{ alignItems: 'center', textAlign: 'center' }}>
            <div className="info-icon" style={{ width: 56, height: 56, background: 'var(--brand-50)', color: 'var(--brand)' }}><Smartphone size={26} /></div>
            <div className="big-count" style={{ fontSize: 36 }}>₹{e.fee}</div>
            <div className="small sub">Pay to <b>cems-demo@upi</b> · {e.club}</div>
            {paymentRef ? (
              <div className="alert alert-success" style={{ width: '100%' }}><CheckCircle2 size={18} /> Payment received · Ref {paymentRef}</div>
            ) : (
              <button className="btn btn-primary btn-block" onClick={pay} disabled={paying}>{paying ? 'Waiting for UPI app…' : `Pay ₹${e.fee} with UPI`}</button>
            )}
            <div className="xs muted">Demo gateway — no real money moves.</div>
          </div>
          <button className="btn btn-primary btn-block" disabled={!paymentRef} onClick={() => setStep(2)}>Continue</button>
        </div>
      )}

      {step === confirmStep && (
        <div className="stack-lg">
          <h2>Confirm</h2>
          <div className="card stack">
            {[['Name', user.name], ['Roll number', user.roll], ['Email', user.email], ['Phone', phone || '—'], ['Amount', paid ? `₹${e.fee} · ${paymentRef}` : 'Free']].map(([k, v]) => (
              <div key={k} className="row-between small"><span className="sub">{k}</span><b style={{ color: 'var(--navy)', textAlign: 'right' }}>{v}</b></div>
            ))}
          </div>
          <button className="btn btn-primary btn-block" onClick={confirm} disabled={busy}>{busy ? 'Reserving your seat…' : 'Confirm registration'}</button>
          <button className="btn btn-ghost" onClick={() => setStep(0)}>Edit details</button>
        </div>
      )}
    </div>
  );
}
