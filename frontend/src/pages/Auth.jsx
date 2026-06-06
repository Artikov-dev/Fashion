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

  const from = location.state?.from?.pathname || '/home';

  useEffect(() => {
    if (user) navigate(user.role === 'admin' ? '/admin' : from, { replace: true });
  }, [user, navigate, from]);

  useEffect(() => {
    if (successMsg) {
      const t = setTimeout(() => {
        dispatch(clearMessages());
        navigate(user?.role === 'admin' ? '/admin' : from, { replace: true });
      }, 800);
      return () => clearTimeout(t);
    }
  }, [successMsg, dispatch, navigate, user, from]);

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
    <div className="min-h-screen flex" style={{ fontFamily: 'Jost, sans-serif' }}>
      {/* Left: image panel */}
      <div
        className="hidden lg:flex lg:w-1/2 relative items-end p-12"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80')",
          backgroundSize: 'cover',
          backgroundPosition: 'center 30%',
        }}
      >
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)' }} />
        <div className="relative text-white">
          <p className="text-xs tracking-[0.3em] uppercase text-[#c9a84c] mb-3">New Season</p>
          <h2 className="text-5xl font-light leading-tight" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            Dress to<br />Impress
          </h2>
          <p className="mt-4 text-sm text-white/70 max-w-xs leading-relaxed">
            Curated fashion from the world's finest designers. Explore our latest collection.
          </p>
        </div>
      </div>

      {/* Right: form panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-8 bg-[#f5f2ee]">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-light tracking-[0.2em]" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              VÊTEMENT
            </h1>
            <div className="divider mt-4 mb-0" />
          </div>

          {/* Tab toggle */}
          <div className="flex mb-8 border-b border-[#d1ccc6]">
            {['Sign In', 'Register'].map((label, i) => (
              <button
                key={label}
                onClick={() => { setIsLogin(i === 0); dispatch(clearMessages()); }}
                className={`flex-1 pb-3 text-xs font-semibold tracking-widest uppercase transition-colors ${
                  (i === 0) === isLogin ? 'tab-active' : 'tab-inactive'
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
                  value={form.name}
                  onChange={update('name')}
                  placeholder="Your name"
                  className="input-fashion"
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
                value={form.email}
                onChange={update('email')}
                placeholder="you@example.com"
                className="input-fashion"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold tracking-widest uppercase text-[#9e9589] mb-2">
                Password
              </label>
              <input
                type="password"
                required
                value={form.password}
                onChange={update('password')}
                placeholder="••••••••"
                className="input-fashion"
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

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? 'Please wait…' : isLogin ? 'Sign In' : 'Create Account'}
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
