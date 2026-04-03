/**
 * CameraFocusMixin
 *
 * 보는 위치를 전환한다.
 *
 * 3D 장면에서 특정 메시나 좌표로 카메라를 부드럽게 이동시킨다.
 * 포커스 대상 전환과 애니메이션을 관리한다.
 *
 * ─────────────────────────────────────────────────────────────
 * 사용 예시:
 *
 *   applyCameraFocusMixin(this, {
 *       camera: this.camera,
 *       controls: this.controls,
 *       duration: 1000
 *   });
 *
 *   // focusOn 호출 시 container와 meshName을 지정
 *   this.cameraFocus.focusOn({
 *       container: gltfInstance.appendElement,
 *       meshName: 'pump-01'
 *   });
 *
 * ─────────────────────────────────────────────────────────────
 * Mixin이 주입하는 것 (네임스페이스: this.cameraFocus):
 *
 *   this.cameraFocus.focusOn        — 대상으로 카메라 이동
 *   this.cameraFocus.focusOnPosition — 좌표로 카메라 이동
 *   this.cameraFocus.reset          — 초기 위치로 복귀
 *   this.cameraFocus.destroy        — 정리
 *
 * ─────────────────────────────────────────────────────────────
 */

function applyCameraFocusMixin(instance, options) {
    const {
        camera: defaultCamera,
        controls: defaultControls,
        duration = 1000
    } = options;

    const ns = {};
    instance.cameraFocus = ns;

    let animationId = null;
    let initialPosition = null;
    let initialTarget = null;

    /**
     * 초기 카메라 위치 저장
     */
    function saveInitialState(camera, controls) {
        if (initialPosition) return;
        if (!camera) return;

        initialPosition = camera.position.clone();
        initialTarget = controls ? controls.target.clone() : null;
    }

    /**
     * 대상 메시로 카메라 이동
     *
     * @param {Object} params
     * @param {THREE.Object3D} params.container - 메시를 찾을 3D 컨테이너
     * @param {string} params.meshName - 포커스 대상 메시 이름
     * @param {Object} [params.offset] - 카메라 오프셋 { x, y, z }
     * @param {THREE.Camera} [params.camera] - 카메라 (기본값 override)
     * @param {Object} [params.controls] - 컨트롤 (기본값 override)
     */
    ns.focusOn = function(params) {
        const {
            container,
            meshName,
            offset,
            camera = defaultCamera,
            controls = defaultControls
        } = params;

        if (!container) return;

        const mesh = container.getObjectByName(meshName);
        if (!mesh) return;

        saveInitialState(camera, controls);

        const box = new THREE.Box3().setFromObject(mesh);
        const targetPos = box.getCenter(new THREE.Vector3());
        const cameraPos = targetPos.clone();

        if (offset) {
            cameraPos.x += offset.x || 0;
            cameraPos.y += offset.y || 0;
            cameraPos.z += offset.z || 0;
        } else {
            cameraPos.y += 5;
            cameraPos.z += 10;
        }

        animateCamera(camera, controls, cameraPos, targetPos);
    };

    /**
     * 좌표로 카메라 이동
     *
     * @param {Object} params
     * @param {{ x, y, z }} params.position - 카메라 위치
     * @param {{ x, y, z }} params.target - 카메라가 바라볼 위치
     * @param {THREE.Camera} [params.camera] - 카메라 (기본값 override)
     * @param {Object} [params.controls] - 컨트롤 (기본값 override)
     */
    ns.focusOnPosition = function(params) {
        const {
            position,
            target,
            camera = defaultCamera,
            controls = defaultControls
        } = params;

        saveInitialState(camera, controls);
        animateCamera(camera, controls, position, target);
    };

    /**
     * 초기 위치로 복귀
     *
     * @param {Object} [params]
     * @param {THREE.Camera} [params.camera] - 카메라 (기본값 override)
     * @param {Object} [params.controls] - 컨트롤 (기본값 override)
     */
    ns.reset = function(params) {
        if (!initialPosition) return;

        const camera = (params && params.camera) || defaultCamera;
        const controls = (params && params.controls) || defaultControls;

        animateCamera(camera, controls, initialPosition, initialTarget);
    };

    /**
     * 카메라 애니메이션 (내부)
     */
    function animateCamera(camera, controls, targetCameraPos, targetLookAt) {
        if (animationId) cancelAnimationFrame(animationId);
        if (!camera) return;

        const startPos = camera.position.clone();
        const startTarget = controls ? controls.target.clone() : null;
        const startTime = performance.now();

        function animate(now) {
            const elapsed = now - startTime;
            const t = Math.min(elapsed / duration, 1);
            const eased = easeInOutCubic(t);

            camera.position.lerpVectors(startPos, targetCameraPos, eased);

            if (controls && startTarget && targetLookAt) {
                controls.target.lerpVectors(startTarget, targetLookAt, eased);
                controls.update();
            }

            if (t < 1) {
                animationId = requestAnimationFrame(animate);
            } else {
                animationId = null;
            }
        }

        animationId = requestAnimationFrame(animate);
    }

    function easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    /**
     * 정리
     */
    ns.destroy = function() {
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
        initialPosition = null;
        initialTarget = null;
        ns.focusOn = null;
        ns.focusOnPosition = null;
        ns.reset = null;
        instance.cameraFocus = null;
    };
}
