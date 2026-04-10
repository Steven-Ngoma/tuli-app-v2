import React, { useState, useEffect, useRef } from 'react';

const PRODUCT_SLIDES = [
  { name: 'Nike Sneaker', price: 'K350', shop: 'MK Shop', tag: '👟 Shoes', image: 'https://res.cloudinary.com/daxhjv2lt/image/upload/v1774783290/tuli/yemnqjrlmzjivl2mnrbu.jpg' },
  { name: 'Smart TV 43"', price: 'K4500', shop: 'MK Shop', tag: '📺 Electronics', image: 'https://res.cloudinary.com/daxhjv2lt/image/upload/v1774699830/tuli/z75ssexasynbnytxocgn.jpg' },
  { name: 'Modern Couch', price: 'K2500', shop: 'MK Shop', tag: '🛋️ Home Goods', image: 'https://res.cloudinary.com/daxhjv2lt/image/upload/v1774699822/tuli/na12kdzy4wkob5u8trwj.jpg' },
  { name: 'Beauty Kit', price: 'K200', shop: 'MK Shop', tag: '💄 Other', image: 'https://res.cloudinary.com/daxhjv2lt/image/upload/v1774783487/tuli/qqi0lkjm0farhmzxywrh.jpg' },
];

const SERVICE_SLIDES = [
  { name: 'Grilled Chicken', price: 'K85', shop: 'Flavour Foods', tag: '🍛 Main Course', image: 'https://res.cloudinary.com/daxhjv2lt/image/upload/v1774699114/tuli/gpbqs8cwpkltovzyz9rp.jpg' },
  { name: 'Chips & Fries', price: 'K45', shop: 'Flavour Foods', tag: '🍟 Sides', image: 'https://res.cloudinary.com/daxhjv2lt/image/upload/v1774699820/tuli/sink7xjuf7luiucslnng.jpg' },
  { name: 'Special Fries', price: 'K50', shop: 'Day Flavors', tag: '🍟 Sides', image: 'https://res.cloudinary.com/daxhjv2lt/image/upload/v1774699820/tuli/sink7xjuf7luiucslnng.jpg' },
  { name: 'Special Chicken', price: 'K90', shop: 'Day Flavors', tag: '🍛 Main Course', image: 'https://res.cloudinary.com/daxhjv2lt/image/upload/v1774699114/tuli/gpbqs8cwpkltovzyz9rp.jpg' },
];

const ProductBanner = ({ tab }) => {
  const slides = tab === 'services' ? SERVICE_SLIDES : PRODUCT_SLIDES;
  const accentColor = tab === 'services' ? '#E67E22' : '#F39C12';
  const label = tab === 'services' ? '🍽️ Featured Service' : '🔥 Featured Product';

  const [current, setCurrent] = useState(0);
  const timerRef = useRef(null);
  const dragStartX = useRef(null);

  const startTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setCurrent(i => (i + 1) % slides.length), 3500);
  };

  useEffect(() => {
    setCurrent(0);
    startTimer();
    return () => clearInterval(timerRef.current);
  }, [tab]);

  const goTo = i => { setCurrent(i); startTimer(); };

  const onDragStart = e => {
    dragStartX.current = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
  };
  const onDragEnd = e => {
    if (dragStartX.current === null) return;
    const diff = dragStartX.current - (e.type === 'touchend' ? e.changedTouches[0].clientX : e.clientX);
    if (Math.abs(diff) > 40) goTo(diff > 0 ? (current + 1) % slides.length : (current - 1 + slides.length) % slides.length);
    dragStartX.current = null;
  };

  const slide = slides[current];

  return (
    <div
      onMouseDown={onDragStart} onMouseUp={onDragEnd}
      onTouchStart={onDragStart} onTouchEnd={onDragEnd}
      style={{ position: 'relative', width: '100%', height: '220px', borderRadius: '20px', overflow: 'hidden', marginBottom: '28px', cursor: 'grab', userSelect: 'none' }}
    >
      {slides.map((s, i) => (
        <div key={i} style={{ position: 'absolute', inset: 0, opacity: i === current ? 1 : 0, transition: 'opacity 0.6s ease' }}>
          <img src={s.image} alt={s.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)' }} />
        </div>
      ))}

      {/* Top label */}
      <div style={{ position: 'absolute', top: '14px', left: '14px', zIndex: 2 }}>
        <span style={{ background: accentColor, color: '#1B4332', fontSize: '0.7rem', fontWeight: 700, padding: '4px 12px', borderRadius: '20px' }}>
          {label}
        </span>
      </div>

      {/* Bottom text */}
      <div style={{ position: 'absolute', bottom: '38px', left: '20px', zIndex: 2 }}>
        <div style={{ color: '#ccc', fontSize: '0.75rem', marginBottom: '2px' }}>{slide.tag}</div>
        <div style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 800, textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>{slide.name}</div>
        <div style={{ color: accentColor, fontSize: '1rem', fontWeight: 700 }}>
          {slide.price}
          <span style={{ color: '#ccc', fontSize: '0.8rem', fontWeight: 400 }}> · {slide.shop}</span>
        </div>
      </div>

      {/* Dots */}
      <div style={{ position: 'absolute', bottom: '14px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '6px', zIndex: 2 }}>
        {slides.map((_, i) => (
          <span key={i} onClick={() => goTo(i)} style={{
            width: i === current ? '20px' : '7px', height: '7px',
            borderRadius: '10px', background: i === current ? accentColor : 'rgba(255,255,255,0.5)',
            cursor: 'pointer', transition: 'all 0.3s', display: 'inline-block'
          }} />
        ))}
      </div>
    </div>
  );
};

export default ProductBanner;
