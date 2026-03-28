import React from 'react';

const Contact = () => (
  <section id="contact">
    <div className="container" style={{ textAlign: 'center' }}>
      <h2 style={{ color: 'white' }}>Ready to start selling?</h2>
      <p style={{ margin: '16px auto', maxWidth: '500px', color: '#BED3EC' }}>
        We're currently onboarding our first sellers. Reach out via WhatsApp or email
        and we'll get your shop set up.
      </p>
      <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <a href="https://wa.me/260776987839" className="btn-primary" target="_blank" rel="noreferrer">
          💬 WhatsApp us
        </a>
        <a href="mailto:stevenngoma697@gmail.com" className="btn-outline">
          📧 Send an email
        </a>
      </div>
      <p style={{ marginTop: '28px', color: '#2D6A4F', fontSize: '0.9rem' }}>
        📍 Lusaka, Zambia
      </p>
    </div>
  </section>
);

export default Contact;
