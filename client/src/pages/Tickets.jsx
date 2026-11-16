import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, QrCode, Ticket } from '../icons.jsx';
import { Empty, ErrorBox, Spinner, StatusBadge, useFetch } from '../components/ui.jsx';
import { CATEGORY_COLORS, fmtDate, fmtTime } from '../fmt.js';

export default function Tickets() {
  const { data, error } = useFetch('/me/tickets');
  const [tab, setTab] = useState('upcoming');
  if (error) return <ErrorBox error={error} />;
  if (!data) return <Spinner />;
  const now = Date.now();
  const upcoming = data.tickets.filter((t) => new Date(t.event.end) >= now && t.event.status !== 'completed');
  const past = data.tickets.filter((t) => !upcoming.includes(t)).reverse();
  const list = tab === 'upcoming' ? upcoming : past;

  return (
    <div className="stack-lg">
      <div>
        <div className="eyebrow">Wallet</div>
        <h1 style={{ fontSize: 26 }}>My tickets</h1>
      </div>
      <div className="tabs">
        <button className={tab === 'upcoming' ? 'active' : ''} onClick={() => setTab('upcoming')}>Upcoming ({upcoming.length})</button>
        <button className={tab === 'past' ? 'active' : ''} onClick={() => setTab('past')}>Past ({past.length})</button>
      </div>
      {list.length === 0 ? (
        <Empty icon={Ticket} title={tab === 'upcoming' ? 'No upcoming tickets' : 'No past events yet'} text="Register for an event and your QR pass shows up here."
          action={<Link className="btn btn-primary btn-sm" to="/home">Browse events</Link>} />
      ) : (
        <div className="event-grid">
          {list.map((t) => (
            <Link key={t.id} to={`/tickets/${t.id}`} className="event-card" style={{ '--accent': CATEGORY_COLORS[t.event.category], alignItems: 'center' }}>
              <div className="info-icon" style={{ background: 'var(--brand-50)', color: 'var(--brand)' }}><QrCode size={20} /></div>
              <div className="grow stack" style={{ gap: 4 }}>
                <h3 className="ellipsis">{t.event.title}</h3>
                <div className="xs sub">{fmtDate(t.event.start)} · {fmtTime(t.event.start)} · {t.event.venue}</div>
                <div className="row" style={{ gap: 8 }}><StatusBadge status={t.status} checkedIn={!!t.checkedInAt} /><span className="xs muted mono">{t.ticketCode}</span></div>
              </div>
              <ChevronRight size={18} className="muted" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
