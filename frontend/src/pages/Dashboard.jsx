import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchDashboard, fetchRevenueTrend, fetchLeadsByStage, fetchActivityFeed,
} from '../slices/analyticsSlice';
import KpiCard from '../components/UI/KpiCard';
import { SkeletonCard } from '../components/UI/Skeleton';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import {
  Zap, Trophy, DollarSign, Percent,
  TrendingUp, UserPlus, AlertTriangle, Phone, Mail,
  Handshake, StickyNote, MessageCircle, ClipboardList, Inbox,
} from 'lucide-react';

const KPI_CONFIG = [
  { key: 'total_leads',      title: 'Faol leadlar',      icon: <Zap size={18} strokeWidth={2} />,           color: '#185FA5' },
  { key: 'won_deals',        title: 'Yutilgan bitimlar', icon: <Trophy size={18} strokeWidth={2} />,        color: '#1D9E75' },
  { key: 'revenue',          title: 'Jami daromad',      icon: <DollarSign size={18} strokeWidth={2} />,    color: '#1D9E75', isMoney: true },
  { key: 'conversion_rate',  title: 'Konversiya',        icon: <Percent size={18} strokeWidth={2} />,       color: '#BA7517', suffix: '%' },
  { key: 'avg_deal_size',    title: "O'rtacha bitim",    icon: <TrendingUp size={18} strokeWidth={2} />,    color: '#185FA5', isMoney: true },
  { key: 'new_contacts_mtd', title: 'Yangi kontaktlar',  icon: <UserPlus size={18} strokeWidth={2} />,      color: '#8B5CF6' },
  { key: 'overdue_tasks',    title: "Muddati o'tgan",    icon: <AlertTriangle size={18} strokeWidth={2} />, color: '#E24B4A' },
];

const ACTIVITY_ICONS = {
  call:     <Phone size={14} strokeWidth={2} />,
  email:    <Mail size={14} strokeWidth={2} />,
  meeting:  <Handshake size={14} strokeWidth={2} />,
  note:     <StickyNote size={14} strokeWidth={2} />,
  whatsapp: <MessageCircle size={14} strokeWidth={2} />,
};

function fmt(n) {
  if (n === null || n === undefined) return '—';
  return Number(n).toLocaleString('uz-UZ');
}

function fmtMoney(n) {
  if (n === null || n === undefined) return '—';
  const num = Number(n);
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + ' mlrd so\'m';
  if (num >= 1_000_000)     return (num / 1_000_000).toFixed(1) + ' mln so\'m';
  if (num >= 1_000)         return (num / 1_000).toFixed(0) + ' ming so\'m';
  return num.toLocaleString('uz-UZ') + ' so\'m';
}

function fmtYAxis(v) {
  if (v >= 1_000_000_000) return (v / 1_000_000_000).toFixed(1) + 'B';
  if (v >= 1_000_000)     return (v / 1_000_000).toFixed(0) + 'M';
  if (v >= 1_000)         return (v / 1_000).toFixed(0) + 'K';
  return v;
}

