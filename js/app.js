/**
 * Silver Motors Main Application Logic
 * Interactive marketplace, filtering, quick view, test drive booking & favorites
 */

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

// Global state
let currentFilters = {
  keyword: '',
  make: 'all',
  bodyType: 'all',
  condition: 'all',
  fuelType: 'all',
  transmission: 'all',
  maxPrice: 250000,
  minYear: 2000,
  sortBy: 'featured'
};

let currentView = 'grid'; // 'grid' | 'list'
let wishlist = JSON.parse(localStorage.getItem('silver_wishlist') || '[]');
let compareList = JSON.parse(localStorage.getItem('silver_compare') || '[]');

function initApp() {
  initMobileMenu();
  updateWishlistCount();
  updateCompareDrawer();
  
  // Detect if on homepage or marketplace page
  const isInventoryPage = document.getElementById('inventory-grid') !== null;
  const isHomePage = document.getElementById('featured-vehicles-grid') !== null;

  if (isInventoryPage) {
    parseUrlParams();
    populateFilterDropdowns();
    setupInventoryFilters();
    renderInventory();
  } else if (isHomePage) {
    populateHomeDropdowns();
    renderFeaturedVehicles();
  }

  // Real-time Cloud Sync with Firebase
  if (typeof subscribeToMarketplaceVehicles === 'function') {
    subscribeToMarketplaceVehicles((cloudVehicles) => {
      if (isInventoryPage) {
        populateFilterDropdowns();
        renderInventory();
      } else if (isHomePage) {
        populateHomeDropdowns();
        renderFeaturedVehicles();
      }
    });
  }

  setupGlobalModals();
}

/* ----------------------------------------------------
   Mobile Navigation Toggle
----------------------------------------------------- */
function initMobileMenu() {
  const toggleBtn = document.querySelector('.mobile-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (toggleBtn && navLinks) {
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      navLinks.classList.toggle('mobile-active');
    });

    // Close when clicking nav links
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('mobile-active');
      });
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (!navLinks.contains(e.target) && !toggleBtn.contains(e.target)) {
        navLinks.classList.remove('mobile-active');
      }
    });
  }
}

/* ----------------------------------------------------
   Home Page Search & Featured Vehicles
----------------------------------------------------- */
function populateHomeDropdowns() {
  const makeSelect = document.getElementById('home-filter-make');
  const bodySelect = document.getElementById('home-filter-body');

  if (makeSelect) {
    const makes = getAllMakes();
    makes.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m;
      opt.textContent = m;
      makeSelect.appendChild(opt);
    });
  }

  if (bodySelect) {
    const types = getAllBodyTypes();
    types.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t;
      opt.textContent = t;
      bodySelect.appendChild(opt);
    });
  }

  const homeSearchForm = document.getElementById('home-search-form');
  if (homeSearchForm) {
    homeSearchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const make = document.getElementById('home-filter-make')?.value || 'all';
      const body = document.getElementById('home-filter-body')?.value || 'all';
      const maxPrice = document.getElementById('home-filter-price')?.value || '';
      
      const queryParams = new URLSearchParams();
      if (make !== 'all') queryParams.set('make', make);
      if (body !== 'all') queryParams.set('bodyType', body);
      if (maxPrice) queryParams.set('maxPrice', maxPrice);

      window.location.href = `inventory.html?${queryParams.toString()}`;
    });
  }
}

function renderFeaturedVehicles() {
  const container = document.getElementById('featured-vehicles-grid');
  if (!container) return;

  const featured = VEHICLES_DATA.filter(v => v.featured).slice(0, 6);
  container.innerHTML = featured.map(car => createVehicleCardHtml(car)).join('');
  attachCardEvents(container);
}

/* ----------------------------------------------------
   Marketplace & Inventory Page Logic
----------------------------------------------------- */
function parseUrlParams() {
  const params = new URLSearchParams(window.location.search);
  if (params.has('make')) currentFilters.make = params.get('make');
  if (params.has('bodyType')) currentFilters.bodyType = params.get('bodyType');
  if (params.has('condition')) currentFilters.condition = params.get('condition');
  if (params.has('fuelType')) currentFilters.fuelType = params.get('fuelType');
  if (params.has('maxPrice')) currentFilters.maxPrice = parseInt(params.get('maxPrice')) || 250000;
  if (params.has('q')) currentFilters.keyword = params.get('q');
}

