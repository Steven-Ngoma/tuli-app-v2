import React from 'react';

const TuliLogo = ({ size = 44 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 44 44"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Outer ring - broken circle suggesting openness/growth */}
    <circle cx="22" cy="22" r="19" stroke="#F39C12" strokeWidth="2.5" strokeDasharray="90 30" strokeLinecap="round" />

    {/* Inner T shape - represents TULI and trade */}
    <rect x="14" y="13" width="16" height="3.5" rx="1.75" fill="#F39C12" />
    <rect x="20.25" y="13" width="3.5" height="20" rx="1.75" fill="#F39C12" />


  </svg>
);

export default TuliLogo;
