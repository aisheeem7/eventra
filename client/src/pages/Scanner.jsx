import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { AlertTriangle, Camera, CameraOff, CheckCircle2, ImageUp, Keyboard, ShieldX, UserCheck } from '../icons.jsx';
import { api } from '../api.js';
import { Empty, ErrorBox, Spinner } from '../components/ui.jsx';
import { fmtRange, fmtTime, isToday } from '../fmt.js';

const RESULT_UI = {
  valid: { cls: 'valid', icon: CheckCircle2, title: 'Entry allowed' },
  duplicate: { cls: 'bad', icon: ShieldX, title: 'Already used' },
  invalid: { cls: 'bad', icon: ShieldX, title: 'Invalid ticket' },
  wrong_event: { cls: 'warn', icon: AlertTriangle, title: 'Wrong event' },
  not_confirmed: { cls: 'warn', icon: AlertTriangle, title: 'Not confirmed' },
};

function beep(ok) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.frequency.value = ok ? 880 : 220; o.connect(g); g.connect(ctx.destination);
    g.gain.setValueAtTime(0.12, ctx.currentTime); o.start(); o.stop(ctx.currentTime + (ok ? 0.12 : 0.35));
  } catch {}
}

export default function Scanner() {
  const [sp, setSp] = useSearchParams();
  const [events, setEvents] = useState(null);
  const [error, setError] = useState(null);
  const eventId = sp.get('event') || '';
  const [live, setLive] = useState(null);
  const [result, setResult] = useState(null);
  const [manual, setManual] = useState('');
  const [camOn, setCamOn] = useState(false);
  const [camErr, setCamErr] = useState('');
  const qrRef = useRef(null);
  const lastRef = useRef({ code: '', at: 0 });
  const fileRef = useRef(null);

  useEffect(() => {
    api('/events?scope=upcoming').then((d) => {
      setEvents(d.events);
      if (!sp.get('event') && d.events.length) {
        const today = d.events.find((e) => isToday(e.start)) || d.events[0];
        setSp({ event: today.id }, { replace: true });
      }
    }).catch(setError);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadLive = useCallback(() => { if (eventId) api(`/events/${eventId}/live`).then(setLive).catch(() => {}); }, [eventId]);
  useEffect(() => { setLive(null); setResult(null); loadLive(); const t = setInterval(loadLive, 3000); return () => clearInterval(t); }, [loadLive]);

  const check = useCallback(async (code) => {
    if (!code || !eventId) return;
    const now = Date.now();
    if (code === lastRef.current.code && now - lastRef.current.at < 3000) return; // camera re-reads same frame
    lastRef.current = { code, at: now };
    try {
      const r = await api('/checkin', { method: 'POST', body: { eventId, code } });
      setResult(r); beep(r.result === 'valid'); loadLive();
    } catch (x) { setResult({ result: 'invalid', message: x.message }); beep(false); }
  }, [eventId, loadLive]);

  const checkRef = useRef(check);
  useEffect(() => { checkRef.current = check; }, [check]);

  async function startCam() {
    setCamErr('');
    try {
      if (!qrRef.current) qrRef.current = new Html5Qrcode('reader', { verbose: false });
      await qrRef.current.start({ facingMode: 'environment' }, { fps: 10, qrbox: { width: 230, height: 230 } }, (text) => checkRef.current(text), () => {});
      setCamOn(true);
    } catch (e) {
      setCamErr('Camera unavailable — allow camera access, or use “Scan from image” / manual code below.');
      setCamOn(false);
    }
  }
  async function stopCam() { try { await qrRef.current?.stop(); } catch {} setCamOn(false); }
  useEffect(() => () => { qrRef.current?.isScanning && qrRef.current.stop().catch(() => {}); }, []);

  async function scanFile(file) {
    if (!file) return;
    if (camOn) await stopCam();
    try {
      if (!qrRef.current) qrRef.current = new Html5Qrcode('reader', { verbose: false });
      const text = await qrRef.current.scanFile(file, false);
      lastRef.current = { code: '', at: 0 };
      check(text);
    } catch { setResult({ result: 'invalid', message: 'No readable QR code found in that image.' }); beep(false); }
    if (fileRef.current) fileRef.current.value = '';
  }

  if (error) return <ErrorBox error={error} />;
  if (!events) return <Spinner />;
  if (!events.length) return <Empty icon={Camera} title="No events to check in" text="There are no open events right now." />;

  const ev = live?.event;
  const ui = result && RESULT_UI[result.result];
  const pct = ev && ev.confirmed ? Math.round((ev.attended / ev.confirmed) * 100) : 0;

  return (
    <div className="stack-lg">
      <div>
        <div className="eyebrow">Entry verification</div>
        <h1 style={{ fontSize: 26 }}>Scan tickets</h1>
      </div>
      <div className="field">
        <label htmlFor="ev">Event at this gate</label>
        <select id="ev" className="select" value={eventId} onChange={(e) => setSp({ event: e.target.value })}>
          {events.map((e) => <option key={e.id} value={e.id}>{isToday(e.start) ? '● Today — ' : ''}{e.title}</option>)}
        </select>
        {ev && <span className="hint">{fmtRange(ev.start, ev.end)} · {ev.venue}</span>}
      </div>

      <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', alignItems: 'start' }}>
        <div className="stack">
          <div className="scan-box">
            <div id="reader" />
            {!camOn && (
              <div className="scan-placeholder">
                <div className="stack" style={{ alignItems: 'center' }}>
                  <Camera size={36} />
                  <div className="small">Point the camera at a student's QR pass</div>
                  <button className="btn btn-primary btn-sm" onClick={startCam}>Start camera</button>
                  {camErr && <div className="xs" style={{ color: '#fecaca', maxWidth: 280 }}>{camErr}</div>}
                </div>
              </div>
            )}
          </div>
          <div className="row wrap">
            {camOn && <button className="btn btn-secondary btn-sm" onClick={stopCam}><CameraOff size={15} /> Stop camera</button>}
            <button className="btn btn-secondary btn-sm" onClick={() => fileRef.current?.click()}><ImageUp size={15} /> Scan from image</button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => scanFile(e.target.files?.[0])} />
          </div>
          <form className="row" onSubmit={(e) => { e.preventDefault(); lastRef.current = { code: '', at: 0 }; check(manual.trim()); setManual(''); }}>
            <div className="search grow"><Keyboard size={16} /><input className="input mono" placeholder="Ticket code e.g. CEMS-482913" value={manual} onChange={(e) => setManual(e.target.value)} /></div>
            <button className="btn btn-primary">Verify</button>
          </form>
          {ui && (
            <div className={'result ' + ui.cls} role="alert">
              <ui.icon size={36} />
              <div className="grow">
                <div className="title">{ui.title}</div>
                {result.holder && <div style={{ fontWeight: 700, color: 'var(--navy)' }}>{result.holder.name} <span className="mono xs muted">{result.holder.roll}</span></div>}
                <div className="small">{result.message}</div>
              </div>
            </div>
          )}
        </div>

        <div className="stack">
          <div className="card stack">
            <div className="row-between"><span className="small sub" style={{ fontWeight: 600 }}><UserCheck size={15} style={{ verticalAlign: -2 }} /> Live headcount</span><span className="badge badge-red"><span className="dot pulse" /> Live</span></div>
            <div className="row" style={{ alignItems: 'baseline', gap: 8 }}><span className="big-count">{ev?.attended ?? '–'}</span><span className="sub">/ {ev?.confirmed ?? '–'} confirmed</span></div>
            <div className="seatbar" style={{ height: 8 }}><div style={{ width: pct + '%', background: 'var(--teal)' }} /></div>
            <div className="xs muted">{pct}% arrived · {ev ? ev.confirmed - ev.attended : 0} still expected</div>
          </div>
          <div className="card stack">
            <h3>Recent scans</h3>
            {!live?.scans?.length && <div className="small muted">No scans yet.</div>}
            {live?.scans?.map((s) => (
              <div key={s.id} className="row-between small">
                <div className="grow ellipsis"><b style={{ color: 'var(--navy)' }}>{s.name}</b> <span className="xs muted mono">{s.roll}</span></div>
                <span className={'badge ' + (s.result === 'valid' ? 'badge-teal' : s.result === 'duplicate' || s.result === 'invalid' ? 'badge-red' : 'badge-orange')}>{RESULT_UI[s.result]?.title || s.result}</span>
                <span className="xs muted" style={{ width: 64, textAlign: 'right' }}>{fmtTime(s.at)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
