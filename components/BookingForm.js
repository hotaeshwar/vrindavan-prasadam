'use client';

import React, { useState } from 'react';
import FormSection from './FormSection';
import AnimatedSubmitButton from './AnimatedSubmitButton';
import SuccessOverlay from './SuccessOverlay';
import { getWhatsAppRedirectUrl } from '../lib/whatsapp';
import { generateClientBookingId } from '../lib/bookingId';
import { saveBookingToFirebase } from '../lib/firebase';
import { 
  UserIcon, 
  SparklesIcon, 
  FileTextIcon, 
  AlertCircleIcon
} from './Icons';

const MEAL_OPTIONS = [
  { id: 'meal_breakfast', label: 'Breakfast' },
  { id: 'meal_lunch', label: 'Lunch' },
  { id: 'meal_dinner', label: 'Dinner' },
];

const SERVICES_LIST = [
  { id: 'srv_room_ashram', label: 'Room / Ashram' },
  { id: 'srv_hotel', label: 'Hotel' },
  { id: 'srv_flat', label: 'Flat' },
  { id: 'srv_84_kosh', label: '84 Kosh Yatra' },
  { id: 'srv_taxi', label: 'Taxi' },
  { id: 'srv_bus', label: 'Bus' },
  { id: 'srv_prasadam_distrib', label: 'Prasadam Distribution' },
  { id: 'srv_train', label: 'Train' },
  { id: 'srv_yatra', label: 'Yatra' },
  { id: 'srv_bhagwat', label: 'Bhagwat Katha' },
  { id: 'srv_prasadam', label: 'Prasadam' },
];

const GUIDE_LANGUAGES = ['Hindi', 'English', 'Odiya', 'Bengali', 'Other'];

