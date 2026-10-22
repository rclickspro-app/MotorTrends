/**
 * Motor Trends Auto Group Main Application Logic
 * Interactive marketplace, filtering, quick view, test drive booking & favorites
 * Features animated loader (vw leo.gif) on every page load & action
 */

// Universal Page Preloader
function initPreloader() {
  const preloader = document.getElementById('mt-page-preloader');
  if (!preloader) return;
  const minDisplayTime = 500; // brief display for smooth gif playback
  const startTime = Date.now();

  function dismiss() {
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, minDisplayTime - elapsed);
    setTimeout(() => {
      preloader.classList.add('preloader-hidden');
      setTimeout(() => {
        if (preloader.parentNode) preloader.parentNode.removeChild(preloader);
      }, 450);
    }, remaining);
  }

  if (document.readyState === 'complete') {
    dismiss();
  } else {
    window.addEventListener('load', dismiss);
    setTimeout(dismiss, 3000);
  }
}

// Global action loader for dynamic operations (filtering, forms, saves)
window.showActionLoader = function (msg) {
  let loader = document.getElementById('mt-action-loader');
  if (!loader) {
    loader = document.createElement('div');
    loader.id = 'mt-action-loader';
    loader.className = 'mt-action-loader';
    loader.innerHTML = `
      <div class="mt-preloader-content">
        <div class="mt-preloader-gif-wrap">
          <img src="images/vw leo.gif" alt="Loading..." class="mt-preloader-gif">
        </div>
        <div id="mt-action-loader-msg" style="color: #fff; font-weight: 700; font-size: 1rem; margin-top: 0.5rem; letter-spacing: 0.03em;">${msg || 'Loading...'}</div>
        <div style="font-size: 0.75rem; color: #60a5fa; margin-top: 0.25rem;">CAD Currency • Motor Trends Auto Group</div>
      </div>
    `;
    document.body.appendChild(loader);
  } else {
    const msgEl = document.getElementById('mt-action-loader-msg');
    if (msgEl) msgEl.textContent = msg || 'Loading...';
  }
  requestAnimationFrame(() => loader.classList.add('active'));
};

window.hideActionLoader = function () {
  const loader = document.getElementById('mt-action-loader');
  if (loader) {
    loader.classList.remove('active');
  }
};

// Fallback formatNumber helper if not loaded from data.js
if (typeof formatNumber !== 'function') {
  window.formatNumber = function (val) {
    if (val === undefined || val === null || val === '') return '0';
    const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/,/g, '')) || 0;
    return num.toLocaleString('en-CA');
  };
}

// Start preloader as early as possible
if (document.readyState === 'complete') {
  initPreloader();
} else {
  window.addEventListener('DOMContentLoaded', initPreloader);
}

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
  minPrice: 0,
  maxPrice: 250000,
  minYear: 2000,
  sortBy: 'featured'
};

let currentView = 'grid'; // 'grid' | 'list'
let wishlist = JSON.parse(localStorage.getItem('silver_wishlist') || '[]');
let compareList = JSON.parse(localStorage.getItem('silver_compare') || '[]');

