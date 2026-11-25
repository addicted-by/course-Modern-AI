(() => {
  'use strict';
  const catalog = document.querySelector('.showcase-catalog');
  if (!catalog) return;
  const search = catalog.querySelector('#showcase-search');
  const weights = catalog.querySelector('#showcase-open-weights');
  const family = catalog.querySelector('#showcase-family');
  const families = [...catalog.querySelectorAll('.showcase-family')];
  const buttons = [...catalog.querySelectorAll('button[data-filter]')];
  const cards = [...catalog.querySelectorAll('.showcase-model')];
  const count = catalog.querySelector('#showcase-count');
  const empty = catalog.querySelector('#showcase-empty');
  if (!search || !count || !cards.length) return;
  const itemNoun = catalog.dataset.noun || 'model';
  const groupNoun = catalog.dataset.groupNoun || 'family';
  const plural = (number, noun) => `${number} ${number === 1 ? noun : noun === 'family' ? 'families' : noun + 's'}`;
  let category = 'all';
  const normalize = text => text.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().trim();
  const update = () => {
    const words = normalize(search.value).split(/\s+/).filter(Boolean);
    let visible = 0;
    for (const card of cards) {
      const haystack = normalize(card.dataset.search || card.textContent);
      const match = (category === 'all' || card.dataset.category === category)
        && (!family || family.value === 'all' || card.dataset.family === family.value)
        && (!weights || !weights.checked || card.dataset.open === 'true')
        && words.every(word => haystack.includes(word));
      card.hidden = !match;
      if (match) visible += 1;
    }
    for (const button of buttons) button.setAttribute('aria-pressed', String(button.dataset.filter === category));
    let visibleFamilies = 0;
    for (const group of families) {
      const members = [...group.querySelectorAll('.showcase-model')];
      const shown = members.filter(card => !card.hidden).length;
      group.hidden = shown === 0;
      group.classList.toggle('showcase-family-single', shown === 1);
      group.querySelector('.showcase-family-count').textContent = plural(shown, itemNoun);
      if (shown) visibleFamilies += 1;
    }
    count.textContent = `${visible} of ${plural(cards.length, itemNoun)} in ${plural(visibleFamilies, groupNoun)}`;
    if (empty) empty.hidden = visible > 0;
  };
  search.addEventListener('input', update);
  weights?.addEventListener('change', update);
  family?.addEventListener('change', update);
  for (const button of buttons) button.addEventListener('click', () => {
    category = button.dataset.filter;
    update();
  });
  catalog.querySelector('#showcase-reset')?.addEventListener('click', () => {
    search.value = '';
    if (weights) weights.checked = false;
    if (family) family.value = 'all';
    category = 'all';
    update();
    search.focus();
  });
  update();
})();
