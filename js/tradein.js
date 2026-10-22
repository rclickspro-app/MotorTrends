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

    const year = parseInt(document.getElementById('trade-year')?.value) || 2020;
    const make = document.getElementById('trade-make')?.value || 'Toyota';
    const model = document.getElementById('trade-model')?.value || '';
    const mileage = parseInt(document.getElementById('trade-mileage')?.value) || 45000;
    const condition = document.getElementById('trade-condition')?.value || 'good';
    const loan = document.getElementById('trade-loan')?.value || 'Unknown';
    const vin = document.getElementById('trade-vin')?.value || 'Not provided';
    const customerName = document.getElementById('trade-name')?.value || 'Valuation Visitor';
    const phone = document.getElementById('trade-phone')?.value || '';
    const email = document.getElementById('trade-email')?.value || '';

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

    const formattedBase = (typeof formatPrice === 'function') ? formatPrice(base) : `$${base} CAD`;
    const formattedRange = (typeof formatPrice === 'function') 
      ? `${formatPrice(lowEst)} - ${formatPrice(highEst)}` 
      : `$${lowEst} - $${highEst} CAD`;

    if (offerAmount && offerRange && resultCard) {
      offerAmount.textContent = formattedBase;
      offerRange.textContent = formattedRange;
      resultCard.style.display = 'block';
      resultCard.scrollIntoView({ behavior: 'smooth' });
    }

    const payload = {
      LeadType: 'Trade-In Appraisal Review Request',
      CustomerName: customerName,
      Phone: phone,
      Email: email,
      Vehicle: `${year} ${make} ${model}`.trim(),
      Mileage: `${mileage} km`,
      Condition: condition,
      ExistingLoan: loan,
      VIN: vin,
      EstimatedMarketValue: formattedBase,
      EstimatedRange: formattedRange,
      DealershipLocation: '10740 Cambie Road, Richmond, BC (Dealer #30859)'
    };

    if (window.sendEmailSubmission) {
      window.sendEmailSubmission(payload, `Appraisal Review: ${payload.Vehicle} - ${payload.CustomerName}`);
    }

    if (typeof showToast === 'function') {
      showToast('🚗 Appraisal review request submitted! Our appraisal team will contact you shortly.', 'success');
    }
  });
}
