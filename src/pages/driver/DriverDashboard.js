import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API } from '../../api';

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN || '';
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

  const parseLatLng = (value = '') => {
    const match = value.trim().match(/^(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)$/);
    if (!match) return null;
    return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
  };

  const normalizeDestination = (value = '') => value.replace(/[-_|]/g, ' ').replace(/\s+/g, ' ').trim();

  const resolveOpenStreetCoords = async (destination) => {
    const normalizedDestination = normalizeDestination(destination);
    if (!normalizedDestination) return null;
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(normalizedDestination)}&format=json&limit=1`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
      const data = await res.json();
      if (data?.length > 0) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      }
    } catch (err) {
      console.warn('OpenStreetMap geocoding failed:', err);
    }
    return null;
  };

  const resolveDestinationCoords = async (destination) => {
    const parsed = parseLatLng(destination);
    if (parsed) return parsed;

    const normalizedDestination = normalizeDestination(destination);
    if (!normalizedDestination) return null;

    if (MAPBOX_TOKEN && MAPBOX_TOKEN !== 'REPLACE_ME') {
      try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(normalizedDestination)}.json?access_token=${MAPBOX_TOKEN}&limit=1&country=zm`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.features?.length > 0) {
          const [lng, lat] = data.features[0].center;
          return { lat, lng };
        }
      } catch (err) {
        console.warn('Mapbox geocoding failed:', err);
      }
    }

    return resolveOpenStreetCoords(normalizedDestination);
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

  const buildMapState = (order, destinationCoords) => {
    const destination = order.driver_status === 'accepted'
      ? order.seller_address || order.delivery_address
      : order.delivery_address;

    return {
      order,
      destination,
      destinationCoords,
      destinationLabel: order.driver_status === 'accepted' ? 'Pickup from Seller' : 'Delivery to Buyer',
      orderLabel: `${order.buyer_name || 'Buyer'} • ${order.shop_name || 'Shop'}`,
    };
  };

  const goToMap = async (order) => {
    const destination = order.driver_status === 'accepted'
      ? order.seller_address || order.delivery_address
      : order.delivery_address;

    const destinationCoords = (order.driver_status === 'accepted' && order.seller_lat && order.seller_lng)
      ? { lat: order.seller_lat, lng: order.seller_lng }
      : await resolveDestinationCoords(destination);

    navigate('/driver/map', { state: buildMapState(order, destinationCoords) });
  };

  const formatAddress = (address = '') => {
    if (!address) return 'No address available';
    const parts = address.split(',').map(part => part.trim()).filter(Boolean);
    return parts.slice(0, 2).join(', ');
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
                <p style={{ color: '#9BB7D4', fontSize: '0.82rem', marginBottom: '4px' }}>📍 {formatAddress(order.delivery_address)}</p>
                <p style={{ color: '#9BB7D4', fontSize: '0.72rem', marginBottom: '12px' }}>Tap the map button for full directions.</p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => acceptOrder(order.id)} className="btn-primary" style={{ flex: 1, fontSize: '0.88rem', padding: '10px' }}>
                    Accept Delivery →
                  </button>
                  <button type="button" onClick={() => goToMap(order)} style={{ flex: 1, fontSize: '0.88rem', padding: '10px', borderRadius: '18px', border: '1px solid #27AE60', background: '#1B4332', color: '#27AE60', cursor: 'pointer' }}>
                    Map
                  </button>
                </div>
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
                <p style={{ color: '#9BB7D4', fontSize: '0.82rem', marginBottom: '4px' }}>📍 {formatAddress(order.delivery_address)}</p>
                <p style={{ color: '#9BB7D4', fontSize: '0.72rem', marginBottom: '12px' }}>Tap the map button for full directions.</p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button type="button" onClick={() => goToMap(order)} style={{ flex: '1 1 150px', width: '100%', fontSize: '0.88rem', padding: '8px', borderRadius: '20px', border: '1px solid #27AE60', background: '#1B4332', color: '#27AE60', cursor: 'pointer' }}>
                    🗺️ Map
                  </button>
                  {order.driver_status === 'accepted' && (
                    <button onClick={() => updateStatus(order.id, 'picked_up')} style={{ flex: '1 1 150px', background: '#9B59B6', color: 'white', border: 'none', borderRadius: '20px', padding: '8px', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>
                      📦 Picked Up
                    </button>
                  )}
                  {order.driver_status === 'picked_up' && (
                    <button onClick={() => updateStatus(order.id, 'delivered')} style={{ flex: '1 1 150px', background: '#27AE60', color: 'white', border: 'none', borderRadius: '20px', padding: '8px', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>
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
