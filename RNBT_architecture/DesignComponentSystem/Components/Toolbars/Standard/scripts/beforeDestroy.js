const { unsubscribe } = GlobalDataPublisher;
const { each, go } = fx;

// 3. 이벤트 제거

if (this._toolbarClickHandler) {
  this.appendElement.removeEventListener("click", this._toolbarClickHandler);
}

// 2. 구독 해제

go(
  Object.entries(this.subscriptions),
  each(([topic, _]) => unsubscribe(topic, this)),
);
this.subscriptions = null;

// 1. 자체 상태 및 Mixin 정리

this._toolbarClickHandler = null;
this._overflowOpen = null;
this._toolbarActions = null;
this.getActionElement = null;
this.normalizeToolbarInfo = null;
this.setActiveAction = null;
this.toggleOverflow = null;
this.renderToolbarInfo = null;
this.listRender.destroy();
this.fieldRender.destroy();
