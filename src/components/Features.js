import React from 'react';

const features = [
  { icon: '👤', title: 'Sellers register', desc: 'Create your online shop and manage inventory. No physical shop needed.' },
  { icon: '👁️', title: 'Buyers need NO account', desc: 'Browse, search, and directly contact sellers — zero registration barrier.' },
  { icon: '💬', title: 'Direct Messaging', desc: 'Integrated WhatsApp / phone connection for instant communication.' },
  { icon: '💳', title: 'Mobile Money & Cards', desc: 'Pay rental fees via MTN MoMo, Airtel Money, or bank cards securely.' },
  { icon: '📱', title: 'Responsive & scalable', desc: 'Works on phones, tablets, laptops. Built for growth and modular updates.' },
  { icon: '📊', title: 'Seller Analytics', desc: 'Track sales performance and customer reach with simple dashboards.' },
];

const Features = () => (
  <section id="service-unit">
    <div className="container">
      <h2 className="section-title">Why TULI is different</h2>
      <div className="feature-grid">
        {features.map((f, i) => (
          <div className="info-card" key={i}>
            <div style={{ fontSize: '2.2rem', marginBottom: '16px' }}>{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default Features;
