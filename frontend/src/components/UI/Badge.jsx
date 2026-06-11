const VARIANTS = {
  // status
  active:      'bg-green-100  text-green-700  dark:bg-green-500/20  dark:text-green-400',
  inactive:    'bg-gray-100   text-gray-600   dark:bg-white/10      dark:text-white/50',
  prospect:    'bg-blue-100   text-blue-700   dark:bg-blue-500/20   dark:text-blue-400',
  open:        'bg-blue-100   text-blue-700   dark:bg-blue-500/20   dark:text-blue-400',
  won:         'bg-green-100  text-green-700  dark:bg-green-500/20  dark:text-green-400',
  lost:        'bg-red-100    text-red-700    dark:bg-red-500/20    dark:text-red-400',
  archived:    'bg-gray-100   text-gray-500   dark:bg-white/5       dark:text-white/40',
  // priority
  low:         'bg-gray-100   text-gray-600   dark:bg-white/10      dark:text-white/50',
  medium:      'bg-amber-100  text-amber-700  dark:bg-amber-500/20  dark:text-amber-400',
  high:        'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400',
  urgent:      'bg-red-100    text-red-700    dark:bg-red-500/20    dark:text-red-400',
  // task status
  todo:        'bg-gray-100   text-gray-600   dark:bg-white/10      dark:text-white/50',
  in_progress: 'bg-blue-100   text-blue-700   dark:bg-blue-500/20   dark:text-blue-400',
  done:        'bg-green-100  text-green-700  dark:bg-green-500/20  dark:text-green-400',
  cancelled:   'bg-gray-100   text-gray-500   dark:bg-white/5       dark:text-white/40',
  // roles
  admin:       'bg-red-100    text-red-700    dark:bg-red-500/20    dark:text-red-400',
  manager:     'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400',
  sales:       'bg-blue-100   text-blue-700   dark:bg-blue-500/20   dark:text-blue-400',
  user:        'bg-gray-100   text-gray-600   dark:bg-white/10      dark:text-white/50',
};

const LABELS = {
  active: 'Faol', inactive: "Nofaol", prospect: "Potentsial",
  open: 'Ochiq', won: 'Yutildi', lost: "Yo'qotildi", archived: 'Arxiv',
  low: 'Past', medium: "O'rta", high: 'Yuqori', urgent: 'Shoshilinch',
  todo: "Bajarilmagan", in_progress: 'Jarayonda', done: 'Bajarildi', cancelled: 'Bekor',
  admin: 'Admin', manager: 'Menejer', sales: 'Sotuv', user: 'Foydalanuvchi',
};

export default function Badge({ value, label, className = '' }) {
  const cls  = VARIANTS[value] || 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-white/50';
  const text = label || LABELS[value] || value;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls} ${className}`}>
      {text}
    </span>
  );
}
