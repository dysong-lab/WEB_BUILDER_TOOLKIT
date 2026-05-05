const { applySemanticStatus } = Wkit;

this.cssSelectors = {
  shell: ".button-shell",
  button: ".md-button",
  label: ".md-button__label",
  helper: ".button-feedback__hint",
  cancel: ".button-feedback__cancel",
};

this.confirmationTimeout = 3000;
this._confirmTimer = null;
this._confirmationState = false;
this._buttonMeta = {
  label: "",
  confirmLabel: "",
  helperText: "",
  confirmHelperText: "",
};

this.renderButtonInfo = function (data = {}) {
  const button = this.appendElement.querySelector(this.cssSelectors.button);
  const label = this.appendElement.querySelector(this.cssSelectors.label);
  const helper = this.appendElement.querySelector(this.cssSelectors.helper);
  if (!button || !label || !helper) return;

  const nextLabel =
    data?.label === null || data?.label === undefined ? "" : String(data.label);
  const confirmLabel =
    data?.confirmLabel === null || data?.confirmLabel === undefined
      ? `Confirm ${nextLabel}`.trim()
      : String(data.confirmLabel);
  const helperText =
    data?.helperText === null || data?.helperText === undefined
      ? "Click once to arm confirmation"
      : String(data.helperText);
  const confirmHelperText =
    data?.confirmHelperText === null || data?.confirmHelperText === undefined
      ? `Click again within ${this.confirmationTimeout / 1000}s to execute`
      : String(data.confirmHelperText);

  this._buttonMeta = {
    label: nextLabel,
    confirmLabel,
    helperText,
    confirmHelperText,
  };

  applySemanticStatus(button, data);
  button.setAttribute("aria-label", nextLabel);

  if (this._confirmationState) {
    this.applyConfirmationState();
    return;
  }

  label.textContent = nextLabel;
  helper.textContent = helperText;
};

this.applyConfirmationState = function () {
  const shell = this.appendElement.querySelector(this.cssSelectors.shell);
  const button = this.appendElement.querySelector(this.cssSelectors.button);
  const label = this.appendElement.querySelector(this.cssSelectors.label);
  const helper = this.appendElement.querySelector(this.cssSelectors.helper);
  if (!shell || !button || !label || !helper) return;

  shell.dataset.phase = "confirm";
  button.dataset.phase = "confirm";
  label.textContent = this._buttonMeta.confirmLabel;
  helper.textContent = this._buttonMeta.confirmHelperText;
  button.setAttribute("aria-label", this._buttonMeta.confirmLabel);
};

this.resetConfirmationState = function () {
  if (this._confirmTimer) {
    window.clearTimeout(this._confirmTimer);
    this._confirmTimer = null;
  }

  this._confirmationState = false;

  const shell = this.appendElement.querySelector(this.cssSelectors.shell);
  const button = this.appendElement.querySelector(this.cssSelectors.button);
  const label = this.appendElement.querySelector(this.cssSelectors.label);
  const helper = this.appendElement.querySelector(this.cssSelectors.helper);
  if (!shell || !button || !label || !helper) return;

  shell.dataset.phase = "idle";
  button.dataset.phase = "idle";
  label.textContent = this._buttonMeta.label;
  helper.textContent = this._buttonMeta.helperText;
  button.setAttribute("aria-label", this._buttonMeta.label);
};

this.enterConfirmationState = function (event) {
  this._confirmationState = true;
  this.applyConfirmationState();
  this._confirmTimer = window.setTimeout(() => {
    this.resetConfirmationState();
  }, this.confirmationTimeout);

  Weventbus.emit("@confirmationNeeded", {
    event,
    targetInstance: this,
    response: {
      label: this._buttonMeta.label,
      confirmLabel: this._buttonMeta.confirmLabel,
      timeout: this.confirmationTimeout,
    },
  });
};

this.confirmAction = function (event) {
  Weventbus.emit("@buttonClicked", {
    event,
    targetInstance: this,
    response: {
      label: this._buttonMeta.label,
      confirmed: true,
    },
  });
  this.resetConfirmationState();
};

this._primaryClickHandler = (event) => {
  event.preventDefault();
  event.stopImmediatePropagation();

  if (this._confirmationState) {
    this.confirmAction(event);
    return;
  }

  this.enterConfirmationState(event);
};

this._cancelClickHandler = (event) => {
  event.preventDefault();
  this.resetConfirmationState();
};

this.subscriptions = {
  buttonInfo: [this.renderButtonInfo],
};

this._buttonElement = this.appendElement.querySelector(this.cssSelectors.button);
this._cancelElement = this.appendElement.querySelector(this.cssSelectors.cancel);

if (this._buttonElement) {
  this._buttonElement.addEventListener("click", this._primaryClickHandler, true);
}

if (this._cancelElement) {
  this._cancelElement.addEventListener("click", this._cancelClickHandler);
}

this.resetConfirmationState();
