import React from 'react';

const testimonials = [
  {
    quote: '"I sell clothes in Kamwala. TULI gave me an online shop without renting a physical store. Commission after sale is fair."',
    author: '— Alice B., Product seller',
  },
  {
    quote: '"My restaurant now gets calls from new customers every week. K100 monthly listing is nothing compared to the exposure."',
    author: '— James M., Service provider',
  },
  {
    quote: '"As a buyer, I love that I don\'t need to create an account. Just search, WhatsApp the seller, and buy."',
    author: '— Natasha K., Lusaka',
  },
];

const Testimonials = () => (
  <section>
    <div className="container">
      <h2 className="section-title">Trusted by local entrepreneurs</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '28px', justifyContent: 'center' }}>
        {testimonials.map((t, i) => (
          <div key={i} style={{
            background: '#102433', borderRadius: '28px', padding: '24px',
            maxWidth: '320px', border: '1px solid #244C66'
          }}>
            <div style={{ color: '#F39C12', fontSize: '1.5rem' }}>❝</div>
            <p style={{ color: '#D4E6FF' }}>{t.quote}</p>
            <p style={{ fontWeight: 700, marginTop: '12px', color: '#FFD966' }}>{t.author}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default Testimonials;
