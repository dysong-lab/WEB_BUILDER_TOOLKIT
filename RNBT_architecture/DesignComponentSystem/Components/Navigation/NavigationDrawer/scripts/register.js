/**
 * NavigationDrawer 컴포넌트
 *
 * 목적: 슬라이드로 열고 닫는 탐색 메뉴를 제공한다
 * 기능: ListRenderMixin으로 메뉴 항목을 렌더링하고,
 *       data-drawer-state 속성으로 열기/닫기 상태를 관리한다
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
        container: '.nav-drawer__list',
        template:  '#nav-drawer-item-template',
        menuid:    '.nav-drawer__item',
        active:    '.nav-drawer__item',
        icon:      '.nav-drawer__item-icon',
        label:     '.nav-drawer__item-label',
        drawer:    '.nav-drawer',
        overlay:   '.nav-drawer__overlay',
        closeBtn:  '.nav-drawer__close'
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
        [this.listRender.cssSelectors.menuid]:   '@menuItemClicked',
        [this.listRender.cssSelectors.closeBtn]: '@drawerClose',
        [this.listRender.cssSelectors.overlay]:  '@drawerClose'
    }
};

bindEvents(this, this.customEvents);
