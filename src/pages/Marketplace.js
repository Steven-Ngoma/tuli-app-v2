import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ImageCarousel from '../components/ImageCarousel';

const API = 'https://tuli-backend-44vd.onrender.com';

const CATEGORIES = [
  { label: 'All', icon: '🛍️' },
  { label: 'Food & Drinks', icon: '🍛' },
  { label: 'Clothes', icon: '👗' },
  { label: 'Shoes', icon: '👟' },
  { label: 'Electronics', icon: '📱' },
  { label: 'Home Goods', icon: '🛋️' },
  { label: 'Other', icon: '📦' },
];

const Marketplace = () => {
  const [products, setProducts] = useState([]);
  const [shops, setShops] = useState([]);
  const [tab, setTab] = useState('products');
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    const url = tab === 'shops'
      ? `${API}/shops`
      : tab === 'food'
      ? `${API}/restaurants`
      : `${API}/products`;
    fetch(url)
      .then(r => r.json())
      .then(data => {
        if (tab === 'products') setProducts(Array.isArray(data) ? data : []);
        else setShops(Array.isArray(data) ? data : []);
      })
      .catch(() => { setProducts([]); setShops([]); })
      .finally(() => setLoading(false));
  }, [tab]);

  const filteredProducts = products.filter(p => {
    const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.shop_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.location?.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'All' ||
      (category === 'Food & Drinks' ? p.category === 'Restaurant & Food' : p.category === category);
    return matchSearch && matchCat;
  });

  const filteredShops = shops.filter(s =>
    s.shop_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.location?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ background: '#f5f5f5', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ background: '#1B4332', padding: '24px 0 0' }}>
        <div className="container">
          <h1 style={{ color: '#FFD966', fontSize: '1.8rem', fontWeight: 800, marginBottom: '4px' }}>
            🛒 TULI Marketplace
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', marginBottom: '16px' }}>
            Browse listings from sellers across Zambia
          </p>

          {/* Search */}
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '1rem' }}>🔍</span>
            <input
              type="text"
              placeholder="Search products, shops, location..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '12px 16px 12px 40px', borderRadius: '40px', border: 'none', background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0', borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
            {[
              { key: 'products', label: '📦 Products' },
              { key: 'shops', label: '🏪 Shops' },
              { key: 'food', label: '🍛 Food' },
            ].map(t => (
              <button key={t.key} onClick={() => { setTab(t.key); setSearch(''); setCategory('All'); }}
                style={{
                  padding: '10px 20px', border: 'none', cursor: 'pointer', fontWeight: 700,
                  fontSize: '0.88rem', background: 'transparent',
                  color: tab === t.key ? '#F39C12' : 'rgba(255,255,255,0.6)',
                  borderBottom: tab === t.key ? '3px solid #F39C12' : '3px solid transparent',
                  transition: '0.2s', marginBottom: '-2px'
                }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '16px 28px' }}>

        {/* Category Filter - only for products tab */}
        {tab === 'products' && (
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '16px', scrollbarWidth: 'none' }}>
            {CATEGORIES.map(cat => (
              <button key={cat.label} onClick={() => setCategory(cat.label)}
                style={{
                  padding: '8px 16px', borderRadius: '40px', border: 'none', cursor: 'pointer',
                  fontWeight: 600, fontSize: '0.82rem', whiteSpace: 'nowrap',
                  background: category === cat.label ? '#1B4332' : '#fff',
                  color: category === cat.label ? '#FFD966' : '#4A6080',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)', transition: '0.2s'
                }}>
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#4A6080' }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⏳</div>
            <p>Loading...</p>
          </div>
        ) : tab === 'products' ? (
          <>
            <p style={{ color: '#888', fontSize: '0.82rem', marginBottom: '12px' }}>
              {filteredProducts.length} item{filteredProducts.length !== 1 ? 's' : ''} found
            </p>
            {filteredProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#4A6080' }}>
                <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🔍</div>
                <p style={{ fontSize: '1.1rem' }}>No products found</p>
                <p style={{ fontSize: '0.85rem', marginTop: '8px' }}>Try a different search or category</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                {filteredProducts.map(product => {
                  const online = product.last_seen && (new Date() - new Date(product.last_seen + 'Z')) / 1000 < 120;
                  return (
                    <div key={product.id}
                      onClick={() => navigate(`/shop/${product.seller_id}`)}
                      style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ position: 'relative' }}>
                        <ImageCarousel images={product.images || (product.image_url ? [product.image_url] : [])} height="130px" />
                        <span style={{
                          position: 'absolute', top: '8px', left: '8px',
                          background: online ? '#27AE60' : '#E74C3C',
                          color: '#fff', fontSize: '0.65rem', fontWeight: 700,
                          padding: '2px 8px', borderRadius: '20px'
                        }}>
                          {online ? '● Online' : '● Offline'}
                        </span>
                      </div>
                      <div style={{ padding: '10px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <p style={{ color: '#1B4332', fontWeight: 700, fontSize: '0.88rem', marginBottom: '2px' }}>{product.name}</p>
                        <p style={{ color: '#E67E22', fontWeight: 800, fontSize: '1rem', marginBottom: '4px' }}>{product.price}</p>
                        <p style={{ color: '#888', fontSize: '0.72rem', marginBottom: '2px' }}>🏪 {product.shop_name}</p>
                        <p style={{ color: '#888', fontSize: '0.72rem', marginBottom: '10px' }}>📍 {product.location}</p>
                        <button
                          onClick={e => { e.stopPropagation(); navigate(`/chat/${product.seller_id}/${product.id}?product=${encodeURIComponent(product.name)}&shop=${encodeURIComponent(product.shop_name)}&price=${encodeURIComponent(product.price)}`); }}
                          style={{ background: '#1B4332', color: '#FFD966', border: 'none', borderRadius: '20px', padding: '7px', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', marginTop: 'auto' }}>
                          💬 Chat Seller
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <>
            <p style={{ color: '#888', fontSize: '0.82rem', marginBottom: '12px' }}>
              {filteredShops.length} {tab === 'food' ? 'restaurant' : 'shop'}{filteredShops.length !== 1 ? 's' : ''} found
            </p>
            {filteredShops.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#4A6080' }}>
                <div style={{ fontSize: '3rem', marginBottom: '12px' }}>{tab === 'food' ? '🍛' : '🏪'}</div>
                <p style={{ fontSize: '1.1rem' }}>No {tab === 'food' ? 'restaurants' : 'shops'} found</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                {filteredShops.map(shop => {
                  const online = shop.last_seen && (new Date() - new Date(shop.last_seen + 'Z')) / 1000 < 120;
                  const coverImg = shop.cover_image || shop.logo_url;
                  return (
                    <div key={shop.id}
                      onClick={() => navigate(tab === 'food' ? `/restaurant/${shop.id}` : `/shop/${shop.id}`)}
                      style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ position: 'relative', height: '130px', background: '#1B4332', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {coverImg
                          ? <img src={coverImg} alt={shop.shop_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <span style={{ fontSize: '3rem' }}>{tab === 'food' ? '🍛' : '🏪'}</span>}
                        <span style={{ position: 'absolute', top: '8px', left: '8px', background: online ? '#27AE60' : '#E74C3C', color: '#fff', fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: '20px' }}>
                          {online ? '● Open' : '● Closed'}
                        </span>
                      </div>
                      <div style={{ padding: '10px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <p style={{ color: '#1B4332', fontWeight: 700, fontSize: '0.88rem', marginBottom: '4px' }}>{shop.shop_name}</p>
                        <p style={{ color: '#888', fontSize: '0.72rem', marginBottom: '2px' }}>📍 {shop.location}</p>
                        <p style={{ color: '#E67E22', fontWeight: 700, fontSize: '0.78rem', marginBottom: '10px' }}>
                          {tab === 'food' ? `${shop.item_count || 0} items on menu` : `${shop.product_count || 0} products`}
                        </p>
                        <button style={{ background: '#1B4332', color: '#FFD966', border: 'none', borderRadius: '20px', padding: '7px', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', marginTop: 'auto' }}>
                          {tab === 'food' ? 'View Menu →' : 'View Shop →'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Sell CTA */}
        <div style={{ marginTop: '32px', background: '#1B4332', borderRadius: '24px', padding: '28px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>💼</div>
          <h3 style={{ color: '#FFD966', marginBottom: '8px', fontSize: '1.2rem' }}>Want to list on TULI?</h3>
          <p style={{ color: 'rgba(255,255,255,0.75)', marginBottom: '20px', fontSize: '0.88rem' }}>
            Register for free and start selling your products or food to customers across Zambia
          </p>
          <a href="/seller/register" className="btn-primary" style={{ fontSize: '0.9rem', padding: '10px 28px' }}>
            Start Selling →
          </a>
        </div>

      </div>
    </div>
  );
};

export default Marketplace;
