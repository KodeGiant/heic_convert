// HEIC to JPEG Converter — app.js
// Loaded with defer; DOM is guaranteed to be ready.

(function () {
  // ─── State ────────────────────────────────────────────────────────────────
  let selectedFiles = [];   // Array of File objects
  let convertedBlobs = [];  // Array of { name: string, blob: Blob }

  // ─── Element references ───────────────────────────────────────────────────
  const dropZone       = document.getElementById('drop-zone');
  const fileInput      = document.getElementById('file-input');
  const qualitySlider  = document.getElementById('quality-slider');
  const qualityValue   = document.getElementById('quality-value');
  const convertBtn     = document.getElementById('convert-btn');
  const statusEl       = document.getElementById('status');
  const resultsEl      = document.getElementById('results');
  const resultsList    = document.getElementById('results-list');
  const downloadAllBtn = document.getElementById('download-all-btn');

  // Original drop-zone hint text (restored when selection is cleared)
  const DROP_HINT = 'Drop HEIC files here';

  // ─── Helpers ──────────────────────────────────────────────────────────────

  function isHeic(file) {
    return file.name.toLowerCase().endsWith('.heic');
  }

  function updateConvertBtn() {
    if (selectedFiles.length > 0) {
      convertBtn.disabled = false;
      dropZone.querySelector('p').textContent =
        selectedFiles.length + ' file(s) ready';
    } else {
      convertBtn.disabled = true;
      dropZone.querySelector('p').textContent = DROP_HINT;
    }
  }

  // ─── Quality slider (CONV-02) ─────────────────────────────────────────────

  qualitySlider.addEventListener('input', function () {
    qualityValue.textContent = qualitySlider.value;
  });

  // ─── Drag-and-drop (INPUT-01) ─────────────────────────────────────────────

  dropZone.addEventListener('dragover', function (e) {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });

  dropZone.addEventListener('dragenter', function (e) {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });

  dropZone.addEventListener('dragleave', function () {
    dropZone.classList.remove('dragover');
  });

  dropZone.addEventListener('drop', function (e) {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const files = Array.from(e.dataTransfer.files).filter(isHeic);
    selectedFiles = files;
    updateConvertBtn();
  });

  // ─── Click to open file picker (INPUT-02) ─────────────────────────────────
  // The <label for="file-input"> already opens the picker natively.
  // This handler covers clicks on the drop-zone background itself.

  dropZone.addEventListener('click', function (e) {
    if (e.target.closest('label') || e.target === fileInput) return;
    fileInput.click();
  });

  // ─── File input change (INPUT-02) ─────────────────────────────────────────

  fileInput.addEventListener('change', function () {
    selectedFiles = Array.from(fileInput.files).filter(isHeic);
    updateConvertBtn();
  });

  // ─── Convert button (CONV-01) ─────────────────────────────────────────────

  convertBtn.addEventListener('click', async function () {
    if (selectedFiles.length === 0) return;

    // Reset UI
    convertBtn.disabled = true;
    statusEl.removeAttribute('hidden');
    statusEl.classList.remove('error');
    statusEl.textContent = 'Converting\u2026';
    convertedBlobs = [];
    resultsList.innerHTML = '';
    resultsEl.setAttribute('hidden', '');

    const quality = parseInt(qualitySlider.value, 10) / 100;
    let failCount = 0;

    for (const file of selectedFiles) {
      try {
        // File objects may have an empty/wrong MIME type for HEIC on some browsers.
        // Re-wrap as a typed Blob so heic2any can identify the format.
        const heicBlob = new Blob([await file.arrayBuffer()], { type: 'image/heic' });
        const result = await heic2any({ blob: heicBlob, toType: 'image/jpeg', quality }); // eslint-disable-line no-undef
        // heic2any returns a Blob for single-image files but an Array<Blob> for
        // multi-image containers (e.g. Apple Live Photos, burst sequences).
        // Normalise to always work with a single Blob.
        const blob = Array.isArray(result) ? result[0] : result;
        const name = file.name.replace(/\.heic$/i, '.jpg');
        convertedBlobs.push({ name, blob });
        appendResultItem(name, blob);
      } catch (err) {
        // heic2any throws {code:1, message:'ERR_USER Image is already browser readable: ...'}
        // when the file is already a JPEG/PNG (e.g. iCloud-transcoded HEIC, or "Most Compatible" iPhone setting).
        // In that case, pass the file through unchanged.
        if (err && err.code === 1 && err.message && err.message.includes('already browser readable')) {
          const passthroughBlob = new Blob([await file.arrayBuffer()], { type: 'image/jpeg' });
          const name = file.name.replace(/\.heic$/i, '.jpg');
          convertedBlobs.push({ name, blob: passthroughBlob });
          appendResultItem(name, passthroughBlob);
        } else {
          failCount++;
          console.error('heic2any error for', file.name, ':', err);
          appendErrorItem(file.name, err);
        }
      }
    }

    // Restore convert button
    convertBtn.disabled = false;

    if (convertedBlobs.length > 0) {
      statusEl.setAttribute('hidden', '');
      resultsEl.removeAttribute('hidden');
    }

    if (failCount > 0 && convertedBlobs.length === 0) {
      // All files failed — surface the actual error
      const isFileProtocol = location.protocol === 'file:';
      statusEl.removeAttribute('hidden');
      statusEl.classList.add('error');
      statusEl.textContent = isFileProtocol
        ? 'Conversion failed. Open the page via a local server (python3 -m http.server), not file://.'
        : 'Conversion failed. Check the browser console for details.';
    }
  });

  // ─── Result item injection (DL-01) ────────────────────────────────────────

  function appendResultItem(name, blob) {
    const url = URL.createObjectURL(blob);
    const li = document.createElement('li');
    li.className = 'result-item';
    li.innerHTML =
      '<span>' + escapeHtml(name) + '</span>' +
      '<a href="' + url + '" download="' + escapeHtml(name) + '">Download</a>';
    resultsList.appendChild(li);
  }

  function appendErrorItem(fileName, err) {
    const li = document.createElement('li');
    li.className = 'result-item';
    const reason = err && err.message ? ' (' + escapeHtml(err.message) + ')' : '';
    li.innerHTML = '<span>' + escapeHtml(fileName) + ' \u2014 failed' + reason + '</span>';
    resultsList.appendChild(li);
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ─── ZIP download (DL-02) ─────────────────────────────────────────────────

  downloadAllBtn.addEventListener('click', async function () {
    if (convertedBlobs.length === 0) return;

    downloadAllBtn.textContent = 'Zipping\u2026';

    const zip = new JSZip(); // eslint-disable-line no-undef
    for (const { name, blob } of convertedBlobs) {
      zip.file(name, blob);
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'converted.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    downloadAllBtn.textContent = 'Download all as ZIP';
  });

}());
