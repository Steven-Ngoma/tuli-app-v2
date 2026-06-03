import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API } from '../../api';

const DriverLogin = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ phone: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/drivers/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Login failed');
      localStorage.setItem('driver', JSON.stringify(data));
      navigate('/driver/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#1B4332', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: '#102433', borderRadius: '28px', padding: '36px 28px', width: '100%', maxWidth: '420px', border: '1px solid #244C66' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '3rem' }}>🛵</div>
          <h2 style={{ color: '#FFD966', fontSize: '1.6rem', fontWeight: 800, margin: '8px 0 4px' }}>Driver Login</h2>
          <p style={{ color: '#9BB7D4', fontSize: '0.88rem' }}>Sign in to see available deliveries</p>
        </div>

        {error && <div style={{ background: '#E74C3C20', border: '1px solid #E74C3C', color: '#E74C3C', padding: '10px 16px', borderRadius: '12px', marginBottom: '16px', fontSize: '0.88rem' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input placeholder="Phone number" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required
            style={{ padding: '12px 16px', borderRadius: '40px', border: '1px solid #244C66', background: '#1B4332', color: '#EFF3F8', fontSize: '0.95rem', outline: 'none' }} />
          <input placeholder="Password" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required
            style={{ padding: '12px 16px', borderRadius: '40px', border: '1px solid #244C66', background: '#1B4332', color: '#EFF3F8', fontSize: '0.95rem', outline: 'none' }} />
          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '8px' }}>
            {loading ? 'Logging in...' : 'Login →'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '16px', color: '#9BB7D4', fontSize: '0.85rem' }}>
          New driver?{' '}
          <span onClick={() => navigate('/driver/register')} style={{ color: '#F39C12', cursor: 'pointer', fontWeight: 600 }}>Register here</span>
        </p>
      </div>
    </div>
  );
};

export default DriverLogin;
