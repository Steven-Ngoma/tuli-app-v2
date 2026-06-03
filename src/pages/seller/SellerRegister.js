import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { API } from '../../api';

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN || '';
const HAS_MAPBOX = MAPBOX_TOKEN && MAPBOX_TOKEN !== 'REPLACE_ME';

const SellerRegister = () => {
  const navigate = useNavigate();
  const [shopType, setShopType] = useState('');
  const [form, setForm] = useState({ name: '', shop_name: '', phone: '', email: '', location: '', password: '' });
  const [coords, setCoords] = useState(null);
  const [locationFetching, setLocationFetching] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [autoLocationRequested, setAutoLocationRequested] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const requestCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      console.error('Geolocation not supported');
      return;
    }
    setLocationError('');
    setLocationFetching(true);
    console.log('Requesting geolocation...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const locationCoords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        console.log('Geolocation success:', locationCoords);
        setCoords(locationCoords);
        setForm((prev) => ({
          ...prev,
          location: prev.location || `Your current location (${locationCoords.lat.toFixed(5)}, ${locationCoords.lng.toFixed(5)})`,
        }));
        setLocationFetching(false);
      },
      (err) => {
        console.error('Geolocation error:', err.code, err.message);
        setLocationError(`Unable to access location (${err.code}). Please allow location access or enter coordinates manually.`);
        setLocationFetching(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleManualCoordinates = (lat, lng) => {
    const locationCoords = { lat: parseFloat(lat), lng: parseFloat(lng) };
    setCoords(locationCoords);
    setForm((prev) => ({
      ...prev,
      location: prev.location || `Location (${lat}, ${lng})`,
    }));
  };

  const setMapCoords = (lat, lng) => {
    const locationCoords = { lat, lng };
    setCoords(locationCoords);
    setForm((prev) => ({ ...prev, location: prev.location || `Your shop location (${lat.toFixed(5)}, ${lng.toFixed(5)})` }));
  };

  useEffect(() => {
    if (shopType && !coords && !autoLocationRequested) {
      setAutoLocationRequested(true);
      requestCurrentLocation();
    }
  }, [shopType, coords, autoLocationRequested]);

  // Init Mapbox map after shopType is chosen and GPS is ready
  useEffect(() => {
    if (!shopType || mapRef.current) return;
    const center = coords ? [coords.lng, coords.lat] : [28.3228, -15.3875];

    if (HAS_MAPBOX) mapboxgl.accessToken = MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: HAS_MAPBOX ? 'mapbox://styles/mapbox/streets-v12' : 'https://demotiles.maplibre.org/style.json',
      center,
      zoom: 15,
    });

    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    const el = document.createElement('div');
    el.style.cssText = 'width:36px;height:36px;background:#E74C3C;border:3px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 8px rgba(0,0,0,0.4);cursor:grab';

    const marker = new mapboxgl.Marker({ element: el, draggable: true, anchor: 'bottom' })
      .setLngLat(center)
      .addTo(map);

    marker.on('dragend', () => {
      const { lng, lat } = marker.getLngLat();
      setMapCoords(lat, lng);
    });

    map.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      marker.setLngLat([lng, lat]);
      setMapCoords(lat, lng);
    });

    markerRef.current = marker;
    mapRef.current = map;

    return () => { map.remove(); mapRef.current = null; markerRef.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopType]);

  // When GPS coords arrive, fly map to them and update marker
  useEffect(() => {
    if (!coords || !mapRef.current || !markerRef.current) return;
    markerRef.current.setLngLat([coords.lng, coords.lat]);
    mapRef.current.flyTo({ center: [coords.lng, coords.lat], zoom: 16, speed: 1.2 });
  }, [coords]);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/sellers/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          shop_type: shopType,
          seller_lat: coords?.lat,
          seller_lng: coords?.lng,
        }),
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
          <h2 style={{ color: '#FFD966', fontSize: '1.8rem', marginBottom: '8px', textAlign: 'center' }}>Join TULI</h2>
          <p style={{ color: '#9BB7D4', marginBottom: '36px', textAlign: 'center' }}>Are you a market vendor or a restaurant?</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>

            {/* Market Vendor */}
            <div
              onClick={() => setShopType('product')}
              style={{ background: '#102433', borderRadius: '24px', padding: '28px 20px', border: '2px solid #244C66', cursor: 'pointer', textAlign: 'center', transition: '0.2s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#F39C12'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#244C66'}
            >
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🥬</div>
              <h3 style={{ color: '#FFD966', marginBottom: '8px' }}>Market Vendor</h3>
              <p style={{ color: '#9BB7D4', fontSize: '0.85rem', marginBottom: '16px' }}>Sell fresh produce — tomatoes, vegetables, fruits and more from your market stall.</p>
              <div style={{ background: '#F39C1220', borderRadius: '12px', padding: '10px' }}>
                <div style={{ color: '#F39C12', fontWeight: 700, fontSize: '0.9rem' }}>Free to list</div>
                <div style={{ color: '#9BB7D4', fontSize: '0.78rem', marginTop: '4px' }}>5% commission per sale only</div>
              </div>
            </div>

            {/* Restaurant */}
            <div
              onClick={() => setShopType('service')}
              style={{ background: '#102433', borderRadius: '24px', padding: '28px 20px', border: '2px solid #244C66', cursor: 'pointer', textAlign: 'center', transition: '0.2s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#27AE60'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#244C66'}
            >
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🍽️</div>
              <h3 style={{ color: '#FFD966', marginBottom: '8px' }}>Restaurant</h3>
              <p style={{ color: '#9BB7D4', fontSize: '0.85rem', marginBottom: '16px' }}>Register your restaurant on TULI's Service Unit and start receiving food orders.</p>
              <div style={{ background: '#27AE6020', borderRadius: '12px', padding: '10px' }}>
                <div style={{ color: '#27AE60', fontWeight: 700, fontSize: '0.9rem' }}>1 Month FREE</div>
                <div style={{ color: '#9BB7D4', fontSize: '0.78rem', marginTop: '4px' }}>Then K100/month rental fee</div>
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
          <span style={{ background: shopType === 'service' ? '#27AE6020' : '#F39C1220', color: shopType === 'service' ? '#27AE60' : '#F39C12', borderRadius: '20px', padding: '4px 14px', fontSize: '0.85rem', fontWeight: 700 }}>
            {shopType === 'service' ? '🍽️ Restaurant' : '🥬 Market Vendor'}
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
            { name: 'shop_name', placeholder: shopType === 'service' ? 'Restaurant name' : 'Market stall / vendor name', type: 'text' },
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

          {/* Real-time location map */}
          <div style={{ borderRadius: '20px', overflow: 'hidden', border: '2px solid #27AE60', marginTop: '4px' }}>
            <div style={{ background: '#0F2A3D', padding: '8px 14px', fontSize: '0.8rem', color: '#9BB7D4' }}>
              📍 Tap the map or drag the red pin to set your shop's exact location
            </div>
            <div ref={mapContainerRef} style={{ height: '240px', width: '100%' }} />
          </div>

          <div style={{ display: 'grid', gap: '10px', alignItems: 'center', marginTop: '4px' }}>
            <button
              type="button"
              onClick={requestCurrentLocation}
              disabled={locationFetching}
              style={{ padding: '12px 18px', borderRadius: '32px', border: '1px solid #27AE60', background: locationFetching ? '#244C66' : '#27AE60', color: locationFetching ? '#A3C4D9' : '#102433', cursor: 'pointer', fontWeight: 700 }}
            >
              {locationFetching ? 'Getting current location…' : '📡 Snap to my GPS location'}
            </button>
            {coords && (
              <div style={{ color: '#27AE60', fontSize: '0.82rem', fontWeight: 700 }}>
                ✓ Location pinned: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
              </div>
            )}
            {locationError && (
              <div style={{ color: '#FFBABA', fontSize: '0.82rem' }}>{locationError}</div>
            )}
          </div>

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
