// ===== EXPLORER PAGE JS =====

async function renderDataExplorer() {
  const state = getState();
  const fd = state.fileData;

  if (!fd || !fd.sessionId) {
    document.getElementById('columnList').innerHTML = '<p class="empty-state">Please upload a file first</p>';
    return;
  }

  // --- Step 1: Render immediately from whatever is in state (even if rowCount is stale) ---
  document.getElementById('statColumns').textContent = (fd.columns || []).length;
  document.getElementById('statRows').textContent = fd.rowCount ? fd.rowCount.toLocaleString() : '…';
  document.getElementById('statFileName').textContent = fd.fileName || '—';
  document.getElementById('statFileSize').textContent = ((fd.fileSize ?? 0) / 1024).toFixed(2) + ' KB';

  // Render column list right away
  renderColumnList(fd, state.columnUpdates || {});

  // --- Step 2: Always fetch authoritative row count from backend ---
  try {
    const resp = await fetch(`${API_BASE}/meta/${fd.sessionId}`);
    if (resp.ok) {
      const meta = await resp.json();
      if (meta.rowCount > 0) {
        // Patch state
        setState({ fileData: { ...getState().fileData, rowCount: meta.rowCount } });
        // Update DOM directly
        document.getElementById('statRows').textContent = meta.rowCount.toLocaleString();
      }
    } else if (resp.status === 404) {
      // Session expired — backend no longer has this file
      showSessionExpiredBanner();
      document.getElementById('statRows').textContent = '—';
    }
  } catch (e) {
    console.warn('Meta fetch failed:', e.message);
    showBackendDownBanner();
  }
}

function renderColumnList(fd, columnUpdates) {
  const list = document.getElementById('columnList');
  if (!fd.columns || fd.columns.length === 0) {
    list.innerHTML = '<p class="empty-state">No columns found.</p>';
    return;
  }
  list.innerHTML = '';
  fd.columns.forEach((col) => {
    const nullCount = col.nullCount ?? 0;
    const uniqueCount = col.uniqueCount ?? 0;
    const displayType = col.originalType || col.type || 'string';

    const item = document.createElement('div');
    item.className = 'column-item';
    item.innerHTML = `
      <button class="column-header" onclick="toggleColumn(this)">
        <div>
          <p class="column-name">${col.name}</p>
          <p class="column-type-label">Type: <span style="font-weight:500">${displayType}</span></p>
        </div>
        <svg class="column-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      <div class="column-details">
        <div class="column-detail-grid">
          <div>
            <label class="detail-label">Current Type</label>
            <p class="detail-value">${displayType}</p>
          </div>
          <div>
            <label class="detail-label">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Change Type
            </label>
            <select class="select-input" onchange="updateColumnType('${col.name}', this.value)">
              ${DATA_TYPES.map(t => `<option value="${t}" ${(columnUpdates[col.name] || displayType) === t ? 'selected' : ''}>${t}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="column-detail-grid-3">
          <div><p class="detail-stat-label">Null Values</p><p class="detail-stat-value">${nullCount.toLocaleString()}</p></div>
          <div><p class="detail-stat-label">Unique Values</p><p class="detail-stat-value">${uniqueCount.toLocaleString()}</p></div>
          <div><p class="detail-stat-label">Nullable</p><p class="detail-stat-value">${col.nullable ? 'Yes' : 'No'}</p></div>
        </div>
      </div>
    `;
    list.appendChild(item);
  });
}

function toggleColumn(btn) {
  const details = btn.nextElementSibling;
  const chevron = btn.querySelector('.column-chevron');
  details.classList.toggle('open');
  chevron.classList.toggle('open');
}

function updateColumnType(colName, newType) {
  const state = getState();
  const columnUpdates = state.columnUpdates || {};
  columnUpdates[colName] = newType;
  setState({ columnUpdates });
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  injectNav(1);
  renderDataExplorer();
});
