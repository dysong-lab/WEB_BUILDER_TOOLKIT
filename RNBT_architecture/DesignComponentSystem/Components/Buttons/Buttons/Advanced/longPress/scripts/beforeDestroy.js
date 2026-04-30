const { removeCustomEvents } = Wkit;

if (this._buttonElement) {
  this._buttonElement.removeEventListener("pointerdown", this._pointerDownHandler);
  this._buttonElement.removeEventListener("pointerup", this._pointerUpHandler);
  this._buttonElement.removeEventListener("pointerleave", this._pointerLeaveHandler);
  this._buttonElement.removeEventListener("pointercancel", this._pointerCancelHandler);
  this._buttonElement.removeEventListener("click", this._suppressClickHandler, true);
}

removeCustomEvents(this, this.customEvents);

if (this._longPressTimer) {
  window.clearTimeout(this._longPressTimer);
}
if (this._progressRaf) {
  window.cancelAnimationFrame(this._progressRaf);
}

this.customEvents = null;
this.subscriptions = null;
this.renderButtonInfo = null;
this.setProgressState = null;
this.startLongPress = null;
this.cancelLongPress = null;
this.completeLongPress = null;
this._tickLongPressProgress = null;
this._buttonElement = null;
this._pointerDownHandler = null;
this._pointerUpHandler = null;
this._pointerLeaveHandler = null;
this._pointerCancelHandler = null;
this._suppressClickHandler = null;
this.cssSelectors = null;
