/**
 * area_01 — Advanced/camera / scripts / beforeDestroy
 *
 * cameraFocus + meshState 정리
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

this.cameraFocus?.destroy();
this.meshState?.destroy();
