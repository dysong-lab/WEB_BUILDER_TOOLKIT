/**
 * ExtendedFABs — Standard
 *
 * 목적: Extended FAB의 아이콘/라벨을 표시하고 클릭 이벤트를 발행한다
 * 기능: FieldRenderMixin으로 아이콘/라벨 렌더링 + 클릭 이벤트
 *
 * Mixin: FieldRenderMixin
 */
const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;
const { each, go } = fx;

// ======================
// 1. MIXIN 적용
// ======================

applyFieldRenderMixin(this, {
    cssSelectors: {
        extendedFab: '.extended-fab',
        icon:        '.extended-fab__icon',
        label:       '.extended-fab__label'
    }
});

// ======================
// 2. 구독 연결
// ======================

this.subscriptions = {
    extendedFabInfo: [this.fieldRender.renderData]
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
        [this.fieldRender.cssSelectors.extendedFab]: '@extendedFabClicked'
    }
};

bindEvents(this, this.customEvents);
