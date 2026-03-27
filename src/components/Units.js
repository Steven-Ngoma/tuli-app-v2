import React from 'react';
import { Link } from 'react-router-dom';

const Units = () => (
  <section id="units">
    <div className="container">
      <h2 className="section-title">What you can sell on TULI</h2>
      <p className="section-sub">
        Two units on TULI. Free to list — you only pay a small commission when you sell.
      </p>
      <div className="unit-grid">

        <div className="unit-card">
          <div className="unit-icon">📦</div>
          <h3>Products Unit</h3>
          <div className="price-tag">Free to list</div>
          <p>List any physical product and reach buyers across Zambia. Only pay when you sell.</p>
          <ul className="feature-list">
            <li>✅ Clothes, shoes, electronics, books</li>
            <li>✅ Home goods &amp; school supplies</li>
            <li>✅ Buyers contact you via TULI chat</li>
            <li>✅ No monthly fee — ever</li>
            <li>✅ 5% commission on each sale</li>
          </ul>
          <Link to="/marketplace" className="btn-primary" style={{ marginTop: '12px' }}>
            Browse products →
          </Link>
        </div>

        <div className="unit-card">
          <div className="unit-icon">🤝</div>
          <h3>Services Unit</h3>
          <div className="price-tag">Free to list</div>
          <p>Offer your services to customers across Zambia. From food to repairs — list it on TULI.</p>
          <ul className="feature-list">
            <li>✅ Restaurants &amp; food services</li>
            <li>✅ Repairs &amp; maintenance</li>
            <li>✅ Customers contact you via TULI chat</li>
            <li>✅ No monthly fee — ever</li>
            <li>✅ 5% commission per booking</li>
          </ul>
          <Link to="/marketplace?tab=services" className="btn-primary" style={{ marginTop: '12px' }}>
            Browse services →
          </Link>
        </div>

      </div>
    </div>
  </section>
);

export default Units;
