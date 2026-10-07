/**
 * Silver Motors Firebase Cloud Integration
 * Powered by Firebase Realtime Database / Firestore & Firebase Authentication
 * 100% Free Tier (No Blaze plan required)
 */

const firebaseConfig = {
  apiKey: "AIzaSyDxEBLM519ABP8y9YK0xQsywKiQr0GChTM",
  authDomain: "silverdealership-5ea40.firebaseapp.com",
  databaseURL: "https://silverdealership-5ea40-default-rtdb.firebaseio.com",
  projectId: "silverdealership-5ea40",
  storageBucket: "silverdealership-5ea40.firebasestorage.app",
  messagingSenderId: "950098344159",
  appId: "1:950098344159:web:c912b0480f7eb48548d16a",
  measurementId: "G-8TTRYKW7JW"
};

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
      console.log('🔥 Firebase initialized successfully for Silver Motors');
    } else {
      console.warn('Firebase SDK script not loaded yet.');
    }
  } catch (err) {
    console.error('Firebase initialization error:', err);
  }
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
        const vehiclesList = Object.values(data);
        saveLocalCacheVehicles(vehiclesList);
        if (callback) callback(vehiclesList);
      } else {
        // If cloud database is empty, seed with initial catalog
        seedFirebaseInitialData();
        if (callback) callback(DEFAULT_VEHICLES_DATA);
      }
    }, (error) => {
      console.warn('Firebase Realtime Database read failed, falling back to local storage:', error);
      if (callback) callback(getStoredVehicles());
    });
  } else {
    if (callback) callback(getStoredVehicles());
  }
}

// Seed Initial default catalog to Firebase
function seedFirebaseInitialData() {
  if (!fbDb) return;
  const updates = {};
  DEFAULT_VEHICLES_DATA.forEach(v => {
    updates['vehicles/' + v.id] = v;
  });
  fbDb.ref().update(updates)
    .then(() => console.log('✅ Initial vehicles catalog seeded to Firebase cloud'))
    .catch(e => console.warn('Could not seed Firebase:', e));
}

// Save or Update a single vehicle in Firebase
async function saveVehicleToFirebase(vehicleObj) {
  if (fbDb) {
    try {
      await fbDb.ref('vehicles/' + vehicleObj.id).set(vehicleObj);
      return { success: true };
    } catch (err) {
      console.error('Firebase save error:', err);
      // Fallback local save
      return { success: false, error: err.message };
    }
  }
  return { success: false, error: 'Firebase not connected' };
}

// Delete a vehicle from Firebase
async function deleteVehicleFromFirebase(vehicleId) {
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
  localStorage.setItem('silver_motors_vehicles_db', JSON.stringify(data));
  if (typeof VEHICLES_DATA !== 'undefined') {
    VEHICLES_DATA.length = 0;
    VEHICLES_DATA.push(...data);
  }
}
