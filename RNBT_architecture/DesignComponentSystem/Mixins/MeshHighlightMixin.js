/**
 * MeshHighlightMixin
 *
 * 선택한 대상을 시각적으로 강조한다.
 *
 * 3D 메시의 emissive 색상을 적용/해제하여 선택 상태를
 * 시각적으로 피드백한다. MeshStateMixin이 material.color를
 * 사용하므로, 이 Mixin은 material.emissive를 사용하여
 * 두 Mixin이 동시에 적용되어도 충돌하지 않는다.
 *
 * ─────────────────────────────────────────────────────────────
 * 사용 예시:
 *
 *   applyMeshHighlightMixin(this, {
 *       highlightColor: 0xffaa00,
 *       highlightIntensity: 0.4
 *   });
 *
 *   // 메시 강조
 *   this.meshHighlight.highlight('pump-01');
 *
 *   // 강조 해제
 *   this.meshHighlight.unhighlight('pump-01');
 *
 *   // 전체 해제
 *   this.meshHighlight.clearAll();
 *
 * ─────────────────────────────────────────────────────────────
 * Mixin이 주입하는 것 (네임스페이스: this.meshHighlight):
 *
 *   this.meshHighlight.highlight       — 메시에 emissive 강조 적용
 *   this.meshHighlight.unhighlight     — 메시의 emissive 강조 해제
 *   this.meshHighlight.clearAll        — 모든 강조 해제
 *   this.meshHighlight.isHighlighted   — 강조 상태 조회
 *   this.meshHighlight.destroy         — 정리
 *
 * ─────────────────────────────────────────────────────────────
 */

function applyMeshHighlightMixin(instance, options) {
    const {
        highlightColor = 0xffaa00,
        highlightIntensity = 0.4
    } = options;

    const ns = {};
    instance.meshHighlight = ns;

    // 현재 강조된 meshName 집합
    const highlightMap = new Set();

    // meshName → { emissive: THREE.Color, emissiveIntensity: number } 원본 저장
    const originalMap = new Map();

    /**
     * 메시에 emissive 강조 적용
     *
     * @param {string} meshName - 강조할 메시 이름
     */
    ns.highlight = function(meshName) {
        if (highlightMap.has(meshName)) return;

        const mesh = instance.appendElement.getObjectByName(meshName);
        if (!mesh || !mesh.material) return;

        // 원본 저장 (최초 1회만)
        if (!originalMap.has(meshName)) {
            originalMap.set(meshName, {
                emissive: mesh.material.emissive.clone(),
                emissiveIntensity: mesh.material.emissiveIntensity
            });
        }

        mesh.material = mesh.material.clone();
        mesh.material.emissive.setHex(highlightColor);
        mesh.material.emissiveIntensity = highlightIntensity;

        highlightMap.add(meshName);
    };

    /**
     * 메시의 emissive 강조 해제
     *
     * @param {string} meshName - 강조 해제할 메시 이름
     */
    ns.unhighlight = function(meshName) {
        if (!highlightMap.has(meshName)) return;

        const mesh = instance.appendElement.getObjectByName(meshName);
        if (!mesh || !mesh.material) return;

        const original = originalMap.get(meshName);
        if (original) {
            mesh.material = mesh.material.clone();
            mesh.material.emissive.copy(original.emissive);
            mesh.material.emissiveIntensity = original.emissiveIntensity;
        }

        highlightMap.delete(meshName);
    };

    /**
     * 모든 강조된 메시의 emissive 강조 해제
     */
    ns.clearAll = function() {
        highlightMap.forEach(function(meshName) {
            ns.unhighlight(meshName);
        });
    };

    /**
     * 메시가 현재 강조 상태인지 조회
     *
     * @param {string} meshName
     * @returns {boolean}
     */
    ns.isHighlighted = function(meshName) {
        return highlightMap.has(meshName);
    };

    /**
     * 정리
     */
    ns.destroy = function() {
        ns.clearAll();
        highlightMap.clear();
        originalMap.clear();
        ns.highlight = null;
        ns.unhighlight = null;
        ns.clearAll = null;
        ns.isHighlighted = null;
        instance.meshHighlight = null;
    };
}
