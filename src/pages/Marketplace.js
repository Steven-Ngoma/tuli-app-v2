import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ImageCarousel from '../components/ImageCarousel';

const productCategories = ['All', 'Electronics', 'Shoes', 'Clothes', 'Home Goods', 'Books & Stationery', 'Other'];
const serviceCategories = ['All', 'Restaurant & Food'];

const Marketplace = () => {
  const [tab, setTab] = useState('products');
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('tab') === 'services') setTab('services');
  }, []);

  useEffect(() => {
    setLoading(true);
    setSearch('');
    setCategory('All');
    const url = tab === 'services'
      ? 'https://tuli-backend-44vd.onrender.com/restaurants'
      : 'https://tuli-backend-44vd.onrender.com/products';
    fetch(url)
      .then(res => res.json())
      .then(data => {
        const filtered = tab === 'products'
          ? data.filter(i => i.category !== 'Restaurant & Food')
          : data;
        setItems(filtered);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [tab]);

  const filtered = items.filter(item => {
    const name = tab === 'services' ? item.shop_name : item.name;
    const matchSearch =
      name.toLowerCase().includes(search.toLowerCase()) ||
      item.location.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'All' || item.category === category;
    return matchSearch && matchCat;
  });

  const categories = tab === 'products' ? productCategories : serviceCategories;
  const chatLabel = tab === 'products' ? '💬 Chat with Seller' : '💬 Order Now';
  const emptyMsg = tab === 'products' ? 'No products found.' : 'No services listed yet.';

  return (
    <div style={{ padding: '40px 0', background: '#ffffff' }}>
      <div className="container">

        {/* Page Header */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '2.3rem', fontWeight: 700, color: '#1B4332', marginBottom: '8px' }}>
            TULI Marketplace
          </h1>
          <p style={{ color: '#4A6080' }}>Browse listings from sellers across Zambia. Chat directly on TULI.</p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '28px' }}>
          <button
            onClick={() => setTab('products')}
            style={{
              padding: '10px 28px', borderRadius: '40px', border: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: '0.95rem',
              background: tab === 'products' ? '#F39C12' : '#f5f7fa',
              color: tab === 'products' ? '#1B4332' : '#4A6080',
              transition: '0.2s'
            }}
          >
            📦 Products
          </button>
          <button
            onClick={() => setTab('services')}
            style={{
              padding: '10px 28px', borderRadius: '40px', border: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: '0.95rem',
              background: tab === 'services' ? '#F39C12' : '#f5f7fa',
              color: tab === 'services' ? '#1B4332' : '#4A6080',
              transition: '0.2s'
            }}
          >
            🤝 Services
          </button>
        </div>

        {/* Search & Filter */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '28px' }}>
          <input
            type="text" placeholder="Search by name or location..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: '220px', padding: '12px 16px', borderRadius: '40px', border: '1px solid #ccc', background: '#f5f7fa', color: '#1B4332', fontSize: '0.95rem', outline: 'none' }}
          />
          <select
            value={category} onChange={e => setCategory(e.target.value)}
            style={{ padding: '12px 16px', borderRadius: '40px', border: '1px solid #ccc', background: '#f5f7fa', color: '#1B4332', fontSize: '0.95rem', cursor: 'pointer' }}
          >
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#4A6080' }}>
            <p style={{ fontSize: '1.2rem' }}>Loading...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#4A6080' }}>
            <p style={{ fontSize: '1.2rem' }}>{emptyMsg}</p>
            <p style={{ marginTop: '8px' }}>Try a different search or category.</p>
          </div>
        ) : tab === 'services' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }} className="products-grid">
            {filtered.map(r => {
              const online = r.last_seen && (new Date() - new Date(r.last_seen + 'Z')) / 1000 < 120;
              return (
                <div key={r.id} onClick={() => navigate(`/restaurant/${r.id}`)}
                  style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e0e0e0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
                >
                  <div style={{ width: '100%', height: '120px', background: '#FFF3E0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                    {r.cover_image
                      ? <img src={r.cover_image} alt={r.shop_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: '3rem' }}>🍽️</span>}
                  </div>
                  <div style={{ padding: '10px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <h3 style={{ color: '#1B4332', fontSize: '0.9rem', fontWeight: 700, margin: 0 }}>{r.shop_name}</h3>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <span className={online ? 'dot-online' : 'dot-offline'} style={{ width: '7px', height: '7px', borderRadius: '50%', background: online ? '#27AE60' : '#E74C3C', display: 'inline-block' }} />
                        <span style={{ color: online ? '#27AE60' : '#E74C3C', fontSize: '0.7rem', fontWeight: 600 }}>{online ? 'Open' : 'Closed'}</span>
                      </span>
                    </div>
                    <p style={{ color: '#6B8CAE', fontSize: '0.75rem', marginBottom: '2px' }}>📍 {r.location}</p>
                    <p style={{ color: '#9BB7D4', fontSize: '0.72rem', marginBottom: '8px' }}>{r.item_count || 0} items on menu</p>
                    <button className="btn-primary" style={{ width: '100%', fontSize: '0.8rem', padding: '7px', marginTop: 'auto' }}>View Menu →</button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }} className="products-grid">
            {filtered.map(item => {
              const online = item.last_seen && (new Date() - new Date(item.last_seen + 'Z')) / 1000 < 120;
              return (
                <div key={item.id} className="product-card" style={{ background: '#ffffff', borderRadius: '16px', padding: '0', border: '1px solid #e0e0e0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <ImageCarousel images={item.images || (item.image_url ? [item.image_url] : [])} height="120px" />
                  <div style={{ padding: '10px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <span style={{ background: '#FFF3E0', color: '#E67E22', fontSize: '0.7rem', fontWeight: 600, padding: '3px 10px', borderRadius: '20px', display: 'inline-block', marginBottom: '6px' }}>
                      {item.category}
                    </span>
                    <h3 style={{ color: '#1B4332', fontSize: '0.88rem', fontWeight: 700, marginBottom: '3px' }}>{item.name}</h3>
                    <p style={{ color: '#E67E22', fontWeight: 700, fontSize: '0.9rem', marginBottom: '3px' }}>{item.price}</p>
                    <p style={{ color: '#6B8CAE', fontSize: '0.72rem', marginBottom: '2px' }}>📍 {item.location}</p>
                    <p style={{ color: '#6B8CAE', fontSize: '0.72rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      🏪 {item.shop_name}
                      <span className={online ? 'dot-online' : 'dot-offline'} style={{ width: '7px', height: '7px', borderRadius: '50%', background: online ? '#27AE60' : '#E74C3C', display: 'inline-block', flexShrink: 0 }} />
                    </p>
                    <button
                      onClick={() => navigate(`/chat/${item.seller_id}/${item.id}?product=${encodeURIComponent(item.name)}&shop=${encodeURIComponent(item.shop_name)}&price=${encodeURIComponent(item.price)}`)}
                      className="btn-primary"
                      style={{ fontSize: '0.78rem', padding: '7px', width: '100%', marginTop: 'auto' }}
                    >
                      {chatLabel}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* CTA */}
        <div style={{ marginTop: '32px', background: '#1B4332', borderRadius: '32px', padding: '36px', textAlign: 'center' }}>
          <h3 style={{ color: '#FFD966', marginBottom: '12px' }}>Want to list on TULI?</h3>
          <p style={{ color: '#B8D0E7', marginBottom: '24px' }}>
            Register as a seller and list your products or services for free.
          </p>
          <a href="/seller/register" className="btn-primary">Start Selling →</a>
        </div>

      </div>
    </div>
  );
};

export default Marketplace;
