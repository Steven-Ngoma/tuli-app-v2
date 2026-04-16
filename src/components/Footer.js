import React from 'react';

const Footer = () => (
  <footer>
    <div className="container">
      <div className="footer-grid">
        <div>
          <h3 style={{ color: '#F39C12' }}>TULI – Tulipamodzi</h3>
          <p style={{ marginTop: '8px' }}>
            A marketplace connecting buyers and sellers across Zambia.
          </p>
          <p style={{ marginTop: '8px' }}>© 2025 TULI. All rights reserved.</p>
        </div>
        <div>
          <h4 style={{ color: '#FFD966' }}>Explore</h4>
          <p><a href="#units" style={{ color: '#A6C1E0', textDecoration: 'none' }}>Products</a></p>
          <p><a href="#how-it-works" style={{ color: '#A6C1E0', textDecoration: 'none' }}>How it works</a></p>
          <p><a href="#contact" style={{ color: '#A6C1E0', textDecoration: 'none' }}>Start Selling</a></p>
        </div>
        <div>
          <h4 style={{ color: '#FFD966' }}>Contact</h4>
          <p>💬 <a href="https://wa.me/260776987839" style={{ color: '#A6C1E0', textDecoration: 'none' }}>0776 987 839</a></p>
          <p>📧 <a href="mailto:stevenngoma697@gmail.com" style={{ color: '#A6C1E0', textDecoration: 'none' }}>stevenngoma697@gmail.com</a></p>
          <p>📍 Lusaka, Zambia</p>
        </div>
      </div>
      <div className="copyright">
        TULI is currently in early access — we're building this with our first sellers.
      </div>
    </div>
  </footer>
);

export default Footer;
