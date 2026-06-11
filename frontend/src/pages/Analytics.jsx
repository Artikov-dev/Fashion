import { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchRevenueTrend, fetchRevenueForecast, fetchLeadsByStage,
  fetchFunnel, fetchTeamPerformance, fetchContactsGrowth,
} from '../slices/analyticsSlice';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

/* ─── CSS keyframes injected once ───────────────────────────────────────── */
const STYLE = `
@keyframes dropBounce {
  0%   { opacity: 0; transform: translateY(-60px); }
  55%  { opacity: 1; transform: translateY(12px);  }
  75%  { transform: translateY(-6px); }
  90%  { transform: translateY(4px);  }
  100% { opacity: 1; transform: translateY(0);    }
}
@keyframes countUp {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0);   }
}
`;

/* inject once */
if (!document.getElementById('analytics-anim')) {
  const s = document.createElement('style');
  s.id = 'analytics-anim';
  s.textContent = STYLE;
  document.head.appendChild(s);
}

/* ─── DropBounce wrapper ─────────────────────────────────────────────────── */
function DropBounce({ delay = 0, children }) {
  const [go, setGo] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setGo(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div
      style={{
        opacity:         go ? 1 : 0,
        animation:       go ? `dropBounce 0.7s cubic-bezier(.36,.07,.19,.97) ${delay}ms both` : 'none',
        animationFillMode: 'both',
      }}
    >
      {children}
    </div>
  );
}

/* ─── Animated counter (sayıyı animasiya bilan ko'rsatadi) ──────────────── */
function AnimCounter({ value, suffix = '', decimals = 0, duration = 1000 }) {
  const [display, setDisplay] = useState(0);
  const start = useRef(null);
  const raf   = useRef(null);

  useEffect(() => {
    if (!value && value !== 0) return;
    const target = Number(value);
    start.current = null;

    const step = (ts) => {
      if (!start.current) start.current = ts;
      const prog = Math.min((ts - start.current) / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - prog, 3);
      setDisplay(+(target * eased).toFixed(decimals));
      if (prog < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [value, duration, decimals]);

  return <>{display.toLocaleString('uz-UZ')}{suffix}</>;
}

/* ─── Hover card ─────────────────────────────────────────────────────────── */
function ChartCard({ title, children, className = '', delay = 0, badge }) {
  const [hov, setHov] = useState(false);
  return (
    <DropBounce delay={delay}>
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          transition: 'transform 0.22s ease, box-shadow 0.22s ease',
          transform:  hov ? 'translateY(-5px)' : 'translateY(0)',
          boxShadow:  hov
            ? '0 12px 36px rgba(24,95,165,0.18)'
            : '0 1px 4px rgba(0,0,0,0.06)',
        }}
        className={`bg-white dark:bg-[#1E293B] rounded-2xl p-5 border border-gray-100 dark:border-white/5 ${className}`}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-white/80">{title}</h2>
          {badge && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#185FA5]/10 text-[#185FA5] font-medium">
              {badge}
            </span>
          )}
        </div>
        {children}
      </div>
    </DropBounce>
  );
}

/* ─── Custom Tooltip ─────────────────────────────────────────────────────── */
function CustomTooltip({ active, payload, label, money = true }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background:   'white',
      border:       '1px solid #e2e8f0',
      borderRadius: 10,
      padding:      '10px 14px',
      boxShadow:    '0 6px 24px rgba(0,0,0,0.12)',
      fontSize:     13,
      minWidth:     140,
    }}
      className="dark:!bg-[#0F172A] dark:!border-white/10 dark:!text-white/85"
    >
      {label && (
        <p style={{ fontWeight: 600, marginBottom: 6, fontSize: 11, opacity: 0.55 }}>{label}</p>
      )}
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color || p.fill, flexShrink: 0 }} />
          <span style={{ opacity: 0.7, fontSize: 12 }}>{p.name}:</span>
          <span style={{ fontWeight: 700, marginLeft: 'auto', paddingLeft: 8 }}>
            {typeof p.value === 'number'
              ? money
                ? p.value.toLocaleString('uz-UZ') + " so'm"
                : p.value.toLocaleString('uz-UZ')
              : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}
const CountTooltip = (props) => <CustomTooltip {...props} money={false} />;

