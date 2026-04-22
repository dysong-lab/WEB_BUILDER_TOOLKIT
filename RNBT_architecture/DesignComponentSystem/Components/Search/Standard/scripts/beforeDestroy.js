const { unsubscribe } = GlobalDataPublisher;
const { removeCustomEvents } = Wkit;
const { each, go } = fx;

// 3. 이벤트 제거

removeCustomEvents(this, this.customEvents);
this.customEvents = null;

// 2. 구독 해제

go(
  Object.entries(this.subscriptions),
  each(([topic, _]) => unsubscribe(topic, this)),
);
this.subscriptions = null;

// 1. 자체 상태 및 Mixin 정리

if (this._clearClickHandler) {
  this.appendElement.removeEventListener("click", this._clearClickHandler);
}
if (this._submitClickHandler) {
  this.appendElement.removeEventListener("click", this._submitClickHandler);
}
if (this._submitHandler) {
  this.appendElement.removeEventListener("submit", this._submitHandler);
}

this._clearClickHandler = null;
this._submitClickHandler = null;
this._submitHandler = null;
this.getElement = null;
this.syncControls = null;
this.clearQuery = null;
this.renderSearchInfo = null;
this.cssSelectors = null;
