/* Preserve TRAIN-16 as an additional handout page without changing live navigation. */
(() => {
  if (!new URLSearchParams(location.search).has('print-pdf')) return;
  document.addEventListener('DOMContentLoaded', () => {
    const original = document.getElementById('brief-train-15');
    if (!original || document.getElementById('brief-train-16-print')) return;
    const audioPage = original.cloneNode(true);
    audioPage.id = 'brief-train-16-print';
    audioPage.classList.remove('past', 'present', 'future');
    audioPage.classList.add('bt-print-audio');
    audioPage.querySelector('h2').textContent = 'Audio preferences use the same feedback logic';
    audioPage.querySelector('.fv-id').textContent = 'T16 · audio';
    audioPage.querySelector('.bt-visual-mode')?.remove();
    audioPage.querySelector('.notes')?.remove();
    audioPage.querySelector('script')?.remove();
    audioPage.querySelectorAll('.bt-route .fade-out').forEach(el => el.remove());
    audioPage.querySelectorAll('audio').forEach(el => {
      const label = document.createElement('small');
      label.textContent = 'Playback available in the HTML deck';
      label.className = 'bt-small';
      el.replaceWith(label);
    });
    audioPage.querySelectorAll('.fragment').forEach(el => {
      el.classList.remove('fragment', 'fade-out', 'visible', 'current-fragment');
      el.removeAttribute('data-fragment-index');
    });
    audioPage.querySelector('.fv-takeaway').textContent = 'Listening preferences are training signals; words, voice and listener preference remain separate criteria.';
    audioPage.querySelector('.fv-source').innerHTML = '<a href="https://arxiv.org/html/2509.17765v1">Qwen3-Omni §4.2</a> · <a href="https://deepmind.google/models/model-cards/lyria-3-5/">Lyria 3.5 model card</a> · Course system-TTS examples; transcript included';
    original.after(audioPage);
    original.querySelector('.bt-audio-mode')?.remove();
    original.querySelectorAll('.bt-route small.fragment:not(.fade-out)').forEach(el => el.remove());
    original.querySelectorAll('.fade-out').forEach(el => el.classList.remove('fragment', 'fade-out', 'visible', 'current-fragment'));
    window.Reveal?.sync();
  }, {once: true});
})();
