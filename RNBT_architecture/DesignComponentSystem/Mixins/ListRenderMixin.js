/**
 * ListRenderMixin
 *
 * 배열 데이터를 template 기반으로 반복 렌더링한다.
 *
 * ─────────────────────────────────────────────────────────────
 * renderData 반영 규칙:
 *
 *   template     → HTML <template> 태그를 cloneNode하여 항목 생성
 *   cssSelectors → 각 항목 내에서 요소를 찾아 textContent 반영
 *   datasetAttrs → 각 항목 내에서 요소를 찾아 dataset 반영
 *
 * 선택자는 renderData 외에도 이벤트 매핑, 페이지 접근 등에서 활용된다.
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
 *       datasetAttrs: {
 *           level:   'level'
 *       }
 *   });
 *
 *   // renderData는 이미 selector KEY에 맞춰진 배열을 받는다:
 *   // [{ level: 'ERROR', time: '14:30', message: '...' }, ...]
 *
 * ─────────────────────────────────────────────────────────────
 * Mixin이 주입하는 것 (네임스페이스: this.listRender):
 *
 *   this.listRender.cssSelectors      — CSS 선택자 (렌더링, 이벤트 매핑, 페이지 접근)
 *   this.listRender.datasetAttrs  — data-* 속성 선택자 (렌더링, CSS 스타일링)
 *   this.listRender.renderData        — { response } → 리스트 렌더링
 *   this.listRender.clear             — 컨테이너 비우기
 *   this.listRender.destroy           — 자기 정리
 *
 * ─────────────────────────────────────────────────────────────
 */

function applyListRenderMixin(instance, options) {
    const { cssSelectors = {}, datasetAttrs = {} } = options;

    // Mixin이 직접 참조하는 KEY 추출
    const container = cssSelectors.container;
    const template = cssSelectors.template;

    // 네임스페이스 생성
    const ns = {};
    instance.listRender = ns;

    // 선택자 보존 (외부에서 computed property로 참조 가능)
    ns.cssSelectors = { ...cssSelectors };
    ns.datasetAttrs = { ...datasetAttrs };

    /**
     * 데이터 렌더링
     *
     * @param {{ response: { data: Object } }} payload
     */
    ns.renderData = function({ response }) {
        const { data } = response;
        if (!data) throw new Error('[ListRenderMixin] data is null');
        if (!Array.isArray(data)) throw new Error('[ListRenderMixin] data is not an array');

        const containerEl = instance.appendElement.querySelector(container);
        if (!containerEl) throw new Error('[ListRenderMixin] container not found: ' + container);

        const templateEl = instance.appendElement.querySelector(template);
        if (!templateEl) throw new Error('[ListRenderMixin] template not found: ' + template);

        // 컨테이너 비우고 항목 생성
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
        ns.datasetAttrs = null;
        instance.listRender = null;
    };
}
