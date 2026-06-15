// ===== SHARED STATE (localStorage only — NO raw data stored in browser) =====
// Raw data lives in the backend's in-memory store, accessed via sessionId.

const STEPS = [
  { id: 0, name: 'Upload', label: 'Upload Data', file: 'index.html' },
  { id: 1, name: 'Explore', label: 'Data Explorer', file: 'explorer.html' },
  { id: 2, name: 'Process', label: 'Preprocessing', file: 'preprocessing.html' },
  { id: 3, name: 'Analyze', label: 'EDA', file: 'eda.html' },
  { id: 4, name: 'Forecast', label: 'Forecasting', file: 'forecasting.html' },
  { id: 5, name: 'Results', label: 'Results', file: 'results.html' },
];

const DATA_TYPES = ['integer', 'float', 'string', 'boolean', 'datetime', 'categorical'];
const API_BASE = `http://${window.location.hostname || 'localhost'}:8005/api`;

// Per-page in-memory data cache (cleared on page navigation)
let _pageDataCache = null;

function getState() {
  try {
    const raw = localStorage.getItem('eda_and_forecasting_state');
    return raw ? JSON.parse(raw) : defaultState();
  } catch { return defaultState(); }
}

function setState(updates) {
  const current = getState();
  const merged = { ...current, ...updates };
  try {
    localStorage.setItem('eda_and_forecasting_state', JSON.stringify(merged));
  } catch (e) {
    console.warn('localStorage quota exceeded:', e);
  }
  return merged;
}

function defaultState() {
  return {
    currentStep: 0,
    fileData: null,       // Only metadata: { columns, fileName, fileSize, sessionId, rowCount }
    selectedColumns: [],
    columnUpdates: {},
    preprocessingConfig: { handleMissing: 'drop', scaling: false },
    modelResults: [],
    selectedModel: 'prophet',
  };
}

function resetState() {
  localStorage.removeItem('eda_and_forecasting_state');
  _pageDataCache = null;
}

// ===== FETCH DATA FROM BACKEND =====
// Returns the full data array for the current session.
// Caches result in memory so we only fetch once per page load.
async function ensureData() {
  if (_pageDataCache) return _pageDataCache;

  const state = getState();
  if (!state.fileData || !state.fileData.sessionId) {
    showSessionExpiredBanner();
    return [];
  }

  const MAX_RETRIES = 3;
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const resp = await fetch(`${API_BASE}/data/${state.fileData.sessionId}`);

      if (resp.status === 404) {
        showSessionExpiredBanner();
        return [];
      }

      if (!resp.ok) throw new Error(`Server error ${resp.status}`);

      const result = await resp.json();
      _pageDataCache = Array.isArray(result) ? result : (result.data || []);
      return _pageDataCache;

    } catch (e) {
      console.warn(`Data fetch attempt ${attempt} failed:`, e.message);
      lastError = e;
      if (attempt < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, 500 * attempt)); // Exponential backoff
      }
    }
  }

  // If we reach here, all retries failed
  console.error('Data fetch failed after all retries:', lastError.message);
  if (lastError.message.includes('Failed to fetch') || lastError.name === 'AbortError') {
    showBackendDownBanner();
  } else {
    showSessionExpiredBanner();
  }
  return [];
}

function showSessionExpiredBanner() {
  if (document.getElementById('_sessionBanner')) return;
  const banner = document.createElement('div');
  banner.id = '_sessionBanner';
  banner.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; z-index: 9999;
    background: #f59e0b; color: #1c1917; padding: 14px 24px;
    display: flex; align-items: center; justify-content: space-between;
    font-family: inherit; font-size: 14px; font-weight: 600;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  `;
  banner.innerHTML = `
    <span>⚠️ Session expired — the backend was restarted and your data was cleared from memory. Please re-upload your file to continue.</span>
    <button onclick="window.location.href='index.html'" style="
      background: #1c1917; color: white; border: none; border-radius: 8px;
      padding: 8px 18px; cursor: pointer; font-size: 13px; font-weight: 700; margin-left: 20px;
    ">Re-upload →</button>
  `;
  document.body.prepend(banner);
}

function showBackendDownBanner() {
  if (document.getElementById('_backendBanner')) return;
  const banner = document.createElement('div');
  banner.id = '_backendBanner';
  banner.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; z-index: 9999;
    background: #ef4444; color: white; padding: 14px 24px;
    display: flex; align-items: center; justify-content: space-between;
    font-family: inherit; font-size: 14px; font-weight: 600;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  `;
  banner.innerHTML = `
    <span>🔴 Cannot reach the backend server at <strong>localhost:8005</strong>. Please run <strong>run_app.bat</strong> to restart it.</span>
    <button onclick="location.reload()" style="
      background: white; color: #ef4444; border: none; border-radius: 8px;
      padding: 8px 18px; cursor: pointer; font-size: 13px; font-weight: 700; margin-left: 20px;
    ">Retry ↺</button>
  `;
  document.body.prepend(banner);
}

// ===== NAVIGATION =====

function navigateTo(stepId) {
  _pageDataCache = null; // Clear per-page cache on navigation
  setState({ currentStep: stepId });
  window.location.href = STEPS[stepId].file;
}

