/**
 * Menus — Standard 정리
 */

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
this.subscriptions = null;
this._motionDuration = null;
