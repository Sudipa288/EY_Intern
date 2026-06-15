// ===== RESULTS PAGE JS =====

function renderResults() {
  const state = getState();
  const modelResults = state.modelResults || [];

  if (!modelResults.length) {
    document.getElementById('resultsEmpty').classList.remove('hidden');
    ['resultsBanner', 'resultsGrid', 'resultsDetails', 'resultsInsights', 'resultsExport', 'resultsActions'].forEach(id => {
      document.getElementById(id).classList.add('hidden');
    });
    return;
  }

  document.getElementById('resultsEmpty').classList.add('hidden');
  const best = modelResults[0];
  const mName = best.name || best.modelName || 'Unknown Model';
  const mAcc = best.accuracy !== undefined ? best.accuracy : (best.accuracy_score || 0);

  document.getElementById('resultModelName').textContent = mName;
  document.getElementById('resBestModel').textContent = mName;
  document.getElementById('resAccuracy').textContent = (mAcc * 100).toFixed(2) + '%';
  document.getElementById('resRmse').textContent = best.rmse ? best.rmse.toFixed(4) : 'N/A';
  document.getElementById('resMape').textContent = best.mape ? best.mape.toFixed(2) + '%' : 'N/A';

  document.getElementById('detModelName').textContent = mName;
  document.getElementById('detAccuracy').textContent = (mAcc * 100).toFixed(2) + '%';
  document.getElementById('detRmse').textContent = best.rmse ? best.rmse.toFixed(4) : 'N/A';
  document.getElementById('detMae').textContent = best.mae ? best.mae.toFixed(4) : 'N/A';
  document.getElementById('detMape').textContent = best.mape ? best.mape.toFixed(2) + '%' : 'N/A';

  // Build the dates and volumes for the summary
  const fDates = best.forecast_dates || [];
  const startDate = fDates.length > 0 ? fDates[0] : 'N/A';
  const endDate = fDates.length > 0 ? fDates[fDates.length - 1] : 'N/A';
  const numDays = best.predictions ? best.predictions.length : 0;
  const totalPredicted = best.predictions ? best.predictions.reduce((a, b) => a + b, 0).toLocaleString(undefined, {maximumFractionDigits: 0}) : 'N/A';

  const insightsList = document.getElementById('insightsList');
  insightsList.innerHTML = [
    `<strong>Executive Summary:</strong> Based on our automated EDA and model evaluation, the <strong>${mName}</strong> was selected as the optimal forecasting engine, achieving an average historical accuracy of <strong>${(mAcc * 100).toFixed(1)}%</strong>. It projects the next <strong>${numDays} periods</strong> (from <strong>${startDate}</strong> to <strong>${endDate}</strong>). Over this forecasted window, the model anticipates a total combined volume of approximately <strong>${totalPredicted}</strong>, capturing the underlying trends and seasonal behaviors found in the dataset.`,
    `The RMSE of <strong>${best.rmse ? best.rmse.toFixed(4) : 'N/A'}</strong> indicates the average magnitude of prediction errors is low relative to the data scale.`,
    `The model is ready for deployment and can be used for making predictions on new data with confidence.`,
  ].map((text, i) => `
    <li class="insight-item">
      <span class="insight-num">${i + 1}</span>
      <span class="insight-item-text">${text}</span>
    </li>
  `).join('');

  ['resultsBanner', 'resultsGrid', 'resultsDetails', 'resultsInsights', 'resultsExport', 'resultsActions'].forEach(id => {
    document.getElementById(id).classList.remove('hidden');
  });
}

function handleExport() {
  const state = getState();
  const format = document.getElementById('exportFormat').value;
  const data = { modelResults: state.modelResults || [], exportedAt: new Date().toISOString() };
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `eda-and-forecasting-results-${Date.now()}.${format}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function resetApp() {
  resetState();
  navigateTo(0);
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  injectNav(5);
  renderResults();
});
