import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { loginUser, registerUser, clearMessages } from '../slices/authSlice';

export default function Auth() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user, loading, error, successMsg } = useSelector((s) => s.auth);

  const [isLogin, setIsLogin]   = useState(true);
  const [form, setForm]         = useState({ email: '', password: '', name: '' });

  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    if (successMsg) {
      const t = setTimeout(() => {
        dispatch(clearMessages());
        navigate('/dashboard', { replace: true });
      }, 800);
      return () => clearTimeout(t);
    }
  }, [successMsg, dispatch, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(clearMessages());
    if (isLogin) {
      dispatch(loginUser({ email: form.email, password: form.password }));
    } else {
      dispatch(registerUser({ email: form.email, password: form.password, name: form.name }));
    }
  };

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] dark:bg-[#0F172A]">
      {/* Left: branding panel */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center bg-[#0F172A] p-12">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#185FA5] flex items-center justify-center text-white text-3xl font-bold mx-auto mb-6">
            N
          </div>
          <h2 className="text-4xl font-bold text-white tracking-wide mb-3">NEXORA CRM</h2>
          <p className="text-white/50 text-sm max-w-xs leading-relaxed">
            Mijozlaringizni boshqaring, leadlarni kuzating va biznesingizni o'stirish uchun zamonaviy CRM tizimi.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-6 text-center">
            {[
              { icon: '◎', label: 'Kontaktlar' },
              { icon: '◈', label: 'Pipeline' },
              { icon: '▲', label: 'Analitika' },
            ].map(({ icon, label }) => (
              <div key={label} className="bg-white/5 rounded-xl p-4">
                <div className="text-2xl text-[#185FA5] mb-2">{icon}</div>
                <p className="text-xs text-white/40 font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: form panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-8 bg-[#F8FAFC] dark:bg-[#0F172A]">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-[#185FA5] flex items-center justify-center text-white text-xl font-bold mx-auto mb-3">N</div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-wide">NEXORA CRM</h1>
            <p className="text-sm text-gray-400 dark:text-white/30 mt-1">Tizimga kirish</p>
          </div>

          {/* Tab toggle */}
          <div className="flex mb-6 border-b border-gray-200 dark:border-white/10">
            {[['Kirish', true], ["Ro'yxatdan o'tish", false]].map(([label, isL]) => (
              <button
                key={label}
                onClick={() => { setIsLogin(isL); dispatch(clearMessages()); }}
                className={`flex-1 pb-3 text-xs font-semibold tracking-wide uppercase transition-colors border-b-2 ${
                  isLogin === isL
                    ? 'border-[#185FA5] text-[#185FA5]'
                    : 'border-transparent text-gray-400 dark:text-white/30 hover:text-gray-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-xs font-semibold tracking-widest uppercase text-[#9e9589] mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  autoComplete="name"
                  value={form.name}
                  onChange={update('name')}
                  placeholder="Your name"
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-800 dark:text-white outline-none focus:border-[#185FA5] transition-colors"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold tracking-widest uppercase text-[#9e9589] mb-2">
                Email
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={update('email')}
                placeholder="you@example.com"
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-800 dark:text-white outline-none focus:border-[#185FA5] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold tracking-widest uppercase text-[#9e9589] mb-2">
                Password
              </label>
              <input
                type="password"
                required
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                value={form.password}
                onChange={update('password')}
                placeholder="••••••••"
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-800 dark:text-white outline-none focus:border-[#185FA5] transition-colors"
              />
            </div>

            {/* Messages */}
            {error && (
              <p className="text-xs text-red-600 py-2 px-3 bg-red-50 border border-red-200">
                {error}
              </p>
            )}
            {successMsg && (
              <p className="text-xs text-green-700 py-2 px-3 bg-green-50 border border-green-200">
                {successMsg}
              </p>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-2.5 mt-2 bg-[#185FA5] text-white text-sm font-semibold rounded-lg hover:bg-[#1451A0] disabled:opacity-50 transition-colors">
              {loading ? 'Kuting…' : isLogin ? 'Kirish' : "Ro'yxatdan o'tish"}
            </button>
          </form>

          <p className="text-center text-xs text-[#9e9589] mt-8">
            By continuing, you agree to our Terms of Service & Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
