/**
 * STATCOM_Submodule — Advanced/animation / scripts / beforeDestroy
 *
 * MeshStateMixin + AnimationMixin 정리
 */

const { unsubscribe } = GlobalDataPublisher;
const { each, go } = fx;

go(
    Object.entries(this.subscriptions),
    each(([topic, _]) => unsubscribe(topic, this))
);
this.subscriptions = null;

this.animation?.destroy();
this.meshState?.destroy();
