import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, CalendarDays, CalendarPlus, ClipboardList, UserCheck } from '../icons.jsx';
import { useAuth } from '../App.jsx';
import { EventCard, Empty, ErrorBox, Spinner, Stat, useFetch } from '../components/ui.jsx';

export default function OrgDashboard() {
  const { user } = useAuth();
  const { data, error } = useFetch('/organizer/events');
  const [tab, setTab] = useState('active');
  if (error) return <ErrorBox error={error} />;
  if (!data) return <Spinner />;
  const ev = data.events;
  const active = ev.filter((e) => e.status === 'published').sort((a, b) => new Date(a.start) - new Date(b.start));
  const done = ev.filter((e) => e.status !== 'published');
  const totReg = ev.reduce((s, e) => s + e.registered, 0);
  const totAtt = ev.reduce((s, e) => s + e.attended, 0);
  const pending = ev.reduce((s, e) => s + (e.registered - e.confirmed), 0);
  const list = tab === 'active' ? active : done;

  return (
    <div className="stack-lg">
      <div className="row-between wrap">
        <div>
          <div className="eyebrow">{user.role === 'admin' ? 'All clubs' : user.club || 'Organiser'}</div>
          <h1 style={{ fontSize: 26 }}>{user.role === 'admin' ? 'All events' : 'My events'}</h1>
        </div>
        <Link to="/organizer/new" className="btn btn-primary"><CalendarPlus size={17} /> Create event</Link>
      </div>
      <div className="stats">
        <Stat icon={CalendarDays} label="Active events" value={active.length} foot={`${done.length} completed / cancelled`} />
        <Stat icon={ClipboardList} label="Registrations" value={totReg} foot={pending ? `${pending} awaiting approval` : 'All processed'} />
        <Stat icon={UserCheck} label="Checked in" value={totAtt} foot="Verified by QR scan" />
        <Stat icon={Award} label="Show-up rate" value={totReg ? Math.round((totAtt / totReg) * 100) + '%' : '—'} foot="Across all events" />
      </div>
      <div className="tabs">
        <button className={tab === 'active' ? 'active' : ''} onClick={() => setTab('active')}>Active ({active.length})</button>
        <button className={tab === 'done' ? 'active' : ''} onClick={() => setTab('done')}>Past ({done.length})</button>
      </div>
      {list.length === 0 ? (
        <Empty icon={CalendarPlus} title="Nothing here yet" text="Create an event and students can register right away." />
      ) : (
        <div className="event-grid">{list.map((e) => <EventCard key={e.id} event={e} to={`/organizer/events/${e.id}`} />)}</div>
      )}
    </div>
  );
}
