const { unsubscribe } = GlobalDataPublisher;
const { each, go } = fx;

if (this._rafId) cancelAnimationFrame(this._rafId);
this._outerEl?.removeEventListener("scroll", this._handleScroll);
this._resizeObserver?.disconnect?.();

go(
  Object.entries(this.subscriptions || {}),
  each(([topic]) => unsubscribe(topic, this)),
);

this.listRender?.destroy?.();
this.subscriptions = null;
