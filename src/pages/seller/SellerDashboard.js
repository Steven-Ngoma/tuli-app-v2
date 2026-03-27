import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const categories = ['Electronics', 'Shoes', 'Clothes', 'Home Goods', 'Books & Stationery', 'Restaurant & Food', 'Other'];
const foodCategories = ['Starters', 'Main Course', 'Sides', 'Drinks', 'Desserts', 'Other'];
const emptyForm = { name: '', category: 'Electronics', price: '', location: '', description: '', food_category: '' };

const SellerDashboard = () => {
  const navigate = useNavigate();
  const seller = JSON.parse(localStorage.getItem('seller') || 'null');
  const defaultCategory = seller?.shop_type === 'service' ? 'Restaurant & Food' : 'Electronics';
  const [tab, setTab] = useState('listings');
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ ...emptyForm, category: defaultCategory });
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [extraFiles, setExtraFiles] = useState([]);
  const [extraPreviews, setExtraPreviews] = useState([]);
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [orders, setOrders] = useState([]);
  const [readChats, setReadChats] = useState(() => JSON.parse(localStorage.getItem('read_chats') || '{}'));
  const unreadCount = chats.reduce((total, c) => {
    const seen = readChats[c.room_id];
    const unread = seen == null ? (c.buyer_msg_count || 0) : Math.max(0, (c.buyer_msg_count || 0) - seen);
    return total + unread;
  }, 0);
  const msgBoxRef = useRef(null);
  const shouldScrollRef = useRef(false);

  useEffect(() => {
    if (!seller) { navigate('/seller/login'); return; }
    fetchProducts();
    fetchChats();
    fetchOrders();
    const ping = () => fetch(`http://localhost:8000/sellers/${seller.id}/ping`, { method: 'POST' }).catch(() => {});
    ping();
    const interval = setInterval(fetchChats, 3000);
    const pingInterval = setInterval(ping, 30000);
    return () => { clearInterval(interval); clearInterval(pingInterval); };
  }, []);

  useEffect(() => {
    if (!activeChat) {
      document.documentElement.style.overflow = '';
      return;
    }
    fetchChatMessages(activeChat.room_id, true);
    document.documentElement.style.overflow = 'hidden';
    const interval = setInterval(() => fetchChatMessages(activeChat.room_id), 3000);
    return () => {
      clearInterval(interval);
      document.documentElement.style.overflow = '';
    };
  }, [activeChat]);

  useEffect(() => {
    if (shouldScrollRef.current && msgBoxRef.current) {
      msgBoxRef.current.scrollTop = msgBoxRef.current.scrollHeight;
      shouldScrollRef.current = false;
    }
  }, [chatMessages]);

  const fetchProducts = async () => {
    try {
      const res = await fetch(`http://localhost:8000/products?seller_id=${seller.id}`);
      setProducts(await res.json());
    } catch { setProducts([]); }
  };

  const fetchChats = async () => {
    try {
      const res = await fetch(`http://localhost:8000/chat/seller/${seller.id}`);
      setChats(await res.json());
    } catch { setChats([]); }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch(`http://localhost:8000/orders/seller/${seller.id}`);
      setOrders(await res.json());
    } catch { setOrders([]); }
  };

  const updateOrderStatus = async (orderId, status) => {
    await fetch(`http://localhost:8000/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    fetchOrders();
  };

  const fetchChatMessages = async (roomId, forceScroll = false) => {
    try {
      const res = await fetch(`http://localhost:8000/chat/${roomId}`);
      const data = await res.json();
      if (forceScroll) {
        shouldScrollRef.current = true;
      } else if (msgBoxRef.current) {
        const box = msgBoxRef.current;
        shouldScrollRef.current = box.scrollHeight - box.scrollTop - box.clientHeight < 60;
      }
      setChatMessages(data);
    } catch { setChatMessages([]); }
  };

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleImageChange = e => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    try {
      let image_url = '';
      if (imageFile) {
        const formData = new FormData();
        formData.append('file', imageFile);
        const uploadRes = await fetch('http://localhost:8000/upload', { method: 'POST', body: formData });
        if (!uploadRes.ok) throw new Error('Image upload failed');
        image_url = (await uploadRes.json()).url;
      }
      let extra_images = [];
      if (extraFiles.length > 0) {
        const formData = new FormData();
        extraFiles.forEach(f => formData.append('files', f));
        const uploadRes = await fetch('http://localhost:8000/upload-multiple', { method: 'POST', body: formData });
        if (uploadRes.ok) extra_images = (await uploadRes.json()).urls;
      }
      const res = await fetch('http://localhost:8000/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, seller_id: seller.id, image_url, extra_images, food_category: form.food_category || null })
      });
      if (!res.ok) throw new Error('Failed to add product');
      setMsg('Product listed successfully!');
      setForm({ ...emptyForm, category: defaultCategory });
      setImageFile(null);
      setImagePreview('');
      setExtraFiles([]);
      setExtraPreviews([]);
      setShowForm(false);
      fetchProducts();
    } catch (err) {
      setMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this listing?')) return;
    await fetch(`http://localhost:8000/products/${id}`, { method: 'DELETE' });
    fetchProducts();
  };

  const containsPhone = t => /(?:\+?26)?0[79]\d{8}|\b\d{10,}\b/.test(t.replace(/[\s\-]/g, ''));
  const containsSocial = t => /(facebook|fb\.com|instagram|insta|whatsapp|wa\.me|tiktok|twitter|telegram|snapchat|linkedin|youtube|messenger|signal|viber|wechat|imo)/i.test(t);
  const isBlocked = t => containsPhone(t) || containsSocial(t);
  const blockedMsg = '⚠️ This message was blocked. Sharing contact details or social media is not allowed on TULI. Please keep all communication on the platform.';

  const handleReply = async e => {
    e.preventDefault();
    if (!replyText.trim() || !activeChat) return;
    if (isBlocked(replyText)) {
      alert(blockedMsg);
      return;
    }
    await fetch('http://localhost:8000/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room_id: activeChat.room_id, sender: seller.shop_name, message: replyText.trim(), is_seller: true })
    });
    setReplyText('');
    fetchChatMessages(activeChat.room_id, true);
  };

  const handleLogout = () => {
    localStorage.removeItem('seller');
    navigate('/');
  };

  if (!seller) return null;

  return (
    <>
    {activeChat && (
      <div style={{ position: 'fixed', inset: 0, background: '#0A1928', zIndex: 200, display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <div style={{ background: '#102433', padding: '14px 20px', borderBottom: '1px solid #244C66', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <button onClick={() => setActiveChat(null)} style={{ background: 'transparent', border: 'none', color: '#F39C12', fontSize: '1.4rem', cursor: 'pointer', padding: 0 }}>←</button>
          <div>
            <div style={{ color: '#FFD966', fontWeight: 700 }}>{activeChat.buyer_name}</div>
            <div style={{ color: '#9BB7D4', fontSize: '0.8rem' }}>Re: {activeChat.product_name}</div>
          </div>
        </div>
        <div ref={msgBoxRef} style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', background: '#0D1F2E', minHeight: 0 }}>
          {chatMessages.map(m => {
            const isMine = m.is_seller;
            return (
              <div key={m.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '70%', padding: '10px 14px', wordBreak: 'break-word',
                  borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: isMine ? '#F39C12' : '#0A1928',
                  color: isMine ? '#0A1928' : '#EFF3F8',
                  border: isMine ? 'none' : '1px solid #244C66'
                }}>
                  <div style={{ fontSize: '0.9rem' }}>{m.message}</div>
                  <div style={{ fontSize: '0.65rem', marginTop: '4px', opacity: 0.6, textAlign: 'right' }}>
                    {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <form onSubmit={handleReply} style={{ padding: '10px 12px', borderTop: '1px solid #244C66', display: 'flex', gap: '8px', alignItems: 'center', background: '#102433', flexShrink: 0 }}>
          <input
            type="text" placeholder="Reply..."
            value={replyText} onChange={e => setReplyText(e.target.value)}
            style={{ flex: 1, padding: '12px 16px', borderRadius: '40px', border: '1px solid #244C66', background: '#0A1928', color: '#EFF3F8', fontSize: '0.95rem', outline: 'none', minWidth: 0 }}
          />
          <button type="submit" disabled={!replyText.trim()}
            style={{ background: replyText.trim() ? '#F39C12' : '#244C66', border: 'none', borderRadius: '50%', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: replyText.trim() ? 'pointer' : 'default', flexShrink: 0, fontSize: '1.1rem' }}
          >➤</button>
        </form>
      </div>
    )}
    <div style={{ padding: '40px 0' }}>
      <div className="container">

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
          <div>
            <h2 style={{ color: '#FFD966', fontSize: '1.8rem' }}>👋 {seller.shop_name}</h2>
            <p style={{ color: '#9BB7D4' }}>Manage your shop</p>
          </div>
          <button onClick={handleLogout} className="btn-outline">Logout</button>
        </div>

        {/* Subscription notice for service shops */}
        {seller.shop_type === 'service' && (() => {
          const expires = seller.subscription_expires ? new Date(seller.subscription_expires) : null;
          const now = new Date();
          const daysLeft = expires ? Math.ceil((expires - now) / (1000 * 60 * 60 * 24)) : 0;
          const isExpired = !expires || daysLeft <= 0;
          const isWarning = !isExpired && daysLeft <= 7;
          if (isExpired) return (
            <div style={{ background: '#E74C3C20', border: '1px solid #E74C3C', borderRadius: '16px', padding: '16px 20px', marginBottom: '24px' }}>
              <div style={{ color: '#E74C3C', fontWeight: 700, marginBottom: '4px' }}>⚠️ Subscription Expired</div>
              <div style={{ color: '#9BB7D4', fontSize: '0.85rem', marginBottom: '12px' }}>Your free trial has ended. Pay K100 to renew your service shop for another month.</div>
              <button className="btn-primary" style={{ fontSize: '0.85rem', padding: '8px 20px', background: '#E74C3C' }}>Pay K100 Renewal →</button>
            </div>
          );
          if (isWarning) return (
            <div style={{ background: '#F39C1220', border: '1px solid #F39C12', borderRadius: '16px', padding: '16px 20px', marginBottom: '24px' }}>
              <div style={{ color: '#F39C12', fontWeight: 700, marginBottom: '4px' }}>⏰ {daysLeft} day{daysLeft !== 1 ? 's' : ''} left on your free trial</div>
              <div style={{ color: '#9BB7D4', fontSize: '0.85rem', marginBottom: '12px' }}>After your trial ends, a K100/month rental fee applies to keep your shop active.</div>
              <button className="btn-primary" style={{ fontSize: '0.85rem', padding: '8px 20px' }}>Pay K100 Now →</button>
            </div>
          );
          return (
            <div style={{ background: '#27AE6015', border: '1px solid #27AE6040', borderRadius: '16px', padding: '12px 20px', marginBottom: '24px' }}>
              <div style={{ color: '#27AE60', fontWeight: 700, fontSize: '0.85rem' }}>✅ Free trial active — {daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining</div>
            </div>
          );
        })()}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '28px' }}>
          <button onClick={() => setTab('listings')} className={tab === 'listings' ? 'btn-primary' : 'btn-outline'}>
            {seller.shop_type === 'service' ? '🍽️ My Menu' : '📦 My Listings'}
          </button>
          <button onClick={() => setTab('orders')} className={tab === 'orders' ? 'btn-primary' : 'btn-outline'}>
            🛒 Orders {orders.filter(o => o.status === 'pending').length > 0 && (
              <span style={{ background: '#FF5722', color: 'white', borderRadius: '50%', fontSize: '0.7rem', padding: '2px 7px', marginLeft: '6px' }}>
                {orders.filter(o => o.status === 'pending').length}
              </span>
            )}
          </button>
          <button onClick={() => setTab('chats')} className={tab === 'chats' ? 'btn-primary' : 'btn-outline'}>
            💬 Messages {unreadCount > 0 && (
              <span style={{ background: '#FF5722', color: 'white', borderRadius: '50%', fontSize: '0.7rem', padding: '2px 7px', marginLeft: '6px' }}>
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {msg && (
          <div style={{ background: '#F39C1220', border: '1px solid #F39C12', color: '#F39C12', padding: '12px 16px', borderRadius: '12px', marginBottom: '20px' }}>
            {msg}
          </div>
        )}

        {/* ── LISTINGS TAB ── */}
        {tab === 'listings' && (
          <>
            <div style={{ marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => setShowForm(!showForm)} className="btn-primary">
                {showForm ? 'Cancel' : seller.shop_type === 'service' ? '+ Add Menu Item' : '+ Add Product'}
              </button>
              {seller.shop_type === 'service' && !showForm && (
                <a href={`/restaurant/${seller.id}`} target="_blank" rel="noreferrer"
                  style={{ color: '#F39C12', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}>
                  👁️ Preview my menu →
                </a>
              )}
            </div>

            {showForm && (
              <div style={{ background: '#102433', borderRadius: '24px', padding: '28px', marginBottom: '32px', border: '1px solid #244C66' }}>
                <h3 style={{ color: '#FFD966', marginBottom: '20px' }}>{seller.shop_type === 'service' ? 'Add Menu Item' : 'New Listing'}</h3>
                <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  {[
                    { name: 'name', placeholder: seller.shop_type === 'service' ? 'Food item name e.g. Nshima & Chicken' : 'Product name', type: 'text' },
                    { name: 'price', placeholder: 'Price e.g. K450', type: 'text' },
                    { name: 'location', placeholder: 'Location e.g. Lusaka - Kamwala', type: 'text' },
                  ].map(f => (
                    <input
                      key={f.name} name={f.name} type={f.type} placeholder={f.placeholder}
                      value={form[f.name]} onChange={handleChange} required
                      style={{ padding: '12px 16px', borderRadius: '40px', border: '1px solid #244C66', background: '#0A1928', color: '#EFF3F8', fontSize: '0.9rem', outline: 'none' }}
                    />
                  ))}
                  <select
                    name="category" value={form.category} onChange={handleChange}
                    style={{ padding: '12px 16px', borderRadius: '40px', border: '1px solid #244C66', background: '#0A1928', color: '#EFF3F8', fontSize: '0.9rem' }}
                  >
                    {(seller.shop_type === 'service'
                      ? ['Restaurant & Food']
                      : categories.filter(c => c !== 'Restaurant & Food')
                    ).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>

                  {form.category === 'Restaurant & Food' && (
                    <select
                      name="food_category" value={form.food_category} onChange={handleChange}
                      style={{ padding: '12px 16px', borderRadius: '40px', border: '1px solid #244C66', background: '#0A1928', color: '#EFF3F8', fontSize: '0.9rem' }}
                    >
                      <option value="">Select menu section</option>
                      {foodCategories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  )}
                  <textarea
                    name="description" placeholder="Short product description"
                    value={form.description} onChange={handleChange}
                    style={{ padding: '12px 16px', borderRadius: '20px', border: '1px solid #244C66', background: '#0A1928', color: '#EFF3F8', fontSize: '0.9rem', resize: 'vertical', outline: 'none' }}
                  />

                  {/* Image Upload */}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      border: '2px dashed #244C66', borderRadius: '20px', padding: '24px', cursor: 'pointer',
                      background: imagePreview ? 'transparent' : '#0A1928', position: 'relative', overflow: 'hidden'
                    }}>
                      {imagePreview
                        ? <img src={imagePreview} alt="preview" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '12px' }} />
                        : (
                          <>
                            <span style={{ fontSize: '2.5rem' }}>📷</span>
                            <span style={{ color: '#9BB7D4', marginTop: '8px', fontSize: '0.9rem' }}>Tap to upload photo from your device</span>
                            <span style={{ color: '#4A6080', fontSize: '0.8rem', marginTop: '4px' }}>JPG, PNG supported</span>
                          </>
                        )
                      }
                      <input
                        type="file" accept="image/*" capture="environment"
                        onChange={handleImageChange}
                        style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                      />
                    </label>
                    {imagePreview && (
                      <button type="button" onClick={() => { setImageFile(null); setImagePreview(''); }}
                        style={{ marginTop: '8px', background: 'transparent', border: 'none', color: '#FF5722', cursor: 'pointer', fontSize: '0.85rem' }}
                      >
                        ✕ Remove photo
                      </button>
                    )}
                  </div>

                  {/* Extra Images */}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <p style={{ color: '#9BB7D4', fontSize: '0.85rem', marginBottom: '8px' }}>📸 Add more photos (optional — up to 4)</p>
                    <input
                      type="file" accept="image/*" multiple
                      onChange={e => {
                        const files = Array.from(e.target.files).slice(0, 4);
                        setExtraFiles(files);
                        setExtraPreviews(files.map(f => URL.createObjectURL(f)));
                      }}
                      style={{ color: '#9BB7D4', fontSize: '0.85rem' }}
                    />
                    {extraPreviews.length > 0 && (
                      <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                        {extraPreviews.map((src, i) => (
                          <img key={i} src={src} alt={`extra-${i}`} style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '10px', border: '1px solid #244C66' }} />
                        ))}
                      </div>
                    )}
                  </div>

                  <button type="submit" className="btn-primary" disabled={loading} style={{ gridColumn: '1 / -1' }}>
                    {loading ? 'Adding...' : 'Add Listing'}
                  </button>
                </form>
              </div>
            )}

            {products.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#9BB7D4' }}>
                <p style={{ fontSize: '1.2rem' }}>{seller.shop_type === 'service' ? 'No menu items yet.' : 'No listings yet.'}</p>
                <p style={{ marginTop: '8px' }}>{seller.shop_type === 'service' ? 'Click "Add Menu Item" to add your first dish.' : 'Click "Add Product" to list your first product.'}</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px' }}>
                {products.map(p => (
                  <div key={p.id} style={{ background: '#102433', borderRadius: '20px', padding: '16px', border: '1px solid #244C66' }}>
                    {p.image_url && (
                      <img src={p.image_url} alt={p.name} style={{ width: '100%', height: '130px', objectFit: 'cover', borderRadius: '12px', marginBottom: '12px' }} />
                    )}
                    <span style={{ background: '#F39C1220', color: '#F39C12', fontSize: '0.75rem', fontWeight: 600, padding: '4px 12px', borderRadius: '20px' }}>
                      {p.category}
                    </span>
                    <h4 style={{ color: '#EFF3F8', margin: '10px 0 4px' }}>{p.name}</h4>
                    <p style={{ color: '#F39C12', fontWeight: 700 }}>{p.price}</p>
                    <p style={{ color: '#9BB7D4', fontSize: '0.85rem' }}>📍 {p.location}</p>
                    <button
                      onClick={() => handleDelete(p.id)}
                      style={{ marginTop: '12px', background: 'transparent', border: '1px solid #FF5722', color: '#FF5722', padding: '6px 16px', borderRadius: '20px', cursor: 'pointer', fontSize: '0.85rem' }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── ORDERS TAB ── */}
        {tab === 'orders' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Stats Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px' }}>
              {[
                { label: 'Total Orders', value: orders.length, color: '#F39C12' },
                { label: 'Pending', value: orders.filter(o => o.status === 'pending').length, color: '#F39C12' },
                { label: 'Confirmed', value: orders.filter(o => o.status === 'confirmed').length, color: '#3498DB' },
                { label: 'Delivered', value: orders.filter(o => o.status === 'delivered').length, color: '#27AE60' },
                { label: 'Cancelled', value: orders.filter(o => o.status === 'cancelled').length, color: '#E74C3C' },
              ].map(s => (
                <div key={s.label} style={{ background: '#102433', borderRadius: '16px', padding: '16px', border: `1px solid ${s.color}40`, textAlign: 'center' }}>
                  <div style={{ color: s.color, fontSize: '1.8rem', fontWeight: 800 }}>{s.value}</div>
                  <div style={{ color: '#9BB7D4', fontSize: '0.75rem', marginTop: '4px' }}>{s.label}</div>
                </div>
              ))}
            </div>
            {orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#9BB7D4' }}>
                <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🛒</div>
                <p>No orders yet.</p>
                <p style={{ fontSize: '0.85rem', marginTop: '8px' }}>Orders placed by buyers will appear here.</p>
              </div>
            ) : orders.map(o => {
              const original = parseFloat(o.original_price.replace(/[^0-9.]/g, ''));
              const final = parseFloat(o.final_price.replace(/[^0-9.]/g, ''));
              const hasDiscount = !isNaN(original) && !isNaN(final) && final < original;
              const discountPct = hasDiscount ? Math.round(((original - final) / original) * 100) : 0;
              const statusColors = { pending: '#F39C12', confirmed: '#3498DB', delivered: '#27AE60', cancelled: '#E74C3C' };
              return (
                <div key={o.id} style={{ background: '#102433', borderRadius: '20px', padding: '20px', border: `1px solid ${statusColors[o.status] || '#244C66'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                    <div>
                      <div style={{ color: '#FFD966', fontWeight: 700, fontSize: '1rem' }}>{o.product_name}</div>
                      <div style={{ color: '#9BB7D4', fontSize: '0.82rem', marginTop: '2px' }}>👤 {o.buyer_name}</div>
                      {o.delivery_address && <div style={{ color: '#9BB7D4', fontSize: '0.82rem', marginTop: '2px' }}>📍 {o.delivery_address}</div>}
                    </div>
                    <span style={{ background: statusColors[o.status] + '30', color: statusColors[o.status], borderRadius: '20px', padding: '4px 12px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'capitalize' }}>
                      {o.status}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '14px' }}>
                    <div style={{ background: '#0A1928', borderRadius: '12px', padding: '8px 14px' }}>
                      <div style={{ color: '#4A6080', fontSize: '0.7rem' }}>Listed Price</div>
                      <div style={{ color: '#9BB7D4', fontWeight: 600 }}>{o.original_price || 'N/A'}</div>
                    </div>
                    <div style={{ color: '#4A6080', fontSize: '1.2rem' }}>→</div>
                    <div style={{ background: '#0A1928', borderRadius: '12px', padding: '8px 14px' }}>
                      <div style={{ color: '#4A6080', fontSize: '0.7rem' }}>Agreed Price</div>
                      <div style={{ color: '#27AE60', fontWeight: 700 }}>{o.final_price}</div>
                    </div>
                    {hasDiscount && (
                      <span style={{ background: '#E74C3C20', color: '#E74C3C', borderRadius: '20px', padding: '4px 10px', fontSize: '0.75rem', fontWeight: 700 }}>
                        🏷️ -{discountPct}% discount
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {o.status === 'pending' && (
                      <button onClick={() => updateOrderStatus(o.id, 'confirmed')} style={{ background: '#3498DB', color: 'white', border: 'none', borderRadius: '20px', padding: '6px 16px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>✓ Confirm</button>
                    )}
                    {o.status === 'confirmed' && (
                      <button onClick={() => updateOrderStatus(o.id, 'delivered')} style={{ background: '#27AE60', color: 'white', border: 'none', borderRadius: '20px', padding: '6px 16px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>🚚 Mark Delivered</button>
                    )}
                    {(o.status === 'pending' || o.status === 'confirmed') && (
                      <button onClick={() => updateOrderStatus(o.id, 'cancelled')} style={{ background: 'transparent', color: '#E74C3C', border: '1px solid #E74C3C', borderRadius: '20px', padding: '6px 16px', cursor: 'pointer', fontSize: '0.82rem' }}>Cancel</button>
                    )}
                    <div style={{ color: '#4A6080', fontSize: '0.75rem', alignSelf: 'center', marginLeft: 'auto' }}>
                      {new Date(o.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── CHATS TAB ── */}
        {tab === 'chats' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Conversation list */}
            {!activeChat && (
              <div style={{ background: '#102433', borderRadius: '20px', border: '1px solid #244C66', overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #244C66' }}>
                  <h4 style={{ color: '#FFD966' }}>Conversations</h4>
                </div>
                {chats.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#4A6080' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>💬</div>
                    <p>No messages yet.</p>
                    <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>Buyers will appear here when they message you.</p>
                  </div>
                ) : chats.map(c => (
                  <div
                    key={c.room_id}
                    onClick={() => {
      setActiveChat(c);
      fetchChatMessages(c.room_id, true);
      const updated = { ...readChats, [c.room_id]: c.buyer_msg_count || 0 };
      setReadChats(updated);
      localStorage.setItem('read_chats', JSON.stringify(updated));
    }}
                    style={{ padding: '16px 20px', borderBottom: '1px solid #1A3A50', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}
                  >
                    <div style={{ width: '40px', height: '40px', background: '#F39C1220', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>👤</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: '#EFF3F8', fontWeight: 600, fontSize: '0.95rem' }}>{c.buyer_name}</div>
                      <div style={{ color: '#9BB7D4', fontSize: '0.8rem', marginTop: '2px' }}>Re: {c.product_name}</div>
                      <div style={{ color: '#4A6080', fontSize: '0.75rem', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.last_message}</div>
                    </div>
                    {(() => {
                      const seen = readChats[c.room_id];
                      const unread = seen == null ? (c.buyer_msg_count || 0) : Math.max(0, (c.buyer_msg_count || 0) - seen);
                      return unread > 0 ? (
                        <span style={{ background: '#FF5722', color: 'white', borderRadius: '50%', fontSize: '0.7rem', padding: '2px 7px', flexShrink: 0, fontWeight: 700 }}>
                          {unread}
                        </span>
                      ) : null;
                    })()}
                    <div style={{ color: '#F39C12', fontSize: '1.2rem', flexShrink: 0 }}>›</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
    </>
  );
};

export default SellerDashboard;
