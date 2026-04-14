/**
 * Chiller — Advanced/animation / scripts / beforeDestroy
 *
 * MeshStateMixin + AnimationMixin 정리
 */

const { unsubscribe } = GlobalDataPublisher;
const { each, go } = fx;

// 2. 구독 해제
go(
    Object.entries(this.subscriptions),
    each(([topic, _]) => unsubscribe(topic, this))
);
this.subscriptions = null;

// 1. Mixin 정리 (적용 역순)
this.animation?.destroy();
this.meshState?.destroy();
