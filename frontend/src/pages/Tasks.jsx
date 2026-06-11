import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchTasks, fetchMyTasks, fetchOverdueTasks,
  createTask, updateTaskStatus, deleteTask,
} from '../slices/tasksSlice';
import { fetchContacts } from '../slices/contactsSlice';
import Badge    from '../components/UI/Badge';
import Modal    from '../components/UI/Modal';
import Skeleton from '../components/UI/Skeleton';
import EmptyState from '../components/UI/EmptyState';

const EMPTY_FORM = {
  title: '', description: '', due_date: '', priority: 'medium',
  status: 'todo', contact_id: '', lead_id: '',
};

const STATUS_TABS = [
  { key: '',           label: 'Hammasi' },
  { key: 'todo',       label: "Bajarilmagan" },
  { key: 'in_progress',label: 'Jarayonda' },
  { key: 'done',       label: 'Bajarildi' },
];

export default function Tasks() {
  const dispatch = useDispatch();
  const { items, myTasks, overdue, meta, loading } = useSelector((s) => s.tasks);
  const { items: contacts } = useSelector((s) => s.contacts);

  const [tab,    setTab]    = useState('');
  const [view,   setView]   = useState('all'); // all | my | overdue
  const [page,   setPage]   = useState(1);
  const [modal,  setModal]  = useState(false);
  const [form,   setForm]   = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    if (view === 'all')     dispatch(fetchTasks({ status: tab, page, per_page: 20 }));
    if (view === 'my')      dispatch(fetchMyTasks());
    if (view === 'overdue') dispatch(fetchOverdueTasks());
  }, [dispatch, tab, page, view]);

  useEffect(() => { load(); dispatch(fetchContacts({ per_page: 100 })); }, [load]);

  const up = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    await dispatch(createTask({
      ...form,
      contact_id: form.contact_id ? Number(form.contact_id) : undefined,
      lead_id:    form.lead_id    ? Number(form.lead_id)    : undefined,
      due_date:   form.due_date   || undefined,
    }));
    setSaving(false);
    setModal(false);
    setForm(EMPTY_FORM);
    load();
  };

  const handleStatusChange = (id, status) => dispatch(updateTaskStatus({ id, status }));

  const handleDelete = (id, title) => {
    if (!window.confirm(`"${title}" vazifasini o'chirmoqchimisiz?`)) return;
    dispatch(deleteTask(id));
  };

  const displayItems = view === 'my' ? myTasks : view === 'overdue' ? overdue : items;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Vazifalar</h1>
          <p className="text-sm text-gray-500 dark:text-white/40 mt-0.5">
            {overdue.length > 0 && <span className="text-red-500 font-medium">{overdue.length} muddati o'tgan • </span>}
            {meta.total} ta vazifa
          </p>
        </div>
        <button
          onClick={() => setModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#185FA5] text-white text-sm font-medium rounded-xl hover:bg-[#1451A0] transition-colors"
        >
          + Yangi vazifa
        </button>
      </div>

      {/* View tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'all',     label: 'Hammasi' },
          { key: 'my',      label: 'Mening vazifalarim' },
          { key: 'overdue', label: "Muddati o'tgan" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => { setView(key); setPage(1); }}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              view === key
                ? 'bg-[#185FA5] text-white'
                : 'bg-white dark:bg-[#1E293B] text-gray-600 dark:text-white/50 border border-gray-200 dark:border-white/10 hover:border-[#185FA5]/50'
            }`}
          >
            {label}
            {key === 'overdue' && overdue.length > 0 && (
              <span className="ml-1 px-1 py-0.5 bg-red-500 text-white rounded-full text-[9px]">
                {overdue.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Status filter tabs */}
      {view === 'all' && (
        <div className="flex gap-1 border-b border-gray-200 dark:border-white/10">
          {STATUS_TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => { setTab(key); setPage(1); }}
              className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
                tab === key
                  ? 'border-[#185FA5] text-[#185FA5]'
                  : 'border-transparent text-gray-400 dark:text-white/30 hover:text-gray-600 dark:hover:text-white/50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Tasks list */}
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden">
        {loading && displayItems.length === 0 ? (
          <Skeleton count={5} />
        ) : displayItems.length === 0 ? (
          <EmptyState icon="☑" title="Vazifa topilmadi" />
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-white/5">
            {displayItems.map((t) => (
              <div key={t.id} className={`flex items-start gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors ${t.is_overdue ? 'bg-red-50/50 dark:bg-red-500/5' : ''}`}>
                {/* Status toggle */}
                <button
                  onClick={() => handleStatusChange(t.id, t.status === 'done' ? 'todo' : 'done')}
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                    t.status === 'done'
                      ? 'bg-[#1D9E75] border-[#1D9E75] text-white'
                      : 'border-gray-300 dark:border-white/20 hover:border-[#185FA5]'
                  }`}
                >
                  {t.status === 'done' && <span className="text-[10px]">✓</span>}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className={`text-sm font-medium ${t.status === 'done' ? 'line-through text-gray-400 dark:text-white/30' : 'text-gray-800 dark:text-white/85'}`}>
                      {t.title}
                    </p>
                    {t.is_overdue && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-full font-medium">
                        Muddati o'tdi
                      </span>
                    )}
                  </div>
                  {t.description && (
                    <p className="text-xs text-gray-400 dark:text-white/30 mt-0.5 line-clamp-1">{t.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 mt-1">
                    {t.contact && (
                      <span className="text-xs text-gray-400 dark:text-white/30">◎ {t.contact.full_name}</span>
                    )}
                    {t.due_date && (
                      <span className={`text-xs ${t.is_overdue ? 'text-red-500' : 'text-gray-400 dark:text-white/30'}`}>
                        📅 {new Date(t.due_date).toLocaleDateString('uz-UZ')}
                      </span>
                    )}
                    {t.assignee && (
                      <span className="text-xs text-gray-400 dark:text-white/30">
                        👤 {t.assignee.name || t.assignee.email}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge value={t.priority} />
                  <select
                    value={t.status}
                    onChange={(e) => handleStatusChange(t.id, e.target.value)}
                    className="text-xs px-2 py-1 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0F172A] text-gray-600 dark:text-white/60 outline-none"
                  >
                    {['todo','in_progress','done','cancelled'].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleDelete(t.id, t.title)}
                    className="p-1.5 rounded-lg text-gray-300 dark:text-white/20 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-xs"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {view === 'all' && meta.pages > 1 && (
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

      {/* Create Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Yangi vazifa">
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-white/50 mb-1">Sarlavha *</label>
            <input required value={form.title} onChange={up('title')}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-800 dark:text-white outline-none focus:border-[#185FA5]"
              placeholder="Vazifa sarlavhasi" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-white/50 mb-1">Tavsif</label>
            <textarea rows={2} value={form.description} onChange={up('description')}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-800 dark:text-white outline-none focus:border-[#185FA5] resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-white/50 mb-1">Muddat</label>
              <input type="datetime-local" value={form.due_date} onChange={up('due_date')}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-800 dark:text-white outline-none focus:border-[#185FA5]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-white/50 mb-1">Muhimlik</label>
              <select value={form.priority} onChange={up('priority')}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-800 dark:text-white outline-none">
                {['low','medium','high','urgent'].map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-500 dark:text-white/50 mb-1">Kontakt</label>
              <select value={form.contact_id} onChange={up('contact_id')}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-800 dark:text-white outline-none">
                <option value="">Kontakt tanlang</option>
                {contacts.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModal(false)}
              className="flex-1 py-2 text-sm font-medium rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/60 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
              Bekor
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2 text-sm font-medium rounded-xl bg-[#185FA5] text-white hover:bg-[#1451A0] disabled:opacity-50 transition-colors">
              {saving ? 'Saqlanmoqda…' : 'Yaratish'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
