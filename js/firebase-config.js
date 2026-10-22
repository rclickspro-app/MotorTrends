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
    // 1. Synchronize cloud deleted_vehicles tombstones so all clients stay clean
    try {
      fbDb.ref('deleted_vehicles').on('value', (delSnap) => {
        const delData = delSnap.val();
        if (delData && typeof delData === 'object') {
          Object.keys(delData).forEach(delId => {
            if (delData[delId]) {
              if (typeof addDeletedVehicleId === 'function') addDeletedVehicleId(delId);
            }
          });
          // Prune in-memory data if any currently loaded vehicle is in the cloud tombstone list
          if (typeof VEHICLES_DATA !== 'undefined') {
            const beforeLen = VEHICLES_DATA.length;
            const filtered = VEHICLES_DATA.filter(v => v && v.id && !delData[String(v.id)]);
            if (filtered.length !== beforeLen) {
              VEHICLES_DATA.length = 0;
              VEHICLES_DATA.push(...filtered);
              if (typeof saveVehiclesData === 'function') saveVehiclesData(filtered);
              if (callback) callback(filtered);
            }
          }
        }
      });
      // Realtime listener on system settings (quota, upload slots, sales password)
      fbDb.ref('system/settings').on('value', (sSnap) => {
        const sVal = sSnap.val();
        if (sVal && typeof sVal === 'object') {
          try {
            localStorage.setItem('motortrends_system_settings_v1', JSON.stringify(sVal));
          } catch (e) {}
        }
      });
    } catch (e) {
      console.warn('Could not attach deleted_vehicles listener:', e);
    }

    // 2. Realtime listener on vehicles collection
    const vehiclesRef = fbDb.ref('vehicles');
    vehiclesRef.on('value', (snapshot) => {
      const data = snapshot.val();
      const deletedIds = (typeof getDeletedVehicleIds === 'function') ? getDeletedVehicleIds() : [];
      const isDel = (id) => deletedIds.includes(String(id));

      if (data && typeof data === 'object') {
        const cloudVehicles = [];
        Object.keys(data).forEach(key => {
          const item = data[key];
          if (!item) return;
          const vid = String(item.id || key);
          if (isDel(vid)) {
            // Prune lingering vehicle node from Firebase cloud
            try { fbDb.ref('vehicles/' + key).remove(); } catch (e) {}
          } else {
            if (!item.id) item.id = key;
            cloudVehicles.push(item);
          }
        });

        // Sort: Newest additions / modified first
        cloudVehicles.sort((a, b) => {
          const newA = a.isNewVehicle ? 1 : 0;
          const newB = b.isNewVehicle ? 1 : 0;
          if (newB !== newA) return newB - newA;
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          if (timeB !== timeA) return timeB - timeA;
          return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
        });

        saveLocalCacheVehicles(cloudVehicles);
        if (callback) callback(cloudVehicles);
      } else {
        // Fresh start: Catalog is empty
        saveLocalCacheVehicles([]);
        if (callback) callback([]);
      }
    }, (error) => {
      console.warn('Firebase Realtime Database read failed, falling back to local storage:', error);
      if (callback) callback((typeof getStoredVehicles === 'function') ? getStoredVehicles() : DEFAULT_VEHICLES_DATA);
    });
  } else {
    if (callback) callback((typeof getStoredVehicles === 'function') ? getStoredVehicles() : DEFAULT_VEHICLES_DATA);
  }
}

// Seed Initial default catalog to Firebase (skipping any deleted items)
function seedFirebaseInitialData() {
  if (!fbDb) initFirebaseApp();
  if (!fbDb) return;
  const deletedIds = (typeof getDeletedVehicleIds === 'function') ? getDeletedVehicleIds() : [];
  const source = (typeof DEFAULT_VEHICLES_DATA !== 'undefined' && DEFAULT_VEHICLES_DATA.length > 0)
    ? DEFAULT_VEHICLES_DATA
    : ((typeof getStoredVehicles === 'function') ? getStoredVehicles() : []);
  const updates = {};
  source.forEach(v => {
    if (v && v.id && !deletedIds.includes(String(v.id))) {
      updates['vehicles/' + v.id] = v;
    }
  });
  updates['system/catalog_initialized'] = true;
  fbDb.ref().update(updates)
    .then(() => console.log('✅ Vehicles catalog synced to Firebase cloud'))
    .catch(e => console.warn('Could not seed Firebase:', e));
}

