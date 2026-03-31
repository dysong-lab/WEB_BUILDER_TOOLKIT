/**
 * Sidebar 컴포넌트
 *
 * 목적: 메뉴 항목을 표시하고 활성 상태를 관리한다
 * 기능: ListRenderMixin으로 메뉴 항목을 렌더링하고 상태를 전환한다
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
        container: '.sidebar__menu',
        template:  '#sidebar-menu-item-template',
        menuid:    '.sidebar__item',
        active:    '.sidebar__item',
        icon:      '.sidebar__item-icon',
        label:     '.sidebar__item-label',
        badge:     '.sidebar__item-badge'
    },
    itemKey: 'menuid',
    datasetAttrs: {
        menuid:  'menuid',
        active:  'active'
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
