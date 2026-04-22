const { unsubscribe } = GlobalDataPublisher;
const { each, go } = fx;

// 3. 이벤트 제거

if (this._tabClickHandler) {
  this.appendElement.removeEventListener("click", this._tabClickHandler);
}
if (this._tabKeydownHandler) {
  this.appendElement.removeEventListener("keydown", this._tabKeydownHandler);
}

// 2. 구독 해제

go(
  Object.entries(this.subscriptions),
  each(([topic, _]) => unsubscribe(topic, this)),
);
this.subscriptions = null;

// 1. 자체 상태 및 Mixin 정리

this._tabClickHandler = null;
this._tabKeydownHandler = null;
this._tabsData = null;
this.getItemElement = null;
this.normalizeItems = null;
this.syncAccessibility = null;
this.renderPanel = null;
this.selectItem = null;
this.selectAdjacent = null;
this.renderTabItems = null;
this.cssSelectors = null;
this.listRender.destroy();
