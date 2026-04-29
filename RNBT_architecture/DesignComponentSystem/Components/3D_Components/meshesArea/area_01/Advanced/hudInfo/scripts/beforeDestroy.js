/**
 * area_01 — Advanced/hudInfo / scripts / beforeDestroy
 *
 * MeshStateMixin + FieldRenderMixin + renderHud 정리
 */

const { unsubscribe } = GlobalDataPublisher;
const { each, go } = fx;

go(
    Object.entries(this.subscriptions),
    each(([topic, _]) => unsubscribe(topic, this))
);
this.subscriptions = null;

this.hudRoot = null;
this.renderHud = null;
this.fieldRender?.destroy();
this.meshState?.destroy();