function populateFilterDropdowns() {
  const makeFilter = document.getElementById('filter-make');
  if (makeFilter) {
    const makes = getAllMakes();
    makes.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m;
      opt.textContent = m;
      if (m === currentFilters.make) opt.selected = true;
      makeFilter.appendChild(opt);
    });
  }

  const bodyFilter = document.getElementById('filter-body');
  if (bodyFilter) {
    const types = getAllBodyTypes();
    types.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t;
      opt.textContent = t;
      if (t === currentFilters.bodyType) opt.selected = true;
      bodyFilter.appendChild(opt);
    });
  }

  // Update price range slider display
  const priceSlider = document.getElementById('filter-price-slider');
  const priceValText = document.getElementById('filter-price-val');
  if (priceSlider && priceValText) {
    priceSlider.value = currentFilters.maxPrice;
    priceValText.textContent = formatPrice(currentFilters.maxPrice);
  }

  const keywordInput = document.getElementById('filter-keyword');
  if (keywordInput && currentFilters.keyword) {
    keywordInput.value = currentFilters.keyword;
  }
}

function setupInventoryFilters() {
  // Keyword search input
  const keywordInput = document.getElementById('filter-keyword');
  if (keywordInput) {
    keywordInput.addEventListener('input', (e) => {
      currentFilters.keyword = e.target.value.trim().toLowerCase();
      renderInventory();
    });
  }

  // Dropdown Selects
  const makeFilter = document.getElementById('filter-make');
  if (makeFilter) {
    makeFilter.addEventListener('change', (e) => {
      currentFilters.make = e.target.value;
      renderInventory();
    });
  }

  const bodyFilter = document.getElementById('filter-body');
  if (bodyFilter) {
    bodyFilter.addEventListener('change', (e) => {
      currentFilters.bodyType = e.target.value;
      renderInventory();
    });
  }

  // Price Slider
  const priceSlider = document.getElementById('filter-price-slider');
  const priceValText = document.getElementById('filter-price-val');
  if (priceSlider && priceValText) {
    priceSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      currentFilters.maxPrice = val;
      priceValText.textContent = formatPrice(val);
      renderInventory();
    });
  }

  // Condition Radios / Checkboxes
  const conditionRadios = document.querySelectorAll('input[name="filter-condition"]');
  conditionRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      if (e.target.checked) {
        currentFilters.condition = e.target.value;
        renderInventory();
      }
    });
  });

  // Fuel Type Radios
  const fuelRadios = document.querySelectorAll('input[name="filter-fuel"]');
  fuelRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      if (e.target.checked) {
        currentFilters.fuelType = e.target.value;
        renderInventory();
      }
    });
  });

  // Sort Dropdown
  const sortSelect = document.getElementById('sort-inventory');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentFilters.sortBy = e.target.value;
      renderInventory();
    });
  }

  // View switch (Grid vs List)
  const viewGridBtn = document.getElementById('btn-view-grid');
  const viewListBtn = document.getElementById('btn-view-list');
  if (viewGridBtn && viewListBtn) {
    viewGridBtn.addEventListener('click', () => {
      currentView = 'grid';
      viewGridBtn.classList.add('active');
      viewListBtn.classList.remove('active');
      renderInventory();
    });
    viewListBtn.addEventListener('click', () => {
      currentView = 'list';
      viewListBtn.classList.add('active');
      viewGridBtn.classList.remove('active');
      renderInventory();
    });
  }

  // Reset Filters Button
  const resetBtn = document.getElementById('btn-reset-filters');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      currentFilters = {
        keyword: '',
        make: 'all',
        bodyType: 'all',
        condition: 'all',
        fuelType: 'all',
        transmission: 'all',
        maxPrice: 250000,
        minYear: 2000,
        sortBy: 'featured'
      };
      if (keywordInput) keywordInput.value = '';
      if (makeFilter) makeFilter.value = 'all';
      if (bodyFilter) bodyFilter.value = 'all';
      if (priceSlider) priceSlider.value = 250000;
      if (priceValText) priceValText.textContent = formatPrice(250000);
      
      const allConditionRadio = document.querySelector('input[name="filter-condition"][value="all"]');
      if (allConditionRadio) allConditionRadio.checked = true;
      const allFuelRadio = document.querySelector('input[name="filter-fuel"][value="all"]');
      if (allFuelRadio) allFuelRadio.checked = true;

      renderInventory();
      showToast('Filters reset to default');
    });
  }

  // Quick Filter Chips on top
  const chipBtns = document.querySelectorAll('.filter-chip-btn');
  chipBtns.forEach(chip => {
    chip.addEventListener('click', () => {
      const type = chip.dataset.filterType;
      const value = chip.dataset.filterValue;
      if (type === 'price') {
        currentFilters.maxPrice = parseInt(value);
        const priceSlider = document.getElementById('filter-price-slider');
        const priceValText = document.getElementById('filter-price-val');
        if (priceSlider) priceSlider.value = value;
        if (priceValText) priceValText.textContent = formatPrice(parseInt(value));
      } else if (type === 'bodyType') {
        currentFilters.bodyType = value;
        const bodyFilter = document.getElementById('filter-body');
        if (bodyFilter) bodyFilter.value = value;
      } else if (type === 'fuelType') {
        currentFilters.fuelType = value;
        const fuelRadio = document.querySelector(`input[name="filter-fuel"][value="${value}"]`);
        if (fuelRadio) fuelRadio.checked = true;
      } else if (type === 'condition') {
        currentFilters.condition = value;
        const condRadio = document.querySelector(`input[name="filter-condition"][value="${value}"]`);
        if (condRadio) condRadio.checked = true;
      }
      renderInventory();
    });
  });

  // Mobile filter drawer triggers
  const mobileFilterOpenBtn = document.getElementById('btn-mobile-filter-open');
  const mobileFilterCloseBtn = document.getElementById('btn-mobile-filter-close');
  const sidebar = document.querySelector('.filter-sidebar');

  if (mobileFilterOpenBtn && sidebar) {
    mobileFilterOpenBtn.addEventListener('click', () => {
      sidebar.classList.add('active-mobile');
      document.body.style.overflow = 'hidden';
    });
  }

  if (mobileFilterCloseBtn && sidebar) {
    mobileFilterCloseBtn.addEventListener('click', () => {
      sidebar.classList.remove('active-mobile');
      document.body.style.overflow = '';
    });
  }
}

