import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';

const Chat = () => {
  const { sellerId, productId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const productName = new URLSearchParams(location.search).get('product') || 'Product';
  const shopName = new URLSearchParams(location.search).get('shop') || 'Seller';

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [buyerName, setBuyerName] = useState(localStorage.getItem('buyer_name') || '');
  const [nameSet, setNameSet] = useState(!!localStorage.getItem('buyer_name'));
  const [sending, setSending] = useState(false);
  const [sellerOnline, setSellerOnline] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const originalPrice = new URLSearchParams(location.search).get('price') || '';
  const [orderForm, setOrderForm] = useState({ final_price: originalPrice, delivery_address: '' });
  const msgBoxRef = useRef(null);
  const shouldScrollRef = useRef(false);
  const buyerSlug = buyerName.trim().toLowerCase().replace(/\s+/g, '_');
  const roomId = nameSet ? `${sellerId}_${productId}_${buyerSlug}` : null;

  const fetchMessages = (forceScroll = false) => {
    fetch(`https://tuli-backend-44vd.onrender.com/chat/${roomId}`)
      .then(res => res.json())
      .then(data => {
        if (forceScroll) {
          shouldScrollRef.current = true;
        } else if (msgBoxRef.current) {
          const box = msgBoxRef.current;
          shouldScrollRef.current = box.scrollHeight - box.scrollTop - box.clientHeight < 60;
        }
        setMessages(data);
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (shouldScrollRef.current && msgBoxRef.current) {
      msgBoxRef.current.scrollTop = msgBoxRef.current.scrollHeight;
      shouldScrollRef.current = false;
    }
  }, [messages]);

  useEffect(() => {
    if (!roomId) return;
    fetchMessages(true);
    const checkOnline = () => fetch(`https://tuli-backend-44vd.onrender.com/sellers/${sellerId}/status`).then(r => r.json()).then(d => setSellerOnline(d.online)).catch(() => {});
    checkOnline();
    const interval = setInterval(() => fetchMessages(), 3000);
    const onlineInterval = setInterval(checkOnline, 15000);
    return () => { clearInterval(interval); clearInterval(onlineInterval); };
  }, [roomId]);

  const handlePlaceOrder = async e => {
    e.preventDefault();
    if (!orderForm.final_price.trim()) return;
    await fetch('https://tuli-backend-44vd.onrender.com/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: parseInt(productId),
        seller_id: parseInt(sellerId),
        buyer_name: buyerName,
        original_price: originalPrice,
        final_price: orderForm.final_price.trim(),
        delivery_address: orderForm.delivery_address.trim()
      })
    });
    await fetch('https://tuli-backend-44vd.onrender.com/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room_id: roomId, sender: buyerName, message: `🛒 Order placed! Agreed price: ${orderForm.final_price}. Delivery to: ${orderForm.delivery_address || 'To be arranged'}`, is_seller: false })
    });
    setOrderPlaced(true);
    setShowOrderForm(false);
    fetchMessages(true);
  };
  const handleSetName = e => {
    e.preventDefault();
    if (!buyerName.trim()) return;
    localStorage.setItem('buyer_name', buyerName.trim());
    setNameSet(true);
  };

  const containsPhone = text => /(?:\+?26)?0[79]\d{8}|\b\d{10,}\b/.test(text.replace(/[\s\-]/g, ''));
  const containsSocial = text => /(facebook|fb\.com|instagram|insta|whatsapp|wa\.me|tiktok|twitter|telegram|snapchat|linkedin|youtube|messenger|signal|viber|wechat|imo)/i.test(text);
  const isBlocked = text => containsPhone(text) || containsSocial(text);
  const blockedMsg = '⚠️ This message was blocked. Sharing contact details or social media is not allowed on TULI. Please keep all communication on the platform.';

  const handleSend = async e => {
    e.preventDefault();
    if (!text.trim()) return;
    if (isBlocked(text)) {
      alert(blockedMsg);
      return;
    }
    setSending(true);
    try {
      await fetch('https://tuli-backend-44vd.onrender.com/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room_id: roomId, sender: buyerName, message: text.trim(), is_seller: false })
      });
      setText('');
      fetchMessages(true);
    } finally {
      setSending(false);
    }
  };

  if (!nameSet) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 100 }}>
        <div style={{ background: '#102433', borderRadius: '24px', padding: '32px', width: '100%', maxWidth: '380px', border: '1px solid #244C66', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>💬</div>
          <h3 style={{ color: '#FFD966', marginBottom: '8px' }}>What's your name?</h3>
          <p style={{ color: '#2D6A4F', marginBottom: '24px', fontSize: '0.9rem' }}>So the seller knows who they're talking to</p>
          <form onSubmit={handleSetName} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              type="text" placeholder="Enter your name"
              value={buyerName} onChange={e => setBuyerName(e.target.value)} required autoFocus
              style={{ padding: '14px 16px', borderRadius: '40px', border: '1px solid #244C66', background: '#ffffff', color: '#1B4332', fontSize: '1rem', outline: 'none', textAlign: 'center' }}
            />
            <button type="submit" className="btn-primary" style={{ padding: '14px' }}>Start Chat →</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#ffffff', display: 'flex', flexDirection: 'column', zIndex: 100 }}>

      {/* Header */}
      <div style={{ background: '#102433', padding: '12px 16px', borderBottom: '1px solid #244C66', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: 'none', color: '#F39C12', fontSize: '1.6rem', cursor: 'pointer', lineHeight: 1, padding: '0 8px 0 0' }}>←</button>
        <div style={{ width: '38px', height: '38px', background: '#F39C1230', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>🏪</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: '#FFD966', fontWeight: 700, fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shopName}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span className={sellerOnline ? 'dot-online' : 'dot-offline'} style={{ width: '7px', height: '7px', borderRadius: '50%', background: sellerOnline ? '#27AE60' : '#E74C3C', display: 'inline-block' }} />
            <span style={{ color: sellerOnline ? '#27AE60' : '#E74C3C', fontSize: '0.72rem' }}>{sellerOnline ? 'Online' : 'Offline'}</span>
          </div>
        </div>
      </div>

      {/* Messages box — ONLY this scrolls, nothing else */}
      <div
        ref={msgBoxRef}
        style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}
      >
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: '#52796F', marginTop: '80px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>👋</div>
            <p>No messages yet. Say hi!</p>
          </div>
        )}
        {messages.map(msg => {
          const isMine = msg.sender === buyerName && !msg.is_seller;
          return (
            <div key={msg.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '80%', padding: '10px 14px', wordBreak: 'break-word',
                borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                background: isMine ? '#F39C12' : '#102433',
                color: isMine ? '#ffffff' : '#1B4332',
                border: isMine ? 'none' : '1px solid #244C66'
              }}>
                {!isMine && <div style={{ fontSize: '0.7rem', fontWeight: 700, marginBottom: '4px', color: '#F39C12' }}>{msg.sender}</div>}
                <div style={{ fontSize: '0.95rem', lineHeight: 1.4 }}>{msg.message}</div>
                <div style={{ fontSize: '0.65rem', marginTop: '4px', opacity: 0.6, textAlign: 'right' }}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Place Order Button */}
      {!orderPlaced && (
        <div style={{ padding: '8px 12px', background: '#ffffff', borderTop: '1px solid #1A3A50', flexShrink: 0 }}>
          {!showOrderForm ? (
            <button onClick={() => setShowOrderForm(true)} style={{ width: '100%', background: '#27AE60', color: 'white', border: 'none', borderRadius: '40px', padding: '10px', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}>
              🛒 Place Order
            </button>
          ) : (
            <form onSubmit={handlePlaceOrder} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <p style={{ color: '#FFD966', fontSize: '0.85rem', fontWeight: 600, margin: 0 }}>📦 {productName}</p>
              {originalPrice && <p style={{ color: '#2D6A4F', fontSize: '0.78rem', margin: 0 }}>Listed price: <span style={{ color: '#F39C12', fontWeight: 700 }}>{originalPrice}</span> — change below if negotiated</p>}
              <input
                placeholder="Agreed price e.g. K450"
                value={orderForm.final_price}
                onChange={e => setOrderForm({ ...orderForm, final_price: e.target.value })}
                required
                style={{ padding: '10px 14px', borderRadius: '40px', border: '1px solid #244C66', background: '#102433', color: '#1B4332', fontSize: '0.9rem', outline: 'none' }}
              />
              <input
                placeholder="Your delivery address"
                value={orderForm.delivery_address}
                onChange={e => setOrderForm({ ...orderForm, delivery_address: e.target.value })}
                style={{ padding: '10px 14px', borderRadius: '40px', border: '1px solid #244C66', background: '#102433', color: '#1B4332', fontSize: '0.9rem', outline: 'none' }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" onClick={() => setShowOrderForm(false)} style={{ flex: 1, background: 'transparent', border: '1px solid #244C66', color: '#2D6A4F', borderRadius: '40px', padding: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>Cancel</button>
                <button type="submit" style={{ flex: 2, background: '#27AE60', color: 'white', border: 'none', borderRadius: '40px', padding: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>✓ Confirm Order</button>
              </div>
            </form>
          )}
        </div>
      )}
      {orderPlaced && (
        <div style={{ padding: '10px 16px', background: '#27AE6020', borderTop: '1px solid #27AE60', flexShrink: 0, textAlign: 'center' }}>
          <span style={{ color: '#27AE60', fontWeight: 700, fontSize: '0.9rem' }}>✅ Order placed successfully!</span>
        </div>
      )}

      {/* Input — pinned to bottom */}
      <form onSubmit={handleSend} style={{ background: '#102433', padding: '10px 12px', borderTop: '1px solid #244C66', display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
        <input
          type="text" placeholder="Type a message..."
          value={text} onChange={e => setText(e.target.value)}
          style={{ flex: 1, padding: '12px 16px', borderRadius: '40px', border: '1px solid #244C66', background: '#ffffff', color: '#1B4332', fontSize: '1rem', outline: 'none', minWidth: 0 }}
        />
        <button type="submit" disabled={sending || !text.trim()} style={{
          background: text.trim() ? '#F39C12' : '#244C66', border: 'none', borderRadius: '50%',
          width: '46px', height: '46px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: text.trim() ? 'pointer' : 'default', flexShrink: 0, fontSize: '1.2rem'
        }}>➤</button>
      </form>

    </div>
  );
};

export default Chat;
