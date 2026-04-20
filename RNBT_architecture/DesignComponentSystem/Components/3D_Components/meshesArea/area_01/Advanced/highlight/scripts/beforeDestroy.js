/**
 * area_01 — Advanced/highlight / scripts / beforeDestroy
 *
 * MeshStateMixin + MeshHighlightMixin 정리
 */

const { unsubscribe } = GlobalDataPublisher;
const { each, go } = fx;

// 구독 해제
go(
    Object.entries(this.subscriptions),
    each(([topic, _]) => unsubscribe(topic, this))
);
this.subscriptions = null;


const { removeCustomEvents } = Wkit;

removeCustomEvents(this, this.customEvents);
this.meshHighlight?.destroy();
this.meshState?.destroy();
this.resolveMeshName = null;
