const { unsubscribe } = GlobalDataPublisher;
const { each, go } = fx;

if (this._listClickHandler) {
  this.appendElement.removeEventListener("click", this._listClickHandler);
}
if (this._listKeydownHandler) {
  this.appendElement.removeEventListener("keydown", this._listKeydownHandler);
}

go(
  Object.entries(this.subscriptions),
  each(([topic, _]) => unsubscribe(topic, this)),
);

this.subscriptions = null;
this.customEvents = null;
this._listClickHandler = null;
this._listKeydownHandler = null;
this.getItemElement = null;
this.setSelected = null;
this.toggleSelection = null;
this.renderListItems = null;
this.listRender.destroy();
