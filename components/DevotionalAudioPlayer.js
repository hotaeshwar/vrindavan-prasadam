'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getAssetUrl } from '../lib/assets';

export default function DevotionalAudioPlayer() {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const audioSrc = getAssetUrl('/audio/prabhupada_japa.mp3');

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = volume;
    audio.loop = true;

    // 1. Attempt immediate autoplay
    const tryAutoplay = async () => {
      try {
        await audio.play();
        setIsPlaying(true);
        setHasInteracted(true);
      } catch (err) {
        // Autoplay blocked by browser policy until user interaction
        setIsPlaying(false);
      }
    };

    tryAutoplay();

    // 2. Global one-time interaction listener to auto-start if initially blocked
    const handleFirstUserInteraction = () => {
      if (audio && audio.paused) {
        audio.play().then(() => {
          setIsPlaying(true);
          setHasInteracted(true);
        }).catch(() => {});
      }
      cleanupListeners();
    };

    const cleanupListeners = () => {
      window.removeEventListener('click', handleFirstUserInteraction);
      window.removeEventListener('touchstart', handleFirstUserInteraction);
      window.removeEventListener('keydown', handleFirstUserInteraction);
      window.removeEventListener('scroll', handleFirstUserInteraction);
    };

    window.addEventListener('click', handleFirstUserInteraction, { once: true, passive: true });
    window.addEventListener('touchstart', handleFirstUserInteraction, { once: true, passive: true });
    window.addEventListener('keydown', handleFirstUserInteraction, { once: true, passive: true });
    window.addEventListener('scroll', handleFirstUserInteraction, { once: true, passive: true });

    return () => {
      cleanupListeners();
    };
  }, []);

  // Play / Pause toggle
  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      audio.play().then(() => {
        setIsPlaying(true);
        setHasInteracted(true);
      }).catch((e) => console.warn('Audio play error:', e));
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  };

  // Mute / Unmute toggle
  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    const nextMuted = !audio.muted;
    audio.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  // Volume change
  const handleVolumeChange = (e) => {
    const newVol = parseFloat(e.target.value);
    const audio = audioRef.current;
    if (audio) {
      audio.volume = newVol;
      audio.muted = newVol === 0;
      setIsMuted(newVol === 0);
    }
    setVolume(newVol);
  };

  return (
    <>
      {/* Hidden Native Audio Element (Continuous Loop) */}
      <audio
        ref={audioRef}
        src={audioSrc}
        loop
        preload="auto"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          // Extra safeguard to keep looping continuously
          if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(() => {});
          }
        }}
      />

      {/* Floating Devotional Audio Player Widget */}
      <div 
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 select-none print:hidden"
        style={{ filter: 'drop-shadow(0 10px 25px rgba(180, 83, 9, 0.25))' }}
      >
        <div 
          className={`transition-all duration-300 rounded-2xl border-2 border-amber-400/90 backdrop-blur-md shadow-2xl overflow-hidden ${
            isPlaying 
              ? 'bg-gradient-to-r from-[#2E1204] via-[#451A07] to-[#2E1204] text-amber-100' 
              : 'bg-[#FFFDF9]/95 text-maroon-950 border-saffron-300'
          }`}
        >
          {/* Collapsed Pill View */}
          <div className="flex items-center gap-2.5 p-2 sm:p-2.5">
            
            {/* Play / Pause Animated Button */}
            <button
              type="button"
              onClick={togglePlay}
              title={isPlaying ? 'Pause Maha Mantra Japa' : 'Play Srila Prabhupada Maha Mantra Japa'}
              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center transition-all transform active:scale-95 cursor-pointer shrink-0 ${
                isPlaying 
                  ? 'bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30' 
                  : 'bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300'
              }`}
            >
              {isPlaying ? (
                // Pause icon with animated ring
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                </svg>
              ) : (
                // Play icon
                <svg className="w-5 h-5 fill-current ml-0.5" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
            </button>

            {/* Title & Soundwaves */}
            <div 
              className="flex flex-col cursor-pointer pr-1"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-xs">📿</span>
                <span className={`text-xs sm:text-sm font-serif font-black tracking-wide ${isPlaying ? 'text-amber-300' : 'text-maroon-950'}`}>
                  Srila Prabhupada Japa
                </span>
                {isPlaying && (
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                )}
              </div>

              <div className="flex items-center gap-2 mt-0.5">
                <p className={`text-[10px] sm:text-[11px] font-bold ${isPlaying ? 'text-amber-200/90' : 'text-maroon-800/80'}`}>
                  {isPlaying ? 'Hare Krishna Maha Mantra • 16 Rounds' : 'Click to Play Audio'}
                </p>

                {/* Animated Sound Waves when playing */}
                {isPlaying && (
                  <div className="flex items-end gap-0.5 h-3 ml-1">
                    <span className="w-0.5 bg-amber-400 rounded-full animate-pulse h-2"></span>
                    <span className="w-0.5 bg-amber-300 rounded-full animate-bounce h-3"></span>
                    <span className="w-0.5 bg-amber-400 rounded-full animate-pulse h-1.5"></span>
                    <span className="w-0.5 bg-amber-300 rounded-full animate-bounce h-2.5"></span>
                  </div>
                )}
              </div>
            </div>

            {/* Mute & Expand Controls */}
            <div className="flex items-center gap-1 pl-1 border-l border-amber-400/30">
              <button
                type="button"
                onClick={toggleMute}
                title={isMuted ? 'Unmute' : 'Mute'}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isPlaying 
                    ? 'text-amber-200 hover:text-white hover:bg-white/10' 
                    : 'text-maroon-800 hover:text-black hover:bg-amber-100'
                }`}
              >
                {isMuted ? (
                  // Muted Icon
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  </svg>
                ) : (
                  // Sound Icon
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? 'Collapse controls' : 'Show volume slider'}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isPlaying 
                    ? 'text-amber-200 hover:text-white hover:bg-white/10' 
                    : 'text-maroon-800 hover:text-black hover:bg-amber-100'
                }`}
              >
                <svg 
                  className={`w-3.5 h-3.5 transform transition-transform ${isExpanded ? 'rotate-180' : 'rotate-0'}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Expanded Drawer: Volume Slider & Devotional Subtitle */}
          {isExpanded && (
            <div className={`px-3.5 pb-3 pt-1 border-t transition-all ${
              isPlaying ? 'border-amber-500/30 bg-black/20' : 'border-saffron-200 bg-amber-50/50'
            }`}>
              <div className="flex items-center justify-between gap-3 text-xs mb-1">
                <span className={`font-bold ${isPlaying ? 'text-amber-200' : 'text-maroon-900'}`}>
                  Volume
                </span>
                <span className={`font-mono text-[11px] font-bold ${isPlaying ? 'text-amber-400' : 'text-amber-800'}`}>
                  {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
                </span>
              </div>

              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-full accent-amber-500 cursor-pointer h-1.5 bg-neutral-300 rounded-lg appearance-none"
              />

              <p className={`text-[10px] text-center mt-2 font-serif italic ${isPlaying ? 'text-amber-300/80' : 'text-maroon-800/70'}`}>
                Hare Krishna Hare Krishna Krishna Krishna Hare Hare • Hare Rama Hare Rama Rama Rama Hare Hare
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
