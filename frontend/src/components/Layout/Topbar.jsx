import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logoutUser, selectUser } from '../../slices/authSlice';
import { toggleTheme, selectTheme, setGlobalSearch } from '../../slices/uiSlice';

const ROLE_LABELS = {
  admin:   'Admin',
  manager: 'Menejer',
  sales:   'Sotuv',
  user:    'Foydalanuvchi',
};

const ROLE_COLORS = {
  admin:   'bg-red-500/20 text-red-400',
  manager: 'bg-purple-500/20 text-purple-400',
  sales:   'bg-blue-500/20 text-blue-400',
  user:    'bg-gray-500/20 text-gray-400',
};

export default function Topbar() {
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const user       = useSelector(selectUser);
  const theme      = useSelector(selectTheme);
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSearch = (e) => {
    const val = e.target.value;
    setSearch(val);
    dispatch(setGlobalSearch(val));
  };

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/auth');
  };

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || 'U';

  return (
    <header className="h-14 bg-white dark:bg-[#1E293B] border-b border-gray-200 dark:border-white/5 flex items-center px-6 gap-4 sticky top-0 z-30">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">⌕</span>
          <input
            type="text"
            value={search}
            onChange={handleSearch}
            placeholder="Qidirish…"
            className="
              w-full pl-8 pr-4 py-2 text-sm rounded-lg
              bg-gray-100 dark:bg-white/5
              text-gray-700 dark:text-white/80
              border border-transparent focus:border-[#185FA5]/50
              outline-none transition-colors
            "
          />
        </div>
      </div>

      <div className="flex items-center gap-3 ml-auto">
        {/* Theme toggle */}
        <button
          onClick={() => dispatch(toggleTheme())}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 dark:text-white/50 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-sm"
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
        >
          {theme === 'dark' ? '☀' : '☾'}
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-[#185FA5] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
              {initials}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-medium text-gray-800 dark:text-white/90 leading-tight max-w-[100px] truncate">
                {user?.name || user?.email?.split('@')[0]}
              </p>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${ROLE_COLORS[user?.role] || ROLE_COLORS.user}`}>
                {ROLE_LABELS[user?.role] || user?.role}
              </span>
            </div>
            <span className="text-gray-400 text-xs">▾</span>
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-44 bg-white dark:bg-[#1E293B] rounded-xl shadow-lg border border-gray-200 dark:border-white/10 py-1 z-20">
                <button
                  onClick={() => { navigate('/settings'); setMenuOpen(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-white/70 hover:bg-gray-50 dark:hover:bg-white/5"
                >
                  Sozlamalar
                </button>
                <hr className="my-1 border-gray-200 dark:border-white/10" />
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                >
                  Chiqish
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
