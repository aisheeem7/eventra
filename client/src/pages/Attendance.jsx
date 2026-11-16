import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Attendance as AttendanceIcon, CheckCircle2, Info, MinusCircle, XCircle } from '../icons.jsx';
import { useAuth } from '../App.jsx';
import { AttendanceRing, Avatar, Empty, ErrorBox, Spinner, useFetch } from '../components/ui.jsx';
import { ATTENDANCE_GOOD, ATTENDANCE_OK, ORGANIZERS, attendanceBand, findOrganizer, fmtDate } from '../fmt.js';

const MANDATORY = ORGANIZERS.filter((o) => o.mandatoryFor.length);

function Legend() {
  return (
    <div className="ring-legend">
      <span><i className="band-good" /> {ATTENDANCE_GOOD}% and above</span>
      <span><i className="band-ok" /> {ATTENDANCE_OK}–{ATTENDANCE_GOOD - 1}%</span>
      <span><i className="band-low" /> Below {ATTENDANCE_OK}%</span>
    </div>
  );
}

function RuleNote() {
  return (
    <div className="alert alert-info">
      <Info size={18} style={{ flexShrink: 0, marginTop: 1 }} />
      <span>
        B.Tech students must attend every{' '}
        {MANDATORY.map((o, i) => <span key={o.name}>{i > 0 && ' and '}<b>{o.name}</b></span>)} event.
        Events from other organizers are optional and don't affect the score.
      </span>
    </div>
  );
}

