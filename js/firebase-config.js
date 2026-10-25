/**
 * Motor Trends Auto Group - Server File Storage & Marketplace Integration
 * Stores vehicles and photos directly on HostPapa cPanel File Manager (Apache/PHP)
 * and local Node server in dedicated folders: uploads/vehicles/{vehicle_id}/
 * 100% Free - Completely independent of Firebase Database limits
 */

const API_ENDPOINT = (function() {
  // Use relative endpoint so it works identically on localhost and production HostPapa
  return '/api/vehicles.php';
})();

const marketplaceSubscribers = new Set();
let isMarketplaceSubscribed = false;
const cloudDeletedIds = new Set(
  (typeof getDeletedVehicleIds === 'function') ? getDeletedVehicleIds() : []
);

// Fetch catalog from Server File Storage (/api/vehicles.php or data/vehicles.json)
async function fetchVehiclesFromServer() {
  try {
    const res = await fetch(API_ENDPOINT, { cache: 'no-cache' });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        saveLocalCacheVehicles(data);
        return data;
      }
    }
  } catch (err) {
    console.warn('Could not fetch from /api/vehicles.php, trying static fallback:', err);
    try {
      const fallbackRes = await fetch('data/vehicles.json', { cache: 'no-cache' });
      if (fallbackRes.ok) {
        const data = await fallbackRes.json();
        if (Array.isArray(data)) {
          saveLocalCacheVehicles(data);
          return data;
        }
      }
    } catch (e) {}
  }

  // Local storage fallback
  return (typeof getStoredVehicles === 'function') ? getStoredVehicles() : [];
}

// Subscribe to marketplace vehicles changes
function subscribeToMarketplaceVehicles(callback) {
  if (typeof callback === 'function') {
    marketplaceSubscribers.add(callback);
  }

  // Deliver current local data immediately
  const current = (typeof VEHICLES_DATA !== 'undefined' && VEHICLES_DATA.length > 0)
    ? VEHICLES_DATA
    : ((typeof getStoredVehicles === 'function') ? getStoredVehicles() : []);
  if (typeof callback === 'function') {
    try { callback(current); } catch (e) {}
  }

  // Perform background fetch from server to ensure fresh data
  fetchVehiclesFromServer().then(vehicles => {
    if (Array.isArray(vehicles)) {
      marketplaceSubscribers.forEach(cb => {
        try { cb(vehicles); } catch (e) {}
      });
    }
  }).catch(e => console.warn('Vehicle sync notice:', e));
}

// Save or Update a single vehicle in HostPapa file manager (uploads/vehicles/{id}/)
async function saveVehicleToServer(vehicleObj) {
  if (!vehicleObj || !vehicleObj.id) return { success: false, error: 'Invalid vehicle' };
  const strId = String(vehicleObj.id);

  // Un-tombstone if re-adding
  cloudDeletedIds.delete(strId);
  if (vehicleObj.stockNumber) cloudDeletedIds.delete(String(vehicleObj.stockNumber));
  if (typeof removeDeletedVehicleId === 'function') {
    removeDeletedVehicleId(strId);
    if (vehicleObj.stockNumber) removeDeletedVehicleId(String(vehicleObj.stockNumber));
  }

  // Update in-memory and local cache first
  if (typeof VEHICLES_DATA !== 'undefined') {
    const existingIndex = VEHICLES_DATA.findIndex(v => v && String(v.id) === strId);
    if (existingIndex > -1) {
      VEHICLES_DATA[existingIndex] = vehicleObj;
    } else {
      VEHICLES_DATA.unshift(vehicleObj);
    }
    if (typeof saveVehiclesData === 'function') {
      saveVehiclesData(VEHICLES_DATA);
    }
  }

  // Send to server to create folder and write images as physical files
  try {
    const res = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vehicle: vehicleObj })
    });

    if (res.ok) {
      const result = await res.json();
      if (result && result.vehicle) {
        // Update local object with newly generated file paths
        if (typeof VEHICLES_DATA !== 'undefined') {
          const idx = VEHICLES_DATA.findIndex(v => v && String(v.id) === strId);
          if (idx > -1) {
            VEHICLES_DATA[idx] = result.vehicle;
          }
          if (typeof saveVehiclesData === 'function') {
            saveVehiclesData(VEHICLES_DATA);
          }
        }
        marketplaceSubscribers.forEach(cb => {
          try { cb(VEHICLES_DATA); } catch (e) {}
        });
        return { success: true, vehicle: result.vehicle, folder: result.folder };
      }
      return { success: true };
    } else {
      const errText = await res.text();
      console.warn('Server save warning:', errText);
    }
  } catch (err) {
    console.warn('Network error saving to server API, saved in local cache:', err);
  }

  return { success: true, vehicle: vehicleObj };
}

