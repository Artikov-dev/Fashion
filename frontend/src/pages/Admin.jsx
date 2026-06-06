import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts, createProduct, updateProduct, deleteProduct, fetchCategories } from '../slices/productsSlice';
import { fetchAllOrders, updateOrderStatus } from '../features/orders/ordersSlice';
import api from '../utils/api';
import { FaChartBar, FaTshirt, FaBoxOpen, FaUsers, FaMoneyBillWave } from 'react-icons/fa';

const SECTIONS = ['Dashboard', 'Products', 'Orders', 'Users'];
const STATUS_OPTS = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

function StatCard({ title, value, icon, color }) {
  return (
    <div className="bg-white p-6" style={{ borderLeft: `3px solid ${color}` }}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase text-[#9e9589] mb-2">{title}</p>
          <p className="text-3xl font-light" style={{ fontFamily: 'Cormorant Garamond, serif' }}>{value}</p>
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  );
}

function SectionHeader({ title, action }) {
  return (
    <div className="flex items-end justify-between mb-6">
      <div>
        <div className="gold-line" style={{ margin: '0 0 8px' }} />
        <h2 className="text-2xl font-light" style={{ fontFamily: 'Cormorant Garamond, serif' }}>{title}</h2>
      </div>
      {action}
    </div>
  );
}

const STATUS_COLORS = {
  pending: '#fef3c7', processing: '#dbeafe', shipped: '#d1fae5', delivered: '#f0fdf4', cancelled: '#fee2e2'
};

export default function AdminDashboard() {
  const dispatch  = useDispatch();
  const { items: products, categories, loading: prodLoading } = useSelector((s) => s.products);
  const { allOrders, loading: ordLoading } = useSelector((s) => s.orders);
  const [section, setSection] = useState('Dashboard');
  const [users, setUsers]     = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId]    = useState(null);
  const [form, setForm]        = useState({ name: '', price: '', description: '', stock: '', image_url: '', category_id: '' });
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchCategories());
    dispatch(fetchAllOrders());
  }, [dispatch]);

  useEffect(() => {
    if (section === 'Users') {
      api.get('/admin/users').then(res => {
        const data = res.data?.data ?? res.data;
        setUsers(Array.isArray(data) ? data : data?.users || []);
      }).catch(() => {});
    }
  }, [section]);

  const totalRevenue = allOrders
    .filter(o => o.status !== 'cancelled')
    .reduce((s, o) => s + Number(o.totalAmount || o.total_amount || 0), 0);

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    const data = { ...form, price: parseFloat(form.price), stock: parseInt(form.stock) || 0, category_id: parseInt(form.category_id) || null };
    try {
      if (editId) {
        await dispatch(updateProduct({ id: editId, data })).unwrap();
      } else {
        await dispatch(createProduct(data)).unwrap();
      }
      setShowForm(false); setEditId(null);
      setForm({ name: '', price: '', description: '', stock: '', image_url: '', category_id: '' });
    } catch (err) {
      setFormError(err?.message || 'Failed to save product');
    }
  };

  const startEdit = (p) => {
    setForm({ name: p.name, price: String(p.price), description: p.description || '', stock: String(p.stock), image_url: p.image_url || '', category_id: String(p.category_id || '') });
    setEditId(p.id); setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    dispatch(deleteProduct(id));
  };

  const handleStatusChange = (orderId, status) => {
    dispatch(updateOrderStatus({ orderId, status }));
  };

  const STATUS_COLORS = {
    pending: '#fef3c7', processing: '#dbeafe', shipped: '#d1fae5', delivered: '#f0fdf4', cancelled: '#fee2e2'
  };

  return (
    <div style={{ paddingTop: 64, minHeight: '100vh', background: '#f5f2ee', fontFamily: 'Jost, sans-serif' }}>
      <div className="flex h-screen pt-16" style={{ height: 'calc(100vh - 64px)' }}>
        {/* Sidebar */}
        <aside className="w-56 bg-[#0a0a0a] flex-shrink-0 overflow-y-auto">
          <div className="p-6">
            <p className="text-xs text-white/40 font-semibold tracking-widest uppercase mb-6">Admin Panel</p>
            <nav className="space-y-1">
              {SECTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSection(s)}
                  className={`sidebar-link w-full text-left ${section === s ? 'active' : ''}`}
                  style={{
                    color: section === s ? '#c9a84c' : 'rgba(255,255,255,0.45)',
                    borderLeftColor: section === s ? '#c9a84c' : 'transparent',
                    background: section === s ? 'rgba(201,168,76,0.08)' : 'transparent',
                  }}
                >
                  {s === 'Dashboard' ? <FaChartBar /> : s === 'Products' ? <FaTshirt /> : s === 'Orders' ? <FaBoxOpen /> : <FaUsers />} {s}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-8">
          {/* ── DASHBOARD ── */}
          {section === 'Dashboard' && (
            <div>
              <SectionHeader title="Dashboard Overview" />
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                <StatCard title="Total Products" value={products.length} icon={<FaTshirt />} color="#c9a84c" />
                <StatCard title="Total Orders"   value={allOrders.length} icon={<FaBoxOpen />} color="#3b82f6" />
                <StatCard title="Total Users"    value={users.length || '—'} icon={<FaUsers />} color="#10b981" />
                <StatCard title="Revenue"        value={`$${totalRevenue.toFixed(0)}`} icon={<FaMoneyBillWave />} color="#8b5cf6" />
              </div>

              {/* Recent orders */}
              <h3 className="text-sm font-semibold tracking-widest uppercase mb-4 text-[#9e9589]">Recent Orders</h3>
              <div className="bg-white overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#ece9e3]">
                      {['Invoice', 'Customer', 'Amount', 'Status', 'Date'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold tracking-widest uppercase text-[#9e9589]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allOrders.slice(0, 8).map((o) => (
                      <tr key={o.id} className="border-b border-[#f5f2ee] hover:bg-[#f9f8f6]">
                        <td className="px-4 py-3 font-medium text-xs">{o.invoice_number || `#${o.id}`}</td>
                        <td className="px-4 py-3">{o.customer?.name || '—'}</td>
                        <td className="px-4 py-3 font-semibold">${Number(o.totalAmount || o.total_amount).toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-semibold px-2 py-1 rounded-sm"
                            style={{ background: STATUS_COLORS[o.status] || '#f5f5f5' }}>
                            {o.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#9e9589] text-xs">
                          {new Date(o.createdAt || o.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── PRODUCTS ── */}
          {section === 'Products' && (
            <div>
              <SectionHeader
                title="Product Management"
                action={
                  <button
                    onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ name: '', price: '', description: '', stock: '', image_url: '', category_id: '' }); }}
                    className="btn-primary"
                    style={{ padding: '10px 20px', fontSize: 11 }}
                  >
                    {showForm ? '✕ Cancel' : '+ Add Product'}
                  </button>
                }
              />

              {/* Product form */}
              {showForm && (
                <form onSubmit={handleProductSubmit} className="bg-white p-8 mb-8 animate-fadeUp">
                  <h3 className="text-sm font-semibold tracking-widest uppercase mb-6">
                    {editId ? 'Edit Product' : 'New Product'}
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold tracking-widest uppercase text-[#9e9589] mb-2">Name *</label>
                      <input required className="input-fashion" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Product name" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold tracking-widest uppercase text-[#9e9589] mb-2">Price *</label>
                      <input required type="number" step="0.01" min="0" className="input-fashion" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="99.99" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold tracking-widest uppercase text-[#9e9589] mb-2">Stock</label>
                      <input type="number" min="0" className="input-fashion" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} placeholder="0" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold tracking-widest uppercase text-[#9e9589] mb-2">Category</label>
                      <select className="input-fashion" value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}>
                        <option value="">— Select —</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold tracking-widest uppercase text-[#9e9589] mb-2">Image URL</label>
                      <input className="input-fashion" value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold tracking-widest uppercase text-[#9e9589] mb-2">Description</label>
                      <textarea rows={3} className="input-fashion resize-none" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Product description…" />
                    </div>
                  </div>
                  {formError && <p className="text-red-500 text-xs mt-3">{formError}</p>}
                  <div className="flex gap-3 mt-6">
                    <button type="submit" className="btn-primary" style={{ padding: '10px 24px' }}>
                      {editId ? 'Update Product' : 'Create Product'}
                    </button>
                    <button type="button" onClick={() => { setShowForm(false); setEditId(null); }} className="btn-outline" style={{ padding: '10px 24px' }}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Products table */}
              <div className="bg-white overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#ece9e3]">
                      {['Image', 'Name', 'Category', 'Price', 'Stock', 'Actions'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold tracking-widest uppercase text-[#9e9589]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.id} className="border-b border-[#f5f2ee] hover:bg-[#f9f8f6]">
                        <td className="px-4 py-3">
                          <div className="w-12 h-14 bg-[#ece9e3] overflow-hidden">
                            <img src={p.image_url || 'https://via.placeholder.com/48'} alt={p.name} className="w-full h-full object-cover" />
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium max-w-xs">
                          <p className="truncate" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 15 }}>{p.name}</p>
                        </td>
                        <td className="px-4 py-3 text-[#9e9589] text-xs">{p.category_name || '—'}</td>
                        <td className="px-4 py-3 font-semibold">${Number(p.price).toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold ${p.stock === 0 ? 'text-red-500' : p.stock <= 5 ? 'text-amber-500' : 'text-green-600'}`}>
                            {p.stock}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button onClick={() => startEdit(p)} className="text-xs underline text-[#3d3b39] hover:text-[#0a0a0a]">Edit</button>
                            <button onClick={() => handleDelete(p.id)} className="text-xs underline text-red-400 hover:text-red-600">Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {prodLoading && <div className="text-center py-8 text-[#9e9589] text-sm">Loading…</div>}
                {!prodLoading && products.length === 0 && (
                  <div className="text-center py-12 text-[#9e9589] text-sm">No products yet.</div>
                )}
              </div>
            </div>
          )}

          {/* ── ORDERS ── */}
          {section === 'Orders' && (
            <div>
              <SectionHeader title="Order Management" />
              <div className="bg-white overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#ece9e3]">
                      {['Invoice', 'Customer', 'Items', 'Total', 'Payment', 'Status', 'Date', 'Action'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold tracking-widest uppercase text-[#9e9589]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allOrders.map((o) => {
                      const items = typeof o.items === 'string' ? JSON.parse(o.items || '[]') : (o.items || []);
                      return (
                        <tr key={o.id} className="border-b border-[#f5f2ee] hover:bg-[#f9f8f6]">
                          <td className="px-4 py-3 text-xs font-medium">{o.invoice_number || `#${o.id}`}</td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-xs">{o.customer?.name || '—'}</p>
                            <p className="text-[10px] text-[#9e9589]">{o.customer?.email}</p>
                          </td>
                          <td className="px-4 py-3 text-xs">{items.length} item{items.length !== 1 ? 's' : ''}</td>
                          <td className="px-4 py-3 font-semibold">${Number(o.totalAmount || o.total_amount).toFixed(2)}</td>
                          <td className="px-4 py-3 text-xs capitalize">{o.paymentStatus || o.payment_status}</td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-semibold px-2 py-1 rounded-sm"
                              style={{ background: STATUS_COLORS[o.status] || '#f5f5f5' }}>
                              {o.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-[#9e9589]">
                            {new Date(o.createdAt || o.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={o.status}
                              onChange={(e) => handleStatusChange(o.id, e.target.value)}
                              className="text-xs border border-[#d1ccc6] bg-transparent px-2 py-1 outline-none"
                            >
                              {STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {ordLoading && <div className="text-center py-8 text-[#9e9589] text-sm">Loading…</div>}
                {!ordLoading && allOrders.length === 0 && (
                  <div className="text-center py-12 text-[#9e9589] text-sm">No orders yet.</div>
                )}
              </div>
            </div>
          )}

          {/* ── USERS ── */}
          {section === 'Users' && (
            <div>
              <SectionHeader title="User Management" />
              <div className="bg-white overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#ece9e3]">
                      {['#', 'Name', 'Email', 'Role', 'Joined', 'Status'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold tracking-widest uppercase text-[#9e9589]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b border-[#f5f2ee] hover:bg-[#f9f8f6]">
                        <td className="px-4 py-3 text-[#9e9589] text-xs">{u.id}</td>
                        <td className="px-4 py-3 font-medium">{u.name || '—'}</td>
                        <td className="px-4 py-3 text-[#9e9589] text-xs">{u.email}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold px-2 py-1 rounded-sm ${u.role === 'admin' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-700'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-[#9e9589]">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold ${u.is_active ? 'text-green-600' : 'text-red-500'}`}>
                            {u.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {users.length === 0 && (
                  <div className="text-center py-12 text-[#9e9589] text-sm">Loading users…</div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );

}
