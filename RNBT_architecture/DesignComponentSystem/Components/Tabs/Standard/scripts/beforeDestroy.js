const { unsubscribe } = GlobalDataPublisher;
const { each, go } = fx;

go(
  Object.entries(this.subscriptions),
  each(([topic, _]) => unsubscribe(topic, this)),
);
this.subscriptions = null;

if (this._tabClickHandler) {
  this.appendElement.removeEventListener("click", this._tabClickHandler);
}
if (this._tabKeydownHandler) {
  this.appendElement.removeEventListener("keydown", this._tabKeydownHandler);
}

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
