const { unsubscribe } = GlobalDataPublisher;
const { each, go } = fx;

go(
  Object.entries(this.subscriptions),
  each(([topic, _]) => unsubscribe(topic, this)),
);
this.subscriptions = null;

if (this._toolbarClickHandler) {
  this.appendElement.removeEventListener("click", this._toolbarClickHandler);
}

this._toolbarClickHandler = null;
this._overflowOpen = null;
this.getActionElement = null;
this.normalizeToolbarInfo = null;
this.toggleOverflow = null;
this.renderToolbarInfo = null;
this.listRender.destroy();
this.fieldRender.destroy();