// Delete vehicle folder and catalog entry from server
async function deleteVehicleFromServer(vehicleId) {
  if (!vehicleId) return { success: false, error: 'Invalid vehicle ID' };
  const strId = String(vehicleId);

  // 1. Mark deleted in tombstones
  cloudDeletedIds.add(strId);
  if (typeof addDeletedVehicleId === 'function') {
    addDeletedVehicleId(strId);
  }

  // 2. Remove from local array
  if (typeof deleteVehicleLocally === 'function') {
    deleteVehicleLocally(strId);
  } else if (typeof VEHICLES_DATA !== 'undefined') {
    const updated = VEHICLES_DATA.filter(v => v && String(v.id) !== strId && String(v.stockNumber || '') !== strId);
    if (typeof saveVehiclesData === 'function') {
      saveVehiclesData(updated);
    }
  }

  marketplaceSubscribers.forEach(cb => {
    try { cb(VEHICLES_DATA); } catch (e) {}
  });

  // 3. Send DELETE to server API
  try {
    let res = await fetch(`${API_ENDPOINT}?id=${encodeURIComponent(strId)}`, {
      method: 'DELETE'
    });

    if (!res.ok) {
      // Fallback with POST ?action=delete if host blocks DELETE
      res = await fetch(`${API_ENDPOINT}?action=delete&id=${encodeURIComponent(strId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: strId })
      });
    }

    if (res.ok) {
      return { success: true, id: strId };
    }
  } catch (err) {
    console.warn('Server delete notification warning:', err);
  }

  return { success: true, id: strId };
}

// Update cache helper
function saveLocalCacheVehicles(data) {
  const deletedIds = (typeof getDeletedVehicleIds === 'function') ? getDeletedVehicleIds() : [];
  deletedIds.forEach(id => cloudDeletedIds.add(String(id)));

  const isTombstoned = (v) => {
    if (!v || !v.id) return true;
    const sId = String(v.id);
    if (cloudDeletedIds.has(sId) || (typeof isVehicleDeleted === 'function' && isVehicleDeleted(sId))) return true;
    if (v.stockNumber && (cloudDeletedIds.has(String(v.stockNumber)) || (typeof isVehicleDeleted === 'function' && isVehicleDeleted(v.stockNumber)))) return true;
    return false;
  };

  const items = Array.isArray(data) ? data.filter(v => !isTombstoned(v)) : [];

  if (typeof localStorage !== 'undefined') {
    const payload = JSON.stringify(items);
    const keys = (typeof ALL_VEHICLE_CACHE_KEYS !== 'undefined')
      ? ALL_VEHICLE_CACHE_KEYS
      : [
          'motortrends_vehicles_db_live',
          'motortrends_vehicles_db_live_legacy',
          'motortrends_vehicles_db',
          'motortrends_vehicles_db_v3',
          'motortrends_vehicles_data'
        ];
    keys.forEach(k => {
      try { localStorage.setItem(k, payload); } catch (e) {}
    });
  }
  if (typeof VEHICLES_DATA !== 'undefined') {
    VEHICLES_DATA.length = 0;
    VEHICLES_DATA.push(...items);
  }
}

// Aliases for seamless backward compatibility with all existing callers
const saveVehicleToFirebase = saveVehicleToServer;
const deleteVehicleFromFirebase = deleteVehicleFromServer;

// Attach globally
if (typeof window !== 'undefined') {
  window.fetchVehiclesFromServer = fetchVehiclesFromServer;
  window.subscribeToMarketplaceVehicles = subscribeToMarketplaceVehicles;
  window.saveVehicleToServer = saveVehicleToServer;
  window.deleteVehicleFromServer = deleteVehicleFromServer;
  window.saveVehicleToFirebase = saveVehicleToFirebase;
  window.deleteVehicleFromFirebase = deleteVehicleFromFirebase;
}
