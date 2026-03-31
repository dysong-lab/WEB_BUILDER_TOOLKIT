/**
 * Header — Dashboard DarkTech
 *
 * 목적: 페이지 상단 정보를 표시한다
 * 기능: FieldRenderMixin으로 텍스트와 상태를 렌더링한다
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
        title:    '.header__title',
        userName: '.header__user-name',
        time:     '.header__time'
    }
});

// ======================
// 2. 구독 연결
// ======================

this.subscriptions = {
    dashboard_headerInfo: [this.fieldRender.renderData]
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

this.customEvents = {};
bindEvents(this, this.customEvents);
