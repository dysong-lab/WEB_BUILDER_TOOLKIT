/**
 * area_01 — Advanced/clipping / scripts / beforeDestroy
 *
 * MeshStateMixin + ClippingPlaneMixin 정리
 */

const { unsubscribe } = GlobalDataPublisher;
const { each, go } = fx;

go(
    Object.entries(this.subscriptions),
    each(([topic, _]) => unsubscribe(topic, this))
);
this.subscriptions = null;

this.clipping?.destroy();
this.meshState?.destroy();
