(function(){
  function applyTheme() {
    document.body.classList.add('theme-day');
    document.body.classList.remove('theme-night');
  }

  document.addEventListener('DOMContentLoaded', function () {
    applyTheme();
  });
})();
