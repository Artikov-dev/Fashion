import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  selectNotifications, selectUnread,
  markRead, markAllRead, removeNotification, clearAll,
} from '../../slices/notificationsSlice';
import { Bell, BellOff, X, Check, Trash2, ClipboardCheck } from 'lucide-react';

/* ── helpers ─────────────────────────────────────────────── */
function timeAgo(ms) {
  const s = Math.floor((Date.now() - ms) / 1000);
  if (s < 60)   return 'Hozir';
  if (s < 3600) return `${Math.floor(s / 60)} daqiqa oldin`;
  if (s < 86400) return `${Math.floor(s / 3600)} soat oldin`;
  return `${Math.floor(s / 86400)} kun oldin`;
}

const PRIORITY_COLOR = {
  urgent: '#EF4444',
  high:   '#F59E0B',
  medium: '#185FA5',
  low:    '#6B7280',
};
const TYPE_BG = {
  task:    'rgba(24,95,165,0.12)',
  error:   'rgba(239,68,68,0.12)',
  info:    'rgba(16,185,129,0.12)',
  warning: 'rgba(245,158,11,0.12)',
};


/* ── main component ──────────────────────────────────────── */
export default function NotificationBell({ isDark }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const notifs   = useSelector(selectNotifications);
  const unread   = useSelector(selectUnread);

  const [open,   setOpen]   = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const [tick,   setTick]   = useState(0);     // force timeAgo refresh
  const [animIds, setAnimIds] = useState(new Set());
  const panelRef = useRef(null);
  const prevLen  = useRef(notifs.length);

  /* close on outside click */
  useEffect(() => {
    const handler = e => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* refresh relative timestamps every 30s */
  useEffect(() => {
    const t = setInterval(() => setTick(v => v + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  /* animate newly added notifications */
  useEffect(() => {
    if (notifs.length > prevLen.current && notifs[0]) {
      const id = notifs[0].id;
      setAnimIds(s => new Set(s).add(id));
      setTimeout(() => setAnimIds(s => { const n = new Set(s); n.delete(id); return n; }), 600);
    }
    prevLen.current = notifs.length;
  }, [notifs.length]);

  const visible = filter === 'unread' ? notifs.filter(n => !n.read) : notifs;

  const handleClick = (n) => {
    dispatch(markRead(n.id));
    if (n.type === 'task') { navigate('/tasks'); setOpen(false); }
  };

  /* bell shake when new notif arrives */
  const [shake, setShake] = useState(false);
  useEffect(() => {
    if (unread > 0) { setShake(true); setTimeout(() => setShake(false), 700); }
  }, [unread]);

  return (
    <div ref={panelRef} style={{ position: 'relative' }}>
      <style>{`
        @keyframes bellShake {
          0%,100%{transform:rotate(0)}
          15%{transform:rotate(14deg)}
          30%{transform:rotate(-12deg)}
          45%{transform:rotate(9deg)}
          60%{transform:rotate(-6deg)}
          75%{transform:rotate(3deg)}
        }
        @keyframes slideIn {
          from{opacity:0;transform:translateX(24px)}
          to{opacity:1;transform:translateX(0)}
        }
        @keyframes panelIn {
          from{opacity:0;transform:translateY(-10px) scale(.97)}
          to{opacity:1;transform:translateY(0) scale(1)}
        }
        @keyframes pulse-ring {
          0%{transform:scale(.95);box-shadow:0 0 0 0 rgba(239,68,68,.6)}
          70%{transform:scale(1);box-shadow:0 0 0 8px rgba(239,68,68,0)}
          100%{transform:scale(.95);box-shadow:0 0 0 0 rgba(239,68,68,0)}
        }
      `}</style>

      {/* Bell button */}
      <button
        onClick={() => { setOpen(v => !v); if (!open) dispatch(markAllRead()); }}
        style={{
          width: 38, height: 38, borderRadius: 11, border: 'none',
          background: open
            ? (isDark ? 'rgba(24,95,165,0.25)' : 'rgba(24,95,165,0.1)')
            : 'transparent',
          color: open
            ? '#185FA5'
            : (isDark ? 'rgba(255,255,255,0.45)' : '#6B7280'),
          cursor: 'pointer', position: 'relative',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all .18s',
          animation: shake ? 'bellShake .7s ease' : 'none',
        }}
        onMouseEnter={e => {
          if (!open) {
            e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)';
            e.currentTarget.style.color = isDark ? '#fff' : '#374151';
          }
        }}
        onMouseLeave={e => {
          if (!open) {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = isDark ? 'rgba(255,255,255,0.45)' : '#6B7280';
          }
        }}
        title="Bildirishnomalar"
      >
        <Bell size={17} strokeWidth={unread > 0 ? 2.2 : 2} />
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: 6, right: 6,
            minWidth: 16, height: 16, borderRadius: 99,
            background: '#EF4444', border: isDark ? '2px solid #0F172A' : '2px solid #fff',
            fontSize: 9, fontWeight: 800, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 3px', lineHeight: 1,
            animation: 'pulse-ring 1.5s ease-out infinite',
          }}>
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 'calc(100% + 10px)', zIndex: 100,
          width: 360, maxHeight: 520,
          background: isDark
            ? 'linear-gradient(160deg,#1E293B 0%,#0F172A 100%)'
            : '#fff',
          border: isDark
            ? '1px solid rgba(255,255,255,0.1)'
            : '1px solid rgba(0,0,0,0.1)',
          borderRadius: 20,
          boxShadow: isDark
            ? '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)'
            : '0 10px 40px rgba(0,0,0,0.15)',
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          animation: 'panelIn .2s ease-out',
        }}>

          {/* Header */}
          <div style={{
            padding: '16px 18px 12px',
            borderBottom: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.07)',
            background: isDark
              ? 'linear-gradient(135deg,rgba(24,95,165,0.15) 0%,transparent 100%)'
              : 'linear-gradient(135deg,rgba(24,95,165,0.06) 0%,transparent 100%)',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Bell size={16} strokeWidth={2} />
                <span style={{
                  fontSize: 14, fontWeight: 800,
                  color: isDark ? '#fff' : '#111827',
                  letterSpacing: '-.01em',
                }}>Bildirishnomalar</span>
                {unread > 0 && (
                  <span style={{
                    padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 800,
                    background: 'rgba(239,68,68,0.15)', color: '#EF4444',
                    border: '1px solid rgba(239,68,68,0.25)',
                  }}>{unread} yangi</span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {notifs.length > 0 && (
                  <button onClick={() => dispatch(markAllRead())} title="Hammasini o'qildi" style={{
                    padding: '4px 8px', borderRadius: 7, border: 'none', fontSize: 10, fontWeight: 700,
                    background: 'rgba(16,185,129,0.12)', color: '#10B981', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 4, transition: 'background .15s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background='rgba(16,185,129,0.22)'}
                    onMouseLeave={e => e.currentTarget.style.background='rgba(16,185,129,0.12)'}
                  >
                    <Check size={12} strokeWidth={2.5} />O'qildi
                  </button>
                )}
                {notifs.length > 0 && (
                  <button onClick={() => dispatch(clearAll())} title="Hammasini o'chirish" style={{
                    padding: '4px 8px', borderRadius: 7, border: 'none', fontSize: 10, fontWeight: 700,
                    background: 'rgba(239,68,68,0.1)', color: '#EF4444', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 4, transition: 'background .15s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background='rgba(239,68,68,0.2)'}
                    onMouseLeave={e => e.currentTarget.style.background='rgba(239,68,68,0.1)'}
                  >
                    <Trash2 size={12} strokeWidth={2} />Tozalash
                  </button>
                )}
              </div>
            </div>

            {/* Filter tabs */}
            <div style={{ display: 'flex', gap: 4 }}>
              {['all','unread'].map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{
                  padding: '5px 14px', borderRadius: 8, border: 'none', fontSize: 11, fontWeight: 700,
                  cursor: 'pointer', transition: 'all .15s',
                  background: filter === f
                    ? (isDark ? '#185FA5' : '#185FA5')
                    : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'),
                  color: filter === f ? '#fff' : (isDark ? 'rgba(255,255,255,0.4)' : '#6B7280'),
                  boxShadow: filter === f ? '0 2px 8px rgba(24,95,165,0.35)' : 'none',
                }}>
                  {f === 'all' ? 'Barchasi' : `O'qilmagan${unread > 0 ? ` (${unread})` : ''}`}
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {visible.length === 0 ? (
              <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 12, display: 'flex', justifyContent: 'center', color: isDark ? 'rgba(255,255,255,0.2)' : '#D1D5DB' }}><BellOff size={40} strokeWidth={1.5} /></div>
                <p style={{ fontSize: 13, color: isDark ? 'rgba(255,255,255,0.3)' : '#9CA3AF' }}>
                  {filter === 'unread' ? "O'qilmagan bildirishnoma yo'q" : "Bildirishnoma yo'q"}
                </p>
              </div>
            ) : (
              visible.map((n, idx) => (
                <div key={n.id}
                  onClick={() => handleClick(n)}
                  style={{
                    display: 'flex', gap: 12, padding: '12px 16px',
                    borderBottom: idx < visible.length - 1
                      ? (isDark ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(0,0,0,0.04)')
                      : 'none',
                    background: !n.read
                      ? (isDark ? 'rgba(24,95,165,0.07)' : 'rgba(24,95,165,0.04)')
                      : 'transparent',
                    cursor: n.type === 'task' ? 'pointer' : 'default',
                    transition: 'background .15s',
                    animation: animIds.has(n.id) ? 'slideIn .4s ease-out' : 'none',
                    position: 'relative',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.025)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = !n.read
                      ? (isDark ? 'rgba(24,95,165,0.07)' : 'rgba(24,95,165,0.04)')
                      : 'transparent';
                  }}
                >
                  {/* unread dot */}
                  {!n.read && (
                    <span style={{
                      position: 'absolute', left: 6, top: '50%', transform: 'translateY(-50%)',
                      width: 5, height: 5, borderRadius: '50%', background: '#185FA5',
                      boxShadow: '0 0 6px #185FA5',
                    }} />
                  )}

                  {/* Icon circle */}
                  <div style={{
                    width: 38, height: 38, borderRadius: 12, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18,
                    background: TYPE_BG[n.type] || 'rgba(255,255,255,0.06)',
                    border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
                  }}>
                    {n.type === 'task' ? <ClipboardCheck size={13} strokeWidth={2} /> : <Bell size={13} strokeWidth={2} />}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                      <p style={{
                        fontSize: 12, fontWeight: 700, lineHeight: 1.4,
                        color: isDark ? 'rgba(255,255,255,0.88)' : '#111827',
                        marginBottom: 2,
                      }}>{n.title}</p>
                      <button
                        onClick={e => { e.stopPropagation(); dispatch(removeNotification(n.id)); }}
                        style={{
                          flexShrink: 0, background: 'none', border: 'none',
                          color: isDark ? 'rgba(255,255,255,0.25)' : '#D1D5DB',
                          cursor: 'pointer', padding: 2, borderRadius: 4, display: 'flex',
                          transition: 'color .15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.color='#EF4444'}
                        onMouseLeave={e => e.currentTarget.style.color=isDark?'rgba(255,255,255,0.25)':'#D1D5DB'}
                      ><X size={11} strokeWidth={2.5} /></button>
                    </div>

                    <p style={{
                      fontSize: 12, color: isDark ? 'rgba(255,255,255,0.5)' : '#6B7280',
                      marginBottom: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{n.body}</p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 10, color: isDark ? 'rgba(255,255,255,0.25)' : '#9CA3AF' }}>
                        {timeAgo(n.time)}
                      </span>
                      {n.priority && (
                        <span style={{
                          fontSize: 9, fontWeight: 800, padding: '1px 6px', borderRadius: 99,
                          color: PRIORITY_COLOR[n.priority] || '#888',
                          background: `${PRIORITY_COLOR[n.priority] || '#888'}18`,
                          border: `1px solid ${PRIORITY_COLOR[n.priority] || '#888'}33`,
                          letterSpacing: '.05em', textTransform: 'uppercase',
                        }}>{n.priority}</span>
                      )}
                      {n.type === 'task' && (
                        <span style={{ fontSize: 10, color: '#185FA5', fontWeight: 600 }}>
                          → Vazifalarga o'tish
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifs.length > 0 && (
            <div style={{
              padding: '10px 16px',
              borderTop: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
              textAlign: 'center', flexShrink: 0,
              background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)',
            }}>
              <button onClick={() => { navigate('/tasks'); setOpen(false); }} style={{
                background: 'none', border: 'none', fontSize: 12, fontWeight: 600,
                color: '#185FA5', cursor: 'pointer', transition: 'opacity .15s',
              }}
                onMouseEnter={e => e.currentTarget.style.opacity='.7'}
                onMouseLeave={e => e.currentTarget.style.opacity='1'}
              >
                Barcha vazifalarni ko'rish →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
