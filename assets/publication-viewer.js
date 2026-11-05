(function () {
  function resolveMedia(records, search, origin) {
    var params = new URLSearchParams(search);
    var id = params.get('paper');
    var kind = params.get('type');
    if (!records || !Object.prototype.hasOwnProperty.call(records, id) || (kind !== 'pdf' && kind !== 'figure')) return null;
    var record = records[id];
    if (!record || typeof record.title !== 'string' || typeof record[kind] !== 'string') return null;
    var path = record[kind];
    var prefix = kind === 'pdf' ? '/assets/papers/' : '/assets/img/';
    if (!path.startsWith(prefix) || /[\\%]/.test(path)) return null;
    var url = new URL(path, origin);
    var extension = kind === 'pdf' ? /\.pdf$/i : /\.(png|jpe?g|webp|svg)$/i;
    if (url.origin !== origin || !url.pathname.startsWith(prefix) || !extension.test(url.pathname) || url.search || url.hash) return null;
    return { title: record.title, alt: record.figure_alt || record.title, kind: kind, url: url.href };
  }

  async function initializeViewer(loadPDF) {
    var status = document.getElementById('media-status');
    var records;
    try {
      records = JSON.parse(document.getElementById('publication-media-data').textContent);
    } catch (_error) {
      status.textContent = 'The publication list could not load. Return to Publications and try again.';
      return;
    }
    var media;
    try {
      media = resolveMedia(records, window.location.search, window.location.origin);
    } catch (_error) {
      media = null;
    }
    if (!media) {
      status.textContent = 'This file is not available in the public archive. Choose a figure or PDF from Publications.';
      return;
    }
    var label = media.kind === 'pdf' ? 'Full paper PDF' : 'Original figure';
    document.getElementById('media-title').textContent = media.title;
    document.title = label + ' | Hyunsik Min';
    var kind = document.getElementById('media-kind');
    kind.textContent = label;
    kind.hidden = false;
    ['media-download', 'media-original'].forEach(function (id) {
      document.getElementById(id).href = media.url;
    });
    document.getElementById('media-actions').hidden = false;
    if (media.kind === 'pdf') {
      document.getElementById('media-pdf').hidden = false;
      document.getElementById('media-pdf-help').hidden = false;
      status.textContent = 'Loading original PDF...';
      try {
        await loadPDF(media);
      } catch (_error) {
        document.getElementById('media-pdf').hidden = true;
        status.textContent = 'The PDF preview could not load. Use Open original file or Download original file.';
      }
    } else {
      var image = document.getElementById('media-figure');
      image.alt = media.alt;
      image.addEventListener('load', function () { status.textContent = 'Original figure, fitted to this screen.'; });
      image.addEventListener('error', function () {
        document.getElementById('media-figure-frame').hidden = true;
        status.textContent = 'The figure could not load. Use Open original file or Download original file.';
      });
      status.textContent = 'Loading original figure...';
      image.src = media.url;
      document.getElementById('media-figure-frame').hidden = false;
    }
  }
  document.addEventListener('DOMContentLoaded', function () {
    initializeViewer(function (media) {
      return import('./publication-pdf.js?v=20261105a').then(function (reader) {
        return reader.openPDF(media.url, media.title);
      });
    });
  });
})();
