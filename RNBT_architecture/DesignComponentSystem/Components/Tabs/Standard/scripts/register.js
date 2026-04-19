/**
 * Tabs — Standard (Primary Tabs)
 *
 * 목적: 콘텐츠 뷰 간 전환을 위한 Primary Tabs (상단 + active indicator)
 * 기능: ListRenderMixin으로 탭 항목 렌더링 + 활성 상태 관리
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
        container: '.tabs__list',
        template:  '#tabs-item-template',
        tabid:     '.tabs__item',
        active:    '.tabs__item',
        icon:      '.tabs__icon',
        label:     '.tabs__label',
        badge:     '.tabs__badge'
    },
    itemKey: 'tabid',
    datasetAttrs: {
        tabid:  'tabid',
        active: 'active'
    }
});

// ======================
// 2. 구독 연결
// ======================

this.subscriptions = {
    tabItems: [this.listRender.renderData]
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
        [this.listRender.cssSelectors.tabid]: '@tabClicked'
    }
};

bindEvents(this, this.customEvents);
