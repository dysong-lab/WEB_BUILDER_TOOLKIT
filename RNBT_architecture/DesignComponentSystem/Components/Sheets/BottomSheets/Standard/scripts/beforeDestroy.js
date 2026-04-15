/**
 * BottomSheets — Standard 정리
 */

if (this.shadowPopup) {
  this.shadowPopup.removePopupEvents();
}

if (this._closeTimer) {
  clearTimeout(this._closeTimer);
}
this._closeTimer = null;

if (this._popupScope && this._popupScope.fieldRender) {
  this._popupScope.fieldRender.destroy();
}
this._popupScope = null;

if (this.shadowPopup) {
  this.shadowPopup.destroy();
}

this.renderBottomSheetContent = null;
this.openBottomSheet = null;
this.closeBottomSheet = null;
this.subscriptions = null;
this._sheetMotionDuration = null;
