import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Award, Check, ClipboardList, Download, Pencil, ScanLine, Search, UserCheck, Users, X } from '../icons.jsx';
import { api, downloadCsv } from '../api.js';
import { useToast } from '../App.jsx';
import { BackBar, ErrorBox, SeatBar, Spinner, Stat, StatusBadge, useFetch } from '../components/ui.jsx';
import { fmtDateTime, fmtRange, fmtTime, isLive } from '../fmt.js';

export default function OrgEvent() {
  const { id } = useParams();
  const toast = useToast();
  const { data, error, reload } = useFetch(`/events/${id}/registrations`);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const [closing, setClosing] = useState(false);

  const rows = useMemo(() => (data?.registrations || []).filter((r) => r.status !== 'cancelled')
    .filter((r) => filter === 'all' || (filter === 'attended' ? r.checkedInAt : filter === 'absent' ? !r.checkedInAt && r.status === 'confirmed' : r.status === filter))
    .filter((r) => !q || `${r.student.name} ${r.student.roll} ${r.ticketCode}`.toLowerCase().includes(q.toLowerCase())), [data, q, filter]);

  if (error) return <><BackBar to="/organizer" /><ErrorBox error={error} /></>;
  if (!data) return <Spinner />;
  const e = data.event;
  const pending = data.registrations.filter((r) => r.status === 'pending').length;

  async function act(regId, action) {
    try { await api(`/registrations/${regId}/${action}`, { method: 'POST' }); toast(action === 'approve' ? 'Approved — ticket issued' : 'Registration rejected'); reload(); }
    catch (x) { toast(x.message); }
  }
  async function complete() {
    try { const d = await api(`/events/${id}/complete`, { method: 'POST' }); toast(`Event closed · ${d.issued} certificate${d.issued === 1 ? '' : 's'} issued`); setClosing(false); reload(); }
    catch (x) { toast(x.message); }
  }

  return (
    <div className="stack-lg">
      <BackBar to="/organizer" right={e.status === 'published' && <Link className="btn btn-secondary btn-sm" to={`/organizer/events/${id}/edit`}><Pencil size={14} /> Edit</Link>} />
      <div className="row-between wrap" style={{ alignItems: 'flex-start' }}>
        <div className="stack" style={{ gap: 6 }}>
          <div className="row wrap"><span className="badge badge-navy">{e.category}</span><StatusBadge status={e.status} />{isLive(e) && <span className="badge badge-red"><span className="dot pulse" /> Live now</span>}</div>
          <h1 style={{ fontSize: 24 }}>{e.title}</h1>
          <div className="small sub">{fmtRange(e.start, e.end)} · {e.venue}</div>
        </div>
        <div className="row wrap">
          {e.status === 'published' && <Link className="btn btn-secondary btn-sm" to={`/scan?event=${e.id}`}><ScanLine size={15} /> Open scanner</Link>}
          <button className="btn btn-secondary btn-sm" onClick={() => downloadCsv(`/events/${id}/export.csv`, `${e.title}-attendance.csv`)}><Download size={15} /> Export CSV</button>
        </div>
      </div>

      <div className="stats">
        <Stat icon={ClipboardList} label="Registered" value={e.registered} foot={`of ${e.capacity} seats`} />
        <Stat icon={Users} label="Confirmed" value={e.confirmed} foot={pending ? `${pending} awaiting approval` : 'No pending requests'} />
        <Stat icon={UserCheck} label="Checked in" value={e.attended} foot={e.confirmed ? `${Math.round((e.attended / e.confirmed) * 100)}% of confirmed` : '—'} />
        <Stat icon={Award} label="Certificates" value={data.registrations.filter((r) => r.certificateId).length} foot={e.status === 'completed' ? 'Issued' : 'Issued when you close the event'} />
      </div>
      {e.status === 'published' && <div className="card"><SeatBar event={e} /></div>}

      {e.status === 'published' && (
        <div className="card row-between wrap" style={{ background: 'var(--brand-50)', borderColor: 'var(--brand-100)' }}>
          <div className="grow" style={{ minWidth: 240 }}>
            <b style={{ color: 'var(--navy)' }}>Close event & issue certificates</b>
            <div className="small sub">Certificates go only to the {e.attended} attendee{e.attended === 1 ? '' : 's'} whose entry was verified. No-shows don't get one.</div>
          </div>
          {closing ? (
            <div className="row"><button className="btn btn-primary btn-sm" onClick={complete}>Confirm & issue</button><button className="btn btn-ghost btn-sm" onClick={() => setClosing(false)}>Cancel</button></div>
          ) : <button className="btn btn-primary btn-sm" onClick={() => setClosing(true)}><Award size={15} /> Close & certify</button>}
        </div>
      )}

      <div className="row-between wrap">
        <h2>Registrations</h2>
        <div className="row wrap">
          <div className="search" style={{ minWidth: 220 }}><Search size={16} /><input className="input" style={{ padding: '9px 12px 9px 40px' }} placeholder="Name, roll or ticket" value={q} onChange={(x) => setQ(x.target.value)} /></div>
          <select className="select" style={{ width: 'auto', padding: '9px 12px' }} value={filter} onChange={(x) => setFilter(x.target.value)}>
            <option value="all">All</option><option value="pending">Pending</option><option value="confirmed">Confirmed</option>
            <option value="attended">Attended</option><option value="absent">Not yet arrived</option><option value="rejected">Rejected</option>
          </select>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Student</th><th>Ticket</th><th>Registered</th><th>Status</th><th>Entry</th><th /></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={6} className="muted" style={{ textAlign: 'center', padding: 28 }}>No registrations match.</td></tr>}
            {rows.map((r) => (
              <tr key={r.id}>
                <td><b style={{ color: 'var(--navy)' }}>{r.student.name}</b><div className="xs muted mono">{r.student.roll}</div></td>
                <td className="mono small">{r.ticketCode}{r.payment && <div className="xs muted">₹{r.payment.amount} · {r.payment.ref}</div>}</td>
                <td className="small sub">{fmtDateTime(r.createdAt)}</td>
                <td><StatusBadge status={r.status} /></td>
                <td className="small">{r.checkedInAt ? <span style={{ color: 'var(--teal)', fontWeight: 600 }}>✓ {fmtTime(r.checkedInAt)}</span> : <span className="muted">—</span>}</td>
                <td style={{ textAlign: 'right' }}>
                  {r.status === 'pending' && (
                    <div className="row" style={{ justifyContent: 'flex-end', gap: 6 }}>
                      <button className="btn btn-success btn-sm" onClick={() => act(r.id, 'approve')}><Check size={14} /> Approve</button>
                      <button className="btn btn-danger btn-sm" onClick={() => act(r.id, 'reject')} aria-label="Reject"><X size={14} /></button>
                    </div>
                  )}
                  {r.certificateId && <Link className="link xs" to={`/certificates/${r.certificateId}`}>Certificate</Link>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
