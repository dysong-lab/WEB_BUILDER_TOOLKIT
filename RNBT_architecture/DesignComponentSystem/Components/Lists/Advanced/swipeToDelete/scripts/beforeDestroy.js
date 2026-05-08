const { unsubscribe } = GlobalDataPublisher;
const { each, go } = fx;

this.appendElement?.removeEventListener("pointerdown", this._handlePointerDown);
this.appendElement?.removeEventListener("pointermove", this._handlePointerMove);
this.appendElement?.removeEventListener("pointerup", this._handlePointerUp);
this.appendElement?.removeEventListener("pointercancel", this._handlePointerCancel);
this.appendElement?.removeEventListener("click", this._handleClickCapture, true);
this.appendElement?.removeEventListener("click", this._clickHandler);

go(
  Object.entries(this.subscriptions || {}),
  each(([topic]) => unsubscribe(topic, this)),
);

this.listRender?.destroy?.();
this.subscriptions = null;
