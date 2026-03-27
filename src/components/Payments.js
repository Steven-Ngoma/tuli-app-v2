import React from 'react';

const paymentItems = [
  {
    icon: '💸',
    title: 'Rental fee payments',
    desc: 'Mobile money (MTN, Airtel, Zamtel) & credit cards – fully secured.',
  },
  {
    icon: '🚚',
    title: 'Third-party logistics',
    desc: 'TULI partners with courier services to help product sellers deliver nationwide.',
  },
  {
    icon: '🤝',
    title: 'Commission model',
    desc: 'Product sellers pay 5% only after successful sale – risk-free start.',
  },
];

const Payments = () => (
  <section>
    <div className="container">
      <h2 className="section-title">Seamless payments &amp; delivery</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '30px', justifyContent: 'center' }}>
        {paymentItems.map((item, i) => (
          <div key={i} style={{
            background: '#102433', borderRadius: '32px', padding: '28px',
            flex: '1', minWidth: '240px', border: '1px solid #244C66'
          }}>
            <div style={{ fontSize: '2rem', color: '#F39C12', marginBottom: '12px' }}>{item.icon}</div>
            <h3 style={{ color: '#FFD966', marginBottom: '8px' }}>{item.title}</h3>
            <p>{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default Payments;
