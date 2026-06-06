import { Link } from 'react-router-dom';

export default function OrderSuccess() {
  return (
    <div
      style={{
        minHeight: '100vh', background: '#f5f2ee', fontFamily: 'Jost, sans-serif',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div className="text-center max-w-md px-6">
        {/* Check animation */}
        <div
          className="mx-auto mb-8 flex items-center justify-center rounded-full"
          style={{ width: 80, height: 80, background: '#0a0a0a', animation: 'fadeUp 0.5s ease' }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>

        <div className="gold-line" />
        <h1 className="section-heading mb-4">Order Confirmed</h1>
        <p className="text-sm text-[#9e9589] leading-relaxed mb-8">
          Thank you for your purchase. Your order has been placed and you'll receive a confirmation shortly.
        </p>

        <div className="flex flex-col gap-3">
          <Link to="/orders/history" className="btn-primary">View My Orders</Link>
          <Link to="/products" className="btn-outline">Continue Shopping</Link>
        </div>
      </div>
    </div>
  );
}
