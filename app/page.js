'use client';

import React from 'react';
import DevotionalHeader from '../components/DevotionalHeader';
import BookingForm from '../components/BookingForm';
import { PeacockFeatherIcon } from '../components/DevotionalMotifs';
import { getAssetUrl } from '../lib/assets';
import { 
  PhoneIcon, 
  MapPinIcon, 
  ShieldCheckIcon 
} from '../components/Icons';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col justify-between relative overflow-x-hidden">
      {/* Top Floating Devotional Announcement Bar */}
      <nav className="w-full bg-gradient-to-r from-maroon-950 via-maroon-900 to-maroon-950 text-amber-200 border-b border-saffron-500/40 py-2.5 px-4 sticky top-0 z-40 shadow-md backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
          {/* Left: Location & Invocations */}
          <div className="flex items-center gap-2 font-serif">
            <span className="text-saffron-400 font-bold">🛕 Sri Vrindavan Dham & Mathura</span>
            <span className="text-saffron-400/60 hidden sm:inline">•</span>
            <span className="text-amber-100 hidden sm:inline">Odisha 56 • Pure Sattvic Catering & 84 Kosh Yatra</span>
          </div>

          {/* Right: Direct Helpline */}
          <div className="flex items-center gap-4">
            <a 
              href="https://wa.me/918171637425" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
            >
              <PhoneIcon className="w-3.5 h-3.5" />
              <span>WhatsApp: +91 81716 37425</span>
            </a>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-3 sm:px-6 py-6 sm:py-8">
        {/* Grand Poster Header: Lord Jagannath on Left | Brand Center | Puri Jagannath Temple on Right */}
        <DevotionalHeader />

        {/* Core Interactive Advance Booking Form */}
        <BookingForm />

        {/* Devotional Footer */}
        <footer className="w-full max-w-4xl mx-auto mt-10 pt-4 text-center space-y-2 text-xs text-maroon-900/70 border-t border-saffron-300">
          <p className="font-semibold text-saffron-900">
            Dedicated to the service of Vaishnavas, pilgrims, and devotees visiting Sri Vrindavan Dham, Govardhan, Barsana, Nandgaon & Mathura.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-saffron-800 pt-1">
            <span>Direct Helpline: +91 81716 37425</span>
            <span>•</span>
            <span>Sri Vrindavan, Mathura (U.P.)</span>
            <span>•</span>
            <span>ଓଡ଼ିଶା 56 • ODISHA 56</span>
          </div>
          <p className="text-[11px] text-maroon-900/50 pt-1">
            🙏 Radhe Radhe • Hare Krishna • Jay Jagannath Swami 🙏
          </p>
        </footer>
      </main>
    </div>
  );
}
