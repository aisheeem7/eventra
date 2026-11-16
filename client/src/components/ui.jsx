import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import { ArrowLeft, CalendarDays, Clock, IndianRupee, MapPin, Users } from '../icons.jsx';
import { api } from '../api.js';
import { CATEGORY_COLORS, attendanceBand, fmtDate, fmtDayNum, fmtFee, fmtMonth, fmtTime, initials, isLive } from '../fmt.js';

export function useFetch(path, deps = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const reload = useCallback(() => {
    setLoading(true);
    return api(path).then((d) => { setData(d); setError(null); }).catch(setError).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, ...deps]);
  useEffect(() => { reload(); }, [reload]);
  return { data, error, loading, reload, setData };
}

export function Spinner() { return <div className="spinner" aria-label="Loading" />; }

export function ErrorBox({ error }) {
  if (!error) return null;
  return <div className="alert alert-error">{error.message || String(error)}</div>;
}

export function BackBar({ title, to, right }) {
  const nav = useNavigate();
  return (
    <div className="row-between" style={{ marginBottom: 14 }}>
      <div className="row">
        <button className="icon-btn" onClick={() => (to ? nav(to) : nav(-1))} aria-label="Back"><ArrowLeft size={18} /></button>
        {title && <h2 style={{ fontSize: 18 }}>{title}</h2>}
      </div>
      {right}
    </div>
  );
}

export function Empty({ icon: Icon, title, text, action }) {
  return (
    <div className="empty card flat">
      {Icon && <div className="ico"><Icon size={26} /></div>}
      <h3>{title}</h3>
      {text && <p className="small" style={{ marginTop: 6 }}>{text}</p>}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}

export function StatusBadge({ status, checkedIn }) {
  if (checkedIn) return <span className="badge badge-teal">Attended</span>;
  const map = {
    confirmed: ['badge-teal', 'Confirmed'], pending: ['badge-orange', 'Awaiting approval'], rejected: ['badge-red', 'Not approved'],
    cancelled: ['badge-gray', 'Cancelled'], published: ['badge-brand', 'Open'], completed: ['badge-navy', 'Completed'],
  };
  const [cls, label] = map[status] || ['badge-gray', status];
  return <span className={'badge ' + cls}>{label}</span>;
}

export function SeatBar({ event }) {
  const pct = Math.min(100, Math.round((event.registered / event.capacity) * 100));
  const hot = event.seatsLeft > 0 && event.seatsLeft <= Math.max(5, event.capacity * 0.1);
  return (
    <div className="stack" style={{ gap: 6 }}>
      <div className={'seatbar' + (hot ? ' hot' : '')}><div style={{ width: Math.max(pct, 2) + '%' }} /></div>
      <div className="row-between xs">
        <span className="muted">{event.registered} registered</span>
        <span style={{ color: hot ? 'var(--orange)' : 'var(--text)', fontWeight: 600 }}>
          {event.seatsLeft === 0 ? 'Full' : `${event.seatsLeft} of ${event.capacity} seats left`}
        </span>
      </div>
    </div>
  );
}

export function EventCard({ event, to }) {
  const live = isLive(event);
  const mine = event.myRegistration;
  return (
    <Link to={to || `/events/${event.id}`} className="event-card" style={{ '--accent': CATEGORY_COLORS[event.category] }}>
      <div className="datebox">
        <div className="m">{fmtMonth(event.start)}</div>
        <div className="d">{fmtDayNum(event.start)}</div>
      </div>
      <div className="grow stack" style={{ gap: 8 }}>
        <div className="row-between" style={{ alignItems: 'flex-start' }}>
          <h3>{event.title}</h3>
          {live ? <span className="badge badge-red"><span className="dot pulse" /> Live</span>
            : mine ? <StatusBadge status={mine.status} />
            : event.status !== 'published' ? <StatusBadge status={event.status} />
            : event.seatsLeft === 0 ? <span className="badge badge-gray">Full</span>
            : <span className="badge badge-brand">{fmtFee(event.fee)}</span>}
        </div>
        <div className="meta">
          <span><Clock size={14} />{fmtTime(event.start)}</span>
          <span><MapPin size={14} />{event.venue}</span>
        </div>
        <div className="row xs muted" style={{ gap: 8, flexWrap: 'wrap' }}>
          <span>{event.category} · {event.club}</span>
          {event.mandatory && <span className="badge badge-sun">Mandatory</span>}
        </div>
        {event.status === 'published' && <SeatBar event={event} />}
      </div>
    </Link>
  );
}

export function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="info-row">
      <div className="info-icon"><Icon size={19} /></div>
      <div><div className="label">{label}</div><div className="value">{value}</div></div>
    </div>
  );
}
export const Icons = { CalendarDays, MapPin, Users, IndianRupee, Clock };

export function QR({ value, size = 220 }) {
  const [src, setSrc] = useState('');
  useEffect(() => {
    if (!value) return;
    QRCode.toDataURL(value, { width: size * 2, margin: 1, errorCorrectionLevel: 'M', color: { dark: '#1e2a4a', light: '#ffffff' } }).then(setSrc);
  }, [value, size]);
  return <div className="qr-frame">{src ? <img src={src} alt="Ticket QR code" style={{ width: size, height: size }} /> : <div style={{ width: size, height: size }} />}</div>;
}

export function Stat({ icon: Icon, label, value, foot }) {
  return (
    <div className="stat">
      <div className="label">{Icon && <Icon size={15} />} {label}</div>
      <div className="value">{value}</div>
      {foot && <div className="foot">{foot}</div>}
    </div>
  );
}

export { fmtDate };

export function Avatar({ user, size = '' }) {
  const cls = 'avatar' + (size ? ' ' + size : '');
  return user?.avatar
    ? <img className={cls + ' avatar-img'} src={user.avatar} alt={user.name} />
    : <div className={cls}>{initials(user?.name)}</div>;
}

const BAND_LABEL = { good: 'On track', ok: 'At risk', low: 'Below 75%', none: 'No events yet' };

// Circular attendance tracker. Green ≥ 85%, yellow ≥ 75%, red below.
export function AttendanceRing({ pct, size = 132, stroke = 12, caption, showBand = true }) {
  const band = attendanceBand(pct);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const val = Math.max(0, Math.min(100, pct ?? 0));
  return (
    <div className={'ring ring-' + band} style={{ width: size, height: size }} role="img" aria-label={`Attendance ${pct ?? 0}%`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle className="ring-track" cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} />
        <circle className="ring-bar" cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={c * (1 - val / 100)} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
      <div className="ring-center">
        <b style={{ fontSize: Math.max(13, size * 0.2) }}>{pct == null ? '—' : pct + '%'}</b>
        {caption && size >= 90 && <span>{caption}</span>}
        {showBand && size >= 110 && <i className={'ring-band band-' + band}>{BAND_LABEL[band]}</i>}
      </div>
    </div>
  );
}