function initApp() {
  setupGlobalModals();
  initMobileMenu();
  updateWishlistCount();
  updateCompareDrawer();
  initDealerAddressAlternator();

  // Detect if on homepage or marketplace page
  const isInventoryPage = document.getElementById('inventory-grid') !== null;
  const isHomePage = document.getElementById('featured-vehicles-grid') !== null;

  if (isInventoryPage) {
    parseUrlParams();
    populateFilterDropdowns();
    setupInventoryFilters();
    renderInventory();

    // Auto-open quick view modal if vehicle id or preview is specified in URL
    const urlParams = new URLSearchParams(window.location.search);
    const previewId = urlParams.get('id') || urlParams.get('preview');
    if (previewId) {
      setTimeout(() => {
        openVehicleModal(previewId);
      }, 100);
    }
  } else if (isHomePage) {
    initHeroSlideshow();
    populateHomeDropdowns();
    renderFeaturedVehicles();
    setTimeout(initDynamicPulseEffects, 2000);
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

  // Language change listener for live UI updates
  window.addEventListener('motortrends:languageChanged', () => {
    if (isInventoryPage) {
      populateFilterDropdowns();
      renderInventory();
    } else if (isHomePage) {
      populateHomeDropdowns();
      renderFeaturedVehicles();
    }
  });

  // Cross-tab real-time storage sync
  window.addEventListener('storage', (e) => {
    if (e.key === 'motortrends_vehicles_db_v3' || e.key === 'motortrends_vehicles_db' || e.key === 'motortrends_deleted_vehicles_ids') {
      const updated = (typeof getStoredVehicles === 'function') ? getStoredVehicles() : [];
      VEHICLES_DATA.length = 0;
      VEHICLES_DATA.push(...updated);
      if (isInventoryPage) {
        populateFilterDropdowns();
        renderInventory();
      } else if (isHomePage) {
        populateHomeDropdowns();
        renderFeaturedVehicles();
      }
    }
  });

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
   Synchronized Dealer Address & Contact Alternator
   Cycles between Richmond & Vancouver locations indefinitely
   every 4-5 seconds with smooth fade transition.
----------------------------------------------------- */
const DEALER_LOCATIONS = [
  {
    id: 'richmond',
    city: 'Richmond, BC',
    address: '10740 Cambie Road, Richmond, BC V6X 1K8',
    phone: '604-270-7662',
    phoneRaw: '6042707662',
    dealerNumber: '30859',
    topAddressHtml: '10740 Cambie Road, Richmond, BC V6X 1K8 <span class="dealer-tag">Dealer #30859</span>',
    slideInfoHtml: '<span>📍 10740 Cambie Road, Richmond, BC V6X 1K8</span><span>•</span><span>📞 <a href="tel:6042707662">604-270-7662</a></span><span>•</span><span class="dealer-tag">Dealer #30859</span>',
    footerShowroomHtml: '<strong>Showroom:</strong> 10740 Cambie Road, Richmond, BC V6X 1K8<br><strong>Phone:</strong> <a href="tel:6042707662" style="color: #60a5fa; font-weight: 700;">604-270-7662</a><br><strong>Dealer #:</strong> 30859<br><strong>Email:</strong> sales@motortrends.ca',
    footerCallBtnHtml: '📞 Call 604-270-7662',
    contactPillText: 'RICHMOND, BC DEALERSHIP • 604-270-7662 • DEALER #30859',
    contactCardHtml: '<div><strong>Dealership:</strong> Motor Trends Auto Group</div><div><strong>Address:</strong> 10740 Cambie Road, Richmond, BC V6X 1K8</div><div><strong>Telephone:</strong> <a href="tel:6042707662" style="color: #60a5fa; font-weight: 700;">604-270-7662</a></div><div><strong>Dealer #:</strong> 30859</div><div><strong>Email:</strong> sales@motortrends.ca</div><div style="font-size: 0.85rem; color: var(--silver-400); margin-top: 0.25rem;"><em>Quality pre-owned vehicle sales, leasing and financing in Richmond, BC.</em></div>',
    contactMapAddr: '10740 Cambie Road, Richmond, BC V6X 1K8',
    contactMapSubtext: 'Conveniently situated in Richmond, minutes from Vancouver • Dealer #30859',
    contactMapUrl: 'https://www.google.com/maps/search/?api=1&query=10740+Cambie+Road,+Richmond,+BC+V6X+1K8',
    aboutStoryHtml: 'Conveniently located at <strong>10740 Cambie Road, Richmond, BC V6X 1K8 (Dealer #30859)</strong>, our modern showroom and inventory lot host a diverse collection of thoroughly inspected SUVs, sedans, trucks, and hybrids.',
    trustDescHtml: 'Quality pre-owned vehicle sales, leasing and financing under one roof at 10740 Cambie Road, Richmond, BC. (Dealer #30859)'
  },
  {
    id: 'vancouver',
    city: 'Vancouver, BC',
    address: '1410 SW Marine Drive, Vancouver, British Columbia',
    phone: '604-243-9001',
    phoneRaw: '6042439001',
    dealerNumber: '40788',
    topAddressHtml: '1410 SW Marine Drive, Vancouver, British Columbia <span class="dealer-tag">Dealer #40788</span>',
    slideInfoHtml: '<span>📍 1410 SW Marine Drive, Vancouver, British Columbia</span><span>•</span><span>📞 <a href="tel:6042439001">604-243-9001</a></span><span>•</span><span class="dealer-tag">Dealer #40788</span>',
    footerShowroomHtml: '<strong>Showroom:</strong> 1410 SW Marine Drive, Vancouver, British Columbia<br><strong>Phone:</strong> <a href="tel:6042439001" style="color: #60a5fa; font-weight: 700;">604-243-9001</a><br><strong>Dealer #:</strong> 40788<br><strong>Email:</strong> sales@motortrends.ca',
    footerCallBtnHtml: '📞 Call 604-243-9001',
    contactPillText: 'VANCOUVER, BC DEALERSHIP • 604-243-9001 • DEALER #40788',
    contactCardHtml: '<div><strong>Dealership:</strong> Motor Trends Auto Group</div><div><strong>Address:</strong> 1410 SW Marine Drive, Vancouver, British Columbia</div><div><strong>Telephone:</strong> <a href="tel:6042439001" style="color: #60a5fa; font-weight: 700;">604-243-9001</a></div><div><strong>Dealer #:</strong> 40788</div><div><strong>Email:</strong> sales@motortrends.ca</div><div style="font-size: 0.85rem; color: var(--silver-400); margin-top: 0.25rem;"><em>Quality pre-owned vehicle sales, leasing and financing in Vancouver, BC.</em></div>',
    contactMapAddr: '1410 SW Marine Drive, Vancouver, British Columbia',
    contactMapSubtext: 'Conveniently situated on SW Marine Drive, Vancouver • Dealer #40788',
    contactMapUrl: 'https://www.google.com/maps/search/?api=1&query=1410+SW+Marine+Drive,+Vancouver,+British+Columbia',
    aboutStoryHtml: 'Conveniently located at <strong>1410 SW Marine Drive, Vancouver, British Columbia (Dealer #40788)</strong>, our modern showroom and inventory lot host a diverse collection of thoroughly inspected SUVs, sedans, trucks, and hybrids.',
    trustDescHtml: 'Quality pre-owned vehicle sales, leasing and financing under one roof at 1410 SW Marine Drive, Vancouver, British Columbia (Dealer #40788).'
  }
];

let currentDealerIndex = 0;
try {
  const savedIdx = parseInt(sessionStorage.getItem('mt_dealer_idx'), 10);
  if (!isNaN(savedIdx) && savedIdx >= 0 && savedIdx < DEALER_LOCATIONS.length) {
    currentDealerIndex = savedIdx;
  }
} catch (e) { }

let dealerAlternatorTimer = null;
const DEALER_DISPLAY_DURATION = 4500; // 4.5 seconds per address
const DEALER_FADE_DURATION = 350;    // 350ms smooth fade transition

function updateDealerElements(loc) {
  // 1. Top Bar Address
  document.querySelectorAll('.dealer-top-address').forEach(el => {
    el.innerHTML = loc.topAddressHtml;
  });

  // 2. Top Bar Phone Links
  document.querySelectorAll('.dealer-top-phone').forEach(el => {
    el.href = `tel:${loc.phoneRaw}`;
    el.textContent = loc.phone;
  });

  // 3. Hero Slide Dealer Info
  document.querySelectorAll('.dealer-slide-info').forEach(el => {
    el.innerHTML = loc.slideInfoHtml;
  });

  // 4. Footer Showroom Block
  document.querySelectorAll('.dealer-footer-showroom').forEach(el => {
    el.innerHTML = loc.footerShowroomHtml;
  });

  // 5. Footer Call Button
  document.querySelectorAll('.dealer-footer-phone-btn').forEach(el => {
    el.href = `tel:${loc.phoneRaw}`;
    el.innerHTML = loc.footerCallBtnHtml;
  });

  // 6. Contact Page Hero Pill
  document.querySelectorAll('.dealer-contact-pill').forEach(el => {
    el.textContent = loc.contactPillText;
  });

  // 7. Contact Page Showroom Card
  document.querySelectorAll('.dealer-contact-card').forEach(el => {
    el.innerHTML = loc.contactCardHtml;
  });

  // 8. Contact Page Map Box
  document.querySelectorAll('.dealer-contact-map-addr').forEach(el => {
    el.textContent = loc.contactMapAddr;
  });
  document.querySelectorAll('.dealer-contact-map-sub').forEach(el => {
    el.textContent = loc.contactMapSubtext;
  });
  document.querySelectorAll('.dealer-contact-map-btn').forEach(el => {
    el.href = loc.contactMapUrl;
  });

  // 9. About Page Showroom Story
  document.querySelectorAll('.dealer-about-story').forEach(el => {
    el.innerHTML = loc.aboutStoryHtml;
  });

  // 10. Index Page Trust Section
  document.querySelectorAll('.dealer-trust-desc').forEach(el => {
    el.innerHTML = loc.trustDescHtml;
  });
}

function switchDealerLocation(nextIndex) {
  if (typeof nextIndex === 'number') {
    currentDealerIndex = nextIndex % DEALER_LOCATIONS.length;
  } else {
    currentDealerIndex = (currentDealerIndex + 1) % DEALER_LOCATIONS.length;
  }

  try {
    sessionStorage.setItem('mt_dealer_idx', currentDealerIndex);
  } catch (e) { }

  const fadingElements = document.querySelectorAll('.dealer-transition');
  fadingElements.forEach(el => el.classList.add('dealer-fading'));

  setTimeout(() => {
    const loc = DEALER_LOCATIONS[currentDealerIndex];
    updateDealerElements(loc);

    fadingElements.forEach(el => el.classList.remove('dealer-fading'));
  }, DEALER_FADE_DURATION);
}

function startDealerAlternator() {
  if (dealerAlternatorTimer) clearInterval(dealerAlternatorTimer);
  dealerAlternatorTimer = setInterval(() => {
    switchDealerLocation();
  }, DEALER_DISPLAY_DURATION);
}

function stopDealerAlternator() {
  if (dealerAlternatorTimer) {
    clearInterval(dealerAlternatorTimer);
    dealerAlternatorTimer = null;
  }
}

function initDealerAddressAlternator() {
  const loc = DEALER_LOCATIONS[currentDealerIndex];
  updateDealerElements(loc);

  startDealerAlternator();

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopDealerAlternator();
    } else {
      startDealerAlternator();
    }
  });

  window.addEventListener('motortrends:languageChanged', () => {
    updateDealerElements(DEALER_LOCATIONS[currentDealerIndex]);
  });

  window.DealerAddressAlternator = {
    locations: DEALER_LOCATIONS,
    getCurrentIndex: () => currentDealerIndex,
    switchTo: switchDealerLocation,
    start: startDealerAlternator,
    stop: stopDealerAlternator
  };
}

