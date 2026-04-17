/**
 * MeshStateMixin
 *
 * 3D 메시의 시각 상태를 데이터에 따라 변경한다.
 *
 * 데이터의 상태값에 따라 메시의 색상을 변경한다.
 * 상태 → 색상 매핑은 colorMap으로 정의한다.
 *
 * ─────────────────────────────────────────────────────────────
 * 사용 예시:
 *
 *   // 3D 컴포넌트 자신의 메시 상태를 관리
 *   applyMeshStateMixin(this, {
 *       colorMap: {
 *           normal:   0x34d399,
 *           warning:  0xfbbf24,
 *           error:    0xf87171,
 *           offline:  0x6b7280
 *       }
 *   });
 *
 *   // renderData는 메시 상태 매핑을 받는다:
 *   // [{ meshName: 'pump-01', status: 'normal' }, ...]
 *
 * ─────────────────────────────────────────────────────────────
 * Mixin이 주입하는 것 (네임스페이스: this.meshState):
 *
 *   this.meshState.renderData       — { response } → 메시 상태 일괄 적용
 *   this.meshState.setMeshState     — 개별 메시 상태 변경
 *   this.meshState.getMeshState     — 개별 메시 상태 조회
 *   this.meshState.destroy          — 정리
 *
 * ─────────────────────────────────────────────────────────────
 */

function applyMeshStateMixin(instance, options) {
    const { colorMap = {} } = options;

    const ns = {};
    instance.meshState = ns;

    const stateMap = new Map();

    // material이 배열(multi-material mesh)인 경우도 지원
    function applyColor(target, color) {
        if (Array.isArray(target.material)) {
            target.material = target.material.map(function(m) {
                const c = m.clone();
                if (c.color) c.color.setHex(color);
                return c;
            });
        } else {
            target.material = target.material.clone();
            if (target.material.color) target.material.color.setHex(color);
        }
    }

    /**
     * 메시 상태 일괄 적용
     *
     * @param {{ response: { data: Array } }} payload
     *   data — [{ meshName, status }, ...]
     */
    ns.renderData = function({ response: data }) {
        if (!data) throw new Error('[MeshStateMixin] data is null');
        if (!Array.isArray(data)) throw new Error('[MeshStateMixin] data is not an array');

        data.forEach(function(item) {
            ns.setMeshState(item.meshName, item.status);
        });
    };

    /**
     * 개별 메시 상태 변경
     *
     * @param {string} meshName - 메시 이름
     * @param {string} status - 상태 키 (colorMap의 키)
     */
    ns.setMeshState = function(meshName, status) {
        const obj = instance.appendElement.getObjectByName(meshName);
        if (!obj) return;

        const color = colorMap[status];
        if (color !== undefined) {
            if (obj.material) {
                applyColor(obj, color);
            } else {
                obj.traverse(function(child) {
                    if (child.material) applyColor(child, color);
                });
            }
        }

        stateMap.set(meshName, status);
    };

    /**
     * 개별 메시 상태 조회
     *
     * @param {string} meshName
     * @returns {string|undefined}
     */
    ns.getMeshState = function(meshName) {
        return stateMap.get(meshName);
    };

    /**
     * 정리
     */
    ns.destroy = function() {
        stateMap.clear();
        ns.renderData = null;
        ns.setMeshState = null;
        ns.getMeshState = null;
        instance.meshState = null;
    };
}
