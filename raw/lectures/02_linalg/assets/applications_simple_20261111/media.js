(() => {
  "use strict";
  const controls = "button, select, audio, video";
  const localKeys = new Set([" ", "Enter", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"]);

  for (const result of document.querySelectorAll(".app-simple .app-simple-result")) {
    result.addEventListener("keydown", event => {
      if (localKeys.has(event.key) && event.target.closest(controls)) event.stopPropagation();
    });
  }

  function bindReveal() {
    window.Reveal?.on("slidechanged", ({ previousSlide }) => {
      for (const media of previousSlide?.querySelectorAll(".app-simple-result audio, .app-simple-result video") ?? []) {
        media.pause();
      }
    });
  }
  if (window.Reveal) bindReveal();
  else window.addEventListener("load", bindReveal, { once: true });
})();
