import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchUserOrders } from '../features/orders/ordersSlice';
import { FaBoxOpen } from 'react-icons/fa';

const STATUS_COLORS = {
  pending:    'status-pending',
  processing: 'status-processing',
  shipped:    'status-shipped',
  delivered:  'status-delivered',
  cancelled:  'status-cancelled',
};

export default function OrderHistory() {
  const dispatch = useDispatch();
  const { userOrders, loading, error } = useSelector((s) => s.orders);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => { dispatch(fetchUserOrders()); }, [dispatch]);

  return (
    <div style={{ paddingTop: 80, minHeight: '100vh', background: '#f5f2ee', fontFamily: 'Jost, sans-serif' }}>
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-10">
          <div className="gold-line" />
          <h1 className="section-heading">My Orders</h1>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-24 rounded" />)}
          </div>
        ) : error ? (
          <div className="text-center py-16 text-red-500">{error}</div>
        ) : userOrders.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-5xl mb-5"><FaBoxOpen /></div>
            <h2 className="text-2xl font-light mb-3" style={{ fontFamily: 'Cormorant Garamond, serif' }}>No orders yet</h2>
            <p className="text-sm text-[#9e9589] mb-8">Your orders will appear here once you make a purchase.</p>
            <Link to="/products" className="btn-primary">Start Shopping</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {userOrders.map((order) => {
              const items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
              const isOpen = expanded === order.id;
              return (
                <div key={order.id} className="bg-white">
                  {/* Header */}
                  <button
                    onClick={() => setExpanded(isOpen ? null : order.id)}
                    className="w-full flex items-center justify-between px-6 py-5 text-left"
                  >
                    <div className="flex items-center gap-6 flex-wrap">
                      <div>
                        <p className="text-xs text-[#9e9589] font-semibold tracking-widest uppercase mb-1">Order #</p>
                        <p className="text-sm font-semibold">{order.invoice_number || `ORD-${order.id}`}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#9e9589] font-semibold tracking-widest uppercase mb-1">Date</p>
                        <p className="text-sm">{new Date(order.createdAt || order.created_at).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#9e9589] font-semibold tracking-widest uppercase mb-1">Total</p>
                        <p className="text-sm font-semibold">${Number(order.totalAmount || order.total_amount).toFixed(2)}</p>
                      </div>
                      <span className={`text-xs font-semibold px-3 py-1 rounded-sm ${STATUS_COLORS[order.status] || 'status-pending'}`}>
                        {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                      </span>
                    </div>
                    <svg
                      width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9e9589" strokeWidth="1.5"
                      style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}
                    >
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </button>

                  {/* Expanded details */}
                  {isOpen && (
                    <div className="border-t border-[#ece9e3] px-6 pb-6 pt-4 animate-fadeUp">
                      <p className="text-xs font-semibold tracking-widest uppercase text-[#9e9589] mb-4">Items</p>
                      <div className="space-y-3">
                        {items.map((item, i) => (
                          <div key={i} className="flex items-center gap-4 py-2 border-b border-[#f5f2ee]">
                            {item.image && (
                              <img src={item.image} alt={item.name} className="w-12 h-16 object-cover bg-[#ece9e3]" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{item.name}</p>
                              <p className="text-xs text-[#9e9589]">Qty: {item.quantity} × ${Number(item.price).toFixed(2)}</p>
                            </div>
                            <p className="text-sm font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                          </div>
                        ))}
                      </div>

                      {order.shippingAddress && (
                        <div className="mt-4 pt-4 border-t border-[#ece9e3]">
                          <p className="text-xs font-semibold tracking-widest uppercase text-[#9e9589] mb-2">Shipping Address</p>
                          <p className="text-sm text-[#3d3b39]">
                            {typeof order.shippingAddress === 'string'
                              ? order.shippingAddress
                              : `${order.shippingAddress.address}, ${order.shippingAddress.city} ${order.shippingAddress.zip}`}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
