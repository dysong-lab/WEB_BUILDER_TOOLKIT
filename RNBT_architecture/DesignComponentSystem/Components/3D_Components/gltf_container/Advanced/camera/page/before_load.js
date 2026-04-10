/**
 * gltf_container — 02_status_camera / page / before_load
 *
 * 3D 페이지 before_load 시점
 * - 이벤트 핸들러 등록 (Mesh 클릭 → 카메라 포커스)
 * - 3D 레이캐스팅 설정
 */

const { onEventBusHandlers, initThreeRaycasting, withSelector } = Wkit;

// ======================
// EVENT BUS HANDLERS
// ======================

this.pageEventBusHandlers = {
    '@meshClicked': ({ event, targetInstance }) => {
        const meshName = targetInstance.resolveMeshName(event);
        if (!meshName) return;

        targetInstance.cameraFocus.focusOn({
            container: targetInstance.appendElement,
            meshName: meshName,
            offset: { x: 0, y: 5, z: 10 }
        });
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
