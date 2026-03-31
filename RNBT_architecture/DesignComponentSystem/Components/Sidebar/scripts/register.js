/**
 * Sidebar 컴포넌트
 *
 * 목적: 데이터를 보여주고, 개별 항목의 상태를 변경한다
 * 기능: ListRenderMixin으로 메뉴 항목을 렌더링하고 활성 상태를 관리한다
 *
 * Mixin: ListRenderMixin
 */


// ── 1. Mixin 적용 ──
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

// ── 2. 구독 ──
this.subscriptions = {
    menuItems: [this.listRender.renderData]
};

go(
    Object.entries(this.subscriptions),
    each(([topic, handlers]) =>
        each(handler => GlobalDataPublisher.subscribe(topic, this, handler), handlers)
    )
);

// ── 3. 이벤트 ──
this.customEvents = {
    click: {
        [this.listRender.cssSelectors.menuid]: '@menuItemClicked'
    }
};

Wkit.bindEvents(this, this.customEvents);
