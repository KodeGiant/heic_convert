// HEIC to JPEG / GIF to video Converter — app.js
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

  const DROP_HINT = 'Drop HEIC or GIF files here';

  // ─── lazy imports ─────────────────────────────────────────────────────────
  let gifuct = null;
  async function getGifuct() {
    if (!gifuct) gifuct = await import('https://esm.sh/gifuct-js@2.1.2');
    return gifuct;
  }

  let mp4muxerMod = null;
  async function getMp4Muxer() {
    if (!mp4muxerMod) mp4muxerMod = await import('https://esm.sh/mp4-muxer@4');
    return mp4muxerMod;
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  function isHeic(file) {
    return file.name.toLowerCase().endsWith('.heic');
  }

  function isGif(file) {
    return file.name.toLowerCase().endsWith('.gif') || file.type === 'image/gif';
  }

  function isSupportedFile(file) {
    return isHeic(file) || isGif(file);
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
    selectedFiles = Array.from(e.dataTransfer.files).filter(isSupportedFile);
    updateConvertBtn();
  });

  // ─── Click to open file picker (INPUT-02) ─────────────────────────────────

  dropZone.addEventListener('click', function (e) {
    if (e.target.closest('label') || e.target === fileInput) return;
    fileInput.click();
  });

  // ─── File input change (INPUT-02) ─────────────────────────────────────────

  fileInput.addEventListener('change', function () {
    selectedFiles = Array.from(fileInput.files).filter(isSupportedFile);
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
      const ok = isGif(file)
        ? await convertGif(file)
        : await convertHeic(file, quality);
      if (!ok) failCount++;
    }

    // Restore convert button
    convertBtn.disabled = false;

    if (convertedBlobs.length > 0) {
      statusEl.setAttribute('hidden', '');
      resultsEl.removeAttribute('hidden');
    }

    if (failCount > 0 && convertedBlobs.length === 0) {
      const isFileProtocol = location.protocol === 'file:';
      statusEl.removeAttribute('hidden');
      statusEl.classList.add('error');
      statusEl.textContent = isFileProtocol
        ? 'Conversion failed. Open the page via a local server (python3 -m http.server), not file://.'
        : 'Conversion failed. Check the browser console for details.';
    }
  });

  async function convertHeic(file, quality) {
    try {
      const heicBlob = new Blob([await file.arrayBuffer()], { type: 'image/heic' });
      const result = await heic2any({ blob: heicBlob, toType: 'image/jpeg', quality }); // eslint-disable-line no-undef
      const blob = Array.isArray(result) ? result[0] : result;
      const name = file.name.replace(/\.heic$/i, '.jpg');
      convertedBlobs.push({ name, blob });
      appendResultItem(name, blob);
      return true;
    } catch (err) {
      if (err && err.code === 1 && err.message && err.message.includes('already browser readable')) {
        const passthroughBlob = new Blob([await file.arrayBuffer()], { type: 'image/jpeg' });
        const name = file.name.replace(/\.heic$/i, '.jpg');
        convertedBlobs.push({ name, blob: passthroughBlob });
        appendResultItem(name, passthroughBlob);
        return true;
      }
      console.error('heic2any error for', file.name, ':', err);
      appendErrorItem(file.name, err);
      return false;
    }
  }

  async function convertGif(file) {
    try {
      statusEl.textContent = 'Parsing ' + file.name + '\u2026';

      const { parseGIF, decompressFrames } = await getGifuct();
      const buffer = await file.arrayBuffer();
      const gif = parseGIF(buffer);
      const frames = decompressFrames(gif, true);
      if (!frames || frames.length === 0) throw new Error('No frames found');

      const width = gif.lsd.width;
      const height = gif.lsd.height;
      // AVC requires even dimensions
      const encW = width % 2 === 0 ? width : width + 1;
      const encH = height % 2 === 0 ? height : height + 1;

      const canvas = document.createElement('canvas');
      canvas.width = encW;
      canvas.height = encH;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, encW, encH);

      const tmp = document.createElement('canvas');
      const tmpCtx = tmp.getContext('2d');

      const { Muxer, ArrayBufferTarget } = await getMp4Muxer();
      const muxer = new Muxer({
        target: new ArrayBufferTarget(),
        video: { codec: 'avc', width: encW, height: encH },
        fastStart: 'in-memory',
      });

      const encoder = new VideoEncoder({
        output: function (chunk, meta) { muxer.addVideoChunk(chunk, meta); },
        error: function (e) { throw e; },
      });
      encoder.configure({ codec: 'avc1.42001f', width: encW, height: encH, bitrate: 2_000_000 });

      statusEl.textContent = 'Encoding ' + file.name + '\u2026';
      let timestamp = 0; // microseconds

      for (const frame of frames) {
        const snapshot = frame.disposalType === 3
          ? ctx.getImageData(0, 0, encW, encH) : null;

        tmp.width = frame.dims.width;
        tmp.height = frame.dims.height;
        tmpCtx.putImageData(new ImageData(frame.patch, frame.dims.width, frame.dims.height), 0, 0);
        ctx.drawImage(tmp, frame.dims.left, frame.dims.top);

        const duration = Math.max(frame.delay || 100, 20) * 1000; // delay already in ms → µs
        const vf = new VideoFrame(canvas, { timestamp: timestamp, duration: duration });
        encoder.encode(vf, { keyFrame: timestamp === 0 });
        vf.close();
        timestamp += duration;

        if (frame.disposalType === 2) {
          ctx.clearRect(frame.dims.left, frame.dims.top, frame.dims.width, frame.dims.height);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(frame.dims.left, frame.dims.top, frame.dims.width, frame.dims.height);
        } else if (frame.disposalType === 3 && snapshot) {
          ctx.putImageData(snapshot, 0, 0);
        }
      }

      await encoder.flush();
      muxer.finalize();

      const blob = new Blob([muxer.target.buffer], { type: 'video/mp4' });
      const name = file.name.replace(/\.gif$/i, '.mp4');
      convertedBlobs.push({ name, blob });
      appendResultItem(name, blob);
      statusEl.textContent = 'Converting\u2026';
      return true;
    } catch (err) {
      console.error('GIF conversion error for', file.name, ':', err);
      appendErrorItem(file.name, err);
      return false;
    }
  }

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
