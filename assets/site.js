(function(){
  function applyTheme() {
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    document.body.classList.toggle('theme-day', !prefersDark.matches);
    document.body.classList.toggle('theme-night', prefersDark.matches);
  }

  document.addEventListener('DOMContentLoaded', function () {
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    applyTheme();
    if (typeof prefersDark.addEventListener === 'function') {
      prefersDark.addEventListener('change', applyTheme);
    } else if (typeof prefersDark.addListener === 'function') {
      prefersDark.addListener(applyTheme);
    }
  });
})();
