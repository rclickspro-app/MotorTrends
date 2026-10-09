/**
 * Motor Trends Auto Group Trade-in & Sell Value Estimator
 */

document.addEventListener('DOMContentLoaded', () => {
  initTradeInValuator();
});

function initTradeInValuator() {
  const form = document.getElementById('trade-in-estimator-form');
  const resultCard = document.getElementById('trade-in-result-card');
  const offerAmount = document.getElementById('trade-in-offer-amount');
  const offerRange = document.getElementById('trade-in-offer-range');

  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    if (typeof window.showActionLoader === 'function') {
      window.showActionLoader('Calculating Canadian Market Valuation (CAD)...');
    }

    setTimeout(() => {
      const year = parseInt(document.getElementById('trade-year')?.value) || 2020;
      const make = document.getElementById('trade-make')?.value || 'Toyota';
      const mileage = parseInt(document.getElementById('trade-mileage')?.value) || 45000;
      const condition = document.getElementById('trade-condition')?.value || 'good';

      // Base valuation calculation model
      let base = 26000;
      const currentYear = 2026;
      const age = currentYear - year;
      base -= age * 2200;
      base -= (mileage / 10000) * 800;

      if (condition === 'excellent') base *= 1.12;
      else if (condition === 'good') base *= 1.0;
      else if (condition === 'fair') base *= 0.85;

      base = Math.max(3500, Math.round(base / 100) * 100);
      const lowEst = Math.round(base * 0.94);
      const highEst = Math.round(base * 1.06);

      if (offerAmount && offerRange && resultCard) {
        offerAmount.textContent = formatPrice(base);
        offerRange.textContent = `${formatPrice(lowEst)} - ${formatPrice(highEst)}`;
        resultCard.style.display = 'block';
        resultCard.scrollIntoView({ behavior: 'smooth' });
      }

      if (typeof window.hideActionLoader === 'function') {
        window.hideActionLoader();
      }

      showToast('🚗 Trade-in estimate calculated based on BC market trends in CAD!', 'success');
    }, 400);
  });
}