function getFilteredVehicles() {
  return VEHICLES_DATA.filter(car => {
    // Keyword
    if (currentFilters.keyword) {
      const searchStr = `${car.year} ${car.make} ${car.model} ${car.trim} ${car.engine} ${car.features.join(' ')}`.toLowerCase();
      if (!searchStr.includes(currentFilters.keyword)) return false;
    }

    // Make
    if (currentFilters.make !== 'all' && car.make !== currentFilters.make) return false;

    // Body Type
    if (currentFilters.bodyType !== 'all' && car.bodyType !== currentFilters.bodyType) return false;

    // Condition
    if (currentFilters.condition !== 'all' && car.condition !== currentFilters.condition) return false;

    // Fuel Type
    if (currentFilters.fuelType !== 'all' && car.fuelType !== currentFilters.fuelType) return false;

    // Max Price
    if (car.price > currentFilters.maxPrice) return false;

    return true;
  }).sort((a, b) => {
    switch (currentFilters.sortBy) {
      case 'price-asc': return a.price - b.price;
      case 'price-desc': return b.price - a.price;
      case 'mileage-asc': return a.mileage - b.mileage;
      case 'year-desc': return b.year - a.year;
      default: return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
    }
  });
}

function renderInventory() {
  const container = document.getElementById('inventory-grid');
  const countDisplay = document.getElementById('inventory-count');
  if (!container) return;

  const results = getFilteredVehicles();

  if (countDisplay) {
    countDisplay.innerHTML = `Showing <strong>${results.length}</strong> vehicles available`;
  }

  if (results.length === 0) {
    container.className = 'empty-results';
    container.innerHTML = `
      <div style="text-align: center; padding: 4rem 1.5rem; background: var(--bg-card); border-radius: var(--radius-lg); border: 1px dashed var(--border-medium); width: 100%;">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color: var(--silver-500); margin: 0 auto 1.5rem;">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <h3 style="font-size: 1.5rem; margin-bottom: 0.5rem; color: #fff;">No Vehicles Match Your Search</h3>
        <p style="color: var(--silver-500); max-width: 450px; margin: 0 auto 1.5rem;">Try adjusting your filters, increasing your max price, or clearing your search criteria to find available cars.</p>
        <button class="btn btn-silver" onclick="document.getElementById('btn-reset-filters').click();">Reset All Filters</button>
      </div>
    `;
    return;
  }

  container.className = currentView === 'grid' ? 'vehicles-grid' : 'vehicles-list';
  container.innerHTML = results.map(car => createVehicleCardHtml(car)).join('');
  attachCardEvents(container);
}