/* ─── Shared recharts animation props ───────────────────────────────────── */
const ANIM = {
  isAnimationActive: true,
  animationBegin:    200,
  animationDuration: 1400,
  animationEasing:   'ease-out',
};

const TICK   = { fontSize: 10, fill: '#9CA3AF' };
const COLORS = ['#185FA5', '#BA7517', '#1D9E75', '#E24B4A', '#8B5CF6'];

function fmtY(v) {
  if (v >= 1e9) return (v / 1e9).toFixed(1) + 'B';
  if (v >= 1e6) return (v / 1e6).toFixed(0) + 'M';
  if (v >= 1e3) return (v / 1e3).toFixed(0) + 'K';
  return v;
}

/* ─── KPI strip above charts ────────────────────────────────────────────── */
function KpiStrip({ data }) {
  const kpis = [
    { label: 'Jami daromad',   value: data?.revenue,          suffix: " so'm", decimals: 0, color: '#1D9E75' },
    { label: 'Konversiya',     value: data?.conversion_rate,  suffix: '%',     decimals: 1, color: '#BA7517' },
    { label: 'Yutilgan bitim', value: data?.won_deals,        suffix: '',      decimals: 0, color: '#185FA5' },
    { label: "O'rtacha bitim", value: data?.avg_deal_size,    suffix: " so'm", decimals: 0, color: '#8B5CF6' },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {kpis.map(({ label, value, suffix, decimals, color }, i) => (
        <DropBounce key={label} delay={i * 100}>
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-4 border border-gray-100 dark:border-white/5 text-center"
            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <p className="text-[11px] text-gray-400 dark:text-white/35 uppercase tracking-wider mb-1">{label}</p>
            <p className="text-xl font-bold" style={{ color }}>
              {value !== undefined && value !== null
                ? <AnimCounter value={value} suffix={suffix} decimals={decimals} duration={1200} />
                : '—'}
            </p>
          </div>
        </DropBounce>
      ))}
    </div>
  );
}

