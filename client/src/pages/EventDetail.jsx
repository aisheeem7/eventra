import { Link, useParams } from 'react-router-dom';
import { CalendarDays, MapPin, Share2, ShieldCheck, Users } from '../icons.jsx';
import { useAuth, useToast } from '../App.jsx';
import { BackBar, ErrorBox, InfoRow, SeatBar, Spinner, StatusBadge, useFetch } from '../components/ui.jsx';
import { fmtFee, fmtRange, isLive } from '../fmt.js';

export default function EventDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const { data, error } = useFetch(`/events/${id}`);
  const e = data?.event;

  const share = async () => {
    try { await navigator.clipboard.writeText(window.location.href); toast('Event link copied'); } catch { toast('Copy the link from the address bar'); }
  };

  if (error) return <><BackBar /><ErrorBox error={error} /></>;
  if (!e) return <Spinner />;
  const mine = e.myRegistration;
  const closed = e.status !== 'published' || new Date(e.end) < new Date();

  return (
    <div className="stack-lg" style={{ maxWidth: 720, paddingBottom: 20 }}>
      <BackBar right={<button className="icon-btn" onClick={share} aria-label="Share"><Share2 size={18} /></button>} />

      <div className="hero stack">
        <div className="row wrap">
          <span className="badge">{e.category}</span>
          {isLive(e) && <span className="badge" style={{ background: '#fee2e2', color: 'var(--red)' }}><span className="dot pulse" /> Happening now</span>}
          {e.requiresApproval && <span className="badge"><ShieldCheck size={12} /> Approval required</span>}
        </div>
        <h1>{e.title}</h1>
        <div className="org">Organised by {e.club}</div>
      </div>

      <div className="card stack-lg">
        <InfoRow icon={CalendarDays} label="Date & time" value={fmtRange(e.start, e.end)} />
        <InfoRow icon={MapPin} label="Venue" value={`${e.venue}, Amity University Kolkata`} />
        <InfoRow icon={Users} label="Availability" value={e.seatsLeft === 0 ? 'Event is full' : `${e.seatsLeft} of ${e.capacity} seats left`} />
        {e.status === 'published' && <SeatBar event={e} />}
      </div>

      <div className="stack">
        <h2 style={{ fontSize: 18 }}>About this event</h2>
        <p className="sub" style={{ whiteSpace: 'pre-line' }}>{e.description || 'No description yet.'}</p>
      </div>

      {user.role === 'student' && (
        <div className="sticky-cta">
          <div className="cta-bar">
            <div>
              <div className="xs muted">{mine ? 'Your registration' : 'Registration fee'}</div>
              {mine ? <StatusBadge status={mine.status} /> : <div style={{ fontWeight: 800, color: e.fee ? 'var(--navy)' : 'var(--teal)', fontSize: 18 }}>{fmtFee(e.fee)}</div>}
            </div>
            {mine ? (
              <Link className="btn btn-primary" to={`/tickets/${mine.id}`}>{mine.status === 'confirmed' ? 'View ticket' : 'View status'}</Link>
            ) : closed ? (
              <button className="btn btn-secondary" disabled>Registration closed</button>
            ) : e.seatsLeft === 0 ? (
              <button className="btn btn-secondary" disabled>Event full</button>
            ) : (
              <Link className="btn btn-primary" to={`/events/${e.id}/register`}>Register now</Link>
            )}
          </div>
        </div>
      )}
      {['organizer', 'admin'].includes(user.role) && (
        <Link className="btn btn-secondary" to={`/organizer/events/${e.id}`}>Manage this event</Link>
      )}
    </div>
  );
}
