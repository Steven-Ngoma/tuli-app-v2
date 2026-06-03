import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN || '';
const hasValidMapboxToken = MAPBOX_TOKEN && MAPBOX_TOKEN !== 'REPLACE_ME';
const DEFAULT_LOCATION = { lat: -15.4167, lng: 28.2833 }; // Kamwala Market, Lusaka

// OSM raster style — always shows road names with zero API key needed
const OSM_STYLE = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
      maxzoom: 19,
    },
  },
  layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
};

const toRad = (v) => (v * Math.PI) / 180;
const toDeg = (v) => (v * 180) / Math.PI;

const getDistanceMeters = (lat1, lng1, lat2, lng2) => {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

const getBearing = (lat1, lng1, lat2, lng2) => {
  const dLng = toRad(lng2 - lng1);
  const y = Math.sin(dLng) * Math.cos(toRad(lat2));
  const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) - Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
};

const parseLatLng = (value = '') => {
  const match = value.trim().match(/^(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)$/);
  if (!match) return null;
  return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
};

const normalizeAddress = (v = '') => v.replace(/[-_|]/g, ' ').replace(/\s+/g, ' ').trim();

const geocodeAddress = async (value) => {
  const query = normalizeAddress(value);
  if (!query) return null;
  if (hasValidMapboxToken) {
    try {
      const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&limit=1&country=zm`);
      const data = await res.json();
      if (data.features?.length > 0) {
        const [lng, lat] = data.features[0].center;
        return { lat, lng };
      }
    } catch (e) { console.warn('Mapbox geocode failed', e); }
  }
  try {
    const lookup = async (q) => {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`, { headers: { 'Accept-Language': 'en' } });
      const d = await res.json();
      return d?.length ? { lat: parseFloat(d[0].lat), lng: parseFloat(d[0].lon) } : null;
    };
    return (await lookup(query + ' Zambia')) || (await lookup(query));
  } catch (e) { return null; }
};

