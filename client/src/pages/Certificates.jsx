import { Link } from 'react-router-dom';
import { Award, ChevronRight } from '../icons.jsx';
import { Empty, ErrorBox, Spinner, useFetch } from '../components/ui.jsx';
import { fmtDate } from '../fmt.js';

export default function Certificates() {
  const { data, error } = useFetch('/me/certificates');
  if (error) return <ErrorBox error={error} />;
  if (!data) return <Spinner />;
  return (
    <div className="stack-lg">
      <div>
        <div className="eyebrow">Achievements</div>
        <h1 style={{ fontSize: 26 }}>Certificates</h1>
        <p className="sub small" style={{ marginTop: 6 }}>Issued automatically for events where your entry was verified at the gate.</p>
      </div>
      {data.certificates.length === 0 ? (
        <Empty icon={Award} title="No certificates yet" text="Attend an event and get your ticket scanned — your certificate appears here when the organiser closes the event." />
      ) : (
        <div className="event-grid">
          {data.certificates.map((c) => (
            <Link key={c.id} to={`/certificates/${c.id}`} className="card cert-list-item">
              <div className="cert-thumb"><Award size={24} /></div>
              <div className="grow">
                <h3 className="ellipsis">{c.event.title}</h3>
                <div className="xs sub">Attended {fmtDate(c.event.start)} · {c.event.club}</div>
                <div className="xs muted mono" style={{ marginTop: 2 }}>{c.id}</div>
              </div>
              <ChevronRight size={18} className="muted" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
