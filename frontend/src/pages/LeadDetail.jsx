import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchLead, clearCurrent, updateLeadStatus } from '../slices/leadsSlice';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar, Legend,
} from 'recharts';

/* ─── helpers ─────────────────────────────────────────────── */
function fmt(n) {
  const v = Number(n || 0);
  if (v >= 1_000_000_000) return (v / 1_000_000_000).toFixed(1) + " mlrd so'm";
  if (v >= 1_000_000)     return (v / 1_000_000).toFixed(1)     + " mln so'm";
  return v.toLocaleString('uz-UZ') + " so'm";
}
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('uz-UZ', { day: '2-digit', month: 'short', year: 'numeric' });
}
function daysLeft(d) {
  if (!d) return null;
  const diff = Math.ceil((new Date(d) - Date.now()) / 86400000);
  return diff;
}

const PRIORITY_META = {
  low:    { label: 'Past',      color: '#64748B', bg: '#F1F5F9', dark: '#64748B' },
  medium: { label: "O'rta",    color: '#F59E0B', bg: '#FFFBEB', dark: '#F59E0B' },
  high:   { label: 'Yuqori',   color: '#EF4444', bg: '#FEF2F2', dark: '#EF4444' },
  urgent: { label: 'Shoshilinch', color: '#8B5CF6', bg: '#F5F3FF', dark: '#8B5CF6' },
};
const STATUS_META = {
  open:     { label: 'Ochiq',      color: '#185FA5', bg: '#EFF6FF' },
  won:      { label: 'Yutildi',    color: '#10B981', bg: '#ECFDF5' },
  lost:     { label: "Yo'qotildi", color: '#EF4444', bg: '#FEF2F2' },
  archived: { label: 'Arxivlandi', color: '#6B7280', bg: '#F9FAFB' },
};

const ACT_ICONS = { call: '📞', email: '✉️', meeting: '🤝', note: '📝', whatsapp: '💬' };

/* ─── Custom Pie Tooltip ──────────────────────────────────── */
function PieTooltipContent({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div style={{
      background: 'rgba(15,23,42,0.92)', backdropFilter: 'blur(8px)',
      border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
      padding: '10px 14px', color: '#fff', fontSize: 13,
      boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
    }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{d.name}</div>
      <div style={{ color: d.payload.fill, fontWeight: 600 }}>{d.value} ta</div>
      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 2 }}>
        {d.payload.percent}%
      </div>
    </div>
  );
}

