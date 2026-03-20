/**
 * FieldRenderMixin
 *
 * 데이터 객체의 필드를 DOM 요소에 매핑하여 렌더링한다.
 *
 * ─────────────────────────────────────────────────────────────
 * 값 반영 규칙:
 *
 *   cssSelectors  → 요소를 찾아 textContent에 값 반영
 *   datasetSelectors → 요소를 찾아 dataset에 값 반영
 *
 * ─────────────────────────────────────────────────────────────
 * 사용 예시:
 *
 *   HTML:
 *     <span class="system-status" data-status="unknown">-</span>
 *
 *   applyFieldRenderMixin(this, {
 *       cssSelectors: {
 *           name:        '.system-name',
 *           statusLabel: '.system-status',
 *           version:     '.system-version'
 *       },
 *       datasetSelectors: {
 *           status:      'status'
 *       }
 *   });
 *
 *   // renderData는 이미 selector KEY에 맞춰진 데이터를 받는다:
 *   // { name: 'server-01', status: 'RUNNING', statusLabel: '정상', version: '1.0' }
 *
 * ─────────────────────────────────────────────────────────────
 * Mixin이 주입하는 것 (네임스페이스: this.fieldRender):
 *
 *   this.fieldRender.cssSelectors   — textContent용 선택자
 *   this.fieldRender.datasetSelectors  — dataset용 선택자
 *   this.fieldRender.renderData     — { response } → DOM 업데이트
 *   this.fieldRender.destroy        — 자기 정리
 *
 * ─────────────────────────────────────────────────────────────
 */

function applyFieldRenderMixin(instance, options) {
    const { cssSelectors = {}, datasetSelectors = {} } = options;

    // 네임스페이스 생성
    const ns = {};
    instance.fieldRender = ns;

    // 선택자 보존 (외부에서 computed property로 참조 가능)
    ns.cssSelectors = { ...cssSelectors };
    ns.datasetSelectors = { ...datasetSelectors };

    /**
     * 데이터 렌더링
     *
     * @param {{ response: { data: Object } }} payload
     */
    ns.renderData = function({ response }) {
        const { data } = response;
        if (!data) throw new Error('[FieldRenderMixin] data is null');

        Object.entries(data).forEach(([key, value]) => {
            if (value === undefined || value === null) return;

            // datasetSelectors에 키가 있으면 → dataset 반영
            if (datasetSelectors[key]) {
                const attr = datasetSelectors[key];
                const dataEl = instance.appendElement.querySelector('[data-' + attr + ']');
                if (dataEl) dataEl.dataset[attr] = value;
            }

            // cssSelectors에 키가 있으면 → textContent 반영
            if (cssSelectors[key]) {
                const el = instance.appendElement.querySelector(cssSelectors[key]);
                if (el) el.textContent = value;
            }

        });
    };

    /**
     * 정리 — 자기가 만든 것만 정리
     */
    ns.destroy = function() {
        ns.renderData = null;
        ns.cssSelectors = null;
        ns.datasetSelectors = null;
        instance.fieldRender = null;
    };
}
