import { NavLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toggleSidebar, selectSidebarCollapsed } from '../../slices/uiSlice';
import { selectRole } from '../../slices/authSlice';
import {
  LayoutDashboard,
  Users2,
  Bolt,
  ListChecks,
  BarChart2,
  ShieldCheck,
  Settings,
  ChevronLeft,
  ChevronRight,
  GitMerge,
} from 'lucide-react';

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/pipeline',  icon: GitMerge,        label: 'Pipeline' },
  { to: '/contacts',  icon: Users2,          label: 'Kontaktlar' },
  { to: '/leads',     icon: Bolt,            label: 'Leadlar' },
  { to: '/tasks',     icon: ListChecks,      label: 'Vazifalar' },
  { to: '/analytics', icon: BarChart2,       label: 'Analitika',  roles: ['admin', 'manager'] },
  { to: '/admin',     icon: ShieldCheck,     label: 'Boshqaruv', roles: ['admin'] },
  { to: '/settings',  icon: Settings,        label: 'Sozlamalar' },
];

export default function Sidebar() {
  const dispatch  = useDispatch();
  const collapsed = useSelector(selectSidebarCollapsed);
  const role      = useSelector(selectRole);

  const visible = NAV.filter(item => !item.roles || item.roles.includes(role));

  return (
    <aside style={{
      display: 'flex', flexDirection: 'column', height: '100vh',
      position: 'fixed', top: 0, left: 0, zIndex: 40,
      width: collapsed ? 64 : 224,
      background: 'linear-gradient(180deg, #0A1628 0%, #0F172A 50%, #0A1628 100%)',
      borderRight: '1px solid rgba(255,255,255,0.06)',
      transition: 'width .3s cubic-bezier(.4,0,.2,1)',
      overflow: 'hidden',
    }}>

      {/* Logo */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: collapsed ? '20px 0' : '20px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        justifyContent: collapsed ? 'center' : 'flex-start',
        flexShrink: 0,
      }}>
        <svg width="34" height="34" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
          <defs>
            <linearGradient id="sb-gold" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#F5D27A"/>
              <stop offset="50%" stopColor="#C9A84C"/>
              <stop offset="100%" stopColor="#A07830"/>
            </linearGradient>
          </defs>
          <rect x="3" y="3" width="94" height="94" rx="20" stroke="url(#sb-gold)" strokeWidth="1.2" fill="none" opacity="0.5"/>
          <path d="M26 76V24h7l34 38V24h7v52h-7L33 38v38H26z" fill="url(#sb-gold)"/>
        </svg>
        {!collapsed && (
          <div style={{ lineHeight: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 300, color: '#fff', letterSpacing: '.14em', textTransform: 'uppercase', fontFamily: 'Cormorant Garamond, serif' }}>Nexora</div>
            <div style={{ fontSize: 9, fontWeight: 500, color: 'rgba(201,168,76,0.6)', letterSpacing: '.12em', marginTop: 3, textTransform: 'uppercase' }}>CRM Platform</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {visible.map(({ to, icon: IconComp, label }) => (
          <NavLink key={to} to={to} title={collapsed ? label : undefined}
            style={{ textDecoration: 'none' }}
          >
            {({ isActive }) => (
              <div style={{
                display: 'flex', alignItems: 'center',
                gap: collapsed ? 0 : 10,
                justifyContent: collapsed ? 'center' : 'flex-start',
                padding: collapsed ? '10px 0' : '9px 12px',
                borderRadius: 10,
                background: isActive
                  ? 'linear-gradient(135deg, rgba(24,95,165,0.9) 0%, rgba(59,130,246,0.7) 100%)'
                  : 'transparent',
                color: isActive ? '#fff' : 'rgba(255,255,255,0.45)',
                boxShadow: isActive ? '0 4px 12px rgba(24,95,165,0.35)' : 'none',
                transition: 'all .2s',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
              }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; } }}
              >
                {isActive && (
                  <div style={{
                    position: 'absolute', inset: 0, borderRadius: 10,
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 100%)',
                    pointerEvents: 'none',
                  }} />
                )}
                <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                  <IconComp size={18} strokeWidth={1.8} />
                </span>
                {!collapsed && (
                  <span style={{ fontSize: 13, fontWeight: isActive ? 600 : 400, whiteSpace: 'nowrap', overflow: 'hidden' }}>
                    {label}
                  </span>
                )}
                {isActive && !collapsed && (
                  <div style={{
                    marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%',
                    background: '#38BDF8', boxShadow: '0 0 8px #38BDF8',
                  }} />
                )}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Collapse button */}
      <button
        onClick={() => dispatch(toggleSidebar())}
        title={collapsed ? 'Kengaytirish' : "Yig'ish"}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '14px 0', borderTop: '1px solid rgba(255,255,255,0.07)',
          background: 'none', border: 'none',
          color: 'rgba(255,255,255,0.3)', cursor: 'pointer',
          transition: 'color .2s', flexShrink: 0,
        }}
        onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.75)'}
        onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
      >
        {collapsed ? <ChevronRight size={16} strokeWidth={2} /> : <ChevronLeft size={16} strokeWidth={2} />}
      </button>
    </aside>
  );
}