/* ----------------------------------------------------
   Hero Banner Slideshow - Dynamic from Inventory
   Each visit: vehicles are randomly shuffled
   Left panel: rotating promo text
   Right panel: real vehicle from inventory (random)
----------------------------------------------------- */
function initHeroSlideshow() {
  var slider       = document.getElementById('hero-banner-slider');
  var dotsContainer= document.getElementById('slider-dots');
  var prevBtn      = document.getElementById('prev-slide');
  var nextBtn      = document.getElementById('next-slide');
  if (!slider) return;

  /* --- Fisher-Yates shuffle for true randomness each visit --- */
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  /* --- Pick up to 6 vehicles: admin slideshow picks first, new arrivals next, rest random --- */
  var heroVehicles= VEHICLES_DATA.filter(function(v) { return v.heroSlide || v.isSlideshow; });
  var newArrivals = VEHICLES_DATA.filter(function(v) { return v.isNewVehicle && !(v.heroSlide || v.isSlideshow); });
  var rest        = shuffle(VEHICLES_DATA.filter(function(v) { return !(v.heroSlide || v.isSlideshow) && !v.isNewVehicle; }));
  var pool        = heroVehicles.concat(newArrivals).concat(rest).slice(0, 6);
  if (!pool.length && VEHICLES_DATA.length) pool = shuffle(VEHICLES_DATA).slice(0, 6);

  if (!pool.length) {
    slider.innerHTML = '<div class="hero-slide active">' +
      '<div class="container" style="position:relative;z-index:3;">' +
      '<div class="hero-slide-grid" style="grid-template-columns: 1fr;">' +
      '<div class="hero-slide-content" style="max-width: 800px; margin: 0 auto; text-align: center;">' +
      '<div class="slide-pill">🔥 QUALITY PRE-OWNED VEHICLES</div>' +
      '<div class="slide-title">USED CARS, TRUCKS &amp; SUVs</div>' +
      '<div class="slide-highlight">MOTOR TRENDS AUTO GROUP</div>' +
      '<p class="slide-desc" style="max-width: 650px; margin: 0.75rem auto 1.5rem;">' +
        'Richmond\'s premier destination for quality pre-owned vehicles. Prime, subprime, first-time buyers, newcomers, and customers rebuilding credit welcome (OAC).' +
      '</p>' +
      '<div class="slide-dealer-info dealer-slide-info" style="justify-content: center; margin-bottom: 1.5rem;">' +
        '<span>📍 10740 Cambie Road, Richmond, BC</span><span>•</span>' +
        '<span>📞 <a href="tel:6042707662">604-270-7662</a></span><span>•</span>' +
        '<span class="dealer-tag">Dealer #30859</span>' +
      '</div>' +
      '<div class="slide-actions" style="justify-content: center;">' +
        '<a href="inventory.html" class="btn btn-blue btn-lg">Browse Inventory</a>' +
        '<a href="financing.html" class="btn btn-outline btn-lg">Apply for Financing (OAC)</a>' +
      '</div></div></div></div></div>';
    if (dotsContainer) dotsContainer.innerHTML = '';
    return;
  }

  /* --- 6 rotating promo messages for left text panel --- */
  var promos = [
    { pill: '🔥 QUALITY PRE-OWNED VEHICLES',     title: 'USED CARS, TRUCKS & SUVs',            hl: 'PRICED TO SELL!',
      desc: 'Motor Trends Auto Group is Richmond\'s destination for quality pre-owned vehicles — CarFax verified, professionally inspected, and ready to drive.',
      b1: {h:'inventory.html', l:'Browse Full Inventory →'}, b2: {h:'financing.html', l:'Apply Financing'} },
    { pill: '🏦 BUY HERE PAY HERE DEALERSHIP',    title: 'FINANCING FOR ALL CANADIANS',          hl: 'ALL CREDIT APPROVED!',
      desc: 'Prime, subprime, first-time buyers, newcomers, and customers rebuilding credit welcome (OAC). Flexible payment options tailored to your budget.',
      b1: {h:'financing.html', l:'Get Pre-Approved Today'}, b2: {h:'contact.html', l:'Talk to a Specialist →'} },
    { pill: '🔄 TRADE-IN & SELL YOUR CAR',        title: 'WE BUY VEHICLES IN ANY CONDITION',     hl: 'TOP DOLLAR PAID!',
      desc: 'Trade in against your next vehicle or sell for cash. Transparent appraisals backed by live BC market data. Same-day payment.',
      b1: {h:'sell-trade.html', l:'Start Trade-In Valuation'}, b2: {h:'inventory.html', l:'Browse Inventory →'} },
    { pill: '✅ CARFAX VERIFIED INVENTORY',        title: 'BUY WITH CONFIDENCE IN BC',            hl: 'EVERY VEHICLE INSPECTED!',
      desc: 'Every vehicle on our lot comes with a full CarFax history report. Serving Richmond, Vancouver, Surrey, Delta, Burnaby and the entire Lower Mainland.',
      b1: {h:'inventory.html', l:'View Available Cars →'}, b2: {h:'about.html', l:'About Motor Trends'} },
    { pill: '📍 RICHMOND & VANCOUVER BC',         title: "LOWER MAINLAND'S TRUSTED DEALER",      hl: 'DEALER #30859',
      desc: 'Visit us at 10740 Cambie Road in Richmond or browse online. Lease, finance, or buy outright — we have a payment plan that fits your budget.',
      b1: {h:'contact.html', l:'Visit Our Showroom →'}, b2: {h:'financing.html', l:'Lease & Finance Options'} },
    { pill: '💰 VEHICLES UNDER $10,000 CAD',      title: 'BUDGET-FRIENDLY OPTIONS AVAILABLE',    hl: 'STARTING FROM $8,888!',
      desc: 'From vehicles under $10,000 to late-model family SUVs — every vehicle professionally inspected and priced below BC market value.',
      b1: {h:'inventory.html?maxPrice=15000', l:'Under $15K Vehicles →'}, b2: {h:'financing.html', l:'Explore Financing'} }
  ];

  /* --- Build HTML for ONE slide --- */
  function makeSlideHTML(vehicle, promoIdx, isFirst) {
    var p   = promos[promoIdx % promos.length];
    var img = (Array.isArray(vehicle.images) && vehicle.images[0]) ? vehicle.images[0] : 'images/vehicles/jeep/main.jpg';
    var mainBadge = (vehicle.heroSlide || vehicle.isSlideshow)
      ? '<span class="v-badge v-badge-warning">🎬 Hero Showcase</span>'
      : vehicle.isNewVehicle
        ? '<span class="v-badge v-badge-new">🔥 New Arrival</span>'
        : vehicle.featured
          ? '<span class="v-badge v-badge-blue">⭐ Featured Vehicle</span>'
          : '<span class="v-badge v-badge-blue">Actual Inventory Stock</span>';
    var priceBadge = (vehicle.price && vehicle.price < 15000)
      ? '<span class="v-badge v-badge-warning">Great Value</span>'
      : '<span class="v-badge v-badge-dark">' + (vehicle.condition || 'Clean Title') + '</span>';

    return '<div class="hero-slide' + (isFirst ? ' active' : '') + '" data-vid="' + (vehicle.id || '') + '">' +
      '<div class="container" style="position:relative;z-index:3;">' +
      '<div class="hero-slide-grid">' +

      /* LEFT - promo text */
      '<div class="hero-slide-content">' +
      '<div class="slide-pill">' + p.pill + '</div>' +
      '<div class="slide-title">' + p.title + '</div>' +
      '<div class="slide-highlight">' + p.hl + '</div>' +
      '<p class="slide-desc">' + p.desc + '</p>' +
      '<div class="slide-dealer-info dealer-slide-info dealer-transition">' +
        '<span>📍 10740 Cambie Road, Richmond, BC</span><span>•</span>' +
        '<span>📞 <a href="tel:6042707662">604-270-7662</a></span><span>•</span>' +
        '<span class="dealer-tag">Dealer #30859</span>' +
      '</div>' +
      '<div class="slide-actions">' +
        '<a href="' + p.b1.h + '" class="btn btn-blue btn-lg">' + p.b1.l + '</a>' +
        '<a href="' + p.b2.h + '" class="btn btn-outline btn-lg">' + p.b2.l + '</a>' +
      '</div></div>' +

      /* RIGHT - vehicle card */
      '<div class="hero-vehicle-stage">' +
      '<div class="hero-vehicle-card">' +
        '<div class="vehicle-card-badge-row">' + mainBadge +
          '<span class="v-badge v-badge-success">Stock #' + (vehicle.stockNumber || 'MT-NEW') + '</span>' +
          priceBadge +
        '</div>' +
        '<div class="vehicle-card-image-wrapper">' +
          '<img src="' + img + '" alt="' + vehicle.year + ' ' + vehicle.make + ' ' + vehicle.model + '" class="hero-card-img"' +
          ' loading="lazy" onerror="this.src=\'images/vehicles/jeep/main.jpg\'">' +
          '<div class="vehicle-image-shine"></div>' +
        '</div>' +
        '<div class="vehicle-card-details">' +
          '<div class="vehicle-card-header">' +
            '<div>' +
              '<div class="vehicle-card-year-make">' + vehicle.year + ' ' + vehicle.make + ' ' + vehicle.model + '</div>' +
              '<div class="vehicle-card-trim">' + (vehicle.trim || '') + '</div>' +
            '</div>' +
            '<div class="vehicle-card-price-block">' +
              '<div class="vehicle-card-price">' + formatPrice(vehicle.price) + '</div>' +
            '</div>' +
          '</div>' +
          '<div class="vehicle-card-specs-row">' +
            '<span class="v-spec-pill">🛣️ ' + formatNumber(vehicle.mileage || 0) + ' KM</span>' +
            '<span class="v-spec-pill">⚡ ' + (vehicle.fuelType || 'Gasoline') + '</span>' +
            '<span class="v-spec-pill">🛡️ ' + (vehicle.drivetrain || 'FWD') + '</span>' +
            '<span class="v-spec-pill">✨ ' + (vehicle.transmission ? vehicle.transmission.split(' ')[0] : 'Auto') + '</span>' +
          '</div>' +
          '<div class="vehicle-card-actions">' +
            '<a href="inventory.html?q=' + encodeURIComponent(vehicle.stockNumber || vehicle.model || '') + '" class="btn btn-blue btn-sm" style="flex:1;justify-content:center;">View In Stock</a>' +
            '<a href="financing.html?stock=' + encodeURIComponent(vehicle.stockNumber || '') + '" class="btn btn-silver btn-sm" style="justify-content:center;">Finance This Car</a>' +
          '</div>' +
        '</div>' +
      '</div></div>' +

      '</div></div></div>';
  }

  /* --- Inject all slides --- */
  slider.innerHTML = pool.map(function(v, i) { return makeSlideHTML(v, i, i === 0); }).join('');

  /* --- Rebuild dots --- */
  if (dotsContainer) {
    dotsContainer.innerHTML = pool.map(function(_, i) {
      return '<button class="slider-dot' + (i === 0 ? ' active' : '') + '" data-index="' + i + '" aria-label="Slide ' + (i+1) + '"></button>';
    }).join('');
  }

  /* --- Slideshow controller with directional animation --- */
  var currentIndex = 0;
  var slideInterval = null;
  var DELAY = 5500;
  var isAnimating = false;

  function goToSlide(idx, dir) {
    if (isAnimating) return;
    var slides = slider.querySelectorAll('.hero-slide');
    var dots   = dotsContainer ? dotsContainer.querySelectorAll('.slider-dot') : [];
    if (!slides.length) return;

    var direction = (typeof dir !== 'undefined') ? dir : (idx > currentIndex ? 1 : -1);
    var outClass  = direction > 0 ? 'slide-exit-left'  : 'slide-exit-right';
    var inClass   = direction > 0 ? 'slide-enter-right' : 'slide-enter-left';

    isAnimating = true;
    var outSlide = slides[currentIndex];
    outSlide.classList.add(outClass);

    currentIndex = ((idx % slides.length) + slides.length) % slides.length;

    // Update dots
    for (var d = 0; d < dots.length; d++) dots[d].classList.remove('active');
    if (dots[currentIndex]) dots[currentIndex].classList.add('active');

    // Enter new slide
    var inSlide = slides[currentIndex];
    inSlide.classList.add(inClass, 'active');

    function onOutEnd() {
      outSlide.classList.remove('active', outClass);
      outSlide.removeEventListener('animationend', onOutEnd);
    }
    function onInEnd() {
      inSlide.classList.remove(inClass);
      inSlide.removeEventListener('animationend', onInEnd);
      isAnimating = false;
    }
    outSlide.addEventListener('animationend', onOutEnd);
    inSlide.addEventListener('animationend', onInEnd);

    // Safety fallback in case animationend doesn't fire
    setTimeout(function() {
      outSlide.classList.remove('active', outClass);
      inSlide.classList.remove(inClass);
      isAnimating = false;
    }, 750);
  }

  function next() { goToSlide(currentIndex + 1, 1); }
  function prev() { goToSlide(currentIndex - 1, -1); }
  function startAuto() { stopAuto(); slideInterval = setInterval(next, DELAY); }
  function stopAuto()  { if (slideInterval) { clearInterval(slideInterval); slideInterval = null; } }

  if (nextBtn) nextBtn.addEventListener('click', function() { next(); startAuto(); });
  if (prevBtn) prevBtn.addEventListener('click', function() { prev(); startAuto(); });

  if (dotsContainer) {
    dotsContainer.addEventListener('click', function(e) {
      var dot = e.target.closest ? e.target.closest('.slider-dot') : e.target;
      if (dot && dot.dataset && dot.dataset.index !== undefined) {
        var i = parseInt(dot.dataset.index, 10);
        if (!isNaN(i)) { goToSlide(i); startAuto(); }
      }
    });
  }

  slider.addEventListener('mouseenter', stopAuto);
  slider.addEventListener('mouseleave', startAuto);

  document.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowRight') { next(); startAuto(); }
    else if (e.key === 'ArrowLeft') { prev(); startAuto(); }
  });

  var touchX = 0;
  slider.addEventListener('touchstart', function(e) {
    if (e.changedTouches[0]) touchX = e.changedTouches[0].screenX;
  }, { passive: true });
  slider.addEventListener('touchend', function(e) {
    if (e.changedTouches[0]) {
      var dx = e.changedTouches[0].screenX - touchX;
      if (dx < -45) { next(); startAuto(); }
      else if (dx > 45) { prev(); startAuto(); }
    }
  }, { passive: true });

  document.addEventListener('visibilitychange', function() {
    document.hidden ? stopAuto() : startAuto();
  });

  startAuto();
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
  updateHomeLiveStockCounts();
  const container = document.getElementById('featured-vehicles-grid');
  if (!container) return;

  const sortedFeatured = [...VEHICLES_DATA]
    .filter(v => v.featured || v.isNewVehicle)
    .sort((a, b) => {
      const newA = a.isNewVehicle ? 1 : 0;
      const newB = b.isNewVehicle ? 1 : 0;
      if (newB !== newA) return newB - newA;

      if (a.createdAt || b.createdAt) {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (timeB !== timeA) return timeB - timeA;
      }
      return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
    })
    .slice(0, 6);

  if (!sortedFeatured.length) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1.5rem; background: #ffffff; border-radius: 12px; border: 1px dashed #CBD5E1;">
        <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🚗</div>
        <h3 style="font-size: 1.25rem; font-weight: 700; color: #0F172A; margin-bottom: 0.5rem;">Live Inventory Arriving Daily</h3>
        <p style="color: #64748B; font-size: 0.9rem; max-width: 480px; margin: 0 auto 1.25rem;">
          Our live inventory is currently being updated. Apply for pre-approval or contact our sales specialists to reserve your vehicle!
        </p>
        <div style="display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap;">
          <a href="contact.html" class="btn btn-blue btn-sm">Contact Sales Specialist</a>
          <a href="financing.html" class="btn btn-outline btn-sm">Get Pre-Approved (OAC)</a>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = sortedFeatured.map(car => createVehicleCardHtml(car)).join('');
  attachCardEvents(container);
}

