/**
 * ClippingPlaneMixin
 *
 * 3D 모델의 내부를 보여준다.
 *
 * ClippingPlane으로 특정 평면 기준 절단면을 표시하고,
 * 절단 위치를 애니메이션으로 이동시킨다.
 * instance.appendElement를 순회하여 대상 메시들의
 * material.clippingPlanes에 Plane을 할당한다.
 *
 * ─────────────────────────────────────────────────────────────
 * 사용 예시:
 *
 *   applyClippingPlaneMixin(this, {
 *       renderer: wemb.threeElements.renderer
 *   });
 *
 *   this.clipping.setPlane('y', 5);
 *   this.clipping.enable();
 *   this.clipping.animate(0, 10, 1000);
 *
 * ─────────────────────────────────────────────────────────────
 * Mixin이 주입하는 것 (네임스페이스: this.clipping):
 *
 *   this.clipping.setPlane          — 축 기반 절단면 설정
 *   this.clipping.setPlaneFromNormal — 임의 법선 벡터 기반 절단면 설정
 *   this.clipping.enable            — 절단 활성화
 *   this.clipping.disable           — 절단 비활성화
 *   this.clipping.isEnabled         — 활성 상태 조회
 *   this.clipping.animate           — 절단면 위치 애니메이션
 *   this.clipping.destroy           — 정리
 *
 * ─────────────────────────────────────────────────────────────
 */

function applyClippingPlaneMixin(instance, options) {
    const { renderer } = options;

    const ns = {};
    instance.clipping = ns;

    renderer.localClippingEnabled = true;

    const plane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
    let enabled = false;
    let rafId = null;

    /**
     * appendElement 내의 모든 메시를 순회하여 콜백 실행
     */
    function traverseMeshes(callback) {
        instance.appendElement.traverse(function(child) {
            if (child.isMesh && child.material) {
                callback(child);
            }
        });
    }

    /**
     * 메시들에 clippingPlanes 할당/해제
     */
    function applyClippingToMeshes() {
        const planes = enabled ? [plane] : [];
        traverseMeshes(function(mesh) {
            mesh.material = mesh.material.clone();
            mesh.material.clippingPlanes = planes;
        });
    }

    /**
     * 축 기반 절단면 설정
     *
     * @param {string} axis - 'x', 'y', 'z'
     * @param {number} position - 절단 위치
     */
    ns.setPlane = function(axis, position) {
        const normal = new THREE.Vector3(0, 0, 0);
        if (axis === 'x') normal.x = -1;
        else if (axis === 'y') normal.y = -1;
        else if (axis === 'z') normal.z = -1;

        plane.normal.copy(normal);
        plane.constant = position;

        if (enabled) applyClippingToMeshes();
    };

    /**
     * 임의 법선 벡터 기반 절단면 설정
     *
     * @param {Object} params
     * @param {{ x, y, z }} params.normal - 평면 법선 벡터
     * @param {number} params.constant - 평면까지의 거리
     */
    ns.setPlaneFromNormal = function(params) {
        const { normal, constant } = params;
        plane.normal.set(normal.x, normal.y, normal.z);
        plane.constant = constant;

        if (enabled) applyClippingToMeshes();
    };

    /**
     * 절단 활성화
     */
    ns.enable = function() {
        if (enabled) return;
        enabled = true;
        applyClippingToMeshes();
    };

    /**
     * 절단 비활성화
     */
    ns.disable = function() {
        if (!enabled) return;
        enabled = false;
        applyClippingToMeshes();
    };

    /**
     * 절단 활성 상태 조회
     *
     * @returns {boolean}
     */
    ns.isEnabled = function() {
        return enabled;
    };

    /**
     * 절단면 위치를 애니메이션으로 이동
     *
     * @param {number} from - 시작 위치
     * @param {number} to - 끝 위치
     * @param {number} [duration=1000] - 애니메이션 시간 (ms)
     */
    ns.animate = function(from, to, duration) {
        if (rafId !== null) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }

        const animDuration = duration || 1000;
        const startTime = performance.now();

        if (!enabled) {
            enabled = true;
        }

        plane.constant = from;
        applyClippingToMeshes();

        function tick(now) {
            const elapsed = now - startTime;
            const t = Math.min(elapsed / animDuration, 1);
            const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

            plane.constant = from + (to - from) * eased;
            applyClippingToMeshes();

            if (t < 1) {
                rafId = requestAnimationFrame(tick);
            } else {
                rafId = null;
            }
        }

        rafId = requestAnimationFrame(tick);
    };

    /**
     * 정리
     */
    ns.destroy = function() {
        if (rafId !== null) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }

        // 모든 메시의 clippingPlanes 해제
        traverseMeshes(function(mesh) {
            mesh.material.clippingPlanes = [];
        });

        enabled = false;
        ns.setPlane = null;
        ns.setPlaneFromNormal = null;
        ns.enable = null;
        ns.disable = null;
        ns.isEnabled = null;
        ns.animate = null;
        instance.clipping = null;
    };
}
