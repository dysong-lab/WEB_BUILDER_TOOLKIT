const { unsubscribe } = GlobalDataPublisher;
const { each, go } = fx;

if (this._groupClickHandler) {
  this.appendElement.removeEventListener("click", this._groupClickHandler, true);
}

go(
  Object.entries(this.subscriptions),
  each(([topic, _]) => unsubscribe(topic, this)),
);
this.subscriptions = null;

this._renderChoices = null;
this._applySelection = null;
this._setSelected = null;
this._handleSelect = null;
this._setSelectedFromTopic = null;
this._groupClickHandler = null;
this._selectedId = null;
this.listRender.destroy();
