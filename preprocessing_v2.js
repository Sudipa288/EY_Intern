// ===== PREPROCESSING PAGE JS =====

let actionLog = [];

// ===== NULL OVERVIEW =====

async function renderNullOverview(shouldRefresh = true) {
  const state = getState();
  if (!state.fileData) return;

  if (shouldRefresh) {
    // Await the row count refresh FIRST so totalRows is correct before any calculations
    await refreshRowCount();
  }

  // Re-read fd after refresh so we have the updated rowCount
  const fd = getState().fileData;
  if (!fd) return;

  const totalRows = fd.rowCount ?? 0;
  const totalCols = fd.columns ? fd.columns.length : 0;

  // Debug first row safely from metadata
  const firstRow = fd.firstRow || {};
  const debugEl = document.getElementById('debugContent');
  if (debugEl) {
    debugEl.innerHTML = Object.keys(firstRow).length > 0
      ? `<pre>${JSON.stringify(firstRow, null, 2)}</pre>`
      : `<pre>No preview data row available.</pre>`;
  }

  // Use pre-calculated column null stats from metadata
  const colNulls = (fd.columns || []).map(col => {
    const nullLikeCount = col.nullCount ?? 0;
    // A column is completely null if every row in that column is null
    const isCompletelyNull = totalRows > 0 && nullLikeCount >= totalRows;
    return {
      name: col.name,
      type: col.originalType || col.type || 'string',
      nullCount: nullLikeCount,
      isCompletelyNull,
      nullPct: totalRows > 0 ? ((nullLikeCount / totalRows) * 100).toFixed(1) : '0.0'
    };
  });

  // Recalculate completely null column count LIVE from column data (never trust stale localStorage)
  const completelyNullColCount = colNulls.filter(c => c.isCompletelyNull).length;
  // Completely null row count: use stored value as best available (requires row-level data to recompute)
  const completelyNullRowCount = fd.completelyNullRowCount ?? 0;

  // Update stats — use safe element selectors
  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setEl('nullTotalRows', totalRows.toLocaleString());
  setEl('nullRowCount',  completelyNullRowCount.toLocaleString());
  setEl('nullTotalCols', totalCols);
  setEl('nullColCount',  completelyNullColCount);

  // Persist the freshly computed value back into state so Summary section is also correct
  if (completelyNullColCount !== (fd.completelyNullColCount ?? 0)) {
    setState({ fileData: { ...fd, completelyNullColCount } });
  }

  // Build null table
  const tbody = document.getElementById('nullTableBody');
  if (!tbody) return;

  if (colNulls.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No data available</td></tr>';
    return;
  }

  const sorted = [...colNulls].sort((a, b) => b.nullCount - a.nullCount);
  tbody.innerHTML = sorted.map(col => {
    const pct = parseFloat(col.nullPct);
    const barColor = !col.isCompletelyNull ? 'var(--green-600)' : 'var(--red-400)';
    const statusClass = !col.isCompletelyNull ? 'green-text' : 'red-text';
    return `
      <tr>
        <td class="bold">${col.name}</td>
        <td><span class="null-type-badge">${col.type}</span></td>
        <td class="text-right ${statusClass} bold">${col.nullCount.toLocaleString()}</td>
        <td class="text-right ${statusClass}">${col.nullPct}%</td>
        <td>
          <div class="null-bar-track">
            <div class="null-bar-fill" style="width:${Math.max(pct, pct > 0 ? 2 : 0)}%;background:${barColor}"></div>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  // Pass the live-computed value to Summary section
  updateSummaryFromMetadata({ ...fd, completelyNullColCount });

}

// ===== PROMPT COMMANDS =====

function fillPrompt(text) {
  const el = document.getElementById('promptInput');
  if (el) { el.value = text; el.focus(); }
}

async function handlePromptSubmit() {
  const input = document.getElementById('promptInput');
  if (!input) return;
  const cmd = input.value.trim().toLowerCase();
  if (!cmd) return;

  const state = getState();
  if (!state.fileData) return;

  const progressBanner = document.createElement('div');
  progressBanner.innerHTML = '⏳ Loading full dataset for command execution...';
  progressBanner.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#1e293b;color:#fff;padding:12px 20px;border-radius:8px;z-index:9999;font-size:14px;font-weight:600;box-shadow:0 4px 12px rgba(0,0,0,0.1);';
  document.body.appendChild(progressBanner);

  let data;
  try {
    data = [...(_pageDataCache || await ensureData())];
  } catch (e) {
    progressBanner.remove();
    alert('Failed to load dataset: ' + e.message);
    return;
  }
  progressBanner.remove();

  let columns = [...state.fileData.columns];
  let result = { action: '', detail: '', success: false };

  const getRowVal = (row, colName) => {
    if (row[colName] !== undefined) return row[colName];
    const found = Object.keys(row).find(k => k.toLowerCase().trim() === colName.toString().toLowerCase().trim());
    return found ? row[found] : undefined;
  };

  const isNullLike = (v) => {
    if (v === null || v === undefined || v === '') return true;
    if (typeof v === 'string') {
      const s = v.toLowerCase().trim();
      return s === 'null' || s === 'nan' || s === 'n/a' || s === 'none';
    }
    return false;
  };

  if (cmd === 'drop null rows' || cmd === 'remove null rows' || cmd === 'drop completely null rows') {
    const before = data.length;
    data = data.filter(row => !columns.every(col => isNullLike(getRowVal(row, col.name))));
    result = { action: 'Drop null rows', detail: `Removed ${before - data.length} completely null rows`, success: true };

  } else if (cmd === 'drop null columns' || cmd === 'remove null columns' || cmd === 'drop completely null columns') {
    const before = columns.length;
    columns = columns.filter(col => !data.every(row => isNullLike(getRowVal(row, col.name))));
    result = { action: 'Drop null columns', detail: `Removed ${before - columns.length} completely null columns`, success: true };

  } else if (cmd === 'fill mean' || cmd === 'fill with mean') {
    columns.filter(c => c.originalType === 'integer' || c.originalType === 'float').forEach(col => {
      const vals = data.map(r => parseFloat(getRowVal(r, col.name))).filter(v => !isNaN(v));
      if (vals.length === 0) return;
      const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
      data.forEach(row => { if (isNullLike(getRowVal(row, col.name))) row[col.name] = parseFloat(mean.toFixed(4)); });
    });
    result = { action: 'Fill mean', detail: 'Filled null values with column mean for numeric columns', success: true };

  } else if (cmd === 'fill median' || cmd === 'fill with median') {
    columns.filter(c => c.originalType === 'integer' || c.originalType === 'float').forEach(col => {
      const vals = data.map(r => parseFloat(getRowVal(r, col.name))).filter(v => !isNaN(v)).sort((a, b) => a - b);
      if (vals.length === 0) return;
      const median = vals.length % 2 === 0 ? (vals[vals.length/2-1] + vals[vals.length/2]) / 2 : vals[Math.floor(vals.length/2)];
      data.forEach(row => { if (isNullLike(getRowVal(row, col.name))) row[col.name] = parseFloat(median.toFixed(4)); });
    });
    result = { action: 'Fill median', detail: 'Filled null values with column median for numeric columns', success: true };

  } else if (cmd.startsWith('fill ')) {
    const fillVal = cmd.replace('fill ', '').trim();
    const numVal = parseFloat(fillVal);
    const useNum = !isNaN(numVal);
    columns.forEach(col => {
      data.forEach(row => { if (isNullLike(getRowVal(row, col.name))) row[col.name] = useNum ? numVal : fillVal; });
    });
    result = { action: `Fill "${fillVal}"`, detail: `Filled all null values with "${fillVal}"`, success: true };

  } else if (cmd === 'forward fill' || cmd === 'ffill') {
    columns.forEach(col => {
      let last = null;
      data.forEach(row => {
        if (!isNullLike(getRowVal(row, col.name))) last = getRowVal(row, col.name);
        else if (last !== null) row[col.name] = last;
      });
    });
    result = { action: 'Forward fill', detail: 'Forward-filled null values using previous row values', success: true };

  } else if (cmd === 'drop duplicates' || cmd === 'remove duplicates') {
    const before = data.length;
    const seen = new Set();
    data = data.filter(row => {
      const key = JSON.stringify(row);
      if (seen.has(key)) return false;
      seen.add(key); return true;
    });
    result = { action: 'Drop duplicates', detail: `Removed ${before - data.length} duplicate rows`, success: true };

  } else if (cmd.startsWith('drop column ')) {
    const colName = cmd.replace('drop column ', '').trim();
    const before = columns.length;
    columns = columns.filter(c => c.name.toLowerCase() !== colName.toLowerCase());
    if (columns.length < before) {
      data.forEach(row => delete row[colName]);
      result = { action: `Drop column "${colName}"`, detail: `Column removed from dataset`, success: true };
    } else {
      result = { action: `Drop column "${colName}"`, detail: `Column not found`, success: false };
    }

  } else {
    result = { action: cmd, detail: 'Command not recognized. Try: drop null rows, fill mean, drop duplicates, etc.', success: false };
  }

  if (result.success) {
    _pageDataCache = data;
    const updatedFd = {
      ...state.fileData,
      columns,
      rowCount: data.length,
      completelyNullRowCount: 0,
      completelyNullColCount: 0
    };
    setState({ fileData: updatedFd });
    renderNullOverview(false);
  }

  actionLog.push({ ...result, time: new Date().toLocaleTimeString() });
  renderActionLog();

  const input2 = document.getElementById('promptInput');
  if (input2) input2.value = '';
}

function renderActionLog() {
  const logEl = document.getElementById('actionLog');
  const listEl = document.getElementById('actionLogList');
  if (!logEl || !listEl) return;
  logEl.classList.toggle('hidden', actionLog.length === 0);
  listEl.innerHTML = actionLog.map(entry => `
    <div class="action-log-item ${entry.success ? 'success' : 'error'}">
      <span class="action-log-icon">${entry.success ? '✓' : '✗'}</span>
      <div class="action-log-content">
        <span class="action-log-action">${entry.action}</span>
        <span class="action-log-detail">${entry.detail}</span>
      </div>
      <span class="action-log-time">${entry.time}</span>
    </div>
  `).join('');
}

function initPromptListener() {
  const el = document.getElementById('promptInput');
  if (el) el.addEventListener('keydown', (e) => { if (e.key === 'Enter') handlePromptSubmit(); });
}

// ===== SUMMARY =====

function updateSummaryFromMetadata(fd) {
  const list = document.getElementById('summaryList');
  if (!list) return;
  if (!fd) { list.innerHTML = '<li>No data loaded yet.</li>'; return; }

  const totalRows = fd.rowCount ?? 0;
  const totalCols = fd.columns ? fd.columns.length : 0;
  const completelyNullRowCount = fd.completelyNullRowCount ?? 0;
  // Always recalculate live from column data — never trust stale stored value
  const completelyNullColCount = (fd.columns || []).filter(col =>
    (col.nullCount ?? 0) >= totalRows && totalRows > 0
  ).length;

  list.innerHTML = [
    `Total rows: <strong>${totalRows.toLocaleString()}</strong>`,
    `Total columns: <strong>${totalCols}</strong>`,
    completelyNullRowCount > 0
      ? `Completely null rows: <strong class="red-text">${completelyNullRowCount.toLocaleString()}</strong>`
      : `Completely null rows: <strong class="green-text">0 ✓</strong>`,
    completelyNullColCount > 0
      ? `Completely null columns: <strong class="red-text">${completelyNullColCount}</strong>`
      : `Completely null columns: <strong class="green-text">0 ✓</strong>`,
  ].map(p => `<li>${p}</li>`).join('');
}

async function handlePreprocess() {
  const state = getState();
  const btn = document.getElementById('processBtn');
  if (btn) btn.disabled = true;
  try {
    const sessionId = state.fileData?.sessionId;
    if (!sessionId) throw new Error('No session found. Please re-upload your file.');
    if (actionLog.length > 0) {
      const data = _pageDataCache || await ensureData();
      // Keep only active columns in the saved dataset
      const activeCols = new Set((state.fileData.columns || []).map(c => c.name));
      const cleanedData = data.map(row => {
        const newRow = {};
        for (const colName of activeCols) {
          newRow[colName] = row[colName] !== undefined ? row[colName] : null;
        }
        return newRow;
      });
      await fetch(`${API_BASE}/data/${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: cleanedData })
      });
    }
    navigateTo(3);
  } catch (err) {
    console.error(err);
    alert(err.message);
  } finally {
    if (btn) btn.disabled = false;
  }
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  injectNav(2);
  renderNullOverview();
  initPromptListener();
});
