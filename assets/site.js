(function(){
  function applyTheme() {
    document.body.classList.add('theme-day');
    document.body.classList.remove('theme-night');
  }

  function bindCopyButtons() {
    document.querySelectorAll('[data-copy-email]').forEach(function (button) {
      if (button.dataset.boundCopy === '1') return;
      button.dataset.boundCopy = '1';

      button.addEventListener('click', async function () {
        var email = button.getAttribute('data-copy-email');
        var original = button.getAttribute('data-copy-label') || button.textContent;
        if (!email) return;

        try {
          await navigator.clipboard.writeText(email);
          button.textContent = 'Email Copied';
        } catch (error) {
          button.textContent = 'Copy Failed';
        }

        window.setTimeout(function () {
          button.textContent = original;
        }, 1600);
      });
    });
  }

  function installTopButton() {
    if (document.querySelector('.top-fab')) return;

    var button = document.createElement('button');
    button.className = 'top-fab';
    button.type = 'button';
    button.textContent = 'Top';
    document.body.appendChild(button);

    function syncVisibility() {
      if (window.scrollY > 520) button.classList.add('is-visible');
      else button.classList.remove('is-visible');
    }

    button.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    syncVisibility();
    window.addEventListener('scroll', syncVisibility, { passive: true });
  }

  document.addEventListener('DOMContentLoaded', function () {
    applyTheme();
    bindCopyButtons();
    installTopButton();
  });
})();
