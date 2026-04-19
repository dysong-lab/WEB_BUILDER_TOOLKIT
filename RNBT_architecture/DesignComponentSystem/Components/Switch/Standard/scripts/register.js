/**
 * Switch — Standard
 *
 * 목적: 독립 on/off 토글 목록 (bi-state: true / false)
 * 기능: ListRenderMixin으로 스위치 항목 렌더링 + 클릭 이벤트
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
        container: '.switch__list',
        template:  '#switch-item-template',
        switchid:  '.switch__item',
        checked:   '.switch__item',
        disabled:  '.switch__item',
        label:     '.switch__label'
    },
    itemKey: 'switchid',
    datasetAttrs: {
        switchid: 'switchid',
        checked:  'checked',
        disabled: 'disabled'
    }
});

// ======================
// 2. 구독 연결
// ======================

this.subscriptions = {
    switchItems: [this.listRender.renderData]
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
        [this.listRender.cssSelectors.switchid]: '@switchClicked'
    }
};

bindEvents(this, this.customEvents);
