import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ImageCarousel from '../components/ImageCarousel';

const RestaurantMenu = () => {
  const { sellerId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`https://tuli-backend-44vd.onrender.com/restaurants/${sellerId}/menu`)
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sellerId]);

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '80px 20px', color: '#4A6080' }}>
      <p style={{ fontSize: '1.2rem' }}>Loading menu...</p>
    </div>
  );

  if (!data) return (
    <div style={{ textAlign: 'center', padding: '80px 20px', color: '#4A6080' }}>
      <p>Restaurant not found.</p>
    </div>
  );

  const { restaurant, menu } = data;
  const online = restaurant.last_seen && (new Date() - new Date(restaurant.last_seen + 'Z')) / 1000 < 120;

  // Group menu items by food_category
  const grouped = menu.reduce((acc, item) => {
    const cat = item.food_category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const categoryOrder = ['Starters', 'Main Course', 'Sides', 'Drinks', 'Desserts', 'Other'];
  const sortedGroups = Object.keys(grouped).sort((a, b) => {
    const ai = categoryOrder.indexOf(a);
    const bi = categoryOrder.indexOf(b);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  return (
    <div style={{ background: '#ffffff', minHeight: '100vh' }}>

      {/* Restaurant Header */}
      <div style={{ background: '#1B4332', padding: '32px 0 24px' }}>
        <div className="container">
          <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: 'none', color: '#F39C12', fontSize: '1.2rem', cursor: 'pointer', marginBottom: '16px', padding: 0 }}>
            ← Back
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ width: '64px', height: '64px', background: '#F39C1220', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', flexShrink: 0 }}>
              🍽️
            </div>
            <div>
              <h1 style={{ color: '#FFD966', fontSize: '1.8rem', fontWeight: 800 }}>{restaurant.shop_name}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px', flexWrap: 'wrap' }}>
                <span style={{ color: '#9BB7D4', fontSize: '0.85rem' }}>📍 {restaurant.location}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span className={online ? 'dot-online' : 'dot-offline'} style={{ width: '8px', height: '8px', borderRadius: '50%', background: online ? '#27AE60' : '#E74C3C', display: 'inline-block' }} />
                  <span style={{ color: online ? '#27AE60' : '#E74C3C', fontSize: '0.82rem', fontWeight: 600 }}>{online ? 'Open' : 'Closed'}</span>
                </span>
                <span style={{ color: '#9BB7D4', fontSize: '0.82rem' }}>{menu.length} item{menu.length !== 1 ? 's' : ''} on menu</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '32px 28px' }}>

        {menu.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#4A6080' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🍽️</div>
            <p style={{ fontSize: '1.1rem' }}>No menu items yet.</p>
          </div>
        ) : sortedGroups.map(cat => (
          <div key={cat} style={{ marginBottom: '40px' }}>
            <h2 style={{ color: '#1B4332', fontSize: '1.3rem', fontWeight: 700, marginBottom: '16px', paddingBottom: '8px', borderBottom: '2px solid #F39C12', display: 'inline-block' }}>
              {cat === 'Starters' ? '🥗' : cat === 'Main Course' ? '🍛' : cat === 'Drinks' ? '🥤' : cat === 'Desserts' ? '🍰' : cat === 'Sides' ? '🍟' : '🍽️'} {cat}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }} className="products-grid">
              {grouped[cat].map(item => (
                <div key={item.id} style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid #e0e0e0', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                  <ImageCarousel images={item.images || (item.image_url ? [item.image_url] : [])} height="130px" />
                  <div style={{ padding: '14px' }}>
                    <h3 style={{ color: '#1B4332', fontSize: '1rem', marginBottom: '4px' }}>{item.name}</h3>
                    {item.description && <p style={{ color: '#6B8CAE', fontSize: '0.82rem', marginBottom: '8px' }}>{item.description}</p>}
                    <p style={{ color: '#E67E22', fontWeight: 700, fontSize: '1.1rem', marginBottom: '12px' }}>{item.price}</p>
                    <button
                      onClick={() => navigate(`/chat/${item.seller_id}/${item.id}?product=${encodeURIComponent(item.name)}&shop=${encodeURIComponent(restaurant.shop_name)}&price=${encodeURIComponent(item.price)}`)}
                      className="btn-primary"
                      style={{ width: '100%', fontSize: '0.85rem', padding: '8px' }}
                    >
                      💬 Order Now
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

export default RestaurantMenu;