function renderNavbar(currentStepId) {
  // Step circles
  const navSteps = document.getElementById('navSteps');
  if (navSteps) {
    navSteps.innerHTML = '';
    STEPS.forEach((step, i) => {
      const circle = document.createElement('button');
      circle.className = `nav-step-circle ${currentStepId >= step.id ? 'active' : 'inactive'}`;
      circle.textContent = step.id + 1;
      circle.onclick = () => navigateTo(step.id);
      navSteps.appendChild(circle);
      if (i < STEPS.length - 1) {
        const line = document.createElement('div');
        line.className = `nav-step-line ${currentStepId > step.id ? 'active' : 'inactive'}`;
        navSteps.appendChild(line);
      }
    });
  }

  // Step label
  const label = document.getElementById('navStepLabel');
  const count = document.getElementById('navStepCount');
  if (label) label.textContent = STEPS[currentStepId].label;
  if (count) count.textContent = `Step ${currentStepId + 1} of 6`;

  // Progress bar
  const fill = document.getElementById('progressBarFill');
  if (fill) fill.style.width = `${(currentStepId / 5) * 100}%`;
}

// ===== SHARED NAV HTML (injected into each page) =====

function getNavHTML() {
  return `
  <nav class="navbar" id="navbar">
    <div class="nav-container">
      <div class="nav-left">
        <div class="nav-logo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
        </div>
        <div>
          <h1 class="nav-title">EDA and Forecasting</h1>
          <p class="nav-subtitle">Data Analysis &amp; Forecasting</p>
        </div>
      </div>
      <div class="nav-steps" id="navSteps"></div>
      <div class="nav-right">
        <p class="nav-step-label" id="navStepLabel"></p>
        <p class="nav-step-count" id="navStepCount"></p>
      </div>
    </div>
  </nav>
  <div class="progress-bar-track">
    <div class="progress-bar-fill" id="progressBarFill" style="width: 0%"></div>
  </div>`;
}

function injectNav(currentStepId) {
  const navPlaceholder = document.getElementById('nav-placeholder');
  if (navPlaceholder) {
    navPlaceholder.innerHTML = getNavHTML();
  }
  renderNavbar(currentStepId);
}

// ===== FAST ROW COUNT REFRESH =====
// Hits the lightweight /api/meta endpoint to get the authoritative row count
// and patches it into the state — called on every page that shows row counts.
async function refreshRowCount() {
  const state = getState();
  if (!state.fileData || !state.fileData.sessionId) return;
  try {
    const resp = await fetch(`${API_BASE}/meta/${state.fileData.sessionId}`);
    if (!resp.ok) return;
    const meta = await resp.json();
    if (meta.rowCount !== undefined && meta.rowCount > 0) {
      // Compute completely null column count from column metadata
      const totalRows = meta.rowCount;
      const completelyNullColCount = meta.completelyNullColCount ?? (meta.columns || []).filter(col =>
        (col.nullCount ?? 0) >= totalRows && totalRows > 0
      ).length;
      // Patch into localStorage state
      setState({
        fileData: {
          ...getState().fileData,
          rowCount: meta.rowCount,
          columns: meta.columns || [],
          completelyNullRowCount: meta.completelyNullRowCount ?? 0,
          completelyNullColCount: completelyNullColCount,
          firstRow: meta.firstRow || {}
        }
      });
      // Update DOM elements
      const statRows = document.getElementById('statRows');
      if (statRows) statRows.textContent = meta.rowCount.toLocaleString();
      const nullTotalRows = document.getElementById('nullTotalRows');
      if (nullTotalRows) nullTotalRows.textContent = meta.rowCount.toLocaleString();
      const nullColCount = document.getElementById('nullColCount');
      if (nullColCount) nullColCount.textContent = completelyNullColCount.toLocaleString();
    }
  } catch (e) {
    console.warn('refreshRowCount failed:', e.message);
  }
}

// ===== METADATA COMPATIBILITY FALLBACK =====
// Ensures any legacy session state is dynamically backfilled with optimized metadata on the fly
async function ensureMetadata() {
  const state = getState();
  if (!state.fileData) return null;
  
  const fd = state.fileData;
  // If rowCount and column stats are already present and non-zero, return immediately
  if (fd.rowCount && fd.columns.length > 0 && fd.columns[0].nullCount !== undefined && fd.columns[0].nullCount !== null) {
    return fd;
  }
  
  // Lazily reconstruct metadata for legacy sessions
  const data = await ensureData();
  if (!data || data.length === 0) return fd;
  
  const totalRows = data.length;
  const isNullLike = (v) => {
    if (v === null || v === undefined || v === '') return true;
    if (v === 0 || v === '0' || v === 0.0) return true;
    if (typeof v === 'string') {
      const s = v.toLowerCase().trim();
      return s === 'null' || s === 'nan' || s === 'n/a' || s === 'none';
    }
    return false;
  };
  
  const updatedColumns = fd.columns.map(col => {
    const nullCount = data.filter(r => isNullLike(r[col.name])).length;
    const uniqueCount = new Set(data.map(r => r[col.name])).size;
    return {
      ...col,
      nullCount,
      uniqueCount
    };
  });
  
  const completelyNullRowCount = data.filter(row => {
    return fd.columns.every(col => isNullLike(row[col.name]));
  }).length;
  
  const completelyNullColCount = updatedColumns.filter(c => c.nullCount === totalRows).length;
  const firstRow = data[0] || {};
  
  const updatedFileData = {
    ...fd,
    columns: updatedColumns,
    rowCount: totalRows,
    completelyNullRowCount,
    completelyNullColCount,
    firstRow
  };
  
  setState({ fileData: updatedFileData });
  return updatedFileData;
}
