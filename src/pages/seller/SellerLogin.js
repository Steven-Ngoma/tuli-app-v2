import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SellerLogin = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ phone: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('https://tuli-backend-44vd.onrender.com/sellers/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Login failed');
      localStorage.setItem('seller', JSON.stringify(data));
      navigate('/seller/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '60px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#102433', borderRadius: '32px', padding: '40px', width: '100%', maxWidth: '420px', border: '1px solid #244C66' }}>
        <h2 style={{ color: '#FFD966', marginBottom: '8px', fontSize: '1.8rem' }}>Seller Login</h2>
        <p style={{ color: '#9BB7D4', marginBottom: '28px' }}>Welcome back. Manage your listings below.</p>

        {error && (
          <div style={{ background: '#FF5722', color: 'white', padding: '12px 16px', borderRadius: '12px', marginBottom: '20px', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input
            name="phone" type="tel" placeholder="WhatsApp number"
            value={form.phone} onChange={handleChange} required
            style={{ padding: '14px 18px', borderRadius: '40px', border: '1px solid #244C66', background: '#1B4332', color: '#EFF3F8', fontSize: '0.95rem', outline: 'none' }}
          />
          <input
            name="password" type="password" placeholder="Password"
            value={form.password} onChange={handleChange} required
            style={{ padding: '14px 18px', borderRadius: '40px', border: '1px solid #244C66', background: '#1B4332', color: '#EFF3F8', fontSize: '0.95rem', outline: 'none' }}
          />
          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '8px' }}>
            {loading ? 'Logging in...' : 'Login →'}
          </button>
        </form>

        <p style={{ color: '#9BB7D4', textAlign: 'center', marginTop: '20px', fontSize: '0.9rem' }}>
          No account?{' '}
          <span onClick={() => navigate('/seller/register')} style={{ color: '#F39C12', cursor: 'pointer' }}>
            Register here
          </span>
        </p>
      </div>
    </div>
  );
};

export default SellerLogin;
