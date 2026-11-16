import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth, useToast } from '../App.jsx';
import { BackBar } from '../components/ui.jsx';
import { CATEGORIES, ORGANIZERS, findOrganizer } from '../fmt.js';

const toLocal = (iso) => { const d = new Date(iso); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };
const defaultStart = () => { const d = new Date(); d.setDate(d.getDate() + 7); d.setHours(10, 0, 0, 0); return d; };

export default function EventForm() {
  const { id } = useParams();
  const editing = !!id;
  const nav = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const s = defaultStart();
  const [f, setF] = useState({
    title: '', category: 'Workshop', club: findOrganizer(user.club) ? user.club : '', description: '', venue: '',
    start: toLocal(s), end: toLocal(new Date(s.getTime() + 2 * 3600e3)), capacity: 60, fee: 0, requiresApproval: false,
  });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  useEffect(() => {
    if (!editing) return;
    api(`/events/${id}`).then(({ event: e }) => setF({ ...e, start: toLocal(e.start), end: toLocal(e.end) })).catch((x) => setErr(x.message));
  }, [id, editing]);

  async function submit(e) {
    e.preventDefault(); setBusy(true); setErr('');
    const body = { ...f, start: new Date(f.start).toISOString(), end: new Date(f.end).toISOString() };
    try {
      const d = await api(editing ? `/events/${id}` : '/events', { method: editing ? 'PUT' : 'POST', body });
      toast(editing ? 'Event updated' : 'Event published — students can register now');
      nav(`/organizer/events/${d.event.id}`, { replace: true });
    } catch (x) { setErr(x.message); setBusy(false); }
  }

  return (
    <form className="stack-lg" style={{ maxWidth: 680, margin: "0 auto", width: "100%" }} onSubmit={submit}>
      <BackBar title={editing ? 'Edit event' : 'Create event'} />
      {err && <div className="alert alert-error">{err}</div>}
      <div className="card stack-lg">
        <div className="field"><label>Event title</label><input className="input" value={f.title} onChange={set('title')} placeholder="e.g. HackAmity 2026 — 24-Hour Hackathon" required /></div>
        <div className="grid-2">
          <div className="field"><label>Category</label>
            <select className="select" value={f.category} onChange={set('category')}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
          </div>
          <div className="field"><label>Organizer</label>
            <select className="select" value={f.club} onChange={set('club')} required>
              <option value="" disabled>Choose organizer…</option>
              {ORGANIZERS.map((o) => <option key={o.name} value={o.name}>{o.name}: {o.focus}</option>)}
            </select>
            {findOrganizer(f.club)?.mandatoryFor.length > 0 && <span className="hint">Mandatory for B.Tech students. It counts toward their attendance.</span>}
          </div>
        </div>
        <div className="field"><label>Description</label><textarea className="textarea" value={f.description} onChange={set('description')} placeholder="What will attendees do or learn? Anything to bring?" /></div>
      </div>
      <div className="card stack-lg">
        <h3>When & where</h3>
        <div className="grid-2">
          <div className="field"><label>Starts</label><input type="datetime-local" className="input" value={f.start} onChange={set('start')} required /></div>
          <div className="field"><label>Ends</label><input type="datetime-local" className="input" value={f.end} onChange={set('end')} required /></div>
        </div>
        <div className="field"><label>Venue</label><input className="input" value={f.venue} onChange={set('venue')} placeholder="Main Auditorium" required /></div>
      </div>
      <div className="card stack-lg">
        <h3>Registration</h3>
        <div className="grid-2">
          <div className="field"><label>Seats</label><input type="number" min="1" className="input" value={f.capacity} onChange={set('capacity')} required /></div>
          <div className="field"><label>Fee (₹)</label><input type="number" min="0" className="input" value={f.fee} onChange={set('fee')} /><span className="hint">0 for a free event</span></div>
        </div>
        <label className="check"><input type="checkbox" checked={f.requiresApproval} onChange={set('requiresApproval')} />Approve each registration manually (e.g. limited interview slots)</label>
      </div>
      <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Publish event'}</button>
    </form>
  );
}
