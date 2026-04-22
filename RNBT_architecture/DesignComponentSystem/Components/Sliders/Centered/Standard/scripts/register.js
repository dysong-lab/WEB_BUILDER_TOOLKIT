const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;
const { each, go } = fx;

// ======================
// 1. selector + 자체 메서드 정의
// ======================

this.cssSelectors = {
  root: ".centered-slider",
  eyebrow: ".centered-slider__eyebrow",
  label: ".centered-slider__label",
  value: ".centered-slider__value",
  input: ".centered-slider__native",
  fill: ".centered-slider__fill",
  centerMark: ".centered-slider__center-mark",
  negativeLabel: ".centered-slider__negative-label",
  positiveLabel: ".centered-slider__positive-label",
  supportingText: ".centered-slider__supporting",
};

this._inputSyncHandler = null;
this._changeSyncHandler = null;

this.getElement = function (key) {
  const selector = this.cssSelectors?.[key];
  return selector ? this.appendElement.querySelector(selector) : null;
};

this.normalizeCenteredInfo = function ({ response: data } = {}) {
  const nextData = data || {};
  const min = Number.isFinite(Number(nextData.min)) ? Number(nextData.min) : -50;
  const max =
    Number.isFinite(Number(nextData.max)) && Number(nextData.max) > min
      ? Number(nextData.max)
      : 50;
  const step =
    Number.isFinite(Number(nextData.step)) && Number(nextData.step) > 0
      ? Number(nextData.step)
      : 1;
  const center = (min + max) / 2;
  const rawValue = Number.isFinite(Number(nextData.value))
    ? Number(nextData.value)
    : center;
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
    negativeLabel:
      nextData.negativeLabel === null || nextData.negativeLabel === undefined
        ? String(min)
        : String(nextData.negativeLabel),
    positiveLabel:
      nextData.positiveLabel === null || nextData.positiveLabel === undefined
        ? String(max)
        : String(nextData.positiveLabel),
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

this.syncCenteredUi = function () {
  const root = this.getElement("root");
  const input = this.getElement("input");
  const value = this.getElement("value");
  const fill = this.getElement("fill");

  if (!root || !input || !value || !fill) return;

  const min = Number(input.min || -50);
  const max = Number(input.max || 50);
  const current = Number(input.value || 0);
  const center = (min + max) / 2;
  const total = max - min || 1;
  const centerRatio = (center - min) / total;
  const currentRatio = (current - min) / total;
  const start = Math.min(centerRatio, currentRatio);
  const size = Math.abs(currentRatio - centerRatio);
  const prefix = input.dataset.valuePrefix || "";
  const suffix = input.dataset.valueSuffix || "";
  const sign = current > center ? "+" : "";
  const isDisabled = input.disabled;

  value.textContent = `${sign}${prefix}${current}${suffix}`;
  fill.style.left = `${start * 100}%`;
  fill.style.width = `${size * 100}%`;
  root.dataset.disabled = isDisabled ? "true" : "false";
  root.setAttribute("aria-disabled", isDisabled ? "true" : "false");
};

this.renderCenteredSliderInfo = function (payload) {
  const root = this.getElement("root");
  const eyebrow = this.getElement("eyebrow");
  const label = this.getElement("label");
  const input = this.getElement("input");
  const negativeLabel = this.getElement("negativeLabel");
  const positiveLabel = this.getElement("positiveLabel");
  const supportingText = this.getElement("supportingText");

  if (
    !root ||
    !eyebrow ||
    !label ||
    !input ||
    !negativeLabel ||
    !positiveLabel ||
    !supportingText
  ) {
    return;
  }

  const nextData = this.normalizeCenteredInfo(payload);

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
  negativeLabel.textContent = nextData.negativeLabel;
  positiveLabel.textContent = nextData.positiveLabel;
  supportingText.textContent = nextData.supportingText;

  this.syncCenteredUi();
};

// ======================
// 2. 구독 연결
// ======================

this.subscriptions = {
  centeredSliderInfo: [this.renderCenteredSliderInfo],
};

go(
  Object.entries(this.subscriptions),
  each(([topic, handlers]) =>
    each((handler) => subscribe(topic, this, handler), handlers),
  ),
);

this._inputSyncHandler = (event) => {
  if (!event.target.closest(this.cssSelectors.input)) return;
  this.syncCenteredUi();
};

this._changeSyncHandler = (event) => {
  if (!event.target.closest(this.cssSelectors.input)) return;
  this.syncCenteredUi();
};

this.appendElement.addEventListener("input", this._inputSyncHandler);
this.appendElement.addEventListener("change", this._changeSyncHandler);

// ======================
// 3. 이벤트 매핑
// ======================

this.customEvents = {
  input: {
    [this.cssSelectors.input]: "@centeredSliderInputChanged",
  },
  change: {
    [this.cssSelectors.input]: "@centeredSliderChanged",
  },
};
bindEvents(this, this.customEvents);
