const { unsubscribe } = GlobalDataPublisher;
const { each, go } = fx;

this.appendElement.removeEventListener('pointerdown', this._boundPointerDown);
this.appendElement.removeEventListener('pointermove', this._boundPointerMove);
this.appendElement.removeEventListener('pointerup', this._boundPointerUp);
this.appendElement.removeEventListener('pointercancel', this._boundPointerCancel);
this.appendElement.removeEventListener('click', this._boundClickCapture, true);
this.appendElement.removeEventListener('click', this._boundActionClick);

go(
    Object.entries(this.subscriptions),
    each(([topic, _]) => unsubscribe(topic, this))
);

this.subscriptions = null;
this.fieldRender.destroy();