/* ----------------------------------------------------
   Vehicle Card Generator
----------------------------------------------------- */
function createVehicleCardHtml(car) {
  const isWishlisted = wishlist.includes(car.id);
  const isCompared = compareList.includes(car.id);
  const mainImage = (car.images && car.images[0]) ? car.images[0] : 'https://images.unsplash.com/photo-1581540222194-0def2dda95b8?auto=format&fit=crop&w=1000&q=80';
  const badgesList = Array.isArray(car.badges) ? car.badges : [];
  const transmissionShort = car.transmission ? car.transmission.split(' ')[0] : 'Auto';

  return `
    <article class="vehicle-card" data-vehicle-id="${car.id}">
      <div class="vehicle-thumb-wrap">
        <img src="${mainImage}" alt="${car.year || ''} ${car.make || ''} ${car.model || ''}" class="vehicle-img" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1581540222194-0def2dda95b8?auto=format&fit=crop&w=1000&q=80'">
        
        <div class="vehicle-badge-overlay">
          <span class="badge ${car.condition === 'Certified Pre-Owned' ? 'badge-blue' : 'badge-silver'}">${car.condition || 'Pre-Owned'}</span>
          ${badgesList.slice(0, 1).map(b => `<span class="badge badge-green">${b}</span>`).join('')}
        </div>

        <button class="btn-wishlist ${isWishlisted ? 'active' : ''}" title="Save to Wishlist" data-id="${car.id}" aria-label="Save to Wishlist">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="${isWishlisted ? '#ef4444' : 'none'}" stroke="currentColor" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        </button>
      </div>

      <div class="vehicle-details">
        <div class="vehicle-header-info">
          <div class="vehicle-year-make">${car.year || 2024} • ${car.make || ''} • Stock #${car.stockNumber || 'SM-0000'}</div>
          <h3 class="vehicle-name">${car.model || 'Vehicle'}</h3>
          <div class="vehicle-trim">${car.trim || ''}</div>
        </div>

        <div class="vehicle-specs-pills">
          <div class="spec-item" title="Mileage">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            <span>${formatNumber(car.mileage || 0)} mi</span>
          </div>
          <div class="spec-item" title="Drivetrain">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
            <span>${car.drivetrain || 'FWD'}</span>
          </div>
          <div class="spec-item" title="Fuel Type">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
            <span>${car.fuelType || 'Gasoline'}</span>
          </div>
          <div class="spec-item" title="Transmission">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            <span>${transmissionShort}</span>
          </div>
        </div>

        <div class="vehicle-pricing">
          <div>
            <div class="price-main">${formatPrice(car.price || 0)}</div>
            <div class="price-est">Est. $${car.monthlyEst || 0}/mo</div>
          </div>
          <button class="btn btn-dark btn-sm btn-compare ${isCompared ? 'active' : ''}" data-id="${car.id}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 3 21 3 21 8"></polyline><line x1="4" y1="20" x2="21" y2="3"></line><polyline points="21 16 21 21 16 21"></polyline><line x1="15" y1="15" x2="21" y2="21"></line><line x1="4" y1="4" x2="9" y2="9"></line></svg>
            ${isCompared ? 'Comparing' : 'Compare'}
          </button>
        </div>

        <div class="vehicle-card-actions">
          <button class="btn btn-silver btn-sm btn-quick-view" data-id="${car.id}">
            View Details
          </button>
          <button class="btn btn-outline btn-sm btn-book-drive" data-id="${car.id}" title="Book Test Drive">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            Test Drive
          </button>
        </div>
      </div>
    </article>
  `;
}

function attachCardEvents(parentEl) {
  // Wishlist toggle
  parentEl.querySelectorAll('.btn-wishlist').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const carId = btn.dataset.id;
      toggleWishlist(carId, btn);
    });
  });

  // Compare toggle
  parentEl.querySelectorAll('.btn-compare').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const carId = btn.dataset.id;
      toggleCompare(carId);
    });
  });

  // Quick View Modal
  parentEl.querySelectorAll('.btn-quick-view').forEach(btn => {
    btn.addEventListener('click', () => {
      const carId = btn.dataset.id;
      openVehicleModal(carId);
    });
  });

  // Test Drive Modal
  parentEl.querySelectorAll('.btn-book-drive').forEach(btn => {
    btn.addEventListener('click', () => {
      const carId = btn.dataset.id;
      openTestDriveModal(carId);
    });
  });
}

/* ----------------------------------------------------
   Wishlist / Favorites Logic
----------------------------------------------------- */
function toggleWishlist(carId, btnEl) {
  const index = wishlist.indexOf(carId);
  const car = getVehicleById(carId);
  if (index > -1) {
    wishlist.splice(index, 1);
    btnEl.classList.remove('active');
    btnEl.querySelector('path').setAttribute('fill', 'none');
    showToast(`Removed ${car ? car.make + ' ' + car.model : 'car'} from saved list`);
  } else {
    wishlist.push(carId);
    btnEl.classList.add('active');
    btnEl.querySelector('path').setAttribute('fill', '#ef4444');
    showToast(`Saved ${car ? car.make + ' ' + car.model : 'car'} to your favorites!`);
  }
  localStorage.setItem('silver_wishlist', JSON.stringify(wishlist));
  updateWishlistCount();
}

