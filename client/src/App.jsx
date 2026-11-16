import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { api, getToken, setToken } from './api.js';
import Shell from './components/Shell.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Home from './pages/Home.jsx';
import EventDetail from './pages/EventDetail.jsx';
import Register from './pages/Register.jsx';
import Tickets from './pages/Tickets.jsx';
import TicketView from './pages/TicketView.jsx';
import Certificates from './pages/Certificates.jsx';
import CertificateView from './pages/CertificateView.jsx';
import Profile from './pages/Profile.jsx';
import OrgDashboard from './pages/OrgDashboard.jsx';
import EventForm from './pages/EventForm.jsx';
import OrgEvent from './pages/OrgEvent.jsx';
import Scanner from './pages/Scanner.jsx';
import Admin from './pages/Admin.jsx';
import Verify from './pages/Verify.jsx';
import Attendance from './pages/Attendance.jsx';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

const ToastCtx = createContext(() => {});
export const useToast = () => useContext(ToastCtx);

export const HOME_FOR = { student: '/home', organizer: '/organizer', staff: '/scan', admin: '/admin' };

function Guard({ roles, children }) {
  const { user } = useAuth();
  const loc = useLocation();
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={HOME_FOR[user.role]} replace />;
  return <Shell>{children}</Shell>;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((msg) => {
    setToast(msg);
    clearTimeout(window.__toastT);
    window.__toastT = setTimeout(() => setToast(null), 2600);
  }, []);

  useEffect(() => {
    if (!getToken()) { setReady(true); return; }
    api('/auth/me').then((d) => setUser(d.user)).catch(() => setToken(null)).finally(() => setReady(true));
  }, []);

  useEffect(() => {
    const out = () => { setToken(null); setUser(null); };
    window.addEventListener('cems:logout', out);
    return () => window.removeEventListener('cems:logout', out);
  }, []);

  const login = (token, u) => { setToken(token); setUser(u); };
  const logout = async () => { try { await api('/auth/logout', { method: 'POST' }); } catch {} setToken(null); setUser(null); };

  if (!ready) return <div className="spinner" />;

  const S = ['student'], O = ['organizer', 'admin'], ST = ['staff', 'organizer', 'admin'], A = ['admin'];
  return (
    <AuthCtx.Provider value={{ user, setUser, login, logout }}>
      <ToastCtx.Provider value={showToast}>
        <Routes>
          <Route path="/login" element={user ? <Navigate to={HOME_FOR[user.role]} /> : <Login />} />
          <Route path="/signup" element={user ? <Navigate to={HOME_FOR[user.role]} /> : <Signup />} />
          <Route path="/verify/:id?" element={<Verify />} />

          <Route path="/home" element={<Guard roles={S}><Home /></Guard>} />
          <Route path="/events/:id" element={<Guard><EventDetail /></Guard>} />
          <Route path="/events/:id/register" element={<Guard roles={S}><Register /></Guard>} />
          <Route path="/tickets" element={<Guard roles={S}><Tickets /></Guard>} />
          <Route path="/tickets/:id" element={<Guard roles={S}><TicketView /></Guard>} />
          <Route path="/certificates" element={<Guard roles={S}><Certificates /></Guard>} />
          <Route path="/certificates/:id" element={<Guard><CertificateView /></Guard>} />
          <Route path="/profile" element={<Guard><Profile /></Guard>} />
          <Route path="/attendance" element={<Guard roles={['student', 'organizer', 'admin']}><Attendance /></Guard>} />

          <Route path="/organizer" element={<Guard roles={O}><OrgDashboard /></Guard>} />
          <Route path="/organizer/new" element={<Guard roles={O}><EventForm /></Guard>} />
          <Route path="/organizer/events/:id" element={<Guard roles={O}><OrgEvent /></Guard>} />
          <Route path="/organizer/events/:id/edit" element={<Guard roles={O}><EventForm /></Guard>} />

          <Route path="/scan" element={<Guard roles={ST}><Scanner /></Guard>} />
          <Route path="/admin" element={<Guard roles={A}><Admin /></Guard>} />

          <Route path="*" element={<Navigate to={user ? HOME_FOR[user.role] : '/login'} replace />} />
        </Routes>
        {toast && <div className="toast" role="status">{toast}</div>}
      </ToastCtx.Provider>
    </AuthCtx.Provider>
  );
}
