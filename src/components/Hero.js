import React from 'react';

const Hero = () => (
  <section id="home">
    <div className="container">
      <div className="hero">
        <div className="hero-left">
          <h2>
            Buy & Sell in Zambia.<br />
            <span style={{ color: '#F39C12' }}>No shop needed.</span>
          </h2>
          <p>
            TULI connects buyers and sellers in one place. Post your products or services,
            reach customers, and grow — without needing a physical store.
          </p>
          <div className="hero-buttons">
            <a href="/seller/register" className="btn-primary">Start Selling →</a>
            <a href="#units" className="btn-outline">See how it works</a>
          </div>
          <div className="hero-feature">
            <span>📱 Mobile money payments</span>
            <span>💬 In-app chat</span>
            <span>🏪 No physical shop required</span>
          </div>
        </div>
        <div className="hero-right">
          <div className="badge-icon">🛍️📦</div>
          <p style={{ fontWeight: 600, margin: '16px 0', color: '#EFF3F8' }}>
            Products &amp; Services
          </p>
          <p style={{ color: '#9BB7D4', fontSize: '0.9rem' }}>
            A marketplace built for Zambian entrepreneurs
          </p>
        </div>
      </div>
    </div>
  </section>
);

export default Hero;
