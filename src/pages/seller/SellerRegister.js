import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SellerRegister = () => {
  const navigate = useNavigate();
  const [shopType, setShopType] = useState('');
  const [form, setForm] = useState({ name: '', shop_name: '', phone: '', email: '', location: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('https://tuli-backend-44vd.onrender.com/sellers/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, shop_type: shopType })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Registration failed');
      localStorage.setItem('seller', JSON.stringify(data));
      navigate('/seller/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 1 — Choose shop type
  if (!shopType) {
    return (
      <div style={{ padding: '60px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: '560px' }}>
          <h2 style={{ color: '#FFD966', fontSize: '1.8rem', marginBottom: '8px', textAlign: 'center' }}>Open your shop on TULI</h2>
          <p style={{ color: '#9BB7D4', marginBottom: '36px', textAlign: 'center' }}>What type of shop are you opening?</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

            {/* Product Shop */}
            <div
              onClick={() => setShopType('product')}
              style={{ background: '#102433', borderRadius: '24px', padding: '28px 20px', border: '2px solid #244C66', cursor: 'pointer', textAlign: 'center', transition: '0.2s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#F39C12'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#244C66'}
            >
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📦</div>
              <h3 style={{ color: '#FFD966', marginBottom: '8px' }}>Product Shop</h3>
              <p style={{ color: '#9BB7D4', fontSize: '0.85rem', marginBottom: '16px' }}>Sell physical products — clothes, electronics, shoes, home goods and more.</p>
              <div style={{ background: '#F39C1220', borderRadius: '12px', padding: '10px' }}>
                <div style={{ color: '#F39C12', fontWeight: 700, fontSize: '0.9rem' }}>Free to list</div>
                <div style={{ color: '#9BB7D4', fontSize: '0.78rem', marginTop: '4px' }}>5% commission per sale only</div>
              </div>
            </div>

            {/* Service Shop */}
            <div
              onClick={() => setShopType('service')}
              style={{ background: '#102433', borderRadius: '24px', padding: '28px 20px', border: '2px solid #244C66', cursor: 'pointer', textAlign: 'center', transition: '0.2s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#27AE60'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#244C66'}
            >
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🤝</div>
              <h3 style={{ color: '#FFD966', marginBottom: '8px' }}>Service Shop</h3>
              <p style={{ color: '#9BB7D4', fontSize: '0.85rem', marginBottom: '16px' }}>Offer services — restaurants, food, repairs, catering and more.</p>
              <div style={{ background: '#27AE6020', borderRadius: '12px', padding: '10px' }}>
                <div style={{ color: '#27AE60', fontWeight: 700, fontSize: '0.9rem' }}>1 Month FREE</div>
                <div style={{ color: '#9BB7D4', fontSize: '0.78rem', marginTop: '4px' }}>Then K100/month rental fee</div>
              </div>
            </div>

            {/* Local Market */}
            <div
              onClick={() => setShopType('market')}
              style={{ background: '#102433', borderRadius: '24px', padding: '28px 20px', border: '2px solid #244C66', cursor: 'pointer', textAlign: 'center', transition: '0.2s', gridColumn: '1 / -1' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#F39C12'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#244C66'}
            >
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🛒</div>
              <h3 style={{ color: '#FFD966', marginBottom: '8px' }}>Local Market Stall</h3>
              <p style={{ color: '#9BB7D4', fontSize: '0.85rem', marginBottom: '16px' }}>Sell fresh produce, vegetables, fruits, meat, grains and daily essentials. Buyers order and get delivery to their homes.</p>
              <div style={{ background: '#F39C1220', borderRadius: '12px', padding: '10px' }}>
                <div style={{ color: '#F39C12', fontWeight: 700, fontSize: '0.9rem' }}>🚚 Delivery to homes</div>
                <div style={{ color: '#9BB7D4', fontSize: '0.78rem', marginTop: '4px' }}>Free to list · 5% commission per order</div>
              </div>
            </div>

          </div>

          <p style={{ color: '#4A6080', fontSize: '0.82rem', textAlign: 'center', marginTop: '24px' }}>
            Already registered? <span onClick={() => navigate('/seller/login')} style={{ color: '#F39C12', cursor: 'pointer' }}>Login here</span>
          </p>
        </div>
      </div>
    );
  }

  // Step 2 — Fill in details
  return (
    <div style={{ padding: '60px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#102433', borderRadius: '32px', padding: '40px', width: '100%', maxWidth: '480px', border: '1px solid #244C66' }}>

        {/* Shop type badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <button onClick={() => setShopType('')} style={{ background: 'transparent', border: 'none', color: '#F39C12', fontSize: '1.2rem', cursor: 'pointer', padding: 0 }}>←</button>
          <span style={{ background: shopType === 'service' ? '#27AE6020' : shopType === 'market' ? '#F39C1220' : '#F39C1220', color: shopType === 'service' ? '#27AE60' : '#F39C12', borderRadius: '20px', padding: '4px 14px', fontSize: '0.85rem', fontWeight: 700 }}>
            {shopType === 'service' ? '🤝 Service Shop' : shopType === 'market' ? '🛒 Local Market Stall' : '📦 Product Shop'}
          </span>
        </div>

        <h2 style={{ color: '#FFD966', marginBottom: '8px', fontSize: '1.8rem' }}>Create your shop</h2>

        {shopType === 'service' && (
          <div style={{ background: '#27AE6015', border: '1px solid #27AE6040', borderRadius: '16px', padding: '14px 16px', marginBottom: '20px' }}>
            <div style={{ color: '#27AE60', fontWeight: 700, fontSize: '0.9rem' }}>🎉 1 Month FREE trial</div>
            <div style={{ color: '#9BB7D4', fontSize: '0.82rem', marginTop: '4px' }}>After your free month, a K100/month rental fee applies to keep your service shop active on TULI.</div>
          </div>
        )}

        {shopType === 'product' && (
          <p style={{ color: '#9BB7D4', marginBottom: '24px', fontSize: '0.9rem' }}>Free to list. Only pay 5% commission when you sell.</p>
        )}

        {error && (
          <div style={{ background: '#FF5722', color: 'white', padding: '12px 16px', borderRadius: '12px', marginBottom: '20px', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[
            { name: 'name', placeholder: 'Your full name', type: 'text' },
            { name: 'shop_name', placeholder: shopType === 'service' ? 'Restaurant / business name' : 'Shop / business name', type: 'text' },
            { name: 'phone', placeholder: 'Phone number e.g. 0976123456', type: 'tel' },
            { name: 'email', placeholder: 'Email address (optional)', type: 'email' },
            { name: 'location', placeholder: 'Your location e.g. Lusaka - Kamwala', type: 'text' },
            { name: 'password', placeholder: 'Create a password', type: 'password' },
          ].map(field => (
            <input
              key={field.name} name={field.name} type={field.type} placeholder={field.placeholder}
              value={form[field.name]} onChange={handleChange} required={field.name !== 'email'}
              style={{ padding: '14px 18px', borderRadius: '40px', border: '1px solid #244C66', background: '#1B4332', color: '#EFF3F8', fontSize: '0.95rem', outline: 'none' }}
            />
          ))}

          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '8px' }}>
            {loading ? 'Creating shop...' : 'Open my shop →'}
          </button>
        </form>

        <p style={{ color: '#9BB7D4', textAlign: 'center', marginTop: '20px', fontSize: '0.9rem' }}>
          Already registered?{' '}
          <span onClick={() => navigate('/seller/login')} style={{ color: '#F39C12', cursor: 'pointer' }}>Login here</span>
        </p>
      </div>
    </div>
  );
};

export default SellerRegister;
