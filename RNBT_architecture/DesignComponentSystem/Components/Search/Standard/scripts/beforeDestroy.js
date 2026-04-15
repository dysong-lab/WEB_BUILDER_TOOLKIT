const { unsubscribe } = GlobalDataPublisher;
const { removeCustomEvents } = Wkit;
const { each, go } = fx;

removeCustomEvents(this, this.customEvents);
this.customEvents = null;

go(
  Object.entries(this.subscriptions),
  each(([topic, _]) => unsubscribe(topic, this)),
);
this.subscriptions = null;

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
