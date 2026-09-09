'use client';

import React, { useEffect } from 'react';
import { CheckCircleIcon, ExternalLinkIcon, SparklesIcon, MessageCircleIcon } from './Icons';
import { TilakIcon } from './DevotionalMotifs';

export default function SuccessOverlay({
  isOpen = false,
  bookingId = '',
  redirectUrl = '',
  onManualRedirect,
}) {
  useEffect(() => {
    if (isOpen) {
      try {
        import('canvas-confetti').then((module) => {
          const confetti = module.default;
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#D97706', '#F59E0B', '#25D366', '#B45309', '#FDE68A']
          });
        }).catch(() => {});
      } catch {}
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-full max-w-md bg-gradient-to-b from-[#FFFDF9] via-[#FFF8E8] to-[#FFF1D0] rounded-3xl p-6 sm:p-8 text-center border-2 border-saffron-500 shadow-2xl overflow-hidden animate-scaleUp"
      >
        {/* Top Decorative Tilak & Floral Accents */}
        <div className="flex justify-center mb-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 border-2 border-emerald-500 flex items-center justify-center shadow-inner animate-pulse">
              <CheckCircleIcon className="w-9 h-9 text-emerald-600 stroke-[2.5]" />
            </div>
            <div className="absolute -top-1 -right-1">
              <SparklesIcon className="w-5 h-5 text-saffron-500 animate-spin" style={{ animationDuration: '6s' }} />
            </div>
          </div>
        </div>

        {/* Status Header */}
        <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2 border border-emerald-300">
          Booking Prepared ✓
        </span>

        <h3 className="font-serif text-2xl sm:text-3xl font-bold text-maroon-950">
          Hare Krishna!
        </h3>
        
        <p className="text-sm text-maroon-900/80 mt-1">
          Your advance booking request has been generated successfully.
        </p>

        {/* Generated Booking ID Card */}
        <div className="my-5 p-4 rounded-2xl bg-white/95 border-2 border-saffron-400 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-saffron-800 font-semibold mb-1">
            <span className="flex items-center gap-1">
              <TilakIcon className="w-3.5 h-4 text-saffron-600" />
              Unique Booking ID
            </span>
            <span className="text-[11px] bg-saffron-100 px-2 py-0.5 rounded font-mono text-saffron-900">
              CONFIRMED
            </span>
          </div>

          <div className="font-mono text-xl sm:text-2xl font-extrabold text-saffron-700 tracking-wider py-1 bg-cream-100 rounded-lg border border-saffron-200">
            {bookingId || 'HK-GENERATING...'}
          </div>
          
          <p className="text-[11px] text-maroon-900/60 mt-1.5 font-medium">
            Please share this message in WhatsApp to confirm with our coordinator.
          </p>
        </div>

        {/* Redirecting Progress Animation */}
        <div className="flex items-center justify-center gap-2 text-sm font-semibold text-emerald-800 py-1">
          <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <span>Opening WhatsApp...</span>
        </div>

        {/* Direct Action Link (Fallback for popup blockers) */}
        <div className="mt-5 pt-4 border-t border-saffron-300/40">
          <a
            href={redirectUrl}
            onClick={onManualRedirect}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-sm shadow-md transition-all duration-200"
          >
            <MessageCircleIcon className="w-4 h-4" />
            <span>Open WhatsApp Now</span>
            <ExternalLinkIcon className="w-3.5 h-3.5 opacity-80" />
          </a>
          <p className="text-[11px] text-maroon-900/50 mt-2">
            If WhatsApp does not open automatically, tap the green button above.
          </p>
        </div>
      </div>
    </div>
  );
}
