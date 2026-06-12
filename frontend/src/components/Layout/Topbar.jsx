import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { logoutUser, selectUser } from '../../slices/authSlice';
import { toggleTheme, selectTheme, setGlobalSearch } from '../../slices/uiSlice';
import Avatar from '../UI/Avatar';
import NotificationBell from '../UI/NotificationBell';
import { Search, Sun, Moon, Settings, LogOut, ChevronDown } from 'lucide-react';

const ROLE_META = {
  admin:   { label: 'Admin',    color: '#EF4444', bg: 'rgba(239,68,68,0.15)'   },
  manager: { label: 'Menejer',  color: '#8B5CF6', bg: 'rgba(139,92,246,0.15)'  },
  sales:   { label: 'Sotuv',    color: '#10B981', bg: 'rgba(16,185,129,0.15)'  },
  user:    { label: "Foydalanuvchi", color: '#6366F1', bg: 'rgba(99,102,241,0.15)' },
};

export default function Topbar() {
  const dispatch    = useDispatch();
  const navigate    = useNavigate();
  const location    = useLocation();
  const user        = useSelector(selectUser);
  const theme       = useSelector(selectTheme);

  const SEARCH_PLACEHOLDERS = {
    '/leads':    'Leadlarni qidirish…',
    '/contacts': 'Kontaktlarni qidirish…',
    '/tasks':    'Vazifalarni qidirish…',
  };
  const searchPlaceholder = SEARCH_PLACEHOLDERS[location.pathname] || 'Qidirish…';
  const searchEnabled = location.pathname in SEARCH_PLACEHOLDERS;
  const [search,   setSearch]   = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const debounceRef = useRef(null);

  const handleSearch = (e) => {
    const val = e.target.value;
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      dispatch(setGlobalSearch(val));
    }, 350);
  };

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  // Sahifa o'zgarganda searchni tozalash
  useEffect(() => {
    setSearch('');
    dispatch(setGlobalSearch(''));
  }, [location.pathname, dispatch]);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/auth');
  };

  const rm = ROLE_META[user?.role] || ROLE_META.user;
  const isDark = theme === 'dark';

  return (
    <header style={{
      height: 58, display: 'flex', alignItems: 'center',
      padding: '0 24px', gap: 12,
      position: 'sticky', top: 0, zIndex: 30,
      background: isDark ? 'rgba(15,23,42,0.85)' : 'rgba(255,255,255,0.9)',
      backdropFilter: 'blur(16px)',
      borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.07)',
      boxShadow: isDark ? '0 1px 20px rgba(0,0,0,0.3)' : '0 1px 12px rgba(0,0,0,0.06)',
    }}>

      {/* Search */}
      <div style={{ flex: 1, maxWidth: 380, position: 'relative' }}>
        <span style={{
          position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
          pointerEvents: 'none', color: isDark ? 'rgba(255,255,255,0.3)' : '#9CA3AF',
          display: 'flex',
        }}>
          <Search size={14} strokeWidth={2} />
        </span>
        <input
          type="text" value={search} onChange={handleSearch}
          placeholder={searchPlaceholder}
          disabled={!searchEnabled}
          style={{
            width: '100%', paddingLeft: 36, paddingRight: 14, paddingTop: 8, paddingBottom: 8,
            fontSize: 13, borderRadius: 12, outline: 'none',
            background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
            border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
            color: isDark ? 'rgba(255,255,255,0.8)' : '#374151',
            transition: 'border-color .2s, box-shadow .2s',
            boxSizing: 'border-box',
            opacity: searchEnabled ? 1 : 0.4,
            cursor: searchEnabled ? 'text' : 'not-allowed',
          }}
          onFocus={e => { if (searchEnabled) { e.target.style.borderColor='#185FA5'; e.target.style.boxShadow='0 0 0 3px rgba(24,95,165,0.15)'; } }}
          onBlur={e  => { e.target.style.borderColor=isDark?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.08)'; e.target.style.boxShadow='none'; }}
        />
      </div>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>

        {/* Notification Bell */}
        <NotificationBell isDark={isDark} />

        {/* Theme toggle */}
        <button
          onClick={() => dispatch(toggleTheme())}
          title={isDark ? 'Light mode' : 'Dark mode'}
          style={{
            width: 36, height: 36, borderRadius: 10, border: 'none',
            background: 'transparent', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: isDark ? 'rgba(255,255,255,0.4)' : '#6B7280',
            transition: 'all .15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background=isDark?'rgba(255,255,255,0.07)':'rgba(0,0,0,0.05)'; e.currentTarget.style.color=isDark?'#fff':'#374151'; }}
          onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color=isDark?'rgba(255,255,255,0.4)':'#6B7280'; }}
        >
          {isDark ? <Sun size={15} strokeWidth={2} /> : <Moon size={15} strokeWidth={2} />}
        </button>

        {/* Divider */}
        <div style={{ width: 1, height: 22, background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', margin: '0 4px' }} />

        {/* User menu */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setMenuOpen(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 9,
              padding: '5px 10px 5px 6px', borderRadius: 12, border: 'none',
              background: menuOpen ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)') : 'transparent',
              cursor: 'pointer', transition: 'background .15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background=isDark?'rgba(255,255,255,0.07)':'rgba(0,0,0,0.05)'; }}
            onMouseLeave={e => { if (!menuOpen) e.currentTarget.style.background='transparent'; }}
          >
            {/* Avatar with online dot */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <Avatar name={user?.name || user?.email} size="sm" />
              <span style={{
                position: 'absolute', bottom: 0, right: 0,
                width: 8, height: 8, borderRadius: '50%',
                background: '#10B981',
                border: isDark ? '1.5px solid #0F172A' : '1.5px solid #fff',
              }} />
            </div>

            {/* Name & role */}
            <div className="sm:block" style={{ textAlign: 'left' }}>
              <p style={{
                fontSize: 12, fontWeight: 700, lineHeight: 1.3, maxWidth: 110,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                color: isDark ? 'rgba(255,255,255,0.9)' : '#1F2937',
              }}>
                {user?.name || user?.email?.split('@')[0]}
              </p>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 99,
                color: rm.color, background: rm.bg, letterSpacing: '.04em',
              }}>{rm.label}</span>
            </div>

            <span style={{ color: isDark ? 'rgba(255,255,255,0.3)' : '#9CA3AF', display: 'flex' }}>
              <ChevronDown size={12} strokeWidth={2.5} />
            </span>
          </button>

          {/* Dropdown */}
          {menuOpen && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setMenuOpen(false)} />
              <div style={{
                position: 'absolute', right: 0, top: 'calc(100% + 8px)', zIndex: 20,
                width: 220, borderRadius: 16, overflow: 'hidden',
                background: isDark ? 'linear-gradient(145deg,#1E293B,#0F172A)' : '#fff',
                border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                boxShadow: isDark ? '0 16px 40px rgba(0,0,0,0.5)' : '0 8px 32px rgba(0,0,0,0.12)',
                animation: 'dropIn .18s ease-out',
              }}>
                <style>{`@keyframes dropIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}`}</style>

                {/* User info header */}
                <div style={{
                  padding: '14px 16px 12px',
                  borderBottom: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.07)',
                  background: isDark ? 'rgba(24,95,165,0.08)' : 'rgba(24,95,165,0.04)',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <Avatar name={user?.name || user?.email} size="md" />
                  <div style={{ minWidth: 0 }}>
                    <p style={{
                      fontSize: 13, fontWeight: 700,
                      color: isDark ? '#fff' : '#111827',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{user?.name || '—'}</p>
                    <p style={{
                      fontSize: 11, color: isDark ? 'rgba(255,255,255,0.4)' : '#6B7280',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{user?.email}</p>
                  </div>
                </div>

                {/* Menu items */}
                <div style={{ padding: '6px 6px' }}>
                  {[
                    { icon: <Settings size={14} strokeWidth={2} />, label: 'Sozlamalar', onClick: () => { navigate('/settings'); setMenuOpen(false); }, color: isDark ? 'rgba(255,255,255,0.7)' : '#374151' },
                  ].map((item, i) => (
                    <button key={i} onClick={item.onClick} style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 9,
                      padding: '9px 12px', borderRadius: 10, border: 'none',
                      background: 'transparent', color: item.color,
                      fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'background .12s',
                      textAlign: 'left',
                    }}
                      onMouseEnter={e => e.currentTarget.style.background=isDark?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.05)'}
                      onMouseLeave={e => e.currentTarget.style.background='transparent'}
                    >
                      {item.icon}{item.label}
                    </button>
                  ))}

                  <div style={{ height: 1, background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)', margin: '4px 6px' }} />

                  <button onClick={handleLogout} style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 9,
                    padding: '9px 12px', borderRadius: 10, border: 'none',
                    background: 'transparent', color: '#EF4444',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'background .12s',
                    textAlign: 'left',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background='rgba(239,68,68,0.1)'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}
                  >
                    <LogOut size={14} strokeWidth={2} />Chiqish
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
