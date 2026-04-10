/**
 * Dialogs — Standard 정리
 */

if (this.shadowPopup) {
    this.shadowPopup.removePopupEvents();
}

if (this._popupScope && this._popupScope.fieldRender) {
    this._popupScope.fieldRender.destroy();
}
this._popupScope = null;

if (this.shadowPopup) {
    this.shadowPopup.destroy();
}

this.openDialog = null;
this.closeDialog = null;
this.subscriptions = null;
