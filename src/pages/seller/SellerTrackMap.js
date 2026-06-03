import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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

// inject CSS once
const injectCSS = () => {
  if (document.getElementById('seller-track-css')) return;
  const s = document.createElement('style');
  s.id = 'seller-track-css';
  s.textContent = `
    @keyframes stPulse  { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.25);opacity:.5} }
    @keyframes stBike   { 0%,100%{transform:translateY(0) rotate(-4deg)} 50%{transform:translateY(-5px) rotate(4deg)} }
    @keyframes stWalk   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
    @keyframes stShop   { 0%,100%{box-shadow:0 0 0 0 rgba(243,156,18,.6)} 60%{box-shadow:0 0 0 14px rgba(243,156,18,0)} }
  `;
  document.head.appendChild(s);
};

const buildDriverEl = (vehicle) => {
  const isBike = /motorbike|bike|moto/i.test(vehicle || '');
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:2px;';
  const bubble = document.createElement('div');
  bubble.style.cssText = `
    width:46px;height:46px;border-radius:50%;
    background:${isBike ? '#1B4332' : '#2980B9'};
    border:3px solid #fff;
    display:flex;align-items:center;justify-content:center;
    font-size:22px;
    animation:${isBike ? 'stBike .45s ease-in-out infinite' : 'stWalk .6s ease-in-out infinite'};
    box-shadow:0 4px 12px rgba(0,0,0,0.35);
  `;
  bubble.textContent = isBike ? '🛵' : '🚶';
  const dot = document.createElement('div');
  dot.style.cssText = `width:8px;height:8px;border-radius:50%;background:${isBike ? '#27AE60' : '#3498DB'};animation:stPulse 1.2s infinite;`;
  wrap.appendChild(bubble);
  wrap.appendChild(dot);
  return wrap;
};

const buildShopEl = () => {
  const el = document.createElement('div');
  el.style.cssText = `
    width:50px;height:50px;border-radius:50%;
    background:#F39C12;border:3px solid #fff;
    display:flex;align-items:center;justify-content:center;
    font-size:24px;
    animation:stShop 1.8s infinite;
    box-shadow:0 4px 14px rgba(243,156,18,0.5);
  `;
  el.textContent = '🍽️';
  return el;
};

