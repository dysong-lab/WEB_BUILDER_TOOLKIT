const { bindEvents, applySemanticStatus } = Wkit;

this.cssSelectors = {
  shell: ".button-shell",
  button: ".md-button",
  label: ".md-button__label",
  progress: ".button-feedback__progress",
  hint: ".button-feedback__hint",
};

this.longPressDuration = 500;
this._longPressTimer = null;
this._progressRaf = null;
this._pressStartAt = 0;
this._longPressTriggered = false;
this._activePointerId = null;

this.renderButtonInfo = function (data = {}) {
  const button = this.appendElement.querySelector(this.cssSelectors.button);
  const label = this.appendElement.querySelector(this.cssSelectors.label);
  if (!button || !label) return;

  const nextLabel =
    data?.label === null || data?.label === undefined ? "" : String(data.label);

  label.textContent = nextLabel;
  button.setAttribute("aria-label", nextLabel);
  applySemanticStatus(button, data);
};

this.setProgressState = function (progress = 0, phase = "idle") {
  const shell = this.appendElement.querySelector(this.cssSelectors.shell);
  const button = this.appendElement.querySelector(this.cssSelectors.button);
  const bar = this.appendElement.querySelector(this.cssSelectors.progress);
  const hint = this.appendElement.querySelector(this.cssSelectors.hint);
  if (!shell || !button || !bar || !hint) return;

  const clamped = Math.max(0, Math.min(1, progress));
  shell.dataset.phase = phase;
  button.dataset.phase = phase;
  bar.style.transform = `scaleX(${clamped})`;

  if (phase === "holding") {
    hint.textContent = `Hold ${(clamped * this.longPressDuration).toFixed(0)} / ${this.longPressDuration}ms`;
    return;
  }

  if (phase === "completed") {
    hint.textContent = "Long press complete";
    return;
  }

  hint.textContent = `Hold for ${this.longPressDuration}ms`;
};

this._tickLongPressProgress = () => {
  if (!this._pressStartAt) return;
  const elapsed = performance.now() - this._pressStartAt;
  this.setProgressState(elapsed / this.longPressDuration, "holding");
  if (elapsed < this.longPressDuration && !this._longPressTriggered) {
    this._progressRaf = window.requestAnimationFrame(this._tickLongPressProgress);
  }
};

this.cancelLongPress = function ({ preserveComplete = false } = {}) {
  if (this._longPressTimer) {
    window.clearTimeout(this._longPressTimer);
    this._longPressTimer = null;
  }
  if (this._progressRaf) {
    window.cancelAnimationFrame(this._progressRaf);
    this._progressRaf = null;
  }
  this._pressStartAt = 0;
  this._activePointerId = null;
  if (!preserveComplete) {
    this._longPressTriggered = false;
    this.setProgressState(0, "idle");
  }
};

this.completeLongPress = function (event) {
  if (this._longPressTriggered) return;
  this._longPressTriggered = true;
  this.setProgressState(1, "completed");
  Weventbus.emit("@buttonLongPressed", {
    event,
    targetInstance: this,
    response: {
      holdDuration: this.longPressDuration,
      label:
        this.appendElement
          .querySelector(this.cssSelectors.label)
          ?.textContent?.trim() || "",
    },
  });
};

this.startLongPress = function (event) {
  const button = this.appendElement.querySelector(this.cssSelectors.button);
  if (!button) return;

  this.cancelLongPress();
  this._longPressTriggered = false;
  this._activePointerId = event.pointerId;
  this._pressStartAt = performance.now();
  this.setProgressState(0, "holding");
  this._progressRaf = window.requestAnimationFrame(this._tickLongPressProgress);
  this._longPressTimer = window.setTimeout(() => {
    this.completeLongPress(event);
    this._longPressTimer = null;
  }, this.longPressDuration);
};

this.subscriptions = {
  buttonInfo: [this.renderButtonInfo],
};

this.customEvents = {
  click: {
    [this.cssSelectors.button]: "@buttonClicked",
  },
};
bindEvents(this, this.customEvents);

this._buttonElement = this.appendElement.querySelector(this.cssSelectors.button);
this._pointerDownHandler = (event) => this.startLongPress(event);
this._pointerUpHandler = () => this.cancelLongPress({ preserveComplete: false });
this._pointerLeaveHandler = () => this.cancelLongPress({ preserveComplete: false });
this._pointerCancelHandler = () => this.cancelLongPress({ preserveComplete: false });
this._suppressClickHandler = (event) => {
  if (!this._longPressTriggered) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  this.cancelLongPress();
};

if (this._buttonElement) {
  this._buttonElement.addEventListener("pointerdown", this._pointerDownHandler);
  this._buttonElement.addEventListener("pointerup", this._pointerUpHandler);
  this._buttonElement.addEventListener("pointerleave", this._pointerLeaveHandler);
  this._buttonElement.addEventListener("pointercancel", this._pointerCancelHandler);
  this._buttonElement.addEventListener("click", this._suppressClickHandler, true);
}

this.setProgressState(0, "idle");
