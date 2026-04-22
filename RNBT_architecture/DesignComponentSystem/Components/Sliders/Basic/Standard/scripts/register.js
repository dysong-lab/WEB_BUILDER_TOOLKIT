const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;
const { each, go } = fx;

// ======================
// 1. selector + 자체 메서드 정의
// ======================

this.cssSelectors = {
  root: ".slider",
  eyebrow: ".slider__eyebrow",
  label: ".slider__label",
  value: ".slider__value",
  input: ".slider__native",
  fill: ".slider__fill",
  minLabel: ".slider__min-label",
  maxLabel: ".slider__max-label",
  supportingText: ".slider__supporting",
};

this._inputSyncHandler = null;
this._changeSyncHandler = null;

this.getElement = function (key) {
  const selector = this.cssSelectors?.[key];
  return selector ? this.appendElement.querySelector(selector) : null;
};

this.normalizeSliderInfo = function ({ response: data } = {}) {
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
  const rawValue = Number.isFinite(Number(nextData.value))
    ? Number(nextData.value)
    : min;
  const value = Math.min(max, Math.max(min, rawValue));

  return {
    eyebrow:
      nextData.eyebrow === null || nextData.eyebrow === undefined
        ? ""
        : String(nextData.eyebrow),
    label:
      nextData.label === null || nextData.label === undefined
        ? ""
        : String(nextData.label),
    value,
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

this.syncSliderUi = function () {
  const root = this.getElement("root");
  const input = this.getElement("input");
  const value = this.getElement("value");
  const fill = this.getElement("fill");

  if (!root || !input || !value || !fill) return;

  const min = Number(input.min || 0);
  const max = Number(input.max || 100);
  const current = Number(input.value || min);
  const ratio = max === min ? 0 : (current - min) / (max - min);
  const prefix = input.dataset.valuePrefix || "";
  const suffix = input.dataset.valueSuffix || "";
  const isDisabled = input.disabled;

  value.textContent = `${prefix}${current}${suffix}`;
  fill.style.width = `${Math.max(0, Math.min(1, ratio)) * 100}%`;
  root.dataset.disabled = isDisabled ? "true" : "false";
  root.setAttribute("aria-disabled", isDisabled ? "true" : "false");
};

this.renderSliderInfo = function (payload) {
  const root = this.getElement("root");
  const eyebrow = this.getElement("eyebrow");
  const label = this.getElement("label");
  const value = this.getElement("value");
  const input = this.getElement("input");
  const minLabel = this.getElement("minLabel");
  const maxLabel = this.getElement("maxLabel");
  const supportingText = this.getElement("supportingText");

  if (
    !root ||
    !eyebrow ||
    !label ||
    !value ||
    !input ||
    !minLabel ||
    !maxLabel ||
    !supportingText
  ) {
    return;
  }

  const nextData = this.normalizeSliderInfo(payload);

  eyebrow.textContent = nextData.eyebrow;
  eyebrow.hidden = nextData.eyebrow === "";
  label.textContent = nextData.label;
  input.min = String(nextData.min);
  input.max = String(nextData.max);
  input.step = String(nextData.step);
  input.value = String(nextData.value);
  input.disabled = nextData.disabled;
  input.dataset.valuePrefix = nextData.valuePrefix;
  input.dataset.valueSuffix = nextData.valueSuffix;
  minLabel.textContent = nextData.minLabel;
  maxLabel.textContent = nextData.maxLabel;
  supportingText.textContent = nextData.supportingText;
  value.textContent = `${nextData.valuePrefix}${nextData.value}${nextData.valueSuffix}`;

  this.syncSliderUi();
};

// ======================
// 2. 구독 연결
// ======================

this.subscriptions = {
  sliderInfo: [this.renderSliderInfo],
};

go(
  Object.entries(this.subscriptions),
  each(([topic, handlers]) =>
    each((handler) => subscribe(topic, this, handler), handlers),
  ),
);

this._inputSyncHandler = (event) => {
  if (!event.target.closest(this.cssSelectors.input)) return;
  this.syncSliderUi();
};

this._changeSyncHandler = (event) => {
  if (!event.target.closest(this.cssSelectors.input)) return;
  this.syncSliderUi();
};

this.appendElement.addEventListener("input", this._inputSyncHandler);
this.appendElement.addEventListener("change", this._changeSyncHandler);

// ======================
// 3. 이벤트 매핑
// ======================

this.customEvents = {
  input: {
    [this.cssSelectors.input]: "@sliderInputChanged",
  },
  change: {
    [this.cssSelectors.input]: "@sliderChanged",
  },
};
bindEvents(this, this.customEvents);