export default function BookingForm() {
  // Form State - ZERO PRE-SELECTIONS ON LOAD
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    address: '',
    city: '',
    people: '',
    fromDate: '',
    toDate: '',
    meals: [],          // Empty by default
    mealCounts: { Breakfast: '', Lunch: '', Dinner: '' },
    services: [],       // Empty by default
    guideRequired: false,
    guideLanguage: '',
    customLanguage: '',
    otherService: '',
    extras: '',
    specialInstructions: '',
  });

  // Validation State
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Submission / Animation States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedBookingId, setGeneratedBookingId] = useState('');
  const [redirectUrl, setRedirectUrl] = useState('');
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);

  // Real-time Field Validation
  const validateField = (field, value, allData = formData) => {
    switch (field) {
      case 'name':
        if (!value || !value.trim()) return 'Name is required';
        if (value.trim().length < 2) return 'Please enter at least 2 characters';
        return '';
      case 'mobile':
        if (!value || !value.trim()) return 'Mobile number is required';
        const digits = value.replace(/\D/g, '');
        if (digits.length < 10) return 'Please enter a valid 10-digit mobile number';
        return '';
      case 'city':
        if (!value || !value.trim()) return 'City is required';
        return '';
      case 'people':
        if (!value || value === '') return 'Number of people is required';
        const num = parseInt(value, 10);
        if (isNaN(num) || num < 1) return 'Must be at least 1';
        return '';
      case 'fromDate':
        if (!value) return 'From Date (DT) is required';
        return '';
      case 'toDate':
        if (!value) return 'To Date (TO DT) is required';
        if (allData.fromDate && new Date(value) < new Date(allData.fromDate)) {
          return 'To Date cannot be earlier than From Date';
        }
        return '';
      default:
        return '';
    }
  };

  const handleChange = (field, value) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);

    if (touched[field]) {
      const errorMsg = validateField(field, value, updated);
      setErrors((prev) => ({ ...prev, [field]: errorMsg }));
    }

    if (field === 'fromDate' && formData.toDate) {
      const toError = validateField('toDate', formData.toDate, updated);
      setErrors((prev) => ({ ...prev, toDate: toError }));
    }
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const errorMsg = validateField(field, formData[field]);
    setErrors((prev) => ({ ...prev, [field]: errorMsg }));
  };

  const toggleMeal = (mealLabel) => {
    setFormData((prev) => {
      const current = prev.meals || [];
      if (current.includes(mealLabel)) {
        return { 
          ...prev, 
          meals: current.filter((m) => m !== mealLabel),
          mealCounts: { ...prev.mealCounts, [mealLabel]: '' }
        };
      } else {
        return { 
          ...prev, 
          meals: [...current, mealLabel],
          mealCounts: { ...prev.mealCounts, [mealLabel]: prev.mealCounts?.[mealLabel] || '' }
        };
      }
    });
  };

  const handleMealCountChange = (mealLabel, count) => {
    setFormData((prev) => {
      const current = prev.meals || [];
      const hasMeal = current.includes(mealLabel);
      const isNotEmpty = count !== undefined && count.trim() !== '';
      
      let nextMeals = current;
      if (isNotEmpty && !hasMeal) {
        nextMeals = [...current, mealLabel];
      } else if (!isNotEmpty && count === '') {
        // If empty, only remove if desired or keep checked
      }

      return {
        ...prev,
        meals: nextMeals,
        mealCounts: { ...prev.mealCounts, [mealLabel]: count }
      };
    });
  };

  const toggleService = (serviceLabel) => {
    setFormData((prev) => {
      const current = prev.services || [];
      if (current.includes(serviceLabel)) {
        return { ...prev, services: current.filter((s) => s !== serviceLabel) };
      } else {
        return { ...prev, services: [...current, serviceLabel] };
      }
    });
  };

  const validateAll = () => {
    const newErrors = {};
    ['name', 'mobile', 'city', 'people', 'fromDate', 'toDate'].forEach((field) => {
      const err = validateField(field, formData[field]);
      if (err) newErrors[field] = err;
    });

    setErrors(newErrors);
    setTouched({
      name: true,
      mobile: true,
      city: true,
      people: true,
      fromDate: true,
      toDate: true,
    });

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!validateAll()) {
      const firstErrorKey = Object.keys(errors)[0] || 'name';
      const el = document.getElementById(`field-${firstErrorKey}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus();
      }
      return;
    }

    try {
      setIsSubmitting(true);
      setProgress(15);

      // Generate sequential booking ID
      const bookingId = generateClientBookingId();
      setGeneratedBookingId(bookingId);

      const formattedMeals = (formData.meals || []).map((m) => {
        const count = formData.mealCounts?.[m];
        return count ? `${m} (${count})` : m;
      });

      const finalServices = [...(formData.services || [])];
      if (formData.otherService?.trim()) {
        finalServices.push(`Other: ${formData.otherService.trim()}`);
      }

      const finalForm = {
        ...formData,
        bookingId: bookingId,
        meals: formattedMeals,
        services: finalServices,
        guideLanguage: formData.guideRequired 
          ? (formData.guideLanguage === 'Other' && formData.customLanguage 
              ? `Other (${formData.customLanguage})` 
              : (formData.guideLanguage || 'Hindi'))
          : 'Not required'
      };

      const waUrl = getWhatsAppRedirectUrl(finalForm, bookingId);
      setRedirectUrl(waUrl);

      // Fire saveBookingToFirebase safely with timeout protection (never hangs UI)
      const savePromise = Promise.race([
        saveBookingToFirebase(finalForm),
        new Promise((resolve) => setTimeout(() => resolve({ timeout: true }), 1200))
      ]).catch((err) => console.warn('Background Firestore save notice:', err));

      // Await save in background
      await savePromise;

      // Deterministic smooth 0 to 100 progress animation that NEVER hangs at 90%
      let currentProgress = 15;
      const progressTimer = setInterval(() => {
        currentProgress += 18;
        if (currentProgress >= 100) {
          clearInterval(progressTimer);
          setProgress(100);

          setTimeout(() => {
            setShowSuccessOverlay(true);

            setTimeout(() => {
              try {
                const newWin = window.open(waUrl, '_blank');
                if (!newWin || newWin.closed || typeof newWin.closed === 'undefined') {
                  window.location.href = waUrl;
                }
              } catch (e) {
                window.location.href = waUrl;
              }
            }, 1400);
          }, 200);
        } else {
          setProgress(currentProgress);
        }
      }, 120);

    } catch (err) {
      console.error('Submission error:', err);
      const fallbackId = generateClientBookingId();
      setGeneratedBookingId(fallbackId);
      const waUrl = getWhatsAppRedirectUrl(formData, fallbackId);
      setRedirectUrl(waUrl);
      setProgress(100);
      setShowSuccessOverlay(true);
      setTimeout(() => {
        try {
          const newWin = window.open(waUrl, '_blank');
          if (!newWin || newWin.closed || typeof newWin.closed === 'undefined') {
            window.location.href = waUrl;
          }
        } catch (e) {
          window.location.href = waUrl;
        }
      }, 1400);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6 w-full">
      {/* ========================================================================= */}
      {/* SECTION 1: 1. INFORMATION (Clear, Unobstructed Poster Layout) */}
      {/* ========================================================================= */}
      <FormSection
        number="1"
        title="INFORMATION"
        subtitle="Customer Information & Booking Schedule"
      >
        <div className="space-y-4">
          
          {/* Row 1: Name & Mobile (2-column responsive grid) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Name */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <label htmlFor="field-name" className="font-serif font-bold text-sm sm:text-base text-maroon-950 sm:w-20 shrink-0">
                Name :
              </label>
              <div className="flex-1 w-full">
                <input
                  type="text"
                  id="field-name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  onBlur={() => handleBlur('name')}
                  placeholder="Enter full name"
                  className={`w-full px-3.5 py-2 rounded-xl border-2 text-sm sm:text-base text-maroon-950 placeholder-gray-400 bg-[#FFFDF9] transition-all focus:outline-none ${
                    errors.name && touched.name
                      ? 'border-red-500 ring-1 ring-red-200 bg-red-50/20'
                      : 'border-saffron-300 focus:border-saffron-600 focus:ring-1 focus:ring-saffron-500/30'
                  }`}
                />
                {errors.name && touched.name && (
                  <p className="mt-1 text-xs text-red-600 font-medium flex items-center gap-1">
                    <AlertCircleIcon className="w-3.5 h-3.5" />
                    <span>{errors.name}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Mobile */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <label htmlFor="field-mobile" className="font-serif font-bold text-sm sm:text-base text-maroon-950 sm:w-20 shrink-0">
                Mob :
              </label>
              <div className="flex-1 w-full">
                <input
                  type="tel"
                  id="field-mobile"
                  name="mobile"
                  required
                  value={formData.mobile}
                  onChange={(e) => handleChange('mobile', e.target.value)}
                  onBlur={() => handleBlur('mobile')}
                  placeholder="10-digit mobile"
                  className={`w-full px-3.5 py-2 rounded-xl border-2 text-sm sm:text-base text-maroon-950 placeholder-gray-400 bg-[#FFFDF9] transition-all focus:outline-none ${
                    errors.mobile && touched.mobile
                      ? 'border-red-500 ring-1 ring-red-200 bg-red-50/20'
                      : 'border-saffron-300 focus:border-saffron-600 focus:ring-1 focus:ring-saffron-500/30'
                  }`}
                />
                {errors.mobile && touched.mobile && (
                  <p className="mt-1 text-xs text-red-600 font-medium flex items-center gap-1">
                    <AlertCircleIcon className="w-3.5 h-3.5" />
                    <span>{errors.mobile}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Row 2: Address & City (2-column responsive grid) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Address */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <label htmlFor="field-address" className="font-serif font-bold text-sm sm:text-base text-maroon-950 sm:w-20 shrink-0">
                Address :
              </label>
              <div className="flex-1 w-full">
                <input
                  type="text"
                  id="field-address"
                  name="address"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="Enter residential address"
                  className="w-full px-3.5 py-2 rounded-xl border-2 border-saffron-300 text-sm sm:text-base text-maroon-950 placeholder-gray-400 bg-[#FFFDF9] transition-all focus:outline-none focus:border-saffron-600 focus:ring-1 focus:ring-saffron-500/30"
                />
              </div>
            </div>

            {/* City */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <label htmlFor="field-city" className="font-serif font-bold text-sm sm:text-base text-maroon-950 sm:w-20 shrink-0">
                City :
              </label>
              <div className="flex-1 w-full">
                <input
                  type="text"
                  id="field-city"
                  name="city"
                  required
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  onBlur={() => handleBlur('city')}
                  placeholder="e.g. Vrindavan, Mathura, Delhi"
                  className={`w-full px-3.5 py-2 rounded-xl border-2 text-sm sm:text-base text-maroon-950 placeholder-gray-400 bg-[#FFFDF9] transition-all focus:outline-none ${
                    errors.city && touched.city
                      ? 'border-red-500 ring-1 ring-red-200'
                      : 'border-saffron-300 focus:border-saffron-600'
                  }`}
                />
                {errors.city && touched.city && (
                  <p className="mt-1 text-xs text-red-600">{errors.city}</p>
                )}
              </div>
            </div>
          </div>

          {/* Row 3: People, DT (From Date), and TO DT (To Date) - Spacious & Non-overlapping */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 bg-amber-50/40 p-3 rounded-2xl border border-saffron-200">
            {/* People */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5">
              <label htmlFor="field-people" className="font-serif font-bold text-xs sm:text-sm text-maroon-950 shrink-0">
                People :
              </label>
              <input
                type="number"
                id="field-people"
                name="people"
                min="1"
                required
                value={formData.people}
                onChange={(e) => handleChange('people', e.target.value)}
                onBlur={() => handleBlur('people')}
                placeholder="4"
                className={`w-full px-3 py-2 rounded-xl border-2 text-sm text-maroon-950 bg-[#FFFDF9] transition-all focus:outline-none ${
                  errors.people && touched.people
                    ? 'border-red-500 ring-1 ring-red-200'
                    : 'border-saffron-300 focus:border-saffron-600'
                }`}
              />
            </div>

            {/* DT (From Date) */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5">
              <label htmlFor="field-fromDate" className="font-serif font-bold text-xs sm:text-sm text-maroon-950 shrink-0">
                DT :
              </label>
              <input
                type="date"
                id="field-fromDate"
                name="fromDate"
                required
                value={formData.fromDate}
                onChange={(e) => handleChange('fromDate', e.target.value)}
                onBlur={() => handleBlur('fromDate')}
                className={`w-full px-3 py-2 rounded-xl border-2 text-xs sm:text-sm text-maroon-950 bg-[#FFFDF9] transition-all focus:outline-none ${
                  errors.fromDate && touched.fromDate
                    ? 'border-red-500 ring-1 ring-red-200'
                    : 'border-saffron-300 focus:border-saffron-600'
                }`}
              />
            </div>

            {/* TO DT (To Date) */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5">
              <label htmlFor="field-toDate" className="font-serif font-bold text-xs sm:text-sm text-maroon-950 shrink-0">
                TO DT :
              </label>
              <input
                type="date"
                id="field-toDate"
                name="toDate"
                required
                min={formData.fromDate}
                value={formData.toDate}
                onChange={(e) => handleChange('toDate', e.target.value)}
                onBlur={() => handleBlur('toDate')}
                className={`w-full px-3 py-2 rounded-xl border-2 text-xs sm:text-sm text-maroon-950 bg-[#FFFDF9] transition-all focus:outline-none ${
                  errors.toDate && touched.toDate
                    ? 'border-red-500 ring-1 ring-red-200'
                    : 'border-saffron-300 focus:border-saffron-600'
                }`}
              />
            </div>
          </div>

          {/* Row 4: Add Ons / Extras */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <label htmlFor="field-extras" className="font-serif font-bold text-xs sm:text-sm text-maroon-950 sm:w-28 shrink-0">
              Add Ons / Extras :
            </label>
            <input
              type="text"
              id="field-extras"
              name="extras"
              value={formData.extras}
              onChange={(e) => handleChange('extras', e.target.value)}
              placeholder="Special garland, wheelchair, etc."
              className="flex-1 w-full px-3.5 py-2 rounded-xl border-2 border-saffron-300 text-sm sm:text-base text-maroon-950 placeholder-gray-400 bg-[#FFFDF9] transition-all focus:outline-none focus:border-saffron-600"
            />
          </div>

          {/* Row 5: MEAL REQUIREMENT Box (Cleanly Framed, No Overlap) */}
          <div className="mt-4 rounded-2xl border-2 border-maroon-950 bg-gradient-to-b from-[#FFFDF8] to-[#FFF3D6] overflow-hidden shadow-sm relative">
            
            {/* Box Title Banner */}
            <div className="bg-gradient-to-r from-maroon-950 via-maroon-900 to-maroon-950 text-amber-200 font-serif font-bold text-xs sm:text-sm px-4 py-2.5 text-center tracking-wider uppercase border-b-2 border-saffron-400">
              Meal Requirement (Pure Sattvic Prasadam)
            </div>

            {/* Meal Checkbox Options */}
            <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {MEAL_OPTIONS.map((meal) => {
                const isChecked = formData.meals.includes(meal.label);
                return (
                  <div 
                    key={meal.id} 
                    className={`p-3 rounded-xl border-2 transition-all flex flex-col gap-2 ${
                      isChecked 
                        ? 'bg-amber-100/90 border-saffron-600 shadow-xs' 
                        : 'bg-white/80 border-saffron-300 hover:border-saffron-400'
                    }`}
                  >
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleMeal(meal.label)}
                        className="w-4 h-4 rounded text-saffron-600 accent-saffron-600 cursor-pointer"
                      />
                      <span className={`text-sm font-serif ${isChecked ? 'font-black text-maroon-950' : 'font-bold text-maroon-900'}`}>
                        {meal.label}
                      </span>
                    </label>
                    <input
                      type="text"
                      placeholder="Qty / notes"
                      value={formData.mealCounts[meal.label] || ''}
                      onChange={(e) => handleMealCountChange(meal.label, e.target.value)}
                      className="w-full px-2.5 py-1 text-xs rounded-lg border border-saffron-400 bg-white focus:outline-none focus:border-saffron-600"
                    />
                  </div>
                );
              })}
            </div>

            {/* Total Selected Meals Count */}
            <div className="px-4 py-2.5 bg-gradient-to-r from-saffron-100 via-amber-100 to-saffron-100 border-t-2 border-saffron-300 text-xs flex flex-wrap items-center justify-between gap-2 font-serif">
              <span className="font-bold text-maroon-950">Total Meals Selected :</span>
              <div className="font-mono font-black text-saffron-950 text-xs sm:text-sm flex flex-wrap items-center gap-1.5">
                {formData.meals.length > 0 ? (
                  formData.meals.map((m) => {
                    const count = formData.mealCounts?.[m]?.trim();
                    return (
                      <span key={m} className="bg-white/90 border border-saffron-400 px-2.5 py-0.5 rounded-md text-maroon-950 shadow-xs">
                        {m}{count ? ` (${count})` : ''}
                      </span>
                    );
                  })
                ) : (
                  <span className="text-maroon-900/60 font-medium font-sans">None Selected</span>
                )}
              </div>
            </div>

          </div>

        </div>
      </FormSection>

      {/* ========================================================================= */}
      {/* SECTION 2: 2. SERVICES / PACKAGE (Please Select) */}
      {/* ========================================================================= */}
      <FormSection
        number="2"
        title="SERVICES / PACKAGE (Please Select)"
        subtitle="Accommodation, Transport, Yatra & Puja Seva"
      >
        <div className="space-y-4">
          
          {/* Grid of services */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-2.5">
            {SERVICES_LIST.map((srv) => {
              const isSelected = formData.services.includes(srv.label);
              return (
                <label
                  key={srv.id}
                  className={`p-2.5 rounded-xl border-2 transition-all cursor-pointer select-none flex items-center gap-2 min-h-[46px] ${
                    isSelected
                      ? 'bg-amber-100/80 border-saffron-600 shadow-xs text-maroon-950 font-bold ring-1 ring-saffron-500/40'
                      : 'bg-[#FFFDF9] hover:bg-amber-50/50 border-saffron-200 hover:border-saffron-300 text-maroon-900/90'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleService(srv.label)}
                    className="w-4 h-4 rounded text-saffron-600 accent-saffron-600 cursor-pointer shrink-0"
                  />
                  <span className="text-xs sm:text-[13px] leading-tight font-serif">
                    {srv.label}
                  </span>
                </label>
              );
            })}
          </div>

          {/* Other Service Row */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-1">
            <label htmlFor="field-other-service" className="font-serif font-bold text-xs sm:text-sm text-maroon-950 sm:w-20 shrink-0">
              Other :
            </label>
            <input
              type="text"
              id="field-other-service"
              value={formData.otherService}
              onChange={(e) => handleChange('otherService', e.target.value)}
              placeholder="Please specify any other service..."
              className="flex-1 w-full px-3.5 py-2 rounded-xl border-2 border-saffron-300 text-sm text-maroon-950 placeholder-gray-400 bg-[#FFFDF9] transition-all focus:outline-none focus:border-saffron-600"
            />
          </div>

          {/* ========================================================================= */}
          {/* ANIMATED SPIRITUAL GUIDE SECTION */}
          {/* ========================================================================= */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 via-[#FFFDF9] to-orange-50 border-2 border-amber-400 shadow-sm transition-all duration-300">
            
            {/* Guide Question Prompt */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-amber-600 text-base">🚩</span>
                  <h4 className="font-serif font-black text-sm sm:text-base text-maroon-950">
                    Spiritual & Yatra Guide Service
                  </h4>
                </div>
                <p className="text-xs font-bold text-maroon-800/80 mt-0.5">
                  Do you require an experienced spiritual guide for Braj Dham Darshan?
                </p>
              </div>

              {/* Animated Yes / No Pill Switcher */}
              <div className="inline-flex rounded-xl p-1 bg-amber-200/70 border border-amber-400 shrink-0 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, guideRequired: false, guideLanguage: '' })}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-serif font-bold transition-all ${
                    !formData.guideRequired
                      ? 'bg-white text-maroon-950 shadow-md scale-105'
                      : 'text-maroon-900/70 hover:text-maroon-950'
                  }`}
                >
                  ✕ No
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, guideRequired: true, guideLanguage: formData.guideLanguage || 'Hindi' })}
                  className={`px-4 py-1.5 rounded-lg text-xs font-serif font-bold transition-all flex items-center gap-1 ${
                    formData.guideRequired
                      ? 'bg-gradient-to-r from-saffron-600 to-amber-600 text-white shadow-md scale-105'
                      : 'text-maroon-900/70 hover:text-maroon-950'
                  }`}
                >
                  <span>✓ Yes, Guide Required</span>
                </button>
              </div>
            </div>

            {/* Smooth Animated Language Options Panel (Shown only when Yes is selected) */}
            {formData.guideRequired && (
              <div className="mt-4 pt-3.5 border-t border-amber-300/80 animate-fadeIn space-y-3">
                <p className="text-xs font-bold text-maroon-950 uppercase tracking-wider">
                  Select Preferred Guide Language :
                </p>

                <div className="flex flex-wrap items-center gap-2.5">
                  {GUIDE_LANGUAGES.map((lang) => {
                    const isLangActive = formData.guideLanguage === lang;
                    return (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => setFormData({ ...formData, guideLanguage: lang })}
                        className={`px-4 py-1.5 rounded-xl border-2 text-xs sm:text-sm font-serif font-bold transition-all transform active:scale-95 flex items-center gap-1.5 cursor-pointer ${
                          isLangActive
                            ? 'bg-gradient-to-r from-saffron-600 to-amber-600 text-white border-saffron-700 shadow-md scale-105'
                            : 'bg-white text-maroon-950 border-amber-300 hover:border-amber-500 hover:bg-amber-50'
                        }`}
                      >
                        {isLangActive && <span>✓</span>}
                        <span>{lang}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Language Input */}
                {formData.guideLanguage === 'Other' && (
                  <div className="pt-2 animate-fadeIn">
                    <input
                      type="text"
                      value={formData.customLanguage}
                      onChange={(e) => setFormData({ ...formData, customLanguage: e.target.value })}
                      placeholder="Specify your language (e.g. Gujarati, Marathi, Telugu, Tamil)"
                      className="w-full sm:max-w-md px-3.5 py-2 rounded-xl border-2 border-saffron-400 text-xs sm:text-sm text-maroon-950 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-saffron-500"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </FormSection>

      {/* ========================================================================= */}
      {/* SECTION 3: Special Instructions */}
      {/* ========================================================================= */}
      <FormSection
        number="3"
        title="Special Instructions"
        subtitle="Dietary notes (pure satvik / no onion garlic), arrival timing & seva notes"
      >
        <div>
          <label htmlFor="field-instructions" className="block text-xs font-bold uppercase tracking-wider text-maroon-900 mb-1.5">
            Any special instructions :
          </label>
          <textarea
            id="field-instructions"
            name="specialInstructions"
            rows="3"
            value={formData.specialInstructions}
            onChange={(e) => handleChange('specialInstructions', e.target.value)}
            placeholder="e.g. Arriving at Mathura Cantt Railway station at 6:30 AM, Jain food/no onion garlic strictly, ground floor rooms preferred..."
            className="w-full px-4 py-2.5 rounded-xl border-2 border-saffron-300 text-sm sm:text-base text-maroon-950 placeholder-gray-400 bg-[#FFFDF9] transition-all focus:outline-none focus:border-saffron-600 focus:ring-1 focus:ring-saffron-500/30"
          ></textarea>
        </div>
      </FormSection>

      {/* ========================================================================= */}
      {/* SUBMIT BUTTON SECTION */}
      {/* ========================================================================= */}
      <div className="pt-2">
        <AnimatedSubmitButton
          isSubmitting={isSubmitting}
          progress={progress}
          disabled={isSubmitting}
        />
      </div>

      {/* ========================================================================= */}
      {/* SUCCESS EXPERIENCE MODAL */}
      {/* ========================================================================= */}
      <SuccessOverlay
        isOpen={showSuccessOverlay}
        bookingId={generatedBookingId}
        redirectUrl={redirectUrl}
        onManualRedirect={() => {
          if (redirectUrl) window.location.href = redirectUrl;
        }}
      />
    </form>
  );
}
