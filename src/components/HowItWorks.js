import React from 'react';

const steps = [
  { num: 1, title: 'Register as a seller', desc: 'Create your free seller account on TULI and set up your shop in minutes.' },
  { num: 2, title: 'List your products', desc: 'Add your products with photos, price and location directly from your dashboard.' },
  { num: 3, title: 'Buyer chats with you', desc: 'Interested buyers contact you directly through TULI chat.' },
  { num: 4, title: 'You sell, we take 5%', desc: 'Close the deal on TULI. After the sale, send TULI a 5% commission via MoMo or Airtel Money.' },
];

const HowItWorks = () => (
  <section id="how-it-works">
    <div className="container">
      <h2 className="section-title">How it works</h2>
      <div className="steps-row">
        {steps.map((s) => (
          <div className="step-item" key={s.num}>
            <div className="step-num">{s.num}</div>
            <h3>{s.title}</h3>
            <p>{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default HowItWorks;
