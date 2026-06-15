// ===== FORECASTING PAGE JS =====
if (typeof Chart === 'undefined') {
  console.error("Chart.js library is not loaded! Please check your internet connection.");
}

let trainedResults = [];
let _testData = null; // To store uploaded test data rows

// ===== TABS =====

function initTabs() {
  // Tabs removed for a single-page flow
}

// ===== MODEL CARD TOGGLE =====

function toggleModelCard(checkbox) {
  const card = checkbox.closest('.model-checkbox-card');
  card.classList.toggle('checked', checkbox.checked);
}

// ===== VALIDATION STRATEGY =====

function setValidationPath(path) {
  const isYes = path === 'yes';
  
  // Show/Hide Containers
  const uploadContainer = document.getElementById('path-upload-container');
  const splitContainer = document.getElementById('path-split-container');
  
  if (isYes) {
    uploadContainer.classList.remove('hidden');
    splitContainer.classList.add('hidden');
    uploadContainer.style.display = 'block';
    splitContainer.style.display = 'none';
    document.getElementById('strat-yes').style.borderColor = '#3b82f6';
    document.getElementById('strat-yes').style.background = '#eff6ff';
    document.getElementById('strat-no').style.borderColor = '#e2e8f0';
    document.getElementById('strat-no').style.background = '#fff';
  } else {
    uploadContainer.classList.add('hidden');
    splitContainer.classList.remove('hidden');
    uploadContainer.style.display = 'none';
    splitContainer.style.display = 'block';
    document.getElementById('strat-no').style.borderColor = '#3b82f6';
    document.getElementById('strat-no').style.background = '#eff6ff';
    document.getElementById('strat-yes').style.borderColor = '#e2e8f0';
    document.getElementById('strat-yes').style.background = '#fff';
  }
  
  // Sync Radios
  document.getElementById('test-yes').checked = isYes;
  document.getElementById('test-no').checked = !isYes;
}

async function onTestFileChange(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const status = document.getElementById('testFileStatus');
  status.innerHTML = `<span class="spin-small"></span> Processing ${file.name}...`;
  
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const resp = await fetch(`${API_BASE}/upload`, { method: 'POST', body: formData });
    const result = await resp.json();
    
    // Fetch actual data rows for validation
    const dataResp = await fetch(`${API_BASE}/data/${result.sessionId}`);
    const dataResult = await dataResp.json();
    _testData = Array.isArray(dataResult) ? dataResult : dataResult.data;
    
    status.innerHTML = `✅ ${file.name} (${_testData.length} rows) ready.`;
  } catch (e) {
    status.innerHTML = `❌ Error: ${e.message}`;
    _testData = null;
  }
}


// ===== TRAIN SELECTED MODELS =====

// trainSelectedModels moved to inline script in forecasting.html for reliability

// ===== RENDER DYNAMIC COMPARISON =====

function renderDynamicComparison() {
  const state = getState();
  const results = (window.trainedResults && window.trainedResults.length > 0) 
                  ? window.trainedResults 
                  : (trainedResults.length > 0 ? trainedResults : (state.modelResults || []));

  if (results.length === 0) return;

  // Sort by accuracy descending
  const sorted = [...results].sort((a, b) => (b.accuracy || 0) - (a.accuracy || 0));
  const winner = sorted[0];

  // Build table header
  const thead = document.getElementById('dynamicCompHead');
  thead.innerHTML = `<tr><th>Metric</th>${sorted.map(m => `<th class="text-right">${m.name}</th>`).join('')}</tr>`;

  // Build table body
  const metrics = [
    { key: 'accuracy', label: 'Accuracy Score', format: v => (v * 100).toFixed(1) + '%' },
    { key: 'rmse', label: 'RMSE (Root Mean Square Error)', format: v => typeof v === 'number' ? v.toFixed(2) : v },
    { key: 'mse', label: 'MSE (Mean Square Error)', format: v => typeof v === 'number' ? (v || 0).toFixed(2) : v },
    { key: 'mae', label: 'MAE', format: v => typeof v === 'number' ? v.toFixed(2) : v },
  ];

  // Add MSE to results if not present (RMSE^2)
  sorted.forEach(m => {
    if (m.rmse && !m.mse) m.mse = m.rmse ** 2;
  });

  const tbody = document.getElementById('dynamicCompBody');
  tbody.innerHTML = metrics.map(metric => {
    const vals = sorted.map(m => m[metric.key] || 0);
    const bestIdx = metric.key === 'accuracy'
      ? vals.indexOf(Math.max(...vals))
      : vals.indexOf(Math.min(...vals));

    return `<tr>
      <td class="bold">${metric.label}</td>
      ${sorted.map((m, i) => {
        const val = m[metric.key] || 0;
        const isBest = i === bestIdx;
        return `<td class="text-right ${isBest ? 'green-text bold' : ''}">${metric.format(val)}${isBest ? ' ✓' : ''}</td>`;
      }).join('')}
    </tr>`;
  }).join('');

  // Winner card
  document.getElementById('winnerText').innerHTML = `
    <strong>${winner.name}</strong> is the best model with <strong>${(winner.accuracy * 100).toFixed(1)}% accuracy</strong> and RMSE of <strong>${typeof winner.rmse === 'number' ? winner.rmse.toFixed(2) : winner.rmse}</strong>.
  `;

  // Store winner globally and show action button
  window.bestModel = winner;
  const actionDiv = document.getElementById('bestModelForecastAction');
  if (actionDiv) actionDiv.style.display = 'block';

  // Render comparison chart
  renderDynamicComparisonChart(sorted);
}

