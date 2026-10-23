/* Expand only the DATA brief's replacement scenes before Reveal initializes its print view.
   Interactive navigation remains unchanged. Print pages preserve both original and added content. */
(() => {
  if (!/(?:print-pdf|view=print)/i.test(location.search)) return;
  const addPage = (slide, suffix) => {
    const clone = slide.cloneNode(true);
    clone.id = `${slide.id}-print-${suffix}`;
    clone.querySelectorAll('[id]').forEach(e => e.removeAttribute('id'));
    clone.querySelectorAll('aside.notes, script').forEach(e => e.remove());
    slide.after(clone);
    return clone;
  };
  ['frontier-f14','frontier-f18','data-safety','data-programmatic-supervision','data-still-open'].forEach(id => {
    const slide = document.getElementById(id);
    if (!slide || !slide.querySelector('.bd-extra')) return;
    const clone = addPage(slide, 'extension');
    const body = clone.querySelector('.bd-extra');
    const source = clone.querySelector('.bd-extra-source');
    [...clone.children].forEach(e => {
      if (!e.matches('h2, .fv-meta') && e !== body && e !== source) e.remove();
    });
    body.classList.remove('fragment');
    source.classList.remove('fragment');
    clone.classList.add('bd-print-continuation');
    slide.querySelector('.bd-extra').remove();
    slide.querySelector('.bd-extra-source').remove();
  });
  // The music and speech examples each contain a separate second scene.
  [['brief-data-15',5,'music-disclosure'],['brief-data-18',6,'language-quality']].forEach(([id,threshold,suffix]) => {
    const slide = document.getElementById(id);
    if (!slide) return;
    const clone = addPage(slide,suffix);
    clone.querySelectorAll('.bd-svg > *').forEach(g => {
      if (!g.matches('g.fragment') || Number(g.dataset.fragmentIndex) < threshold) g.remove();
    });
    slide.querySelectorAll('.bd-svg > g.fragment').forEach(g => {
      const step = Number(g.dataset.fragmentIndex);
      if (step >= (id === 'brief-data-18' ? 4 : threshold)) g.remove();
    });
  });
})();
