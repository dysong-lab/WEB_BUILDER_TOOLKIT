/**
 * Cards — StatusCard
 *
 * 목적: 시스템 정보와 상태를 카드 형태로 표시한다
 * 기능: FieldRenderMixin으로 카드 필드를 렌더링하고 카드 클릭을 페이지 이벤트로 전달한다
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
        card: '.status-card',
        name: '.status-card__name',
        status: '.status-card__status',
        statusLabel: '.status-card__status',
        version: '.status-card__version',
        uptime: '.status-card__uptime'
    },
    datasetAttrs: {
        status: 'status'
    }
});

// ======================
// 2. 구독 연결
// ======================

this.subscriptions = {
    systemInfo: [this.fieldRender.renderData]
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
        [this.fieldRender.cssSelectors.card]: '@statusCardClicked'
    }
};
bindEvents(this, this.customEvents);
