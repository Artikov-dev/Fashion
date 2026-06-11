import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchContact } from '../slices/contactsSlice';
import Badge  from '../components/UI/Badge';
import Avatar from '../components/UI/Avatar';
import { SkeletonRow } from '../components/UI/Skeleton';

const ACTIVITY_ICONS = { call: '📞', email: '✉', meeting: '🤝', note: '📝', whatsapp: '💬' };

export default function ContactDetail() {
  const { id }     = useParams();
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const { current: contact, loading } = useSelector((s) => s.contacts);

  useEffect(() => { dispatch(fetchContact(id)); }, [dispatch, id]);

  if (loading && !contact) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-gray-200 dark:bg-white/10 rounded animate-pulse" />
        <SkeletonRow /><SkeletonRow /><SkeletonRow />
      </div>
    );
  }
  if (!contact) return null;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back */}
      <button
        onClick={() => navigate('/contacts')}
        className="flex items-center gap-1 text-sm text-gray-400 dark:text-white/30 hover:text-[#185FA5] transition-colors"
      >
        ← Kontaktlar
      </button>

      {/* Profile header */}
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-6 border border-gray-100 dark:border-white/5 shadow-sm">
        <div className="flex flex-wrap items-start gap-5">
          <Avatar name={contact.full_name} size="xl" />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{contact.full_name}</h1>
              <Badge value={contact.status} />
            </div>
            {contact.position && (
              <p className="text-sm text-gray-500 dark:text-white/50 mt-0.5">
                {contact.position}{contact.company ? ` @ ${contact.company}` : ''}
              </p>
            )}
            <div className="flex flex-wrap gap-4 mt-3">
              {contact.email && (
                <a href={`mailto:${contact.email}`} className="text-sm text-[#185FA5] hover:underline">
                  ✉ {contact.email}
                </a>
              )}
              {contact.phone && (
                <a href={`tel:${contact.phone}`} className="text-sm text-[#185FA5] hover:underline">
                  📞 {contact.phone}
                </a>
              )}
              <span className="text-xs text-gray-400 dark:text-white/30 self-center">
                Manba: {contact.source}
              </span>
            </div>
            {contact.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {contact.tags.map((tag) => (
                  <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-[#185FA5]/10 text-[#185FA5] dark:text-blue-400">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-4 text-center">
            {[
              { label: 'Leadlar',     val: contact.leads_count },
              { label: 'Faoliyatlar', val: contact.activities_count },
              { label: 'Vazifalar',   val: contact.tasks_count },
            ].map(({ label, val }) => (
              <div key={label}>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{val}</p>
                <p className="text-xs text-gray-400 dark:text-white/30">{label}</p>
              </div>
            ))}
          </div>
        </div>
        {contact.notes && (
          <p className="mt-4 text-sm text-gray-600 dark:text-white/50 bg-gray-50 dark:bg-white/5 rounded-xl p-3">
            {contact.notes}
          </p>
        )}
      </div>

      {/* Leads */}
      {contact.leads?.length > 0 && (
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-white/5 text-sm font-semibold text-gray-700 dark:text-white/80">
            Leadlar
          </div>
          <div className="divide-y divide-gray-50 dark:divide-white/5">
            {contact.leads.map((l) => (
              <div key={l.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={() => navigate(`/leads/${l.id}`)}>
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/85">{l.title}</p>
                  <p className="text-xs text-gray-400 dark:text-white/30 mt-0.5">
                    {Number(l.value).toLocaleString('uz-UZ')} so'm
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge value={l.priority} />
                  <Badge value={l.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activities */}
      {contact.recent_activities?.length > 0 && (
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-white/5 text-sm font-semibold text-gray-700 dark:text-white/80">
            So'nggi faoliyatlar
          </div>
          <div className="divide-y divide-gray-50 dark:divide-white/5">
            {contact.recent_activities.map((a) => (
              <div key={a.id} className="flex items-start gap-3 px-5 py-3">
                <span className="text-lg flex-shrink-0">{ACTIVITY_ICONS[a.type] || '📋'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-white/80">{a.title}</p>
                  {a.description && (
                    <p className="text-xs text-gray-400 dark:text-white/30 mt-0.5 line-clamp-2">{a.description}</p>
                  )}
                </div>
                <time className="text-[11px] text-gray-400 dark:text-white/25 flex-shrink-0">
                  {new Date(a.activity_date).toLocaleDateString('uz-UZ')}
                </time>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
