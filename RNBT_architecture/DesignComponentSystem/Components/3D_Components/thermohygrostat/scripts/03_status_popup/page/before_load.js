/**
 * thermohygrostat — 03_status_popup / page / before_load
 *
 * 3D 페이지 before_load 시점
 * - 이벤트 핸들러 등록 (3D 클릭 → 팝업 표시)
 * - 3D 레이캐스팅 설정
 */

const { onEventBusHandlers, initThreeRaycasting, withSelector } = Wkit;

// ======================
// EVENT BUS HANDLERS
// ======================

this.pageEventBusHandlers = {
    '@thermohygrostatClicked': ({ targetInstance }) => {
        targetInstance.showDetail();
    }
};

onEventBusHandlers(this.pageEventBusHandlers);

// ======================
// 3D RAYCASTING SETUP
// ======================

this.raycastingEvents = withSelector(this.appendElement, 'canvas', canvas =>
    fx.go(
        [{ type: 'click' }],
        fx.map(event => ({
            ...event,
            handler: initThreeRaycasting(canvas, event.type)
        }))
    )
);
