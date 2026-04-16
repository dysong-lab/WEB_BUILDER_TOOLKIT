/**
 * Chips/Input — Standard
 *
 * 목적: 사용자 입력 정보를 이산적 태그(칩)로 표시 + 개별 삭제
 * 기능: ListRenderMixin으로 칩 항목 렌더링 + 클릭/삭제 이벤트
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
        container: '.input-chip__list',
        template:  '#input-chip-item-template',
        chipid:    '.input-chip__item',
        label:     '.input-chip__label',
        removeBtn: '.input-chip__remove'
    },
    datasetAttrs: {
        chipid: 'chipid'
    }
});

// ======================
// 2. 구독 연결
// ======================

this.subscriptions = {
    inputChipItems: [this.listRender.renderData]
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
        [this.listRender.cssSelectors.chipid]:    '@inputChipClicked',
        [this.listRender.cssSelectors.removeBtn]: '@inputChipRemoved'
    }
};

bindEvents(this, this.customEvents);