// Save or Update a single vehicle in Firebase
async function saveVehicleToFirebase(vehicleObj) {
  if (!vehicleObj || !vehicleObj.id) return { success: false, error: 'Invalid vehicle' };
  const strId = String(vehicleObj.id);

  // If this ID was previously marked deleted, un-tombstone it
  if (typeof removeDeletedVehicleId === 'function') {
    removeDeletedVehicleId(strId);
  }

  // Ensure local storage cache has it immediately
  if (typeof saveVehiclesData === 'function' && typeof VEHICLES_DATA !== 'undefined') {
    const existingIndex = VEHICLES_DATA.findIndex(v => String(v.id) === strId);
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
      const updates = {};
      updates['vehicles/' + strId] = vehicleObj;
      updates['deleted_vehicles/' + strId] = null; // Clear any deletion flag
      updates['system/catalog_initialized'] = true;
      await fbDb.ref().update(updates);
      return { success: true };
    } catch (err) {
      console.error('Firebase save error:', err);
      return { success: false, error: err.message };
    }
  }
  return { success: false, error: 'Firebase not connected' };
}

// Delete a vehicle permanently from Firebase and all local stores
async function deleteVehicleFromFirebase(vehicleId) {
  if (!vehicleId) return { success: false, error: 'Invalid vehicle ID' };
  const strId = String(vehicleId);

  // 1. Mark permanently deleted in local tombstone storage
  if (typeof addDeletedVehicleId === 'function') {
    addDeletedVehicleId(strId);
  }

  // 2. Remove immediately from local working array and storage
  if (typeof deleteVehicleLocally === 'function') {
    deleteVehicleLocally(strId);
  } else if (typeof VEHICLES_DATA !== 'undefined') {
    const updated = VEHICLES_DATA.filter(v => String(v.id) !== strId);
    if (typeof saveVehiclesData === 'function') {
      saveVehiclesData(updated);
    }
  }

  // 3. Atomically delete from Firebase Realtime Database AND write cloud tombstone
  if (!fbDb && typeof initFirebaseApp === 'function') initFirebaseApp();
  if (fbDb) {
    try {
      const updates = {};
      updates['vehicles/' + strId] = null;
      updates['deleted_vehicles/' + strId] = Date.now();
      await fbDb.ref().update(updates);
      return { success: true };
    } catch (err) {
      console.warn('Firebase delete error (tombstone preserved locally):', err);
      return { success: false, error: err.message };
    }
  }
  return { success: true };
}

// Reset all vehicles in Firebase to defaults
async function resetFirebaseToDefaults() {
  if (!fbDb) initFirebaseApp();
  if (fbDb) {
    try {
      await fbDb.ref('vehicles').remove();
      await fbDb.ref('deleted_vehicles').remove();
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('motortrends_deleted_vehicles_ids');
      }
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
  const deletedIds = (typeof getDeletedVehicleIds === 'function') ? getDeletedVehicleIds() : [];
  const items = Array.isArray(data) ? data.filter(v => v && v.id && !deletedIds.includes(String(v.id))) : [];
  if (typeof localStorage !== 'undefined') {
    const key = (typeof STORAGE_KEY_VEHICLES !== 'undefined') ? STORAGE_KEY_VEHICLES : 'motortrends_vehicles_db_v3';
    localStorage.setItem(key, JSON.stringify(items));
    localStorage.setItem('motortrends_vehicles_db', JSON.stringify(items));
  }
  if (typeof VEHICLES_DATA !== 'undefined') {
    VEHICLES_DATA.length = 0;
    VEHICLES_DATA.push(...items);
  }
}
