import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Check, Clock3, Copy, XCircle } from '../icons.jsx';
import { api } from '../api.js';
import { useToast } from '../App.jsx';
import { BackBar, ErrorBox, QR, Spinner, StatusBadge, useFetch } from '../components/ui.jsx';
import { fmtDate, fmtTime } from '../fmt.js';

export default function TicketView() {
  const { id } = useParams();
  const [sp] = useSearchParams();
  const nav = useNavigate();
  const toast = useToast();
  const { data, error, reload } = useFetch(`/tickets/${id}`);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const t = data?.ticket;
  if (error) return <><BackBar to="/tickets" /><ErrorBox error={error} /></>;
  if (!t) return <Spinner />;
  const fresh = sp.get('new') === '1';
  const upcoming = new Date(t.event.end) >= new Date() && t.event.status === 'published';

  async function cancel() {
    try { await api(`/tickets/${id}/cancel`, { method: 'POST' }); toast('Registration cancelled — seat released'); nav('/tickets'); }
    catch (x) { toast(x.message); }
  }
  const copy = async () => { try { await navigator.clipboard.writeText(t.ticketCode); toast('Ticket code copied'); } catch {} };

  return (
    <div className="stack-lg" style={{ maxWidth: 460, margin: '0 auto' }}>
      <BackBar to="/tickets" title={fresh ? '' : 'Entry pass'} />
      {fresh && (
        <div className="stack" style={{ textAlign: 'center' }}>
          <div className="success-ring">{t.status === 'pending' ? <Clock3 size={30} /> : <Check size={32} strokeWidth={3} />}</div>
          <h1 style={{ fontSize: 24 }}>{t.status === 'pending' ? 'Request submitted' : 'Registration confirmed'}</h1>
          <p className="sub small">{t.status === 'pending' ? 'The organiser will review it. Your QR pass appears here once approved.' : 'Your seat is reserved. Show this QR at the entry gate.'}</p>
        </div>
      )}

      <div className="ticket">
        <div className="ticket-top stack" style={{ alignItems: 'center' }}>
          <div className="eyebrow" style={{ color: 'var(--teal)' }}>Entry pass</div>
          {t.status === 'confirmed' && !t.checkedInAt && <QR value={t.qrPayload} />}
          {t.checkedInAt && <div className="stack" style={{ alignItems: 'center', padding: '20px 0' }}><div className="success-ring"><Check size={32} strokeWidth={3} /></div><b style={{ color: 'var(--teal)' }}>Checked in · {fmtTime(t.checkedInAt)}</b><span className="xs muted">This pass has been used and can't be scanned again.</span></div>}
          {t.status === 'pending' && <div className="stack" style={{ alignItems: 'center', padding: '20px 0' }}><Clock3 size={40} color="var(--orange)" /><b>Awaiting organiser approval</b></div>}
          {t.status === 'rejected' && <div className="stack" style={{ alignItems: 'center', padding: '20px 0' }}><XCircle size={40} color="var(--red)" /><b>Registration not approved</b></div>}
          <button className="row xs muted mono" style={{ border: 0, background: 'none', gap: 6 }} onClick={copy} title="Copy code for manual entry">
            {t.ticketCode} <Copy size={12} />
          </button>
          {t.status === 'confirmed' && !t.checkedInAt && <span className="xs muted">Scan at the venue entrance · signed and single-use</span>}
        </div>
        <div className="ticket-cut" />
        <div className="ticket-bottom stack">
          <div className="row-between" style={{ alignItems: 'flex-start' }}>
            <h3>{t.event.title}</h3>
            <StatusBadge status={t.status} checkedIn={!!t.checkedInAt} />
          </div>
          <div className="grid-2 kv">
            <div><div className="k">Date</div><div className="v">{fmtDate(t.event.start)}</div></div>
            <div><div className="k">Time</div><div className="v">{fmtTime(t.event.start)}</div></div>
            <div><div className="k">Venue</div><div className="v">{t.event.venue}</div></div>
            <div><div className="k">Attendee</div><div className="v">{t.holder.name}</div></div>
            <div><div className="k">Roll number</div><div className="v mono" style={{ fontSize: 13 }}>{t.holder.roll}</div></div>
            <div><div className="k">Paid</div><div className="v">{t.payment ? `₹${t.payment.amount}` : 'Free'}</div></div>
          </div>
        </div>
      </div>

      <Link className="btn btn-secondary" to={`/events/${t.event.id}`}>Event details</Link>
      {upcoming && !t.checkedInAt && (
        confirmCancel ? (
          <div className="card stack">
            <b>Cancel this registration?</b>
            <span className="small sub">Your seat goes back to the pool{t.payment ? '. Refunds are handled by the organising club.' : '.'}</span>
            <div className="row"><button className="btn btn-danger btn-sm" onClick={cancel}>Yes, cancel</button><button className="btn btn-ghost btn-sm" onClick={() => setConfirmCancel(false)}>Keep it</button></div>
          </div>
        ) : <button className="btn btn-ghost" style={{ color: 'var(--red)' }} onClick={() => setConfirmCancel(true)}>Cancel registration</button>
      )}
      {t.status === 'pending' && <button className="btn btn-ghost btn-sm" onClick={reload}>Refresh status</button>}
    </div>
  );
}
