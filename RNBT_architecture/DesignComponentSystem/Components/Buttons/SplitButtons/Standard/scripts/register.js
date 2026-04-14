/**
 * SplitButtons — Standard
 *
 * 목적: 주 액션 버튼 + 관련 옵션 메뉴를 여는 분할 버튼
 * 기능: FieldRenderMixin으로 리딩 액션 렌더링 + ListRenderMixin으로 메뉴 항목 렌더링 + 클릭/토글 이벤트
 *
 * Mixin: FieldRenderMixin + ListRenderMixin
 */
const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;
const { each, go } = fx;

// ======================
// 1. MIXIN 적용 — 반드시 먼저
// ======================

applyFieldRenderMixin(this, {
    cssSelectors: {
        action:     '.split-button__action',
        actionIcon: '.split-button__action-icon',
        label:      '.split-button__action-label'
    }
});

applyListRenderMixin(this, {
    cssSelectors: {
        container: '.split-button__menu',
        template:  '#split-button-menu-item-template',
        menuid:    '.split-button__menu-item',
        selected:  '.split-button__menu-item',
        menuLabel: '.split-button__menu-label',
        menuIcon:  '.split-button__menu-icon'
    },
    itemKey: 'menuid',
    datasetAttrs: {
        menuid:   'menuid',
        selected: 'selected'
    }
});

// ======================
// 2. 구독 연결
// ======================

this.subscriptions = {
    splitButtonAction:    [this.fieldRender.renderData],
    splitButtonMenuItems: [this.listRender.renderData]
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
        [this.fieldRender.cssSelectors.action]: '@splitActionClicked',
        '.split-button__trigger':               '@splitMenuToggled',
        [this.listRender.cssSelectors.menuid]:  '@splitMenuItemClicked'
    }
};

bindEvents(this, this.customEvents);
