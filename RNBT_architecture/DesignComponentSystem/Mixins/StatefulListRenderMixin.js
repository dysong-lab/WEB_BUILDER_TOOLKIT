/**
 * StatefulListRenderMixin
 *
 * 데이터를 상태(속성)로 보여준다.
 *
 * 배열 데이터를 template 기반으로 렌더링하며,
 * datasetAttrs로 지정된 키는 data 속성으로, 나머지는 textContent로 설정한다.
 * 개별 항목의 상태를 변경/조회할 수 있다.
 *
 * ListRenderMixin과의 차이:
 *   ListRenderMixin          — 텍스트로 보여준다 (textContent)
 *   StatefulListRenderMixin  — 상태로 보여준다 (data 속성) + 상태 변경/조회
 *
 * ─────────────────────────────────────────────────────────────
 * 사용 예시:
 *
 *   applyStatefulListRenderMixin(this, {
 *       cssSelectors: {
 *           container: '.sidebar__menu',
 *           template:  '#sidebar-menu-item-template',
 *           menuid:    '.sidebar__item',
 *           active:    '.sidebar__item',
 *           icon:      '.sidebar__item-icon',
 *           label:     '.sidebar__item-label',
 *           badge:     '.sidebar__item-badge'
 *       },
 *       datasetAttrs: {
 *           itemKey: 'menuid',
 *           active:  'active'
 *       }
 *   });
 *
 *   // renderData — cssSelectors KEY에 맞춰진 배열:
 *   // [{ menuid: 'dashboard', active: 'true', icon: '📊', label: 'Dashboard', badge: '' }, ...]
 *   //
 *   // datasetAttrs에 등록된 menuid, active → data 속성 (cssSelectors로 위치 결정)
 *   // 나머지 icon, label, badge → textContent
 *
 * ─────────────────────────────────────────────────────────────
 * Mixin이 주입하는 것 (네임스페이스: this.statefulList):
 *
 *   this.statefulList.cssSelectors    — 선택자 (위치 계약)
 *   this.statefulList.datasetAttrs    — data 속성 매핑
 *   this.statefulList.renderData      — { response } → 목록 렌더링
 *   this.statefulList.updateItemState — (id, state) → 개별 항목 상태 변경
 *   this.statefulList.getItemState    — (id) → 항목의 상태 반환
 *   this.statefulList.clear           — 컨테이너 비우기
 *   this.statefulList.destroy         — 자기 정리
 *
 * ─────────────────────────────────────────────────────────────
 */

function applyStatefulListRenderMixin(instance, options) {
    const { cssSelectors = {}, datasetAttrs = {} } = options;

    // Mixin이 직접 참조하는 KEY 추출
    const container = cssSelectors.container;
    const template = cssSelectors.template;

    // 항목 식별 속성 추출
    const itemKeyAttr = datasetAttrs.itemKey;
    // itemKey의 cssSelector → 항목 요소 선택자
    const itemSelector = cssSelectors[itemKeyAttr];

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

            // cssSelectors 반영 — 위치는 cssSelectors가 담당
            Object.entries(cssSelectors).forEach(([key, selector]) => {
                const el = clone.querySelector(selector);
                if (!el || itemData[key] == null) return;

                // datasetAttrs에 등록된 키 → data 속성으로 설정
                if (datasetAttrs[key]) {
                    el.setAttribute('data-' + datasetAttrs[key], itemData[key]);
                } else {
                    el.textContent = itemData[key];
                }
            });

            containerEl.appendChild(clone);
        });
    };

    /**
     * 개별 항목의 상태 변경
     *
     * @param {string|number} id - itemKey에 해당하는 값
     * @param {Object} state - 변경할 data 속성 키-값 쌍 (예: { active: 'true' })
     */
    ns.updateItemState = function(id, state) {
        const el = instance.appendElement.querySelector(
            itemSelector + '[data-' + itemKeyAttr + '="' + id + '"]'
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
            itemSelector + '[data-' + itemKeyAttr + '="' + id + '"]'
        );
        if (!el) return null;

        const state = {};
        Array.from(el.attributes).forEach(a => {
            if (a.name.startsWith('data-')) state[a.name.slice(5)] = a.value;
        });
        return state;
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
