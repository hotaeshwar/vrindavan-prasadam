'use client';

import React from 'react';
import { getAssetUrl } from '../lib/assets';

export default function FormSection({ 
  number, 
  title, 
  subtitle = '', 
  children, 
  className = '' 
}) {
  return (
    <section className={`relative bg-[#FFFDF8] rounded-2xl border-2 border-saffron-400 shadow-divine p-4 sm:p-6 transition-all duration-300 hover:shadow-divine-lg overflow-hidden ${className}`}>
      
      {/* ========================================================================= */}
      {/* "ଓଡ଼ିଶା 56" SUBTLE DEVOTIONAL BACKGROUND WATERMARK */}
      {/* ========================================================================= */}
      <div 
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden z-0"
      >
        <div 
          className="text-saffron-700/[0.04] font-serif font-extrabold text-5xl sm:text-7xl md:text-8xl tracking-widest transform -rotate-12 whitespace-nowrap"
          style={{ letterSpacing: '0.15em' }}
        >
          ଓଡ଼ିଶା 56
        </div>
      </div>

      {/* Decorative Traditional Section Header Banner Matching the Flyer Poster */}
      <div className="relative -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 mb-5 rounded-t-xl bg-gradient-to-r from-maroon-950 via-maroon-900 to-maroon-950 border-b-2 border-saffron-500 px-4 py-2.5 sm:py-3 text-white flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-2.5">
          {/* Authentic Golden Tilak Image (Clean SVG, zero checkerboard) */}
          <img 
            src={getAssetUrl('/images/golden_tilak.svg')} 
            alt="Tilak" 
            className="h-6 sm:h-7 w-auto object-contain drop-shadow-sm" 
          />
          <h2 className="font-serif text-sm sm:text-base md:text-lg font-bold tracking-wide uppercase text-amber-100 flex items-center gap-1.5">
            <span>{number}.</span>
            <span>{title}</span>
          </h2>
        </div>

        {/* Optional Subtitle */}
        {subtitle && (
          <span className="hidden sm:inline-block text-[11px] text-saffron-200/80 font-normal italic">
            {subtitle}
          </span>
        )}
      </div>

      {/* Section Body */}
      <div className="space-y-4 relative z-10">
        {children}
      </div>
    </section>
  );
}