function renderValidationCharts(results) {
  const grid = document.getElementById('validationChartsGrid');
  grid.innerHTML = '';

  results.forEach((m, idx) => {
    const cardId = `val-chart-${idx}`;
    const mse = m.mse || (m.rmse ? m.rmse ** 2 : 0);
    
    const card = document.createElement('div');
    card.className = 'card validation-card';
    card.innerHTML = `
      <div class="card-header">
        <h4 class="bold">${m.name} Performance</h4>
        <div class="metric-row" style="display: flex; gap: 1rem; margin-top: 0.5rem; font-size: 0.875rem;">
          <span class="green-text bold" style="color: #10b981;">Accuracy: ${((m.accuracy || 0) * 100).toFixed(1)}%</span>
          <span class="blue-text bold">RMSE: ${m.rmse.toFixed(2)}</span>
          <span class="purple-text bold">MSE: ${mse.toFixed(2)}</span>
        </div>
      </div>
      <div style="height: 250px;">
        <canvas id="${cardId}"></canvas>
      </div>
    `;
    grid.appendChild(card);

    // Initialize Chart
    setTimeout(() => {
      let renderActuals = m.test_actuals;
      let renderPreds = m.test_predictions;
      // Prefer real dates from backend; fall back to index labels
      let renderLabels = (m.test_dates && m.test_dates.length === m.test_actuals.length)
        ? m.test_dates
        : m.test_actuals.map((_, i) => `T+${i + 1}`);

      // Downsample to reduce visual noise if dataset is massive
      const maxPoints = 200;
      if (renderActuals.length > maxPoints) {
        const step = Math.ceil(renderActuals.length / maxPoints);
        renderActuals = renderActuals.filter((_, i) => i % step === 0);
        renderPreds = renderPreds.filter((_, i) => i % step === 0);
        renderLabels = renderLabels.filter((_, i) => i % step === 0);
      }

      new Chart(document.getElementById(cardId), {
        type: 'line',
        data: {
          labels: renderLabels,
          datasets: [
            {
              label: 'Actual Sales',
              data: renderActuals,
              borderColor: '#94a3b8', // Subtle Slate
              borderWidth: 1.5,
              pointRadius: 0,
              fill: false,
              tension: 0.3
            },
            {
              label: 'Predicted Sales',
              data: renderPreds,
              borderColor: '#f97316', // Vibrant Orange
              borderWidth: 2.5,
              pointRadius: 0,
              fill: false,
              tension: 0.3
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'top', labels: { boxWidth: 12, font: { size: 10 } } }
          },
          scales: {
            y: { ticks: { font: { size: 10 } }, grid: { color: 'rgba(0,0,0,0.05)' } },
            x: { ticks: { font: { size: 10 } }, grid: { display: false } }
          }
        }
      });
    }, 50);
  });
}

function renderDynamicComparisonChart(results) {
  const ctx = document.getElementById('chartDynamicComparison');
  if (!ctx) return;

  // Destroy existing chart
  if (window._dynCompChart) {
    window._dynCompChart.destroy();
  }

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  window._dynCompChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: results.map(m => m.name),
      datasets: [
        {
          label: 'Accuracy (%)',
          data: results.map(m => ((m.accuracy || 0) * 100).toFixed(1)),
          backgroundColor: results.map((_, i) => colors[i % colors.length]),
          borderRadius: 6,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          title: { display: true, text: 'Accuracy (%)' }
        },
        x: { grid: { display: false } }
      }
    }
  });
}

async function ensureData() {
  const state = getState();
  const sessionId = state.fileData?.sessionId;
  if (!sessionId) return [];

  try {
    const resp = await fetch(`${API_BASE}/data/${sessionId}`);
    const result = await resp.json();
    return Array.isArray(result) ? result : (result.data || []);
  } catch (e) {
    console.error("Data fetch error:", e);
    return [];
  }
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  injectNav(4);
  initTabs();
});

