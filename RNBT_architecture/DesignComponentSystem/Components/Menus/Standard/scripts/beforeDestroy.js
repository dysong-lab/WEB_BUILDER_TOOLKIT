/**
 * Menus — Standard 정리
 */

// 3. 이벤트 제거

if (this.shadowPopup) {
  this.shadowPopup.removePopupEvents();
}

if (this._motionTimer) {
  clearTimeout(this._motionTimer);
}
this._motionTimer = null;

if (this._popupScope && this._popupScope.listRender) {
  this._popupScope.listRender.destroy();
}
this._popupScope = null;

if (this.shadowPopup) {
  this.shadowPopup.destroy();
}

this.openMenu = null;
this.closeMenu = null;

// 2. 구독 해제

this.subscriptions = null;

// 1. 자체 상태 및 Mixin 정리

this._motionDuration = null;