function updateHomeLiveStockCounts() {
  const totalCount = VEHICLES_DATA.length;
  const numEl = document.getElementById('live-stock-count-number');
  if (numEl) numEl.textContent = totalCount;
  const btnCountEl = document.getElementById('featured-view-all-count');
  if (btnCountEl) btnCountEl.textContent = totalCount;

  // Category counts
  const suvCount = VEHICLES_DATA.filter(v => v.bodyType === 'SUV').length;
  const sedanCount = VEHICLES_DATA.filter(v => v.bodyType === 'Sedan').length;
  const truckCount = VEHICLES_DATA.filter(v => v.bodyType === 'Truck').length;
  const hybridCount = VEHICLES_DATA.filter(v => v.fuelType === 'Hybrid' || v.fuelType === 'Electric').length;
  const vanCount = VEHICLES_DATA.filter(v => v.bodyType === 'Van').length;

  const suvEl = document.getElementById('body-count-suv');
  if (suvEl) suvEl.textContent = `${suvCount} Available`;
  const sedanEl = document.getElementById('body-count-sedan');
  if (sedanEl) sedanEl.textContent = `${sedanCount} Available`;
  const truckEl = document.getElementById('body-count-truck');
  if (truckEl) truckEl.textContent = `${truckCount} Available`;
  const hybridEl = document.getElementById('body-count-hybrid');
  if (hybridEl) hybridEl.textContent = `${hybridCount} Available`;
  const vanEl = document.getElementById('body-count-van');
  if (vanEl) vanEl.textContent = `${vanCount} Available`;
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
  if (params.has('q')) currentFilters.keyword = params.get('q').trim().toLowerCase();
  if (params.has('search')) currentFilters.keyword = params.get('search').trim().toLowerCase();
  if (params.has('stock')) currentFilters.keyword = params.get('stock').trim().toLowerCase();
}

