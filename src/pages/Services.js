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
    <div style={{ background: '#f5f5f5', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ background: '#1B4332', padding: '28px 0 0' }}>
        <div className="container">
          <h1 style={{ color: '#FFD966', fontSize: '1.8rem', fontWeight: 800, marginBottom: '4px' }}>
            🍽️ Service Unit
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', marginBottom: '16px' }}>
            Registered restaurants in Lusaka — order food & view menus
          </p>
          <input
            type="text"
            placeholder="🔍  Search restaurants by name or location..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '12px 18px', borderRadius: '40px', border: 'none', background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', marginBottom: '20px' }}
          />
        </div>
      </div>

      <div className="container" style={{ padding: '20px 20px' }}>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#4A6080' }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⏳</div>
            <p>Loading restaurants...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#4A6080' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🍽️</div>
            <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>No restaurants listed yet.</p>
            <p style={{ marginTop: '8px', fontSize: '0.88rem' }}>Be the first to list your restaurant on TULI.</p>
            <button onClick={() => navigate('/seller/register')} className="btn-primary" style={{ marginTop: '20px' }}>
              List your restaurant →
            </button>
          </div>
        ) : (
          <>
            <p style={{ color: '#888', fontSize: '0.82rem', marginBottom: '12px' }}>
              {filtered.length} restaurant{filtered.length !== 1 ? 's' : ''} found
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              {filtered.map(r => {
                const online = r.last_seen && (new Date() - new Date(r.last_seen + 'Z')) / 1000 < 120;
                return (
                  <div
                    key={r.id}
                    onClick={() => navigate(`/restaurant/${r.id}`)}
                    style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
                  >
                    <div style={{ position: 'relative', height: '130px', background: '#FFF3E0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {r.cover_image || r.logo_url
                        ? <img src={r.cover_image || r.logo_url} alt={r.shop_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span style={{ fontSize: '3rem' }}>🍽️</span>}
                      <span style={{ position: 'absolute', top: '8px', left: '8px', background: online ? '#27AE60' : '#E74C3C', color: '#fff', fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: '20px' }}>
                        {online ? '● Open' : '● Closed'}
                      </span>
                    </div>
                    <div style={{ padding: '10px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <p style={{ color: '#1B4332', fontWeight: 700, fontSize: '0.88rem', marginBottom: '4px' }}>{r.shop_name}</p>
                      <p style={{ color: '#888', fontSize: '0.72rem', marginBottom: '2px' }}>📍 {r.location}</p>
                      <p style={{ color: '#E67E22', fontWeight: 700, fontSize: '0.78rem', marginBottom: '10px' }}>
                        🍛 {r.item_count || 0} item{r.item_count !== 1 ? 's' : ''} on menu
                      </p>
                      <button style={{ background: '#1B4332', color: '#FFD966', border: 'none', borderRadius: '20px', padding: '7px', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', marginTop: 'auto' }}>
                        View Menu →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* CTA */}
        <div style={{ marginTop: '32px', background: '#1B4332', borderRadius: '24px', padding: '28px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🍽️</div>
          <h3 style={{ color: '#FFD966', marginBottom: '8px', fontSize: '1.2rem' }}>Own a restaurant in Lusaka?</h3>
          <p style={{ color: 'rgba(255,255,255,0.75)', marginBottom: '20px', fontSize: '0.88rem' }}>
            Register on TULI's Service Unit — list your menu and start receiving orders. First month free.
          </p>
          <a href="/seller/register" className="btn-primary" style={{ fontSize: '0.9rem', padding: '10px 28px' }}>
            Register Restaurant →
          </a>
        </div>

      </div>
    </div>
  );
};

export default Services;
