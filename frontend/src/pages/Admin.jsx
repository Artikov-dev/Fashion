import { useEffect, useState } from 'react';
import api from '../utils/api';
import Avatar from '../components/UI/Avatar';
import {
  Users, BarChart2, FileText, Plus, Pencil, Ban, LockOpen,
  Trash2, Search, X, Check, Eye, EyeOff, ChevronLeft, ChevronRight,
  UserCheck, Contact, Zap, Target, Trophy, ClipboardList, Timer, TrendingUp,
} from 'lucide-react';

const Ico = {
  Users:      () => <Users size={16} strokeWidth={2} />,
  Stats:      () => <BarChart2 size={16} strokeWidth={2} />,
  Audit:      () => <FileText size={16} strokeWidth={2} />,
  Plus:       () => <Plus size={15} strokeWidth={2.5} />,
  Edit:       () => <Pencil size={13} strokeWidth={2} />,
  Block:      () => <Ban size={13} strokeWidth={2} />,
  Unlock:     () => <LockOpen size={13} strokeWidth={2} />,
  Trash:      () => <Trash2 size={13} strokeWidth={2} />,
  Search:     () => <Search size={14} strokeWidth={2} />,
  X:          () => <X size={14} strokeWidth={2.5} />,
  Check:      () => <Check size={14} strokeWidth={2.5} />,
  Eye:        () => <Eye size={14} strokeWidth={2} />,
  EyeOff:     () => <EyeOff size={14} strokeWidth={2} />,
  ChevLeft:   () => <ChevronLeft size={14} strokeWidth={2.5} />,
  ChevRight:  () => <ChevronRight size={14} strokeWidth={2.5} />,
};

const ROLES = ['admin', 'manager', 'sales', 'user'];
const EMPTY = { name: '', email: '', password: '', role: 'sales' };

const ROLE_META = {
  admin:   { label: 'Admin',    color: '#EF4444', bg: 'rgba(239,68,68,0.12)',   glow: '#EF4444' },
  manager: { label: 'Manager',  color: '#F59E0B', bg: 'rgba(245,158,11,0.12)',  glow: '#F59E0B' },
  sales:   { label: 'Sales',    color: '#10B981', bg: 'rgba(16,185,129,0.12)',  glow: '#10B981' },
  user:    { label: 'User',     color: '#6366F1', bg: 'rgba(99,102,241,0.12)',  glow: '#6366F1' },
};

const STAT_CARDS = [
  { key: 'total_users',      label: 'Jami foydalanuvchilar', icon: <Users size={18} strokeWidth={2} />,         color: '#38BDF8' },
  { key: 'active_users',     label: 'Faol foydalanuvchilar', icon: <UserCheck size={18} strokeWidth={2} />,     color: '#10B981' },
  { key: 'total_contacts',   label: 'Kontaktlar',             icon: <Contact size={18} strokeWidth={2} />,      color: '#8B5CF6' },
  { key: 'total_leads',      label: 'Jami leadlar',           icon: <Zap size={18} strokeWidth={2} />,          color: '#F59E0B' },
  { key: 'open_leads',       label: 'Ochiq leadlar',          icon: <Target size={18} strokeWidth={2} />,       color: '#185FA5' },
  { key: 'won_deals',        label: 'Yutilgan bitimlar',      icon: <Trophy size={18} strokeWidth={2} />,       color: '#10B981' },
  { key: 'total_tasks',      label: 'Jami vazifalar',         icon: <ClipboardList size={18} strokeWidth={2} />, color: '#8B5CF6' },
  { key: 'pending_tasks',    label: 'Kutayotgan vazifalar',   icon: <Timer size={18} strokeWidth={2} />,        color: '#EF4444' },
  { key: 'total_activities', label: 'Faoliyatlar',            icon: <TrendingUp size={18} strokeWidth={2} />,   color: '#38BDF8' },
];

/* ── small reusable ──────────────────────────────────────────── */
function RoleBadge({ role }) {
  const m = ROLE_META[role] || { label: role, color: '#888', bg: 'rgba(136,136,136,0.12)' };
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700,
      color: m.color, background: m.bg, border: `1px solid ${m.color}33`,
      letterSpacing: '.04em',
    }}>{m.label}</span>
  );
}

function ActionBtn({ onClick, color, hoverBg, icon, label }) {
  return (
    <button onClick={onClick} title={label} style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '5px 10px', borderRadius: 8, border: 'none',
      background: 'rgba(255,255,255,0.04)', color,
      fontSize: 11, fontWeight: 600, cursor: 'pointer',
      transition: 'all .15s',
    }}
      onMouseEnter={e => { e.currentTarget.style.background = hoverBg; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
    >
      {icon}{label}
    </button>
  );
}

