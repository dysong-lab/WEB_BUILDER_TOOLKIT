const { unsubscribe } = GlobalDataPublisher;
const { each, go } = fx;

this._handleEls?.forEach((el) => {
    if (!el) return;
    el.removeEventListener('pointerdown', this._pointerDownHandler);
    el.removeEventListener('pointermove', this._pointerMoveHandler);
    el.removeEventListener('pointerup', this._pointerUpHandler);
    el.removeEventListener('pointercancel', this._pointerCancelHandler);
});

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
this._minWidth = null;
this._minHeight = null;
this._maxWidth = null;
this._maxHeight = null;
this._startX = null;
this._startY = null;
this._originW = null;
this._originH = null;
this._isPointerDown = null;
this._resizeDirection = null;
this._pointerId = null;
this._surfaceEl = null;
this._handleEls = null;
this._pointerDownHandler = null;
this._pointerMoveHandler = null;
this._pointerUpHandler = null;
this._pointerCancelHandler = null;
this._renderDialogInfo = null;
this._renderDialogActions = null;
this._clampSize = null;
this._applySize = null;
this._handlePointerDown = null;
this._handlePointerMove = null;
this._handlePointerUp = null;
this._handlePointerCancel = null;
this.setDialogSize = null;
this.show = null;
this.hide = null;
this._handleOpenTopic = null;
this._handleSizeTopic = null;
