/**
 * ==========================================================================
 * Slide Scaler Engine for Quarto Reveal.js Presentations
 * Automatic scale-to-fit, interactive zoom controls, keyboard shortcuts,
 * and overflow handling.
 * ==========================================================================
 */

(function () {
  'use strict';

  // Configuration
  const MIN_SCALE = 0.50;
  const MAX_SCALE = 1.50;
  const SCALE_STEP = 0.05;
  const STORAGE_KEY_AUTOFIT = 'quarto_scaler_autofit';
  const STORAGE_KEY_SCALE = 'quarto_scaler_scale';

  // State
  let autoFitEnabled = true;
  let manualScale = 1.0;
  let activeSlideScale = 1.0;
  const supportsZoom = 'zoom' in document.documentElement.style;

  // Restore state from sessionStorage if available
  try {
    const savedAutoFit = sessionStorage.getItem(STORAGE_KEY_AUTOFIT);
    if (savedAutoFit !== null) {
      autoFitEnabled = savedAutoFit === 'true';
    }
    const savedScale = sessionStorage.getItem(STORAGE_KEY_SCALE);
    if (savedScale !== null) {
      manualScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, parseFloat(savedScale) || 1.0));
    }
  } catch (e) {}

  /**
   * Get nominal slide height configured in Reveal.js (typically 900 or 800)
   */
  function getSlideNominalHeight() {
    if (window.Reveal && typeof window.Reveal.getConfig === 'function') {
      const config = window.Reveal.getConfig();
      if (config && config.height) {
        return config.height;
      }
    }
    return 900;
  }

  /**
   * Apply scale to a slide element
   */
  function applyScaleToSlide(slide, scale, nominalHeight) {
    if (!slide) return;

    scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, Math.round(scale * 100) / 100));
    activeSlideScale = scale;

    if (supportsZoom) {
      slide.style.zoom = scale === 1.0 ? '' : scale;
      slide.style.maxHeight = scale === 1.0 ? '' : `calc(${nominalHeight}px / ${scale})`;
    } else {
      if (scale === 1.0) {
        slide.style.transform = '';
        slide.style.transformOrigin = '';
        slide.style.width = '';
        slide.style.maxHeight = '';
      } else {
        slide.style.transform = `scale(${scale})`;
        slide.style.transformOrigin = 'top center';
        slide.style.width = `${(100 / scale).toFixed(2)}%`;
        slide.style.maxHeight = `${nominalHeight}px`;
      }
    }

    // Handle overflow & scrollable fallback
    const effectiveHeight = slide.scrollHeight * (supportsZoom ? scale : scale);
    if (effectiveHeight > nominalHeight - 10) {
      slide.classList.add('slide-scrollable');
      slide.classList.add('has-overflow');
    } else {
      slide.classList.remove('slide-scrollable');
      slide.classList.remove('has-overflow');
    }

    updateUI();
  }

  /**
   * Reset scale on a slide element
   */
  function resetSlideScale(slide) {
    if (!slide) return;
    slide.style.zoom = '';
    slide.style.transform = '';
    slide.style.transformOrigin = '';
    slide.style.width = '';
    slide.style.maxHeight = '';
    slide.classList.remove('slide-scrollable');
    slide.classList.remove('has-overflow');
  }

  /**
   * Compute auto-fit scale for the current slide
   */
  function computeAutoFitScale(slide, nominalHeight) {
    const prevZoom = slide.style.zoom;
    const prevTransform = slide.style.transform;
    const prevMaxH = slide.style.maxHeight;
    slide.style.zoom = '';
    slide.style.transform = '';
    slide.style.maxHeight = '';

    const contentHeight = slide.scrollHeight;

    slide.style.zoom = prevZoom;
    slide.style.transform = prevTransform;
    slide.style.maxHeight = prevMaxH;

    // Only scale down if content actually exceeds nominal height
    if (contentHeight > nominalHeight) {
      const availableHeight = nominalHeight - 32;
      const computed = availableHeight / contentHeight;
      return Math.max(MIN_SCALE, Math.min(1.0, Math.floor(computed * 100) / 100));
    }
    return 1.0;
  }

  /**
   * Update scale on active slide
   */
  function updateActiveSlideScale() {
    const presentSlide = document.querySelector('.reveal .slides section.present');
    if (!presentSlide) return;

    const nominalHeight = getSlideNominalHeight();

    if (autoFitEnabled) {
      const fitScale = computeAutoFitScale(presentSlide, nominalHeight);
      applyScaleToSlide(presentSlide, fitScale, nominalHeight);
    } else {
      applyScaleToSlide(presentSlide, manualScale, nominalHeight);
    }
  }

  /**
   * Set manual scale
   */
  function setScale(newScale) {
    manualScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, Math.round(newScale * 100) / 100));
    autoFitEnabled = false;

    try {
      sessionStorage.setItem(STORAGE_KEY_AUTOFIT, 'false');
      sessionStorage.setItem(STORAGE_KEY_SCALE, manualScale.toString());
    } catch (e) {}

    const presentSlide = document.querySelector('.reveal .slides section.present');
    const nominalHeight = getSlideNominalHeight();
    applyScaleToSlide(presentSlide, manualScale, nominalHeight);
  }

  /**
   * Toggle auto-fit mode
   */
  function toggleAutoFit() {
    autoFitEnabled = !autoFitEnabled;
    try {
      sessionStorage.setItem(STORAGE_KEY_AUTOFIT, autoFitEnabled.toString());
    } catch (e) {}

    updateActiveSlideScale();
  }

  /**
   * Reset scale to 100%
   */
  function resetScale() {
    autoFitEnabled = false;
    manualScale = 1.0;
    try {
      sessionStorage.setItem(STORAGE_KEY_AUTOFIT, 'false');
      sessionStorage.setItem(STORAGE_KEY_SCALE, '1.0');
    } catch (e) {}

    const presentSlide = document.querySelector('.reveal .slides section.present');
    const nominalHeight = getSlideNominalHeight();
    applyScaleToSlide(presentSlide, 1.0, nominalHeight);
  }

  /**
   * Build floating UI widget
   */
  let uiPill = null;
  let valBtn = null;
  let fitBtn = null;

  function createUI() {
    if (document.getElementById('slide-scaler-ui')) return;

    uiPill = document.createElement('div');
    uiPill.id = 'slide-scaler-ui';
    uiPill.className = 'slide-scaler-pill';
    uiPill.setAttribute('role', 'toolbar');
    uiPill.setAttribute('aria-label', 'Slide Scaling Controls');

    // Minus button
    const minusBtn = document.createElement('button');
    minusBtn.className = 'scaler-btn scaler-minus';
    minusBtn.innerHTML = '−';
    minusBtn.title = 'Zoom Out (− / [)';
    minusBtn.setAttribute('aria-label', 'Zoom Out');
    minusBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      setScale((autoFitEnabled ? activeSlideScale : manualScale) - SCALE_STEP);
    });

    // Value button (click to reset or cycle)
    valBtn = document.createElement('button');
    valBtn.className = 'scaler-btn scaler-value';
    valBtn.title = 'Scale percentage. Click to reset to 100% (0)';
    valBtn.setAttribute('aria-label', 'Scale percentage');
    valBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (activeSlideScale !== 1.0) {
        resetScale();
      } else {
        setScale(0.85);
      }
    });

    // Plus button
    const plusBtn = document.createElement('button');
    plusBtn.className = 'scaler-btn scaler-plus';
    plusBtn.innerHTML = '+';
    plusBtn.title = 'Zoom In (+ / ])';
    plusBtn.setAttribute('aria-label', 'Zoom In');
    plusBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      setScale((autoFitEnabled ? activeSlideScale : manualScale) + SCALE_STEP);
    });

    // Divider
    const sep = document.createElement('span');
    sep.className = 'scaler-sep';
    sep.setAttribute('aria-hidden', 'true');

    // Auto-Fit button
    fitBtn = document.createElement('button');
    fitBtn.className = 'scaler-btn scaler-fit' + (autoFitEnabled ? ' active' : '');
    fitBtn.innerHTML = 'Fit';
    fitBtn.title = 'Toggle Auto-Fit to slide height (F)';
    fitBtn.setAttribute('aria-label', 'Toggle Auto-Fit');
    fitBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleAutoFit();
    });

    uiPill.appendChild(minusBtn);
    uiPill.appendChild(valBtn);
    uiPill.appendChild(plusBtn);
    uiPill.appendChild(sep);
    uiPill.appendChild(fitBtn);

    document.body.appendChild(uiPill);
    updateUI();
  }

  /**
   * Update UI labels and active states
   */
  function updateUI() {
    if (!valBtn || !fitBtn) return;
    const pct = Math.round(activeSlideScale * 100);
    valBtn.textContent = `${pct}%`;

    if (autoFitEnabled) {
      fitBtn.classList.add('active');
    } else {
      fitBtn.classList.remove('active');
    }
  }

  /**
   * Keyboard shortcuts
   */
  function handleKeyDown(e) {
    const tag = e.target ? e.target.tagName : '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target && e.target.isContentEditable)) {
      return;
    }

    if (e.key === '-' || e.key === '_' || e.key === '[') {
      setScale((autoFitEnabled ? activeSlideScale : manualScale) - SCALE_STEP);
    } else if (e.key === '=' || e.key === '+' || e.key === ']') {
      setScale((autoFitEnabled ? activeSlideScale : manualScale) + SCALE_STEP);
    } else if (e.key === '0') {
      resetScale();
    } else if (e.key === 'f' || e.key === 'F') {
      toggleAutoFit();
    }
  }

  /**
   * Mouse wheel zooming with Alt or Ctrl key
   */
  function handleWheel(e) {
    if (e.altKey || (e.ctrlKey && !e.metaKey)) {
      e.preventDefault();
      if (e.deltaY > 0) {
        setScale((autoFitEnabled ? activeSlideScale : manualScale) - SCALE_STEP);
      } else if (e.deltaY < 0) {
        setScale((autoFitEnabled ? activeSlideScale : manualScale) + SCALE_STEP);
      }
    }
  }

  /**
   * Initialize slide scaler engine
   */
  function init() {
    createUI();

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('wheel', handleWheel, { passive: false });

    if (window.Reveal) {
      window.Reveal.on('slidechanged', (event) => {
        if (event && event.previousSlide) {
          resetSlideScale(event.previousSlide);
        }
        updateActiveSlideScale();
        setTimeout(updateActiveSlideScale, 150);
      });

      window.Reveal.on('ready', () => {
        updateActiveSlideScale();
        setTimeout(updateActiveSlideScale, 300);
      });
    }

    let resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(updateActiveSlideScale, 150);
    });

    updateActiveSlideScale();
    setTimeout(updateActiveSlideScale, 200);
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
})();
