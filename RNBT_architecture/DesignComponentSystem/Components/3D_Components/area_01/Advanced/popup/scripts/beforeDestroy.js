/**
 * area_01 — Advanced/popup / scripts / beforeDestroy
 *
 * shadowPopup + meshState 정리
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

this.shadowPopup?.destroy();
this.meshState?.destroy();
