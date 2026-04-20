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

if (this._keyHandler) {
  this.appendElement.removeEventListener("keydown", this._keyHandler);
}

this._keyHandler = null;
this.getItemElement = null;
this.syncAccessibility = null;
this.toggleItem = null;
this.renderSwitchItems = null;
this.listRender.destroy();
