/**
 * FABMenu — Standard
 *
 * 목적: FAB 트리거로 열리는 관련 액션 메뉴의 토글/항목 클릭 이벤트를 발행한다
 * 기능:
 *   1. 메뉴 토글 이벤트 (@fabMenuToggled) — 페이지가 .fab-menu의 .is-open을 토글
 *   2. 메뉴 항목 렌더링 (ListRenderMixin)
 *   3. 항목 클릭 이벤트 (@fabMenuItemClicked)
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
        menu:      '.fab-menu',
        trigger:   '.fab-menu__trigger',
        container: '.fab-menu__list',
        template:  '#fab-menu-item-template',
        item:      '.fab-menu__item',
        id:        '.fab-menu__item',
        icon:      '.fab-menu__item-icon',
        label:     '.fab-menu__item-label'
    },
    datasetAttrs: {
        id: 'id'
    }
});

// ======================
// 2. 구독 연결
// ======================

this.subscriptions = {
    fabMenuItems: [this.listRender.renderData]
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
        [this.listRender.cssSelectors.trigger]: '@fabMenuToggled',
        [this.listRender.cssSelectors.item]:    '@fabMenuItemClicked'
    }
};

bindEvents(this, this.customEvents);
