import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, CalendarDays, ClipboardList, IndianRupee, RotateCcw, ShieldAlert, UserCheck, Users } from '../icons.jsx';
import { api } from '../api.js';
import { useAuth, useToast } from '../App.jsx';
import { ErrorBox, Spinner, Stat, StatusBadge, useFetch } from '../components/ui.jsx';
import { ROLE_LABEL } from '../components/Shell.jsx';
import { CATEGORY_COLORS, fmtDate } from '../fmt.js';

function Overview({ s }) {
  const max = Math.max(...s.byEvent.map((e) => e.registered), 1);
  const catTotal = Object.values(s.byCategory).reduce((a, b) => a + b, 0) || 1;
  return (
    <div className="stack-lg">
      <div className="stats">
        <Stat icon={CalendarDays} label="Events" value={s.totals.events} foot={`${s.totals.upcoming} open now`} />
        <Stat icon={ClipboardList} label="Registrations" value={s.totals.registrations} foot={`${s.totals.students} students on platform`} />
        <Stat icon={UserCheck} label="Verified entries" value={s.totals.attended} foot={`${s.totals.registrations ? Math.round((s.totals.attended / s.totals.registrations) * 100) : 0}% of registrations`} />
        <Stat icon={Award} label="Certificates" value={s.totals.certificates} foot="Tied to verified attendance" />
        <Stat icon={IndianRupee} label="Fees collected" value={`₹${s.totals.revenue.toLocaleString('en-IN')}`} foot="Paid events only" />
        <Stat icon={ShieldAlert} label="Blocked scans" value={s.totals.blockedScans} foot="Reused, forged or wrong-event" />
        <Stat icon={Users} label="Users" value={s.totals.users} foot="All roles" />
      </div>

      <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', alignItems: 'start' }}>
        <div className="card stack-lg">
          <div className="row-between wrap"><h3>Registrations vs attendance</h3>
            <div className="legend"><span><i style={{ background: 'var(--brand-100)' }} />Registered</span><span><i style={{ background: 'var(--brand)' }} />Attended</span></div>
          </div>
          <div className="bars">
            {s.byEvent.map((e) => (
              <Link to={`/organizer/events/${e.id}`} key={e.id} className="bar-row stack" style={{ gap: 6 }}>
                <div className="row-between small"><span className="ellipsis grow" style={{ fontWeight: 600, color: 'var(--navy)' }}>{e.title}</span><span className="muted xs">{e.attended}/{e.registered}</span></div>
                <div className="track">
                  <div className="reg" style={{ width: (e.registered / max) * 100 + '%' }} />
                  <div className="att" style={{ width: (e.attended / max) * 100 + '%' }} />
                </div>
              </Link>
            ))}
          </div>
        </div>
        <div className="card stack-lg">
          <h3>Registrations by category</h3>
          <div style={{ display: 'flex', height: 14, borderRadius: 99, overflow: 'hidden', background: '#f1f2f5' }}>
            {Object.entries(s.byCategory).map(([c, n]) => <div key={c} title={`${c}: ${n}`} style={{ width: (n / catTotal) * 100 + '%', background: CATEGORY_COLORS[c] }} />)}
          </div>
          <div className="stack">
            {Object.entries(s.byCategory).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]).map(([c, n]) => (
              <div key={c} className="row-between small"><span className="row" style={{ gap: 8 }}><i style={{ width: 10, height: 10, borderRadius: 3, background: CATEGORY_COLORS[c], display: 'inline-block' }} />{c}</span><b style={{ color: 'var(--navy)' }}>{n}</b></div>
            ))}
          </div>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead><tr><th>Event</th><th>Date</th><th>Status</th><th>Capacity</th><th>Registered</th><th>Attended</th></tr></thead>
          <tbody>
            {s.byEvent.map((e) => (
              <tr key={e.id}>
                <td><Link className="link" style={{ fontSize: 14 }} to={`/organizer/events/${e.id}`}>{e.title}</Link><div className="xs muted">{e.category}</div></td>
                <td className="small">{fmtDate(e.start)}</td><td><StatusBadge status={e.status} /></td>
                <td>{e.capacity}</td><td>{e.registered}</td><td>{e.attended}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UsersTab() {
  const { user } = useAuth();
  const toast = useToast();
  const { data, error, reload } = useFetch('/admin/users');
  if (error) return <ErrorBox error={error} />;
  if (!data) return <Spinner />;
  async function setRole(id, role) {
    try { await api(`/admin/users/${id}/role`, { method: 'PUT', body: { role } }); toast('Role updated'); reload(); } catch (x) { toast(x.message); }
  }
  return (
    <div className="table-wrap">
      <table>
        <thead><tr><th>Name</th><th>Roll number</th><th>Email</th><th>Registrations</th><th>Role</th></tr></thead>
        <tbody>
          {data.users.map((u) => (
            <tr key={u.id}>
              <td><b style={{ color: 'var(--navy)' }}>{u.name}</b><div className="xs muted">{u.department}</div></td>
              <td className="mono small">{u.roll}</td><td className="small">{u.email}</td><td>{u.registrations}</td>
              <td>
                <select className="select" style={{ padding: '7px 10px', width: 'auto' }} value={u.role} disabled={u.id === user.id} onChange={(e) => setRole(u.id, e.target.value)}>
                  {Object.entries(ROLE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Admin() {
  const [tab, setTab] = useState('overview');
  const toast = useToast();
  const { data, error, reload } = useFetch('/admin/stats');
  const [resetAsk, setResetAsk] = useState(false);
  async function resetDemo() {
    await api('/admin/reset-demo', { method: 'POST' });
    toast('Demo data reset'); setResetAsk(false);
    window.dispatchEvent(new Event('cems:logout'));
  }
  return (
    <div className="stack-lg">
      <div className="row-between wrap">
        <div>
          <div className="eyebrow">Administrator</div>
          <h1 style={{ fontSize: 26 }}>Platform overview</h1>
        </div>
        {resetAsk ? (
          <div className="row"><span className="small sub">Wipe all changes and reseed?</span><button className="btn btn-danger btn-sm" onClick={resetDemo}>Reset</button><button className="btn btn-ghost btn-sm" onClick={() => setResetAsk(false)}>Cancel</button></div>
        ) : <button className="btn btn-secondary btn-sm" onClick={() => setResetAsk(true)}><RotateCcw size={14} /> Reset demo data</button>}
      </div>
      <div className="tabs">
        <button className={tab === 'overview' ? 'active' : ''} onClick={() => { setTab('overview'); reload(); }}>Analytics</button>
        <button className={tab === 'users' ? 'active' : ''} onClick={() => setTab('users')}>Users & roles</button>
      </div>
      {tab === 'overview' ? (error ? <ErrorBox error={error} /> : data ? <Overview s={data} /> : <Spinner />) : <UsersTab />}
    </div>
  );
}
