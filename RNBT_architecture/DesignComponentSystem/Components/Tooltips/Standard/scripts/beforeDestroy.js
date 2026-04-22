const { unsubscribe } = GlobalDataPublisher;
const { each, go } = fx;

// 3. 이벤트 제거

if (this._triggerElement && this._triggerEnterHandler) {
  this._triggerElement.removeEventListener("mouseenter", this._triggerEnterHandler);
  this._triggerElement.removeEventListener("focus", this._triggerEnterHandler);
}
if (this._triggerElement && this._triggerLeaveHandler) {
  this._triggerElement.removeEventListener("mouseleave", this._triggerLeaveHandler);
  this._triggerElement.removeEventListener("blur", this._triggerLeaveHandler);
}
if (this._outsidePointerHandler) {
  document.removeEventListener("pointerdown", this._outsidePointerHandler);
}
if (this.shadowPopup) {
  this.shadowPopup.removePopupEvents();
}

// 2. 구독 해제

go(
  Object.entries(this.subscriptions),
  each(([topic, _]) => unsubscribe(topic, this)),
);
this.subscriptions = null;

// 1. 자체 상태 및 Mixin 정리

if (this._hideTimer) {
  clearTimeout(this._hideTimer);
}
this._hideTimer = null;

if (this._popupScope && this._popupScope.fieldRender) {
  this._popupScope.fieldRender.destroy();
}
this._popupScope = null;

if (this.shadowPopup) {
  this.shadowPopup.destroy();
}

this._tooltipInfo = null;
this._triggerElement = null;
this._triggerEnterHandler = null;
this._triggerLeaveHandler = null;
this._outsidePointerHandler = null;
this.ensureTooltipPopup = null;
this.normalizeTooltipInfo = null;
this.renderTooltipInfo = null;
this.openTooltip = null;
this.closeTooltip = null;
this.cssSelectors = null;
