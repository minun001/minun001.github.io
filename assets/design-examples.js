(function () {
  'use strict';
  var notes = {
    editorial: 'Bright, spacious, and readable. The published design.',
    atlas: 'An immersive mobility image with a high-contrast introduction.',
    ledger: 'A compact, text-first research index with restrained decoration.'
  };
  var choices = document.querySelectorAll('[data-design-choice]');
  var note = document.querySelector('[data-design-note]');

  function selectDesign(value) {
    var design = Object.prototype.hasOwnProperty.call(notes, value) ? value : 'editorial';
    document.body.dataset.design = design;
    choices.forEach(function (choice) {
      if (choice.dataset.designChoice === design) choice.setAttribute('aria-current', 'true');
      else choice.removeAttribute('aria-current');
    });
    note.textContent = notes[design];
  }

  selectDesign(new URLSearchParams(window.location.search).get('design'));
  choices.forEach(function (choice) {
    choice.addEventListener('click', function (event) {
      event.preventDefault();
      var url = new URL(window.location.href);
      url.searchParams.set('design', choice.dataset.designChoice);
      window.history.replaceState(null, '', url);
      selectDesign(choice.dataset.designChoice);
    });
  });
}());
