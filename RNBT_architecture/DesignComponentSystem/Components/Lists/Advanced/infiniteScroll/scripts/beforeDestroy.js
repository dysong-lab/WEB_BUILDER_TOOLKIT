const { unsubscribe } = GlobalDataPublisher;
const { each, go } = fx;

this._intersectionObserver?.disconnect?.();

go(
  Object.entries(this.subscriptions || {}),
  each(([topic]) => unsubscribe(topic, this)),
);

this.listRender?.destroy?.();
this.subscriptions = null;
