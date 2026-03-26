/**
 * StatefulListRenderMixin
 *
 * 이벤트 목록을 template 기반으로 렌더링하고,
 * 개별 항목의 상태(ack, severity 등)를 변경할 수 있다.
 *
 * ListRenderMixin과의 차이:
 *   ListRenderMixin  — 배열 렌더링만 (표시)
 *   StatefulListRenderMixin   — 배열 렌더링 + 개별 항목 상태 변경 (표시 + 상호작용)
 *
 * ─────────────────────────────────────────────────────────────
 * 사용 예시:
 *
 *   applyStatefulListRenderMixin(this, {
 *       cssSelectors: {
 *           container: '.event-list',
 *           item:      '.event-item',
 *           template:  '#event-item-template',
 *           time:      '.event-time',
 *           message:   '.event-message',
 *           source:    '.event-source'
 *       },
 *       datasetAttrs: {
 *           itemKey:  'id',
 *           severity: 'severity',
 *           ack:      'ack'
 *       }
 *   });
 *
 *   // renderData는 이미 selector KEY에 맞춰진 배열을 받는다:
 *   // [{ itemKey: '1', time: '14:30', message: '...', severity: 'warning', ack: 'false' }, ...]
 *
 * ─────────────────────────────────────────────────────────────
 * Mixin이 주입하는 것 (네임스페이스: this.statefulList):
 *
 *   this.statefulList.cssSelectors      — 선택자 (container, item, template, 데이터/이벤트용)
 *   this.statefulList.datasetAttrs  — dataset용 선택자
 *   this.statefulList.renderData        — { response } → 목록 렌더링
 *   this.statefulList.updateItemState   — (id, state) → 개별 항목 dataset 변경
 *   this.statefulList.getItemState      — (id) → 항목의 dataset 반환
 *   this.statefulList.clear             — 컨테이너 비우기
 *   this.statefulList.destroy           — 자기 정리
 *
 * ─────────────────────────────────────────────────────────────
 */

function applyStatefulListRenderMixin(instance, options) {
    const { cssSelectors = {}, datasetAttrs = {} } = options;

    // Mixin이 직접 참조하는 KEY 추출
    const container = cssSelectors.container;
    const item = cssSelectors.item;
    const template = cssSelectors.template;

    // 항목 식별 속성 추출 (Mixin 정의 KEY)
    const itemKeyAttr = datasetAttrs.itemKey;

    // 네임스페이스 생성
    const ns = {};
    instance.statefulList = ns;

    // 선택자 보존
    ns.cssSelectors = { ...cssSelectors };
    ns.datasetAttrs = { ...datasetAttrs };

    /**
     * 목록 렌더링
     *
     * @param {{ response: Array }} payload
     */
    ns.renderData = function({ response: data }) {
        if (!data) throw new Error('[StatefulListRenderMixin] data is null');
        if (!Array.isArray(data)) throw new Error('[StatefulListRenderMixin] data is not an array');

        const containerEl = instance.appendElement.querySelector(container);
        if (!containerEl) throw new Error('[StatefulListRenderMixin] container not found: ' + container);

        const templateEl = instance.appendElement.querySelector(template);
        if (!templateEl) throw new Error('[StatefulListRenderMixin] template not found: ' + template);

        containerEl.innerHTML = '';

        data.forEach(itemData => {
            const clone = templateEl.content.cloneNode(true);

            // datasetAttrs 반영
            Object.entries(datasetAttrs).forEach(([key, attr]) => {
                const el = clone.querySelector('[data-' + attr + ']');
                if (el && itemData[key] != null) {
                    el.dataset[attr] = itemData[key];
                }
            });

            // cssSelectors 반영
            Object.entries(cssSelectors).forEach(([key, selector]) => {
                const el = clone.querySelector(selector);
                if (el && itemData[key] != null) {
                    el.textContent = itemData[key];
                }
            });

            containerEl.appendChild(clone);
        });
    };

    /**
     * 개별 항목의 상태 변경 (dataset)
     *
     * Ack 처리, severity 변경 등 개별 항목의 시각 상태를 변경한다.
     * DOM의 dataset만 변경하며, API 호출은 페이지가 담당한다.
     *
     * @param {string|number} id - itemKey에 해당하는 값
     * @param {Object} state - 변경할 dataset 키-값 쌍 (예: { ack: 'true' })
     */
    ns.updateItemState = function(id, state) {
        const el = instance.appendElement.querySelector(
            item + '[data-' + itemKeyAttr + '="' + id + '"]'
        );
        if (!el) return;

        Object.entries(state).forEach(([key, value]) => {
            el.dataset[key] = value;
        });
    };

    /**
     * 개별 항목의 상태 조회
     *
     * @param {string|number} id - itemKey에 해당하는 값
     * @returns {Object|null} dataset 객체 (복사본) 또는 null
     */
    ns.getItemState = function(id) {
        const el = instance.appendElement.querySelector(
            item + '[data-' + itemKeyAttr + '="' + id + '"]'
        );
        if (!el) return null;

        return Object.assign({}, el.dataset);
    };

    /**
     * 컨테이너 비우기
     */
    ns.clear = function() {
        const containerEl = instance.appendElement.querySelector(container);
        if (containerEl) containerEl.innerHTML = '';
    };

    /**
     * 정리
     */
    ns.destroy = function() {
        ns.renderData = null;
        ns.updateItemState = null;
        ns.getItemState = null;
        ns.clear = null;
        ns.cssSelectors = null;
        ns.datasetAttrs = null;
        instance.statefulList = null;
    };
}