/* ─── Animated Pie with hover expand ─────────────────────── */
function StatsDonut({ tasks = [], activities = [] }) {
  const [activePie, setActivePie] = useState(null);

  const taskStats = [
    { name: 'Bajarildi',    value: tasks.filter(t => t.status === 'done').length,        fill: '#10B981' },
    { name: "Jarayonda",    value: tasks.filter(t => t.status === 'in_progress').length,  fill: '#185FA5' },
    { name: "Rejalashtirilgan", value: tasks.filter(t => t.status === 'todo').length,    fill: '#F59E0B' },
    { name: 'Bekor qilindi', value: tasks.filter(t => t.status === 'cancelled').length,  fill: '#EF4444' },
  ].filter(d => d.value > 0);

  const total = taskStats.reduce((s, d) => s + d.value, 0);
  const withPercent = taskStats.map(d => ({ ...d, percent: total ? Math.round(d.value / total * 100) : 0 }));

  const actStats = [
    { name: "Qo'ng'iroq", value: activities.filter(a => a.type === 'call').length,    fill: '#185FA5' },
    { name: 'Email',       value: activities.filter(a => a.type === 'email').length,   fill: '#8B5CF6' },
    { name: 'Uchrashuv',  value: activities.filter(a => a.type === 'meeting').length,  fill: '#10B981' },
    { name: 'Izoh',        value: activities.filter(a => a.type === 'note').length,    fill: '#F59E0B' },
    { name: 'WhatsApp',   value: activities.filter(a => a.type === 'whatsapp').length, fill: '#EC4899' },
  ].filter(d => d.value > 0);

  if (!tasks.length && !activities.length) return null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      {/* Tasks Donut */}
      <div style={cardStyle}>
        <p style={labelStyle}>Vazifalar holati</p>
        {withPercent.length === 0 ? (
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>Vazifa yo'q</p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={withPercent}
                  cx="50%" cy="50%"
                  innerRadius={52} outerRadius={72}
                  paddingAngle={3}
                  dataKey="value"
                  isAnimationActive animationBegin={100} animationDuration={1200} animationEasing="ease-out"
                  onMouseEnter={(_, i) => setActivePie(i)}
                  onMouseLeave={() => setActivePie(null)}
                >
                  {withPercent.map((d, i) => (
                    <Cell
                      key={i} fill={d.fill}
                      outerRadius={activePie === i ? 80 : 72}
                      style={{ cursor: 'pointer', filter: activePie === i ? `drop-shadow(0 0 8px ${d.fill})` : 'none', transition: 'all .25s' }}
                    />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltipContent />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 12px', justifyContent: 'center' }}>
              {withPercent.map((d, i) => (
                <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.fill, display: 'inline-block' }} />
                  {d.name} ({d.value})
                </span>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Activity Types Donut */}
      <div style={cardStyle}>
        <p style={labelStyle}>Aktivlik turlari</p>
        {actStats.length === 0 ? (
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>Aktivlik yo'q</p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={actStats}
                  cx="50%" cy="50%"
                  innerRadius={52} outerRadius={72}
                  paddingAngle={3}
                  dataKey="value"
                  isAnimationActive animationBegin={200} animationDuration={1200} animationEasing="ease-out"
                  onMouseEnter={(_, i) => setActivePie(100 + i)}
                  onMouseLeave={() => setActivePie(null)}
                >
                  {actStats.map((d, i) => (
                    <Cell
                      key={i} fill={d.fill}
                      outerRadius={activePie === 100 + i ? 80 : 72}
                      style={{ cursor: 'pointer', filter: activePie === 100 + i ? `drop-shadow(0 0 8px ${d.fill})` : 'none', transition: 'all .25s' }}
                    />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltipContent />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 12px', justifyContent: 'center' }}>
              {actStats.map((d, i) => (
                <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.fill, display: 'inline-block' }} />
                  {d.name} ({d.value})
                </span>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Progress bar ────────────────────────────────────────── */
function ProgressBar({ value = 0, color = '#185FA5', label }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{label}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color }}>{value}%</span>
      </div>
      <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 99, background: color,
          width: `${value}%`, transition: 'width 1.2s ease-out',
          boxShadow: `0 0 8px ${color}66`,
        }} />
      </div>
    </div>
  );
}

/* ─── Card styles ─────────────────────────────────────────── */
const cardStyle = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16, padding: '18px 20px',
};
const labelStyle = {
  fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
  textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)',
  marginBottom: 14,
};

/* ─── Main page ───────────────────────────────────────────── */
export default function LeadDetail() {
  const { id }   = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { current: lead, loading } = useSelector(s => s.leads);
  const role = useSelector(s => s.auth.user?.role);

  useEffect(() => {
    dispatch(fetchLead(id));
    return () => dispatch(clearCurrent());
  }, [dispatch, id]);

  const handleStatus = async (newStatus) => {
    const reason = newStatus === 'lost'
      ? window.prompt('Sababi (ixtiyoriy):') ?? undefined : undefined;
    await dispatch(updateLeadStatus({ id: lead.id, status: newStatus, lost_reason: reason }));
    dispatch(fetchLead(id));
  };

  if (loading || !lead) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 320 }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          border: '3px solid #185FA5', borderTopColor: 'transparent',
          animation: 'spin .8s linear infinite',
        }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  const pm = PRIORITY_META[lead.priority] || PRIORITY_META.medium;
  const sm = STATUS_META[lead.status]     || STATUS_META.open;
  const tasks      = lead.tasks      || [];
  const activities = lead.activities || [];
  const days = daysLeft(lead.expected_close_date);

  const doneTasks     = tasks.filter(t => t.status === 'done').length;
  const taskProgress  = tasks.length ? Math.round(doneTasks / tasks.length * 100) : 0;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 60%, #0F172A 100%)',
      color: '#fff', padding: '0 0 48px',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>

      {/* ── Top hero bar ─────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1a2744 50%, #185FA5 100%)',
        padding: '28px 32px 60px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* decorative blobs */}
        <div style={{
          position: 'absolute', top: -40, right: -40, width: 200, height: 200,
          borderRadius: '50%', background: 'rgba(24,95,165,0.25)', filter: 'blur(60px)',
        }} />
        <div style={{
          position: 'absolute', bottom: -20, left: '40%', width: 140, height: 140,
          borderRadius: '50%', background: 'rgba(139,92,246,0.15)', filter: 'blur(50px)',
        }} />

        {/* Back button */}
        <button onClick={() => navigate('/leads')} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 10, padding: '7px 14px', color: 'rgba(255,255,255,0.7)',
          fontSize: 13, cursor: 'pointer', marginBottom: 24,
          transition: 'all .2s', backdropFilter: 'blur(8px)',
        }}
          onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.14)'}
          onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.08)'}
        >
          ← Leadlar
        </button>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            {/* badges row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
              <span style={{
                padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700,
                background: sm.bg + '22', color: sm.color,
                border: `1px solid ${sm.color}44`, letterSpacing: '.05em',
              }}>{sm.label}</span>
              <span style={{
                padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700,
                background: pm.bg + '22', color: pm.color,
                border: `1px solid ${pm.color}44`, letterSpacing: '.05em',
              }}>{pm.label}</span>
              {lead.stage && (
                <span style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                  background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.65)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: lead.stage.color }} />
                  {lead.stage.name}
                </span>
              )}
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.25, marginBottom: 8, letterSpacing: '-.02em' }}>
              {lead.title}
            </h1>
            {lead.contact && (
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
                👤 {lead.contact.full_name}
                {lead.contact.company && <span style={{ marginLeft: 8, color: 'rgba(255,255,255,0.3)' }}>· {lead.contact.company}</span>}
              </p>
            )}
          </div>

          {/* Value big display */}
          <div style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 20, padding: '20px 28px', textAlign: 'center', backdropFilter: 'blur(12px)',
          }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 6 }}>Summa</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#38BDF8', letterSpacing: '-.02em' }}>
              {fmt(lead.value)}
            </div>
            {lead.currency && (
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>{lead.currency}</div>
            )}
          </div>
        </div>
      </div>

      {/* ── Content pulled up ────────────────────────────── */}
      <div style={{ maxWidth: 1100, margin: '-32px auto 0', padding: '0 24px', position: 'relative', zIndex: 2 }}>

        {/* ── KPI row ──────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
          {[
            {
              icon: '📅', label: 'Yaratildi', val: fmtDate(lead.created_at),
              sub: null, color: '#38BDF8',
            },
            {
              icon: '🎯', label: 'Yopilish sanasi',
              val: fmtDate(lead.expected_close_date),
              sub: days !== null ? (days < 0 ? `${Math.abs(days)} kun o'tdi` : days === 0 ? 'Bugun!' : `${days} kun qoldi`) : null,
              color: days !== null && days < 3 ? '#EF4444' : '#10B981',
            },
            {
              icon: '✅', label: 'Vazifalar',
              val: `${doneTasks}/${tasks.length}`,
              sub: tasks.length ? `${taskProgress}% bajarildi` : 'Vazifa yo\'q',
              color: '#F59E0B',
            },
            {
              icon: '⚡', label: 'Aktivliklar',
              val: activities.length,
              sub: activities.length ? `So'nggi: ${fmtDate(activities[0]?.activity_date)}` : "Faoliyat yo'q",
              color: '#8B5CF6',
            },
          ].map((k, i) => (
            <div key={i} style={{ ...cardStyle, position: 'relative', overflow: 'hidden' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = `${k.color}44`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
            >
              <div style={{ position: 'absolute', top: -10, right: -10, fontSize: 40, opacity: .07 }}>{k.icon}</div>
              <div style={{ fontSize: 20, marginBottom: 6 }}>{k.icon}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.07em' }}>{k.label}</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: k.color }}>{k.val}</div>
              {k.sub && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>{k.sub}</div>}
            </div>
          ))}
        </div>

        {/* ── Main grid ────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>

          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Pie charts */}
            <StatsDonut tasks={tasks} activities={activities} />

            {/* Progress section */}
            {tasks.length > 0 && (
              <div style={cardStyle}>
                <p style={labelStyle}>Bajarilish darajasi</p>
                <ProgressBar value={taskProgress} color="#10B981" label="Vazifalar bajarildi" />
                <ProgressBar
                  value={activities.length ? Math.min(100, activities.length * 10) : 0}
                  color="#185FA5" label="Faollik darajasi"
                />
                <ProgressBar
                  value={lead.status === 'won' ? 100 : lead.status === 'lost' ? 0 : taskProgress}
                  color="#8B5CF6" label="Umumiy progress"
                />
              </div>
            )}

            {/* Activities feed */}
            <div style={cardStyle}>
              <p style={labelStyle}>Aktivliklar tarixi ({activities.length})</p>
              {activities.length === 0 ? (
                <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
                  Hozircha aktivlik yo'q
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {activities.map((a, i) => (
                    <div key={a.id} style={{
                      display: 'flex', gap: 12, padding: '12px 0',
                      borderBottom: i < activities.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                    }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                      }}>
                        {ACT_ICONS[a.type] || '📌'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)', marginBottom: 2 }}>
                          {a.title}
                        </div>
                        {a.description && (
                          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {a.description}
                          </div>
                        )}
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)' }}>
                          {fmtDate(a.activity_date)}
                          {a.duration_minutes && <span style={{ marginLeft: 8 }}>· {a.duration_minutes} daqiqa</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Info card */}
            <div style={cardStyle}>
              <p style={labelStyle}>Lead ma'lumotlari</p>
              {[
                { label: 'ID', val: `#${lead.id}` },
                { label: 'Holat', val: sm.label, color: sm.color },
                { label: 'Muhimlik', val: pm.label, color: pm.color },
                { label: 'Bosqich', val: lead.stage?.name || '—' },
                { label: 'Valyuta', val: lead.currency || 'UZS' },
                { label: 'Mas\'ul', val: lead.assignee?.name || '—' },
              ].map((row, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: i < 5 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{row.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: row.color || 'rgba(255,255,255,0.75)' }}>{row.val}</span>
                </div>
              ))}
            </div>

            {/* Contact card */}
            {lead.contact && (
              <div style={cardStyle}>
                <p style={labelStyle}>Kontakt</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, #185FA5, #8B5CF6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, fontWeight: 700, color: '#fff',
                  }}>
                    {lead.contact.full_name?.[0] || '?'}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{lead.contact.full_name}</div>
                    {lead.contact.company && (
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{lead.contact.company}</div>
                    )}
                  </div>
                </div>
                {[
                  { icon: '📞', val: lead.contact.phone },
                  { icon: '✉️', val: lead.contact.email },
                  { icon: '💼', val: lead.contact.position },
                ].filter(r => r.val).map((r, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>
                    <span style={{ fontSize: 14 }}>{r.icon}</span> {r.val}
                  </div>
                ))}
              </div>
            )}

            {/* Tasks list */}
            <div style={cardStyle}>
              <p style={labelStyle}>Vazifalar ({tasks.length})</p>
              {tasks.length === 0 ? (
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', textAlign: 'center', padding: '12px 0' }}>
                  Vazifa yo'q
                </p>
              ) : (
                tasks.map((t, i) => {
                  const statusColors = { done: '#10B981', in_progress: '#185FA5', todo: '#F59E0B', cancelled: '#6B7280' };
                  const statusLabel  = { done: '✓', in_progress: '◐', todo: '○', cancelled: '✕' };
                  return (
                    <div key={t.id} style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0',
                      borderBottom: i < tasks.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                    }}>
                      <span style={{
                        fontSize: 14, fontWeight: 700, color: statusColors[t.status] || '#888',
                        flexShrink: 0, marginTop: 1,
                      }}>{statusLabel[t.status] || '○'}</span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{
                          fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.75)',
                          textDecoration: t.status === 'done' ? 'line-through' : 'none',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>{t.title}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
                          {fmtDate(t.due_date)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Actions */}
            {lead.status === 'open' && (
              <div style={cardStyle}>
                <p style={labelStyle}>Amallar</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button onClick={() => handleStatus('won')} style={{
                    width: '100%', padding: '10px', borderRadius: 10, border: 'none',
                    background: 'linear-gradient(135deg, #10B981, #059669)',
                    color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    transition: 'opacity .2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '.85'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                  >
                    🏆 Yutildi deb belgilash
                  </button>
                  <button onClick={() => handleStatus('lost')} style={{
                    width: '100%', padding: '10px', borderRadius: 10, border: 'none',
                    background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                    color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    transition: 'opacity .2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '.85'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                  >
                    ✕ Yo'qotildi deb belgilash
                  </button>
                </div>
              </div>
            )}

            {/* Won/Lost result */}
            {(lead.status === 'won' || lead.status === 'lost') && (
              <div style={{
                ...cardStyle,
                borderColor: lead.status === 'won' ? '#10B98144' : '#EF444444',
                background: lead.status === 'won' ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
              }}>
                <div style={{ textAlign: 'center', padding: '8px 0' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>{lead.status === 'won' ? '🏆' : '😔'}</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: lead.status === 'won' ? '#10B981' : '#EF4444' }}>
                    {lead.status === 'won' ? 'Yutildi!' : "Yo'qotildi"}
                  </div>
                  {lead.lost_reason && (
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>
                      Sababi: {lead.lost_reason}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
