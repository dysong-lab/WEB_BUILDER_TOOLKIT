/**
 * ButtonGroups — Standard
 *
 * 목적: 버튼 항목을 그룹으로 표시하고 클릭 이벤트를 발행한다
 * 기능: ListRenderMixin으로 버튼 항목 렌더링 + 클릭 이벤트
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
        container: '.btn-group__list',
        template:  '#btn-group-item-template',
        buttonid:  '.btn-group__item',
        selected:  '.btn-group__item',
        label:     '.btn-group__label',
        icon:      '.btn-group__icon'
    },
    itemKey: 'buttonid',
    datasetAttrs: {
        buttonid: 'buttonid',
        selected: 'selected'
    }
});

// ======================
// 2. 구독 연결
// ======================

this.subscriptions = {
    buttonGroupItems: [this.listRender.renderData]
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
        [this.listRender.cssSelectors.buttonid]: '@buttonClicked'
    }
};

bindEvents(this, this.customEvents);
