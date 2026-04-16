import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import TuliLogo from './TuliLogo';

const Navbar = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isHome = pathname === '/';
  const seller = JSON.parse(localStorage.getItem('seller') || 'null');
  const buyerName = localStorage.getItem('buyer_name');
  const [buyerUnread, setBuyerUnread] = useState(0);
  const [sellerUnread, setSellerUnread] = useState(0);

  useEffect(() => {
    if (buyerName && !seller) {
      const calc = () => {
        fetch(`https://tuli-backend-44vd.onrender.com/chat/buyer/${encodeURIComponent(buyerName)}`)
          .then(r => r.json())
          .then(chats => {
            const read = JSON.parse(localStorage.getItem('buyer_read_chats') || '{}');
            const count = chats.reduce((t, c) => {
              const seen = read[c.room_id];
              return t + (seen == null ? (c.seller_msg_count || 0) : Math.max(0, (c.seller_msg_count || 0) - seen));
            }, 0);
            setBuyerUnread(count);
          }).catch(() => {});
      };
      calc();
      const interval = setInterval(calc, 5000);
      return () => clearInterval(interval);
    }
    if (seller) {
      const calc = () => {
        fetch(`https://tuli-backend-44vd.onrender.com/chat/seller/${seller.id}`)
          .then(r => r.json())
          .then(chats => {
            const read = JSON.parse(localStorage.getItem('read_chats') || '{}');
            const count = chats.reduce((t, c) => {
              const seen = read[c.room_id];
              return t + (seen == null ? (c.buyer_msg_count || 0) : Math.max(0, (c.buyer_msg_count || 0) - seen));
            }, 0);
            setSellerUnread(count);
          }).catch(() => {});
      };
      calc();
      const interval = setInterval(calc, 5000);
      return () => clearInterval(interval);
    }
  }, [buyerName, seller?.id]);

  return (
    <div className="container">
      <div className="navbar">
        {/* Logo — far left */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <TuliLogo size={44} />
          <div>
            <h1 style={{
              fontSize: '2rem', fontWeight: 800,
              background: 'linear-gradient(135deg, #F39C12, #FFB347)',
              WebkitBackgroundClip: 'text', backgroundClip: 'text',
              color: 'transparent', letterSpacing: '-0.5px'
            }}>TULI</h1>
            <span style={{ fontSize: '0.8rem', color: '#9BB7D4', fontWeight: 500 }}>
              Tulipamodzi · Buy &amp; Sell in Zambia
            </span>
          </div>
        </Link>

        {/* Nav links — far right */}
        <div className="nav-links">
          <Link to="/" style={{ color: isHome ? '#F39C12' : '#CDE5F7' }}>Home</Link>
          <Link to="/marketplace" style={{ color: pathname === '/marketplace' ? '#F39C12' : '#CDE5F7' }}>
            🛒 Products
          </Link>
          {isHome && <a href="#how-it-works">How it works</a>}
          {seller
            ? <Link to="/seller/dashboard" className="btn-outline btn-outline-pulse" style={{ padding: '8px 24px', position: 'relative' }}>
                My Shop
                {sellerUnread > 0 && <span style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#FF5722', color: 'white', borderRadius: '50%', fontSize: '0.65rem', padding: '2px 6px', fontWeight: 700 }}>{sellerUnread}</span>}
              </Link>
            : <>
                {buyerName && <Link to="/buyer/chats" style={{ color: pathname === '/buyer/chats' ? '#F39C12' : '#CDE5F7', position: 'relative' }}>
                  My Chats
                  {buyerUnread > 0 && <span style={{ position: 'absolute', top: '-8px', right: '-12px', background: '#FF5722', color: 'white', borderRadius: '50%', fontSize: '0.65rem', padding: '2px 6px', fontWeight: 700 }}>{buyerUnread}</span>}
                </Link>}
                <Link to="/seller/register" className="btn-outline btn-outline-pulse" style={{ padding: '8px 24px' }}>Start Selling</Link>
              </>
          }
        </div>
      </div>
    </div>
  );
};

export default Navbar;
