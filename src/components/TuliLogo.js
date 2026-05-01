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
    <rect x="20.25" y="13" width="3.5" height="13" rx="1.75" fill="#F39C12" />

    {/* Two dots below T - represent buyer & seller connecting */}
    <circle cx="16" cy="30" r="2.5" fill="#F39C12" />
    <circle cx="28" cy="30" r="2.5" fill="#F39C12" />

    {/* Connecting line between the two dots */}
    <line x1="18.5" y1="30" x2="25.5" y2="30" stroke="#F39C12" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2" />
  </svg>
);

export default TuliLogo;
