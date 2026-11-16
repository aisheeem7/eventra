import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Attendance, Award, BarChart3, CalendarPlus, Home, LayoutDashboard, LogOut, ScanLine, SidebarToggle, Ticket, User } from '../icons.jsx';
import { useAuth } from '../App.jsx';
import { Avatar } from './ui.jsx';
import { LogoMark, Wordmark } from './Logo.jsx';

const NAV = {
  student: [
    { to: '/home', label: 'Home', icon: Home },
    { to: '/tickets', label: 'My Tickets', short: 'Tickets', icon: Ticket },
    { to: '/attendance', label: 'Attendance', icon: Attendance },
    { to: '/certificates', label: 'Certificates', short: 'Certs', icon: Award },
    { to: '/profile', label: 'Profile', icon: User },
  ],
  organizer: [
    { to: '/organizer', label: 'My Events', icon: LayoutDashboard },
    { to: '/organizer/new', label: 'Create', icon: CalendarPlus },
    { to: '/attendance', label: 'Attendance', icon: Attendance },
    { to: '/scan', label: 'Scan Entry', short: 'Scan', icon: ScanLine },
    { to: '/profile', label: 'Profile', icon: User },
  ],
  staff: [
    { to: '/scan', label: 'Scan Entry', icon: ScanLine },
    { to: '/profile', label: 'Profile', icon: User },
  ],
  admin: [
    { to: '/admin', label: 'Overview', icon: BarChart3 },
    { to: '/organizer', label: 'All Events', short: 'Events', icon: LayoutDashboard },
    { to: '/attendance', label: 'Attendance', icon: Attendance },
    { to: '/scan', label: 'Scan Entry', short: 'Scan', icon: ScanLine },
    { to: '/profile', label: 'Profile', icon: User },
  ],
};

export const ROLE_LABEL = { student: 'Student', organizer: 'Event Organizer', staff: 'Verification Staff', admin: 'Administrator' };

export function Brand({ size = 40, tag = true }) {
  return (
    <div className="brand">
      <LogoMark size={size} />
      <div>
        <Wordmark size={size * 0.5} />
        {tag && <div className="brand-tag">Amity Kolkata</div>}
      </div>
    </div>
  );
}

export default function Shell({ children }) {
  const { user, logout } = useAuth();
  const items = NAV[user.role];
  const [collapsed, setCollapsed] = useState(() => { try { return localStorage.getItem('eventra_sidebar') === 'collapsed'; } catch { return false; } });
  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    try { localStorage.setItem('eventra_sidebar', next ? 'collapsed' : 'open'); } catch { /* storage unavailable */ }
  }
  return (
    <div className={'shell' + (collapsed ? ' collapsed' : '')}>
      <header className="topbar mobile-only">
        <Brand size={34} tag={false} />
        <NavLink to="/profile" className="avatar-link" aria-label="Profile"><Avatar user={user} size="sm" /></NavLink>
      </header>
      <aside className="sidebar">
        <button className="collapse-btn" onClick={toggle} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          <SidebarToggle size={18} />
        </button>
        <Brand />
        <div className="nav-label">Menu</div>
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end title={collapsed ? label : undefined} className={({ isActive }) => 'navlink' + (isActive ? ' active' : '')}>
            {({ isActive }) => <><span className="nav-ico"><Icon size={19} weight={isActive ? 'fill' : 'duotone'} /></span><span className="nav-text">{label}</span></>}
          </NavLink>
        ))}
        <div className="sidebar-foot">
          <NavLink to="/profile" className="row foot-user" title={collapsed ? user.name : undefined}>
            <Avatar user={user} />
            <div className="grow foot-text">
              <div className="ellipsis" style={{ fontWeight: 600, color: 'var(--navy)', fontSize: 14 }}>{user.name}</div>
              <div className="xs muted">{ROLE_LABEL[user.role]}</div>
            </div>
          </NavLink>
          <button className="btn btn-secondary btn-sm signout" onClick={logout} title="Sign out"><LogOut size={15} /><span className="foot-text">Sign out</span></button>
        </div>
      </aside>
      <main className="main">{children}</main>
      <nav className="tabbar" aria-label="Main">
        {items.map(({ to, label, short, icon: Icon }) => (
          <NavLink key={to} to={to} end className={({ isActive }) => 'tab' + (isActive ? ' active' : '')}>
            {({ isActive }) => <><Icon size={22} weight={isActive ? 'fill' : 'duotone'} /> {short || label}</>}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
