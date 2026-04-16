/**
 * Chips/Suggestion — Standard
 *
 * 목적: 동적으로 생성된 제안을 칩 목록으로 표시하여 사용자의 의도를 구체화
 * 기능: ListRenderMixin으로 칩 항목 렌더링 + 클릭 이벤트
 *
 * Mixin: ListRenderMixin
 */
const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;
const { each, go } = fx;

// ======================
// 1. MIXIN 적용
// ======================

applyListRenderMixin(this, {
    cssSelectors: {
        container: '.suggestion-chip__list',
        template:  '#suggestion-chip-item-template',
        chipid:    '.suggestion-chip__item',
        icon:      '.suggestion-chip__icon',
        label:     '.suggestion-chip__label'
    },
    datasetAttrs: {
        chipid: 'chipid'
    }
});

// ======================
// 2. 구독 연결
// ======================

this.subscriptions = {
    suggestionChipItems: [this.listRender.renderData]
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
        [this.listRender.cssSelectors.chipid]: '@suggestionChipClicked'
    }
};

bindEvents(this, this.customEvents);
