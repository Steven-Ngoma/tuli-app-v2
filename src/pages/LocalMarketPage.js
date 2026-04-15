import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ImageCarousel from '../components/ImageCarousel';

const LocalMarketPage = () => {
  const { sellerId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`https://tuli-backend-44vd.onrender.com/market/${sellerId}`)
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sellerId]);

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '80px 20px', color: '#4A6080' }}>
      <p style={{ fontSize: '1.2rem' }}>Loading market stall...</p>
    </div>
  );

  if (!data) return (
    <div style={{ textAlign: 'center', padding: '80px 20px', color: '#4A6080' }}>
      <p>Market stall not found.</p>
    </div>
  );

  const { shop, products } = data;
  const online = shop.last_seen && (new Date() - new Date(shop.last_seen + 'Z')) / 1000 < 120;

  const grouped = products.reduce((acc, item) => {
    const cat = item.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const categoryIcons = {
    'Vegetables': '🥦', 'Fruits': '🍎', 'Meat & Fish': '🥩',
    'Grains & Mealie Meal': '🌽', 'Cooking Oil & Spices': '🫙',
    'Eggs & Dairy': '🥚', 'Other': '🛒'
  };

  return (
    <div style={{ background: '#ffffff', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: '#1B4332', padding: '32px 0 24px' }}>
        <div className="container">
          <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: 'none', color: '#F39C12', fontSize: '1.2rem', cursor: 'pointer', marginBottom: '16px', padding: 0 }}>
            ← Back
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', overflow: 'hidden', background: '#F39C1220', border: '3px solid #F39C12', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
              {shop.logo_url ? <img src={shop.logo_url} alt={shop.shop_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🛒'}
            </div>
            <div>
              <h1 style={{ color: '#FFD966', fontSize: '1.8rem', fontWeight: 800 }}>{shop.shop_name}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px', flexWrap: 'wrap' }}>
                <span style={{ color: '#9BB7D4', fontSize: '0.85rem' }}>📍 {shop.location}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span className={online ? 'dot-online' : 'dot-offline'} style={{ width: '8px', height: '8px', borderRadius: '50%', background: online ? '#27AE60' : '#E74C3C', display: 'inline-block' }} />
                  <span style={{ color: online ? '#27AE60' : '#E74C3C', fontSize: '0.82rem', fontWeight: 600 }}>{online ? 'Open' : 'Closed'}</span>
                </span>
                <span style={{ background: '#F39C1220', color: '#F39C12', borderRadius: '20px', padding: '3px 10px', fontSize: '0.78rem', fontWeight: 700 }}>🚚 Delivery Available</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '32px 28px' }}>
        {products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#4A6080' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🛒</div>
            <p style={{ fontSize: '1.1rem' }}>No items listed yet.</p>
          </div>
        ) : Object.keys(grouped).map(cat => (
          <div key={cat} style={{ marginBottom: '40px' }}>
            <h2 style={{ color: '#1B4332', fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px', paddingBottom: '8px', borderBottom: '2px solid #F39C12', display: 'inline-block' }}>
              {categoryIcons[cat] || '🛒'} {cat}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px' }} className="products-grid">
              {grouped[cat].map(item => (
                <div key={item.id} style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e0e0e0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <ImageCarousel images={item.images || (item.image_url ? [item.image_url] : [])} height="120px" />
                  <div style={{ padding: '10px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ color: '#1B4332', fontSize: '0.9rem', fontWeight: 700, marginBottom: '3px' }}>{item.name}</h3>
                    {item.description && <p style={{ color: '#6B8CAE', fontSize: '0.75rem', marginBottom: '4px' }}>{item.description}</p>}
                    <p style={{ color: '#E67E22', fontWeight: 700, fontSize: '0.95rem', marginBottom: '8px' }}>{item.price}</p>
                    <button
                      onClick={() => navigate(`/chat/${item.seller_id}/${item.id}?product=${encodeURIComponent(item.name)}&shop=${encodeURIComponent(shop.shop_name)}&price=${encodeURIComponent(item.price)}`)}
                      className="btn-primary"
                      style={{ width: '100%', fontSize: '0.78rem', padding: '7px', marginTop: 'auto' }}
                    >
                      🚚 Order & Deliver
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LocalMarketPage;
