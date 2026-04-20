const { unsubscribe } = GlobalDataPublisher;
const { each, go } = fx;

go(
  Object.entries(this.subscriptions),
  each(([topic, _]) => unsubscribe(topic, this)),
);
this.subscriptions = null;

if (this._hideTimer) {
  clearTimeout(this._hideTimer);
}
this._hideTimer = null;

if (this._triggerEnterHandler) {
  this.appendElement.removeEventListener("mouseenter", this._triggerEnterHandler, true);
  this.appendElement.removeEventListener("focusin", this._triggerEnterHandler);
}
if (this._triggerLeaveHandler) {
  this.appendElement.removeEventListener("mouseleave", this._triggerLeaveHandler, true);
  this.appendElement.removeEventListener("focusout", this._triggerLeaveHandler);
}

if (this._popupScope && this._popupScope.fieldRender) {
  this._popupScope.fieldRender.destroy();
}
this._popupScope = null;

if (this.shadowPopup) {
  this.shadowPopup.removePopupEvents();
  this.shadowPopup.destroy();
}

this._tooltipInfo = null;
this._triggerEnterHandler = null;
this._triggerLeaveHandler = null;
this.normalizeTooltipInfo = null;
this.renderTooltipInfo = null;
this.openTooltip = null;
this.closeTooltip = null;
this.cssSelectors = null;
