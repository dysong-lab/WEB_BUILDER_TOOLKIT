const { unsubscribe } = GlobalDataPublisher;
const { removeCustomEvents } = Wkit;
const { each, go } = fx;

// 3. 이벤트 제거
removeCustomEvents(this, this.customEvents);
this.customEvents = null;

// 2. 구독 해제
go(
    Object.entries(this.subscriptions),
    each(([topic, _]) => unsubscribe(topic, this))
);
this.subscriptions = null;

// 1. Mixin 정리 (팝업 내부 → 팝업 순서)
if (this._popupScope && this._popupScope.fieldRender) {
    this._popupScope.fieldRender.destroy();
}
this._popupScope = null;
this.shadowPopup.destroy();
