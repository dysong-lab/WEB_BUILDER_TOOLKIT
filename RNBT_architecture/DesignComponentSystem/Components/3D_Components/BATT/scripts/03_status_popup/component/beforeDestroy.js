/**
 * BATT — 03_status_popup / component / beforeDestroy
 *
 * MeshStateMixin + 3DShadowPopupMixin 정리
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
this.meshState?.destroy();
this.shadowPopup?.destroy();