function populateFilterDropdowns() {
  const makeFilter = document.getElementById('filter-make');
  if (makeFilter) {
    const prevMake = currentFilters.make;
    makeFilter.innerHTML = '<option value="all" data-i18n="filter_all_makes">All Makes</option>';
    const makes = getAllMakes();
    makes.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m;
      opt.textContent = m;
      if (m === prevMake) opt.selected = true;
      makeFilter.appendChild(opt);
    });
  }

  const bodyFilter = document.getElementById('filter-body');
  if (bodyFilter) {
    const prevBody = currentFilters.bodyType;
    bodyFilter.innerHTML = '<option value="all" data-i18n="filter_all_body_types">All Body Types</option>';
    const types = getAllBodyTypes();
    types.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t;
      opt.textContent = t;
      if (t === prevBody) opt.selected = true;
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
    // Keyword search matching id, stockNumber, vin, year, make, model, trim, engine, colors, body, fuel, features, badges
    if (currentFilters.keyword) {
      const featuresStr = Array.isArray(car.features) ? car.features.join(' ') : '';
      const badgesStr = Array.isArray(car.badges) ? car.badges.join(' ') : '';
      const searchStr = `${car.id || ''} ${car.stockNumber || ''} ${car.vin || ''} ${car.year || ''} ${car.make || ''} ${car.model || ''} ${car.trim || ''} ${car.engine || ''} ${car.exteriorColor || ''} ${car.interiorColor || ''} ${car.bodyType || ''} ${car.fuelType || ''} ${featuresStr} ${badgesStr}`.toLowerCase();
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

    // Price range starting at minPrice ($0 CAD) up to maxPrice
    const carPriceNum = (typeof car.price === 'number') ? car.price : (parseFloat(car.price) || 0);
    if (carPriceNum < (currentFilters.minPrice || 0) || carPriceNum > currentFilters.maxPrice) return false;

    return true;
  }).sort((a, b) => {
    const priceA = (typeof a.price === 'number') ? a.price : (parseFloat(a.price) || 0);
    const priceB = (typeof b.price === 'number') ? b.price : (parseFloat(b.price) || 0);
    const mileageA = (typeof a.mileage === 'number') ? a.mileage : (parseInt(a.mileage) || 0);
    const mileageB = (typeof b.mileage === 'number') ? b.mileage : (parseInt(b.mileage) || 0);
    const yearA = (typeof a.year === 'number') ? a.year : (parseInt(a.year) || 0);
    const yearB = (typeof b.year === 'number') ? b.year : (parseInt(b.year) || 0);

    switch (currentFilters.sortBy) {
      case 'price-asc': return priceA - priceB;
      case 'price-desc': return priceB - priceA;
      case 'mileage-asc': return mileageA - mileageB;
      case 'year-desc': return yearB - yearA;
      default: {
        // Priority 1: New Vehicle Added Flag
        const newA = a.isNewVehicle ? 1 : 0;
        const newB = b.isNewVehicle ? 1 : 0;
        if (newB !== newA) return newB - newA;

        // Priority 2: Creation timestamp if available
        if (a.createdAt || b.createdAt) {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          if (timeB !== timeA) return timeB - timeA;
        }

        // Priority 3: Featured flag
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      }
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
  const mainImage = (Array.isArray(car.images) && car.images[0]) ? car.images[0] : 'https://images.unsplash.com/photo-1581540222194-0def2dda95b8?auto=format&fit=crop&w=1000&q=80';
  const badgesList = Array.isArray(car.badges) ? car.badges : [];
  const transmissionShort = car.transmission ? car.transmission.split(' ')[0] : 'Auto';

  return `
    <article class="vehicle-card" data-vehicle-id="${car.id}">
      <div class="vehicle-thumb-wrap">
        <img src="${mainImage}" alt="${car.year || ''} ${car.make || ''} ${car.model || ''}" class="vehicle-img" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1581540222194-0def2dda95b8?auto=format&fit=crop&w=1000&q=80'">
        
        <div class="vehicle-badge-overlay">
          ${car.isNewVehicle ? `<span class="badge badge-new">🔥 New Arrival</span>` : ''}
          <span class="badge ${car.condition === 'Certified Pre-Owned' ? 'badge-blue' : 'badge-silver'}">${car.condition || 'Pre-Owned'}</span>
          ${badgesList.filter(b => b !== 'New Arrival').slice(0, 1).map(b => `<span class="badge badge-green">${b}</span>`).join('')}
        </div>

        <button class="btn-wishlist ${isWishlisted ? 'active' : ''}" title="Save to Wishlist" data-id="${car.id}" aria-label="Save to Wishlist">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="${isWishlisted ? '#ef4444' : 'none'}" stroke="currentColor" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        </button>
      </div>

      <div class="vehicle-details">
        <div class="vehicle-header-info">
          <div class="vehicle-year-make">${car.year || 2024} • ${car.make || ''} • Stock #${car.stockNumber || 'MT-0000'}</div>
          <h3 class="vehicle-name">${car.model || 'Vehicle'}</h3>
          <div class="vehicle-trim">${car.trim || ''}</div>
        </div>

        <div class="vehicle-specs-pills">
          <div class="spec-item" title="Mileage">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            <span>${formatNumber(car.mileage || 0)} km</span>
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
          <img src="${(Array.isArray(c.images) && c.images[0]) ? c.images[0] : 'https://images.unsplash.com/photo-1581540222194-0def2dda95b8?auto=format&fit=crop&w=400&q=80'}" alt="${c.model}">
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
                  <img src="${(Array.isArray(c.images) && c.images[0]) ? c.images[0] : 'https://images.unsplash.com/photo-1581540222194-0def2dda95b8?auto=format&fit=crop&w=400&q=80'}" alt="${c.model}" style="width: 100%; height: 110px; object-fit: cover; border-radius: 8px; margin-bottom: 0.5rem;">
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
              ${cars.map(c => `<td style="padding: 0.85rem 1rem;">${formatNumber(c.mileage)} km</td>`).join('')}
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

  const carImages = (Array.isArray(car.images) && car.images.length > 0)
    ? car.images
    : (car.image ? [car.image] : ['images/vehicles/jeep/main.jpg']);
  const carFeatures = Array.isArray(car.features) ? car.features : [];

  let currentImgIdx = 0;
  const totalImgs = carImages.length;

  modalContainer.innerHTML = `
    <button class="modal-close-btn" id="modal-close">✕</button>
    <div class="vehicle-modal-grid">
      <div class="modal-gallery-wrapper">
        <!-- Main Image with Arrows & Counter -->
        <div class="modal-main-image-stage" id="modal-media-container">
          <img id="modal-main-img" src="${carImages[0]}" alt="${car.model}">
          
          <div class="modal-image-counter">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            <span id="modal-img-counter-text">1 / ${totalImgs}</span>
          </div>

          ${totalImgs > 1 ? `
            <button class="modal-nav-arrow modal-nav-prev" id="modal-prev-img" aria-label="Previous Image">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            <button class="modal-nav-arrow modal-nav-next" id="modal-next-img" aria-label="Next Image">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          ` : ''}

          ${car.video ? `
            <button id="btn-play-walkaround-video" style="position: absolute; bottom: 12px; right: 12px; background: rgba(0,0,0,0.85); color: #fff; border: 1px solid rgba(255,255,255,0.3); border-radius: 20px; padding: 6px 14px; font-size: 0.8rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 6px; backdrop-filter: blur(4px); z-index: 5;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              Watch Video
            </button>
          ` : ''}
        </div>

        <!-- Thumbnails Strip with Side Scroll Controls -->
        <div class="modal-thumbs-carousel-wrap">
          ${totalImgs > 4 ? `
            <button class="thumb-scroll-btn" id="thumb-scroll-left" aria-label="Scroll Left">‹</button>
          ` : ''}
          <div class="modal-thumbs-scroll" id="modal-thumbs-container">
            ${carImages.map((img, idx) => `
              <div class="modal-thumb-item ${idx === 0 ? 'active' : ''}" data-idx="${idx}">
                <img src="${img}" alt="${car.model} Photo ${idx + 1}" loading="lazy">
              </div>
            `).join('')}
          </div>
          ${totalImgs > 4 ? `
            <button class="thumb-scroll-btn" id="thumb-scroll-right" aria-label="Scroll Right">›</button>
          ` : ''}
        </div>

      </div>

      <div>
        <div style="margin-bottom: 1.25rem;">
          <div style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem; flex-wrap: wrap;">
            ${car.isNewVehicle ? `<span class="badge badge-new">🔥 New Arrival</span>` : ''}
            <span class="badge ${car.condition === 'Certified Pre-Owned' ? 'badge-blue' : 'badge-silver'}">${car.condition}</span>
            ${car.vin && car.vin !== 'N/A' ? `<span class="badge badge-green">VIN: ${car.vin}</span>` : `<span class="badge badge-silver" style="opacity: 0.8;">VIN: Optional / N/A</span>`}
          </div>
          <h2 style="font-size: 1.85rem; margin-bottom: 0.25rem; line-height: 1.2;">${car.year} ${car.make} ${car.model}</h2>
          <div style="font-size: 0.95rem; color: var(--silver-400);">${car.trim}</div>
          <div style="font-size: 2rem; font-weight: 800; color: #fff; margin-top: 0.5rem; font-family: var(--font-heading);">${formatPrice(car.price)}</div>
        </div>

        <p style="font-size: 0.875rem; color: var(--silver-400); margin-bottom: 1.25rem; line-height: 1.6;">${car.overview}</p>

        <h4 style="font-size: 0.9rem; text-transform: uppercase; color: var(--silver-400); margin-bottom: 0.75rem; letter-spacing: 0.05em;">Key Specifications</h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem 1rem; font-size: 0.85rem; margin-bottom: 1.5rem; background: rgba(255,255,255,0.02); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
          <div><strong style="color: var(--silver-300);">Mileage:</strong> ${formatNumber(car.mileage)} km</div>
          <div><strong style="color: var(--silver-300);">Drivetrain:</strong> ${car.drivetrain}</div>
          <div><strong style="color: var(--silver-300);">Engine:</strong> ${car.engine}</div>
          <div><strong style="color: var(--silver-300);">Transmission:</strong> ${car.transmission}</div>
          <div><strong style="color: var(--silver-300);">Exterior:</strong> ${car.exteriorColor}</div>
          <div><strong style="color: var(--silver-300);">Interior:</strong> ${car.interiorColor}</div>
        </div>

        <h4 style="font-size: 0.9rem; text-transform: uppercase; color: var(--silver-400); margin-bottom: 0.75rem; letter-spacing: 0.05em;">Top Features</h4>
        <ul style="list-style: none; display: grid; grid-template-columns: 1fr 1fr; gap: 0.4rem; font-size: 0.8rem; color: var(--silver-300); margin-bottom: 1.5rem;">
          ${carFeatures.map(f => `
            <li style="display: flex; align-items: center; gap: 0.35rem;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
              ${f}
            </li>
          `).join('')}
        </ul>

        <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
          <button class="btn btn-silver" style="flex: 1; min-width: 160px;" onclick="openTestDriveModal('${car.id}')">
            Book a Test Drive
          </button>
          <a href="financing.html?price=${car.price}&vehicle=${encodeURIComponent(car.year + ' ' + car.make + ' ' + car.model)}" class="btn btn-outline" style="flex: 1; min-width: 160px;">
            Calculate Financing
          </a>
        </div>
      </div>
    </div>
  `;

  // Image Switch Function
  function switchModalImage(index) {
    if (index < 0) index = totalImgs - 1;
    if (index >= totalImgs) index = 0;
    currentImgIdx = index;

    const mainImg = document.getElementById('modal-main-img');
    const counterText = document.getElementById('modal-img-counter-text');
    if (mainImg && carImages[currentImgIdx]) {
      mainImg.style.opacity = '0.4';
      setTimeout(() => {
        mainImg.src = carImages[currentImgIdx];
        mainImg.style.opacity = '1';
      }, 100);
    }
    if (counterText) {
      counterText.textContent = `${currentImgIdx + 1} / ${totalImgs}`;
    }

    // Update active thumb state & scroll into view smoothly
    modalContainer.querySelectorAll('.modal-thumb-item').forEach((thumb, idx) => {
      if (idx === currentImgIdx) {
        thumb.classList.add('active');
        thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      } else {
        thumb.classList.remove('active');
      }
    });
  }

  // Next / Prev button listeners
  document.getElementById('modal-prev-img')?.addEventListener('click', (e) => {
    e.stopPropagation();
    switchModalImage(currentImgIdx - 1);
  });

  document.getElementById('modal-next-img')?.addEventListener('click', (e) => {
    e.stopPropagation();
    switchModalImage(currentImgIdx + 1);
  });

  // Thumbnail clicks
  modalContainer.querySelectorAll('.modal-thumb-item').forEach(thumb => {
    thumb.addEventListener('click', () => {
      const idx = parseInt(thumb.dataset.idx);
      switchModalImage(idx);
    });
  });

  // Thumbnail strip scroll buttons
  const thumbsContainer = document.getElementById('modal-thumbs-container');
  document.getElementById('thumb-scroll-left')?.addEventListener('click', () => {
    thumbsContainer?.scrollBy({ left: -160, behavior: 'smooth' });
  });
  document.getElementById('thumb-scroll-right')?.addEventListener('click', () => {
    thumbsContainer?.scrollBy({ left: 160, behavior: 'smooth' });
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
        <h2 style="font-size: 1.75rem; margin-bottom: 0.25rem; color: var(--gray-900);">Schedule a Test Drive</h2>
        <p style="color: var(--text-muted); font-size: 0.9rem;">
          ${car ? `You are scheduling a drive for <strong style="color: var(--gray-900);">${car.year} ${car.make} ${car.model}</strong> (${car.stockNumber})` : 'Select your vehicle and preferred time.'}
        </p>
      </div>

      <form id="test-drive-form" style="display: flex; flex-direction: column; gap: 1rem;">
        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">First Name *</label>
            <input type="text" id="td-first-name" class="form-control" required placeholder="John">
          </div>
          <div class="form-group">
            <label class="form-label">Last Name *</label>
            <input type="text" id="td-last-name" class="form-control" required placeholder="Doe">
          </div>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Email Address *</label>
            <input type="email" id="td-email" class="form-control" required placeholder="john@example.com">
          </div>
          <div class="form-group">
            <label class="form-label">Phone Number *</label>
            <input type="tel" id="td-phone" class="form-control" required placeholder="(604) 270-7662">
          </div>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Preferred Date *</label>
            <input type="date" id="td-date" class="form-control" required value="${new Date().toISOString().split('T')[0]}">
          </div>
          <div class="form-group">
            <label class="form-label">Preferred Time *</label>
            <select id="td-time" class="form-control" required>
              <option>10:00 AM - Morning</option>
              <option>12:00 PM - Noon</option>
              <option>02:00 PM - Afternoon</option>
              <option>04:30 PM - Evening</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Do you have a vehicle to trade in?</label>
          <select id="td-trade" class="form-control">
            <option>No, I am only test driving</option>
            <option>Yes, I want a trade-in appraisal</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Additional Questions or Requests</label>
          <textarea id="td-notes" class="form-control" rows="2" placeholder="Any specific feature or questions about this vehicle?"></textarea>
        </div>

        <button type="submit" id="td-submit-btn" class="btn btn-blue btn-lg" style="margin-top: 0.5rem; width: 100%;">
          Confirm Test Drive Reservation
        </button>
      </form>
    </div>
  `;

  modalBackdrop.classList.add('active');
  document.getElementById('modal-close').onclick = () => modalBackdrop.classList.remove('active');

  document.getElementById('test-drive-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('td-submit-btn');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Submitting & Forwarding...';
    }

    const payload = {
      LeadType: 'Test Drive Reservation',
      Vehicle: car ? `${car.year} ${car.make} ${car.model} (${car.stockNumber})` : 'General Inquiry',
      CustomerName: `${document.getElementById('td-first-name')?.value || ''} ${document.getElementById('td-last-name')?.value || ''}`.trim(),
      Email: document.getElementById('td-email')?.value || '',
      Phone: document.getElementById('td-phone')?.value || '',
      PreferredDate: document.getElementById('td-date')?.value || '',
      PreferredTime: document.getElementById('td-time')?.value || '',
      HasTradeIn: document.getElementById('td-trade')?.value || 'No',
      Notes: document.getElementById('td-notes')?.value || '',
      Location: 'Motor Trends Auto Group - 10740 Cambie Road, Richmond, BC (Dealer #30859)'
    };

    if (window.sendEmailSubmission) {
      await window.sendEmailSubmission(payload, `Test Drive: ${payload.Vehicle} - ${payload.CustomerName}`);
    }

    modalBackdrop.classList.remove('active');
    showToast('🎉 Your Test Drive appointment request has been submitted! Our specialist will reach out shortly.', 'success');
  });
}

