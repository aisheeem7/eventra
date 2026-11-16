import { useParams } from 'react-router-dom';
import { Link2, Printer } from '../icons.jsx';
import { useToast } from '../App.jsx';
import { BackBar, ErrorBox, Spinner, useFetch } from '../components/ui.jsx';
import { fmtDate } from '../fmt.js';

export function CertificateArt({ c }) {
  return (
    <div className="certificate">
      <div className="c-uni">AMITY UNIVERSITY KOLKATA</div>
      <div className="xs" style={{ color: 'var(--text)', marginTop: 4 }}>{c.event.club}</div>
      <div className="c-title">Certificate of Participation</div>
      <div className="c-body" style={{ marginTop: '3%' }}>This is to certify that</div>
      <div style={{ marginTop: '1.5%' }}><span className="c-name">{c.holder.name}</span></div>
      <div className="c-body" style={{ marginTop: '2.5%' }}>
        ({c.holder.roll}{c.holder.department ? `, ${c.holder.department}` : ''}) participated in <b style={{ color: 'var(--navy)' }}>{c.event.title}</b>,
        a {c.event.category.toLowerCase()} held at {c.event.venue} on {fmtDate(c.event.start)}. Attendance was verified by QR scan at entry.
      </div>
      <div className="c-foot">
        <div className="sig">Event Coordinator<br /><span className="muted">{c.event.club}</span></div>
        <div className="seal">EvenTra<br />VERIFIED</div>
        <div className="sig">Director, Student Affairs<br /><span className="muted">Amity University Kolkata</span></div>
      </div>
      <div style={{ position: 'absolute', bottom: 26, left: 0, right: 0, textAlign: 'center', fontSize: 10, color: 'var(--muted)' }}>
        Certificate ID {c.id} · Issued {fmtDate(c.issuedAt)} · Verify at {window.location.origin}/verify/{c.id}
      </div>
    </div>
  );
}

export default function CertificateView() {
  const { id } = useParams();
  const toast = useToast();
  const { data, error } = useFetch(`/certificates/${id}`);
  if (error) return <><BackBar /><ErrorBox error={error} /></>;
  if (!data) return <Spinner />;
  const c = data.certificate;
  const copy = async () => { try { await navigator.clipboard.writeText(`${window.location.origin}/verify/${c.id}`); toast('Verification link copied'); } catch {} };
  return (
    <div className="stack-lg">
      <div className="no-print">
        <BackBar title="Certificate" right={
          <div className="row">
            <button className="btn btn-secondary btn-sm" onClick={copy}><Link2 size={15} /> <span className="desktop-only">Verification link</span></button>
            <button className="btn btn-primary btn-sm" onClick={() => window.print()}><Printer size={15} /> Download PDF</button>
          </div>} />
      </div>
      <CertificateArt c={c} />
      <p className="xs muted no-print" style={{ textAlign: 'center' }}>Tip: in the print dialog choose “Save as PDF”, landscape.</p>
    </div>
  );
}
