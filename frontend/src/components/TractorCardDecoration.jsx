import React from 'react';

export function TractorHillsDecoration() {
  return (
    <div className="card-tractor-hills-decor" aria-hidden="true">
      <svg
        viewBox="0 0 180 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="tractor-hills-svg"
      >
        {/* Rolling hill background fills */}
        <path
          d="M0 100 Q 50 70, 110 82 T 180 75 L 180 100 Z"
          fill="rgba(16, 185, 129, 0.08)"
        />
        <path
          d="M30 100 Q 90 60, 145 68 T 180 62 L 180 100 Z"
          fill="rgba(16, 185, 129, 0.12)"
        />
        
        {/* Contour lines for agricultural terrace / furrow lines */}
        <path
          d="M -10 95 Q 60 78, 125 85 T 190 78"
          stroke="#34d399"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="1 0"
          opacity="0.65"
        />
        <path
          d="M 20 100 Q 85 70, 145 74 T 190 68"
          stroke="#10b981"
          strokeWidth="1.6"
          strokeLinecap="round"
          opacity="0.8"
        />
        <path
          d="M 60 100 Q 110 74, 160 76 T 190 73"
          stroke="#059669"
          strokeWidth="1.4"
          strokeLinecap="round"
          opacity="0.7"
        />

        {/* Charming Tractor Line Art sitting atop the hill crest */}
        <g transform="translate(132, 40) scale(0.68)">
          {/* Big rear wheel */}
          <circle cx="16" cy="24" r="11" stroke="#059669" strokeWidth="2.2" fill="#ffffff" />
          <circle cx="16" cy="24" r="5" stroke="#059669" strokeWidth="1.8" fill="#d1fae5" />
          {/* Rear wheel spokes / treads */}
          <line x1="16" y1="13" x2="16" y2="17" stroke="#059669" strokeWidth="2" strokeLinecap="round" />
          <line x1="16" y1="31" x2="16" y2="35" stroke="#059669" strokeWidth="2" strokeLinecap="round" />
          <line x1="5" y1="24" x2="9" y2="24" stroke="#059669" strokeWidth="2" strokeLinecap="round" />
          <line x1="23" y1="24" x2="27" y2="24" stroke="#059669" strokeWidth="2" strokeLinecap="round" />
          <line x1="8" y1="16" x2="11" y2="19" stroke="#059669" strokeWidth="2" strokeLinecap="round" />
          <line x1="21" y1="29" x2="24" y2="32" stroke="#059669" strokeWidth="2" strokeLinecap="round" />

          {/* Small front wheel */}
          <circle cx="44" cy="28" r="6" stroke="#059669" strokeWidth="2" fill="#ffffff" />
          <circle cx="44" cy="28" r="2.5" stroke="#059669" strokeWidth="1.5" fill="#d1fae5" />
          
          {/* Tractor Body & Engine hood */}
          <path
            d="M 23 23 L 42 23 L 48 23 C 51 23, 52 25, 52 28 L 52 29 L 44 29"
            stroke="#059669"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <path
            d="M 26 23 L 26 15 L 48 15 L 48 23"
            stroke="#059669"
            strokeWidth="2"
            strokeLinejoin="round"
            fill="#d1fae5"
            fillOpacity="0.5"
          />
          {/* Engine grill slots */}
          <line x1="43" y1="17" x2="43" y2="21" stroke="#059669" strokeWidth="1.4" strokeLinecap="round" />
          <line x1="46" y1="17" x2="46" y2="21" stroke="#059669" strokeWidth="1.4" strokeLinecap="round" />

          {/* Cabin frame & Roof */}
          <path
            d="M 12 18 L 12 6 C 12 4.5, 13.5 3.5, 15 3.5 L 30 3.5 C 31.5 3.5, 32.5 4.5, 32.5 6 L 30 15 L 23 15"
            stroke="#059669"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Cabin window pane */}
          <path
            d="M 16 6 L 28 6 L 26.5 13 L 16 13 Z"
            fill="#a7f3d0"
            fillOpacity="0.6"
            stroke="#059669"
            strokeWidth="1.2"
          />
          
          {/* Steering wheel */}
          <line x1="26" y1="11" x2="29" y2="14" stroke="#059669" strokeWidth="1.8" strokeLinecap="round" />
          
          {/* Exhaust pipe with cute subtle puff */}
          <line x1="40" y1="15" x2="40" y2="7" stroke="#059669" strokeWidth="2" strokeLinecap="round" />
          <path d="M 40 7 L 42 6" stroke="#059669" strokeWidth="1.8" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
}

export function LeafCornerDecoration() {
  return (
    <div className="card-leaf-decor-top-right" aria-hidden="true">
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="corner-leaf-svg"
      >
        {/* Large graceful curved leaf */}
        <path
          d="M 95 5 C 65 10, 45 35, 48 65 C 68 55, 88 35, 95 5 Z"
          fill="url(#leafGrad1)"
          opacity="0.85"
        />
        {/* Leaf center spine */}
        <path
          d="M 95 5 Q 70 30, 48 65"
          stroke="#10b981"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.7"
        />
        {/* Secondary smaller leaf */}
        <path
          d="M 98 25 C 80 32, 68 50, 72 70 C 86 62, 95 48, 98 25 Z"
          fill="url(#leafGrad2)"
          opacity="0.75"
        />
        <defs>
          <linearGradient id="leafGrad1" x1="48" y1="65" x2="95" y2="5" gradientUnits="userSpaceOnUse">
            <stop stopColor="#34d399" />
            <stop offset="0.6" stopColor="#10b981" />
            <stop offset="1" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="leafGrad2" x1="72" y1="70" x2="98" y2="25" gradientUnits="userSpaceOnUse">
            <stop stopColor="#6ee7b7" />
            <stop offset="1" stopColor="#10b981" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
