/**
 * Motor Trends Auto Group Admin Portal Controller
 * Authentication, Registration, Email Verification Simulation & Full Marketplace Management
 */

const ADMIN_STORAGE_KEY_USERS = 'motortrends_admin_users_v5';
const ADMIN_STORAGE_KEY_SESSION = 'motortrends_admin_session';
const SYSTEM_SETTINGS_KEY = 'motortrends_system_settings_v1';

const DEFAULT_SYSTEM_SETTINGS = {
  maxUploadSlots: 12,
  maxInventoryLimit: 25,
  salesPassword: '^^0ToRTre&d$',
  superAdminEmail: 'rclickspro@gmail.com'
};

function getSystemSettings() {
  try {
    const raw = localStorage.getItem(SYSTEM_SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SYSTEM_SETTINGS, ...parsed };
    }
  } catch (e) {
    console.warn('Error reading system settings:', e);
  }
  return { ...DEFAULT_SYSTEM_SETTINGS };
}

function saveSystemSettings(newSettings) {
  const current = getSystemSettings();
  const merged = { ...current, ...newSettings };
  localStorage.setItem(SYSTEM_SETTINGS_KEY, JSON.stringify(merged));
  return merged;
}

function isSuperAdminUser() {
  if (!currentAdminUser) return false;
  const role = (currentAdminUser.role || '').toLowerCase();
  const email = (currentAdminUser.email || '').toLowerCase();
  const username = (currentAdminUser.username || '').toLowerCase();
  const settings = getSystemSettings();
  const superEmail = (settings.superAdminEmail || 'rclickspro@gmail.com').toLowerCase();
  return email === superEmail || username === 'superadmin' || role === 'super admin' || (currentAdminUser.permissions && currentAdminUser.permissions.includes('settings'));
}

function isSalesUser() {
  if (typeof window !== 'undefined') {
    const p = (window.location.pathname || '').toLowerCase();
    if (p.includes('sales') || p.endsWith('/sales') || p.endsWith('/sales.html')) return true;
  }
  if (!currentAdminUser) return false;
  const role = (currentAdminUser.role || '').toLowerCase();
  const username = (currentAdminUser.username || '').toLowerCase();
  return role === 'sales agent' || role.includes('sales') || username.startsWith('sales');
}

const DEFAULT_USERS = [
  {
    id: 'usr-superadmin-01',
    name: 'Executive Super Admin',
    username: 'superadmin',
    email: 'superadmin@motortrendsautogroup.com',
    password: '!@uto#@u$',
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
    email: 'sales@motortrends.ca',
    password: '^^0ToRTre&d$',
    role: 'Sales Agent',
    department: 'Sales',
    permissions: ['inventory', 'inquiries'],
    status: 'Active',
    verified: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'usr-sales-02',
    name: 'Sales Agent 1',
    username: 'sales1',
    email: 'sales1@motortrends.ca',
    password: 'sales 8855678',
    role: 'Sales Agent',
    department: 'Sales',
    permissions: ['inventory', 'inquiries'],
    status: 'Active',
    verified: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'usr-admin-01',
    name: 'Motor Trends Dealership Manager',
    username: 'admin',
    email: 'admin@motortrendsautogroup.com',
    password: '!@uto#@u$',
    role: 'Dealership Admin',
    department: 'Management',
    permissions: ['inventory', 'inquiries', 'users', 'analytics', 'hr', 'settings'],
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
    const relevantKeys = [
      'motortrends_vehicles_db_live',
      'motortrends_vehicles_db_live_legacy',
      'motortrends_vehicles_db_v3',
      'motortrends_vehicles_db',
      'motortrends_deleted_vehicles_ids_live',
      'motortrends_deleted_vehicles_ids'
    ];
    if (relevantKeys.includes(e.key)) {
      const updated = (typeof getStoredVehicles === 'function') ? getStoredVehicles() : [];
      VEHICLES_DATA.length = 0;
      VEHICLES_DATA.push(...updated);
      loadMarketplaceDashboard();
    }
  });
}

/* ----------------------------------------------------
   Auth & User Database Management
----------------------------------------------------- */
function initAdminUsersDB() {
  const users = getAdminUsers();
  let changed = false;
  DEFAULT_USERS.forEach(defU => {
    const existing = users.find(u => u.username && u.username.toLowerCase() === defU.username.toLowerCase());
    if (!existing) {
      users.push({ ...defU });
      changed = true;
    } else {
      // Sync credentials so staff_accounts.txt always works out-of-the-box
      if (defU.password && existing.password !== defU.password) {
        existing.password = defU.password;
        changed = true;
      }
    }
  });
  if (changed || users.length === 0) {
    saveAdminUsers(users);
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
    const avatarBadge = document.getElementById('admin-user-avatar-badge');
    if (avatarBadge) {
      avatarBadge.textContent = (currentAdminUser.name || 'Admin').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    }
  }

  const isSales = isSalesUser();
  const isSuper = isSuperAdminUser();

  // Navigation visibility based on role
  if (isSales) {
    document.querySelectorAll('.admin-nav-item[data-tab]').forEach(i => {
      if (i.dataset.tab !== 'vehicles') {
        const li = i.closest('li');
        if (li) li.style.display = 'none';
        else i.style.display = 'none';
      }
    });
    currentTab = 'vehicles';
  } else {
    document.querySelectorAll('.admin-nav-item[data-tab]').forEach(i => {
      const li = i.closest('li');
      if (li) li.style.display = 'block';
      else i.style.display = 'flex';
    });
    const settingsNav = document.getElementById('nav-item-settings');
    if (settingsNav) {
      const li = settingsNav.closest('li');
      if (li) li.style.display = isSuper ? 'block' : 'none';
      else settingsNav.style.display = isSuper ? 'flex' : 'none';
    }
  }

  // Ensure active tab state is synchronized
  currentTab = currentTab || 'vehicles';
  document.querySelectorAll('.admin-nav-item[data-tab]').forEach(i => {
    if (i.dataset.tab === currentTab) i.classList.add('active');
    else i.classList.remove('active');
  });
  switchAdminTab(currentTab);
  loadMarketplaceDashboard();

  if (typeof window.hideActionLoader === 'function') {
    setTimeout(() => window.hideActionLoader(), 350);
  }
}

