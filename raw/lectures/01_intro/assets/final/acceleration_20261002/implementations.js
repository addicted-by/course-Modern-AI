(() => {
  'use strict';
  const init = () => {
    const dialog = document.getElementById('speed-implementations');
    if (!dialog || dialog.dataset.initialized) return;
    dialog.dataset.initialized = 'true';
    const allPages = [...dialog.querySelectorAll('article[data-impl-method]')];
    const code = JSON.parse(document.getElementById('impl-full-code').textContent);
    const previous = dialog.querySelector('[data-impl-prev]');
    const next = dialog.querySelector('[data-impl-next]');
    const back = dialog.querySelector('[data-impl-close]');
    const copy = dialog.querySelector('[data-impl-copy]');
    let pages = [], index = 0, opener = null, keyboard = null;
    let focusFrame = null;
    const scale = () => {
      const viewport = window.visualViewport;
      const width = viewport?.width ?? window.innerWidth;
      const height = viewport?.height ?? window.innerHeight;
      dialog.style.setProperty('--impl-scale', Math.min(width / 1600, height / 900));
    };
    const focus = target => {
      if (focusFrame !== null) cancelAnimationFrame(focusFrame);
      focusFrame = requestAnimationFrame(() => {
        focusFrame = null;
        if (target?.isConnected && !target.closest('[hidden]')) target.focus({preventScroll: true});
      });
    };
    const show = () => {
      allPages.forEach(page => { page.hidden = page !== pages[index]; });
      const current = pages[index];
      dialog.dataset.currentMethod = current.dataset.implMethod;
      dialog.dataset.page = String(index);
      dialog.setAttribute('aria-labelledby', current.getAttribute('aria-labelledby'));
      document.getElementById('impl-method-name').textContent = current.querySelector('h2').textContent.split(':')[0];
      document.getElementById('impl-page-count').textContent = `${index + 1} / ${pages.length}`;
      previous.disabled = index === 0;
      next.disabled = index === pages.length - 1;
      copy.textContent = 'Copy full code';
      scale();
      focus(current.querySelector('h2'));
    };
    const move = amount => { index = Math.max(0, Math.min(pages.length - 1, index + amount)); show(); };
    const finishClose = () => {
      allPages.forEach(page => { page.hidden = true; });
      if (keyboard !== null) { window.Reveal?.configure({keyboard}); keyboard = null; }
      if (opener) opener.setAttribute('aria-expanded', 'false');
      delete dialog.dataset.currentMethod;
      delete dialog.dataset.page;
      dialog.removeAttribute('aria-labelledby');
      focus(opener);
    };
    const close = () => {
      if (!dialog.open) return;
      dialog.close();
      // Restore Reveal synchronously: the native close event arrives later.
      finishClose();
    };
    document.querySelectorAll('[data-impl-open]').forEach(button => {
      button.setAttribute('aria-haspopup', 'dialog');
      button.setAttribute('aria-controls', dialog.id);
      button.setAttribute('aria-expanded', 'false');
    });
    document.addEventListener('click', event => {
      const target = event.target instanceof Element ? event.target : null;
      const trigger = target?.closest('[data-impl-open]');
      if (!trigger) return;
      const selected = allPages.filter(page => page.dataset.implMethod === trigger.dataset.implOpen);
      if (!selected.length) return;
      event.preventDefault(); event.stopPropagation();
      pages = selected; index = 0; opener = trigger;
      keyboard = window.Reveal?.getConfig().keyboard ?? true;
      window.Reveal?.configure({keyboard: false});
      trigger.setAttribute('aria-expanded', 'true');
      dialog.showModal(); show();
    }, true);
    previous.addEventListener('click', () => move(-1));
    next.addEventListener('click', () => move(1));
    back.addEventListener('click', close);
    copy.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(code[dialog.dataset.currentMethod]);
        copy.textContent = 'Copied';
      } catch {
        copy.textContent = 'Select code to copy';
      }
    });
    document.addEventListener('keydown', event => {
      if (!dialog.open) return;
      event.stopImmediatePropagation();
      if (event.key === 'Escape') { event.preventDefault(); close(); }
      else if (['ArrowRight', 'PageDown'].includes(event.key)) { event.preventDefault(); move(1); }
      else if (['ArrowLeft', 'PageUp'].includes(event.key)) { event.preventDefault(); move(-1); }
      else if (event.key === 'Tab') {
        event.preventDefault();
        if (focusFrame !== null) { cancelAnimationFrame(focusFrame); focusFrame = null; }
        const targets = [...dialog.querySelectorAll('button:not(:disabled), a[href]')]
          .filter(element => !element.closest('[hidden]') && element.getClientRects().length);
        const current = targets.indexOf(document.activeElement);
        targets[(current + (event.shiftKey ? -1 : 1) + targets.length) % targets.length]?.focus({preventScroll: true});
      } else if (['ArrowUp', 'ArrowDown', 'Home', 'End', ' '].includes(event.key) && event.target.tagName !== 'BUTTON') {
        event.preventDefault();
      }
    }, true);
    dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
    dialog.addEventListener('close', () => {
      if (!dialog.open && dialog.dataset.currentMethod) finishClose();
    });
    window.Reveal?.on('slidechanged', () => { if (dialog.open) close(); });
    window.addEventListener('resize', scale, {passive: true});
    window.visualViewport?.addEventListener('resize', scale, {passive: true});
    scale();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once: true});
  else init();
})();
