const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;
const { each, go } = fx;

this.cssSelectors = {
  root: ".range-slider",
  eyebrow: ".range-slider__eyebrow",
  label: ".range-slider__label",
  value: ".range-slider__value",
  lowerInput: ".range-slider__input--lower",
  upperInput: ".range-slider__input--upper",
  fill: ".range-slider__fill",
  minLabel: ".range-slider__min-label",
  maxLabel: ".range-slider__max-label",
  supportingText: ".range-slider__supporting",
};

this._inputSyncHandler = null;
this._changeSyncHandler = null;

this.getElement = function (key) {
  const selector = this.cssSelectors?.[key];
  return selector ? this.appendElement.querySelector(selector) : null;
};

this.normalizeRangeInfo = function ({ response: data } = {}) {
  const nextData = data || {};
  const min = Number.isFinite(Number(nextData.min)) ? Number(nextData.min) : 0;
  const max =
    Number.isFinite(Number(nextData.max)) && Number(nextData.max) > min
      ? Number(nextData.max)
      : 100;
  const step =
    Number.isFinite(Number(nextData.step)) && Number(nextData.step) > 0
      ? Number(nextData.step)
      : 1;
  const rawStart = Number.isFinite(Number(nextData.startValue))
    ? Number(nextData.startValue)
    : min;
  const rawEnd = Number.isFinite(Number(nextData.endValue))
    ? Number(nextData.endValue)
    : max;
  const startValue = Math.min(max, Math.max(min, rawStart));
  const endValue = Math.min(max, Math.max(startValue, rawEnd));

  return {
    eyebrow:
      nextData.eyebrow === null || nextData.eyebrow === undefined
        ? ""
        : String(nextData.eyebrow),
    label:
      nextData.label === null || nextData.label === undefined
        ? ""
        : String(nextData.label),
    startValue,
    endValue,
    min,
    max,
    step,
    minLabel:
      nextData.minLabel === null || nextData.minLabel === undefined
        ? String(min)
        : String(nextData.minLabel),
    maxLabel:
      nextData.maxLabel === null || nextData.maxLabel === undefined
        ? String(max)
        : String(nextData.maxLabel),
    supportingText:
      nextData.supportingText === null || nextData.supportingText === undefined
        ? ""
        : String(nextData.supportingText),
    disabled: Boolean(nextData.disabled),
    valuePrefix:
      nextData.valuePrefix === null || nextData.valuePrefix === undefined
        ? ""
        : String(nextData.valuePrefix),
    valueSuffix:
      nextData.valueSuffix === null || nextData.valueSuffix === undefined
        ? ""
        : String(nextData.valueSuffix),
  };
};

this.syncRangeUi = function () {
  const root = this.getElement("root");
  const lowerInput = this.getElement("lowerInput");
  const upperInput = this.getElement("upperInput");
  const value = this.getElement("value");
  const fill = this.getElement("fill");

  if (!root || !lowerInput || !upperInput || !value || !fill) return;

  const min = Number(lowerInput.min || 0);
  const max = Number(lowerInput.max || 100);
  const lower = Number(lowerInput.value || min);
  const upper = Number(upperInput.value || max);
  const total = max - min || 1;
  const startRatio = (lower - min) / total;
  const endRatio = (upper - min) / total;
  const prefix = lowerInput.dataset.valuePrefix || "";
  const suffix = lowerInput.dataset.valueSuffix || "";
  const isDisabled = lowerInput.disabled || upperInput.disabled;

  value.textContent = `${prefix}${lower}${suffix} - ${prefix}${upper}${suffix}`;
  fill.style.left = `${startRatio * 100}%`;
  fill.style.width = `${Math.max(0, endRatio - startRatio) * 100}%`;
  root.dataset.disabled = isDisabled ? "true" : "false";
  root.setAttribute("aria-disabled", isDisabled ? "true" : "false");
};

this.constrainRange = function (source) {
  const lowerInput = this.getElement("lowerInput");
  const upperInput = this.getElement("upperInput");

  if (!lowerInput || !upperInput) return;

  let lower = Number(lowerInput.value);
  let upper = Number(upperInput.value);

  if (source === "lower" && lower > upper) {
    upper = lower;
    upperInput.value = String(upper);
  }

  if (source === "upper" && upper < lower) {
    lower = upper;
    lowerInput.value = String(lower);
  }

  this.syncRangeUi();
};

this.renderRangeSliderInfo = function (payload) {
  const root = this.getElement("root");
  const eyebrow = this.getElement("eyebrow");
  const label = this.getElement("label");
  const lowerInput = this.getElement("lowerInput");
  const upperInput = this.getElement("upperInput");
  const minLabel = this.getElement("minLabel");
  const maxLabel = this.getElement("maxLabel");
  const supportingText = this.getElement("supportingText");

  if (
    !root ||
    !eyebrow ||
    !label ||
    !lowerInput ||
    !upperInput ||
    !minLabel ||
    !maxLabel ||
    !supportingText
  ) {
    return;
  }

  const nextData = this.normalizeRangeInfo(payload);

  eyebrow.textContent = nextData.eyebrow;
  eyebrow.hidden = nextData.eyebrow === "";
  label.textContent = nextData.label;
  lowerInput.min = String(nextData.min);
  lowerInput.max = String(nextData.max);
  lowerInput.step = String(nextData.step);
  lowerInput.value = String(nextData.startValue);
  lowerInput.disabled = nextData.disabled;
  lowerInput.dataset.valuePrefix = nextData.valuePrefix;
  lowerInput.dataset.valueSuffix = nextData.valueSuffix;
  upperInput.min = String(nextData.min);
  upperInput.max = String(nextData.max);
  upperInput.step = String(nextData.step);
  upperInput.value = String(nextData.endValue);
  upperInput.disabled = nextData.disabled;
  upperInput.dataset.valuePrefix = nextData.valuePrefix;
  upperInput.dataset.valueSuffix = nextData.valueSuffix;
  minLabel.textContent = nextData.minLabel;
  maxLabel.textContent = nextData.maxLabel;
  supportingText.textContent = nextData.supportingText;

  this.syncRangeUi();
};

this.subscriptions = {
  rangeSliderInfo: [this.renderRangeSliderInfo],
};

go(
  Object.entries(this.subscriptions),
  each(([topic, handlers]) =>
    each((handler) => subscribe(topic, this, handler), handlers),
  ),
);

this._inputSyncHandler = (event) => {
  const lowerTarget = event.target.closest(this.cssSelectors.lowerInput);
  const upperTarget = event.target.closest(this.cssSelectors.upperInput);

  if (!lowerTarget && !upperTarget) return;

  this.constrainRange(lowerTarget ? "lower" : "upper");
};

this._changeSyncHandler = (event) => {
  const lowerTarget = event.target.closest(this.cssSelectors.lowerInput);
  const upperTarget = event.target.closest(this.cssSelectors.upperInput);

  if (!lowerTarget && !upperTarget) return;

  this.constrainRange(lowerTarget ? "lower" : "upper");
};

this.appendElement.addEventListener("input", this._inputSyncHandler);
this.appendElement.addEventListener("change", this._changeSyncHandler);

this.customEvents = {
  input: {
    [this.cssSelectors.lowerInput]: "@rangeSliderInputChanged",
    [this.cssSelectors.upperInput]: "@rangeSliderInputChanged",
  },
  change: {
    [this.cssSelectors.lowerInput]: "@rangeSliderChanged",
    [this.cssSelectors.upperInput]: "@rangeSliderChanged",
  },
};
bindEvents(this, this.customEvents);