// ===== REVEAL BEST FORECAST =====
window.revealBestForecast = function() {
  const winner = window.bestModel;
  if (!winner) return;
  console.log('[revealBestForecast] winner keys:', Object.keys(winner));
  console.log('[revealBestForecast] forecast_dates:', winner.forecast_dates);
  console.log('[revealBestForecast] test_dates:', winner.test_dates);

  const card = document.getElementById('bestForecastCard');
  if (!card) return;
  card.style.display = 'block';
  document.getElementById('bestModelNameTitle').innerText = winner.name;

  const ctx = document.getElementById('chartBestForecast');
  if (window._bestForecastChart) {
    window._bestForecastChart.destroy();
  }

  // Combine actuals and predictions to create a seamless line
  // We will display the last 30 actuals, then the future predictions
  const displayActuals = winner.test_actuals.slice(-30); 
  const displayPreds = winner.predictions || [];

  // Build real calendar date labels for historical window
  // Use the last 30 entries from test_dates if available, otherwise step back from forecast_dates
  const forecastDates = winner.forecast_dates || [];
  let historicalLabels;
  if (winner.test_dates && winner.test_dates.length > 0) {
    historicalLabels = winner.test_dates.slice(-30);
  } else if (forecastDates.length > 0) {
    // Reconstruct by going backwards from the first forecast date
    const firstForecast = new Date(forecastDates[0]);
    historicalLabels = displayActuals.map((_, i) => {
      const d = new Date(firstForecast);
      d.setDate(d.getDate() - (displayActuals.length - i));
      return d.toISOString().slice(0, 10);
    });
  } else {
    historicalLabels = displayActuals.map((_, i) => `T-${displayActuals.length - i}`);
  }
  const futureLabels = forecastDates.length > 0 ? forecastDates : displayPreds.map((_, i) => `F+${i + 1}`);
  const allLabels = [...historicalLabels, ...futureLabels];

  const actualData = [...displayActuals, ...Array(displayPreds.length).fill(null)];
  const futureData = [...Array(displayActuals.length).fill(null)];
  
  // Connect the lines seamlessly
  futureData[displayActuals.length - 1] = displayActuals[displayActuals.length - 1];
  futureData.push(...displayPreds);

  window._bestForecastChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: allLabels,
      datasets: [
        {
          label: 'Historical Data (Actuals)',
          data: actualData,
          borderColor: '#94a3b8',
          borderWidth: 2,
          pointRadius: 0,
          fill: true,
          backgroundColor: 'rgba(148, 163, 184, 0.1)',
          tension: 0.3
        },
        {
          label: 'Future Forecast (Next 30 Steps)',
          data: futureData,
          borderColor: '#10b981', // Emerald green
          borderWidth: 3,
          pointRadius: 0,
          fill: true,
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.3
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' }
      },
      scales: {
        y: { grid: { color: 'rgba(0,0,0,0.05)' } },
        x: { grid: { display: false } }
      }
    }
  });

  // Generate Executive Summary
  const summaryCard = document.getElementById('forecastSummaryCard');
  const summaryText = document.getElementById('forecastSummaryText');
  if (summaryCard && summaryText) {
    summaryCard.style.display = 'block';
    
    // Model and Metrics
    const modelName = winner.name;
    const accuracy = winner.accuracy !== undefined ? `${(winner.accuracy * 100).toFixed(1)}%` : 'N/A';
    
    // Dates
    const fDates = winner.forecast_dates || [];
    const startDate = fDates.length > 0 ? fDates[0] : 'N/A';
    const endDate = fDates.length > 0 ? fDates[fDates.length - 1] : 'N/A';
    const numDays = displayPreds.length;
    
    // Total Volume predicted
    const totalPredicted = displayPreds.reduce((a, b) => a + b, 0).toLocaleString(undefined, {maximumFractionDigits: 0});
    
    summaryText.innerHTML = `Based on our automated EDA and model evaluation, the <strong>${modelName}</strong> was selected as the optimal forecasting engine, achieving an average historical accuracy of <strong>${accuracy}</strong>. It projects the next <strong>${numDays} periods</strong> (from <strong>${startDate}</strong> to <strong>${endDate}</strong>). Over this forecasted window, the model anticipates a total combined volume of approximately <strong>${totalPredicted}</strong>, capturing the underlying trends and data behaviors.`;
  }

  // Scroll to the new chart smoothly
  card.scrollIntoView({ behavior: 'smooth' });
};
