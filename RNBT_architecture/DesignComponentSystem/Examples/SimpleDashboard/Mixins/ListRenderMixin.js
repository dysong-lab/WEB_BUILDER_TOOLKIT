/**
 * ListRenderMixin
 *
 * 배열 데이터를 template 기반으로 반복 렌더링한다.
 *
 * ─────────────────────────────────────────────────────────────
 * 값 반영 규칙:
 *
 *   template     → HTML <template> 태그를 cloneNode하여 항목 생성
 *   cssSelectors → 각 항목 내에서 요소를 찾아 textContent 반영
 *   datasetSelectors → 각 항목 내에서 요소를 찾아 dataset 반영
 *
 * ─────────────────────────────────────────────────────────────
 * 사용 예시:
 *
 *   HTML:
 *     <div class="event-log__list"></div>
 *     <template id="event-log-item-template">
 *         <div class="event-log__item">
 *             <span class="event-log__level" data-level=""></span>
 *             <span class="event-log__time"></span>
 *             <span class="event-log__message"></span>
 *         </div>
 *     </template>
 *
 *   applyListRenderMixin(this, {
 *       cssSelectors: {
 *           container: '.event-log__list',
 *           item:      '.event-log__item',
 *           template:  '#event-log-item-template',
 *           level:     '.event-log__level',
 *           time:      '.event-log__time',
 *           message:   '.event-log__message'
 *       },
 *       datasetSelectors: {
 *           level:   'level'
 *       },
 *       dataFormat: (data) => ({
 *           items: data.events.map(e => ({
 *               level: e.level,
 *               time: '14:30',
 *               message: e.message
 *           }))
 *       })
 *   });
 *
 * ─────────────────────────────────────────────────────────────
 * Mixin이 주입하는 것 (네임스페이스: this.listRender):
 *
 *   this.listRender.cssSelectors      — 선택자 (container, item, template, 데이터/이벤트용)
 *   this.listRender.datasetSelectors  — 항목 내 dataset용 선택자
 *   this.listRender.renderData        — { response } → 리스트 렌더링
 *   this.listRender.clear             — 컨테이너 비우기
 *   this.listRender.destroy           — 자기 정리
 *
 * ─────────────────────────────────────────────────────────────
 */

function applyListRenderMixin(instance, options) {
    const { cssSelectors = {}, datasetSelectors = {}, dataFormat } = options;

    // 구조 선택자 추출
    const container = cssSelectors.container;
    const item = cssSelectors.item;
    const template = cssSelectors.template;

    // 네임스페이스 생성
    const ns = {};
    instance.listRender = ns;

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
        if (!data) throw new Error('[ListRenderMixin] data is null');

        const formatted = dataFormat ? dataFormat(data) : { items: data };

        const containerEl = instance.appendElement.querySelector(container);
        if (!containerEl) throw new Error('[ListRenderMixin] container not found: ' + container);

        const templateEl = instance.appendElement.querySelector(template);
        if (!templateEl) throw new Error('[ListRenderMixin] template not found: ' + template);

        // 컨테이너 비우고 항목 생성
        containerEl.innerHTML = '';

        formatted.items.forEach(itemData => {
            const clone = templateEl.content.cloneNode(true);

            // datasetSelectors 반영
            Object.entries(datasetSelectors).forEach(([key, attr]) => {
                const el = clone.querySelector('[data-' + attr + ']');
                if (el && itemData[key] !== undefined && itemData[key] !== null) {
                    el.dataset[attr] = itemData[key];
                }
            });

            // cssSelectors 반영
            Object.entries(cssSelectors).forEach(([key, selector]) => {
                const el = clone.querySelector(selector);
                if (el && itemData[key] !== undefined && itemData[key] !== null) {
                    el.textContent = itemData[key];
                }
            });

            containerEl.appendChild(clone);
        });
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
        ns.clear = null;
        ns.cssSelectors = null;
        ns.datasetSelectors = null;
        instance.listRender = null;
    };
}
