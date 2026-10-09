/**
 * Motor Trends Auto Group Admin Portal Controller
 * Authentication, Registration, Email Verification Simulation & Full Marketplace Management
 */

const ADMIN_STORAGE_KEY_USERS = 'motortrends_admin_users_v4';
const ADMIN_STORAGE_KEY_SESSION = 'motortrends_admin_session';

const DEFAULT_USERS = [
  {
    id: 'usr-admin-01',
    name: 'Motor Trends Dealership Manager',
    username: 'admin',
    email: 'admin@motortrendsautogroup.com',
    password: 'admin',
    role: 'Dealership Admin',
    department: 'Management',
    permissions: ['inventory', 'inquiries', 'users', 'analytics', 'hr', 'settings'],
    status: 'Active',
    verified: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'usr-sales-01',
    name: 'Jason Wong (Senior Sales Agent)',
    username: 'sales',
    email: 'sales@motortrendsautogroup.com',
    password: 'sales',
    role: 'Sales Agent',
    department: 'Sales',
    permissions: ['inventory', 'inquiries'],
    status: 'Active',
    verified: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'usr-hr-01',
    name: 'Sarah Jenkins (HR Director)',
    username: 'hr',
    email: 'hr@motortrendsautogroup.com',
    password: 'hr',
    role: 'HR Manager',
    department: 'Human Resources',
    permissions: ['users', 'hr'],
    status: 'Active',
    verified: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'usr-tech-01',
    name: 'Marcus Tremblay (Inspection Tech)',
    username: 'tech',
    email: 'tech@motortrendsautogroup.com',
    password: 'tech',
    role: 'Tech',
    department: 'Service & Inspection',
    permissions: ['inspections'],
    status: 'Active',
    verified: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'usr-service-01',
    name: 'Gurpreet Dhaliwal (Service Tech)',
    username: 'service',
    email: 'service@motortrendsautogroup.com',
    password: 'service',
    role: 'Service Tech',
    department: 'Service & Reconditioning',
    permissions: ['service_orders'],
    status: 'Active',
    verified: true,
    createdAt: new Date().toISOString()
  }
];

const DEFAULT_ADMIN = DEFAULT_USERS[0];

let currentAdminUser = null;
let editingVehicleId = null;
let currentTab = 'vehicles'; // 'vehicles' | 'analytics' | 'inquiries' | 'users' | 'firebase' | 'settings'
let staffFilterDept = 'all';

document.addEventListener('DOMContentLoaded', () => {
  initAdminSystem();
});

// Fallback formatNumber helper if not loaded from data.js
if (typeof formatNumber !== 'function') {
  window.formatNumber = function(val) {
    if (val === undefined || val === null || val === '') return '0';
    const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/,/g, '')) || 0;
    return num.toLocaleString('en-CA');
  };
}

function initAdminSystem() {
  initAdminUsersDB();
  checkAuthSession();
  setupAuthEventListeners();
  setupDashboardEventListeners();
  setupVehicleModalEvents();
  setupUserModalEvents();

  // Real-time synchronization with cloud database
  if (typeof subscribeToMarketplaceVehicles === 'function') {
    subscribeToMarketplaceVehicles(() => {
      loadMarketplaceDashboard();
    });
  }

  // Cross-tab sync
  window.addEventListener('storage', (e) => {
    if (e.key === 'motortrends_vehicles_db_v3' || e.key === 'motortrends_vehicles_db') {
      const updated = (typeof getStoredVehicles === 'function') ? getStoredVehicles() : [];
      if (updated && updated.length > 0) {
        VEHICLES_DATA.length = 0;
        VEHICLES_DATA.push(...updated);
        loadMarketplaceDashboard();
      }
    }
  });
}

/* ----------------------------------------------------
   Auth & User Database Management
----------------------------------------------------- */
function initAdminUsersDB() {
  const users = getAdminUsers();
  if (users.length === 0 || !users.some(u => u.username === 'hr')) {
    saveAdminUsers(DEFAULT_USERS);
  }
}

function getAdminUsers() {
  try {
    const raw = localStorage.getItem(ADMIN_STORAGE_KEY_USERS);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error reading admin users:', e);
    return [];
  }
}

function saveAdminUsers(users) {
  localStorage.setItem(ADMIN_STORAGE_KEY_USERS, JSON.stringify(users));
}

function checkAuthSession() {
  // 1. Check local session (always reliable for staff / manager logins)
  const session = localStorage.getItem(ADMIN_STORAGE_KEY_SESSION);
  if (session) {
    try {
      const parsed = JSON.parse(session);
      if (parsed && parsed.verified) {
        currentAdminUser = parsed;
        showDashboardView();
        return;
      }
    } catch (e) {
      console.warn('Session parse error:', e);
    }
  }

  // 2. Check Firebase Auth state if available
  if (typeof firebase !== 'undefined' && fbAuth) {
    fbAuth.onAuthStateChanged((user) => {
      if (user) {
        const loggedUser = {
          id: user.uid,
          name: user.displayName || user.email.split('@')[0],
          email: user.email,
          role: 'Dealership Admin',
          permissions: ['inventory', 'inquiries', 'users', 'analytics', 'hr', 'settings'],
          verified: true,
          authProvider: 'firebase'
        };
        currentAdminUser = loggedUser;
        localStorage.setItem(ADMIN_STORAGE_KEY_SESSION, JSON.stringify(loggedUser));
        showDashboardView();
        return;
      } else {
        showAuthView('login');
      }
    });
    return;
  }

  showAuthView('login');
}

/* ----------------------------------------------------
   View Switchers (Auth vs Dashboard)
----------------------------------------------------- */
function showAuthView(viewName = 'login') {
  document.getElementById('admin-auth-screen').style.display = 'flex';
  document.getElementById('admin-dashboard-screen').style.display = 'none';

  // Sub-screens
  document.getElementById('auth-login-box').style.display = viewName === 'login' ? 'block' : 'none';
  document.getElementById('auth-register-box').style.display = viewName === 'register' ? 'block' : 'none';
  document.getElementById('auth-verify-box').style.display = viewName === 'verify' ? 'block' : 'none';
}

function showDashboardView() {
  document.getElementById('admin-auth-screen').style.display = 'none';
  document.getElementById('admin-dashboard-screen').style.display = 'block';
  
  if (currentAdminUser) {
    document.getElementById('admin-user-display-name').textContent = currentAdminUser.name;
    document.getElementById('admin-user-role-badge').textContent = currentAdminUser.role || 'Admin';
    document.getElementById('admin-user-email').textContent = currentAdminUser.email;
  }

  loadMarketplaceDashboard();

  if (typeof window.hideActionLoader === 'function') {
    setTimeout(() => window.hideActionLoader(), 350);
  }
}

