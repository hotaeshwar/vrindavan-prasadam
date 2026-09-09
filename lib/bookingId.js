/**
 * Vrindavan Prasadam Network - Booking ID Generator
 * 
 * Format: HK-MM-YYYY-DD-001
 * Example: HK-09-2026-08-001
 */

/**
 * Client & Server safe booking ID generator
 * Generates sequential formatted booking ID: HK-MM-YYYY-DD-XXX
 */
export function generateClientBookingId() {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  const dd = String(now.getDate()).padStart(2, '0');
  const dateKey = `${mm}-${yyyy}-${dd}`;
  
  let nextCount = 1;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const storageKey = `vpn_booking_seq_${dateKey}`;
      const savedCount = parseInt(localStorage.getItem(storageKey) || '0', 10);
      nextCount = savedCount + 1;
      localStorage.setItem(storageKey, String(nextCount));
    } else {
      nextCount = Math.floor(1 + Math.random() * 99);
    }
  } catch {
    nextCount = Math.floor(1 + Math.random() * 99);
  }

  const sequenceStr = String(nextCount).padStart(3, '0');
  return `HK-${dateKey}-${sequenceStr}`;
}

export async function generateBookingId() {
  return generateClientBookingId();
}
