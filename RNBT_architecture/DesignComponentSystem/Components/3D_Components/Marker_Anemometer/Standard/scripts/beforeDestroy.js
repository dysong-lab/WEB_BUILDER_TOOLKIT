/**
 * Marker_Anemometer — Standard (01_status) / scripts / beforeDestroy
 *
 * MeshStateMixin 정리
 */

const { unsubscribe } = GlobalDataPublisher;
const { each, go } = fx;

// 구독 해제
go(
    Object.entries(this.subscriptions),
    each(([topic, _]) => unsubscribe(topic, this))
);
this.subscriptions = null;


this.meshState?.destroy();
