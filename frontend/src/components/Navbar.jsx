import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../slices/authSlice';

export default function Navbar() {
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const location   = useLocation();
  const user       = useSelector((s) => s.auth.user);
  const cartItems  = useSelector((s) => s.cart.items);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const isHome = location.pathname === '/home' || location.pathname === '/';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/auth');
  };

  const cartCount = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);

  const navBg = isHome && !scrolled
    ? 'bg-transparent text-white'
    : 'bg-[#f5f2ee] text-[#0a0a0a] shadow-sm';

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-400 ${navBg}`}
        style={{ transition: 'background 0.4s ease, color 0.4s ease' }}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link
            to={user ? '/home' : '/auth'}
            className="font-serif text-2xl font-light tracking-[0.15em] hover:opacity-70 transition-opacity"
            style={{ fontFamily: 'Cormorant Garamond, serif', textDecoration: 'none' }}
          >
            VÊTEMENT
          </Link>

          {/* Desktop Nav */}
          {user && (
            <nav className="hidden md:flex items-center gap-8">
              <Link to="/home"     className="nav-link" style={{ color: 'inherit' }}>Home</Link>
              <Link to="/products" className="nav-link" style={{ color: 'inherit' }}>Shop</Link>
              {user.role === 'admin' && (
                <Link to="/admin" className="nav-link" style={{ color: 'inherit' }}>Admin</Link>
              )}
              <Link to="/orders/history" className="nav-link" style={{ color: 'inherit' }}>Orders</Link>
            </nav>
          )}

          {/* Right Icons */}
          <div className="flex items-center gap-5">
            {user ? (
              <>
                {/* Cart */}
                <Link to="/cart" className="relative flex items-center" style={{ color: 'inherit', textDecoration: 'none' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                    <line x1="3" y1="6" x2="21" y2="6"/>
                    <path d="M16 10a4 4 0 0 1-8 0"/>
                  </svg>
                  {cartCount > 0 && (
                    <span
                      className="absolute -top-2 -right-2 bg-[#c9a84c] text-white rounded-full flex items-center justify-center"
                      style={{ width: 16, height: 16, fontSize: 9, fontWeight: 700 }}
                    >
                      {cartCount}
                    </span>
                  )}
                </Link>

                {/* User menu */}
                <div className="hidden md:flex items-center gap-4">
                  <span style={{ fontSize: 12, fontWeight: 500, letterSpacing: '0.05em', color: 'inherit', opacity: 0.7 }}>
                    {user.name || user.email?.split('@')[0]}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="btn-outline"
                    style={{
                      padding: '8px 16px',
                      fontSize: 10,
                      background: isHome && !scrolled ? 'transparent' : 'transparent',
                      color: 'inherit',
                      border: '1px solid currentColor',
                    }}
                  >
                    Logout
                  </button>
                </div>

                {/* Mobile menu button */}
                <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)} style={{ color: 'inherit' }}>
                  {menuOpen ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
                    </svg>
                  )}
                </button>
              </>
            ) : (
              <Link to="/auth" className="btn-primary" style={{ padding: '10px 24px', fontSize: 11 }}>
                Sign In
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && user && (
          <div className="md:hidden bg-[#0a0a0a] text-white px-6 py-6 space-y-4">
            {[
              { to: '/home', label: 'Home' },
              { to: '/products', label: 'Shop' },
              { to: '/orders/history', label: 'Orders' },
              ...(user.role === 'admin' ? [{ to: '/admin', label: 'Admin Panel' }] : []),
            ].map(({ to, label }) => (
              <Link key={to} to={to} onClick={() => setMenuOpen(false)}
                className="block text-sm tracking-widest uppercase font-light py-2 border-b border-white/10"
                style={{ textDecoration: 'none', color: 'inherit' }}>
                {label}
              </Link>
            ))}
            <button onClick={handleLogout} className="text-sm tracking-widest uppercase font-light text-[#c9a84c] pt-2">
              Logout
            </button>
          </div>
        )}
      </header>
    </>
  );
}
