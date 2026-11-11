(() => {
  "use strict";

  const player = document.querySelector("#app-d08 .a18s-playback");
  if (!player) return;

  const source = player.querySelector("select");
  const audio = player.querySelector("audio");

  source.addEventListener("change", () => {
    audio.pause();
    audio.src = source.value;
    audio.setAttribute("aria-label", `${source.selectedOptions[0].textContent} recording`);
  });

  player.addEventListener("keydown", (event) => {
    if (event.target === source || event.target === audio) event.stopPropagation();
  });
})();