const SellerTrackMap = () => {
  const navigate = useNavigate();
  const seller = JSON.parse(localStorage.getItem('seller') || 'null');
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const mapReadyRef = useRef(false);
  const shopMarkerRef = useRef(null);
  const driverMarkersRef = useRef({}); // keyed by order id
  const [deliveries, setDeliveries] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => { injectCSS(); }, []);

  // Poll active deliveries every 4s
  const poll = useCallback(async () => {
    if (!seller) return;
    try {
      const res = await fetch(`${API}/sellers/${seller.id}/active-deliveries`);
      const data = await res.json();
      setDeliveries(Array.isArray(data) ? data : []);
    } catch { }
  }, [seller?.id]);

  useEffect(() => {
    poll();
    const iv = setInterval(poll, 4000);
    return () => clearInterval(iv);
  }, [poll]);

  // Init map
  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return;
    if (hasMapbox) mapboxgl.accessToken = MAPBOX_TOKEN;

    const center = (seller?.seller_lat && seller?.seller_lng)
      ? [seller.seller_lng, seller.seller_lat]
      : [LUSAKA.lng, LUSAKA.lat];

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: hasMapbox ? 'mapbox://styles/mapbox/streets-v12' : OSM_STYLE,
      center,
      zoom: 14,
    });

    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.on('load', () => {
      // Route line source
      map.addSource('route', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#27AE60', 'line-width': 5, 'line-opacity': 0.8, 'line-dasharray': [2, 1] },
      });

      mapReadyRef.current = true;

      // Shop marker (pulsing orange restaurant pin)
      if (seller?.seller_lat && seller?.seller_lng) {
        shopMarkerRef.current = new mapboxgl.Marker({ element: buildShopEl(), anchor: 'center' })
          .setLngLat([seller.seller_lng, seller.seller_lat])
          .setPopup(new mapboxgl.Popup({ offset: 30 }).setText(`📍 ${seller.shop_name}`))
          .addTo(map);
      }
    });

    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; mapReadyRef.current = false; };
  }, []);

  // Update driver markers whenever deliveries change
  useEffect(() => {
    if (!mapReadyRef.current || !mapRef.current) return;
    const map = mapRef.current;

    deliveries.forEach(d => {
      if (!d.current_lat || !d.current_lng) return;
      const pos = [d.current_lng, d.current_lat];

      if (!driverMarkersRef.current[d.id]) {
        // New marker
        const popup = new mapboxgl.Popup({ offset: 30 })
          .setHTML(`<strong>${d.driver_name}</strong><br/>${d.vehicle}<br/>Order: ${d.product_name}`);
        const el = buildDriverEl(d.vehicle);
        driverMarkersRef.current[d.id] = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat(pos)
          .setPopup(popup)
          .addTo(map);
      } else {
        driverMarkersRef.current[d.id].setLngLat(pos);
      }

      // Draw route from driver to shop
      if (seller?.seller_lat && seller?.seller_lng && selected === d.id) {
        fetchRoute(map, { lat: d.current_lat, lng: d.current_lng }, { lat: seller.seller_lat, lng: seller.seller_lng });
      }
    });

    // Remove markers for completed deliveries
    const activeIds = deliveries.map(d => String(d.id));
    Object.keys(driverMarkersRef.current).forEach(id => {
      if (!activeIds.includes(id)) {
        driverMarkersRef.current[id].remove();
        delete driverMarkersRef.current[id];
      }
    });
  }, [deliveries, selected]);

  const fetchRoute = async (map, from, to) => {
    try {
      const url = hasMapbox
        ? `https://api.mapbox.com/directions/v5/mapbox/driving/${from.lng},${from.lat};${to.lng},${to.lat}?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`
        : `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?geometries=geojson&overview=full`;
      const res = await fetch(url);
      const data = await res.json();
      const coords = data.routes?.[0]?.geometry?.coordinates || [];
      map.getSource('route')?.setData({
        type: 'FeatureCollection',
        features: coords.length ? [{ type: 'Feature', geometry: { type: 'LineString', coordinates: coords } }] : [],
      });
    } catch { }
  };

  const focusDriver = (d) => {
    setSelected(d.id);
    if (!mapRef.current || !d.current_lat || !d.current_lng) return;
    // Fit map to show both shop and driver
    if (seller?.seller_lat && seller?.seller_lng) {
      const bounds = new mapboxgl.LngLatBounds()
        .extend([d.current_lng, d.current_lat])
        .extend([seller.seller_lng, seller.seller_lat]);
      mapRef.current.fitBounds(bounds, { padding: 80, maxZoom: 16, duration: 1200 });
    } else {
      mapRef.current.flyTo({ center: [d.current_lng, d.current_lat], zoom: 15 });
    }
    driverMarkersRef.current[d.id]?.togglePopup();
  };

  if (!seller) {
    navigate('/seller/login');
    return null;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#1B4332', paddingBottom: '40px' }}>

      {/* Header */}
      <div style={{ background: '#102433', padding: '18px 20px', borderBottom: '1px solid #244C66' }}>
        <button onClick={() => navigate('/seller/dashboard')} style={{ background: 'transparent', border: 'none', color: '#F39C12', fontSize: '1.1rem', cursor: 'pointer', marginBottom: '10px', padding: 0 }}>
          ← Dashboard
        </button>
        <h1 style={{ color: '#FFD966', fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>🗺️ Live Driver Tracking</h1>
        <p style={{ color: '#4A6080', fontSize: '0.8rem', marginTop: '4px' }}>{seller.shop_name} · Updates every 4s</p>
      </div>

      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

        {/* Map */}
        <div style={{ borderRadius: '20px', overflow: 'hidden', border: '2px solid #244C66', position: 'relative' }}>
          <div ref={mapContainerRef} style={{ height: '360px' }} />

          {/* Shop location badge */}
          {seller.seller_lat && (
            <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(243,156,18,0.92)', borderRadius: '12px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.85rem' }}>🍽️</span>
              <p style={{ color: '#1B4332', fontSize: '0.75rem', margin: 0, fontWeight: 700 }}>{seller.shop_name}</p>
            </div>
          )}

          {deliveries.length > 0 && (
            <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(39,174,96,0.92)', borderRadius: '12px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#fff', animation: 'stPulse 1.2s infinite' }} />
              <p style={{ color: '#fff', fontSize: '0.75rem', margin: 0, fontWeight: 700 }}>{deliveries.length} driver{deliveries.length > 1 ? 's' : ''} en route</p>
            </div>
          )}
        </div>

        {/* Active deliveries list */}
        {deliveries.length === 0 ? (
          <div style={{ background: '#102433', borderRadius: '18px', padding: '36px 20px', textAlign: 'center', border: '1px solid #244C66' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🛵</div>
            <p style={{ color: '#9BB7D4', fontWeight: 600, margin: 0 }}>No drivers en route right now</p>
            <p style={{ color: '#4A6080', fontSize: '0.82rem', marginTop: '8px' }}>When a driver accepts and picks up an order, they'll appear here live.</p>
          </div>
        ) : (
          <>
            <p style={{ color: '#9BB7D4', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>Drivers coming to your shop</p>
            {deliveries.map(d => {
              const isLive = !!(d.current_lat && d.current_lng);
              const isBike = /motorbike|bike|moto/i.test(d.vehicle || '');
              const isActive = selected === d.id;
              return (
                <div
                  key={d.id}
                  onClick={() => focusDriver(d)}
                  style={{
                    background: '#102433', borderRadius: '18px', padding: '16px 20px',
                    border: `2px solid ${isActive ? '#27AE60' : '#244C66'}`,
                    cursor: 'pointer', transition: 'border-color 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    {/* Animated driver icon */}
                    <div style={{
                      width: '50px', height: '50px', borderRadius: '50%',
                      background: isBike ? '#1B4332' : '#1a3a5c',
                      border: `2px solid ${isLive ? '#27AE60' : '#244C66'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.6rem', flexShrink: 0,
                      animation: isLive ? (isBike ? 'stBike .45s ease-in-out infinite' : 'stWalk .6s ease-in-out infinite') : 'none',
                    }}>
                      {isBike ? '🛵' : '🚶'}
                    </div>

                    <div style={{ flex: 1 }}>
                      <p style={{ color: '#FFD966', fontWeight: 700, fontSize: '0.95rem', margin: 0 }}>{d.driver_name}</p>
                      <p style={{ color: '#9BB7D4', fontSize: '0.8rem', margin: '3px 0' }}>
                        {isBike ? '🛵 Motorbike' : '🚶 On foot'} · {d.driver_status === 'accepted' ? 'Heading to your shop' : 'Items picked up'}
                      </p>
                      <p style={{ color: '#4A6080', fontSize: '0.75rem', margin: 0 }}>📦 {d.product_name} · {d.buyer_name}</p>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      {isLive
                        ? <span style={{ background: '#27AE6020', color: '#27AE60', borderRadius: '20px', padding: '4px 10px', fontSize: '0.72rem', fontWeight: 700 }}>● Live</span>
                        : <span style={{ background: '#F39C1220', color: '#F39C12', borderRadius: '20px', padding: '4px 10px', fontSize: '0.72rem', fontWeight: 700 }}>⏳ No GPS yet</span>
                      }
                    </div>
                  </div>

                  {isActive && (
                    <p style={{ color: '#27AE60', fontSize: '0.75rem', marginTop: '10px', marginBottom: 0, fontWeight: 600 }}>
                      Tap again to see route on map ↑
                    </p>
                  )}
                </div>
              );
            })}
          </>
        )}

        {/* Shop location info */}
        <div style={{ background: '#102433', borderRadius: '18px', padding: '14px 20px', border: '1px solid #244C66' }}>
          <p style={{ color: '#4A6080', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Your Shop Location</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.4rem' }}>🍽️</span>
            <div>
              <p style={{ color: '#FFD966', fontWeight: 700, margin: 0 }}>{seller.shop_name}</p>
              <p style={{ color: '#9BB7D4', fontSize: '0.82rem', margin: '2px 0 0' }}>
                📍 {seller.location}
                {seller.seller_lat && <span style={{ color: '#27AE60', marginLeft: '8px', fontSize: '0.75rem' }}>✓ GPS set</span>}
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SellerTrackMap;
