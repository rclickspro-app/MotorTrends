/**
 * Silver Motors Admin Portal Controller
 * Authentication, Registration, Email Verification Simulation & Full Marketplace Management
 */

const ADMIN_STORAGE_KEY_USERS = 'silver_motors_admin_users';
const ADMIN_STORAGE_KEY_SESSION = 'silver_motors_admin_session';

// Demo initial admin user
const DEFAULT_ADMIN = {
  id: 'usr-admin-01',
  name: 'Dealership Manager',
  email: 'admin@silvermotors.com',
  password: 'admin', // Demo password
  role: 'Master Admin',
  verified: true,
  createdAt: new Date().toISOString()
};

let currentAdminUser = null;
let editingVehicleId = null;
let currentTab = 'vehicles'; // 'vehicles' | 'analytics' | 'inquiries' | 'settings'

document.addEventListener('DOMContentLoaded', () => {
  initAdminSystem();
});

function initAdminSystem() {
  initAdminUsersDB();
  checkAuthSession();
  setupAuthEventListeners();
  setupDashboardEventListeners();
  setupVehicleModalEvents();
}

/* ----------------------------------------------------
   Auth & User Database Management
----------------------------------------------------- */
function initAdminUsersDB() {
  const users = getAdminUsers();
  if (users.length === 0) {
    saveAdminUsers([DEFAULT_ADMIN]);
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
  try {
    const session = localStorage.getItem(ADMIN_STORAGE_KEY_SESSION);
    if (session) {
      const user = JSON.parse(session);
      const allUsers = getAdminUsers();
      const freshUser = allUsers.find(u => u.id === user.id);
      if (freshUser && freshUser.verified) {
        currentAdminUser = freshUser;
        showDashboardView();
        return;
      }
    }
  } catch (e) {
    console.error('Session check error:', e);
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
}

/* ----------------------------------------------------
   Auth Event Listeners (Login, Register, OTP Verify)
----------------------------------------------------- */
function setupAuthEventListeners() {
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
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim().toLowerCase();
      const password = document.getElementById('login-password').value;

      const users = getAdminUsers();
      const user = users.find(u => u.email.toLowerCase() === email && u.password === password);

      if (!user) {
        showAuthAlert('Invalid email or password. Use demo account (admin@silvermotors.com / admin) or register a new account.', 'error');
        return;
      }

      if (!user.verified) {
        showAuthAlert('Your email is not verified yet. Please complete verification.', 'warning');
        initiateEmailVerification(user);
        return;
      }

      // Successful Login
      currentAdminUser = user;
      localStorage.setItem(ADMIN_STORAGE_KEY_SESSION, JSON.stringify(user));
      showToast(`Welcome back, ${user.name}!`, 'success');
      showDashboardView();
    });
  }

  // Register Form Submission
  const registerForm = document.getElementById('admin-register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('reg-name').value.trim();
      const email = document.getElementById('reg-email').value.trim().toLowerCase();
      const role = document.getElementById('reg-role').value;
      const password = document.getElementById('reg-password').value;
      const confirmPassword = document.getElementById('reg-confirm-password').value;

      if (password !== confirmPassword) {
        showAuthAlert('Passwords do not match! Please re-check.', 'error');
        return;
      }

      if (password.length < 5) {
        showAuthAlert('Password must be at least 5 characters long.', 'error');
        return;
      }

      const users = getAdminUsers();
      if (users.some(u => u.email.toLowerCase() === email)) {
        showAuthAlert('An account with this email address already exists.', 'error');
        return;
      }

      // Generate 6-digit OTP code
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

      const newUser = {
        id: 'usr-' + Date.now(),
        name,
        email,
        role,
        password,
        verified: false,
        verificationCode: otpCode,
        createdAt: new Date().toISOString()
      };

      users.push(newUser);
      saveAdminUsers(users);

      initiateEmailVerification(newUser);
    });
  }

  // OTP Verification Form Submission
  const verifyForm = document.getElementById('admin-verify-form');
  if (verifyForm) {
    verifyForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const targetEmail = document.getElementById('verify-target-email').value;
      const enteredCode = document.getElementById('verify-otp-code').value.trim();

      const users = getAdminUsers();
      const userIndex = users.findIndex(u => u.email.toLowerCase() === targetEmail.toLowerCase());

      if (userIndex === -1) {
        showAuthAlert('User not found. Please register again.', 'error');
        return;
      }

      const user = users[userIndex];
      if (user.verificationCode !== enteredCode) {
        showAuthAlert('Invalid verification code! Please check the code shown in the simulation box.', 'error');
        return;
      }

      // Mark verified
      user.verified = true;
      delete user.verificationCode;
      users[userIndex] = user;
      saveAdminUsers(users);

      currentAdminUser = user;
      localStorage.setItem(ADMIN_STORAGE_KEY_SESSION, JSON.stringify(user));
      showToast('🎉 Email verified successfully! Welcome to Silver Motors Admin.', 'success');
      showDashboardView();
    });
  }

  // Resend Code Button
  document.getElementById('btn-resend-otp')?.addEventListener('click', () => {
    const targetEmail = document.getElementById('verify-target-email').value;
    const users = getAdminUsers();
    const userIndex = users.findIndex(u => u.email.toLowerCase() === targetEmail.toLowerCase());
    if (userIndex > -1) {
      const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
      users[userIndex].verificationCode = newOtp;
      saveAdminUsers(users);
      initiateEmailVerification(users[userIndex]);
      showToast('New verification code sent!', 'info');
    }
  });

  // Logout Button
  const logoutBtn = document.getElementById('btn-admin-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem(ADMIN_STORAGE_KEY_SESSION);
      currentAdminUser = null;
      showToast('Logged out of Admin Portal.', 'info');
      showAuthView('login');
      // Reset password input
      const passInp = document.getElementById('login-password');
      if (passInp) passInp.value = '';
    });
  }
}