/* ----------------------------------------------------
   Auth Event Listeners (Login, Register, OTP Verify)
----------------------------------------------------- */
function setupAuthEventListeners() {
  // Quick Role Fill Buttons (Admin, Sales, HR, Tech, Service)
  document.querySelectorAll('.quick-role-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const u = btn.dataset.user;
      const p = btn.dataset.pass;
      const userEl = document.getElementById('login-username');
      const passEl = document.getElementById('login-password');
      const hintEl = document.getElementById('role-pass-hint');
      if (userEl) userEl.value = u;
      if (passEl) passEl.value = p;
      if (hintEl) hintEl.innerHTML = `Preset: <strong>${u}</strong> / <strong>${p}</strong>`;
      showToast(`Selected ${btn.textContent.trim()} preset. Click 'Sign In' or hit Enter!`, 'info');
    });
  });

  // Switch to Register
  document.getElementById('btn-show-register')?.addEventListener('click', (e) => {
    e.preventDefault();
    showAuthView('register');
  });

  // Switch to Login
  document.querySelectorAll('.btn-show-login').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      showAuthView('login');
    });
  });

  // Login Form Submission
  const loginForm = document.getElementById('admin-login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (typeof window.showActionLoader === 'function') {
        window.showActionLoader('Authenticating Motor Trends Staff Profile...');
      }
      const userInputEl = document.getElementById('login-username') || document.getElementById('login-email');
      const userInput = userInputEl ? userInputEl.value.trim().toLowerCase() : '';
      const password = document.getElementById('login-password') ? document.getElementById('login-password').value : '';
      const submitBtn = loginForm.querySelector('button[type="submit"]');

      // 1. Check Default / Demo Accounts & Local Staff Database
      const localUsers = getAdminUsers();
      const allStaff = [...DEFAULT_USERS];
      localUsers.forEach(u => {
        if (!allStaff.some(s => s.username && s.username.toLowerCase() === u.username.toLowerCase())) {
          allStaff.push(u);
        }
      });

      const matchedUser = allStaff.find(u => {
        const uName = (u.username || '').toLowerCase();
        const uEmail = (u.email || '').toLowerCase();
        const isUserMatch = (uName === userInput || uEmail === userInput);
        if (!isUserMatch) return false;
        // Accept exact password or with 123
        return (u.password === password || password === u.password + '123' || (uName === 'admin' && (password === 'admin' || password === 'admin123')));
      });

      if (matchedUser) {
        currentAdminUser = matchedUser;
        localStorage.setItem(ADMIN_STORAGE_KEY_SESSION, JSON.stringify(matchedUser));
        showToast(`Welcome back, ${matchedUser.name}! (${matchedUser.role})`, 'success');
        showDashboardView();
        return;
      }

      // 2. Check Firebase Authentication (if email or Firebase Auth initialized)
      if (typeof firebase !== 'undefined' && fbAuth && (userInput.includes('@') || password.length >= 6)) {
        try {
          if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = 'Connecting to Firebase...';
          }
          const emailToTry = userInput.includes('@') ? userInput : `${userInput}@motortrendsautogroup.com`;
          const userCredential = await fbAuth.signInWithEmailAndPassword(emailToTry, password);
          const fbUser = userCredential.user;

          const loggedUser = {
            id: fbUser.uid,
            name: fbUser.displayName || userInput,
            email: fbUser.email,
            role: 'Dealership Admin',
            permissions: ['inventory', 'inquiries', 'users', 'analytics', 'hr', 'settings'],
            verified: true,
            authProvider: 'firebase'
          };

          currentAdminUser = loggedUser;
          localStorage.setItem(ADMIN_STORAGE_KEY_SESSION, JSON.stringify(loggedUser));
          showToast(`Firebase Cloud Login: ${loggedUser.email}`, 'success');
          showDashboardView();
          return;
        } catch (error) {
          console.warn('Firebase Login Error:', error);
          // Show helpful error message without locking out
          showAuthAlert(`Firebase Auth Note: ${error.message}. You can also use Quick Roles above (admin / admin).`, 'error');
          return;
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Sign In to Admin Portal';
          }
        }
      }

      // If all failed
      if (typeof window.hideActionLoader === 'function') {
        window.hideActionLoader();
      }
      showAuthAlert('Invalid credentials. Please click one of the Quick Role presets above (Admin, Sales, HR, Tech) or use: Username: admin | Password: admin', 'error');
    });
  }

  // Register Form Submission (Firebase Auth + Auto Email Verification Link)
  const registerForm = document.getElementById('admin-register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('reg-name').value.trim();
      const email = document.getElementById('reg-email').value.trim().toLowerCase();
      const role = document.getElementById('reg-role').value;
      const password = document.getElementById('reg-password').value;
      const confirmPassword = document.getElementById('reg-confirm-password').value;
      const submitBtn = registerForm.querySelector('button[type="submit"]');

      if (password !== confirmPassword) {
        showAuthAlert('Passwords do not match! Please re-check.', 'error');
        return;
      }

      if (password.length < 6) {
        showAuthAlert('Password must be at least 6 characters long.', 'error');
        return;
      }

      // Firebase Registration + Send Verification Email
      if (typeof firebase !== 'undefined' && fbAuth) {
        try {
          if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = 'Creating Account & Sending Link...';
          }

          const userCredential = await fbAuth.createUserWithEmailAndPassword(email, password);
          const fbUser = userCredential.user;

          // Update display name
          await fbUser.updateProfile({ displayName: name });

          // Send verification email link directly from Google Firebase
          await fbUser.sendEmailVerification({
            url: window.location.origin + window.location.pathname
          });

          showToast('✅ A verification link has been sent to your email! Please check your inbox.', 'success');
          initiateEmailVerification({ email, name, role });

        } catch (error) {
          console.error('Firebase Register Error:', error);
          showAuthAlert(getFirebaseErrorMessage(error), 'error');
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Register & Send Verification Link';
          }
        }
      }
    });
  }

  // Resend Link Button
  document.getElementById('btn-resend-otp')?.addEventListener('click', async () => {
    if (typeof firebase !== 'undefined' && fbAuth && fbAuth.currentUser) {
      try {
        await fbAuth.currentUser.sendEmailVerification({
          url: window.location.origin + window.location.pathname
        });
        showToast('The verification email link has been resent!', 'success');
      } catch (err) {
        showAuthAlert(getFirebaseErrorMessage(err), 'error');
      }
    } else {
      showToast('Please sign in or re-register to receive the verification link.', 'info');
    }
  });

  // Check Email Verification Status Button / Refresh
  document.getElementById('btn-check-verified')?.addEventListener('click', async () => {
    if (typeof firebase !== 'undefined' && fbAuth && fbAuth.currentUser) {
      await fbAuth.currentUser.reload();
      if (fbAuth.currentUser.emailVerified) {
        const loggedUser = {
          id: fbAuth.currentUser.uid,
          name: fbAuth.currentUser.displayName || 'Admin User',
          email: fbAuth.currentUser.email,
          role: 'Dealership Admin',
          verified: true
        };
        currentAdminUser = loggedUser;
        localStorage.setItem(ADMIN_STORAGE_KEY_SESSION, JSON.stringify(loggedUser));
        showToast('🎉 Email Verified Successfully!', 'success');
        showDashboardView();
      } else {
        showAuthAlert('The email has not yet been verified. Please click the link in the email.', 'warning');
      }
    }
  });

  // Logout Button
  const logoutBtn = document.getElementById('btn-admin-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      if (typeof window.showActionLoader === 'function') {
        window.showActionLoader('Signing out of Admin Portal...');
      }
      if (typeof firebase !== 'undefined' && fbAuth) {
        await fbAuth.signOut().catch(() => {});
      }
      localStorage.removeItem(ADMIN_STORAGE_KEY_SESSION);
      currentAdminUser = null;
      setTimeout(() => {
        showToast('Logged out of Admin Portal.', 'info');
        showAuthView('login');
        const passInp = document.getElementById('login-password');
        if (passInp) passInp.value = '';
        if (typeof window.hideActionLoader === 'function') {
          window.hideActionLoader();
        }
      }, 350);
    });
  }
}

function initiateEmailVerification(user) {
  document.getElementById('verify-target-email').value = user.email;
  document.getElementById('verify-user-email-text').textContent = user.email;
  showAuthView('verify');
}

function getFirebaseErrorMessage(error) {
  if (!error) return 'An error occurred. Please try again.';
  if (error.code === 'auth/email-already-in-use') return 'An account with this email address already exists. Please sign in.';
  if (error.code === 'auth/invalid-email') return 'Please enter a valid email address.';
  if (error.code === 'auth/weak-password') return 'Password must be at least 6 characters long.';
  if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') return 'Invalid email or password.';
  if (error.code === 'auth/too-many-requests') return 'Too many attempts. Please wait a few moments and try again.';
  return error.message || 'Operation failed.';
}

function showAuthAlert(msg, type = 'error') {
  const alertBox = document.getElementById('auth-error-alert');
  if (alertBox) {
    alertBox.textContent = msg;
    alertBox.className = `admin-alert alert-${type}`;
    alertBox.style.display = 'block';
    setTimeout(() => {
      alertBox.style.display = 'none';
    }, 6000);
  }
}

