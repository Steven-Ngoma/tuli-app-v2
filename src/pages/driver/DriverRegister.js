import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API = 'https://tuli-backend-44vd.onrender.com';

const ZONES = [
  'Lusaka CBD', 'Chilenje', 'Kabulonga', 'Woodlands', 'Kalingalinga',
  'Mtendere', 'Kamwala', 'Chelston', 'Chawama', 'Matero',
  'Northmead', 'Emmasdale', 'Libala', 'Olympia', 'Rhodes Park',
  'Avondale', 'Thornpark', 'Makeni', 'Ibex Hill', 'Meanwood'
];

const DriverRegister = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', phone: '', zone: 'Lusaka CBD', vehicle: 'Motorbike', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/drivers/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Registration failed');
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
          <h2 style={{ color: '#FFD966', fontSize: '1.6rem', fontWeight: 800, margin: '8px 0 4px' }}>Become a TULI Driver</h2>
          <p style={{ color: '#9BB7D4', fontSize: '0.88rem' }}>Deliver orders in Lusaka & earn daily</p>
        </div>

        {error && <div style={{ background: '#E74C3C20', border: '1px solid #E74C3C', color: '#E74C3C', padding: '10px 16px', borderRadius: '12px', marginBottom: '16px', fontSize: '0.88rem' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input placeholder="Full name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required
            style={{ padding: '12px 16px', borderRadius: '40px', border: '1px solid #244C66', background: '#1B4332', color: '#EFF3F8', fontSize: '0.95rem', outline: 'none' }} />
          <input placeholder="Phone e.g. 0971234567" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required
            style={{ padding: '12px 16px', borderRadius: '40px', border: '1px solid #244C66', background: '#1B4332', color: '#EFF3F8', fontSize: '0.95rem', outline: 'none' }} />
          <select value={form.zone} onChange={e => setForm({ ...form, zone: e.target.value })}
            style={{ padding: '12px 16px', borderRadius: '40px', border: '1px solid #244C66', background: '#1B4332', color: '#EFF3F8', fontSize: '0.95rem' }}>
            {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
          </select>
          <select value={form.vehicle} onChange={e => setForm({ ...form, vehicle: e.target.value })}
            style={{ padding: '12px 16px', borderRadius: '40px', border: '1px solid #244C66', background: '#1B4332', color: '#EFF3F8', fontSize: '0.95rem' }}>
            <option value="Motorbike">🏍️ Motorbike</option>
            <option value="Bicycle">🚲 Bicycle</option>
            <option value="Car">🚗 Car</option>
          </select>
          <input placeholder="Create password" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required
            style={{ padding: '12px 16px', borderRadius: '40px', border: '1px solid #244C66', background: '#1B4332', color: '#EFF3F8', fontSize: '0.95rem', outline: 'none' }} />
          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '8px' }}>
            {loading ? 'Registering...' : 'Register as Driver →'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '16px', color: '#9BB7D4', fontSize: '0.85rem' }}>
          Already registered?{' '}
          <span onClick={() => navigate('/driver/login')} style={{ color: '#F39C12', cursor: 'pointer', fontWeight: 600 }}>Login here</span>
        </p>
      </div>
    </div>
  );
};

export default DriverRegister;