function initiateEmailVerification(user) {
  document.getElementById('verify-target-email').value = user.email;
  document.getElementById('verify-user-email-text').textContent = user.email;
  
  // Show simulated verification code prompt banner
  const simBox = document.getElementById('simulated-email-inbox');
  if (simBox) {
    simBox.innerHTML = `
      <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 8px; padding: 1rem; margin-top: 1rem;">
        <div style="font-size: 0.8rem; text-transform: uppercase; color: #10b981; font-weight: 700; margin-bottom: 0.25rem;">
          📬 Simulated Verification Email Sent
        </div>
        <div style="font-size: 0.85rem; color: #cbd5e1; margin-bottom: 0.5rem;">
          To: <strong>${user.email}</strong> | Subject: <em>Verify your Silver Motors Admin Account</em>
        </div>
        <div style="font-size: 1.25rem; font-weight: 800; letter-spacing: 4px; color: #fff; background: #0f172a; padding: 0.5rem; text-align: center; border-radius: 6px; border: 1px solid #334155;">
          ${user.verificationCode}
        </div>
        <div style="font-size: 0.75rem; color: #94a3b8; margin-top: 0.4rem; text-align: center;">
          (Copy this 6-digit code or enter it above to verify your account)
        </div>
      </div>
    `;
  }

  showAuthView('verify');
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
    downloadAnchor.setAttribute("download", `silver_motors_inventory_${new Date().toISOString().slice(0,10)}.json`);
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
  document.getElementById('tab-view-settings').style.display = tabName === 'settings' ? 'block' : 'none';

  if (tabName === 'analytics') renderAnalyticsView();
  if (tabName === 'inquiries') renderInquiriesView();
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
      const haystack = `${car.year} ${car.make} ${car.model} ${car.trim} ${car.vin} ${car.stockNumber}`.toLowerCase();
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
        <img src="${car.images[0] || 'https://images.unsplash.com/photo-1581540222194-0def2dda95b8?auto=format&fit=crop&w=400&q=80'}" alt="${car.model}" style="width: 70px; height: 48px; object-fit: cover; border-radius: 6px; border: 1px solid var(--border-medium);">
      </td>
      <td>
        <div style="font-weight: 700; color: #fff; font-size: 0.95rem;">${car.year} ${car.make} ${car.model}</div>
        <div style="font-size: 0.8rem; color: var(--silver-400);">${car.trim}</div>
        <div style="font-size: 0.75rem; color: var(--silver-500); font-family: monospace;">VIN: ${car.vin}</div>
      </td>
      <td>
        <div style="font-size: 0.85rem; font-weight: 600; color: #cbd5e1;">${car.stockNumber}</div>
        <span class="badge ${car.condition === 'Certified Pre-Owned' ? 'badge-blue' : 'badge-silver'}" style="font-size: 0.7rem; padding: 2px 6px;">
          ${car.condition}
        </span>
      </td>
      <td>
        <div style="font-size: 0.85rem; color: #fff;">${car.bodyType} • ${car.fuelType}</div>
        <div style="font-size: 0.8rem; color: var(--silver-400);">${formatNumber(car.mileage)} mi • ${car.drivetrain}</div>
      </td>
      <td>
        <div style="font-weight: 800; font-size: 1rem; color: #fff;">${formatPrice(car.price)}</div>
        <div style="font-size: 0.8rem; color: #60a5fa;">Est. $${car.monthlyEst}/mo</div>
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
        const updated = VEHICLES_DATA.filter(v => v.id !== carId);
        saveVehiclesData(updated);
        
        // Permanently remove from Firebase Cloud Database
        if (typeof deleteVehicleFromFirebase === 'function') {
          await deleteVehicleFromFirebase(carId);
        }

        loadMarketplaceDashboard();
        showToast(`Vehicle #${car.stockNumber} permanently deleted.`, 'info');
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
      window.open(`inventory.html?q=${encodeURIComponent(carId)}`, '_blank');
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
    document.getElementById('form-car-stock').value = `SM-${Math.floor(1000 + Math.random() * 9000)}`;
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
  const id = document.getElementById('form-car-id').value.trim() || `veh-${Date.now()}`;
  const year = parseInt(document.getElementById('form-car-year').value);
  const make = document.getElementById('form-car-make').value.trim();
  const model = document.getElementById('form-car-model').value.trim();
  const trim = document.getElementById('form-car-trim').value.trim();
  const price = parseInt(document.getElementById('form-car-price').value);
  const monthlyEst = parseInt(document.getElementById('form-car-monthly').value) || Math.round(price / 72);
  const mileage = parseInt(document.getElementById('form-car-mileage').value);
  const bodyType = document.getElementById('form-car-body').value;
  const fuelType = document.getElementById('form-car-fuel').value;
  const transmission = document.getElementById('form-car-trans').value;
  const drivetrain = document.getElementById('form-car-drivetrain').value;
  const engine = document.getElementById('form-car-engine').value.trim();
  const exteriorColor = document.getElementById('form-car-ext-color').value.trim();
  const interiorColor = document.getElementById('form-car-int-color').value.trim();
  const vin = document.getElementById('form-car-vin').value.trim();
  const stockNumber = document.getElementById('form-car-stock').value.trim();
  const condition = document.getElementById('form-car-condition').value;
  const featured = document.getElementById('form-car-featured').checked;
  const video = document.getElementById('form-car-video').value.trim();

  const images = currentEditingImages.length > 0 ? currentEditingImages.slice(0, 10) : ['https://images.unsplash.com/photo-1581540222194-0def2dda95b8?auto=format&fit=crop&w=1000&q=80'];

  const features = document.getElementById('form-car-features').value.trim().split('\n').filter(Boolean);
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
                <div style="font-size: 0.75rem; color: var(--silver-500);">david.m@example.com • (555) 349-1120</div>
              </td>
              <td>2023 Toyota RAV4 (SM-4821)</td>
              <td><span class="badge badge-blue">Test Drive</span></td>
              <td>Oct 8, 2026 @ 10:00 AM</td>
              <td><span class="badge badge-green">Confirmed</span></td>
              <td><button class="btn btn-silver btn-sm" onclick="showToast('Lead marked contacted', 'info')">Contact</button></td>
            </tr>
            <tr>
              <td>
                <div style="font-weight: 700; color: #fff;">Sarah Jenkins</div>
                <div style="font-size: 0.75rem; color: var(--silver-500);">sarah.j@example.com • (555) 890-4421</div>
              </td>
              <td>2023 Ford F-150 (SM-4823)</td>
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
