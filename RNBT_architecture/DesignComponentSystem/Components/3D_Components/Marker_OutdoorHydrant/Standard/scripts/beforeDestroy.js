/**
 * Marker_OutdoorHydrant — Standard / scripts / beforeDestroy
 *
 * MeshStateMixin 정리
 */

const { unsubscribe } = GlobalDataPublisher;
const { each, go } = fx;

go(
    Object.entries(this.subscriptions),
    each(([topic, _]) => unsubscribe(topic, this))
);
this.subscriptions = null;

this.meshState?.destroy();
