(() => {
  'use strict';

  const initialize = () => {
    const dialog = document.getElementById('data-architecture-dialog');
    if (!dialog || dialog.dataset.initialized) return;
    dialog.dataset.initialized = 'true';
    // Keep the native modal outside Reveal's scaled and aria-hidden slides.
    document.body.append(dialog);
    const pages = [...dialog.querySelectorAll('[data-architecture-card]')];
    const triggers = [...document.querySelectorAll('[data-architecture-open]')];
    const closeButton = dialog.querySelector('[data-architecture-close]');
    let opener = null;
    let savedConfig = null;

    const restore = () => {
      if (savedConfig) window.Reveal?.configure(savedConfig);
      savedConfig = null;
      triggers.forEach(button => button.setAttribute('aria-expanded', 'false'));
      opener?.focus({preventScroll: true});
      opener = null;
    };
    const close = () => {
      if (dialog.open) dialog.close();
    };

    for (const button of triggers) {
      button.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        const card = pages.find(page => page.dataset.architectureCard === button.dataset.architectureOpen);
        if (!card || dialog.open) return;
        opener = button;
        const config = window.Reveal?.getConfig();
        if (config) {
          savedConfig = {keyboard: config.keyboard, touch: config.touch};
          window.Reveal.configure({keyboard: false, touch: false});
        }
        pages.forEach(page => { page.hidden = page !== card; });
        dialog.setAttribute('aria-labelledby', card.querySelector('h2').id);
        button.setAttribute('aria-expanded', 'true');
        dialog.showModal();
        dialog.scrollTop = 0;
        closeButton.focus({preventScroll: true});
      });
    }
    closeButton.addEventListener('click', close);
    dialog.addEventListener('close', restore);
    dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close();
    });
    document.addEventListener('keydown', event => {
      const trigger = event.target.closest?.('[data-architecture-open]');
      if (!dialog.open && triggers.includes(trigger) && (event.key === ' ' || event.key === 'Enter')) {
        // Reveal handles Space before the native button's keyup activation.
        event.preventDefault();
        event.stopImmediatePropagation();
        if (!event.repeat) trigger.click();
        return;
      }
      if (!dialog.open) return;
      // Do not let Reveal, its menu, or speaker shortcuts consume modal keys.
      event.stopImmediatePropagation();
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
      } else if (event.key === 'Tab') {
        const focusable = [...dialog.querySelectorAll('button, a[href]')]
          .filter(element => !element.closest('[hidden]') && element.getClientRects().length);
        const index = focusable.indexOf(document.activeElement);
        const next = (index + (event.shiftKey ? -1 : 1) + focusable.length) % focusable.length;
        event.preventDefault();
        focusable[next]?.focus();
      }
    }, true);
    window.addEventListener('beforeprint', close);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, {once: true});
  else initialize();
})();
