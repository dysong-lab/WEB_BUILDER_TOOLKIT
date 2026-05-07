const { unsubscribe } = GlobalDataPublisher;
const { removeCustomEvents } = Wkit;
const { each, go } = fx;

removeCustomEvents(this, this.customEvents);
this.customEvents = null;

if (this._toggleHandler) {
    this.appendElement.removeEventListener('click', this._toggleHandler);
}

go(
    Object.entries(this.subscriptions),
    each(([topic, _]) => unsubscribe(topic, this))
);

this.subscriptions = null;
this._renderCardInfo = null;
this._handleExternalSet = null;
this._handleToggle = null;
this._toggleHandler = null;
this.setExpanded = null;
this._expand = null;
this._collapse = null;
this._setExpanded = null;
this._cardId = null;
this.fieldRender.destroy();
