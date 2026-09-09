import React from 'react';

/**
 * Sacred Vaishnava Tilak (Urdhva Pundra) SVG Motif
 */
export function TilakIcon({ className = "w-6 h-8 text-saffron-600", ...props }) {
  return (
    <svg 
      viewBox="0 0 40 60" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Outer Golden U */}
      <path 
        d="M8 8 C 8 32, 16 44, 20 48 C 24 44, 32 32, 32 8" 
        stroke="currentColor" 
        strokeWidth="4" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      {/* Central Red/Saffron Tulasi leaf / line */}
      <path 
        d="M20 12 L20 44" 
        stroke="#DC2626" 
        strokeWidth="3.5" 
        strokeLinecap="round" 
      />
      {/* Tulasi base leaf */}
      <path 
        d="M20 48 C 17 52, 15 56, 20 59 C 25 56, 23 52, 20 48 Z" 
        fill="#DC2626" 
      />
    </svg>
  );
}

/**
 * Sacred Lotus Flower Icon
 */
export function LotusIcon({ className = "w-6 h-6 text-saffron-500", ...props }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="currentColor" 
      className={className} 
      {...props}
    >
      <path d="M12 3c-1.5 3-3.5 5.5-6 7 2.5 1.5 4.5 4 6 7 1.5-3 3.5-5.5 6-7-2.5-1.5-4.5-4-6-7z" opacity="0.9" />
      <path d="M12 17c-2-2-5-3.5-9-3.5 1 4 4 7 9 7.5 5-.5 8-3.5 9-7.5-4 0-7 1.5-9 3.5z" opacity="0.75" />
      <path d="M12 12c-2.5-1-6-1.5-11 0 1 3 3.5 5.5 7 6 2-2 3.5-4 4-6z" opacity="0.6" />
      <path d="M12 12c2.5-1 6-1.5 11 0-1 3-3.5 5.5-7 6-2-2-3.5-4-4-6z" opacity="0.6" />
    </svg>
  );
}

/**
 * Peacock Feather Icon
 */
export function PeacockFeatherIcon({ className = "w-6 h-6 text-emerald-600", ...props }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      className={className} 
      {...props}
    >
      <path 
        d="M12 22C12 22 20 16 20 9C20 4.5 16.5 2 12 2C7.5 2 4 4.5 4 9C4 16 12 22 12 22Z" 
        stroke="currentColor" 
        strokeWidth="1.5" 
      />
      <circle cx="12" cy="9" r="4.5" fill="#0284C7" fillOpacity="0.4" stroke="#0369A1" strokeWidth="1.5" />
      <circle cx="12" cy="9" r="2" fill="#D97706" />
      <path d="M12 13.5V22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Sacred Diya / Lamp Icon
 */
export function DiyaIcon({ className = "w-5 h-5 text-saffron-500", ...props }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} {...props}>
      <path d="M12 2C11 5 9 6.5 9 8.5a3 3 0 0 0 6 0C15 6.5 13 5 12 2z" className="text-amber-500 animate-pulse" />
      <path d="M3 14c0 3.87 4.03 7 9 7s9-3.13 9-7c0-2-3-3-9-3s-9 1-9 3z" className="text-saffron-700" />
      <path d="M5 14c0 2 3.13 4 7 4s7-2 7-4c0-.8-2-1.5-7-1.5S5 13.2 5 14z" className="text-amber-300" opacity="0.6" />
    </svg>
  );
}

/**
 * Devotional Divider with Central Mandala Motif
 */
export function DevotionalDivider({ title = "", className = "" }) {
  return (
    <div className={`flex items-center justify-center my-6 gap-3 ${className}`}>
      <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-saffron-400/60 to-saffron-600/80"></div>
      <div className="flex items-center gap-1.5 px-2 text-saffron-700">
        <span className="text-xs">❖</span>
        {title ? (
          <span className="text-xs uppercase tracking-widest font-semibold px-2 text-maroon-900 font-serif">
            {title}
          </span>
        ) : (
          <TilakIcon className="w-4 h-6 text-saffron-600" />
        )}
        <span className="text-xs">❖</span>
      </div>
      <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-saffron-400/60 to-saffron-600/80"></div>
    </div>
  );
}
