import React, { useState } from 'react';

const ImageCarousel = ({ images, height = '140px' }) => {
  const [current, setCurrent] = useState(0);

  if (!images || images.length === 0) return null;

  return (
    <div style={{ position: 'relative', width: '100%', height, borderRadius: '16px', overflow: 'hidden', marginBottom: '12px' }}>
      {images.map((src, i) => (
        <img
          key={i}
          src={src}
          alt={`slide-${i}`}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', borderRadius: '16px',
            opacity: i === current ? 1 : 0,
            transition: 'opacity 0.6s ease-in-out'
          }}
        />
      ))}
      {images.length > 1 && (
        <div style={{ position: 'absolute', bottom: '8px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '5px' }}>
          {images.map((_, i) => (
            <span
              key={i}
              onClick={() => setCurrent(i)}
              style={{
                width: i === current ? '16px' : '6px', height: '6px',
                borderRadius: '10px', background: i === current ? '#F39C12' : 'rgba(255,255,255,0.6)',
                cursor: 'pointer', transition: 'all 0.3s'
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageCarousel;
