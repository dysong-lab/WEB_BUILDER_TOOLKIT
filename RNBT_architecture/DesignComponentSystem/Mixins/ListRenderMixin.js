/**
 * ListRenderMixin
 *
 * 데이터를 텍스트로 보여준다.
 *
 * 배열 데이터를 template 기반으로 반복 렌더링하며,
 * cssSelectors로 찾은 요소에 textContent를 설정한다.
 *
 * ─────────────────────────────────────────────────────────────
 * 사용 예시:
 *
 *   applyListRenderMixin(this, {
 *       cssSelectors: {
 *           container: '.event-log__list',
 *           template:  '#event-log-item-template',
 *           item:      '.event-log__item',
 *           time:      '.event-log__time',
 *           level:     '.event-log__level',
 *           message:   '.event-log__message'
 *       }
 *   });
 *
 *   // renderData는 cssSelectors KEY에 맞춰진 배열을 받는다:
 *   // [{ time: '14:30', level: 'ERROR', message: '...' }, ...]
 *
 * ─────────────────────────────────────────────────────────────
 * Mixin이 주입하는 것 (네임스페이스: this.listRender):
 *
 *   this.listRender.cssSelectors — CSS 선택자 (렌더링, 이벤트 매핑, 페이지 접근)
 *   this.listRender.renderData  — { response } → 리스트 렌더링
 *   this.listRender.clear       — 컨테이너 비우기
 *   this.listRender.destroy     — 자기 정리
 *
 * ─────────────────────────────────────────────────────────────
 */

function applyListRenderMixin(instance, options) {
    const { cssSelectors = {} } = options;

    // Mixin이 직접 참조하는 KEY 추출
    const container = cssSelectors.container;
    const template = cssSelectors.template;

    // 네임스페이스 생성
    const ns = {};
    instance.listRender = ns;

    // 선택자 보존 (외부에서 computed property로 참조 가능)
    ns.cssSelectors = { ...cssSelectors };

    /**
     * 데이터 렌더링
     *
     * @param {{ response: Array }} payload
     */
    ns.renderData = function({ response: data }) {
        if (!data) throw new Error('[ListRenderMixin] data is null');
        if (!Array.isArray(data)) throw new Error('[ListRenderMixin] data is not an array');

        const containerEl = instance.appendElement.querySelector(container);
        if (!containerEl) throw new Error('[ListRenderMixin] container not found: ' + container);

        const templateEl = instance.appendElement.querySelector(template);
        if (!templateEl) throw new Error('[ListRenderMixin] template not found: ' + template);

        containerEl.innerHTML = '';

        data.forEach(itemData => {
            const clone = templateEl.content.cloneNode(true);

            // cssSelectors 반영 → textContent
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
        instance.listRender = null;
    };
}
