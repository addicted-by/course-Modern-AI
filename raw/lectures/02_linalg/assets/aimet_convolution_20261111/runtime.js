(() => {
  "use strict";

  const snControls = document.querySelector(".sn-plot-controls");
  if (snControls) {
    const buttons = [...snControls.querySelectorAll("button")];
    snControls.hidden = false;
    for (const button of buttons) {
      button.addEventListener("click", () => {
        for (const choice of buttons) {
          const selected = choice === button;
          choice.setAttribute("aria-pressed", String(selected));
          document.getElementById(choice.getAttribute("aria-controls")).hidden = !selected;
        }
      });
    }
  }

  const tomography = document.querySelector(".app-tomography-frame video");
  tomography?.addEventListener("error", () => { tomography.hidden = true; });

  const load = document.querySelector(".app-ultrasound-load");
  if (!load) return;

  const params = new URLSearchParams(location.search);
  if (params.has("print-pdf") || params.get("view") === "print") return;

  const slide = load.closest("section");
  const player = load.parentElement;
  const reset = slide.querySelector(".app-ultrasound-reset");
  load.hidden = false;
  load.addEventListener("click", () => {
    const iframe = document.createElement("iframe");
    iframe.title = "Ultrasound before and after SVD filtering";
    iframe.allow = "encrypted-media; picture-in-picture; fullscreen";
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    iframe.allowFullscreen = true;
    iframe.src = load.dataset.playerSrc;
    player.append(iframe);
    load.hidden = true;
    reset.hidden = false;
    iframe.focus({ preventScroll: true });
  });

  function unload() {
    player.querySelector("iframe")?.remove();
    load.hidden = false;
    reset.hidden = true;
  }

  reset.addEventListener("click", () => {
    unload();
    load.focus({ preventScroll: true });
  });

  function bindReveal() {
    Reveal.on("slidechanged", ({ previousSlide }) => {
      if (previousSlide === slide) unload();
    });
    Reveal.on("overviewshown", () => {
      unload();
      tomography?.pause();
    });
  }

  if (window.Reveal) bindReveal();
  else window.addEventListener("load", bindReveal, { once: true });
  window.addEventListener("pagehide", unload);
})();
