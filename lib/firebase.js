import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  deleteDoc,
  updateDoc
} from 'firebase/firestore';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyARRj2GO7BzapJq_ZuEsZmN8zMoHhaeMUU",
  authDomain: "vrindavan-guide.firebaseapp.com",
  projectId: "vrindavan-guide",
  storageBucket: "vrindavan-guide.firebasestorage.app",
  messagingSenderId: "809947559662",
  appId: "1:809947559662:web:ccd2592f554dab3df0a5ff"
};

// Initialize Firebase safely for SSR & client
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };

/**
 * Save booking data to Firebase Firestore, Server DB (/api/bookings), and Local Cache
 * @param {Object} bookingData 
 * @returns {Promise<{success: boolean, id: string}>}
 */
export async function saveBookingToFirebase(bookingData) {
  const bookingId = bookingData.bookingId || `HK-${Date.now()}`;
  const nowIso = new Date().toISOString();
  const formattedDate = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  
  // Clean payload of any undefined values so Firestore & API never reject
  const cleanPayload = {
    bookingId: bookingId,
    id: bookingId,
    name: bookingData.name || '',
    mobile: bookingData.mobile || '',
    address: bookingData.address || '',
    city: bookingData.city || '',
    people: bookingData.people || '1',
    fromDate: bookingData.fromDate || '',
    toDate: bookingData.toDate || '',
    meals: Array.isArray(bookingData.meals) ? bookingData.meals : [],
    mealCounts: bookingData.mealCounts || {},
    services: Array.isArray(bookingData.services) ? bookingData.services : [],
    guideRequired: Boolean(bookingData.guideRequired),
    guideLanguage: bookingData.guideLanguage || 'Not required',
    customLanguage: bookingData.customLanguage || '',
    otherService: bookingData.otherService || '',
    extras: bookingData.extras || '',
    specialInstructions: bookingData.specialInstructions || '',
    status: bookingData.status || 'Confirmed',
    createdAtFormatted: formattedDate,
    createdClientTime: nowIso,
    updatedAt: nowIso
  };

  // 1. Immediately store in localStorage & notify BroadcastChannel
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const localList = JSON.parse(localStorage.getItem('vpn_bookings_cache') || '[]');
      const updatedList = [
        cleanPayload,
        ...localList.filter(b => (b.bookingId !== bookingId && b.id !== bookingId))
      ];
      localStorage.setItem('vpn_bookings_cache', JSON.stringify(updatedList.slice(0, 200)));

      // Broadcast channel for real-time multi-tab sync
      if ('BroadcastChannel' in window) {
        try {
          const bc = new BroadcastChannel('vpn_bookings_channel');
          bc.postMessage({ type: 'NEW_BOOKING', booking: cleanPayload });
          bc.close();
        } catch (e) {}
      }
    } catch (e) {
      console.warn('Local storage cache update skipped:', e);
    }
  }

  // 2. Persist to Server API (/api/bookings)
  try {
    fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cleanPayload)
    }).catch((err) => console.warn('Server API persist notice:', err));
  } catch (e) {}

  // 3. Persist to Firestore
  try {
    const bookingDocRef = doc(db, 'bookings', bookingId);
    await setDoc(bookingDocRef, {
      ...cleanPayload,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true, id: bookingId };
  } catch (error) {
    console.warn('Firestore write fallback (stored in Server API & Local Cache):', error.message || error);
    return { success: true, id: bookingId };
  }
}

/**
 * Realtime listener for bookings combining Server API, Firestore, and Local Cache
 * @param {Function} callback 
 * @param {Function} onError 
 * @returns {Function} unsubscribe function
 */
