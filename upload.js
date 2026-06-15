// ===== UPLOAD PAGE JS =====

function initFileUploader() {
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');

  dropZone.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragging'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragging'));
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragging');
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  });
  fileInput.addEventListener('change', (e) => {
    if (e.target.files[0]) handleFile(e.target.files[0]);
  });
}

async function handleFile(file) {
  const errorEl = document.getElementById('uploadError');
  const successEl = document.getElementById('uploadSuccess');
  const dropZone = document.getElementById('dropZone');
  const titleEl = document.getElementById('dropZoneTitle');

  errorEl.classList.add('hidden');
  successEl.classList.add('hidden');

  const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
  if (!validTypes.includes(file.type) && !file.name.endsWith('.csv')) {
    showUploadError('Please upload a CSV or Excel file');
    return;
  }
  if (file.size > 50 * 1024 * 1024) {
    showUploadError('File size must be less than 50MB');
    return;
  }

  dropZone.classList.add('loading');
  titleEl.textContent = 'Uploading file...';

  try {
    const formData = new FormData();
    formData.append('file', file);
    const resp = await fetch(`${API_BASE}/upload`, { method: 'POST', body: formData });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.detail || `Upload failed (${resp.status})`);
    }
    const data = await resp.json();

    // Store only lightweight metadata — NO raw data rows in the browser
    setState({
      fileData: {
        columns: data.columns.map(c => ({
          name: c.name,
          originalType: c.type || c.originalType || 'string',
          currentType: c.type || c.originalType || 'string',
          nullable: c.nullable ?? true,
          nullCount: c.nullCount ?? 0,
          uniqueCount: c.uniqueCount ?? 0
        })),
        fileName: data.fileName,
        fileSize: data.fileSize,
        rowCount: data.rowCount,
        completelyNullRowCount: data.completelyNullRowCount ?? 0,
        completelyNullColCount: data.completelyNullColCount ?? 0,
        firstRow: data.firstRow || {},
        sessionId: data.sessionId,   // Key to fetch data from backend
        fileId: data.fileId || null,
      }
    });

    successEl.classList.remove('hidden');
    setTimeout(() => navigateTo(1), 1000);
  } catch (err) {
    showUploadError(err.message || 'Failed to upload file. Make sure the backend server is running.');
  } finally {
    dropZone.classList.remove('loading');
    titleEl.textContent = 'Drag and drop your file here';
  }
}

function showUploadError(msg) {
  const el = document.getElementById('uploadError');
  document.getElementById('uploadErrorMsg').textContent = msg;
  el.classList.remove('hidden');
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  injectNav(0);
  initFileUploader();
});
