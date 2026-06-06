import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchCart, updateQuantity, removeFromCart, clearCartAPI } from '../features/cart/cartSlice';

export default function CartPage() {
  const dispatch = useDispatch();
  const { items, status } = useSelector((s) => s.cart);

  useEffect(() => { dispatch(fetchCart()); }, [dispatch]);

  const subtotal = items.reduce((s, i) => s + (Number(i.unit_price) || Number(i.price) || 0) * i.quantity, 0);
  const shipping = subtotal > 100 ? 0 : 9.99;
  const total    = subtotal + shipping;

  if (status === 'loading') {
    return (
      <div style={{ paddingTop: 80, minHeight: '100vh', background: '#f5f2ee', fontFamily: 'Jost, sans-serif' }}>
        <div className="max-w-5xl mx-auto px-6 py-16 text-center">
          <div className="inline-block w-8 h-8 border-2 border-[#0a0a0a] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 80, minHeight: '100vh', background: '#f5f2ee', fontFamily: 'Jost, sans-serif' }}>
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <div className="gold-line" />
          <h1 className="section-heading">Your Cart</h1>
          <p className="text-sm text-[#9e9589] mt-2">{items.length} {items.length === 1 ? 'item' : 'items'}</p>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-6xl mb-6">🛍</div>
            <h2 className="text-2xl font-light mb-4" style={{ fontFamily: 'Cormorant Garamond, serif' }}>Your cart is empty</h2>
            <p className="text-sm text-[#9e9589] mb-8">Looks like you haven't added anything yet.</p>
            <Link to="/products" className="btn-primary">Shop Collection</Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-10">
            {/* Items */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex justify-end mb-2">
                <button
                  onClick={() => dispatch(clearCartAPI())}
                  className="text-xs text-[#9e9589] underline"
                >
                  Clear Cart
                </button>
              </div>

              {items.map((item) => {
                const price = Number(item.unit_price) || Number(item.price) || 0;
                return (
                  <div key={item.id} className="flex gap-5 bg-white p-5 animate-slideIn">
                    {/* Image */}
                    <div className="w-24 h-32 flex-shrink-0 bg-[#ece9e3] overflow-hidden">
                      <img
                        src={item.product_image || item.image_url || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&q=80'}
                        alt={item.product_name || item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm mb-1" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 17 }}>
                        {item.product_name || item.name}
                      </h3>
                      {item.size && <p className="text-xs text-[#9e9589] mb-1">Size: {item.size}</p>}
                      {item.color && item.color !== 'Default' && (
                        <p className="text-xs text-[#9e9589] mb-3">Color: {item.color}</p>
                      )}
                      <p className="text-sm font-semibold">${price.toFixed(2)}</p>
                    </div>

                    {/* Controls */}
                    <div className="flex flex-col items-end justify-between">
                      <button
                        onClick={() => dispatch(removeFromCart(item.id))}
                        className="text-[#9e9589] hover:text-red-500 transition-colors"
                        title="Remove"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>

                      <div className="flex items-center border border-[#d1ccc6]">
                        <button
                          onClick={() => item.quantity > 1
                            ? dispatch(updateQuantity({ id: item.id, quantity: item.quantity - 1 }))
                            : dispatch(removeFromCart(item.id))
                          }
                          className="w-8 h-8 flex items-center justify-center hover:bg-[#ece9e3] text-sm"
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => dispatch(updateQuantity({ id: item.id, quantity: item.quantity + 1 }))}
                          className="w-8 h-8 flex items-center justify-center hover:bg-[#ece9e3] text-sm"
                        >
                          +
                        </button>
                      </div>

                      <p className="text-sm font-semibold">${(price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            <div className="bg-white p-8 h-fit sticky top-24">
              <h2 className="text-lg font-medium mb-6" style={{ fontFamily: 'Cormorant Garamond, serif' }}>Order Summary</h2>

              <div className="space-y-3 mb-6 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#9e9589]">Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9e9589]">Shipping</span>
                  <span>{shipping === 0 ? <span className="text-green-600">Free</span> : `$${shipping.toFixed(2)}`}</span>
                </div>
                {shipping > 0 && (
                  <p className="text-xs text-[#9e9589]">Free shipping on orders over $100</p>
                )}
                <div className="border-t border-[#d1ccc6] pt-3 flex justify-between font-semibold text-base">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              <Link to="/checkout" className="btn-primary w-full text-center" style={{ display: 'block', textDecoration: 'none' }}>
                Proceed to Checkout
              </Link>
              <Link to="/products" className="btn-outline w-full text-center mt-3" style={{ display: 'block', textDecoration: 'none' }}>
                Continue Shopping
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