function updateWishlistCount() {
  const counters = document.querySelectorAll('.fav-counter');
  counters.forEach(c => {
    c.textContent = wishlist.length;
    c.style.display = wishlist.length > 0 ? 'flex' : 'none';
  });
}

/* ----------------------------------------------------
   Comparison System
----------------------------------------------------- */
function toggleCompare(carId) {
  const car = getVehicleById(carId);
  const index = compareList.indexOf(carId);
  if (index > -1) {
    compareList.splice(index, 1);
    showToast(`Removed ${car.make} ${car.model} from comparison`);
  } else {
    if (compareList.length >= 4) {
      showToast('You can compare a maximum of 4 vehicles at a time', 'error');
      return;
    }
    compareList.push(carId);
    showToast(`Added ${car.make} ${car.model} to comparison`);
  }
  localStorage.setItem('silver_compare', JSON.stringify(compareList));
  updateCompareDrawer();
  
  // Re-render inventory buttons state
  const isInventoryPage = document.getElementById('inventory-grid') !== null;
  if (isInventoryPage) renderInventory();
}

function updateCompareDrawer() {
  let drawer = document.getElementById('compare-drawer');
  if (!drawer) {
    drawer = document.createElement('div');
    drawer.id = 'compare-drawer';
    drawer.className = 'compare-bar';
    document.body.appendChild(drawer);
  }

  if (compareList.length === 0) {
    drawer.classList.remove('visible');
    return;
  }

  const comparedCars = compareList.map(id => getVehicleById(id)).filter(Boolean);

  drawer.innerHTML = `
    <div style="font-weight: 600; font-size: 0.9rem; color: #fff;">
      Compare (${comparedCars.length}/4):
    </div>
    <div class="compare-thumbs">
      ${comparedCars.map(c => `
        <div class="compare-thumb-item" title="${c.year} ${c.make} ${c.model}">
          <img src="${c.images[0]}" alt="${c.model}">
        </div>
      `).join('')}
    </div>
    <div style="display: flex; gap: 0.5rem;">
      <button class="btn btn-silver btn-sm" id="btn-open-compare-modal">
        View Comparison
      </button>
      <button class="btn btn-dark btn-sm" id="btn-clear-compare" title="Clear All">
        ✕
      </button>
    </div>
  `;

  drawer.classList.add('visible');

  document.getElementById('btn-open-compare-modal')?.addEventListener('click', openCompareModal);
  document.getElementById('btn-clear-compare')?.addEventListener('click', () => {
    compareList = [];
    localStorage.setItem('silver_compare', JSON.stringify([]));
    updateCompareDrawer();
    const isInventoryPage = document.getElementById('inventory-grid') !== null;
    if (isInventoryPage) renderInventory();
    showToast('Comparison cleared');
  });
}

