/**
 * MeshVisibilityMixin
 *
 * 3D 장면의 특정 부분을 선택적으로 보여준다.
 *
 * 메시의 visible 속성을 토글하여 show/hide를 제어한다.
 * 층별 분리 보기, X-ray 뷰 등에서 사용한다.
 *
 * ─────────────────────────────────────────────────────────────
 * 사용 예시:
 *
 *   applyMeshVisibilityMixin(this, {});
 *
 *   // 층별 분리 보기
 *   this.meshVisibility.hideAll();
 *   this.meshVisibility.show('floor-3');
 *
 *   // X-ray 뷰 (외벽 숨기기)
 *   this.meshVisibility.hide('exterior-wall');
 *
 *   // 선택적 표시
 *   this.meshVisibility.showOnly(['floor-3', 'floor-4']);
 *
 * ─────────────────────────────────────────────────────────────
 * Mixin이 주입하는 것 (네임스페이스: this.meshVisibility):
 *
 *   this.meshVisibility.show          — 메시 보이기
 *   this.meshVisibility.hide          — 메시 숨기기
 *   this.meshVisibility.toggle        — 가시성 반전
 *   this.meshVisibility.showOnly      — 지정 목록만 보이기
 *   this.meshVisibility.showAll       — 전체 보이기
 *   this.meshVisibility.hideAll       — 전체 숨기기
 *   this.meshVisibility.isVisible     — 가시성 조회
 *   this.meshVisibility.destroy       — 정리
 *
 * ─────────────────────────────────────────────────────────────
 */

function applyMeshVisibilityMixin(instance, options) {
    const ns = {};
    instance.meshVisibility = ns;

    // meshName → boolean (가시성 상태 추적)
    const visibilityMap = new Map();

    /**
     * 지정 메시를 보이게 한다 (자식 포함)
     *
     * @param {string} meshName - 메시 이름
     */
    ns.show = function(meshName) {
        const mesh = instance.appendElement.getObjectByName(meshName);
        if (!mesh) return;

        mesh.visible = true;
        visibilityMap.set(meshName, true);
    };

    /**
     * 지정 메시를 숨긴다 (자식 포함)
     *
     * @param {string} meshName - 메시 이름
     */
    ns.hide = function(meshName) {
        const mesh = instance.appendElement.getObjectByName(meshName);
        if (!mesh) return;

        mesh.visible = false;
        visibilityMap.set(meshName, false);
    };

    /**
     * 지정 메시의 가시성을 반전한다
     *
     * @param {string} meshName - 메시 이름
     */
    ns.toggle = function(meshName) {
        const mesh = instance.appendElement.getObjectByName(meshName);
        if (!mesh) return;

        mesh.visible = !mesh.visible;
        visibilityMap.set(meshName, mesh.visible);
    };

    /**
     * 지정 목록의 메시만 보이게 하고 나머지는 숨긴다
     *
     * @param {string[]} meshNames - 보여줄 메시 이름 배열
     */
    ns.showOnly = function(meshNames) {
        const showSet = new Set(meshNames);

        visibilityMap.forEach(function(_, name) {
            if (showSet.has(name)) {
                ns.show(name);
            } else {
                ns.hide(name);
            }
        });

        // 아직 추적되지 않은 메시도 보이기
        meshNames.forEach(function(name) {
            if (!visibilityMap.has(name)) {
                ns.show(name);
            }
        });
    };

    /**
     * 모든 추적 중인 메시를 보이게 한다
     */
    ns.showAll = function() {
        visibilityMap.forEach(function(_, name) {
            ns.show(name);
        });
    };

    /**
     * 모든 추적 중인 메시를 숨긴다
     */
    ns.hideAll = function() {
        visibilityMap.forEach(function(_, name) {
            ns.hide(name);
        });
    };

    /**
     * 지정 메시의 현재 가시성 조회
     *
     * @param {string} meshName
     * @returns {boolean}
     */
    ns.isVisible = function(meshName) {
        if (visibilityMap.has(meshName)) {
            return visibilityMap.get(meshName);
        }

        const mesh = instance.appendElement.getObjectByName(meshName);
        return mesh ? mesh.visible : false;
    };

    /**
     * 정리
     */
    ns.destroy = function() {
        ns.showAll();
        visibilityMap.clear();
        ns.show = null;
        ns.hide = null;
        ns.toggle = null;
        ns.showOnly = null;
        ns.showAll = null;
        ns.hideAll = null;
        ns.isVisible = null;
        instance.meshVisibility = null;
    };
}