/* ─── MAIN ───────────────────────────────────────────────────────────────── */
export default function Analytics() {
  const dispatch = useDispatch();
  const {
    revenueTrend, revenueForecast, leadsByStage, funnel,
    teamPerformance, contactsGrowth, dashboard,
  } = useSelector((s) => s.analytics);

  const [activePie, setActivePie] = useState(null);

  useEffect(() => {
    dispatch(fetchRevenueTrend());
    dispatch(fetchRevenueForecast());
    dispatch(fetchLeadsByStage());
    dispatch(fetchFunnel());
    dispatch(fetchTeamPerformance());
    dispatch(fetchContactsGrowth());
    /* dashboard is loaded by Dashboard page but we might need it here too */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">

      {/* Header */}
      <DropBounce delay={0}>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Analitika</h1>
          <p className="text-sm text-gray-500 dark:text-white/40 mt-0.5">
            Biznes ko'rsatkichlari va trendlar
          </p>
        </div>
      </DropBounce>

      {/* KPI strip */}
      <KpiStrip data={dashboard} />

      {/* ── Row 1: Area + Bar ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* AreaChart — chapdan o'ngga chiziladi */}
        <ChartCard title="Daromad trendi (12 oy)" delay={100} badge="12 oy">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenueTrend} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#185FA5" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#185FA5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.4} />
              <XAxis dataKey="month" tick={TICK} tickLine={false} axisLine={false} />
              <YAxis tick={TICK} tickLine={false} axisLine={false} tickFormatter={fmtY} width={44} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                name="Daromad"
                stroke="#185FA5"
                strokeWidth={2.5}
                fill="url(#areaGrad)"
                dot={false}
                activeDot={{ r: 7, fill: '#185FA5', stroke: '#fff', strokeWidth: 2.5 }}
                {...ANIM}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* BarChart — pastdan yuqoriga o'sadi */}
        <ChartCard title="Daromad bashorati (3 oy)" delay={200} badge="Bashorat">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenueForecast} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.4} />
              <XAxis dataKey="month" tick={TICK} tickLine={false} axisLine={false} />
              <YAxis tick={TICK} tickLine={false} axisLine={false} tickFormatter={fmtY} width={44} />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="forecast"
                name="Bashorat"
                fill="#1D9E75"
                radius={[7, 7, 0, 0]}
                activeBar={{ fill: '#14845c' }}
                {...ANIM}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── Row 2: Horizontal bar + Pie ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Horizontal BarChart */}
        <ChartCard title="Leadlar bosqich bo'yicha" className="lg:col-span-2" delay={300}>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart
              data={leadsByStage}
              layout="vertical"
              margin={{ top: 4, right: 48, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.4} horizontal={false} />
              <XAxis type="number" tick={TICK} tickLine={false} axisLine={false} />
              <YAxis
                type="category"
                dataKey="stage"
                width={135}
                tick={TICK}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CountTooltip />} />
              <Bar
                dataKey="count"
                name="Lead soni"
                radius={[0, 7, 7, 0]}
                activeBar={{ opacity: 0.75 }}
                label={{ position: 'right', fontSize: 11, fill: '#9CA3AF' }}
                {...ANIM}
              >
                {leadsByStage.map((e, i) => (
                  <Cell key={i} fill={e.color || COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* PieChart — 0°dan 360°ga to'ladi, hover da sektor +8px */}
        <ChartCard title="Lead funnel" delay={400}>
          <ResponsiveContainer width="100%" height={210}>
            <PieChart>
              <Pie
                data={funnel}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="46%"
                innerRadius={32}
                outerRadius={68}
                startAngle={90}
                endAngle={-270}
                paddingAngle={2}
                onMouseEnter={(_, i) => setActivePie(i)}
                onMouseLeave={() => setActivePie(null)}
                {...ANIM}
              >
                {funnel.map((_, i) => (
                  <Cell
                    key={i}
                    fill={COLORS[i % COLORS.length]}
                    outerRadius={activePie === i ? 76 : 68}
                    style={{ cursor: 'pointer', outline: 'none', transition: 'outerRadius 0.2s' }}
                  />
                ))}
              </Pie>
              <Tooltip content={<CountTooltip />} />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── Row 3: LineChart ────────────────────────────────────────────── */}
      <ChartCard title="Kontaktlar o'sishi (12 oy)" delay={500}>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={contactsGrowth} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%"   stopColor="#8B5CF6" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#8B5CF6" stopOpacity={1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.4} />
            <XAxis dataKey="month" tick={TICK} tickLine={false} axisLine={false} />
            <YAxis tick={TICK} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip content={<CountTooltip />} />
            <Line
              type="monotone"
              dataKey="count"
              name="Yangi kontakt"
              stroke="url(#lineGrad)"
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#8B5CF6', strokeWidth: 0 }}
              activeDot={{ r: 7, fill: '#8B5CF6', stroke: '#fff', strokeWidth: 2.5 }}
              {...ANIM}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* ── Team performance table ───────────────────────────────────────── */}
      {teamPerformance.length > 0 && (
        <DropBounce delay={600}>
          <div
            className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden"
            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
          >
            <div className="px-5 py-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-white/80">
                Jamoa samaradorligi
              </h2>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#185FA5]/10 text-[#185FA5] font-medium">
                {teamPerformance.length} xodim
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-semibold text-gray-400 dark:text-white/30 uppercase tracking-wider border-b border-gray-100 dark:border-white/5">
                    <th className="px-5 py-3">#</th>
                    <th className="px-4 py-3">Xodim</th>
                    <th className="px-4 py-3">Rol</th>
                    <th className="px-4 py-3">Yutilgan</th>
                    <th className="px-4 py-3">Daromad</th>
                    <th className="px-4 py-3">Ochiq leadlar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                  {teamPerformance.map((u, i) => (
                    <tr
                      key={u.user_id}
                      className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                      style={{
                        animation: `countUp 0.4s ease ${i * 80 + 700}ms both`,
                      }}
                    >
                      <td className="px-5 py-3 text-xs font-bold text-gray-400 dark:text-white/25">
                        #{i + 1}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-white/85">
                        {u.name}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-white/40 capitalize">
                        {u.role}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-[#1D9E75]">
                        {u.won_deals}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-[#185FA5]">
                        <AnimCounter value={u.revenue} suffix=" so'm" duration={900} />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-white/50">
                        {u.open_leads}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </DropBounce>
      )}
    </div>
  );
}
