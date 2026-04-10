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

this.appendElement.removeEventListener("click", this._handleSuggestionSelection);
this._handleSuggestionSelection = null;
this.acceptSuggestion = null;
this.listRender.destroy();
