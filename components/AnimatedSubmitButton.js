'use client';

import React from 'react';
import { CheckCircleIcon, ArrowRightIcon } from './Icons';

/**
 * WhatsApp SVG Icon
 */
export function WhatsAppIcon({ className = "w-6 h-6", ...props }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="currentColor" 
      className={className} 
      {...props}
    >
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
    </svg>
  );
}

export default function AnimatedSubmitButton({
  isSubmitting = false,
  progress = 0,
  onClick,
  disabled = false,
}) {
  const isReady = progress >= 100;

  return (
    <div className="w-full max-w-xl mx-auto my-6 text-center">
      {/* Main Split-Reveal Animated Button */}
      <button
        type="submit"
        id="submit-booking-btn"
        disabled={disabled || isSubmitting}
        onClick={onClick}
        className={`relative w-full overflow-hidden rounded-2xl py-4 sm:py-4.5 px-6 font-semibold text-white shadow-lg transition-all duration-300 select-none group focus:outline-none focus:ring-4 focus:ring-emerald-400/50 ${
          isSubmitting
            ? 'bg-emerald-700 cursor-wait shadow-inner'
            : 'bg-[#25D366] hover:bg-[#20bd5a] hover:shadow-xl hover:shadow-emerald-500/25 active:scale-[0.99] cursor-pointer'
        }`}
        style={{
          minHeight: '62px',
        }}
      >
        {/* Split Reveal Background Underlayer (Shows on hover) */}
        {!isSubmitting && (
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-emerald-400 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-400 ease-out" />
        )}

        {/* Split Left Shutter Layer */}
        {!isSubmitting && (
          <div 
            className="absolute top-0 bottom-0 left-0 w-1/2 bg-[#25D366] transition-transform duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:-translate-x-3 pointer-events-none"
            style={{ zIndex: 1 }}
          />
        )}

        {/* Split Right Shutter Layer */}
        {!isSubmitting && (
          <div 
            className="absolute top-0 bottom-0 right-0 w-1/2 bg-[#25D366] transition-transform duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:translate-x-3 pointer-events-none"
            style={{ zIndex: 1 }}
          />
        )}

        {/* Inner Shimmering Light on Hover */}
        {!isSubmitting && (
          <div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out pointer-events-none"
            style={{ zIndex: 2 }}
          />
        )}

        {/* Interactive Content Layer */}
        <div 
          className="relative flex items-center justify-center gap-3 text-base sm:text-lg font-bold tracking-wide transition-all duration-300 group-hover:-translate-y-0.5"
          style={{ zIndex: 3 }}
        >
          {isSubmitting ? (
            <div className="flex items-center gap-3">
              {isReady ? (
                <>
                  <CheckCircleIcon className="w-6 h-6 text-white animate-bounce" />
                  <span className="text-white drop-shadow-sm">Booking Ready ✓</span>
                </>
              ) : (
                <>
                  <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Preparing Booking... ({progress}%)</span>
                </>
              )}
            </div>
          ) : (
            <>
              <WhatsAppIcon className="w-6 h-6 text-white drop-shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6" />
              <span className="drop-shadow-sm font-sans">Send Booking on WhatsApp</span>
              <ArrowRightIcon className="w-5 h-5 text-white/90 transition-transform duration-300 group-hover:translate-x-1.5" />
            </>
          )}
        </div>

        {/* Progress Bar Container (when submitting) */}
        {isSubmitting && (
          <div 
            className="absolute bottom-0 left-0 right-0 h-2 bg-emerald-950/40 overflow-hidden"
            style={{ zIndex: 4 }}
          >
            <div
              className="h-full bg-gradient-to-r from-amber-300 via-emerald-300 to-white transition-all duration-150 ease-out shadow-[0_0_8px_rgba(255,255,255,0.8)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </button>
    </div>
  );
}
