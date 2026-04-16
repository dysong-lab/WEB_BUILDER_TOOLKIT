/**
 * Chips/Assist — Standard
 *
 * 목적: 스마트/자동화된 보조 액션을 칩 목록으로 표시
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
        container: '.assist-chip__list',
        template:  '#assist-chip-item-template',
        chipid:    '.assist-chip__item',
        icon:      '.assist-chip__icon',
        label:     '.assist-chip__label'
    },
    datasetAttrs: {
        chipid: 'chipid'
    }
});

// ======================
// 2. 구독 연결
// ======================

this.subscriptions = {
    assistChipItems: [this.listRender.renderData]
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
        [this.listRender.cssSelectors.chipid]: '@assistChipClicked'
    }
};

bindEvents(this, this.customEvents);
