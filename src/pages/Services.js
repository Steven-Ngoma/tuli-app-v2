import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Services = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('https://tuli-backend-44vd.onrender.com/restaurants')
      .then(res => res.json())
      .then(setRestaurants)
      .catch(() => setRestaurants([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = restaurants.filter(r =>
    r.shop_name.toLowerCase().includes(search.toLowerCase()) ||
    r.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: '40px 0', background: '#ffffff' }}>
      <div className="container">

        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '2.3rem', fontWeight: 700, color: '#1B4332', marginBottom: '8px' }}>🤝 Services</h1>
          <p style={{ color: '#4A6080' }}>Browse service providers across Zambia.</p>
        </div>

        {/* Category pill — Restaurant only for now */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
          <span style={{ background: '#F39C12', color: '#1B4332', borderRadius: '40px', padding: '8px 20px', fontWeight: 700, fontSize: '0.9rem' }}>
            🍽️ Restaurants & Food
          </span>
        </div>

        {/* Search */}
        <div style={{ marginBottom: '28px' }}>
          <input
            type="text" placeholder="Search restaurants by name or location..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '12px 16px', borderRadius: '40px', border: '1px solid #ccc', background: '#f5f7fa', color: '#1B4332', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#4A6080' }}>
            <p style={{ fontSize: '1.2rem' }}>Loading restaurants...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#4A6080' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🍽️</div>
            <p style={{ fontSize: '1.2rem', fontWeight: 600 }}>No restaurants listed yet.</p>
            <p style={{ marginTop: '8px' }}>Be the first to list your restaurant on TULI.</p>
            <button onClick={() => navigate('/seller/register')} className="btn-primary" style={{ marginTop: '20px' }}>
              List your restaurant →
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }} className="products-grid">
            {filtered.map(r => {
              const online = r.last_seen && (new Date() - new Date(r.last_seen + 'Z')) / 1000 < 120;
              return (
                <div
                  key={r.id}
                  onClick={() => navigate(`/restaurant/${r.id}`)}
                  style={{ background: '#ffffff', borderRadius: '24px', border: '1px solid #e0e0e0', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden', cursor: 'pointer', transition: '0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 6px 24px rgba(243,156,18,0.2)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'}
                >
                  {/* Cover image or placeholder */}
                  <div style={{ width: '100%', height: '140px', background: r.cover_image ? 'transparent' : '#FFF3E0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {r.cover_image
                      ? <img src={r.cover_image} alt={r.shop_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: '4rem' }}>🍽️</span>
                    }
                  </div>

                  <div style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <h3 style={{ color: '#1B4332', fontSize: '1.1rem', fontWeight: 700 }}>{r.shop_name}</h3>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                        <span className={online ? 'dot-online' : 'dot-offline'} style={{ width: '8px', height: '8px', borderRadius: '50%', background: online ? '#27AE60' : '#E74C3C', display: 'inline-block' }} />
                        <span style={{ color: online ? '#27AE60' : '#E74C3C', fontSize: '0.75rem', fontWeight: 600 }}>{online ? 'Open' : 'Closed'}</span>
                      </span>
                    </div>
                    <p style={{ color: '#6B8CAE', fontSize: '0.82rem', marginBottom: '4px' }}>📍 {r.location}</p>
                    <p style={{ color: '#9BB7D4', fontSize: '0.78rem', marginBottom: '14px' }}>🍛 {r.item_count || 0} item{r.item_count !== 1 ? 's' : ''} on menu</p>
                    <button className="btn-primary" style={{ width: '100%', fontSize: '0.85rem', padding: '8px' }}>
                      View Menu →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* CTA */}
        <div style={{ marginTop: '48px', background: '#1B4332', borderRadius: '32px', padding: '36px', textAlign: 'center' }}>
          <h3 style={{ color: '#FFD966', marginBottom: '12px' }}>Own a restaurant or food business?</h3>
          <p style={{ color: '#B8D0E7', marginBottom: '24px' }}>List your menu on TULI and start receiving orders. First month free.</p>
          <a href="/seller/register" className="btn-primary">List your restaurant →</a>
        </div>

      </div>
    </div>
  );
};

export default Services;
