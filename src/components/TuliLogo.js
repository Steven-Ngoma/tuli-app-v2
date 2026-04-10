import React from 'react';

const TuliLogo = ({ size = 44 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 44 44"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Broken circle - gap at bottom where T stem meets */}
    <circle cx="22" cy="22" r="19" stroke="#F39C12" strokeWidth="2.5" strokeDasharray="90 30" strokeLinecap="round" />
    {/* T horizontal bar */}
    <rect x="14" y="13" width="16" height="3.5" rx="1.75" fill="#F39C12" />
    {/* T stem - extended to touch the circle gap at bottom */}
    <rect x="20.25" y="13" width="3.5" height="15.5" rx="1.75" fill="#F39C12" />
  </svg>
);

export default TuliLogo;
