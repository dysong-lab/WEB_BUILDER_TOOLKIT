/**
 * NavigationBar — Standard
 *
 * 목적: 소형 디바이스에서 최상위 목적지 3~5개 사이를 전환한다
 * 기능: ListRenderMixin으로 목적지 항목 렌더링 + 활성 상태 관리
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
        container: '.nav-bar__list',
        template:  '#nav-bar-item-template',
        menuid:    '.nav-bar__item',
        active:    '.nav-bar__item',
        icon:      '.nav-bar__icon',
        label:     '.nav-bar__label',
        badge:     '.nav-bar__badge'
    },
    itemKey: 'menuid',
    datasetAttrs: {
        menuid: 'menuid',
        active: 'active'
    }
});

// ======================
// 2. 구독 연결
// ======================

this.subscriptions = {
    navigationBar: [this.listRender.renderData]
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
        [this.listRender.cssSelectors.menuid]: '@navBarItemClicked'
    }
};

bindEvents(this, this.customEvents);
