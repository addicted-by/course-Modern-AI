/* Executed before the main Reveal.initialize(): details never enter its route. */
(() => {
  "use strict";

  const mainElement = document.querySelector(".reveal");
  const sourceSlides = Array.from(mainElement?.querySelectorAll(".slides > section.arch-detail-source") || []);
  if (!sourceSlides.length || window.ArchDetails) return;

  const labels = {
    quantization: "Quantization",
    "token-selection": "Token selection",
    "latent-compression": "Latent compression",
    sharing: "Sharing",
  };
  const groups = new Map();
  const library = document.createElement("div");
  library.id = "arch-details-library";
  library.hidden = true;
  library.setAttribute("aria-hidden", "true");
  for (const slide of sourceSlides) {
    const group = slide.dataset.detailGroup;
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push(slide);
    library.append(slide);
  }
  document.body.append(library);

  const dialog = document.createElement("dialog");
  dialog.id = "arch-details-dialog";
  dialog.className = "arch-details-dialog";
  dialog.setAttribute("aria-labelledby", "arch-details-title");
  dialog.innerHTML = `
    <header class="arch-details-toolbar">
      <button type="button" class="arch-details-back" autofocus aria-label="Back to KV cache overview">
        <span aria-hidden="true">←</span> Back to KV cache
      </button>
      <h2 id="arch-details-title"></h2>
      <span class="arch-details-hint">← → to explore · Esc to return</span>
      <output class="arch-details-count" aria-label="Detail page" aria-live="polite"></output>
    </header>
    <div class="reveal arch-details-reveal"><div class="slides"></div></div>`;
  document.body.append(dialog);

  const wrapper = dialog.querySelector(".arch-details-reveal");
  const slidesElement = wrapper.querySelector(".slides");
  const title = dialog.querySelector("#arch-details-title");
  const counter = dialog.querySelector(".arch-details-count");
  const backButton = dialog.querySelector(".arch-details-back");
  let detailDeck = null;
  let initialization = null;
  let currentGroup = null;
  let returnFocus = null;
  let mainConfig = null;
  let openRun = 0;

  function updateCounter() {
    const number = detailDeck ? detailDeck.getIndices().h + 1 : 1;
    counter.textContent = `${number} / ${groups.get(currentGroup)?.length || 0}`;
  }

  function restoreMain() {
    openRun += 1;
    if (detailDeck?.isReady()) detailDeck.configure({ keyboard: false, touch: false });
    if (mainConfig) {
      const config = mainConfig;
      mainConfig = null;
      window.Reveal.configure(config);
    }
    if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
    returnFocus = null;
  }

  function close() {
    if (!dialog.open && !mainConfig) return;
    if (dialog.open) dialog.close();
    restoreMain();
  }

  async function open(group, trigger) {
    if (!groups.has(group) || !window.Reveal.isReady()) return false;
    const run = ++openRun;
    if (!dialog.open) {
      const config = window.Reveal.getConfig();
      mainConfig = { keyboard: config.keyboard, touch: config.touch };
      returnFocus = trigger || document.activeElement;
      window.Reveal.configure({ keyboard: false, touch: false });
    }
    for (const slide of Array.from(slidesElement.children)) library.append(slide);
    currentGroup = group;
    for (const slide of groups.get(group)) {
      slide.querySelectorAll(".fragment").forEach((fragment) => {
        fragment.classList.remove("visible", "current-fragment");
      });
      slidesElement.append(slide);
    }
    title.textContent = labels[group] || group;
    counter.textContent = `1 / ${groups.get(group).length}`;
    if (!dialog.open) dialog.showModal();

    if (!detailDeck) {
      const main = window.Reveal.getConfig();
      detailDeck = new window.Reveal(wrapper, {
        width: main.width || 1600,
        height: main.height || 900,
        margin: 0,
        minScale: 0.1,
        maxScale: 1,
        embedded: true,
        center: false,
        hash: false,
        history: false,
        respondToHashChanges: false,
        fragmentInURL: false,
        keyboard: true,
        keyboardCondition: () => dialog.open,
        touch: true,
        controls: true,
        controlsLayout: "edges",
        controlsTutorial: false,
        controlsBackArrows: "faded",
        progress: false,
        slideNumber: false,
        overview: false,
        jumpToSlide: false,
        help: false,
        pause: false,
        transition: "none",
        backgroundTransition: "none",
        postMessage: false,
        postMessageEvents: false,
        focusBodyOnPageVisibilityChange: false,
        plugins: [],
        dependencies: [],
      });
      detailDeck.on("slidechanged", updateCounter);
      initialization = detailDeck.initialize();
    }
    try {
      await initialization;
      if (run !== openRun || !dialog.open) return false;
      detailDeck.configure({ keyboard: true, touch: true });
      detailDeck.sync();
      // Reveal reads the page hash even for embedded decks; always reset here.
      detailDeck.slide(0, 0, -1);
      detailDeck.layout();
      updateCounter();
      backButton.focus({ preventScroll: true });
      return true;
    } catch (error) {
      close();
      throw error;
    }
  }

  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("button[data-arch-detail]");
    if (!trigger || !mainElement.contains(trigger)) return;
    event.preventDefault();
    open(trigger.dataset.archDetail, trigger).catch((error) => console.error("Architecture details:", error));
  });
  backButton.addEventListener("click", close);
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    close();
  });
  dialog.addEventListener("close", () => {
    // close() restores synchronously; also support native/programmatic close().
    if (!dialog.open && mainConfig) restoreMain();
  });
  dialog.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      close();
      return;
    }
    const activatesControl = [" ", "Enter"].includes(event.key) && event.target.closest("button, a");
    const navigation = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " ", "n", "N", "p", "P", "h", "H", "j", "J", "k", "K", "l", "L"].includes(event.key);
    // Keep native focus/activation, but contain global menu and scaler shortcuts.
    if (activatesControl || !navigation) event.stopPropagation();
  });
  window.addEventListener("resize", () => {
    if (dialog.open && detailDeck?.isReady()) detailDeck.layout();
  });

  window.ArchDetails = Object.freeze({
    open,
    close,
    get deck() { return detailDeck; },
    get currentGroup() { return currentGroup; },
    get isOpen() { return dialog.open; },
    get groups() { return Array.from(groups.keys()); },
  });
})();