/* ----------------------------------------------------
   Unified Global Email Submission Function
   Direct delivery to rightclicksapp@gmail.com
----------------------------------------------------- */
async function sendEmailSubmission(formData, formSubject) {
  const TARGET_EMAIL = 'rightclicksapp@gmail.com';
  const endpoint = `https://formsubmit.co/ajax/${TARGET_EMAIL}`;

  // Local storage backup for dealer records
  try {
    const leads = JSON.parse(localStorage.getItem('motortrends_leads') || '[]');
    leads.unshift({
      id: 'lead_' + Date.now(),
      subject: formSubject || 'Motor Trends Inquiry',
      data: formData,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem('motortrends_leads', JSON.stringify(leads.slice(0, 50)));
  } catch(e) {}

  try {
    const payload = {
      _subject: `Motor Trends Lead: ${formSubject || 'Website Submission'}`,
      _template: 'table',
      _captcha: 'false',
      ...formData
    };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    return res.ok;
  } catch(err) {
    console.warn('Email submission background notice:', err);
    return false;
  }
}
window.sendEmailSubmission = sendEmailSubmission;

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

/* ================================================================
   Dynamic Card & Text Pulse Effects
   Triggers random glow on vehicle cards and section titles
   at irregular intervals: 10, 13, 16, 8, 29, 11 seconds etc.
================================================================ */
function initDynamicPulseEffects() {
  var intervals = [8000, 10000, 11000, 13000, 16000, 29000];
  var altIntervals = [12000, 15000, 9000, 22000, 18000, 7000];

  function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function pulseRandomCard(useRed) {
    var cards = document.querySelectorAll('.vehicle-card');
    if (!cards.length) return;
    var card = cards[Math.floor(Math.random() * cards.length)];
    var cls = useRed ? 'card-pulse-red' : 'card-pulse-blue';
    card.classList.remove('card-pulse-blue', 'card-pulse-red');
    void card.offsetWidth; // force reflow
    card.classList.add(cls);
    card.addEventListener('animationend', function() {
      card.classList.remove(cls);
    }, { once: true });
    // Schedule next
    var delay = pickRandom(useRed ? altIntervals : intervals);
    setTimeout(function() { pulseRandomCard(!useRed); }, delay);
  }

  function pulseBodyTypeCard() {
    var cards = document.querySelectorAll('.body-type-card');
    if (!cards.length) return;
    var card = cards[Math.floor(Math.random() * cards.length)];
    card.classList.remove('card-pulse-blue');
    void card.offsetWidth;
    card.classList.add('card-pulse-blue');
    card.addEventListener('animationend', function() {
      card.classList.remove('card-pulse-blue');
    }, { once: true });
    setTimeout(pulseBodyTypeCard, pickRandom(intervals));
  }

  function shimmerSectionTitles() {
    var titles = document.querySelectorAll('.section-title');
    if (!titles.length) return;
    var title = titles[Math.floor(Math.random() * titles.length)];
    title.classList.remove('shimmer');
    void title.offsetWidth;
    title.classList.add('shimmer');
    title.addEventListener('animationend', function() {
      title.classList.remove('shimmer');
    }, { once: true });
    setTimeout(shimmerSectionTitles, pickRandom(altIntervals));
  }

  // Start staggered so they don't all fire at once
  setTimeout(function() { pulseRandomCard(false); }, 3000);
  setTimeout(function() { pulseBodyTypeCard(); },   6000);
  setTimeout(function() { shimmerSectionTitles(); },9000);
}