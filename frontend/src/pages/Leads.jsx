import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchLeads, fetchStages, deleteLead, updateLeadStatus } from '../slices/leadsSlice';
import { selectGlobalSearch } from '../slices/uiSlice';
import Badge    from '../components/UI/Badge';
import Skeleton from '../components/UI/Skeleton';
import EmptyState from '../components/UI/EmptyState';

function fmt(n) {
  return Number(n || 0).toLocaleString('uz-UZ') + " so'm";
}

export default function Leads() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { items, meta, stages, loading } = useSelector((s) => s.leads);
  const role = useSelector((s) => s.auth.user?.role);
  const globalSearch = useSelector(selectGlobalSearch);

  const [search,   setSearch]   = useState('');
  const [status,   setStatus]   = useState('open');
  const [priority, setPriority] = useState('');
  const [stageId,  setStageId]  = useState('');
  const [page,     setPage]     = useState(1);

  // globalSearch o'zgarganda lokal searchni yangilash
  useEffect(() => {
    setSearch(globalSearch);
    setPage(1);
  }, [globalSearch]);

  const q = search;
  const load = useCallback(() => {
    dispatch(fetchLeads({ q, status, priority, stage_id: stageId || undefined, page, per_page: 20 }));
  }, [dispatch, q, status, priority, stageId, page]);

  useEffect(() => { load(); dispatch(fetchStages()); }, [load]);

  const handleStatus = async (id, newStatus) => {
    const reason = newStatus === 'lost'
      ? window.prompt("Sababi (ixtiyoriy):") ?? undefined
      : undefined;
    await dispatch(updateLeadStatus({ id, status: newStatus, lost_reason: reason }));
    load();
  };

  const handleDelete = (id, title) => {
    if (!window.confirm(`"${title}" leadini o'chirmoqchimisiz?`)) return;
    dispatch(deleteLead(id));
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Leadlar</h1>
          <p className="text-sm text-gray-500 dark:text-white/40 mt-0.5">{meta.total} ta lead</p>
        </div>
        <button
          onClick={() => navigate('/pipeline')}
          className="flex items-center gap-2 px-4 py-2 bg-[#185FA5] text-white text-sm font-medium rounded-xl hover:bg-[#1451A0] transition-colors"
        >
          Kanban ko'rish
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Lead qidirish…"
          className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E293B] text-gray-700 dark:text-white/80 outline-none focus:border-[#185FA5] w-52" />

        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E293B] text-gray-700 dark:text-white/80 outline-none">
          <option value="">Barcha holat</option>
          {['open','won','lost','archived'].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        <select value={priority} onChange={(e) => { setPriority(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E293B] text-gray-700 dark:text-white/80 outline-none">
          <option value="">Barcha muhimlik</option>
          {['low','medium','high','urgent'].map((p) => <option key={p} value={p}>{p}</option>)}
        </select>

        <select value={stageId} onChange={(e) => { setStageId(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E293B] text-gray-700 dark:text-white/80 outline-none">
          <option value="">Barcha bosqich</option>
          {stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden">
        {loading && items.length === 0 ? (
          <Skeleton count={5} />
        ) : items.length === 0 ? (
          <EmptyState icon="◈" title="Lead topilmadi" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-100 dark:border-white/5">
                <tr className="text-left text-xs font-semibold text-gray-400 dark:text-white/30 uppercase tracking-wider">
                  <th className="px-5 py-3">Sarlavha</th>
                  <th className="px-4 py-3 hidden md:table-cell">Kontakt</th>
                  <th className="px-4 py-3">Summa</th>
                  <th className="px-4 py-3 hidden lg:table-cell">Bosqich</th>
                  <th className="px-4 py-3">Muhimlik</th>
                  <th className="px-4 py-3">Holat</th>
                  <th className="px-4 py-3 text-right">Amal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                {items.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3">
                      <p className="text-sm font-medium text-gray-800 dark:text-white/85 cursor-pointer hover:text-[#185FA5] truncate max-w-[180px]"
                        onClick={() => navigate(`/leads/${l.id}`)}>
                        {l.title}
                      </p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-sm text-gray-600 dark:text-white/50 truncate max-w-[130px]">
                      {l.contact?.full_name || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-[#185FA5] dark:text-blue-400 whitespace-nowrap">
                      {fmt(l.value)}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {l.stage ? (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-600 dark:text-white/50">
                          <span className="w-2 h-2 rounded-full inline-block" style={{ background: l.stage.color }} />
                          {l.stage.name}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3"><Badge value={l.priority} /></td>
                    <td className="px-4 py-3"><Badge value={l.status} /></td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {l.status === 'open' && (
                          <>
                            <button onClick={() => handleStatus(l.id, 'won')}
                              className="px-2 py-1 text-[10px] font-medium rounded-lg bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-100 transition-colors">
                              Yutdi
                            </button>
                            <button onClick={() => handleStatus(l.id, 'lost')}
                              className="px-2 py-1 text-[10px] font-medium rounded-lg bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 hover:bg-red-100 transition-colors">
                              Yo'qotdi
                            </button>
                          </>
                        )}
                        {['admin', 'manager'].includes(role) && (
                          <button onClick={() => handleDelete(l.id, l.title)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-xs">
                            ✕
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {meta.pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-white/5">
            <span className="text-xs text-gray-400 dark:text-white/30">
              {meta.total} tadan {(page-1)*meta.per_page+1}–{Math.min(page*meta.per_page, meta.total)}
            </span>
            <div className="flex gap-1">
              <button disabled={page<=1} onClick={() => setPage(page-1)}
                className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-white/10 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">←</button>
              <button disabled={page>=meta.pages} onClick={() => setPage(page+1)}
                className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-white/10 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">→</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
