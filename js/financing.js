/**
 * Motor Trends Auto Group Financing & Loan Calculator
 */

document.addEventListener('DOMContentLoaded', () => {
  initFinancingCalculator();
});

function initFinancingCalculator() {
  const priceInput = document.getElementById('calc-vehicle-price');
  const downPaymentInput = document.getElementById('calc-down-payment');
  const termSelect = document.getElementById('calc-term');
  const interestInput = document.getElementById('calc-interest');
  const tradeInInput = document.getElementById('calc-trade-value');

  // Outputs
  const monthlyDisplay = document.getElementById('calc-monthly-payment');
  const totalLoanDisplay = document.getElementById('calc-total-loan');
  const totalInterestDisplay = document.getElementById('calc-total-interest');
  const totalCostDisplay = document.getElementById('calc-total-cost');

  // Check URL parameters for preset car price
  const params = new URLSearchParams(window.location.search);
  if (params.has('price') && priceInput) {
    priceInput.value = params.get('price');
  }

  function calculatePayment() {
    if (!priceInput || !monthlyDisplay) return;

    const price = parseFloat(priceInput.value) || 0;
    const downPayment = parseFloat(downPaymentInput?.value) || 0;
    const tradeValue = parseFloat(tradeInInput?.value) || 0;
    const termMonths = parseInt(termSelect?.value) || 60;
    const interestRate = (parseFloat(interestInput?.value) || 5.9) / 100 / 12;

    const principal = Math.max(0, price - downPayment - tradeValue);

    if (principal === 0) {
      monthlyDisplay.textContent = '$0 CAD';
      if (totalLoanDisplay) totalLoanDisplay.textContent = '$0 CAD';
      if (totalInterestDisplay) totalInterestDisplay.textContent = '$0 CAD';
      if (totalCostDisplay) totalCostDisplay.textContent = '$0 CAD';
      return;
    }

    let monthlyPayment = 0;
    if (interestRate === 0) {
      monthlyPayment = principal / termMonths;
    } else {
      monthlyPayment = (principal * interestRate * Math.pow(1 + interestRate, termMonths)) / (Math.pow(1 + interestRate, termMonths) - 1);
    }

    const totalPayment = monthlyPayment * termMonths;
    const totalInterest = totalPayment - principal;

    monthlyDisplay.textContent = formatPrice(monthlyPayment.toFixed(2));
    if (totalLoanDisplay) totalLoanDisplay.textContent = formatPrice(principal.toFixed(2));
    if (totalInterestDisplay) totalInterestDisplay.textContent = formatPrice(totalInterest.toFixed(2));
    if (totalCostDisplay) totalCostDisplay.textContent = formatPrice((totalPayment + downPayment + tradeValue).toFixed(2));
  }

  // Bind input listeners
  const inputs = [priceInput, downPaymentInput, termSelect, interestInput, tradeInInput];
  inputs.forEach(input => {
    if (input) {
      input.addEventListener('input', calculatePayment);
      input.addEventListener('change', calculatePayment);
    }
  });

  calculatePayment();

  // Credit tier buttons
  const creditButtons = document.querySelectorAll('.credit-tier-btn');
  creditButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      creditButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const rate = btn.dataset.rate;
      if (interestInput) {
        interestInput.value = rate;
        calculatePayment();
      }
    });
  });

  // Finance Pre-approval form handler
  const financeForm = document.getElementById('finance-preapproval-form');
  if (financeForm) {
    financeForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (typeof window.showActionLoader === 'function') {
        window.showActionLoader('Processing Canadian Pre-Approval Application...');
      }
      setTimeout(() => {
        if (typeof window.hideActionLoader === 'function') {
          window.hideActionLoader();
        }
        showToast('🎉 Pre-Approval Application Submitted! A finance specialist will contact you with CAD loan terms.', 'success');
        financeForm.reset();
      }, 500);
    });
  }
}
