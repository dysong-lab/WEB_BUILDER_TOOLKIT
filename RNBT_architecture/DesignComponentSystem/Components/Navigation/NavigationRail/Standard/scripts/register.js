/**
 * NavigationRail — Standard
 *
 * 목적: 중형 디바이스에서 세로 레일로 UI 뷰 전환을 지원한다
 * 기능: ListRenderMixin으로 내비게이션 항목 렌더링 + 활성 상태 관리
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
        container: '.nav-rail__list',
        template:  '#nav-rail-item-template',
        menuid:    '.nav-rail__item',
        active:    '.nav-rail__item',
        icon:      '.nav-rail__icon',
        label:     '.nav-rail__label'
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
    navigationMenu: [this.listRender.renderData]
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
        [this.listRender.cssSelectors.menuid]: '@navItemClicked'
    }
};

bindEvents(this, this.customEvents);
