import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts, fetchCategories } from '../slices/productsSlice';
import { addToCart } from '../features/cart/cartSlice';
import ProductCard from '../components/ProductCard';
import Toast, { useToast } from '../components/Toast';

const HERO_BG = 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=1800&q=80';
const BANNER_BG = 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1400&q=80';

const REVIEWS = [
  { name: 'Sofia L.', text: 'The quality is unmatched. Every piece feels luxurious.', rating: 5 },
  { name: 'James T.', text: 'Fast delivery, beautiful packaging. Will shop again.', rating: 5 },
  { name: 'Amira K.', text: 'Found my perfect wardrobe. Clean, elegant, timeless.', rating: 5 },
];

export default function Home() {
  const dispatch  = useDispatch();
  const { items, categories, loading } = useSelector((s) => s.products);
  const { toast, show } = useToast();

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchCategories());
  }, [dispatch]);

  const featured   = items.slice(0, 4);
  const newArrivals = [...items].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 3);

  return (
    <div style={{ fontFamily: 'Jost, sans-serif', background: '#f5f2ee' }}>
      <Toast toast={toast} />

      {/* ──────────────── HERO ──────────────── */}
      <section
        className="relative flex items-end justify-start overflow-hidden"
        style={{ height: '100vh', backgroundImage: `url(${HERO_BG})`, backgroundSize: 'cover', backgroundPosition: 'center 25%' }}
      >
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)' }} />
        <div className="relative px-8 md:px-20 pb-20 text-white max-w-3xl animate-fadeUp">
          <p className="text-xs tracking-[0.35em] uppercase mb-4" style={{ color: '#7ecfa8' }}>Summer / 2026 — Tests Pass, Deploy Go</p>
          <h1 className="text-6xl md:text-8xl font-light leading-none mb-6" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            Own<br />The Look
          </h1>
          <p className="text-base text-white/70 mb-8 max-w-md leading-relaxed">
            Discover bold new silhouettes and timeless essentials — freshly curated for 2026.
          </p>
          <div className="flex gap-4 flex-wrap">
            <Link to="/products" className="btn-primary">Shop Collection</Link>
            <Link to="/products" className="btn-outline" style={{ color: 'white', borderColor: 'white' }}>New Arrivals</Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 right-8 text-white/50 text-xs tracking-widest uppercase flex flex-col items-center gap-2">
          <div style={{ width: 1, height: 40, background: 'rgba(255,255,255,0.3)' }} />
          <span>Scroll</span>
        </div>
      </section>

      {/* ──────────────── CATEGORIES ──────────────── */}
      {categories.length > 0 && (
        <section className="py-20 px-6 bg-[#f5f2ee]">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <div className="divider" />
              <h2 className="section-heading">Shop by Category</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categories.slice(0, 8).map((cat) => (
                <Link
                  key={cat.id}
                  to={`/products?category_id=${cat.id}`}
                  className="group relative overflow-hidden aspect-square bg-[#ece9e3] flex items-end p-5"
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: 'rgba(0,0,0,0.06)' }}
                  />
                  <div className="relative">
                    <p className="text-xs tracking-widest uppercase text-[#9e9589] mb-1">Explore</p>
                    <h3 className="text-lg font-medium group-hover:underline" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                      {cat.name}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ──────────────── FEATURED PRODUCTS ──────────────── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <div className="gold-line" />
              <h2 className="section-heading">Featured Pieces</h2>
            </div>
            <Link to="/products" className="text-xs tracking-widest uppercase font-semibold underline underline-offset-4"
              style={{ textDecoration: 'none', color: '#0a0a0a' }}>
              View All →
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i}>
                  <div className="skeleton aspect-[3/4] mb-3" />
                  <div className="skeleton h-3 w-2/3 mb-2" />
                  <div className="skeleton h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {featured.map((p) => (
                <ProductCard key={p.id} product={p} onAddToCart={(name) => show(`${name} added to cart`)} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ──────────────── PROMO BANNER ──────────────── */}
      <section
        className="relative flex items-center justify-end overflow-hidden"
        style={{ height: 480, backgroundImage: `url(${BANNER_BG})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to left, rgba(0,0,0,0.6) 0%, transparent 60%)' }} />
        <div className="relative text-white text-right px-8 md:px-20 max-w-lg ml-auto">
          <p className="text-xs tracking-[0.3em] uppercase text-[#c9a84c] mb-3">Exclusive Offer</p>
          <h2 className="text-5xl font-light mb-5" style={{ fontFamily: 'Cormorant Garamond, serif', lineHeight: 1.2 }}>
            New Arrivals<br />Just Landed
          </h2>
          <p className="text-sm text-white/70 mb-8">Discover the latest additions to our curated collection.</p>
          <Link to="/products" className="btn-primary" style={{ color: '#fff', borderColor: '#fff', background: 'transparent' }}>
            Shop Now
          </Link>
        </div>
      </section>

      {/* ──────────────── NEW ARRIVALS ──────────────── */}
      <section className="py-20 px-6 bg-[#f5f2ee]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="divider" />
            <h2 className="section-heading">New Arrivals</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {newArrivals.map((p) => (
              <ProductCard key={p.id} product={p} onAddToCart={(name) => show(`${name} added to cart`)} />
            ))}
          </div>
          <div className="text-center mt-12">
            <Link to="/products" className="btn-outline">Browse All Products</Link>
          </div>
        </div>
      </section>

      {/* ──────────────── REVIEWS ──────────────── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="divider" />
            <h2 className="section-heading">What Our Clients Say</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-10">
            {REVIEWS.map((r) => (
              <div key={r.name} className="border border-[#ece9e3] p-8">
                <div className="flex gap-1 mb-4">
                  {[...Array(r.rating)].map((_, i) => (
                    <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill="#c9a84c">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-[#3d3b39] mb-6 italic" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 16 }}>
                  "{r.text}"
                </p>
                <p className="text-xs font-semibold tracking-widest uppercase text-[#9e9589]">{r.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────── NEWSLETTER ──────────────── */}
      <section className="py-20 px-6" style={{ background: '#0a0a0a' }}>
        <div className="max-w-xl mx-auto text-center text-white">
          <p className="text-xs tracking-[0.3em] uppercase text-[#c9a84c] mb-4">Stay Connected</p>
          <h2 className="section-heading mb-4" style={{ color: 'white' }}>Get Early Access</h2>
          <p className="text-sm text-white/50 mb-8">Subscribe for new arrivals, exclusive offers, and style inspiration.</p>
          <div className="flex gap-0">
            <input
              type="email"
              placeholder="your@email.com"
              className="flex-1 bg-white/10 text-white text-sm px-5 py-3 border border-white/20 outline-none placeholder:text-white/30"
              style={{ fontFamily: 'Jost, sans-serif' }}
            />
            <button className="btn-primary" style={{ background: '#c9a84c', borderColor: '#c9a84c', color: '#0a0a0a', whiteSpace: 'nowrap' }}>
              Subscribe
            </button>
          </div>
        </div>
      </section>

      {/* ──────────────── FOOTER ──────────────── */}
      <footer className="py-12 px-6 bg-[#0a0a0a] border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-10">
            <div>
              <h3 className="text-white text-xl font-light tracking-widest mb-4" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                VÊTEMENT
              </h3>
              <p className="text-xs text-white/40 leading-relaxed">
                Premium fashion for the modern individual. Curated with care, delivered with love.
              </p>
            </div>
            {[
              { title: 'Shop', links: ['New Arrivals', 'Women', 'Men', 'Accessories'] },
              { title: 'Help', links: ['FAQs', 'Shipping', 'Returns', 'Contact'] },
              { title: 'Company', links: ['About', 'Careers', 'Press', 'Sustainability'] },
            ].map(({ title, links }) => (
              <div key={title}>
                <h4 className="text-xs text-white font-semibold tracking-widest uppercase mb-4">{title}</h4>
                <ul className="space-y-2">
                  {links.map((l) => (
                    <li key={l}>
                      <Link to="/products" className="text-xs text-white/40 hover:text-white/80 transition-colors" style={{ textDecoration: 'none', color: 'inherit' }}>
                        {l}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center gap-3">
            <p className="text-xs text-white/30">© 2026 VÊTEMENT. All rights reserved.</p>
            <p className="text-xs text-white/30">Crafted with precision for the modern wardrobe.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
