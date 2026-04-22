const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;
const { each, go } = fx;

// ======================
// 1. MIXIN 적용 + 자체 메서드 정의
// ======================

applyFieldRenderMixin(this, {
  cssSelectors: {
    root: ".text-field",
    label: ".text-field__label",
    input: ".text-field__input",
    supportingText: ".text-field__supporting",
    errorText: ".text-field__error",
    clearButton: ".text-field__clear",
  },
});

this._clearClickHandler = null;

this.getElement = function (key) {
  const selector = this.fieldRender?.cssSelectors?.[key];
  return selector ? this.appendElement.querySelector(selector) : null;
};

this.normalizeTextFieldInfo = function ({ response: data } = {}) {
  const nextData = data || {};
  const normalizeString = (value) =>
    value === null || value === undefined ? "" : String(value);

  return {
    label: normalizeString(nextData.label),
    placeholder: normalizeString(nextData.placeholder),
    value: normalizeString(nextData.value),
    supportingText: normalizeString(nextData.supportingText),
    errorText: normalizeString(nextData.errorText),
    disabled: nextData.disabled === true,
    readonly: nextData.readonly === true,
    required: nextData.required === true,
    invalid: nextData.invalid === true,
  };
};

this.syncState = function (info) {
  const root = this.getElement("root");
  const label = this.getElement("label");
  const input = this.getElement("input");
  const supportingText = this.getElement("supportingText");
  const errorText = this.getElement("errorText");
  const clearButton = this.getElement("clearButton");
  if (!root || !label || !input || !supportingText || !errorText || !clearButton) {
    return;
  }

  const hasValue = input.value.trim() !== "";

  root.dataset.disabled = info.disabled ? "true" : "false";
  root.dataset.readonly = info.readonly ? "true" : "false";
  root.dataset.invalid = info.invalid ? "true" : "false";
  root.dataset.hasValue = hasValue ? "true" : "false";

  input.disabled = info.disabled;
  input.readOnly = info.readonly;
  input.required = info.required;
  input.setAttribute("aria-invalid", info.invalid ? "true" : "false");
  input.setAttribute("aria-required", info.required ? "true" : "false");
  input.setAttribute("placeholder", info.placeholder);
  input.value = info.value;

  label.setAttribute("aria-required", info.required ? "true" : "false");

  supportingText.hidden = info.invalid || info.supportingText === "";
  errorText.hidden = !info.invalid || info.errorText === "";

  const showClear = hasValue && !info.disabled && !info.readonly;
  clearButton.hidden = !showClear;
  clearButton.disabled = !showClear;
  clearButton.setAttribute("aria-hidden", showClear ? "false" : "true");
  clearButton.setAttribute("aria-label", "Clear text field");
};

this.clearValue = function (event) {
  const input = this.getElement("input");
  if (!input || input.disabled || input.readOnly) return;

  input.value = "";
  const info = this.normalizeTextFieldInfo({
    response: {
      label: this.getElement("label")?.textContent || "",
      placeholder: input.getAttribute("placeholder") || "",
      value: "",
      supportingText: this.getElement("supportingText")?.textContent || "",
      errorText: this.getElement("errorText")?.textContent || "",
      disabled: input.disabled,
      readonly: input.readOnly,
      required: input.required,
      invalid: input.getAttribute("aria-invalid") === "true",
    },
  });
  this.syncState(info);
  Weventbus.emit("@textFieldCleared", { event, targetInstance: this });
};

this.renderTextFieldInfo = function (payload = {}) {
  const nextData = this.normalizeTextFieldInfo(payload);
  const input = this.getElement("input");
  if (!input) return;

  this.fieldRender.renderData({
    response: {
      label: nextData.label,
      supportingText: nextData.supportingText,
      errorText: nextData.errorText,
    },
  });

  this.syncState(nextData);
};

// ======================
// 2. 구독 연결
// ======================

this.subscriptions = {
  textFieldInfo: [this.renderTextFieldInfo],
};

go(
  Object.entries(this.subscriptions),
  each(([topic, handlers]) =>
    each((handler) => subscribe(topic, this, handler), handlers),
  ),
);

// ======================
// 3. 이벤트 매핑
// ======================

this.customEvents = {
  input: {
    [this.fieldRender.cssSelectors.input]: "@textFieldInputChanged",
  },
  change: {
    [this.fieldRender.cssSelectors.input]: "@textFieldChanged",
  },
  focusin: {
    [this.fieldRender.cssSelectors.input]: "@textFieldFocused",
  },
  focusout: {
    [this.fieldRender.cssSelectors.input]: "@textFieldBlurred",
  },
};
bindEvents(this, this.customEvents);

this._clearClickHandler = (event) => {
  const clearButton = event.target.closest(this.fieldRender.cssSelectors.clearButton);
  if (!clearButton || !this.appendElement.contains(clearButton)) return;
  if (clearButton.disabled) return;

  event.preventDefault();
  this.clearValue(event);
};

this.appendElement.addEventListener("click", this._clearClickHandler);
