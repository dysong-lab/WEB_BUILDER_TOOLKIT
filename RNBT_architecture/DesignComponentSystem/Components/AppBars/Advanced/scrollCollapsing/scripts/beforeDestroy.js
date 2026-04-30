const { unsubscribe } = GlobalDataPublisher;
const { removeCustomEvents } = Wkit;
const { each, go } = fx;

removeCustomEvents(this, this.customEvents);
this.customEvents = null;

go(
    Object.entries(this.subscriptions),
    each(([topic, _]) => unsubscribe(topic, this))
);
this.subscriptions = null;

this.detachScrollListener();
this.detachScrollListener = null;
this.attachScrollListener = null;
this.syncScrollState = null;
this.collapse = null;
this.expand = null;
this.scrollState = null;

this.fieldRender.destroy();
