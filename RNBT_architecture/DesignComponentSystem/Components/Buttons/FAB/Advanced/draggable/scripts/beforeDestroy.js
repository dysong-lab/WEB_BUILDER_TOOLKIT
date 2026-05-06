const { unsubscribe } = GlobalDataPublisher;
const { removeCustomEvents } = Wkit;
const { each, go } = fx;

if (this._fabEl) {
  this._fabEl.removeEventListener("pointerdown", this._pointerDownHandler);
  this._fabEl.removeEventListener("pointermove", this._pointerMoveHandler);
  this._fabEl.removeEventListener("pointerup", this._pointerUpHandler);
  this._fabEl.removeEventListener("pointercancel", this._pointerCancelHandler);
  this._fabEl.removeEventListener("click", this._clickCaptureHandler, true);
}

removeCustomEvents(this, this.customEvents);
this.customEvents = null;

go(
  Object.entries(this.subscriptions),
  each(([topic, _]) => unsubscribe(topic, this)),
);
this.subscriptions = null;

if (this.fieldRender) {
  this.fieldRender.destroy();
}

this.renderFabInfo = null;
this._applyTransform = null;
this._clampPosition = null;
this._handlePointerDown = null;
this._handlePointerMove = null;
this._handlePointerUp = null;
this._handlePointerCancel = null;
this._handleClickCapture = null;
this._pointerDownHandler = null;
this._pointerMoveHandler = null;
this._pointerUpHandler = null;
this._pointerCancelHandler = null;
this._clickCaptureHandler = null;
this._fabEl = null;
