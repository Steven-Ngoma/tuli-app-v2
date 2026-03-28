import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const BuyerChats = () => {
  const navigate = useNavigate();
  const buyerName = localStorage.getItem('buyer_name');
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [orderForm, setOrderForm] = useState({ final_price: '', delivery_address: '' });
  const [orderPlaced, setOrderPlaced] = useState({});
  const [tab, setTab] = useState('chats');
  const [readChats, setReadChats] = useState(() => JSON.parse(localStorage.getItem('buyer_read_chats') || '{}'));
  const msgBoxRef = useRef(null);
  const shouldScrollRef = useRef(false);
  const unreadCount = chats.reduce((total, c) => {
    const seen = readChats[c.room_id];
    const unread = seen == null ? (c.seller_msg_count || 0) : Math.max(0, (c.seller_msg_count || 0) - seen);
    return total + unread;
  }, 0);

  useEffect(() => {
    if (!buyerName) { navigate('/marketplace'); return; }
    fetchChats();
    const interval = setInterval(fetchChats, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!activeChat) return;
    fetchMessages(activeChat.room_id, true);
    const interval = setInterval(() => fetchMessages(activeChat.room_id), 3000);
    return () => clearInterval(interval);
  }, [activeChat]);

  useEffect(() => {
    if (shouldScrollRef.current && msgBoxRef.current) {
      msgBoxRef.current.scrollTop = msgBoxRef.current.scrollHeight;
      shouldScrollRef.current = false;
    }
  }, [messages]);

  const fetchChats = async () => {
    try {
      const res = await fetch(`https://tuli-backend-44vd.onrender.com/chat/buyer/${encodeURIComponent(buyerName)}`);
      setChats(await res.json());
    } catch { setChats([]); }
  };

  const handlePlaceOrder = async e => {
    e.preventDefault();
    if (!orderForm.final_price.trim() || !activeChat) return;
    await fetch('https://tuli-backend-44vd.onrender.com/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: activeChat.product_id,
        seller_id: activeChat.seller_id,
        buyer_name: buyerName,
        original_price: activeChat.original_price || '',
        final_price: orderForm.final_price.trim(),
        delivery_address: orderForm.delivery_address.trim()
      })
    });
    const roomId = activeChat.room_id;
    await fetch('https://tuli-backend-44vd.onrender.com/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room_id: roomId, sender: buyerName, message: `🛒 Order placed! Agreed price: ${orderForm.final_price}. Delivery to: ${orderForm.delivery_address || 'To be arranged'}`, is_seller: false })
    });
    setOrderPlaced(prev => ({ ...prev, [roomId]: true }));
    setShowOrderForm(false);
    fetchMessages(roomId, true);
  };

  const fetchMessages = async (roomId, forceScroll = false) => {
    try {
      const res = await fetch(`https://tuli-backend-44vd.onrender.com/chat/${roomId}`);
      const data = await res.json();
      if (forceScroll) {
        shouldScrollRef.current = true;
      } else if (msgBoxRef.current) {
        const box = msgBoxRef.current;
        shouldScrollRef.current = box.scrollHeight - box.scrollTop - box.clientHeight < 60;
      }
      setMessages(data);
    } catch { setMessages([]); }
  };

  const containsPhone = t => /(?:\+?26)?0[79]\d{8}|\b\d{10,}\b/.test(t.replace(/[\s\-]/g, ''));
  const containsSocial = t => /(facebook|fb\.com|instagram|insta|whatsapp|wa\.me|tiktok|twitter|telegram|snapchat|linkedin|youtube|messenger|signal|viber|wechat|imo)/i.test(t);
  const isBlocked = t => containsPhone(t) || containsSocial(t);
  const blockedMsg = '⚠️ This message was blocked. Sharing contact details or social media is not allowed on TULI. Please keep all communication on the platform.';

  const handleSend = async e => {
    e.preventDefault();
    if (!text.trim() || !activeChat) return;
    if (isBlocked(text)) {
      alert(blockedMsg);
      return;
    }
    await fetch('https://tuli-backend-44vd.onrender.com/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room_id: activeChat.room_id, sender: buyerName, message: text.trim(), is_seller: false })
    });
    setText('');
    fetchMessages(activeChat.room_id, true);
  };

  return (
    <>
      {activeChat && (
        <div style={{ position: 'fixed', inset: 0, background: '#0A1928', zIndex: 200, display: 'flex', flexDirection: 'column', height: '100vh' }}>
          <div style={{ background: '#102433', padding: '14px 20px', borderBottom: '1px solid #244C66', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <button onClick={() => setActiveChat(null)} style={{ background: 'transparent', border: 'none', color: '#F39C12', fontSize: '1.4rem', cursor: 'pointer', padding: 0 }}>←</button>
            <div style={{ width: '38px', height: '38px', background: '#F39C1230', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>🏪</div>
            <div>
              <div style={{ color: '#FFD966', fontWeight: 700 }}>{activeChat.shop_name}</div>
              <div style={{ color: '#9BB7D4', fontSize: '0.8rem' }}>Re: {activeChat.product_name}</div>
            </div>
          </div>
          <div ref={msgBoxRef} style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', background: '#0D1F2E', minHeight: 0 }}>
            {messages.map(m => {
              const isMine = !m.is_seller;
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

          {/* Place Order */}
          {!orderPlaced[activeChat?.room_id] ? (
            <div style={{ padding: '8px 12px', background: '#0A1928', borderTop: '1px solid #1A3A50', flexShrink: 0 }}>
              {!showOrderForm ? (
                <button onClick={() => { setShowOrderForm(true); setOrderForm({ final_price: '', delivery_address: '' }); }}
                  style={{ width: '100%', background: '#27AE60', color: 'white', border: 'none', borderRadius: '40px', padding: '10px', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}>
                  🛒 Place Order
                </button>
              ) : (
                <form onSubmit={handlePlaceOrder} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <p style={{ color: '#FFD966', fontSize: '0.85rem', fontWeight: 600, margin: 0 }}>📦 {activeChat?.product_name}</p>
                  <input placeholder="Agreed price e.g. K450" value={orderForm.final_price}
                    onChange={e => setOrderForm({ ...orderForm, final_price: e.target.value })} required
                    style={{ padding: '10px 14px', borderRadius: '40px', border: '1px solid #244C66', background: '#102433', color: '#EFF3F8', fontSize: '0.9rem', outline: 'none' }}
                  />
                  <input placeholder="Your delivery address" value={orderForm.delivery_address}
                    onChange={e => setOrderForm({ ...orderForm, delivery_address: e.target.value })}
                    style={{ padding: '10px 14px', borderRadius: '40px', border: '1px solid #244C66', background: '#102433', color: '#EFF3F8', fontSize: '0.9rem', outline: 'none' }}
                  />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button type="button" onClick={() => setShowOrderForm(false)}
                      style={{ flex: 1, background: 'transparent', border: '1px solid #244C66', color: '#9BB7D4', borderRadius: '40px', padding: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>Cancel</button>
                    <button type="submit"
                      style={{ flex: 2, background: '#27AE60', color: 'white', border: 'none', borderRadius: '40px', padding: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>✓ Confirm Order</button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <div style={{ padding: '10px 16px', background: '#27AE6020', borderTop: '1px solid #27AE60', flexShrink: 0, textAlign: 'center' }}>
              <span style={{ color: '#27AE60', fontWeight: 700, fontSize: '0.9rem' }}>✅ Order placed!</span>
            </div>
          )}
          <form onSubmit={handleSend} style={{ padding: '10px 12px', borderTop: '1px solid #244C66', display: 'flex', gap: '8px', alignItems: 'center', background: '#102433', flexShrink: 0 }}>
            <input
              type="text" placeholder="Type a message..."
              value={text} onChange={e => setText(e.target.value)}
              style={{ flex: 1, padding: '12px 16px', borderRadius: '40px', border: '1px solid #244C66', background: '#0A1928', color: '#EFF3F8', fontSize: '0.95rem', outline: 'none', minWidth: 0 }}
            />
            <button type="submit" disabled={!text.trim()}
              style={{ background: text.trim() ? '#F39C12' : '#244C66', border: 'none', borderRadius: '50%', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: text.trim() ? 'pointer' : 'default', flexShrink: 0, fontSize: '1.1rem' }}
            >➤</button>
          </form>
        </div>
      )}

      <div style={{ padding: '40px 0' }}>
        <div className="container">
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ color: '#FFD966', fontSize: '1.6rem' }}>💬 My Conversations {unreadCount > 0 && (
              <span style={{ background: '#FF5722', color: 'white', borderRadius: '50%', fontSize: '0.75rem', padding: '2px 8px', marginLeft: '8px' }}>{unreadCount}</span>
            )}</h2>
            <p style={{ color: '#9BB7D4', marginTop: '4px' }}>All your chats with sellers</p>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
            <button onClick={() => setTab('chats')} className={tab === 'chats' ? 'btn-primary' : 'btn-outline'} style={{ fontSize: '0.9rem', padding: '8px 20px' }}>
              💬 Chats {unreadCount > 0 && <span style={{ background: '#FF5722', color: 'white', borderRadius: '50%', fontSize: '0.65rem', padding: '1px 6px', marginLeft: '4px' }}>{unreadCount}</span>}
            </button>
            <button onClick={() => setTab('orders')} className={tab === 'orders' ? 'btn-primary' : 'btn-outline'} style={{ fontSize: '0.9rem', padding: '8px 20px' }}>
              🛒 My Orders
            </button>
          </div>

          {tab === 'orders' && <BuyerOrders buyerName={buyerName} />}

          {tab === 'chats' && (
          <div style={{ background: '#102433', borderRadius: '20px', border: '1px solid #244C66', overflow: 'hidden' }}>
            {chats.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#4A6080' }}>
                <div style={{ fontSize: '3rem', marginBottom: '12px' }}>💬</div>
                <p>No conversations yet.</p>
                <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>Browse products and chat with sellers.</p>
                <button onClick={() => navigate('/marketplace')} className="btn-primary" style={{ marginTop: '20px' }}>Browse Products</button>
              </div>
            ) : chats.map(c => (
              <div
                key={c.room_id}
                onClick={() => {
              setActiveChat(c);
              fetchMessages(c.room_id, true);
              const updated = { ...readChats, [c.room_id]: c.seller_msg_count || 0 };
              setReadChats(updated);
              localStorage.setItem('buyer_read_chats', JSON.stringify(updated));
            }}
                style={{ padding: '16px 20px', borderBottom: '1px solid #1A3A50', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}
              >
                <div style={{ width: '40px', height: '40px', background: '#F39C1220', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>🏪</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: '#EFF3F8', fontWeight: 600, fontSize: '0.95rem' }}>{c.shop_name}</div>
                  <div style={{ color: '#9BB7D4', fontSize: '0.8rem', marginTop: '2px' }}>Re: {c.product_name}</div>
                  <div style={{ color: '#4A6080', fontSize: '0.75rem', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.last_message}</div>
                </div>
                {(() => {
                  const seen = readChats[c.room_id];
                  const unread = seen == null ? (c.seller_msg_count || 0) : Math.max(0, (c.seller_msg_count || 0) - seen);
                  return unread > 0 ? (
                    <span style={{ background: '#FF5722', color: 'white', borderRadius: '50%', fontSize: '0.7rem', padding: '2px 7px', flexShrink: 0, fontWeight: 700 }}>{unread}</span>
                  ) : null;
                })()}
                <div style={{ color: '#F39C12', fontSize: '1.2rem', flexShrink: 0 }}>›</div>
              </div>
            ))}
          </div>
          )}

        </div>
      </div>
    </>
  );
};

const BuyerOrders = ({ buyerName }) => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const load = () => fetch(`https://tuli-backend-44vd.onrender.com/orders/buyer/${encodeURIComponent(buyerName)}`)
      .then(r => r.json()).then(setOrders).catch(() => {});
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [buyerName]);

  const statusColors = { pending: '#F39C12', confirmed: '#3498DB', delivered: '#27AE60', cancelled: '#E74C3C' };

  if (orders.length === 0) return (
    <div style={{ textAlign: 'center', padding: '60px 0', color: '#4A6080' }}>
      <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🛒</div>
      <p>No orders yet.</p>
      <p style={{ fontSize: '0.85rem', marginTop: '8px' }}>Place an order from a chat to see it here.</p>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {orders.map(o => (
        <div key={o.id} style={{ background: '#102433', borderRadius: '20px', padding: '20px', border: `1px solid ${statusColors[o.status] || '#244C66'}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
            <div>
              <div style={{ color: '#FFD966', fontWeight: 700 }}>{o.product_name}</div>
              <div style={{ color: '#9BB7D4', fontSize: '0.82rem', marginTop: '2px' }}>🏪 {o.shop_name}</div>
              {o.delivery_address && <div style={{ color: '#9BB7D4', fontSize: '0.82rem', marginTop: '2px' }}>📍 {o.delivery_address}</div>}
            </div>
            <span style={{ background: statusColors[o.status] + '30', color: statusColors[o.status], borderRadius: '20px', padding: '4px 12px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'capitalize' }}>
              {o.status}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ background: '#0A1928', borderRadius: '12px', padding: '8px 14px' }}>
              <div style={{ color: '#4A6080', fontSize: '0.7rem' }}>Agreed Price</div>
              <div style={{ color: '#27AE60', fontWeight: 700 }}>{o.final_price}</div>
            </div>
            <div style={{ color: '#4A6080', fontSize: '0.75rem', marginLeft: 'auto' }}>{new Date(o.created_at).toLocaleDateString()}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default BuyerChats;
