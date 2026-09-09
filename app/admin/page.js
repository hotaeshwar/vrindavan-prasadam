'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  loginAdminUser, 
  logoutAdminUser, 
  subscribeAuthState, 
  subscribeToBookings, 
  fetchAllBookings,
  deleteBooking,
  updateBookingStatus,
  createAdminUser
} from '../../lib/firebase';
import { getAssetUrl } from '../../lib/assets';

export default function AdminPage() {
  // Auth state
  const [currentUser, setCurrentUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);
  
  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // 0 to 100 login buffering animation state
  const [loginProgress, setLoginProgress] = useState(0);
  const [showLoginBuffer, setShowLoginBuffer] = useState(false);

  // Data state
  const [bookings, setBookings] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [filterService, setFilterService] = useState('ALL');
  
  // Excel download 0 to 100 animation & popup state
  const [isDownloadingExcel, setIsDownloadingExcel] = useState(false);
  const [excelProgress, setExcelProgress] = useState(0);
  const [showExcelPopup, setShowExcelPopup] = useState(false);
  const [downloadedFileName, setDownloadedFileName] = useState('');

  // Toast notification
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Auth observer
  useEffect(() => {
    const unsubscribe = subscribeAuthState((user) => {
      setCurrentUser(user);
      setAuthChecking(false);
    });
    return () => unsubscribe();
  }, []);

  // Real-time bookings listener
  useEffect(() => {
    if (!currentUser) return;

    setLoadingData(true);
    const unsubscribe = subscribeToBookings(
      (data) => {
        setBookings(data);
        setLoadingData(false);
      },
      (err) => {
        console.error('Realtime subscription error:', err);
        // Fallback fetch once
        fetchAllBookings().then((fallbackData) => {
          setBookings(fallbackData);
          setLoadingData(false);
        });
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [currentUser]);

  // Handle Login Submit with 0 to 100 animation
  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setLoginError('');

    if (!email.trim() || !password.trim()) {
      setLoginError('Please enter both email and password.');
      return;
    }

    try {
      setIsLoggingIn(true);

      const loggedInUser = await loginAdminUser(email.trim(), password.trim());

      // Start 0 to 100 Buffering Animation upon successful authentication
      setShowLoginBuffer(true);
      setLoginProgress(0);

      const duration = 1400; // ms
      const stepTime = 20; // ms
      const totalSteps = duration / stepTime;
      let currentStep = 0;

      const timer = setInterval(() => {
        currentStep++;
        const pct = Math.min(100, Math.round((currentStep / totalSteps) * 100));
        setLoginProgress(pct);

        if (pct >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            setCurrentUser(loggedInUser);
            setShowLoginBuffer(false);
            setIsLoggingIn(false);
            showToast('Hare Krishna! Welcome to Admin Panel 🙏');
          }, 300);
        }
      }, stepTime);

    } catch (err) {
      console.error('Auth error:', err);
      setIsLoggingIn(false);
      setShowLoginBuffer(false);

      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setLoginError('Invalid email or password. Please verify your admin credentials.');
      } else if (err.code === 'auth/wrong-password') {
        setLoginError('Incorrect password. Please try again.');
      } else if (err.code === 'auth/weak-password') {
        setLoginError('Password should be at least 6 characters (e.g. admin123).');
      } else {
        setLoginError(err.message || 'Authentication failed. Please check credentials.');
      }
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await logoutAdminUser();
      setSelectedBooking(null);
      showToast('Logged out successfully.');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Filtered & Sorted bookings (Newest first)
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const q = searchTerm.toLowerCase();
      const matchSearch = 
        !searchTerm ||
        (b.bookingId && b.bookingId.toLowerCase().includes(q)) ||
        (b.name && b.name.toLowerCase().includes(q)) ||
        (b.mobile && b.mobile.toLowerCase().includes(q)) ||
        (b.city && b.city.toLowerCase().includes(q));

      const matchService = 
        filterService === 'ALL' ||
        (b.services && Array.isArray(b.services) && b.services.some(s => s.toLowerCase().includes(filterService.toLowerCase())));

      return matchSearch && matchService;
    });
  }, [bookings, searchTerm, filterService]);

  // Key Statistics
  const stats = useMemo(() => {
    const total = bookings.length;
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayCount = bookings.filter(b => {
      const date = b.createdClientTime ? b.createdClientTime.slice(0, 10) : '';
      return date === todayStr;
    }).length;

    const totalGuests = bookings.reduce((sum, b) => {
      const p = parseInt(b.people || '0', 10);
      return sum + (isNaN(p) ? 0 : p);
    }, 0);

    return { total, todayCount, totalGuests };
  }, [bookings]);

  // Excel Export with 0 to 100 Progress Animation
  const handleExcelExport = () => {
    if (bookings.length === 0) {
      alert('No bookings available to export.');
      return;
    }

    setIsDownloadingExcel(true);
    setExcelProgress(0);

    const duration = 1500; // ms
    const stepTime = 25; // ms
    const totalSteps = duration / stepTime;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const pct = Math.min(100, Math.round((currentStep / totalSteps) * 100));
      setExcelProgress(pct);

      if (pct >= 100) {
        clearInterval(timer);

        // Dynamically import xlsx on client side
        import('xlsx').then((XLSX) => {
          try {
            const exportData = bookings.map((b, idx) => {
            return {
              'S.No': idx + 1,
              'Booking Number': b.bookingId || `HK-${b.id}`,
              'Booking Date & Time': b.createdAtFormatted || b.createdClientTime || '',
              'Devotee Name': b.name || '',
              'Mobile Number': b.mobile || '',
              'City': b.city || '',
              'Address': b.address || 'N/A',
              'Number of People': b.people || '',
              'From Date (DT)': b.fromDate || '',
              'To Date (TO DT)': b.toDate || '',
              'Prasadam Meals': Array.isArray(b.meals) ? b.meals.join(', ') : (b.meals || 'None'),
              'Selected Services': Array.isArray(b.services) ? b.services.join(', ') : (b.services || 'None'),
              'Guide Language': b.guideLanguage || 'Not required',
              'Other Services': b.otherService || '',
              'Special Instructions': b.specialInstructions || '',
              'Booking Status': b.status || 'Confirmed'
            };
          });

          const ws = XLSX.utils.json_to_sheet(exportData);

          // Auto column widths
          const colWidths = [
            { wch: 6 },  // S.No
            { wch: 22 }, // Booking Number
            { wch: 22 }, // Date
            { wch: 20 }, // Name
            { wch: 15 }, // Mobile
            { wch: 15 }, // City
            { wch: 25 }, // Address
            { wch: 12 }, // People
            { wch: 14 }, // From Date
            { wch: 14 }, // To Date
            { wch: 25 }, // Meals
            { wch: 30 }, // Services
            { wch: 18 }, // Guide
            { wch: 20 }, // Other
            { wch: 30 }, // Instructions
            { wch: 12 }, // Status
          ];
          ws['!cols'] = colWidths;

          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, 'Prasadam Bookings');

          const now = new Date();
          const filename = `Vrindavan_Prasadam_Bookings_${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}.xlsx`;
          
          XLSX.writeFile(wb, filename);

          setDownloadedFileName(filename);
          setIsDownloadingExcel(false);
          setShowExcelPopup(true);
        } catch (err) {
          console.error('Excel generation error:', err);
          setIsDownloadingExcel(false);
          alert('Failed to generate Excel sheet. Please try again.');
        }
      }).catch((err) => {
        console.error('Error loading xlsx module:', err);
        setIsDownloadingExcel(false);
        alert('Could not load Excel exporter.');
      });
      }
    }, stepTime);
  };

  // Delete booking handler
  const handleDeleteBooking = async (id, bookingNumber) => {
    if (window.confirm(`Are you sure you want to delete Booking ${bookingNumber}?`)) {
      const ok = await deleteBooking(id);
      if (ok) {
        showToast(`Booking ${bookingNumber} deleted.`);
        if (selectedBooking?.id === id) setSelectedBooking(null);
      } else {
        alert('Failed to delete booking.');
      }
    }
  };

  // Status change handler
  const handleStatusChange = async (id, newStatus) => {
    const ok = await updateBookingStatus(id, newStatus);
    if (ok) {
      showToast(`Status updated to ${newStatus}`);
      if (selectedBooking?.id === id) {
        setSelectedBooking(prev => ({ ...prev, status: newStatus }));
      }
    }
  };

  // Quick refresh
  const handleRefresh = async () => {
    setLoadingData(true);
    const fresh = await fetchAllBookings();
    setBookings(fresh);
    setLoadingData(false);
    showToast('Data refreshed successfully');
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#ffffff] flex flex-col items-center justify-center p-4">
        <div className="w-14 h-14 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 font-bold text-black tracking-wide">Loading Admin Portal...</p>
      </div>
    );
  }

  // =========================================================================
  // VIEW 1: 0 to 100 BUFFERING SCREEN (ON LOGIN SUCCESS)
  // =========================================================================
  if (showLoginBuffer) {
    return (
      <div className="fixed inset-0 bg-[#ffffff] z-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-28 h-28 mb-5 rounded-2xl bg-[#2E1204] border-2 border-amber-400 p-2 shadow-xl flex items-center justify-center">
          <img 
            src={getAssetUrl('/images/brand_logo.jpg')}
            alt="Vrindavan Prasadam"
            className="w-full h-full object-contain rounded-xl"
          />
        </div>

        <h2 className="text-2xl md:text-3xl font-bold text-black mb-2">
          Authenticating Admin
        </h2>
        <p className="text-black font-bold mb-6">
          Hare Krishna! Loading Vrindavan Prasadam Network Dashboard...
        </p>

        {/* Progress Bar and Percentage Counter */}
        <div className="w-full max-w-md bg-neutral-200 rounded-full h-5 overflow-hidden shadow-inner border border-neutral-300 p-0.5 mb-3">
          <div 
            className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 h-full rounded-full transition-all duration-75 flex items-center justify-end pr-2"
            style={{ width: `${loginProgress}%` }}
          >
            <span className="text-[10px] font-bold text-white drop-shadow"></span>
          </div>
        </div>

        <div className="text-3xl font-black text-amber-600 tracking-wider">
          {loginProgress}%
        </div>
        <p className="text-xs text-neutral-600 font-bold mt-2">
          {loginProgress < 40 ? 'Connecting to system...' : loginProgress < 85 ? 'Fetching devotees bookings...' : 'Finalizing dashboard access...'}
        </p>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: LOGIN FORM (IF NOT LOGGED IN)
  // =========================================================================
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#ffffff] text-black flex flex-col justify-center items-center p-4 md:p-6">
        {/* Main Card */}
        <div className="w-full max-w-md bg-white border border-neutral-300 rounded-2xl shadow-2xl p-6 sm:p-8 relative overflow-hidden">
          
          {/* Top Decorative Devotional Bar */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600"></div>

          {/* Logo & Tilak Header */}
          <div className="text-center mb-6 pt-1">
            {/* Sacred Golden Tilak at top */}
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-amber-500 text-xs">❖</span>
              <div className="w-8 h-10 flex items-center justify-center">
                <img 
                  src={getAssetUrl('/images/golden_tilak.svg')}
                  alt="Golden Tilak"
                  className="w-full h-full object-contain drop-shadow-sm"
                />
              </div>
              <span className="text-amber-500 text-xs">❖</span>
            </div>

            {/* Complete Uncropped Brand Logo Emblem */}
            <div className="mx-auto w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-gradient-to-b from-[#2E1204] via-[#3E1A08] to-[#2E1204] border-2 border-amber-400 p-2 shadow-xl flex items-center justify-center relative overflow-hidden mb-3">
              <div className="absolute inset-0.5 rounded-xl border border-amber-400/30 pointer-events-none"></div>
              <img 
                src={getAssetUrl('/images/brand_logo.jpg')}
                alt="Vrindavan Prasadam Network Logo"
                className="w-full h-full object-contain rounded-xl drop-shadow"
              />
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-black uppercase tracking-wide">
              Vrindavan Prasadam
            </h1>
            <p className="text-xs sm:text-sm font-bold text-amber-800 mt-0.5">
              Admin Portal Authentication
            </p>
            <div className="inline-block bg-amber-100 text-amber-950 border border-amber-300 text-xs font-bold px-3.5 py-0.5 rounded-full mt-2 shadow-xs">
              Hare Krishna 🙏 Radhe Radhe
            </div>
          </div>

          {/* Error Message */}
          {loginError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-300 rounded-xl text-red-700 text-xs font-bold flex items-start gap-2">
              <svg className="w-4 h-4 text-red-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <circle cx="12" cy="12" r="10" strokeWidth="2" />
                <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2" strokeLinecap="round" />
                <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span>{loginError}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1.5">
                Admin Email
              </label>
              <div className="relative">
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@vrindavanprasadam.com"
                  required
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-black font-bold placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
                />
                <div className="absolute right-3 top-2.5 text-neutral-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Password with Masking / Unmasking */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-black uppercase tracking-wider">
                  Password
                </label>
                <span className="text-[11px] text-amber-700 font-bold">
                  {showPassword ? 'Masked: OFF' : 'Masked: ON'}
                </span>
              </div>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-black font-bold placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm pr-11"
                />
                {/* Masking / Unmasking Button */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Mask Password' : 'Unmask Password'}
                  className="absolute right-2.5 top-2 p-1 text-neutral-600 hover:text-black focus:outline-none"
                >
                  {showPassword ? (
                    // Eye Off (Mask) Icon
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    // Eye (Unmask) Icon
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-700 hover:to-orange-700 text-white font-bold rounded-xl shadow-lg transition-all transform active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isLoggingIn ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Admin</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Back to Home link */}
          <div className="mt-5 pt-4 border-t border-neutral-200 text-center">
            <Link 
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-600 hover:text-black"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Devotee Booking Page</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 3: ADMIN DASHBOARD (LOGGED IN) - Clean White #ffff & Bold Black Text
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#ffffff] text-black font-sans antialiased selection:bg-amber-100 selection:text-black pb-16">
      
      {/* Toast popup */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-black text-white px-4 py-2.5 rounded-xl shadow-2xl text-xs font-bold flex items-center gap-2 border border-amber-400 animate-bounce">
          <span className="text-amber-400">✦</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header className="bg-white border-b-2 border-neutral-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          
          {/* Brand & Devotional Greeting */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl border-2 border-amber-500 overflow-hidden shrink-0 shadow bg-[#2E1204] p-1 flex items-center justify-center">
              <img 
                src={getAssetUrl('/images/brand_logo.jpg')}
                alt="Logo"
                className="object-contain w-full h-full rounded-lg"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-black uppercase tracking-tight">
                  Vrindavan Prasadam Admin
                </h1>
                <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full">
                  LIVE
                </span>
              </div>
              <p className="text-xs font-bold text-black mt-0.5">
                Admin: <span className="text-amber-700">{currentUser.email || 'Administrator'}</span> • <span className="text-black font-black">Hare Krishna 🙏 Radhe Radhe</span>
              </p>
            </div>
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            <Link 
              href="/"
              target="_blank"
              className="px-3 py-1.5 text-xs font-bold text-black bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 rounded-lg flex items-center gap-1.5"
            >
              <span>Booking Page</span>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Link>

            <button
              onClick={handleRefresh}
              title="Refresh Data"
              className="p-1.5 text-xs font-bold text-black bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 rounded-lg flex items-center gap-1"
            >
              <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="hidden md:inline">Refresh</span>
            </button>

            <button
              onClick={handleLogout}
              className="px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        
        {/* Top Summary Cards */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border-2 border-neutral-200 rounded-2xl p-4 shadow-sm">
            <p className="text-xs font-bold text-neutral-600 uppercase tracking-wider">Total Bookings</p>
            <p className="text-3xl font-black text-black mt-1">{stats.total}</p>
          </div>

          <div className="bg-white border-2 border-neutral-200 rounded-2xl p-4 shadow-sm">
            <p className="text-xs font-bold text-neutral-600 uppercase tracking-wider">Today&apos;s Bookings</p>
            <p className="text-3xl font-black text-amber-600 mt-1">{stats.todayCount}</p>
            <p className="text-[11px] font-bold text-black mt-0.5">Latest registrations</p>
          </div>

          <div className="bg-white border-2 border-neutral-200 rounded-2xl p-4 shadow-sm">
            <p className="text-xs font-bold text-neutral-600 uppercase tracking-wider">Total Devotees / Guests</p>
            <p className="text-3xl font-black text-black mt-1">{stats.totalGuests}</p>
            <p className="text-[11px] font-bold text-black mt-0.5">Yatris & Visitors</p>
          </div>

          {/* EXCEL EXPORT BUTTON WITH 0 TO 100 PROGRESS */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
            <div>
              <p className="text-xs font-bold text-amber-900 uppercase tracking-wider">Excel Export</p>
              <p className="text-xs font-bold text-black mt-1">Download complete records</p>
            </div>

            <button
              type="button"
              onClick={handleExcelExport}
              disabled={isDownloadingExcel}
              className="mt-3 w-full py-2.5 px-3 bg-green-700 hover:bg-green-800 text-white text-xs font-bold rounded-xl shadow transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isDownloadingExcel ? (
                <span>Exporting ({excelProgress}%)...</span>
              ) : (
                <>
                  <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/>
                    <path d="M8.5 13.5l1.8 2.7-1.8 2.8h1.5l1.1-1.8 1.1 1.8h1.5l-1.8-2.8 1.8-2.7h-1.5l-1.1 1.8-1.1-1.8H8.5z"/>
                  </svg>
                  <span>Download Excel Sheet</span>
                </>
              )}
            </button>
          </div>
        </section>

        {/* Filter & Search Bar */}
        <section className="bg-white border-2 border-neutral-200 rounded-2xl p-4 mb-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 relative">
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Booking Number (HK-...), Devotee Name, Mobile, or City..."
              className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-black font-bold placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
            />
            <svg className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-3 top-3 text-xs font-bold text-neutral-500 hover:text-black"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs font-bold text-black uppercase shrink-0">Filter Service:</label>
            <select
              value={filterService}
              onChange={(e) => setFilterService(e.target.value)}
              className="px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-black font-bold text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">All Services</option>
              <option value="Prasadam">Prasadam</option>
              <option value="Room">Room / Ashram</option>
              <option value="Hotel">Hotel</option>
              <option value="84 Kosh">84 Kosh Yatra</option>
              <option value="Taxi">Taxi</option>
              <option value="Bus">Bus</option>
              <option value="Bhagwat">Bhagwat Katha</option>
            </select>
          </div>
        </section>

        {/* Bookings Table (Recent on top) */}
        <section className="bg-white border-2 border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b-2 border-neutral-200 flex items-center justify-between bg-neutral-50">
            <div>
              <h2 className="text-base font-black text-black uppercase tracking-wide flex items-center gap-2">
                <span>Recent Devotee Bookings</span>
                <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                  {filteredBookings.length} total
                </span>
              </h2>
              <p className="text-xs font-bold text-black mt-0.5">
                Sorted with most recent entries on top
              </p>
            </div>

            <button
              type="button"
              onClick={handleExcelExport}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-700 hover:bg-green-800 text-white rounded-lg text-xs font-bold shadow-sm cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Export to Excel</span>
            </button>
          </div>

          {loadingData ? (
            <div className="py-16 text-center">
              <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-sm font-bold text-black">Fetching bookings...</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="py-16 text-center px-4">
              <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-3 text-neutral-400">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-base font-bold text-black">No bookings found</p>
              <p className="text-xs font-bold text-neutral-600 mt-1">
                {searchTerm ? 'Try changing your search terms' : 'Bookings made on the form will appear here live'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-100 border-b-2 border-neutral-200 text-xs font-black text-black uppercase tracking-wider">
                    <th className="py-3.5 px-4">Booking No.</th>
                    <th className="py-3.5 px-4">Devotee Name</th>
                    <th className="py-3.5 px-4">Contact</th>
                    <th className="py-3.5 px-4">City</th>
                    <th className="py-3.5 px-4 text-center">People</th>
                    <th className="py-3.5 px-4">Dates</th>
                    <th className="py-3.5 px-4">Services / Meals</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {filteredBookings.map((b) => (
                    <tr 
                      key={b.id || b.bookingId} 
                      className="hover:bg-amber-50/60 transition-colors text-sm"
                    >
                      {/* Booking ID */}
                      <td className="py-3.5 px-4 font-black text-amber-800 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-black text-black">{b.bookingId || `HK-${b.id}`}</span>
                          <span className="text-[11px] font-bold text-neutral-600">
                            {b.createdAtFormatted || 'Recent'}
                          </span>
                        </div>
                      </td>

                      {/* Name */}
                      <td className="py-3.5 px-4 font-black text-black whitespace-nowrap">
                        {b.name || 'N/A'}
                      </td>

                      {/* Mobile */}
                      <td className="py-3.5 px-4 font-bold text-black whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span>{b.mobile || 'N/A'}</span>
                          {b.mobile && (
                            <a
                              href={`https://wa.me/91${b.mobile.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              title="Chat on WhatsApp"
                              className="text-green-600 hover:text-green-800"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/>
                              </svg>
                            </a>
                          )}
                        </div>
                      </td>

                      {/* City */}
                      <td className="py-3.5 px-4 font-bold text-black whitespace-nowrap">
                        {b.city || 'N/A'}
                      </td>

                      {/* People */}
                      <td className="py-3.5 px-4 font-black text-black text-center whitespace-nowrap">
                        <span className="bg-neutral-100 border border-neutral-300 px-2 py-0.5 rounded-md">
                          {b.people || 1}
                        </span>
                      </td>

                      {/* Dates */}
                      <td className="py-3.5 px-4 font-bold text-black whitespace-nowrap">
                        <div className="text-xs">
                          <div>From: <span className="font-black text-black">{b.fromDate || 'N/A'}</span></div>
                          <div>To: <span className="font-black text-black">{b.toDate || 'N/A'}</span></div>
                        </div>
                      </td>

                      {/* Services / Meals */}
                      <td className="py-3.5 px-4 text-xs font-bold text-black">
                        <div className="max-w-[220px]" title={Array.isArray(b.services) ? b.services.join(', ') : ''}>
                          {Array.isArray(b.services) && b.services.length > 0 ? (
                            <span className="text-black font-black truncate block">{b.services.join(', ')}</span>
                          ) : (
                            <span className="text-neutral-500">Prasadam Seva</span>
                          )}
                        </div>
                        {Array.isArray(b.meals) && b.meals.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {b.meals.map((mealItem, mi) => (
                              <span key={mi} className="bg-amber-100 text-amber-950 font-black text-[11px] px-2 py-0.5 rounded-md border border-amber-300 inline-block shadow-2xs">
                                🍽️ {mealItem}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <select
                          value={b.status || 'Confirmed'}
                          onChange={(e) => handleStatusChange(b.id || b.bookingId, e.target.value)}
                          className="text-xs font-black px-2 py-1 rounded-lg border bg-neutral-50 text-black border-neutral-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        >
                          <option value="Confirmed">Confirmed</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedBooking(b)}
                            className="p-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold cursor-pointer"
                            title="View Full Booking Details"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteBooking(b.id || b.bookingId, b.bookingId || b.id)}
                            className="p-1.5 bg-red-100 hover:bg-red-200 text-red-700 border border-red-300 rounded-lg text-xs font-bold cursor-pointer"
                            title="Delete Booking"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* ========================================================================= */}
      {/* EXCEL EXPORT BUFFERING MODAL (0 to 100 PROGRESS) */}
      {/* ========================================================================= */}
      {isDownloadingExcel && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-green-600 rounded-2xl shadow-2xl p-6 sm:p-8 max-w-sm w-full text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-300 text-green-700">
              <svg className="w-8 h-8 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>

            <h3 className="text-xl font-black text-black mb-1">
              Preparing Excel Sheet
            </h3>
            <p className="text-xs font-bold text-black mb-4">
              Exporting all devotees data...
            </p>

            {/* Progress bar */}
            <div className="w-full bg-neutral-200 rounded-full h-4 overflow-hidden border border-neutral-300 mb-2 p-0.5">
              <div 
                className="bg-green-600 h-full rounded-full transition-all duration-75"
                style={{ width: `${excelProgress}%` }}
              ></div>
            </div>

            <div className="text-2xl font-black text-green-700">
              {excelProgress}%
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EXCEL DOWNLOADED SUCCESS POPUP */}
      {/* ========================================================================= */}
      {showExcelPopup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border-2 border-green-600 rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md w-full text-center relative">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-green-500 text-green-700">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h3 className="text-2xl font-black text-black mb-1">
              Downloaded Successfully!
            </h3>
            <p className="text-sm font-bold text-black mb-3">
              Your Excel spreadsheet has been generated and saved to your device.
            </p>

            <div className="bg-neutral-100 border border-neutral-300 rounded-xl p-3 mb-5 text-left">
              <p className="text-xs font-bold text-neutral-600">Saved File:</p>
              <p className="text-xs font-black text-green-800 break-all">{downloadedFileName}</p>
              <p className="text-[11px] font-bold text-neutral-600 mt-1">Total records exported: {bookings.length}</p>
            </div>

            <button
              type="button"
              onClick={() => setShowExcelPopup(false)}
              className="w-full py-2.5 px-4 bg-green-700 hover:bg-green-800 text-white font-bold rounded-xl shadow cursor-pointer text-sm"
            >
              Done & Close
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* BOOKING DETAIL MODAL */}
      {/* ========================================================================= */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-neutral-300 rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b-2 border-neutral-200 pb-3 mb-4">
              <div>
                <span className="text-xs font-black text-amber-700 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded">
                  {selectedBooking.bookingId || `HK-${selectedBooking.id}`}
                </span>
                <h3 className="text-xl font-black text-black mt-1">
                  {selectedBooking.name || 'Devotee Reservation'}
                </h3>
                <p className="text-xs font-bold text-neutral-600">
                  Booked on: {selectedBooking.createdAtFormatted || selectedBooking.createdClientTime || 'Recent'}
                </p>
              </div>

              <button 
                onClick={() => setSelectedBooking(null)}
                className="p-1.5 text-neutral-500 hover:text-black hover:bg-neutral-100 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Grid Info */}
            <div className="space-y-4 text-black text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-neutral-50 p-3.5 rounded-xl border border-neutral-200">
                <div>
                  <p className="text-xs font-bold text-neutral-500 uppercase">Mobile Number</p>
                  <p className="font-black text-black">{selectedBooking.mobile || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-neutral-500 uppercase">City / State</p>
                  <p className="font-black text-black">{selectedBooking.city || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-neutral-500 uppercase">Number of Guests</p>
                  <p className="font-black text-black">{selectedBooking.people || 1} People</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-neutral-500 uppercase">Yatra / Stay Dates</p>
                  <p className="font-black text-black">{selectedBooking.fromDate || 'N/A'} to {selectedBooking.toDate || 'N/A'}</p>
                </div>
              </div>

              {selectedBooking.address && (
                <div className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-200">
                  <p className="text-xs font-bold text-neutral-500 uppercase">Full Address</p>
                  <p className="font-bold text-black mt-0.5">{selectedBooking.address}</p>
                </div>
              )}

              {/* Meals */}
              <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-200">
                <p className="text-xs font-bold text-amber-900 uppercase">Prasadam Meals Requested</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {Array.isArray(selectedBooking.meals) && selectedBooking.meals.length > 0 ? (
                    selectedBooking.meals.map((m, i) => (
                      <span key={i} className="bg-amber-200/80 text-amber-950 font-black text-xs px-2.5 py-1 rounded-lg border border-amber-300">
                        {m}
                      </span>
                    ))
                  ) : (
                    <span className="font-bold text-black text-xs">No specific meals selected</span>
                  )}
                </div>
              </div>

              {/* Services */}
              <div className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-200">
                <p className="text-xs font-bold text-neutral-500 uppercase">Services Booked</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {Array.isArray(selectedBooking.services) && selectedBooking.services.length > 0 ? (
                    selectedBooking.services.map((s, i) => (
                      <span key={i} className="bg-neutral-200 text-black font-black text-xs px-2.5 py-1 rounded-lg border border-neutral-300">
                        {s}
                      </span>
                    ))
                  ) : (
                    <span className="font-bold text-black text-xs">Standard Booking</span>
                  )}
                </div>
              </div>

              {/* Guide Language */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-neutral-50 p-3.5 rounded-xl border border-neutral-200">
                <div>
                  <p className="text-xs font-bold text-neutral-500 uppercase">Guide Language</p>
                  <p className="font-black text-black">{selectedBooking.guideLanguage || 'Not required'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-neutral-500 uppercase">Current Status</p>
                  <p className="font-black text-amber-800">{selectedBooking.status || 'Confirmed'}</p>
                </div>
              </div>

              {/* Special Instructions */}
              {selectedBooking.specialInstructions && (
                <div className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-200">
                  <p className="text-xs font-bold text-neutral-500 uppercase">Special Instructions</p>
                  <p className="font-bold text-black mt-0.5 whitespace-pre-wrap">{selectedBooking.specialInstructions}</p>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="mt-6 pt-4 border-t-2 border-neutral-200 flex flex-wrap items-center justify-between gap-3">
              {selectedBooking.mobile && (
                <a
                  href={`https://wa.me/91${selectedBooking.mobile.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white rounded-xl text-xs font-bold flex items-center gap-2"
                >
                  <span>Direct WhatsApp</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </a>
              )}

              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="px-5 py-2 bg-neutral-200 hover:bg-neutral-300 text-black rounded-xl text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
