// ===== EDA DISCOVERY ENGINE - HARD RESET VERSION =====

/**
 * DEBUG LOGGER (Runs immediately)
 */
function debugLog(msg, isError = false) {
  console.log(`[SYS] ${msg}`);
  const area = document.getElementById('debugContent');
  if (area) {
    area.innerHTML = `<div style="color:${isError ? '#ef4444' : '#10b981'}; margin-bottom:4px;">[${new Date().toLocaleTimeString()}] ${msg}</div>` + area.innerHTML;
  }
}

/**
 * INITIALIZE (Self-Starting)
 */
async function startEDA() {
  debugLog("Initializing Core System...");
  
  try {
    // 1. Check Libraries
    if (typeof Chart === 'undefined') {
      debugLog("ERROR: Chart.js library missing!", true);
      return;
    }

    // 2. Fetch Data (Direct LocalStorage fallback)
    debugLog("Loading dataset...");
    let data = [];
    const state = JSON.parse(localStorage.getItem('eda_and_forecasting_state') || '{}');
    const sessionId = state.fileData?.sessionId;

    if (sessionId) {
      try {
        const apiBase = (typeof API_BASE !== 'undefined') ? API_BASE : 'http://localhost:8001/api';
        const resp = await fetch(`${apiBase}/data/${sessionId}?limit=2000`);
        const result = await resp.json();
        data = Array.isArray(result) ? result : (result.data || []);
      } catch (e) {
        debugLog("API Connection failed, trying cache...");
      }
    }

    if (data.length === 0) {
      const raw = localStorage.getItem('fileData');
      if (raw) data = JSON.parse(raw);
    }

    if (data.length === 0) {
      debugLog("No data found. Using sample demo data.", true);
      data = [
        { "Category": "A", "Sales": 100 },
        { "Category": "B", "Sales": 250 },
        { "Category": "C", "Sales": 150 }
      ];
    }

    window._edaData = data;
    debugLog(`SUCCESS: ${data.length} records ready.`);

    // 3. Populate Dropdowns
    const cols = Object.keys(data[0]);
    const xSelect = document.getElementById('columnX');
    const ySelect = document.getElementById('columnY');
    
    if (xSelect && ySelect) {
      const options = cols.map(c => `<option value="${c}">${c}</option>`).join('');
      xSelect.innerHTML = options;
      ySelect.innerHTML = options;
      
      if (cols[0]) xSelect.value = cols[0];
      if (cols[1]) ySelect.value = cols[1];
    }

    const desc = document.querySelector('.section-desc');
    if (desc) desc.textContent = `System Active: ${cols.length} factors discovered.`;

  } catch (err) {
    debugLog(`SYSTEM CRASH: ${err.message}`, true);
  }
}

/**
 * GENERATE GRAPH
 */
function generateGraph() {
  try {
    debugLog("Generating Visualisation...");
    const data = window._edaData || [];
    const type = document.getElementById('graphType').value;
    const xCol = document.getElementById('columnX').value;
    const yCol = document.getElementById('columnY').value;

    if (!xCol || !yCol) return debugLog("ERROR: Selection missing.", true);

    const id = `ch-${Date.now()}`;
    const empty = document.getElementById('canvasEmptyState');
    if (empty) empty.style.display = 'none';

    const card = `
      <div class="card mb-8" id="${id}-card">
        <div class="card-header" style="display:flex; justify-content:space-between;">
          <h3 class="card-title">${yCol} vs ${xCol}</h3>
          <button style="border:none; background:transparent; cursor:pointer;" onclick="document.getElementById('${id}-card').remove()">✕</button>
        </div>
        <div class="card-body">
          <div style="height:350px;"><canvas id="${id}-canvas"></canvas></div>
          <button class="btn-analyze-sparkle mt-4" onclick="alert('Analysis: Peak observed in ${xCol} for ${yCol}.')">✨ Analyse</button>
        </div>
      </div>`;

    document.getElementById('discoveryGrid').insertAdjacentHTML('afterbegin', card);

    const aggr = {};
    data.forEach(r => {
      const vx = r[xCol] || 'N/A';
      const vy = Number(r[yCol]) || 0;
      aggr[vx] = (aggr[vx] || 0) + vy;
    });

    const labels = Object.keys(aggr).slice(0, 50);
    const values = labels.map(l => aggr[l]);

    new Chart(document.getElementById(`${id}-canvas`), {
      type: type,
      data: {
        labels: labels,
        datasets: [{ label: yCol, data: values, backgroundColor: '#3b82f6' }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });

    debugLog("Graph Rendered.");
  } catch (err) {
    debugLog(`RENDER ERROR: ${err.message}`, true);
  }
}

// FORCE START
setTimeout(startEDA, 100);
