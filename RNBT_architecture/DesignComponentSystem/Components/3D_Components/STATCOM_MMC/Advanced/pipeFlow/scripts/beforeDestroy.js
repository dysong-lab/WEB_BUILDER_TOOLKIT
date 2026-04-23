/**
 * STATCOM_MMC — Advanced/pipeFlow / scripts / beforeDestroy
 *
 * MeshStateMixin + pipeFlow 정리
 */

const { unsubscribe } = GlobalDataPublisher;
const { each, go } = fx;

go(
    Object.entries(this.subscriptions),
    each(([topic, _]) => unsubscribe(topic, this))
);
this.subscriptions = null;

this.pipeFlow?.destroy();
this.meshState?.destroy();
