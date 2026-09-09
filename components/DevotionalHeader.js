'use client';

import React from 'react';
import { getAssetUrl } from '../lib/assets';

export default function DevotionalHeader() {
  return (
    <header className="relative w-full mb-6">
      {/* Top Auspicious Invocation Pill */}
      <div className="text-center mb-3">
        <div className="inline-flex items-center gap-2 px-5 py-1.5 rounded-full bg-gradient-to-r from-saffron-500/20 via-saffron-600/25 to-saffron-500/20 border border-saffron-500/40 text-maroon-950 font-serif font-bold text-xs sm:text-sm tracking-widest shadow-sm">
          <span className="text-saffron-600 text-sm">🙏</span>
          <span>HARE KRISHNA</span>
          <span className="text-saffron-600 text-sm">🙏</span>
        </div>
      </div>

      {/* Main Grand Poster-Style Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#FFFDF8] via-[#FFF9ED] to-[#FFF3D6] border-2 border-saffron-500 shadow-divine-lg p-4 sm:p-5 lg:p-6">
        {/* Subtle Decorative Golden Corner Ornaments */}
        <div className="absolute top-2 left-2 text-saffron-500/50 text-base select-none pointer-events-none">❖</div>
        <div className="absolute top-2 right-2 text-saffron-500/50 text-base select-none pointer-events-none">❖</div>
        <div className="absolute bottom-2 left-2 text-saffron-500/50 text-base select-none pointer-events-none">❖</div>
        <div className="absolute bottom-2 right-2 text-saffron-500/50 text-base select-none pointer-events-none">❖</div>

        {/* 2-Column Balanced Header Grid: [Sri Shyam Sundar & FSSAI on Left] | [Brand Center & Auspicious Invocations] */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-center">
          
          {/* ========================================================================= */}
          {/* LEFT: Prominent Sri Shyam Sundar / Banke Bihari Photo + Real FSSAI Tag */}
          {/* ========================================================================= */}
          <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col items-center justify-center gap-3 text-center">
            
            {/* Grand Deity Photo */}
            <div className="relative group w-36 h-36 sm:w-40 sm:h-40 lg:w-44 lg:h-44 rounded-2xl overflow-hidden border-2 border-amber-500 shadow-xl bg-amber-50 shrink-0">
              <img 
                src={getAssetUrl('/images/shyam.jpg')} 
                alt="Sri Radha Shyam Sundar" 
                className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-500"
              />
            </div>

            {/* Real Uncropped FSSAI Authority Details Badge */}
            <div className="space-y-1 text-center sm:text-left lg:text-center">
              <div className="inline-flex items-center gap-2.5 bg-white px-3 py-1.5 rounded-xl border border-saffron-300 shadow-sm">
                <div className="h-7 w-16 sm:w-20 shrink-0 flex items-center justify-center">
                  <img 
                    src={getAssetUrl('/images/images.jfif')} 
                    alt="FSSAI Logo" 
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="leading-tight text-left border-l border-neutral-300 pl-2">
                  <span className="font-extrabold text-saffron-900 text-[10px] sm:text-[11px] block uppercase tracking-tight">
                    Registered Seva
                  </span>
                  <span className="font-mono text-[9px] sm:text-[10px] text-maroon-950 font-bold block">
                    Lic. 22726812000343
                  </span>
                </div>
              </div>
              <div className="text-[11px] font-black text-maroon-950 block">
                ଓଡ଼ିଶା 56 • ODISHA 56
              </div>
            </div>

          </div>

          {/* ========================================================================= */}
          {/* CENTER & RIGHT: Grand Brand Crest & Advance Booking */}
          {/* ========================================================================= */}
          <div className="lg:col-span-8 text-center space-y-3">
            
            {/* Ornate Gold & Maroon Brand Plaque */}
            <div className="relative inline-block w-full max-w-xl mx-auto rounded-3xl bg-gradient-to-b from-[#2E1204] via-[#4A1E06] to-[#2E1204] p-4 sm:p-6 border-2 border-amber-400 shadow-xl text-white">
              {/* Inner golden filigree border */}
              <div className="absolute inset-1 rounded-2xl border border-amber-400/40 pointer-events-none"></div>

              <span className="text-[10px] sm:text-xs font-serif uppercase tracking-widest text-amber-300 font-semibold block mb-1">
                ✦ Pure Food • Divine Service • Happy Souls ✦
              </span>

              <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-extrabold text-amber-200 tracking-tight drop-shadow-md leading-tight">
                Vrindavan Prasadam Network
              </h1>

              <div className="inline-block mt-2.5 px-5 py-1.5 rounded-md bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-maroon-950 font-serif font-extrabold text-xs sm:text-sm tracking-widest uppercase shadow-sm">
                CATERING SERVICE
              </div>
            </div>

            {/* Poster "BOOKING FORM" Ribbon */}
            <div>
              <div className="relative inline-flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-8 py-2 rounded-xl bg-gradient-to-r from-maroon-950 via-maroon-900 to-maroon-950 text-amber-100 font-serif font-bold text-sm sm:text-base md:text-lg uppercase tracking-wider border border-amber-500/60 shadow-md">
                <span className="text-amber-400 text-xs">❖</span>
                <span>BOOKING FORM</span>
                <span className="text-amber-400 text-xs">❖</span>
              </div>
            </div>

            {/* Advance Booking Pill & Sacred Devotional Quote */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-1.5">
              <span className="inline-block px-4 py-1.5 rounded-full bg-cream-200 border-2 border-saffron-500 text-maroon-950 font-serif font-black text-xs shadow-xs uppercase tracking-wider">
                Advance Booking
              </span>

              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-100 via-amber-200/90 to-amber-100 border-2 border-amber-400 text-maroon-950 shadow-sm">
                <img 
                  src={getAssetUrl('/images/golden_tilak.svg')} 
                  alt="Sacred Tilak" 
                  className="h-5 w-auto object-contain inline-block shrink-0 drop-shadow-xs" 
                />
                <span className="font-serif font-black text-xs sm:text-sm text-maroon-950 tracking-tight">
                  &ldquo;Good Food Brings People Closer to Krishna&rdquo;
                </span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </header>
  );
}
