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

this.appendElement.removeEventListener("click", this._handleChipClickLog);
this._handleChipClickLog = null;
this.toggleItem = null;
this.listRender.destroy();
