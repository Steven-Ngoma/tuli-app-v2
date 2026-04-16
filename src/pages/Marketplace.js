import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Marketplace = () => {
  const [tab, setTab] = useState('products');
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
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
    const url = tab === 'services'
      ? 'https://tuli-backend-44vd.onrender.com/restaurants'
      : 'https://tuli-backend-44vd.onrender.com/shops';
    fetch(url)
      .then(res => res.json())
      .then(data => setItems(data))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [tab]);

  const filtered = items.filter(item => {
    const name = item.shop_name || '';
    const loc = item.location || '';
    return name.toLowerCase().includes(search.toLowerCase()) ||
      loc.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div style={{ padding: '40px 0', background: '#ffffff' }}>
      <div className="container">

        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '2.3rem', fontWeight: 700, color: '#1B4332', marginBottom: '8px' }}>TULI Marketplace</h1>
          <p style={{ color: '#4A6080' }}>Browse listings from sellers across Zambia. Chat directly on TULI.</p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '28px' }}>
          {['products', 'services'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '10px 28px', borderRadius: '40px', border: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: '0.95rem',
              background: tab === t ? '#F39C12' : '#f5f7fa',
              color: tab === t ? '#1B4332' : '#4A6080', transition: '0.2s'
            }}>
              {t === 'products' ? '📦 Products' : '🤝 Services'}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ marginBottom: '28px' }}>
          <input
            type="text" placeholder="Search by shop name or location..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '12px 16px', borderRadius: '40px', border: '1px solid #ccc', background: '#f5f7fa', color: '#1B4332', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#4A6080' }}>
            <p style={{ fontSize: '1.2rem' }}>Loading...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#4A6080' }}>
            <p style={{ fontSize: '1.2rem' }}>No {tab === 'products' ? 'shops' : 'services'} found.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }} className="products-grid">
            {filtered.map(shop => {
              const online = shop.last_seen && (new Date() - new Date(shop.last_seen + 'Z')) / 1000 < 120;
              const isService = tab === 'services';
              const coverImg = isService
                ? (shop.logo_url || shop.cover_image)
                : (shop.cover_image || shop.logo_url);
              return (
                <div key={shop.id}
                  onClick={() => navigate(isService ? `/restaurant/${shop.id}` : `/shop/${shop.id}`)}
                  style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e0e0e0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
                >
                  <div style={{ width: '100%', height: '100px', background: '#1B4332', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {coverImg
                      ? <img src={coverImg} alt={shop.shop_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: '2.5rem' }}>{isService ? '🍽️' : '🏪'}</span>}
                  </div>
                  <div style={{ padding: '10px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <h3 style={{ color: '#1B4332', fontSize: '0.9rem', fontWeight: 700, margin: 0 }}>{shop.shop_name}</h3>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <span className={online ? 'dot-online' : 'dot-offline'} style={{ width: '7px', height: '7px', borderRadius: '50%', background: online ? '#27AE60' : '#E74C3C', display: 'inline-block' }} />
                        <span style={{ color: online ? '#27AE60' : '#E74C3C', fontSize: '0.7rem', fontWeight: 600 }}>{online ? 'Online' : 'Offline'}</span>
                      </span>
                    </div>
                    <p style={{ color: '#6B8CAE', fontSize: '0.75rem', marginBottom: '2px' }}>📍 {shop.location}</p>
                    <p style={{ color: '#9BB7D4', fontSize: '0.72rem', marginBottom: '8px' }}>
                      {isService ? `${shop.item_count || 0} items on menu` : `${shop.product_count || 0} product${shop.product_count !== 1 ? 's' : ''}`}
                    </p>
                    <button className="btn-primary" style={{ width: '100%', fontSize: '0.8rem', padding: '7px', marginTop: 'auto' }}>
                      {isService ? 'View Menu →' : 'View Products →'}
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
          <p style={{ color: '#B8D0E7', marginBottom: '24px' }}>Register as a seller and list your products or services for free.</p>
          <a href="/seller/register" className="btn-primary">Start Selling →</a>
        </div>

      </div>
    </div>
  );
};

export default Marketplace;
