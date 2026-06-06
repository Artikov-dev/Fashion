import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProductById, fetchProducts, clearCurrentProduct } from '../slices/productsSlice';
import { addToCart } from '../features/cart/cartSlice';
import ProductCard from '../components/ProductCard';
import Toast, { useToast } from '../components/Toast';
import { FaTruck, FaUndoAlt, FaLock } from 'react-icons/fa';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80';

export default function ProductDetail() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const dispatch  = useDispatch();
  const { toast, show } = useToast();

  const { currentProduct: product, items, loading } = useSelector((s) => s.products);
  const [selImg,   setSelImg]   = useState(0);
  const [selSize,  setSelSize]  = useState('M');
  const [qty,      setQty]      = useState(1);
  const [adding,   setAdding]   = useState(false);

  useEffect(() => {
    dispatch(fetchProductById(id));
    dispatch(fetchProducts());
    setSelImg(0);
    return () => dispatch(clearCurrentProduct());
  }, [id, dispatch]);

  const handleAddToCart = async () => {
    if (!product) return;
    setAdding(true);
    try {
      await dispatch(addToCart({ ...product, size: selSize, quantity: qty }));
      show(`${product.name} added to cart`);
    } catch {
      show('Failed to add to cart', 'error');
    } finally {
      setAdding(false);
    }
  };

  const related = items
    .filter((p) => p.id !== Number(id) && p.category_id === product?.category_id)
    .slice(0, 4);

  const images = product?.images || [product?.image_url || PLACEHOLDER];
  const SIZES  = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  if (loading) {
    return (
      <div style={{ paddingTop: 80, minHeight: '100vh', background: '#f5f2ee', fontFamily: 'Jost, sans-serif' }}>
        <div className="max-w-7xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-16">
          <div className="skeleton aspect-[3/4]" />
          <div className="space-y-4">
            <div className="skeleton h-4 w-1/3" />
            <div className="skeleton h-8 w-3/4" />
            <div className="skeleton h-6 w-1/4 mt-4" />
            <div className="skeleton h-20 w-full mt-6" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div style={{ paddingTop: 64, minHeight: '100vh', background: '#f5f2ee', fontFamily: 'Jost, sans-serif' }}>
      <Toast toast={toast} />

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-2 text-xs text-[#9e9589]">
        <Link to="/home" style={{ textDecoration: 'none', color: 'inherit' }}>Home</Link>
        <span>/</span>
        <Link to="/products" style={{ textDecoration: 'none', color: 'inherit' }}>Shop</Link>
        <span>/</span>
        <span className="text-[#0a0a0a]">{product.name}</span>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-20 grid md:grid-cols-2 gap-12 lg:gap-20">
        {/* Gallery */}
        <div>
          <div className="relative overflow-hidden bg-[#ece9e3] aspect-[4/5]">
            <img
              src={images[selImg] || PLACEHOLDER}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={(e) => { e.target.src = PLACEHOLDER; }}
            />
            {product.stock === 0 && (
              <div className="absolute top-4 left-4 badge-sale" style={{ background: '#6b7280' }}>Sold Out</div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-3 mt-3">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelImg(i)}
                  className="overflow-hidden flex-1 aspect-square border-2 transition-colors"
                  style={{ borderColor: i === selImg ? '#0a0a0a' : 'transparent' }}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="py-4">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold tracking-widest uppercase text-[#9e9589]">
              {product.category_name || 'Fashion'}
            </span>
            <span className={`text-xs font-semibold tracking-widest ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
              {product.stock > 0 ? `In Stock (${product.stock})` : 'Out of Stock'}
            </span>
          </div>

          <h1 className="text-4xl font-light mb-4" style={{ fontFamily: 'Cormorant Garamond, serif', lineHeight: 1.2 }}>
            {product.name}
          </h1>

          <p className="text-3xl font-semibold mb-6" style={{ color: '#0a0a0a' }}>
            ${Number(product.price).toFixed(2)}
          </p>

          <div className="h-px bg-[#d1ccc6] mb-6" />

          <p className="text-sm leading-relaxed text-[#3d3b39] mb-8">
            {product.description || 'A beautifully crafted piece from our latest collection. Made with premium materials for lasting style and comfort.'}
          </p>

          {/* Size selector */}
          <div className="mb-6">
            <div className="flex justify-between mb-3">
              <p className="text-xs font-semibold tracking-widest uppercase">Size</p>
              <button className="text-xs underline text-[#9e9589]">Size Guide</button>
            </div>
            <div className="flex gap-2 flex-wrap">
              {SIZES.map((s) => (
                <button
                  key={s}
                  onClick={() => setSelSize(s)}
                  className="w-10 h-10 text-xs font-semibold border transition-all"
                  style={{
                    border: s === selSize ? '2px solid #0a0a0a' : '1px solid #d1ccc6',
                    background: s === selSize ? '#0a0a0a' : 'transparent',
                    color: s === selSize ? '#fff' : '#0a0a0a',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div className="mb-6">
            <p className="text-xs font-semibold tracking-widest uppercase mb-3">Quantity</p>
            <div className="flex items-center border border-[#d1ccc6] w-fit">
              <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-10 h-10 text-lg hover:bg-[#ece9e3] transition-colors">−</button>
              <span className="w-12 text-center text-sm font-semibold">{qty}</span>
              <button onClick={() => setQty(q => Math.min(product.stock || 10, q + 1))} className="w-10 h-10 text-lg hover:bg-[#ece9e3] transition-colors">+</button>
            </div>
          </div>

          {/* Add to cart */}
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0 || adding}
            className="btn-primary w-full mb-3"
            style={{ padding: 16 }}
          >
            {adding ? 'Adding…' : product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>

          <Link to="/cart" className="btn-outline w-full text-center" style={{ padding: 14, display: 'block', textDecoration: 'none' }}>
            View Cart
          </Link>

          {/* Perks */}
          <div className="mt-8 pt-6 border-t border-[#d1ccc6] space-y-3">
            {[
              { icon: <FaTruck />, text: 'Free shipping on orders over $100' },
              { icon: <FaUndoAlt />, text: 'Easy 30-day returns' },
              { icon: <FaLock />, text: 'Secure checkout' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-xs text-[#9e9589]">
                <span>{icon}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <section className="bg-white py-16 px-6">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-center section-heading mb-10" style={{ fontSize: 32 }}>You May Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} onAddToCart={(name) => show(`${name} added to cart`)} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
