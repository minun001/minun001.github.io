import * as pdfjsLib from './lib/pdfjs-6.5.438/pdf.min.mjs';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('./lib/pdfjs-6.5.438/pdf.worker.min.mjs', import.meta.url).href;

export async function openPDF(url, title) {
  const panel = document.getElementById('media-pdf');
  const canvas = document.getElementById('pdf-canvas');
  const previous = document.getElementById('pdf-previous');
  const next = document.getElementById('pdf-next');
  const counter = document.getElementById('pdf-page');
  const status = document.getElementById('media-status');
  const text = document.getElementById('pdf-text');
  const task = pdfjsLib.getDocument({ url, isEvalSupported: false });
  const pdf = await task.promise;
  let current = 1;
  let busy = false;

  function updateControls() {
    previous.disabled = busy || current <= 1;
    next.disabled = busy || current >= pdf.numPages;
  }

  async function renderPage(number) {
    if (busy || number < 1 || number > pdf.numPages) return;
    busy = true;
    current = number;
    updateControls();
    counter.textContent = `Page ${current} of ${pdf.numPages}`;
    status.textContent = 'Rendering PDF page...';
    try {
      const page = await pdf.getPage(current);
      const base = page.getViewport({ scale: 1 });
      const width = Math.min(1200, Math.max(240, panel.clientWidth));
      const viewport = page.getViewport({ scale: width / base.width });
      const density = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.ceil(viewport.width * density);
      canvas.height = Math.ceil(viewport.height * density);
      canvas.setAttribute('aria-label', `${title}, page ${current} of ${pdf.numPages}`);
      await page.render({ canvasContext: canvas.getContext('2d'), viewport, transform: density === 1 ? null : [density, 0, 0, density, 0, 0] }).promise;
      canvas.hidden = false;
      const content = await page.getTextContent();
      text.textContent = content.items.map(item => item.str + (item.hasEOL ? '\n' : ' ')).join('');
      status.textContent = `Page ${current} of ${pdf.numPages}. The original file is unchanged.`;
    } finally {
      busy = false;
      updateControls();
    }
  }

  function reportFailure() {
    canvas.hidden = true;
    text.textContent = '';
    status.textContent = 'This page could not render. Use Open original file or Download original file.';
  }
  previous.addEventListener('click', () => { renderPage(current - 1).catch(reportFailure); });
  next.addEventListener('click', () => { renderPage(current + 1).catch(reportFailure); });
  window.addEventListener('pagehide', event => { if (!event.persisted) task.destroy(); });
  await renderPage(1);
}
