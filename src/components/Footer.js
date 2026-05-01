import React from 'react';

const Footer = () => (
  <footer>
    <div className="container">
      <div className="footer-grid">
        <div>
          <h3 style={{ color: '#FFD966' }}>TULI – Tulipamodzi</h3>
          <p style={{ marginTop: '8px', color: '#d4edda' }}>
            Connecting Lusaka's local market vendors and restaurants with buyers.
          </p>
          <p style={{ marginTop: '8px', color: '#a8d5b5' }}>© 2025 TULI. All rights reserved.</p>
        </div>
        <div>
          <h4 style={{ color: '#FFD966' }}>Explore</h4>
          <p><a href="#units" style={{ color: '#d4edda', textDecoration: 'none' }}>🛒 Local Market</a></p>
          <p><a href="/services" style={{ color: '#d4edda', textDecoration: 'none' }}>Restaurants</a></p>
          <p><a href="#how-it-works" style={{ color: '#d4edda', textDecoration: 'none' }}>How it works</a></p>
        </div>
        <div>
          <h4 style={{ color: '#FFD966' }}>Contact</h4>
          <p>💬 <a href="https://wa.me/260776987839" style={{ color: '#d4edda', textDecoration: 'none' }}>0776 987 839</a></p>
          <p>📧 <a href="mailto:stevenngoma697@gmail.com" style={{ color: '#d4edda', textDecoration: 'none' }}>stevenngoma697@gmail.com</a></p>
          <p style={{ color: '#d4edda' }}>📍 Lusaka, Zambia</p>
        </div>
      </div>
      <div className="copyright">
        TULI is currently in early access — we're building this with our first sellers.
      </div>
    </div>
  </footer>
);

export default Footer;
