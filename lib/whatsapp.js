/**
 * Vrindavan Prasadam Network - WhatsApp Integration Service
 * Target Number: 918171637425
 */

export const WHATSAPP_PHONE = '918171637425';

/**
 * Formats a Date object or YYYY-MM-DD string into DD/MM/YYYY
 * @param {string} dateStr 
 * @returns {string}
 */
export function formatDateDDMMYYYY(dateStr) {
  if (!dateStr) return 'N/A';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  }
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

/**
 * Builds the structured WhatsApp message with ZERO emojis (100% clean plain text)
 * @param {Object} formData
 * @param {string} bookingId
 * @returns {string}
 */
export function buildWhatsAppMessage(formData, bookingId) {
  const name = formData.name?.trim() || 'N/A';
  const mobile = formData.mobile?.trim() || 'N/A';
  const address = formData.address?.trim() || 'N/A';
  const city = formData.city?.trim() || 'N/A';
  
  const people = formData.people || '1';
  const fromDate = formatDateDDMMYYYY(formData.fromDate);
  const toDate = formatDateDDMMYYYY(formData.toDate);
  
  const mealsList = Array.isArray(formData.meals) && formData.meals.length > 0 
    ? formData.meals.map(m => `• ${m}`).join('\n') 
    : (formData.meals || 'None');
    
  const servicesList = Array.isArray(formData.services) && formData.services.length > 0 
    ? formData.services.map(s => `• ${s}`).join('\n') 
    : (formData.services || 'None');
    
  const guideRequired = formData.guideRequired ? 'Yes' : 'No';
  const guideLang = formData.guideRequired 
    ? (formData.guideLanguage || 'Hindi') 
    : 'Not required';

  const extras = formData.extras?.trim() || 'None';
  const specialInstructions = formData.specialInstructions?.trim() || 'None';

  const divider = '----------------------------------------';

  const messageLines = [
    '*HARE KRISHNA*',
    '',
    '*VRINDAVAN PRASADAM NETWORK*',
    '',
    `*BOOKING ID: ${bookingId}*`,
    '',
    '*NEW ADVANCE BOOKING REQUEST*',
    '',
    divider,
    '',
    '*CUSTOMER INFORMATION*',
    `Name: ${name}`,
    `Mobile: ${mobile}`,
    `Address: ${address}`,
    `City: ${city}`,
    '',
    divider,
    '',
    '*BOOKING DETAILS*',
    `Number of People: ${people}`,
    `From Date: ${fromDate}`,
    `To Date: ${toDate}`,
    '',
    divider,
    '',
    '*MEALS REQUIRED*',
    mealsList,
    '',
    divider,
    '',
    '*SERVICES REQUIRED*',
    servicesList,
    '',
    divider,
    '',
    '*GUIDE DETAILS*',
    `Guide Required: ${guideRequired}`,
    ...(formData.guideRequired ? [`Language: ${guideLang}`] : []),
    '',
    divider,
    '',
    '*ADD-ONS / EXTRAS*',
    extras,
    '',
    divider,
    '',
    '*SPECIAL INSTRUCTIONS*',
    specialInstructions,
    '',
    divider,
    '',
    `Booking ID: *${bookingId}*`,
    '',
    'Hare Krishna',
    'Vrindavan Prasadam Network'
  ];

  return messageLines.join('\n');
}

/**
 * Creates the complete wa.me link with encoded URI text
 * @param {Object} formData 
 * @param {string} bookingId 
 * @returns {string}
 */
export function getWhatsAppRedirectUrl(formData, bookingId) {
  const message = buildWhatsAppMessage(formData, bookingId);
  return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
}
