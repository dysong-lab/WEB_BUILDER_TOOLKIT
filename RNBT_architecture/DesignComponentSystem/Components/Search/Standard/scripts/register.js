const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;
const { each, go } = fx;

this.cssSelectors = {
  root: ".search-bar",
  form: ".search-bar__form",
  input: ".search-bar__input",
  leadingIcon: ".search-bar__leading",
  clearButton: ".search-bar__clear",
  submitButton: ".search-bar__submit",
  supportingText: ".search-bar__supporting",
};

this._clearClickHandler = null;
this._submitClickHandler = null;
this._submitHandler = null;

this.getElement = function (key) {
  const selector = this.cssSelectors?.[key];
  return selector ? this.appendElement.querySelector(selector) : null;
};

this.syncControls = function () {
  const input = this.getElement("input");
  const clearButton = this.getElement("clearButton");
  const submitButton = this.getElement("submitButton");

  if (!input || !clearButton || !submitButton) return;

  const hasValue = input.value.trim() !== "";
  const ariaLabel = input.getAttribute("placeholder") || "Search";

  clearButton.hidden = !hasValue;
  clearButton.disabled = !hasValue;
  clearButton.setAttribute("aria-hidden", hasValue ? "false" : "true");
  clearButton.setAttribute("aria-label", "Clear search");

  submitButton.setAttribute("aria-label", "Submit search");
  input.setAttribute("aria-label", ariaLabel);
};

this.clearQuery = function () {
  const input = this.getElement("input");
  if (!input) return;

  input.value = "";
  this.syncControls();
};

this.renderSearchInfo = function ({ response: data } = {}) {
  const nextData = data || {};
  const input = this.getElement("input");
  const supportingText = this.getElement("supportingText");
  const form = this.getElement("form");

  if (!input || !supportingText || !form) return;

  const placeholder =
    nextData.placeholder === null || nextData.placeholder === undefined
      ? ""
      : String(nextData.placeholder);
  const value =
    nextData.value === null || nextData.value === undefined
      ? ""
      : String(nextData.value);
  const nextSupportingText =
    nextData.supportingText === null || nextData.supportingText === undefined
      ? ""
      : String(nextData.supportingText);

  form.setAttribute("role", "search");
  input.setAttribute("type", "search");
  input.setAttribute("placeholder", placeholder);
  input.value = value;
  supportingText.textContent = nextSupportingText;

  this.syncControls();
};

this.subscriptions = {
  searchInfo: [this.renderSearchInfo],
};

go(
  Object.entries(this.subscriptions),
  each(([topic, handlers]) =>
    each((handler) => subscribe(topic, this, handler), handlers),
  ),
);

this.customEvents = {
  input: {
    [this.cssSelectors.input]: "@searchInputChanged",
  },
};
bindEvents(this, this.customEvents);

this._clearClickHandler = (event) => {
  const clearButton = event.target.closest(this.cssSelectors.clearButton);
  if (!clearButton || !this.appendElement.contains(clearButton)) return;
  if (clearButton.disabled) return;

  this.clearQuery();
  Weventbus.emit("@searchCleared", { event, targetInstance: this });
};

this._submitClickHandler = (event) => {
  const submitButton = event.target.closest(this.cssSelectors.submitButton);
  if (!submitButton || !this.appendElement.contains(submitButton)) return;

  event.preventDefault();
  Weventbus.emit("@searchSubmitted", { event, targetInstance: this });
};

this._submitHandler = (event) => {
  const form = event.target.closest(this.cssSelectors.form);
  if (!form || !this.appendElement.contains(form)) return;

  event.preventDefault();
  Weventbus.emit("@searchSubmitted", { event, targetInstance: this });
};

this.appendElement.addEventListener("click", this._clearClickHandler);
this.appendElement.addEventListener("click", this._submitClickHandler);
this.appendElement.addEventListener("submit", this._submitHandler);