/* ── Modal ───────────────────────────────────────────────────── */
function UserModal({ open, onClose, editUser, onSaved }) {
  const [form, setForm]     = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm(editUser ? { name: editUser.name || '', email: editUser.email, password: '', role: editUser.role } : EMPTY);
    setError(''); setShowPw(false);
  }, [open, editUser]);

  const up = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const body = { ...form };
      if (editUser && !body.password) delete body.password;
      if (editUser) await api.put(`/admin/users/${editUser.id}`, body);
      else          await api.post('/admin/users', body);
      onSaved(); onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Xato yuz berdi');
    }
    setSaving(false);
  };

  if (!open) return null;

  const inp = {
    width: '100%', padding: '10px 14px', borderRadius: 10, fontSize: 13,
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    color: '#fff', outline: 'none', transition: 'border-color .2s', boxSizing: 'border-box',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999, display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)',
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        width: '100%', maxWidth: 440, margin: '0 16px',
        background: 'linear-gradient(145deg, #1E293B 0%, #0F172A 100%)',
        border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20,
        boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
        overflow: 'hidden',
      }}>
        {/* header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px 18px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          background: 'linear-gradient(135deg, rgba(24,95,165,0.15) 0%, transparent 100%)',
        }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 2 }}>
              {editUser ? 'Foydalanuvchini tahrirlash' : 'Yangi foydalanuvchi'}
            </h2>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
              {editUser ? `ID: #${editUser.id}` : "CRM tizimiga qo'shish"}
            </p>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 8, border: 'none',
            background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all .15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(239,68,68,0.2)'; e.currentTarget.style.color='#EF4444'; }}
            onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.07)'; e.currentTarget.style.color='rgba(255,255,255,0.5)'; }}
          ><Ico.X /></button>
        </div>

        {/* avatar preview */}
        {(form.name || editUser) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 24px 0' }}>
            <Avatar name={form.name || editUser?.email} size="lg" />
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{form.name || '—'}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{form.email || '—'}</div>
            </div>
          </div>
        )}

        {/* form */}
        <form onSubmit={handleSave} style={{ padding: '16px 24px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {error && (
            <div style={{
              padding: '10px 14px', borderRadius: 10, fontSize: 12, color: '#FCA5A5',
              background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)',
            }}>{error}</div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 6, letterSpacing: '.06em', textTransform: 'uppercase' }}>To'liq ism</label>
              <input value={form.name} onChange={up('name')} placeholder="Jasur Karimov" style={inp}
                onFocus={e => e.target.style.borderColor='#185FA5'} onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.1)'} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 6, letterSpacing: '.06em', textTransform: 'uppercase' }}>Email *</label>
              <input required type="email" value={form.email} onChange={up('email')} placeholder="user@nexora.uz" style={inp}
                onFocus={e => e.target.style.borderColor='#185FA5'} onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.1)'} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 6, letterSpacing: '.06em', textTransform: 'uppercase' }}>
              Parol {editUser && <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(bo'sh qolsa o'zgarmaydi)</span>}
            </label>
            <div style={{ position: 'relative' }}>
              <input type={showPw ? 'text' : 'password'} value={form.password} onChange={up('password')}
                required={!editUser} placeholder={editUser ? '••••••' : 'Kamida 6 belgi'}
                style={{ ...inp, paddingRight: 40 }}
                onFocus={e => e.target.style.borderColor='#185FA5'} onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.1)'} />
              <button type="button" onClick={() => setShowPw(v => !v)} style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer',
                display: 'flex', padding: 0,
              }}>
                {showPw ? <Ico.EyeOff /> : <Ico.Eye />}
              </button>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 6, letterSpacing: '.06em', textTransform: 'uppercase' }}>Rol</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6 }}>
              {ROLES.map(r => {
                const m = ROLE_META[r];
                const sel = form.role === r;
                return (
                  <button key={r} type="button" onClick={() => setForm(p => ({ ...p, role: r }))} style={{
                    padding: '8px 4px', borderRadius: 10, border: `1.5px solid ${sel ? m.color : 'rgba(255,255,255,0.08)'}`,
                    background: sel ? m.bg : 'transparent',
                    color: sel ? m.color : 'rgba(255,255,255,0.4)',
                    fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all .15s',
                    boxShadow: sel ? `0 0 12px ${m.color}33` : 'none',
                  }}>{m.label}</button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{
              flex: 1, padding: '11px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)',
              background: 'transparent', color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', transition: 'all .15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.05)'; e.currentTarget.style.color='#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='rgba(255,255,255,0.5)'; }}
            >Bekor</button>
            <button type="submit" disabled={saving} style={{
              flex: 1, padding: '11px', borderRadius: 12, border: 'none',
              background: saving ? 'rgba(24,95,165,0.5)' : 'linear-gradient(135deg, #185FA5 0%, #3B82F6 100%)',
              color: '#fff', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
              transition: 'all .15s', boxShadow: saving ? 'none' : '0 4px 14px rgba(24,95,165,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              {saving ? (
                <><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .7s linear infinite', display: 'inline-block' }} />Saqlanmoqda…</>
              ) : (
                <><Ico.Check />{editUser ? 'Saqlash' : 'Yaratish'}</>
              )}
            </button>
          </div>
        </form>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );
}

/* ── Main ────────────────────────────────────────────────────── */
export default function Admin() {
  const [tab,      setTab]      = useState('users');
  const [users,    setUsers]    = useState([]);
  const [stats,    setStats]    = useState(null);
  const [meta,     setMeta]     = useState({ page: 1, total: 0, pages: 1 });
  const [page,     setPage]     = useState(1);
  const [search,   setSearch]   = useState('');
  const [roleF,    setRoleF]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [modal,    setModal]    = useState(false);
  const [editUser, setEditUser] = useState(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users', { params: { q: search, role: roleF, page, per_page: 15 } });
      setUsers(res.data.data); setMeta(res.data.meta);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const loadStats = async () => {
    try { const res = await api.get('/admin/stats'); setStats(res.data.data); } catch { /* ignore */ }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadUsers(); }, [search, roleF, page]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadStats(); }, []);

  const openCreate = () => { setEditUser(null); setModal(true); };
  const openEdit   = u  => { setEditUser(u);    setModal(true); };

  const handleBlock = async (u) => {
    if (!window.confirm(`"${u.name || u.email}" ni ${u.is_active ? 'bloklash' : 'aktiv qilish'}?`)) return;
    await api.patch(`/admin/users/${u.id}/block`, { block: u.is_active });
    loadUsers();
  };

  const handleDelete = async (u) => {
    if (!window.confirm(`"${u.name || u.email}" ni o'chirmoqchimisiz?`)) return;
    try { await api.delete(`/admin/users/${u.id}`); loadUsers(); }
    catch (err) { alert(err.response?.data?.message || 'Xato'); }
  };

  const TABS = [
    { key: 'users', label: 'Foydalanuvchilar', icon: <Ico.Users /> },
    { key: 'stats', label: 'Statistika',        icon: <Ico.Stats /> },
    { key: 'audit', label: 'Audit log',          icon: <Ico.Audit /> },
  ];

  return (
    <div style={{ fontFamily: "'Inter',system-ui,sans-serif" }}>

      {/* Page header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(24,95,165,0.12) 0%, rgba(139,92,246,0.06) 100%)',
        border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20,
        padding: '24px 28px', marginBottom: 24, position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -20, right: -20, width: 140, height: 140, borderRadius: '50%', background: 'rgba(24,95,165,0.15)', filter: 'blur(40px)' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--tw-prose-body,#fff)', letterSpacing: '-.02em', marginBottom: 4 }}
              className="text-gray-900 dark:text-white">
              Boshqaruv paneli
            </h1>
            <p style={{ fontSize: 13 }} className="text-gray-400 dark:text-white/35">
              Foydalanuvchilar va tizim sozlamalari
            </p>
          </div>
          {stats && (
            <div style={{ display: 'flex', gap: 16 }}>
              {[
                { v: stats.total_users,   l: 'Foydalanuvchi', c: '#38BDF8' },
                { v: stats.active_users,  l: 'Faol',          c: '#10B981' },
                { v: stats.total_leads,   l: 'Lead',          c: '#F59E0B' },
              ].map((s, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: s.c }}>{s.v ?? '—'}</div>
                  <div style={{ fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase' }} className="text-gray-400 dark:text-white/35">{s.l}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, padding: '4px', borderRadius: 14 }}
        className="bg-gray-100 dark:bg-white/[0.04]">
        {TABS.map(({ key, label, icon }) => (
          <button key={key} onClick={() => setTab(key)} style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            padding: '9px 16px', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', transition: 'all .2s',
            background: tab === key ? (document.documentElement.classList.contains('dark') ? '#185FA5' : '#fff') : 'transparent',
            color: tab === key ? (document.documentElement.classList.contains('dark') ? '#fff' : '#185FA5') : undefined,
            boxShadow: tab === key ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
          }}
            className={tab === key ? '' : 'text-gray-400 dark:text-white/35 hover:text-gray-600 dark:hover:text-white/60'}
          >
            {icon}{label}
          </button>
        ))}
      </div>

      {/* ── Users tab ──────────────────────────────────────── */}
      {tab === 'users' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* toolbar */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 260 }}>
              <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                className="text-gray-400 dark:text-white/30">
                <Ico.Search />
              </span>
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Ism yoki email…"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-gray-700 dark:text-white/80 outline-none focus:border-[#185FA5] transition-colors"
                style={{ paddingLeft: 34 }} />
            </div>

            <select value={roleF} onChange={e => { setRoleF(e.target.value); setPage(1); }}
              className="px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-gray-700 dark:text-white/80 outline-none">
              <option value="">Barcha rol</option>
              {ROLES.map(r => <option key={r} value={r}>{ROLE_META[r].label}</option>)}
            </select>

            <button onClick={openCreate} style={{
              marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 7,
              padding: '9px 18px', borderRadius: 12, border: 'none',
              background: 'linear-gradient(135deg, #185FA5 0%, #3B82F6 100%)',
              color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(24,95,165,0.4)', transition: 'opacity .2s',
            }}
              onMouseEnter={e => e.currentTarget.style.opacity='.88'}
              onMouseLeave={e => e.currentTarget.style.opacity='1'}
            >
              <Ico.Plus />Yangi foydalanuvchi
            </button>
          </div>

          {/* table card */}
          <div className="bg-white dark:bg-[#1E293B]/80" style={{
            borderRadius: 20, overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
            backdropFilter: 'blur(12px)',
          }}>
            {loading && users.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {[...Array(6)].map((_, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px',
                    borderBottom: '1px solid rgba(255,255,255,0.05)', animation: 'pulse 1.5s ease-in-out infinite',
                    animationDelay: `${i * 0.1}s` }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%' }} className="bg-gray-100 dark:bg-white/10" />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ height: 12, borderRadius: 6, width: '40%' }} className="bg-gray-100 dark:bg-white/10" />
                      <div style={{ height: 10, borderRadius: 6, width: '25%' }} className="bg-gray-100 dark:bg-white/[0.06]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : users.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 24px' }}
                className="text-gray-400 dark:text-white/30">
                <div style={{ fontSize: 36, marginBottom: 12 }}>👤</div>
                <p style={{ fontSize: 14 }}>Foydalanuvchi topilmadi</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      {['Foydalanuvchi','Rol','Holat','Qo\'shildi','Amallar'].map((h, i) => (
                        <th key={i} style={{
                          padding: '12px 16px', textAlign: i === 4 ? 'right' : 'left',
                          fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase',
                        }} className="text-gray-400 dark:text-white/25">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u, idx) => (
                      <tr key={u.id} style={{ borderBottom: idx < users.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', transition: 'background .15s' }}
                        className="hover:bg-gray-50 dark:hover:bg-white/[0.025]">

                        {/* User cell */}
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                            <div style={{ position: 'relative', flexShrink: 0 }}>
                              <Avatar name={u.name || u.email} url={u.avatar_url} size="md" />
                              {u.is_active && (
                                <span style={{
                                  position: 'absolute', bottom: 0, right: 0,
                                  width: 9, height: 9, borderRadius: '50%',
                                  background: '#10B981', border: '2px solid #1E293B',
                                }} />
                              )}
                            </div>
                            <div>
                              <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 1 }}
                                className="text-gray-800 dark:text-white/90">
                                {u.name || <span className="text-gray-300 dark:text-white/20">—</span>}
                              </p>
                              <p style={{ fontSize: 11 }} className="text-gray-400 dark:text-white/30">{u.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td style={{ padding: '12px 16px' }}><RoleBadge role={u.role} /></td>

                        {/* Status */}
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600,
                            background: u.is_active ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                            color: u.is_active ? '#10B981' : '#EF4444',
                            border: `1px solid ${u.is_active ? '#10B98133' : '#EF444433'}`,
                          }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
                            {u.is_active ? 'Faol' : 'Bloklangan'}
                          </span>
                        </td>

                        {/* Date */}
                        <td style={{ padding: '12px 16px', fontSize: 11 }}
                          className="text-gray-400 dark:text-white/25 hidden md:table-cell">
                          {new Date(u.created_at).toLocaleDateString('uz-UZ')}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                            <ActionBtn onClick={() => openEdit(u)}
                              color="#38BDF8" hoverBg="rgba(56,189,248,0.12)"
                              icon={<Ico.Edit />} label="Tahrir" />
                            <ActionBtn
                              onClick={() => handleBlock(u)}
                              color={u.is_active ? '#F59E0B' : '#10B981'}
                              hoverBg={u.is_active ? 'rgba(245,158,11,0.12)' : 'rgba(16,185,129,0.12)'}
                              icon={u.is_active ? <Ico.Block /> : <Ico.Unlock />}
                              label={u.is_active ? 'Blok' : 'Aktiv'} />
                            <ActionBtn onClick={() => handleDelete(u)}
                              color="#EF4444" hoverBg="rgba(239,68,68,0.12)"
                              icon={<Ico.Trash />} label="O'chirish" />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* pagination */}
            {meta.pages > 1 && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.06)',
              }}>
                <span style={{ fontSize: 12 }} className="text-gray-400 dark:text-white/30">
                  {meta.total} foydalanuvchi · {page}/{meta.pages} sahifa
                </span>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[...Array(Math.min(meta.pages, 5))].map((_, i) => {
                    const p = i + 1;
                    return (
                      <button key={p} onClick={() => setPage(p)} style={{
                        width: 30, height: 30, borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 600,
                        cursor: 'pointer', transition: 'all .15s',
                        background: page === p ? 'linear-gradient(135deg,#185FA5,#3B82F6)' : 'rgba(255,255,255,0.05)',
                        color: page === p ? '#fff' : undefined,
                        boxShadow: page === p ? '0 2px 8px rgba(24,95,165,0.4)' : 'none',
                      }} className={page === p ? '' : 'text-gray-500 dark:text-white/40'}>{p}</button>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button disabled={page<=1} onClick={() => setPage(p=>p-1)} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
                    background: 'none', cursor: page<=1 ? 'not-allowed' : 'pointer',
                    opacity: page<=1 ? .3 : 1, transition: 'all .15s',
                  }} className="text-gray-500 dark:text-white/40">
                    <Ico.ChevLeft />
                  </button>
                  <button disabled={page>=meta.pages} onClick={() => setPage(p=>p+1)} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
                    background: 'none', cursor: page>=meta.pages ? 'not-allowed' : 'pointer',
                    opacity: page>=meta.pages ? .3 : 1, transition: 'all .15s',
                  }} className="text-gray-500 dark:text-white/40">
                    <Ico.ChevRight />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Stats tab ──────────────────────────────────────── */}
      {tab === 'stats' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
          {STAT_CARDS.map(({ key, label, icon, color }) => (
            <div key={key} style={{
              borderRadius: 18, padding: '20px 22px', position: 'relative', overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.07)',
              background: 'linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
              backdropFilter: 'blur(12px)',
              transition: 'transform .2s, box-shadow .2s',
              cursor: 'default',
            }}
              className="bg-white dark:bg-transparent"
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow=`0 12px 30px ${color}22`; }}
              onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='none'; }}
            >
              <div style={{ position: 'absolute', top: -8, right: -8, opacity: .07, color }} className="[&>svg]:w-12 [&>svg]:h-12">{icon}</div>
              <div style={{ marginBottom: 6, color }} className="[&>svg]:w-7 [&>svg]:h-7">{icon}</div>
              <div style={{ fontSize: 28, fontWeight: 900, color, letterSpacing: '-.02em', lineHeight: 1 }}>
                {stats ? (stats[key] ?? 0) : '—'}
              </div>
              <div style={{ fontSize: 11, marginTop: 6, fontWeight: 600, letterSpacing: '.04em' }}
                className="text-gray-500 dark:text-white/35">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Audit tab ──────────────────────────────────────── */}
      {tab === 'audit' && (
        <div style={{
          borderRadius: 20, padding: '60px 24px', textAlign: 'center',
          border: '1px solid rgba(255,255,255,0.07)',
          background: 'linear-gradient(145deg, rgba(255,255,255,0.03) 0%, transparent 100%)',
        }}
          className="bg-white dark:bg-transparent">
          <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}
            className="text-gray-700 dark:text-white/60">Audit log</h3>
          <p style={{ fontSize: 13 }} className="text-gray-400 dark:text-white/30">
            Tizim harakatlari tarixi — tez orada qo'shiladi
          </p>
        </div>
      )}

      {/* Modal */}
      <UserModal open={modal} onClose={() => setModal(false)} editUser={editUser} onSaved={loadUsers} />
    </div>
  );
}
