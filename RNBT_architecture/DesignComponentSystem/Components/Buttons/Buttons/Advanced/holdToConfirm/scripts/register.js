const { applySemanticStatus } = Wkit;

this.cssSelectors = {
  shell: ".button-shell",
  button: ".md-button",
  label: ".md-button__label",
  progress: ".button-feedback__progress",
  hint: ".button-feedback__hint",
};

this.holdDuration = 1500;
this._holdTimer = null;
this._progressRaf = null;
this._pressStartAt = 0;
this._holdLatched = false;
this._activePointerId = null;
this._resetTimer = null;

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
    hint.textContent = `Hold ${(clamped * this.holdDuration).toFixed(0)} / ${this.holdDuration}ms`;
    return;
  }

  if (phase === "completed") {
    hint.textContent = "Confirmed";
    return;
  }

  hint.textContent = `Hold for ${this.holdDuration}ms to confirm`;
};

this._tickHoldProgress = () => {
  if (!this._pressStartAt) return;
  const elapsed = performance.now() - this._pressStartAt;
  this.setProgressState(elapsed / this.holdDuration, "holding");
  if (elapsed < this.holdDuration && !this._holdLatched) {
    this._progressRaf = window.requestAnimationFrame(this._tickHoldProgress);
  }
};

this.resetHold = function ({ keepComplete = false } = {}) {
  if (this._holdTimer) {
    window.clearTimeout(this._holdTimer);
    this._holdTimer = null;
  }
  if (this._resetTimer) {
    window.clearTimeout(this._resetTimer);
    this._resetTimer = null;
  }
  if (this._progressRaf) {
    window.cancelAnimationFrame(this._progressRaf);
    this._progressRaf = null;
  }
  this._pressStartAt = 0;
  this._activePointerId = null;
  if (!keepComplete) {
    this._holdLatched = false;
    this.setProgressState(0, "idle");
  }
};

this.completeHold = function (event) {
  if (this._holdLatched) return;
  this._holdLatched = true;
  this.setProgressState(1, "completed");
  Weventbus.emit("@holdConfirmed", {
    event,
    targetInstance: this,
    response: {
      holdMs: this.holdDuration,
      label:
        this.appendElement
          .querySelector(this.cssSelectors.label)
          ?.textContent?.trim() || "",
    },
  });
};

this.startHold = function (event) {
  const button = this.appendElement.querySelector(this.cssSelectors.button);
  if (!button) return;

  this.resetHold();
  this._holdLatched = false;
  this._activePointerId = event.pointerId;
  this._pressStartAt = performance.now();
  this.setProgressState(0, "holding");
  this._progressRaf = window.requestAnimationFrame(this._tickHoldProgress);
  this._holdTimer = window.setTimeout(() => {
    this.completeHold(event);
    this._holdTimer = null;
  }, this.holdDuration);
};

this.subscriptions = {
  buttonInfo: [this.renderButtonInfo],
};
this.customEvents = null;

this._buttonElement = this.appendElement.querySelector(this.cssSelectors.button);
this._pointerDownHandler = (event) => this.startHold(event);
this._pointerUpHandler = () => {
  if (this._holdLatched) {
    this._resetTimer = window.setTimeout(() => this.resetHold(), 200);
    return;
  }
  this.resetHold();
};
this._pointerLeaveHandler = () => this.resetHold();
this._pointerCancelHandler = () => this.resetHold();
this._suppressClickHandler = (event) => {
  event.preventDefault();
  event.stopImmediatePropagation();
};

if (this._buttonElement) {
  this._buttonElement.addEventListener("pointerdown", this._pointerDownHandler);
  this._buttonElement.addEventListener("pointerup", this._pointerUpHandler);
  this._buttonElement.addEventListener("pointerleave", this._pointerLeaveHandler);
  this._buttonElement.addEventListener("pointercancel", this._pointerCancelHandler);
  this._buttonElement.addEventListener("click", this._suppressClickHandler, true);
}

this.setProgressState(0, "idle");
