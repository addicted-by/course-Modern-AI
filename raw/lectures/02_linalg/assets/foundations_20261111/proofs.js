/* This script is included after the proof sources and runs before Reveal.initialize. */
(() => {
  "use strict";
  const params = new URLSearchParams(window.location.search);
  if (params.has("print-pdf") || params.get("view") === "print") return;

  const sources = [...document.querySelectorAll(".reveal > .slides > section.fa-proof-page")];
  if (!sources.length) return;

  const proofPages = new Map(sources.map(source => [source.id, source]));
  sources.forEach(source => source.remove());

  const dialog = document.createElement("dialog");
  dialog.id = "fa-proof-dialog";
  dialog.className = "fa-proof-dialog";
  dialog.setAttribute("aria-labelledby", "fa-proof-heading");
  dialog.innerHTML = '<div class="fa-proof-toolbar"><button type="button" autofocus>← Close derivation</button><span class="fa-proof-kicker">Optional derivation</span></div><article></article>';
  document.body.append(dialog);

  const close = dialog.querySelector("button");
  const article = dialog.querySelector("article");
  const kicker = dialog.querySelector(".fa-proof-kicker");
  let previousFocus = null;

  function returnFocus() {
    const trigger = previousFocus;
    previousFocus = null;
    if (trigger?.isConnected) trigger.focus({ preventScroll: true });
  }

  document.addEventListener("click", event => {
    const trigger = event.target.closest?.("button[data-fa-proof]");
    if (!trigger || dialog.open) return;
    const page = proofPages.get(trigger.dataset.faProof);
    if (!page) return;

    const title = page.querySelector("h2").cloneNode(true);
    title.id = "fa-proof-heading";
    article.id = page.id;
    article.replaceChildren(title, page.querySelector(".fa-proof-content").cloneNode(true));
    kicker.textContent = page.querySelector(".fa-proof-kicker").textContent;
    dialog.dataset.proof = page.id;
    previousFocus = trigger;
    dialog.showModal();
    dialog.scrollTop = 0;
    close.focus({ preventScroll: true });
  });

  close.addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", returnFocus);
  // showModal() makes the slide tree inert; keep dialog key and touch
  // events from reaching Reveal's document-level handlers.
  for (const type of ["keydown", "keypress", "keyup", "touchstart", "touchmove", "touchend"]) {
    dialog.addEventListener(type, event => event.stopPropagation());
  }
})();
