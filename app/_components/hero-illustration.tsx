// Self-contained, stylized travel illustration (no external assets).
// To use your own artwork instead, see the swap note in landing.tsx.
export function HeroIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 500 500"
      className={className}
      role="img"
      aria-label="Illustration of a traveler exploring the world"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* soft backdrop */}
      <circle cx="250" cy="250" r="210" fill="#f6e7dd" />
      <circle cx="250" cy="250" r="210" fill="url(#g-glow)" opacity="0.6" />

      {/* sun */}
      <circle cx="360" cy="140" r="46" fill="#e0552b" />
      <circle cx="360" cy="140" r="46" fill="url(#g-sun)" />

      {/* clouds */}
      <g fill="#ffffff">
        <ellipse cx="150" cy="150" rx="46" ry="22" />
        <ellipse cx="185" cy="140" rx="30" ry="20" />
        <ellipse cx="120" cy="140" rx="26" ry="18" />
      </g>

      {/* dashed flight path */}
      <path
        d="M110 330 C 180 250, 300 250, 400 190"
        fill="none"
        stroke="#e0552b"
        strokeWidth="3"
        strokeDasharray="2 10"
        strokeLinecap="round"
      />
      <circle cx="110" cy="330" r="6" fill="#e0552b" />

      {/* paper plane */}
      <g transform="translate(388 176) rotate(-28)">
        <path d="M0 0 L34 12 L4 20 L10 12 Z" fill="#1a1a1a" />
        <path d="M4 20 L10 12 L14 22 Z" fill="#4a4a4a" />
      </g>

      {/* globe */}
      <g transform="translate(250 300)">
        <circle r="92" fill="#2b7a78" />
        <circle r="92" fill="url(#g-globe)" />
        {/* land masses */}
        <path
          d="M-58 -30 q20 -18 44 -8 q18 8 6 26 q-14 20 -40 12 q-22 -8 -10 -30 Z"
          fill="#8fd3c9"
        />
        <path
          d="M12 18 q26 -6 40 12 q10 18 -14 30 q-28 12 -40 -12 q-8 -22 14 -30 Z"
          fill="#8fd3c9"
        />
        <path
          d="M-40 44 q18 -8 30 6 q6 14 -14 20 q-22 4 -24 -12 Z"
          fill="#8fd3c9"
        />
        {/* meridians */}
        <ellipse
          rx="92"
          ry="34"
          fill="none"
          stroke="#ffffff"
          strokeWidth="1.5"
          opacity="0.4"
        />
        <ellipse
          rx="40"
          ry="92"
          fill="none"
          stroke="#ffffff"
          strokeWidth="1.5"
          opacity="0.4"
        />
      </g>

      {/* location pin */}
      <g transform="translate(250 196)">
        <path
          d="M0 0 C -26 0, -26 34, 0 62 C 26 34, 26 0, 0 0 Z"
          fill="#e0552b"
          stroke="#1a1a1a"
          strokeWidth="3"
        />
        <circle cy="22" r="10" fill="#ffffff" />
      </g>

      <defs>
        <radialGradient id="g-glow" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="g-sun" cx="35%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#f6a366" />
          <stop offset="100%" stopColor="#e0552b" />
        </radialGradient>
        <linearGradient id="g-globe" x1="0" y1="-1" x2="0" y2="1">
          <stop offset="0%" stopColor="#3aa59d" />
          <stop offset="100%" stopColor="#1f5f5c" />
        </linearGradient>
      </defs>
    </svg>
  );
}
