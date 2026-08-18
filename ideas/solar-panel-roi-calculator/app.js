/* Solar Panel ROI Calculator
 * Pure math functions (no DOM) so the estimate logic can be sanity-checked
 * with plain `node`. All numbers are ballpark planning estimates — see the
 * comment block at the top of data.js for sourcing/caveats.
 */

function systemSizeFromRoofArea(roofM2, areaPerKw) {
  var kw = roofM2 / areaPerKw;
  return Math.round(kw * 10) / 10;
}

function estimateSystemCost(systemSizeKw, costPerKwEUR) {
  return systemSizeKw * costPerKwEUR;
}

function estimateAnnualProductionKwh(systemSizeKw, annualYieldKwhPerKw) {
  return systemSizeKw * annualYieldKwhPerKw;
}

function estimateAnnualConsumptionKwh(monthlyBillEUR, pricePerKwhEUR) {
  if (pricePerKwhEUR <= 0) return 0;
  return (monthlyBillEUR / pricePerKwhEUR) * 12;
}

// Serbia's residential "prosumer" scheme nets surplus solar production
// against consumption within a billing/annual cycle rather than paying out
// full retail value for everything exported, so we conservatively cap the
// financially useful production at the household's own estimated annual
// consumption (self-consumption + same-year netting), not raw production.
function estimateAnnualSavingsEUR(annualProductionKwh, annualConsumptionKwh, pricePerKwhEUR) {
  var usefulKwh = Math.min(annualProductionKwh, annualConsumptionKwh);
  return usefulKwh * pricePerKwhEUR;
}

function estimatePaybackYears(systemCostEUR, annualSavingsEUR) {
  if (annualSavingsEUR <= 0) return Infinity;
  return systemCostEUR / annualSavingsEUR;
}

function calculateSolarROI(input, constants) {
  var city = constants.cities.find(function (c) { return c.key === input.cityKey; }) || constants.cities[0];

  var systemSizeKw = input.mode === 'roof'
    ? systemSizeFromRoofArea(input.roofM2, constants.usableRoofAreaPerKwM2)
    : Math.round(input.systemSizeKw * 10) / 10;

  var systemCostEUR = estimateSystemCost(systemSizeKw, constants.costPerKwEUR);
  var annualProductionKwh = estimateAnnualProductionKwh(systemSizeKw, city.annualYieldKwhPerKw);
  var annualConsumptionKwh = estimateAnnualConsumptionKwh(input.monthlyBillEUR, constants.avgResidentialPriceEURPerKWh);
  var annualSavingsEUR = estimateAnnualSavingsEUR(annualProductionKwh, annualConsumptionKwh, constants.avgResidentialPriceEURPerKWh);
  var paybackYears = estimatePaybackYears(systemCostEUR, annualSavingsEUR);

  return {
    city: city,
    systemSizeKw: systemSizeKw,
    systemCostEUR: Math.round(systemCostEUR),
    annualProductionKwh: Math.round(annualProductionKwh),
    annualConsumptionKwh: Math.round(annualConsumptionKwh),
    annualSavingsEUR: Math.round(annualSavingsEUR),
    paybackYears: paybackYears,
    oversized: annualProductionKwh > annualConsumptionKwh * 1.15
  };
}

/* ---- DOM wiring ---- */
if (typeof document !== 'undefined') {
  (function () {
    var sizeMode = document.getElementById('sizeMode');
    var kwField = document.getElementById('kwField');
    var roofField = document.getElementById('roofField');
    var systemSizeKwInput = document.getElementById('systemSizeKw');
    var roofAreaInput = document.getElementById('roofArea');
    var monthlyBillInput = document.getElementById('monthlyBill');
    var citySelect = document.getElementById('citySelect');
    var calculateBtn = document.getElementById('calculateBtn');
    var resultsCard = document.getElementById('resultsCard');

    SOLAR_CONSTANTS.cities.forEach(function (c) {
      var opt = document.createElement('option');
      opt.value = c.key;
      opt.textContent = c.name + ' (' + c.region + ')';
      citySelect.appendChild(opt);
    });
    citySelect.value = 'beograd';

    function updateFieldVisibility() {
      var isRoof = sizeMode.value === 'roof';
      roofField.style.display = isRoof ? '' : 'none';
      kwField.style.display = isRoof ? 'none' : '';
    }

    function formatNumber(n) {
      return n.toLocaleString('en-US');
    }

    function render() {
      var input = {
        mode: sizeMode.value,
        systemSizeKw: Math.max(0.5, parseFloat(systemSizeKwInput.value) || 0.5),
        roofM2: Math.max(1, parseFloat(roofAreaInput.value) || 1),
        monthlyBillEUR: Math.max(0, parseFloat(monthlyBillInput.value) || 0),
        cityKey: citySelect.value
      };

      var result = calculateSolarROI(input, SOLAR_CONSTANTS);

      resultsCard.style.display = '';
      var paybackText = isFinite(result.paybackYears)
        ? result.paybackYears.toFixed(1) + ' years'
        : 'not reachable at this bill amount';

      var oversizedNote = result.oversized
        ? '<p class="muted" style="font-size:0.85rem;">Note: estimated production is noticeably higher than your estimated annual consumption — a smaller system may pay back faster since Serbia\'s prosumer scheme nets surplus rather than paying full retail for it.</p>'
        : '';

      resultsCard.innerHTML =
        '<h2>Estimate for ' + result.city.name + '</h2>' +
        '<div class="row"><span class="muted">System size</span><strong>' + result.systemSizeKw + ' kW</strong></div>' +
        '<div class="row"><span class="muted">Estimated install cost</span><strong>€' + formatNumber(result.systemCostEUR) + '</strong></div>' +
        '<div class="row"><span class="muted">Estimated annual production</span><strong>' + formatNumber(result.annualProductionKwh) + ' kWh</strong></div>' +
        '<div class="row"><span class="muted">Estimated annual consumption</span><strong>' + formatNumber(result.annualConsumptionKwh) + ' kWh</strong></div>' +
        '<div class="row"><span class="muted">Estimated annual savings</span><strong>€' + formatNumber(result.annualSavingsEUR) + '</strong></div>' +
        '<div class="row"><span class="muted">Estimated payback period</span><strong>' + paybackText + '</strong></div>' +
        oversizedNote;
    }

    sizeMode.addEventListener('change', function () { updateFieldVisibility(); render(); });
    [systemSizeKwInput, roofAreaInput, monthlyBillInput, citySelect].forEach(function (el) {
      el.addEventListener('input', render);
      el.addEventListener('change', render);
    });
    calculateBtn.addEventListener('click', render);

    updateFieldVisibility();
    render();
  })();
}
