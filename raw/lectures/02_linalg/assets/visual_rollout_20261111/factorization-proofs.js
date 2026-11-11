(() => {
  const eigenvalues = [9, 4, 1, 0];
  const digits = ['₁', '₂', '₃', '₄'];
  const format = value => String(Number(value.toFixed(2))).replace('-', '−');

  function panel(title, body) {
    return `<div class="vr-panel pf-panel"><h3>${title}</h3>${body}</div>`;
  }

  function svg(width, height, label, body) {
    return `<svg class="pf-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${label}">${body}</svg>`;
  }

  function label(x, y, text, extra = '') {
    return `<text x="${x}" y="${y}" ${extra}>${text}</text>`;
  }

  function vector(x, y, dx, dy, kind) {
    const length = Math.hypot(dx, dy);
    const ux = dx / length;
    const uy = dy / length;
    const end = [x + dx, y + dy];
    const back = [end[0] - 12 * ux, end[1] - 12 * uy];
    return `<path class="${kind}" d="M${x} ${y}L${end.join(' ')}"/>
      <polygon class="${kind}" points="${end.join(',')} ${back[0] + 5 * uy},${back[1] - 5 * ux} ${back[0] - 5 * uy},${back[1] + 5 * ux}"/>`;
  }

  function measure(name, value, max, kind) {
    return `<div class="pf-measure"><span>${name}</span><span class="pf-track">
      <span class="${kind}" style="width:${100 * value / max}%"></span></span><strong>${format(value)}</strong></div>`;
  }

  function weightsFor(transfer) {
    return [1, 1 - transfer, transfer, 0];
  }

  function energy(weights) {
    return weights.reduce((sum, weight, index) => sum + weight * eigenvalues[index], 0);
  }

  function projectorScene(transfer) {
    const weights = weightsFor(transfer);
    const first = Math.sqrt(1 - transfer);
    const second = Math.sqrt(transfer);
    const ux = 150, uy = 140, radius = 94;
    const plane = svg(315, 170, `In the u2 u3 plane, q has coefficients ${format(first)} and ${format(second)}`,
      `<path class="pf-axis" d="M150 31V140H276"/>
       <path class="pf-guide" d="M150 46A94 94 0 0 1 244 140"/>
       ${label(129, 40, 'u₃')}${label(280, 148, 'u₂')}
       ${vector(ux, uy, radius * first, -radius * second, 'pf-accent-vector')}
       ${label(ux + radius * first + 9, uy - radius * second - 10, 'q')}`);
    return `<div class="pf-grid pf-two">
      ${panel('Project onto span(u₁, q)', `${plane}
        <div class="pf-result">q = √(1−t)u₂ + √t u₃</div>`)}
      ${panel('Weight aᵢ = ‖Puᵢ‖₂² · fixed 0–1 scale',
        weights.map((w, i) => measure(`u${digits[i]} · λ = ${eigenvalues[i]}`, w, 1, 'pf-fill')).join('')
          + `<div class="pf-result">Σaᵢ = 2 · Retained energy = <b>${format(energy(weights))}</b></div>`)}
      </div>
      <div class="pf-checkpoints">
        <span><b>t = 0</b> · q = u₂ · energy 13</span>
        <span><b>t = ½</b> · q = (u₂ + u₃)/√2 · energy 11.5</span>
        <span><b>t = 1</b> · q = u₃ · energy 10</span>
      </div>`;
  }

  function familyPlot(t) {
    const x = 73 + 223 * t;
    const y = 173 - 16 * (4 + t * t);
    return svg(555, 216, `Spectral error stays 2. Squared Frobenius error follows 4 plus t squared, currently ${format(4 + t * t)}.`,
      `<path class="pf-axis" d="M73 37V173H519"/>
      ${[0, 2, 4, 8].map(value => label(47, 180 - value * 16, value)).join('')}
      ${[0, 1, 2].map(value => label(73 + 223 * value, 198, value, 'text-anchor="middle"')).join('')}
      ${label(540, 198, 't')}
      <path class="pf-outline" d="M73 141H519"/>
      <path class="pf-kernel" d="M73 109Q296 109 519 45"/>
      <path class="pf-guide" d="M${x} 173V${y}"/>
      <circle class="pf-fill" cx="${x}" cy="141" r="6"/><circle class="pf-fill" cx="${x}" cy="${y}" r="6"/>
      ${label(79, 133, '‖E‖₂ = 2')}${label(79, 97, '‖E‖F² = 4 + t²')}`);
  }

  function familyScene(t) {
    return `<div class="pf-grid pf-two">
      ${panel('Residual errors as t varies', familyPlot(t))}
      ${panel(`Residual amplitudes · t = ${format(t)}`,
        `${measure('|−t|', t, 2, 'pf-empty')}${measure('σ₂', 2, 2, 'pf-fill')}
        <div class="pf-result">max = <b>2</b> · sum of squares = <b>${format(4 + t * t)}</b></div>
        <div class="pf-caption">B<sub>t</sub> = diag(${format(3 + t)}, 0)</div>`)}
      </div>
      <div class="pf-endpoints"><span><b>t = 0</b> · B₀ = diag(3, 0) · spectral 2 · Frobenius² 4</span>
        <span><b>t = 1</b> · B₁ = diag(4, 0) · spectral 2 · Frobenius² 5</span></div>`;
  }

  function sliderScene(live, api, config) {
    const frame = document.createElement('div');
    const controls = document.createElement('div');
    controls.className = 'vr-controls pf-controls';
    const status = api.status();
    function update(value) {
      frame.innerHTML = config.render(value);
      status.textContent = config.describe(value);
    }
    controls.append(api.slider(config.label, 0, config.max, .05, config.initial, update), status);
    live.append(controls, frame);
    update(config.initial);
  }

  window.LinalgVisuals.register({
    'pre-33': (live, api) => sliderScene(live, api, {
      label: 'Transfer t', max: 1, initial: .5, render: projectorScene,
      describe: t => `t = ${format(t)} · Retained energy ${format(energy(weightsFor(t)))}`,
    }),
    'pre-37': (live, api) => sliderScene(live, api, {
      label: 'Perturbation t', max: 2, initial: 0, render: familyScene,
      describe: t => `t = ${format(t)} · Spectral error 2 · Squared Frobenius error ${format(4 + t * t)}`,
    }),
  });
})();
