/**
 * NavigationSidebar 컴포넌트
 *
 * 목적: 항상 표시되는 세로 탐색 메뉴를 제공한다
 * 기능: ListRenderMixin으로 메뉴 항목을 렌더링하고 활성 상태를 관리한다
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
        container: '.nav-sidebar__list',
        template:  '#nav-sidebar-item-template',
        menuid:    '.nav-sidebar__item',
        active:    '.nav-sidebar__item',
        icon:      '.nav-sidebar__item-icon',
        label:     '.nav-sidebar__item-label',
        badge:     '.nav-sidebar__item-badge'
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
    menuItems: [this.listRender.renderData]
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
        [this.listRender.cssSelectors.menuid]: '@menuItemClicked'
    }
};

bindEvents(this, this.customEvents);
