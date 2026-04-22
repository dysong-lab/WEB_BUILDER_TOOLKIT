/**
 * BottomSheets — Standard 정리
 */

// 3. 이벤트 제거

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

// 2. 구독 해제

this.subscriptions = null;

// 1. 자체 상태 및 Mixin 정리

this._sheetMotionDuration = null;
