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

this._clearClickHandler = null;
this.getElement = null;
this.normalizeTextFieldInfo = null;
this.syncState = null;
this.clearValue = null;
this.renderTextFieldInfo = null;
this.fieldRender.destroy();