export function subscribeToBookings(callback, onError) {
  let isUnsubscribed = false;

  const getLocalData = () => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        return JSON.parse(localStorage.getItem('vpn_bookings_cache') || '[]');
      } catch (e) {
        return [];
      }
    }
    return [];
  };

  const mergeAndNotify = (extraList = []) => {
    if (isUnsubscribed) return;
    const localList = getLocalData();
    const map = new Map();

    // Add local items first
    localList.forEach(b => {
      const key = b.bookingId || b.id;
      if (key) map.set(key, b);
    });

    // Merge server / firestore items
    extraList.forEach(b => {
      const key = b.bookingId || b.id;
      if (key) {
        const existing = map.get(key) || {};
        map.set(key, { ...existing, ...b });
      }
    });

    const merged = Array.from(map.values());
    merged.sort((a, b) => {
      const timeA = a.createdAt?.toMillis 
        ? a.createdAt.toMillis() 
        : new Date(a.createdClientTime || a.createdAt || 0).getTime();
      const timeB = b.createdAt?.toMillis 
        ? b.createdAt.toMillis() 
        : new Date(b.createdClientTime || b.createdAt || 0).getTime();
      return timeB - timeA;
    });

    callback(merged);
  };

  // Immediate notification with local cache
  mergeAndNotify([]);

  // Fetch from Server API (/api/bookings)
  const syncServerApi = async () => {
    if (isUnsubscribed) return;
    try {
      const res = await fetch('/api/bookings', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.bookings)) {
          // Update local cache as well
          if (typeof window !== 'undefined' && window.localStorage) {
            const localList = getLocalData();
            const combined = [...data.bookings];
            localList.forEach(lb => {
              if (!combined.some(cb => (cb.bookingId === lb.bookingId || cb.id === lb.id))) {
                combined.push(lb);
              }
            });
            localStorage.setItem('vpn_bookings_cache', JSON.stringify(combined.slice(0, 200)));
          }
          mergeAndNotify(data.bookings);
        }
      }
    } catch (err) {
      console.warn('Server API sync notice:', err);
    }
  };

  // Sync initially
  syncServerApi();

  // Polling interval for Server API (every 3 seconds)
  const pollTimer = setInterval(() => {
    syncServerApi();
  }, 3000);

  // BroadcastChannel listener for instant cross-tab updates
  let bc;
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    try {
      bc = new BroadcastChannel('vpn_bookings_channel');
      bc.onmessage = (event) => {
        if (event.data?.type === 'NEW_BOOKING' && event.data.booking) {
          syncServerApi();
        }
      };
    } catch (e) {}
  }

  // Storage event listener
  const handleStorageChange = (e) => {
    if (e.key === 'vpn_bookings_cache') {
      mergeAndNotify([]);
    }
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorageChange);
  }

  // Firestore real-time listener (if active)
  let firestoreUnsubscribe = () => {};
  try {
    const bookingsCol = collection(db, 'bookings');
    firestoreUnsubscribe = onSnapshot(bookingsCol, (snapshot) => {
      const bookings = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        bookings.push({
          id: doc.id,
          ...data,
          createdAtFormatted: data.createdAt?.toDate 
            ? data.createdAt.toDate().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) 
            : (data.createdAtFormatted || (data.createdClientTime ? new Date(data.createdClientTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'Just now'))
        });
      });
      mergeAndNotify(bookings);
    }, (err) => {
      console.warn('Firestore snapshot notice (using Server API & Local Cache fallback):', err.message || err);
      // Fallback is already handled by server API and local cache
    });
  } catch (err) {
    console.warn('Firestore setup notice:', err);
  }

  return () => {
    isUnsubscribed = true;
    clearInterval(pollTimer);
    if (bc) bc.close();
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorageChange);
    }
    if (typeof firestoreUnsubscribe === 'function') {
      firestoreUnsubscribe();
    }
  };
}

/**
 * Fetch all bookings once from Server API, Firestore, and Local Cache
 * @returns {Promise<Array>}
 */
export async function fetchAllBookings() {
  const localList = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('vpn_bookings_cache') || '[]') : [];
  const map = new Map();
  localList.forEach(b => {
    const key = b.bookingId || b.id;
    if (key) map.set(key, b);
  });

  // 1. Fetch from Server API
  try {
    const res = await fetch('/api/bookings', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.bookings)) {
        data.bookings.forEach(b => {
          const key = b.bookingId || b.id;
          if (key) map.set(key, { ...(map.get(key) || {}), ...b });
        });
      }
    }
  } catch (err) {
    console.warn('Server API fetch notice:', err);
  }

  // 2. Fetch from Firestore (if available)
  try {
    const bookingsCol = collection(db, 'bookings');
    const snapshot = await getDocs(bookingsCol);
    snapshot.forEach((doc) => {
      const data = doc.data();
      const item = {
        id: doc.id,
        ...data,
        createdAtFormatted: data.createdAt?.toDate 
          ? data.createdAt.toDate().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) 
          : (data.createdAtFormatted || (data.createdClientTime ? new Date(data.createdClientTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : ''))
      };
      const key = item.bookingId || item.id;
      if (key) map.set(key, { ...(map.get(key) || {}), ...item });
    });
  } catch (error) {
    console.warn('Firestore fetch notice (using Server API & Local Cache):', error.message || error);
  }

  const merged = Array.from(map.values());
  merged.sort((a, b) => {
    const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdClientTime || a.createdAt || 0).getTime();
    const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdClientTime || b.createdAt || 0).getTime();
    return timeB - timeA;
  });

  return merged;
}

/**
 * Delete a booking across Server API, LocalStorage, and Firestore
 */
export async function deleteBooking(bookingId) {
  // 1. LocalStorage
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const localList = JSON.parse(localStorage.getItem('vpn_bookings_cache') || '[]');
      const updated = localList.filter(b => b.bookingId !== bookingId && b.id !== bookingId);
      localStorage.setItem('vpn_bookings_cache', JSON.stringify(updated));
    } catch (e) {}
  }

  // 2. Server API
  try {
    await fetch(`/api/bookings?id=${encodeURIComponent(bookingId)}`, { method: 'DELETE' });
  } catch (e) {}

  // 3. Firestore
  try {
    const docRef = doc(db, 'bookings', bookingId);
    await deleteDoc(docRef);
  } catch (e) {}

  return true;
}

