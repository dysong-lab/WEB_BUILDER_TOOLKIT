const { unsubscribe } = GlobalDataPublisher;
const { removeCustomEvents } = Wkit;
const { each, go } = fx;

this.appendElement.removeEventListener("click", this._mainClickHandler);
this.appendElement.removeEventListener("click", this._itemClickHandler);
document.removeEventListener("click", this._outsideClickHandler, true);
document.removeEventListener("keydown", this._escKeyHandler);

removeCustomEvents(this, this.customEvents);
this.customEvents = null;

go(
  Object.entries(this.subscriptions),
  each(([topic, _]) => unsubscribe(topic, this)),
);
this.subscriptions = null;

if (this.fieldRender) {
  this.fieldRender.destroy();
}
if (this.listRender) {
  this.listRender.destroy();
}

this.renderExtendedFabInfo = null;
this.renderSpeedDialItems = null;
this._open = null;
this._close = null;
this._handleMainClick = null;
this._handleItemClick = null;
this._handleOutsideClick = null;
this._handleEscKey = null;
this._mainClickHandler = null;
this._itemClickHandler = null;
this._outsideClickHandler = null;
this._escKeyHandler = null;
