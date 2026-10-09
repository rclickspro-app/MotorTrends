/**
 * Motor Trends Auto Group Firebase Cloud Integration
 * Powered by Firebase Realtime Database / Firestore & Firebase Authentication
 * 100% Free Tier (No Blaze plan required)
 */

const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyDzX6dYYoa46PTR1yK2a-nu3SJgQ8RyiW4",
  authDomain: "motor-trends.firebaseapp.com",
  databaseURL: "https://motor-trends-default-rtdb.firebaseio.com",
  projectId: "motor-trends",
  storageBucket: "motor-trends.firebasestorage.app",
  messagingSenderId: "818376550814",
  appId: "1:818376550814:web:b95241af2fc4512bbece8f",
  measurementId: "G-SJEW350XQJ"
};

let firebaseConfig = { ...DEFAULT_FIREBASE_CONFIG };
try {
  const custom = localStorage.getItem('motortrends_custom_fb_config');
  if (custom) {
    const parsed = JSON.parse(custom);
    if (parsed && parsed.apiKey) {
      firebaseConfig = { ...DEFAULT_FIREBASE_CONFIG, ...parsed };
    }
  }
} catch (e) {}

let fbApp = null;
let fbAuth = null;
let fbDb = null;
let isFirebaseReady = false;

// Initialize Firebase SDK
function initFirebaseApp() {
  try {
    if (typeof firebase !== 'undefined') {
      if (!firebase.apps.length) {
        fbApp = firebase.initializeApp(firebaseConfig);
      } else {
        fbApp = firebase.app();
      }
      fbAuth = firebase.auth();
      fbDb = firebase.database();
      isFirebaseReady = true;
      console.log('🔥 Firebase initialized successfully for Motor Trends Auto Group');
    } else {
      console.warn('Firebase SDK script not loaded yet.');
    }
  } catch (err) {
    console.error('Firebase initialization error:', err);
  }
}

// Auto-initialize if Firebase SDK is already available
if (typeof firebase !== 'undefined') {
  initFirebaseApp();
}

// Subscribe to real-time vehicles database changes
function subscribeToMarketplaceVehicles(callback) {
  if (typeof firebase === 'undefined' || !fbDb) {
    initFirebaseApp();
  }

  if (fbDb) {
    const vehiclesRef = fbDb.ref('vehicles');
    vehiclesRef.on('value', (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const cloudVehicles = Object.values(data);
        const stored = (typeof getStoredVehicles === 'function') ? getStoredVehicles() : [];
        const mergedMap = new Map();
        // First add stored local vehicles
        stored.forEach(v => { if (v && v.id) mergedMap.set(v.id, v); });
        // Then add / override with latest cloud data
        cloudVehicles.forEach(v => { if (v && v.id) mergedMap.set(v.id, v); });
        const finalList = Array.from(mergedMap.values());

        saveLocalCacheVehicles(finalList);
        if (callback) callback(finalList);
      } else {
        // If cloud database is empty, seed with initial catalog
        seedFirebaseInitialData();
        const currentData = (typeof getStoredVehicles === 'function') ? getStoredVehicles() : DEFAULT_VEHICLES_DATA;
        if (callback) callback(currentData);
      }
    }, (error) => {
      console.warn('Firebase Realtime Database read failed, falling back to local storage:', error);
      if (callback) callback((typeof getStoredVehicles === 'function') ? getStoredVehicles() : DEFAULT_VEHICLES_DATA);
    });
  } else {
    if (callback) callback((typeof getStoredVehicles === 'function') ? getStoredVehicles() : DEFAULT_VEHICLES_DATA);
  }
}

// Seed Initial default catalog to Firebase
function seedFirebaseInitialData() {
  if (!fbDb) initFirebaseApp();
  if (!fbDb) return;
  const source = (typeof VEHICLES_DATA !== 'undefined' && VEHICLES_DATA.length > 0)
    ? VEHICLES_DATA
    : ((typeof getStoredVehicles === 'function') ? getStoredVehicles() : DEFAULT_VEHICLES_DATA);
  const updates = {};
  source.forEach(v => {
    if (v && v.id) {
      updates['vehicles/' + v.id] = v;
    }
  });
  fbDb.ref().update(updates)
    .then(() => console.log('✅ Vehicles catalog synced to Firebase cloud'))
    .catch(e => console.warn('Could not seed Firebase:', e));
}

// Save or Update a single vehicle in Firebase
async function saveVehicleToFirebase(vehicleObj) {
  if (!vehicleObj || !vehicleObj.id) return { success: false, error: 'Invalid vehicle' };

  // Ensure local storage cache has it immediately
  if (typeof saveVehiclesData === 'function' && typeof VEHICLES_DATA !== 'undefined') {
    const existingIndex = VEHICLES_DATA.findIndex(v => v.id === vehicleObj.id);
    if (existingIndex > -1) {
      VEHICLES_DATA[existingIndex] = vehicleObj;
    } else {
      VEHICLES_DATA.unshift(vehicleObj);
    }
    saveVehiclesData(VEHICLES_DATA);
  }

  if (!fbDb) initFirebaseApp();
  if (fbDb) {
    try {
      await fbDb.ref('vehicles/' + vehicleObj.id).set(vehicleObj);
      return { success: true };
    } catch (err) {
      console.error('Firebase save error:', err);
      return { success: false, error: err.message };
    }
  }
  return { success: false, error: 'Firebase not connected' };
}

// Delete a vehicle from Firebase
async function deleteVehicleFromFirebase(vehicleId) {
  if (!vehicleId) return { success: false, error: 'Invalid vehicle ID' };

  if (typeof saveVehiclesData === 'function' && typeof VEHICLES_DATA !== 'undefined') {
    const updated = VEHICLES_DATA.filter(v => v.id !== vehicleId);
    saveVehiclesData(updated);
  }

  if (!fbDb) initFirebaseApp();
  if (fbDb) {
    try {
      await fbDb.ref('vehicles/' + vehicleId).remove();
      return { success: true };
    } catch (err) {
      console.error('Firebase delete error:', err);
      return { success: false, error: err.message };
    }
  }
  return { success: false, error: 'Firebase not connected' };
}

// Reset all vehicles in Firebase to defaults
async function resetFirebaseToDefaults() {
  if (!fbDb) initFirebaseApp();
  if (fbDb) {
    try {
      await fbDb.ref('vehicles').remove();
      seedFirebaseInitialData();
      return { success: true };
    } catch (err) {
      console.error('Firebase reset error:', err);
      return { success: false, error: err.message };
    }
  }
  return { success: false, error: 'Firebase not connected' };
}

function saveLocalCacheVehicles(data) {
  const items = Array.isArray(data) ? [...data] : [];
  if (typeof localStorage !== 'undefined') {
    const key = (typeof STORAGE_KEY_VEHICLES !== 'undefined') ? STORAGE_KEY_VEHICLES : 'motortrends_vehicles_db_v3';
    localStorage.setItem(key, JSON.stringify(items));
    localStorage.setItem('motortrends_vehicles_db', JSON.stringify(items));
  }
  if (typeof VEHICLES_DATA !== 'undefined' && data !== VEHICLES_DATA) {
    VEHICLES_DATA.length = 0;
    VEHICLES_DATA.push(...items);
  }
}
