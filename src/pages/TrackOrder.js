import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const API = 'https://tuli-backend-44vd.onrender.com';
const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN || '';
const hasMapbox = MAPBOX_TOKEN && MAPBOX_TOKEN !== 'REPLACE_ME';
const LUSAKA = { lat: -15.4167, lng: 28.2833 };

const OSM_STYLE = {
  version: 8,
  sources: { osm: { type: 'raster', tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'], tileSize: 256, attribution: '© OpenStreetMap', maxzoom: 19 } },
  layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
};

// Inject CSS animations once
const injectCSS = () => {
  if (document.getElementById('tuli-track-css')) return;
  const s = document.createElement('style');
  s.id = 'tuli-track-css';
  s.textContent = `
    @keyframes tuliPulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.2);opacity:.6} }
    @keyframes tuliBike  { 0%,100%{transform:translateY(0) rotate(-3deg)} 50%{transform:translateY(-4px) rotate(3deg)} }
    @keyframes tuliWalk  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
    @keyframes legF      { 0%,100%{transform:rotate(-25deg)} 50%{transform:rotate(25deg)} }
    @keyframes legB      { 0%,100%{transform:rotate(25deg)} 50%{transform:rotate(-25deg)} }
    @keyframes stepDot   { 0%,100%{box-shadow:0 0 0 0 rgba(39,174,96,.6)} 50%{box-shadow:0 0 0 7px rgba(39,174,96,0)} }
  `;
  document.head.appendChild(s);
};

const STATUS_MAP = {
  pending:   { label: 'Order Pending',            color: '#F39C12', desc: 'Waiting for seller to confirm.' },
  confirmed: { label: 'Order Confirmed',           color: '#3498DB', desc: 'Seller confirmed — looking for a driver.' },
  accepted:  { label: 'Driver heading to seller',  color: '#9B59B6', desc: 'Driver is on the way to pick up your items.' },
  picked_up: { label: '📦 Items Picked Up!',       color: '#E67E22', desc: 'Driver has your items and is heading to you now.' },
  delivered: { label: '🎉 Delivered!',             color: '#27AE60', desc: 'Your order has been delivered. Enjoy!' },
  cancelled: { label: 'Order Cancelled',           color: '#E74C3C', desc: 'This order was cancelled.' },
};

const STEPS = [
  { key: 'confirmed', label: 'Order Confirmed' },
  { key: 'accepted',  label: 'Driver Assigned' },
  { key: 'picked_up', label: 'Items Picked Up' },
  { key: 'delivered', label: 'Delivered' },
];
const STEP_KEYS = STEPS.map(s => s.key);

// Build the animated HTML marker element
const buildMarkerEl = (isMotorbike) => {
  const wrap = document.createElement('div');
  wrap.style.cssText = `
    display:flex;flex-direction:column;align-items:center;gap:2px;
    filter:drop-shadow(0 3px 6px rgba(0,0,0,0.4));
  `;

  const bubble = document.createElement('div');
  bubble.style.cssText = `
    width:48px;height:48px;border-radius:50%;
    background:${isMotorbike ? '#1B4332' : '#3498DB'};
    border:3px solid #fff;
    display:flex;align-items:center;justify-content:center;
    font-size:24px;
    animation:${isMotorbike ? 'tuliBike' : 'tuliWalk'} ${isMotorbike ? '0.45s' : '0.6s'} ease-in-out infinite;
    box-shadow:0 0 0 6px ${isMotorbike ? 'rgba(27,67,50,0.2)' : 'rgba(52,152,219,0.2)'};
  `;

  if (isMotorbike) {
    bubble.textContent = '🛵';
  } else {
    // SVG walking person
    bubble.innerHTML = `
      <svg width="22" height="30" viewBox="0 0 22 30" fill="none">
        <circle cx="11" cy="4" r="3.5" fill="#fff"/>
        <rect x="9.5" y="8" width="3" height="9" rx="1.5" fill="#fff"/>
        <rect x="9.5" y="17" width="3" height="8" rx="1.5" fill="#fff"
          style="transform-origin:11px 17px;animation:legF 0.6s ease-in-out infinite"/>
        <rect x="7" y="17" width="3" height="8" rx="1.5" fill="rgba(255,255,255,0.6)"
          style="transform-origin:8.5px 17px;animation:legB 0.6s ease-in-out infinite"/>
        <rect x="4" y="10" width="3" height="7" rx="1.5" fill="rgba(255,255,255,0.7)"
          style="transform-origin:5.5px 10px;animation:legB 0.5s ease-in-out infinite"/>
        <rect x="15" y="10" width="3" height="7" rx="1.5" fill="rgba(255,255,255,0.7)"
          style="transform-origin:16.5px 10px;animation:legF 0.5s ease-in-out infinite"/>
      </svg>`;
  }

  // Pulse dot below
  const dot = document.createElement('div');
  dot.style.cssText = `
    width:8px;height:8px;border-radius:50%;
    background:${isMotorbike ? '#27AE60' : '#3498DB'};
    animation:tuliPulse 1.2s infinite;
  `;

  wrap.appendChild(bubble);
  wrap.appendChild(dot);
  return wrap;
};

const TrackOrder = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const mapReadyRef = useRef(false);
  const prevDriverPos = useRef(null);
  const [tracking, setTracking] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { injectCSS(); }, []);

  // Poll tracking every 4s
  const poll = useCallback(async () => {
    try {
      const res = await fetch(`${API}/orders/${orderId}/tracking`);
      if (!res.ok) throw new Error('Order not found');
      const data = await res.json();
      setTracking(data);
    } catch (e) { setError(e.message); }
  }, [orderId]);

  useEffect(() => {
    poll();
    const iv = setInterval(poll, 4000);
    return () => clearInterval(iv);
  }, [poll]);

  // Init map once
  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return;
    if (hasMapbox) mapboxgl.accessToken = MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: hasMapbox ? 'mapbox://styles/mapbox/streets-v12' : OSM_STYLE,
      center: [LUSAKA.lng, LUSAKA.lat],
      zoom: 14,
    });

    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.on('load', () => {
      // Destination marker layer
      map.addSource('dest', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({
        id: 'dest-circle',
        type: 'circle',
        source: 'dest',
        paint: { 'circle-radius': 13, 'circle-color': '#F39C12', 'circle-stroke-color': '#fff', 'circle-stroke-width': 3 },
      });
      map.addLayer({
        id: 'dest-pulse',
        type: 'circle',
        source: 'dest',
        paint: { 'circle-radius': 24, 'circle-color': '#F39C12', 'circle-opacity': 0.2 },
      });

      mapReadyRef.current = true;
    });

    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; mapReadyRef.current = false; };
  }, []);

  // Update marker + map when driver pos changes
  useEffect(() => {
    if (!tracking || !mapReadyRef.current) return;
    const { current_lat, current_lng, vehicle } = tracking;
    if (!current_lat || !current_lng) return;

    const pos = [current_lng, current_lat];
    const isMotorbike = /motorbike|bike|moto/i.test(vehicle || '');

    // Create or update marker
    if (!markerRef.current) {
      const el = buildMarkerEl(isMotorbike);
      markerRef.current = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat(pos)
        .addTo(mapRef.current);
    } else {
      markerRef.current.setLngLat(pos);
    }

    // Smooth pan to driver
    if (!prevDriverPos.current) {
      mapRef.current.flyTo({ center: pos, zoom: 15, speed: 1.2 });
    } else {
      mapRef.current.easeTo({ center: pos, duration: 2000 });
    }
    prevDriverPos.current = pos;
  }, [tracking?.current_lat, tracking?.current_lng]);

  if (error) return (
    <div style={{ minHeight: '100vh', background: '#1B4332', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ textAlign: 'center', color: '#EFF3F8' }}>
        <div style={{ fontSize: '3rem', marginBottom: '12px' }}>❌</div>
        <p style={{ fontSize: '1rem', marginBottom: '20px', color: '#9BB7D4' }}>{error}</p>
        <button onClick={() => navigate(-1)} style={{ background: '#F39C12', color: '#1B4332', border: 'none', borderRadius: '20px', padding: '10px 28px', fontWeight: 700, cursor: 'pointer' }}>Go Back</button>
      </div>
    </div>
  );

  const { driver_status, driver_name, vehicle, current_lat, current_lng, delivery_address } = tracking || {};
  const statusInfo = STATUS_MAP[driver_status] || STATUS_MAP.pending;
  const isMotorbike = /motorbike|bike|moto/i.test(vehicle || '');
  const isEnRoute = ['accepted', 'picked_up'].includes(driver_status);
  const hasDriver = !!driver_name;
  const hasLivePos = !!(current_lat && current_lng);
  const currentStepIdx = STEP_KEYS.indexOf(driver_status);

  return (
    <div style={{ minHeight: '100vh', background: '#1B4332', paddingBottom: '40px' }}>

      {/* Header */}
      <div style={{ background: '#102433', padding: '20px', borderBottom: '1px solid #244C66' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: 'none', color: '#F39C12', fontSize: '1.1rem', cursor: 'pointer', marginBottom: '10px', padding: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
          ← Back
        </button>
        <h1 style={{ color: '#FFD966', fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>📍 Track Your Order</h1>
        <p style={{ color: '#4A6080', fontSize: '0.8rem', marginTop: '4px' }}>Order #{orderId} · Updates every 4s</p>
      </div>

      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

        {/* Status banner */}
        <div style={{ background: '#102433', borderRadius: '18px', padding: '16px 20px', border: `2px solid ${statusInfo.color}`, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: statusInfo.color, flexShrink: 0, animation: isEnRoute ? 'tuliPulse 1.2s infinite' : 'none' }} />
          <div>
            <p style={{ color: statusInfo.color, fontWeight: 800, fontSize: '0.95rem', margin: 0 }}>{statusInfo.label}</p>
            <p style={{ color: '#9BB7D4', fontSize: '0.82rem', margin: '4px 0 0' }}>{statusInfo.desc}</p>
          </div>
        </div>

        {/* Live Map */}
        <div style={{ borderRadius: '20px', overflow: 'hidden', border: '2px solid #244C66', position: 'relative' }}>
          <div ref={mapContainerRef} style={{ height: '300px' }} />

          {/* Overlay when no driver yet */}
          {!tracking && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(16,36,51,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '2rem', animation: 'tuliPulse 1.5s infinite' }}>⏳</div>
              <p style={{ color: '#EFF3F8', fontWeight: 600 }}>Loading...</p>
            </div>
          )}

          {tracking && !hasLivePos && isEnRoute && (
            <div style={{ position: 'absolute', bottom: '10px', left: '10px', right: '10px', background: 'rgba(16,36,51,0.85)', borderRadius: '12px', padding: '8px 14px', textAlign: 'center' }}>
              <p style={{ color: '#9BB7D4', fontSize: '0.78rem', margin: 0, animation: 'tuliPulse 1.5s infinite' }}>📡 Waiting for driver GPS signal...</p>
            </div>
          )}

          {hasLivePos && (
            <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(27,67,50,0.92)', borderRadius: '12px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#27AE60', animation: 'tuliPulse 1.2s infinite' }} />
              <p style={{ color: '#FFD966', fontSize: '0.75rem', margin: 0, fontWeight: 700 }}>Live</p>
            </div>
          )}
        </div>

        {/* Driver card */}
        {hasDriver && (
          <div style={{ background: '#102433', borderRadius: '18px', padding: '16px 20px', border: '1px solid #244C66' }}>
            <p style={{ color: '#4A6080', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>Your Driver</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '54px', height: '54px', borderRadius: '50%',
                background: isMotorbike ? '#1B4332' : '#1a3a5c',
                border: `2px solid ${isEnRoute ? '#27AE60' : '#244C66'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.8rem', flexShrink: 0,
                animation: isEnRoute ? (isMotorbike ? 'tuliBike 0.45s ease-in-out infinite' : 'tuliWalk 0.6s ease-in-out infinite') : 'none',
              }}>
                {isMotorbike ? '🛵' : '🚶'}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ color: '#EFF3F8', fontWeight: 700, fontSize: '1rem', margin: 0 }}>{driver_name}</p>
                <p style={{ color: '#9BB7D4', fontSize: '0.82rem', margin: '3px 0' }}>
                  {isMotorbike ? '🛵 Motorbike' : '🚶 On foot'} · {vehicle}
                </p>
                {isEnRoute && (
                  <p style={{ color: '#27AE60', fontSize: '0.75rem', fontWeight: 700, margin: 0, animation: 'tuliPulse 1.5s infinite' }}>
                    ● Live tracking active
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Progress timeline */}
        <div style={{ background: '#102433', borderRadius: '18px', padding: '16px 20px', border: '1px solid #244C66' }}>
          <p style={{ color: '#4A6080', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px' }}>Delivery Progress</p>
          {STEPS.map((step, i) => {
            const done = currentStepIdx >= i;
            const active = currentStepIdx === i;
            const icon = [
              '✅',
              isMotorbike ? '🛵' : '🚶',
              '📦',
              '🎉',
            ][i];
            return (
              <div key={step.key} style={{ display: 'flex', gap: '12px' }}>
                {/* Line + dot */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '32px', flexShrink: 0 }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: done ? '#27AE60' : '#1B4332',
                    border: `2px solid ${done ? '#27AE60' : '#244C66'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: done ? '0.9rem' : '0.7rem',
                    color: done ? '#fff' : '#4A6080',
                    flexShrink: 0,
                    animation: active ? 'stepDot 1.2s infinite' : 'none',
                    transition: 'background 0.4s',
                  }}>
                    {done ? icon : i + 1}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div style={{ width: '2px', flex: 1, minHeight: '20px', background: done ? '#27AE60' : '#244C66', margin: '3px 0', transition: 'background 0.4s' }} />
                  )}
                </div>
                {/* Label */}
                <p style={{
                  color: done ? '#EFF3F8' : '#4A6080',
                  fontWeight: active ? 800 : done ? 600 : 400,
                  fontSize: '0.88rem',
                  margin: `0 0 ${i < STEPS.length - 1 ? '20px' : '0'}`,
                  paddingTop: '5px',
                  transition: 'color 0.4s',
                }}>
                  {step.label}
                  {active && <span style={{ color: statusInfo.color, marginLeft: '8px', fontSize: '0.72rem' }}>← now</span>}
                </p>
              </div>
            );
          })}
        </div>

        {/* Delivery address */}
        {delivery_address && (
          <div style={{ background: '#102433', borderRadius: '18px', padding: '14px 20px', border: '1px solid #244C66' }}>
            <p style={{ color: '#4A6080', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Delivering to</p>
            <p style={{ color: '#EFF3F8', fontSize: '0.88rem', margin: 0 }}>📍 {delivery_address.split('|')[0].trim()}</p>
          </div>
        )}

      </div>
    </div>
  );
};

export default TrackOrder;