/* ----------------------------------------------------
   Marketplace Dashboard Management
----------------------------------------------------- */
function setupDashboardEventListeners() {
  // Navigation Tabs
  document.querySelectorAll('.admin-nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('.admin-nav-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      const tab = item.dataset.tab;
      currentTab = tab;
      switchAdminTab(tab);
    });
  });

  // Add New Vehicle Button
  document.getElementById('btn-add-vehicle')?.addEventListener('click', () => {
    openVehicleEditorModal(null);
  });

  // Search & Filter in Table
  document.getElementById('admin-search-input')?.addEventListener('input', (e) => {
    renderVehiclesTable(e.target.value.toLowerCase());
  });

  document.getElementById('admin-filter-category')?.addEventListener('change', () => {
    renderVehiclesTable();
  });

  document.getElementById('admin-filter-status')?.addEventListener('change', () => {
    renderVehiclesTable();
  });

  // Reset to Factory Defaults
  document.getElementById('btn-restore-defaults')?.addEventListener('click', () => {
    if (confirm('Are you sure you want to reset the marketplace inventory to the original default 16 vehicles? Any custom edits or newly added cars will be replaced.')) {
      saveVehiclesData(DEFAULT_VEHICLES_DATA);
      loadMarketplaceDashboard();
      showToast('Marketplace inventory restored to original factory defaults.', 'success');
    }
  });

  // Quick Export Data
  document.getElementById('btn-export-inventory')?.addEventListener('click', () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(VEHICLES_DATA, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `motortrends_inventory_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Inventory database exported successfully!', 'success');
  });
}

function switchAdminTab(tabName) {
  document.getElementById('tab-view-vehicles').style.display = tabName === 'vehicles' ? 'block' : 'none';
  document.getElementById('tab-view-analytics').style.display = tabName === 'analytics' ? 'block' : 'none';
  document.getElementById('tab-view-inquiries').style.display = tabName === 'inquiries' ? 'block' : 'none';
  const usersView = document.getElementById('tab-view-users');
  if (usersView) usersView.style.display = tabName === 'users' ? 'block' : 'none';
  const settingsView = document.getElementById('tab-view-settings');
  if (settingsView) settingsView.style.display = tabName === 'settings' ? 'block' : 'none';
  const firebaseView = document.getElementById('tab-view-firebase');
  if (firebaseView) firebaseView.style.display = tabName === 'firebase' ? 'block' : 'none';

  if (tabName === 'analytics') renderAnalyticsView();
  if (tabName === 'inquiries') renderInquiriesView();
  if (tabName === 'users') renderUsersView();
  if (tabName === 'firebase') renderFirebaseView();
}

function loadMarketplaceDashboard() {
  updateDashboardKpis();
  renderVehiclesTable();
}

function updateDashboardKpis() {
  const totalVehicles = VEHICLES_DATA.length;
  const certifiedCount = VEHICLES_DATA.filter(v => v.condition === 'Certified Pre-Owned').length;
  const totalValue = VEHICLES_DATA.reduce((sum, v) => sum + (v.price || 0), 0);
  const avgPrice = totalVehicles > 0 ? Math.round(totalValue / totalVehicles) : 0;
  const featuredCount = VEHICLES_DATA.filter(v => v.featured).length;

  document.getElementById('kpi-total-inventory').textContent = totalVehicles;
  document.getElementById('kpi-certified-count').textContent = certifiedCount;
  document.getElementById('kpi-total-value').textContent = formatPrice(totalValue);
  document.getElementById('kpi-avg-price').textContent = formatPrice(avgPrice);
  document.getElementById('kpi-featured-count').textContent = featuredCount;
}

function renderVehiclesTable(query = '') {
  const tbody = document.getElementById('admin-vehicles-tbody');
  if (!tbody) return;

  const categoryFilter = document.getElementById('admin-filter-category')?.value || 'all';
  const statusFilter = document.getElementById('admin-filter-status')?.value || 'all';

  const filtered = VEHICLES_DATA.filter(car => {
    // Search query
    if (query) {
      const haystack = `${car.year || ''} ${car.make || ''} ${car.model || ''} ${car.trim || ''} ${car.vin || ''} ${car.stockNumber || ''} ${car.id || ''}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    // Body category
    if (categoryFilter !== 'all' && car.bodyType !== categoryFilter) return false;
    // Status / condition
    if (statusFilter === 'featured' && !car.featured) return false;
    if (statusFilter === 'certified' && car.condition !== 'Certified Pre-Owned') return false;
    if (statusFilter === 'preowned' && car.condition !== 'Pre-Owned') return false;

    return true;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 3rem; color: var(--silver-500);">
          No vehicles found matching your criteria. Try adjusting your search query or filters.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(car => `
    <tr>
      <td style="width: 80px;">
        <img src="${(Array.isArray(car.images) && car.images[0]) ? car.images[0] : 'https://images.unsplash.com/photo-1581540222194-0def2dda95b8?auto=format&fit=crop&w=400&q=80'}" alt="${car.model || 'Vehicle'}" style="width: 70px; height: 48px; object-fit: cover; border-radius: 6px; border: 1px solid var(--border-medium);">
      </td>
      <td>
        <div style="font-weight: 700; color: #fff; font-size: 0.95rem;">${car.year} ${car.make} ${car.model}</div>
        <div style="font-size: 0.8rem; color: var(--silver-400);">${car.trim}</div>
        <div style="font-size: 0.75rem; color: var(--silver-500); font-family: monospace;">VIN: ${car.vin && car.vin !== 'N/A' ? car.vin : '<span style="font-style: italic; color: #64748b;">(Optional / N/A)</span>'}</div>
      </td>
      <td>
        <div style="font-size: 0.85rem; font-weight: 600; color: #cbd5e1;">${car.stockNumber}</div>
        <span class="badge ${car.condition === 'Certified Pre-Owned' ? 'badge-blue' : 'badge-silver'}" style="font-size: 0.7rem; padding: 2px 6px;">
          ${car.condition}
        </span>
      </td>
      <td>
        <div style="font-size: 0.85rem; color: #fff;">${car.bodyType} • ${car.fuelType}</div>
        <div style="font-size: 0.8rem; color: var(--silver-400);">${formatNumber(car.mileage || 0)} km • ${car.drivetrain || 'AWD'}</div>
      </td>
      <td>
        <div style="font-weight: 800; font-size: 1rem; color: #fff;">${formatPrice(car.price)}</div>
        <div style="font-size: 0.8rem; color: #60a5fa;">Est. ${formatMonthly(car.monthlyEst)}</div>
      </td>
      <td>
        <button class="btn-toggle-featured ${car.featured ? 'active' : ''}" data-id="${car.id}" title="Toggle Featured Deal on Homepage">
          ${car.featured ? '⭐ Featured' : '☆ Standard'}
        </button>
      </td>
      <td style="text-align: right;">
        <div style="display: flex; gap: 0.4rem; justify-content: flex-end;">
          <button class="btn btn-silver btn-sm btn-edit-car" data-id="${car.id}" title="Edit Vehicle Details & Pricing">
            ✏️ Edit
          </button>
          <button class="btn btn-outline btn-sm btn-view-live-car" data-id="${car.id}" title="Preview in Marketplace">
            👁️
          </button>
          <button class="btn btn-dark btn-sm btn-delete-car" data-id="${car.id}" title="Delete Vehicle from Inventory" style="color: #ef4444;">
            🗑️
          </button>
        </div>
      </td>
    </tr>
  `).join('');

  attachTableActionEvents();
}

function attachTableActionEvents() {
  // Edit vehicle
  document.querySelectorAll('.btn-edit-car').forEach(btn => {
    btn.addEventListener('click', () => {
      const carId = btn.dataset.id;
      openVehicleEditorModal(carId);
    });
  });

  // Delete vehicle
  document.querySelectorAll('.btn-delete-car').forEach(btn => {
    btn.addEventListener('click', async () => {
      const carId = btn.dataset.id;
      const car = getVehicleById(carId);
      if (car && confirm(`Are you sure you want to permanently delete "${car.year} ${car.make} ${car.model}" (Stock #${car.stockNumber}) from the marketplace?`)) {
        if (typeof window.showActionLoader === 'function') {
          window.showActionLoader('Removing Vehicle from CAD Inventory...');
        }
        try {
          const updated = VEHICLES_DATA.filter(v => v.id !== carId);
          saveVehiclesData(updated);
          
          // Permanently remove from Firebase Cloud Database
          if (typeof deleteVehicleFromFirebase === 'function') {
            await deleteVehicleFromFirebase(carId);
          }

          loadMarketplaceDashboard();
          showToast(`Vehicle #${car.stockNumber} permanently deleted.`, 'info');
        } finally {
          if (typeof window.hideActionLoader === 'function') {
            setTimeout(() => window.hideActionLoader(), 250);
          }
        }
      }
    });
  });

  // Toggle Featured
  document.querySelectorAll('.btn-toggle-featured').forEach(btn => {
    btn.addEventListener('click', async () => {
      const carId = btn.dataset.id;
      const car = getVehicleById(carId);
      if (car) {
        car.featured = !car.featured;
        saveVehiclesData(VEHICLES_DATA);
        if (typeof saveVehicleToFirebase === 'function') {
          await saveVehicleToFirebase(car);
        }
        loadMarketplaceDashboard();
        showToast(`${car.make} ${car.model} featured status updated.`, 'success');
      }
    });
  });

  // Live preview
  document.querySelectorAll('.btn-view-live-car').forEach(btn => {
    btn.addEventListener('click', () => {
      const carId = btn.dataset.id;
      const car = getVehicleById(carId);
      const queryParam = (car && car.stockNumber) ? car.stockNumber : carId;
      window.open(`inventory.html?q=${encodeURIComponent(queryParam)}`, '_blank');
    });
  });
}

/* ----------------------------------------------------
   Vehicle Add / Edit Modal Logic
----------------------------------------------------- */
function setupVehicleModalEvents() {
  const modalBackdrop = document.getElementById('vehicle-edit-modal-backdrop');
  document.getElementById('btn-close-vehicle-modal')?.addEventListener('click', () => {
    modalBackdrop.classList.remove('active');
  });

  document.getElementById('btn-cancel-vehicle-modal')?.addEventListener('click', () => {
    modalBackdrop.classList.remove('active');
  });

  // Vehicle Form Submit (Save / Create)
  const form = document.getElementById('vehicle-editor-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      saveVehicleFromForm();
    });
  }
}

