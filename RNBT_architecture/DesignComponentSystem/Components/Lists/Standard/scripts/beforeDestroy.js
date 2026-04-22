const { unsubscribe } = GlobalDataPublisher;
const { each, go } = fx;

// 3. 이벤트 제거

if (this._listClickHandler) {
  this.appendElement.removeEventListener("click", this._listClickHandler);
}
if (this._listKeydownHandler) {
  this.appendElement.removeEventListener("keydown", this._listKeydownHandler);
}

// 2. 구독 해제

go(
  Object.entries(this.subscriptions),
  each(([topic, _]) => unsubscribe(topic, this)),
);

this.subscriptions = null;

// 1. 자체 상태 및 Mixin 정리

this.customEvents = null;
this._listClickHandler = null;
this._listKeydownHandler = null;
this.getItemElement = null;
this.setSelected = null;
this.toggleSelection = null;
this.renderListItems = null;
this.listRender.destroy();
