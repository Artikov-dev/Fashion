import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  fetchContacts, createContact, deleteContact,
} from '../slices/contactsSlice';
import Badge    from '../components/UI/Badge';
import Avatar   from '../components/UI/Avatar';
import Modal    from '../components/UI/Modal';
import Skeleton from '../components/UI/Skeleton';
import EmptyState from '../components/UI/EmptyState';

const SOURCES   = ['Instagram', 'Referral', 'Website', 'Cold call', 'Other'];
const STATUSES  = ['active', 'inactive', 'prospect'];
const EMPTY_FORM = {
  full_name: '', email: '', phone: '', company: '', position: '',
  source: 'Other', status: 'prospect', notes: '', tags: '',
};

export default function Contacts() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { items, meta, loading } = useSelector((s) => s.contacts);
  const role = useSelector((s) => s.auth.user?.role);

  const [search,  setSearch]  = useState('');
  const [status,  setStatus]  = useState('');
  const [page,    setPage]    = useState(1);
  const [modal,   setModal]   = useState(false);
  const [form,    setForm]    = useState(EMPTY_FORM);
  const [saving,  setSaving]  = useState(false);

  const load = useCallback(() => {
    dispatch(fetchContacts({ q: search, status, page, per_page: 20 }));
  }, [dispatch, search, status, page]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = (e) => { setSearch(e.target.value); setPage(1); };
  const up = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    const tags = form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [];
    await dispatch(createContact({ ...form, tags }));
    setSaving(false);
    setModal(false);
    setForm(EMPTY_FORM);
    load();
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`"${name}" kontaktini o'chirmoqchimisiz?`)) return;
    dispatch(deleteContact(id));
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Kontaktlar</h1>
          <p className="text-sm text-gray-500 dark:text-white/40 mt-0.5">
            {meta.total} ta kontakt
          </p>
        </div>
        <button
          onClick={() => setModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#185FA5] text-white text-sm font-medium rounded-xl hover:bg-[#1451A0] transition-colors"
        >
          + Yangi kontakt
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          value={search}
          onChange={handleSearch}
          placeholder="Ism, email, kompaniya…"
          className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E293B] text-gray-700 dark:text-white/80 outline-none focus:border-[#185FA5] w-64"
        />
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E293B] text-gray-700 dark:text-white/80 outline-none"
        >
          <option value="">Barcha holat</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden">
        {loading && items.length === 0 ? (
          <Skeleton count={6} />
        ) : items.length === 0 ? (
          <EmptyState icon="◎" title="Kontakt topilmadi" description="Qidiruv shartlaringizni o'zgartiring yoki yangi kontakt qo'shing." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-100 dark:border-white/5">
                <tr className="text-left text-xs font-semibold text-gray-400 dark:text-white/30 uppercase tracking-wider">
                  <th className="px-5 py-3">Ism</th>
                  <th className="px-4 py-3 hidden md:table-cell">Kompaniya</th>
                  <th className="px-4 py-3 hidden lg:table-cell">Manba</th>
                  <th className="px-4 py-3">Holat</th>
                  <th className="px-4 py-3 hidden sm:table-cell">Sana</th>
                  <th className="px-4 py-3 text-right">Amal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                {items.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/contacts/${c.id}`)}>
                        <Avatar name={c.full_name} size="sm" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 dark:text-white/85 truncate max-w-[140px]">
                            {c.full_name}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-white/30 truncate max-w-[140px]">
                            {c.email || c.phone || '—'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="text-sm text-gray-600 dark:text-white/60 truncate max-w-[150px]">
                        {c.company || '—'}
                        {c.position && <span className="block text-xs text-gray-400 dark:text-white/25">{c.position}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs text-gray-500 dark:text-white/40">{c.source}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge value={c.status} />
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-xs text-gray-400 dark:text-white/25">
                      {new Date(c.created_at).toLocaleDateString('uz-UZ')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate(`/contacts/${c.id}`)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-[#185FA5] hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors text-xs"
                          title="Ko'rish"
                        >
                          ◎
                        </button>
                        {['admin', 'manager'].includes(role) && (
                          <button
                            onClick={() => handleDelete(c.id, c.full_name)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-xs"
                            title="O'chirish"
                          >
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

        {/* Pagination */}
        {meta.pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-white/5">
            <span className="text-xs text-gray-400 dark:text-white/30">
              {meta.total} tadan {(page - 1) * meta.per_page + 1}–{Math.min(page * meta.per_page, meta.total)} ko'rsatilmoqda
            </span>
            <div className="flex gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-white/10 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                ←
              </button>
              <button
                disabled={page >= meta.pages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-white/10 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Yangi kontakt">
        <form onSubmit={handleCreate} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-500 dark:text-white/50 mb-1">To'liq ism *</label>
              <input required value={form.full_name} onChange={up('full_name')}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-800 dark:text-white outline-none focus:border-[#185FA5]"
                placeholder="Ism Familiya" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-white/50 mb-1">Email</label>
              <input type="email" value={form.email} onChange={up('email')}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-800 dark:text-white outline-none focus:border-[#185FA5]"
                placeholder="email@domain.com" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-white/50 mb-1">Telefon</label>
              <input value={form.phone} onChange={up('phone')}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-800 dark:text-white outline-none focus:border-[#185FA5]"
                placeholder="+998 90 000 00 00" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-white/50 mb-1">Kompaniya</label>
              <input value={form.company} onChange={up('company')}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-800 dark:text-white outline-none focus:border-[#185FA5]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-white/50 mb-1">Lavozim</label>
              <input value={form.position} onChange={up('position')}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-800 dark:text-white outline-none focus:border-[#185FA5]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-white/50 mb-1">Manba</label>
              <select value={form.source} onChange={up('source')}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-800 dark:text-white outline-none">
                {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-white/50 mb-1">Holat</label>
              <select value={form.status} onChange={up('status')}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-800 dark:text-white outline-none">
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-500 dark:text-white/50 mb-1">Teglar (vergul bilan)</label>
              <input value={form.tags} onChange={up('tags')}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-800 dark:text-white outline-none focus:border-[#185FA5]"
                placeholder="VIP, Yangi, Korporativ" />
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