function openCompareModal() {
  const cars = compareList.map(id => getVehicleById(id)).filter(Boolean);
  if (cars.length === 0) return;

  const modalBackdrop = document.getElementById('global-modal-backdrop');
  const modalContainer = document.getElementById('global-modal-container');
  if (!modalBackdrop || !modalContainer) return;

  modalContainer.innerHTML = `
    <button class="modal-close-btn" id="modal-close">✕</button>
    <div style="padding: 2rem;">
      <h2 style="font-size: 1.6rem; margin-bottom: 0.25rem;">Side-by-Side Comparison</h2>
      <p style="color: var(--silver-500); font-size: 0.9rem; margin-bottom: 1.5rem;">Comparing specifications & pricing of selected vehicles</p>
      
      <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; min-width: 600px; font-size: 0.9rem;">
          <thead>
            <tr style="border-bottom: 2px solid var(--border-medium);">
              <th style="text-align: left; padding: 1rem; color: var(--silver-500); width: 140px;">Vehicle</th>
              ${cars.map(c => `
                <th style="padding: 1rem; text-align: left; vertical-align: top;">
                  <img src="${c.images[0]}" alt="${c.model}" style="width: 100%; height: 110px; object-fit: cover; border-radius: 8px; margin-bottom: 0.5rem;">
                  <div style="font-size: 1rem; font-weight: 700; color: #fff;">${c.year} ${c.make} ${c.model}</div>
                  <div style="color: var(--silver-400); font-size: 0.8rem;">${c.trim}</div>
                  <div style="font-size: 1.25rem; font-weight: 800; color: #fff; margin-top: 0.5rem;">${formatPrice(c.price)}</div>
                </th>
              `).join('')}
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid var(--border-subtle); background: rgba(255,255,255,0.02);">
              <td style="padding: 0.85rem 1rem; font-weight: 600; color: var(--silver-400);">Mileage</td>
              ${cars.map(c => `<td style="padding: 0.85rem 1rem;">${formatNumber(c.mileage)} mi</td>`).join('')}
            </tr>
            <tr style="border-bottom: 1px solid var(--border-subtle);">
              <td style="padding: 0.85rem 1rem; font-weight: 600; color: var(--silver-400);">Body Type</td>
              ${cars.map(c => `<td style="padding: 0.85rem 1rem;">${c.bodyType}</td>`).join('')}
            </tr>
            <tr style="border-bottom: 1px solid var(--border-subtle); background: rgba(255,255,255,0.02);">
              <td style="padding: 0.85rem 1rem; font-weight: 600; color: var(--silver-400);">Drivetrain</td>
              ${cars.map(c => `<td style="padding: 0.85rem 1rem;"><span class="badge badge-silver">${c.drivetrain}</span></td>`).join('')}
            </tr>
            <tr style="border-bottom: 1px solid var(--border-subtle);">
              <td style="padding: 0.85rem 1rem; font-weight: 600; color: var(--silver-400);">Fuel Type</td>
              ${cars.map(c => `<td style="padding: 0.85rem 1rem;">${c.fuelType}</td>`).join('')}
            </tr>
            <tr style="border-bottom: 1px solid var(--border-subtle); background: rgba(255,255,255,0.02);">
              <td style="padding: 0.85rem 1rem; font-weight: 600; color: var(--silver-400);">Engine</td>
              ${cars.map(c => `<td style="padding: 0.85rem 1rem;">${c.engine}</td>`).join('')}
            </tr>
            <tr style="border-bottom: 1px solid var(--border-subtle);">
              <td style="padding: 0.85rem 1rem; font-weight: 600; color: var(--silver-400);">Transmission</td>
              ${cars.map(c => `<td style="padding: 0.85rem 1rem;">${c.transmission}</td>`).join('')}
            </tr>
            <tr style="border-bottom: 1px solid var(--border-subtle); background: rgba(255,255,255,0.02);">
              <td style="padding: 0.85rem 1rem; font-weight: 600; color: var(--silver-400);">Condition</td>
              ${cars.map(c => `<td style="padding: 0.85rem 1rem;"><span class="badge ${c.condition === 'Certified Pre-Owned' ? 'badge-blue' : 'badge-silver'}">${c.condition}</span></td>`).join('')}
            </tr>
            <tr>
              <td style="padding: 1.25rem 1rem;"></td>
              ${cars.map(c => `
                <td style="padding: 1.25rem 1rem;">
                  <button class="btn btn-silver btn-sm" style="width: 100%;" onclick="openTestDriveModal('${c.id}')">
                    Book Test Drive
                  </button>
                </td>
              `).join('')}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  modalBackdrop.classList.add('active');
  document.getElementById('modal-close').onclick = () => modalBackdrop.classList.remove('active');
}

/* ----------------------------------------------------
   Vehicle Details & Quick View Modal
----------------------------------------------------- */
function openVehicleModal(carId) {
  const car = getVehicleById(carId);
  if (!car) return;

  const modalBackdrop = document.getElementById('global-modal-backdrop');
  const modalContainer = document.getElementById('global-modal-container');
  if (!modalBackdrop || !modalContainer) return;

  let activeImgIndex = 0;

  modalContainer.innerHTML = `
    <button class="modal-close-btn" id="modal-close">✕</button>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; padding: 2rem;" class="vehicle-modal-grid">
      <div>
        <div style="aspect-ratio: 16/10; border-radius: var(--radius-md); overflow: hidden; background: #000; margin-bottom: 0.75rem; position: relative;" id="modal-media-container">
          <img id="modal-main-img" src="${car.images[0]}" alt="${car.model}" style="width: 100%; height: 100%; object-fit: cover;">
          ${car.video ? `
            <button id="btn-play-walkaround-video" style="position: absolute; bottom: 12px; right: 12px; background: rgba(0,0,0,0.8); color: #fff; border: 1px solid rgba(255,255,255,0.3); border-radius: 20px; padding: 6px 14px; font-size: 0.8rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 6px; backdrop-filter: blur(4px);">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              Watch Video Walkaround
            </button>
          ` : ''}
        </div>
        <div style="display: flex; gap: 0.5rem; overflow-x: auto; padding-bottom: 4px;">
          ${car.images.map((img, idx) => `
            <img src="${img}" class="modal-thumb ${idx === 0 ? 'active' : ''}" data-idx="${idx}" style="width: 65px; height: 46px; object-fit: cover; border-radius: 4px; cursor: pointer; border: 2px solid ${idx === 0 ? '#fff' : 'transparent'}; opacity: ${idx === 0 ? '1' : '0.6'}; flex-shrink: 0;">
          `).join('')}
        </div>

        <div style="margin-top: 1.5rem; background: var(--bg-input); padding: 1.25rem; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
          <h4 style="font-size: 0.95rem; margin-bottom: 0.75rem; color: #fff;">Estimated Monthly Payment</h4>
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.5rem;">
            <span style="font-size: 1.5rem; font-weight: 800; color: #60a5fa;">$${car.monthlyEst}</span>
            <span style="font-size: 0.8rem; color: var(--silver-500);">/month for 72 mos @ 5.9% APR</span>
          </div>
          <p style="font-size: 0.775rem; color: var(--silver-500);">*Based on $2,500 down payment. Terms subject to credit approval.</p>
        </div>
      </div>

      <div>
        <div style="margin-bottom: 1.25rem;">
          <div style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem;">
            <span class="badge ${car.condition === 'Certified Pre-Owned' ? 'badge-blue' : 'badge-silver'}">${car.condition}</span>
            <span class="badge badge-green">VIN: ${car.vin}</span>
          </div>
          <h2 style="font-size: 1.85rem; margin-bottom: 0.25rem;">${car.year} ${car.make} ${car.model}</h2>
          <div style="font-size: 1rem; color: var(--silver-400);">${car.trim}</div>
          <div style="font-size: 2rem; font-weight: 800; color: #fff; margin-top: 0.5rem; font-family: var(--font-heading);">${formatPrice(car.price)}</div>
        </div>

        <p style="font-size: 0.875rem; color: var(--silver-400); margin-bottom: 1.25rem; line-height: 1.6;">${car.overview}</p>

        <h4 style="font-size: 0.9rem; text-transform: uppercase; color: var(--silver-400); margin-bottom: 0.75rem; letter-spacing: 0.05em;">Key Specifications</h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem 1rem; font-size: 0.85rem; margin-bottom: 1.5rem; background: rgba(255,255,255,0.02); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
          <div><strong style="color: var(--silver-300);">Mileage:</strong> ${formatNumber(car.mileage)} mi</div>
          <div><strong style="color: var(--silver-300);">Drivetrain:</strong> ${car.drivetrain}</div>
          <div><strong style="color: var(--silver-300);">Engine:</strong> ${car.engine}</div>
          <div><strong style="color: var(--silver-300);">Transmission:</strong> ${car.transmission}</div>
          <div><strong style="color: var(--silver-300);">Exterior:</strong> ${car.exteriorColor}</div>
          <div><strong style="color: var(--silver-300);">Interior:</strong> ${car.interiorColor}</div>
        </div>

        <h4 style="font-size: 0.9rem; text-transform: uppercase; color: var(--silver-400); margin-bottom: 0.75rem; letter-spacing: 0.05em;">Top Features</h4>
        <ul style="list-style: none; display: grid; grid-template-columns: 1fr 1fr; gap: 0.4rem; font-size: 0.8rem; color: var(--silver-300); margin-bottom: 1.5rem;">
          ${car.features.map(f => `
            <li style="display: flex; align-items: center; gap: 0.35rem;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
              ${f}
            </li>
          `).join('')}
        </ul>

        <div style="display: flex; gap: 0.75rem;">
          <button class="btn btn-silver" style="flex: 1;" onclick="openTestDriveModal('${car.id}')">
            Book a Test Drive
          </button>
          <a href="financing.html?price=${car.price}&vehicle=${encodeURIComponent(car.year + ' ' + car.make + ' ' + car.model)}" class="btn btn-outline" style="flex: 1;">
            Calculate Financing
          </a>
        </div>
      </div>
    </div>
  `;

  // Gallery thumbnail clicks
  modalContainer.querySelectorAll('.modal-thumb').forEach(thumb => {
    thumb.addEventListener('click', (e) => {
      const idx = parseInt(thumb.dataset.idx);
      const mainImg = document.getElementById('modal-main-img');
      if (mainImg && car.images[idx]) {
        mainImg.src = car.images[idx];
      }
      modalContainer.querySelectorAll('.modal-thumb').forEach(t => {
        t.style.borderColor = 'transparent';
        t.style.opacity = '0.6';
      });
      thumb.style.borderColor = '#fff';
      thumb.style.opacity = '1';
    });
  });

  // Video Walkaround Click Handler
  const videoBtn = modalContainer.querySelector('#btn-play-walkaround-video');
  if (videoBtn && car.video) {
    videoBtn.addEventListener('click', () => {
      const mediaWrap = document.getElementById('modal-media-container');
      if (mediaWrap) {
        let embedHtml = '';
        if (car.video.includes('youtube.com') || car.video.includes('youtu.be')) {
          let videoId = '';
          if (car.video.includes('youtu.be/')) {
            videoId = car.video.split('youtu.be/')[1].split('?')[0];
          } else if (car.video.includes('v=')) {
            videoId = car.video.split('v=')[1].split('&')[0];
          }
          embedHtml = `<iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1" style="width: 100%; height: 100%; border: none;" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
        } else {
          embedHtml = `<video src="${car.video}" controls autoplay style="width: 100%; height: 100%; object-fit: contain; background: #000;"></video>`;
        }
        mediaWrap.innerHTML = embedHtml;
      }
    });
  }

  modalBackdrop.classList.add('active');
  document.getElementById('modal-close').onclick = () => modalBackdrop.classList.remove('active');
}

