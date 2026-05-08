const { unsubscribe } = GlobalDataPublisher;
const { each, go } = fx;

if (this._handleEl) {
    this._handleEl.removeEventListener('pointerdown', this._pointerDownHandler);
    this._handleEl.removeEventListener('pointermove', this._pointerMoveHandler);
    this._handleEl.removeEventListener('pointerup', this._pointerUpHandler);
    this._handleEl.removeEventListener('pointercancel', this._pointerCancelHandler);
}

if (this.shadowPopup) {
    this.shadowPopup.removePopupEvents();
}

go(
    Object.entries(this.subscriptions || {}),
    each(([topic]) => unsubscribe(topic, this)),
);

if (this._popupScope?.fieldRender) this._popupScope.fieldRender.destroy();
if (this._popupScope?.listRender) this._popupScope.listRender.destroy();
if (this.shadowPopup) this.shadowPopup.destroy();

this.subscriptions = null;
this._popupScope = null;
this._isOpen = null;
this._dragThreshold = null;
this._x = null;
this._y = null;
this._startX = null;
this._startY = null;
this._originX = null;
this._originY = null;
this._isPointerDown = null;
this._isDraggingDetected = null;
this._surfaceEl = null;
this._handleEl = null;
this._pointerDownHandler = null;
this._pointerMoveHandler = null;
this._pointerUpHandler = null;
this._pointerCancelHandler = null;
this._renderDialogInfo = null;
this._renderDialogActions = null;
this._clampPosition = null;
this._applyTransform = null;
this._handlePointerDown = null;
this._handlePointerMove = null;
this._handlePointerUp = null;
this._handlePointerCancel = null;
this.setDialogPosition = null;
this.show = null;
this.hide = null;
this._handleOpenTopic = null;
this._handlePositionTopic = null;
