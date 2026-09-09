'use client';

import React from 'react';
import { CheckIcon } from './Icons';

export default function CheckboxCard({
  id,
  label,
  sublabel = '',
  checked = false,
  onChange,
  icon: IconComponent = null,
  disabled = false,
  badge = '',
}) {
  return (
    <button
      type="button"
      id={id}
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative w-full text-left p-3.5 sm:p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer select-none flex items-center justify-between gap-3 min-h-[52px] group focus:outline-none focus:ring-2 focus:ring-saffron-500/50 ${
        checked
          ? 'bg-cream-200 border-saffron-600 shadow-sm text-maroon-900 ring-1 ring-saffron-500/30'
          : 'bg-white hover:bg-[#FFFDF8] border-gray-200/90 hover:border-saffron-300 text-maroon-900/85 hover:shadow-xs'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* Optional Leading Icon */}
        {IconComponent && (
          <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
            checked 
              ? 'bg-saffron-600 text-white shadow-xs' 
              : 'bg-saffron-50 text-saffron-700 group-hover:bg-saffron-100'
          }`}>
            <IconComponent className="w-4 h-4" />
          </div>
        )}

        <div className="truncate">
          <div className="flex items-center gap-2">
            <span className={`text-sm sm:text-base font-medium truncate ${
              checked ? 'font-bold text-maroon-950' : 'text-maroon-900'
            }`}>
              {label}
            </span>
            {badge && (
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-saffron-100 text-saffron-800 border border-saffron-300">
                {badge}
              </span>
            )}
          </div>
          {sublabel && (
            <p className="text-xs text-maroon-900/60 truncate mt-0.5">
              {sublabel}
            </p>
          )}
        </div>
      </div>

      {/* Animated Checkbox Indicator */}
      <div className={`flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center border transition-all duration-200 ${
        checked
          ? 'bg-saffron-600 border-saffron-600 text-white scale-105 shadow-xs'
          : 'bg-white border-gray-300 group-hover:border-saffron-400'
      }`}>
        <CheckIcon 
          className={`w-3.5 h-3.5 transition-transform duration-200 ${
            checked ? 'scale-100 opacity-100 stroke-[3]' : 'scale-0 opacity-0'
          }`} 
        />
      </div>
    </button>
  );
}