function StudentAttendance() {
  const { data, error, loading } = useFetch('/me/attendance');
  if (loading) return <Spinner />;
  if (error) return <ErrorBox error={error} />;
  const a = data.attendance;
  const band = attendanceBand(a.pct);
  const message = {
    good: "You're on track. Keep it up!",
    ok: `You're close to the line. Attend the next few mandatory events to get back above ${ATTENDANCE_GOOD}%.`,
    low: `Your attendance is below ${ATTENDANCE_OK}%. Mandatory events are required for B.Tech students.`,
    none: 'No mandatory events have been held yet.',
  }[band];

  return (
    <div className="stack-lg page-center">
      <div>
        <div className="eyebrow">Mandatory events</div>
        <h1>Attendance</h1>
      </div>

      {!a.required ? (
        <Empty icon={AttendanceIcon} title="No mandatory events for your programme" text="Every event is optional for you. Attend what interests you!" />
      ) : (
        <>
          <div className="card att-hero">
            <AttendanceRing pct={a.pct} size={168} stroke={15} caption={`${a.attended} of ${a.total}`} />
            <div className="stack" style={{ gap: 10 }}>
              <h2>{a.attended} of {a.total} mandatory events attended</h2>
              <p className="sub small">{message}</p>
              <Legend />
            </div>
          </div>

          <div className="att-orgs">
            {a.byOrganizer.map((o) => (
              <div key={o.club} className="card att-org">
                <AttendanceRing pct={o.pct} size={76} stroke={8} showBand={false} />
                <div className="grow">
                  <h3>{o.club}</h3>
                  <div className="xs muted">{findOrganizer(o.club)?.focus}</div>
                  <div className="small" style={{ marginTop: 4 }}><b>{o.attended}</b> / {o.total} attended</div>
                </div>
              </div>
            ))}
          </div>

          <RuleNote />

          <div className="section-title"><h2>Mandatory event history</h2><span className="small muted">{a.total} events</span></div>
          <div className="card att-list">
            {a.events.map((e) => (
              <div key={e.id} className="att-row">
                {e.attended ? <CheckCircle2 size={22} weight="fill" className="c-good" /> : <XCircle size={22} weight="fill" className="c-low" />}
                <div className="grow">
                  <div className="ellipsis" style={{ fontWeight: 500 }}>{e.title}</div>
                  <div className="xs muted">{fmtDate(e.start)} · {e.club}</div>
                </div>
                <span className={'badge ' + (e.attended ? 'badge-teal' : 'badge-red')}>{e.attended ? 'Present' : 'Absent'}</span>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="section-title"><h2>Optional events attended</h2><span className="small muted">{a.optional.length}</span></div>
      {a.optional.length ? (
        <div className="card att-list">
          {a.optional.map((e) => (
            <div key={e.id} className="att-row">
              <MinusCircle size={22} className="c-muted" />
              <div className="grow">
                <div className="ellipsis" style={{ fontWeight: 500 }}>{e.title}</div>
                <div className="xs muted">{fmtDate(e.start)} · {e.club}</div>
              </div>
              <span className="badge badge-gray">Optional</span>
            </div>
          ))}
        </div>
      ) : <p className="small muted">None yet. Browse <Link className="link" to="/home">upcoming events</Link>.</p>}
    </div>
  );
}

const FILTERS = [
  ['all', 'All'],
  ['low', `Below ${ATTENDANCE_OK}%`],
  ['ok', `${ATTENDANCE_OK}–${ATTENDANCE_GOOD - 1}%`],
  ['good', `${ATTENDANCE_GOOD}%+`],
];

function RosterAttendance() {
  const { data, error, loading } = useFetch('/attendance');
  const [filter, setFilter] = useState('all');
  const students = (data?.students || []).filter((s) => s.required);
  const counts = useMemo(() => {
    const c = { all: students.length, good: 0, ok: 0, low: 0 };
    for (const s of students) c[attendanceBand(s.pct)] = (c[attendanceBand(s.pct)] || 0) + 1;
    return c;
  }, [students]);
  if (loading) return <Spinner />;
  if (error) return <ErrorBox error={error} />;
  const list = students.filter((s) => filter === 'all' || attendanceBand(s.pct) === filter);

  return (
    <div className="stack-lg">
      <div>
        <div className="eyebrow">B.Tech mandatory events</div>
        <h1>Attendance tracker</h1>
      </div>
      <RuleNote />
      <div className="stats">
        <div className="stat"><div className="label">Students tracked</div><div className="value">{counts.all}</div></div>
        <div className="stat"><div className="label"><i className="dot c-good" /> On track</div><div className="value">{counts.good}</div><div className="foot">{ATTENDANCE_GOOD}% and above</div></div>
        <div className="stat"><div className="label"><i className="dot c-ok" /> At risk</div><div className="value">{counts.ok}</div><div className="foot">{ATTENDANCE_OK}–{ATTENDANCE_GOOD - 1}%</div></div>
        <div className="stat"><div className="label"><i className="dot c-low" /> Short</div><div className="value">{counts.low}</div><div className="foot">Below {ATTENDANCE_OK}%</div></div>
      </div>
      <div className="chips">
        {FILTERS.map(([k, label]) => (
          <button key={k} className={'chip' + (filter === k ? ' active' : '')} onClick={() => setFilter(k)}>{label}<span className="count">{counts[k] || 0}</span></button>
        ))}
      </div>
      {list.length === 0 ? <Empty icon={AttendanceIcon} title="No students in this band" /> : (
        <div className="roster">
          {list.map((s) => (
            <div key={s.id} className="card roster-card">
              <AttendanceRing pct={s.pct} size={72} stroke={8} showBand={false} />
              <div className="grow" style={{ minWidth: 0 }}>
                <div className="row" style={{ gap: 8 }}>
                  <Avatar user={s} size="sm" />
                  <div style={{ minWidth: 0 }}>
                    <div className="ellipsis" style={{ fontWeight: 600, color: 'var(--navy)' }}>{s.name}</div>
                    <div className="xs muted mono">{s.roll}</div>
                  </div>
                </div>
                <div className="roster-orgs">
                  {s.byOrganizer.map((o) => (
                    <span key={o.club} className={'org-pill band-' + attendanceBand(o.pct)}>{o.club} {o.attended}/{o.total}</span>
                  ))}
                  {s.optionalCount > 0 && <span className="org-pill">+{s.optionalCount} optional</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Attendance() {
  const { user } = useAuth();
  return user.role === 'student' ? <StudentAttendance /> : <RosterAttendance />;
}
