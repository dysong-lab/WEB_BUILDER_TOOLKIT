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

if (this._inputSyncHandler) {
  this.appendElement.removeEventListener("input", this._inputSyncHandler);
}
if (this._changeSyncHandler) {
  this.appendElement.removeEventListener("change", this._changeSyncHandler);
}

this._inputSyncHandler = null;
this._changeSyncHandler = null;
this.getElement = null;
this.normalizeCenteredInfo = null;
this.syncCenteredUi = null;
this.renderCenteredSliderInfo = null;
this.cssSelectors = null;
