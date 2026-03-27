/**
 * FieldRenderMixin
 *
 * 데이터 객체의 필드를 DOM 요소에 매핑하여 렌더링한다.
 *
 * ─────────────────────────────────────────────────────────────
 * renderData 반영 규칙:
 *
 *   대상 요소는 cssSelectors가 결정한다.
 *   datasetAttrs에 등록된 키 → data 속성 설정
 *   등록되지 않은 키          → textContent 설정
 *
 * ─────────────────────────────────────────────────────────────
 * 사용 예시:
 *
 *   applyFieldRenderMixin(this, {
 *       cssSelectors: {
 *           name:        '.system-name',
 *           status:      '.system-status',
 *           version:     '.system-version'
 *       },
 *       datasetAttrs: {
 *           status:      'status'
 *       }
 *   });
 *
 *   // renderData — cssSelectors KEY에 맞춰진 데이터:
 *   // { name: 'server-01', status: 'RUNNING', version: '1.0' }
 *   // → name, version → textContent
 *   // → status → setAttribute('data-status', 'RUNNING')
 *
 * ─────────────────────────────────────────────────────────────
 * Mixin이 주입하는 것 (네임스페이스: this.fieldRender):
 *
 *   this.fieldRender.cssSelectors   — CSS 선택자 (렌더링, 이벤트 매핑, 페이지 접근)
 *   this.fieldRender.datasetAttrs  — data-* 속성 선택자 (렌더링, CSS 스타일링)
 *   this.fieldRender.renderData     — { response } → DOM 업데이트
 *   this.fieldRender.destroy        — 자기 정리
 *
 * ─────────────────────────────────────────────────────────────
 */

function applyFieldRenderMixin(instance, options) {
    const { cssSelectors = {}, datasetAttrs = {} } = options;

    // 네임스페이스 생성
    const ns = {};
    instance.fieldRender = ns;

    // 선택자 보존 (외부에서 computed property로 참조 가능)
    ns.cssSelectors = { ...cssSelectors };
    ns.datasetAttrs = { ...datasetAttrs };

    /**
     * 데이터 렌더링
     *
     * @param {{ response: Object }} payload
     */
    ns.renderData = function({ response: data }) {
        if (!data) throw new Error('[FieldRenderMixin] data is null');

        Object.entries(data).forEach(([key, value]) => {
            if (value == null) return;
            if (!cssSelectors[key]) return;

            const el = instance.appendElement.querySelector(cssSelectors[key]);
            if (!el) return;

            // datasetAttrs에 등록된 키 → data 속성으로 설정
            if (datasetAttrs[key]) {
                el.setAttribute('data-' + datasetAttrs[key], value);
            } else {
                el.textContent = value;
            }
        });
    };

    /**
     * 정리 — 자기가 만든 것만 정리
     */
    ns.destroy = function() {
        ns.renderData = null;
        ns.cssSelectors = null;
        ns.datasetAttrs = null;
        instance.fieldRender = null;
    };
}
