/**
 * FilterChips 컴포넌트
 *
 * 목적: 필터 선택 칩 그룹을 제공한다
 * 기능: ListRenderMixin으로 칩 항목을 렌더링하고,
 *       itemKey로 개별 칩의 선택/해제 상태를 관리한다
 *
 * Mixin: ListRenderMixin (itemKey 모드)
 */
const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;
const { each, go } = fx;

// ======================
// 1. MIXIN 적용
// ======================

applyListRenderMixin(this, {
    cssSelectors: {
        container: '.filter-chips__list',
        template:  '#filter-chip-item-template',
        chipid:    '.filter-chips__chip',
        selected:  '.filter-chips__chip',
        icon:      '.filter-chips__chip-icon',
        label:     '.filter-chips__chip-label'
    },
    itemKey: 'chipid',
    datasetAttrs: {
        chipid:   'chipid',
        selected: 'selected'
    }
});

// ======================
// 2. 구독 연결
// ======================

this.subscriptions = {
    filterChips: [this.listRender.renderData]
};

go(
    Object.entries(this.subscriptions),
    each(([topic, handlers]) =>
        each(handler => subscribe(topic, this, handler), handlers)
    )
);

// ======================
// 3. 이벤트 매핑
// ======================

this.customEvents = {
    click: {
        [this.listRender.cssSelectors.chipid]: '@chipClicked'
    }
};

bindEvents(this, this.customEvents);
