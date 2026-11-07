/**
 * Motor Trends Auto Group Trade-In & Appraisal Request Controller
 * Dealership Direct Submission (No Algorithmic Calculation)
 * Submits directly to Dealership Admin Email (sales@motortrends.ca / admin setting)
 */

document.addEventListener('DOMContentLoaded', () => {
  initTradeInAppraisal();
});

function initTradeInAppraisal() {
  const form = document.getElementById('trade-in-estimator-form');
  const resultCard = document.getElementById('trade-in-result-card');
  const submitBtn = document.getElementById('trade-submit-btn');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const originalBtnText = submitBtn ? submitBtn.innerHTML : 'Submit';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '⏳ Transmitting Appraisal to Dealership...';
    }

    if (typeof window.showActionLoader === 'function') {
      window.showActionLoader('Submitting Appraisal to Motor Trends Dealership...');
    }

    const year = document.getElementById('trade-year')?.value || '2021';
    const make = document.getElementById('trade-make')?.value || 'Toyota';
    const model = (document.getElementById('trade-model')?.value || 'Unspecified Model').trim();
    const mileage = document.getElementById('trade-mileage')?.value || '45000';
    const condition = document.getElementById('trade-condition')?.value || 'Good';
    const loan = document.getElementById('trade-loan')?.value || 'Clean Title';
    const vin = (document.getElementById('trade-vin')?.value || 'Not provided').trim();
    const notes = (document.getElementById('trade-notes')?.value || 'None').trim();
    const customerName = (document.getElementById('trade-name')?.value || 'Appraisal Client').trim();
    const phone = (document.getElementById('trade-phone')?.value || '').trim();
    const email = (document.getElementById('trade-email')?.value || '').trim();
    const prefContact = document.getElementById('trade-pref-contact')?.value || 'Phone Call';

    const vehicleTitle = `${year} ${make} ${model}`.trim();
    const submissionId = 'MT-APP-' + Math.floor(100000 + Math.random() * 900000);

    // Build comprehensive dealership appraisal payload
    const payload = {
      SubmissionId: submissionId,
      FormType: 'Official Vehicle Trade-In & Cash Appraisal Request',
      Dealership: 'Motor Trends Auto Group (DL#30859)',
      DealershipAddress: '10740 Cambie Road, Richmond, BC V6X 1K8',
      Vehicle: vehicleTitle,
      Year: year,
      Make: make,
      ModelAndTrim: model,
      Mileage: `${Number(mileage).toLocaleString()} km`,
      Condition: condition,
      ExistingLoanLease: loan,
      VIN: vin,
      VehicleNotes: notes,
      CustomerName: customerName,
      Phone: phone,
      Email: email,
      PreferredContactMethod: prefContact,
      SubmittedAt: new Date().toLocaleString('en-CA', { timeZone: 'America/Vancouver' })
    };

    // Send directly to Dealership Admin Email
    let emailSent = false;
    if (typeof window.sendEmailSubmission === 'function') {
      try {
        emailSent = await window.sendEmailSubmission(
          payload,
          `Appraisal Request [${submissionId}]: ${vehicleTitle} - ${customerName}`
        );
      } catch (err) {
        console.warn('Appraisal email submission err:', err);
      }
    }

    // Hide loader
    if (typeof window.hideActionLoader === 'function') {
      window.hideActionLoader();
    }

    // Populate confirmation display details
    const confirmVehicle = document.getElementById('confirm-vehicle-text');
    if (confirmVehicle) confirmVehicle.textContent = vehicleTitle;

    const confirmMileage = document.getElementById('confirm-mileage-text');
    if (confirmMileage) confirmMileage.textContent = `${Number(mileage).toLocaleString()} km`;

    const confirmCondition = document.getElementById('confirm-condition-text');
    if (confirmCondition) confirmCondition.textContent = condition;

    const confirmTitle = document.getElementById('appraisal-confirm-title');
    if (confirmTitle) {
      confirmTitle.textContent = `Thank You, ${customerName}! Your Appraisal Request Has Been Received.`;
    }

    // Hide form elements, show official confirmation card
    const formHeader = document.getElementById('appraisal-form-header');
    const homeFormWrap = document.getElementById('home-appraisal-form-wrap');

    if (homeFormWrap) {
      form.style.display = 'none';
      if (formHeader) formHeader.style.display = 'none';
    } else {
      form.style.display = 'none';
    }

    if (resultCard) {
      resultCard.style.display = 'block';
      resultCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    if (typeof showToast === 'function') {
      showToast(`🚗 Appraisal request for ${vehicleTitle} submitted directly to Motor Trends!`, 'success');
    }
  });
}
