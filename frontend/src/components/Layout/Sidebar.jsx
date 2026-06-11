import { NavLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toggleSidebar, selectSidebarCollapsed } from '../../slices/uiSlice';
import { selectRole } from '../../slices/authSlice';

/* ── SVG icon set ──────────────────────────────────────────── */
const Icon = {
  Dashboard: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
    </svg>
  ),
  Pipeline: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M3 12h12M3 18h7"/><path d="M17 15l3 3-3 3"/>
    </svg>
  ),
  Contacts: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/><path d="M21 21v-2a4 4 0 0 0-3-3.87"/>
    </svg>
  ),
  Leads: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
    </svg>
  ),
  Tasks: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
    </svg>
  ),
  Analytics: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/>
    </svg>
  ),
  Admin: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  ),
  Settings: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  ChevronLeft: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6"/>
    </svg>
  ),
  ChevronRight: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6"/>
    </svg>
  ),
};

const NAV = [
  { to: '/dashboard', icon: Icon.Dashboard, label: 'Dashboard' },
  { to: '/pipeline',  icon: Icon.Pipeline,  label: 'Pipeline' },
  { to: '/contacts',  icon: Icon.Contacts,  label: 'Kontaktlar' },
  { to: '/leads',     icon: Icon.Leads,     label: 'Leadlar' },
  { to: '/tasks',     icon: Icon.Tasks,     label: 'Vazifalar' },
  { to: '/analytics', icon: Icon.Analytics, label: 'Analitika',  roles: ['admin', 'manager'] },
  { to: '/admin',     icon: Icon.Admin,     label: 'Boshqaruv', roles: ['admin'] },
  { to: '/settings',  icon: Icon.Settings,  label: 'Sozlamalar' },
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
        <div style={{
          width: 34, height: 34, borderRadius: 10, flexShrink: 0,
          background: 'linear-gradient(135deg, #185FA5 0%, #3B82F6 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(24,95,165,0.5)',
          fontSize: 15, fontWeight: 900, color: '#fff', letterSpacing: '-.03em',
        }}>N</div>
        {!collapsed && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', letterSpacing: '.06em' }}>NEXORA</div>
            <div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.35)', letterSpacing: '.12em', marginTop: 1 }}>CRM PLATFORM</div>
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
                  <IconComp />
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
          background: 'none', border: 'none', borderTop: '1px solid rgba(255,255,255,0.07)',
          color: 'rgba(255,255,255,0.3)', cursor: 'pointer',
          transition: 'color .2s', flexShrink: 0,
        }}
        onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.75)'}
        onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
      >
        {collapsed ? <Icon.ChevronRight /> : <Icon.ChevronLeft />}
      </button>
    </aside>
  );
}
