/**
 * SegmentedButtons — Standard
 *
 * 목적: 옵션 선택, 뷰 전환, 요소 정렬을 위한 연결된 버튼 집합
 * 기능: ListRenderMixin으로 세그먼트 렌더링 + 클릭 이벤트
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
        container: '.segmented-button__list',
        template:  '#segmented-button-item-template',
        segmentid: '.segmented-button__item',
        selected:  '.segmented-button__item',
        label:     '.segmented-button__label',
        icon:      '.segmented-button__icon'
    },
    itemKey: 'segmentid',
    datasetAttrs: {
        segmentid: 'segmentid',
        selected:  'selected'
    }
});

// ======================
// 2. 구독 연결
// ======================

this.subscriptions = {
    segmentedButtonItems: [this.listRender.renderData]
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
        [this.listRender.cssSelectors.segmentid]: '@segmentClicked'
    }
};

bindEvents(this, this.customEvents);
