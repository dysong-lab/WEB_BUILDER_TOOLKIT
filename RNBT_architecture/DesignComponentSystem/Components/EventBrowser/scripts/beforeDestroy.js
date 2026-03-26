/**
 * EventBrowser 컴포넌트 — 정리
 *
 * 역순: 팝업 내부 Mixin → 팝업 → 이벤트 → 목록
 */

if (this._popupScope && this._popupScope.listRender) {
    this._popupScope.listRender.destroy();
}
this.shadowPopup.destroy();
Wkit.removeCustomEvents(this, this.customEvents);
this.listRender.destroy();
