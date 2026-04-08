/**
 * NavigationDrawer — Standard
 *
 * 목적: 메뉴 항목을 표시하고 활성 상태를 관리한다
 * 기능: ListRenderMixin으로 메뉴 항목 렌더링 + 드로어 열기/닫기
 *
 * Mixin: ListRenderMixin
 */
const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;
const { each, go } = fx;

// ======================
// 1. MIXIN 적용 + 자체 메서드 정의
// ======================

applyListRenderMixin(this, {
    cssSelectors: {
        container: '.nav-drawer__list',
        template:  '#nav-drawer-item-template',
        menuid:    '.nav-drawer__item',
        active:    '.nav-drawer__item',
        icon:      '.nav-drawer__icon',
        label:     '.nav-drawer__label',
        badge:     '.nav-drawer__badge'
    },
    itemKey: 'menuid',
    datasetAttrs: {
        menuid: 'menuid',
        active: 'active'
    }
});

// 드로어 열기/닫기 커스텀 메서드
this._drawerSelector = '.nav-drawer';

this.drawerOpen = function() {
    const drawer = this.appendElement.querySelector(this._drawerSelector);
    if (drawer) drawer.setAttribute('data-open', 'true');
};

this.drawerClose = function() {
    const drawer = this.appendElement.querySelector(this._drawerSelector);
    if (drawer) drawer.setAttribute('data-open', 'false');
};

this.drawerToggle = function() {
    const drawer = this.appendElement.querySelector(this._drawerSelector);
    const isOpen = drawer?.getAttribute('data-open') === 'true';
    if (isOpen) { this.drawerClose(); } else { this.drawerOpen(); }
};

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
        [this.listRender.cssSelectors.menuid]: '@menuItemClicked'
    }
};

bindEvents(this, this.customEvents);
