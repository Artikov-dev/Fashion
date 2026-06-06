import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { fetchProducts, fetchCategories, setSortBy } from '../slices/productsSlice';
import ProductCard from '../components/ProductCard';
import Toast, { useToast } from '../components/Toast';

const SORT_OPTIONS = [
  { value: 'newest',     label: 'Newest' },
  { value: 'price-asc',  label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'name',       label: 'Name A–Z' },
];

const PER_PAGE = 12;

export default function Products() {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { filteredItems, categories, loading, sortBy } = useSelector((s) => s.products);
  const { toast, show } = useToast();

  const [search, setSearch]       = useState(searchParams.get('search') || '');
  const [catId, setCatId]         = useState(searchParams.get('category_id') || '');
  const [minPrice, setMinPrice]   = useState('');
  const [maxPrice, setMaxPrice]   = useState('');
  const [page, setPage]           = useState(1);
  const [sidebarOpen, setSidebar] = useState(false);

  const doFetch = useCallback(() => {
    const params = {};
    if (search)   params.search = search;
    if (catId)    params.category_id = catId;
    if (minPrice) params.min_price = minPrice;
    if (maxPrice) params.max_price = maxPrice;
    dispatch(fetchProducts(params));
    setPage(1);
  }, [dispatch, search, catId, minPrice, maxPrice]);

  useEffect(() => {
    dispatch(fetchCategories());
    doFetch();
  }, []);

  useEffect(() => { doFetch(); }, [catId]);

  const handleSearch = (e) => {
    e.preventDefault();
    doFetch();
  };

  const clearFilters = () => {
    setSearch(''); setCatId(''); setMinPrice(''); setMaxPrice('');
    dispatch(fetchProducts({}));
    setPage(1);
  };

  const totalPages = Math.ceil(filteredItems.length / PER_PAGE);
  const paged      = filteredItems.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div style={{ fontFamily: 'Jost, sans-serif', background: '#f5f2ee', paddingTop: 64, minHeight: '100vh' }}>
      <Toast toast={toast} />

      {/* Page header */}
      <div
        className="flex items-end px-8 md:px-16 pb-12 pt-20 relative"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1600&q=80')",
          backgroundSize: 'cover', backgroundPosition: 'center 40%', height: 280,
        }}
      >
        <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.55)' }} />
        <div className="relative text-white">
          <p className="text-xs tracking-[0.3em] uppercase text-[#c9a84c] mb-2">Discover</p>
          <h1 className="text-5xl font-light" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            All Products
          </h1>
          <p className="mt-2 text-sm text-white/60">{filteredItems.length} pieces</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10 flex gap-8">
        {/* ── Sidebar Filters ── */}
        <>
          {/* Mobile overlay */}
          {sidebarOpen && (
            <div className="mobile-overlay lg:hidden" onClick={() => setSidebar(false)} />
          )}

          <aside
            className={`fixed lg:static inset-y-0 left-0 z-50 lg:z-auto w-72 lg:w-64 bg-[#f5f2ee] lg:bg-transparent
              transition-transform duration-300 lg:translate-x-0 overflow-y-auto lg:overflow-visible
              ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
            style={{ paddingTop: sidebarOpen ? 80 : 0, flexShrink: 0 }}
          >
            <div className="sticky top-24 space-y-8 px-6 lg:px-0">
              <div className="flex justify-between items-center">
                <h2 className="text-xs font-semibold tracking-widest uppercase">Filters</h2>
                <button onClick={clearFilters} className="text-xs text-[#9e9589] underline">Clear All</button>
              </div>

              {/* Search */}
              <div>
                <p className="text-xs font-semibold tracking-widest uppercase text-[#9e9589] mb-3">Search</p>
                <form onSubmit={handleSearch} className="flex">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search products…"
                    className="input-fashion flex-1 text-sm"
                    style={{ padding: '10px 12px' }}
                  />
                  <button type="submit" className="px-3 bg-[#0a0a0a] text-white text-xs">→</button>
                </form>
              </div>

              {/* Category */}
              <div>
                <p className="text-xs font-semibold tracking-widest uppercase text-[#9e9589] mb-3">Category</p>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="radio" name="cat" checked={catId === ''} onChange={() => setCatId('')}
                      className="accent-[#0a0a0a]" />
                    <span className="text-sm">All</span>
                  </label>
                  {categories.map((c) => (
                    <label key={c.id} className="flex items-center gap-3 cursor-pointer">
                      <input type="radio" name="cat" checked={catId === String(c.id)} onChange={() => setCatId(String(c.id))}
                        className="accent-[#0a0a0a]" />
                      <span className="text-sm">{c.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div>
                <p className="text-xs font-semibold tracking-widest uppercase text-[#9e9589] mb-3">Price Range</p>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="input-fashion w-20 text-sm"
                    style={{ padding: '8px 10px' }}
                  />
                  <span className="text-[#9e9589]">—</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="input-fashion w-20 text-sm"
                    style={{ padding: '8px 10px' }}
                  />
                </div>
                <button onClick={doFetch} className="btn-primary mt-3" style={{ padding: '8px 20px', fontSize: 10 }}>
                  Apply
                </button>
              </div>
            </div>
          </aside>
        </>

        {/* ── Product Grid ── */}
        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <button
              onClick={() => setSidebar(true)}
              className="lg:hidden btn-outline"
              style={{ padding: '8px 16px', fontSize: 10 }}
            >
              ☰ Filters
            </button>

            <p className="text-sm text-[#9e9589]">{filteredItems.length} results</p>

            <select
              value={sortBy}
              onChange={(e) => dispatch(setSortBy(e.target.value))}
              className="input-fashion text-sm"
              style={{ width: 'auto', padding: '8px 16px' }}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
              {[...Array(8)].map((_, i) => (
                <div key={i}>
                  <div className="skeleton aspect-[3/4] mb-3" />
                  <div className="skeleton h-3 w-2/3 mb-2" />
                  <div className="skeleton h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : paged.length === 0 ? (
            <div className="text-center py-24 text-[#9e9589]">
              <div className="text-5xl mb-4">⎋</div>
              <p className="text-sm">No products found.</p>
              <button onClick={clearFilters} className="btn-outline mt-6" style={{ padding: '10px 24px', fontSize: 11 }}>
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
                {paged.map((p) => (
                  <ProductCard key={p.id} product={p} onAddToCart={(name) => show(`${name} added to cart`)} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-12">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="btn-outline disabled:opacity-40"
                    style={{ padding: '8px 16px', fontSize: 11 }}
                  >
                    ← Prev
                  </button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i + 1)}
                      className={`w-9 h-9 text-sm font-semibold border ${
                        page === i + 1
                          ? 'bg-[#0a0a0a] text-white border-[#0a0a0a]'
                          : 'border-[#d1ccc6] text-[#0a0a0a] hover:border-[#0a0a0a]'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="btn-outline disabled:opacity-40"
                    style={{ padding: '8px 16px', fontSize: 11 }}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
