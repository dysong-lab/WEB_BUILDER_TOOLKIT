/**
 * BATT — 03_status_popup / component / beforeDestroy
 *
 * MeshStateMixin + 3DShadowPopupMixin 정리
 */

const { unsubscribe } = GlobalDataPublisher;
const { removeCustomEvents } = Wkit;
const { each, go } = fx;

// 3. 이벤트 제거
removeCustomEvents(this, this.customEvents);
this.customEvents = null;
this.showDetail = null;

// 2. 구독 해제
go(
    Object.entries(this.subscriptions),
    each(([topic, _]) => unsubscribe(topic, this))
);
this.subscriptions = null;

// 1. Mixin 정리 (적용 역순)
this.shadowPopup?.destroy();
this.meshState?.destroy();
