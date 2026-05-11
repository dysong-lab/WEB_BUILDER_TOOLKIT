const { unsubscribe } = GlobalDataPublisher;
const { removeCustomEvents } = Wkit;
const { each, go } = fx;
this.appendElement.removeEventListener("dragstart", this._dragStartHandler);
this.appendElement.removeEventListener("dragover", this._dragOverHandler);
this.appendElement.removeEventListener("dragleave", this._dragLeaveHandler);
this.appendElement.removeEventListener("drop", this._dropHandler);
this.appendElement.removeEventListener("dragend", this._dragEndHandler);
removeCustomEvents(this, this.customEvents);
go(
  Object.entries(this.subscriptions),
  each(([topic, _]) => unsubscribe(topic, this)),
);
this.subscriptions = null;
if (this.listRender) this.listRender.destroy();
