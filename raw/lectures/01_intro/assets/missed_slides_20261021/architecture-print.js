/* Preserve both evidence and supplemental scenes as separate pages in print only. */
(() => {
  if (!new URLSearchParams(location.search).has('print-pdf')) return;
  function expand() {
    for (const [id, card, takeaway] of [
      ['arch-08','ARC-11','MoT selects parameter sets by token type; the streams exchange information through attention.'],
      ['arch-27','ARC-01','Fixed recurrent state does not guarantee fixed end-to-end audio latency.']
    ]) {
      const original = document.getElementById(id);
      const supplement = original?.querySelector('.brief-arc-supplement');
      if (!supplement || document.getElementById(`${id}-print-${card.toLowerCase()}`)) continue;
      const extra = original.cloneNode(true);
      extra.id = `${id}-print-${card.toLowerCase()}`;
      extra.classList.remove('past','present','future');
      extra.querySelector('.brief-arc-original')?.remove();
      extra.querySelector('.notes')?.remove();
      extra.querySelector('.fv-source')?.remove();
      const scene = extra.querySelector('.brief-arc-supplement');
      scene.classList.remove('fragment','brief-arc-supplement');
      scene.classList.add('brief-arc-print-scene');
      scene.removeAttribute('data-fragment-index');
      const source = scene.querySelector('.brief-arc-extra-source');
      source.className = 'fv-source';
      extra.append(source);
      extra.querySelector('.fv-id').textContent = `${card} · supplement`;
      extra.querySelector('.fv-takeaway').textContent = takeaway;
      original.after(extra);
      supplement.remove();
      original.querySelector('.brief-arc-original')?.classList.remove('fragment','fade-out');
    }
    window.Reveal?.sync();
  }
  document.addEventListener('DOMContentLoaded', expand, {once:true});
})();
