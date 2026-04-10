/**
 * UPS — 02_status_camera / page / before_unload
 *
 * 3D 페이지 before_unload 시점
 * - 인터벌 정지
 * - 이벤트 핸들러 해제
 * - 데이터 매핑 해제
 * - 3D 레이캐스팅 정리
 * - 3D 리소스 정리
 */

const { unregisterMapping } = GlobalDataPublisher;
const { offEventBusHandlers, disposeAllThreeResources, withSelector } = Wkit;
const { each, go } = fx;

// ======================
// INTERVAL CLEANUP
// ======================

if (this.stopAllIntervals) {
    this.stopAllIntervals();
}
this.pageIntervals = null;

// ======================
// EVENT BUS CLEANUP
// ======================

offEventBusHandlers(this.pageEventBusHandlers);
this.pageEventBusHandlers = null;

// ======================
// DATA PUBLISHER CLEANUP
// ======================

go(
    this.pageDataMappings,
    each(({ topic }) => unregisterMapping(topic))
);

this.pageDataMappings = null;
this.pageParams = null;

// ======================
// 3D RAYCASTING CLEANUP
// ======================

withSelector(this.appendElement, 'canvas', canvas => {
    if (this.raycastingEvents) {
        go(
            this.raycastingEvents,
            each(({ type, handler }) => canvas.removeEventListener(type, handler))
        );
        this.raycastingEvents = null;
    }
});

// ======================
// 3D RESOURCES CLEANUP
// ======================

disposeAllThreeResources(this);
