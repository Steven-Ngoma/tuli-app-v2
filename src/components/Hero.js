import React from 'react';

const Hero = () => (
  <section id="home">
    <div className="container">
      <div className="hero">
        <div className="hero-left">
          <h2>
            Order Fresh Produce.<br />
            <span style={{ color: '#F39C12' }}>Eat at Lusaka's best restaurants.</span>
          </h2>
          <p>
            TULI connects you to local market vendors selling fresh tomatoes, vegetables & fruits,
            and to registered restaurants in Lusaka — all in one place.
          </p>
          <div className="hero-buttons">
            <a href="/marketplace" className="btn-primary">Browse Market →</a>
            <a href="/services" className="btn-outline">View Restaurants</a>
          </div>
          <div className="hero-feature">
            <span>📱 Order via chat</span>
            <span>🍅 Fresh daily produce</span>
            <span>🍽️ Lusaka restaurants</span>
          </div>
        </div>
        <div className="hero-right">
          <div className="badge-icon">🍽️</div>
          <p style={{ fontWeight: 600, margin: '16px 0', color: '#1B4332' }}>
            Local Market &amp; Restaurants
          </p>
          <p style={{ color: '#2d6a4f', fontSize: '0.9rem' }}>
            Fresh produce &amp; food from Lusaka
          </p>
        </div>
      </div>
    </div>
  </section>
);

export default Hero;
