import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const API = 'https://tuli-backend-44vd.onrender.com';

const CATEGORIES = [
  { label: 'All', icon: '🛒' },
  { label: 'Tomatoes', icon: '🍅' },
  { label: 'Vegetables', icon: '🥬' },
  { label: 'Fruits', icon: '🍊' },
  { label: 'Onions & Garlic', icon: '🧅' },
  { label: 'Leafy Greens', icon: '🥦' },
  { label: 'Other', icon: '🌽' },
];

// Restaurant-only ad slides
const SLIDES = [
  { title: 'Grilled Chicken Platter', desc: 'Juicy grilled chicken with nshima & relish', price: 'K85', shop: 'Flavour Foods', img: 'https://res.cloudinary.com/daxhjv2lt/image/upload/v1774699114/tuli/gpbqs8cwpkltovzyz9rp.jpg' },
  { title: 'Special Lunch Deal', desc: 'Full meal + drink every weekday', price: 'K65', shop: 'Lusaka Grill House', img: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80' },
  { title: 'Fresh Breakfast', desc: 'Start your day right — served from 7am', price: 'K45', shop: 'Morning Bites Café', img: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=600&q=80' },
  { title: 'Family Dinner Special', desc: 'Feed the whole family for less', price: 'K250', shop: "Mama's Kitchen", img: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80' },
];

const Banner = () => {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef(null);

  const startTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setCurrent(p => (p + 1) % SLIDES.length), 4000);
  };

  useEffect(() => { startTimer(); return () => clearInterval(timerRef.current); }, []);

  const go = (i) => { setCurrent(i); startTimer(); };

  return (
    <div style={{ position: 'relative', width: '100%', height: '200px', borderRadius: '20px', overflow: 'hidden', marginBottom: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
      {SLIDES.map((s, i) => (
        <div key={i} style={{ position: 'absolute', inset: 0, opacity: i === current ? 1 : 0, transition: 'opacity 0.6s ease', backgroundImage: `url(${s.img})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(27,67,50,0.85) 0%, rgba(27,67,50,0.3) 100%)' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px 20px' }}>
            <span style={{ background: '#F39C12', color: '#1B4332', padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700 }}>{s.shop}</span>
            <p style={{ color: '#fff', fontWeight: 800, fontSize: '1.3rem', margin: '6px 0 2px', textShadow: '1px 1px 4px rgba(0,0,0,0.4)' }}>{s.title}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.82rem', margin: 0 }}>{s.desc}</p>
              <span style={{ color: '#FFD966', fontWeight: 800, fontSize: '1rem' }}>{s.price}</span>
            </div>
          </div>
        </div>
      ))}
      {/* Arrows */}
      <button onClick={() => go((current - 1 + SLIDES.length) % SLIDES.length)} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.35)', border: 'none', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3 }}>‹</button>
      <button onClick={() => go((current + 1) % SLIDES.length)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.35)', border: 'none', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3 }}>›</button>
      {/* Dots */}
      <div style={{ position: 'absolute', bottom: '10px', right: '16px', display: 'flex', gap: '5px', zIndex: 3 }}>
        {SLIDES.map((_, i) => (
          <span key={i} onClick={() => go(i)} style={{ width: i === current ? '20px' : '7px', height: '7px', borderRadius: '10px', background: i === current ? '#F39C12' : 'rgba(255,255,255,0.6)', cursor: 'pointer', transition: 'all 0.3s' }} />
        ))}
      </div>
    </div>
  );
};

const Marketplace = () => {
  const [products, setProducts] = useState([]);
  const [shops, setShops] = useState([]);
  const [tab, setTab] = useState('products');
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState({}); // productId -> qty
  const [orderModal, setOrderModal] = useState(null);
  const [orderForm, setOrderForm] = useState({ buyer_name: '', delivery_address: '', delivery_time: '' });
  const [ordering, setOrdering] = useState(false);
  const [orderDone, setOrderDone] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    const url = tab === 'vendors' ? `${API}/shops` : tab === 'restaurants' ? `${API}/restaurants` : `${API}/products`;
    fetch(url)
      .then(r => r.json())
      .then(data => {
        if (tab === 'products') setProducts(Array.isArray(data) ? data : []);
        else setShops(Array.isArray(data) ? data : []);
      })
      .catch(() => { setProducts([]); setShops([]); })
      .finally(() => setLoading(false));
  }, [tab]);

  const getQty = (id) => quantities[id] || 0;

  const changeQty = (product, delta) => {
    const current = getQty(product.id);
    const next = Math.max(0, Math.min(product.stock_limit || 20, current + delta));
    setQuantities(q => ({ ...q, [product.id]: next }));
  };

  const openOrder = (product) => {
    setOrderModal({ product, qty: getQty(product.id) || 1 });
    setOrderForm({ buyer_name: localStorage.getItem('buyer_name') || '', delivery_address: '', delivery_time: '' });
    setOrderDone(false);
  };

  const submitOrder = async (e) => {
    e.preventDefault();
    setOrdering(true);
    try {
      const { product, qty } = orderModal;
      const note = `Qty: ${qty}` + (orderForm.delivery_time ? ` | Delivery time: ${orderForm.delivery_time}` : '');
      await fetch(`${API}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: product.id,
          seller_id: product.seller_id,
          buyer_name: orderForm.buyer_name,
          original_price: product.price,
          final_price: product.price,
          delivery_address: orderForm.delivery_address + ' | ' + note,
        })
      });
      localStorage.setItem('buyer_name', orderForm.buyer_name);
      setQuantities(q => ({ ...q, [product.id]: 0 }));
      setOrderDone(true);
    } catch { } finally { setOrdering(false); }
  };

  const filteredProducts = products.filter(p => {
    const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.shop_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.location?.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'All' || p.category === category;
    return matchSearch && matchCat;
  });

  const filteredShops = shops.filter(s =>
    s.shop_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.location?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ background: '#f5f5f5', minHeight: '100vh' }}>

      {/* Order Modal */}
      {orderModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', padding: '28px 24px', width: '100%', maxWidth: '480px', boxShadow: '0 -8px 40px rgba(0,0,0,0.2)' }}>
            {orderDone ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: '3rem', marginBottom: '12px' }}>✅</div>
                <h3 style={{ color: '#1B4332', marginBottom: '8px' }}>Order Placed!</h3>
                <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '20px' }}>The seller has been notified and will confirm your order shortly.</p>
                <button onClick={() => setOrderModal(null)} className="btn-primary" style={{ width: '100%' }}>Done</button>
              </div>
            ) : (
              <>
                {/* Product row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                  <div style={{ width: '60px', height: '60px', borderRadius: '12px', background: '#fff', border: '1px solid #eee', overflow: 'hidden', flexShrink: 0 }}>
                    {orderModal.product.image_url
                      ? <img src={orderModal.product.image_url} alt={orderModal.product.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      : <span style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>🥬</span>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ color: '#1B4332', fontSize: '1rem', marginBottom: '2px' }}>{orderModal.product.name}</h3>
                    <p style={{ color: '#E67E22', fontWeight: 700 }}>{orderModal.product.price}</p>
                  </div>
                  <button onClick={() => setOrderModal(null)} style={{ background: 'transparent', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#888' }}>✕</button>
                </div>

                {/* Quantity selector */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f5f5f5', borderRadius: '16px', padding: '12px 16px', marginBottom: '16px' }}>
                  <span style={{ color: '#1B4332', fontWeight: 600, fontSize: '0.95rem' }}>Quantity</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button onClick={() => setOrderModal(m => ({ ...m, qty: Math.max(1, m.qty - 1) }))}
                      style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid #1B4332', background: '#fff', color: '#1B4332', fontSize: '1.2rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</button>
                    <span style={{ color: '#1B4332', fontWeight: 800, fontSize: '1.1rem', minWidth: '24px', textAlign: 'center' }}>{orderModal.qty}</span>
                    <button onClick={() => setOrderModal(m => ({ ...m, qty: Math.min(orderModal.product.stock_limit || 20, m.qty + 1) }))}
                      style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', background: '#1B4332', color: '#FFD966', fontSize: '1.2rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                  </div>
                </div>

                <form onSubmit={submitOrder} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <input placeholder="Your name *" value={orderForm.buyer_name}
                    onChange={e => setOrderForm({ ...orderForm, buyer_name: e.target.value })} required
                    style={{ padding: '12px 16px', borderRadius: '40px', border: '1px solid #ddd', fontSize: '0.95rem', outline: 'none' }} />
                  <input placeholder="Delivery address *" value={orderForm.delivery_address}
                    onChange={e => setOrderForm({ ...orderForm, delivery_address: e.target.value })} required
                    style={{ padding: '12px 16px', borderRadius: '40px', border: '1px solid #ddd', fontSize: '0.95rem', outline: 'none' }} />
                  <input placeholder="Preferred delivery time e.g. Today 3pm" value={orderForm.delivery_time}
                    onChange={e => setOrderForm({ ...orderForm, delivery_time: e.target.value })}
                    style={{ padding: '12px 16px', borderRadius: '40px', border: '1px solid #ddd', fontSize: '0.95rem', outline: 'none' }} />
                  <button type="submit" className="btn-primary" disabled={ordering} style={{ width: '100%', marginTop: '4px' }}>
                    {ordering ? 'Placing order...' : `Place Order • ${orderModal.qty} item${orderModal.qty > 1 ? 's' : ''}`}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ background: '#1B4332', padding: '24px 0 0' }}>
        <div className="container">
          <h1 style={{ color: '#FFD966', fontSize: '1.8rem', fontWeight: 800, marginBottom: '4px' }}>
            🛒 Local Market
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', marginBottom: '16px' }}>
            Fresh tomatoes, vegetables & fruits from Lusaka's local markets
          </p>

          {/* Search */}
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '1rem' }}>🔍</span>
            <input
              type="text"
              placeholder="Search products, shops, location..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '12px 16px 12px 40px', borderRadius: '40px', border: 'none', background: 'rgba(255,255,255,0.95)', color: '#1B4332', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0', borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
            {[
              { key: 'products', label: 'Produce' },
              { key: 'restaurants', label: 'Restaurants' },
              { key: 'vendors', label: 'Vendors' },
            ].map(t => (
              <button key={t.key} onClick={() => { setTab(t.key); setSearch(''); setCategory('All'); }}
                style={{
                  padding: '10px 20px', border: 'none', cursor: 'pointer', fontWeight: 700,
                  fontSize: '0.88rem', background: 'transparent',
                  color: tab === t.key ? '#F39C12' : 'rgba(255,255,255,0.6)',
                  borderBottom: tab === t.key ? '3px solid #F39C12' : '3px solid transparent',
                  transition: '0.2s', marginBottom: '-2px'
                }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '16px 28px' }}>

        <p style={{ color: '#888', fontSize: '0.72rem', marginBottom: '6px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>🍽️ Restaurant Deals Near You</p>
        <Banner />

        {/* Category Filter - only for products tab */}
        {tab === 'products' && (
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '16px', scrollbarWidth: 'none' }}>
            {CATEGORIES.map(cat => (
              <button key={cat.label} onClick={() => setCategory(cat.label)}
                style={{
                  padding: '8px 16px', borderRadius: '40px', border: 'none', cursor: 'pointer',
                  fontWeight: 600, fontSize: '0.82rem', whiteSpace: 'nowrap',
                  background: category === cat.label ? '#1B4332' : '#fff',
                  color: category === cat.label ? '#FFD966' : '#4A6080',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)', transition: '0.2s'
                }}>
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#4A6080' }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⏳</div>
            <p>Loading...</p>
          </div>
        ) : tab === 'products' ? (
          <>
            <p style={{ color: '#888', fontSize: '0.82rem', marginBottom: '12px' }}>
              {filteredProducts.length} item{filteredProducts.length !== 1 ? 's' : ''} found
            </p>
            {filteredProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#4A6080' }}>
                <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🔍</div>
                <p style={{ fontSize: '1.1rem' }}>No products found</p>
                <p style={{ fontSize: '0.85rem', marginTop: '8px' }}>Try a different search or category</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                {filteredProducts.map(product => {
                  const qty = getQty(product.id);
                  const max = product.stock_limit || 20;
                  return (
                    <div key={product.id}
                      style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', display: 'flex', flexDirection: 'column' }}>
                      {/* White background image area */}
                      <div style={{ background: '#fff', height: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderBottom: '1px solid #f0f0f0' }}>
                        {product.image_url
                          ? <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                          : <span style={{ fontSize: '3rem' }}>🥬</span>}
                      </div>
                      <div style={{ padding: '10px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <p style={{ color: '#1B4332', fontWeight: 700, fontSize: '0.88rem', marginBottom: '2px' }}>{product.name}</p>
                        {/* Price row + quantity stepper */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                          <p style={{ color: '#E67E22', fontWeight: 800, fontSize: '1rem', margin: 0 }}>{product.price}</p>
                          {qty === 0 ? (
                            <button
                              onClick={e => { e.stopPropagation(); changeQty(product, 1); }}
                              style={{ width: '30px', height: '30px', borderRadius: '50%', border: 'none', background: '#1B4332', color: '#FFD966', fontSize: '1.3rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>+</button>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <button onClick={e => { e.stopPropagation(); changeQty(product, -1); }}
                                style={{ width: '26px', height: '26px', borderRadius: '50%', border: '2px solid #1B4332', background: '#fff', color: '#1B4332', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</button>
                              <span style={{ color: '#1B4332', fontWeight: 800, fontSize: '0.95rem', minWidth: '16px', textAlign: 'center' }}>{qty}</span>
                              <button onClick={e => { e.stopPropagation(); changeQty(product, 1); }}
                                style={{ width: '26px', height: '26px', borderRadius: '50%', border: 'none', background: '#1B4332', color: '#FFD966', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                            </div>
                          )}
                        </div>
                        {qty > 0 && (
                          <button
                            onClick={e => { e.stopPropagation(); openOrder(product); }}
                            style={{ background: '#1B4332', color: '#FFD966', border: 'none', borderRadius: '20px', padding: '7px', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', marginTop: '8px' }}>
                            Order {qty} item{qty > 1 ? 's' : ''} →
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <>
            <p style={{ color: '#888', fontSize: '0.82rem', marginBottom: '12px' }}>
              {filteredShops.length} {tab === 'restaurants' ? 'restaurant' : 'vendor'}{filteredShops.length !== 1 ? 's' : ''} found
            </p>
            {filteredShops.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#4A6080' }}>
                <div style={{ fontSize: '3rem', marginBottom: '12px' }}>{tab === 'restaurants' ? '🍽️' : '🏪'}</div>
                <p style={{ fontSize: '1.1rem' }}>No {tab === 'restaurants' ? 'restaurants' : 'market vendors'} found</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                {filteredShops.map(shop => {
                  const online = shop.last_seen && (new Date() - new Date(shop.last_seen + 'Z')) / 1000 < 120;
                  const coverImg = shop.cover_image || shop.logo_url;
                  return (
                    <div key={shop.id}
                      onClick={() => navigate(tab === 'restaurants' ? `/restaurant/${shop.id}` : `/shop/${shop.id}`)}
                      style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ position: 'relative', height: '130px', background: '#1B4332', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {coverImg
                          ? <img src={coverImg} alt={shop.shop_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <span style={{ fontSize: '3rem' }}>{tab === 'restaurants' ? '🍽️' : '🥬'}</span>}
                        {tab === 'restaurants' ? (
                          online ? (
                            <span style={{ position: 'absolute', top: '8px', left: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '14px', height: '14px' }}>
                              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#27AE60', display: 'block', boxShadow: '0 0 0 0 rgba(39,174,96,0.7)', animation: 'pulseOnline 1.5s ease-in-out infinite' }} />
                            </span>
                          ) : (
                            <span style={{ position: 'absolute', top: '8px', left: '8px', background: '#E74C3C', color: '#fff', fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: '20px' }}>● Closed</span>
                          )
                        ) : (
                          <span style={{ position: 'absolute', top: '8px', left: '8px', background: online ? '#27AE60' : '#E74C3C', color: '#fff', fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: '20px' }}>
                            {online ? '● Active' : '● Away'}
                          </span>
                        )}
                      </div>
                      <div style={{ padding: '10px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <p style={{ color: '#1B4332', fontWeight: 700, fontSize: '0.88rem', marginBottom: '4px' }}>{shop.shop_name}</p>
                        <p style={{ color: '#888', fontSize: '0.72rem', marginBottom: '2px' }}>📍 {shop.location}</p>
                        <p style={{ color: '#E67E22', fontWeight: 700, fontSize: '0.78rem', marginBottom: '10px' }}>
                          {tab === 'restaurants' ? `${shop.item_count || 0} items on menu` : `${shop.product_count || 0} produce items`}
                        </p>
                        <button style={{ background: '#1B4332', color: '#FFD966', border: 'none', borderRadius: '20px', padding: '7px', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', marginTop: 'auto' }}>
                          {tab === 'restaurants' ? 'View Menu →' : 'View Stall →'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Sell CTA */}
        <div style={{ marginTop: '32px', background: '#1B4332', borderRadius: '24px', padding: '28px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🛒</div>
          <h3 style={{ color: '#FFD966', marginBottom: '8px', fontSize: '1.2rem' }}>Sell your produce on TULI</h3>
          <p style={{ color: 'rgba(255,255,255,0.75)', marginBottom: '20px', fontSize: '0.88rem' }}>
            Market vendor in Lusaka? List your tomatoes, vegetables & fruits — reach customers across the city
          </p>
          <a href="/seller/register" className="btn-primary" style={{ fontSize: '0.9rem', padding: '10px 28px' }}>
            Register as Vendor →
          </a>
        </div>

      </div>
    </div>
  );
};

export default Marketplace;
