(() => {
  "use strict";

  // Keep the fitted slide frame while enabling normal browser pinch zoom.
  const viewport = document.querySelector('meta[name="viewport"]');
  if (viewport) {
    viewport.content = viewport.content.split(",")
      .map(setting => setting.trim())
      .filter(setting => !/^(maximum-scale|user-scalable)\s*=/.test(setting))
      .join(", ");
  }

  const factories = new Map();
  const interactive = 'button, input, select, textarea, audio, video, summary, [role="button"], [role="slider"], [role="radio"], [role="tab"]';
  const localKeys = new Set([
    " ", "Enter", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight",
    "Home", "End", "PageUp", "PageDown"
  ]);
  let nextGroup = 0;

  function labelledControl(text, control) {
    const label = document.createElement("label");
    const name = document.createElement("span");
    name.textContent = text;
    control.setAttribute("aria-label", text);
    label.className = "vr-control";
    label.append(name, control);
    return label;
  }

  function slider(label, min, max, step, value, change) {
    const control = document.createElement("input");
    Object.assign(control, { type: "range", min, max, step, value });
    control.addEventListener("input", () => change(control.valueAsNumber));
    return labelledControl(label, control);
  }

  function choice(label, options, value, change) {
    const control = document.createElement("select");
    options.forEach(([key, text], index) => {
      const option = document.createElement("option");
      option.value = index;
      option.textContent = text;
      option.selected = Object.is(value, key);
      control.append(option);
    });
    control.addEventListener("change", () => change(options[control.selectedIndex][0]));
    return labelledControl(label, control);
  }

  function steps(label, labels, index, change) {
    const group = document.createElement("fieldset");
    const legend = document.createElement("legend");
    const name = `vr-step-${++nextGroup}`;
    group.className = "vr-steps";
    legend.textContent = label;
    group.append(legend);
    labels.forEach((text, i) => {
      const option = document.createElement("input");
      Object.assign(option, { type: "radio", name, value: i, checked: i === index });
      option.addEventListener("change", () => {
        if (option.checked) change(i);
      });
      group.append(labelledControl(text, option));
    });
    return group;
  }

  function status() {
    const output = document.createElement("output");
    output.className = "vr-status";
    output.setAttribute("aria-live", "polite");
    output.setAttribute("aria-atomic", "true");
    return output;
  }

  function installLocalKeyboard(host) {
    const handleLocalKey = event => {
      if (!(event.target instanceof Element) || !event.target.closest(interactive)) return;
      // Reveal's document handlers must not interpret a control's key as a shortcut.
      // Tab and Escape still reach Reveal and preserve normal focus/navigation.
      if (localKeys.has(event.key) || (event.key.length === 1 &&
          !event.altKey && !event.ctrlKey && !event.metaKey)) event.stopPropagation();
    };
    host.addEventListener("keydown", handleLocalKey);
    host.addEventListener("keypress", handleLocalKey);
    host.addEventListener("keyup", handleLocalKey);
    host.addEventListener("touchstart", event => {
      if (event.target instanceof Element && event.target.closest(interactive)) {
        event.stopPropagation();
      }
    }, { passive: true });
  }

  function mount() {
    document.querySelectorAll(".vr-visual[data-vr]").forEach(host => {
      installLocalKeyboard(host);
      const factory = factories.get(host.dataset.vr);
      if (!factory) return;
      const live = document.createElement("div");
      live.className = "vr-live";
      host.append(live);
      try {
        factory(live, api);
        if (!live.childElementCount) throw new Error("The factory did not render a scene");
        host.dataset.vrReady = "true";
      } catch (error) {
        live.remove();
        host.dataset.vrError = "true";
        console.error(`Visualization ${host.dataset.vr} failed to initialize`, error);
      }
    });
  }

  const api = Object.freeze({ slider, choice, steps, status });
  window.LinalgVisuals = Object.freeze({
    register(entries) {
      for (const [id, factory] of Object.entries(entries)) {
        if (factories.has(id)) throw new Error(`Duplicate visualization factory: ${id}`);
        if (typeof factory !== "function") throw new TypeError(`Invalid visualization factory: ${id}`);
        factories.set(id, factory);
      }
    }
  });

  // Classic scripts in the Quarto body register factories before DOMContentLoaded.
  document.addEventListener("DOMContentLoaded", mount, { once: true });
})();
