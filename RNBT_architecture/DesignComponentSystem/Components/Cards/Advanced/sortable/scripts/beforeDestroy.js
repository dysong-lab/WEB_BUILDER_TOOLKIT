const { unsubscribe } = GlobalDataPublisher;
const { removeCustomEvents } = Wkit;
const { each, go } = fx;

removeCustomEvents(this, this.customEvents);

this.appendElement.removeEventListener('dragstart', this._boundDragStart);
this.appendElement.removeEventListener('dragover', this._boundDragOver);
this.appendElement.removeEventListener('dragleave', this._boundDragLeave);
this.appendElement.removeEventListener('drop', this._boundDrop);
this.appendElement.removeEventListener('dragend', this._boundDragEnd);

go(
    Object.entries(this.subscriptions),
    each(([topic, _]) => unsubscribe(topic, this))
);

this.subscriptions = null;
this.customEvents = null;
this._currentOrder = null;
this._currentItems = null;
this._draggingId = null;
this.listRender.destroy();
