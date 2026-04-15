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

if (this._radioKeydownHandler) {
    this.appendElement.removeEventListener('keydown', this._radioKeydownHandler);
}

this._radioKeydownHandler = null;
this.getItemElement = null;
this.syncAccessibility = null;
this.selectItem = null;
this.selectAdjacent = null;
this.renderRadioItems = null;
this.listRender.destroy();