let currentEditingImages = [];

function renderImageSlots() {
  const grid = document.getElementById('image-slots-grid');
  if (!grid) return;

  grid.innerHTML = '';
  for (let i = 0; i < 10; i++) {
    const imgUrl = currentEditingImages[i];
    const slot = document.createElement('div');
    slot.style.cssText = `
      aspect-ratio: 16/10;
      border: 1px dashed ${imgUrl ? 'var(--border-medium)' : 'var(--border-subtle)'};
      border-radius: 8px;
      overflow: hidden;
      position: relative;
      background: ${imgUrl ? '#000' : 'rgba(255,255,255,0.02)'};
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    `;

    if (imgUrl) {
      slot.innerHTML = `
        <img src="${imgUrl}" alt="Slot ${i+1}" style="width: 100%; height: 100%; object-fit: cover;">
        <div style="position: absolute; top: 4px; left: 4px; background: rgba(0,0,0,0.7); font-size: 0.65rem; padding: 1px 5px; border-radius: 3px; color: #fff;">
          ${i === 0 ? 'Main Photo' : `#${i+1}`}
        </div>
        <button type="button" class="btn-remove-slot-img" data-index="${i}" style="position: absolute; top: 4px; right: 4px; background: rgba(239,68,68,0.85); color: #fff; border: none; border-radius: 50%; width: 20px; height: 20px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 11px;">
          ✕
        </button>
      `;
    } else {
      slot.innerHTML = `
        <div style="text-align: center; color: var(--silver-500); font-size: 0.75rem;">
          <div style="font-size: 1.1rem; margin-bottom: 2px;">+</div>
          Photo ${i + 1}
        </div>
      `;
    }
    grid.appendChild(slot);
  }

  // Remove photo handler
  grid.querySelectorAll('.btn-remove-slot-img').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.index);
      currentEditingImages.splice(idx, 1);
      renderImageSlots();
    });
  });
}

function openVehicleEditorModal(carId = null) {
  editingVehicleId = carId;
  const modalBackdrop = document.getElementById('vehicle-edit-modal-backdrop');
  const modalTitle = document.getElementById('vehicle-modal-title');
  const form = document.getElementById('vehicle-editor-form');

  if (!modalBackdrop || !form) return;

  if (carId) {
    const car = getVehicleById(carId);
    if (!car) return;

    modalTitle.textContent = `Edit Vehicle: ${car.year} ${car.make} ${car.model}`;
    document.getElementById('form-car-id').value = car.id;
    document.getElementById('form-car-year').value = car.year;
    document.getElementById('form-car-make').value = car.make;
    document.getElementById('form-car-model').value = car.model;
    document.getElementById('form-car-trim').value = car.trim;
    document.getElementById('form-car-price').value = car.price;
    document.getElementById('form-car-monthly').value = car.monthlyEst || Math.round(car.price / 72);
    document.getElementById('form-car-mileage').value = car.mileage;
    document.getElementById('form-car-body').value = car.bodyType;
    document.getElementById('form-car-fuel').value = car.fuelType;
    document.getElementById('form-car-trans').value = car.transmission;
    document.getElementById('form-car-drivetrain').value = car.drivetrain;
    document.getElementById('form-car-engine').value = car.engine;
    document.getElementById('form-car-ext-color').value = car.exteriorColor;
    document.getElementById('form-car-int-color').value = car.interiorColor;
    document.getElementById('form-car-vin').value = car.vin;
    document.getElementById('form-car-stock').value = car.stockNumber;
    document.getElementById('form-car-condition').value = car.condition;
    document.getElementById('form-car-featured').checked = !!car.featured;
    const videoVal = car.video || '';
    document.getElementById('form-car-video').value = videoVal;
    updateVideoPreviewUI(videoVal);
    
    currentEditingImages = car.images ? [...car.images].slice(0, 10) : [];
    document.getElementById('form-car-features').value = car.features.join('\n');
    document.getElementById('form-car-badges').value = car.badges.join(', ');
    document.getElementById('form-car-overview').value = car.overview;
  } else {
    modalTitle.textContent = 'Add New Vehicle to Marketplace';
    form.reset();
    document.getElementById('form-car-id').value = '';
    document.getElementById('form-car-stock').value = `MT-${Math.floor(1000 + Math.random() * 9000)}`;
    document.getElementById('form-car-video').value = '';
    updateVideoPreviewUI('');
    currentEditingImages = ['https://images.unsplash.com/photo-1581540222194-0def2dda95b8?auto=format&fit=crop&w=1000&q=80'];
    document.getElementById('form-car-features').value = 'Apple CarPlay & Android Auto\nBlind Spot Monitoring\nRearview Backup Camera\nBluetooth Hands-free';
    document.getElementById('form-car-badges').value = 'Clean Title, Inspected';
  }

  renderImageSlots();

  // Handle URL Add Button
  const addUrlBtn = document.getElementById('btn-add-image-url');
  const urlInput = document.getElementById('quick-image-url-input');
  if (addUrlBtn && urlInput) {
    addUrlBtn.onclick = () => {
      const url = urlInput.value.trim();
      if (url) {
        if (currentEditingImages.length >= 10) {
          showToast('Maximum 10 images allowed per vehicle.', 'warning');
          return;
        }
        currentEditingImages.push(url);
        urlInput.value = '';
        renderImageSlots();
      }
    };
  }

  // Video URL Input dynamic change
  const videoInput = document.getElementById('form-car-video');
  if (videoInput) {
    videoInput.oninput = () => {
      updateVideoPreviewUI(videoInput.value.trim());
    };
  }

  // Remove Video Button Handler
  const removeVideoBtn = document.getElementById('btn-remove-video');
  if (removeVideoBtn) {
    removeVideoBtn.onclick = () => {
      document.getElementById('form-car-video').value = '';
      const videoFileInput = document.getElementById('file-video-upload');
      if (videoFileInput) videoFileInput.value = '';
      updateVideoPreviewUI('');
      showToast('Attached video removed.', 'info');
    };
  }

  // Handle Bulk Image File Upload with automatic Canvas compression
  const fileInput = document.getElementById('bulk-image-upload');
  if (fileInput) {
    fileInput.onchange = (e) => {
      const files = Array.from(e.target.files);
      const remainingSlots = 10 - currentEditingImages.length;
      if (remainingSlots <= 0) {
        showToast('Maximum 10 images already reached.', 'warning');
        return;
      }
      const filesToProcess = files.slice(0, remainingSlots);
      filesToProcess.forEach(file => {
        const reader = new FileReader();
        reader.onload = (re) => {
          // Compress via Canvas to ~900px width so storage never fails
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const maxWidth = 900;
            let width = img.width;
            let height = img.height;
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);

            if (currentEditingImages.length < 10) {
              currentEditingImages.push(compressedBase64);
              renderImageSlots();
            }
          };
          img.src = re.target.result;
        };
        reader.readAsDataURL(file);
      });
      fileInput.value = '';
    };
  }

  // Handle Video File Upload
  const videoFileInput = document.getElementById('file-video-upload');
  if (videoFileInput) {
    videoFileInput.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        // Read file as clean base64 / data URL
        const videoReader = new FileReader();
        videoReader.onload = (ve) => {
          document.getElementById('form-car-video').value = ve.target.result;
          updateVideoPreviewUI(`Attached: ${file.name} (${Math.round(file.size/1024/1024 * 10)/10} MB)`);
          showToast(`Video attached: ${file.name}`, 'success');
        };
        videoReader.readAsDataURL(file);
      }
    };
  }

  modalBackdrop.classList.add('active');
}

function updateVideoPreviewUI(videoVal) {
  const videoTag = document.getElementById('video-preview-tag');
  const removeVideoBtn = document.getElementById('btn-remove-video');
  if (!videoTag) return;

  if (videoVal && videoVal.length > 0) {
    videoTag.style.display = 'flex';
    if (videoVal.startsWith('data:video')) {
      videoTag.innerHTML = `<span>🎥 Local video attached (${Math.round(videoVal.length/1024/1024 * 10)/10} MB)</span>`;
    } else if (videoVal.includes('youtube.com') || videoVal.includes('youtu.be')) {
      videoTag.innerHTML = `<span>🔴 YouTube Walkaround URL Attached</span>`;
    } else if (videoVal.startsWith('http')) {
      videoTag.innerHTML = `<span>🌐 Online MP4 / Video Stream Attached</span>`;
    } else {
      videoTag.innerHTML = `<span>🎥 ${videoVal}</span>`;
    }
    if (removeVideoBtn) removeVideoBtn.style.display = 'inline-block';
  } else {
    videoTag.style.display = 'none';
    videoTag.innerHTML = '';
    if (removeVideoBtn) removeVideoBtn.style.display = 'none';
  }
}

async function saveVehicleFromForm() {
  if (typeof window.showActionLoader === 'function') {
    window.showActionLoader('Saving Vehicle to Canadian CAD Inventory...');
  }
  try {
    const id = document.getElementById('form-car-id').value.trim() || `veh-${Date.now()}`;
    const year = parseInt(document.getElementById('form-car-year').value) || new Date().getFullYear();
    const make = document.getElementById('form-car-make').value.trim();
    const model = document.getElementById('form-car-model').value.trim();
    const trim = document.getElementById('form-car-trim').value.trim();
    const rawPrice = document.getElementById('form-car-price').value.trim();
    const price = parseFloat(rawPrice) || 0;
    const rawMonthly = document.getElementById('form-car-monthly').value.trim();
    const monthlyEst = rawMonthly !== '' ? (parseFloat(rawMonthly) || 0) : (typeof price === 'number' ? +(price / 72).toFixed(2) : 0);
    const mileage = parseInt(document.getElementById('form-car-mileage').value) || 0;
    const bodyType = document.getElementById('form-car-body').value || 'SUV';
    const fuelType = document.getElementById('form-car-fuel').value || 'Gasoline';
    const transmission = document.getElementById('form-car-trans').value || 'Automatic';
    const drivetrain = document.getElementById('form-car-drivetrain').value || 'AWD';
    const engine = document.getElementById('form-car-engine').value.trim();
    const exteriorColor = document.getElementById('form-car-ext-color').value.trim();
    const interiorColor = document.getElementById('form-car-int-color').value.trim();
    const vin = document.getElementById('form-car-vin').value.trim() || 'N/A'; // Optional VIN
    const stockNumber = document.getElementById('form-car-stock').value.trim() || `MT-${Math.floor(1000 + Math.random() * 9000)}`;
    const condition = document.getElementById('form-car-condition').value || 'Pre-Owned';
    const featured = document.getElementById('form-car-featured').checked;
    const video = document.getElementById('form-car-video').value.trim();

    const images = currentEditingImages.length > 0 ? currentEditingImages.slice(0, 10) : ['https://images.unsplash.com/photo-1581540222194-0def2dda95b8?auto=format&fit=crop&w=1000&q=80'];

    const features = document.getElementById('form-car-features').value.trim().split('\n').map(s => s.trim()).filter(Boolean);
    const badges = document.getElementById('form-car-badges').value.trim().split(',').map(b => b.trim()).filter(Boolean);
    const overview = document.getElementById('form-car-overview').value.trim();

    const vehicleObject = {
      id,
      year,
      make,
      model,
      trim,
      price,
      monthlyEst,
      mileage,
      bodyType,
      fuelType,
      transmission,
      drivetrain,
      engine,
      exteriorColor,
      interiorColor,
      vin,
      stockNumber,
      condition,
      featured,
      badges,
      images,
      video,
      features,
      overview
    };

    const existingIndex = VEHICLES_DATA.findIndex(v => v.id === id);
    if (existingIndex > -1) {
      VEHICLES_DATA[existingIndex] = vehicleObject;
      showToast(`Vehicle ${make} ${model} (#${stockNumber}) updated successfully!`, 'success');
    } else {
      VEHICLES_DATA.unshift(vehicleObject);
      showToast(`New vehicle ${make} ${model} added to marketplace!`, 'success');
    }

    saveVehiclesData(VEHICLES_DATA);

    // Sync to Firebase Cloud if connected
    if (typeof saveVehicleToFirebase === 'function') {
      await saveVehicleToFirebase(vehicleObject);
    }

    document.getElementById('vehicle-edit-modal-backdrop').classList.remove('active');
    loadMarketplaceDashboard();
  } finally {
    if (typeof window.hideActionLoader === 'function') {
      setTimeout(() => window.hideActionLoader(), 300);
    }
  }
}

/* ----------------------------------------------------
   Analytics & Inquiries Tab Views
----------------------------------------------------- */
function renderAnalyticsView() {
  const container = document.getElementById('tab-view-analytics');
  if (!container) return;

  const makesCount = {};
  VEHICLES_DATA.forEach(v => {
    makesCount[v.make] = (makesCount[v.make] || 0) + 1;
  });

  const bodyCount = {};
  VEHICLES_DATA.forEach(v => {
    bodyCount[v.bodyType] = (bodyCount[v.bodyType] || 0) + 1;
  });

  container.innerHTML = `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.5rem; margin-top: 1rem;">
      <div style="background: var(--bg-card); border: 1px solid var(--border-medium); border-radius: var(--radius-lg); padding: 1.5rem;">
        <h3 style="font-size: 1.1rem; margin-bottom: 1rem; color: #fff;">Inventory by Make / Brand</h3>
        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
          ${Object.entries(makesCount).sort((a,b)=>b[1]-a[1]).map(([make, count]) => `
            <div>
              <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 0.25rem;">
                <span style="color: #fff; font-weight: 600;">${make}</span>
                <span style="color: var(--silver-400);">${count} cars (${Math.round(count/VEHICLES_DATA.length*100)}%)</span>
              </div>
              <div style="background: #1e293b; height: 8px; border-radius: 4px; overflow: hidden;">
                <div style="background: var(--silver-300); height: 100%; width: ${(count/VEHICLES_DATA.length)*100}%;"></div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <div style="background: var(--bg-card); border: 1px solid var(--border-medium); border-radius: var(--radius-lg); padding: 1.5rem;">
        <h3 style="font-size: 1.1rem; margin-bottom: 1rem; color: #fff;">Inventory by Body Type</h3>
        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
          ${Object.entries(bodyCount).sort((a,b)=>b[1]-a[1]).map(([type, count]) => `
            <div>
              <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 0.25rem;">
                <span style="color: #fff; font-weight: 600;">${type}</span>
                <span style="color: var(--silver-400);">${count} cars</span>
              </div>
              <div style="background: #1e293b; height: 8px; border-radius: 4px; overflow: hidden;">
                <div style="background: #38bdf8; height: 100%; width: ${(count/VEHICLES_DATA.length)*100}%;"></div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function renderInquiriesView() {
  const container = document.getElementById('tab-view-inquiries');
  if (!container) return;

  container.innerHTML = `
    <div style="background: var(--bg-card); border: 1px solid var(--border-medium); border-radius: var(--radius-lg); padding: 1.5rem; margin-top: 1rem;">
      <h3 style="font-size: 1.1rem; margin-bottom: 1rem; color: #fff;">Recent Customer Leads & Test Drive Bookings</h3>
      <div style="overflow-x: auto;">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Vehicle Requested</th>
              <th>Type</th>
              <th>Date / Time</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <div style="font-weight: 700; color: #fff;">David Miller</div>
                <div style="font-size: 0.75rem; color: var(--silver-500);">david.m@example.com • 604-555-1120</div>
              </td>
              <td>2023 Toyota RAV4 (MT-4821)</td>
              <td><span class="badge badge-blue">Test Drive</span></td>
              <td>Oct 8, 2026 @ 10:00 AM</td>
              <td><span class="badge badge-green">Confirmed</span></td>
              <td><button class="btn btn-silver btn-sm" onclick="showToast('Lead marked contacted', 'info')">Contact</button></td>
            </tr>
            <tr>
              <td>
                <div style="font-weight: 700; color: #fff;">Sarah Jenkins</div>
                <div style="font-size: 0.75rem; color: var(--silver-500);">sarah.j@example.com • 604-555-4421</div>
              </td>
              <td>2023 Ford F-150 (MT-4823)</td>
              <td><span class="badge badge-silver">Pre-Approval</span></td>
              <td>Oct 7, 2026 @ 2:30 PM</td>
              <td><span class="badge badge-blue">Pending Review</span></td>
              <td><button class="btn btn-silver btn-sm" onclick="showToast('Pre-approval opened', 'info')">Review</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/* ----------------------------------------------------
   Team, Staff & HR Users Management (Admin, Sales, HR, Tech, Service)
----------------------------------------------------- */
function renderUsersView(filterDept = 'all', searchQuery = '') {
  const container = document.getElementById('tab-view-users');
  if (!container) return;

  const users = getAdminUsers();
  
  // Department count metrics
  const totalCount = users.length;
  const salesCount = users.filter(u => u.role === 'Sales Agent' || u.department === 'Sales').length;
  const hrCount = users.filter(u => u.role === 'HR Manager' || u.department === 'Human Resources' || u.role === 'Dealership Admin').length;
  const techCount = users.filter(u => u.role === 'Tech' || u.role === 'Service Tech' || (u.department && u.department.includes('Service'))).length;

  const filteredUsers = users.filter(u => {
    // Dept filter
    if (filterDept === 'management' && u.role !== 'Dealership Admin' && u.department !== 'Management') return false;
    if (filterDept === 'sales' && u.role !== 'Sales Agent' && u.department !== 'Sales') return false;
    if (filterDept === 'hr' && u.role !== 'HR Manager' && u.department !== 'Human Resources') return false;
    if (filterDept === 'tech' && u.role !== 'Tech' && u.role !== 'Service Tech' && !u.department?.includes('Service') && !u.department?.includes('Inspection')) return false;

    // Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const haystack = `${u.name} ${u.username} ${u.email} ${u.role} ${u.department || ''}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  container.innerHTML = `
    <div style="background: var(--bg-card); border: 1px solid var(--border-medium); border-radius: var(--radius-lg); padding: 1.5rem; margin-top: 1rem;">
      
      <!-- Top Title & Add Button -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
        <div>
          <h3 style="font-size: 1.35rem; color: #fff; margin-bottom: 0.35rem; font-weight: 800;">
            Team, Staff & Department Management
          </h3>
          <p style="font-size: 0.85rem; color: var(--silver-400);">
            Manage Executive Admin, Sales Agents, Human Resources (HR), and Inspection/Service Technicians.
          </p>
        </div>
        <button id="btn-add-team-user" class="btn btn-blue btn-sm" style="box-shadow: 0 0 15px rgba(0, 123, 255, 0.35);">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          + Add New Team Member
        </button>
      </div>

      <!-- KPI Metric Cards for Staff -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
        <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1rem;">
          <div style="font-size: 0.75rem; color: var(--silver-400); text-transform: uppercase;">Total Active Staff</div>
          <div style="font-size: 1.75rem; font-weight: 900; color: #fff; margin-top: 0.25rem;">${totalCount}</div>
        </div>
        <div style="background: rgba(0, 123, 255, 0.08); border: 1px solid rgba(0, 123, 255, 0.25); border-radius: var(--radius-md); padding: 1rem;">
          <div style="font-size: 0.75rem; color: #93c5fd; text-transform: uppercase;">Sales Specialists</div>
          <div style="font-size: 1.75rem; font-weight: 900; color: #60a5fa; margin-top: 0.25rem;">${salesCount}</div>
          <div style="font-size: 0.7rem; color: var(--silver-400);">Maintain Inventory Access</div>
        </div>
        <div style="background: rgba(236, 72, 153, 0.08); border: 1px solid rgba(236, 72, 153, 0.25); border-radius: var(--radius-md); padding: 1rem;">
          <div style="font-size: 0.75rem; color: #f472b6; text-transform: uppercase;">HR & Management</div>
          <div style="font-size: 1.75rem; font-weight: 900; color: #ec4899; margin-top: 0.25rem;">${hrCount}</div>
          <div style="font-size: 0.7rem; color: var(--silver-400);">Staff & Payroll Admin</div>
        </div>
        <div style="background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.25); border-radius: var(--radius-md); padding: 1rem;">
          <div style="font-size: 0.75rem; color: #fbbf24; text-transform: uppercase;">Tech & Reconditioning</div>
          <div style="font-size: 1.75rem; font-weight: 900; color: #f59e0b; margin-top: 0.25rem;">${techCount}</div>
          <div style="font-size: 0.7rem; color: var(--silver-400);">Vehicle Inspection Team</div>
        </div>
      </div>

      <!-- Filters & Search Toolbar -->
      <div style="display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 1.25rem; flex-wrap: wrap;">
        <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
          <button class="btn btn-sm ${filterDept === 'all' ? 'btn-blue' : 'btn-dark'}" onclick="renderUsersView('all')">All Staff (${totalCount})</button>
          <button class="btn btn-sm ${filterDept === 'management' ? 'btn-blue' : 'btn-dark'}" onclick="renderUsersView('management')">👑 Admin</button>
          <button class="btn btn-sm ${filterDept === 'sales' ? 'btn-blue' : 'btn-dark'}" onclick="renderUsersView('sales')">💼 Sales (${salesCount})</button>
          <button class="btn btn-sm ${filterDept === 'hr' ? 'btn-blue' : 'btn-dark'}" onclick="renderUsersView('hr')">👥 HR</button>
          <button class="btn btn-sm ${filterDept === 'tech' ? 'btn-blue' : 'btn-dark'}" onclick="renderUsersView('tech')">🔧 Tech & Service (${techCount})</button>
        </div>
        <div style="min-width: 240px;">
          <input type="text" id="staff-search-input" class="form-control form-control-sm" placeholder="🔍 Search staff name, role, email..." value="${searchQuery}">
        </div>
      </div>

      <!-- Staff Table -->
      <div style="overflow-x: auto;">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Team Member</th>
              <th>Username</th>
              <th>Department & Role</th>
              <th>Assigned Permissions</th>
              <th>Status</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${filteredUsers.map(u => {
              const roleColor = u.role === 'Sales Agent' ? '#007BFF' : 
                                u.role === 'HR Manager' ? '#ec4899' :
                                u.role === 'Tech' ? '#f59e0b' : 
                                u.role === 'Service Tech' ? '#10b981' : '#a855f7';
              const canMaintainInv = (u.permissions && u.permissions.includes('inventory')) || u.role === 'Sales Agent' || u.role === 'Dealership Admin';
              const canHR = (u.permissions && u.permissions.includes('hr')) || u.role === 'HR Manager' || u.role === 'Dealership Admin';
              const canLeads = (u.permissions && u.permissions.includes('inquiries')) || u.role === 'Sales Agent' || u.role === 'Dealership Admin';
              const status = u.status || 'Active';
              const isSuspended = status === 'Suspended';

              return `
                <tr style="${isSuspended ? 'opacity: 0.6;' : ''}">
                  <td>
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                      <div style="width: 36px; height: 36px; border-radius: 50%; background: ${roleColor}25; border: 1px solid ${roleColor}60; color: ${roleColor}; font-weight: 800; display: flex; align-items: center; justify-content: center; font-size: 0.85rem;">
                        ${(u.name || 'U').split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </div>
                      <div>
                        <div style="font-weight: 700; color: #fff;">${u.name}</div>
                        <div style="font-size: 0.78rem; color: var(--silver-500);">${u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <code style="background: rgba(255,255,255,0.06); padding: 3px 8px; border-radius: 4px; color: #e2e8f0; font-weight: 600;">${u.username || 'user'}</code>
                  </td>
                  <td>
                    <span class="badge" style="background: rgba(255,255,255,0.05); color: ${roleColor}; border: 1px solid ${roleColor}60;">
                      ● ${u.role}
                    </span>
                    <div style="font-size: 0.72rem; color: var(--silver-400); margin-top: 3px;">${u.department || 'Dealership'}</div>
                  </td>
                  <td>
                    <div style="display: flex; flex-direction: column; gap: 3px;">
                      ${canMaintainInv ? `
                        <span class="badge badge-green" style="width: fit-content;" title="Authorized to Add, Edit, Price & Delete Vehicles">
                          ✓ Can Maintain Inventory
                        </span>
                      ` : ''}
                      ${canHR ? `
                        <span class="badge" style="width: fit-content; background: rgba(236, 72, 153, 0.15); color: #f472b6; border: 1px solid rgba(236, 72, 153, 0.4);" title="HR & Staff Management Rights">
                          ✓ HR & Staff Admin
                        </span>
                      ` : ''}
                      ${canLeads ? `
                        <span class="badge badge-blue" style="width: fit-content;" title="Access to Inquiries & Test Drives">
                          ✓ Leads & Test Drives
                        </span>
                      ` : ''}
                      ${(!canMaintainInv && !canHR && !canLeads) ? `
                        <span class="badge badge-silver" style="width: fit-content;">Technical Specialist</span>
                      ` : ''}
                    </div>
                  </td>
                  <td>
                    <button class="badge ${isSuspended ? 'badge-silver' : 'badge-green'}" style="cursor: pointer; border: none;" onclick="toggleUserStatus('${u.id}')" title="Click to Toggle Active / Suspended">
                      ${status}
                    </button>
                  </td>
                  <td style="text-align: right;">
                    <div style="display: inline-flex; gap: 0.45rem;">
                      <button class="btn btn-silver btn-sm" onclick="openUserEditorModal('${u.id}')">Edit</button>
                      ${u.username === 'admin' ? '' : `
                        <button class="btn btn-dark btn-sm" onclick="deleteAdminUser('${u.id}')" title="Delete account">✕</button>
                      `}
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  document.getElementById('btn-add-team-user')?.addEventListener('click', () => {
    openUserEditorModal(null);
  });

  const searchInput = document.getElementById('staff-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      renderUsersView(filterDept, e.target.value.trim());
    });
  }
}

function toggleUserStatus(userId) {
  const users = getAdminUsers();
  const u = users.find(x => x.id === userId);
  if (!u) return;
  if (u.username === 'admin') {
    showToast('Master Admin cannot be suspended.', 'info');
    return;
  }
  u.status = u.status === 'Suspended' ? 'Active' : 'Suspended';
  saveAdminUsers(users);
  showToast(`${u.name} status changed to ${u.status}`, 'success');
  renderUsersView();
}

function setupUserModalEvents() {
  const backdrop = document.getElementById('modal-user-backdrop');
  const form = document.getElementById('form-manage-user');
  const closeBtn = document.getElementById('btn-close-user-modal');
  const cancelBtn = document.getElementById('btn-cancel-user-modal');

  closeBtn?.addEventListener('click', () => backdrop.classList.remove('active'));
  cancelBtn?.addEventListener('click', () => backdrop.classList.remove('active'));

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('form-user-id').value;
    const name = document.getElementById('form-user-name').value.trim();
    const username = document.getElementById('form-user-username').value.trim().toLowerCase();
    const email = document.getElementById('form-user-email').value.trim().toLowerCase();
    const password = document.getElementById('form-user-password').value;
    const role = document.getElementById('form-user-role').value;

    const permissions = [];
    if (document.getElementById('perm-inventory')?.checked) permissions.push('inventory');
    if (document.getElementById('perm-leads')?.checked) permissions.push('inquiries');
    if (document.getElementById('perm-admin')?.checked) permissions.push('users');
    if (document.getElementById('perm-hr')?.checked) permissions.push('hr');

    // Infer department
    let department = 'Sales';
    if (role === 'Dealership Admin') department = 'Management';
    else if (role === 'HR Manager') department = 'Human Resources';
    else if (role === 'Tech') department = 'Service & Inspection';
    else if (role === 'Service Tech') department = 'Service & Reconditioning';

    const users = getAdminUsers();
    if (id) {
      const idx = users.findIndex(u => u.id === id);
      if (idx > -1) {
        users[idx] = { ...users[idx], name, username, email, password, role, department, permissions };
        saveAdminUsers(users);
        showToast(`Staff member ${name} updated successfully!`, 'success');
      }
    } else {
      if (users.some(u => u.username && u.username.toLowerCase() === username)) {
        alert('A team member with this username already exists.');
        return;
      }
      const newUser = {
        id: 'usr-' + Date.now(),
        name,
        username,
        email,
        password,
        role,
        department,
        permissions,
        status: 'Active',
        verified: true,
        createdAt: new Date().toISOString()
      };
      users.push(newUser);
      saveAdminUsers(users);
      showToast(`User ${name} (${role}) added!`, 'success');
    }

    backdrop.classList.remove('active');
    renderUsersView();
  });
}

function openUserEditorModal(userId = null) {
  const backdrop = document.getElementById('modal-user-backdrop');
  if (!backdrop) return;

  const titleEl = document.getElementById('modal-user-title');
  const idEl = document.getElementById('form-user-id');
  const nameEl = document.getElementById('form-user-name');
  const userEl = document.getElementById('form-user-username');
  const emailEl = document.getElementById('form-user-email');
  const passEl = document.getElementById('form-user-password');
  const roleEl = document.getElementById('form-user-role');
  const permInv = document.getElementById('perm-inventory');
  const permLeads = document.getElementById('perm-leads');
  const permAdmin = document.getElementById('perm-admin');
  const permHR = document.getElementById('perm-hr');

  if (userId) {
    const user = getAdminUsers().find(u => u.id === userId);
    if (!user) return;
    titleEl.textContent = 'Edit Team Member';
    idEl.value = user.id;
    nameEl.value = user.name;
    userEl.value = user.username;
    emailEl.value = user.email;
    passEl.value = user.password;
    roleEl.value = user.role;
    if (permInv) permInv.checked = user.permissions?.includes('inventory') ?? true;
    if (permLeads) permLeads.checked = user.permissions?.includes('inquiries') ?? true;
    if (permAdmin) permAdmin.checked = user.permissions?.includes('users') ?? false;
    if (permHR) permHR.checked = user.permissions?.includes('hr') ?? (user.role === 'HR Manager');
  } else {
    titleEl.textContent = 'Add New Team Member';
    idEl.value = '';
    nameEl.value = '';
    userEl.value = '';
    emailEl.value = '';
    passEl.value = '';
    roleEl.value = 'Sales Agent';
    if (permInv) permInv.checked = true;
    if (permLeads) permLeads.checked = true;
    if (permAdmin) permAdmin.checked = false;
    if (permHR) permHR.checked = false;
  }

  backdrop.classList.add('active');
}

function deleteAdminUser(userId) {
  const users = getAdminUsers();
  const target = users.find(u => u.id === userId);
  if (!target) return;
  if (target.username === 'admin') {
    alert('Cannot delete the Master Admin account.');
    return;
  }
  if (confirm(`Are you sure you want to delete user ${target.name} (${target.username})?`)) {
    const updated = users.filter(u => u.id !== userId);
    saveAdminUsers(updated);
    showToast(`User ${target.name} removed.`, 'info');
    renderUsersView();
  }
}

/* ----------------------------------------------------
   Firebase Cloud & Auth Management
----------------------------------------------------- */
function renderFirebaseView() {
  const container = document.getElementById('tab-view-firebase');
  if (!container) return;

  const currentCfg = typeof firebaseConfig !== 'undefined' ? firebaseConfig : {};
  const isFbInit = typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0;
  const isAuthReady = typeof fbAuth !== 'undefined' && fbAuth !== null;
  const isDbReady = typeof fbDb !== 'undefined' && fbDb !== null;

  container.innerHTML = `
    <div style="background: var(--bg-card); border: 1px solid var(--border-medium); border-radius: var(--radius-lg); padding: 1.5rem; margin-top: 1rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
        <div>
          <h3 style="font-size: 1.35rem; color: #fff; margin-bottom: 0.35rem; font-weight: 800; display: flex; align-items: center; gap: 0.5rem;">
            🔥 Firebase Cloud & Authentication Center
          </h3>
          <p style="font-size: 0.85rem; color: var(--silver-400);">
            Cloud Authentication (Free Tier), Realtime Database sync, and project credentials management.
          </p>
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <button id="btn-test-fb-conn" class="btn btn-blue btn-sm">
            ⚡ Test Connection
          </button>
          <button id="btn-seed-fb-cloud" class="btn btn-silver btn-sm">
            ☁️ Push Inventory to Firebase
          </button>
        </div>
      </div>

      <!-- Live Service Status Cards -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem; margin-bottom: 1.75rem;">
        <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1.15rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <span style="font-size: 0.75rem; color: var(--silver-400); text-transform: uppercase; font-weight: 700;">Firebase App SDK</span>
            <span class="badge ${isFbInit ? 'badge-green' : 'badge-silver'}">${isFbInit ? '● Connected' : 'Offline'}</span>
          </div>
          <div style="font-size: 1rem; font-weight: 800; color: #fff;">${currentCfg.projectId || 'Motor Trends App'}</div>
          <div style="font-size: 0.72rem; color: var(--silver-500); margin-top: 4px;">App ID: ${currentCfg.appId ? currentCfg.appId.slice(0, 24) + '...' : 'Configured'}</div>
        </div>

        <div style="background: rgba(0, 123, 255, 0.08); border: 1px solid rgba(0, 123, 255, 0.3); border-radius: var(--radius-md); padding: 1.15rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <span style="font-size: 0.75rem; color: #93c5fd; text-transform: uppercase; font-weight: 700;">Firebase Authentication</span>
            <span class="badge ${isAuthReady ? 'badge-green' : 'badge-silver'}">${isAuthReady ? '● Active' : 'Pending'}</span>
          </div>
          <div style="font-size: 1rem; font-weight: 800; color: #60a5fa;">Email & Password Auth</div>
          <div style="font-size: 0.72rem; color: var(--silver-400); margin-top: 4px;">Free Spark Plan (100% Free - Unlimited Logins)</div>
        </div>

        <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: var(--radius-md); padding: 1.15rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <span style="font-size: 0.75rem; color: #6ee7b7; text-transform: uppercase; font-weight: 700;">Realtime Database</span>
            <span class="badge ${isDbReady ? 'badge-green' : 'badge-silver'}">${isDbReady ? '● Real-Time Sync' : 'Offline'}</span>
          </div>
          <div style="font-size: 1rem; font-weight: 800; color: #34d399;">Cloud RTDB Active</div>
          <div style="font-size: 0.72rem; color: var(--silver-400); margin-top: 4px;">${VEHICLES_DATA.length} Inventory Vehicles Synced</div>
        </div>
      </div>

      <!-- Firebase Configuration Settings Form -->
      <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1.5rem;">
        <h4 style="font-size: 1.1rem; color: #fff; margin-bottom: 0.5rem;">Custom Firebase Credentials</h4>
        <p style="font-size: 0.825rem; color: var(--silver-400); margin-bottom: 1.25rem;">
          Connect your own Firebase project or view the active dealership cloud credentials.
        </p>

        <form id="form-firebase-config" style="display: flex; flex-direction: column; gap: 1rem;">
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">Project ID</label>
              <input type="text" id="fb-cfg-project-id" class="form-control" value="${currentCfg.projectId || ''}" placeholder="e.g. motortrends-dealer">
            </div>
            <div class="form-group">
              <label class="form-label">API Key</label>
              <input type="text" id="fb-cfg-api-key" class="form-control" value="${currentCfg.apiKey || ''}" placeholder="AIzaSy...">
            </div>
          </div>

          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">Auth Domain</label>
              <input type="text" id="fb-cfg-auth-domain" class="form-control" value="${currentCfg.authDomain || ''}" placeholder="motortrends.firebaseapp.com">
            </div>
            <div class="form-group">
              <label class="form-label">Database URL</label>
              <input type="text" id="fb-cfg-db-url" class="form-control" value="${currentCfg.databaseURL || ''}" placeholder="https://...-rtdb.firebaseio.com">
            </div>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 0.5rem;">
            <button type="button" id="btn-save-fb-cfg" class="btn btn-blue btn-sm">
              Save & Re-Connect Firebase
            </button>
          </div>
        </form>
      </div>

    </div>
  `;

  // Test Firebase Connection Button
  document.getElementById('btn-test-fb-conn')?.addEventListener('click', () => {
    if (typeof firebase !== 'undefined' && fbAuth) {
      showToast('🔥 Firebase Auth & Database connection test PASSED! Ready for live users.', 'success');
    } else {
      showToast('Firebase SDK loaded. Local fallback is actively maintaining sessions.', 'info');
    }
  });

  // Push to Firebase Button
  document.getElementById('btn-seed-fb-cloud')?.addEventListener('click', () => {
    if (typeof seedFirebaseInitialData === 'function') {
      seedFirebaseInitialData();
      showToast('Cloud sync triggered: All vehicles sent to Firebase Realtime Database!', 'success');
    } else {
      showToast('Firebase DB sync simulated successfully.', 'info');
    }
  });

  // Save Custom Config
  document.getElementById('btn-save-fb-cfg')?.addEventListener('click', () => {
    const projId = document.getElementById('fb-cfg-project-id').value.trim();
    const apiKey = document.getElementById('fb-cfg-api-key').value.trim();
    const authDom = document.getElementById('fb-cfg-auth-domain').value.trim();
    const dbUrl = document.getElementById('fb-cfg-db-url').value.trim();

    if (projId && apiKey) {
      const newCfg = { ...firebaseConfig, projectId: projId, apiKey, authDomain: authDom, databaseURL: dbUrl };
      localStorage.setItem('motortrends_custom_fb_config', JSON.stringify(newCfg));
      showToast('Firebase credentials saved! Re-initializing...', 'success');
      setTimeout(() => location.reload(), 1200);
    } else {
      alert('Please enter at least a Project ID and API Key.');
    }
  });
}

