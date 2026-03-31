/**
 * FieldRenderMixin
 *
 * 데이터 객체의 필드를 DOM 요소에 매핑하여 렌더링한다.
 *
 * ─────────────────────────────────────────────────────────────
 * renderData 반영 규칙 (applyValue 4경로):
 *
 *   대상 요소는 cssSelectors가 결정한다.
 *   datasetAttrs에 등록된 키 → data-* 속성 설정
 *   elementAttrs에 등록된 키 → 요소 속성 설정 (src, fill 등)
 *   styleAttrs에 등록된 키   → 스타일 속성 설정 (width, height 등)
 *   등록되지 않은 키          → textContent 설정
 *
 * ─────────────────────────────────────────────────────────────
 * 사용 예시:
 *
 *   applyFieldRenderMixin(this, {
 *       cssSelectors: {
 *           name:        '.system-name',
 *           status:      '.system-status',
 *           version:     '.system-version',
 *           icon:        '.system-icon',
 *           progress:    '.system-progress-bar'
 *       },
 *       datasetAttrs: {
 *           status:      'status'
 *       },
 *       elementAttrs: {
 *           icon:        'src'
 *       },
 *       styleAttrs: {
 *           progress:    { property: 'width', unit: '%' }
 *       }
 *   });
 *
 *   // renderData — cssSelectors KEY에 맞춰진 데이터:
 *   // { name: 'server-01', status: 'RUNNING', version: '1.0',
 *   //   icon: '/icons/server.svg', progress: 72 }
 *   // → name, version → textContent
 *   // → status → data-status="RUNNING"
 *   // → icon → src="/icons/server.svg"
 *   // → progress → style.width="72%"
 *
 * ─────────────────────────────────────────────────────────────
 * Mixin이 주입하는 것 (네임스페이스: this.fieldRender):
 *
 *   this.fieldRender.cssSelectors   — CSS 선택자 (렌더링, 이벤트 매핑, 페이지 접근)
 *   this.fieldRender.datasetAttrs   — data-* 속성 매핑
 *   this.fieldRender.elementAttrs   — 요소 속성 매핑 (src, fill 등)
 *   this.fieldRender.styleAttrs     — 스타일 속성 매핑 (width, height 등)
 *   this.fieldRender.renderData     — { response } → DOM 업데이트
 *   this.fieldRender.destroy        — 자기 정리
 *
 * ─────────────────────────────────────────────────────────────
 */

function applyFieldRenderMixin(instance, options) {
    const {
        cssSelectors = {},
        datasetAttrs = {},
        elementAttrs = {},
        styleAttrs = {}
    } = options;

    const paths = { datasetAttrs, elementAttrs, styleAttrs };

    // 네임스페이스 생성
    const ns = {};
    instance.fieldRender = ns;

    // 선택자/옵션 보존 (외부에서 computed property로 참조 가능)
    ns.cssSelectors = { ...cssSelectors };
    ns.datasetAttrs = { ...datasetAttrs };
    ns.elementAttrs = { ...elementAttrs };
    ns.styleAttrs = { ...styleAttrs };

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

            applyValue(el, key, value, paths);
        });
    };

    /**
     * 정리 — 자기가 만든 것만 정리
     */
    ns.destroy = function() {
        ns.renderData = null;
        ns.cssSelectors = null;
        ns.datasetAttrs = null;
        ns.elementAttrs = null;
        ns.styleAttrs = null;
        instance.fieldRender = null;
    };
}
