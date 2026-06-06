import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { placeOrder } from '../features/orders/ordersSlice';
import { fetchCart } from '../features/cart/cartSlice';
import { FaRegCreditCard, FaMoneyBillAlt, FaMobileAlt } from 'react-icons/fa';

export default function Checkout() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { items } = useSelector((s) => s.cart);
  const { loading } = useSelector((s) => s.orders);

  const [form, setForm]     = useState({ name: '', email: '', address: '', city: '', zip: '', phone: '' });
  const [method, setMethod] = useState('card');
  const [error, setError]   = useState(null);

  const subtotal = items.reduce((s, i) => s + (Number(i.unit_price) || 0) * i.quantity, 0);
  const shipping = subtotal > 100 ? 0 : 9.99;
  const total    = subtotal + shipping;

  const up = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const orderData = {
        shipping_address: { name: form.name, address: form.address, city: form.city, zip: form.zip },
        payment_method: method,
        phone_number: form.phone,
      };
      await dispatch(placeOrder(orderData)).unwrap();
      await dispatch(fetchCart());
      navigate('/order-success');
    } catch (err) {
      setError(err?.message || String(err) || 'Order failed. Please try again.');
    }
  };

  if (items.length === 0) {
    return (
      <div style={{ paddingTop: 100, minHeight: '100vh', background: '#f5f2ee', fontFamily: 'Jost, sans-serif', textAlign: 'center' }}>
        <h2 className="text-2xl mb-4" style={{ fontFamily: 'Cormorant Garamond, serif' }}>Your cart is empty</h2>
        <Link to="/products" className="btn-primary">Shop Collection</Link>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 80, minHeight: '100vh', background: '#f5f2ee', fontFamily: 'Jost, sans-serif' }}>
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-10">
          <div className="gold-line" />
          <h1 className="section-heading">Checkout</h1>
        </div>

        <div className="grid lg:grid-cols-5 gap-10">
          {/* Form */}
          <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-6">
            {/* Contact */}
            <div className="bg-white p-8">
              <h2 className="text-sm font-semibold tracking-widest uppercase mb-6">Contact & Shipping</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold tracking-widest uppercase text-[#9e9589] mb-2">Full Name</label>
                  <input required className="input-fashion" value={form.name} onChange={up('name')} placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-xs font-semibold tracking-widest uppercase text-[#9e9589] mb-2">Email</label>
                  <input required type="email" className="input-fashion" value={form.email} onChange={up('email')} placeholder="you@email.com" />
                </div>
                <div>
                  <label className="block text-xs font-semibold tracking-widest uppercase text-[#9e9589] mb-2">Phone</label>
                  <input className="input-fashion" value={form.phone} onChange={up('phone')} placeholder="+1 555 000 0000" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold tracking-widest uppercase text-[#9e9589] mb-2">Street Address</label>
                  <input required className="input-fashion" value={form.address} onChange={up('address')} placeholder="123 Main St" />
                </div>
                <div>
                  <label className="block text-xs font-semibold tracking-widest uppercase text-[#9e9589] mb-2">City</label>
                  <input required className="input-fashion" value={form.city} onChange={up('city')} placeholder="New York" />
                </div>
                <div>
                  <label className="block text-xs font-semibold tracking-widest uppercase text-[#9e9589] mb-2">ZIP Code</label>
                  <input required className="input-fashion" value={form.zip} onChange={up('zip')} placeholder="10001" />
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className="bg-white p-8">
              <h2 className="text-sm font-semibold tracking-widest uppercase mb-6">Payment Method</h2>
              <div className="space-y-3">
                {[
                  { value: 'card',  label: 'Credit / Debit Card', icon: <FaRegCreditCard /> },
                  { value: 'cash',  label: 'Cash on Delivery',    icon: <FaMoneyBillAlt /> },
                  { value: 'mpesa', label: 'M-Pesa Mobile',        icon: <FaMobileAlt /> },
                ].map(({ value, label, icon }) => (
                  <label
                    key={value}
                    className="flex items-center gap-4 p-4 border cursor-pointer transition-colors"
                    style={{ borderColor: method === value ? '#0a0a0a' : '#d1ccc6', background: method === value ? '#f9f8f6' : 'transparent' }}
                  >
                    <input type="radio" name="payment" value={value} checked={method === value} onChange={() => setMethod(value)} className="accent-[#0a0a0a]" />
                    <span className="text-lg">{icon}</span>
                    <span className="text-sm font-medium">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 px-5 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full" style={{ padding: 16, fontSize: 12 }}>
              {loading ? 'Placing Order…' : `Place Order · $${total.toFixed(2)}`}
            </button>
          </form>

          {/* Summary */}
          <div className="lg:col-span-2">
            <div className="bg-white p-8 sticky top-24">
              <h2 className="text-sm font-semibold tracking-widest uppercase mb-6">Order Summary</h2>
              <div className="space-y-4 mb-6">
                {items.map((item) => {
                  const price = Number(item.unit_price) || 0;
                  return (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-16 h-20 flex-shrink-0 bg-[#ece9e3] overflow-hidden">
                        <img
                          src={item.product_image || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=100&q=60'}
                          alt={item.product_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.product_name}</p>
                        {item.size && <p className="text-xs text-[#9e9589]">Size: {item.size}</p>}
                        <p className="text-xs text-[#9e9589]">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-semibold flex-shrink-0">${(price * item.quantity).toFixed(2)}</p>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-[#d1ccc6] pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#9e9589]">Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9e9589]">Shipping</span>
                  <span>{shipping === 0 ? <span className="text-green-600">Free</span> : `$${shipping.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between font-semibold text-base pt-2 border-t border-[#d1ccc6]">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