/* ----------------------------------------------------
   Test Drive Booking Modal
----------------------------------------------------- */
function openTestDriveModal(carId) {
  const car = getVehicleById(carId);
  const modalBackdrop = document.getElementById('global-modal-backdrop');
  const modalContainer = document.getElementById('global-modal-container');
  if (!modalBackdrop || !modalContainer) return;

  modalContainer.innerHTML = `
    <button class="modal-close-btn" id="modal-close">✕</button>
    <div style="padding: 2rem; max-width: 600px; margin: 0 auto;">
      <div style="text-align: center; margin-bottom: 1.75rem;">
        <div class="badge badge-silver" style="margin-bottom: 0.5rem;">VIP Showroom Appointment</div>
        <h2 style="font-size: 1.75rem; margin-bottom: 0.25rem;">Schedule a Test Drive</h2>
        <p style="color: var(--silver-400); font-size: 0.9rem;">
          ${car ? `You are scheduling a drive for <strong>${car.year} ${car.make} ${car.model}</strong> (${car.stockNumber})` : 'Select your vehicle and preferred time.'}
        </p>
      </div>

      <form id="test-drive-form" style="display: flex; flex-direction: column; gap: 1rem;">
        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">First Name *</label>
            <input type="text" class="form-control" required placeholder="John">
          </div>
          <div class="form-group">
            <label class="form-label">Last Name *</label>
            <input type="text" class="form-control" required placeholder="Doe">
          </div>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Email Address *</label>
            <input type="email" class="form-control" required placeholder="john@example.com">
          </div>
          <div class="form-group">
            <label class="form-label">Phone Number *</label>
            <input type="tel" class="form-control" required placeholder="(555) 000-1234">
          </div>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Preferred Date *</label>
            <input type="date" class="form-control" required value="${new Date().toISOString().split('T')[0]}">
          </div>
          <div class="form-group">
            <label class="form-label">Preferred Time *</label>
            <select class="form-control" required>
              <option>10:00 AM - Morning</option>
              <option>12:00 PM - Noon</option>
              <option>02:00 PM - Afternoon</option>
              <option>04:30 PM - Evening</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Do you have a vehicle to trade in?</label>
          <select class="form-control">
            <option>No, I am only test driving</option>
            <option>Yes, I want a trade-in appraisal</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Additional Questions or Requests</label>
          <textarea class="form-control" rows="2" placeholder="Any specific feature or questions about this vehicle?"></textarea>
        </div>

        <button type="submit" class="btn btn-silver btn-lg" style="margin-top: 0.5rem; width: 100%;">
          Confirm Test Drive Reservation
        </button>
      </form>
    </div>
  `;

  modalBackdrop.classList.add('active');
  document.getElementById('modal-close').onclick = () => modalBackdrop.classList.remove('active');

  document.getElementById('test-drive-form').addEventListener('submit', (e) => {
    e.preventDefault();
    modalBackdrop.classList.remove('active');
    showToast('🎉 Your Test Drive appointment has been confirmed! Our specialist will reach out shortly.', 'success');
  });
}

/* ----------------------------------------------------
   Global Modals Setup & Toast Notifications
----------------------------------------------------- */
function setupGlobalModals() {
  let backdrop = document.getElementById('global-modal-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.id = 'global-modal-backdrop';
    backdrop.className = 'modal-backdrop';
    backdrop.innerHTML = `<div id="global-modal-container" class="modal-container"></div>`;
    document.body.appendChild(backdrop);

    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) backdrop.classList.remove('active');
    });
  }

  // Toast Container
  let toastContainer = document.querySelector('.toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }
}

function showToast(message, type = 'info') {
  const container = document.querySelector('.toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  
  let icon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
  if (type === 'success') {
    icon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
  } else if (type === 'error') {
    icon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
  }

  toast.innerHTML = `${icon}<span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
