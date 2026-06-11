import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectTheme, toggleTheme } from '../slices/uiSlice';
import { fetchMe, setUser } from '../slices/authSlice';
import api from '../utils/api';

export default function Settings() {
  const dispatch = useDispatch();
  const theme    = useSelector(selectTheme);
  const user     = useSelector((s) => s.auth.user);

  const [profile, setProfile] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [passwords, setPasswords] = useState({ current_password: '', new_password: '', confirm: '' });
  const [pSaving, setPSaving]   = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pMsg,   setPMsg]   = useState('');
  const [pwMsg,  setPwMsg]  = useState('');
  const [pErr,   setPErr]   = useState('');
  const [pwErr,  setPwErr]  = useState('');

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setPSaving(true); setPErr(''); setPMsg('');
    try {
      const res = await api.put('/auth/me', { name: profile.name, phone: profile.phone });
      dispatch(setUser(res.data.data));
      setPMsg('Profil yangilandi!');
    } catch (err) {
      setPErr(err.response?.data?.message || 'Xato');
    }
    setPSaving(false);
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    setPwSaving(true); setPwErr(''); setPwMsg('');
    if (passwords.new_password !== passwords.confirm) {
      setPwErr('Yangi parollar mos kelmadi'); setPwSaving(false); return;
    }
    try {
      await api.put('/auth/change-password', {
        current_password: passwords.current_password,
        new_password:     passwords.new_password,
      });
      setPwMsg('Parol muvaffaqiyatli yangilandi!');
      setPasswords({ current_password: '', new_password: '', confirm: '' });
    } catch (err) {
      setPwErr(err.response?.data?.message || 'Xato');
    }
    setPwSaving(false);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white">Sozlamalar</h1>

      {/* Profile */}
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-white/80">Profil ma'lumotlari</h2>
        </div>
        <form onSubmit={handleProfileSave} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-white/50 mb-1">To'liq ism</label>
              <input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-800 dark:text-white outline-none focus:border-[#185FA5]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-white/50 mb-1">Telefon</label>
              <input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-800 dark:text-white outline-none focus:border-[#185FA5]" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-white/50 mb-1">Email (o'zgartirib bo'lmaydi)</label>
            <input value={user?.email || ''} disabled
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/[0.02] text-gray-400 dark:text-white/25 cursor-not-allowed" />
          </div>
          {pMsg && <p className="text-xs text-green-600 dark:text-green-400">{pMsg}</p>}
          {pErr && <p className="text-xs text-red-500">{pErr}</p>}
          <button type="submit" disabled={pSaving}
            className="px-5 py-2 bg-[#185FA5] text-white text-sm font-medium rounded-xl hover:bg-[#1451A0] disabled:opacity-50 transition-colors">
            {pSaving ? 'Saqlanmoqda…' : 'Profilni saqlash'}
          </button>
        </form>
      </div>

      {/* Password */}
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-white/80">Parolni o'zgartirish</h2>
        </div>
        <form onSubmit={handlePasswordSave} className="p-6 space-y-4">
          {['current_password', 'new_password', 'confirm'].map((field) => (
            <div key={field}>
              <label className="block text-xs font-medium text-gray-500 dark:text-white/50 mb-1">
                {field === 'current_password' ? 'Joriy parol' : field === 'new_password' ? 'Yangi parol' : 'Yangi parolni tasdiqlang'}
              </label>
              <input type="password" value={passwords[field]}
                onChange={(e) => setPasswords({ ...passwords, [field]: e.target.value })}
                required placeholder="••••••••"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-800 dark:text-white outline-none focus:border-[#185FA5]" />
            </div>
          ))}
          {pwMsg && <p className="text-xs text-green-600 dark:text-green-400">{pwMsg}</p>}
          {pwErr && <p className="text-xs text-red-500">{pwErr}</p>}
          <button type="submit" disabled={pwSaving}
            className="px-5 py-2 bg-[#185FA5] text-white text-sm font-medium rounded-xl hover:bg-[#1451A0] disabled:opacity-50 transition-colors">
            {pwSaving ? 'Saqlanmoqda…' : 'Parolni yangilash'}
          </button>
        </form>
      </div>

      {/* Appearance */}
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-white/80">Ko'rinish</h2>
        </div>
        <div className="p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-white/80">Mavzu</p>
            <p className="text-xs text-gray-400 dark:text-white/30 mt-0.5">
              Joriy: {theme === 'dark' ? 'Qorong\'u' : 'Yorug\''}
            </p>
          </div>
          <button
            onClick={() => dispatch(toggleTheme())}
            className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${theme === 'dark' ? 'bg-[#185FA5]' : 'bg-gray-300'}`}
          >
            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300 ${theme === 'dark' ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
        </div>
      </div>
    </div>
  );
}
