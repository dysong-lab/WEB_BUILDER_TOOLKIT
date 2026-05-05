if (this._buttonElement) {
  this._buttonElement.removeEventListener("pointerdown", this._pointerDownHandler);
  this._buttonElement.removeEventListener("pointerup", this._pointerUpHandler);
  this._buttonElement.removeEventListener("pointerleave", this._pointerLeaveHandler);
  this._buttonElement.removeEventListener("pointercancel", this._pointerCancelHandler);
  this._buttonElement.removeEventListener("click", this._suppressClickHandler, true);
}

if (this._holdTimer) {
  window.clearTimeout(this._holdTimer);
}
if (this._progressRaf) {
  window.cancelAnimationFrame(this._progressRaf);
}
if (this._resetTimer) {
  window.clearTimeout(this._resetTimer);
}

this.customEvents = null;
this.subscriptions = null;
this.renderButtonInfo = null;
this.setProgressState = null;
this.startHold = null;
this.resetHold = null;
this.completeHold = null;
this._tickHoldProgress = null;
this._buttonElement = null;
this._pointerDownHandler = null;
this._pointerUpHandler = null;
this._pointerLeaveHandler = null;
this._pointerCancelHandler = null;
this._suppressClickHandler = null;
this.cssSelectors = null;
