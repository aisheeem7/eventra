import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarSearch, Search, Ticket } from '../icons.jsx';
import { useAuth } from '../App.jsx';
import { api } from '../api.js';
import { Avatar, EventCard, Empty, ErrorBox, Spinner } from '../components/ui.jsx';
import { CATEGORIES, fmtTime, greeting, initials, isToday } from '../fmt.js';

export default function Home() {
  const { user } = useAuth();
  const [all, setAll] = useState(null);
  const [error, setError] = useState(null);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');

  useEffect(() => { api('/events').then((d) => setAll(d.events)).catch(setError); }, []);

  const counts = useMemo(() => {
    const c = { All: all?.length || 0 };
    for (const e of all || []) c[e.category] = (c[e.category] || 0) + 1;
    return c;
  }, [all]);

  const list = useMemo(() => (all || []).filter((e) =>
    (cat === 'All' || e.category === cat) &&
    (!q.trim() || [e.title, e.venue, e.club, e.category].join(' ').toLowerCase().includes(q.trim().toLowerCase()))), [all, q, cat]);

  const nextUp = (all || []).find((e) => e.myRegistration?.status === 'confirmed' && isToday(e.start));

  return (
    <div className="stack-lg">
      <div className="row-between">
        <div>
          <div className="eyebrow">{greeting()}</div>
          <h1 style={{ fontSize: 26 }}>Hi, {user.name.split(' ')[0]}</h1>
        </div>
        <Link to="/profile" className="avatar-link desktop-only" aria-label="Profile"><Avatar user={user} /></Link>
      </div>

      {nextUp && (
        <Link to={`/tickets/${nextUp.myRegistration.id}`} className="card row today-card">
          <div className="info-icon" style={{ background: 'rgba(255,255,255,.12)', color: '#fff' }}><Ticket size={19} /></div>
          <div className="grow">
            <div className="xs" style={{ color: '#fff3c4', fontWeight: 600, letterSpacing: '.08em' }}>TODAY · {fmtTime(nextUp.start)}</div>
            <div style={{ fontWeight: 700 }} className="ellipsis">{nextUp.title}</div>
          </div>
          <span className="btn btn-sm" style={{ background: '#fff', color: 'var(--navy)' }}>Show pass</span>
        </Link>
      )}

      <div className="search">
        <Search size={18} />
        <input className="input" placeholder="Search events, clubs, venues" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search events" />
      </div>

      <div className="chips" role="tablist">
        {['All', ...CATEGORIES].filter((c) => c === 'All' || counts[c]).map((c) => (
          <button key={c} role="tab" aria-selected={cat === c} className={'chip' + (cat === c ? ' active' : '')} onClick={() => setCat(c)}>
            {c}<span className="count">{counts[c]}</span>
          </button>
        ))}
      </div>

      <div className="section-title">
        <h2>Upcoming events</h2>
        <span className="small muted">{list.length} event{list.length === 1 ? '' : 's'}</span>
      </div>

      <ErrorBox error={error} />
      {!all && !error ? <Spinner /> : list.length === 0 ? (
        <Empty icon={CalendarSearch} title="No events match" text="Try another category or clear your search." action={<button className="btn btn-secondary btn-sm" onClick={() => { setQ(''); setCat('All'); }}>Clear filters</button>} />
      ) : (
        <div className="event-grid">{list.map((e) => <EventCard key={e.id} event={e} />)}</div>
      )}
    </div>
  );
}
