(() => {
  'use strict';

  const initialize = () => {
    const dialog = document.getElementById('vlm-details');
    if (!dialog || dialog.dataset.vlmInitialized === 'true') return;
    dialog.dataset.vlmInitialized = 'true';

    const canvas = dialog.querySelector('.vlm-detail-canvas');
    const pages = new Map(Array.from(dialog.querySelectorAll('[data-vlm-page]'))
      .map(page => [page.dataset.vlmPage, page]));
    const backButton = dialog.querySelector('[data-vlm-back]');
    const breadcrumb = document.getElementById('vlm-breadcrumb');
    const names = {
      flamingo: 'Flamingo', resampler: 'Perceiver Resampler',
      'gated-cross-attention': 'Gated cross-attention', 'cross-attention': 'Cross-attention',
      blip2: 'BLIP-2', qformer: 'Q-Former', 'attention-masks': 'Attention masks',
      'visual-prefix': 'Visual prefix', llava: 'LLaVA', projector: 'Projector'
    };
    const navigationKeys = new Set([
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'PageUp', 'PageDown', 'Home', 'End', ' ', 'Spacebar'
    ]);

    let trail = [];
    let overviewTrigger = null;
    let keyboardSnapshot = null;
    let boundReveal = null;
    let focusFrame = null;

    const scaleCanvas = () => {
      const viewport = window.visualViewport;
      const width = viewport ? viewport.width : window.innerWidth;
      const height = viewport ? viewport.height : window.innerHeight;
      dialog.style.setProperty('--vlm-scale', String(Math.min(width / 1600, height / 900)));
    };

    const updateTriggers = () => {
      const openPages = new Set(trail.map(item => item.key));
      document.querySelectorAll('[data-vlm-open]').forEach(trigger => {
        trigger.setAttribute('aria-haspopup', 'dialog');
        trigger.setAttribute('aria-controls', dialog.id);
        trigger.setAttribute('aria-expanded', String(openPages.has(trigger.dataset.vlmOpen)));
      });
    };

    const focusSoon = element => {
      if (focusFrame !== null) window.cancelAnimationFrame(focusFrame);
      focusFrame = window.requestAnimationFrame(() => {
        focusFrame = null;
        if (element && element.isConnected && !element.closest('[hidden]')) {
          element.focus({ preventScroll: true });
        }
      });
    };

    const moveFocusWithinDialog = backwards => {
      // A native dialog may put the browser chrome into its Tab cycle. Keep the
      // cycle explicit so keyboard navigation never leaves this presentation.
      // A user's Tab also supersedes a pending page-heading focus request.
      if (focusFrame !== null) {
        window.cancelAnimationFrame(focusFrame);
        focusFrame = null;
      }
      const candidates = Array.from(dialog.querySelectorAll(
        'button, a[href], input, select, textarea, summary, [tabindex], [contenteditable="true"]'
      )).filter(element => {
        if (element.tabIndex < 0 || element.matches(':disabled') || element.closest('[hidden], [inert]')) return false;
        const style = window.getComputedStyle(element);
        return element.getClientRects().length > 0 && style.visibility !== 'hidden' && style.visibility !== 'collapse';
      });
      if (!candidates.length) {
        dialog.setAttribute('tabindex', '-1');
        dialog.focus({ preventScroll: true });
        return;
      }
      const current = candidates.indexOf(document.activeElement);
      const next = current === -1
        ? (backwards ? candidates.length - 1 : 0)
        : (current + (backwards ? -1 : 1) + candidates.length) % candidates.length;
      candidates[next].focus({ preventScroll: true });
    };

    const restoreRevealKeyboard = () => {
      if (!keyboardSnapshot) return;
      keyboardSnapshot.reveal.configure({ keyboard: keyboardSnapshot.keyboard });
      keyboardSnapshot = null;
    };

    const finishClose = (restoreFocus = true) => {
      const target = overviewTrigger;
      overviewTrigger = null;
      trail = [];
      pages.forEach(page => { page.hidden = true; });
      delete dialog.dataset.vlmCurrent;
      dialog.removeAttribute('aria-labelledby');
      restoreRevealKeyboard();
      updateTriggers();
      if (focusFrame !== null) {
        window.cancelAnimationFrame(focusFrame);
        focusFrame = null;
      }
      if (restoreFocus && target) focusSoon(target);
    };

    const closeDetails = (restoreFocus = true) => {
      if (dialog.open) dialog.close();
      finishClose(restoreFocus);
    };

    const bindReveal = () => {
      const reveal = window.Reveal;
      if (!reveal || typeof reveal.configure !== 'function') return null;
      if (boundReveal !== reveal && typeof reveal.on === 'function') {
        reveal.on('slidechanged', () => {
          // An external navigation request should not leave a detail over a new slide.
          if (dialog.open) closeDetails(false);
        });
        boundReveal = reveal;
      }
      return reveal;
    };

    const showCurrentPage = returnTarget => {
      const current = trail[trail.length - 1];
      if (!current) return;
      const page = pages.get(current.key);
      pages.forEach(candidate => { candidate.hidden = candidate !== page; });
      dialog.dataset.vlmCurrent = current.key;
      // The included pages are outside Quarto's markdown math pass. Render with
      // the deck's local KaTeX only when opening a page, with readable fallbacks.
      if (window.katex) page.querySelectorAll('[data-vlm-math]:not([data-vlm-rendered])').forEach(element => {
        window.katex.render(element.dataset.vlmMath, element, { throwOnError: false, output: 'htmlAndMathml' });
        element.dataset.vlmRendered = 'true';
      });

      if (backButton) {
        // On the first detail, Back has the same destination as Close.
        backButton.setAttribute('aria-label', trail.length > 1
          ? `Вернуться: ${names[trail[trail.length - 2].key] || trail[trail.length - 2].key}`
          : 'Вернуться к обзорному слайду');
      }
      if (breadcrumb) breadcrumb.textContent = trail.map(item => names[item.key] || item.key).join(' › ');

      const labelledBy = page.getAttribute('aria-labelledby');
      const heading = labelledBy ? document.getElementById(labelledBy) : page.querySelector('h1, h2, h3');
      if (heading) {
        heading.setAttribute('tabindex', '-1');
        if (heading.id) dialog.setAttribute('aria-labelledby', heading.id);
      }
      page.scrollTop = 0;
      if (canvas) canvas.scrollTop = 0;
      updateTriggers();
      scaleCanvas();
      focusSoon(returnTarget || heading || backButton);
    };

    const openDetails = (key, trigger) => {
      if (!pages.has(key)) return;
      if (!dialog.open) {
        overviewTrigger = trigger;
        trail = [];
        const reveal = bindReveal();
        if (reveal && typeof reveal.getConfig === 'function') {
          keyboardSnapshot = { reveal, keyboard: reveal.getConfig().keyboard };
          reveal.configure({ keyboard: false });
        }
        dialog.showModal();
      }

      if (trail.length && trail[trail.length - 1].key === key) return;
      trail.push({ key, trigger });
      showCurrentPage();
    };

    const goBack = () => {
      if (trail.length <= 1) {
        closeDetails();
        return;
      }
      const previous = trail.pop();
      showCurrentPage(previous.trigger);
    };

    // Capture before Reveal can interpret a click as navigation; native button
    // activation from Enter and Space still produces the same click event.
    document.addEventListener('click', event => {
      const element = event.target instanceof Element ? event.target : null;
      if (!element) return;
      const opener = element.closest('[data-vlm-open]');
      if (opener && pages.has(opener.dataset.vlmOpen)) {
        event.preventDefault();
        event.stopPropagation();
        openDetails(opener.dataset.vlmOpen, opener);
        return;
      }
      if (!dialog.open || !dialog.contains(element)) return;
      if (element.closest('[data-vlm-back]')) {
        event.preventDefault();
        event.stopPropagation();
        goBack();
      } else if (element.closest('[data-vlm-close]')) {
        event.preventDefault();
        event.stopPropagation();
        closeDetails();
      }
    }, true);

    document.addEventListener('keydown', event => {
      if (!dialog.open) return;
      // Keep every keystroke inside the modal. Prevent navigation defaults while
      // preserving Tab focus movement, Enter activation, and Space on buttons.
      if (event.key === 'Tab') {
        event.preventDefault();
        moveFocusWithinDialog(event.shiftKey);
      }
      event.stopImmediatePropagation();
      if (event.key === 'Escape') {
        event.preventDefault();
        goBack();
        return;
      }
      const target = event.target instanceof Element ? event.target : null;
      const spaceOnButton = (event.key === ' ' || event.key === 'Spacebar')
        && target && target.closest('button, input[type="button"], input[type="submit"]');
      if (navigationKeys.has(event.key) && !spaceOnButton
        && !event.ctrlKey && !event.metaKey && !event.altKey) event.preventDefault();
    }, true);

    // Escape normally emits cancel on a native dialog. This fallback also
    // covers platform dismissal without bypassing the nested Back behavior.
    dialog.addEventListener('cancel', event => {
      event.preventDefault();
      goBack();
    });
    dialog.addEventListener('close', () => {
      // closeDetails already cleans up synchronously; also support external close().
      if (!dialog.open && trail.length) finishClose();
    });
    window.addEventListener('resize', scaleCanvas, { passive: true });
    if (window.visualViewport) window.visualViewport.addEventListener('resize', scaleCanvas, { passive: true });

    pages.forEach(page => { page.hidden = true; });
    updateTriggers();
    scaleCanvas();
    bindReveal();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
  else initialize();
})();