export default function Dashboard() {
  const dispatch = useDispatch();
  const { dashboard, revenueTrend, leadsByStage, activityFeed } =
    useSelector((s) => s.analytics);
  const user = useSelector((s) => s.auth.user);

  useEffect(() => {
    dispatch(fetchDashboard());
    dispatch(fetchRevenueTrend());
    dispatch(fetchLeadsByStage());
    dispatch(fetchActivityFeed());
  }, [dispatch]);

  const kpiLoading = dashboard === null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          Salom, {user?.name?.split(' ')[0] || 'Foydalanuvchi'}
        </h1>
        <p className="text-sm text-gray-500 dark:text-white/40 mt-0.5">
          {new Date().toLocaleDateString('uz-UZ', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
          })}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {kpiLoading
          ? Array.from({ length: 7 }).map((_, i) => <SkeletonCard key={i} />)
          : KPI_CONFIG.map(({ key, title, icon, color, isMoney, suffix }) => {
              const raw = dashboard?.[key];
              let display = raw ?? '—';
              if (raw !== null && raw !== undefined) {
                if (isMoney)       display = fmtMoney(raw);
                else if (suffix)   display = raw + suffix;
                else               display = raw;
              }
              return (
                <KpiCard
                  key={key}
                  title={title}
                  value={display}
                  icon={icon}
                  color={color}
                />
              );
            })
        }
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Trend */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1E293B] rounded-2xl p-5 border border-gray-100 dark:border-white/5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-white/80 mb-4">
            Daromad trendi (12 oy)
          </h2>
          {revenueTrend.length === 0 ? (
            <div className="flex items-center justify-center h-[200px]">
              <div className="h-4 w-4 border-2 border-[#185FA5] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={revenueTrend} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#185FA5" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#185FA5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.5} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10, fill: '#9CA3AF' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#9CA3AF' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={fmtYAxis}
                  width={48}
                />
                <Tooltip
                  formatter={(v) => [fmtMoney(v), 'Daromad']}
                  contentStyle={{
                    background: '#1E293B',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 12,
                    color: '#fff',
                  }}
                  labelStyle={{ color: '#94A3B8' }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#185FA5"
                  strokeWidth={2}
                  fill="url(#revGrad)"
                  dot={false}
                  activeDot={{ r: 4, fill: '#185FA5' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Leads by stage pie */}
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-5 border border-gray-100 dark:border-white/5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-white/80 mb-4">
            Leadlar bosqich bo'yicha
          </h2>
          {leadsByStage.length === 0 ? (
            <div className="flex items-center justify-center h-[200px]">
              <div className="h-4 w-4 border-2 border-[#185FA5] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie
                    data={leadsByStage}
                    dataKey="count"
                    nameKey="stage"
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    innerRadius={30}
                    strokeWidth={0}
                  >
                    {leadsByStage.map((entry, i) => (
                      <Cell key={i} fill={entry.color || '#185FA5'} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v, n) => [v + ' ta', n]}
                    contentStyle={{
                      background: '#1E293B',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 12,
                      color: '#fff',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {leadsByStage.map((s) => (
                  <div key={s.stage} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: s.color }}
                      />
                      <span className="text-gray-600 dark:text-white/50 truncate max-w-[120px]">
                        {s.stage}
                      </span>
                    </div>
                    <span className="font-semibold text-gray-800 dark:text-white/70 ml-2 flex-shrink-0">
                      {s.count}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom Row: Stats + Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Quick stats */}
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-white/5">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-white/80">
              Tezkor ma'lumotlar
            </h2>
          </div>
          {kpiLoading ? (
            <div className="p-5 space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-100 dark:bg-white/5 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-white/5">
              {[
                { label: 'Jami daromad',       value: fmtMoney(dashboard?.revenue),          color: 'text-[#1D9E75]' },
                { label: "O'rtacha bitim",      value: fmtMoney(dashboard?.avg_deal_size),    color: 'text-[#185FA5]' },
                { label: 'Konversiya darajasi', value: (dashboard?.conversion_rate ?? 0) + '%', color: 'text-[#BA7517]' },
                { label: "Muddati o'tgan",      value: dashboard?.overdue_tasks ?? 0,         color: 'text-[#E24B4A]' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between px-5 py-3">
                  <span className="text-xs text-gray-500 dark:text-white/40">{label}</span>
                  <span className={`text-sm font-semibold ${color}`}>{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activity Feed */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-white/80">
              So'nggi faoliyatlar
            </h2>
            <span className="text-xs text-gray-400 dark:text-white/25">
              {activityFeed.length > 0 ? `${activityFeed.length} ta` : ''}
            </span>
          </div>
          {activityFeed.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="flex justify-center mb-2 text-gray-300 dark:text-white/20"><ClipboardList size={36} strokeWidth={1.5} /></div>
                <p className="text-sm text-gray-400 dark:text-white/30">Faoliyat yo'q</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-white/5 max-h-[280px] overflow-y-auto">
              {activityFeed.slice(0, 8).map((act) => (
                <div key={act.id} className="flex items-start gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                  <span className="text-base flex-shrink-0 mt-0.5 text-gray-500 dark:text-white/40">
                    {ACTIVITY_ICONS[act.type] || <ClipboardList size={14} strokeWidth={2} />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-white/80 truncate">
                      {act.title}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-white/30 mt-0.5 truncate">
                      {act.contact?.full_name || '—'}
                      {act.creator?.name ? ` • ${act.creator.name}` : ''}
                    </p>
                  </div>
                  <time className="text-[11px] text-gray-400 dark:text-white/25 flex-shrink-0 mt-0.5">
                    {new Date(act.activity_date).toLocaleDateString('uz-UZ', {
                      month: 'short', day: 'numeric',
                    })}
                  </time>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