const buildMapsUrl = (origin, dest) => {
  if (!dest) return '#';
  const o = origin ? `${origin.lat},${origin.lng}` : '';
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(o)}&destination=${encodeURIComponent(dest)}&travelmode=driving`;
};

const DASH_FRAMES = [
  [0,4,3],[0.5,4,2.5],[1,4,2],[1.5,4,1.5],[2,4,1],[2.5,4,0.5],[3,4,0],
  [0,0.5,3.5,3],[0,1,3,3],[0,1.5,3,2.5],[0,2,3,2],[0,2.5,3,1.5],[0,3,3,1],[0,3.5,3,0.5],
];

const DriverMap = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const ls = location.state || {};
  const order = ls.order || null;

  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const mapContainerRef = useRef(null);
  const voiceRef = useRef(null);
  const prevPosRef = useRef(null);
  const mapReadyRef = useRef(false);  // true once map 'load' fires

  const [position, setPosition] = useState(null);
  const [heading, setHeading] = useState(0);
  const [destinationCoords, setDestinationCoords] = useState(ls.destinationCoords || null);
  const [routeData, setRouteData] = useState(null);
  const [routeSteps, setRouteSteps] = useState([]);
  const [sellerCoords, setSellerCoords] = useState(null);
  const [buyerCoords, setBuyerCoords] = useState(null);
  const [routeStatus, setRouteStatus] = useState('Loading map...');
  const [message, setMessage] = useState('Getting your location...');
  const [error, setError] = useState('');
  const [thresholdStep, setThresholdStep] = useState(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  const destination = useMemo(() => {
    if (ls.destination) return ls.destination;
    if (!order) return '';
    return order.driver_status === 'accepted'
      ? (order.seller_address || order.delivery_address)
      : order.delivery_address;
  }, [ls.destination, order]);

  const destinationLabel = useMemo(() => {
    if (ls.destinationLabel) return ls.destinationLabel;
    if (!order) return 'Destination';
    return order.driver_status === 'accepted' ? 'Pickup from Seller' : 'Delivery to Buyer';
  }, [ls.destinationLabel, order]);

  const orderLabel = useMemo(() => {
    if (ls.orderLabel) return ls.orderLabel;
    if (!order) return 'Delivery';
    return `${order.buyer_name || 'Buyer'} • ${order.shop_name || 'Shop'}`;
  }, [ls.orderLabel, order]);

  // Derive real seller coords from order fields first
  const sellerCoordsFromOrder = useMemo(() => {
    if (!order) return null;
    if (order.seller_lat && order.seller_lng) return { lat: order.seller_lat, lng: order.seller_lng };
    return null;
  }, [order]);

  const effectiveOrigin = useMemo(
    () => position || sellerCoordsFromOrder || sellerCoords || DEFAULT_LOCATION,
    [position, sellerCoordsFromOrder, sellerCoords]
  );
  const effectiveDestination = useMemo(
    () => destinationCoords || buyerCoords,
    [destinationCoords, buyerCoords]
  );

  // ── Voice ────────────────────────────────────────────────────────────────
  const voiceSpeak = (text) => {
    if (!voiceEnabled || !window.speechSynthesis || !text) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    if (voiceRef.current) u.voice = voiceRef.current;
    u.rate = 1.02; u.pitch = 1.05;
    window.speechSynthesis.speak(u);
  };

  useEffect(() => {
    const load = () => {
      const voices = window.speechSynthesis.getVoices();
      if (!voices.length) return;
      voiceRef.current = voices.find(v => /female|woman|zira|samantha|victoria/i.test(v.name)) || voices[0];
    };
    load();
    window.speechSynthesis.addEventListener('voiceschanged', load);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', load);
  }, []);

  // ── GPS watch ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!order || !navigator.geolocation) {
      if (!navigator.geolocation) setError('Geolocation not supported.');
      return;
    }
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng, heading: h } = pos.coords;
        const next = { lat, lng };
        setPosition(next);
        if (typeof h === 'number' && !isNaN(h)) setHeading(h);
        else if (prevPosRef.current) setHeading(getBearing(prevPosRef.current.lat, prevPosRef.current.lng, lat, lng));
        prevPosRef.current = next;
      },
      () => {
        setMessage('GPS blocked — using seller location as start.');
        if (!position) setPosition(sellerCoordsFromOrder || DEFAULT_LOCATION);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order]);

  // ── Geocode destination text ─────────────────────────────────────────────
  useEffect(() => {
    if (!destination || destinationCoords) return;
    const parsed = parseLatLng(destination);
    if (parsed) { setDestinationCoords(parsed); return; }
    const run = async () => {
      const norm = normalizeAddress(destination);
      if (!norm) return;
      const lookup = async (q, zm = true) => {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1${zm ? '&countrycodes=zm' : ''}`, { headers: { 'Accept-Language': 'en' } });
        const d = await res.json();
        return d?.length ? { lat: parseFloat(d[0].lat), lng: parseFloat(d[0].lon) } : null;
      };
      const c = (await lookup(norm, true)) || (await lookup(norm, false));
      if (c) { setDestinationCoords(c); setMessage('Destination found. Drawing route...'); }
      else setError('Could not locate destination address.');
    };
    run();
  }, [destination, destinationCoords]);

  // ── Geocode seller + buyer addresses from order ──────────────────────────
  useEffect(() => {
    if (!order) return;
    if (sellerCoordsFromOrder && !sellerCoords) setSellerCoords(sellerCoordsFromOrder);

    const sellerText = order.seller_address || '';
    const buyerText = order.delivery_address || '';
    const ps = parseLatLng(sellerText);
    const pb = parseLatLng(buyerText);
    if (ps && !sellerCoords) setSellerCoords(ps);
    if (pb && !buyerCoords) setBuyerCoords(pb);

    const run = async () => {
      if (!sellerCoords && !sellerCoordsFromOrder && sellerText && !ps) {
        const c = await geocodeAddress(sellerText);
        if (c) setSellerCoords(c);
      }
      if (!buyerCoords && buyerText && !pb) {
        const c = await geocodeAddress(buyerText);
        if (c) setBuyerCoords(c);
      }
    };
    run();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order]);

  // ── Route fetch ──────────────────────────────────────────────────────────
  const fetchRoute = async (origin, dest) => {
    if (!mapReadyRef.current || !origin || !dest) return;
    try {
      const url = hasValidMapboxToken
        ? `https://api.mapbox.com/directions/v5/mapbox/driving/${origin.lng},${origin.lat};${dest.lng},${dest.lat}?geometries=geojson&overview=full&steps=true&annotations=congestion&access_token=${MAPBOX_TOKEN}`
        : `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${dest.lng},${dest.lat}?geometries=geojson&overview=full&steps=true`;
      const res = await fetch(url);
      const data = await res.json();
      const route = data.routes?.[0];
      if (!route) { setError('Route could not be calculated.'); return; }

      const coords = route.geometry?.coordinates || [];
      const congestion = route.legs?.[0]?.annotation?.congestion || [];
      const features = coords.slice(0, -1).map((c, i) => ({
        type: 'Feature',
        properties: { congestion: congestion[i] || 'low' },
        geometry: { type: 'LineString', coordinates: [c, coords[i + 1]] },
      }));

      const map = mapRef.current;
      map.getSource('route')?.setData({ type: 'FeatureCollection', features });
      map.getSource('destination')?.setData({
        type: 'FeatureCollection',
        features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: [dest.lng, dest.lat] } }],
      });

      const bounds = coords.reduce(
        (b, c) => b.extend(c),
        new mapboxgl.LngLatBounds([origin.lng, origin.lat], [origin.lng, origin.lat])
      );
      map.fitBounds(bounds, { padding: 70, maxZoom: 16, duration: 1200 });

      setRouteSteps((route.legs?.[0]?.steps || []).map((s, i) => ({
        id: `${s.maneuver?.type || 'step'}-${i}`,
        instruction: s.maneuver?.instruction || s.name || `Continue ${Math.round(s.distance || 0)}m`,
        distance: s.distance,
      })));
      setRouteData(route);
      setRouteStatus('Route active — follow the coloured path.');
      setMessage('Voice guidance enabled. Listen for turn instructions.');
      voiceSpeak(`Route loaded. ${route.legs[0]?.summary || 'Follow the map.'}`);
    } catch (e) {
      setError('Failed to load route. Check your connection.');
    }
  };

  // ── Init map ONCE on mount — OSM tiles always show road names ───────────
  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return;

    const initCenter = sellerCoordsFromOrder || DEFAULT_LOCATION;
    if (hasValidMapboxToken) mapboxgl.accessToken = MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: hasValidMapboxToken ? 'mapbox://styles/mapbox/streets-v12' : OSM_STYLE,
      center: [initCenter.lng, initCenter.lat],
      zoom: 14,
    });

    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-right');

    // Driver marker
    const el = document.createElement('div');
    el.style.cssText = 'width:42px;height:42px;display:flex;align-items:center;justify-content:center;background:rgba(39,174,96,0.95);border:2px solid #fff;border-radius:50%;box-shadow:0 0 0 10px rgba(39,174,96,0.15);transition:transform 0.25s ease-out';
    const arrow = document.createElement('div');
    arrow.innerText = '➤';
    arrow.style.cssText = 'color:#fff;font-size:22px;transform:translateY(-1px)';
    el.appendChild(arrow);

    markerRef.current = new mapboxgl.Marker({ element: el, anchor: 'center' })
      .setLngLat([initCenter.lng, initCenter.lat])
      .addTo(map);

    map.on('load', () => {
      // Route source + traffic-coloured line
      map.addSource('route', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': [
            'match', ['get', 'congestion'],
            'low',      '#27AE60',  // green  — clear
            'moderate', '#F1C40F',  // yellow — slow
            'heavy',    '#E74C3C',  // red    — heavy
            'severe',   '#C0392B',  // dark   — severe
            '#27AE60',
          ],
          'line-width': 7,
          'line-opacity': 0.93,
        },
      });

      // Animated white dash overlay — makes route "flow"
      map.addLayer({
        id: 'route-line-animated',
        type: 'line',
        source: 'route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#FFFFFF', 'line-width': 2, 'line-opacity': 0.55, 'line-dasharray': [0, 4, 3] },
      });

      // Destination circle
      map.addSource('destination', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({
        id: 'destination-point',
        type: 'circle',
        source: 'destination',
        paint: { 'circle-radius': 11, 'circle-color': '#F39C12', 'circle-stroke-color': '#fff', 'circle-stroke-width': 3 },
      });

      mapRef.current = map;
      mapReadyRef.current = true;
      setRouteStatus('Map loaded — resolving route...');

      // Dash animation loop
      let dashStep = 0;
      const animateDash = () => {
        if (!mapRef.current) return;
        dashStep = (dashStep + 1) % DASH_FRAMES.length;
        if (map.getLayer('route-line-animated')) {
          map.setPaintProperty('route-line-animated', 'line-dasharray', DASH_FRAMES[dashStep]);
        }
        requestAnimationFrame(animateDash);
      };
      requestAnimationFrame(animateDash);
    });

    mapRef.current = map; // store early so cleanup works
    return () => { map.remove(); mapRef.current = null; mapReadyRef.current = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Re-fetch route whenever origin or destination changes ────────────────
  useEffect(() => {
    fetchRoute(effectiveOrigin, effectiveDestination);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveOrigin, effectiveDestination]);

  // ── Fly to real origin when coords arrive ────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !mapReadyRef.current || !effectiveOrigin) return;
    mapRef.current.flyTo({ center: [effectiveOrigin.lng, effectiveOrigin.lat], zoom: 14, speed: 1.2 });
  }, [effectiveOrigin]);

  // ── Animate driver marker as position updates ────────────────────────────
  useEffect(() => {
    if (!position || !mapRef.current || !markerRef.current) return;
    markerRef.current.setLngLat([position.lng, position.lat]);
    mapRef.current.easeTo({ center: [position.lng, position.lat], duration: 1200 });
  }, [position]);

  useEffect(() => {
    if (!markerRef.current || typeof heading !== 'number') return;
    markerRef.current.getElement().style.transform = `rotate(${heading}deg)`;
  }, [heading]);

  // ── Proximity voice alerts ────────────────────────────────────────────────
  useEffect(() => {
    if (!routeData || !position || !destinationCoords) return;
    const d = getDistanceMeters(position.lat, position.lng, destinationCoords.lat, destinationCoords.lng);
    const next = d <= 50 ? 50 : d <= 150 ? 150 : d <= 400 ? 400 : d <= 1000 ? 1000 : 2000;
    if (next === thresholdStep) return;
    setThresholdStep(next);
    if (next <= 50)   { setRouteStatus('Arrived!'); voiceSpeak('You have arrived. Complete the delivery.'); }
    else if (next <= 150) { setRouteStatus('150m to destination.'); voiceSpeak('150 meters to destination.'); }
    else if (next <= 400) setRouteStatus('Under 400m — nearly there.');
    else if (next <= 1000) setRouteStatus('About 1km remaining.');
    else setRouteStatus('Route active — follow the coloured path.');
  }, [position, routeData, destinationCoords, thresholdStep]);

  if (!order) {
    return (
      <div style={{ minHeight: '100vh', background: '#1B4332', color: 'white', padding: 20 }}>
        <h2 style={{ color: '#FFD966' }}>Navigation</h2>
        <p>No order selected. Go back and choose a delivery first.</p>
        <button onClick={() => navigate('/driver/dashboard')} style={{ marginTop: 20, padding: '12px 18px', borderRadius: 20, border: 'none', background: '#27AE60', color: 'white', cursor: 'pointer' }}>
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#102433', color: '#EAF4FA', padding: '20px' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ color: '#FFD966', fontSize: '1.8rem', margin: 0 }}>🗺️ Live Driver Navigation</h2>
            <p style={{ margin: '8px 0 0', color: '#9BB7D4' }}>{orderLabel}</p>
          </div>
          <button onClick={() => navigate('/driver/dashboard')} style={{ background: 'transparent', border: '1px solid #27AE60', borderRadius: 24, padding: '10px 16px', color: '#27AE60', cursor: 'pointer' }}>
            Back
          </button>
        </div>

        <div style={{ background: '#1B4332', borderRadius: 24, padding: 20, border: '1px solid #244C66', display: 'grid', gap: 18 }}>
          <div style={{ display: 'grid', gap: 6 }}>
            <p style={{ margin: 0, color: '#9BB7D4', fontSize: '0.85rem' }}>{destinationLabel}</p>
            <h3 style={{ margin: 0, color: '#FFFFFF' }}>{formatAddress(destination)}</h3>
          </div>

          {/* MAP — always visible, OSM tiles load without token */}
          <div style={{ position: 'relative', height: '420px', borderRadius: 24, overflow: 'hidden', border: '1px solid #244C66' }}>
            <div ref={mapContainerRef} style={{ position: 'absolute', inset: 0 }} />
          </div>

          {/* Traffic legend */}
          <div style={{ display: 'flex', gap: 12, padding: '10px 14px', borderRadius: 16, background: '#0F2A3D', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ color: '#9BB7D4', fontSize: '0.8rem' }}>Traffic:</span>
            {[['#27AE60','Clear'],['#F1C40F','Slow'],['#E74C3C','Heavy'],['#C0392B','Severe']].map(([color, label]) => (
              <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.8rem', color: '#EAF4FA' }}>
                <span style={{ width: 16, height: 6, borderRadius: 3, background: color, display: 'inline-block' }} />
                {label}
              </span>
            ))}
          </div>

          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr' }}>
            <div style={{ padding: 16, borderRadius: 18, background: '#0F2A3D' }}>
              <p style={{ margin: 0, color: '#9BB7D4', fontSize: '0.85rem' }}>Route status</p>
              <p style={{ margin: '8px 0 0', color: '#FFFFFF', fontWeight: 700, lineHeight: 1.4 }}>{routeStatus}</p>
            </div>
            <div style={{ padding: 16, borderRadius: 18, background: '#0F2A3D' }}>
              <p style={{ margin: 0, color: '#9BB7D4', fontSize: '0.85rem' }}>Advice</p>
              <p style={{ margin: '8px 0 0', color: '#FFFFFF', lineHeight: 1.4 }}>{error || message}</p>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr' }}>
            <button onClick={() => setVoiceEnabled(v => !v)} style={{ padding: '14px 18px', borderRadius: 20, border: '1px solid #27AE60', background: voiceEnabled ? '#27AE60' : 'transparent', color: voiceEnabled ? '#102433' : '#27AE60', fontWeight: 700, cursor: 'pointer' }}>
              {voiceEnabled ? 'Mute Voice' : 'Enable Voice'}
            </button>
            <button onClick={() => window.location.reload()} style={{ padding: '14px 18px', borderRadius: 20, border: '1px solid #27AE60', background: 'transparent', color: '#27AE60', fontWeight: 700, cursor: 'pointer' }}>
              Refresh GPS & Route
            </button>
          </div>

          {routeSteps.length > 0 && (
            <div style={{ display: 'grid', gap: 10, padding: 16, borderRadius: 18, background: '#0F2A3D' }}>
              <p style={{ margin: 0, color: '#9BB7D4', fontSize: '0.85rem' }}>Next directions</p>
              {routeSteps.slice(0, 4).map((step) => (
                <div key={step.id} style={{ padding: '12px 14px', borderRadius: 16, background: '#102433', color: '#FFFFFF' }}>
                  <p style={{ margin: 0, fontWeight: 700, lineHeight: 1.4 }}>{step.instruction}</p>
                  {typeof step.distance === 'number' && (
                    <p style={{ margin: '4px 0 0', color: '#A3C4D9', fontSize: '0.82rem' }}>{Math.round(step.distance)} m</p>
                  )}
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr' }}>
            <a href={buildMapsUrl(position || effectiveOrigin, destination)} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
              <button style={{ width: '100%', padding: '14px 18px', borderRadius: 20, border: 'none', background: '#27AE60', color: '#102433', fontSize: '1rem', fontWeight: 700, cursor: 'pointer' }}>
                Open Google Maps
              </button>
            </a>
            <button onClick={() => voiceSpeak('Follow the coloured route on the map to the orange destination marker.')} style={{ width: '100%', padding: '14px 18px', borderRadius: 20, border: '1px solid #27AE60', background: 'transparent', color: '#27AE60', fontSize: '1rem', fontWeight: 700, cursor: 'pointer' }}>
              Replay Guidance
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const formatAddress = (addr = '') => {
  if (!addr) return 'No address';
  return addr.split(',').map(p => p.trim()).filter(Boolean).slice(0, 3).join(', ');
};

export default DriverMap;
