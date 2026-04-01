/**
 * TopAppBar 컴포넌트
 *
 * 목적: 타이틀과 액션 버튼을 포함한 상단 바를 표시한다
 * 기능: FieldRenderMixin으로 타이틀/뱃지를 렌더링하고 액션 이벤트를 발행한다
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
        title:         '.top-app-bar__title',
        navIcon:       '.top-app-bar__nav-icon',
        notifications: '.top-app-bar__action[data-action="notifications"]'
    },
    datasetAttrs: {
        notifications: 'badge-count'
    }
});

// ======================
// 2. 구독 연결
// ======================

this.subscriptions = {
    appBarInfo: [this.fieldRender.renderData]
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
        [this.fieldRender.cssSelectors.navIcon]: '@menuToggle'
    }
};
bindEvents(this, this.customEvents);