/* ----------------------------------------------------
   Auth Event Listeners (Login, Register, OTP Verify)
----------------------------------------------------- */
function setupAuthEventListeners() {
  // Google Sign-In (Super Admin: rclickspro@gmail.com)
  const googleBtn = document.getElementById('btn-google-signin');
  if (googleBtn) {
    googleBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        if (typeof window.showActionLoader === 'function') {
          window.showActionLoader('Initiating Google Authentication for Super Admin...');
        }
        if (typeof firebase === 'undefined' || !fbAuth) {
          throw new Error('Firebase Auth service is not ready. Please try again.');
        }
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        const result = await fbAuth.signInWithPopup(provider);
        const fbUser = result.user;
        const userEmail = (fbUser.email || '').toLowerCase();
        const settings = getSystemSettings();
        const targetSuperEmail = (settings.superAdminEmail || 'rclickspro@gmail.com').toLowerCase();

        if (userEmail === targetSuperEmail || userEmail === 'rclickspro@gmail.com') {
          const superUser = {
            id: fbUser.uid,
            name: fbUser.displayName || 'Super Admin (Google)',
            username: 'superadmin',
            email: fbUser.email,
            role: 'Super Admin',
            department: 'Executive Management',
            permissions: ['inventory', 'inquiries', 'users', 'analytics', 'hr', 'settings'],
            verified: true,
            authProvider: 'google',
            avatar: fbUser.photoURL || ''
          };
          currentAdminUser = superUser;
          localStorage.setItem(ADMIN_STORAGE_KEY_SESSION, JSON.stringify(superUser));
          showToast(`👑 Welcome, Super Admin (${fbUser.email})! Signed in via Google.`, 'success');
          showDashboardView();
        } else {
          await fbAuth.signOut().catch(() => {});
          if (typeof window.hideActionLoader === 'function') window.hideActionLoader();
          showAuthAlert(`Access Denied: ${fbUser.email} is not authorized for Super Admin sign-in. Required email: ${targetSuperEmail}`, 'error');
          alert(`Access Denied: Only ${targetSuperEmail} is authorized to sign in as Super Admin via Google.`);
        }
      } catch (err) {
        console.error('Google Sign-In Error:', err);
        if (typeof window.hideActionLoader === 'function') window.hideActionLoader();
        showAuthAlert(`Google Sign-In: ${err.message || 'Operation failed or popup closed.'}`, 'error');
      }
    });
  }

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

      // 1. Check Default Accounts & Local Staff Database
      const localUsers = getAdminUsers();
      const allStaff = [...DEFAULT_USERS];
      localUsers.forEach(u => {
        if (!allStaff.some(s => s.username && s.username.toLowerCase() === u.username.toLowerCase())) {
          allStaff.push(u);
        }
      });

      const sysSettings = getSystemSettings();
      const dynamicSalesPassword = sysSettings.salesPassword || '^^0ToRTre&d$';

      const matchedUser = allStaff.find(u => {
        const uName = (u.username || '').toLowerCase();
        const uEmail = (u.email || '').toLowerCase();
        const isUserMatch = (uName === userInput || uEmail === userInput);
        if (!isUserMatch) return false;

        const cleanPass = (password || '').trim();
        const cleanNoSpacePass = cleanPass.replace(/\s+/g, '').toLowerCase();

        // 1. Superadmin designated credentials
        if (uName === 'superadmin' && (cleanPass === '!@uto#@u$' || cleanPass === 'superadmin')) return true;

        // 2. Admin designated credentials
        if (uName === 'admin' && (cleanPass === '!@uto#@u$' || cleanPass.toLowerCase() === 'admin' || cleanPass.toLowerCase() === 'admin123')) return true;

        // 3. Sales credentials (sales / sales@motortrends.ca)
        if (uName === 'sales') {
          if (cleanPass === dynamicSalesPassword || cleanPass === '^^0ToRTre&d$') return true;
          if (cleanPass.toLowerCase() === 'sales' || cleanPass.toLowerCase() === 'sales123') return true;
          if (cleanNoSpacePass === 'sales8855678') return true;
        }

        // 4. Sales1 credentials (sales1 / sales1@motortrends.ca)
        if (uName === 'sales1') {
          if (cleanNoSpacePass === 'sales8855678' || cleanPass === 'sales 8855678') return true;
          if (cleanPass.toLowerCase() === 'sales1' || cleanPass.toLowerCase() === 'sales' || cleanPass === '^^0ToRTre&d$') return true;
        }

        // 5. General matching against stored user record
        if (u.password === password || u.password === cleanPass) return true;
        if (u.password && u.password.replace(/\s+/g, '').toLowerCase() === cleanNoSpacePass) return true;
        if (password === u.password + '123') return true;

        return false;
      });

      if (matchedUser) {
        currentAdminUser = matchedUser;
        localStorage.setItem(ADMIN_STORAGE_KEY_SESSION, JSON.stringify(matchedUser));
        showToast(`Welcome back, ${matchedUser.name}! (${matchedUser.role})`, 'success');
        showDashboardView();
        loadMarketplaceDashboard();
        return;
      }

      // 2. Check Firebase Authentication (if email or Firebase Auth initialized)
      if (typeof firebase !== 'undefined' && typeof fbAuth !== 'undefined' && fbAuth && (userInput.includes('@') || password.length >= 6)) {
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
          showAuthAlert(`Login Note: ${error.message}`, 'error');
          return;
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Sign In to Portal';
          }
        }
      }

      // If all failed
      if (typeof window.hideActionLoader === 'function') {
        window.hideActionLoader();
      }
      showAuthAlert('Invalid credentials. Please verify your username/email and password, or sign in via Google.', 'error');
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

  // Logout Buttons (Top Navbar, Sidebar Header, and User Profile)
  document.querySelectorAll('.btn-admin-logout-trigger, #btn-admin-logout').forEach(btn => {
    btn.addEventListener('click', async (e) => {
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
  });
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
  document.querySelectorAll('.admin-nav-item[data-tab]').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('.admin-nav-item[data-tab]').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      const tab = item.dataset.tab;
      currentTab = tab || 'vehicles';
      switchAdminTab(currentTab);
    });
  });

  // Add New Vehicle Button (Max capacity check: 25)
  document.getElementById('btn-add-vehicle')?.addEventListener('click', () => {
    const settings = getSystemSettings();
    const maxInv = settings.maxInventoryLimit || 25;
    if (VEHICLES_DATA.length >= maxInv) {
      showToast('Inventory full, contact support', 'error');
      alert('Inventory full, contact support');
      return;
    }
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
  // Sales agents only have access to vehicles tab
  if (isSalesUser() && tabName !== 'vehicles') {
    tabName = 'vehicles';
  }

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
  if (tabName === 'settings') renderSettingsView();
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
  const featuredCount = VEHICLES_DATA.filter(v => v.featured).length;
  const newCount = VEHICLES_DATA.filter(v => v.isNewVehicle).length;
  const slideshowCount = VEHICLES_DATA.filter(v => v.heroSlide || v.isSlideshow).length;

  const totalEl = document.getElementById('kpi-total-inventory');
  if (totalEl) totalEl.textContent = totalVehicles;
  const certEl = document.getElementById('kpi-certified-count');
  if (certEl) certEl.textContent = certifiedCount;
  const valEl = document.getElementById('kpi-total-value');
  if (valEl) valEl.textContent = formatPrice(totalValue);
  const featEl = document.getElementById('kpi-featured-count');
  if (featEl) featEl.textContent = featuredCount;
  const newEl = document.getElementById('kpi-new-count');
  if (newEl) newEl.textContent = newCount;
  const slideEl = document.getElementById('kpi-slideshow-count');
  if (slideEl) slideEl.textContent = slideshowCount;
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
    if (statusFilter === 'new' && !car.isNewVehicle) return false;
    if (statusFilter === 'slideshow' && !(car.heroSlide || car.isSlideshow)) return false;
    if (statusFilter === 'certified' && car.condition !== 'Certified Pre-Owned') return false;
    if (statusFilter === 'preowned' && car.condition !== 'Pre-Owned') return false;
    if (statusFilter === 'testdrive' && !car.onTestDrive) return false;

    return true;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 3rem; color: #64748B;">
          No vehicles found matching your criteria. Try adjusting your search query or filters.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(car => `
    <tr>
      <td style="width: 75px;">
        <img src="${(Array.isArray(car.images) && car.images[0]) ? car.images[0] : 'https://images.unsplash.com/photo-1581540222194-0def2dda95b8?auto=format&fit=crop&w=400&q=80'}" alt="${car.model || 'Vehicle'}" style="width: 70px; height: 48px; object-fit: cover; border-radius: 6px; border: 1px solid #CBD5E1;">
      </td>
      <td>
        <div style="font-weight: 700; color: #0F172A; font-size: 0.95rem;">${car.year} ${car.make} ${car.model}</div>
        <div style="font-size: 0.8rem; color: #475569;">${car.trim || ''}</div>
        <div style="font-size: 0.75rem; color: #64748B; font-family: monospace;">VIN: ${car.vin && car.vin !== 'N/A' ? car.vin : '<span style="font-style: italic; color: #94A3B8;">(Optional)</span>'}</div>
      </td>
      <td>
        <div style="font-size: 0.85rem; font-weight: 700; color: #1E293B;">${car.stockNumber || 'MT-NEW'}</div>
        <div style="display: flex; gap: 4px; flex-wrap: wrap; margin-top: 3px;">
          ${car.onTestDrive ? `<span class="badge" style="background:#ECFDF5; color:#065F46; border:1px solid #A7F3D0; font-size:0.68rem; padding:2px 6px; font-weight:700;">🚗 On Test Drive</span>` : ''}
          ${car.isNewVehicle ? `<span class="badge" style="background:#FEE2E2; color:#B91C1C; border:1px solid #FCA5A5; font-size:0.68rem; padding:2px 5px;">🔥 New</span>` : ''}
          ${(car.heroSlide || car.isSlideshow) ? `<span class="badge" style="background:#E0E7FF; color:#3730A3; border:1px solid #C7D2FE; font-size:0.68rem; padding:2px 5px;">🎬 Slide</span>` : ''}
          <span class="badge" style="background:#F1F5F9; color:#334155; border:1px solid #CBD5E1; font-size:0.68rem; padding:2px 5px;">
            ${car.condition || 'Pre-Owned'}
          </span>
        </div>
      </td>
      <td>
        <div style="font-size: 0.85rem; color: #1E293B; font-weight: 600;">${car.bodyType || 'SUV'} • ${car.fuelType || 'Gasoline'}</div>
        <div style="font-size: 0.8rem; color: #64748B;">${formatNumber(car.mileage || 0)} km • ${car.drivetrain || 'AWD'}</div>
      </td>
      <td>
        <div style="font-weight: 800; font-size: 1.05rem; color: #1B3A6B;">${formatPrice(car.price)}</div>
        <div style="font-size: 0.78rem; color: #64748B; font-weight: 500;">Stock #${car.stockNumber || car.id}</div>
      </td>
      <td style="text-align: center;">
        ${isSalesUser() ? `
          <div style="font-size: 0.75rem; color: #64748B; font-weight: 600;">
            ${car.onTestDrive ? '<span class="badge" style="background:#ECFDF5; color:#065F46; border:1px solid #A7F3D0; font-weight:700; margin-bottom:2px; display:inline-block;">🚗 On Test Drive</span><br>' : ''}
            ${car.featured ? '<span class="badge" style="background:#FEF3C7; color:#92400E; margin-bottom:2px; display:inline-block;">⭐ Featured</span><br>' : ''}
            ${car.isNewVehicle ? '<span class="badge" style="background:#FEE2E2; color:#B91C1C; margin-bottom:2px; display:inline-block;">🔥 New</span><br>' : ''}
            ${(car.heroSlide || car.isSlideshow) ? '<span class="badge" style="background:#E0E7FF; color:#3730A3; display:inline-block;">🎬 Slide</span>' : '<span style="color:#94a3b8; font-size:0.75rem;">Standard</span>'}
          </div>
        ` : `
          <div style="display: inline-flex; flex-direction: column; gap: 4px; width: 145px;">
            <button class="btn-toggle-featured ${car.featured ? 'active' : ''}" data-id="${car.id}" title="Toggle Featured on Homepage">
              ${car.featured ? '⭐ Featured: ON' : '☆ Featured: OFF'}
            </button>
            <button class="btn-toggle-new ${car.isNewVehicle ? 'active' : ''}" data-id="${car.id}" title="Toggle New Arrival Badge">
              ${car.isNewVehicle ? '🔥 New Arrival: ON' : '⚪ New Arrival: OFF'}
            </button>
            <button class="btn-toggle-slideshow ${(car.heroSlide || car.isSlideshow) ? 'active' : ''}" data-id="${car.id}" title="Toggle Homepage Hero Slideshow">
              ${(car.heroSlide || car.isSlideshow) ? '🎬 Slideshow: ON' : '⚪ Slideshow: OFF'}
            </button>
          </div>
        `}
      </td>
      <td style="text-align: right;">
        ${isSalesUser() ? `
          <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 6px;">
            <label style="display: inline-flex; align-items: center; gap: 6px; font-size: 0.78rem; font-weight: 700; cursor: pointer; color: ${car.onTestDrive ? '#047857' : '#475569'}; background: ${car.onTestDrive ? '#ECFDF5' : '#F1F5F9'}; border: 1.5px solid ${car.onTestDrive ? '#10B981' : '#CBD5E1'}; padding: 4px 8px; border-radius: 6px; user-select: none;">
              <input type="checkbox" class="cb-toggle-test-drive" data-id="${car.id}" ${car.onTestDrive ? 'checked' : ''} style="cursor: pointer; width: 15px; height: 15px; accent-color: #059669;">
              <span>On Test Drive</span>
            </label>
            ${car.onTestDrive ? `
              <button class="btn btn-sm btn-mark-sold" data-id="${car.id}" title="Mark Vehicle as Sold" style="background: #10B981; color: #FFFFFF; border: 1px solid #059669; padding: 0.45rem 1rem; font-weight: 700; border-radius: 6px; display: inline-flex; align-items: center; gap: 5px; box-shadow: 0 2px 4px rgba(16, 185, 129, 0.25); cursor: pointer;">
                🏷️ Sold
              </button>
            ` : `
              <button class="btn btn-dark btn-sm btn-delete-car" data-id="${car.id}" title="Remove Vehicle" style="color: #ef4444; border-color: rgba(239, 68, 68, 0.4); padding: 0.45rem 0.85rem; font-weight: 700;">
                🗑️ Remove
              </button>
            `}
          </div>
        ` : `
          <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 6px;">
            <label style="display: inline-flex; align-items: center; gap: 5px; font-size: 0.74rem; font-weight: 700; cursor: pointer; color: ${car.onTestDrive ? '#047857' : '#64748B'}; background: ${car.onTestDrive ? '#ECFDF5' : '#F8FAFC'}; border: 1.5px solid ${car.onTestDrive ? '#10B981' : '#E2E8F0'}; padding: 3px 6px; border-radius: 4px; user-select: none;">
              <input type="checkbox" class="cb-toggle-test-drive" data-id="${car.id}" ${car.onTestDrive ? 'checked' : ''} style="cursor: pointer; width: 14px; height: 14px; accent-color: #059669;">
              <span>On Test Drive</span>
            </label>
            <div style="display: flex; gap: 0.4rem; justify-content: flex-end;">
              <button class="btn btn-silver btn-sm btn-edit-car" data-id="${car.id}" title="Edit Vehicle Details &amp; Options" style="font-size: 0.78rem; padding: 0.4rem 0.65rem;">
                ✏️ Edit
              </button>
              <button class="btn btn-outline btn-sm btn-view-live-car" data-id="${car.id}" title="Preview in Marketplace" style="display: inline-flex; align-items: center; justify-content: center; padding: 0.4rem 0.55rem;">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="pointer-events: none;"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
              </button>
              ${car.onTestDrive ? `
                <button class="btn btn-sm btn-mark-sold" data-id="${car.id}" title="Mark Vehicle as Sold" style="background: #10B981; color: #FFFFFF; border: 1px solid #059669; padding: 0.4rem 0.65rem; font-weight: 700; border-radius: 4px; cursor: pointer;">
                  🏷️ Sold
                </button>
              ` : `
                <button class="btn btn-dark btn-sm btn-delete-car" data-id="${car.id}" title="Delete Vehicle from Inventory" style="color: #ef4444; padding: 0.4rem 0.55rem;">
                  🗑️
                </button>
              `}
            </div>
          </div>
        `}
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

  // Delete vehicle permanently from inventory
  document.querySelectorAll('.btn-delete-car').forEach(btn => {
    btn.addEventListener('click', async () => {
      const carId = btn.dataset.id;
      const car = getVehicleById(carId) || VEHICLES_DATA.find(v => String(v.id) === String(carId));
      const carTitle = car ? `"${car.year} ${car.make} ${car.model}" (Stock #${car.stockNumber || car.id})` : `Vehicle #${carId}`;
      if (confirm(`Are you sure you want to permanently delete ${carTitle} from the marketplace?`)) {
        if (typeof window.showActionLoader === 'function') {
          window.showActionLoader('Removing Vehicle from CAD Inventory...');
        }
        try {
          // 1. Mark permanently deleted in tombstone storage so it never resurrects
          if (typeof addDeletedVehicleId === 'function') {
            addDeletedVehicleId(carId);
            if (car && car.stockNumber) addDeletedVehicleId(String(car.stockNumber));
          }

          // 2. Remove immediately from local working array and storage
          if (typeof deleteVehicleLocally === 'function') {
            deleteVehicleLocally(carId);
          }
          if (typeof VEHICLES_DATA !== 'undefined') {
            const updated = VEHICLES_DATA.filter(v => v && String(v.id) !== String(carId) && String(v.stockNumber || '') !== String(carId));
            VEHICLES_DATA.length = 0;
            VEHICLES_DATA.push(...updated);
            if (typeof saveVehiclesData === 'function') {
              saveVehiclesData(updated);
            }
          }

          // Render dashboard immediately so deleted car vanishes instantly
          loadMarketplaceDashboard();
          
          // 3. Permanently remove from Firebase Cloud Database and record cloud tombstone
          if (typeof deleteVehicleFromFirebase === 'function') {
            await deleteVehicleFromFirebase(carId);
          }

          loadMarketplaceDashboard();
          showToast(`Vehicle permanently deleted and will not reappear.`, 'info');
        } finally {
          if (typeof window.hideActionLoader === 'function') {
            setTimeout(() => window.hideActionLoader(), 250);
          }
        }
      }
    });
  });

  // Toggle On Test Drive status directly from table checkbox
  document.querySelectorAll('.cb-toggle-test-drive').forEach(cb => {
    cb.addEventListener('change', async () => {
      const carId = cb.dataset.id;
      const car = getVehicleById(carId) || VEHICLES_DATA.find(v => String(v.id) === String(carId));
      if (car) {
        car.onTestDrive = cb.checked;
        if (car.onTestDrive) {
          car.testDriveUpdatedAt = new Date().toISOString();
        }
        saveVehiclesData(VEHICLES_DATA);
        if (typeof saveVehicleToFirebase === 'function') {
          await saveVehicleToFirebase(car);
        }
        loadMarketplaceDashboard();
        if (car.onTestDrive) {
          showToast(`"${car.year} ${car.make} ${car.model}" marked as On Test Drive. Action changed to "Sold".`, 'success');
        } else {
          showToast(`"${car.year} ${car.make} ${car.model}" removed from Test Drive. Action restored to "Remove".`, 'info');
        }
      }
    });
  });

  // Mark Vehicle as Sold (Triggered by Sold button when on test drive)
  document.querySelectorAll('.btn-mark-sold').forEach(btn => {
    btn.addEventListener('click', async () => {
      const carId = btn.dataset.id;
      const car = getVehicleById(carId) || VEHICLES_DATA.find(v => String(v.id) === String(carId));
      const carTitle = car ? `"${car.year} ${car.make} ${car.model}" (Stock #${car.stockNumber || car.id})` : `Vehicle #${carId}`;
      if (confirm(`Are you sure you want to mark ${carTitle} as SOLD?\n\nThis will complete the deal and permanently remove this vehicle from active showroom inventory.`)) {
        if (typeof window.showActionLoader === 'function') {
          window.showActionLoader('Recording Deal as SOLD and Updating CAD Inventory...');
        }
        try {
          // Record sale log
          try {
            const salesLog = JSON.parse(localStorage.getItem('motortrends_sales_completed') || '[]');
            salesLog.unshift({
              vehicleId: carId,
              title: carTitle,
              price: car ? car.price : 0,
              stockNumber: car ? (car.stockNumber || car.id) : carId,
              soldAt: new Date().toISOString(),
              soldBy: (typeof currentAdminUser !== 'undefined' && currentAdminUser) ? currentAdminUser.username : 'sales_agent'
            });
            localStorage.setItem('motortrends_sales_completed', JSON.stringify(salesLog.slice(0, 100)));
          } catch (e) {}

          // 1. Tombstone in all local storage
          if (typeof addDeletedVehicleId === 'function') {
            addDeletedVehicleId(carId);
            if (car && car.stockNumber) addDeletedVehicleId(String(car.stockNumber));
          }

          // 2. Remove from active working array
          if (typeof deleteVehicleLocally === 'function') {
            deleteVehicleLocally(carId);
          }
          if (typeof VEHICLES_DATA !== 'undefined') {
            const updated = VEHICLES_DATA.filter(v => v && String(v.id) !== String(carId) && String(v.stockNumber || '') !== String(carId));
            VEHICLES_DATA.length = 0;
            VEHICLES_DATA.push(...updated);
            if (typeof saveVehiclesData === 'function') {
              saveVehiclesData(updated);
            }
          }
          loadMarketplaceDashboard();

          // 3. Remove permanently from Firebase Cloud
          if (typeof deleteVehicleFromFirebase === 'function') {
            await deleteVehicleFromFirebase(carId);
          }

          loadMarketplaceDashboard();
          showToast(`🎉 Congratulations! ${carTitle} marked as SOLD and completed!`, 'success');
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
        showToast(`${car.year} ${car.make} ${car.model} featured status: ${car.featured ? 'ON (Featured Deal)' : 'OFF'}`, 'success');
      }
    });
  });

  // Toggle New Arrival
  document.querySelectorAll('.btn-toggle-new').forEach(btn => {
    btn.addEventListener('click', async () => {
      const carId = btn.dataset.id;
      const car = getVehicleById(carId);
      if (car) {
        car.isNewVehicle = !car.isNewVehicle;
        if (!Array.isArray(car.badges)) car.badges = [];
        if (car.isNewVehicle) {
          if (!car.badges.includes('New Arrival')) car.badges.unshift('New Arrival');
        } else {
          car.badges = car.badges.filter(b => b.toLowerCase() !== 'new arrival');
        }
        saveVehiclesData(VEHICLES_DATA);
        if (typeof saveVehicleToFirebase === 'function') {
          await saveVehicleToFirebase(car);
        }
        loadMarketplaceDashboard();
        showToast(`${car.year} ${car.make} ${car.model} New Arrival status: ${car.isNewVehicle ? 'ON (Marked New)' : 'OFF'}`, 'success');
      }
    });
  });

  // Toggle Slideshow
  document.querySelectorAll('.btn-toggle-slideshow').forEach(btn => {
    btn.addEventListener('click', async () => {
      const carId = btn.dataset.id;
      const car = getVehicleById(carId);
      if (car) {
        const nextState = !(car.heroSlide || car.isSlideshow);
        car.heroSlide = nextState;
        car.isSlideshow = nextState;
        saveVehiclesData(VEHICLES_DATA);
        if (typeof saveVehicleToFirebase === 'function') {
          await saveVehicleToFirebase(car);
        }
        loadMarketplaceDashboard();
        showToast(`${car.year} ${car.make} ${car.model} Slideshow status: ${nextState ? 'ON (Will appear in homepage slideshow)' : 'OFF'}`, 'success');
      }
    });
  });

  // Live preview
  document.querySelectorAll('.btn-view-live-car').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const targetBtn = e.target.closest('.btn-view-live-car') || btn;
      const carId = targetBtn.dataset.id;
      const car = getVehicleById(carId);
      const stock = car && car.stockNumber ? car.stockNumber : '';
      window.open(`inventory.html?preview=${encodeURIComponent(carId)}&q=${encodeURIComponent(stock)}`, '_blank');
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

  const maxSlots = getSystemSettings().maxUploadSlots || 12;
  grid.innerHTML = '';
  for (let i = 0; i < maxSlots; i++) {
    const imgUrl = currentEditingImages[i];
    const slot = document.createElement('div');
    slot.style.cssText = `
      aspect-ratio: 16/10;
      border: 1.5px dashed ${imgUrl ? '#94A3B8' : '#CBD5E1'};
      border-radius: 8px;
      overflow: hidden;
      position: relative;
      background: ${imgUrl ? '#0F172A' : '#FFFFFF'};
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      ${imgUrl ? '' : 'cursor: pointer; transition: all 0.2s ease;'}
    `;

    if (imgUrl) {
      slot.innerHTML = `
        <img src="${imgUrl}" alt="Slot ${i+1}" style="width: 100%; height: 100%; object-fit: cover;">
        <div style="position: absolute; top: 4px; left: 4px; background: rgba(15,23,42,0.85); font-size: 0.65rem; padding: 2px 6px; border-radius: 3px; color: #fff; font-weight: 600;">
          ${i === 0 ? '★ Cover Photo' : `#${i+1}`}
        </div>
        <button type="button" class="btn-remove-slot-img" data-index="${i}" title="Remove photo" style="position: absolute; top: 4px; right: 4px; background: rgba(239,68,68,0.95); color: #fff; border: none; border-radius: 50%; width: 22px; height: 22px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 11px;">
          ✕
        </button>
      `;
    } else {
      slot.title = `Click + to browse and select photos directly from your computer (select up to ${maxSlots})`;
      slot.innerHTML = `
        <div style="text-align: center; color: #64748B; font-size: 0.75rem; font-weight: 600; pointer-events: none;">
          <div style="font-size: 1.35rem; margin-bottom: 2px; color: #1B3A6B; font-weight: 800;">+</div>
          Slot ${i + 1}
        </div>
      `;
      slot.addEventListener('click', () => {
        document.getElementById('bulk-image-upload')?.click();
      });
      slot.addEventListener('mouseenter', () => {
        slot.style.borderColor = '#1B3A6B';
        slot.style.background = '#F0F4FA';
      });
      slot.addEventListener('mouseleave', () => {
        slot.style.borderColor = '#CBD5E1';
        slot.style.background = '#FFFFFF';
      });
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
    document.getElementById('form-car-trim').value = car.trim || '';
    document.getElementById('form-car-price').value = car.price;
    if (document.getElementById('form-car-monthly')) {
      document.getElementById('form-car-monthly').value = '';
    }
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
    if (document.getElementById('form-car-new-arrival')) {
      document.getElementById('form-car-new-arrival').checked = !!car.isNewVehicle;
    }
    if (document.getElementById('form-car-slideshow')) {
      document.getElementById('form-car-slideshow').checked = !!(car.heroSlide || car.isSlideshow);
    }
    if (document.getElementById('form-car-test-drive')) {
      document.getElementById('form-car-test-drive').checked = !!car.onTestDrive;
    }
    const videoVal = car.video || '';
    document.getElementById('form-car-video').value = videoVal;
    updateVideoPreviewUI(videoVal);
    
    const maxSlots = getSystemSettings().maxUploadSlots || 12;
    currentEditingImages = car.images ? [...car.images].slice(0, maxSlots) : [];
    document.getElementById('form-car-features').value = car.features ? car.features.join('\n') : '';
    document.getElementById('form-car-badges').value = car.badges ? car.badges.join(', ') : '';
    document.getElementById('form-car-overview').value = car.overview || '';
  } else {
    modalTitle.textContent = 'Add New Vehicle to Marketplace';
    form.reset();
    document.getElementById('form-car-id').value = '';
    document.getElementById('form-car-stock').value = `MT-${Math.floor(1000 + Math.random() * 9000)}`;
    document.getElementById('form-car-video').value = '';
    updateVideoPreviewUI('');
    if (document.getElementById('form-car-featured')) {
      document.getElementById('form-car-featured').checked = true;
    }
    if (document.getElementById('form-car-new-arrival')) {
      document.getElementById('form-car-new-arrival').checked = true;
    }
    if (document.getElementById('form-car-slideshow')) {
      document.getElementById('form-car-slideshow').checked = true;
    }
    if (document.getElementById('form-car-test-drive')) {
      document.getElementById('form-car-test-drive').checked = false;
    }
    currentEditingImages = ['https://images.unsplash.com/photo-1581540222194-0def2dda95b8?auto=format&fit=crop&w=1000&q=80'];
    document.getElementById('form-car-features').value = 'Apple CarPlay & Android Auto\nBlind Spot Monitoring\nRearview Backup Camera\nBluetooth Hands-free';
    document.getElementById('form-car-badges').value = 'Clean Title, Inspected, New Arrival';
  }

  // Synchronize Basic Features quick-select chips with textarea
  syncBasicFeatureCheckboxes();

  renderImageSlots();

  // Handle URL Add Button (Allows up to maxSlots images)
  const addUrlBtn = document.getElementById('btn-add-image-url');
  const urlInput = document.getElementById('quick-image-url-input');
  if (addUrlBtn && urlInput) {
    addUrlBtn.onclick = () => {
      const url = urlInput.value.trim();
      if (url) {
        const maxSlots = getSystemSettings().maxUploadSlots || 12;
        if (currentEditingImages.length >= maxSlots) {
          showToast(`Maximum ${maxSlots} images reached for this vehicle.`, 'warning');
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

  // Handle Bulk Image File Upload (Select up to maxSlots images at once)
  const fileInput = document.getElementById('bulk-image-upload');
  if (fileInput) {
    fileInput.onchange = (e) => {
      const files = Array.from(e.target.files);
      const maxSlots = getSystemSettings().maxUploadSlots || 12;
      const remainingSlots = maxSlots - currentEditingImages.length;
      if (remainingSlots <= 0) {
        showToast(`Maximum ${maxSlots} images already reached.`, 'warning');
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

            if (currentEditingImages.length < maxSlots) {
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

  // Wire Basic Features & Custom Option
  setupBasicFeaturesUI();

  modalBackdrop.classList.add('active');
}

function syncBasicFeatureCheckboxes() {
  const featTextarea = document.getElementById('form-car-features');
  if (!featTextarea) return;
  const currentLines = featTextarea.value.split('\n').map(l => l.trim().toLowerCase()).filter(Boolean);
  document.querySelectorAll('.basic-feature-cb').forEach(cb => {
    const val = cb.value.trim().toLowerCase();
    cb.checked = currentLines.some(line => line.includes(val) || val.includes(line));
  });
}

function setupBasicFeaturesUI() {
  const featTextarea = document.getElementById('form-car-features');
  if (!featTextarea) return;

  // Checkbox change listener
  document.querySelectorAll('.basic-feature-cb').forEach(cb => {
    cb.onchange = () => {
      let lines = featTextarea.value.split('\n').map(l => l.trim()).filter(Boolean);
      const val = cb.value.trim();
      if (cb.checked) {
        if (!lines.some(l => l.toLowerCase() === val.toLowerCase())) {
          lines.push(val);
        }
      } else {
        lines = lines.filter(l => l.toLowerCase() !== val.toLowerCase());
      }
      featTextarea.value = lines.join('\n');
    };
  });

  // Custom Feature Add Button
  const customInput = document.getElementById('custom-feature-input');
  const addCustomBtn = document.getElementById('btn-add-custom-feature');
  if (addCustomBtn && customInput) {
    const handleAddCustom = () => {
      const val = customInput.value.trim();
      if (!val) return;
      let lines = featTextarea.value.split('\n').map(l => l.trim()).filter(Boolean);
      if (!lines.some(l => l.toLowerCase() === val.toLowerCase())) {
        lines.push(val);
        featTextarea.value = lines.join('\n');
        showToast(`Added feature: ${val}`, 'success');
      } else {
        showToast(`Feature "${val}" already added.`, 'info');
      }
      customInput.value = '';
      syncBasicFeatureCheckboxes();
    };

    addCustomBtn.onclick = handleAddCustom;
    customInput.onkeydown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddCustom();
      }
    };
  }
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
    const trim = (document.getElementById('form-car-trim')?.value || '').trim(); // Optional Trim
    const rawPrice = document.getElementById('form-car-price').value.trim();
    const price = parseFloat(rawPrice) || 0;
    const monthlyEst = 0; // Removed monthly payment display
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
    const featured = document.getElementById('form-car-featured') ? document.getElementById('form-car-featured').checked : true;
    const isNewVehicle = document.getElementById('form-car-new-arrival') ? document.getElementById('form-car-new-arrival').checked : false;
    const heroSlide = document.getElementById('form-car-slideshow') ? document.getElementById('form-car-slideshow').checked : false;
    const onTestDrive = document.getElementById('form-car-test-drive') ? document.getElementById('form-car-test-drive').checked : false;
    const video = document.getElementById('form-car-video').value.trim();

    const maxSlots = getSystemSettings().maxUploadSlots || 12;
    const images = currentEditingImages.length > 0 ? currentEditingImages.slice(0, maxSlots) : ['https://images.unsplash.com/photo-1581540222194-0def2dda95b8?auto=format&fit=crop&w=1000&q=80'];

    const features = document.getElementById('form-car-features').value.trim().split('\n').map(s => s.trim()).filter(Boolean);
    let badges = document.getElementById('form-car-badges').value.trim().split(',').map(b => b.trim()).filter(Boolean);
    const overview = document.getElementById('form-car-overview').value.trim();

    // Synchronize badges with isNewVehicle
    if (isNewVehicle) {
      if (!badges.some(b => b.toLowerCase() === 'new arrival')) {
        badges.unshift('New Arrival');
      }
    } else {
      badges = badges.filter(b => b.toLowerCase() !== 'new arrival');
    }

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
      isNewVehicle,
      heroSlide,
      isSlideshow: heroSlide,
      onTestDrive,
      badges,
      images,
      video,
      features,
      overview
    };

    const existingIndex = VEHICLES_DATA.findIndex(v => String(v.id) === String(id));
    if (existingIndex > -1) {
      const prev = VEHICLES_DATA[existingIndex];
      vehicleObject.createdAt = prev.createdAt || new Date().toISOString();
      VEHICLES_DATA[existingIndex] = vehicleObject;
      showToast(`Vehicle ${make} ${model} (#${stockNumber}) updated successfully!`, 'success');
    } else {
      const sysSettings = getSystemSettings();
      const maxLimit = sysSettings.maxInventoryLimit || 25;
      if (VEHICLES_DATA.length >= maxLimit) {
        if (typeof window.hideActionLoader === 'function') window.hideActionLoader();
        showToast('Inventory full, contact support', 'error');
        alert('Inventory full, contact support');
        return;
      }
      vehicleObject.createdAt = new Date().toISOString();
      VEHICLES_DATA.unshift(vehicleObject);
      showToast(`New vehicle "${make} ${model}" added to marketplace with top priority!`, 'success');
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

  const totalCars = VEHICLES_DATA.length || 1;

  container.innerHTML = `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.5rem; margin-top: 1rem;">
      <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; padding: 1.75rem; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
        <h3 style="font-size: 1.15rem; margin-bottom: 1.25rem; color: #0F172A; font-weight: 800;">Inventory by Make / Brand</h3>
        <div style="display: flex; flex-direction: column; gap: 0.85rem;">
          ${Object.entries(makesCount).sort((a,b)=>b[1]-a[1]).map(([make, count]) => `
            <div>
              <div style="display: flex; justify-content: space-between; font-size: 0.88rem; margin-bottom: 0.35rem;">
                <span style="color: #0F172A; font-weight: 700;">${make}</span>
                <span style="color: #64748B; font-weight: 600;">${count} cars (${Math.round(count/totalCars*100)}%)</span>
              </div>
              <div style="background: #E2E8F0; height: 8px; border-radius: 4px; overflow: hidden;">
                <div style="background: #1B3A6B; height: 100%; width: ${(count/totalCars)*100}%; border-radius: 4px;"></div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; padding: 1.75rem; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
        <h3 style="font-size: 1.15rem; margin-bottom: 1.25rem; color: #0F172A; font-weight: 800;">Inventory by Body Type</h3>
        <div style="display: flex; flex-direction: column; gap: 0.85rem;">
          ${Object.entries(bodyCount).sort((a,b)=>b[1]-a[1]).map(([type, count]) => `
            <div>
              <div style="display: flex; justify-content: space-between; font-size: 0.88rem; margin-bottom: 0.35rem;">
                <span style="color: #0F172A; font-weight: 700;">${type}</span>
                <span style="color: #64748B; font-weight: 600;">${count} cars</span>
              </div>
              <div style="background: #E2E8F0; height: 8px; border-radius: 4px; overflow: hidden;">
                <div style="background: #0284C7; height: 100%; width: ${(count/totalCars)*100}%; border-radius: 4px;"></div>
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
    <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; padding: 1.75rem; margin-top: 1rem; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
      <div style="margin-bottom: 1.25rem;">
        <h3 style="font-size: 1.25rem; margin-bottom: 0.25rem; color: #0F172A; font-weight: 800;">Recent Customer Leads &amp; Test Drive Bookings</h3>
        <p style="font-size: 0.85rem; color: #64748B;">Live customer inquiries submitted through inventory, test drive requests, and trade-in appraisals.</p>
      </div>
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
                <div style="font-weight: 700; color: #0F172A;">David Miller</div>
                <div style="font-size: 0.78rem; color: #64748B;">david.m@example.com • 604-555-1120</div>
              </td>
              <td style="color: #1E293B; font-weight: 600;">2023 Toyota RAV4 (MT-4821)</td>
              <td><span class="badge badge-blue">Test Drive</span></td>
              <td style="color: #64748B; font-size: 0.85rem;">Oct 8, 2026 @ 10:00 AM</td>
              <td><span class="badge badge-green">Confirmed</span></td>
              <td><button class="btn btn-silver btn-sm" onclick="showToast('Lead marked contacted', 'info')">Contact</button></td>
            </tr>
            <tr>
              <td>
                <div style="font-weight: 700; color: #0F172A;">Sarah Jenkins</div>
                <div style="font-size: 0.78rem; color: #64748B;">sarah.j@example.com • 604-555-4421</div>
              </td>
              <td style="color: #1E293B; font-weight: 600;">2023 Ford F-150 (MT-4823)</td>
              <td><span class="badge badge-silver">Pre-Approval</span></td>
              <td style="color: #64748B; font-size: 0.85rem;">Oct 7, 2026 @ 2:30 PM</td>
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
    <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; padding: 1.75rem; margin-top: 1rem; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
      
      <!-- Top Title & Add Button -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
        <div>
          <h3 style="font-size: 1.35rem; color: #0F172A; margin-bottom: 0.35rem; font-weight: 800;">
            Team, Staff &amp; Department Management
          </h3>
          <p style="font-size: 0.85rem; color: #64748B;">
            Manage Executive Admin, Sales Agents, Human Resources (HR), and Inspection/Service Technicians.
          </p>
        </div>
        <button id="btn-add-team-user" class="btn btn-blue btn-sm" style="box-shadow: 0 4px 14px rgba(27, 58, 107, 0.25);">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          + Add New Team Member
        </button>
      </div>

      <!-- KPI Metric Cards for Staff -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 1rem;">
          <div style="font-size: 0.75rem; color: #64748B; text-transform: uppercase; font-weight: 700;">Total Active Staff</div>
          <div style="font-size: 1.75rem; font-weight: 900; color: #0F172A; margin-top: 0.25rem;">${totalCount}</div>
        </div>
        <div style="background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 10px; padding: 1rem;">
          <div style="font-size: 0.75rem; color: #1D4ED8; text-transform: uppercase; font-weight: 700;">Sales Specialists</div>
          <div style="font-size: 1.75rem; font-weight: 900; color: #1E40AF; margin-top: 0.25rem;">${salesCount}</div>
          <div style="font-size: 0.72rem; color: #64748B; margin-top: 2px;">Maintain Inventory Access</div>
        </div>
        <div style="background: #FDF2F8; border: 1px solid #FBCFE8; border-radius: 10px; padding: 1rem;">
          <div style="font-size: 0.75rem; color: #BE185D; text-transform: uppercase; font-weight: 700;">HR &amp; Management</div>
          <div style="font-size: 1.75rem; font-weight: 900; color: #9D174D; margin-top: 0.25rem;">${hrCount}</div>
          <div style="font-size: 0.72rem; color: #64748B; margin-top: 2px;">Staff &amp; Payroll Admin</div>
        </div>
        <div style="background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 10px; padding: 1rem;">
          <div style="font-size: 0.75rem; color: #B45309; text-transform: uppercase; font-weight: 700;">Tech &amp; Reconditioning</div>
          <div style="font-size: 1.75rem; font-weight: 900; color: #92400E; margin-top: 0.25rem;">${techCount}</div>
          <div style="font-size: 0.72rem; color: #64748B; margin-top: 2px;">Vehicle Inspection Team</div>
        </div>
      </div>

      <!-- Filters & Search Toolbar -->
      <div style="display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 1.25rem; flex-wrap: wrap;">
        <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
          <button class="btn btn-sm ${filterDept === 'all' ? 'btn-blue' : 'btn-silver'}" onclick="renderUsersView('all')">All Staff (${totalCount})</button>
          <button class="btn btn-sm ${filterDept === 'management' ? 'btn-blue' : 'btn-silver'}" onclick="renderUsersView('management')">👑 Admin</button>
          <button class="btn btn-sm ${filterDept === 'sales' ? 'btn-blue' : 'btn-silver'}" onclick="renderUsersView('sales')">💼 Sales (${salesCount})</button>
          <button class="btn btn-sm ${filterDept === 'hr' ? 'btn-blue' : 'btn-silver'}" onclick="renderUsersView('hr')">👥 HR</button>
          <button class="btn btn-sm ${filterDept === 'tech' ? 'btn-blue' : 'btn-silver'}" onclick="renderUsersView('tech')">🔧 Tech &amp; Service (${techCount})</button>
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
              <th>Department &amp; Role</th>
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
                      <div style="width: 36px; height: 36px; border-radius: 50%; background: ${roleColor}18; border: 1px solid ${roleColor}50; color: ${roleColor}; font-weight: 800; display: flex; align-items: center; justify-content: center; font-size: 0.85rem;">
                        ${(u.name || 'U').split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </div>
                      <div>
                        <div style="font-weight: 700; color: #0F172A;">${u.name}</div>
                        <div style="font-size: 0.78rem; color: #64748B;">${u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <code style="background: #F1F5F9; border: 1px solid #E2E8F0; padding: 3px 8px; border-radius: 4px; color: #0F172A; font-weight: 700;">${u.username || 'user'}</code>
                  </td>
                  <td>
                    <span class="badge" style="background: ${roleColor}14; color: ${roleColor}; border: 1px solid ${roleColor}40; font-weight: 700;">
                      ● ${u.role}
                    </span>
                    <div style="font-size: 0.75rem; color: #64748B; margin-top: 3px; font-weight: 500;">${u.department || 'Dealership'}</div>
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
                      <button class="btn btn-blue btn-sm" onclick="sendUserInvitation('${u.id}')" title="Send Invitation Email to ${u.name}" style="font-weight: 600;">
                        ✉️ Invite
                      </button>
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

// Super Admin user invitation email generator & clipboard link
function sendUserInvitation(userId) {
  const users = getAdminUsers();
  const u = users.find(x => x.id === userId);
  if (!u) {
    showToast('User profile not found.', 'error');
    return;
  }
  const isSales = (u.role === 'Sales Agent');
  const origin = window.location.origin || 'http://localhost:3000';
  const portalUrl = isSales ? `${origin}/sales.html` : `${origin}/admin.html`;
  const subject = `Invitation to Motor Trends Auto Group Portal (${u.role})`;
  const body = `Hello ${u.name},

You have been invited to access the Motor Trends Auto Group Staff Portal.

Portal URL: ${portalUrl}
Assigned Role: ${u.role}
Department: ${u.department || 'Operations'}
Login Username / Work Email: ${u.email || u.username}
Temporary Password: ${u.password || 'Please contact administration'}

Getting Started:
1. Open the portal URL: ${portalUrl}
2. Enter your username or email and temporary password to sign in.
3. For Super Admin access, use "Sign in with Google" with your authorized account.

Motor Trends Auto Group
11880 Bridgeport Rd, Richmond, BC V6X 1T2
https://motortrendsautogroup.com`;

  // 1. Open mailto client
  const mailtoUrl = `mailto:${encodeURIComponent(u.email || '')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.open(mailtoUrl, '_blank');

  // 2. Copy details to clipboard
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`).then(() => {
      showToast(`✉️ Invitation email opened & login details copied to clipboard for ${u.name}!`, 'success');
    }).catch(() => {
      showToast(`✉️ Invitation email triggered for ${u.name} (${u.email})!`, 'success');
    });
  } else {
    showToast(`✉️ Invitation email triggered for ${u.name} (${u.email})!`, 'success');
  }
}

// TAB 4 / 7: SUPERADMIN SETTINGS VIEW
function renderSettingsView() {
  const container = document.getElementById('tab-view-settings');
  if (!container) return;

  const isSuper = isSuperAdminUser();
  const settings = getSystemSettings();

  if (!isSuper) {
    container.innerHTML = `
      <div style="background: #FFFFFF; border: 1.5px solid #FCA5A5; border-radius: var(--radius-lg); padding: 2.5rem 1.5rem; margin-top: 1rem; text-align: center; box-shadow: 0 2px 6px rgba(0,0,0,0.03);">
        <div style="font-size: 2.75rem; margin-bottom: 0.5rem;">🔒</div>
        <h3 style="font-size: 1.35rem; color: #991B1B; font-weight: 800; margin-bottom: 0.5rem;">
          Super Admin Restricted Access
        </h3>
        <p style="color: #64748B; font-size: 0.9rem; max-width: 520px; margin: 0 auto 1.5rem; line-height: 1.5;">
          Only the Super Admin (<strong>${settings.superAdminEmail || 'rclickspro@gmail.com'}</strong> via Google Sign-In) is authorized to modify system quotas, photo upload limits, and sales passwords.
        </p>
        <button class="btn btn-outline btn-sm" onclick="switchAdminTab('vehicles')">
          ← Return to Marketplace Vehicles
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div style="background: #FFFFFF; border: 1px solid var(--admin-border); border-radius: var(--radius-lg); padding: 2rem; margin-top: 1rem; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
      <div style="border-bottom: 1px solid #E2E8F0; padding-bottom: 1.25rem; margin-bottom: 1.75rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
        <div>
          <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.35rem;">
            <span class="badge" style="background: #EFF6FF; color: #1D4ED8; border: 1px solid #BFDBFE; font-size: 0.75rem; font-weight: 700;">👑 SUPER ADMIN CONTROLS</span>
            <span class="badge" style="background: #ECFDF5; color: #047857; border: 1px solid #A7F3D0; font-size: 0.75rem;">LIVE CLOUD SYNC</span>
          </div>
          <h2 style="font-size: 1.45rem; font-weight: 800; color: #0F172A;">
            System Quotas &amp; Dealership Settings
          </h2>
          <p style="font-size: 0.85rem; color: #64748B; margin-top: 0.25rem;">
            Adjust maximum upload slots, inventory vehicle caps, sales passwords, and super admin login email.
          </p>
        </div>
      </div>

      <form id="superadmin-settings-form" style="display: flex; flex-direction: column; gap: 1.5rem; max-width: 680px;">
        <!-- Setting 1: Max Upload Slots -->
        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 1.25rem;">
          <label style="font-weight: 700; color: #0F172A; font-size: 0.95rem; display: block; margin-bottom: 0.25rem;">
            📸 Maximum Photo Upload Slots
          </label>
          <div style="font-size: 0.8rem; color: #64748B; margin-bottom: 0.75rem;">
            Default is 12 photo slots per vehicle. Controls slot grid and bulk browse file selection.
          </div>
          <input type="number" id="setting-max-uploads" class="form-control" min="1" max="50" value="${settings.maxUploadSlots || 12}" required style="max-width: 200px;">
        </div>

        <!-- Setting 2: Max Inventory Capacity -->
        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 1.25rem;">
          <label style="font-weight: 700; color: #0F172A; font-size: 0.95rem; display: block; margin-bottom: 0.25rem;">
            🚗 Maximum Inventory Vehicle Capacity
          </label>
          <div style="font-size: 0.8rem; color: #64748B; margin-bottom: 0.75rem;">
            Maximum allowed vehicles in the catalog (Current: <strong>${VEHICLES_DATA.length}</strong> / <strong>${settings.maxInventoryLimit || 25}</strong>). If full, users see <em>"Inventory full, contact support"</em>.
          </div>
          <input type="number" id="setting-max-inventory" class="form-control" min="1" max="500" value="${settings.maxInventoryLimit || 25}" required style="max-width: 200px;">
        </div>

        <!-- Setting 3: Sales Login Password -->
        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 1.25rem;">
          <label style="font-weight: 700; color: #0F172A; font-size: 0.95rem; display: block; margin-bottom: 0.25rem;">
            💼 Sales Representative Password
          </label>
          <div style="font-size: 0.8rem; color: #64748B; margin-bottom: 0.75rem;">
            Password used by sales staff on the Sales Portal.
          </div>
          <input type="text" id="setting-sales-password" class="form-control" value="${settings.salesPassword || '^^0ToRTre&d$'}" required style="max-width: 320px; font-family: monospace;">
        </div>

        <!-- Setting 4: Super Admin Email -->
        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 1.25rem;">
          <label style="font-weight: 700; color: #0F172A; font-size: 0.95rem; display: block; margin-bottom: 0.25rem;">
            👑 Super Admin Google Account Email
          </label>
          <div style="font-size: 0.8rem; color: #64748B; margin-bottom: 0.75rem;">
            Only this Google account is permitted to authenticate as Super Admin via Google Sign-In.
          </div>
          <input type="email" id="setting-superadmin-email" class="form-control" value="${settings.superAdminEmail || 'rclickspro@gmail.com'}" required style="max-width: 360px;">
        </div>

        <div>
          <button type="submit" class="btn btn-blue btn-lg" style="font-weight: 700; padding: 0.75rem 2rem;">
            💾 Save &amp; Apply System Settings
          </button>
        </div>
      </form>
    </div>
  `;

  const form = document.getElementById('superadmin-settings-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const maxUploads = parseInt(document.getElementById('setting-max-uploads').value) || 12;
      const maxInventory = parseInt(document.getElementById('setting-max-inventory').value) || 25;
      const salesPass = document.getElementById('setting-sales-password').value.trim();
      const superEmail = document.getElementById('setting-superadmin-email').value.trim().toLowerCase();

      saveSystemSettings({
        maxUploadSlots: maxUploads,
        maxInventoryLimit: maxInventory,
        salesPassword: salesPass,
        superAdminEmail: superEmail
      });

      showToast('✅ Super Admin System Settings saved and synced to cloud!', 'success');
      renderSettingsView();
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

  // Auto-set permissions based on selected Role
  document.getElementById('form-user-role')?.addEventListener('change', (e) => {
    const roleVal = e.target.value;
    const permInv = document.getElementById('perm-inventory');
    const permLeads = document.getElementById('perm-leads');
    const permAdmin = document.getElementById('perm-admin');
    const permHR = document.getElementById('perm-hr');
    if (roleVal === 'Dealership Admin') {
      if (permInv) permInv.checked = true;
      if (permLeads) permLeads.checked = true;
      if (permAdmin) permAdmin.checked = true;
      if (permHR) permHR.checked = true;
    } else if (roleVal === 'Sales Agent') {
      if (permInv) permInv.checked = true;
      if (permLeads) permLeads.checked = true;
      if (permAdmin) permAdmin.checked = false;
      if (permHR) permHR.checked = false;
    } else if (roleVal === 'HR Manager') {
      if (permInv) permInv.checked = false;
      if (permLeads) permLeads.checked = false;
      if (permAdmin) permAdmin.checked = true;
      if (permHR) permHR.checked = true;
    }
  });

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
   HostPapa Server Storage & File Manager Dashboard
----------------------------------------------------- */
function renderFirebaseView() {
  const container = document.getElementById('tab-view-firebase');
  if (!container) return;

  const totalVehicles = Array.isArray(VEHICLES_DATA) ? VEHICLES_DATA.length : 0;
  const vehiclesWithFolders = (VEHICLES_DATA || []).filter(v => v.images && v.images.some(img => img.includes('uploads/vehicles/'))).length;

  container.innerHTML = `
    <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; padding: 1.75rem; margin-top: 1rem; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
        <div>
          <h3 style="font-size: 1.35rem; color: #0F172A; margin-bottom: 0.35rem; font-weight: 800; display: flex; align-items: center; gap: 0.5rem;">
            📁 HostPapa Server Storage &amp; File Manager
          </h3>
          <p style="font-size: 0.85rem; color: #64748B;">
            Independent file-based inventory engine. Each vehicle has its own folder for photos and metadata.
          </p>
        </div>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <button id="btn-refresh-server-catalog" class="btn btn-blue btn-sm">
            🔄 Refresh From Server
          </button>
          <a href="api/vehicles.php" target="_blank" class="btn btn-silver btn-sm">
            🌐 View API JSON Endpoint
          </a>
        </div>
      </div>

      <!-- Live Service Status Cards -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem; margin-bottom: 1.75rem;">
        <div style="background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 10px; padding: 1.15rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <span style="font-size: 0.75rem; color: #1D4ED8; text-transform: uppercase; font-weight: 700;">Storage Backend</span>
            <span class="badge badge-green">● Connected</span>
          </div>
          <div style="font-size: 1.05rem; font-weight: 800; color: #1E40AF;">HostPapa File Storage</div>
          <div style="font-size: 0.75rem; color: #64748B; margin-top: 4px;">PHP / Apache + Local Node API</div>
        </div>

        <div style="background: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 10px; padding: 1.15rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <span style="font-size: 0.75rem; color: #047857; text-transform: uppercase; font-weight: 700;">Active Inventory</span>
            <span class="badge badge-green">● ${totalVehicles} Vehicles</span>
          </div>
          <div style="font-size: 1.05rem; font-weight: 800; color: #065F46;">${totalVehicles} Vehicles in Catalog</div>
          <div style="font-size: 0.75rem; color: #64748B; margin-top: 4px;">Stored in <code>data/vehicles.json</code></div>
        </div>

        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 1.15rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <span style="font-size: 0.75rem; color: #475569; text-transform: uppercase; font-weight: 700;">Usage Limit</span>
            <span class="badge badge-green">Unlimited</span>
          </div>
          <div style="font-size: 1.05rem; font-weight: 800; color: #0F172A;">100% Free Hosting</div>
          <div style="font-size: 0.75rem; color: #64748B; margin-top: 4px;">No external database quota limits</div>
        </div>
      </div>

      <!-- HostPapa File Manager Guide -->
      <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 1.5rem; margin-bottom: 1.5rem;">
        <h4 style="font-size: 1.05rem; color: #0F172A; font-weight: 800; margin-bottom: 0.65rem; display: flex; align-items: center; gap: 0.4rem;">
          <span>📁</span> Folder &amp; Storage Architecture (cPanel File Manager)
        </h4>
        <p style="font-size: 0.85rem; color: #475569; line-height: 1.6; margin-bottom: 1rem;">
          When an administrator adds or edits a vehicle in the Admin dashboard, the system automatically creates a dedicated directory inside <code>uploads/vehicles/</code> named with that vehicle's ID. All photos are extracted and saved as physical image files (<code>photo_1.jpg</code>, <code>photo_2.jpg</code>, etc.) alongside the vehicle's JSON data.
        </p>

        <div style="background: #0F172A; color: #E2E8F0; border-radius: 8px; padding: 1rem 1.25rem; font-family: monospace; font-size: 0.85rem; line-height: 1.7; overflow-x: auto;">
          <div style="color: #38BDF8; font-weight: 700;">public_html/ (HostPapa Root)</div>
          <div>├── <span style="color: #FCD34D;">api/</span></div>
          <div>│   └── <span style="color: #4ADE80;">vehicles.php</span> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #94A3B8;"># Handles GET, POST, DELETE requests</span></div>
          <div>├── <span style="color: #FCD34D;">data/</span></div>
          <div>│   └── <span style="color: #4ADE80;">vehicles.json</span> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #94A3B8;"># Fast central catalog index</span></div>
          <div>└── <span style="color: #FCD34D;">uploads/vehicles/</span></div>
          <div>&nbsp;&nbsp;&nbsp;&nbsp;├── <span style="color: #F472B6;">veh-1718881500000/</span> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #94A3B8;"># Dedicated folder for vehicle</span></div>
          <div>&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;├── <span style="color: #67E8F9;">photo_1.jpg</span> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #94A3B8;"># Main image</span></div>
          <div>&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;├── <span style="color: #67E8F9;">photo_2.jpg</span> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #94A3B8;"># Gallery image 2</span></div>
          <div>&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;└── <span style="color: #4ADE80;">vehicle.json</span> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #94A3B8;"># Vehicle metadata &amp; details</span></div>
          <div>&nbsp;&nbsp;&nbsp;&nbsp;└── <span style="color: #F472B6;">[other-vehicle-id]/</span></div>
        </div>
      </div>

      <!-- Live Vehicles on Server List -->
      <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 10px; padding: 1.25rem;">
        <h4 style="font-size: 1rem; color: #0F172A; font-weight: 700; margin-bottom: 0.75rem;">
          Current Server Folders &amp; Catalog Status
        </h4>
        <div style="font-size: 0.85rem; color: #64748B; margin-bottom: 1rem;">
          Below are the vehicles currently saved on disk in <code>uploads/vehicles/</code>:
        </div>
        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
          ${(VEHICLES_DATA || []).map(v => `
            <div style="display: flex; justify-content: space-between; align-items: center; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 0.65rem 1rem; font-size: 0.85rem;">
              <div>
                <strong style="color: #0F172A;">${v.year} ${v.make} ${v.model}</strong>
                <span style="color: #64748B; margin-left: 0.5rem;">(#${v.stockNumber || 'N/A'})</span>
              </div>
              <div style="display: flex; align-items: center; gap: 0.75rem;">
                <code style="background: #E2E8F0; padding: 2px 6px; border-radius: 4px; font-size: 0.75rem;">uploads/vehicles/${v.id}/</code>
                <span class="badge badge-green">${(v.images || []).length} Photos</span>
              </div>
            </div>
          `).join('') || '<p style="color: #64748B; font-size: 0.85rem;">No vehicles found in storage.</p>'}
        </div>
      </div>

    </div>
  `;

  // Refresh Button Handler
  document.getElementById('btn-refresh-server-catalog')?.addEventListener('click', async () => {
    if (typeof fetchVehiclesFromServer === 'function') {
      showToast('Fetching latest catalog from server...', 'info');
      const data = await fetchVehiclesFromServer();
      renderFirebaseView();
      if (typeof loadMarketplaceDashboard === 'function') loadMarketplaceDashboard();
      showToast(`Refreshed! ${data.length} vehicles loaded from server.`, 'success');
    }
  });
}

