import React, { useState, useEffect, useRef } from 'react';

const SLIDES = [
  { name: 'Nike Sneaker', price: 'K350', shop: 'MK Shop', image: 'https://res.cloudinary.com/daxhjv2lt/image/upload/v1774783290/tuli/yemnqjrlmzjivl2mnrbu.jpg' },
  { name: 'Smart TV 43"', price: 'K4500', shop: 'MK Shop', image: 'https://res.cloudinary.com/daxhjv2lt/image/upload/v1774699830/tuli/z75ssexasynbnytxocgn.jpg' },
  { name: 'Modern Couch', price: 'K2500', shop: 'MK Shop', image: 'https://res.cloudinary.com/daxhjv2lt/image/upload/v1774699822/tuli/na12kdzy4wkob5u8trwj.jpg' },
  { name: 'Grilled Chicken', price: 'K85', shop: 'Flavour Foods', image: 'https://res.cloudinary.com/daxhjv2lt/image/upload/v1774699114/tuli/gpbqs8cwpkltovzyz9rp.jpg' },
  { name: 'Chips & Fries', price: 'K45', shop: 'Flavour Foods', image: 'https://res.cloudinary.com/daxhjv2lt/image/upload/v1774699820/tuli/sink7xjuf7luiucslnng.jpg' },
];

const ProductBanner = () => {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef(null);
  const dragStartX = useRef(null);

  const startTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setCurrent(i => (i + 1) % SLIDES.length), 3500);
  };

  useEffect(() => {
    startTimer();
    return () => clearInterval(timerRef.current);
  }, []);

  const goTo = i => { setCurrent(i); startTimer(); };

  const onDragStart = e => {
    dragStartX.current = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
  };
  const onDragEnd = e => {
    if (dragStartX.current === null) return;
    const diff = dragStartX.current - (e.type === 'touchend' ? e.changedTouches[0].clientX : e.clientX);
    if (Math.abs(diff) > 40) goTo(diff > 0 ? (current + 1) % SLIDES.length : (current - 1 + SLIDES.length) % SLIDES.length);
    dragStartX.current = null;
  };

  return (
    <div
      onMouseDown={onDragStart} onMouseUp={onDragEnd}
      onTouchStart={onDragStart} onTouchEnd={onDragEnd}
      style={{ position: 'relative', width: '100%', height: '220px', borderRadius: '20px', overflow: 'hidden', marginBottom: '28px', cursor: 'grab', userSelect: 'none' }}
    >
      {SLIDES.map((slide, i) => (
        <div key={i} style={{ position: 'absolute', inset: 0, opacity: i === current ? 1 : 0, transition: 'opacity 0.6s ease' }}>
          <img src={slide.image} alt={slide.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)' }} />
        </div>
      ))}

      {/* Text overlay */}
      <div style={{ position: 'absolute', bottom: '40px', left: '20px', zIndex: 2 }}>
        <span style={{ background: '#F39C12', color: '#1B4332', fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', display: 'inline-block', marginBottom: '6px' }}>
          🔥 Featured
        </span>
        <div style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 800, textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
          {SLIDES[current].name}
        </div>
        <div style={{ color: '#F39C12', fontSize: '1rem', fontWeight: 700 }}>
          {SLIDES[current].price}
          <span style={{ color: '#ccc', fontSize: '0.8rem', fontWeight: 400 }}> · {SLIDES[current].shop}</span>
        </div>
      </div>

      {/* Dots */}
      <div style={{ position: 'absolute', bottom: '14px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '6px', zIndex: 2 }}>
        {SLIDES.map((_, i) => (
          <span key={i} onClick={() => goTo(i)} style={{
            width: i === current ? '20px' : '7px', height: '7px',
            borderRadius: '10px', background: i === current ? '#F39C12' : 'rgba(255,255,255,0.6)',
            cursor: 'pointer', transition: 'all 0.3s', display: 'inline-block'
          }} />
        ))}
      </div>
    </div>
  );
};

export default ProductBanner;
