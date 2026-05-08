const { unsubscribe } = GlobalDataPublisher;
const { each, go } = fx;

this.appendElement?.removeEventListener("dragstart", this._handleDragStart);
this.appendElement?.removeEventListener("dragover", this._handleDragOver);
this.appendElement?.removeEventListener("dragleave", this._handleDragLeave);
this.appendElement?.removeEventListener("drop", this._handleDrop);
this.appendElement?.removeEventListener("dragend", this._handleDragEnd);
this.appendElement?.removeEventListener("click", this._handleClick);

go(
  Object.entries(this.subscriptions || {}),
  each(([topic]) => unsubscribe(topic, this)),
);

this.listRender?.destroy?.();
this.subscriptions = null;
