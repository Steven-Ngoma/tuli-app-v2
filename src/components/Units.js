import React from 'react';
import { Link } from 'react-router-dom';

const Units = () => (
  <section id="units">
    <div className="container">
      <h2 className="section-title">Two units on TULI</h2>
      <p className="section-sub">
        TULI has two dedicated units — one for restaurants, one for local market vendors.
      </p>
      <div className="unit-grid">

        <div className="unit-card">
          <div className="unit-icon">🍽️</div>
          <h3>Service Unit</h3>
          <div className="price-tag">Restaurants only</div>
          <p>Registered restaurants in Lusaka can list their menu and receive orders directly through TULI.</p>
          <ul className="feature-list">
            <li>✅ Restaurants & food businesses</li>
            <li>✅ Full menu listing</li>
            <li>✅ Customers order via TULI chat</li>
            <li>✅ 1 month free trial</li>
            <li>✅ K100/month after trial</li>
          </ul>
          <Link to="/services" className="btn-primary" style={{ marginTop: '12px' }}>
            Browse Restaurants →
          </Link>
        </div>

        <div className="unit-card">
          <div className="unit-icon">🛒</div>
          <h3>Local Market</h3>
          <div className="price-tag">Free to list</div>
          <p>Market vendors in Lusaka can sell tomatoes, vegetables, fruits and other fresh produce directly to buyers.</p>
          <ul className="feature-list">
            <li>✅ Tomatoes, onions, vegetables</li>
            <li>✅ Fruits & leafy greens</li>
            <li>✅ Buyers order via TULI chat</li>
            <li>✅ No monthly fee — ever</li>
            <li>✅ 0% commission per sale</li>
          </ul>
          <Link to="/marketplace" className="btn-primary" style={{ marginTop: '12px' }}>
            Browse Market →
          </Link>
        </div>

      </div>
    </div>
  </section>
);

export default Units;
