const { unsubscribe } = GlobalDataPublisher;
const { each, go } = fx;

this.appendElement?.removeEventListener("click", this._handleSelect);

go(
  Object.entries(this.subscriptions || {}),
  each(([topic]) => unsubscribe(topic, this)),
);

this.listRender?.destroy?.();
this.subscriptions = null;
