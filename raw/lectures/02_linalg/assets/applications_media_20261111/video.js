(() => {
  "use strict";
  const params = new URLSearchParams(window.location.search);
  if (params.has("print-pdf") || params.get("view") === "print") return;

  const links = document.querySelectorAll(".reveal .app-video-link");
  const dialog = document.createElement("dialog");
  if (!links.length || typeof dialog.showModal !== "function") return;

  dialog.id = "app-video-dialog";
  dialog.className = "app-video-dialog";
  dialog.setAttribute("aria-labelledby", "app-video-title");
  dialog.setAttribute("aria-describedby", "app-video-caption");
  dialog.innerHTML = `
    <header>
      <h2 id="app-video-title"></h2>
      <button type="button" autofocus>Close video</button>
    </header>
    <div class="app-video-player"></div>
    <p class="app-video-status" role="status"></p>
    <p class="app-video-caption" id="app-video-caption"></p>
    <div class="app-video-links">
      <a class="app-video-direct" target="_blank" rel="noopener noreferrer">Open video in a new tab</a>
    </div>`;
  document.body.append(dialog);

  const close = dialog.querySelector("button");
  const title = dialog.querySelector("h2");
  const player = dialog.querySelector(".app-video-player");
  const status = dialog.querySelector(".app-video-status");
  const caption = dialog.querySelector(".app-video-caption");
  const direct = dialog.querySelector(".app-video-direct");
  let opener = null;

  function unload() {
    const video = player.querySelector("video");
    if (video) {
      video.pause();
      video.removeAttribute("src");
      video.load();
    }
    player.replaceChildren();
  }

  function dismiss() {
    if (!dialog.open) return;
    unload();
    dialog.close();
  }

  links.forEach(link => {
    link.setAttribute("aria-haspopup", "dialog");
    link.setAttribute("aria-controls", dialog.id);
    link.addEventListener("click", event => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || dialog.open) return;

      event.preventDefault();
      const clip = link.closest(".app-video");
      const source = clip.querySelector(".app-video-source").cloneNode(true);
      dialog.querySelector(".app-video-source")?.remove();
      direct.after(source);
      direct.href = link.href;
      const sourceRange = link.dataset.videoSourceRange;
      direct.textContent = sourceRange ? `Open video at source · ${sourceRange}` : "Open video in a new tab";
      dialog.classList.toggle("app-video-source-card", Boolean(sourceRange));
      title.textContent = link.dataset.videoTitle;
      caption.textContent = clip.querySelector(".app-video-description").textContent;
      status.textContent = "";
      opener = link;
      dialog.showModal();
      dialog.scrollTop = 0;
      close.focus({ preventScroll: true });
      if (sourceRange) return;

      const media = document.createElement("video");
      media.controls = true;
      media.playsInline = true;
      media.preload = "metadata";
      media.setAttribute("aria-label", title.textContent);
      media.addEventListener("error", () => {
        if (!media.isConnected) return;
        status.textContent = "The video could not load here. Use the direct link below.";
      });
      player.replaceChildren(media);
      media.src = link.href;
    });
  });

  close.addEventListener("click", dismiss);
  dialog.addEventListener("cancel", event => {
    event.preventDefault();
    dismiss();
  });
  dialog.addEventListener("close", () => {
    if (dialog.open) return;
    unload();
    const link = opener;
    opener = null;
    if (link?.isConnected && link.closest("section") === window.Reveal?.getCurrentSlide()) {
      link.focus({ preventScroll: true });
    }
  });

  // Keep keyboard and touch input for the native video controls inside the modal.
  for (const type of ["keydown", "keypress", "keyup", "touchstart", "touchmove", "touchend"]) {
    dialog.addEventListener(type, event => event.stopPropagation());
  }
  window.addEventListener("pagehide", dismiss);
  function bindReveal() {
    window.Reveal?.on("slidechanged", dismiss);
    window.Reveal?.on("overviewshown", dismiss);
  }
  if (window.Reveal) bindReveal();
  else window.addEventListener("load", bindReveal, { once: true });
})();
