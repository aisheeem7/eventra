import { useId } from 'react';

// EvenTra mark: a white admit-one ticket carrying an "E", tilted on a pastel-blue tile, with a yellow spark.
export function LogoMark({ size = 40 }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" role="img" aria-label="EvenTra logo">
      <defs>
        <linearGradient id={`g${id}`} x1="4" y1="2" x2="44" y2="46" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#8DB8FF" />
          <stop offset="1" stopColor="#3F6FE0" />
        </linearGradient>
        <mask id={`m${id}`}>
          <rect x="10" y="14" width="28" height="21" rx="4.5" fill="#fff" />
          <circle cx="10" cy="24.5" r="3.2" fill="#000" />
          <circle cx="38" cy="24.5" r="3.2" fill="#000" />
        </mask>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="14" fill={`url(#g${id})`} />
      <rect x="2" y="2" width="44" height="22" rx="14" fill="#fff" opacity=".12" />
      <g transform="rotate(-9 24 24.5)">
        <rect x="10" y="14" width="28" height="21" rx="4.5" fill="#fff" mask={`url(#m${id})`} />
        <line x1="30.5" y1="17" x2="30.5" y2="32" stroke="#BFD4FF" strokeWidth="1.4" strokeDasharray="2 2" strokeLinecap="round" />
        <g fill="#3F6FE0">
          <rect x="15.5" y="18.5" width="3.2" height="12" rx="1.6" />
          <rect x="15.5" y="18.5" width="10" height="3.2" rx="1.6" />
          <rect x="15.5" y="22.9" width="7.5" height="3.2" rx="1.6" />
          <rect x="15.5" y="27.3" width="10" height="3.2" rx="1.6" />
        </g>
      </g>
      <path d="M37 6.5c.6 3.2 1.8 4.4 5 5-3.2.6-4.4 1.8-5 5-.6-3.2-1.8-4.4-5-5 3.2-.6 4.4-1.8 5-5z" fill="#FFD866" stroke="#fff" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

export function Wordmark({ size = 20 }) {
  return (
    <span className="wordmark" style={{ fontSize: size }}>
      Even<span>Tra</span>
    </span>
  );
}
