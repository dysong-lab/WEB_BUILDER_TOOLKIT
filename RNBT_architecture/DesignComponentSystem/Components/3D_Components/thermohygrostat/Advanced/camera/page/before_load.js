/**
 * thermohygrostat — 02_status_camera / page / before_load
 *
 * 3D 페이지 before_load 시점
 * - 이벤트 핸들러 등록
 * - 3D 레이캐스팅 설정
 */

const { onEventBusHandlers, initThreeRaycasting, withSelector } = Wkit;

// ======================
// EVENT BUS HANDLERS
// ======================

this.pageEventBusHandlers = {
    // 3D 오브젝트 클릭 → 카메라 포커스
    // '@thermohygrostatClicked': ({ targetInstance }) => {
    //     targetInstance.cameraFocus.focusOn({
    //         container: targetInstance.appendElement,
    //         meshName: 'thermohygrostat',
    //         offset: { x: 1.5, y: 1.0, z: 3.0 }
    //     });
    // }
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
