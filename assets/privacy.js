(function () {
  'use strict';
  var status = document.getElementById('privacy-status');
  function choice(value) {
    try {
      localStorage.setItem('site.analytics.consent', value);
      if (value !== 'yes') localStorage.removeItem('site.analytics.browser');
      status.textContent = value === 'yes' ? 'Analytics allowed. Privacy signals in your browser still take priority.' : 'Analytics declined. The saved browser ID has been removed.';
    } catch (_error) { status.textContent = 'Your browser does not allow saved preferences. Analytics stays off.'; }
  }
  document.getElementById('privacy-allow').addEventListener('click', function () { choice('yes'); });
  document.getElementById('privacy-decline').addEventListener('click', function () { choice('no'); });
  try { status.textContent = localStorage.getItem('site.analytics.consent') === 'yes' ? 'Current preference: allowed.' : 'Current preference: not allowed.'; } catch (_error) {}
})();
