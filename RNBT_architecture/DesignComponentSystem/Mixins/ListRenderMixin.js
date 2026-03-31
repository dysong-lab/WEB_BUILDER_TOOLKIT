/**
 * ListRenderMixin
 *
 * 배열 데이터를 template 기반으로 반복 렌더링한다.
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
 * 기본 사용 (단순 목록):
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
 *   // renderData — cssSelectors KEY에 맞춰진 배열:
 *   // [{ time: '14:30', level: 'ERROR', message: '...' }, ...]
 *   // → 모든 키 → textContent
 *
 * ─────────────────────────────────────────────────────────────
 * 상태 관리 사용 (항목별 상태 변경/조회):
 *
 *   applyListRenderMixin(this, {
 *       cssSelectors: {
 *           container: '.sidebar__menu',
 *           template:  '#sidebar-menu-item-template',
 *           menuid:    '.sidebar__item',
 *           active:    '.sidebar__item',
 *           icon:      '.sidebar__item-icon',
 *           label:     '.sidebar__item-label'
 *       },
 *       itemKey: 'menuid',
 *       datasetAttrs: {
 *           menuid: 'menuid',
 *           active: 'active'
 *       }
 *   });
 *
 *   // renderData — cssSelectors KEY에 맞춰진 배열:
 *   // [{ menuid: 'dashboard', active: 'true', icon: '📊', label: 'Dashboard' }, ...]
 *   //
 *   // datasetAttrs에 등록된 menuid, active → data 속성
 *   // 나머지 icon, label → textContent
 *   //
 *   // itemKey가 있으므로 개별 항목 상태 변경/조회 가능:
 *   //   this.listRender.updateItemState('dashboard', { active: 'true' })
 *   //   this.listRender.getItemState('dashboard')
 *
 * ─────────────────────────────────────────────────────────────
 * Mixin이 주입하는 것 (네임스페이스: this.listRender):
 *
 *   this.listRender.cssSelectors    — CSS 선택자 (렌더링, 이벤트 매핑, 페이지 접근)
 *   this.listRender.datasetAttrs    — data-* 속성 매핑
 *   this.listRender.elementAttrs    — 요소 속성 매핑 (src, fill 등)
 *   this.listRender.styleAttrs      — 스타일 속성 매핑 (width, height 등)
 *   this.listRender.renderData      — { response } → 리스트 렌더링
 *   this.listRender.clear           — 컨테이너 비우기
 *   this.listRender.destroy         — 자기 정리
 *
 *   itemKey 옵션 사용 시 추가:
 *   this.listRender.updateItemState — (id, state) → 개별 항목 상태 변경
 *   this.listRender.getItemState    — (id) → 항목의 상태 반환
 *
 * ─────────────────────────────────────────────────────────────
 */

function applyListRenderMixin(instance, options) {
    const {
        cssSelectors = {},
        datasetAttrs = {},
        elementAttrs = {},
        styleAttrs = {},
        itemKey
    } = options;

    const paths = { datasetAttrs, elementAttrs, styleAttrs };

    // Mixin이 직접 참조하는 KEY 추출
    const container = cssSelectors.container;
    const template = cssSelectors.template;

    // 항목 식별: itemKey가 있을 때만 사용
    const itemSelector = itemKey ? cssSelectors[itemKey] : null;

    // 네임스페이스 생성
    const ns = {};
    instance.listRender = ns;

    // 선택자/옵션 보존 (외부에서 computed property로 참조 가능)
    ns.cssSelectors = { ...cssSelectors };
    ns.datasetAttrs = { ...datasetAttrs };
    ns.elementAttrs = { ...elementAttrs };
    ns.styleAttrs = { ...styleAttrs };

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

            // cssSelectors 반영 — 대상 요소는 cssSelectors가 결정
            Object.entries(cssSelectors).forEach(([key, selector]) => {
                const el = clone.querySelector(selector);
                if (!el || itemData[key] == null) return;

                applyValue(el, key, itemData[key], paths);
            });

            containerEl.appendChild(clone);
        });
    };

    // itemKey가 있을 때만 상태 관리 메서드 주입
    if (itemKey) {
        /**
         * 개별 항목의 상태 변경
         *
         * @param {string|number} id - itemKey에 해당하는 값
         * @param {Object} state - 변경할 data 속성 키-값 쌍 (예: { active: 'true' })
         */
        ns.updateItemState = function(id, state) {
            const el = instance.appendElement.querySelector(
                itemSelector + '[data-' + itemKey + '="' + id + '"]'
            );
            if (!el) return;

            Object.entries(state).forEach(([key, value]) => {
                el.setAttribute('data-' + key, value);
            });
        };

        /**
         * 개별 항목의 상태 조회
         *
         * @param {string|number} id - itemKey에 해당하는 값
         * @returns {Object|null} data 속성 객체 (복사본) 또는 null
         */
        ns.getItemState = function(id) {
            const el = instance.appendElement.querySelector(
                itemSelector + '[data-' + itemKey + '="' + id + '"]'
            );
            if (!el) return null;

            const state = {};
            Array.from(el.attributes).forEach(a => {
                if (a.name.startsWith('data-')) state[a.name.slice(5)] = a.value;
            });
            return state;
        };
    }

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
        if (ns.updateItemState) ns.updateItemState = null;
        if (ns.getItemState) ns.getItemState = null;
        ns.clear = null;
        ns.cssSelectors = null;
        ns.datasetAttrs = null;
        ns.elementAttrs = null;
        ns.styleAttrs = null;
        instance.listRender = null;
    };
}
