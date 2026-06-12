import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { loginUser, registerUser, clearMessages } from '../slices/authSlice';
import { Users2, GitMerge, BarChart2 } from 'lucide-react';

function NexoraLogo({ size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gold-grad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F5D27A"/>
          <stop offset="50%" stopColor="#C9A84C"/>
          <stop offset="100%" stopColor="#A07830"/>
        </linearGradient>
        <linearGradient id="gold-stroke" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F5D27A"/>
          <stop offset="100%" stopColor="#C9A84C"/>
        </linearGradient>
      </defs>
      {/* Outer thin border ring */}
      <rect x="3" y="3" width="94" height="94" rx="20" stroke="url(#gold-grad)" strokeWidth="1" fill="none" opacity="0.4"/>
      {/* N letter */}
      <path
        d="M26 76V24h7l34 38V24h7v52h-7L33 38v38H26z"
        fill="url(#gold-stroke)"
      />
    </svg>
  );
}

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
          <div className="flex flex-col items-center mb-6 gap-3">
            <NexoraLogo size={72} />
            <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, fontWeight: 300, letterSpacing: '0.2em', color: '#fff' }}>NEXORA</span>
          </div>
          <p className="text-[#C9A84C] text-xs font-semibold tracking-widest uppercase mb-4">CRM Platform</p>
          <p className="text-white/50 text-sm max-w-xs leading-relaxed mx-auto">
            Mijozlaringizni boshqaring, leadlarni kuzating va biznesingizni o'stirish uchun zamonaviy CRM tizimi.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-4 text-center">
            {[
              { icon: <Users2 size={22} strokeWidth={1.8} />, label: 'Kontaktlar' },
              { icon: <GitMerge size={22} strokeWidth={1.8} />, label: 'Pipeline' },
              { icon: <BarChart2 size={22} strokeWidth={1.8} />, label: 'Analitika' },
            ].map(({ icon, label }) => (
              <div key={label} className="bg-white/5 rounded-xl p-4">
                <div className="flex justify-center text-[#3B6EF8] mb-2">{icon}</div>
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
            <div className="flex justify-center mb-3">
              <NexoraLogo size={52} />
            </div>
            <p className="text-sm text-gray-400 dark:text-white/30 mt-1">Tizimga xush kelibsiz</p>
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
