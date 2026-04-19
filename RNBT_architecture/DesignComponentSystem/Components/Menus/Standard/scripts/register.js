/**
 * Menus — Standard
 *
 * 목적: 임시 표면에 선택 항목 목록을 표시
 * 기능: ListRenderMixin으로 메뉴 항목 렌더링 + 항목 클릭 이벤트
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
        container: '.menu__items',
        template:  '#menu-item-template',
        menuid:    '.menu__item',
        disabled:  '.menu__item',
        divider:   '.menu__item',
        leading:   '.menu__leading',
        label:     '.menu__label',
        trailing:  '.menu__trailing'
    },
    datasetAttrs: {
        menuid:   'menuid',
        disabled: 'disabled',
        divider:  'divider'
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
