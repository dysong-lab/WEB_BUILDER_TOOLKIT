/**
 * PrimaryTabs 컴포넌트
 *
 * 목적: 탭 네비게이션을 제공한다
 * 기능: ListRenderMixin으로 탭 항목을 렌더링하고,
 *       itemKey로 활성 탭 상태를 관리한다
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
        container: '.primary-tabs__list',
        template:  '#primary-tab-item-template',
        tabid:     '.primary-tabs__tab',
        active:    '.primary-tabs__tab',
        icon:      '.primary-tabs__tab-icon',
        label:     '.primary-tabs__tab-label'
    },
    itemKey: 'tabid',
    datasetAttrs: {
        tabid:  'tabid',
        active: 'active'
    }
});

// ======================
// 2. 구독 연결
// ======================

this.subscriptions = {
    tabItems: [this.listRender.renderData]
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
        [this.listRender.cssSelectors.tabid]: '@tabClicked'
    }
};

bindEvents(this, this.customEvents);
