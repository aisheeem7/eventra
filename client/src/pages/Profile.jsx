import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Camera, LogOut, Trash, Upload } from '../icons.jsx';
import { api } from '../api.js';
import { useAuth, useToast } from '../App.jsx';
import { ROLE_LABEL } from '../components/Shell.jsx';
import { Avatar } from '../components/ui.jsx';

// Centre-crop to a square and shrink to 320px JPEG, so a phone photo becomes ~30 KB.
function toAvatarDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) return reject(new Error('Choose a PNG, JPG or WebP image.'));
    if (file.size > 10 * 1024 * 1024) return reject(new Error('That image is over 10 MB.'));
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const side = Math.min(img.width, img.height);
      const out = 320;
      const canvas = document.createElement('canvas');
      canvas.width = out; canvas.height = out;
      canvas.getContext('2d').drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, out, out);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.86));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read that image.')); };
    img.src = url;
  });
}

export default function Profile() {
  const { user, setUser, logout } = useAuth();
  const toast = useToast();
  const fileRef = useRef(null);
  const [f, setF] = useState({ name: user.name, phone: user.phone || '', year: user.year || '' });
  const [busy, setBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);

  async function save(e) {
    e.preventDefault(); setBusy(true);
    try { const d = await api('/auth/me', { method: 'PUT', body: f }); setUser(d.user); toast('Profile updated'); }
    catch (x) { toast(x.message); }
    setBusy(false);
  }

  async function setPhoto(avatar) {
    setPhotoBusy(true);
    try { const d = await api('/auth/me', { method: 'PUT', body: { avatar } }); setUser(d.user); toast(avatar ? 'Photo updated' : 'Photo removed'); }
    catch (x) { toast(x.message); }
    setPhotoBusy(false);
  }

  async function onFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try { await setPhoto(await toAvatarDataUrl(file)); } catch (x) { toast(x.message); }
  }

  return (
    <div className="profile stack-lg">
      <div className="card profile-head">
        <div className="profile-photo">
          <Avatar user={user} size="xl" />
          <button type="button" className="photo-btn" onClick={() => fileRef.current?.click()} disabled={photoBusy} aria-label="Change photo">
            <Camera size={18} weight="fill" />
          </button>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={onFile} />
        </div>
        <div>
          <h2>{user.name}</h2>
          <div className="small sub">{ROLE_LABEL[user.role]}{user.club ? ` · ${user.club}` : ''}</div>
          {user.roll && <div className="xs muted mono" style={{ marginTop: 2 }}>{user.roll}</div>}
        </div>
        <div className="row" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => fileRef.current?.click()} disabled={photoBusy}>
            <Upload size={15} /> {photoBusy ? 'Saving…' : user.avatar ? 'Change photo' : 'Upload photo'}
          </button>
          {user.avatar && (
            <button type="button" className="btn btn-danger btn-sm" onClick={() => setPhoto(null)} disabled={photoBusy}><Trash size={15} /> Remove</button>
          )}
        </div>
        {user.role === 'student' && <Link to="/attendance" className="link small">View my attendance →</Link>}
      </div>

      <form className="card stack-lg" onSubmit={save}>
        <h3>Personal details</h3>
        <div className="field"><label>Full name</label><input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
        <div className="field"><label>Email</label><input className="input" value={user.email} readOnly /><span className="hint">Email and roll number are your verified identity and can't be changed here.</span></div>
        <div className="grid-2">
          <div className="field"><label>Phone</label><input className="input" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
          <div className="field"><label>Department</label><input className="input" value={user.department || ''} readOnly /></div>
        </div>
        {user.role === 'student' && <div className="field"><label>Year</label><input className="input" value={f.year} onChange={(e) => setF({ ...f, year: e.target.value })} /></div>}
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
      </form>
      <button className="btn btn-secondary mobile-only" onClick={logout}><LogOut size={16} /> Sign out</button>
    </div>
  );
}