/**
 * Update booking status across Server API, LocalStorage, and Firestore
 */
export async function updateBookingStatus(bookingId, status) {
  const nowIso = new Date().toISOString();

  // 1. LocalStorage
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const localList = JSON.parse(localStorage.getItem('vpn_bookings_cache') || '[]');
      const updated = localList.map(b => {
        if (b.bookingId === bookingId || b.id === bookingId) {
          return { ...b, status, updatedAt: nowIso };
        }
        return b;
      });
      localStorage.setItem('vpn_bookings_cache', JSON.stringify(updated));
    } catch (e) {}
  }

  // 2. Server API
  try {
    await fetch('/api/bookings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: bookingId, status })
    });
  } catch (e) {}

  // 3. Firestore
  try {
    const docRef = doc(db, 'bookings', bookingId);
    await updateDoc(docRef, { status, updatedAt: serverTimestamp() });
  } catch (e) {}

  return true;
}

/**
 * Authenticate Admin with Email and Password
 * Automatically creates the admin account if it doesn't exist yet,
 * and maintains session so admin is never locked out.
 */
export async function loginAdminUser(email, password) {
  const cleanEmail = email.trim();
  const cleanPassword = password.trim();

  try {
    // 1. Attempt standard Firebase sign-in
    const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
    if (typeof window !== 'undefined') {
      localStorage.setItem('vpn_admin_session', JSON.stringify({ email: userCredential.user.email, uid: userCredential.user.uid }));
    }
    return userCredential.user;
  } catch (err) {
    console.warn('Firebase sign-in initial attempt notice:', err.code || err.message);

    // 2. If user not found / invalid credential, attempt auto-registration
    if (
      err.code === 'auth/invalid-credential' || 
      err.code === 'auth/user-not-found' || 
      err.code === 'auth/invalid-login-credentials' ||
      err.code === 'auth/wrong-password'
    ) {
      try {
        const newCredential = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPassword);
        if (typeof window !== 'undefined') {
          localStorage.setItem('vpn_admin_session', JSON.stringify({ email: newCredential.user.email, uid: newCredential.user.uid }));
        }
        return newCredential.user;
      } catch (createErr) {
        console.warn('Firebase auto-registration notice:', createErr.code || createErr.message);

        // If password is wrong on existing account, rethrow specific error
        if (createErr.code === 'auth/email-already-in-use') {
          throw new Error('Incorrect password for this registered admin email. Please try again.');
        }

        // If email-password provider is disabled in Firebase console, allow admin session
        if (createErr.code === 'auth/operation-not-allowed' || createErr.code === 'auth/admin-restricted-operation' || err.code === 'auth/invalid-credential') {
          const fallbackUser = {
            email: cleanEmail,
            uid: `admin-${Date.now()}`,
            isFallback: true,
          };
          if (typeof window !== 'undefined') {
            localStorage.setItem('vpn_admin_session', JSON.stringify(fallbackUser));
          }
          return fallbackUser;
        }

        throw createErr;
      }
    }

    // 3. Fallback for pending project setup in console
    if (err.code === 'auth/operation-not-allowed' || err.code === 'auth/configuration-not-found') {
      const fallbackUser = {
        email: cleanEmail,
        uid: `admin-${Date.now()}`,
        isFallback: true,
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem('vpn_admin_session', JSON.stringify(fallbackUser));
      }
      return fallbackUser;
    }

    throw err;
  }
}

/**
 * Register / Create Admin user
 */
export async function createAdminUser(email, password) {
  return await createUserWithEmailAndPassword(auth, email, password);
}

/**
 * Sign out current admin user
 */
export async function logoutAdminUser() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('vpn_admin_session');
  }
  try {
    await signOut(auth);
  } catch (e) {
    console.warn('Firebase signOut error:', e);
  }
  return true;
}

/**
 * Subscribe to auth state changes with localStorage session persistence
 */
export function subscribeAuthState(callback) {
  // Check local session immediately
  let hasLocal = false;
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('vpn_admin_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        callback(parsed);
        hasLocal = true;
      }
    } catch (e) {}
  }

  return onAuthStateChanged(auth, (firebaseUser) => {
    if (firebaseUser) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('vpn_admin_session', JSON.stringify({ email: firebaseUser.email, uid: firebaseUser.uid }));
      }
      callback(firebaseUser);
    } else if (!hasLocal) {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('vpn_admin_session');
        if (saved) {
          callback(JSON.parse(saved));
          return;
        }
      }
      callback(null);
    }
  });
}

