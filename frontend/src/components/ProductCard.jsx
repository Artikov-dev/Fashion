import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { addToCart } from '../features/cart/cartSlice';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&q=80';

export default function ProductCard({ product, onAddToCart }) {
  const dispatch = useDispatch();

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(addToCart(product));
    if (onAddToCart) onAddToCart(product.name);
  };

  const isNew = product.created_at
    ? (Date.now() - new Date(product.created_at).getTime()) < 14 * 24 * 3600 * 1000
    : false;

  return (
    <Link
      to={`/products/${product.id}`}
      className="product-card block bg-white group"
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      {/* Image */}
      <div className="relative overflow-hidden aspect-[3/4] bg-[#ece9e3]">
        <img
          src={product.image_url || PLACEHOLDER}
          alt={product.name}
          className="w-full h-full object-cover"
          onError={(e) => { e.target.src = PLACEHOLDER; }}
          loading="lazy"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1">
          {isNew && (
            <span className="badge-sale" style={{ background: '#c9a84c' }}>New</span>
          )}
          {product.stock === 0 && (
            <span className="badge-sale" style={{ background: '#6b7280' }}>Sold Out</span>
          )}
          {product.stock > 0 && product.stock <= 5 && (
            <span className="badge-sale" style={{ background: '#dc2626' }}>Low Stock</span>
          )}
        </div>

        {/* Quick add overlay */}
        <div
          className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300"
          style={{ background: 'rgba(10,10,10,0.92)' }}
        >
          <button
            onClick={handleAdd}
            disabled={product.stock === 0}
            className="w-full py-3 text-white text-xs font-semibold tracking-widest uppercase disabled:opacity-40"
          >
            {product.stock === 0 ? 'Sold Out' : '+ Add to Cart'}
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <p className="text-xs font-medium tracking-widest uppercase text-[#9e9589] mb-1">
          {product.category_name || 'Uncategorised'}
        </p>
        <h3
          className="text-sm font-medium leading-snug mb-2"
          style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 17 }}
        >
          {product.name}
        </h3>
        <p className="text-sm font-semibold tracking-wide" style={{ color: '#3d3b39' }}>
          ${Number(product.price).toFixed(2)}
        </p>
      </div>
    </Link>
  );
}
