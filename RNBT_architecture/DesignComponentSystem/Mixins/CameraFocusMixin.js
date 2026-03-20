/**
 * CameraFocusMixin
 *
 * 카메라를 특정 대상으로 이동시킨다.
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
 *       getMeshByName: this.getMeshByName,
 *       duration: 1000
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
    const { camera, controls, getMeshByName, duration = 1000 } = options;

    const ns = {};
    instance.cameraFocus = ns;

    let animationId = null;
    let initialPosition = null;
    let initialTarget = null;

    /**
     * 초기 카메라 위치 저장
     */
    function saveInitialState() {
        if (initialPosition) return;
        if (!camera) return;

        initialPosition = camera.position.clone();
        initialTarget = controls ? controls.target.clone() : null;
    }

    /**
     * 대상 메시로 카메라 이동
     *
     * @param {string} meshName - 포커스 대상 메시 이름
     * @param {Object} [offset] - 카메라 오프셋 { x, y, z }
     */
    ns.focusOn = function(meshName, offset) {
        const mesh = getMeshByName ? getMeshByName(meshName) : null;
        if (!mesh) return;

        saveInitialState();

        const targetPos = mesh.position.clone();
        const cameraPos = targetPos.clone();

        if (offset) {
            cameraPos.x += offset.x || 0;
            cameraPos.y += offset.y || 0;
            cameraPos.z += offset.z || 0;
        } else {
            cameraPos.y += 5;
            cameraPos.z += 10;
        }

        animateCamera(cameraPos, targetPos);
    };

    /**
     * 좌표로 카메라 이동
     *
     * @param {{ x, y, z }} position - 카메라 위치
     * @param {{ x, y, z }} target - 카메라가 바라볼 위치
     */
    ns.focusOnPosition = function(position, target) {
        saveInitialState();
        animateCamera(position, target);
    };

    /**
     * 초기 위치로 복귀
     */
    ns.reset = function() {
        if (!initialPosition) return;
        animateCamera(initialPosition, initialTarget);
    };

    /**
     * 카메라 애니메이션 (내부)
     */
    function animateCamera(targetCameraPos, targetLookAt) {
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
