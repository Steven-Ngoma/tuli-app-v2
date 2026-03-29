import React, { useState, useRef } from 'react';

const ImageCarousel = ({ images, height = '120px' }) => {
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef(null);

  if (!images || images.length === 0) return null;

  const prev = e => { e.stopPropagation(); setCurrent(i => (i - 1 + images.length) % images.length); };
  const next = e => { e.stopPropagation(); setCurrent(i => (i + 1) % images.length); };

  const onTouchStart = e => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = e => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 40) setCurrent(i => (i + 1) % images.length);
    else if (diff < -40) setCurrent(i => (i - 1 + images.length) % images.length);
    touchStartX.current = null;
  };

  return (
    <div style={{ position: 'relative', width: '100%', height, overflow: 'hidden', borderRadius: '16px 16px 0 0' }}
      onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
    >
      {images.map((src, i) => (
        <img key={i} src={src} alt={`slide-${i}`} style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          objectFit: 'cover', opacity: i === current ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out'
        }} />
      ))}

      {images.length > 1 && (
        <>
          <button onClick={prev} style={{
            position: 'absolute', left: '6px', top: '50%', transform: 'translateY(-50%)',
            background: 'rgba(0,0,0,0.4)', border: 'none', color: 'white', borderRadius: '50%',
            width: '24px', height: '24px', cursor: 'pointer', fontSize: '0.8rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2
          }}>‹</button>
          <button onClick={next} style={{
            position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)',
            background: 'rgba(0,0,0,0.4)', border: 'none', color: 'white', borderRadius: '50%',
            width: '24px', height: '24px', cursor: 'pointer', fontSize: '0.8rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2
          }}>›</button>
          <div style={{ position: 'absolute', bottom: '6px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '4px', zIndex: 2 }}>
            {images.map((_, i) => (
              <span key={i} onClick={e => { e.stopPropagation(); setCurrent(i); }} style={{
                width: i === current ? '14px' : '6px', height: '6px',
                borderRadius: '10px', background: i === current ? '#F39C12' : 'rgba(255,255,255,0.7)',
                cursor: 'pointer', transition: 'all 0.3s'
              }} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ImageCarousel;
