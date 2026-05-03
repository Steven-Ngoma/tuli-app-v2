import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API = 'https://tuli-backend-44vd.onrender.com';

const STATUS_COLORS = { pending: '#F39C12', accepted: '#3498DB', picked_up: '#9B59B6', delivered: '#27AE60', cancelled: '#E74C3C' };

const DriverDashboard = () => {
  const navigate = useNavigate();
  const driver = JSON.parse(localStorage.getItem('driver') || 'null');
  const [tab, setTab] = useState('available');
  const [available, setAvailable] = useState([]);
  const [myDeliveries, setMyDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    if (!driver) { navigate('/driver/login'); return; }
    fetchData();
    const ping = () => fetch(`${API}/drivers/${driver.id}/ping`, { method: 'POST' }).catch(() => {});
    ping();
    const interval = setInterval(() => { fetchData(); ping(); }, 5000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      const [avRes, myRes] = await Promise.all([
        fetch(`${API}/drivers/available-orders`),
        fetch(`${API}/drivers/${driver.id}/deliveries`)
      ]);
      setAvailable(await avRes.json());
      setMyDeliveries(await myRes.json());
    } catch { }
    finally { setLoading(false); }
  };

  const acceptOrder = async (orderId) => {
    await fetch(`${API}/drivers/${driver.id}/accept/${orderId}`, { method: 'POST' });
    fetchData();
    setTab('my');
  };

  const updateStatus = async (orderId, status) => {
    await fetch(`${API}/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    fetchData();
  };

  const toggleOnline = async () => {
    const newStatus = !online;
    setOnline(newStatus);
    await fetch(`${API}/drivers/${driver.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ online: newStatus })
    });
  };

  if (!driver) return null;

  const earnings = myDeliveries.filter(d => d.driver_status === 'delivered').length * 20;

  return (
    <div style={{ background: '#1B4332', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: '#102433', padding: '20px 20px 0', borderBottom: '1px solid #244C66' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ color: '#FFD966', fontSize: '1.4rem', fontWeight: 800 }}>🛵 {driver.name}</h2>
            <p style={{ color: '#9BB7D4', fontSize: '0.8rem' }}>📍 {driver.zone} · {driver.vehicle}</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
            <button onClick={toggleOnline} style={{
              background: online ? '#27AE60' : '#E74C3C', border: 'none', borderRadius: '40px',
              padding: '6px 16px', color: 'white', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer'
            }}>
              {online ? '● Online' : '○ Offline'}
            </button>
            <button onClick={() => { localStorage.removeItem('driver'); navigate('/'); }}
              style={{ background: 'transparent', border: 'none', color: '#9BB7D4', fontSize: '0.78rem', cursor: 'pointer' }}>Logout</button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}>
          {[
            { label: 'Available', value: available.length, color: '#F39C12' },
            { label: 'My Deliveries', value: myDeliveries.length, color: '#3498DB' },
            { label: 'Earned (K)', value: `K${earnings}`, color: '#27AE60' },
          ].map(s => (
            <div key={s.label} style={{ background: '#1B4332', borderRadius: '14px', padding: '12px', textAlign: 'center', border: `1px solid ${s.color}40` }}>
              <div style={{ color: s.color, fontSize: '1.4rem', fontWeight: 800 }}>{s.value}</div>
              <div style={{ color: '#9BB7D4', fontSize: '0.7rem', marginTop: '2px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0', borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
          {[{ key: 'available', label: '📦 Available' }, { key: 'my', label: '🛵 My Deliveries' }].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: '10px 20px', border: 'none', cursor: 'pointer', fontWeight: 700,
              fontSize: '0.88rem', background: 'transparent',
              color: tab === t.key ? '#F39C12' : 'rgba(255,255,255,0.5)',
              borderBottom: tab === t.key ? '3px solid #F39C12' : '3px solid transparent',
              marginBottom: '-2px', transition: '0.2s'
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px 20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#9BB7D4' }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⏳</div>
            <p>Loading orders...</p>
          </div>
        ) : tab === 'available' ? (
          <>
            {available.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#9BB7D4' }}>
                <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📭</div>
                <p style={{ fontSize: '1rem' }}>No available orders right now</p>
                <p style={{ fontSize: '0.82rem', marginTop: '8px', color: '#4A6080' }}>New orders will appear here automatically</p>
              </div>
            ) : available.map(order => (
              <div key={order.id} style={{ background: '#102433', borderRadius: '20px', padding: '18px', marginBottom: '12px', border: '1px solid #244C66' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div>
                    <p style={{ color: '#FFD966', fontWeight: 700, fontSize: '0.95rem' }}>{order.product_name}</p>
                    <p style={{ color: '#9BB7D4', fontSize: '0.8rem', marginTop: '2px' }}>🏪 {order.shop_name}</p>
                  </div>
                  <span style={{ background: '#27AE6020', color: '#27AE60', borderRadius: '20px', padding: '4px 10px', fontSize: '0.72rem', fontWeight: 700 }}>K20 fee</span>
                </div>
                <p style={{ color: '#9BB7D4', fontSize: '0.82rem', marginBottom: '4px' }}>👤 {order.buyer_name}</p>
                <p style={{ color: '#9BB7D4', fontSize: '0.82rem', marginBottom: '12px' }}>📍 {order.delivery_address}</p>
                <button onClick={() => acceptOrder(order.id)} className="btn-primary" style={{ width: '100%', fontSize: '0.88rem', padding: '10px' }}>
                  Accept Delivery →
                </button>
              </div>
            ))}
          </>
        ) : (
          <>
            {myDeliveries.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#9BB7D4' }}>
                <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🛵</div>
                <p>No deliveries yet. Accept an order to get started.</p>
              </div>
            ) : myDeliveries.map(order => (
              <div key={order.id} style={{ background: '#102433', borderRadius: '20px', padding: '18px', marginBottom: '12px', border: `1px solid ${STATUS_COLORS[order.driver_status] || '#244C66'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div>
                    <p style={{ color: '#FFD966', fontWeight: 700, fontSize: '0.95rem' }}>{order.product_name}</p>
                    <p style={{ color: '#9BB7D4', fontSize: '0.8rem', marginTop: '2px' }}>🏪 {order.shop_name}</p>
                  </div>
                  <span style={{ background: (STATUS_COLORS[order.driver_status] || '#244C66') + '30', color: STATUS_COLORS[order.driver_status] || '#9BB7D4', borderRadius: '20px', padding: '4px 10px', fontSize: '0.72rem', fontWeight: 700, textTransform: 'capitalize' }}>
                    {order.driver_status}
                  </span>
                </div>
                <p style={{ color: '#9BB7D4', fontSize: '0.82rem', marginBottom: '4px' }}>👤 {order.buyer_name}</p>
                <p style={{ color: '#9BB7D4', fontSize: '0.82rem', marginBottom: '12px' }}>📍 {order.delivery_address}</p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {order.driver_status === 'accepted' && (
                    <button onClick={() => updateStatus(order.id, 'picked_up')} style={{ flex: 1, background: '#9B59B6', color: 'white', border: 'none', borderRadius: '20px', padding: '8px', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>
                      📦 Picked Up
                    </button>
                  )}
                  {order.driver_status === 'picked_up' && (
                    <button onClick={() => updateStatus(order.id, 'delivered')} style={{ flex: 1, background: '#27AE60', color: 'white', border: 'none', borderRadius: '20px', padding: '8px', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>
                      ✅ Mark Delivered
                    </button>
                  )}
                  {order.driver_status === 'delivered' && (
                    <div style={{ color: '#27AE60', fontWeight: 700, fontSize: '0.88rem' }}>✅ Delivered · K20 earned</div>
                  )}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default DriverDashboard;
