/**
 * area_01 — Advanced/highlight / scripts / beforeDestroy
 *
 * meshHighlight + meshState 정리
 */

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

this.meshHighlight?.destroy();
this.meshState?.destroy();
